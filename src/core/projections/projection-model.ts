export const SYNCHRONOUS_CORE_PROJECTIONS = [
  "constituent-header",
  "current-membership",
  "current-chapter",
  "current-communication-eligibility",
  "command-status",
] as const;

export const ASYNCHRONOUS_PROJECTION_CLASSES = [
  "analytics",
  "reporting",
  "search",
  "provider-export",
  "history",
] as const;

export interface ProjectionCheckpoint {
  readonly projectionName: string;
  readonly projectionVersion: number;
  readonly lastLedgerPosition: bigint;
  readonly eventCount: bigint;
}

export function advanceCheckpoint(
  checkpoint: ProjectionCheckpoint,
  ledgerPosition: bigint,
): ProjectionCheckpoint {
  if (ledgerPosition <= checkpoint.lastLedgerPosition) {
    throw new TypeError("projection checkpoints must advance monotonically");
  }

  return Object.freeze({
    ...checkpoint,
    lastLedgerPosition: ledgerPosition,
    eventCount: checkpoint.eventCount + BigInt(1),
  });
}
