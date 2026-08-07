import type {
  ActorId,
  CausationId,
  ChapterId,
  CorrelationId,
  EventId,
  OrganizationId,
  PiiContextId,
  StreamId,
} from "../primitives/identity";
import type { JsonObject } from "../primitives/json";

export type ChapterScope =
  | { readonly kind: "NATIONAL" }
  | { readonly kind: "CHAPTER"; readonly chapterId: ChapterId };

export interface EventActor {
  readonly actorId: ActorId;
  readonly actorType: "USER" | "SYSTEM" | "PROVIDER";
  readonly displayRole: string;
}

export type CanonicalSourceSystem =
  | "IMBA_OS"
  | "CIVICRM"
  | "EVERYACTION"
  | "QUICKBOOKS"
  | "ADP"
  | "MONDAY"
  | "ERP"
  | "WORKBOOK_IMPORT"
  | "PAYMENT_PROCESSOR"
  | "BANK"
  | "SYNTHETIC";

export interface ProposedEvent {
  readonly eventId: EventId;
  readonly streamId: StreamId;
  readonly streamType: string;
  readonly eventName: string;
  readonly eventVersion: number;
  readonly schemaVersion: number;
  readonly organizationId: OrganizationId;
  readonly chapterScope: ChapterScope;
  readonly occurredAt: string;
  readonly correlationId: CorrelationId;
  readonly causationId: CausationId;
  readonly actor: EventActor;
  readonly sourceSystem: CanonicalSourceSystem;
  readonly piiContextId?: PiiContextId;
  readonly payload: JsonObject;
  readonly sourceMetadata?: JsonObject;
}

export interface StoredEvent extends ProposedEvent {
  readonly ledgerPosition: bigint;
  readonly streamVersion: number;
  readonly ingestedAt: string;
  readonly recordedAt: string;
  readonly sourceMetadata: JsonObject;
}

export interface CurrentEvent extends StoredEvent {
  readonly storedSchemaVersion: number;
}
