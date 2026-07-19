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

export type ImbaPeopleView =
  | 'people'
  | 'people-directory'
  | 'people-reports'
  | 'people-payroll'
  | 'people-hiring'
  | 'people-onboarding'
  | 'people-compliance'
  | 'people-documents';

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
  return <section className={`rounded-[22px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card)/90%)] ${className}`}>{children}</section>;
}

function Heading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return <div className="border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">{eyebrow}</p><div className="mt-1 flex flex-wrap items-end justify-between gap-2"><h2 className="text-base font-semibold text-[rgb(var(--text))]">{title}</h2>{detail ? <p className="text-[11px] text-[rgb(var(--text-3))]">{detail}</p> : null}</div></div>;
}

function Kpi({ label, value, note, tone = 'cyan' }: { label: string; value: string; note: string; tone?: 'cyan' | 'lime' | 'amber' | 'rose' }) {
  const toneClass = tone === 'cyan' ? 'text-cyan-700 dark:text-cyan-100' : tone === 'lime' ? 'text-[rgb(var(--sa-soft))]' : tone === 'amber' ? 'text-amber-800 dark:text-amber-200' : 'text-rose-700 dark:text-rose-200';
  return <div className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">{label}</p><p className={`mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] ${toneClass}`}>{value}</p><p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">{note}</p></div>;
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
  return (
    <div className="space-y-5">
      {view === 'people' ? <PeopleHome onNavigate={onNavigate} canViewLoadedCost={canViewLoadedCost} canViewPeopleReports={canViewPeopleReports} /> : null}
      {view === 'people-directory' ? <DirectoryIntegrated canViewLoadedCost={canViewLoadedCost} /> : null}
      {view === 'people-reports' ? canViewPeopleReports ? <PeopleReports /> : <RestrictedPeopleReports /> : null}
      {view === 'people-payroll' ? <Payroll onNavigate={onNavigate} /> : null}
      {view === 'people-hiring' ? <Hiring /> : null}
      {view === 'people-onboarding' ? <Onboarding /> : null}
      {view === 'people-compliance' ? <Compliance /> : null}
      {view === 'people-documents' ? <Documents /> : null}
    </div>
  );
}

