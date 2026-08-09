import { describe, expect, it } from "vitest";

import { calculateProjectFinancials } from "@/core/trail-solutions/financials";
import { provenanceOf } from "@/core/trail-solutions/model";
import {
  applyForecastUpdate,
  applyChangeOrder,
  applyDecisionAction,
  applyFundingAgreement,
  applyMatchActivity,
  applyOperationalDriver,
  buildManualProjectPackage,
  type ManualActor,
  type ManualProjectInput,
} from "@/core/trail-solutions/manual-entry";

const actor: ManualActor = { organizationId: "00000000-0000-4000-8000-000000000001", label: "Kent McNeill" };
const serverTime = "2026-08-08T14:00:00.000Z";

function baseInput(overrides: Partial<ManualProjectInput> = {}): ManualProjectInput {
  return {
    projectCode: "TS-MANUAL-1",
    projectName: "Ridgeline Reroute",
    clientName: "Regional Parks",
    businessLine: "Construction",
    projectManager: "A. Rivera",
    region: "Southeast",
    projectStage: "Active",
    contractType: "Fixed price",
    fundingType: "Customer-funded",
    startDate: "2026-09-01",
    expectedCompletionDate: "2027-03-31",
    originalContractValue: 200000,
    initialEstimatedCost: 150000,
    ...overrides,
  };
}

describe("manual-entry — buildManualProjectPackage", () => {
  it("produces a valid one-project package that reconciles the portfolio", () => {
    const pkg = buildManualProjectPackage(baseInput(), actor, serverTime);

    expect(pkg.readiness).toBe("ready");
    expect(pkg.snapshot.projects).toHaveLength(1);
    const project = pkg.snapshot.projects[0];
    expect(project.projectCode).toBe("TS-MANUAL-1");

    // Portfolio recomputed from the single project.
    expect(pkg.snapshot.portfolio.totalCurrentContractValue).toBe(200000);
    expect(pkg.snapshot.portfolio.activeProjects).toBe(1);

    // Forecast economics match the shared financial engine (ETC = initial estimate, no actuals yet).
    const expected = calculateProjectFinancials({
      originalContractValue: 200000,
      approvedChangeOrders: 0,
      actualCostToDate: 0,
      estimatedCostToComplete: 150000,
    });
    expect(project.forecastFinalCost).toBe(expected.forecastFinalCost);
    expect(project.forecastMargin).toBe(expected.forecastMargin);
    expect(project.forecastMarginPercent).toBe(expected.forecastMarginPercent);

    // Detail is keyed by project id and starts with empty record collections.
    const detail = pkg.projectDetails[project.projectId];
    expect(detail).toBeDefined();
    expect(detail.forecastUpdates).toEqual([]);
    expect(detail.laborActuals).toEqual([]);
  });

  it("stamps manual provenance on the project", () => {
    const pkg = buildManualProjectPackage(baseInput(), actor, serverTime);
    const prov = provenanceOf(pkg.snapshot.projects[0]);
    expect(prov.sourceType).toBe("manual");
    expect(prov.createdBy).toBe("Kent McNeill");
    expect(prov.createdAt).toBe(serverTime);
  });

  it("treats current contract value above original as approved change orders", () => {
    const pkg = buildManualProjectPackage(baseInput({ currentContractValue: 230000 }), actor, serverTime);
    const project = pkg.snapshot.projects[0];
    expect(project.approvedChangeOrders).toBe(30000);
    expect(project.currentContractValue).toBe(230000);
  });

  it("records operational drivers only when provided (no forced irrelevant fields)", () => {
    const withDrivers = buildManualProjectPackage(baseInput({ drivers: { trailMiles: 4.5, crewDays: 20 } }), actor, serverTime);
    const drivers = withDrivers.projectDetails[withDrivers.snapshot.projects[0].projectId].operationalDrivers;
    expect(drivers).toHaveLength(1);
    expect(drivers[0].trailMiles).toBe(4.5);

    const withoutDrivers = buildManualProjectPackage(baseInput(), actor, serverTime);
    expect(withoutDrivers.projectDetails[withoutDrivers.snapshot.projects[0].projectId].operationalDrivers).toEqual([]);
  });

  it("keeps agreement and match controls in the same portfolio snapshot", () => {
    const pkg = buildManualProjectPackage(baseInput({
      fundingType: "Grant",
      funding: {
        externalAwardId: "AWARD-1",
        funder: "State Trails",
        grantType: "Reimbursement",
        restricted: true,
        awardAmount: 100000,
        startDate: "2026-09-01",
        endDate: "2027-03-31",
        reimbursementBasis: "Eligible cost",
        matchType: "Cash / in-kind",
        matchRequirement: 5000,
      },
    }), actor, serverTime);
    expect(pkg.snapshot.portfolio.remainingMatchRequirement).toBe(5000);
    const updated = applyMatchActivity(pkg, pkg.snapshot.projects[0].projectId, {
      grantAwardId: "AWARD-1",
      activityDate: "2026-09-10",
      matchType: "Volunteer Hours",
      contributorOrResource: "Volunteers",
      activityDescription: "Trail day",
      quantityHours: 100,
      valuationRate: 50,
      documentedCashMatch: 0,
      eligibilityStatus: "Eligible",
    }, actor, serverTime);
    expect(updated.snapshot.portfolio.remainingMatchRequirement).toBe(0);
  });
});

