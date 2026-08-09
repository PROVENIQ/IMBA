"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";

// A small, self-contained guided tour for the Trail Solutions module. It is
// deliberately independent of the global role onboarding tour: any user sitting
// in the module can launch (and replay) it to understand what the module does
// "just by looking." Each step points at a [data-tour-ts] anchor rendered by the
// workspace; steps whose anchor is absent in the current data state (for
// example, the "Decide now" card when nothing is open) are skipped automatically
// so one definition stays correct across every snapshot.

interface TrailTourStep {
  readonly anchor: string | null;
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
}

const TRAIL_TOUR_STEPS: readonly TrailTourStep[] = [
  {
    anchor: null,
    eyebrow: "Guided tour",
    title: "What this module does",
    body: "Trail Solutions turns detailed project-cost data into a few clear answers: which projects are on track, which are drifting, why, what they will cost, and what needs a decision. You never have to open a spreadsheet.",
  },
  {
    anchor: "kpis",
    eyebrow: "Start here",
    title: "The portfolio at a glance",
    body: "Four numbers frame everything: how many projects are active and their health, the current contract value, the forecast final cost, and the forecast gross margin. The notes under each tell you where to look.",
  },
  {
    anchor: "decisions",
    eyebrow: "Decide now",
    title: "What needs your attention today",
    body: "Each card names what changed, the financial effect, the owner, and the recommended action — so a decision is one read away. Mark it started or complete, or open the supporting evidence.",
  },
  {
    anchor: "portfolio",
    eyebrow: "Diagnose",
    title: "Which projects are drifting — and why",
    body: "The table flags each project's financial health and shows a plain-language management signal explaining the main variance. Open a project only when you want the full explanation behind its status.",
  },
  {
    anchor: "billing",
    eyebrow: "Cash + confidence",
    title: "Is billing keeping pace, and can you trust the numbers?",
    body: "Secondary metrics track actual cost, billing and receivables, open decisions, and data exceptions. Projects with unresolved data show “Data incomplete” instead of a falsely precise margin.",
  },
  {
    anchor: "tabs",
    eyebrow: "Go deeper when needed",
    title: "Benchmarks, exceptions, and finance controls",
    body: "The tabs hold validated benchmarks from past projects, the exception queue, and — for Finance and the CEO — Data health and the Data Import Lab for loading your own project data.",
  },
  {
    anchor: "new-project",
    eyebrow: "Create without a workbook",
    title: "Start a project directly in IMBA-OS",
    body: "New Project creates a normalized project in the active workspace. It captures identity, contract assumptions, business-line drivers, and optional funding details. Manual and imported projects appear together in the same portfolio.",
  },
  {
    anchor: "upload-data",
    eyebrow: "Bring in source data",
    title: "Import historical or source-system data",
    body: "Upload Project Data opens the controlled Data Import Lab for bulk historical/source data, validation, mapping, control totals, and exception review. Both entry paths use the same normalized model.",
  },
  {
    anchor: null,
    eyebrow: "Manage at project level",
    title: "Use + Add for the work between imports",
    body: "Open any project and use + Add to record a forecast update, change order, operational driver, funding/agreement, match activity, or decision/action. Forecast history is preserved; only approved change orders affect contract value; eligible match activity rolls into grant controls.",
  },
  {
    anchor: "estimator",
    eyebrow: "Plan before you commit",
    title: "Benchmark-grounded planning estimates",
    body: "The Estimator compares business-line benchmarks, records assumptions and confidence, and can save an estimate or prefill a New Project form. An estimate is planning evidence, not an approved quote.",
  },
];

function anchorSelector(anchor: string): string {
  return `[data-tour-ts="${anchor}"]`;
}

function visibleSteps(): TrailTourStep[] {
  if (typeof document === "undefined") return [...TRAIL_TOUR_STEPS];
  return TRAIL_TOUR_STEPS.filter(
    (step) => step.anchor === null || document.querySelector(anchorSelector(step.anchor)) !== null,
  );
}

interface SpotlightRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

