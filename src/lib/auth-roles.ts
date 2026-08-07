import { imbaRoleProfiles, type ImbaRoleKey } from "@/lib/imba-intelligence-data";

// Maps an authenticated identity to an IMBA-OS role. Kept as a pure, dependency-free
// module (no Clerk imports) so it is usable from server routes, the server page, and
// unit tests alike. The demo role selector remains an in-app exploration tool; this
// only decides the *default* role a signed-in person lands on.

const VALID_ROLES: ReadonlySet<ImbaRoleKey> = new Set(
  Object.keys(imbaRoleProfiles) as ImbaRoleKey[],
);

// The role a signed-in user gets when nothing more specific is known. "executive"
// gives invited pitch viewers the full CEO experience; the real safeguards are the
// invite-only allowlist (Clerk) and the server-side upload gate — not this default.
export const DEFAULT_ROLE: ImbaRoleKey = "executive";

// Configurable allowlist pinning specific invited people to a role. Lowercase emails.
// Edit as the audience is confirmed, e.g. { "kent@imba.com": "executive" }.
export const EMAIL_ROLE_MAP: Readonly<Record<string, ImbaRoleKey>> = {};

export function isImbaRoleKey(value: unknown): value is ImbaRoleKey {
  return typeof value === "string" && VALID_ROLES.has(value as ImbaRoleKey);
}

// Precedence: an explicit Clerk publicMetadata.role wins, then the email map,
// then the safe default. Invalid values are ignored rather than trusted.
export function resolveImbaRole(
  input: { email?: string | null; publicMetadataRole?: unknown },
  emailRoleMap: Readonly<Record<string, ImbaRoleKey>> = EMAIL_ROLE_MAP,
): ImbaRoleKey {
  if (isImbaRoleKey(input.publicMetadataRole)) return input.publicMetadataRole;
  const email = input.email?.toLowerCase().trim();
  if (email) {
    const mapped = emailRoleMap[email];
    if (isImbaRoleKey(mapped)) return mapped;
  }
  return DEFAULT_ROLE;
}
