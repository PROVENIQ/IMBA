import type { StoredEvent } from "@/core/events/event-envelope";
import type { OrganizationId } from "@/core/primitives/identity";

export interface ProjectionDefinition<TState> {
  name: string;
  version: number;
  initialState: () => TState;
  apply: (state: TState, event: StoredEvent) => TState;
}

export interface ProjectionRebuild<TState> {
  projectionName: string;
  projectionVersion: number;
  organizationId: OrganizationId;
  lastLedgerPosition: bigint;
  eventCount: number;
  state: TState;
}

export function rebuildProjection<TState>(
  definition: ProjectionDefinition<TState>,
  organizationId: OrganizationId,
  events: readonly StoredEvent[],
): ProjectionRebuild<TState> {
  const ordered = [...events]
    .filter((event) => event.organizationId === organizationId)
    .sort((a, b) => (a.ledgerPosition < b.ledgerPosition ? -1 : 1));
  const state = ordered.reduce(definition.apply, definition.initialState());
  return Object.freeze({
    projectionName: definition.name,
    projectionVersion: definition.version,
    organizationId,
    lastLedgerPosition: ordered.at(-1)?.ledgerPosition ?? BigInt(0),
    eventCount: ordered.length,
    state,
  });
}
