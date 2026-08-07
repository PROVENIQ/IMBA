import ExcelJS from "exceljs";

import {
  IMPORT_TABLE_SPECS,
  detectImportTableName,
  importTableSpec,
  normalizedImportKey,
  proposeImportField,
  type ImportColumnMapping,
  type ImportFileDescriptor,
  type ImportInspectionResult,
  type ImportIssue,
  type ImportMappingPlanEntry,
  type ImportReadiness,
  type ImportTableInspection,
  type ImportTableName,
} from "@/core/trail-solutions/import-lab";
import { asImportAttemptId } from "@/core/primitives/identity";

export const IMPORT_LIMITS = Object.freeze({
  maximumFiles: 12,
  maximumFileBytes: 12 * 1024 * 1024,
  maximumTotalBytes: 30 * 1024 * 1024,
  maximumRows: 25_000,
});

const PROHIBITED_HEADER_PATTERNS: readonly RegExp[] = [
  /\bsocial security\b/i,
  /^ssn$/i,
  /\bbank account\b/i,
  /\brouting number\b/i,
  /\bcredit card\b/i,
  /\bcard number\b/i,
  /\bdonor (name|email|phone|address)\b/i,
  /\bpersonal email\b/i,
  /\bdate of birth\b/i,
];

const REDACTED_SAMPLE_HEADERS: readonly RegExp[] = [
  /employee|resource/i,
  /project manager/i,
  /vendor|payee/i,
  /reviewed by|approved by/i,
  /notes?/i,
];

const PROHIBITED_IDENTITY_VALUE_HEADERS: readonly RegExp[] = [
  /^employee\s*\/\s*resource$/i,
  /^project manager$/i,
];

type ImportScalar = string | number | boolean | null;

export interface ParsedSourceTable {
  readonly sourceTableId: string;
  readonly fileName: string;
  readonly sourceTableName: string;
  readonly detectedTable: ImportTableName | null;
  readonly headerRow: number;
  readonly headers: readonly string[];
  readonly rows: readonly Readonly<Record<string, ImportScalar>>[];
}

export interface ParsedImportFiles {
  readonly files: readonly ImportFileDescriptor[];
  readonly tables: readonly ParsedSourceTable[];
  readonly securityIssues: readonly ImportIssue[];
}

export interface MappedImportTables {
  readonly tables: Readonly<Partial<Record<ImportTableName, readonly Readonly<Record<string, ImportScalar>>[]>>>;
  readonly issues: readonly ImportIssue[];
}

function issue(input: Omit<ImportIssue, "issueId">): ImportIssue {
  return Object.freeze({ issueId: crypto.randomUUID(), ...input });
}

function readiness(issues: readonly ImportIssue[]): ImportReadiness {
  if (issues.some((candidate) => candidate.severity === "error")) return "blocked";
  if (issues.some((candidate) => candidate.severity === "warning")) return "warnings";
  return "ready";
}

function extension(fileName: string): "xlsx" | "csv" | null {
  if (/\.xlsx$/i.test(fileName)) return "xlsx";
  if (/\.csv$/i.test(fileName)) return "csv";
  return null;
}

function cellScalar(value: ExcelJS.CellValue | undefined): ImportScalar {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") {
    if ("result" in value) return cellScalar(value.result as ExcelJS.CellValue | undefined);
    if ("formula" in value) return null;
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
  }
  return String(value);
}

function stringValue(value: ImportScalar): string {
  if (value === null) return "";
  return String(value).trim();
}

