import type { MistakeSummary } from "@/lib/metrics";
import { formatCurrency, formatSignedCurrency, pnlClass } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MistakeTable({ items }: { items: MistakeSummary[] }) {
  if (!items.length) {
    return <div className="py-10 text-center text-sm text-muted-foreground">No mistakes tagged yet — clean journal.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mistake</TableHead>
            <TableHead className="text-right">Occurrences</TableHead>
            <TableHead className="text-right">P&L Impact</TableHead>
            <TableHead className="text-right">Average Loss</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((m) => (
            <TableRow key={m.name}>
              <TableCell className="font-medium">{m.name}</TableCell>
              <TableCell className="text-right tabular-nums">{m.frequency}</TableCell>
              <TableCell className={`text-right tabular-nums font-medium ${pnlClass(m.totalPnlImpact)}`}>
                {formatSignedCurrency(m.totalPnlImpact)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-rose-700 dark:text-rose-400">{formatCurrency(m.avgLoss)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
