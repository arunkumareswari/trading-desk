import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { WeeklySummaryList } from "@/components/calendar/weekly-summary-list";
import { DayDetailDialog } from "@/components/calendar/day-detail-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTradesForScope } from "@/lib/trades";
import { getSelectedAccountId } from "@/lib/session";
import { closeDate, dailySummaries, isClosed, weeklySummaries } from "@/lib/metrics";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const accountId = await getSelectedAccountId();
  const trades = await getTradesForScope(accountId);

  const month = sp.month ? new Date(`${sp.month}-01T00:00:00`) : new Date();
  const days = dailySummaries(trades);
  const weeks = weeklySummaries(trades);

  const selectedDate = sp.date;
  const selectedDayTrades = selectedDate
    ? trades.filter(isClosed).filter((t) => format(closeDate(t), "yyyy-MM-dd") === selectedDate)
    : [];
  const selectedDaySummary = selectedDate ? days.get(selectedDate) : undefined;

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Click any day for its full breakdown. Weekly rollups on the right."
        actions={
          <Link
            href={`/calendar?month=${format(new Date(), "yyyy-MM")}`}
            className="text-sm text-primary hover:underline"
          >
            Go to current month
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="pt-5">
              <CalendarGrid
                month={month}
                days={days}
                basePath="/calendar"
                selectedDate={selectedDate}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Weekly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklySummaryList weeks={weeks} />
            </CardContent>
          </Card>
        </div>
      </div>

      <DayDetailDialog
        date={selectedDate}
        summary={selectedDaySummary}
        trades={selectedDayTrades}
      />
    </div>
  );
}

