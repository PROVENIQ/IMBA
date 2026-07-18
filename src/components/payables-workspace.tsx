'use client';

import { useMemo, useReducer, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  Landmark,
  Lock,
  PauseCircle,
  PenLine,
  Send,
  ShieldAlert,
  Wallet,
  X,
} from 'lucide-react';
import { MetricCard } from '@/components/ui';
import { connectorByKey } from '@/lib/connectors';
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

// --- State machine ---------------------------------------------------------

type State = { bills: Bill[]; selectedId: string | null; actingUserId: string };

type Action =
  | { type: 'select'; id: string }
  | { type: 'close' }
  | { type: 'setUser'; id: string }
  | { type: 'submit'; id: string }
  | { type: 'advance'; id: string } // intermediate approval — route to next approver
  | { type: 'pay'; id: string } // final approval → pay now via Bill.com
  | { type: 'hold'; id: string } // final approval → approved but payment held
  | { type: 'release'; id: string } // release a held bill for payment
  | { type: 'reject'; id: string; note: string }
  | { type: 'requestChanges'; id: string; note: string };

function now(): string {
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
      return { ...step, status: 'approved' as const, approverId: actor.id, actedAt: now() };
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
        withEvent({ ...bill, status: 'In review' }, { at: now(), actor: actor.name, action: 'Submitted for approval' }),
      );

    case 'advance':
      return update(action.id, (bill) => {
        if (!approvalCheck(bill, actor).ok) return bill;
        const role = currentStep(bill)?.role ?? actor.role;
        return withEvent(
          { ...bill, approvals: approveCurrent(bill, actor) },
          { at: now(), actor: actor.name, action: `Approved (${role})`, detail: 'Routed to next approver' },
        );
      });

    case 'pay':
      return update(action.id, (bill) => {
        if (!approvalCheck(bill, actor).ok) return bill;
        const role = currentStep(bill)?.role ?? actor.role;
        return withEvent(
          { ...bill, approvals: approveCurrent(bill, actor), status: 'Paid', syncedToBillPay: true },
          { at: now(), actor: actor.name, action: `Approved & paid (${role})`, detail: 'Payment initiated via Bill.com API' },
        );
      });

    case 'hold':
      return update(action.id, (bill) => {
        if (!approvalCheck(bill, actor).ok) return bill;
        const role = currentStep(bill)?.role ?? actor.role;
        return withEvent(
          { ...bill, approvals: approveCurrent(bill, actor), status: 'On hold' },
          { at: now(), actor: actor.name, action: `Approved & held (${role})`, detail: 'Awaiting release to Bill.com' },
        );
      });

    case 'release':
      return update(action.id, (bill) => {
        if (!releaseCheck(bill, actor).ok) return bill;
        return withEvent(
          { ...bill, status: 'Paid', syncedToBillPay: true },
          { at: now(), actor: actor.name, action: 'Payment released', detail: 'Released to Bill.com via API' },
        );
      });

    case 'reject':
      return update(action.id, (bill) =>
        withEvent(
          { ...bill, status: 'Rejected' },
          { at: now(), actor: actor.name, action: 'Rejected', detail: action.note || undefined },
        ),
      );

    case 'requestChanges':
      return update(action.id, (bill) =>
        withEvent(
          {
            ...bill,
            status: 'Coded',
            approvals: bill.approvals.map((step) => ({ role: step.role, status: 'pending' as const })),
          },
          { at: now(), actor: actor.name, action: 'Requested changes', detail: action.note || undefined },
        ),
      );

    default:
      return state;
  }
}

// --- Presentation helpers --------------------------------------------------

const statusSlug: Record<BillStatus, string> = {
  Draft: 'draft',
  Coded: 'coded',
  'In review': 'review',
  'On hold': 'hold',
  Paid: 'paid',
  Rejected: 'rejected',
};

function StatusPill({ status }: { status: BillStatus }) {
  return <span className={`ap-pill ap-${statusSlug[status]}`}>{status}</span>;
}

function isOverdue(bill: Bill): boolean {
  if (bill.status === 'Paid' || bill.status === 'Rejected') return false;
  return new Date(bill.dueDate) < new Date('2026-07-17');
}

// --- Invoice facsimile (the "actual invoice") ------------------------------

