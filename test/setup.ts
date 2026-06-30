import "@testing-library/jest-dom/vitest";

import { expect } from "vitest";
import * as axeMatchers from "vitest-axe/matchers";

/**
 * Global test setup (runs per environment). Registers:
 * - `@testing-library/jest-dom` DOM matchers (`toBeInTheDocument`, `toHaveAttribute`, …).
 * - `vitest-axe` accessibility matcher (`toHaveNoViolations`) — the Phase 15 → 16
 *   automated-a11y handoff.
 *
 * Both `expect.extend` calls are harmless in the Node environment (the matchers
 * only touch the DOM when invoked, which only happens in jsdom component tests).
 */
expect.extend(axeMatchers);

// jsdom does not implement `matchMedia`; provide a minimal, inert stub so any
// component/provider that reads it during render does not throw. Guarded so the
// Node environment (no `window`) is untouched.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
