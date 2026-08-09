import { describe, expect, it } from "vitest";

import {
  DEFAULT_ROLE,
  isImbaRoleKey,
  resolveImbaRole,
} from "../../src/lib/auth-roles";
import { imbaRoleProfiles } from "../../src/lib/imba-intelligence-data";

describe("resolveImbaRole", () => {
  it("trusts a valid Clerk publicMetadata role above all else", () => {
    expect(resolveImbaRole({ publicMetadataRole: "finance" })).toBe("finance");
    expect(resolveImbaRole({ publicMetadataRole: "executive" })).toBe("executive");
    expect(
      resolveImbaRole(
        { email: "someone@example.com", publicMetadataRole: "board" },
        { "someone@example.com": "hr" },
      ),
    ).toBe("board");
  });

  it("denies access when publicMetadata contains no valid role", () => {
    expect(resolveImbaRole({ publicMetadataRole: "superadmin" })).toBe(DEFAULT_ROLE);
    expect(resolveImbaRole({ publicMetadataRole: 42 })).toBe(DEFAULT_ROLE);
    expect(resolveImbaRole({ publicMetadataRole: null })).toBe(DEFAULT_ROLE);
  });

  it("falls back to the email->role map (case-insensitive) when metadata is absent", () => {
    const map = { "kent@imba.com": "executive" as const };
    expect(resolveImbaRole({ email: "kent@imba.com" }, map)).toBe("executive");
    expect(resolveImbaRole({ email: "KENT@imba.com" }, map)).toBe("executive");
  });

  it("returns no role for unknown or missing identities", () => {
    expect(resolveImbaRole({})).toBe(DEFAULT_ROLE);
    expect(resolveImbaRole({ email: "stranger@example.com" })).toBe(DEFAULT_ROLE);
    expect(resolveImbaRole({ email: null })).toBe(DEFAULT_ROLE);
  });

  it("recognizes exactly the known IMBA role keys", () => {
    expect(isImbaRoleKey("executive")).toBe(true);
    expect(isImbaRoleKey("finance")).toBe(true);
    expect(isImbaRoleKey("nope")).toBe(false);
    expect(isImbaRoleKey(undefined)).toBe(false);
  });

  it("accepts Clerk organization role tokens when public metadata is absent", () => {
    expect(resolveImbaRole({ organizationRole: "org:executive" })).toBe("executive");
    expect(resolveImbaRole({ organizationRole: "executive" })).toBe("executive");
    expect(resolveImbaRole({ organizationRole: "org:board" })).toBe("board");
  });

  it("keeps the CEO and Board labels distinct", () => {
    expect(imbaRoleProfiles.executive.label).toBe("CEO");
    expect(imbaRoleProfiles.board.label).toBe("Board");
  });
});
