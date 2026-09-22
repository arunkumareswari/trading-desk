import { Lightbulb } from "lucide-react";

export function InsightsPanel({ insights }: { insights: string[] }) {
  return (
    <ul className="space-y-3">
      {insights.map((insight, i) => (
        <li key={i} className="flex gap-2.5 text-sm">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-muted-foreground">{insight}</span>
        </li>
      ))}
    </ul>
  );
}
