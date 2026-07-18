'use client';

import { Download, Printer } from 'lucide-react';

/**
 * Report action bar shown above a statement. Print uses the browser's print
 * dialog (report print CSS hides the app chrome); Export serializes every
 * table inside the target report container to a CSV download — no data needs to
 * be threaded through, it reads the rendered DOM.
 */
export function ReportToolbar({
  period,
  basis,
  targetId,
  filename,
}: {
  period: string;
  basis: string;
  targetId: string;
  filename: string;
}) {
  function handlePrint() {
    window.print();
  }

  function handleExport() {
    const container = document.getElementById(targetId);
    if (!container) return;

    const lines: string[] = [];
    container.querySelectorAll('table').forEach((table) => {
      table.querySelectorAll('tr').forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll('th, td')).map((cell) => {
          const text = (cell.textContent ?? '').replace(/\s+/g, ' ').trim();
          return `"${text.replace(/"/g, '""')}"`;
        });
        if (cells.some((cell) => cell !== '""')) lines.push(cells.join(','));
      });
      lines.push('');
    });

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="report-toolbar">
      <div className="report-toolbar-meta">
        <span className="report-period-label">{period}</span>
        <span className="basis-pill">{basis}</span>
      </div>
      <div className="report-toolbar-actions">
        <button type="button" className="report-btn" onClick={handleExport}>
          <Download size={15} /> Export CSV
        </button>
        <button type="button" className="report-btn report-btn-primary" onClick={handlePrint}>
          <Printer size={15} /> Print
        </button>
      </div>
    </div>
  );
}
