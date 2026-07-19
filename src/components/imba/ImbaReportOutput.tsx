'use client';

import { ImbaStatementOutput } from '@/components/imba/ImbaStatements';
import { ReportPaper, StatementTable, type ReportColumn, type ReportRow } from '@/components/report';
import { ReportToolbar } from '@/components/report-toolbar';
import {
  imbaBudgetRows,
  imbaGrants,
  imbaPayables,
  imbaReceivables,
  imbaVendors,
} from '@/lib/imba-detail-data';
import {
  decisionBrief,
  financialHistory,
  projectScenarios,
  publicFinancialFacts,
} from '@/lib/imba-data';

export type ReportRange = { from: string; to: string };

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function periodLabel(period: ReportRange): string {
  return `${formatDate(period.from)} – ${formatDate(period.to)}`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const textColumns = (columns: Array<[string, string]>): ReportColumn[] => [
  { key: 'account', label: columns[0][1], format: 'text' },
  ...columns.slice(1).map(([key, label]) => ({ key, label, format: 'text' as const })),
];

function CustomReport({
  name,
  period,
  basis,
  columns,
  rows,
  footnote,
}: {
  name: string;
  period: string;
  basis: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  footnote: React.ReactNode;
}) {
  const id = `generated-${slug(name)}`;
  return (
    <div className="space-y-5">
      <ReportToolbar period={period} basis={basis} targetId={id} filename={`imba-${slug(name)}`} />
      <ReportPaper id={id} title={name} period={period} basis={basis} footnote={footnote}>
        <StatementTable columns={columns} rows={rows} />
      </ReportPaper>
    </div>
  );
}

const moneyColumns = (labels: Array<[string, string]>): ReportColumn[] => [
  { key: 'account', label: labels[0][1], format: 'text' },
  ...labels.slice(1).map(([key, label]) => ({ key, label, format: 'currency' as const })),
];

const functionalProgram = publicFinancialFacts.programLines2024.reduce((sum, row) => sum + row.directExpense, 0);
const functionalTotal = functionalProgram + publicFinancialFacts.managementAndGeneral2024 + publicFinancialFacts.fundraisingExpense2024;

function FunctionalExpenseReport() {
  const columns: ReportColumn[] = [
    { key: 'account', label: 'Function / program', format: 'text' },
    { key: 'program', label: 'Program services', format: 'currency' },
    { key: 'management', label: 'Management & general', format: 'currency' },
    { key: 'fundraising', label: 'Fundraising', format: 'currency' },
    { key: 'total', label: 'Total', format: 'currency' },
  ];
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Program services' },
    ...publicFinancialFacts.programLines2024.map((line, index): ReportRow => ({
      kind: 'account',
      label: line.name,
      symbol: index === 0,
      cells: { program: line.directExpense, management: 0, fundraising: 0, total: line.directExpense },
    })),
    { kind: 'subtotal', label: 'Total program services', cells: { program: functionalProgram, management: 0, fundraising: 0, total: functionalProgram } },
    { kind: 'blank' },
    { kind: 'section', label: 'Supporting services' },
    { kind: 'account', label: 'Management and general', symbol: true, cells: { program: 0, management: publicFinancialFacts.managementAndGeneral2024, fundraising: 0, total: publicFinancialFacts.managementAndGeneral2024 } },
    { kind: 'account', label: 'Fundraising', cells: { program: 0, management: 0, fundraising: publicFinancialFacts.fundraisingExpense2024, total: publicFinancialFacts.fundraisingExpense2024 } },
    { kind: 'total', label: 'Total functional expenses', cells: { program: functionalProgram, management: publicFinancialFacts.managementAndGeneral2024, fundraising: publicFinancialFacts.fundraisingExpense2024, total: functionalTotal } },
  ];
  return <CustomReport name="Functional Expense Report" period="Fiscal year ended December 31, 2024" basis="Filed Form 990 · Amounts in U.S. dollars" columns={columns} rows={rows} footnote="Ties to FY 2024 Form 990 total expenses of $7,014,359. Functional shares are 83.3% program services, 10.2% management and general, and 6.6% fundraising (rounding applies)." />;
}

