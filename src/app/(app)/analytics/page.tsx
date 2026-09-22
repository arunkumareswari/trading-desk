import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatGroupCard, type Stat } from "@/components/analytics/stat-group-card";
import { GroupStatTable } from "@/components/analytics/group-stat-table";
import { MistakeTable } from "@/components/analytics/mistake-table";
import { PeriodReportTable } from "@/components/analytics/period-report-table";
import { ParamSelect } from "@/components/analytics/param-select";
import { PnlBarChart, type PnlBarDatum } from "@/components/charts/pnl-bar-chart";
import { getStartingBalanceForScope, getTradesForScope } from "@/lib/trades";
import { getSelectedAccountId } from "@/lib/session";
import {
  buildPeriodReports,
  computeMetrics,
  groupByConfidence,
  groupByDiscipline,
  groupByEmotion,
  groupByMistake,
  groupBySession,
  groupBySetup,
  groupBySymbol,
  type ReportGranularity,
  type ReturnPeriod,
} from "@/lib/metrics";
import { formatCurrency, formatMinutes, formatNumber, formatPercent, formatR, formatSignedCurrency } from "@/lib/format";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; granularity?: string }>;
}) {
  const sp = await searchParams;
  const period = (sp.period as ReturnPeriod) ?? "daily";
  const granularity = (sp.granularity as ReportGranularity) ?? "monthly";

  const accountId = await getSelectedAccountId();
  const [trades, balance] = await Promise.all([
    getTradesForScope(accountId),
    getStartingBalanceForScope(accountId),
  ]);

  const m = computeMetrics(trades, balance, period);

  const profitability: Stat[] = [
    { label: "Net Profit", value: formatSignedCurrency(m.netPnl), tone: m.netPnl },
    { label: "Gross Profit", value: formatCurrency(m.grossProfit), tone: 1 },
    { label: "Gross Loss", value: formatCurrency(m.grossLoss), tone: -1 },
    { label: "Profit Factor", value: Number.isFinite(m.profitFactor) ? formatNumber(m.profitFactor) : "∞" },
    { label: "Win Rate", value: formatPercent(m.winRate) },
    { label: "Loss Rate", value: formatPercent(m.lossRate) },
    { label: "Expectancy", value: formatCurrency(m.expectancy) },
    { label: "Average Trade", value: formatCurrency(m.avgTrade) },
    { label: "Average Win", value: formatCurrency(m.avgWin), tone: 1 },
    { label: "Average Loss", value: formatCurrency(m.avgLoss), tone: -1 },
  ];

  const risk: Stat[] = [
    { label: "Maximum Drawdown", value: `${formatCurrency(m.maxDrawdown)} (${formatPercent(m.maxDrawdownPercent)})`, tone: -1 },
    { label: "Average Drawdown", value: formatCurrency(m.avgDrawdown) },
    { label: "Risk per Trade", value: m.totalTrades ? formatCurrency(m.totalRisk / m.totalTrades) : "—" },
    { label: "Average R", value: formatR(m.avgRMultiple) },
    { label: "Max Consecutive Losses", value: String(m.maxLossStreak) },
    { label: "Max Consecutive Wins", value: String(m.maxWinStreak) },
    { label: "Recovery Factor", value: formatNumber(m.recoveryFactor) },
  ];

  const statistical: Stat[] = [
    { label: "Sharpe Ratio", value: formatNumber(m.sharpeRatio) },
    { label: "Sortino Ratio", value: formatNumber(m.sortinoRatio) },
    { label: "Calmar Ratio", value: formatNumber(m.calmarRatio) },
    { label: "Expectancy", value: formatCurrency(m.expectancy) },
    { label: "Avg Period Return", value: formatPercent(m.avgPeriodReturn * 100, 2) },
    { label: "Std. Dev. of Returns", value: formatPercent(m.stdDevReturns * 100, 2) },
  ];

  const tradeStats: Stat[] = [
    { label: "Total Trades", value: String(m.totalTrades) },
    { label: "Long Trades", value: String(m.longTrades) },
    { label: "Short Trades", value: String(m.shortTrades) },
    { label: "Winning Trades", value: String(m.winningTrades) },
    { label: "Losing Trades", value: String(m.losingTrades) },
    { label: "Breakeven Trades", value: String(m.breakevenTrades) },
    { label: "Average Holding Time", value: formatMinutes(m.averageHoldingMinutes) },
    { label: "Largest Winner", value: formatCurrency(m.bestTrade), tone: 1 },
    { label: "Largest Loser", value: formatCurrency(m.worstTrade), tone: -1 },
  ];

  const setups = groupBySetup(trades);
  const symbols = groupBySymbol(trades);
  const sessions = groupBySession(trades);
  const emotions = groupByEmotion(trades);
  const confidence = groupByConfidence(trades);
  const discipline = groupByDiscipline(trades);
  const mistakes = groupByMistake(trades);
  const reports = buildPeriodReports(trades, balance, granularity);

  const setupChart: PnlBarDatum[] = setups.map((s) => ({ label: s.key, value: s.netPnl }));
  const symbolChart: PnlBarDatum[] = symbols.map((s) => ({ label: s.key, value: s.netPnl }));
  const sessionChart: PnlBarDatum[] = sessions.map((s) => ({ label: s.key, value: s.netPnl }));

  return (
    <div>
      <PageHeader title="Analytics" description="Deep performance, risk, and behavioral analysis — all computed from your journal." />

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="setups">Setups</TabsTrigger>
          <TabsTrigger value="symbols">Symbols</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="psychology">Psychology</TabsTrigger>
          <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Sharpe / Sortino period</span>
            <ParamSelect
              paramName="period"
              value={period}
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
          </div>
          <StatGroupCard title="Profitability" stats={profitability} />
          <StatGroupCard title="Risk" stats={risk} />
          <StatGroupCard title="Statistical Metrics" stats={statistical} />
          <StatGroupCard title="Trade Statistics" stats={tradeStats} />
        </TabsContent>

        <TabsContent value="setups" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Net P&L by Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <PnlBarChart data={setupChart} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <GroupStatTable keyLabel="Setup" items={setups} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="symbols" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Net P&L by Symbol</CardTitle>
            </CardHeader>
            <CardContent>
              <PnlBarChart data={symbolChart} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <GroupStatTable keyLabel="Symbol" items={symbols} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Net P&L by Session</CardTitle>
            </CardHeader>
            <CardContent>
              <PnlBarChart data={sessionChart} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <GroupStatTable keyLabel="Session" items={sessions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="psychology" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emotion (During Trade) vs. P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupStatTable keyLabel="Emotion" items={emotions} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Confidence Level vs. P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupStatTable keyLabel="Confidence" items={confidence} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Discipline Score vs. P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupStatTable keyLabel="Discipline" items={discipline} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mistakes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mistake Frequency & Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <MistakeTable items={mistakes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4 space-y-4">
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">Granularity</span>
            <ParamSelect
              paramName="granularity"
              value={granularity}
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Quarterly" },
                { value: "yearly", label: "Yearly" },
              ]}
            />
          </div>
          <Card>
            <CardContent className="pt-5">
              <PeriodReportTable reports={reports} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
