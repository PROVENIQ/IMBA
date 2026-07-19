'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Check,
  ClipboardCheck,
  CreditCard,
  Database,
  Eye,
  FileBarChart,
  Landmark,
  Minus,
  PieChart,
  Plus,
  Receipt,
  RefreshCw,
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
  imbaVendors,
} from '@/lib/imba-detail-data';
import { accounting, financialHistory, publicFinancialFacts } from '@/lib/imba-data';
import {
  qboFundAccountingCaveats,
  qboLaneMeta,
  qboReportCatalog,
  qboReportCount,
  type QboCatalogReport,
  type QboReportLane,
} from '@/lib/imba-report-catalog';
import type { ImbaOsView } from '@/lib/imba-os-data';
import type { ImbaFilterState, ImbaRoleKey } from '@/lib/imba-intelligence-data';
import { useImbaOsState } from '@/components/imba/ImbaOsState';
import { ImbaPayables } from '@/components/imba/ImbaPayables';
import { ImbaReportOutput } from '@/components/imba/ImbaReportOutput';
import { ImbaInfoTooltip } from '@/components/imba/ImbaInfoTooltip';

export type ImbaFinanceView =
  | 'finance-snapshot'
  | 'finance-calendar'
  | 'finance-coa'
  | 'finance-budget'
  | 'finance-grants'
  | 'finance-payables'
  | 'finance-ap-ar'
  | 'finance-reports'
  | 'finance-transactions'
  | 'finance-expenses'
  | 'finance-cost-of-labor'
  | 'finance-vendors'
  | 'finance-customers'
  | 'finance-grantors';

