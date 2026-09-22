import Link from "next/link";
import { format, isSameMonth, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildMonthGrid } from "@/lib/calendar";
import type { DaySummary } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { formatSignedCurrency } from "@/lib/format";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CalendarGrid({
  month,
  days,
  basePath,
  dateBasePath,
  selectedDate,
  extraParams,
}: {
  month: Date;
  days: Map<string, DaySummary>;
  basePath: string;
  dateBasePath?: string;
  selectedDate?: string;
  extraParams?: Record<string, string>;
}) {
  const grid = buildMonthGrid(month);
  const monthLabel = format(month, "MMMM yyyy");
  const params = new URLSearchParams(extraParams);

  const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const prevHref = `${basePath}?${new URLSearchParams({ ...extraParams, month: format(prevMonth, "yyyy-MM") }).toString()}`;
  const nextHref = `${basePath}?${new URLSearchParams({ ...extraParams, month: format(nextMonth, "yyyy-MM") }).toString()}`;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <Link
            href={prevHref}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={nextHref}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {grid.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const summary = days.get(key);
          const inMonth = isSameMonth(day, month);
          const selected = selectedDate === key;
          const dayParams = new URLSearchParams(params);
          dayParams.set("month", format(month, "yyyy-MM"));
          dayParams.set("date", key);

          return (
            <Link
              key={key}
              href={`${dateBasePath ?? basePath}?${dayParams.toString()}`}
              scroll={false}
              className={cn(
                "flex h-20 flex-col justify-between rounded-lg border p-1.5 text-left transition-colors sm:h-24",
                !inMonth && "opacity-40",
                selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40",
                summary
                  ? summary.netPnl >= 0
                    ? "bg-emerald-500/[0.07]"
                    : "bg-rose-500/[0.07]"
                  : "bg-card",
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  isToday(day) && "flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground",
                )}
              >
                {format(day, "d")}
              </span>
              {summary && (
                <div className="space-y-0.5">
                  <div className={cn("text-xs font-semibold tabular-nums", summary.netPnl >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
                    {formatSignedCurrency(summary.netPnl, true)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {summary.trades} trade{summary.trades === 1 ? "" : "s"}
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
