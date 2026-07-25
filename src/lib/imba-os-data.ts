export type ImbaOsSectionId =
  | "operations"
  | "money"
  | "people"
  | "development"
  | "platform"
  | "governance"
  | "communications"
  | "system";

export type ImbaOsView =
  | "brief"
  | "portfolio"
  | "liquidity"
  | "capacity"
  | "project-command"
  | "project-board"
  | "construction-reports"
  | "mission-reports"
  | "community-progress"
  | "trail-solutions"
  | "programs-education"
  | "assessments-designations"
  | "advocacy-policy"
  | "trail-assets"
  | "impact-research"
  | "chapter-network"
  | "chapter-standards"
  | "data-exchange"
  | "finance-snapshot"
  | "finance-banking"
  | "finance-calendar"
  | "finance-coa"
  | "finance-budget"
  | "finance-grants"
  | "finance-payables"
  | "finance-ap-ar"
  | "finance-reports"
  | "finance-transactions"
  | "finance-expenses"
  | "finance-cost-of-labor"
  | "finance-vendors"
  | "finance-customers"
  | "finance-grantors"
  | "reconciliation"
  | "campaign"
  | "data-quality"
  | "people-directory"
  | "people-reports"
  | "people-payroll"
  | "people-hiring"
  | "people-onboarding"
  | "people-compliance"
  | "people-documents"
  | "people-volunteers"
  | "people-training"
  | "people-role-studio"
  | "development-reports"
  | "development-crm"
  | "development-grant-pipeline"
  | "development-campaigns"
  | "development-trail-solutions"
  | "development-marketing"
  | "development-partnerships"
  | "development-grant-research"
  | "development-donations"
  | "development-press"
  | "crm-migration-health"
  | "crm-field-crosswalk"
  | "crm-exception-queue"
  | "crm-financial-reconciliation"
  | "crm-integration-readiness"
  | "governance-board"
  | "governance-compliance"
  | "governance-vault"
  | "collaboration"
  | "collaboration-inbox"
  | "collaboration-workspaces"
  | "collaboration-knowledge"
  | "collaboration-meetings"
  | "collaboration-connectors"
  | "communications-inbox"
  | "communications-templates"
  | "platform-systems"
  | "platform-health"
  | "platform-federated-data"
  | "integration-control"
  | "integration-qbo"
  | "integration-adp"
  | "integration-mappings"
  | "integration-sync"
  | "integration-audit"
  | "system-runbooks"
  | "system-activity"
  | "decisions"
  | "whatif"
  | "roadmap"
  | ImbaOsSectionId;

export interface ImbaOsModule {
  name: string;
  purpose: string;
  source: string;
  stage: "Demonstrated" | "Designed" | "Discovery";
}

export interface ImbaOsSection {
  id: ImbaOsSectionId;
  label: string;
  subtitle: string;
  accent: string;
  border: string;
  icon:
    | "route"
    | "money"
    | "people"
    | "development"
    | "platform"
    | "governance"
    | "communications"
    | "system";
  thesis: string;
  outcomes: Array<{ label: string; value: string; note: string }>;
  modules: ImbaOsModule[];
  priorities: string[];
}

