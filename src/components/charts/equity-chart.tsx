"use client";

import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatSignedCurrency, pnlClass } from "@/lib/format";
import type { EquityPoint } from "@/lib/metrics";

export function EquityChart({
  data,
  startingBalance,
}: {
  data: EquityPoint[];
  startingBalance: number;
}) {
  if (!data.length) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
        No closed trades in this range yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => format(new Date(d), "MMM d")}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={32}
        />
        <YAxis
          tickFormatter={(v: number) => formatCurrency(v, true)}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={64}
          domain={["auto", "auto"]}
        />
        <ReferenceLine
          y={startingBalance}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          label={{
            value: "Starting balance",
            position: "insideTopLeft",
            fontSize: 11,
            fill: "var(--muted-foreground)",
          }}
        />
        <Tooltip content={<EquityTooltip />} />
        <Area
          type="monotone"
          dataKey="balance"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#balanceFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function EquityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: EquityPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-xs shadow-lg">
      <div className="font-medium text-popover-foreground">{format(new Date(p.date), "MMM d, yyyy")}</div>
      <div className="mt-1.5 space-y-1">
        <div className="flex justify-between gap-6 text-muted-foreground">
          <span>Balance</span>
          <span className="font-medium text-foreground">{formatCurrency(p.balance)}</span>
        </div>
        <div className="flex justify-between gap-6 text-muted-foreground">
          <span>Equity</span>
          <span className="font-medium text-foreground">{formatCurrency(p.equity)}</span>
        </div>
        <div className="flex justify-between gap-6 text-muted-foreground">
          <span>Daily P&L</span>
          <span className={`font-medium ${pnlClass(p.dailyPnl)}`}>{formatSignedCurrency(p.dailyPnl)}</span>
        </div>
      </div>
    </div>
  );
}
