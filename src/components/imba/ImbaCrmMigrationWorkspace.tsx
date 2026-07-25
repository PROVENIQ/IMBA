'use client';

import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Database,
  GitCompareArrows,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  CRM_SYNTHETIC_BANNER,
  crosswalkRows,
  domainReadiness,
  initialExceptions,
  integrationReadiness,
  migrationHealth,
  reconciliationRows,
  replacementReadiness,
  syntheticConstituents,
} from "@/lib/imba-crm-migration-data";

export type ImbaCrmMigrationView =
  | "crm-migration-health"
  | "crm-field-crosswalk"
  | "crm-exception-queue"
  | "crm-financial-reconciliation"
  | "crm-integration-readiness";

type Navigate = (view: ImbaCrmMigrationView) => void;

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const tone = (status: string) => {
  if (["READY", "MATCHED", "APPROVED", "CONNECTED", "READY_FOR_READ"].includes(status)) return "border-emerald-400/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300";
  if (["HIGH", "ERROR", "REJECTED", "AMOUNT_DIFFERENCE", "MISSING_BANK_DEPOSIT"].includes(status)) return "border-rose-400/25 bg-rose-400/10 text-rose-700 dark:text-rose-300";
  if (["MOCK", "READ_ONLY", "WATCH", "PROPOSED", "LOW"].includes(status)) return "border-sky-400/25 bg-sky-400/10 text-sky-700 dark:text-sky-300";
  return "border-amber-400/25 bg-amber-400/10 text-amber-800 dark:text-amber-200";
};

