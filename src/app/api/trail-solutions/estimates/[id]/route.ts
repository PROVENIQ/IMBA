import { NextResponse } from "next/server";

import { deleteEstimate } from "@/lib/job-estimate-repo";
import { canWriteTrailData } from "@/lib/trail-workspace-repo";
import { jsonError, resolveTrailActor, toErrorResponse, trailResponseHeaders } from "@/lib/trail-solutions-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const actor = await resolveTrailActor();
  if (!actor) return jsonError("You must be signed in.", 401);
  if (!canWriteTrailData(actor.role)) return jsonError("CEO or Finance access is required to delete estimates.", 403);
  try {
    const { id } = await params;
    await deleteEstimate(actor, id);
    return NextResponse.json({ ok: true }, { headers: trailResponseHeaders });
  } catch (error) {
    return toErrorResponse(error);
  }
}
