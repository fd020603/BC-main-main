"use client";

import { useState } from "react";

import { buildErrorMessage, fetchJson, formatJson } from "./workspace-runtime";
import type { CloudDiscoveryResponse, JsonObject } from "./workspace-types";
import { ActionButton, ErrorBanner, TextList } from "./workspace-ui";

type Provider = "aws" | "azure";
type DiscoveryMode = "live" | "mock";

function getNormalizedCloudData(result: CloudDiscoveryResponse) {
  return result.normalized_cloud_data ?? result.normalized_aws_data;
}

function boolToState(value: unknown) {
  if (value === true) {
    return "true";
  }
  if (value === false) {
    return "false";
  }
  return "unknown";
}

export function applyCloudDataToFormState(
  current: Record<string, string>,
  normalized: JsonObject,
) {
  const next = { ...current };

  for (const field of [
    "current_region",
    "data_type",
  ]) {
    const value = normalized[field];
    if (typeof value === "string" && value) {
      next[field] = value;
    }
  }

  for (const field of [
    "encryption_at_rest",
    "encryption_in_transit",
    "access_control_in_place",
    "contains_sensitive_data",
    "uses_processor",
    "contains_article6_sensitive_data",
    "uses_commissioned_processor",
  ]) {
    if (field in normalized && normalized[field] !== null) {
      next[field] = boolToState(normalized[field]);
    }
  }

  return next;
}

export function CloudDiscoveryPanel({
  onApply,
}: {
  onApply: (normalized: JsonObject) => void;
}) {
  const [provider, setProvider] = useState<Provider>("aws");
  const [mode, setMode] = useState<DiscoveryMode>("live");
  const [resourceId, setResourceId] = useState("");
  const [region, setRegion] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [resourceGroup, setResourceGroup] = useState("");
  const [result, setResult] = useState<CloudDiscoveryResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const resourceType = provider === "aws" ? "s3_bucket" : "storage_account";

  async function runDiscovery() {
    setIsBusy(true);
    setErrorMessage(null);

    try {
      if (!resourceId.trim()) {
        throw new Error(
          provider === "aws"
            ? "S3 bucket name을 입력해 주세요."
            : "Storage Account name을 입력해 주세요.",
        );
      }

      const endpoint = provider === "aws" ? "/api/v1/cloud-discovery/aws" : "/api/v1/cloud-discovery/azure";
      const response = await fetchJson<CloudDiscoveryResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify({
          resource_type: resourceType,
          resource_id: resourceId.trim(),
          region: provider === "aws" ? region || null : undefined,
          subscription_id: provider === "azure" ? subscriptionId || null : undefined,
          resource_group: provider === "azure" ? resourceGroup || null : undefined,
          mode,
        }),
      });
      setResult(response);
      onApply(getNormalizedCloudData(response));
    } catch (error) {
      setErrorMessage(buildErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Cloud Discovery
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--color-ink)]">
            클라우드에서 기술 입력값 가져오기
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            ID만 브라우저에서 보내고 실제 인증정보는 백엔드 환경변수나 서버 AWS/Azure credential에서 읽습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-[var(--color-line)] bg-white p-1">
            {(["aws", "azure"] as Provider[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setProvider(item)}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  provider === item
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-muted)]"
                }`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-[var(--color-line)] bg-white p-1">
            {(["live", "mock"] as DiscoveryMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  mode === item
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-muted)]"
                }`}
              >
                {item === "live" ? "실제 조회" : "Mock"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-[var(--color-ink)]">
          Resource type
          <input
            value={provider === "aws" ? "AWS S3 bucket" : "Azure Storage Account"}
            readOnly
            className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-muted)]"
          />
        </label>
        <label className="block text-sm font-semibold text-[var(--color-ink)]">
          Resource id
          <input
            value={resourceId}
            onChange={(event) => setResourceId(event.target.value)}
            placeholder={provider === "aws" ? "bucket-name" : "storage-account-name"}
            className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
        </label>
        {provider === "aws" ? (
          <label className="block text-sm font-semibold text-[var(--color-ink)]">
            Region hint
            <input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="ap-northeast-2"
              className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>
        ) : (
          <>
            <label className="block text-sm font-semibold text-[var(--color-ink)]">
              Subscription id
              <input
                value={subscriptionId}
                onChange={(event) => setSubscriptionId(event.target.value)}
                placeholder="server-side credential only"
                className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
            <label className="block text-sm font-semibold text-[var(--color-ink)]">
              Resource group
              <input
                value={resourceGroup}
                onChange={(event) => setResourceGroup(event.target.value)}
                placeholder="rg-data-prod"
                className="mt-2 w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <ActionButton
          label={mode === "live" ? "온라인에서 값 가져오기" : "Mock 값 정규화"}
          onClick={() => void runDiscovery()}
          active={isBusy}
          disabled={isBusy}
        />
        {result ? (
          <ActionButton
            label="정규화 값 다시 반영"
            onClick={() => onApply(getNormalizedCloudData(result))}
            variant="secondary"
          />
        ) : null}
      </div>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {result ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[var(--color-line)] bg-white p-4">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              normalized_cloud_data
            </p>
            <pre className="code-block mt-3 max-h-64 overflow-auto rounded-lg p-3 text-xs leading-5">
              {formatJson(getNormalizedCloudData(result))}
            </pre>
          </div>
          <div className="space-y-4">
            <TextList
              title="Warnings"
              items={result.warnings}
              emptyCopy="현재 경고가 없습니다."
              compact
            />
            <div className="rounded-lg border border-[var(--color-line)] bg-white p-4">
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Evidence
              </p>
              <ul className="mt-3 space-y-2 text-xs leading-5 text-[var(--color-muted)]">
                {result.evidence.map((item) => (
                  <li key={`${item.field}-${item.source}`}>
                    <span className="font-semibold text-[var(--color-ink)]">
                      {item.field}
                    </span>
                    : {String(item.value)} / {item.confidence} / {item.source}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
