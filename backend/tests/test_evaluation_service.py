import unittest

from app.services.file_loader import load_json_file

from app.services.evaluation_service import evaluate_rules
from app.services.pack_loader import list_supported_pack_ids, load_gdpr_pack, load_pack
from app.utils.path_helper import get_sample_input_path
from app.services.request_merge_service import build_merged_input_from_request


def build_base_input() -> dict:
    return {
        "dataset_name": "demo-dataset",
        "scenario_notes": "unit-test scenario",
        "data_subject_region": "EU",
        "current_region": "eu-central-1",
        "target_region": "ap-northeast-2",
        "target_country": "KR",
        "target_country_known": True,
        "adequacy_decision_exists": True,
        "is_third_country_transfer": True,
        "processing_purpose_defined": True,
        "data_minimized": True,
        "retention_period_defined": True,
        "lawful_basis": "contract",
        "contains_sensitive_data": False,
        "special_category_condition_met": None,
        "uses_processor": True,
        "controller_processor_roles_defined": True,
        "dpa_in_place": True,
        "processor_sufficient_guarantees": True,
        "subprocessor_controls_in_place": True,
        "scc_in_place": False,
        "bcr_in_place": False,
        "other_safeguards_in_place": False,
        "transfer_safeguards_available": False,
        "transfer_impact_assessment_completed": None,
        "supplemental_measures_documented": None,
        "dpia_required": False,
        "dpia_completed": None,
        "dpo_required": False,
        "dpo_assigned": None,
        "encryption_at_rest": True,
        "encryption_in_transit": True,
        "access_control_in_place": True,
        "baseline_security_controls_ready": True,
        "incident_response_in_place": True,
        "breach_notification_ready_72h": True,
        "derogation_used": False,
        "derogation_type": None,
        "privacy_notice_updated": True,
        "transfer_disclosed_to_subject": True,
        "records_of_processing_exists": True,
        "transfer_documented_in_ropa": True,
        "data_subject_rights_process_ready": True,
        "privacy_by_design_review_completed": True,
    }


def build_saudi_base_input() -> dict:
    return {
        "dataset_name": "ksa-dataset",
        "data_subject_connection": "KSA_RESIDENT",
        "current_region": "sa-riyadh-dc",
        "target_region": "sa-jeddah-dc",
        "target_country": "SA",
        "target_country_known": True,
        "transfer_outside_kingdom": False,
        "processing_purpose_defined": True,
        "data_minimized": True,
        "retention_period_defined": True,
        "processing_legal_basis": "consent",
        "contains_sensitive_data": False,
        "explicit_consent_for_sensitive_data": None,
        "privacy_policy_available": True,
        "data_subject_rights_request_ready": True,
        "consent_withdrawal_process_ready": True,
        "data_accuracy_review_completed": True,
        "privacy_notice_available": True,
        "cross_border_notice_provided": True,
        "adequate_protection_confirmed": None,
        "binding_common_rules_approved": False,
        "standard_contractual_clauses_in_place": False,
        "certification_or_code_in_place": False,
        "appropriate_safeguards_available": False,
        "transfer_exception_used": False,
        "transfer_exception_type": None,
        "transfer_risk_assessment_completed": None,
        "transfer_risk_assessment_required": False,
        "large_scale_or_continuous_transfer": False,
        "uses_processor": True,
        "processor_agreement_in_place": True,
        "processor_compliance_verified": True,
        "subprocessor_or_onward_transfer_controls": True,
        "records_of_processing_exists": True,
        "dpo_required": False,
        "dpo_assigned": None,
        "processing_impact_assessment_completed": True,
        "encryption_at_rest": True,
        "encryption_in_transit": True,
        "access_control_in_place": True,
        "baseline_security_controls_ready": True,
        "breach_response_72h_ready": True,
    }


