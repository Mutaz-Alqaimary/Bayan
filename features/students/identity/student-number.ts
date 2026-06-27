import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `student_number` generation (Phase 12.5).
 *
 * `student_number` is `UNIQUE NOT NULL` in the locked schema with no DB sequence
 * (and none can be added), so numbers are generated app-side. They double as the
 * out-of-band **claim secret** for roster reconciliation, so they are
 * deliberately **high-entropy** (not sequential/guessable).
 */

/** Prefix that marks an app-generated number (school-issued ones may differ). */
const STUDENT_NUMBER_PREFIX = "BYN";

/** Base36 random segment length — ~41 bits of entropy, ample against guessing. */
const RANDOM_SEGMENT_LENGTH = 8;

/** Max attempts to find an unused number before giving up (collisions are rare). */
const MAX_ATTEMPTS = 5;

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 36 symbols
/** Largest multiple of 36 ≤ 256; bytes ≥ this are rejected to avoid modulo bias. */
const REJECT_THRESHOLD = 252; // 36 * 7

/**
 * One candidate number, e.g. `BYN-3F9KQ2ZP`. Cryptographically random with
 * **rejection sampling** (bytes ≥ 252 are discarded) so every base36 symbol is
 * equiprobable — no modulo bias, which matters because the number doubles as the
 * out-of-band claim secret.
 */
export function generateStudentNumber(): string {
  const chars: string[] = [];
  while (chars.length < RANDOM_SEGMENT_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(RANDOM_SEGMENT_LENGTH));
    for (const byte of bytes) {
      if (byte >= REJECT_THRESHOLD) continue;
      chars.push(ALPHABET[byte % 36]);
      if (chars.length === RANDOM_SEGMENT_LENGTH) break;
    }
  }
  return `${STUDENT_NUMBER_PREFIX}-${chars.join("")}`;
}

/**
 * Generate a `student_number` that is not already taken, checking against the
 * `students` table with a short retry loop (the UNIQUE constraint is the final
 * arbiter — this just avoids a near-certain-to-succeed insert failing on the
 * astronomically unlikely collision). Pass a service-role client.
 */
export async function generateUniqueStudentNumber(
  supabase: SupabaseClient,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = generateStudentNumber();
    const { data, error } = await supabase
      .from("students")
      .select("id")
      .eq("student_number", candidate)
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new Error(`Failed to check student number: ${error.message}`);
    }
    if (!data) {
      return candidate;
    }
  }
  throw new Error(
    "Could not generate a unique student number after several attempts.",
  );
}
