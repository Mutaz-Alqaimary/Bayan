/**
 * Pure SVG-geometry helpers + shared dimensions for the analytics chart kit
 * (Phase 13).
 *
 * Presentation math only (coordinate mapping) — no aggregation, no business
 * logic, no data fetching (spec §8a). Deterministic and framework-agnostic, so
 * the chart components stay thin renderers of an already-prepared series.
 *
 * **Multi-series ready:** the helpers are per-value and per-index, not bound to a
 * single series. A future `MultiLineTrend` computes `valueBounds` over the
 * *combined* values of all series, then maps each series with the same `xAt`/`yAt`
 * — no change to this geometry layer (each line just passes its own `color`).
 */

/** Internal SVG coordinate space. The container aspect MUST match the ratio. */
export const CHART_WIDTH = 320;
export const CHART_HEIGHT = 120;
export const CHART_PAD = 10;

/**
 * Container aspect — **must** equal `CHART_WIDTH / CHART_HEIGHT` (320 / 120 =
 * 8 / 3) so the `preserveAspectRatio="none"` SVG scales uniformly and circles /
 * bars stay true (no distortion). Update both together.
 */
export const CHART_ASPECT_CLASS = "aspect-[8/3]";

export type Bounds = { min: number; max: number };

/** Min/max of the values, padded so a flat series doesn't divide by zero. */
export function valueBounds(values: number[]): Bounds {
  if (values.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const pad = Math.abs(min) > 0 ? Math.abs(min) * 0.1 : 1;
    return { min: min - pad, max: max + pad };
  }
  return { min, max };
}

/**
 * Horizontal position of point `index` of `count`, within `width`. In RTL the
 * time axis runs right→left, so the oldest point sits on the right (DoD).
 */
export function xAt(
  index: number,
  count: number,
  width: number,
  rtl: boolean,
): number {
  if (count <= 1) return width / 2;
  const ratio = index / (count - 1);
  const x = ratio * width;
  return rtl ? width - x : x;
}

/** Vertical position of `value` within `[pad, height - pad]` (higher = up). */
export function yAt(
  value: number,
  bounds: Bounds,
  height: number,
  pad: number,
): number {
  const range = bounds.max - bounds.min || 1;
  const inner = height - pad * 2;
  return pad + (1 - (value - bounds.min) / range) * inner;
}
