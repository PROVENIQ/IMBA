'use client';

import { X } from 'lucide-react';

/**
 * Section-level hero shown once at the top of each company section (Mission,
 * Money, …). This is DEMO scaffolding meant to be removed after the pitch — it
 * lives in one place (rendered centrally by the cockpit) so removal is a single
 * edit. Accent follows the active section via var(--sa).
 */

const sectionHeroMeta: Record<string, { title: string; description: string }> = {
  Mission: {
    title: 'Mission & programs',
    description:
      'Program delivery, Trail Solutions engagements, community impact, and advocacy — the outcomes IMBA exists to create.',
  },
  Money: {
    title: 'Finance & accounting',
    description:
      'Accounting, liquidity, budget, grants, payables, and reporting — one finance home built on an airtight monthly close.',
  },
  People: {
    title: 'People & workforce',
    description:
      'Workforce, payroll, hiring, onboarding, and compliance, with labor and time mapped to projects, grants, and functions.',
  },
  Development: {
    title: 'Development & fundraising',
    description:
      'Membership, philanthropy, grants, and the commitments that fund the mission — cultivation through award-to-close.',
  },
  Platform: {
    title: 'Platform & integrations',
    description:
      'The connectors, field mappings, and staged sync jobs that let IMBA-OS work across every system IMBA uses.',
  },
  Governance: {
    title: 'Governance & oversight',
    description:
      'Board, policy, risk, audit, and fiduciary evidence — the guardrails and the append-only decision trail.',
  },
  Collaboration: {
    title: 'Collaboration',
    description:
      'Cross-team coordination across finance, program, and chapters — messages, shared documents, and tasks in one place.',
  },
  System: {
    title: 'System management',
    description:
      'Access, quality, and continuity controls, runbooks, and the append-only operating and audit trail for IMBA-OS itself.',
  },
  Management: {
    title: 'Executive management',
    description:
      'The 15-minute executive view — brief, decisions, and the next 12-month roadmap, synthesized from every pillar.',
  },
};

export function ImbaSectionHero({ section, onClose }: { section: string; onClose?: () => void }) {
  const meta = sectionHeroMeta[section];
  if (!meta) return null;
  return (
    <section className="relative rounded-[24px] border border-[rgb(var(--sa)/0.2)] bg-[linear-gradient(120deg,rgb(var(--sa)/0.09),rgba(255,255,255,.018))] p-6">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss section overview"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg border border-[rgb(var(--line)/0.1)] text-[rgb(var(--text-2))] transition hover:bg-[rgb(var(--line)/0.06)] hover:text-[rgb(var(--text))]"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      <div className="max-w-3xl pr-10">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[rgb(var(--sa-soft))]">{section}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[rgb(var(--text))]">{meta.title}</h2>
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-2))]">{meta.description}</p>
        <div className="mt-4 inline-block rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-100">Demo · illustrative</p>
          <p className="mt-1 text-[11px] text-[rgb(var(--text-2))]">Structure is production-minded; current values are illustrative.</p>
        </div>
      </div>
    </section>
  );
}
