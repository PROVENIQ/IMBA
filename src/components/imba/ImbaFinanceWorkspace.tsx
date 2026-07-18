'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Check,
  ClipboardCheck,
  Download,
  Eye,
  FileBarChart,
  Landmark,
  PieChart,
  Receipt,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  imbaBudgetRows,
  imbaGrants,
  imbaPayables,
  imbaReceivables,
  imbaReports,
} from '@/lib/imba-detail-data';
import type { ImbaOsView } from '@/lib/imba-os-data';
import { useImbaOsState } from '@/components/imba/ImbaOsState';
import { ImbaPayables } from '@/components/imba/ImbaPayables';
import { ImbaStatements } from '@/components/imba/ImbaStatements';

export type ImbaFinanceView =
  | 'finance-snapshot'
  | 'finance-calendar'
  | 'finance-coa'
  | 'finance-budget'
  | 'finance-grants'
  | 'finance-payables'
  | 'finance-ap-ar'
  | 'finance-reports'
  | 'finance-transactions';

function money(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${sign}$${(absolute / 1_000_000).toFixed(2).replace(/0$/, '').replace(/\.0$/, '')}M`;
  if (absolute >= 1_000) return `${sign}$${Math.round(absolute / 1_000)}K`;
  return `${sign}$${absolute.toFixed(0)}`;
}

function ShellCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90 ${className}`}>{children}</section>;
}

function Heading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="border-b border-white/[0.07] px-5 py-4">
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#718981]">{eyebrow}</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {detail ? <p className="text-[10px] text-[#738a82]">{detail}</p> : null}
      </div>
    </div>
  );
}

function Kpi({ label, value, note, tone = 'lime' }: { label: string; value: string; note: string; tone?: 'lime' | 'teal' | 'amber' | 'rose' }) {
  const toneClass = tone === 'lime' ? 'text-[#dff7a8]' : tone === 'teal' ? 'text-[#9fd6cc]' : tone === 'amber' ? 'text-amber-200' : 'text-rose-200';
  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-[#142321] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#718981]">{label}</p>
      <p className={`mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] ${toneClass}`}>{value}</p>
      <p className="mt-1.5 text-[10px] leading-4 text-[#81978f]">{note}</p>
    </div>
  );
}

const viewMeta: Record<ImbaFinanceView, { eyebrow: string; title: string; description: string }> = {
  'finance-snapshot': { eyebrow: 'Money · command center', title: 'Company snapshot', description: 'The accounting, liquidity, budget, grants, and working-capital picture in one finance home.' },
  'finance-calendar': { eyebrow: 'Money · control calendar', title: 'Finance calendar', description: 'Close, payroll, billing, grant, chapter settlement, audit, filing, and Board deadlines in one owned schedule.' },
  'finance-coa': { eyebrow: 'Money · data standard', title: 'Canonical chart of accounts', description: 'One reporting vocabulary across IMBA, Trail Solutions projects, restricted funds, and chapter submissions.' },
  'finance-budget': { eyebrow: 'Money · planning', title: 'Budget + forecast', description: 'Plan, actual, variance, and expected year-end result by IMBA revenue engine and cost center.' },
  'finance-grants': { eyebrow: 'Money · restricted funds', title: 'Grant tracking', description: 'Award-to-close lifecycle: restrictions, allowable spend, draws, deadlines, and remaining capacity.' },
  'finance-payables': { eyebrow: 'Money · approve & pay', title: 'Accounts payable', description: 'View the invoice, route by threshold, and Approve & Pay / Hold / Reject — the payment executes in Bill.com via API.' },
  'finance-ap-ar': { eyebrow: 'Money · collections', title: 'Accounts receivable', description: 'Open invoices, unbilled milestones, aging, and collection follow-ups. Vendor bills and approvals live in Accounts payable.' },
  'finance-reports': { eyebrow: 'Money · reporting library', title: 'Reports', description: 'A governed catalog for leadership, Board, project accounting, treasury, grants, and compliance.' },
  'finance-transactions': { eyebrow: 'Money · transaction control', title: 'Bills + invoices', description: 'Controlled entry for vendor bills, client invoices, chapter obligations, project milestones, and coding evidence.' },
};

export function ImbaFinanceWorkspace({ view, onNavigate }: { view: ImbaFinanceView; onNavigate: (view: ImbaOsView) => void }) {
  const meta = viewMeta[view];
  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-emerald-400/20 bg-[linear-gradient(120deg,rgba(52,211,153,.09),rgba(255,255,255,.018))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-emerald-200/70">{meta.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{meta.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#a5b7b1]">{meta.description}</p>
          </div>
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-amber-100">Demo operating data</p>
            <p className="mt-1 text-[10px] text-[#9caaa6]">Structure is production-minded; current-period values are illustrative.</p>
          </div>
        </div>
      </section>
      {view === 'finance-snapshot' ? <Snapshot onNavigate={onNavigate} /> : null}
      {view === 'finance-calendar' ? <FinanceCalendar /> : null}
      {view === 'finance-coa' ? <ChartOfAccounts /> : null}
      {view === 'finance-budget' ? <Budget /> : null}
      {view === 'finance-grants' ? <GrantsIntegrated onNavigate={onNavigate} /> : null}
      {view === 'finance-payables' ? <ImbaPayables /> : null}
      {view === 'finance-ap-ar' ? <ApAr /> : null}
      {view === 'finance-reports' ? <ImbaStatements /> : null}
      {view === 'finance-transactions' ? <TransactionsIntegrated onNavigate={onNavigate} /> : null}
    </div>
  );
}

