/**
 * Shared, chart-facing view-model building blocks for Reading Analytics
 * (Phase 13). Generic across analytics domains (reading now, vocabulary later)
 * so the chart kit and aggregation helpers stay domain-agnostic.
 *
 * These are *resolved, serializable* shapes (numbers + ISO strings) the UI
 * renders directly — never raw DB rows (spec §8a "stable view models"). Numeric
 * values stay raw so components format them (Western numerals via
 * `lib/format.ts`); `null` means "not enough data to compute", and the UI
 * degrades gracefully rather than showing a misleading 0.
 *
 * Pure type declarations — no runtime, no imports. Composite domain view models
 * (e.g. `CohortReadingAnalytics`) live in `reading/types.ts`.
 */

/**
 * Direction of change between two measurements. `neutral` covers a zero or
 * negligibly-small change (within the data layer's deadband) — a near-flat trend
 * is never forced into a misleading `up`/`down` (refinement: TrendDirection).
 */
export type TrendDirection = "up" | "down" | "neutral";

/**
 * A KPI's value plus its change vs. the comparison period (the immediately
 * preceding equal-length window — see `resolveComparisonWindow`). `comparable`
 * is `false` when no comparison exists (range `all`, or no prior data), so the
 * UI shows the value **without** a misleading delta (spec §11a.1).
 */
export type TrendIndicator = {
  current: number | null;
  /**
   * The comparison-period value. **`null` means "not enough historical data"**
   * (no comparison window, or no sessions in it) — never collapsed to `0`, which
   * would be an actual measured value (refinement: Comparison Window).
   */
  previous: number | null;
  /** `current - previous`, or `null` when not comparable (never `0`-for-missing). */
  delta: number | null;
  /** Percentage change vs. `previous`, or `null` when not comparable / `previous` is 0. */
  deltaPercent: number | null;
  direction: TrendDirection;
  comparable: boolean;
};

/**
 * The at-a-glance figures shown beside a chart so it is readable **without
 * hover** (spec §11a.2). Part of the chart's accessible fallback alongside the
 * `aria-hidden` SVG.
 */
export type ChartSummary = {
  current: number | null;
  previous: number | null;
  change: number | null;
  changePercent: number | null;
  highest: number | null;
  lowest: number | null;
  direction: TrendDirection;
  /**
   * How representative the series is — `sampleCount` = buckets with data,
   * `periodCount` = total buckets. Optional and not surfaced in the UI today;
   * reserved so a future view can convey statistical confidence without a model
   * change.
   */
  sampleCount?: number;
  periodCount?: number;
};

/** One point of a trend series (e.g. an average for a day/week/month bucket). */
export type AnalyticsTrendPoint = {
  /**
   * Stable, granularity-encoded bucket identifier (e.g. `2026-06-29`, `2026-W26`,
   * `2026-06`) — the chart's React key and the data layer's bucket key. Keeps
   * presentation independent of the time-bucket implementation and the display
   * `label` (refinement: AnalyticsTrendPoint).
   */
  bucketId: string;
  /** ISO timestamp of the bucket start (serializable — never a `Date`). */
  date: string;
  /** Short, pre-localized axis label for the bucket (formatting is the data layer's job). */
  label: string;
  /** The bucket's value, or `null` when the bucket has no sessions. */
  value: number | null;
};

/** A chart-ready trend: its points plus the no-hover summary. */
export type AnalyticsTrendSeries = {
  points: AnalyticsTrendPoint[];
  summary: ChartSummary;
};

/**
 * Whether a view has data to show, distinguishing "never any data" from "none in
 * the selected range" so the UI can guide the user to widen the range rather
 * than imply there is no history (spec §11a.4).
 */
export type AnalyticsAvailability = "ready" | "empty_all" | "empty_range";

/** Severity tone for an insight, driving its visual treatment. */
export type AnalyticsInsightSeverity = "positive" | "neutral" | "attention";

/**
 * A structured, localizable insight descriptor. The engine emits the `kind` +
 * interpolation `values`; the UI renders the localized sentence via next-intl
 * (correct BiDi, no string concatenation). Domain modules narrow `kind` (e.g.
 * `ReadingInsightKind`) (spec §5).
 */
export type AnalyticsInsight = {
  /** Stable id for React keys / dedup — deterministic across identical inputs. */
  id: string;
  kind: string;
  severity: AnalyticsInsightSeverity;
  /** Interpolation values for the localized template (already-resolved numbers/strings). */
  values: Record<string, number | string>;
};

/* ───────────────────────── Reserved future contracts ─────────────────────────
 * Strongly-typed names for analytics sections implemented in LATER phases
 * (spec §14 Future Expansion). They communicate the intended contracts now —
 * deliberately **not** `any`/`unknown` — so the Student Analytics view model can
 * gain these optional sections additively, without redesign.
 *
 * NOTHING here is built, queried, or rendered in Phase 13. These are type
 * contracts only (no runtime, no stubs). Each section is keyed on
 * `AnalyticsAvailability` (so it carries the same two-empty-state distinction)
 * and reuses the shared kit; the exact body is finalized in its own phase — the
 * shapes below are the reserved minimum and may be extended there.
 */

/** Reserved: per-student vocabulary analytics (Vocabulary Analytics phase, §4). */
export type VocabularyAnalyticsSection = {
  availability: AnalyticsAvailability;
  /** Vocabulary growth over time (reuses the shared chart-series contract). */
  growth: AnalyticsTrendSeries;
  insights: AnalyticsInsight[];
};

/** Reserved: AI-generated reading insights (AI Insights phase). */
export type AiInsightsSection = {
  availability: AnalyticsAvailability;
  /** Composed from the same structured insight descriptors (presentation only). */
  insights: AnalyticsInsight[];
};

/** Reserved: assignment / classroom analytics (future teacher workflow). */
export type AssignmentsAnalyticsSection = {
  availability: AnalyticsAvailability;
  /** Assignment-completion trend over time (reuses the shared chart-series contract). */
  completion: AnalyticsTrendSeries;
};
