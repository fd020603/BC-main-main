import {
  defaultFormState,
  formKeyLabels,
  requiredFormKeys,
} from "./workspace-form-config";
import type { FieldOption, FormState, JsonObject } from "./workspace-types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export const DATASET_TO_TYPE: Record<string, string> = {
  eu_customer_profiles: "customer_profiles",
  eu_marketing_events: "analytics_events",
  eu_support_tickets: "support_tickets",
  eu_hr_records: "hr_records",
  eu_health_support_cases: "health_support_cases",
};

export const formatJson = (value: unknown) => JSON.stringify(value, null, 2);

export function buildErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "요청 처리 중 오류가 발생했습니다.";
}

export function getOptionLabel(
  options: FieldOption[],
  value: string,
  fallback = "미선택",
) {
  return options.find((option) => option.value === value)?.label ?? fallback;
}

export function toNullableBoolean(value: string): boolean | null {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

export function toRequiredBoolean(value: string, label: string): boolean {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new Error(`${label} 값을 선택해 주세요.`);
}

export function sanitizeStoredState(rawValue: string | null): FormState {
  if (!rawValue) {
    return defaultFormState;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<Record<keyof FormState, unknown>>;
    const next = { ...defaultFormState };

    for (const key of Object.keys(defaultFormState) as Array<keyof FormState>) {
      const value = parsed[key];
      if (typeof value === "string") {
        next[key] = value;
      }
    }

    return next;
  } catch {
    return defaultFormState;
  }
}

export function validateForm(formState: FormState) {
  const missingRequired = requiredFormKeys
    .filter((key) => !formState[key])
    .map((key) => formKeyLabels[key]);

  if (formState.derogation_used === "true" && !formState.derogation_type) {
    missingRequired.push(formKeyLabels.derogation_type);
  }

  return missingRequired;
}

export function buildPayload(formState: FormState) {
  const missingRequired = validateForm(formState);

  if (missingRequired.length > 0) {
    const preview = missingRequired.slice(0, 5).join(", ");
    const suffix =
      missingRequired.length > 5 ? ` 외 ${missingRequired.length - 5}개` : "";
    throw new Error(`${preview}${suffix} 항목을 먼저 선택해 주세요.`);
  }

  const awsData = {
    current_region: formState.current_region,
    encryption_at_rest: toRequiredBoolean(
      formState.encryption_at_rest,
      formKeyLabels.encryption_at_rest,
    ),
    data_type: formState.data_type,
    contains_sensitive_data: toNullableBoolean(formState.contains_sensitive_data),
    uses_processor: toNullableBoolean(formState.uses_processor),
    encryption_in_transit: toNullableBoolean(formState.encryption_in_transit),
    access_control_in_place: toNullableBoolean(formState.access_control_in_place),
  };

  const policyData: JsonObject = {
    dataset_name: formState.dataset_name,
    data_subject_region: formState.data_subject_region,
    processing_purpose_defined: toRequiredBoolean(
      formState.processing_purpose_defined,
      formKeyLabels.processing_purpose_defined,
    ),
    data_minimized: toRequiredBoolean(
      formState.data_minimized,
      formKeyLabels.data_minimized,
    ),
    retention_period_defined: toRequiredBoolean(
      formState.retention_period_defined,
      formKeyLabels.retention_period_defined,
    ),
    lawful_basis: formState.lawful_basis || null,
    special_category_condition_met: toNullableBoolean(
      formState.special_category_condition_met,
    ),
    target_region: formState.target_region,
    controller_processor_roles_defined: toNullableBoolean(
      formState.controller_processor_roles_defined,
    ),
    dpa_in_place: toNullableBoolean(formState.dpa_in_place),
    processor_sufficient_guarantees: toNullableBoolean(
      formState.processor_sufficient_guarantees,
    ),
    scc_in_place: toNullableBoolean(formState.scc_in_place),
    bcr_in_place: toNullableBoolean(formState.bcr_in_place),
    other_safeguards_in_place: toNullableBoolean(
      formState.other_safeguards_in_place,
    ),
    transfer_impact_assessment_completed: toNullableBoolean(
      formState.transfer_impact_assessment_completed,
    ),
    supplemental_measures_documented: toNullableBoolean(
      formState.supplemental_measures_documented,
    ),
    incident_response_in_place: toNullableBoolean(
      formState.incident_response_in_place,
    ),
    derogation_used: toRequiredBoolean(
      formState.derogation_used,
      formKeyLabels.derogation_used,
    ),
    derogation_type:
      formState.derogation_used === "true" ? formState.derogation_type || null : null,
    privacy_notice_updated: toNullableBoolean(formState.privacy_notice_updated),
    transfer_disclosed_to_subject: toNullableBoolean(
      formState.transfer_disclosed_to_subject,
    ),
    records_of_processing_exists: toNullableBoolean(
      formState.records_of_processing_exists,
    ),
    transfer_documented_in_ropa: toNullableBoolean(
      formState.transfer_documented_in_ropa,
    ),
  };

  return {
    aws_data: awsData,
    policy_data: policyData,
  };
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
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
