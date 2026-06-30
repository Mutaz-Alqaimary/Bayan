import { describe, expect, it } from "vitest";

import arMessages from "@/messages/ar.json";
import enMessages from "@/messages/en.json";

/**
 * Catalog integrity (Phase 16 Localization). The single highest-ROI i18n test:
 * the moment a future phase adds an English string without its Arabic
 * counterpart (or vice versa), this fails. It checks:
 *  - identical leaf key-sets across `en` and `ar`;
 *  - no empty strings;
 *  - identical interpolation **argument names** per key.
 *
 * It deliberately does NOT require identical ICU plural *arms*: Arabic has more
 * plural categories (`two`/`few`/`many`) than English, so requiring matching arms
 * would be wrong. Argument-name parity is the meaningful contract.
 */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Collect every leaf key path (dot-joined) → string value. */
function leaves(obj: Json, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      for (const [k, v] of leaves(value, path)) out.set(k, v);
    }
  } else if (typeof obj === "string") {
    out.set(prefix, obj);
  }
  return out;
}

/** ICU interpolation argument names referenced by a message (e.g. `{count}`). */
function argNames(message: string): Set<string> {
  const names = new Set<string>();
  // Match the identifier immediately after `{` (covers `{name}` and
  // `{name, plural, …}` / `{name, select, …}` argument declarations).
  const re = /\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=[,}])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(message)) !== null) names.add(match[1]);
  return names;
}

const en = leaves(enMessages as Json);
const ar = leaves(arMessages as Json);

describe("message catalog parity (en ↔ ar)", () => {
  it("has the same leaf keys in both locales", () => {
    const missingInAr = [...en.keys()].filter((k) => !ar.has(k));
    const missingInEn = [...ar.keys()].filter((k) => !en.has(k));
    expect(missingInAr, "keys present in en but missing in ar").toEqual([]);
    expect(missingInEn, "keys present in ar but missing in en").toEqual([]);
  });

  it("has no empty string values", () => {
    const emptyEn = [...en.entries()].filter(([, v]) => v.trim() === "").map(([k]) => k);
    const emptyAr = [...ar.entries()].filter(([, v]) => v.trim() === "").map(([k]) => k);
    expect(emptyEn, "empty en values").toEqual([]);
    expect(emptyAr, "empty ar values").toEqual([]);
  });

  it("uses the same interpolation argument names per key", () => {
    const mismatches: string[] = [];
    for (const [key, enValue] of en) {
      const arValue = ar.get(key);
      if (arValue === undefined) continue; // key-set covered above
      const enArgs = [...argNames(enValue)].sort();
      const arArgs = [...argNames(arValue)].sort();
      if (enArgs.join(",") !== arArgs.join(",")) {
        mismatches.push(`${key}: en[${enArgs}] vs ar[${arArgs}]`);
      }
    }
    expect(mismatches).toEqual([]);
  });
});
