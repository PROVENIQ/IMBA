import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "db/migrations/0001_phase_zero_foundation.sql"),
  "utf8",
);

describe("Phase 0 PostgreSQL contract", () => {
  it("uses a server-assigned global ledger position and UUIDv4 event identity", () => {
    expect(migration).toMatch(
      /ledger_position bigint generated always as identity/i,
    );
    expect(migration).toContain("event_ledger_event_id_v4");
    expect(migration).toContain("unique (stream_id, stream_version)");
  });

  it("makes the ledger append-only and checkpoints projections by position", () => {
    expect(migration).toContain("event_ledger_is_append_only");
    expect(migration).toContain("last_ledger_position bigint");
    expect(migration).not.toMatch(/last_event_timestamp/i);
  });

  it("uses a partial outbox index and non-blocking worker contract", () => {
    expect(migration).toMatch(
      /outbox_messages_ready_idx[\s\S]*where status in \('PENDING', 'RETRY'\)/,
    );
    expect(migration).toContain("idempotency_key");
  });

  it("requires accounting balance and source evidence before release", () => {
    expect(migration).toContain("validate_accounting_packet_release");
    expect(migration).toContain("source_count = 0");
    expect(migration).toContain("debit_total <> credit_total");
  });
});
