import type { Session, Side, TradeResult } from "@/lib/constants";

/** Approximate session bands (hour-of-day the trade's entryTime was logged in). */
export function deriveSession(entryTime?: string | null): Session | null {
  if (!entryTime) return null;
  const hh = Number(entryTime.split(":")[0]);
  if (Number.isNaN(hh)) return null;
  if (hh >= 13 && hh < 16) return "London/New York Overlap";
  if (hh >= 8 && hh < 13) return "London";
  if (hh >= 16 && hh < 21) return "New York";
  return "Asian";
}

export interface TradeCalcInput {
  side: Side;
  entryPrice: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  exitPrice?: number | null;
  quantity: number;
  brokerageCharges?: number | null;
  entryTime?: string | null;
  /** Account balance immediately before this trade closed — used for Risk %. */
  accountBalanceAtEntry?: number | null;
}

export interface TradeCalcResult {
  pnl: number;
  netPnl: number;
  result: TradeResult | null;
  riskAmount: number | null;
  riskPercent: number | null;
  plannedRR: number | null;
  rMultiple: number | null;
  session: Session | null;
}

/**
 * Every derived Trade field, computed the same way everywhere a trade is
 * written (manual entry, edit, CSV import, seed data) so nothing downstream
 * ever has to re-derive or guess at these numbers.
 */
export function computeTradeDerivedFields(
  input: TradeCalcInput,
): TradeCalcResult {
  const {
    side,
    entryPrice,
    stopLoss,
    takeProfit,
    exitPrice,
    quantity,
    brokerageCharges,
    entryTime,
    accountBalanceAtEntry,
  } = input;

  const charges = brokerageCharges ?? 0;
  const hasExit = exitPrice !== null && exitPrice !== undefined;

  const pnl = hasExit
    ? side === "LONG"
      ? (exitPrice! - entryPrice) * quantity
      : (entryPrice - exitPrice!) * quantity
    : 0;

  const netPnl = hasExit ? pnl - charges : 0;

  const result: TradeResult | null = !hasExit
    ? null
    : netPnl > 0
      ? "WIN"
      : netPnl < 0
        ? "LOSS"
        : "BREAKEVEN";

  const riskAmount =
    stopLoss !== null && stopLoss !== undefined
      ? Math.abs(entryPrice - stopLoss) * quantity
      : null;

  const riskPercent =
    riskAmount !== null && accountBalanceAtEntry && accountBalanceAtEntry > 0
      ? (riskAmount / accountBalanceAtEntry) * 100
      : null;

  const plannedRR =
    riskAmount && riskAmount > 0 && takeProfit !== null && takeProfit !== undefined
      ? Math.abs(takeProfit - entryPrice) / Math.abs(entryPrice - (stopLoss ?? entryPrice))
      : null;

  const rMultiple =
    hasExit && riskAmount && riskAmount > 0 ? netPnl / riskAmount : null;

  const session = deriveSession(entryTime);

  return { pnl, netPnl, result, riskAmount, riskPercent, plannedRR, rMultiple, session };
}
