import {
  binaryOptions,
  dataTypeOptions,
  datasetOptions,
  derogationTypeOptions,
  lawfulBasisOptions,
  subjectRegionOptions,
  targetRegionOptions,
  triStateOptions,
} from "./workspace-form-config";
import type { FormState } from "./workspace-types";
import {
  SectionCard,
  SectionIntro,
  SegmentedField,
  SelectField,
} from "./workspace-ui";

export function InputFormPanel({
  formState,
  onChange,
}: {
  formState: FormState;
  onChange: (key: keyof FormState, value: string) => void;
}) {
  return (
    <section className="glass-panel rounded-[32px] border border-[var(--color-line)] p-6 sm:p-7">
      <SectionIntro
        kicker="입력 워크스페이스"
        title="실제 검토 항목을 선택형 폼으로 구성했습니다"
        description="기술 메타데이터, 거버넌스 맥락, 이전 메커니즘, 보안 통제를 각각 나눠 입력하면 실제 백엔드 API에 맞는 요청으로 변환됩니다."
      />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SectionCard
          title="기본 컨텍스트"
          description="검토 대상 데이터셋과 정보주체 범위, 현재 위치와 대상 리전을 선택합니다."
        >
          <SelectField
            label="데이터셋"
            helper="발표 시나리오에 맞는 데이터셋 유형을 고르세요."
            value={formState.dataset_name}
            onChange={(value) => onChange("dataset_name", value)}
            options={[{ value: "", label: "데이터셋 선택" }, ...datasetOptions]}
          />
          <SelectField
            label="데이터 유형"
            helper="데이터셋 선택 시 기본 추천값이 함께 채워집니다."
            value={formState.data_type}
            onChange={(value) => onChange("data_type", value)}
            options={[{ value: "", label: "데이터 유형 선택" }, ...dataTypeOptions]}
          />
          <SelectField
            label="정보주체 지역"
            helper="국외 이전 규칙 적용 여부 판단의 출발점입니다."
            value={formState.data_subject_region}
            onChange={(value) => onChange("data_subject_region", value)}
            options={[{ value: "", label: "정보주체 지역 선택" }, ...subjectRegionOptions]}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="현재 리전"
              helper="현재 저장 또는 처리 위치입니다."
              value={formState.current_region}
              onChange={(value) => onChange("current_region", value)}
              options={[{ value: "", label: "현재 리전 선택" }, ...targetRegionOptions]}
            />
            <SelectField
              label="대상 리전"
              helper="이전 또는 복제 대상 리전을 선택합니다."
              value={formState.target_region}
              onChange={(value) => onChange("target_region", value)}
              options={[{ value: "", label: "대상 리전 선택" }, ...targetRegionOptions]}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="적법성 및 데이터 설계"
          description="처리 목적, 최소화, 보관기간, 적법 근거, 민감정보 여부를 확인합니다."
        >
          <SelectField
            label="적법 근거"
            helper="GDPR 제6조 적법 근거를 선택합니다."
            value={formState.lawful_basis}
            onChange={(value) => onChange("lawful_basis", value)}
            options={[{ value: "", label: "적법 근거 선택" }, ...lawfulBasisOptions]}
          />
          <SegmentedField
            label="처리 목적 정의"
            helper="처리 목적이 문서로 정의되어 있는지 표시합니다."
            value={formState.processing_purpose_defined}
            onChange={(value) => onChange("processing_purpose_defined", value)}
            options={binaryOptions}
          />
          <SegmentedField
            label="데이터 최소화"
            helper="목적 달성에 필요한 범위만 이전하는지 확인합니다."
            value={formState.data_minimized}
            onChange={(value) => onChange("data_minimized", value)}
            options={binaryOptions}
          />
          <SegmentedField
            label="보관기간 정의"
            helper="삭제 또는 보존 주기가 정해져 있는지 확인합니다."
            value={formState.retention_period_defined}
            onChange={(value) => onChange("retention_period_defined", value)}
            options={binaryOptions}
          />
          <SegmentedField
            label="민감정보 포함"
            helper="특수 범주 데이터 또는 그에 준하는 민감성이 있는지 표시합니다."
            value={formState.contains_sensitive_data}
            onChange={(value) => onChange("contains_sensitive_data", value)}
            options={triStateOptions}
          />
          <SegmentedField
            label="제9조 예외 요건"
            helper="민감정보를 선택한 경우 예외 요건 충족 여부를 함께 확인하세요."
            value={formState.special_category_condition_met}
            onChange={(value) => onChange("special_category_condition_met", value)}
            options={triStateOptions}
          />
        </SectionCard>

        <SectionCard
          title="이전 메커니즘 및 수탁자 구조"
          description="제3국 이전의 보호조치와 외부 처리자 관련 증빙 상태를 정리합니다."
          className="lg:col-span-2"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SegmentedField
              label="외부 처리자 사용"
              helper="벤더나 위탁 처리자가 경로에 포함되는지 표시합니다."
              value={formState.uses_processor}
              onChange={(value) => onChange("uses_processor", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="역할 정의"
              helper="컨트롤러와 프로세서 역할이 분명한지 확인합니다."
              value={formState.controller_processor_roles_defined}
              onChange={(value) => onChange("controller_processor_roles_defined", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="DPA 체결"
              helper="수탁자 계약 또는 DPA 체결 여부입니다."
              value={formState.dpa_in_place}
              onChange={(value) => onChange("dpa_in_place", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="수탁자 충분한 보증"
              helper="보안·개인정보 보호 보증 자료 존재 여부입니다."
              value={formState.processor_sufficient_guarantees}
              onChange={(value) => onChange("processor_sufficient_guarantees", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="SCC 체결"
              helper="표준계약조항이 체결되어 있는지 표시합니다."
              value={formState.scc_in_place}
              onChange={(value) => onChange("scc_in_place", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="BCR 보유"
              helper="구속력 있는 기업규칙 사용 여부입니다."
              value={formState.bcr_in_place}
              onChange={(value) => onChange("bcr_in_place", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="기타 제46조 보호조치"
              helper="별도 적정 보호조치를 사용하는지 표시합니다."
              value={formState.other_safeguards_in_place}
              onChange={(value) => onChange("other_safeguards_in_place", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="이전 영향 평가"
              helper="대상국 법률환경 검토 또는 TIA 완료 여부입니다."
              value={formState.transfer_impact_assessment_completed}
              onChange={(value) =>
                onChange("transfer_impact_assessment_completed", value)
              }
              options={triStateOptions}
            />
            <SegmentedField
              label="보완조치 문서화"
              helper="기술·계약·조직적 보완조치의 문서화 여부입니다."
              value={formState.supplemental_measures_documented}
              onChange={(value) =>
                onChange("supplemental_measures_documented", value)
              }
              options={triStateOptions}
            />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <SegmentedField
              label="제49조 예외 사용"
              helper="예외 이전 경로를 직접 사용하는 경우에만 예를 선택합니다."
              value={formState.derogation_used}
              onChange={(value) => onChange("derogation_used", value)}
              options={binaryOptions}
            />
            <SelectField
              label="예외 유형"
              helper="예외 사용을 선택한 경우에만 세부 유형을 지정합니다."
              value={formState.derogation_type}
              onChange={(value) => onChange("derogation_type", value)}
              options={[{ value: "", label: "예외 유형 선택" }, ...derogationTypeOptions]}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="보안 통제 및 책임성"
          description="암호화, 접근통제, 침해 대응, 처리기록, 투명성 문서를 점검합니다."
          className="lg:col-span-2"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <SegmentedField
              label="저장 시 암호화"
              helper="필수 입력 항목입니다."
              value={formState.encryption_at_rest}
              onChange={(value) => onChange("encryption_at_rest", value)}
              options={binaryOptions}
            />
            <SegmentedField
              label="전송 시 암호화"
              helper="TLS 등 전송 구간 보호를 의미합니다."
              value={formState.encryption_in_transit}
              onChange={(value) => onChange("encryption_in_transit", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="접근통제"
              helper="최소 권한과 접근 관리 통제 여부입니다."
              value={formState.access_control_in_place}
              onChange={(value) => onChange("access_control_in_place", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="침해 대응 절차"
              helper="사고 대응 및 보고 프로세스 존재 여부입니다."
              value={formState.incident_response_in_place}
              onChange={(value) => onChange("incident_response_in_place", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="처리방침 최신화"
              helper="국외 이전 사실이 고지 문서에 반영되었는지 표시합니다."
              value={formState.privacy_notice_updated}
              onChange={(value) => onChange("privacy_notice_updated", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="정보주체 고지"
              helper="대상국이나 이전 사실이 공개되었는지 확인합니다."
              value={formState.transfer_disclosed_to_subject}
              onChange={(value) => onChange("transfer_disclosed_to_subject", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="ROPA 보유"
              helper="처리 활동 기록부 존재 여부를 표시합니다."
              value={formState.records_of_processing_exists}
              onChange={(value) => onChange("records_of_processing_exists", value)}
              options={triStateOptions}
            />
            <SegmentedField
              label="이전 사항 ROPA 반영"
              helper="대상국과 보호조치가 기록부에 반영되었는지 확인합니다."
              value={formState.transfer_documented_in_ropa}
              onChange={(value) => onChange("transfer_documented_in_ropa", value)}
              options={triStateOptions}
            />
          </div>
        </SectionCard>
      </div>
    </section>
  );
}
