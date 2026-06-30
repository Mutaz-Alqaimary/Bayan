---
description: Exact, fixed names for types, stores, and Supabase clients across Bayan. Never invent alternatives.
---

# Naming Conventions

These names are fixed across the whole codebase. Reuse them exactly — don't paraphrase, don't
add suffixes, don't rename "for clarity."

## Database record types

```
ProfileRecord
StudentRecord
ReadingPassageRecord
ReadingSessionRecord
VocabularyTermRecord
```

## Form value types

```
LoginFormValues
RegisterFormValues
ForgotPasswordFormValues
ResetPasswordFormValues
CreateStudentFormValues
UpdateStudentFormValues
```

Follow this `<Verb><Entity>FormValues` pattern for any additional forms introduced in later
phases (e.g. `CreatePassageFormValues`, `UpdateVocabularyTermFormValues`).

## Zustand stores

```
useAuthStore
useStudentStore
useSettingsStore
useReadingStore
```

## Supabase clients

```
supabaseClient        // browser/client-side
supabaseServerClient   // server-side
supabaseAdminClient    // server-only, service-role (bypasses RLS) — added Phase 5
```

## Localized message helpers

Client/server-paired accessors for shared, cross-feature copy (validation, generic error
states) — same `client.ts`/`server.ts` split as the Supabase clients above.

```
useValidationMessages  // client — lib/validation/client.ts
getValidationMessages  // server — lib/validation/server.ts
ValidationMessages     // shared type — lib/validation/types.ts

useErrorMessages        // client — lib/errors/client.ts
getErrorMessages        // server — lib/errors/server.ts
ErrorMessages            // shared type — lib/errors/types.ts
```

## Student import/export (Phase 9)

The CSV/XLSX bulk-import & export pipeline lives in `features/students/import-export/`. Names:

```
StudentImportRow         // one parsed row's editable values (alias of CreateStudentFormValues)
RawStudentImportRow      // a parsed row + its 1-based source row number
StudentImportRowOutcome  // a row's create/update/skip/reject classification
StudentImportPreview     // the full classification the preview renders
StudentImportCounts      // bucket totals for the preview summary
StudentImportMessages    // localized classifier copy (use-/get- helpers below)
StudentImportCommitResult // discriminated commit Server Action result

classifyStudentImport      // pure shared classifier — classify.ts
parseStudentImportFile     // SheetJS read → rows (client) — parse.ts
exportStudents             // roster → CSV/XLSX download (client) — export.ts
downloadStudentTemplate    // template download (client) — template.ts
commitStudentImportAction  // server: re-validate + atomic upsert — actions.ts

useStudentImportMessages   // client — import-export/use-student-import-messages.ts
getImportMessages          // server — import-export/actions.ts (local)
```

## Reading fluency / sessions (Phase 10)

The student reading-session workflow & history lives in `features/reading/sessions/`. Names:

```
ReadingSessionRecord            // a row of reading_sessions (locked schema)
ReadablePassage                 // a passage + precomputed Arabic word_count (student reader)
ReadingSessionView              // a completed session resolved for the history list
ReadingHistory                  // history list + progress summary
ReadingSessionsData             // discriminated page data ({ linked:false } | linked+data)
CompleteReadingSessionFormValues // the session-completion form (passage_id, duration_seconds, errors)
CompleteReadingSessionMessages   // localized schema copy

countWords / computeFluency        // pure WPM/accuracy formulas — fluency.ts
buildCompleteReadingSessionSchema  // message-injected Zod factory — schemas.ts
getReadablePassages / getReadingSessionsData / getLinkedStudentId // server reads — queries.ts
completeReadingSessionAction       // server: recompute + insert (session client only) — actions.ts
```

`useReadingStore` remains reserved (naming-convention) but is intentionally **not** built in
Phase 10: the in-progress session state is page-local and ephemeral, so a global store would be
over-engineering. Introduce it when reading state genuinely spans routes (e.g. the Phase 11 reader).

