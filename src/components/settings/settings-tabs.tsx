"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Wallet, ArrowUpDown, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsTabKey = "import-export" | "mt5-sync" | "mistakes" | "accounts";

interface SettingsTabsProps {
  initialTab?: string;
  importExportContent: React.ReactNode;
  mt5SyncContent?: React.ReactNode;
  mistakesContent: React.ReactNode;
  accountsContent: React.ReactNode;
}

export function SettingsTabs({
  initialTab = "import-export",
  importExportContent,
  mt5SyncContent,
  mistakesContent,
  accountsContent,
}: SettingsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const validTabs: SettingsTabKey[] = ["import-export", "mt5-sync", "mistakes", "accounts"];
  const tabParam = searchParams.get("tab") as SettingsTabKey;
  const activeTab: SettingsTabKey = validTabs.includes(tabParam)
    ? tabParam
    : (validTabs.includes(initialTab as SettingsTabKey) ? (initialTab as SettingsTabKey) : "import-export");

  function handleTabChange(tab: SettingsTabKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      {/* Tab Switcher - Order: Import / Export -> MT5 Auto-Sync -> Mistakes -> Accounts */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleTabChange("import-export")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === "import-export"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
          )}
        >
          <ArrowUpDown className="h-4 w-4" />
          <span>Import / Export</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("mt5-sync")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === "mt5-sync"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
          )}
        >
          <Zap className="h-4 w-4" />
          <span>MT5 Auto-Sync</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("mistakes")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === "mistakes"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
          )}
        >
          <AlertCircle className="h-4 w-4" />
          <span>Mistakes</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("accounts")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            activeTab === "accounts"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
          )}
        >
          <Wallet className="h-4 w-4" />
          <span>Accounts</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "import-export" && (
          <div className="animate-in fade-in-50 duration-150">
            {importExportContent}
          </div>
        )}

        {activeTab === "mt5-sync" && (
          <div className="animate-in fade-in-50 duration-150">
            {mt5SyncContent}
          </div>
        )}

        {activeTab === "mistakes" && (
          <div className="animate-in fade-in-50 duration-150">
            {mistakesContent}
          </div>
        )}

        {activeTab === "accounts" && (
          <div className="animate-in fade-in-50 duration-150">
            {accountsContent}
          </div>
        )}
      </div>
    </div>
  );
}
