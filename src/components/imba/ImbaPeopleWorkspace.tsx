'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Download,
  FileCheck2,
  FileText,
  FolderOpen,
  MapPin,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  imbaCompliance,
  imbaEmployees,
  imbaOnboarding,
  imbaOpenRoles,
} from '@/lib/imba-detail-data';
import type { ImbaOsView } from '@/lib/imba-os-data';
import type { ImbaRoleKey } from '@/lib/imba-intelligence-data';
import { useImbaOsState } from '@/components/imba/ImbaOsState';
import { ImbaInfoTooltip } from '@/components/imba/ImbaInfoTooltip';

export type ImbaPeopleView =
  | 'people'
  | 'people-directory'
  | 'people-reports'
  | 'people-payroll'
  | 'people-hiring'
  | 'people-onboarding'
  | 'people-compliance'
  | 'people-documents'
  | 'people-volunteers'
  | 'people-training'
  | 'people-role-studio';

function money(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2).replace(/0$/, '').replace(/\.0$/, '')}M`;
  return `$${Math.round(value / 1_000)}K`;
}

function communicationTimeZone(location: string): string {
  if (location === 'Not stated') return 'Needs confirmation';
  if (location.includes('Window Rock')) return 'Mountain (MT)';
  if (location.includes('Arizona') || location.includes('Tucson')) return 'Arizona (MST)';
  if (['Colorado', 'Utah', 'New Mexico'].some((place) => location.includes(place))) return 'Mountain (MT)';
  if (['Wisconsin', 'Missouri'].some((place) => location.includes(place))) return 'Central (CT)';
  if (['California', 'Eastern Sierra'].some((place) => location.includes(place))) return 'Pacific (PT)';
  if (['Delaware', 'Maine', 'New Jersey', 'Cincinnati', 'New York', 'Vermont', 'Washington, D.C.'].some((place) => location.includes(place))) return 'Eastern (ET)';
  return 'Needs confirmation';
}

function ShellCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[22px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card)/90%)] elev ${className}`}>{children}</section>;
}

function Heading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return <div className="border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">{eyebrow}</p><div className="mt-1 flex flex-wrap items-end justify-between gap-2"><h2 className="text-base font-semibold text-[rgb(var(--text))]">{title}</h2>{detail ? <p className="text-[11px] text-[rgb(var(--text-3))]">{detail}</p> : null}</div></div>;
}

function Kpi({ label, value, note, tone = 'cyan' }: { label: string; value: string; note: string; tone?: 'cyan' | 'lime' | 'amber' | 'rose' }) {
  const toneClass = tone === 'cyan' ? 'text-cyan-700 dark:text-cyan-100' : tone === 'lime' ? 'text-[rgb(var(--sa-soft))]' : tone === 'amber' ? 'text-amber-800 dark:text-amber-200' : 'text-rose-700 dark:text-rose-200';
  return <div className="rounded-[18px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card-2))] elev p-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">{label}</p><p className={`mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] ${toneClass}`}>{value}</p><p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">{note}</p></div>;
}

const peopleMeta: Record<ImbaPeopleView, { title: string; description: string }> = {
  people: { title: 'People command center', description: 'A complete workforce layer for a distributed nonprofit: core staff, seasonal crews, contractors, PEO controls, capacity, compliance, and knowledge continuity.' },
  'people-directory': { title: 'Employee + workforce directory', description: 'One roster across core employees, seasonal crews, and contract capacity—with compensation fields limited by role.' },
  'people-reports': { title: 'People reports', description: 'Role-governed workforce reporting for hire dates, employment status, onboarding, position control, and compliance.' },
  'people-payroll': { title: 'PEO + payroll allocation', description: 'Reconcile the PEO settlement to project labor, mission programs, development, and shared services before the close is final.' },
  'people-hiring': { title: 'Hiring + position control', description: 'Open positions only when mission need, executed backlog, cost, and management approval support the decision.' },
  'people-onboarding': { title: 'Onboarding', description: 'Role-specific access, payroll, safety, equipment, policy, and first-30-day readiness for a distributed team.' },
  'people-compliance': { title: 'People compliance', description: 'Standing control calendar for PEO reconciliation, worker classification, authorization, insurance, and field safety.' },
  'people-documents': { title: 'Policies + people documents', description: 'A governed library for current policies, templates, acknowledgments, owners, review dates, and audit evidence.' },
  'people-volunteers': { title: 'Volunteer hub', description: 'Recruit, screen, credential, deploy, and recognize volunteers against chapter, program, and stewardship needs.' },
  'people-training': { title: 'Learning + credentials', description: 'Assign curricula, track safety and role credentials, and prevent deployment when required learning is incomplete.' },
  'people-role-studio': { title: 'Role studio', description: 'Turn an approved position into a clear job description, decision scorecard, outcomes, and onboarding handoff.' },
};

const peopleDocuments = [
  { name: 'Employee handbook', category: 'Policy', owner: 'People Ops', review: 'Jan 2027', status: 'Current', acknowledgments: '31 / 31' },
  { name: 'Remote work + equipment policy', category: 'Policy', owner: 'People Ops + IT', review: 'Oct 2026', status: 'Review due', acknowledgments: '29 / 31' },
  { name: 'Field safety manual', category: 'Safety', owner: 'Trail Solutions', review: 'Aug 2026', status: 'Action', acknowledgments: '18 / 22' },
  { name: 'Contractor engagement checklist', category: 'Template', owner: 'Finance + People', review: 'Dec 2026', status: 'Current', acknowledgments: 'N/A' },
  { name: 'Performance conversation guide', category: 'Management', owner: 'People Ops', review: 'Mar 2027', status: 'Current', acknowledgments: 'N/A' },
  { name: 'Travel and expense policy', category: 'Finance', owner: 'Finance', review: 'Sep 2026', status: 'Review due', acknowledgments: '30 / 31' },
];

type PeopleReportKey = 'hire-dates' | 'workforce-status' | 'onboarding' | 'position-control' | 'compliance';
type ReportRow = Record<string, string>;

