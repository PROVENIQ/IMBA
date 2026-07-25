import type { ProviderConnectionMode } from "@/core/providers/ports";

export interface EveryActionConfig {
  mode: ProviderConnectionMode;
  baseUrl: string;
  applicationName?: string;
  apiKey?: string;
  writesEnabled: boolean;
}

export function loadEveryActionConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): EveryActionConfig {
  const requestedMode = environment.EVERYACTION_CONNECTION_MODE ?? "mock";
  const mode: ProviderConnectionMode =
    requestedMode === "live-readonly" || requestedMode === "live-write"
      ? requestedMode
      : "mock";
  return Object.freeze({
    mode,
    baseUrl: environment.EVERYACTION_BASE_URL ?? "https://api.securevan.com/v4",
    applicationName: environment.EVERYACTION_APPLICATION_NAME,
    apiKey: environment.EVERYACTION_API_KEY,
    writesEnabled: environment.EVERYACTION_WRITES_ENABLED === "true",
  });
}

export function assertSafeEveryActionConfig(config: EveryActionConfig): void {
  if (config.mode !== "mock" && (!config.applicationName || !config.apiKey)) {
    throw new Error("EveryAction live mode requires server-side application name and API key");
  }
  if (config.mode !== "live-write" && config.writesEnabled) {
    throw new Error("EveryAction writes cannot be enabled outside live-write mode");
  }
}

export interface WriteApproval {
  approvedBy: string;
  approvedAt: string;
  previewHash: string;
  idempotencyKey: string;
  auditEventId: string;
}

export function assertEveryActionWriteAuthorized(
  config: EveryActionConfig,
  approval?: WriteApproval,
): asserts approval is WriteApproval {
  assertSafeEveryActionConfig(config);
  if (config.mode !== "live-write" || !config.writesEnabled) {
    throw new Error("EveryAction writes are disabled");
  }
  if (
    !approval?.approvedBy ||
    !approval.previewHash ||
    !approval.idempotencyKey ||
    !approval.auditEventId
  ) {
    throw new Error("EveryAction write requires approval, preview, idempotency, and audit evidence");
  }
}

export function redactedEveryActionConfig(config: EveryActionConfig): Omit<EveryActionConfig, "apiKey"> & {
  credentialConfigured: boolean;
} {
  const { apiKey, ...safe } = config;
  return { ...safe, credentialConfigured: Boolean(apiKey) };
}
