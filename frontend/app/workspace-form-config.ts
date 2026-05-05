import type { FieldOption, FormState } from "./workspace-types";

export const STORAGE_KEY = "border-checker-form-v2";

export const emptyOption: FieldOption = {
  value: "",
  label: "선택",
  description: "아직 항목을 고르지 않은 상태입니다.",
};

export const datasetOptions: FieldOption[] = [
  {
    value: "eu_customer_profiles",
    label: "EU 고객 프로필 데이터",
    description: "이름, 이메일, 국가, 멤버십 등 계정 운영에 쓰는 고객 기본정보입니다.",
  },
  {
    value: "eu_marketing_events",
    label: "EU 마케팅 이벤트 데이터",
    description: "캠페인 클릭, 수신 동의, 쿠폰 반응처럼 마케팅 성과 분석에 쓰는 로그입니다.",
  },
  {
    value: "eu_support_tickets",
    label: "EU 고객지원 티켓 데이터",
    description: "문의 내용, 상담 이력, 처리 상태처럼 고객지원 업무에 필요한 기록입니다.",
  },
  {
    value: "eu_hr_records",
    label: "EU 인사 기록 데이터",
    description: "임직원 계약, 근무, 급여 관련 정보처럼 접근 권한을 좁혀야 하는 내부 데이터입니다.",
  },
  {
    value: "eu_health_support_cases",
    label: "EU 건강·민감 케이스 데이터",
    description: "건강 상태, 진료 문의, 민감 상담 내용처럼 추가 근거와 보호조치가 필요한 데이터입니다.",
  },
];

export const dataTypeOptions: FieldOption[] = [
  {
    value: "customer_profiles",
    label: "고객 프로필",
    description: "회원 식별자, 연락처, 배송지처럼 서비스 제공에 필요한 기본 고객 정보입니다.",
  },
  {
    value: "analytics_events",
    label: "분석 이벤트",
    description: "페이지 조회, 버튼 클릭, 세션 정보처럼 제품 개선이나 통계 분석에 쓰는 행동 로그입니다.",
  },
  {
    value: "support_tickets",
    label: "지원 티켓",
    description: "문의 본문, 첨부파일, 상담 메모처럼 고객지원 담당자가 처리하는 케이스 정보입니다.",
  },
  {
    value: "hr_records",
    label: "인사 기록",
    description: "직원 식별정보, 근무 이력, 평가, 급여처럼 고용관계 관리를 위한 정보입니다.",
  },
  {
    value: "health_support_cases",
    label: "건강·민감 케이스",
    description: "건강, 생체, 민감 상담 등 일반 개인정보보다 강한 법적 근거가 필요한 정보입니다.",
  },
  {
    value: "payment_operations",
    label: "결제 운영 데이터",
    description: "결제 상태, 환불, 청구 주소, 거래 식별자처럼 정산과 분쟁 대응에 쓰는 정보입니다.",
  },
];

