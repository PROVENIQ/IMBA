import { describe, expect, it } from "vitest";

import { canAdministerTrailData, canWriteTrailData, IMBA_ORGANIZATION_ID } from "@/lib/trail-workspace-repo";

describe("trail workspace repository authorization", () => {
  it("allows finance and executive to write, blocks everyone else", () => {
    expect(canWriteTrailData("finance")).toBe(true);
    expect(canWriteTrailData("executive")).toBe(true);
    expect(canWriteTrailData("hr")).toBe(false);
    expect(canWriteTrailData("board")).toBe(false);
    expect(canWriteTrailData("trail-solutions")).toBe(false);
  });

  it("reserves destructive admin actions (reset, promote) for the executive", () => {
    expect(canAdministerTrailData("executive")).toBe(true);
    expect(canAdministerTrailData("finance")).toBe(false);
    expect(canAdministerTrailData("hr")).toBe(false);
  });

  it("uses a valid UUID v4 for the seeded organization", () => {
    expect(IMBA_ORGANIZATION_ID).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
