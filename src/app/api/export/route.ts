import { NextRequest, NextResponse } from "next/server";
import { getAccounts, getStartingBalanceForScope, getTradesForScope } from "@/lib/trades";
import { getSelectedAccountId } from "@/lib/session";
import { reportsToCsv, tradesToCsv } from "@/lib/csv";
import { buildPeriodReports } from "@/lib/metrics";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "journal";
  const accountId = await getSelectedAccountId();
  const [trades, accounts, balance] = await Promise.all([
    getTradesForScope(accountId),
    getAccounts(),
    getStartingBalanceForScope(accountId),
  ]);

  let csv: string;
  let filename: string;

  if (type === "report") {
    const reports = buildPeriodReports(trades, balance, "monthly");
    csv = reportsToCsv(reports);
    filename = "performance-report.csv";
  } else {
    csv = tradesToCsv(trades, accounts);
    filename = "trading-journal.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
