import { accounting } from './imba-data';

/**
 * Accounts Payable domain model.
 *
 * A bill moves through a state machine (see BillStatus). Approval is a
 * threshold-routed chain: everything needs a Finance Director; $5,000+ or any
 * donor-restricted bill also needs an Executive. Approvers are gated by role,
 * personal approval limit, and segregation of duties (you cannot approve a bill
 * you entered). Money never moves here — an approved bill is *handed to* the
 * Bill.com connector, which is where payment is actually executed by a person.
 */

// --- People & roles --------------------------------------------------------

export type Role = 'AP Specialist' | 'Finance Director' | 'Executive';

export type ApUser = {
  id: string;
  name: string;
  role: Role;
  approvalLimit: number; // max bill amount this person may approve
  initials: string;
};

export const apUsers: ApUser[] = [
  { id: 'u-dana', name: 'Dana Reyes', role: 'AP Specialist', approvalLimit: 0, initials: 'DR' },
  { id: 'u-terry', name: 'Terry Holliday', role: 'Finance Director', approvalLimit: 25_000, initials: 'TH' },
  { id: 'u-kent', name: 'Kent McNeill', role: 'Executive', approvalLimit: Number.POSITIVE_INFINITY, initials: 'KM' },
];

export const userById = (id: string): ApUser =>
  apUsers.find((user) => user.id === id) ?? apUsers[0];

// --- Bills -----------------------------------------------------------------

export type BillStatus = 'Draft' | 'Coded' | 'In review' | 'On hold' | 'Paid' | 'Rejected';

export type ApprovalRole = 'Finance Director' | 'Executive';

export type ApprovalStep = {
  role: ApprovalRole;
  status: 'pending' | 'approved';
  approverId?: string;
  actedAt?: string;
};

export type AuditEvent = {
  at: string;
  actor: string;
  action: string;
  detail?: string;
};

export type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type Bill = {
  id: string;
  vendor: string;
  vendorAddress: string;
  invoiceNumber: string;
  poNumber?: string;
  invoiceDate: string;
  dueDate: string;
  terms: string;
  status: BillStatus;
  glAccount: string;
  program: string;
  project?: string;
  restricted: boolean;
  enteredById: string;
  lineItems: LineItem[];
  approvals: ApprovalStep[];
  events: AuditEvent[];
  syncedToBillPay?: boolean;
};

