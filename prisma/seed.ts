import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { PREDEFINED_MISTAKES } from "../src/lib/constants";
import { computeTradeDerivedFields } from "../src/lib/trade-calc";

const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

interface TradeSeedConfig {
  dateStr: string;
  entryTime: string;
  closingTime: string;
  symbol: string;
  side: "LONG" | "SHORT";
  setup: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice: number;
  quantity: number;
  brokerageCharges: number;
  marketBias: string;
  higherTimeframeBias: string;
  entryReason: string;
  exitReason: string;
  confirmation: string;
  invalidation: string;
  tradeManagement: string;
  emotionBefore: string;
  emotionDuring: string;
  emotionAfter: string;
  confidenceLevel: number;
  disciplineScore: number;
  preTradeThesis: string;
  whatHappened: string;
  whatWentRight: string;
  whatWentWrong?: string;
  lessonLearned?: string;
  notes?: string;
  mistakes?: string[];
}

const sampleTradesAccount1: TradeSeedConfig[] = [
  {
    dateStr: "2026-08-03",
    entryTime: "09:45",
    closingTime: "11:30",
    symbol: "EURUSD",
    side: "LONG",
    setup: "Liquidity Sweep",
    entryPrice: 1.0850,
    stopLoss: 1.0825,
    takeProfit: 1.0910,
    exitPrice: 1.0905,
    quantity: 100000, // standard lot
    brokerageCharges: 7,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "Asian low swept followed by 5m MSS with displacement",
    exitReason: "Approaching 4H FVG target",
    confirmation: "5m Market Structure Shift + displacement candle",
    invalidation: "Sweep low broken",
    tradeManagement: "Moved stop loss to breakeven after 1:1 R reached",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Excited",
    confidenceLevel: 8,
    disciplineScore: 9,
    preTradeThesis: "Looking for London session expansion following overnight consolidation.",
    whatHappened: "Price tapped the sweep zone perfectly and rallied 55 pips.",
    whatWentRight: "Waited patiently for confirmation instead of entering on initial tap.",
    lessonLearned: "Patience pays off when trading session sweeps."
  },
  {
    dateStr: "2026-08-04",
    entryTime: "14:15",
    closingTime: "15:20",
    symbol: "NAS100",
    side: "SHORT",
    setup: "Breakout",
    entryPrice: 19850,
    stopLoss: 19910,
    takeProfit: 19700,
    exitPrice: 19720,
    quantity: 2,
    brokerageCharges: 8,
    marketBias: "Bearish",
    higherTimeframeBias: "Bearish",
    entryReason: "Breakdown below morning range support on heavy volume",
    exitReason: "Target achieved before NY close",
    confirmation: "15m close below key support level",
    invalidation: "Reclaim of 19900",
    tradeManagement: "Scaled out 50% at 19780, trailed stop to 19820",
    emotionBefore: "Confident",
    emotionDuring: "Calm",
    emotionAfter: "Confident",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "Tech weakness leading into afternoon session.",
    whatHappened: "Fast momentum sell-off straight to liquidity pool.",
    whatWentRight: "Executed immediately upon candle close confirmation.",
    notes: "Flawless execution"
  },
  {
    dateStr: "2026-08-06",
    entryTime: "17:30",
    closingTime: "18:10",
    symbol: "BTCUSD",
    side: "LONG",
    setup: "Order Flow",
    entryPrice: 62400,
    stopLoss: 61900,
    takeProfit: 63600,
    exitPrice: 61850,
    quantity: 0.5,
    brokerageCharges: 12,
    marketBias: "Bullish",
    higherTimeframeBias: "Ranging",
    entryReason: "Aggressive market buy delta in 1h demand zone",
    exitReason: "Stopped out as sellers absorbed bid",
    confirmation: "Delta divergence",
    invalidation: "Loss of 62000 support",
    tradeManagement: "Did not move stop, accepted full predefined risk",
    emotionBefore: "Confident",
    emotionDuring: "Anxious",
    emotionAfter: "Frustrated",
    confidenceLevel: 7,
    disciplineScore: 8,
    preTradeThesis: "Expecting NY continuation after afternoon pullback.",
    whatHappened: "Large institutional sell order flushed through the level.",
    whatWentRight: "Followed risk management and took defined stop.",
    whatWentWrong: "Failed to notice lower timeframe weakness before entering.",
    lessonLearned: "Check BTC dominance and aggregate orderbook before counter-trend longs."
  },
  {
    dateStr: "2026-08-07",
    entryTime: "10:00",
    closingTime: "11:45",
    symbol: "GBPUSD",
    side: "SHORT",
    setup: "Pullback",
    entryPrice: 1.2940,
    stopLoss: 1.2965,
    takeProfit: 1.2880,
    exitPrice: 1.2885,
    quantity: 100000,
    brokerageCharges: 7,
    marketBias: "Bearish",
    higherTimeframeBias: "Bearish",
    entryReason: "Rejection from 1h supply zone after London open fakeout",
    exitReason: "Reached target support zone",
    confirmation: "Bearish engulfing candle on 15m",
    invalidation: "Above supply high",
    tradeManagement: "Protected profit at +30 pips",
    emotionBefore: "Calm",
    emotionDuring: "Calm",
    emotionAfter: "Confident",
    confidenceLevel: 8,
    disciplineScore: 9,
    preTradeThesis: "GBP showing relative weakness compared to EUR.",
    whatHappened: "Clean drop through London session.",
    whatWentRight: "Waited for the pullback instead of chasing the initial candle.",
    lessonLearned: "Keep pairing strong vs weak currencies."
  },
  {
    dateStr: "2026-08-10",
    entryTime: "14:40",
    closingTime: "15:05",
    symbol: "XAUUSD",
    side: "LONG",
    setup: "Breakout",
    entryPrice: 2435,
    stopLoss: 2427,
    takeProfit: 2455,
    exitPrice: 2426,
    quantity: 25,
    brokerageCharges: 10,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "Chased the candle as Gold surged during US CPI print",
    exitReason: "Immediate wick reversal stopped me out",
    confirmation: "None, entered on impulse",
    invalidation: "Below 2430",
    tradeManagement: "Froze and let it hit stop loss immediately",
    emotionBefore: "FOMO",
    emotionDuring: "Anxious",
    emotionAfter: "Frustrated",
    confidenceLevel: 4,
    disciplineScore: 3,
    preTradeThesis: "Gold will pump to new highs today.",
    whatHappened: "News whipsaw stopped me out before resuming direction.",
    whatWentRight: "Stop loss was at least present in the system.",
    whatWentWrong: "Traded directly during high-impact news without confirmation.",
    lessonLearned: "Never enter market orders during CPI or NFP releases.",
    mistakes: ["FOMO", "Trading During News", "Early Entry"]
  },
  {
    dateStr: "2026-08-12",
    entryTime: "09:15",
    closingTime: "12:00",
    symbol: "EURUSD",
    side: "SHORT",
    setup: "Trend Continuation",
    entryPrice: 1.0920,
    stopLoss: 1.0945,
    takeProfit: 1.0850,
    exitPrice: 1.0860,
    quantity: 100000,
    brokerageCharges: 7,
    marketBias: "Bearish",
    higherTimeframeBias: "Bearish",
    entryReason: "Lower high created at 61.8% fib level",
    exitReason: "Approaching previous week low",
    confirmation: "Rejection wick on 1H",
    invalidation: "Break above day's high",
    tradeManagement: "Trailed stop behind 15m swing highs",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Excited",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "Continuation of higher timeframe downtrend.",
    whatHappened: "Smooth downward trajectory all morning.",
    whatWentRight: "Great risk reward and disciplined trailing.",
    lessonLearned: "Trend continuation trades have highest win rates."
  },
  {
    dateStr: "2026-08-14",
    entryTime: "16:15",
    closingTime: "17:45",
    symbol: "SOLUSD",
    side: "LONG",
    setup: "Reversal",
    entryPrice: 145.5,
    stopLoss: 142.0,
    takeProfit: 154.0,
    exitPrice: 152.8,
    quantity: 40,
    brokerageCharges: 6,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "Double bottom at key daily support with bullish divergence",
    exitReason: "Target resistance touched",
    confirmation: "RSI divergence on 1H",
    invalidation: "New low below 142",
    tradeManagement: "Took 70% profit at 151, closed runner at 152.8",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Confident",
    confidenceLevel: 8,
    disciplineScore: 9,
    preTradeThesis: "SOL looking primed for recovery after heavy weekend dip.",
    whatHappened: "Strong rebound with high volume.",
    whatWentRight: "Strict adherence to scaling out strategy.",
    lessonLearned: "Crypto reversal setups work best at proven multi-day levels."
  },
  {
    dateStr: "2026-08-17",
    entryTime: "08:30",
    closingTime: "09:30",
    symbol: "GBPUSD",
    side: "LONG",
    setup: "Breakout",
    entryPrice: 1.2890,
    stopLoss: 1.2865,
    takeProfit: 1.2950,
    exitPrice: 1.2860,
    quantity: 100000,
    brokerageCharges: 7,
    marketBias: "Bullish",
    higherTimeframeBias: "Neutral",
    entryReason: "Pre-London range breakout attempt",
    exitReason: "Stopped out on fakeout reversal",
    confirmation: "15m candle close above range",
    invalidation: "Fall back into range",
    tradeManagement: "Standard stop loss respected",
    emotionBefore: "Excited",
    emotionDuring: "Anxious",
    emotionAfter: "Neutral",
    confidenceLevel: 6,
    disciplineScore: 8,
    preTradeThesis: "Anticipating expansion before London open.",
    whatHappened: "Classic bull trap before actual London direction.",
    whatWentRight: "Stopped out with strictly limited loss.",
    whatWentWrong: "Entered too early before London volume stepped in.",
    lessonLearned: "Avoid breakouts in Frankfurt hour before London 8:00 AM.",
    mistakes: ["Early Entry"]
  },
  {
    dateStr: "2026-08-19",
    entryTime: "13:45",
    closingTime: "16:00",
    symbol: "XAUUSD",
    side: "SHORT",
    setup: "Liquidity Sweep",
    entryPrice: 2470,
    stopLoss: 2478,
    takeProfit: 2450,
    exitPrice: 2452,
    quantity: 30,
    brokerageCharges: 11,
    marketBias: "Bearish",
    higherTimeframeBias: "Ranging",
    entryReason: "Swept all-time high with aggressive seller wick",
    exitReason: "Targeted internal liquidity pool",
    confirmation: "Pinbar rejection on 15m followed by displacement down",
    invalidation: "Close above 2480",
    tradeManagement: "Moved SL to breakeven after 1:2 R",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Excited",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "Liquidity grab at resistance before NY session pull back.",
    whatHappened: "Huge drop of $18 in 2 hours.",
    whatWentRight: "Clean entry right at the rejection candle close.",
    lessonLearned: "Gold liquidity sweeps offer the cleanest risk:reward."
  },
  {
    dateStr: "2026-08-21",
    entryTime: "14:30",
    closingTime: "15:45",
    symbol: "NAS100",
    side: "LONG",
    setup: "Pullback",
    entryPrice: 19950,
    stopLoss: 19890,
    takeProfit: 20100,
    exitPrice: 20080,
    quantity: 2,
    brokerageCharges: 8,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "Test of previous day high converted to support",
    exitReason: "Close to daily target resistance",
    confirmation: "5m reversal pattern inside the demand zone",
    invalidation: "Break below 19880",
    tradeManagement: "Held through minor pullback without panic",
    emotionBefore: "Confident",
    emotionDuring: "Calm",
    emotionAfter: "Confident",
    confidenceLevel: 8,
    disciplineScore: 9,
    preTradeThesis: "Bullish trend continuation during overlap.",
    whatHappened: "Steady rally into NY afternoon.",
    whatWentRight: "Did not cut trade early despite slow initial move.",
    lessonLearned: "Give trades time to develop."
  },
  {
    dateStr: "2026-08-24",
    entryTime: "17:15",
    closingTime: "18:00",
    symbol: "ETHUSD",
    side: "SHORT",
    setup: "Order Flow",
    entryPrice: 3380,
    stopLoss: 3430,
    takeProfit: 3260,
    exitPrice: 3435,
    quantity: 5,
    brokerageCharges: 9,
    marketBias: "Bearish",
    higherTimeframeBias: "Neutral",
    entryReason: "Thought market looked tired and shorted without setup confirmation",
    exitReason: "Stopped out on pump",
    confirmation: "None",
    invalidation: "Above 3420",
    tradeManagement: "Widened stop loss during trade before getting stopped out",
    emotionBefore: "Bored",
    emotionDuring: "Fearful",
    emotionAfter: "Frustrated",
    confidenceLevel: 4,
    disciplineScore: 2,
    preTradeThesis: "Forcing a trade because I haven't traded yet today.",
    whatHappened: "Market broke upward strongly and blew past original stop.",
    whatWentRight: "Nothing, completely undisciplined.",
    whatWentWrong: "Moved stop loss further away and traded out of boredom.",
    lessonLearned: "Never move your stop loss further away. Accept the original risk.",
    mistakes: ["Overtrading", "Moved SL", "Ignored Setup Rules", "Emotional Trade"]
  },
  {
    dateStr: "2026-08-26",
    entryTime: "09:30",
    closingTime: "11:15",
    symbol: "EURUSD",
    side: "LONG",
    setup: "Liquidity Sweep",
    entryPrice: 1.0880,
    stopLoss: 1.0855,
    takeProfit: 1.0945,
    exitPrice: 1.0940,
    quantity: 100000,
    brokerageCharges: 7,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "Previous day low swept followed by strong bullish displacement",
    exitReason: "Took profit at target supply",
    confirmation: "15m hammer candle at discount zone",
    invalidation: "Sweep low violated",
    tradeManagement: "Flawless adherence to exit rules",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Excited",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "DXY testing major resistance, EURUSD expected to pop.",
    whatHappened: "60 pip clean run straight up.",
    whatWentRight: "High confidence execution based on DXY correlation.",
    lessonLearned: "Correlation checks add tremendous conviction."
  },
  {
    dateStr: "2026-08-28",
    entryTime: "14:15",
    closingTime: "15:40",
    symbol: "USDJPY",
    side: "SHORT",
    setup: "Reversal",
    entryPrice: 147.20,
    stopLoss: 147.60,
    takeProfit: 146.20,
    exitPrice: 146.30,
    quantity: 100000,
    brokerageCharges: 7,
    marketBias: "Bearish",
    higherTimeframeBias: "Bearish",
    entryReason: "Rejection from 4H descending channel line",
    exitReason: "Support level reached",
    confirmation: "M15 double top with bearish divergence",
    invalidation: "Break above 147.70",
    tradeManagement: "Secured partials at 1:1.5 R",
    emotionBefore: "Calm",
    emotionDuring: "Calm",
    emotionAfter: "Confident",
    confidenceLevel: 8,
    disciplineScore: 9,
    preTradeThesis: "BOJ rate commentary keeping Yen strong.",
    whatHappened: "Steady 90 pip drop over the session.",
    whatWentRight: "Waited for double top confirmation before shorting.",
    lessonLearned: "Fundamental backdrop aligns with technicals."
  },
  {
    dateStr: "2026-09-01",
    entryTime: "10:15",
    closingTime: "11:00",
    symbol: "GBPUSD",
    side: "LONG",
    setup: "Breakout",
    entryPrice: 1.2910,
    stopLoss: 1.2885,
    takeProfit: 1.2970,
    exitPrice: 1.2910, // Breakeven
    quantity: 100000,
    brokerageCharges: 7,
    marketBias: "Bullish",
    higherTimeframeBias: "Neutral",
    entryReason: "Ascending triangle breakout",
    exitReason: "Hit breakeven stop after momentum stalled",
    confirmation: "Volume expansion on breakout",
    invalidation: "Below triangle support",
    tradeManagement: "Moved SL to entry once trade moved +20 pips",
    emotionBefore: "Confident",
    emotionDuring: "Neutral",
    emotionAfter: "Neutral",
    confidenceLevel: 7,
    disciplineScore: 9,
    preTradeThesis: "Looking for follow-through on morning strength.",
    whatHappened: "Moved +22 pips then reversed rapidly to tag breakeven.",
    whatWentRight: "Capital preserved, zero dollar risk realized.",
    lessonLearned: "Breakeven stops are an essential tool during choppy sessions."
  },
  {
    dateStr: "2026-09-02",
    entryTime: "16:30",
    closingTime: "18:20",
    symbol: "BTCUSD",
    side: "LONG",
    setup: "Trend Continuation",
    entryPrice: 63200,
    stopLoss: 62600,
    takeProfit: 64800,
    exitPrice: 64650,
    quantity: 0.6,
    brokerageCharges: 14,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "Bull flag consolidation breakout on 1H chart",
    exitReason: "Exited near psychological 65k barrier",
    confirmation: "Volume surge through flag trendline",
    invalidation: "Break below 62500",
    tradeManagement: "Protected gains by stepping stop loss behind each 15m swing low",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Excited",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "Institutional inflows pushing crypto higher into September.",
    whatHappened: "Explosive continuation leg yielding over $1,400 per coin.",
    whatWentRight: "Held full position until target.",
    lessonLearned: "Strong trends provide the highest payout."
  },
  {
    dateStr: "2026-09-04",
    entryTime: "14:15",
    closingTime: "16:45",
    symbol: "NAS100",
    side: "SHORT",
    setup: "Reversal",
    entryPrice: 20120,
    stopLoss: 20180,
    takeProfit: 19950,
    exitPrice: 19970,
    quantity: 2,
    brokerageCharges: 8,
    marketBias: "Bearish",
    higherTimeframeBias: "Ranging",
    entryReason: "Triple top on 15m with extreme overbought readings",
    exitReason: "Key support level reached",
    confirmation: "Bearish engulfing on 15m",
    invalidation: "New all-time high above 20200",
    tradeManagement: "Partial taken at 20040, runner left for target",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Confident",
    confidenceLevel: 8,
    disciplineScore: 9,
    preTradeThesis: "Tech names overextended into Friday afternoon.",
    whatHappened: "Sharp 150 pt selloff into the weekend.",
    whatWentRight: "Identified the exhausted buyers accurately.",
    lessonLearned: "End of week profit taking creates reliable short opportunities."
  },
  {
    dateStr: "2026-09-08",
    entryTime: "09:20",
    closingTime: "10:10",
    symbol: "EURUSD",
    side: "SHORT",
    setup: "Breakout",
    entryPrice: 1.0915,
    stopLoss: 1.0940,
    takeProfit: 1.0850,
    exitPrice: 1.0945,
    quantity: 100000,
    brokerageCharges: 7,
    marketBias: "Bearish",
    higherTimeframeBias: "Neutral",
    entryReason: "Anticipated support breakdown prematurely",
    exitReason: "Stopped out on strong support bounce",
    confirmation: "Entered before candle close",
    invalidation: "Reclaim of 1.0930",
    tradeManagement: "Standard stop loss",
    emotionBefore: "Greedy",
    emotionDuring: "Anxious",
    emotionAfter: "Frustrated",
    confidenceLevel: 5,
    disciplineScore: 4,
    preTradeThesis: "EUR looks weak, wants to dump.",
    whatHappened: "Support held firmly and squeezed my short position.",
    whatWentRight: "Stopped out cleanly without manual intervention.",
    whatWentWrong: "Jumped the gun without waiting for support to actually break.",
    lessonLearned: "Never short directly into support. Wait for break + retest.",
    mistakes: ["Early Entry", "Ignored Setup Rules"]
  },
  {
    dateStr: "2026-09-09",
    entryTime: "13:30",
    closingTime: "15:15",
    symbol: "XAUUSD",
    side: "LONG",
    setup: "Pullback",
    entryPrice: 2485,
    stopLoss: 2476,
    takeProfit: 2510,
    exitPrice: 2508,
    quantity: 25,
    brokerageCharges: 10,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "Pullback into 50% retracement of Asian rally",
    exitReason: "Nearing resistance high",
    confirmation: "Bullish pin bar on 15m",
    invalidation: "Loss of 2475",
    tradeManagement: "Trailed stop to protect +15 points",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Excited",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "Gold bull market in full force.",
    whatHappened: "Clean $23 rally in 1.5 hours.",
    whatWentRight: "Execution was textbook.",
    lessonLearned: "Always buy the dip in strong bull markets."
  },
  {
    dateStr: "2026-09-11",
    entryTime: "15:00",
    closingTime: "15:35",
    symbol: "SOLUSD",
    side: "SHORT",
    setup: "Breakout",
    entryPrice: 151.2,
    stopLoss: 153.5,
    takeProfit: 145.0,
    exitPrice: 146.5,
    quantity: 50,
    brokerageCharges: 7,
    marketBias: "Bearish",
    higherTimeframeBias: "Bearish",
    entryReason: "Break of hourly trendline on heavy volume",
    exitReason: "Target hit at previous consolidation low",
    confirmation: "Volume confirmation + MACD bear cross",
    invalidation: "Re-entry into trend channel",
    tradeManagement: "Took 80% at 147, let 20% hit 146.5",
    emotionBefore: "Calm",
    emotionDuring: "Calm",
    emotionAfter: "Confident",
    confidenceLevel: 8,
    disciplineScore: 9,
    preTradeThesis: "SOL showing weakness vs BTC.",
    whatHappened: "Swift $4.7 drop straight down.",
    whatWentRight: "Followed the plan accurately.",
    lessonLearned: "Relative weakness trades offer fast resolution."
  },
  {
    dateStr: "2026-09-14",
    entryTime: "09:30",
    closingTime: "11:50",
    symbol: "GBPUSD",
    side: "LONG",
    setup: "Liquidity Sweep",
    entryPrice: 1.2950,
    stopLoss: 1.2920,
    takeProfit: 1.3020,
    exitPrice: 1.3015,
    quantity: 100000,
    brokerageCharges: 7,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "London open swept Friday low and rejected aggressively",
    exitReason: "Target 1.3020 touched",
    confirmation: "15m candle closed back inside range with long lower shadow",
    invalidation: "Below sweep wick",
    tradeManagement: "Held through middle of trade with confidence",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Excited",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "Weekly open liquidity sweep in direction of weekly trend.",
    whatHappened: "Massive 65 pip rally into early European afternoon.",
    whatWentRight: "Waited for Monday morning initial sweep to complete before entering.",
    lessonLearned: "Monday morning sweeps set up the trend for the first half of the week."
  }
];

