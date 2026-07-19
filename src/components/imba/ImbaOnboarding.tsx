"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  MousePointer2,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import type { ImbaOsView } from "@/lib/imba-os-data";
import { imbaRoleProfiles, type ImbaRoleKey } from "@/lib/imba-intelligence-data";

const TOUR_STORAGE_KEY = "imba-os-onboarding-complete-v1";

type TourStep = {
  eyebrow: string;
  title: string;
  body: string;
  target?: string;
  view?: ImbaOsView;
  actionLabel?: string;
};

type GuideLink = {
  label: string;
  description: string;
  view: ImbaOsView;
};

const roleGuides: Partial<Record<ImbaRoleKey, { summary: string; links: GuideLink[] }>> = {
  executive: {
    summary: "Start with the small set of enterprise signals, scenarios, and decisions that require the CEO's attention.",
    links: [
      { label: "Executive Brief", description: "See what changed, why it matters, and what needs a decision.", view: "brief" },
      { label: "WHAT_IF Lab", description: "Test an idea's fully loaded cost and cash effect before committing.", view: "whatif" },
      { label: "12-month Roadmap", description: "Review the proposed implementation sequence and milestones.", view: "roadmap" },
    ],
  },
  finance: {
    summary: "Run the close, reporting, liquidity, and controlled transaction workflows from the Money pillar.",
    links: [
      { label: "Organization Snapshot", description: "Begin with financial performance, deployable cash, and close status.", view: "finance-snapshot" },
      { label: "Reports", description: "Produce governed financial statements and supporting reports.", view: "finance-reports" },
      { label: "Accounts Payable", description: "Review the illustrative approval workflow and its controls.", view: "finance-payables" },
    ],
  },
  hr: {
    summary: "Coordinate workforce records, payroll handoffs, hiring, onboarding, and compliance.",
    links: [
      { label: "People Directory", description: "Open the role's workforce home and employee record view.", view: "people-directory" },
      { label: "People Reports", description: "Review headcount, capacity, and workforce signals.", view: "people-reports" },
    ],
  },
  "trail-solutions": {
    summary: "Manage project delivery, backlog, margin, field capacity, and operating risk.",
    links: [
      { label: "Trail Solutions", description: "Open the delivery portfolio and its operating signals.", view: "trail-solutions" },
      { label: "Project Board", description: "Move from portfolio signals into project-level work.", view: "project-board" },
    ],
  },
  development: {
    summary: "Connect pipeline, campaigns, partnerships, grants, and revenue handoffs.",
    links: [
      { label: "Development Engine", description: "Open the development portfolio and current momentum.", view: "development" },
      { label: "Campaigns", description: "Review campaign progress and next actions.", view: "development-campaigns" },
    ],
  },
  board: {
    summary: "Review the board-level performance, governance, evidence, and decisions package.",
    links: [
      { label: "Board Portal", description: "Open the board's governed information and packet view.", view: "governance-board" },
      { label: "Executive Brief", description: "Review the leadership narrative behind the key signals.", view: "brief" },
    ],
  },
};

function guideForRole(role: ImbaRoleKey) {
  const profile = imbaRoleProfiles[role];
  return roleGuides[role] ?? {
    summary: profile.purpose,
    links: [{
      label: `Open ${profile.label} home`,
      description: "Begin in the workspace configured for this role, then use the filtered navigation to explore.",
      view: profile.home,
    }],
  };
}

