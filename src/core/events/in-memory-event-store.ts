import { assertNoPlaintextPii } from "../pii/pii-reference";
import type { EventId, StreamId } from "../primitives/identity";
import type { JsonObject } from "../primitives/json";
import type { ProposedEvent, StoredEvent } from "./event-envelope";
import type { EventSchemaRegistry } from "./upcaster-registry";

export class StreamVersionConflictError extends Error {
  constructor(
    public readonly streamId: StreamId,
    public readonly expected: number,
    public readonly actual: number,
  ) {
    super(`stream ${streamId} version conflict: expected ${expected}, actual ${actual}`);
    this.name = "StreamVersionConflictError";
  }
}

export class InMemoryEventStore {
  readonly #events: StoredEvent[] = [];
  readonly #eventIds = new Set<EventId>();
  readonly #streamVersions = new Map<StreamId, number>();

  constructor(
    private readonly schemas: EventSchemaRegistry,
    private readonly now: () => string,
  ) {}

  append(event: ProposedEvent, expectedStreamVersion: number): StoredEvent {
    if (!Number.isSafeInteger(expectedStreamVersion) || expectedStreamVersion < 0) {
      throw new TypeError("expectedStreamVersion must be a non-negative integer");
    }

    if (this.#eventIds.has(event.eventId)) {
      throw new Error(`duplicate eventId: ${event.eventId}`);
    }

    const actualVersion = this.#streamVersions.get(event.streamId) ?? 0;
    if (actualVersion !== expectedStreamVersion) {
      throw new StreamVersionConflictError(
        event.streamId,
        expectedStreamVersion,
        actualVersion,
      );
    }

    assertNoPlaintextPii(event.payload);
    this.schemas.assertWritable(event.eventType, event.schemaVersion, event.payload);

    const stored: StoredEvent = Object.freeze({
      ...event,
      payload: structuredClone(event.payload),
      metadata: structuredClone(event.metadata ?? ({} as JsonObject)),
      streamVersion: actualVersion + 1,
      ledgerPosition: BigInt(this.#events.length + 1),
      recordedAt: this.now(),
    });

    this.#events.push(stored);
    this.#eventIds.add(event.eventId);
    this.#streamVersions.set(event.streamId, stored.streamVersion);
    return stored;
  }

  readAll(afterLedgerPosition = BigInt(0)): readonly StoredEvent[] {
    return this.#events.filter(
      (event) => event.ledgerPosition > afterLedgerPosition,
    );
  }

  readStream(streamId: StreamId): readonly StoredEvent[] {
    return this.#events.filter((event) => event.streamId === streamId);
  }
}
