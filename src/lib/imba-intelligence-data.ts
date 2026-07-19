import type { ImbaOsView } from "@/lib/imba-os-data";

export type ImbaRoleKey =
  | "executive"
  | "finance"
  | "hr"
  | "trail-solutions"
  | "planning-design"
  | "local-programs"
  | "communications"
  | "government-affairs"
  | "development"
  | "board";

export interface ImbaRoleProfile {
  label: string;
  initials: string;
  purpose: string;
  sections: string[];
  sectionViews?: Partial<Record<string, ImbaOsView[]>>;
  home: ImbaOsView;
}

export interface ImbaFilterState {
  region: string;
  phase: string;
  status: string;
  project: string;
}

export interface ImbaSavedView {
  id: string;
  name: string;
  role: ImbaRoleKey;
  view: ImbaOsView;
  scenario: "base" | "conservative" | "expansion";
  filters: ImbaFilterState;
  savedAt: string;
}

export interface ImbaAlertRule {
  id: string;
  metric: string;
  condition: string;
  threshold: string;
  owner: string;
  cadence: string;
  enabled: boolean;
  state: "normal" | "watch" | "triggered";
}

export interface ImbaSubscription {
  id: string;
  name: string;
  audience: string;
  cadence: string;
  enabled: boolean;
}

export interface ImbaMetricExplanation {
  definition: string;
  formula: string;
  sources: string[];
  freshness: string;
  drivers: Array<{
    label: string;
    effect: string;
    tone: "positive" | "negative" | "neutral";
  }>;
  anomaly: string;
  action: string;
  supportingView: ImbaOsView;
}

