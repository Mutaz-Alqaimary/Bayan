import { axe } from "vitest-axe";

/**
 * Axe options for **component-fragment** a11y smoke tests (Phase 15 → 16
 * handoff). Two rules can't run meaningfully on an isolated fragment in jsdom and
 * are disabled:
 *  - `region` — fragments aren't inside a page landmark by design;
 *  - `color-contrast` — jsdom computes no layout/colors (and has no canvas), so
 *    contrast is verified manually/visually in Phase 15, not here.
 */
export const AXE_FRAGMENT_OPTIONS = {
  rules: {
    region: { enabled: false },
    "color-contrast": { enabled: false },
  },
} as const;

export { axe };
