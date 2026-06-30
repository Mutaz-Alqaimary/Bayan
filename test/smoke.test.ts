import { describe, expect, it } from "vitest";

/**
 * Harness smoke test — proves the runner, config, aliases, and setup load before
 * any real test depends on them. Intentionally trivial.
 */
describe("test harness", () => {
  it("runs", () => {
    expect(true).toBe(true);
  });
});
