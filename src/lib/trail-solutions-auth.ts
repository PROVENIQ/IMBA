import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { resolveImbaRole } from "@/lib/auth-roles";
import { DbNotConfiguredError, IMBA_ORGANIZATION_ID, type RepoActor } from "@/lib/trail-workspace-repo";

export const trailResponseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

// Resolves the authenticated actor from the Clerk session, keyed to the current
// organization. Returns null when signed out (middleware also blocks this in
// production; this is defense in depth for the API layer).
export async function resolveTrailActor(): Promise<RepoActor | null> {
  const { userId, orgRole } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;
  const role = resolveImbaRole({
    email,
    publicMetadataRole: user?.publicMetadata?.role,
    organizationRole: orgRole,
  });
  if (!role) return null;
  return {
    organizationId: IMBA_ORGANIZATION_ID,
    userId,
    label: user?.fullName ?? email ?? userId,
    role,
  };
}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: trailResponseHeaders });
}

// Maps repository/domain errors to HTTP responses. DbNotConfiguredError → 503 so the
// UI can show a clear "persistence not enabled" state before Neon is provisioned.
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof DbNotConfiguredError) {
    return jsonError("Persistence is not configured yet. Set DATABASE_URL to enable saved workspaces.", 503);
  }
  const message = error instanceof Error ? error.message : "The request could not be processed.";
  return jsonError(message, 400);
}
