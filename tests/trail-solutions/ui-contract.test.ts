import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { TRAIL_SOLUTIONS_SYNTHETIC_BANNER } from "../../src/core/trail-solutions/model";
import { TEST_DATA_BANNER } from "../../src/core/trail-solutions/import-lab";
import { imbaRoleProfiles } from "../../src/lib/imba-intelligence-data";

const workspace = readFileSync(
  resolve(process.cwd(), "src/components/imba/ImbaTrailSolutionsWorkspace.tsx"),
  "utf8",
);
const cockpit = readFileSync(
  resolve(process.cwd(), "src/components/imba/ImbaCeoCockpit.tsx"),
  "utf8",
);
const importLab = readFileSync(
  resolve(process.cwd(), "src/components/imba/ImbaTrailSolutionsImportLab.tsx"),
  "utf8",
);
const missionWorkspace = readFileSync(
  resolve(process.cwd(), "src/components/imba/ImbaMissionWorkspace.tsx"),
  "utf8",
);
const tour = readFileSync(
  resolve(process.cwd(), "src/components/imba/ImbaTrailSolutionsTour.tsx"),
  "utf8",
);

describe("Trail Solutions primary demonstration path", () => {
  it("is a primary module with portfolio-to-project progressive disclosure", () => {
    expect(cockpit).toContain('label: "Trail Solutions"');
    expect(cockpit).toContain("<ImbaTrailSolutionsWorkspace");
    expect(workspace).toContain('type WorkspaceView = "portfolio" | "project" | "benchmarks" | "exceptions" | "data-health" | "import-lab"');
    expect(workspace).toContain("Open project");
    expect(workspace).toContain("Finance drill-down");
  });

  it("owns project delivery navigation without duplicating it under Mission", () => {
    const missionSectionStart = cockpit.indexOf('label: "Mission"');
    const trailSolutionsSectionStart = cockpit.indexOf('label: "Trail Solutions"', missionSectionStart);
    const moneySectionStart = cockpit.indexOf('label: "Money"', trailSolutionsSectionStart);
    const missionSection = cockpit.slice(missionSectionStart, trailSolutionsSectionStart);
    const trailSolutionsSection = cockpit.slice(trailSolutionsSectionStart, moneySectionStart);
    const trailSolutionViews = ["project-command", "project-board", "construction-reports"];

    expect(missionSectionStart).toBeGreaterThan(-1);
    expect(trailSolutionsSectionStart).toBeGreaterThan(missionSectionStart);
    expect(moneySectionStart).toBeGreaterThan(trailSolutionsSectionStart);
    for (const view of trailSolutionViews) {
      expect(trailSolutionsSection).toContain(`id: "${view}"`);
      expect(missionSection).not.toContain(`id: "${view}"`);
    }

    for (const roleId of ["finance", "trail-solutions", "planning-design"] as const) {
      const profile = imbaRoleProfiles[roleId];
      const trailSolutionsAccess = profile.sectionViews?.["Trail Solutions"] ?? [];
      const missionAccess = profile.sectionViews?.Mission ?? [];

      expect(trailSolutionsAccess).toContain("project-command");
      expect(missionAccess).not.toContain("project-command");
      expect(missionAccess).not.toContain("project-board");
      expect(missionAccess).not.toContain("construction-reports");
    }

    expect(imbaRoleProfiles.executive.sectionViews).toBeUndefined();

    expect(missionWorkspace).not.toContain('"trail-solutions": {');
  });

  it("shows the exact synthetic banner and the decision-first introduction", () => {
    expect(TRAIL_SOLUTIONS_SYNTHETIC_BANNER).toBe(
      "Synthetic demonstration data — not connected to IMBA systems.",
    );
    expect(workspace).toContain('data-testid="trail-solutions-environment-banner"');
    expect(workspace).toContain("turns detailed project-cost data into clear, timely information");
  });

  it("keeps sensitive details behind CEO or Finance role and interaction checks", () => {
    expect(workspace).toContain('const canManageTrailData = role === "finance" || role === "executive"');
    expect(workspace).toContain('const canSeeTransactions = role === "finance" || role === "executive"');
    expect(workspace).toContain("Employee names and compensation are not exposed");
  });

  it("provides the complete guided test-data import workflow", () => {
    expect(TEST_DATA_BANNER).toBe("Test Data — Not an Accounting System of Record");
    expect(workspace).toContain("Upload Project Data");
    expect(importLab).toContain('["Workspace", "Upload", "Map", "Validate", "Preview", "Import", "Review"]');
    expect(importLab).toContain("Create new");
    expect(importLab).toContain("Add to existing");
    expect(importLab).toContain("Replace existing");
    expect(importLab).toContain("Download controlled outputs");
  });

  it("offers an in-module guided tour anchored to the leadership decision flow", () => {
    // The workspace launches the tour and exposes every anchor the tour targets.
    expect(workspace).toContain("<ImbaTrailSolutionsTour");
    // KPI, billing, and tab regions carry the anchor directly; the decision and
    // portfolio cards receive it through the Card component's dataTour prop.
    for (const anchor of ["kpis", "billing", "tabs"]) {
      expect(workspace).toContain(`data-tour-ts="${anchor}"`);
    }
    expect(workspace).toContain('dataTour="decisions"');
    expect(workspace).toContain('dataTour="portfolio"');
    expect(workspace).toContain("data-tour-ts={dataTour}");
    // The tour walks the leadership questions in order and self-filters steps
    // whose anchor is absent (for example, the decisions card with none open).
    expect(tour).toContain('anchor: "kpis"');
    expect(tour).toContain('anchor: "decisions"');
    expect(tour).toContain('anchor: "portfolio"');
    expect(tour).toContain("Take the tour");
    expect(tour).toContain("step.anchor === null || document.querySelector");
  });

  it("gives CEO and Finance a direct upload entry point under Trail Solutions", () => {
    expect(cockpit).toContain('id: "trail-solutions-import"');
    expect(cockpit).toContain('label: "Upload data for analysis"');
    expect(cockpit).toContain('initialView={view === "trail-solutions-import" ? "import-lab" : "portfolio"}');
    expect(imbaRoleProfiles.finance.sectionViews?.["Trail Solutions"]).toContain("trail-solutions-import");
    expect(imbaRoleProfiles.executive.sectionViews).toBeUndefined();
    expect(workspace).toContain('initialView?: "portfolio" | "import-lab"');
    expect(workspace).toContain('role === "finance" || role === "executive"');
  });
});
