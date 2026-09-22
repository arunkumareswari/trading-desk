import { format } from "date-fns";
import { z } from "zod";
import { SIDES } from "@/lib/constants";
import type { MetricsTrade } from "@/lib/metrics";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v.trim() : undefined));

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
  });

const requiredNumber = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? v : Number(v)))
  .refine((n) => Number.isFinite(n), "Required");

export const tradeFormSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  date: z.string().min(1, "Date is required"),
  entryTime: optionalString,
  symbol: z.string().min(1, "Symbol is required"),
  side: z.enum(SIDES),
  setup: optionalString,

  entryPrice: requiredNumber,
  stopLoss: optionalNumber,
  takeProfit: optionalNumber,
  exitPrice: optionalNumber,
  quantity: requiredNumber,
  closingDate: optionalString,
  closingTime: optionalString,
  brokerageCharges: optionalNumber,

  marketBias: optionalString,
  higherTimeframeBias: optionalString,
  entryReason: optionalString,
  exitReason: optionalString,
  confirmation: optionalString,
  invalidation: optionalString,
  tradeManagement: optionalString,
  mistakeNotes: optionalString,

  emotionBefore: optionalString,
  emotionDuring: optionalString,
  emotionAfter: optionalString,
  confidenceLevel: optionalNumber,
  disciplineScore: optionalNumber,

  preTradeThesis: optionalString,
  whatHappened: optionalString,
  whatWentRight: optionalString,
  whatWentWrong: optionalString,
  lessonLearned: optionalString,
  screenshotUrl: optionalString,
  notes: optionalString,

  mistakes: z.array(z.string()).optional().default([]),
});

export type TradeFormValues = z.input<typeof tradeFormSchema>;
export type TradeFormParsed = z.output<typeof tradeFormSchema>;

export const emptyTradeForm: TradeFormValues = {
  accountId: "",
  date: new Date().toISOString().slice(0, 10),
  entryTime: "",
  symbol: "",
  side: "LONG",
  setup: "",
  entryPrice: "" as unknown as number,
  stopLoss: "",
  takeProfit: "",
  exitPrice: "",
  quantity: "" as unknown as number,
  closingDate: "",
  closingTime: "",
  brokerageCharges: "",
  marketBias: "",
  higherTimeframeBias: "",
  entryReason: "",
  exitReason: "",
  confirmation: "",
  invalidation: "",
  tradeManagement: "",
  mistakeNotes: "",
  emotionBefore: "",
  emotionDuring: "",
  emotionAfter: "",
  confidenceLevel: "",
  disciplineScore: "",
  preTradeThesis: "",
  whatHappened: "",
  whatWentRight: "",
  whatWentWrong: "",
  lessonLearned: "",
  screenshotUrl: "",
  notes: "",
  mistakes: [],
};

const numOrEmpty = (n: number | null | undefined) => (n === null || n === undefined ? "" : n);

export function tradeToFormValues(t: MetricsTrade): TradeFormValues {
  return {
    accountId: t.accountId,
    date: format(t.date, "yyyy-MM-dd"),
    entryTime: t.entryTime ?? "",
    symbol: t.symbol,
    side: t.side as "LONG" | "SHORT",
    setup: t.setup ?? "",
    entryPrice: numOrEmpty(t.entryPrice) as number,
    stopLoss: numOrEmpty(t.stopLoss) as number,
    takeProfit: numOrEmpty(t.takeProfit) as number,
    exitPrice: numOrEmpty(t.exitPrice) as number,
    quantity: numOrEmpty(t.quantity) as number,
    closingDate: t.closingDate ? format(t.closingDate, "yyyy-MM-dd") : "",
    closingTime: t.closingTime ?? "",
    brokerageCharges: numOrEmpty(t.brokerageCharges) as number,
    marketBias: t.marketBias ?? "",
    higherTimeframeBias: t.higherTimeframeBias ?? "",
    entryReason: t.entryReason ?? "",
    exitReason: t.exitReason ?? "",
    confirmation: t.confirmation ?? "",
    invalidation: t.invalidation ?? "",
    tradeManagement: t.tradeManagement ?? "",
    mistakeNotes: t.mistakeNotes ?? "",
    emotionBefore: t.emotionBefore ?? "",
    emotionDuring: t.emotionDuring ?? "",
    emotionAfter: t.emotionAfter ?? "",
    confidenceLevel: numOrEmpty(t.confidenceLevel) as number,
    disciplineScore: numOrEmpty(t.disciplineScore) as number,
    preTradeThesis: t.preTradeThesis ?? "",
    whatHappened: t.whatHappened ?? "",
    whatWentRight: t.whatWentRight ?? "",
    whatWentWrong: t.whatWentWrong ?? "",
    lessonLearned: t.lessonLearned ?? "",
    screenshotUrl: t.screenshotUrl ?? "",
    notes: t.notes ?? "",
    mistakes: t.mistakes,
  };
}
