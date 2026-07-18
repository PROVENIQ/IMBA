import { ArrowDown, ArrowRight, Banknote, CircleOff, Landmark, ShieldCheck } from 'lucide-react';
import { DataNotice, MetricCard, PageHeader, SectionHeading } from '@/components/ui';
import { money, publicFinancialFacts } from '@/lib/imba-data';

const bridgeRows = [
  { label: 'Beginning cash and near-cash resources', value: 'Connect GL', type: 'start', note: 'Bank balances plus collectible unrestricted receivables.' },
  { label: 'Donor-restricted resources', value: money(publicFinancialFacts.donorRestrictedNetAssets, 0), type: 'constraint', note: 'Restriction classification must be tied to actual asset availability.' },
  { label: 'Amounts due to chapters', value: money(publicFinancialFacts.chapterObligations, 0), type: 'constraint', note: 'Obligations reported at December 31, 2024.' },
  { label: 'Deferred project revenue', value: money(publicFinancialFacts.deferredRevenue, 0), type: 'constraint', note: 'Cash received for work or performance obligations not yet completed.' },
  { label: 'Remaining cost to complete contracted work', value: 'Connect PM', type: 'constraint', note: 'Latest project estimates, open commitments, and crew assumptions.' },
  { label: 'Deployable unrestricted liquidity', value: 'Calculated output', type: 'result', note: 'The amount leadership can responsibly allocate after constraints and minimum reserve.' },
];

export default function LiquidityPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Deployable cash"
        title="A bank balance is a starting point—not a spending answer."
        description="The liquidity bridge separates gross resources from donor restrictions, chapter obligations, deferred project revenue, completion commitments, and the minimum operating reserve."
        action={<span className="source-chip">2024 public baseline</span>}
      />

      <DataNotice>
        Published balance-sheet amounts identify constraints, but they are not all direct deductions from cash. The final bridge requires the general ledger, receivables aging, restriction detail, and project estimates to complete.
      </DataNotice>

      <section className="metric-grid metric-grid-three">
        <MetricCard label="Unrestricted net assets" value={money(publicFinancialFacts.unrestrictedNetAssets)} detail="2024 accounting classification—not the same as cash" icon={Landmark} tone="green" />
        <MetricCard label="Donor-restricted net assets" value={money(publicFinancialFacts.donorRestrictedNetAssets, 0)} detail="Resources governed by donor purpose or time restrictions" icon={ShieldCheck} tone="amber" />
        <MetricCard label="Known obligations" value={money(publicFinancialFacts.chapterObligations + publicFinancialFacts.deferredRevenue, 0)} detail="Chapter amounts plus deferred revenue; not necessarily additive cash deductions" icon={CircleOff} tone="red" />
      </section>

      <div className="liquidity-layout">
        <section className="panel bridge-panel">
          <SectionHeading title="Deployable-cash bridge" description="The sequence Kent can use to evaluate a new commitment." />
          <div className="bridge-list">
            {bridgeRows.map((row, index) => (
              <div className={`bridge-row bridge-${row.type}`} key={row.label}>
                <div className="bridge-index">{row.type === 'constraint' ? <ArrowDown size={17} /> : index + 1}</div>
                <div className="bridge-copy"><strong>{row.label}</strong><span>{row.note}</span></div>
                <div className="bridge-value">{row.value}</div>
              </div>
            ))}
          </div>
        </section>

        <aside className="liquidity-aside">
          <section className="panel callout-panel cash-callout">
            <Banknote size={25} />
            <p className="eyebrow">The sentence for leadership</p>
            <h2>“Here is the cash we have. Here is the portion already spoken for. Here is what remains deployable.”</h2>
            <p>That distinction lets finance support the vision without mistaking temporary cash custody for permanent spending capacity.</p>
          </section>

          <section className="panel">
            <SectionHeading title="Minimum monthly cadence" />
            <ul className="check-list">
              <li><span>1</span>Reconcile cash and receivables.</li>
              <li><span>2</span>Roll restrictions and chapter obligations.</li>
              <li><span>3</span>Refresh project completion costs.</li>
              <li><span>4</span>Apply base, stretch, and downside timing.</li>
              <li><span>5</span>Compare the output with the reserve floor.</li>
            </ul>
          </section>
        </aside>
      </div>

      <section className="panel decision-path-panel">
        <SectionHeading title="From idea to responsible commitment" description="Finance operates as a guardrail, not a gatekeeper." />
        <div className="decision-path">
          <div><span>01</span><strong>Mission outcome</strong><p>What is Kent trying to accomplish?</p></div>
          <ArrowRight className="path-arrow" size={20} />
          <div><span>02</span><strong>Full economics</strong><p>Cost, cash timing, restrictions, and capacity.</p></div>
          <ArrowRight className="path-arrow" size={20} />
          <div><span>03</span><strong>Options</strong><p>Base, stretch, and downside paths.</p></div>
          <ArrowRight className="path-arrow" size={20} />
          <div><span>04</span><strong>Milestones</strong><p>When to accelerate, adjust, or pause.</p></div>
        </div>
      </section>
    </div>
  );
}
