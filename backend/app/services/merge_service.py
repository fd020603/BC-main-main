from typing import Any, Dict, List

from app.services.derived_fields import build_derived_fields


def flatten_schema_fields(schema: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    groups = schema.get("groups", {})

    field_map: Dict[str, Dict[str, Any]] = {}

    collected_fields = groups.get("collected_fields", {})
    auto_fields = collected_fields.get("auto", {})
    semi_auto_fields = collected_fields.get("semi_auto", {})
    manual_fields = groups.get("manual_context_fields", {})
    derived_fields = groups.get("derived_fields", {})

    field_map.update(auto_fields)
    field_map.update(semi_auto_fields)
    field_map.update(manual_fields)
    field_map.update(derived_fields)

    return field_map


def is_nullable_field(meta: Dict[str, Any]) -> bool:
    field_type = meta.get("type")

    if isinstance(field_type, list) and "null" in field_type:
        return True

    if isinstance(field_type, str) and "null" in field_type:
        return True

    return False


def validate_required_fields(
    schema: Dict[str, Any],
    merged_data: Dict[str, Any],
) -> List[str]:
    field_map = flatten_schema_fields(schema)
    missing_fields: List[str] = []

    for field_name, meta in field_map.items():
        if meta.get("required") is not True:
            continue

        # 아예 키가 없으면 missing
        if field_name not in merged_data:
            missing_fields.append(field_name)
            continue

        value = merged_data.get(field_name)

        # nullable 필드는 None 허용
        if value is None and not is_nullable_field(meta):
            missing_fields.append(field_name)

    return missing_fields


def merge_inputs(
    schema: Dict[str, Any],
    aws_data: Dict[str, Any],
    policy_data: Dict[str, Any],
) -> Dict[str, Any]:
    merged_data: Dict[str, Any] = {}

    merged_data.update(aws_data)
    merged_data.update(policy_data)

    derived = build_derived_fields(
        merged_data=merged_data,
        schema=schema,
    )
    merged_data.update(derived)

    missing_fields = validate_required_fields(schema, merged_data)
    if missing_fields:
        raise ValueError(
            f"Required fields missing after merge: {', '.join(missing_fields)}"
        )

    return merged_data
