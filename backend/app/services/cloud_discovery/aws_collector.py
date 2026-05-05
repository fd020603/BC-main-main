import os
from typing import Any, Dict


def build_mock_aws_s3_discovery(
    bucket_name: str,
    region: str | None = None,
    sample_discovery: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    if sample_discovery is not None:
        return sample_discovery

    return {
        "bucket_name": bucket_name,
        "region": region,
        "encryption": {"default_sse_enabled": None},
        "bucket_policy": {"secure_transport_required": None},
        "public_access_block": {},
        "tags": {},
    }


def collect_aws_s3_bucket_live(
    bucket_name: str,
    region: str | None = None,
) -> Dict[str, Any]:
    try:
        import boto3  # type: ignore[import-not-found]
        from botocore.exceptions import ClientError  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError(
            "AWS live discovery requires optional dependencies. Install boto3 "
            "and configure AWS_PROFILE/AWS_REGION or server-side AWS credentials."
        ) from exc

    s3 = boto3.client("s3", region_name=region or os.getenv("AWS_REGION") or None)
    discovered: Dict[str, Any] = {
        "bucket_name": bucket_name,
        "region": None,
        "encryption": {"default_sse_enabled": None},
        "bucket_policy": {"secure_transport_required": None},
        "public_access_block": {},
        "tags": {},
    }

    location = s3.get_bucket_location(Bucket=bucket_name)
    discovered["region"] = location.get("LocationConstraint") or "us-east-1"

    try:
        encryption = s3.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption.get("ServerSideEncryptionConfiguration", {}).get(
            "Rules", []
        )
        discovered["encryption"]["default_sse_enabled"] = bool(rules)
    except ClientError:
        discovered["encryption"]["default_sse_enabled"] = False

    try:
        block = s3.get_public_access_block(Bucket=bucket_name)
        discovered["public_access_block"] = block.get("PublicAccessBlockConfiguration", {})
    except ClientError:
        discovered["public_access_block"] = {}

    try:
        tag_response = s3.get_bucket_tagging(Bucket=bucket_name)
        discovered["tags"] = {
            item["Key"]: item["Value"] for item in tag_response.get("TagSet", [])
        }
    except ClientError:
        discovered["tags"] = {}

    try:
        policy = s3.get_bucket_policy(Bucket=bucket_name)
        policy_text = policy.get("Policy", "")
        discovered["bucket_policy"]["secure_transport_required"] = (
            "aws:SecureTransport" in policy_text and '"false"' in policy_text
        )
    except ClientError:
        discovered["bucket_policy"]["secure_transport_required"] = None

    return discovered