export const imbaRoleProfiles: Record<ImbaRoleKey, ImbaRoleProfile> = {
  executive: {
    label: "CEO / Executive Director",
    initials: "CE",
    purpose: "Enterprise performance, risk, and decisions",
    home: "brief",
    sections: [
      "Mission",
      "Money",
      "People",
      "Development",
      "Platform",
      "System",
      "Governance",
      "Collaboration",
      "Management",
    ],
    sectionViews: {
      Mission: ["operations", "trail-solutions", "construction-reports", "mission-reports", "impact-research"],
      Money: [
        "finance-snapshot",
        "finance-grants",
        "finance-budget",
        "finance-cost-of-labor",
        "finance-reports",
        "finance-payables",
        "finance-ap-ar",
        "finance-vendors",
        "finance-customers",
        "finance-grantors",
        "finance-expenses",
        "liquidity",
      ],
      People: ["people", "people-directory", "people-reports", "capacity"],
      Development: ["development", "development-reports", "development-campaigns", "finance-grantors"],
      Platform: ["platform", "platform-health"],
      Governance: ["governance", "governance-board"],
      Collaboration: ["collaboration", "collaboration-inbox"],
      System: ["system", "system-activity"],
    },
  },
  finance: {
    label: "Director of Finance",
    initials: "FD",
    purpose: "Close, liquidity, compliance, and decision support",
    home: "finance-snapshot",
    sections: [
      "Mission",
      "Money",
      "People",
      "Development",
      "Platform",
      "Governance",
      "Management",
    ],
    sectionViews: {
      Mission: ["operations", "trail-solutions", "project-board"],
      People: ["people-directory", "people-payroll", "people-compliance"],
      Development: ["development-grant-pipeline", "finance-grantors"],
      Platform: [
        "integration-control",
        "integration-qbo",
        "integration-adp",
        "integration-mappings",
        "integration-sync",
        "integration-audit",
      ],
      Governance: ["governance-compliance", "governance-board"],
      Management: ["brief", "roadmap"],
    },
  },
  hr: {
    label: "Director of Talent & Culture / HR",
    initials: "HR",
    purpose: "Workforce, payroll, hiring, onboarding, and compliance",
    home: "people-directory",
    sections: [
      "People",
      "Money",
      "Platform",
      "Governance",
      "Collaboration",
      "Management",
    ],
    sectionViews: {
      Money: ["finance-snapshot", "finance-calendar", "finance-budget", "finance-cost-of-labor"],
      Platform: ["integration-control", "integration-adp", "integration-audit"],
      Governance: ["governance-compliance", "governance-vault"],
      Collaboration: ["collaboration", "collaboration-inbox", "communications-templates"],
      Management: ["brief", "roadmap"],
    },
  },
  "trail-solutions": {
    label: "Director of Construction & Operations",
    initials: "DC",
    purpose: "Project delivery, margin, pipeline, and capacity",
    home: "trail-solutions",
    sections: [
      "Mission",
      "Money",
      "People",
      "Platform",
      "Collaboration",
    ],
    sectionViews: {
      Mission: [
        "operations",
        "trail-solutions",
        "project-board",
        "construction-reports",
        "chapter-network",
        "chapter-standards",
        "trail-assets",
      ],
      Money: [
        "finance-snapshot",
        "finance-budget",
        "finance-reports",
        "finance-payables",
        "finance-ap-ar",
        "finance-vendors",
        "finance-customers",
        "finance-grantors",
        "finance-expenses",
      ],
      People: ["people", "capacity", "people-directory"],
      Platform: ["platform"],
      Collaboration: ["collaboration", "collaboration-inbox", "collaboration-workspaces"],
    },
  },
  "planning-design": {
    label: "Director of Planning & Design",
    initials: "PD",
    purpose: "Planning quality, design delivery, assets, and capacity",
    home: "trail-solutions",
    sections: ["Mission", "People", "Platform"],
    sectionViews: {
      Mission: ["operations", "trail-solutions", "project-board", "mission-reports", "trail-assets"],
      People: ["people", "capacity", "people-directory"],
      Platform: ["platform"],
    },
  },
  "local-programs": {
    label: "Director of Local Programs",
    initials: "LP",
    purpose: "Community progress, programs, designations, and impact",
    home: "community-progress",
    sections: ["Mission", "People", "Development"],
    sectionViews: {
      Mission: ["operations", "community-progress", "programs-education", "assessments-designations", "mission-reports", "chapter-network", "chapter-standards", "trail-assets", "impact-research"],
      People: ["people", "capacity", "people-directory"],
      Development: ["development-campaigns", "development-partnerships"],
    },
  },
  communications: {
    label: "Director of Communications",
    initials: "CM",
    purpose: "Audience, content, campaigns, attribution, and brand controls",
    home: "development-marketing",
    sections: ["Development", "Mission"],
    sectionViews: {
      Development: ["development-reports", "development-campaigns", "development-marketing", "development-partnerships"],
      Mission: ["operations", "impact-research"],
    },
  },
  "government-affairs": {
    label: "Director of Government Affairs",
    initials: "GA",
    purpose: "Advocacy issues, campaigns, decisions, and evidence",
    home: "advocacy-policy",
    sections: ["Mission", "Development"],
    sectionViews: {
      Mission: ["operations", "advocacy-policy", "mission-reports", "impact-research"],
      Development: ["development-marketing", "development-partnerships"],
    },
  },
  development: {
    label: "Development",
    initials: "DV",
    purpose: "Membership, philanthropy, grants, and commitments",
    home: "development",
    sections: [
      "Development",
      "Money",
      "Collaboration",
    ],
    sectionViews: {
      Money: [
        "finance-snapshot",
        "finance-grants",
        "finance-budget",
        "finance-reports",
      ],
      Collaboration: [
        "collaboration",
        "collaboration-inbox",
        "collaboration-workspaces",
        "communications-inbox",
        "communications-templates",
      ],
    },
  },
  board: {
    label: "Board",
    initials: "BD",
    purpose: "Oversight, strategy, risk, and fiduciary evidence",
    home: "governance-board",
    sections: ["Money", "Governance", "Management"],
    sectionViews: {
      Money: [
        "finance-snapshot",
        "finance-budget",
        "finance-reports",
        "liquidity",
      ],
      Governance: ["governance", "governance-board", "governance-compliance"],
      Management: ["brief", "decisions", "roadmap"],
    },
  },
};

