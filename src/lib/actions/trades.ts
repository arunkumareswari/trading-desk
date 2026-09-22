"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { tradeFormSchema, type TradeFormParsed, type TradeFormValues } from "@/lib/schemas/trade";
import { computeTradeDerivedFields, type TradeCalcResult } from "@/lib/trade-calc";
import { getAccountBalanceAt } from "@/lib/trades";

const DEPENDENT_PATHS = [
  "/dashboard",
  "/calendar",
  "/journal",
  "/analytics",
  "/accounts",
];

function revalidateAll() {
  for (const p of DEPENDENT_PATHS) revalidatePath(p, "layout");
}

async function resolveMistakeIds(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    const mistake = await db.mistake.upsert({
      where: { name },
      update: {},
      create: { name, isCustom: true },
    });
    ids.push(mistake.id);
  }
  return ids;
}

function buildTradeData(data: TradeFormParsed, derived: TradeCalcResult) {
  return {
    accountId: data.accountId,
    date: new Date(data.date),
    entryTime: data.entryTime ?? null,
    closingDate: data.closingDate ? new Date(data.closingDate) : null,
    closingTime: data.closingTime ?? null,
    symbol: data.symbol.toUpperCase(),
    side: data.side,
    setup: data.setup ?? null,
    session: derived.session,
    entryPrice: data.entryPrice,
    stopLoss: data.stopLoss ?? null,
    takeProfit: data.takeProfit ?? null,
    exitPrice: data.exitPrice ?? null,
    quantity: data.quantity,
    pnl: derived.pnl,
    brokerageCharges: data.brokerageCharges ?? 0,
    netPnl: derived.netPnl,
    riskAmount: derived.riskAmount,
    riskPercent: derived.riskPercent,
    plannedRR: derived.plannedRR,
    rMultiple: derived.rMultiple,
    result: derived.result,
    marketBias: data.marketBias ?? null,
    higherTimeframeBias: data.higherTimeframeBias ?? null,
    entryReason: data.entryReason ?? null,
    exitReason: data.exitReason ?? null,
    confirmation: data.confirmation ?? null,
    invalidation: data.invalidation ?? null,
    tradeManagement: data.tradeManagement ?? null,
    mistakeNotes: data.mistakeNotes ?? null,
    emotionBefore: data.emotionBefore ?? null,
    emotionDuring: data.emotionDuring ?? null,
    emotionAfter: data.emotionAfter ?? null,
    confidenceLevel: data.confidenceLevel ?? null,
    disciplineScore: data.disciplineScore ?? null,
    preTradeThesis: data.preTradeThesis ?? null,
    whatHappened: data.whatHappened ?? null,
    whatWentRight: data.whatWentRight ?? null,
    whatWentWrong: data.whatWentWrong ?? null,
    lessonLearned: data.lessonLearned ?? null,
    screenshotUrl: data.screenshotUrl ?? null,
    notes: data.notes ?? null,
  };
}

async function deriveFields(data: TradeFormParsed, excludeTradeId?: string) {
  const date = new Date(data.date);
  const closingDate = data.closingDate ? new Date(data.closingDate) : null;
  const balanceBefore = await getAccountBalanceAt(
    data.accountId,
    closingDate ?? date,
    excludeTradeId,
  );
  return computeTradeDerivedFields({
    side: data.side,
    entryPrice: data.entryPrice,
    stopLoss: data.stopLoss ?? null,
    takeProfit: data.takeProfit ?? null,
    exitPrice: data.exitPrice ?? null,
    quantity: data.quantity,
    brokerageCharges: data.brokerageCharges ?? 0,
    entryTime: data.entryTime ?? null,
    accountBalanceAtEntry: balanceBefore,
  });
}

export async function createTrade(raw: TradeFormValues) {
  const data = tradeFormSchema.parse(raw);
  const derived = await deriveFields(data);
  const mistakeIds = await resolveMistakeIds(data.mistakes ?? []);

  const trade = await db.trade.create({
    data: {
      ...buildTradeData(data, derived),
      mistakes: { create: mistakeIds.map((mistakeId) => ({ mistakeId })) },
    },
  });

  revalidateAll();
  return trade.id;
}

export async function updateTrade(id: string, raw: TradeFormValues) {
  const data = tradeFormSchema.parse(raw);
  const derived = await deriveFields(data, id);
  const mistakeIds = await resolveMistakeIds(data.mistakes ?? []);

  await db.tradeMistake.deleteMany({ where: { tradeId: id } });
  await db.trade.update({
    where: { id },
    data: {
      ...buildTradeData(data, derived),
      mistakes: { create: mistakeIds.map((mistakeId) => ({ mistakeId })) },
    },
  });

  revalidateAll();
  revalidatePath(`/journal/${id}`);
}

export async function deleteTrade(id: string) {
  await db.trade.delete({ where: { id } });
  revalidateAll();
}