export function billAmount(bill: Bill): number {
  return bill.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

/** Threshold routing: who must approve a bill of this size / restriction. */
export function requiredChain(amount: number, restricted: boolean): ApprovalRole[] {
  const chain: ApprovalRole[] = ['Finance Director'];
  if (amount >= 5_000 || restricted) chain.push('Executive');
  return chain;
}

export function currentStep(bill: Bill): ApprovalStep | undefined {
  return bill.approvals.find((step) => step.status === 'pending');
}

/** True when the current pending step is the last in the chain — the final
 * approver, who also decides whether to pay now or hold. */
export function isFinalApproval(bill: Bill): boolean {
  const step = currentStep(bill);
  return Boolean(step) && bill.approvals.indexOf(step as ApprovalStep) === bill.approvals.length - 1;
}

/** Whether `user` may act on `bill` right now, with a human-readable reason. */
export function approvalCheck(bill: Bill, user: ApUser): { ok: boolean; reason: string } {
  if (bill.status !== 'In review') return { ok: false, reason: 'Bill is not awaiting approval.' };
  const step = currentStep(bill);
  if (!step) return { ok: false, reason: 'No pending approval step.' };
  if (user.id === bill.enteredById)
    return { ok: false, reason: 'Cannot approve a bill you entered (segregation of duties).' };
  if (user.role !== step.role) return { ok: false, reason: `Requires ${step.role} approval.` };
  if (user.approvalLimit < billAmount(bill))
    return { ok: false, reason: `Above your ${accounting(user.approvalLimit, { symbol: true })} approval limit.` };
  return { ok: true, reason: 'You can act on this bill.' };
}

/** Whether `user` may release payment on a bill that was approved-and-held. */
export function releaseCheck(bill: Bill, user: ApUser): { ok: boolean; reason: string } {
  if (bill.status !== 'On hold') return { ok: false, reason: 'Bill is not on hold.' };
  const finalRole = bill.approvals[bill.approvals.length - 1]?.role;
  if (user.id === bill.enteredById)
    return { ok: false, reason: 'Cannot release a bill you entered (segregation of duties).' };
  if (user.role !== finalRole) return { ok: false, reason: `Only the ${finalRole} can release payment.` };
  if (user.approvalLimit < billAmount(bill))
    return { ok: false, reason: `Above your ${accounting(user.approvalLimit, { symbol: true })} approval limit.` };
  return { ok: true, reason: 'You can release this payment to Bill.com.' };
}

export function moneyFull(value: number): string {
  return accounting(value, { symbol: true });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// --- Seed data -------------------------------------------------------------
// Illustrative vendors and invoices — not real IMBA payables.

function chain(amount: number, restricted: boolean, approvedRoles: ApprovalRole[] = []): ApprovalStep[] {
  return requiredChain(amount, restricted).map((role) => {
    const approved = approvedRoles.includes(role);
    return approved
      ? {
          role,
          status: 'approved' as const,
          approverId: role === 'Finance Director' ? 'u-terry' : 'u-kent',
          actedAt: '2026-07-14T15:10:00',
        }
      : { role, status: 'pending' as const };
  });
}

export const seedBills: Bill[] = [
  {
    id: 'BILL-2041',
    vendor: 'Summit Trail Equipment Co.',
    vendorAddress: '1290 Ridgeway Dr, Boulder, CO 80301',
    invoiceNumber: 'STE-88214',
    poNumber: 'PO-TS-0142',
    invoiceDate: '2026-07-08',
    dueDate: '2026-08-07',
    terms: 'Net 30',
    status: 'In review',
    glAccount: '6200 · Field Equipment',
    program: 'Trail Solutions',
    project: 'Construction portfolio B',
    restricted: false,
    enteredById: 'u-dana',
    lineItems: [
      { description: 'Rogue hoe trail tools', quantity: 12, unitPrice: 89 },
      { description: 'Rock bar, 72"', quantity: 6, unitPrice: 142 },
      { description: 'Freight & handling', quantity: 1, unitPrice: 1560 },
    ],
    approvals: chain(3480, false),
    events: [
      { at: '2026-07-09T08:30:00', actor: 'Dana Reyes', action: 'Invoice captured', detail: 'Received via vendor email' },
      { at: '2026-07-09T08:41:00', actor: 'Dana Reyes', action: 'Coded', detail: '6200 · Trail Solutions · PO-TS-0142' },
      { at: '2026-07-09T08:42:00', actor: 'Dana Reyes', action: 'Submitted for approval' },
    ],
  },
  {
    id: 'BILL-2038',
    vendor: 'Cascade Signage Works',
    vendorAddress: '55 Alder St, Portland, OR 97210',
    invoiceNumber: 'CSW-1902',
    poNumber: 'PO-ED-0071',
    invoiceDate: '2026-07-02',
    dueDate: '2026-08-01',
    terms: 'Net 30',
    status: 'In review',
    glAccount: '6410 · Signage & Materials',
    program: 'Education',
    restricted: false,
    enteredById: 'u-dana',
    lineItems: [
      { description: 'Routed trailhead signs, cedar', quantity: 25, unitPrice: 310 },
      { description: 'Mounting hardware kits', quantity: 25, unitPrice: 40 },
    ],
    approvals: chain(8750, false, ['Finance Director']),
    events: [
      { at: '2026-07-03T10:05:00', actor: 'Dana Reyes', action: 'Invoice captured' },
      { at: '2026-07-03T10:12:00', actor: 'Dana Reyes', action: 'Coded', detail: '6410 · Education' },
      { at: '2026-07-03T10:13:00', actor: 'Dana Reyes', action: 'Submitted for approval' },
      { at: '2026-07-14T15:10:00', actor: 'Terry Holliday', action: 'Approved (Finance Director)', detail: 'Within threshold; routed to Executive' },
    ],
  },
  {
    id: 'BILL-2035',
    vendor: 'Granite State Fabrication',
    vendorAddress: '8 Quarry Rd, Concord, NH 03301',
    invoiceNumber: 'GSF-4471',
    poNumber: 'PO-TS-0130',
    invoiceDate: '2026-06-28',
    dueDate: '2026-07-28',
    terms: 'Net 30',
    status: 'In review',
    glAccount: '6420 · Construction Materials',
    program: 'Trail Solutions',
    project: 'Construction portfolio B',
    restricted: true,
    enteredById: 'u-dana',
    lineItems: [
      { description: 'Weathering-steel bridge beams', quantity: 4, unitPrice: 4850 },
      { description: 'Fabrication & drilling', quantity: 1, unitPrice: 3000 },
    ],
    approvals: chain(22400, true),
    events: [
      { at: '2026-06-29T09:00:00', actor: 'Dana Reyes', action: 'Invoice captured' },
      { at: '2026-06-29T09:15:00', actor: 'Dana Reyes', action: 'Coded', detail: 'Donor-restricted trail grant — flagged' },
      { at: '2026-06-29T09:16:00', actor: 'Dana Reyes', action: 'Submitted for approval' },
    ],
  },
  {
    id: 'BILL-2033',
    vendor: 'Basecamp Payroll Services',
    vendorAddress: '400 Commerce Way, Austin, TX 78701',
    invoiceNumber: 'BPS-20260701',
    invoiceDate: '2026-07-01',
    dueDate: '2026-07-16',
    terms: 'Net 15',
    status: 'Coded',
    glAccount: '6100 · Payroll Processing',
    program: 'Administration',
    restricted: false,
    enteredById: 'u-dana',
    lineItems: [{ description: 'Monthly payroll processing fee', quantity: 1, unitPrice: 2150 }],
    approvals: chain(2150, false),
    events: [
      { at: '2026-07-01T11:20:00', actor: 'Dana Reyes', action: 'Invoice captured' },
      { at: '2026-07-01T11:24:00', actor: 'Dana Reyes', action: 'Coded', detail: 'Awaiting submit for approval' },
    ],
  },
  {
    id: 'BILL-2030',
    vendor: 'Alpine Web & Hosting',
    vendorAddress: '210 Server Ln, Denver, CO 80202',
    invoiceNumber: 'AWH-7788',
    invoiceDate: '2026-06-25',
    dueDate: '2026-07-25',
    terms: 'Net 30',
    status: 'In review',
    glAccount: '6500 · Technology',
    program: 'Administration',
    restricted: false,
    enteredById: 'u-dana',
    lineItems: [
      { description: 'CRM platform — annual', quantity: 1, unitPrice: 5400 },
      { description: 'Managed hosting — annual', quantity: 1, unitPrice: 1500 },
    ],
    approvals: chain(6900, false, ['Finance Director']),
    events: [
      { at: '2026-06-26T13:00:00', actor: 'Dana Reyes', action: 'Invoice captured' },
      { at: '2026-06-26T13:10:00', actor: 'Dana Reyes', action: 'Coded', detail: '6500 · Administration' },
      { at: '2026-06-26T13:11:00', actor: 'Dana Reyes', action: 'Submitted for approval' },
      { at: '2026-07-10T09:30:00', actor: 'Terry Holliday', action: 'Approved (Finance Director)', detail: 'Routed to Kent for pay/hold decision' },
    ],
  },
  {
    id: 'BILL-2026',
    vendor: 'Trailhead Print Co.',
    vendorAddress: '77 Press Ave, Minneapolis, MN 55401',
    invoiceNumber: 'TPC-3310',
    invoiceDate: '2026-06-18',
    dueDate: '2026-07-18',
    terms: 'Net 30',
    status: 'On hold',
    glAccount: '6300 · Printing & Publications',
    program: 'Communications',
    restricted: false,
    enteredById: 'u-dana',
    lineItems: [{ description: '2025 annual report — print run of 2,000', quantity: 1, unitPrice: 4100 }],
    approvals: chain(4100, false, ['Finance Director']),
    events: [
      { at: '2026-06-19T09:00:00', actor: 'Dana Reyes', action: 'Invoice captured' },
      { at: '2026-06-19T09:08:00', actor: 'Dana Reyes', action: 'Submitted for approval' },
      { at: '2026-06-30T10:00:00', actor: 'Terry Holliday', action: 'Approved & held (Finance Director)', detail: 'Holding payment until the print run ships' },
    ],
  },
  {
    id: 'BILL-2019',
    vendor: 'Ridgeline Fuel & Transport',
    vendorAddress: '12 Depot St, Missoula, MT 59801',
    invoiceNumber: 'RFT-5567',
    invoiceDate: '2026-06-05',
    dueDate: '2026-07-05',
    terms: 'Net 30',
    status: 'Paid',
    glAccount: '6250 · Crew Travel & Fuel',
    program: 'Trail Solutions',
    restricted: false,
    enteredById: 'u-dana',
    syncedToBillPay: true,
    lineItems: [{ description: 'Crew fuel & transport — June', quantity: 1, unitPrice: 1890 }],
    approvals: chain(1890, false, ['Finance Director']),
    events: [
      { at: '2026-06-06T09:00:00', actor: 'Dana Reyes', action: 'Submitted for approval' },
      { at: '2026-06-10T11:00:00', actor: 'Terry Holliday', action: 'Approved & paid (Finance Director)', detail: 'Payment initiated via Bill.com API' },
      { at: '2026-06-18T02:00:00', actor: 'Bill.com', action: 'Payment cleared', detail: 'ACH settled — synced back to IMBA-OS' },
    ],
  },
  {
    id: 'BILL-2012',
    vendor: 'Peak Consultancy LLC',
    vendorAddress: '900 Advisory Blvd, Chicago, IL 60601',
    invoiceNumber: 'PC-0091',
    invoiceDate: '2026-06-01',
    dueDate: '2026-07-01',
    terms: 'Net 30',
    status: 'Rejected',
    glAccount: '6700 · Professional Services',
    program: 'Administration',
    restricted: false,
    enteredById: 'u-dana',
    lineItems: [{ description: 'Strategy advisory retainer', quantity: 1, unitPrice: 12000 }],
    approvals: chain(12000, false),
    events: [
      { at: '2026-06-02T10:00:00', actor: 'Dana Reyes', action: 'Submitted for approval' },
      { at: '2026-06-09T14:30:00', actor: 'Terry Holliday', action: 'Rejected', detail: 'Duplicate of BILL-1998 — already paid' },
    ],
  },
];
