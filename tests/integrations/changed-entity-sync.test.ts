import { describe, expect, it } from "vitest";

import {
  runChangedEntitySync,
  stableRecordFingerprint,
  type ChangedEntityCursorStore,
  type ChangedEntitySink,
} from "../../src/integrations/everyaction/changed-entity-sync";
import { asOrganizationId, asSyncRunId } from "../../src/core/primitives/identity";
import type { JsonObject } from "../../src/core/primitives/json";

const organizationId = asOrganizationId("20000000-0000-4000-8000-000000000001");
const syncRunId = asSyncRunId("20000000-0000-4000-8000-000000000002");

function harness(existing = new Set<string>()) {
  let cursor = "2026-07-20T00:00:00.000Z";
  const ingested: string[] = [];
  const cursorStore: ChangedEntityCursorStore = {
    read: async () => cursor,
    advance: async (input) => {
      cursor = input.cursor;
    },
  };
  const sink: ChangedEntitySink = {
    hasFingerprint: async (_organizationId, value) => existing.has(value),
    ingest: async (input) => {
      existing.add(input.fingerprint);
      ingested.push(input.fingerprint);
    },
  };
  return { cursorStore, sink, ingested, cursor: () => cursor };
}

describe("EveryAction changed-entity synchronization", () => {
  it("is idempotent for duplicate provider delivery and advances after durable success", async () => {
    const first = { id: "EA-1", amount: 10 } satisfies JsonObject;
    const existing = new Set([stableRecordFingerprint("Contributions", first)]);
    const state = harness(existing);
    const result = await runChangedEntitySync({
      organizationId,
      syncRunId,
      resource: "Contributions",
      dateTo: "2026-07-24T00:00:00.000Z",
      cursorStore: state.cursorStore,
      feed: { fetch: async () => [first, { id: "EA-2", amount: 20 }] },
      sink: state.sink,
      now: () => "2026-07-24T00:00:01.000Z",
    });
    expect(result).toMatchObject({ received: 2, ingested: 1, duplicates: 1 });
    expect(state.ingested).toHaveLength(1);
    expect(state.cursor()).toBe("2026-07-24T00:00:00.000Z");
  });

  it("preserves the prior cursor when any record fails", async () => {
    const state = harness();
    let attempts = 0;
    await expect(
      runChangedEntitySync({
        organizationId,
        syncRunId,
        resource: "Contacts",
        dateTo: "2026-07-24T00:00:00.000Z",
        cursorStore: state.cursorStore,
        feed: { fetch: async () => [{ id: "EA-1" }, { id: "EA-2" }] },
        sink: {
          ...state.sink,
          ingest: async () => {
            attempts += 1;
            if (attempts === 2) throw new Error("synthetic partial failure");
          },
        },
      }),
    ).rejects.toThrow("synthetic partial failure");
    expect(state.cursor()).toBe("2026-07-20T00:00:00.000Z");
  });
});
