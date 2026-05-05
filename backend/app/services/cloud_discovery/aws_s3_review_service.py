import json
from typing import Any, Dict

from app.services.aws_assume_role_service import build_boto3_client
from app.services.cloud_discovery.normalizer import normalize_cloud_discovery


SECURE_TRANSPORT_SID = "BorderCheckerDenyInsecureTransport"


def _client_error_code(error: Exception) -> str:
    response = getattr(error, "response", {})
    if isinstance(response, dict):
        error_info = response.get("Error", {})
        if isinstance(error_info, dict):
            return str(error_info.get("Code", ""))
    return ""


def _aws_s3_error_message(error: Exception, action: str) -> str:
    code = _client_error_code(error)
    message = str(error)
    if code in {"InvalidAccessKeyId", "SignatureDoesNotMatch", "AuthFailure"}:
        return "AWS 키가 올바르지 않습니다. Access Key ID와 Secret Access Key를 확인해 주세요."
    if code in {"ExpiredToken", "InvalidToken", "TokenRefreshRequired"}:
        return "AWS Session Token이 만료되었거나 올바르지 않습니다."
    if code in {"AccessDenied", "AllAccessDisabled", "UnauthorizedOperation"}:
        return f"{action} 권한이 부족합니다. 연결된 IAM 사용자 또는 Role의 S3 권한을 확인해 주세요."
    if code in {"NoSuchBucket", "NotFound"}:
        return "S3 버킷이 존재하지 않습니다. Bucket Name을 확인해 주세요."
    if code in {
        "PermanentRedirect",
        "AuthorizationHeaderMalformed",
        "IllegalLocationConstraintException",
    }:
        return "버킷 region이 입력한 region과 다릅니다. 버킷의 실제 region을 확인해 주세요."
    if "Could not connect" in message or "EndpointConnectionError" in message:
        return "AWS S3에 연결할 수 없습니다. 네트워크와 region 값을 확인해 주세요."
    return f"{action} 중 AWS 오류가 발생했습니다: {code or message}"


def _read_warning(action: str, error: Exception) -> str:
    code = _client_error_code(error)
    if code in {"AccessDenied", "UnauthorizedOperation"}:
        return f"{action} 읽기 권한이 없어 해당 값은 unknown으로 처리했습니다."
    if code in {
        "NoSuchTagSet",
        "ServerSideEncryptionConfigurationNotFoundError",
        "NoSuchBucketPolicy",
    }:
        return f"{action} 설정이 아직 없습니다."
    return f"{action} 조회 중 오류가 발생해 해당 값은 unknown으로 처리했습니다."


def _safe_call(default: Any, func, *args, **kwargs) -> Any:
    try:
        return func(*args, **kwargs)
    except Exception:
        return default


def _safe_read(
    discovered: Dict[str, Any],
    label: str,
    default: Any,
    func,
    *args,
    **kwargs,
) -> Any:
    try:
        return func(*args, **kwargs)
    except Exception as exc:
        discovered.setdefault("_read_warnings", []).append(
            _read_warning(label, exc)
        )
        return default


def _tag_bool(tags: Dict[str, str], key: str) -> bool | None:
    value = tags.get(key)
    if value is None:
        return None
    lowered = value.strip().lower()
    if lowered == "true":
        return True
    if lowered == "false":
        return False
    return None


def _extract_tags(tag_response: Dict[str, Any]) -> Dict[str, str]:
    return {
        item["Key"]: item["Value"]
        for item in tag_response.get("TagSet", [])
        if "Key" in item and "Value" in item
    }


def _policy_requires_secure_transport(policy_text: str | None) -> bool | None:
    if not policy_text:
        return None
    try:
        policy = json.loads(policy_text)
    except json.JSONDecodeError:
        return None
    statements = policy.get("Statement", [])
    if isinstance(statements, dict):
        statements = [statements]
    for statement in statements:
        condition = statement.get("Condition", {})
        bool_condition = condition.get("Bool", {})
        if bool_condition.get("aws:SecureTransport") in ["false", False]:
            return True
    return None


