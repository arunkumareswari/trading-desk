import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function MetricCard({
  label,
  value,
  sub,
  tone = "neutral",
  tooltip,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "positive" | "negative" | "neutral";
  tooltip?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 transition-colors", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="truncate">{label}</span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 shrink-0 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-64 text-xs normal-case">{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/80 text-muted-foreground",
              tone === "positive" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              tone === "negative" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div
        className={cn(
          "mt-1.5 text-xl font-semibold tabular-nums tracking-tight",
          tone === "positive" && "text-emerald-700 dark:text-emerald-400",
          tone === "negative" && "text-rose-700 dark:text-rose-400",
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