export const imbaOsSections: ImbaOsSection[] = [
  {
    id: "operations",
    label: "Mission",
    subtitle: "Community progress + mission delivery",
    accent: "bg-blue-400/10 text-blue-700 dark:text-blue-200",
    border: "border-blue-400/25",
    icon: "route",
    thesis:
      "Connect every community, relationship, program, project, designation, advocacy action, trail asset, and outcome in one mission operating picture.",
    outcomes: [
      {
        label: "Communities engaged",
        value: "742",
        note: "2025 public baseline",
      },
      { label: "Planning projects", value: "53", note: "Across 27 states" },
      { label: "Construction projects", value: "11", note: "Across 10 states" },
    ],
    modules: [
      {
        name: "Community Progress Shop",
        purpose:
          "A single community record from intake through action, trail completion, designation, and long-term stewardship.",
        source: "CRM + assessments + project and program systems",
        stage: "Designed",
      },
      {
        name: "Trail Solutions portfolio",
        purpose:
          "Project health, delivery milestones, estimate to complete, and client billing.",
        source: "Monday.com + QuickBooks",
        stage: "Demonstrated",
      },
      {
        name: "Local organization network",
        purpose:
          "Member-organization relationships, obligations, service requests, and financial guidance.",
        source: "CRM + membership platform",
        stage: "Designed",
      },
      {
        name: "Programs, education, and designations",
        purpose:
          "Offerings, applications, scheduling, delivery, completion, scoring, awards, and renewals.",
        source: "CRM + learning + event and designation records",
        stage: "Designed",
      },
      {
        name: "Advocacy, assets, and impact",
        purpose:
          "Policy campaigns, land-access relationships, trail assets, stewardship obligations, measurement, and community outcomes.",
        source: "Advocacy + GIS + program and research records",
        stage: "Designed",
      },
    ],
    priorities: [
      "Make the community record the spine of mission delivery.",
      "Name an owner, stage, next move, and relationship map for every community.",
      "Link services, advocacy, assets, outcomes, billing, and funding to the same record.",
    ],
  },
  {
    id: "money",
    label: "Money",
    subtitle: "Airtight books + foresight",
    accent: "bg-emerald-400/10 text-emerald-700 dark:text-emerald-200",
    border: "border-emerald-400/25",
    icon: "money",
    thesis:
      "A dependable close is the foundation; project economics, portfolio visibility, and liquidity sit above it.",
    outcomes: [
      { label: "2024 revenue", value: "$7.20M", note: "Filed Form 990" },
      { label: "Program-service mix", value: "56.5%", note: "2024 revenue" },
      {
        label: "Trail swing",
        value: "$870K",
        note: "2023 to 2024 illustration",
      },
    ],
    modules: [
      {
        name: "Monthly close command center",
        purpose:
          "Checklist, owners, evidence, reconciliations, accruals, and exceptions.",
        source: "QuickBooks + bank + ADP",
        stage: "Designed",
      },
      {
        name: "Project-lifetime job costing",
        purpose:
          "Loaded labour rates from the filed return, shared-resource allocation between engagements, budget, and estimate to complete. Subcontractor commitments and indirect recovery are designed, not yet demonstrated.",
        source: "QuickBooks + ADP time coding + Monday.com",
        stage: "Demonstrated",
      },
      {
        name: "Liquidity and cash forecast",
        purpose:
          "Deployable cash, restrictions, obligations, and rolling 13-week forecast.",
        source: "Ledger + project schedules",
        stage: "Demonstrated",
      },
      {
        name: "Funder and grant matrix",
        purpose:
          "Restrictions, draws, deadlines, reporting, and spend-down management.",
        source: "Grant contracts + ledger",
        stage: "Designed",
      },
    ],
    priorities: [
      "Baseline and document the close.",
      "Establish loaded labor rates.",
      "Separate gross cash from deployable cash.",
    ],
  },
  {
    id: "people",
    label: "People",
    subtitle: "Capacity against pipeline",
    accent: "bg-cyan-400/10 text-cyan-700 dark:text-cyan-200",
    border: "border-cyan-400/25",
    icon: "people",
    thesis:
      "Translate contracted work into staffing decisions without hiring ahead of evidence or burning out the team.",
    outcomes: [
      {
        label: "Workforce model",
        value: "PEO",
        note: "Payroll and allocation layer",
      },
      {
        label: "Delivery disciplines",
        value: "4",
        note: "Planning through PM",
      },
      { label: "Hiring basis", value: "Backlog", note: "Not hoped-for work" },
    ],
    modules: [
      {
        name: "Capacity planner",
        purpose:
          "Utilization by discipline under contracted, weighted, and expansion cases.",
        source: "ADP + time + pipeline",
        stage: "Demonstrated",
      },
      {
        name: "Loaded labor model",
        purpose:
          "Wages, benefits, payroll taxes, PEO cost, and allocated overhead by role.",
        source: "ADP + general ledger",
        stage: "Designed",
      },
      {
        name: "Workforce lifecycle",
        purpose:
          "Core staff, seasonal crews, contractors, hiring gates, and onboarding.",
        source: "PEO + HR records",
        stage: "Designed",
      },
      {
        name: "Knowledge continuity",
        purpose:
          "Documented ownership, process coverage, and successor-ready operating procedures.",
        source: "Runbooks",
        stage: "Discovery",
      },
    ],
    priorities: [
      "Reconcile time capture to payroll.",
      "Set utilization guardrails by discipline.",
      "Tie permanent hiring to executed backlog.",
    ],
  },
  {
    id: "development",
    label: "Development",
    subtitle: "Philanthropy + membership",
    accent: "bg-amber-300/10 text-amber-700 dark:text-amber-100",
    border: "border-amber-300/25",
    icon: "development",
    thesis:
      "Give the steadier philanthropic engine the same pipeline, restriction, and outcome visibility as Trail Solutions.",
    outcomes: [
      {
        label: "Contribution band",
        value: "$2.3–4.2M",
        note: "2018–2024 filings",
      },
      {
        label: "Membership growth",
        value: "+23%",
        note: "2025 public baseline",
      },
      { label: "Revenue engines", value: "2", note: "Philanthropy + services" },
    ],
    modules: [
      {
        name: "Campaign command center",
        purpose:
          "Leading with Trails progress, commitments, probability, and use of funds.",
        source: "CRM + finance",
        stage: "Designed",
      },
      {
        name: "Grant pipeline",
        purpose:
          "Prospects, applications, awards, restrictions, draws, and reporting.",
        source: "CRM + funder matrix",
        stage: "Designed",
      },
      {
        name: "Membership economics",
        purpose:
          "Acquisition, renewal, chapter sharing, and unrestricted contribution trends.",
        source: "Membership platform",
        stage: "Discovery",
      },
      {
        name: "Donor stewardship",
        purpose:
          "Gift restrictions, acknowledgments, outcomes, and relationship next actions.",
        source: "CRM + payment processors",
        stage: "Discovery",
      },
    ],
    priorities: [
      "Unify campaign and finance definitions.",
      "Make restricted use visible at commitment.",
      "Connect membership growth to cash and chapter obligations.",
    ],
  },
  {
    id: "platform",
    label: "Platform",
    subtitle: "Technology leverage",
    accent: "bg-violet-400/10 text-violet-700 dark:text-violet-200",
    border: "border-violet-400/25",
    icon: "platform",
    thesis:
      "Create a governed data layer across existing tools before considering wholesale platform replacement.",
    outcomes: [
      {
        label: "Core systems",
        value: "6+",
        note: "Finance to project delivery",
      },
      { label: "Approach", value: "Integrate", note: "Preserve what works" },
      {
        label: "Primary control",
        value: "Data tags",
        note: "Project + funder + entity",
      },
    ],
    modules: [
      {
        name: "Integration map",
        purpose:
          "QuickBooks, Monday.com, ADP, Expensify, CRM, banking, and payment flows.",
        source: "System inventory",
        stage: "Designed",
      },
      {
        name: "Finance data contract",
        purpose:
          "Canonical project, funder, entity, phase, and account dimensions.",
        source: "Cross-system governance",
        stage: "Designed",
      },
      {
        name: "Automation queue",
        purpose:
          "Remove duplicate entry, flag failed syncs, and retain human approval.",
        source: "Integration layer",
        stage: "Discovery",
      },
      {
        name: "Technology investment scorecard",
        purpose:
          "Milestones for the 2025–2026 upgrade: continue, accelerate, or adjust.",
        source: "Roadmap + financial plan",
        stage: "Designed",
      },
    ],
    priorities: [
      "Inventory systems and owners.",
      "Define canonical finance dimensions.",
      "Measure technology investments against operating outcomes.",
    ],
  },
  {
    id: "governance",
    label: "Governance",
    subtitle: "Board + audit readiness",
    accent: "bg-rose-400/10 text-rose-700 dark:text-rose-200",
    border: "border-rose-400/25",
    icon: "governance",
    thesis:
      "Turn audit, board, restriction, and policy evidence into a standing operating rhythm instead of a year-end scramble.",
    outcomes: [
      { label: "Audit basis", value: "Annual", note: "Independent accountant" },
      {
        label: "Donor restricted",
        value: "$584K",
        note: "FY2024 public baseline",
      },
      {
        label: "Due to chapters",
        value: "$318K",
        note: "FY2024 public baseline",
      },
    ],
    modules: [
      {
        name: "Board finance room",
        purpose:
          "One-page executive brief, decision log, packets, and trend evidence.",
        source: "Finance + governance records",
        stage: "Designed",
      },
      {
        name: "Audit readiness",
        purpose:
          "PBC calendar, evidence, management-letter items, and ownership.",
        source: "Audit files + ledger",
        stage: "Designed",
      },
      {
        name: "Restriction and conflict controls",
        purpose:
          "Gift restrictions, chapter obligations, conflicts, and approvals.",
        source: "Contracts + disclosures",
        stage: "Discovery",
      },
      {
        name: "Policy library",
        purpose:
          "Current policies, approval thresholds, review dates, and attestations.",
        source: "Governance vault",
        stage: "Discovery",
      },
    ],
    priorities: [
      "Review the two latest management letters.",
      "Create the audit-preparation calendar.",
      "Standardize board reporting and decision evidence.",
    ],
  },
  {
    id: "communications",
    label: "Collaboration",
    subtitle: "Context + institutional memory",
    accent: "bg-indigo-400/10 text-indigo-700 dark:text-indigo-200",
    border: "border-indigo-400/25",
    icon: "communications",
    thesis:
      "Keep discussion, knowledge, decisions, assignments, and stakeholder commitments attached to the operating records they affect.",
    outcomes: [
      {
        label: "Contextual rooms",
        value: "Role-based",
        note: "Project + grant + chapter",
      },
      { label: "Knowledge", value: "Versioned", note: "Owners + standards" },
      {
        label: "Follow-through",
        value: "Owned",
        note: "Decision + assignment path",
      },
    ],
    modules: [
      {
        name: "Executive brief distribution",
        purpose: "Controlled delivery of the monthly “what changed” page.",
        source: "Board + leadership list",
        stage: "Designed",
      },
      {
        name: "Client commitment tracker",
        purpose:
          "Contract milestones, billing notices, change orders, and acceptance.",
        source: "Project system + email",
        stage: "Discovery",
      },
      {
        name: "Funder calendar",
        purpose: "Reports, draws, acknowledgments, and outcome updates.",
        source: "Funder matrix",
        stage: "Designed",
      },
      {
        name: "Chapter communications",
        purpose:
          "Statements, obligations, service requests, and issue resolution.",
        source: "CRM + finance",
        stage: "Discovery",
      },
    ],
    priorities: [
      "Identify official conversation and knowledge systems.",
      "Define role-based access and canonical record ownership.",
      "Pilot contextual workspaces on representative projects, grants, and chapters.",
    ],
  },
  {
    id: "system",
    label: "System",
    subtitle: "Controls + continuity",
    accent: "bg-slate-400/10 text-slate-700 dark:text-slate-200",
    border: "border-slate-400/25",
    icon: "system",
    thesis:
      "Make the operating system observable, permissioned, documented, and resilient as IMBA grows.",
    outcomes: [
      {
        label: "Data standard",
        value: "Canonical",
        note: "Definitions before dashboards",
      },
      {
        label: "Decision trail",
        value: "Append-only",
        note: "Rationale + evidence",
      },
      {
        label: "Continuity",
        value: "Documented",
        note: "Institution owns knowledge",
      },
    ],
    modules: [
      {
        name: "Identity and access",
        purpose:
          "Role-based access for CEO, Finance, program leads, project managers, and board.",
        source: "Identity provider",
        stage: "Discovery",
      },
      {
        name: "Data quality monitor",
        purpose:
          "Missing project tags, stale estimates, unreconciled balances, and failed imports.",
        source: "Control rules",
        stage: "Designed",
      },
      {
        name: "Decision and audit log",
        purpose:
          "Who decided what, why, with which evidence, and under which scenario.",
        source: "IMBA-OS event log",
        stage: "Demonstrated",
      },
      {
        name: "Runbooks and continuity",
        purpose:
          "Close, billing, grants, audit, incident, and knowledge-transfer procedures.",
        source: "Operating manuals",
        stage: "Designed",
      },
    ],
    priorities: [
      "Define roles before integrations go live.",
      "Monitor the few data defects that change decisions.",
      "Keep institutional knowledge outside individual inboxes.",
    ],
  },
];

