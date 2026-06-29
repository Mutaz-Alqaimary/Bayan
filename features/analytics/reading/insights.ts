import "server-only";

import { average, AT_RISK_ACCURACY } from "@/features/dashboard/data/shared";
import type { AnalyticsInsightSeverity } from "@/features/analytics/types";
import type {
  ReadingInsight,
  ReadingInsightKind,
} from "@/features/analytics/reading/types";

/**
 * Reading-insights engine (Phase 13) — turns a student's in-range reading
 * metrics into plain, actionable insight *descriptors* (spec §5).
 *
 * **Pure and deterministic:** same inputs → same insights, in the same order
 * (spec §11). It reuses the canonical `average` / `AT_RISK_ACCURACY` from the
 * dashboard layer (single source of truth, spec §8) and emits structured `kind`
 * + `values`; the UI renders the localized sentence via next-intl (correct BiDi,
 * no concatenation). Each `kind` appears at most once, so `id = kind` is a stable
 * React key.
 */

/** Below this session count there isn't enough history to call a trend. */
const MIN_SESSIONS_FOR_TREND = 3;
/** WPM change (words/min) between the earlier and later half treated as real. */
const WPM_TREND_DELTA = 5;
/** Accuracy change (percentage points) treated as real. */
const ACCURACY_TREND_DELTA = 3;

/** In-range, already-resolved metrics for one student (oldest → newest). */
export type ReadingInsightInput = {
  /** Per-session WPM, nulls removed, oldest → newest. */
  wpmValues: number[];
  /** Per-session accuracy (0–100), nulls removed, oldest → newest. */
  accuracyValues: number[];
  /** Mean accuracy over the range, or `null` when none. */
  avgAccuracy: number | null;
  /** Completed sessions in range. */
  sessionsCount: number;
};

/** Averages of the earlier vs. later half of a series (for trend detection). */
function halfAverages(values: number[]): {
  earlier: number | null;
  later: number | null;
} {
  if (values.length < 2) return { earlier: null, later: null };
  const mid = Math.floor(values.length / 2);
  return {
    earlier: average(values.slice(0, mid)),
    later: average(values.slice(mid)),
  };
}

function insight(
  kind: ReadingInsightKind,
  severity: AnalyticsInsightSeverity,
  values: Record<string, number | string>,
): ReadingInsight {
  return { id: kind, kind, severity, values };
}

/**
 * Derive the reading insights for one student's in-range metrics. Returns an
 * ordered list (most decision-relevant first); empty input is handled upstream
 * (the per-student view shows an empty state, not this engine).
 */
export function deriveReadingInsights(
  input: ReadingInsightInput,
): ReadingInsight[] {
  const { wpmValues, accuracyValues, avgAccuracy, sessionsCount } = input;
  const insights: ReadingInsight[] = [];

  // Not enough history to talk about a trend — still surface a clearly low
  // accuracy, since that's actionable even from a couple of sessions.
  if (sessionsCount < MIN_SESSIONS_FOR_TREND) {
    insights.push(insight("needs_more_data", "neutral", { sessions: sessionsCount }));
    if (avgAccuracy !== null && avgAccuracy <= AT_RISK_ACCURACY) {
      insights.push(
        insight("accuracy_low", "attention", { accuracy: Math.round(avgAccuracy) }),
      );
    }
    return insights;
  }

  const wpm = halfAverages(wpmValues);
  if (wpm.earlier !== null && wpm.later !== null) {
    const delta = Math.round(wpm.later - wpm.earlier);
    if (delta >= WPM_TREND_DELTA) {
      insights.push(insight("wpm_improving", "positive", { delta }));
    } else if (delta <= -WPM_TREND_DELTA) {
      insights.push(insight("wpm_declining", "attention", { delta: Math.abs(delta) }));
    }
  }

  const accuracy = halfAverages(accuracyValues);
  if (accuracy.earlier !== null && accuracy.later !== null) {
    const delta = Math.round(accuracy.later - accuracy.earlier);
    if (delta >= ACCURACY_TREND_DELTA) {
      insights.push(insight("accuracy_improving", "positive", { delta }));
    } else if (delta <= -ACCURACY_TREND_DELTA) {
      insights.push(
        insight("accuracy_declining", "attention", { delta: Math.abs(delta) }),
      );
    }
  }

  if (avgAccuracy !== null && avgAccuracy <= AT_RISK_ACCURACY) {
    insights.push(
      insight("accuracy_low", "attention", { accuracy: Math.round(avgAccuracy) }),
    );
  }

  // Nothing notable surfaced — affirm steady progress rather than show nothing.
  if (insights.length === 0) {
    insights.push(insight("steady_progress", "positive", { sessions: sessionsCount }));
  }

  return insights;
}
