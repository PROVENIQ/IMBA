import type {
  ActorId,
  FieldMappingId,
  MigrationBatchId,
  MigrationExceptionId,
  OrganizationId,
  PersonId,
  ReconciliationCaseId,
  SyncRunId,
} from "@/core/primitives/identity";
import type { JsonObject, JsonValue } from "@/core/primitives/json";

export type MigrationSourceSystem = "CIVICRM" | "EVERYACTION" | "CSV";
export type MappingStatus =
  | "PROPOSED"
  | "REQUIRES_DECISION"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED";
export type ValidationSeverity = "INFO" | "WARNING" | "ERROR";
export type ExceptionStatus = "OPEN" | "ASSIGNED" | "RESOLVED" | "WAIVED";
export type SourceRecordDisposition =
  | "PENDING"
  | "VALID"
  | "QUARANTINED"
  | "IMPORTED"
  | "SKIPPED";

export interface MigrationBatch {
  id: MigrationBatchId;
  organizationId: OrganizationId;
  sourceSystem: MigrationSourceSystem;
  sourceLabel: string;
  status: "PLANNED" | "EXTRACTING" | "VALIDATING" | "READY" | "RUNNING" | "COMPLETE" | "FAILED";
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  createdBy: ActorId;
}

export interface SourceRecordFingerprint {
  organizationId: OrganizationId;
  sourceSystem: MigrationSourceSystem;
  sourceObject: string;
  sourceRecordId: string;
  fingerprint: string;
  firstSeenAt: string;
  lastSeenAt: string;
  disposition: SourceRecordDisposition;
}

export interface TransformRule {
  kind: "COPY" | "TRIM" | "UPPERCASE" | "LOWERCASE" | "LOOKUP" | "CONSTANT";
  options?: JsonObject;
}

export interface FieldMapping {
  id: FieldMappingId;
  organizationId: OrganizationId;
  sourceSystem: MigrationSourceSystem;
  sourceEntity: string;
  sourceField: string;
  canonicalField: string;
  destinationSystem: string;
  destinationEntity: string;
  destinationField: string;
  version: number;
  status: MappingStatus;
  transformRule: TransformRule;
  validationRules: readonly string[];
  prerequisiteMappings: readonly FieldMappingId[];
  confidence: number;
  occurredAt: string;
  ingestedAt: string;
  recordedAt: string;
  proposedBy: ActorId;
  approvedAt?: string;
  approvedBy?: ActorId;
  supersedesVersion?: number;
}

export interface ValidationRule {
  code: string;
  description: string;
  severity: ValidationSeverity;
  field?: string;
  validate: (record: Readonly<JsonObject>) => boolean;
}

export interface ValidationResult {
  ruleCode: string;
  severity: ValidationSeverity;
  passed: boolean;
  field?: string;
  message: string;
}

export interface ControlTotal {
  organizationId: OrganizationId;
  migrationBatchId: MigrationBatchId;
  sourceObject: string;
  sourceSystem: MigrationSourceSystem;
  destinationSystem: string;
  filterCriteria: JsonObject;
  metric: "RECORD_COUNT" | "AMOUNT_MINOR" | "DISTINCT_EXTERNAL_IDS";
  groupKey: string;
  expected: number;
  actual: number;
  variance: number;
  status: "PASS" | "FAIL";
  currency?: string;
  calculationVersion: number;
  sourceCoverage: string;
  periodStart?: string;
  periodEnd?: string;
  calculatedAt: string;
}

export interface MigrationException {
  id: MigrationExceptionId;
  organizationId: OrganizationId;
  migrationBatchId: MigrationBatchId;
  sourceObject: string;
  sourceRecordId: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
  status: ExceptionStatus;
  assignedTo?: ActorId;
  openedAt: string;
  resolvedAt?: string;
}

export interface MigrationDecision {
  organizationId: OrganizationId;
  migrationExceptionId: MigrationExceptionId;
  action: "ASSIGN" | "RESOLVE" | "WAIVE" | "REOPEN";
  rationale: string;
  actorId: ActorId;
  occurredAt: string;
  evidence?: JsonValue;
}

export type ReconciliationStatus =
  | "EXACT_MATCH"
  | "LIKELY_MATCH"
  | "UNMATCHED"
  | "DUPLICATE"
  | "NEEDS_REVIEW"
  | "RESOLVED";

export interface ReconciliationCandidate {
  personId: PersonId;
  confidence: number;
  reasons: string[];
}

export interface ReconciliationCase {
  id: ReconciliationCaseId;
  organizationId: OrganizationId;
  sourceSystem: MigrationSourceSystem;
  sourceObject: string;
  sourceRecordId: string;
  status: ReconciliationStatus;
  candidates: ReconciliationCandidate[];
  openedAt: string;
  resolution?: {
    selectedPersonId?: PersonId;
    rationale: string;
    resolvedBy: ActorId;
    resolvedAt: string;
  };
}

export interface SyncCursor {
  organizationId: OrganizationId;
  sourceSystem: MigrationSourceSystem;
  resourceType: string;
  cursorValue: string;
  advancedBySyncRunId: SyncRunId;
  advancedAt: string;
}
