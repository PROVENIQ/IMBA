'use client';

import { useMemo, useReducer, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Lock,
  PauseCircle,
  PenLine,
  Send,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  type ApUser,
  type Bill,
  type BillStatus,
  apUsers,
  approvalCheck,
  billAmount,
  currentStep,
  formatDate,
  formatDateTime,
  isFinalApproval,
  moneyFull,
  releaseCheck,
  seedBills,
  userById,
} from '@/lib/ap-data';
import { useImbaOsState } from '@/components/imba/ImbaOsState';

/**
 * Accounts Payable — native IMBA-OS MONEY view.
 *
 * The full approval decision (Approve & Pay / Hold / Reject) lives here, gated
 * by role, approval limit, and segregation of duties. Money never moves inside
 * IMBA-OS: Approve & Pay queues an outbound job on the control plane (the same
 * mechanism that links out to Bill.com / QuickBooks). Reuses ap-data.ts logic;
 * this file is only the cockpit-styled presentation.
 */

type State = { bills: Bill[]; selectedId: string | null; actingUserId: string };
type Action =
  | { type: 'select'; id: string }
  | { type: 'close' }
  | { type: 'setUser'; id: string }
  | { type: 'submit'; id: string }
  | { type: 'advance'; id: string }
  | { type: 'pay'; id: string }
  | { type: 'hold'; id: string }
  | { type: 'release'; id: string }
  | { type: 'reject'; id: string; note: string }
  | { type: 'requestChanges'; id: string; note: string };

function nowIso(): string {
  return new Date().toISOString();
}
function withEvent(bill: Bill, event: Bill['events'][number]): Bill {
  return { ...bill, events: [...bill.events, event] };
}
function approveCurrent(bill: Bill, actor: ApUser): Bill['approvals'] {
  let done = false;
  return bill.approvals.map((step) => {
    if (!done && step.status === 'pending') {
      done = true;
      return { ...step, status: 'approved' as const, approverId: actor.id, actedAt: nowIso() };
    }
    return step;
  });
}

function reducer(state: State, action: Action): State {
  const actor = userById(state.actingUserId);
  const update = (id: string, fn: (bill: Bill) => Bill): State => ({
    ...state,
    bills: state.bills.map((bill) => (bill.id === id ? fn(bill) : bill)),
  });
  switch (action.type) {
    case 'select':
      return { ...state, selectedId: action.id };
    case 'close':
      return { ...state, selectedId: null };
    case 'setUser':
      return { ...state, actingUserId: action.id };
    case 'submit':
      return update(action.id, (bill) =>
        withEvent({ ...bill, status: 'In review' }, { at: nowIso(), actor: actor.name, action: 'Submitted for approval' }),
      );
    case 'advance':
      return update(action.id, (bill) => {
        if (!approvalCheck(bill, actor).ok) return bill;
        const role = currentStep(bill)?.role ?? actor.role;
        return withEvent(
          { ...bill, approvals: approveCurrent(bill, actor) },
          { at: nowIso(), actor: actor.name, action: `Approved (${role})`, detail: 'Routed to next approver' },
        );
      });
    case 'pay':
      return update(action.id, (bill) => {
        if (!approvalCheck(bill, actor).ok) return bill;
        const role = currentStep(bill)?.role ?? actor.role;
        return withEvent(
          { ...bill, approvals: approveCurrent(bill, actor), status: 'Paid', syncedToBillPay: true },
          { at: nowIso(), actor: actor.name, action: `Approved & paid (${role})`, detail: 'Payment initiated via Bill.com API' },
        );
      });
    case 'hold':
      return update(action.id, (bill) => {
        if (!approvalCheck(bill, actor).ok) return bill;
        const role = currentStep(bill)?.role ?? actor.role;
        return withEvent(
          { ...bill, approvals: approveCurrent(bill, actor), status: 'On hold' },
          { at: nowIso(), actor: actor.name, action: `Approved & held (${role})`, detail: 'Awaiting release to Bill.com' },
        );
      });
    case 'release':
      return update(action.id, (bill) => {
        if (!releaseCheck(bill, actor).ok) return bill;
        return withEvent(
          { ...bill, status: 'Paid', syncedToBillPay: true },
          { at: nowIso(), actor: actor.name, action: 'Payment released', detail: 'Released to Bill.com via API' },
        );
      });
    case 'reject':
      return update(action.id, (bill) =>
        withEvent(
          { ...bill, status: 'Rejected' },
          { at: nowIso(), actor: actor.name, action: 'Rejected', detail: action.note || undefined },
        ),
      );
    case 'requestChanges':
      return update(action.id, (bill) =>
        withEvent(
          { ...bill, status: 'Coded', approvals: bill.approvals.map((s) => ({ role: s.role, status: 'pending' as const })) },
          { at: nowIso(), actor: actor.name, action: 'Requested changes', detail: action.note || undefined },
        ),
      );
    default:
      return state;
  }
}

