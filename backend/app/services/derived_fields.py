from typing import Any, Dict

from app.core.constants import (
    AWS_REGION_TO_COUNTRY,
    EU_ADEQUACY_COUNTRIES,
    EU_EEA_COUNTRIES,
)


def derive_target_country(target_region: str | None) -> str | None:
    if not target_region:
        return None
    return AWS_REGION_TO_COUNTRY.get(target_region)


def derive_eu_adequacy_decision_exists(
    target_country: str | None,
    merged_data: Dict[str, Any] | None = None,
) -> bool:
    if not target_country:
        return False
    if (
        target_country == "US"
        and merged_data
        and merged_data.get("recipient_us_dpf_certified") is True
    ):
        return True
    return target_country in EU_ADEQUACY_COUNTRIES or target_country in EU_EEA_COUNTRIES


def derive_adequacy_decision_exists(target_country: str | None) -> bool:
    return derive_eu_adequacy_decision_exists(target_country)


def derive_is_third_country_transfer(
    data_subject_region: str | None,
    target_country: str | None,
) -> bool:
    if data_subject_region not in {"EU", "EEA"}:
        return False

    if not target_country:
        return False

    return target_country not in EU_EEA_COUNTRIES


def derive_transfer_safeguards_available(merged_data: Dict[str, Any]) -> bool:
    return any(
        merged_data.get(field) is True
        for field in ("scc_in_place", "bcr_in_place", "other_safeguards_in_place")
    )


def derive_baseline_security_controls_ready(merged_data: Dict[str, Any]) -> bool:
    return all(
        merged_data.get(field) is True
        for field in (
            "encryption_at_rest",
            "encryption_in_transit",
            "access_control_in_place",
        )
    )


def derive_saudi_transfer_outside_kingdom(target_country: str | None) -> bool:
    if not target_country:
        return False
    return target_country != "SA"


def derive_saudi_appropriate_safeguards_available(merged_data: Dict[str, Any]) -> bool:
    return any(
        merged_data.get(field) is True
        for field in (
            "binding_common_rules_approved",
            "standard_contractual_clauses_in_place",
            "certification_or_code_in_place",
        )
    )


def derive_saudi_transfer_risk_assessment_required(
    merged_data: Dict[str, Any],
    transfer_outside_kingdom: bool,
    appropriate_safeguards_available: bool,
) -> bool:
    if not transfer_outside_kingdom:
        return False

    if appropriate_safeguards_available:
        return True

    if merged_data.get("transfer_exception_used") is True:
        return True

    return (
        merged_data.get("contains_sensitive_data") is True
        and merged_data.get("large_scale_or_continuous_transfer") is True
    )


def derive_transfer_outside_country(
    target_country: str | None,
    country_code: str,
) -> bool | None:
    if not target_country:
        return None
    return target_country != country_code


def derive_lgpd_appropriate_transfer_mechanism_available(
    merged_data: Dict[str, Any],
) -> bool:
    scc_ready = (
        merged_data.get("standard_contractual_clauses_in_place") is True
        and merged_data.get("standard_contractual_clauses_full_unaltered") is True
    )
    specific_clauses_ready = (
        merged_data.get("specific_contractual_clauses_used") is True
        and merged_data.get("specific_contractual_clauses_anpd_approved") is True
    )
    bcr_ready = (
        merged_data.get("binding_corporate_rules_used") is True
        and merged_data.get("binding_corporate_rules_anpd_approved") is True
    )

    return any(
        (
            scc_ready,
            specific_clauses_ready,
            bcr_ready,
            merged_data.get("certification_or_code_approved") is True,
        )
    )


def derive_pipa_transfer_basis_available(merged_data: Dict[str, Any]) -> bool:
    return any(
        merged_data.get(field) is True
        for field in (
            "separate_consent_for_transfer",
            "treaty_or_statutory_transfer_basis",
            "contract_necessity_disclosed_or_notified",
            "pipa_certified_recipient",
            "pipa_equivalence_recognition_exists",
            # Backward-compatible alias for saved/demo inputs created before the
            # PIPA equivalence concept was split from EU GDPR adequacy.
            "adequacy_decision_exists",
        )
    )


def derive_taiwan_article21_restriction_risk_present(
    merged_data: Dict[str, Any],
) -> bool:
    return any(
        (
            merged_data.get("major_national_interest_involved") is True,
            merged_data.get("treaty_or_agreement_restriction_known") is True,
            merged_data.get("recipient_country_protection_adequate") is False,
            merged_data.get("third_country_circumvention_risk") is True,
            merged_data.get("authority_transfer_restriction_applies") is True,
        )
    )