function FinanceCalendar() {
  const calendar = [
    { date: 'Jul 18', item: 'Project estimates to complete due', owner: 'Project leads', type: 'Close', status: 'Action' },
    { date: 'Jul 19', item: 'PEO payroll settlement + labor allocation', owner: 'Finance + People', type: 'Payroll', status: 'In progress' },
    { date: 'Jul 22', item: 'June monthly close certification', owner: 'Finance', type: 'Close', status: 'On track' },
    { date: 'Jul 24', item: 'Equipment invoice decision', owner: 'Kent', type: 'Payable', status: 'Decision' },
    { date: 'Jul 31', item: 'Federal reimbursement package', owner: 'Finance + program', type: 'Grant', status: 'Action' },
    { date: 'Aug 05', item: 'Chapter settlement cycle locked', owner: 'Finance', type: 'Chapter', status: 'Scheduled' },
    { date: 'Aug 10', item: 'Chapter reporting packets due', owner: 'Chapter treasurers', type: 'Network', status: 'Scheduled' },
    { date: 'Aug 15', item: 'CEO + Board finance packet', owner: 'Finance Director', type: 'Reporting', status: 'Scheduled' },
  ];
  return <div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-8"><Heading eyebrow="Owned financial rhythm" title="Upcoming deadlines + transaction events" detail="Close · cash · grants · chapters" /><div className="divide-y divide-white/[0.06]">{calendar.map((event) => <div key={`${event.date}-${event.item}`} className="grid gap-3 px-5 py-4 sm:grid-cols-[72px_1.4fr_1fr_.7fr_auto]"><span className="font-mono text-xs font-semibold text-emerald-200">{event.date}</span><div><p className="text-xs font-semibold text-white">{event.item}</p><p className="mt-1 text-[9px] text-[#718981]">{event.type}</p></div><span className="self-center text-[10px] text-[#afc0bb]">{event.owner}</span><span className="self-center text-[9px] text-[#82978f]">Evidence required</span><span className={`self-center rounded-full px-2 py-1 text-[8px] font-black uppercase ${event.status === 'Action' || event.status === 'Decision' ? 'bg-amber-300/10 text-amber-100' : event.status === 'On track' ? 'bg-[#b7e35b]/10 text-[#dff7a8]' : 'bg-cyan-300/10 text-cyan-100'}`}>{event.status}</span></div>)}</div></ShellCard><ShellCard className="xl:col-span-4"><Heading eyebrow="Recurring cadence" title="The finance operating calendar" /><div className="space-y-3 p-5">{[['Daily', 'Bank feeds, processor totals, AR actions'], ['Weekly', 'Cash forecast, AP approvals, project EAC'], ['Biweekly', 'Payroll allocation, grant draw review'], ['Monthly', 'Close, chapter settlements, CEO brief'], ['Quarterly', 'Forecast reset, Board packet, restrictions'], ['Annual', 'Budget, audit, 990, filings, policies']].map(([cadence, work]) => <div key={cadence} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-[9px] font-black uppercase text-emerald-200">{cadence}</p><p className="mt-1 text-[10px] leading-4 text-[#a9bbb5]">{work}</p></div>)}</div></ShellCard></div>;
}

function ChartOfAccounts() {
  const [query, setQuery] = useState('');
  const accounts = [
    ['1000', 'Cash and cash equivalents', 'Asset', 'Parent + chapter', 'Bank / processor'],
    ['1120', 'Accounts receivable', 'Asset', 'Parent', 'Customer / project'],
    ['1180', 'Grant reimbursement receivable', 'Asset', 'Parent + chapter', 'Funder / grant'],
    ['2000', 'Accounts payable', 'Liability', 'Parent + chapter', 'Vendor / project'],
    ['2140', 'Due to chapters', 'Liability', 'Parent', 'Chapter required'],
    ['2180', 'Deferred project revenue', 'Liability', 'Parent', 'Project required'],
    ['4100', 'Contributions — unrestricted', 'Revenue', 'Parent + chapter', 'Campaign / donor'],
    ['4200', 'Contributions — restricted', 'Revenue', 'Parent + chapter', 'Restriction required'],
    ['4300', 'Membership revenue', 'Revenue', 'Parent + chapter', 'Chapter attribution'],
    ['4500', 'Trail Solutions service revenue', 'Revenue', 'Parent', 'Project / phase'],
    ['5100', 'Direct project labor', 'Expense', 'Parent', 'Project / phase / worker'],
    ['5200', 'Project subcontractors', 'Expense', 'Parent', 'Project / vendor'],
    ['5300', 'Field equipment and travel', 'Expense', 'Parent', 'Project / function'],
    ['6100', 'Program and chapter support', 'Expense', 'Parent + chapter', 'Program / function'],
    ['7100', 'Management and general', 'Expense', 'Parent + chapter', 'Function required'],
    ['7200', 'Fundraising', 'Expense', 'Parent + chapter', 'Campaign / function'],
  ].filter((account) => account.join(' ').toLowerCase().includes(query.toLowerCase()));
  return <ShellCard><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4"><div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#718981]">Canonical financial vocabulary</p><h2 className="mt-1 text-base font-semibold text-white">Parent + chapter account crosswalk</h2></div><label className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-2"><Search className="h-3.5 w-3.5 text-[#718981]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search accounts" className="w-40 bg-transparent text-[10px] text-white outline-none placeholder:text-[#617971]" /></label></div><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left"><thead><tr className="border-b border-white/[0.07] text-[9px] font-black uppercase tracking-[0.16em] text-[#6f8981]"><th className="px-5 py-3">Account</th><th className="px-3 py-3">Name</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Applies to</th><th className="px-5 py-3">Required dimension</th></tr></thead><tbody>{accounts.map(([number, name, type, applies, dimension]) => <tr key={number} className="border-b border-white/[0.055] last:border-0"><td className="px-5 py-3.5 font-mono text-xs text-emerald-200">{number}</td><td className="px-3 py-3.5 text-xs font-semibold text-white">{name}</td><td className="px-3 py-3.5 text-[10px] text-[#a9bbb5]">{type}</td><td className="px-3 py-3.5 text-[10px] text-[#a9bbb5]">{applies}</td><td className="px-5 py-3.5"><span className="rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] px-2 py-1 text-[9px] text-[#dff7a8]">{dimension}</span></td></tr>)}</tbody></table></div></ShellCard>;
}

function TransactionsIntegrated({ onNavigate }: { onNavigate: (view: ImbaOsView) => void }) {
  const { queueSync } = useImbaOsState();
  const [jobId, setJobId] = useState('');
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-300/15 bg-violet-300/[0.045] px-4 py-3"><div><p className="text-[9px] font-black uppercase tracking-wider text-violet-100">QuickBooks write-back gate</p><p className="mt-1 text-[10px] text-[#9caaa6]">The form creates an IMBA-OS draft. Release to QuickBooks requires mapping validation and approval.</p></div><div className="flex gap-2"><button type="button" onClick={() => setJobId(queueSync({ system: 'qbo', action: 'create', recordType: 'Transaction draft', recordId: `DRAFT-${Date.now().toString().slice(-5)}`, summary: 'Validated bill or invoice draft from Finance workspace', requiresApproval: true }))} className="rounded-xl bg-violet-300 px-3 py-2 text-[9px] font-black uppercase text-[#171126]">Stage current draft</button><button type="button" onClick={() => onNavigate('integration-sync')} className="rounded-xl border border-white/[0.1] px-3 py-2 text-[9px] font-black uppercase text-white">Open sync queue</button></div>{jobId ? <p className="w-full text-[9px] font-semibold text-[#dff7a8]">{jobId} staged; no QuickBooks posting has occurred.</p> : null}</div><Transactions /></div>;
}

function Transactions() {
  const [mode, setMode] = useState<'bill' | 'invoice'>('bill');
  const [saved, setSaved] = useState(false);
  const [amount, setAmount] = useState('');
  const fieldClass = 'mt-1.5 w-full rounded-xl border border-white/[0.09] bg-[#14201e] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-300/35';
  return <div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-8"><div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4"><div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#718981]">Controlled entry</p><h2 className="mt-1 text-base font-semibold text-white">{mode === 'bill' ? 'Enter vendor bill / chapter obligation' : 'Create client invoice / grant receivable'}</h2></div><div className="rounded-xl border border-white/[0.08] p-1"><button type="button" onClick={() => { setMode('bill'); setSaved(false); }} className={`rounded-lg px-3 py-2 text-[9px] font-black ${mode === 'bill' ? 'bg-[#b7e35b] text-[#102016]' : 'text-[#82978f]'}`}>Bill</button><button type="button" onClick={() => { setMode('invoice'); setSaved(false); }} className={`rounded-lg px-3 py-2 text-[9px] font-black ${mode === 'invoice' ? 'bg-[#b7e35b] text-[#102016]' : 'text-[#82978f]'}`}>Invoice</button></div></div><form onSubmit={(event) => { event.preventDefault(); setSaved(true); }} className="grid gap-4 p-5 md:grid-cols-2"><label className="text-[9px] font-black uppercase tracking-wider text-[#718981]">{mode === 'bill' ? 'Vendor / chapter' : 'Customer / funder'}<input required className={fieldClass} placeholder={mode === 'bill' ? 'Select counterparty' : 'Select customer'} /></label><label className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Amount<input required value={amount} onChange={(event) => setAmount(event.target.value)} className={fieldClass} placeholder="$0.00" /></label><label className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Project / chapter / grant<select required className={fieldClass}><option value="">Select controlling record</option><option>Great Lakes Buildout</option><option>Federal Recreation Partnership</option><option>Front Range MTB Alliance</option></select></label><label className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Account + function<select required className={fieldClass}><option>Choose canonical account</option><option>5200 · Project subcontractors</option><option>2140 · Due to chapters</option><option>4500 · Trail Solutions revenue</option></select></label><label className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Transaction date<input type="date" className={fieldClass} /></label><label className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Due / milestone date<input type="date" className={fieldClass} /></label><label className="text-[9px] font-black uppercase tracking-wider text-[#718981] md:col-span-2">Memo + evidence<textarea className={`${fieldClass} min-h-24`} placeholder="Business purpose, approval context, deliverable, or restriction..." /></label><div className="flex items-center justify-between gap-3 md:col-span-2"><p className="text-[9px] text-[#718981]">Required dimensions are validated before submission reaches approval.</p><button type="submit" className="rounded-xl bg-[#b7e35b] px-5 py-3 text-[10px] font-black uppercase text-[#102016]">Submit for approval</button></div>{saved ? <p className="flex items-center gap-2 text-[10px] text-[#dff7a8] md:col-span-2"><Check className="h-3.5 w-3.5" /> Demo {mode} for {amount || '$0'} entered into the approval queue.</p> : null}</form></ShellCard><ShellCard className="xl:col-span-4"><Heading eyebrow="Transaction controls" title="What must travel with the money" /><div className="space-y-3 p-5">{['Counterparty identity and approval', 'Canonical account and functional class', 'Project, phase, chapter, or grant tag', 'Restriction / allowability evidence', 'Billing or payment milestone', 'Source document and audit trail'].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.06] px-3 py-2.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/10 font-mono text-[8px] text-emerald-200">{index + 1}</span><span className="text-[10px] text-[#afc0bb]">{item}</span></div>)}</div></ShellCard></div>;
}

function Snapshot({ onNavigate }: { onNavigate: (view: ImbaOsView) => void }) {
  const revenue = imbaBudgetRows.slice(0, 3).reduce((sum, row) => sum + row.actual, 0);
  const expense = imbaBudgetRows.slice(3).reduce((sum, row) => sum + row.actual, 0);
  const ar = imbaReceivables.reduce((sum, row) => sum + row.amount, 0);
  const ap = imbaPayables.reduce((sum, row) => sum + row.amount, 0);
  const grantRemaining = imbaGrants.reduce((sum, row) => sum + row.remaining, 0);
  const launchers: Array<{ title: string; note: string; value: string; view: ImbaOsView; icon: typeof PieChart }> = [
    { title: 'Budget + forecast', note: '8 operating lines', value: '3 forecast risks', view: 'finance-budget', icon: PieChart },
    { title: 'Grant tracking', note: '5 active awards', value: money(grantRemaining), view: 'finance-grants', icon: Landmark },
    { title: 'AP / AR', note: `${money(ar)} receivable`, value: `${money(ap)} payable`, view: 'finance-ap-ar', icon: Receipt },
    { title: 'Reports', note: `${imbaReports.length} governed reports`, value: '2 due this week', view: 'finance-reports', icon: FileBarChart },
  ];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="YTD revenue" value={money(revenue)} note="Membership, philanthropy, and Trail Solutions" />
        <Kpi label="YTD expense" value={money(expense)} note="Delivery, mission, and shared services" tone="teal" />
        <Kpi label="YTD result" value={money(revenue - expense)} note="Investment position before close adjustments" tone="amber" />
        <Kpi label="Deployable cash" value="$1.74M" note="After modeled restrictions and obligations" tone="lime" />
        <Kpi label="Monthly close" value="24 / 28" note="Four control steps remain · target Jul 22" tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <ShellCard className="xl:col-span-8">
          <Heading eyebrow="Finance home" title="One click into every accounting workflow" detail="Not just a CEO dashboard" />
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {launchers.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} type="button" onClick={() => onNavigate(item.view)} className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition hover:border-emerald-300/25 hover:bg-emerald-300/[0.04]">
                  <div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-emerald-300/10 p-2 text-emerald-200"><Icon className="h-4 w-4" /></span><ArrowRight className="h-4 w-4 text-[#607870] transition group-hover:translate-x-1 group-hover:text-[#b7e35b]" /></div>
                  <h3 className="mt-4 text-sm font-semibold text-white">{item.title}</h3>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[10px]"><span className="text-[#7f958e]">{item.note}</span><span className="font-mono font-semibold text-[#dff7a8]">{item.value}</span></div>
                </button>
              );
            })}
          </div>
        </ShellCard>

        <ShellCard className="xl:col-span-4">
          <Heading eyebrow="Close cockpit" title="July close checklist" detail="86% complete" />
          <div className="space-y-2 p-5">
            {[
              ['Bank + processor reconciliations', 'Complete'],
              ['PEO payroll to labor allocation', 'Review'],
              ['Chapter obligation roll-forward', 'Complete'],
              ['Grant draws + deferred revenue', 'Action'],
              ['Trail project EAC refresh', 'Action'],
            ].map(([label, status]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <span className="text-[10px] text-[#afc0bb]">{label}</span>
                <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${status === 'Complete' ? 'bg-[#b7e35b]/10 text-[#dff7a8]' : status === 'Review' ? 'bg-cyan-300/10 text-cyan-100' : 'bg-amber-300/10 text-amber-100'}`}>{status}</span>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ShellCard><Heading eyebrow="Working capital" title="Cash conversion" /><div className="space-y-3 p-5"><Kpi label="Receivables + unbilled" value={money(ar)} note="$96K is over 60 days" tone="amber" /><Kpi label="Approved + pending payables" value={money(ap)} note="Includes chapter settlement reserve" tone="teal" /></div></ShellCard>
        <ShellCard><Heading eyebrow="Restricted funding" title="Grant portfolio" /><div className="p-5"><p className="font-mono text-3xl font-semibold text-white">{money(grantRemaining)}</p><p className="mt-1 text-[10px] text-[#7f958e]">Unspent award balance across the illustrative active portfolio</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full w-[54%] rounded-full bg-[#68b9aa]" /></div><p className="mt-2 text-[9px] text-[#718981]">54% of awarded funds spent · $308K draws pending</p></div></ShellCard>
        <ShellCard><Heading eyebrow="Control signals" title="Finance action queue" /><div className="space-y-3 p-5">{['Collect Great Lakes invoice before next mobilization', 'Submit federal reimbursement package by Jul 31', 'Resolve equipment invoice decision hold', 'Refresh three project estimates to complete'].map((item, index) => <div key={item} className="flex items-start gap-3"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-black ${index < 2 ? 'bg-rose-300/10 text-rose-100' : 'bg-amber-300/10 text-amber-100'}`}>{index + 1}</span><p className="text-[10px] leading-5 text-[#a9bbb5]">{item}</p></div>)}</div></ShellCard>
      </div>
    </>
  );
}