function PeopleHome({ onNavigate, canViewLoadedCost, canViewPeopleReports }: { onNavigate: (view: ImbaOsView) => void; canViewLoadedCost: boolean; canViewPeopleReports: boolean }) {
  const totalCost = imbaEmployees.reduce((sum, employee) => sum + employee.loadedCost, 0);
  const actionCompliance = imbaCompliance.filter((item) => item.status !== 'Ready').length;
  const launchers: Array<{ title: string; note: string; view: ImbaOsView; icon: typeof Users }> = [
    { title: 'Workforce directory', note: 'Core + seasonal + contractor roster', view: 'people-directory', icon: Users },
    ...(canViewPeopleReports ? [{ title: 'People reports', note: 'Hire dates, status, onboarding, and controls', view: 'people-reports' as ImbaOsView, icon: FileText }] : []),
    { title: 'PEO + payroll allocation', note: 'Labor to projects and functions', view: 'people-payroll', icon: CircleDollarSign },
    { title: 'Hiring + position control', note: 'Backlog and approval gates', view: 'people-hiring', icon: BriefcaseBusiness },
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
    <><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] px-4 py-3"><div><p className="text-[11px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-100">ADP-approved time interface</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">Activity detail stays in IMBA-OS; only certified payroll time and approved allocation codes are transmitted.</p></div><div className="flex gap-2"><button type="button" onClick={() => setTimeBatch(queueSync({ system: 'adp', action: 'update', recordType: 'Time batch', recordId: `TIME-${Date.now().toString().slice(-5)}`, summary: 'Certified project, grant, and function allocations for current pay period', requiresApproval: true }))} className="rounded-xl bg-cyan-300 px-3 py-2 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Certify time batch</button><button type="button" onClick={() => onNavigate('integration-sync')} className="rounded-xl border border-[rgb(var(--line)/0.1)] px-3 py-2 text-[11px] font-black uppercase text-[rgb(var(--text))]">Open queue</button></div>{timeBatch ? <p className="w-full text-[11px] font-semibold text-[rgb(var(--sa-soft))]">{timeBatch} is awaiting payroll approval; ADP has not been changed.</p> : null}</div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Modeled loaded payroll" value={money(totalCost)} note="Sample annualized workforce cost" /><Kpi label="Project-coded labor" value="71%" note="Trail Solutions contracts + grants" tone="lime" /><Kpi label="Mission / development" value="18%" note="Programs, chapters, fundraising" /><Kpi label="Shared services" value="11%" note="Management, finance, systems" tone="amber" /></div><div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-8"><Heading eyebrow="Allocation control" title="PEO settlement to project + function" detail="Payroll cannot close until allocation clears" /><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]"><th className="px-5 py-3">Team</th><th className="px-3 py-3 text-right">Workers</th><th className="px-3 py-3 text-right">Loaded annual cost</th><th className="px-3 py-3">Allocation coverage</th><th className="px-5 py-3">Signal</th></tr></thead><tbody>{teams.map((row) => <tr key={row.team} className="border-b border-[rgb(var(--line)/0.055)] last:border-0"><td className="px-5 py-3.5 text-xs font-semibold text-[rgb(var(--text))]">{row.team}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{row.people}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(row.cost)}</td><td className="px-3 py-3.5"><div className="flex items-center gap-2"><div className="h-1.5 w-28 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]"><div className={`h-full rounded-full ${row.allocation > 90 ? 'bg-amber-300' : 'bg-cyan-300'}`} style={{ width: `${row.allocation}%` }} /></div><span className="font-mono text-[11px] text-cyan-700 dark:text-cyan-100">{row.allocation}%</span></div></td><td className="px-5 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{row.allocation > 90 ? 'Capacity watch' : row.allocation < 55 ? 'Available capacity' : 'Within guardrail'}</td></tr>)}</tbody></table></div></ShellCard><ShellCard className="xl:col-span-4"><Heading eyebrow="Payroll close" title="Reconciliation steps" /><div className="space-y-3 p-5">{[['Import PEO payroll journal', 'Complete'], ['Match headcount and gross pay', 'Complete'], ['Resolve missing project time', 'Action'], ['Allocate taxes, benefits, and PEO fee', 'Review'], ['Post functional expense mapping', 'Pending'], ['Certify payroll control total', 'Pending']].map(([step, status]) => <div key={step} className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--line)/0.06)] px-3 py-2.5"><span className="text-[11px] text-[rgb(var(--text-2))]">{step}</span><span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${status === 'Complete' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : status === 'Action' ? 'bg-amber-300/10 text-amber-800 dark:text-amber-100' : 'bg-cyan-300/10 text-cyan-700 dark:text-cyan-100'}`}>{status}</span></div>)}</div></ShellCard></div></>
  );
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

function Documents() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(peopleDocuments[0]);
  const rows = peopleDocuments.filter((document) => `${document.name} ${document.category} ${document.owner}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-8"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Document library</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Policies, templates, and acknowledgments</h2></div><label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.025)] px-3 py-2"><Search className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents" className="w-40 bg-transparent text-[11px] text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-4))]" /></label></div><div className="divide-y divide-[rgb(var(--line)/0.06)]">{rows.map((document) => <button key={document.name} type="button" onClick={() => setSelected(document)} className={`grid w-full gap-3 px-5 py-4 text-left transition md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] ${selected.name === document.name ? 'bg-cyan-300/[0.035]' : 'hover:bg-[rgb(var(--line)/0.02)]'}`}><div className="flex items-center gap-3"><span className="rounded-xl bg-cyan-300/10 p-2 text-cyan-700 dark:text-cyan-100"><FileText className="h-4 w-4" /></span><div><p className="text-xs font-semibold text-[rgb(var(--text))]">{document.name}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{document.category}</p></div></div><span className="self-center text-[11px] text-[rgb(var(--text-2))]">{document.owner}</span><span className="self-center text-[11px] text-[rgb(var(--text-2))]">Review {document.review}</span><span className="self-center font-mono text-[11px] text-cyan-700 dark:text-cyan-100">{document.acknowledgments}</span><span className={`self-center rounded-full px-2 py-1 text-[11px] font-black uppercase ${document.status === 'Current' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : document.status === 'Action' ? 'bg-rose-300/10 text-rose-700 dark:text-rose-100' : 'bg-amber-300/10 text-amber-800 dark:text-amber-100'}`}>{document.status}</span></button>)}</div></ShellCard><ShellCard className="xl:col-span-4"><Heading eyebrow="Selected control document" title={selected.name} /><div className="space-y-4 p-5"><div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.02)]"><FileCheck2 className="h-9 w-9 text-cyan-700 dark:text-cyan-100" /></div><div className="grid grid-cols-2 gap-3"><Kpi label="Owner" value={selected.owner.split(' ')[0]} note={selected.owner} /><Kpi label="Acknowledged" value={selected.acknowledgments} note="Assigned workforce" tone={selected.status === 'Current' ? 'lime' : 'amber'} /></div><div className="space-y-2">{['Version history retained', 'Owner and next review assigned', 'Acknowledgment evidence linked', 'Prior version archived'].map((item) => <div key={item} className="flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]"><BadgeCheck className="h-3.5 w-3.5 text-cyan-700 dark:text-cyan-100" />{item}</div>)}</div><button type="button" className="w-full rounded-xl bg-cyan-300 px-4 py-3 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Open controlled document</button></div></ShellCard></div>;
}
