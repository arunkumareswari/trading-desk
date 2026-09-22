export const SIDES = ["LONG", "SHORT"] as const;
export type Side = (typeof SIDES)[number];

export const RESULTS = ["WIN", "LOSS", "BREAKEVEN"] as const;
export type TradeResult = (typeof RESULTS)[number];

export const SESSIONS = [
  "Asian",
  "London",
  "New York",
  "London/New York Overlap",
] as const;
export type Session = (typeof SESSIONS)[number];

export const DEFAULT_SETUPS = [
  "Breakout",
  "Liquidity Sweep",
  "Order Flow",
  "Pullback",
  "Trend Continuation",
  "Reversal",
];

export const DEFAULT_SYMBOLS = [
  "BTCUSD",
  "ETHUSD",
  "SOLUSD",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "XAUUSD",
  "NAS100",
];

export const EMOTIONS = [
  "Calm",
  "Confident",
  "Excited",
  "Anxious",
  "Fearful",
  "Greedy",
  "Frustrated",
  "Impatient",
  "Revenge",
  "FOMO",
  "Neutral",
];

export const PREDEFINED_MISTAKES = [
  "FOMO",
  "Revenge Trade",
  "Overtrading",
  "Early Entry",
  "Late Entry",
  "Early Exit",
  "Moved SL",
  "Oversized Position",
  "Ignored Setup Rules",
  "No Confirmation",
  "Emotional Trade",
  "Trading During News",
  "Broke Risk Rules",
];

export const MARKET_BIAS = ["Bullish", "Bearish", "Ranging", "Neutral"];

export const DATE_RANGE_PRESETS = [
  "1W",
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "ALL",
  "CUSTOM",
] as const;
export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

export const ALL_ACCOUNTS_ID = "all";

export const JOURNAL_COLUMNS = [
  "date",
  "day",
  "account",
  "symbol",
  "side",
  "setup",
  "entryPrice",
  "stopLoss",
  "takeProfit",
  "quantity",
  "exitPrice",
  "closingDate",
  "pnl",
  "brokerageCharges",
  "netPnl",
  "result",
  "plannedRR",
  "riskAmount",
  "riskPercent",
  "rMultiple",
  "mistakes",
  "emotionDuring",
  "confidenceLevel",
  "disciplineScore",
  "notes",
] as const;
