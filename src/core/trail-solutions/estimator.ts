import { COST_CATEGORIES, safeMarginPercent } from "@/core/trail-solutions/financials";
import type { Benchmark, CostCategory, ProjectBusinessLine } from "@/core/trail-solutions/model";

// Forward-looking Job Cost Estimator. Pure, benchmark-driven, no ML: predicted cost
// = benchmark rate (low/median/high) × the job's driver quantity, summed by cost
// component. Grounded entirely in the active workspace's benchmark library. Where a
// benchmark is missing it reports "not estimated" rather than inventing a number,
// and physical-rate benchmarks (hours/mile, crew-days/mile) are surfaced as predicted
// QUANTITIES — never dollarized (that would require a labor rate the data lacks).

export type EstimateConfidence = "low" | "moderate" | "high";

export interface EstimateDriverInput {
  readonly businessLine: ProjectBusinessLine;
  readonly region?: string;
  readonly complexityClass?: string;
  readonly trailMiles?: number;
  readonly installedUnits?: number;
  readonly projectCount?: number;
  readonly proposedContractValue?: number;
}

export interface EstimateCostLine {
  readonly category: CostCategory;
  readonly metric: string;
  readonly basis: string;
  readonly low: number;
  readonly median: number;
  readonly high: number;
  readonly sampleSize: number;
  readonly confidence: EstimateConfidence;
}

export interface PredictedQuantity {
  readonly metric: string;
  readonly unit: string;
  readonly low: number;
  readonly median: number;
  readonly high: number;
  readonly sampleSize: number;
  readonly confidence: EstimateConfidence;
}

export interface EstimateMargin {
  readonly contractValue: number;
  readonly marginAtLowCost: number | null; // best case (cost low)
  readonly marginAtMedianCost: number | null;
  readonly marginAtHighCost: number | null;
  readonly marginPercentMedian: number | null;
}

export interface EstimateResult {
  readonly businessLine: ProjectBusinessLine;
  readonly totalLow: number;
  readonly totalMedian: number;
  readonly totalHigh: number;
  readonly lines: readonly EstimateCostLine[];
  readonly predictedQuantities: readonly PredictedQuantity[];
  readonly notEstimatedCategories: readonly CostCategory[];
  readonly accuracyNote: string | null;
  readonly confidence: EstimateConfidence;
  readonly benchmarkCount: number;
  readonly margin: EstimateMargin | null;
}

const CONFIDENCE_RANK: Record<EstimateConfidence, number> = { low: 0, moderate: 1, high: 2 };

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function categoryForMetric(metric: string): CostCategory {
  const m = metric.toLowerCase();
  if (m.includes("payroll") || m.includes("burden")) return "Payroll burden";
  if (m.includes("labor")) return "Direct labor";
  if (m.includes("travel") || m.includes("lodging")) return "Travel and lodging";
  if (m.includes("equipment")) return "Equipment";
  if (m.includes("subcontract")) return "Subcontractors";
  if (m.includes("sign") || m.includes("material")) return "Materials";
  if (m.includes("project management") || m.includes("management cost") || m.includes(" pm ")) return "Project management";
  if (m.includes("indirect") || m.includes("allocat") || m.includes("overhead")) return "Allocated indirect costs";
  if (m.includes("contingency")) return "Contingency";
  return "Other project costs";
}

// Resolves the quantity a per-unit benchmark multiplies against, from its unit's
// denominator ("$ / Mile" -> trail miles, "$ / Each" -> installed units, "/ Project"
// -> project count, otherwise a flat one-off).
function driverForUnit(unit: string, input: EstimateDriverInput): { quantity: number; label: string } {
  const u = unit.toLowerCase();
  if (u.includes("mile")) return { quantity: input.trailMiles ?? 0, label: "miles" };
  if (u.includes("each") || u.includes("unit")) return { quantity: input.installedUnits ?? 0, label: "units" };
  if (u.includes("project")) return { quantity: input.projectCount ?? 1, label: "project" };
  return { quantity: 1, label: "flat" };
}

// One benchmark per metric, preferring the selected region, then National, then any.
function dedupeByMetric(benchmarks: readonly Benchmark[], region?: string): Benchmark[] {
  const byMetric = new Map<string, Benchmark>();
  for (const benchmark of benchmarks) {
    const existing = byMetric.get(benchmark.metric);
    if (!existing) {
      byMetric.set(benchmark.metric, benchmark);
      continue;
    }
    const score = (candidate: Benchmark) => (region && candidate.region === region ? 2 : candidate.region === "National" ? 1 : 0);
    if (score(benchmark) > score(existing)) byMetric.set(benchmark.metric, benchmark);
  }
  return [...byMetric.values()];
}

