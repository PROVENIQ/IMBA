'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bookmark,
  BookmarkPlus,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Database,
  Filter,
  Gauge,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  imbaMetricExplanations,
  imbaRoleProfiles,
  type ImbaAlertRule,
  type ImbaFilterState,
  type ImbaRoleKey,
  type ImbaSavedView,
  type ImbaSubscription,
} from '@/lib/imba-intelligence-data';
import type { ImbaOsView } from '@/lib/imba-os-data';

export interface ImbaMetricSelection {
  label: string;
  value: string;
  detail: string;
}

export interface ImbaInsight {
  id: string;
  title: string;
  detail: string;
  tone: 'positive' | 'warning' | 'risk';
  project?: string;
  targetView: ImbaOsView;
}

function useEscapeClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);
}

function SelectControl({ label, value, options, onChange, formatOption }: { label: string; value: string; options: string[]; onChange: (value: string) => void; formatOption?: (value: string) => string }) {
  return (
    <label className="relative flex min-w-[145px] items-center gap-2 rounded-xl border border-white/[0.08] bg-[#101c1a] px-3 py-2.5">
      <span className="text-[8px] font-black uppercase tracking-wider text-[#637b73]">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 appearance-none bg-transparent pr-5 text-[10px] font-semibold text-white outline-none">
        {options.map((option) => <option key={option} value={option} className="bg-[#101c1a]">{formatOption ? formatOption(option) : option}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-3 w-3 text-[#637b73]" />
    </label>
  );
}

export function ImbaIntelligenceBar({
  role,
  filters,
  regions,
  phases,
  projects,
  resultSummary,
  savedViews,
  activeAlertCount,
  onFilterChange,
  onSaveView,
  onApplySavedView,
  onOpenAlerts,
  onResetFilters,
}: {
  role: ImbaRoleKey;
  filters: ImbaFilterState;
  regions: string[];
  phases: string[];
  projects: string[];
  resultSummary: string;
  savedViews: ImbaSavedView[];
  activeAlertCount: number;
  onRoleChange: (role: ImbaRoleKey) => void;
  onFilterChange: (patch: Partial<ImbaFilterState>) => void;
  onSaveView: () => void;
  onApplySavedView: (id: string) => void;
  onOpenAlerts: () => void;
  onResetFilters: () => void;
}) {
  const activeFilters = Object.values(filters).filter((value) => !value.startsWith('All ')).length;
  return (
    <section className="rounded-[20px] border border-violet-300/15 bg-[linear-gradient(110deg,rgba(167,139,250,.075),rgba(104,185,170,.045))] p-3.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 pr-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-300/10 text-violet-100"><Filter className="h-4 w-4" /></span>
          <div><p className="text-[8px] font-black uppercase tracking-[0.18em] text-violet-100/65">Intelligence context</p><p className="mt-0.5 text-[9px] text-[#93a8a1]">{resultSummary}</p></div>
        </div>
        <SelectControl label="Region" value={filters.region} options={['All regions', ...regions]} onChange={(region) => onFilterChange({ region, project: 'All projects' })} />
        <SelectControl label="Phase" value={filters.phase} options={['All phases', ...phases]} onChange={(phase) => onFilterChange({ phase, project: 'All projects' })} />
        <SelectControl label="Signal" value={filters.status} options={['All signals', 'Healthy', 'Watch', 'At risk']} onChange={(status) => onFilterChange({ status, project: 'All projects' })} />
        <SelectControl label="Project" value={filters.project} options={['All projects', ...projects]} onChange={(project) => onFilterChange({ project })} />
        {activeFilters ? <button type="button" onClick={onResetFilters} className="rounded-xl border border-white/[0.08] px-3 py-2.5 text-[8px] font-black uppercase text-[#9aafa8] hover:text-white">Clear {activeFilters}</button> : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {savedViews.length ? (
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#101c1a] p-1">
              <Bookmark className="ml-2 h-3.5 w-3.5 text-violet-100" />
              <select defaultValue="" onChange={(event) => { if (event.target.value) onApplySavedView(event.target.value); event.target.value = ''; }} aria-label="Open a saved cockpit view" className="max-w-[150px] bg-transparent px-1 py-2 text-[9px] font-semibold text-white outline-none">
                <option value="" className="bg-[#101c1a]">Saved views</option>
                {savedViews.map((saved) => <option key={saved.id} value={saved.id} className="bg-[#101c1a]">{saved.name}</option>)}
              </select>
            </div>
          ) : null}
          <button type="button" onClick={onSaveView} className="inline-flex items-center gap-2 rounded-xl border border-violet-300/15 bg-violet-300/[0.07] px-3 py-2.5 text-[8px] font-black uppercase tracking-wider text-violet-100 hover:bg-violet-300/[0.12]"><BookmarkPlus className="h-3.5 w-3.5" /> Save view</button>
          <button type="button" onClick={onOpenAlerts} className="relative inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--sa))] px-3 py-2.5 text-[8px] font-black uppercase tracking-wider text-[rgb(var(--sa-ink))] hover:bg-[#c9ef79]"><Bell className="h-3.5 w-3.5" /> Alerts + briefings{activeAlertCount ? <span className="rounded-full bg-[rgb(var(--sa-ink))]/15 px-1.5 py-0.5">{activeAlertCount}</span> : null}</button>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] pt-2.5 text-[8px] text-[#6f8981]">
        <span className="inline-flex items-center gap-1.5"><Users className="h-3 w-3" /> {imbaRoleProfiles[role].label}: {imbaRoleProfiles[role].purpose}</span>
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Role-aware navigation prototype; production requires authenticated row and action policies</span>
      </div>
    </section>
  );
}

export function ImbaInsightStrip({ insights, onSelect }: { insights: ImbaInsight[]; onSelect: (insight: ImbaInsight) => void }) {
  const tone = { positive: 'border-[rgb(var(--sa)/0.15)] bg-[rgb(var(--sa))]/[0.045] text-[rgb(var(--sa-soft))]', warning: 'border-amber-300/15 bg-amber-300/[0.045] text-amber-100', risk: 'border-rose-300/15 bg-rose-300/[0.045] text-rose-100' };
  return (
    <section className="grid gap-2 lg:grid-cols-3" aria-label="Automated variance and anomaly narrative">
      {insights.map((insight) => (
        <button key={insight.id} type="button" onClick={() => onSelect(insight)} className={`group flex items-start gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${tone[insight.tone]}`}>
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-wider">{insight.title}</span><span className="mt-1 block text-[9px] leading-4 text-[#91a59e]">{insight.detail}</span></span>
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
        </button>
      ))}
    </section>
  );
}

export function ImbaMetricDrawer({ selection, onClose, onNavigate }: { selection: ImbaMetricSelection | null; onClose: () => void; onNavigate: (view: ImbaOsView) => void }) {
  useEscapeClose(Boolean(selection), onClose);
  if (!selection) return null;
  const explanation = imbaMetricExplanations[selection.label];
  if (!explanation) return null;
  return (
    <div className="fixed inset-0 z-[180]" role="dialog" aria-modal="true" aria-label={`Explain ${selection.label}`}>
      <button type="button" aria-label="Close metric explanation" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-white/[0.1] bg-[#091411] shadow-[-24px_0_80px_rgba(0,0,0,.42)]">
        <div className="flex items-start justify-between border-b border-white/[0.07] p-5">
          <div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#8ca19a]">Explain this number</p><h2 className="mt-1 text-xl font-semibold text-white">{selection.label}</h2><div className="mt-3 flex items-baseline gap-3"><span className="font-mono text-3xl font-semibold text-[rgb(var(--sa-soft))]">{selection.value}</span><span className="text-[10px] text-[#7f958e]">{selection.detail}</span></div></div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/[0.08] p-2 text-[#8ca19a] hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section><p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-violet-100"><Gauge className="h-3.5 w-3.5" /> Definition + formula</p><p className="mt-2 text-sm leading-6 text-[#b5c5c0]">{explanation.definition}</p><p className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 font-mono text-[10px] leading-5 text-white">{explanation.formula}</p></section>
          <section><p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-cyan-100"><Database className="h-3.5 w-3.5" /> Lineage + freshness</p><div className="mt-2 space-y-2">{explanation.sources.map((source) => <div key={source} className="flex items-start gap-2 text-[10px] leading-5 text-[#9aafa8]"><Check className="mt-1 h-3 w-3 shrink-0 text-cyan-100" />{source}</div>)}</div><p className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-300/[0.06] px-3 py-1.5 text-[9px] text-cyan-100"><Clock3 className="h-3 w-3" />{explanation.freshness}</p></section>
          <section><p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-[rgb(var(--sa-soft))]"><CircleDollarSign className="h-3.5 w-3.5" /> Principal drivers</p><div className="mt-2 space-y-2">{explanation.drivers.map((driver) => <div key={driver.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"><span className="text-[10px] text-[#b5c5c0]">{driver.label}</span><span className={`text-[9px] font-black ${driver.tone === 'positive' ? 'text-[rgb(var(--sa-soft))]' : driver.tone === 'negative' ? 'text-rose-100' : 'text-[#9fd6cc]'}`}>{driver.effect}</span></div>)}</div></section>
          <section className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-4"><p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-amber-100"><AlertTriangle className="h-3.5 w-3.5" /> Variance / anomaly</p><p className="mt-2 text-[10px] leading-5 text-[#c8d2ce]">{explanation.anomaly}</p></section>
          <section className="rounded-2xl border border-[rgb(var(--sa)/0.15)] bg-[rgb(var(--sa))]/[0.045] p-4"><p className="text-[9px] font-black uppercase tracking-wider text-[rgb(var(--sa-soft))]">Management action</p><p className="mt-2 text-[10px] leading-5 text-[#c8d2ce]">{explanation.action}</p></section>
        </div>
        <div className="border-t border-white/[0.07] p-5"><button type="button" onClick={() => { onNavigate(explanation.supportingView); onClose(); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--sa))] px-4 py-3 text-[9px] font-black uppercase tracking-wider text-[rgb(var(--sa-ink))]">Open supporting records <ArrowRight className="h-3.5 w-3.5" /></button></div>
      </aside>
    </div>
  );
}

export function ImbaAlertsDrawer({ alerts, subscriptions, onClose, onToggleAlert, onThresholdChange, onToggleSubscription }: { alerts: ImbaAlertRule[]; subscriptions: ImbaSubscription[]; onClose: () => void; onToggleAlert: (id: string) => void; onThresholdChange: (id: string, threshold: string) => void; onToggleSubscription: (id: string) => void }) {
  const [sentId, setSentId] = useState<string | null>(null);
  useEscapeClose(true, onClose);
  return (
    <div className="fixed inset-0 z-[180]" role="dialog" aria-modal="true" aria-label="Alerts and scheduled briefings">
      <button type="button" aria-label="Close alerts" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[620px] flex-col border-l border-white/[0.1] bg-[#091411] shadow-[-24px_0_80px_rgba(0,0,0,.42)]">
        <div className="flex items-start justify-between border-b border-white/[0.07] p-5"><div><p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#8ca19a]">Monitor + distribute</p><h2 className="mt-1 text-xl font-semibold text-white">Alerts and scheduled briefings</h2><p className="mt-2 text-[10px] text-[#7f958e]">Prototype rules evaluate illustrative data only. Production delivery requires authenticated recipients and scheduled jobs.</p></div><button type="button" onClick={onClose} className="rounded-xl border border-white/[0.08] p-2 text-[#8ca19a] hover:bg-white/[0.05] hover:text-white"><X className="h-4 w-4" /></button></div>
        <div className="flex-1 space-y-7 overflow-y-auto p-5">
          <section><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-amber-100"><Bell className="h-3.5 w-3.5" /> Threshold rules</p><span className="text-[9px] text-[#718981]">{alerts.filter((alert) => alert.enabled).length} active</span></div><div className="mt-3 space-y-3">{alerts.map((alert) => <div key={alert.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.022] p-4"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${alert.state === 'triggered' ? 'bg-rose-300' : alert.state === 'watch' ? 'bg-amber-300' : 'bg-[rgb(var(--sa))]'}`} /><p className="text-xs font-semibold text-white">{alert.metric}</p></div><p className="mt-1.5 text-[9px] text-[#82978f]">{alert.condition}</p></div><button type="button" role="switch" aria-checked={alert.enabled} onClick={() => onToggleAlert(alert.id)} className={`relative h-6 w-11 rounded-full transition ${alert.enabled ? 'bg-[rgb(var(--sa))]' : 'bg-white/[0.1]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-[rgb(var(--sa-ink))] transition ${alert.enabled ? 'left-6' : 'left-1 bg-[#718981]'}`} /></button></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><label className="rounded-xl border border-white/[0.06] bg-[#101c1a] px-3 py-2"><span className="block text-[8px] font-black uppercase text-[#617971]">Threshold</span><input value={alert.threshold} onChange={(event) => onThresholdChange(alert.id, event.target.value)} className="mt-1 w-full bg-transparent text-[10px] font-semibold text-white outline-none" /></label><div className="rounded-xl border border-white/[0.06] px-3 py-2"><span className="block text-[8px] font-black uppercase text-[#617971]">Owner</span><span className="mt-1 block text-[9px] text-[#b0c0bb]">{alert.owner}</span></div><div className="rounded-xl border border-white/[0.06] px-3 py-2"><span className="block text-[8px] font-black uppercase text-[#617971]">Evaluate</span><span className="mt-1 block text-[9px] text-[#b0c0bb]">{alert.cadence}</span></div></div></div>)}</div></section>
          <section><p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-cyan-100"><Mail className="h-3.5 w-3.5" /> Scheduled briefings</p><div className="mt-3 space-y-3">{subscriptions.map((subscription) => <div key={subscription.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.022] p-4"><div><p className="text-xs font-semibold text-white">{subscription.name}</p><p className="mt-1 text-[9px] text-[#718981]">{subscription.audience} · {subscription.cadence}</p>{sentId === subscription.id ? <p className="mt-1 text-[9px] font-semibold text-[rgb(var(--sa-soft))]">Demo snapshot generated; no external email was sent.</p> : null}</div><div className="flex items-center gap-2"><button type="button" onClick={() => setSentId(subscription.id)} className="rounded-lg border border-white/[0.08] px-3 py-2 text-[8px] font-black uppercase text-white">Test briefing</button><button type="button" role="switch" aria-checked={subscription.enabled} onClick={() => onToggleSubscription(subscription.id)} className={`relative h-6 w-11 rounded-full transition ${subscription.enabled ? 'bg-cyan-300' : 'bg-white/[0.1]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full transition ${subscription.enabled ? 'left-6 bg-[rgb(var(--sa-ink))]' : 'left-1 bg-[#718981]'}`} /></button></div></div>)}</div></section>
        </div>
      </aside>
    </div>
  );
}
