from typing import Any, Dict

from app.services.merge_service import merge_inputs
from app.services.pack_loader import load_input_schema


def build_merged_input_from_request(
    aws_data: Dict[str, Any],
    policy_data: Dict[str, Any],
    pack_id: str = "gdpr",
    schema_file_name: str | None = None,
) -> Dict[str, Any]:
    schema = load_input_schema(
        pack_id=pack_id,
        schema_file_name=schema_file_name,
    )

    return merge_inputs(
        schema=schema,
        aws_data=aws_data,
        policy_data=policy_data,
    )
