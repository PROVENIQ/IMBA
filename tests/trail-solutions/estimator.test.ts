import { describe, expect, it } from "vitest";

import { estimateJobCost } from "@/core/trail-solutions/estimator";
import type { Benchmark } from "@/core/trail-solutions/model";

function bench(
  partial: Pick<Benchmark, "businessLine" | "metric" | "unit" | "low" | "median" | "high" | "sampleSize" | "confidence"> &
    Partial<Benchmark>,
): Benchmark {
  return {
    benchmarkId: `bench-${partial.metric}`,
    organizationId: "org-test",
    chapterScope: "NATIONAL",
    label: "IMBA historical benchmark",
    rangeLabel: "Validated internal range",
    region: "National",
    complexityClass: "Mixed",
    applicableFrom: "2023-01-01",
    applicableTo: "2025-12-31",
    sourceProjectSet: "test cohort",
    ...partial,
  } as unknown as Benchmark;
}

describe("estimateJobCost", () => {
  it("predicts dollar cost per driver and keeps physical benchmarks as quantities, not dollars", () => {
    const benchmarks = [
      bench({ businessLine: "Construction", metric: "Labor cost per trail mile", unit: "$ / Mile", low: 52000, median: 68000, high: 91000, sampleSize: 9, confidence: "moderate" }),
      bench({ businessLine: "Construction", metric: "Equipment cost by construction type", unit: "$ / Mile", low: 12000, median: 17500, high: 26000, sampleSize: 7, confidence: "moderate" }),
      bench({ businessLine: "Construction", metric: "Crew-days per trail mile", unit: "Crew Days / Mile", low: 21, median: 29, high: 41, sampleSize: 9, confidence: "moderate" }),
    ];

    const result = estimateJobCost(benchmarks, { businessLine: "Construction", trailMiles: 4, proposedContractValue: 400000 });

    // $/mile × 4 miles
    expect(result.totalMedian).toBe(342000);
    expect(result.totalLow).toBe(256000);
    expect(result.totalHigh).toBe(468000);
    expect(result.lines.find((line) => line.category === "Direct labor")?.median).toBe(272000);
    expect(result.lines.find((line) => line.category === "Equipment")?.median).toBe(70000);

    // Crew-days is a predicted QUANTITY, never a dollar line.
    expect(result.lines.some((line) => line.metric.includes("Crew-days"))).toBe(false);
    expect(result.predictedQuantities.find((quantity) => quantity.metric.includes("Crew-days"))?.median).toBe(116);

    expect(result.confidence).toBe("moderate");
  });

  it("applies percentage benchmarks to the direct-cost subtotal", () => {
    const benchmarks = [
      bench({ businessLine: "Construction", metric: "Labor cost per trail mile", unit: "$ / Mile", low: 50000, median: 50000, high: 50000, sampleSize: 10, confidence: "high" }),
      bench({ businessLine: "Construction", metric: "Project management cost", unit: "% of Cost", low: 0.1, median: 0.1, high: 0.1, sampleSize: 14, confidence: "high" }),
    ];

    const result = estimateJobCost(benchmarks, { businessLine: "Construction", trailMiles: 2 });

    // labor 50k × 2 = 100k subtotal; PM 10% = 10k; total 110k
    expect(result.totalMedian).toBe(110000);
    expect(result.lines.find((line) => line.category === "Project management")?.median).toBe(10000);
  });

  it("computes forecast margin against a proposed bid using the shared safe-divide formula", () => {
    const benchmarks = [bench({ businessLine: "Construction", metric: "Labor cost per trail mile", unit: "$ / Mile", low: 50000, median: 50000, high: 50000, sampleSize: 10, confidence: "high" })];
    const result = estimateJobCost(benchmarks, { businessLine: "Construction", trailMiles: 2, proposedContractValue: 125000 });

    expect(result.margin?.marginAtMedianCost).toBe(25000); // 125k - 100k
    expect(result.margin?.marginPercentMedian).toBeCloseTo(0.2, 5);
  });

  it("treats the estimate-accuracy benchmark as an annotation, never a cost line", () => {
    const benchmarks = [bench({ businessLine: "Planning & Design", metric: "Estimate accuracy", unit: "Forecast Variance %", low: -0.06, median: 0.02, high: 0.11, sampleSize: 16, confidence: "high" })];
    const result = estimateJobCost(benchmarks, { businessLine: "Planning & Design", trailMiles: 5 });

    expect(result.accuracyNote).toMatch(/estimate accuracy/i);
    expect(result.lines).toHaveLength(0);
    expect(result.totalMedian).toBe(0);
  });

  it("reports missing components as not-estimated and never invents numbers", () => {
    const result = estimateJobCost([], { businessLine: "Unclassified" });
    expect(result.benchmarkCount).toBe(0);
    expect(result.totalMedian).toBe(0);
    expect(result.confidence).toBe("low");
    expect(result.notEstimatedCategories).toHaveLength(10);
    expect(result.margin).toBeNull();
  });

  it("downgrades confidence when a benchmark relies on a small sample", () => {
    const benchmarks = [bench({ businessLine: "Signage", metric: "Signage cost per installed unit", unit: "$ / Each", low: 480, median: 625, high: 820, sampleSize: 4, confidence: "high" })];
    const result = estimateJobCost(benchmarks, { businessLine: "Signage", installedUnits: 10 });

    expect(result.totalMedian).toBe(6250);
    expect(result.confidence).toBe("moderate"); // high downgraded because n < 5
  });
});
