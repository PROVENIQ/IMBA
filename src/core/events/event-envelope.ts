import type {
  CausationId,
  CorrelationId,
  EventId,
  PiiContextId,
  StreamId,
} from "../primitives/identity";
import type { JsonObject } from "../primitives/json";

export interface ProposedEvent {
  readonly eventId: EventId;
  readonly streamId: StreamId;
  readonly streamType: string;
  readonly eventType: string;
  readonly schemaVersion: number;
  readonly occurredAt: string;
  readonly correlationId: CorrelationId;
  readonly causationId?: CausationId;
  readonly piiContextId?: PiiContextId;
  readonly payload: JsonObject;
  readonly metadata?: JsonObject;
}

export interface StoredEvent extends ProposedEvent {
  readonly ledgerPosition: bigint;
  readonly streamVersion: number;
  readonly recordedAt: string;
  readonly metadata: JsonObject;
}

export interface CurrentEvent extends StoredEvent {
  readonly storedSchemaVersion: number;
}
