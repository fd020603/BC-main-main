import {
  dataTypeOptions,
  datasetOptions,
  derogationTypeOptions,
  euRegionOptions,
  lawfulBasisOptions,
  targetRegionOptions,
} from "./workspace-form-config";
import { getOptionLabel, toNullableBoolean, toRequiredBoolean } from "./workspace-runtime";
import type { FieldOption } from "./workspace-types";
import type { GuidedField, GuidedFormState, PackUiDefinition } from "./guided-pack-types";

// 🇹🇼 대만 특화 선택지
const taiwanAgencyOptions: FieldOption[] = [
  { value: "government_agency", label: "공공 기관(정부)", description: "정부 및 공공 부문 기관입니다." },
  { value: "non_government_agency", label: "비공공 기관(일반 기업)", description: "일반 민간 기업 및 단체입니다." },
];

const taiwanBasisOptions: FieldOption[] = [
  { value: "law_expressly_required", label: "법률상 명시 요구", description: "법률이 수집 또는 처리를 명시적으로 요구하는 경우입니다." },
  { value: "statutory_duty_or_obligation", label: "법정 직무 또는 의무", description: "공공기관의 법정 직무 또는 법령상 의무 이행에 필요한 경우입니다." },
  { value: "contract_or_quasi_contract_with_security", label: "계약·준계약 및 보안조치", description: "계약 또는 준계약 관계에서 필요하고 적절한 보안조치가 있는 경우입니다." },
  { value: "data_subject_consent", label: "정보주체 동의", description: "정보주체의 동의를 근거로 수집 또는 처리하는 경우입니다." },
  { value: "publicly_disclosed_by_subject_or_lawfully_public", label: "정보주체 공개 또는 적법 공개", description: "정보주체가 공개했거나 법률상 공개된 개인정보를 이용하는 경우입니다." },
  { value: "academic_or_statistical_research_deidentified", label: "학술·통계 연구 비식별", description: "공익 목적 연구 또는 통계 목적이며 특정 개인을 식별할 수 없도록 처리하는 경우입니다." },
  { value: "public_interest", label: "공익 목적", description: "공공의 이익을 위해 필요한 처리입니다." },
  { value: "publicly_available_source", label: "공개 출처", description: "합법적으로 공개된 출처의 개인정보를 이용하는 경우입니다." },
  { value: "no_infringement_of_rights", label: "권익 침해 없음", description: "정보주체의 권익을 침해하지 않는 범위에서 처리하는 경우입니다." },
  { value: "beneficial_to_data_subject", label: "정보주체 이익", description: "정보주체에게 이익이 되는 처리입니다." },
  { value: "vital_or_harm_prevention", label: "중대한 위해 방지", description: "생명·신체·자유·재산상 위해 방지에 필요한 경우입니다." },
  { value: "other_legal_basis", label: "기타 법적 근거", description: "그 밖에 적용 가능한 법적 근거가 문서화된 경우입니다." },
];

// 🇧🇷 브라질 특화 선택지
const lgpdBasisOptions: FieldOption[] = [
  { value: "consent", label: "동의 (제7조 I항)", description: "정보주체의 특정하고 명시적인 동의가 있습니다." },
  { value: "legal_or_regulatory_obligation", label: "법률·규제 의무", description: "법률 또는 규제상 의무 준수를 위한 처리입니다." },
  { value: "public_policy", label: "공공정책 수행", description: "공공행정의 공공정책 수행에 필요한 처리입니다." },
  { value: "research", label: "연구 목적", description: "연구기관의 연구 목적 처리입니다." },
  { value: "contract_or_precontract", label: "계약·계약 전 절차", description: "정보주체가 당사자인 계약 이행 또는 계약 전 절차에 필요한 처리입니다." },
  { value: "judicial_administrative_arbitration", label: "소송·행정·중재 절차", description: "권리 행사 또는 방어를 위한 사법·행정·중재 절차상 처리입니다." },
  { value: "life_or_physical_safety", label: "생명·신체 안전", description: "정보주체 또는 제3자의 생명·신체 안전 보호에 필요한 처리입니다." },
  { value: "health_protection", label: "건강 보호", description: "보건 전문가 또는 보건 서비스의 건강 보호 목적 처리입니다." },
  { value: "legitimate_interest", label: "정당한 이익 (제7조 IX항)", description: "컨트롤러의 정당한 이익을 위해 필요합니다." },
  { value: "credit_protection", label: "신용 보호", description: "신용 보호를 위한 처리입니다." },
];

const pipaLawfulBasisOptions: FieldOption[] = [
  {
    value: "consent",
    label: "동의",
    description: "정보주체의 동의를 받은 경우입니다.",
  },
  {
    value: "statutory_basis",
    label: "법령상 근거",
    description: "법률에 특별한 규정이 있거나 법령상 의무 준수에 필요한 경우입니다.",
  },
  {
    value: "public_task",
    label: "공공업무 수행",
    description: "공공기관이 법령 등에서 정한 소관 업무 수행을 위해 필요한 경우입니다.",
  },
  {
    value: "contract",
    label: "계약 이행",
    description: "계약 체결 또는 이행을 위해 필요한 경우입니다.",
  },
  {
    value: "vital_interest",
    label: "급박한 생명·신체·재산상 이익",
    description: "정보주체 또는 제3자의 급박한 생명, 신체, 재산상 이익을 위해 필요한 경우입니다.",
  },
  {
    value: "legitimate_interest",
    label: "정당한 이익",
    description: "개인정보처리자의 정당한 이익 달성을 위해 필요한 경우입니다.",
  },
  {
    value: "public_safety",
    label: "공중위생 등 공공 안전",
    description: "공중위생 등 공공 안전을 위해 긴급히 필요한 경우입니다.",
  },
  {
    value: "unknown",
    label: "잘 모르겠음",
    description: "수집·이용 적법근거가 아직 확정되지 않은 상태입니다.",
  },
];

const taiwanSensitiveDataBasisOptions: FieldOption[] = [
  { value: "law_expressly_required", label: "법률상 명시 요구" },
  { value: "statutory_duty_or_legal_obligation_with_security", label: "법정 직무·의무 및 보안조치" },
  { value: "publicly_disclosed_by_subject_or_lawfully_public", label: "정보주체 공개 또는 적법 공개" },
  { value: "health_public_health_crime_prevention_research_deidentified", label: "보건·공중위생·범죄예방·비식별 연구" },
  { value: "assist_statutory_duty_or_obligation_with_security", label: "법정 직무 보조 및 보안조치" },
  { value: "written_consent", label: "서면 동의" },
];

const taiwanOutsidePurposeBasisOptions: FieldOption[] = [
  { value: "law_expressly_required", label: "법률상 명시 요구" },
  { value: "national_security_or_public_interest", label: "국가안보 또는 공익" },
  { value: "prevent_harm_to_life_body_freedom_property", label: "생명·신체·자유·재산 위해 방지" },
  { value: "prevent_material_harm_to_others", label: "타인 중대한 권익 침해 방지" },
  { value: "academic_or_statistical_research_deidentified", label: "학술·통계 연구 비식별" },
  { value: "consent", label: "정보주체 동의" },
  { value: "beneficial_to_data_subject", label: "정보주체 이익" },
];

const lgpdSensitiveBasisOptions: FieldOption[] = [
  { value: "consent", label: "특정·강조 동의" },
  { value: "legal_or_regulatory_obligation", label: "법률·규제 의무" },
  { value: "public_policy", label: "공공정책 수행" },
  { value: "research", label: "연구 목적" },
  { value: "judicial_administrative_arbitration", label: "소송·행정·중재 절차" },
  { value: "life_or_physical_safety", label: "생명·신체 안전" },
  { value: "health_protection", label: "건강 보호" },
  { value: "fraud_prevention_security", label: "사기 방지·보안" },
];

const lgpdTransferExceptionTypeOptions: FieldOption[] = [
  { value: "international_legal_cooperation", label: "국제 법집행·협력" },
  { value: "life_or_physical_safety", label: "생명·신체 안전 보호" },
  { value: "anpd_authorization", label: "ANPD 승인" },
  { value: "public_policy", label: "공공정책 수행" },
  { value: "specific_informed_consent_for_international_transfer", label: "국제이전 특정·고지 동의" },
  { value: "legal_obligation_contract_or_judicial", label: "법적 의무·계약·소송" },
  { value: "research", label: "연구 목적" },
];

const pipaSensitiveDataBasisOptions: FieldOption[] = [
  { value: "explicit_consent", label: "명시적 동의" },
  { value: "statutory_basis", label: "법령상 근거" },
  { value: "none", label: "근거 없음" },
  { value: "unknown", label: "잘 모르겠음" },
];

const pipaUniqueIdentifierBasisOptions: FieldOption[] = [
  { value: "separate_consent", label: "별도 동의" },
  { value: "statutory_basis", label: "법령상 근거" },
  { value: "none", label: "근거 없음" },
  { value: "unknown", label: "잘 모르겠음" },
];

const yesNoOptions: FieldOption[] = [
  { value: "true", label: "예" },
  { value: "false", label: "아니오" },
];

const yesNoUnknownOptions: FieldOption[] = [
  { value: "true", label: "예" },
  { value: "false", label: "아니오" },
  { value: "unknown", label: "잘 모르겠음" },
];

const gdprLawfulBasisOptions: FieldOption[] = [
  ...lawfulBasisOptions,
  {
    value: "unknown",
    label: "잘 모르겠음",
    description: "법무나 개인정보 담당자가 아직 적법 근거를 확정하지 않은 상태입니다.",
  },
];

const gdprSubjectOptions: FieldOption[] = [
  {
    value: "EU",
    label: "EU",
    description: "프랑스, 독일, 스페인 등 EU 회원국 이용자 또는 임직원 데이터입니다.",
  },
  {
    value: "EEA",
    label: "EEA",
    description: "EU와 노르웨이, 아이슬란드, 리히텐슈타인을 포함하는 정보주체 범위입니다.",
  },
  {
    value: "UK",
    label: "UK",
    description: "영국 거주자 데이터로, UK GDPR 검토가 별도로 필요할 수 있습니다.",
  },
  {
    value: "OTHER",
    label: "기타",
    description: "EU/EEA/UK 외 지역 정보주체이거나 지역을 아직 확정하지 못한 경우입니다.",
  },
];

const saudiDatasetOptions: FieldOption[] = [
  {
    value: "ksa_customer_profiles",
    label: "사우디 고객 프로필",
    description: "사우디 고객의 이름, 연락처, 계정 상태처럼 서비스 제공에 쓰는 기본정보입니다.",
  },
  {
    value: "ksa_loyalty_events",
    label: "사우디 멤버십/이벤트 로그",
    description: "포인트 적립, 쿠폰 사용, 이벤트 참여처럼 멤버십 운영과 분석에 쓰는 로그입니다.",
  },
  {
    value: "ksa_support_cases",
    label: "사우디 고객지원 케이스",
    description: "문의 본문, 상담 이력, 처리 결과처럼 고객지원 업무에 필요한 기록입니다.",
  },
  {
    value: "ksa_employee_records",
    label: "사우디 인사 기록",
    description: "사우디 임직원 계약, 근태, 급여처럼 접근 권한과 보관기간을 엄격히 봐야 하는 데이터입니다.",
  },
  {
    value: "ksa_health_service_cases",
    label: "사우디 건강·민감 케이스",
    description: "건강, 생체, 민감 상담 등 명시적 근거와 추가 보호조치가 필요한 데이터입니다.",
  },
];

const saudiLegalBasisOptions: FieldOption[] = [
  {
    value: "consent",
    label: "동의",
    description: "고객이 특정 처리 목적을 알고 동의했으며 철회 경로도 제공되는 경우입니다.",
  },
  {
    value: "contractual_necessity",
    label: "계약 이행 필요",
    description: "배송, 예약, 고객지원처럼 고객과의 계약을 이행하려면 필요한 처리입니다.",
  },
  {
    value: "legal_obligation",
    label: "법적 의무",
    description: "세금, 회계, 규제 보고처럼 법령상 보관하거나 제출해야 하는 처리입니다.",
  },
  {
    value: "public_interest",
    label: "공익 또는 공공업무",
    description: "공공기관 업무나 법에서 인정하는 공익 목적과 연결된 처리입니다.",
  },
  {
    value: "vital_interest",
    label: "중대한 이익 보호",
    description: "생명, 건강, 안전을 보호하기 위해 긴급히 필요한 예외적 처리입니다.",
  },
  {
    value: "legitimate_interest",
    label: "정당한 이익",
    description: "부정사용 방지나 보안처럼 이익형량이 필요하며, 민감정보에는 쓰기 어렵습니다.",
  },
  {
    value: "unknown",
    label: "잘 모르겠음",
    description: "처리 근거가 아직 문서화되지 않았거나 담당자 확인이 필요한 상태입니다.",
  },
];

const dataSubjectConnectionOptions: FieldOption[] = [
  {
    value: "KSA_RESIDENT",
    label: "사우디 거주자 데이터",
    description: "사우디 거주 고객, 직원, 환자 등 사우디 정보주체의 데이터입니다.",
  },
  {
    value: "COLLECTED_IN_KSA",
    label: "사우디 내 수집 데이터",
    description: "사우디 매장, 앱, 현지 캠페인에서 수집된 개인정보입니다.",
  },
  {
    value: "OTHER",
    label: "사우디 연결성 불명확",
    description: "사우디 거주자 여부나 수집 위치가 아직 확정되지 않은 경우입니다.",
  },
];

