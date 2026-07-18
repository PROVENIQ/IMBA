'use client';

import { useId } from 'react';
import { CircleHelp } from 'lucide-react';

export function ImbaInfoTooltip({
  label,
  text,
  align = 'center',
  placement = 'above',
}: {
  label: string;
  text: string;
  align?: 'left' | 'center' | 'right';
  placement?: 'above' | 'below';
}) {
  const tooltipId = useId();
  const position =
    align === 'left'
      ? 'left-0'
      : align === 'right'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

  return (
    <span className="group/info relative inline-flex shrink-0 items-center">
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={tooltipId}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#718981] transition hover:bg-white/[0.07] hover:text-[rgb(var(--sa-soft))] focus-visible:bg-white/[0.07] focus-visible:text-[rgb(var(--sa-soft))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--sa)/0.45)]"
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={`pointer-events-none absolute z-[120] hidden w-64 rounded-xl border border-white/[0.12] bg-[#07110f]/95 px-3 py-2.5 text-left text-[10px] font-medium normal-case leading-5 tracking-normal text-[#d4dfdb] shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-md group-hover/info:block group-focus-within/info:block ${placement === 'above' ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'} ${position}`}
      >
        <span className="block font-bold text-white">{label}</span>
        <span className="mt-0.5 block text-[#a5b7b1]">{text}</span>
      </span>
    </span>
  );
}