function tourForRole(role: ImbaRoleKey): TourStep[] {
  const profile = imbaRoleProfiles[role];
  const guide = guideForRole(role);
  const firstLink = guide.links[0];
  const secondLink = guide.links[1];

  return [
    {
      eyebrow: "Welcome to IMBA-OS",
      title: `${profile.label} guided tour`,
      body: `This short walkthrough is tailored to ${profile.label}. It shows how one shared operating system changes what each role sees and does.`,
    },
    {
      eyebrow: "One system · role-scoped",
      title: "Navigate by operating pillar",
      body: "The left navigation groups work into Mission, Money, People, Development, Platform, Governance, Collaboration, System, and Management. Your role only sees its relevant views.",
      target: '[data-tour="primary-navigation"]',
    },
    {
      eyebrow: "Role-based experience",
      title: "Preview another leader's workspace",
      body: "For this prototype, the role selector demonstrates how navigation and the home screen adapt. In production, identity and permissions would set this automatically.",
      target: '[data-tour="role-control"]',
    },
    {
      eyebrow: "Shared operating context",
      title: "Filter once, carry context everywhere",
      body: "The Intelligence Context bar keeps role, region, phase, signal, project, saved views, and alerts consistent as you move between functions.",
      target: '[data-tour="intelligence-context"]',
    },
    {
      eyebrow: "Try a real action",
      title: firstLink.label,
      body: firstLink.description,
      target: `[data-tour="nav-${firstLink.view}"]`,
      view: firstLink.view,
      actionLabel: `Open ${firstLink.label}`,
    },
    ...(secondLink ? [{
      eyebrow: "Continue the workflow",
      title: secondLink.label,
      body: secondLink.description,
      target: `[data-tour="nav-${secondLink.view}"]`,
      view: secondLink.view,
      actionLabel: `Open ${secondLink.label}`,
    } satisfies TourStep] : []),
    {
      eyebrow: "You're ready",
      title: "Explore with the guide close at hand",
      body: "Use Help at any time to replay this tour, open a role-specific quick-start guide, or review what is real versus illustrative in this prototype.",
      target: '[data-tour="workspace"]',
    },
  ];
}

