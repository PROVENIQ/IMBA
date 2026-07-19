import type { Brand } from "./brand";

export type UuidV4 = Brand<string, "UuidV4">;
export type EventId = Brand<UuidV4, "EventId">;
export type StreamId = Brand<UuidV4, "StreamId">;
export type CommandId = Brand<UuidV4, "CommandId">;
export type CorrelationId = Brand<UuidV4, "CorrelationId">;
export type CausationId = Brand<UuidV4, "CausationId">;
export type OrganizationId = Brand<UuidV4, "OrganizationId">;
export type ChapterId = Brand<UuidV4, "ChapterId">;
export type AccountingPacketId = Brand<UuidV4, "AccountingPacketId">;
export type PiiContextId = Brand<UuidV4, "PiiContextId">;

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function asUuidV4(value: string, label = "identifier"): UuidV4 {
  if (!UUID_V4_PATTERN.test(value)) {
    throw new TypeError(`${label} must be a UUIDv4`);
  }

  return value.toLowerCase() as UuidV4;
}

export const asEventId = (value: string): EventId =>
  asUuidV4(value, "eventId") as EventId;
export const asStreamId = (value: string): StreamId =>
  asUuidV4(value, "streamId") as StreamId;
export const asCommandId = (value: string): CommandId =>
  asUuidV4(value, "commandId") as CommandId;
export const asCorrelationId = (value: string): CorrelationId =>
  asUuidV4(value, "correlationId") as CorrelationId;
export const asCausationId = (value: string): CausationId =>
  asUuidV4(value, "causationId") as CausationId;
export const asOrganizationId = (value: string): OrganizationId =>
  asUuidV4(value, "organizationId") as OrganizationId;
export const asChapterId = (value: string): ChapterId =>
  asUuidV4(value, "chapterId") as ChapterId;
export const asAccountingPacketId = (value: string): AccountingPacketId =>
  asUuidV4(value, "accountingPacketId") as AccountingPacketId;
export const asPiiContextId = (value: string): PiiContextId =>
  asUuidV4(value, "piiContextId") as PiiContextId;
