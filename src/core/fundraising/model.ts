import type { Brand } from "../primitives/brand";
import type {
  ContributionId,
  FinancialBatchId,
  OrganizationId,
  PersonId,
  RecurringCommitmentId,
} from "../primitives/identity";
import type { Money } from "../primitives/money";

export type CampaignId = Brand<string, "CampaignId">;
export type DesignationId = Brand<string, "DesignationId">;
export type PledgeId = Brand<string, "PledgeId">;

export interface Campaign {
  readonly campaignId: CampaignId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly goal?: Money;
}

export interface Designation {
  readonly designationId: DesignationId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly restrictionType: "UNRESTRICTED" | "PURPOSE" | "TIME";
}

export interface Contribution {
  readonly contributionId: ContributionId;
  readonly organizationId: OrganizationId;
  readonly personId: PersonId;
  readonly campaignId?: CampaignId;
  readonly designationId: DesignationId;
  readonly amount: Money;
  readonly receivedAt: string;
  readonly status: "PENDING" | "SETTLED" | "DEPOSITED" | "VOIDED";
}

export interface ContributionAdjustment {
  readonly adjustmentId: Brand<string, "ContributionAdjustmentId">;
  readonly organizationId: OrganizationId;
  readonly contributionId: ContributionId;
  readonly amountDelta: Money;
  readonly reason: string;
  readonly evidenceReference: string;
}

export interface Pledge {
  readonly pledgeId: PledgeId;
  readonly organizationId: OrganizationId;
  readonly personId: PersonId;
  readonly campaignId?: CampaignId;
  readonly designationId: DesignationId;
  readonly amount: Money;
  readonly status: "DOCUMENTED" | "FULFILLED" | "CANCELLED";
}

export interface RecurringCommitment {
  readonly recurringCommitmentId: RecurringCommitmentId;
  readonly organizationId: OrganizationId;
  readonly personId: PersonId;
  readonly designationId: DesignationId;
  readonly installmentAmount: Money;
  readonly frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  readonly status: "ACTIVE" | "PAUSED" | "ENDED";
}

export interface FinancialBatch {
  readonly financialBatchId: FinancialBatchId;
  readonly organizationId: OrganizationId;
  readonly name: string;
  readonly contributionIds: readonly ContributionId[];
  readonly controlTotal: Money;
  readonly status: "OPEN" | "CLOSED" | "RECONCILED";
}

export interface ProcessorSettlement {
  readonly processorSettlementId: Brand<string, "ProcessorSettlementId">;
  readonly organizationId: OrganizationId;
  readonly externalId: string;
  readonly grossAmount: Money;
  readonly feeAmount: Money;
  readonly settledAt: string;
}

export interface BankDeposit {
  readonly bankDepositId: Brand<string, "BankDepositId">;
  readonly organizationId: OrganizationId;
  readonly externalId: string;
  readonly amount: Money;
  readonly depositedAt: string;
}

export interface GeneralLedgerEntryReference {
  readonly glEntryReferenceId: Brand<string, "GlEntryReferenceId">;
  readonly organizationId: OrganizationId;
  readonly quickBooksId: string;
  readonly amount: Money;
  readonly postedAt: string;
}
