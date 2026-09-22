"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";

export interface PnlBarDatum {
  label: string;
  value: number;
}

export function PnlBarChart({ data, height = 220 }: { data: PnlBarDatum[]; height?: number }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No data in this range yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tickFormatter={(v: number) => formatCurrency(v, true)}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--accent)" }} />
        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.value >= 0 ? "var(--chart-2)" : "var(--chart-5)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PnlBarDatum }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <div className="font-medium text-popover-foreground">{d.label}</div>
      <div className={d.value >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}>{formatSignedCurrency(d.value)}</div>
    </div>
  );
}
