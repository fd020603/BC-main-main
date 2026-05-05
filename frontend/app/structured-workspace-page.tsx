"use client";

import { useEffect, useState, useTransition } from "react";

import { defaultFormState, euRegionOptions, STORAGE_KEY } from "./workspace-form-config";
import { HeroPanel, SidebarPanel } from "./workspace-header-sidebar";
import { InputFormPanel } from "./workspace-form-sections";
import { ExplainabilityPanel, ResultPanel } from "./workspace-output-panels";
import {
  buildErrorMessage,
  buildPayload,
  DATASET_TO_TYPE,
  fetchJson,
  sanitizeStoredState,
  validateForm,
} from "./workspace-runtime";
import { decisionMeta, type EvaluationResult, type FormState, type JsonObject, type MergeResponse, type PackDetail } from "./workspace-types";

export function StructuredWorkspacePage() {
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [mergePreview, setMergePreview] = useState<JsonObject | null>(null);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [packDetail, setPackDetail] = useState<PackDetail | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "필수 항목을 선택한 뒤 병합 미리보기 또는 평가 실행을 눌러 주세요. 입력값은 이 브라우저에 자동 저장됩니다.",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    try {
      const next = sanitizeStoredState(window.localStorage.getItem(STORAGE_KEY));
      if (!cancelled) {
        setFormState(next);
      }
    } finally {
      if (!cancelled) {
        setIsStorageReady(true);
      }
    }

    async function loadPack() {
      try {
        const response = await fetchJson<PackDetail>("/api/v1/packs/gdpr/detail");
        if (!cancelled) {
          startTransition(() => {
            setPackDetail(response);
          });
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(buildErrorMessage(error));
          setStatusMessage(
            "백엔드 연결에 실패했습니다. FastAPI 서버와 팩 API 상태를 확인해 주세요.",
          );
        }
      }
    }

    void loadPack();
    return () => {
      cancelled = true;
    };
  }, [startTransition]);

  useEffect(() => {
    if (!isStorageReady) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
  }, [formState, isStorageReady]);

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

  function updateField(key: keyof FormState, value: string) {
    setErrorMessage(null);
    setFormState((current) => {
      const next = { ...current, [key]: value };
      if (key === "dataset_name") {
        const suggestedType = DATASET_TO_TYPE[value];
        if (suggestedType) {
          next.data_type = suggestedType;
        }
      }
      if (key === "derogation_used" && value !== "true") {
        next.derogation_type = "";
      }
      return next;
    });
  }

  function resetWorkspace() {
    startTransition(() => {
      setFormState(defaultFormState);
      setMergePreview(null);
      setEvaluationResult(null);
      setErrorMessage(null);
      setStatusMessage("입력값을 초기화했습니다. 새로운 검토 케이스를 선택해 주세요.");
    });
    window.localStorage.removeItem(STORAGE_KEY);
  }

  const missingRequired = validateForm(formState);
  const safeguardsSelected =
    formState.scc_in_place === "true" ||
    formState.bcr_in_place === "true" ||
    formState.other_safeguards_in_place === "true";
  const unresolvedSelections = Object.values(formState).filter(
    (value) => value === "" || value === "unknown",
  ).length;

  const advisoryNotes: string[] = [];
  if (
    formState.data_subject_region === "EU" &&
    formState.target_region &&
    !euRegionOptions.some((option) => option.value === formState.target_region)
  ) {
    advisoryNotes.push(
      "EU 정보주체 데이터가 역외 리전으로 이동하면 Chapter V 이전 메커니즘과 대상국 맥락을 함께 확인해야 합니다.",
    );
  }
  if (formState.contains_sensitive_data === "true") {
    advisoryNotes.push(
      "민감정보가 포함되면 제9조 예외 요건, 보완조치, 증빙 문서 상태를 함께 확인하는 것이 좋습니다.",
    );
  }
  if (formState.uses_processor === "true") {
    advisoryNotes.push(
      "외부 처리자를 사용하는 구조라면 DPA, 역할 정의, 충분한 보증 자료가 핵심 증빙이 됩니다.",
    );
  }
  if (formState.derogation_used === "true") {
    advisoryNotes.push(
      "제49조 예외 경로는 반복적 운영 이전보다 예외적 상황에 적합하므로 결과가 수동 검토로 갈 가능성이 큽니다.",
    );
  }
  if (advisoryNotes.length === 0) {
    advisoryNotes.push(
      "현재 선택 조합은 기본 거버넌스와 이전 메커니즘 준비도를 확인하기 좋은 일반 검토 시나리오입니다.",
    );
  }

  return (
    <main className="app-shell min-h-screen overflow-hidden">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <HeroPanel
          packDetail={packDetail}
          isStorageReady={isStorageReady}
          missingRequiredCount={missingRequired.length}
          unresolvedSelections={unresolvedSelections}
          safeguardsSelected={safeguardsSelected}
        />

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <InputFormPanel formState={formState} onChange={updateField} />
          <SidebarPanel
            formState={formState}
            safeguardsSelected={safeguardsSelected}
            statusMessage={statusMessage}
            errorMessage={errorMessage}
            isBusy={isBusy}
            activeAction={activeAction}
            advisoryNotes={advisoryNotes}
            packDetail={packDetail}
            onPreview={() =>
              void withAction("merge", async () => {
                const payload = buildPayload(formState);
                const response = await fetchJson<MergeResponse>("/api/v1/merge", {
                  method: "POST",
                  body: JSON.stringify({
                    ...payload,
                    schema_file_name: "input_schema_v2.json",
                  }),
                });
                startTransition(() => {
                  setMergePreview(response.merged_input);
                  setStatusMessage(
                    "입력 병합 결과를 확인했습니다. 이제 평가를 실행하면 최종 결정과 근거가 표시됩니다.",
                  );
                });
              })
            }
            onEvaluate={() =>
              void withAction("evaluate", async () => {
                const payload = buildPayload(formState);
                const response = await fetchJson<EvaluationResult>("/api/v1/evaluate", {
                  method: "POST",
                  body: JSON.stringify({
                    ...payload,
                    schema_file_name: "input_schema_v2.json",
                    pack_file_name: "gdpr_pack_v3.json",
                  }),
                });
                startTransition(() => {
                  setEvaluationResult(response);
                  setMergePreview(response.merged_input);
                  setStatusMessage(
                    `평가 완료: ${decisionMeta[response.final_decision].label}`,
                  );
                });
              })
            }
            onRefreshPack={() =>
              void withAction("pack", async () => {
                const response = await fetchJson<PackDetail>("/api/v1/packs/gdpr/detail");
                startTransition(() => {
                  setPackDetail(response);
                  setStatusMessage("정책 팩 정보를 새로 불러왔습니다.");
                });
              })
            }
            onReset={resetWorkspace}
          />
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