describe("manual-entry — applyForecastUpdate", () => {
  it("appends forecasts without overwriting history and supersedes the prior current one", () => {
    const pkg = buildManualProjectPackage(baseInput(), actor, serverTime);
    const projectId = pkg.snapshot.projects[0].projectId;

    const first = applyForecastUpdate(
      pkg,
      projectId,
      { forecastDate: "2026-10-01", forecastOwner: "A. Rivera", etcSource: "PM estimate", estimateToComplete: 160000, confidence: "Moderate" },
      actor,
      "2026-10-01T00:00:00.000Z",
    );
    const second = applyForecastUpdate(
      first,
      projectId,
      { forecastDate: "2026-11-01", forecastOwner: "A. Rivera", etcSource: "Revised", estimateToComplete: 140000, confidence: "High" },
      actor,
      "2026-11-01T00:00:00.000Z",
    );

    const history = second.projectDetails[projectId].forecastUpdates ?? [];
    expect(history).toHaveLength(2);
    expect(history[0].status).toBe("Superseded");
    expect(history[1].status).toBe("Current");
    // History preserved chronologically — the first forecast's ETC is untouched.
    expect(history[0].estimateToComplete).toBe(160000);
  });

  it("recomputes project margin to match the financial engine", () => {
    const pkg = buildManualProjectPackage(baseInput(), actor, serverTime);
    const projectId = pkg.snapshot.projects[0].projectId;
    const updated = applyForecastUpdate(
      pkg,
      projectId,
      { forecastDate: "2026-10-01", forecastOwner: "A. Rivera", etcSource: "PM estimate", estimateToComplete: 210000, confidence: "Low" },
      actor,
      "2026-10-01T00:00:00.000Z",
    );
    const project = updated.snapshot.projects[0];
    const expected = calculateProjectFinancials({
      originalContractValue: 200000,
      approvedChangeOrders: 0,
      actualCostToDate: 0,
      estimatedCostToComplete: 210000,
    });
    expect(project.forecastFinalCost).toBe(expected.forecastFinalCost);
    expect(project.forecastMargin).toBe(expected.forecastMargin); // 200000 - 210000 = -10000
    expect(project.healthStatus).toBe("at-risk");
    // Portfolio reflects the updated forecast.
    expect(updated.snapshot.portfolio.forecastGrossMargin).toBe(-10000);
  });
});

describe("manual-entry — applyMatchActivity", () => {
  it("computes activity value from quantity × rate and counts only eligible toward match", () => {
    const pkg = buildManualProjectPackage(baseInput(), actor, serverTime);
    const projectId = pkg.snapshot.projects[0].projectId;

    const eligible = applyMatchActivity(
      pkg,
      projectId,
      {
        grantAwardId: "AWARD-1",
        activityDate: "2026-10-05",
        matchType: "Volunteer Hours",
        contributorOrResource: "Trail crew volunteers",
        activityDescription: "Volunteer trail day",
        quantityHours: 40,
        valuationRate: 30,
        documentedCashMatch: 0,
        eligibilityStatus: "Eligible",
      },
      actor,
      serverTime,
    );
    const activity = (eligible.projectDetails[projectId].matchActivities ?? [])[0];
    expect(activity.calculatedActivityValue).toBe(1200);
    expect(activity.eligibleMatchValue).toBe(1200);

    const pending = applyMatchActivity(
      pkg,
      projectId,
      {
        grantAwardId: "AWARD-1",
        activityDate: "2026-10-06",
        matchType: "In-Kind",
        contributorOrResource: "Partner org",
        activityDescription: "Donated materials",
        quantityHours: 10,
        valuationRate: 50,
        documentedCashMatch: 0,
        eligibilityStatus: "Pending",
      },
      actor,
      serverTime,
    );
    const pendingActivity = (pending.projectDetails[projectId].matchActivities ?? [])[0];
    expect(pendingActivity.calculatedActivityValue).toBe(500);
    expect(pendingActivity.eligibleMatchValue).toBe(0); // pending does not accumulate
  });
});

