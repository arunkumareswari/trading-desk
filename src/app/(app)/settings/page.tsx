import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvImportExport } from "@/components/settings/csv-import-export";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { AccountsSettingsView } from "@/components/settings/accounts-settings-view";
import { MistakesSettingsView } from "@/components/settings/mistakes-settings-view";
import { db } from "@/lib/db";
import { getAccounts, getMistakes } from "@/lib/trades";
import { computeMetrics, type MetricsTrade } from "@/lib/metrics";
import { getSelectedAccountId } from "@/lib/session";
import { ALL_ACCOUNTS_ID } from "@/lib/constants";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const [accounts, mistakes, rawSelectedId] = await Promise.all([
    getAccounts(),
    getMistakes(),
    getSelectedAccountId(),
  ]);

  const selectedAccountId =
    rawSelectedId && rawSelectedId !== ALL_ACCOUNTS_ID && accounts.some((a) => a.id === rawSelectedId)
      ? rawSelectedId
      : (accounts[0]?.id ?? "");

  // Show only the selected account's details
  const displayAccounts = accounts.filter((a) => a.id === selectedAccountId);

  const accountsWithMetrics = await Promise.all(
    displayAccounts.map(async (account) => {
      const raw = await db.trade.findMany({
        where: { accountId: account.id },
        include: { mistakes: { include: { mistake: true } } },
      });
      const trades: MetricsTrade[] = raw.map((t) => ({
        ...t,
        mistakes: t.mistakes.map((m) => m.mistake.name),
      }));
      const metrics = computeMetrics(trades, account.startingBalance);
      return { account, metrics };
    })
  );

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your trading mistake taxonomy, data import / export, and account workspaces."
      />

      <SettingsTabs
        initialTab={sp.tab ?? "import-export"}
        importExportContent={
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Import / Export Data</CardTitle>
              </CardHeader>
              <CardContent>
                <CsvImportExport />
              </CardContent>
            </Card>
          </div>
        }
        mistakesContent={<MistakesSettingsView mistakes={mistakes} />}
        accountsContent={<AccountsSettingsView accountsWithMetrics={accountsWithMetrics} />}
      />
    </div>
  );
}
