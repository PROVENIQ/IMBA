// QuickBooks nonprofit report catalog — the source-system report library that
// IMBA-OS sits on top of. Every report is tagged with an honesty lane:
//
//   qbo-direct  — available directly from QuickBooks Online as configured
//   qbo-config  — available from QBO only after configuration work (classes,
//                 locations, projects, budgets, donor terminology, 1099 setup)
//   imba-os     — not produced by IMBA's QuickBooks at all; calculated or
//                 enhanced by IMBA-OS from QBO, PEO, and ADP data
//
// QBO does not become a fund-accounting system just because "nonprofit" is
// selected at setup — see qboFundAccountingCaveats for the areas that depend
// entirely on chart-of-accounts / class / donor / project discipline.

export type QboReportLane = 'qbo-direct' | 'qbo-config' | 'imba-os';

export type QboCatalogReport = {
  name: string;
  lane: QboReportLane;
  note?: string;
};

export type QboCatalogCategory = {
  category: string;
  caveat?: string;
  reports: QboCatalogReport[];
};

export const qboLaneMeta: Record<QboReportLane, { label: string; explain: string }> = {
  'qbo-direct': {
    label: 'Direct from QBO',
    explain: 'Available from QuickBooks Online with no additional accounting setup. A production IMBA-OS connector syncs the source data into its governed reporting store; opening a report reads that local copy instead of logging in or making a per-report QuickBooks call.',
  },
  'qbo-config': {
    label: 'After QBO configuration',
    explain: 'Exists in QuickBooks Online, but only produces meaningful output once classes, locations, projects, budgets, or donor terminology are configured. Availability also varies by QBO subscription tier (Plus / Advanced).',
  },
  'imba-os': {
    label: 'Calculated by IMBA-OS',
    explain: 'Not available from IMBA’s QuickBooks. IMBA-OS composes it from previously synced QBO transactions plus PEO settlement invoices, ADP records, and the allocation model — and labels the result with its provenance.',
  },
};

// The six areas Intuit's own guidance says QBO does NOT handle automatically
// for nonprofits — they depend on how the file is structured and maintained.
export const qboFundAccountingCaveats = [
  'Restricted vs. unrestricted net assets',
  'Grant balances and remaining spend authority',
  'Program-level results',
  'Functional expenses (program / M&G / fundraising)',
  'Funding-source utilization',
  'Indirect-cost recovery',
];

