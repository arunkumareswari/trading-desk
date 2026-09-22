import {
  differenceInMinutes,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Trade as PrismaTrade } from "@/generated/prisma/client";

/** A Trade row with its many-to-many mistakes flattened to plain names. */
export type MetricsTrade = PrismaTrade & { mistakes: string[] };

export const isClosed = (t: MetricsTrade) => t.result !== null;
export const closeDate = (t: MetricsTrade): Date => t.closingDate ?? t.date;

export function sortByClose(trades: MetricsTrade[]): MetricsTrade[] {
  return [...trades].sort(
    (a, b) =>
      closeDate(a).getTime() - closeDate(b).getTime() ||
      (a.closingTime ?? "").localeCompare(b.closingTime ?? ""),
  );
}

function mean(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = mean(nums);
  const variance =
    nums.reduce((sum, n) => sum + (n - m) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

// ---------------------------------------------------------------------------
// Equity curve & drawdown
// ---------------------------------------------------------------------------

export interface EquityPoint {
  date: string; // yyyy-MM-dd
  balance: number;
  equity: number;
  dailyPnl: number;
}

/**
 * Balance is never stored — it's always the starting balance plus the
 * running sum of realized netPnl, so editing/deleting a trade automatically
 * changes every point downstream of it the next time this is called.
 * Equity == balance here: there's no live price feed to mark open positions
 * to market, so unrealized P&L isn't reflected (open trades are excluded).
 */
export function buildEquityCurve(
  trades: MetricsTrade[],
  startingBalance: number,
): EquityPoint[] {
  const closed = sortByClose(trades.filter(isClosed));
  const byDay = new Map<string, number>();
  for (const t of closed) {
    const key = format(closeDate(t), "yyyy-MM-dd");
    byDay.set(key, (byDay.get(key) ?? 0) + t.netPnl);
  }
  const days = [...byDay.keys()].sort();
  let running = startingBalance;
  return days.map((day) => {
    const dailyPnl = byDay.get(day)!;
    running += dailyPnl;
    return { date: day, balance: running, equity: running, dailyPnl };
  });
}

export interface DrawdownPoint {
  date: string;
  drawdown: number;
  drawdownPercent: number;
}

export function buildDrawdownSeries(
  equity: EquityPoint[],
  startingBalance: number,
): DrawdownPoint[] {
  let peak = startingBalance;
  return equity.map((p) => {
    peak = Math.max(peak, p.balance);
    const drawdown = peak - p.balance;
    const drawdownPercent = peak > 0 ? (drawdown / peak) * 100 : 0;
    return { date: p.date, drawdown, drawdownPercent };
  });
}

// ---------------------------------------------------------------------------
// Periodic returns & risk-adjusted ratios
// ---------------------------------------------------------------------------

export type ReturnPeriod = "daily" | "weekly" | "monthly";
const ANNUALIZATION: Record<ReturnPeriod, number> = {
  daily: 252,
  weekly: 52,
  monthly: 12,
};

function periodKey(date: Date, period: ReturnPeriod): string {
  if (period === "daily") return format(date, "yyyy-MM-dd");
  if (period === "weekly")
    return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
  return format(startOfMonth(date), "yyyy-MM");
}

export function periodicReturns(
  trades: MetricsTrade[],
  startingBalance: number,
  period: ReturnPeriod,
): number[] {
  const closed = sortByClose(trades.filter(isClosed));
  const byPeriod = new Map<string, number>();
  for (const t of closed) {
    const key = periodKey(closeDate(t), period);
    byPeriod.set(key, (byPeriod.get(key) ?? 0) + t.netPnl);
  }
  const keys = [...byPeriod.keys()].sort();
  let bal = startingBalance;
  const returns: number[] = [];
  for (const k of keys) {
    const pnl = byPeriod.get(k)!;
    const prevBal = bal;
    bal += pnl;
    if (prevBal !== 0) returns.push(pnl / prevBal);
  }
  return returns;
}

export function sharpeRatio(
  returns: number[],
  period: ReturnPeriod,
  riskFreeRate = 0,
): { sharpe: number; avgReturn: number; volatility: number } {
  const excess = returns.map((r) => r - riskFreeRate);
  const avgReturn = mean(excess);
  const volatility = stdDev(excess);
  const sharpe =
    volatility > 0
      ? (avgReturn / volatility) * Math.sqrt(ANNUALIZATION[period])
      : 0;
  return { sharpe, avgReturn, volatility };
}

export function sortinoRatio(
  returns: number[],
  period: ReturnPeriod,
  riskFreeRate = 0,
): number {
  const excess = returns.map((r) => r - riskFreeRate);
  const avgReturn = mean(excess);
  const downside = excess.filter((r) => r < 0);
  const downsideDev = stdDev(downside.length ? downside : [0]);
  return downsideDev > 0
    ? (avgReturn / downsideDev) * Math.sqrt(ANNUALIZATION[period])
    : 0;
}

export function calmarRatio(
  annualizedReturnPercent: number,
  maxDrawdownPercent: number,
): number {
  return maxDrawdownPercent > 0
    ? annualizedReturnPercent / maxDrawdownPercent
    : 0;
}

// ---------------------------------------------------------------------------
// Streaks & holding time
// ---------------------------------------------------------------------------

export function consecutiveStreaks(trades: MetricsTrade[]) {
  const closed = sortByClose(trades.filter(isClosed));
  let maxWin = 0,
    maxLoss = 0,
    curWin = 0,
    curLoss = 0;
  for (const t of closed) {
    if (t.result === "WIN") {
      curWin++;
      curLoss = 0;
      maxWin = Math.max(maxWin, curWin);
    } else if (t.result === "LOSS") {
      curLoss++;
      curWin = 0;
      maxLoss = Math.max(maxLoss, curLoss);
    } else {
      curWin = 0;
      curLoss = 0;
    }
  }
  return { maxWinStreak: maxWin, maxLossStreak: maxLoss };
}

function combineDateTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

export function averageHoldingMinutes(trades: MetricsTrade[]): number | null {
  const durations: number[] = [];
  for (const t of trades) {
    if (!t.entryTime || !t.closingTime || !t.closingDate) continue;
    const start = combineDateTime(t.date, t.entryTime);
    const end = combineDateTime(t.closingDate, t.closingTime);
    const mins = differenceInMinutes(end, start);
    if (mins >= 0) durations.push(mins);
  }
  return durations.length ? mean(durations) : null;
}

// ---------------------------------------------------------------------------
// Full KPI set — the one function every page ultimately reads from
// ---------------------------------------------------------------------------

export interface PerformanceMetrics {
  startingBalance: number;
  currentBalance: number;
  netPnl: number;
  returnPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  lossRate: number;
  avgWin: number;
  avgLoss: number;
  avgTrade: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  expectancy: number;
  bestTrade: number;
  worstTrade: number;
  avgPlannedRR: number;
  avgRMultiple: number;
  totalRisk: number;
  totalLots: number;
  longTrades: number;
  shortTrades: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  avgDrawdown: number;
  recoveryFactor: number;
  maxWinStreak: number;
  maxLossStreak: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  avgPeriodReturn: number;
  stdDevReturns: number;
  averageHoldingMinutes: number | null;
  equityCurve: EquityPoint[];
  drawdownSeries: DrawdownPoint[];
}

export function computeMetrics(
  trades: MetricsTrade[],
  startingBalance: number,
  returnPeriod: ReturnPeriod = "daily",
): PerformanceMetrics {
  const closed = trades.filter(isClosed);
  const winners = closed.filter((t) => t.result === "WIN");
  const losers = closed.filter((t) => t.result === "LOSS");
  const breakeven = closed.filter((t) => t.result === "BREAKEVEN");

  const grossProfit = winners.reduce((s, t) => s + t.netPnl, 0);
  const grossLoss = losers.reduce((s, t) => s + t.netPnl, 0); // negative
  const netPnl = closed.reduce((s, t) => s + t.netPnl, 0);

  const winRate = closed.length ? (winners.length / closed.length) * 100 : 0;
  const lossRate = closed.length ? (losers.length / closed.length) * 100 : 0;
  const avgWin = winners.length ? grossProfit / winners.length : 0;
  const avgLoss = losers.length ? grossLoss / losers.length : 0;
  const avgTrade = closed.length ? netPnl / closed.length : 0;
  const profitFactor =
    grossLoss !== 0
      ? grossProfit / Math.abs(grossLoss)
      : grossProfit > 0
        ? Infinity
        : 0;
  const expectancy = (winRate / 100) * avgWin + (lossRate / 100) * avgLoss;

  const rrValues = closed
    .map((t) => t.plannedRR)
    .filter((v): v is number => v != null);
  const rMultiples = closed
    .map((t) => t.rMultiple)
    .filter((v): v is number => v != null);

  const totalRisk = closed.reduce((s, t) => s + (t.riskAmount ?? 0), 0);
  const totalLots = closed.reduce((s, t) => s + t.quantity, 0);
  const longTrades = closed.filter((t) => t.side === "LONG").length;
  const shortTrades = closed.filter((t) => t.side === "SHORT").length;

  const bestTrade = closed.length ? Math.max(...closed.map((t) => t.netPnl)) : 0;
  const worstTrade = closed.length ? Math.min(...closed.map((t) => t.netPnl)) : 0;

  const equityCurve = buildEquityCurve(closed, startingBalance);
  const drawdownSeries = buildDrawdownSeries(equityCurve, startingBalance);
  const maxDrawdown = drawdownSeries.length
    ? Math.max(...drawdownSeries.map((d) => d.drawdown))
    : 0;
  const maxDrawdownPercent = drawdownSeries.length
    ? Math.max(...drawdownSeries.map((d) => d.drawdownPercent))
    : 0;
  const avgDrawdown = mean(
    drawdownSeries.map((d) => d.drawdown).filter((d) => d > 0),
  );
  const recoveryFactor = maxDrawdown > 0 ? netPnl / maxDrawdown : 0;

  const { maxWinStreak, maxLossStreak } = consecutiveStreaks(closed);

  const returns = periodicReturns(closed, startingBalance, returnPeriod);
  const { sharpe, volatility, avgReturn } = sharpeRatio(returns, returnPeriod);
  const sortino = sortinoRatio(returns, returnPeriod);

  const currentBalance = startingBalance + netPnl;
  const returnPercent =
    startingBalance > 0 ? (netPnl / startingBalance) * 100 : 0;

  const ordered = sortByClose(closed);
  const firstDate = ordered.length ? closeDate(ordered[0]) : null;
  const lastDate = ordered.length ? closeDate(ordered[ordered.length - 1]) : null;
  const daysElapsed =
    firstDate && lastDate
      ? Math.max(1, (lastDate.getTime() - firstDate.getTime()) / 86_400_000)
      : 1;
  const annualizedReturnPercent = returnPercent * (365 / daysElapsed);
  const calmar = calmarRatio(annualizedReturnPercent, maxDrawdownPercent);

  return {
    startingBalance,
    currentBalance,
    netPnl,
    returnPercent,
    totalTrades: closed.length,
    winningTrades: winners.length,
    losingTrades: losers.length,
    breakevenTrades: breakeven.length,
    winRate,
    lossRate,
    avgWin,
    avgLoss,
    avgTrade,
    grossProfit,
    grossLoss,
    profitFactor,
    expectancy,
    bestTrade,
    worstTrade,
    avgPlannedRR: mean(rrValues),
    avgRMultiple: mean(rMultiples),
    totalRisk,
    totalLots,
    longTrades,
    shortTrades,
    maxDrawdown,
    maxDrawdownPercent,
    avgDrawdown,
    recoveryFactor,
    maxWinStreak,
    maxLossStreak,
    sharpeRatio: sharpe,
    sortinoRatio: sortino,
    calmarRatio: calmar,
    avgPeriodReturn: avgReturn,
    stdDevReturns: volatility,
    averageHoldingMinutes: averageHoldingMinutes(closed),
    equityCurve,
    drawdownSeries,
  };
}

// ---------------------------------------------------------------------------
// Grouping: setup / symbol / session / mistake / psychology
// ---------------------------------------------------------------------------

export interface GroupSummary {
  key: string;
  trades: number;
  winRate: number;
  netPnl: number;
  avgPnl: number;
  profitFactor: number;
  avgR: number;
  bestTrade: number;
  worstTrade: number;
}

function summarizeGroup(key: string, trades: MetricsTrade[]): GroupSummary {
  const closed = trades.filter(isClosed);
  const winners = closed.filter((t) => t.result === "WIN");
  const losers = closed.filter((t) => t.result === "LOSS");
  const grossProfit = winners.reduce((s, t) => s + t.netPnl, 0);
  const grossLoss = losers.reduce((s, t) => s + t.netPnl, 0);
  const netPnl = closed.reduce((s, t) => s + t.netPnl, 0);
  const rValues = closed
    .map((t) => t.rMultiple)
    .filter((v): v is number => v != null);
  return {
    key,
    trades: closed.length,
    winRate: closed.length ? (winners.length / closed.length) * 100 : 0,
    netPnl,
    avgPnl: closed.length ? netPnl / closed.length : 0,
    profitFactor:
      grossLoss !== 0
        ? grossProfit / Math.abs(grossLoss)
        : grossProfit > 0
          ? Infinity
          : 0,
    avgR: mean(rValues),
    bestTrade: closed.length ? Math.max(...closed.map((t) => t.netPnl)) : 0,
    worstTrade: closed.length ? Math.min(...closed.map((t) => t.netPnl)) : 0,
  };
}

export function groupByKey(
  trades: MetricsTrade[],
  keyFn: (t: MetricsTrade) => string | null,
): GroupSummary[] {
  const map = new Map<string, MetricsTrade[]>();
  for (const t of trades) {
    const k = keyFn(t);
    if (!k) continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(t);
  }
  return [...map.entries()]
    .map(([k, ts]) => summarizeGroup(k, ts))
    .sort((a, b) => b.netPnl - a.netPnl);
}

export const groupBySetup = (t: MetricsTrade[]) => groupByKey(t, (x) => x.setup);
export const groupBySymbol = (t: MetricsTrade[]) => groupByKey(t, (x) => x.symbol);
export const groupBySession = (t: MetricsTrade[]) => groupByKey(t, (x) => x.session);
export const groupByEmotion = (t: MetricsTrade[]) =>
  groupByKey(t, (x) => x.emotionDuring);
export const groupByConfidence = (t: MetricsTrade[]) =>
  groupByKey(t, (x) => (x.confidenceLevel != null ? String(x.confidenceLevel) : null)).sort(
    (a, b) => Number(a.key) - Number(b.key),
  );
export const groupByDiscipline = (t: MetricsTrade[]) =>
  groupByKey(t, (x) => (x.disciplineScore != null ? String(x.disciplineScore) : null)).sort(
    (a, b) => Number(a.key) - Number(b.key),
  );

export interface MistakeSummary {
  name: string;
  frequency: number;
  totalPnlImpact: number;
  avgLoss: number;
}

export function groupByMistake(trades: MetricsTrade[]): MistakeSummary[] {
  const map = new Map<string, MetricsTrade[]>();
  for (const t of trades) {
    for (const m of t.mistakes) {
      if (!map.has(m)) map.set(m, []);
      map.get(m)!.push(t);
    }
  }
  return [...map.entries()]
    .map(([name, ts]) => {
      const closed = ts.filter(isClosed);
      const totalPnlImpact = closed.reduce((s, t) => s + t.netPnl, 0);
      const losers = closed.filter((t) => t.result === "LOSS");
      const avgLoss = losers.length
        ? losers.reduce((s, t) => s + t.netPnl, 0) / losers.length
        : 0;
      return { name, frequency: closed.length, totalPnlImpact, avgLoss };
    })
    .sort((a, b) => a.totalPnlImpact - b.totalPnlImpact);
}

// ---------------------------------------------------------------------------
// Daily / weekly / period reports
// ---------------------------------------------------------------------------

export interface DaySummary {
  date: string;
  trades: number;
  netPnl: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  totalRisk: number;
  totalR: number;
  bestTrade: number;
  worstTrade: number;
  setups: string[];
}

export function dailySummaries(trades: MetricsTrade[]): Map<string, DaySummary> {
  const map = new Map<string, MetricsTrade[]>();
  for (const t of trades.filter(isClosed)) {
    const key = format(closeDate(t), "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  const out = new Map<string, DaySummary>();
  for (const [date, ts] of map) {
    const winners = ts.filter((t) => t.result === "WIN");
    const losers = ts.filter((t) => t.result === "LOSS");
    const netPnl = ts.reduce((s, t) => s + t.netPnl, 0);
    out.set(date, {
      date,
      trades: ts.length,
      netPnl,
      winningTrades: winners.length,
      losingTrades: losers.length,
      winRate: ts.length ? (winners.length / ts.length) * 100 : 0,
      avgWin: winners.length
        ? winners.reduce((s, t) => s + t.netPnl, 0) / winners.length
        : 0,
      avgLoss: losers.length
        ? losers.reduce((s, t) => s + t.netPnl, 0) / losers.length
        : 0,
      totalRisk: ts.reduce((s, t) => s + (t.riskAmount ?? 0), 0),
      totalR: ts.reduce((s, t) => s + (t.rMultiple ?? 0), 0),
      bestTrade: Math.max(...ts.map((t) => t.netPnl)),
      worstTrade: Math.min(...ts.map((t) => t.netPnl)),
      setups: [...new Set(ts.map((t) => t.setup).filter((s): s is string => !!s))],
    });
  }
  return out;
}

export interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  netPnl: number;
  tradingDays: number;
  trades: number;
  winRate: number;
  avgDailyPnl: number;
}

export function weeklySummaries(trades: MetricsTrade[]): WeekSummary[] {
  const days = dailySummaries(trades);
  const map = new Map<string, DaySummary[]>();
  for (const d of days.values()) {
    const key = format(startOfWeek(new Date(d.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  }
  return [...map.entries()]
    .map(([weekStart, ds]) => {
      const weekEnd = format(
        endOfWeek(new Date(weekStart), { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );
      const netPnl = ds.reduce((s, d) => s + d.netPnl, 0);
      const trades = ds.reduce((s, d) => s + d.trades, 0);
      const winningTrades = ds.reduce((s, d) => s + d.winningTrades, 0);
      return {
        weekStart,
        weekEnd,
        netPnl,
        tradingDays: ds.length,
        trades,
        winRate: trades ? (winningTrades / trades) * 100 : 0,
        avgDailyPnl: ds.length ? netPnl / ds.length : 0,
      };
    })
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export type ReportGranularity = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface PeriodReport {
  label: string;
  start: string;
  end: string;
  netPnl: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdownPercent: number;
  avgWin: number;
  avgLoss: number;
  totalTrades: number;
  avgR: number;
  bestDay: number;
  worstDay: number;
  bestTrade: number;
  worstTrade: number;
}

function periodLabel(d: Date, granularity: ReportGranularity): string {
  switch (granularity) {
    case "daily":
      return format(d, "yyyy-MM-dd");
    case "weekly":
      return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
    case "monthly":
      return format(startOfMonth(d), "yyyy-MM");
    case "quarterly":
      return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
    case "yearly":
      return String(d.getFullYear());
  }
}

export function buildPeriodReports(
  trades: MetricsTrade[],
  startingBalance: number,
  granularity: ReportGranularity,
): PeriodReport[] {
  const closed = sortByClose(trades.filter(isClosed));
  if (!closed.length) return [];

  const groups = new Map<string, MetricsTrade[]>();
  for (const t of closed) {
    const k = periodLabel(closeDate(t), granularity);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }
  const days = dailySummaries(closed);

  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, ts]) => {
      const m = computeMetrics(ts, startingBalance);
      const periodDays = [...days.values()].filter(
        (d) => periodLabel(new Date(d.date), granularity) === label,
      );
      const bestDay = periodDays.length ? Math.max(...periodDays.map((d) => d.netPnl)) : 0;
      const worstDay = periodDays.length ? Math.min(...periodDays.map((d) => d.netPnl)) : 0;
      const dates = ts.map((t) => format(closeDate(t), "yyyy-MM-dd")).sort();
      return {
        label,
        start: dates[0],
        end: dates[dates.length - 1],
        netPnl: m.netPnl,
        winRate: m.winRate,
        profitFactor: m.profitFactor,
        sharpeRatio: m.sharpeRatio,
        maxDrawdownPercent: m.maxDrawdownPercent,
        avgWin: m.avgWin,
        avgLoss: m.avgLoss,
        totalTrades: m.totalTrades,
        avgR: m.avgRMultiple,
        bestDay,
        worstDay,
        bestTrade: m.bestTrade,
        worstTrade: m.worstTrade,
      };
    });
}
