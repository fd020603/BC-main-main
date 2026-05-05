from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, Field, model_validator

from app.services.cloud_discovery.types import EvidenceItem, Provider


DiscoveryMode = Literal["mock", "sample", "live"]


class AwsDiscoveryRequest(BaseModel):
    resource_type: Literal["s3_bucket"] = "s3_bucket"
    resource_id: str = Field(..., description="S3 bucket name")
    region: Optional[str] = Field(default=None, description="Optional AWS region hint")
    mode: DiscoveryMode = Field(
        default="mock",
        description="mock/sample uses supplied discovery data; live requires optional AWS SDK.",
    )
    sample_discovery: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Raw AWS discovery payload to normalize in mock/sample mode.",
    )


class AzureDiscoveryRequest(BaseModel):
    resource_type: Literal["storage_account"] = "storage_account"
    resource_id: str = Field(..., description="Azure Storage Account name")
    subscription_id: Optional[str] = None
    resource_group: Optional[str] = None
    mode: DiscoveryMode = "mock"
    sample_discovery: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Raw Azure discovery payload to normalize in mock/sample mode.",
    )


class NormalizeDiscoveryRequest(BaseModel):
    provider: Provider
    resource_type: str
    resource_id: str
    raw_discovery: Dict[str, Any]


class CloudDiscoveryResponse(BaseModel):
    provider: Provider
    resource_type: str
    resource_id: str
    normalized_cloud_data: Dict[str, Any]
    normalized_aws_data: Dict[str, Any]
    evidence: list[EvidenceItem]
    warnings: list[str] = []
    raw_discovery: Optional[Dict[str, Any]] = None

    @model_validator(mode="before")
    @classmethod
    def sync_normalized_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            cloud_data = data.get("normalized_cloud_data")
            aws_data = data.get("normalized_aws_data")
            if cloud_data is None and aws_data is not None:
                data["normalized_cloud_data"] = aws_data
            if aws_data is None and cloud_data is not None:
                data["normalized_aws_data"] = cloud_data
        return data
