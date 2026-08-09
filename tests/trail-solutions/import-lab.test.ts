import { describe, expect, it, vi } from "vitest";
import ExcelJS from "exceljs";

// The import route now authorizes via the server-side Clerk session rather than a
// client header. Mock Clerk so the route can be unit-tested for signed-out (401),
// under-privileged (403), and authorized (pass) cases.
const clerkState = vi.hoisted(() => ({
  userId: null as string | null,
  role: null as string | null,
  email: null as string | null,
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: clerkState.userId }),
  currentUser: async () =>
    clerkState.userId
      ? {
          id: clerkState.userId,
          fullName: "Test User",
          primaryEmailAddress: clerkState.email ? { emailAddress: clerkState.email } : null,
          emailAddresses: clerkState.email ? [{ emailAddress: clerkState.email }] : [],
          publicMetadata: clerkState.role ? { role: clerkState.role } : {},
        }
      : null,
}));

import {
  applyImportMapping,
  inspectParsedImport,
  parseImportFiles,
} from "@/integrations/trail-solutions/import-parser";
import { detectImportTableName } from "@/core/trail-solutions/import-lab";
import { transformMappedImport } from "@/integrations/trail-solutions/import-transformer";
import { buildVersionRecord, mergeValidatedPackages } from "@/core/trail-solutions/workspace-transforms";
import { asOrganizationId } from "@/core/primitives/identity";
import { POST } from "@/app/api/trail-solutions/import/route";

const serverTime = "2026-08-06T14:00:00.000Z";

function csvFile(name: string, contents: string): File {
  return new File([contents], name, { type: "text/csv" });
}

function exactPlan(inspection: ReturnType<typeof inspectParsedImport>) {
  return inspection.tables.map((table) => ({
    sourceTableId: table.sourceTableId,
    targetTable: table.targetTable,
    columns: Object.fromEntries(table.columns.map((column) => [column.sourceHeader, column.targetField])),
  }));
}

async function validPackage(projectId = "TS-100") {
  const files = [
    csvFile("project-master.csv", [
      "Project ID,Project Name,Business Line,Customer / Funder,Project Manager,Original Contract Value ($),Start Date,Completion Date,Status",
      `${projectId},Safe Trail,Planning & Design,Public Client,,100000,2026-01-01,2026-12-31,Active`,
    ].join("\n")),
    csvFile("estimate-lines.csv", [
      "Project ID,Cost Type,Estimated Cost ($),Quantity",
      `${projectId},Direct labor,60000,1000`,
    ].join("\n")),
    csvFile("labor-actuals.csv", [
      "Project ID,Employee / Resource,Role,Work Date,Hours,Fully Burdened Labor Cost ($)",
      `${projectId},,Designer,2026-07-01,120,12000`,
    ].join("\n")),
    csvFile("project-summary.csv", [
      "Project ID,Estimate to Complete ($)",
      `${projectId},30000`,
    ].join("\n")),
  ];
  const parsed = await parseImportFiles(files, "Finance user", serverTime);
  const inspection = inspectParsedImport(parsed, serverTime);
  const mapped = applyImportMapping(parsed, exactPlan(inspection));
  return transformMappedImport({ mapped, files: parsed.files, serverTime });
}