def collect_s3_discovery_with_client(s3, bucket_name: str) -> Dict[str, Any]:
    discovered: Dict[str, Any] = {
        "bucket_name": bucket_name,
        "region": None,
        "encryption": {"default_sse_enabled": None},
        "bucket_policy": {"secure_transport_required": None},
        "public_access_block": {},
        "tags": {},
        "_read_warnings": [],
    }

    try:
        location = s3.get_bucket_location(Bucket=bucket_name)
    except Exception as exc:
        raise RuntimeError(_aws_s3_error_message(exc, "S3 버킷 위치 조회")) from exc
    discovered["region"] = location.get("LocationConstraint") or "us-east-1"

    try:
        encryption = s3.get_bucket_encryption(Bucket=bucket_name)
        rules = encryption.get("ServerSideEncryptionConfiguration", {}).get(
            "Rules", []
        )
        discovered["encryption"]["default_sse_enabled"] = bool(rules)
        discovered["encryption"]["kms_enabled"] = any(
            rule.get("ApplyServerSideEncryptionByDefault", {}).get("SSEAlgorithm")
            == "aws:kms"
            for rule in rules
        )
        discovered["encryption"]["effective"] = True
        discovered["encryption"]["source"] = (
            "bucket_default_encryption_config"
            if rules
            else "aws_s3_baseline_sse_s3"
        )
    except Exception as exc:
        if _client_error_code(exc) == "ServerSideEncryptionConfigurationNotFoundError":
            discovered["encryption"]["default_sse_enabled"] = False
            discovered["encryption"]["kms_enabled"] = False
            discovered["encryption"]["effective"] = True
            discovered["encryption"]["source"] = "aws_s3_baseline_sse_s3"
        else:
            discovered.setdefault("_read_warnings", []).append(
                _read_warning("S3 암호화 설정", exc)
            )

    public_access = _safe_read(
        discovered,
        "Public Access Block",
        {},
        s3.get_public_access_block,
        Bucket=bucket_name,
    )
    discovered["public_access_block"] = public_access.get(
        "PublicAccessBlockConfiguration",
        {},
    )

    tag_response = _safe_read(
        discovered,
        "S3 태그",
        {},
        s3.get_bucket_tagging,
        Bucket=bucket_name,
    )
    tags = _extract_tags(tag_response)
    discovered["tags"] = tags
    if "data_type" in tags:
        discovered["data_type"] = tags["data_type"]
    if "contains_sensitive_data" in tags:
        discovered["contains_sensitive_data"] = _tag_bool(
            tags,
            "contains_sensitive_data",
        )
    if "uses_processor" in tags:
        discovered["uses_processor"] = _tag_bool(tags, "uses_processor")

    policy_response = _safe_read(
        discovered,
        "Bucket Policy",
        None,
        s3.get_bucket_policy,
        Bucket=bucket_name,
    )
    if policy_response is not None:
        discovered["bucket_policy"]["secure_transport_required"] = (
            _policy_requires_secure_transport(policy_response.get("Policy"))
        )

    return discovered


def _missing_items(normalized: Dict[str, Any]) -> list[str]:
    missing: list[str] = []
    if normalized.get("encryption_at_rest") is not True:
        missing.append("encryption_at_rest")
    if normalized.get("encryption_in_transit") is not True:
        missing.append("encryption_in_transit")
    if normalized.get("access_control_in_place") is not True:
        missing.append("access_control_in_place")
    if not normalized.get("data_type"):
        missing.append("data_type")
    if normalized.get("contains_sensitive_data") is None:
        missing.append("contains_sensitive_data")
    if normalized.get("uses_processor") is None:
        missing.append("uses_processor")
    return missing


def _null_warnings(normalized: Dict[str, Any]) -> list[str]:
    warnings: list[str] = []
    if normalized.get("contains_sensitive_data") is None:
        warnings.append(
            "contains_sensitive_data는 AWS가 자동 판별하는 값이 아니라 S3 태그에서 가져오는 값입니다."
        )
    if normalized.get("uses_processor") is None:
        warnings.append("uses_processor는 S3 태그에서 가져오는 값입니다.")
    if not normalized.get("data_type"):
        warnings.append("data_type은 S3 태그에서 가져오는 값입니다.")
    return warnings


def check_s3_bucket_with_client(
    s3_client,
    bucket_name: str,
    region: str | None = None,
) -> Dict[str, Any]:
    raw = collect_s3_discovery_with_client(s3_client, bucket_name)
    normalized = normalize_cloud_discovery(
        provider="aws",
        resource_type="s3_bucket",
        resource_id=bucket_name,
        raw_discovery=raw,
    )
    normalized_data = normalized.normalized_cloud_data
    warnings = [
        *normalized.warnings,
        *raw.get("_read_warnings", []),
        *_null_warnings(normalized_data),
    ]

    return {
        "provider": "aws",
        "resource_type": "s3_bucket",
        "resource_id": bucket_name,
        "normalized_cloud_data": normalized_data,
        "normalized_aws_data": normalized_data,
        "missing_items": _missing_items(normalized_data),
        "warnings": list(dict.fromkeys(warnings)),
        "evidence": [item.model_dump() for item in normalized.evidence],
        "raw_discovery": raw,
    }


def check_s3_bucket(
    role_arn: str,
    external_id: str,
    bucket_name: str,
    region: str | None = None,
) -> Dict[str, Any]:
    s3 = build_boto3_client("s3", role_arn, external_id, region or "us-east-1")
    return check_s3_bucket_with_client(s3, bucket_name, region)


def _merge_secure_transport_policy(existing_policy: str | None, bucket_name: str) -> str:
    if existing_policy:
        try:
            policy = json.loads(existing_policy)
        except json.JSONDecodeError:
            policy = {"Version": "2012-10-17", "Statement": []}
    else:
        policy = {"Version": "2012-10-17", "Statement": []}

    statements = policy.setdefault("Statement", [])
    if isinstance(statements, dict):
        statements = [statements]
        policy["Statement"] = statements

    statements[:] = [
        statement
        for statement in statements
        if statement.get("Sid") != SECURE_TRANSPORT_SID
    ]
    statements.append(
        {
            "Sid": SECURE_TRANSPORT_SID,
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
                f"arn:aws:s3:::{bucket_name}",
                f"arn:aws:s3:::{bucket_name}/*",
            ],
            "Condition": {"Bool": {"aws:SecureTransport": "false"}},
        }
    )
    return json.dumps(policy)