const peopleReportDefinitions: Array<{ id: PeopleReportKey; label: string; note: string; cadence: string; columns: string[] }> = [
  { id: 'hire-dates', label: 'Hire dates + tenure', note: 'Start dates, tenure, and source coverage', cadence: 'Monthly', columns: ['Person', 'Role', 'Team', 'Hire date', 'Tenure', 'Source'] },
  { id: 'workforce-status', label: 'Workforce status', note: 'Employment type, location, time zone, status, and allocation', cadence: 'Weekly', columns: ['Person', 'Role', 'Team', 'Worker type', 'Location', 'Time zone', 'Status', 'Allocation'] },
  { id: 'onboarding', label: 'Onboarding readiness', note: 'Starts, progress, owners, and blockers', cadence: 'Weekly', columns: ['Person / role', 'Worker group', 'Start', 'Progress', 'Owner', 'Blocker'] },
  { id: 'position-control', label: 'Hiring + positions', note: 'Approved and backlog-gated openings', cadence: 'Biweekly', columns: ['Position', 'Team', 'Trigger', 'Stage', 'Backlog gate'] },
  { id: 'compliance', label: 'People compliance', note: 'Authorization, payroll, classification, and safety', cadence: 'Weekly', columns: ['Control', 'Scope', 'Due', 'Owner', 'Status'] },
];

