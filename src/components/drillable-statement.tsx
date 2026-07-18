'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Cell, ReportColumn, ReportRow } from '@/components/report';
import { accounting, pct } from '@/lib/imba-data';
import { DRILLABLE_LABELS, buildDrill } from '@/lib/drilldown-data';

/**
 * Interactive Statement of Activities: numeric cells on drillable rows become
 * buttons that open a QuickZoom-style composition panel. Mirrors StatementTable's
 * markup/classes so the printed and interactive versions look identical.
 */

function formatCurrency(value: number, symbol: boolean): string {
  return accounting(value, { symbol });
}

function amountClass(column: ReportColumn, value: Cell): string {
  const classes = ['num'];
  if (typeof value === 'number' && value < 0) classes.push('is-neg');
  if (column.format === 'percent') classes.push('is-pct');
  return classes.join(' ');
}

export function DrillableStatement({
  columns,
  rows,
}: {
  columns: ReportColumn[];
  rows: ReportRow[];
}) {
  const [drill, setDrill] = useState<{ label: string; year: number } | null>(null);
  const [labelColumn, ...amountColumns] = columns;

  const drillData = drill ? buildDrill(drill.label, drill.year) : null;

  return (
    <>
      <div className="table-scroll">
        <table className="report-table">
          <thead>
            <tr>
              <th className="acct-head">{labelColumn.label}</th>
              {amountColumns.map((column) => (
                <th key={column.key} className={column.format === 'percent' ? 'num is-pct' : 'num'}>
                  {column.label}
                  {column.note ? <span className="col-note">{column.note}</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              if (row.kind === 'blank') {
                return (
                  <tr className="report-blank" key={`blank-${index}`}>
                    <td colSpan={columns.length} />
                  </tr>
                );
              }
              if (row.kind === 'section') {
                return (
                  <tr className="report-section" key={`section-${index}`}>
                    <td className="acct">{row.label}</td>
                    {amountColumns.map((column) => (
                      <td key={column.key} className="num" />
                    ))}
                  </tr>
                );
              }

              const isSummary = row.kind === 'subtotal' || row.kind === 'total';
              const rowClass =
                row.kind === 'subtotal' ? 'report-subtotal' : row.kind === 'total' ? 'report-total' : 'report-account';
              const depth = row.kind === 'account' ? row.depth ?? 0 : 0;
              const showSymbol = isSummary || (row.kind === 'account' && Boolean(row.symbol));
              const drillable = DRILLABLE_LABELS.has(row.label);

              return (
                <tr className={rowClass} key={`row-${index}`}>
                  <td className="acct" style={depth ? { paddingLeft: 14 + depth * 20 } : undefined}>
                    {row.label}
                  </td>
                  {amountColumns.map((column) => {
                    const value = row.cells[column.key] ?? null;
                    const cls = amountClass(column, value);
                    if (column.format === 'currency' && typeof value === 'number' && drillable) {
                      const year = Number(column.key);
                      return (
                        <td key={column.key} className={cls}>
                          <button
                            className="report-drill-cell"
                            onClick={() => setDrill({ label: row.label, year })}
                            aria-label={`Drill into ${row.label} for ${column.label}`}
                          >
                            {formatCurrency(value, showSymbol)}
                          </button>
                        </td>
                      );
                    }
                    let text = '';
                    if (typeof value === 'string') text = value;
                    else if (typeof value === 'number')
                      text = column.format === 'percent' ? pct(value) : formatCurrency(value, showSymbol);
                    return (
                      <td key={column.key} className={cls}>
                        {text}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {drillData ? (
        <>
          <button className="ap-scrim" aria-label="Close detail" onClick={() => setDrill(null)} />
          <aside className="drill-panel" role="dialog" aria-label={`${drillData.title} detail`}>
            <header className="drill-head">
              <div>
                <p className="drill-eyebrow"><Search size={13} /> Transaction detail · FY {drillData.year}</p>
                <h3>{drillData.title}</h3>
              </div>
              <button className="ap-icon-btn" aria-label="Close" onClick={() => setDrill(null)}><X size={18} /></button>
            </header>
            <div className="drill-body">
              <table className="report-table drill-table">
                <tbody>
                  {drillData.lines.map((line, index) => (
                    <tr className="report-account" key={index}>
                      <td className="acct">{line.label}</td>
                      <td className={`num${line.amount < 0 ? ' is-neg' : ''}`}>
                        {accounting(line.amount, { symbol: index === 0 })}
                      </td>
                    </tr>
                  ))}
                  <tr className="report-total">
                    <td className="acct">{drillData.title}</td>
                    <td className={`num${drillData.amount < 0 ? ' is-neg' : ''}`}>
                      {accounting(drillData.amount, { symbol: true })}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className={`drill-note ${drillData.illustrative ? 'is-illustrative' : ''}`}>
                {drillData.illustrative ? 'Illustrative · ' : 'Public data · '}
                {drillData.note}
              </p>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
