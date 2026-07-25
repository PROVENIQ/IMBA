import { describe, expect, it } from "vitest";

import type { ProposedEvent, StoredEvent } from "../../src/core/events/event-envelope";
import { InMemoryEventStore } from "../../src/core/events/in-memory-event-store";
import { EventSchemaRegistry } from "../../src/core/events/upcaster-registry";
import { rebuildProjection } from "../../src/core/projections/rebuild";
import {
  asActorId,
  asCausationId,
  asCorrelationId,
  asEventId,
  asOrganizationId,
  asStreamId,
} from "../../src/core/primitives/identity";

const organizationId = asOrganizationId("40000000-0000-4000-8000-000000000001");
const otherOrganizationId = asOrganizationId("40000000-0000-4000-8000-000000000002");
const actorId = asActorId("40000000-0000-4000-8000-000000000003");
const streamId = asStreamId("40000000-0000-4000-8000-000000000004");

function proposal(
  eventId: string,
  organization = organizationId,
  eventName = "CONTRIBUTION_RECORDED",
): ProposedEvent {
  return {
    eventId: asEventId(eventId),
    streamId,
    streamType: "contribution",
    eventName,
    eventVersion: 1,
    schemaVersion: 1,
    organizationId: organization,
    chapterScope: { kind: "NATIONAL" },
    occurredAt: "2026-07-20T00:00:00.000Z",
    correlationId: asCorrelationId("40000000-0000-4000-8000-000000000005"),
    causationId: asCausationId("40000000-0000-4000-8000-000000000006"),
    actor: { actorId, actorType: "SYSTEM", displayRole: "migration" },
    sourceSystem: "SYNTHETIC",
    payload: { amountMinor: 1000, currency: "USD" },
    sourceMetadata: { providerModifiedAt: "2026-07-24T00:00:00.000Z" },
  };
}

function registry(): EventSchemaRegistry {
  const schemas = new EventSchemaRegistry();
  for (const eventName of ["CONTRIBUTION_RECORDED", "CONTRIBUTION_ADJUSTED"]) {
    schemas.register({
      eventName,
      currentVersion: 1,
      validateCurrent: (payload) => {
        if (typeof payload.amountMinor !== "number") throw new TypeError("amount required");
      },
    });
  }
  return schemas;
}

describe("canonical CRM event and projection invariants", () => {
  it("server-stamps receipt and record time, freezes history, and retains trace context", () => {
    const timestamps = ["2026-07-24T12:00:01.000Z", "2026-07-24T12:00:02.000Z"];
    const store = new InMemoryEventStore(registry(), () => timestamps.shift()!);
    const event = store.append(proposal("40000000-0000-4000-8000-000000000007"), 0);
    expect(event.ingestedAt).toBe("2026-07-24T12:00:01.000Z");
    expect(event.recordedAt).toBe("2026-07-24T12:00:02.000Z");
    expect(event.correlationId).toBe("40000000-0000-4000-8000-000000000005");
    expect(event.causationId).toBe("40000000-0000-4000-8000-000000000006");
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.payload)).toBe(true);
    expect(() => {
      (event.payload as { amountMinor: number }).amountMinor = 500;
    }).toThrow();
  });

  it("prevents a stream from crossing organizations", () => {
    const store = new InMemoryEventStore(registry(), () => "2026-07-24T12:00:01.000Z");
    store.append(proposal("40000000-0000-4000-8000-000000000007"), 0);
    expect(() =>
      store.append(
        proposal("40000000-0000-4000-8000-000000000008", otherOrganizationId),
        1,
      ),
    ).toThrow("stream cannot cross organization");
    expect(store.readAll(otherOrganizationId)).toEqual([]);
  });

  it("rebuilds contribution state from recorded and adjustment history for one tenant", () => {
    const base = proposal("40000000-0000-4000-8000-000000000007");
    const events: StoredEvent[] = [
      {
        ...base,
        ledgerPosition: BigInt(1),
        streamVersion: 1,
        ingestedAt: "2026-07-24T12:00:01.000Z",
        recordedAt: "2026-07-24T12:00:02.000Z",
        sourceMetadata: {},
      },
      {
        ...base,
        eventId: asEventId("40000000-0000-4000-8000-000000000008"),
        eventName: "CONTRIBUTION_ADJUSTED",
        payload: { amountMinor: -250 },
        ledgerPosition: BigInt(2),
        streamVersion: 2,
        ingestedAt: "2026-07-24T12:01:01.000Z",
        recordedAt: "2026-07-24T12:01:02.000Z",
        sourceMetadata: {},
      },
      {
        ...base,
        eventId: asEventId("40000000-0000-4000-8000-000000000009"),
        organizationId: otherOrganizationId,
        ledgerPosition: BigInt(3),
        streamVersion: 1,
        ingestedAt: "2026-07-24T12:02:01.000Z",
        recordedAt: "2026-07-24T12:02:02.000Z",
        sourceMetadata: {},
      },
    ];
    const projection = rebuildProjection(
      {
        name: "contribution-balance",
        version: 1,
        initialState: () => ({ amountMinor: 0 }),
        apply: (state, event) => ({
          amountMinor: state.amountMinor + Number(event.payload.amountMinor),
        }),
      },
      organizationId,
      events,
    );
    expect(projection).toMatchObject({ eventCount: 2, state: { amountMinor: 750 } });
    expect(projection.lastLedgerPosition).toBe(BigInt(2));
  });
});
