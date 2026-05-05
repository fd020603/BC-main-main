import os
from typing import Any, Dict


def build_mock_azure_storage_discovery(
    storage_account_name: str,
    sample_discovery: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    if sample_discovery is not None:
        return sample_discovery

    return {
        "storage_account_name": storage_account_name,
        "location": None,
        "encryption": {"services": {"blob": {"enabled": None}}},
        "supports_https_traffic_only": None,
        "minimum_tls_version": None,
        "public_network_access": None,
        "network_rule_set": {},
        "tags": {},
    }


def collect_azure_storage_account_live(
    storage_account_name: str,
    subscription_id: str | None,
    resource_group: str | None,
) -> Dict[str, Any]:
    try:
        from azure.identity import DefaultAzureCredential  # type: ignore[import-not-found]
        from azure.mgmt.storage import StorageManagementClient  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError(
            "Azure live discovery requires optional dependencies. Install "
            "azure-identity and azure-mgmt-storage, then configure server-side "
            "Azure credentials."
        ) from exc

    subscription_id = subscription_id or os.getenv("AZURE_SUBSCRIPTION_ID")
    resource_group = resource_group or os.getenv("AZURE_RESOURCE_GROUP")

    if not subscription_id or not resource_group:
        raise RuntimeError(
            "Azure live discovery requires subscription_id and resource_group. "
            "You can set AZURE_SUBSCRIPTION_ID and AZURE_RESOURCE_GROUP on the backend."
        )

    credential = DefaultAzureCredential()
    client = StorageManagementClient(credential, subscription_id)
    account = client.storage_accounts.get_properties(
        resource_group,
        storage_account_name,
    )

    encryption = getattr(account, "encryption", None)
    services = getattr(encryption, "services", None)
    blob = getattr(services, "blob", None)
    network_rule_set = getattr(account, "network_rule_set", None)

    return {
        "storage_account_name": storage_account_name,
        "location": getattr(account, "location", None),
        "encryption": {
            "services": {
                "blob": {
                    "enabled": getattr(blob, "enabled", None),
                }
            }
        },
        "supports_https_traffic_only": getattr(
            account,
            "supports_https_traffic_only",
            None,
        ),
        "minimum_tls_version": getattr(account, "minimum_tls_version", None),
        "public_network_access": getattr(account, "public_network_access", None),
        "allow_blob_public_access": getattr(account, "allow_blob_public_access", None),
        "network_rule_set": {
            "default_action": getattr(network_rule_set, "default_action", None),
        },
        "tags": dict(getattr(account, "tags", None) or {}),
    }
