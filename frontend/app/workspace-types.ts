export type DecisionGrade =
  | "deny"
  | "manual_review"
  | "condition_allow"
  | "allow";

export type JsonObject = Record<string, unknown>;

export type FieldOption = {
  value: string;
  label: string;
  description?: string;
};

export type DemoScenario = {
  scenario_id: string;
  name: string;
  description: string;
  expected_decision: DecisionGrade;
  aws_data: JsonObject;
  policy_data: JsonObject;
};

export type DemoScenarioListResponse = {
  scenarios: DemoScenario[];
};

export type PackSummary = {
  pack_id: string;
  pack_name: string;
  jurisdiction: string;
  version: string;
  description: string;
  rule_count: number;
  supported_decisions: DecisionGrade[];
  covered_categories: string[];
  disclaimer: string;
};

export type MergeResponse = {
  message: string;
  merged_input: JsonObject;
};

export type CloudEvidenceItem = {
  field: string;
  value: unknown;
  source: string;
  confidence: "high" | "medium" | "low" | "unknown";
};

export type CloudDiscoveryResponse = {
  provider: "aws" | "azure";
  resource_type: string;
  resource_id: string;
  normalized_cloud_data: JsonObject;
  normalized_aws_data: JsonObject;
  evidence: CloudEvidenceItem[];
  warnings: string[];
  raw_discovery?: JsonObject | null;
};

export type AwsConnectionStartResponse = {
  connection_id: string;
  external_id: string;
  cloudformation_url: string;
};

export type AwsConnectionCompleteResponse = {
  connection_id: string;
  status: "connected";
  role_arn: string;
  caller_identity: JsonObject;
};

export type AwsS3CheckResponse = {
  provider: "aws";
  resource_type: "s3_bucket";
  resource_id: string;
  normalized_cloud_data: JsonObject;
  normalized_aws_data: JsonObject;
  missing_items: string[];
  warnings: string[];
  evidence: JsonObject[];
  raw_discovery: JsonObject;
};

export type PackDetail = {
  pack_id: string;
  pack_name: string;
  jurisdiction: string;
  version: string;
  description: string;
  supported_decisions: DecisionGrade[];
  decision_model: {
    precedence: DecisionGrade[];
    method?: string;
    explanation?: string;
  };
  source_references: string[];
  assumptions: string[];
  limitations: string[];
  disclaimer: string;
  rule_count: number;
  covered_categories: string[];
  review_guidance: string[];
  sample_scenarios: Array<{
    scenario_id: string;
    name: string;
    expected_decision: DecisionGrade;
  }>;
};

export type EvaluationResult = {
  final_decision: DecisionGrade;
  summary: string;
  explanation: string;
  legal_basis_articles: string[];
  required_actions: string[];
  next_steps: string[];
  qualitative_review_hints: {
    manual_review_recommended: boolean;
    ambiguity_summary: string;
    evidence_gaps: string[];
    reviewer_checklist: string[];
  };
  triggered_rules: Array<{
    rule_id: string;
    article: string;
    title: string;
    category: string;
    priority: number;
    decision: DecisionGrade;
    message: string;
    rationale: string;
    matched_facts: string[];
    required_evidence: string[];
    required_actions: string[];
    references: string[];
    reviewer_notes: string[];
  }>;
  pack_info: {
    pack_id: string;
    pack_name: string;
    jurisdiction: string;
    version: string;
    description: string;
  };
  evaluation_trace: {
    decision_order: DecisionGrade[];
    evaluated_rule_count: number;
    matched_rule_count: number;
    strictest_triggered_decision: DecisionGrade;
    input_observations: string[];
    rule_results: Array<{
      rule_id: string;
      title: string;
      category: string;
      matched: boolean;
      decision?: DecisionGrade | null;
      reasoning: string[];
    }>;
  };
  merged_input: JsonObject;
};

export const decisionMeta: Record<
  DecisionGrade,
  { label: string; className: string; description: string }
> = {
  deny: {
    label: "승인 불가",
    className:
      "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    description: "현재 사실관계로는 진행을 승인하기 어렵습니다.",
  },
  manual_review: {
    label: "수동 검토",
    className:
      "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    description: "증빙 또는 해석 공백이 있어 사람이 확인해야 합니다.",
  },
  condition_allow: {
    label: "조건부 허용",
    className:
      "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
    description: "핵심 경로는 있으나 실행 전 보완 조치가 필요합니다.",
  },
  allow: {
    label: "허용 가능",
    className:
      "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]",
    description: "현재 입력 범위에서는 주요 요건이 확인됩니다.",
  },
};

export type FormState = {
  dataset_name: string;
  data_type: string;
  data_subject_region: string;
  current_region: string;
  target_region: string;
  processing_purpose_defined: string;
  data_minimized: string;
  retention_period_defined: string;
  lawful_basis: string;
  contains_sensitive_data: string;
  special_category_condition_met: string;
  uses_processor: string;
  controller_processor_roles_defined: string;
  dpa_in_place: string;
  processor_sufficient_guarantees: string;
  scc_in_place: string;
  bcr_in_place: string;
  other_safeguards_in_place: string;
  transfer_impact_assessment_completed: string;
  supplemental_measures_documented: string;
  encryption_at_rest: string;
  encryption_in_transit: string;
  access_control_in_place: string;
  incident_response_in_place: string;
  derogation_used: string;
  derogation_type: string;
  privacy_notice_updated: string;
  transfer_disclosed_to_subject: string;
  records_of_processing_exists: string;
  transfer_documented_in_ropa: string;
};