export const qboReportCatalog: QboCatalogCategory[] = [
  {
    category: 'Core financial statements',
    reports: [
      { name: 'Statement of Activity', lane: 'qbo-direct', note: 'QBO’s renamed Profit and Loss.' },
      { name: 'Statement of Activity Detail', lane: 'qbo-direct' },
      { name: 'Statement of Activity — prior period comparison', lane: 'qbo-direct' },
      { name: 'Statement of Activity — prior year comparison', lane: 'qbo-direct' },
      { name: 'Statement of Activity by month, quarter, or year', lane: 'qbo-direct' },
      { name: 'Statement of Financial Position', lane: 'qbo-direct', note: 'QBO’s renamed Balance Sheet.' },
      { name: 'Statement of Financial Position comparison', lane: 'qbo-direct' },
      { name: 'Statement of Cash Flows', lane: 'qbo-direct' },
      { name: 'Trial Balance', lane: 'qbo-direct' },
      { name: 'General Ledger', lane: 'qbo-direct' },
      { name: 'Journal', lane: 'qbo-direct' },
      { name: 'Transaction Detail by Account', lane: 'qbo-direct' },
    ],
  },
  {
    category: 'Budget & performance',
    caveat: 'Class tracking is the nonprofit workhorse here — classes carry programs, functional expense categories, and funds. Classes, projects, and budgets require QBO Plus or Advanced plus deliberate setup.',
    reports: [
      { name: 'Budget Overview', lane: 'qbo-config', note: 'Requires a budget entered in QBO (Plus / Advanced).' },
      { name: 'Budget vs. Actuals', lane: 'qbo-config', note: 'Requires a budget entered in QBO (Plus / Advanced).' },
      { name: 'Statement of Activity vs. Budget', lane: 'qbo-config' },
      { name: 'Statement of Activity by Class', lane: 'qbo-config', note: 'Classes represent programs, functional categories, departments, or funds.' },
      { name: 'Statement of Activity by Location', lane: 'qbo-config' },
      { name: 'Statement of Activity by Donor', lane: 'qbo-config', note: 'Donor terminology in nonprofit-configured accounts.' },
      { name: 'Statement of Activity by Project', lane: 'qbo-config' },
      { name: 'Project Profitability', lane: 'qbo-config' },
      { name: 'Time Cost by Employee or Vendor', lane: 'qbo-config', note: 'Requires time tracking.' },
      { name: 'Unbilled Time and Expenses', lane: 'qbo-config' },
    ],
  },
  {
    category: 'Donor, grant & pledge',
    caveat: 'In a nonprofit-configured account the underlying customer reports appear with donor terminology — Revenue by Donor Summary is the renamed Income by Customer Summary. IMBA-OS layers its Grantor class on the same records.',
    reports: [
      { name: 'Revenue by Donor Summary', lane: 'qbo-config', note: 'Renamed Income by Customer Summary.' },
      { name: 'Revenue by Donor Detail', lane: 'qbo-config' },
      { name: 'Transaction List by Donor', lane: 'qbo-config' },
      { name: 'Donor Balance Summary', lane: 'qbo-config' },
      { name: 'Donor Balance Detail', lane: 'qbo-config' },
      { name: 'Open Pledges', lane: 'qbo-config', note: 'Open invoices under donor / pledge terminology.' },
      { name: 'Pledge List', lane: 'qbo-config' },
      { name: 'Accounts Receivable Aging Summary', lane: 'qbo-direct' },
      { name: 'Accounts Receivable Aging Detail', lane: 'qbo-direct' },
      { name: 'Collections Report', lane: 'qbo-direct' },
      { name: 'Donor Contact List', lane: 'qbo-direct' },
      { name: 'Donor transaction statements', lane: 'qbo-config', note: 'Transaction statements used as donor / pledge activity reports.' },
      { name: 'Annual donor contribution statements', lane: 'qbo-config', note: 'Year-end giving statements.' },
    ],
  },
  {
    category: 'Expense, vendor & payable',
    reports: [
      { name: 'Expenses by Vendor Summary', lane: 'qbo-direct', note: 'Intuit caveat: reflects transactions coded to expense accounts — may not equal every payment made to a vendor.' },
      { name: 'Expenses by Vendor Detail', lane: 'qbo-direct' },
      { name: 'Transaction List by Vendor', lane: 'qbo-direct' },
      { name: 'Vendor Balance Summary', lane: 'qbo-direct' },
      { name: 'Vendor Balance Detail', lane: 'qbo-direct' },
      { name: 'Accounts Payable Aging Summary', lane: 'qbo-direct' },
      { name: 'Accounts Payable Aging Detail', lane: 'qbo-direct' },
      { name: 'Unpaid Bills', lane: 'qbo-direct' },
      { name: 'Bills and Applied Payments', lane: 'qbo-direct' },
      { name: 'Purchases by Vendor', lane: 'qbo-direct' },
      { name: 'Purchases by Product or Service', lane: 'qbo-direct' },
      { name: '1099 Transaction Detail', lane: 'qbo-config', note: 'Requires 1099 contractor and account mapping.' },
      { name: '1099 Contractor Balance Detail', lane: 'qbo-config', note: 'Requires 1099 contractor and account mapping.' },
    ],
  },
  {
    category: 'Cash, banking & controls',
    reports: [
      { name: 'Bank Register', lane: 'qbo-direct' },
      { name: 'Deposit Detail', lane: 'qbo-direct' },
      { name: 'Check Detail', lane: 'qbo-direct' },
      { name: 'Reconciliation Report', lane: 'qbo-direct' },
      { name: 'Cash Flow Planner', lane: 'qbo-direct', note: 'Forward-looking planner data.' },
      { name: 'Audit Log', lane: 'qbo-direct', note: 'User activity, financial changes, deletions, sign-ins. Intuit retains events for two years; IMBA-OS mirrors them into its append-only audit trail for permanent retention.' },
      { name: 'Voided / Deleted Transactions', lane: 'qbo-direct' },
      { name: 'Account List', lane: 'qbo-direct' },
      { name: 'Balance Sheet account detail', lane: 'qbo-direct' },
    ],
  },
  {
    category: 'Payroll equivalents',
    caveat: 'QBO payroll reports require QuickBooks Payroll. IMBA pays its 56 leased employees through a PEO, so none of these exist in IMBA’s QuickBooks — IMBA-OS composes the equivalents from PEO settlement invoices and ADP records instead.',
    reports: [
      { name: 'Payroll Summary', lane: 'imba-os' },
      { name: 'Payroll Details', lane: 'imba-os' },
      { name: 'Payroll by Employee', lane: 'imba-os' },
      { name: 'Payroll by Department or Class', lane: 'imba-os', note: 'Feeds the Cost of Labor module.' },
      { name: 'Employee Earnings', lane: 'imba-os' },
      { name: 'Payroll Tax Liability', lane: 'imba-os', note: 'Remitted by the PEO under its EIN; IMBA-OS shows the pass-through.' },
      { name: 'Payroll Tax and Wage Summary', lane: 'imba-os' },
      { name: 'Workers’ Compensation', lane: 'imba-os', note: 'Carried inside the PEO bundle rate.' },
      { name: 'Time Activities by Employee', lane: 'imba-os' },
      { name: 'Employee Contact List', lane: 'imba-os', note: 'Identity is authoritative in ADP.' },
      { name: 'Retirement & benefit deductions', lane: 'imba-os' },
    ],
  },
  {
    category: 'Nonprofit-dedicated statements',
    caveat: 'QuickBooks Desktop Enterprise Nonprofit ships these nine dedicated reports; QuickBooks Online does not. IMBA-OS builds the parity set on top of QBO classes, donors, and projects.',
    reports: [
      { name: 'Biggest Donors / Grants', lane: 'imba-os', note: 'Ranks donors and grant sources by total contributions.' },
      { name: 'Budget vs. Actual by Donors / Grants', lane: 'imba-os' },
      { name: 'Donors / Grants Report', lane: 'imba-os', note: 'Contribution received and associated spend per donor or grant.' },
      { name: 'Donor Contribution Summary', lane: 'imba-os' },
      { name: 'Budget vs. Actual by Programs / Projects', lane: 'imba-os' },
      { name: 'Programs / Projects Report', lane: 'imba-os', note: 'Money received and spent per program or project.' },
      { name: 'Statement of Financial Income & Expense', lane: 'qbo-direct', note: 'QBO equivalent: Statement of Activity.' },
      { name: 'Statement of Financial Position (as of date)', lane: 'qbo-direct', note: 'Same report exists natively in QBO.' },
      { name: 'Statement of Functional Expenses — Form 990', lane: 'imba-os', note: 'No native QBO equivalent. Composed from class-coded expenses plus the allocation model, tying to the filed functional split (83.3 / 10.2 / 6.6).' },
    ],
  },
];

export const qboReportCount = qboReportCatalog.reduce((sum, group) => sum + group.reports.length, 0);
