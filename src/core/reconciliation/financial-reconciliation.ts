import type {
  ActorId,
  OrganizationId,
  ReconciliationCaseId,
} from "@/core/primitives/identity";
import type { Money } from "@/core/primitives/money";

export type FinancialReconciliationStatus =
  | "MATCHED"
  | "TIMING_DIFFERENCE"
  | "AMOUNT_DIFFERENCE"
  | "MISSING_IN_QUICKBOOKS"
  | "MISSING_IN_EVERYACTION"
  | "MISSING_PROCESSOR_SETTLEMENT"
  | "MISSING_BANK_DEPOSIT"
  | "DESIGNATION_MISMATCH"
  | "DUPLICATE"
  | "REFUND_OR_ADJUSTMENT"
  | "REQUIRES_REVIEW"
  | "RESOLVED";

export interface FinancialReconciliationEvidence {
  everyActionBatchId?: string;
  contributionTotal?: Money;
  processorSettlementId?: string;
  processorTotal?: Money;
  bankDepositId?: string;
  bankTotal?: Money;
  quickBooksTransactionId?: string;
  quickBooksTotal?: Money;
  evidenceReferences: readonly string[];
}

export interface FinancialReconciliationCase {
  reconciliationCaseId: ReconciliationCaseId;
  organizationId: OrganizationId;
  status: FinancialReconciliationStatus;
  evidence: FinancialReconciliationEvidence;
  difference?: Money;
  openedAt: string;
  resolutions: readonly FinancialReconciliationResolution[];
}

export interface FinancialReconciliationResolution {
  actorId: ActorId;
  reason: string;
  evidenceReference: string;
  occurredAt: string;
  ingestedAt: string;
  recordedAt: string;
  correlationId: string;
  causationId: string;
}

export function appendFinancialResolution(
  reconciliationCase: FinancialReconciliationCase,
  organizationId: OrganizationId,
  resolution: FinancialReconciliationResolution,
): FinancialReconciliationCase {
  if (reconciliationCase.organizationId !== organizationId) {
    throw new Error("Cross-organization reconciliation access denied");
  }
  if (!resolution.reason.trim() || !resolution.evidenceReference.trim()) {
    throw new Error("Resolution reason and evidence are required");
  }
  return Object.freeze({
    ...reconciliationCase,
    status: "RESOLVED",
    resolutions: Object.freeze([...reconciliationCase.resolutions, Object.freeze(resolution)]),
  });
}
