from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class MergeSampleRequest(BaseModel):
    aws_file_name: str = "aws_discovered.sample.json"
    policy_file_name: str = "policy_context.sample.yaml"
    pack_id: str = "gdpr"
    schema_file_name: Optional[str] = None


class MergeRequest(BaseModel):
    pack_id: str = Field(
        default="gdpr",
        description="Registered policy pack identifier",
    )
    aws_data: Dict[str, Any] = Field(
        ...,
        description="Auto or semi-auto collected cloud input data",
    )
    policy_data: Dict[str, Any] = Field(
        ...,
        description="Manual legal or business context input data",
    )
    schema_file_name: Optional[str] = Field(
        default=None,
        description="Optional schema file override used to validate and merge inputs",
    )


class MergeResponse(BaseModel):
    message: str
    merged_input: dict
