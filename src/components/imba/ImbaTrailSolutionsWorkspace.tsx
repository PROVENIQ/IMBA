"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  Layers3,
  MapPin,
  Search,
  ShieldCheck,
  Target,
  UploadCloud,
  Users,
} from "lucide-react";
import type { ImbaRoleKey } from "@/lib/imba-intelligence-data";
import type {
  Benchmark,
  DataException,
  DecisionItem,
  FinancialHealthStatus,
  ProjectDetail,
  ProjectFinancialSummary,
  ProjectFilters,
  TrailSolutionsSnapshot,
} from "@/core/trail-solutions/model";
import { TRAIL_SOLUTIONS_SYNTHETIC_BANNER } from "@/core/trail-solutions/model";
import { TEST_DATA_BANNER, type TrailSolutionsTestWorkspace } from "@/core/trail-solutions/import-lab";
import { demoFinancialHealthPolicy } from "@/core/trail-solutions/policy";
import {
  trailSolutionsDemoContext,
  workbookDerivedTrailSolutionsDataSource,
} from "@/integrations/trail-solutions/workbook-derived-adapter";
import {
  getActiveTestWorkspaceId,
  loadTestWorkspaces,
  setActiveTestWorkspaceId,
} from "@/lib/trail-solutions-test-workspaces";
import { ImbaTrailSolutionsTour } from "@/components/imba/ImbaTrailSolutionsTour";

const ImbaTrailSolutionsImportLab = dynamic(
  () => import("@/components/imba/ImbaTrailSolutionsImportLab").then((module) => module.ImbaTrailSolutionsImportLab),
  { loading: () => <LoadingState /> },
);

type WorkspaceView = "portfolio" | "project" | "benchmarks" | "exceptions" | "data-health" | "import-lab";

const healthMeta: Record<FinancialHealthStatus, { label: string; className: string; dot: string }> = {
  "on-track": {
    label: "On track",
    className: "border-emerald-300/20 bg-emerald-300/10 text-emerald-800 dark:text-emerald-100",
    dot: "bg-emerald-400",
  },
  watch: {
    label: "Watch",
    className: "border-amber-300/20 bg-amber-300/10 text-amber-900 dark:text-amber-100",
    dot: "bg-amber-400",
  },
  "at-risk": {
    label: "At risk",
    className: "border-rose-300/20 bg-rose-300/10 text-rose-800 dark:text-rose-100",
    dot: "bg-rose-400",
  },
  "data-incomplete": {
    label: "Data incomplete",
    className: "border-violet-300/20 bg-violet-300/10 text-violet-800 dark:text-violet-100",
    dot: "bg-violet-400",
  },
};

