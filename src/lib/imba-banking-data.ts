// Banking — the cash source layer beneath the liquidity waterfall.
//
// These balances are illustrative, but they are not arbitrary: the four
// accounts sum to 3,220,000, which is the "Gross cash" line in
// liquidityConstraints (imba-cockpit-data.ts:188), and the restricted account
// equals the -584,000 "Donor restrictions" line exactly. That way Banking
// explains where the cockpit's cash figure comes from instead of introducing a
// second, competing number.

export type BankAccountKind = 'operating' | 'clearing' | 'reserve' | 'restricted';

export interface ImbaBankAccount {
  id: string;
  name: string;
  institution: string;
  /** Last four only — IMBA-OS never stores or displays a full account number. */
  mask: string;
  kind: BankAccountKind;
  balance: number;
  /** Available differs from balance where deposits have not yet cleared. */
  available: number;
  restricted: boolean;
  /** What this account is allowed to fund. */
  purpose: string;
  lastSync: string;
  lastReconciled: string;
  unclearedCount: number;
  /** Net of deposits in transit and outstanding checks, in dollars. */
  unclearedNet: number;
  glAccount: string;
}

export const imbaBankAccounts: ImbaBankAccount[] = [
  {
    id: 'acct-operating',
    name: 'Operating checking',
    institution: 'First Summit Bank',
    mask: '4471',
    kind: 'operating',
    balance: 1_842_000,
    available: 1_807_800,
    restricted: false,
    purpose: 'Day-to-day operations, payables, and program delivery',
    lastSync: 'Today · 6:02 AM',
    lastReconciled: 'Jun 30, 2026',
    unclearedCount: 7,
    unclearedNet: 18_600,
    glAccount: '1010 · Cash — operating',
  },
  {
    id: 'acct-payroll',
    name: 'Payroll clearing',
    institution: 'First Summit Bank',
    mask: '2298',
    kind: 'clearing',
    balance: 310_000,
    available: 310_000,
    restricted: false,
    purpose: 'Funds the PEO draw each cycle; swept from operating',
    lastSync: 'Today · 6:02 AM',
    lastReconciled: 'Jun 30, 2026',
    unclearedCount: 0,
    unclearedNet: 0,
    glAccount: '1020 · Cash — payroll clearing',
  },
  {
    id: 'acct-reserve',
    name: 'Operating reserve',
    institution: 'First Summit Bank',
    mask: '8820',
    kind: 'reserve',
    balance: 484_000,
    available: 484_000,
    restricted: false,
    purpose: 'Board-designated reserve — unrestricted but not for routine spend',
    lastSync: 'Today · 6:02 AM',
    lastReconciled: 'Jun 30, 2026',
    unclearedCount: 0,
    unclearedNet: 0,
    glAccount: '1030 · Cash — board-designated reserve',
  },
  {
    id: 'acct-restricted',
    name: 'Restricted grant funds',
    institution: 'Cascade Public Trust',
    mask: '3316',
    kind: 'restricted',
    balance: 584_000,
    available: 584_000,
    restricted: true,
    purpose: 'Donor-restricted awards held separately until allowable spend',
    lastSync: 'Today · 6:04 AM',
    lastReconciled: 'Jun 30, 2026',
    unclearedCount: 0,
    unclearedNet: 0,
    glAccount: '1040 · Cash — restricted',
  },
];

export const bankTotals = {
  balance: imbaBankAccounts.reduce((sum, a) => sum + a.balance, 0),
  restricted: imbaBankAccounts.filter((a) => a.restricted).reduce((sum, a) => sum + a.balance, 0),
  get unrestricted() {
    return this.balance - this.restricted;
  },
};

// Bank-to-book reconciliation. The variance is fully explained by timing, which
// is the point: an unexplained variance is the actual finding, not the number.
export const bankToBook = {
  bankBalance: 3_220_000,
  glBalance: 3_238_600,
  get variance() {
    return this.glBalance - this.bankBalance;
  },
  depositsInTransit: 52_800,
  outstandingChecks: 34_200,
  items: [
    { label: 'Deposits in transit', count: 2, amount: 52_800, note: 'Client payments received Jul 18, post Jul 21' },
    { label: 'Outstanding checks', count: 5, amount: -34_200, note: 'Issued, not yet presented' },
  ],
};

export interface BankMovement {
  date: string;
  account: string;
  description: string;
  amount: number;
  category: string;
}

// Recent movement — what actually drove the 13-week runway line.
export const imbaBankMovements: BankMovement[] = [
  { date: 'Jul 18', account: 'Operating checking', description: 'High Desert County — design milestone', amount: 178_000, category: 'Earned revenue' },
  { date: 'Jul 17', account: 'Operating checking', description: 'PEO draw — July cycle 2', amount: -246_400, category: 'Payroll' },
  { date: 'Jul 16', account: 'Restricted grant funds', description: 'Evergreen Trails Foundation — draw 3', amount: 145_000, category: 'Restricted award' },
  { date: 'Jul 15', account: 'Operating checking', description: 'Equipment supplier — progress payment', amount: -92_500, category: 'Payables' },
  { date: 'Jul 14', account: 'Operating checking', description: 'Membership settlement — June cohort', amount: 61_200, category: 'Contributed' },
  { date: 'Jul 11', account: 'Operating checking', description: 'Subcontractor — Great Lakes buildout', amount: -118_300, category: 'Payables' },
];

export interface BankTransfer {
  date: string;
  from: string;
  to: string;
  amount: number;
  reason: string;
  approvedBy: string;
}

export const imbaBankTransfers: BankTransfer[] = [
  { date: 'Jul 17', from: 'Operating checking', to: 'Payroll clearing', amount: 246_400, reason: 'Fund July cycle 2 PEO draw', approvedBy: 'Finance Director' },
  { date: 'Jul 03', from: 'Operating checking', to: 'Payroll clearing', amount: 241_900, reason: 'Fund July cycle 1 PEO draw', approvedBy: 'Finance Director' },
  { date: 'Jun 28', from: 'Operating checking', to: 'Operating reserve', amount: 75_000, reason: 'Quarterly reserve contribution — board policy', approvedBy: 'CEO + Finance' },
];