export const initialImbaFilters: ImbaFilterState = {
  region: "All regions",
  phase: "All phases",
  status: "All signals",
  project: "All projects",
};

export const initialImbaAlerts: ImbaAlertRule[] = [
  {
    id: "cash-floor",
    metric: "Deployable cash",
    condition: "falls below",
    threshold: "$1.50M",
    owner: "Finance + Kent",
    cadence: "Every refresh",
    enabled: true,
    state: "normal",
  },
  {
    id: "project-eac",
    metric: "Project EAC",
    condition: "rises by more than",
    threshold: "5%",
    owner: "Project lead + Finance",
    cadence: "Daily",
    enabled: true,
    state: "triggered",
  },
  {
    id: "receivables",
    metric: "Receivables >45d",
    condition: "exceed",
    threshold: "$250K",
    owner: "Finance",
    cadence: "Daily",
    enabled: true,
    state: "watch",
  },
  {
    id: "capacity",
    metric: "Delivery utilization",
    condition: "exceeds",
    threshold: "95%",
    owner: "Trail Solutions + People",
    cadence: "Weekly",
    enabled: true,
    state: "watch",
  },
  {
    id: "chapter-compliance",
    metric: "Chapter submissions",
    condition: "remain overdue for",
    threshold: "10 days",
    owner: "Chapter network",
    cadence: "Weekly",
    enabled: false,
    state: "normal",
  },
];

export const initialImbaSubscriptions: ImbaSubscription[] = [
  {
    id: "kent-weekly",
    name: "Kent's Monday cockpit",
    audience: "CEO",
    cadence: "Monday · 7:00 AM",
    enabled: true,
  },
  {
    id: "finance-daily",
    name: "Finance exception digest",
    audience: "Finance",
    cadence: "Weekdays · 8:00 AM",
    enabled: true,
  },
  {
    id: "board-monthly",
    name: "Board finance snapshot",
    audience: "Board Finance Committee",
    cadence: "Monthly close + 2 days",
    enabled: false,
  },
];