function money(value: number | null, compact = false): string {
  if (value === null) return "Review required";
  if (compact && Math.abs(value) >= 1_000_000) return `${value < 0 ? "−" : ""}$${(Math.abs(value) / 1_000_000).toFixed(2)}M`;
  if (compact && Math.abs(value) >= 1_000) return `${value < 0 ? "−" : ""}$${Math.round(Math.abs(value) / 1_000)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function percent(value: number | null): string {
  return value === null ? "Not available" : `${(value * 100).toFixed(1)}%`;
}

function number(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

function Card({ children, className = "", dataTour }: { children: React.ReactNode; className?: string; dataTour?: string }) {
  return <section data-tour-ts={dataTour} className={`rounded-[22px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card)/92%)] elev ${className}`}>{children}</section>;
}

function SectionHeading({ eyebrow, title, note, action }: { eyebrow: string; title: string; note?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[rgb(var(--text-3))]">{eyebrow}</p>
        <h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{title}</h2>
        {note ? <p className="mt-1 max-w-3xl text-[11px] leading-5 text-[rgb(var(--text-3))]">{note}</p> : null}
      </div>
      {action}
    </div>
  );
}

function HealthBadge({ status }: { status: FinancialHealthStatus }) {
  const meta = healthMeta[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${meta.className}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}</span>;
}

function Kpi({ label, value, note, tone = "blue" }: { label: string; value: string; note: string; tone?: "blue" | "green" | "amber" | "rose" | "violet" }) {
  const colors = {
    blue: "text-blue-800 dark:text-blue-100",
    green: "text-emerald-800 dark:text-emerald-100",
    amber: "text-amber-900 dark:text-amber-100",
    rose: "text-rose-800 dark:text-rose-100",
    violet: "text-violet-800 dark:text-violet-100",
  };
  return (
    <div className="rounded-[18px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card-2))] p-4 elev">
      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[rgb(var(--text-3))]">{label}</p>
      <p className={`mt-2.5 font-mono text-xl font-semibold tracking-[-0.04em] ${colors[tone]}`}>{value}</p>
      <p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">{note}</p>
    </div>
  );
}

function LoadingState() {
  return <Card className="p-8"><div className="flex items-center gap-3 text-sm text-[rgb(var(--text-2))]"><Clock3 className="h-4 w-4 animate-pulse" />Preparing the synthetic Trail Solutions management view…</div></Card>;
}

function ErrorState({ message }: { message: string }) {
  return <Card className="border-rose-300/20 p-6"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 text-rose-700 dark:text-rose-100" /><div><h2 className="text-sm font-semibold text-[rgb(var(--text))]">Trail Solutions data could not be prepared</h2><p className="mt-1 text-xs text-[rgb(var(--text-3))]">{message}</p></div></div></Card>;
}

export function ImbaTrailSolutionsWorkspace({
  role,
  initialView = "portfolio",
}: {
  role: ImbaRoleKey;
  initialView?: "portfolio" | "import-lab";
}) {
  const canManageTrailData = role === "finance" || role === "executive";
  const [demoSnapshot, setDemoSnapshot] = useState<TrailSolutionsSnapshot | null>(null);
  const [workspaces, setWorkspaces] = useState<TrailSolutionsTestWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [view, setView] = useState<WorkspaceView>(canManageTrailData ? initialView : "portfolio");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionStatuses, setDecisionStatuses] = useState<Record<string, DecisionItem["status"]>>({});

  useEffect(() => {
    let active = true;
    workbookDerivedTrailSolutionsDataSource.getSnapshot(trailSolutionsDemoContext)
      .then((next) => { if (active) setDemoSnapshot(next); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Unknown adapter error"); });
    setWorkspaces(loadTestWorkspaces());
    setActiveWorkspaceIdState(getActiveTestWorkspaceId());
    return () => { active = false; };
  }, []);

  const activeWorkspace = canManageTrailData
    ? workspaces.find((workspace) => workspace.workspaceId === activeWorkspaceId && !workspace.archived)
    : undefined;
  const snapshot = activeWorkspace?.validatedPackage.snapshot ?? demoSnapshot;

  useEffect(() => {
    if (activeWorkspaceId && !workspaces.some((workspace) => workspace.workspaceId === activeWorkspaceId && !workspace.archived)) {
      setActiveWorkspaceIdState(null);
      setActiveTestWorkspaceId(null);
    }
  }, [activeWorkspaceId, workspaces]);

  const selectWorkspace = (workspace: TrailSolutionsTestWorkspace | null) => {
    setActiveWorkspaceIdState(workspace?.workspaceId ?? null);
    setActiveTestWorkspaceId(workspace?.workspaceId ?? null);
    setSelectedProjectId(null);
    setProjectDetail(null);
  };

  const openProject = (project: ProjectFinancialSummary) => {
    setSelectedProjectId(project.projectId);
    setView("project");
    setLoadingProject(true);
    setProjectDetail(null);
    if (activeWorkspace) {
      setProjectDetail(activeWorkspace.validatedPackage.projectDetails[project.projectId] ?? null);
      setLoadingProject(false);
      return;
    }
    workbookDerivedTrailSolutionsDataSource.getProject(trailSolutionsDemoContext, project.projectId)
      .then(setProjectDetail)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to open project"))
      .finally(() => setLoadingProject(false));
  };

  const canViewExceptions = ["executive", "finance", "trail-solutions", "planning-design"].includes(role);
  const canViewDataHealth = canManageTrailData;
  const tabs: Array<{ id: WorkspaceView; label: string }> = [
    { id: "portfolio", label: "Portfolio" },
    { id: "benchmarks", label: "Benchmarks" },
    ...(canViewExceptions ? [{ id: "exceptions" as const, label: "Exceptions" }] : []),
    ...(canViewDataHealth ? [{ id: "data-health" as const, label: "Data health" }] : []),
    ...(canViewDataHealth ? [{ id: "import-lab" as const, label: "Data Import Lab" }] : []),
  ];

  if (error) return <ErrorState message={error} />;
  if (!snapshot) return <LoadingState />;

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[24px] border border-blue-300/20 bg-gradient-to-br from-blue-300/[0.09] via-[rgb(var(--card))] to-emerald-300/[0.06] elev">
        {view === "portfolio" ? <div className="grid gap-5 p-5 lg:grid-cols-[1.45fr_.75fr] lg:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-blue-800 dark:text-blue-100">Trail Solutions financial management</span>
              <span className="text-[11px] text-[rgb(var(--text-3))]">As of {snapshot.portfolio.lastDataRefresh}</span>
            </div>
            <h1 className="mt-4 max-w-4xl text-xl font-semibold leading-8 text-[rgb(var(--text))] sm:text-2xl">Trail Solutions Financial Management turns detailed project-cost data into clear, timely information about performance, risk, and the decisions requiring attention.</h1>
            <p className="mt-3 max-w-3xl text-xs leading-6 text-[rgb(var(--text-2))]">The workbook supplies the discovery structure. This management layer summarizes budget, actual cost, remaining work, forecast, billing, and supported variance drivers. A future ERP remains the financial system of record.</p>
            <div className="mt-4"><ImbaTrailSolutionsTour /></div>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2)/86%)] p-4">
            <p data-testid="trail-solutions-environment-banner" className={`flex items-start gap-2 text-[11px] font-semibold leading-5 ${activeWorkspace ? "text-blue-800 dark:text-blue-100" : "text-amber-900 dark:text-amber-100"}`}><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{activeWorkspace ? `${TEST_DATA_BANNER} · ${activeWorkspace.name}` : TRAIL_SOLUTIONS_SYNTHETIC_BANNER}</p>
            <div className="mt-4 border-t border-[rgb(var(--line)/0.08)] pt-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-4))]">Active environment</p>
              {canManageTrailData ? <select aria-label="Active Trail Solutions environment" value={activeWorkspace?.workspaceId ?? "demo"} onChange={(event) => selectWorkspace(event.target.value === "demo" ? null : workspaces.find((workspace) => workspace.workspaceId === event.target.value) ?? null)} className="mt-2 w-full rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card))] px-3 py-2 text-[11px] text-[rgb(var(--text))]"><option value="demo">Synthetic demonstration</option>{workspaces.filter((workspace) => !workspace.archived).map((workspace) => <option key={workspace.workspaceId} value={workspace.workspaceId}>{workspace.name}</option>)}</select> : <p className="mt-1.5 text-[11px] leading-5 text-[rgb(var(--text-3))]">Synthetic demonstration environment</p>}
              <p className="mt-2 text-[10px] leading-4 text-[rgb(var(--text-4))]">{activeWorkspace ? "Browser-local test data is isolated from the demonstration and production environments." : demoFinancialHealthPolicy.assumptionsLabel}</p>
            </div>
            {canManageTrailData ? <button type="button" onClick={() => setView("import-lab")} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-300 px-3 py-2.5 text-[10px] font-black uppercase text-[#102030]"><UploadCloud className="h-3.5 w-3.5" />Upload Project Data</button> : null}
          </div>
        </div> : <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="text-xs font-semibold text-[rgb(var(--text))]">Trail Solutions financial management</p><p className="mt-1 text-[10px] text-[rgb(var(--text-4))]">As of {snapshot.portfolio.lastDataRefresh}</p></div><p data-testid="trail-solutions-environment-banner" className={`flex items-center gap-2 text-[10px] font-semibold ${activeWorkspace ? "text-blue-800 dark:text-blue-100" : "text-amber-900 dark:text-amber-100"}`}><ShieldCheck className="h-3.5 w-3.5 shrink-0" />{activeWorkspace ? `${TEST_DATA_BANNER} · ${activeWorkspace.name}` : TRAIL_SOLUTIONS_SYNTHETIC_BANNER}</p></div>}
        <div data-tour-ts="tabs" className="flex gap-1 overflow-x-auto border-t border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card)/72%)] px-3 py-2" aria-label="Trail Solutions views">
          {tabs.map((tab) => <button key={tab.id} type="button" aria-pressed={view === tab.id} onClick={() => setView(tab.id)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-bold transition ${view === tab.id ? "bg-blue-300 text-[#102030]" : "text-[rgb(var(--text-2))] hover:bg-[rgb(var(--line)/0.05)]"}`}>{tab.label}</button>)}
          {view === "project" ? <button type="button" aria-pressed="true" className="whitespace-nowrap rounded-xl bg-blue-300 px-3 py-2 text-[11px] font-bold text-[#102030]">Project detail</button> : null}
        </div>
      </section>

      {view === "portfolio" ? <PortfolioView snapshot={snapshot} onOpenProject={openProject} decisionStatuses={decisionStatuses} onDecisionStatus={(id, status) => setDecisionStatuses((current) => ({ ...current, [id]: status }))} /> : null}
      {view === "project" ? loadingProject ? <LoadingState /> : projectDetail ? <ProjectView detail={projectDetail} role={role} onBack={() => setView("portfolio")} decisionStatuses={decisionStatuses} onDecisionStatus={(id, status) => setDecisionStatuses((current) => ({ ...current, [id]: status }))} /> : <ErrorState message={`No project detail found for ${selectedProjectId ?? "the selected project"}.`} /> : null}
      {view === "benchmarks" ? <BenchmarksView benchmarks={snapshot.benchmarks} /> : null}
      {view === "exceptions" ? <ExceptionsView exceptions={snapshot.dataHealth.exceptions} projects={snapshot.projects} finance={canViewDataHealth} onOpenProject={openProject} /> : null}
      {view === "data-health" ? canViewDataHealth ? <DataHealthView snapshot={snapshot} /> : <ErrorState message="CEO or Finance access is required for detailed import and mapping controls." /> : null}
      {view === "import-lab" ? canViewDataHealth ? <ImbaTrailSolutionsImportLab workspaces={workspaces} onWorkspacesChange={setWorkspaces} onOpenWorkspace={selectWorkspace} onOpenPortfolio={() => setView("portfolio")} /> : <ErrorState message="CEO or Finance access is required to upload and validate project data." /> : null}
    </div>
  );
}

