import type { ReportColumn, ReportRow } from '@/components/report';
import { financialHistory, forecastScenarios, publicFinancialFacts } from './imba-data';

const byYear = (year: number) => {
  const match = financialHistory.find((entry) => entry.year === year);
  if (!match) throw new Error(`No financial history for ${year}`);
  return match;
};

// ---------------------------------------------------------------------------
// Statement of Activities (nonprofit Profit & Loss), 3-year comparative
// ---------------------------------------------------------------------------

const activityYears = [2022, 2023, 2024] as const;

export const activitiesColumns: ReportColumn[] = [
  { key: 'account', label: 'Account', format: 'text' },
  ...activityYears.map((year) => ({ key: String(year), label: String(year), format: 'currency' as const })),
  { key: 'pct', label: '% of Revenue', note: 'FY 2024', format: 'percent' as const },
];

function activityCells(pick: (year: number) => number, share?: (year: number) => number) {
  const cells: Record<string, number> = {};
  for (const year of activityYears) cells[String(year)] = pick(year);
  if (share) cells.pct = share(2024);
  return cells;
}

const revenue2024 = byYear(2024).revenue;
const otherRevenue = (year: number) => {
  const y = byYear(year);
  return y.revenue - y.contributions - y.programServices;
};

export const activitiesRows: ReportRow[] = [
  { kind: 'section', label: 'Revenue and support' },
  {
    kind: 'account',
    label: 'Contributions and grants',
    symbol: true,
    cells: activityCells((y) => byYear(y).contributions, (y) => (byYear(y).contributions / revenue2024) * 100),
  },
  {
    kind: 'account',
    label: 'Program service revenue',
    cells: activityCells((y) => byYear(y).programServices, (y) => (byYear(y).programServices / revenue2024) * 100),
  },
  {
    kind: 'account',
    label: 'Membership and other revenue',
    cells: activityCells(otherRevenue, (y) => (otherRevenue(y) / revenue2024) * 100),
  },
  {
    kind: 'subtotal',
    label: 'Total revenue and support',
    cells: activityCells((y) => byYear(y).revenue, () => 100),
  },
  { kind: 'blank' },
  { kind: 'section', label: 'Expenses' },
  {
    kind: 'account',
    label: 'Total operating expenses',
    symbol: true,
    cells: activityCells((y) => byYear(y).expenses, (y) => (byYear(y).expenses / revenue2024) * 100),
  },
  { kind: 'blank' },
  {
    kind: 'total',
    label: 'Change in net assets',
    cells: activityCells((y) => byYear(y).net, (y) => (byYear(y).net / revenue2024) * 100),
  },
];

// ---------------------------------------------------------------------------
// Statement of Financial Position (Balance Sheet), as of Dec 31, 2024
// ---------------------------------------------------------------------------

export const positionColumns: ReportColumn[] = [
  { key: 'account', label: 'Account', format: 'text' },
  { key: 'amount', label: 'Dec 31, 2024', format: 'currency' },
];

const totalNetAssets =
  publicFinancialFacts.unrestrictedNetAssets + publicFinancialFacts.donorRestrictedNetAssets;
const identifiedLiabilities =
  publicFinancialFacts.chapterObligations + publicFinancialFacts.deferredRevenue;

export const positionRows: ReportRow[] = [
  { kind: 'section', label: 'Assets' },
  { kind: 'account', label: 'Cash and cash equivalents', symbol: true, cells: { amount: 'Connect GL' } },
  { kind: 'account', label: 'Grants and contracts receivable', cells: { amount: 'Connect GL' } },
  { kind: 'account', label: 'Property and equipment, net', cells: { amount: 'Connect GL' } },
  { kind: 'subtotal', label: 'Total assets', cells: { amount: 'Connect GL' } },
  { kind: 'blank' },
  { kind: 'section', label: 'Liabilities' },
  {
    kind: 'account',
    label: 'Amounts due to chapters',
    symbol: true,
    cells: { amount: publicFinancialFacts.chapterObligations },
  },
  {
    kind: 'account',
    label: 'Deferred project revenue',
    cells: { amount: publicFinancialFacts.deferredRevenue },
  },
  { kind: 'account', label: 'Accounts payable and accrued liabilities', cells: { amount: 'Connect GL' } },
  {
    kind: 'subtotal',
    label: 'Total identified commitments',
    cells: { amount: identifiedLiabilities },
  },
  { kind: 'blank' },
  { kind: 'section', label: 'Net assets' },
  {
    kind: 'account',
    label: 'Without donor restrictions',
    symbol: true,
    cells: { amount: publicFinancialFacts.unrestrictedNetAssets },
  },
  {
    kind: 'account',
    label: 'With donor restrictions',
    cells: { amount: publicFinancialFacts.donorRestrictedNetAssets },
  },
  { kind: 'subtotal', label: 'Total net assets', cells: { amount: totalNetAssets } },
  { kind: 'blank' },
  { kind: 'total', label: 'Total liabilities and net assets', cells: { amount: 'Connect GL' } },
];