function recordKeyValue(value: ImportScalar): boolean {
  const normalized = stringValue(value);
  return Boolean(normalized && !/^(?:0|n\/?a|none|null|-|—)$/i.test(normalized));
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  row.push(value);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function detectHeaderRow(matrix: readonly ImportScalar[][], table: ImportTableName | null): number {
  let bestIndex = 0;
  let bestScore = -1;
  const expected = table ? importTableSpec(table).fields.map((candidate) => normalizedImportKey(candidate.field)) : [];
  matrix.slice(0, 12).forEach((row, index) => {
    // Merged Excel title/instruction cells are repeated by ExcelJS for every
    // cell in the merged range. Count their text once so a wide merged note
    // cannot outrank the real field-name row.
    const values = Array.from(new Set(row.map(stringValue).filter(Boolean)));
    const recognized = table
      ? values.filter((value) => expected.includes(normalizedImportKey(value)) || proposeImportField(table, value).field).length
      : 0;
    const score = recognized * 10 + values.length;
    if (values.length >= 2 && score > bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  });
  return bestIndex;
}

function tableFromMatrix(input: {
  fileName: string;
  sourceTableName: string;
  matrix: readonly ImportScalar[][];
}): ParsedSourceTable | null {
  const detectedTable = detectImportTableName(input.sourceTableName) ?? detectImportTableName(input.fileName);
  if (!detectedTable && /\.xlsx$/i.test(input.fileName)) return null;
  const headerIndex = detectHeaderRow(input.matrix, detectedTable);
  const headerCells = input.matrix[headerIndex] ?? [];
  const seenHeaders = new Set<string>();
  const headerColumns = headerCells.flatMap((value, index) => {
    const header = stringValue(value);
    if (!header || seenHeaders.has(header)) return [];
    seenHeaders.add(header);
    return [{ header, index }];
  });
  const headers = headerColumns.map((column) => column.header);
  const recordKeyHeaders = detectedTable
    ? headerColumns.filter((column) => {
        const targetField = proposeImportField(detectedTable, column.header).field;
        const targetSpec = targetField ? importTableSpec(detectedTable).fields.find((candidate) => candidate.field === targetField) : undefined;
        return Boolean(targetSpec?.required && targetSpec.kind !== "number");
      }).map((column) => column.header)
    : [];
  const rows = input.matrix.slice(headerIndex + 1)
    .map((row) => Object.freeze(Object.fromEntries(headerColumns.map((column) => [column.header, row[column.index] ?? null]))))
    // Standardized templates contain preformatted/formula rows. A row becomes
    // a record only when at least one required identifier/text key is present.
    .filter((row) => recordKeyHeaders.length
      ? recordKeyHeaders.some((header) => recordKeyValue(row[header] ?? null))
      : Object.values(row).some((value) => stringValue(value)));
  return Object.freeze({
    sourceTableId: crypto.randomUUID(),
    fileName: input.fileName,
    sourceTableName: input.sourceTableName,
    detectedTable,
    headerRow: headerIndex + 1,
    headers,
    rows,
  });
}

async function parseXlsx(file: File): Promise<{ tables: ParsedSourceTable[]; detectedTables: string[] }> {
  const workbook = new ExcelJS.Workbook();
  const workbookBytes = Buffer.from(await file.arrayBuffer()) as unknown as Parameters<typeof workbook.xlsx.load>[0];
  await workbook.xlsx.load(workbookBytes);
  const tables: ParsedSourceTable[] = [];
  const detectedTables: string[] = [];
  workbook.eachSheet((worksheet) => {
    detectedTables.push(worksheet.name);
    const matrix: ImportScalar[][] = [];
    // Preserve physical worksheet row positions so the mapping review points
    // Finance users to the same header row they see in Excel.
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values: ImportScalar[] = [];
      for (let column = 1; column <= row.cellCount; column += 1) {
        values.push(cellScalar(row.getCell(column).value));
      }
      matrix.push(values);
    });
    const parsed = tableFromMatrix({ fileName: file.name, sourceTableName: worksheet.name, matrix });
    if (parsed) tables.push(parsed);
  });
  return { tables, detectedTables };
}

async function parseCsvFile(file: File): Promise<{ tables: ParsedSourceTable[]; detectedTables: string[] }> {
  const matrix = parseCsv(await file.text());
  const sourceTableName = file.name.replace(/\.csv$/i, "");
  const parsed = tableFromMatrix({ fileName: file.name, sourceTableName, matrix });
  return { tables: parsed ? [parsed] : [], detectedTables: [sourceTableName] };
}

