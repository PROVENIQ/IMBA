"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import type { GrantAgreementStatus, GrantFundingRole, ProjectBusinessLine, ProjectStage } from "@/core/trail-solutions/model";
import type { TrailSolutionsTestWorkspace } from "@/core/trail-solutions/import-lab";
import {
  applyForecastUpdate,
  applyChangeOrder,
  applyDecisionAction,
  applyFundingAgreement,
  applyMatchActivity,
  applyOperationalDriver,
  buildManualProjectPackage,
  type ManualActor,
  type ManualChangeOrderInput,
  type ManualDecisionInput,
  type ManualFundingInput,
  type ManualMatchInput,
  type ManualOperationalDriverInput,
  type ManualProjectInput,
} from "@/core/trail-solutions/manual-entry";
import { commitTestWorkspaceRemote } from "@/lib/trail-solutions-test-workspaces";

// Controlled manual create/edit UI. Every form produces (or folds into) the same
// ValidatedImportPackage an import produces, then commits through the one existing
// workspaces write path — so manual projects live in the same snapshot/portfolio as
// imported ones. This is deliberately NOT a general-ledger / transaction-entry UI.

const BUSINESS_LINES: ProjectBusinessLine[] = [
  "Planning & Design",
  "Construction",
  "Signage",
  "Education & Training",
  "Grants & Agreements",
  "Unclassified",
];

const PROJECT_STAGES: ProjectStage[] = ["Scoping", "Active", "Closeout", "On hold", "Completed", "Unknown"];

// Operational drivers shown per business line — irrelevant fields are never forced.
const DRIVER_FIELDS: Partial<Record<ProjectBusinessLine, Array<{ key: keyof ManualOperationalDriverInput; label: string; kind: "number" | "text" }>>> = {
  Construction: [
    { key: "trailMiles", label: "Trail miles", kind: "number" },
    { key: "terrainClass", label: "Terrain class", kind: "text" },
    { key: "crewDays", label: "Crew days", kind: "number" },
    { key: "equipmentDays", label: "Equipment days", kind: "number" },
    { key: "travelMiles", label: "Travel miles", kind: "number" },
  ],
  "Planning & Design": [
    { key: "trailMiles", label: "Trail miles", kind: "number" },
    { key: "siteVisits", label: "Site visits", kind: "number" },
    { key: "stakeholderMeetings", label: "Stakeholder meetings", kind: "number" },
    { key: "designRevisions", label: "Revision cycles", kind: "number" },
  ],
  Signage: [
    { key: "signsDesigned", label: "Units designed", kind: "number" },
    { key: "signsFabricated", label: "Units fabricated", kind: "number" },
    { key: "signsInstalled", label: "Units installed", kind: "number" },
    { key: "travelMiles", label: "Travel miles", kind: "number" },
  ],
};

const FUNDING_TYPES = ["Customer-funded", "Unrestricted", "Grant", "Federal", "Blended"];

export type ManualEntryMode =
  | { kind: "new-project"; prefill?: Partial<ManualProjectInput> }
  | { kind: "forecast"; projectId: string; projectName: string }
  | { kind: "match"; projectId: string; projectName: string }
  | { kind: "change-order"; projectId: string; projectName: string }
  | { kind: "operational-driver"; projectId: string; projectName: string }
  | { kind: "funding"; projectId: string; projectName: string }
  | { kind: "decision"; projectId: string; projectName: string };

