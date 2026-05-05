import unittest

from fastapi.testclient import TestClient

from app.main import app
from app.services.cloud_discovery.normalizer import normalize_cloud_discovery


class CloudDiscoveryTests(unittest.TestCase):
    def test_aws_mock_discovery_normalizes_to_cloud_data(self):
        result = normalize_cloud_discovery(
            provider="aws",
            resource_type="s3_bucket",
            resource_id="customer-records-prod",
            raw_discovery={
                "region": "ap-northeast-2",
                "encryption": {"default_sse_enabled": True},
                "bucket_policy": {"secure_transport_required": True},
                "public_access_block": {
                    "BlockPublicAcls": True,
                    "IgnorePublicAcls": True,
                    "BlockPublicPolicy": True,
                    "RestrictPublicBuckets": True,
                },
                "tags": {"data_type": "customer_records"},
            },
        )

        self.assertEqual(result.normalized_cloud_data, result.normalized_aws_data)
        self.assertEqual(result.normalized_cloud_data["current_region"], "ap-northeast-2")
        self.assertTrue(result.normalized_cloud_data["encryption_at_rest"])
        self.assertTrue(result.normalized_cloud_data["encryption_at_rest_effective"])
        self.assertTrue(result.normalized_cloud_data["bucket_default_encryption_configured"])
        self.assertTrue(result.normalized_cloud_data["encryption_in_transit"])
        self.assertTrue(result.normalized_cloud_data["access_control_in_place"])
        self.assertIsNone(result.normalized_cloud_data["contains_sensitive_data"])
        self.assertEqual(result.normalized_cloud_data["data_type"], "customer_records")
        self.assertIsNone(result.normalized_cloud_data["uses_processor"])
        self.assertTrue(result.warnings)

    def test_azure_mock_discovery_normalizes_to_cloud_data_shape(self):
        result = normalize_cloud_discovery(
            provider="azure",
            resource_type="storage_account",
            resource_id="customerrecordsprod",
            raw_discovery={
                "location": "koreacentral",
                "encryption": {"services": {"blob": {"enabled": True}}},
                "supports_https_traffic_only": True,
                "minimum_tls_version": "TLS1_2",
                "public_network_access": False,
                "tags": {"data_type": "customer_records"},
            },
        )

        self.assertEqual(result.normalized_cloud_data["current_region"], "koreacentral")
        self.assertTrue(result.normalized_cloud_data["encryption_at_rest"])
        self.assertTrue(result.normalized_cloud_data["encryption_in_transit"])
        self.assertTrue(result.normalized_cloud_data["access_control_in_place"])
        self.assertEqual(result.normalized_cloud_data["data_type"], "customer_records")

    def test_unconfirmed_sensitive_data_stays_null_with_warning(self):
        result = normalize_cloud_discovery(
            provider="aws",
            resource_type="s3_bucket",
            resource_id="unknown-sensitive",
            raw_discovery={"region": "eu-central-1"},
        )

        self.assertIsNone(result.normalized_cloud_data["contains_sensitive_data"])
        self.assertIn("contains_sensitive_data", result.warnings[0])
        evidence = [
            item for item in result.evidence if item.field == "contains_sensitive_data"
        ][0]
        self.assertEqual(evidence.confidence, "unknown")

    def test_existing_evaluate_api_still_accepts_aws_data(self):
        client = TestClient(app)
        response = client.post(
            "/api/v1/evaluate",
            json={
                "pack_id": "gdpr",
                "aws_data": {
                    "current_region": "eu-central-1",
                    "encryption_at_rest": True,
                    "data_type": "customer_records",
                    "contains_sensitive_data": None,
                    "uses_processor": None,
                    "encryption_in_transit": True,
                    "access_control_in_place": True,
                },
                "policy_data": {
                    "dataset_name": "api-compat-dataset",
                    "data_subject_region": "EU",
                    "processing_purpose_defined": True,
                    "data_minimized": True,
                    "retention_period_defined": True,
                    "lawful_basis": None,
                    "target_region": "us-east-1",
                    "derogation_used": None,
                },
                "schema_file_name": "input_schema_v2.json",
                "pack_file_name": "gdpr_pack_v3.json",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("final_decision", response.json())

    def test_cloud_discovery_aws_endpoint_returns_normalized_payload(self):
        client = TestClient(app)
        response = client.post(
            "/api/v1/cloud-discovery/aws",
            json={
                "resource_type": "s3_bucket",
                "resource_id": "customer-records-prod",
                "mode": "mock",
                "sample_discovery": {
                    "region": "ap-northeast-2",
                    "encryption": {"default_sse_enabled": True},
                },
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["provider"], "aws")
        self.assertEqual(
            body["normalized_cloud_data"]["current_region"],
            "ap-northeast-2",
        )
        self.assertEqual(
            body["normalized_aws_data"]["current_region"],
            "ap-northeast-2",
        )


if __name__ == "__main__":
    unittest.main()
