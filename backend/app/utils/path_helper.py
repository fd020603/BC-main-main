from pathlib import Path


def get_backend_root() -> Path:
    return Path(__file__).resolve().parents[2]


def get_policy_packs_root() -> Path:
    return get_backend_root() / "policy_packs"


def get_policy_pack_path(pack_id: str = "gdpr") -> Path:
    return get_policy_packs_root() / pack_id


def get_sample_input_path() -> Path:
    return get_backend_root() / "sample_inputs"
