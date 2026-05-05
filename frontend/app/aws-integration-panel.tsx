"use client";

import { useState } from "react";

import { useAwsIntegration } from "./context/aws-integration-context";
import { buildErrorMessage, fetchJson, formatJson } from "./workspace-runtime";
import type {
  AwsConnectionCompleteResponse,
  AwsConnectionStartResponse,
  AwsS3CheckResponse,
  JsonObject,
} from "./workspace-types";
import { ActionButton, ErrorBanner, TextList } from "./workspace-ui";

const DEFAULT_AWS_CONSOLE_REGION = "ap-northeast-2";

const technicalFields = [
  "current_region",
  "encryption_at_rest",
  "encryption_in_transit",
  "access_control_in_place",
] as const;

const businessTagFields = [
  "data_type",
  "contains_sensitive_data",
  "uses_processor",
] as const;

const manualLegalFields = [
  "legal_basis",
  "notice_provided",
  "consent_obtained",
  "transfer_exception",
  "risk_assessment",
  "dpo_review",
];

const fieldLabels: Record<string, string> = {
  current_region: "현재 리전",
  encryption_at_rest: "저장 시 암호화",
  encryption_in_transit: "전송 시 암호화",
  access_control_in_place: "Public Access Block",
  data_type: "데이터 유형",
  contains_sensitive_data: "민감정보 포함 여부",
  uses_processor: "외부 처리자 사용 여부",
  legal_basis: "적법근거",
  notice_provided: "고지 제공",
  consent_obtained: "동의 확보",
  transfer_exception: "이전 예외",
  risk_assessment: "위험평가",
  dpo_review: "DPO/개인정보 담당자 검토",
};

function valueLabel(value: unknown) {
  if (value === true) {
    return "true";
  }
  if (value === false) {
    return "false";
  }
  if (value === null || value === undefined || value === "") {
    return "unknown";
  }
  return String(value);
}

function isKnownValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function formatCheckedAt(value: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNormalizedCloudData(result: AwsS3CheckResponse) {
  return result.normalized_cloud_data ?? result.normalized_aws_data;
}

function ResultCards({ result }: { result: AwsS3CheckResponse }) {
  const normalized = getNormalizedCloudData(result);
  const businessMissing = businessTagFields.filter(
    (field) => !isKnownValue(normalized[field]),
  );

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-[var(--color-success)] bg-[var(--color-success-soft)] p-4 lg:col-span-2">
        <p className="text-sm font-semibold text-[var(--color-success)]">
          AWS 연결/버킷 조회 성공
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          S3에서 확인 가능한 기술 설정은 자동 수집했습니다.
          {businessMissing.length > 0
            ? " 다만 일부 업무/데이터 속성은 S3 태그가 없어 수동 확인이 필요합니다."
            : " S3 태그 기반 업무/데이터 속성도 확인되었습니다."}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--color-line)] bg-white p-4">
        <p className="text-sm font-semibold text-[var(--color-ink)]">
          AWS에서 자동 확인된 기술 설정
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-muted)]">
          {technicalFields.map((field) => {
            const value = normalized[field];
            const known = isKnownValue(value);
            return (
              <li key={field} className="flex items-start gap-2">
                <span
                  className={
                    known && value !== false
                      ? "font-semibold text-[var(--color-success)]"
                      : "font-semibold text-[var(--color-warning)]"
                  }
                >
                  {known && value !== false ? "확인됨" : "확인 필요"}
                </span>
                <span>
                  <span className="font-semibold text-[var(--color-ink)]">
                    {fieldLabels[field]}
                  </span>
                  : {valueLabel(value)}
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                    {known
                      ? value === false
                        ? "AWS API에서 확인됨 · 권장 기준 보완 필요"
                        : "AWS API에서 확인됨"
                      : "AWS에서 자동 확인 불가"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-lg border border-[var(--color-line)] bg-white p-4">
        <p className="text-sm font-semibold text-[var(--color-ink)]">
          태그 기반으로 확인된 업무/데이터 속성
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-muted)]">
          {businessTagFields.map((field) => {
            const value = normalized[field];
            const known = isKnownValue(value);
            return (
              <li key={field} className="flex items-start gap-2">
                <span
                  className={
                    known
                      ? "font-semibold text-[var(--color-success)]"
                      : "font-semibold text-[var(--color-warning)]"
                  }
                >
                  {known ? "태그 확인" : "수동 필요"}
                </span>
                <span>
                  <span className="font-semibold text-[var(--color-ink)]">
                    {fieldLabels[field]}
                  </span>
                  : {valueLabel(value)}
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                    {known
                      ? "S3 태그에서 확인됨"
                      : "태그 없음 · 수동 확인 필요"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <TextList
        title="사람이 직접 확인해야 하는 법적 판단 항목"
        items={manualLegalFields.map((field) => fieldLabels[field])}
        compact
      />

      <div className="space-y-4">
        <TextList
          title="수동 확인 또는 보완 필요"
          items={result.missing_items}
          emptyCopy="현재 응답 기준으로 부족한 항목이 없습니다."
          compact
        />
        <TextList
          title="설명"
          items={result.warnings}
          emptyCopy="추가 설명이 없습니다."
          compact
        />
      </div>

      <div className="rounded-lg border border-[var(--color-line)] bg-white p-4 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            normalized_cloud_data
          </p>
          <span className="rounded-full bg-[var(--color-success-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
            현재 세션 입력값에 반영됨
          </span>
        </div>
        <pre className="code-block mt-3 max-h-64 overflow-auto rounded-lg p-3 text-xs leading-5">
          {formatJson(normalized)}
        </pre>
      </div>
    </div>
  );
}

export function AwsIntegrationPanel({
  onApply,
  onClearAppliedValues,
}: {
  onApply: (normalized: JsonObject) => void;
  onClearAppliedValues?: () => void;
}) {
  const aws = useAwsIntegration();
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isApplyPreviewOpen, setIsApplyPreviewOpen] = useState(false);
  const connectionId = aws.startResult?.connection_id;
  const roleConnected = aws.connectionResult?.status === "connected";

  async function withAction(action: string, task: () => Promise<void>) {
    aws.setActiveAction(action);
    aws.setErrorMessage(null);
    try {
      await task();
    } catch (error) {
      aws.setErrorMessage(buildErrorMessage(error));
    } finally {
      aws.setActiveAction(null);
    }
  }

  function updateFromResult(
    result: AwsS3CheckResponse,
    mode: "access_key" | "iam_role",
    bucketName: string,
  ) {
    const normalized = getNormalizedCloudData(result);
    aws.setLastCheckResult(result);
    aws.setDiscoveredValues(normalized);
    aws.setMissingItems(result.missing_items);
    aws.setWarnings(result.warnings);
    aws.setBucketName(bucketName);
    aws.setRegion(String(normalized.current_region ?? ""));
    aws.setConnectionMode(mode);
    aws.setIsAwsConnected(true);
    aws.setLastCheckedAt(new Date().toISOString());
    aws.setIsPanelOpen(false);
    onApply(normalized);
  }

  function knownTagPayload() {
    const normalized = aws.lastCheckResult
      ? getNormalizedCloudData(aws.lastCheckResult)
      : undefined;
    return {
      data_type:
        typeof normalized?.data_type === "string" && normalized.data_type
          ? normalized.data_type
          : undefined,
      contains_sensitive_data:
        typeof normalized?.contains_sensitive_data === "boolean"
          ? normalized.contains_sensitive_data
          : undefined,
      uses_processor:
        typeof normalized?.uses_processor === "boolean"
          ? normalized.uses_processor
          : undefined,
    };
  }

  function requireKeyInputs() {
    if (!aws.accessKeyId.trim() || !aws.secretAccessKey.trim()) {
      throw new Error("Access Key ID와 Secret Access Key를 입력하세요.");
    }
    if (!aws.bucketName.trim()) {
      throw new Error("검사할 S3 Bucket Name을 입력하세요.");
    }
  }

  async function checkWithKeys() {
    requireKeyInputs();
    const response = await fetchJson<AwsS3CheckResponse>(
      "/api/v1/cloud-discovery/aws/s3/check-with-keys",
      {
        method: "POST",
        body: JSON.stringify({
          access_key_id: aws.accessKeyId.trim(),
          secret_access_key: aws.secretAccessKey,
          session_token: aws.sessionToken.trim() || null,
          bucket_name: aws.bucketName.trim(),
        }),
      },
    );
    updateFromResult(response, "access_key", aws.bucketName.trim());
  }

  async function applyWithKeys() {
    requireKeyInputs();
    const response = await fetchJson<AwsS3CheckResponse>(
      "/api/v1/cloud-discovery/aws/s3/apply-with-keys",
      {
        method: "POST",
        body: JSON.stringify({
          access_key_id: aws.accessKeyId.trim(),
          secret_access_key: aws.secretAccessKey,
          session_token: aws.sessionToken.trim() || null,
          bucket_name: aws.bucketName.trim(),
          ...knownTagPayload(),
        }),
      },
    );
    updateFromResult(response, "access_key", aws.bucketName.trim());
  }

  async function startRoleConnection() {
    const response = await fetchJson<AwsConnectionStartResponse>(
      "/api/v1/cloud-connections/aws/start",
      {
        method: "POST",
        body: JSON.stringify({
          connection_name: aws.connectionName,
          region: DEFAULT_AWS_CONSOLE_REGION,
        }),
      },
    );
    aws.setStartResult(response);
    aws.setConnectionResult(null);
    aws.setLastCheckResult(null);
  }

  async function completeRoleConnection() {
    if (!connectionId) {
      throw new Error("AWS 연결 시작을 먼저 실행하세요.");
    }
    if (!aws.roleArn.trim()) {
      throw new Error("CloudFormation 출력의 Role ARN을 입력하세요.");
    }
    const response = await fetchJson<AwsConnectionCompleteResponse>(
      "/api/v1/cloud-connections/aws/complete",
      {
        method: "POST",
        body: JSON.stringify({
          connection_id: connectionId,
          role_arn: aws.roleArn.trim(),
        }),
      },
    );
    aws.setConnectionResult(response);
  }

  async function checkWithRole() {
    if (!connectionId || !roleConnected) {
      throw new Error("AWS 연결 확인을 먼저 완료하세요.");
    }
    if (!aws.bucketName.trim()) {
      throw new Error("검사할 S3 Bucket Name을 입력하세요.");
    }
    const response = await fetchJson<AwsS3CheckResponse>(
      "/api/v1/cloud-discovery/aws/s3/check",
      {
        method: "POST",
        body: JSON.stringify({
          connection_id: connectionId,
          bucket_name: aws.bucketName.trim(),
        }),
      },
    );
    updateFromResult(response, "iam_role", aws.bucketName.trim());
  }

  async function applyWithRole() {
    if (!connectionId || !roleConnected) {
      throw new Error("AWS 연결 확인을 먼저 완료하세요.");
    }
    if (!aws.bucketName.trim()) {
      throw new Error("설정을 적용할 S3 Bucket Name을 입력하세요.");
    }
    const response = await fetchJson<AwsS3CheckResponse>(
      "/api/v1/cloud-discovery/aws/s3/apply-recommended-settings",
      {
        method: "POST",
        body: JSON.stringify({
          connection_id: connectionId,
          bucket_name: aws.bucketName.trim(),
          ...knownTagPayload(),
        }),
      },
    );
    updateFromResult(response, "iam_role", aws.bucketName.trim());
  }

  function clearAwsOnly() {
    aws.resetAwsIntegration();
    setIsClearDialogOpen(false);
  }

  function clearAwsAndAppliedValues() {
    onClearAppliedValues?.();
    aws.resetAwsIntegration();
    setIsClearDialogOpen(false);
  }

  async function rerunCheck() {
    if (aws.connectionMode === "access_key") {
      await checkWithKeys();
      return;
    }
    if (aws.connectionMode === "iam_role") {
      await checkWithRole();
    }
  }

  async function applyRecommendedSettings() {
    if (aws.connectionMode === "access_key") {
      await applyWithKeys();
      return;
    }
    if (aws.connectionMode === "iam_role") {
      await applyWithRole();
    }
  }

  async function confirmApplyRecommendedSettings() {
    setIsApplyPreviewOpen(false);
    await withAction("apply", applyRecommendedSettings);
  }

  const clearDialog = isClearDialogOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg border border-[var(--color-line)] bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">
          AWS 연동 정보 지우기
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          현재 세션의 AWS 연동 상태를 지웁니다. 이미 평가 입력값에 반영된 AWS 수집값도 함께 초기화할 수 있습니다.
        </p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={clearAwsOnly}
            className="rounded-lg border border-[var(--color-line)] px-4 py-3 text-left text-sm font-semibold text-[var(--color-ink)] hover:border-[var(--color-line-strong)]"
          >
            연동 정보만 지우기
          </button>
          <button
            type="button"
            onClick={clearAwsAndAppliedValues}
            className="rounded-lg border border-[var(--color-warning)] bg-[var(--color-warning-soft)] px-4 py-3 text-left text-sm font-semibold text-[var(--color-warning)]"
          >
            연동 정보와 반영된 평가값 모두 지우기
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsClearDialogOpen(false)}
            className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)]"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const applyPreviewDialog = isApplyPreviewOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-lg border border-[var(--color-warning)] bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--color-warning)]">
          버킷 설정을 변경합니다
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          이 작업은 실제 S3 버킷의 기본 암호화, Public Access Block, HTTPS 강제 bucket policy를 변경할 수 있습니다. 운영 버킷에서는 변경 범위와 권한을 먼저 확인하세요.
        </p>
        <TextList
          title="변경 또는 확인 예정 항목"
          items={[
            "기본 서버 측 암호화 설정",
            "Public Access Block 설정",
            "aws:SecureTransport=false 요청 거부 bucket policy",
            "이미 알고 있는 data_type, contains_sensitive_data, uses_processor 태그 값",
          ]}
          compact
        />
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <ActionButton
            label="취소"
            onClick={() => setIsApplyPreviewOpen(false)}
            variant="secondary"
          />
          <ActionButton
            label="버킷 설정 변경"
            onClick={() => void confirmApplyRecommendedSettings()}
            active={aws.activeAction === "apply"}
            disabled={aws.activeAction !== null}
          />
        </div>
      </div>
    </div>
  ) : null;

  if (!aws.isPanelOpen) {
    return (
      <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
              AWS Integration
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
              {aws.isAwsConnected ? "AWS 연동됨" : "AWS 연동 상태: 연결 안 됨"}
            </h2>
            {aws.isAwsConnected ? (
              <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--color-muted)] sm:grid-cols-2">
                <p>방식: {aws.connectionMode === "access_key" ? "Access Key" : "IAM Role"}</p>
                <p>Bucket: {aws.bucketName || "-"}</p>
                <p>Region: {aws.region || "-"}</p>
                <p>마지막 검사: {formatCheckedAt(aws.lastCheckedAt)}</p>
                <p>저장 시 암호화: {valueLabel(aws.discoveredValues.encryption_at_rest)}</p>
                <p>전송 시 암호화: {valueLabel(aws.discoveredValues.encryption_in_transit)}</p>
                <p>접근 제어: {valueLabel(aws.discoveredValues.access_control_in_place)}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                S3 버킷의 기술 설정은 AWS API로 확인하고, 업무/데이터 속성은 표준 S3 태그가 있을 때만 자동 반영합니다.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {aws.isAwsConnected ? (
              <>
                <ActionButton
                  label="다시 검사"
                  onClick={() => void withAction("rerun", rerunCheck)}
                  active={aws.activeAction === "rerun"}
                  disabled={aws.activeAction !== null}
                  variant="secondary"
                />
                <ActionButton
                  label="AWS 결과 보기"
                  onClick={() => aws.setIsPanelOpen(true)}
                  disabled={aws.activeAction !== null || !aws.lastCheckResult}
                  variant="secondary"
                />
                <ActionButton
                  label="권장 설정 적용"
                  onClick={() => setIsApplyPreviewOpen(true)}
                  active={aws.activeAction === "apply"}
                  disabled={aws.activeAction !== null}
                  variant="secondary"
                />
                <ActionButton
                  label="연결 변경"
                  onClick={() => aws.setIsPanelOpen(true)}
                  disabled={aws.activeAction !== null}
                />
                <ActionButton
                  label="AWS 입력값 지우기"
                  onClick={() => setIsClearDialogOpen(true)}
                  disabled={aws.activeAction !== null}
                  variant="secondary"
                />
              </>
            ) : (
              <ActionButton
                label="AWS 연동하기"
                onClick={() => aws.setIsPanelOpen(true)}
              />
            )}
          </div>
        </div>
        {aws.errorMessage ? <ErrorBanner message={aws.errorMessage} /> : null}
        {clearDialog}
        {applyPreviewDialog}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
          AWS Integration
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
          AWS S3 버킷 검사
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          일반 상용 S3 버킷에서도 리전, 암호화, Public Access Block, HTTPS 강제 정책은 AWS API로 확인합니다. data_type, contains_sensitive_data, uses_processor는 S3 태그가 없으면 수동 입력으로 남깁니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ["keys", "Access Key"],
          ["role", "IAM Role"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              aws.setPanelMode(value === "keys" ? "keys" : "role");
              aws.setErrorMessage(null);
            }}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              aws.panelMode === value
                ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                : "border-[var(--color-line)] bg-white text-[var(--color-muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {aws.panelMode === "keys" ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[var(--color-ink)]">
              Access Key ID
              <input
                value={aws.accessKeyId}
                onChange={(event) => aws.setAccessKeyId(event.target.value)}
                autoComplete="off"
                className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-ink)]">
              Secret Access Key
              <input
                type="password"
                value={aws.secretAccessKey}
                onChange={(event) => aws.setSecretAccessKey(event.target.value)}
                autoComplete="off"
                className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-ink)] sm:col-span-2">
              Session Token optional
              <textarea
                value={aws.sessionToken}
                onChange={(event) => aws.setSessionToken(event.target.value)}
                rows={3}
                autoComplete="off"
                className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-ink)]">
              S3 Bucket Name
              <input
                value={aws.bucketName}
                onChange={(event) => aws.setBucketName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              label="버킷 검사"
              onClick={() => void withAction("check-keys", checkWithKeys)}
              active={aws.activeAction === "check-keys"}
              disabled={aws.activeAction !== null}
            />
            <ActionButton
              label="권장 설정 적용"
              onClick={() => setIsApplyPreviewOpen(true)}
              active={aws.activeAction === "apply"}
              disabled={aws.activeAction !== null}
              variant="secondary"
            />
            <ActionButton
              label="AWS 입력값 지우기"
              onClick={() => setIsClearDialogOpen(true)}
              disabled={aws.activeAction !== null}
              variant="secondary"
            />
            <ActionButton
              label="닫기"
              onClick={() => aws.setIsPanelOpen(false)}
              disabled={aws.activeAction !== null}
              variant="secondary"
            />
          </div>
        </div>
      ) : null}

      {aws.panelMode === "role" ? (
        <div className="mt-5 space-y-5">
          <label className="block text-sm font-semibold text-[var(--color-ink)]">
            연결 이름
            <input
              value={aws.connectionName}
              onChange={(event) => aws.setConnectionName(event.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <ActionButton
              label="AWS 연결 시작"
              onClick={() => void withAction("start-role", startRoleConnection)}
              active={aws.activeAction === "start-role"}
              disabled={aws.activeAction !== null}
            />
            {aws.startResult ? (
              <a
                href={aws.startResult.cloudformation_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-line-strong)]"
              >
                AWS Console에서 스택 생성
              </a>
            ) : null}
          </div>
          {aws.startResult ? (
            <div className="rounded-lg border border-[var(--color-line)] bg-white p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                ExternalId
              </p>
              <p className="mt-2 break-all rounded-md bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-muted)]">
                {aws.startResult.external_id}
              </p>
              <label className="mt-4 block text-sm font-semibold text-[var(--color-ink)]">
                Role ARN
                <input
                  value={aws.roleArn}
                  onChange={(event) => aws.setRoleArn(event.target.value)}
                  placeholder="arn:aws:iam::123456789012:role/BorderCheckerRole"
                  className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </label>
              <div className="mt-4">
                <ActionButton
                  label="연결 확인"
                  onClick={() =>
                    void withAction("complete-role", completeRoleConnection)
                  }
                  active={aws.activeAction === "complete-role"}
                  disabled={aws.activeAction !== null}
                />
              </div>
            </div>
          ) : null}
          {roleConnected ? (
            <label className="block text-sm font-semibold text-[var(--color-ink)]">
              S3 Bucket Name
              <input
                value={aws.bucketName}
                onChange={(event) => aws.setBucketName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          ) : null}
          {roleConnected ? (
            <div className="flex flex-wrap gap-3">
              <ActionButton
                label="버킷 검사"
                onClick={() => void withAction("check-role", checkWithRole)}
                active={aws.activeAction === "check-role"}
                disabled={aws.activeAction !== null}
              />
              <ActionButton
                label="권장 설정 적용"
                onClick={() => setIsApplyPreviewOpen(true)}
                active={aws.activeAction === "apply"}
                disabled={aws.activeAction !== null}
                variant="secondary"
              />
              <ActionButton
                label="닫기"
                onClick={() => aws.setIsPanelOpen(false)}
                disabled={aws.activeAction !== null}
                variant="secondary"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {aws.errorMessage ? <ErrorBanner message={aws.errorMessage} /> : null}
      {aws.lastCheckResult ? <ResultCards result={aws.lastCheckResult} /> : null}
      {clearDialog}
      {applyPreviewDialog}
    </section>
  );
}
