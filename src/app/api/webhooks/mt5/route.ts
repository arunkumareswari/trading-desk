import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { computeTradeDerivedFields } from "@/lib/trade-calc";
import { getAccountBalanceAt } from "@/lib/trades";

const DEPENDENT_PATHS = [
  "/dashboard",
  "/calendar",
  "/journal",
  "/analytics",
  "/accounts",
];

function revalidateAll() {
  for (const p of DEPENDENT_PATHS) {
    try {
      revalidatePath(p, "layout");
    } catch {
      // ignore
    }
  }
}

interface MT5TradePayload {
  ticket: number | string;
  symbol: string;
  side: "BUY" | "SELL" | "LONG" | "SHORT" | string;
  lots?: number;
  quantity?: number;
  openPrice: number;
  closePrice?: number;
  openTime: string; // "YYYY.MM.DD HH:mm:ss" or ISO string
  closeTime?: string;
  sl?: number;
  stopLoss?: number;
  tp?: number;
  takeProfit?: number;
  profit?: number;
  pnl?: number;
  commission?: number;
  swap?: number;
  brokerageCharges?: number;
  comment?: string;
  magic?: number;
}

interface WebhookBody {
  apiToken?: string;
  accountId?: string;
  accountName?: string;
  accountLogin?: string | number;
  startingBalance?: number;
  balance?: number;
  currency?: string;
  isDemo?: boolean;
  action?: "PING" | "SYNC_TRADES" | "TEST";
  trades?: MT5TradePayload[];
  trade?: MT5TradePayload;
  // single trade fallback properties
  ticket?: number | string;
  symbol?: string;
  side?: string;
  lots?: number;
  quantity?: number;
  openPrice?: number;
  closePrice?: number;
  openTime?: string;
  closeTime?: string;
  sl?: number;
  tp?: number;
  profit?: number;
  pnl?: number;
  commission?: number;
  swap?: number;
}

