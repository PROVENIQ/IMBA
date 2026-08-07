import type { StoredEvent } from "@/core/events/event-envelope";
import type { ProjectionDefinition } from "@/core/projections/rebuild";
import { parseMoney, type Money } from "@/core/primitives/money";

export interface ProjectForecastProjectionRow {
  readonly projectId: string;
  readonly projectCode: string;
  readonly actualCostToDate: Money;
  readonly estimatedCostToComplete: Money | null;
  readonly forecastFinalCost: Money | null;
  readonly forecastMargin: Money | null;
  readonly sourceSnapshotId: string;
  readonly occurredAt: string;
  readonly ingestedAt: string;
  readonly recordedAt: string;
}

export type ProjectForecastProjectionState = Readonly<Record<string, ProjectForecastProjectionRow>>;

function moneyOrNull(value: unknown): Money | null {
  if (value === null) return null;
  return parseMoney(value);
}

export const projectForecastProjection: ProjectionDefinition<ProjectForecastProjectionState> = {
  name: "trail-solutions-project-forecast",
  version: 1,
  initialState: () => Object.freeze({}),
  apply: (state, event: StoredEvent) => {
    if (event.eventName !== "PROJECT_FINANCIAL_FORECAST_RECORDED") return state;
    const projectId = event.payload.projectId;
    const projectCode = event.payload.projectCode;
    const sourceSnapshotId = event.payload.sourceSnapshotId;
    if (typeof projectId !== "string" || typeof projectCode !== "string" || typeof sourceSnapshotId !== "string") {
      throw new TypeError("invalid project forecast event payload");
    }
    const row: ProjectForecastProjectionRow = Object.freeze({
      projectId,
      projectCode,
      actualCostToDate: parseMoney(event.payload.actualCostToDate),
      estimatedCostToComplete: moneyOrNull(event.payload.estimatedCostToComplete),
      forecastFinalCost: moneyOrNull(event.payload.forecastFinalCost),
      forecastMargin: moneyOrNull(event.payload.forecastMargin),
      sourceSnapshotId,
      occurredAt: event.occurredAt,
      ingestedAt: event.ingestedAt,
      recordedAt: event.recordedAt,
    });
    return Object.freeze({ ...state, [projectId]: row });
  },
};
