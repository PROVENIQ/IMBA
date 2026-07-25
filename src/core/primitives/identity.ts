import type { Brand } from "./brand";

export type UuidV4 = Brand<string, "UuidV4">;
export type EventId = Brand<string, "EventId">;
export type StreamId = Brand<string, "StreamId">;
export type CommandId = Brand<string, "CommandId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type CausationId = Brand<string, "CausationId">;
export type OrganizationId = Brand<string, "OrganizationId">;
export type ChapterId = Brand<string, "ChapterId">;
export type PersonId = Brand<string, "PersonId">;
export type HouseholdId = Brand<string, "HouseholdId">;
export type RelationshipId = Brand<string, "RelationshipId">;
export type ContributionId = Brand<string, "ContributionId">;
export type RecurringCommitmentId = Brand<string, "RecurringCommitmentId">;
export type FinancialBatchId = Brand<string, "FinancialBatchId">;
export type MigrationBatchId = Brand<string, "MigrationBatchId">;
export type MigrationExceptionId = Brand<string, "MigrationExceptionId">;
export type ReconciliationCaseId = Brand<string, "ReconciliationCaseId">;
export type IntegrationConnectionId = Brand<string, "IntegrationConnectionId">;
export type SyncRunId = Brand<string, "SyncRunId">;
export type FieldMappingId = Brand<string, "FieldMappingId">;
export type ExternalIdentityId = Brand<string, "ExternalIdentityId">;
export type ActorId = Brand<string, "ActorId">;
export type AccountingPacketId = Brand<string, "AccountingPacketId">;
export type PiiContextId = Brand<string, "PiiContextId">;

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function asUuidV4(value: string, label = "identifier"): UuidV4 {
  if (!UUID_V4_PATTERN.test(value)) {
    throw new TypeError(`${label} must be a UUIDv4`);
  }

  return value.toLowerCase() as UuidV4;
}

function asDomainId<Id>(value: string, label: string): Id {
  return asUuidV4(value, label) as unknown as Id;
}

export const asEventId = (value: string): EventId =>
  asDomainId<EventId>(value, "eventId");
export const asStreamId = (value: string): StreamId =>
  asDomainId<StreamId>(value, "streamId");
export const asCommandId = (value: string): CommandId =>
  asDomainId<CommandId>(value, "commandId");
export const asCorrelationId = (value: string): CorrelationId =>
  asDomainId<CorrelationId>(value, "correlationId");
export const asCausationId = (value: string): CausationId =>
  asDomainId<CausationId>(value, "causationId");
export const asOrganizationId = (value: string): OrganizationId =>
  asDomainId<OrganizationId>(value, "organizationId");
export const asChapterId = (value: string): ChapterId =>
  asDomainId<ChapterId>(value, "chapterId");
export const asPersonId = (value: string): PersonId =>
  asDomainId<PersonId>(value, "personId");
export const asHouseholdId = (value: string): HouseholdId =>
  asDomainId<HouseholdId>(value, "householdId");
export const asRelationshipId = (value: string): RelationshipId =>
  asDomainId<RelationshipId>(value, "relationshipId");
export const asContributionId = (value: string): ContributionId =>
  asDomainId<ContributionId>(value, "contributionId");
export const asRecurringCommitmentId = (value: string): RecurringCommitmentId =>
  asDomainId<RecurringCommitmentId>(value, "recurringCommitmentId");
export const asFinancialBatchId = (value: string): FinancialBatchId =>
  asDomainId<FinancialBatchId>(value, "financialBatchId");
export const asMigrationBatchId = (value: string): MigrationBatchId =>
  asDomainId<MigrationBatchId>(value, "migrationBatchId");
export const asMigrationExceptionId = (value: string): MigrationExceptionId =>
  asDomainId<MigrationExceptionId>(value, "migrationExceptionId");
export const asReconciliationCaseId = (value: string): ReconciliationCaseId =>
  asDomainId<ReconciliationCaseId>(value, "reconciliationCaseId");
export const asIntegrationConnectionId = (value: string): IntegrationConnectionId =>
  asDomainId<IntegrationConnectionId>(value, "integrationConnectionId");
export const asSyncRunId = (value: string): SyncRunId =>
  asDomainId<SyncRunId>(value, "syncRunId");
export const asFieldMappingId = (value: string): FieldMappingId =>
  asDomainId<FieldMappingId>(value, "fieldMappingId");
export const asExternalIdentityId = (value: string): ExternalIdentityId =>
  asDomainId<ExternalIdentityId>(value, "externalIdentityId");
export const asActorId = (value: string): ActorId =>
  asDomainId<ActorId>(value, "actorId");
export const asAccountingPacketId = (value: string): AccountingPacketId =>
  asDomainId<AccountingPacketId>(value, "accountingPacketId");
export const asPiiContextId = (value: string): PiiContextId =>
  asDomainId<PiiContextId>(value, "piiContextId");

export function newUuidV4(): UuidV4 {
  return asUuidV4(crypto.randomUUID());
}

export const newEventId = (): EventId => asEventId(crypto.randomUUID());
export const newStreamId = (): StreamId => asStreamId(crypto.randomUUID());
export const newCorrelationId = (): CorrelationId => asCorrelationId(crypto.randomUUID());
export const newCausationId = (): CausationId => asCausationId(crypto.randomUUID());
