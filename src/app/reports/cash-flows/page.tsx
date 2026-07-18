import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { DataNotice, PageHeader } from '@/components/ui';
import { ReportPaper, StatementTable } from '@/components/report';
import { ReportToolbar } from '@/components/report-toolbar';
import { cashFlowColumns, cashFlowRows } from '@/lib/report-data';

const PERIOD = 'Rolling · Reviewed monthly';
const BASIS = 'Accrual basis · Public baseline';

export default function CashFlowsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Financial statement"
        title="Statement of Cash Flows"
        description="A deployable-cash bridge that moves from gross resources through donor restrictions, chapter obligations, deferred revenue, completion costs, and the reserve floor to the liquidity leadership can responsibly allocate."
        action={
          <Link href="/reports" className="report-back">
            <ChevronLeft size={15} /> Report center
          </Link>
        }
      />

      <DataNotice>
        Restriction, chapter, and deferred-revenue figures are 2024 public balance-sheet items. Beginning cash, completion cost, and the reserve policy require the general ledger and project system, shown as <em>Connect GL</em> / <em>Connect PM</em>.
      </DataNotice>

      <ReportToolbar period={PERIOD} basis={BASIS} targetId="scf" filename="imba-statement-of-cash-flows" />

      <ReportPaper
        id="scf"
        title="Statement of Cash Flows"
        period="Deployable liquidity bridge"
        basis="Accrual basis · Amounts in U.S. dollars"
        footnote="Constraints reduce gross resources to deployable liquidity. Final output depends on beginning cash, receivables aging, and project estimates to complete."
      >
        <StatementTable columns={cashFlowColumns} rows={cashFlowRows} />
      </ReportPaper>
    </div>
  );
}