function ExecutiveBrief({ period }: { period: ReportRange }) {
  const columns = textColumns([['account', 'Decision area'], ['signal', 'Signal'], ['changed', 'What changed'], ['decision', 'Decision required']]);
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Leadership decision brief' },
    ...decisionBrief.map((item): ReportRow => ({ kind: 'account', label: item.area, cells: { signal: item.state, changed: item.changed, decision: item.decision } })),
  ];
  return <CustomReport name="CEO Monthly Financial Brief" period={periodLabel(period)} basis="Management view · Filed baselines plus clearly labeled planning assumptions" columns={columns} rows={rows} footnote="This brief surfaces the decision narrative already modeled in IMBA-OS. Current-period operating detail remains illustrative until production connectors are live." />;
}

function PortfolioMargin({ period }: { period: ReportRange }) {
  const columns = moneyColumns([['account', 'Portfolio'], ['contract', 'Contract'], ['spent', 'Spent'], ['eac', 'Estimate at completion'], ['margin', 'Forecast margin'], ['billed', 'Billed']]);
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Trail Solutions portfolios' },
    ...projectScenarios.map((item, index): ReportRow => {
      const eac = item.spent + item.estimateToComplete;
      return { kind: 'account', label: `${item.name} · ${item.status}`, symbol: index === 0, cells: { contract: item.contract, spent: item.spent, eac, margin: item.contract - eac, billed: item.billed } };
    }),
    { kind: 'total', label: 'Portfolio total', cells: {
      contract: projectScenarios.reduce((sum, item) => sum + item.contract, 0),
      spent: projectScenarios.reduce((sum, item) => sum + item.spent, 0),
      eac: projectScenarios.reduce((sum, item) => sum + item.spent + item.estimateToComplete, 0),
      margin: projectScenarios.reduce((sum, item) => sum + item.contract - item.spent - item.estimateToComplete, 0),
      billed: projectScenarios.reduce((sum, item) => sum + item.billed, 0),
    } },
  ];
  return <CustomReport name="Trail Solutions Portfolio Margin" period={periodLabel(period)} basis="Management forecast · Illustrative operating data" columns={columns} rows={rows} footnote="Estimate at completion equals spend to date plus estimate to complete. Replace the illustrative portfolio snapshot with synced project and accounting detail before operational use." />;
}

function GrantBurn({ period }: { period: ReportRange }) {
  const columns = moneyColumns([['account', 'Grant / program'], ['award', 'Award'], ['spent', 'Allowable spend'], ['remaining', 'Remaining'], ['draw', 'Next draw']]);
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Restricted grant portfolio' },
    ...imbaGrants.map((item, index): ReportRow => ({ kind: 'account', label: `${item.funder} · ${item.program} · ${item.nextDeadline}`, symbol: index === 0, cells: { award: item.award, spent: item.spent, remaining: item.remaining, draw: item.reimbursement } })),
    { kind: 'total', label: 'Grant portfolio total', cells: {
      award: imbaGrants.reduce((sum, item) => sum + item.award, 0),
      spent: imbaGrants.reduce((sum, item) => sum + item.spent, 0),
      remaining: imbaGrants.reduce((sum, item) => sum + item.remaining, 0),
      draw: imbaGrants.reduce((sum, item) => sum + item.reimbursement, 0),
    } },
  ];
  return <CustomReport name="Grant Burn + Deadline Report" period={periodLabel(period)} basis="Restricted-fund management view · Illustrative operating data" columns={columns} rows={rows} footnote="Deadlines are shown in each row. Award, spend, remaining authority, and reimbursement values are illustrative until grant and general-ledger connectors are live." />;
}

function BudgetByEngine({ period }: { period: ReportRange }) {
  const columns = moneyColumns([['account', 'Engine / line'], ['budget', 'Annual budget'], ['actual', 'Actual to date'], ['ytdVariance', 'YTD variance'], ['forecast', 'Forecast']]);
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Revenue engines and cost centers' },
    ...imbaBudgetRows.map((item, index): ReportRow => ({ kind: 'account', label: `${item.engine} · ${item.line}`, symbol: index === 0, cells: { budget: item.budget, actual: item.actual, ytdVariance: item.actual - item.ytdBudget, forecast: item.forecast } })),
    { kind: 'total', label: 'Net operating result', cells: {
      budget: imbaBudgetRows.reduce((sum, item) => sum + (item.line.toLowerCase().includes('revenue') || item.line.toLowerCase().includes('grants') || item.line.toLowerCase().includes('membership') ? item.budget : -item.budget), 0),
      actual: imbaBudgetRows.reduce((sum, item) => sum + (item.line.toLowerCase().includes('revenue') || item.line.toLowerCase().includes('grants') || item.line.toLowerCase().includes('membership') ? item.actual : -item.actual), 0),
      ytdVariance: imbaBudgetRows.reduce((sum, item) => {
        const sign = item.line.toLowerCase().includes('revenue') || item.line.toLowerCase().includes('grants') || item.line.toLowerCase().includes('membership') ? 1 : -1;
        return sum + sign * (item.actual - item.ytdBudget);
      }, 0),
      forecast: imbaBudgetRows.reduce((sum, item) => sum + (item.line.toLowerCase().includes('revenue') || item.line.toLowerCase().includes('grants') || item.line.toLowerCase().includes('membership') ? item.forecast : -item.forecast), 0),
    } },
  ];
  return <CustomReport name="Budget vs Actual by Engine" period={periodLabel(period)} basis="Accrual management view · Illustrative current-period data" columns={columns} rows={rows} footnote="Actuals are the prototype YTD snapshot and are not reallocated across arbitrary custom date ranges. The selected period controls the report request and will filter transaction detail when the production synced ledger is connected." />;
}

