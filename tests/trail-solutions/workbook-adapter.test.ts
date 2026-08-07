import { describe, expect, it } from "vitest";

import { asOrganizationId } from "../../src/core/primitives/identity";
import type { TrailSolutionsDataSource } from "../../src/core/trail-solutions/data-source";
import {
  WorkbookDerivedTrailSolutionsDataSource,
  deduplicateSourceRecords,
  rawWorkbookDerivedInput,
  trailSolutionsDemoContext,
  workbookDerivedTrailSolutionsDataSource,
} from "../../src/integrations/trail-solutions/workbook-derived-adapter";

function exercisesContract(source: TrailSolutionsDataSource): void {
  it("implements the replaceable data-source contract", async () => {
    const [portfolio, projects, benchmarks, exceptions, decisions, health] = await Promise.all([
      source.getPortfolioSummary(trailSolutionsDemoContext),
      source.getProjects(trailSolutionsDemoContext),
      source.getBenchmarks(trailSolutionsDemoContext),
      source.getExceptions(trailSolutionsDemoContext),
      source.getDecisionItems(trailSolutionsDemoContext),
      source.getDataHealth(trailSolutionsDemoContext),
    ]);
    expect(portfolio.activeProjects).toBe(5);
    expect(projects).toHaveLength(5);
    expect(benchmarks.length).toBeGreaterThanOrEqual(8);
    expect(exceptions.length).toBeGreaterThanOrEqual(3);
    expect(decisions).toHaveLength(4);
    expect(health.refreshStatuses.every((status) => !status.productionWritesEnabled)).toBe(true);
  });
}

describe("workbook-derived Trail Solutions adapter contract", () => {
  exercisesContract(workbookDerivedTrailSolutionsDataSource);

  it("demonstrates the five required management states without false precision", async () => {
    const projects = await workbookDerivedTrailSolutionsDataSource.getProjects(trailSolutionsDemoContext);
    expect(projects.some((project) => project.healthStatus === "on-track")).toBe(true);
    expect(projects.some((project) => project.varianceDrivers.some((driver) => driver.driverType === "labor-hours"))).toBe(true);
    expect(projects.some((project) => project.varianceDrivers.some((driver) => driver.driverType === "scope-change"))).toBe(true);
    expect(projects.some((project) => project.varianceDrivers.some((driver) => driver.driverType === "billing-lag"))).toBe(true);
    const incomplete = projects.find((project) => project.healthStatus === "data-incomplete");
    expect(incomplete).toMatchObject({
      forecastFinalCost: null,
      forecastMargin: null,
      forecastMarginPercent: null,
    });
  });

  it("keeps invoice, recognized revenue, cash, hours, and dollars distinct", async () => {
    const projects = await workbookDerivedTrailSolutionsDataSource.getProjects(trailSolutionsDemoContext);
    const billingLag = projects.find((project) => project.projectName === "Trail Stewardship Academy");
    expect(billingLag).toMatchObject({
      recognizedRevenue: 130_000,
      invoicedAmount: 70_000,
      cashCollected: 70_000,
      unbilledAmount: 60_000,
      estimatedLaborHours: 900,
      actualLaborHours: 700,
    });
    expect(billingLag?.actualLaborCost).toBeGreaterThan(0);
  });

  it("reconciles every reliable project summary to its category forecast", async () => {
    const projects = await workbookDerivedTrailSolutionsDataSource.getProjects(trailSolutionsDemoContext);
    for (const project of projects) {
      expect(project.costBreakdown.reduce((total, line) => total + line.actual, 0)).toBeCloseTo(project.actualCostToDate, 8);
      if (project.forecastFinalCost !== null) {
        expect(project.costBreakdown.reduce((total, line) => total + (line.forecast ?? 0), 0)).toBeCloseTo(project.forecastFinalCost, 8);
      }
    }
  });

  it("filters the portfolio without recomputing financial truth in the UI", async () => {
    const projects = await workbookDerivedTrailSolutionsDataSource.getProjects(trailSolutionsDemoContext, {
      businessLine: "Construction",
      decisionRequired: true,
    });
    expect(projects).toHaveLength(1);
    expect(projects[0].projectName).toBe("Ridgeback Trail Build");
  });

  it("deduplicates identical source records and rejects conflicting reuse", async () => {
    const project = (await workbookDerivedTrailSolutionsDataSource.getProjects(trailSolutionsDemoContext))[0];
    const detail = await workbookDerivedTrailSolutionsDataSource.getProject(trailSolutionsDemoContext, project.projectId);
    const labor = detail.laborActuals[0];
    expect(deduplicateSourceRecords([labor, labor])).toHaveLength(1);
    expect(() => deduplicateSourceRecords([
      labor,
      { ...labor, source: { ...labor.source, fingerprint: "different" } },
    ])).toThrow("conflicting duplicate source record");
  });

  it("rejects duplicate project identities during controlled import", () => {
    const duplicate = structuredClone(rawWorkbookDerivedInput);
    duplicate.projects.push(structuredClone(duplicate.projects[0]));
    expect(() => new WorkbookDerivedTrailSolutionsDataSource(duplicate)).toThrow("duplicate project identity");
  });

  it("enforces organization isolation on every adapter read", async () => {
    const otherContext = {
      organizationId: asOrganizationId("90000000-0000-4000-8000-000000000002"),
      chapterScope: "NATIONAL" as const,
    };
    await expect(workbookDerivedTrailSolutionsDataSource.getProjects(otherContext)).rejects.toThrow("Cross-organization");
  });
});