## Read With Me — reader + vocabulary (Phase 11)

The "Read With Me" reading experience lives inside the existing Phase 10 workflow (no new
route, no `useReadingStore`): the reader is the timed reading step, extended with a vocabulary
lookup panel. Vocabulary is strictly a reading aid (word + meaning) — no quizzes, flashcards, or
progress tracking. Names:

```
VocabularyTermRecord            // a row of vocabulary_terms (locked schema, reused from features/reading/types.ts)
VocabularyPanelState            // discriminated lookup state (loading | error | ready+terms)
LoadPassageVocabularyResult     // discriminated load-action result ({ ok:true; terms } | { ok:false })

vocabularyWord / vocabularyMeaning // active-locale word/meaning accessors — features/reading/types.ts
getPassageVocabulary               // server read: one passage's terms (session client) — sessions/queries.ts
loadPassageVocabularyAction        // server: student-gated vocabulary load for the reader — sessions/actions.ts
```

`useReadingStore` stays reserved and unbuilt: the Phase 11 reader keeps all its state page-local
inside `/reading-sessions` (no cross-route reading state), so a global store still isn't warranted.

## Settings (Phase 12)

Personal settings backed by `user_settings` live in `features/settings/`. The four preferences map
1:1 to the locked columns (`theme`, `locale`, `reduced_motion`, `email_notifications`) — no invented
columns. Names:

```
UserSettingsRecord        // a row of user_settings (locked schema) — features/settings/types.ts
SettingsData              // the four prefs resolved for the form, defaults applied — types.ts
UpdateSettingsFormValues  // the settings-form submission shape (alias of SettingsData) — types.ts
UpdateSettingsMessages    // localized schema copy (the single `invalid` message) — schemas.ts
UpdateSettingsResult      // discriminated update-action result — actions.ts

buildUpdateSettingsSchema // message-injected Zod factory — schemas.ts
getUserSettings           // server read: own settings or defaults (session client) — queries.ts
updateSettingsAction      // server: re-validate + upsert own row (session client only) — actions.ts
useSettingsSchemaMessages // client mirror of the server schema copy — components/

MotionProvider / useReducedMotion // explicit reduced-motion preference provider — components/providers/motion-provider.tsx
reducedMotionInitScript           // no-flash inline script for reduced motion — lib/motion.ts
```

`useSettingsStore` stays **reserved and intentionally unbuilt** (like `useReadingStore`): theme and
reduced motion already live in React context providers (`ThemeProvider`, `MotionProvider`), settings
form state is page-local, and Zustand is not a project dependency — so a global store would be
over-engineering. Introduce it only if settings state genuinely needs to be reactive across many
routes beyond what the providers cover.

## Student identity & roster integration (Phase 12.5)

Student identity unification (auth ↔ profile ↔ roster) lives in `features/students/identity/`.
The permanent link is `auth.users.id ↔ profiles.id ↔ students.profile_id`; resolve by `profile_id`,
never by email (see `architecture.md` → "Student identity invariant"). Names:

```
StudentAccountStatus        // derived account state: roster_only | invited | active — identity/types.ts
ClaimStudentFormValues      // the secure-claim form (student_number only) — identity/types.ts
ClaimStudentResult          // discriminated claim-action result — identity/types.ts
ActivationLinkResult        // discriminated activation-link result ({ ok; url } | { ok:false }) — identity/types.ts
ReconcileStudentLinksResult // dry-run/apply backfill summary (linked/conflicts/unmatched) — identity/types.ts
ClaimStudentMessages        // localized claim-schema copy — identity/schemas.ts

generateStudentNumber / generateUniqueStudentNumber // high-entropy claim-secret generator — identity/student-number.ts
getStudentByEmail / getClaimableStudentByNumber / getStudentAccountStatusMap / listAllAuthUsers // server reads — identity/queries.ts
getAllAuthUsers            // Phase 14: request-scoped React cache() wrapper over listAllAuthUsers (dedupes co-rendered scans) — identity/queries.ts
claimStudentRecordAction              // student: link own roster row by student_number (admin client) — identity/actions.ts
generateStudentActivationLinkAction   // admin/teacher: provision + copyable no-SMTP link — identity/actions.ts
reconcileStudentLinksAction           // admin: one-time link-by-email backfill (dry-run + apply) — identity/actions.ts
buildClaimStudentSchema               // message-injected Zod factory — identity/schemas.ts
useClaimSchemaMessages                // client mirror of the claim schema copy — identity/components/

changeLinkedStudentEmail   // local helper: dual auth.users + students email update w/ compensation — features/students/actions.ts
```