function securityIssues(tables: readonly ParsedSourceTable[]): ImportIssue[] {
  const issues: ImportIssue[] = [];
  for (const table of tables) {
    for (const header of table.headers) {
      if (PROHIBITED_HEADER_PATTERNS.some((pattern) => pattern.test(header))) {
        issues.push(issue({
          severity: "error",
          code: "PROHIBITED_SENSITIVE_FIELD",
          sourceTableId: table.sourceTableId,
          field: header,
          description: `${table.sourceTableName} contains prohibited sensitive field “${header}”.`,
          resolution: "Remove the prohibited column and upload a privacy-minimized export.",
          quarantined: true,
        }));
      }
      if (
        PROHIBITED_IDENTITY_VALUE_HEADERS.some((pattern) => pattern.test(header))
        && table.rows.some((row) => recordKeyValue(row[header] ?? null))
      ) {
        issues.push(issue({
          severity: "error",
          code: "PROHIBITED_EMPLOYEE_IDENTITY",
          sourceTableId: table.sourceTableId,
          field: header,
          description: `${table.sourceTableName} contains employee identity values in “${header}”.`,
          resolution: "Remove employee names and identifiers; aggregate labor by role before upload.",
          quarantined: true,
        }));
      }
    }
  }
  return issues;
}

export async function parseImportFiles(files: readonly File[], actor: string, serverTime: string): Promise<ParsedImportFiles> {
  if (!files.length) throw new TypeError("At least one workbook or CSV file is required.");
  if (files.length > IMPORT_LIMITS.maximumFiles) throw new TypeError(`A maximum of ${IMPORT_LIMITS.maximumFiles} files is allowed.`);
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > IMPORT_LIMITS.maximumTotalBytes) throw new TypeError("The combined upload exceeds the 30 MB prototype limit.");

  const parsedTables: ParsedSourceTable[] = [];
  const descriptors: ImportFileDescriptor[] = [];
  for (const file of files) {
    const fileType = extension(file.name);
    if (!fileType) throw new TypeError(`${file.name} is not a supported .xlsx or .csv file.`);
    if (file.size > IMPORT_LIMITS.maximumFileBytes) throw new TypeError(`${file.name} exceeds the 12 MB prototype limit.`);
    const parsed = fileType === "xlsx" ? await parseXlsx(file) : await parseCsvFile(file);
    parsedTables.push(...parsed.tables);
    descriptors.push(Object.freeze({
      fileName: file.name,
      fileType,
      sizeBytes: file.size,
      uploadedAt: serverTime,
      uploadedBy: actor,
      detectedTables: parsed.detectedTables,
    }));
  }
  const totalRows = parsedTables.reduce((total, table) => total + table.rows.length, 0);
  if (totalRows > IMPORT_LIMITS.maximumRows) throw new TypeError(`The upload exceeds the ${IMPORT_LIMITS.maximumRows.toLocaleString()} row prototype limit.`);
  return Object.freeze({ files: descriptors, tables: parsedTables, securityIssues: securityIssues(parsedTables) });
}

function safeSamples(table: ParsedSourceTable, header: string): string[] {
  if (REDACTED_SAMPLE_HEADERS.some((pattern) => pattern.test(header))) return ["[redacted]"];
  return table.rows.map((row) => stringValue(row[header])).filter(Boolean).slice(0, 3);
}

