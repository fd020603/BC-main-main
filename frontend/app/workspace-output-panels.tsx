import type { ReactNode } from "react";

import {
  decisionMeta,
  type DecisionGrade,
  type EvaluationResult,
  type JsonObject,
} from "./workspace-types";
import {
  DecisionBadge,
  EmptyState,
  SectionIntro,
} from "./workspace-ui";
import { formatJson } from "./workspace-runtime";
import { buildBeginnerGuidance } from "./result-guidance";

const DECISION_ORDER = [
  "deny",
  "manual_review",
  "condition_allow",
  "allow",
] as const;

const DECISION_HEADLINES: Record<DecisionGrade, string> = {
  deny: "지금은 진행하면 안 됩니다",
  manual_review: "담당자가 확인한 뒤 결정해야 합니다",
  condition_allow: "보완을 끝내면 진행할 수 있습니다",
  allow: "현재 입력 기준으로는 진행 가능합니다",
};

const DECISION_ACCENT_CLASSES: Record<DecisionGrade, string> = {
  deny: "border-l-[var(--color-danger)]",
  manual_review: "border-l-[var(--color-warning)]",
  condition_allow: "border-l-[var(--color-accent)]",
  allow: "border-l-[var(--color-success)]",
};

const DECISION_TEXT_CLASSES: Record<DecisionGrade, string> = {
  deny: "text-[var(--color-danger)]",
  manual_review: "text-[var(--color-warning)]",
  condition_allow: "text-[var(--color-accent)]",
  allow: "text-[var(--color-success)]",
};

function SummaryMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
        {value}
      </p>
      <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
        {helper}
      </p>
    </div>
  );
}

