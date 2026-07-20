'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Database,
  GitMerge,
  Network,
  Search,
} from 'lucide-react';
import { imbaProjects } from '@/lib/imba-cockpit-data';
import { imbaChapters, imbaDataFlows, imbaProjectTasks } from '@/lib/imba-detail-data';
import {
  allocateProjects,
  allocationBalance,
  assignmentCost,
  benefitRate,
  knownLoadedMultiplier,
  loadedHourlyFloor,
  payrollTaxRate,
  sharedAssignments,
} from '@/lib/imba-job-costing';
import type { ImbaOsView } from '@/lib/imba-os-data';
import { useImbaOsState } from '@/components/imba/ImbaOsState';
import { ImbaInfoTooltip } from '@/components/imba/ImbaInfoTooltip';

export type ImbaOperationsView =
  | 'project-command'
  | 'project-board'
  | 'chapter-network'
  | 'chapter-standards'
  | 'data-exchange';

function money(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2).replace(/0$/, '').replace(/\.0$/, '')}M`;
  return `$${Math.round(value / 1_000)}K`;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[22px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card)/90%)] elev ${className}`}>{children}</section>;
}

function Heading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return <div className="border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">{eyebrow}</p><div className="mt-1 flex flex-wrap items-end justify-between gap-2"><h2 className="text-base font-semibold text-[rgb(var(--text))]">{title}</h2>{detail ? <p className="text-[11px] text-[rgb(var(--text-3))]">{detail}</p> : null}</div></div>;
}

function Kpi({ label, value, note, tone = 'blue', info }: { label: string; value: string; note: string; tone?: 'blue' | 'lime' | 'amber' | 'rose'; info?: { label: string; text: string } }) {
  const toneClass = tone === 'blue' ? 'text-blue-700 dark:text-blue-100' : tone === 'lime' ? 'text-[rgb(var(--sa-soft))]' : tone === 'amber' ? 'text-amber-800 dark:text-amber-200' : 'text-rose-700 dark:text-rose-200';
  return <div className="rounded-[18px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card-2))] elev p-4"><p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">{label}{info ? <ImbaInfoTooltip label={info.label} text={info.text} align="left" /> : null}</p><p className={`mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] ${toneClass}`}>{value}</p><p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">{note}</p></div>;
}

export function ImbaOperationsWorkspace({ view, onNavigate }: { view: ImbaOperationsView; onNavigate: (view: ImbaOsView) => void }) {
  return <div className="space-y-5">{view === 'project-command' ? <ProjectCommand onNavigate={onNavigate} /> : null}{view === 'project-board' ? <ProjectBoard /> : null}{view === 'chapter-network' ? <ChapterNetwork onNavigate={onNavigate} /> : null}{view === 'chapter-standards' ? <ChapterStandards /> : null}{view === 'data-exchange' ? <DataExchange /> : null}</div>;
}

