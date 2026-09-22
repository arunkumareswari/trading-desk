import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/layout/sidebar-context";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AccountSelector } from "@/components/layout/account-selector";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getAccounts } from "@/lib/trades";
import { getSelectedAccountId } from "@/lib/session";
import { ALL_ACCOUNTS_ID } from "@/lib/constants";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [accounts, rawSelectedId] = await Promise.all([
    getAccounts(),
    getSelectedAccountId(),
  ]);
  const selectedId =
    rawSelectedId && rawSelectedId !== ALL_ACCOUNTS_ID && accounts.some((a) => a.id === rawSelectedId)
      ? rawSelectedId
      : (accounts[0]?.id ?? "");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <MobileNav />
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AccountSelector accounts={accounts} selectedId={selectedId} />
            </div>
          </header>
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
