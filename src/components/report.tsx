import { accounting, pct } from '@/lib/imba-data';

/**
 * QuickBooks-style financial statement primitives.
 *
 * A statement is a `ReportPaper` (the centered "document") wrapping one or more
 * `StatementTable`s. Each table is described declaratively by its columns and a
 * flat list of typed rows (section headers, accounts, subtotals, totals), which
 * keeps the page files short and the accounting formatting in one place.
 */

export type ColumnFormat = 'text' | 'currency' | 'percent';

export type ReportColumn = {
  key: string;
  label: string;
  note?: string;
  format: ColumnFormat;
};

/** A cell value: a number (formatted per column), a literal string, or empty. */
export type Cell = number | string | null;

export type Tone = 'neg' | 'muted';

export type ReportRow =
  | { kind: 'section'; label: string }
  | {
      kind: 'account';
      label: string;
      depth?: number;
      cells: Record<string, Cell>;
      symbol?: boolean;
    }
  | { kind: 'subtotal'; label: string; cells: Record<string, Cell> }
  | { kind: 'total'; label: string; cells: Record<string, Cell> }
  | { kind: 'blank' };

function formatCell(column: ReportColumn, value: Cell, symbol: boolean): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (column.format === 'percent') return pct(value);
  if (column.format === 'currency') return accounting(value, { symbol });
  return String(value);
}

function amountClass(column: ReportColumn, value: Cell): string {
  const classes = ['num'];
  if (typeof value === 'number' && value < 0) classes.push('is-neg');
  if (typeof value === 'string') classes.push('is-pending');
  if (column.format === 'percent') classes.push('is-pct');
  return classes.join(' ');
}

export function StatementTable({
  columns,
  rows,
}: {
  columns: ReportColumn[];
  rows: ReportRow[];
}) {
  const [labelColumn, ...amountColumns] = columns;

  return (
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
              row.kind === 'subtotal'
                ? 'report-subtotal'
                : row.kind === 'total'
                  ? 'report-total'
                  : 'report-account';
            const depth = row.kind === 'account' ? row.depth ?? 0 : 0;
            const showSymbol = isSummary || (row.kind === 'account' && Boolean(row.symbol));

            return (
              <tr className={rowClass} key={`row-${index}`}>
                <td className="acct" style={depth ? { paddingLeft: 14 + depth * 20 } : undefined}>
                  {row.label}
                </td>
                {amountColumns.map((column) => {
                  const value = row.cells[column.key] ?? null;
                  return (
                    <td key={column.key} className={amountClass(column, value)}>
                      {formatCell(column, value, showSymbol)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ReportPaper({
  id,
  org = 'International Mountain Bicycling Association',
  title,
  period,
  basis,
  children,
  footnote,
}: {
  id: string;
  org?: string;
  title: string;
  period: string;
  basis: string;
  children: React.ReactNode;
  footnote?: React.ReactNode;
}) {
  return (
    <section className="report-paper" id={id}>
      <header className="report-head">
        <p className="report-org">{org}</p>
        <h2 className="report-title">{title}</h2>
        <p className="report-period">{period}</p>
        <p className="report-basis">{basis}</p>
      </header>
      {children}
      {footnote ? <p className="report-foot">{footnote}</p> : null}
    </section>
  );
}
