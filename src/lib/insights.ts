import { groupByDiscipline, groupBySession, groupBySetup, type MetricsTrade, type PerformanceMetrics } from "@/lib/metrics";

export function buildInsights(trades: MetricsTrade[], metrics: PerformanceMetrics): string[] {
  const insights: string[] = [];

  const setups = groupBySetup(trades).filter((s) => s.trades >= 3);
  if (setups.length) {
    const best = setups[0];
    insights.push(
      `${best.key} is your most profitable setup — ${best.trades} trades, ${best.winRate.toFixed(0)}% win rate, ${best.netPnl >= 0 ? "+" : ""}${best.netPnl.toFixed(0)} net.`,
    );
    const worst = setups[setups.length - 1];
    if (worst.netPnl < 0 && worst.key !== best.key) {
      insights.push(
        `${worst.key} has been a net drag (${worst.netPnl.toFixed(0)}) across ${worst.trades} trades — consider reviewing entry rules.`,
      );
    }
  }

  const sessions = groupBySession(trades).filter((s) => s.trades >= 3);
  if (sessions.length) {
    const bestSession = sessions[0];
    insights.push(
      `${bestSession.key} session shows your strongest edge (${bestSession.winRate.toFixed(0)}% win rate, PF ${
        Number.isFinite(bestSession.profitFactor) ? bestSession.profitFactor.toFixed(2) : "∞"
      }).`,
    );
  }

  const discipline = groupByDiscipline(trades).filter((d) => d.trades >= 3);
  if (discipline.length >= 2) {
    const high = discipline[discipline.length - 1];
    const low = discipline[0];
    if (high.avgPnl > low.avgPnl) {
      insights.push(
        `Trades logged with discipline score ${high.key}+ average ${high.avgPnl.toFixed(0)} vs ${low.avgPnl.toFixed(0)} at score ${low.key} — discipline is correlating with results.`,
      );
    }
  }

  if (metrics.maxLossStreak >= 3) {
    insights.push(
      `Longest losing streak is ${metrics.maxLossStreak} trades — consider a rule for reducing size after 2 consecutive losses.`,
    );
  }

  if (!insights.length) {
    insights.push("Log a few more trades to unlock personalized performance insights.");
  }

  return insights.slice(0, 5);
}