const pillClass: Record<BillStatus, string> = {
  Draft: 'bg-white/10 text-[#9fb2ac]',
  Coded: 'bg-cyan-300/10 text-cyan-100',
  'In review': 'bg-amber-300/10 text-amber-100',
  'On hold': 'bg-cyan-300/10 text-cyan-100',
  Paid: 'bg-[#b7e35b]/15 text-[#dff7a8]',
  Rejected: 'bg-rose-300/10 text-rose-100',
};

function StatusPill({ status }: { status: BillStatus }) {
  return <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${pillClass[status]}`}>{status}</span>;
}

function isOverdue(bill: Bill): boolean {
  if (bill.status === 'Paid' || bill.status === 'Rejected') return false;
  return new Date(bill.dueDate) < new Date('2026-07-17');
}

function Kpi({ label, value, note, tone = 'lime' }: { label: string; value: string; note: string; tone?: 'lime' | 'teal' | 'amber' | 'rose' }) {
  const toneClass = tone === 'lime' ? 'text-[#dff7a8]' : tone === 'teal' ? 'text-[#9fd6cc]' : tone === 'amber' ? 'text-amber-200' : 'text-rose-200';
  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-[#142321] p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#718981]">{label}</p>
      <p className={`mt-3 font-mono text-2xl font-semibold tracking-[-0.04em] ${toneClass}`}>{value}</p>
      <p className="mt-1.5 text-[10px] leading-4 text-[#81978f]">{note}</p>
    </div>
  );
}

export function ImbaPayables() {
  const control = useImbaOsState();
  const [state, dispatch] = useReducer(reducer, { bills: seedBills, selectedId: null, actingUserId: 'u-kent' });
  const actingUser = userById(state.actingUserId);
  const selected = state.bills.find((b) => b.id === state.selectedId) ?? null;

  const metrics = useMemo(() => {
    const open = state.bills.filter((b) => ['Coded', 'In review', 'On hold'].includes(b.status));
    const openTotal = open.reduce((s, b) => s + billAmount(b), 0);
    const awaitingMe = state.bills.filter((b) => approvalCheck(b, actingUser).ok || releaseCheck(b, actingUser).ok).length;
    const overdue = state.bills.filter(isOverdue).length;
    const held = state.bills.filter((b) => b.status === 'On hold');
    const heldTotal = held.reduce((s, b) => s + billAmount(b), 0);
    return { openTotal, openCount: open.length, awaitingMe, overdue, heldTotal, heldCount: held.length };
  }, [state.bills, actingUser]);

  // Mirror pay/release into the IMBA-OS control plane (audit + outbound job).
  const act = (action: Action) => {
    dispatch(action);
    const bill = state.bills.find((b) => 'id' in action && b.id === (action as { id: string }).id);
    if (!bill) return;
    if (action.type === 'pay' || action.type === 'release') {
      control.queueSync({
        system: 'qbo',
        action: 'create',
        recordType: 'Bill payment',
        recordId: bill.id,
        summary: `${bill.vendor} · ${moneyFull(billAmount(bill))} · authorized by ${actingUser.name}`,
        requiresApproval: false,
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Acting-as + connector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#111b1a]/90 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#718981]">Acting as</span>
          <div className="flex flex-wrap gap-2">
            {apUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => dispatch({ type: 'setUser', id: user.id })}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                  user.id === state.actingUserId ? 'border-[#b7e35b]/40 bg-[#b7e35b]/[0.06]' : 'border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-lg font-mono text-[8px] font-black ${user.id === state.actingUserId ? 'bg-[#b7e35b] text-[#102016]' : 'bg-white/10 text-white'}`}>{user.initials}</span>
                <span className="text-left"><span className="block text-[10px] font-semibold text-white">{user.name}</span><span className="block text-[8px] text-[#718981]">{user.role}</span></span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-violet-300/15 bg-violet-300/[0.05] px-3 py-2">
          <span className="text-[9px] font-black uppercase tracking-wider text-violet-100">Bill.com</span>
          <span className="text-[9px] text-[#9caaa6]">payment connector · demo</span>
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Open payables" value={moneyFull(metrics.openTotal)} note={`${metrics.openCount} bills in the pipeline`} tone="teal" />
        <Kpi label="Awaiting my decision" value={String(metrics.awaitingMe)} note={`As ${actingUser.role}`} tone={metrics.awaitingMe ? 'amber' : 'lime'} />
        <Kpi label="Overdue" value={String(metrics.overdue)} note="Past due date, not yet paid" tone={metrics.overdue ? 'rose' : 'teal'} />
        <Kpi label="Approved on hold" value={moneyFull(metrics.heldTotal)} note={`${metrics.heldCount} awaiting release`} tone="amber" />
      </div>

      <section className="rounded-[22px] border border-white/[0.08] bg-[#111b1a]/90">
        <div className="border-b border-white/[0.07] px-5 py-4">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#718981]">Cash conversion · approval control</p>
          <h2 className="mt-1 text-base font-semibold text-white">Accounts payable — approve &amp; pay</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead>
              <tr className="border-b border-white/[0.07] text-[9px] font-black uppercase tracking-[0.16em] text-[#6f8981]">
                <th className="px-5 py-3">Vendor / invoice</th>
                <th className="px-3 py-3">Program &amp; GL</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3">Due</th>
                <th className="px-3 py-3">Awaiting</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {state.bills.map((bill) => {
                const step = currentStep(bill);
                const awaiting = bill.status === 'In review' && step ? step.role : bill.status === 'On hold' ? 'Release' : '—';
                return (
                  <tr key={bill.id} className={`border-b border-white/[0.055] last:border-0 ${state.selectedId === bill.id ? 'bg-emerald-300/[0.035]' : 'hover:bg-white/[0.02]'}`}>
                    <td className="px-5 py-3.5"><p className="text-xs font-semibold text-white">{bill.vendor}</p><p className="mt-1 text-[9px] text-[#718981]">{bill.invoiceNumber} · {bill.id}</p></td>
                    <td className="px-3 py-3.5"><p className="text-[11px] font-semibold text-[#cdd8d4]">{bill.program}</p><p className="mt-0.5 text-[9px] text-[#718981]">{bill.glAccount}</p></td>
                    <td className="px-3 py-3.5 text-right font-mono text-xs font-semibold text-white">{moneyFull(billAmount(bill))}</td>
                    <td className={`px-3 py-3.5 text-[10px] ${isOverdue(bill) ? 'text-rose-200' : 'text-[#a9bbb5]'}`}>{formatDate(bill.dueDate)}</td>
                    <td className="px-3 py-3.5 text-[10px] text-[#a9bbb5]">{awaiting}</td>
                    <td className="px-3 py-3.5"><StatusPill status={bill.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <button type="button" onClick={() => dispatch({ type: 'select', id: bill.id })} className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] px-3 py-2 text-[9px] font-bold text-white hover:bg-white/[0.05]">
                        <Eye className="h-3 w-3" /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? <BillDrawer bill={selected} actingUser={actingUser} onClose={() => dispatch({ type: 'close' })} act={act} /> : null}
    </div>
  );
}

function BillDrawer({ bill, actingUser, onClose, act }: { bill: Bill; actingUser: ApUser; onClose: () => void; act: (a: Action) => void }) {
  const [mode, setMode] = useState<'idle' | 'reject' | 'requestChanges'>('idle');
  const [note, setNote] = useState('');
  const amount = billAmount(bill);
  const check = approvalCheck(bill, actingUser);
  const release = releaseCheck(bill, actingUser);
  const final = isFinalApproval(bill);
  const closeNote = () => { setMode('idle'); setNote(''); };

  const label9 = 'text-[9px] font-black uppercase tracking-wider text-[#718981]';
  const primaryBtn = 'inline-flex items-center gap-1.5 rounded-xl bg-[#b7e35b] px-4 py-2.5 text-[10px] font-black uppercase text-[#102016]';
  const ghostBtn = 'inline-flex items-center gap-1.5 rounded-xl border border-white/[0.12] px-4 py-2.5 text-[10px] font-black uppercase text-white hover:bg-white/[0.05]';
  const dangerBtn = 'inline-flex items-center gap-1.5 rounded-xl border border-rose-300/25 px-4 py-2.5 text-[10px] font-black uppercase text-rose-200 hover:bg-rose-300/[0.06]';

  return (
    <>
      <button className="fixed inset-0 z-[70] bg-black/60" aria-label="Close invoice" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[940px] flex-col bg-[#0d1614] shadow-[-20px_0_55px_rgba(0,0,0,.5)]">
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] bg-[#111b1a] px-6 py-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#718981]">{bill.id} · {bill.vendor}</p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-[-0.04em] text-white">{moneyFull(amount)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={bill.status} />
              {bill.restricted ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 px-2 py-1 text-[8px] font-black uppercase text-amber-100"><ShieldAlert className="h-3 w-3" /> Donor-restricted</span> : null}
              {isOverdue(bill) ? <span className="inline-flex items-center gap-1 rounded-full bg-rose-300/10 px-2 py-1 text-[8px] font-black uppercase text-rose-100"><AlertTriangle className="h-3 w-3" /> Overdue</span> : null}
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-xl border border-white/[0.1] p-2.5 text-[#94aaa3] hover:bg-white/[0.05]"><X className="h-4 w-4" /></button>
        </header>

        <div className="grid flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1.1fr_.9fr]">
          {/* Invoice facsimile */}
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#718981]"><FileText className="h-3.5 w-3.5" /> Source invoice</p>
            <div className="rounded-2xl border border-white/[0.09] bg-white p-6 text-[#1f2937]">
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-serif text-lg font-semibold">{bill.vendor}</p><p className="mt-1 max-w-[190px] text-[11px] text-gray-500">{bill.vendorAddress}</p></div>
                <div className="text-right"><p className="text-lg font-black tracking-[0.16em] text-gray-300">INVOICE</p>
                  <dl className="mt-2 space-y-0.5 text-[11px]">
                    <div className="flex justify-end gap-3"><dt className="text-gray-500">Invoice #</dt><dd className="min-w-[86px] text-right font-semibold">{bill.invoiceNumber}</dd></div>
                    <div className="flex justify-end gap-3"><dt className="text-gray-500">Date</dt><dd className="min-w-[86px] text-right font-semibold">{formatDate(bill.invoiceDate)}</dd></div>
                    <div className="flex justify-end gap-3"><dt className="text-gray-500">Due</dt><dd className="min-w-[86px] text-right font-semibold">{formatDate(bill.dueDate)}</dd></div>
                    {bill.poNumber ? <div className="flex justify-end gap-3"><dt className="text-gray-500">PO #</dt><dd className="min-w-[86px] text-right font-semibold">{bill.poNumber}</dd></div> : null}
                    <div className="flex justify-end gap-3"><dt className="text-gray-500">Terms</dt><dd className="min-w-[86px] text-right font-semibold">{bill.terms}</dd></div>
                  </dl>
                </div>
              </div>
              <div className="mt-5 rounded-lg bg-gray-50 px-3 py-2.5"><p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Bill to</p><p className="mt-0.5 text-sm font-semibold">International Mountain Bicycling Association</p><p className="text-[11px] text-gray-500">Accounts Payable Department</p></div>
              <table className="mt-4 w-full text-left text-[11px] tabular-nums">
                <thead><tr className="border-b border-gray-300 text-[9px] uppercase text-gray-400"><th className="py-1.5">Description</th><th className="py-1.5 text-right">Qty</th><th className="py-1.5 text-right">Unit</th><th className="py-1.5 text-right">Amount</th></tr></thead>
                <tbody>{bill.lineItems.map((li, i) => (<tr key={i} className="border-b border-gray-100"><td className="py-2">{li.description}</td><td className="py-2 text-right">{li.quantity}</td><td className="py-2 text-right">{moneyFull(li.unitPrice)}</td><td className="py-2 text-right">{moneyFull(li.quantity * li.unitPrice)}</td></tr>))}</tbody>
                <tfoot><tr><td colSpan={3} className="border-t-2 border-gray-800 py-2 text-right font-black">Total due</td><td className="border-t-2 border-gray-800 py-2 text-right text-sm font-black">{moneyFull(amount)}</td></tr></tfoot>
              </table>
            </div>
          </div>

          {/* Coding + approval + actions */}
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#718981]">Coding</p>
              <dl className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] bg-[#142321] px-4">
                {[['GL account', bill.glAccount], ['Program / fund', bill.program], ...(bill.project ? [['Project', bill.project]] : []), ['Restriction', bill.restricted ? 'Donor-restricted' : 'Unrestricted'], ['Entered by', userById(bill.enteredById).name]].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-2.5 text-[11px]"><dt className="text-[#82978f]">{k}</dt><dd className="text-right font-semibold text-white">{v}</dd></div>
                ))}
              </dl>
            </div>

            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#718981]">Approval chain</p>
              <div className="space-y-2">
                {bill.approvals.map((step, i) => {
                  const done = step.status === 'approved';
                  return (
                    <div key={i} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${done ? 'border-[#b7e35b]/20 bg-[#b7e35b]/[0.05]' : 'border-white/[0.08]'}`}>
                      {done ? <CheckCircle2 className="h-4 w-4 text-[#b7e35b]" /> : <PauseCircle className="h-4 w-4 text-amber-200" />}
                      <div><p className="text-[11px] font-semibold text-white">{step.role}</p><p className="text-[9px] text-[#82978f]">{done && step.approverId ? `${userById(step.approverId).name} · ${step.actedAt ? formatDate(step.actedAt) : ''}` : 'Pending'}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#718981]">History</p>
              <ul className="space-y-2">
                {bill.events.map((e, i) => (
                  <li key={i} className="flex gap-2.5"><span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${i === bill.events.length - 1 ? 'bg-[#b7e35b]' : 'bg-white/25'}`} /><div><p className="text-[11px] font-semibold text-white">{e.action}</p>{e.detail ? <p className="text-[10px] text-[#82978f]">{e.detail}</p> : null}<p className="text-[9px] text-[#5f736c]">{e.actor} · {formatDateTime(e.at)}</p></div></li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3 border-t border-white/[0.08] pt-4">
              {bill.status === 'Coded' ? (
                <button type="button" className={primaryBtn} onClick={() => act({ type: 'submit', id: bill.id })}><Send className="h-3.5 w-3.5" /> Submit for approval</button>
              ) : null}

              {bill.status === 'In review' && check.ok && mode === 'idle' ? (
                <>
                  <p className="flex items-center gap-2 rounded-xl bg-[#b7e35b]/[0.06] px-3 py-2.5 text-[11px] font-semibold text-[#dff7a8]"><CheckCircle2 className="h-3.5 w-3.5" /> {final ? 'Final approval — you decide pay or hold.' : check.reason}</p>
                  {final ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={primaryBtn} onClick={() => act({ type: 'pay', id: bill.id })}><CreditCard className="h-3.5 w-3.5" /> Approve &amp; Pay</button>
                        <button type="button" className={ghostBtn} onClick={() => act({ type: 'hold', id: bill.id })}><PauseCircle className="h-3.5 w-3.5" /> Approve &amp; Hold</button>
                        <button type="button" className={dangerBtn} onClick={() => setMode('reject')}><Ban className="h-3.5 w-3.5" /> Reject</button>
                      </div>
                      <p className="rounded-lg border-l-2 border-violet-300/40 bg-violet-300/[0.04] px-3 py-2 text-[10px] leading-4 text-[#9caaa6]">Approve &amp; Pay calls the Bill.com API to disburse and logs an outbound job on the IMBA-OS control plane. A person authorizes each payment.</p>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={primaryBtn} onClick={() => act({ type: 'advance', id: bill.id })}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</button>
                      <button type="button" className={ghostBtn} onClick={() => setMode('requestChanges')}><PenLine className="h-3.5 w-3.5" /> Request changes</button>
                      <button type="button" className={dangerBtn} onClick={() => setMode('reject')}><Ban className="h-3.5 w-3.5" /> Reject</button>
                    </div>
                  )}
                </>
              ) : null}

              {bill.status === 'In review' && !check.ok ? (
                <p className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[11px] text-[#c2b3a0]"><Lock className="h-3.5 w-3.5" /> {check.reason}</p>
              ) : null}

              {mode !== 'idle' ? (
                <div className="space-y-2">
                  <label className={label9} htmlFor="ap-note">{mode === 'reject' ? 'Reason for rejection' : 'What needs to change?'}</label>
                  <textarea id="ap-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-xl border border-white/[0.1] bg-[#14201e] px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-300/35" placeholder={mode === 'reject' ? 'e.g. Duplicate of BILL-1998' : 'e.g. Reallocate to 6420 · Construction Materials'} />
                  <div className="flex gap-2">
                    <button type="button" className={mode === 'reject' ? dangerBtn : primaryBtn} onClick={() => { act({ type: mode === 'reject' ? 'reject' : 'requestChanges', id: bill.id, note }); closeNote(); }}>Confirm {mode === 'reject' ? 'rejection' : 'change request'}</button>
                    <button type="button" className={ghostBtn} onClick={closeNote}>Cancel</button>
                  </div>
                </div>
              ) : null}

              {bill.status === 'On hold' ? (
                release.ok ? (
                  <>
                    <p className="flex items-center gap-2 rounded-xl bg-[#b7e35b]/[0.06] px-3 py-2.5 text-[11px] font-semibold text-[#dff7a8]"><PauseCircle className="h-3.5 w-3.5" /> Approved and held. Release when ready to pay.</p>
                    <button type="button" className={primaryBtn} onClick={() => act({ type: 'release', id: bill.id })}><CreditCard className="h-3.5 w-3.5" /> Release payment to Bill.com</button>
                  </>
                ) : (
                  <p className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[11px] text-[#c2b3a0]"><Lock className="h-3.5 w-3.5" /> {release.reason}</p>
                )
              ) : null}

              {bill.status === 'Paid' ? <p className="flex items-center gap-2 rounded-xl bg-[#b7e35b]/[0.06] px-3 py-2.5 text-[11px] font-semibold text-[#dff7a8]"><CheckCircle2 className="h-3.5 w-3.5" /> Paid via Bill.com. Settlement synced back to IMBA-OS.</p> : null}
              {bill.status === 'Rejected' ? <p className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[11px] text-[#c2b3a0]"><Ban className="h-3.5 w-3.5" /> Rejected. Return to the vendor or AP for correction.</p> : null}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
