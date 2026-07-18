import Link from 'next/link';
import { ArrowUpRight, BarChart4, FileSpreadsheet, Scale, Wallet } from 'lucide-react';
import { DataNotice, PageHeader, SectionHeading } from '@/components/ui';

const reports = [
  {
    href: '/reports/statement-of-activities',
    icon: FileSpreadsheet,
    group: 'Financial statements',
    title: 'Statement of Activities',
    copy: 'Nonprofit Profit & Loss: contributions, program revenue, and expenses with a three-year comparison and % of revenue.',
    meta: 'FY 2022–2024 · Accrual basis',
  },
  {
    href: '/reports/financial-position',
    icon: Scale,
    group: 'Financial statements',
    title: 'Statement of Financial Position',
    copy: 'Balance-sheet view of assets, identified commitments, and net assets by donor restriction.',
    meta: 'As of Dec 31, 2024',
  },
  {
    href: '/reports/cash-flows',
    icon: Wallet,
    group: 'Cash & liquidity',
    title: 'Statement of Cash Flows',
    copy: 'Deployable-cash bridge from gross resources to the liquidity leadership can responsibly allocate.',
    meta: 'Rolling · Accrual basis',
  },
  {
    href: '/reports/budget-vs-actual',
    icon: BarChart4,
    group: 'Budgets & forecasts',
    title: 'Budget vs. Actual',
    copy: 'Base-case budget against the probability-weighted forecast with dollar and percent variance.',
    meta: 'Twelve-month outlook',
  },
];

export default function ReportsCenterPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Report center"
        title="Statement-grade financial reports."
        description="Formal financial statements rendered from IMBA's published results—formatted, footed, and ready to print or export for the board packet."
        action={<span className="source-chip">Accrual basis</span>}
      />

      <DataNotice>
        <strong>Prototype boundary:</strong> statements are built from IMBA&rsquo;s public Form 990 history and 2025 annual report. Lines requiring the general ledger or project system are labeled <em>Connect GL</em> / <em>Connect PM</em> rather than estimated.
      </DataNotice>

      <section>
        <SectionHeading title="Available reports" description="Select a statement to open, print, or export it." />
        <div className="report-center-grid">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Link href={report.href} className="report-center-card" key={report.href}>
                <div className="report-center-icon"><Icon size={20} /></div>
                <div className="report-center-body">
                  <span className="report-center-group">{report.group}</span>
                  <h3>{report.title}</h3>
                  <p>{report.copy}</p>
                  <span className="report-center-meta">{report.meta}</span>
                </div>
                <ArrowUpRight size={16} className="report-center-arrow" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
