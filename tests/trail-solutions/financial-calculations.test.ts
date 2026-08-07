import { describe, expect, it } from "vitest";

import {
  calculateProjectFinancials,
  safeMarginPercent,
} from "../../src/core/trail-solutions/financials";
import { evaluateFinancialHealth } from "../../src/core/trail-solutions/policy";

const healthBase = {
  currentContractValue: 500_000,
  revisedBudgetCost: 390_000,
  forecastFinalCost: 400_000,
  forecastMarginPercent: 0.2,
  estimatedLaborHours: 2_000,
  forecastFinalLaborHours: 2_050,
  unbilledAmount: 10_000,
  dataQuality: "A" as const,
  unresolvedExceptionCount: 0,
  lastDataRefresh: "2026-08-04",
};

describe("Trail Solutions financial calculations", () => {
  it("uses the canonical contract, final-cost, and margin definitions", () => {
    expect(calculateProjectFinancials({
      originalContractValue: 400_000,
      approvedChangeOrders: 50_000,
      actualCostToDate: 210_000,
      estimatedCostToComplete: 140_000,
    })).toEqual({
      currentContractValue: 450_000,
      forecastFinalCost: 350_000,
      forecastMargin: 100_000,
      forecastMarginPercent: 100_000 / 450_000,
    });
  });

  it("withholds misleading outputs when contract value or ETC is unavailable", () => {
    expect(safeMarginPercent(25_000, 0)).toBeNull();
    expect(calculateProjectFinancials({
      originalContractValue: 400_000,
      approvedChangeOrders: 0,
      actualCostToDate: 210_000,
      estimatedCostToComplete: null,
    })).toMatchObject({
      forecastFinalCost: null,
      forecastMargin: null,
      forecastMarginPercent: null,
    });
  });

  it("applies configurable health logic with data completeness taking priority", () => {
    expect(evaluateFinancialHealth(healthBase, "2026-08-06")).toBe("on-track");
    expect(evaluateFinancialHealth({ ...healthBase, forecastFinalLaborHours: 2_500 }, "2026-08-06")).toBe("watch");
    expect(evaluateFinancialHealth({ ...healthBase, forecastMarginPercent: 0.05 }, "2026-08-06")).toBe("at-risk");
    expect(evaluateFinancialHealth({ ...healthBase, forecastFinalCost: null, forecastMarginPercent: null }, "2026-08-06")).toBe("data-incomplete");
    expect(evaluateFinancialHealth({ ...healthBase, unresolvedExceptionCount: 1 }, "2026-08-06")).toBe("data-incomplete");
  });
});
