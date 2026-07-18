"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Compass,
  Database,
  MapPin,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { ImbaOsView } from "@/lib/imba-os-data";

export type ImbaMissionView =
  | "community-progress"
  | "trail-solutions"
  | "programs-education"
  | "assessments-designations"
  | "advocacy-policy"
  | "trail-assets"
  | "impact-research";

interface MissionRecord {
  id: string;
  name: string;
  secondary: string;
  value: string;
  owner: string;
  next: string;
  status: string;
  detail: string;
  relationships: string[];
  touchpoints: string[];
  linkedView: ImbaOsView;
}

interface MissionConfig {
  eyebrow: string;
  title: string;
  description: string;
  valueLabel: string;
  metrics: Array<{ label: string; value: string; note: string }>;
  workflow: string[];
  records: MissionRecord[];
}

const configs: Record<ImbaMissionView, MissionConfig> = {
  "community-progress": {
    eyebrow: "Mission / Community Progress Shop",
    title: "Community progress",
    description:
      "One community record joins assessments, local organizations, grants, services, projects, land-access relationships, advocacy, designations, and measurable outcomes.",
    valueLabel: "Community stage",
    metrics: [
      { label: "Communities engaged", value: "742", note: "2025 public baseline" },
      { label: "Committed", value: "82", note: "Professional plan in hand" },
      { label: "Created", value: "138", note: "Opening day or completed path" },
      { label: "Records needing next move", value: "47", note: "Illustrative action queue" },
    ],
    workflow: ["Engaged", "Committed", "Created", "Featured"],
    records: [
      {
        id: "CMT-1042",
        name: "High Desert Community",
        secondary: "Western region / municipal partner",
        value: "Committed",
        owner: "Community Programs",
        next: "Permit strategy / Aug 8",
        status: "On track",
        detail:
          "A professional trail plan is complete. Funding and land-access work now determine when the community can move into construction.",
        relationships: ["Municipal lead", "Land manager", "Local trail champion", "IMBA owner"],
        touchpoints: ["Community assessment", "Trail Solutions plan", "Funding coaching", "Local organization"],
        linkedView: "project-command",
      },
      {
        id: "CMT-1188",
        name: "River Valley Community",
        secondary: "Central region / county partnership",
        value: "Engaged",
        owner: "IMBA Local",
        next: "Assessment review / Jul 31",
        status: "Capacity gap",
        detail:
          "Strong volunteer energy is present, but governance, sustainable funding, and a formal land-manager relationship need development.",
        relationships: ["County parks", "Volunteer lead", "Prospective local organization"],
        touchpoints: ["Trailhead Workshop", "Community assessment", "Advocacy consultation"],
        linkedView: "assessments-designations",
      },
      {
        id: "CMT-1274",
        name: "Pine Ridge Community",
        secondary: "Eastern region / destination partner",
        value: "Created",
        owner: "Trail Solutions",
        next: "Stewardship handoff / Aug 15",
        status: "Watch",
        detail:
          "Construction is complete. The next operating risk is transferring maintenance ownership, evidence, and funding into a durable stewardship plan.",
        relationships: ["City manager", "Local organization", "Maintenance partner", "Tourism office"],
        touchpoints: ["Planning", "Construction", "Volunteer training", "Trails Count"],
        linkedView: "trail-assets",
      },
      {
        id: "CMT-1355",
        name: "Lake Country Community",
        secondary: "Great Lakes / regional coalition",
        value: "Featured",
        owner: "Community Programs",
        next: "Designation renewal / Nov 1",
        status: "Healthy",
        detail:
          "The community has a mature trail ecosystem and now requires designation evidence, impact storytelling, and renewal management.",
        relationships: ["Regional coalition", "Land agency", "Tourism bureau", "IMBA designation lead"],
        touchpoints: ["Designation", "Impact study", "Maintenance plan", "Marketing"],
        linkedView: "impact-research",
      },
    ],
  },
  "trail-solutions": {
    eyebrow: "Mission / earned-revenue delivery",
    title: "Trail Solutions",
    description:
      "Control the complete service chain from vision and inventory through planning, design, construction, signage, maintenance, and client acceptance.",
    valueLabel: "Delivery phase",
    metrics: [
      { label: "Planning projects", value: "53", note: "Across 27 states" },
      { label: "Miles planned", value: "703.7", note: "2025 public baseline" },
      { label: "Construction projects", value: "11", note: "Across 10 states" },
      { label: "Miles built", value: "41.2", note: "2025 public baseline" },
    ],
    workflow: ["Qualify", "Plan + design", "Build + sign", "Accept + steward"],
    records: [
      {
        id: "TS-26018",
        name: "Regional Trail Master Plan",
        secondary: "Planning and design",
        value: "Plan + design",
        owner: "Senior Planner",
        next: "30% concept review",
        status: "Healthy",
        detail:
          "Community engagement, asset inventory, concept alternatives, funding assumptions, and land-manager approvals share one controlled project record.",
        relationships: ["Client sponsor", "Land agency", "Local organization", "Design lead"],
        touchpoints: ["Signed SOW", "Field inventory", "Community session", "Billing milestone"],
        linkedView: "project-command",
      },
      {
        id: "TS-26023",
        name: "Urban Bike Park Build",
        secondary: "Professional construction",
        value: "Build + sign",
        owner: "Construction PM",
        next: "Change-order decision",
        status: "Decision",
        detail:
          "Field production, equipment, subcontractors, safety, client decisions, estimate-to-complete, and billing triggers are joined.",
        relationships: ["Municipal client", "General contractor", "Safety lead", "Project accountant"],
        touchpoints: ["Mobilization", "Daily production", "Change request", "Inspection"],
        linkedView: "project-board",
      },
      {
        id: "TS-26031",
        name: "Destination Wayfinding System",
        secondary: "Signage and wayfinding",
        value: "Build + sign",
        owner: "Signage Lead",
        next: "Fabrication release",
        status: "On track",
        detail:
          "Sign inventory, design standards, approvals, fabrication, placement, accessibility, and final asset ownership move together.",
        relationships: ["Tourism office", "Land manager", "Fabricator", "Brand owner"],
        touchpoints: ["Sign plan", "Proof approval", "Fabrication", "Installation map"],
        linkedView: "trail-assets",
      },
    ],
  },
  "programs-education": {
    eyebrow: "Mission / programs + learning",
    title: "Programs and education",
    description:
      "Manage IMBA's educational product catalog, inquiries, hosts, pricing, grants, instructor capacity, travel, participants, curriculum, and completion evidence.",
    valueLabel: "Offering",
    metrics: [
      { label: "Trail Care Workshops", value: "13", note: "223 attendees in 2025" },
      { label: "Federal trainings", value: "16", note: "454 attendees in 2025" },
      { label: "Digital engagements", value: "28,579", note: "Resources and learning" },
      { label: "Instructor utilization", value: "78%", note: "Illustrative 90-day plan" },
    ],
    workflow: ["Inquiry", "Scope + fund", "Schedule + deliver", "Complete + evaluate"],
    records: [
      {
        id: "EDU-2607",
        name: "Trail Care Workshop",
        secondary: "Site-specific stewardship training",
        value: "Scheduled",
        owner: "Education Manager",
        next: "Host permissions / Aug 2",
        status: "Watch",
        detail:
          "Host readiness, permissions, instructor travel, participant roster, field conditions, curriculum, and evaluation are controlled together.",
        relationships: ["Host organization", "Land manager", "Instructor", "Participants"],
        touchpoints: ["Inquiry", "Scope", "Travel", "Completion survey"],
        linkedView: "trail-assets",
      },
      {
        id: "EDU-2611",
        name: "Trailhead Workshop",
        secondary: "Community vision and readiness",
        value: "Inquiry",
        owner: "Community Programs",
        next: "Readiness call / Jul 29",
        status: "Qualified",
        detail:
          "The workshop becomes a formal community touchpoint and can trigger assessment, local-organization, advocacy, and Trail Solutions follow-up.",
        relationships: ["Community champion", "Municipal contact", "Facilitator"],
        touchpoints: ["Readiness form", "Workshop", "Action plan", "CRM follow-up"],
        linkedView: "community-progress",
      },
      {
        id: "EDU-2616",
        name: "Funding Services Coaching",
        secondary: "Paid or grant-funded consulting",
        value: "Delivering",
        owner: "Funding Education",
        next: "Capital plan review",
        status: "On track",
        detail:
          "Coaching hours, match requirements, fundraising plan, grant prospects, proposal support, and client outcomes remain visible.",
        relationships: ["Community team", "Grant funder", "Coach", "Finance reviewer"],
        touchpoints: ["Award or contract", "Coaching log", "Funding plan", "Outcome report"],
        linkedView: "development-grant-pipeline",
      },
    ],
  },
  "assessments-designations": {
    eyebrow: "Mission / standards + recognition",
    title: "Assessments and designations",
    description:
      "Run assessment scoring, evidence collection, eligibility, review, fees, awards, marketing assets, term monitoring, and renewals for IMBA designations.",
    valueLabel: "Lifecycle stage",
    metrics: [
      { label: "Assessment threshold", value: "275", note: "Trail Town qualification" },
      { label: "Designation term", value: "3 yrs", note: "Renewal required" },
      { label: "Application fee", value: "$500", note: "Trail Town public price" },
      { label: "Renewal queue", value: "9", note: "Illustrative next 12 months" },
    ],
    workflow: ["Assess", "Qualify", "Review + award", "Monitor + renew"],
    records: [
      {
        id: "DSG-2604",
        name: "Trail Town application",
        secondary: "Illustrative destination community",
        value: "Evidence review",
        owner: "Designation Lead",
        next: "Inventory validation",
        status: "Action",
        detail:
          "Assessment score, trail inventory and map, funding, stewardship, local organization, engagement evidence, payment, and reviewer decision share one file.",
        relationships: ["Applicant lead", "Local organization", "Reviewer", "Finance"],
        touchpoints: ["Assessment", "Application", "Fee", "Evidence review"],
        linkedView: "community-progress",
      },
      {
        id: "DSG-2608",
        name: "Ride Center renewal",
        secondary: "Illustrative destination partner",
        value: "Monitor + renew",
        owner: "Designation Lead",
        next: "Site review / Sep 12",
        status: "On track",
        detail:
          "Renewal verifies continued quality, visitor experience, stewardship, trail inventory, local capacity, and approved brand use.",
        relationships: ["Destination partner", "Land managers", "Local organization", "Marketing"],
        touchpoints: ["Renewal notice", "Evidence refresh", "Site review", "Brand package"],
        linkedView: "trail-assets",
      },
      {
        id: "DSG-2612",
        name: "EPICS recognition",
        secondary: "Signature trail experience",
        value: "Nominated",
        owner: "Community Programs",
        next: "Criteria screening",
        status: "Qualified",
        detail:
          "The nomination is connected to the trail asset, land manager, stewardship owner, public story, and current condition evidence.",
        relationships: ["Nominator", "Land manager", "Stewardship owner"],
        touchpoints: ["Nomination", "Criteria", "Review", "Publication"],
        linkedView: "impact-research",
      },
    ],
  },
  "advocacy-policy": {
    eyebrow: "Mission / advocacy + government affairs",
    title: "Advocacy and policy",
    description:
      "Manage issues, policies, land-management plans, decision makers, coalition partners, calls to action, deadlines, public comments, and outcomes.",
    valueLabel: "Issue stage",
    metrics: [
      { label: "Advocates activated", value: "8,000", note: "2025 national issues" },
      { label: "Land plans", value: "6", note: "IMBA engagement in 2025" },
      { label: "Federal / state policies", value: "7", note: "IMBA engagement in 2025" },
      { label: "Government meetings", value: "237", note: "Agency, Congress, Capitol Hill" },
    ],
    workflow: ["Monitor", "Plan", "Mobilize", "Decision + follow-through"],
    records: [
      {
        id: "ADV-2609",
        name: "Regional land-management plan",
        secondary: "Access and trail policy",
        value: "Public comment",
        owner: "Government Affairs",
        next: "Comment deadline / Aug 19",
        status: "Mobilizing",
        detail:
          "Issue analysis, local intelligence, coalition position, geographic audience, approved message, public comments, and agency decision are linked.",
        relationships: ["Federal agency", "Local organization", "Coalition partner", "Policy lead"],
        touchpoints: ["Issue brief", "ACT campaign", "Public comment", "Decision"],
        linkedView: "development-marketing",
      },
      {
        id: "ADV-2614",
        name: "State trail-funding measure",
        secondary: "Funding policy",
        value: "Coalition strategy",
        owner: "Policy Director",
        next: "Partner briefing / Aug 5",
        status: "Planning",
        detail:
          "Legislative status, sponsors, committee dates, partners, local examples, message discipline, and funding impact are kept current.",
        relationships: ["Legislative sponsor", "Outdoor coalition", "Local leaders", "Communications"],
        touchpoints: ["Bill tracking", "Coalition meeting", "Member alert", "Vote"],
        linkedView: "development-partnerships",
      },
      {
        id: "ADV-2618",
        name: "Local trail-access campaign",
        secondary: "Action Cultivator Tool request",
        value: "Campaign intake",
        owner: "Local Advocacy",
        next: "Strategy consult / Jul 30",
        status: "Qualified",
        detail:
          "The local request includes the decision maker, desired action, deadline, geography, evidence, audience, and post-campaign outcome.",
        relationships: ["Local organization", "Land owner", "Community advocates", "IMBA advisor"],
        touchpoints: ["Intake", "Consultation", "Audience segment", "Action report"],
        linkedView: "chapter-network",
      },
    ],
  },
  "trail-assets": {
    eyebrow: "Mission / assets + stewardship",
    title: "Trail assets and stewardship",
    description:
      "Carry trail systems beyond project close with mapped assets, ownership, access, permits, condition, signage, inspections, maintenance plans, incidents, and funding.",
    valueLabel: "Asset state",
    metrics: [
      { label: "Mapped systems", value: "126", note: "Illustrative portfolio" },
      { label: "Miles in register", value: "1,840", note: "Illustrative managed scope" },
      { label: "Maintenance plans current", value: "84%", note: "19 need renewal" },
      { label: "Open safety actions", value: "7", note: "Owned and time-bound" },
    ],
    workflow: ["Inventory", "Access + approve", "Operate + inspect", "Maintain + improve"],
    records: [
      {
        id: "AST-1048",
        name: "North Ridge Trail System",
        secondary: "Natural-surface trail network",
        value: "Operating",
        owner: "Local steward",
        next: "Seasonal inspection / Aug 6",
        status: "Healthy",
        detail:
          "Trail segments, difficulty, allowed uses, ownership, access agreements, condition, signage, inspection history, and maintenance tasks remain attached.",
        relationships: ["Land manager", "Stewardship organization", "Emergency services", "IMBA advisor"],
        touchpoints: ["GIS inventory", "Access agreement", "Inspection", "Work log"],
        linkedView: "chapter-network",
      },
      {
        id: "AST-1112",
        name: "Canyon Bike Park",
        secondary: "Progressive-use facility",
        value: "Maintenance watch",
        owner: "Municipal operator",
        next: "Feature assessment / Jul 28",
        status: "Watch",
        detail:
          "High-consequence features require inspection evidence, repair priority, closure authority, skilled labor, and maintenance funding.",
        relationships: ["Facility owner", "Trail contractor", "Risk manager", "Local organization"],
        touchpoints: ["Condition report", "Repair scope", "Closure notice", "Reinspection"],
        linkedView: "project-board",
      },
      {
        id: "AST-1179",
        name: "Regional Wayfinding Network",
        secondary: "Signs and visitor navigation",
        value: "Renewal due",
        owner: "Destination partner",
        next: "Sign audit / Sep 3",
        status: "Action",
        detail:
          "Each sign has an approved standard, location, message, owner, installation record, condition, and replacement plan.",
        relationships: ["Tourism office", "Land agencies", "Fabricator", "Brand owner"],
        touchpoints: ["Sign inventory", "Brand approval", "Installation", "Condition audit"],
        linkedView: "assessments-designations",
      },
    ],
  },
  "impact-research": {
    eyebrow: "Mission / evidence + learning",
    title: "Impact and research",
    description:
      "Turn trail use, community progress, volunteer effort, project delivery, policy work, funding leverage, and health or economic outcomes into decision-ready evidence.",
    valueLabel: "Evidence stage",
    metrics: [
      { label: "TAG investment", value: "$817K", note: "66 communities" },
      { label: "Local funds leveraged", value: "$15M+", note: "From awarded plans" },
      { label: "Volunteer hours", value: "12,315", note: "3,402 volunteers in 2025" },
      { label: "Evidence gaps", value: "12", note: "Illustrative reporting queue" },
    ],
    workflow: ["Define outcome", "Collect + govern", "Analyze", "Report + learn"],
    records: [
      {
        id: "IMP-2603",
        name: "Trails Count cohort",
        secondary: "Use measurement and data products",
        value: "Collecting",
        owner: "Local Programs",
        next: "Counter QA / Aug 1",
        status: "On track",
        detail:
          "Counter assets, installation approval, software training, data quality, weather context, analysis, branded deliverables, and press obligations are joined.",
        relationships: ["Awardee", "Land manager", "Eco Counter", "IMBA analyst"],
        touchpoints: ["Grant award", "Installation", "Data QA", "Impact package"],
        linkedView: "trail-assets",
      },
      {
        id: "IMP-2608",
        name: "Community progress scorecard",
        secondary: "Engaged to Featured outcomes",
        value: "Reporting",
        owner: "Community Programs",
        next: "Quarterly certification",
        status: "Action",
        detail:
          "Movement between stages is supported by dated evidence rather than manually assembled narratives or disconnected project lists.",
        relationships: ["Community owners", "Program leads", "Development", "Executive team"],
        touchpoints: ["Stage evidence", "Outcome review", "Funder reporting", "Annual story"],
        linkedView: "community-progress",
      },
      {
        id: "IMP-2611",
        name: "Economic and health evidence library",
        secondary: "Research and studies",
        value: "Published",
        owner: "Research Lead",
        next: "Metadata refresh / Oct 1",
        status: "Healthy",
        detail:
          "Research provenance, geography, methods, findings, reuse rights, program relevance, and approved messages remain searchable and current.",
        relationships: ["Research partner", "Program owner", "Communications", "Funder"],
        touchpoints: ["Study", "Review", "Publication", "Program reuse"],
        linkedView: "development-marketing",
      },
    ],
  },
};

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-[#142321] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#718981]">{label}</p>
      <p className="mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] text-blue-100">{value}</p>
      <p className="mt-1.5 text-[10px] leading-4 text-[#81978f]">{note}</p>
    </div>
  );
}