class EvaluationServiceTests(unittest.TestCase):
    def test_deny_precedence_over_other_decisions(self):
        pack_data = load_gdpr_pack("gdpr_pack_v3.json")
        merged_input = build_base_input()
        merged_input["lawful_basis"] = None

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["final_decision"], "deny")
        self.assertIn("GDPR Art. 6", result["legal_basis_articles"])

    def test_manual_review_precedence_over_allow(self):
        pack_data = load_gdpr_pack("gdpr_pack_v3.json")
        merged_input = build_base_input()
        merged_input["contains_sensitive_data"] = True
        merged_input["special_category_condition_met"] = None

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["final_decision"], "manual_review")
        self.assertTrue(result["qualitative_review_hints"]["manual_review_recommended"])

    def test_gdpr_pack_requires_manual_review_when_dpia_is_missing(self):
        pack_data = load_gdpr_pack("gdpr_pack_v3.json")
        merged_input = build_base_input()
        merged_input["dpia_required"] = True
        merged_input["dpia_completed"] = False

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["final_decision"], "manual_review")
        self.assertIn("GDPR Art. 35", result["legal_basis_articles"])

    def test_condition_allow_precedence_over_allow(self):
        pack_data = load_gdpr_pack("gdpr_pack_v3.json")
        merged_input = build_base_input()
        merged_input["retention_period_defined"] = False

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["final_decision"], "condition_allow")
        self.assertIn("GDPR Art. 5", result["legal_basis_articles"])

    def test_beginner_unknown_core_answers_are_accepted_by_schema(self):
        merged_input = build_merged_input_from_request(
            pack_id="gdpr",
            aws_data={
                "current_region": "eu-central-1",
                "encryption_at_rest": None,
                "data_type": "customer_profiles",
                "contains_sensitive_data": None,
                "uses_processor": None,
                "encryption_in_transit": None,
                "access_control_in_place": None,
            },
            policy_data={
                "dataset_name": "beginner-dataset",
                "data_subject_region": "EU",
                "processing_purpose_defined": None,
                "data_minimized": None,
                "retention_period_defined": None,
                "lawful_basis": None,
                "target_region": "us-east-1",
                "derogation_used": None,
            },
        )

        self.assertIsNone(merged_input["processing_purpose_defined"])
        self.assertIsNone(merged_input["encryption_at_rest"])
        self.assertIsNone(merged_input["derogation_used"])

    def test_unknown_transfer_mechanism_routes_to_manual_review(self):
        pack_data = load_gdpr_pack("gdpr_pack_v3.json")
        merged_input = build_base_input()
        merged_input["target_region"] = "us-east-1"
        merged_input["target_country"] = "US"
        merged_input["adequacy_decision_exists"] = False
        merged_input["is_third_country_transfer"] = True
        merged_input["derogation_used"] = None

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["final_decision"], "manual_review")
        self.assertIn("GDPR Art. 44", result["legal_basis_articles"])

    def test_uk_data_subject_scope_routes_to_manual_review(self):
        pack_data = load_gdpr_pack("gdpr_pack_v3.json")
        merged_input = build_base_input()
        merged_input["data_subject_region"] = "UK"

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["final_decision"], "manual_review")
        self.assertIn(
            "gdpr-uk-scope-manual-review",
            [rule["rule_id"] for rule in result["triggered_rules"]],
        )

    def test_required_actions_are_deduplicated(self):
        merged_input = build_base_input()
        merged_input["flag_a"] = True
        merged_input["flag_b"] = True

        pack_data = {
            "pack_id": "test-pack",
            "pack_name": "Test Pack",
            "jurisdiction": "EU",
            "version": "1.0.0",
            "description": "Deduplication test pack",
            "supported_decisions": [
                "deny",
                "manual_review",
                "condition_allow",
                "allow",
            ],
            "decision_model": {
                "precedence": [
                    "deny",
                    "manual_review",
                    "condition_allow",
                    "allow",
                ]
            },
            "source_references": [],
            "assumptions": [],
            "limitations": [],
            "disclaimer": "test",
            "review_guidance": [],
            "sample_scenarios": [],
            "rules": [
                {
                    "rule_id": "rule-a",
                    "article": "GDPR Art. 44",
                    "title": "Rule A",
                    "category": "test",
                    "priority": 10,
                    "decision": "condition_allow",
                    "when": {"field": "flag_a", "eq": True},
                    "required_evidence": [],
                    "required_actions": ["같은 조치를 한 번만 보여주세요."],
                    "message": "rule a",
                    "references": [],
                },
                {
                    "rule_id": "rule-b",
                    "article": "GDPR Art. 46",
                    "title": "Rule B",
                    "category": "test",
                    "priority": 9,
                    "decision": "allow",
                    "when": {"field": "flag_b", "eq": True},
                    "required_evidence": [],
                    "required_actions": ["같은 조치를 한 번만 보여주세요."],
                    "message": "rule b",
                    "references": [],
                },
            ],
        }

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["required_actions"], ["같은 조치를 한 번만 보여주세요."])

    def test_response_does_not_expose_score_fields(self):
        pack_data = load_gdpr_pack("gdpr_pack_v3.json")
        merged_input = build_base_input()
        merged_input["privacy_notice_updated"] = False

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertIn("final_decision", result)
        self.assertNotIn("risk_score", result)
        self.assertNotIn("risk_level", result)
        self.assertNotIn("total_risk_score", result)

    def test_saudi_pack_allows_in_country_path(self):
        pack_data = load_pack("saudi_pdpl")
        merged_input = build_saudi_base_input()

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["final_decision"], "allow")
        self.assertIn("PDPL Art. 29", result["legal_basis_articles"])

    def test_saudi_pack_denies_missing_transfer_path(self):
        pack_data = load_pack("saudi_pdpl")
        merged_input = build_saudi_base_input()
        merged_input["target_region"] = "us-east-1"
        merged_input["target_country"] = "US"
        merged_input["transfer_outside_kingdom"] = True

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["final_decision"], "deny")
        self.assertIn(
            "PDPL Art. 29 / Transfer Regulation Art. 5 / Art. 6",
            result["legal_basis_articles"],
        )

    def test_saudi_unknown_transfer_path_routes_to_manual_review(self):
        pack_data = load_pack("saudi_pdpl")
        merged_input = build_saudi_base_input()
        merged_input["target_region"] = "us-east-1"
        merged_input["target_country"] = "US"
        merged_input["transfer_outside_kingdom"] = True
        merged_input["transfer_exception_used"] = None

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["final_decision"], "manual_review")
        self.assertIn(
            "PDPL Art. 29 / Transfer Regulation Art. 5 / Art. 6",
            result["legal_basis_articles"],
        )

    def test_saudi_pack_condition_allow_when_rights_workflow_is_missing(self):
        pack_data = load_pack("saudi_pdpl")
        merged_input = build_saudi_base_input()
        merged_input["data_subject_rights_request_ready"] = False

        result = evaluate_rules(merged_input=merged_input, pack_data=pack_data)

        self.assertEqual(result["final_decision"], "condition_allow")
        self.assertIn("PDPL Art. 4 / Art. 21", result["legal_basis_articles"])

    def test_lgpd_merge_derives_transfer_mechanism_fields(self):
        merged_input = build_merged_input_from_request(
            pack_id="lgpd",
            aws_data={
                "current_region": "sa-east-1",
                "encryption_at_rest": True,
                "data_type": "customer_profiles",
                "contains_sensitive_data": False,
                "uses_processor": False,
                "encryption_in_transit": True,
                "access_control_in_place": True,
            },
            policy_data={
                "dataset_name": "br-dataset",
                "data_subject_connection": "BRAZIL_RESIDENT",
                "processing_purpose_defined": True,
                "data_minimized": True,
                "retention_period_defined": True,
                "processing_legal_basis": "contract_or_precontract",
                "target_region": "us-east-1",
                "adequacy_decision_confirmed": False,
                "standard_contractual_clauses_in_place": True,
                "standard_contractual_clauses_full_unaltered": True,
                "transfer_exception_used": False,
            },
        )

        self.assertTrue(merged_input["transfer_outside_brazil"])
        self.assertTrue(merged_input["appropriate_transfer_mechanism_available"])
        self.assertTrue(merged_input["baseline_security_controls_ready"])

    def test_pipa_merge_derives_cross_border_transfer_basis(self):
        merged_input = build_merged_input_from_request(
            pack_id="korea_pipa",
            aws_data={
                "current_region": "ap-northeast-2",
                "encryption_at_rest": True,
                "encryption_in_transit": True,
                "access_control_in_place": True,
                "data_type": "customer_profiles",
                "contains_sensitive_data": False,
                "has_unique_identifier": False,
                "uses_resident_registration_number": False,
                "uses_processor": False,
                "is_automated_decision_only": False,
            },
            policy_data={
                "dataset_name": "kr-dataset",
                "target_region": "us-east-1",
                "lawful_basis": "contract",
                "separate_consent_for_transfer": True,
            },
        )

        self.assertTrue(merged_input["transfer_outside_korea"])
        self.assertTrue(merged_input["is_third_country_transfer"])
        self.assertTrue(merged_input["pipa_transfer_basis_available"])

        result = evaluate_rules(merged_input, load_pack("korea_pipa"))
        self.assertTrue(
            all(isinstance(article, str) for article in result["legal_basis_articles"])
        )

    def test_taiwan_merge_derives_cross_border_when_not_supplied(self):
        merged_input = build_merged_input_from_request(
            pack_id="taiwan",
            aws_data={
                "current_region": "tw-taipei-dc",
                "encryption_at_rest": True,
                "data_type": "customer_profiles",
                "contains_article6_sensitive_data": False,
                "uses_commissioned_processor": False,
                "encryption_in_transit": True,
                "access_control_in_place": True,
            },
            policy_data={
                "dataset_name": "tw-dataset",
                "agency_type": "non_government_agency",
                "specific_purpose_defined": True,
                "collection_processing_basis": "data_subject_consent",
                "collected_directly_from_data_subject": True,
                "article8_notice_provided": True,
                "data_subject_rights_request_ready": True,
                "retention_period_defined": True,
                "security_maintenance_measures_ready": True,
                "target_region": "us-east-1",
            },
        )

        self.assertTrue(merged_input["transfer_outside_taiwan"])
        self.assertTrue(merged_input["cross_border_transfer"])
        self.assertEqual(merged_input["target_country"], "US")

    def test_pack_registry_and_json_pack_ids_match(self):
        for pack_id in list_supported_pack_ids():
            self.assertEqual(load_pack(pack_id)["pack_id"], pack_id)

    def test_gdpr_us_dpf_certification_can_confirm_adequacy_scope(self):
        merged_input = build_merged_input_from_request(
            pack_id="gdpr",
            aws_data={
                "current_region": "eu-central-1",
                "encryption_at_rest": True,
                "data_type": "customer_records",
                "contains_sensitive_data": False,
                "uses_processor": False,
                "encryption_in_transit": True,
                "access_control_in_place": True,
            },
            policy_data={
                "dataset_name": "eu-us-dpf",
                "data_subject_region": "EU",
                "processing_purpose_defined": True,
                "data_minimized": True,
                "retention_period_defined": True,
                "lawful_basis": "contract",
                "target_region": "us-east-1",
                "derogation_used": False,
                "recipient_us_dpf_certified": True,
            },
        )

        self.assertTrue(merged_input["adequacy_decision_exists"])
        self.assertTrue(merged_input["eu_adequacy_decision_exists"])
        self.assertTrue(merged_input["adequacy_scope_confirmed"])
        self.assertFalse(merged_input["adequacy_decision_country_only"])

    def test_no_triggered_rules_routes_to_manual_review(self):
        pack_data = {
            "pack_id": "test-pack",
            "pack_name": "Test Pack",
            "jurisdiction": "TEST",
            "version": "1.0.0",
            "description": "No match test pack",
            "supported_decisions": ["deny", "manual_review", "condition_allow", "allow"],
            "decision_model": {
                "precedence": ["deny", "manual_review", "condition_allow", "allow"]
            },
            "rules": [
                {
                    "rule_id": "never",
                    "article": "test",
                    "title": "Never",
                    "category": "test",
                    "priority": 1,
                    "decision": "allow",
                    "when": {"field": "explicit_allow", "eq": True},
                    "required_evidence": [],
                    "required_actions": [],
                    "message": "explicit allow",
                    "references": [],
                }
            ],
        }

        result = evaluate_rules({"explicit_allow": False}, pack_data)

        self.assertEqual(result["final_decision"], "manual_review")
        self.assertEqual(result["evaluation_trace"]["matched_rule_count"], 0)

    def test_unknown_pipa_target_country_routes_to_manual_review(self):
        merged_input = build_merged_input_from_request(
            pack_id="korea_pipa",
            aws_data={
                "current_region": "ap-northeast-2",
                "encryption_at_rest": True,
                "encryption_in_transit": True,
                "access_control_in_place": True,
                "data_type": "customer_profiles",
                "contains_sensitive_data": False,
                "has_unique_identifier": False,
                "uses_resident_registration_number": False,
                "uses_processor": False,
                "is_automated_decision_only": False,
            },
            policy_data={
                "dataset_name": "kr-unknown-region",
                "target_region": "unknown-region",
                "lawful_basis": "contract",
            },
        )

        result = evaluate_rules(merged_input, load_pack("korea_pipa"))

        self.assertFalse(merged_input["target_country_known"])
        self.assertEqual(result["final_decision"], "manual_review")
        self.assertIn("common-target-country-unknown-review", [
            rule["rule_id"] for rule in result["triggered_rules"]
        ])

    def test_demo_scenario_expected_decisions_match_actual_decisions(self):
        scenarios = load_json_file(get_sample_input_path() / "demo_scenarios.json")[
            "scenarios"
        ]

        for scenario in scenarios:
            with self.subTest(scenario=scenario["scenario_id"]):
                merged_input = build_merged_input_from_request(
                    pack_id="gdpr",
                    aws_data=scenario["aws_data"],
                    policy_data=scenario["policy_data"],
                )
                result = evaluate_rules(merged_input, load_pack("gdpr"))
                self.assertEqual(
                    result["final_decision"],
                    scenario["expected_decision"],
                )


if __name__ == "__main__":
    unittest.main()