export const imbaMetricExplanations: Record<string, ImbaMetricExplanation> = {
  "Deployable cash": {
    definition:
      "Cash that management can responsibly deploy after known restrictions, obligations, and contracted-work commitments.",
    formula:
      "Gross cash − donor restrictions − chapter obligations − deferred project revenue − completion reserve",
    sources: [
      "QuickBooks Online · bank and liability balances",
      "Grant restriction register",
      "Chapter settlement ledger",
      "Project estimate-to-complete",
    ],
    freshness:
      "Illustrative snapshot · connector design supports daily or on-demand refresh",
    drivers: [
      {
        label: "Progress billing reset",
        effect: "+$210K timing",
        tone: "positive",
      },
      {
        label: "Equipment release gate",
        effect: "−$185K exposure",
        tone: "negative",
      },
      {
        label: "Restricted and chapter balances",
        effect: "−$902K constrained",
        tone: "neutral",
      },
    ],
    anomaly:
      "The current amount remains above the modeled floor, but the conservative scenario approaches it after delayed collections.",
    action:
      "Keep the equipment purchase staged and accelerate the three progress-billing changes before releasing the second tranche.",
    supportingView: "liquidity",
  },
  "13-week runway": {
    definition:
      "A weekly liquidity forecast designed to reveal the lowest cash point before it appears in month-end statements.",
    formula:
      "Opening cash + expected weekly receipts − scheduled and forecast weekly payments",
    sources: [
      "QuickBooks Online · cash, AP, and AR",
      "Project billing milestones",
      "Payroll calendar",
      "Grant and chapter settlement schedules",
    ],
    freshness:
      "Illustrative weekly model · intended refresh after each material cash event",
    drivers: [
      {
        label: "Client collection timing",
        effect: "Primary downside",
        tone: "negative",
      },
      {
        label: "Monthly progress billing",
        effect: "+$210K in 45 days",
        tone: "positive",
      },
      {
        label: "Payroll and equipment timing",
        effect: "Known trough drivers",
        tone: "neutral",
      },
    ],
    anomaly:
      "Two delayed starts and a 30-day collection extension reduce modeled runway from 6.8 to 5.5 months.",
    action:
      "Review the 13-week forecast weekly and assign an owner to every receipt or payment driving the projected low point.",
    supportingView: "liquidity",
  },
  "Contracted backlog": {
    definition:
      "Signed project value that has not yet been recognized as revenue.",
    formula: "Signed contract value − revenue recognized to date",
    sources: [
      "Contract registry",
      "QuickBooks Online · customer/project revenue",
      "Project delivery records",
    ],
    freshness:
      "Illustrative operating model · intended daily contract and billing synchronization",
    drivers: [
      {
        label: "Signed active portfolio",
        effect: "$4.82M base",
        tone: "positive",
      },
      {
        label: "Potential delayed starts",
        effect: "−$560K timing",
        tone: "negative",
      },
      {
        label: "Expansion conversion",
        effect: "+$910K modeled",
        tone: "positive",
      },
    ],
    anomaly:
      "Backlog coverage is healthy in the base scenario, but design capacity becomes the limiting factor before total demand does.",
    action:
      "Separate signed backlog from weighted pipeline and trigger permanent hiring only when the discipline-specific backlog gate is met.",
    supportingView: "portfolio",
  },
  "Forecast result": {
    definition:
      "The latest expected full-year operating result after actual activity and current assumptions replace the original budget.",
    formula:
      "Actual year-to-date result + forecast remaining revenue − forecast remaining expense",
    sources: [
      "QuickBooks Online · actuals",
      "Project EAC",
      "Development forecast",
      "Payroll and capacity plan",
    ],
    freshness:
      "Illustrative scenario model · intended monthly reforecast plus material-event updates",
    drivers: [
      {
        label: "Planned investment year",
        effect: "Baseline deficit",
        tone: "neutral",
      },
      {
        label: "Project contribution",
        effect: "Largest variable driver",
        tone: "positive",
      },
      {
        label: "Collection timing",
        effect: "Cash impact, not revenue",
        tone: "neutral",
      },
    ],
    anomaly:
      "The expansion case improves the operating result but requires staged capacity and stronger pipeline conversion evidence.",
    action:
      "Present base, downside, and expansion cases with explicit milestones for accelerating, adjusting, or pausing investment.",
    supportingView: "finance-budget",
  },
  "Weighted pipeline": {
    definition:
      "Unsigned opportunities discounted by their probability of conversion for capacity and cash planning.",
    formula: "Sum of opportunity value × approved stage probability",
    sources: [
      "CRM opportunity pipeline",
      "Trail Solutions estimating",
      "Historical conversion assumptions",
    ],
    freshness: "Illustrative pipeline · intended weekly owner certification",
    drivers: [
      {
        label: "Late-stage opportunities",
        effect: "46% of weighted value",
        tone: "positive",
      },
      {
        label: "Mid-stage opportunities",
        effect: "36% of weighted value",
        tone: "neutral",
      },
      {
        label: "Early opportunities",
        effect: "Excluded from hiring gates",
        tone: "neutral",
      },
    ],
    anomaly:
      "The pipeline supports a contract bench, but it does not yet support all permanent expansion hiring.",
    action:
      "Require opportunity owner, probability, expected start, staffing discipline, and next evidence date before including an opportunity.",
    supportingView: "portfolio",
  },
  "Portfolio contribution": {
    definition:
      "The forecast amount remaining after the fully loaded delivery cost of the selected project portfolio.",
    formula: "(Contract value − forecast fully loaded cost) ÷ contract value",
    sources: [
      "QuickBooks Online · project actuals",
      "ADP · certified labor allocation",
      "Committed subcontractors and equipment",
      "Project EAC",
    ],
    freshness:
      "Illustrative project model · intended daily actuals and weekly EAC certification",
    drivers: [
      { label: "Blue Ridge planning", effect: "+19.7%", tone: "positive" },
      { label: "Great Lakes buildout", effect: "+8.5%", tone: "negative" },
      {
        label: "Shared design hours",
        effect: "9% above plan",
        tone: "negative",
      },
    ],
    anomaly:
      "Great Lakes is below the modeled 12% floor and High Desert shared design hours are above plan.",
    action:
      "Review labor allocation, equipment commitments, and remaining scope before treating the portfolio contribution as available overhead recovery.",
    supportingView: "project-command",
  },
  "At-risk value": {
    definition:
      "Value attached to projects currently outside an approved cost, schedule, billing, or capacity guardrail.",
    formula: "Contract value of projects with an at-risk signal",
    sources: [
      "Project status certification",
      "Project EAC",
      "Billing and schedule controls",
    ],
    freshness:
      "Illustrative project model · intended weekly project-owner certification",
    drivers: [
      {
        label: "Great Lakes Buildout",
        effect: "$1.24M flagged",
        tone: "negative",
      },
      {
        label: "Equipment and closeout reserve",
        effect: "Decision pending",
        tone: "negative",
      },
    ],
    anomaly:
      "One engagement represents the full currently modeled at-risk contract value.",
    action:
      "Open the project record, validate remaining cost and client obligations, and assign the recovery decision before the next billing milestone.",
    supportingView: "project-command",
  },
  "Gross cash": {
    definition:
      "Total cash in bank accounts before determining whether each dollar is available for general use.",
    formula: "Sum of reconciled bank balances",
    sources: ["QuickBooks Online · reconciled bank accounts"],
    freshness:
      "Illustrative balance · intended daily bank-feed and reconciliation status",
    drivers: [
      {
        label: "Bank balances",
        effect: "$3.22M starting point",
        tone: "neutral",
      },
      {
        label: "Known constraints",
        effect: "46% not freely deployable",
        tone: "negative",
      },
    ],
    anomaly: "Gross cash materially overstates modeled deployable liquidity.",
    action:
      "Never use gross cash alone for an investment or hiring decision; reconcile it to deployable cash first.",
    supportingView: "liquidity",
  },
  "Known constraints": {
    definition:
      "Cash-related restrictions and obligations that reduce what management can presently deploy.",
    formula:
      "Donor restrictions + due to chapters + deferred project revenue + completion reserve",
    sources: [
      "QuickBooks Online",
      "Grant restriction register",
      "Chapter settlement ledger",
      "Project EAC",
    ],
    freshness:
      "Illustrative control schedule · intended close-cycle certification",
    drivers: [
      { label: "Donor restrictions", effect: "$584K", tone: "neutral" },
      { label: "Due to chapters", effect: "$318K", tone: "neutral" },
      { label: "Project commitments", effect: "$578K", tone: "neutral" },
    ],
    anomaly:
      "Constraint classifications require consistent project, chapter, and grant dimensions across systems.",
    action:
      "Certify every constraint owner and release condition as part of the monthly close.",
    supportingView: "liquidity",
  },
  "Receivables >45d": {
    definition:
      "Customer invoices outstanding more than 45 days and receiving elevated collection attention.",
    formula: "Open invoice balance where invoice age > 45 days",
    sources: [
      "QuickBooks Online · accounts receivable",
      "Project acceptance and billing milestones",
    ],
    freshness: "Illustrative aging · intended daily refresh",
    drivers: [
      {
        label: "Three project invoices",
        effect: "$286K aged",
        tone: "negative",
      },
      {
        label: "Actionable near-term receipts",
        effect: "$210K",
        tone: "positive",
      },
    ],
    anomaly: "The modeled balance is above the proposed $250K alert threshold.",
    action:
      "Assign collection owner, client commitment date, and escalation path to each invoice over 45 days.",
    supportingView: "finance-ap-ar",
  },
  "Core team": {
    definition:
      "The illustrative ongoing workforce excluding seasonal crews and independent contractors.",
    formula: "Active workers classified as ongoing core positions",
    sources: ["ADP / PEO worker roster", "Position control register"],
    freshness:
      "Illustrative roster · intended daily worker-status synchronization",
    drivers: [
      { label: "Ongoing core positions", effect: "30 FTE", tone: "neutral" },
      {
        label: "Seasonal and contract labor",
        effect: "Shown separately",
        tone: "neutral",
      },
    ],
    anomaly:
      "Annual-return headcount and ongoing core headcount answer different questions and should not be compared without worker-type context.",
    action:
      "Maintain worker type, active dates, discipline, project allocation, and loaded cost in the common workforce model.",
    supportingView: "people-directory",
  },
  "Base utilization": {
    definition:
      "The share of available delivery capacity assigned to contracted or approved work in the base scenario.",
    formula: "Assigned delivery hours ÷ available delivery hours",
    sources: [
      "ADP time and worker calendar",
      "Project staffing plans",
      "Approved leave and capacity assumptions",
    ],
    freshness: "Illustrative utilization · intended weekly planning refresh",
    drivers: [
      { label: "Design", effect: "91% base", tone: "negative" },
      { label: "Planning", effect: "82% base", tone: "neutral" },
      { label: "Construction", effect: "76% base", tone: "positive" },
    ],
    anomaly:
      "Design is closest to the capacity guardrail and exceeds capacity in the expansion scenario.",
    action:
      "Create a contract bench now and gate a permanent design hire on executed discipline-specific backlog.",
    supportingView: "capacity",
  },
  "Expansion need": {
    definition:
      "Additional full-time-equivalent capacity required if the selected expansion assumptions convert.",
    formula:
      "Forecast required hours ÷ available hours per FTE − current available capacity",
    sources: [
      "Weighted pipeline",
      "Project labor plans",
      "ADP / PEO workforce capacity",
    ],
    freshness:
      "Illustrative scenario · intended weekly pipeline and capacity update",
    drivers: [
      { label: "Design demand", effect: "Primary gap", tone: "negative" },
      {
        label: "Project management",
        effect: "Secondary gap",
        tone: "negative",
      },
      { label: "Contract bench", effect: "Near-term buffer", tone: "positive" },
    ],
    anomaly:
      "Expansion capacity should not be released as a single undifferentiated hiring decision.",
    action:
      "Stage capacity by discipline and tie each release to executed backlog and expected start dates.",
    supportingView: "capacity",
  },
  "Labor recovery": {
    definition:
      "The share of loaded labor cost recovered through billable projects or allowable grant funding.",
    formula:
      "(Billable project labor + allowable grant labor) ÷ total loaded labor cost",
    sources: [
      "ADP payroll and certified time",
      "QuickBooks Online project accounting",
      "Grant allowability rules",
    ],
    freshness: "Illustrative allocation · intended pay-period certification",
    drivers: [
      { label: "Project-coded labor", effect: "71%", tone: "positive" },
      { label: "Mission and development", effect: "18%", tone: "neutral" },
      { label: "Shared services", effect: "11%", tone: "neutral" },
    ],
    anomaly:
      "The modeled 88% recovery remains below the 90% target and is sensitive to incomplete time allocation.",
    action:
      "Do not close payroll allocation until project, grant, and function coding clears the control total.",
    supportingView: "people-payroll",
  },
};