export function ImbaTrailSolutionsTour() {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<readonly TrailTourStep[]>(TRAIL_TOUR_STEPS);
  const [index, setIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const step = steps[index];

  const start = useCallback(() => {
    setSteps(visibleSteps());
    setIndex(0);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSpotlight(null);
  }, []);

  const goNext = useCallback(() => {
    setIndex((current) => {
      if (current >= steps.length - 1) {
        setOpen(false);
        setSpotlight(null);
        return current;
      }
      return current + 1;
    });
  }, [steps.length]);

  const goBack = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  // Measure the current step's anchor and keep the spotlight aligned while the
  // page scrolls or resizes. Anchorless steps (the intro) center the card.
  useLayoutEffect(() => {
    if (!open || !step) return;
    if (step.anchor === null) {
      setSpotlight(null);
      return;
    }
    const selector = anchorSelector(step.anchor);
    const measure = () => {
      const element = document.querySelector(selector);
      if (!element) {
        setSpotlight(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      setSpotlight({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    const target = document.querySelector(selector);
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
    // Measure after the smooth scroll has a chance to settle, plus immediately.
    measure();
    const timer = window.setTimeout(measure, 320);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, step, index]);

  // Keyboard: Escape closes, ArrowRight/Enter advances, ArrowLeft steps back.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight" || event.key === "Enter") goNext();
      else if (event.key === "ArrowLeft") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, goNext, goBack]);

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="inline-flex items-center gap-2 rounded-xl border border-blue-300/30 bg-blue-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-blue-800 transition hover:bg-blue-300/20 dark:text-blue-100"
        data-tour-ts="launch"
      >
        <Compass className="h-3.5 w-3.5" />
        Take the tour
      </button>

      {mounted && open && step ? createPortal(
        <div className="fixed inset-0 z-[240]" role="dialog" aria-modal="true" aria-label="Trail Solutions guided tour">
          {/* Click-catcher: dims interaction with the page during the tour. */}
          <div className="absolute inset-0" onClick={close} aria-hidden="true" />

          {/* Spotlight ring — its huge box-shadow dims everything except the anchor. */}
          {spotlight ? (
            <div
              className="pointer-events-none absolute rounded-2xl border-2 border-blue-300 transition-all duration-200"
              style={{
                top: spotlight.top - 8,
                left: spotlight.left - 8,
                width: spotlight.width + 16,
                height: spotlight.height + 16,
                boxShadow: "0 0 0 9999px rgba(3, 8, 18, 0.62)",
              }}
            />
          ) : (
            <div className="pointer-events-none absolute inset-0" style={{ background: "rgba(3, 8, 18, 0.62)" }} />
          )}

          {/* Tour card. */}
          <div
            className="pointer-events-auto absolute left-1/2 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 rounded-3xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel))] p-5 text-left shadow-2xl sm:p-6"
            style={spotlight ? cardPosition(spotlight) : { top: "50%", transform: "translate(-50%, -50%)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-800 dark:text-blue-100">{step.eyebrow}</span>
              <button type="button" onClick={close} aria-label="Close tour" className="text-[rgb(var(--text-3))] transition hover:text-[rgb(var(--text))]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 className="mt-2 text-base font-semibold leading-6 text-[rgb(var(--text))]">{step.title}</h2>
            <p className="mt-2 text-[13px] leading-6 text-[rgb(var(--text-2))]">{step.body}</p>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-[11px] font-bold text-[rgb(var(--text-4))]">{index + 1} / {steps.length}</span>
              <div className="flex items-center gap-2">
                {index > 0 ? (
                  <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 rounded-xl border border-[rgb(var(--line)/0.12)] px-3 py-2 text-[11px] font-bold text-[rgb(var(--text-2))] transition hover:text-[rgb(var(--text))]">
                    <ArrowLeft className="h-3.5 w-3.5" />Back
                  </button>
                ) : null}
                <button type="button" onClick={goNext} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-300 px-3.5 py-2 text-[11px] font-black uppercase text-[#102030] transition hover:brightness-105">
                  {index >= steps.length - 1 ? "Done" : "Next"}
                  {index >= steps.length - 1 ? null : <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

// Place the card just below the spotlight when there is room, otherwise above.
function cardPosition(spotlight: SpotlightRect): { top: number } {
  const viewportHeight = typeof window === "undefined" ? 720 : window.innerHeight;
  const below = spotlight.top + spotlight.height + 16;
  const estimatedCardHeight = 240;
  if (below + estimatedCardHeight <= viewportHeight) return { top: below };
  const above = spotlight.top - estimatedCardHeight - 16;
  return { top: Math.max(16, above) };
}
