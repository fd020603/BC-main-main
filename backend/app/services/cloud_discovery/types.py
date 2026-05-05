from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, Field, model_validator


Provider = Literal["aws", "azure"]
Confidence = Literal["high", "medium", "low", "unknown"]


NORMALIZED_FIELDS = (
    "current_region",
    "encryption_at_rest",
    "encryption_at_rest_effective",
    "bucket_default_encryption_configured",
    "kms_encryption_configured",
    "encryption_source",
    "encryption_in_transit",
    "access_control_in_place",
    "contains_sensitive_data",
    "data_type",
    "uses_processor",
)


class EvidenceItem(BaseModel):
    field: str
    value: Any
    source: str
    confidence: Confidence = "unknown"


class NormalizedCloudDiscovery(BaseModel):
    provider: Provider
    resource_type: str
    resource_id: str
    normalized_cloud_data: Dict[str, Any] = Field(
        description="Cloud-discovered technical inputs shaped for evaluation technical data."
    )
    normalized_aws_data: Dict[str, Any] = Field(
        description="Deprecated compatibility alias for normalized_cloud_data."
    )
    evidence: list[EvidenceItem] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
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
