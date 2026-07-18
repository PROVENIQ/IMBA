'use client';

import { Info } from 'lucide-react';

/**
 * Per-section (i) info affordance shown in the cockpit header. On hover/focus it
 * reveals where the section's data comes from plus any important notes. Accent
 * follows the active section (var(--sa)).
 */
export function ImbaSectionInfo({
  section,
  sources,
  note,
}: {
  section: string;
  sources: string[];
  note?: string;
}) {
  return (
    <span className="group/si relative inline-flex shrink-0 items-center">
      <button
        type="button"
        aria-label={`Where the ${section} data comes from`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#718981] transition hover:bg-white/[0.07] hover:text-[rgb(var(--sa-soft))] focus-visible:bg-white/[0.07] focus-visible:text-[rgb(var(--sa-soft))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--sa)/0.45)]"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-[calc(100%+10px)] z-[130] hidden w-80 rounded-2xl border border-white/[0.12] bg-[#07110f]/95 p-4 text-left shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-md group-hover/si:block group-focus-within/si:block"
      >
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[rgb(var(--sa))]" />
          <span className="text-[11px] font-bold text-white">{section}</span>
        </span>
        <span className="mt-3 block text-[9px] font-black uppercase tracking-[0.16em] text-[#718981]">
          Where the data comes from
        </span>
        <ul className="mt-1.5 space-y-1.5">
          {sources.map((source, index) => (
            <li key={index} className="flex gap-2 text-[10px] leading-4 text-[#c3d1cc]">
              <span className="mt-px shrink-0 text-[rgb(var(--sa-soft))]">→</span>
              <span>{source}</span>
            </li>
          ))}
        </ul>
        {note ? (
          <span className="mt-3 block border-t border-white/[0.08] pt-2.5 text-[10px] leading-4 text-[#8fa39c]">
            {note}
          </span>
        ) : null}
      </span>
    </span>
  );
}
