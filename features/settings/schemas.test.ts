import { describe, expect, it } from "vitest";

import { buildUpdateSettingsSchema } from "@/features/settings/schemas";

/**
 * Settings update contract (Phase 12). Every field maps 1:1 to a `user_settings`
 * column; a single `invalid` message covers a value outside the allowed set
 * (reachable via direct POST to the Server Function).
 */
const schema = buildUpdateSettingsSchema({ invalid: "INVALID" });

const valid = {
  theme: "system",
  locale: "ar",
  reduced_motion: false,
  email_notifications: true,
};

describe("buildUpdateSettingsSchema", () => {
  it("accepts the allowed enum + boolean values", () => {
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({ ...valid, theme: "light", locale: "en" }).success).toBe(true);
    expect(schema.safeParse({ ...valid, theme: "dark" }).success).toBe(true);
  });

  it("rejects a theme or locale outside the allowed set", () => {
    expect(schema.safeParse({ ...valid, theme: "neon" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, locale: "fr" }).success).toBe(false);
  });

  it("rejects non-boolean toggles", () => {
    const result = schema.safeParse({ ...valid, reduced_motion: "yes" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((i) => i.message)).toContain("INVALID");
    }
  });
});
