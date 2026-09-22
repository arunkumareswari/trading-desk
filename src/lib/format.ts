const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number, compact = false): string {
  if (!Number.isFinite(value)) return "—";
  return (compact ? compactCurrencyFormatter : currencyFormatter).format(value);
}

export function formatSignedCurrency(value: number, compact = false): string {
  if (!Number.isFinite(value)) return "—";
  const formatted = formatCurrency(Math.abs(value), compact);
  return value < 0 ? `-${formatted}` : value > 0 ? `+${formatted}` : formatted;
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatR(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}R`;
}

export function formatMinutes(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (value < 60) return `${Math.round(value)}m`;
  const hours = Math.floor(value / 60);
  const mins = Math.round(value % 60);
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

export function pnlClass(value: number): string {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-rose-600 dark:text-rose-400";
  return "text-muted-foreground";
}

export function pnlBgClass(value: number): string {
  if (value > 0)
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
  if (value < 0)
    return "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400";
  return "bg-muted text-muted-foreground border-border";
}
