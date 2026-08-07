import { describe, expect, it } from "vitest";

import { InMemoryEventStore } from "../../src/core/events/in-memory-event-store";
import { EventSchemaRegistry } from "../../src/core/events/upcaster-registry";
import { rebuildProjection } from "../../src/core/projections/rebuild";
import {
  asActorId,
  asOrganizationId,
  asProjectId,
  asStreamId,
} from "../../src/core/primitives/identity";
import { asCurrencyCode, money } from "../../src/core/primitives/money";
import {
  proposeProjectFinancialForecastRecorded,
  registerTrailSolutionsEventSchemas,
} from "../../src/core/trail-solutions/events";
import { projectForecastProjection } from "../../src/core/trail-solutions/projection";

const organizationId = asOrganizationId("90000000-0000-4000-8000-000000000001");
const otherOrganizationId = asOrganizationId("90000000-0000-4000-8000-000000000002");
const projectId = asProjectId("10000000-0000-4000-8000-000000000001");
const actor = {
  actorId: asActorId("70000000-0000-4000-8000-000000000001"),
  actorType: "SYSTEM" as const,
  displayRole: "workbook import",
};
const usd = asCurrencyCode("USD");
const dollars = (value: number) => money(BigInt(value * 100), usd);

function forecastEvent(actualCostToDate: number, streamId = asStreamId("60000000-0000-4000-8000-000000000001"), tenant = organizationId) {
  return proposeProjectFinancialForecastRecorded({
    streamId,
    organizationId: tenant,
    occurredAt: "2026-08-04T12:00:00.000Z",
    actor,
    projectId,
    projectCode: "TS-DEMO-PLN-26-01",
    actualCostToDate: dollars(actualCostToDate),
    estimatedCostToComplete: dollars(70_000),
    forecastFinalCost: dollars(actualCostToDate + 70_000),
    forecastMargin: dollars(255_000 - actualCostToDate - 70_000),
    sourceSnapshotId: "workbook-derived-demo-v1",
  });
}

describe("Trail Solutions event schema and projection", () => {
  it("records canonical tenant, trace, source, and three-time context", () => {
    const registry = registerTrailSolutionsEventSchemas(new EventSchemaRegistry());
    const store = new InMemoryEventStore(registry, () => "2026-08-04T12:00:05.000Z");
    const stored = store.append(forecastEvent(120_000), 0);
    expect(stored.eventName).toBe("PROJECT_FINANCIAL_FORECAST_RECORDED");
    expect(stored.organizationId).toBe(organizationId);
    expect(stored.chapterScope).toEqual({ kind: "NATIONAL" });
    expect(stored.sourceSystem).toBe("WORKBOOK_IMPORT");
    expect(stored.occurredAt).toBe("2026-08-04T12:00:00.000Z");
    expect(stored.ingestedAt).toBe("2026-08-04T12:00:05.000Z");
    expect(stored.recordedAt).toBe("2026-08-04T12:00:05.000Z");
    expect(stored.correlationId).toBeTruthy();
    expect(stored.causationId).toBeTruthy();
  });

  it("rebuilds the same latest forecast from immutable events and isolates tenants", () => {
    const registry = registerTrailSolutionsEventSchemas(new EventSchemaRegistry());
    const times = [
      "2026-08-04T12:00:05.000Z",
      "2026-08-04T12:00:06.000Z",
      "2026-08-05T12:00:05.000Z",
      "2026-08-05T12:00:06.000Z",
      "2026-08-05T12:00:07.000Z",
      "2026-08-05T12:00:08.000Z",
    ];
    const store = new InMemoryEventStore(registry, () => times.shift() ?? "2026-08-05T12:00:09.000Z");
    store.append(forecastEvent(120_000), 0);
    store.append(forecastEvent(130_000), 1);
    store.append(
      forecastEvent(
        999_000,
        asStreamId("60000000-0000-4000-8000-000000000002"),
        otherOrganizationId,
      ),
      0,
    );
    const events = [...store.readAll(organizationId), ...store.readAll(otherOrganizationId)];
    const first = rebuildProjection(projectForecastProjection, organizationId, events);
    const second = rebuildProjection(projectForecastProjection, organizationId, [...events].reverse());
    expect(first.state).toEqual(second.state);
    expect(first.eventCount).toBe(2);
    expect(first.state[projectId].actualCostToDate.minorUnits).toBe(BigInt("13000000"));
    expect(first.state[projectId].forecastFinalCost?.minorUnits).toBe(BigInt("20000000"));
  });
});
