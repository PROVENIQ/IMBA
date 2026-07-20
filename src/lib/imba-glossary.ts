// Shared vocabulary. IMBA-OS is read by a CEO, a board, and directors who are
// not accountants — a term that is obvious to Finance is a stumble for everyone
// else. Anything here can be surfaced anywhere with <Term term="EAC" />.
//
// The metric-tile definitions in ImbaCeoCockpit cover KPI tiles only; table
// headers bypassed them entirely, which is how a bare "EAC" reached the first
// screen of the executive brief.

export interface GlossaryEntry {
  /** Heading shown on the tooltip. */
  label: string;
  /** Plain-English explanation. No jargon inside the definition of jargon. */
  text: string;
}

export const imbaGlossary: Record<string, GlossaryEntry> = {
  EAC: {
    label: 'EAC · Estimate at Completion',
    text: 'What the engagement is now expected to cost in total by the time it is finished — costs incurred so far plus the estimate to complete. Contract value less EAC is the contribution. EAC answers whether the job makes money; ETC answers what is left to spend.',
  },
  ETC: {
    label: 'ETC · Estimate to Complete',
    text: 'What is still left to spend to finish work already sold. Add it to costs incurred so far and you get the estimate at completion (EAC).',
  },
  Contribution: {
    label: 'Contribution',
    text: 'Contract value less the forecast cost of delivering the work, as a percentage of contract value. It is what the engagement leaves toward shared costs and mission — not profit, because organisation-wide management, general, and fundraising costs sit outside it.',
  },
  Engagement: {
    label: 'Engagement',
    text: 'One client project under contract — a planning study, a design package, or a build. The unit IMBA prices, staffs, bills, and measures margin on.',
  },
  'Loaded rate': {
    label: 'Loaded rate',
    text: 'The true hourly cost of a person: wages plus payroll taxes, benefits, and pension. Costing someone at their bare wage understates what they cost by roughly 17% here — before the PEO administration fee and workers’ compensation premium, which a public tax return cannot reveal.',
  },
  PEO: {
    label: 'PEO · Professional Employer Organization',
    text: 'The outside company that formally employs the workforce, runs payroll and benefits, and invoices IMBA a single lump sum. It is why the filed return shows compensation but not the administration fee inside it.',
  },
  FTE: {
    label: 'FTE · Full-Time Equivalent',
    text: 'One person working full time. Half a person, or one person half the time, is 0.5 FTE — it lets part-time and seasonal staff be added up on a single scale.',
  },
  GL: {
    label: 'GL · General ledger',
    text: 'The master accounting record — in IMBA’s case QuickBooks Online — that every transaction ultimately lands in. Reports are trustworthy only when they reconcile back to it.',
  },
  'Net assets': {
    label: 'Net assets',
    text: 'What the organisation owns less what it owes — the nonprofit equivalent of net worth. Split into amounts with and without donor restrictions, because only the unrestricted part is freely usable.',
  },
  'Donor restrictions': {
    label: 'Donor restrictions',
    text: 'Money a funder specified must be spent on one particular purpose or period. It is in the bank but it is not free to spend; treating it as available cash is one of the most common nonprofit reporting errors.',
  },
  'Deferred revenue': {
    label: 'Deferred revenue',
    text: 'Cash already collected for work not yet performed. It is a liability, not income — the organisation owes the work, so the cash is not deployable.',
  },
  Unbilled: {
    label: 'Unbilled',
    text: 'Work finished but not yet invoiced. The wages have already been paid, so it is real cost sitting in the business that has not yet become cash.',
  },
  AR: {
    label: 'AR · Accounts receivable',
    text: 'Money clients owe on invoices already sent. Aging shows how long each has been outstanding — the longer it sits, the less likely it is to be collected in full.',
  },
  Aging: {
    label: 'Aging',
    text: 'How long an unpaid invoice has been outstanding, usually bucketed by 30, 60, and 90 days. It is the first place collection problems become visible.',
  },
  Drawn: {
    label: 'Drawn',
    text: 'Grant money formally requested and received so far against an award. The remainder is available only if the spending qualifies under the grant’s rules.',
  },
  'Allowable spend': {
    label: 'Allowable spend',
    text: 'Costs the funder’s rules permit a particular grant to pay for. Spending outside the allowable list is disallowed at audit and has to be repaid.',
  },
  Burn: {
    label: 'Burn',
    text: 'The pace a grant is being spent down. Too slow risks returning money at period end; too fast risks running out before the deliverables are met.',
  },
  Variance: {
    label: 'Variance',
    text: 'The gap between what was planned and what actually happened. The number matters less than the explanation attached to it.',
  },
  Reconciliation: {
    label: 'Reconciliation',
    text: 'Proving two independent records of the same money agree — bank against books — and explaining every difference. An unexplained difference is the finding, not the number.',
  },
  'GAAP · FASB ASC 958': {
    label: 'GAAP · FASB ASC 958',
    text: 'The U.S. accounting rulebook, and the section of it written specifically for nonprofits. It is why net assets are presented with and without donor restrictions, and why functional expenses are split across program, management, and fundraising.',
  },
  'Accrual basis': {
    label: 'Accrual basis',
    text: 'Income and costs are recorded when earned or incurred, not when cash moves. It shows what a period truly cost, which is why the cash forecast is reported separately.',
  },
  'Functional expenses': {
    label: 'Functional expenses',
    text: 'Every dollar of spending split three ways: program, management and general, and fundraising. Funders, charity raters, and the Form 990 all judge the organisation on this split.',
  },
  'Management and general': {
    label: 'Management and general',
    text: 'Administration and overhead that keeps the organisation running but is not direct program delivery or fundraising. Understating it flatters the program ratio but misstates what programs really cost.',
  },
  'Form 990': {
    label: 'Form 990',
    text: 'The annual information return every U.S. nonprofit files, and which anyone can read. IMBA’s filings are the public baseline every verified figure in this prototype is re-derived from.',
  },
  'Deployable cash': {
    label: 'Deployable cash',
    text: 'Cash left after donor restrictions, amounts owed to chapters, deferred revenue, and the cost to finish committed work. It is the only cash figure safe to make a decision against.',
  },
  'Minimum cash floor': {
    label: 'Minimum cash floor',
    text: 'The lowest bank balance the organisation is willing to reach — the tripwire that turns a plan into a decision.',
  },
  'Break even': {
    label: 'Break even',
    text: 'The month at which the modelled change stops costing money and begins covering its own cost.',
  },
  'Floor protection': {
    label: 'Floor protection',
    text: 'Whether the scenario stays above the minimum cash floor throughout, and if not, how much additional funding or delay would be needed to keep it there.',
  },
  Utilization: {
    label: 'Utilization',
    text: 'The share of available staff hours already committed to funded work. High utilization means little slack for new work; low means capacity is being carried unrecovered.',
  },
  Stewardship: {
    label: 'Stewardship',
    text: 'Ongoing care and maintenance of a trail after construction finishes — and, in fundraising, the ongoing relationship with a donor after the gift.',
  },
  Designation: {
    label: 'Designation',
    text: 'An IMBA award certifying a community’s trail quality — Trail Town, Ride Center, or EPIC. Each carries an assessment, a term of years, and a renewal.',
  },
  'Segregation of duties': {
    label: 'Segregation of duties',
    text: 'No single person can both request and approve the same payment. It is the control that makes most payment fraud require collusion rather than one bad actor.',
  },
};

export function glossaryEntry(term: string): GlossaryEntry | undefined {
  return imbaGlossary[term];
}