const lgpdDataSubjectConnectionOptions: FieldOption[] = [
  {
    value: "BRAZIL_RESIDENT",
    label: "브라질 거주자 데이터",
    description: "브라질 거주 고객, 직원, 이용자 등의 개인정보입니다.",
  },
  {
    value: "COLLECTED_IN_BRAZIL",
    label: "브라질 내 수집 데이터",
    description: "브라질 앱, 웹사이트, 지점, 캠페인 등에서 수집된 개인정보입니다.",
  },
  {
    value: "OFFER_GOODS_OR_SERVICES_IN_BRAZIL",
    label: "브라질 대상 상품·서비스",
    description: "브라질 내 개인에게 상품이나 서비스를 제공하는 맥락의 처리입니다.",
  },
  {
    value: "PROCESSING_IN_BRAZIL",
    label: "브라질 내 처리",
    description: "처리 활동 자체가 브라질 영토 내에서 수행되는 경우입니다.",
  },
  {
    value: "OTHER",
    label: "기타 또는 불명확",
    description: "브라질과의 연결성이 아직 명확하지 않은 경우입니다.",
  },
];

const saudiTransferExceptionTypeOptions: FieldOption[] = [
  {
    value: "data_subject_contract",
    label: "정보주체 계약 이행 필요",
    description: "해외 예약, 배송, 지원처럼 정보주체와의 계약상 꼭 필요한 제한적 이전입니다.",
  },
  {
    value: "public_interest_public_entity",
    label: "공공기관 공익 목적",
    description: "공공기관이 법적 권한에 따라 공익 목적으로 수행하는 이전입니다.",
  },
  {
    value: "crime_detection_public_entity",
    label: "범죄 수사·집행 목적",
    description: "공공기관의 범죄 탐지, 수사, 집행 목적과 연결된 제한적 이전입니다.",
  },
  {
    value: "vital_interest_unreachable",
    label: "연락 불가 정보주체의 중대한 이익",
    description: "정보주체에게 연락할 수 없고 생명·안전 보호가 긴급한 경우입니다.",
  },
];

const gdprElevatedDataTypes = new Set([
  "health_support_cases",
  "hr_records",
  "payment_operations",
]);

function emptyFirst(options: FieldOption[], placeholder: string) {
  return [
    {
      value: "",
      label: placeholder,
      description: "아직 선택하지 않은 상태입니다. 실제 업무와 가장 가까운 항목을 고르세요.",
    },
    ...options,
  ];
}

function missingVisibleRequired(
  fields: readonly GuidedField[],
  state: GuidedFormState,
) {
  return fields
    .filter((field) => field.required && (!field.visibleIf || field.visibleIf(state)))
    .filter((field) => !state[field.key])
    .map((field) => field.label);
}

function isGdprCrossBorderContext(state: GuidedFormState) {
  return Boolean(state.target_region)
    && !euRegionOptions.some((option) => option.value === state.target_region);
}

function needsGdprElevatedGovernanceQuestions(state: GuidedFormState) {
  return (
    state.contains_sensitive_data === "true"
    || gdprElevatedDataTypes.has(state.data_type)
    || isGdprCrossBorderContext(state)
  );
}

function isSaudiCrossBorderContext(state: GuidedFormState) {
  return Boolean(state.target_region) && !state.target_region.startsWith("sa-");
}

const taiwanRegionValues = new Set(["tw-taipei-dc"]);
const brazilRegionValues = new Set(["sa-east-1", "br-sao-paulo-dc"]);
const koreaRegionValues = new Set(["ap-northeast-2"]);

function isTaiwanCrossBorderContext(state: GuidedFormState) {
  if (state.cross_border_transfer === "true") {
    return true;
  }
  if (state.cross_border_transfer === "false") {
    return false;
  }
  return Boolean(state.target_region) && !taiwanRegionValues.has(state.target_region);
}

function isLgpdTransferOutsideBrazil(state: GuidedFormState) {
  return Boolean(state.target_region) && !brazilRegionValues.has(state.target_region);
}

function isPipaCrossBorderContext(state: GuidedFormState) {
  return Boolean(state.target_region) && !koreaRegionValues.has(state.target_region);
}

function hasLgpdApprovedTransferMechanism(state: GuidedFormState) {
  return (
    (
      state.standard_contractual_clauses_in_place === "true"
      && state.standard_contractual_clauses_full_unaltered === "true"
    )
    || (
      state.specific_contractual_clauses_used === "true"
      && state.specific_contractual_clauses_anpd_approved === "true"
    )
    || (
      state.binding_corporate_rules_used === "true"
      && state.binding_corporate_rules_anpd_approved === "true"
    )
    || state.certification_or_code_approved === "true"
  );
}

function hasPipaTransferBasis(state: GuidedFormState) {
  return (
    state.separate_consent_for_transfer === "true"
    || state.treaty_or_statutory_transfer_basis === "true"
    || state.contract_necessity_disclosed_or_notified === "true"
    || state.pipa_certified_recipient === "true"
    || state.pipa_equivalence_recognition_exists === "true"
  );
}

const gdprDefaultState: GuidedFormState = {
  dataset_name: "",
  data_type: "",
  data_subject_region: "",
  current_region: "",
  target_region: "",
  lawful_basis: "",
  processing_purpose_defined: "",
  data_minimized: "",
  retention_period_defined: "",
  contains_sensitive_data: "unknown",
  special_category_condition_met: "unknown",
  uses_processor: "unknown",
  controller_processor_roles_defined: "unknown",
  dpa_in_place: "unknown",
  processor_sufficient_guarantees: "unknown",
  subprocessor_controls_in_place: "unknown",
  scc_in_place: "unknown",
  bcr_in_place: "unknown",
  other_safeguards_in_place: "unknown",
  transfer_impact_assessment_completed: "unknown",
  supplemental_measures_documented: "unknown",
  derogation_used: "unknown",
  derogation_type: "",
  encryption_at_rest: "unknown",
  encryption_in_transit: "unknown",
  access_control_in_place: "unknown",
  incident_response_in_place: "unknown",
  breach_notification_ready_72h: "unknown",
  privacy_notice_updated: "unknown",
  transfer_disclosed_to_subject: "unknown",
  records_of_processing_exists: "unknown",
  transfer_documented_in_ropa: "unknown",
  data_subject_rights_process_ready: "unknown",
  privacy_by_design_review_completed: "unknown",
  dpia_required: "unknown",
  dpia_completed: "",
  dpo_required: "unknown",
  dpo_assigned: "",
};

const saudiDefaultState: GuidedFormState = {
  dataset_name: "",
  data_type: "",
  data_subject_connection: "",
  current_region: "",
  target_region: "",
  processing_legal_basis: "",
  processing_purpose_defined: "",
  data_minimized: "",
  retention_period_defined: "",
  contains_sensitive_data: "unknown",
  explicit_consent_for_sensitive_data: "unknown",
  privacy_policy_available: "unknown",
  data_subject_rights_request_ready: "unknown",
  consent_withdrawal_process_ready: "unknown",
  data_accuracy_review_completed: "unknown",
  privacy_notice_available: "unknown",
  cross_border_notice_provided: "unknown",
  adequate_protection_confirmed: "unknown",
  binding_common_rules_approved: "unknown",
  standard_contractual_clauses_in_place: "unknown",
  certification_or_code_in_place: "unknown",
  transfer_exception_used: "unknown",
  transfer_exception_type: "",
  transfer_risk_assessment_completed: "unknown",
  large_scale_or_continuous_transfer: "unknown",
  uses_processor: "unknown",
  processor_agreement_in_place: "unknown",
  processor_compliance_verified: "unknown",
  subprocessor_or_onward_transfer_controls: "unknown",
  records_of_processing_exists: "unknown",
  dpo_required: "unknown",
  dpo_assigned: "",
  processing_impact_assessment_completed: "unknown",
  encryption_at_rest: "unknown",
  encryption_in_transit: "unknown",
  access_control_in_place: "unknown",
  breach_response_72h_ready: "unknown",
};