export function ManualEntryModal({
  mode,
  actor,
  workspace,
  onDone,
  onCancel,
}: {
  mode: ManualEntryMode;
  actor: ManualActor;
  // The active workspace to write into. When null, a new workspace is created.
  workspace: TrailSolutionsTestWorkspace | null;
  onDone: (result: { workspaceId: string; projectCode?: string }) => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const title =
    mode.kind === "new-project" ? "New project"
    : mode.kind === "forecast" ? `Forecast update — ${mode.projectName}`
    : mode.kind === "match" ? `Match activity — ${mode.projectName}`
    : mode.kind === "change-order" ? `Change order — ${mode.projectName}`
    : mode.kind === "operational-driver" ? `Operational driver — ${mode.projectName}`
    : mode.kind === "funding" ? `Funding / agreement — ${mode.projectName}`
    : `Decision / action — ${mode.projectName}`;

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-start justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-[2px] sm:p-8" role="dialog" aria-modal="true" aria-label={title}>
      <div className="my-2 w-full max-w-2xl max-h-[calc(100vh-1rem)] overflow-y-auto rounded-2xl border border-[rgb(var(--line)/0.16)] bg-[rgb(var(--card))] p-5 text-[rgb(var(--text))] shadow-2xl sm:my-0 sm:max-h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[rgb(var(--text))]">{title}</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="rounded-lg p-1 text-[rgb(var(--text-3))] hover:bg-[rgb(var(--line)/0.06)]"><X className="h-4 w-4" /></button>
        </div>
        {mode.kind === "new-project" ? (
          <p className="mt-1 text-[11px] leading-5 text-[rgb(var(--text-4))]">Creates a project in the active workspace using the same normalized model as imported data. This is project management information, not a general-ledger entry.</p>
        ) : null}
        {error ? <p className="mt-3 rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-[11px] text-rose-800 dark:text-rose-100">{error}</p> : null}

        {mode.kind === "new-project" ? (
          <NewProjectForm busy={busy} prefill={mode.prefill} onSubmit={async (input) => {
            setBusy(true); setError(null);
            try {
              const pkg = buildManualProjectPackage(input, actor, new Date().toISOString());
              const audit = { action: "manual_create", entityType: "trail_project", entityId: input.projectCode, detail: { projectName: input.projectName } };
              const committed = workspace
                ? await commitTestWorkspaceRemote({ mode: "add", workspaceId: workspace.workspaceId, name: workspace.name, description: workspace.description, validatedPackage: pkg, mappingChangeCount: 0, audit })
                : await commitTestWorkspaceRemote({ mode: "create", name: `Manual — ${input.projectName}`.slice(0, 60), description: "Manually created projects", validatedPackage: pkg, mappingChangeCount: 0, audit });
              onDone({ workspaceId: committed.workspaceId, projectCode: input.projectCode });
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "The project could not be saved.");
              setBusy(false);
            }
          }} />
        ) : null}

        {mode.kind === "forecast" && workspace ? (
          <ForecastForm busy={busy} onSubmit={async (form) => {
            setBusy(true); setError(null);
            try {
              const updated = applyForecastUpdate(workspace.validatedPackage, mode.projectId, form, actor, new Date().toISOString());
              const committed = await commitTestWorkspaceRemote({ mode: "replace", workspaceId: workspace.workspaceId, name: workspace.name, description: workspace.description, validatedPackage: updated, mappingChangeCount: 0, audit: { action: "forecast_update", entityType: "trail_project", entityId: mode.projectId } });
              onDone({ workspaceId: committed.workspaceId });
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "The forecast could not be saved.");
              setBusy(false);
            }
          }} />
        ) : null}

        {mode.kind === "match" && workspace ? (
          <MatchForm busy={busy} onSubmit={async (form) => {
            setBusy(true); setError(null);
            try {
              const updated = applyMatchActivity(workspace.validatedPackage, mode.projectId, form, actor, new Date().toISOString());
              const committed = await commitTestWorkspaceRemote({ mode: "replace", workspaceId: workspace.workspaceId, name: workspace.name, description: workspace.description, validatedPackage: updated, mappingChangeCount: 0, audit: { action: "match_activity", entityType: "trail_project", entityId: mode.projectId } });
              onDone({ workspaceId: committed.workspaceId });
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : "The match activity could not be saved.");
              setBusy(false);
            }
          }} />
        ) : null}

        {mode.kind === "change-order" && workspace ? <ChangeOrderForm busy={busy} onSubmit={async (form) => {
          setBusy(true); setError(null);
          try {
            const updated = applyChangeOrder(workspace.validatedPackage, mode.projectId, form, actor, new Date().toISOString());
            const committed = await commitTestWorkspaceRemote({ mode: "replace", workspaceId: workspace.workspaceId, name: workspace.name, description: workspace.description, validatedPackage: updated, mappingChangeCount: 0, audit: { action: "change_order_added", entityType: "trail_project", entityId: mode.projectId } });
            onDone({ workspaceId: committed.workspaceId });
          } catch (reason) { setError(reason instanceof Error ? reason.message : "The change order could not be saved."); setBusy(false); }
        }} /> : null}

        {mode.kind === "operational-driver" && workspace ? <OperationalDriverForm busy={busy} onSubmit={async (form) => {
          setBusy(true); setError(null);
          try {
            const updated = applyOperationalDriver(workspace.validatedPackage, mode.projectId, form, actor, new Date().toISOString());
            const committed = await commitTestWorkspaceRemote({ mode: "replace", workspaceId: workspace.workspaceId, name: workspace.name, description: workspace.description, validatedPackage: updated, mappingChangeCount: 0, audit: { action: "operational_driver_added", entityType: "trail_project", entityId: mode.projectId } });
            onDone({ workspaceId: committed.workspaceId });
          } catch (reason) { setError(reason instanceof Error ? reason.message : "The operational driver could not be saved."); setBusy(false); }
        }} /> : null}

        {mode.kind === "funding" && workspace ? <FundingForm busy={busy} onSubmit={async (form) => {
          setBusy(true); setError(null);
          try {
            const updated = applyFundingAgreement(workspace.validatedPackage, mode.projectId, form, actor, new Date().toISOString());
            const committed = await commitTestWorkspaceRemote({ mode: "replace", workspaceId: workspace.workspaceId, name: workspace.name, description: workspace.description, validatedPackage: updated, mappingChangeCount: 0, audit: { action: "funding_updated", entityType: "trail_project", entityId: mode.projectId } });
            onDone({ workspaceId: committed.workspaceId });
          } catch (reason) { setError(reason instanceof Error ? reason.message : "The funding agreement could not be saved."); setBusy(false); }
        }} /> : null}

        {mode.kind === "decision" && workspace ? <DecisionForm busy={busy} onSubmit={async (form) => {
          setBusy(true); setError(null);
          try {
            const updated = applyDecisionAction(workspace.validatedPackage, mode.projectId, form, actor, new Date().toISOString());
            const committed = await commitTestWorkspaceRemote({ mode: "replace", workspaceId: workspace.workspaceId, name: workspace.name, description: workspace.description, validatedPackage: updated, mappingChangeCount: 0, audit: { action: "decision_action_added", entityType: "trail_project", entityId: mode.projectId } });
            onDone({ workspaceId: committed.workspaceId });
          } catch (reason) { setError(reason instanceof Error ? reason.message : "The decision could not be saved."); setBusy(false); }
        }} /> : null}

        {mode.kind !== "new-project" && !workspace ? (
          <p className="mt-4 text-[11px] text-rose-800 dark:text-rose-100">Select a saved workspace before adding records.</p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

// ---- shared field primitives ----

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.12em] text-[rgb(var(--text-4))]">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card-2))] px-3 py-2 text-[12px] text-[rgb(var(--text))]";

function TextInput({ value, onChange, type = "text", required }: { value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return <input className={inputClass} type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} />;
}

function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
}

