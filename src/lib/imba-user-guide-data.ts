import type { ImbaRoleKey } from "@/lib/imba-intelligence-data";
import type { ImbaOsView } from "@/lib/imba-os-data";

export type GuideLink = {
  label: string;
  description: string;
  view: ImbaOsView;
};

export type RoleGuide = {
  summary: string;
  outcomes: string[];
  cadence: Array<{ label: string; action: string }>;
  watchFor: string[];
  links: GuideLink[];
};

export const roleGuides: Record<ImbaRoleKey, RoleGuide> = {
  executive: {
    summary: "Use IMBA-OS to see the few enterprise changes, risks, forecasts, and choices that require executive attention—not to inspect every transaction.",
    outcomes: ["Separate signal from noise", "Test choices before committing cash", "Leave a visible decision and owner"],
    cadence: [
      { label: "Daily", action: "Review triggered alerts and decisions awaiting you." },
      { label: "Weekly", action: "Scan Mission, Money, People, and Development for changed forecasts or guardrails." },
      { label: "Monthly", action: "Use the Executive Brief after Finance closes the period; approve the narrative and next moves." },
    ],
    watchFor: ["Illustrative values being treated as actuals", "Gross cash being confused with deployable cash", "A warning without a named owner or due date"],
    links: [
      { label: "Executive Brief", description: "See what changed, why it matters, and what needs a decision.", view: "brief" },
      { label: "WHAT_IF Lab", description: "Test a choice's fully loaded cost and cash effect before committing.", view: "whatif" },
      { label: "Decision Room", description: "Approve, adjust, defer, and retain the rationale and evidence.", view: "decisions" },
      { label: "12-month Roadmap", description: "Review implementation milestones, owners, and outcomes.", view: "roadmap" },
    ],
  },
  finance: {
    summary: "Use the Money pillar to establish one dependable close, reconcile source systems, produce reports, and turn accounting data into decision support.",
    outcomes: ["Close with evidence and named owners", "Explain every management number", "Protect cash, restrictions, and approval controls"],
    cadence: [
      { label: "Daily", action: "Review bank, payable, receivable, sync, and cash exceptions." },
      { label: "Weekly", action: "Refresh liquidity, project economics, grant availability, and forecast assumptions." },
      { label: "Monthly", action: "Complete the close, certify reconciliations, publish reports, and brief leadership." },
    ],
    watchFor: ["Unmapped transactions or missing project/funder tags", "PEO invoices that have not been decomposed into labor components", "Reports presented without period, source, and refresh status"],
    links: [
      { label: "Organization Snapshot", description: "Begin with performance, deployable cash, and close status.", view: "finance-snapshot" },
      { label: "Reports", description: "Produce governed statements and management reports.", view: "finance-reports" },
      { label: "Liquidity Runway", description: "Separate bank cash from cash that can actually be deployed.", view: "liquidity" },
      { label: "Integration Audit", description: "Inspect mappings, sync exceptions, approvals, and lineage.", view: "integration-audit" },
    ],
  },
  hr: {
    summary: "Use IMBA-OS to coordinate the workforce lifecycle while ADP/PEO remains the authority for payroll and core worker records.",
    outcomes: ["Keep workers, roles, and access aligned", "Make capacity and loaded labor defensible", "Complete onboarding and compliance without hidden handoffs"],
    cadence: [
      { label: "Daily", action: "Work hiring, onboarding, access, and compliance exceptions." },
      { label: "Weekly", action: "Review staffing capacity, open roles, time capture, and readiness." },
      { label: "Per payroll", action: "Reconcile ADP/PEO totals, allocations, and Finance handoff evidence." },
    ],
    watchFor: ["A worker active in one system but not another", "Missing department, project, or grant allocation", "Permanent hiring based on hoped-for rather than executed backlog"],
    links: [
      { label: "People Directory", description: "Open the role-aware workforce home and worker records.", view: "people-directory" },
      { label: "Onboarding", description: "Coordinate payroll, access, equipment, training, and readiness.", view: "people-onboarding" },
      { label: "Payroll", description: "Review payroll handoffs and labor-allocation controls.", view: "people-payroll" },
      { label: "People Reports", description: "Review headcount, capacity, and workforce signals.", view: "people-reports" },
    ],
  },
  "trail-solutions": {
    summary: "Use IMBA-OS to run the delivery portfolio from contracted scope through field execution, client acceptance, billing, and closeout.",
    outcomes: ["Keep scope, schedule, cost, and billing together", "Forecast margin before it becomes history", "Match staffing and equipment to funded work"],
    cadence: [
      { label: "Daily", action: "Work delivery exceptions, blockers, field updates, and client commitments." },
      { label: "Weekly", action: "Refresh estimate-to-complete, billing status, capacity, and risk." },
      { label: "Monthly", action: "Certify project accruals, margin forecast, and Finance handoffs." },
    ],
    watchFor: ["Unbilled work older than the agreed threshold", "Estimate-to-complete changes without an explanation", "Project work without the canonical project and customer tags"],
    links: [
      { label: "Trail Solutions", description: "Open delivery, economics, billing, and risk.", view: "trail-solutions" },
      { label: "Project Board", description: "Move portfolio signals into owned project actions.", view: "project-board" },
      { label: "Construction Reports", description: "Review delivery, crew, and closeout controls.", view: "construction-reports" },
      { label: "Capacity", description: "Match executed backlog to available disciplines and crews.", view: "capacity" },
    ],
  },
  "planning-design": {
    summary: "Use IMBA-OS to protect planning and design quality while balancing milestone demand against available discipline capacity.",
    outcomes: ["See milestone load before work becomes late", "Maintain versioned design evidence", "Connect plans and assets to the community record"],
    cadence: [
      { label: "Daily", action: "Resolve review, approval, and design-blocker queues." },
      { label: "Weekly", action: "Review milestone demand, utilization, quality gates, and client dependencies." },
      { label: "Monthly", action: "Reforecast capacity and confirm the evidence package for delivered milestones." },
    ],
    watchFor: ["Milestones without an approver or acceptance condition", "Design capacity over guardrail", "Assets or decisions detached from the project record"],
    links: [
      { label: "Trail Solutions", description: "Review the planning and design delivery portfolio.", view: "trail-solutions" },
      { label: "Project Board", description: "Work milestones, owners, reviews, and dependencies.", view: "project-board" },
      { label: "Trail Assets", description: "Keep plans, GIS, and stewardship evidence attached.", view: "trail-assets" },
      { label: "Capacity", description: "Compare discipline demand with available hours.", view: "capacity" },
    ],
  },
  "local-programs": {
    summary: "Use IMBA-OS to move communities through programs, assessments, designations, and long-term outcomes on one continuous record.",
    outcomes: ["Give every community an owner and next move", "See program delivery and designation readiness", "Turn activity into outcome evidence"],
    cadence: [
      { label: "Daily", action: "Work intake, application, scheduling, and participant exceptions." },
      { label: "Weekly", action: "Review community stage, program delivery, designation gates, and commitments." },
      { label: "Quarterly", action: "Validate outcome measures, evidence quality, and funder reporting readiness." },
    ],
    watchFor: ["Community records with no owner or next action", "Program completion without outcome evidence", "The same organization duplicated across programs or chapters"],
    links: [
      { label: "Community Progress", description: "Move communities from intake through action and stewardship.", view: "community-progress" },
      { label: "Programs + Education", description: "Manage offerings, enrollment, delivery, and completion.", view: "programs-education" },
      { label: "Assessments + Designations", description: "Work applications, evidence, scoring, awards, and renewals.", view: "assessments-designations" },
      { label: "Impact + Research", description: "Connect delivery records to outcomes and approved evidence.", view: "impact-research" },
    ],
  },
  communications: {
    summary: "Use IMBA-OS to turn mission evidence and organizational priorities into governed content, campaigns, press responses, and measurable audience action.",
    outcomes: ["Build from approved evidence", "Keep review and brand controls visible", "Connect communications activity to an intended outcome"],
    cadence: [
      { label: "Daily", action: "Work editorial, press, approval, and stakeholder-response queues." },
      { label: "Weekly", action: "Review campaign progress, source evidence, deadlines, and attribution." },
      { label: "Monthly", action: "Report audience action and campaign outcomes—not impressions alone." },
    ],
    watchFor: ["Claims without an approved source", "Content published without the required reviewer", "Reach metrics presented as mission outcomes"],
    links: [
      { label: "Marketing", description: "Manage the editorial and campaign production portfolio.", view: "development-marketing" },
      { label: "Press Room", description: "Coordinate requests, releases, spokespeople, and approvals.", view: "development-press" },
      { label: "Campaigns", description: "Connect messages, audiences, actions, and outcomes.", view: "development-campaigns" },
      { label: "Templates", description: "Use governed language, owners, and review dates.", view: "communications-templates" },
    ],
  },
  "government-affairs": {
    summary: "Use IMBA-OS to maintain an evidence-backed view of issues, relationships, campaigns, commitments, and policy outcomes.",
    outcomes: ["Connect policy work to communities and mission", "Keep claims and positions evidence-backed", "Retain relationship commitments and next actions"],
    cadence: [
      { label: "Daily", action: "Work issue changes, stakeholder commitments, and response deadlines." },
      { label: "Weekly", action: "Review campaign stage, coalition actions, risks, and evidence gaps." },
      { label: "Monthly", action: "Brief leadership on policy movement, choices, and mission implications." },
    ],
    watchFor: ["A position without approved evidence", "A stakeholder promise living only in email", "Activity counts being confused with policy outcomes"],
    links: [
      { label: "Advocacy + Policy", description: "Work issues, campaigns, relationships, and decisions.", view: "advocacy-policy" },
      { label: "Impact + Research", description: "Use governed evidence and approved findings.", view: "impact-research" },
      { label: "Mission Reports", description: "Connect advocacy work to program and community outcomes.", view: "mission-reports" },
      { label: "Partnerships", description: "Coordinate coalition relationships and commitments.", view: "development-partnerships" },
    ],
  },
  development: {
    summary: "Use IMBA-OS to connect relationships, proposals, gifts, grants, restrictions, cash, stewardship, and mission outcomes.",
    outcomes: ["Keep every relationship moving", "Make restrictions visible before commitment", "Hand awards and gifts cleanly to Finance and programs"],
    cadence: [
      { label: "Daily", action: "Work next actions, proposals, acknowledgments, and stewardship commitments." },
      { label: "Weekly", action: "Review weighted pipeline, campaign progress, grant deadlines, and handoffs." },
      { label: "Monthly", action: "Reconcile commitments, cash received, restrictions, and recognized revenue with Finance." },
    ],
    watchFor: ["Pipeline value presented as booked revenue", "A restriction not attached to the gift or award", "An award without a Finance and program-owner handoff"],
    links: [
      { label: "Development Overview", description: "See pipeline, campaigns, revenue handoffs, and momentum.", view: "development" },
      { label: "CRM Workspace", description: "Move relationships through owned next actions.", view: "development-crm" },
      { label: "Grant Pipeline", description: "Manage applications, awards, restrictions, and reporting.", view: "development-grant-pipeline" },
      { label: "Donations + Pledges", description: "Connect intent, restrictions, cash, and stewardship.", view: "development-donations" },
    ],
  },
  board: {
    summary: "Use IMBA-OS for oversight: performance, strategy, risk, fiduciary evidence, and decisions—not operational transaction processing.",
    outcomes: ["See the same governed numbers as management", "Focus discussion on variances and choices", "Retain approvals, recusals, and follow-through"],
    cadence: [
      { label: "Before meetings", action: "Review the packet, changed signals, unresolved questions, and requested decisions." },
      { label: "During meetings", action: "Record approvals, conditions, recusals, owners, and due dates." },
      { label: "After meetings", action: "Track follow-through and preserve minutes and supporting evidence." },
    ],
    watchFor: ["Current illustrative values presented as audited facts", "Gross cash substituted for unrestricted deployable liquidity", "A board action without an owner, condition, or evidence link"],
    links: [
      { label: "Board Portal", description: "Open governed packets, decisions, and follow-through.", view: "governance-board" },
      { label: "Executive Brief", description: "Review the leadership narrative behind key signals.", view: "brief" },
      { label: "Financial Reports", description: "Review period, status, source, and approved statements.", view: "finance-reports" },
      { label: "Decision Room", description: "Review approvals, delegations, conditions, and evidence.", view: "decisions" },
    ],
  },
};

