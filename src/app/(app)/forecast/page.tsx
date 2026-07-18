import { Activity, ArrowDownRight, ArrowUpRight, GitBranch, Target } from 'lucide-react';
import { DataNotice, MetricCard, PageHeader, SectionHeading } from '@/components/ui';
import { financialHistory, forecastScenarios, money } from '@/lib/imba-data';

const weightedResult = forecastScenarios.reduce((total, scenario) => total + scenario.result * (scenario.probability / 100), 0);
const recentYears = financialHistory.slice(-3);

export default function ForecastPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Forecast & scenarios"
        title="Convert the pipeline into choices before revenue is booked."
        description="A rolling view of backlog, probability-weighted pipeline, staff capacity, cash timing, and downside triggers gives leadership time to act."
        action={<span className="scenario-badge">Illustrative forecast</span>}
      />

      <DataNotice>
        Scenario values demonstrate the decision framework and are not IMBA management forecasts. Historical values are published Form 990 facts.
      </DataNotice>

      <section className="metric-grid metric-grid-three">
        <MetricCard label="Weighted result" value={money(weightedResult, 0)} detail="Probability-weighted scenario outcome" icon={GitBranch} tone="amber" />
        <MetricCard label="Base-case revenue" value={money(forecastScenarios[1].revenue)} detail="Backlog delivers; giving remains steady" icon={Target} tone="blue" />
        <MetricCard label="Decision cadence" value="Monthly" detail="Reforecast projects, pipeline, and liquidity together" icon={Activity} tone="green" />
      </section>

      <section>
        <SectionHeading title="Twelve-month scenarios" description="Every scenario states the conditions that make it true." />
        <div className="scenario-grid">
          {forecastScenarios.map((scenario) => (
            <article className={`scenario-card scenario-${scenario.color}`} key={scenario.name}>
              <div className="scenario-topline">
                <div>
                  <span>{scenario.probability}% probability</span>
                  <h2>{scenario.name}</h2>
                </div>
                {scenario.result >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
              </div>
              <div className="scenario-result">
                <span>Operating result</span>
                <strong>{money(scenario.result, 0)}</strong>
              </div>
              <dl>
                <div><dt>Revenue</dt><dd>{money(scenario.revenue)}</dd></div>
                <div><dt>Expenses</dt><dd>{money(scenario.expenses)}</dd></div>
              </dl>
              <p>{scenario.assumption}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="two-column-grid forecast-lower-grid">
        <section className="panel">
          <SectionHeading title="Why visibility matters" description="Published 2022-2024 revenue composition" />
          <div className="mix-chart">
            {recentYears.map((year) => {
              const contributionWidth = (year.contributions / year.revenue) * 100;
              const programWidth = (year.programServices / year.revenue) * 100;
              return (
                <div className="mix-row" key={year.year}>
                  <span>{year.year}</span>
                  <div className="mix-track">
                    <i className="mix-contributions" style={{ width: `${contributionWidth}%` }} />
                    <i className="mix-program" style={{ width: `${programWidth}%` }} />
                  </div>
                  <strong>{money(year.revenue)}</strong>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span><i className="legend-contributions" /> Contributions</span>
            <span><i className="legend-program" /> Program services</span>
          </div>
          <p className="panel-insight">Program-service revenue moved from $4.04M to $2.76M to $4.07M—a 32% contraction followed by a 47% rebound.</p>
        </section>

        <section className="panel">
          <SectionHeading title="Monthly forecast questions" description="The few inputs that move the decision." />
          <ul className="question-list">
            <li><span>01</span><p>What signed backlog will become revenue in the next 90, 180, and 365 days?</p></li>
            <li><span>02</span><p>Which opportunities belong in the probability-weighted pipeline—and at what confidence?</p></li>
            <li><span>03</span><p>Does staff and equipment capacity match the work without creating delivery risk?</p></li>
            <li><span>04</span><p>Which donor restrictions or billing terms create a cash-timing gap?</p></li>
            <li><span>05</span><p>What milestone changes the recommendation from accelerate to adjust or pause?</p></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
