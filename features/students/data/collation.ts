/**
 * Arabic-aware collation/search for the students roster.
 *
 * The implementation now lives in the shared `lib/collation.ts` (Phase 8 also
 * needs it for the reading-content tables). Re-exported here so the students
 * feature keeps a stable, feature-local import path.
 */
export { makeNameCollator, normalizeForSearch } from "@/lib/collation";
