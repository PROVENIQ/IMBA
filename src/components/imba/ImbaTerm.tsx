'use client';

import { glossaryEntry } from '@/lib/imba-glossary';
import { ImbaInfoTooltip } from '@/components/imba/ImbaInfoTooltip';

/**
 * Renders a term with its glossary definition attached. Use it anywhere a
 * heading, column header, or label carries vocabulary a non-accountant would
 * have to guess at.
 *
 * If the term is not in the glossary it renders the text alone rather than
 * failing — a missing definition should never break a screen, and the label
 * still reads correctly.
 */
export function Term({
  term,
  children,
  align = 'center',
}: {
  term: string;
  /** Visible text, when it differs from the glossary key. */
  children?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  const entry = glossaryEntry(term);
  const visible = children ?? term;
  if (!entry) return <>{visible}</>;
  return (
    <span className="inline-flex items-center gap-1.5">
      {visible}
      <ImbaInfoTooltip label={entry.label} text={entry.text} align={align} />
    </span>
  );
}
