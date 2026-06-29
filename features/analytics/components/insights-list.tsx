import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import type { AnalyticsInsightSeverity } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

/** One already-localized insight ready to render. */
export type InsightItem = {
  id: string;
  text: string;
  severity: AnalyticsInsightSeverity;
};

/**
 * Renders the reading insights as a plain-language list with a severity cue
 * (spec §5). Presentation-only: the parent resolves each `kind` + values into a
 * localized `text` via next-intl before passing it in.
 */
export function InsightsList({
  items,
  emptyText,
}: {
  items: InsightItem[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const Icon =
          item.severity === "attention"
            ? AlertTriangle
            : item.severity === "positive"
              ? CheckCircle2
              : Info;
        const tone =
          item.severity === "attention"
            ? "text-destructive"
            : item.severity === "positive"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground";
        return (
          <li key={item.id} className="flex items-start gap-2.5 text-sm">
            <Icon
              className={cn("mt-0.5 size-4 shrink-0", tone)}
              aria-hidden="true"
            />
            <span className="leading-relaxed text-foreground">{item.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
