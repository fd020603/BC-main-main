"use client";

import { useEffect, useState, useTransition } from "react";

import type {
  DemoScenario,
  DemoScenarioListResponse,
  EvaluationResult,
  JsonObject,
  MergeResponse,
  PackDetail,
} from "./workspace-types";
import { decisionMeta } from "./workspace-types";
import {
  ActionButton,
  DecisionBadge,
  EditorCard,
  EmptyState,
  ErrorBanner,
  InlineList,
  MetricCard,
  SectionIntro,
  StatusBanner,
  TextList,
} from "./workspace-ui";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const formatJson = (value: unknown) => JSON.stringify(value, null, 2);

function stripScenarioNotes(policyData: JsonObject): JsonObject {
  const next = { ...policyData };
  delete next.scenario_notes;
  return next;
}

function buildErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.";
}

function parseJsonInput(label: string, input: string): JsonObject {
  let parsed: unknown;

  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error(`${label} JSON 형식이 올바르지 않습니다.`);
  }

  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`${label}은(는) JSON 객체여야 합니다.`);
  }

  return parsed as JsonObject;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = "요청에 실패했습니다.";
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        detail = body.detail;
      }
    } catch {}
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export function WorkspacePage() {
  const [samples, setSamples] = useState<DemoScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [awsInput, setAwsInput] = useState("{}");
  const [policyInput, setPolicyInput] = useState("{}");
  const [scenarioNotes, setScenarioNotes] = useState("");
  const [mergePreview, setMergePreview] = useState<JsonObject | null>(null);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [packDetail, setPackDetail] = useState<PackDetail | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "샘플을 불러오거나 직접 JSON을 입력해 평가를 시작하세요.",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const [packResponse, sampleResponse] = await Promise.all([
          fetchJson<PackDetail>("/api/v1/packs/gdpr/detail"),
          fetchJson<DemoScenarioListResponse>("/api/v1/samples/demo"),
        ]);

        if (cancelled) {
          return;
        }

        startTransition(() => {
          setPackDetail(packResponse);
          setSamples(sampleResponse.scenarios);
          const first = sampleResponse.scenarios[0];
          if (first) {
            setSelectedScenarioId(first.scenario_id);
            setAwsInput(formatJson(first.aws_data));
            setPolicyInput(formatJson(stripScenarioNotes(first.policy_data)));
            setScenarioNotes(String(first.policy_data.scenario_notes ?? ""));
            setStatusMessage(
              "기본 샘플이 로드되었습니다. 그대로 평가하거나 입력을 수정해 보세요.",
            );
          }
        });
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(buildErrorMessage(error));
          setStatusMessage(
            "백엔드 연결에 실패했습니다. FastAPI 서버가 실행 중인지 확인하세요.",
          );
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [startTransition]);

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

  function buildPayload() {
    const awsData = parseJsonInput("기술 메타데이터", awsInput);
    const policyData = parseJsonInput("정책 컨텍스트", policyInput);
    if (scenarioNotes.trim()) {
      policyData.scenario_notes = scenarioNotes.trim();
    } else {
      delete policyData.scenario_notes;
    }
    return { aws_data: awsData, policy_data: policyData };
  }

  function applyScenario(sample: DemoScenario) {
    startTransition(() => {
      setSelectedScenarioId(sample.scenario_id);
      setAwsInput(formatJson(sample.aws_data));
      setPolicyInput(formatJson(stripScenarioNotes(sample.policy_data)));
      setScenarioNotes(String(sample.policy_data.scenario_notes ?? ""));
      setMergePreview(null);
      setEvaluationResult(null);
      setStatusMessage(`샘플 "${sample.name}"을 불러왔습니다.`);
    });
  }

  function clearWorkspace() {
    startTransition(() => {
      setSelectedScenarioId("");
      setAwsInput("{}");
      setPolicyInput("{}");
      setScenarioNotes("");
      setMergePreview(null);
      setEvaluationResult(null);
      setErrorMessage(null);
      setStatusMessage("입력값을 초기화했습니다.");
    });
  }

  const selectedSample =
    samples.find((sample) => sample.scenario_id === selectedScenarioId) ?? samples[0];

  const activeDecision = evaluationResult?.final_decision;

  return (
    <main className="app-shell min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel rounded-[30px] border border-[var(--color-line)] px-6 py-7 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
                Border Checker
              </span>
              <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs text-[var(--color-muted)]">
                Policy Decision Support
              </span>
            </div>
            <div className="mt-5 max-w-3xl space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl">
                국외 이전과 데이터 주권 검토를 위한 정책 기반 평가 콘솔
              </h1>
              <p className="text-sm leading-7 text-[var(--color-muted)] sm:text-base">
                Border Checker는 기술 메타데이터와 사업·정책 컨텍스트를 합쳐
                GDPR 관점의 국외 이전 경로를 정성적으로 분류합니다.
              </p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="결정 모델"
                value="deny > manual_review > condition_allow > allow"
              />
              <MetricCard
                label="정책 팩"
                value={
                  packDetail
                    ? `${packDetail.pack_name} v${packDetail.version}`
                    : "로딩 중"
                }
              />
              <MetricCard
                label="샘플"
                value={samples.length > 0 ? `${samples.length}개 준비` : "로딩 중"}
              />
            </div>
          </div>
          <div className="glass-panel rounded-[30px] border border-[var(--color-line)] px-6 py-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              안내
            </p>
            <p className="mt-4 text-lg font-semibold text-[var(--color-ink)]">
              점수 없이 설명 가능한 규칙 결과만 보여줍니다.
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              이 도구는 정책 기반 의사결정 지원용이며 법률 자문을 대체하지
              않습니다. 해석 여지가 있거나 증빙이 비어 있으면 수동 검토로
              남겨 둡니다.
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col gap-6">
            <section className="glass-panel rounded-[30px] border border-[var(--color-line)] p-6">
              <SectionIntro
                kicker="입력 워크스페이스"
                title="실제 백엔드 API로 머지와 평가를 실행합니다"
                description="샘플을 고른 뒤 바로 실행하거나 JSON을 수정해 맞춤 시나리오를 시험할 수 있습니다."
              />
              <div className="mt-5 flex flex-wrap gap-2">
                {samples.map((sample) => (
                  <button
                    key={sample.scenario_id}
                    type="button"
                    onClick={() => setSelectedScenarioId(sample.scenario_id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      selectedScenarioId === sample.scenario_id
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                        : "border-[var(--color-line)] bg-[var(--color-surface-strong)] text-[var(--color-muted)]"
                    }`}
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  선택된 샘플
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {selectedSample?.description ?? "샘플을 선택하면 설명이 표시됩니다."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton
                    label="샘플 불러오기"
                    onClick={() => selectedSample && applyScenario(selectedSample)}
                    disabled={isBusy || !selectedSample}
                  />
                  <ActionButton
                    label="Preview Merge"
                    onClick={() =>
                      void withAction("merge", async () => {
                        const payload = buildPayload();
                        const response = await fetchJson<MergeResponse>("/api/v1/merge", {
                          method: "POST",
                          body: JSON.stringify({
                            ...payload,
                            schema_file_name: "input_schema_v2.json",
                          }),
                        });
                        startTransition(() => {
                          setMergePreview(response.merged_input);
                          setStatusMessage("입력 병합 결과를 미리 확인했습니다.");
                        });
                      })
                    }
                    active={activeAction === "merge"}
                    disabled={isBusy}
                  />
                  <ActionButton
                    label="Run Evaluation"
                    onClick={() =>
                      void withAction("evaluate", async () => {
                        const payload = buildPayload();
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
                    active={activeAction === "evaluate"}
                    disabled={isBusy}
                  />
                  <ActionButton
                    label="Load Pack Info"
                    onClick={() =>
                      void withAction("pack", async () => {
                        const response = await fetchJson<PackDetail>("/api/v1/packs/gdpr/detail");
                        startTransition(() => {
                          setPackDetail(response);
                          setStatusMessage("정책 팩 정보를 새로 불러왔습니다.");
                        });
                      })
                    }
                    active={activeAction === "pack"}
                    disabled={isBusy}
                    variant="secondary"
                  />
                  <ActionButton
                    label="입력 초기화"
                    onClick={clearWorkspace}
                    disabled={isBusy}
                    variant="secondary"
                  />
                </div>
              </div>
              <StatusBanner message={statusMessage} />
              {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <EditorCard
                  label="기술 메타데이터"
                  helper="AWS 또는 발견형 입력을 JSON 객체로 작성하세요."
                  value={awsInput}
                  onChange={setAwsInput}
                  placeholder='{"current_region":"eu-central-1"}'
                />
                <EditorCard
                  label="정책 컨텍스트"
                  helper="사업 목적, 계약, 문서 상태를 JSON으로 작성하세요."
                  value={policyInput}
                  onChange={setPolicyInput}
                  placeholder='{"dataset_name":"eu-export"}'
                />
              </div>
              <div className="mt-5 rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
                <label className="text-sm font-semibold text-[var(--color-ink)]">
                  시나리오 노트
                </label>
                <textarea
                  value={scenarioNotes}
                  onChange={(event) => setScenarioNotes(event.target.value)}
                  rows={4}
                  className="mt-3 w-full rounded-2xl border border-[var(--color-line)] bg-[#faf7f2] px-4 py-3 text-sm leading-6 text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </section>
            <section className="glass-panel rounded-[30px] border border-[var(--color-line)] p-6">
              <SectionIntro
                kicker="정책 팩"
                title="현재 로드된 GDPR 정책 팩"
                description="규칙 팩의 버전, 범위, 전제, 검토 가이드를 빠르게 확인할 수 있습니다."
              />
              {packDetail ? (
                <div className="mt-5 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MetricCard label="팩 이름" value={packDetail.pack_name} />
                    <MetricCard
                      label="버전 / 관할"
                      value={`${packDetail.version} / ${packDetail.jurisdiction}`}
                    />
                    <MetricCard
                      label="규칙 수"
                      value={`${packDetail.rule_count} rules`}
                    />
                    <MetricCard
                      label="결정 모델"
                      value={packDetail.decision_model.precedence.join(" > ")}
                    />
                  </div>
                  <InlineList title="카테고리" items={packDetail.covered_categories} />
                  <InlineList
                    title="지원 결정값"
                    items={packDetail.supported_decisions}
                  />
                  <TextList title="전제" items={packDetail.assumptions} />
                  <TextList title="한계" items={packDetail.limitations} />
                  <TextList title="검토 가이드" items={packDetail.review_guidance} />
                  <InlineList
                    title="주요 참고 구조"
                    items={packDetail.source_references}
                  />
                </div>
              ) : (
                <EmptyState
                  title="정책 팩 정보를 불러오는 중입니다."
                  description="백엔드 연결이 완료되면 사용 중인 팩 메타데이터가 표시됩니다."
                />
              )}
            </section>
          </div>
          <div className="flex flex-col gap-6">
            <section className="glass-panel rounded-[30px] border border-[var(--color-line)] p-6">
              <SectionIntro
                kicker="평가 결과"
                title="최종 결정과 핵심 설명"
                description="점수 대신 네 단계의 정성적 결정과 규칙 근거를 표시합니다."
              />
              {evaluationResult && activeDecision ? (
                <div className="mt-5 space-y-5">
                  <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-3">
                        <DecisionBadge decision={activeDecision} />
                        <div>
                          <p className="text-xl font-semibold text-[var(--color-ink)]">
                            {evaluationResult.summary}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                            {evaluationResult.explanation}
                          </p>
                        </div>
                      </div>
                      <div className="max-w-xs rounded-2xl border border-[var(--color-line)] bg-[#faf7f2] p-4">
                        <p className="text-sm font-semibold text-[var(--color-ink)]">
                          결정 해석
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          {decisionMeta[activeDecision].description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    <TextList title="법적 근거" items={evaluationResult.legal_basis_articles} />
                    <TextList title="필수 조치" items={evaluationResult.required_actions} />
                    <TextList title="다음 단계" items={evaluationResult.next_steps} />
                    <TextList
                      title="증빙 공백"
                      items={evaluationResult.qualitative_review_hints.evidence_gaps}
                      emptyCopy="현재 자동으로 식별된 핵심 증빙 공백은 없습니다."
                    />
                  </div>
                  <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      정성적 검토 메모
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                      {evaluationResult.qualitative_review_hints.ambiguity_summary}
                    </p>
                  </div>
                  <TextList
                    title="리뷰어 체크리스트"
                    items={evaluationResult.qualitative_review_hints.reviewer_checklist}
                    emptyCopy="추가 체크리스트가 지정되지 않았습니다."
                  />
                </div>
              ) : (
                <EmptyState
                  title="평가 결과가 아직 없습니다."
                  description="Run Evaluation을 실행하면 최종 결정과 설명이 표시됩니다."
                />
              )}
            </section>
            <section className="glass-panel rounded-[30px] border border-[var(--color-line)] p-6">
              <SectionIntro
                kicker="설명 가능성 / 감사 추적"
                title="발동 규칙과 병합 입력 미리보기"
                description="규칙별 근거, 간단한 트레이스, 병합된 입력값을 함께 확인할 수 있습니다."
              />
              {evaluationResult ? (
                <div className="mt-5 space-y-5">
                  <div className="space-y-4">
                    {evaluationResult.triggered_rules.map((rule) => (
                      <article
                        key={rule.rule_id}
                        className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                              {rule.article} · {rule.category}
                            </p>
                            <h3 className="mt-2 text-lg font-semibold text-[var(--color-ink)]">
                              {rule.title}
                            </h3>
                          </div>
                          <DecisionBadge decision={rule.decision} compact />
                        </div>
                        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                          {rule.rationale}
                        </p>
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <TextList title="확인 사실" items={rule.matched_facts} compact />
                          <TextList
                            title="추가 확인 증빙"
                            items={rule.required_evidence}
                            compact
                            emptyCopy="추가 증빙 요구 없음"
                          />
                          <TextList
                            title="리뷰어 메모"
                            items={rule.reviewer_notes}
                            compact
                            emptyCopy="별도 리뷰어 메모 없음"
                          />
                          <TextList
                            title="참고 참조"
                            items={rule.references}
                            compact
                            emptyCopy="추가 참조 없음"
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      Evaluation Trace
                    </p>
                    <div className="mt-3 max-h-[280px] space-y-3 overflow-y-auto pr-1">
                      {evaluationResult.evaluation_trace.rule_results.map((trace) => (
                        <div
                          key={trace.rule_id}
                          className="rounded-2xl border border-[var(--color-line)] bg-[#faf7f2] p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[var(--color-ink)]">
                              {trace.title}
                            </p>
                            <span className="text-xs text-[var(--color-muted)]">
                              {trace.matched ? "matched" : "not matched"}
                            </span>
                          </div>
                          <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
                            {trace.reasoning.map((item) => (
                              <li key={`${trace.rule_id}-${item}`}>- {item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      Merged Input Preview
                    </p>
                    <pre className="code-block mt-4 max-h-[320px] overflow-auto rounded-2xl p-4 text-sm leading-6 text-[var(--color-ink)]">
                      {formatJson(evaluationResult.merged_input)}
                    </pre>
                  </div>
                </div>
              ) : mergePreview ? (
                <div className="mt-5 rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    Merge Preview
                  </p>
                  <pre className="code-block mt-4 max-h-[360px] overflow-auto rounded-2xl p-4 text-sm leading-6 text-[var(--color-ink)]">
                    {formatJson(mergePreview)}
                  </pre>
                </div>
              ) : (
                <EmptyState
                  title="설명 가능성 패널이 비어 있습니다."
                  description="Preview Merge 또는 Run Evaluation을 실행하면 병합 결과와 규칙 트레이스가 여기에 표시됩니다."
                />
              )}
            </section>
          </div>
        </section>
        <footer className="rounded-[28px] border border-[var(--color-line)] bg-[rgba(255,253,248,0.72)] px-6 py-5 text-sm leading-7 text-[var(--color-muted)]">
          <p className="font-semibold text-[var(--color-ink)]">Disclaimer</p>
          <p>
            Border Checker는 정책 기반 의사결정 지원 도구입니다. 실제 운영 적용
            전에는 법무, 프라이버시, 보안 담당자의 사실관계 확인과 문서 검토가
            필요합니다.
          </p>
        </footer>
      </div>
    </main>
  );
}
