import { ArrowRight, CalendarCheck, CheckCircle2, CircleDot, Compass, Flag, Shield } from 'lucide-react';
import { DataNotice, PageHeader, SectionHeading, StatusPill } from '@/components/ui';
import { decisionBrief } from '@/lib/imba-data';

const implementationPlan = [
  {
    window: 'First 30 days',
    title: 'Trust the foundation',
    items: ['Learn Kent and Board decision needs', 'Validate close, reconciliations, and reporting calendar', 'Map systems, ownership, and restriction flows'],
  },
  {
    window: 'By 60 days',
    title: 'Pilot visibility',
    items: ['Select representative Trail Solutions engagements', 'Pilot project-lifetime costing and estimates to complete', 'Draft the liquidity bridge and rolling cash forecast'],
  },
  {
    window: 'By 90 days',
    title: 'Establish cadence',
    items: ['Deliver a concise executive dashboard', 'Launch monthly project and portfolio review', 'Prioritize the finance-systems roadmap'],
  },
];

export default function LeadershipPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="CEO decision brief"
        title="Tell leadership what time it is."
        description="One page answers four questions: what changed, why it matters, what is forecast, and what decision is needed. Supporting accounting detail remains available behind the brief."
        action={<div className="print-label"><Compass size={17} /> Monthly executive view</div>}
      />

      <DataNotice>
        This page demonstrates the proposed brief format. Decision narratives are based on public context and interview themes, not internal IMBA management information.
      </DataNotice>

      <section className="decision-brief-panel">
        <div className="brief-header">
          <div><span>Leadership brief</span><h2>Three decisions requiring alignment</h2></div>
          <div><span>Cadence</span><strong>Monthly + exception alerts</strong></div>
        </div>
        <div className="brief-table-wrap">
          <table className="brief-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>What changed</th>
                <th>Why it matters</th>
                <th>What is forecast</th>
                <th>Decision needed</th>
              </tr>
            </thead>
            <tbody>
              {decisionBrief.map((item) => (
                <tr key={item.area}>
                  <td><strong>{item.area}</strong><StatusPill label={item.state} /></td>
                  <td>{item.changed}</td>
                  <td>{item.matters}</td>
                  <td>{item.forecast}</td>
                  <td className="decision-needed">{item.decision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="leadership-principles">
        <article><Shield size={20} /><span>Guardrail</span><strong>Protect mission capacity without defaulting to “no.”</strong></article>
        <article><Flag size={20} /><span>Milestones</span><strong>Name the evidence that changes the recommendation.</strong></article>
        <article><CircleDot size={20} /><span>Focus</span><strong>Surface the few decisions that only Kent can make.</strong></article>
      </div>

      <section>
        <SectionHeading title="30 / 60 / 90-day operating plan" description="Sequence trust, visibility, and cadence before redesigning systems." />
        <div className="roadmap-grid">
          {implementationPlan.map((phase, index) => (
            <article className="roadmap-card" key={phase.window}>
              <div className="roadmap-topline"><span>0{index + 1}</span><CalendarCheck size={19} /></div>
              <p className="eyebrow">{phase.window}</p>
              <h2>{phase.title}</h2>
              <ul>
                {phase.items.map((item) => <li key={item}><CheckCircle2 size={16} />{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="closing-panel">
        <div>
          <p className="eyebrow">Operating promise</p>
          <h2>Reliable numbers. Earlier visibility. Responsible options.</h2>
          <p>Finance stays close enough to the transactions to trust the information—and high enough above them to help leadership decide where IMBA can go next.</p>
        </div>
        <div className="closing-path">
          <span>Close</span><ArrowRight size={18} /><span>Project economics</span><ArrowRight size={18} /><span>Leadership choice</span>
        </div>
      </section>
    </div>
  );
}
