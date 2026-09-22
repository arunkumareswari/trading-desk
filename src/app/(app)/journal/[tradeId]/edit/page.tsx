import { notFound } from "next/navigation";
import { TradeForm } from "@/components/journal/trade-form";
import { getAccounts, getMistakes, getTrade } from "@/lib/trades";
import { tradeToFormValues } from "@/lib/schemas/trade";

export default async function EditTradePage({
  params,
}: {
  params: Promise<{ tradeId: string }>;
}) {
  const { tradeId } = await params;
  const [trade, accounts, mistakes] = await Promise.all([
    getTrade(tradeId),
    getAccounts(),
    getMistakes(),
  ]);
  if (!trade) notFound();

  return (
    <div>
      <TradeForm
        accounts={accounts}
        initialValues={tradeToFormValues(trade)}
        tradeId={trade.id}
        availableMistakes={mistakes.map((m) => m.name)}
        title="Edit Trade"
        description={`${trade.symbol} · ${trade.setup ?? "No setup"}`}
      />
    </div>
  );
}
