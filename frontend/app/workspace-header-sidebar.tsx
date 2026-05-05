import {
  dataTypeOptions,
  datasetOptions,
  lawfulBasisOptions,
  subjectRegionOptions,
} from "./workspace-form-config";
import { getOptionLabel } from "./workspace-runtime";
import type { FormState, PackDetail } from "./workspace-types";
import {
  ActionButton,
  EmptyState,
  ErrorBanner,
  InlineList,
  MetricCard,
  SectionIntro,
  StatusBanner,
  SummaryRow,
  TextList,
} from "./workspace-ui";

export function HeroPanel({
  packDetail,
  isStorageReady,
  missingRequiredCount,
  unresolvedSelections,
  safeguardsSelected,
}: {
  packDetail: PackDetail | null;
  isStorageReady: boolean;
  missingRequiredCount: number;
  unresolvedSelections: number;
  safeguardsSelected: boolean;
}) {
  return (
    <section className="glass-panel relative overflow-hidden rounded-[34px] border border-[var(--color-line)] px-6 py-7 sm:px-8 sm:py-8">
      <div className="hero-orb hero-orb-primary" />
      <div className="hero-orb hero-orb-secondary" />
      <div className="hero-orb hero-orb-tertiary" />
      <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="reveal-up space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Border Checker
            </span>
            <span className="rounded-full border border-[var(--color-line)] bg-[rgba(255,253,248,0.72)] px-3 py-1 text-xs text-[var(--color-muted)]">
              Cross-border Review Workspace
            </span>
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-5xl">
              국외 이전 검토를 발표용 데모에 맞게 빠르고 깔끔하게 정리하는
              선택형 컴플라이언스 워크스페이스
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[var(--color-muted)] sm:text-base">
              사용자가 직접 JSON을 다루지 않아도 되도록 핵심 검토 항목을
              드롭다운과 선택형 컨트롤로 정리했습니다. 입력값은 브라우저에
              유지되고, 실제 백엔드 API로 병합과 평가를 실행합니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="결정 모델"
              value="deny > manual_review > condition_allow > allow"
            />
            <MetricCard label="입력 방식" value="선택형 폼 + 자동 저장" />
            <MetricCard
              label="정책 팩"
              value={
                packDetail
                  ? `${packDetail.pack_name} v${packDetail.version}`
                  : "팩 정보 로딩 중"
              }
            />
          </div>
        </div>
        <div className="reveal-up rounded-[30px] border border-[var(--color-line)] bg-[rgba(255,253,248,0.78)] p-6 backdrop-blur-sm [animation-delay:140ms]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            발표 포인트
          </p>
          <div className="mt-4 space-y-4">
            <p className="text-lg font-semibold text-[var(--color-ink)]">
              점수 없이도 왜 그런 결론이 나왔는지 설명 가능한 결과를 보여줍니다.
            </p>
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              결과 화면은 최종 결정, 발동 규칙, 법적 근거, 보완 조치, 감사용
              트레이스를 함께 보여주며 법률 자문을 대체하지 않는 선에서 현실적인
              운영 판단을 돕도록 설계되어 있습니다.
            </p>
          </div>
          <div className="mt-6 rounded-[24px] border border-[var(--color-line)] bg-white/80 p-4">
            <SummaryRow
              label="현재 저장 상태"
              value={isStorageReady ? "브라우저 자동 저장 사용 중" : "초기화 중"}
            />
            <SummaryRow label="필수 항목 잔여" value={`${missingRequiredCount}개`} />
            <SummaryRow label="미확인 선택" value={`${unresolvedSelections}개`} />
            <SummaryRow
              label="보호조치"
              value={safeguardsSelected ? "확인됨" : "미확인"}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function SidebarPanel({
  formState,
  safeguardsSelected,
  statusMessage,
  errorMessage,
  isBusy,
  activeAction,
  advisoryNotes,
  packDetail,
  onPreview,
  onEvaluate,
  onRefreshPack,
  onReset,
}: {
  formState: FormState;
  safeguardsSelected: boolean;
  statusMessage: string;
  errorMessage: string | null;
  isBusy: boolean;
  activeAction: string | null;
  advisoryNotes: string[];
  packDetail: PackDetail | null;
  onPreview: () => void;
  onEvaluate: () => void;
  onRefreshPack: () => void;
  onReset: () => void;
}) {
  return (
    <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
      <section className="glass-panel rounded-[32px] border border-[var(--color-line)] p-6">
        <SectionIntro
          kicker="실행 패널"
          title="입력 상태를 확인하고 바로 평가하세요"
          description="입력값은 유지되고, 버튼은 실제 병합 및 평가 API를 호출합니다."
        />
        <div className="mt-5 rounded-[24px] border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
          <SummaryRow
            label="데이터셋"
            value={getOptionLabel(datasetOptions, formState.dataset_name)}
          />
          <SummaryRow
            label="데이터 유형"
            value={getOptionLabel(dataTypeOptions, formState.data_type)}
          />
          <SummaryRow
            label="정보주체"
            value={getOptionLabel(subjectRegionOptions, formState.data_subject_region)}
          />
          <SummaryRow
            label="리전 흐름"
            value={
              formState.current_region && formState.target_region
                ? `${formState.current_region} -> ${formState.target_region}`
                : "미선택"
            }
          />
          <SummaryRow
            label="적법 근거"
            value={getOptionLabel(lawfulBasisOptions, formState.lawful_basis)}
          />
          <SummaryRow
            label="보호조치"
            value={safeguardsSelected ? "SCC/BCR/기타 경로 확인" : "아직 선택 없음"}
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ActionButton
            label="병합 미리보기"
            onClick={onPreview}
            active={activeAction === "merge"}
            disabled={isBusy}
          />
          <ActionButton
            label="평가 실행"
            onClick={onEvaluate}
            active={activeAction === "evaluate"}
            disabled={isBusy}
          />
          <ActionButton
            label="팩 정보 새로고침"
            onClick={onRefreshPack}
            active={activeAction === "pack"}
            disabled={isBusy}
            variant="secondary"
          />
          <ActionButton
            label="입력 초기화"
            onClick={onReset}
            disabled={isBusy}
            variant="secondary"
          />
        </div>
        <StatusBanner message={statusMessage} />
        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
        <div className="mt-5">
          <TextList
            title="실시간 점검 포인트"
            items={advisoryNotes}
            emptyCopy="현재 강조할 점검 포인트가 없습니다."
          />
        </div>
      </section>

      <section className="glass-panel rounded-[32px] border border-[var(--color-line)] p-6">
        <SectionIntro
          kicker="정책 팩"
          title="현재 화면이 사용하는 GDPR 정책 팩"
          description="버전과 범위, 결정 모델, 검토 가이드를 요약해서 표시합니다."
        />
        {packDetail ? (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="팩 이름" value={packDetail.pack_name} />
              <MetricCard
                label="버전 / 관할"
                value={`${packDetail.version} / ${packDetail.jurisdiction}`}
              />
              <MetricCard label="규칙 수" value={`${packDetail.rule_count} rules`} />
              <MetricCard
                label="결정 모델"
                value={packDetail.decision_model.precedence.join(" > ")}
              />
            </div>
            <InlineList title="카테고리" items={packDetail.covered_categories} />
            <InlineList title="지원 결정값" items={packDetail.supported_decisions} />
            <TextList title="전제" items={packDetail.assumptions} />
            <TextList title="한계" items={packDetail.limitations} />
            <TextList title="검토 가이드" items={packDetail.review_guidance} />
          </div>
        ) : (
          <EmptyState
            title="정책 팩 정보를 불러오는 중입니다."
            description="백엔드 연결이 완료되면 사용 중인 규칙 팩 정보가 표시됩니다."
          />
        )}
      </section>
    </aside>
  );
}
