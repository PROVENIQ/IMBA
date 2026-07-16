import type { LucideIcon } from 'lucide-react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action ? <div className="page-action">{action}</div> : null}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue';
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-card-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

export function SectionHeading({
  title,
  description,
  aside,
}: {
  title: string;
  description?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {aside}
    </div>
  );
}

export function DataNotice({ children }: { children: React.ReactNode }) {
  return <div className="data-notice">{children}</div>;
}

export function StatusPill({ label }: { label: string }) {
  const tone = label.toLowerCase().replace(/\s+/g, '-');
  return <span className={`status-pill status-${tone}`}>{label}</span>;
}