function downloadCsv(filename: string, columns: string[], rows: ReportRow[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const csv = [columns.map(escape).join(','), ...rows.map((row) => columns.map((column) => escape(row[column] ?? '')).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ImbaPeopleWorkspace({ view, onNavigate, role }: { view: ImbaPeopleView; onNavigate: (view: ImbaOsView) => void; role: ImbaRoleKey }) {
  const canViewLoadedCost = role === 'executive' || role === 'finance' || role === 'hr';
  const canViewPeopleReports = role === 'executive' || role === 'hr';
  const meta = peopleMeta[view];
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-100">People · operating workspace</p><h2 className="mt-1 text-lg font-semibold text-[rgb(var(--text))]">{meta.title}</h2><p className="mt-1 max-w-4xl text-xs leading-5 text-[rgb(var(--text-3))]">{meta.description}</p></section>
      {view === 'people' ? <PeopleHome onNavigate={onNavigate} canViewLoadedCost={canViewLoadedCost} canViewPeopleReports={canViewPeopleReports} /> : null}
      {view === 'people-directory' ? <DirectoryIntegrated canViewLoadedCost={canViewLoadedCost} /> : null}
      {view === 'people-reports' ? canViewPeopleReports ? <PeopleReports /> : <RestrictedPeopleReports /> : null}
      {view === 'people-payroll' ? <Payroll onNavigate={onNavigate} /> : null}
      {view === 'people-hiring' ? <Hiring /> : null}
      {view === 'people-onboarding' ? <Onboarding /> : null}
      {view === 'people-compliance' ? <Compliance /> : null}
      {view === 'people-documents' ? <ControlledDocuments /> : null}
      {view === 'people-volunteers' ? <VolunteerHub /> : null}
      {view === 'people-training' ? <LearningCredentials /> : null}
      {view === 'people-role-studio' ? <RoleStudio /> : null}
    </div>
  );
}

function PeopleHome({ onNavigate, canViewLoadedCost, canViewPeopleReports }: { onNavigate: (view: ImbaOsView) => void; canViewLoadedCost: boolean; canViewPeopleReports: boolean }) {
  const totalCost = imbaEmployees.reduce((sum, employee) => sum + employee.loadedCost, 0);
  const actionCompliance = imbaCompliance.filter((item) => item.status !== 'Ready').length;
  const launchers: Array<{ title: string; note: string; view: ImbaOsView; icon: typeof Users }> = [
    { title: 'Workforce directory', note: 'Core + seasonal + contractor roster', view: 'people-directory', icon: Users },
    { title: 'Volunteer hub', note: 'Recruit, screen, credential, and deploy', view: 'people-volunteers', icon: Users },
    { title: 'Learning + credentials', note: 'Training, safety, and role readiness', view: 'people-training', icon: FileCheck2 },
    ...(canViewPeopleReports ? [{ title: 'People reports', note: 'Hire dates, status, onboarding, and controls', view: 'people-reports' as ImbaOsView, icon: FileText }] : []),
    { title: 'PEO + payroll allocation', note: 'Labor to projects and functions', view: 'people-payroll', icon: CircleDollarSign },
    { title: 'Hiring + position control', note: 'Backlog and approval gates', view: 'people-hiring', icon: BriefcaseBusiness },
    { title: 'Role studio', note: 'Job descriptions and success scorecards', view: 'people-role-studio', icon: FileText },
    { title: 'Onboarding', note: 'Access, payroll, equipment, safety', view: 'people-onboarding', icon: UserPlus },
    { title: 'Compliance', note: `${actionCompliance} items need attention`, view: 'people-compliance', icon: ShieldCheck },
    { title: 'Policies + documents', note: 'Current versions and attestations', view: 'people-documents', icon: FolderOpen },
  ];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Kpi label="Current staff" value={`${imbaEmployees.length}`} note="From IMBA's public staff roster" /><Kpi label="PEO-leased headcount" value="56" note="All staff leased via PEO — 2024 Form 990 (Sch O)" tone="lime" />{canViewLoadedCost ? <Kpi label="Loaded annual cost" value={money(totalCost)} note="Illustrative planning overlay; ADP is authoritative" /> : <Kpi label="Teams represented" value={`${new Set(imbaEmployees.map((employee) => employee.team)).size}`} note="Compensation is restricted by role" />}<Kpi label="Average allocation" value={`${Math.round(imbaEmployees.reduce((sum, employee) => sum + employee.allocation, 0) / imbaEmployees.length)}%`} note="Project / program-coded time (illustrative)" tone="amber" /><Kpi label="Compliance actions" value={`${actionCompliance}`} note="Authorization, contracts, and safety" tone="rose" /></div>
      <div className="grid gap-5 xl:grid-cols-12">
        <ShellCard className="xl:col-span-8"><Heading eyebrow="People system" title="From employee record to organizational capacity" detail="Six operational workspaces" /><div className="grid gap-3 p-5 md:grid-cols-2">{launchers.map((item) => { const Icon = item.icon; return <button key={item.title} type="button" onClick={() => onNavigate(item.view)} className="group rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.035]"><div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-cyan-300/10 p-2 text-cyan-700 dark:text-cyan-100"><Icon className="h-4 w-4" /></span><ArrowRight className="h-4 w-4 text-[rgb(var(--text-4))] transition group-hover:translate-x-1 group-hover:text-cyan-700 dark:group-hover:text-cyan-100" /></div><h3 className="mt-4 text-sm font-semibold text-[rgb(var(--text))]">{item.title}</h3><p className="mt-1.5 text-[11px] text-[rgb(var(--text-3))]">{item.note}</p></button>; })}</div></ShellCard>
        <ShellCard className="xl:col-span-4"><Heading eyebrow="Workforce signals" title="What leadership needs to act on" /><div className="space-y-3 p-5">{[['Construction', '96%', 'Seasonal field lead near guardrail', 'amber'], ['Design', '91%', 'Use contract bench before permanent hire', 'amber'], ['Programs', '62%', 'Capacity available for member support', 'lime'], ['Development', '44%', 'Campaign operating support available', 'cyan']].map(([team, value, note, tone]) => <div key={team} className="rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-3"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold text-[rgb(var(--text))]">{team}</p><span className={`font-mono text-xs font-semibold ${tone === 'amber' ? 'text-amber-800 dark:text-amber-200' : tone === 'lime' ? 'text-[rgb(var(--sa-soft))]' : 'text-cyan-700 dark:text-cyan-100'}`}>{value}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]"><div className={`h-full rounded-full ${tone === 'amber' ? 'bg-amber-300' : tone === 'lime' ? 'bg-[rgb(var(--sa))]' : 'bg-cyan-300'}`} style={{ width: value }} /></div><p className="mt-2 text-[11px] text-[rgb(var(--text-3))]">{note}</p></div>)}</div></ShellCard>
      </div>
      <div className="grid gap-5 lg:grid-cols-3"><ShellCard><Heading eyebrow="Onboarding" title="Three active workstreams" /><div className="space-y-3 p-5">{imbaOnboarding.map((item) => <div key={item.person}><div className="flex justify-between text-[11px]"><span className="font-semibold text-[rgb(var(--text))]">{item.person}</span><span className="font-mono text-cyan-700 dark:text-cyan-100">{item.progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${item.progress}%` }} /></div></div>)}</div></ShellCard><ShellCard><Heading eyebrow="Position control" title="Hiring gates" /><div className="space-y-3 p-5">{imbaOpenRoles.map((role) => <div key={role.title} className="flex items-center justify-between gap-3"><div><p className="text-[11px] font-semibold text-[rgb(var(--text))]">{role.title}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{role.backlogGate}</p></div><span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${role.stage === 'Gate not met' ? 'bg-amber-300/10 text-amber-800 dark:text-amber-100' : 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]'}`}>{role.stage}</span></div>)}</div></ShellCard><ShellCard><Heading eyebrow="Knowledge continuity" title="Role coverage" /><div className="space-y-3 p-5">{[['Monthly close', 'Primary + backup assigned'], ['Grant draws', 'Backup needs training'], ['Project billing', 'Two-deep coverage'], ['PEO reconciliation', 'Finance owner pending']].map(([process, coverage], index) => <div key={process} className="flex items-start gap-3"><span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${index === 1 || index === 3 ? 'bg-amber-300' : 'bg-[rgb(var(--sa))]'}`} /><div><p className="text-[11px] font-semibold text-[rgb(var(--text))]">{process}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{coverage}</p></div></div>)}</div></ShellCard></div>
    </>
  );
}

function DirectoryIntegrated({ canViewLoadedCost }: { canViewLoadedCost: boolean }) {
  const { getEditedRecord, updateRecord } = useImbaOsState();
  const [selectedId, setSelectedId] = useState(imbaEmployees[0].id);
  const selected = getEditedRecord('employee', selectedId, imbaEmployees.find((employee) => employee.id === selectedId) ?? imbaEmployees[0]);
  return <div className="space-y-4"><div className="grid gap-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 lg:grid-cols-[1fr_1fr_1fr_auto]"><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Worker<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none">{imbaEmployees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Operational allocation<input type="number" min="0" max="100" value={selected.allocation} onChange={(event) => updateRecord('employee', selected.id, { allocation: Number(event.target.value) }, { actor: 'People + Finance', detail: `Updated operational allocation for ${selected.name}; ADP worker record remains authoritative.` })} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none" /></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Capacity status<select value={selected.status} onChange={(event) => updateRecord('employee', selected.id, { status: event.target.value }, { actor: 'People + Finance', detail: `Updated IMBA-OS capacity status for ${selected.name}.` })} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none"><option>Active</option><option>Seasonal</option><option>Available</option><option>Capacity watch</option></select></label><div className="self-end rounded-xl border border-[rgb(var(--line)/0.08)] px-4 py-2.5"><p className="text-[11px] font-black uppercase text-cyan-700 dark:text-cyan-100">Source boundary</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">Identity + pay: ADP<br />Allocation + capacity: IMBA-OS</p></div></div><Directory canViewLoadedCost={canViewLoadedCost} /></div>;
}

function Directory({ canViewLoadedCost }: { canViewLoadedCost: boolean }) {
  const { getEditedRecord } = useImbaOsState();
  const [query, setQuery] = useState('');
  const [team, setTeam] = useState('All teams');
  const employees = imbaEmployees.map((employee) => getEditedRecord('employee', employee.id, employee));
  const teams = ['All teams', ...Array.from(new Set(employees.map((employee) => employee.team)))];
  const rows = employees.filter((employee) => (team === 'All teams' || employee.team === team) && `${employee.name} ${employee.role} ${employee.location} ${communicationTimeZone(employee.location)}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <ShellCard>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Workforce record</p>
          <h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Core, seasonal, and contract capacity</h2>
          <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">Time zones are derived from listed locations; ambiguous or unstated locations require confirmation.</p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.025)] px-3 py-2">
            <Search className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people" className="w-36 bg-transparent text-[11px] text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-4))]" />
          </label>
          <select value={team} onChange={(event) => setTeam(event.target.value)} className="rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2 text-[11px] text-[rgb(var(--text))] outline-none">
            {teams.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className={`w-full ${canViewLoadedCost ? 'min-w-[1100px]' : 'min-w-[960px]'} text-left`}>
          <thead>
            <tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]">
              <th className="px-5 py-3">Person / role</th><th className="px-3 py-3">Team</th><th className="px-3 py-3">Location</th><th className="px-3 py-3">Time zone</th><th className="px-3 py-3">Worker type</th><th className="px-3 py-3 text-right">Allocation</th>{canViewLoadedCost ? <th className="px-3 py-3 text-right">Loaded cost</th> : null}<th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((employee) => (
              <tr key={employee.id} className="border-b border-[rgb(var(--line)/0.055)] last:border-0 hover:bg-[rgb(var(--line)/0.02)]">
                <td className="px-5 py-3.5"><p className="text-xs font-semibold text-[rgb(var(--text))]">{employee.name}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{employee.id} · {employee.role}</p></td>
                <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text))]">{employee.team}</td>
                <td className="px-3 py-3.5"><span className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--text-2))]"><MapPin className="h-3 w-3" />{employee.location}</span></td>
                <td className={`px-3 py-3.5 text-[11px] font-semibold ${communicationTimeZone(employee.location) === 'Needs confirmation' ? 'text-amber-800 dark:text-amber-200' : 'text-cyan-700 dark:text-cyan-100'}`}>{communicationTimeZone(employee.location)}</td>
                <td className="px-3 py-3.5"><span className="rounded-full border border-[rgb(var(--line)/0.08)] px-2 py-1 text-[11px] font-black uppercase text-cyan-700 dark:text-cyan-100">{employee.type}</span></td>
                <td className={`px-3 py-3.5 text-right font-mono text-xs ${employee.allocation > 90 ? 'text-amber-800 dark:text-amber-200' : 'text-[rgb(var(--sa-soft))]'}`}>{employee.allocation}%</td>
                {canViewLoadedCost ? <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(employee.loadedCost)}</td> : null}
                <td className="px-5 py-3.5 text-[11px] text-[rgb(var(--text))]">{employee.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ShellCard>
  );
}