const gdprSteps = [
  {
    id: "context",
    title: "무엇을 어디로 보내나요?",
    description: "사업자가 아는 수준에서 데이터 종류와 저장·이전 위치만 먼저 고릅니다.",
    fields: [
      { key: "dataset_name", label: "데이터셋", helper: "검토 대상 업무 데이터를 고르세요.", kind: "select", options: emptyFirst(datasetOptions, "데이터셋 선택"), required: true },
      { key: "data_type", label: "데이터 유형", helper: "데이터 성격을 고르세요.", kind: "select", options: emptyFirst(dataTypeOptions, "데이터 유형 선택"), required: true },
      { key: "data_subject_region", label: "정보주체 지역", helper: "국외이전 판단의 출발점입니다.", kind: "select", options: emptyFirst(gdprSubjectOptions, "정보주체 지역 선택"), required: true },
      { key: "current_region", label: "현재 리전", helper: "현재 저장 또는 처리 위치입니다.", kind: "select", options: emptyFirst(targetRegionOptions, "현재 리전 선택"), required: true },
      { key: "target_region", label: "대상 리전", helper: "이전 또는 복제 대상입니다.", kind: "select", options: emptyFirst(targetRegionOptions, "대상 리전 선택"), required: true }
    ]
  },
  {
    id: "lawfulness",
    title: "왜 쓰고 얼마나 보관하나요?",
    description: "정확한 법률 용어를 몰라도 괜찮습니다. 모르는 항목은 잘 모르겠음으로 남기면 보완 과제로 안내합니다.",
    fields: [
      { key: "lawful_basis", label: "왜 이 데이터를 써도 되나요?", helper: "계약 이행, 동의, 법적 의무처럼 가장 가까운 이유를 고르세요.", kind: "select", options: emptyFirst(gdprLawfulBasisOptions, "이유 선택"), required: true },
      { key: "processing_purpose_defined", label: "사용 목적이 정해져 있나요?", helper: "예: 주문 처리, 고객지원, 분석처럼 내부에서 설명할 수 있나요?", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "data_minimized", label: "꼭 필요한 데이터만 보내나요?", helper: "전체 DB가 아니라 필요한 필드만 보내는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "retention_period_defined", label: "언제까지 보관할지 정했나요?", helper: "삭제 시점이나 보관 기준이 있으면 예를 선택하세요.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "contains_sensitive_data", label: "민감한 정보가 들어 있나요?", helper: "건강, 인사, 결제, 아동, 생체정보처럼 조심해야 할 정보가 있나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "special_category_condition_met", label: "민감정보를 써도 되는 근거가 있나요?", helper: "정확히 모르면 잘 모르겠음으로 두고 결과에서 확인 과제로 받으세요.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.contains_sensitive_data === "true" }
    ]
  },
  {
    id: "transfer",
    title: "외부 업체나 해외 이전 근거가 있나요?",
    description: "SCC, BCR 같은 단어가 낯설면 잘 모르겠음으로 답해도 됩니다. 시스템이 필요한 문서 목록으로 바꿔 줍니다.",
    fields: [
      { key: "uses_processor", label: "외부 서비스나 업체가 처리하나요?", helper: "예: AWS, SaaS, 외주 개발사, 분석 도구, 고객지원 도구", kind: "segmented", options: yesNoUnknownOptions },
      { key: "controller_processor_roles_defined", label: "우리와 업체의 역할이 정해졌나요?", helper: "누가 결정권자이고 누가 대신 처리하는지 계약이나 문서에 있나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "dpa_in_place", label: "업체와 개인정보 처리 계약이 있나요?", helper: "DPA 또는 개인정보 처리 위탁/수탁 계약이 있으면 예를 선택하세요.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "processor_sufficient_guarantees", label: "업체의 보안 자료를 확인했나요?", helper: "보안 인증, 개인정보 보호 조항, 감사 자료 등을 확인했나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "subprocessor_controls_in_place", label: "하위처리자 통제", helper: "재위탁 또는 재이전 통제가 계약에 반영됐나요?", tooltip: "벤더가 다시 다른 업체를 쓰는 경우 사전 승인, 통지, 감사권 조항을 주로 봅니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "scc_in_place", label: "표준계약조항을 체결했나요?", helper: "EU 밖으로 보낼 때 자주 쓰는 계약 장치입니다.", tooltip: "EU 밖 이전에서 가장 자주 보는 계약형 이전 메커니즘입니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isGdprCrossBorderContext },
      { key: "bcr_in_place", label: "BCR 보유", helper: "그룹 내부 이전용 BCR이 있나요?", tooltip: "같은 기업집단 내부 이전에서 쓰는 승인된 내부 규칙입니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isGdprCrossBorderContext },
      { key: "other_safeguards_in_place", label: "기타 보호조치", helper: "다른 제46조 보호조치가 있나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isGdprCrossBorderContext },
      { key: "transfer_impact_assessment_completed", label: "이전 영향 평가", helper: "TIA를 완료했나요?", tooltip: "대상국 법·집행 환경과 계약 보호조치 실효성을 점검하는 문서입니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isGdprCrossBorderContext },
      { key: "supplemental_measures_documented", label: "보완조치 문서화", helper: "추가 보호조치가 정리되어 있나요?", tooltip: "암호화, 분리보관, 계약상 제한 같은 추가 통제를 뜻합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isGdprCrossBorderContext },
      { key: "derogation_used", label: "예외 사유로 보내는 건가요?", helper: "일회성·긴급·계약상 꼭 필요한 이전처럼 예외 경로를 쓰는지 확인합니다.", tooltip: "반복 운영보다는 예외적 상황에서만 좁게 쓰는 경로입니다.", kind: "segmented", options: yesNoUnknownOptions, required: true, visibleIf: isGdprCrossBorderContext },
      { key: "derogation_type", label: "예외 유형", helper: "예외 사용 시 세부 유형을 고르세요.", kind: "select", options: emptyFirst(derogationTypeOptions, "예외 유형 선택"), visibleIf: (state: GuidedFormState) => isGdprCrossBorderContext(state) && state.derogation_used === "true" }
    ]
  },
  {
    id: "controls",
    title: "기본 보안과 고객 안내는 준비됐나요?",
    description: "기술 세부사항을 몰라도 괜찮습니다. 모르면 보안 담당자에게 확인할 항목으로 넘깁니다.",
    fields: [
      { key: "encryption_at_rest", label: "저장된 데이터가 암호화되어 있나요?", helper: "AWS/SaaS 설정을 모르면 잘 모르겠음으로 두세요.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "encryption_in_transit", label: "전송 시 암호화", helper: "TLS 등이 적용되나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "access_control_in_place", label: "접근통제", helper: "접근권한 통제가 있나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "incident_response_in_place", label: "침해 대응 절차", helper: "사고 대응 절차가 있나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "breach_notification_ready_72h", label: "72시간 내 신고 준비", helper: "보고·판단·승인 흐름이 정리돼 있나요?", tooltip: "실제 사고가 났을 때 누가 언제 신고 판단을 하는지 정리된 상태를 뜻합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "privacy_notice_updated", label: "처리방침 최신화", helper: "고지 문구가 최신인가요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "transfer_disclosed_to_subject", label: "국외 이전 고지", helper: "정보주체에게 이전 사실을 알렸나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isGdprCrossBorderContext },
      { key: "records_of_processing_exists", label: "ROPA 보유", helper: "처리 활동 기록부가 있나요?", tooltip: "누가 어떤 데이터를 왜 처리하는지 남기는 내부 기록입니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "transfer_documented_in_ropa", label: "이전 사항 기록 반영", helper: "이전 경로가 기록에 반영됐나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isGdprCrossBorderContext }
    ]
  },
  {
    id: "governance",
    title: "담당자가 추가로 봐야 할 일이 있나요?",
    description: "DPIA나 DPO 같은 전문 항목은 모르면 잘 모르겠음으로 두고 결과에서 담당자 확인 과제로 넘깁니다.",
    fields: [
      { key: "data_subject_rights_process_ready", label: "정보주체 권리 대응", helper: "열람·정정·삭제 요청 대응 절차가 있나요?", tooltip: "사업자가 실제 요청을 받았을 때 누가 무엇을 처리하는지 정리된 상태를 뜻합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "privacy_by_design_review_completed", label: "프라이버시 설계 검토", helper: "기본값 최소화·접근제한 검토를 했나요?", tooltip: "제품 설계 자체가 개인정보 최소화 원칙을 따르는지 보는 항목입니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "dpia_required", label: "사전 영향평가가 필요한지 알고 있나요?", helper: "정확히 모르면 잘 모르겠음으로 두세요.", tooltip: "민감정보, 대규모 처리, 고위험 설계면 예를 검토합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true, visibleIf: needsGdprElevatedGovernanceQuestions },
      { key: "dpia_completed", label: "DPIA 완료", helper: "필요한 경우 실제로 완료했나요?", kind: "segmented", options: yesNoOptions, required: true, visibleIf: (state: GuidedFormState) => state.dpia_required === "true" },
      { key: "dpo_required", label: "개인정보 보호 책임자 지정이 필요한지 알고 있나요?", helper: "정확히 모르면 잘 모르겠음으로 두세요.", tooltip: "대규모 모니터링, 민감정보 대규모 처리 등에서는 필요할 수 있습니다.", kind: "segmented", options: yesNoUnknownOptions, required: true, visibleIf: needsGdprElevatedGovernanceQuestions },
      { key: "dpo_assigned", label: "DPO 지정 완료", helper: "필요한 경우 실제 지정했나요?", kind: "segmented", options: yesNoOptions, required: true, visibleIf: (state: GuidedFormState) => state.dpo_required === "true" }
    ]
  }
] as const;

const saudiSteps = [
  {
    id: "context",
    title: "무엇을 어디로 보내나요?",
    description: "사우디와 어떤 관련이 있는 데이터인지, 현재 위치와 대상 위치만 먼저 고릅니다.",
    fields: [
      { key: "dataset_name", label: "데이터셋", helper: "검토 대상 데이터를 고르세요.", kind: "select", options: emptyFirst(saudiDatasetOptions, "데이터셋 선택"), required: true },
      { key: "data_type", label: "데이터 유형", helper: "데이터 성격을 고르세요.", kind: "select", options: emptyFirst(dataTypeOptions, "데이터 유형 선택"), required: true },
      { key: "data_subject_connection", label: "사우디 연결성", helper: "사우디 거주자 또는 사우디 내 수집 데이터인지 고르세요.", kind: "select", options: emptyFirst(dataSubjectConnectionOptions, "사우디 연결성 선택"), required: true },
      { key: "current_region", label: "현재 위치", helper: "현재 저장 위치입니다.", kind: "select", options: emptyFirst(targetRegionOptions, "현재 위치 선택"), required: true },
      { key: "target_region", label: "대상 위치", helper: "이전 대상 위치입니다.", kind: "select", options: emptyFirst(targetRegionOptions, "대상 위치 선택"), required: true }
    ]
  },
  {
    id: "lawfulness",
    title: "왜 쓰고 고객에게 알렸나요?",
    description: "정확한 법률 근거를 몰라도 잘 모르겠음으로 진행할 수 있습니다. 결과에서 보완 과제로 안내합니다.",
    fields: [
      { key: "processing_legal_basis", label: "왜 이 데이터를 써도 되나요?", helper: "동의, 계약 이행, 법적 의무처럼 가장 가까운 이유를 고르세요.", kind: "select", options: emptyFirst(saudiLegalBasisOptions, "이유 선택"), required: true },
      { key: "processing_purpose_defined", label: "사용 목적이 정해져 있나요?", helper: "예: 주문 처리, 고객지원, 멤버십 운영처럼 설명할 수 있나요?", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "data_minimized", label: "꼭 필요한 데이터만 보내나요?", helper: "목적에 필요한 최소 항목만 이전하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "retention_period_defined", label: "언제까지 보관할지 정했나요?", helper: "보관기간이나 파기 기준이 있으면 예를 선택하세요.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "contains_sensitive_data", label: "민감정보 포함", helper: "민감정보가 있나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "explicit_consent_for_sensitive_data", label: "민감정보 명시적 동의", helper: "민감정보를 동의 기반으로 처리한다면 명시적 동의가 있나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.contains_sensitive_data === "true" && state.processing_legal_basis === "consent" },
      { key: "privacy_policy_available", label: "개인정보 처리방침", helper: "서비스 기준 처리방침이 준비되어 있나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "data_subject_rights_request_ready", label: "권리 요청 대응", helper: "열람·정정·삭제 요청 대응 절차가 있나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "consent_withdrawal_process_ready", label: "동의 철회 대응", helper: "동의 기반 처리라면 철회 경로가 있나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.processing_legal_basis === "consent" },
      { key: "data_accuracy_review_completed", label: "정확성·최신성 점검", helper: "정정·업데이트 반영 절차를 점검했나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "privacy_notice_available", label: "개인정보 고지 제공", helper: "기본 고지 문구가 정리돼 있나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "cross_border_notice_provided", label: "국외이전 안내", helper: "국외이전 안내가 준비되어 있나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isSaudiCrossBorderContext }
    ]
  },
  {
    id: "transfer",
    title: "사우디 밖으로 보내는 근거가 있나요?",
    description: "전문 용어가 낯설면 잘 모르겠음으로 답해도 됩니다. 필요한 문서와 담당자 확인 항목으로 바꿔 줍니다.",
    fields: [
      { key: "adequate_protection_confirmed", label: "적정 보호 수준 확인", helper: "대상국 보호수준이 공식적으로 확인됐나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isSaudiCrossBorderContext },
      { key: "binding_common_rules_approved", label: "승인된 공통구속규칙", helper: "BCR 성격의 승인된 규칙이 있나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isSaudiCrossBorderContext },
      { key: "standard_contractual_clauses_in_place", label: "표준계약조항", helper: "사우디 기준 표준계약조항이 있나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isSaudiCrossBorderContext },
      { key: "certification_or_code_in_place", label: "인증/행동강령 보호조치", helper: "인증이나 승인된 행동강령이 있나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isSaudiCrossBorderContext },
      { key: "transfer_exception_used", label: "예외 사유로 보내는 건가요?", helper: "보호조치 대신 예외 경로를 쓰는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true, visibleIf: isSaudiCrossBorderContext },
      { key: "transfer_exception_type", label: "예외 유형", helper: "예외 사용 시 세부 유형을 고르세요.", kind: "select", options: emptyFirst(saudiTransferExceptionTypeOptions, "예외 유형 선택"), visibleIf: (state: GuidedFormState) => isSaudiCrossBorderContext(state) && state.transfer_exception_used === "true" },
      { key: "large_scale_or_continuous_transfer", label: "대규모/지속적 이전", helper: "특히 민감정보를 계속 이전하나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "transfer_risk_assessment_completed", label: "국외이전 위험평가 완료", helper: "위험평가를 완료했나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isSaudiCrossBorderContext }
    ]
  },
  {
    id: "controls",
    title: "업체, 보안, 사고 대응은 준비됐나요?",
    description: "모르는 기술 항목은 막히지 않고 보완 확인 항목으로 넘깁니다.",
    fields: [
      { key: "uses_processor", label: "외부 처리자 사용", helper: "벤더 또는 위탁처리가 있나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "processor_agreement_in_place", label: "프로세서 계약", helper: "계약 또는 서면 조건이 있나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "processor_compliance_verified", label: "프로세서 준수 검증", helper: "실사나 검증을 했나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "subprocessor_or_onward_transfer_controls", label: "재이전/하위처리자 통제", helper: "하위처리자와 재이전 통제가 있나요?", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "encryption_at_rest", label: "저장된 데이터가 암호화되어 있나요?", helper: "클라우드나 SaaS 설정을 모르면 잘 모르겠음으로 두세요.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "encryption_in_transit", label: "전송 시 암호화", helper: "TLS 등이 적용되나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "access_control_in_place", label: "접근통제", helper: "접근권한 통제가 있나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "breach_response_72h_ready", label: "72시간 내 브리치 대응 준비", helper: "사고 대응과 통지 체계가 있나요?", kind: "segmented", options: yesNoUnknownOptions }
    ]
  },
  {
    id: "governance",
    title: "담당자가 추가로 봐야 할 일이 있나요?",
    description: "영향평가나 DPO 같은 전문 항목은 모르면 결과에서 담당자 확인 과제로 넘깁니다.",
    fields: [
      { key: "records_of_processing_exists", label: "처리 기록 보유", helper: "처리 활동 기록이 있나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "processing_impact_assessment_completed", label: "내부 영향 검토", helper: "내부 평가나 영향 검토를 했나요?", kind: "segmented", options: yesNoUnknownOptions },
      { key: "dpo_required", label: "개인정보 보호 책임자 지정이 필요한지 알고 있나요?", helper: "정확히 모르면 잘 모르겠음으로 두세요.", tooltip: "민감정보나 대규모 처리라면 공식 기준에 따라 먼저 판단하는 편이 좋습니다.", kind: "segmented", options: yesNoUnknownOptions, required: true, visibleIf: (state: GuidedFormState) => state.contains_sensitive_data === "true" || state.large_scale_or_continuous_transfer === "true" },
      { key: "dpo_assigned", label: "DPO 지정 완료", helper: "필요한 경우 실제 지정했나요?", kind: "segmented", options: yesNoOptions, required: true, visibleIf: (state: GuidedFormState) => state.dpo_required === "true" }
    ]
  }
] as const;

// 🇹🇼 대만 기본 상태 및 단계
const taiwanDefaultState: GuidedFormState = {
  dataset_name: "",
  data_type: "",
  current_region: "",
  target_region: "",
  encryption_at_rest: "unknown",
  encryption_in_transit: "unknown",
  access_control_in_place: "unknown",

  agency_type: "",
  specific_purpose_defined: "unknown",
  purpose_necessity_review_completed: "unknown",
  collection_processing_basis: "",

  contains_article6_sensitive_data: "unknown",
  sensitive_data_exception_basis: "",
  written_consent_for_sensitive_data: "unknown",
  consent_freely_given: "unknown",
  consent_proof_available: "unknown",

  collected_directly_from_data_subject: "unknown",
  article8_notice_provided: "unknown",
  indirect_collection_notice_required: "unknown",
  article9_source_notice_provided: "unknown",
  data_subject_rights_request_ready: "unknown",
  rights_deadline_tracking_ready: "unknown",
  data_accuracy_review_completed: "unknown",
  retention_period_defined: "unknown",

  use_outside_original_specific_purpose: "unknown",
  outside_purpose_use_basis: "",
  separate_consent_for_outside_purpose: "unknown",

  uses_data_for_marketing: "unknown",
  marketing_optout_mechanism_ready: "unknown",
  data_subject_objected_public_source_processing: "unknown",
  public_source_objection_handled: "unknown",
  breach_notification_process_ready: "unknown",
  security_maintenance_measures_ready: "unknown",
  industry_security_plan_required: "unknown",
  industry_security_plan_in_place: "unknown",
  uses_commissioned_processor: "unknown",
  commissioned_processor_terms_in_place: "unknown",

  cross_border_transfer: "unknown",
  recipient_country_protection_adequate: "unknown",
  major_national_interest_involved: "unknown",
  treaty_or_agreement_restriction_known: "unknown",
  third_country_circumvention_risk: "unknown",
  authority_transfer_restriction_applies: "unknown",
};

const taiwanSteps = [
  {
    id: "taiwan_context",
    title: "대만 PDPA 검토 기본 정보",
    description: "처리 주체, 데이터 유형, 현재 위치와 대상 위치를 먼저 확인합니다.",
    fields: [
      { key: "dataset_name", label: "데이터셋 명칭", helper: "검토할 데이터셋을 선택하세요.", kind: "select", options: emptyFirst(datasetOptions, "선택"), required: true },
      { key: "data_type", label: "데이터 유형", helper: "데이터 성격을 선택하세요.", kind: "select", options: emptyFirst(dataTypeOptions, "선택"), required: true },
      { key: "agency_type", label: "기관 유형", helper: "공공기관인지 비공공기관인지 선택하세요.", kind: "select", options: emptyFirst(taiwanAgencyOptions, "선택"), required: true },
      { key: "current_region", label: "현재 리전", helper: "현재 데이터가 저장 또는 처리되는 위치를 선택하세요.", kind: "select", options: emptyFirst(targetRegionOptions, "선택"), required: true },
      { key: "target_region", label: "대상 리전", helper: "이전 또는 복제 대상 위치를 선택하세요.", kind: "select", options: emptyFirst(targetRegionOptions, "선택"), required: true },
    ],
  },
  {
    id: "taiwan_lawfulness",
    title: "수집·처리 근거",
    description: "특정 목적, 필요성, 수집·처리 근거와 목적 외 이용 여부를 확인합니다.",
    fields: [
      { key: "specific_purpose_defined", label: "특정 목적이 정의되어 있나요?", helper: "수집·처리·이용 목적이 구체적으로 정해져 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "purpose_necessity_review_completed", label: "목적 필요성 검토를 했나요?", helper: "처리가 특정 목적의 필요 범위 안에 있고 합리적 관련성이 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "collection_processing_basis", label: "수집·처리 법적 근거", helper: "대만 PDPA상 가장 가까운 수집·처리 근거를 선택하세요.", kind: "select", options: emptyFirst(taiwanBasisOptions, "선택"), required: true },
      { key: "use_outside_original_specific_purpose", label: "원래 특정 목적 밖으로 이용하나요?", helper: "처음 정한 특정 목적을 넘어 이용하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "outside_purpose_use_basis", label: "목적 외 이용 근거", helper: "목적 외 이용이 있다면 적용 근거를 선택하세요.", kind: "select", options: emptyFirst(taiwanOutsidePurposeBasisOptions, "선택"), visibleIf: (state: GuidedFormState) => state.use_outside_original_specific_purpose === "true" },
      { key: "separate_consent_for_outside_purpose", label: "목적 외 이용 별도 동의", helper: "목적 외 이용 근거가 동의라면 목적·범위·권익 영향을 알리고 별도 동의를 받았는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.outside_purpose_use_basis === "consent" },
    ],
  },
  {
    id: "taiwan_notice_rights",
    title: "민감정보, 고지, 권리 대응",
    description: "제6조 민감정보, 직접·간접 수집 고지, 권리 대응과 정확성 관리를 확인합니다.",
    fields: [
      { key: "contains_article6_sensitive_data", label: "제6조 민감정보가 포함되어 있나요?", helper: "의료, 건강, 유전, 성생활, 신체검사, 범죄기록 정보 포함 여부를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "sensitive_data_exception_basis", label: "민감정보 예외 근거", helper: "민감정보가 있다면 제6조 예외 근거를 선택하세요.", kind: "select", options: emptyFirst(taiwanSensitiveDataBasisOptions, "선택"), visibleIf: (state: GuidedFormState) => state.contains_article6_sensitive_data === "true" },
      { key: "written_consent_for_sensitive_data", label: "민감정보 서면 동의", helper: "서면 동의 경로를 쓴다면 동의가 문서화되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.sensitive_data_exception_basis === "written_consent" },
      { key: "consent_freely_given", label: "동의가 자유롭게 제공되었나요?", helper: "동의가 정보주체 의사에 반하지 않는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.sensitive_data_exception_basis === "written_consent" },
      { key: "consent_proof_available", label: "동의 증빙이 있나요?", helper: "동의에 의존한다면 증빙을 제시할 수 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.collection_processing_basis === "data_subject_consent" || state.sensitive_data_exception_basis === "written_consent" },
      { key: "collected_directly_from_data_subject", label: "정보주체에게 직접 수집하나요?", helper: "직접 수집인지 제3자·공개 출처 등 간접 수집인지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "article8_notice_provided", label: "제8조 고지를 제공했나요?", helper: "기관명, 목적, 항목, 기간·지역·수령자·방법, 권리와 미제공 영향 등을 고지했는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "indirect_collection_notice_required", label: "간접 수집 제9조 고지가 필요한가요?", helper: "직접 수집이 아니라면 제9조 고지 필요 여부를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.collected_directly_from_data_subject === "false" },
      { key: "article9_source_notice_provided", label: "제9조 출처 고지를 제공했나요?", helper: "간접 수집 시 출처와 제8조 고지사항을 제공했는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.collected_directly_from_data_subject === "false" && state.indirect_collection_notice_required !== "false" },
      { key: "data_subject_rights_request_ready", label: "정보주체 권리 요청 대응 절차가 있나요?", helper: "열람, 사본, 보충·정정, 처리정지, 삭제 요청 대응 절차를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "rights_deadline_tracking_ready", label: "권리 대응 기한 추적이 되나요?", helper: "열람 15일, 정정·삭제 등 30일 기한과 연장 통지를 관리하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "data_accuracy_review_completed", label: "정확성·정정 통제를 점검했나요?", helper: "정확성 유지, 정정·보충, 분쟁 중 처리정지 통제를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "retention_period_defined", label: "보관기간과 목적 종료 후 삭제 기준이 있나요?", helper: "목적 달성 또는 기간 만료 시 처리정지·삭제 기준을 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
    ],
  },
  {
    id: "taiwan_operations",
    title: "마케팅, 보안, 위탁",
    description: "마케팅 수신거부, 유출 통지, 보안계획, 위탁 처리 통제를 확인합니다.",
    fields: [
      { key: "uses_data_for_marketing", label: "마케팅에 사용하나요?", helper: "비공공기관이 개인정보를 마케팅에 사용하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "marketing_optout_mechanism_ready", label: "마케팅 수신거부가 준비되어 있나요?", helper: "최초 마케팅 시 거부 방법을 제공하고 즉시 중단할 수 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_data_for_marketing === "true" },
      { key: "data_subject_objected_public_source_processing", label: "공개출처 처리에 이의가 있나요?", helper: "공개 출처 근거 이용 시 정보주체가 우월한 보호 이익을 이유로 이의 제기했는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.collection_processing_basis === "publicly_available_source" },
      { key: "public_source_objection_handled", label: "공개출처 이의를 처리했나요?", helper: "삭제 또는 처리·이용 중단 등 필요한 조치를 했는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.data_subject_objected_public_source_processing === "true" },
      { key: "breach_notification_process_ready", label: "유출 등 침해 통지 절차가 있나요?", helper: "도난, 유출, 변경 등 침해 발생 시 사실 확인과 통지 절차를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "security_maintenance_measures_ready", label: "보안 유지 조치가 준비되어 있나요?", helper: "도난, 유출, 훼손, 파괴를 막기 위한 보안·유지 조치가 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "industry_security_plan_required", label: "산업별 보안유지계획이 필요한가요?", helper: "주무기관이 보안유지계획과 영업종료 후 처리규칙을 요구하는 업종인지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "industry_security_plan_in_place", label: "산업별 보안유지계획이 마련되어 있나요?", helper: "필요한 보안유지계획과 영업종료 후 처리규칙이 준비되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.industry_security_plan_required === "true" },
      { key: "uses_commissioned_processor", label: "위탁 처리자를 사용하나요?", helper: "벤더, 호스팅, 수탁자가 개인정보를 수집·처리·이용하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "commissioned_processor_terms_in_place", label: "위탁 처리 조건이 문서화되어 있나요?", helper: "지시, 보안, 목적 제한, 권리 지원, 반환·삭제, 감독 조건이 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_commissioned_processor === "true" },
      { key: "encryption_at_rest", label: "저장 시 암호화가 적용되어 있나요?", helper: "저장 데이터 암호화 여부를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "encryption_in_transit", label: "전송 시 암호화가 적용되어 있나요?", helper: "TLS 등 전송 구간 암호화 여부를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "access_control_in_place", label: "접근통제가 적용되어 있나요?", helper: "권한 관리와 접근 제한이 적용되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
    ],
  },
  {
    id: "taiwan_transfer",
    title: "국외 전송 제한",
    description: "제21조상 주무기관 제한 사유와 수령국 보호수준을 확인합니다.",
    fields: [
      { key: "cross_border_transfer", label: "대만 밖으로 처리·이용되나요?", helper: "대상 리전 기준으로 국외전송 여부를 확인하거나 직접 선택하세요.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "recipient_country_protection_adequate", label: "수령국 보호수준이 충분한가요?", helper: "수령국 개인정보 보호 규범이 정보주체 권익을 해치지 않을 수준인지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isTaiwanCrossBorderContext },
      { key: "major_national_interest_involved", label: "중대 국가이익 관련성이 있나요?", helper: "국외전송이 중대 국가이익과 관련될 수 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isTaiwanCrossBorderContext },
      { key: "treaty_or_agreement_restriction_known", label: "조약·협정상 제한이 있나요?", helper: "국제 조약 또는 협정이 이전을 제한하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isTaiwanCrossBorderContext },
      { key: "third_country_circumvention_risk", label: "제3국 우회 위험이 있나요?", helper: "제3국 경유로 대만 PDPA 적용을 회피하는 구조인지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isTaiwanCrossBorderContext },
      { key: "authority_transfer_restriction_applies", label: "주무기관 제한·명령이 적용되나요?", helper: "주무기관의 제한, 명령, 결정이 적용되는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isTaiwanCrossBorderContext },
    ],
  },
] as const;

// 🇧🇷 브라질 기본 상태 및 단계
const lgpdDefaultState: GuidedFormState = {
  dataset_name: "",
  data_type: "",
  data_subject_connection: "",
  current_region: "",
  target_region: "",

  processing_purpose_defined: "unknown",
  data_minimized: "unknown",
  retention_period_defined: "unknown",
  processing_legal_basis: "",
  contains_sensitive_data: "unknown",
  sensitive_data_legal_basis: "",
  specific_highlighted_consent_for_sensitive_data: "unknown",
  legitimate_interest_assessment_completed: "unknown",
  privacy_policy_available: "unknown",
  data_subject_rights_request_ready: "unknown",
  consent_withdrawal_process_ready: "unknown",
  records_of_processing_exists: "unknown",

  adequacy_decision_confirmed: "unknown",
  standard_contractual_clauses_in_place: "unknown",
  standard_contractual_clauses_full_unaltered: "unknown",
  legacy_contractual_clauses_used: "unknown",
  anpd_scc_migration_completed: "unknown",
  specific_contractual_clauses_used: "unknown",
  specific_contractual_clauses_anpd_approved: "unknown",
  binding_corporate_rules_used: "unknown",
  binding_corporate_rules_anpd_approved: "unknown",
  certification_or_code_approved: "unknown",
  transfer_exception_used: "unknown",
  transfer_exception_type: "",
  international_transfer_transparency_document_available: "unknown",
  full_transfer_clauses_request_ready: "unknown",
  subsequent_transfer_expected: "unknown",
  subsequent_transfer_controls_in_place: "unknown",

  uses_processor: "unknown",
  processor_agreement_in_place: "unknown",
  processor_compliance_verified: "unknown",
  subprocessor_or_onward_transfer_controls: "unknown",
  large_scale_or_continuous_transfer: "unknown",
  large_scale_or_high_risk_processing: "unknown",
  dpo_or_encarregado_assigned: "unknown",
  data_protection_impact_report_completed: "unknown",
  security_incident_response_ready: "unknown",

  encryption_at_rest: "unknown",
  encryption_in_transit: "unknown",
  access_control_in_place: "unknown",
};

const pipaDefaultState: GuidedFormState = {
  dataset_name: "",
  data_type: "",
  current_region: "",
  target_region: "",

  lawful_basis: "",
  processing_purpose_defined: "unknown",
  data_minimized: "unknown",
  retention_period_defined: "unknown",
  privacy_policy_available: "unknown",
  privacy_notice_available: "unknown",
  consent_notice_clear: "unknown",
  consent_withdrawal_process_ready: "unknown",
  third_party_sharing: "unknown",
  third_party_provision_consent_or_basis: "unknown",
  data_subject_rights_process_ready: "unknown",

  contains_sensitive_data: "unknown",
  has_unique_identifier: "unknown",
  uses_resident_registration_number: "unknown",
  sensitive_data_basis: "",
  unique_identifier_basis: "",
  resident_registration_statutory_basis: "unknown",

  uses_processor: "unknown",
  dpa_in_place: "unknown",
  processor_public_disclosure: "unknown",
  processor_supervision_done: "unknown",
  subprocessor_controls_in_place: "unknown",

  separate_consent_for_transfer: "unknown",
  treaty_or_statutory_transfer_basis: "unknown",
  contract_necessity_disclosed_or_notified: "unknown",
  pipa_certified_recipient: "unknown",
  pipa_equivalence_recognition_exists: "unknown",
  cross_border_notice_provided: "unknown",
  transfer_protection_measures_ready: "unknown",
  onward_transfer_controls: "unknown",

  encryption_at_rest: "unknown",
  encryption_in_transit: "unknown",
  access_control_in_place: "unknown",

  is_automated_decision_only: "unknown",
  automated_decision_significant_effect: "unknown",
  automated_decision_rights_ready: "unknown",
  provides_explanation: "unknown",
  human_review_available: "unknown",

  privacy_officer_assigned: "unknown",
  breach_response_ready: "unknown",
};

const lgpdSteps = [
  {
    id: "lgpd_context",
    title: "브라질 LGPD 검토",
    description: "브라질 연결성, 데이터 유형, 현재 위치와 대상 위치를 입력합니다.",
    fields: [
      { key: "dataset_name", label: "데이터셋 명칭", helper: "검토할 데이터셋을 선택하세요.", kind: "select", options: emptyFirst(datasetOptions, "선택"), required: true },
      { key: "data_type", label: "데이터 유형", helper: "데이터 성격을 선택하세요.", kind: "select", options: emptyFirst(dataTypeOptions, "선택"), required: true },
      { key: "data_subject_connection", label: "브라질 연결성", helper: "브라질 거주자, 브라질 내 수집, 브라질 대상 서비스 등 적용 근거를 선택하세요.", kind: "select", options: emptyFirst(lgpdDataSubjectConnectionOptions, "선택"), required: true },
      { key: "current_region", label: "현재 리전", helper: "현재 데이터가 저장 또는 처리되는 위치를 선택하세요.", kind: "select", options: emptyFirst(targetRegionOptions, "선택"), required: true },
      { key: "target_region", label: "대상 리전", helper: "이전 또는 복제 대상 위치를 선택하세요.", kind: "select", options: emptyFirst(targetRegionOptions, "선택"), required: true },
    ],
  },
  {
    id: "lgpd_lawfulness",
    title: "처리 근거와 권리 대응",
    description: "LGPD 제7조·제11조 근거, 투명성, 권리 대응과 보관 기준을 확인합니다.",
    fields: [
      { key: "processing_legal_basis", label: "제7조 처리 법적 근거", helper: "가장 가까운 LGPD 제7조 근거를 선택하세요.", kind: "select", options: emptyFirst(lgpdBasisOptions, "선택"), required: true },
      { key: "processing_purpose_defined", label: "처리·이전 목적이 정의되어 있나요?", helper: "처리 목적과 국제이전 목적이 명확히 문서화되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "data_minimized", label: "필요·관련·비과도한 데이터만 처리하나요?", helper: "목적에 필요한 최소 범위인지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "retention_period_defined", label: "보관기간 또는 삭제 기준이 있나요?", helper: "보관기간, 삭제 시점, 파기 기준이 정해져 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "contains_sensitive_data", label: "민감정보가 포함되어 있나요?", helper: "건강, 생체, 유전, 인종·민족, 종교, 정치성향, 노조, 성생활 정보 등을 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "sensitive_data_legal_basis", label: "제11조 민감정보 처리 근거", helper: "민감정보가 있다면 별도 제11조 근거를 선택하세요.", kind: "select", options: emptyFirst(lgpdSensitiveBasisOptions, "선택"), visibleIf: (state: GuidedFormState) => state.contains_sensitive_data === "true" },
      { key: "specific_highlighted_consent_for_sensitive_data", label: "민감정보 특정·강조 동의", helper: "민감정보 근거가 동의라면 특정 목적에 대한 강조 동의가 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.sensitive_data_legal_basis === "consent" },
      { key: "legitimate_interest_assessment_completed", label: "정당한 이익 평가 완료", helper: "정당한 이익 근거 사용 시 필요성, 기대가능성, 투명성 평가가 문서화됐는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.processing_legal_basis === "legitimate_interest" },
      { key: "privacy_policy_available", label: "처리방침 또는 고지가 공개되어 있나요?", helper: "컨트롤러 처리방침이나 동등한 개인정보 고지가 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "data_subject_rights_request_ready", label: "정보주체 권리 요청 대응 절차가 있나요?", helper: "확인, 접근, 정정, 익명화, 차단, 삭제, 이동, 정보제공, 반대, 동의철회 요청 대응을 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "consent_withdrawal_process_ready", label: "동의 철회 절차가 있나요?", helper: "동의 근거 사용 시 철회 절차가 실제로 작동하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.processing_legal_basis === "consent" },
      { key: "records_of_processing_exists", label: "처리 활동 기록이 있나요?", helper: "처리 활동 기록에 관련 이전 사실이 포함되는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
    ],
  },
  {
    id: "lgpd_transfer",
    title: "국제이전 메커니즘",
    description: "브라질 밖 이전일 때 적정성, ANPD 승인 보호조치, 예외 경로와 투명성 문서를 확인합니다.",
    fields: [
      { key: "adequacy_decision_confirmed", label: "ANPD 적정성 결정이 있나요?", helper: "대상 국가 또는 국제기구가 ANPD 적정성 결정을 받았는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isLgpdTransferOutsideBrazil },
      { key: "standard_contractual_clauses_in_place", label: "ANPD 표준계약조항을 사용하나요?", helper: "ANPD 승인 SCC가 이전 계약 또는 부속서에 포함되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isLgpdTransferOutsideBrazil },
      { key: "standard_contractual_clauses_full_unaltered", label: "SCC 원문 전체·무변경 채택 완료", helper: "ANPD SCC를 전체·무변경으로 채택했는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => isLgpdTransferOutsideBrazil(state) && state.standard_contractual_clauses_in_place === "true" },
      { key: "legacy_contractual_clauses_used", label: "기존 계약조항에 의존하나요?", helper: "ANPD SCC 전환 전의 기존 또는 비ANPD 계약조항을 쓰는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isLgpdTransferOutsideBrazil },
      { key: "anpd_scc_migration_completed", label: "ANPD SCC 전환을 완료했나요?", helper: "기존 계약조항 사용 시 ANPD SCC로 필요한 전환을 완료했는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => isLgpdTransferOutsideBrazil(state) && state.legacy_contractual_clauses_used === "true" },
      { key: "specific_contractual_clauses_used", label: "특정계약조항을 사용하나요?", helper: "예외적 사실·법률 상황 때문에 특정계약조항을 쓰는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isLgpdTransferOutsideBrazil },
      { key: "specific_contractual_clauses_anpd_approved", label: "특정계약조항 ANPD 승인", helper: "특정계약조항이 ANPD 승인을 받았는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => isLgpdTransferOutsideBrazil(state) && state.specific_contractual_clauses_used === "true" },
      { key: "binding_corporate_rules_used", label: "BCR을 사용하나요?", helper: "기업집단 내부 국제이전에 BCR을 사용하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isLgpdTransferOutsideBrazil },
      { key: "binding_corporate_rules_anpd_approved", label: "BCR ANPD 승인", helper: "BCR이 ANPD 승인을 받았고 이번 이전이 승인 범위 안인지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => isLgpdTransferOutsideBrazil(state) && state.binding_corporate_rules_used === "true" },
      { key: "certification_or_code_approved", label: "ANPD 인정 인증·행동강령", helper: "ANPD 인정 인증, 씰, 행동강령이 국제이전을 뒷받침하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isLgpdTransferOutsideBrazil },
      { key: "transfer_exception_used", label: "예외 이전 경로를 사용하나요?", helper: "적정성이나 ANPD 승인 보호조치 대신 제33조 예외 경로를 쓰는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true, visibleIf: isLgpdTransferOutsideBrazil },
      { key: "transfer_exception_type", label: "예외 유형", helper: "예외 경로 사용 시 세부 유형을 선택하세요.", kind: "select", options: emptyFirst(lgpdTransferExceptionTypeOptions, "선택"), visibleIf: (state: GuidedFormState) => isLgpdTransferOutsideBrazil(state) && state.transfer_exception_used === "true" },
      { key: "international_transfer_transparency_document_available", label: "국제이전 투명성 문서가 있나요?", helper: "포르투갈어로 쉽고 명확한 국제이전 공개 문서 또는 처리방침 섹션이 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isLgpdTransferOutsideBrazil },
      { key: "full_transfer_clauses_request_ready", label: "전체 이전 조항 제공 요청 대응", helper: "요청 시 영업비밀 제한 범위 안에서 전체 이전 조항을 제공할 수 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isLgpdTransferOutsideBrazil },
      { key: "subsequent_transfer_expected", label: "후속·재이전이 예상되나요?", helper: "수입자가 다시 다른 국가나 제3자에게 이전할 가능성을 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isLgpdTransferOutsideBrazil },
      { key: "subsequent_transfer_controls_in_place", label: "후속·재이전 통제가 있나요?", helper: "후속 이전 제한, 조건, 보호조치가 계약·운영에 반영되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => isLgpdTransferOutsideBrazil(state) && state.subsequent_transfer_expected === "true" },
    ],
  },
  {
    id: "lgpd_processor_risk",
    title: "처리자, 위험, 보안",
    description: "처리자 거버넌스, 대규모·고위험 처리, DPO/영향평가, 보안과 사고 대응을 확인합니다.",
    fields: [
      { key: "uses_processor", label: "처리자/운영자를 사용하나요?", helper: "외부 업체, 클라우드, SaaS, 하청 처리자가 관여하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "processor_agreement_in_place", label: "처리자 계약 또는 지시가 있나요?", helper: "처리자 사용 시 계약, 서면 지시 또는 구속력 있는 조건이 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "processor_compliance_verified", label: "처리자 준수·보증을 검증했나요?", helper: "처리자의 보증, 준수 상태, 보안조치를 컨트롤러가 확인했는지 봅니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "subprocessor_or_onward_transfer_controls", label: "하위처리자·재이전 통제", helper: "하청, 하위처리자, 수입자 재이전 통제가 계약에 반영되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "large_scale_or_continuous_transfer", label: "대규모 또는 지속적 이전인가요?", helper: "반복적·상시적·대규모 이전인지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "large_scale_or_high_risk_processing", label: "대규모 또는 고위험 처리인가요?", helper: "데이터 성격, 규모, 목적, 영향 기준으로 고위험 가능성을 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "dpo_or_encarregado_assigned", label: "DPO/encarregado가 지정되어 있나요?", helper: "LGPD 담당자 또는 프라이버시 연락창구가 지정·공개되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "data_protection_impact_report_completed", label: "영향평가 또는 위험검토를 완료했나요?", helper: "고위험 또는 민감 처리라면 RIPD/PIA 등 영향 검토가 완료됐는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "encryption_at_rest", label: "저장 시 암호화가 적용되어 있나요?", helper: "저장 데이터 암호화 여부를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "encryption_in_transit", label: "전송 시 암호화가 적용되어 있나요?", helper: "TLS 등 전송 구간 암호화가 적용되는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "access_control_in_place", label: "접근통제가 적용되어 있나요?", helper: "권한 관리, 접근 제한, 인증 통제가 적용되는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "security_incident_response_ready", label: "보안사고 대응 절차가 있나요?", helper: "보안사고 처리, 위험평가, ANPD·정보주체 통지와 기록 절차를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
    ],
  },
] as const;

const pipaSteps = [
  {
    id: "pipa_context",
    title: "한국 PIPA 검토 기본 정보",
    description: "한국 개인정보 처리와 국외이전 여부를 판단하기 위한 기본 정보를 입력합니다.",
    fields: [
      { key: "dataset_name", label: "데이터셋 명칭", helper: "검토할 데이터셋을 선택하세요.", kind: "select", options: emptyFirst(datasetOptions, "선택"), required: true },
      { key: "data_type", label: "데이터 유형", helper: "데이터 성격을 선택하세요.", kind: "select", options: emptyFirst(dataTypeOptions, "선택"), required: true },
      { key: "current_region", label: "현재 리전", helper: "현재 데이터가 저장 또는 처리되는 위치입니다.", kind: "select", options: emptyFirst(targetRegionOptions, "선택"), required: true },
      { key: "target_region", label: "대상 리전", helper: "이전 또는 복제 대상 위치입니다.", kind: "select", options: emptyFirst(targetRegionOptions, "선택"), required: true },
      { key: "lawful_basis", label: "수집·이용 적법근거", helper: "동의, 계약 이행, 법령상 근거 등 가장 가까운 근거를 선택하세요.", kind: "select", options: emptyFirst(pipaLawfulBasisOptions, "선택"), required: true },
    ],
  },
  {
    id: "pipa_basic",
    title: "처리 원칙, 고지, 제3자 제공",
    description: "목적, 최소수집, 보관기간, 처리방침, 동의 문구와 제3자 제공 근거를 확인합니다.",
    fields: [
      { key: "processing_purpose_defined", label: "처리 목적이 정의되어 있나요?", helper: "개인정보 처리 목적이 구체적으로 정해져 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "data_minimized", label: "필요 최소한의 정보만 처리하나요?", helper: "목적에 필요한 최소 항목만 처리하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "retention_period_defined", label: "보유기간·파기 기준이 있나요?", helper: "보유기간과 파기 기준이 정해져 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "privacy_policy_available", label: "개인정보 처리방침이 공개되어 있나요?", helper: "처리방침 또는 고지 문서가 준비되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "privacy_notice_available", label: "수집·이용 고지가 제공되나요?", helper: "정보주체에게 필요한 고지 사항이 제공되는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "consent_notice_clear", label: "동의 항목이 구분·명확한가요?", helper: "동의 근거 사용 시 필수·선택, 항목, 목적 등이 명확히 구분되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.lawful_basis === "consent" },
      { key: "consent_withdrawal_process_ready", label: "동의 철회·처리정지 절차가 있나요?", helper: "동의 철회나 처리정지 요청을 처리할 수 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "third_party_sharing", label: "제3자 제공이 있나요?", helper: "수탁·공유가 아니라 제3자 제공에 해당하는 흐름이 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "third_party_provision_consent_or_basis", label: "제3자 제공 동의 또는 법령 근거가 있나요?", helper: "제3자 제공이 있다면 동의나 법령상 근거를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.third_party_sharing === "true" },
      { key: "data_subject_rights_process_ready", label: "정보주체 권리 대응 절차가 있나요?", helper: "열람, 정정, 삭제, 처리정지, 동의철회 대응 절차를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
    ],
  },
  {
    id: "pipa_sensitive",
    title: "민감정보와 고유식별정보",
    description: "민감정보, 고유식별정보, 주민등록번호 처리 여부와 근거를 확인합니다.",
    fields: [
      { key: "contains_sensitive_data", label: "민감정보가 포함되어 있나요?", helper: "건강, 사상·신념, 범죄경력 등 민감정보 포함 여부를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "sensitive_data_basis", label: "민감정보 처리 근거", helper: "민감정보가 있다면 명시적 동의 또는 법령상 근거를 선택하세요.", kind: "select", options: emptyFirst(pipaSensitiveDataBasisOptions, "선택"), visibleIf: (state: GuidedFormState) => state.contains_sensitive_data === "true" },
      { key: "has_unique_identifier", label: "고유식별정보가 포함되어 있나요?", helper: "여권번호, 운전면허번호, 외국인등록번호 등 포함 여부를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "unique_identifier_basis", label: "고유식별정보 처리 근거", helper: "고유식별정보가 있다면 별도 동의 또는 법령상 근거를 선택하세요.", kind: "select", options: emptyFirst(pipaUniqueIdentifierBasisOptions, "선택"), visibleIf: (state: GuidedFormState) => state.has_unique_identifier === "true" },
      { key: "uses_resident_registration_number", label: "주민등록번호를 처리하나요?", helper: "주민등록번호 처리 여부를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "resident_registration_statutory_basis", label: "주민등록번호 법령 근거가 있나요?", helper: "주민등록번호 처리가 법령에 의해 허용 또는 요구되는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_resident_registration_number === "true" },
    ],
  },
  {
    id: "pipa_transfer",
    title: "국외이전과 보호조치",
    description: "한국 밖으로 이전하는 경우 제28조의8상 허용 경로, 고지, 보호조치와 재이전 통제를 확인합니다.",
    fields: [
      { key: "separate_consent_for_transfer", label: "국외이전 별도 동의를 받았나요?", helper: "국외이전 별도 동의 경로를 사용하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isPipaCrossBorderContext },
      { key: "contract_necessity_disclosed_or_notified", label: "계약 이행상 위탁·보관 필요 및 공개/통지", helper: "계약 이행상 필요한 위탁·보관이고 처리방침 공개 또는 통지가 되었는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isPipaCrossBorderContext },
      { key: "treaty_or_statutory_transfer_basis", label: "법률·조약·국제협정 근거", helper: "법률, 조약, 국제협정상 국외이전 근거가 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isPipaCrossBorderContext },
      { key: "pipa_certified_recipient", label: "인증받은 수령자", helper: "보호위원회 지정 인증 등을 받은 수령자인지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isPipaCrossBorderContext },
      { key: "pipa_equivalence_recognition_exists", label: "동등 보호수준 인정", helper: "보호위원회가 동등한 보호수준을 인정한 국가 또는 기관인지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isPipaCrossBorderContext },
      { key: "cross_border_notice_provided", label: "국외이전 고지 항목 제공", helper: "이전 항목, 국가, 시기, 방법, 수령자, 목적, 보유기간, 거부 방법 등을 고지했는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isPipaCrossBorderContext },
      { key: "transfer_protection_measures_ready", label: "국외이전 보호조치 준비", helper: "국외 수령자의 보호조치와 권리보장 절차가 준비되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isPipaCrossBorderContext },
      { key: "onward_transfer_controls", label: "제3국 재이전 통제", helper: "국외 수령자가 다시 제3국으로 이전하는 경우를 통제하는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: isPipaCrossBorderContext },
    ],
  },
  {
    id: "pipa_processor_security",
    title: "위탁, 보안, 거버넌스",
    description: "수탁자 관리, 안전조치, 보호책임자, 사고 대응 준비 상태를 확인합니다.",
    fields: [
      { key: "uses_processor", label: "수탁자 또는 외부 처리자를 사용하나요?", helper: "클라우드, SaaS, 외주사 등 처리위탁이 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "dpa_in_place", label: "위탁계약 또는 문서가 있나요?", helper: "위탁업무 범위와 보호조치가 포함된 문서가 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "processor_public_disclosure", label: "수탁자 공개가 되어 있나요?", helper: "위탁업무와 수탁자 정보를 처리방침 등으로 공개했는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "processor_supervision_done", label: "수탁자 교육·감독을 했나요?", helper: "수탁자 점검, 교육, 감독 이력이 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "subprocessor_controls_in_place", label: "재위탁 통제가 있나요?", helper: "재위탁 승인, 제한 조항, 하위 수탁자 통제가 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.uses_processor === "true" },
      { key: "encryption_at_rest", label: "저장 시 암호화가 적용되어 있나요?", helper: "저장 데이터 암호화 여부를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "encryption_in_transit", label: "전송 시 암호화가 적용되어 있나요?", helper: "전송 구간 암호화 여부를 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "access_control_in_place", label: "접근통제가 적용되어 있나요?", helper: "권한 관리와 접근 제한이 적용되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "privacy_officer_assigned", label: "개인정보 보호책임자가 지정되어 있나요?", helper: "보호책임자 또는 담당 부서가 지정되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
      { key: "breach_response_ready", label: "침해 대응 절차가 있나요?", helper: "유출 등 사고 발생 시 대응 절차가 준비되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, required: true },
    ],
  },
  {
    id: "pipa_automated",
    title: "자동화된 결정",
    description: "완전 자동화된 결정과 설명·인적 개입 대응권 준비 상태를 확인합니다.",
    fields: [
      { key: "is_automated_decision_only", label: "완전 자동화된 결정이 있나요?", helper: "AI·자동화 시스템이 사람 개입 없이 개인정보 기반 결정을 내리는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions },
      { key: "automated_decision_significant_effect", label: "권리·의무에 중대한 영향이 있나요?", helper: "자동화된 결정이 정보주체 권리 또는 의무에 중대한 영향을 주는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.is_automated_decision_only === "true" },
      { key: "automated_decision_rights_ready", label: "자동화 결정 대응권 절차가 있나요?", helper: "거부, 설명 요구, 인적 개입, 재처리 절차가 준비되어 있는지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.is_automated_decision_only === "true" && state.automated_decision_significant_effect === "true" },
      { key: "provides_explanation", label: "설명이 제공되나요?", helper: "자동화된 결정에 대한 설명 제공 또는 요청 대응이 가능한지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.is_automated_decision_only === "true" && state.automated_decision_significant_effect === "true" },
      { key: "human_review_available", label: "인적 개입 또는 재처리가 가능한가요?", helper: "정보주체 권리 행사 시 사람의 검토나 재처리가 가능한지 확인합니다.", kind: "segmented", options: yesNoUnknownOptions, visibleIf: (state: GuidedFormState) => state.is_automated_decision_only === "true" && state.automated_decision_significant_effect === "true" },
    ],
  },
] as const;

export const PACK_UI_DEFINITIONS: Record<string, PackUiDefinition> = {
  gdpr: {
    id: "gdpr",
    label: "EU GDPR",
    subtitle: "EU/EEA 국외이전 평가",
    storageKey: "border-checker-guided-gdpr-v3",
    steps: gdprSteps as unknown as PackUiDefinition["steps"],
    defaultState: gdprDefaultState,
    validate: (state) => {
      const missing = gdprSteps.flatMap((step) =>
        missingVisibleRequired(step.fields, state),
      );
      if (
        isGdprCrossBorderContext(state)
        && state.derogation_used === "true"
        && !state.derogation_type
      ) {
        missing.push("예외 유형");
      }
      return missing;
    },
    buildPayload: (state) => {
      const crossBorder = isGdprCrossBorderContext(state);
      return {
        aws_data: {
          current_region: state.current_region,
          encryption_at_rest: toNullableBoolean(state.encryption_at_rest),
          data_type: state.data_type,
          contains_sensitive_data: toNullableBoolean(state.contains_sensitive_data),
          uses_processor: toNullableBoolean(state.uses_processor),
          encryption_in_transit: toNullableBoolean(state.encryption_in_transit),
          access_control_in_place: toNullableBoolean(state.access_control_in_place)
        },
        policy_data: {
          dataset_name: state.dataset_name,
          data_subject_region: state.data_subject_region,
          processing_purpose_defined: toNullableBoolean(state.processing_purpose_defined),
          data_minimized: toNullableBoolean(state.data_minimized),
          retention_period_defined: toNullableBoolean(state.retention_period_defined),
          lawful_basis: state.lawful_basis === "unknown" ? null : state.lawful_basis || null,
          special_category_condition_met: toNullableBoolean(state.special_category_condition_met),
          target_region: state.target_region,
          controller_processor_roles_defined: toNullableBoolean(state.controller_processor_roles_defined),
          dpa_in_place: toNullableBoolean(state.dpa_in_place),
          processor_sufficient_guarantees: toNullableBoolean(state.processor_sufficient_guarantees),
          subprocessor_controls_in_place: toNullableBoolean(state.subprocessor_controls_in_place),
          scc_in_place: toNullableBoolean(state.scc_in_place),
          bcr_in_place: toNullableBoolean(state.bcr_in_place),
          other_safeguards_in_place: toNullableBoolean(state.other_safeguards_in_place),
          transfer_impact_assessment_completed: toNullableBoolean(state.transfer_impact_assessment_completed),
          supplemental_measures_documented: toNullableBoolean(state.supplemental_measures_documented),
          incident_response_in_place: toNullableBoolean(state.incident_response_in_place),
          breach_notification_ready_72h: toNullableBoolean(state.breach_notification_ready_72h),
          derogation_used: crossBorder
            ? toNullableBoolean(state.derogation_used)
            : false,
          derogation_type:
            crossBorder && state.derogation_used === "true"
              ? state.derogation_type || null
              : null,
          privacy_notice_updated: toNullableBoolean(state.privacy_notice_updated),
          transfer_disclosed_to_subject: toNullableBoolean(state.transfer_disclosed_to_subject),
          records_of_processing_exists: toNullableBoolean(state.records_of_processing_exists),
          transfer_documented_in_ropa: toNullableBoolean(state.transfer_documented_in_ropa),
          data_subject_rights_process_ready: toNullableBoolean(state.data_subject_rights_process_ready),
          privacy_by_design_review_completed: toNullableBoolean(state.privacy_by_design_review_completed),
          dpia_required: toNullableBoolean(state.dpia_required),
          dpia_completed:
            state.dpia_required === "true" && state.dpia_completed
              ? toRequiredBoolean(state.dpia_completed, "DPIA 완료")
              : null,
          dpo_required: toNullableBoolean(state.dpo_required),
          dpo_assigned:
            state.dpo_required === "true" && state.dpo_assigned
              ? toRequiredBoolean(state.dpo_assigned, "DPO 지정 완료")
              : null
        }
      };
    },
    buildAdvisoryNotes: (state) => {
      const notes: string[] = [];
      if (!isGdprCrossBorderContext(state) && state.target_region) {
        notes.push("대상 리전이 EU/EEA 안이면 이전 메커니즘 질문 일부를 자동으로 줄였습니다.");
      }
      if (isGdprCrossBorderContext(state)) {
        notes.push("EU/EEA 밖 이전으로 보여 SCC/BCR/TIA 같은 이전 장치 질문을 함께 확인합니다.");
      }
      if (state.contains_sensitive_data === "true") {
        notes.push("민감정보라면 제9조 예외 요건, 보완조치, DPIA 문서를 함께 챙기는 편이 안전합니다.");
      }
      if (state.uses_processor === "true") {
        notes.push("외부 처리자를 쓰면 역할 정의, DPA, 하위처리자 통제부터 잡는 것이 가장 효과적입니다.");
      }
      if (needsGdprElevatedGovernanceQuestions(state)) {
        notes.push("이번 시나리오는 고위험 가능성이 있어 DPIA와 DPO 필요 여부 질문을 함께 확인합니다.");
      }
      return notes.length > 0 ? notes : ["현재는 비교적 단순한 GDPR 처리 또는 역내 이전 시나리오로 볼 수 있습니다."];
    },
    buildSummaryRows: (state) => [
      { label: "데이터셋", value: getOptionLabel(datasetOptions, state.dataset_name) },
      { label: "리전 흐름", value: state.current_region && state.target_region ? `${state.current_region} -> ${state.target_region}` : "미선택" },
      { label: "처리 이유", value: getOptionLabel(gdprLawfulBasisOptions, state.lawful_basis) },
      { label: "민감정보", value: state.contains_sensitive_data === "true" ? "포함" : state.contains_sensitive_data === "false" ? "미포함" : "미확인" }
    ]
  },
  saudi_pdpl: {
    id: "saudi_pdpl",
    label: "Saudi PDPL",
    subtitle: "사우디 국외이전 평가",
    storageKey: "border-checker-guided-saudi-v3",
    steps: saudiSteps as unknown as PackUiDefinition["steps"],
    defaultState: saudiDefaultState,
    validate: (state) => {
      const missing = saudiSteps.flatMap((step) =>
        missingVisibleRequired(step.fields, state),
      );
      if (
        isSaudiCrossBorderContext(state)
        && state.transfer_exception_used === "true"
        && !state.transfer_exception_type
      ) {
        missing.push("예외 유형");
      }
      return missing;
    },
    buildPayload: (state) => {
      const crossBorder = isSaudiCrossBorderContext(state);
      return {
        aws_data: {
          current_region: state.current_region,
          encryption_at_rest: toNullableBoolean(state.encryption_at_rest),
          data_type: state.data_type,
          contains_sensitive_data: toNullableBoolean(state.contains_sensitive_data),
          uses_processor: toNullableBoolean(state.uses_processor),
          encryption_in_transit: toNullableBoolean(state.encryption_in_transit),
          access_control_in_place: toNullableBoolean(state.access_control_in_place)
        },
        policy_data: {
          dataset_name: state.dataset_name,
          data_subject_connection: state.data_subject_connection,
          processing_purpose_defined: toNullableBoolean(state.processing_purpose_defined),
          data_minimized: toNullableBoolean(state.data_minimized),
          retention_period_defined: toNullableBoolean(state.retention_period_defined),
          processing_legal_basis: state.processing_legal_basis === "unknown" ? null : state.processing_legal_basis || null,
          explicit_consent_for_sensitive_data: toNullableBoolean(state.explicit_consent_for_sensitive_data),
          privacy_policy_available: toNullableBoolean(state.privacy_policy_available),
          data_subject_rights_request_ready: toNullableBoolean(state.data_subject_rights_request_ready),
          consent_withdrawal_process_ready: toNullableBoolean(state.consent_withdrawal_process_ready),
          data_accuracy_review_completed: toNullableBoolean(state.data_accuracy_review_completed),
          privacy_notice_available: toNullableBoolean(state.privacy_notice_available),
          cross_border_notice_provided: toNullableBoolean(state.cross_border_notice_provided),
          target_region: state.target_region,
          adequate_protection_confirmed: toNullableBoolean(state.adequate_protection_confirmed),
          binding_common_rules_approved: toNullableBoolean(state.binding_common_rules_approved),
          standard_contractual_clauses_in_place: toNullableBoolean(state.standard_contractual_clauses_in_place),
          certification_or_code_in_place: toNullableBoolean(state.certification_or_code_in_place),
          transfer_exception_used: crossBorder
            ? toNullableBoolean(state.transfer_exception_used)
            : false,
          transfer_exception_type:
            crossBorder && state.transfer_exception_used === "true"
              ? state.transfer_exception_type || null
              : null,
          transfer_risk_assessment_completed: toNullableBoolean(state.transfer_risk_assessment_completed),
          large_scale_or_continuous_transfer: toNullableBoolean(state.large_scale_or_continuous_transfer),
          processor_agreement_in_place: toNullableBoolean(state.processor_agreement_in_place),
          processor_compliance_verified: toNullableBoolean(state.processor_compliance_verified),
          subprocessor_or_onward_transfer_controls: toNullableBoolean(state.subprocessor_or_onward_transfer_controls),
          records_of_processing_exists: toNullableBoolean(state.records_of_processing_exists),
          dpo_required: toNullableBoolean(state.dpo_required),
          dpo_assigned:
            state.dpo_required === "true" && state.dpo_assigned
              ? toRequiredBoolean(state.dpo_assigned, "DPO 지정 완료")
              : null,
          processing_impact_assessment_completed: toNullableBoolean(state.processing_impact_assessment_completed),
          breach_response_72h_ready: toNullableBoolean(state.breach_response_72h_ready)
        }
      };
    },
    buildAdvisoryNotes: (state) => {
      const notes: string[] = [];
      if (!isSaudiCrossBorderContext(state) && state.target_region) {
        notes.push("대상 위치가 사우디 안이면 국외이전 경로 질문 일부를 자동으로 줄였습니다.");
      }
      if (isSaudiCrossBorderContext(state)) {
        notes.push("사우디 밖으로 이전하는 경우 적정 보호 수준, 승인된 보호조치, 예외 경로 중 무엇을 쓰는지 분명해야 합니다.");
      }
      if (state.contains_sensitive_data === "true") {
        notes.push("민감정보가 있으면 명시적 동의, 위험평가, DPO 필요성 검토를 같이 보는 편이 좋습니다.");
      }
      if (state.uses_processor === "true") {
        notes.push("사우디 팩에서는 프로세서 계약과 준수 검증, 재이전 통제를 함께 확인하는 것이 중요합니다.");
      }
      if (state.processing_legal_basis === "consent") {
        notes.push("동의 기반 처리라면 동의 철회 경로와 관련 고지 문구까지 같이 정리해 두는 편이 좋습니다.");
      }
      return notes.length > 0 ? notes : ["현재는 사우디 내 처리 또는 비교적 단순한 이전 시나리오로 보입니다."];
    },
    buildSummaryRows: (state) => [
      { label: "데이터셋", value: getOptionLabel(saudiDatasetOptions, state.dataset_name) },
      { label: "사우디 연결성", value: getOptionLabel(dataSubjectConnectionOptions, state.data_subject_connection) },
      { label: "위치 흐름", value: state.current_region && state.target_region ? `${state.current_region} -> ${state.target_region}` : "미선택" },
      { label: "처리 근거", value: getOptionLabel(saudiLegalBasisOptions, state.processing_legal_basis) }
    ]
  },

  taiwan: {
    id: "taiwan",
    label: "Taiwan PDPA",
    subtitle: "대만 PDPA 국제전송 평가",
    storageKey: "border-checker-guided-taiwan-v1",
    steps: taiwanSteps as unknown as PackUiDefinition["steps"],
    defaultState: taiwanDefaultState,
    validate: (state) => {
      return taiwanSteps.flatMap((step) =>
        missingVisibleRequired(step.fields, state),
      );
    },
    buildPayload: (state) => {
      const crossBorder = isTaiwanCrossBorderContext(state);
      const usesCommissionedProcessor =
        toNullableBoolean(state.uses_commissioned_processor) ?? false;

      return {
        aws_data: {
          current_region: state.current_region,
          encryption_at_rest: toNullableBoolean(state.encryption_at_rest),
          data_type: state.data_type,
          contains_article6_sensitive_data: toNullableBoolean(state.contains_article6_sensitive_data),
          uses_commissioned_processor: usesCommissionedProcessor,
          encryption_in_transit: toNullableBoolean(state.encryption_in_transit),
          access_control_in_place: toNullableBoolean(state.access_control_in_place),
        },
        policy_data: {
          dataset_name: state.dataset_name,
          agency_type: state.agency_type,
          target_region: state.target_region,
          specific_purpose_defined: toNullableBoolean(state.specific_purpose_defined),
          purpose_necessity_review_completed: toNullableBoolean(state.purpose_necessity_review_completed),
          collection_processing_basis: state.collection_processing_basis,
          contains_article6_sensitive_data: toNullableBoolean(state.contains_article6_sensitive_data),
          sensitive_data_exception_basis:
            state.contains_article6_sensitive_data === "true"
              ? state.sensitive_data_exception_basis || null
              : null,
          written_consent_for_sensitive_data:
            state.sensitive_data_exception_basis === "written_consent"
              ? toNullableBoolean(state.written_consent_for_sensitive_data)
              : null,
          consent_freely_given:
            state.sensitive_data_exception_basis === "written_consent"
              ? toNullableBoolean(state.consent_freely_given)
              : null,
          consent_proof_available:
            state.collection_processing_basis === "data_subject_consent"
            || state.sensitive_data_exception_basis === "written_consent"
              ? toNullableBoolean(state.consent_proof_available)
              : null,
          collected_directly_from_data_subject: toNullableBoolean(state.collected_directly_from_data_subject),
          article8_notice_provided: toNullableBoolean(state.article8_notice_provided),
          indirect_collection_notice_required:
            state.collected_directly_from_data_subject === "false"
              ? toNullableBoolean(state.indirect_collection_notice_required)
              : false,
          article9_source_notice_provided:
            state.collected_directly_from_data_subject === "false"
              ? toNullableBoolean(state.article9_source_notice_provided)
              : null,
          data_subject_rights_request_ready: toNullableBoolean(state.data_subject_rights_request_ready),
          rights_deadline_tracking_ready: toNullableBoolean(state.rights_deadline_tracking_ready),
          data_accuracy_review_completed: toNullableBoolean(state.data_accuracy_review_completed),
          retention_period_defined: toNullableBoolean(state.retention_period_defined),
          use_outside_original_specific_purpose: toNullableBoolean(state.use_outside_original_specific_purpose),
          outside_purpose_use_basis:
            state.use_outside_original_specific_purpose === "true"
              ? state.outside_purpose_use_basis || null
              : null,
          separate_consent_for_outside_purpose:
            state.outside_purpose_use_basis === "consent"
              ? toNullableBoolean(state.separate_consent_for_outside_purpose)
              : null,
          uses_data_for_marketing: toNullableBoolean(state.uses_data_for_marketing),
          marketing_optout_mechanism_ready:
            state.uses_data_for_marketing === "true"
              ? toNullableBoolean(state.marketing_optout_mechanism_ready)
              : null,
          data_subject_objected_public_source_processing:
            state.collection_processing_basis === "publicly_available_source"
              ? toNullableBoolean(state.data_subject_objected_public_source_processing)
              : false,
          public_source_objection_handled:
            state.data_subject_objected_public_source_processing === "true"
              ? toNullableBoolean(state.public_source_objection_handled)
              : null,
          breach_notification_process_ready: toNullableBoolean(state.breach_notification_process_ready),
          security_maintenance_measures_ready: toNullableBoolean(state.security_maintenance_measures_ready),
          industry_security_plan_required: toNullableBoolean(state.industry_security_plan_required),
          industry_security_plan_in_place:
            state.industry_security_plan_required === "true"
              ? toNullableBoolean(state.industry_security_plan_in_place)
              : null,
          uses_commissioned_processor: usesCommissionedProcessor,
          commissioned_processor_terms_in_place:
            usesCommissionedProcessor
              ? toNullableBoolean(state.commissioned_processor_terms_in_place)
              : null,
          cross_border_transfer: toNullableBoolean(state.cross_border_transfer),
          recipient_country_protection_adequate:
            crossBorder
              ? toNullableBoolean(state.recipient_country_protection_adequate)
              : null,
          major_national_interest_involved:
            crossBorder
              ? toNullableBoolean(state.major_national_interest_involved)
              : false,
          treaty_or_agreement_restriction_known:
            crossBorder
              ? toNullableBoolean(state.treaty_or_agreement_restriction_known)
              : false,
          third_country_circumvention_risk:
            crossBorder
              ? toNullableBoolean(state.third_country_circumvention_risk)
              : false,
          authority_transfer_restriction_applies:
            crossBorder
              ? toNullableBoolean(state.authority_transfer_restriction_applies)
              : false,
        },
      };
    },
    buildAdvisoryNotes: (state) => {
      const notes: string[] = [];
      if (isTaiwanCrossBorderContext(state)) {
        notes.push("대만 국외전송 시 주무기관 제한 사유 적용 여부를 우선 확인합니다.");
      }
      if (state.contains_article6_sensitive_data === "true") {
        notes.push("대만 PDPA 제6조 민감정보는 허용 예외와 서면 동의의 자유로운 제공 여부를 별도로 확인해야 합니다.");
      }
      if (state.use_outside_original_specific_purpose === "true") {
        notes.push("원래 특정 목적 밖 이용은 별도 근거와 동의 범위를 좁게 확인하는 편이 안전합니다.");
      }
      if (state.uses_commissioned_processor === "true") {
        notes.push("위탁 처리자는 지시, 보안, 반환·삭제, 감독 조건이 문서화되어야 합니다.");
      }
      if (state.authority_transfer_restriction_applies === "true") {
        notes.push("주무기관 제한 사유가 적용되면 자동 허용보다 거부 또는 법무 검토가 우선됩니다.");
      }
      return notes.length > 0 ? notes : ["대만 PDPA 기준의 기본 수집·처리·국외전송 검토입니다."];
    },
    buildSummaryRows: (state) => [
      { label: "데이터셋", value: getOptionLabel(datasetOptions, state.dataset_name) },
      { label: "기관 유형", value: getOptionLabel(taiwanAgencyOptions, state.agency_type) },
      { label: "리전 흐름", value: state.current_region && state.target_region ? `${state.current_region} -> ${state.target_region}` : "미선택" },
      { label: "국외전송", value: state.cross_border_transfer === "true" ? "예" : state.cross_border_transfer === "false" ? "아니오" : "미확인" },
    ],
  },

  lgpd: {
    id: "lgpd",
    label: "Brazil LGPD",
    subtitle: "브라질 LGPD 국제이전 평가",
    storageKey: "border-checker-guided-lgpd-v1",
    steps: lgpdSteps as unknown as PackUiDefinition["steps"],
    defaultState: lgpdDefaultState,
    validate: (state) => {
      const missing = lgpdSteps.flatMap((step) =>
        missingVisibleRequired(step.fields, state),
      );
      if (
        isLgpdTransferOutsideBrazil(state)
        && state.transfer_exception_used === "true"
        && !state.transfer_exception_type
      ) {
        missing.push("예외 유형");
      }
      return missing;
    },
    buildPayload: (state) => {
      const transferOutsideBrazil = isLgpdTransferOutsideBrazil(state);
      const processorUsed = toNullableBoolean(state.uses_processor) ?? false;

      return {
        aws_data: {
          current_region: state.current_region,
          encryption_at_rest: toNullableBoolean(state.encryption_at_rest),
          data_type: state.data_type,
          contains_sensitive_data: toNullableBoolean(state.contains_sensitive_data),
          uses_processor: processorUsed,
          encryption_in_transit: toNullableBoolean(state.encryption_in_transit),
          access_control_in_place: toNullableBoolean(state.access_control_in_place),
        },
        policy_data: {
          dataset_name: state.dataset_name,
          data_subject_connection: state.data_subject_connection,
          target_region: state.target_region,
          processing_purpose_defined: toNullableBoolean(state.processing_purpose_defined),
          data_minimized: toNullableBoolean(state.data_minimized),
          retention_period_defined: toNullableBoolean(state.retention_period_defined),
          processing_legal_basis: state.processing_legal_basis || null,
          contains_sensitive_data: toNullableBoolean(state.contains_sensitive_data),
          sensitive_data_legal_basis:
            state.contains_sensitive_data === "true"
              ? state.sensitive_data_legal_basis || null
              : null,
          specific_highlighted_consent_for_sensitive_data:
            state.sensitive_data_legal_basis === "consent"
              ? toNullableBoolean(state.specific_highlighted_consent_for_sensitive_data)
              : null,
          legitimate_interest_assessment_completed:
            state.processing_legal_basis === "legitimate_interest"
              ? toNullableBoolean(state.legitimate_interest_assessment_completed)
              : null,
          privacy_policy_available: toNullableBoolean(state.privacy_policy_available),
          data_subject_rights_request_ready: toNullableBoolean(state.data_subject_rights_request_ready),
          consent_withdrawal_process_ready:
            state.processing_legal_basis === "consent"
              ? toNullableBoolean(state.consent_withdrawal_process_ready)
              : null,
          records_of_processing_exists: toNullableBoolean(state.records_of_processing_exists),

          transfer_outside_brazil: transferOutsideBrazil,
          adequacy_decision_confirmed: transferOutsideBrazil
            ? toNullableBoolean(state.adequacy_decision_confirmed)
            : false,
          standard_contractual_clauses_in_place: transferOutsideBrazil
            ? toNullableBoolean(state.standard_contractual_clauses_in_place)
            : false,
          standard_contractual_clauses_full_unaltered: transferOutsideBrazil
            ? toNullableBoolean(state.standard_contractual_clauses_full_unaltered)
            : null,
          legacy_contractual_clauses_used: transferOutsideBrazil
            ? toNullableBoolean(state.legacy_contractual_clauses_used)
            : false,
          anpd_scc_migration_completed:
            transferOutsideBrazil && state.legacy_contractual_clauses_used === "true"
              ? toNullableBoolean(state.anpd_scc_migration_completed)
              : null,
          specific_contractual_clauses_used: transferOutsideBrazil
            ? toNullableBoolean(state.specific_contractual_clauses_used)
            : false,
          specific_contractual_clauses_anpd_approved: transferOutsideBrazil
            ? toNullableBoolean(state.specific_contractual_clauses_anpd_approved)
            : null,
          binding_corporate_rules_used: transferOutsideBrazil
            ? toNullableBoolean(state.binding_corporate_rules_used)
            : false,
          binding_corporate_rules_anpd_approved: transferOutsideBrazil
            ? toNullableBoolean(state.binding_corporate_rules_anpd_approved)
            : null,
          certification_or_code_approved: transferOutsideBrazil
            ? toNullableBoolean(state.certification_or_code_approved)
            : false,
          appropriate_transfer_mechanism_available:
            transferOutsideBrazil && hasLgpdApprovedTransferMechanism(state),
          transfer_exception_used: transferOutsideBrazil
            ? toNullableBoolean(state.transfer_exception_used)
            : false,
          transfer_exception_type:
            transferOutsideBrazil && state.transfer_exception_used === "true"
              ? state.transfer_exception_type || null
              : null,
          international_transfer_transparency_document_available:
            transferOutsideBrazil
              ? toNullableBoolean(state.international_transfer_transparency_document_available)
              : null,
          full_transfer_clauses_request_ready:
            transferOutsideBrazil
              ? toNullableBoolean(state.full_transfer_clauses_request_ready)
              : null,
          subsequent_transfer_expected:
            transferOutsideBrazil
              ? toNullableBoolean(state.subsequent_transfer_expected)
              : false,
          subsequent_transfer_controls_in_place:
            transferOutsideBrazil && state.subsequent_transfer_expected === "true"
              ? toNullableBoolean(state.subsequent_transfer_controls_in_place)
              : null,

          uses_processor: processorUsed,
          processor_agreement_in_place: processorUsed
            ? toNullableBoolean(state.processor_agreement_in_place)
            : null,
          processor_compliance_verified: processorUsed
            ? toNullableBoolean(state.processor_compliance_verified)
            : null,
          subprocessor_or_onward_transfer_controls: processorUsed
            ? toNullableBoolean(state.subprocessor_or_onward_transfer_controls)
            : null,
          large_scale_or_continuous_transfer: toNullableBoolean(state.large_scale_or_continuous_transfer),
          large_scale_or_high_risk_processing: toNullableBoolean(state.large_scale_or_high_risk_processing),
          dpo_or_encarregado_assigned: toNullableBoolean(state.dpo_or_encarregado_assigned),
          data_protection_impact_report_completed: toNullableBoolean(state.data_protection_impact_report_completed),
          security_incident_response_ready: toNullableBoolean(state.security_incident_response_ready),
        },
      };
    },
    buildAdvisoryNotes: (state) => {
      const notes: string[] = [];
      if (isLgpdTransferOutsideBrazil(state)) {
        notes.push("LGPD 국제이전은 적정성, SCC, BCR, 특정계약조항, 예외 경로 중 하나가 필요합니다.");
      }
      if (state.standard_contractual_clauses_in_place === "true") {
        notes.push("브라질 SCC는 ANPD 승인 문구의 전체·무변경 채택 여부를 확인해야 합니다.");
      }
      if (state.legacy_contractual_clauses_used === "true") {
        notes.push("기존 계약조항을 쓰는 경우 ANPD SCC 전환 완료 여부가 별도 검토 포인트입니다.");
      }
      if (state.uses_processor === "true") {
        notes.push("처리자를 사용하는 경우 처리자 계약, 준수 검증, 하위처리자·재이전 통제를 함께 확인합니다.");
      }
      if (state.contains_sensitive_data === "true") {
        notes.push("민감정보에는 LGPD 제11조 근거와 특정·강조 동의 필요성을 별도로 확인해야 합니다.");
      }
      return notes.length > 0 ? notes : ["브라질 LGPD 기준의 기본 처리·국제이전 검토입니다."];
    },
    buildSummaryRows: (state) => [
      { label: "데이터셋", value: getOptionLabel(datasetOptions, state.dataset_name) },
      { label: "브라질 연결성", value: getOptionLabel(lgpdDataSubjectConnectionOptions, state.data_subject_connection) },
      { label: "리전 흐름", value: state.current_region && state.target_region ? `${state.current_region} -> ${state.target_region}` : "미선택" },
      { label: "처리 근거", value: getOptionLabel(lgpdBasisOptions, state.processing_legal_basis) },
    ],
  },
  korea_pipa: {
    id: "korea_pipa",
    label: "Korea PIPA",
    subtitle: "한국 개인정보보호법 국외이전 평가",
    storageKey: "border-checker-guided-korea-pipa-v1",
    steps: pipaSteps as unknown as PackUiDefinition["steps"],
    defaultState: pipaDefaultState,
    validate: (state) => {
      return pipaSteps.flatMap((step) =>
        missingVisibleRequired(step.fields, state),
      );
    },
    buildPayload: (state) => {
      const crossBorder = isPipaCrossBorderContext(state);
      const usesProcessor = toNullableBoolean(state.uses_processor) ?? false;
      const automatedDecisionOnly =
        toNullableBoolean(state.is_automated_decision_only) ?? false;

      return {
        aws_data: {
          current_region: state.current_region,
          encryption_at_rest: toNullableBoolean(state.encryption_at_rest),
          encryption_in_transit: toNullableBoolean(state.encryption_in_transit),
          access_control_in_place: toNullableBoolean(state.access_control_in_place),

          data_type: state.data_type,
          contains_sensitive_data: toNullableBoolean(state.contains_sensitive_data),
          has_unique_identifier: toNullableBoolean(state.has_unique_identifier),
          uses_resident_registration_number: toNullableBoolean(state.uses_resident_registration_number),
          uses_processor: usesProcessor,
          is_automated_decision_only: automatedDecisionOnly,
        },
        policy_data: {
          dataset_name: state.dataset_name,
          target_region: state.target_region,

          lawful_basis: state.lawful_basis || null,
          processing_purpose_defined: toNullableBoolean(state.processing_purpose_defined),
          data_minimized: toNullableBoolean(state.data_minimized),
          retention_period_defined: toNullableBoolean(state.retention_period_defined),

          privacy_notice_available: toNullableBoolean(state.privacy_notice_available),
          privacy_policy_available: toNullableBoolean(state.privacy_policy_available),
          consent_notice_clear:
            state.lawful_basis === "consent"
              ? toNullableBoolean(state.consent_notice_clear)
              : null,
          consent_withdrawal_process_ready: toNullableBoolean(state.consent_withdrawal_process_ready),

          third_party_sharing: toNullableBoolean(state.third_party_sharing),
          third_party_provision_consent_or_basis:
            state.third_party_sharing === "true"
              ? toNullableBoolean(state.third_party_provision_consent_or_basis)
              : null,

          sensitive_data_basis:
            state.contains_sensitive_data === "true"
              ? state.sensitive_data_basis || "unknown"
              : null,
          unique_identifier_basis:
            state.has_unique_identifier === "true"
              ? state.unique_identifier_basis || "unknown"
              : null,
          resident_registration_statutory_basis:
            state.uses_resident_registration_number === "true"
              ? toNullableBoolean(state.resident_registration_statutory_basis)
              : false,

          dpa_in_place: usesProcessor ? toNullableBoolean(state.dpa_in_place) : null,
          processor_public_disclosure: usesProcessor ? toNullableBoolean(state.processor_public_disclosure) : null,
          processor_supervision_done: usesProcessor ? toNullableBoolean(state.processor_supervision_done) : null,
          subprocessor_controls_in_place: usesProcessor ? toNullableBoolean(state.subprocessor_controls_in_place) : null,

          transfer_outside_korea: crossBorder,
          is_third_country_transfer: crossBorder,
          pipa_transfer_basis_available: crossBorder ? hasPipaTransferBasis(state) : false,
          separate_consent_for_transfer: crossBorder ? toNullableBoolean(state.separate_consent_for_transfer) : false,
          treaty_or_statutory_transfer_basis: crossBorder ? toNullableBoolean(state.treaty_or_statutory_transfer_basis) : false,
          contract_necessity_disclosed_or_notified: crossBorder ? toNullableBoolean(state.contract_necessity_disclosed_or_notified) : false,
          pipa_certified_recipient: crossBorder ? toNullableBoolean(state.pipa_certified_recipient) : false,
          pipa_equivalence_recognition_exists: crossBorder ? toNullableBoolean(state.pipa_equivalence_recognition_exists) : false,
          cross_border_notice_provided: crossBorder ? toNullableBoolean(state.cross_border_notice_provided) : null,
          transfer_protection_measures_ready: crossBorder ? toNullableBoolean(state.transfer_protection_measures_ready) : null,
          onward_transfer_controls: crossBorder ? toNullableBoolean(state.onward_transfer_controls) : null,

          data_subject_rights_process_ready: toNullableBoolean(state.data_subject_rights_process_ready),

          automated_decision_significant_effect:
            automatedDecisionOnly
              ? toNullableBoolean(state.automated_decision_significant_effect)
              : false,
          automated_decision_rights_ready:
            automatedDecisionOnly && state.automated_decision_significant_effect === "true"
              ? toNullableBoolean(state.automated_decision_rights_ready)
              : null,
          provides_explanation:
            automatedDecisionOnly && state.automated_decision_significant_effect === "true"
              ? toNullableBoolean(state.provides_explanation)
              : null,
          human_review_available:
            automatedDecisionOnly && state.automated_decision_significant_effect === "true"
              ? toNullableBoolean(state.human_review_available)
              : null,

          privacy_officer_assigned: toNullableBoolean(state.privacy_officer_assigned),
          breach_response_ready: toNullableBoolean(state.breach_response_ready),
        },
      };
    },
    buildAdvisoryNotes: (state) => {
      const notes: string[] = [];

      if (state.target_region && state.target_region !== "ap-northeast-2") {
        notes.push("대상 리전이 한국 밖이면 제28조의8 국외이전 경로와 고지, 보호조치를 확인해야 합니다.");
      }

      if (state.contains_sensitive_data === "true") {
        notes.push("민감정보가 포함되면 명시적 동의 또는 법령상 근거가 필요합니다.");
      }

      if (state.has_unique_identifier === "true") {
        notes.push("고유식별정보가 포함되면 별도 동의 또는 법령상 근거와 암호화 등 보호조치를 확인해야 합니다.");
      }

      if (state.uses_resident_registration_number === "true") {
        notes.push("주민등록번호는 일반 동의만으로 부족하며 구체적인 법령 근거가 필요합니다.");
      }

      if (state.uses_processor === "true") {
        notes.push("처리위탁이 있으면 위탁문서, 수탁자 공개, 교육·감독 여부를 함께 확인합니다.");
      }

      return notes.length > 0
        ? notes
        : ["한국 PIPA 기준의 기본 개인정보 처리 및 국외이전 검토입니다."];
    },
    buildSummaryRows: (state) => [
      {
        label: "데이터셋",
        value: getOptionLabel(datasetOptions, state.dataset_name),
      },
      {
        label: "리전 흐름",
        value:
          state.current_region && state.target_region
            ? `${state.current_region} -> ${state.target_region}`
            : "미선택",
      },
      {
        label: "처리 근거",
        value: getOptionLabel(pipaLawfulBasisOptions, state.lawful_basis),
      },
      {
        label: "민감정보",
        value:
          state.contains_sensitive_data === "true"
            ? "포함"
            : state.contains_sensitive_data === "false"
              ? "미포함"
              : "미확인",
      },
    ],
  }
};
