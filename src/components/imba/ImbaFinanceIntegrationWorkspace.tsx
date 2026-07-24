'use client';

import { Fragment, useState } from 'react';
import {
  ArrowRightLeft,
  CalendarRange,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Clock3,
  Database,
  FileWarning,
  Flag,
  Info,
  Landmark,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react';
import {
  campaignBreakdown,
  financeCampaignMetrics,
  qualityFlags,
  qualitySummary,
  reconciliationBatches,
  reconciliationSummary,
  type FinanceIntegrationView,
  type QualityFlag,
  type QualitySeverity,
  type ReconciliationBatch,
  type ReconciliationStatus,
} from '@/lib/imba-finance-integration-data';

export type ImbaFinanceIntegrationView = FinanceIntegrationView;

function money(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function compactMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return money(value);
}

function ShellCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card)/90%)] elev ${className}`}
    >
      {children}
    </section>
  );
}

function PrototypeHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-[rgb(var(--sa)/0.22)] bg-[linear-gradient(120deg,rgb(var(--card)),rgb(var(--sa)/0.055))] p-5 elev sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--sa-soft))]">
              {eyebrow}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--sa)/0.2)] bg-[rgb(var(--sa)/0.1)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[rgb(var(--sa-soft))]">
              <Sparkles className="h-3 w-3" />
              Demo · illustrative
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[rgb(var(--text))] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[rgb(var(--text-2))]">
            {description}
          </p>
        </div>
        {action}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone = 'neutral',
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'critical';
  icon: typeof Database;
}) {
  const toneClass = {
    neutral: 'text-[rgb(var(--text))]',
    positive: 'text-emerald-700 dark:text-emerald-200',
    warning: 'text-amber-800 dark:text-amber-200',
    critical: 'text-rose-700 dark:text-rose-200',
  }[tone];
  const iconClass = {
    neutral: 'bg-[rgb(var(--line)/0.05)] text-[rgb(var(--text-3))]',
    positive: 'bg-emerald-400/10 text-emerald-700 dark:text-emerald-200',
    warning: 'bg-amber-300/10 text-amber-800 dark:text-amber-200',
    critical: 'bg-rose-400/10 text-rose-700 dark:text-rose-200',
  }[tone];

  return (
    <div className="rounded-[18px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card-2))] p-4 elev">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]">
          {label}
        </p>
        <span className={`rounded-xl p-2 ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] ${toneClass}`}>
        {value}
      </p>
      <p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">{note}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ReconciliationStatus }) {
  const config = {
    Matched: {
      icon: Check,
      className: 'bg-emerald-400/10 text-emerald-700 dark:text-emerald-200',
    },
    Variance: {
      icon: TriangleAlert,
      className: 'bg-amber-300/10 text-amber-800 dark:text-amber-200',
    },
    Pending: {
      icon: Clock3,
      className: 'bg-[rgb(var(--line)/0.06)] text-[rgb(var(--text-3))]',
    },
  }[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function ReconciliationDetail({ batch }: { batch: ReconciliationBatch }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-4 sm:grid-cols-2">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">
          Discrepancy
        </p>
        <p className="mt-1.5 text-xs leading-5 text-[rgb(var(--text-2))]">{batch.detail}</p>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]">
          Reconciliation step
        </p>
        <p className="mt-1.5 text-xs leading-5 text-[rgb(var(--text-2))]">{batch.nextStep}</p>
      </div>
    </div>
  );
}

function Reconciliation() {
  const [expandedId, setExpandedId] = useState<string | null>('EA-260703-A');

  const toggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-5">
      <PrototypeHeader
        eyebrow="Finance integration · reconciliation"
        title="Donation Reconciliation — CRM ↔ Finance"
        description="See whether every fundraising batch reached the accounting records as expected, so Finance and Development can resolve differences before month-end."
        action={
          <label className="min-w-48 text-[10px] font-black uppercase tracking-[0.14em] text-[rgb(var(--text-3))]">
            Date range
            <span className="relative mt-1.5 flex items-center">
              <CalendarRange className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[rgb(var(--text-3))]" />
              <select
                defaultValue="jul-2026"
                className="w-full appearance-none rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] py-2.5 pl-9 pr-8 text-xs font-semibold normal-case tracking-normal text-[rgb(var(--text))] outline-none focus:border-[rgb(var(--sa)/0.45)]"
              >
                <option value="jul-2026">July 2026 · current month</option>
                <option value="jun-2026">June 2026</option>
                <option value="q2-2026">Q2 2026</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[rgb(var(--text-3))]" />
            </span>
          </label>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="CRM Recorded"
          value={money(reconciliationSummary.crmRecorded)}
          note="Donations entered in EveryAction"
          icon={Database}
        />
        <MetricCard
          label="Bank Deposited"
          value={money(reconciliationSummary.bankDeposited)}
          note="Deposits matched in QuickBooks Online"
          tone="positive"
          icon={Landmark}
        />
        <MetricCard
          label="Variance"
          value={money(reconciliationSummary.variance)}
          note="Amount awaiting explanation or timing"
          tone="warning"
          icon={TriangleAlert}
        />
        <MetricCard
          label="Unmatched Items"
          value={`${reconciliationSummary.unmatchedItems}`}
          note="2 variances · 2 pending"
          tone="warning"
          icon={ArrowRightLeft}
        />
      </div>

      <ShellCard>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">
              EveryAction ↔ QuickBooks Online
            </p>
            <h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">
              Deposit batch match
            </h2>
          </div>
          <span className="text-[11px] text-[rgb(var(--text-3))]">
            {reconciliationBatches.length} illustrative batches
          </span>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.07)] text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]">
                <th className="px-5 py-3">Date</th>
                <th className="px-3 py-3">Batch ID</th>
                <th className="px-3 py-3 text-right">CRM Total</th>
                <th className="px-3 py-3 text-right">QBO Total</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">
                  <span className="sr-only">Expand detail</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reconciliationBatches.map((batch) => {
                const expandable = batch.status !== 'Matched';
                const expanded = expandedId === batch.id;
                return (
                  <Fragment key={batch.id}>
                    <tr className="border-b border-[rgb(var(--line)/0.055)] hover:bg-[rgb(var(--line)/0.02)]">
                      <td className="px-5 py-3.5 font-mono text-xs text-[rgb(var(--text-2))]">
                        {batch.date}
                      </td>
                      <td className="px-3 py-3.5 font-mono text-xs font-semibold text-[rgb(var(--text))]">
                        {batch.id}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">
                        {money(batch.crmTotal)}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">
                        {money(batch.qboTotal)}
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={batch.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {expandable ? (
                          <button
                            type="button"
                            onClick={() => toggle(batch.id)}
                            aria-expanded={expanded}
                            aria-controls={`reconciliation-${batch.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgb(var(--line)/0.08)] text-[rgb(var(--text-3))] transition hover:bg-[rgb(var(--line)/0.05)] hover:text-[rgb(var(--text))]"
                          >
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            />
                            <span className="sr-only">
                              {expanded ? 'Hide' : 'Show'} discrepancy for {batch.id}
                            </span>
                          </button>
                        ) : (
                          <CircleCheck className="ml-auto h-4 w-4 text-emerald-700/60 dark:text-emerald-200/60" />
                        )}
                      </td>
                    </tr>
                    {expandable && expanded ? (
                      <tr id={`reconciliation-${batch.id}`} className="border-b border-[rgb(var(--line)/0.055)]">
                        <td colSpan={6} className="px-5 py-3">
                          <ReconciliationDetail batch={batch} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[rgb(var(--line)/0.06)] md:hidden">
          {reconciliationBatches.map((batch) => {
            const expandable = batch.status !== 'Matched';
            const expanded = expandedId === batch.id;
            return (
              <article key={batch.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-[rgb(var(--text))]">{batch.id}</p>
                    <p className="mt-1 font-mono text-[11px] text-[rgb(var(--text-3))]">{batch.date}</p>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">
                      CRM total
                    </dt>
                    <dd className="mt-1 font-mono text-xs text-[rgb(var(--text))]">{money(batch.crmTotal)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">
                      QBO total
                    </dt>
                    <dd className="mt-1 font-mono text-xs text-[rgb(var(--text))]">{money(batch.qboTotal)}</dd>
                  </div>
                </dl>
                {expandable ? (
                  <button
                    type="button"
                    onClick={() => toggle(batch.id)}
                    aria-expanded={expanded}
                    aria-controls={`reconciliation-mobile-${batch.id}`}
                    className="mt-4 flex w-full items-center justify-between rounded-xl border border-[rgb(var(--line)/0.08)] px-3 py-2.5 text-left text-[11px] font-semibold text-[rgb(var(--text-2))]"
                  >
                    View discrepancy
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                ) : null}
                {expandable && expanded ? (
                  <div id={`reconciliation-mobile-${batch.id}`} className="mt-3">
                    <ReconciliationDetail batch={batch} />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </ShellCard>

      <FooterNote>
        In production, this view pulls from the EveryAction API and QuickBooks Online API in near-real-time.
        Illustrative data shown.
      </FooterNote>
    </div>
  );
}

function CampaignTracker() {
  return (
    <div className="space-y-5">
      <PrototypeHeader
        eyebrow="Finance integration · shared language"
        title="Leading with Trails — Campaign vs. Financial View"
        description="Compare the fundraising story with the accounting story, so leaders understand why both teams can report different—and equally valid—campaign totals."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <ShellCard>
          <div className="border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-amber-300/10 p-2.5 text-amber-800 dark:text-amber-200">
                <Target className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-200">
                  Development view
                </p>
                <h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">
                  Commitments toward the goal
                </h2>
              </div>
            </div>
          </div>
          <div className="space-y-6 p-5 sm:p-6">
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-3xl font-semibold tracking-[-0.05em] text-[rgb(var(--text))]">
                    $16.2M
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--text-3))]">of $20M campaign goal</p>
                </div>
                <span className="font-mono text-2xl font-semibold text-amber-800 dark:text-amber-200">81%</span>
              </div>
              <div
                className="mt-4 h-3 overflow-hidden rounded-full bg-[rgb(var(--line)/0.08)]"
                role="progressbar"
                aria-label="Campaign progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={81}
              >
                <div className="h-full w-[81%] rounded-full bg-[linear-gradient(90deg,#fbbf24,#fde68a)]" />
              </div>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">
                Raised by type
              </p>
              <div className="mt-3 space-y-3">
                {campaignBreakdown.map((item) => (
                  <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="truncate text-xs text-[rgb(var(--text-2))]">{item.label}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${(item.value / 6_100_000) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[rgb(var(--text))]">
                      {compactMoney(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">
                  Active proposals
                </p>
                <p className="mt-2 font-mono text-xl font-semibold text-[rgb(var(--text))]">$2.4M</p>
              </div>
              <div className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">
                  In cultivation
                </p>
                <p className="mt-2 font-mono text-xl font-semibold text-[rgb(var(--text))]">$1.4M</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-300/18 bg-amber-300/[0.05] p-4">
              <span className="text-sm font-semibold text-[rgb(var(--text))]">Gap to goal</span>
              <span className="font-mono text-xl font-semibold text-amber-800 dark:text-amber-200">$3.8M</span>
            </div>
          </div>
        </ShellCard>

        <ShellCard>
          <div className="border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-[rgb(var(--sa)/0.1)] p-2.5 text-[rgb(var(--sa-soft))]">
                <Scale className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--sa-soft))]">
                  Finance view
                </p>
                <h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">
                  Recognized cash, pledges, and restrictions
                </h2>
              </div>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
            {financeCampaignMetrics.map((metric) => {
              const toneClass =
                metric.tone === 'positive'
                  ? 'text-emerald-700 dark:text-emerald-200'
                  : metric.tone === 'warning'
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-[rgb(var(--text))]';
              return (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] p-4"
                >
                  <p className="min-h-8 text-[10px] font-black uppercase leading-4 tracking-[0.12em] text-[rgb(var(--text-3))]">
                    {metric.label}
                  </p>
                  <p className={`mt-2 font-mono text-2xl font-semibold tracking-[-0.04em] ${toneClass}`}>
                    {compactMoney(metric.value)}
                  </p>
                </div>
              );
            })}
            <div className="sm:col-span-2">
              <div className="rounded-2xl border border-[rgb(var(--sa)/0.18)] bg-[rgb(var(--sa)/0.05)] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--sa-soft))]" />
                  <p className="text-xs leading-5 text-[rgb(var(--text-2))]">
                    Finance distinguishes cash already received from collectible pledges, purpose and time
                    restrictions, releases, and amounts that cannot yet be recognized as revenue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ShellCard>
      </div>

      <div className="rounded-[22px] border border-cyan-300/20 bg-[linear-gradient(120deg,rgb(var(--card)),rgb(34_211_238/0.055))] p-5 elev sm:p-6">
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-cyan-300/10 p-2.5 text-cyan-700 dark:text-cyan-200">
            <Info className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200">
              Key insight
            </p>
            <p className="mt-2 max-w-5xl text-sm leading-6 text-[rgb(var(--text-2))]">
              Development reports <strong className="text-[rgb(var(--text))]">$16.2M raised</strong>. Finance
              reports <strong className="text-[rgb(var(--text))]">$12.8M in cash</strong> and{' '}
              <strong className="text-[rgb(var(--text))]">$2.9M in documented pledges</strong>. The difference
              ($0.5M) reflects verbal commitments and proposals not yet meeting revenue recognition criteria.
              Neither number is wrong—they answer different questions.
            </p>
          </div>
        </div>
      </div>

      <FooterNote>Campaign figures are illustrative. Actual campaign data is not public.</FooterNote>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: QualitySeverity }) {
  const className = {
    Critical: 'bg-rose-400/10 text-rose-700 dark:text-rose-200',
    Warning: 'bg-amber-300/10 text-amber-800 dark:text-amber-200',
    Info: 'bg-cyan-300/10 text-cyan-700 dark:text-cyan-200',
  }[severity];
  const Icon = severity === 'Critical' ? CircleAlert : severity === 'Warning' ? TriangleAlert : Info;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${className}`}
    >
      <Icon className="h-3 w-3" />
      {severity}
    </span>
  );
}

function QualityDetail({ flag }: { flag: QualityFlag }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4 lg:grid-cols-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-700 dark:text-rose-200">
          Current entry
        </p>
        <p className="mt-1.5 text-[11px] leading-5 text-[rgb(var(--text-2))]">{flag.current}</p>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-200">
          Probably should say
        </p>
        <p className="mt-1.5 text-[11px] leading-5 text-[rgb(var(--text-2))]">{flag.expected}</p>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[rgb(var(--sa-soft))]">
          Suggested fix
        </p>
        <p className="mt-1.5 text-[11px] leading-5 text-[rgb(var(--text-2))]">{flag.suggestedFix}</p>
      </div>
    </div>
  );
}

function DataQuality() {
  const [expandedId, setExpandedId] = useState<string | null>('DQ-260724-01');

  const toggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-5">
      <PrototypeHeader
        eyebrow="Finance integration · preventive control"
        title="CRM Data Quality — Entry Audit"
        description="Catch missing or suspicious donation coding when it is entered, before a preventable issue reaches the general ledger and slows the monthly close."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Entries This Month"
          value={`${qualitySummary.entriesThisMonth}`}
          note="EveryAction donations reviewed"
          icon={Database}
        />
        <MetricCard
          label="Clean"
          value={`${qualitySummary.clean} · ${qualitySummary.cleanRate}%`}
          note="Ready for the accounting handoff"
          tone="positive"
          icon={CircleCheck}
        />
        <MetricCard
          label="Flagged"
          value={`${qualitySummary.flagged} · ${qualitySummary.flaggedRate}%`}
          note="Needs review or documentation"
          tone="warning"
          icon={Flag}
        />
        <MetricCard
          label="Critical"
          value={`${qualitySummary.critical}`}
          note="Would materially affect GL coding"
          tone="critical"
          icon={CircleAlert}
        />
      </div>

      <ShellCard>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">
              Pre-GL exception queue
            </p>
            <h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">
              Flagged donation entries
            </h2>
          </div>
          <span className="text-[11px] text-[rgb(var(--text-3))]">
            {qualityFlags.length} representative of {qualitySummary.flagged} flags
          </span>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1050px] text-left">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.07)] text-[10px] font-black uppercase tracking-[0.15em] text-[rgb(var(--text-3))]">
                <th className="px-5 py-3">Date</th>
                <th className="px-3 py-3">Donor</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3">Flag Type</th>
                <th className="px-3 py-3">Severity</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">
                  <span className="sr-only">Expand detail</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {qualityFlags.map((flag) => {
                const expanded = expandedId === flag.id;
                return (
                  <Fragment key={flag.id}>
                    <tr className="border-b border-[rgb(var(--line)/0.055)] hover:bg-[rgb(var(--line)/0.02)]">
                      <td className="px-5 py-3.5 font-mono text-xs text-[rgb(var(--text-2))]">{flag.date}</td>
                      <td className="max-w-48 px-3 py-3.5 text-xs font-semibold text-[rgb(var(--text))]">
                        {flag.donor}
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">
                        {money(flag.amount)}
                      </td>
                      <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{flag.flagType}</td>
                      <td className="px-3 py-3.5">
                        <SeverityBadge severity={flag.severity} />
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`text-[10px] font-black uppercase tracking-[0.12em] ${
                            flag.status === 'Resolved'
                              ? 'text-emerald-700 dark:text-emerald-200'
                              : 'text-[rgb(var(--text-2))]'
                          }`}
                        >
                          {flag.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => toggle(flag.id)}
                          aria-expanded={expanded}
                          aria-controls={`quality-${flag.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[rgb(var(--line)/0.08)] text-[rgb(var(--text-3))] transition hover:bg-[rgb(var(--line)/0.05)] hover:text-[rgb(var(--text))]"
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                          />
                          <span className="sr-only">{expanded ? 'Hide' : 'Show'} suggested fix for {flag.donor}</span>
                        </button>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr id={`quality-${flag.id}`} className="border-b border-[rgb(var(--line)/0.055)]">
                        <td colSpan={7} className="px-5 py-3">
                          <QualityDetail flag={flag} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-[rgb(var(--line)/0.06)] lg:hidden">
          {qualityFlags.map((flag) => {
            const expanded = expandedId === flag.id;
            return (
              <article key={flag.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[rgb(var(--text))]">{flag.donor}</p>
                    <p className="mt-1 font-mono text-[11px] text-[rgb(var(--text-3))]">
                      {flag.date} · {money(flag.amount)}
                    </p>
                  </div>
                  <SeverityBadge severity={flag.severity} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-[rgb(var(--text-2))]">{flag.flagType}</p>
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.1em] ${
                      flag.status === 'Resolved'
                        ? 'text-emerald-700 dark:text-emerald-200'
                        : 'text-[rgb(var(--text-3))]'
                    }`}
                  >
                    {flag.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(flag.id)}
                  aria-expanded={expanded}
                  aria-controls={`quality-mobile-${flag.id}`}
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-[rgb(var(--line)/0.08)] px-3 py-2.5 text-left text-[11px] font-semibold text-[rgb(var(--text-2))]"
                >
                  Review entry and suggested fix
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                {expanded ? (
                  <div id={`quality-mobile-${flag.id}`} className="mt-3">
                    <QualityDetail flag={flag} />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </ShellCard>

      <FooterNote>
        In production, this monitor runs against live EveryAction data via API polling. Rules are configurable by
        the Finance Director. Illustrative data shown.
      </FooterNote>
    </div>
  );
}

function FooterNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.025)] px-4 py-3 text-[11px] leading-5 text-[rgb(var(--text-3))]">
      <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--sa-soft))]" />
      <p>{children}</p>
    </div>
  );
}

export function ImbaFinanceIntegrationWorkspace({
  view,
}: {
  view: ImbaFinanceIntegrationView;
}) {
  return (
    <div className="space-y-5">
      {view === 'reconciliation' ? <Reconciliation /> : null}
      {view === 'campaign' ? <CampaignTracker /> : null}
      {view === 'data-quality' ? <DataQuality /> : null}
    </div>
  );
}