function ProjectCommand({ onNavigate }: { onNavigate: (view: ImbaOsView) => void }) {
  const contract = imbaProjects.reduce((sum, project) => sum + project.contractValue, 0);
  const cost = imbaProjects.reduce((sum, project) => sum + project.forecastCost, 0);
  const unbilled = imbaProjects.reduce((sum, project) => sum + project.contractValue * Math.max(project.completion - project.billed, 0) / 100, 0);
  return <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Kpi label="Active portfolio" value={money(contract)} note={`${imbaProjects.length} representative engagements`} /><Kpi label="Estimate at completion" value={money(cost)} note="Labor, subs, equipment, shared cost" info={{ label: 'EAC · Estimate at Completion', text: 'Total forecast cost of each engagement when finished — costs to date plus the estimate to complete (ETC). EAC answers whether the job makes money; ETC answers what is left to spend.' }} /><Kpi label="Forecast contribution" value={money(contract - cost)} note={`${(((contract - cost) / contract) * 100).toFixed(1)}% portfolio contribution`} tone="lime" info={{ label: 'Contribution', text: 'Contract value less estimate at completion. What delivery work leaves toward shared costs and mission — not net profit, since management, general, and fundraising costs sit outside it.' }} /><Kpi label="Unbilled delivery" value={money(unbilled)} note="Work ahead of invoicing milestones" tone="amber" info={{ label: 'Unbilled delivery', text: 'Work completed but not yet invoiced — the gap between delivery percentage and billing percentage, priced at contract value. It is real work already paid for in wages that has not yet become cash.' }} /><Kpi label="At-risk / watch" value={`${imbaProjects.filter((project) => project.status !== 'healthy').length}`} note="Projects needing management action" tone="rose" /></div><Card><div className="flex items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Project-lifetime control</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Delivery, finance, and client milestones</h2></div><button type="button" onClick={() => onNavigate('project-board')} className="flex items-center gap-2 rounded-xl bg-blue-300 px-3 py-2 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Open delivery board <ArrowRight className="h-3.5 w-3.5" /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left"><thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.15em] text-[rgb(var(--text-3))]"><th className="px-5 py-3">Project</th><th className="px-3 py-3">Phase</th><th className="px-3 py-3">Delivery / billing</th><th className="px-3 py-3 text-right">Contract</th><th className="px-3 py-3 text-right"><span className="inline-flex items-center gap-1.5">EAC <ImbaInfoTooltip label="EAC · Estimate at Completion" text="The total forecast cost of the engagement when it is finished — costs incurred to date plus the estimate to complete (ETC). Contract minus EAC is the contribution. EAC answers 'will this job make money'; ETC answers 'what is left to spend'." align="right" /></span></th><th className="px-3 py-3 text-right"><span className="inline-flex items-center gap-1.5">Contribution <ImbaInfoTooltip label="Contribution" text="Contract value minus estimate at completion, as a percentage of contract value. It is what the engagement leaves toward shared costs and mission work — not net profit, because organisation-wide management, general, and fundraising costs sit outside it." align="right" /></span></th><th className="px-5 py-3">Management signal</th></tr></thead><tbody>{imbaProjects.map((project) => <tr key={project.name} className="border-b border-[rgb(var(--line)/0.055)] last:border-0"><td className="px-5 py-3.5"><p className="text-xs font-semibold text-[rgb(var(--text))]">{project.name}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{project.region}</p></td><td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text))]">{project.phase}</td><td className="px-3 py-3.5"><div className="space-y-1.5"><div className="flex items-center gap-2"><span className="w-12 text-[11px] uppercase text-[rgb(var(--text-4))]">Done</span><div className="h-1.5 w-24 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]"><div className="h-full rounded-full bg-blue-300" style={{ width: `${project.completion}%` }} /></div><span className="font-mono text-[11px] text-blue-700 dark:text-blue-100">{project.completion}%</span></div><div className="flex items-center gap-2"><span className="w-12 text-[11px] uppercase text-[rgb(var(--text-4))]">Billed</span><div className="h-1.5 w-24 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]"><div className="h-full rounded-full bg-[#68b9aa]" style={{ width: `${project.billed}%` }} /></div><span className="font-mono text-[11px] text-[rgb(var(--info))]">{project.billed}%</span></div></div></td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(project.contractValue)}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(project.forecastCost)}</td><td className={`px-3 py-3.5 text-right font-mono text-xs font-semibold ${project.contribution < 10 ? 'text-rose-700 dark:text-rose-200' : project.contribution < 15 ? 'text-amber-800 dark:text-amber-200' : 'text-[rgb(var(--sa-soft))]'}`}>{project.contribution.toFixed(1)}%</td><td className="px-5 py-3.5"><span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${project.status === 'healthy' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : project.status === 'watch' ? 'bg-amber-300/10 text-amber-800 dark:text-amber-100' : 'bg-rose-300/10 text-rose-700 dark:text-rose-100'}`}>{project.status}</span><p className="mt-1.5 max-w-[260px] text-[11px] leading-4 text-[rgb(var(--text-3))]">{project.signal}</p></td></tr>)}</tbody></table></div></Card><SharedResourceAllocation /></>;
}

