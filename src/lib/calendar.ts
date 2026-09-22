import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";

/** 6-week (42-day) Monday-start grid covering the given month, padded with adjacent-month days. */
export function buildMonthGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}