describe("Trail Solutions Data Import Lab", () => {
  it("recognizes revised mart child sheets", () => {
    expect(detectImportTableName("Match Activity Detail")).toBe("Match Activity Detail");
    expect(detectImportTableName("Forecast Updates.csv")).toBe("Forecast Updates");
    expect(detectImportTableName("Unmapped Exceptions")).toBe("Unmapped Exceptions");
    expect(detectImportTableName("Shared Cost Allocation Rules")).toBe("Shared Cost Allocation Rules");
  });

  it("reads the standardized workbook shape with headers below title rows", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Project Master");
    sheet.addRow(["Trail Solutions import"]);
    sheet.addRow(["Use test-safe project information only"]);
    sheet.mergeCells("A2:C2");
    sheet.addRow([]);
    sheet.addRow(["Project ID", "Project Name", "Original Contract Value ($)"]);
    sheet.addRow(["TS-XLSX", "Workbook Project", 250000]);
    sheet.getCell("A6").value = { formula: "0", result: 0 };
    sheet.getCell("C6").value = { formula: "0", result: 0 };
    sheet.getCell("A7").value = { formula: "IF(1=0,1,\"\")" };
    const bytes = await workbook.xlsx.writeBuffer();
    const parsed = await parseImportFiles([new File([new Uint8Array(bytes)], "standardized.xlsx")], "Finance user", serverTime);

    expect(parsed.tables[0]).toMatchObject({ sourceTableName: "Project Master", detectedTable: "Project Master", headerRow: 4 });
    expect(parsed.tables[0].rows).toHaveLength(1);
    expect(parsed.tables[0].rows[0]).toMatchObject({ "Project ID": "TS-XLSX", "Project Name": "Workbook Project" });
  });

  it("requires a signed-in CEO or Finance user before processing files", async () => {
    // Signed out → 401 (middleware also blocks this in production; defense in depth).
    clerkState.userId = null;
    clerkState.role = null;
    const anonymous = await POST(new Request("http://localhost/api/trail-solutions/import", { method: "POST" }));
    expect(anonymous.status).toBe(401);

    // Signed in with no assigned IMBA role → 403 (never inherit Board access).
    clerkState.userId = "user_unassigned";
    clerkState.role = null;
    const unassigned = await POST(new Request("http://localhost/api/trail-solutions/import", { method: "POST" }));
    expect(unassigned.status).toBe(403);

    // Signed in but under-privileged role → 403.
    clerkState.userId = "user_board";
    clerkState.role = "board";
    const forbidden = await POST(new Request("http://localhost/api/trail-solutions/import", { method: "POST" }));
    expect(forbidden.status).toBe(403);

    // Signed in as CEO → allowed past the auth gate.
    clerkState.userId = "user_exec";
    clerkState.role = "executive";
    const executiveForm = new FormData();
    executiveForm.set("action", "inspect");
    const executiveResponse = await POST(new Request("http://localhost/api/trail-solutions/import", {
      method: "POST",
      body: executiveForm,
    }));
    expect(executiveResponse.status).not.toBe(403);
    expect(executiveResponse.status).not.toBe(401);
  });

  it("detects standardized CSV tables, maps exact headers, and redacts identity samples", async () => {
    const parsed = await parseImportFiles([
      csvFile("project-master.csv", "Project ID,Project Name,Project Manager\nTS-1,Project One,Private Name"),
    ], "Finance user", serverTime);
    const inspection = inspectParsedImport(parsed, serverTime);

    expect(inspection.tables[0]).toMatchObject({ targetTable: "Project Master", rowCount: 1 });
    expect(inspection.tables[0].columns.find((column) => column.sourceHeader === "Project ID")).toMatchObject({ targetField: "Project ID", confidence: "high" });
    expect(inspection.tables[0].columns.find((column) => column.sourceHeader === "Project Manager")?.sampleValues).toEqual(["[redacted]"]);
  });

  it("blocks unsupported files and obvious prohibited sensitive columns", async () => {
    await expect(parseImportFiles([new File(["unsafe"], "unsafe.txt")], "Finance user", serverTime)).rejects.toThrow(/not a supported/);

    const parsed = await parseImportFiles([
      csvFile("project-master.csv", "Project ID,Project Name,SSN\nTS-1,Project One,123-45-6789"),
    ], "Finance user", serverTime);
    expect(parsed.securityIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ severity: "error", code: "PROHIBITED_SENSITIVE_FIELD", field: "SSN" }),
    ]));

    const identity = await parseImportFiles([
      csvFile("labor-actuals.csv", "Project ID,Employee / Resource,Role,Fully Burdened Labor Cost ($)\nTS-1,Private Employee,Designer,100"),
    ], "Finance user", serverTime);
    expect(identity.securityIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ severity: "error", code: "PROHIBITED_EMPLOYEE_IDENTITY", field: "Employee / Resource" }),
    ]));
  });

  it("quarantines unknown project references and never assigns them silently", async () => {
    const files = [
      csvFile("project-master.csv", "Project ID,Project Name\nTS-1,Known Project"),
      csvFile("nonlabor-actuals.csv", "Project ID,Cost Type,Amount ($)\nUNKNOWN,Materials,900"),
    ];
    const parsed = await parseImportFiles(files, "Finance user", serverTime);
    const inspection = inspectParsedImport(parsed, serverTime);
    const result = await transformMappedImport({ mapped: applyImportMapping(parsed, exactPlan(inspection)), files: parsed.files, serverTime });

    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "UNRECOGNIZED_PROJECT_ID", projectCode: "UNKNOWN", quarantined: true }),
    ]));
    expect(result.snapshot.projects).toHaveLength(1);
    expect(result.preview.totalActualCost).toBe(0);
  });

  it("preserves separate financial facts and makes forecast availability explicit", async () => {
    const result = await validPackage();
    const project = result.snapshot.projects[0];

    expect(project).toMatchObject({
      projectCode: "TS-100",
      actualLaborHours: 120,
      actualLaborCost: 12000,
      estimatedCostToComplete: 30000,
    });
    expect(project.forecastFinalCost).toBe(project.actualCostToDate + 30000);
    expect(result.preview.controlTotals.every((control) => control.status === "reconciled")).toBe(true);
    expect(JSON.stringify(result.normalizedDataset)).not.toContain("Employee / Resource");
    expect(JSON.stringify(result.normalizedDataset)).not.toContain("Project Manager");
  });

  it("merges add-mode packages, guards against duplicate project ids, and records the real actor", async () => {
    const first = await validPackage("TS-101");
    const second = await validPackage("TS-202");

    // Add mode merges disjoint packages into one snapshot.
    const merged = mergeValidatedPackages(first, second);
    expect(merged.snapshot.projects.map((project) => project.projectCode).sort()).toEqual(["TS-101", "TS-202"]);
    expect(merged.preview.projectCount).toBe(first.preview.projectCount + second.preview.projectCount);

    // Integrity guard: the same project id cannot be added twice.
    expect(() => mergeValidatedPackages(first, first)).toThrow(/duplicate Project ID/);

    // Version records carry the authenticated identity (not a hardcoded prototype label).
    const record = buildVersionRecord({ package: first, mode: "create", importedBy: "Kent McNeill", mappingChangeCount: 2 });
    expect(record.importedBy).toBe("Kent McNeill");
    expect(record.mode).toBe("create");
    expect(record.mappingChangeCount).toBe(2);
    expect(record.recordsAccepted).toBe(first.preview.projectCount + first.preview.transactionCount);
  });

  it("rejects a package from another organization before merging", async () => {
    const first = await validPackage("TS-TENANT-1");
    const other = await validPackage("TS-TENANT-2");
    const crossTenant = { ...other, snapshot: { ...other.snapshot, organizationId: asOrganizationId("00000000-0000-4000-8000-000000000099") } };
    expect(() => mergeValidatedPackages(first, crossTenant)).toThrow(/different organizations/);
  });
});