function ResultList({
  title,
  items,
  emptyCopy = "표시할 항목이 없습니다.",
  limit,
  ordered = false,
}: {
  title: string;
  items: string[];
  emptyCopy?: string;
  limit?: number;
  ordered?: boolean;
}) {
  const visibleItems = limit ? items.slice(0, limit) : items;
  const hiddenItems = limit ? items.slice(limit) : [];
  const ListTag = ordered ? "ol" : "ul";

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
      {items.length > 0 ? (
        <>
          <ListTag
            className={`mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)] ${
              ordered ? "list-decimal pl-5" : ""
            }`}
          >
            {visibleItems.map((item) => (
              <li
                key={`${title}-${item}`}
                className={ordered ? "pl-1" : "flex gap-2"}
              >
                {ordered ? null : (
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-[var(--color-accent)]" />
                )}
                <span>{item}</span>
              </li>
            ))}
          </ListTag>
          {hiddenItems.length > 0 ? (
            <details className="mt-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--color-muted)]">
                나머지 {hiddenItems.length}개 더 보기
              </summary>
              <ul className="mt-2 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                {hiddenItems.map((item) => (
                  <li key={`${title}-hidden-${item}`} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-[var(--color-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
          {emptyCopy}
        </p>
      )}
    </div>
  );
}

function KeyReasonList({
  evaluationResult,
}: {
  evaluationResult: EvaluationResult;
}) {
  const keyRules = evaluationResult.triggered_rules.slice(0, 4);

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">
        왜 이런 결과가 나왔나요?
      </h3>
      {keyRules.length > 0 ? (
        <div className="mt-3 space-y-3">
          {keyRules.map((rule, index) => (
            <div
              key={rule.rule_id}
              className="rounded-lg border border-[var(--color-line)] bg-white p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[var(--color-surface-muted)] px-2 py-1 text-xs font-semibold text-[var(--color-muted)]">
                  이유 {index + 1}
                </span>
                <DecisionBadge decision={rule.decision} compact />
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink)]">
                {rule.message}
              </p>
              {rule.rationale !== rule.message ? (
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {rule.rationale}
                </p>
              ) : null}
              {rule.required_actions[0] ? (
                <p className="mt-2 text-xs font-semibold leading-6 text-[var(--color-muted)]">
                  필요 조치: {rule.required_actions[0]}
                </p>
              ) : null}
              <p className="mt-2 text-xs leading-6 text-[var(--color-muted)]">
                관련 근거: {rule.article}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
          최종 판단을 바꿀 만큼 강하게 발동한 규칙은 없습니다.
        </p>
      )}
    </div>
  );
}

function InputContextCard({
  evaluationResult,
}: {
  evaluationResult: EvaluationResult;
}) {
  const observations = evaluationResult.evaluation_trace.input_observations;

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">
        이번 평가는 어떤 상황을 본 건가요?
      </h3>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--color-muted)] sm:grid-cols-2">
        {observations.map((item) => (
          <li
            key={item}
            className="rounded-md bg-[var(--color-surface-muted)] px-3 py-2"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExplanationBreakdown({
  explanation,
}: {
  explanation: string;
}) {
  const sections = explanation
    .split(/(?=차단 이슈:|추가 검토 필요 사항:|조건부 진행 전제:|허용 판단 근거:)/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const [rawTitle, ...rest] = section.split(":");
        const hasKnownTitle = rest.length > 0 && rawTitle.length < 20;
        const title = hasKnownTitle ? rawTitle : "평가 설명";
        const body = hasKnownTitle ? rest.join(":").trim() : section;

        return (
          <div
            key={section}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3"
          >
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {title}
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              {body}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function DetailDisclosure({
  title,
  helper,
  children,
  defaultOpen = false,
}: {
  title: string;
  helper: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
              {helper}
            </p>
          </div>
          <span className="rounded-md border border-[var(--color-line)] px-2 py-1 text-xs font-semibold text-[var(--color-muted)]">
            펼치기
          </span>
        </div>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function ResultPanel({
  evaluationResult,
}: {
  evaluationResult: EvaluationResult | null;
}) {
  const activeDecision = evaluationResult?.final_decision;
  const beginnerGuidance = evaluationResult
    ? buildBeginnerGuidance(evaluationResult)
    : null;
  const primaryRule = evaluationResult?.triggered_rules[0];
  const primaryIssue = primaryRule?.message ?? evaluationResult?.summary;

  return (
    <section className="glass-panel rounded-lg border border-[var(--color-line)] p-5 sm:p-6">
      <SectionIntro
        kicker="평가 결과"
        title="최종 결정"
        description="결론을 먼저 보고, 그 다음 조치와 근거를 확인할 수 있게 정리했습니다."
      />
      {evaluationResult && activeDecision ? (
        <div className="mt-5 space-y-5">
          <div
            className={`rounded-lg border border-l-4 bg-[var(--color-surface-strong)] p-5 ${DECISION_ACCENT_CLASSES[activeDecision]}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DecisionBadge decision={activeDecision} />
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                {evaluationResult.pack_info.pack_name} v{evaluationResult.pack_info.version}
              </span>
            </div>
            <h3
              className={`mt-4 text-3xl font-semibold tracking-tight ${DECISION_TEXT_CLASSES[activeDecision]}`}
            >
              {DECISION_HEADLINES[activeDecision]}
            </h3>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--color-ink)]">
              {beginnerGuidance?.canProceedNow ?? decisionMeta[activeDecision].description}
            </p>
            {primaryIssue ? (
              <div className="mt-5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  핵심 사유
                </p>
                <p className="mt-2 text-sm font-semibold leading-7 text-[var(--color-ink)]">
                  {primaryIssue}
                </p>
                {primaryRule ? (
                  <>
                    <p className="mt-2 text-xs font-semibold leading-6 text-[var(--color-muted)]">
                      관련 근거: {primaryRule.article}
                    </p>
                    {primaryRule.rationale !== primaryRule.message ? (
                      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                        {primaryRule.rationale}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryMetric
              label="발동 규칙"
              value={evaluationResult.triggered_rules.length}
              helper="결과에 영향을 준 규칙"
            />
            <SummaryMetric
              label="필수 조치"
              value={evaluationResult.required_actions.length}
              helper="운영 전 처리할 항목"
            />
            <SummaryMetric
              label="증빙 공백"
              value={evaluationResult.qualitative_review_hints.evidence_gaps.length}
              helper="추가 확인이 필요한 정보"
            />
          </div>

          {beginnerGuidance ? (
            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  비즈니스 해석
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                  {beginnerGuidance.businessMeaning}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {beginnerGuidance.primaryReason}
                </p>
                <p className="mt-3 border-t border-[var(--color-line)] pt-3 text-sm leading-7 text-[var(--color-ink)]">
                  {beginnerGuidance.legalExplanation}
                </p>
                {beginnerGuidance.supportingDetails.length ? (
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                    {beginnerGuidance.supportingDetails.map((detail) => (
                      <li key={detail} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm bg-[var(--color-accent)]" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  우선순위
                </p>
                <p className="mt-3 text-sm font-semibold leading-7 text-[var(--color-ink)]">
                  {beginnerGuidance.canProceedNow}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {beginnerGuidance.firstAction}
                </p>
                <p className="mt-3 border-t border-[var(--color-line)] pt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {beginnerGuidance.decisionImpact}
                </p>
              </div>
            </div>
          ) : null}

          <InputContextCard evaluationResult={evaluationResult} />
          <KeyReasonList evaluationResult={evaluationResult} />

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <ResultList
              title="지금 먼저 할 일"
              items={evaluationResult.next_steps}
              limit={5}
              ordered
            />
            <ResultList
              title="준비하거나 확인할 증빙"
              items={evaluationResult.qualitative_review_hints.evidence_gaps}
              emptyCopy="자동으로 식별된 핵심 증빙 공백은 없습니다."
              limit={6}
            />
          </div>

          {beginnerGuidance ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <ResultList
                title="초보자용 체크리스트"
                items={beginnerGuidance.quickChecklist}
                ordered
              />
              <ResultList
                title="누가 같이 확인하면 좋나요"
                items={[beginnerGuidance.whoShouldBeInvolved]}
              />
            </div>
          ) : null}

          <DetailDisclosure
            title="상세 설명"
            helper="전체 평가 설명을 항목별로 나누어 확인합니다."
          >
            <ExplanationBreakdown explanation={evaluationResult.explanation} />
          </DetailDisclosure>

          <DetailDisclosure
            title="법률 근거와 리뷰어 체크리스트"
            helper="담당자가 추가 검토할 때 필요한 조문과 내부 확인 항목입니다."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <ResultList
                title="법적 근거"
                items={evaluationResult.legal_basis_articles}
              />
              <ResultList
                title="리뷰어 체크리스트"
                items={evaluationResult.qualitative_review_hints.reviewer_checklist}
                emptyCopy="추가 체크리스트가 지정되지 않았습니다."
                limit={6}
              />
              {beginnerGuidance?.glossary.length ? (
                <div className="lg:col-span-2">
                  <ResultList
                    title="법률 용어 쉬운 풀이"
                    items={beginnerGuidance.glossary}
                  />
                </div>
              ) : null}
            </div>
          </DetailDisclosure>
        </div>
      ) : (
        <EmptyState
          title="평가 결과가 아직 없습니다."
          description="필수 선택을 마친 뒤 평가 실행을 누르면 최종 결정과 설명이 이 영역에 표시됩니다."
        />
      )}
    </section>
  );
}

export function ExplainabilityPanel({
  evaluationResult,
  mergePreview,
}: {
  evaluationResult: EvaluationResult | null;
  mergePreview: JsonObject | null;
}) {
  return (
    <section className="glass-panel rounded-lg border border-[var(--color-line)] p-5 sm:p-6">
      <SectionIntro
        kicker="감사 정보"
        title="근거와 입력 추적"
        description="상세 트레이스와 병합 입력은 필요할 때 펼쳐서 확인하도록 정리했습니다."
      />
      {evaluationResult ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryMetric
                label="평가 규칙"
                value={evaluationResult.evaluation_trace.evaluated_rule_count}
                helper="정책팩에서 확인한 전체 규칙"
              />
              <SummaryMetric
                label="일치 규칙"
                value={evaluationResult.evaluation_trace.matched_rule_count}
                helper="입력 조건과 맞은 규칙"
              />
            </div>
            <div className="decision-rail mt-4">
              {DECISION_ORDER.map((decision) => {
                const isActive = decision === evaluationResult.final_decision;
                return (
                  <div
                    key={decision}
                    className={`decision-rail-card ${
                      isActive ? `active ${decisionMeta[decision].className}` : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold">
                        {decisionMeta[decision].label}
                      </span>
                      {isActive ? (
                        <span className="text-xs font-semibold uppercase">
                          current
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {evaluationResult.triggered_rules.map((rule) => (
              <article
                key={rule.rule_id}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
                      {rule.article} · {rule.category}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                      {rule.title}
                    </h3>
                  </div>
                  <DecisionBadge decision={rule.decision} compact />
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {rule.rationale}
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <ResultList title="확인 사실" items={rule.matched_facts} />
                  <ResultList
                    title="추가 확인 증빙"
                    items={rule.required_evidence}
                    emptyCopy="추가 증빙 요구 없음"
                  />
                </div>
                <DetailDisclosure
                  title="참조와 리뷰어 메모"
                  helper="세부 참조가 필요한 경우만 펼쳐서 확인합니다."
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    <ResultList
                      title="리뷰어 메모"
                      items={rule.reviewer_notes}
                      emptyCopy="별도 리뷰어 메모 없음"
                    />
                    <ResultList
                      title="참고 참조"
                      items={rule.references}
                      emptyCopy="추가 참조 없음"
                    />
                  </div>
                </DetailDisclosure>
              </article>
            ))}
          </div>

          <DetailDisclosure
            title="Evaluation Trace"
            helper="규칙별 판단 경로를 확인합니다."
          >
            <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
              {evaluationResult.evaluation_trace.rule_results.map((trace) => (
                <div
                  key={trace.rule_id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {trace.title}
                    </p>
                    <span className="text-xs text-[var(--color-muted)]">
                      {trace.matched ? "matched" : "not matched"}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-[var(--color-muted)]">
                    {trace.reasoning.map((item) => (
                      <li key={`${trace.rule_id}-${item}`}>- {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </DetailDisclosure>

          <DetailDisclosure
            title="Merged Input Preview"
            helper="평가 엔진에 전달된 최종 입력값입니다."
          >
            <pre className="code-block max-h-[320px] overflow-auto rounded-lg p-4 text-sm leading-6 text-[var(--color-ink)]">
              {formatJson(evaluationResult.merged_input)}
            </pre>
          </DetailDisclosure>
        </div>
      ) : mergePreview ? (
        <div className="mt-5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            Merge Preview
          </p>
          <pre className="code-block mt-4 max-h-[360px] overflow-auto rounded-lg p-4 text-sm leading-6 text-[var(--color-ink)]">
            {formatJson(mergePreview)}
          </pre>
        </div>
      ) : (
        <EmptyState
          title="감사 정보가 아직 없습니다."
          description="병합 미리보기 또는 평가 실행을 누르면 병합 결과와 규칙 트레이스가 여기에 표시됩니다."
        />
      )}
    </section>
  );
}
