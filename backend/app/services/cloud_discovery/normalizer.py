from typing import Any, Dict

from app.services.cloud_discovery.types import (
    NORMALIZED_FIELDS,
    EvidenceItem,
    NormalizedCloudDiscovery,
    Provider,
)


SENSITIVE_WARNING = (
    "contains_sensitive_data cannot be confirmed without Macie/Purview/"
    "classification result or manual review."
)


def _lookup(data: Dict[str, Any], *paths: str) -> Any:
    for path in paths:
        current: Any = data
        found = True
        for part in path.split("."):
            if not isinstance(current, dict) or part not in current:
                found = False
                break
            current = current[part]
        if found:
            return current
    return None


def _as_bool(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "yes", "enabled", "on"}:
            return True
        if normalized in {"false", "no", "disabled", "off"}:
            return False
    return None


def _tags(data: Dict[str, Any]) -> Dict[str, Any]:
    tags = _lookup(data, "tags", "bucket.tags", "storage_account.tags")
    return tags if isinstance(tags, dict) else {}


def _tag_value(data: Dict[str, Any], *names: str) -> Any:
    tags = _tags(data)
    lower_tags = {str(key).lower(): value for key, value in tags.items()}
    for name in names:
        value = lower_tags.get(name.lower())
        if value is not None:
            return value
    return None


def _public_access_block_all_enabled(block: Any) -> bool | None:
    if not isinstance(block, dict):
        return None
    keys = (
        "BlockPublicAcls",
        "IgnorePublicAcls",
        "BlockPublicPolicy",
        "RestrictPublicBuckets",
    )
    values = [_as_bool(block.get(key)) for key in keys if key in block]
    if not values:
        return None
    return all(value is True for value in values)


def _azure_network_access_control(data: Dict[str, Any]) -> bool | None:
    public_network_access = _as_bool(_lookup(data, "public_network_access"))
    default_action = _lookup(data, "network_rule_set.default_action")
    allow_blob_public_access = _as_bool(_lookup(data, "allow_blob_public_access"))

    if public_network_access is False:
        return True
    if isinstance(default_action, str) and default_action.lower() == "deny":
        return True
    if allow_blob_public_access is False:
        return True
    if public_network_access is True and allow_blob_public_access is True:
        return False
    return None


def _append(
    evidence: list[EvidenceItem],
    output: Dict[str, Any],
    field: str,
    value: Any,
    source: str,
    confidence: str,
) -> None:
    output[field] = value
    evidence.append(
        EvidenceItem(
            field=field,
            value=value,
            source=source,
            confidence=confidence,  # type: ignore[arg-type]
        )
    )


def _normalize_aws(
    resource_type: str,
    resource_id: str,
    raw: Dict[str, Any],
) -> NormalizedCloudDiscovery:
    normalized = {field: None for field in NORMALIZED_FIELDS}
    evidence: list[EvidenceItem] = []
    warnings: list[str] = []

    region = _lookup(raw, "current_region", "region", "bucket.region", "LocationConstraint")
    _append(evidence, normalized, "current_region", region, "s3.get_bucket_location", "high" if region else "unknown")

    encryption = _as_bool(
        _lookup(
            raw,
            "encryption_at_rest",
            "encryption.effective",
            "encryption.default_sse_enabled",
            "bucket_encryption.enabled",
        )
    )
    _append(evidence, normalized, "encryption_at_rest", encryption, "s3.get_bucket_encryption_or_s3_baseline", "high" if encryption is not None else "unknown")
    _append(evidence, normalized, "encryption_at_rest_effective", encryption, "s3.get_bucket_encryption_or_s3_baseline", "high" if encryption is not None else "unknown")

    bucket_default_encryption = _as_bool(_lookup(raw, "encryption.default_sse_enabled"))
    _append(evidence, normalized, "bucket_default_encryption_configured", bucket_default_encryption, "s3.get_bucket_encryption", "high" if bucket_default_encryption is not None else "unknown")

    kms_encryption = _as_bool(_lookup(raw, "encryption.kms_enabled"))
    _append(evidence, normalized, "kms_encryption_configured", kms_encryption, "s3.get_bucket_encryption", "high" if kms_encryption is not None else "unknown")

    encryption_source = _lookup(raw, "encryption.source")
    _append(evidence, normalized, "encryption_source", encryption_source, "s3.get_bucket_encryption_or_s3_baseline", "high" if encryption_source else "unknown")

    secure_transport = _as_bool(
        _lookup(
            raw,
            "encryption_in_transit",
            "bucket_policy.secure_transport_required",
            "policy.secure_transport_required",
        )
    )
    _append(evidence, normalized, "encryption_in_transit", secure_transport, "s3.get_bucket_policy.aws:SecureTransport", "medium" if secure_transport is not None else "unknown")

    access_control = _as_bool(_lookup(raw, "access_control_in_place"))
    if access_control is None:
        access_control = _public_access_block_all_enabled(
            _lookup(raw, "public_access_block", "bucket.public_access_block")
        )
    _append(evidence, normalized, "access_control_in_place", access_control, "s3.get_public_access_block_and_bucket_policy", "medium" if access_control is not None else "unknown")

    sensitive = _as_bool(
        _lookup(raw, "contains_sensitive_data", "macie.contains_sensitive_data")
    )
    if sensitive is None:
        sensitive = _as_bool(_tag_value(raw, "contains_sensitive_data", "sensitive_data"))
    sensitive_source = (
        "macie_or_resource_tag"
        if sensitive is not None
        else "not_available_without_macie_or_manual_confirmation"
    )
    if sensitive is None:
        warnings.append(SENSITIVE_WARNING)
    _append(evidence, normalized, "contains_sensitive_data", sensitive, sensitive_source, "medium" if sensitive is not None else "unknown")

    data_type = _lookup(raw, "data_type", "macie.data_type") or _tag_value(
        raw, "data_type", "dataset_type", "classification"
    )
    _append(evidence, normalized, "data_type", data_type, "macie_or_resource_tag", "medium" if data_type else "unknown")

    processor = _as_bool(_lookup(raw, "uses_processor")) 
    if processor is None:
        processor = _as_bool(_tag_value(raw, "uses_processor", "processor", "external_processor"))
    if processor is None and resource_type == "s3_bucket":
        processor_source = "resource_type_inference_cloud_provider_involved"
    else:
        processor_source = "resource_tag_or_service_inference"
    _append(evidence, normalized, "uses_processor", processor, processor_source, "low" if processor is not None else "unknown")

    return NormalizedCloudDiscovery(
        provider="aws",
        resource_type=resource_type,
        resource_id=resource_id,
        normalized_cloud_data=normalized,
        normalized_aws_data=normalized,
        evidence=evidence,
        warnings=warnings,
        raw_discovery=raw,
    )


