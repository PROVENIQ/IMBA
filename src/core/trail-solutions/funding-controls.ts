import type {
  ForecastUpdate,
  GrantFundingRecord,
  LaborActual,
  MatchActivity,
  NonlaborActual,
} from "@/core/trail-solutions/model";

export interface GrantAgreementControls {
  readonly eligibleCostToDate: number;
  readonly cashMatch: number;
  readonly inKindActivityMatch: number;
  readonly totalMatchAccumulated: number;
  readonly remainingMatchRequirement: number;
  readonly outstandingReimbursement: number;
  readonly awardCashExposure: number;
  readonly unspentRemainingAward: number;
}

function awardCost(record: { grantAwardId?: string; fundingTreatment?: string }, awardId: string): boolean {
  return record.grantAwardId === awardId && record.fundingTreatment === "Award Cost";
}

export function calculateMatchActivityValue(quantityHours?: number, valuationRate?: number): number {
  if (quantityHours === undefined || valuationRate === undefined) return 0;
  if (!Number.isFinite(quantityHours) || !Number.isFinite(valuationRate)) return 0;
  return Math.max(quantityHours, 0) * Math.max(valuationRate, 0);
}

export function calculateEligibleMatchValue(activity: Pick<MatchActivity, "calculatedActivityValue" | "documentedCashMatch" | "eligibilityStatus">): number {
  return activity.eligibilityStatus === "Eligible"
    ? Math.max(activity.calculatedActivityValue, 0) + Math.max(activity.documentedCashMatch, 0)
    : 0;
}

export function calculateGrantAgreementControls(input: {
  grant: Pick<GrantFundingRecord, "externalAwardId" | "awardAmount" | "matchRequirement" | "reimbursementsRequested" | "reimbursementsReceived" | "nonReimbursementAwardCashReceived">;
  laborActuals: readonly Pick<LaborActual, "grantAwardId" | "fundingTreatment" | "fullyBurdenedLaborCost">[];
  nonlaborActuals: readonly Pick<NonlaborActual, "grantAwardId" | "fundingTreatment" | "amount">[];
  matchActivities: readonly Pick<MatchActivity, "grantAwardId" | "calculatedActivityValue" | "documentedCashMatch" | "eligibilityStatus">[];
}): GrantAgreementControls {
  const { grant } = input;
  const eligibleCostToDate = input.laborActuals
    .filter((record) => awardCost(record, grant.externalAwardId))
    .reduce((total, record) => total + Math.max(record.fullyBurdenedLaborCost, 0), 0)
    + input.nonlaborActuals
      .filter((record) => awardCost(record, grant.externalAwardId))
      .reduce((total, record) => total + Math.max(record.amount, 0), 0);
  const eligibleActivities = input.matchActivities.filter((activity) => activity.grantAwardId === grant.externalAwardId && activity.eligibilityStatus === "Eligible");
  const cashMatch = eligibleActivities.reduce((total, activity) => total + Math.max(activity.documentedCashMatch, 0), 0);
  const inKindActivityMatch = eligibleActivities.reduce((total, activity) => total + Math.max(activity.calculatedActivityValue, 0), 0);
  const totalMatchAccumulated = cashMatch + inKindActivityMatch;
  const reimbursementsRequested = Math.max(grant.reimbursementsRequested, 0);
  const reimbursementsReceived = Math.max(grant.reimbursementsReceived, 0);
  const nonReimbursementAwardCashReceived = Math.max(grant.nonReimbursementAwardCashReceived ?? 0, 0);
  return {
    eligibleCostToDate,
    cashMatch,
    inKindActivityMatch,
    totalMatchAccumulated,
    remainingMatchRequirement: Math.max(0, Math.max(grant.matchRequirement, 0) - totalMatchAccumulated),
    outstandingReimbursement: Math.max(0, reimbursementsRequested - reimbursementsReceived),
    awardCashExposure: Math.max(0, eligibleCostToDate - reimbursementsReceived - nonReimbursementAwardCashReceived),
    unspentRemainingAward: Math.max(0, Math.max(grant.awardAmount, 0) - eligibleCostToDate),
  };
}

export function crossProjectLaborRecords(records: readonly Pick<LaborActual, "workPerformedProjectId" | "adpChargedProjectId">[]): number {
  return records.filter((record) => Boolean(record.workPerformedProjectId && record.adpChargedProjectId && record.workPerformedProjectId !== record.adpChargedProjectId)).length;
}

export function isCrossProjectLabor(record: Pick<LaborActual, "workPerformedProjectId" | "adpChargedProjectId">): boolean {
  return Boolean(record.workPerformedProjectId && record.adpChargedProjectId && record.workPerformedProjectId !== record.adpChargedProjectId);
}

export function forecastSnapshot(input: {
  projectId: ForecastUpdate["projectId"];
  forecastDate: string;
  forecastOwner: string;
  etcSource: string;
  currentContractValueSnapshot: number;
  actualCostToDateSnapshot: number;
  estimateToComplete: number | null;
  forecastCompletionDate?: string;
  keyVarianceDriver?: string;
  requiredAction?: string;
  confidence: ForecastUpdate["confidence"];
  notes?: string;
}): Omit<ForecastUpdate, "forecastUpdateId" | "organizationId" | "chapterScope"> {
  const forecastFinalCost = input.estimateToComplete === null ? null : Math.max(input.actualCostToDateSnapshot, 0) + Math.max(input.estimateToComplete, 0);
  const forecastMargin = forecastFinalCost === null ? null : input.currentContractValueSnapshot - forecastFinalCost;
  return {
    ...input,
    estimateToComplete: input.estimateToComplete === null ? null : Math.max(input.estimateToComplete, 0),
    forecastFinalCost,
    forecastMargin,
    forecastMarginPercent: forecastFinalCost === null || input.currentContractValueSnapshot <= 0 ? null : (forecastMargin ?? 0) / input.currentContractValueSnapshot,
    status: "Current",
  };
}

export function forecastIsStale(forecastDate: string, asOfDate: string, staleAfterDays = 30): boolean {
  const forecastTime = Date.parse(forecastDate);
  const asOfTime = Date.parse(asOfDate);
  return Number.isNaN(forecastTime) || Number.isNaN(asOfTime) || asOfTime - forecastTime > staleAfterDays * 86_400_000;
}

export function projectAgreementExposure(grants: readonly GrantAgreementControls[]): number {
  return grants.reduce((total, grant) => total + grant.awardCashExposure, 0);
}
