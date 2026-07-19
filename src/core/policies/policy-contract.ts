export interface ApprovedPolicyReference {
  readonly policyId: string;
  readonly policyVersion: number;
  readonly effectiveDate: string;
}

export function assertApprovedPolicy(
  policy: ApprovedPolicyReference,
): ApprovedPolicyReference {
  if (!policy.policyId.trim()) {
    throw new TypeError("policyId is required");
  }

  if (!Number.isSafeInteger(policy.policyVersion) || policy.policyVersion <= 0) {
    throw new TypeError("policyVersion must be a positive integer");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(policy.effectiveDate)) {
    throw new TypeError("effectiveDate must be YYYY-MM-DD");
  }

  return Object.freeze({ ...policy });
}

export class PolicyDecisionRequiredError extends Error {
  constructor(public readonly question: string) {
    super(`Approved IMBA policy required: ${question}`);
    this.name = "PolicyDecisionRequiredError";
  }
}
