import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pnlClass } from "@/lib/format";

export interface Stat {
  label: string;
  value: string;
  tone?: number;
}

export function StatGroupCard({ title, stats }: { title: string; stats: Stat[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
            <div className={`mt-0.5 text-sm font-semibold tabular-nums ${s.tone !== undefined ? pnlClass(s.tone) : ""}`}>
              {s.value}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
