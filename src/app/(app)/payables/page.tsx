import { DataNotice, PageHeader } from '@/components/ui';
import { PayablesWorkspace } from '@/components/payables-workspace';

export default function PayablesPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Accounts payable"
        title="Approve and pay—without leaving your dashboard."
        description="AP submits and codes bills; the approver decides Approve & Pay, Approve & Hold, or Reject right here, and that call reaches Bill.com by API. Segregation of duties holds because the submitter is never the approver—no one logs into two systems to do their job."
        action={<span className="scenario-badge">Illustrative payables</span>}
      />

      <DataNotice>
        <strong>Prototype boundary:</strong> vendors and invoices below are illustrative. Approvals are fully interactive in this session—switch the <em>Acting as</em> user (Dana submits, Marcus is Finance Manager, Kent is the CEO approver) to see role, approval-limit, and segregation-of-duties gating. No real payment is made; the Bill.com API call is a stub.
      </DataNotice>

      <PayablesWorkspace />
    </div>
  );
}
