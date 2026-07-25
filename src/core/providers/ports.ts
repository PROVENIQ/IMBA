import type { OrganizationId } from "../primitives/identity";
import type { Money } from "../primitives/money";

export type ProviderConnectionMode = "mock" | "live-readonly" | "live-write";
export type SyncStrategy =
  | "CHANGED_ENTITY_EXPORT"
  | "PERIODIC_SNAPSHOT"
  | "MANUAL_EXPORT"
  | "BULK_EXPORT_JOB"
  | "UNSUPPORTED";

export interface ProviderContext {
  readonly organizationId: OrganizationId;
  readonly chapterScope: "NATIONAL" | string;
}

export interface ProviderCapability {
  readonly resource: string;
  readonly canRead: boolean;
  readonly canWrite: boolean;
  readonly strategy: SyncStrategy;
  readonly limitation?: string;
}

export interface ProviderPage<T> {
  readonly records: readonly T[];
  readonly nextCursor?: string;
  readonly sourceCoverage: string;
}

export interface CrmSourcePort {
  testConnection(context: ProviderContext): Promise<{ ok: boolean; message: string }>;
  describeCapabilities(context: ProviderContext): Promise<readonly ProviderCapability[]>;
  describeSchema(context: ProviderContext, resource: string): Promise<unknown>;
  listChangedRecords(
    context: ProviderContext,
    resource: string,
    cursor?: string,
  ): Promise<ProviderPage<unknown>>;
  fetchRecord(context: ProviderContext, resource: string, externalId: string): Promise<unknown>;
  fetchReferenceData(context: ProviderContext, resource: string): Promise<readonly unknown[]>;
  startBulkJob(context: ProviderContext, input: unknown): Promise<{ jobId: string }>;
  getBulkJobStatus(context: ProviderContext, jobId: string): Promise<unknown>;
}

export interface AccountingTransaction {
  readonly externalId: string;
  readonly occurredAt: string;
  readonly amount: Money;
  readonly kind: "TRANSACTION" | "DEPOSIT" | "JOURNAL_ENTRY";
}

export interface AccountingSourcePort {
  testConnection(context: ProviderContext): Promise<{ ok: boolean; message: string }>;
  listTransactions(context: ProviderContext, cursor?: string): Promise<ProviderPage<AccountingTransaction>>;
  listDeposits(context: ProviderContext, cursor?: string): Promise<ProviderPage<AccountingTransaction>>;
  listJournalEntries(context: ProviderContext, cursor?: string): Promise<ProviderPage<AccountingTransaction>>;
  fetchAccountReferenceData(context: ProviderContext): Promise<readonly unknown[]>;
}

export interface SourceRecordEnvelope {
  readonly sourceSystem: string;
  readonly sourceEntity: string;
  readonly sourceIdentifier: string;
  readonly sourceExportId: string;
  readonly occurredAt?: string;
  readonly ingestedAt: string;
  readonly fingerprint: string;
  readonly redactedSnapshot: Readonly<Record<string, string>>;
  readonly transformVersion: number;
  readonly mappingVersion: number;
  readonly disposition: "MATCHED" | "STAGED" | "TRANSFORMED" | "REJECTED" | "QUARANTINED";
  readonly dispositionReason?: string;
}

export interface SourceControlTotal {
  readonly entityType: string;
  readonly count: number;
  readonly amountMinorUnits?: bigint;
  readonly currency?: string;
}

export interface MigrationSourcePort {
  inspectSource(): Promise<{ entities: readonly string[]; sourceExportId: string }>;
  streamSourceRecords(entity: string): AsyncIterable<SourceRecordEnvelope>;
  calculateSourceControlTotals(entity: string): Promise<SourceControlTotal>;
}
