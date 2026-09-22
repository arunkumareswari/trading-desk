import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SideBadge, ResultBadge } from "@/components/journal/badges";
import { DetailBlock, DetailRow } from "@/components/journal/detail-row";
import { DeleteTradeButton } from "@/components/journal/delete-trade-button";
import { getAccount, getTrade } from "@/lib/trades";
import { formatCurrency, formatMinutes, formatPercent, formatR, formatSignedCurrency, pnlClass } from "@/lib/format";
import { averageHoldingMinutes } from "@/lib/metrics";

export default async function TradeDetailPage({
  params,
}: {
  params: Promise<{ tradeId: string }>;
}) {
  const { tradeId } = await params;
  const trade = await getTrade(tradeId);
  if (!trade) notFound();

  const account = await getAccount(trade.accountId);
  const holdingMinutes = averageHoldingMinutes([trade]);

  return (
    <div>
      <Link href="/journal" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Journal
      </Link>
      <PageHeader
        title={`${trade.symbol} — ${format(trade.date, "MMM d, yyyy")}`}
        description={account?.name ?? "Unknown account"}
        actions={
          <>
            <SideBadge side={trade.side as "LONG" | "SHORT"} />
            <ResultBadge result={trade.result as "WIN" | "LOSS" | "BREAKEVEN" | null} />
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link href={`/journal/${trade.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            </Button>
            <DeleteTradeButton tradeId={trade.id} />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trade Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-8 sm:grid-cols-3">
              <DetailRow label="Setup" value={trade.setup} />
              <DetailRow label="Entry Price" value={trade.entryPrice.toLocaleString()} />
              <DetailRow label="Stop Loss" value={trade.stopLoss?.toLocaleString()} />
              <DetailRow label="Take Profit" value={trade.takeProfit?.toLocaleString()} />
              <DetailRow label="Exit Price" value={trade.exitPrice?.toLocaleString()} />
              <DetailRow label="Quantity" value={trade.quantity.toLocaleString()} />
              <DetailRow label="Entry Time" value={trade.entryTime} />
              <DetailRow label="Closing Date" value={trade.closingDate ? format(trade.closingDate, "MMM d, yyyy") : undefined} />
              <DetailRow label="Closing Time" value={trade.closingTime} />
              <DetailRow label="Session" value={trade.session} />
              <DetailRow label="Holding Time" value={formatMinutes(holdingMinutes)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financials</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-8 sm:grid-cols-3">
              <DetailRow label="P&L" value={<span className={pnlClass(trade.pnl)}>{formatSignedCurrency(trade.pnl)}</span>} />
              <DetailRow label="Brokerage Charges" value={formatCurrency(trade.brokerageCharges)} />
              <DetailRow
                label="Net P&L"
                value={<span className={pnlClass(trade.netPnl)}>{formatSignedCurrency(trade.netPnl)}</span>}
              />
              <DetailRow label="Risk in $" value={trade.riskAmount ? formatCurrency(trade.riskAmount) : undefined} />
              <DetailRow label="Risk %" value={trade.riskPercent ? formatPercent(trade.riskPercent) : undefined} />
              <DetailRow label="Planned R:R" value={trade.plannedRR ? `${trade.plannedRR.toFixed(2)}R` : undefined} />
              <DetailRow label="R-Multiple" value={formatR(trade.rMultiple)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Market Context & Analysis</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailBlock label="Market Bias" value={trade.marketBias} />
              <DetailBlock label="Higher Timeframe Bias" value={trade.higherTimeframeBias} />
              <DetailBlock label="Entry Reason" value={trade.entryReason} />
              <DetailBlock label="Exit Reason" value={trade.exitReason} />
              <DetailBlock label="Confirmation" value={trade.confirmation} />
              <DetailBlock label="Trade Management" value={trade.tradeManagement} />
              <DetailBlock label="Mistake Notes" value={trade.mistakeNotes} />
            </CardContent>
          </Card>

          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">Pre-Trade Thesis vs. Actual Outcome</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-1 rounded-lg border border-border bg-secondary/30 p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expected</div>
                <p className="text-sm leading-relaxed">{trade.preTradeThesis || "No thesis logged."}</p>
              </div>
              <div className="space-y-1 rounded-lg border border-border bg-secondary/30 p-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Actual</div>
                <p className="text-sm leading-relaxed">{trade.whatHappened || "No outcome logged."}</p>
              </div>
              <div className="md:col-span-2">
                <DetailBlock label="Lesson Learned" value={trade.lessonLearned} />
              </div>
            </CardContent>
          </Card>

          {trade.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{trade.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Psychology</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Before" value={trade.emotionBefore} />
              <DetailRow label="During" value={trade.emotionDuring} />
              <DetailRow label="After" value={trade.emotionAfter} />
              <DetailRow label="Confidence" value={trade.confidenceLevel ? `${trade.confidenceLevel}/10` : undefined} />
              <DetailRow label="Discipline" value={trade.disciplineScore ? `${trade.disciplineScore}/10` : undefined} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mistakes</CardTitle>
            </CardHeader>
            <CardContent>
              {trade.mistakes.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {trade.mistakes.map((m) => (
                    <Badge key={m} variant="secondary" className="font-normal">
                      {m}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No mistakes tagged on this trade.</p>
              )}
            </CardContent>
          </Card>

          {trade.screenshotUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chart Screenshot</CardTitle>
              </CardHeader>
              <CardContent>
                <a href={trade.screenshotUrl} target="_blank" rel="noreferrer">
                  <Image
                    src={trade.screenshotUrl}
                    alt="Trade screenshot"
                    width={480}
                    height={320}
                    className="w-full rounded-lg border border-border object-cover"
                    unoptimized
                  />
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
