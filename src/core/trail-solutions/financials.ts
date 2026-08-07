import type {
  CostBreakdownLine,
  CostCategory,
  EstimateLine,
  LaborActual,
  NonlaborActual,
  RevenueBillingRecord,
} from "@/core/trail-solutions/model";

export function safeMarginPercent(margin: number | null, contractValue: number): number | null {
  if (margin === null || !Number.isFinite(contractValue) || contractValue <= 0) return null;
  return margin / contractValue;
}

export function calculateProjectFinancials(input: {
  originalContractValue: number;
  approvedChangeOrders: number;
  actualCostToDate: number;
  estimatedCostToComplete: number | null;
}): {
  currentContractValue: number;
  forecastFinalCost: number | null;
  forecastMargin: number | null;
  forecastMarginPercent: number | null;
} {
  const currentContractValue = input.originalContractValue + input.approvedChangeOrders;
  const forecastFinalCost = input.estimatedCostToComplete === null
    ? null
    : input.actualCostToDate + input.estimatedCostToComplete;
  const forecastMargin = forecastFinalCost === null ? null : currentContractValue - forecastFinalCost;
  return {
    currentContractValue,
    forecastFinalCost,
    forecastMargin,
    forecastMarginPercent: safeMarginPercent(forecastMargin, currentContractValue),
  };
}

export function summarizeBilling(records: readonly RevenueBillingRecord[], asOfDate: string): {
  invoicedAmount: number;
  recognizedRevenue: number;
  cashCollected: number;
  outstandingReceivables: number;
  unbilledAmount: number | null;
  lastInvoiceDate?: string;
  collectionStatus: "current" | "attention" | "overdue" | "not-billed";
} {
  const sum = (type: RevenueBillingRecord["recordType"]) =>
    records.filter((record) => record.recordType === type).reduce((total, record) => total + record.amount, 0);
  const invoices = records.filter((record) => record.recordType === "invoice");
  const invoicedAmount = sum("invoice");
  const recognizedRevenue = sum("revenue-recognition");
  const cashCollected = sum("cash-receipt");
  const outstandingReceivables = Math.max(invoicedAmount - cashCollected, 0);
  const unbilledAmount = recognizedRevenue > 0 ? Math.max(recognizedRevenue - invoicedAmount, 0) : null;
  const lastInvoiceDate = invoices.map((record) => record.documentDate).sort().at(-1);
  const overdue = invoices.some(
    (record) => record.dueDate && record.amount > 0 && Date.parse(record.dueDate) < Date.parse(asOfDate),
  ) && outstandingReceivables > 0;
  return {
    invoicedAmount,
    recognizedRevenue,
    cashCollected,
    outstandingReceivables,
    unbilledAmount,
    lastInvoiceDate,
    collectionStatus: invoicedAmount === 0
      ? "not-billed"
      : overdue
        ? "overdue"
        : outstandingReceivables > 0
          ? "attention"
          : "current",
  };
}

export const COST_CATEGORIES: readonly CostCategory[] = [
  "Direct labor",
  "Payroll burden",
  "Travel and lodging",
  "Materials",
  "Equipment",
  "Subcontractors",
  "Project management",
  "Allocated indirect costs",
  "Contingency",
  "Other project costs",
];

export function buildCostBreakdown(input: {
  estimateLines: readonly EstimateLine[];
  laborActuals: readonly LaborActual[];
  nonlaborActuals: readonly NonlaborActual[];
  estimatedCostToComplete: number | null;
}): readonly CostBreakdownLine[] {
  const estimates = new Map<CostCategory, number>();
  for (const line of input.estimateLines) {
    estimates.set(line.costCategory, (estimates.get(line.costCategory) ?? 0) + line.estimatedCost);
  }
  const actuals = new Map<CostCategory, number>();
  for (const labor of input.laborActuals) {
    actuals.set("Direct labor", (actuals.get("Direct labor") ?? 0) + labor.directWages);
    actuals.set("Payroll burden", (actuals.get("Payroll burden") ?? 0) + labor.payrollBurden);
  }
  for (const cost of input.nonlaborActuals) {
    actuals.set(cost.costCategory, (actuals.get(cost.costCategory) ?? 0) + cost.amount);
  }

  const estimatedRemainingByCategory = COST_CATEGORIES.map((category) =>
    Math.max((estimates.get(category) ?? 0) - (actuals.get(category) ?? 0), 0));
  const modeledRemaining = estimatedRemainingByCategory.reduce((total, value) => total + value, 0);

  return COST_CATEGORIES.map((category, index) => {
    const estimated = estimates.get(category) ?? 0;
    const actual = actuals.get(category) ?? 0;
    const remaining = input.estimatedCostToComplete === null
      ? null
      : modeledRemaining > 0
        ? input.estimatedCostToComplete * (estimatedRemainingByCategory[index] / modeledRemaining)
        : input.estimatedCostToComplete / COST_CATEGORIES.length;
    return Object.freeze({
      category,
      estimated,
      actual,
      remaining,
      forecast: remaining === null ? null : actual + remaining,
    });
  });
}

export function assertCostBreakdownReconciles(
  lines: readonly CostBreakdownLine[],
  actualCostToDate: number,
  forecastFinalCost: number | null,
  tolerance = 0.01,
): void {
  const actual = lines.reduce((total, line) => total + line.actual, 0);
  if (Math.abs(actual - actualCostToDate) > tolerance) {
    throw new TypeError(`cost breakdown actuals differ by ${actual - actualCostToDate}`);
  }
  if (forecastFinalCost !== null) {
    const forecast = lines.reduce((total, line) => total + (line.forecast ?? 0), 0);
    if (Math.abs(forecast - forecastFinalCost) > tolerance) {
      throw new TypeError(`cost breakdown forecast differs by ${forecast - forecastFinalCost}`);
    }
  }
}
