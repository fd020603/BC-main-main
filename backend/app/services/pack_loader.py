from typing import Any, Dict, List, Optional

from app.core.constants import DEFAULT_DECISION_ORDER, SUPPORTED_DECISIONS
from app.services.file_loader import load_json_file
from app.utils.path_helper import get_policy_pack_path

DECISION_ALIASES = {
    "allow_with_conditions": "condition_allow",
    "manualReview": "manual_review",
    "manual_Review": "manual_review",
    "conditon_allow": "condition_allow",
}

PACK_REGISTRY = {
    "gdpr": {
        "directory": "gdpr",
        "default_pack_file": "gdpr_pack_v3.json",
        "default_schema_file": "input_schema_v2.json",
    },
    "saudi_pdpl": {
        "directory": "saudi_pdpl",
        "default_pack_file": "saudi_pdpl_pack_v1.json",
        "default_schema_file": "input_schema_v1.json",
    },
    "lgpd": {
        "directory": "lgpd",
        "default_pack_file": "lgpd_pack_v1.json",
        "default_schema_file": "input_schema_v1.json",
    },
    "taiwan": {
        "directory": "taiwan_pdpa",
        "default_pack_file": "taiwan_pack_v1.json",
        "default_schema_file": "input_schema_v1.json",
    },
    "korea_pipa": {
        "directory": "korea_pipa",
        "default_pack_file": "pipa_pack_v1.json",
        "default_schema_file": "input_schema_v1.json",
    },
}


def get_pack_manifest(pack_id: str = "gdpr") -> Dict[str, str]:
    manifest = PACK_REGISTRY.get(pack_id)
    if not manifest:
        raise FileNotFoundError(f"Unknown pack id: {pack_id}")
    return manifest


def list_supported_pack_ids() -> List[str]:
    return list(PACK_REGISTRY.keys())


def normalize_decision_name(decision: str) -> str:
    normalized = DECISION_ALIASES.get(decision, decision)
    if normalized not in SUPPORTED_DECISIONS:
        raise ValueError(f"Unsupported decision value: {decision}")
    return normalized


def normalize_pack_decisions(pack_data: Dict[str, Any]) -> Dict[str, Any]:
    supported_decisions = pack_data.get("supported_decisions", DEFAULT_DECISION_ORDER)
    pack_data["supported_decisions"] = [
        normalize_decision_name(decision) for decision in supported_decisions
    ]

    decision_model = pack_data.get("decision_model", {})
    precedence = decision_model.get("precedence", DEFAULT_DECISION_ORDER)
    decision_model["precedence"] = [
        normalize_decision_name(decision) for decision in precedence
    ]
    pack_data["decision_model"] = decision_model

    for rule in pack_data.get("rules", []):
        rule["decision"] = normalize_decision_name(rule["decision"])

    return pack_data


def load_pack(
    pack_id: str = "gdpr",
    file_name: Optional[str] = None,
) -> Dict[str, Any]:
    manifest = get_pack_manifest(pack_id)
    target_file = file_name or manifest["default_pack_file"]
    pack_path = get_policy_pack_path(manifest["directory"]) / target_file
    pack_data = load_json_file(pack_path)

    if not isinstance(pack_data, dict):
        raise ValueError("Policy pack must be a JSON object.")

    normalized_pack = normalize_pack_decisions(pack_data)
    validate_pack_structure(normalized_pack)
    return normalized_pack


def load_input_schema(
    pack_id: str = "gdpr",
    schema_file_name: Optional[str] = None,
) -> Dict[str, Any]:
    manifest = get_pack_manifest(pack_id)
    target_file = schema_file_name or manifest["default_schema_file"]
    schema_path = get_policy_pack_path(manifest["directory"]) / target_file
    schema_data = load_json_file(schema_path)

    if not isinstance(schema_data, dict):
        raise ValueError("Input schema must be a JSON object.")

    return schema_data


def load_gdpr_pack(file_name: str = "gdpr_pack_v3.json") -> Dict[str, Any]:
    return load_pack(pack_id="gdpr", file_name=file_name)


def validate_pack_structure(pack_data: Dict[str, Any]) -> None:
    required_top_keys = [
        "pack_id",
        "pack_name",
        "jurisdiction",
        "version",
        "description",
        "supported_decisions",
        "decision_model",
        "source_references",
        "assumptions",
        "limitations",
        "disclaimer",
        "review_guidance",
        "sample_scenarios",
        "rules",
    ]

    missing_keys = [key for key in required_top_keys if key not in pack_data]
    if missing_keys:
        raise ValueError(f"Missing required pack keys: {', '.join(missing_keys)}")

    if not isinstance(pack_data["rules"], list):
        raise ValueError("'rules' must be a list")

    if not isinstance(pack_data["decision_model"].get("precedence", []), list):
        raise ValueError("'decision_model.precedence' must be a list")

    for idx, rule in enumerate(pack_data["rules"]):
        validate_rule_structure(rule, idx)


def validate_rule_structure(rule: Dict[str, Any], idx: int) -> None:
    required_rule_keys = [
        "rule_id",
        "article",
        "title",
        "category",
        "priority",
        "decision",
        "when",
        "required_evidence",
        "required_actions",
        "message",
        "references",
    ]

    missing_keys = [key for key in required_rule_keys if key not in rule]
    if missing_keys:
        raise ValueError(
            f"Rule at index {idx} is missing keys: {', '.join(missing_keys)}"
        )


def collect_covered_categories(pack_data: Dict[str, Any]) -> List[str]:
    seen = set()
    categories: List[str] = []

    for rule in pack_data.get("rules", []):
        category = rule.get("category")
        if category and category not in seen:
            seen.add(category)
            categories.append(category)

    return categories


def get_pack_summary(pack_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "pack_id": pack_data["pack_id"],
        "pack_name": pack_data["pack_name"],
        "jurisdiction": pack_data["jurisdiction"],
        "version": pack_data["version"],
        "description": pack_data["description"],
        "rule_count": len(pack_data["rules"]),
        "supported_decisions": pack_data["supported_decisions"],
        "covered_categories": collect_covered_categories(pack_data),
        "disclaimer": pack_data["disclaimer"],
    }


def get_pack_detail(pack_data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "pack_id": pack_data["pack_id"],
        "pack_name": pack_data["pack_name"],
        "jurisdiction": pack_data["jurisdiction"],
        "version": pack_data["version"],
        "description": pack_data["description"],
        "supported_decisions": pack_data["supported_decisions"],
        "decision_model": pack_data["decision_model"],
        "source_references": pack_data["source_references"],
        "assumptions": pack_data["assumptions"],
        "limitations": pack_data["limitations"],
        "disclaimer": pack_data["disclaimer"],
        "rule_count": len(pack_data["rules"]),
        "covered_categories": collect_covered_categories(pack_data),
        "review_guidance": pack_data["review_guidance"],
        "sample_scenarios": pack_data["sample_scenarios"],
    }


def get_all_rules(pack_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    return pack_data["rules"]


def get_rule_by_id(pack_data: Dict[str, Any], rule_id: str) -> Optional[Dict[str, Any]]:
    for rule in pack_data["rules"]:
        if rule["rule_id"] == rule_id:
            return rule
    return None