export type MetricGuide = {
  label: string;
  definition: string;
  calculation: string;
  sources: string[];
  refresh: string;
  status: "Public / filed" | "Synced in production" | "Derived" | "Illustrative";
  relevantSections: string[];
};

export const metricGuides: MetricGuide[] = [
  {
    label: "Public financial history",
    definition: "Historical revenue, expense, net assets, restrictions, and other figures tied to filed reporting.",
    calculation: "Re-derived from the filed Form 990 and reconciled to the public annual-report presentation where available.",
    sources: ["IRS Form 990", "IMBA annual reports"],
    refresh: "Annual, after filing/publication",
    status: "Public / filed",
    relevantSections: ["Money", "Governance", "Management"],
  },
  {
    label: "YTD revenue, expense, and operating result",
    definition: "Current-period accounting performance through the selected close date.",
    calculation: "Posted revenue less posted operating expense, using the approved chart of accounts and reporting mappings.",
    sources: ["QuickBooks Online general ledger", "Approved close adjustments"],
    refresh: "Nightly plus on-demand sync; certified monthly",
    status: "Synced in production",
    relevantSections: ["Money", "Management"],
  },
  {
    label: "Deployable cash",
    definition: "Cash management can use after honoring restrictions and near-term obligations.",
    calculation: "Bank cash minus donor restrictions, amounts due to chapters, designated reserves, and modeled near-term obligations.",
    sources: ["Bank feeds", "QuickBooks Online", "Grant/restriction register", "Obligation schedules"],
    refresh: "Daily; certified at close",
    status: "Derived",
    relevantSections: ["Money", "Management", "Governance"],
  },
  {
    label: "Budget variance",
    definition: "How actual performance differs from the board/management-approved plan.",
    calculation: "Posted actual less approved budget for the same period, entity, function, project, and grant dimensions.",
    sources: ["QuickBooks Online actuals", "Approved budget and revisions"],
    refresh: "After each sync; certified monthly",
    status: "Derived",
    relevantSections: ["Money", "Management", "Governance"],
  },
  {
    label: "Project margin and estimate at completion",
    definition: "Expected project result using work completed, remaining scope, commitments, and loaded labor.",
    calculation: "Contract value plus approved changes minus actual cost, open commitments, and forecast cost to complete.",
    sources: ["Project delivery system", "QuickBooks Online", "ADP/PEO labor", "Vendor commitments"],
    refresh: "Weekly and at material scope change",
    status: "Derived",
    relevantSections: ["Mission", "Money", "People", "Management"],
  },
  {
    label: "Loaded labor rate",
    definition: "The defensible cost of one hour of labor, beyond base wage alone.",
    calculation: "Wages plus employer taxes, benefits, PEO fees, and approved indirect allocation divided by productive hours.",
    sources: ["ADP/PEO payroll", "QuickBooks Online employer costs", "Time records", "Allocation policy"],
    refresh: "Each payroll; formal review quarterly",
    status: "Derived",
    relevantSections: ["People", "Money", "Mission"],
  },
  {
    label: "Capacity and utilization",
    definition: "Available discipline hours compared with scheduled demand from funded or weighted work.",
    calculation: "Scheduled project hours divided by available productive hours, by role, discipline, and scenario.",
    sources: ["Project schedules", "Executed backlog", "Weighted pipeline", "ADP/PEO roster and availability"],
    refresh: "Weekly",
    status: "Derived",
    relevantSections: ["People", "Mission", "Development", "Management"],
  },
  {
    label: "Grant availability",
    definition: "Award value that remains allowable and available for the specified purpose and period.",
    calculation: "Award plus approved amendments minus recognized/spent amounts, commitments, and disallowed or expired use.",
    sources: ["Grant agreements", "CRM/funder record", "QuickBooks Online", "Program commitments"],
    refresh: "Weekly; certified monthly",
    status: "Derived",
    relevantSections: ["Development", "Money", "Mission", "Governance"],
  },
  {
    label: "Development pipeline",
    definition: "Potential funding still in cultivation or proposal—not cash and not recognized revenue.",
    calculation: "Opportunity amount multiplied by governed stage probability; shown separately from committed awards and received cash.",
    sources: ["Donor/grant CRM", "Proposal and award records"],
    refresh: "Daily or on relationship update",
    status: "Synced in production",
    relevantSections: ["Development", "Management"],
  },
  {
    label: "Mission outcomes",
    definition: "Evidence that program, project, designation, or advocacy activity produced the intended change.",
    calculation: "Measure-specific aggregation using approved definitions, denominators, geography, period, and evidence rules.",
    sources: ["Program and project records", "Assessments", "GIS/trail assets", "Approved research and surveys"],
    refresh: "Program cadence; formal quarterly review",
    status: "Synced in production",
    relevantSections: ["Mission", "Development", "Management", "Governance"],
  },
  {
    label: "System health",
    definition: "Whether connectors, mappings, access controls, and data-quality rules are operating inside their guardrails.",
    calculation: "Connector status, sync latency, failed records, mapping exceptions, and access-review results against thresholds.",
    sources: ["IMBA-OS integration log", "Source-system APIs", "Identity and access records"],
    refresh: "Continuous or each sync",
    status: "Derived",
    relevantSections: ["Platform", "System", "Management"],
  },
];

export const dataStatusGuide = [
  { label: "Public / filed", detail: "Traceable to an external public filing or published report." },
  { label: "Synced in production", detail: "Would come from a connected system of record; current prototype values remain illustrative unless explicitly labeled public/filed." },
  { label: "Derived", detail: "Calculated by IMBA-OS from governed source fields and a visible formula." },
  { label: "Illustrative", detail: "Demonstrates the workflow or interface; it is not a current IMBA operating fact." },
] as const;

