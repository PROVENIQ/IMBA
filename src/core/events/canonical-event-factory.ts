import type {
  CanonicalSourceSystem,
  ChapterScope,
  EventActor,
  ProposedEvent,
} from "@/core/events/event-envelope";
import {
  newCausationId,
  newCorrelationId,
  newEventId,
  type CorrelationId,
  type OrganizationId,
  type PiiContextId,
  type StreamId,
} from "@/core/primitives/identity";
import type { JsonObject } from "@/core/primitives/json";

const EVENT_NAME_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

export function proposeCanonicalEvent(input: {
  streamId: StreamId;
  streamType: string;
  eventName: string;
  eventVersion?: number;
  schemaVersion?: number;
  organizationId: OrganizationId;
  chapterScope?: ChapterScope;
  occurredAt: string;
  correlationId?: CorrelationId;
  actor: EventActor;
  sourceSystem: CanonicalSourceSystem;
  piiContextId?: PiiContextId;
  payload: JsonObject;
  sourceMetadata?: JsonObject;
}): ProposedEvent {
  if (!EVENT_NAME_PATTERN.test(input.eventName)) {
    throw new TypeError("eventName must be SCREAMING_SNAKE_CASE");
  }
  if (Number.isNaN(Date.parse(input.occurredAt))) {
    throw new TypeError("occurredAt must be an ISO-8601 timestamp");
  }
  return Object.freeze({
    eventId: newEventId(),
    streamId: input.streamId,
    streamType: input.streamType,
    eventName: input.eventName,
    eventVersion: input.eventVersion ?? 1,
    schemaVersion: input.schemaVersion ?? 1,
    organizationId: input.organizationId,
    chapterScope: input.chapterScope ?? ({ kind: "NATIONAL" } satisfies ChapterScope),
    occurredAt: input.occurredAt,
    correlationId: input.correlationId ?? newCorrelationId(),
    causationId: newCausationId(),
    actor: input.actor,
    sourceSystem: input.sourceSystem,
    piiContextId: input.piiContextId,
    payload: input.payload,
    sourceMetadata: input.sourceMetadata,
  });
}
