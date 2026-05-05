import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.cloud_connections import AWSAccessKeyS3CheckRequest
from app.services.cloud_discovery.aws_s3_review_service import (
    build_s3_client_from_access_keys,
    collect_s3_discovery_with_client,
)


class FakeS3Client:
    def get_bucket_location(self, Bucket):
        return {"LocationConstraint": "ap-northeast-2"}

    def get_bucket_encryption(self, Bucket):
        return {
            "ServerSideEncryptionConfiguration": {
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            }
        }

    def get_public_access_block(self, Bucket):
        return {
            "PublicAccessBlockConfiguration": {
                "BlockPublicAcls": True,
                "IgnorePublicAcls": True,
                "BlockPublicPolicy": True,
                "RestrictPublicBuckets": True,
            }
        }

    def get_bucket_tagging(self, Bucket):
        return {
            "TagSet": [
                {"Key": "data_type", "Value": "customer_records"},
                {"Key": "contains_sensitive_data", "Value": "false"},
                {"Key": "uses_processor", "Value": "true"},
            ]
        }

    def get_bucket_policy(self, Bucket):
        return {
            "Policy": (
                '{"Version":"2012-10-17","Statement":[{"Effect":"Deny",'
                '"Condition":{"Bool":{"aws:SecureTransport":"false"}}}]}'
            )
        }


class CloudConnectionTests(unittest.TestCase):
    def test_aws_connection_start_returns_external_id_and_console_url(self):
        client = TestClient(app)
        with patch(
            "app.api.cloud_connections.create_aws_connection",
            return_value={
                "connection_id": "conn-test",
                "external_id": "external-test",
            },
        ):
            response = client.post(
                "/api/v1/cloud-connections/aws/start",
                json={"connection_name": "demo", "region": "ap-northeast-2"},
            )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIn("connection_id", body)
        self.assertIn("external_id", body)
        self.assertIn("cloudformation", body["cloudformation_url"])
        self.assertIn("param_ExternalId", body["cloudformation_url"])

    def test_s3_discovery_extracts_tags_and_security_settings(self):
        raw = collect_s3_discovery_with_client(FakeS3Client(), "demo-bucket")

        self.assertEqual(raw["region"], "ap-northeast-2")
        self.assertTrue(raw["encryption"]["default_sse_enabled"])
        self.assertTrue(raw["bucket_policy"]["secure_transport_required"])
        self.assertEqual(raw["data_type"], "customer_records")
        self.assertFalse(raw["contains_sensitive_data"])
        self.assertTrue(raw["uses_processor"])

    def test_access_key_schema_masks_secret_values(self):
        request = AWSAccessKeyS3CheckRequest(
            access_key_id="AKIATEST",
            secret_access_key="SUPERSECRET",
            session_token="SESSIONSECRET",
            bucket_name="demo-bucket",
        )

        self.assertNotIn("SUPERSECRET", repr(request))
        self.assertNotIn("SESSIONSECRET", request.model_dump_json())
        self.assertIn("**********", request.model_dump_json())

    def test_build_s3_client_from_access_keys_uses_boto3_session(self):
        class FakeSession:
            captured = {}

            def __init__(self, **kwargs):
                FakeSession.captured = kwargs

            def client(self, service_name):
                return {"service": service_name}

        class FakeBoto3:
            Session = FakeSession

        client = build_s3_client_from_access_keys(
            access_key_id="AKIATEST",
            secret_access_key="SUPERSECRET",
            session_token="TOKEN",
            region="ap-northeast-2",
            boto3_module=FakeBoto3,
        )

        self.assertEqual(client, {"service": "s3"})
        self.assertEqual(FakeSession.captured["aws_access_key_id"], "AKIATEST")
        self.assertEqual(FakeSession.captured["region_name"], "ap-northeast-2")

    def test_check_with_keys_api_matches_s3_check_response_shape(self):
        expected = {
            "provider": "aws",
            "resource_type": "s3_bucket",
            "resource_id": "demo-bucket",
            "normalized_aws_data": {
                "current_region": "ap-northeast-2",
                "encryption_at_rest": True,
                "encryption_in_transit": True,
                "access_control_in_place": True,
                "contains_sensitive_data": False,
                "data_type": "customer_records",
                "uses_processor": True,
            },
            "missing_items": [],
            "warnings": [],
            "evidence": [],
            "raw_discovery": {},
        }

        with patch(
            "app.api.cloud_discovery.check_s3_bucket_with_access_keys",
            return_value=expected,
        ) as mocked:
            response = TestClient(app).post(
                "/api/v1/cloud-discovery/aws/s3/check-with-keys",
                json={
                    "access_key_id": "AKIATEST",
                    "secret_access_key": "SUPERSECRET",
                    "region": "ap-northeast-2",
                    "bucket_name": "demo-bucket",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["normalized_aws_data"]["data_type"], "customer_records")
        mocked.assert_called_once()
        self.assertEqual(mocked.call_args.kwargs["secret_access_key"], "SUPERSECRET")

    def test_apply_with_keys_api_returns_recheck_result(self):
        expected = {
            "provider": "aws",
            "resource_type": "s3_bucket",
            "resource_id": "demo-bucket",
            "normalized_aws_data": {
                "current_region": "ap-northeast-2",
                "encryption_at_rest": True,
                "encryption_in_transit": True,
                "access_control_in_place": True,
                "contains_sensitive_data": False,
                "data_type": "customer_records",
                "uses_processor": True,
            },
            "missing_items": [],
            "warnings": [],
            "evidence": [],
            "raw_discovery": {"applied": True},
        }

        with patch(
            "app.api.cloud_discovery.apply_recommended_s3_settings_with_access_keys",
            return_value=expected,
        ) as mocked:
            response = TestClient(app).post(
                "/api/v1/cloud-discovery/aws/s3/apply-with-keys",
                json={
                    "access_key_id": "AKIATEST",
                    "secret_access_key": "SUPERSECRET",
                    "region": "ap-northeast-2",
                    "bucket_name": "demo-bucket",
                    "data_type": "customer_records",
                    "contains_sensitive_data": False,
                    "uses_processor": True,
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["raw_discovery"], {"applied": True})
        mocked.assert_called_once()


if __name__ == "__main__":
    unittest.main()
