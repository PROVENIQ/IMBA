import { assertNoPlaintextPii } from "../pii/pii-reference";
import type { EventId, OrganizationId, StreamId } from "../primitives/identity";
import type { JsonObject, JsonValue } from "../primitives/json";
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
  readonly #streamOrganizations = new Map<StreamId, OrganizationId>();

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
    const streamOrganization = this.#streamOrganizations.get(event.streamId);
    if (streamOrganization && streamOrganization !== event.organizationId) {
      throw new Error("stream cannot cross organization boundaries");
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
    this.schemas.assertWritable(event.eventName, event.schemaVersion, event.payload);

    const serverIngestedAt = this.now();
    const serverRecordedAt = this.now();

    const stored: StoredEvent = Object.freeze({
      ...event,
      payload: freezeJsonObject(structuredClone(event.payload)),
      sourceMetadata: freezeJsonObject(
        structuredClone(event.sourceMetadata ?? ({} as JsonObject)),
      ),
      streamVersion: actualVersion + 1,
      ledgerPosition: BigInt(this.#events.length + 1),
      ingestedAt: serverIngestedAt,
      recordedAt: serverRecordedAt,
    });

    this.#events.push(stored);
    this.#eventIds.add(event.eventId);
    this.#streamVersions.set(event.streamId, stored.streamVersion);
    this.#streamOrganizations.set(event.streamId, event.organizationId);
    return stored;
  }

  readAll(
    organizationId: OrganizationId,
    afterLedgerPosition = BigInt(0),
  ): readonly StoredEvent[] {
    return this.#events.filter(
      (event) =>
        event.organizationId === organizationId &&
        event.ledgerPosition > afterLedgerPosition,
    );
  }

  readStream(
    organizationId: OrganizationId,
    streamId: StreamId,
  ): readonly StoredEvent[] {
    return this.#events.filter(
      (event) =>
        event.organizationId === organizationId && event.streamId === streamId,
    );
  }
}

function freezeJsonObject(value: JsonObject): JsonObject {
  freezeJson(value);
  return value;
}

function freezeJson(value: JsonValue): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach(freezeJson);
  } else {
    Object.values(value).forEach(freezeJson);
  }
  Object.freeze(value);
}
