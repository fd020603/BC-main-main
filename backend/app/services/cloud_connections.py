import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict
from urllib.parse import urlencode
from uuid import uuid4


STORE_PATH = Path(__file__).resolve().parents[2] / "data" / "cloud_connections.json"
DEFAULT_TEMPLATE_URL = (
    "https://example.com/aws_border_checker_role.yaml"
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _read_store() -> Dict[str, Dict[str, Any]]:
    if not STORE_PATH.exists():
        return {}
    try:
        return json.loads(STORE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _write_store(store: Dict[str, Dict[str, Any]]) -> None:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STORE_PATH.write_text(
        json.dumps(store, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def get_aws_backend_principal_arn() -> str:
    return os.getenv(
        "BORDER_CHECKER_AWS_PRINCIPAL_ARN",
        "arn:aws:iam::000000000000:role/BorderCheckerBackendRole",
    )


def get_aws_cloudformation_template_url() -> str:
    return os.getenv(
        "BORDER_CHECKER_AWS_CFN_TEMPLATE_URL",
        DEFAULT_TEMPLATE_URL,
    )


def build_quick_create_url(
    connection_name: str,
    region: str,
    external_id: str,
) -> str:
    stack_name = f"border-checker-{connection_name}".replace("_", "-")
    query = urlencode(
        {
            "templateURL": get_aws_cloudformation_template_url(),
            "stackName": stack_name,
            "param_BorderCheckerAwsPrincipalArn": get_aws_backend_principal_arn(),
            "param_ExternalId": external_id,
        }
    )
    return f"https://{region}.console.aws.amazon.com/cloudformation/home?region={region}#/stacks/quickcreate?{query}"


def create_aws_connection(connection_name: str, region: str) -> Dict[str, Any]:
    store = _read_store()
    connection_id = str(uuid4())
    external_id = str(uuid4())
    record = {
        "connection_id": connection_id,
        "connection_name": connection_name,
        "provider": "aws",
        "region": region,
        "external_id": external_id,
        "role_arn": None,
        "status": "pending",
        "created_at": _now(),
        "updated_at": _now(),
    }
    store[connection_id] = record
    _write_store(store)
    return record


def get_connection(connection_id: str) -> Dict[str, Any]:
    record = _read_store().get(connection_id)
    if not record:
        raise ValueError("AWS 연결 정보를 찾을 수 없습니다. 연결 시작을 다시 진행해 주세요.")
    return record


def update_connection(connection_id: str, **updates: Any) -> Dict[str, Any]:
    store = _read_store()
    if connection_id not in store:
        raise ValueError("AWS 연결 정보를 찾을 수 없습니다. 연결 시작을 다시 진행해 주세요.")
    store[connection_id].update(updates)
    store[connection_id]["updated_at"] = _now()
    _write_store(store)
    return store[connection_id]
