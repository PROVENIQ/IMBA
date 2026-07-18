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
  Mountain,
  Network,
  Presentation,
  Route,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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
import {
  imbaFirstYearRoadmap,
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
import type { ImbaCollaborationView } from "@/lib/imba-collaboration-data";
import { useImbaOsState } from "@/components/imba/ImbaOsState";
import { ImbaInfoTooltip } from "@/components/imba/ImbaInfoTooltip";
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
    color: "border-blue-400/30 text-blue-200",
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
    color: "border-emerald-400/30 text-emerald-200",
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
        label: "Company snapshot",
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
        id: "finance-ap-ar",
        label: "Accounts receivable",
        description: "Collections + aging",
        icon: CircleDollarSign,
      },
      {
        id: "finance-transactions",
        label: "Bills + invoices",
        description: "Controlled transaction entry",
        icon: BookOpen,
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
    color: "border-cyan-400/30 text-cyan-200",
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
    color: "border-amber-300/30 text-amber-100",
    active: "bg-amber-300/10",
    items: [
      {
        id: "development",
        label: "Development engine",
        description: "Membership + philanthropy",
        icon: HeartHandshake,
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
        id: "development-campaigns",
        label: "Campaigns + membership",
        description: "Commitments + cash + impact",
        icon: Presentation,
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
        id: "development-partnerships",
        label: "Corporate partnerships",
        description: "Sponsors + fulfillment",
        icon: HeartHandshake,
      },
    ],
  },
  {
    label: "Platform",
    color: "border-violet-400/30 text-violet-200",
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
    color: "border-rose-400/30 text-rose-200",
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
    color: "border-indigo-400/30 text-indigo-200",
    active: "bg-indigo-400/10",
    items: [
      {
        id: "collaboration",
        label: "Collaboration overview",
        description: "Context + conversation + knowledge",
        icon: Mail,
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
    label: "System",
    color: "border-slate-400/30 text-slate-200",
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
  {
    label: "Management",
    color: "border-lime-300/30 text-lime-100",
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
        label: "First-year roadmap",
        description: "Day 1 through Year 1",
        icon: ListChecks,
      },
    ],
  },
];

const allNavItems = imbaNavSections.flatMap((section) => section.items);

function navSectionsForRole(role: ImbaRoleKey): ImbaNavSection[] {
  const profile = imbaRoleProfiles[role];
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
    .filter((section) => section.items.length > 0);
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
  "programs-education",
  "assessments-designations",
  "advocacy-policy",
  "trail-assets",
  "impact-research",
];
const peopleViews: ImbaPeopleView[] = [
  "people",
  "people-directory",
  "people-payroll",
  "people-hiring",
  "people-onboarding",
  "people-compliance",
  "people-documents",
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
  "communications-inbox",
  "communications-templates",
];
const enterpriseViews: ImbaEnterpriseView[] = [
  "development-crm",
  "development-grant-pipeline",
  "development-campaigns",
  "development-trail-solutions",
  "development-marketing",
  "development-partnerships",
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
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  if (status === "watch")
    return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  return "border-rose-400/25 bg-rose-400/10 text-rose-200";
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
      className={`rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90 shadow-[0_22px_80px_rgba(0,0,0,0.22)] ${className}`}
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
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a4b8b1]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-white">
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
      ? "text-[#b7e35b] bg-[#b7e35b]/10 border-[#b7e35b]/20"
      : tone === "warning"
        ? "text-amber-200 bg-amber-300/10 border-amber-300/20"
        : "text-[#9fd6cc] bg-[#68b9aa]/10 border-[#68b9aa]/20";

  return (
    <div className="group rounded-[20px] border border-white/[0.08] bg-[#142321] p-4 transition hover:-translate-y-0.5 hover:border-white/[0.16]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8ca19a]">
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
          <span className="font-mono text-[28px] font-semibold leading-none tracking-[-0.05em] text-white">
            {value}
          </span>
          <span className="inline-flex items-center gap-1 pb-0.5 text-[8px] font-black uppercase tracking-wider text-[#7f9a91] transition group-hover:text-[#dff7a8]">
            Explain <ArrowRight className="h-3 w-3" />
          </span>
        </button>
      ) : (
        <p className="mt-4 font-mono text-[28px] font-semibold leading-none tracking-[-0.05em] text-white">
          {value}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="text-[#94aaa3]">{detail}</span>
        <span
          className={
            tone === "warning"
              ? "font-semibold text-amber-200"
              : "font-semibold text-[#b7e35b]"
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
      <div className="absolute left-5 top-3 text-[10px] font-medium text-[#6f8981]">
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
            <stop offset="0%" stopColor="#b7e35b" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#b7e35b" stopOpacity="0" />
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
          stroke="#b7e35b"
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
      <div className="flex justify-between px-5 text-[10px] font-semibold uppercase tracking-wider text-[#6f8981]">
        <span>Week 1</span>
        <span>13-week low</span>
        <span>Week 13</span>
      </div>
    </div>
  );
}