function InvoiceDocument({ bill }: { bill: Bill }) {
  const amount = billAmount(bill);
  return (
    <div className="invoice-doc">
      <div className="invoice-watermark">Illustrative sample</div>
      <div className="invoice-top">
        <div>
          <p className="invoice-vendor">{bill.vendor}</p>
          <p className="invoice-vendor-addr">{bill.vendorAddress}</p>
        </div>
        <div className="invoice-meta">
          <p className="invoice-word">INVOICE</p>
          <dl>
            <div><dt>Invoice #</dt><dd>{bill.invoiceNumber}</dd></div>
            <div><dt>Invoice date</dt><dd>{formatDate(bill.invoiceDate)}</dd></div>
            <div><dt>Due date</dt><dd>{formatDate(bill.dueDate)}</dd></div>
            {bill.poNumber ? <div><dt>PO #</dt><dd>{bill.poNumber}</dd></div> : null}
            <div><dt>Terms</dt><dd>{bill.terms}</dd></div>
          </dl>
        </div>
      </div>

      <div className="invoice-billto">
        <span>Bill to</span>
        <strong>International Mountain Bicycling Association</strong>
        <p>Accounts Payable Department</p>
      </div>

      <table className="invoice-lines">
        <thead>
          <tr>
            <th>Description</th>
            <th className="num">Qty</th>
            <th className="num">Unit price</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.lineItems.map((item, index) => (
            <tr key={index}>
              <td>{item.description}</td>
              <td className="num">{item.quantity}</td>
              <td className="num">{moneyFull(item.unitPrice)}</td>
              <td className="num">{moneyFull(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="num">Total due</td>
            <td className="num invoice-total">{moneyFull(amount)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="invoice-remit">Remit to {bill.vendor} · {bill.terms} · Reference {bill.invoiceNumber} on payment.</p>
    </div>
  );
}

// --- Approval + coding side panel ------------------------------------------

function ApprovalTrail({ bill }: { bill: Bill }) {
  return (
    <div className="ap-trail">
      <div className="ap-chain">
        {bill.approvals.map((step, index) => {
          const done = step.status === 'approved';
          return (
            <div className={`ap-chain-step ${done ? 'is-done' : 'is-pending'}`} key={index}>
              {done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
              <div>
                <strong>{step.role}</strong>
                <span>
                  {done && step.approverId
                    ? `${userById(step.approverId).name} · ${step.actedAt ? formatDate(step.actedAt) : ''}`
                    : 'Pending'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <ul className="ap-audit">
        {bill.events.map((event, index) => (
          <li key={index}>
            <span className="ap-audit-dot" />
            <div>
              <strong>{event.action}</strong>
              {event.detail ? <p>{event.detail}</p> : null}
              <span className="ap-audit-meta">{event.actor} · {formatDateTime(event.at)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Drawer ----------------------------------------------------------------

function BillDrawer({
  bill,
  actingUser,
  onClose,
  dispatch,
}: {
  bill: Bill;
  actingUser: ApUser;
  onClose: () => void;
  dispatch: React.Dispatch<Action>;
}) {
  const [mode, setMode] = useState<'idle' | 'reject' | 'requestChanges'>('idle');
  const [note, setNote] = useState('');

  const amount = billAmount(bill);
  const check = approvalCheck(bill, actingUser);
  const release = releaseCheck(bill, actingUser);
  const final = isFinalApproval(bill);
  const billpay = connectorByKey('billcom');

  const closeNote = () => {
    setMode('idle');
    setNote('');
  };

  return (
    <>
      <button className="ap-scrim" aria-label="Close invoice" onClick={onClose} />
      <aside className="ap-drawer" role="dialog" aria-label={`Invoice ${bill.invoiceNumber}`}>
        <header className="ap-drawer-head">
          <div>
            <p className="ap-drawer-eyebrow">{bill.id} · {bill.vendor}</p>
            <h2>{moneyFull(amount)}</h2>
            <div className="ap-drawer-tags">
              <StatusPill status={bill.status} />
              {bill.restricted ? <span className="ap-flag"><ShieldAlert size={13} /> Donor-restricted</span> : null}
              {isOverdue(bill) ? <span className="ap-flag ap-flag-red"><AlertTriangle size={13} /> Overdue</span> : null}
            </div>
          </div>
          <button className="ap-icon-btn" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="ap-drawer-body">
          <div className="ap-doc-col">
            <p className="ap-col-label"><FileText size={14} /> Source invoice</p>
            <InvoiceDocument bill={bill} />
          </div>

          <div className="ap-side-col">
            <p className="ap-col-label"><ClipboardList size={14} /> Coding</p>
            <dl className="ap-coding">
              <div><dt>GL account</dt><dd>{bill.glAccount}</dd></div>
              <div><dt>Program / fund</dt><dd>{bill.program}</dd></div>
              {bill.project ? <div><dt>Project</dt><dd>{bill.project}</dd></div> : null}
              <div><dt>Restriction</dt><dd>{bill.restricted ? 'Donor-restricted' : 'Unrestricted'}</dd></div>
              <div><dt>Entered by</dt><dd>{userById(bill.enteredById).name}</dd></div>
            </dl>

            <p className="ap-col-label"><CheckCircle2 size={14} /> Approval &amp; history</p>
            <ApprovalTrail bill={bill} />

            <div className="ap-actions">
              {bill.status === 'Coded' ? (
                <button className="ap-btn ap-btn-primary" onClick={() => dispatch({ type: 'submit', id: bill.id })}>
                  <Send size={15} /> Submit for approval
                </button>
              ) : null}

              {bill.status === 'In review' && check.ok && mode === 'idle' ? (
                <>
                  <p className="ap-auth-ok">
                    <CheckCircle2 size={14} />
                    {final ? 'Final approval — you decide whether to pay now or hold.' : check.reason}
                  </p>
                  {final ? (
                    <>
                      <div className="ap-btn-row">
                        <button className="ap-btn ap-btn-primary" onClick={() => dispatch({ type: 'pay', id: bill.id })}>
                          <CreditCard size={15} /> Approve &amp; Pay
                        </button>
                        <button className="ap-btn" onClick={() => dispatch({ type: 'hold', id: bill.id })}>
                          <PauseCircle size={15} /> Approve &amp; Hold
                        </button>
                        <button className="ap-btn ap-btn-danger" onClick={() => setMode('reject')}>
                          <Ban size={15} /> Reject
                        </button>
                      </div>
                      <p className="ap-api-note">
                        Approve &amp; Pay calls the {billpay?.name} API to disburse. A person authorizes each payment—IMBA-OS never moves money on its own.
                      </p>
                    </>
                  ) : (
                    <div className="ap-btn-row">
                      <button className="ap-btn ap-btn-primary" onClick={() => dispatch({ type: 'advance', id: bill.id })}>
                        <CheckCircle2 size={15} /> Approve
                      </button>
                      <button className="ap-btn" onClick={() => setMode('requestChanges')}>
                        <PenLine size={15} /> Request changes
                      </button>
                      <button className="ap-btn ap-btn-danger" onClick={() => setMode('reject')}>
                        <Ban size={15} /> Reject
                      </button>
                    </div>
                  )}
                </>
              ) : null}

              {bill.status === 'In review' && !check.ok ? (
                <p className="ap-auth-block"><Lock size={14} /> {check.reason}</p>
              ) : null}

              {mode !== 'idle' ? (
                <div className="ap-note-box">
                  <label htmlFor="ap-note">{mode === 'reject' ? 'Reason for rejection' : 'What needs to change?'}</label>
                  <textarea
                    id="ap-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={mode === 'reject' ? 'e.g. Duplicate of BILL-1998' : 'e.g. Reallocate to 6420 · Construction Materials'}
                    rows={3}
                  />
                  <div className="ap-btn-row">
                    <button
                      className={`ap-btn ${mode === 'reject' ? 'ap-btn-danger' : 'ap-btn-primary'}`}
                      onClick={() => {
                        dispatch({ type: mode === 'reject' ? 'reject' : 'requestChanges', id: bill.id, note });
                        closeNote();
                      }}
                    >
                      Confirm {mode === 'reject' ? 'rejection' : 'change request'}
                    </button>
                    <button className="ap-btn" onClick={closeNote}>Cancel</button>
                  </div>
                </div>
              ) : null}

              {bill.status === 'On hold' ? (
                release.ok ? (
                  <div className="ap-handoff">
                    <p className="ap-auth-ok"><PauseCircle size={14} /> Approved and held. Release when ready to pay.</p>
                    <button className="ap-btn ap-btn-primary" onClick={() => dispatch({ type: 'release', id: bill.id })}>
                      <CreditCard size={15} /> Release payment to {billpay?.name}
                    </button>
                    <p className="ap-api-note">Release calls the {billpay?.name} API to disburse.</p>
                  </div>
                ) : (
                  <p className="ap-auth-block"><Lock size={14} /> {release.reason}</p>
                )
              ) : null}

              {bill.status === 'Paid' ? (
                <p className="ap-auth-ok"><CheckCircle2 size={14} /> Paid via {billpay?.name}. Settlement synced back to IMBA-OS.</p>
              ) : null}

              {bill.status === 'Rejected' ? (
                <p className="ap-auth-block"><Ban size={14} /> Rejected. Return to the vendor or AP for correction.</p>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// --- Workspace -------------------------------------------------------------

export function PayablesWorkspace() {
  const [state, dispatch] = useReducer(reducer, {
    bills: seedBills,
    selectedId: null,
    actingUserId: 'u-kent',
  });

  const actingUser = userById(state.actingUserId);
  const selectedBill = state.bills.find((bill) => bill.id === state.selectedId) ?? null;

  const metrics = useMemo(() => {
    const open = state.bills.filter((bill) => ['Coded', 'In review', 'On hold'].includes(bill.status));
    const openTotal = open.reduce((sum, bill) => sum + billAmount(bill), 0);
    const awaitingMe = state.bills.filter(
      (bill) => approvalCheck(bill, actingUser).ok || releaseCheck(bill, actingUser).ok,
    ).length;
    const overdue = state.bills.filter(isOverdue).length;
    const held = state.bills.filter((bill) => bill.status === 'On hold');
    const heldTotal = held.reduce((sum, bill) => sum + billAmount(bill), 0);
    return { openTotal, openCount: open.length, awaitingMe, overdue, heldTotal, heldCount: held.length };
  }, [state.bills, actingUser]);

  return (
    <>
      <div className="ap-toolbar">
        <div className="ap-actas">
          <span className="ap-actas-label">Acting as</span>
          <div className="ap-actas-users">
            {apUsers.map((user) => (
              <button
                key={user.id}
                className={`ap-actas-btn ${user.id === state.actingUserId ? 'is-active' : ''}`}
                onClick={() => dispatch({ type: 'setUser', id: user.id })}
              >
                <span className="ap-avatar">{user.initials}</span>
                <span className="ap-actas-name"><strong>{user.name}</strong><span>{user.role}</span></span>
              </button>
            ))}
          </div>
        </div>
        <div className="ap-connector-chip">
          <Landmark size={15} />
          <div>
            <strong>Bill.com</strong>
            <span>Payment connector · demo</span>
          </div>
          <span className="ap-connector-dot" />
        </div>
      </div>

      <section className="metric-grid" aria-label="Payables summary">
        <MetricCard label="Open payables" value={moneyFull(metrics.openTotal)} detail={`${metrics.openCount} bills in the pipeline`} icon={Wallet} tone="blue" />
        <MetricCard label="Awaiting my decision" value={String(metrics.awaitingMe)} detail={`As ${actingUser.role}`} icon={CheckCircle2} tone={metrics.awaitingMe ? 'amber' : 'green'} />
        <MetricCard label="Overdue" value={String(metrics.overdue)} detail="Past due date, not yet paid" icon={AlertTriangle} tone={metrics.overdue ? 'red' : 'neutral'} />
        <MetricCard label="Approved on hold" value={moneyFull(metrics.heldTotal)} detail={`${metrics.heldCount} awaiting release to Bill.com`} icon={PauseCircle} tone={metrics.heldCount ? 'amber' : 'neutral'} />
      </section>

      <section className="panel table-panel">
        <div className="table-scroll">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Vendor / Invoice</th>
                <th>Program &amp; GL</th>
                <th className="num">Amount</th>
                <th>Due</th>
                <th>Awaiting</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {state.bills.map((bill) => {
                const step = currentStep(bill);
                const awaiting =
                  bill.status === 'In review' && step ? step.role : bill.status === 'On hold' ? 'Release' : '—';
                return (
                  <tr key={bill.id} className={state.selectedId === bill.id ? 'is-selected' : ''}>
                    <td>
                      <strong>{bill.vendor}</strong>
                      <span>{bill.invoiceNumber} · {bill.id}</span>
                    </td>
                    <td>
                      <strong className="ap-cell-strong">{bill.program}</strong>
                      <span>{bill.glAccount}</span>
                    </td>
                    <td className="num ap-amount">{moneyFull(billAmount(bill))}</td>
                    <td className={isOverdue(bill) ? 'ap-due-over' : ''}>{formatDate(bill.dueDate)}</td>
                    <td>{awaiting}</td>
                    <td><StatusPill status={bill.status} /></td>
                    <td className="num">
                      <button className="ap-view-btn" onClick={() => dispatch({ type: 'select', id: bill.id })}>
                        View <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedBill ? (
        <BillDrawer
          bill={selectedBill}
          actingUser={actingUser}
          onClose={() => dispatch({ type: 'close' })}
          dispatch={dispatch}
        />
      ) : null}
    </>
  );
}
