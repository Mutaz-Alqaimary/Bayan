import { describe, expect, it } from "vitest";

import {
  AVATAR_MAX_BYTES,
  avatarObjectPath,
  validateWebpUpload,
} from "@/lib/avatar";

/**
 * The two invariant-bearing avatar helpers: the object-path-not-URL contract
 * (`profiles.avatar_url` stores `avatars/{user_id}/avatar.webp`) and the
 * server-side upload guard. The trivial wrappers and the URL builder (env-bound
 * string concat) are not worth standalone tests.
 */
describe("avatarObjectPath", () => {
  it("is the bucket-qualified, stable object path (not a URL)", () => {
    const userId = "11111111-2222-3333-4444-555555555555";
    expect(avatarObjectPath(userId)).toBe(`avatars/${userId}/avatar.webp`);
  });

  it("uses the same stable filename per user (replace = overwrite)", () => {
    expect(avatarObjectPath("a")).toBe(avatarObjectPath("a"));
  });
});

describe("validateWebpUpload", () => {
  it("accepts a webp within the size cap", () => {
    expect(validateWebpUpload({ type: "image/webp", size: 1000 })).toBeNull();
  });

  it("rejects a non-webp type (client must have converted)", () => {
    expect(validateWebpUpload({ type: "image/png", size: 1000 })).toBe("type");
    expect(validateWebpUpload({ type: "image/jpeg", size: 1000 })).toBe("type");
  });

  it("rejects a file over the size cap", () => {
    expect(
      validateWebpUpload({ type: "image/webp", size: AVATAR_MAX_BYTES + 1 }),
    ).toBe("size");
  });

  it("checks type before size", () => {
    // A too-large non-webp reports the type problem first.
    expect(
      validateWebpUpload({ type: "image/png", size: AVATAR_MAX_BYTES + 1 }),
    ).toBe("type");
  });
});
