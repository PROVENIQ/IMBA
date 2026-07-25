import { assertNoPlaintextPii } from "../pii/pii-reference";
import {
  assertJsonObject,
  canonicalJson,
  type JsonObject,
} from "../primitives/json";
import type { CurrentEvent, StoredEvent } from "./event-envelope";

export type EventUpcaster = (payload: Readonly<JsonObject>) => JsonObject;

export interface EventSchemaDefinition {
  readonly eventName: string;
  readonly currentVersion: number;
  readonly upcasters?: Readonly<Record<number, EventUpcaster>>;
  readonly validateCurrent: (payload: Readonly<JsonObject>) => void;
}

export class EventSchemaRegistry {
  readonly #definitions = new Map<string, EventSchemaDefinition>();

  register(definition: EventSchemaDefinition): void {
    if (!/^[A-Z][A-Z0-9_]*$/.test(definition.eventName)) {
      throw new TypeError("eventName must use SCREAMING_SNAKE_CASE");
    }
    if (this.#definitions.has(definition.eventName)) {
      throw new Error(`event type already registered: ${definition.eventName}`);
    }

    if (!Number.isSafeInteger(definition.currentVersion) || definition.currentVersion <= 0) {
      throw new TypeError("currentVersion must be a positive integer");
    }

    for (let version = 1; version < definition.currentVersion; version += 1) {
      if (!definition.upcasters?.[version]) {
        throw new Error(
          `missing contiguous upcaster for ${definition.eventName} v${version} -> v${version + 1}`,
        );
      }
    }

    this.#definitions.set(definition.eventName, Object.freeze({ ...definition }));
  }

  assertWritable(eventName: string, schemaVersion: number, payload: JsonObject): void {
    const definition = this.#definitionFor(eventName);
    if (schemaVersion !== definition.currentVersion) {
      throw new Error(
        `writers must emit current ${eventName} schema v${definition.currentVersion}; received v${schemaVersion}`,
      );
    }

    assertNoPlaintextPii(payload);
    definition.validateCurrent(payload);
  }

  normalize(event: StoredEvent): CurrentEvent {
    const definition = this.#definitionFor(event.eventName);
    if (event.schemaVersion > definition.currentVersion) {
      throw new Error(
        `unknown future schema for event ${event.eventId}: ${event.eventName} v${event.schemaVersion}`,
      );
    }

    let payload = structuredClone(event.payload);
    const storedSchemaVersion = event.schemaVersion;

    for (let version = storedSchemaVersion; version < definition.currentVersion; version += 1) {
      const upcaster = definition.upcasters?.[version];
      if (!upcaster) {
        throw new Error(
          `missing upcaster for event ${event.eventId}: ${event.eventName} v${version} -> v${version + 1}`,
        );
      }

      const first = upcaster(structuredClone(payload));
      const second = upcaster(structuredClone(payload));
      assertJsonObject(first, `${event.eventName} v${version + 1} payload`);
      assertJsonObject(second, `${event.eventName} v${version + 1} payload`);
      if (canonicalJson(first) !== canonicalJson(second)) {
        throw new Error(
          `non-deterministic upcaster for ${event.eventName} v${version} -> v${version + 1}`,
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

  #definitionFor(eventName: string): EventSchemaDefinition {
    const definition = this.#definitions.get(eventName);
    if (!definition) {
      throw new Error(`unknown event type: ${eventName}`);
    }
    return definition;
  }
}
