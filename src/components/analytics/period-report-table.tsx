import type { PeriodReport } from "@/lib/metrics";
import { formatCurrency, formatPercent, formatR, formatSignedCurrency, pnlClass } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PeriodReportTable({ reports }: { reports: PeriodReport[] }) {
  if (!reports.length) {
    return <div className="py-10 text-center text-sm text-muted-foreground">No closed trades yet.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
            <TableHead className="text-right">Profit Factor</TableHead>
            <TableHead className="text-right">Sharpe</TableHead>
            <TableHead className="text-right">Max DD %</TableHead>
            <TableHead className="text-right">Avg Win</TableHead>
            <TableHead className="text-right">Avg Loss</TableHead>
            <TableHead className="text-right">Trades</TableHead>
            <TableHead className="text-right">Avg R</TableHead>
            <TableHead className="text-right">Best Day</TableHead>
            <TableHead className="text-right">Worst Day</TableHead>
            <TableHead className="text-right">Best Trade</TableHead>
            <TableHead className="text-right">Worst Trade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...reports].reverse().map((r) => (
            <TableRow key={r.label}>
              <TableCell className="font-medium">{r.label}</TableCell>
              <TableCell className={`text-right tabular-nums font-medium ${pnlClass(r.netPnl)}`}>
                {formatSignedCurrency(r.netPnl)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatPercent(r.winRate)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {Number.isFinite(r.profitFactor) ? r.profitFactor.toFixed(2) : "∞"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{r.sharpeRatio.toFixed(2)}</TableCell>
              <TableCell className="text-right tabular-nums text-rose-700 dark:text-rose-400">{formatPercent(r.maxDrawdownPercent)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.avgWin)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.avgLoss)}</TableCell>
              <TableCell className="text-right tabular-nums">{r.totalTrades}</TableCell>
              <TableCell className="text-right tabular-nums">{formatR(r.avgR)}</TableCell>
              <TableCell className="text-right tabular-nums text-emerald-700 dark:text-emerald-400">{formatCurrency(r.bestDay)}</TableCell>
              <TableCell className="text-right tabular-nums text-rose-700 dark:text-rose-400">{formatCurrency(r.worstDay)}</TableCell>
              <TableCell className="text-right tabular-nums text-emerald-700 dark:text-emerald-400">{formatCurrency(r.bestTrade)}</TableCell>
              <TableCell className="text-right tabular-nums text-rose-700 dark:text-rose-400">{formatCurrency(r.worstTrade)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
