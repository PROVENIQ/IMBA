import { describe, expect, it } from "vitest";

import { compareControlTotal, sumMinorAmounts } from "../../src/core/migration/control-totals";
import { VersionedCrosswalk } from "../../src/core/migration/crosswalk";
import { appendFinancialResolution } from "../../src/core/reconciliation/financial-reconciliation";
import {
  asActorId,
  asFieldMappingId,
  asMigrationBatchId,
  asOrganizationId,
  asReconciliationCaseId,
} from "../../src/core/primitives/identity";
import { CiviCrmCsvSource, parseCiviCsv } from "../../src/integrations/civicrm/csv-source";

const organizationId = asOrganizationId("30000000-0000-4000-8000-000000000001");
const otherOrganizationId = asOrganizationId("30000000-0000-4000-8000-000000000002");
const actorId = asActorId("30000000-0000-4000-8000-000000000003");
const mappingId = asFieldMappingId("30000000-0000-4000-8000-000000000004");
const migrationBatchId = asMigrationBatchId("30000000-0000-4000-8000-000000000005");

describe("migration assurance domain", () => {
  it("retains crosswalk version history instead of overwriting approvals", () => {
    const crosswalk = new VersionedCrosswalk();
    const base = {
      id: mappingId,
      organizationId,
      sourceSystem: "CIVICRM" as const,
      sourceEntity: "contacts",
      sourceField: "do_not_email",
      canonicalField: "Suppression.EMAIL",
      destinationSystem: "EVERYACTION",
      destinationEntity: "Contacts",
      destinationField: "doNotEmail",
      transformRule: { kind: "COPY" as const },
      validationRules: ["SUPPRESSION_PRESERVED"],
      prerequisiteMappings: [],
      confidence: 100,
      proposedBy: actorId,
    };
    const timestamps = {
      occurredAt: "2026-07-24T10:00:00.000Z",
      ingestedAt: "2026-07-24T10:00:01.000Z",
      recordedAt: "2026-07-24T10:00:02.000Z",
    };
    crosswalk.approve(organizationId, crosswalk.propose(base, timestamps).id, actorId, timestamps.recordedAt);
    crosswalk.propose(base, { ...timestamps, occurredAt: "2026-07-25T10:00:00.000Z" });
    expect(crosswalk.list(organizationId).map((item) => [item.version, item.status])).toEqual([
      [1, "APPROVED"],
      [2, "PROPOSED"],
    ]);
    expect(crosswalk.list(otherOrganizationId)).toEqual([]);
  });

  it("calculates unrounded count and amount differences", () => {
    const total = compareControlTotal({
      organizationId,
      migrationBatchId,
      sourceObject: "contributions",
      sourceSystem: "CIVICRM",
      destinationSystem: "EVERYACTION",
      metric: "AMOUNT_MINOR",
      expected: 10001,
      actual: 10000,
      currency: "USD",
      calculationVersion: 1,
      sourceCoverage: "full synthetic export",
      calculatedAt: "2026-07-24T10:00:00.000Z",
    });
    expect(total).toMatchObject({ variance: -1, status: "FAIL" });
    expect(sumMinorAmounts([{ amountMinor: 1 }, { amountMinor: 2 }])).toBe(3);
  });

  it("parses every CiviCRM CSV row and gives it a staged disposition", async () => {
    const csv = 'id,display_name,total_amount\n1,"Person, One",10.25\n2,Person Two,20.00\n';
    expect(parseCiviCsv(csv)).toHaveLength(2);
    const source = new CiviCrmCsvSource(
      [{ entity: "contacts", fileName: "contacts.csv", csv }],
      "2026-07-24T10:00:00.000Z",
    );
    const records = [];
    for await (const record of source.streamSourceRecords("contacts")) records.push(record);
    expect(records).toHaveLength(2);
    expect(records.every((record) => record.disposition === "STAGED")).toBe(true);
    expect(records[0].redactedSnapshot.display_name).toBe("[REDACTED]");
  });

  it("appends immutable financial resolutions and blocks cross-tenant resolution", () => {
    const reconciliationCase = {
      reconciliationCaseId: asReconciliationCaseId("30000000-0000-4000-8000-000000000006"),
      organizationId,
      status: "AMOUNT_DIFFERENCE" as const,
      evidence: { evidenceReferences: ["synthetic://batch/1"] },
      openedAt: "2026-07-24T10:00:00.000Z",
      resolutions: [],
    };
    const resolution = {
      actorId,
      reason: "Synthetic designation mapping accepted",
      evidenceReference: "synthetic://decision/1",
      occurredAt: "2026-07-24T11:00:00.000Z",
      ingestedAt: "2026-07-24T11:00:01.000Z",
      recordedAt: "2026-07-24T11:00:02.000Z",
      correlationId: "30000000-0000-4000-8000-000000000007",
      causationId: "30000000-0000-4000-8000-000000000008",
    };
    const resolved = appendFinancialResolution(reconciliationCase, organizationId, resolution);
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolutions).toHaveLength(1);
    expect(reconciliationCase.resolutions).toEqual([]);
    expect(() => appendFinancialResolution(reconciliationCase, otherOrganizationId, resolution)).toThrow(
      "Cross-organization",
    );
  });
});
