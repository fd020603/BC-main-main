from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, Field, SecretStr, model_validator


class AwsConnectionStartRequest(BaseModel):
    connection_name: str = Field(default="demo")
    region: str = Field(default="ap-northeast-2")


class AwsConnectionStartResponse(BaseModel):
    connection_id: str
    external_id: str
    cloudformation_url: str


class AwsConnectionCompleteRequest(BaseModel):
    connection_id: str
    role_arn: str


class AwsConnectionCompleteResponse(BaseModel):
    connection_id: str
    status: Literal["connected"]
    role_arn: str
    caller_identity: Dict[str, Any]


class AwsS3CheckRequest(BaseModel):
    connection_id: str
    bucket_name: str
    region: Optional[str] = None


class AwsS3ApplyRecommendedSettingsRequest(BaseModel):
    connection_id: str
    bucket_name: str
    region: Optional[str] = None
    data_type: Optional[str] = None
    contains_sensitive_data: Optional[bool] = None
    uses_processor: Optional[bool] = None


class AWSAccessKeyS3CheckRequest(BaseModel):
    access_key_id: str
    secret_access_key: SecretStr
    session_token: Optional[SecretStr] = None
    region: Optional[str] = None
    bucket_name: str


class AWSAccessKeyS3ApplyRequest(BaseModel):
    access_key_id: str
    secret_access_key: SecretStr
    session_token: Optional[SecretStr] = None
    region: Optional[str] = None
    bucket_name: str
    data_type: Optional[str] = None
    contains_sensitive_data: Optional[bool] = None
    uses_processor: Optional[bool] = None


class AwsS3CheckResponse(BaseModel):
    provider: Literal["aws"] = "aws"
    resource_type: Literal["s3_bucket"] = "s3_bucket"
    resource_id: str
    normalized_cloud_data: Dict[str, Any]
    normalized_aws_data: Dict[str, Any]
    missing_items: list[str] = []
    warnings: list[str] = []
    evidence: list[Dict[str, Any]] = []
    raw_discovery: Dict[str, Any] = {}

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
