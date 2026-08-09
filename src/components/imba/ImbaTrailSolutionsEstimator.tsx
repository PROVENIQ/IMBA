"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, FilePlus2, Info, Save, TrendingUp } from "lucide-react";

import { estimateJobCost, type EstimateConfidence, type EstimateDriverInput } from "@/core/trail-solutions/estimator";
import { COST_CATEGORIES } from "@/core/trail-solutions/financials";
import type { Benchmark, ProjectBusinessLine } from "@/core/trail-solutions/model";
import type { ManualProjectInput } from "@/core/trail-solutions/manual-entry";
import { saveEstimateRemote } from "@/lib/trail-solutions-test-workspaces";
import { money, number, percent } from "@/lib/trail-format";

const confidenceClass: Record<EstimateConfidence, string> = {
  high: "bg-emerald-300/10 text-emerald-800 dark:text-emerald-100",
  moderate: "bg-amber-300/10 text-amber-900 dark:text-amber-100",
  low: "bg-rose-300/10 text-rose-800 dark:text-rose-100",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card))] px-3 py-2.5 text-xs text-[rgb(var(--text))] outline-none focus:border-blue-300/40";

export function ImbaTrailSolutionsEstimator({ benchmarks, canManage = false, onCreateProject }: { benchmarks: readonly Benchmark[]; canManage?: boolean; onCreateProject?: (prefill: Partial<ManualProjectInput>) => void }) {
  const businessLines = useMemo(
    () => Array.from(new Set(benchmarks.map((benchmark) => benchmark.businessLine))) as ProjectBusinessLine[],
    [benchmarks],
  );
  const [businessLine, setBusinessLine] = useState<ProjectBusinessLine>(businessLines[0] ?? "Construction");
  const regions = useMemo(
    () => Array.from(new Set(benchmarks.filter((benchmark) => benchmark.businessLine === businessLine).map((benchmark) => benchmark.region))),
    [benchmarks, businessLine],
  );
  const [region, setRegion] = useState<string>("");
  const [trailMiles, setTrailMiles] = useState("");
  const [installedUnits, setInstalledUnits] = useState("");
  const [projectCount, setProjectCount] = useState("1");
  const [bid, setBid] = useState("");

  const toNumber = (value: string): number | undefined => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const driverInput = useMemo<EstimateDriverInput>(
    () => ({
      businessLine,
      region: region || undefined,
      trailMiles: toNumber(trailMiles),
      installedUnits: toNumber(installedUnits),
      projectCount: toNumber(projectCount),
      proposedContractValue: toNumber(bid),
    }),
    [businessLine, region, trailMiles, installedUnits, projectCount, bid],
  );
  const result = useMemo(() => estimateJobCost(benchmarks, driverInput), [benchmarks, driverInput]);

  const [estimateName, setEstimateName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function handleSaveEstimate() {
    setSaving(true);
    setSaveMessage(null);
    try {
      await saveEstimateRemote({
        name: estimateName.trim() || `${businessLine} planning estimate`,
        businessLine,
        input: driverInput,
        result,
      });
      setSaveMessage("Estimate saved.");
    } catch (reason) {
      setSaveMessage(reason instanceof Error ? reason.message : "The estimate could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function handleCreateProject() {
    onCreateProject?.({
      businessLine,
      region: region || undefined,
      originalContractValue: toNumber(bid) ?? 0,
      initialEstimatedCost: Math.round(result.totalMedian),
      drivers: {
        trailMiles: toNumber(trailMiles),
        ...(businessLine === "Signage" ? { signsInstalled: toNumber(installedUnits) } : {}),
      },
      pricingNotes: `Benchmark-grounded planning estimate — median ${money(result.totalMedian)} (range ${money(result.totalLow)}–${money(result.totalHigh)}).`,
    });
  }

  const linesByCategory = COST_CATEGORIES.map((category) => ({
    category,
    lines: result.lines.filter((line) => line.category === category),
  })).filter((group) => group.lines.length > 0);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[24px] border border-blue-300/20 bg-gradient-to-br from-blue-300/[0.09] via-[rgb(var(--card))] to-emerald-300/[0.06] p-5 lg:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-blue-800 dark:text-blue-100"><Calculator className="h-3.5 w-3.5" />Job cost estimator</span>
        </div>
        <h1 className="mt-4 max-w-4xl text-xl font-semibold leading-8 text-[rgb(var(--text))] sm:text-2xl">Predict a new job&rsquo;s cost from IMBA&rsquo;s validated historical benchmarks.</h1>
        <p className="mt-3 max-w-3xl text-xs leading-6 text-[rgb(var(--text-2))]">Enter the drivers of a job you are scoping. Each cost line applies a benchmark rate (low / median / high) to your quantities. This is a benchmark-derived estimate with ranges &mdash; not a quote &mdash; and it sharpens as more completed projects are loaded.</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_1fr]">
        <section className="rounded-[20px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card-2))] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-4))]">Job drivers</p>
          <div className="mt-4 grid gap-3">
            <Field label="Business line">
              <select value={businessLine} onChange={(event) => { setBusinessLine(event.target.value as ProjectBusinessLine); setRegion(""); }} className={inputClass}>
                {(businessLines.length ? businessLines : [businessLine]).map((line) => <option key={line} value={line}>{line}</option>)}
              </select>
            </Field>
            {regions.length > 1 ? (
              <Field label="Region">
                <select value={region} onChange={(event) => setRegion(event.target.value)} className={inputClass}>
                  <option value="">Any / National</option>
                  {regions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </Field>
            ) : null}
            <Field label="Trail miles"><input inputMode="decimal" value={trailMiles} onChange={(event) => setTrailMiles(event.target.value)} placeholder="e.g. 4.2" className={inputClass} /></Field>
            <Field label="Installed units (signs, etc.)"><input inputMode="decimal" value={installedUnits} onChange={(event) => setInstalledUnits(event.target.value)} placeholder="e.g. 24" className={inputClass} /></Field>
            <Field label="Projects (for per-project costs)"><input inputMode="decimal" value={projectCount} onChange={(event) => setProjectCount(event.target.value)} className={inputClass} /></Field>
            <Field label="Proposed bid / contract value (optional)"><input inputMode="decimal" value={bid} onChange={(event) => setBid(event.target.value)} placeholder="e.g. 400000" className={inputClass} /></Field>
          </div>
        </section>

        <section className="space-y-4">
          {result.benchmarkCount === 0 ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-xs text-[rgb(var(--text-2))]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-100" />No benchmarks are available for {businessLine} in the active workspace yet. Load completed projects through the Data Import Lab to build a baseline for this business line.</div>
          ) : (
            <>
              <div className="rounded-[20px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card-2))] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-4))]">Predicted cost</p>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${confidenceClass[result.confidence]}`}>{result.confidence} confidence</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div><p className="text-[9px] font-black uppercase text-[rgb(var(--text-4))]">Low</p><p className="mt-1 font-mono text-lg font-semibold text-[rgb(var(--text))]">{money(result.totalLow)}</p></div>
                  <div><p className="text-[9px] font-black uppercase text-blue-800 dark:text-blue-100">Median</p><p className="mt-1 font-mono text-2xl font-bold text-[rgb(var(--text))]">{money(result.totalMedian)}</p></div>
                  <div><p className="text-[9px] font-black uppercase text-[rgb(var(--text-4))]">High</p><p className="mt-1 font-mono text-lg font-semibold text-[rgb(var(--text))]">{money(result.totalHigh)}</p></div>
                </div>
                {result.accuracyNote ? <p className="mt-3 flex items-start gap-2 border-t border-[rgb(var(--line)/0.07)] pt-3 text-[11px] leading-5 text-[rgb(var(--text-3))]"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{result.accuracyNote}</p> : null}
              </div>

              {result.margin ? (
                <div className="rounded-[20px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card-2))] p-5">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-4))]"><TrendingUp className="h-3.5 w-3.5" />Forecast margin at {money(result.margin.contractValue)} bid</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div><p className="text-[9px] font-black uppercase text-[rgb(var(--text-4))]">Best (low cost)</p><p className="mt-1 font-mono text-sm font-semibold text-emerald-800 dark:text-emerald-100">{money(result.margin.marginAtLowCost)}</p></div>
                    <div><p className="text-[9px] font-black uppercase text-blue-800 dark:text-blue-100">Median</p><p className={`mt-1 font-mono text-lg font-bold ${(result.margin.marginAtMedianCost ?? 0) < 0 ? "text-rose-700 dark:text-rose-100" : "text-[rgb(var(--text))]"}`}>{money(result.margin.marginAtMedianCost)} <span className="text-[11px] font-normal text-[rgb(var(--text-3))]">({percent(result.margin.marginPercentMedian)})</span></p></div>
                    <div><p className="text-[9px] font-black uppercase text-[rgb(var(--text-4))]">Worst (high cost)</p><p className={`mt-1 font-mono text-sm font-semibold ${(result.margin.marginAtHighCost ?? 0) < 0 ? "text-rose-700 dark:text-rose-100" : "text-[rgb(var(--text))]"}`}>{money(result.margin.marginAtHighCost)}</p></div>
                  </div>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-[20px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card-2))]">
                <p className="border-b border-[rgb(var(--line)/0.07)] px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-4))]">Cost breakdown</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-[11px]">
                    <thead><tr className="text-[9px] font-black uppercase tracking-wider text-[rgb(var(--text-4))]"><th className="px-5 py-2">Component</th><th className="px-3 py-2 text-right">Low</th><th className="px-3 py-2 text-right">Median</th><th className="px-3 py-2 text-right">High</th><th className="px-3 py-2">Basis (n · confidence)</th></tr></thead>
                    <tbody>
                      {linesByCategory.map((group) => group.lines.map((line, index) => (
                        <tr key={`${line.category}-${line.metric}`} className="border-t border-[rgb(var(--line)/0.06)]">
                          <td className="px-5 py-3 font-semibold text-[rgb(var(--text))]">{index === 0 ? line.category : ""}<span className="block text-[10px] font-normal text-[rgb(var(--text-4))]">{line.metric}</span></td>
                          <td className="px-3 py-3 text-right font-mono">{money(line.low)}</td>
                          <td className="px-3 py-3 text-right font-mono font-semibold">{money(line.median)}</td>
                          <td className="px-3 py-3 text-right font-mono">{money(line.high)}</td>
                          <td className="px-3 py-3 text-[10px] text-[rgb(var(--text-3))]">{line.basis} · n={line.sampleSize} · {line.confidence}</td>
                        </tr>
                      )))}
                      <tr className="border-t-2 border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.02)]"><td className="px-5 py-3 font-black uppercase text-[rgb(var(--text))]">Total</td><td className="px-3 py-3 text-right font-mono font-semibold">{money(result.totalLow)}</td><td className="px-3 py-3 text-right font-mono font-bold">{money(result.totalMedian)}</td><td className="px-3 py-3 text-right font-mono font-semibold">{money(result.totalHigh)}</td><td /></tr>
                    </tbody>
                  </table>
                </div>
                {result.notEstimatedCategories.length ? <p className="border-t border-[rgb(var(--line)/0.07)] px-5 py-3 text-[10px] leading-4 text-[rgb(var(--text-4))]"><strong>Not estimated (no benchmark yet):</strong> {result.notEstimatedCategories.join(", ")}. These components are excluded rather than guessed &mdash; add history to cover them.</p> : null}
              </div>

              {result.predictedQuantities.length ? (
                <div className="rounded-[20px] border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card-2))] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-4))]">Predicted operational quantities</p>
                  <p className="mt-1 text-[10px] text-[rgb(var(--text-4))]">Physical planning outputs (not dollarized &mdash; no labor-rate assumption is invented).</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {result.predictedQuantities.map((quantity) => (
                      <div key={quantity.metric} className="rounded-xl border border-[rgb(var(--line)/0.08)] p-3">
                        <p className="text-[10px] font-semibold text-[rgb(var(--text))]">{quantity.metric}</p>
                        <p className="mt-1 font-mono text-sm text-[rgb(var(--text))]">{number(quantity.low)} &ndash; {number(quantity.high)}<span className="text-[10px] text-[rgb(var(--text-4))]"> (median {number(quantity.median)})</span></p>
                        <p className="mt-1 text-[9px] text-[rgb(var(--text-4))]">{quantity.unit} · n={quantity.sampleSize} · {quantity.confidence}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {canManage ? (
                <div className="rounded-[20px] border border-emerald-300/20 bg-emerald-300/[0.05] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-4))]">Save &amp; use this estimate</p>
                  <p className="mt-1 text-[11px] leading-5 text-[rgb(var(--text-3))]">A saved estimate is a benchmark-grounded planning estimate, not an approved quote. &ldquo;Create project&rdquo; prefills a new project you can review before saving.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input value={estimateName} onChange={(event) => setEstimateName(event.target.value)} placeholder="Estimate name" className={`${inputClass} max-w-[240px]`} />
                    <button type="button" onClick={handleSaveEstimate} disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--card))] px-3 py-2.5 text-[11px] font-bold text-[rgb(var(--text-2))] disabled:opacity-50"><Save className="h-3.5 w-3.5" />{saving ? "Saving…" : "Save estimate"}</button>
                    {onCreateProject ? <button type="button" onClick={handleCreateProject} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-3 py-2.5 text-[11px] font-black uppercase text-[#102030]"><FilePlus2 className="h-3.5 w-3.5" />Create project from estimate</button> : null}
                    {saveMessage ? <span className="text-[11px] text-[rgb(var(--text-3))]">{saveMessage}</span> : null}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
