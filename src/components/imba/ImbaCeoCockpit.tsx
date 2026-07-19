"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Compass,
  CreditCard,
  Database,
  FileText,
  Gauge,
  Gavel,
  GitMerge,
  HeartHandshake,
  Layers3,
  ListChecks,
  Mail,
  MapPin,
  Menu,
  Moon,
  Mountain,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Presentation,
  Route,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  capacityRows,
  imbaDecisions,
  imbaProjects,
  imbaScenarios,
  liquidityConstraints,
  publicBaseline,
  type ImbaDecision,
  type ImbaProject,
  type ImbaProjectStatus,
  type ImbaScenarioKey,
} from "@/lib/imba-cockpit-data";
import { imbaEmployees } from "@/lib/imba-detail-data";
import {
  imbaNextTwelveMonthRoadmap,
  imbaOsSections,
  type ImbaOsSection,
  type ImbaOsView,
} from "@/lib/imba-os-data";
import { ImbaWhatIfLab } from "@/components/imba/ImbaWhatIfLab";
import {
  ImbaFinanceWorkspace,
  type ImbaFinanceView,
} from "@/components/imba/ImbaFinanceWorkspace";
import {
  ImbaOperationsWorkspace,
  type ImbaOperationsView,
} from "@/components/imba/ImbaOperationsWorkspace";
import {
  ImbaMissionWorkspace,
  type ImbaMissionView,
} from "@/components/imba/ImbaMissionWorkspace";
import {
  ImbaPeopleWorkspace,
  type ImbaPeopleView,
} from "@/components/imba/ImbaPeopleWorkspace";
import {
  ImbaEnterpriseWorkspace,
  type ImbaEnterpriseView,
} from "@/components/imba/ImbaEnterpriseWorkspace";
import {
  ImbaIntegrationWorkspace,
  type ImbaIntegrationView,
} from "@/components/imba/ImbaIntegrationWorkspace";
import { ImbaCollaborationWorkspace } from "@/components/imba/ImbaCollaborationWorkspace";
import {
  ImbaWorkspaceSignature,
  workspaceModeForView,
} from "@/components/imba/ImbaWorkspaceSignature";
import type { ImbaCollaborationView } from "@/lib/imba-collaboration-data";
import { useImbaOsState } from "@/components/imba/ImbaOsState";
import { ImbaInfoTooltip } from "@/components/imba/ImbaInfoTooltip";
import { ImbaSectionInfo } from "@/components/imba/ImbaSectionInfo";
import { ImbaOnboarding } from "@/components/imba/ImbaOnboarding";
import {
  ImbaAlertsDrawer,
  ImbaInsightStrip,
  ImbaIntelligenceBar,
  ImbaMetricDrawer,
  type ImbaInsight,
  type ImbaMetricSelection,
} from "@/components/imba/ImbaIntelligenceLayer";
import {
  imbaRoleProfiles,
  initialImbaAlerts,
  initialImbaFilters,
  initialImbaSubscriptions,
  type ImbaAlertRule,
  type ImbaFilterState,
  type ImbaRoleKey,
  type ImbaSavedView,
  type ImbaSubscription,
} from "@/lib/imba-intelligence-data";

type DecisionStatus = "approved" | "delegated" | "deferred";
type DecisionRecord = {
  status: DecisionStatus;
  actor: string;
  at: string;
  assignee?: string; // "Name · Role"
  deadline?: string; // yyyy-mm-dd
  routedTo?: string; // owning team an approval routes to
};

const metricDefinitions: Record<string, string> = {
  "Deployable cash":
    "Cash remaining after donor restrictions, chapter obligations, deferred project revenue, and the forecast cost to complete committed work.",
  "13-week runway":
    "A rolling short-term cash forecast showing expected receipts, payments, and the lowest projected cash point during the next 13 weeks.",
  "Contracted backlog":
    "The unearned portion of signed Trail Solutions and other service agreements. It excludes unsigned opportunities.",
  "Forecast result":
    "The current full-year revenue less expense estimate, updated for actual results and the latest operating assumptions.",
  "Weighted pipeline":
    "Potential work multiplied by its probability of conversion. It is planning evidence, not contracted revenue.",
  "Portfolio contribution":
    "Contract revenue less the forecast fully loaded cost of delivering the project portfolio, shown as a percentage of contract value.",
  "At-risk value":
    "Contract or pipeline value attached to work currently outside an approved cost, schedule, billing, or capacity guardrail.",
  "Gross cash":
    "The total illustrative bank balance before separating restrictions, obligations, and delivery commitments.",
  "Known constraints":
    "Resources that appear in cash but are not currently available for general deployment.",
  "Receivables >45d":
    "Customer invoices outstanding more than 45 days and therefore receiving elevated collection attention.",
  "Core team":
    "The illustrative ongoing workforce, excluding seasonal crews and independent contractors.",
  "Base utilization":
    "The share of available delivery capacity currently assigned to contracted or approved work.",
  "Expansion need":
    "Additional full-time-equivalent capacity required if the modeled pipeline converts at the selected scenario assumptions.",
  "Labor recovery":
    "The share of loaded labor cost recovered through billable projects or allowable grant funding.",
};

const intelligenceStorageKey = "imba-os-intelligence-layer-v1";

interface ImbaIntelligenceStore {
  version: 1;
  role: ImbaRoleKey;
  filters: ImbaFilterState;
  savedViews: ImbaSavedView[];
  alerts: ImbaAlertRule[];
  subscriptions: ImbaSubscription[];
}

