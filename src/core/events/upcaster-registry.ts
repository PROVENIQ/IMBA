import { assertNoPlaintextPii } from "../pii/pii-reference";
import {
  assertJsonObject,
  canonicalJson,
  type JsonObject,
} from "../primitives/json";
import type { CurrentEvent, StoredEvent } from "./event-envelope";

export type EventUpcaster = (payload: Readonly<JsonObject>) => JsonObject;

export interface EventSchemaDefinition {
  readonly eventType: string;
  readonly currentVersion: number;
  readonly upcasters?: Readonly<Record<number, EventUpcaster>>;
  readonly validateCurrent: (payload: Readonly<JsonObject>) => void;
}

export class EventSchemaRegistry {
  readonly #definitions = new Map<string, EventSchemaDefinition>();

  register(definition: EventSchemaDefinition): void {
    if (this.#definitions.has(definition.eventType)) {
      throw new Error(`event type already registered: ${definition.eventType}`);
    }

    if (!Number.isSafeInteger(definition.currentVersion) || definition.currentVersion <= 0) {
      throw new TypeError("currentVersion must be a positive integer");
    }

    for (let version = 1; version < definition.currentVersion; version += 1) {
      if (!definition.upcasters?.[version]) {
        throw new Error(
          `missing contiguous upcaster for ${definition.eventType} v${version} -> v${version + 1}`,
        );
      }
    }

    this.#definitions.set(definition.eventType, Object.freeze({ ...definition }));
  }

  assertWritable(eventType: string, schemaVersion: number, payload: JsonObject): void {
    const definition = this.#definitionFor(eventType);
    if (schemaVersion !== definition.currentVersion) {
      throw new Error(
        `writers must emit current ${eventType} schema v${definition.currentVersion}; received v${schemaVersion}`,
      );
    }

    assertNoPlaintextPii(payload);
    definition.validateCurrent(payload);
  }

  normalize(event: StoredEvent): CurrentEvent {
    const definition = this.#definitionFor(event.eventType);
    if (event.schemaVersion > definition.currentVersion) {
      throw new Error(
        `unknown future schema for event ${event.eventId}: ${event.eventType} v${event.schemaVersion}`,
      );
    }

    let payload = structuredClone(event.payload);
    const storedSchemaVersion = event.schemaVersion;

    for (let version = storedSchemaVersion; version < definition.currentVersion; version += 1) {
      const upcaster = definition.upcasters?.[version];
      if (!upcaster) {
        throw new Error(
          `missing upcaster for event ${event.eventId}: ${event.eventType} v${version} -> v${version + 1}`,
        );
      }

      const first = upcaster(structuredClone(payload));
      const second = upcaster(structuredClone(payload));
      assertJsonObject(first, `${event.eventType} v${version + 1} payload`);
      assertJsonObject(second, `${event.eventType} v${version + 1} payload`);
      if (canonicalJson(first) !== canonicalJson(second)) {
        throw new Error(
          `non-deterministic upcaster for ${event.eventType} v${version} -> v${version + 1}`,
        );
      }
      payload = first;
    }

    assertNoPlaintextPii(payload);
    definition.validateCurrent(payload);

    return Object.freeze({
      ...event,
      payload,
      schemaVersion: definition.currentVersion,
      storedSchemaVersion,
    });
  }

  #definitionFor(eventType: string): EventSchemaDefinition {
    const definition = this.#definitions.get(eventType);
    if (!definition) {
      throw new Error(`unknown event type: ${eventType}`);
    }
    return definition;
  }
}