function Form990Workpapers() {
  const fy = financialHistory.find((item) => item.year === 2024)!;
  const columns = moneyColumns([['account', 'Book-to-return line'], ['books', 'Books / public baseline'], ['filed', 'Filed Form 990'], ['difference', 'Difference']]);
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Part VIII · Revenue' },
    { kind: 'account', label: 'Total revenue', symbol: true, cells: { books: fy.revenue, filed: fy.revenue, difference: 0 } },
    { kind: 'section', label: 'Part IX · Functional expenses' },
    { kind: 'account', label: 'Program services', symbol: true, cells: { books: functionalProgram, filed: functionalProgram, difference: 0 } },
    { kind: 'account', label: 'Management and general', cells: { books: publicFinancialFacts.managementAndGeneral2024, filed: publicFinancialFacts.managementAndGeneral2024, difference: 0 } },
    { kind: 'account', label: 'Fundraising', cells: { books: publicFinancialFacts.fundraisingExpense2024, filed: publicFinancialFacts.fundraisingExpense2024, difference: 0 } },
    { kind: 'subtotal', label: 'Total expenses', cells: { books: fy.expenses, filed: fy.expenses, difference: 0 } },
    { kind: 'section', label: 'Part X · Net assets' },
    { kind: 'total', label: 'Ending net assets', cells: { books: fy.netAssets, filed: fy.netAssets, difference: 0 } },
  ];
  return <CustomReport name="Form 990 Workpapers" period="Fiscal year ended December 31, 2024" basis="Public Form 990 reconciliation · Amounts in U.S. dollars" columns={columns} rows={rows} footnote="This prototype workpaper ties the public baseline exactly. A production book-to-return workpaper requires the synced trial balance, adjusting entries, and supporting schedules." />;
}

function SingleAuditCheck() {
  const columns: ReportColumn[] = [
    { key: 'account', label: 'Threshold test', format: 'text' },
    { key: 'actual', label: 'FY 2024 result', format: 'currency' },
    { key: 'threshold', label: 'Threshold', format: 'currency' },
    { key: 'status', label: 'Status', format: 'text' },
  ];
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Uniform Guidance monitor' },
    { kind: 'account', label: 'Federal award expenditures', symbol: true, cells: { actual: 0, threshold: 1_000_000, status: 'Not triggered' } },
    { kind: 'total', label: 'Single Audit requirement', cells: { actual: 0, threshold: 1_000_000, status: 'No · FY 2024' } },
  ];
  return <CustomReport name="Single-Audit Readiness Check" period="Fiscal year ended December 31, 2024" basis="Compliance threshold monitor · Public filing baseline" columns={columns} rows={rows} footnote="IMBA reported no federal award expenditures for FY 2024. This is a forward-looking readiness monitor, not an audit opinion." />;
}

function ControlsRegister({ period }: { period: ReportRange }) {
  const columns = textColumns([['account', 'Control'], ['owner', 'Owner'], ['evidence', 'Evidence'], ['status', 'Status']]);
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Financial governance controls' },
    { kind: 'account', label: 'Bank reconciliation', cells: { owner: 'Finance', evidence: 'Monthly reconciliation package', status: 'Designed' } },
    { kind: 'account', label: 'Vendor payment approval', cells: { owner: 'Budget owner + Finance', evidence: 'Invoice, coding, approval trail', status: 'Prototype live' } },
    { kind: 'account', label: 'Journal-entry review', cells: { owner: 'Controller', evidence: 'Preparer / reviewer certification', status: 'Designed' } },
    { kind: 'account', label: 'Grant restriction review', cells: { owner: 'Finance + program owner', evidence: 'Allowability and draw support', status: 'Prototype live' } },
    { kind: 'account', label: 'Board reporting certification', cells: { owner: 'Finance lead', evidence: 'Close checklist and variance annotations', status: 'Designed' } },
  ];
  return <CustomReport name="Internal Controls & Fiscal Policy Register" period={periodLabel(period)} basis="Governance register · Prototype control design" columns={columns} rows={rows} footnote="Statuses describe the demonstrated IMBA-OS control design. They do not certify that the controls are operating in production." />;
}