function PeopleReports() {
  const [reportId, setReportId] = useState<PeopleReportKey>('hire-dates');
  const [query, setQuery] = useState('');
  const report = peopleReportDefinitions.find((item) => item.id === reportId) ?? peopleReportDefinitions[0];
  const rows = useMemo<ReportRow[]>(() => {
    if (reportId === 'hire-dates') {
      return imbaEmployees.map((employee) => ({
        Person: employee.name,
        Role: employee.role,
        Team: employee.team,
        'Hire date': 'Awaiting ADP',
        Tenure: 'Not calculated',
        Source: 'ADP required',
      }));
    }
    if (reportId === 'workforce-status') {
      return imbaEmployees.map((employee) => ({
        Person: employee.name,
        Role: employee.role,
        Team: employee.team,
        'Worker type': employee.type,
        Location: employee.location,
        'Time zone': communicationTimeZone(employee.location),
        Status: employee.status,
        Allocation: `${employee.allocation}%`,
      }));
    }
    if (reportId === 'onboarding') {
      return imbaOnboarding.map((item) => ({
        'Person / role': item.person,
        'Worker group': item.role,
        Start: item.start,
        Progress: `${item.progress}%`,
        Owner: item.owner,
        Blocker: item.blockers,
      }));
    }
    if (reportId === 'position-control') {
      return imbaOpenRoles.map((item) => ({
        Position: item.title,
        Team: item.team,
        Trigger: item.trigger,
        Stage: item.stage,
        'Backlog gate': item.backlogGate,
      }));
    }
    return imbaCompliance.map((item) => ({
      Control: item.item,
      Scope: item.scope,
      Due: item.due,
      Owner: item.owner,
      Status: item.status,
    }));
  }, [reportId]);
  const filteredRows = rows.filter((row) => Object.values(row).join(' ').toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Available reports" value={`${peopleReportDefinitions.length}`} note="HR operating report suite" />
        <Kpi label="Hire-date coverage" value={`0 / ${imbaEmployees.length}`} note="Authoritative dates require ADP" tone="amber" />
        <Kpi label="Current staff" value={`${imbaEmployees.length}`} note="Public roster records" tone="lime" />
        <Kpi label="Open controls" value={`${imbaCompliance.filter((item) => item.status !== 'Ready').length}`} note="Watch and action items" tone="rose" />
      </div>
      <div className="grid gap-5 xl:grid-cols-12">
        <ShellCard className="xl:col-span-3">
          <Heading eyebrow="People reporting" title="Report library" detail="HR + executive" />
          <div className="space-y-2 p-3">
            {peopleReportDefinitions.map((item) => (
              <button key={item.id} type="button" onClick={() => setReportId(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${reportId === item.id ? 'border-cyan-300/25 bg-cyan-300/[0.06]' : 'border-[rgb(var(--line)/0.07)] hover:bg-[rgb(var(--line)/0.025)]'}`}>
                <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-[rgb(var(--text))]">{item.label}</p><span className="text-[10px] font-black uppercase text-cyan-700 dark:text-cyan-100">{item.cadence}</span></div>
                <p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">{item.note}</p>
              </button>
            ))}
          </div>
        </ShellCard>
        <ShellCard className="xl:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
            <div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">{report.cadence} report</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{report.label}</h2></div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] px-3 py-2"><Search className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search report" className="w-36 bg-transparent text-[11px] text-[rgb(var(--text))] outline-none" /></label>
              <button type="button" onClick={() => downloadCsv(`imba-${reportId}.csv`, report.columns, filteredRows)} className="flex items-center gap-2 rounded-xl bg-cyan-300 px-3 py-2 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]"><Download className="h-3.5 w-3.5" />Export CSV</button>
            </div>
          </div>
          {reportId === 'hire-dates' ? <div className="border-b border-amber-300/15 bg-amber-300/[0.045] px-5 py-3 text-[11px] leading-5 text-amber-900 dark:text-amber-100"><strong>Authoritative field required.</strong> The public staff roster does not establish employment start dates. Connecting the ADP worker start-date field will populate hire date and calculated tenure without changing this report structure.</div> : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.14em] text-[rgb(var(--text-3))]">{report.columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr></thead>
              <tbody>{filteredRows.map((row, index) => <tr key={`${reportId}-${index}`} className="border-b border-[rgb(var(--line)/0.055)] last:border-0">{report.columns.map((column) => <td key={column} className={`px-4 py-3 text-[11px] ${row[column] === 'Awaiting ADP' ? 'font-semibold text-amber-800 dark:text-amber-200' : 'text-[rgb(var(--text-2))]'}`}>{row[column]}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </ShellCard>
      </div>
    </>
  );
}

function RestrictedPeopleReports() {
  return <ShellCard><div className="flex items-start gap-3 p-5"><ShieldCheck className="mt-0.5 h-5 w-5 text-cyan-700 dark:text-cyan-100" /><div><p className="text-sm font-semibold text-[rgb(var(--text))]">People reports are restricted</p><p className="mt-1 text-[11px] leading-5 text-[rgb(var(--text-3))]">This report center is available to People / HR and executive leadership.</p></div></div></ShellCard>;
}

function Payroll({ onNavigate }: { onNavigate: (view: ImbaOsView) => void }) {
  const { queueSync } = useImbaOsState();
  const [timeBatch, setTimeBatch] = useState('');
  const teams = useMemo(() => Array.from(new Set(imbaEmployees.map((employee) => employee.team))).map((team) => { const members = imbaEmployees.filter((employee) => employee.team === team); return { team, people: members.length, cost: members.reduce((sum, employee) => sum + employee.loadedCost, 0), allocation: Math.round(members.reduce((sum, employee) => sum + employee.allocation, 0) / members.length) }; }), []);
  const totalCost = teams.reduce((sum, row) => sum + row.cost, 0);
  return (
    <><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] px-4 py-3"><div><p className="text-[11px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-100">ADP-approved time interface</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">Activity detail stays in IMBA-OS; only certified payroll time and approved allocation codes are transmitted.</p></div><div className="flex gap-2"><button type="button" onClick={() => setTimeBatch(queueSync({ system: 'adp', action: 'update', recordType: 'Time batch', recordId: `TIME-${Date.now().toString().slice(-5)}`, summary: 'Certified project, grant, and function allocations for current pay period', requiresApproval: true }))} className="rounded-xl bg-cyan-300 px-3 py-2 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Certify time batch</button><ImbaInfoTooltip label="Certify time batch" text="Publishes the certified project / grant / function labor allocations for the current pay period to ADP as an approved time batch. In demo mode it queues an ADP job and records an audit entry — ADP is not changed, and payroll approval is still required before transmit." placement="below" align="left" /><button type="button" onClick={() => onNavigate('integration-sync')} className="rounded-xl border border-[rgb(var(--line)/0.1)] px-3 py-2 text-[11px] font-black uppercase text-[rgb(var(--text))]">Open queue</button></div>{timeBatch ? <p className="w-full text-[11px] font-semibold text-[rgb(var(--sa-soft))]">{timeBatch} is awaiting payroll approval; ADP has not been changed.</p> : null}</div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Modeled loaded payroll" value={money(totalCost)} note="Sample annualized workforce cost" /><Kpi label="Project-coded labor" value="71%" note="Trail Solutions contracts + grants" tone="lime" /><Kpi label="Mission / development" value="18%" note="Programs, chapters, fundraising" /><Kpi label="Shared services" value="11%" note="Management, finance, systems" tone="amber" /></div><div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-8"><Heading eyebrow="Allocation control" title="PEO settlement to project + function" detail="Payroll cannot close until allocation clears" /><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]"><th className="px-5 py-3">Team</th><th className="px-3 py-3 text-right">Workers</th><th className="px-3 py-3 text-right">Loaded annual cost</th><th className="px-3 py-3">Allocation coverage</th><th className="px-5 py-3">Signal</th></tr></thead><tbody>{teams.map((row) => <tr key={row.team} className="border-b border-[rgb(var(--line)/0.055)] last:border-0"><td className="px-5 py-3.5 text-xs font-semibold text-[rgb(var(--text))]">{row.team}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{row.people}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(row.cost)}</td><td className="px-3 py-3.5"><div className="flex items-center gap-2"><div className="h-1.5 w-28 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]"><div className={`h-full rounded-full ${row.allocation > 90 ? 'bg-amber-300' : 'bg-cyan-300'}`} style={{ width: `${row.allocation}%` }} /></div><span className="font-mono text-[11px] text-cyan-700 dark:text-cyan-100">{row.allocation}%</span></div></td><td className="px-5 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{row.allocation > 90 ? 'Capacity watch' : row.allocation < 55 ? 'Available capacity' : 'Within guardrail'}</td></tr>)}</tbody></table></div></ShellCard><ShellCard className="xl:col-span-4"><Heading eyebrow="Payroll close" title="Reconciliation steps" /><div className="space-y-3 p-5">{[['Import PEO payroll journal', 'Complete'], ['Match headcount and gross pay', 'Complete'], ['Resolve missing project time', 'Action'], ['Allocate taxes, benefits, and PEO fee', 'Review'], ['Post functional expense mapping', 'Pending'], ['Certify payroll control total', 'Pending']].map(([step, status]) => <div key={step} className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--line)/0.06)] px-3 py-2.5"><span className="text-[11px] text-[rgb(var(--text-2))]">{step}</span><span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${status === 'Complete' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : status === 'Action' ? 'bg-amber-300/10 text-amber-800 dark:text-amber-100' : 'bg-cyan-300/10 text-cyan-700 dark:text-cyan-100'}`}>{status}</span></div>)}</div></ShellCard></div></>
  );
}

const initialVolunteers = [
  { id: 'VOL-1042', name: 'Maya Thompson', chapter: 'Central Colorado', skills: 'Trail stewardship · Crew lead', clearance: 'Current', assignment: 'Summer stewardship series', hours: 84, status: 'Deployed' },
  { id: 'VOL-1188', name: 'Jordan Lee', chapter: 'Great Lakes', skills: 'Community outreach · Events', clearance: 'Review', assignment: 'Community listening sessions', hours: 31, status: 'Screening' },
  { id: 'VOL-1261', name: 'Sam Rivera', chapter: 'Mid-Atlantic', skills: 'Trail assessment · GIS', clearance: 'Current', assignment: 'Assessment support pool', hours: 56, status: 'Ready' },
  { id: 'VOL-1314', name: 'Avery Brooks', chapter: 'Pacific Northwest', skills: 'Photography · Storytelling', clearance: 'Training due', assignment: 'Impact story capture', hours: 18, status: 'Hold' },
];

function VolunteerHub() {
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [selectedId, setSelectedId] = useState(initialVolunteers[0].id);
  const [query, setQuery] = useState('');
  const selected = volunteers.find((item) => item.id === selectedId) ?? volunteers[0];
  const rows = volunteers.filter((item) => `${item.name} ${item.chapter} ${item.skills} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  const updateStatus = (status: string) => setVolunteers((current) => current.map((item) => item.id === selected.id ? { ...item, status } : item));
  return <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Active volunteers" value="1,284" note="Illustrative national + local rollup" /><Kpi label="Ready to deploy" value={`${volunteers.filter((item) => ['Ready', 'Deployed'].includes(item.status)).length}`} note="Representative records below" tone="lime" /><Kpi label="Screening / training" value={`${volunteers.filter((item) => ['Screening', 'Hold'].includes(item.status)).length}`} note="Blocked from assignment" tone="amber" /><Kpi label="Service hours" value={`${volunteers.reduce((sum, item) => sum + item.hours, 0)}`} note="Representative cohort" /></div><div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-8"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Volunteer registry</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">People, credentials, and assignments</h2></div><label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] px-3 py-2"><Search className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search volunteers" className="w-40 bg-transparent text-[11px] text-[rgb(var(--text))] outline-none" /></label></div><div className="divide-y divide-[rgb(var(--line)/0.06)]">{rows.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`grid w-full gap-3 px-5 py-4 text-left md:grid-cols-[1.2fr_1fr_1fr_auto] ${selected.id === item.id ? 'bg-cyan-300/[0.04]' : 'hover:bg-[rgb(var(--line)/0.02)]'}`}><div><p className="text-xs font-semibold text-[rgb(var(--text))]">{item.name}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{item.id} · {item.chapter}</p></div><p className="text-[11px] text-[rgb(var(--text-2))]">{item.skills}</p><div><p className="text-[11px] text-[rgb(var(--text-2))]">{item.assignment}</p><p className="mt-1 font-mono text-[11px] text-cyan-700 dark:text-cyan-100">{item.hours} hours</p></div><span className="self-center rounded-full bg-cyan-300/10 px-2 py-1 text-[11px] font-black uppercase text-cyan-700 dark:text-cyan-100">{item.status}</span></button>)}</div></ShellCard><ShellCard className="xl:col-span-4"><Heading eyebrow={`Selected · ${selected.id}`} title={selected.name} detail={selected.chapter} /><div className="space-y-4 p-5"><div className="rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4"><p className="text-[11px] font-black uppercase text-[rgb(var(--text-4))]">Deployment gate</p><p className="mt-2 text-sm font-semibold text-[rgb(var(--text))]">{selected.clearance}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">Screening, waiver, safety learning, and role credential must be current.</p></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => updateStatus('Ready')} className="rounded-xl bg-cyan-300 px-3 py-3 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Mark ready</button><button type="button" onClick={() => updateStatus('Hold')} className="rounded-xl border border-[rgb(var(--line)/0.09)] px-3 py-3 text-[11px] font-black uppercase text-[rgb(var(--text))]">Place hold</button></div></div></ShellCard></div></>;
}

const learningTracks = [
  { id: 'TRN-01', name: 'Field safety + incident response', audience: 'Trail crews + volunteers', completion: 82, due: 'Before deployment', owner: 'Trail Solutions', credential: 'Annual' },
  { id: 'TRN-04', name: 'Community engagement standard', audience: 'Programs + chapter leaders', completion: 71, due: 'Aug 15', owner: 'Local Programs', credential: 'Two years' },
  { id: 'TRN-07', name: 'Grant restriction + time coding', audience: 'Program + project owners', completion: 64, due: 'Jul 31', owner: 'Finance', credential: 'Annual' },
  { id: 'TRN-11', name: 'Manager decision + documentation', audience: 'People managers', completion: 88, due: 'Sep 1', owner: 'People Ops', credential: 'Annual' },
];

function LearningCredentials() {
  const [completion, setCompletion] = useState<Record<string, number>>({});
  return <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Required tracks" value={`${learningTracks.length}`} note="Representative learning catalog" /><Kpi label="Average completion" value={`${Math.round(learningTracks.reduce((sum, item) => sum + (completion[item.id] ?? item.completion), 0) / learningTracks.length)}%`} note="Assigned cohort progress" tone="lime" /><Kpi label="Deployment blocks" value="2" note="Safety or credential incomplete" tone="rose" /><Kpi label="Renewals due" value="6" note="Next 60 days" tone="amber" /></div><div className="grid gap-4">{learningTracks.map((track) => { const progress = completion[track.id] ?? track.completion; return <ShellCard key={track.id}><div className="grid gap-5 p-5 lg:grid-cols-[1.3fr_1fr_1fr_auto]"><div><p className="text-[11px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-100">{track.id} · {track.credential}</p><h3 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{track.name}</h3><p className="mt-2 text-[11px] text-[rgb(var(--text-3))]">{track.audience}</p></div><div><p className="text-[11px] font-black uppercase text-[rgb(var(--text-4))]">Cohort completion</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${progress}%` }} /></div><p className="mt-2 font-mono text-xs text-cyan-700 dark:text-cyan-100">{progress}%</p></div><div><p className="text-[11px] font-black uppercase text-[rgb(var(--text-4))]">Owner / due</p><p className="mt-2 text-xs font-semibold text-[rgb(var(--text))]">{track.owner}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{track.due}</p></div><button type="button" onClick={() => setCompletion((current) => ({ ...current, [track.id]: Math.min(100, progress + 8) }))} className="self-center rounded-xl bg-cyan-300 px-4 py-3 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Record completions</button></div></ShellCard>; })}</div></>;
}

function RoleStudio() {
  const [title, setTitle] = useState('Regional Trail Solutions Manager');
  const [team, setTeam] = useState('Trail Solutions');
  const [outcome, setOutcome] = useState('Deliver a healthy regional project portfolio with safe crews, accepted milestones, timely billing, and forecast contribution inside approved guardrails.');
  const [draft, setDraft] = useState('');
  const createDraft = () => setDraft(`${title}\n\nPurpose\n${outcome}\n\nFirst-year outcomes\n• Own scope, schedule, safety, estimate-to-complete, and client acceptance across the assigned portfolio.\n• Keep forecast contribution and billing milestones inside approved guardrails.\n• Maintain two-deep operating coverage and current role runbooks.\n\nDecision scorecard\nMission delivery · Financial stewardship · Team leadership · Operating discipline\n\nReports to\nDirector of ${team}`);
  return <div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-5"><Heading eyebrow="Controlled role design" title="Create a role brief" detail="Illustrative draft builder" /><div className="space-y-4 p-5"><label className="block text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Role title<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs normal-case text-[rgb(var(--text))] outline-none" /></label><label className="block text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Team<input value={team} onChange={(event) => setTeam(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs normal-case text-[rgb(var(--text))] outline-none" /></label><label className="block text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Primary outcome<textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} rows={5} className="mt-1.5 w-full resize-none rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs normal-case leading-5 text-[rgb(var(--text))] outline-none" /></label><button type="button" onClick={createDraft} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Create structured draft</button></div></ShellCard><ShellCard className="xl:col-span-7"><Heading eyebrow="Role brief output" title={draft ? title : 'Complete the role inputs'} detail={draft ? 'Editable working draft' : 'No draft yet'} /><div className="p-5">{draft ? <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={19} className="w-full resize-y rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.02)] p-4 text-xs leading-6 text-[rgb(var(--text-2))] outline-none" /> : <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--line)/0.12)] text-center text-xs text-[rgb(var(--text-3))]">The role brief, first-year outcomes, and decision scorecard appear here.</div>}</div></ShellCard></div>;
}

