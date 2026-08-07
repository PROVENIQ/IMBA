// Shared display formatters for Trail Solutions views (currency, percent, number).

export function money(value: number | null): string {
  if (value === null) return "Review required";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function percent(value: number | null): string {
  if (value === null) return "Not available";
  return `${(value * 100).toFixed(1)}%`;
}

export function number(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}