// Provenance badge, matching the Money workspace lanes so a number means the
// same thing wherever it appears.
function Prov({ kind }: { kind: 'filed' | 'derived' | 'illustrative' | 'unknown' }) {
  const [label, className] = kind === 'filed'
    ? ['Filed · 990', 'bg-[rgb(var(--info)/0.12)] text-[rgb(var(--info))]']
    : kind === 'derived'
      ? ['Derived', 'bg-[rgb(var(--line)/0.07)] text-[rgb(var(--text-2))]']
      : kind === 'illustrative'
        ? ['Illustrative', 'bg-amber-300/10 text-amber-800 dark:text-amber-200']
        : ['Unknown', 'bg-rose-300/10 text-rose-700 dark:text-rose-200'];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${className}`}>{label}</span>;
}

// Shared-resource allocation: the case where one engagement's people work on
// another's. Time is already coded to projects in payroll; this prices it at a
// loaded rate and moves the cost to where the work happened. It is the
// difference between "this project lost money" and "this project paid for
// someone else's crew".
function SharedResourceAllocation() {
  const rows = allocateProjects(imbaProjects);
  const balance = allocationBalance();
  const moved = rows.filter((row) => Math.abs(row.swing) > 0.01);
  const biggest = [...moved].sort((a, b) => Math.abs(b.swing) - Math.abs(a.swing))[0];

  // A pair whose ranking reverses is the clearest evidence that the projects
  // were not run differently — only recorded differently.
  const beforeRank = [...rows].sort((a, b) => b.contributionBefore - a.contributionBefore).map((r) => r.name);
  const afterRank = [...rows].sort((a, b) => b.contributionAfter - a.contributionAfter).map((r) => r.name);
  const reversals = beforeRank.flatMap((name, index) =>
    beforeRank.slice(index + 1).map((other) => ({ name, other })),
  ).filter(({ name, other }) => afterRank.indexOf(name) > afterRank.indexOf(other));

  return (
    <>
      <Card>
        <Heading eyebrow="Costing basis" title="Loaded labour rate" detail="Derived from the filed 2024 Form 990" />
        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <div className="rounded-xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4">
            <div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Known floor</p><Prov kind="derived" /></div>
            <p className="mt-3 font-mono text-2xl font-semibold text-[rgb(var(--text))]">{knownLoadedMultiplier.toFixed(4)}×</p>
            <p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">Wages → + payroll taxes {(payrollTaxRate * 100).toFixed(2)}% + benefits {(benefitRate * 100).toFixed(2)}%</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4">
            <div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">PEO admin fee</p><Prov kind="unknown" /></div>
            <p className="mt-3 font-mono text-2xl font-semibold text-[rgb(var(--text-4))]">—</p>
            <p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">Inside the PEO invoice; not isolable from a public return</p>
          </div>
          <div className="rounded-xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4">
            <div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Workers&apos; comp</p><Prov kind="unknown" /></div>
            <p className="mt-3 font-mono text-2xl font-semibold text-[rgb(var(--text-4))]">—</p>
            <p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">Premium varies by field classification; same invoice</p>
          </div>
          <p className="text-[11px] leading-5 text-[rgb(var(--text-3))] sm:col-span-3">
            Every rate below is a <span className="font-semibold text-[rgb(var(--text))]">floor</span>. The true loaded cost is higher by the two components above, which one PEO invoice would resolve on day one.
          </p>
        </div>
      </Card>

      <Card>
        <Heading eyebrow="Shared resources" title="People working across engagements" detail={`${sharedAssignments.length} assignments · hours from coded payroll time`} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.15em] text-[rgb(var(--text-3))]">
                <th className="px-5 py-3">Person</th>
                <th className="px-3 py-3">Paid by</th>
                <th className="px-3 py-3">Worked on</th>
                <th className="px-3 py-3 text-right">Hours</th>
                <th className="px-3 py-3 text-right"><span className="inline-flex items-center gap-1.5">Loaded rate <ImbaInfoTooltip label="Loaded rate" text="The hourly wage plus everything the organisation pays on top of it — payroll taxes, benefits, and pension. Billing or costing a person at their bare wage understates what they actually cost by roughly 17% here, before the PEO administration fee and workers' compensation premium that a public return cannot reveal." align="right" /></span></th>
                <th className="px-5 py-3 text-right">Charge</th>
              </tr>
            </thead>
            <tbody>
              {sharedAssignments.map((assignment) => (
                <tr key={assignment.id} className="border-b border-[rgb(var(--line)/0.055)] last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-semibold text-[rgb(var(--text))]">{assignment.person}</p>
                    <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{assignment.role} · {assignment.period}</p>
                  </td>
                  <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{assignment.lendingProject}</td>
                  <td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{assignment.servingProject}</td>
                  <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{assignment.hours}</td>
                  <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text-2))]">${loadedHourlyFloor(assignment.hourlyWage).toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-[rgb(var(--text))]">${Math.round(assignmentCost(assignment)).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-[rgb(var(--line)/0.03)]">
                <td className="px-5 py-3.5 text-xs font-black uppercase tracking-wider text-[rgb(var(--text))]" colSpan={5}>Charged = credited</td>
                <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold text-[rgb(var(--text))]">${Math.round(balance.charged).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="border-t border-[rgb(var(--line)/0.07)] px-5 py-3 text-[11px] leading-5 text-[rgb(var(--text-3))]">
          Allocation moves cost between engagements; it never creates or destroys any. Charged and credited must agree — the difference here is ${balance.difference}.
        </p>
      </Card>

      <Card>
        <Heading eyebrow="The allocation question" title="Contribution before and after" detail="Same work, costs placed where they happened" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.15em] text-[rgb(var(--text-3))]">
                <th className="px-5 py-3">Project</th>
                <th className="px-3 py-3 text-right">Charged in</th>
                <th className="px-3 py-3 text-right">Credited out</th>
                <th className="px-3 py-3 text-right">As recorded</th>
                <th className="px-3 py-3 text-right">After allocation</th>
                <th className="px-5 py-3 text-right">Swing</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-[rgb(var(--line)/0.055)] last:border-0">
                  <td className="px-5 py-3.5 text-xs font-semibold text-[rgb(var(--text))]">{row.name}</td>
                  <td className="px-3 py-3.5 text-right font-mono text-[11px] text-[rgb(var(--text-3))]">{row.inboundCharge ? `$${Math.round(row.inboundCharge).toLocaleString()}` : '—'}</td>
                  <td className="px-3 py-3.5 text-right font-mono text-[11px] text-[rgb(var(--text-3))]">{row.outboundCredit ? `$${Math.round(row.outboundCredit).toLocaleString()}` : '—'}</td>
                  <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text-2))]">{row.contributionBefore.toFixed(1)}%</td>
                  <td className="px-3 py-3.5 text-right font-mono text-xs font-semibold text-[rgb(var(--text))]">{row.contributionAfter.toFixed(1)}%</td>
                  <td className={`px-5 py-3.5 text-right font-mono text-xs font-semibold ${row.swing > 0.05 ? 'text-[rgb(var(--sa-soft))]' : row.swing < -0.05 ? 'text-rose-700 dark:text-rose-200' : 'text-[rgb(var(--text-4))]'}`}>
                    {Math.abs(row.swing) < 0.05 ? '—' : `${row.swing > 0 ? '+' : '−'}${Math.abs(row.swing).toFixed(1)} pts`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 border-t border-[rgb(var(--line)/0.07)] p-5">
          {biggest ? (
            <p className="text-[11px] leading-5 text-[rgb(var(--text-2))]">
              Largest move: <span className="font-semibold text-[rgb(var(--text))]">{biggest.name}</span> shifts {Math.abs(biggest.swing).toFixed(1)} points once the people it {biggest.swing > 0 ? 'lent out are charged where they worked' : 'borrowed are charged to it'}.
            </p>
          ) : null}
          {reversals.length ? (
            <p className="text-[11px] leading-5 text-[rgb(var(--text-2))]">
              {reversals.length === 1 ? 'One pair reverses' : `${reversals.length} pairs reverse`} in ranking — for example <span className="font-semibold text-[rgb(var(--text))]">{reversals[0].other}</span> now outperforms <span className="font-semibold text-[rgb(var(--text))]">{reversals[0].name}</span>. Neither engagement was run differently; the cost was sitting in the wrong place.
            </p>
          ) : null}
          <p className="text-[11px] leading-5 text-[rgb(var(--text-3))]">
            Project values are illustrative. The method is not: hours come from time already coded in payroll, priced at the filed multiplier, credited to the engagement that carried the payroll and charged to the one that received the work.
          </p>
        </div>
      </Card>
    </>
  );
}

function ProjectBoard() {
  const { getEditedRecord, updateRecord } = useImbaOsState();
  const columns = ['Ready', 'In progress', 'Decision', 'Complete'];
  const tasks = imbaProjectTasks.map((task) => getEditedRecord('project-task', task.id, task));
  const move = (id: string, direction: number) => { const task = tasks.find((item) => item.id === id); if (!task) return; const index = columns.indexOf(task.column); const column = columns[Math.max(0, Math.min(columns.length - 1, index + direction))]; updateRecord('project-task', id, { column }, { actor: 'Project owner', detail: `Moved ${task.title} from ${task.column} to ${column}.`, queue: column === 'Complete' && task.finance.includes('$') ? { system: 'qbo', action: 'update', recordType: 'Project milestone', recordId: id, summary: `${task.project} · ${task.finance} · completion evidence`, requiresApproval: true } : undefined }); };
  return <><div className="grid gap-3 sm:grid-cols-4"><Kpi label="Open delivery tasks" value={`${tasks.filter((task) => task.column !== 'Complete').length}`} note="Across project and finance owners" /><Kpi label="Decision blocked" value={`${tasks.filter((task) => task.column === 'Decision').length}`} note="Management input required" tone="amber" /><Kpi label="Billing triggers" value="2" note="$252K connected to task completion" tone="lime" /><Kpi label="Grant deliverables" value="1" note="Funder evidence embedded in workflow" /></div><div className="grid gap-4 xl:grid-cols-4">{columns.map((column) => <Card key={column}><Heading eyebrow={`${tasks.filter((task) => task.column === column).length} cards`} title={column} /><div className="min-h-[360px] space-y-3 p-3">{tasks.filter((task) => task.column === column).map((task) => <article key={task.id} className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4"><div className="flex items-start justify-between gap-2"><span className="font-mono text-[11px] text-[rgb(var(--text-3))]">{task.id}</span><span className="rounded-full bg-blue-300/10 px-2 py-1 text-[11px] font-black text-blue-700 dark:text-blue-100">{task.due}</span></div><h3 className="mt-3 text-xs font-semibold leading-5 text-[rgb(var(--text))]">{task.title}</h3><p className="mt-2 text-[11px] text-[rgb(var(--text-3))]">{task.project} · {task.owner}</p><div className="mt-3 rounded-xl border border-[rgb(var(--sa)/0.10)] bg-[rgb(var(--sa)/0.04)] px-3 py-2 text-[11px] font-semibold text-[rgb(var(--sa-soft))]">{task.finance}</div><div className="mt-3 flex justify-between"><button type="button" onClick={() => move(task.id, -1)} disabled={column === columns[0]} className="rounded-lg border border-[rgb(var(--line)/0.08)] px-2.5 py-1.5 text-[11px] font-black uppercase text-[rgb(var(--text-2))] disabled:opacity-25">Back</button><button type="button" onClick={() => move(task.id, 1)} disabled={column === columns.at(-1)} className="rounded-lg bg-blue-300 px-2.5 py-1.5 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))] disabled:opacity-25">Advance</button></div></article>)}</div></Card>)}</div></>;
}

function ChapterNetwork({ onNavigate }: { onNavigate: (view: ImbaOsView) => void }) {
  const { getEditedRecord, updateRecord } = useImbaOsState();
  const [selectedId, setSelectedId] = useState(imbaChapters[0].id);
  const selected = getEditedRecord('chapter', selectedId, imbaChapters.find((chapter) => chapter.id === selectedId) ?? imbaChapters[0]);
  return <div className="space-y-4"><div className="grid gap-4 rounded-2xl border border-blue-300/15 bg-blue-300/[0.04] p-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr]"><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Chapter<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none">{imbaChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.id} · {chapter.name}</option>)}</select></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Reporting packet<select value={selected.reporting} onChange={(event) => updateRecord('chapter', selected.id, { reporting: event.target.value }, { actor: 'Chapter finance liaison', detail: `Updated packet status for ${selected.name}.` })} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none"><option>Current</option><option>Action</option><option>Late</option><option>Onboarding</option></select></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">COA crosswalk<select value={selected.coaMap} onChange={(event) => updateRecord('chapter', selected.id, { coaMap: event.target.value }, { actor: 'Chapter finance liaison', detail: `Updated canonical account mapping state for ${selected.name}.` })} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none"><option>Mapped</option><option>Exception</option><option>Pending</option><option>In progress</option></select></label><label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">Compliance score<input type="number" min="0" max="100" value={selected.compliance} onChange={(event) => updateRecord('chapter', selected.id, { compliance: Number(event.target.value) }, { actor: 'Chapter finance liaison', detail: `Updated compliance score for ${selected.name}.` })} className="mt-1.5 w-full rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--card-2))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none" /></label></div><ChapterNetworkTable onNavigate={onNavigate} /></div>;
}

function ChapterNetworkTable({ onNavigate }: { onNavigate: (view: ImbaOsView) => void }) {
  const { getEditedRecord } = useImbaOsState();
  const chapters = imbaChapters.map((chapter) => getEditedRecord('chapter', chapter.id, chapter));
  const members = chapters.reduce((sum, chapter) => sum + chapter.members, 0);
  const settlements = chapters.reduce((sum, chapter) => sum + chapter.settlement, 0);
  const exceptions = chapters.filter((chapter) => chapter.reporting !== 'Current' || chapter.coaMap !== 'Mapped');
  const [query, setQuery] = useState('');
  const rows = chapters.filter((chapter) => `${chapter.name} ${chapter.region}`.toLowerCase().includes(query.toLowerCase()));
  return <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Kpi label="Representative chapters" value={`${imbaChapters.length}`} note="Prototype network register" /><Kpi label="Attributed members" value={members.toLocaleString('en-US')} note="Membership rolls up by chapter" tone="lime" /><Kpi label="Settlement cycle" value={money(settlements)} note="Illustrative amounts due to chapters" /><Kpi label="Current packets" value={`${imbaChapters.filter((chapter) => chapter.reporting === 'Current').length} / ${imbaChapters.length}`} note="Monthly financial reporting" tone="amber" /><Kpi label="Mapping exceptions" value={`${exceptions.length}`} note="Reporting or canonical COA action" tone="rose" /></div><Card><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--line)/0.07)] px-5 py-4"><div><p className="text-[11px] font-black uppercase tracking-[0.22em] text-[rgb(var(--text-3))]">Parent association register</p><h2 className="mt-1 text-base font-semibold text-[rgb(var(--text))]">Chapter health + financial uniformity</h2></div><div className="flex gap-2"><label className="flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.025)] px-3 py-2"><Search className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chapters" className="w-36 bg-transparent text-[11px] text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--text-4))]" /></label><button type="button" onClick={() => onNavigate('chapter-standards')} className="rounded-xl bg-blue-300 px-3 py-2 text-[11px] font-black uppercase text-[rgb(var(--sa-ink))]">Open standards</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead><tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.15em] text-[rgb(var(--text-3))]"><th className="px-5 py-3">Chapter / region</th><th className="px-3 py-3 text-right">Members</th><th className="px-3 py-3 text-right">Settlement</th><th className="px-3 py-3">Reporting</th><th className="px-3 py-3">COA mapping</th><th className="px-3 py-3">Compliance</th><th className="px-5 py-3">Next due</th></tr></thead><tbody>{rows.map((chapter) => <tr key={chapter.id} className="border-b border-[rgb(var(--line)/0.055)] last:border-0"><td className="px-5 py-3.5"><p className="text-xs font-semibold text-[rgb(var(--text))]">{chapter.name}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{chapter.id} · {chapter.region}</p></td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{chapter.members.toLocaleString('en-US')}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">{money(chapter.settlement)}</td><td className="px-3 py-3.5"><span className={`rounded-full px-2 py-1 text-[11px] font-black uppercase ${chapter.reporting === 'Current' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : chapter.reporting === 'Late' ? 'bg-rose-300/10 text-rose-700 dark:text-rose-100' : 'bg-amber-300/10 text-amber-800 dark:text-amber-100'}`}>{chapter.reporting}</span></td><td className="px-3 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{chapter.coaMap}</td><td className="px-3 py-3.5"><div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-[rgb(var(--line)/0.07)]"><div className={`h-full rounded-full ${chapter.compliance >= 90 ? 'bg-[rgb(var(--sa))]' : chapter.compliance >= 80 ? 'bg-amber-300' : 'bg-rose-300'}`} style={{ width: `${chapter.compliance}%` }} /></div><span className="font-mono text-[11px] text-[rgb(var(--text))]">{chapter.compliance}%</span></div></td><td className="px-5 py-3.5 text-[11px] text-[rgb(var(--text-2))]">{chapter.nextDue}</td></tr>)}</tbody></table></div></Card></>;
}

function ChapterStandards() {
  const standards = [
    { name: 'Canonical chart-of-accounts mapping', owner: 'IMBA Finance', cadence: 'Onboarding + annual', evidence: 'Approved account crosswalk', coverage: '4 / 6', status: 'Action' },
    { name: 'Monthly chapter financial packet', owner: 'Chapter treasurer', cadence: 'Monthly', evidence: 'P&L, balance sheet, cash, restrictions', coverage: '3 / 6', status: 'Action' },
    { name: 'Membership settlement reconciliation', owner: 'IMBA Finance', cadence: 'Monthly', evidence: 'Member roster to processor to payable', coverage: '6 / 6', status: 'Ready' },
    { name: 'Restricted-fund roll-forward', owner: 'Chapter + IMBA', cadence: 'Quarterly', evidence: 'Purpose, opening, use, closing', coverage: '5 / 6', status: 'Watch' },
    { name: 'Federal/state filing attestation', owner: 'Chapter board', cadence: 'Annual', evidence: 'Filing receipt + good standing', coverage: '6 / 6', status: 'Ready' },
    { name: 'Conflict + board governance attestation', owner: 'Chapter board', cadence: 'Annual', evidence: 'Signed certification', coverage: '5 / 6', status: 'Watch' },
  ];
  return <><div className="grid gap-3 sm:grid-cols-4"><Kpi label="Network standards" value={`${standards.length}`} note="Minimum uniform reporting contract" /><Kpi label="Ready controls" value={`${standards.filter((item) => item.status === 'Ready').length}`} note="Coverage complete" tone="lime" /><Kpi label="Open exceptions" value="5" note="Mapped to owners and deadlines" tone="amber" /><Kpi label="Unexplained variance" value="$14K" note="Held from auto-settlement pending review" tone="rose" /></div><div className="grid gap-5 xl:grid-cols-12"><Card className="xl:col-span-8"><Heading eyebrow="Uniformity matrix" title="Minimum chapter financial + governance contract" /><div className="divide-y divide-[rgb(var(--line)/0.06)]">{standards.map((item) => <div key={item.name} className="grid gap-3 px-5 py-4 md:grid-cols-[1.4fr_1fr_1fr_.6fr_auto]"><div><p className="text-xs font-semibold text-[rgb(var(--text))]">{item.name}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{item.evidence}</p></div><div><p className="text-[11px] font-black uppercase text-[rgb(var(--text-4))]">Owner</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">{item.owner}</p></div><div><p className="text-[11px] font-black uppercase text-[rgb(var(--text-4))]">Cadence</p><p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">{item.cadence}</p></div><div className="self-center font-mono text-xs text-blue-700 dark:text-blue-100">{item.coverage}</div><span className={`self-center rounded-full px-2 py-1 text-[11px] font-black uppercase ${item.status === 'Ready' ? 'bg-[rgb(var(--sa)/0.10)] text-[rgb(var(--sa-soft))]' : item.status === 'Watch' ? 'bg-amber-300/10 text-amber-800 dark:text-amber-100' : 'bg-rose-300/10 text-rose-700 dark:text-rose-100'}`}>{item.status}</span></div>)}</div></Card><Card className="xl:col-span-4"><Heading eyebrow="Exception workflow" title="Comply, explain, or remediate" /><div className="space-y-4 p-5">{[['1', 'Validate', 'Automated completeness and mapping checks'], ['2', 'Return', 'Chapter receives a plain-language exception queue'], ['3', 'Certify', 'Treasurer confirms correction or documented variance'], ['4', 'Consolidate', 'Only controlled data enters network reporting'], ['5', 'Escalate', 'Material or repeated exceptions reach leadership']].map(([number, title, note]) => <div key={number} className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-300/10 font-mono text-[11px] text-blue-700 dark:text-blue-100">{number}</span><div><p className="text-[11px] font-semibold text-[rgb(var(--text))]">{title}</p><p className="mt-1 text-[11px] leading-4 text-[rgb(var(--text-3))]">{note}</p></div></div>)}</div></Card></div></>;
}

function DataExchange() {
  const [selected, setSelected] = useState(imbaDataFlows[1]);
  const inflows = ['Membership + donations', 'Project invoices + grants', 'Chapter reporting packets', 'PEO + expense detail'];
  const outputs = ['General ledger + subledgers', 'Chapter settlement payable', 'CEO / Board reporting', 'Project + grant decisions'];
  return <><div className="grid gap-3 sm:grid-cols-4"><Kpi label="Connected flows" value={`${imbaDataFlows.length}`} note="Source-to-destination contracts" /><Kpi label="Automated controls" value="14" note="Totals, tags, duplicates, stale data" tone="lime" /><Kpi label="Open exceptions" value="7" note="Human review before posting" tone="amber" /><Kpi label="Unreconciled value" value="$14K" note="Blocked from consolidated output" tone="rose" /></div><Card><Heading eyebrow="Synthesis architecture" title="Inflow → normalize → reconcile → post → report" detail="Uniform without forcing every chapter into identical software" /><div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr]"><div className="space-y-2">{inflows.map((item) => <div key={item} className="rounded-xl border border-blue-300/10 bg-blue-300/[0.04] px-3 py-2.5 text-[11px] text-blue-700 dark:text-blue-100">{item}</div>)}</div><div className="hidden items-center text-[rgb(var(--text-4))] lg:flex"><ArrowRight className="h-5 w-5" /></div><div className="rounded-2xl border border-[rgb(var(--sa)/0.20)] bg-[rgb(var(--sa))]/[0.05] p-4"><div className="flex items-center gap-2 text-[rgb(var(--sa-soft))]"><GitMerge className="h-4 w-4" /><p className="text-[11px] font-black uppercase tracking-wider">IMBA canonical data layer</p></div><div className="mt-4 grid grid-cols-2 gap-2">{['Entity / chapter', 'Project / phase', 'Funder / restriction', 'Account / function', 'Counterparty', 'Period / source'].map((item) => <div key={item} className="rounded-lg border border-[rgb(var(--line)/0.06)] bg-black/10 px-2 py-2 text-center text-[11px] text-[rgb(var(--text-2))]">{item}</div>)}</div><p className="mt-4 text-[11px] leading-4 text-[rgb(var(--text-3))]">Every source keeps its operational purpose. The canonical layer standardizes only the dimensions finance needs to reconcile and consolidate.</p></div><div className="hidden items-center text-[rgb(var(--text-4))] lg:flex"><ArrowRight className="h-5 w-5" /></div><div className="space-y-2">{outputs.map((item) => <div key={item} className="rounded-xl border border-[rgb(var(--sa)/0.10)] bg-[rgb(var(--sa)/0.04)] px-3 py-2.5 text-[11px] text-[rgb(var(--sa-soft))]">{item}</div>)}</div></div></Card><div className="grid gap-5 xl:grid-cols-12"><Card className="xl:col-span-8"><Heading eyebrow="Interface register" title="System-to-system data contracts" /><div className="divide-y divide-[rgb(var(--line)/0.06)]">{imbaDataFlows.map((flow) => <button key={flow.source} type="button" onClick={() => setSelected(flow)} className={`grid w-full gap-3 px-5 py-4 text-left md:grid-cols-[1fr_1.2fr_1fr_.6fr_auto] ${selected.source === flow.source ? 'bg-blue-300/[0.035]' : 'hover:bg-[rgb(var(--line)/0.02)]'}`}><div><p className="text-[11px] font-semibold text-[rgb(var(--text))]">{flow.source}</p><p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{flow.event}</p></div><span className="self-center text-[11px] text-[rgb(var(--text-2))]">→ {flow.destination}</span><span className="self-center text-[11px] text-[rgb(var(--text-3))]">{flow.control}</span><span className="self-center text-[11px] text-blue-700 dark:text-blue-100">{flow.frequency}</span><span className="self-center rounded-full bg-[#68b9aa]/10 px-2 py-1 text-[11px] font-black uppercase text-[rgb(var(--info))]">{flow.status}</span></button>)}</div></Card><Card className="xl:col-span-4"><Heading eyebrow="Selected interface" title={selected.source} /><div className="space-y-4 p-5"><div className="flex items-center justify-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-5"><Database className="h-6 w-6 text-blue-700 dark:text-blue-100" /><ArrowRight className="h-4 w-4 text-[rgb(var(--text-4))]" /><Network className="h-6 w-6 text-[rgb(var(--sa-soft))]" /></div>{[['Event', selected.event], ['Destination', selected.destination], ['Frequency', selected.frequency], ['Control', selected.control]].map(([label, value]) => <div key={label}><p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">{label}</p><p className="mt-1 text-[11px] leading-5 text-[rgb(var(--text))]">{value}</p></div>)}<div className="rounded-xl border border-[rgb(var(--sa)/0.15)] bg-[rgb(var(--sa))]/[0.04] px-3 py-2 text-[11px] text-[rgb(var(--sa-soft))]">Exceptions stop in staging. Only certified records post or consolidate.</div></div></Card></div></>;
}
