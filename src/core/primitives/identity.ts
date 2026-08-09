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
export type ProjectId = Brand<string, "ProjectId">;
export type ProjectIdentifierCrosswalkId = Brand<string, "ProjectIdentifierCrosswalkId">;
export type EstimateVersionId = Brand<string, "EstimateVersionId">;
export type EstimateLineId = Brand<string, "EstimateLineId">;
export type LaborActualId = Brand<string, "LaborActualId">;
export type NonlaborActualId = Brand<string, "NonlaborActualId">;
export type RevenueBillingRecordId = Brand<string, "RevenueBillingRecordId">;
export type ChangeOrderId = Brand<string, "ChangeOrderId">;
export type OperationalDriverId = Brand<string, "OperationalDriverId">;
export type GrantFundingRecordId = Brand<string, "GrantFundingRecordId">;
export type LaborRateId = Brand<string, "LaborRateId">;
export type CostCodeMappingId = Brand<string, "CostCodeMappingId">;
export type DataExceptionId = Brand<string, "DataExceptionId">;
export type BenchmarkId = Brand<string, "BenchmarkId">;
export type DecisionItemId = Brand<string, "DecisionItemId">;
export type DataRefreshStatusId = Brand<string, "DataRefreshStatusId">;
export type TestWorkspaceId = Brand<string, "TestWorkspaceId">;
export type ImportAttemptId = Brand<string, "ImportAttemptId">;
export type ImportVersionId = Brand<string, "ImportVersionId">;
export type MappingTemplateId = Brand<string, "MappingTemplateId">;
export type MatchActivityId = Brand<string, "MatchActivityId">;
export type ForecastUpdateId = Brand<string, "ForecastUpdateId">;
export type SharedCostAllocationRuleId = Brand<string, "SharedCostAllocationRuleId">;

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
export const asProjectId = (value: string): ProjectId =>
  asDomainId<ProjectId>(value, "projectId");
export const asProjectIdentifierCrosswalkId = (value: string): ProjectIdentifierCrosswalkId =>
  asDomainId<ProjectIdentifierCrosswalkId>(value, "projectIdentifierCrosswalkId");
export const asEstimateVersionId = (value: string): EstimateVersionId =>
  asDomainId<EstimateVersionId>(value, "estimateVersionId");
export const asEstimateLineId = (value: string): EstimateLineId =>
  asDomainId<EstimateLineId>(value, "estimateLineId");
export const asLaborActualId = (value: string): LaborActualId =>
  asDomainId<LaborActualId>(value, "laborActualId");
export const asNonlaborActualId = (value: string): NonlaborActualId =>
  asDomainId<NonlaborActualId>(value, "nonlaborActualId");
export const asRevenueBillingRecordId = (value: string): RevenueBillingRecordId =>
  asDomainId<RevenueBillingRecordId>(value, "revenueBillingRecordId");
export const asChangeOrderId = (value: string): ChangeOrderId =>
  asDomainId<ChangeOrderId>(value, "changeOrderId");
export const asOperationalDriverId = (value: string): OperationalDriverId =>
  asDomainId<OperationalDriverId>(value, "operationalDriverId");
export const asGrantFundingRecordId = (value: string): GrantFundingRecordId =>
  asDomainId<GrantFundingRecordId>(value, "grantFundingRecordId");
export const asLaborRateId = (value: string): LaborRateId =>
  asDomainId<LaborRateId>(value, "laborRateId");
export const asCostCodeMappingId = (value: string): CostCodeMappingId =>
  asDomainId<CostCodeMappingId>(value, "costCodeMappingId");
export const asDataExceptionId = (value: string): DataExceptionId =>
  asDomainId<DataExceptionId>(value, "dataExceptionId");
export const asBenchmarkId = (value: string): BenchmarkId =>
  asDomainId<BenchmarkId>(value, "benchmarkId");
export const asDecisionItemId = (value: string): DecisionItemId =>
  asDomainId<DecisionItemId>(value, "decisionItemId");
export const asDataRefreshStatusId = (value: string): DataRefreshStatusId =>
  asDomainId<DataRefreshStatusId>(value, "dataRefreshStatusId");
export const asTestWorkspaceId = (value: string): TestWorkspaceId =>
  asDomainId<TestWorkspaceId>(value, "testWorkspaceId");
export const asImportAttemptId = (value: string): ImportAttemptId =>
  asDomainId<ImportAttemptId>(value, "importAttemptId");
export const asImportVersionId = (value: string): ImportVersionId =>
  asDomainId<ImportVersionId>(value, "importVersionId");
export const asMappingTemplateId = (value: string): MappingTemplateId =>
  asDomainId<MappingTemplateId>(value, "mappingTemplateId");
export const asMatchActivityId = (value: string): MatchActivityId =>
  asDomainId<MatchActivityId>(value, "matchActivityId");
export const asForecastUpdateId = (value: string): ForecastUpdateId =>
  asDomainId<ForecastUpdateId>(value, "forecastUpdateId");
export const asSharedCostAllocationRuleId = (value: string): SharedCostAllocationRuleId =>
  asDomainId<SharedCostAllocationRuleId>(value, "sharedCostAllocationRuleId");

export function newUuidV4(): UuidV4 {
  return asUuidV4(crypto.randomUUID());
}

export const newEventId = (): EventId => asEventId(crypto.randomUUID());
export const newStreamId = (): StreamId => asStreamId(crypto.randomUUID());
export const newCorrelationId = (): CorrelationId => asCorrelationId(crypto.randomUUID());
export const newCausationId = (): CausationId => asCausationId(crypto.randomUUID());
