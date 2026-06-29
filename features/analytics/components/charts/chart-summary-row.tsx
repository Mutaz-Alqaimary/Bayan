import type { ChartSummary } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

/** Localized labels for the chart summary cells. */
export type ChartSummaryLabels = {
  current: string;
  previous: string;
  change: string;
  highest: string;
  lowest: string;
};

/**
 * The at-a-glance figures shown beside a chart so it reads **without hover**
 * (spec §11a.2): current, previous, change (with direction), highest, lowest.
 * Presentation-only — it formats the already-computed `ChartSummary` via the
 * injected `formatValue` and localized `labels`; no business logic.
 *
 * `change`'s colour reflects increase/decrease only; the metric's good/bad
 * meaning is the consumer's to frame (the kit stays domain-agnostic).
 */
export function ChartSummaryRow({
  summary,
  formatValue,
  labels,
}: {
  summary: ChartSummary;
  formatValue: (value: number) => string;
  labels: ChartSummaryLabels;
}) {
  const format = (value: number | null) =>
    value === null ? "—" : formatValue(value);

  const changeText =
    summary.change === null
      ? "—"
      : `${summary.change > 0 ? "+" : summary.change < 0 ? "−" : ""}${formatValue(
          Math.abs(summary.change),
        )}`;

  const changeTone =
    summary.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : summary.direction === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
      <SummaryCell label={labels.current} value={format(summary.current)} />
      <SummaryCell label={labels.previous} value={format(summary.previous)} />
      <SummaryCell label={labels.change} value={changeText} tone={changeTone} />
      <SummaryCell label={labels.highest} value={format(summary.highest)} />
      <SummaryCell label={labels.lowest} value={format(summary.lowest)} />
    </dl>
  );
}

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-sm font-semibold tabular-nums text-foreground",
          tone,
        )}
      >
        {value}
      </dd>
    </div>
  );
}