function Hiring() {
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  return <><div className="grid gap-3 sm:grid-cols-3"><Kpi label="Controlled positions" value={`${imbaOpenRoles.length}`} note="Approved and conditional roles" /><Kpi label="Annual cost if all open" value={money(imbaOpenRoles.reduce((sum, role) => sum + role.annualCost, 0))} note="Fully loaded decision exposure" tone="amber" /><Kpi label="Backlog-gated roles" value="2" note="Only open when executed work supports cost" tone="lime" /></div><div className="grid gap-4">{imbaOpenRoles.map((role) => <ShellCard key={role.title}><div className="grid gap-5 p-5 lg:grid-cols-[1.2fr_1fr_1fr_auto]"><div><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">{role.team}</p><h3 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{role.title}</h3><p className="mt-2 text-[11px] text-[rgb(var(--text-3))]">Trigger: {role.trigger}</p></div><div><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Annual loaded cost</p><p className="mt-2 font-mono text-xl font-semibold text-cyan-700 dark:text-cyan-100">{money(role.annualCost)}</p></div><div><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Control gate</p><p className="mt-2 text-xs font-semibold text-[rgb(var(--text))]">{role.backlogGate}</p><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-black uppercase ${role.stage === 'Gate not met' ? 'bg-amber-300/10 text-amber-800 dark:text-amber-100' : 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]'}`}>{decisions[role.title] ?? role.stage}</span></div><div className="flex flex-col justify-center gap-2"><button type="button" onClick={() => setDecisions((current) => ({ ...current, [role.title]: 'Advance approved' }))} className="rounded-xl bg-[rgb(var(--sa))] px-4 py-2.5 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Advance</button><button type="button" onClick={() => setDecisions((current) => ({ ...current, [role.title]: 'Held at gate' }))} className="rounded-xl border border-[rgb(var(--line)/0.09)] px-4 py-2.5 text-[11px] font-black uppercase text-[rgb(var(--text))]">Hold</button></div></div></ShellCard>)}</div></>;
}

