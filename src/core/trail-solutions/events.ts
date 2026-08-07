import type { EventActor, ProposedEvent } from "@/core/events/event-envelope";
import { proposeCanonicalEvent } from "@/core/events/canonical-event-factory";
import type { EventSchemaRegistry } from "@/core/events/upcaster-registry";
import type { JsonObject } from "@/core/primitives/json";
import { parseMoney, serializeMoney, type Money } from "@/core/primitives/money";
import type {
  CorrelationId,
  DataExceptionId,
  OrganizationId,
  ProjectId,
  StreamId,
} from "@/core/primitives/identity";

export const TRAIL_SOLUTIONS_EVENT_NAMES = [
  "PROJECT_FINANCIAL_FORECAST_RECORDED",
  "VALIDATION_EXCEPTION_OPENED",
  "CONTROL_TOTAL_CALCULATED",
  "SOURCE_RECORD_INGESTED",
] as const;

export type TrailSolutionsEventName = (typeof TRAIL_SOLUTIONS_EVENT_NAMES)[number];

function requiredString(payload: JsonObject, field: string): void {
  if (typeof payload[field] !== "string" || !String(payload[field]).trim()) {
    throw new TypeError(`${field} is required`);
  }
}

function requiredMoney(payload: JsonObject, field: string, nullable = false): void {
  const value = payload[field];
  if (nullable && value === null) return;
  parseMoney(value);
}

function eventMoney(value: Money): JsonObject {
  return { ...serializeMoney(value) };
}

export function registerTrailSolutionsEventSchemas(registry: EventSchemaRegistry): EventSchemaRegistry {
  registry.register({
    eventName: "PROJECT_FINANCIAL_FORECAST_RECORDED",
    currentVersion: 1,
    upcasters: {},
    validateCurrent: (payload) => {
      requiredString(payload, "projectId");
      requiredString(payload, "projectCode");
      requiredString(payload, "sourceSnapshotId");
      requiredMoney(payload, "actualCostToDate");
      requiredMoney(payload, "estimatedCostToComplete", true);
      requiredMoney(payload, "forecastFinalCost", true);
      requiredMoney(payload, "forecastMargin", true);
    },
  });
  registry.register({
    eventName: "VALIDATION_EXCEPTION_OPENED",
    currentVersion: 1,
    upcasters: {},
    validateCurrent: (payload) => {
      requiredString(payload, "dataExceptionId");
      requiredString(payload, "exceptionType");
      requiredString(payload, "sourceRecordId");
    },
  });
  return registry;
}

export function proposeProjectFinancialForecastRecorded(input: {
  streamId: StreamId;
  organizationId: OrganizationId;
  occurredAt: string;
  correlationId?: CorrelationId;
  actor: EventActor;
  projectId: ProjectId;
  projectCode: string;
  actualCostToDate: Money;
  estimatedCostToComplete: Money | null;
  forecastFinalCost: Money | null;
  forecastMargin: Money | null;
  sourceSnapshotId: string;
}): ProposedEvent {
  return proposeCanonicalEvent({
    streamId: input.streamId,
    streamType: "trail-solutions-project",
    eventName: "PROJECT_FINANCIAL_FORECAST_RECORDED",
    organizationId: input.organizationId,
    occurredAt: input.occurredAt,
    correlationId: input.correlationId,
    actor: input.actor,
    sourceSystem: "WORKBOOK_IMPORT",
    payload: {
      projectId: input.projectId,
      projectCode: input.projectCode,
      actualCostToDate: eventMoney(input.actualCostToDate),
      estimatedCostToComplete: input.estimatedCostToComplete ? eventMoney(input.estimatedCostToComplete) : null,
      forecastFinalCost: input.forecastFinalCost ? eventMoney(input.forecastFinalCost) : null,
      forecastMargin: input.forecastMargin ? eventMoney(input.forecastMargin) : null,
      sourceSnapshotId: input.sourceSnapshotId,
    },
  });
}

export function proposeValidationExceptionOpened(input: {
  streamId: StreamId;
  organizationId: OrganizationId;
  occurredAt: string;
  actor: EventActor;
  projectId?: ProjectId;
  dataExceptionId: DataExceptionId;
  exceptionType: string;
  sourceRecordId: string;
}): ProposedEvent {
  return proposeCanonicalEvent({
    streamId: input.streamId,
    streamType: "trail-solutions-data-exception",
    eventName: "VALIDATION_EXCEPTION_OPENED",
    organizationId: input.organizationId,
    occurredAt: input.occurredAt,
    actor: input.actor,
    sourceSystem: "WORKBOOK_IMPORT",
    payload: {
      dataExceptionId: input.dataExceptionId,
      projectId: input.projectId ?? null,
      exceptionType: input.exceptionType,
      sourceRecordId: input.sourceRecordId,
    },
  });
}
