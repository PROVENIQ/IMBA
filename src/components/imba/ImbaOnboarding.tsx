"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  CircleHelp,
  Database,
  Gauge,
  Layers3,
  MousePointer2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { ImbaOsView } from "@/lib/imba-os-data";
import { imbaRoleProfiles, type ImbaRoleKey } from "@/lib/imba-intelligence-data";
import {
  dataStatusGuide,
  metricGuides,
  roleGuides,
  type MetricGuide,
} from "@/lib/imba-user-guide-data";

const TOUR_STORAGE_KEY = "imba-os-onboarding-complete-v1";

const systemSteps = [
  { label: "Connect once", detail: "Authorize QuickBooks, ADP/PEO, CRM, project, bank, and collaboration systems once through governed connectors." },
  { label: "Sync into IMBA-OS", detail: "Scheduled and on-demand syncs bring approved fields into the operating layer. Users do not log into each source for every question." },
  { label: "Normalize and calculate", detail: "IMBA-OS applies canonical project, grant, customer, role, account, and period definitions before calculating management measures." },
  { label: "Show provenance", detail: "Every consequential number should expose its definition, formula, source systems, refresh time, and whether it is public, synced, derived, or illustrative." },
  { label: "Act with control", detail: "Decisions and approvals stay visible in IMBA-OS; controlled transactions execute in the authoritative system such as QuickBooks or Bill.com." },
] as const;

// Provenance badge styling, matched to the Prov lanes used across the Money
// workspace so the guide's status labels read the same as the live figures.
const STATUS_BADGE: Record<MetricGuide["status"], string> = {
  "Public / filed": "bg-[rgb(var(--info)/0.12)] text-[rgb(var(--info))]",
  "Synced in production": "bg-[rgb(var(--sa)/0.12)] text-[rgb(var(--sa-soft))]",
  Derived: "bg-[rgb(var(--line)/0.08)] text-[rgb(var(--text-2))]",
  Illustrative: "bg-amber-300/10 text-amber-800 dark:text-amber-200",
};

const GUIDE_TABS: Array<{ key: GuideTab; label: string; icon: typeof Sparkles }> = [
  { key: "role", label: "Your role", icon: Sparkles },
  { key: "numbers", label: "The numbers", icon: Calculator },
  { key: "system", label: "How it works", icon: Layers3 },
];

// An action step hands control back to the user: the scrim opens a hole over the
// real control, and the tour only advances once they actually operate it. A
// passive step keeps the old click-Next behaviour for pure explanation.
type TourAction =
  | { kind: "navigate"; view: ImbaOsView }
  | { kind: "theme" }
  | { kind: "help" };

type TourStep = {
  eyebrow: string;
  title: string;
  body: string;
  target?: string;
  action?: TourAction;
  actionHint?: string;
};

function tourForRole(role: ImbaRoleKey): TourStep[] {
  const profile = imbaRoleProfiles[role];
  const guide = roleGuides[role];
  // An action step must require an actual navigation, so drop the role's home
  // view — the user is already sitting on it and the step would complete the
  // instant it opened, giving them nothing to do.
  const candidates = guide.links.filter((link) => link.view !== profile.home);
  const [firstLink, secondLink] = candidates.length >= 2 ? candidates : guide.links;

  return [
    {
      eyebrow: "Welcome to IMBA-OS",
      title: `${profile.label} guided tour`,
      body: `This short walkthrough is tailored to ${profile.label}. It shows how one shared operating system changes what each role sees and does. You'll drive — the tour will ask you to click things yourself.`,
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
      eyebrow: "Your turn",
      title: firstLink.label,
      body: firstLink.description,
      target: `[data-tour="nav-${firstLink.view}"]`,
      action: { kind: "navigate", view: firstLink.view },
      actionHint: `Click "${firstLink.label}"`,
    },
    ...(secondLink ? [{
      eyebrow: "Keep going",
      title: secondLink.label,
      body: secondLink.description,
      target: `[data-tour="nav-${secondLink.view}"]`,
      action: { kind: "navigate", view: secondLink.view } as TourAction,
      actionHint: `Click "${secondLink.label}"`,
    } satisfies TourStep] : []),
    {
      eyebrow: "Make it yours",
      title: "Switch between dark and light",
      body: "IMBA-OS opens in dark for long working sessions. Light mode suits a projector, a printout, or a board room. Try the toggle — everything follows, except report pages, which always stay on white paper.",
      target: '[data-tour="theme-toggle"]',
      action: { kind: "theme" },
      actionHint: "Click the theme toggle",
    },
    {
      eyebrow: "You're ready",
      title: "Open Help whenever you need it",
      body: "Help holds a quick-start for your role, where each number comes from and how it is calculated, and what is real versus illustrative in this prototype. Open it now to finish the tour.",
      target: '[data-tour="help-button"]',
      action: { kind: "help" },
      actionHint: "Click Help to finish",
    },
  ];
}

