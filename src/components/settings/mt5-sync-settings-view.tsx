"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Download,
  Copy,
  Check,
  Zap,
  Activity,
  ShieldCheck,
  ExternalLink,
  Smartphone,
  RotateCw,
  Globe,
  Key,
  Server,
  Terminal,
  Code2,
  FileCode,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatSignedCurrency, pnlClass } from "@/lib/format";
import type { Account } from "@/generated/prisma/client";

interface MT5SyncSettingsViewProps {
  selectedAccount?: Account;
  recentMt5Trades?: Array<{
    id: string;
    date: Date;
    symbol: string;
    side: string;
    netPnl: number;
    pnl: number;
    brokerageCharges: number;
    notes?: string | null;
  }>;
}

export function MT5SyncSettingsView({
  selectedAccount,
  recentMt5Trades = [],
}: MT5SyncSettingsViewProps) {
  const [activeMode, setActiveMode] = useState<"python-bridge" | "ea-webhook">("python-bridge");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedPythonCmd, setCopiedPythonCmd] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:3000/api/webhooks/mt5");

  const accountToken = selectedAccount?.id ?? "TD-ACC-DEFAULT";

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/webhooks/mt5`);
    }
  }, []);

  function copyToClipboard(text: string, type: "url" | "token" | "cmd") {
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast.success("Webhook URL copied!");
    } else if (type === "token") {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      toast.success("Account Token copied!");
    } else {
      setCopiedPythonCmd(true);
      setTimeout(() => setCopiedPythonCmd(false), 2000);
      toast.success("Command copied to clipboard!");
    }
  }

  async function handleTestPing() {
    setTestingPing(true);
    try {
      const res = await fetch("/api/webhooks/mt5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiToken: accountToken,
          action: "PING",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("MT5 Webhook Gateway responded: 200 OK!");
      } else {
        toast.error(data.error || "Ping failed");
      }
    } catch {
      toast.error("Failed to connect to MT5 Webhook gateway");
    } finally {
      setTestingPing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/30">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Live MT5 Auto-Sync Active
              </span>
              <Badge variant="outline" className="text-[11px] bg-background/80">
                100% Free
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              MetaTrader 5 Real-Time Trade Sync
            </h2>
            <p className="text-xs text-muted-foreground max-w-xl">
              Automatic trade logging for all MT5 broker accounts. Supports mobile trades and syncs all closed positions continuously.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap rounded-lg border border-border bg-secondary/30 p-1">
            <button
              type="button"
              onClick={() => setActiveMode("python-bridge")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeMode === "python-bridge"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Python Direct Sync (⭐ Recommended)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("ea-webhook")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeMode === "ea-webhook"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>MQL5 EA</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* MODE 1: PYTHON DIRECT BRIDGE (OFFICIAL METATRADER5 PYTHON LIBRARY) */}
      {activeMode === "python-bridge" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Setup & Run */}
          <div className="lg:col-span-7 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-primary" />
                    Python Direct MT5 Bridge (Zero MetaApi, 100% Free)
                  </span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[11px]">
                    Official MetaTrader5
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Uses the official MetaTrader5 Python library on your Windows laptop to read MT5 trades and sync automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Step 1 */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    1. Install Python Library (One-time)
                  </span>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-input/20 px-3 py-2 font-mono text-xs text-foreground">
                    <code>pip install MetaTrader5 requests</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("pip install MetaTrader5 requests", "cmd")}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {copiedPythonCmd ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    2. Run the Direct Sync Bridge Script
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    Open your terminal in this project folder and run:
                  </p>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-input/20 px-3 py-2 font-mono text-xs text-foreground">
                    <code>python scripts/mt5_sync.py</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("python scripts/mt5_sync.py", "cmd")}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Details */}
                <div className="rounded-lg border border-border/80 bg-secondary/20 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Account Token:</span>
                    <span className="font-mono font-semibold text-foreground">{accountToken}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Webhook Gateway:</span>
                    <span className="font-mono text-foreground truncate max-w-[240px]">{webhookUrl}</span>
                  </div>
                </div>

                {/* Test button */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestPing}
                    disabled={testingPing}
                    className="w-full gap-1.5 text-xs"
                  >
                    <Activity className={`h-3.5 w-3.5 ${testingPing ? "animate-spin text-primary" : "text-emerald-500"}`} />
                    {testingPing ? "Testing Gateway..." : "Test Gateway Connection"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Why Python Bridge */}
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Why Python Direct Sync is Best
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
                <div className="flex gap-2.5 items-start">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    ✓
                  </div>
                  <div>
                    <strong className="text-foreground">Zero Third-Party Cost (₹0):</strong> No MetaApi, no tokens, no monthly subscriptions needed.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    ✓
                  </div>
                  <div>
                    <strong className="text-foreground">Official MetaTrader5 API:</strong> Direct native Windows C-API communication with your MT5 terminal.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    ✓
                  </div>
                  <div>
                    <strong className="text-foreground">Continuous Background Sync:</strong> Runs silently on your laptop and pushes any new trade within 5 seconds to your journal.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    ✓
                  </div>
                  <div>
                    <strong className="text-foreground">Mobile Trades Supported:</strong> When you trade on your phone, your laptop MT5 receives the trade and the Python script automatically syncs it!
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* MODE 2: FREE MQL5 EA WEBHOOK */}
      {activeMode === "ea-webhook" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Connection Credentials Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                EA Connection Credentials (100% Free)
              </CardTitle>
              <CardDescription className="text-xs">
                Enter these details into the EA input settings on your MT5 chart.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Webhook Endpoint URL</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden truncate rounded-lg border border-border bg-input/20 px-3 py-2 font-mono text-xs text-foreground">
                    {webhookUrl}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl, "url")}
                    className="shrink-0 gap-1 text-xs"
                  >
                    {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedUrl ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Account Token / Key</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden truncate rounded-lg border border-border bg-input/20 px-3 py-2 font-mono text-xs text-foreground font-semibold">
                    {accountToken}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(accountToken, "token")}
                    className="shrink-0 gap-1 text-xs"
                  >
                    {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedToken ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <a href="/mt5/TradingJournalSync.mq5" download="TradingJournalSync.mq5">
                  <Button className="w-full gap-2 text-xs font-semibold">
                    <Download className="h-4 w-4" /> Download EA Script (.mq5)
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* 3-Step Setup Guide */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Quick MT5 EA Setup Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex gap-3 items-start">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  1
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Paste EA in MT5 Experts folder</p>
                  <p className="text-muted-foreground text-[11px]">
                    In MT5: <strong className="text-foreground">File → Open Data Folder → MQL5 → Experts</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  2
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Allow WebRequest in MT5 Options</p>
                  <p className="text-muted-foreground text-[11px]">
                    Go to <strong className="text-foreground">Tools → Options → Expert Advisors</strong>. Check &quot;Allow WebRequest&quot; and add the URL.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  3
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Attach EA to any 1 Chart</p>
                  <p className="text-muted-foreground text-[11px]">
                    Drag EA onto any chart and paste your Account Token. Done!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Synced Trades Log */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-primary" />
                Recent Synced MT5 Trades
              </CardTitle>
              <CardDescription className="text-xs">
                Trades synced automatically from your MetaTrader account.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {recentMt5Trades.length} Synced Trade{recentMt5Trades.length === 1 ? "" : "s"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {recentMt5Trades.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
              No MT5 trades synced yet. Run the Python bridge or connect your EA to see live synced trades here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-left">
                    <th className="pb-2 font-medium">Date & Time</th>
                    <th className="pb-2 font-medium">Symbol</th>
                    <th className="pb-2 font-medium">Side</th>
                    <th className="pb-2 font-medium">Fees</th>
                    <th className="pb-2 font-medium">Net P&L</th>
                    <th className="pb-2 font-medium">Details / Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {recentMt5Trades.map((t) => (
                    <tr key={t.id} className="hover:bg-secondary/20">
                      <td className="py-2.5 font-mono text-muted-foreground">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 font-bold text-foreground">{t.symbol}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            t.side === "LONG"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {t.side}
                        </span>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{formatCurrency(t.brokerageCharges)}</td>
                      <td className={`py-2.5 font-semibold ${pnlClass(t.netPnl)}`}>
                        {formatSignedCurrency(t.netPnl)}
                      </td>
                      <td className="py-2.5 text-muted-foreground text-[11px] truncate max-w-[200px]">
                        {t.notes || "MT5 Deal"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