export function ImbaOnboarding({ role, currentView, onNavigate }: {
  role: ImbaRoleKey;
  currentView: ImbaOsView;
  onNavigate: (view: ImbaOsView) => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const steps = useMemo(() => tourForRole(role), [role]);
  const guide = useMemo(() => guideForRole(role), [role]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!window.localStorage.getItem(TOUR_STORAGE_KEY)) {
        setStepIndex(0);
        setTourOpen(true);
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!tourOpen || !step.target) {
      setTargetRect(null);
      return;
    }
    const updateTarget = () => {
      const target = document.querySelector<HTMLElement>(step.target ?? "");
      if (!target) return setTargetRect(null);
      const rect = target.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
      setTargetRect(visible ? rect : null);
    };
    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [step.target, tourOpen, currentView]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (tourOpen) setTourOpen(false);
      else if (helpOpen) setHelpOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen, tourOpen]);

  const rememberCompletion = () => window.localStorage.setItem(
    TOUR_STORAGE_KEY,
    JSON.stringify({ completedAt: new Date().toISOString(), role }),
  );

  const closeTour = () => {
    rememberCompletion();
    setTourOpen(false);
  };

  const replayTour = () => {
    setHelpOpen(false);
    setStepIndex(0);
    setTourOpen(true);
  };

  const advanceTour = () => {
    if (step.view && currentView !== step.view) onNavigate(step.view);
    if (stepIndex === steps.length - 1) return closeTour();
    setStepIndex((current) => current + 1);
  };

  const cardPosition = (() => {
    if (!targetRect || typeof window === "undefined") {
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
    }
    const cardWidth = Math.min(390, window.innerWidth - 32);
    const fitsRight = targetRect.right + cardWidth + 28 < window.innerWidth;
    const left = fitsRight ? targetRect.right + 18 : Math.max(16, Math.min(targetRect.left, window.innerWidth - cardWidth - 16));
    const top = fitsRight
      ? Math.max(16, Math.min(targetRect.top, window.innerHeight - 390))
      : Math.max(16, Math.min(targetRect.bottom + 16, window.innerHeight - 390));
    return { left, top, transform: "none" };
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        aria-label="Open Help and guided tour"
        title="Help and guided tour"
        className="flex h-9 items-center justify-center gap-2 rounded-full border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.03)] px-2.5 text-[rgb(var(--text-2))] transition hover:bg-[rgb(var(--line)/0.07)] hover:text-[rgb(var(--text))]"
      >
        <CircleHelp className="h-4 w-4" />
        <span className="hidden text-[11px] font-bold xl:inline">Help</span>
      </button>

      {helpOpen ? (
        <div className="fixed inset-0 z-[90] flex justify-end bg-black/55 backdrop-blur-sm">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close Help" onClick={() => setHelpOpen(false)} />
          <aside role="dialog" aria-modal="true" aria-labelledby="imba-help-title" className="relative h-full w-full max-w-[480px] overflow-y-auto border-l border-white/10 bg-[rgb(var(--panel))] p-6 text-left shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[rgb(var(--sa-soft))]">Role-based user guide</p>
                <h2 id="imba-help-title" className="mt-2 text-2xl font-semibold text-[rgb(var(--text))]">Help for {imbaRoleProfiles[role].label}</h2>
              </div>
              <button type="button" onClick={() => setHelpOpen(false)} className="rounded-xl border border-[rgb(var(--line)/0.1)] p-2 text-[rgb(var(--text-3))] hover:bg-[rgb(var(--line)/0.05)] hover:text-[rgb(var(--text))]" aria-label="Close Help">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[rgb(var(--text-2))]">{guide.summary}</p>

            <button type="button" onClick={replayTour} className="mt-6 flex w-full items-center justify-between rounded-2xl border border-[rgb(var(--sa)/0.28)] bg-[rgb(var(--sa)/0.10)] px-4 py-4 text-left transition hover:bg-[rgb(var(--sa)/0.16)]">
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--sa)/0.18)] text-[rgb(var(--sa-soft))]"><RotateCcw className="h-4 w-4" /></span>
                <span>
                  <span className="block text-sm font-bold text-[rgb(var(--text))]">Replay guided tour</span>
                  <span className="mt-0.5 block text-[11px] text-[rgb(var(--text-3))]">About two minutes · skippable</span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-[rgb(var(--sa-soft))]" />
            </button>

            <div className="mt-8">
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[rgb(var(--sa-soft))]" /><h3 className="text-sm font-bold text-[rgb(var(--text))]">Start here</h3></div>
              <div className="mt-3 space-y-2">
                {guide.links.map((link, index) => (
                  <button key={link.view} type="button" onClick={() => { onNavigate(link.view); setHelpOpen(false); }} className="group flex w-full items-start gap-3 rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.025)] p-4 text-left transition hover:border-[rgb(var(--sa)/0.2)] hover:bg-[rgb(var(--line)/0.05)]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--line)/0.06)] text-[11px] font-black text-[rgb(var(--text-2))]">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[rgb(var(--text))]">{link.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[rgb(var(--text-3))]">{link.description}</span>
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[rgb(var(--text-4))] transition group-hover:translate-x-0.5 group-hover:text-[rgb(var(--sa-soft))]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
              <div className="flex items-center gap-2 text-amber-200"><ShieldCheck className="h-4 w-4" /><p className="text-xs font-bold">Prototype boundary</p></div>
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-3))]">Public Form 990 and annual-report history is identified where used. Current projects, bills, people, workflows, and forecasts are illustrative until IMBA&apos;s systems are connected. No live credentials, records, or payments are used here.</p>
            </div>
          </aside>
        </div>
      ) : null}

      {tourOpen ? (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
          {targetRect ? (
            <div className="pointer-events-none fixed rounded-2xl border-2 border-[rgb(var(--sa-soft))] shadow-[0_0_0_6px_rgb(var(--sa)/0.18),0_18px_60px_rgba(0,0,0,0.45)]" style={{ left: targetRect.left - 6, top: targetRect.top - 6, width: targetRect.width + 12, height: targetRect.height + 12 }} />
          ) : null}
          <section role="dialog" aria-modal="true" aria-label="IMBA-OS guided tour" className="fixed w-[min(390px,calc(100vw-32px))] rounded-3xl border border-white/10 bg-[rgb(var(--panel))] p-5 text-left shadow-2xl sm:p-6" style={cardPosition}>
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full bg-[rgb(var(--sa)/0.12)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--sa-soft))]">Step {stepIndex + 1} of {steps.length}</span>
              <button type="button" onClick={closeTour} className="text-[11px] font-bold text-[rgb(var(--text-3))] hover:text-[rgb(var(--text))]">Skip tour</button>
            </div>
            <div className="mt-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--sa)/0.12)] text-[rgb(var(--sa-soft))]">
              {stepIndex === steps.length - 1 ? <CheckCircle2 className="h-5 w-5" /> : <MousePointer2 className="h-5 w-5" />}
            </div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[rgb(var(--text-4))]">{step.eyebrow}</p>
            <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--text))]">{step.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-2))]">{step.body}</p>
            <div className="mt-6 flex items-center justify-between gap-3">
              <button type="button" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={stepIndex === 0} className="rounded-xl px-3 py-2 text-xs font-bold text-[rgb(var(--text-3))] disabled:invisible">Back</button>
              <button type="button" onClick={advanceTour} className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--sa))] px-4 py-2.5 text-xs font-black text-white transition hover:brightness-110">
                {stepIndex === steps.length - 1 ? "Finish" : step.actionLabel ?? "Next"}<ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