describe("manual-entry — provenance backward compatibility", () => {
  it("defaults a record with no provenance to import-derived", () => {
    expect(provenanceOf({}).sourceType).toBe("import");
  });
});

describe("manual-entry — project management actions", () => {
  it("applies only approved change orders to contract and revised budget", () => {
    const pkg = buildManualProjectPackage(baseInput(), actor, serverTime);
    const projectId = pkg.snapshot.projects[0].projectId;
    const pending = applyChangeOrder(pkg, projectId, {
      changeNumber: "CO-001",
      identifiedDate: "2026-10-01",
      status: "pending",
      additionalRevenue: 25000,
      additionalEstimatedCost: 18000,
      description: "Pending drainage scope",
      approvalOwner: "Client PM",
    }, actor, serverTime);
    expect(pending.snapshot.projects[0].currentContractValue).toBe(200000);
    expect(pending.projectDetails[projectId].changeOrders).toHaveLength(1);

    const approved = applyChangeOrder(pending, projectId, {
      changeNumber: "CO-002",
      identifiedDate: "2026-10-05",
      approvedDate: "2026-10-06",
      status: "approved",
      additionalRevenue: 30000,
      additionalEstimatedCost: 20000,
      description: "Approved access revision",
      approvalOwner: "Client PM",
    }, actor, "2026-10-06T00:00:00.000Z");
    const project = approved.snapshot.projects[0];
    expect(project.currentContractValue).toBe(230000);
    expect(project.approvedChangeOrders).toBe(30000);
    expect(project.revisedBudgetCost).toBe(170000);
  });

  it("appends operational drivers and funding agreements with provenance", () => {
    const pkg = buildManualProjectPackage(baseInput(), actor, serverTime);
    const projectId = pkg.snapshot.projects[0].projectId;
    const withDriver = applyOperationalDriver(pkg, projectId, { trailMiles: 8, crewDays: 14 }, actor, serverTime);
    expect(withDriver.projectDetails[projectId].operationalDrivers).toHaveLength(1);
    const withFunding = applyFundingAgreement(withDriver, projectId, {
      externalAwardId: "AWARD-2",
      funder: "State Trails",
      grantType: "Reimbursement",
      restricted: true,
      awardAmount: 100000,
      startDate: "2026-09-01",
      endDate: "2027-03-31",
      reimbursementBasis: "Eligible cost",
      matchType: "Cash",
      matchRequirement: 10000,
      fundingRole: "Prime Recipient",
      agreementOwner: "Grants Director",
      agreementStatus: "Active",
    }, actor, serverTime);
    const funding = withFunding.projectDetails[projectId].grantFunding[0];
    expect(funding.externalAwardId).toBe("AWARD-2");
    expect(funding.agreementStatus).toBe("Active");
    expect(provenanceOf(funding).sourceType).toBe("manual");
  });

  it("adds a decision to both the project action cards and snapshot decisions", () => {
    const pkg = buildManualProjectPackage(baseInput(), actor, serverTime);
    const projectId = pkg.snapshot.projects[0].projectId;
    const updated = applyDecisionAction(pkg, projectId, {
      issue: "Approve revised access scope",
      financialEffect: 12000,
      financialEffectLabel: "+$12k cost exposure",
      recommendedAction: "Approve before next forecast",
      owner: "Project manager",
      dueDate: "2026-10-15",
      status: "open",
    }, actor, serverTime);
    expect(updated.snapshot.projects[0].decisionsRequired).toHaveLength(1);
    expect(updated.snapshot.decisions).toHaveLength(1);
    expect(updated.snapshot.decisions[0].issue).toBe("Approve revised access scope");
  });
});
