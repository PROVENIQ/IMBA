import type {
  ReconciliationCandidate,
  ReconciliationCase,
  ReconciliationStatus,
} from "@/core/migration/model";
import type {
  ActorId,
  OrganizationId,
  PersonId,
  ReconciliationCaseId,
} from "@/core/primitives/identity";

export interface MatchablePerson {
  personId: PersonId;
  email?: string;
  phone?: string;
  postalCode?: string;
  firstName?: string;
  lastName?: string;
}

function normalized(value?: string): string {
  return (value ?? "").trim().toLocaleLowerCase();
}

function score(source: Omit<MatchablePerson, "personId">, target: MatchablePerson): ReconciliationCandidate {
  let confidence = 0;
  const reasons: string[] = [];
  if (source.email && normalized(source.email) === normalized(target.email)) {
    confidence += 0.7;
    reasons.push("EMAIL_EXACT");
  }
  if (source.phone && source.phone.replace(/\D/g, "") === target.phone?.replace(/\D/g, "")) {
    confidence += 0.6;
    reasons.push("PHONE_EXACT");
  }
  if (
    source.firstName &&
    source.lastName &&
    normalized(source.firstName) === normalized(target.firstName) &&
    normalized(source.lastName) === normalized(target.lastName)
  ) {
    confidence += 0.35;
    reasons.push("NAME_EXACT");
  }
  if (source.postalCode && normalized(source.postalCode) === normalized(target.postalCode)) {
    confidence += 0.1;
    reasons.push("POSTAL_CODE_EXACT");
  }
  return { personId: target.personId, confidence: Math.min(confidence, 1), reasons };
}

export function reconcilePerson(
  input: {
    id: ReconciliationCaseId;
    organizationId: OrganizationId;
    sourceSystem: ReconciliationCase["sourceSystem"];
    sourceObject: string;
    sourceRecordId: string;
    source: Omit<MatchablePerson, "personId">;
    candidates: readonly MatchablePerson[];
    openedAt: string;
  },
): ReconciliationCase {
  const candidates = input.candidates
    .map((candidate) => score(input.source, candidate))
    .filter((candidate) => candidate.confidence >= 0.35)
    .sort((a, b) => b.confidence - a.confidence);
  const leaders = candidates.filter((candidate) => candidate.confidence === candidates[0]?.confidence);
  let status: ReconciliationStatus = "UNMATCHED";
  if (leaders.length > 1 && (leaders[0]?.confidence ?? 0) >= 0.7) status = "DUPLICATE";
  else if ((leaders[0]?.confidence ?? 0) >= 0.95) status = "EXACT_MATCH";
  else if ((leaders[0]?.confidence ?? 0) >= 0.7) status = "LIKELY_MATCH";
  else if (leaders.length > 0) status = "NEEDS_REVIEW";

  return Object.freeze({
    id: input.id,
    organizationId: input.organizationId,
    sourceSystem: input.sourceSystem,
    sourceObject: input.sourceObject,
    sourceRecordId: input.sourceRecordId,
    status,
    candidates,
    openedAt: input.openedAt,
  });
}

export function resolveReconciliationCase(
  reconciliationCase: ReconciliationCase,
  organizationId: OrganizationId,
  input: { selectedPersonId?: PersonId; rationale: string; resolvedBy: ActorId; resolvedAt: string },
): ReconciliationCase {
  if (reconciliationCase.organizationId !== organizationId) {
    throw new Error("Cross-organization reconciliation access denied");
  }
  if (!input.rationale.trim()) throw new Error("Resolution rationale is required");
  return Object.freeze({ ...reconciliationCase, status: "RESOLVED", resolution: Object.freeze(input) });
}