function Badge({ children }: { children: string | number }) {
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${tone(String(children))}`}>{children}</span>;
}

function Banner() {
  return (
    <div data-testid="synthetic-data-banner" className="flex items-center gap-2 rounded-2xl border border-sky-400/25 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-800 dark:text-sky-200">
      <ShieldCheck className="h-4 w-4 shrink-0" /> {CRM_SYNTHETIC_BANNER}
    </div>
  );
}

function Header({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-300">{eyebrow}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[rgb(var(--text-1))]">{title}</h1>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-[rgb(var(--text-3))]">{description}</p>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel))] p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--text-4))]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[rgb(var(--text-1))]">{value}</p>
      <p className="mt-1 text-xs text-[rgb(var(--text-3))]">{note}</p>
    </div>
  );
}

function MigrationHealth({ onNavigate }: { onNavigate: Navigate }) {
  const metrics = [
    ["Completion", `${migrationHealth.completion}%`, "No false decimal precision"],
    ["Records staged", migrationHealth.staged.toLocaleString(), `${migrationHealth.discoveredEntities} source entities discovered`],
    ["Validated", migrationHealth.validated.toLocaleString(), `${migrationHealth.matched.toLocaleString()} matched`],
    ["Rejected", migrationHealth.rejected, "Every source row has a disposition"],
    ["Open mappings", migrationHealth.unresolvedMappings, "Leadership and data-owner decisions"],
    ["Open exceptions", migrationHealth.unresolvedExceptions, `${migrationHealth.controlDifferences} control-total differences`],
  ] as const;
  return (
    <>
      <Header eyebrow="CRM Migration · assurance cockpit" title="Migration Health" description="A control view of completeness, accuracy, exceptions, and domain readiness across the synthetic CiviCRM-to-EveryAction migration." />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{metrics.map(([label, value, note]) => <Metric key={label} label={label} value={value} note={note} />)}</div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel))] p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Readiness by domain</h2><span className="text-xs text-[rgb(var(--text-4))]">{migrationHealth.recurringValidated} recurring commitments validated</span></div>
          <div className="mt-4 space-y-4">{domainReadiness.map((item) => <div key={item.domain}><div className="mb-2 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{item.domain}</p><p className="text-xs text-[rgb(var(--text-3))]">{item.note}</p></div><Badge>{item.status}</Badge></div><div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--line)/0.08)]"><div className="h-full rounded-full bg-violet-500" style={{ width: `${item.percent}%` }} /></div></div>)}</div>
        </section>
        <section className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel))] p-5">
          <h2 className="font-semibold">Meeting walkthrough</h2>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-3))]">The evidence path stays connected to mappings, exceptions, immutable decisions, and financial source records.</p>
          <div className="mt-4 space-y-2">
            {[
              ["Inspect membership decision", "crm-field-crosswalk"],
              ["Resolve missing designation", "crm-exception-queue"],
              ["Review batch difference", "crm-financial-reconciliation"],
              ["Confirm writes disabled", "crm-integration-readiness"],
            ].map(([label, view]) => <button key={view} onClick={() => onNavigate(view as ImbaCrmMigrationView)} className="flex w-full items-center justify-between rounded-xl border border-[rgb(var(--line)/0.08)] px-3 py-3 text-left text-sm font-semibold hover:bg-[rgb(var(--line)/0.04)]">{label}<ChevronRight className="h-4 w-4" /></button>)}
          </div>
          <div className="mt-4 rounded-xl bg-[rgb(var(--line)/0.04)] p-3 text-xs text-[rgb(var(--text-3))]"><strong className="text-[rgb(var(--text-2))]">{syntheticConstituents.length} people</strong>, synthetic households and organizations, national and chapter memberships, suppressions, duplicates, adjustments, failed batches, and reconciliation differences generated from one stable seed.</div>
        </section>
      </div>
    </>
  );
}

function FieldCrosswalk() {
  const [entity, setEntity] = useState("all");
  const [status, setStatus] = useState("all");
  const rows = crosswalkRows.filter((row) => (entity === "all" || row.entity === entity) && (status === "all" || row.status === status));
  return (
    <>
      <Header eyebrow="CRM Migration · governed semantics" title="Field Crosswalk" description="Versioned mappings keep CiviCRM vocabulary, canonical IMBA-OS concepts, and EveryAction delivery fields distinct. These approvals affect synthetic records only." />
      <div className="mt-5 flex flex-wrap gap-3">
        <select aria-label="Source entity" value={entity} onChange={(event) => setEntity(event.target.value)} className="rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel))] px-3 py-2 text-sm"><option value="all">All source entities</option>{[...new Set(crosswalkRows.map((row) => row.entity))].map((value) => <option key={value}>{value}</option>)}</select>
        <select aria-label="Mapping status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel))] px-3 py-2 text-sm"><option value="all">All statuses</option>{[...new Set(crosswalkRows.map((row) => row.status))].map((value) => <option key={value}>{value}</option>)}</select>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel))]">
        <table className="min-w-[1180px] w-full text-left text-xs"><thead className="border-b border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.03)] text-[10px] uppercase tracking-wider text-[rgb(var(--text-4))]"><tr>{["Source field", "Canonical concept", "EveryAction destination", "Transformation", "Prerequisites", "Validation", "Status", "Confidence", "Owner", "Version"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-[rgb(var(--line)/0.06)] last:border-0"><td className="px-4 py-4 font-mono">{row.entity}.{row.source}</td><td className="px-4 py-4 font-semibold">{row.canonical}</td><td className="px-4 py-4">{row.destination}</td><td className="px-4 py-4">{row.transform}</td><td className="px-4 py-4">{row.prerequisites}</td><td className="px-4 py-4">{row.validation}</td><td className="px-4 py-4"><Badge>{row.status}</Badge></td><td className="px-4 py-4">{row.confidence}%</td><td className="px-4 py-4">{row.owner}</td><td className="px-4 py-4">v{row.version}</td></tr>)}</tbody></table>
      </div>
    </>
  );
}

interface DemoException {
  id: string;
  severity: string;
  source: string;
  destination: string;
  rule: string;
  effect: string;
  suggestion: string;
  owner: string;
  age: string;
  evidence: string;
  status: string;
  history: readonly string[];
}

function ExceptionQueue() {
  const [exceptions, setExceptions] = useState<readonly DemoException[]>(initialExceptions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = exceptions.find((item) => item.id === selectedId);
  const resolve = () => {
    if (!selected) return;
    setExceptions((current) => current.map((item) => item.id === selected.id ? { ...item, status: "RESOLVED", history: [...item.history, "VALIDATION_EXCEPTION_RESOLVED · Jul 24 · Migration analyst · synthetic decision"] } : item));
  };
  return (
    <>
      <Header eyebrow="CRM Migration · owned differences" title="Exception Queue" description="Nothing disappears: every failed rule retains affected records, operational effect, evidence, ownership, and immutable decision history." />
      <div className="mt-5 space-y-3">{exceptions.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className="grid w-full gap-3 rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel))] p-4 text-left hover:border-violet-400/30 md:grid-cols-[90px_1.1fr_1fr_1.2fr_110px] md:items-center"><Badge>{item.severity}</Badge><div><p className="text-sm font-semibold">{item.rule}</p><p className="mt-1 text-xs text-[rgb(var(--text-4))]">{item.source}</p></div><p className="text-xs text-[rgb(var(--text-3))]">{item.effect}</p><div><p className="text-xs">{item.owner} · {item.age}</p><p className="mt-1 text-xs text-[rgb(var(--text-4))]">{item.evidence}</p></div><Badge>{item.status}</Badge></button>)}</div>
      {selected ? <div className="fixed inset-0 z-50 flex justify-end bg-black/25" onClick={() => setSelectedId(null)}><aside className="h-full w-full max-w-xl overflow-y-auto bg-[rgb(var(--panel))] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><Badge>{selected.severity}</Badge><h2 className="mt-3 text-xl font-semibold">{selected.rule}</h2><p className="mt-1 text-sm text-[rgb(var(--text-3))]">{selected.id}</p></div><button aria-label="Close exception" onClick={() => setSelectedId(null)}><X className="h-5 w-5" /></button></div><dl className="mt-6 space-y-4 text-sm"><div><dt className="font-semibold">Source and destination</dt><dd className="mt-1 text-[rgb(var(--text-3))]">{selected.source} <ArrowRight className="mx-1 inline h-3 w-3" /> {selected.destination}</dd></div><div><dt className="font-semibold">Effect</dt><dd className="mt-1 text-[rgb(var(--text-3))]">{selected.effect}</dd></div><div><dt className="font-semibold">Suggested resolution</dt><dd className="mt-1 text-[rgb(var(--text-3))]">{selected.suggestion}</dd></div><div><dt className="font-semibold">Evidence</dt><dd className="mt-1 text-[rgb(var(--text-3))]">{selected.evidence}</dd></div></dl><div className="mt-6 rounded-2xl bg-[rgb(var(--line)/0.04)] p-4"><p className="text-xs font-bold uppercase tracking-wider">Immutable audit history</p>{selected.history.map((event) => <p key={event} className="mt-3 border-l-2 border-violet-400 pl-3 text-xs text-[rgb(var(--text-3))]">{event}</p>)}</div><button onClick={resolve} disabled={selected.status === "RESOLVED"} className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{selected.status === "RESOLVED" ? "Resolved · event retained" : "Resolve synthetic exception"}</button></aside></div> : null}
    </>
  );
}

function FinancialReconciliation() {
  const [selectedId, setSelectedId] = useState("REC-701");
  const selected = reconciliationRows.find((row) => row.id === selectedId)!;
  return (
    <>
      <Header eyebrow="CRM Migration · finance bridge" title="Financial Reconciliation" description="Provider-neutral evidence follows contributions through an EveryAction batch, processor settlement, bank deposit, and QuickBooks reference. QuickBooks remains the authoritative GL." />
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel))]"><table className="min-w-[960px] w-full text-left text-xs"><thead className="border-b border-[rgb(var(--line)/0.08)] text-[10px] uppercase tracking-wider text-[rgb(var(--text-4))]"><tr>{["EveryAction batch", "Contributions", "Processor", "Bank", "QuickBooks", "Difference", "Timing", "Status", "Case"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{reconciliationRows.map((row) => <tr key={row.id} onClick={() => setSelectedId(row.id)} className={`cursor-pointer border-b border-[rgb(var(--line)/0.06)] last:border-0 ${row.id === selectedId ? "bg-violet-400/8" : ""}`}><td className="px-4 py-4 font-semibold">{row.batch}</td>{[row.contributions, row.processor, row.bank, row.quickbooks, row.difference].map((value, index) => <td key={index} className={`px-4 py-4 ${index === 4 && value !== 0 ? "font-bold text-rose-600" : ""}`}>{money(value)}</td>)}<td className="px-4 py-4">{row.timing}</td><td className="px-4 py-4"><Badge>{row.status}</Badge></td><td className="px-4 py-4">{row.caseId}</td></tr>)}</tbody></table></div>
      <section className="mt-5 rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel))] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Transaction drilldown</p><h2 className="mt-1 font-semibold">{selected.batch}</h2></div><Badge>{selected.status}</Badge></div><div className="mt-4 space-y-2">{selected.transactions.map((transaction) => <div key={transaction} className="flex items-center gap-3 rounded-xl bg-[rgb(var(--line)/0.04)] p-3 text-sm"><GitCompareArrows className="h-4 w-4 text-violet-500" />{transaction}</div>)}</div><p className="mt-4 text-xs text-[rgb(var(--text-4))]">No native EveryAction-to-QuickBooks donation sync is assumed. These are separately sourced synthetic references joined by the reconciliation case.</p></section>
    </>
  );
}

function IntegrationReadiness() {
  const [panel, setPanel] = useState<"connectors" | "replacement">("connectors");
  return (
    <>
      <Header eyebrow="CRM Migration · controlled transition" title={panel === "connectors" ? "Integration Readiness" : "Replacement Readiness"} description={panel === "connectors" ? "Connection modes, supported sync strategies, source-of-truth boundaries, and fail-closed write controls are visible before any credential is supplied." : "A UI is not readiness. Cutover requires data and workflow parity, permissions, auditability, performance, tested migration and rollback, staff acceptance, and an operational owner."} />
      <div className="mt-5 inline-flex rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--panel))] p-1"><button onClick={() => setPanel("connectors")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${panel === "connectors" ? "bg-violet-600 text-white" : ""}`}>Connectors</button><button onClick={() => setPanel("replacement")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${panel === "replacement" ? "bg-violet-600 text-white" : ""}`}>Replacement readiness</button></div>
      {panel === "connectors" ? <><div className="mt-4 grid gap-3 lg:grid-cols-2">{integrationReadiness.map((item) => <div key={item.connector} className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel))] p-5"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><Database className="h-5 w-5 text-violet-500" /><div><h2 className="font-semibold">{item.connector}</h2><p className="mt-1 text-xs text-[rgb(var(--text-3))]">{item.capability}</p></div></div><Badge>{item.status}</Badge></div><div className="mt-4 flex items-center gap-2 text-xs font-semibold"><RefreshCcw className="h-3.5 w-3.5" />{item.strategy}</div><p className="mt-2 text-xs leading-5 text-[rgb(var(--text-4))]">{item.note}</p></div>)}</div><div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-900 dark:text-amber-100"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>Production writes are disabled.</strong><p className="mt-1 text-xs leading-5">No browser credential surface exists. Even live-write mode requires a server feature flag, permitted credential, human approval, preview hash, immutable audit event, and idempotency key.</p></div></div></> : <div className="mt-4 overflow-x-auto rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel))]"><table className="min-w-[1450px] w-full text-left text-xs"><thead className="border-b border-[rgb(var(--line)/0.08)] text-[10px] uppercase tracking-wider text-[rgb(var(--text-4))]"><tr>{["Capability", "EveryAction use", "Source of truth", "Implementation", "Data parity", "Workflow parity", "Security", "Acceptance", "Cutover", "Rollback", "Dependencies"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{replacementReadiness.map((row) => <tr key={row.domain} className="border-b border-[rgb(var(--line)/0.06)] last:border-0"><td className="px-4 py-4 font-semibold">{row.domain}</td><td className="px-4 py-4"><Badge>{row.everyActionUse}</Badge></td><td className="px-4 py-4">{row.sourceOfTruth}</td><td className="px-4 py-4">{row.implementation}</td><td className="px-4 py-4">{row.dataParity}</td><td className="px-4 py-4">{row.workflowParity}</td><td className="px-4 py-4">{row.securityReview}</td><td className="px-4 py-4">{row.userAcceptance}</td><td className="px-4 py-4"><Badge>{row.cutover}</Badge></td><td className="px-4 py-4">{row.rollback}</td><td className="px-4 py-4">{row.dependencies}</td></tr>)}</tbody></table></div>}
    </>
  );
}

export function ImbaCrmMigrationWorkspace({ view, onNavigate }: { view: ImbaCrmMigrationView; onNavigate: Navigate }) {
  const content = useMemo(() => {
    switch (view) {
      case "crm-field-crosswalk": return <FieldCrosswalk />;
      case "crm-exception-queue": return <ExceptionQueue />;
      case "crm-financial-reconciliation": return <FinancialReconciliation />;
      case "crm-integration-readiness": return <IntegrationReadiness />;
      default: return <MigrationHealth onNavigate={onNavigate} />;
    }
  }, [view, onNavigate]);
  return <div className="space-y-5"><Banner />{content}</div>;
}
