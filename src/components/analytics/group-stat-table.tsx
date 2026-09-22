import type { GroupSummary } from "@/lib/metrics";
import { formatCurrency, formatPercent, formatR, formatSignedCurrency, pnlClass } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function GroupStatTable({ keyLabel, items }: { keyLabel: string; items: GroupSummary[] }) {
  if (!items.length) {
    return <div className="py-10 text-center text-sm text-muted-foreground">No data yet.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{keyLabel}</TableHead>
            <TableHead className="text-right">Trades</TableHead>
            <TableHead className="text-right">Win Rate</TableHead>
            <TableHead className="text-right">Net P&L</TableHead>
            <TableHead className="text-right">Avg P&L</TableHead>
            <TableHead className="text-right">Profit Factor</TableHead>
            <TableHead className="text-right">Avg R</TableHead>
            <TableHead className="text-right">Best Trade</TableHead>
            <TableHead className="text-right">Worst Trade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((r) => (
            <TableRow key={r.key}>
              <TableCell className="font-medium">{r.key}</TableCell>
              <TableCell className="text-right tabular-nums">{r.trades}</TableCell>
              <TableCell className="text-right tabular-nums">{formatPercent(r.winRate)}</TableCell>
              <TableCell className={`text-right tabular-nums font-medium ${pnlClass(r.netPnl)}`}>
                {formatSignedCurrency(r.netPnl)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.avgPnl)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {Number.isFinite(r.profitFactor) ? r.profitFactor.toFixed(2) : "∞"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatR(r.avgR)}</TableCell>
              <TableCell className="text-right tabular-nums text-emerald-700 dark:text-emerald-400">{formatCurrency(r.bestTrade)}</TableCell>
              <TableCell className="text-right tabular-nums text-rose-700 dark:text-rose-400">{formatCurrency(r.worstTrade)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
