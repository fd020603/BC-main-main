from typing import Any, Dict


def _aws_error_message(error: Exception) -> str:
    message = str(error)
    if "AccessDenied" in message:
        return (
            "AWS 역할 위임에 실패했습니다. Role ARN, ExternalId, Trust Policy의 "
            "Border Checker principal을 확인해 주세요."
        )
    if "InvalidClientTokenId" in message or "UnrecognizedClientException" in message:
        return "Border Checker 백엔드의 AWS 자격 증명이 유효하지 않습니다."
    if "NoCredentialsError" in message or "Unable to locate credentials" in message:
        return "Border Checker 백엔드에 AWS 자격 증명이 설정되어 있지 않습니다."
    return f"AWS 연결 확인 중 오류가 발생했습니다: {message}"


def assume_role(role_arn: str, external_id: str, session_name: str) -> Dict[str, Any]:
    try:
        import boto3  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError(
            "AWS 온라인 연동에는 boto3가 필요합니다. 백엔드 환경에 boto3를 설치해 주세요."
        ) from exc

    try:
        sts = boto3.client("sts")
        response = sts.assume_role(
            RoleArn=role_arn,
            RoleSessionName=session_name[:64],
            ExternalId=external_id,
        )
        return response["Credentials"]
    except Exception as exc:
        raise RuntimeError(_aws_error_message(exc)) from exc


def test_assume_role(role_arn: str, external_id: str) -> Dict[str, Any]:
    try:
        import boto3  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError(
            "AWS 온라인 연동에는 boto3가 필요합니다. 백엔드 환경에 boto3를 설치해 주세요."
        ) from exc

    credentials = assume_role(
        role_arn=role_arn,
        external_id=external_id,
        session_name="border-checker-connection-test",
    )
    try:
        sts = boto3.client(
            "sts",
            aws_access_key_id=credentials["AccessKeyId"],
            aws_secret_access_key=credentials["SecretAccessKey"],
            aws_session_token=credentials["SessionToken"],
        )
        return sts.get_caller_identity()
    except Exception as exc:
        raise RuntimeError(_aws_error_message(exc)) from exc


def build_boto3_client(
    service_name: str,
    role_arn: str,
    external_id: str,
    region: str | None = None,
):
    try:
        import boto3  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError(
            "AWS 온라인 연동에는 boto3가 필요합니다. 백엔드 환경에 boto3를 설치해 주세요."
        ) from exc

    credentials = assume_role(
        role_arn=role_arn,
        external_id=external_id,
        session_name=f"border-checker-{service_name}",
    )
    return boto3.client(
        service_name,
        region_name=region,
        aws_access_key_id=credentials["AccessKeyId"],
        aws_secret_access_key=credentials["SecretAccessKey"],
        aws_session_token=credentials["SessionToken"],
    )
