from fastapi import APIRouter, HTTPException

from app.schemas.cloud_connections import (
    AwsConnectionCompleteRequest,
    AwsConnectionCompleteResponse,
    AwsConnectionStartRequest,
    AwsConnectionStartResponse,
)
from app.services.aws_assume_role_service import test_assume_role
from app.services.cloud_connections import (
    build_quick_create_url,
    create_aws_connection,
    update_connection,
)

router = APIRouter(prefix="/api/v1/cloud-connections", tags=["cloud-connections"])


@router.post("/aws/start", response_model=AwsConnectionStartResponse)
def start_aws_connection(payload: AwsConnectionStartRequest):
    record = create_aws_connection(
        connection_name=payload.connection_name,
        region=payload.region,
    )
    return AwsConnectionStartResponse(
        connection_id=record["connection_id"],
        external_id=record["external_id"],
        cloudformation_url=build_quick_create_url(
            connection_name=payload.connection_name,
            region=payload.region,
            external_id=record["external_id"],
        ),
    )


@router.post("/aws/complete", response_model=AwsConnectionCompleteResponse)
def complete_aws_connection(payload: AwsConnectionCompleteRequest):
    try:
        record = update_connection(
            payload.connection_id,
            role_arn=payload.role_arn,
            status="testing",
        )
        caller_identity = test_assume_role(
            role_arn=payload.role_arn,
            external_id=record["external_id"],
        )
        update_connection(
            payload.connection_id,
            role_arn=payload.role_arn,
            status="connected",
            caller_identity=caller_identity,
        )
        return AwsConnectionCompleteResponse(
            connection_id=payload.connection_id,
            status="connected",
            role_arn=payload.role_arn,
            caller_identity=caller_identity,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except RuntimeError as e:
        update_connection(payload.connection_id, status="failed")
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"AWS 연결 확인 중 오류가 발생했습니다: {e}",
        ) from e
