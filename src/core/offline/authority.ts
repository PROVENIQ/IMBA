import type { ApprovedPolicyReference } from "../policies/policy-contract";

export const OFFLINE_AUTHORITY_STATUSES = [
  "LOCAL_FACT_RECORDED",
  "PROVISIONAL_AUTHORITY_EXERCISED",
  "CENTRAL_ACCEPTANCE_REQUIRED",
  "EXTERNAL_CONFIRMATION_REQUIRED",
] as const;

export type OfflineAuthorityStatus = (typeof OFFLINE_AUTHORITY_STATUSES)[number];

export interface OfflineAuthorityRecord {
  readonly status: OfflineAuthorityStatus;
  readonly delegatedByPolicy?: ApprovedPolicyReference;
}

export function validateOfflineAuthority(
  record: OfflineAuthorityRecord,
): OfflineAuthorityRecord {
  if (!OFFLINE_AUTHORITY_STATUSES.includes(record.status)) {
    throw new TypeError("unknown offline authority status");
  }

  if (
    record.status === "PROVISIONAL_AUTHORITY_EXERCISED" &&
    !record.delegatedByPolicy
  ) {
    throw new TypeError(
      "provisional authority requires a centrally approved policy reference",
    );
  }

  if (
    record.status !== "PROVISIONAL_AUTHORITY_EXERCISED" &&
    record.delegatedByPolicy
  ) {
    throw new TypeError(
      "delegated policy is only valid for provisional authority",
    );
  }

  return Object.freeze({ ...record });
}