def _normalize_azure(
    resource_type: str,
    resource_id: str,
    raw: Dict[str, Any],
) -> NormalizedCloudDiscovery:
    normalized = {field: None for field in NORMALIZED_FIELDS}
    evidence: list[EvidenceItem] = []
    warnings: list[str] = []

    location = _lookup(raw, "current_region", "location", "storage_account.location")
    _append(evidence, normalized, "current_region", location, "storage_accounts.get.location", "high" if location else "unknown")

    encryption = _as_bool(
        _lookup(
            raw,
            "encryption_at_rest",
            "encryption.enabled",
            "encryption.services.blob.enabled",
        )
    )
    _append(evidence, normalized, "encryption_at_rest", encryption, "storage_accounts.get.encryption", "high" if encryption is not None else "unknown")

    https_only = _as_bool(
        _lookup(raw, "encryption_in_transit", "supports_https_traffic_only")
    )
    min_tls = _lookup(raw, "minimum_tls_version")
    in_transit = https_only if https_only is not None else None
    source = "storage_accounts.get.https_only"
    if in_transit is True and min_tls:
        source = "storage_accounts.get.https_only_and_min_tls"
    _append(evidence, normalized, "encryption_in_transit", in_transit, source, "high" if in_transit is not None else "unknown")

    access_control = _as_bool(_lookup(raw, "access_control_in_place"))
    if access_control is None:
        access_control = _azure_network_access_control(raw)
    _append(evidence, normalized, "access_control_in_place", access_control, "storage_accounts.get.network_rules_public_access_rbac", "medium" if access_control is not None else "unknown")

    sensitive = _as_bool(
        _lookup(raw, "contains_sensitive_data", "purview.contains_sensitive_data")
    )
    if sensitive is None:
        sensitive = _as_bool(_tag_value(raw, "contains_sensitive_data", "sensitive_data"))
    sensitive_source = (
        "purview_or_resource_tag"
        if sensitive is not None
        else "not_available_without_purview_or_manual_confirmation"
    )
    if sensitive is None:
        warnings.append(SENSITIVE_WARNING)
    _append(evidence, normalized, "contains_sensitive_data", sensitive, sensitive_source, "medium" if sensitive is not None else "unknown")

    data_type = _lookup(raw, "data_type", "purview.data_type") or _tag_value(
        raw, "data_type", "dataset_type", "classification"
    )
    _append(evidence, normalized, "data_type", data_type, "purview_or_resource_tag", "medium" if data_type else "unknown")

    processor = _as_bool(_lookup(raw, "uses_processor"))
    if processor is None:
        processor = _as_bool(_tag_value(raw, "uses_processor", "processor", "external_processor"))
    _append(evidence, normalized, "uses_processor", processor, "resource_tag_or_managed_service_inference", "low" if processor is not None else "unknown")

    return NormalizedCloudDiscovery(
        provider="azure",
        resource_type=resource_type,
        resource_id=resource_id,
        normalized_cloud_data=normalized,
        normalized_aws_data=normalized,
        evidence=evidence,
        warnings=warnings,
        raw_discovery=raw,
    )


def normalize_cloud_discovery(
    provider: Provider,
    resource_type: str,
    resource_id: str,
    raw_discovery: Dict[str, Any],
) -> NormalizedCloudDiscovery:
    if provider == "aws":
        return _normalize_aws(resource_type, resource_id, raw_discovery)
    if provider == "azure":
        return _normalize_azure(resource_type, resource_id, raw_discovery)
    raise ValueError(f"Unsupported cloud provider: {provider}")