function PortfolioView({ snapshot, onOpenProject, decisionStatuses, onDecisionStatus }: {
  snapshot: TrailSolutionsSnapshot;
  onOpenProject: (project: ProjectFinancialSummary) => void;
  decisionStatuses: Record<string, DecisionItem["status"]>;
  onDecisionStatus: (id: string, status: DecisionItem["status"]) => void;
}) {
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [advanced, setAdvanced] = useState(false);
  const projects = useMemo(() => snapshot.projects.filter((project) => {
    if (filters.query && !`${project.projectName} ${project.projectCode} ${project.clientName}`.toLowerCase().includes(filters.query.toLowerCase())) return false;
    if (filters.businessLine && filters.businessLine !== "all" && project.businessLine !== filters.businessLine) return false;
    if (filters.projectManager && filters.projectManager !== "all" && project.projectManager !== filters.projectManager) return false;
    if (filters.region && filters.region !== "all" && project.region !== filters.region) return false;
    if (filters.fundingType && filters.fundingType !== "all" && project.fundingType !== filters.fundingType) return false;
    if (filters.clientName && filters.clientName !== "all" && project.clientName !== filters.clientName) return false;
    if (filters.projectStage && filters.projectStage !== "all" && project.projectStage !== filters.projectStage) return false;
    if (filters.healthStatus && filters.healthStatus !== "all" && project.healthStatus !== filters.healthStatus) return false;
    if (filters.decisionRequired !== undefined && (project.decisionsRequired.length > 0) !== filters.decisionRequired) return false;
    return true;
  }), [filters, snapshot.projects]);
  const options = <K extends keyof ProjectFinancialSummary>(key: K) => Array.from(new Set(snapshot.projects.map((project) => String(project[key]))));
  const primaryDecisions = snapshot.decisions.filter((decision) => (decisionStatuses[decision.decisionItemId] ?? decision.status) !== "complete").slice(0, 4);

  return (
    <>
      <div data-tour-ts="kpis" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Active projects" value={`${snapshot.portfolio.activeProjects}`} note={`${snapshot.portfolio.healthCounts["on-track"]} on track · ${snapshot.portfolio.healthCounts.watch} watch · ${snapshot.portfolio.healthCounts["at-risk"]} at risk`} />
        <Kpi label="Current contract value" value={money(snapshot.portfolio.totalCurrentContractValue, true)} note="Original contracts plus approved change orders" tone="green" />
        <Kpi label="Forecast final cost" value={money(snapshot.portfolio.forecastFinalCost, true)} note={`${snapshot.portfolio.forecastCoverageProjects} of ${snapshot.projects.length} projects have reliable forecasts`} tone="amber" />
        <Kpi label="Forecast gross margin" value={money(snapshot.portfolio.forecastGrossMargin, true)} note={`${percent(snapshot.portfolio.forecastGrossMarginPercent)} across reliable forecasts`} tone="green" />
      </div>
      {primaryDecisions.length ? (
        <Card dataTour="decisions">
          <SectionHeading eyebrow="Decide now" title="Management actions with a financial consequence" note="Every warning answers what changed, the financial effect, and the next action." />
          <div className="grid gap-3 p-4 lg:grid-cols-2 xl:grid-cols-4">
            {primaryDecisions.map((decision) => <DecisionCard key={decision.decisionItemId} decision={decision} project={snapshot.projects.find((project) => project.projectId === decision.projectId)} status={decisionStatuses[decision.decisionItemId] ?? decision.status} onStatus={(status) => onDecisionStatus(decision.decisionItemId, status)} onOpenProject={onOpenProject} />)}
          </div>
        </Card>
      ) : null}

      <div data-tour-ts="billing" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Actual cost to date" value={money(snapshot.portfolio.actualCostToDate, true)} note="Loaded labor and direct/indirect project cost" />
        <Kpi label="Billing and receivables" value={money(snapshot.portfolio.outstandingReceivables + snapshot.portfolio.unbilledAmount, true)} note={`${money(snapshot.portfolio.outstandingReceivables)} AR · ${money(snapshot.portfolio.unbilledAmount)} unbilled`} tone="amber" />
        <Kpi label="Decisions required" value={`${snapshot.portfolio.projectsRequiringDecisions}`} note="Each item names effect, owner, due date, and action" tone="rose" />
        <Kpi label="Data exceptions" value={`${snapshot.portfolio.projectsWithDataExceptions}`} note="Unreliable projects show Data incomplete" tone="violet" />
      </div>

      <Card dataTour="portfolio">
        <SectionHeading eyebrow="Portfolio" title="Which projects need attention?" note="Open a project only when you need the explanation behind its status." action={<button type="button" onClick={() => setAdvanced((current) => !current)} aria-expanded={advanced} className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.1)] px-3 py-2 text-[11px] font-bold text-[rgb(var(--text-2))]"><Filter className="h-3.5 w-3.5" />{advanced ? "Fewer filters" : "More filters"}</button>} />
        <div className="border-b border-[rgb(var(--line)/0.07)] p-4">
          <div className="grid gap-2 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] px-3 py-2"><Search className="h-4 w-4 text-[rgb(var(--text-4))]" /><span className="sr-only">Search projects</span><input value={filters.query ?? ""} onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Search project or client" className="min-w-0 flex-1 bg-transparent text-xs text-[rgb(var(--text))] outline-none" /></label>
            <FilterSelect label="Business line" value={filters.businessLine ?? "all"} options={options("businessLine")} onChange={(value) => setFilters((current) => ({ ...current, businessLine: value as ProjectFilters["businessLine"] }))} />
            <FilterSelect label="Financial health" value={filters.healthStatus ?? "all"} options={Object.keys(healthMeta)} optionLabel={(value) => healthMeta[value as FinancialHealthStatus].label} onChange={(value) => setFilters((current) => ({ ...current, healthStatus: value as ProjectFilters["healthStatus"] }))} />
            <FilterSelect label="Decision" value={filters.decisionRequired === undefined ? "all" : String(filters.decisionRequired)} options={["true", "false"]} optionLabel={(value) => value === "true" ? "Decision required" : "No decision"} onChange={(value) => setFilters((current) => ({ ...current, decisionRequired: value === "all" ? undefined : value === "true" }))} />
          </div>
          {advanced ? <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><FilterSelect label="Project manager" value={filters.projectManager ?? "all"} options={options("projectManager")} onChange={(value) => setFilters((current) => ({ ...current, projectManager: value }))} /><FilterSelect label="Region" value={filters.region ?? "all"} options={options("region")} onChange={(value) => setFilters((current) => ({ ...current, region: value }))} /><FilterSelect label="Funding type" value={filters.fundingType ?? "all"} options={options("fundingType")} onChange={(value) => setFilters((current) => ({ ...current, fundingType: value }))} /><FilterSelect label="Client" value={filters.clientName ?? "all"} options={options("clientName")} onChange={(value) => setFilters((current) => ({ ...current, clientName: value }))} /><FilterSelect label="Project stage" value={filters.projectStage ?? "all"} options={options("projectStage")} onChange={(value) => setFilters((current) => ({ ...current, projectStage: value as ProjectFilters["projectStage"] }))} /></div> : null}
          <div className="mt-3 flex items-center justify-between"><p className="text-[11px] text-[rgb(var(--text-3))]">{projects.length} of {snapshot.projects.length} projects</p><button type="button" onClick={() => setFilters({})} className="text-[11px] font-bold text-blue-800 dark:text-blue-100">Clear filters</button></div>
        </div>
        <ProjectPortfolioTable projects={projects} onOpenProject={onOpenProject} />
      </Card>
    </>
  );
}

