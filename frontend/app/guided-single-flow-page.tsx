"use client";

import { useEffect, useMemo, useState } from "react";

import { AwsIntegrationPanel } from "./aws-integration-panel";
import { applyCloudDataToFormState } from "./cloud-discovery-panel";
import { AwsIntegrationProvider, useAwsIntegration } from "./context/aws-integration-context";
import { PACK_UI_DEFINITIONS } from "./guided-pack-config";
import type {
  GuidedField,
  GuidedFormState,
  PackUiDefinition,
} from "./guided-pack-types";
import { buildErrorMessage, fetchJson } from "./workspace-runtime";
import type {
  DecisionGrade,
  EvaluationResult,
  FieldOption,
  JsonObject,
  PackDetail,
  PackSummary,
} from "./workspace-types";
import {
  ActionButton,
  DecisionBadge,
  EmptyState,
  ErrorBanner,
  MetricCard,
  SegmentedField,
  SelectField,
  StatusBanner,
  SummaryRow,
  TextList,
} from "./workspace-ui";

type PackId = keyof typeof PACK_UI_DEFINITIONS & string;
type ScreenMode = "intro" | "step" | "review" | "result";

type PackEvaluationResult = {
  packId: string;
  label: string;
  status: "success" | "error";
  result?: EvaluationResult;
  error?: string;
};

const FLOW_STORAGE_KEY = "border-checker-guided-flow-v2";
const PACK_IDS = Object.keys(PACK_UI_DEFINITIONS) as PackId[];
const CLOUD_DISCOVERY_FIELD_KEYS = [
  "current_region",
  "encryption_at_rest",
  "encryption_in_transit",
  "access_control_in_place",
  "data_type",
  "contains_sensitive_data",
  "uses_processor",
] as const;

const CLOUD_TO_PACK_FIELD_MAP: Record<string, Record<string, string>> = {
  taiwan: {
    contains_sensitive_data: "contains_article6_sensitive_data",
    uses_processor: "uses_commissioned_processor",
  },
};

const regionOptions: FieldOption[] = [
  { value: "", label: "Select a region", description: "Choose the source or target location." },
  { value: "ap-northeast-2", label: "Seoul · ap-northeast-2", description: "Korea AWS region." },
  { value: "eu-central-1", label: "Frankfurt · eu-central-1", description: "EU/EEA region." },
  { value: "eu-west-1", label: "Ireland · eu-west-1", description: "EU/EEA region." },
  { value: "eu-west-3", label: "Paris · eu-west-3", description: "EU/EEA region." },
  { value: "eu-north-1", label: "Stockholm · eu-north-1", description: "EU/EEA region." },
  { value: "sa-riyadh-dc", label: "Riyadh DC · sa-riyadh-dc", description: "Saudi Arabia data center." },
  { value: "sa-jeddah-dc", label: "Jeddah DC · sa-jeddah-dc", description: "Saudi Arabia data center." },
  { value: "sa-dammam-dc", label: "Dammam DC · sa-dammam-dc", description: "Saudi Arabia data center." },
  { value: "tw-taipei-dc", label: "Taipei DC · tw-taipei-dc", description: "Taiwan data center." },
  { value: "sa-east-1", label: "Sao Paulo · sa-east-1", description: "Brazil AWS region." },
  { value: "br-sao-paulo-dc", label: "Sao Paulo DC · br-sao-paulo-dc", description: "Brazil data center." },
  { value: "us-east-1", label: "N. Virginia · us-east-1", description: "Unmapped example region." },
  { value: "us-west-2", label: "Oregon · us-west-2", description: "Unmapped example region." },
  { value: "ap-northeast-1", label: "Tokyo · ap-northeast-1", description: "Unmapped example region." },
  { value: "ap-southeast-1", label: "Singapore · ap-southeast-1", description: "Unmapped example region." },
  { value: "ca-central-1", label: "Canada · ca-central-1", description: "Unmapped example region." },
];

const dataTypeOptions: FieldOption[] = [
  { value: "", label: "Select data type" },
  { value: "customer_profiles", label: "Customer profiles" },
  { value: "analytics_events", label: "Analytics events" },
  { value: "support_tickets", label: "Support tickets" },
  { value: "hr_records", label: "HR records" },
  { value: "health_support_cases", label: "Health or sensitive support cases" },
  { value: "payment_operations", label: "Payment operations" },
];

const subjectRegionOptions: FieldOption[] = [
  { value: "", label: "Not specified" },
  { value: "EU", label: "EU" },
  { value: "EEA", label: "EEA" },
  { value: "UK", label: "UK" },
  { value: "KR", label: "Korea" },
  { value: "KSA", label: "Saudi Arabia" },
  { value: "TW", label: "Taiwan" },
  { value: "BR", label: "Brazil" },
  { value: "OTHER", label: "Other" },
];

const primaryPackLabel: Record<PackId, string> = {
  gdpr: "EU GDPR",
  korea_pipa: "Korea PIPA",
  saudi_pdpl: "Saudi PDPL",
  taiwan: "Taiwan PDPA",
  lgpd: "Brazil LGPD",
};

