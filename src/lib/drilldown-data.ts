import { financialHistory } from './imba-data';

/**
 * QuickZoom-style drill-down for the Statement of Activities.
 *
 * Clicking a figure opens its composition for that year. Where the breakdown is
 * derivable from published data (revenue components, the revenue−expense
 * bridge), the numbers are real and foot exactly. Where public data only gives
 * a summary total (the make-up of contributions, the functional split of
 * expenses), the composition is illustrative and labeled as such — the
 * transaction-level detail is what the GL connector will supply.
 */

export type DrillLine = { label: string; amount: number };
export type Drill = {
  title: string;
  year: number;
  amount: number;
  lines: DrillLine[];
  illustrative: boolean;
  note: string;
};

const byYear = (year: number) => {
  const match = financialHistory.find((entry) => entry.year === year);
  if (!match) throw new Error(`No financial history for ${year}`);
  return match;
};

const otherRevenue = (year: number) => {
  const y = byYear(year);
  return y.revenue - y.contributions - y.programServices;
};

export const DRILLABLE_LABELS = new Set([
  'Contributions and grants',
  'Program service revenue',
  'Investment and other revenue',
  'Total revenue and support',
  'Total operating expenses',
  'Change in net assets',
]);

// Illustrative sub-account weights (foot to the reported line total).
const compositions: Record<string, { label: string; weight: number }[]> = {
  'Contributions and grants': [
    { label: 'Foundation & government grants', weight: 0.42 },
    { label: 'Individual & major gifts', weight: 0.33 },
    { label: 'Corporate partnerships', weight: 0.15 },
    { label: 'Chapter contributions', weight: 0.1 },
  ],
  'Program service revenue': [
    { label: 'Trail Solutions project fees', weight: 0.58 },
    { label: 'Membership dues', weight: 0.22 },
    { label: 'Education & events', weight: 0.12 },
    { label: 'Sponsorships', weight: 0.08 },
  ],
  'Investment and other revenue': [
    { label: 'Investment income', weight: 0.5 },
    { label: 'Merchandise & royalties', weight: 0.3 },
    { label: 'Miscellaneous', weight: 0.2 },
  ],
  // Filed FY2024 functional split (Form 990 Part IX): program 5,840,370 /
  // M&G 712,130 / fundraising 461,859 of 7,014,359 total — 83.3 / 10.2 / 6.6.
  'Total operating expenses': [
    { label: 'Program services', weight: 0.8326 },
    { label: 'Management & general', weight: 0.1015 },
    { label: 'Fundraising', weight: 0.0659 },
  ],
};

function splitByWeights(total: number, parts: { label: string; weight: number }[]): DrillLine[] {
  const lines: DrillLine[] = [];
  let allocated = 0;
  parts.forEach((part, index) => {
    const amount = index === parts.length - 1 ? total - allocated : Math.round(total * part.weight);
    allocated += amount;
    lines.push({ label: part.label, amount });
  });
  return lines;
}

function valueFor(label: string, year: number): number {
  const y = byYear(year);
  switch (label) {
    case 'Contributions and grants':
      return y.contributions;
    case 'Program service revenue':
      return y.programServices;
    case 'Investment and other revenue':
      return otherRevenue(year);
    case 'Total revenue and support':
      return y.revenue;
    case 'Total operating expenses':
      return y.expenses;
    case 'Change in net assets':
      return y.net;
    default:
      return 0;
  }
}

const ILLUSTRATIVE_NOTE = 'Illustrative sub-account composition. Connect the GL for transaction-level detail.';
const DERIVED_NOTE = 'Derived from published Form 990 totals. Connect the GL for transaction-level detail.';

export function buildDrill(label: string, year: number): Drill | null {
  if (!DRILLABLE_LABELS.has(label)) return null;
  const amount = valueFor(label, year);

  if (label === 'Total revenue and support') {
    const y = byYear(year);
    return {
      title: label,
      year,
      amount,
      illustrative: false,
      note: DERIVED_NOTE,
      lines: [
        { label: 'Contributions and grants', amount: y.contributions },
        { label: 'Program service revenue', amount: y.programServices },
        { label: 'Investment and other revenue', amount: otherRevenue(year) },
      ],
    };
  }

  if (label === 'Change in net assets') {
    const y = byYear(year);
    return {
      title: label,
      year,
      amount,
      illustrative: false,
      note: DERIVED_NOTE,
      lines: [
        { label: 'Total revenue and support', amount: y.revenue },
        { label: 'Less: Total operating expenses', amount: -y.expenses },
      ],
    };
  }

  return {
    title: label,
    year,
    amount,
    illustrative: true,
    note: ILLUSTRATIVE_NOTE,
    lines: splitByWeights(amount, compositions[label] ?? []),
  };
}