export const imbaNextTwelveMonthRoadmap = [
  {
    milestone: "Day 1",
    title: "Listen first. Build second.",
    deliverables: [
      "Working sessions with Kent, Heather, and the fractional contractor",
      "Access and systems inventory",
      "Preserve working processes while learning why they exist",
    ],
  },
  {
    milestone: "Day 30",
    title: "Assessment + close control",
    deliverables: [
      "Written current-state assessment",
      "Close checklist v1",
      "Funder and grant matrix",
      "Knowledge-transfer plan",
    ],
  },
  {
    milestone: "Day 60",
    title: "The close is mine. Kent gets his page.",
    deliverables: [
      "First full close on documented process",
      "CEO dashboard v1",
      "Loaded labor-rate model",
      "Project and funder tagging design",
    ],
  },
  {
    milestone: "Day 90",
    title: "Job costing live",
    deliverables: [
      "Budget-to-actual and estimate to complete on active projects",
      "Defensible indirect-cost methodology",
      "Project-margin dashboard v2",
      "Audit calendar",
    ],
  },
  {
    milestone: "Day 180",
    title: "From accounting to foresight",
    deliverables: [
      "Backlog, weighted pipeline, and capacity reporting",
      "13-week cash and deployable liquidity",
      "First live WHAT_IF scenario",
      "Optional systems guidance for member organizations",
    ],
  },
  {
    milestone: "Month 12",
    title: "Built to scale toward $10M",
    deliverables: [
      "Pipeline-driven annual budget",
      "Finance-led independent audit preparation",
      "Technology investment milestones",
      "Standard board package and documented function",
    ],
  },
];
