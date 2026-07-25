import type { ControlTotal } from "@/core/migration/model";
import type { MigrationBatchId, OrganizationId } from "@/core/primitives/identity";

export function compareControlTotal(input: {
  organizationId: OrganizationId;
  migrationBatchId: MigrationBatchId;
  sourceObject: string;
  sourceSystem: ControlTotal["sourceSystem"];
  destinationSystem: string;
  filterCriteria?: ControlTotal["filterCriteria"];
  metric: ControlTotal["metric"];
  groupKey?: string;
  expected: number;
  actual: number;
  currency?: string;
  calculationVersion: number;
  sourceCoverage: string;
  periodStart?: string;
  periodEnd?: string;
  calculatedAt: string;
}): ControlTotal {
  const variance = input.actual - input.expected;
  return Object.freeze({
    ...input,
    filterCriteria: input.filterCriteria ?? {},
    groupKey: input.groupKey ?? "ALL",
    variance,
    status: variance === 0 ? "PASS" : "FAIL",
  });
}

export function sumMinorAmounts(records: readonly { amountMinor: number }[]): number {
  return records.reduce((sum, item) => sum + item.amountMinor, 0);
}
