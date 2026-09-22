import "server-only";
import { db } from "@/lib/db";
import { ALL_ACCOUNTS_ID, PREDEFINED_MISTAKES } from "@/lib/constants";
import type { MetricsTrade } from "@/lib/metrics";
import type { TradeGetPayload } from "@/generated/prisma/models";

const tradeInclude = { mistakes: { include: { mistake: true } } } as const;

type RawTrade = TradeGetPayload<{ include: typeof tradeInclude }>;

function flatten(trade: RawTrade): MetricsTrade {
  return { ...trade, mistakes: trade.mistakes.map((m) => m.mistake.name) };
}

export async function getAccounts() {
  return db.account.findMany({ orderBy: { createdAt: "asc" } });
}

export async function getAccount(id: string) {
  if (id === ALL_ACCOUNTS_ID) return null;
  return db.account.findUnique({ where: { id } });
}

export async function resolveScopeAccountId(accountId?: string): Promise<string> {
  if (accountId && accountId !== ALL_ACCOUNTS_ID) {
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: { id: true },
    });
    if (account) return account.id;
  }
  const first = await db.account.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return first?.id ?? "";
}

export async function getTradesForScope(accountId: string): Promise<MetricsTrade[]> {
  const resolvedId = await resolveScopeAccountId(accountId);
  if (!resolvedId) return [];
  const trades = await db.trade.findMany({
    where: { accountId: resolvedId },
    include: tradeInclude,
    orderBy: { date: "asc" },
  });
  return trades.map(flatten);
}

export async function getStartingBalanceForScope(accountId: string): Promise<number> {
  const resolvedId = await resolveScopeAccountId(accountId);
  if (!resolvedId) return 0;
  const account = await getAccount(resolvedId);
  return account?.startingBalance ?? 0;
}

export async function getTrade(id: string): Promise<MetricsTrade | null> {
  const t = await db.trade.findUnique({ where: { id }, include: tradeInclude });
  return t ? flatten(t) : null;
}

export async function getMistakes() {
  const count = await db.mistake.count();
  if (count === 0) {
    for (const name of PREDEFINED_MISTAKES) {
      await db.mistake.upsert({
        where: { name },
        update: {},
        create: { name, isCustom: false },
      });
    }
  }
  return db.mistake.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { trades: true },
      },
    },
  });
}

/** Account balance the instant before `beforeDate`, used to compute Risk % at entry. */
export async function getAccountBalanceAt(
  accountId: string,
  beforeDate: Date,
  excludeTradeId?: string,
): Promise<number> {
  const account = await getAccount(accountId);
  if (!account) return 0;
  const trades = await db.trade.findMany({
    where: {
      accountId,
      result: { not: null },
      ...(excludeTradeId ? { id: { not: excludeTradeId } } : {}),
    },
    select: { date: true, closingDate: true, netPnl: true },
  });
  const priorSum = trades
    .filter((t) => (t.closingDate ?? t.date) < beforeDate)
    .reduce((s, t) => s + t.netPnl, 0);
  return account.startingBalance + priorSum;
}