function money(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${sign}$${(absolute / 1_000_000).toFixed(2).replace(/0$/, '').replace(/\.0$/, '')}M`;
  if (absolute >= 1_000) return `${sign}$${Math.round(absolute / 1_000)}K`;
  return `${sign}$${absolute.toFixed(0)}`;
}

function ShellCard({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`rounded-[22px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card)/90%)] ${className}`}>{children}</section>;
}

function Heading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">{eyebrow}</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-base font-semibold text-[rgb(var(--text))]">{title}</h2>
        {detail ? <p className="text-[11px] text-[rgb(var(--text-3))]">{detail}</p> : null}
      </div>
    </div>
  );
}

function Kpi({ label, value, note, tone = 'lime' }: { label: string; value: string; note: string; tone?: 'lime' | 'teal' | 'amber' | 'rose' }) {
  const toneClass = tone === 'lime' ? 'text-[rgb(var(--sa-soft))]' : tone === 'teal' ? 'text-[rgb(var(--info))]' : tone === 'amber' ? 'text-amber-800 dark:text-amber-200' : 'text-rose-700 dark:text-rose-200';
  return (
    <div className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">{label}</p>
      <p className={`mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] ${toneClass}`}>{value}</p>
      <p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">{note}</p>
    </div>
  );
}

const viewMeta: Record<ImbaFinanceView, { eyebrow: string; title: string; description: string }> = {
  'finance-snapshot': { eyebrow: 'Money · command center', title: 'Organization snapshot', description: 'The accounting, liquidity, budget, grants, and working-capital picture in one finance home.' },
  'finance-calendar': { eyebrow: 'Money · control calendar', title: 'Finance calendar', description: 'Close, payroll, billing, grant, chapter settlement, audit, filing, and Board deadlines in one owned schedule.' },
  'finance-coa': { eyebrow: 'Money · data standard', title: 'Canonical chart of accounts', description: 'One reporting vocabulary across IMBA, Trail Solutions projects, restricted funds, and chapter submissions.' },
  'finance-budget': { eyebrow: 'Money · planning', title: 'Budget + forecast', description: 'Plan, actual, variance, and expected year-end result by IMBA revenue engine and cost center.' },
  'finance-grants': { eyebrow: 'Money · restricted funds', title: 'Grant tracking', description: 'Award-to-close lifecycle: restrictions, allowable spend, draws, deadlines, and remaining capacity.' },
  'finance-payables': { eyebrow: 'Money · approve & pay', title: 'Accounts payable', description: 'View the invoice, route by threshold, and Approve & Pay / Hold / Reject — the payment hands off to Bill.com for disbursement (planned connector).' },
  'finance-ap-ar': { eyebrow: 'Money · collections', title: 'Accounts receivable', description: 'Open invoices, unbilled milestones, aging, and collection follow-ups. Vendor bills and approvals live in Accounts payable.' },
  'finance-reports': { eyebrow: 'Money · reporting library', title: 'Reports', description: 'A governed catalog for leadership, Board, project accounting, treasury, grants, and compliance.' },
  'finance-transactions': { eyebrow: 'Money · transaction control', title: 'Bills + invoices', description: 'Controlled entry for vendor bills, client invoices, chapter obligations, project milestones, and coding evidence.' },
  'finance-expenses': { eyebrow: 'Money · employee spend', title: 'Expenses (Expensify)', description: 'Card spend and receipts flow from Expensify into coding, reconcile to the card statement, and post to the GL and reimbursements.' },
  'finance-cost-of-labor': { eyebrow: 'Money · workforce cost', title: 'Cost of labor', description: 'IMBA leases its entire workforce through a PEO. This decomposes the PEO reimbursement into the filed Form 990 lines and builds the loaded rate — showing exactly where public data runs out.' },
  'finance-vendors': { eyebrow: 'Money · payables', title: 'Vendors', description: 'Money-out parties — subcontractors, suppliers, and service providers. Each maps one-to-one to a QuickBooks Vendor.' },
  'finance-customers': { eyebrow: 'Money · receivables', title: 'Customers', description: 'Earned-revenue parties — Trail Solutions clients who contract IMBA for planning, design, and construction. Each maps to a QuickBooks Customer.' },
  'finance-grantors': { eyebrow: 'Money · restricted funds', title: 'Grantors', description: 'Foundations and funders behind restricted, contributed revenue. QuickBooks has no Grantor type, so these are recorded as Customers — IMBA-OS keeps them a separate class so contributed and earned revenue never blur.' },
};

export function ImbaFinanceWorkspace({ view, onNavigate, role, filters }: { view: ImbaFinanceView; onNavigate: (view: ImbaOsView) => void; role?: ImbaRoleKey; filters?: ImbaFilterState }) {
  return (
    <div className="space-y-5">
      {view === 'finance-snapshot' ? <Snapshot onNavigate={onNavigate} /> : null}
      {view === 'finance-calendar' ? <FinanceCalendar /> : null}
      {view === 'finance-coa' ? <ChartOfAccounts /> : null}
      {view === 'finance-budget' ? <Budget /> : null}
      {view === 'finance-grants' ? <GrantsIntegrated onNavigate={onNavigate} /> : null}
      {view === 'finance-payables' ? <ImbaPayables role={role} filters={filters} /> : null}
      {view === 'finance-ap-ar' ? <ApAr /> : null}
      {view === 'finance-reports' ? (
        <div className="space-y-5">
          <ProgramFullCostPanel />
          <Reports />
        </div>
      ) : null}
      {view === 'finance-transactions' ? <TransactionsIntegrated onNavigate={onNavigate} /> : null}
      {view === 'finance-expenses' ? <ExpenseTracking /> : null}
      {view === 'finance-cost-of-labor' ? <CostOfLabor /> : null}
      {view === 'finance-vendors' ? <Vendors /> : null}
      {view === 'finance-customers' ? <Customers /> : null}
      {view === 'finance-grantors' ? <Grantors /> : null}
    </div>
  );
}

// QuickBooks record-type badge — every IMBA-OS party maps to a QBO Vendor or
// Customer. Grantors are the interesting case: QBO has no Grantor type, so they
// live as Customers there while IMBA-OS keeps them a distinct class.
function QboRecord({ type }: { type: 'Vendor' | 'Customer' }) {
  return <span className="rounded-full bg-[rgb(var(--sa)/0.1)] px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-[rgb(var(--sa-soft))]">QBO · {type}</span>;
}

function PartyNote({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-[rgb(var(--info)/0.2)] bg-[rgb(var(--info)/0.05)] px-4 py-3 text-[11px] leading-5 text-[rgb(var(--text-2))]">{children}</div>;
}

function Vendors() {
  // Register data lives in imba-detail-data.ts (shared with the report renderers).
  const vendors = imbaVendors;
  const over100 = vendors.filter((v) => v.ytd >= 100_000).length;
  return (
    <>
      <PartyNote>Vendors are money-out parties. Each maps one-to-one to a <span className="font-semibold text-[rgb(var(--text))]">QuickBooks Vendor</span>. The five largest below are IMBA&#39;s <span className="font-semibold text-[rgb(var(--text))]">filed 2024 independent contractors</span> (Form 990 Part VII, Section B).</PartyNote>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Active vendors" value={String(vendors.length)} note="Subcontractors, suppliers, services" />
        <Kpi label="Filed 990 contractor spend" value={money(vendors.filter((v) => v.prov === 'filed').reduce((s, v) => s + v.ytd, 0))} note={`Plus ${money(vendors.filter((v) => v.prov === 'illustrative').reduce((s, v) => s + v.ytd, 0))} illustrative operating vendors`} tone="teal" />
        <Kpi label="Over $100K contractors" value={String(over100)} note="Reported individually on the 990" tone="amber" />
      </div>
      <ShellCard>
        <Heading eyebrow="Payables parties" title="Vendor register" detail="Maps to QuickBooks Vendors" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]">
                <th className="px-5 py-3">Vendor</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Terms</th><th className="px-3 py-3 text-right">Paid (2024)</th><th className="px-5 py-3">QuickBooks</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.name} className="border-b border-[rgb(var(--line)/0.055)] last:border-0 hover:bg-[rgb(var(--line)/0.02)]">
                  <td className="px-5 py-3.5"><span className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--text))]">{v.name} <Prov kind={v.prov} /></span></td>
                  <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{v.category}</td>
                  <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{v.terms}</td>
                  <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(v.ytd)}</td>
                  <td className="px-5 py-3.5"><QboRecord type="Vendor" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ShellCard>
    </>
  );
}

function Customers() {
  const openAr = imbaReceivables.reduce((s, r) => s + r.amount, 0);
  return (
    <>
      <PartyNote>Customers are earned-revenue parties — Trail Solutions clients who contract IMBA for planning, design, and construction. Each maps to a <span className="font-semibold text-[rgb(var(--text))]">QuickBooks Customer</span>. Values are illustrative.</PartyNote>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Active customers" value={String(imbaReceivables.length)} note="Trail Solutions engagements" />
        <Kpi label="Open receivable" value={money(openAr)} note="Billed + unbilled milestones" tone="teal" />
        <Kpi label="QuickBooks class" value="Customer" note="Earned Trail Solutions revenue" tone="lime" />
      </div>
      <ShellCard>
        <Heading eyebrow="Receivables parties" title="Customer register" detail="Maps to QuickBooks Customers" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]">
                <th className="px-5 py-3">Customer</th><th className="px-3 py-3">Engagement</th><th className="px-3 py-3 text-right">Open AR</th><th className="px-3 py-3">Status</th><th className="px-5 py-3">QuickBooks</th>
              </tr>
            </thead>
            <tbody>
              {imbaReceivables.map((r) => (
                <tr key={r.ref} className="border-b border-[rgb(var(--line)/0.055)] last:border-0 hover:bg-[rgb(var(--line)/0.02)]">
                  <td className="px-5 py-3.5"><span className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--text))]">{r.customer} <Prov kind="illustrative" /></span></td>
                  <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{r.project}</td>
                  <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(r.amount)}</td>
                  <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{r.status}</td>
                  <td className="px-5 py-3.5"><QboRecord type="Customer" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ShellCard>
    </>
  );
}

function Grantors() {
  const award = imbaGrants.reduce((s, g) => s + g.award, 0);
  const drawn = imbaGrants.reduce((s, g) => s + g.spent, 0);
  return (
    <>
      <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-100">The QuickBooks separation</p>
        <p className="mt-1.5 text-[11px] leading-5 text-[rgb(var(--text-2))]">
          QuickBooks has no <span className="font-semibold text-[rgb(var(--text))]">Grantor</span> record type, so grantors are entered as <span className="font-semibold text-[rgb(var(--text))]">Customers</span> there. IMBA-OS keeps them a distinct class: it&#39;s the same QuickBooks record, but <span className="font-semibold text-[rgb(var(--text))]">contributed, restricted revenue stays separate from earned Trail Solutions revenue</span> — so net-asset restriction and functional reporting stay clean.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Active grantors" value={String(imbaGrants.length)} note="Foundations + funders (illustrative)" />
        <Kpi label="Awarded" value={money(award)} note="Restricted commitments" tone="teal" />
        <Kpi label="Drawn to date" value={money(drawn)} note="Allowable spend recorded" tone="lime" />
        <Kpi label="QuickBooks class" value="Customer" note="IMBA-OS class · Grantor" tone="amber" />
      </div>
      <ShellCard>
        <Heading eyebrow="Restricted-fund parties" title="Grantor register" detail="QBO Customer · IMBA-OS Grantor" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]">
                <th className="px-5 py-3">Grantor · program</th><th className="px-3 py-3 text-right">Award</th><th className="px-3 py-3 text-right">Drawn</th><th className="px-3 py-3">Restriction</th><th className="px-5 py-3">Record mapping</th>
              </tr>
            </thead>
            <tbody>
              {imbaGrants.map((g) => (
                <tr key={g.id} className="border-b border-[rgb(var(--line)/0.055)] last:border-0 hover:bg-[rgb(var(--line)/0.02)]">
                  <td className="px-5 py-3.5"><p className="text-xs font-semibold text-[rgb(var(--text))]">{g.funder}</p><p className="mt-0.5 text-[11px] text-[rgb(var(--text-3))]">{g.program}</p></td>
                  <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(g.award)}</td>
                  <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--sa-soft))]">{money(g.spent)}</td>
                  <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{g.restriction}</td>
                  <td className="px-5 py-3.5"><span className="flex flex-wrap items-center gap-1.5"><QboRecord type="Customer" /><span className="rounded-full bg-amber-300/10 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-100">IMBA · Grantor</span></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ShellCard>
    </>
  );
}

// Expensify expense tracking + reconciliation. Card spend and receipts import
// from Expensify, get coded to project/grant/account, reconcile to the card
// statement, and post to the GL + reimbursements. Illustrative data.
function ExpenseTracking() {
  const expenses = [
    { id: 'EXP-4471', date: 'Jul 15', card: 'Trail Field · crew card', merchant: 'Home Depot — materials', amount: 842.16, account: '6200 · Field materials', coding: 'Great Lakes Buildout', status: 'Posted' },
    { id: 'EXP-4468', date: 'Jul 14', card: 'Planning & Design · card', merchant: 'Adobe Creative Cloud', amount: 79.99, account: '6500 · Software', coding: 'Shared services', status: 'Reconciled' },
    { id: 'EXP-4462', date: 'Jul 12', card: 'Programs & Community · card', merchant: 'Delta Air Lines', amount: 418.20, account: '6300 · Travel', coding: 'Education program', status: 'Approved' },
    { id: 'EXP-4459', date: 'Jul 11', card: 'Trail Field · crew card', merchant: 'Shell — fuel', amount: 96.44, account: '6250 · Crew travel', coding: 'Coastal Access Network', status: 'Coded' },
    { id: 'EXP-4455', date: 'Jul 10', card: 'Development & Grants · card', merchant: 'Zoom Events', amount: 210.00, account: '6420 · Fundraising events', coding: 'Fundraising', status: 'Coded' },
    { id: 'EXP-4451', date: 'Jul 9', card: 'Communications · card', merchant: 'Meta Ads', amount: 350.00, account: '6410 · Advertising', coding: 'Membership campaign', status: 'Imported' },
    { id: 'EXP-4448', date: 'Jul 8', card: 'Programs & Community · card', merchant: 'REI — field supplies', amount: 264.87, account: '6200 · Field materials', coding: 'Chapters & programs', status: 'Imported' },
  ];
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const uncoded = expenses.filter((e) => e.status === 'Imported').length;
  const posted = expenses.filter((e) => e.status === 'Posted' || e.status === 'Reconciled').reduce((s, e) => s + e.amount, 0);
  const statementTotal = 2626.7; // illustrative card statement
  const unreconciled = statementTotal - posted;
  const badge: Record<string, string> = {
    Imported: 'bg-[rgb(var(--line)/0.08)] text-[rgb(var(--text-2))]',
    Coded: 'bg-cyan-300/10 text-cyan-700 dark:text-cyan-100',
    Approved: 'bg-amber-300/10 text-amber-800 dark:text-amber-100',
    Reconciled: 'bg-violet-300/10 text-violet-700 dark:text-violet-100',
    Posted: 'bg-[rgb(var(--sa)/0.12)] text-[rgb(var(--sa-soft))]',
  };
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card)/90%)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-[rgb(var(--sa)/0.10)] p-1.5 text-[rgb(var(--sa-soft))]"><CreditCard className="h-4 w-4" /></span>
          <span className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text))]">Expensify</span>
          <span className="text-[11px] text-[rgb(var(--text-3))]">card + receipt connector · demo</span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        </div>
        <span className="text-[11px] text-[rgb(var(--text-3))]">Import → code → reconcile → post · illustrative data</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Card spend · period" value={money(total)} note={`${expenses.length} transactions imported from Expensify`} tone="teal" />
        <Kpi label="Awaiting coding" value={String(uncoded)} note="Receipts imported, not yet project/grant-coded" tone={uncoded ? 'amber' : 'lime'} />
        <Kpi label="Posted / reconciled" value={money(posted)} note="Matched to statement and posted to the GL" tone="lime" />
        <Kpi label="Unreconciled" value={money(unreconciled)} note="Statement vs posted — clears before close" tone={Math.abs(unreconciled) > 1 ? 'amber' : 'lime'} />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <ShellCard className="xl:col-span-8">
          <Heading eyebrow="Expensify feed" title="Card spend + receipts" detail="Coded to project / grant / account" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead>
                <tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]">
                  <th className="px-5 py-3">Date · cardholder</th>
                  <th className="px-3 py-3">Merchant</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3">Coding</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-[rgb(var(--line)/0.055)] last:border-0 hover:bg-[rgb(var(--line)/0.02)]">
                    <td className="px-5 py-3.5"><p className="text-xs font-semibold text-[rgb(var(--text))]">{e.date}</p><p className="mt-0.5 text-[11px] text-[rgb(var(--text-3))]">{e.card}</p></td>
                    <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{e.merchant}</td>
                    <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(e.amount)}</td>
                    <td className="px-3 py-3.5"><p className="text-[11px] text-[rgb(var(--text-2))]">{e.coding}</p><p className="mt-0.5 text-[11px] text-[rgb(var(--text-3))]">{e.account}</p></td>
                    <td className="px-5 py-3.5"><span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${badge[e.status]}`}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ShellCard>

        <ShellCard className="xl:col-span-4">
          <Heading eyebrow="Card reconciliation" title="Expensify → statement → GL" />
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between rounded-xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.02)] px-3 py-2.5"><span className="text-[11px] text-[rgb(var(--text-2))]">Expensify export</span><span className="font-mono text-xs font-semibold text-[rgb(var(--text))]">{money(total)}</span></div>
            <div className="flex items-center justify-between rounded-xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.02)] px-3 py-2.5"><span className="text-[11px] text-[rgb(var(--text-2))]">Card statement</span><span className="font-mono text-xs font-semibold text-[rgb(var(--text))]">{money(statementTotal)}</span></div>
            <div className="flex items-center justify-between rounded-xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.02)] px-3 py-2.5"><span className="text-[11px] text-[rgb(var(--text-2))]">Posted to GL</span><span className="font-mono text-xs font-semibold text-[rgb(var(--sa-soft))]">{money(posted)}</span></div>
            <div className="flex items-center justify-between rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-3 py-2.5"><span className="text-[11px] font-semibold text-amber-800 dark:text-amber-100">In-transit / uncoded</span><span className="font-mono text-xs font-semibold text-amber-800 dark:text-amber-100">{money(statementTotal - posted)}</span></div>
            <div className="rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Reconciliation controls</p>
              <div className="mt-3 space-y-2">
                {['Every transaction carries a receipt', 'Coded to project / grant / account', 'Statement matched line-by-line', 'Reimbursements approved before payout'].map((item, index) => (
                  <div key={item} className="flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]">{index < 2 ? <Check className="h-3.5 w-3.5 text-[rgb(var(--sa-soft))]" /> : <ClipboardCheck className="h-3.5 w-3.5 text-[rgb(var(--info))]" />}{item}</div>
                ))}
              </div>
            </div>
          </div>
        </ShellCard>
      </div>
    </>
  );
}