function Budget() {
  const [engine, setEngine] = useState('All engines');
  const engines = ['All engines', ...Array.from(new Set(imbaBudgetRows.map((row) => row.engine)))];
  const rows = engine === 'All engines' ? imbaBudgetRows : imbaBudgetRows.filter((row) => row.engine === engine);
  const totals = useMemo(() => rows.reduce((acc, row) => ({ budget: acc.budget + row.budget, actual: acc.actual + row.actual, ytdBudget: acc.ytdBudget + row.ytdBudget, forecast: acc.forecast + row.forecast }), { budget: 0, actual: 0, ytdBudget: 0, forecast: 0 }), [rows]);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Annual plan" value={money(totals.budget)} note="Selected budget lines" /><Kpi label="YTD actual" value={money(totals.actual)} note={`Against ${money(totals.ytdBudget)} phased plan`} tone="teal" /><Kpi label="YTD variance" value={money(totals.actual - totals.ytdBudget)} note="Positive means above phased plan" tone={totals.actual > totals.ytdBudget ? 'amber' : 'lime'} /><Kpi label="Year-end forecast" value={money(totals.forecast)} note={`${money(totals.forecast - totals.budget)} against annual plan`} tone="amber" /></div>
      <ShellCard>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4"><div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#718981]">Operating plan</p><h2 className="mt-1 text-base font-semibold text-white">Budget by revenue engine + cost center</h2></div><select value={engine} onChange={(event) => setEngine(event.target.value)} className="rounded-xl border border-white/[0.1] bg-[#14201e] px-3 py-2 text-[10px] font-semibold text-white outline-none">{engines.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-white/[0.07] text-[9px] font-black uppercase tracking-[0.16em] text-[#6f8981]"><th className="px-5 py-3">Line</th><th className="px-3 py-3">Engine</th><th className="px-3 py-3 text-right">Annual budget</th><th className="px-3 py-3 text-right">YTD budget</th><th className="px-3 py-3 text-right">YTD actual</th><th className="px-3 py-3 text-right">Variance</th><th className="px-5 py-3 text-right">Forecast</th></tr></thead><tbody>{rows.map((row) => { const variance = row.actual - row.ytdBudget; const risk = Math.abs(row.forecast - row.budget) / row.budget > .05; return <tr key={row.line} className="border-b border-white/[0.055] last:border-0 hover:bg-white/[0.02]"><td className="px-5 py-3.5 text-xs font-semibold text-white">{row.line}</td><td className="px-3 py-3.5"><span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[9px] text-[#9fb2ac]">{row.engine}</span></td><td className="px-3 py-3.5 text-right font-mono text-xs text-[#b5c5c0]">{money(row.budget)}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-[#82978f]">{money(row.ytdBudget)}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-white">{money(row.actual)}</td><td className={`px-3 py-3.5 text-right font-mono text-xs ${Math.abs(variance) > row.ytdBudget * .08 ? 'text-amber-200' : 'text-[#dff7a8]'}`}>{money(variance)}</td><td className={`px-5 py-3.5 text-right font-mono text-xs font-semibold ${risk ? 'text-amber-200' : 'text-[#dff7a8]'}`}>{money(row.forecast)}</td></tr>; })}</tbody></table></div>
      </ShellCard>
      <div className="grid gap-5 lg:grid-cols-3"><ShellCard className="lg:col-span-2"><Heading eyebrow="Forecast bridge" title="What is moving the year-end result" /><div className="grid gap-3 p-5 sm:grid-cols-3">{[['Trail Services', '-$240K', 'Starts slipped; design mix lower'], ['Membership', '+$85K', 'Renewal pace above plan'], ['Shared services', '-$23K', 'Technology milestone costs']].map(([name, value, note]) => <div key={name} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[9px] font-black uppercase tracking-wider text-[#718981]">{name}</p><p className={`mt-3 font-mono text-xl font-semibold ${value.startsWith('+') ? 'text-[#dff7a8]' : 'text-amber-200'}`}>{value}</p><p className="mt-1 text-[10px] leading-4 text-[#849991]">{note}</p></div>)}</div></ShellCard><ShellCard><Heading eyebrow="Budget controls" title="Planning workflow" /><div className="space-y-3 p-5">{['Department owner submits forecast', 'Finance validates assumptions', 'Kent selects management case', 'Board sees approved variance bridge'].map((item, index) => <div key={item} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#b7e35b]/10 font-mono text-[9px] text-[#dff7a8]">{index + 1}</span><p className="text-[10px] text-[#a9bbb5]">{item}</p></div>)}</div></ShellCard></div>
    </>
  );
}

function GrantsIntegrated({ onNavigate }: { onNavigate: (view: ImbaOsView) => void }) {
  const { getEditedRecord, updateRecord } = useImbaOsState();
  const [selectedId, setSelectedId] = useState(imbaGrants[1].id);
  const selected = getEditedRecord('grant', selectedId, imbaGrants.find((grant) => grant.id === selectedId) ?? imbaGrants[0]);
  const updateSpent = (spent: number) => updateRecord('grant', selected.id, { spent, remaining: Math.max(0, selected.award - spent) }, { actor: 'Grant accountant', detail: `Updated allowable spend and award balance for ${selected.id}.`, queue: { system: 'qbo', action: 'update', recordType: 'Grant coding summary', recordId: selected.id, summary: `${selected.funder} · allowable spend ${money(spent)}`, requiresApproval: true } });
  return <div className="space-y-4"><div className="grid gap-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.04] p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]"><label className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Award<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-[#14201e] px-3 py-2.5 text-xs text-white outline-none">{imbaGrants.map((grant) => <option key={grant.id} value={grant.id}>{grant.id} · {grant.funder}</option>)}</select></label><label className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Allowable spend<input type="number" min="0" max={selected.award} value={selected.spent} onChange={(event) => updateSpent(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-[#14201e] px-3 py-2.5 text-xs text-white outline-none" /></label><label className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Control status<select value={selected.status} onChange={(event) => updateRecord('grant', selected.id, { status: event.target.value }, { actor: 'Grant accountant', detail: `Updated grant control status for ${selected.id}.` })} className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-[#14201e] px-3 py-2.5 text-xs text-white outline-none"><option>On track</option><option>Draw due</option><option>Watch</option></select></label><div className="self-end rounded-xl border border-white/[0.08] px-4 py-2.5"><p className="text-[8px] font-black uppercase text-emerald-100">Control subledger</p><p className="mt-1 text-[9px] text-[#91a49e]">Edits persist · QBO tie-out queued · audit retained</p></div></div><Grants onNavigate={onNavigate} /></div>;
}

function Grants({ onNavigate }: { onNavigate: (view: ImbaOsView) => void }) {
  const { getEditedRecord } = useImbaOsState();
  const [status, setStatus] = useState('All');
  const [selectedId, setSelectedId] = useState(imbaGrants[1].id);
  const grants = imbaGrants.map((grant) => getEditedRecord('grant', grant.id, grant));
  const rows = status === 'All' ? grants : grants.filter((grant) => grant.status === status);
  const selected = grants.find((grant) => grant.id === selectedId) ?? grants[0];
  const award = grants.reduce((sum, grant) => sum + grant.award, 0);
  const spent = grants.reduce((sum, grant) => sum + grant.spent, 0);
  const reimbursement = grants.reduce((sum, grant) => sum + grant.reimbursement, 0);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Active awards" value={money(award)} note={`${imbaGrants.length} awards in the demo portfolio`} /><Kpi label="Allowable spend recorded" value={money(spent)} note={`${Math.round((spent / award) * 100)}% aggregate burn`} tone="teal" /><Kpi label="Award capacity remaining" value={money(award - spent)} note="Not the same as deployable cash" /><Kpi label="Draws pending" value={money(reimbursement)} note="Reimbursement packages to submit" tone="amber" /></div>
      <div className="grid gap-5 xl:grid-cols-12">
        <ShellCard className="xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4"><div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#718981]">Award register</p><h2 className="mt-1 text-base font-semibold text-white">Restriction + draw + deadline control</h2></div><div className="flex gap-1">{['All', 'On track', 'Draw due', 'Watch'].map((item) => <button key={item} type="button" onClick={() => setStatus(item)} className={`rounded-lg px-2.5 py-2 text-[9px] font-bold ${status === item ? 'bg-[#b7e35b] text-[#102016]' : 'border border-white/[0.08] text-[#94a8a1]'}`}>{item}</button>)}</div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-white/[0.07] text-[9px] font-black uppercase tracking-[0.16em] text-[#6f8981]"><th className="px-5 py-3">Funder + program</th><th className="px-3 py-3 text-right">Award</th><th className="px-3 py-3">Burn</th><th className="px-3 py-3 text-right">Remaining</th><th className="px-3 py-3">Next deadline</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{rows.map((grant) => { const burn = Math.round((grant.spent / grant.award) * 100); return <tr key={grant.id} onClick={() => setSelectedId(grant.id)} className={`cursor-pointer border-b border-white/[0.055] last:border-0 hover:bg-white/[0.03] ${selectedId === grant.id ? 'bg-emerald-300/[0.035]' : ''}`}><td className="px-5 py-3.5"><p className="text-xs font-semibold text-white">{grant.funder}</p><p className="mt-1 text-[9px] text-[#718981]">{grant.id} · {grant.program}</p></td><td className="px-3 py-3.5 text-right font-mono text-xs text-[#b5c5c0]">{money(grant.award)}</td><td className="px-3 py-3.5"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-[#68b9aa]" style={{ width: `${burn}%` }} /></div><span className="font-mono text-[9px] text-[#9fb2ac]">{burn}%</span></div></td><td className="px-3 py-3.5 text-right font-mono text-xs text-[#dff7a8]">{money(grant.remaining)}</td><td className="px-3 py-3.5 text-[10px] text-[#afc0bb]">{grant.nextDeadline}</td><td className="px-5 py-3.5"><span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${grant.status === 'On track' ? 'bg-[#b7e35b]/10 text-[#dff7a8]' : grant.status === 'Draw due' ? 'bg-cyan-300/10 text-cyan-100' : 'bg-amber-300/10 text-amber-100'}`}>{grant.status}</span></td></tr>; })}</tbody></table></div>
        </ShellCard>
        <ShellCard className="xl:col-span-4"><Heading eyebrow={`${selected.id} · selected award`} title={selected.funder} /><div className="space-y-4 p-5"><div><p className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Restriction</p><p className="mt-1 text-xs leading-5 text-white">{selected.restriction}</p></div><div className="grid grid-cols-2 gap-3"><Kpi label="Remaining" value={money(selected.remaining)} note="Award balance" /><Kpi label="Draw pending" value={money(selected.reimbursement)} note="Receivable / action" tone={selected.reimbursement ? 'amber' : 'teal'} /></div><div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Next controls</p><div className="mt-3 space-y-2">{['Validate allowable-cost coding', 'Reconcile payroll allocation', 'Attach evidence to reimbursement', 'Route narrative data to program owner'].map((item, index) => <div key={item} className="flex items-center gap-2 text-[10px] text-[#a9bbb5]">{index < 2 ? <Check className="h-3.5 w-3.5 text-[#b7e35b]" /> : <CalendarClock className="h-3.5 w-3.5 text-amber-200" />}{item}</div>)}</div></div><button type="button" onClick={() => onNavigate('development-grant-pipeline')} className="w-full rounded-xl bg-[#b7e35b] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#102016]">Open grant workspace</button></div></ShellCard>
      </div>
    </>
  );
}

function ApAr() {
  type ReceivableRecord = (typeof imbaReceivables)[number] & {
    followUpQueued?: boolean;
  };

  const { getEditedRecord, updateRecord } = useImbaOsState();
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const receivables = imbaReceivables.map((row) =>
    getEditedRecord<ReceivableRecord>('receivable', row.ref, row),
  );
  const arTotal = imbaReceivables.reduce((sum, row) => sum + row.amount, 0);
  const overdue = imbaReceivables.filter((row) => row.age > 30).reduce((sum, row) => sum + row.amount, 0);
  const current = arTotal - overdue;
  const selectedReceivable = selectedRef
    ? receivables.find((row) => row.ref === selectedRef)
    : undefined;

  const queueFollowUp = (row: ReceivableRecord) => {
    updateRecord(
      'receivable',
      row.ref,
      { followUpQueued: true },
      {
        actor: 'Finance collections',
        detail: `Queued collection follow-up for ${row.customer} / ${row.ref}.`,
      },
    );
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Receivables + unbilled" value={money(arTotal)} note="Invoices plus earned milestone work" /><Kpi label="Over 30 days" value={money(overdue)} note="Aged collection risk" tone="amber" /><Kpi label="Current" value={money(current)} note="Within terms" tone="teal" /><Kpi label="Open items" value={String(receivables.length)} note="Receivable + unbilled records" tone="lime" /></div>
      <ShellCard>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
          <div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#718981]">Cash conversion · collections</p><h2 className="mt-1 text-base font-semibold text-white">Accounts receivable + unbilled work</h2></div>
          <p className="text-[9px] text-[#718981]">Vendor bills live in <span className="text-[#dff7a8]">Money → Accounts payable</span></p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead><tr className="border-b border-white/[0.07] text-[9px] font-black uppercase tracking-[0.16em] text-[#6f8981]"><th className="px-5 py-3">Customer / project</th><th className="px-3 py-3">Reference</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3 text-right">Age</th><th className="px-3 py-3">Due</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
            <tbody>{receivables.map((row) => (
              <tr key={row.ref} className={`border-b border-white/[0.055] last:border-0 ${selectedReceivable?.ref === row.ref ? 'bg-emerald-300/[0.035]' : ''}`}>
                <td className="px-5 py-3.5"><p className="text-xs font-semibold text-white">{row.customer}</p><p className="mt-1 text-[9px] text-[#718981]">{row.project}</p></td>
                <td className="px-3 py-3.5 font-mono text-[10px] text-[#94aaa3]">{row.ref}</td>
                <td className="px-3 py-3.5 text-right font-mono text-xs text-white">{money(row.amount)}</td>
                <td className={`px-3 py-3.5 text-right font-mono text-xs ${row.age > 45 ? 'text-rose-200' : row.age > 30 ? 'text-amber-200' : 'text-[#dff7a8]'}`}>{row.age ? `${row.age}d` : '—'}</td>
                <td className="px-3 py-3.5 text-[10px] text-[#a9bbb5]">{row.due}</td>
                <td className="px-5 py-3.5"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedRef(row.ref)} className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 py-2 text-[9px] font-bold text-white hover:bg-white/[0.05]"><Eye className="h-3 w-3" /> View</button>{row.status !== 'Current' ? <button type="button" disabled={row.followUpQueued} onClick={() => queueFollowUp(row)} className="rounded-lg bg-[#b7e35b] px-3 py-2 text-[9px] font-black text-[#102016] disabled:cursor-default disabled:bg-[#b7e35b]/10 disabled:text-[#dff7a8]">{row.followUpQueued ? 'Follow-up queued' : 'Queue follow-up'}</button> : null}</div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {selectedReceivable ? (
          <div className="grid gap-4 border-t border-emerald-300/15 bg-emerald-300/[0.025] p-5 lg:grid-cols-[1.4fr_1fr_auto]">
            <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">Receivable detail / {selectedReceivable.ref}</p><h3 className="mt-1 text-base font-semibold text-white">{selectedReceivable.customer}</h3><p className="mt-2 text-[10px] leading-5 text-[#9fb2ac]">{selectedReceivable.project} · {selectedReceivable.status}. Viewing this record does not change its workflow state.</p></div>
            <div className="grid grid-cols-3 gap-2"><Kpi label="Amount" value={money(selectedReceivable.amount)} note="Open balance" /><Kpi label="Age" value={selectedReceivable.age ? `${selectedReceivable.age}d` : 'Unbilled'} note="As of demo date" tone={selectedReceivable.age > 30 ? 'amber' : 'teal'} /><Kpi label="Due" value={selectedReceivable.due} note="Collection milestone" tone="teal" /></div>
            <div className="flex items-start gap-2"><button type="button" disabled={selectedReceivable.followUpQueued} onClick={() => queueFollowUp(selectedReceivable)} className="rounded-xl bg-[#b7e35b] px-4 py-3 text-[9px] font-black uppercase text-[#102016] disabled:bg-[#b7e35b]/10 disabled:text-[#dff7a8]">{selectedReceivable.followUpQueued ? 'Follow-up queued' : 'Queue follow-up'}</button><button type="button" aria-label="Close receivable detail" onClick={() => setSelectedRef(null)} className="rounded-xl border border-white/[0.1] p-3 text-[#94aaa3]"><X className="h-4 w-4" /></button></div>
          </div>
        ) : null}
      </ShellCard>
    </>
  );
}

function Reports() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(imbaReports[0]);
  const [prepared, setPrepared] = useState('');
  const categories = ['All', ...Array.from(new Set(imbaReports.map((report) => report.category)))];
  const rows = imbaReports.filter((report) => (category === 'All' || report.category === category) && `${report.name} ${report.description}`.toLowerCase().includes(query.toLowerCase()));
  const prepareExport = () => {
    const exportRows = [
      ['Field', 'Value'],
      ['Report', selected.name],
      ['Category', selected.category],
      ['Cadence', selected.cadence],
      ['Audience', selected.audience],
      ['Status', selected.status],
      ['Description', selected.description],
      ['Data classification', 'Prototype / illustrative'],
      ['Generated at', new Date().toISOString()],
    ];
    const csv = exportRows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${selected.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setPrepared(selected.name);
  };
  return (
    <div className="grid gap-5 xl:grid-cols-12">
      <ShellCard className="xl:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4"><div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#718981]">Governed catalog</p><h2 className="mt-1 text-base font-semibold text-white">Financial + management reports</h2></div><div className="flex gap-2"><label className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-2"><Search className="h-3.5 w-3.5 text-[#718981]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reports" className="w-32 bg-transparent text-[10px] text-white outline-none placeholder:text-[#617971]" /></label><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-white/[0.09] bg-[#14201e] px-3 py-2 text-[10px] text-white outline-none">{categories.map((item) => <option key={item}>{item}</option>)}</select></div></div>
        <div className="grid gap-3 p-5 md:grid-cols-2">{rows.map((report) => <button key={report.name} type="button" onClick={() => setSelected(report)} className={`rounded-2xl border p-4 text-left transition ${selected.name === report.name ? 'border-[#b7e35b]/30 bg-[#b7e35b]/[0.055]' : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'}`}><div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-emerald-300/10 p-2 text-emerald-200"><FileBarChart className="h-4 w-4" /></span><span className="rounded-full border border-white/[0.08] px-2 py-1 text-[8px] font-black uppercase text-[#9fb2ac]">{report.status}</span></div><h3 className="mt-3 text-xs font-semibold text-white">{report.name}</h3><p className="mt-2 text-[10px] leading-4 text-[#82978f]">{report.description}</p><div className="mt-3 flex justify-between border-t border-white/[0.06] pt-3 text-[9px] text-[#718981]"><span>{report.cadence}</span><span>{report.audience}</span></div></button>)}</div>
      </ShellCard>
      <ShellCard className="xl:col-span-4"><Heading eyebrow="Report preview" title={selected.name} /><div className="space-y-4 p-5"><p className="text-xs leading-5 text-[#a9bbb5]">{selected.description}</p><div className="grid grid-cols-2 gap-3"><Kpi label="Cadence" value={selected.cadence} note="Refresh rhythm" tone="teal" /><Kpi label="Status" value={selected.status.replace('Prototype ', '')} note="Build maturity" /></div><div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><p className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Report controls</p><div className="mt-3 space-y-2">{['Data refreshed and reconciled', 'Owner certification attached', 'Material variances annotated', 'Distribution list permissioned'].map((item, index) => <div key={item} className="flex items-center gap-2 text-[10px] text-[#a9bbb5]">{index < 2 ? <ShieldCheck className="h-3.5 w-3.5 text-[#b7e35b]" /> : <ClipboardCheck className="h-3.5 w-3.5 text-[#68b9aa]" />}{item}</div>)}</div></div><button type="button" onClick={prepareExport} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b7e35b] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#102016]"><Download className="h-3.5 w-3.5" /> Download board-ready CSV</button>{prepared ? <p className="flex items-center gap-2 text-[10px] text-[#dff7a8]"><Check className="h-3.5 w-3.5" /> {prepared} downloaded with a prototype-data classification.</p> : null}</div></ShellCard>
    </div>
  );
}