function CashForecast({ period }: { period: ReportRange }) {
  const inflows = imbaReceivables.reduce((sum, item) => sum + item.amount, 0);
  const outflows = imbaPayables.reduce((sum, item) => sum + item.amount, 0);
  const columns = moneyColumns([['account', 'Scheduled movement'], ['amount', 'Amount']]);
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Expected inflows' },
    ...imbaReceivables.map((item, index): ReportRow => ({ kind: 'account', label: `${item.due} · ${item.customer} · ${item.status}`, symbol: index === 0, cells: { amount: item.amount } })),
    { kind: 'subtotal', label: 'Total expected inflows', cells: { amount: inflows } },
    { kind: 'blank' },
    { kind: 'section', label: 'Expected outflows' },
    ...imbaPayables.map((item, index): ReportRow => ({ kind: 'account', label: `${item.due} · ${item.vendor} · ${item.status}`, symbol: index === 0, cells: { amount: -item.amount } })),
    { kind: 'subtotal', label: 'Total expected outflows', cells: { amount: -outflows } },
    { kind: 'total', label: 'Net scheduled cash movement', cells: { amount: inflows - outflows } },
  ];
  return <CustomReport name="13-Week Cash Forecast" period={periodLabel(period)} basis="Treasury schedule · Illustrative receivables and payables" columns={columns} rows={rows} footnote="This produces the scheduled cash-movement bridge available in the prototype. Ending liquidity still requires synced opening bank balances, restrictions, probability-weighted collection dates, and project costs to complete." />;
}

function ArAging({ period }: { period: ReportRange }) {
  const bucketOf = (item: (typeof imbaReceivables)[number]): 'current' | 'b31' | 'b61' | 'unbilled' => {
    if (item.ref === 'UNBILLED') return 'unbilled';
    if (item.age <= 30) return 'current';
    if (item.age <= 60) return 'b31';
    return 'b61';
  };
  const totals = { current: 0, b31: 0, b61: 0, unbilled: 0 };
  const columns = moneyColumns([['account', 'Customer · status'], ['current', 'Current'], ['b31', '31–60 days'], ['b61', '61–90 days'], ['unbilled', 'Unbilled'], ['total', 'Total']]);
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Open receivables by age' },
    ...imbaReceivables.map((item, index): ReportRow => {
      const bucket = bucketOf(item);
      totals[bucket] += item.amount;
      const cells: Record<string, number | null> = { current: null, b31: null, b61: null, unbilled: null, total: item.amount };
      cells[bucket] = item.amount;
      return { kind: 'account', label: `${item.customer} · ${item.status}`, symbol: index === 0, cells };
    }),
    { kind: 'total', label: 'Total open receivables', cells: { ...totals, total: totals.current + totals.b31 + totals.b61 + totals.unbilled } },
  ];
  return <CustomReport name="AR Aging & Collections" period={periodLabel(period)} basis="Open invoices and unbilled milestones · Illustrative operating data" columns={columns} rows={rows} footnote="Aging is bucketed from each invoice's days outstanding as of the demo date. Balances are illustrative until the receivables sync is live; collection status mirrors the Accounts receivable view." />;
}