// ---------------------------------------------------------------------------
// Statement of Cash Flows — deployable-cash bridge
// ---------------------------------------------------------------------------

export const cashFlowColumns: ReportColumn[] = [
  { key: 'account', label: 'Account', format: 'text' },
  { key: 'amount', label: 'Amount', format: 'currency' },
];

export const cashFlowRows: ReportRow[] = [
  { kind: 'section', label: 'Deployable-cash bridge' },
  { kind: 'account', label: 'Beginning cash and near-cash resources', symbol: true, cells: { amount: 'Connect GL' } },
  { kind: 'account', label: 'Less: Donor-restricted resources', cells: { amount: -publicFinancialFacts.donorRestrictedNetAssets } },
  { kind: 'account', label: 'Less: Amounts due to chapters', cells: { amount: -publicFinancialFacts.chapterObligations } },
  { kind: 'account', label: 'Less: Deferred project revenue', cells: { amount: -publicFinancialFacts.deferredRevenue } },
  { kind: 'account', label: 'Less: Remaining cost to complete contracted work', cells: { amount: 'Connect PM' } },
  { kind: 'account', label: 'Less: Minimum operating reserve', cells: { amount: 'Set policy' } },
  { kind: 'blank' },
  { kind: 'total', label: 'Deployable unrestricted liquidity', cells: { amount: 'Calculated output' } },
];

// ---------------------------------------------------------------------------
// Budget vs. Actual — base budget vs. probability-weighted forecast
// ---------------------------------------------------------------------------

const base = forecastScenarios.find((scenario) => scenario.name === 'Base')!;
const weightedRevenue = forecastScenarios.reduce((t, s) => t + s.revenue * (s.probability / 100), 0);
const weightedExpenses = forecastScenarios.reduce((t, s) => t + s.expenses * (s.probability / 100), 0);
const weightedResult = weightedRevenue - weightedExpenses;

const variance = (forecast: number, budget: number) => forecast - budget;
const variancePct = (forecast: number, budget: number) =>
  budget === 0 ? 0 : ((forecast - budget) / Math.abs(budget)) * 100;

export const budgetColumns: ReportColumn[] = [
  { key: 'account', label: 'Account', format: 'text' },
  { key: 'budget', label: 'Budget', note: 'Base case', format: 'currency' },
  { key: 'forecast', label: 'Forecast', note: 'Prob. weighted', format: 'currency' },
  { key: 'var', label: 'Over / (Under)', format: 'currency' },
  { key: 'varpct', label: '% Variance', format: 'percent' },
];

export const budgetRows: ReportRow[] = [
  { kind: 'section', label: 'Operating budget performance' },
  {
    kind: 'account',
    label: 'Total revenue and support',
    symbol: true,
    cells: {
      budget: base.revenue,
      forecast: weightedRevenue,
      var: variance(weightedRevenue, base.revenue),
      varpct: variancePct(weightedRevenue, base.revenue),
    },
  },
  {
    kind: 'account',
    label: 'Total operating expenses',
    cells: {
      budget: base.expenses,
      forecast: weightedExpenses,
      var: variance(weightedExpenses, base.expenses),
      varpct: variancePct(weightedExpenses, base.expenses),
    },
  },
  { kind: 'blank' },
  {
    kind: 'total',
    label: 'Change in net assets',
    cells: {
      budget: base.result,
      forecast: weightedResult,
      var: variance(weightedResult, base.result),
      varpct: variancePct(weightedResult, base.result),
    },
  },
];

export const scenarioColumns: ReportColumn[] = [
  { key: 'account', label: 'Scenario', format: 'text' },
  { key: 'probability', label: 'Probability', format: 'percent' },
  { key: 'revenue', label: 'Revenue', format: 'currency' },
  { key: 'expenses', label: 'Expenses', format: 'currency' },
  { key: 'result', label: 'Operating result', format: 'currency' },
];

export const scenarioRows: ReportRow[] = [
  { kind: 'section', label: 'Scenario detail' },
  ...forecastScenarios.map(
    (scenario, index): ReportRow => ({
      kind: 'account',
      label: scenario.name,
      symbol: index === 0,
      cells: {
        probability: scenario.probability,
        revenue: scenario.revenue,
        expenses: scenario.expenses,
        result: scenario.result,
      },
    }),
  ),
  { kind: 'blank' },
  {
    kind: 'total',
    label: 'Probability-weighted forecast',
    cells: {
      probability: 100,
      revenue: weightedRevenue,
      expenses: weightedExpenses,
      result: weightedResult,
    },
  },
];
