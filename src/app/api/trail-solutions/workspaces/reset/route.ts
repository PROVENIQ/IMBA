import { NextResponse } from "next/server";

import { canAdministerTrailData, resetTestData } from "@/lib/trail-workspace-repo";
import { jsonError, resolveTrailActor, toErrorResponse, trailResponseHeaders } from "@/lib/trail-solutions-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only reset of test data. Clears only data_class = test; production-promoted
// workspaces are never touched. Soft-delete + audited inside resetTestData.
export async function POST(): Promise<Response> {
  const actor = await resolveTrailActor();
  if (!actor) return jsonError("You must be signed in.", 401);
  if (!canAdministerTrailData(actor.role)) return jsonError("CEO access is required to reset test data.", 403);
  try {
    const clearedCount = await resetTestData(actor);
    return NextResponse.json({ clearedCount }, { headers: trailResponseHeaders });
  } catch (error) {
    return toErrorResponse(error);
  }
}
