import type { AnalyticsTrendSeries } from "@/features/analytics/types";

import { ChartFrame, type ChartLabels } from "./chart-frame";
import {
  CHART_ASPECT_CLASS,
  CHART_HEIGHT,
  CHART_PAD,
  CHART_WIDTH,
  valueBounds,
  xAt,
  yAt,
} from "./scale";

/** Fractions of the plot height at which to draw faint guide lines. */
const GRID_LINES = [0.25, 0.5, 0.75];

type Coord = { x: number; y: number };

/**
 * A line chart of a prepared trend series (WPM / accuracy / duration over time).
 * Presentation-only: it renders the supplied points (gaps for `null` buckets,
 * RTL-aware x-axis) plus the accessible data table via `ChartFrame`. All values,
 * labels, and bucketing arrive pre-computed from the analytics data layer.
 */
export function LineTrend({
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
  /** Series stroke; defaults to `--chart-1`. A future `MultiLineTrend` passes
   *  `--chart-2` etc. to overlay series on this same geometry layer. */
  color?: string;
}) {
  const { points } = series;
  const rtl = dir === "rtl";
  const values = points
    .map((point) => point.value)
    .filter((value): value is number => value !== null);
  const bounds = valueBounds(values);
  const count = points.length;

  const coords: (Coord | null)[] = points.map((point, index) =>
    point.value === null
      ? null
      : {
          x: xAt(index, count, CHART_WIDTH, rtl),
          y: yAt(point.value, bounds, CHART_HEIGHT, CHART_PAD),
        },
  );

  // Split into runs of consecutive non-null points so missing buckets show as a
  // gap rather than a bridged line.
  const segments: Coord[][] = [];
  let run: Coord[] = [];
  for (const coord of coords) {
    if (coord) {
      run.push(coord);
    } else if (run.length > 0) {
      segments.push(run);
      run = [];
    }
  }
  if (run.length > 0) segments.push(run);

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
      {segments.map((segment, index) => (
        <polyline
          key={index}
          points={segment.map((coord) => `${coord.x},${coord.y}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {points.map((point, index) => {
        const coord = coords[index];
        return coord ? (
          <circle key={point.bucketId} cx={coord.x} cy={coord.y} r={3} fill={color} />
        ) : null;
      })}
    </ChartFrame>
  );
}
