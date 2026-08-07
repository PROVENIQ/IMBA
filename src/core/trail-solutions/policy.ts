import type { FinancialHealthStatus, ProjectFinancialSummary } from "@/core/trail-solutions/model";

export interface TrailSolutionsFinancialHealthPolicy {
  readonly policyId: string;
  readonly version: number;
  readonly effectiveDate: string;
  readonly assumptionsLabel: string;
  readonly atRiskMarginPercentBelow: number;
  readonly watchMarginPercentBelow: number;
  readonly atRiskBudgetOverrunPercent: number;
  readonly watchLaborHoursOverrunPercent: number;
  readonly watchBillingLagPercentOfContract: number;
  readonly forecastStaleAfterDays: number;
  readonly criticalDataQualityGrades: readonly ("C" | "D")[];
}

export const demoFinancialHealthPolicy: TrailSolutionsFinancialHealthPolicy = Object.freeze({
  policyId: "trail-solutions-financial-health-demo",
  version: 1,
  effectiveDate: "2026-08-06",
  assumptionsLabel: "Configurable demonstration assumptions — Finance approval required before production use.",
  atRiskMarginPercentBelow: 0.08,
  watchMarginPercentBelow: 0.15,
  atRiskBudgetOverrunPercent: 0.1,
  watchLaborHoursOverrunPercent: 0.15,
  watchBillingLagPercentOfContract: 0.1,
  forecastStaleAfterDays: 14,
  criticalDataQualityGrades: ["C", "D"] as const,
});

export function daysBetween(earlier: string, later: string): number {
  const start = Date.parse(earlier);
  const end = Date.parse(later);
  if (Number.isNaN(start) || Number.isNaN(end)) throw new TypeError("dates must be ISO-8601 values");
  return Math.floor((end - start) / 86_400_000);
}

export function evaluateFinancialHealth(
  summary: Pick<
    ProjectFinancialSummary,
    | "currentContractValue"
    | "revisedBudgetCost"
    | "forecastFinalCost"
    | "forecastMarginPercent"
    | "estimatedLaborHours"
    | "forecastFinalLaborHours"
    | "unbilledAmount"
    | "dataQuality"
    | "unresolvedExceptionCount"
    | "lastDataRefresh"
  >,
  asOfDate: string,
  policy: TrailSolutionsFinancialHealthPolicy = demoFinancialHealthPolicy,
): FinancialHealthStatus {
  if (
    summary.forecastFinalCost === null ||
    summary.forecastMarginPercent === null ||
    policy.criticalDataQualityGrades.includes(summary.dataQuality as "C" | "D") ||
    summary.unresolvedExceptionCount > 0 ||
    daysBetween(summary.lastDataRefresh, asOfDate) > policy.forecastStaleAfterDays
  ) {
    return "data-incomplete";
  }

  const budgetOverrun = summary.revisedBudgetCost > 0
    ? (summary.forecastFinalCost - summary.revisedBudgetCost) / summary.revisedBudgetCost
    : 0;
  if (
    summary.forecastMarginPercent < policy.atRiskMarginPercentBelow ||
    budgetOverrun > policy.atRiskBudgetOverrunPercent
  ) {
    return "at-risk";
  }

  const laborHoursOverrun =
    summary.forecastFinalLaborHours !== null && summary.estimatedLaborHours > 0
      ? (summary.forecastFinalLaborHours - summary.estimatedLaborHours) / summary.estimatedLaborHours
      : 0;
  const billingLag =
    summary.unbilledAmount !== null && summary.currentContractValue > 0
      ? summary.unbilledAmount / summary.currentContractValue
      : 0;
  if (
    summary.forecastMarginPercent < policy.watchMarginPercentBelow ||
    laborHoursOverrun > policy.watchLaborHoursOverrunPercent ||
    billingLag > policy.watchBillingLagPercentOfContract
  ) {
    return "watch";
  }

  return "on-track";
}