function Onboarding() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  return <div className="grid gap-5 xl:grid-cols-3">{imbaOnboarding.map((item) => { const tasks = ['PEO + payroll profile', 'Identity + system access', 'Role runbook + 30-day outcomes', item.role === 'Construction' ? 'Safety + equipment certification' : 'Policy acknowledgments']; return <ShellCard key={item.person}><Heading eyebrow={`${item.start} · owner ${item.owner}`} title={item.person} detail={`${item.progress}% ready`} /><div className="p-5"><div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${item.progress}%` }} /></div><p className="mt-3 rounded-xl border border-amber-300/10 bg-amber-300/[0.04] px-3 py-2 text-[11px] text-amber-800 dark:text-amber-100">Blocker: {item.blockers}</p><div className="mt-4 space-y-2">{tasks.map((task, index) => { const key = `${item.person}-${task}`; const done = completed[key] ?? index < 2; return <button key={task} type="button" onClick={() => setCompleted((current) => ({ ...current, [key]: !done }))} className="flex w-full items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.06)] px-3 py-2.5 text-left"><span className={`flex h-4 w-4 items-center justify-center rounded ${done ? 'bg-[rgb(var(--sa))] text-[rgb(var(--sa-ink))]' : 'border border-[rgb(var(--line)/0.15)]'}`}>{done ? <Check className="h-3 w-3" /> : null}</span><span className={`text-[11px] ${done ? 'text-[rgb(var(--text))]' : 'text-[rgb(var(--text-3))]'}`}>{task}</span></button>; })}</div></div></ShellCard>; })}</div>;
}

function Compliance() {
  const [filter, setFilter] = useState('All');
  const rows = filter === 'All' ? imbaCompliance : imbaCompliance.filter((item) => item.status === filter);
  return <><div className="grid gap-3 sm:grid-cols-3"><Kpi label="Standing controls" value={`${imbaCompliance.length}`} note="Recurring people and field controls" /><Kpi label="Ready" value={`${imbaCompliance.filter((item) => item.status === 'Ready').length}`} note="Evidence current" tone="lime" /><Kpi label="Action / watch" value={`${imbaCompliance.filter((item) => item.status !== 'Ready').length}`} note="Needs owner follow-through" tone="amber" /></div><ShellCard><div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Compliance register</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">People, payroll, classification, and safety</h2></div><div className="flex gap-1">{['All', 'Ready', 'Watch', 'Action'].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-[11px] font-black ${filter === item ? 'bg-cyan-300 text-[rgb(var(--sa-ink))]' : 'border border-[rgb(var(--line)/0.08)] text-[rgb(var(--text-2))]'}`}>{item}</button>)}</div></div><div className="divide-y divide-[rgb(var(--line)/0.06)]">{rows.map((item) => <div key={item.item} className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"><div><p className="text-xs font-semibold text-[rgb(var(--text))]">{item.item}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{item.scope}</p></div><div><p className="text-[11px] font-black uppercase text-[rgb(var(--text-4))]">Due</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">{item.due}</p></div><div><p className="text-[11px] font-black uppercase text-[rgb(var(--text-4))]">Owner</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">{item.owner}</p></div><div><p className="text-[11px] font-black uppercase text-[rgb(var(--text-4))]">Evidence</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">Linked control record</p></div><span className={`self-center rounded-full px-2 py-1 text-[11px] font-black uppercase ${item.status === 'Ready' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : item.status === 'Watch' ? 'bg-amber-300/10 text-amber-800 dark:text-amber-100' : 'bg-rose-300/10 text-rose-700 dark:text-rose-100'}`}>{item.status}</span></div>)}</div></ShellCard></>;
}

