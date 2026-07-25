import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CRM_SYNTHETIC_BANNER,
  crosswalkRows,
  initialExceptions,
  integrationReadiness,
  reconciliationRows,
  replacementReadiness,
  syntheticConstituents,
} from "../../src/lib/imba-crm-migration-data";

const migration = readFileSync(
  resolve(process.cwd(), "db/migrations/0002_crm_migration_foundation.sql"),
  "utf8",
);
const workspace = readFileSync(
  resolve(process.cwd(), "src/components/imba/ImbaCrmMigrationWorkspace.tsx"),
  "utf8",
);

describe("CRM migration end-to-end demonstration contract", () => {
  it("provides the complete primary walkthrough using synthetic data", () => {
    expect(syntheticConstituents.length).toBeGreaterThanOrEqual(500);
    expect(crosswalkRows.some((row) => row.entity === "memberships" && row.status === "REQUIRES_DECISION")).toBe(true);
    expect(initialExceptions.some((item) => item.rule === "MISSING_DESIGNATION")).toBe(true);
    expect(
      reconciliationRows.some(
        (item) =>
          Number(item.difference) !== 0 &&
          Number(item.quickbooks) !== Number(item.contributions),
      ),
    ).toBe(true);
    expect(integrationReadiness.find((item) => item.connector === "EveryAction bulk import")?.status).toBe("WRITE_DISABLED");
    expect(replacementReadiness).toHaveLength(24);
    expect(replacementReadiness.every((item) => item.everyActionUse === "UNKNOWN")).toBe(true);
  });

  it("renders the required synthetic banner from a single exact constant", () => {
    expect(CRM_SYNTHETIC_BANNER).toBe(
      "Synthetic demonstration data — not connected to IMBA systems.",
    );
    expect(workspace).toContain('data-testid="synthetic-data-banner"');
    expect(workspace).toContain("CRM_SYNTHETIC_BANNER");
  });

  it("hardens the ledger and tenant-scopes every new operational read model", () => {
    expect(migration).toContain("add column organization_id uuid not null");
    expect(migration).toContain("add column ingested_at timestamptz not null");
    expect(migration).toContain("alter column causation_id set not null");
    expect(migration).toContain("event_ledger_event_name_format");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("sync_cursors_projection");
    expect(migration).toContain("source_records_are_immutable");
  });
});
