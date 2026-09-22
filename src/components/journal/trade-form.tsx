"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MistakePicker } from "@/components/journal/mistake-picker";
import {
  tradeFormSchema,
  emptyTradeForm,
  type TradeFormValues,
} from "@/lib/schemas/trade";
import { createTrade, updateTrade } from "@/lib/actions/trades";
import { computeTradeDerivedFields } from "@/lib/trade-calc";
import { formatCurrency, formatR, pnlClass } from "@/lib/format";
import {
  DEFAULT_SETUPS,
  DEFAULT_SYMBOLS,
  EMOTIONS,
  MARKET_BIAS,
  SIDES,
} from "@/lib/constants";
import type { Account } from "@/generated/prisma/client";

function FieldInput({
  control,
  name,
  label,
  type = "text",
  placeholder,
  step,
}: {
  control: ReturnType<typeof useForm<TradeFormValues>>["control"];
  name: keyof TradeFormValues;
  label: string;
  type?: string;
  placeholder?: string;
  step?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              step={step}
              placeholder={placeholder}
              {...field}
              value={(field.value as string | number | undefined) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function FieldTextarea({
  control,
  name,
  label,
  placeholder,
}: {
  control: ReturnType<typeof useForm<TradeFormValues>>["control"];
  name: keyof TradeFormValues;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={2}
              {...field}
              value={(field.value as string | undefined) ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function TradeForm({
  accounts,
  defaultAccountId,
  initialValues,
  tradeId,
  title,
  description,
  availableMistakes,
}: {
  accounts: Account[];
  defaultAccountId?: string;
  initialValues?: TradeFormValues;
  tradeId?: string;
  title?: string;
  description?: string;
  availableMistakes?: string[];
}) {
  const router = useRouter();
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: initialValues ?? { ...emptyTradeForm, accountId: defaultAccountId ?? accounts[0]?.id ?? "" },
  });

  const values = form.watch();
  const selectedAccount = accounts.find((a) => a.id === values.accountId);

  const preview = useMemo(() => {
    const entryPrice = Number(values.entryPrice);
    const quantity = Number(values.quantity);
    if (!Number.isFinite(entryPrice) || !Number.isFinite(quantity) || entryPrice <= 0 || quantity <= 0) {
      return null;
    }
    return computeTradeDerivedFields({
      side: values.side ?? "LONG",
      entryPrice,
      stopLoss: values.stopLoss ? Number(values.stopLoss) : null,
      takeProfit: values.takeProfit ? Number(values.takeProfit) : null,
      exitPrice: values.exitPrice ? Number(values.exitPrice) : null,
      quantity,
      brokerageCharges: values.brokerageCharges ? Number(values.brokerageCharges) : 0,
      entryTime: values.entryTime || null,
      accountBalanceAtEntry: selectedAccount?.startingBalance ?? null,
    });
  }, [values, selectedAccount]);

  async function onSubmit(data: TradeFormValues) {
    try {
      if (tradeId) {
        await updateTrade(tradeId, data);
        toast.success("Trade updated");
        router.push(`/journal/${tradeId}`);
      } else {
        const id = await createTrade(data);
        toast.success("Trade logged");
        router.push(`/journal/${id}`);
      }
      router.refresh();
    } catch {
      toast.error("Could not save trade. Check the form for errors.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="sticky top-16 z-20 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 shadow-xs">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {title ?? (tradeId ? "Edit Trade" : "Log a Trade")}
            </h1>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {tradeId ? "Save Changes" : "Log Trade"}
            </Button>
          </div>
        </div>

        {/* Trade information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trade Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FieldInput control={form.control} name="date" label="Date" type="date" />
            <FieldInput control={form.control} name="entryTime" label="Entry Time" type="time" />
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input list="symbol-options" placeholder="BTCUSD" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <datalist id="symbol-options">
                    {DEFAULT_SYMBOLS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="side"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Long / Short</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SIDES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="setup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setup</FormLabel>
                  <FormControl>
                    <Input list="setup-options" placeholder="Breakout" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <datalist id="setup-options">
                    {DEFAULT_SETUPS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FieldInput control={form.control} name="entryPrice" label="Entry Price" type="number" step="any" />
            <FieldInput control={form.control} name="stopLoss" label="Stop Loss" type="number" step="any" />
            <FieldInput control={form.control} name="takeProfit" label="Take Profit" type="number" step="any" />
            <FieldInput control={form.control} name="exitPrice" label="Exit Price" type="number" step="any" />
            <FieldInput control={form.control} name="quantity" label="Quantity / Lot Size" type="number" step="any" />
            <FieldInput control={form.control} name="closingDate" label="Closing Date" type="date" />
            <FieldInput control={form.control} name="closingTime" label="Closing Time" type="time" />
            <FieldInput control={form.control} name="brokerageCharges" label="Brokerage Charges" type="number" step="any" />
          </CardContent>
        </Card>

        {/* Live calculation preview */}
        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardHeader>
            <CardTitle className="text-base">Automatic Calculations</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <PreviewStat label="P&L" value={preview ? formatCurrency(preview.pnl) : "—"} tone={preview?.pnl} />
            <PreviewStat label="Net P&L" value={preview ? formatCurrency(preview.netPnl) : "—"} tone={preview?.netPnl} />
            <PreviewStat label="Result" value={preview?.result ?? "—"} />
            <PreviewStat label="Planned R:R" value={preview?.plannedRR ? `${preview.plannedRR.toFixed(2)}R` : "—"} />
            <PreviewStat label="R-Multiple" value={formatR(preview?.rMultiple ?? null)} tone={preview?.rMultiple ?? undefined} />
            <PreviewStat label="Risk %" value={preview?.riskPercent ? `${preview.riskPercent.toFixed(2)}%` : "—"} />
          </CardContent>
        </Card>

        {/* Trade analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trade Analysis</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="marketBias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Bias</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select bias" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MARKET_BIAS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="higherTimeframeBias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Higher Timeframe Bias</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select bias" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MARKET_BIAS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FieldTextarea control={form.control} name="entryReason" label="Entry Reason" />
            <FieldTextarea control={form.control} name="exitReason" label="Exit Reason" />
            <FieldTextarea control={form.control} name="confirmation" label="Confirmation" />
            <FieldTextarea control={form.control} name="tradeManagement" label="Trade Management" />
            <FieldTextarea control={form.control} name="mistakeNotes" label="Mistake Notes" />
          </CardContent>
        </Card>

        {/* Psychology */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Psychology</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="emotionBefore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emotion Before Trade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select emotion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMOTIONS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emotionDuring"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emotion During Trade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select emotion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMOTIONS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emotionAfter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emotion After Trade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select emotion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMOTIONS.map((e) => (
                        <SelectItem key={e} value={e}>
                          {e}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confidenceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confidence Level ({field.value || 5}/10)</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[Number(field.value) || 5]}
                      onValueChange={(v) => field.onChange(v[0])}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="disciplineScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discipline Score ({field.value || 5}/10)</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[Number(field.value) || 5]}
                      onValueChange={(v) => field.onChange(v[0])}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mistakes"
              render={({ field }) => (
                <FormItem className="md:col-span-3">
                  <FormLabel>Mistakes</FormLabel>
                  <FormControl>
                    <MistakePicker
                      value={field.value ?? []}
                      onChange={field.onChange}
                      availableMistakes={availableMistakes}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Journal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Journal</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FieldTextarea control={form.control} name="preTradeThesis" label="Pre-Trade Thesis" />
            <FieldTextarea control={form.control} name="whatHappened" label="What Happened?" />
            <FieldTextarea control={form.control} name="lessonLearned" label="Lesson Learned" />
            <FieldInput control={form.control} name="screenshotUrl" label="Screenshot / Chart Image URL" placeholder="https://..." />
            <div className="md:col-span-2">
              <FieldTextarea control={form.control} name="notes" label="Additional Notes" />
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}

function PreviewStat({ label, value, tone }: { label: string; value: string; tone?: number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-semibold tabular-nums ${tone !== undefined ? pnlClass(tone) : ""}`}>{value}</div>
    </div>
  );
}
