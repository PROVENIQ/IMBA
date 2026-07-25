import type {
  MigrationSourcePort,
  SourceControlTotal,
  SourceRecordEnvelope,
} from "@/core/providers/ports";

export interface CiviCsvExport {
  entity: string;
  fileName: string;
  csv: string;
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

export function parseCiviCsv(csv: string): Readonly<Record<string, string>>[] {
  const [headers, ...rows] = parseCsv(csv);
  if (!headers?.length) return [];
  return rows.map((row) =>
    Object.freeze(
      Object.fromEntries(headers.map((header, index) => [header.trim(), row[index] ?? ""])),
    ),
  );
}

function fingerprint(value: string): string {
  let hash = 5381;
  for (const character of value) hash = (Math.imul(hash, 33) ^ character.charCodeAt(0)) >>> 0;
  return `djb2:${hash.toString(16).padStart(8, "0")}`;
}

export class CiviCrmCsvSource implements MigrationSourcePort {
  private readonly records = new Map<string, Readonly<Record<string, string>>[]>();
  private readonly exportId: string;

  constructor(private readonly exports: readonly CiviCsvExport[], private readonly ingestedAt: string) {
    this.exportId = `CIVICRM-${fingerprint(exports.map((item) => `${item.fileName}:${item.csv}`).join("|"))}`;
    for (const item of exports) this.records.set(item.entity, parseCiviCsv(item.csv));
  }

  async inspectSource(): Promise<{ entities: readonly string[]; sourceExportId: string }> {
    return { entities: [...this.records.keys()], sourceExportId: this.exportId };
  }

  async *streamSourceRecords(entity: string): AsyncIterable<SourceRecordEnvelope> {
    const rows = this.records.get(entity) ?? [];
    for (const [index, row] of rows.entries()) {
      const snapshot = Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          /email|phone|name|address/i.test(key) ? "[REDACTED]" : value,
        ]),
      );
      yield {
        sourceSystem: "CIVICRM",
        sourceEntity: entity,
        sourceIdentifier: row.id || String(index + 1),
        sourceExportId: this.exportId,
        ingestedAt: this.ingestedAt,
        fingerprint: fingerprint(JSON.stringify(row)),
        redactedSnapshot: snapshot,
        transformVersion: 1,
        mappingVersion: 1,
        disposition: "STAGED",
      };
    }
  }

  async calculateSourceControlTotals(entity: string): Promise<SourceControlTotal> {
    const rows = this.records.get(entity) ?? [];
    const amountMinorUnits = rows.reduce((sum, row) => {
      const amount = Number(row.total_amount ?? row.amount ?? "0");
      return sum + BigInt(Math.round((Number.isFinite(amount) ? amount : 0) * 100));
    }, BigInt(0));
    return {
      entityType: entity,
      count: rows.length,
      amountMinorUnits,
      currency: "USD",
    };
  }
}
