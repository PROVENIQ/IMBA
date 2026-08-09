import { NextResponse } from "next/server";

import type { EstimateDriverInput, EstimateResult } from "@/core/trail-solutions/estimator";
import { listEstimates, saveEstimate } from "@/lib/job-estimate-repo";
import { canWriteTrailData } from "@/lib/trail-workspace-repo";
import { jsonError, resolveTrailActor, toErrorResponse, trailResponseHeaders } from "@/lib/trail-solutions-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const actor = await resolveTrailActor();
  if (!actor) return jsonError("You must be signed in.", 401);
  try {
    const estimates = await listEstimates(actor.organizationId);
    return NextResponse.json({ estimates }, { headers: trailResponseHeaders });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const actor = await resolveTrailActor();
  if (!actor) return jsonError("You must be signed in.", 401);
  if (!canWriteTrailData(actor.role)) return jsonError("CEO or Finance access is required to save estimates.", 403);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.name !== "string" || !body.name.trim()) throw new TypeError("An estimate name is required.");
    if (typeof body.businessLine !== "string" || !body.businessLine) throw new TypeError("A business line is required.");
    if (!body.input || typeof body.input !== "object") throw new TypeError("Estimate input is required.");
    if (!body.result || typeof body.result !== "object") throw new TypeError("Estimate result is required.");

    const estimate = await saveEstimate(actor, {
      name: body.name,
      businessLine: body.businessLine,
      input: body.input as EstimateDriverInput,
      result: body.result as EstimateResult,
      benchmarkVersion: typeof body.benchmarkVersion === "string" ? body.benchmarkVersion : undefined,
      linkedProjectCode: typeof body.linkedProjectCode === "string" ? body.linkedProjectCode : undefined,
    });
    return NextResponse.json({ estimate }, { headers: trailResponseHeaders });
  } catch (error) {
    return toErrorResponse(error);
  }
}