Registration is one-step (`RegisterFormValues` extended with `firstNameAr`, `lastNameAr`, `grade`)
and creates the full identity via the existing `signUpAction`. `useAuthStore`/`useStudentStore`
remain reserved-and-unbuilt: identity state is server-resolved per request (no cross-route client
identity store is warranted), consistent with the `useReadingStore`/`useSettingsStore` precedent.

## Profile Editing & Role / Teacher Management (Phase 12.6)

Profile Editing lives inside Settings (`features/settings/`, no new page); a teacher is exactly
`profiles.role = 'teacher'` (no `teachers` table). Role changes mutate **only** `profiles.role`.

```
// Profile Editing (Part 1) — features/settings/
ProfileData / UpdateProfileFormValues / UpdateProfileResult / AvatarActionResult // profile-types.ts
UpdateProfileMessages / buildUpdateProfileSchema / PROFILE_NAME_MAX               // profile-schemas.ts
updateProfileAction / updateAvatarAction / removeAvatarAction                     // profile-actions.ts (session client; avatar is transactional w/ compensation)
useProfileSchemaMessages                                                          // components/use-profile-schema-messages.ts
ProfileCard / AvatarUploader                                                      // components/

// Avatar storage helper — lib/avatar.ts
AVATAR_BUCKET / AVATAR_MAX_BYTES / AVATAR_MAX_DIMENSION / AVATAR_ACCEPTED_TYPES
avatarStorageKey / avatarObjectPath / avatarPublicUrl / validateWebpUpload / isAcceptedAvatarType
// profiles.avatar_url stores the OBJECT PATH (avatars/{user_id}/avatar.webp), never a URL.

// Role / Teacher Management (Part 2)
canManageTeachers / canChangeRole / MANAGEABLE_ROLES / ManageableRole  // features/auth/roles.ts
TeacherView / PromotableUserView / TeacherAccountStatus / ChangeRoleResult // features/teachers/types.ts
ChangeRoleMessages / buildChangeRoleSchema                              // features/teachers/schemas.ts
getTeachers / getPromotableUsers / getTeacherProfileIds                 // features/teachers/queries.ts (server-only, admin)
promoteToTeacherAction / demoteToStudentAction                          // features/teachers/actions.ts (changeUserRole internal; service-role)
TeachersPage / TeachersTable / buildTeacherColumns / TeacherStatusBadge / teacherGlobalFilter
PromoteTeacherDialog / DemoteTeacherDialog                             // features/teachers/components/
isTeacherPresence / TeacherPresenceBadge                              // features/students/components/student-columns.tsx (dual-presence flag)
ROUTES.teachers                                                        // lib/routes.ts
```

`canManageUsers` (broad admin umbrella) is kept and **not** merged with `canManageTeachers`.
`useAuthStore`/`useStudentStore` stay reserved-and-unbuilt (role/profile state is server-resolved per
request), consistent with the established precedent.

## Reading Analytics (Phase 13)

Reading Analytics lives in `features/analytics/`, organized so future analytics domains (vocabulary,
etc.) slot in without refactoring. Admin + teacher only (`canAccessAnalytics`). Charts are
dependency-free SVG; analytics calculations are pure and server-side; the UI consumes stable view
models, never raw DB rows. See `docs/phases/13-reading-analytics.md` (single source of truth).

