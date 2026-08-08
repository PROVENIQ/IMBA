import { NextResponse } from "next/server";

import type { ImportWorkspaceMode, ValidatedImportPackage } from "@/core/trail-solutions/import-lab";
import { canWriteTrailData, commitWorkspace, listWorkspaces } from "@/lib/trail-workspace-repo";
import { jsonError, resolveTrailActor, toErrorResponse, trailResponseHeaders } from "@/lib/trail-solutions-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const actor = await resolveTrailActor();
  if (!actor) return jsonError("You must be signed in.", 401);
  try {
    const workspaces = await listWorkspaces(actor.organizationId);
    return NextResponse.json({ workspaces }, { headers: trailResponseHeaders });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const actor = await resolveTrailActor();
  if (!actor) return jsonError("You must be signed in.", 401);
  if (!canWriteTrailData(actor.role)) return jsonError("CEO or Finance access is required to save workspaces.", 403);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const mode = body.mode as ImportWorkspaceMode;
    if (mode !== "create" && mode !== "replace" && mode !== "add") throw new TypeError("Workspace mode must be create, replace, or add.");
    if (typeof body.name !== "string" || !body.name.trim()) throw new TypeError("A workspace name is required.");
    if (!body.validatedPackage || typeof body.validatedPackage !== "object") throw new TypeError("A validated import package is required.");

    const workspace = await commitWorkspace({
      actor,
      mode,
      workspaceId: typeof body.workspaceId === "string" ? body.workspaceId : undefined,
      name: body.name,
      description: typeof body.description === "string" ? body.description : "",
      validatedPackage: body.validatedPackage as ValidatedImportPackage,
      mappingTemplateName: typeof body.mappingTemplateName === "string" ? body.mappingTemplateName : undefined,
      mappingChangeCount: typeof body.mappingChangeCount === "number" ? body.mappingChangeCount : 0,
    });
    return NextResponse.json({ workspace }, { headers: trailResponseHeaders });
  } catch (error) {
    return toErrorResponse(error);
  }
}
