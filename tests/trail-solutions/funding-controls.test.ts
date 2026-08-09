import { describe, expect, it } from "vitest";
import { asProjectId } from "@/core/primitives/identity";
import {
  calculateGrantAgreementControls,
  calculateMatchActivityValue,
  crossProjectLaborRecords,
  forecastIsStale,
  forecastSnapshot,
} from "@/core/trail-solutions/funding-controls";

describe("Trail Solutions funding controls", () => {
  it("values activity only when quantity and rate are valid", () => {
    expect(calculateMatchActivityValue(10, 25)).toBe(250);
    expect(calculateMatchActivityValue(-10, 25)).toBe(0);
    expect(calculateMatchActivityValue(undefined, 25)).toBe(0);
  });

  it("separates eligible award cost, match, reimbursement, and cash exposure", () => {
    const result = calculateGrantAgreementControls({
      grant: {
        externalAwardId: "AW-1",
        awardAmount: 100000,
        matchRequirement: 30000,
        reimbursementsRequested: 50000,
        reimbursementsReceived: 20000,
        nonReimbursementAwardCashReceived: 5000,
      },
      laborActuals: [
        { grantAwardId: "AW-1", fundingTreatment: "Award Cost", fullyBurdenedLaborCost: 60000 },
        { grantAwardId: "AW-1", fundingTreatment: "Unrestricted / Non-Award", fullyBurdenedLaborCost: 10000 },
      ],
      nonlaborActuals: [{ grantAwardId: "AW-1", fundingTreatment: "Award Cost", amount: 15000 }],
      matchActivities: [
        { grantAwardId: "AW-1", calculatedActivityValue: 10000, documentedCashMatch: 5000, eligibilityStatus: "Eligible" },
        { grantAwardId: "AW-1", calculatedActivityValue: 50000, documentedCashMatch: 0, eligibilityStatus: "Pending" },
      ],
    });
    expect(result.eligibleCostToDate).toBe(75000);
    expect(result.totalMatchAccumulated).toBe(15000);
    expect(result.remainingMatchRequirement).toBe(15000);
    expect(result.outstandingReimbursement).toBe(30000);
    expect(result.awardCashExposure).toBe(50000);
    expect(result.unspentRemainingAward).toBe(25000);
  });

  it("flags labor performed on a different project than the charged project", () => {
    expect(crossProjectLaborRecords([
      { workPerformedProjectId: asProjectId("10000000-0000-4000-8000-000000000001"), adpChargedProjectId: asProjectId("20000000-0000-4000-8000-000000000002") },
      { workPerformedProjectId: asProjectId("10000000-0000-4000-8000-000000000001"), adpChargedProjectId: asProjectId("10000000-0000-4000-8000-000000000001") },
    ])).toBe(1);
  });

  it("creates a dated forecast snapshot without mutating prior history", () => {
    const snapshot = forecastSnapshot({
      projectId: asProjectId("10000000-0000-4000-8000-000000000001"),
      forecastDate: "2026-08-01",
      forecastOwner: "Finance",
      etcSource: "Approved estimate",
      currentContractValueSnapshot: 100000,
      actualCostToDateSnapshot: 40000,
      estimateToComplete: 30000,
      confidence: "High",
    });
    expect(snapshot.forecastFinalCost).toBe(70000);
    expect(snapshot.forecastMargin).toBe(30000);
    expect(snapshot.forecastMarginPercent).toBe(0.3);
    expect(forecastIsStale("2026-07-01", "2026-08-08")).toBe(true);
  });
});