interface ImbaNavItem {
  id: ImbaOsView;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface ImbaNavSection {
  label: string;
  color: string;
  active: string;
  items: ImbaNavItem[];
}

const imbaNavSections: ImbaNavSection[] = [
  {
    label: "Mission",
    color: "border-blue-400/30 text-blue-700 dark:text-blue-200",
    active: "bg-blue-400/10",
    items: [
      {
        id: "operations",
        label: "Mission overview",
        description: "Community-to-impact architecture",
        icon: Route,
      },
      {
        id: "community-progress",
        label: "Community progress",
        description: "Intake through designation",
        icon: Compass,
      },
      {
        id: "trail-solutions",
        label: "Trail Solutions",
        description: "Plan, build, sign + steward",
        icon: Mountain,
      },
      {
        id: "project-board",
        label: "Project delivery",
        description: "Finance-aware Kanban",
        icon: ListChecks,
      },
      {
        id: "construction-reports",
        label: "Construction reports",
        description: "Delivery + crew controls",
        icon: BarChart3,
      },
      {
        id: "mission-reports",
        label: "Mission reports",
        description: "Programs + planning + policy",
        icon: FileText,
      },
      {
        id: "programs-education",
        label: "Programs + education",
        description: "Offerings through outcomes",
        icon: BookOpen,
      },
      {
        id: "assessments-designations",
        label: "Assessments + designations",
        description: "Score, award + renew",
        icon: ShieldCheck,
      },
      {
        id: "advocacy-policy",
        label: "Advocacy + policy",
        description: "Issues, campaigns + decisions",
        icon: Gavel,
      },
      {
        id: "chapter-network",
        label: "Local network",
        description: "Chapter + affiliate registry",
        icon: Building2,
      },
      {
        id: "chapter-standards",
        label: "Local standards",
        description: "Services + compliance",
        icon: ShieldCheck,
      },
      {
        id: "trail-assets",
        label: "Trail assets + stewardship",
        description: "Inventory through maintenance",
        icon: MapPin,
      },
      {
        id: "impact-research",
        label: "Impact + research",
        description: "Evidence, outcomes + learning",
        icon: BarChart3,
      },
      {
        id: "data-exchange",
        label: "Data exchange",
        description: "Synthesize inflows + outflows",
        icon: Workflow,
      },
    ],
  },
  {
    label: "Money",
    color: "border-emerald-400/30 text-emerald-700 dark:text-emerald-200",
    active: "bg-emerald-400/10",
    items: [
      {
        id: "money",
        label: "Finance architecture",
        description: "Close + three layers",
        icon: CircleDollarSign,
      },
      {
        id: "finance-snapshot",
        label: "Organization snapshot",
        description: "QuickBooks-style finance home",
        icon: Gauge,
      },
      {
        id: "finance-calendar",
        label: "Finance calendar",
        description: "Close + transaction deadlines",
        icon: CalendarDays,
      },
      {
        id: "finance-coa",
        label: "Chart of accounts",
        description: "Parent + chapter standard",
        icon: Database,
      },
      {
        id: "finance-grants",
        label: "Grant tracking",
        description: "Award-to-close lifecycle",
        icon: Target,
      },
      {
        id: "finance-cost-of-labor",
        label: "Cost of labor",
        description: "PEO decomposition + loaded rate",
        icon: Users,
      },
      {
        id: "finance-budget",
        label: "Budget + forecast",
        description: "Plan vs actual by engine",
        icon: BarChart3,
      },
      {
        id: "finance-reports",
        label: "Reports",
        description: "Financial reporting suite",
        icon: FileText,
      },
      {
        id: "finance-payables",
        label: "Accounts payable",
        description: "Approve & pay bills → Bill.com",
        icon: FileText,
      },
      {
        id: "finance-vendors",
        label: "Vendors",
        description: "Payables parties → QBO Vendors",
        icon: Building2,
      },
      {
        id: "finance-ap-ar",
        label: "Accounts receivable",
        description: "Collections + aging",
        icon: CircleDollarSign,
      },
      {
        id: "finance-customers",
        label: "Customers",
        description: "Trail Solutions clients → QBO Customers",
        icon: Users,
      },
      {
        id: "finance-grantors",
        label: "Grantors",
        description: "Funders · QBO Customer, class Grantor",
        icon: HeartHandshake,
      },
      {
        id: "finance-transactions",
        label: "Bills + invoices",
        description: "Controlled transaction entry",
        icon: BookOpen,
      },
      {
        id: "finance-expenses",
        label: "Expenses",
        description: "Expensify card spend + reconciliation",
        icon: CreditCard,
      },
      {
        id: "liquidity",
        label: "Liquidity runway",
        description: "Cash you can deploy",
        icon: Gauge,
      },
    ],
  },
  {
    label: "People",
    color: "border-cyan-400/30 text-cyan-700 dark:text-cyan-200",
    active: "bg-cyan-400/10",
    items: [
      {
        id: "people",
        label: "People command center",
        description: "Distributed workforce controls",
        icon: Users,
      },
      {
        id: "people-directory",
        label: "Workforce directory",
        description: "Core + seasonal + contract",
        icon: Users,
      },
      {
        id: "people-volunteers",
        label: "Volunteer hub",
        description: "Recruit, screen + deploy",
        icon: HeartHandshake,
      },
      {
        id: "people-training",
        label: "Learning + credentials",
        description: "Training, safety + readiness",
        icon: BookOpen,
      },
      {
        id: "people-reports",
        label: "People reports",
        description: "Hire dates + workforce controls",
        icon: BarChart3,
      },
      {
        id: "people-payroll",
        label: "PEO + payroll",
        description: "Labor allocation + close",
        icon: CircleDollarSign,
      },
      {
        id: "capacity",
        label: "Capacity plan",
        description: "People against pipeline",
        icon: TrendingUp,
      },
      {
        id: "people-hiring",
        label: "Hiring + positions",
        description: "Backlog-gated staffing",
        icon: BriefcaseBusiness,
      },
      {
        id: "people-role-studio",
        label: "Role studio",
        description: "Job descriptions + scorecards",
        icon: FileText,
      },
      {
        id: "people-onboarding",
        label: "Onboarding",
        description: "Access + payroll + readiness",
        icon: CalendarDays,
      },
      {
        id: "people-compliance",
        label: "People compliance",
        description: "PEO + worker + safety",
        icon: ShieldCheck,
      },
      {
        id: "people-documents",
        label: "Policies + documents",
        description: "Controlled workforce files",
        icon: FileText,
      },
    ],
  },
  {
    label: "Development",
    color: "border-amber-300/30 text-amber-800 dark:text-amber-100",
    active: "bg-amber-300/10",
    items: [
      {
        id: "development",
        label: "Development engine",
        description: "Membership + philanthropy",
        icon: HeartHandshake,
      },
      {
        id: "development-reports",
        label: "Development reports",
        description: "Pipeline + campaign performance",
        icon: BarChart3,
      },
      {
        id: "development-crm",
        label: "CRM workspace",
        description: "Relationships + next moves",
        icon: Target,
      },
      {
        id: "development-grant-pipeline",
        label: "Grant workspace",
        description: "Research through award handoff",
        icon: FileText,
      },
      {
        id: "development-grant-research",
        label: "Grant research",
        description: "Discover + qualify funders",
        icon: Search,
      },
      {
        id: "finance-grantors",
        label: "Grantors",
        description: "Funders · QBO Customer, class Grantor",
        icon: HeartHandshake,
      },
      {
        id: "development-campaigns",
        label: "Campaigns + membership",
        description: "Commitments + cash + impact",
        icon: Presentation,
      },
      {
        id: "development-donations",
        label: "Donations + pledges",
        description: "Gift intent through cash",
        icon: CircleDollarSign,
      },
      {
        id: "development-trail-solutions",
        label: "Trail Solutions BD",
        description: "Lead through signed scope",
        icon: BriefcaseBusiness,
      },
      {
        id: "development-marketing",
        label: "Marketing + communications",
        description: "Audience, content + attribution",
        icon: Mail,
      },
      {
        id: "development-press",
        label: "Press room",
        description: "Media requests + releases",
        icon: FileText,
      },
      {
        id: "development-partnerships",
        label: "Corporate partnerships",
        description: "Sponsors + fulfillment",
        icon: HeartHandshake,
      },
    ],
  },
  {
    label: "Platform",
    color: "border-violet-400/30 text-violet-700 dark:text-violet-200",
    active: "bg-violet-400/10",
    items: [
      {
        id: "platform",
        label: "Technology platform",
        description: "Integrations + data contract",
        icon: Network,
      },
      {
        id: "integration-control",
        label: "Integration control",
        description: "QBO + ADP exchange layer",
        icon: Workflow,
      },
      {
        id: "integration-qbo",
        label: "QuickBooks connector",
        description: "Accounting system of record",
        icon: CircleDollarSign,
      },
      {
        id: "integration-adp",
        label: "ADP connector",
        description: "Payroll + workforce authority",
        icon: Users,
      },
      {
        id: "integration-mappings",
        label: "Mapping center",
        description: "Canonical cross-system codes",
        icon: GitMerge,
      },
      {
        id: "integration-sync",
        label: "Sync queue",
        description: "Approvals + retries + errors",
        icon: ListChecks,
      },
      {
        id: "integration-audit",
        label: "Integration audit",
        description: "Durable operating evidence",
        icon: ShieldCheck,
      },
      {
        id: "platform-systems",
        label: "Systems + integrations",
        description: "Governed platform map",
        icon: Database,
      },
      {
        id: "platform-health",
        label: "System health",
        description: "Syncs + data quality + access",
        icon: Gauge,
      },
      {
        id: "platform-federated-data",
        label: "Federated data governance",
        description: "Local sharing + national rollup",
        icon: Network,
      },
    ],
  },
  {
    label: "Governance",
    color: "border-rose-400/30 text-rose-700 dark:text-rose-200",
    active: "bg-rose-400/10",
    items: [
      {
        id: "governance",
        label: "Governance room",
        description: "Board + audit readiness",
        icon: Gavel,
      },
      {
        id: "governance-board",
        label: "Board portal",
        description: "Packets + decisions + evidence",
        icon: Presentation,
      },
      {
        id: "governance-compliance",
        label: "Compliance",
        description: "Parent + chapter deadlines",
        icon: ShieldCheck,
      },
      {
        id: "governance-vault",
        label: "Governance vault",
        description: "Controlled documents",
        icon: BookOpen,
      },
    ],
  },
  {
    label: "Collaboration",
    color: "border-indigo-400/30 text-indigo-700 dark:text-indigo-200",
    active: "bg-indigo-400/10",
    items: [
      {
        id: "collaboration",
        label: "Collaboration overview",
        description: "Context + conversation + knowledge",
        icon: Mail,
      },
      {
        id: "collaboration-connectors",
        label: "Connected channels",
        description: "Slack, Teams, Notion + email",
        icon: Network,
      },
      {
        id: "collaboration-inbox",
        label: "My inbox",
        description: "Mentions + assignments + decisions",
        icon: ListChecks,
      },
      {
        id: "collaboration-workspaces",
        label: "Team workspaces",
        description: "Projects + grants + chapters",
        icon: Users,
      },
      {
        id: "collaboration-knowledge",
        label: "Knowledge hub",
        description: "Standards + runbooks + lessons",
        icon: BookOpen,
      },
      {
        id: "collaboration-meetings",
        label: "Meetings + decisions",
        description: "Agenda through follow-through",
        icon: Presentation,
      },
      {
        id: "communications-inbox",
        label: "Stakeholder inbox",
        description: "Assigned messages + commitments",
        icon: Mail,
      },
      {
        id: "communications-templates",
        label: "Message templates",
        description: "Controlled stakeholder language",
        icon: FileText,
      },
    ],
  },
  {
    label: "Management",
    color: "border-lime-300/30 text-lime-700 dark:text-lime-100",
    active: "bg-lime-300/10",
    items: [
      {
        id: "brief",
        label: "Executive brief",
        description: "The 15-minute view",
        icon: Gauge,
      },
      {
        id: "whatif",
        label: "WHAT_IF Lab",
        description: "Price Kent’s next idea",
        icon: SlidersHorizontal,
      },
      {
        id: "decisions",
        label: "Decision room",
        description: "Approve, adjust, or pause",
        icon: Target,
      },
      {
        id: "roadmap",
        label: "Next 12-month roadmap",
        description: "Day 1 through Month 12",
        icon: ListChecks,
      },
    ],
  },
  {
    label: "System",
    color: "border-slate-400/30 text-slate-700 dark:text-slate-200",
    active: "bg-slate-400/10",
    items: [
      {
        id: "system",
        label: "System control",
        description: "Access + quality + continuity",
        icon: Settings,
      },
      {
        id: "system-runbooks",
        label: "Runbooks",
        description: "Institution-owned procedures",
        icon: BookOpen,
      },
      {
        id: "system-activity",
        label: "Activity + decisions",
        description: "Append-only operating trail",
        icon: ListChecks,
      },
    ],
  },
];

const allNavItems = imbaNavSections.flatMap((section) => section.items);

// Per-section accent, matching each section's sidebar color. Values are RGB
// channels so opacity modifiers keep working: rgb(var(--sa)/0.1). Applied as
// CSS variables on the content container; workspace accent tokens read them.
// `soft` is the eyebrow/label accent for the dark theme (a bright pastel that
// reads on near-black). `softLight` is the light-theme counterpart: a deeper,
// saturated tone that stays legible on white. The cockpit swaps between them by
// theme when it builds --sa-soft.
type SectionAccent = { sa: string; soft: string; softLight: string; ink: string };
const sectionAccents: Record<string, SectionAccent> = {
  Mission: { sa: '96 165 250', soft: '191 219 254', softLight: '29 78 145', ink: '8 20 35' },
  Money: { sa: '183 227 91', soft: '223 247 168', softLight: '63 96 18', ink: '16 32 22' },
  People: { sa: '34 211 238', soft: '165 243 252', softLight: '14 105 128', ink: '6 26 31' },
  Development: { sa: '251 191 36', soft: '253 230 138', softLight: '140 92 8', ink: '38 27 6' },
  Platform: { sa: '167 139 250', soft: '221 214 254', softLight: '88 52 191', ink: '24 16 42' },
  Governance: { sa: '251 113 133', soft: '254 205 211', softLight: '190 33 60', ink: '42 12 18' },
  Collaboration: { sa: '129 140 248', soft: '199 210 254', softLight: '67 76 190', ink: '16 18 42' },
  System: { sa: '148 163 184', soft: '226 232 240', softLight: '65 80 100', ink: '15 20 28' },
  Management: { sa: '163 230 53', soft: '217 249 157', softLight: '74 104 20', ink: '20 30 6' },
};

function accentForView(view: string): SectionAccent {
  const section = imbaNavSections.find((s) => s.items.some((item) => item.id === view));
  return sectionAccents[section?.label ?? ''] ?? sectionAccents.Money;
}

// Per-section data-provenance info, surfaced via the header (i) affordance.
const sectionInfo: Record<string, { sources: string[]; note?: string }> = {
  Mission: {
    sources: [
      'Trail Solutions project system — engagements, phases, outcomes',
      'Community & chapter program reporting',
      'Public impact and advocacy records',
    ],
    note: 'Illustrative until program systems are connected. Public figures trace to IMBA’s Form 990.',
  },
  Money: {
    sources: [
      'QuickBooks Online — accounting / general ledger',
      'ADP (via PEO) — payroll and labor allocation',
      'Bill.com — vendor bill payment',
      'Bank feeds — cash positions',
      'Public figures re-derived from IMBA Form 990 (EIN 47-1254119)',
    ],
    note: 'Structure is production-minded; current-period values are illustrative until the GL and connectors are live. Money never moves inside IMBA-OS — payment would execute in Bill.com once that connector is live.',
  },
  People: {
    sources: [
      'ADP Workforce Now / PEO — workers, departments, timecards, payroll',
      'Internal HR and onboarding records',
    ],
    note: 'Labor and time must map reliably to projects, grants, and organizational functions.',
  },
  Development: {
    sources: [
      'Donor CRM / fundraising system — gifts, pledges, grants',
      'Grant contracts and restriction schedules',
    ],
    note: 'Restricted funding is tracked award-to-close; restrictions carry through to the Money pillar.',
  },
  Platform: {
    sources: [
      'IMBA-OS integration control plane — connector status and field mappings',
      'Outbound sync jobs across QuickBooks, ADP, and other systems',
    ],
    note: 'Writes are staged and require approval before they post to a system of record.',
  },
  Governance: {
    sources: [
      'Board packages, policies, and committee records',
      'Audit, management letters, and Form 990 readiness',
      'Compliance and restriction registers',
    ],
    note: 'Backed by an append-only decision and evidence trail.',
  },
  Collaboration: {
    sources: [
      'Cross-team workspace — messages, shared documents, and tasks',
      'Coordination across finance, program, and chapters',
    ],
  },
  System: {
    sources: [
      'IMBA-OS itself — access, quality, and continuity controls',
      'Runbooks and the append-only operating / audit trail',
    ],
  },
  Management: {
    sources: [
      'Rolls up the eight operating pillars: Mission, Money, People, Development, Platform, Governance, Collaboration, and System',
      'Executive brief, decisions, and the next 12-month roadmap',
    ],
    note: 'A synthesis layer — it reflects the eight operating sections rather than being a system of its own.',
  },
};

function sectionForView(view: string): string {
  return imbaNavSections.find((s) => s.items.some((item) => item.id === view))?.label ?? 'Management';
}

type RoleInsightDefinition = Omit<ImbaInsight, "id" | "scope">;

const roleInsightDefinitions: Record<ImbaRoleKey, RoleInsightDefinition> = {
  executive: {
    title: "The public baseline confirms an investment year",
    detail: "The 2025 annual report shows a $779K deficit; current scenarios must distinguish planned investment from operating variance.",
    tone: "warning",
    targetView: "finance-reports",
  },
  finance: {
    title: "PEO reconciliation ownership is pending",
    detail: "The continuity register identifies payroll reconciliation as a Finance process that still needs a named backup owner.",
    tone: "warning",
    targetView: "people-payroll",
  },
  hr: {
    title: "3 onboarding workstreams are active",
    detail: "People Ops should keep access, payroll, equipment, and readiness owners visible through each start.",
    tone: "warning",
    targetView: "people-onboarding",
  },
  "trail-solutions": {
    title: "Equipment reserve decision is still open",
    detail: "Great Lakes Buildout needs a construction leadership decision on equipment and closeout exposure.",
    tone: "risk",
    targetView: "construction-reports",
  },
  "planning-design": {
    title: "Base design utilization is 91%",
    detail: "Only 0.6 FTE remains available before the expansion scenario pushes design capacity beyond its guardrail.",
    tone: "warning",
    targetView: "capacity",
  },
  "local-programs": {
    title: "19 maintenance plans need renewal",
    detail: "The trail asset register reports 84% of maintenance plans current across the illustrative portfolio.",
    tone: "warning",
    targetView: "trail-assets",
  },
  communications: {
    title: "2 approval exceptions block release",
    detail: "Brand or policy review is holding two items in the marketing and communications queue.",
    tone: "warning",
    targetView: "development-marketing",
  },
  "government-affairs": {
    title: "Public comment deadline is Aug 19",
    detail: "The regional land-management plan is mobilizing and needs its approved policy message and audience.",
    tone: "warning",
    targetView: "advocacy-policy",
  },
  development: {
    title: "12 relationships need a next action",
    detail: "The relationship pipeline has 47 active records; twelve are missing a current stewardship or cultivation move.",
    tone: "warning",
    targetView: "development-crm",
  },
  board: {
    title: "Board packet readiness is 72%",
    detail: "Three owner inputs remain open before the modeled Aug 14 packet lock.",
    tone: "warning",
    targetView: "governance-board",
  },
};

function navSectionsForRole(role: ImbaRoleKey): ImbaNavSection[] {
  const profile = imbaRoleProfiles[role];
  const sidebarOrder = [
    "Management",
    "Mission",
    "Money",
    "Governance",
    "People",
    "Development",
    "Collaboration",
    "Platform",
    "System",
  ];
  return imbaNavSections
    .filter((section) => profile.sections.includes(section.label))
    .map((section) => {
      const allowedViews = profile.sectionViews?.[section.label];
      return allowedViews
        ? {
            ...section,
            items: section.items.filter((item) =>
              allowedViews.includes(item.id),
            ),
          }
        : section;
    })
    .filter((section) => section.items.length > 0)
    .sort((left, right) => sidebarOrder.indexOf(left.label) - sidebarOrder.indexOf(right.label));
}
const financeViews: ImbaFinanceView[] = [
  "finance-snapshot",
  "finance-calendar",
  "finance-coa",
  "finance-budget",
  "finance-grants",
  "finance-payables",
  "finance-ap-ar",
  "finance-reports",
  "finance-transactions",
  "finance-expenses",
  "finance-cost-of-labor",
  "finance-vendors",
  "finance-customers",
  "finance-grantors",
];
const operationsViews: ImbaOperationsView[] = [
  "project-command",
  "project-board",
  "chapter-network",
  "chapter-standards",
  "data-exchange",
];
const missionViews: ImbaMissionView[] = [
  "community-progress",
  "trail-solutions",
  "construction-reports",
  "mission-reports",
  "programs-education",
  "assessments-designations",
  "advocacy-policy",
  "trail-assets",
  "impact-research",
];
const peopleViews: ImbaPeopleView[] = [
  "people",
  "people-directory",
  "people-reports",
  "people-payroll",
  "people-hiring",
  "people-onboarding",
  "people-compliance",
  "people-documents",
  "people-volunteers",
  "people-training",
  "people-role-studio",
];
const integrationViews: ImbaIntegrationView[] = [
  "integration-control",
  "integration-qbo",
  "integration-adp",
  "integration-mappings",
  "integration-sync",
  "integration-audit",
];
const collaborationViews: ImbaCollaborationView[] = [
  "collaboration",
  "collaboration-inbox",
  "collaboration-workspaces",
  "collaboration-knowledge",
  "collaboration-meetings",
  "collaboration-connectors",
  "communications-inbox",
  "communications-templates",
];
const enterpriseViews: ImbaEnterpriseView[] = [
  "development-reports",
  "development-crm",
  "development-grant-pipeline",
  "development-campaigns",
  "development-trail-solutions",
  "development-marketing",
  "development-partnerships",
  "development-grant-research",
  "development-donations",
  "development-press",
  "governance-board",
  "governance-compliance",
  "governance-vault",
  "platform-systems",
  "platform-health",
  "platform-federated-data",
  "system-runbooks",
  "system-activity",
];

function money(value: number, compact = true): string {
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);