function toNumber(v: string): number { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function toOptionalNumber(v: string): number | undefined { if (v.trim() === "") return undefined; const n = Number(v); return Number.isFinite(n) ? n : undefined; }

function Actions({ busy, submitLabel }: { busy: boolean; submitLabel: string }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button type="submit" disabled={busy} className="rounded-xl bg-blue-300 px-4 py-2 text-[11px] font-black uppercase text-[#102030] disabled:opacity-50">{busy ? "Saving…" : submitLabel}</button>
    </div>
  );
}

// ---- New Project ----

function NewProjectForm({ busy, prefill, onSubmit }: { busy: boolean; prefill?: Partial<ManualProjectInput>; onSubmit: (input: ManualProjectInput) => void }) {
  const [businessLine, setBusinessLine] = useState<ProjectBusinessLine>(prefill?.businessLine ?? "Construction");
  const [projectCode, setProjectCode] = useState(prefill?.projectCode ?? "");
  const [projectName, setProjectName] = useState(prefill?.projectName ?? "");
  const [clientName, setClientName] = useState(prefill?.clientName ?? "");
  const [projectManager, setProjectManager] = useState(prefill?.projectManager ?? "");
  const [region, setRegion] = useState(prefill?.region ?? "");
  const [projectStage, setProjectStage] = useState<ProjectStage>(prefill?.projectStage ?? "Active");
  const [contractType, setContractType] = useState(prefill?.contractType ?? "Fixed price");
  const [fundingType, setFundingType] = useState(prefill?.fundingType ?? "Customer-funded");
  const [startDate, setStartDate] = useState(prefill?.startDate ?? "");
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(prefill?.expectedCompletionDate ?? "");
  const [originalContractValue, setOriginalContractValue] = useState(prefill?.originalContractValue?.toString() ?? "");
  const [currentContractValue, setCurrentContractValue] = useState(prefill?.currentContractValue?.toString() ?? "");
  const [contractReferenceId, setContractReferenceId] = useState(prefill?.contractReferenceId ?? "");
  const [initialEstimatedCost, setInitialEstimatedCost] = useState(prefill?.initialEstimatedCost?.toString() ?? "");
  const [pricingNotes, setPricingNotes] = useState(prefill?.pricingNotes ?? "");
  const [drivers, setDrivers] = useState<Record<string, string>>({});
  const [includeFunding, setIncludeFunding] = useState(false);
  const [externalAwardId, setExternalAwardId] = useState("");
  const [funder, setFunder] = useState("");
  const [grantType, setGrantType] = useState("Grant agreement");
  const [awardAmount, setAwardAmount] = useState("");
  const [reimbursementBasis, setReimbursementBasis] = useState("Reimbursement");
  const [matchType, setMatchType] = useState("Cash / in-kind");
  const [matchRequirement, setMatchRequirement] = useState("");

  const driverFields = DRIVER_FIELDS[businessLine] ?? [];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const driverInput: ManualOperationalDriverInput = {};
    for (const field of driverFields) {
      const raw = drivers[field.key as string];
      if (raw === undefined || raw === "") continue;
      (driverInput as Record<string, unknown>)[field.key as string] = field.kind === "number" ? toOptionalNumber(raw) : raw;
    }
    const funding: ManualFundingInput | undefined = includeFunding ? {
      externalAwardId: externalAwardId.trim(),
      funder: funder.trim(),
      grantType: grantType.trim(),
      restricted: true,
      awardAmount: toNumber(awardAmount),
      startDate,
      endDate: expectedCompletionDate,
      reimbursementBasis: reimbursementBasis.trim(),
      matchType: matchType.trim(),
      matchRequirement: toNumber(matchRequirement),
    } : undefined;
    onSubmit({
      projectCode: projectCode.trim(),
      projectName: projectName.trim(),
      clientName: clientName.trim(),
      businessLine,
      projectManager: projectManager.trim(),
      region: region.trim(),
      projectStage,
      contractType,
      fundingType,
      startDate,
      expectedCompletionDate,
      originalContractValue: toNumber(originalContractValue),
      currentContractValue: toOptionalNumber(currentContractValue),
      contractReferenceId: contractReferenceId.trim() || undefined,
      initialEstimatedCost: toNumber(initialEstimatedCost),
      pricingNotes: pricingNotes.trim() || undefined,
      drivers: driverInput,
      funding,
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <Section title="Project identity">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Project ID *"><TextInput value={projectCode} onChange={setProjectCode} required /></Field>
          <Field label="Project name *"><TextInput value={projectName} onChange={setProjectName} required /></Field>
          <Field label="Business line"><SelectInput value={businessLine} onChange={(v) => setBusinessLine(v as ProjectBusinessLine)} options={BUSINESS_LINES} /></Field>
          <Field label="Client / funder"><TextInput value={clientName} onChange={setClientName} /></Field>
          <Field label="Project manager"><TextInput value={projectManager} onChange={setProjectManager} /></Field>
          <Field label="Region"><TextInput value={region} onChange={setRegion} /></Field>
          <Field label="Status"><SelectInput value={projectStage} onChange={(v) => setProjectStage(v as ProjectStage)} options={PROJECT_STAGES} /></Field>
          <Field label="Contract type"><TextInput value={contractType} onChange={setContractType} /></Field>
          <Field label="Funding type"><SelectInput value={fundingType} onChange={setFundingType} options={FUNDING_TYPES} /></Field>
          <Field label="Start date"><TextInput value={startDate} onChange={setStartDate} type="date" /></Field>
          <Field label="Expected completion"><TextInput value={expectedCompletionDate} onChange={setExpectedCompletionDate} type="date" /></Field>
        </div>
      </Section>

      <Section title="Contract">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Original contract value ($)"><TextInput value={originalContractValue} onChange={setOriginalContractValue} type="number" /></Field>
          <Field label="Current contract value ($)"><TextInput value={currentContractValue} onChange={setCurrentContractValue} type="number" /></Field>
          <Field label="Contract / reference ID"><TextInput value={contractReferenceId} onChange={setContractReferenceId} /></Field>
          <Field label="Initial estimated cost ($)"><TextInput value={initialEstimatedCost} onChange={setInitialEstimatedCost} type="number" /></Field>
        </div>
        <div className="mt-3"><Field label="Pricing notes"><TextInput value={pricingNotes} onChange={setPricingNotes} /></Field></div>
      </Section>

      <Section title="Grant agreement (optional)">
        <label className="flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]"><input type="checkbox" checked={includeFunding} onChange={(event) => setIncludeFunding(event.target.checked)} /> Add an agreement record for this project</label>
        {includeFunding ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Grant / award ID"><TextInput value={externalAwardId} onChange={setExternalAwardId} required /></Field><Field label="Funder"><TextInput value={funder} onChange={setFunder} required /></Field><Field label="Grant type"><TextInput value={grantType} onChange={setGrantType} /></Field><Field label="Award amount ($)"><TextInput value={awardAmount} onChange={setAwardAmount} type="number" /></Field><Field label="Reimbursement basis"><TextInput value={reimbursementBasis} onChange={setReimbursementBasis} /></Field><Field label="Match type"><TextInput value={matchType} onChange={setMatchType} /></Field><Field label="Match requirement ($)"><TextInput value={matchRequirement} onChange={setMatchRequirement} type="number" /></Field></div> : <p className="mt-2 text-[10px] leading-4 text-[rgb(var(--text-4))]">Agreement details can also be loaded later through the Data Import Lab.</p>}
      </Section>

      {driverFields.length ? (
        <Section title={`Operational drivers — ${businessLine}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            {driverFields.map((field) => (
              <Field key={field.key as string} label={field.label}>
                <TextInput value={drivers[field.key as string] ?? ""} onChange={(v) => setDrivers((d) => ({ ...d, [field.key as string]: v }))} type={field.kind === "number" ? "number" : "text"} />
              </Field>
            ))}
          </div>
        </Section>
      ) : null}

      <Actions busy={busy} submitLabel="Create project" />
    </form>
  );
}

// ---- Forecast update ----

function ForecastForm({ busy, onSubmit }: { busy: boolean; onSubmit: (input: { forecastDate: string; forecastOwner: string; etcSource: string; estimateToComplete: number | null; forecastCompletionDate?: string; keyVarianceDriver?: string; requiredAction?: string; confidence: "Low" | "Moderate" | "High"; notes?: string }) => void }) {
  const [forecastDate, setForecastDate] = useState("");
  const [forecastOwner, setForecastOwner] = useState("");
  const [etcSource, setEtcSource] = useState("");
  const [estimateToComplete, setEstimateToComplete] = useState("");
  const [forecastCompletionDate, setForecastCompletionDate] = useState("");
  const [keyVarianceDriver, setKeyVarianceDriver] = useState("");
  const [requiredAction, setRequiredAction] = useState("");
  const [confidence, setConfidence] = useState<"Low" | "Moderate" | "High">("Moderate");
  const [notes, setNotes] = useState("");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ forecastDate, forecastOwner: forecastOwner.trim(), etcSource: etcSource.trim(), estimateToComplete: toOptionalNumber(estimateToComplete) ?? null, forecastCompletionDate: forecastCompletionDate || undefined, keyVarianceDriver: keyVarianceDriver.trim() || undefined, requiredAction: requiredAction.trim() || undefined, confidence, notes: notes.trim() || undefined }); }} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Forecast date"><TextInput value={forecastDate} onChange={setForecastDate} type="date" /></Field>
        <Field label="Owner"><TextInput value={forecastOwner} onChange={setForecastOwner} /></Field>
        <Field label="ETC source"><TextInput value={etcSource} onChange={setEtcSource} /></Field>
        <Field label="Estimate to complete ($)"><TextInput value={estimateToComplete} onChange={setEstimateToComplete} type="number" /></Field>
        <Field label="Forecast completion date"><TextInput value={forecastCompletionDate} onChange={setForecastCompletionDate} type="date" /></Field>
        <Field label="Confidence"><SelectInput value={confidence} onChange={(v) => setConfidence(v as "Low" | "Moderate" | "High")} options={["Low", "Moderate", "High"]} /></Field>
        <Field label="Key variance driver"><TextInput value={keyVarianceDriver} onChange={setKeyVarianceDriver} /></Field>
        <Field label="Required action"><TextInput value={requiredAction} onChange={setRequiredAction} /></Field>
      </div>
      <Field label="Notes"><TextInput value={notes} onChange={setNotes} /></Field>
      <p className="text-[10px] leading-4 text-[rgb(var(--text-4))]">Saving snapshots the current contract value and actual cost, computes the forecast, and preserves prior forecasts (history is never overwritten).</p>
      <Actions busy={busy} submitLabel="Add forecast" />
    </form>
  );
}

// ---- Match activity ----

const MATCH_TYPES = ["Cash", "In-Kind", "Volunteer Hours", "Blended", "Other"] as const;
const ELIGIBILITY = ["Eligible", "Pending", "Ineligible"] as const;

function MatchForm({ busy, onSubmit }: { busy: boolean; onSubmit: (input: ManualMatchInput) => void }) {
  const [grantAwardId, setGrantAwardId] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [matchType, setMatchType] = useState<ManualMatchInput["matchType"]>("Volunteer Hours");
  const [contributorOrResource, setContributorOrResource] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [quantityHours, setQuantityHours] = useState("");
  const [unit, setUnit] = useState("");
  const [valuationRate, setValuationRate] = useState("");
  const [documentedCashMatch, setDocumentedCashMatch] = useState("");
  const [eligibilityStatus, setEligibilityStatus] = useState<ManualMatchInput["eligibilityStatus"]>("Eligible");
  const [documentationSourceRecordId, setDocumentationSourceRecordId] = useState("");
  const [supportStatus, setSupportStatus] = useState<NonNullable<ManualMatchInput["supportStatus"]>>("Complete");
  const [approvalStatus, setApprovalStatus] = useState<NonNullable<ManualMatchInput["approvalStatus"]>>("Pending");
  const [notes, setNotes] = useState("");

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ grantAwardId: grantAwardId.trim(), activityDate, matchType, contributorOrResource: contributorOrResource.trim(), activityDescription: activityDescription.trim(), quantityHours: toOptionalNumber(quantityHours), unit: unit.trim() || undefined, valuationRate: toOptionalNumber(valuationRate), documentedCashMatch: toNumber(documentedCashMatch), eligibilityStatus, documentationSourceRecordId: documentationSourceRecordId.trim() || undefined, supportStatus, approvalStatus, notes: notes.trim() || undefined }); }} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Grant / award ID"><TextInput value={grantAwardId} onChange={setGrantAwardId} /></Field>
        <Field label="Activity date"><TextInput value={activityDate} onChange={setActivityDate} type="date" /></Field>
        <Field label="Match type"><SelectInput value={matchType} onChange={(v) => setMatchType(v as ManualMatchInput["matchType"])} options={MATCH_TYPES} /></Field>
        <Field label="Contributor / resource"><TextInput value={contributorOrResource} onChange={setContributorOrResource} /></Field>
        <Field label="Quantity / hours"><TextInput value={quantityHours} onChange={setQuantityHours} type="number" /></Field>
        <Field label="Valuation rate ($)"><TextInput value={valuationRate} onChange={setValuationRate} type="number" /></Field>
        <Field label="Documented cash match ($)"><TextInput value={documentedCashMatch} onChange={setDocumentedCashMatch} type="number" /></Field>
        <Field label="Eligibility"><SelectInput value={eligibilityStatus} onChange={(v) => setEligibilityStatus(v as ManualMatchInput["eligibilityStatus"])} options={ELIGIBILITY} /></Field>
        <Field label="Support status"><SelectInput value={supportStatus} onChange={(v) => setSupportStatus(v as NonNullable<ManualMatchInput["supportStatus"]>)} options={["Complete", "Partial", "Missing", "Not Required"]} /></Field>
        <Field label="Approval status"><SelectInput value={approvalStatus} onChange={(v) => setApprovalStatus(v as NonNullable<ManualMatchInput["approvalStatus"]>)} options={["Approved", "Pending", "Rejected"]} /></Field>
        <Field label="Unit"><TextInput value={unit} onChange={setUnit} /></Field>
        <Field label="Documentation / source record"><TextInput value={documentationSourceRecordId} onChange={setDocumentationSourceRecordId} /></Field>
      </div>
      <Field label="Activity description"><TextInput value={activityDescription} onChange={setActivityDescription} /></Field>
      <Field label="Notes"><TextInput value={notes} onChange={setNotes} /></Field>
      <p className="text-[10px] leading-4 text-[rgb(var(--text-4))]">Activity value is computed from quantity × rate. Only records marked Eligible accumulate toward the match requirement.</p>
      <Actions busy={busy} submitLabel="Add match activity" />
    </form>
  );
}

function ChangeOrderForm({ busy, onSubmit }: { busy: boolean; onSubmit: (input: ManualChangeOrderInput) => void }) {
  const [changeNumber, setChangeNumber] = useState("");
  const [identifiedDate, setIdentifiedDate] = useState("");
  const [approvedDate, setApprovedDate] = useState("");
  const [status, setStatus] = useState<ManualChangeOrderInput["status"]>("draft");
  const [additionalRevenue, setAdditionalRevenue] = useState("");
  const [additionalEstimatedCost, setAdditionalEstimatedCost] = useState("");
  const [description, setDescription] = useState("");
  const [cause, setCause] = useState("");
  const [scheduleDays, setScheduleDays] = useState("");
  const [approvalOwner, setApprovalOwner] = useState("");
  const [sourceDocument, setSourceDocument] = useState("");
  const [notes, setNotes] = useState("");
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit({ changeNumber: changeNumber.trim(), identifiedDate, approvedDate: approvedDate || undefined, status, additionalRevenue: toNumber(additionalRevenue), additionalEstimatedCost: toNumber(additionalEstimatedCost), description: description.trim(), cause: cause.trim() || undefined, scheduleDays: toNumber(scheduleDays), approvalOwner: approvalOwner.trim(), sourceDocument: sourceDocument.trim() || undefined, notes: notes.trim() || undefined }); }} className="mt-4 space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Change order ID / reference"><TextInput value={changeNumber} onChange={setChangeNumber} required /></Field>
      <Field label="Status"><SelectInput value={status} onChange={(v) => setStatus(v as ManualChangeOrderInput["status"])} options={["draft", "pending", "approved", "rejected"]} /></Field>
      <Field label="Requested date"><TextInput value={identifiedDate} onChange={setIdentifiedDate} type="date" required /></Field>
      <Field label="Approved date"><TextInput value={approvedDate} onChange={setApprovedDate} type="date" /></Field>
      <Field label="Revenue / value change ($)"><TextInput value={additionalRevenue} onChange={setAdditionalRevenue} type="number" /></Field>
      <Field label="Expected cost impact ($)"><TextInput value={additionalEstimatedCost} onChange={setAdditionalEstimatedCost} type="number" /></Field>
      <Field label="Schedule impact (days)"><TextInput value={scheduleDays} onChange={setScheduleDays} type="number" /></Field>
      <Field label="Approval owner"><TextInput value={approvalOwner} onChange={setApprovalOwner} required /></Field>
      <Field label="Source document"><TextInput value={sourceDocument} onChange={setSourceDocument} /></Field>
    </div>
    <Field label="Scope description"><TextInput value={description} onChange={setDescription} required /></Field>
    <Field label="Cause / variance driver"><TextInput value={cause} onChange={setCause} /></Field>
    <Field label="Notes"><TextInput value={notes} onChange={setNotes} /></Field>
    <p className="text-[10px] leading-4 text-[rgb(var(--text-4))]">Only approved change orders affect current contract value and revised budget.</p>
    <Actions busy={busy} submitLabel="Add change order" />
  </form>;
}

function OperationalDriverForm({ busy, onSubmit }: { busy: boolean; onSubmit: (input: ManualOperationalDriverInput) => void }) {
  const [businessLine, setBusinessLine] = useState<ProjectBusinessLine>("Construction");
  const [values, setValues] = useState<Record<string, string>>({});
  const fields = DRIVER_FIELDS[businessLine] ?? [];
  const common = [{ key: "projectDurationDays", label: "Project duration (days)", kind: "number" as const }, { key: "siteAccessComplexity", label: "Site access complexity", kind: "text" as const }];
  return <form onSubmit={(e) => { e.preventDefault(); const input: Record<string, unknown> = { snapshotDate: values.snapshotDate || undefined, source: values.source?.trim() || undefined, owner: values.owner?.trim() || undefined, notes: values.notes?.trim() || undefined }; for (const field of [...fields, ...common]) { const raw = values[field.key]; if (!raw) continue; input[field.key] = field.kind === "number" ? toOptionalNumber(raw) : raw; } onSubmit(input as ManualOperationalDriverInput); }} className="mt-4 space-y-3">
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Business line"><SelectInput value={businessLine} onChange={(v) => setBusinessLine(v as ProjectBusinessLine)} options={BUSINESS_LINES} /></Field><Field label="Driver date"><TextInput value={values.snapshotDate ?? ""} onChange={(value) => setValues((current) => ({ ...current, snapshotDate: value }))} type="date" /></Field><Field label="Source"><TextInput value={values.source ?? ""} onChange={(value) => setValues((current) => ({ ...current, source: value }))} /></Field><Field label="Owner"><TextInput value={values.owner ?? ""} onChange={(value) => setValues((current) => ({ ...current, owner: value }))} /></Field></div>
    <div className="grid gap-3 sm:grid-cols-2">{[...fields, ...common].map((field) => <Field key={field.key} label={field.label}><TextInput value={values[field.key] ?? ""} onChange={(value) => setValues((current) => ({ ...current, [field.key]: value }))} type={field.kind === "number" ? "number" : "text"} /></Field>)}</div>
    <Field label="Notes"><TextInput value={values.notes ?? ""} onChange={(value) => setValues((current) => ({ ...current, notes: value }))} /></Field>
    <Actions busy={busy} submitLabel="Add operational driver" />
  </form>;
}

function FundingForm({ busy, onSubmit }: { busy: boolean; onSubmit: (input: ManualFundingInput) => void }) {
  const [externalAwardId, setExternalAwardId] = useState(""); const [funder, setFunder] = useState(""); const [grantType, setGrantType] = useState("Grant agreement"); const [restricted, setRestricted] = useState(true); const [awardAmount, setAwardAmount] = useState(""); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [reimbursementBasis, setReimbursementBasis] = useState("Reimbursement"); const [matchType, setMatchType] = useState("Cash / in-kind"); const [matchRequirement, setMatchRequirement] = useState(""); const [indirectRate, setIndirectRate] = useState(""); const [indirectMethod, setIndirectMethod] = useState(""); const [reportingFrequency, setReportingFrequency] = useState(""); const [nextReportDue, setNextReportDue] = useState(""); const [fundingRole, setFundingRole] = useState<GrantFundingRole>("Prime Recipient"); const [agreementOwner, setAgreementOwner] = useState(""); const [documentationStatus, setDocumentationStatus] = useState("Documentation review"); const [agreementStatus, setAgreementStatus] = useState<GrantAgreementStatus>("Under Review"); const [notes, setNotes] = useState("");
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit({ externalAwardId: externalAwardId.trim(), funder: funder.trim(), grantType: grantType.trim(), restricted, awardAmount: toNumber(awardAmount), startDate, endDate, reimbursementBasis: reimbursementBasis.trim(), matchType: matchType.trim(), matchRequirement: toNumber(matchRequirement), indirectRate: toNumber(indirectRate), indirectMethod: indirectMethod.trim() || undefined, reportingFrequency: reportingFrequency.trim() || undefined, nextReportDue: nextReportDue || undefined, fundingRole, agreementOwner: agreementOwner.trim() || undefined, documentationStatus: documentationStatus.trim() || undefined, agreementStatus, notes: notes.trim() || undefined }); }} className="mt-4 space-y-3">
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Grant / award ID"><TextInput value={externalAwardId} onChange={setExternalAwardId} required /></Field><Field label="Funder"><TextInput value={funder} onChange={setFunder} required /></Field><Field label="Grant type"><TextInput value={grantType} onChange={setGrantType} /></Field><Field label="Agreement status"><SelectInput value={agreementStatus} onChange={(v) => setAgreementStatus(v as GrantAgreementStatus)} options={["Active", "Pending", "Closed", "Under Review"]} /></Field><Field label="Award amount ($)"><TextInput value={awardAmount} onChange={setAwardAmount} type="number" /></Field><Field label="Match requirement ($)"><TextInput value={matchRequirement} onChange={setMatchRequirement} type="number" /></Field><Field label="Start date"><TextInput value={startDate} onChange={setStartDate} type="date" /></Field><Field label="End date"><TextInput value={endDate} onChange={setEndDate} type="date" /></Field><Field label="Reimbursement basis"><TextInput value={reimbursementBasis} onChange={setReimbursementBasis} /></Field><Field label="Match type"><TextInput value={matchType} onChange={setMatchType} /></Field><Field label="Funding role"><SelectInput value={fundingRole} onChange={(v) => setFundingRole(v as GrantFundingRole)} options={["Prime Recipient", "Subrecipient", "Contractor", "Other"]} /></Field><Field label="Agreement owner"><TextInput value={agreementOwner} onChange={setAgreementOwner} /></Field><Field label="Indirect rate (%)"><TextInput value={indirectRate} onChange={setIndirectRate} type="number" /></Field><Field label="Indirect method"><TextInput value={indirectMethod} onChange={setIndirectMethod} /></Field><Field label="Reporting frequency"><TextInput value={reportingFrequency} onChange={setReportingFrequency} /></Field><Field label="Next report due"><TextInput value={nextReportDue} onChange={setNextReportDue} type="date" /></Field><Field label="Documentation status"><TextInput value={documentationStatus} onChange={setDocumentationStatus} /></Field></div>
    <Field label="Notes"><TextInput value={notes} onChange={setNotes} /></Field><label className="flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]"><input type="checkbox" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} /> Restricted funding</label>
    <Actions busy={busy} submitLabel="Save funding agreement" />
  </form>;
}

function DecisionForm({ busy, onSubmit }: { busy: boolean; onSubmit: (input: ManualDecisionInput) => void }) {
  const [issue, setIssue] = useState("");
  const [financialEffectLabel, setFinancialEffectLabel] = useState("");
  const [financialEffect, setFinancialEffect] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ManualDecisionInput["status"]>("open");
  const [supportingSection, setSupportingSection] = useState<NonNullable<ManualDecisionInput["supportingSection"]>>("what-changed");
  const [notes, setNotes] = useState("");
  return <form onSubmit={(e) => { e.preventDefault(); onSubmit({ issue: issue.trim(), financialEffect: toOptionalNumber(financialEffect), financialEffectLabel: financialEffectLabel.trim(), recommendedAction: recommendedAction.trim(), owner: owner.trim(), dueDate, status, supportingSection, notes: notes.trim() || undefined }); }} className="mt-4 space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Issue"><TextInput value={issue} onChange={setIssue} required /></Field><Field label="Financial effect ($)"><TextInput value={financialEffect} onChange={setFinancialEffect} type="number" /></Field><Field label="Financial effect label"><TextInput value={financialEffectLabel} onChange={setFinancialEffectLabel} required /></Field><Field label="Owner"><TextInput value={owner} onChange={setOwner} required /></Field><Field label="Due date"><TextInput value={dueDate} onChange={setDueDate} type="date" required /></Field><Field label="Status"><SelectInput value={status} onChange={(v) => setStatus(v as ManualDecisionInput["status"])} options={["open", "in-progress", "complete"]} /></Field><Field label="Supporting section"><SelectInput value={supportingSection} onChange={(v) => setSupportingSection(v as NonNullable<ManualDecisionInput["supportingSection"]>)} options={["what-changed", "labor", "billing", "data-health", "grant"]} /></Field></div><Field label="Recommended action"><TextInput value={recommendedAction} onChange={setRecommendedAction} required /></Field><Field label="Notes"><TextInput value={notes} onChange={setNotes} /></Field><Actions busy={busy} submitLabel="Add decision / action" /></form>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2)/50%)] p-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-4))]">{title}</p>
      {children}
    </div>
  );
}
