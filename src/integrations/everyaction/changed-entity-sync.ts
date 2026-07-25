import type { OrganizationId, SyncRunId } from "@/core/primitives/identity";
import type { JsonObject } from "@/core/primitives/json";
import type { EveryActionChangedEntityResource } from "@/integrations/everyaction/dtos";

export interface ChangedEntityCursorStore {
  read(organizationId: OrganizationId, resource: string): Promise<string | undefined>;
  advance(input: {
    organizationId: OrganizationId;
    resource: string;
    cursor: string;
    syncRunId: SyncRunId;
    advancedAt: string;
  }): Promise<void>;
}

export interface ChangedEntityFeed {
  fetch(input: {
    resource: EveryActionChangedEntityResource;
    dateFrom?: string;
    dateTo: string;
  }): Promise<readonly JsonObject[]>;
}

export interface ChangedEntitySink {
  hasFingerprint(organizationId: OrganizationId, fingerprint: string): Promise<boolean>;
  ingest(input: {
    organizationId: OrganizationId;
    resource: EveryActionChangedEntityResource;
    record: JsonObject;
    fingerprint: string;
    syncRunId: SyncRunId;
    ingestedAt: string;
  }): Promise<void>;
}

export interface ChangedEntitySyncResult {
  resource: EveryActionChangedEntityResource;
  requestedFrom?: string;
  requestedTo: string;
  received: number;
  ingested: number;
  duplicates: number;
  advancedCursor: string;
}

export function stableRecordFingerprint(resource: string, record: JsonObject): string {
  const text = `${resource}:${JSON.stringify(record, Object.keys(record).sort())}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export async function runChangedEntitySync(input: {
  organizationId: OrganizationId;
  syncRunId: SyncRunId;
  resource: EveryActionChangedEntityResource;
  dateTo: string;
  cursorStore: ChangedEntityCursorStore;
  feed: ChangedEntityFeed;
  sink: ChangedEntitySink;
  now?: () => string;
}): Promise<ChangedEntitySyncResult> {
  const requestedFrom = await input.cursorStore.read(input.organizationId, input.resource);
  const records = await input.feed.fetch({
    resource: input.resource,
    dateFrom: requestedFrom,
    dateTo: input.dateTo,
  });
  let ingested = 0;
  let duplicates = 0;

  for (const record of records) {
    const fingerprint = stableRecordFingerprint(input.resource, record);
    if (await input.sink.hasFingerprint(input.organizationId, fingerprint)) {
      duplicates += 1;
      continue;
    }
    await input.sink.ingest({
      organizationId: input.organizationId,
      resource: input.resource,
      record,
      fingerprint,
      syncRunId: input.syncRunId,
      ingestedAt: input.now?.() ?? new Date().toISOString(),
    });
    ingested += 1;
  }

  // This is deliberately last: any thrown fetch or ingestion error leaves the prior cursor intact.
  await input.cursorStore.advance({
    organizationId: input.organizationId,
    resource: input.resource,
    cursor: input.dateTo,
    syncRunId: input.syncRunId,
    advancedAt: input.now?.() ?? new Date().toISOString(),
  });
  return {
    resource: input.resource,
    requestedFrom,
    requestedTo: input.dateTo,
    received: records.length,
    ingested,
    duplicates,
    advancedCursor: input.dateTo,
  };
}