export function ImbaMissionWorkspace({
  view,
  onNavigate,
}: {
  view: ImbaMissionView;
  onNavigate: (view: ImbaOsView) => void;
}) {
  const config = configs[view];
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All stages");
  const [selectedId, setSelectedId] = useState(config.records[0].id);
  const stages = useMemo(
    () => ["All stages", ...Array.from(new Set(config.records.map((record) => record.value)))],
    [config.records],
  );
  const records = useMemo(
    () =>
      config.records.filter((record) => {
        const matchesQuery = `${record.name} ${record.secondary} ${record.owner} ${record.status}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStage = stage === "All stages" || record.value === stage;
        return matchesQuery && matchesStage;
      }),
    [config.records, query, stage],
  );
  const selected = config.records.find((record) => record.id === selectedId) ?? config.records[0];

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-blue-400/20 bg-[linear-gradient(120deg,rgba(96,165,250,.09),rgba(255,255,255,.018))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-blue-100/70">{config.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{config.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#a5b7b1]">{config.description}</p>
          </div>
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3">
            <p className="text-[9px] font-black uppercase text-amber-100">Public baseline + prototype records</p>
            <p className="mt-1 max-w-[250px] text-[10px] leading-4 text-[#9caaa6]">Public metrics anchor the model; operating records remain illustrative until validated with IMBA.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {config.metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>

      <section className="rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90 p-5">
        <div className="flex items-center gap-2 text-blue-100">
          <Compass className="h-4 w-4" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em]">Operating lifecycle</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {config.workflow.map((item, index) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl border border-blue-300/10 bg-blue-300/[0.035] p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-300/10 font-mono text-[9px] text-blue-100">{index + 1}</span>
              <p className="text-[10px] font-semibold text-white">{item}</p>
              {index < config.workflow.length - 1 ? <ArrowRight className="ml-auto hidden h-3.5 w-3.5 text-[#617971] md:block" /> : null}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90 xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#718981]">Mission operating register</p>
              <h3 className="mt-1 text-base font-semibold text-white">{config.title} queue</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 py-2">
                <Search className="h-3.5 w-3.5 text-[#718981]" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records" className="w-36 bg-transparent text-[10px] text-white outline-none placeholder:text-[#617971]" />
              </label>
              <select value={stage} onChange={(event) => setStage(event.target.value)} className="rounded-xl border border-white/[0.09] bg-[#14201e] px-3 py-2 text-[10px] text-white outline-none">
                {stages.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-white/[0.07] text-[9px] font-black uppercase tracking-[0.15em] text-[#6f8981]">
                  <th className="px-5 py-3">Record</th>
                  <th className="px-3 py-3">{config.valueLabel}</th>
                  <th className="px-3 py-3">Owner</th>
                  <th className="px-3 py-3">Next move</th>
                  <th className="px-5 py-3">Signal</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className={`border-b border-white/[0.055] last:border-0 hover:bg-white/[0.025] ${selected.id === record.id ? "bg-blue-300/[0.04]" : ""}`}>
                    <td className="px-5 py-3.5"><button type="button" aria-current={selected.id === record.id ? "true" : undefined} onClick={() => setSelectedId(record.id)} className="block text-left"><span className="block text-xs font-semibold text-white">{record.name}</span><span className="mt-1 block text-[9px] text-[#718981]">{record.id} / {record.secondary}</span></button></td>
                    <td className="px-3 py-3.5 font-mono text-xs font-semibold text-blue-100">{record.value}</td>
                    <td className="px-3 py-3.5 text-[10px] text-[#afc0bb]">{record.owner}</td>
                    <td className="px-3 py-3.5 text-[10px] text-[#afc0bb]">{record.next}</td>
                    <td className="px-5 py-3.5"><span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[8px] font-black uppercase text-white">{record.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90 xl:col-span-4">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#718981]">Selected / {selected.id}</p>
            <h3 className="mt-1 text-base font-semibold text-white">{selected.name}</h3>
          </div>
          <div className="space-y-4 p-5">
            <p className="text-xs leading-6 text-[#a9bbb5]">{selected.detail}</p>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-blue-100" /><p className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Key relationships</p></div>
              <div className="mt-3 flex flex-wrap gap-2">{selected.relationships.map((item) => <span key={item} className="rounded-full border border-blue-300/10 bg-blue-300/[0.04] px-2.5 py-1 text-[9px] text-blue-100">{item}</span>)}</div>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <div className="flex items-center gap-2"><Database className="h-3.5 w-3.5 text-[#dff7a8]" /><p className="text-[9px] font-black uppercase tracking-wider text-[#718981]">Connected touchpoints</p></div>
              <div className="mt-3 space-y-2">{selected.touchpoints.map((item) => <div key={item} className="flex items-center gap-2 text-[9px] text-[#a9bbb5]"><ShieldCheck className="h-3.5 w-3.5 text-[#b7e35b]" />{item}</div>)}</div>
            </div>
            <button type="button" onClick={() => onNavigate(selected.linkedView)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-300 px-3 py-3 text-[9px] font-black uppercase text-[#102016]">
              Open linked work <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-center gap-2 text-[9px] text-[#718981]"><MapPin className="h-3.5 w-3.5" />Relationships and activity roll up to the community record.</div>
            <div className="flex items-center gap-2 text-[9px] text-[#718981]"><BarChart3 className="h-3.5 w-3.5" />Every stage change requires dated evidence.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
