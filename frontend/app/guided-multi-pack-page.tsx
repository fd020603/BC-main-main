"use client";

import { useEffect, useState, useTransition } from "react";

import { PACK_UI_DEFINITIONS } from "./guided-pack-config";
import type { GuidedField, GuidedFormState } from "./guided-pack-types";
import { ExplainabilityPanel, ResultPanel } from "./workspace-output-panels";
import { buildErrorMessage, fetchJson } from "./workspace-runtime";
import type {
  EvaluationResult,
  MergeResponse,
  PackDetail,
  PackSummary,
} from "./workspace-types";
import {
  ActionButton,
  EmptyState,
  ErrorBanner,
  MetricCard,
  SectionIntro,
  SegmentedField,
  SelectField,
  StatusBanner,
  SummaryRow,
  TextList,
} from "./workspace-ui";

const SELECTED_PACK_STORAGE_KEY = "border-checker-selected-pack";

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
      value={state[field.key] ?? ""}
      onChange={(value) => onChange(field.key, value)}
      options={field.options}
    />
  );
}

export function GuidedMultiPackPage() {
  const [packSummaries, setPackSummaries] = useState<PackSummary[]>([]);
  const [selectedPackId, setSelectedPackId] = useState("gdpr");
  const [packDetail, setPackDetail] = useState<PackDetail | null>(null);
  const [formState, setFormState] = useState<GuidedFormState>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [mergePreview, setMergePreview] = useState<Record<string, unknown> | null>(null);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "팩을 고른 뒤 단계별 질문에 답하면 실제 백엔드 API로 병합과 평가를 실행합니다.",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [, startTransition] = useTransition();

  const packDefinition = PACK_UI_DEFINITIONS[selectedPackId] ?? PACK_UI_DEFINITIONS.gdpr;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const summaries = await fetchJson<PackSummary[]>("/api/v1/packs");
        const supportedSummaries = summaries.filter(
          (pack) => pack.pack_id in PACK_UI_DEFINITIONS,
        );
        const storedPackId =
          window.localStorage.getItem(SELECTED_PACK_STORAGE_KEY) ?? "gdpr";
        const nextPackId =
          storedPackId in PACK_UI_DEFINITIONS ? storedPackId : "gdpr";

        if (!cancelled) {
          startTransition(() => {
            setPackSummaries(supportedSummaries);
            setSelectedPackId(nextPackId);
          });
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(buildErrorMessage(error));
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [startTransition]);

  useEffect(() => {
    let cancelled = false;
    const definition = PACK_UI_DEFINITIONS[selectedPackId];
    if (!definition) {
      return;
    }

    window.localStorage.setItem(SELECTED_PACK_STORAGE_KEY, selectedPackId);

    const storedState = window.localStorage.getItem(definition.storageKey);
    let nextState = { ...definition.defaultState };
    if (storedState) {
      try {
        nextState = { ...definition.defaultState, ...(JSON.parse(storedState) as GuidedFormState) };
      } catch {}
    }

    startTransition(() => {
      setFormState(nextState);
      setStepIndex(0);
      setMergePreview(null);
      setEvaluationResult(null);
      setStorageReady(true);
    });

    async function loadDetail() {
      try {
        const detail = await fetchJson<PackDetail>(`/api/v1/packs/${selectedPackId}/detail`);
        if (!cancelled) {
          setPackDetail(detail);
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
  }, [selectedPackId, startTransition]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }
    window.localStorage.setItem(packDefinition.storageKey, JSON.stringify(formState));
  }, [formState, packDefinition.storageKey, storageReady]);

  async function withAction(action: string, task: () => Promise<void>) {
    setIsBusy(true);
    setActiveAction(action);
    setErrorMessage(null);
    try {
      await task();
    } catch (error) {
      setErrorMessage(buildErrorMessage(error));
    } finally {
      setIsBusy(false);
      setActiveAction(null);
    }
  }

  function updateField(key: string, value: string) {
    setErrorMessage(null);
    setFormState((current) => {
      const next = { ...current, [key]: value };
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

  const currentStep = packDefinition.steps[stepIndex];
  const visibleFields = currentStep.fields.filter(
    (field) => !field.visibleIf || field.visibleIf(formState),
  );
  const missingRequired = packDefinition.validate(formState);
  const advisoryNotes = packDefinition.buildAdvisoryNotes(formState);
  const summaryRows = packDefinition.buildSummaryRows(formState);

  return (
    <main className="app-shell min-h-screen overflow-hidden">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="glass-panel relative overflow-hidden rounded-[34px] border border-[var(--color-line)] px-6 py-7 sm:px-8 sm:py-8">
          <div className="hero-orb hero-orb-primary" />
          <div className="hero-orb hero-orb-secondary" />
          <div className="hero-orb hero-orb-tertiary" />
          <div className="relative grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
            <div className="reveal-up space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  Border Checker
                </span>
                <span className="rounded-full border border-[var(--color-line)] bg-[rgba(255,253,248,0.72)] px-3 py-1 text-xs text-[var(--color-muted)]">
                  Guided Compliance Intake
                </span>
              </div>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl">
                  일반 사업자도 따라가기 쉬운 단계형 국외이전 검토 워크플로
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                  팩을 고르면 해당 법제에 맞는 질문만 단계별로 보여줍니다. 모든
                  입력은 실제 평가 엔진으로 전달되지만, 사용자는 한 번에 모든
                  법률 질문을 보지 않아도 됩니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {packSummaries.map((pack) => (
                  <button
                    key={pack.pack_id}
                    type="button"
                    onClick={() => setSelectedPackId(pack.pack_id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      pack.pack_id === selectedPackId
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "border-[var(--color-line)] bg-[var(--color-surface-strong)] text-[var(--color-muted)]"
                    }`}
                  >
                    {pack.pack_name}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard label="선택된 팩" value={packDefinition.label} />
                <MetricCard label="입력 방식" value="단계형 질문 + 자동 저장" />
                <MetricCard label="남은 필수값" value={`${missingRequired.length}개`} />
              </div>
            </div>
            <div className="reveal-up rounded-[30px] border border-[var(--color-line)] bg-[rgba(255,253,248,0.8)] p-6 backdrop-blur-sm [animation-delay:140ms]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                현재 팩
              </p>
              <p className="mt-4 text-lg font-semibold text-[var(--color-ink)]">
                {packDetail?.pack_name ?? packDefinition.label}
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                {packDefinition.subtitle}
              </p>
              <div className="mt-6 rounded-[24px] border border-[var(--color-line)] bg-white/80 p-4">
                <SummaryRow label="단계" value={`${stepIndex + 1} / ${packDefinition.steps.length}`} />
                <SummaryRow label="규칙 수" value={packDetail ? `${packDetail.rule_count} rules` : "로딩 중"} />
                <SummaryRow label="저장 상태" value={storageReady ? "브라우저 저장 중" : "초기화 중"} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="glass-panel rounded-[32px] border border-[var(--color-line)] p-6 sm:p-7">
            <SectionIntro
              kicker={`Step ${stepIndex + 1}`}
              title={currentStep.title}
              description={currentStep.description}
            />
            <div className="mt-5 flex flex-wrap gap-2">
              {packDefinition.steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    index === stepIndex
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      : "border-[var(--color-line)] bg-[var(--color-surface-strong)] text-[var(--color-muted)]"
                  }`}
                >
                  {index + 1}. {step.title}
                </button>
              ))}
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {visibleFields.map((field) => (
                <div key={field.key} className={field.kind === "segmented" ? "lg:col-span-2" : ""}>
                  {renderField(field, formState, updateField)}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionButton
                label="이전 단계"
                onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
                disabled={stepIndex === 0}
                variant="secondary"
              />
              <ActionButton
                label={stepIndex === packDefinition.steps.length - 1 ? "마지막 단계" : "다음 단계"}
                onClick={() =>
                  setStepIndex((value) =>
                    Math.min(packDefinition.steps.length - 1, value + 1),
                  )
                }
                disabled={stepIndex === packDefinition.steps.length - 1}
              />
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="glass-panel rounded-[32px] border border-[var(--color-line)] p-6">
              <SectionIntro
                kicker="요약과 실행"
                title="현재 입력 상태"
                description="각 팩에 맞는 핵심 값만 요약해서 보여주고 바로 실행할 수 있게 했습니다."
              />
              <div className="mt-5 rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
                {summaryRows.map((row) => (
                  <SummaryRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ActionButton
                  label="병합 미리보기"
                  onClick={() =>
                    void withAction("merge", async () => {
                      const response = await fetchJson<MergeResponse>("/api/v1/merge", {
                        method: "POST",
                        body: JSON.stringify({
                          pack_id: selectedPackId,
                          ...packDefinition.buildPayload(formState)
                        })
                      });
                      setMergePreview(response.merged_input);
                      setStatusMessage("병합 결과를 확인했습니다. 이제 평가를 실행해도 됩니다.");
                    })
                  }
                  active={activeAction === "merge"}
                  disabled={isBusy}
                />
                <ActionButton
                  label="평가 실행"
                  onClick={() =>
                    void withAction("evaluate", async () => {
                      const response = await fetchJson<EvaluationResult>("/api/v1/evaluate", {
                        method: "POST",
                        body: JSON.stringify({
                          pack_id: selectedPackId,
                          ...packDefinition.buildPayload(formState)
                        })
                      });
                      setEvaluationResult(response);
                      setMergePreview(response.merged_input);
                      setStatusMessage("평가가 완료되었습니다. 결과와 발동 규칙을 확인해 주세요.");
                    })
                  }
                  active={activeAction === "evaluate"}
                  disabled={isBusy}
                />
              </div>
              <StatusBanner message={statusMessage} />
              {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
              <div className="mt-5">
                <TextList title="실시간 안내" items={advisoryNotes} />
              </div>
            </section>

            <section className="glass-panel rounded-[32px] border border-[var(--color-line)] p-6">
              <SectionIntro
                kicker="팩 정보"
                title="적용 중인 법제 팩"
                description="팩별 질문이 왜 달라지는지 바로 설명할 수 있도록 메타데이터를 함께 보여줍니다."
              />
              {packDetail ? (
                <div className="mt-5 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MetricCard label="관할" value={packDetail.jurisdiction} />
                    <MetricCard label="버전" value={packDetail.version} />
                    <MetricCard label="규칙 수" value={`${packDetail.rule_count} rules`} />
                    <MetricCard label="결정 모델" value={packDetail.decision_model.precedence.join(" > ")} />
                  </div>
                  <TextList title="검토 가이드" items={packDetail.review_guidance} />
                </div>
              ) : (
                <EmptyState
                  title="팩 정보를 불러오는 중입니다."
                  description="팩 상세를 가져오면 여기 표시됩니다."
                />
              )}
            </section>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <ResultPanel evaluationResult={evaluationResult} />
          <ExplainabilityPanel
            evaluationResult={evaluationResult}
            mergePreview={mergePreview}
          />
        </section>

        <footer className="rounded-[28px] border border-[var(--color-line)] bg-[rgba(255,253,248,0.76)] px-6 py-5 text-sm leading-7 text-[var(--color-muted)]">
          <p className="font-semibold text-[var(--color-ink)]">Disclaimer</p>
          <p>
            Border Checker는 정책 기반 의사결정 지원 도구입니다. 실제 운영 반영
            전에는 법무, 프라이버시, 보안 담당자가 사실관계와 문서를 함께
            검토해야 합니다.
          </p>
        </footer>
      </div>
    </main>
  );
}
