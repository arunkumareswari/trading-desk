import { TradeForm } from "@/components/journal/trade-form";
import { getAccounts, getMistakes } from "@/lib/trades";
import { getSelectedAccountId } from "@/lib/session";
import { ALL_ACCOUNTS_ID } from "@/lib/constants";

export default async function NewTradePage() {
  const [accounts, selectedId, mistakes] = await Promise.all([
    getAccounts(),
    getSelectedAccountId(),
    getMistakes(),
  ]);
  const defaultAccountId = selectedId !== ALL_ACCOUNTS_ID ? selectedId : accounts[0]?.id;

  return (
    <div>
      <TradeForm
        accounts={accounts}
        defaultAccountId={defaultAccountId}
        availableMistakes={mistakes.map((m) => m.name)}
        title="Log a Trade"
        description="Every field here feeds the dashboard, calendar, and analytics automatically."
      />
    </div>
  );
}
