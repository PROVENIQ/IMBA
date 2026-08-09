import { imbaRoleProfiles, type ImbaRoleKey } from "@/lib/imba-intelligence-data";

// Maps an authenticated identity to an IMBA-OS role. Kept as a pure, dependency-free
// module (no Clerk imports) so it is usable from server routes, the server page, and
// unit tests alike. The demo role selector remains an in-app exploration tool; this
// only decides the *default* role a signed-in person lands on.

const VALID_ROLES: ReadonlySet<ImbaRoleKey> = new Set(
  Object.keys(imbaRoleProfiles) as ImbaRoleKey[],
);

// No role is a hard deny. An invited-but-unassigned person must not inherit
// Board visibility or any other IMBA data. Real users must receive an explicit
// role via Clerk publicMetadata.role or organization membership.
export const DEFAULT_ROLE: ImbaRoleKey | null = null;

// Configurable allowlist pinning specific invited people to a role. Lowercase emails.
// Edit as the audience is confirmed, e.g. { "kent@imba.com": "executive" }.
export const EMAIL_ROLE_MAP: Readonly<Record<string, ImbaRoleKey>> = {};

export function isImbaRoleKey(value: unknown): value is ImbaRoleKey {
  return typeof value === "string" && VALID_ROLES.has(value as ImbaRoleKey);
}

function canonicalRole(value: unknown): ImbaRoleKey | null {
  if (isImbaRoleKey(value)) return value;
  if (typeof value === "string" && value.startsWith("org:")) {
    const organizationRole = value.slice("org:".length);
    return isImbaRoleKey(organizationRole) ? organizationRole : null;
  }
  return null;
}

// Clerk publicMetadata.role uses the canonical keys directly: "executive" is
// the CEO role, while "board" is the Board oversight role. Clerk organization
// roles are accepted as either "executive" or the token form "org:executive".
// Precedence: explicit public metadata wins, then the organization role, then
// the email map,
// then the safe default. Invalid values are ignored rather than trusted.
export function resolveImbaRole(
  input: { email?: string | null; publicMetadataRole?: unknown; organizationRole?: unknown },
  emailRoleMap: Readonly<Record<string, ImbaRoleKey>> = EMAIL_ROLE_MAP,
): ImbaRoleKey | null {
  const metadataRole = canonicalRole(input.publicMetadataRole);
  if (metadataRole) return metadataRole;
  const organizationRole = canonicalRole(input.organizationRole);
  if (organizationRole) return organizationRole;
  const email = input.email?.toLowerCase().trim();
  if (email) {
    const mapped = emailRoleMap[email];
    if (isImbaRoleKey(mapped)) return mapped;
  }
  return DEFAULT_ROLE;
}
