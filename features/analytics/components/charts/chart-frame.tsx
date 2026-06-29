import type { ReactNode } from "react";

import type { AnalyticsTrendPoint } from "@/features/analytics/types";
import { cn } from "@/lib/utils";

/** Localized strings for a chart's accessible data table. */
export type ChartLabels = {
  caption: string;
  period: string;
  value: string;
};

/**
 * Shared scaffold for the analytics chart kit: a fixed-aspect SVG plot (the
 * `aria-hidden` visual, supplied as `children`) paired with a visually-hidden
 * data table — the accessible fallback so the trend is never screen-reader
 * invisible (extends the Sparkline pattern; spec §12).
 *
 * Presentation-only (spec §8a): it renders the supplied points and formats their
 * values via the injected `formatValue`; it performs no aggregation and is given
 * no notion of time-bucket granularity — only the prepared `label` per point.
 */
export function ChartFrame({
  points,
  width,
  height,
  aspectClassName,
  formatValue,
  labels,
  title,
  description,
  children,
}: {
  points: AnalyticsTrendPoint[];
  width: number;
  height: number;
  aspectClassName: string;
  formatValue: (value: number) => string;
  labels: ChartLabels;
  /** Optional accessible name/description for the figure (sr-only today; leaves
   *  room for a future visible `<figcaption>`). */
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <figure className="m-0">
      {title || description ? (
        <figcaption className="sr-only">
          {title}
          {title && description ? " — " : null}
          {description}
        </figcaption>
      ) : null}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={cn("w-full", aspectClassName)}
        role="presentation"
        aria-hidden="true"
      >
        {children}
      </svg>
      <table className="sr-only">
        <caption>{labels.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{labels.period}</th>
            <th scope="col">{labels.value}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.bucketId}>
              <th scope="row">{point.label}</th>
              <td>{point.value === null ? "—" : formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