function FilterSelect({ label, value, options, onChange, optionLabel = (option) => option }: { label: string; value: string; options: string[]; onChange: (value: string) => void; optionLabel?: (option: string) => string }) {
  return <label className="relative"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-[11px] text-[rgb(var(--text))] outline-none"><option value="all">All {label.toLowerCase()}s</option>{options.map((option) => <option key={option} value={option}>{optionLabel(option)}</option>)}</select></label>;
}

function ProjectPortfolioTable({ projects, onOpenProject }: { projects: readonly ProjectFinancialSummary[]; onOpenProject: (project: ProjectFinancialSummary) => void }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1120px] text-left">
          <thead><tr className="border-b border-[rgb(var(--line)/0.08)] text-[10px] font-black uppercase tracking-[0.13em] text-[rgb(var(--text-3))]"><th className="px-5 py-3">Project</th><th className="px-3 py-3">Leadership context</th><th className="px-3 py-3 text-right">Current contract</th><th className="px-3 py-3 text-right">Cost now → final</th><th className="px-3 py-3 text-right">Forecast margin</th><th className="px-3 py-3">Billing</th><th className="px-5 py-3">Management signal</th></tr></thead>
          <tbody>{projects.map((project) => <ProjectPortfolioRow key={project.projectId} project={project} onOpenProject={onOpenProject} />)}</tbody>
        </table>
      </div>
      <div className="space-y-3 p-3 md:hidden">{projects.map((project) => <button key={project.projectId} type="button" onClick={() => onOpenProject(project)} className="w-full rounded-2xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] p-4 text-left"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-[rgb(var(--text))]">{project.projectName}</h3><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{project.clientName} · {project.businessLine}</p></div><HealthBadge status={project.healthStatus} /></div><div className="mt-4 grid grid-cols-2 gap-3"><MiniStat label="Contract" value={money(project.currentContractValue)} /><MiniStat label="Forecast margin" value={money(project.forecastMargin)} /><MiniStat label="Actual → final" value={`${money(project.actualCostToDate)} → ${money(project.forecastFinalCost)}`} /><MiniStat label="Billing" value={`${money(project.outstandingReceivables)} AR · ${project.collectionStatus.replace("-", " ")}`} /></div><p className="mt-4 text-[11px] leading-5 text-[rgb(var(--text-3))]">{project.varianceDrivers[0]?.headline ?? "No material variance requires a decision."}</p></button>)}</div>
    </>
  );
}

