import Papa from "papaparse";
import { format } from "date-fns";
import type { MetricsTrade, PeriodReport } from "@/lib/metrics";
import type { Account } from "@/generated/prisma/client";

export function tradesToCsv(trades: MetricsTrade[], accounts: Account[]): string {
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const rows = trades.map((t) => ({
    Date: format(t.date, "yyyy-MM-dd"),
    Day: format(t.date, "EEE"),
    Account: accountName.get(t.accountId) ?? t.accountId,
    Symbol: t.symbol,
    Side: t.side,
    Setup: t.setup ?? "",
    EntryPrice: t.entryPrice,
    StopLoss: t.stopLoss ?? "",
    TakeProfit: t.takeProfit ?? "",
    Quantity: t.quantity,
    ExitPrice: t.exitPrice ?? "",
    ClosingDate: t.closingDate ? format(t.closingDate, "yyyy-MM-dd") : "",
    ClosingTime: t.closingTime ?? "",
    PnL: t.pnl,
    Fees: t.brokerageCharges,
    NetPnL: t.netPnl,
    Result: t.result ?? "",
    PlannedRR: t.plannedRR ?? "",
    RiskAmount: t.riskAmount ?? "",
    RiskPercent: t.riskPercent ?? "",
    RMultiple: t.rMultiple ?? "",
    Mistake: t.mistakes.join("; "),
    EmotionBefore: t.emotionBefore ?? "",
    EmotionDuring: t.emotionDuring ?? "",
    EmotionAfter: t.emotionAfter ?? "",
    Confidence: t.confidenceLevel ?? "",
    Discipline: t.disciplineScore ?? "",
    Notes: t.notes ?? "",
  }));
  return Papa.unparse(rows);
}

export function reportsToCsv(reports: PeriodReport[]): string {
  const rows = reports.map((r) => ({
    Period: r.label,
    Start: r.start,
    End: r.end,
    NetPnL: r.netPnl,
    WinRate: r.winRate.toFixed(2),
    ProfitFactor: Number.isFinite(r.profitFactor) ? r.profitFactor.toFixed(2) : "Inf",
    Sharpe: r.sharpeRatio.toFixed(2),
    MaxDrawdownPercent: r.maxDrawdownPercent.toFixed(2),
    AvgWin: r.avgWin.toFixed(2),
    AvgLoss: r.avgLoss.toFixed(2),
    TotalTrades: r.totalTrades,
    AvgR: r.avgR.toFixed(2),
    BestDay: r.bestDay.toFixed(2),
    WorstDay: r.worstDay.toFixed(2),
    BestTrade: r.bestTrade.toFixed(2),
    WorstTrade: r.worstTrade.toFixed(2),
  }));
  return Papa.unparse(rows);
}

export interface ImportRow {
  date: string;
  accountName: string;
  symbol: string;
  side: string;
  setup?: string;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice?: number;
  quantity: number;
  closingDate?: string;
  closingTime?: string;
  entryTime?: string;
  brokerageCharges?: number;
  mistakes: string[];
  emotionDuring?: string;
  notes?: string;
}

const HEADER_ALIASES: Record<string, keyof ImportRow | "skip"> = {
  date: "date",
  account: "accountName",
  symbol: "symbol",
  side: "side",
  longshort: "side",
  setup: "setup",
  entry: "entryPrice",
  entryprice: "entryPrice",
  stoploss: "stopLoss",
  sl: "stopLoss",
  takeprofit: "takeProfit",
  tp: "takeProfit",
  exit: "exitPrice",
  exitprice: "exitPrice",
  quantity: "quantity",
  qty: "quantity",
  closingdate: "closingDate",
  closingtime: "closingTime",
  entrytime: "entryTime",
  fees: "brokerageCharges",
  brokeragecharges: "brokerageCharges",
  mistake: "mistakes",
  mistakes: "mistakes",
  emotion: "emotionDuring",
  notes: "notes",
};

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseImportCsv(text: string): { rows: ImportRow[]; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const errors: string[] = result.errors.map((e) => `Row ${e.row}: ${e.message}`);
  const rows: ImportRow[] = [];

  for (const [i, raw] of result.data.entries()) {
    const mapped: Partial<ImportRow> = { mistakes: [] };
    for (const [header, value] of Object.entries(raw)) {
      const key = HEADER_ALIASES[normalizeHeader(header)];
      if (!key || key === "skip" || value === undefined || value === "") continue;
      switch (key) {
        case "entryPrice":
        case "stopLoss":
        case "takeProfit":
        case "exitPrice":
        case "quantity":
        case "brokerageCharges":
          mapped[key] = Number(value);
          break;
        case "mistakes":
          mapped.mistakes = value.split(/[;,]/).map((m) => m.trim()).filter(Boolean);
          break;
        default:
          (mapped as Record<string, string>)[key] = value;
      }
    }
    if (!mapped.date || !mapped.accountName || !mapped.symbol || !mapped.side || !mapped.entryPrice || !mapped.quantity) {
      errors.push(`Row ${i + 2}: missing required field(s) (date, account, symbol, side, entry, quantity)`);
      continue;
    }
    rows.push(mapped as ImportRow);
  }

  return { rows, errors };
}
