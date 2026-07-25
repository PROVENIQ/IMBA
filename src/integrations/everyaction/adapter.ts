import type {
  CrmSourcePort,
  ProviderCapability,
  ProviderContext,
  ProviderPage,
} from "@/core/providers/ports";
import {
  EVERYACTION_CHANGED_ENTITY_RESOURCES,
  parseChangedEntityJob,
  type EveryActionChangedEntityJob,
} from "./dtos";
import {
  assertEveryActionWriteAuthorized,
  assertSafeEveryActionConfig,
  type EveryActionConfig,
  type WriteApproval,
} from "./config";

interface EveryActionTransport {
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

export class EveryActionHttpTransport implements EveryActionTransport {
  constructor(
    private readonly config: EveryActionConfig,
    private readonly fetcher: typeof fetch = fetch,
  ) {
    assertSafeEveryActionConfig(config);
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (this.config.mode === "mock") throw new Error("HTTP transport is unavailable in mock mode");
    const credentials = `${this.config.applicationName}:${this.config.apiKey}`;
    const response = await this.fetcher(`${this.config.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    if (!response.ok) throw new Error(`EveryAction request failed with HTTP ${response.status}`);
    return (await response.json()) as T;
  }
}

const capabilities: readonly ProviderCapability[] = [
  ...EVERYACTION_CHANGED_ENTITY_RESOURCES.map((resource) => ({
    resource,
    canRead: true,
    canWrite: false,
    strategy: "CHANGED_ENTITY_EXPORT" as const,
    limitation: "Changed-entity history is limited to the provider's current 90-day window.",
  })),
  {
    resource: "FinancialBatches",
    canRead: true,
    canWrite: false,
    strategy: "PERIODIC_SNAPSHOT" as const,
  },
  ...[
    "People",
    "Codes",
    "Campaigns",
    "Commitments",
    "CustomFields",
    "Designations",
    "Events",
    "Signups",
    "Relationships",
    "SupporterGroups",
    "BulkImportResources",
    "BulkImportMappingTypes",
  ].map((resource) => ({
    resource,
    canRead: false,
    canWrite: false,
    strategy: "UNSUPPORTED" as const,
    limitation: "Not covered by the current changed-entity adapter contract; requires resource discovery before activation.",
  })),
];

export class EveryActionAdapter implements CrmSourcePort {
  constructor(
    private readonly transport: EveryActionTransport,
    private readonly config: EveryActionConfig,
  ) {
    assertSafeEveryActionConfig(config);
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    await this.transport.request("/changedEntityExportJobs/resources");
    return { ok: true, message: "EveryAction read-only connection verified" };
  }

  async describeCapabilities(_context?: ProviderContext): Promise<readonly ProviderCapability[]> {
    void _context;
    return capabilities;
  }

  describeSchema(
    _context: ProviderContext,
    resource: string,
  ): Promise<unknown> {
    return this.transport.request(`/changedEntityExportJobs/fields/${encodeURIComponent(resource)}`);
  }

  async listChangedRecords(
    context: ProviderContext,
    resource: string,
    cursor?: string,
  ): Promise<ProviderPage<unknown>> {
    const job = await this.startChangedEntityExport(context, resource, cursor);
    return {
      records: [job],
      nextCursor: job.jobStatus === "Complete" ? new Date().toISOString() : cursor,
      sourceCoverage: `${resource} changed-entity export job ${job.exportJobId}`,
    };
  }

  fetchRecord(_context: ProviderContext, resource: string, externalId: string): Promise<unknown> {
    return this.transport.request(`/${encodeURIComponent(resource)}/${encodeURIComponent(externalId)}`);
  }

  async fetchReferenceData(_context: ProviderContext, resource: string): Promise<readonly unknown[]> {
    const response = await this.transport.request<{ items?: unknown[] }>(`/${encodeURIComponent(resource)}`);
    return response.items ?? [];
  }

  async startBulkJob(_context: ProviderContext, input: unknown): Promise<{ jobId: string }> {
    const approval =
      input && typeof input === "object"
        ? (input as { approval?: WriteApproval }).approval
        : undefined;
    assertEveryActionWriteAuthorized(this.config, approval);
    const response = await this.transport.request<{ jobId?: string | number }>("/bulkImportJobs", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (response.jobId === undefined) throw new Error("EveryAction bulk job response omitted jobId");
    return { jobId: String(response.jobId) };
  }

  getBulkJobStatus(_context: ProviderContext, jobId: string): Promise<unknown> {
    return this.transport.request(`/bulkImportJobs/${encodeURIComponent(jobId)}`);
  }

  startChangedEntityExport(
    _context: ProviderContext,
    resource: string,
    dateFrom?: string,
    dateTo = new Date().toISOString(),
  ): Promise<EveryActionChangedEntityJob> {
    return this.transport
      .request<unknown>("/changedEntityExportJobs", {
        method: "POST",
        body: JSON.stringify({ resourceType: resource, dateFrom, dateTo }),
      })
      .then(parseChangedEntityJob);
  }

  getChangedEntityExportJob(exportJobId: number): Promise<EveryActionChangedEntityJob> {
    return this.transport
      .request<unknown>(`/changedEntityExportJobs/${exportJobId}`)
      .then(parseChangedEntityJob);
  }

  async waitForChangedEntityExport(
    exportJobId: number,
    options: {
      maxAttempts?: number;
      delay?: (attempt: number) => Promise<void>;
      now?: () => string;
    } = {},
  ): Promise<EveryActionChangedEntityJob> {
    const maxAttempts = options.maxAttempts ?? 20;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const job = await this.getChangedEntityExportJob(exportJobId);
      if (job.jobStatus === "Complete") {
        if (job.dateExpired && Date.parse(job.dateExpired) <= Date.parse(options.now?.() ?? new Date().toISOString())) {
          throw new Error("EveryAction changed-entity download expired before durable ingestion");
        }
        return job;
      }
      if (job.jobStatus === "Error" || job.jobStatus === "Rejected") {
        throw new Error(`EveryAction changed-entity job ended with status ${job.jobStatus}`);
      }
      await (options.delay?.(attempt) ?? Promise.resolve());
    }
    throw new Error("EveryAction changed-entity job polling limit reached");
  }
}

/** Explicit live HTTP adapter name retained at the integration boundary. */
export class HttpEveryActionAdapter extends EveryActionAdapter {}

export class MockEveryActionAdapter implements CrmSourcePort {
  constructor(private readonly records: Readonly<Record<string, readonly unknown[]>> = {}) {}

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: "Synthetic EveryAction adapter ready; no network connection used" };
  }
  async describeCapabilities(_context?: ProviderContext): Promise<readonly ProviderCapability[]> {
    void _context;
    return capabilities;
  }
  async describeSchema(_context: ProviderContext, resource: string): Promise<unknown> {
    const sample = this.records[resource]?.[0];
    return { resource, fields: sample && typeof sample === "object" ? Object.keys(sample) : [] };
  }
  async listChangedRecords(
    _context: ProviderContext,
    resource: string,
    cursor?: string,
  ): Promise<ProviderPage<unknown>> {
    return {
      records: this.records[resource] ?? [],
      nextCursor: cursor ?? "SYNTHETIC_COMPLETE",
      sourceCoverage: "Deterministic synthetic snapshot",
    };
  }
  async fetchRecord(_context: ProviderContext, resource: string, externalId: string): Promise<unknown> {
    return (this.records[resource] ?? []).find(
      (record) => String((record as Record<string, unknown>).id) === externalId,
    );
  }
  async fetchReferenceData(_context: ProviderContext, resource: string): Promise<readonly unknown[]> {
    return this.records[resource] ?? [];
  }
  async startBulkJob(_context?: ProviderContext, _input?: unknown): Promise<{ jobId: string }> {
    void _context;
    void _input;
    throw new Error("EveryAction writes are disabled in mock mode");
  }
  async getBulkJobStatus(_context?: ProviderContext, _jobId?: string): Promise<unknown> {
    void _context;
    void _jobId;
    throw new Error("EveryAction writes are disabled in mock mode");
  }
}
