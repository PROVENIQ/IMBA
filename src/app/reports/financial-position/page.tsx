import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { DataNotice, PageHeader } from '@/components/ui';
import { ReportPaper, StatementTable } from '@/components/report';
import { ReportToolbar } from '@/components/report-toolbar';
import { positionColumns, positionRows } from '@/lib/report-data';

const PERIOD = 'As of December 31, 2024';
const BASIS = 'Accrual basis · Public baseline';

export default function FinancialPositionPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Financial statement"
        title="Statement of Financial Position"
        description="A balance-sheet view of assets, identified commitments, and net assets separated by donor restriction—the nonprofit distinction between total resources and freely deployable capacity."
        action={
          <Link href="/reports" className="report-back">
            <ChevronLeft size={15} /> Report center
          </Link>
        }
      />

      <DataNotice>
        Net assets and known commitments are drawn from IMBA&rsquo;s 2024 public data and foot to reported total net assets. Asset detail and remaining liabilities require the general ledger and are labeled <em>Connect GL</em>.
      </DataNotice>

      <ReportToolbar period={PERIOD} basis={BASIS} targetId="sfp" filename="imba-statement-of-financial-position" />

      <ReportPaper
        id="sfp"
        title="Statement of Financial Position"
        period="As of December 31, 2024"
        basis="Accrual basis · Amounts in U.S. dollars"
        footnote="Without / with donor restriction split per FASB ASU 2016-14. Total net assets of $3,754,879 reconcile to the FY 2024 Form 990."
      >
        <StatementTable columns={positionColumns} rows={positionRows} />
      </ReportPaper>
    </div>
  );
}