function VendorSpend() {
  const filedTotal = imbaVendors.filter((vendor) => vendor.prov === 'filed').reduce((sum, vendor) => sum + vendor.ytd, 0);
  const total = imbaVendors.reduce((sum, vendor) => sum + vendor.ytd, 0);
  const columns: ReportColumn[] = [
    { key: 'account', label: 'Vendor', format: 'text' },
    { key: 'category', label: 'Category', format: 'text' },
    { key: 'source', label: 'Provenance', format: 'text' },
    { key: 'amount', label: 'Paid (2024)', format: 'currency' },
  ];
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Independent contractors · filed Form 990' },
    ...imbaVendors.filter((vendor) => vendor.prov === 'filed').map((vendor, index): ReportRow => ({ kind: 'account', label: vendor.name, symbol: index === 0, cells: { category: vendor.category, source: 'Filed · 990', amount: vendor.ytd } })),
    { kind: 'subtotal', label: 'Filed contractors over $100K', cells: { category: null, source: null, amount: filedTotal } },
    { kind: 'blank' },
    { kind: 'section', label: 'Operating vendors · illustrative' },
    ...imbaVendors.filter((vendor) => vendor.prov === 'illustrative').map((vendor): ReportRow => ({ kind: 'account', label: vendor.name, cells: { category: vendor.category, source: 'Illustrative', amount: vendor.ytd } })),
    { kind: 'blank' },
    { kind: 'total', label: 'Total vendor spend shown', cells: { category: null, source: null, amount: total } },
  ];
  return <CustomReport name="Vendor Spend + 1099 Report" period="Fiscal year ended December 31, 2024" basis="Vendor payments · Filed 990 contractors plus illustrative operating vendors" columns={columns} rows={rows} footnote="The five contractors over $100K are IMBA's filed FY 2024 independent contractors (Form 990 Part VII, Section B). Remaining rows are illustrative. Intuit's own caveat applies to the QuickBooks source report: expense-coded totals may not equal every payment made to a vendor." />;
}

function SourceStructureReport({ reportName, period }: { reportName: string; period: ReportRange }) {
  const columns = textColumns([['account', 'Report row'], ['status', 'Status'], ['source', 'Required source']]);
  const rows: ReportRow[] = [
    { kind: 'section', label: 'Awaiting synced source rows' },
    { kind: 'account', label: 'Report structure is ready', cells: { status: 'Demo mode · no live rows', source: 'Governed QuickBooks sync' } },
  ];
  return <CustomReport name={reportName} period={periodLabel(period)} basis="QuickBooks catalog structure · Demo mode" columns={columns} rows={rows} footnote="This transaction-level report is designed to render from IMBA-OS's governed QuickBooks copy. The prototype is not connected to IMBA's production company, so it shows the report document and required source without inventing transactions. Opening the report does not make a per-report QuickBooks call." />;
}

export function ImbaReportOutput({ reportName, period }: { reportName: string; period: ReportRange }) {
  switch (reportName) {
    case 'Statement of Activities':
      return <ImbaStatementOutput tab="activities" />;
    case 'Statement of Financial Position':
      return <ImbaStatementOutput tab="position" />;
    case 'Statement of Cash Flows':
      return <ImbaStatementOutput tab="cashflows" />;
    case 'CEO Monthly Financial Brief':
      return <ExecutiveBrief period={period} />;
    case 'Trail Solutions Portfolio Margin':
      return <PortfolioMargin period={period} />;
    case 'Grant Burn + Deadline Report':
      return <GrantBurn period={period} />;
    case 'Budget vs Actual by Engine':
      return <BudgetByEngine period={period} />;
    case 'Functional Expense Report':
      return <FunctionalExpenseReport />;
    case 'Form 990 Workpapers':
      return <Form990Workpapers />;
    case 'Single-Audit Readiness Check':
      return <SingleAuditCheck />;
    case 'Internal Controls & Fiscal Policy Register':
      return <ControlsRegister period={period} />;
    case '13-Week Cash Forecast':
      return <CashForecast period={period} />;
    case 'AR Aging & Collections':
      return <ArAging period={period} />;
    case 'Vendor Spend + 1099 Report':
      return <VendorSpend />;
    default: {
      const normalized = reportName.toLowerCase();
      if (normalized.includes('functional expense')) return <FunctionalExpenseReport />;
      if (normalized.includes('financial position')) return <ImbaStatementOutput tab="position" />;
      if (normalized.includes('cash flow')) return <ImbaStatementOutput tab="cashflows" />;
      if (normalized.includes('statement of activity') || normalized.includes('financial income')) return <ImbaStatementOutput tab="activities" />;
      if (normalized.includes('budget') && normalized.includes('actual')) return <BudgetByEngine period={period} />;
      if (normalized.includes('project profitability') || normalized.includes('programs / projects')) return <PortfolioMargin period={period} />;
      if (normalized.includes('grant') || normalized.includes('donor') || normalized.includes('pledge')) return <GrantBurn period={period} />;
      if (normalized.includes('receivable') || normalized.includes('collections')) return <ArAging period={period} />;
      if (normalized.includes('vendor') || normalized.includes('1099') || normalized.includes('purchases')) return <VendorSpend />;
      return <SourceStructureReport reportName={reportName} period={period} />;
    }
  }
}