```
// time-range.ts — pure, deterministic windowing
TimeRange / TIME_RANGES / DEFAULT_TIME_RANGE / isTimeRange      // features/analytics/time-range.ts
AnalyticsWindow / resolveAnalyticsWindow                         //   selected window { start: Date|null; end: Date }
resolveComparisonWindow                                          //   preceding equal-length window (null for "all")
BucketGranularity / resolveBucketGranularity                     //   "day" | "week" | "month" per range

// types.ts — shared, generic, chart-facing building blocks
TrendDirection / TrendIndicator                                 // KPI direction (value + change vs comparison period)
ChartSummary                                                    // no-hover chart summary (current/prev/change/high/low)
AnalyticsTrendPoint / AnalyticsTrendSeries                      // a chart-ready series (points + summary)
AnalyticsAvailability                                           // "ready" | "empty_all" | "empty_range"
AnalyticsInsight / AnalyticsInsightSeverity                     // base structured, localizable insight descriptor

// search-params.ts — the single URL-param contract (range + student)
parseAnalyticsSearchParams / AnalyticsSearchParams              // features/analytics/search-params.ts
ANALYTICS_RANGE_PARAM / ANALYTICS_STUDENT_PARAM                 //   centralized param keys (no hardcoded strings)

// aggregate.ts — pure shared trend math (reuses features/dashboard/data/shared.ts; never forks it)
computeTrendIndicator / summarizeTrend / toTrendSeries          // features/analytics/aggregate.ts
bucketAverages / bucketCounts / TREND_NEUTRAL_THRESHOLD         //   ANALYTICS_SESSION_LIMIT (bounded reads)

// reading/ — reading-domain composites (built in Phase 13)
ReadingInsight / ReadingInsightKind / StudentAnalyticsCard      // features/analytics/reading/types.ts
CohortReadingAnalytics / StudentReadingAnalytics                //   discriminated by AnalyticsAvailability
getCohortReadingAnalytics / getStudentReadingAnalytics          // features/analytics/reading/queries.ts (server-only)
deriveReadingInsights                                           // features/analytics/reading/insights.ts (pure)

// components/charts/ — presentation-only SVG kit
LineTrend / BarSeries / ChartFrame / ChartSummaryRow           // features/analytics/components/charts/
scale.ts (valueBounds/xAt/yAt + CHART_* dims)                  //   pure geometry, multi-series-ready
// components/ — feature UI (Server Components; client only where interactive)
AnalyticsPage / TimeRangeTabs / CohortOverview / StudentAnalytics
AnalyticsKpi / TrendChartCard / InsightsList                   //   presentational, parent-resolved i18n
StudentCards / StudentMetricCard                               //   cohort drill-down cards (needs-attention + grid)
StudentPicker                                                  //   "use client" — secondary type-to-filter lookup
ROUTES.analytics                                                // lib/routes.ts (add to IMPLEMENTED_ROUTES)

// RESERVED — type contracts declared now (strongly typed, no any/unknown), in features/analytics/types.ts:
VocabularyAnalyticsSection / AiInsightsSection / AssignmentsAnalyticsSection
//   → optional extension sections on StudentReadingAnalytics (no runtime, no stubs)

// RESERVED — not built in Phase 13 (no stubs / no folders created):
deriveVocabularyInsights   // features/analytics/vocabulary/insights.ts (future)
deriveTeacherInsights      // features/analytics/insights.ts (future cross-module cohort aggregator)
```

`useAnalyticsStore` is **not** introduced — analytics state is server-resolved per request (time
range + selected student are URL search params), consistent with the reserved-and-unbuilt store
precedent. No `vocabulary/` folder or stub files are created until that module is actually built.

If a later phase needs something not listed here, derive it by following the same pattern
(e.g. `<Entity>Record`, `use<Domain>Store`) rather than picking an arbitrary name, and add it to
this file once decided so it stays the single source of truth.
