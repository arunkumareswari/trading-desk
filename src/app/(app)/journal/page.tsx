import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { JournalTable } from "@/components/journal/journal-table";
import { getAccounts, getTradesForScope } from "@/lib/trades";
import { getSelectedAccountId } from "@/lib/session";

export default async function JournalPage() {
  const selectedAccountId = await getSelectedAccountId();
  const [trades, accounts] = await Promise.all([
    getTradesForScope(selectedAccountId),
    getAccounts(),
  ]);

  return (
    <div>
      <PageHeader
        title="Trading Journal"
        description="The source of truth — every trade here feeds the dashboard, calendar, and analytics."
        actions={
          <Button asChild className="gap-1.5 font-medium shadow-sm">
            <Link href="/journal/new">
              <Plus className="h-4 w-4" />
              Add Trade
            </Link>
          </Button>
        }
      />
      <JournalTable trades={trades} accounts={accounts} />
    </div>
  );
}