function ProjectPortfolioRow({ project, onOpenProject }: { project: ProjectFinancialSummary; onOpenProject: (project: ProjectFinancialSummary) => void }) {
  return (
    <tr className="border-b border-[rgb(var(--line)/0.06)] align-top last:border-0 hover:bg-blue-300/[0.025]">
      <td className="px-5 py-4"><button type="button" onClick={() => onOpenProject(project)} className="group text-left"><span className="block text-xs font-semibold text-[rgb(var(--text))] group-hover:text-blue-800 dark:group-hover:text-blue-100">{project.projectName}</span><span className="mt-1 block font-mono text-[10px] text-[rgb(var(--text-4))]">{project.projectCode}</span><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 dark:text-blue-100">Open project <ArrowRight className="h-3 w-3" /></span></button></td>
      <td className="px-3 py-4 text-[11px] leading-5 text-[rgb(var(--text-2))]"><strong className="font-semibold text-[rgb(var(--text))]">{project.clientName}</strong><br />{project.businessLine} · {project.projectStage}<br />{project.projectManager} · {project.region}</td>
      <td className="px-3 py-4 text-right"><p className="font-mono text-xs font-semibold text-[rgb(var(--text))]">{money(project.currentContractValue)}</p><p className="mt-1 text-[10px] text-[rgb(var(--text-4))]">{money(project.originalContractValue)} + {money(project.approvedChangeOrders)} CO</p></td>
      <td className="px-3 py-4 text-right"><p className="font-mono text-xs text-[rgb(var(--text))]">{money(project.actualCostToDate)} → {money(project.forecastFinalCost)}</p><p className="mt-1 text-[10px] text-[rgb(var(--text-4))]">ETC {money(project.estimatedCostToComplete)}</p></td>
      <td className={`px-3 py-4 text-right font-mono text-xs font-semibold ${project.forecastMargin !== null && project.forecastMargin < 0 ? "text-rose-700 dark:text-rose-100" : "text-[rgb(var(--text))]"}`}><p>{money(project.forecastMargin)}</p><p className="mt-1 text-[10px]">{percent(project.forecastMarginPercent)}</p></td>
      <td className="px-3 py-4 text-[11px] leading-5 text-[rgb(var(--text-2))]"><span className="font-semibold text-[rgb(var(--text))]">{money(project.invoicedAmount)} invoiced</span><br />{money(project.outstandingReceivables)} AR<br />{project.unbilledAmount === null ? "Unbilled unavailable" : `${money(project.unbilledAmount)} unbilled`}<br /><span className="capitalize">{project.collectionStatus.replace("-", " ")}</span></td>
      <td className="px-5 py-4"><HealthBadge status={project.healthStatus} /><p className="mt-2 max-w-[260px] text-[11px] leading-5 text-[rgb(var(--text-3))]">{project.varianceDrivers[0]?.headline ?? "No material variance requires a decision."}</p>{project.decisionsRequired.length ? <p className="mt-1 text-[10px] font-bold text-rose-700 dark:text-rose-100">{project.decisionsRequired.length} decision required</p> : null}</td>
    </tr>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[9px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">{label}</p><p className="mt-1 font-mono text-[11px] text-[rgb(var(--text))]">{value}</p></div>;
}

function DecisionCard({ decision, project, status, onStatus, onOpenProject }: { decision: DecisionItem; project?: ProjectFinancialSummary; status: DecisionItem["status"]; onStatus: (status: DecisionItem["status"]) => void; onOpenProject?: (project: ProjectFinancialSummary) => void }) {
  return <article className="flex min-h-[270px] flex-col rounded-2xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] p-4"><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${status === "complete" ? "bg-emerald-300/10 text-emerald-800 dark:text-emerald-100" : status === "in-progress" ? "bg-amber-300/10 text-amber-900 dark:text-amber-100" : "bg-rose-300/10 text-rose-800 dark:text-rose-100"}`}>{status.replace("-", " ")}</span><span className="text-[10px] text-[rgb(var(--text-4))]">Due {decision.dueDate}</span></div><h3 className="mt-3 text-xs font-semibold leading-5 text-[rgb(var(--text))]">{decision.issue}</h3>{project ? <p className="mt-1 text-[10px] text-[rgb(var(--text-4))]">{project.projectName}</p> : null}<div className="mt-3 rounded-xl border border-rose-300/15 bg-rose-300/[0.055] px-3 py-2"><p className="text-[9px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-100">Financial effect</p><p className="mt-1 text-[11px] leading-4 text-[rgb(var(--text-2))]">{decision.financialEffectLabel}</p></div><p className="mt-3 text-[11px] leading-5 text-[rgb(var(--text-2))]">{decision.recommendedAction}</p><p className="mt-2 text-[10px] text-[rgb(var(--text-4))]">Owner · {decision.owner}</p><div className="mt-auto flex gap-2 pt-4">{status === "open" ? <button type="button" onClick={() => onStatus("in-progress")} className="rounded-lg bg-blue-300 px-2.5 py-2 text-[10px] font-black uppercase text-[#102030]">Start</button> : null}{status !== "complete" ? <button type="button" onClick={() => onStatus("complete")} className="rounded-lg border border-[rgb(var(--line)/0.12)] px-2.5 py-2 text-[10px] font-black uppercase text-[rgb(var(--text-2))]">Complete demo</button> : null}{project && onOpenProject ? <button type="button" onClick={() => onOpenProject(project)} className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 dark:text-blue-100">Evidence <ArrowRight className="h-3 w-3" /></button> : null}</div></article>;
}

function ProjectView({ detail, role, onBack, decisionStatuses, onDecisionStatus }: { detail: ProjectDetail; role: ImbaRoleKey; onBack: () => void; decisionStatuses: Record<string, DecisionItem["status"]>; onDecisionStatus: (id: string, status: DecisionItem["status"]) => void }) {
  const project = detail.summary;
  const [showCostDetail, setShowCostDetail] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const canSeeTransactions = role === "finance" || role === "executive";
  const maxCost = Math.max(...project.costBreakdown.map((line) => line.forecast ?? line.actual), 1);
  return (
    <>
      <Card>
        <div className="p-5">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-[11px] font-bold text-blue-800 dark:text-blue-100"><ArrowLeft className="h-3.5 w-3.5" />Back to portfolio</button>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><HealthBadge status={project.healthStatus} /><span className="font-mono text-[10px] text-[rgb(var(--text-4))]">{project.projectCode}</span></div><h2 className="mt-3 text-xl font-semibold text-[rgb(var(--text))]">{project.projectName}</h2><p className="mt-1 text-xs text-[rgb(var(--text-2))]">{project.clientName} · {project.businessLine} · {project.projectStage}</p></div><div className="grid gap-2 text-right text-[11px] text-[rgb(var(--text-3))]"><span>Last refresh <strong className="text-[rgb(var(--text))]">{project.lastDataRefresh}</strong></span><span>Start date <strong className="text-[rgb(var(--text))]">{project.startDate}</strong></span><span>Expected completion <strong className="text-[rgb(var(--text))]">{project.expectedCompletionDate}</strong></span></div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MiniInfo icon={Users} label="Project manager" value={project.projectManager} /><MiniInfo icon={MapPin} label="Region" value={project.region} /><MiniInfo icon={Layers3} label="Contract type" value={project.contractType} /><MiniInfo icon={Target} label="Funding" value={project.fundingType} /></div>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Current contract value" value={money(project.currentContractValue)} note={`${money(project.originalContractValue)} original + ${money(project.approvedChangeOrders)} approved changes`} tone="green" /><Kpi label="Actual cost to date" value={money(project.actualCostToDate)} note={`${money(project.originalEstimatedCost)} original estimate · ${money(project.revisedBudgetCost)} revised budget`} /><Kpi label="Estimated cost to complete" value={money(project.estimatedCostToComplete)} note="Explicit remaining-work forecast" tone={project.estimatedCostToComplete === null ? "violet" : "amber"} /><Kpi label="Forecast final cost" value={money(project.forecastFinalCost)} note="Actual cost plus estimate to complete" tone={project.forecastFinalCost === null ? "violet" : "amber"} /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Forecast margin" value={money(project.forecastMargin)} note={percent(project.forecastMarginPercent)} tone={project.forecastMargin !== null && project.forecastMargin < 0 ? "rose" : project.forecastMargin === null ? "violet" : "green"} /><Kpi label="Amount invoiced" value={money(project.invoicedAmount)} note={`${money(project.recognizedRevenue)} recognized separately`} /><Kpi label="Cash collected" value={money(project.cashCollected)} note={`${money(project.outstandingReceivables)} outstanding receivables`} tone="green" /><Kpi label="Unbilled earned amount" value={money(project.unbilledAmount)} note="Only shown when recognized progress is available" tone="amber" /></div>

      <Card>
        <SectionHeading eyebrow="What changed" title={project.varianceDrivers.length ? "Supported variance explanations" : "No material variance needs a decision"} note="Explanations appear only when estimate, actual, operational-driver, billing, or mapping evidence supports them." />
        <div className="grid gap-3 p-4 lg:grid-cols-2">{project.varianceDrivers.length ? project.varianceDrivers.map((driver) => <article key={`${driver.driverType}-${driver.headline}`} className="rounded-2xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] p-4"><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-900 dark:text-amber-100"><BarChart3 className="h-4 w-4" /></span><div><h3 className="text-xs font-semibold text-[rgb(var(--text))]">{driver.headline}</h3><p className="mt-2 text-[11px] leading-5 text-[rgb(var(--text-2))]">{driver.explanation}</p>{driver.financialEffect !== undefined ? <p className="mt-2 font-mono text-[11px] font-semibold text-[rgb(var(--text))]">Financial effect · {money(driver.financialEffect)}</p> : null}<p className="mt-2 text-[9px] uppercase tracking-wider text-[rgb(var(--text-4))]">Evidence · {driver.evidenceReferences.join(" · ")}</p></div></div></article>) : <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4 text-[11px] leading-5 text-[rgb(var(--text-2))]">Current forecast remains within the configurable demonstration guardrails. Continue the normal forecast and billing cadence.</div>}</div>
      </Card>

      {project.decisionsRequired.length ? <Card><SectionHeading eyebrow="Decision required" title="Action cards" note="Demo status changes are local presentation state; no production workflow is written." /><div className="grid gap-3 p-4 lg:grid-cols-2 xl:grid-cols-3">{project.decisionsRequired.map((decision) => <DecisionCard key={decision.decisionItemId} decision={decision} project={project} status={decisionStatuses[decision.decisionItemId] ?? decision.status} onStatus={(status) => onDecisionStatus(decision.decisionItemId, status)} />)}</div></Card> : null}

      <Card>
        <SectionHeading eyebrow="Cost performance" title="Where the project is spending" note="The visual defaults to category-level budget, actual, and forecast. Transaction rows remain behind Finance drill-down." action={<button type="button" onClick={() => setShowCostDetail((current) => !current)} aria-expanded={showCostDetail} className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.1)] px-3 py-2 text-[11px] font-bold text-[rgb(var(--text-2))]">{showCostDetail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}{showCostDetail ? "Hide values" : "Show category values"}</button>} />
        <div className="p-5"><div className="mb-4 flex flex-wrap gap-4 text-[10px] text-[rgb(var(--text-3))]"><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-5 rounded-full bg-blue-300/35" />Estimated</span><span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-5 rounded-full bg-blue-400" />Actual</span><span className="inline-flex items-center gap-1.5"><i className="h-3 w-0.5 bg-amber-400" />Forecast final</span></div><div className="space-y-3">{project.costBreakdown.map((line) => <div key={line.category} className="grid items-center gap-2 sm:grid-cols-[170px_1fr_190px]"><p className="text-[11px] font-semibold text-[rgb(var(--text))]">{line.category}</p><div className="relative h-3 overflow-hidden rounded-full bg-[rgb(var(--line)/0.08)]"><span className="absolute inset-y-0 left-0 rounded-full bg-blue-300/35" style={{ width: `${(line.estimated / maxCost) * 100}%` }} /><span className="absolute inset-y-0 left-0 rounded-full bg-blue-400" style={{ width: `${(line.actual / maxCost) * 100}%` }} /><span className="absolute inset-y-0 left-0 border-r-2 border-amber-400" style={{ width: `${(((line.forecast ?? line.actual) / maxCost) * 100)}%` }} /></div>{showCostDetail ? <p className="text-right font-mono text-[10px] text-[rgb(var(--text-3))]">{money(line.estimated)} est · {money(line.actual)} actual · {money(line.forecast)} final</p> : <p className="text-right text-[10px] text-[rgb(var(--text-4))]">Actual with forecast marker</p>}</div>)}</div></div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card><SectionHeading eyebrow="Labor performance" title="Hours and cost remain visible together" /><div className="grid grid-cols-2 gap-3 p-4"><MiniStat label="Estimated hours" value={number(project.estimatedLaborHours)} /><MiniStat label="Actual hours" value={number(project.actualLaborHours)} /><MiniStat label="Remaining forecast hours" value={project.forecastRemainingLaborHours === null ? "Review required" : number(project.forecastRemainingLaborHours)} /><MiniStat label="Forecast final hours" value={project.forecastFinalLaborHours === null ? "Review required" : number(project.forecastFinalLaborHours)} /><MiniStat label="Estimated labor cost" value={money(project.estimatedLaborCost)} /><MiniStat label="Actual labor cost" value={money(project.actualLaborCost)} /></div><div className="border-t border-[rgb(var(--line)/0.07)] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">Staffing mix by role</p><div className="mt-3 space-y-2">{project.staffingMix.map((line) => <div key={line.role} className="grid grid-cols-[1fr_auto] gap-3 text-[11px]"><span className="text-[rgb(var(--text-2))]">{line.role}</span><span className="font-mono text-[rgb(var(--text))]">{number(line.plannedHours)} planned · {number(line.actualHours)} actual · {number(line.forecastRemainingHours)} left</span></div>)}</div></div></Card>
        <Card><SectionHeading eyebrow="Billing and cash" title="Do not confuse earned, invoiced, and collected" /><div className="space-y-3 p-4">{[["Current contract value", money(project.currentContractValue)], ["Recognized revenue / documented progress", money(project.recognizedRevenue)], ["Invoice amount", money(project.invoicedAmount)], ["Cash received", money(project.cashCollected)], ["Outstanding receivables", money(project.outstandingReceivables)], ["Unbilled earned amount", money(project.unbilledAmount)], ["Collection status", project.collectionStatus.replace("-", " ")], ["Last invoice date", project.lastInvoiceDate ?? "No invoice"]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-[rgb(var(--line)/0.06)] pb-2 text-[11px] last:border-0"><span className="text-[rgb(var(--text-3))]">{label}</span><strong className="font-mono font-semibold capitalize text-[rgb(var(--text))]">{value}</strong></div>)}</div></Card>
      </div>

      {canSeeTransactions ? <Card><SectionHeading eyebrow="Finance drill-down" title="Source-level supporting records" note="Employee names and compensation are not exposed; project labor is summarized by role." action={<button type="button" onClick={() => setShowTransactions((current) => !current)} aria-expanded={showTransactions} className="rounded-xl border border-[rgb(var(--line)/0.1)] px-3 py-2 text-[11px] font-bold text-[rgb(var(--text-2))]">{showTransactions ? "Close drill-down" : "Open drill-down"}</button>} />{showTransactions ? <div className="grid gap-4 p-4 lg:grid-cols-3"><TransactionList title="Labor actuals" rows={detail.laborActuals.map((item) => [item.source.sourceRecordId, `${item.resourceRole} · ${number(item.hours)} hours`, money(item.fullyBurdenedLaborCost)])} /><TransactionList title="Nonlabor actuals" rows={detail.nonlaborActuals.map((item) => [item.source.sourceRecordId, `${item.costCategory} · ${item.description}`, money(item.amount)])} /><TransactionList title="Billing records" rows={detail.billingRecords.map((item) => [item.documentNumber, item.recordType.replaceAll("-", " "), money(item.amount)])} /></div> : null}</Card> : null}
    </>
  );
}

function MiniInfo({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return <div className="flex items-start gap-2 rounded-xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-3"><Icon className="mt-0.5 h-4 w-4 text-blue-800 dark:text-blue-100" /><div><p className="text-[9px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">{label}</p><p className="mt-1 text-[11px] font-semibold text-[rgb(var(--text))]">{value}</p></div></div>;
}

function TransactionList({ title, rows }: { title: string; rows: Array<[string, string, string]> }) {
  return <div className="rounded-2xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] p-4"><h3 className="text-xs font-semibold text-[rgb(var(--text))]">{title}</h3><div className="mt-3 space-y-3">{rows.map(([id, description, value]) => <div key={id} className="border-b border-[rgb(var(--line)/0.06)] pb-2 last:border-0"><div className="flex justify-between gap-3"><span className="font-mono text-[9px] text-[rgb(var(--text-4))]">{id}</span><strong className="font-mono text-[10px] text-[rgb(var(--text))]">{value}</strong></div><p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-3))]">{description}</p></div>)}</div></div>;
}

function BenchmarksView({ benchmarks }: { benchmarks: readonly Benchmark[] }) {
  const [businessLine, setBusinessLine] = useState("all");
  const [confidence, setConfidence] = useState("all");
  const rows = benchmarks.filter((benchmark) => (businessLine === "all" || benchmark.businessLine === businessLine) && (confidence === "all" || benchmark.confidence === confidence));
  const lines = Array.from(new Set(benchmarks.map((benchmark) => benchmark.businessLine)));
  const metricValue = (benchmark: Benchmark, value: number) => benchmark.unit.includes("%") ? `${(value * 100).toFixed(1)}%` : benchmark.unit.includes("$") ? money(value) : number(value);
  return <Card><SectionHeading eyebrow="Benchmark library" title="Validated internal ranges, never unsupported standards" note="The demonstration ranges are hypothetical. Production benchmarks require approved completed-project cohorts and sufficient sample size." /><div className="grid gap-2 border-b border-[rgb(var(--line)/0.07)] p-4 sm:grid-cols-2"><FilterSelect label="Business line" value={businessLine} options={lines} onChange={setBusinessLine} /><FilterSelect label="Confidence" value={confidence} options={["low", "moderate", "high"]} onChange={setConfidence} /></div><div className="grid gap-3 p-4 lg:grid-cols-2">{rows.map((benchmark) => <article key={benchmark.benchmarkId} className="rounded-2xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-blue-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-100">{benchmark.label}</span><span className="text-[10px] font-bold uppercase text-[rgb(var(--text-4))]">{benchmark.confidence} confidence</span></div><h3 className="mt-3 text-sm font-semibold text-[rgb(var(--text))]">{benchmark.metric}</h3><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{benchmark.businessLine} · {benchmark.region} · {benchmark.complexityClass}</p><div className="mt-4 grid grid-cols-3 gap-2"><MiniStat label="Low" value={metricValue(benchmark, benchmark.low)} /><MiniStat label="Median" value={metricValue(benchmark, benchmark.median)} /><MiniStat label="High" value={metricValue(benchmark, benchmark.high)} /></div><div className="mt-4 flex items-center justify-between border-t border-[rgb(var(--line)/0.07)] pt-3"><span className="text-[10px] font-semibold text-[rgb(var(--text-2))]">{benchmark.rangeLabel}</span><span className="font-mono text-[10px] text-[rgb(var(--text-3))]">n = {benchmark.sampleSize}</span></div>{benchmark.note ? <p className={`mt-2 text-[10px] leading-4 ${benchmark.sampleSize < 5 ? "font-semibold text-amber-900 dark:text-amber-100" : "text-[rgb(var(--text-4))]"}`}>{benchmark.note}</p> : null}<p className="mt-2 text-[9px] text-[rgb(var(--text-4))]">Applicable {benchmark.applicableFrom} through {benchmark.applicableTo}</p></article>)}</div></Card>;
}

function ExceptionsView({ exceptions, projects, finance, onOpenProject }: { exceptions: readonly DataException[]; projects: readonly ProjectFinancialSummary[]; finance: boolean; onOpenProject: (project: ProjectFinancialSummary) => void }) {
  const visible = finance ? exceptions : exceptions.filter((exception) => exception.suggestedProjectId || exception.projectId);
  return <Card><SectionHeading eyebrow="Exception queue" title={finance ? "Records requiring mapping or forecast review" : "Project-level issues affecting management output"} note="Unknown records remain quarantined. IMBA-OS never assigns them to a project merely to make totals balance." /><div className="divide-y divide-[rgb(var(--line)/0.07)]">{visible.map((exception) => { const project = projects.find((item) => item.projectId === (exception.projectId ?? exception.suggestedProjectId)); return <article key={exception.dataExceptionId} className="grid gap-3 px-5 py-4 lg:grid-cols-[.9fr_1.6fr_.7fr_.7fr_auto]"><div><p className="font-mono text-[10px] text-[rgb(var(--text-4))]">{exception.sourceRecordId}</p><p className="mt-1 text-[11px] font-semibold text-[rgb(var(--text))]">{exception.sourceSystem}</p></div><div><p className="text-xs font-semibold text-[rgb(var(--text))]">{exception.exceptionType.replaceAll("-", " ")}</p><p className="mt-1 text-[11px] leading-5 text-[rgb(var(--text-3))]">{exception.description}</p></div><div><p className="text-[9px] font-black uppercase text-[rgb(var(--text-4))]">Financial value</p><p className="mt-1 font-mono text-[11px] text-[rgb(var(--text))]">{money(exception.amount ?? null)}</p></div><div><p className="text-[9px] font-black uppercase text-[rgb(var(--text-4))]">Owner / status</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">{exception.owner}<br />{exception.status}</p></div><div className="self-center">{project ? <button type="button" onClick={() => onOpenProject(project)} className="inline-flex items-center gap-1 rounded-lg border border-[rgb(var(--line)/0.1)] px-2.5 py-2 text-[10px] font-bold text-blue-800 dark:text-blue-100">Project <ArrowRight className="h-3 w-3" /></button> : <span className="rounded-full bg-violet-300/10 px-2 py-1 text-[9px] font-black uppercase text-violet-800 dark:text-violet-100">Quarantined</span>}</div></article>; })}</div></Card>;
}

function DataHealthView({ snapshot }: { snapshot: TrailSolutionsSnapshot }) {
  const health = snapshot.dataHealth;
  const checks = [
    ["Unmapped project identifiers", health.unmappedProjectIdentifiers],
    ["Unmapped cost codes", health.unmappedCostCodes],
    ["Transactions missing project IDs", health.transactionsMissingProjectIds],
    ["Labor records missing hours", health.laborRecordsMissingHours],
    ["Costs without operational quantity", health.costsMissingOperationalQuantity],
    ["Projects without current estimate", health.projectsWithoutCurrentEstimate],
    ["Projects without estimate to complete", health.projectsWithoutEstimateToComplete],
    ["Billing reconciliation issues", health.billingReconciliationIssues],
    ["Funding classifications requiring review", health.fundingClassificationsRequiringReview],
    ["Stale project forecasts", health.staleForecasts],
  ] as const;
  return <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{checks.slice(0, 5).map(([label, value]) => <Kpi key={label} label={label} value={`${value}`} note={value ? "Review required" : "No current exception"} tone={value ? "rose" : "green"} />)}</div><Card><SectionHeading eyebrow="Finance data health" title="Can leadership trust the project output?" note="This secondary view exposes the controls behind the management summary. Production writes remain disabled." /><div className="grid gap-4 p-4 lg:grid-cols-2"><div className="rounded-2xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] p-4"><h3 className="text-xs font-semibold text-[rgb(var(--text))]">Validation checks</h3><div className="mt-3 space-y-2">{checks.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-[rgb(var(--line)/0.06)] pb-2 text-[11px] last:border-0"><span className="text-[rgb(var(--text-2))]">{label}</span><span className={`font-mono font-semibold ${value ? "text-rose-700 dark:text-rose-100" : "text-emerald-800 dark:text-emerald-100"}`}>{value}</span></div>)}</div></div><div className="rounded-2xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] p-4"><h3 className="text-xs font-semibold text-[rgb(var(--text))]">Source refresh status</h3><div className="mt-3 space-y-3">{health.refreshStatuses.map((status) => <div key={status.dataRefreshStatusId} className="rounded-xl border border-[rgb(var(--line)/0.07)] p-3"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-semibold text-[rgb(var(--text))]">{status.sourceName}</p><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${status.status === "current" ? "bg-emerald-300/10 text-emerald-800 dark:text-emerald-100" : "bg-[rgb(var(--line)/0.08)] text-[rgb(var(--text-3))]"}`}>{status.status}</span></div><p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-3))]">{status.sourceCoverage}</p><p className="mt-2 text-[9px] font-black uppercase text-rose-700 dark:text-rose-100">Production writes disabled</p></div>)}</div></div></div></Card><Card><SectionHeading eyebrow="Control totals" title="Source totals and quarantined differences" /><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[10px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]"><th className="px-5 py-3">Source</th><th className="px-3 py-3">Record type</th><th className="px-3 py-3 text-right">Count</th><th className="px-3 py-3 text-right">Amount</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{health.sourceControlTotals.map((total) => <tr key={`${total.source}-${total.recordType}`} className="border-b border-[rgb(var(--line)/0.06)] last:border-0"><td className="px-5 py-3 text-[11px] font-semibold text-[rgb(var(--text))]">{total.source}</td><td className="px-3 py-3 text-[11px] text-[rgb(var(--text-2))]">{total.recordType}</td><td className="px-3 py-3 text-right font-mono text-[11px] text-[rgb(var(--text))]">{total.count}</td><td className="px-3 py-3 text-right font-mono text-[11px] text-[rgb(var(--text))]">{money(total.amount)}</td><td className="px-5 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${total.status === "reconciled" ? "bg-emerald-300/10 text-emerald-800 dark:text-emerald-100" : "bg-rose-300/10 text-rose-800 dark:text-rose-100"}`}>{total.status}</span></td></tr>)}</tbody></table></div></Card></>;
}
