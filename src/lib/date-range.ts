import {
  endOfDay,
  startOfDay,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import type { DateRangePreset } from "@/lib/constants";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export function resolveDateRange(
  preset: DateRangePreset,
  custom?: { from?: string; to?: string },
): DateRange {
  const now = new Date();
  const to = endOfDay(now);
  switch (preset) {
    case "1W":
      return { from: startOfDay(subDays(now, 7)), to };
    case "1M":
      return { from: startOfDay(subMonths(now, 1)), to };
    case "3M":
      return { from: startOfDay(subMonths(now, 3)), to };
    case "6M":
      return { from: startOfDay(subMonths(now, 6)), to };
    case "YTD":
      return { from: startOfYear(now), to };
    case "1Y":
      return { from: startOfDay(subYears(now, 1)), to };
    case "ALL":
      return { from: null, to: null };
    case "CUSTOM":
      return {
        from: custom?.from ? startOfDay(new Date(custom.from)) : null,
        to: custom?.to ? endOfDay(new Date(custom.to)) : null,
      };
  }
}

export function filterTradesByRange<
  T extends { date: Date; closingDate: Date | null },
>(trades: T[], range: DateRange): T[] {
  if (!range.from && !range.to) return trades;
  return trades.filter((t) => {
    const d = t.closingDate ?? t.date;
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  });
}
