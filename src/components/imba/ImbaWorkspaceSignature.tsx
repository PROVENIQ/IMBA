import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Boxes,
  Cable,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileStack,
  Gauge,
  Gavel,
  MapPinned,
  MessagesSquare,
  Radio,
  Rows3,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  Workflow,
  X,
} from 'lucide-react';

export type WorkspaceMode =
  | 'control'
  | 'document'
  | 'network'
  | 'pipeline'
  | 'queue'
  | 'studio'
  | 'timeline';

const modeLanguage: Record<WorkspaceMode, { label: string; action: string; icon: LucideIcon }> = {
  control: { label: 'Command surface', action: 'Monitor · diagnose · decide', icon: Gauge },
  document: { label: 'Document workspace', action: 'Review · annotate · release', icon: FileStack },
  network: { label: 'Relationship map', action: 'Explore · connect · assign', icon: Boxes },
  pipeline: { label: 'Pipeline workspace', action: 'Qualify · advance · forecast', icon: Target },
  queue: { label: 'Action queue', action: 'Triage · resolve · evidence', icon: Rows3 },
  studio: { label: 'Working studio', action: 'Build · model · compare', icon: Sparkles },
  timeline: { label: 'Time-based control', action: 'Sequence · own · complete', icon: Clock3 },
};

export function workspaceModeForView(viewId: string): WorkspaceMode {
  if (/(report|document|vault|board|press|template|runbook|knowledge)/.test(viewId)) return 'document';
  if (/(directory|network|system|connector|partnership|grantor|vendor|customer)/.test(viewId)) return 'network';
  if (/(crm|pipeline|campaign|hiring|onboarding|project-board|decision)/.test(viewId)) return 'pipeline';
  if (/(inbox|sync|payable|transaction|expense|compliance|activity|audit|bank)/.test(viewId)) return 'queue';
  if (/(whatif|budget|coa|mapping|role-studio|research|assessment)/.test(viewId)) return 'studio';
  if (/(calendar|roadmap|training|meeting)/.test(viewId)) return 'timeline';
  return 'control';
}

function MissionSignature({ active }: { active: number }) {
  const stages = ['Listen', 'Plan', 'Deliver', 'Measure'];
  return (
    <div className="signature-journey" role="img" aria-label="Mission operating journey">
      <div className="signature-journey-line" />
      {stages.map((stage, index) => (
        <div key={stage} className={`signature-journey-stop ${index === active ? 'is-active' : index < active ? 'is-complete' : ''}`}>
          <span>{index < active ? <CheckCircle2 /> : index + 1}</span>
          <div><strong>{stage}</strong><small>{['Community signal', 'Fundable scope', 'Field work', 'Outcome evidence'][index]}</small></div>
        </div>
      ))}
      <MapPinned className="signature-journey-mark" />
    </div>
  );
}

function MoneySignature({ title, mode }: { title: string; mode: WorkspaceMode }) {
  return (
    <div className="signature-ledger" role="img" aria-label="Finance control ledger">
      <div className="signature-ledger-head"><span>CONTROL LEDGER</span><span>FY · ROLLING</span><span>PROVENANCE ON</span></div>
      <div className="signature-ledger-row"><span>Working surface</span><strong>{title}</strong><span className="is-positive">OPEN</span></div>
      <div className="signature-ledger-row"><span>Operating mode</span><strong>{modeLanguage[mode].label}</strong><span>IMBA-OS</span></div>
      <div className="signature-ledger-row"><span>Accounting authority</span><strong>QuickBooks Online</strong><span>SYNC BOUNDARY</span></div>
    </div>
  );
}

function PeopleSignature({ active }: { active: number }) {
  const teams = [
    ['TS', 'Trail Solutions'],
    ['CP', 'Community'],
    ['DV', 'Development'],
    ['OP', 'Operations'],
    ['FN', 'Finance'],
  ];
  return (
    <div className="signature-roster" role="img" aria-label="Distributed workforce studio">
      <div className="signature-roster-copy"><UsersRound /><div><strong>Distributed workforce</strong><span>People, capacity, readiness, and continuity</span></div></div>
      <div className="signature-roster-team">
        {teams.map(([initials, label], index) => (
          <div key={initials} className={index === active % teams.length ? 'is-active' : ''}><span>{initials}</span><small>{label}</small></div>
        ))}
      </div>
    </div>
  );
}

