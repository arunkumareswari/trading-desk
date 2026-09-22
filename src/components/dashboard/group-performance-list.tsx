import type { GroupSummary } from "@/lib/metrics";
import { formatPercent, formatSignedCurrency, pnlClass } from "@/lib/format";

export function GroupPerformanceList({ items, limit = 5 }: { items: GroupSummary[]; limit?: number }) {
  const rows = items.slice(0, limit);
  if (!rows.length) {
    return <div className="py-8 text-center text-sm text-muted-foreground">No data yet.</div>;
  }
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.netPnl)), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.key} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="truncate font-medium">{r.key}</span>
            <span className={`shrink-0 tabular-nums font-medium ${pnlClass(r.netPnl)}`}>
              {formatSignedCurrency(r.netPnl)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${r.netPnl >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                style={{ width: `${Math.max(4, (Math.abs(r.netPnl) / maxAbs) * 100)}%` }}
              />
            </div>
            <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">
              {r.trades} trades · {formatPercent(r.winRate, 0)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
