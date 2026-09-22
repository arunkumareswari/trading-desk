import Link from "next/link";
import { format } from "date-fns";
import type { DaySummary, MetricsTrade } from "@/lib/metrics";
import { formatCurrency, formatPercent, formatR, formatSignedCurrency, pnlClass } from "@/lib/format";
import { SideBadge, ResultBadge } from "@/components/journal/badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const parseDate = (d: string) => (d.includes("T") ? new Date(d) : new Date(`${d}T00:00:00`));

export function DayDetailPanel({
  date,
  summary,
  trades,
}: {
  date: string;
  summary: DaySummary | undefined;
  trades: MetricsTrade[];
}) {
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{format(parseDate(date), "EEEE, MMM d, yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No trades logged on this day.</p>
        </CardContent>
      </Card>
    );
  }

  const stats: { label: string; value: string; tone?: number }[] = [
    { label: "Daily P&L", value: formatSignedCurrency(summary.netPnl), tone: summary.netPnl },
    { label: "Trades", value: String(summary.trades) },
    { label: "Winning", value: String(summary.winningTrades) },
    { label: "Losing", value: String(summary.losingTrades) },
    { label: "Win Rate", value: formatPercent(summary.winRate) },
    { label: "Avg Win", value: formatCurrency(summary.avgWin) },
    { label: "Avg Loss", value: formatCurrency(summary.avgLoss) },
    { label: "Total Risk", value: formatCurrency(summary.totalRisk) },
    { label: "Total R", value: formatR(summary.totalR) },
    { label: "Best Trade", value: formatCurrency(summary.bestTrade) },
    { label: "Worst Trade", value: formatCurrency(summary.worstTrade) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{format(parseDate(date), "EEEE, MMM d, yyyy")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className={`text-sm font-semibold tabular-nums ${s.tone !== undefined ? pnlClass(s.tone) : ""}`}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {summary.setups.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Setups Traded</div>
            <div className="flex flex-wrap gap-1.5">
              {summary.setups.map((s) => (
                <span key={s} className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">Trades Taken</div>
          <div className="space-y-1">
            {trades.map((t) => (
              <Link
                key={t.id}
                href={`/journal/${t.id}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <SideBadge side={t.side as "LONG" | "SHORT"} />
                  <span className="font-medium">{t.symbol}</span>
                  <span className="text-xs text-muted-foreground">{t.setup ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ResultBadge result={t.result as "WIN" | "LOSS" | "BREAKEVEN" | null} />
                  <span className={`w-20 text-right tabular-nums font-medium ${pnlClass(t.netPnl)}`}>
                    {formatSignedCurrency(t.netPnl)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