function DevelopmentSignature({ active }: { active: number }) {
  // Discover→Commit is a genuine narrowing funnel, so bar width is proportional
  // to the count. Stewardship is the standing portfolio that follows a
  // commitment, not a fifth stage — drawing it inside the funnel forced 31 to
  // render narrower than 9, which is why the shape read as nonsense. It is
  // reported separately, below the rule.
  const stages: Array<[string, number]> = [
    ['Discover', 47],
    ['Qualify', 26],
    ['Cultivate', 18],
    ['Commit', 9],
  ];
  const peak = stages[0][1];
  const current = active % stages.length;
  return (
    <div
      className="signature-funnel"
      role="img"
      aria-label="Relationship pipeline: Discover 47, Qualify 26, Cultivate 18, Commit 9. 31 relationships in active stewardship."
    >
      <div className="signature-funnel-rows">
        {stages.map(([stage, count], index) => (
          <div key={stage} className={index === current ? 'is-active' : ''}>
            <span>{stage}{index === current ? <small>Current lens</small> : null}</span>
            <span className="signature-funnel-track">
              <span className="signature-funnel-bar" style={{ width: `${Math.round((count / peak) * 100)}%` }} />
            </span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      <div className="signature-funnel-foot">
        <UsersRound />
        <span>In stewardship</span>
        <strong>31</strong>
      </div>
    </div>
  );
}

function PlatformSignature({ active }: { active: number }) {
  const nodes: Array<[string, LucideIcon]> = [['IMBA-OS', Workflow], ['QBO', CircleDollarSign], ['ADP', UsersRound], ['Channels', MessagesSquare], ['Evidence', ShieldCheck]];
  return (
    <div className="signature-topology" role="img" aria-label="Integration topology">
      {nodes.map(([label, Icon], index) => (
        <div key={label} className={`signature-topology-node ${index === 0 ? 'is-core' : ''} ${index === active % nodes.length ? 'is-active' : ''}`}>
          <Icon /><span>{label}</span><small>{index === 0 ? 'control plane' : index === active % nodes.length ? 'selected system' : 'governed edge'}</small>
        </div>
      ))}
      <div className="signature-topology-pulse"><Radio /></div>
    </div>
  );
}

function GovernanceSignature({ active }: { active: number }) {
  const docket = ['Call to order', 'Finance & risk', 'Mission performance', 'Decisions & evidence'];
  return (
    <div className="signature-docket" role="img" aria-label="Governance docket">
      <div className="signature-docket-seal"><Gavel /><span>GOV</span></div>
      <ol>{docket.map((item, index) => <li key={item} className={index === active % docket.length ? 'is-active' : ''}><span>0{index + 1}</span><strong>{item}</strong><ChevronRight /></li>)}</ol>
      <div className="signature-docket-status"><Scale /><span>Decision record</span><strong>Evidence attached</strong></div>
    </div>
  );
}

function CollaborationSignature({ active }: { active: number }) {
  const channels = ['# leadership', '# finance', '# trail-solutions'];
  return (
    <div className="signature-channels" role="img" aria-label="Connected collaboration workspace">
      <div className="signature-channel-rail">{channels.map((channel, index) => <span key={channel} className={index === active % channels.length ? 'is-active' : ''}>{channel}</span>)}</div>
      <div className="signature-thread">
        <div><span className="signature-avatar">IM</span><p><strong>Context stays with the work.</strong><small>Conversation, decision, owner, and source evidence travel together.</small></p></div>
        <div><span className="signature-avatar is-alt">OS</span><p><strong>One assigned next move</strong><small>Cross-channel activity resolves into a visible operating commitment.</small></p></div>
      </div>
      <div className="signature-channel-tools"><MessagesSquare /><Cable /><Search /></div>
    </div>
  );
}

function SystemSignature({ title, mode }: { title: string; mode: WorkspaceMode }) {
  return (
    <div className="signature-console" role="img" aria-label="System operations console">
      <div className="signature-console-bar"><span /><span /><span /><strong>imba-os / operations</strong></div>
      <div className="signature-console-lines">
        <p><span>13:40:07</span><b>VIEW</b>{title}</p>
        <p><span>13:40:08</span><b>MODE</b>{modeLanguage[mode].label}</p>
        <p><span>13:40:09</span><b>STATE</b><em>controls observable · evidence retained</em></p>
      </div>
    </div>
  );
}

function ManagementSignature({ active }: { active: number }) {
  const cards = [
    ['Signal', 'What changed', ArrowUpRight],
    ['Meaning', 'Why it matters', BookOpen],
    ['Choice', 'What Kent decides', Target],
  ] as const;
  return (
    <div className="signature-decisions" role="img" aria-label="Executive decision sequence">
      {cards.map(([label, detail, Icon], index) => (
        <div key={label} className={index === active % cards.length ? 'is-active' : ''}><Icon /><span>{label}</span><strong>{detail}</strong><small>0{index + 1}</small></div>
      ))}
    </div>
  );
}

function TrailSolutionsSignature({ active }: { active: number }) {
  const cards = [
    ["Portfolio", "Which projects are drifting", Gauge],
    ["Forecast", "What each project will cost", BarChart3],
    ["Decision", "What action is required", Target],
  ] as const;
  return (
    <div className="grid h-full grid-cols-3 items-center gap-3" role="img" aria-label="Trail Solutions financial management sequence">
      {cards.map(([label, detail, Icon], index) => (
        <div key={label} className={`flex min-h-28 flex-col justify-center rounded-2xl border p-3 ${index === active % cards.length ? "border-teal-300/30 bg-teal-300/15" : "border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card)/0.75)]"}`}>
          <Icon className="h-4 w-4 text-[rgb(var(--sa-soft))]" />
          <span className="mt-3 text-[9px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">{label}</span>
          <strong className="mt-1 text-[11px] leading-4 text-[rgb(var(--text))]">{detail}</strong>
        </div>
      ))}
    </div>
  );
}

interface ImbaWorkspaceSignatureProps {
  section: string;
  viewId: string;
  title: string;
  description: string;
  icon: LucideIcon;
  onClose?: () => void;
}

export const ImbaWorkspaceSignature = memo(function ImbaWorkspaceSignature({
  section,
  viewId,
  title,
  description,
  icon: ViewIcon,
  onClose,
}: ImbaWorkspaceSignatureProps) {
  const mode = workspaceModeForView(viewId);
  const ModeIcon = modeLanguage[mode].icon;
  const active = [...viewId].reduce((total, character) => total + character.charCodeAt(0), 0);
  const sectionSlug = section.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <section className={`workspace-signature workspace-signature--${sectionSlug} workspace-signature-mode--${mode}${onClose ? ' workspace-signature--closable' : ''}`}>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label={`Dismiss ${section} workspace introduction`} className="workspace-signature-close">
          <X />
        </button>
      ) : null}
      <div className="workspace-signature-copy">
        <div className="workspace-signature-kicker"><span><ViewIcon /></span>{section} workspace <ChevronRight /> {modeLanguage[mode].label}</div>
        <div className="workspace-signature-title-row">
          <div><h1>{title}</h1><p>{description}</p></div>
          <div className="workspace-signature-mode"><ModeIcon /><span>Working pattern</span><strong>{modeLanguage[mode].action}</strong></div>
        </div>
      </div>
      <div className="workspace-signature-visual">
        {section === 'Mission' ? <MissionSignature active={active % 4} /> : null}
        {section === 'Trail Solutions' ? <TrailSolutionsSignature active={active} /> : null}
        {section === 'Money' ? <MoneySignature title={title} mode={mode} /> : null}
        {section === 'Finance Integration' ? <MoneySignature title={title} mode={mode} /> : null}
        {section === 'People' ? <PeopleSignature active={active} /> : null}
        {section === 'Development' ? <DevelopmentSignature active={active} /> : null}
        {section === 'Platform' ? <PlatformSignature active={active} /> : null}
        {section === 'Governance' ? <GovernanceSignature active={active} /> : null}
        {section === 'Collaboration' ? <CollaborationSignature active={active} /> : null}
        {section === 'System' ? <SystemSignature title={title} mode={mode} /> : null}
        {section === 'Management' ? <ManagementSignature active={active} /> : null}
      </div>
    </section>
  );
});