  if (compact) {
    const trim = (amount: number) =>
      amount
        .toFixed(2)
        .replace(/\.00$/, "")
        .replace(/(\.\d)0$/, "$1");
    if (absolute >= 1_000_000) return `${sign}$${trim(absolute / 1_000_000)}M`;
    if (absolute >= 1_000) return `${sign}$${trim(absolute / 1_000)}K`;
    return `${sign}$${trim(absolute)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusClasses(status: ImbaProjectStatus): string {
  if (status === "healthy")
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300";
  if (status === "watch")
    return "border-amber-400/25 bg-amber-400/10 text-amber-800 dark:text-amber-200";
  return "border-rose-400/25 bg-rose-400/10 text-rose-700 dark:text-rose-200";
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card)/90%)] shadow-[0_22px_80px_rgba(0,0,0,0.22)] ${className}`}
    >
      {children}
    </section>
  );
}

function PanelTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--line)/0.07)] px-5 py-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[rgb(var(--text-2))]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-[rgb(var(--text))]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  delta,
  tone,
  icon: Icon,
  onExplain,
}: {
  label: string;
  value: string;
  detail: string;
  delta: string;
  tone: "positive" | "warning" | "neutral";
  icon: LucideIcon;
  onExplain?: () => void;
}) {
  const toneClass =
    tone === "positive"
      ? "text-[rgb(var(--sa-soft))] bg-[rgb(var(--sa)/0.10)] border-[rgb(var(--sa)/0.20)]"
      : tone === "warning"
        ? "text-amber-800 dark:text-amber-200 bg-amber-300/10 border-amber-300/20"
        : "text-[rgb(var(--info))] bg-[#68b9aa]/10 border-[#68b9aa]/20";

  return (
    <div className="group rounded-[20px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4 transition hover:-translate-y-0.5 hover:border-[rgb(var(--line)/0.16)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">
            {label}
          </p>
          {metricDefinitions[label] ? (
            <ImbaInfoTooltip
              label={label}
              text={metricDefinitions[label]}
              align="left"
            />
          ) : null}
        </div>
        <div className={`rounded-xl border p-2 ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {onExplain ? (
        <button
          type="button"
          onClick={onExplain}
          className="mt-4 flex w-full items-end justify-between gap-3 text-left"
          aria-label={`Explain ${label}`}
        >
          <span className="font-mono text-[28px] font-semibold leading-none tracking-[-0.05em] text-[rgb(var(--text))]">
            {value}
          </span>
          <span className="inline-flex items-center gap-1 pb-0.5 text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))] transition group-hover:text-[rgb(var(--sa-soft))]">
            Explain <ArrowRight className="h-3 w-3" />
          </span>
        </button>
      ) : (
        <p className="mt-4 font-mono text-[28px] font-semibold leading-none tracking-[-0.05em] text-[rgb(var(--text))]">
          {value}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="text-[rgb(var(--text-2))]">{detail}</span>
        <span
          className={
            tone === "warning"
              ? "font-semibold text-amber-800 dark:text-amber-200"
              : "font-semibold text-[rgb(var(--sa-soft))]"
          }
        >
          {delta}
        </span>
      </div>
    </div>
  );
}

function CashRunwayChart({ series }: { series: number[] }) {
  const width = 700;
  const height = 230;
  const paddingX = 20;
  const paddingY = 20;
  const min = Math.min(...series) - 0.18;
  const max = Math.max(...series) + 0.12;
  const points = series.map((value, index) => {
    const x = paddingX + (index / (series.length - 1)) * (width - paddingX * 2);
    const y =
      paddingY + ((max - value) / (max - min)) * (height - paddingY * 2);
    return [x, y] as const;
  });
  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
  const area = `${line} L ${points.at(-1)?.[0]} ${height - paddingY} L ${points[0][0]} ${height - paddingY} Z`;
  const lowIndex = series.indexOf(Math.min(...series));
  const lowPoint = points[lowIndex];

  return (
    <div className="relative pt-3">
      <div className="absolute left-5 top-3 text-[11px] font-medium text-[rgb(var(--text-3))]">
        $2.5M
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[220px] w-full overflow-visible"
        role="img"
        aria-label="Illustrative 13-week cash runway"
      >
        <defs>
          <linearGradient id="cashArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--sa))" stopOpacity="0.24" />
            <stop offset="100%" stopColor="rgb(var(--sa))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.2, 0.5, 0.8].map((position) => (
          <line
            key={position}
            x1={paddingX}
            x2={width - paddingX}
            y1={paddingY + position * (height - paddingY * 2)}
            y2={paddingY + position * (height - paddingY * 2)}
            stroke="rgba(255,255,255,0.07)"
            strokeDasharray="4 7"
          />
        ))}
        <path d={area} fill="url(#cashArea)" />
        <path
          d={line}
          fill="none"
          stroke="rgb(var(--sa))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(([x, y], index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={index === lowIndex ? 5 : 2.2}
            fill={index === lowIndex ? "#f6c453" : "#d8f795"}
          />
        ))}
        <line
          x1={lowPoint[0]}
          x2={lowPoint[0]}
          y1={lowPoint[1] + 9}
          y2={height - paddingY}
          stroke="#f6c453"
          strokeDasharray="3 5"
          opacity="0.65"
        />
      </svg>
      <div className="flex justify-between px-5 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-3))]">
        <span>Week 1</span>
        <span>13-week low</span>
        <span>Week 13</span>
      </div>
    </div>
  );
}

// Delegate candidates for a decision: leaders (directors / managers) on the
// team(s) the decision touches, falling back to org-wide leadership.
function delegateCandidates(decision: ImbaDecision): Array<{ name: string; role: string }> {
  const owner = decision.owner.toLowerCase();
  const isLeader = (e: (typeof imbaEmployees)[number]) =>
    e.type === "Leadership" || /director|manager|vice president|\blead\b/i.test(e.role);
  const inTeams = (teams: string[]) => imbaEmployees.filter((e) => teams.includes(e.team));
  let pool: (typeof imbaEmployees)[number][] = [];
  if (/trail|project|construction|delivery|design/.test(owner)) pool = inTeams(["Construction & Ops", "Planning & Design", "Trail Field"]);
  else if (/people|talent|hr|workforce|staff/.test(owner)) pool = inTeams(["People & Culture"]);
  else if (/finance|budget|cash|grant/.test(owner)) pool = inTeams(["Development & Grants", "Executive"]);
  let candidates = pool.filter(isLeader);
  if (candidates.length < 2) candidates = imbaEmployees.filter(isLeader);
  return candidates.map((e) => ({ name: e.name, role: e.role }));
}

function nextBusinessDays(count: number): string {
  const d = new Date();
  let added = 0;
  while (added < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d.toISOString().slice(0, 10);
}

function formatDeadline(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DecisionCard({
  decision,
  record,
  candidates,
  onApprove,
  onDelegate,
  onDefer,
}: {
  decision: ImbaDecision;
  record?: DecisionRecord;
  candidates: Array<{ name: string; role: string }>;
  onApprove: () => void;
  onDelegate: (assignee: string, deadline: string) => void;
  onDefer: () => void;
}) {
  const [delegating, setDelegating] = useState(false);
  const [assignee, setAssignee] = useState(
    candidates[0] ? `${candidates[0].name} · ${candidates[0].role}` : "",
  );
  const [deadline, setDeadline] = useState(() => nextBusinessDays(3));

  const urgencyClass =
    decision.urgency === "Now"
      ? "bg-rose-400/10 text-rose-700 dark:text-rose-200 border-rose-400/20"
      : "bg-amber-300/10 text-amber-800 dark:text-amber-100 border-amber-300/20";

  const statusLine =
    record?.status === "approved"
      ? `Approved by ${record.actor} · routed to ${record.routedTo ?? decision.owner} to execute`
      : record?.status === "delegated"
        ? `Delegated to ${record.assignee} · respond by ${formatDeadline(record.deadline ?? "")}`
        : record?.status === "deferred"
          ? `Deferred by ${record.actor}`
          : "";

  return (
    <article className="rounded-[18px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-1 text-[11px] font-black uppercase tracking-widest ${urgencyClass}`}
            >
              {decision.urgency}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-3))]">
              Due {decision.due}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold text-[rgb(var(--text))]">
            {decision.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-2))]">
            {decision.context}
          </p>
        </div>
        {record ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--sa)/0.25)] bg-[rgb(var(--sa)/0.10)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--pos))]">
            <Check className="h-3.5 w-3.5" /> {record.status}
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.03)] p-3 md:grid-cols-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">
            Finance recommendation
          </p>
          <p className="mt-1.5 text-xs leading-5 text-[rgb(var(--text))]">
            {decision.recommendation}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">
            Expected effect
          </p>
          <p className="mt-1.5 text-xs leading-5 text-[rgb(var(--pos))]">
            {decision.financialEffect}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-[rgb(var(--text-3))]">
          Owner · {decision.owner}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="rounded-xl bg-[rgb(var(--sa))] px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[rgb(var(--sa-ink))] transition hover:bg-[#c9ef79]"
          >
            Approve path
          </button>
          <button
            type="button"
            onClick={() => setDelegating((value) => !value)}
            className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition ${delegating ? "border-[rgb(var(--sa)/0.4)] bg-[rgb(var(--sa)/0.08)] text-[rgb(var(--sa-soft))]" : "border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--text))] hover:bg-[rgb(var(--line)/0.08)]"}`}
          >
            Delegate
          </button>
          <button
            type="button"
            onClick={onDefer}
            className="rounded-xl border border-[rgb(var(--line)/0.08)] px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-2))] transition hover:text-[rgb(var(--text))]"
          >
            Defer
          </button>
        </div>
      </div>

      {delegating ? (
        <div className="mt-3 grid gap-3 rounded-2xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--line)/0.02)] p-3 sm:grid-cols-[1.5fr_1fr_auto] sm:items-end">
          <label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">
            Delegate to
            <select
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] px-3 py-2 text-xs text-[rgb(var(--text))] outline-none"
            >
              {candidates.map((candidate) => (
                <option key={candidate.name} value={`${candidate.name} · ${candidate.role}`}>
                  {candidate.name} — {candidate.role}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">
            Respond by
            <input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] px-3 py-2 text-xs text-[rgb(var(--text))] outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              if (assignee) onDelegate(assignee, deadline);
              setDelegating(false);
            }}
            className="rounded-xl bg-[rgb(var(--sa))] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[rgb(var(--sa-ink))]"
          >
            Send
          </button>
        </div>
      ) : null}

      {statusLine ? (
        <p className="mt-3 flex items-center gap-2 text-[11px] text-[rgb(var(--text-2))]">
          <Check className="h-3.5 w-3.5 text-[rgb(var(--sa-soft))]" /> {statusLine} · logged to the audit trail
        </p>
      ) : null}
    </article>
  );
}

function PortfolioTable({
  compact = false,
  projects = imbaProjects,
  onSelectProject,
}: {
  compact?: boolean;
  projects?: ImbaProject[];
  onSelectProject?: (project: string) => void;
}) {
  const rows = compact ? projects.slice(0, 4) : projects;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">
            <th className="px-5 py-3">Engagement</th>
            <th className="px-3 py-3">Delivery</th>
            <th className="px-3 py-3 text-right">Contract</th>
            <th className="px-3 py-3 text-right">EAC</th>
            <th className="px-3 py-3 text-right">Contribution</th>
            <th className="px-5 py-3">Signal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((project) => (
            <tr
              key={project.name}
              className="border-b border-[rgb(var(--line)/0.055)] last:border-0 hover:bg-[rgb(var(--line)/0.025)]"
            >
              <td className="px-5 py-3.5">
                {onSelectProject ? (
                  <button
                    type="button"
                    onClick={() => onSelectProject(project.name)}
                    className="text-xs font-semibold text-[rgb(var(--text))] hover:text-[rgb(var(--sa-soft))]"
                  >
                    {project.name}
                  </button>
                ) : (
                  <p className="text-xs font-semibold text-[rgb(var(--text))]">
                    {project.name}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">
                  {project.region} · {project.phase}
                </p>
              </td>
              <td className="px-3 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[rgb(var(--line)/0.08)]">
                    <div
                      className="h-full rounded-full bg-[#68b9aa]"
                      style={{ width: `${project.completion}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-[rgb(var(--text-2))]">
                    {project.completion}%
                  </span>
                </div>
              </td>
              <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text))]">
                {money(project.contractValue)}
              </td>
              <td className="px-3 py-3.5 text-right font-mono text-xs text-[rgb(var(--text-2))]">
                {money(project.forecastCost)}
              </td>
              <td className="px-3 py-3.5 text-right font-mono text-xs font-semibold text-[rgb(var(--pos))]">
                {project.contribution.toFixed(1)}%
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-black uppercase tracking-wider ${statusClasses(project.status)}`}
                >
                  {project.status}
                </span>
                {!compact ? (
                  <p className="mt-1.5 max-w-[240px] text-[11px] leading-4 text-[rgb(var(--text-3))]">
                    {project.signal}
                  </p>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const osSectionIcons: Record<ImbaOsSection["icon"], LucideIcon> = {
  route: Route,
  money: CircleDollarSign,
  people: Users,
  development: HeartHandshake,
  platform: Network,
  governance: Gavel,
  communications: Mail,
  system: Settings,
};

function ImbaOsSectionView({
  section,
  onNavigate,
}: {
  section: ImbaOsSection;
  onNavigate: (view: ImbaOsView) => void;
}) {
  const Icon = osSectionIcons[section.icon];
  const workspaceLinks: Partial<Record<ImbaOsSection["id"], Array<{ view: ImbaOsView; label: string; detail: string; icon: LucideIcon }>>> = {
    operations: [
      { view: "community-progress", label: "Community progress", detail: "Move a community from intake through designation.", icon: Compass },
      { view: "trail-solutions", label: "Trail Solutions", detail: "Open delivery, economics, billing, and risk.", icon: Mountain },
      { view: "programs-education", label: "Programs + education", detail: "Manage offerings, enrollment, delivery, and outcomes.", icon: BookOpen },
      { view: "chapter-network", label: "Local network", detail: "See chapters, reporting, obligations, and compliance.", icon: Building2 },
    ],
    money: [
      { view: "finance-snapshot", label: "Organization snapshot", detail: "Read performance, deployable cash, and close status.", icon: Gauge },
      { view: "finance-reports", label: "Reports", detail: "Produce financial and management reports.", icon: FileText },
      { view: "finance-payables", label: "Accounts payable", detail: "Review invoices and exercise approval controls.", icon: CircleDollarSign },
      { view: "liquidity", label: "Liquidity runway", detail: "Inspect constrained cash and the 13-week outlook.", icon: TrendingUp },
    ],
    development: [
      { view: "development-crm", label: "CRM workspace", detail: "Move relationships through owned next actions.", icon: Target },
      { view: "development-grant-research", label: "Grant research", detail: "Qualify funders against mission and eligibility.", icon: Search },
      { view: "development-donations", label: "Donations + pledges", detail: "Connect gift intent, restrictions, cash, and stewardship.", icon: CircleDollarSign },
      { view: "development-press", label: "Press room", detail: "Manage media requests, releases, approvals, and outcomes.", icon: Mail },
    ],
    platform: [
      { view: "integration-control", label: "Integration control", detail: "Inspect governed exchange across source systems.", icon: Workflow },
      { view: "platform-systems", label: "Systems + integrations", detail: "See ownership, data domains, and sync patterns.", icon: Database },
      { view: "platform-health", label: "System health", detail: "Review sync, quality, access, and incident signals.", icon: Gauge },
      { view: "platform-federated-data", label: "Federated data", detail: "Govern local sharing and national rollup.", icon: Network },
    ],
    governance: [
      { view: "governance-board", label: "Board portal", detail: "Open packets, decisions, and follow-through.", icon: Presentation },
      { view: "governance-compliance", label: "Compliance", detail: "Work filings, deadlines, evidence, and exceptions.", icon: ShieldCheck },
      { view: "governance-vault", label: "Governance vault", detail: "Open governed documents and review controls.", icon: BookOpen },
      { view: "decisions", label: "Decision room", detail: "Record approvals, delegations, and deferrals.", icon: Gavel },
    ],
    system: [
      { view: "system-activity", label: "Activity + decisions", detail: "Inspect the append-only operating trail.", icon: ListChecks },
      { view: "system-runbooks", label: "Runbooks", detail: "Open institution-owned operating procedures.", icon: BookOpen },
      { view: "platform-health", label: "System health", detail: "Review data quality, syncs, and access signals.", icon: Gauge },
      { view: "roadmap", label: "Roadmap", detail: "Track implementation milestones and outcomes.", icon: Route },
    ],
    communications: [
      { view: "collaboration-inbox", label: "My inbox", detail: "Work mentions, assignments, and decisions.", icon: ListChecks },
      { view: "collaboration-workspaces", label: "Team workspaces", detail: "Keep conversation attached to operating records.", icon: Users },
      { view: "collaboration-connectors", label: "Connected channels", detail: "Inspect Slack, Teams, Notion, SharePoint, and email seams.", icon: Network },
      { view: "communications-inbox", label: "Stakeholder inbox", detail: "Turn external messages into owned commitments.", icon: Mail },
    ],
  };
  const workspaces = workspaceLinks[section.id] ?? [];

  return (
    <div className="space-y-5">
      <section
        className={`overflow-hidden rounded-[24px] border bg-[linear-gradient(120deg,rgba(255,255,255,.045),rgba(255,255,255,.015))] ${section.border}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-5 p-6">
          <div className="flex max-w-3xl items-start gap-4">
            <div
              className={`rounded-2xl border border-current/20 p-3 ${section.accent}`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[rgb(var(--text-3))]">
                IMBA-OS · {section.subtitle}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[rgb(var(--text))]">
                {section.label}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--text-2))]">
                {section.thesis}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#68b9aa]/15 bg-[#68b9aa]/[0.05] px-4 py-3 text-right">
            <p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">
              Operating status
            </p>
            <p className="mt-1 text-xs font-semibold text-[rgb(var(--text))]">
              Working demo · source boundaries visible
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {section.outcomes.map((outcome) => (
          <div
            key={outcome.label}
            className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card-2))] p-4"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-3))]">
              {outcome.label}
            </p>
            <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-[rgb(var(--text))]">
              {outcome.value}
            </p>
            <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">{outcome.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelTitle
            eyebrow="Working views"
            title={`${section.label} command center`}
            action={
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-4))]">
                Open a workspace
              </span>
            }
          />
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {workspaces.map((workspace) => {
              const WorkspaceIcon = workspace.icon;
              return (
                <button
                  type="button"
                  key={workspace.view}
                  onClick={() => onNavigate(workspace.view)}
                  className="group rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4 text-left transition hover:border-[rgb(var(--sa)/0.25)] hover:bg-[rgb(var(--sa)/0.045)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-xl bg-[rgb(var(--sa)/0.10)] p-2 text-[rgb(var(--sa-soft))]"><WorkspaceIcon className="h-4 w-4" /></span>
                    <ArrowRight className="h-4 w-4 text-[rgb(var(--text-4))] transition group-hover:translate-x-1 group-hover:text-[rgb(var(--sa-soft))]" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[rgb(var(--text))]">{workspace.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-3))]">
                    {workspace.detail}
                  </p>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel className="xl:col-span-4">
          <PanelTitle
            eyebrow="Active operating controls"
            title="What this command center enforces"
          />
          <div className="space-y-3 p-5">
            {section.priorities.map((priority, index) => (
              <div
                key={priority}
                className="flex items-start gap-3 rounded-2xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.02)] p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--sa)/0.10)] font-mono text-[11px] font-bold text-[rgb(var(--sa-soft))]">
                  0{index + 1}
                </span>
                <p className="pt-1 text-xs leading-5 text-[rgb(var(--text-2))]">
                  {priority}
                </p>
              </div>
            ))}
          </div>
          {workspaces[0] ? (
            <div className="border-t border-[rgb(var(--line)/0.07)] p-4">
              <button
                type="button"
                onClick={() => onNavigate(workspaces[0].view)}
                className="flex w-full items-center justify-between rounded-xl bg-[rgb(var(--sa))] px-4 py-3 text-xs font-black text-[rgb(var(--sa-ink))] transition hover:bg-[#c9ef79]"
              >
                Open {workspaces[0].label} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </Panel>
      </div>

      <Panel>
        <PanelTitle
          eyebrow="Technology leverage"
          title="How data becomes an executive decision"
        />
        <div className="grid gap-3 p-5 md:grid-cols-5">
          {[
            {
              icon: Database,
              title: "Source systems",
              text: "Preserve the tools already doing useful work.",
            },
            {
              icon: Workflow,
              title: "Canonical dimensions",
              text: "Project, funder, entity, phase, and owner.",
            },
            {
              icon: ShieldCheck,
              title: "Control rules",
              text: "Completeness, reconciliation, and approval.",
            },
            {
              icon: Presentation,
              title: "Decision surface",
              text: "Show only what changed and why it matters.",
            },
            {
              icon: Target,
              title: "Owned action",
              text: "Decision, rationale, milestone, and follow-through.",
            },
          ].map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4"
              >
                <div className="flex items-center justify-between">
                  <StepIcon className="h-4 w-4 text-[rgb(var(--sa-soft))]" />
                  <span className="font-mono text-[11px] text-[rgb(var(--text-4))]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-xs font-semibold text-[rgb(var(--text))]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[11px] leading-4 text-[rgb(var(--text-3))]">
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function ImbaRoadmapView({
  onNavigate,
}: {
  onNavigate: (view: ImbaOsView) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-[#68b9aa]/20 bg-[linear-gradient(120deg,rgba(104,185,170,.1),rgba(183,227,91,.035))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[rgb(var(--text-3))]">
              Proposal translated into product
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[rgb(var(--text))]">
              The next 12-month IMBA-OS roadmap
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--text-2))]">
              The software grows in the same order as the finance function:
              understand the current state, stabilize the close, make projects
              trustworthy, then add foresight and scale.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("whatif")}
            className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--sa))] px-4 py-3 text-xs font-black text-[rgb(var(--sa-ink))] hover:bg-[#c9ef79]"
          >
            <SlidersHorizontal className="h-4 w-4" /> Open Day-180 WHAT_IF Lab
          </button>
        </div>
      </section>
      <div className="relative space-y-4 before:absolute before:bottom-8 before:left-[27px] before:top-8 before:w-px before:bg-gradient-to-b before:from-[rgb(var(--sa))] before:via-[#68b9aa] before:to-transparent sm:before:left-[83px]">
        {imbaNextTwelveMonthRoadmap.map((step, index) => (
          <article
            key={step.milestone}
            className="relative grid gap-4 sm:grid-cols-[120px_1fr]"
          >
            <div className="relative z-10 flex items-start sm:justify-center">
              {/* Opaque base (--app-bg) under the tint so the pill masks the
                  vertical rail behind it instead of letting it show through. */}
              <span
                className={`inline-flex min-w-[72px] justify-center rounded-full border bg-[rgb(var(--app-bg))] px-3 py-2 text-[11px] font-black uppercase tracking-wider ${index < 2 ? "border-[rgb(var(--sa)/0.25)] bg-[linear-gradient(rgb(var(--sa)/0.12),rgb(var(--sa)/0.12))] text-[rgb(var(--sa-soft))]" : "border-[#68b9aa]/20 bg-[linear-gradient(rgb(104_185_170/0.12),rgb(104_185_170/0.12))] text-[rgb(var(--info))]"}`}
              >
                {step.milestone}
              </span>
            </div>
            <div className="rounded-[20px] border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card)/90%)] p-5">
              <h3 className="text-base font-semibold text-[rgb(var(--text))]">
                {step.title}
              </h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {step.deliverables.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 rounded-xl bg-[rgb(var(--line)/0.025)] px-3 py-2.5"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--sa-soft))]" />
                    <span className="text-[11px] leading-5 text-[rgb(var(--text-2))]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ImbaCeoCockpit() {
  const { connectors, syncJobs, addAuditEvent } = useImbaOsState();
  const [view, setView] = useState<ImbaOsView>("brief");
  const [scenarioKey, setScenarioKey] = useState<ImbaScenarioKey>("base");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({ Management: true });
  const [decisionRecords, setDecisionRecords] = useState<
    Record<string, DecisionRecord>
  >({});
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("imba-decisions-v1");
      if (saved) setDecisionRecords(JSON.parse(saved) as Record<string, DecisionRecord>);
    } catch {
      /* ignore corrupt cache */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("imba-decisions-v1", JSON.stringify(decisionRecords));
    } catch {
      /* storage unavailable */
    }
  }, [decisionRecords]);
  const [role, setRole] = useState<ImbaRoleKey>("executive");
  const [filters, setFilters] = useState<ImbaFilterState>(initialImbaFilters);
  const [savedViews, setSavedViews] = useState<ImbaSavedView[]>([]);
  const [alerts, setAlerts] = useState<ImbaAlertRule[]>(initialImbaAlerts);
  const [subscriptions, setSubscriptions] = useState<ImbaSubscription[]>(
    initialImbaSubscriptions,
  );
  const [selectedMetric, setSelectedMetric] =
    useState<ImbaMetricSelection | null>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [intelligenceHydrated, setIntelligenceHydrated] = useState(false);
  // Theme defaults to light (set for the Monday demo); a no-FOUC script in the
  // root layout applies the stored choice before paint, and this state mirrors
  // it for the toggle UI and for picking the accent's light/dark eyebrow tone.
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const stored = window.localStorage.getItem("imba-theme");
    setTheme(stored === "dark" ? "dark" : "light");
  }, []);
  useEffect(() => {
    setSidebarCollapsed(
      window.localStorage.getItem("imba-sidebar-collapsed") === "true",
    );
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("imba-theme", theme);
  }, [theme]);
  const scenario = imbaScenarios[scenarioKey];
  const currentView =
    allNavItems.find((item) => item.id === view) ?? allNavItems[0];
  const activeOsSection = imbaOsSections.find((section) => section.id === view);
  const accent = accentForView(view);
  const accentStyle = {
    '--sa': accent.sa,
    // Eyebrow/label accent must stay legible on the active theme's surface.
    '--sa-soft': theme === 'dark' ? accent.soft : accent.softLight,
    '--sa-ink': accent.ink,
  } as React.CSSProperties;
  const activeSectionLabel = sectionForView(view);
  const activeWorkspaceSlug = activeSectionLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const activeWorkspaceMode = workspaceModeForView(view);
  const activeSectionInfo = sectionInfo[activeSectionLabel];
  const isScenarioAware = [
    "brief",
    "portfolio",
    "liquidity",
    "capacity",
    "decisions",
  ].includes(view);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(intelligenceStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ImbaIntelligenceStore;
          if (parsed.version === 1) {
            setRole(parsed.role);
            setFilters(parsed.filters);
            setSavedViews(parsed.savedViews);
            setAlerts(parsed.alerts);
            setSubscriptions(parsed.subscriptions);
            // View state is not persisted, so a reload would otherwise leave a
            // restored non-executive role staring at the executive brief with no
            // sidebar item selected. Land the role on its own home view instead
            // (same logic as changeRole).
            const restoredProfile = imbaRoleProfiles[parsed.role];
            const restoredNavigation = navSectionsForRole(parsed.role);
            const allowedViews = restoredNavigation.flatMap((section) => section.items.map((item) => item.id));
            if (restoredProfile && !allowedViews.includes("brief")) {
              setView(restoredProfile.home);
              const homeSection = restoredNavigation.find((section) =>
                section.items.some((item) => item.id === restoredProfile.home),
              );
              setExpandedSections(homeSection ? { [homeSection.label]: true } : {});
            }
          }
        } catch {
          window.localStorage.removeItem(intelligenceStorageKey);
        }
      }
      setIntelligenceHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!intelligenceHydrated) return;
    const store: ImbaIntelligenceStore = {
      version: 1,
      role,
      filters,
      savedViews,
      alerts,
      subscriptions,
    };
    window.localStorage.setItem(intelligenceStorageKey, JSON.stringify(store));
  }, [alerts, filters, intelligenceHydrated, role, savedViews, subscriptions]);

  const visibleNavSections = useMemo(() => navSectionsForRole(role), [role]);
  const [dismissedHeroes, setDismissedHeroes] = useState<Set<string>>(() => new Set());
  // The large workspace introduction belongs only on the pillar landing.
  // Detail views open directly into their working surface.
  const landingSection = visibleNavSections.find((s) => s.items.some((item) => item.id === view));
  const isSectionLanding = Boolean(landingSection) && landingSection?.items[0]?.id === view;
  const regions = useMemo(
    () => Array.from(new Set(imbaProjects.map((project) => project.region))),
    [],
  );
  const phases = useMemo(
    () => Array.from(new Set(imbaProjects.map((project) => project.phase))),
    [],
  );
  const projectNames = useMemo(
    () => imbaProjects.map((project) => project.name),
    [],
  );
  const filteredProjects = useMemo(
    () =>
      imbaProjects.filter((project) => {
        if (
          filters.region !== "All regions" &&
          project.region !== filters.region
        )
          return false;
        if (filters.phase !== "All phases" && project.phase !== filters.phase)
          return false;
        if (
          filters.project !== "All projects" &&
          project.name !== filters.project
        )
          return false;
        if (filters.status === "Healthy" && project.status !== "healthy")
          return false;
        if (filters.status === "Watch" && project.status !== "watch")
          return false;
        if (filters.status === "At risk" && project.status !== "at-risk")
          return false;
        return true;
      }),
    [filters],
  );

  const projectTotals = useMemo(() => {
    const contract = filteredProjects.reduce(
      (sum, project) => sum + project.contractValue,
      0,
    );
    const forecastCost = filteredProjects.reduce(
      (sum, project) => sum + project.forecastCost,
      0,
    );
    return {
      contract,
      forecastCost,
      contribution: contract ? ((contract - forecastCost) / contract) * 100 : 0,
    };
  }, [filteredProjects]);

  const intelligenceInsights = useMemo<ImbaInsight[]>(() => {
    const atRisk = filteredProjects.filter(
      (project) => project.status === "at-risk",
    );
    const onWatch = filteredProjects.filter(
      (project) => project.status === "watch",
    );
    const billingLag = filteredProjects
      .filter((project) => project.completion - project.billed >= 7)
      .sort((a, b) => b.completion - b.billed - (a.completion - a.billed))[0];
    const accessibleViews = new Set(
      visibleNavSections.flatMap((section) =>
        section.items.map((item) => item.id),
      ),
    );
    const target = (preferred: ImbaOsView) =>
      accessibleViews.has(preferred) ? preferred : view;
    const scope = `${imbaRoleProfiles[role].label} / ${activeSectionLabel}`;
    const roleInsight = roleInsightDefinitions[role];
    const roleScopedInsight: ImbaInsight = {
      ...roleInsight,
      id: `role-${role}-${activeSectionLabel}`,
      scope,
      targetView: target(roleInsight.targetView),
    };

    let sectionInsights: ImbaInsight[];
    switch (activeSectionLabel) {
      case "Mission":
        sectionInsights = [
          {
            id: "mission-risk",
            scope,
            title: atRisk.length
              ? `${atRisk.length} delivery record outside guardrail`
              : "No at-risk delivery record in scope",
            detail:
              atRisk[0]?.signal ??
              "The selected portfolio contains healthy and watch signals only.",
            tone: atRisk.length ? "risk" : "positive",
            project: atRisk[0]?.name,
            targetView: target("construction-reports"),
          },
          {
            id: "mission-watch",
            scope,
            title: onWatch.length
              ? `${onWatch.length} delivery record on watch`
              : "No watch signal in scope",
            detail:
              onWatch[0]?.signal ??
              "No selected project currently requires elevated delivery monitoring.",
            tone: onWatch.length ? "warning" : "positive",
            project: onWatch[0]?.name,
            targetView: target("mission-reports"),
          },
        ];
        break;
      case "Money":
        sectionInsights = [
          {
            id: "money-billing",
            scope,
            title: billingLag
              ? "Delivery is ahead of billing"
              : "Billing is aligned",
            detail: billingLag
              ? `${billingLag.name} is ${billingLag.completion - billingLag.billed} points ahead of invoicing.`
              : "No selected project exceeds the modeled billing-lag threshold.",
            tone: billingLag ? "warning" : "positive",
            project: billingLag?.name,
            targetView: target("finance-ap-ar"),
          },
          {
            id: "money-cash-floor",
            scope,
            title:
              scenario.deployableCash <= 1_500_000
                ? "Deployable cash is at the modeled floor"
                : "Deployable cash remains above floor",
            detail: `${scenario.label} shows ${money(scenario.deployableCash)} against the $1.50M management threshold.`,
            tone:
              scenario.deployableCash <= 1_500_000 ? "risk" : "positive",
            targetView: target("liquidity"),
          },
        ];
        break;
      case "People":
        sectionInsights = [
          {
            id: "people-capacity",
            scope,
            title: "Design capacity reaches 104% in expansion",
            detail: "The base plan is already at 91%; permanent hiring remains gated on executed design backlog.",
            tone: "risk",
            targetView: target("capacity"),
          },
          {
            id: "people-recovery",
            scope,
            title: "Labor recovery is 2 points below target",
            detail: "Modeled recovery is 88% against a 90% target; incomplete project and grant coding remains the control risk.",
            tone: "warning",
            targetView: target("people-reports"),
          },
        ];
        break;
      case "Development":
        sectionInsights = [
          {
            id: "development-handoffs",
            scope,
            title: "3 award handoffs need restriction setup",
            detail: "Award records should not move into delivery until Finance receives the restrictions and reporting assumptions.",
            tone: "warning",
            targetView: target("development-reports"),
          },
          {
            id: "development-renewal",
            scope,
            title: "$280K of partnership value is at renewal risk",
            detail: "Three corporate relationships need current fulfillment evidence and an owned renewal move.",
            tone: "risk",
            targetView: target("development-partnerships"),
          },
        ];
        break;
      case "Governance":
        sectionInsights = [
          {
            id: "governance-overdue",
            scope,
            title: "1 compliance item is overdue",
            detail: "The overdue chapter good-standing receipt remains in the owned remediation queue.",
            tone: "risk",
            targetView: target("governance-compliance"),
          },
          {
            id: "governance-attestations",
            scope,
            title: "2 conflict attestations remain open",
            detail: "11 of 12 attestations are complete in the illustrative compliance register (8 independent voting board members plus officers).",
            tone: "warning",
            targetView: target("governance-compliance"),
          },
        ];
        break;
      case "Collaboration":
        sectionInsights = [
          {
            id: "collaboration-response",
            scope,
            title: "11 stakeholder messages need a response",
            detail: "Three of the open responses depend on Finance before the owner can close the commitment.",
            tone: "warning",
            targetView: target("communications-inbox"),
          },
          {
            id: "collaboration-approvals",
            scope,
            title: "4 client approvals affect $252K of billing",
            detail: "Milestone acceptance must be captured before the related invoices can be released.",
            tone: "risk",
            targetView: target("collaboration-inbox"),
          },
        ];
        break;
      case "Platform": {
        const openSyncJobs = syncJobs.filter(
          (job) => job.status !== "synced",
        );
        const syncExceptions = syncJobs.filter(
          (job) => job.status === "error",
        );
        sectionInsights = [
          {
            id: "platform-sync-work",
            scope,
            title: `${openSyncJobs.length} sync ${openSyncJobs.length === 1 ? "job" : "jobs"} need attention`,
            detail: syncExceptions.length
              ? `${syncExceptions.length} exception ${syncExceptions.length === 1 ? "is" : "are"} held from posting; the remaining work is queued or awaiting approval.`
              : "Open work is queued or awaiting approval; no connector exception is present.",
            tone: syncExceptions.length ? "risk" : openSyncJobs.length ? "warning" : "positive",
            targetView: target("integration-sync"),
          },
          {
            id: "platform-connectors",
            scope,
            title: "Connector health is role-visible",
            detail: `QuickBooks is ${connectors.qbo.syncHealth.toLowerCase()} and ADP is ${connectors.adp.syncHealth.toLowerCase()} in ${connectors.qbo.mode.toLowerCase()} mode.`,
            tone:
              connectors.qbo.syncHealth === "healthy" &&
              connectors.adp.syncHealth === "healthy"
                ? "positive"
                : "warning",
            targetView: target("platform-health"),
          },
        ];
        break;
      }
      case "System":
        sectionInsights = [
          {
            id: "system-runbooks",
            scope,
            title: "4 process backup gaps remain",
            detail: "Two-deep runbook coverage is 72%, with three continuity tests due this quarter.",
            tone: "warning",
            targetView: target("system-runbooks"),
          },
          {
            id: "system-exceptions",
            scope,
            title: "7 data exceptions are contained",
            detail: "The append-only activity trail reports no uncontrolled postings from the current exception queue.",
            tone: "positive",
            targetView: target("system-activity"),
          },
        ];
        break;
      default:
        sectionInsights = [
          {
            id: "management-decisions",
            scope,
            title: `${imbaDecisions.length} management decisions remain open`,
            detail: "Equipment, design capacity, and billing timing each have an owner, recommendation, and due point.",
            tone: "warning",
            targetView: target("decisions"),
          },
          {
            id: "management-downside",
            scope,
            title: "Conservative cash falls below the floor",
            detail: `${imbaScenarios.conservative.label} ends at ${money(imbaScenarios.conservative.yearEndCash)}, $80K below the modeled $1.50M threshold.`,
            tone: "risk",
            targetView: target("whatif"),
          },
        ];
    }

    return [roleScopedInsight, ...sectionInsights];
  }, [
    activeSectionLabel,
    connectors,
    filteredProjects,
    role,
    scenario,
    syncJobs,
    view,
    visibleNavSections,
  ]);

  const setCurrentView = (next: ImbaOsView) => {
    setView(next);
    setMobileNavOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("imba-sidebar-collapsed", String(next));
      if (!next) {
        setExpandedSections((sections) => ({
          ...sections,
          [activeSectionLabel]: true,
        }));
      }
      return next;
    });
  };

  const changeRole = (nextRole: ImbaRoleKey) => {
    setRole(nextRole);
    const profile = imbaRoleProfiles[nextRole];
    const nextNavigation = navSectionsForRole(nextRole);
    // Land on the role's home view and expand only the section that contains it,
    // so each role opens on its primary section (e.g. HR → People → Directory).
    setCurrentView(profile.home);
    const homeSection = nextNavigation.find((section) =>
      section.items.some((item) => item.id === profile.home),
    );
    setExpandedSections(homeSection ? { [homeSection.label]: true } : {});
  };

  // Decision queue actions — persist the outcome and log it to the append-only
  // audit trail (System → Activity), so approvals and delegations are real.
  const decisionActor = imbaRoleProfiles[role].label;
  const stampNow = () =>
    new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const approveDecision = (decision: ImbaDecision) => {
    setDecisionRecords((current) => ({
      ...current,
      [decision.id]: { status: "approved", actor: decisionActor, at: stampNow(), routedTo: decision.owner },
    }));
    addAuditEvent({ action: "Decision approved", record: decision.title, actor: decisionActor, detail: `Approved; routed to ${decision.owner} to execute.` });
  };
  const delegateDecision = (decision: ImbaDecision, assignee: string, deadline: string) => {
    setDecisionRecords((current) => ({
      ...current,
      [decision.id]: { status: "delegated", actor: decisionActor, at: stampNow(), assignee, deadline },
    }));
    addAuditEvent({ action: "Decision delegated", record: decision.title, actor: decisionActor, detail: `Delegated to ${assignee}; respond by ${formatDeadline(deadline)}.` });
  };
  const deferDecision = (decision: ImbaDecision) => {
    setDecisionRecords((current) => ({
      ...current,
      [decision.id]: { status: "deferred", actor: decisionActor, at: stampNow() },
    }));
    addAuditEvent({ action: "Decision deferred", record: decision.title, actor: decisionActor, detail: "Deferred for later review." });
  };

  const saveCurrentView = () => {
    const scope =
      filters.project !== "All projects"
        ? filters.project
        : filters.region !== "All regions"
          ? filters.region
          : currentView.label;
    const saved: ImbaSavedView = {
      id: `VIEW-${Date.now()}`,
      name: `${imbaRoleProfiles[role].label} · ${scope}`,
      role,
      view,
      scenario: scenarioKey,
      filters,
      savedAt: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setSavedViews((current) => [saved, ...current].slice(0, 8));
  };

  const applySavedView = (id: string) => {
    const saved = savedViews.find((item) => item.id === id);
    if (!saved) return;
    setRole(saved.role);
    setScenarioKey(saved.scenario);
    setFilters(saved.filters);
    setCurrentView(saved.view);
  };

  const explainMetric = (label: string, value: string, detail: string) =>
    setSelectedMetric({ label, value, detail });

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden bg-[rgb(var(--panel))] font-sans text-[rgb(var(--text))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_2%,rgba(105,185,170,0.12),transparent_30%),radial-gradient(circle_at_15%_100%,rgba(183,227,91,0.08),transparent_28%)]" />

      <aside
        className={`${mobileNavOpen ? "translate-x-0" : "-translate-x-full"} absolute inset-y-0 left-0 z-30 flex w-[252px] flex-col border-r border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel))] transition-[transform,width] duration-300 lg:relative lg:translate-x-0 ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[252px]"}`}
      >
        <div className={`flex h-[86px] items-center justify-between border-b border-[rgb(var(--line)/0.08)] px-5 ${sidebarCollapsed ? "lg:flex-col lg:justify-center lg:gap-1 lg:px-2" : ""}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--sa))] text-[#0b2118] shadow-[0_0_30px_rgba(183,227,91,0.16)] ${sidebarCollapsed ? "lg:h-9 lg:w-9 lg:rounded-xl" : ""}`}>
              <Mountain className="h-6 w-6" />
            </div>
            <div className={sidebarCollapsed ? "lg:hidden" : ""}>
              <h1 className="text-sm font-semibold tracking-tight text-[rgb(var(--text))]">
                IMBA-OS
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden rounded-lg p-1.5 text-[rgb(var(--text-3))] transition hover:bg-[rgb(var(--line)/0.06)] hover:text-[rgb(var(--text))] lg:inline-flex"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Minimize sidebar"}
            aria-pressed={sidebarCollapsed}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-2 text-[rgb(var(--text-3))] hover:bg-[rgb(var(--line)/0.06)] lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto px-3 py-4 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
          <div className="px-2">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[rgb(var(--text-4))]">
              Nonprofit operating system
            </p>
          </div>
          <nav
            className="mt-3 space-y-2"
            aria-label="IMBA operating system views"
            data-tour="primary-navigation"
          >
            {visibleNavSections.map((section) => {
              const isExpanded = Boolean(expandedSections[section.label]);
              const hasActiveItem = section.items.some(
                (item) => item.id === view,
              );
              return (
                <div
                  key={section.label}
                  className={`overflow-hidden rounded-2xl border bg-[rgb(var(--line)/0.018)] ${section.color}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSections((current) => ({
                        ...current,
                        [section.label]: !isExpanded,
                      }))
                    }
                    className={`flex w-full items-center justify-between px-3.5 py-3 text-left transition hover:bg-[rgb(var(--line)/0.035)] ${hasActiveItem ? section.active : ""}`}
                    aria-expanded={isExpanded}
                  >
                    <span className="text-[11px] font-black uppercase tracking-[0.13em]">
                      {section.label}
                    </span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>
                  {isExpanded ? (
                    <div className="space-y-1 border-t border-current/10 p-1.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = item.id === view;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCurrentView(item.id)}
                            data-tour={`nav-${item.id}`}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-[rgb(var(--line)/0.08)] text-[rgb(var(--text))]" : "text-[rgb(var(--text-3))] hover:bg-[rgb(var(--line)/0.04)] hover:text-[rgb(var(--text))]"}`}
                          >
                            <Icon
                              className={`h-3.5 w-3.5 shrink-0 ${active ? "text-[rgb(var(--sa-soft))]" : "text-current/60"}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[11px] font-semibold">
                                {item.label}
                              </span>
                              <span className="mt-0.5 block truncate text-[11px] text-[rgb(var(--text-4))]">
                                {item.description}
                              </span>
                            </span>
                            {active ? (
                              <ArrowRight className="h-3 w-3 text-[rgb(var(--sa-soft))]" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>

        {sidebarCollapsed ? (
          <nav
            className="hidden flex-1 flex-col items-center gap-2 overflow-y-auto px-2 py-4 lg:flex"
            aria-label="Minimized IMBA operating system views"
          >
            {visibleNavSections.map((section) => {
              const SectionIcon = section.items[0].icon;
              const hasActiveItem = section.items.some(
                (item) => item.id === view,
              );
              return (
                <button
                  key={section.label}
                  type="button"
                  onClick={() => setCurrentView(section.items[0].id)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition hover:bg-[rgb(var(--line)/0.05)] ${section.color} ${hasActiveItem ? section.active : "bg-[rgb(var(--line)/0.018)]"}`}
                  aria-label={`Open ${section.label}`}
                  title={`${section.label}: ${section.items[0].label}`}
                >
                  <SectionIcon className="h-4 w-4" />
                </button>
              );
            })}
          </nav>
        ) : null}

        <div className={`shrink-0 border-t border-[rgb(var(--line)/0.07)] p-3 ${sidebarCollapsed ? "lg:hidden" : ""}`}>
          <div className="flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-4))]">
            <span>IMBA-OS Prototype</span>
            <span>Technology + Mission</span>
          </div>
        </div>
      </aside>

      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="absolute inset-0 z-20 bg-black/55 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden" style={accentStyle}>
        <header className="relative z-30 flex h-[86px] shrink-0 items-center justify-between border-b border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel)/85%)] px-4 backdrop-blur-xl sm:px-6 xl:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-xl border border-[rgb(var(--line)/0.08)] p-2 text-[rgb(var(--text-2))] hover:bg-[rgb(var(--line)/0.05)] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-semibold tracking-tight text-[rgb(var(--text))]">
                  {currentView.label}
                </p>
                {activeSectionInfo ? (
                  <ImbaSectionInfo
                    section={activeSectionLabel}
                    sources={activeSectionInfo.sources}
                    note={activeSectionInfo.note}
                  />
                ) : null}
                <span className="hidden rounded-full border border-[#68b9aa]/20 bg-[#68b9aa]/10 px-2 py-1 text-[11px] font-black uppercase tracking-widest text-[rgb(var(--info))] sm:inline-flex">
                  Illustrative
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] font-medium text-[rgb(var(--text-3))]">
                What changed · why it matters · what is forecast · what Kent
                decides
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.03)] text-[rgb(var(--text-2))] transition hover:bg-[rgb(var(--line)/0.07)] hover:text-[rgb(var(--text))]"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <ImbaOnboarding role={role} currentView={view} onNavigate={setCurrentView} />
            <div className="hidden items-center gap-1.5 md:flex" data-tour="role-control">
              <div className="relative">
                <select
                  value={role}
                  onChange={(event) => changeRole(event.target.value as ImbaRoleKey)}
                  aria-label="Select role"
                  className="appearance-none rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] py-2.5 pl-3 pr-9 text-[11px] font-bold text-[rgb(var(--text))] outline-none ring-[rgb(var(--sa)/0.40)] focus:ring-2"
                >
                  {Object.keys(imbaRoleProfiles).map((key) => (
                    <option key={key} value={key}>
                      {imbaRoleProfiles[key as ImbaRoleKey].label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgb(var(--text-3))]" />
              </div>
              <ImbaInfoTooltip
                label="Role selector · demo only"
                text="Demo control — switch roles to preview each leader's scoped view. In a live system your role, and what you can see or do, come from your authenticated identity and the organization's row- and action-level policies — not a selectable dropdown."
                placement="below"
                align="right"
              />
            </div>
            {isScenarioAware ? (
              <div className="hidden items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.03)] px-3 py-2 xl:flex">
                <CalendarDays className="h-3.5 w-3.5 text-[rgb(var(--text-3))]" />
                <span className="text-[11px] font-semibold text-[rgb(var(--text))]">Rolling 12 + 13 weeks</span>
                <ImbaInfoTooltip
                  label="Forecast horizon"
                  text="The operating forecast looks across the next 12 months while the liquidity view examines weekly cash movement for the next 13 weeks."
                  align="right"
                  placement="below"
                />
              </div>
            ) : null}
            {isScenarioAware ? (
              <div className="flex items-center gap-1">
                <div className="relative">
                  <select
                    value={scenarioKey}
                    onChange={(event) =>
                      setScenarioKey(event.target.value as ImbaScenarioKey)
                    }
                    aria-label="Select financial scenario"
                    className="appearance-none rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--card-2))] py-2.5 pl-3 pr-9 text-[11px] font-bold text-[rgb(var(--text))] outline-none ring-[rgb(var(--sa)/0.40)] focus:ring-2"
                  >
                    {Object.entries(imbaScenarios).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[rgb(var(--text-3))]" />
                </div>
                <ImbaInfoTooltip
                  label="Scenario"
                  text="Changes planning assumptions across the cockpit without changing source-system data or approved budgets."
                  align="right"
                  placement="below"
                />
              </div>
            ) : null}
            <div
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--sa)/0.20)] bg-[rgb(var(--sa)/0.10)] text-[11px] font-black text-[rgb(var(--sa-soft))] sm:flex"
              title={imbaRoleProfiles[role].label}
            >
              {imbaRoleProfiles[role].initials}
            </div>
          </div>
        </header>

        <div className="relative z-20 shrink-0 border-b border-[rgb(var(--line)/0.07)] bg-[rgb(var(--panel)/85%)] px-4 py-3 sm:px-6 xl:px-8" data-tour="intelligence-context">
          <div className="mx-auto max-w-[1580px]">
            <ImbaIntelligenceBar
              condensed
              role={role}
              filters={filters}
              regions={regions}
              phases={phases}
              projects={projectNames}
              resultSummary={`${filteredProjects.length} of ${imbaProjects.length} projects · ${money(projectTotals.contract)} selected contract value`}
              savedViews={savedViews}
              activeAlertCount={
                alerts.filter(
                  (alert) => alert.enabled && alert.state !== "normal",
                ).length
              }
              onRoleChange={changeRole}
              onFilterChange={(patch) =>
                setFilters((current) => ({ ...current, ...patch }))
              }
              onSaveView={saveCurrentView}
              onApplySavedView={applySavedView}
              onOpenAlerts={() => setAlertsOpen(true)}
              onResetFilters={() => setFilters(initialImbaFilters)}
            />
          </div>
        </div>

        <main className={`workspace-shell workspace-shell--${activeWorkspaceSlug} workspace-mode--${activeWorkspaceMode} min-w-0 flex-1 overflow-y-auto`} data-tour="workspace">
          <div className="workspace-canvas mx-auto max-w-[1580px] space-y-5 px-4 py-5 sm:px-6 xl:px-8 xl:py-7">
            {isSectionLanding && !dismissedHeroes.has(activeSectionLabel) ? (
              <ImbaWorkspaceSignature
                section={activeSectionLabel}
                viewId={view}
                title={currentView.label}
                description={currentView.description}
                icon={currentView.icon}
                onClose={() =>
                  setDismissedHeroes((prev) => new Set(prev).add(activeSectionLabel))
                }
              />
            ) : null}
            {isScenarioAware ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#68b9aa]/15 bg-[#68b9aa]/[0.055] px-4 py-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--sa-soft))]" />
                  <div>
                    <p className="text-xs font-semibold text-[rgb(var(--text))]">
                      {scenario.label}: {scenario.description}
                    </p>
                    <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">
                      Scenario values are demo inputs. Public baselines below
                      are verified from the 2024 Form 990 and 2025 annual
                      report.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView("decisions")}
                  className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--line)/0.04)] px-3 py-2 text-[11px] font-bold text-[rgb(var(--text))] transition hover:bg-[rgb(var(--line)/0.08)]"
                >
                  {
                    imbaDecisions.filter(
                      (decision) => !decisionRecords[decision.id],
                    ).length
                  }{" "}
                  open decisions{" "}
                  <ArrowRight className="h-3.5 w-3.5 text-[rgb(var(--sa-soft))]" />
                </button>
              </div>
            ) : activeOsSection ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#68b9aa]/15 bg-[#68b9aa]/[0.055] px-4 py-3">
                <div className="flex items-start gap-3">
                  <Workflow className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--sa-soft))]" />
                  <div>
                    <p className="text-xs font-semibold text-[rgb(var(--text))]">
                      {activeOsSection.label} command center
                    </p>
                    <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">
                      Open the working views below to inspect records, make a
                      decision, change status, or export the demonstrated data.
                    </p>
                  </div>
                </div>
                <span className="rounded-xl border border-[rgb(var(--line)/0.1)] bg-[rgb(var(--line)/0.04)] px-3 py-2 text-[11px] font-bold text-[rgb(var(--text))]">
                  Working demo · source boundaries visible
                </span>
              </div>
            ) : null}

            {view === "brief" ? (
              <ImbaInsightStrip
                key="insights-brief"
                insights={intelligenceInsights}
                onSelect={(insight) => {
                  if (insight.project)
                    setFilters((current) => ({
                      ...current,
                      project: insight.project ?? "All projects",
                    }));
                  setCurrentView(insight.targetView);
                }}
              />
            ) : null}

            {view === "brief" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Deployable cash"
                    value={money(scenario.deployableCash)}
                    detail="After known constraints"
                    delta={
                      scenarioKey === "conservative"
                        ? "Tightening"
                        : "Controlled"
                    }
                    tone={
                      scenarioKey === "conservative" ? "warning" : "positive"
                    }
                    icon={CircleDollarSign}
                    onExplain={() =>
                      explainMetric(
                        "Deployable cash",
                        money(scenario.deployableCash),
                        "After known constraints",
                      )
                    }
                  />
                  <MetricCard
                    label="13-week runway"
                    value={`${scenario.runwayMonths.toFixed(1)} mo`}
                    detail={`Low point ${money(Math.min(...scenario.cashSeries) * 1_000_000)}`}
                    delta={
                      scenarioKey === "expansion" ? "+0.8 mo" : "Above floor"
                    }
                    tone="neutral"
                    icon={Gauge}
                    onExplain={() =>
                      explainMetric(
                        "13-week runway",
                        `${scenario.runwayMonths.toFixed(1)} mo`,
                        `Low point ${money(Math.min(...scenario.cashSeries) * 1_000_000)}`,
                      )
                    }
                  />
                  <MetricCard
                    label="Contracted backlog"
                    value={money(scenario.backlog)}
                    detail={`+ ${money(scenario.weightedPipeline)} weighted`}
                    delta={
                      scenarioKey === "conservative"
                        ? "2 starts slip"
                        : "Coverage 7.4 mo"
                    }
                    tone={
                      scenarioKey === "conservative" ? "warning" : "positive"
                    }
                    icon={BriefcaseBusiness}
                    onExplain={() =>
                      explainMetric(
                        "Contracted backlog",
                        money(scenario.backlog),
                        `+ ${money(scenario.weightedPipeline)} weighted`,
                      )
                    }
                  />
                  <MetricCard
                    label="Forecast result"
                    value={money(scenario.forecastResult)}
                    detail="Full-year operating view"
                    delta={
                      scenario.forecastResult >= 0
                        ? "Above plan"
                        : "Investment year"
                    }
                    tone={scenario.forecastResult >= 0 ? "positive" : "warning"}
                    icon={TrendingUp}
                    onExplain={() =>
                      explainMetric(
                        "Forecast result",
                        money(scenario.forecastResult),
                        "Full-year operating view",
                      )
                    }
                  />
                </div>

                <div className="grid gap-5 xl:grid-cols-12">
                  <Panel className="xl:col-span-7">
                    <PanelTitle
                      eyebrow="Liquidity"
                      title="13-week cash runway"
                      action={
                        <button
                          type="button"
                          onClick={() => setCurrentView("liquidity")}
                          className="text-[11px] font-bold text-[rgb(var(--sa-soft))] hover:text-[rgb(var(--pos))]"
                        >
                          Open liquidity →
                        </button>
                      }
                    />
                    <div className="px-3 pb-4 pt-1 sm:px-5">
                      <div className="flex items-end justify-between gap-4 px-2 pt-3">
                        <div>
                          <p className="font-mono text-2xl font-semibold tracking-tight text-[rgb(var(--text))]">
                            {money(scenario.yearEndCash)}
                          </p>
                          <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">
                            Illustrative year-end gross cash
                          </p>
                        </div>
                        <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.07] px-3 py-2 text-right">
                          <p className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">
                            Lowest point
                          </p>
                          <p className="mt-1 font-mono text-sm font-semibold text-[rgb(var(--text))]">
                            {money(
                              Math.min(...scenario.cashSeries) * 1_000_000,
                            )}
                          </p>
                        </div>
                      </div>
                      <CashRunwayChart series={scenario.cashSeries} />
                    </div>
                  </Panel>

                  <Panel className="xl:col-span-5">
                    <PanelTitle
                      eyebrow="Kent's desk"
                      title="What needs a decision"
                      action={
                        <span className="rounded-full bg-rose-400/10 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-200">
                          2 now
                        </span>
                      }
                    />
                    <div className="space-y-1 p-2">
                      {imbaDecisions.map((decision, index) => (
                        <button
                          key={decision.id}
                          type="button"
                          onClick={() => setCurrentView("decisions")}
                          className="group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-[rgb(var(--line)/0.04)]"
                        >
                          <div
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${index === 1 ? "bg-amber-300/10 text-amber-800 dark:text-amber-200" : "bg-rose-400/10 text-rose-700 dark:text-rose-200"}`}
                          >
                            {index === 1 ? (
                              <Clock3 className="h-3.5 w-3.5" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold leading-5 text-[rgb(var(--text))]">
                              {decision.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[rgb(var(--text-3))]">
                              {decision.financialEffect}
                            </p>
                          </div>
                          <ArrowRight className="mt-1 h-3.5 w-3.5 text-[rgb(var(--text-4))] transition group-hover:translate-x-0.5 group-hover:text-[rgb(var(--sa-soft))]" />
                        </button>
                      ))}
                    </div>
                  </Panel>
                </div>

                <Panel>
                  <PanelTitle
                    eyebrow="Trail Solutions"
                    title="Portfolio early warning"
                    action={
                      <button
                        type="button"
                        onClick={() => setCurrentView("portfolio")}
                        className="text-[11px] font-bold text-[rgb(var(--sa-soft))] hover:text-[rgb(var(--pos))]"
                      >
                        All engagements →
                      </button>
                    }
                  />
                  <PortfolioTable
                    compact
                    projects={filteredProjects}
                    onSelectProject={(project) =>
                      setFilters((current) => ({ ...current, project }))
                    }
                  />
                </Panel>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {publicBaseline.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--panel))] px-4 py-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-4))]">
                          {item.label}
                        </p>
                        <FileText className="h-3.5 w-3.5 text-[rgb(var(--text-4))]" />
                      </div>
                      <p className="mt-2 font-mono text-lg font-semibold text-[rgb(var(--text))]">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            {view === "portfolio" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Contracted backlog"
                    value={money(scenario.backlog)}
                    detail="Signed work remaining"
                    delta="7.4 mo coverage"
                    tone="positive"
                    icon={BriefcaseBusiness}
                    onExplain={() =>
                      explainMetric(
                        "Contracted backlog",
                        money(scenario.backlog),
                        "Signed work remaining",
                      )
                    }
                  />
                  <MetricCard
                    label="Weighted pipeline"
                    value={money(scenario.weightedPipeline)}
                    detail="Probability adjusted"
                    delta="62% confidence"
                    tone="neutral"
                    icon={Layers3}
                    onExplain={() =>
                      explainMetric(
                        "Weighted pipeline",
                        money(scenario.weightedPipeline),
                        "Probability adjusted",
                      )
                    }
                  />
                  <MetricCard
                    label="Portfolio contribution"
                    value={`${projectTotals.contribution.toFixed(1)}%`}
                    detail={`${money(projectTotals.contract - projectTotals.forecastCost)} forecast`}
                    delta={
                      projectTotals.contribution >= 12
                        ? "Above 12% floor"
                        : "Below 12% floor"
                    }
                    tone={
                      projectTotals.contribution >= 12 ? "positive" : "warning"
                    }
                    icon={BarChart3}
                    onExplain={() =>
                      explainMetric(
                        "Portfolio contribution",
                        `${projectTotals.contribution.toFixed(1)}%`,
                        `${money(projectTotals.contract - projectTotals.forecastCost)} forecast`,
                      )
                    }
                  />
                  <MetricCard
                    label="At-risk value"
                    value={money(
                      filteredProjects
                        .filter((project) => project.status === "at-risk")
                        .reduce(
                          (sum, project) => sum + project.contractValue,
                          0,
                        ),
                    )}
                    detail={`${filteredProjects.filter((project) => project.status === "at-risk").length} engagement flagged`}
                    delta={
                      filteredProjects.some(
                        (project) => project.status === "at-risk",
                      )
                        ? "Action required"
                        : "Within guardrail"
                    }
                    tone={
                      filteredProjects.some(
                        (project) => project.status === "at-risk",
                      )
                        ? "warning"
                        : "positive"
                    }
                    icon={AlertTriangle}
                    onExplain={() =>
                      explainMetric(
                        "At-risk value",
                        money(
                          filteredProjects
                            .filter((project) => project.status === "at-risk")
                            .reduce(
                              (sum, project) => sum + project.contractValue,
                              0,
                            ),
                        ),
                        `${filteredProjects.filter((project) => project.status === "at-risk").length} engagement flagged`,
                      )
                    }
                  />
                </div>
                <Panel>
                  <PanelTitle
                    eyebrow="Estimate at completion"
                    title="Active engagement economics"
                    action={
                      <span className="text-[11px] text-[rgb(var(--text-3))]">
                        Labor · equipment · subcontractors · overhead
                      </span>
                    }
                  />
                  <PortfolioTable
                    projects={filteredProjects}
                    onSelectProject={(project) =>
                      setFilters((current) => ({ ...current, project }))
                    }
                  />
                </Panel>
                <div className="grid gap-5 lg:grid-cols-2">
                  <Panel>
                    <PanelTitle
                      eyebrow="Revenue visibility"
                      title="Backlog bridge"
                    />
                    <div className="space-y-4 p-5">
                      {[
                        {
                          label: "Signed backlog",
                          value: scenario.backlog,
                          width: 100,
                          tone: "bg-[rgb(var(--sa))]",
                        },
                        {
                          label: "90%+ likely",
                          value: scenario.weightedPipeline * 0.46,
                          width: 62,
                          tone: "bg-[#68b9aa]",
                        },
                        {
                          label: "50–89% likely",
                          value: scenario.weightedPipeline * 0.36,
                          width: 46,
                          tone: "bg-[#4f8f84]",
                        },
                        {
                          label: "Early stage",
                          value: scenario.weightedPipeline * 0.18,
                          width: 27,
                          tone: "bg-[#315f57]",
                        },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[rgb(var(--text-2))]">{row.label}</span>
                            <span className="font-mono font-semibold text-[rgb(var(--text))]">
                              {money(row.value)}
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgb(var(--line)/0.06)]">
                            <div
                              className={`h-full rounded-full ${row.tone}`}
                              style={{ width: `${row.width}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                  <Panel>
                    <PanelTitle
                      eyebrow="Control design"
                      title="What makes a project trustworthy"
                    />
                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      {[
                        "Approved budget + phase plan",
                        "Fully loaded labor rates",
                        "Committed cost visibility",
                        "Billing tied to delivery",
                        "Monthly estimate to complete",
                        "Named owner + next action",
                      ].map((control, index) => (
                        <div
                          key={control}
                          className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--line)/0.06)] bg-[rgb(var(--line)/0.025)] p-3"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--sa)/0.10)] font-mono text-[11px] font-bold text-[rgb(var(--pos))]">
                            0{index + 1}
                          </span>
                          <span className="text-xs font-medium text-[rgb(var(--text))]">
                            {control}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              </>
            ) : null}

            {view === "liquidity" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Gross cash"
                    value={money(3_220_000)}
                    detail="Illustrative bank balance"
                    delta="Starting point"
                    tone="neutral"
                    icon={CircleDollarSign}
                    onExplain={() =>
                      explainMetric(
                        "Gross cash",
                        money(3_220_000),
                        "Illustrative bank balance",
                      )
                    }
                  />
                  <MetricCard
                    label="Known constraints"
                    value={money(1_480_000)}
                    detail="Not freely deployable"
                    delta="46% of gross"
                    tone="warning"
                    icon={ShieldCheck}
                    onExplain={() =>
                      explainMetric(
                        "Known constraints",
                        money(1_480_000),
                        "Not freely deployable",
                      )
                    }
                  />
                  <MetricCard
                    label="Deployable cash"
                    value={money(scenario.deployableCash)}
                    detail="After constraints"
                    delta={`${scenario.runwayMonths.toFixed(1)} mo runway`}
                    tone="positive"
                    icon={Gauge}
                    onExplain={() =>
                      explainMetric(
                        "Deployable cash",
                        money(scenario.deployableCash),
                        "After constraints",
                      )
                    }
                  />
                  <MetricCard
                    label="Receivables >45d"
                    value={money(286_000)}
                    detail="Cash conversion focus"
                    delta="$210K actionable"
                    tone="warning"
                    icon={Clock3}
                    onExplain={() =>
                      explainMetric(
                        "Receivables >45d",
                        money(286_000),
                        "Cash conversion focus",
                      )
                    }
                  />
                </div>
                <div className="grid gap-5 xl:grid-cols-12">
                  <Panel className="xl:col-span-7">
                    <PanelTitle
                      eyebrow="Cash timing"
                      title="13-week operating runway"
                    />
                    <div className="px-4 pb-5 pt-3">
                      <CashRunwayChart series={scenario.cashSeries} />
                    </div>
                  </Panel>
                  <Panel className="xl:col-span-5">
                    <PanelTitle
                      eyebrow="Deployability"
                      title="Gross cash is not available cash"
                    />
                    <div className="space-y-3 p-5">
                      {liquidityConstraints.map((item) => {
                        const width = (Math.abs(item.value) / 3_220_000) * 100;
                        return (
                          <div key={item.label}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[rgb(var(--text-2))]">
                                {item.label}
                              </span>
                              <span
                                className={`font-mono font-semibold ${item.value < 0 ? "text-rose-700 dark:text-rose-200" : "text-[rgb(var(--text))]"}`}
                              >
                                {item.value < 0 ? "−" : ""}
                                {money(Math.abs(item.value))}
                              </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgb(var(--line)/0.06)]">
                              <div
                                className={`h-full rounded-full ${item.value < 0 ? "bg-rose-300/70" : "bg-[#68b9aa]"}`}
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[rgb(var(--sa)/0.20)] bg-[rgb(var(--sa))]/[0.07] p-4">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--pos))]">
                            Deployable
                          </p>
                          <p className="mt-1 text-xs text-[rgb(var(--text-2))]">
                            Base scenario
                          </p>
                        </div>
                        <p className="font-mono text-2xl font-semibold text-[rgb(var(--pos))]">
                          {money(scenario.deployableCash)}
                        </p>
                      </div>
                    </div>
                  </Panel>
                </div>
                <Panel>
                  <PanelTitle
                    eyebrow="Cash conversion"
                    title="Working-capital actions"
                  />
                  <div className="grid gap-3 p-5 md:grid-cols-3">
                    {[
                      {
                        title: "Progress billing reset",
                        value: "+$210K",
                        text: "Move three engagements to monthly progress billing.",
                        icon: ArrowUpRight,
                      },
                      {
                        title: "Chapter settlement",
                        value: "−$318K",
                        text: "Ring-fence chapter obligations from deployable cash.",
                        icon: Building2,
                      },
                      {
                        title: "Equipment stage gate",
                        value: "+$185K",
                        text: "Defer the uncontracted portion of the next tranche.",
                        icon: ArrowDownRight,
                      },
                    ].map((action) => {
                      const Icon = action.icon;
                      return (
                        <div
                          key={action.title}
                          className="rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <Icon className="h-4 w-4 text-[rgb(var(--sa-soft))]" />
                            <span className="font-mono text-sm font-semibold text-[rgb(var(--text))]">
                              {action.value}
                            </span>
                          </div>
                          <h3 className="mt-4 text-sm font-semibold text-[rgb(var(--text))]">
                            {action.title}
                          </h3>
                          <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-3))]">
                            {action.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </>
            ) : null}

            {view === "capacity" ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Core team"
                    value="30 FTE"
                    detail="Illustrative ongoing team"
                    delta="+ seasonal crews"
                    tone="neutral"
                    icon={Users}
                    onExplain={() =>
                      explainMetric(
                        "Core team",
                        "30 FTE",
                        "Illustrative ongoing team",
                      )
                    }
                  />
                  <MetricCard
                    label="Base utilization"
                    value="84%"
                    detail="Weighted delivery team"
                    delta="Balanced"
                    tone="positive"
                    icon={Gauge}
                    onExplain={() =>
                      explainMetric(
                        "Base utilization",
                        "84%",
                        "Weighted delivery team",
                      )
                    }
                  />
                  <MetricCard
                    label="Expansion need"
                    value="2.4 FTE"
                    detail="At converted pipeline"
                    delta="Stage-gated"
                    tone="warning"
                    icon={TrendingUp}
                    onExplain={() =>
                      explainMetric(
                        "Expansion need",
                        "2.4 FTE",
                        "At converted pipeline",
                      )
                    }
                  />
                  <MetricCard
                    label="Labor recovery"
                    value="88%"
                    detail="Billable + grant funded"
                    delta="Target 90%"
                    tone="warning"
                    icon={CircleDollarSign}
                    onExplain={() =>
                      explainMetric(
                        "Labor recovery",
                        "88%",
                        "Billable + grant funded",
                      )
                    }
                  />
                </div>
                <div className="grid gap-5 xl:grid-cols-12">
                  <Panel className="xl:col-span-8">
                    <PanelTitle
                      eyebrow="People against work"
                      title="Capacity by delivery discipline"
                      action={
                        <div className="flex gap-3 text-[11px] font-semibold text-[rgb(var(--text-3))]">
                          <span className="flex items-center gap-1.5">
                            <i className="h-2 w-2 rounded-full bg-[#68b9aa]" />
                            Base
                          </span>
                          <span className="flex items-center gap-1.5">
                            <i className="h-2 w-2 rounded-full bg-[rgb(var(--sa))]" />
                            Expansion
                          </span>
                        </div>
                      }
                    />
                    <div className="space-y-5 p-5">
                      {capacityRows.map((row) => (
                        <div
                          key={row.discipline}
                          className="grid items-center gap-3 sm:grid-cols-[150px_1fr_72px]"
                        >
                          <div>
                            <p className="text-xs font-semibold text-[rgb(var(--text))]">
                              {row.discipline}
                            </p>
                            <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">
                              Available {row.available}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2.5 overflow-hidden rounded-full bg-[rgb(var(--line)/0.06)]">
                              <div
                                className="h-full rounded-full bg-[#68b9aa]"
                                style={{ width: `${Math.min(row.base, 100)}%` }}
                              />
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-[rgb(var(--line)/0.06)]">
                              <div
                                className={`h-full rounded-full ${row.expansion > 100 ? "bg-rose-300" : "bg-[rgb(var(--sa))]"}`}
                                style={{
                                  width: `${Math.min(row.expansion, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-right font-mono text-xs">
                            <p className="text-[rgb(var(--info))]">{row.base}%</p>
                            <p
                              className={
                                row.expansion > 100
                                  ? "mt-1 text-rose-700 dark:text-rose-200"
                                  : "mt-1 text-[rgb(var(--pos))]"
                              }
                            >
                              {row.expansion}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                  <Panel className="xl:col-span-4">
                    <PanelTitle
                      eyebrow="Hiring guardrail"
                      title="Contract before commitment"
                    />
                    <div className="p-5">
                      <div className="rounded-2xl border border-[rgb(var(--sa)/0.18)] bg-[rgb(var(--sa))]/[0.06] p-4">
                        <p className="text-[11px] font-black uppercase tracking-widest text-[rgb(var(--pos))]">
                          Trigger
                        </p>
                        <p className="mt-2 font-mono text-2xl font-semibold text-[rgb(var(--text))]">
                          $750K
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-2))]">
                          Executed design backlog before opening a permanent
                          role.
                        </p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {[
                          "Create contractor bench",
                          "Confirm loaded labor rate",
                          "Validate 6-month backlog",
                          "Model downside cash impact",
                        ].map((item, index) => (
                          <div key={item} className="flex items-center gap-3">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${index < 2 ? "bg-[#68b9aa]/15 text-[rgb(var(--info))]" : "bg-[rgb(var(--line)/0.05)] text-[rgb(var(--text-4))]"}`}
                            >
                              {index < 2 ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                index + 1
                              )}
                            </span>
                            <span className="text-xs text-[rgb(var(--text-2))]">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Panel>
                </div>
                <Panel>
                  <PanelTitle
                    eyebrow="Allocation integrity"
                    title="From time entry to project economics"
                  />
                  <div className="grid gap-3 p-5 md:grid-cols-4">
                    {[
                      {
                        icon: Clock3,
                        title: "Time capture",
                        detail: "Project + phase at source",
                      },
                      {
                        icon: CircleDollarSign,
                        title: "Loaded rates",
                        detail: "Salary, benefits, PEO, overhead",
                      },
                      {
                        icon: Layers3,
                        title: "Shared resources",
                        detail: "Consistent allocation method",
                      },
                      {
                        icon: BarChart3,
                        title: "Estimate to complete",
                        detail: "Early warning every month",
                      },
                    ].map((step, index) => {
                      const Icon = step.icon;
                      return (
                        <div
                          key={step.title}
                          className="relative rounded-2xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.025)] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <Icon className="h-4 w-4 text-[rgb(var(--sa-soft))]" />
                            <span className="font-mono text-[11px] text-[rgb(var(--text-4))]">
                              0{index + 1}
                            </span>
                          </div>
                          <p className="mt-4 text-sm font-semibold text-[rgb(var(--text))]">
                            {step.title}
                          </p>
                          <p className="mt-1.5 text-[11px] leading-4 text-[rgb(var(--text-3))]">
                            {step.detail}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </>
            ) : null}

            {view === "decisions" ? (
              <>
                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.055] p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-200">
                      Decide now
                    </p>
                    <p className="mt-2 font-mono text-2xl font-semibold text-[rgb(var(--text))]">
                      2
                    </p>
                    <p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">
                      Cash or schedule exposed
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">
                      This month
                    </p>
                    <p className="mt-2 font-mono text-2xl font-semibold text-[rgb(var(--text))]">
                      1
                    </p>
                    <p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">
                      Capacity threshold approaching
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--sa)/0.15)] bg-[rgb(var(--sa))]/[0.05] p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-[rgb(var(--pos))]">
                      Potential protected cash
                    </p>
                    <p className="mt-2 font-mono text-2xl font-semibold text-[rgb(var(--text))]">
                      $395K
                    </p>
                    <p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">
                      If recommendations are adopted
                    </p>
                  </div>
                </div>
                <Panel>
                  <PanelTitle
                    eyebrow="Guardrail, not gatekeeper"
                    title="Executive decision queue"
                    action={
                      <span className="text-[11px] text-[rgb(var(--text-3))]">
                        Every decision retains rationale and owner
                      </span>
                    }
                  />
                  <div className="space-y-3 p-4 sm:p-5">
                    {imbaDecisions.map((decision) => (
                      <DecisionCard
                        key={decision.id}
                        decision={decision}
                        record={decisionRecords[decision.id]}
                        candidates={delegateCandidates(decision)}
                        onApprove={() => approveDecision(decision)}
                        onDelegate={(assignee, deadline) => delegateDecision(decision, assignee, deadline)}
                        onDefer={() => deferDecision(decision)}
                      />
                    ))}
                  </div>
                </Panel>
                <Panel>
                  <PanelTitle
                    eyebrow="Scenario compare"
                    title="What changes when assumptions move"
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left">
                      <thead>
                        <tr className="border-b border-[rgb(var(--line)/0.07)] text-[11px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-3))]">
                          <th className="px-5 py-3">Scenario</th>
                          <th className="px-3 py-3 text-right">Backlog</th>
                          <th className="px-3 py-3 text-right">
                            Deployable cash
                          </th>
                          <th className="px-3 py-3 text-right">Runway</th>
                          <th className="px-5 py-3 text-right">
                            Forecast result
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(imbaScenarios).map(([key, item]) => (
                          <tr
                            key={key}
                            className={`border-b border-[rgb(var(--line)/0.05)] last:border-0 ${key === scenarioKey ? "bg-[rgb(var(--sa))]/[0.045]" : ""}`}
                          >
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  setScenarioKey(key as ImbaScenarioKey)
                                }
                                className="flex items-center gap-2 text-xs font-semibold text-[rgb(var(--text))]"
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${key === scenarioKey ? "bg-[rgb(var(--sa))]" : "bg-[rgb(var(--card-2))]"}`}
                                />
                                {item.label}
                              </button>
                              <p className="mt-1 max-w-sm text-[11px] text-[rgb(var(--text-3))]">
                                {item.description}
                              </p>
                            </td>
                            <td className="px-3 py-4 text-right font-mono text-xs text-[rgb(var(--text))]">
                              {money(item.backlog)}
                            </td>
                            <td className="px-3 py-4 text-right font-mono text-xs text-[rgb(var(--text))]">
                              {money(item.deployableCash)}
                            </td>
                            <td className="px-3 py-4 text-right font-mono text-xs text-[rgb(var(--text))]">
                              {item.runwayMonths.toFixed(1)} mo
                            </td>
                            <td
                              className={`px-5 py-4 text-right font-mono text-xs font-semibold ${item.forecastResult >= 0 ? "text-[rgb(var(--pos))]" : "text-amber-800 dark:text-amber-200"}`}
                            >
                              {money(item.forecastResult)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </>
            ) : null}

            {view === "whatif" ? <ImbaWhatIfLab /> : null}

            {view === "roadmap" ? (
              <ImbaRoadmapView onNavigate={setCurrentView} />
            ) : null}

            {financeViews.includes(view as ImbaFinanceView) ? (
              <ImbaFinanceWorkspace
                view={view as ImbaFinanceView}
                onNavigate={setCurrentView}
                role={role}
                filters={filters}
              />
            ) : null}

            {operationsViews.includes(view as ImbaOperationsView) ? (
              <ImbaOperationsWorkspace
                view={view as ImbaOperationsView}
                onNavigate={setCurrentView}
              />
            ) : null}

            {missionViews.includes(view as ImbaMissionView) ? (
              <ImbaMissionWorkspace
                key={view}
                view={view as ImbaMissionView}
                onNavigate={setCurrentView}
                role={role}
              />
            ) : null}

            {peopleViews.includes(view as ImbaPeopleView) ? (
              <ImbaPeopleWorkspace
                view={view as ImbaPeopleView}
                onNavigate={setCurrentView}
                role={role}
              />
            ) : null}

            {integrationViews.includes(view as ImbaIntegrationView) ? (
              <ImbaIntegrationWorkspace
                view={view as ImbaIntegrationView}
                onNavigate={setCurrentView}
              />
            ) : null}

            {collaborationViews.includes(view as ImbaCollaborationView) ? (
              <ImbaCollaborationWorkspace
                view={view as ImbaCollaborationView}
                role={role}
                onNavigate={setCurrentView}
              />
            ) : null}

            {enterpriseViews.includes(view as ImbaEnterpriseView) ? (
              <ImbaEnterpriseWorkspace
                key={view}
                view={view as ImbaEnterpriseView}
                role={role}
              />
            ) : null}

            {activeOsSection && view !== "people" ? (
              <ImbaOsSectionView
                section={activeOsSection}
                onNavigate={setCurrentView}
              />
            ) : null}
          </div>
        </main>

        <footer className="hidden shrink-0 items-center justify-between border-t border-[rgb(var(--line)/0.07)] bg-[rgb(var(--panel))] px-8 py-2 text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--text-4))] sm:flex">
          <span>IMBA-OS pitch prototype · not connected to IMBA systems</span>
          <span className="flex items-center gap-2">
            <Compass className="h-3 w-3" /> Reliable numbers → practical choices
            → responsible growth
          </span>
        </footer>
      </div>
      <ImbaMetricDrawer
        selection={selectedMetric}
        onClose={() => setSelectedMetric(null)}
        onNavigate={setCurrentView}
      />
      {alertsOpen ? (
        <ImbaAlertsDrawer
          alerts={alerts}
          subscriptions={subscriptions}
          onClose={() => setAlertsOpen(false)}
          onToggleAlert={(id) =>
            setAlerts((current) =>
              current.map((alert) =>
                alert.id === id ? { ...alert, enabled: !alert.enabled } : alert,
              ),
            )
          }
          onThresholdChange={(id, threshold) =>
            setAlerts((current) =>
              current.map((alert) =>
                alert.id === id ? { ...alert, threshold } : alert,
              ),
            )
          }
          onToggleSubscription={(id) =>
            setSubscriptions((current) =>
              current.map((subscription) =>
                subscription.id === id
                  ? { ...subscription, enabled: !subscription.enabled }
                  : subscription,
              ),
            )
          }
        />
      ) : null}
    </div>
  );
}
