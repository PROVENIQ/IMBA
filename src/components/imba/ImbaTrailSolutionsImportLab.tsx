"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileSpreadsheet,
  FolderOpen,
  RefreshCw,
  Save,
  ShieldAlert,
  Trash2,
  UploadCloud,
} from "lucide-react";

import {
  IMPORT_TABLE_SPECS,
  TEST_DATA_BANNER,
  importTableSpec,
  proposeImportField,
  type ImportInspectionResult,
  type ImportMappingPlanEntry,
  type ImportMappingTemplate,
  type ImportReadiness,
  type ImportTableName,
  type ImportWorkspaceMode,
  type TrailSolutionsTestWorkspace,
  type ValidatedImportPackage,
} from "@/core/trail-solutions/import-lab";
import {
  archiveTestWorkspaceRemote,
  commitTestWorkspaceRemote,
  deleteTestWorkspaceRemote,
  fetchMappingTemplates,
  promoteTestWorkspaceRemote,
  renameTestWorkspaceRemote,
  resetTestDataRemote,
  saveMappingTemplateRemote,
} from "@/lib/trail-solutions-test-workspaces";
import type { ImbaRoleKey } from "@/lib/imba-intelligence-data";

const steps = ["Workspace", "Upload", "Map", "Validate", "Preview", "Import", "Review"] as const;

function money(value: number | null): string {
  return value === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function bytes(value: number): string {
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(Math.round(value / 1024), 1)} KB`;
}

function readinessLabel(value: ImportReadiness): string {
  if (value === "ready") return "Ready to import";
  if (value === "warnings") return "Importable with warnings";
  return "Blocked by errors";
}

function readinessClass(value: ImportReadiness): string {
  if (value === "ready") return "bg-emerald-300/10 text-emerald-800 dark:text-emerald-100";
  if (value === "warnings") return "bg-amber-300/10 text-amber-900 dark:text-amber-100";
  return "bg-rose-300/10 text-rose-800 dark:text-rose-100";
}

function downloadFile(fileName: string, content: string, type = "text/csv;charset=utf-8"): void {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function csvCell(value: unknown): string {
  const source = value === null || value === undefined ? "" : String(value);
  return `"${source.replaceAll('"', '""')}"`;
}

function rowsToCsv(rows: readonly Readonly<Record<string, unknown>>[]): string {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\r\n");
}

function initialPlan(inspection: ImportInspectionResult): ImportMappingPlanEntry[] {
  return inspection.tables.map((table) => ({
    sourceTableId: table.sourceTableId,
    targetTable: table.targetTable,
    columns: Object.fromEntries(table.columns.map((column) => [column.sourceHeader, column.targetField])),
  }));
}

function LabCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[20px] border border-[rgb(var(--line)/0.11)] bg-[rgb(var(--card-2))] ${className}`}>{children}</section>;
}

function CardTitle({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return <div className="border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><p className="text-[9px] font-black uppercase tracking-[0.17em] text-blue-800 dark:text-blue-100">{eyebrow}</p><h3 className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">{title}</h3>{note ? <p className="mt-1 text-[11px] leading-5 text-[rgb(var(--text-3))]">{note}</p> : null}</div>;
}

export function ImbaTrailSolutionsImportLab({
  role,
  workspaces,
  onReload,
  onOpenWorkspace,
  onOpenPortfolio,
}: {
  role: ImbaRoleKey;
  workspaces: readonly TrailSolutionsTestWorkspace[];
  onReload: () => Promise<void>;
  onOpenWorkspace: (workspace: TrailSolutionsTestWorkspace) => void;
  onOpenPortfolio: () => void;
}) {
  const canAdminister = role === "executive";
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<ImportWorkspaceMode>("create");
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [inspection, setInspection] = useState<ImportInspectionResult | null>(null);
  const [mappingPlan, setMappingPlan] = useState<ImportMappingPlanEntry[]>([]);
  const [validated, setValidated] = useState<ValidatedImportPackage | null>(null);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState<ImportMappingTemplate[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetchMappingTemplates().then((next) => { if (active) setTemplates(next); }).catch(() => { /* templates are optional */ });
    return () => { active = false; };
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [completedWorkspace, setCompletedWorkspace] = useState<TrailSolutionsTestWorkspace | null>(null);

  const selectedWorkspace = workspaces.find((workspace) => workspace.workspaceId === workspaceId);
  const mappingChangeCount = useMemo(() => {
    if (!inspection) return 0;
    return mappingPlan.reduce((total, entry) => {
      const source = inspection.tables.find((table) => table.sourceTableId === entry.sourceTableId);
      if (!source) return total;
      const original = Object.fromEntries(source.columns.map((column) => [column.sourceHeader, column.targetField]));
      const fieldChanges = Object.entries(entry.columns).filter(([header, value]) => original[header] !== value).length;
      return total + fieldChanges + (source.targetTable !== entry.targetTable ? 1 : 0);
    }, 0);
  }, [inspection, mappingPlan]);

  const chooseMode = (nextMode: ImportWorkspaceMode) => {
    setMode(nextMode);
    if (nextMode === "create") {
      setWorkspaceId("");
      setWorkspaceName("");
      setDescription("");
    }
  };

  const selectExistingWorkspace = (id: string) => {
    setWorkspaceId(id);
    const workspace = workspaces.find((candidate) => candidate.workspaceId === id);
    if (workspace) {
      setWorkspaceName(workspace.name);
      setDescription(workspace.description);
    }
  };

  const submitFiles = async (action: "inspect" | "validate") => {
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("action", action);
      files.forEach((file) => formData.append("files", file));
      if (action === "validate") formData.set("mappingPlan", JSON.stringify(mappingPlan));
      const response = await fetch("/api/trail-solutions/import", {
        method: "POST",
        body: formData,
      });
      const body = await response.json() as ImportInspectionResult | ValidatedImportPackage | { error: string };
      if (!response.ok || "error" in body) throw new Error("error" in body ? body.error : "Import request failed.");
      if (action === "inspect") {
        const result = body as ImportInspectionResult;
        setInspection(result);
        setMappingPlan(initialPlan(result));
        setStep(3);
      } else {
        const result = body as ValidatedImportPackage;
        setValidated(result);
        if (saveTemplate && templateName.trim()) {
          const template = await saveMappingTemplateRemote({ name: templateName, sourceLabel: files.map((file) => file.name).join(", "), mappings: mappingPlan });
          setTemplates((current) => [...current.filter((candidate) => candidate.name.toLowerCase() !== template.name.toLowerCase()), template]);
        }
        setStep(4);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The import request failed.");
    } finally {
      setBusy(false);
    }
  };

  const updateTargetTable = (sourceTableId: string, targetTable: ImportTableName | null) => {
    setMappingPlan((current) => current.map((entry) => {
      if (entry.sourceTableId !== sourceTableId) return entry;
      const inspectionTable = inspection?.tables.find((table) => table.sourceTableId === sourceTableId);
      const columns = Object.fromEntries((inspectionTable?.columns ?? []).map((column) => [column.sourceHeader, targetTable ? proposeImportField(targetTable, column.sourceHeader).field : null]));
      return { ...entry, targetTable, columns };
    }));
  };

  const updateField = (sourceTableId: string, sourceHeader: string, targetField: string | null) => {
    setMappingPlan((current) => current.map((entry) => entry.sourceTableId === sourceTableId ? { ...entry, columns: { ...entry.columns, [sourceHeader]: targetField } } : entry));
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((candidate) => candidate.mappingTemplateId === templateId);
    if (!template || !inspection) return;
    setMappingPlan(inspection.tables.map((table, index) => {
      const candidate = template.mappings.find((mapping) => mapping.targetTable === table.targetTable) ?? template.mappings[index];
      if (!candidate) return initialPlan(inspection)[index];
      return { sourceTableId: table.sourceTableId, targetTable: candidate.targetTable, columns: Object.fromEntries(table.columns.map((column) => [column.sourceHeader, candidate.columns[column.sourceHeader] ?? null])) };
    }));
  };

  const commit = async () => {
    if (!validated || busy) return;
    if (mode === "replace" && !window.confirm(`Replace the active data in “${selectedWorkspace?.name}”? Earlier import versions remain in history.`)) return;
    setBusy(true);
    try {
      const workspace = await commitTestWorkspaceRemote({ mode, workspaceId: workspaceId || undefined, name: workspaceName, description, validatedPackage: validated, mappingTemplateName: saveTemplate ? templateName : undefined, mappingChangeCount });
      await onReload();
      setCompletedWorkspace(workspace);
      onOpenWorkspace(workspace);
      setStep(7);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The workspace could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const runMutation = async (mutate: () => Promise<void>) => {
    try {
      await mutate();
      await onReload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The workspace could not be updated.");
    }
  };

  const rename = (workspace: TrailSolutionsTestWorkspace) => {
    const next = window.prompt("New workspace name", workspace.name)?.trim();
    if (next) void runMutation(() => renameTestWorkspaceRemote(workspace.workspaceId, next));
  };

  const remove = (workspace: TrailSolutionsTestWorkspace) => {
    if (!window.confirm(`Delete “${workspace.name}”? This soft-deletes the workspace (recoverable, audited) and never affects demonstration or production data.`)) return;
    void runMutation(() => deleteTestWorkspaceRemote(workspace.workspaceId));
  };

  const promote = (workspace: TrailSolutionsTestWorkspace) => {
    if (!window.confirm(`Promote “${workspace.name}” to production-derived data? It will be excluded from "Clear test data".`)) return;
    void runMutation(() => promoteTestWorkspaceRemote(workspace.workspaceId));
  };

  const clearAllTestData = () => {
    if (!window.confirm("Clear ALL test workspaces for the organization? Production-promoted workspaces are kept. This is soft-delete + audited.")) return;
    void runMutation(async () => { await resetTestDataRemote(); });
  };

  const resetWizard = () => {
    setStep(1); setMode("create"); setWorkspaceId(""); setWorkspaceName(""); setDescription(""); setFiles([]);
    setInspection(null); setMappingPlan([]); setValidated(null); setAcknowledgedWarnings(false); setCompletedWorkspace(null); setError(null);
  };

  return (
    <div className="space-y-5">
      <LabCard className="overflow-hidden">
        <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
          <div><p className="text-[10px] font-black uppercase tracking-[0.17em] text-blue-800 dark:text-blue-100">Finance control surface</p><h2 className="mt-2 text-xl font-semibold text-[rgb(var(--text))]">Data Import Lab</h2><p className="mt-2 max-w-3xl text-xs leading-6 text-[rgb(var(--text-2))]">Upload, inspect, map, validate, reconcile, and test historical job-cost data without changing accounting records. The Import Lab is a quality-control checkpoint, not a one-click dashboard replacement.</p></div>
          <div className="max-w-sm rounded-2xl border border-amber-300/20 bg-amber-300/[0.055] p-4"><p className="flex gap-2 text-[11px] font-semibold text-amber-900 dark:text-amber-100"><ShieldAlert className="h-4 w-4 shrink-0" />{TEST_DATA_BANNER}</p><p className="mt-2 text-[10px] leading-4 text-[rgb(var(--text-3))]">Uploaded workspaces are stored server-side, shared across your organization, and isolated from demonstration and production accounting systems.</p></div>
        </div>
        <ol className="grid grid-cols-4 border-t border-[rgb(var(--line)/0.08)] md:grid-cols-7">{steps.map((label, index) => <li key={label} className={`border-r border-[rgb(var(--line)/0.06)] px-2 py-3 text-center text-[9px] font-black uppercase tracking-wide last:border-r-0 ${step === index + 1 ? "bg-blue-300 text-[#102030]" : step > index + 1 ? "text-emerald-800 dark:text-emerald-100" : "text-[rgb(var(--text-4))]"}`}><span className="mr-1">{index + 1}</span>{label}</li>)}</ol>
      </LabCard>

      {error ? <div role="alert" className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] p-4 text-xs text-rose-800 dark:text-rose-100">{error}</div> : null}

      {step === 1 ? <>
        <LabCard><CardTitle eyebrow="Step 1" title="Choose the test-workspace operation" note="Uploaded data can never target the demonstration environment or a production system." /><div className="grid gap-3 p-4 md:grid-cols-3">{([['create', 'Create new', 'Start a separately named test workspace.'], ['replace', 'Replace existing', 'Create a new version while preserving prior import history.'], ['add', 'Add to existing', 'Add projects only when Project IDs do not collide.']] as const).map(([value, label, note]) => <button key={value} type="button" onClick={() => chooseMode(value)} className={`rounded-2xl border p-4 text-left ${mode === value ? "border-blue-300/40 bg-blue-300/10" : "border-[rgb(var(--line)/0.1)]"}`}><p className="text-xs font-semibold text-[rgb(var(--text))]">{label}</p><p className="mt-2 text-[11px] leading-5 text-[rgb(var(--text-3))]">{note}</p></button>)}</div><div className="grid gap-3 border-t border-[rgb(var(--line)/0.07)] p-4 md:grid-cols-2">{mode !== "create" ? <label className="text-[10px] font-bold uppercase text-[rgb(var(--text-3))]">Existing workspace<select value={workspaceId} onChange={(event) => selectExistingWorkspace(event.target.value)} className="mt-2 w-full rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card))] px-3 py-2.5 text-xs font-normal normal-case text-[rgb(var(--text))]"><option value="">Select workspace</option>{workspaces.filter((workspace) => !workspace.archived).map((workspace) => <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.name}</option>)}</select></label> : <label className="text-[10px] font-bold uppercase text-[rgb(var(--text-3))]">Workspace name<input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Historical Pilot — Planning Projects" className="mt-2 w-full rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card))] px-3 py-2.5 text-xs font-normal normal-case text-[rgb(var(--text))]" /></label>}<label className="text-[10px] font-bold uppercase text-[rgb(var(--text-3))]">Description<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What this workspace is testing" className="mt-2 w-full rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card))] px-3 py-2.5 text-xs font-normal normal-case text-[rgb(var(--text))]" /></label></div><div className="flex justify-end p-4 pt-0"><button type="button" disabled={!workspaceName.trim() || (mode !== "create" && !workspaceId)} onClick={() => setStep(2)} className="inline-flex items-center gap-2 rounded-xl bg-blue-300 px-4 py-2.5 text-[10px] font-black uppercase text-[#102030] disabled:opacity-40">Continue to upload <ArrowRight className="h-3.5 w-3.5" /></button></div></LabCard>
        <WorkspaceLibrary workspaces={workspaces} canAdminister={canAdminister} onOpen={onOpenWorkspace} onRename={rename} onRefresh={(workspace) => { chooseMode("replace"); selectExistingWorkspace(workspace.workspaceId); setStep(1); }} onPromote={promote} onArchive={(workspace) => void runMutation(() => archiveTestWorkspaceRemote(workspace.workspaceId, !workspace.archived))} onDelete={remove} onClearAll={clearAllTestData} />
      </> : null}

      {step === 2 ? <LabCard><CardTitle eyebrow="Step 2" title="Upload workbook or table CSVs" note="Accepted: .xlsx and .csv. Up to 12 files, 12 MB each, 30 MB combined, and 25,000 rows in this prototype." /><div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFiles(Array.from(event.dataTransfer.files)); }} className="m-4 rounded-2xl border border-dashed border-blue-300/30 bg-blue-300/[0.035] p-8 text-center"><UploadCloud className="mx-auto h-8 w-8 text-blue-800 dark:text-blue-100" /><p className="mt-3 text-sm font-semibold text-[rgb(var(--text))]">Drop the standardized workbook or CSV tables here</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">Original files are read for validation and are not modified.</p><input ref={inputRef} type="file" multiple accept=".xlsx,.csv" onChange={(event) => setFiles(Array.from(event.target.files ?? []))} className="sr-only" /><button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded-xl border border-[rgb(var(--line)/0.12)] px-4 py-2 text-[10px] font-black uppercase text-[rgb(var(--text-2))]">Select files</button></div><div className="space-y-2 px-4">{files.map((file) => <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-xl border border-[rgb(var(--line)/0.08)] px-3 py-2 text-[11px]"><span className="flex items-center gap-2 text-[rgb(var(--text))]"><FileSpreadsheet className="h-4 w-4 text-emerald-700 dark:text-emerald-100" />{file.name}</span><span className="text-[rgb(var(--text-4))]">{bytes(file.size)} · pending server receipt</span></div>)}</div><div className="flex justify-between p-4"><button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-[10px] font-bold text-[rgb(var(--text-3))]"><ArrowLeft className="h-3.5 w-3.5" />Back</button><button type="button" disabled={!files.length || busy} onClick={() => submitFiles("inspect")} className="rounded-xl bg-blue-300 px-4 py-2.5 text-[10px] font-black uppercase text-[#102030] disabled:opacity-40">{busy ? "Inspecting…" : "Inspect files"}</button></div></LabCard> : null}

      {step === 3 && inspection ? <LabCard><CardTitle eyebrow="Step 3" title="Inspect and map" note="High-confidence exact matches are proposed. Low-confidence fields remain unmapped until you choose them." /><div className="grid gap-3 border-b border-[rgb(var(--line)/0.07)] p-4 md:grid-cols-[1fr_auto]"><label className="text-[10px] font-bold uppercase text-[rgb(var(--text-3))]">Apply saved mapping<select defaultValue="" onChange={(event) => applyTemplate(event.target.value)} className="mt-2 w-full rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card))] px-3 py-2 text-xs font-normal normal-case text-[rgb(var(--text))]"><option value="">No saved template</option>{templates.map((template) => <option key={template.mappingTemplateId} value={template.mappingTemplateId}>{template.name}</option>)}</select></label><div className="flex items-end gap-2"><label className="flex items-center gap-2 pb-2 text-[11px] text-[rgb(var(--text-2))]"><input type="checkbox" checked={saveTemplate} onChange={(event) => setSaveTemplate(event.target.checked)} />Save mapping template</label>{saveTemplate ? <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} aria-label="Mapping template name" placeholder="QBO export mapping" className="rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--text))]" /> : null}</div></div><div className="space-y-4 p-4">{inspection.tables.map((table) => { const plan = mappingPlan.find((entry) => entry.sourceTableId === table.sourceTableId); const spec = plan?.targetTable ? importTableSpec(plan.targetTable) : null; return <article key={table.sourceTableId} className="overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.09)]"><div className="flex flex-wrap items-center justify-between gap-3 bg-[rgb(var(--card)/55%)] px-4 py-3"><div><p className="text-xs font-semibold text-[rgb(var(--text))]">{table.sourceTableName}</p><p className="mt-1 text-[10px] text-[rgb(var(--text-4))]">{table.fileName} · header row {table.headerRow} · {table.rowCount} data rows</p></div><select aria-label={`Target table for ${table.sourceTableName}`} value={plan?.targetTable ?? ""} onChange={(event) => updateTargetTable(table.sourceTableId, event.target.value ? event.target.value as ImportTableName : null)} className="rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--text))]"><option value="">Do not import</option>{IMPORT_TABLE_SPECS.map((candidate) => <option key={candidate.name} value={candidate.name}>{candidate.name}</option>)}</select></div>{plan?.targetTable ? <div className="divide-y divide-[rgb(var(--line)/0.06)]">{table.columns.map((column) => <div key={column.sourceHeader} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_1fr_1.2fr]"><div><p className="text-[11px] font-semibold text-[rgb(var(--text))]">{column.sourceHeader}</p><p className="mt-1 truncate text-[10px] text-[rgb(var(--text-4))]">{column.sampleValues.join(" · ") || "No sample values"}</p></div><span className="self-center text-[10px] font-bold uppercase text-[rgb(var(--text-4))]">maps to</span><select aria-label={`Mapping for ${column.sourceHeader}`} value={plan.columns[column.sourceHeader] ?? ""} onChange={(event) => updateField(table.sourceTableId, column.sourceHeader, event.target.value || null)} className="rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--text))]"><option value="">Leave unmapped</option>{spec?.fields.map((candidate) => <option key={candidate.field} value={candidate.field}>{candidate.field}{candidate.required ? " — required" : ""}</option>)}</select></div>)}</div> : null}</article>; })}</div><div className="flex justify-between p-4 pt-0"><button type="button" onClick={() => setStep(2)} className="inline-flex items-center gap-2 text-[10px] font-bold text-[rgb(var(--text-3))]"><ArrowLeft className="h-3.5 w-3.5" />Back</button><button type="button" disabled={busy || (saveTemplate && !templateName.trim())} onClick={() => submitFiles("validate")} className="rounded-xl bg-blue-300 px-4 py-2.5 text-[10px] font-black uppercase text-[#102030] disabled:opacity-40">{busy ? "Validating…" : "Run validation"}</button></div></LabCard> : null}

      {step === 4 && validated ? <LabCard><CardTitle eyebrow="Step 4" title="Validation results" note="Errors block import only when reliable project reporting cannot be produced. Quarantined rows never receive a silent project assignment." /><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] p-4"><span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${readinessClass(validated.readiness)}`}>{readinessLabel(validated.readiness)}</span><p className="text-[11px] text-[rgb(var(--text-3))]">{validated.issues.filter((issue) => issue.severity === "error").length} errors · {validated.preview.warningCount} warnings · {validated.preview.rejectedRecordCount} quarantined</p></div><div className="max-h-[520px] divide-y divide-[rgb(var(--line)/0.06)] overflow-y-auto">{validated.issues.length ? validated.issues.map((item) => <div key={item.issueId} className="grid gap-2 px-4 py-3 md:grid-cols-[110px_1fr_1fr]"><span className={`h-fit rounded-full px-2 py-1 text-center text-[9px] font-black uppercase ${item.severity === "error" ? "bg-rose-300/10 text-rose-800 dark:text-rose-100" : item.severity === "warning" ? "bg-amber-300/10 text-amber-900 dark:text-amber-100" : "bg-blue-300/10 text-blue-800 dark:text-blue-100"}`}>{item.severity}</span><div><p className="text-[11px] font-semibold text-[rgb(var(--text))]">{item.description}</p><p className="mt-1 text-[10px] text-[rgb(var(--text-4))]">{item.table ?? "Import"}{item.rowNumber ? ` · row ${item.rowNumber}` : ""}{item.quarantined ? " · quarantined" : ""}</p></div><p className="text-[11px] leading-5 text-[rgb(var(--text-3))]">{item.resolution}</p></div>) : <p className="p-6 text-center text-xs text-emerald-800 dark:text-emerald-100">No validation exceptions were detected.</p>}</div><div className="flex justify-between p-4"><button type="button" onClick={() => setStep(3)} className="inline-flex items-center gap-2 text-[10px] font-bold text-[rgb(var(--text-3))]"><ArrowLeft className="h-3.5 w-3.5" />Back to mapping</button><button type="button" onClick={() => setStep(5)} className="rounded-xl bg-blue-300 px-4 py-2.5 text-[10px] font-black uppercase text-[#102030]">Preview control totals</button></div></LabCard> : null}

      {step === 5 && validated ? <LabCard><CardTitle eyebrow="Step 5" title="Preview what will load" note="Source totals and loaded totals must remain visible before the workspace changes." /><div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">{[["Projects", validated.preview.projectCount.toLocaleString()], ["Transactions", validated.preview.transactionCount.toLocaleString()], ["Estimated cost", money(validated.preview.totalEstimatedCost)], ["Actual cost", money(validated.preview.totalActualCost)], ["Contract value", money(validated.preview.totalContractValue)], ["Labor hours", validated.preview.laborHours?.toLocaleString() ?? "Unavailable"], ["Unmapped", validated.preview.unmappedRecords.toLocaleString()], ["Warnings", validated.preview.warningCount.toLocaleString()]].map(([label, value]) => <div key={label} className="rounded-xl border border-[rgb(var(--line)/0.08)] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">{label}</p><p className="mt-2 font-mono text-base font-semibold text-[rgb(var(--text))]">{value}</p></div>)}</div><div className="overflow-x-auto border-y border-[rgb(var(--line)/0.07)]"><table className="w-full min-w-[660px] text-left text-[11px]"><thead><tr className="text-[9px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]"><th className="px-4 py-3">Control</th><th className="px-4 py-3 text-right">Source</th><th className="px-4 py-3 text-right">Will load</th><th className="px-4 py-3 text-right">Difference</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{validated.preview.controlTotals.map((control) => <tr key={control.label} className="border-t border-[rgb(var(--line)/0.06)]"><td className="px-4 py-3 font-semibold text-[rgb(var(--text))]">{control.label}</td><td className="px-4 py-3 text-right font-mono">{control.sourceValue.toLocaleString()}</td><td className="px-4 py-3 text-right font-mono">{control.loadValue.toLocaleString()}</td><td className="px-4 py-3 text-right font-mono">{control.difference.toLocaleString()}</td><td className="px-4 py-3"><span className={control.status === "reconciled" ? "text-emerald-800 dark:text-emerald-100" : "text-rose-800 dark:text-rose-100"}>{control.status}</span></td></tr>)}</tbody></table></div>{validated.readiness === "warnings" ? <label className="m-4 flex items-start gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.05] p-3 text-[11px] leading-5 text-[rgb(var(--text-2))]"><input className="mt-1" type="checkbox" checked={acknowledgedWarnings} onChange={(event) => setAcknowledgedWarnings(event.target.checked)} />I acknowledge the unresolved differences and understand that affected outputs will remain marked incomplete.</label> : null}<div className="flex justify-between p-4"><button type="button" onClick={() => setStep(4)} className="inline-flex items-center gap-2 text-[10px] font-bold text-[rgb(var(--text-3))]"><ArrowLeft className="h-3.5 w-3.5" />Back</button><button type="button" disabled={validated.readiness === "blocked" || (validated.readiness === "warnings" && !acknowledgedWarnings)} onClick={() => setStep(6)} className="rounded-xl bg-blue-300 px-4 py-2.5 text-[10px] font-black uppercase text-[#102030] disabled:opacity-40">Continue to import</button></div></LabCard> : null}

      {step === 6 && validated ? <LabCard><CardTitle eyebrow="Step 6" title={`Import into ${mode === "create" ? "new" : "existing"} test workspace`} note="This action changes only isolated browser-local test state. It cannot post to QuickBooks, an ERP, ADP, Monday.com, or production IMBA data." /><div className="grid gap-4 p-5 md:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">Destination</p><p className="mt-2 text-base font-semibold text-[rgb(var(--text))]">{workspaceName}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{mode} · {validated.preview.projectCount} projects · {readinessLabel(validated.readiness)}</p></div><div><p className="text-[10px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">Available analyses</p><div className="mt-2 space-y-1">{validated.analyses.map((analysis) => <p key={analysis.analysis} className={`text-[11px] ${analysis.available ? "text-emerald-800 dark:text-emerald-100" : "text-[rgb(var(--text-4))]"}`}>{analysis.available ? "Available" : "Unavailable"} · {analysis.analysis}</p>)}</div></div></div><div className="flex justify-between p-4 pt-0"><button type="button" onClick={() => setStep(5)} className="inline-flex items-center gap-2 text-[10px] font-bold text-[rgb(var(--text-3))]"><ArrowLeft className="h-3.5 w-3.5" />Back</button><button type="button" onClick={commit} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-[10px] font-black uppercase text-[#102030]"><Save className="h-3.5 w-3.5" />Import test workspace</button></div></LabCard> : null}

      {step === 7 && completedWorkspace ? <ReviewResults workspace={completedWorkspace} onOpenPortfolio={onOpenPortfolio} onReset={resetWizard} /> : null}
    </div>
  );
}

function WorkspaceLibrary({ workspaces, canAdminister, onOpen, onRename, onRefresh, onPromote, onArchive, onDelete, onClearAll }: { workspaces: readonly TrailSolutionsTestWorkspace[]; canAdminister: boolean; onOpen: (workspace: TrailSolutionsTestWorkspace) => void; onRename: (workspace: TrailSolutionsTestWorkspace) => void; onRefresh: (workspace: TrailSolutionsTestWorkspace) => void; onPromote: (workspace: TrailSolutionsTestWorkspace) => void; onArchive: (workspace: TrailSolutionsTestWorkspace) => void; onDelete: (workspace: TrailSolutionsTestWorkspace) => void; onClearAll: () => void }) {
  if (!workspaces.length) return null;
  const hasTestData = workspaces.some((workspace) => workspace.environment === "uploaded-test");
  return (
    <LabCard>
      <CardTitle eyebrow="Test workspaces" title="Open or manage isolated test environments" note="Workspaces are shared across your organization and stored server-side. Deletes are soft (recoverable) and audited." />
      {canAdminister && hasTestData ? (
        <div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-4 py-3">
          <p className="text-[10px] leading-4 text-[rgb(var(--text-3))]">Preserve integrity: remove every uploaded <strong>test</strong> workspace at once. Production-promoted data is never touched.</p>
          <button type="button" onClick={onClearAll} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-300/25 bg-rose-300/[0.06] px-3 py-2 text-[10px] font-black uppercase text-rose-800 dark:text-rose-100"><Trash2 className="h-3.5 w-3.5" />Clear all test data</button>
        </div>
      ) : null}
      <div className="grid gap-3 p-4 lg:grid-cols-2">
        {workspaces.map((workspace) => (
          <article key={workspace.workspaceId} className={`rounded-2xl border border-[rgb(var(--line)/0.09)] p-4 ${workspace.archived ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="text-sm font-semibold text-[rgb(var(--text))]">{workspace.name}</h3><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{workspace.description || "No description"}</p></div>
              <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${readinessClass(workspace.dataQualityStatus)}`}>{workspace.dataQualityStatus}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] text-[rgb(var(--text-3))]">
              <div><dt className="font-black uppercase text-[rgb(var(--text-4))]">Projects</dt><dd>{workspace.projectCount}</dd></div>
              <div><dt className="font-black uppercase text-[rgb(var(--text-4))]">Versions</dt><dd>{workspace.versions.length}</dd></div>
              <div><dt className="font-black uppercase text-[rgb(var(--text-4))]">First import</dt><dd>{workspace.firstImportedAt.slice(0, 10)}</dd></div>
              <div><dt className="font-black uppercase text-[rgb(var(--text-4))]">Last import</dt><dd>{workspace.lastImportedAt.slice(0, 10)}</dd></div>
              <div><dt className="font-black uppercase text-[rgb(var(--text-4))]">Imported by</dt><dd>{workspace.importedBy}</dd></div>
              <div><dt className="font-black uppercase text-[rgb(var(--text-4))]">Mapping</dt><dd>{workspace.mappingTemplateName || "Exact / manual mapping"}</dd></div>
            </dl>
            <details className="mt-4 rounded-xl border border-[rgb(var(--line)/0.08)] p-3">
              <summary className="cursor-pointer text-[9px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Import history</summary>
              <div className="mt-2 space-y-2">
                {[...workspace.versions].reverse().map((version) => (
                  <div key={version.versionId} className="grid grid-cols-[1fr_auto] gap-2 border-t border-[rgb(var(--line)/0.06)] pt-2 text-[10px] text-[rgb(var(--text-3))] first:border-0">
                    <span>{version.recordedAt.slice(0, 10)} · {version.mode} · {version.recordsAccepted} accepted</span>
                    <span>{version.recordsRejected} rejected · {version.warningCount} warnings</span>
                  </div>
                ))}
              </div>
            </details>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onOpen(workspace)} className="inline-flex items-center gap-1 rounded-lg bg-blue-300 px-2.5 py-2 text-[9px] font-black uppercase text-[#102030]"><FolderOpen className="h-3 w-3" />Open</button>
              <button type="button" onClick={() => onRename(workspace)} className="rounded-lg border border-[rgb(var(--line)/0.1)] px-2.5 py-2 text-[9px] font-bold">Rename</button>
              <button type="button" onClick={() => onRefresh(workspace)} className="inline-flex items-center gap-1 rounded-lg border border-[rgb(var(--line)/0.1)] px-2.5 py-2 text-[9px] font-bold"><RefreshCw className="h-3 w-3" />Refresh</button>
              {canAdminister && workspace.environment === "uploaded-test" ? <button type="button" onClick={() => onPromote(workspace)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/25 px-2.5 py-2 text-[9px] font-bold text-emerald-800 dark:text-emerald-100"><Check className="h-3 w-3" />Promote</button> : null}
              {workspace.environment === "validated-production-derived" ? <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-300/10 px-2.5 py-2 text-[9px] font-black uppercase text-emerald-800 dark:text-emerald-100"><Check className="h-3 w-3" />Production</span> : null}
              <button type="button" onClick={() => onArchive(workspace)} className="inline-flex items-center gap-1 rounded-lg border border-[rgb(var(--line)/0.1)] px-2.5 py-2 text-[9px] font-bold"><Archive className="h-3 w-3" />{workspace.archived ? "Restore" : "Archive"}</button>
              <button type="button" onClick={() => onDelete(workspace)} className="inline-flex items-center gap-1 rounded-lg border border-rose-300/20 px-2.5 py-2 text-[9px] font-bold text-rose-800 dark:text-rose-100"><Trash2 className="h-3 w-3" />Delete</button>
            </div>
          </article>
        ))}
      </div>
    </LabCard>
  );
}

/* Legacy compact draft retained temporarily while the readable implementation below is used.
function ReviewResults({ workspace, onOpenPortfolio, onReset }: { workspace: TrailSolutionsTestWorkspace; onOpenPortfolio: () => void; onReset: () => void }) {
  const packageData = workspace.validatedPackage;
  const exportRows = (table: string) => packageData.normalizedDataset.tables[table] ?? [];
  return <LabCard><CardTitle eyebrow="Step 7" title="Review import results" note="The active Trail Solutions dashboard now reads only from this isolated test workspace." /><div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">{[["Projects loaded", packageData.preview.projectCount], ["Requires review", packageData.snapshot.projects.filter((project) => project.healthStatus === "data-incomplete").length], ["Rejected / quarantined", packageData.preview.rejectedRecordCount], ["Reconciliation differences", packageData.preview.controlTotals.filter((control) => control.status === "difference").length]].map(([label, value]) => <div key={label} className="rounded-xl border border-[rgb(var(--line)/0.08)] p-3"><p className="text-[9px] font-black uppercase text-[rgb(var(--text-4))]">{label}</p><p className="mt-2 font-mono text-lg font-semibold text-[rgb(var(--text))]">{value}</p></div>)}</div><div className="grid gap-3 border-y border-[rgb(var(--line)/0.07)] p-4 lg:grid-cols-2"><div><p className="text-[10px] font-black uppercase text-[rgb(var(--text-4))]">Available analysis</p>{packageData.analyses.map((analysis) => <div key={analysis.analysis} className="mt-2 flex gap-2 text-[11px]"><Check className={`h-3.5 w-3.5 shrink-0 ${analysis.available ? "text-emerald-700" : "text-[rgb(var(--text-4))]"}`} /><span><strong className="text-[rgb(var(--text))]">{analysis.analysis}</strong> · {analysis.explanation}</span></div>)}</div><div><p className="text-[10px] font-black uppercase text-[rgb(var(--text-4))]">Download controlled outputs</p><div className="mt-3 flex flex-wrap gap-2"><ExportButton label="Exception report" onClick={() => downloadFile("trail-import-exceptions.csv", rowsToCsv(exportRows("Exceptions")))} /><ExportButton label="Project summary" onClick={() => downloadFile("trail-project-summary.csv", rowsToCsv(exportRows("Project Summary")))} /><ExportButton label="Variance report" onClick={() => downloadFile("trail-variance-report.csv", rowsToCsv(packageData.snapshot.projects.flatMap((project) => project.varianceDrivers.map((driver) => ({ projectCode: project.projectCode, projectName: project.projectName, driver: driver.driverType, headline: driver.headline, explanation: driver.explanation, financialEffect: driver.financialEffect ?? null })) )))} /><ExportButton label="Benchmark summary" onClick={() => downloadFile("trail-benchmark-summary.csv", rowsToCsv(packageData.snapshot.benchmarks.map((benchmark) => ({ businessLine: benchmark.businessLine, metric: benchmark.metric, unit: benchmark.unit, low: benchmark.low, median: benchmark.median, high: benchmark.high, sampleSize: benchmark.sampleSize, confidence: benchmark.confidence })))} /><ExportButton label="Reconciliation" onClick={() => downloadFile("trail-reconciliation.csv", rowsToCsv(packageData.preview.controlTotals))} /><ExportButton label="Normalized dataset" onClick={() => downloadFile("trail-normalized-import.json", JSON.stringify(packageData.normalizedDataset, null, 2), "application/json")} /></div></div></div><div className="flex flex-wrap justify-between gap-3 p-4"><button type="button" onClick={onReset} className="text-[10px] font-bold text-[rgb(var(--text-3))]">Start another import</button><button type="button" onClick={onOpenPortfolio} className="inline-flex items-center gap-2 rounded-xl bg-blue-300 px-4 py-2.5 text-[10px] font-black uppercase text-[#102030]">Open Trail Solutions portfolio <ArrowRight className="h-3.5 w-3.5" /></button></div></LabCard>;
}

*/
function ExportButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg border border-[rgb(var(--line)/0.1)] px-2.5 py-2 text-[9px] font-bold text-[rgb(var(--text-2))]"><Download className="h-3 w-3" />{label}</button>;
}

function ReviewResults({ workspace, onOpenPortfolio, onReset }: { workspace: TrailSolutionsTestWorkspace; onOpenPortfolio: () => void; onReset: () => void }) {
  const packageData = workspace.validatedPackage;
  const exportRows = (table: string) => packageData.normalizedDataset.tables[table] ?? [];
  const varianceRows = packageData.snapshot.projects.flatMap((project) =>
    project.varianceDrivers.map((driver) => ({
      projectCode: project.projectCode,
      projectName: project.projectName,
      driver: driver.driverType,
      headline: driver.headline,
      explanation: driver.explanation,
      financialEffect: driver.financialEffect ?? null,
    })),
  );
  const benchmarkRows = packageData.snapshot.benchmarks.map((benchmark) => ({
    businessLine: benchmark.businessLine,
    metric: benchmark.metric,
    unit: benchmark.unit,
    low: benchmark.low,
    median: benchmark.median,
    high: benchmark.high,
    sampleSize: benchmark.sampleSize,
    confidence: benchmark.confidence,
  }));

  return (
    <LabCard>
      <CardTitle eyebrow="Step 7" title="Review import results" note="The active Trail Solutions dashboard now reads only from this isolated test workspace." />
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Projects loaded", packageData.preview.projectCount],
          ["Requires review", packageData.snapshot.projects.filter((project) => project.healthStatus === "data-incomplete").length],
          ["Rejected / quarantined", packageData.preview.rejectedRecordCount],
          ["Reconciliation differences", packageData.preview.controlTotals.filter((control) => control.status === "difference").length],
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-[rgb(var(--line)/0.08)] p-3"><p className="text-[9px] font-black uppercase text-[rgb(var(--text-4))]">{label}</p><p className="mt-2 font-mono text-lg font-semibold text-[rgb(var(--text))]">{value}</p></div>)}
      </div>
      <div className="grid gap-3 border-y border-[rgb(var(--line)/0.07)] p-4 lg:grid-cols-2">
        <div>
          <p className="text-[10px] font-black uppercase text-[rgb(var(--text-4))]">Available analysis</p>
          {packageData.analyses.map((analysis) => <div key={analysis.analysis} className="mt-2 flex gap-2 text-[11px]"><Check className={`h-3.5 w-3.5 shrink-0 ${analysis.available ? "text-emerald-700" : "text-[rgb(var(--text-4))]"}`} /><span><strong className="text-[rgb(var(--text))]">{analysis.analysis}</strong> · {analysis.explanation}</span></div>)}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-[rgb(var(--text-4))]">Download controlled outputs</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ExportButton label="Exception report" onClick={() => downloadFile("trail-import-exceptions.csv", rowsToCsv(exportRows("Exceptions")))} />
            <ExportButton label="Project summary" onClick={() => downloadFile("trail-project-summary.csv", rowsToCsv(exportRows("Project Summary")))} />
            <ExportButton label="Variance report" onClick={() => downloadFile("trail-variance-report.csv", rowsToCsv(varianceRows))} />
            <ExportButton label="Benchmark summary" onClick={() => downloadFile("trail-benchmark-summary.csv", rowsToCsv(benchmarkRows))} />
            <ExportButton label="Reconciliation" onClick={() => downloadFile("trail-reconciliation.csv", rowsToCsv(packageData.preview.controlTotals.map((control) => ({ ...control }))))} />
            <ExportButton label="Normalized dataset" onClick={() => downloadFile("trail-normalized-import.json", JSON.stringify(packageData.normalizedDataset, null, 2), "application/json")} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-3 p-4"><button type="button" onClick={onReset} className="text-[10px] font-bold text-[rgb(var(--text-3))]">Start another import</button><button type="button" onClick={onOpenPortfolio} className="inline-flex items-center gap-2 rounded-xl bg-blue-300 px-4 py-2.5 text-[10px] font-black uppercase text-[#102030]">Open Trail Solutions portfolio <ArrowRight className="h-3.5 w-3.5" /></button></div>
    </LabCard>
  );
}