def apply_recommended_s3_settings_with_client(
    s3_client,
    bucket_name: str,
    region: str | None,
    data_type: str | None,
    contains_sensitive_data: bool | None,
    uses_processor: bool | None,
) -> Dict[str, Any]:
    try:
        s3_client.put_bucket_encryption(
            Bucket=bucket_name,
            ServerSideEncryptionConfiguration={
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256",
                        },
                        "BucketKeyEnabled": True,
                    }
                ]
            },
        )
        s3_client.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                "BlockPublicAcls": True,
                "IgnorePublicAcls": True,
                "BlockPublicPolicy": True,
                "RestrictPublicBuckets": True,
            },
        )
    except Exception as exc:
        raise RuntimeError(_aws_s3_error_message(exc, "S3 권장 설정 적용")) from exc

    existing_policy_response = _safe_call(
        None,
        s3_client.get_bucket_policy,
        Bucket=bucket_name,
    )
    existing_policy = (
        existing_policy_response.get("Policy")
        if existing_policy_response
        else None
    )
    try:
        s3_client.put_bucket_policy(
            Bucket=bucket_name,
            Policy=_merge_secure_transport_policy(existing_policy, bucket_name),
        )
    except Exception as exc:
        raise RuntimeError(_aws_s3_error_message(exc, "Bucket Policy 적용")) from exc

    tag_updates: Dict[str, str] = {}
    if data_type:
        tag_updates["data_type"] = data_type
    if contains_sensitive_data is not None:
        tag_updates["contains_sensitive_data"] = str(contains_sensitive_data).lower()
    if uses_processor is not None:
        tag_updates["uses_processor"] = str(uses_processor).lower()

    if tag_updates:
        existing_tags = _extract_tags(
            _safe_call({}, s3_client.get_bucket_tagging, Bucket=bucket_name)
        )
        existing_tags.update(tag_updates)
        try:
            s3_client.put_bucket_tagging(
                Bucket=bucket_name,
                Tagging={
                    "TagSet": [
                        {"Key": key, "Value": value}
                        for key, value in sorted(existing_tags.items())
                    ]
                },
            )
        except Exception as exc:
            raise RuntimeError(_aws_s3_error_message(exc, "S3 태그 적용")) from exc

    return check_s3_bucket_with_client(s3_client, bucket_name, region)


def apply_recommended_s3_settings(
    role_arn: str,
    external_id: str,
    bucket_name: str,
    data_type: str | None,
    contains_sensitive_data: bool | None,
    uses_processor: bool | None,
    region: str | None = None,
) -> Dict[str, Any]:
    s3 = build_boto3_client("s3", role_arn, external_id, region or "us-east-1")
    return apply_recommended_s3_settings_with_client(
        s3_client=s3,
        bucket_name=bucket_name,
        region=region,
        data_type=data_type,
        contains_sensitive_data=contains_sensitive_data,
        uses_processor=uses_processor,
    )


def build_s3_client_from_access_keys(
    access_key_id: str,
    secret_access_key: str,
    session_token: str | None,
    region: str | None,
    boto3_module=None,
):
    if boto3_module is None:
        try:
            import boto3 as boto3_module  # type: ignore[import-not-found]
        except ImportError as exc:
            raise RuntimeError(
                "AWS 간편 연결에는 boto3가 필요합니다. 백엔드 환경에 boto3를 설치해 주세요."
            ) from exc
    try:
        session = boto3_module.Session(
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            aws_session_token=session_token,
            region_name=region or "us-east-1",
        )
        return session.client("s3")
    except Exception as exc:
        raise RuntimeError(_aws_s3_error_message(exc, "AWS 키 기반 S3 client 생성")) from exc


def check_s3_bucket_with_access_keys(
    access_key_id: str,
    secret_access_key: str,
    session_token: str | None,
    region: str | None,
    bucket_name: str,
) -> Dict[str, Any]:
    s3 = build_s3_client_from_access_keys(
        access_key_id=access_key_id,
        secret_access_key=secret_access_key,
        session_token=session_token,
        region=region,
    )
    return check_s3_bucket_with_client(s3, bucket_name, region)


def apply_recommended_s3_settings_with_access_keys(
    access_key_id: str,
    secret_access_key: str,
    session_token: str | None,
    region: str | None,
    bucket_name: str,
    data_type: str | None,
    contains_sensitive_data: bool | None,
    uses_processor: bool | None,
) -> Dict[str, Any]:
    s3 = build_s3_client_from_access_keys(
        access_key_id=access_key_id,
        secret_access_key=secret_access_key,
        session_token=session_token,
        region=region,
    )
    return apply_recommended_s3_settings_with_client(
        s3_client=s3,
        bucket_name=bucket_name,
        region=region,
        data_type=data_type,
        contains_sensitive_data=contains_sensitive_data,
        uses_processor=uses_processor,
    )
