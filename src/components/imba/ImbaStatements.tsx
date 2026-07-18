'use client';

import { useState } from 'react';
import { ReportPaper, StatementTable } from '@/components/report';
import { DrillableStatement } from '@/components/drillable-statement';
import { ReportToolbar } from '@/components/report-toolbar';
import {
  activitiesColumns,
  activitiesRows,
  budgetColumns,
  budgetRows,
  cashFlowColumns,
  cashFlowRows,
  positionColumns,
  positionRows,
  scenarioColumns,
  scenarioRows,
} from '@/lib/report-data';

/**
 * Financial statements — native IMBA-OS MONEY → Reports view.
 *
 * The dark cockpit chrome (tab bar + toolbar) wraps a white "report canvas" —
 * the same document pattern as the AP invoice viewer — so the statements read
 * as authentic QuickBooks-style reports while living inside the OS. Reuses the
 * report components and report-data.ts / drilldown-data.ts; no logic rewritten.
 */

type Tab = 'activities' | 'position' | 'cashflows' | 'budget';

const TABS: { key: Tab; label: string }[] = [
  { key: 'activities', label: 'Statement of Activities' },
  { key: 'position', label: 'Financial Position' },
  { key: 'cashflows', label: 'Cash Flows' },
  { key: 'budget', label: 'Budget vs. Actual' },
];

const toolbar: Record<Tab, { period: string; basis: string; targetId: string; filename: string }> = {
  activities: { period: 'FY 2022–2024', basis: 'Accrual basis · Public Form 990', targetId: 'soa', filename: 'imba-statement-of-activities' },
  position: { period: 'As of Dec 31, 2024', basis: 'Accrual basis · Public baseline', targetId: 'sfp', filename: 'imba-statement-of-financial-position' },
  cashflows: { period: 'Rolling · Reviewed monthly', basis: 'Accrual basis · Public baseline', targetId: 'scf', filename: 'imba-statement-of-cash-flows' },
  budget: { period: 'Twelve-month outlook', basis: 'Accrual basis · Illustrative forecast', targetId: 'bva', filename: 'imba-budget-vs-actual' },
};

export function ImbaStatements() {
  const [tab, setTab] = useState<Tab>('activities');
  const tb = toolbar[tab];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-[#111b1a]/90 p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-[11px] font-bold transition ${
              tab === t.key ? 'bg-[#b7e35b] text-[#102016]' : 'text-[#94a8a1] hover:bg-white/[0.05]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ReportToolbar period={tb.period} basis={tb.basis} targetId={tb.targetId} filename={tb.filename} />

      {tab === 'activities' ? (
        <ReportPaper
          id="soa"
          title="Statement of Activities"
          period="For the years ended December 31, 2022, 2023, and 2024"
          basis="Accrual basis · Amounts in U.S. dollars"
          footnote="Source: IMBA Form 990 filings. Click any figure to drill into its composition. Percent-of-revenue column reflects fiscal year 2024."
        >
          <DrillableStatement columns={activitiesColumns} rows={activitiesRows} />
        </ReportPaper>
      ) : null}

      {tab === 'position' ? (
        <ReportPaper
          id="sfp"
          title="Statement of Financial Position"
          period="As of December 31, 2024"
          basis="Accrual basis · Amounts in U.S. dollars"
          footnote="Total net assets of $3,754,879 reconcile to the FY 2024 Form 990. Asset detail requires the general ledger (Connect GL)."
        >
          <StatementTable columns={positionColumns} rows={positionRows} />
        </ReportPaper>
      ) : null}

      {tab === 'cashflows' ? (
        <ReportPaper
          id="scf"
          title="Statement of Cash Flows"
          period="Deployable liquidity bridge"
          basis="Accrual basis · Amounts in U.S. dollars"
          footnote="Constraints reduce gross resources to deployable liquidity. Final output depends on beginning cash and project estimates to complete."
        >
          <StatementTable columns={cashFlowColumns} rows={cashFlowRows} />
        </ReportPaper>
      ) : null}

      {tab === 'budget' ? (
        <ReportPaper
          id="bva"
          title="Budget vs. Actual"
          period="Twelve-month operating outlook"
          basis="Accrual basis · Amounts in U.S. dollars"
          footnote="Variance is forecast less budget. The forecast column is the probability weighting of the downside, base, and stretch scenarios."
        >
          <StatementTable columns={budgetColumns} rows={budgetRows} />
          <div className="report-subtable">
            <StatementTable columns={scenarioColumns} rows={scenarioRows} />
          </div>
        </ReportPaper>
      ) : null}
    </div>
  );
}
