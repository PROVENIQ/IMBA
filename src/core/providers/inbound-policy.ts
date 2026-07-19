import type { EventId } from "../primitives/identity";
import { assertApprovedPolicy, type ApprovedPolicyReference } from "../policies/policy-contract";

export const PROVIDER_INBOUND_OUTCOMES = [
  "AUTO_ACCEPT",
  "ACCEPT_AS_ADDITIONAL_VALUE",
  "REQUIRE_VERIFICATION",
  "REQUIRE_REVIEW",
  "REJECT",
  "TELEMETRY_ONLY",
] as const;

export type ProviderInboundOutcome = (typeof PROVIDER_INBOUND_OUTCOMES)[number];

export interface ProviderInboundDecision {
  readonly provider: string;
  readonly providerEventId: string;
  readonly source: string;
  readonly evidenceReference: string;
  readonly providerOccurredAt?: string;
  readonly receivedAt: string;
  readonly policy: ApprovedPolicyReference;
  readonly outcome: ProviderInboundOutcome;
  readonly explanationCode: string;
  readonly resultingEventIds: readonly EventId[];
}

export function validateProviderInboundDecision(
  decision: ProviderInboundDecision,
): ProviderInboundDecision {
  for (const [label, value] of [
    ["provider", decision.provider],
    ["providerEventId", decision.providerEventId],
    ["source", decision.source],
    ["evidenceReference", decision.evidenceReference],
    ["explanationCode", decision.explanationCode],
  ] as const) {
    if (!value.trim()) throw new TypeError(`${label} is required`);
  }

  assertApprovedPolicy(decision.policy);
  if (!PROVIDER_INBOUND_OUTCOMES.includes(decision.outcome)) {
    throw new TypeError("unknown provider inbound outcome");
  }

  return Object.freeze({ ...decision });
}
