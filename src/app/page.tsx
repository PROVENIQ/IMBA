import Link from 'next/link';
import {
  ArrowUpRight,
  Banknote,
  Bike,
  Building2,
  CircleDollarSign,
  Map,
  Mountain,
  Route,
  TrendingUp,
} from 'lucide-react';
import { DataNotice, MetricCard, PageHeader, SectionHeading, StatusPill } from '@/components/ui';
import { decisionBrief, financialHistory, money, publicFinancialFacts } from '@/lib/imba-data';

const maxRevenue = Math.max(...financialHistory.map((year) => year.revenue));

const operatingViews = [
  {
    href: '/liquidity',
    icon: Banknote,
    title: 'Financial position',
    copy: 'Unrestricted capacity, restrictions, obligations, runway, and rolling forecast.',
    signal: 'Build cash bridge',
  },
  {
    href: '/forecast',
    icon: TrendingUp,
    title: 'Revenue & funding',
    copy: 'Contributions, memberships, project revenue, pipeline, and scenario pace.',
    signal: 'Model variability',
  },
  {
    href: '/projects',
    icon: Route,
    title: 'Trail Solutions',
    copy: 'Project budget, labor allocation, estimate to complete, billing, and capacity.',
    signal: 'Pilot job costing',
  },
  {
    href: '/leadership',
    icon: Mountain,
    title: 'Decisions & risks',
    copy: 'What changed, why it matters, what is forecast, and the decision Kent needs to make.',
    signal: 'Three active calls',
  },
];

export default function ExecutiveOverviewPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Executive overview"
        title="Know the trail ahead before committing the crew."
        description="A finance operating system for connecting IMBA's project economics, philanthropic base, staff capacity, and mission investment to leadership decisions."
        action={
          <div className="freshness-card">
            <span className="signal-dot" />
            <div><strong>Public-data baseline</strong><span>2024 Form 990 + 2025 annual report</span></div>
          </div>
        }
      />

      <DataNotice>
        <strong>Prototype boundary:</strong> headline history uses published IMBA information. Pipeline, capacity, project, and forecast details are illustrative until connected to IMBA systems.
      </DataNotice>

      <section className="metric-grid" aria-label="Headline metrics">
        <MetricCard label="2025 revenue" value={money(publicFinancialFacts.annualReportRevenue)} detail="Reported in IMBA's 2025 annual report" icon={CircleDollarSign} tone="blue" />
        <MetricCard label="Investment-year result" value={money(publicFinancialFacts.annualReportNet, 0)} detail="Described by IMBA as planned reinvestment" icon={Bike} tone="amber" />
        <MetricCard label="Program-service share" value={`${publicFinancialFacts.programServiceShare2024}%`} detail="2024 revenue mix; contributions were 43.0%" icon={Building2} tone="green" />
        <MetricCard label="Communities engaged" value={publicFinancialFacts.communitiesEngaged.toLocaleString('en-US')} detail="A mission scale that requires portfolio visibility" icon={Map} tone="neutral" />
      </section>

      <section>
        <SectionHeading title="The four leadership views" description="The close establishes trust. These views turn trustworthy accounting into choices." />
        <div className="operating-view-grid">
          {operatingViews.map((view) => {
            const Icon = view.icon;
            return (
              <Link href={view.href} className="operating-view-card" key={view.title}>
                <div className="view-icon"><Icon size={21} /></div>
                <h3>{view.title}</h3>
                <p>{view.copy}</p>
                <span>{view.signal}<ArrowUpRight size={15} /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel trend-panel">
          <SectionHeading
            title="Revenue history"
            description="Published Form 990 history, 2018-2024"
            aside={<span className="source-chip">Public fact</span>}
          />
          <div className="history-bars" aria-label="Annual revenue and expense comparison">
            {financialHistory.map((year) => (
              <div className="history-row" key={year.year}>
                <span>{year.year}</span>
                <div className="history-track">
                  <div className="revenue-bar" style={{ width: `${(year.revenue / maxRevenue) * 100}%` }} />
                  <div className="expense-marker" style={{ left: `${(year.expenses / maxRevenue) * 100}%` }} />
                </div>
                <strong>{money(year.revenue)}</strong>
                <em className={year.net < 0 ? 'negative' : 'positive'}>{money(year.net, 0)}</em>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><i className="legend-revenue" /> Revenue</span>
            <span><i className="legend-expense" /> Expense point</span>
            <span>Right column: annual result</span>
          </div>
          <p className="panel-insight">Program-service revenue contracted 32% in 2023, then rebounded 47% in 2024. Expense levels determined how much of that movement reached the bottom line.</p>
        </section>

        <section className="panel">
          <SectionHeading title="Leadership decision queue" description="The output is a decision—not another accounting package." />
          <div className="decision-list">
            {decisionBrief.map((item) => (
              <article className="decision-item" key={item.area}>
                <div className="decision-topline">
                  <h3>{item.area}</h3>
                  <StatusPill label={item.state} />
                </div>
                <p>{item.decision}</p>
                <Link href="/leadership">Open decision brief <ArrowUpRight size={14} /></Link>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer className="source-footer">
        <span>Source baseline</span>
        <a href="https://www.imba.com/2025-annual-report" target="_blank" rel="noreferrer">IMBA 2025 Annual Report <ArrowUpRight size={13} /></a>
        <a href="https://www.imba.com/" target="_blank" rel="noreferrer">IMBA mission and programs <ArrowUpRight size={13} /></a>
      </footer>
    </div>
  );
}