def build_gdpr_derived_fields(merged_data: Dict[str, Any]) -> Dict[str, Any]:
    target_region = merged_data.get("target_region")
    data_subject_region = merged_data.get("data_subject_region")

    target_country = derive_target_country(target_region)
    adequacy_decision_exists = derive_eu_adequacy_decision_exists(
        target_country,
        merged_data,
    )
    is_third_country_transfer = derive_is_third_country_transfer(
        data_subject_region=data_subject_region,
        target_country=target_country,
    )
    transfer_safeguards_available = derive_transfer_safeguards_available(merged_data)
    baseline_security_controls_ready = derive_baseline_security_controls_ready(
        merged_data
    )

    return {
        "target_country": target_country,
        "target_country_known": target_country is not None,
        "adequacy_decision_exists": adequacy_decision_exists,
        "eu_adequacy_decision_exists": adequacy_decision_exists,
        "adequacy_scope_confirmed": (
            merged_data.get("recipient_us_dpf_certified") is True
            if target_country == "US"
            else adequacy_decision_exists
        ),
        "adequacy_decision_country_only": (
            target_country is not None
            and target_country != "US"
            and adequacy_decision_exists
        ),
        "is_third_country_transfer": is_third_country_transfer,
        "transfer_safeguards_available": transfer_safeguards_available,
        "baseline_security_controls_ready": baseline_security_controls_ready,
    }


def build_taiwan_pdpa_derived_fields(merged_data: Dict[str, Any]) -> Dict[str, Any]:
    target_region = merged_data.get("target_region")
    target_country = derive_target_country(target_region)
    transfer_outside_taiwan = derive_transfer_outside_country(target_country, "TW")
    baseline_security_controls_ready = derive_baseline_security_controls_ready(
        merged_data
    )
    cross_border_transfer = merged_data.get("cross_border_transfer")
    if cross_border_transfer is None:
        cross_border_transfer = transfer_outside_taiwan

    return {
        "target_country": target_country,
        "target_country_known": target_country is not None,
        "transfer_outside_taiwan": transfer_outside_taiwan,
        "cross_border_transfer": cross_border_transfer,
        "baseline_security_controls_ready": baseline_security_controls_ready,
        "article21_restriction_risk_present": derive_taiwan_article21_restriction_risk_present(
            merged_data
        ),
    }


def build_lgpd_derived_fields(merged_data: Dict[str, Any]) -> Dict[str, Any]:
    target_region = merged_data.get("target_region")
    target_country = derive_target_country(target_region)
    transfer_outside_brazil = derive_transfer_outside_country(target_country, "BR")
    data_subject_connection = merged_data.get("data_subject_connection")
    lgpd_scope_applies = data_subject_connection in {
        "BRAZIL_RESIDENT",
        "COLLECTED_IN_BRAZIL",
        "OFFER_GOODS_OR_SERVICES_IN_BRAZIL",
        "PROCESSING_IN_BRAZIL",
    }

    return {
        "target_country": target_country,
        "target_country_known": target_country is not None,
        "transfer_outside_brazil": transfer_outside_brazil,
        "lgpd_scope_applies": lgpd_scope_applies,
        "appropriate_transfer_mechanism_available": derive_lgpd_appropriate_transfer_mechanism_available(
            merged_data
        ),
        "baseline_security_controls_ready": derive_baseline_security_controls_ready(
            merged_data
        ),
        "international_transfer_transparency_required": transfer_outside_brazil,
    }


def build_korea_pipa_derived_fields(merged_data: Dict[str, Any]) -> Dict[str, Any]:
    target_region = merged_data.get("target_region")
    target_country = derive_target_country(target_region)
    transfer_outside_korea = derive_transfer_outside_country(target_country, "KR")

    return {
        "target_country": target_country,
        "target_country_known": target_country is not None,
        "transfer_outside_korea": transfer_outside_korea,
        "is_third_country_transfer": transfer_outside_korea,
        "baseline_security_controls_ready": derive_baseline_security_controls_ready(
            merged_data
        ),
        "pipa_transfer_basis_available": derive_pipa_transfer_basis_available(
            merged_data
        ),
    }


def build_saudi_pdpl_derived_fields(merged_data: Dict[str, Any]) -> Dict[str, Any]:
    target_region = merged_data.get("target_region")
    target_country = derive_target_country(target_region)
    transfer_outside_kingdom = derive_saudi_transfer_outside_kingdom(target_country)
    appropriate_safeguards_available = derive_saudi_appropriate_safeguards_available(
        merged_data
    )
    baseline_security_controls_ready = derive_baseline_security_controls_ready(
        merged_data
    )
    transfer_risk_assessment_required = derive_saudi_transfer_risk_assessment_required(
        merged_data=merged_data,
        transfer_outside_kingdom=transfer_outside_kingdom,
        appropriate_safeguards_available=appropriate_safeguards_available,
    )

    return {
        "target_country": target_country,
        "target_country_known": target_country is not None,
        "transfer_outside_kingdom": transfer_outside_kingdom,
        "appropriate_safeguards_available": appropriate_safeguards_available,
        "baseline_security_controls_ready": baseline_security_controls_ready,
        "transfer_risk_assessment_required": transfer_risk_assessment_required,
    }


def build_derived_fields(
    merged_data: Dict[str, Any],
    schema: Dict[str, Any],
) -> Dict[str, Any]:
    schema_id = str(schema.get("schema_id", "")).lower()

    if schema_id.startswith("saudi_pdpl"):
        return build_saudi_pdpl_derived_fields(merged_data)

    if schema_id.startswith(("taiwan", "taiwan_pdpa")):
        return build_taiwan_pdpa_derived_fields(merged_data)

    if schema_id.startswith(("lgpd", "brazil_lgpd")):
        return build_lgpd_derived_fields(merged_data)

    if schema_id.startswith("pipa"):
        return build_korea_pipa_derived_fields(merged_data)

    return build_gdpr_derived_fields(merged_data)
