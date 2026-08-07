import { describe, expect, it } from "vitest";

import {
  DEFAULT_ROLE,
  isImbaRoleKey,
  resolveImbaRole,
} from "../../src/lib/auth-roles";

describe("resolveImbaRole", () => {
  it("trusts a valid Clerk publicMetadata role above all else", () => {
    expect(resolveImbaRole({ publicMetadataRole: "finance" })).toBe("finance");
    expect(
      resolveImbaRole(
        { email: "someone@example.com", publicMetadataRole: "board" },
        { "someone@example.com": "hr" },
      ),
    ).toBe("board");
  });

  it("ignores an invalid publicMetadata role rather than trusting it", () => {
    expect(resolveImbaRole({ publicMetadataRole: "superadmin" })).toBe(DEFAULT_ROLE);
    expect(resolveImbaRole({ publicMetadataRole: 42 })).toBe(DEFAULT_ROLE);
    expect(resolveImbaRole({ publicMetadataRole: null })).toBe(DEFAULT_ROLE);
  });

  it("falls back to the email->role map (case-insensitive) when metadata is absent", () => {
    const map = { "kent@imba.com": "executive" as const };
    expect(resolveImbaRole({ email: "kent@imba.com" }, map)).toBe("executive");
    expect(resolveImbaRole({ email: "KENT@imba.com" }, map)).toBe("executive");
  });

  it("falls back to the safe default for unknown or missing identities", () => {
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
});
