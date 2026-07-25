import { describe, expect, it, vi } from "vitest";

import {
  EveryActionAdapter,
  EveryActionHttpTransport,
  MockEveryActionAdapter,
} from "../../src/integrations/everyaction/adapter";
import {
  assertEveryActionWriteAuthorized,
  loadEveryActionConfig,
  redactedEveryActionConfig,
} from "../../src/integrations/everyaction/config";
import { parseChangedEntityJob } from "../../src/integrations/everyaction/dtos";
import { asOrganizationId } from "../../src/core/primitives/identity";

const organizationId = asOrganizationId("10000000-0000-4000-8000-000000000001");
const context = { organizationId, chapterScope: "NATIONAL" } as const;

describe("EveryAction adapter boundary", () => {
  it("defaults to mock mode with writes disabled and never exposes the API key", () => {
    const config = loadEveryActionConfig({
      EVERYACTION_API_KEY: "super-secret",
      EVERYACTION_APPLICATION_NAME: "IMBA-OS",
    });
    expect(config.mode).toBe("mock");
    expect(config.writesEnabled).toBe(false);
    expect(redactedEveryActionConfig(config)).toEqual({
      mode: "mock",
      baseUrl: "https://api.securevan.com/v4",
      applicationName: "IMBA-OS",
      writesEnabled: false,
      credentialConfigured: true,
    });
    expect(JSON.stringify(redactedEveryActionConfig(config))).not.toContain("super-secret");
  });

  it("constructs Basic Auth only inside the server transport", async () => {
    let observedHeaders: HeadersInit | undefined;
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      observedHeaders = init?.headers;
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const config = loadEveryActionConfig({
      EVERYACTION_CONNECTION_MODE: "live-readonly",
      EVERYACTION_APPLICATION_NAME: "Server App",
      EVERYACTION_API_KEY: "server-key",
    });
    const transport = new EveryActionHttpTransport(config, fetcher);
    await transport.request("/changedEntityExportJobs/resources");
    expect(observedHeaders).toMatchObject({
      Authorization: `Basic ${Buffer.from("Server App:server-key").toString("base64")}`,
    });
  });

  it("fails every write closed without all live-write safeguards", async () => {
    const config = loadEveryActionConfig({
      EVERYACTION_CONNECTION_MODE: "live-readonly",
      EVERYACTION_APPLICATION_NAME: "Server App",
      EVERYACTION_API_KEY: "server-key",
    });
    expect(() => assertEveryActionWriteAuthorized(config)).toThrow("writes are disabled");

    const transport = { request: vi.fn() };
    const adapter = new EveryActionAdapter(transport, config);
    await expect(adapter.startBulkJob(context, {})).rejects.toThrow("writes are disabled");
    expect(transport.request).not.toHaveBeenCalled();
  });

  it("validates changed-entity DTOs and exposes unsupported capabilities explicitly", async () => {
    expect(parseChangedEntityJob({ exportJobId: 42, jobStatus: "Complete", files: [] })).toEqual({
      exportJobId: 42,
      jobStatus: "Complete",
      dateExpired: undefined,
      files: [],
    });
    expect(() => parseChangedEntityJob({ jobStatus: "Complete" })).toThrow("exportJobId");

    const adapter = new MockEveryActionAdapter({ Contacts: [{ id: "EA-1" }] });
    const capabilities = await adapter.describeCapabilities(context);
    expect(capabilities.find((item) => item.resource === "Contacts")?.strategy).toBe(
      "CHANGED_ENTITY_EXPORT",
    );
    await expect(adapter.startBulkJob(context, {})).rejects.toThrow("writes are disabled");
  });
});
