import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { parseImportCsv } from "@/lib/csv";
import { computeTradeDerivedFields } from "@/lib/trade-calc";
import { getAccountBalanceAt } from "@/lib/trades";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const text = await file.text();
  const { rows, errors } = parseImportCsv(text);

  const accounts = await db.account.findMany();
  const accountByName = new Map(accounts.map((a) => [a.name.toLowerCase(), a]));

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  let imported = 0;

  for (const [i, row] of sorted.entries()) {
    const account = accountByName.get(row.accountName.toLowerCase());
    if (!account) {
      errors.push(`Row ${i + 2}: account "${row.accountName}" not found — create it first on the Accounts page`);
      continue;
    }
    const side = row.side.toUpperCase().startsWith("S") ? "SHORT" : "LONG";
    const date = new Date(row.date);
    const closingDate = row.closingDate ? new Date(row.closingDate) : null;

    try {
      const balanceBefore = await getAccountBalanceAt(account.id, closingDate ?? date);
      const derived = computeTradeDerivedFields({
        side,
        entryPrice: row.entryPrice,
        stopLoss: row.stopLoss ?? null,
        takeProfit: row.takeProfit ?? null,
        exitPrice: row.exitPrice ?? null,
        quantity: row.quantity,
        brokerageCharges: row.brokerageCharges ?? 0,
        entryTime: row.entryTime ?? null,
        accountBalanceAtEntry: balanceBefore,
      });

      const mistakeIds: string[] = [];
      for (const name of row.mistakes) {
        const mistake = await db.mistake.upsert({
          where: { name },
          update: {},
          create: { name, isCustom: true },
        });
        mistakeIds.push(mistake.id);
      }

      await db.trade.create({
        data: {
          accountId: account.id,
          date,
          entryTime: row.entryTime ?? null,
          closingDate,
          closingTime: row.closingTime ?? null,
          symbol: row.symbol.toUpperCase(),
          side,
          setup: row.setup ?? null,
          session: derived.session,
          entryPrice: row.entryPrice,
          stopLoss: row.stopLoss ?? null,
          takeProfit: row.takeProfit ?? null,
          exitPrice: row.exitPrice ?? null,
          quantity: row.quantity,
          pnl: derived.pnl,
          brokerageCharges: row.brokerageCharges ?? 0,
          netPnl: derived.netPnl,
          riskAmount: derived.riskAmount,
          riskPercent: derived.riskPercent,
          plannedRR: derived.plannedRR,
          rMultiple: derived.rMultiple,
          result: derived.result,
          emotionDuring: row.emotionDuring ?? null,
          notes: row.notes ?? null,
          mistakes: { create: mistakeIds.map((mistakeId) => ({ mistakeId })) },
        },
      });
      imported++;
    } catch (e) {
      errors.push(`Row ${i + 2}: ${e instanceof Error ? e.message : "failed to import"}`);
    }
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ imported, skipped: rows.length - imported, errors });
}