function DecisionCard({
  decision,
  status,
  onSetStatus,
}: {
  decision: ImbaDecision;
  status?: DecisionStatus;
  onSetStatus: (status: DecisionStatus) => void;
}) {
  const urgencyClass =
    decision.urgency === "Now"
      ? "bg-rose-400/10 text-rose-200 border-rose-400/20"
      : "bg-amber-300/10 text-amber-100 border-amber-300/20";

  return (
    <article className="rounded-[18px] border border-white/[0.08] bg-[#152321] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${urgencyClass}`}
            >
              {decision.urgency}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6f8981]">
              Due {decision.due}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold text-white">
            {decision.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#a6b9b3]">
            {decision.context}
          </p>
        </div>
        {status ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b7e35b]/25 bg-[#b7e35b]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#d9f59c]">
            <Check className="h-3.5 w-3.5" /> {status}
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl border border-white/[0.06] bg-black/10 p-3 md:grid-cols-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#718a82]">
            Finance recommendation
          </p>
          <p className="mt-1.5 text-xs leading-5 text-[#d3dfdb]">
            {decision.recommendation}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#718a82]">
            Expected effect
          </p>
          <p className="mt-1.5 text-xs leading-5 text-[#d9f59c]">
            {decision.financialEffect}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] font-semibold text-[#82978f]">
          Owner · {decision.owner}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSetStatus("approved")}
            className="rounded-xl bg-[#b7e35b] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#102016] transition hover:bg-[#c9ef79]"
          >
            Approve path
          </button>
          <button
            type="button"
            onClick={() => onSetStatus("delegated")}
            className="rounded-xl border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white transition hover:bg-white/[0.08]"
          >
            Delegate
          </button>
          <button
            type="button"
            onClick={() => onSetStatus("deferred")}
            className="rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#93a7a0] transition hover:text-white"
          >
            Defer
          </button>
        </div>
      </div>
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
          <tr className="border-b border-white/[0.07] text-[9px] font-black uppercase tracking-[0.18em] text-[#6f8981]">
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
              className="border-b border-white/[0.055] last:border-0 hover:bg-white/[0.025]"
            >
              <td className="px-5 py-3.5">
                {onSelectProject ? (
                  <button
                    type="button"
                    onClick={() => onSelectProject(project.name)}
                    className="text-xs font-semibold text-white hover:text-[#dff7a8]"
                  >
                    {project.name}
                  </button>
                ) : (
                  <p className="text-xs font-semibold text-white">
                    {project.name}
                  </p>
                )}
                <p className="mt-1 text-[10px] text-[#738a82]">
                  {project.region} · {project.phase}
                </p>
              </td>
              <td className="px-3 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-[#68b9aa]"
                      style={{ width: `${project.completion}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-[#9fb2ac]">
                    {project.completion}%
                  </span>
                </div>
              </td>
              <td className="px-3 py-3.5 text-right font-mono text-xs text-[#d8e2df]">
                {money(project.contractValue)}
              </td>
              <td className="px-3 py-3.5 text-right font-mono text-xs text-[#a4b8b1]">
                {money(project.forecastCost)}
              </td>
              <td className="px-3 py-3.5 text-right font-mono text-xs font-semibold text-[#d9f59c]">
                {project.contribution.toFixed(1)}%
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider ${statusClasses(project.status)}`}
                >
                  {project.status}
                </span>
                {!compact ? (
                  <p className="mt-1.5 max-w-[240px] text-[10px] leading-4 text-[#879c95]">
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
  const linkedView: Partial<Record<ImbaOsSection["id"], ImbaOsView>> = {
    operations: "community-progress",
    money: "finance-snapshot",
    people: "people-directory",
    governance: "decisions",
    system: "roadmap",
  };

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
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#718981]">
                IMBA-OS · {section.subtitle}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                {section.label}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#a5b7b1]">
                {section.thesis}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-[#68b9aa]/15 bg-[#68b9aa]/[0.05] px-4 py-3 text-right">
            <p className="text-[9px] font-black uppercase tracking-wider text-[#6f8981]">
              Build posture
            </p>
            <p className="mt-1 text-xs font-semibold text-[#b9d7d0]">
              Integrate first · replace only with evidence
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {section.outcomes.map((outcome) => (
          <div
            key={outcome.label}
            className="rounded-2xl border border-white/[0.08] bg-[#142321] p-4"
          >
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#6f8981]">
              {outcome.label}
            </p>
            <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-white">
              {outcome.value}
            </p>
            <p className="mt-1 text-[10px] text-[#80958e]">{outcome.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <PanelTitle
            eyebrow="Operating modules"
            title={`What ${section.label} becomes inside IMBA-OS`}
            action={
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#607870]">
                Prototype architecture
              </span>
            }
          />
          <div className="grid gap-3 p-5 md:grid-cols-2">
            {section.modules.map((module) => {
              const stageClass =
                module.stage === "Demonstrated"
                  ? "border-[#b7e35b]/20 bg-[#b7e35b]/10 text-[#dff7a8]"
                  : module.stage === "Designed"
                    ? "border-[#68b9aa]/20 bg-[#68b9aa]/10 text-[#9fd6cc]"
                    : "border-white/[0.09] bg-white/[0.04] text-[#91a49e]";
              return (
                <article
                  key={module.name}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">
                      {module.name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-wider ${stageClass}`}
                    >
                      {module.stage}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#8da19a]">
                    {module.purpose}
                  </p>
                  <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[9px] font-semibold text-[#617971]">
                    <Database className="h-3.5 w-3.5" /> {module.source}
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel className="xl:col-span-4">
          <PanelTitle
            eyebrow="First operating moves"
            title="What I would validate before building"
          />
          <div className="space-y-3 p-5">
            {section.priorities.map((priority, index) => (
              <div
                key={priority}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b7e35b]/10 font-mono text-[9px] font-bold text-[#dff7a8]">
                  0{index + 1}
                </span>
                <p className="pt-1 text-xs leading-5 text-[#afc0bb]">
                  {priority}
                </p>
              </div>
            ))}
          </div>
          {linkedView[section.id] ? (
            <div className="border-t border-white/[0.07] p-4">
              <button
                type="button"
                onClick={() => onNavigate(linkedView[section.id]!)}
                className="flex w-full items-center justify-between rounded-xl bg-[#b7e35b] px-4 py-3 text-xs font-black text-[#102016] transition hover:bg-[#c9ef79]"
              >
                Open working prototype <ArrowRight className="h-4 w-4" />
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
                className="relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
              >
                <div className="flex items-center justify-between">
                  <StepIcon className="h-4 w-4 text-[#b7e35b]" />
                  <span className="font-mono text-[8px] text-[#526a63]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-xs font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-[10px] leading-4 text-[#7f958e]">
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
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#77a69b]">
              Proposal translated into product
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              The first-year IMBA-OS roadmap
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9fb1ab]">
              The software grows in the same order as the finance function:
              understand the current state, stabilize the close, make projects
              trustworthy, then add foresight and scale.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("whatif")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#b7e35b] px-4 py-3 text-xs font-black text-[#102016] hover:bg-[#c9ef79]"
          >
            <SlidersHorizontal className="h-4 w-4" /> Open Day-180 WHAT_IF Lab
          </button>
        </div>
      </section>
      <div className="relative space-y-4 before:absolute before:bottom-8 before:left-[27px] before:top-8 before:w-px before:bg-gradient-to-b before:from-[#b7e35b] before:via-[#68b9aa] before:to-transparent sm:before:left-[83px]">
        {imbaFirstYearRoadmap.map((step, index) => (
          <article
            key={step.milestone}
            className="relative grid gap-4 sm:grid-cols-[120px_1fr]"
          >
            <div className="relative z-10 flex items-start sm:justify-center">
              <span
                className={`inline-flex min-w-[72px] justify-center rounded-full border px-3 py-2 text-[9px] font-black uppercase tracking-wider ${index < 2 ? "border-[#b7e35b]/25 bg-[#b7e35b]/10 text-[#dff7a8]" : "border-[#68b9aa]/20 bg-[#68b9aa]/10 text-[#9fd6cc]"}`}
              >
                {step.milestone}
              </span>
            </div>
            <div className="rounded-[20px] border border-white/[0.08] bg-[#111b1a]/90 p-5">
              <h3 className="text-base font-semibold text-white">
                {step.title}
              </h3>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {step.deliverables.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 rounded-xl bg-white/[0.025] px-3 py-2.5"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b7e35b]" />
                    <span className="text-[11px] leading-5 text-[#99aca6]">
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
  const { connectors, syncJobs } = useImbaOsState();
  const [view, setView] = useState<ImbaOsView>("brief");
  const [scenarioKey, setScenarioKey] = useState<ImbaScenarioKey>("base");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({ Management: true });
  const [decisionStatuses, setDecisionStatuses] = useState<
    Record<string, DecisionStatus>
  >({});
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
  const scenario = imbaScenarios[scenarioKey];
  const currentView =
    allNavItems.find((item) => item.id === view) ?? allNavItems[0];
  const activeOsSection = imbaOsSections.find((section) => section.id === view);
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
    const billingLag = filteredProjects
      .filter((project) => project.completion - project.billed >= 7)
      .sort((a, b) => b.completion - b.billed - (a.completion - a.billed))[0];
    const lowestContribution = [...filteredProjects].sort(
      (a, b) => a.contribution - b.contribution,
    )[0];
    return [
      {
        id: "risk",
        title: atRisk.length
          ? `${atRisk.length} project outside guardrail`
          : "No at-risk project in scope",
        detail:
          atRisk[0]?.signal ??
          "The selected portfolio contains healthy and watch signals only.",
        tone: atRisk.length ? "risk" : "positive",
        project: atRisk[0]?.name,
        targetView: "project-command",
      },
      {
        id: "billing",
        title: billingLag
          ? "Delivery is ahead of billing"
          : "Billing is aligned",
        detail: billingLag
          ? `${billingLag.name} is ${billingLag.completion - billingLag.billed} points ahead of invoicing.`
          : "No selected project exceeds the modeled billing-lag threshold.",
        tone: billingLag ? "warning" : "positive",
        project: billingLag?.name,
        targetView: "finance-ap-ar",
      },
      {
        id: "contribution",
        title: lowestContribution
          ? "Lowest forecast contribution"
          : "No project selected",
        detail: lowestContribution
          ? `${lowestContribution.name} is forecast at ${lowestContribution.contribution.toFixed(1)}%; open the record to review remaining cost.`
          : "Clear filters to restore the project portfolio.",
        tone:
          lowestContribution && lowestContribution.contribution < 12
            ? "warning"
            : "positive",
        project: lowestContribution?.name,
        targetView: "project-command",
      },
    ];
  }, [filteredProjects]);

  const setCurrentView = (next: ImbaOsView) => {
    setView(next);
    setMobileNavOpen(false);
  };

  const changeRole = (nextRole: ImbaRoleKey) => {
    setRole(nextRole);
    const profile = imbaRoleProfiles[nextRole];
    const nextNavigation = navSectionsForRole(nextRole);
    const canAccessCurrentView = nextNavigation.some((section) =>
      section.items.some((item) => item.id === view),
    );
    if (!canAccessCurrentView) setCurrentView(profile.home);
    setExpandedSections((current) => ({
      ...current,
      [profile.sections.at(-1) ?? "Management"]: true,
    }));
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
    <div className="fixed inset-0 z-[100] flex overflow-hidden bg-[#07100f] font-sans text-[#e8efed]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_2%,rgba(105,185,170,0.12),transparent_30%),radial-gradient(circle_at_15%_100%,rgba(183,227,91,0.08),transparent_28%)]" />

      <aside
        className={`${mobileNavOpen ? "translate-x-0" : "-translate-x-full"} absolute inset-y-0 left-0 z-30 flex w-[252px] flex-col border-r border-white/[0.08] bg-[#0a1513] transition-transform duration-300 lg:relative lg:translate-x-0`}
      >
        <div className="flex h-[86px] items-center justify-between border-b border-white/[0.08] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#b7e35b] text-[#0b2118] shadow-[0_0_30px_rgba(183,227,91,0.16)]">
              <Mountain className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.23em] text-[#7f978f]">
                IMBA
              </p>
              <h1 className="text-sm font-semibold tracking-tight text-white">
                IMBA-OS
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-2 text-[#8ca19a] hover:bg-white/[0.06] lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#526a63]">
              Nonprofit operating system
            </p>
            <span className="rounded-full border border-[#68b9aa]/15 bg-[#68b9aa]/[0.06] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#7fa69d]">
              {visibleNavSections.length} sections
            </span>
          </div>
          <nav
            className="mt-3 space-y-2"
            aria-label="IMBA operating system views"
          >
            {visibleNavSections.map((section) => {
              const isExpanded = Boolean(expandedSections[section.label]);
              const hasActiveItem = section.items.some(
                (item) => item.id === view,
              );
              return (
                <div
                  key={section.label}
                  className={`overflow-hidden rounded-2xl border bg-white/[0.018] ${section.color}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSections((current) => ({
                        ...current,
                        [section.label]: !isExpanded,
                      }))
                    }
                    className={`flex w-full items-center justify-between px-3.5 py-3 text-left transition hover:bg-white/[0.035] ${hasActiveItem ? section.active : ""}`}
                    aria-expanded={isExpanded}
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.13em]">
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
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-white/[0.08] text-white" : "text-[#8ea29c] hover:bg-white/[0.04] hover:text-white"}`}
                          >
                            <Icon
                              className={`h-3.5 w-3.5 shrink-0 ${active ? "text-[#b7e35b]" : "text-current/60"}`}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[10px] font-semibold">
                                {item.label}
                              </span>
                              <span className="mt-0.5 block truncate text-[8px] text-[#667f77]">
                                {item.description}
                              </span>
                            </span>
                            {active ? (
                              <ArrowRight className="h-3 w-3 text-[#b7e35b]" />
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

        <div className="shrink-0 border-t border-white/[0.07] p-3">
          <div className="rounded-2xl border border-white/[0.08] bg-[#101e1b] p-3">
            <div className="flex items-center gap-2 text-[#b7e35b]">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[9px] font-black uppercase tracking-[0.18em]">
                Pitch-safe data
              </span>
            </div>
            <p className="mt-2 text-[9px] leading-4 text-[#859b94]">
              Public baseline + illustrative operating model. No claim of access
              to IMBA systems.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between px-2 text-[8px] font-semibold uppercase tracking-wider text-[#526a63]">
            <span>IMBA-OS Prototype</span>
            <span>Technology × Mission</span>
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

      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[86px] shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0a1513]/85 px-4 backdrop-blur-xl sm:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-xl border border-white/[0.08] p-2 text-[#9aafa8] hover:bg-white/[0.05] lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-semibold tracking-tight text-white">
                  {currentView.label}
                </p>
                <span className="hidden rounded-full border border-[#68b9aa]/20 bg-[#68b9aa]/10 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-[#9fd6cc] sm:inline-flex">
                  Illustrative
                </span>
              </div>
              <p className="mt-0.5 truncate text-[10px] font-medium text-[#718981]">
                What changed · why it matters · what is forecast · what Kent
                decides
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setCurrentView("integration-control")}
              className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 xl:flex"
              title="Open integration control plane"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              <span className="text-[9px] font-black uppercase text-emerald-100">
                QBO {connectors.qbo.mode}
              </span>
              <span className="h-3 w-px bg-white/[0.12]" />
              <span
                className={`h-2 w-2 rounded-full ${connectors.adp.syncHealth === "healthy" ? "bg-cyan-300" : "bg-amber-300"}`}
              />
              <span className="text-[9px] font-black uppercase text-cyan-100">
                ADP {connectors.adp.mode}
              </span>
              {syncJobs.some((job) => job.status === "error") ? (
                <span className="rounded-full bg-rose-300/10 px-2 py-1 text-[8px] font-black text-rose-100">
                  {syncJobs.filter((job) => job.status === "error").length}{" "}
                  exception
                </span>
              ) : null}
            </button>
            <div className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 md:flex">
              {isScenarioAware ? (
                <CalendarDays className="h-3.5 w-3.5 text-[#7fa39a]" />
              ) : (
                <BookOpen className="h-3.5 w-3.5 text-[#7fa39a]" />
              )}
              <span className="text-[10px] font-semibold text-[#b9c7c3]">
                {isScenarioAware
                  ? "Rolling 12 + 13 weeks"
                  : "Aligned to leadership proposal"}
              </span>
              {isScenarioAware ? (
                <ImbaInfoTooltip
                  label="Forecast horizon"
                  text="The operating forecast looks across the next 12 months while the liquidity view examines weekly cash movement for the next 13 weeks."
                  align="right"
                  placement="below"
                />
              ) : null}
            </div>
            {isScenarioAware ? (
              <div className="flex items-center gap-1">
                <div className="relative">
                  <select
                    value={scenarioKey}
                    onChange={(event) =>
                      setScenarioKey(event.target.value as ImbaScenarioKey)
                    }
                    aria-label="Select financial scenario"
                    className="appearance-none rounded-xl border border-white/[0.1] bg-[#14201e] py-2.5 pl-3 pr-9 text-[10px] font-bold text-white outline-none ring-[#b7e35b]/40 focus:ring-2"
                  >
                    {Object.entries(imbaScenarios).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#789087]" />
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
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-[#b7e35b]/20 bg-[#b7e35b]/10 text-[10px] font-black text-[#dff7a8] sm:flex"
              title={imbaRoleProfiles[role].label}
            >
              {imbaRoleProfiles[role].initials}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1580px] space-y-5 px-4 py-5 sm:px-6 xl:px-8 xl:py-7">
            {isScenarioAware ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#68b9aa]/15 bg-[#68b9aa]/[0.055] px-4 py-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#b7e35b]" />
                  <div>
                    <p className="text-xs font-semibold text-[#dbe8e4]">
                      {scenario.label}: {scenario.description}
                    </p>
                    <p className="mt-1 text-[10px] text-[#789087]">
                      Scenario values are demo inputs. Public baselines below
                      are verified from the 2024 Form 990 and 2025 annual
                      report.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView("decisions")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-white/[0.08]"
                >
                  {
                    imbaDecisions.filter(
                      (decision) => !decisionStatuses[decision.id],
                    ).length
                  }{" "}
                  open decisions{" "}
                  <ArrowRight className="h-3.5 w-3.5 text-[#b7e35b]" />
                </button>
              </div>
            ) : activeOsSection ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#68b9aa]/15 bg-[#68b9aa]/[0.055] px-4 py-3">
                <div className="flex items-start gap-3">
                  <Workflow className="mt-0.5 h-4 w-4 shrink-0 text-[#b7e35b]" />
                  <div>
                    <p className="text-xs font-semibold text-[#dbe8e4]">
                      {activeOsSection.label} is one layer of a shared nonprofit
                      operating system.
                    </p>
                    <p className="mt-1 text-[10px] text-[#789087]">
                      {activeOsSection.modules.length} tailored modules ·
                      existing systems preserved where they work · finance
                      dimensions shared across the organization.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView("roadmap")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-[10px] font-bold text-white hover:bg-white/[0.08]"
                >
                  See implementation sequence{" "}
                  <ArrowRight className="h-3.5 w-3.5 text-[#b7e35b]" />
                </button>
              </div>
            ) : null}

            <ImbaIntelligenceBar
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

            <ImbaInsightStrip
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
                          className="text-[10px] font-bold text-[#b7e35b] hover:text-[#d9f59c]"
                        >
                          Open liquidity →
                        </button>
                      }
                    />
                    <div className="px-3 pb-4 pt-1 sm:px-5">
                      <div className="flex items-end justify-between gap-4 px-2 pt-3">
                        <div>
                          <p className="font-mono text-2xl font-semibold tracking-tight text-white">
                            {money(scenario.yearEndCash)}
                          </p>
                          <p className="mt-1 text-[10px] text-[#789087]">
                            Illustrative year-end gross cash
                          </p>
                        </div>
                        <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.07] px-3 py-2 text-right">
                          <p className="text-[9px] font-black uppercase tracking-wider text-amber-200">
                            Lowest point
                          </p>
                          <p className="mt-1 font-mono text-sm font-semibold text-white">
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
                        <span className="rounded-full bg-rose-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-rose-200">
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
                          className="group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-white/[0.04]"
                        >
                          <div
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${index === 1 ? "bg-amber-300/10 text-amber-200" : "bg-rose-400/10 text-rose-200"}`}
                          >
                            {index === 1 ? (
                              <Clock3 className="h-3.5 w-3.5" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold leading-5 text-[#e4ece9]">
                              {decision.title}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#718981]">
                              {decision.financialEffect}
                            </p>
                          </div>
                          <ArrowRight className="mt-1 h-3.5 w-3.5 text-[#526a63] transition group-hover:translate-x-0.5 group-hover:text-[#b7e35b]" />
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
                        className="text-[10px] font-bold text-[#b7e35b] hover:text-[#d9f59c]"
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
                      className="rounded-2xl border border-white/[0.07] bg-[#0d1816] px-4 py-3.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#637a73]">
                          {item.label}
                        </p>
                        <FileText className="h-3.5 w-3.5 text-[#526a63]" />
                      </div>
                      <p className="mt-2 font-mono text-lg font-semibold text-[#dce7e3]">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[10px] text-[#758b84]">
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
                      <span className="text-[10px] text-[#728880]">
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
                          tone: "bg-[#b7e35b]",
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
                            <span className="text-[#a4b6b0]">{row.label}</span>
                            <span className="font-mono font-semibold text-white">
                              {money(row.value)}
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
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
                          className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b7e35b]/10 font-mono text-[10px] font-bold text-[#d7f49a]">
                            0{index + 1}
                          </span>
                          <span className="text-xs font-medium text-[#c8d5d1]">
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
                              <span className="text-[#9cafaa]">
                                {item.label}
                              </span>
                              <span
                                className={`font-mono font-semibold ${item.value < 0 ? "text-rose-200" : "text-white"}`}
                              >
                                {item.value < 0 ? "−" : ""}
                                {money(Math.abs(item.value))}
                              </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className={`h-full rounded-full ${item.value < 0 ? "bg-rose-300/70" : "bg-[#68b9aa]"}`}
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#b7e35b]/20 bg-[#b7e35b]/[0.07] p-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider text-[#9fbd65]">
                            Deployable
                          </p>
                          <p className="mt-1 text-xs text-[#a9b9b4]">
                            Base scenario
                          </p>
                        </div>
                        <p className="font-mono text-2xl font-semibold text-[#def6a7]">
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
                          className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <Icon className="h-4 w-4 text-[#b7e35b]" />
                            <span className="font-mono text-sm font-semibold text-white">
                              {action.value}
                            </span>
                          </div>
                          <h3 className="mt-4 text-sm font-semibold text-white">
                            {action.title}
                          </h3>
                          <p className="mt-2 text-xs leading-5 text-[#82978f]">
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
                        <div className="flex gap-3 text-[9px] font-semibold text-[#80958e]">
                          <span className="flex items-center gap-1.5">
                            <i className="h-2 w-2 rounded-full bg-[#68b9aa]" />
                            Base
                          </span>
                          <span className="flex items-center gap-1.5">
                            <i className="h-2 w-2 rounded-full bg-[#b7e35b]" />
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
                            <p className="text-xs font-semibold text-white">
                              {row.discipline}
                            </p>
                            <p className="mt-1 text-[9px] text-[#70877f]">
                              Available {row.available}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className="h-full rounded-full bg-[#68b9aa]"
                                style={{ width: `${Math.min(row.base, 100)}%` }}
                              />
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className={`h-full rounded-full ${row.expansion > 100 ? "bg-rose-300" : "bg-[#b7e35b]"}`}
                                style={{
                                  width: `${Math.min(row.expansion, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="text-right font-mono text-xs">
                            <p className="text-[#9fd6cc]">{row.base}%</p>
                            <p
                              className={
                                row.expansion > 100
                                  ? "mt-1 text-rose-200"
                                  : "mt-1 text-[#d9f59c]"
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
                      <div className="rounded-2xl border border-[#b7e35b]/18 bg-[#b7e35b]/[0.06] p-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#9cb85f]">
                          Trigger
                        </p>
                        <p className="mt-2 font-mono text-2xl font-semibold text-white">
                          $750K
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#8fa39d]">
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
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${index < 2 ? "bg-[#68b9aa]/15 text-[#9fd6cc]" : "bg-white/[0.05] text-[#677e77]"}`}
                            >
                              {index < 2 ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                index + 1
                              )}
                            </span>
                            <span className="text-xs text-[#a6b6b1]">
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
                          className="relative rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
                        >
                          <div className="flex items-center justify-between">
                            <Icon className="h-4 w-4 text-[#b7e35b]" />
                            <span className="font-mono text-[9px] text-[#526a63]">
                              0{index + 1}
                            </span>
                          </div>
                          <p className="mt-4 text-sm font-semibold text-white">
                            {step.title}
                          </p>
                          <p className="mt-1.5 text-[10px] leading-4 text-[#7f958e]">
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
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-200">
                      Decide now
                    </p>
                    <p className="mt-2 font-mono text-2xl font-semibold text-white">
                      2
                    </p>
                    <p className="mt-1 text-[10px] text-[#8fa39d]">
                      Cash or schedule exposed
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-200">
                      This month
                    </p>
                    <p className="mt-2 font-mono text-2xl font-semibold text-white">
                      1
                    </p>
                    <p className="mt-1 text-[10px] text-[#8fa39d]">
                      Capacity threshold approaching
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#b7e35b]/15 bg-[#b7e35b]/[0.05] p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#d1ef8b]">
                      Potential protected cash
                    </p>
                    <p className="mt-2 font-mono text-2xl font-semibold text-white">
                      $395K
                    </p>
                    <p className="mt-1 text-[10px] text-[#8fa39d]">
                      If recommendations are adopted
                    </p>
                  </div>
                </div>
                <Panel>
                  <PanelTitle
                    eyebrow="Guardrail, not gatekeeper"
                    title="Executive decision queue"
                    action={
                      <span className="text-[10px] text-[#6f8981]">
                        Every decision retains rationale and owner
                      </span>
                    }
                  />
                  <div className="space-y-3 p-4 sm:p-5">
                    {imbaDecisions.map((decision) => (
                      <DecisionCard
                        key={decision.id}
                        decision={decision}
                        status={decisionStatuses[decision.id]}
                        onSetStatus={(status) =>
                          setDecisionStatuses((current) => ({
                            ...current,
                            [decision.id]: status,
                          }))
                        }
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
                        <tr className="border-b border-white/[0.07] text-[9px] font-black uppercase tracking-[0.16em] text-[#6d847c]">
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
                            className={`border-b border-white/[0.05] last:border-0 ${key === scenarioKey ? "bg-[#b7e35b]/[0.045]" : ""}`}
                          >
                            <td className="px-5 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  setScenarioKey(key as ImbaScenarioKey)
                                }
                                className="flex items-center gap-2 text-xs font-semibold text-white"
                              >
                                <span
                                  className={`h-2 w-2 rounded-full ${key === scenarioKey ? "bg-[#b7e35b]" : "bg-[#466059]"}`}
                                />
                                {item.label}
                              </button>
                              <p className="mt-1 max-w-sm text-[10px] text-[#748a83]">
                                {item.description}
                              </p>
                            </td>
                            <td className="px-3 py-4 text-right font-mono text-xs text-[#cbd7d3]">
                              {money(item.backlog)}
                            </td>
                            <td className="px-3 py-4 text-right font-mono text-xs text-[#cbd7d3]">
                              {money(item.deployableCash)}
                            </td>
                            <td className="px-3 py-4 text-right font-mono text-xs text-[#cbd7d3]">
                              {item.runwayMonths.toFixed(1)} mo
                            </td>
                            <td
                              className={`px-5 py-4 text-right font-mono text-xs font-semibold ${item.forecastResult >= 0 ? "text-[#d9f59c]" : "text-amber-200"}`}
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
              />
            ) : null}

            {peopleViews.includes(view as ImbaPeopleView) ? (
              <ImbaPeopleWorkspace
                view={view as ImbaPeopleView}
                onNavigate={setCurrentView}
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

        <footer className="hidden shrink-0 items-center justify-between border-t border-white/[0.07] bg-[#091310] px-8 py-2 text-[9px] font-semibold uppercase tracking-wider text-[#4f665f] sm:flex">
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