export function inspectParsedImport(parsed: ParsedImportFiles, serverTime: string): ImportInspectionResult {
  const issues: ImportIssue[] = [...parsed.securityIssues];
  const tables: ImportTableInspection[] = parsed.tables.map((table) => {
    const targetTable = table.detectedTable;
    if (!targetTable) {
      issues.push(issue({
        severity: "warning",
        code: "UNRECOGNIZED_TABLE",
        sourceTableId: table.sourceTableId,
        description: `${table.fileName} table “${table.sourceTableName}” was not recognized.`,
        resolution: "Choose the intended normalized table before validation.",
        quarantined: false,
      }));
    }
    const columns: ImportColumnMapping[] = table.headers.map((header) => {
      const proposed = targetTable ? proposeImportField(targetTable, header) : { field: null, confidence: "low" as const };
      if (targetTable && proposed.field === null) {
        issues.push(issue({
          severity: "information",
          code: "UNEXPECTED_FIELD",
          table: targetTable,
          sourceTableId: table.sourceTableId,
          field: header,
          description: `“${header}” is not part of the ${targetTable} import contract.`,
          resolution: "Leave it unmapped or choose an approved normalized field.",
          quarantined: false,
        }));
      }
      return Object.freeze({
        sourceHeader: header,
        targetField: proposed.confidence === "high" ? proposed.field : null,
        confidence: proposed.confidence,
        sampleValues: safeSamples(table, header),
      });
    });
    return Object.freeze({
      sourceTableId: table.sourceTableId,
      fileName: table.fileName,
      sourceTableName: table.sourceTableName,
      targetTable,
      headerRow: table.headerRow,
      rowCount: table.rows.length,
      columns,
    });
  });

  const detectedTargets = new Set(tables.map((table) => table.targetTable));
  for (const spec of IMPORT_TABLE_SPECS.filter((candidate) => candidate.requiredForAnalysis)) {
    if (!detectedTargets.has(spec.name)) {
      issues.push(issue({
        severity: "error",
        code: "MISSING_REQUIRED_TABLE",
        table: spec.name,
        description: `${spec.name} is required to identify projects.`,
        resolution: `Upload or map one source table to ${spec.name}.`,
        quarantined: false,
      }));
    }
  }
  return Object.freeze({
    attemptId: asImportAttemptId(crypto.randomUUID()),
    occurredAt: serverTime,
    ingestedAt: serverTime,
    recordedAt: serverTime,
    files: parsed.files,
    tables,
    issues,
    readiness: readiness(issues),
  });
}

export function applyImportMapping(parsed: ParsedImportFiles, plan: readonly ImportMappingPlanEntry[]): MappedImportTables {
  const issues: ImportIssue[] = [...parsed.securityIssues];
  const grouped = new Map<ImportTableName, Readonly<Record<string, ImportScalar>>[]>();
  for (const source of parsed.tables) {
    const mapping = plan.find((entry) => entry.sourceTableId === source.sourceTableId);
    const targetTable = mapping?.targetTable ?? source.detectedTable;
    if (!targetTable) continue;
    const spec = importTableSpec(targetTable);
    const fieldMap = mapping?.columns ?? Object.fromEntries(source.headers.map((header) => [header, proposeImportField(targetTable, header).field]));
    const usedTargets = new Set(Object.values(fieldMap).filter((value): value is string => Boolean(value)));
    for (const required of spec.fields.filter((candidate) => candidate.required)) {
      if (!usedTargets.has(required.field)) {
        issues.push(issue({
          severity: "error",
          code: "MISSING_REQUIRED_FIELD",
          table: targetTable,
          sourceTableId: source.sourceTableId,
          field: required.field,
          description: `${targetTable} is missing required field “${required.field}”.`,
          resolution: "Map a source column to the required field.",
          quarantined: false,
        }));
      }
    }
    const rows = source.rows.map((row) => Object.freeze(Object.fromEntries(
      Object.entries(fieldMap)
        .filter((entry): entry is [string, string] => Boolean(entry[1]))
        .map(([sourceHeader, targetField]) => [targetField, row[sourceHeader] ?? null]),
    )));
    grouped.set(targetTable, [...(grouped.get(targetTable) ?? []), ...rows]);
  }
  if (!grouped.has("Project Master")) {
    issues.push(issue({
      severity: "error",
      code: "MISSING_REQUIRED_TABLE",
      table: "Project Master",
      description: "Project Master is required to identify projects.",
      resolution: "Upload or map one source table to Project Master.",
      quarantined: false,
    }));
  }
  return Object.freeze({ tables: Object.fromEntries(grouped), issues });
}

export function importReadiness(issues: readonly ImportIssue[]): ImportReadiness {
  return readiness(issues);
}
