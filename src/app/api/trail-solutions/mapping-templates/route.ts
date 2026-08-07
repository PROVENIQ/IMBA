import { NextResponse } from "next/server";

import type { ImportMappingPlanEntry } from "@/core/trail-solutions/import-lab";
import { canWriteTrailData, listMappingTemplates, saveMappingTemplate } from "@/lib/trail-workspace-repo";
import { jsonError, resolveTrailActor, toErrorResponse, trailResponseHeaders } from "@/lib/trail-solutions-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const actor = await resolveTrailActor();
  if (!actor) return jsonError("You must be signed in.", 401);
  try {
    const templates = await listMappingTemplates(actor.organizationId);
    return NextResponse.json({ templates }, { headers: trailResponseHeaders });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const actor = await resolveTrailActor();
  if (!actor) return jsonError("You must be signed in.", 401);
  if (!canWriteTrailData(actor.role)) return jsonError("CEO or Finance access is required.", 403);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.name !== "string" || !body.name.trim()) throw new TypeError("A template name is required.");
    if (!Array.isArray(body.mappings)) throw new TypeError("Mappings are required.");
    const template = await saveMappingTemplate(actor, {
      name: body.name,
      sourceLabel: typeof body.sourceLabel === "string" ? body.sourceLabel : "",
      mappings: body.mappings as ImportMappingPlanEntry[],
    });
    return NextResponse.json({ template }, { headers: trailResponseHeaders });
  } catch (error) {
    return toErrorResponse(error);
  }
}
