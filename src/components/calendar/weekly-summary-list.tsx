import { format } from "date-fns";
import type { WeekSummary } from "@/lib/metrics";
import { formatPercent, formatSignedCurrency, pnlClass } from "@/lib/format";

const parseDate = (d: string) => (d.includes("T") ? new Date(d) : new Date(`${d}T00:00:00`));

export function WeeklySummaryList({ weeks }: { weeks: WeekSummary[] }) {
  const recent = [...weeks].reverse().slice(0, 8);
  if (!recent.length) {
    return <p className="text-sm text-muted-foreground">No trading weeks yet.</p>;
  }
  return (
    <div className="space-y-2">
      {recent.map((w) => (
        <div key={w.weekStart} className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {format(parseDate(w.weekStart), "MMM d")} – {format(parseDate(w.weekEnd), "MMM d")}
            </span>
            <span className={`font-semibold tabular-nums ${pnlClass(w.netPnl)}`}>{formatSignedCurrency(w.netPnl)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {w.tradingDays} trading day{w.tradingDays === 1 ? "" : "s"} · {w.trades} trades
            </span>
            <span>{formatPercent(w.winRate, 0)} win rate</span>
          </div>
        </div>
      ))}
    </div>
  );
}
