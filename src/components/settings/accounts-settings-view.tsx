"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Copy,
  Check,
  Pencil,
  AlertTriangle,
  Shield,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { DeleteAccountButton } from "@/components/accounts/delete-account-button";
import { formatCurrency } from "@/lib/format";
import type { Account } from "@/generated/prisma/client";
import type { PerformanceMetrics } from "@/lib/metrics";

export function AccountsSettingsView({
  accountsWithMetrics,
}: {
  accountsWithMetrics: {
    account: Account;
    metrics: PerformanceMetrics;
  }[];
}) {
  const [copied, setCopied] = useState(false);
  const item = accountsWithMetrics[0];

  if (!item) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No account currently selected. Select an account in the top bar.
        </CardContent>
      </Card>
    );
  }

  const { account, metrics } = item;

  const isProfitable = metrics.netPnl >= 0;
  const avatarSrc = isProfitable ? "/bull.png" : "/bear.png";
  const avatarAlt = isProfitable ? "Bull Avatar (In Profit)" : "Bear Avatar (In Loss)";

  // Branded unique Trading Desk Account ID format: e.g. TD-ACC-20QC4S
  const shortCode = account.id.slice(-6).toUpperCase();
  const formattedId = `TD-ACC-${shortCode}`;

  const copyId = () => {
    navigator.clipboard.writeText(formattedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createdDateStr = account.createdAt
    ? format(new Date(account.createdAt), "MMMM d, yyyy")
    : "—";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Account Information */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
        <Card className="border-border bg-card h-full flex flex-col">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Account Information
            </CardTitle>
            <CardDescription className="text-xs">
              Basic configuration, ownership, and workspace identity settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60 text-sm flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between px-6 py-3 flex-1">
              <span className="text-muted-foreground">Account Name</span>
              <span className="font-medium text-foreground">{account.name}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-3 flex-1">
              <span className="text-muted-foreground">Account Type</span>
              <span className="font-medium text-foreground">
                {account.isDemo ? "Simulated / Paper Trading" : "Funded Prop Account / Live Capital"}
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-3 flex-1">
              <span className="text-muted-foreground">Base Currency</span>
              <span className="font-medium text-foreground">{account.currency}</span>
            </div>
            <div className="flex items-center justify-between px-6 py-3 flex-1">
              <span className="text-muted-foreground">Initial Balance</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(account.startingBalance)}
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-3 flex-1">
              <span className="text-muted-foreground">Account Created On</span>
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {createdDateStr}
              </span>
            </div>
            <div className="flex items-center justify-between px-6 py-3 flex-1">
              <span className="text-muted-foreground">Account Status</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active & Connected
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Profile Card + Delete Card Below It */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
        {/* Account Profile Card */}
        <Card className="border-border bg-card flex-1 flex flex-col justify-between">
          <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarSrc}
                  alt={avatarAlt}
                  className="h-full w-full object-contain drop-shadow-sm"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-foreground truncate">
                  {account.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  <span>Account ID:</span>
                  <code className="font-mono text-xs font-medium text-foreground">
                    {formattedId}
                  </code>
                  <button
                    type="button"
                    onClick={copyId}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors p-0.5 ml-0.5 rounded"
                    title="Copy Account ID"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <AccountFormDialog
              account={account}
              trigger={
                <Button variant="outline" className="w-full gap-2 h-9">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Details
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Delete Card Below Profile Card */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2.5 shrink-0">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Delete Account
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Permanently remove <strong className="text-foreground">{account.name}</strong> and all associated trades, tags, and notes. This action cannot be undone.
            </p>
          </div>

          <DeleteAccountButton
            accountId={account.id}
            accountName={account.name}
            variant="destructive"
            className="w-full gap-1.5"
          >
            Delete Account
          </DeleteAccountButton>
        </div>
      </div>
    </div>
  );
}
