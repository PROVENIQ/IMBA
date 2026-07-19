import fixtureV1 from "../fixtures/architecture-fixture-recorded.v1.json";
import { describe, expect, it } from "vitest";

import { InMemoryEventStore, StreamVersionConflictError } from "../../src/core/events/in-memory-event-store";
import type { ProposedEvent, StoredEvent } from "../../src/core/events/event-envelope";
import { EventSchemaRegistry } from "../../src/core/events/upcaster-registry";
import {
  asCorrelationId,
  asEventId,
  asStreamId,
} from "../../src/core/primitives/identity";
import type { JsonObject } from "../../src/core/primitives/json";

const eventId = asEventId("11111111-1111-4111-8111-111111111111");
const secondEventId = asEventId("33333333-3333-4333-8333-333333333333");
const streamId = asStreamId("22222222-2222-4222-8222-222222222222");
const correlationId = asCorrelationId("44444444-4444-4444-8444-444444444444");

function fixtureRegistry(): EventSchemaRegistry {
  const registry = new EventSchemaRegistry();
  registry.register({
    eventType: "ArchitectureFixtureRecorded",
    currentVersion: 2,
    upcasters: {
      1: (payload) => ({ ...payload, classification: "foundation" }),
    },
    validateCurrent: (payload) => {
      if (
        payload.classification !== "foundation" ||
        typeof payload.fixtureName !== "string" ||
        typeof payload.sequence !== "number"
      ) {
        throw new TypeError("invalid ArchitectureFixtureRecorded payload");
      }
    },
  });
  return registry;
}

function proposed(
  id = eventId,
  payload: JsonObject = {
    fixtureName: "phase-zero-ledger",
    sequence: 8,
    classification: "foundation",
  },
): ProposedEvent {
  return {
    eventId: id,
    streamId,
    streamType: "architecture-fixture",
    eventType: "ArchitectureFixtureRecorded",
    schemaVersion: 2,
    occurredAt: "2026-07-19T12:00:00.000Z",
    correlationId,
    payload,
  };
}

describe("event schema registry", () => {
  it("upcasts a historical fixture without rewriting its recorded version", () => {
    const stored: StoredEvent = {
      ...proposed(eventId, fixtureV1),
      schemaVersion: 1,
      streamVersion: 1,
      ledgerPosition: BigInt(1),
      recordedAt: "2026-07-19T12:01:00.000Z",
      metadata: {},
    };

    const current = fixtureRegistry().normalize(stored);

    expect(current.schemaVersion).toBe(2);
    expect(current.storedSchemaVersion).toBe(1);
    expect(current.payload).toEqual({
      fixtureName: "phase-zero-ledger",
      sequence: 7,
      classification: "foundation",
    });
  });

  it("rejects a registry with a missing adjacent upcaster", () => {
    const registry = new EventSchemaRegistry();
    expect(() =>
      registry.register({
        eventType: "BrokenFixture",
        currentVersion: 3,
        upcasters: { 1: (payload) => ({ ...payload }) },
        validateCurrent: () => undefined,
      }),
    ).toThrow("missing contiguous upcaster");
  });

  it("detects a non-deterministic upcaster", () => {
    let invocation = 0;
    const registry = new EventSchemaRegistry();
    registry.register({
      eventType: "UnstableFixture",
      currentVersion: 2,
      upcasters: {
        1: (payload) => ({ ...payload, invocation: (invocation += 1) }),
      },
      validateCurrent: () => undefined,
    });

    const stored: StoredEvent = {
      ...proposed(),
      eventType: "UnstableFixture",
      schemaVersion: 1,
      streamVersion: 1,
      ledgerPosition: BigInt(1),
      recordedAt: "2026-07-19T12:01:00.000Z",
      metadata: {},
    };

    expect(() => registry.normalize(stored)).toThrow("non-deterministic upcaster");
  });

  it("fails loudly on future schemas", () => {
    const stored: StoredEvent = {
      ...proposed(),
      schemaVersion: 3,
      streamVersion: 1,
      ledgerPosition: BigInt(1),
      recordedAt: "2026-07-19T12:01:00.000Z",
      metadata: {},
    };

    expect(() => fixtureRegistry().normalize(stored)).toThrow("unknown future schema");
  });
});

describe("event store invariants", () => {
  it("assigns global ledger position and enforces stream version", () => {
    const store = new InMemoryEventStore(
      fixtureRegistry(),
      () => "2026-07-19T12:02:00.000Z",
    );

    const first = store.append(proposed(), 0);
    const second = store.append(proposed(secondEventId), 1);

    expect(first.ledgerPosition).toBe(BigInt(1));
    expect(second.ledgerPosition).toBe(BigInt(2));
    expect(second.streamVersion).toBe(2);
    expect(store.readAll(BigInt(1))).toEqual([second]);

    expect(() =>
      store.append(
        proposed(asEventId("55555555-5555-4555-8555-555555555555")),
        0,
      ),
    ).toThrow(StreamVersionConflictError);
  });

  it("rejects searchable plaintext PII in an immutable payload", () => {
    const store = new InMemoryEventStore(
      fixtureRegistry(),
      () => "2026-07-19T12:02:00.000Z",
    );

    expect(() =>
      store.append(
        proposed(eventId, {
          fixtureName: "phase-zero-ledger",
          sequence: 8,
          classification: "foundation",
          emailAddress: "person@example.org",
        }),
        0,
      ),
    ).toThrow("encrypted PII reference");
  });
});