const sampleTradesAccount2: TradeSeedConfig[] = [
  {
    dateStr: "2026-08-10",
    entryTime: "14:30",
    closingTime: "16:00",
    symbol: "NAS100",
    side: "LONG",
    setup: "Trend Continuation",
    entryPrice: 19800,
    stopLoss: 19720,
    takeProfit: 20000,
    exitPrice: 19980,
    quantity: 5,
    brokerageCharges: 15,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "Opening bell momentum continuation",
    exitReason: "Approaching psychological 20000 level",
    confirmation: "5m breakout candle",
    invalidation: "Below 19700",
    tradeManagement: "Strict prop firm 1% risk limit applied",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Excited",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "Prop challenge trade 1: high quality trend continuation.",
    whatHappened: "Gained 180 points cleanly.",
    whatWentRight: "Perfect risk sizing.",
    lessonLearned: "Stick strictly to 1% risk on prop accounts."
  },
  {
    dateStr: "2026-08-13",
    entryTime: "13:30",
    closingTime: "14:15",
    symbol: "XAUUSD",
    side: "SHORT",
    setup: "Breakout",
    entryPrice: 2445,
    stopLoss: 2455,
    takeProfit: 2420,
    exitPrice: 2456,
    quantity: 40,
    brokerageCharges: 16,
    marketBias: "Bearish",
    higherTimeframeBias: "Neutral",
    entryReason: "Break of support",
    exitReason: "Stopped out on fakeout",
    confirmation: "Entered on first touch without candle close",
    invalidation: "Reclaim of 2450",
    tradeManagement: "Stop hit automatically",
    emotionBefore: "Anxious",
    emotionDuring: "Fearful",
    emotionAfter: "Frustrated",
    confidenceLevel: 5,
    disciplineScore: 5,
    preTradeThesis: "Expecting Gold to dump after inflation headlines.",
    whatHappened: "Instant reversal stopped me out for -$440.",
    whatWentRight: "Stop loss caught the loss before drawdown limit.",
    whatWentWrong: "Chased the candle without waiting for close.",
    lessonLearned: "Always wait for candle close on Gold breakouts.",
    mistakes: ["Late Entry", "No Confirmation"]
  },
  {
    dateStr: "2026-08-18",
    entryTime: "14:00",
    closingTime: "16:30",
    symbol: "NAS100",
    side: "LONG",
    setup: "Liquidity Sweep",
    entryPrice: 19880,
    stopLoss: 19800,
    takeProfit: 20080,
    exitPrice: 20070,
    quantity: 5,
    brokerageCharges: 15,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "Morning low swept followed by 15m bullish engulfing",
    exitReason: "Target 20080 achieved",
    confirmation: "15m displacement candle",
    invalidation: "Loss of 19780",
    tradeManagement: "Trailed stop loss",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Excited",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "Liquidity pool taken, ready for afternoon expansion.",
    whatHappened: "+190 points gain.",
    whatWentRight: "High RR setup with disciplined execution.",
    lessonLearned: "Index sweeps during overlap are gold."
  },
  {
    dateStr: "2026-08-25",
    entryTime: "09:45",
    closingTime: "11:30",
    symbol: "EURUSD",
    side: "LONG",
    setup: "Pullback",
    entryPrice: 1.0870,
    stopLoss: 1.0845,
    takeProfit: 1.0930,
    exitPrice: 1.0925,
    quantity: 200000,
    brokerageCharges: 14,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "London session pullback to prior day value area high",
    exitReason: "Target resistance reached",
    confirmation: "Bullish rejection pin",
    invalidation: "Loss of 1.0840",
    tradeManagement: "Moved SL to BE at +20 pips",
    emotionBefore: "Calm",
    emotionDuring: "Calm",
    emotionAfter: "Confident",
    confidenceLevel: 8,
    disciplineScore: 9,
    preTradeThesis: "Steady continuation trade.",
    whatHappened: "55 pip steady climb.",
    whatWentRight: "Great entry patience.",
    lessonLearned: "Value area retests provide high probability entries."
  },
  {
    dateStr: "2026-09-03",
    entryTime: "15:00",
    closingTime: "17:15",
    symbol: "NAS100",
    side: "SHORT",
    setup: "Order Flow",
    entryPrice: 20150,
    stopLoss: 20220,
    takeProfit: 19950,
    exitPrice: 19960,
    quantity: 5,
    brokerageCharges: 15,
    marketBias: "Bearish",
    higherTimeframeBias: "Bearish",
    entryReason: "Heavy institutional sell imbalances at session high",
    exitReason: "Take profit hit",
    confirmation: "Negative cumulative delta divergence",
    invalidation: "Above 20240",
    tradeManagement: "Scaled 50% at 20050, left runner for 19960",
    emotionBefore: "Confident",
    emotionDuring: "Calm",
    emotionAfter: "Excited",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "Exhaustion buying into resistance.",
    whatHappened: "+190 points decline right into support.",
    whatWentRight: "Orderflow reading was spot on.",
    lessonLearned: "Combining footprint charts with structure yields great conviction."
  },
  {
    dateStr: "2026-09-10",
    entryTime: "14:15",
    closingTime: "16:00",
    symbol: "XAUUSD",
    side: "LONG",
    setup: "Trend Continuation",
    entryPrice: 2490,
    stopLoss: 2480,
    takeProfit: 2515,
    exitPrice: 2514,
    quantity: 40,
    brokerageCharges: 16,
    marketBias: "Bullish",
    higherTimeframeBias: "Bullish",
    entryReason: "Flag breakout on 1H timeframe",
    exitReason: "Approaching $2515 psychological zone",
    confirmation: "High volume breakout candle",
    invalidation: "Below 2478",
    tradeManagement: "Trailing stop locked in $800+ profit",
    emotionBefore: "Calm",
    emotionDuring: "Confident",
    emotionAfter: "Excited",
    confidenceLevel: 9,
    disciplineScore: 10,
    preTradeThesis: "Gold continues march towards $2520.",
    whatHappened: "Clean $24 move up.",
    whatWentRight: "Passed the profit target for the prop phase!",
    lessonLearned: "Trend is your friend."
  }
];

