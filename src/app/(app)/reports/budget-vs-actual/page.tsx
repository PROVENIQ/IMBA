import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { DataNotice, PageHeader } from '@/components/ui';
import { ReportPaper, StatementTable } from '@/components/report';
import { ReportToolbar } from '@/components/report-toolbar';
import { budgetColumns, budgetRows, scenarioColumns, scenarioRows } from '@/lib/report-data';

const PERIOD = 'Twelve-month outlook';
const BASIS = 'Accrual basis · Illustrative forecast';

export default function BudgetVsActualPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Budget report"
        title="Budget vs. Actual"
        description="The base-case operating budget measured against the probability-weighted forecast, with dollar and percent variance—plus the underlying downside, base, and stretch scenarios."
        action={
          <Link href="/reports" className="report-back">
            <ChevronLeft size={15} /> Report center
          </Link>
        }
      />

      <DataNotice>
        Scenario values demonstrate the decision framework and are <strong>not</strong> IMBA management forecasts. The forecast column is the probability weighting of the downside, base, and stretch cases shown below.
      </DataNotice>

      <ReportToolbar period={PERIOD} basis={BASIS} targetId="bva" filename="imba-budget-vs-actual" />

      <ReportPaper
        id="bva"
        title="Budget vs. Actual"
        period="Twelve-month operating outlook"
        basis="Accrual basis · Amounts in U.S. dollars"
        footnote="Variance is forecast less budget. A negative change-in-net-assets variance indicates the weighted forecast falls below the base-case budget."
      >
        <StatementTable columns={budgetColumns} rows={budgetRows} />
        <div className="report-subtable">
          <StatementTable columns={scenarioColumns} rows={scenarioRows} />
        </div>
      </ReportPaper>
    </div>
  );
}