// Provenance badge — makes every figure's lane explicit (filed / derived /
// illustrative / unknown), per the data-provenance ground rules.
function Prov({ kind }: { kind: 'filed' | 'derived' | 'illustrative' | 'unknown' }) {
  const map = {
    filed: ['Filed · 990', 'bg-[rgb(var(--info)/0.12)] text-[rgb(var(--info))]'],
    derived: ['Derived', 'bg-[rgb(var(--line)/0.07)] text-[rgb(var(--text-2))]'],
    illustrative: ['Illustrative', 'bg-amber-300/10 text-amber-800 dark:text-amber-200'],
    unknown: ['Unknown', 'bg-rose-300/10 text-rose-700 dark:text-rose-200'],
  } as const;
  const [label, cls] = map[kind];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${cls}`}>{label}</span>;
}

type ProgramAllocationBasis = 'direct-expense' | 'revenue' | 'headcount';

function ProgramFullCostPanel() {
  const [basis, setBasis] = useState<ProgramAllocationBasis>('direct-expense');
  const [allocationPercent, setAllocationPercent] = useState(100);
  const [headcounts, setHeadcounts] = useState<Record<string, number>>({
    'Trail Building': 24,
    'Chapters & Programs': 16,
    'Conservation & Advocacy': 4,
  });
  const programs = publicFinancialFacts.programLines2024;
  const supportPool =
    publicFinancialFacts.managementAndGeneral2024 +
    publicFinancialFacts.fundraisingExpense2024;
  const allocatedPool = Math.round(supportPool * (allocationPercent / 100));
  const resultProvenance = basis === 'headcount' ? 'illustrative' : 'derived';

  const rows = useMemo(() => {
    const weightFor = (program: (typeof programs)[number]) => {
      if (basis === 'revenue') return program.revenue;
      if (basis === 'headcount') return headcounts[program.name] ?? 1;
      return program.directExpense;
    };
    const totalWeight = programs.reduce(
      (sum, program) => sum + weightFor(program),
      0,
    );
    let assignedSupport = 0;
    return programs.map((program, index) => {
      const allocatedSupport =
        index === programs.length - 1
          ? allocatedPool - assignedSupport
          : Math.round(allocatedPool * (weightFor(program) / totalWeight));
      assignedSupport += allocatedSupport;
      const directSpread = program.revenue - program.directExpense;
      return {
        ...program,
        directSpread,
        allocatedSupport,
        fullyLoadedResult: directSpread - allocatedSupport,
      };
    });
  }, [allocatedPool, basis, headcounts, programs]);

  const totals = rows.reduce(
    (sum, row) => ({
      revenue: sum.revenue + row.revenue,
      directExpense: sum.directExpense + row.directExpense,
      directSpread: sum.directSpread + row.directSpread,
      allocatedSupport: sum.allocatedSupport + row.allocatedSupport,
      fullyLoadedResult: sum.fullyLoadedResult + row.fullyLoadedResult,
    }),
    {
      revenue: 0,
      directExpense: 0,
      directSpread: 0,
      allocatedSupport: 0,
      fullyLoadedResult: 0,
    },
  );
  const trail = rows[0];
  const basisOptions: Array<{
    value: ProgramAllocationBasis;
    label: string;
    provenance: 'filed' | 'illustrative';
  }> = [
    { value: 'direct-expense', label: 'Direct expense', provenance: 'filed' },
    { value: 'revenue', label: 'Program revenue', provenance: 'filed' },
    { value: 'headcount', label: 'Headcount', provenance: 'illustrative' },
  ];

  return (
    <section className="space-y-5" aria-labelledby="program-full-cost-title">
      <div className="rounded-2xl border border-[rgb(var(--info)/0.2)] bg-[rgb(var(--info)/0.05)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p id="program-full-cost-title" className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text))]">
            2024 program economics
          </p>
          <Prov kind="filed" />
        </div>
        <p className="mt-1.5 max-w-5xl text-[11px] leading-5 text-[rgb(var(--text-2))]">
          Trail Building shows a <span className="font-semibold text-[rgb(var(--text))]">$378,881 direct spread</span> on Form 990 Part III. That is not a margin: the program lines carry no allocated share of the filed $712,130 of management and general expense or $461,859 of fundraising expense.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4">
          <div className="flex items-start justify-between gap-2"><p className="text-[11px] font-black uppercase text-[rgb(var(--text-3))]">Trail direct spread</p><Prov kind="derived" /></div>
          <p className="mt-3 font-mono text-2xl font-semibold text-[rgb(var(--sa-soft))]">{accounting(trail.directSpread, { symbol: true })}</p>
          <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">Revenue less direct program expense only</p>
        </div>
        <div className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4">
          <div className="flex items-start justify-between gap-2"><p className="text-[11px] font-black uppercase text-[rgb(var(--text-3))]">Shared support pool</p><Prov kind="filed" /></div>
          <p className="mt-3 font-mono text-2xl font-semibold text-[rgb(var(--text))]">{accounting(supportPool, { symbol: true })}</p>
          <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">M&amp;G plus fundraising, Form 990 Part IX</p>
        </div>
        <div className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4">
          <div className="flex items-start justify-between gap-2"><p className="text-[11px] font-black uppercase text-[rgb(var(--text-3))]">Trail fully-loaded result</p><Prov kind={resultProvenance} /></div>
          <p className={`mt-3 font-mono text-2xl font-semibold ${trail.fullyLoadedResult >= 0 ? 'text-[rgb(var(--sa-soft))]' : 'text-rose-700 dark:text-rose-200'}`}>{accounting(trail.fullyLoadedResult, { symbol: true })}</p>
          <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">After {accounting(trail.allocatedSupport, { symbol: true })} of allocated support</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <ShellCard className="min-w-0 xl:col-span-8">
          <Heading eyebrow="Functional → fully loaded" title="The spread changes when shared support is assigned" detail="2024 filed source rows" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase text-[rgb(var(--text-3))]">
                  <th className="px-5 py-3">Program</th>
                  <th className="px-3 py-3 text-right"><span className="inline-flex items-center gap-2">Revenue <Prov kind="filed" /></span></th>
                  <th className="px-3 py-3 text-right"><span className="inline-flex items-center gap-2">Direct expense <Prov kind="filed" /></span></th>
                  <th className="px-3 py-3 text-right"><span className="inline-flex items-center gap-2">Direct spread <Prov kind="derived" /></span></th>
                  <th className="px-3 py-3 text-right"><span className="inline-flex items-center gap-2">Support <Prov kind={resultProvenance} /></span></th>
                  <th className="px-5 py-3 text-right"><span className="inline-flex items-center gap-2">Full result <Prov kind={resultProvenance} /></span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.name} className={`border-b border-[rgb(var(--line)/0.055)] ${row.name === 'Trail Building' ? 'bg-[rgb(var(--sa)/0.035)]' : ''}`}>
                    <td className="px-5 py-4 text-xs font-semibold text-[rgb(var(--text))]">{row.name}</td>
                    <td className="px-3 py-4 text-right font-mono text-xs text-[rgb(var(--text))]">{accounting(row.revenue, { symbol: true })}</td>
                    <td className="px-3 py-4 text-right font-mono text-xs text-[rgb(var(--text))]">{accounting(row.directExpense, { symbol: true })}</td>
                    <td className={`px-3 py-4 text-right font-mono text-xs font-semibold ${row.directSpread >= 0 ? 'text-[rgb(var(--sa-soft))]' : 'text-rose-700 dark:text-rose-200'}`}>{accounting(row.directSpread, { symbol: true })}</td>
                    <td className="px-3 py-4 text-right font-mono text-xs text-[rgb(var(--text-2))]">{accounting(row.allocatedSupport, { symbol: true })}</td>
                    <td className={`px-5 py-4 text-right font-mono text-xs font-semibold ${row.fullyLoadedResult >= 0 ? 'text-[rgb(var(--sa-soft))]' : 'text-rose-700 dark:text-rose-200'}`}>{accounting(row.fullyLoadedResult, { symbol: true })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[rgb(var(--line)/0.1)] bg-[rgb(var(--line)/0.025)] font-semibold">
                  <td className="px-5 py-4 text-[11px] font-black uppercase text-[rgb(var(--text))]">Program total</td>
                  <td className="px-3 py-4 text-right font-mono text-xs text-[rgb(var(--text))]">{accounting(totals.revenue, { symbol: true })}</td>
                  <td className="px-3 py-4 text-right font-mono text-xs text-[rgb(var(--text))]">{accounting(totals.directExpense, { symbol: true })}</td>
                  <td className="px-3 py-4 text-right font-mono text-xs text-rose-700 dark:text-rose-200">{accounting(totals.directSpread, { symbol: true })}</td>
                  <td className="px-3 py-4 text-right font-mono text-xs text-[rgb(var(--text-2))]">{accounting(totals.allocatedSupport, { symbol: true })}</td>
                  <td className="px-5 py-4 text-right font-mono text-xs text-rose-700 dark:text-rose-200">{accounting(totals.fullyLoadedResult, { symbol: true })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="border-t border-[rgb(var(--line)/0.06)] px-5 py-3 text-[11px] leading-5 text-[rgb(var(--text-3))]">
            Revenue and direct expense are filed Part III values. Allocated support and fully-loaded results are management calculations, not filed program margins.
          </p>
        </ShellCard>

        <ShellCard className="min-w-0 xl:col-span-4">
          <Heading eyebrow="Allocation model" title="Choose the management lens" detail={`${allocationPercent}% of support assigned`} />
          <div className="space-y-5 p-5">
            <div>
              <p className="text-[11px] font-black uppercase text-[rgb(var(--text-3))]">Allocation basis</p>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.025)] p-1">
                {basisOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBasis(option.value)}
                    aria-pressed={basis === option.value}
                    title={`${option.label} basis · ${option.provenance}`}
                    className={`min-h-10 rounded-lg px-2 py-2 text-[11px] font-bold transition ${basis === option.value ? 'bg-[rgb(var(--sa))] text-[rgb(var(--sa-ink))]' : 'text-[rgb(var(--text-2))] hover:bg-[rgb(var(--line)/0.05)]'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="flex items-center justify-between gap-3 text-[11px] font-black uppercase text-[rgb(var(--text-3))]">
                Support assigned to programs
                <span className="font-mono text-sm text-[rgb(var(--text))]">{allocationPercent}%</span>
              </span>
              <span className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllocationPercent((current) => Math.max(0, current - 5))}
                  disabled={allocationPercent === 0}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--line)/0.09)] text-[rgb(var(--text-2))] transition hover:bg-[rgb(var(--line)/0.05)] disabled:opacity-35"
                  aria-label="Decrease program support allocation"
                  title="Decrease by 5 percentage points"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={allocationPercent}
                  onChange={(event) => setAllocationPercent(Number(event.target.value))}
                  className="min-w-0 flex-1 accent-[rgb(var(--sa))]"
                  aria-label="Percentage of shared support assigned to programs"
                />
                <button
                  type="button"
                  onClick={() => setAllocationPercent((current) => Math.min(100, current + 5))}
                  disabled={allocationPercent === 100}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--line)/0.09)] text-[rgb(var(--text-2))] transition hover:bg-[rgb(var(--line)/0.05)] disabled:opacity-35"
                  aria-label="Increase program support allocation"
                  title="Increase by 5 percentage points"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </span>
              <span className="mt-2 flex justify-between text-[11px] text-[rgb(var(--text-4))]"><span>0%</span><span>100%</span></span>
            </label>

            {basis === 'headcount' ? (
              <div className="space-y-2 border-t border-[rgb(var(--line)/0.07)] pt-4">
                <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-black uppercase text-[rgb(var(--text-3))]">Program FTE assumptions</p><Prov kind="illustrative" /></div>
                {programs.map((program) => (
                  <label key={program.name} className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--line)/0.06)] px-3 py-2">
                    <span className="text-[11px] text-[rgb(var(--text-2))]">{program.name}</span>
                    <input
                      type="number"
                      min={1}
                      max={56}
                      value={headcounts[program.name]}
                      onChange={(event) => setHeadcounts((current) => ({ ...current, [program.name]: Math.max(1, Number(event.target.value) || 1) }))}
                      className="w-16 rounded-lg border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] px-2 py-1.5 text-right font-mono text-xs text-[rgb(var(--text))] outline-none"
                      aria-label={`${program.name} illustrative headcount`}
                    />
                  </label>
                ))}
              </div>
            ) : null}

            <div className="border-t border-[rgb(var(--line)/0.07)] pt-4">
              <div className="flex items-center justify-between gap-3"><span className="text-[11px] text-[rgb(var(--text-3))]">Support allocated</span><span className="font-mono text-xs font-semibold text-[rgb(var(--text))]">{accounting(allocatedPool, { symbol: true })}</span></div>
              <div className="mt-2 flex items-center justify-between gap-3"><span className="text-[11px] text-[rgb(var(--text-3))]">Support left unassigned</span><span className="font-mono text-xs text-[rgb(var(--text-2))]">{accounting(supportPool - allocatedPool, { symbol: true })}</span></div>
            </div>

            <div className={`rounded-2xl border p-4 ${trail.fullyLoadedResult >= 0 ? 'border-[rgb(var(--sa)/0.2)] bg-[rgb(var(--sa)/0.05)]' : 'border-rose-300/20 bg-rose-300/[0.05]'}`}>
              <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-black uppercase text-[rgb(var(--text))]">Trail Building result</p><Prov kind={resultProvenance} /></div>
              <p data-testid="trail-fully-loaded-result" className={`mt-3 font-mono text-3xl font-semibold ${trail.fullyLoadedResult >= 0 ? 'text-[rgb(var(--sa-soft))]' : 'text-rose-700 dark:text-rose-200'}`}>{accounting(trail.fullyLoadedResult, { symbol: true })}</p>
              <p className="mt-2 text-[11px] leading-5 text-[rgb(var(--text-3))]">The filed direct spread falls by {accounting(trail.allocatedSupport, { symbol: true })} under this allocation model.</p>
            </div>
          </div>
        </ShellCard>
      </div>
    </section>
  );
}

