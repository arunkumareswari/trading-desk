"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import type { DaySummary, MetricsTrade } from "@/lib/metrics";
import {
  formatCurrency,
  formatPercent,
  formatR,
  formatSignedCurrency,
  pnlClass,
} from "@/lib/format";
import { SideBadge, ResultBadge } from "@/components/journal/badges";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const parseDate = (d: string) => (d.includes("T") ? new Date(d) : new Date(`${d}T00:00:00`));

export function DayDetailDialog({
  date,
  summary,
  trades,
}: {
  date?: string;
  summary: DaySummary | undefined;
  trades: MetricsTrade[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isOpen = Boolean(date);

  function handleClose() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (!date) return null;

  const parsedDate = parseDate(date);
  const formattedTitle = format(parsedDate, "EEEE, MMM d, yyyy");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="space-y-1 pb-3 border-b border-border">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {formattedTitle}
            </DialogTitle>
            {summary && (
              <span className={`text-base font-bold tabular-nums ${pnlClass(summary.netPnl)}`}>
                {formatSignedCurrency(summary.netPnl)}
              </span>
            )}
          </div>
          <DialogDescription className="sr-only">
            Trading details and statistics for {formattedTitle}
          </DialogDescription>
        </DialogHeader>

        {!summary ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No trades logged on this day.</p>
            <div>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link href={`/journal/new?date=${date}`}>
                  <Plus className="h-4 w-4" />
                  Log a trade for this date
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <div>
              <div className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                Daily Performance
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 rounded-lg border border-border bg-card/60 p-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Daily P&L</div>
                  <div className={`text-sm font-semibold tabular-nums ${pnlClass(summary.netPnl)}`}>
                    {formatSignedCurrency(summary.netPnl)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Trades</div>
                  <div className="text-sm font-semibold tabular-nums">{summary.trades}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Win Rate</div>
                  <div className="text-sm font-semibold tabular-nums">{formatPercent(summary.winRate)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Win / Loss</div>
                  <div className="text-sm font-semibold tabular-nums">
                    <span className="text-emerald-500">{summary.winningTrades}W</span>
                    {" / "}
                    <span className="text-rose-500">{summary.losingTrades}L</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg Win</div>
                  <div className="text-sm font-semibold tabular-nums text-emerald-500">{formatCurrency(summary.avgWin)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg Loss</div>
                  <div className="text-sm font-semibold tabular-nums text-rose-500">{formatCurrency(summary.avgLoss)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Risk</div>
                  <div className="text-sm font-semibold tabular-nums">{formatCurrency(summary.totalRisk)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Total R</div>
                  <div className="text-sm font-semibold tabular-nums">{formatR(summary.totalR)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Best Trade</div>
                  <div className="text-sm font-semibold tabular-nums text-emerald-500">{formatCurrency(summary.bestTrade)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Worst Trade</div>
                  <div className="text-sm font-semibold tabular-nums text-rose-500">{formatCurrency(summary.worstTrade)}</div>
                </div>
              </div>
            </div>

            {summary.setups.length > 0 && (
              <div>
                <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                  Setups Traded
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {summary.setups.map((s) => (
                    <span key={s} className="rounded-md border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                Trades Taken ({trades.length})
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {trades.map((t) => (
                  <Link
                    key={t.id}
                    href={`/journal/${t.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm transition-colors hover:bg-accent hover:border-border/80"
                  >
                    <div className="flex items-center gap-2">
                      <SideBadge side={t.side as "LONG" | "SHORT"} />
                      <span className="font-semibold">{t.symbol}</span>
                      <span className="text-xs text-muted-foreground">{t.setup ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ResultBadge result={t.result as "WIN" | "LOSS" | "BREAKEVEN" | null} />
                      <span className={`w-20 text-right tabular-nums font-semibold ${pnlClass(t.netPnl)}`}>
                        {formatSignedCurrency(t.netPnl)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
