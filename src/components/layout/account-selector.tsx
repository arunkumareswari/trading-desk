"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Wallet,
  Zap,
  Copy,
  ArrowLeft,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AccountForm } from "@/components/accounts/account-form";
import { setSelectedAccount } from "@/lib/actions/session";
import type { Account } from "@/generated/prisma/client";

export function AccountSelector({
  accounts,
  selectedId,
}: {
  accounts: Account[];
  selectedId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [mt5Open, setMt5Open] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const current = accounts.find((a) => a.id === selectedId) ?? accounts[0];
  const label = current ? current.name : "Select Workspace";

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/mt5`
      : "https://your-app.com/api/webhooks/mt5";

  function select(id: string) {
    startTransition(async () => {
      await setSelectedAccount(id);
      router.refresh();
    });
  }

  function copy(text: string, type: "url" | "cmd") {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    }
  }

  // "Connect with MT5" button rendered in the footer-left of the create dialog
  const mt5FooterButton = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs"
      onClick={() => {
        setCreateOpen(false);
        setMt5Open(true);
      }}
    >
      <Zap className="h-3.5 w-3.5 text-primary" />
      Connect with MT5
    </Button>
  );

  return (
    <>
      {/* ── Account Dropdown ─────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 px-3 gap-2 border-border bg-secondary/40 hover:bg-secondary/70 font-medium text-xs sm:text-sm"
            disabled={isPending}
          >
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="max-w-[150px] truncate">{label}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Workspace
          </DropdownMenuLabel>
          {accounts.map((a) => (
            <DropdownMenuItem
              key={a.id}
              onClick={() => select(a.id)}
              className="justify-between"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="truncate">{a.name}</span>
                {a.isDemo && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 font-normal"
                  >
                    Demo
                  </Badge>
                )}
              </span>
              {current?.id === a.id && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          {accounts.length === 0 && (
            <div className="px-2 py-2 text-xs text-muted-foreground">
              No accounts yet — add one below.
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="gap-2 text-primary"
          >
            <Plus className="h-4 w-4" /> Add Account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ── Create Account Dialog (original design + MT5 button) ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Account / Workspace</DialogTitle>
          </DialogHeader>
          <AccountForm
            onSuccess={(id) => {
              setCreateOpen(false);
              select(id);
            }}
            footerLeft={mt5FooterButton}
          />
        </DialogContent>
      </Dialog>

      {/* ── MT5 Steps Popup ───────────────────────────────── */}
      <Dialog open={mt5Open} onOpenChange={setMt5Open}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMt5Open(false);
                  setCreateOpen(true);
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <DialogTitle>Connect MT5 Account</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Account is auto-created on first sync — no manual setup needed.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* How it works */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary" />
                How it works
              </p>
              <p className="leading-relaxed">
                When your MT5 Python script runs, it sends your account details here.
                A new workspace is created automatically — no manual form needed.
              </p>
            </div>

            {/* Step 1 */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                  1
                </span>
                Copy your Webhook URL
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <code className="flex-1 truncate text-[11px] font-mono text-foreground">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={() => copy(webhookUrl, "url")}
                  className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedUrl ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedUrl ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                  2
                </span>
                Paste it in{" "}
                <code className="font-mono text-[11px]">mt5_sync.py</code>
              </p>
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <pre className="text-[11px] font-mono text-foreground leading-relaxed whitespace-pre-wrap">
{`JOURNAL_WEBHOOK_URL = "${webhookUrl}"
# Account auto-creates from your MT5 account name`}
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                  3
                </span>
                Run the script on your Trading PC
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <code className="flex-1 text-[11px] font-mono text-foreground">
                  python mt5_sync.py
                </code>
                <button
                  type="button"
                  onClick={() => copy("python mt5_sync.py", "cmd")}
                  className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedCmd ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedCmd ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Done note */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                ✓ After the script runs,
              </span>{" "}
              a new workspace appears in the dropdown. Refresh if it doesn&apos;t show.
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMt5Open(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setMt5Open(false);
                  router.refresh();
                }}
              >
                <Check className="h-3.5 w-3.5" />
                Done — Refresh
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