// Cost of labor — IMBA leases its entire workforce through a PEO and files no
// W-2s (2024 Form 990, Schedule O). The PEO reimbursement is reported on Part IX
// lines 5-10. This decomposes it, builds the loaded rate, and shows where public
// data runs out (the PEO fee and workers-comp premium live inside the invoice).
function CostOfLabor() {
  const comp: Array<[string, number]> = [
    ['Line 7 · Other salaries and wages', 2_820_457],
    ['Line 5 · Officer + key-employee comp', 188_977],
    ['Line 10 · Payroll taxes', 268_321],
    ['Line 9 · Other employee benefits', 189_015],
    ['Line 8 · Pension plan contributions', 59_144],
  ];
  const totalComp = comp.reduce((s, [, v]) => s + v, 0); // 3,525,914
  const baseWages = 2_820_457 + 188_977; // 3,009,434 (lines 5 + 7)
  const taxRate = 268_321 / baseWages; // 8.92%
  const benRate = (189_015 + 59_144) / baseWages; // 8.25%
  const totalExpense = 7_014_359;
  const loadedMult = totalComp / baseWages; // 1.1716
  const compPct = totalComp / totalExpense; // 50.3%

  const [wage, setWage] = useState(32);
  const hr = (n: number) => `$${n.toFixed(2)}`;
  const afterTax = wage * (1 + taxRate);
  const afterBen = wage * (1 + taxRate + benRate);

  const [perEmployee, setPerEmployee] = useState(false);

  return (
    <>
      <div className="rounded-2xl border border-[rgb(var(--info)/0.2)] bg-[rgb(var(--info)/0.05)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text))]">PEO-leased workforce</span>
          <Prov kind="filed" />
        </div>
        <p className="mt-1.5 text-[11px] leading-5 text-[rgb(var(--text-2))]">
          IMBA files no W-2s. All <span className="font-semibold text-[rgb(var(--text))]">56</span> employees are leased from a professional employer organization (PEO); IMBA reimburses the PEO, and the reimbursement is reported on Form 990 Part IX lines 5–10 (2024 Schedule O).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">Total compensation</p><Prov kind="filed" /></div><p className="mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] text-[rgb(var(--text))]">{money(totalComp)}</p><p className="mt-1.5 text-[11px] text-[rgb(var(--text-3))]">Part IX lines 5 + 7–10, 2024</p></div>
        <div className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">Comp · % of expense</p><Prov kind="derived" /></div><p className="mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] text-[rgb(var(--info))]">{(compPct * 100).toFixed(1)}%</p><p className="mt-1.5 text-[11px] text-[rgb(var(--text-3))]">Half of every dollar spent is labor</p></div>
        <div className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">Known loaded multiplier</p><Prov kind="derived" /></div><p className="mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] text-[rgb(var(--sa-soft))]">{loadedMult.toFixed(3)}×</p><p className="mt-1.5 text-[11px] text-[rgb(var(--text-3))]">Wages → taxes + benefits (public only)</p></div>
        <div className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">Leased headcount</p><Prov kind="filed" /></div><p className="mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] text-[rgb(var(--text))]">56</p><p className="mt-1.5 text-[11px] text-[rgb(var(--text-3))]">All via the PEO (Sch O)</p></div>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <ShellCard className="xl:col-span-6">
          <Heading eyebrow="Invoice → ledger" title="One PEO reimbursement, five filed lines" detail="Foots exactly to the 990" />
          <div className="p-5">
            <div className="space-y-2">
              {comp.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.02)] px-3 py-2.5">
                  <span className="text-[11px] text-[rgb(var(--text-2))]">{label}</span>
                  <span className="font-mono text-xs font-semibold text-[rgb(var(--text))]">{money(value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--sa)/0.2)] bg-[rgb(var(--sa)/0.06)] px-3 py-3">
              <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[rgb(var(--sa-soft))]">Total PEO reimbursement <Prov kind="filed" /></span>
              <span className="font-mono text-sm font-semibold text-[rgb(var(--sa-soft))]">{money(totalComp)}</span>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[rgb(var(--text-3))]">The five lines foot exactly to the reimbursement — IMBA already decomposes the invoice correctly. The open question is what the single invoice does <span className="italic">not</span> break out.</p>
          </div>
        </ShellCard>

        <ShellCard className="xl:col-span-6">
          <Heading eyebrow="Loaded-rate builder" title="Where public data runs out" detail="Illustrative base wage" />
          <div className="p-5">
            <label className="flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">
              Illustrative base wage ($/hr)
              <input type="number" min={15} max={120} value={wage} onChange={(e) => setWage(Number(e.target.value) || 0)} className="w-24 rounded-lg border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] px-3 py-1.5 text-right font-mono text-xs text-[rgb(var(--text))] outline-none" />
            </label>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.02)] px-3 py-2.5"><span className="flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]">Base wage <Prov kind="illustrative" /></span><span className="font-mono text-xs text-[rgb(var(--text))]">{hr(wage)}</span></div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.02)] px-3 py-2.5"><span className="flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]">+ Payroll taxes · {(taxRate * 100).toFixed(2)}% <Prov kind="filed" /></span><span className="font-mono text-xs text-[rgb(var(--text))]">{hr(afterTax)}</span></div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.02)] px-3 py-2.5"><span className="flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]">+ Benefits + pension · {(benRate * 100).toFixed(2)}% <Prov kind="filed" /></span><span className="font-mono text-xs font-semibold text-[rgb(var(--sa-soft))]">{hr(afterBen)}</span></div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-300/25 bg-rose-300/[0.05] px-3 py-2.5"><span className="flex items-center gap-2 text-[11px] text-rose-700 dark:text-rose-200">+ PEO administrative fee <Prov kind="unknown" /></span><span className="font-mono text-xs text-rose-700 dark:text-rose-200">inside the invoice</span></div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-300/25 bg-rose-300/[0.05] px-3 py-2.5"><span className="flex items-center gap-2 text-[11px] text-rose-700 dark:text-rose-200">+ Workers&#39; comp premium <Prov kind="unknown" /></span><span className="font-mono text-xs text-rose-700 dark:text-rose-200">inside the invoice</span></div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] px-3 py-3"><span className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text))]">True loaded cost</span><span className="font-mono text-sm font-semibold text-[rgb(var(--text))]">≥ {hr(afterBen)}</span></div>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-[rgb(var(--text-3))]">The public loaded rate stops at {loadedMult.toFixed(2)}×. The true rate is higher — the PEO fee and workers&#39; comp premium are bundled in the invoice and can&#39;t be isolated from public filings.</p>
          </div>
        </ShellCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ShellCard>
          <Heading eyebrow="Open question" title="Where does the PEO fee live?" />
          <div className="space-y-3 p-5">
            <p className="text-[11px] leading-5 text-[rgb(var(--text-2))]">The PEO administrative fee does not appear as its own Part IX line. It could plausibly sit inside:</p>
            {[['Compensation lines 5–10', money(totalComp)], ['Other fees for services · line 11g', money(656_882)], ['Office expenses · line 13', money(1_051_344)]].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.02)] px-3 py-2.5"><span className="text-[11px] text-[rgb(var(--text-2))]">{label}</span><span className="font-mono text-[11px] text-[rgb(var(--text-3))]">{value}</span></div>
            ))}
            <p className="text-[11px] leading-5 text-[rgb(var(--text-3))]">An open question, not an allegation — resolving it needs the PEO invoice detail. <Prov kind="derived" /></p>
          </div>
        </ShellCard>

        <ShellCard>
          <Heading eyebrow="Compliance control" title="Grant documentation adequacy" />
          <div className="space-y-4 p-5">
            <div className="flex gap-2">
              <button type="button" onClick={() => setPerEmployee(false)} className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-bold transition ${!perEmployee ? 'bg-[rgb(var(--sa))] text-[rgb(var(--sa-ink))]' : 'border border-[rgb(var(--line)/0.08)] text-[rgb(var(--text-2))]'}`}>Aggregate reimbursement</button>
              <button type="button" onClick={() => setPerEmployee(true)} className={`flex-1 rounded-xl px-3 py-2 text-[11px] font-bold transition ${perEmployee ? 'bg-[rgb(var(--sa))] text-[rgb(var(--sa-ink))]' : 'border border-[rgb(var(--line)/0.08)] text-[rgb(var(--text-2))]'}`}>Per-employee, coded</button>
            </div>
            {perEmployee ? (
              <div className="rounded-2xl border border-[rgb(var(--sa)/0.2)] bg-[rgb(var(--sa)/0.05)] p-4">
                <div className="flex items-center gap-2"><Check className="h-4 w-4 text-[rgb(var(--sa-soft))]" /><span className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--sa-soft))]">Sufficient</span></div>
                <p className="mt-2 text-[11px] leading-5 text-[rgb(var(--text-2))]">Per-employee labor detail with project, grant, and funding-source coding supports federal or state cost reimbursement and allowable-cost tests.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-300/25 bg-rose-300/[0.05] p-4">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-rose-700 dark:text-rose-200" /><span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-200">Insufficient</span></div>
                <p className="mt-2 text-[11px] leading-5 text-[rgb(var(--text-2))]">A single aggregate PEO reimbursement cannot support grant cost reimbursement — there is no per-employee, per-project labor allocation to certify.</p>
              </div>
            )}
            <p className="text-[11px] leading-5 text-[rgb(var(--text-3))]">This is the whole compliance argument in one control: the PEO invoice is a starting point, not the documentation.</p>
          </div>
        </ShellCard>
      </div>
    </>
  );
}

function FinanceCalendar() {
  const calendar = [
    { date: 'Jul 18', item: 'Project estimates to complete due', owner: 'Project leads', type: 'Close', status: 'Action' },
    { date: 'Jul 19', item: 'PEO payroll settlement + labor allocation', owner: 'Finance + People', type: 'Payroll', status: 'In progress' },
    { date: 'Jul 22', item: 'June monthly close certification', owner: 'Finance', type: 'Close', status: 'On track' },
    { date: 'Jul 24', item: 'Equipment invoice decision', owner: 'Kent', type: 'Payable', status: 'Decision' },
    { date: 'Jul 31', item: 'Foundation reimbursement package', owner: 'Finance + program', type: 'Grant', status: 'Action' },
    { date: 'Aug 05', item: 'Chapter settlement cycle locked', owner: 'Finance', type: 'Chapter', status: 'Scheduled' },
    { date: 'Aug 10', item: 'Chapter reporting packets due', owner: 'Chapter treasurers', type: 'Network', status: 'Scheduled' },
    { date: 'Aug 15', item: 'CEO + Board finance packet', owner: 'Finance Director', type: 'Reporting', status: 'Scheduled' },
  ];
  return <div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-8"><Heading eyebrow="Owned financial rhythm" title="Upcoming deadlines + transaction events" detail="Close · cash · grants · chapters" /><div className="divide-y divide-[rgb(var(--line)/0.06)]">{calendar.map((event) => <div key={`${event.date}-${event.item}`} className="grid gap-3 px-5 py-4 sm:grid-cols-[72px_1.4fr_1fr_.7fr_auto]"><span className="font-mono text-xs font-semibold text-[rgb(var(--sa-soft))]">{event.date}</span><div><p className="text-xs font-semibold text-[rgb(var(--text))]">{event.item}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{event.type}</p></div><span className="self-center text-[11px] text-[rgb(var(--text-2))]">{event.owner}</span><span className="self-center text-[11px] text-[rgb(var(--text-3))]">Evidence required</span><span className={`self-center rounded-full px-2 py-1 text-[11px] font-black uppercase ${event.status === 'Action' || event.status === 'Decision' ? 'bg-amber-300/10 text-amber-800 dark:text-amber-100' : event.status === 'On track' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : 'bg-cyan-300/10 text-cyan-700 dark:text-cyan-100'}`}>{event.status}</span></div>)}</div></ShellCard><ShellCard className="xl:col-span-4"><Heading eyebrow="Recurring cadence" title="The finance operating calendar" /><div className="space-y-3 p-5">{[['Daily', 'Bank feeds, processor totals, AR actions'], ['Weekly', 'Cash forecast, AP approvals, project EAC'], ['Biweekly', 'Payroll allocation, grant draw review'], ['Monthly', 'Close, chapter settlements, CEO brief'], ['Quarterly', 'Forecast reset, Board packet, restrictions'], ['Annual', 'Budget, audit, 990, filings, policies']].map(([cadence, work]) => <div key={cadence} className="rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-3"><p className="text-[11px] font-black uppercase text-[rgb(var(--sa-soft))]">{cadence}</p><p className="mt-1 text-[11px] leading-4 text-[rgb(var(--text-2))]">{work}</p></div>)}</div></ShellCard></div>;
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
  return <ShellCard><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Canonical financial vocabulary</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Parent + chapter account crosswalk</h2></div><label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.025)] px-3 py-2"><Search className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search accounts" className="w-40 bg-transparent text-[11px] text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-4))]" /></label></div><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left"><thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]"><th className="px-5 py-3">Account</th><th className="px-3 py-3">Name</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Applies to</th><th className="px-5 py-3">Required dimension</th></tr></thead><tbody>{accounts.map(([number, name, type, applies, dimension]) => <tr key={number} className="border-b border-[rgb(var(--line)/0.055)] last:border-0"><td className="px-5 py-3.5 font-mono text-xs text-[rgb(var(--sa-soft))]">{number}</td><td className="px-3 py-3.5 text-xs font-semibold text-[rgb(var(--text))]">{name}</td><td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{type}</td><td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{applies}</td><td className="px-5 py-3.5"><span className="rounded-full border border-[rgb(var(--sa)/0.10)] bg-[rgb(var(--sa)/0.04)] px-2 py-1 text-[11px] text-[rgb(var(--sa-soft))]">{dimension}</span></td></tr>)}</tbody></table></div></ShellCard>;
}

function TransactionsIntegrated({ onNavigate }: { onNavigate: (view: ImbaOsView) => void }) {
  const { queueSync } = useImbaOsState();
  const [jobId, setJobId] = useState('');
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-300/15 bg-violet-300/[0.045] px-4 py-3"><div><p className="text-[11px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-100">QuickBooks write-back gate</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">The form creates an IMBA-OS draft. Release to QuickBooks requires mapping validation and approval.</p></div><div className="flex gap-2"><button type="button" onClick={() => setJobId(queueSync({ system: 'qbo', action: 'create', recordType: 'Transaction draft', recordId: `DRAFT-${Date.now().toString().slice(-5)}`, summary: 'Validated bill or invoice draft from Finance workspace', requiresApproval: true }))} className="rounded-xl bg-violet-300 px-3 py-2 text-[11px] font-black uppercase text-[#171126]">Stage current draft</button><ImbaInfoTooltip label="Stage to QuickBooks" text="Turns the validated entry into an IMBA-OS draft and stages it for QuickBooks write-back. Mapping validation and human approval are required before posting; in demo mode nothing posts to QuickBooks — a queued job and audit entry are created." placement="below" align="left" /><button type="button" onClick={() => onNavigate('integration-sync')} className="rounded-xl border border-[rgb(var(--line)/0.1)] px-3 py-2 text-[11px] font-black uppercase text-[rgb(var(--text))]">Open sync queue</button></div>{jobId ? <p className="w-full text-[11px] font-semibold text-[rgb(var(--sa-soft))]">{jobId} staged; no QuickBooks posting has occurred.</p> : null}</div><Transactions /></div>;
}

function Transactions() {
  const [mode, setMode] = useState<'bill' | 'invoice'>('bill');
  const [saved, setSaved] = useState(false);
  const [amount, setAmount] = useState('');
  const fieldClass = 'mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--sa)/0.35)]';
  return <div className="grid gap-5 xl:grid-cols-12"><ShellCard className="xl:col-span-8"><div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Controlled entry</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{mode === 'bill' ? 'Enter vendor bill / chapter obligation' : 'Create client invoice / grant receivable'}</h2></div><div className="rounded-xl border border-[rgb(var(--line)/0.08)] p-1"><button type="button" onClick={() => { setMode('bill'); setSaved(false); }} className={`rounded-lg px-3 py-2 text-[11px] font-black ${mode === 'bill' ? 'bg-[rgb(var(--sa))] text-[rgb(var(--sa-ink))]' : 'text-[rgb(var(--text-3))]'}`}>Bill</button><button type="button" onClick={() => { setMode('invoice'); setSaved(false); }} className={`rounded-lg px-3 py-2 text-[11px] font-black ${mode === 'invoice' ? 'bg-[rgb(var(--sa))] text-[rgb(var(--sa-ink))]' : 'text-[rgb(var(--text-3))]'}`}>Invoice</button></div></div><form onSubmit={(event) => { event.preventDefault(); setSaved(true); }} className="grid gap-4 p-5 md:grid-cols-2"><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">{mode === 'bill' ? 'Vendor / chapter' : 'Customer / funder'}<input required className={fieldClass} placeholder={mode === 'bill' ? 'Select counterparty' : 'Select customer'} /></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Amount<input required value={amount} onChange={(event) => setAmount(event.target.value)} className={fieldClass} placeholder="$0.00" /></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Project / chapter / grant<select required className={fieldClass}><option value="">Select controlling record</option><option>Great Lakes Buildout</option><option>Evergreen Trails Foundation</option><option>Front Range MTB Alliance</option></select></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Account + function<select required className={fieldClass}><option>Choose canonical account</option><option>5200 · Project subcontractors</option><option>2140 · Due to chapters</option><option>4500 · Trail Solutions revenue</option></select></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Transaction date<input type="date" className={fieldClass} /></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Due / milestone date<input type="date" className={fieldClass} /></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))] md:col-span-2">Memo + evidence<textarea className={`${fieldClass} min-h-24`} placeholder="Business purpose, approval context, deliverable, or restriction..." /></label><div className="flex items-center justify-between gap-3 md:col-span-2"><p className="text-[11px] text-[rgb(var(--text-3))]">Required dimensions are validated before submission reaches approval.</p><button type="submit" className="rounded-xl bg-[rgb(var(--sa))] px-5 py-3 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Submit for approval</button></div>{saved ? <p className="flex items-center gap-2 text-[11px] text-[rgb(var(--sa-soft))] md:col-span-2"><Check className="h-3.5 w-3.5" /> Demo {mode} for {amount || '$0'} entered into the approval queue.</p> : null}</form></ShellCard><ShellCard className="xl:col-span-4"><Heading eyebrow="Transaction controls" title="What must travel with the money" /><div className="space-y-3 p-5">{['Counterparty identity and approval', 'Canonical account and functional class', 'Project, phase, chapter, or grant tag', 'Restriction / allowability evidence', 'Billing or payment milestone', 'Source document and audit trail'].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-[rgb(var(--line)/0.06)] px-3 py-2.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--sa)/0.10)] font-mono text-[11px] text-[rgb(var(--sa-soft))]">{index + 1}</span><span className="text-[11px] text-[rgb(var(--text-2))]">{item}</span></div>)}</div></ShellCard></div>;
}

// Real IMBA financials from filed Forms 990 (EIN 47-1254119), 2019–2024. Revenue
// and expenses as grouped bars; net assets as an overlaid line; the surplus or
// deficit for each year is annotated beneath. Colors follow the app language
// (lime = revenue, teal = expense) via theme tokens so it reads in both modes.
function FilingsTrend() {
  const data = financialHistory.filter((d) => d.year >= 2019);
  const axisMax = 8_000_000;
  const W = 760;
  const H = 250;
  const padL = 8;
  const padR = 8;
  const padTop = 16;
  const padBot = 50;
  const plotH = H - padTop - padBot;
  const plotW = W - padL - padR;
  const baseline = padTop + plotH;
  const slot = plotW / data.length;
  const barW = 22;
  const gap = 6;
  const yOf = (v: number) => padTop + plotH * (1 - v / axisMax);
  const xOf = (i: number) => padL + slot * i + slot / 2;
  const naLine = data.map((d, i) => `${xOf(i).toFixed(1)},${yOf(d.netAssets).toFixed(1)}`).join(' ');
  return (
    <ShellCard>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Verified history · Forms 990</p>
          <h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Six-year financial history (2019–2024)</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[rgb(var(--text-2))]">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-[rgb(var(--sa-soft))]" />Revenue</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-[rgb(var(--info))]" />Expenses</span>
          <span className="flex items-center gap-1.5"><span className="h-[3px] w-4 rounded-full bg-[rgb(var(--text))]" />Net assets</span>
        </div>
      </div>
      <div className="p-5">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="IMBA revenue, expenses, and net assets 2019 to 2024 from filed Forms 990">
          {[2_000_000, 4_000_000, 6_000_000, 8_000_000].map((g) => (
            <g key={g}>
              <line x1={padL} x2={W - padR} y1={yOf(g)} y2={yOf(g)} className="stroke-[rgb(var(--line)/0.08)]" />
              <text x={padL} y={yOf(g) - 4} fontSize="10" className="fill-[rgb(var(--text-4))]">{`$${g / 1_000_000}M`}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = xOf(i);
            return (
              <g key={d.year}>
                <rect x={cx - barW - gap / 2} y={yOf(d.revenue)} width={barW} height={baseline - yOf(d.revenue)} rx="3" className="fill-[rgb(var(--sa-soft))]" />
                <rect x={cx + gap / 2} y={yOf(d.expenses)} width={barW} height={baseline - yOf(d.expenses)} rx="3" className="fill-[rgb(var(--info))]" />
                <text x={cx} y={baseline + 18} fontSize="12" fontWeight="700" textAnchor="middle" className="fill-[rgb(var(--text-2))]">{d.year}</text>
                <text x={cx} y={baseline + 33} fontSize="11" fontWeight="600" textAnchor="middle" className={d.net < 0 ? 'fill-rose-700 dark:fill-rose-300' : 'fill-[rgb(var(--sa-soft))]'}>
                  {`${d.net < 0 ? '−' : '+'}$${Math.round(Math.abs(d.net) / 1000)}K`}
                </text>
              </g>
            );
          })}
          <polyline points={naLine} className="fill-none stroke-[rgb(var(--text))]" strokeWidth="2" strokeLinejoin="round" />
          {data.map((d, i) => (
            <circle key={d.year} cx={xOf(i)} cy={yOf(d.netAssets)} r="3.5" strokeWidth="2" className="fill-[rgb(var(--card))] stroke-[rgb(var(--text))]" />
          ))}
        </svg>
        <p className="mt-4 text-[11px] leading-5 text-[rgb(var(--text-3))]">
          Source: IMBA Forms 990, tax years 2019–2024 (EIN 47-1254119). Revenue grew from $5.14M to $7.20M; the 2023 operating deficit
          (−$558K) drew on reserves, followed by a return to surplus (+$190K) in 2024. Net assets grew from $1.57M to $3.75M — reserves
          built roughly 2.4× over five years.
        </p>
      </div>
    </ShellCard>
  );
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
        <Kpi label="Deployable cash" value="$1.74M" note="Modeled · base scenario — see Liquidity runway for the bridge" tone="lime" />
        <Kpi label="Monthly close" value="24 / 28" note="Four control steps remain · target Jul 22" tone="amber" />
      </div>

      <FilingsTrend />

      <div className="grid gap-5 xl:grid-cols-12">
        <ShellCard className="xl:col-span-8">
          <Heading eyebrow="Finance home" title="One click into every accounting workflow" detail="Budget, grants, AP/AR, and reporting" />
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {launchers.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} type="button" onClick={() => onNavigate(item.view)} className="group rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4 text-left transition hover:border-[rgb(var(--sa)/0.25)] hover:bg-[rgb(var(--sa)/0.04)]">
                  <div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-[rgb(var(--sa)/0.10)] p-2 text-[rgb(var(--sa-soft))]"><Icon className="h-4 w-4" /></span><ArrowRight className="h-4 w-4 text-[rgb(var(--text-4))] transition group-hover:translate-x-1 group-hover:text-[rgb(var(--sa-soft))]" /></div>
                  <h3 className="mt-4 text-sm font-semibold text-[rgb(var(--text))]">{item.title}</h3>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px]"><span className="text-[rgb(var(--text-3))]">{item.note}</span><span className="font-mono font-semibold text-[rgb(var(--sa-soft))]">{item.value}</span></div>
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
              <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.02)] px-3 py-2.5">
                <span className="text-[11px] text-[rgb(var(--text-2))]">{label}</span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${status === 'Complete' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : status === 'Review' ? 'bg-cyan-300/10 text-cyan-700 dark:text-cyan-100' : 'bg-amber-300/10 text-amber-800 dark:text-amber-100'}`}>{status}</span>
              </div>
            ))}
          </div>
        </ShellCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ShellCard><Heading eyebrow="Working capital" title="Cash conversion" /><div className="space-y-3 p-5"><Kpi label="Receivables + unbilled" value={money(ar)} note="$96K is over 60 days" tone="amber" /><Kpi label="Approved + pending payables" value={money(ap)} note="Includes chapter settlement reserve" tone="teal" /></div></ShellCard>
        <ShellCard><Heading eyebrow="Restricted funding" title="Grant portfolio" /><div className="p-5"><p className="font-mono text-3xl font-semibold text-[rgb(var(--text))]">{money(grantRemaining)}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">Unspent award balance across the illustrative active portfolio</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]"><div className="h-full rounded-full bg-[#68b9aa]" style={{ width: `${Math.round((imbaGrants.reduce((s, g) => s + g.spent, 0) / imbaGrants.reduce((s, g) => s + g.award, 0)) * 100)}%` }} /></div><p className="mt-2 text-[11px] text-[rgb(var(--text-3))]">{Math.round((imbaGrants.reduce((s, g) => s + g.spent, 0) / imbaGrants.reduce((s, g) => s + g.award, 0)) * 100)}% of awarded funds spent · {money(imbaGrants.reduce((s, g) => s + g.reimbursement, 0))} draws pending</p></div></ShellCard>
        <ShellCard><Heading eyebrow="Control signals" title="Finance action queue" /><div className="space-y-3 p-5">{['Collect Great Lakes invoice before next mobilization', 'Submit foundation reimbursement package by Jul 31', 'Resolve equipment invoice decision hold', 'Refresh three project estimates to complete'].map((item, index) => <div key={item} className="flex items-start gap-3"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${index < 2 ? 'bg-rose-300/10 text-rose-700 dark:text-rose-100' : 'bg-amber-300/10 text-amber-800 dark:text-amber-100'}`}>{index + 1}</span><p className="text-[11px] leading-5 text-[rgb(var(--text-2))]">{item}</p></div>)}</div></ShellCard>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Operating plan</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Budget by revenue engine + cost center</h2></div><select value={engine} onChange={(event) => setEngine(event.target.value)} className="rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] px-3 py-2 text-[11px] font-semibold text-[rgb(var(--text))] outline-none">{engines.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]"><th className="px-5 py-3">Line</th><th className="px-3 py-3">Engine</th><th className="px-3 py-3 text-right">Annual budget</th><th className="px-3 py-3 text-right">YTD budget</th><th className="px-3 py-3 text-right">YTD actual</th><th className="px-3 py-3 text-right">Variance</th><th className="px-5 py-3 text-right">Forecast</th></tr></thead><tbody>{rows.map((row) => { const variance = row.actual - row.ytdBudget; const risk = Math.abs(row.forecast - row.budget) / row.budget > .05; return <tr key={row.line} className="border-b border-[rgb(var(--line)/0.055)] last:border-0 hover:bg-[rgb(var(--line)/0.02)]"><td className="px-5 py-3.5 text-xs font-semibold text-[rgb(var(--text))]">{row.line}</td><td className="px-3 py-3.5"><span className="rounded-full border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.035)] px-2 py-1 text-[11px] text-[rgb(var(--text-2))]">{row.engine}</span></td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(row.budget)}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text-3))]">{money(row.ytdBudget)}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(row.actual)}</td><td className={`px-3 py-3.5 text-right font-mono text-xs ${Math.abs(variance) > row.ytdBudget * .08 ? 'text-amber-800 dark:text-amber-200' : 'text-[rgb(var(--sa-soft))]'}`}>{money(variance)}</td><td className={`px-5 py-3.5 text-right font-mono text-xs font-semibold ${risk ? 'text-amber-800 dark:text-amber-200' : 'text-[rgb(var(--sa-soft))]'}`}>{money(row.forecast)}</td></tr>; })}</tbody></table></div>
      </ShellCard>
      <div className="grid gap-5 lg:grid-cols-3"><ShellCard className="lg:col-span-2"><Heading eyebrow="Forecast bridge" title="What is moving the year-end result" /><div className="grid gap-3 p-5 sm:grid-cols-3">{[['Trail Services', '-$240K', 'Starts slipped; design mix lower'], ['Membership', '+$85K', 'Renewal pace above plan'], ['Shared services', '-$23K', 'Technology milestone costs']].map(([name, value, note]) => <div key={name} className="rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4"><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">{name}</p><p className={`mt-3 font-mono text-xl font-semibold ${value.startsWith('+') ? 'text-[rgb(var(--sa-soft))]' : 'text-amber-800 dark:text-amber-200'}`}>{value}</p><p className="mt-1 text-[11px] leading-4 text-[rgb(var(--text-3))]">{note}</p></div>)}</div></ShellCard><ShellCard><Heading eyebrow="Budget controls" title="Planning workflow" /><div className="space-y-3 p-5">{['Department owner submits forecast', 'Finance validates assumptions', 'Kent selects management case', 'Board sees approved variance bridge'].map((item, index) => <div key={item} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--sa)/0.10)] font-mono text-[11px] text-[rgb(var(--sa-soft))]">{index + 1}</span><p className="text-[11px] text-[rgb(var(--text-2))]">{item}</p></div>)}</div></ShellCard></div>
    </>
  );
}

function GrantsIntegrated({ onNavigate }: { onNavigate: (view: ImbaOsView) => void }) {
  const { getEditedRecord, updateRecord } = useImbaOsState();
  const [selectedId, setSelectedId] = useState(imbaGrants[1].id);
  const selected = getEditedRecord('grant', selectedId, imbaGrants.find((grant) => grant.id === selectedId) ?? imbaGrants[0]);
  const updateSpent = (spent: number) => updateRecord('grant', selected.id, { spent, remaining: Math.max(0, selected.award - spent) }, { actor: 'Grant accountant', detail: `Updated allowable spend and award balance for ${selected.id}.`, queue: { system: 'qbo', action: 'update', recordType: 'Grant coding summary', recordId: selected.id, summary: `${selected.funder} · allowable spend ${money(spent)}`, requiresApproval: true } });
  return <div className="space-y-4"><div className="grid gap-4 rounded-2xl border border-[rgb(var(--sa)/0.15)] bg-[rgb(var(--sa)/0.04)] p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]"><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Award<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none">{imbaGrants.map((grant) => <option key={grant.id} value={grant.id}>{grant.id} · {grant.funder}</option>)}</select></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Allowable spend<input type="number" min="0" max={selected.award} value={selected.spent} onChange={(event) => updateSpent(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none" /></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Control status<select value={selected.status} onChange={(event) => updateRecord('grant', selected.id, { status: event.target.value }, { actor: 'Grant accountant', detail: `Updated grant control status for ${selected.id}.` })} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none"><option>On track</option><option>Draw due</option><option>Watch</option></select></label><div className="self-end rounded-xl border border-[rgb(var(--line)/0.08)] px-4 py-2.5"><p className="text-[11px] font-black uppercase text-[rgb(var(--sa-soft))]">Control subledger</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">Edits persist · QBO tie-out queued · audit retained</p></div></div><Grants onNavigate={onNavigate} /></div>;
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Award register</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Restriction + draw + deadline control</h2></div><div className="flex gap-1">{['All', 'On track', 'Draw due', 'Watch'].map((item) => <button key={item} type="button" onClick={() => setStatus(item)} className={`rounded-lg px-2.5 py-2 text-[11px] font-bold ${status === item ? 'bg-[rgb(var(--sa))] text-[rgb(var(--sa-ink))]' : 'border border-[rgb(var(--line)/0.08)] text-[rgb(var(--text-2))]'}`}>{item}</button>)}</div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]"><th className="px-5 py-3">Funder + program</th><th className="px-3 py-3 text-right">Award</th><th className="px-3 py-3">Burn</th><th className="px-3 py-3 text-right">Remaining</th><th className="px-3 py-3">Next deadline</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{rows.map((grant) => { const burn = Math.round((grant.spent / grant.award) * 100); return <tr key={grant.id} onClick={() => setSelectedId(grant.id)} className={`cursor-pointer border-b border-[rgb(var(--line)/0.055)] last:border-0 hover:bg-[rgb(var(--line)/0.03)] ${selectedId === grant.id ? 'bg-[rgb(var(--sa)/0.035)]' : ''}`}><td className="px-5 py-3.5"><p className="text-xs font-semibold text-[rgb(var(--text))]">{grant.funder}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{grant.id} · {grant.program}</p></td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(grant.award)}</td><td className="px-3 py-3.5"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-[rgb(var(--line)/0.08)]"><div className="h-full rounded-full bg-[#68b9aa]" style={{ width: `${burn}%` }} /></div><span className="font-mono text-[11px] text-[rgb(var(--text-2))]">{burn}%</span></div></td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--sa-soft))]">{money(grant.remaining)}</td><td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{grant.nextDeadline}</td><td className="px-5 py-3.5"><span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${grant.status === 'On track' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : grant.status === 'Draw due' ? 'bg-cyan-300/10 text-cyan-700 dark:text-cyan-100' : 'bg-amber-300/10 text-amber-800 dark:text-amber-100'}`}>{grant.status}</span></td></tr>; })}</tbody></table></div>
        </ShellCard>
        <ShellCard className="xl:col-span-4"><Heading eyebrow={`${selected.id} · selected award`} title={selected.funder} /><div className="space-y-4 p-5"><div><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Restriction</p><p className="mt-1 text-xs leading-5 text-[rgb(var(--text))]">{selected.restriction}</p></div><div className="grid grid-cols-2 gap-3"><Kpi label="Remaining" value={money(selected.remaining)} note="Award balance" /><Kpi label="Draw pending" value={money(selected.reimbursement)} note="Receivable / action" tone={selected.reimbursement ? 'amber' : 'teal'} /></div><div className="rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4"><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Next controls</p><div className="mt-3 space-y-2">{['Validate allowable-cost coding', 'Reconcile payroll allocation', 'Attach evidence to reimbursement', 'Route narrative data to program owner'].map((item, index) => <div key={item} className="flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]">{index < 2 ? <Check className="h-3.5 w-3.5 text-[rgb(var(--sa-soft))]" /> : <CalendarClock className="h-3.5 w-3.5 text-amber-800 dark:text-amber-200" />}{item}</div>)}</div></div><button type="button" onClick={() => onNavigate('development-grant-pipeline')} className="w-full rounded-xl bg-[rgb(var(--sa))] px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[rgb(var(--sa-ink))]">Open grant workspace</button></div></ShellCard>
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
          <div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Cash conversion · collections</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Accounts receivable + unbilled work</h2></div>
          <p className="text-[11px] text-[rgb(var(--text-3))]">Vendor bills live in <span className="text-[rgb(var(--sa-soft))]">Money → Accounts payable</span></p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]"><th className="px-5 py-3">Customer / project</th><th className="px-3 py-3">Reference</th><th className="px-3 py-3 text-right">Amount</th><th className="px-3 py-3 text-right">Age</th><th className="px-3 py-3">Due</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
            <tbody>{receivables.map((row) => (
              <tr key={row.ref} className={`border-b border-[rgb(var(--line)/0.055)] last:border-0 ${selectedReceivable?.ref === row.ref ? 'bg-[rgb(var(--sa)/0.035)]' : ''}`}>
                <td className="px-5 py-3.5"><p className="text-xs font-semibold text-[rgb(var(--text))]">{row.customer}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{row.project}</p></td>
                <td className="px-3 py-3.5 font-mono text-[11px] text-[rgb(var(--text-2))]">{row.ref}</td>
                <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(row.amount)}</td>
                <td className={`px-3 py-3.5 text-right font-mono text-xs ${row.age > 45 ? 'text-rose-700 dark:text-rose-200' : row.age > 30 ? 'text-amber-800 dark:text-amber-200' : 'text-[rgb(var(--sa-soft))]'}`}>{row.age ? `${row.age}d` : '—'}</td>
                <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{row.due}</td>
                <td className="px-5 py-3.5"><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedRef(row.ref)} className="flex items-center gap-1.5 rounded-lg border border-[rgb(var(--line)/0.1)] px-3 py-2 text-[11px] font-bold text-[rgb(var(--text))] hover:bg-[rgb(var(--line)/0.05)]"><Eye className="h-3 w-3" /> View</button>{row.status !== 'Current' ? <button type="button" disabled={row.followUpQueued} onClick={() => queueFollowUp(row)} className="rounded-lg bg-[rgb(var(--sa))] px-3 py-2 text-[11px] font-black text-[rgb(var(--sa-ink))] disabled:cursor-default disabled:bg-[rgb(var(--sa)/0.10)] disabled:text-[rgb(var(--sa-soft))]">{row.followUpQueued ? 'Follow-up queued' : 'Queue follow-up'}</button> : null}</div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {selectedReceivable ? (
          <div className="grid gap-4 border-t border-[rgb(var(--sa)/0.15)] bg-[rgb(var(--sa)/0.025)] p-5 lg:grid-cols-[1.4fr_1fr_auto]">
            <div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--sa-soft))]">Receivable detail / {selectedReceivable.ref}</p><h3 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{selectedReceivable.customer}</h3><p className="mt-2 text-[11px] leading-5 text-[rgb(var(--text-2))]">{selectedReceivable.project} · {selectedReceivable.status}. Viewing this record does not change its workflow state.</p></div>
            <div className="grid grid-cols-3 gap-2"><Kpi label="Amount" value={money(selectedReceivable.amount)} note="Open balance" /><Kpi label="Age" value={selectedReceivable.age ? `${selectedReceivable.age}d` : 'Unbilled'} note="As of demo date" tone={selectedReceivable.age > 30 ? 'amber' : 'teal'} /><Kpi label="Due" value={selectedReceivable.due} note="Collection milestone" tone="teal" /></div>
            <div className="flex items-start gap-2"><button type="button" disabled={selectedReceivable.followUpQueued} onClick={() => queueFollowUp(selectedReceivable)} className="rounded-xl bg-[rgb(var(--sa))] px-4 py-3 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))] disabled:bg-[rgb(var(--sa)/0.10)] disabled:text-[rgb(var(--sa-soft))]">{selectedReceivable.followUpQueued ? 'Follow-up queued' : 'Queue follow-up'}</button><button type="button" aria-label="Close receivable detail" onClick={() => setSelectedRef(null)} className="rounded-xl border border-[rgb(var(--line)/0.1)] p-3 text-[rgb(var(--text-2))]"><X className="h-4 w-4" /></button></div>
          </div>
        ) : null}
      </ShellCard>
    </>
  );
}