type GuideTab = "role" | "numbers" | "system";

export function ImbaOnboarding({
  role,
  currentView,
  onNavigate,
  theme,
}: {
  role: ImbaRoleKey;
  currentView: ImbaOsView;
  onNavigate: (view: ImbaOsView) => void;
  theme: "light" | "dark";
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<GuideTab>("role");
  const [tourOpen, setTourOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  // Overlays must portal to <body>: this component renders inside the app
  // header, whose backdrop-blur creates a containing block that would trap
  // position:fixed children (the tour card drifted off-screen otherwise).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const steps = useMemo(() => tourForRole(role), [role]);
  const guide = roleGuides[role];
  const profile = imbaRoleProfiles[role];
  const relevantMetrics = useMemo(
    () => metricGuides.filter((metric) => metric.relevantSections.some((section) => profile.sections.includes(section))),
    [profile.sections],
  );
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

  // Track the target on every frame rather than only on resize/scroll. The
  // scrim cuts a hole over this rect for action steps, so a stale measurement
  // means the hole sits somewhere the control isn't and the click is swallowed.
  // Layout here shifts for reasons that fire no event (a nav group expanding,
  // the step card re-flowing), so polling is the only reliable option. State is
  // only written when the rect actually changes, so this does not re-render.
  useEffect(() => {
    if (!tourOpen || !step.target) {
      setTargetRect(null);
      return;
    }
    let frame = 0;
    let previous = "";
    const measure = () => {
      const target = document.querySelector<HTMLElement>(step.target ?? "");
      let next: DOMRect | null = null;
      if (target) {
        const rect = target.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
        if (visible) next = rect;
      }
      const key = next ? `${Math.round(next.left)},${Math.round(next.top)},${Math.round(next.width)},${Math.round(next.height)}` : "none";
      if (key !== previous) {
        previous = key;
        setTargetRect(next);
      }
      frame = window.requestAnimationFrame(measure);
    };
    frame = window.requestAnimationFrame(measure);
    return () => window.cancelAnimationFrame(frame);
  }, [step.target, tourOpen]);

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

  // The theme the user was on when this step opened, so a theme step can tell
  // that they flipped it (rather than comparing against a fixed value).
  const themeAtStepStart = useRef(theme);
  const viewAtStepStart = useRef(currentView);
  useEffect(() => {
    themeAtStepStart.current = theme;
    viewAtStepStart.current = currentView;
    // Intentionally keyed on the step only — re-snapshotting on every theme or
    // view change would make the "did it change?" test always false.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, tourOpen]);

  // Action steps advance when the user actually operates the real control.
  const stepAction = step.action;
  useEffect(() => {
    if (!tourOpen || !stepAction) return;
    // Each test requires a change since the step opened, so a step can never
    // complete itself the moment it appears.
    const satisfied =
      stepAction.kind === "navigate" ? currentView === stepAction.view && viewAtStepStart.current !== stepAction.view
      : stepAction.kind === "theme" ? theme !== themeAtStepStart.current
      : helpOpen;
    if (!satisfied) return;
    // Let the user see the result of their click land before moving on.
    const timer = window.setTimeout(() => {
      setStepIndex((current) => {
        if (current >= steps.length - 1) {
          rememberCompletion();
          setTourOpen(false);
          return current;
        }
        return current + 1;
      });
    }, 600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourOpen, stepAction, currentView, theme, helpOpen, steps.length]);

  const advanceTour = () => {
    if (stepIndex === steps.length - 1) return closeTour();
    setStepIndex((current) => current + 1);
  };

  const cardPosition = (() => {
    if (!targetRect || typeof window === "undefined") {
      return { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
    }
    const cardWidth = Math.min(390, window.innerWidth - 32);
    const cardHeight = Math.min(420, window.innerHeight - 32);
    const fitsRight = targetRect.right + cardWidth + 28 < window.innerWidth;
    // Whichever side is chosen, the card must stay fully inside the viewport —
    // header targets sit at the far right, so clamp both axes unconditionally.
    const rawLeft = fitsRight ? targetRect.right + 18 : targetRect.left;
    const left = Math.max(16, Math.min(rawLeft, window.innerWidth - cardWidth - 16));
    const rawTop = fitsRight ? targetRect.top : targetRect.bottom + 16;
    const top = Math.max(16, Math.min(rawTop, window.innerHeight - cardHeight - 16));
    return { left, top, transform: "none" };
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        aria-label="Open Help and guided tour"
        title="Help and guided tour"
        data-tour="help-button"
        className="flex h-9 items-center justify-center gap-2 rounded-full border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.03)] px-2.5 text-[rgb(var(--text-2))] transition hover:bg-[rgb(var(--line)/0.07)] hover:text-[rgb(var(--text))]"
      >
        <CircleHelp className="h-4 w-4" />
        <span className="hidden text-[11px] font-bold xl:inline">Help</span>
      </button>

      {/* The app shell is itself a fixed body-level container at z-[100], so
          portaled overlays must clear it: drawer 150, tour 160, tooltips 200. */}
      {mounted && helpOpen ? createPortal(
        <div className="fixed inset-0 z-[150] flex justify-end bg-black/55 backdrop-blur-sm">
          <button type="button" className="absolute inset-0 cursor-default" aria-label="Close Help" onClick={() => setHelpOpen(false)} />
          <aside role="dialog" aria-modal="true" aria-labelledby="imba-help-title" className="relative flex h-full w-full max-w-[500px] flex-col border-l border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel))] text-left shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[rgb(var(--line)/0.08)] p-6 pb-5 sm:px-8">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[rgb(var(--sa-soft))]">IMBA-OS user guide</p>
                <h2 id="imba-help-title" className="mt-2 text-2xl font-semibold text-[rgb(var(--text))]">Guide for {profile.label}</h2>
                <p className="mt-1 text-[11px] text-[rgb(var(--text-3))]">How the system works · where the numbers come from · what your role does with it</p>
              </div>
              <button type="button" onClick={() => setHelpOpen(false)} className="shrink-0 rounded-xl border border-[rgb(var(--line)/0.1)] p-2 text-[rgb(var(--text-3))] hover:bg-[rgb(var(--line)/0.05)] hover:text-[rgb(var(--text))]" aria-label="Close Help">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-1 border-b border-[rgb(var(--line)/0.08)] px-4 sm:px-6" role="tablist" aria-label="Guide sections">
              {GUIDE_TABS.map((tab) => {
                const TabIcon = tab.icon;
                const active = guideTab === tab.key;
                return (
                  <button key={tab.key} type="button" role="tab" aria-selected={active} onClick={() => setGuideTab(tab.key)} className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-bold transition ${active ? "border-[rgb(var(--sa))] text-[rgb(var(--text))]" : "border-transparent text-[rgb(var(--text-3))] hover:text-[rgb(var(--text-2))]"}`}>
                    <TabIcon className="h-3.5 w-3.5" />{tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:px-8">
              {guideTab === "role" ? (
                <div className="space-y-6">
                  <p className="text-sm leading-6 text-[rgb(var(--text-2))]">{guide.summary}</p>

                  <div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[rgb(var(--sa-soft))]" /><h3 className="text-sm font-bold text-[rgb(var(--text))]">What good looks like</h3></div>
                    <ul className="mt-3 space-y-2">
                      {guide.outcomes.map((outcome) => (
                        <li key={outcome} className="flex items-start gap-2 text-xs leading-5 text-[rgb(var(--text-2))]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[rgb(var(--sa))]" />{outcome}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2"><Gauge className="h-4 w-4 text-[rgb(var(--sa-soft))]" /><h3 className="text-sm font-bold text-[rgb(var(--text))]">Your cadence</h3></div>
                    <div className="mt-3 space-y-2">
                      {guide.cadence.map((item) => (
                        <div key={item.label} className="flex gap-3 rounded-xl border border-[rgb(var(--line)/0.07)] bg-[rgb(var(--line)/0.02)] p-3">
                          <span className="w-20 shrink-0 text-[11px] font-black uppercase tracking-wide text-[rgb(var(--sa-soft))]">{item.label}</span>
                          <span className="text-xs leading-5 text-[rgb(var(--text-2))]">{item.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-700 dark:text-amber-200" /><h3 className="text-sm font-bold text-[rgb(var(--text))]">Watch for</h3></div>
                    <ul className="mt-3 space-y-2">
                      {guide.watchFor.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-xs leading-5 text-[rgb(var(--text-2))]"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
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

                  <button type="button" onClick={replayTour} className="flex w-full items-center justify-between rounded-2xl border border-[rgb(var(--sa)/0.28)] bg-[rgb(var(--sa)/0.10)] px-4 py-4 text-left transition hover:bg-[rgb(var(--sa)/0.16)]">
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--sa)/0.18)] text-[rgb(var(--sa-soft))]"><RotateCcw className="h-4 w-4" /></span>
                      <span>
                        <span className="block text-sm font-bold text-[rgb(var(--text))]">Replay guided tour</span>
                        <span className="mt-0.5 block text-[11px] text-[rgb(var(--text-3))]">About two minutes · skippable</span>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-[rgb(var(--sa-soft))]" />
                  </button>
                </div>
              ) : null}

              {guideTab === "numbers" ? (
                <div className="space-y-6">
                  <p className="text-sm leading-6 text-[rgb(var(--text-2))]">Every consequential number in IMBA-OS carries its definition, formula, source systems, refresh timing, and a status showing how trustworthy it is today. These are the measures most relevant to {profile.label}.</p>

                  <div className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.02)] p-4">
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-[rgb(var(--text-3))]">What the status labels mean</h3>
                    <div className="mt-3 space-y-2">
                      {dataStatusGuide.map((item) => (
                        <div key={item.label} className="flex items-start gap-2.5">
                          <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[item.label]}`}>{item.label}</span>
                          <span className="text-[11px] leading-5 text-[rgb(var(--text-3))]">{item.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {relevantMetrics.map((metric) => (
                      <div key={metric.label} className="rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.02)] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-semibold text-[rgb(var(--text))]">{metric.label}</h3>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${STATUS_BADGE[metric.status]}`}>{metric.status}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-2))]">{metric.definition}</p>
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[rgb(var(--line)/0.03)] p-3">
                          <Calculator className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[rgb(var(--sa-soft))]" />
                          <p className="text-[11px] leading-5 text-[rgb(var(--text-2))]"><span className="font-semibold text-[rgb(var(--text))]">How it&apos;s calculated: </span>{metric.calculation}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <Database className="h-3 w-3 text-[rgb(var(--text-4))]" />
                          {metric.sources.map((source) => (
                            <span key={source} className="rounded-full border border-[rgb(var(--line)/0.09)] px-2 py-0.5 text-[10px] text-[rgb(var(--text-3))]">{source}</span>
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] text-[rgb(var(--text-4))]">Refresh: {metric.refresh}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {guideTab === "system" ? (
                <div className="space-y-6">
                  <p className="text-sm leading-6 text-[rgb(var(--text-2))]">IMBA-OS is one operating layer over IMBA&apos;s systems of record. You connect a source once; from then on IMBA-OS keeps a synced copy, calculates management measures from it, and shows where every figure came from — so you don&apos;t log into five systems to answer one question.</p>

                  <div className="space-y-2">
                    {systemSteps.map((stepItem, index) => (
                      <div key={stepItem.label} className="flex gap-3 rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.02)] p-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--sa)/0.12)] text-[11px] font-black text-[rgb(var(--sa-soft))]">{index + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[rgb(var(--text))]">{stepItem.label}</p>
                          <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-2))]">{stepItem.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200"><ShieldCheck className="h-4 w-4" /><p className="text-xs font-bold">Prototype boundary</p></div>
                    <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-3))]">Public Form 990 and annual-report history is identified where used. Current projects, bills, people, workflows, and forecasts are illustrative until IMBA&apos;s systems are connected. No live credentials, records, or payments are used here.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>,
        document.body,
      ) : null}

      {mounted && tourOpen ? createPortal(
        <div className="pointer-events-none fixed inset-0 z-[160]">
          {/* On an action step the scrim is drawn as four panels around the
              target, leaving a hole so the user can click the real control.
              Passive steps keep a single blocking scrim. */}
          {stepAction && targetRect ? (
            <>
              <div className="pointer-events-auto absolute left-0 right-0 top-0 bg-black/60" style={{ height: Math.max(0, targetRect.top - 6) }} />
              <div className="pointer-events-auto absolute bottom-0 left-0 right-0 bg-black/60" style={{ top: targetRect.bottom + 6 }} />
              <div className="pointer-events-auto absolute left-0 bg-black/60" style={{ top: targetRect.top - 6, height: targetRect.height + 12, width: Math.max(0, targetRect.left - 6) }} />
              <div className="pointer-events-auto absolute right-0 bg-black/60" style={{ top: targetRect.top - 6, height: targetRect.height + 12, left: targetRect.right + 6 }} />
            </>
          ) : (
            <div className="pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
          )}
          {targetRect ? (
            <div className={`pointer-events-none fixed rounded-2xl border-2 border-[rgb(var(--sa-soft))] shadow-[0_0_0_6px_rgb(var(--sa)/0.18),0_18px_60px_rgba(0,0,0,0.45)] ${stepAction ? "animate-pulse" : ""}`} style={{ left: targetRect.left - 6, top: targetRect.top - 6, width: targetRect.width + 12, height: targetRect.height + 12 }} />
          ) : null}
          <section role="dialog" aria-modal="true" aria-label="IMBA-OS guided tour" className="pointer-events-auto fixed w-[min(390px,calc(100vw-32px))] rounded-3xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel))] p-5 text-left shadow-2xl sm:p-6" style={cardPosition}>
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
              {stepAction ? (
                <span className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[rgb(var(--sa)/0.5)] bg-[rgb(var(--sa)/0.1)] px-3 py-2.5 text-xs font-black text-[rgb(var(--sa-soft))]">
                  <MousePointer2 className="h-3.5 w-3.5" />{step.actionHint ?? "Your turn"}
                </span>
              ) : (
                <button type="button" onClick={advanceTour} className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--sa))] px-4 py-2.5 text-xs font-black text-[rgb(var(--sa-ink))] transition hover:brightness-110">
                  {stepIndex === steps.length - 1 ? "Finish" : "Next"}<ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {stepAction ? (
              <div className="mt-2 text-right">
                <button type="button" onClick={advanceTour} className="text-[11px] font-bold text-[rgb(var(--text-4))] transition hover:text-[rgb(var(--text-2))]">Skip this step</button>
              </div>
            ) : null}
          </section>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
