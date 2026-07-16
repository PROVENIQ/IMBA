import { AlertTriangle, Banknote, BriefcaseBusiness, Gauge, ReceiptText } from 'lucide-react';
import { DataNotice, MetricCard, PageHeader, SectionHeading, StatusPill } from '@/components/ui';
import { money, percent, projectScenarios } from '@/lib/imba-data';

const totals = projectScenarios.reduce(
  (sum, project) => ({
    contract: sum.contract + project.contract,
    spent: sum.spent + project.spent,
    estimateToComplete: sum.estimateToComplete + project.estimateToComplete,
    billed: sum.billed + project.billed,
    capacity: sum.capacity + project.capacity,
  }),
  { contract: 0, spent: 0, estimateToComplete: 0, billed: 0, capacity: 0 },
);

const forecastResult = totals.contract - totals.spent - totals.estimateToComplete;

export default function ProjectsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Trail Solutions"
        title="See the finish line—not only spend to date."
        description="Project-lifetime economics connect approved budgets, direct and shared labor, committed costs, billing, capacity, and the latest estimate to complete."
        action={<span className="scenario-badge">Illustrative portfolio</span>}
      />

      <DataNotice>
        The project records below demonstrate the proposed management view. They are sample scenarios, not actual IMBA contracts or forecasts.
      </DataNotice>

      <section className="metric-grid">
        <MetricCard label="Contracted value" value={money(totals.contract)} detail="Approved portfolio funding" icon={BriefcaseBusiness} tone="blue" />
        <MetricCard label="Forecast completion result" value={money(forecastResult, 0)} detail="Contract less spent and estimate to complete" icon={Gauge} tone={forecastResult >= 0 ? 'green' : 'red'} />
        <MetricCard label="Billed to date" value={money(totals.billed)} detail={`${percent((totals.billed / totals.contract) * 100)} of contracted value`} icon={ReceiptText} tone="neutral" />
        <MetricCard label="Average capacity" value={percent(totals.capacity / projectScenarios.length)} detail="Illustrative assigned-team utilization" icon={AlertTriangle} tone="amber" />
      </section>

      <section className="panel table-panel">
        <SectionHeading title="Project-lifetime forecast" description="One consistent view from signed agreement through closeout." />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Portfolio</th>
                <th>Contract</th>
                <th>Spent</th>
                <th>ETC</th>
                <th>Forecast result</th>
                <th>Billed</th>
                <th>Capacity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projectScenarios.map((project) => {
                const result = project.contract - project.spent - project.estimateToComplete;
                return (
                  <tr key={project.name}>
                    <td><strong>{project.name}</strong><span>{project.phase}</span></td>
                    <td>{money(project.contract)}</td>
                    <td>{money(project.spent)}</td>
                    <td>{money(project.estimateToComplete)}</td>
                    <td className={result >= 0 ? 'positive' : 'negative'}>{money(result, 0)}</td>
                    <td>{money(project.billed)}</td>
                    <td><div className="capacity-cell"><div><i style={{ width: `${project.capacity}%` }} /></div><span>{project.capacity}%</span></div></td>
                    <td><StatusPill label={project.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two-column-grid">
        <section className="panel">
          <SectionHeading title="Allocation design" description="A documented method makes projects comparable." />
          <ol className="numbered-list">
            <li><span>01</span><div><strong>Code the work</strong><p>One project identifier with phases for planning, fieldwork, design, construction, signage, and closeout.</p></div></li>
            <li><span>02</span><div><strong>Load direct labor</strong><p>Capture hours and fully loaded rates where the work occurs.</p></div></li>
            <li><span>03</span><div><strong>Allocate shared capacity</strong><p>Apply a consistent, defensible method for indirect labor, equipment, and support.</p></div></li>
            <li><span>04</span><div><strong>Reforecast the finish</strong><p>Update committed costs, billing, and estimate to complete before variance becomes irreversible.</p></div></li>
          </ol>
        </section>

        <section className="panel callout-panel">
          <Banknote size={24} />
          <p className="eyebrow">Decision rule</p>
          <h2>Accept work when margin, cash timing, and crew capacity agree.</h2>
          <p>A positive contract margin is not enough if billing terms consume unrestricted cash or the work displaces a higher-value mission commitment.</p>
          <div className="decision-rule-grid">
            <div><span>Margin</span><strong>Full cost recovered?</strong></div>
            <div><span>Cash</span><strong>Billing funds delivery?</strong></div>
            <div><span>Capacity</span><strong>Crew can execute?</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}
