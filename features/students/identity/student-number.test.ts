import { describe, expect, it } from "vitest";

import { generateStudentNumber } from "@/features/students/identity/student-number";

/**
 * `student_number` doubles as the out-of-band claim secret, so its *format* and
 * charset are the contract. Statistical entropy/distribution is deliberately not
 * asserted (flaky), and `generateUniqueStudentNumber` (a DB retry loop) is out of
 * scope — its behavior is exercised live in Phase 19.
 */
describe("generateStudentNumber", () => {
  it("matches the BYN-<8 base36 chars> format", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateStudentNumber()).toMatch(/^BYN-[0-9A-Z]{8}$/);
    }
  });

  it("produces different values across calls (not sequential/constant)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i += 1) seen.add(generateStudentNumber());
    // Collisions are astronomically unlikely; allow a tiny margin, but they must
    // not all be identical.
    expect(seen.size).toBeGreaterThan(95);
  });
});
