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

export type ImbaStatementTab = 'activities' | 'position' | 'cashflows' | 'budget';

const TABS: { key: ImbaStatementTab; label: string }[] = [
  { key: 'activities', label: 'Statement of Activities' },
  { key: 'position', label: 'Financial Position' },
  { key: 'cashflows', label: 'Cash Flows' },
  { key: 'budget', label: 'Budget vs. Actual' },
];

const toolbar: Record<ImbaStatementTab, { period: string; basis: string; targetId: string; filename: string }> = {
  activities: { period: 'FY 2022–2024', basis: 'GAAP · FASB ASC 958 · Public Form 990', targetId: 'soa', filename: 'imba-statement-of-activities' },
  position: { period: 'As of Dec 31, 2024', basis: 'GAAP · FASB ASC 958 · Public baseline', targetId: 'sfp', filename: 'imba-statement-of-financial-position' },
  cashflows: { period: 'Rolling · Reviewed monthly', basis: 'GAAP · FASB ASC 958 · Public baseline', targetId: 'scf', filename: 'imba-statement-of-cash-flows' },
  budget: { period: 'Twelve-month outlook', basis: 'Accrual basis · Illustrative forecast', targetId: 'bva', filename: 'imba-budget-vs-actual' },
};

export function ImbaStatementOutput({ tab }: { tab: ImbaStatementTab }) {
  const tb = toolbar[tab];

  return (
    <div className="space-y-5">
      <ReportToolbar period={tb.period} basis={tb.basis} targetId={tb.targetId} filename={tb.filename} />

      {tab === 'activities' ? (
        <ReportPaper
          id="soa"
          title="Statement of Activities"
          period="For the years ended December 31, 2022, 2023, and 2024"
          basis="Accrual basis · U.S. GAAP (FASB ASC 958) · Amounts in U.S. dollars"
          footnote="Prepared on the accrual basis in accordance with U.S. GAAP (FASB ASC 958-205); net assets are classified as with and without donor restrictions. Prior-year figures tie to IMBA's filed Forms 990 (EIN 47-1254119). Click any figure to drill into its composition. Percent-of-revenue column reflects fiscal year 2024."
        >
          <DrillableStatement columns={activitiesColumns} rows={activitiesRows} />
        </ReportPaper>
      ) : null}

      {tab === 'position' ? (
        <ReportPaper
          id="sfp"
          title="Statement of Financial Position"
          period="As of December 31, 2024"
          basis="Accrual basis · U.S. GAAP (FASB ASC 958) · Amounts in U.S. dollars"
          footnote="Net assets are presented in two classes per FASB ASC 958 — without and with donor restrictions. Total net assets of $3,754,879 reconcile to the FY 2024 Form 990. Asset detail requires the general ledger (Connect GL)."
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

export function ImbaStatements() {
  const [tab, setTab] = useState<ImbaStatementTab>('activities');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--card)/90%)] p-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-[11px] font-bold transition ${
              tab === t.key ? 'bg-[rgb(var(--sa))] text-[rgb(var(--sa-ink))]' : 'text-[rgb(var(--text-2))] hover:bg-[rgb(var(--line)/0.05)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ImbaStatementOutput tab={tab} />
    </div>
  );
}
