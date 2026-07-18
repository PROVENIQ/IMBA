import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { DataNotice, PageHeader } from '@/components/ui';
import { ReportPaper } from '@/components/report';
import { DrillableStatement } from '@/components/drillable-statement';
import { ReportToolbar } from '@/components/report-toolbar';
import { activitiesColumns, activitiesRows } from '@/lib/report-data';

const PERIOD = 'January 1 – December 31 · FY 2022–2024';
const BASIS = 'Accrual basis · Public Form 990';

export default function StatementOfActivitiesPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Financial statement"
        title="Statement of Activities"
        description="The nonprofit equivalent of a Profit & Loss—revenue and support by source, operating expenses, and the resulting change in net assets across three years."
        action={
          <Link href="/reports" className="report-back">
            <ChevronLeft size={15} /> Report center
          </Link>
        }
      />

      <DataNotice>
        Comparative figures are IMBA&rsquo;s published Form 990 totals. Membership and other revenue is the reconciling balance between total revenue and the reported contribution and program-service lines. <strong>Click any figure to drill into its composition.</strong>
      </DataNotice>

      <ReportToolbar period={PERIOD} basis={BASIS} targetId="soa" filename="imba-statement-of-activities" />

      <ReportPaper
        id="soa"
        title="Statement of Activities"
        period="For the years ended December 31, 2022, 2023, and 2024"
        basis="Accrual basis · Amounts in U.S. dollars"
        footnote="Source: IMBA Form 990 filings, FY 2018–2024. Percent-of-revenue column reflects fiscal year 2024."
      >
        <DrillableStatement columns={activitiesColumns} rows={activitiesRows} />
      </ReportPaper>
    </div>
  );
}