export const subjectRegionOptions: FieldOption[] = [
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

export const euRegionOptions: FieldOption[] = [
  {
    value: "eu-central-1",
    label: "Frankfurt · eu-central-1",
    description: "독일 프랑크푸르트 리전으로 EU 역내 저장 또는 처리 예시입니다.",
  },
  {
    value: "eu-west-1",
    label: "Ireland · eu-west-1",
    description: "아일랜드 리전으로 EU 역내 SaaS 또는 백업 처리 예시입니다.",
  },
  {
    value: "eu-west-3",
    label: "Paris · eu-west-3",
    description: "프랑스 파리 리전으로 EU 고객 서비스 운영에 자주 쓰는 위치입니다.",
  },
  {
    value: "eu-north-1",
    label: "Stockholm · eu-north-1",
    description: "스웨덴 스톡홀름 리전으로 EU 역내 분석 또는 복제 위치 예시입니다.",
  },
];

export const targetRegionOptions: FieldOption[] = [
  {
    value: "sa-riyadh-dc",
    label: "Riyadh DC · sa-riyadh-dc",
    description: "사우디 리야드 내 데이터센터로, 사우디 역내 보관 경로 예시입니다.",
  },
  {
    value: "sa-jeddah-dc",
    label: "Jeddah DC · sa-jeddah-dc",
    description: "사우디 제다 데이터센터로, 사우디 안에서 이중화하는 경우에 가깝습니다.",
  },
  {
    value: "sa-dammam-dc",
    label: "Dammam DC · sa-dammam-dc",
    description: "사우디 담맘 데이터센터로, 사우디 역내 재해복구 위치 예시입니다.",
  },
  {
    value: "sa-east-1",
    label: "Sao Paulo · sa-east-1",
    description: "브라질 상파울루 리전으로, LGPD 기준 브라질 내 처리 경로 예시입니다.",
  },
  {
    value: "tw-taipei-dc",
    label: "Taipei DC · tw-taipei-dc",
    description: "대만 타이베이 데이터센터로, 대만 역내 보관 또는 처리 예시입니다.",
  },
  ...euRegionOptions,
  {
    value: "eu-west-2",
    label: "London · eu-west-2",
    description: "영국 런던 리전으로, EU 데이터에는 제3국 이전 검토가 필요할 수 있습니다.",
  },
  {
    value: "ap-northeast-2",
    label: "Seoul · ap-northeast-2",
    description: "한국 서울 리전으로, EU 또는 사우디 데이터 기준 국외이전 경로가 됩니다.",
  },
  {
    value: "ap-northeast-1",
    label: "Tokyo · ap-northeast-1",
    description: "일본 도쿄 리전으로, 해외 백업이나 분석 처리 위치 예시입니다.",
  },
  {
    value: "us-east-1",
    label: "N. Virginia · us-east-1",
    description: "미국 버지니아 리전으로, 제3국 또는 사우디 밖 이전 검토가 필요합니다.",
  },
  {
    value: "us-west-2",
    label: "Oregon · us-west-2",
    description: "미국 오리건 리전으로, 글로벌 SaaS나 로그 분석 위치 예시입니다.",
  },
  {
    value: "ap-southeast-1",
    label: "Singapore · ap-southeast-1",
    description: "싱가포르 리전으로, 아시아 허브 처리나 재해복구 위치 예시입니다.",
  },
  {
    value: "ca-central-1",
    label: "Canada · ca-central-1",
    description: "캐나다 리전으로, 적정성 또는 보호조치 여부를 함께 확인하는 위치입니다.",
  },
];

export const lawfulBasisOptions: FieldOption[] = [
  {
    value: "consent",
    label: "동의",
    description: "마케팅 수신, 선택 기능처럼 이용자가 자유롭게 동의하고 철회할 수 있는 처리입니다.",
  },
  {
    value: "contract",
    label: "계약 이행",
    description: "주문 배송, 계정 제공, 고객지원처럼 계약을 수행하려면 필요한 처리입니다.",
  },
  {
    value: "legal_obligation",
    label: "법적 의무",
    description: "세금, 회계, 소비자 보호 기록처럼 법령상 보관 또는 제출 의무가 있는 처리입니다.",
  },
  {
    value: "vital_interest",
    label: "중대한 이익",
    description: "생명이나 안전을 보호하기 위해 긴급하게 필요한 예외적 처리입니다.",
  },
  {
    value: "public_task",
    label: "공적 업무",
    description: "공공기관 또는 법으로 부여된 공적 권한 수행과 연결된 처리입니다.",
  },
  {
    value: "legitimate_interest",
    label: "정당한 이익",
    description: "부정사용 방지, 네트워크 보안처럼 이익형량과 정보주체 권리 검토가 필요한 처리입니다.",
  },
];

export const derogationTypeOptions: FieldOption[] = [
  {
    value: "explicit_consent",
    label: "명시적 동의",
    description: "제3국 이전 위험을 알린 뒤 이용자가 명확히 동의한 일회성 이전입니다.",
  },
  {
    value: "contract_necessity",
    label: "계약상 필요",
    description: "해외 호텔 예약처럼 정보주체와의 계약 이행에 꼭 필요한 제한적 이전입니다.",
  },
  {
    value: "public_interest",
    label: "중대한 공익",
    description: "법으로 인정되는 중요한 공익 목적의 제한적 이전입니다.",
  },
  {
    value: "legal_claims",
    label: "법적 청구 대응",
    description: "분쟁, 소송, 법적 청구 제기나 방어에 필요한 자료 이전입니다.",
  },
  {
    value: "vital_interests",
    label: "중대한 이익 보호",
    description: "정보주체가 동의할 수 없고 생명·안전 보호가 필요한 긴급 이전입니다.",
  },
];

export const binaryOptions: FieldOption[] = [
  { value: "true", label: "예" },
  { value: "false", label: "아니오" },
];

export const triStateOptions: FieldOption[] = [
  { value: "true", label: "예" },
  { value: "false", label: "아니오" },
  { value: "unknown", label: "미확인" },
];

export const defaultFormState: FormState = {
  dataset_name: "",
  data_type: "",
  data_subject_region: "",
  current_region: "",
  target_region: "",
  processing_purpose_defined: "",
  data_minimized: "",
  retention_period_defined: "",
  lawful_basis: "",
  contains_sensitive_data: "unknown",
  special_category_condition_met: "unknown",
  uses_processor: "unknown",
  controller_processor_roles_defined: "unknown",
  dpa_in_place: "unknown",
  processor_sufficient_guarantees: "unknown",
  scc_in_place: "unknown",
  bcr_in_place: "unknown",
  other_safeguards_in_place: "unknown",
  transfer_impact_assessment_completed: "unknown",
  supplemental_measures_documented: "unknown",
  encryption_at_rest: "",
  encryption_in_transit: "unknown",
  access_control_in_place: "unknown",
  incident_response_in_place: "unknown",
  derogation_used: "",
  derogation_type: "",
  privacy_notice_updated: "unknown",
  transfer_disclosed_to_subject: "unknown",
  records_of_processing_exists: "unknown",
  transfer_documented_in_ropa: "unknown",
};

export const requiredFormKeys: Array<keyof FormState> = [
  "dataset_name",
  "data_type",
  "data_subject_region",
  "current_region",
  "target_region",
  "processing_purpose_defined",
  "data_minimized",
  "retention_period_defined",
  "lawful_basis",
  "encryption_at_rest",
  "derogation_used",
];

export const formKeyLabels: Record<keyof FormState, string> = {
  dataset_name: "데이터셋",
  data_type: "데이터 유형",
  data_subject_region: "정보주체 지역",
  current_region: "현재 리전",
  target_region: "대상 리전",
  processing_purpose_defined: "처리 목적 정의",
  data_minimized: "데이터 최소화",
  retention_period_defined: "보관기간 정의",
  lawful_basis: "적법 근거",
  contains_sensitive_data: "민감정보 포함",
  special_category_condition_met: "제9조 예외 요건",
  uses_processor: "외부 처리자 사용",
  controller_processor_roles_defined: "역할 정의",
  dpa_in_place: "DPA 체결",
  processor_sufficient_guarantees: "수탁자 충분한 보증",
  scc_in_place: "SCC 체결",
  bcr_in_place: "BCR 보유",
  other_safeguards_in_place: "기타 보호조치",
  transfer_impact_assessment_completed: "이전 영향 평가",
  supplemental_measures_documented: "보완조치 문서화",
  encryption_at_rest: "저장 시 암호화",
  encryption_in_transit: "전송 시 암호화",
  access_control_in_place: "접근통제",
  incident_response_in_place: "침해 대응 절차",
  derogation_used: "제49조 예외 사용",
  derogation_type: "예외 유형",
  privacy_notice_updated: "처리방침 최신화",
  transfer_disclosed_to_subject: "국외 이전 고지",
  records_of_processing_exists: "ROPA 보유",
  transfer_documented_in_ropa: "이전 사항 ROPA 반영",
};
