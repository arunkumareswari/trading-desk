import Link from "next/link";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { closeDate, sortByClose, type MetricsTrade } from "@/lib/metrics";
import { formatSignedCurrency, pnlClass } from "@/lib/format";

export function RecentMistakes({ trades, limit = 6 }: { trades: MetricsTrade[]; limit?: number }) {
  const withMistakes = sortByClose(trades.filter((t) => t.mistakes.length > 0))
    .reverse()
    .slice(0, limit);

  if (!withMistakes.length) {
    return <div className="py-8 text-center text-sm text-muted-foreground">No mistakes logged — keep it up.</div>;
  }

  return (
    <div className="space-y-1">
      {withMistakes.map((t) => (
        <Link
          key={t.id}
          href={`/journal/${t.id}`}
          className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-accent"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0">
              <div className="truncate font-medium">{t.mistakes.join(", ")}</div>
              <div className="truncate text-xs text-muted-foreground">
                {t.symbol} · {format(closeDate(t), "MMM d")}
              </div>
            </div>
          </div>
          <span className={`shrink-0 tabular-nums font-medium ${pnlClass(t.netPnl)}`}>
            {formatSignedCurrency(t.netPnl)}
          </span>
        </Link>
      ))}
    </div>
  );
}