function ControlledDocuments() {
  const [selected, setSelected] = useState(peopleDocuments[0]);
  const [previewOpen, setPreviewOpen] = useState(false);
  return <div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-8"><Heading eyebrow="Document library" title="Policies, templates, and acknowledgments" detail={`${peopleDocuments.length} controlled records`} /><div className="divide-y divide-[rgb(var(--line)/0.06)]">{peopleDocuments.map((document) => <button key={document.name} type="button" onClick={() => { setSelected(document); setPreviewOpen(false); }} className={`grid w-full gap-3 px-5 py-4 text-left md:grid-cols-[1.5fr_1fr_1fr_auto] ${selected.name === document.name ? 'bg-cyan-300/[0.04]' : 'hover:bg-[rgb(var(--line)/0.02)]'}`}><div><p className="text-xs font-semibold text-[rgb(var(--text))]">{document.name}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{document.category}</p></div><p className="self-center text-[11px] text-[rgb(var(--text-2))]">{document.owner}</p><p className="self-center text-[11px] text-[rgb(var(--text-2))]">Review {document.review}</p><span className="self-center rounded-full bg-cyan-300/10 px-2 py-1 text-[11px] font-black uppercase text-cyan-700 dark:text-cyan-100">{document.status}</span></button>)}</div></ShellCard><ShellCard className="xl:col-span-4"><Heading eyebrow="Selected control document" title={selected.name} detail={selected.category} /><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3"><Kpi label="Owner" value={selected.owner.split(' ')[0]} note={selected.owner} /><Kpi label="Acknowledged" value={selected.acknowledgments} note="Assigned workforce" tone={selected.status === 'Current' ? 'lime' : 'amber'} /></div><button type="button" onClick={() => setPreviewOpen(true)} className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Open controlled preview</button>{previewOpen ? <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4"><p className="text-[11px] font-black uppercase text-cyan-700 dark:text-cyan-100">Governed record preview</p><div className="mt-3 space-y-2 text-[11px] text-[rgb(var(--text-2))]"><p><strong>Current owner:</strong> {selected.owner}</p><p><strong>Next review:</strong> {selected.review}</p><p><strong>Acknowledgments:</strong> {selected.acknowledgments}</p><p><strong>Control state:</strong> {selected.status}</p></div><p className="mt-3 border-t border-[rgb(var(--line)/0.07)] pt-3 text-[11px] leading-5 text-[rgb(var(--text-3))]">This demo dataset includes the governed metadata and acknowledgment evidence, not the source-file contents.</p></div> : null}</div></ShellCard></div>;
}

// Legacy prototype renderer retained temporarily for data-layout reference.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Documents() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(peopleDocuments[0]);
  const [openNote, setOpenNote] = useState('');
  const rows = peopleDocuments.filter((document) => `${document.name} ${document.category} ${document.owner}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-8"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Document library</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Policies, templates, and acknowledgments</h2></div><label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.025)] px-3 py-2"><Search className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents" className="w-40 bg-transparent text-[11px] text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-4))]" /></label></div><div className="divide-y divide-[rgb(var(--line)/0.06)]">{rows.map((document) => <button key={document.name} type="button" onClick={() => { setSelected(document); setOpenNote(''); }} className={`grid w-full gap-3 px-5 py-4 text-left transition md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] ${selected.name === document.name ? 'bg-cyan-300/[0.035]' : 'hover:bg-[rgb(var(--line)/0.02)]'}`}><div className="flex items-center gap-3"><span className="rounded-xl bg-cyan-300/10 p-2 text-cyan-700 dark:text-cyan-100"><FileText className="h-4 w-4" /></span><div><p className="text-xs font-semibold text-[rgb(var(--text))]">{document.name}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{document.category}</p></div></div><span className="self-center text-[11px] text-[rgb(var(--text-2))]">{document.owner}</span><span className="self-center text-[11px] text-[rgb(var(--text-2))]">Review {document.review}</span><span className="self-center font-mono text-[11px] text-cyan-700 dark:text-cyan-100">{document.acknowledgments}</span><span className={`self-center rounded-full px-2 py-1 text-[11px] font-black uppercase ${document.status === 'Current' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : document.status === 'Action' ? 'bg-rose-300/10 text-rose-700 dark:text-rose-100' : 'bg-amber-300/10 text-amber-800 dark:text-amber-100'}`}>{document.status}</span></button>)}</div></ShellCard><ShellCard className="xl:col-span-4"><Heading eyebrow="Selected control document" title={selected.name} /><div className="space-y-4 p-5"><div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.02)]"><FileCheck2 className="h-9 w-9 text-cyan-700 dark:text-cyan-100" /></div><div className="grid grid-cols-2 gap-3"><Kpi label="Owner" value={selected.owner.split(' ')[0]} note={selected.owner} /><Kpi label="Acknowledged" value={selected.acknowledgments} note="Assigned workforce" tone={selected.status === 'Current' ? 'lime' : 'amber'} /></div><div className="space-y-2">{['Version history retained', 'Owner and next review assigned', 'Acknowledgment evidence linked', 'Prior version archived'].map((item) => <div key={item} className="flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]"><BadgeCheck className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-100" />{item}</div>)}</div><div className="flex items-center gap-2"><button type="button" onClick={() => setOpenNote(`Demo: ${selected.name} would open from the versioned controlled store; the file itself is not bundled with this prototype.`)} className="w-full flex-1 rounded-xl bg-cyan-300 px-4 py-3 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Open controlled document</button><ImbaInfoTooltip label="Open controlled document · demo" text="In production this opens the current version of the source document from the controlled store, with version history and acknowledgment evidence attached. The prototype does not bundle the documents themselves." /></div>{openNote ? <p className="flex items-center gap-2 text-[11px] text-cyan-700 dark:text-cyan-100"><BadgeCheck className="h-3.5 w-3.5" />{openNote}</p> : null}</div></ShellCard></div>;
}
