import Link from "next/link";
import { format } from "date-fns";
import {
  Wallet,
  Landmark,
  TrendingUp,
  TrendingDown,
  Percent,
  Target,
  Scale,
  Gauge,
  Crosshair,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EquityChart } from "@/components/charts/equity-chart";
import { PnlBarChart, type PnlBarDatum } from "@/components/charts/pnl-bar-chart";
import { DateRangeControl } from "@/components/dashboard/date-range-control";
import { GroupPerformanceList } from "@/components/dashboard/group-performance-list";
import { RecentTrades } from "@/components/dashboard/recent-trades";
import { RecentMistakes } from "@/components/dashboard/recent-mistakes";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStartingBalanceForScope, getTradesForScope } from "@/lib/trades";
import { getSelectedAccountId } from "@/lib/session";
import { filterTradesByRange, resolveDateRange } from "@/lib/date-range";
import {
  buildPeriodReports,
  computeMetrics,
  groupBySession,
  groupBySetup,
  groupBySymbol,
} from "@/lib/metrics";
import { buildInsights } from "@/lib/insights";
import { formatCurrency, formatMinutes, formatNumber, formatPercent, formatR, formatSignedCurrency, formatSignedPercent } from "@/lib/format";
import type { DateRangePreset } from "@/lib/constants";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = (sp.range as DateRangePreset) ?? "ALL";

  const selectedAccountId = await getSelectedAccountId();
  const [trades, balance] = await Promise.all([
    getTradesForScope(selectedAccountId),
    getStartingBalanceForScope(selectedAccountId),
  ]);

  const dateRange = resolveDateRange(range, { from: sp.from, to: sp.to });
  const filtered = filterTradesByRange(trades, dateRange);
  const metrics = computeMetrics(filtered, balance);

  if (trades.length === 0 && balance === 0) {
    return (
      <div>
        <PageHeader title="Dashboard" description="No account selected yet." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Create an account/workspace to start logging trades and see your dashboard come alive.
            </p>
            <Button asChild>
              <Link href="/settings?tab=accounts">Go to Accounts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const setups = groupBySetup(filtered);
  const symbols = groupBySymbol(filtered);
  const sessions = groupBySession(filtered);
  const insights = buildInsights(filtered, metrics);

  const dailyData: PnlBarDatum[] = metrics.equityCurve.slice(-45).map((p) => ({
    label: format(new Date(p.date), "MMM d"),
    value: p.dailyPnl,
  }));

  const monthlyReports = buildPeriodReports(filtered, balance, "monthly");
  const monthlyData: PnlBarDatum[] = monthlyReports.slice(-12).map((r) => ({
    label: format(new Date(`${r.label}-01`), "MMM yyyy"),
    value: r.netPnl,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Every figure below is computed live from your Trading Journal entries."
        actions={<DateRangeControl current={range} from={sp.from} to={sp.to} />}
      />

      {/* Row 1 — headline account KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Current Balance"
          value={formatCurrency(metrics.currentBalance)}
          icon={Wallet}
        />
        <MetricCard
          label="Starting Balance"
          value={formatCurrency(metrics.startingBalance)}
          icon={Landmark}
        />
        <MetricCard
          label="Net P&L"
          value={formatSignedCurrency(metrics.netPnl)}
          tone={metrics.netPnl > 0 ? "positive" : metrics.netPnl < 0 ? "negative" : "neutral"}
          icon={metrics.netPnl < 0 ? TrendingDown : TrendingUp}
        />
        <MetricCard
          label="Return %"
          value={formatSignedPercent(metrics.returnPercent)}
          tone={metrics.returnPercent > 0 ? "positive" : metrics.returnPercent < 0 ? "negative" : "neutral"}
          icon={Percent}
        />
      </div>

      {/* Row 2 — performance & edge metrics */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Win Rate"
          value={formatPercent(metrics.winRate)}
          icon={Target}
        />
        <MetricCard
          label="Profit Factor"
          value={Number.isFinite(metrics.profitFactor) ? formatNumber(metrics.profitFactor) : "∞"}
          tooltip="Gross profit divided by absolute gross loss. Above 1.0 means winners outweigh losers; above 2.0 is strong."
          icon={Scale}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={formatNumber(metrics.sharpeRatio)}
          tooltip="Annualized average return divided by volatility of periodic returns. Higher means more return per unit of risk. See Analytics for period controls."
          icon={Gauge}
        />
        <MetricCard
          label="Average R:R"
          value={metrics.avgPlannedRR ? `${formatNumber(metrics.avgPlannedRR)}R` : "—"}
          icon={Crosshair}
        />
      </div>

      {/* Equity curve */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Account Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <EquityChart data={metrics.equityCurve} startingBalance={metrics.startingBalance} />
        </CardContent>
      </Card>

      {/* Daily / monthly P&L */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <PnlBarChart data={dailyData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <PnlBarChart data={monthlyData} />
          </CardContent>
        </Card>
      </div>

      {/* Setup / Symbol / Session performance */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Setup Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupPerformanceList items={setups} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Symbol Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupPerformanceList items={symbols} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupPerformanceList items={sessions} />
          </CardContent>
        </Card>
      </div>

      {/* Recent trades / mistakes / insights */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Trades</CardTitle>
            <Link href="/journal" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <RecentTrades trades={filtered} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Mistakes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentMistakes trades={filtered} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsPanel insights={insights} />
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Avg holding time: {formatMinutes(metrics.averageHoldingMinutes)} · Avg R-multiple: {formatR(metrics.avgRMultiple)}
      </p>
    </div>
  );
}
