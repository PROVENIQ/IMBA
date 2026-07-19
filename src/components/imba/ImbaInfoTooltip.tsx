'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp } from 'lucide-react';

const TOOLTIP_WIDTH = 256; // matches w-64
const GAP = 8;

/**
 * Info tooltip. The bubble is rendered through a portal to <body> with fixed
 * positioning so it always paints above the page and is never clipped by an
 * ancestor's overflow or stacking context (cards, the scrollable <main>, etc.).
 */
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const place = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left =
      align === 'left'
        ? r.left
        : align === 'right'
          ? r.right - TOOLTIP_WIDTH
          : r.left + r.width / 2 - TOOLTIP_WIDTH / 2;
    // keep the bubble within the viewport
    left = Math.max(8, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - 8));
    const top = placement === 'above' ? r.top - GAP : r.bottom + GAP;
    setCoords({ top, left });
  }, [align, placement]);

  const show = useCallback(() => {
    place();
    setOpen(true);
  }, [place]);
  const hide = useCallback(() => setOpen(false), []);

  // While open, follow scroll/resize so the bubble stays anchored to its trigger.
  useEffect(() => {
    if (!open) return;
    const onMove = () => place();
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, place]);

  return (
    <span className="relative inline-flex shrink-0 items-center">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[rgb(var(--text-3))] transition hover:bg-[rgb(var(--line)/0.07)] hover:text-[rgb(var(--sa-soft))] focus-visible:bg-[rgb(var(--line)/0.07)] focus-visible:text-[rgb(var(--sa-soft))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--sa)/0.45)]"
      >
        <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {mounted && open && coords
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              style={{
                position: 'fixed',
                top: coords.top,
                left: coords.left,
                width: TOOLTIP_WIDTH,
                transform: placement === 'above' ? 'translateY(-100%)' : undefined,
              }}
              className="pointer-events-none z-[200] rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/95%)] px-3 py-2.5 text-left text-[11px] font-medium normal-case leading-5 tracking-normal text-[rgb(var(--text))] shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-md"
            >
              <span className="block font-bold text-[rgb(var(--text))]">{label}</span>
              <span className="mt-0.5 block text-[rgb(var(--text-2))]">{text}</span>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
