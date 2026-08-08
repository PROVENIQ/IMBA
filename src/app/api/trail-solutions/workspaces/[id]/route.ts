import { NextResponse } from "next/server";

import {
  archiveWorkspace,
  canAdministerTrailData,
  canWriteTrailData,
  promoteToProduction,
  renameWorkspace,
  softDeleteWorkspace,
} from "@/lib/trail-workspace-repo";
import { jsonError, resolveTrailActor, toErrorResponse, trailResponseHeaders } from "@/lib/trail-solutions-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const actor = await resolveTrailActor();
  if (!actor) return jsonError("You must be signed in.", 401);
  if (!canWriteTrailData(actor.role)) return jsonError("CEO or Finance access is required.", 403);
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;
    if (action === "archive" || action === "restore") {
      await archiveWorkspace(actor, id, action === "archive");
    } else if (action === "rename") {
      if (typeof body.name !== "string") throw new TypeError("A new name is required.");
      await renameWorkspace(actor, id, body.name);
    } else if (action === "promote") {
      if (!canAdministerTrailData(actor.role)) return jsonError("CEO access is required to promote data to production.", 403);
      await promoteToProduction(actor, id);
    } else {
      throw new TypeError("Action must be archive, restore, or promote.");
    }
    return NextResponse.json({ ok: true }, { headers: trailResponseHeaders });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const actor = await resolveTrailActor();
  if (!actor) return jsonError("You must be signed in.", 401);
  if (!canWriteTrailData(actor.role)) return jsonError("CEO or Finance access is required.", 403);
  try {
    const { id } = await params;
    await softDeleteWorkspace(actor, id);
    return NextResponse.json({ ok: true }, { headers: trailResponseHeaders });
  } catch (error) {
    return toErrorResponse(error);
  }
}