async function seedData() {
  console.log("Starting full database seeding...");

  // 1. Seed predefined mistakes
  console.log("Seeding mistakes taxonomy...");
  const mistakeMap = new Map<string, string>();
  for (const name of PREDEFINED_MISTAKES) {
    const record = await db.mistake.upsert({
      where: { name },
      update: {},
      create: { name, isCustom: false },
    });
    mistakeMap.set(name, record.id);
  }

  // 2. Ensure Account 1 (Existing 'Arun kumar' or create if not found)
  let account1 = await db.account.findFirst({
    where: { name: "Arun kumar" },
  });

  if (!account1) {
    account1 = await db.account.create({
      data: {
        name: "Arun kumar",
        startingBalance: 10000,
        currency: "USD",
        isDemo: true,
      },
    });
    console.log(`Created primary account: ${account1.name} (${account1.id})`);
  } else {
    console.log(`Using existing primary account: ${account1.name} (${account1.id})`);
  }

  // 3. Ensure Account 2 ("Apex 50K Funded" for multi-account demo)
  let account2 = await db.account.findFirst({
    where: { name: "Apex 50K Prop" },
  });

  if (!account2) {
    account2 = await db.account.create({
      data: {
        name: "Apex 50K Prop",
        startingBalance: 50000,
        currency: "USD",
        isDemo: false,
      },
    });
    console.log(`Created secondary account: ${account2.name} (${account2.id})`);
  } else {
    console.log(`Using existing secondary account: ${account2.name} (${account2.id})`);
  }

  // Clear existing trades to ensure clean calculation state
  const existingTradeCount = await db.trade.count();
  if (existingTradeCount > 0) {
    console.log(`Clearing ${existingTradeCount} old trades...`);
    await db.tradeMistake.deleteMany({});
    await db.trade.deleteMany({});
  }

  // Helper to insert a list of trades with proper running balances & derived fields
  async function insertTradesForAccount(
    accountId: string,
    initialBalance: number,
    tradesConfig: TradeSeedConfig[]
  ) {
    let runningBalance = initialBalance;

    for (const config of tradesConfig) {
      const derived = computeTradeDerivedFields({
        side: config.side,
        entryPrice: config.entryPrice,
        stopLoss: config.stopLoss,
        takeProfit: config.takeProfit,
        exitPrice: config.exitPrice,
        quantity: config.quantity,
        brokerageCharges: config.brokerageCharges,
        entryTime: config.entryTime,
        accountBalanceAtEntry: runningBalance,
      });

      const entryDate = new Date(`${config.dateStr}T${config.entryTime}:00Z`);
      const closingDate = new Date(`${config.dateStr}T${config.closingTime}:00Z`);

      const trade = await db.trade.create({
        data: {
          accountId,
          date: entryDate,
          entryTime: config.entryTime,
          closingDate,
          closingTime: config.closingTime,
          symbol: config.symbol,
          side: config.side,
          setup: config.setup,
          session: derived.session,
          entryPrice: config.entryPrice,
          stopLoss: config.stopLoss,
          takeProfit: config.takeProfit,
          exitPrice: config.exitPrice,
          quantity: config.quantity,
          pnl: derived.pnl,
          brokerageCharges: config.brokerageCharges,
          netPnl: derived.netPnl,
          riskAmount: derived.riskAmount,
          riskPercent: derived.riskPercent,
          plannedRR: derived.plannedRR,
          rMultiple: derived.rMultiple,
          result: derived.result,
          marketBias: config.marketBias,
          higherTimeframeBias: config.higherTimeframeBias,
          entryReason: config.entryReason,
          exitReason: config.exitReason,
          confirmation: config.confirmation,
          invalidation: config.invalidation,
          tradeManagement: config.tradeManagement,
          emotionBefore: config.emotionBefore,
          emotionDuring: config.emotionDuring,
          emotionAfter: config.emotionAfter,
          confidenceLevel: config.confidenceLevel,
          disciplineScore: config.disciplineScore,
          preTradeThesis: config.preTradeThesis,
          whatHappened: config.whatHappened,
          whatWentRight: config.whatWentRight,
          whatWentWrong: config.whatWentWrong,
          lessonLearned: config.lessonLearned,
          notes: config.notes,
        },
      });

      // Link mistakes if any
      if (config.mistakes && config.mistakes.length > 0) {
        for (const mistakeName of config.mistakes) {
          const mistakeId = mistakeMap.get(mistakeName);
          if (mistakeId) {
            await db.tradeMistake.create({
              data: {
                tradeId: trade.id,
                mistakeId,
              },
            });
          }
        }
      }

      runningBalance += derived.netPnl;
    }
  }

  console.log("Inserting trades for Account 1 (Arun kumar)...");
  await insertTradesForAccount(account1.id, account1.startingBalance, sampleTradesAccount1);

  console.log("Inserting trades for Account 2 (Apex 50K Prop)...");
  await insertTradesForAccount(account2.id, account2.startingBalance, sampleTradesAccount2);

  const totalTrades = await db.trade.count();
  const totalMistakes = await db.tradeMistake.count();
  console.log(`Seeding completed successfully! Total trades: ${totalTrades}, Mistake links: ${totalMistakes}`);
}

seedData()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