// ── Reporting period + QuickBooks source catalog ────────────────────────

function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fmtDay(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type ReportPeriod = { from: string; to: string; preset: string };

function buildPeriodPresets(): { key: string; label: string; from: string; to: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  const quarterStart = new Date(year, Math.floor(now.getMonth() / 3) * 3, 1);
  return [
    { key: 'this-month', label: 'This month', from: isoDay(new Date(year, now.getMonth(), 1)), to: isoDay(now) },
    { key: 'this-quarter', label: 'This quarter', from: isoDay(quarterStart), to: isoDay(now) },
    { key: 'ytd', label: 'Year to date', from: `${year}-01-01`, to: isoDay(now) },
    { key: 'last-year', label: `FY${year - 1}`, from: `${year - 1}-01-01`, to: `${year - 1}-12-31` },
    { key: 'fy2024', label: 'FY2024 · filed', from: '2024-01-01', to: '2024-12-31' },
  ];
}

const laneBadgeCls: Record<QboReportLane, string> = {
  'qbo-direct': 'bg-[rgb(var(--info)/0.12)] text-[rgb(var(--info))]',
  'qbo-config': 'bg-amber-300/10 text-amber-800 dark:text-amber-200',
  'imba-os': 'bg-[rgb(var(--sa)/0.12)] text-[rgb(var(--sa-soft))]',
};

function LaneBadge({ lane }: { lane: QboReportLane }) {
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${laneBadgeCls[lane]}`}>{qboLaneMeta[lane].label}</span>;
}

const filedAnnualReports = new Set([
  'Statement of Activities',
  'Statement of Financial Position',
  'Functional Expense Report',
  'Form 990 Workpapers',
  'Single-Audit Readiness Check',
]);

function Reports() {
  const { connectors, syncConnectorNow } = useImbaOsState();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(imbaReports[0]);
  const presets = useMemo(buildPeriodPresets, []);
  const ytd = presets.find((preset) => preset.key === 'ytd') ?? presets[0];
  const [period, setPeriod] = useState<ReportPeriod>({ from: ytd.from, to: ytd.to, preset: 'ytd' });
  const [qboQuery, setQboQuery] = useState('');
  const [qboLane, setQboLane] = useState<'All' | QboReportLane>('All');
  const [selectedQbo, setSelectedQbo] = useState<(QboCatalogReport & { category: string }) | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('imba-report-period-v1');
      if (raw) setPeriod(JSON.parse(raw) as ReportPeriod);
    } catch { /* stored period is optional */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem('imba-report-period-v1', JSON.stringify(period)); } catch { /* persistence is best-effort */ }
  }, [period]);
  const laneCounts = useMemo(() => {
    const counts: Record<QboReportLane, number> = { 'qbo-direct': 0, 'qbo-config': 0, 'imba-os': 0 };
    for (const group of qboReportCatalog) for (const report of group.reports) counts[report.lane] += 1;
    return counts;
  }, []);
  const qboGroups = qboReportCatalog
    .map((group) => ({ ...group, reports: group.reports.filter((report) => (qboLane === 'All' || report.lane === qboLane) && `${report.name} ${report.note ?? ''} ${group.category}`.toLowerCase().includes(qboQuery.toLowerCase())) }))
    .filter((group) => group.reports.length > 0);
  const categories = ['All', ...Array.from(new Set(imbaReports.map((report) => report.category)))];
  const rows = imbaReports.filter((report) => (category === 'All' || report.category === category) && `${report.name} ${report.description}`.toLowerCase().includes(query.toLowerCase()));
  const annualSelected = filedAnnualReports.has(selected.name);
  const openReport = (report: (typeof imbaReports)[number]) => {
    setSelected(report);
    if (filedAnnualReports.has(report.name)) setPeriod({ from: '2024-01-01', to: '2024-12-31', preset: 'fy2024' });
    window.requestAnimationFrame(() => document.getElementById('imba-report-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  return (
    <div className="grid gap-5 xl:grid-cols-12">
      <ShellCard className="xl:col-span-12">
        <div className="grid gap-4 p-5 lg:grid-cols-[1.2fr_2fr_auto] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[rgb(var(--sa-soft))]"><Database className="h-3.5 w-3.5" /> QuickBooks connection</p>
            <p className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">Connect once. Sync centrally. Run reports locally.</p>
          </div>
          <div className="grid gap-2 text-[11px] text-[rgb(var(--text-2))] sm:grid-cols-4">
            {['Authorize once with OAuth', 'Sync nightly + on demand', 'Store a governed IMBA-OS copy', 'Render and enrich reports here'].map((step, index) => <div key={step} className="rounded-xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] px-3 py-2"><span className="mr-1.5 font-mono text-[rgb(var(--sa-soft))]">{index + 1}</span>{step}</div>)}
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase ${connectors.qbo.mode === 'Production' && connectors.qbo.status === 'configured' ? 'bg-[rgb(var(--sa)/0.12)] text-[rgb(var(--sa-soft))]' : 'bg-amber-300/10 text-amber-800 dark:text-amber-200'}`}>{connectors.qbo.mode} · {connectors.qbo.status}</span>
            <button type="button" onClick={() => syncConnectorNow('qbo')} className="flex items-center gap-1.5 rounded-xl border border-[rgb(var(--line)/0.1)] px-3 py-2 text-[11px] font-black uppercase text-[rgb(var(--text))]"><RefreshCw className="h-3.5 w-3.5" /> Refresh demo copy</button>
            <p className="w-full text-right text-[11px] text-[rgb(var(--text-3))]">{connectors.qbo.lastSync}</p>
          </div>
        </div>
        <div className="border-t border-amber-300/20 bg-amber-300/[0.045] px-5 py-3 text-[11px] leading-5 text-[rgb(var(--text-2))]">
          This workspace is configured in <span className="font-semibold text-[rgb(var(--text))]">Demo mode</span>, not connected to IMBA&apos;s production QuickBooks company. No report below logs into QuickBooks or calls it when opened; production reports would read the latest governed sync already held by IMBA-OS.
        </div>
      </ShellCard>
      <ShellCard className="xl:col-span-12">
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-4">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]"><CalendarClock className="h-3.5 w-3.5" /> Reporting period <ImbaInfoTooltip label="Reporting period" text="Operating reports use the selected range against IMBA-OS's synced reporting store. Reports grounded in the public Form 990 automatically lock to the available fiscal year instead of pretending monthly detail exists." /></p>
            <h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{fmtDay(period.from)} – {fmtDay(period.to)}</h2>
            {annualSelected ? <p className="mt-1 text-[11px] font-semibold text-amber-800 dark:text-amber-200">{selected.name} is tied to filed annual data, so the period is locked to FY 2024.</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {presets.map((preset) => <button key={preset.key} type="button" disabled={annualSelected && preset.key !== 'fy2024'} onClick={() => setPeriod({ from: preset.from, to: preset.to, preset: preset.key })} className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-35 ${period.preset === preset.key ? 'bg-[rgb(var(--sa))] text-[rgb(var(--sa-ink))]' : 'border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.02)] text-[rgb(var(--text-2))] hover:bg-[rgb(var(--line)/0.05)]'}`}>{preset.label}</button>)}
            <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-1.5 text-[11px] text-[rgb(var(--text-3))]">From<input type="date" disabled={annualSelected} value={period.from} max={period.to} onChange={(event) => setPeriod({ ...period, from: event.target.value, preset: 'custom' })} className="bg-transparent text-[11px] text-[rgb(var(--text))] outline-none disabled:opacity-50" /></label>
            <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-1.5 text-[11px] text-[rgb(var(--text-3))]">To<input type="date" disabled={annualSelected} value={period.to} min={period.from} onChange={(event) => setPeriod({ ...period, to: event.target.value, preset: 'custom' })} className="bg-transparent text-[11px] text-[rgb(var(--text))] outline-none disabled:opacity-50" /></label>
          </div>
        </div>
      </ShellCard>
      <ShellCard className="xl:col-span-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Governed catalog</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Financial + management reports</h2></div><div className="flex gap-2"><label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.025)] px-3 py-2"><Search className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reports" className="w-32 bg-transparent text-[11px] text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-4))]" /></label><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2 text-[11px] text-[rgb(var(--text))] outline-none">{categories.map((item) => <option key={item}>{item}</option>)}</select></div></div>
        <div className="grid gap-3 p-5">{rows.map((report) => <button key={report.name} type="button" aria-pressed={selected.name === report.name} onClick={() => openReport(report)} className={`rounded-2xl border p-4 text-left transition ${selected.name === report.name ? 'border-[rgb(var(--sa)/0.30)] bg-[rgb(var(--sa))]/[0.055]' : 'border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.02)] hover:bg-[rgb(var(--line)/0.04)]'}`}><div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-[rgb(var(--sa)/0.10)] p-2 text-[rgb(var(--sa-soft))]"><FileBarChart className="h-4 w-4" /></span><span className="rounded-full border border-[rgb(var(--line)/0.08)] px-2 py-1 text-[11px] font-black uppercase text-[rgb(var(--text-2))]">{filedAnnualReports.has(report.name) ? 'Filed FY 2024' : report.status}</span></div><h3 className="mt-3 text-xs font-semibold text-[rgb(var(--text))]">{report.name}</h3><p className="mt-2 text-[11px] leading-4 text-[rgb(var(--text-3))]">{report.description}</p><div className="mt-3 flex justify-between border-t border-[rgb(var(--line)/0.06)] pt-3 text-[11px] text-[rgb(var(--text-3))]"><span>{report.cadence}</span><span>Open report <ArrowRight className="ml-1 inline h-3 w-3" /></span></div></button>)}</div>
      </ShellCard>
      <ShellCard id="imba-report-output" className="scroll-mt-4 xl:col-span-8">
        <Heading eyebrow="Generated report" title={selected.name} detail={`${selected.cadence} · ${selected.audience}`} />
        <div className="border-b border-[rgb(var(--line)/0.07)] px-5 py-3 text-[11px] leading-5 text-[rgb(var(--text-2))]">{selected.description}</div>
        <div className="p-4 sm:p-5"><ImbaReportOutput reportName={selected.name} period={period} /></div>
      </ShellCard>
      <ShellCard className="xl:col-span-12">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
          <div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Source-system catalog</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">QuickBooks nonprofit report library · {qboReportCount} reports</h2></div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.025)] px-3 py-2"><Search className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" /><input value={qboQuery} onChange={(event) => setQboQuery(event.target.value)} placeholder="Search QBO reports" className="w-36 bg-transparent text-[11px] text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-4))]" /></label>
            <select value={qboLane} onChange={(event) => setQboLane(event.target.value as 'All' | QboReportLane)} className="rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2 text-[11px] text-[rgb(var(--text))] outline-none"><option value="All">All lanes</option><option value="qbo-direct">Direct from QBO</option><option value="qbo-config">After QBO configuration</option><option value="imba-os">Calculated by IMBA-OS</option></select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-3">
          {(['qbo-direct', 'qbo-config', 'imba-os'] as const).map((lane) => <span key={lane} className="flex items-center gap-1.5 text-[11px] text-[rgb(var(--text-2))]"><LaneBadge lane={lane} /> {laneCounts[lane]} reports <ImbaInfoTooltip label={qboLaneMeta[lane].label} text={qboLaneMeta[lane].explain} /></span>)}
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          {qboGroups.map((group) => (
            <div key={group.category} className="rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.02)] p-4">
              <div className="flex items-baseline justify-between gap-3"><h3 className="text-xs font-semibold text-[rgb(var(--text))]">{group.category}</h3><span className="text-[11px] text-[rgb(var(--text-3))]">{group.reports.length}</span></div>
              {group.caveat ? <p className="mt-2 text-[11px] leading-4 text-[rgb(var(--text-3))]">{group.caveat}</p> : null}
              <div className="mt-3 space-y-1">
                {group.reports.map((report) => (
                  <button key={report.name} type="button" onClick={() => setSelectedQbo({ ...report, category: group.category })} className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${selectedQbo?.name === report.name ? 'bg-[rgb(var(--sa))]/[0.055] ring-1 ring-[rgb(var(--sa)/0.30)]' : 'hover:bg-[rgb(var(--line)/0.04)]'}`}>
                    <span className="text-[11px] text-[rgb(var(--text-2))]">{report.name}</span>
                    <LaneBadge lane={report.lane} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {selectedQbo ? (
          <div className="grid gap-4 border-t border-[rgb(var(--sa)/0.15)] bg-[rgb(var(--sa)/0.025)] p-5 lg:grid-cols-[1.6fr_1fr_auto]">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--sa-soft))]">{selectedQbo.category} <LaneBadge lane={selectedQbo.lane} /></p>
              <h3 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">{selectedQbo.name}</h3>
              <p className="mt-2 text-[11px] leading-5 text-[rgb(var(--text-2))]">{qboLaneMeta[selectedQbo.lane].explain}{selectedQbo.note ? ` ${selectedQbo.note}` : ''}</p>
            </div>
            <div className="grid grid-cols-2 gap-2"><Kpi label="From" value={fmtDay(period.from)} note="Report start date" tone="teal" /><Kpi label="To" value={fmtDay(period.to)} note="Report end date" tone="teal" /></div>
            <div className="flex items-start gap-2">
              <button type="button" onClick={() => document.getElementById('qbo-report-output')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="rounded-xl bg-[rgb(var(--sa))] px-4 py-3 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">View report output</button>
              <ImbaInfoTooltip label="Rendered from the reporting store" text="Every catalog entry produces a document below. Reports backed by demo data contain rows; transaction-level reports show their real structure and clearly say that synced QuickBooks rows are required. Opening one never makes a per-report QuickBooks call." />
              <button type="button" aria-label="Close report detail" onClick={() => setSelectedQbo(null)} className="rounded-xl border border-[rgb(var(--line)/0.1)] p-3 text-[rgb(var(--text-2))]"><X className="h-4 w-4" /></button>
            </div>
          </div>
        ) : null}
        {selectedQbo ? (
          <div id="qbo-report-output" className="scroll-mt-4 border-t border-[rgb(var(--line)/0.07)] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">QuickBooks catalog output</p><h3 className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">{selectedQbo.name}</h3></div>
              <LaneBadge lane={selectedQbo.lane} />
            </div>
            <ImbaReportOutput reportName={selectedQbo.name} period={period} />
          </div>
        ) : null}
        <div className="border-t border-[rgb(var(--line)/0.07)] p-5">
          <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-200">What QuickBooks does not do by itself</p>
            <p className="mt-2 text-[11px] leading-5 text-[rgb(var(--text-2))]">Selecting “nonprofit” at setup does not create fund accounting. These depend entirely on how the chart of accounts, classes, donors, projects, and locations are structured and maintained — which is why every report above is tagged with its lane:</p>
            <div className="mt-3 flex flex-wrap gap-2">{qboFundAccountingCaveats.map((item) => <span key={item} className="rounded-full border border-amber-300/25 px-2.5 py-1 text-[11px] text-[rgb(var(--text-2))]">{item}</span>)}</div>
          </div>
        </div>
      </ShellCard>
    </div>
  );
}