export function estimateJobCost(benchmarks: readonly Benchmark[], input: EstimateDriverInput): EstimateResult {
  const applicable = dedupeByMetric(
    benchmarks.filter((benchmark) => benchmark.businessLine === input.businessLine),
    input.region,
  );

  const dollarLines: EstimateCostLine[] = [];
  const percentBenchmarks: Benchmark[] = [];
  const predictedQuantities: PredictedQuantity[] = [];
  const appliedConfidences: EstimateConfidence[] = [];
  let accuracyNote: string | null = null;

  for (const benchmark of applicable) {
    const unit = benchmark.unit.toLowerCase();
    const metricLower = benchmark.metric.toLowerCase();
    const isAccuracy = metricLower.includes("accuracy") || unit.includes("variance");

    if (isAccuracy) {
      const pct = (value: number) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
      accuracyNote = `IMBA's historical estimate accuracy for ${benchmark.businessLine} runs ${pct(benchmark.low)} to ${pct(benchmark.high)} (median ${pct(benchmark.median)}); treat this prediction as a range, not a quote.`;
      continue;
    }

    if (unit.includes("%")) {
      percentBenchmarks.push(benchmark);
      appliedConfidences.push(benchmark.confidence);
      continue;
    }

    if (unit.includes("$")) {
      const driver = driverForUnit(unit, input);
      dollarLines.push({
        category: categoryForMetric(benchmark.metric),
        metric: benchmark.metric,
        basis: `${money(benchmark.median)} ${benchmark.unit} × ${driver.quantity.toLocaleString()} ${driver.label}`,
        low: benchmark.low * driver.quantity,
        median: benchmark.median * driver.quantity,
        high: benchmark.high * driver.quantity,
        sampleSize: benchmark.sampleSize,
        confidence: benchmark.confidence,
      });
      appliedConfidences.push(benchmark.confidence);
      continue;
    }

    // Physical rate (hours/mile, crew-days/mile, cycles) — a predicted quantity, never dollars.
    const driver = driverForUnit(unit, input);
    predictedQuantities.push({
      metric: benchmark.metric,
      unit: benchmark.unit,
      low: benchmark.low * driver.quantity,
      median: benchmark.median * driver.quantity,
      high: benchmark.high * driver.quantity,
      sampleSize: benchmark.sampleSize,
      confidence: benchmark.confidence,
    });
  }

  const subtotalLow = dollarLines.reduce((total, line) => total + line.low, 0);
  const subtotalMedian = dollarLines.reduce((total, line) => total + line.median, 0);
  const subtotalHigh = dollarLines.reduce((total, line) => total + line.high, 0);

  // Percentage benchmarks (PM %, contingency %) apply to the direct-cost subtotal.
  // Each scenario uses its own percentile throughout so the band stays internally
  // consistent (low = everything at its low end).
  const percentLines: EstimateCostLine[] = percentBenchmarks.map((benchmark) => ({
    category: categoryForMetric(benchmark.metric),
    metric: benchmark.metric,
    basis: `${(benchmark.median * 100).toFixed(1)}% of ${money(subtotalMedian)} direct subtotal`,
    low: benchmark.low * subtotalLow,
    median: benchmark.median * subtotalMedian,
    high: benchmark.high * subtotalHigh,
    sampleSize: benchmark.sampleSize,
    confidence: benchmark.confidence,
  }));

  const lines = [...dollarLines, ...percentLines];
  const totalLow = subtotalLow + percentLines.reduce((total, line) => total + line.low, 0);
  const totalMedian = subtotalMedian + percentLines.reduce((total, line) => total + line.median, 0);
  const totalHigh = subtotalHigh + percentLines.reduce((total, line) => total + line.high, 0);

  const estimatedCategories = new Set(lines.map((line) => line.category));
  const notEstimatedCategories = COST_CATEGORIES.filter((category) => !estimatedCategories.has(category));

  // Overall confidence is the weakest applied benchmark, downgraded if any relies on
  // a small sample (n < 5).
  let confidence: EstimateConfidence = appliedConfidences.length ? "high" : "low";
  for (const applied of appliedConfidences) {
    if (CONFIDENCE_RANK[applied] < CONFIDENCE_RANK[confidence]) confidence = applied;
  }
  if (lines.some((line) => line.sampleSize < 5) && CONFIDENCE_RANK[confidence] > CONFIDENCE_RANK.low) {
    confidence = confidence === "high" ? "moderate" : "low";
  }

  let margin: EstimateMargin | null = null;
  if (typeof input.proposedContractValue === "number" && input.proposedContractValue > 0) {
    const contractValue = input.proposedContractValue;
    margin = {
      contractValue,
      marginAtLowCost: contractValue - totalLow,
      marginAtMedianCost: contractValue - totalMedian,
      marginAtHighCost: contractValue - totalHigh,
      marginPercentMedian: safeMarginPercent(contractValue - totalMedian, contractValue),
    };
  }

  return {
    businessLine: input.businessLine,
    totalLow,
    totalMedian,
    totalHigh,
    lines,
    predictedQuantities,
    notEstimatedCategories,
    accuracyNote,
    confidence,
    benchmarkCount: appliedConfidences.length,
    margin,
  };
}
