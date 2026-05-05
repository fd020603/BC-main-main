from fastapi import APIRouter, HTTPException

from app.schemas.cloud_discovery import (
    AwsDiscoveryRequest,
    AzureDiscoveryRequest,
    CloudDiscoveryResponse,
    NormalizeDiscoveryRequest,
)
from app.schemas.cloud_connections import (
    AWSAccessKeyS3ApplyRequest,
    AWSAccessKeyS3CheckRequest,
    AwsS3ApplyRecommendedSettingsRequest,
    AwsS3CheckRequest,
    AwsS3CheckResponse,
)
from app.services.cloud_discovery.aws_collector import (
    build_mock_aws_s3_discovery,
    collect_aws_s3_bucket_live,
)
from app.services.cloud_discovery.azure_collector import (
    build_mock_azure_storage_discovery,
    collect_azure_storage_account_live,
)
from app.services.cloud_discovery.normalizer import normalize_cloud_discovery
from app.services.cloud_discovery.aws_s3_review_service import (
    apply_recommended_s3_settings,
    apply_recommended_s3_settings_with_access_keys,
    check_s3_bucket,
    check_s3_bucket_with_access_keys,
)
from app.services.cloud_connections import get_connection

router = APIRouter(prefix="/api/v1/cloud-discovery", tags=["cloud-discovery"])


def _connected_aws_connection(connection_id: str):
    record = get_connection(connection_id)
    if record.get("status") != "connected" or not record.get("role_arn"):
        raise ValueError("AWS 연결이 완료되지 않았습니다. Role ARN 등록과 연결 확인을 먼저 진행해 주세요.")
    return record


@router.post("/aws", response_model=CloudDiscoveryResponse)
def discover_aws(payload: AwsDiscoveryRequest):
    try:
        if payload.mode == "live":
            raw_discovery = collect_aws_s3_bucket_live(
                bucket_name=payload.resource_id,
                region=payload.region,
            )
        else:
            raw_discovery = build_mock_aws_s3_discovery(
                bucket_name=payload.resource_id,
                region=payload.region,
                sample_discovery=payload.sample_discovery,
            )

        return normalize_cloud_discovery(
            provider="aws",
            resource_type=payload.resource_type,
            resource_id=payload.resource_id,
            raw_discovery=raw_discovery,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=501, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/aws/s3/check", response_model=AwsS3CheckResponse)
def check_aws_s3_bucket(payload: AwsS3CheckRequest):
    try:
        record = _connected_aws_connection(payload.connection_id)
        return check_s3_bucket(
            role_arn=record["role_arn"],
            external_id=record["external_id"],
            bucket_name=payload.bucket_name,
            region=payload.region,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"S3 버킷 검사 중 오류가 발생했습니다: {e}",
        ) from e


@router.post(
    "/aws/s3/apply-recommended-settings",
    response_model=AwsS3CheckResponse,
)
def apply_aws_s3_recommended_settings(
    payload: AwsS3ApplyRecommendedSettingsRequest,
):
    try:
        record = _connected_aws_connection(payload.connection_id)
        return apply_recommended_s3_settings(
            role_arn=record["role_arn"],
            external_id=record["external_id"],
            bucket_name=payload.bucket_name,
            region=payload.region,
            data_type=payload.data_type,
            contains_sensitive_data=payload.contains_sensitive_data,
            uses_processor=payload.uses_processor,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"S3 권장 설정 적용 중 오류가 발생했습니다: {e}",
        ) from e


@router.post("/aws/s3/check-with-keys", response_model=AwsS3CheckResponse)
def check_aws_s3_bucket_with_keys(payload: AWSAccessKeyS3CheckRequest):
    try:
        session_token = (
            payload.session_token.get_secret_value()
            if payload.session_token is not None
            else None
        )
        return check_s3_bucket_with_access_keys(
            access_key_id=payload.access_key_id,
            secret_access_key=payload.secret_access_key.get_secret_value(),
            session_token=session_token,
            region=payload.region,
            bucket_name=payload.bucket_name,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Access Key 기반 S3 버킷 검사 중 오류가 발생했습니다. 입력값과 S3 권한을 확인해 주세요.",
        ) from e


@router.post("/aws/s3/apply-with-keys", response_model=AwsS3CheckResponse)
def apply_aws_s3_recommended_settings_with_keys(
    payload: AWSAccessKeyS3ApplyRequest,
):
    try:
        session_token = (
            payload.session_token.get_secret_value()
            if payload.session_token is not None
            else None
        )
        return apply_recommended_s3_settings_with_access_keys(
            access_key_id=payload.access_key_id,
            secret_access_key=payload.secret_access_key.get_secret_value(),
            session_token=session_token,
            region=payload.region,
            bucket_name=payload.bucket_name,
            data_type=payload.data_type,
            contains_sensitive_data=payload.contains_sensitive_data,
            uses_processor=payload.uses_processor,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail="Access Key 기반 S3 권장 설정 적용 중 오류가 발생했습니다. 입력값과 S3 쓰기 권한을 확인해 주세요.",
        ) from e


@router.post("/azure", response_model=CloudDiscoveryResponse)
def discover_azure(payload: AzureDiscoveryRequest):
    try:
        if payload.mode == "live":
            raw_discovery = collect_azure_storage_account_live(
                storage_account_name=payload.resource_id,
                subscription_id=payload.subscription_id,
                resource_group=payload.resource_group,
            )
        else:
            raw_discovery = build_mock_azure_storage_discovery(
                storage_account_name=payload.resource_id,
                sample_discovery=payload.sample_discovery,
            )

        return normalize_cloud_discovery(
            provider="azure",
            resource_type=payload.resource_type,
            resource_id=payload.resource_id,
            raw_discovery=raw_discovery,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=501, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/normalize", response_model=CloudDiscoveryResponse)
def normalize_discovery(payload: NormalizeDiscoveryRequest):
    try:
        return normalize_cloud_discovery(
            provider=payload.provider,
            resource_type=payload.resource_type,
            resource_id=payload.resource_id,
            raw_discovery=payload.raw_discovery,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
