"use client";

import { useState } from "react";

import { buildErrorMessage, fetchJson, formatJson } from "./workspace-runtime";
import type {
  AwsConnectionCompleteResponse,
  AwsConnectionStartResponse,
  AwsS3CheckResponse,
  JsonObject,
} from "./workspace-types";
import { ActionButton, ErrorBanner, TextList } from "./workspace-ui";
import { useAwsIntegration } from "./context/aws-integration-context";

const DEFAULT_AWS_CONSOLE_REGION = "ap-northeast-2";

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

function nullExplanation(field: string, value: unknown) {
  if (value !== null && value !== undefined && value !== "") {
    return "";
  }
  if (field === "contains_sensitive_data") {
    return "contains_sensitive_data는 AWS가 자동 판별하는 값이 아니라 S3 태그에서 가져오는 값입니다.";
  }
  if (field === "data_type") {
    return "data_type은 S3 태그에서 가져오는 값입니다.";
  }
  if (field === "uses_processor") {
    return "uses_processor는 S3 태그에서 가져오는 값입니다.";
  }
  return "";
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
  const rows = [
    ["current_region", normalized.current_region],
    ["encryption_at_rest", normalized.encryption_at_rest],
    ["encryption_in_transit", normalized.encryption_in_transit],
    ["access_control_in_place", normalized.access_control_in_place],
    ["data_type", normalized.data_type],
    ["contains_sensitive_data", normalized.contains_sensitive_data],
    ["uses_processor", normalized.uses_processor],
  ];

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-[var(--color-line)] bg-white p-4">
        <p className="text-sm font-semibold text-[var(--color-ink)]">
          AWS 검사 결과
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-muted)]">
          {rows.map(([field, value]) => {
            const fieldName = String(field);
            const missing = result.missing_items.includes(fieldName);
            const explanation = nullExplanation(fieldName, value);
            return (
              <li key={fieldName} className="flex items-start gap-2">
                <span
                  className={
                    missing
                      ? "font-semibold text-[var(--color-warning)]"
                      : "font-semibold text-[var(--color-success)]"
                  }
                >
                  {missing ? "주의" : "✓"}
                </span>
                <span>
                  <span className="font-semibold text-[var(--color-ink)]">
                    {fieldName}
                  </span>
                  : {valueLabel(value)}
                  {explanation ? (
                    <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                      {explanation}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="space-y-4">
        <TextList
          title="누락 또는 확인 필요"
          items={result.missing_items}
          emptyCopy="권장 설정이 확인되었습니다."
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
            이미 평가 입력값에 반영됨
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
      throw new Error("Access Key ID와 Secret Access Key를 입력해 주세요.");
    }
    if (!aws.bucketName.trim()) {
      throw new Error("검사할 S3 Bucket Name을 입력해 주세요.");
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
      throw new Error("AWS 연결 시작을 먼저 눌러 주세요.");
    }
    if (!aws.roleArn.trim()) {
      throw new Error("CloudFormation 출력의 Role ARN을 입력해 주세요.");
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
      throw new Error("AWS 연결 확인을 먼저 완료해 주세요.");
    }
    if (!aws.bucketName.trim()) {
      throw new Error("검사할 S3 Bucket Name을 입력해 주세요.");
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
      throw new Error("AWS 연결 확인을 먼저 완료해 주세요.");
    }
    if (!aws.bucketName.trim()) {
      throw new Error("설정을 적용할 S3 Bucket Name을 입력해 주세요.");
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
          Access Key와 현재 AWS 연동 상태를 지웁니다. 이미 평가 입력값에 반영된 AWS 수집값도 함께 초기화할 수 있습니다.
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
      <div className="w-full max-w-lg rounded-lg border border-[var(--color-line)] bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">
          권장 설정 적용 미리보기
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          아래 항목을 기준으로 S3 버킷 설정을 변경합니다. 버킷 암호화, Public Access Block, HTTPS 전송 정책, 기존에 확인된 태그 값이 적용 대상입니다.
        </p>
        <TextList
          title="변경 또는 확인 예정 항목"
          items={
            aws.missingItems.length > 0
              ? aws.missingItems
              : ["권장 보안 설정 재확인"]
          }
          compact
        />
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <ActionButton
            label="취소"
            onClick={() => setIsApplyPreviewOpen(false)}
            variant="secondary"
          />
          <ActionButton
            label="선택한 설정 적용"
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
                <p>방식: {aws.connectionMode === "access_key" ? "Access Key 간편 연결" : "IAM Role 보안 연결"}</p>
                <p>Bucket: {aws.bucketName || "-"}</p>
                <p>Region: {aws.region || "-"}</p>
                <p>마지막 검사 시간: {formatCheckedAt(aws.lastCheckedAt)}</p>
                <p>저장 시 암호화: {valueLabel(aws.discoveredValues.encryption_at_rest)}</p>
                <p>전송 중 암호화: {valueLabel(aws.discoveredValues.encryption_in_transit)}</p>
                <p>접근 제어: {valueLabel(aws.discoveredValues.access_control_in_place)}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                AWS에서 S3 보안 설정을 한 번 가져오면 평가 단계 전체에 자동 반영됩니다.
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
                  label="권장 설정 적용 미리보기"
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
                  label="키 입력값 지우기"
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
          AWS 온라인 연동
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          입력한 AWS 키는 저장하지 않고 현재 요청 처리에만 사용됩니다. 페이지를 새로고침하면 다시 입력해야 합니다. 운영 환경에서는 IAM Role 기반 보안 연결을 권장합니다.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {[
          ["keys", "간편 연결 - Access Key"],
          ["role", "보안 연결 - IAM Role"],
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
              label="버킷 검사하기"
              onClick={() => void withAction("check-keys", checkWithKeys)}
              active={aws.activeAction === "check-keys"}
              disabled={aws.activeAction !== null}
            />
            <ActionButton
              label="권장 설정 적용 미리보기"
              onClick={() => setIsApplyPreviewOpen(true)}
              active={aws.activeAction === "apply"}
              disabled={aws.activeAction !== null}
              variant="secondary"
            />
            <ActionButton
              label="키 입력값 지우기"
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
                label="버킷 검사하기"
                onClick={() => void withAction("check-role", checkWithRole)}
                active={aws.activeAction === "check-role"}
                disabled={aws.activeAction !== null}
              />
              <ActionButton
                label="권장 설정 적용 미리보기"
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
      {aws.lastCheckResult ? (
        <ResultCards result={aws.lastCheckResult} />
      ) : null}
      {clearDialog}
      {applyPreviewDialog}
    </section>
  );
}
