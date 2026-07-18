export type FinancialYear = {
  year: number;
  revenue: number;
  expenses: number;
  net: number;
  contributions: number;
  programServices: number;
  netAssets: number;
};

export const financialHistory: FinancialYear[] = [
  { year: 2018, revenue: 5_204_073, expenses: 4_868_724, net: 335_349, contributions: 2_294_543, programServices: 2_736_058, netAssets: 1_085_181 },
  { year: 2019, revenue: 5_143_424, expenses: 4_663_295, net: 480_129, contributions: 3_189_065, programServices: 1_932_182, netAssets: 1_565_310 },
  { year: 2020, revenue: 5_137_983, expenses: 4_658_833, net: 479_150, contributions: 2_840_564, programServices: 2_274_947, netAssets: 2_044_460 },
  { year: 2021, revenue: 6_640_378, expenses: 5_082_026, net: 1_558_352, contributions: 4_181_760, programServices: 2_440_128, netAssets: 3_602_812 },
  { year: 2022, revenue: 7_382_336, expenses: 6_866_916, net: 515_420, contributions: 3_309_238, programServices: 4_040_646, netAssets: 4_118_232 },
  { year: 2023, revenue: 5_978_299, expenses: 6_535_893, net: -557_594, contributions: 3_187_972, programServices: 2_760_747, netAssets: 3_560_638 },
  { year: 2024, revenue: 7_203_961, expenses: 7_014_359, net: 189_602, contributions: 3_100_911, programServices: 4_070_702, netAssets: 3_754_879 },
];

export const publicFinancialFacts = {
  annualReportYear: 2025,
  annualReportRevenue: 6_700_000,
  annualReportExpenses: 7_400_000,
  annualReportNet: -779_000,
  unrestrictedNetAssets: 3_171_302,
  donorRestrictedNetAssets: 583_577,
  chapterObligations: 318_306,
  deferredRevenue: 211_730,
  programServiceShare2024: 56.5,
  contributionShare2024: 43,
  communitiesEngaged: 742,
};

export type ProjectScenario = {
  name: string;
  phase: string;
  contract: number;
  spent: number;
  estimateToComplete: number;
  billed: number;
  capacity: number;
  status: 'Healthy' | 'Watch' | 'At risk';
  note: string;
};

export const projectScenarios: ProjectScenario[] = [
  {
    name: 'Planning portfolio A',
    phase: 'Planning & design',
    contract: 1_240_000,
    spent: 720_000,
    estimateToComplete: 390_000,
    billed: 830_000,
    capacity: 78,
    status: 'Healthy',
    note: 'Forecast remains inside the approved funding envelope.',
  },
  {
    name: 'Construction portfolio B',
    phase: 'Field construction',
    contract: 1_850_000,
    spent: 1_080_000,
    estimateToComplete: 690_000,
    billed: 1_120_000,
    capacity: 94,
    status: 'Watch',
    note: 'Crew capacity and billing cadence need leadership attention.',
  },
  {
    name: 'Education portfolio C',
    phase: 'Education & signage',
    contract: 640_000,
    spent: 305_000,
    estimateToComplete: 280_000,
    billed: 350_000,
    capacity: 66,
    status: 'Healthy',
    note: 'Margin remains positive with current delivery assumptions.',
  },
];

export const forecastScenarios = [
  {
    name: 'Downside',
    revenue: 6_300_000,
    expenses: 7_100_000,
    result: -800_000,
    probability: 20,
    color: 'red',
    assumption: 'Pipeline conversion slows and equipment investment continues.',
  },
  {
    name: 'Base',
    revenue: 7_200_000,
    expenses: 7_300_000,
    result: -100_000,
    probability: 55,
    color: 'amber',
    assumption: 'Contracted backlog delivers on schedule; contributions remain steady.',
  },
  {
    name: 'Stretch',
    revenue: 8_000_000,
    expenses: 7_600_000,
    result: 400_000,
    probability: 25,
    color: 'green',
    assumption: 'High-confidence pipeline converts without excess capacity cost.',
  },
] as const;

export const decisionBrief = [
  {
    area: 'Trail Solutions',
    state: 'Watch',
    changed: 'Program-service revenue has been the more variable revenue engine.',
    matters: 'Staffing, equipment, and mission investment depend on project timing and full-cost recovery.',
    forecast: 'Base case assumes backlog delivers on schedule with no material scope drift.',
    decision: 'Confirm the margin and capacity thresholds required before accepting new work.',
  },
  {
    area: 'Liquidity',
    state: 'Action',
    changed: 'The 2025 annual report describes a planned investment year.',
    matters: 'Gross cash is not the same as deployable cash once restrictions and commitments are considered.',
    forecast: 'Runway remains unknown until cash, receivables, restrictions, and project completion costs are bridged.',
    decision: 'Set the minimum unrestricted liquidity floor and investment review milestones.',
  },
  {
    area: 'Systems',
    state: 'Plan',
    changed: 'A major technology upgrade began during the investment year.',
    matters: 'Finance dimensions must be designed into CRM, payroll, expense, and project workflows.',
    forecast: 'A workflow map can identify quick integrations before any platform replacement.',
    decision: 'Name the executive owner and define the next implementation checkpoint.',
  },
];

export function money(value: number, digits = 1): string {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${sign}$${(absolute / 1_000_000).toFixed(digits)}M`;
  if (absolute >= 1_000) return `${sign}$${Math.round(absolute / 1_000)}K`;
  return `${sign}$${absolute.toLocaleString('en-US')}`;
}

export function percent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Accounting-style currency formatting for financial statements.
 * Full precision, thousands separators, negatives in parentheses, and an
 * optional leading currency symbol (QuickBooks shows `$` on the first account
 * of a section and on subtotal / total rows).
 *   accounting(7203961)                 -> "7,203,961"
 *   accounting(-557594, { symbol: true })-> "($557,594)"
 */
export function accounting(value: number, opts: { symbol?: boolean } = {}): string {
  const rounded = Math.round(value);
  const negative = rounded < 0;
  const body = Math.abs(rounded).toLocaleString('en-US');
  const symbol = opts.symbol ? '$' : '';
  return negative ? `(${symbol}${body})` : `${symbol}${body}`;
}

/** Percent with one decimal, statement style: `56.5%`, `-7.7%`. */
export function pct(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}
