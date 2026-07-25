import type {
  IntegrationConnectionId,
  OrganizationId,
  SyncRunId,
  UuidV4,
} from "@/core/primitives/identity";
import type { JsonObject } from "@/core/primitives/json";
import type { ProviderCapability, ProviderConnectionMode } from "@/core/providers/ports";

export interface IntegrationConnection {
  integrationConnectionId: IntegrationConnectionId;
  organizationId: OrganizationId;
  provider: string;
  mode: ProviderConnectionMode;
  credentialReference?: string;
  capabilities: readonly ProviderCapability[];
  status:
    | "MOCK"
    | "NOT_CONFIGURED"
    | "READY_FOR_READ"
    | "READ_ONLY"
    | "WRITE_DISABLED"
    | "CONNECTED"
    | "DEGRADED"
    | "ERROR";
}

export interface ProviderRecordLink {
  providerRecordLinkId: UuidV4;
  organizationId: OrganizationId;
  integrationConnectionId: IntegrationConnectionId;
  providerResource: string;
  providerRecordId: string;
  canonicalEntityId: UuidV4;
  fingerprint: string;
}

export interface SyncRun {
  syncRunId: SyncRunId;
  organizationId: OrganizationId;
  integrationConnectionId: IntegrationConnectionId;
  resourceType: string;
  status: "STARTED" | "COMPLETED" | "FAILED";
  priorCursor?: string;
  requestedThrough: string;
  receivedCount: number;
  ingestedCount: number;
  duplicateCount: number;
  failure?: ProviderFailure;
}

export interface SyncPage {
  syncRunId: SyncRunId;
  pageReference: string;
  recordCount: number;
  fingerprint: string;
  durableAt: string;
}

export interface ProviderRequest {
  integrationConnectionId: IntegrationConnectionId;
  operation: string;
  resource: string;
  requestedAt: string;
  redactedParameters: JsonObject;
}

export interface ProviderResponseSummary {
  operation: string;
  resource: string;
  statusCode: number;
  recordCount?: number;
  receivedAt: string;
  requestId?: string;
}

export interface ProviderFailure {
  code: string;
  safeMessage: string;
  evidenceReference: string;
  occurredAt: string;
  retryable: boolean;
}
