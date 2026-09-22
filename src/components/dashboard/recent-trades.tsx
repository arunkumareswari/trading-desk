import Link from "next/link";
import { format } from "date-fns";
import { closeDate, sortByClose, type MetricsTrade } from "@/lib/metrics";
import { formatSignedCurrency, pnlClass } from "@/lib/format";
import { SideBadge, ResultBadge } from "@/components/journal/badges";

export function RecentTrades({ trades, limit = 6 }: { trades: MetricsTrade[]; limit?: number }) {
  const closed = trades.filter((t) => t.result !== null);
  const recent = sortByClose(closed).reverse().slice(0, limit);

  if (!recent.length) {
    return <div className="py-8 text-center text-sm text-muted-foreground">No closed trades yet.</div>;
  }

  return (
    <div className="space-y-1">
      {recent.map((t) => (
        <Link
          key={t.id}
          href={`/journal/${t.id}`}
          className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <SideBadge side={t.side as "LONG" | "SHORT"} />
            <div className="min-w-0">
              <div className="truncate font-medium">{t.symbol}</div>
              <div className="truncate text-xs text-muted-foreground">
                {format(closeDate(t), "MMM d")} · {t.setup ?? "No setup"}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ResultBadge result={t.result as "WIN" | "LOSS" | "BREAKEVEN" | null} />
            <span className={`w-20 text-right tabular-nums font-medium ${pnlClass(t.netPnl)}`}>
              {formatSignedCurrency(t.netPnl)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
