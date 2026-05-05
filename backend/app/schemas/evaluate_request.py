from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class EvaluateRequest(BaseModel):
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
        description="Optional schema file override used for validation and merge",
    )
    pack_file_name: Optional[str] = Field(
        default=None,
        description="Optional policy pack file override used for evaluation",
    )