function parseMT5Date(dateStr?: string): { date: Date; timeStr: string } {
  if (!dateStr) {
    const now = new Date();
    return {
      date: now,
      timeStr: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    };
  }

  // Handle MT5 format "YYYY.MM.DD HH:mm:ss" or "YYYY-MM-DD HH:mm:ss"
  const normalized = dateStr.replace(/\./g, "-");
  const parsed = new Date(normalized);
  const validDate = isNaN(parsed.getTime()) ? new Date() : parsed;

  const hours = String(validDate.getHours()).padStart(2, "0");
  const mins = String(validDate.getMinutes()).padStart(2, "0");

  return {
    date: validDate,
    timeStr: `${hours}:${mins}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: WebhookBody = await req.json();

    const token = body.apiToken || body.accountId;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing apiToken or accountId" },
        { status: 400 }
      );
    }

    // Resolve Account (or Auto-Create if first time syncing this MT5 account)
    let account = await db.account.findUnique({ where: { id: token } });
    if (!account) {
      const accounts = await db.account.findMany();
      account =
        accounts.find((a) => a.id.toLowerCase() === token.toLowerCase()) ??
        accounts.find((a) => a.name.toLowerCase() === token.toLowerCase()) ??
        accounts.find((a) => a.name.includes(token)) ??
        null;
    }

    // Auto-create workspace for this MT5 account if not found
    if (!account) {
      const accountName = body.accountName || `MT5 Account #${body.accountLogin || token}`;
      const startingBalance = Number(body.startingBalance || body.balance || 5000);
      const currency = body.currency || "USD";
      const isDemo = Boolean(body.isDemo);

      account = await db.account.create({
        data: {
          name: accountName,
          startingBalance,
          currency,
          isDemo,
        },
      });
      console.log(`✨ Auto-created new Trading Journal workspace: "${account.name}" (ID: ${account.id})`);
    }

    // Handle Ping / Connection Health Check
    if (body.action === "PING") {
      return NextResponse.json({
        success: true,
        message: "Pong! MT5 Webhook connected successfully.",
        account: { id: account.id, name: account.name },
        timestamp: new Date().toISOString(),
      });
    }

    // Extract trade items
    const rawTrades: MT5TradePayload[] = [];
    if (Array.isArray(body.trades) && body.trades.length > 0) {
      rawTrades.push(...body.trades);
    } else if (body.trade) {
      rawTrades.push(body.trade);
    } else if (body.ticket && body.symbol) {
      rawTrades.push({
        ticket: body.ticket,
        symbol: body.symbol,
        side: body.side || "BUY",
        lots: body.lots || body.quantity || 1,
        openPrice: body.openPrice || 0,
        closePrice: body.closePrice,
        openTime: body.openTime || new Date().toISOString(),
        closeTime: body.closeTime,
        sl: body.sl,
        tp: body.tp,
        profit: body.profit ?? body.pnl,
        commission: body.commission,
        swap: body.swap,
      });
    }

    if (rawTrades.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Webhook ping received (0 trades to sync)",
        saved: 0,
        skipped: 0,
      });
    }

    let savedCount = 0;
    let skippedCount = 0;

    for (const item of rawTrades) {
      const ticketStr = String(item.ticket || "");
      const ticketIdentifier = ticketStr ? `[MT5 Ticket: ${ticketStr}]` : "";

      // Check for duplicate trade by ticket in notes
      if (ticketStr) {
        const existing = await db.trade.findFirst({
          where: {
            accountId: account.id,
            notes: { contains: `[MT5 Ticket: ${ticketStr}]` },
          },
        });

        if (existing) {
          skippedCount++;
          continue;
        }
      }

      // Map side
      const rawSide = (item.side || "").toUpperCase();
      const side: "LONG" | "SHORT" =
        rawSide.includes("SELL") || rawSide === "SHORT" ? "SHORT" : "LONG";

      const { date: entryDate, timeStr: entryTime } = parseMT5Date(item.openTime);
      const { date: closeDate, timeStr: closeTime } = item.closeTime
        ? parseMT5Date(item.closeTime)
        : { date: entryDate, timeStr: entryTime };

      const quantity = Number(item.lots || item.quantity || 1);
      const entryPrice = Number(item.openPrice || 0);
      const exitPrice = item.closePrice ? Number(item.closePrice) : entryPrice;
      const stopLoss = item.sl ?? item.stopLoss ? Number(item.sl ?? item.stopLoss) : null;
      const takeProfit = item.tp ?? item.takeProfit ? Number(item.tp ?? item.takeProfit) : null;

      const commission = Math.abs(Number(item.commission || 0));
      const swap = Math.abs(Number(item.swap || 0));
      const totalFees = commission + swap;

      const rawPnl = item.profit !== undefined ? Number(item.profit) : Number(item.pnl || 0);

      // Compute balance before this trade
      const balanceBefore = await getAccountBalanceAt(account.id, closeDate);

      const derived = computeTradeDerivedFields({
        side,
        entryPrice,
        exitPrice,
        stopLoss,
        takeProfit,
        quantity,
        brokerageCharges: totalFees,
        entryTime,
        accountBalanceAtEntry: balanceBefore,
      });

      // Override PnL if MT5 provided the exact broker profit figure
      const pnl = item.profit !== undefined ? rawPnl : derived.pnl;
      const netPnl = pnl - totalFees;
      const result =
        netPnl > 0 ? "WIN" : netPnl < 0 ? "LOSS" : "BREAKEVEN";

      const notesContent = [
        ticketIdentifier,
        item.comment ? `MT5 Comment: ${item.comment}` : null,
        item.magic ? `Magic: ${item.magic}` : null,
        "Auto-synced via MetaTrader 5 EA",
      ]
        .filter(Boolean)
        .join(" | ");

      await db.trade.create({
        data: {
          accountId: account.id,
          date: entryDate,
          entryTime,
          closingDate: closeDate,
          closingTime: closeTime,
          symbol: item.symbol.toUpperCase().trim(),
          side,
          setup: "MT5 Auto-Sync",
          session: derived.session,
          entryPrice,
          stopLoss,
          takeProfit,
          exitPrice,
          quantity,
          pnl,
          brokerageCharges: totalFees,
          netPnl,
          riskAmount: derived.riskAmount,
          riskPercent: derived.riskPercent,
          plannedRR: derived.plannedRR,
          rMultiple: derived.riskAmount && derived.riskAmount > 0 ? Number((netPnl / derived.riskAmount).toFixed(2)) : null,
          result,
          notes: notesContent,
        },
      });

      savedCount++;
    }

    if (savedCount > 0) {
      revalidateAll();
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${savedCount} trades saved, ${skippedCount} skipped.`,
      saved: savedCount,
      skipped: skippedCount,
      accountId: account.id,
    });
  } catch (err: unknown) {
    console.error("MT5 Webhook Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("apiToken") || url.searchParams.get("accountId");

  return NextResponse.json({
    status: "online",
    service: "Trading Journal MT5 Webhook Gateway",
    endpoint: "/api/webhooks/mt5",
    tokenProvided: !!token,
    timestamp: new Date().toISOString(),
  });
}