const decisionRiskLabel: Record<DecisionGrade, string> = {
  deny: "High",
  manual_review: "Medium",
  condition_allow: "Medium",
  allow: "Low",
};

function isKnownCloudValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function detectPackForRegion(region: string): PackId | null {
  if (!region) {
    return null;
  }
  if (region.startsWith("eu-")) {
    return "gdpr";
  }
  if (region === "ap-northeast-2") {
    return "korea_pipa";
  }
  if (["sa-riyadh-dc", "sa-jeddah-dc", "sa-dammam-dc"].includes(region)) {
    return "saudi_pdpl";
  }
  if (region === "tw-taipei-dc") {
    return "taiwan";
  }
  if (["sa-east-1", "br-sao-paulo-dc"].includes(region)) {
    return "lgpd";
  }
  return null;
}

function labelForOption(options: FieldOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function renderField(
  field: GuidedField,
  state: GuidedFormState,
  onChange: (key: string, value: string) => void,
) {
  if (field.kind === "select") {
    return (
      <SelectField
        label={field.label}
        helper={field.helper}
        tooltip={field.tooltip}
        value={state[field.key] ?? ""}
        onChange={(value) => onChange(field.key, value)}
        options={field.options}
      />
    );
  }

  return (
    <SegmentedField
      label={field.label}
      helper={field.helper}
      tooltip={field.tooltip}
      value={state[field.key] ?? ""}
      onChange={(value) => onChange(field.key, value)}
      options={field.options}
    />
  );
}

function optionLabelForField(field: GuidedField, rawValue: string) {
  if (!rawValue) {
    return "";
  }

  const matched = field.options.find((option) => option.value === rawValue);
  if (matched) {
    return matched.label;
  }

  if (rawValue === "true") {
    return "Yes";
  }
  if (rawValue === "false") {
    return "No";
  }
  if (rawValue === "unknown") {
    return "Unknown";
  }

  return rawValue;
}

function collectVisibleStepFields(
  definition: PackUiDefinition,
  state: GuidedFormState,
  stepIndex: number,
) {
  const step = definition.steps[stepIndex];
  return step.fields.filter(
    (field) => !field.visibleIf || field.visibleIf(state),
  );
}

function mapCloudDataForPack(packId: string, normalized: JsonObject) {
  const mapped: JsonObject = { ...normalized };
  const fieldMap = CLOUD_TO_PACK_FIELD_MAP[packId] ?? {};

  for (const [cloudField, packField] of Object.entries(fieldMap)) {
    if (isKnownCloudValue(normalized[cloudField])) {
      mapped[packField] = normalized[cloudField];
    }
  }

  return mapped;
}

function getCloudAppliedFieldKeysForPack(packId: string, normalized: JsonObject) {
  const fields = new Set<string>();
  const mapped = mapCloudDataForPack(packId, normalized);

  for (const field of CLOUD_DISCOVERY_FIELD_KEYS) {
    if (isKnownCloudValue(normalized[field])) {
      fields.add(CLOUD_TO_PACK_FIELD_MAP[packId]?.[field] ?? field);
    }
  }

  for (const field of Object.values(CLOUD_TO_PACK_FIELD_MAP[packId] ?? {})) {
    if (isKnownCloudValue(mapped[field])) {
      fields.add(field);
    }
  }

  return Array.from(fields);
}

function fieldLabelForKey(definition: PackUiDefinition, key: string) {
  for (const step of definition.steps) {
    const field = step.fields.find((item) => item.key === key);
    if (field) {
      return field.label;
    }
  }
  return key;
}

function fieldValueForKey(
  definition: PackUiDefinition,
  state: GuidedFormState,
  key: string,
) {
  for (const step of definition.steps) {
    const field = step.fields.find((item) => item.key === key);
    if (field) {
      return optionLabelForField(field, state[key] ?? "");
    }
  }
  return state[key] ?? "";
}

function hideCloudAppliedFields(
  fields: GuidedField[],
  cloudAppliedFields: string[],
) {
  const hidden = new Set(cloudAppliedFields);
  return fields.filter((field) => !hidden.has(field.key));
}

function collectStepMissingFields(
  definition: PackUiDefinition,
  state: GuidedFormState,
  stepIndex: number,
  cloudAppliedFields: string[] = [],
) {
  return hideCloudAppliedFields(
    collectVisibleStepFields(definition, state, stepIndex),
    cloudAppliedFields,
  )
    .filter((field) => field.required)
    .filter((field) => !state[field.key])
    .map((field) => field.label);
}

function buildReviewSections(
  definition: PackUiDefinition,
  state: GuidedFormState,
  cloudAppliedFields: string[],
) {
  const awsFields = new Set(cloudAppliedFields);

  return definition.steps
    .map((step, stepIndex) => {
      const rows = collectVisibleStepFields(definition, state, stepIndex)
        .filter((field) => !awsFields.has(field.key))
        .map((field) => ({
          label: field.label,
          value: optionLabelForField(field, state[field.key] ?? ""),
        }))
        .filter((row) => row.value);

      return {
        id: step.id,
        title: step.title,
        description: step.description,
        rows,
      };
    })
    .filter((section) => section.rows.length > 0);
}

function mergeDefaultsForPack(packId: PackId, state: GuidedFormState) {
  return {
    ...PACK_UI_DEFINITIONS[packId].defaultState,
    ...state,
  };
}

function normalizePackOrder(primaryPackId: PackId, comparisonPackIds: PackId[]) {
  return [
    primaryPackId,
    ...comparisonPackIds.filter((packId) => packId !== primaryPackId),
  ];
}

function AwsSessionArea({
  screenMode,
  onApply,
  onClearAppliedValues,
}: {
  screenMode: ScreenMode;
  onApply: (normalized: JsonObject) => void;
  onClearAppliedValues: () => void;
}) {
  const aws = useAwsIntegration();

  if (screenMode === "intro" || aws.isPanelOpen) {
    return (
      <AwsIntegrationPanel
        onApply={onApply}
        onClearAppliedValues={onClearAppliedValues}
      />
    );
  }

  return (
    <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            AWS Integration
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
            {aws.isAwsConnected
              ? `AWS linked · Bucket: ${aws.bucketName || "-"} · Region: ${aws.region || "-"} · Last check: ${aws.lastCheckedAt ? aws.lastCheckedAt.slice(0, 10) : "-"}`
              : "AWS not linked"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            label={aws.isAwsConnected ? "AWS 결과 보기" : "AWS 연동하기"}
            onClick={() => aws.setIsPanelOpen(true)}
            variant="secondary"
          />
          {aws.isAwsConnected ? (
            <>
              <ActionButton
                label="다시 검사"
                onClick={() => aws.setIsPanelOpen(true)}
                variant="secondary"
              />
              <ActionButton
                label="연결 변경"
                onClick={() => aws.setIsPanelOpen(true)}
                variant="secondary"
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ScenarioSetup({
  formState,
  selectedPackId,
  selectedPackIds,
  detectedPackId,
  comparisonOpen,
  packSummaries,
  onFieldChange,
  onManualPackChange,
  onToggleComparison,
  onSetComparisonOpen,
  onStart,
  onReset,
}: {
  formState: GuidedFormState;
  selectedPackId: PackId;
  selectedPackIds: PackId[];
  detectedPackId: PackId | null;
  comparisonOpen: boolean;
  packSummaries: PackSummary[];
  onFieldChange: (key: string, value: string) => void;
  onManualPackChange: (packId: PackId) => void;
  onToggleComparison: (packId: PackId) => void;
  onSetComparisonOpen: (value: boolean) => void;
  onStart: () => void;
  onReset: () => void;
}) {
  const selectedSummary = packSummaries.find(
    (pack) => pack.pack_id === selectedPackId,
  );
  const introMissing = [
    ["current_region", "출발국/현재 데이터센터 위치"],
    ["target_region", "도착국/대상 리전"],
    ["data_type", "데이터 유형"],
  ].filter(([key]) => !formState[key]).map(([, label]) => label);

  return (
    <div className="space-y-7">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
          Step 0
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
          데이터 이전 시나리오 설정
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
          기본 평가는 데이터가 나가는 출발국의 국외이전 규제를 기준으로 수행합니다.
          도착국 법제는 기본 평가 대상이 아니지만, 비교 검토가 필요한 경우 추가 법제를 선택할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="출발국/현재 데이터센터 위치"
          helper="데이터가 현재 저장되거나 나가는 기준 위치입니다."
          value={formState.current_region ?? ""}
          onChange={(value) => onFieldChange("current_region", value)}
          options={regionOptions}
        />
        <SelectField
          label="도착국/대상 리전"
          helper="데이터가 이전되거나 복제될 대상 위치입니다."
          value={formState.target_region ?? ""}
          onChange={(value) => onFieldChange("target_region", value)}
          options={regionOptions}
        />
        <SelectField
          label="데이터 유형"
          helper="AWS 태그로 확인되지 않으면 사람이 직접 선택합니다."
          value={formState.data_type ?? ""}
          onChange={(value) => onFieldChange("data_type", value)}
          options={dataTypeOptions}
        />
        <SelectField
          label="정보주체 지역"
          helper="필요한 경우 비교 검토나 법적 판단에 참고합니다."
          value={formState.data_subject_region ?? ""}
          onChange={(value) => onFieldChange("data_subject_region", value)}
          options={subjectRegionOptions}
        />
      </div>

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="출발 위치"
            value={formState.current_region ? labelForOption(regionOptions, formState.current_region) : "Not selected"}
          />
          <MetricCard
            label="대상 위치"
            value={formState.target_region ? labelForOption(regionOptions, formState.target_region) : "Not selected"}
          />
          <MetricCard
            label="자동 적용 법제"
            value={detectedPackId ? primaryPackLabel[detectedPackId] : "직접 선택 필요"}
          />
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
          Border Checker는 기본적으로 데이터가 나가는 출발국의 개인정보보호법/국외이전 규제를 기준으로 평가합니다.
        </p>

        {!detectedPackId && formState.current_region ? (
          <div className="mt-5">
            <SelectField
              label="직접 선택"
              helper="매핑되지 않는 리전입니다. 기본 평가에 사용할 법제를 선택하세요."
              value={selectedPackId}
              onChange={(value) => onManualPackChange(value as PackId)}
              options={PACK_IDS.map((packId) => ({
                value: packId,
                label: primaryPackLabel[packId],
                description: PACK_UI_DEFINITIONS[packId].subtitle,
              }))}
            />
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
        <button
          type="button"
          onClick={() => onSetComparisonOpen(!comparisonOpen)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span>
            <span className="block text-sm font-semibold text-[var(--color-ink)]">
              추가 법제 비교 검토
            </span>
            <span className="mt-1 block text-sm leading-6 text-[var(--color-muted)]">
              기술 설정은 AWS에서 자동 확인할 수 있지만, 적법근거·고지·정보주체 동의·이전 예외·위험평가 같은 법적 판단 항목은 사람이 확인해야 합니다.
            </span>
          </span>
          <span className="text-sm font-semibold text-[var(--color-accent)]">
            {comparisonOpen ? "접기" : "펼치기"}
          </span>
        </button>

        {comparisonOpen ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PACK_IDS.map((packId) => {
              const isPrimary = packId === selectedPackId;
              const checked = selectedPackIds.includes(packId);
              return (
                <label
                  key={packId}
                  className={`rounded-lg border p-4 text-sm transition ${
                    checked
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
                      : "border-[var(--color-line)] bg-white"
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isPrimary}
                      onChange={() => onToggleComparison(packId)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-semibold text-[var(--color-ink)]">
                        {primaryPackLabel[packId]}
                        {isPrimary ? " · 기본 평가" : ""}
                      </span>
                      <span className="mt-1 block leading-6 text-[var(--color-muted)]">
                        {PACK_UI_DEFINITIONS[packId].subtitle}
                      </span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="선택된 적용 법제" value={PACK_UI_DEFINITIONS[selectedPackId].label} />
        <MetricCard label="비교 평가 수" value={`${selectedPackIds.length}개`} />
        <MetricCard
          label="규칙 수"
          value={selectedSummary ? `${selectedSummary.rule_count} rules` : "Loading"}
        />
      </div>

      {introMissing.length > 0 ? (
        <StatusBanner message={`시작 전에 ${introMissing.join(", ")} 항목을 선택하세요.`} />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <ActionButton
          label="질문 시작"
          onClick={onStart}
          disabled={introMissing.length > 0 || (!detectedPackId && !selectedPackId)}
        />
        <ActionButton label="입력 초기화" onClick={onReset} variant="secondary" />
      </div>
    </div>
  );
}

function PackResultCard({
  packResult,
  onReview,
  onGoToQuestions,
}: {
  packResult: PackEvaluationResult;
  onReview: () => void;
  onGoToQuestions: () => void;
}) {
  if (packResult.status === "error") {
    return (
      <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">
            {packResult.label} 평가 결과
          </h2>
          <span className="rounded-md border border-[var(--color-danger)] px-3 py-1 text-sm font-semibold text-[var(--color-danger)]">
            Error
          </span>
        </div>
        <p className="mt-3 text-sm leading-7 text-[var(--color-danger)]">
          {packResult.error ?? "평가 중 오류가 발생했습니다."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ActionButton label="입력 다시 보기" onClick={onReview} variant="secondary" />
          <ActionButton label="해당 법제 질문으로 이동" onClick={onGoToQuestions} />
        </div>
      </div>
    );
  }

  const result = packResult.result;
  if (!result) {
    return null;
  }

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Pack Evaluation
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
            {packResult.label} 평가 결과
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DecisionBadge decision={result.final_decision} />
          <span className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1 text-sm font-semibold text-[var(--color-muted)]">
            Risk: {decisionRiskLabel[result.final_decision]}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <SummaryRow label="final_decision" value={result.final_decision} />
        <SummaryRow label="risk_level" value={decisionRiskLabel[result.final_decision]} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <TextList
          title="triggered_rules"
          items={result.triggered_rules.map((rule) => `${rule.rule_id}: ${rule.title}`)}
          emptyCopy="No rules were triggered."
          compact
        />
        <TextList
          title="required_actions"
          items={result.required_actions}
          emptyCopy="No required actions returned."
          compact
        />
      </div>

      <div className="mt-5 rounded-lg border border-[var(--color-line)] bg-white p-4">
        <p className="text-sm font-semibold text-[var(--color-ink)]">explanation</p>
        <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
          {result.explanation || result.summary}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <ActionButton label="입력 다시 보기" onClick={onReview} variant="secondary" />
        <ActionButton label="해당 법제 질문으로 이동" onClick={onGoToQuestions} />
      </div>
    </div>
  );
}

function GuidedFlowContent() {
  const aws = useAwsIntegration();
  const [packSummaries, setPackSummaries] = useState<PackSummary[]>([]);
  const [packDetails, setPackDetails] = useState<Record<string, PackDetail>>({});
  const [selectedPackId, setSelectedPackId] = useState<PackId>("gdpr");
  const [comparisonPackIds, setComparisonPackIds] = useState<PackId[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [formState, setFormState] = useState<GuidedFormState>(
    PACK_UI_DEFINITIONS.gdpr.defaultState,
  );
  const [screenMode, setScreenMode] = useState<ScreenMode>("intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [evaluationResults, setEvaluationResults] = useState<PackEvaluationResult[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    "데이터 이전 시나리오를 설정하면 출발국 기준으로 기본 평가 법제를 자동 선택합니다.",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  const detectedPackId = detectPackForRegion(formState.current_region ?? "");
  const selectedPackIds = useMemo(
    () => normalizePackOrder(selectedPackId, comparisonPackIds),
    [comparisonPackIds, selectedPackId],
  );
  const packDefinition = PACK_UI_DEFINITIONS[selectedPackId];
  const currentStep = packDefinition.steps[stepIndex];
  const cloudAppliedFields = aws.isAwsConnected
    ? getCloudAppliedFieldKeysForPack(selectedPackId, aws.discoveredValues)
    : [];
  const visibleFields = hideCloudAppliedFields(
    collectVisibleStepFields(packDefinition, formState, stepIndex),
    cloudAppliedFields,
  );
  const currentStepMissing = collectStepMissingFields(
    packDefinition,
    formState,
    stepIndex,
    cloudAppliedFields,
  );
  const overallMissing = packDefinition.validate(formState);
  const advisoryNotes = packDefinition.buildAdvisoryNotes(formState);
  const reviewSections = buildReviewSections(
    packDefinition,
    formState,
    cloudAppliedFields,
  );
  const awsReviewRows = cloudAppliedFields
    .map((key) => ({
      label: fieldLabelForKey(packDefinition, key),
      value: fieldValueForKey(packDefinition, formState, key),
    }))
    .filter((row) => row.value);
  const progressPercent =
    screenMode === "intro"
      ? 8
      : screenMode === "review"
        ? 92
        : ((stepIndex + 1) / packDefinition.steps.length) * 100;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const summaries = await fetchJson<PackSummary[]>("/api/v1/packs");
        const supportedSummaries = summaries.filter(
          (pack) => pack.pack_id in PACK_UI_DEFINITIONS,
        );
        const storedState = window.localStorage.getItem(FLOW_STORAGE_KEY);
        const parsedState = storedState
          ? (JSON.parse(storedState) as GuidedFormState)
          : {};

        if (!cancelled) {
          const bootDetectedPackId = detectPackForRegion(
            String(parsedState.current_region ?? ""),
          );
          const bootPackId = bootDetectedPackId ?? "gdpr";
          setPackSummaries(supportedSummaries);
          setSelectedPackId(bootPackId);
          setFormState({
            ...PACK_UI_DEFINITIONS[bootPackId].defaultState,
            ...parsedState,
          });
          setStorageReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(buildErrorMessage(error));
          setStorageReady(true);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }
    window.localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify(formState));
  }, [formState, storageReady]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (packDetails[selectedPackId]) {
        return;
      }

      try {
        const detail = await fetchJson<PackDetail>(
          `/api/v1/packs/${selectedPackId}/detail`,
        );
        if (!cancelled) {
          setPackDetails((current) => ({
            ...current,
            [selectedPackId]: detail,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(buildErrorMessage(error));
        }
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [packDetails, selectedPackId]);

  function updateField(key: string, value: string) {
    setErrorMessage(null);
    const nextDetectedPackId =
      key === "current_region" ? detectPackForRegion(value) : null;

    if (nextDetectedPackId) {
      setSelectedPackId(nextDetectedPackId);
    }

    setFormState((current) => {
      const next = {
        ...(nextDetectedPackId
          ? PACK_UI_DEFINITIONS[nextDetectedPackId].defaultState
          : {}),
        ...current,
        [key]: value,
      };

      if (key === "derogation_used" && value !== "true") {
        next.derogation_type = "";
      }
      if (key === "transfer_exception_used" && value !== "true") {
        next.transfer_exception_type = "";
      }
      if (key === "contains_article6_sensitive_data" && value !== "true") {
        next.sensitive_data_exception_basis = "";
        next.written_consent_for_sensitive_data = "unknown";
        next.consent_freely_given = "unknown";
        next.consent_proof_available = "unknown";
      }
      if (key === "sensitive_data_exception_basis" && value !== "written_consent") {
        next.written_consent_for_sensitive_data = "unknown";
        next.consent_freely_given = "unknown";
      }
      if (key === "use_outside_original_specific_purpose" && value !== "true") {
        next.outside_purpose_use_basis = "";
        next.separate_consent_for_outside_purpose = "unknown";
      }
      if (key === "outside_purpose_use_basis" && value !== "consent") {
        next.separate_consent_for_outside_purpose = "unknown";
      }
      if (key === "uses_data_for_marketing" && value !== "true") {
        next.marketing_optout_mechanism_ready = "unknown";
      }
      if (key === "data_subject_objected_public_source_processing" && value !== "true") {
        next.public_source_objection_handled = "unknown";
      }
      if (key === "industry_security_plan_required" && value !== "true") {
        next.industry_security_plan_in_place = "unknown";
      }
      if (key === "uses_commissioned_processor" && value !== "true") {
        next.commissioned_processor_terms_in_place = "unknown";
      }
      if (key === "standard_contractual_clauses_in_place" && value !== "true") {
        next.standard_contractual_clauses_full_unaltered = "unknown";
      }
      if (key === "legacy_contractual_clauses_used" && value !== "true") {
        next.anpd_scc_migration_completed = "unknown";
      }
      if (key === "specific_contractual_clauses_used" && value !== "true") {
        next.specific_contractual_clauses_anpd_approved = "unknown";
      }
      if (key === "binding_corporate_rules_used" && value !== "true") {
        next.binding_corporate_rules_anpd_approved = "unknown";
      }
      if (key === "subsequent_transfer_expected" && value !== "true") {
        next.subsequent_transfer_controls_in_place = "unknown";
      }
      if (key === "dpia_required" && value !== "true") {
        next.dpia_completed = "";
      }
      if (key === "dpo_required" && value !== "true") {
        next.dpo_assigned = "";
      }
      if (key === "processing_legal_basis" && value !== "consent") {
        next.consent_withdrawal_process_ready = "unknown";
      }
      if (key === "contains_sensitive_data" && value !== "true") {
        next.special_category_condition_met = "unknown";
        next.explicit_consent_for_sensitive_data = "unknown";
        next.sensitive_data_legal_basis = "";
        next.specific_highlighted_consent_for_sensitive_data = "unknown";
        next.sensitive_data_basis = "";
      }
      if (key === "sensitive_data_legal_basis" && value !== "consent") {
        next.specific_highlighted_consent_for_sensitive_data = "unknown";
      }
      if (key === "third_party_sharing" && value !== "true") {
        next.third_party_provision_consent_or_basis = "unknown";
      }
      if (key === "has_unique_identifier" && value !== "true") {
        next.unique_identifier_basis = "";
      }
      if (key === "uses_resident_registration_number" && value !== "true") {
        next.resident_registration_statutory_basis = "unknown";
      }
      if (key === "uses_processor" && value !== "true") {
        next.controller_processor_roles_defined = "unknown";
        next.dpa_in_place = "unknown";
        next.processor_sufficient_guarantees = "unknown";
        next.processor_agreement_in_place = "unknown";
        next.processor_compliance_verified = "unknown";
        next.processor_public_disclosure = "unknown";
        next.processor_supervision_done = "unknown";
        next.subprocessor_controls_in_place = "unknown";
        next.subprocessor_or_onward_transfer_controls = "unknown";
      }
      if (key === "is_automated_decision_only" && value !== "true") {
        next.automated_decision_significant_effect = "unknown";
        next.automated_decision_rights_ready = "unknown";
        next.provides_explanation = "unknown";
        next.human_review_available = "unknown";
      }
      if (key === "automated_decision_significant_effect" && value !== "true") {
        next.automated_decision_rights_ready = "unknown";
        next.provides_explanation = "unknown";
        next.human_review_available = "unknown";
      }

      return next;
    });
  }

  function resetFlow() {
    window.localStorage.removeItem(FLOW_STORAGE_KEY);
    const detectedDefault = detectedPackId ?? selectedPackId;
    setFormState({ ...PACK_UI_DEFINITIONS[detectedDefault].defaultState });
    setComparisonPackIds([]);
    setComparisonOpen(false);
    setStepIndex(0);
    setScreenMode("intro");
    setEvaluationResults([]);
    setErrorMessage(null);
    setStatusMessage("입력을 초기화했습니다. 데이터 이전 시나리오를 다시 설정하세요.");
  }

  function clearAwsAppliedFormValues() {
    setFormState((current) => {
      const next = { ...current };
      for (const packId of PACK_IDS) {
        const definition = PACK_UI_DEFINITIONS[packId];
        for (const key of CLOUD_DISCOVERY_FIELD_KEYS) {
          next[key] = definition.defaultState[key] ?? "";
        }
        for (const key of Object.values(CLOUD_TO_PACK_FIELD_MAP[packId] ?? {})) {
          next[key] = definition.defaultState[key] ?? "";
        }
      }
      return next;
    });
  }

  function applyAwsValues(normalized: JsonObject) {
    const detectedFromAws =
      typeof normalized.current_region === "string"
        ? detectPackForRegion(normalized.current_region)
        : null;

    if (detectedFromAws) {
      setSelectedPackId(detectedFromAws);
    }

    setFormState((current) => {
      let next = {
        ...(detectedFromAws
          ? PACK_UI_DEFINITIONS[detectedFromAws].defaultState
          : {}),
        ...current,
      };
      for (const packId of PACK_IDS) {
        next = applyCloudDataToFormState(
          next,
          mapCloudDataForPack(packId, normalized),
        );
      }
      return next;
    });
    setStatusMessage(
      "AWS에서 확인 가능한 기술 입력값을 현재 세션에 반영했습니다. 법적 판단 항목은 질문 단계에서 계속 확인합니다.",
    );
  }

  function changeManualPack(packId: PackId) {
    setSelectedPackId(packId);
    setFormState((current) => mergeDefaultsForPack(packId, current));
    setStepIndex(0);
  }

  function toggleComparisonPack(packId: PackId) {
    if (packId === selectedPackId) {
      return;
    }
    setComparisonPackIds((current) =>
      current.includes(packId)
        ? current.filter((item) => item !== packId)
        : [...current, packId],
    );
    setFormState((current) => mergeDefaultsForPack(packId, current));
  }

  async function runEvaluation() {
    setIsBusy(true);
    setErrorMessage(null);

    const packIds = selectedPackIds;
    const results = await Promise.all(
      packIds.map(async (packId): Promise<PackEvaluationResult> => {
        const definition = PACK_UI_DEFINITIONS[packId];
        const label = definition.label;
        const missing = definition.validate(formState);

        if (missing.length > 0) {
          return {
            packId,
            label,
            status: "error",
            error: `추가 입력 필요: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? ` 외 ${missing.length - 8}개` : ""}`,
          };
        }

        try {
          const response = await fetchJson<EvaluationResult>("/api/v1/evaluate", {
            method: "POST",
            body: JSON.stringify({
              pack_id: packId,
              ...definition.buildPayload(formState),
            }),
          });

          return {
            packId,
            label,
            status: "success",
            result: response,
          };
        } catch (error) {
          return {
            packId,
            label,
            status: "error",
            error: buildErrorMessage(error),
          };
        }
      }),
    );

    setEvaluationResults(results);
    setScreenMode("result");
    setStatusMessage("평가가 완료되었습니다. 법제별 결과 카드를 따로 확인하세요.");
    setIsBusy(false);
  }

  return (
    <main className="app-shell min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
              Border Checker
            </span>
            <span className="text-sm text-[var(--color-muted)]">
              Guided transfer assessment
            </span>
          </div>
          {screenMode !== "intro" ? (
            <button
              type="button"
              onClick={() => setScreenMode("intro")}
              className="text-sm font-medium text-[var(--color-accent)] underline-offset-4 hover:underline"
            >
              시나리오 설정으로 돌아가기
            </button>
          ) : null}
        </header>

        <AwsSessionArea
          screenMode={screenMode}
          onApply={applyAwsValues}
          onClearAppliedValues={clearAwsAppliedFormValues}
        />

        <section className="glass-panel w-full overflow-hidden rounded-lg border border-[var(--color-line)] px-5 py-6 sm:px-6 sm:py-7">
          <div
            key={`${selectedPackId}-${screenMode}-${stepIndex}`}
            className="screen-enter"
          >
            {screenMode === "intro" ? (
              <ScenarioSetup
                formState={formState}
                selectedPackId={selectedPackId}
                selectedPackIds={selectedPackIds}
                detectedPackId={detectedPackId}
                comparisonOpen={comparisonOpen}
                packSummaries={packSummaries}
                onFieldChange={updateField}
                onManualPackChange={changeManualPack}
                onToggleComparison={toggleComparisonPack}
                onSetComparisonOpen={setComparisonOpen}
                onStart={() => {
                  setFormState((current) => mergeDefaultsForPack(selectedPackId, current));
                  setStepIndex(0);
                  setScreenMode("step");
                  setStatusMessage(
                    `${PACK_UI_DEFINITIONS[selectedPackId].label} 질문을 시작합니다. AWS에서 자동 입력된 기술 항목은 숨겨집니다.`,
                  );
                }}
                onReset={resetFlow}
              />
            ) : null}

            {screenMode === "step" ? (
              <div className="space-y-7">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    Step {stepIndex + 1}
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                    {currentStep.title}
                  </h1>
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    {currentStep.description}
                  </p>
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                      <span>Progress</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="progress-track mt-2">
                      <div
                        className="progress-fill"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {packDefinition.steps.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setStepIndex(index)}
                      className={`rounded-md border px-3 py-1.5 text-sm ${
                        index === stepIndex
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                          : "border-[var(--color-line)] bg-[var(--color-surface-strong)] text-[var(--color-muted)]"
                      }`}
                    >
                      {index + 1}. {step.title}
                    </button>
                  ))}
                </div>

                {cloudAppliedFields.length > 0 ? (
                  <TextList
                    title="AWS에서 자동 입력되어 숨긴 질문"
                    items={cloudAppliedFields.map((key) =>
                      fieldLabelForKey(packDefinition, key),
                    )}
                    compact
                  />
                ) : null}

                <div className="grid gap-5">
                  {visibleFields.length > 0 ? (
                    visibleFields.map((field) => (
                      <div key={field.key}>
                        {renderField(field, formState, updateField)}
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="이 단계의 기술 질문은 AWS 값으로 채워졌습니다."
                      description="확인이 필요한 법적 판단 항목이 남아 있으면 다음 단계에서 계속 표시됩니다."
                    />
                  )}
                </div>

                <TextList title="입력 안내" items={advisoryNotes} />
                <StatusBanner message={statusMessage} />
                {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

                <div className="flex flex-wrap gap-3">
                  <ActionButton
                    label="이전"
                    onClick={() =>
                      stepIndex === 0
                        ? setScreenMode("intro")
                        : setStepIndex((value) => value - 1)
                    }
                    variant="secondary"
                  />
                  <ActionButton
                    label={
                      stepIndex === packDefinition.steps.length - 1
                        ? "리뷰 화면으로"
                        : "다음"
                    }
                    onClick={() => {
                      if (currentStepMissing.length > 0) {
                        setErrorMessage(
                          `${currentStepMissing.join(", ")} 항목을 먼저 선택하세요.`,
                        );
                        return;
                      }

                      setErrorMessage(null);
                      if (stepIndex === packDefinition.steps.length - 1) {
                        setScreenMode("review");
                        return;
                      }
                      setStepIndex((value) => value + 1);
                    }}
                  />
                </div>
              </div>
            ) : null}

            {screenMode === "review" ? (
              <div className="space-y-7">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    Final Review
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                    입력 내용을 마지막으로 확인하세요
                  </h1>
                  <p className="text-sm leading-7 text-[var(--color-muted)]">
                    기본 평가 법제는 정상 질문 흐름을 완료해야 합니다. 추가 법제는 입력이 부족하면 해당 결과 카드에만 안내됩니다.
                  </p>
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                      <span>Progress</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="progress-track mt-2">
                      <div
                        className="progress-fill"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricCard label="기본 법제" value={packDefinition.label} />
                  <MetricCard label="평가 법제 수" value={`${selectedPackIds.length}개`} />
                  <MetricCard
                    label="현재 상태"
                    value={overallMissing.length === 0 ? "평가 가능" : "입력 보완 필요"}
                  />
                </div>

                {awsReviewRows.length > 0 ? (
                  <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      AWS에서 자동 입력된 값
                    </p>
                    <div className="mt-3">
                      {awsReviewRows.map((row) => (
                        <SummaryRow
                          key={`aws-${row.label}`}
                          label={row.label}
                          value={row.value}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-4">
                  {reviewSections.map((section) => (
                    <div
                      key={section.id}
                      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5"
                    >
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {section.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                        {section.description}
                      </p>
                      <div className="mt-3">
                        {section.rows.map((row) => (
                          <SummaryRow
                            key={`${section.id}-${row.label}`}
                            label={row.label}
                            value={row.value}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <StatusBanner
                  message={
                    overallMissing.length === 0
                      ? "기본 법제 입력이 정리되었습니다. 평가 실행을 누르면 선택된 법제별로 개별 평가합니다."
                      : `${overallMissing.join(", ")} 항목이 아직 필요합니다.`
                  }
                />
                {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

                <div className="flex flex-wrap gap-3">
                  <ActionButton
                    label="이전 단계로"
                    onClick={() => {
                      setStepIndex(packDefinition.steps.length - 1);
                      setScreenMode("step");
                    }}
                    variant="secondary"
                  />
                  <ActionButton
                    label="평가 실행"
                    onClick={() => {
                      if (overallMissing.length > 0) {
                        setErrorMessage(
                          `${overallMissing.join(", ")} 항목을 먼저 선택하세요.`,
                        );
                        return;
                      }

                      void runEvaluation();
                    }}
                    active={isBusy}
                    disabled={isBusy}
                  />
                </div>
              </div>
            ) : null}

            {screenMode === "result" ? (
              <div className="space-y-7">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    Evaluation Complete
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                    법제별 평가 결과
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
                    여러 법제를 선택한 경우 결과를 합치지 않고, 각 법제별로 /api/v1/evaluate를 개별 호출한 결과를 표시합니다.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <MetricCard
                    label="데이터 이전 흐름"
                    value={`${labelForOption(regionOptions, formState.current_region ?? "")} → ${labelForOption(regionOptions, formState.target_region ?? "")}`}
                  />
                  <MetricCard label="적용 법제 개수" value={`${selectedPackIds.length}개`} />
                  <MetricCard
                    label="AWS 연동 여부"
                    value={aws.isAwsConnected ? "연동됨" : "미연동"}
                  />
                </div>

                <div className="grid gap-5">
                  {evaluationResults.map((packResult) => (
                    <PackResultCard
                      key={packResult.packId}
                      packResult={packResult}
                      onReview={() => {
                        changeManualPack(packResult.packId as PackId);
                        setScreenMode("review");
                      }}
                      onGoToQuestions={() => {
                        changeManualPack(packResult.packId as PackId);
                        setStepIndex(0);
                        setScreenMode("step");
                      }}
                    />
                  ))}
                </div>

                <footer className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] px-5 py-4 text-sm leading-7 text-[var(--color-muted)]">
                  <p className="font-semibold text-[var(--color-ink)]">Disclaimer</p>
                  <p>
                    Border Checker는 규칙 기반 의사결정 지원 도구입니다. 실제 운영 반영 전에는 법무, 개인정보보호, 보안 담당자가 사실관계와 문서를 함께 검토해야 합니다.
                  </p>
                </footer>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

export function GuidedSingleFlowPage() {
  return (
    <AwsIntegrationProvider>
      <GuidedFlowContent />
    </AwsIntegrationProvider>
  );
}
