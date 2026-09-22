import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Side, TradeResult } from "@/lib/constants";

export function SideBadge({ side }: { side: Side }) {
  const isLong = side === "LONG";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
        isLong
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400",
      )}
    >
      {isLong ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {side}
    </span>
  );
}

export function ResultBadge({ result }: { result: TradeResult | null }) {
  if (!result) {
    return (
      <span className="inline-flex items-center rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
        OPEN
      </span>
    );
  }
  const styles =
    result === "WIN"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : result === "LOSS"
        ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
        : "border-border bg-secondary text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium", styles)}>
      {result}
    </span>
  );
}
