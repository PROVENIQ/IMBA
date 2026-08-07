import { NextResponse } from "next/server";

import {
  IMPORT_TABLE_SPECS,
  type ImportMappingPlanEntry,
  type ImportTableName,
} from "@/core/trail-solutions/import-lab";
import {
  applyImportMapping,
  inspectParsedImport,
  parseImportFiles,
} from "@/integrations/trail-solutions/import-parser";
import { transformMappedImport } from "@/integrations/trail-solutions/import-transformer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

function parseMappingPlan(value: FormDataEntryValue | null): ImportMappingPlanEntry[] {
  if (typeof value !== "string") return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new TypeError("Mapping plan must be an array.");
  const allowedTables = new Set<ImportTableName>(IMPORT_TABLE_SPECS.map((spec) => spec.name));
  return parsed.map((entry): ImportMappingPlanEntry => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new TypeError("Invalid mapping entry.");
    const record = entry as Record<string, unknown>;
    if (typeof record.sourceTableId !== "string") throw new TypeError("Mapping sourceTableId is required.");
    if (record.targetTable !== null && (typeof record.targetTable !== "string" || !allowedTables.has(record.targetTable as ImportTableName))) {
      throw new TypeError("Mapping targetTable is invalid.");
    }
    if (!record.columns || typeof record.columns !== "object" || Array.isArray(record.columns)) throw new TypeError("Mapping columns are required.");
    const columns = Object.fromEntries(Object.entries(record.columns).map(([sourceHeader, target]) => {
      if (target !== null && typeof target !== "string") throw new TypeError("Mapping target fields must be strings or null.");
      return [sourceHeader, target];
    }));
    return { sourceTableId: record.sourceTableId, targetTable: record.targetTable as ImportTableName | null, columns };
  });
}

export async function POST(request: Request): Promise<Response> {
  const role = request.headers.get("x-imba-demo-role");
  if (role !== "finance" && role !== "executive") {
    return NextResponse.json(
      { error: "CEO or Finance access is required for Data Import Lab uploads." },
      { status: 403, headers: responseHeaders },
    );
  }

  try {
    const formData = await request.formData();
    const action = formData.get("action");
    if (action !== "inspect" && action !== "validate") throw new TypeError("Import action must be inspect or validate.");
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);
    const serverTime = new Date().toISOString();
    const actorLabel = role === "executive" ? "CEO user (prototype role)" : "Finance user (prototype role)";
    const parsed = await parseImportFiles(files, actorLabel, serverTime);
    if (action === "inspect") {
      return NextResponse.json(inspectParsedImport(parsed, serverTime), { headers: responseHeaders });
    }
    const mappingPlan = parseMappingPlan(formData.get("mappingPlan"));
    const mapped = applyImportMapping(parsed, mappingPlan);
    const validatedPackage = await transformMappedImport({ mapped, files: parsed.files, serverTime });
    return NextResponse.json(validatedPackage, { headers: responseHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The import could not be processed.";
    return NextResponse.json({ error: message }, { status: 400, headers: responseHeaders });
  }
}
