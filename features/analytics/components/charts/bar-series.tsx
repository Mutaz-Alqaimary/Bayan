import type { AnalyticsTrendSeries } from "@/features/analytics/types";

import { ChartFrame, type ChartLabels } from "./chart-frame";
import {
  CHART_ASPECT_CLASS,
  CHART_HEIGHT,
  CHART_PAD,
  CHART_WIDTH,
} from "./scale";

/** Fractions of the plot height at which to draw faint guide lines. */
const GRID_LINES = [0.25, 0.5, 0.75];
/** Share of each slot the bar fills (the rest is gutter). */
const BAR_FILL = 0.6;

/**
 * A bar chart of a prepared trend series (e.g. sessions per period). Activity
 * counts use `0` for empty buckets (a measured zero), so bars render flat rather
 * than as gaps. Presentation-only and RTL-aware (bars run right→left in Arabic).
 */
export function BarSeries({
  series,
  dir,
  formatValue,
  labels,
  title,
  description,
  color = "var(--chart-1)",
}: {
  series: AnalyticsTrendSeries;
  dir: "rtl" | "ltr";
  formatValue: (value: number) => string;
  labels: ChartLabels;
  title?: string;
  description?: string;
  /** Bar fill; defaults to `--chart-1`. */
  color?: string;
}) {
  const { points } = series;
  const rtl = dir === "rtl";
  const count = points.length;
  const max = Math.max(...points.map((point) => point.value ?? 0), 1);
  const slot = count > 0 ? CHART_WIDTH / count : CHART_WIDTH;
  const barWidth = slot * BAR_FILL;
  const innerHeight = CHART_HEIGHT - CHART_PAD * 2;

  return (
    <ChartFrame
      points={points}
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      aspectClassName={CHART_ASPECT_CLASS}
      formatValue={formatValue}
      labels={labels}
      title={title}
      description={description}
    >
      {GRID_LINES.map((fraction) => (
        <line
          key={fraction}
          x1={0}
          x2={CHART_WIDTH}
          y1={CHART_HEIGHT * fraction}
          y2={CHART_HEIGHT * fraction}
          stroke="var(--chart-grid)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <line
        x1={0}
        x2={CHART_WIDTH}
        y1={CHART_HEIGHT - CHART_PAD}
        y2={CHART_HEIGHT - CHART_PAD}
        stroke="var(--chart-axis)"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {points.map((point, index) => {
        const value = point.value ?? 0;
        const barHeight = (value / max) * innerHeight;
        const slotIndex = rtl ? count - 1 - index : index;
        const x = slotIndex * slot + (slot - barWidth) / 2;
        const y = CHART_HEIGHT - CHART_PAD - barHeight;
        return (
          <rect
            key={point.bucketId}
            x={x}
            y={y}
            width={barWidth}
            height={Math.max(barHeight, 0)}
            rx={1}
            fill={color}
          />
        );
      })}
    </ChartFrame>
  );
}
