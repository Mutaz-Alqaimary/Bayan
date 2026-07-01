# Bayan — Current Architecture (single source of truth)

> **Read this first.** This document describes Bayan **exactly as it is implemented today**, after
> Phase 12.5 (Student Identity & Roster Integration). It supersedes any narrative in the older
> per-phase specs where they disagree about registration, identity, or authorization. The per-phase
> files under `docs/phases/` remain the historical specs for each phase; this file is the live map.
>
> **Last synchronized:** after **Phase 17** (Security Review) — RLS tightened to role-aware least
> privilege and applied to the live DB. Phases 14 (Performance), 15 (Accessibility Audit), and 16
> (Testing) are also complete. **Next phase:** 18 (Reporting). See `docs/Security.md`,
> `supabase/schema.sql`, and the "Future Considerations" section below.
>
> **Companion docs:**
> - `docs/Performance.md` — Phase 14 performance record (measurements + before/after).
> - `docs/Testing.md` — Phase 16 test-suite coverage map + conventions (Vitest; offline, deterministic).
> - `docs/database/manual-supabase-configuration.md` — every manual Supabase setting not in SQL.
> - `docs/database/phase-12.5-identity-alignment.md` — the (verified, no-op) DB privilege check.
> - `SupabaseArchitecture.md` — deep dive on clients, session refresh, and the registration saga.
> - `.claude/rules/` — the locked contracts (schema, naming, architecture, design, i18n).

---

## 1. What Bayan is (today)

An Arabic-first literacy & reading-fluency platform for schools, Arabic language centers, and
teachers. Three roles — **admin**, **teacher**, **student** — stored on `profiles.role`. The product
question is "is the student's Arabic reading improving over time?", measured through timed reading
sessions (WPM, accuracy, duration).

**Completed phases (1 → 13):** Foundation, Supabase integration, design system, localization/RTL,
authentication, dashboards, student management, reading-content management, CSV/XLSX import-export,
reading fluency (sessions), Read With Me (reader + vocabulary), settings, student identity & roster
integration, role/profile management, and **reading analytics**. Phases 14–20 (performance, a11y
audit, testing, security review, reporting, deployment, final refactor) are **not yet built**.

---

## 2. Tech stack (locked)

Next.js 16 (App Router) · React 19 · TypeScript 5 strict · Tailwind CSS 4 · shadcn/ui · next-intl ·
React Hook Form · Zod · TanStack Table · SheetJS · Lucide React · Supabase JS. Zustand is a listed
dependency-of-record but **no store is actually built** (see §13). Framer Motion / Radix are used
only where they earn their place.

---

## 3. Authentication architecture

**Provider:** Supabase Auth (GoTrue). **Email confirmation is OFF** (a dashboard setting — see the
manual-config doc). There is **no SMTP** configured anywhere; every flow that would normally email a
link instead produces a **copyable link** the admin shares, or auto-confirms in place.

### Clients (names are locked)

| Client | File | Runs in | Notes |
|---|---|---|---|
| `supabaseClient` | `lib/supabase/client.ts` | Client Components | Browser singleton. |
| `supabaseServerClient()` | `lib/supabase/server.ts` | Server Components / Actions / Route Handlers | Per-request, cookie-bound. Never cache. |
| `supabaseAdminClient()` | `lib/supabase/admin.ts` | Server Actions / Route Handlers **only** | Service-role; **bypasses RLS**; `import "server-only"`. Only for explicitly authorized, server-validated operations. |

`SUPABASE_SERVICE_ROLE_KEY` is never exported from any client-importable module.

### Session handling

`proxy.ts` (Next.js 16's renamed middleware) runs two concerns on one shared response per request:
next-intl locale routing, then Supabase session refresh (`lib/supabase/proxy.ts` → `updateSession`,
which calls `auth.getUser()` to rotate tokens). No logic runs between client creation and
`getUser()`. The matcher excludes `api`, `_next`, `_vercel`, and static files.

### The session shape

`features/auth/queries.ts` → `getSessionUser()` returns `SessionUser | null`. It uses
`auth.getUser()` (validates against the Auth server — never `getSession()`), joins the `profiles`
row, and validates `profiles.role` with `isUserRole` before trusting it.

```ts
type SessionUser = { id: string; email: string | null; role: UserRole; profile: ProfileRecord };
```

A profile-less authenticated session is treated as broken: `signInAction` signs it back out and
shows `profileMissing` rather than landing the user on a broken dashboard (defense against a
registration rollback that failed to delete the auth user).

---

## 4. Authorization architecture

The minimum-permissions matrix lives in `.claude/rules/architecture.md`. It is enforced **twice** —
in the UI (hide/disable) and at the data layer (never trust the client) — using shared pure helpers
so the two never drift.

- **Capability helpers** — `features/auth/roles.ts`: `isAdmin`/`isTeacher`/`isStudent`, `isUserRole`,
  `canManageUsers` (admin), `canManageTeachers` (admin — Phase 12.6),
  `canManageStudents`/`canManageContent`/`canAccessAnalytics`/`canAccessReports` (admin + teacher),
  and `canChangeRole(...)` + `MANAGEABLE_ROLES` (the `student`⇄`teacher`-only, admin-only,
  not-self transition policy — Phase 12.6).
- **Route guards** — `features/auth/guards.ts` (server-only): `requireUser()`,
  `requireRole(role, ...rest)`, and `redirectIfAuthenticated()`. Unauthenticated → login;
  authenticated-but-unauthorized → home.

### RLS contract (role-aware least privilege — tightened in Phase 17)

RLS is enabled on every table. In **Phase 17** the permissive `using(true)` policies were replaced with
role-aware policies backed by two `SECURITY DEFINER` helpers — `is_staff()` (current user is
admin/teacher) and `is_my_student(uuid)` (current user owns the `students` row via `profile_id`). Table
grants are unchanged; the tightened RLS is the gate. Current policies:

| Table | SELECT | Writes | Implication |
|---|---|---|---|
| `profiles` | own row (`auth.uid() = id`) | **no INSERT policy**; **UPDATE own row, `full_name`/`avatar_url` columns only** (Phase 12.6 — column privileges + scoped policy) | Cross-user reads, the registration insert, and **all `role` writes** use `supabaseAdminClient` (role-gated). Self-edit of name/avatar uses the session client; `role` is unwritable by clients. |
| `user_settings` | own row (`auth.uid() = user_id`) | own row (`settings_insert_own`, etc.) | Each user reads/writes only their own settings. |
| `students` | `is_staff() OR profile_id = auth.uid()` | INSERT/UPDATE/DELETE gated by `is_staff()` | Staff read/write the whole roster; a student sees only their own linked row. The self-claim writes `profile_id` via the **admin** client (bypasses RLS), so it is unaffected. |
| `reading_passages` | any authenticated (`true`) | INSERT/UPDATE/DELETE gated by `is_staff()` | All roles read content; only staff write it. |
| `vocabulary_terms` | any authenticated (`true`) | INSERT/UPDATE/DELETE gated by `is_staff()` | All roles read; only staff write. |
| `reading_sessions` | `is_staff() OR is_my_student(student_id)` | INSERT `is_my_student(student_id)`; no UPDATE/DELETE policy | Staff read all (analytics/dashboards); a student reads and inserts only their own sessions (forging another `student_id` is denied). |

App code still scopes student-facing reads defensively (never relying on RLS alone), but the database
now enforces the permission matrix on its own. Full detail, the verified audit baseline, and the applied
migration: `docs/Security.md` and `supabase/schema.sql`.

---

## 5. Identity model (Phase 12.5 — the invariant)

The **permanent identity link** is:

```
auth.users.id ──1:1── profiles.id ──0..1── students.profile_id ──1:N── reading_sessions.student_id
 (identity)            (role+identity)       (the bridge, ON DELETE SET NULL)   (CASCADE — history anchor)
auth.users.id ──1:1── user_settings.user_id
```

- **`profiles.id = auth.users.id`**; **`students.profile_id` references it** (`ON DELETE SET NULL`).
- **Resolve a student by `profile_id`, never by email.** Email is used only for (a) authentication,
  (b) communication, and (c) *initial roster matching before linking*. Once linked, changing the
  email never affects identity. Every feature — reading sessions, dashboards, analytics, guards —
  resolves the student through `profile_id` via `getLinkedStudentId(profileId)`
  (`features/reading/sessions/queries.ts`).
- **`student_number` is the claim secret** — app-generated, high-entropy
  (`features/students/identity/student-number.ts`).
- `profile_id` is `NULL` only for a roster-only row not yet linked, or after a linked account was
  deleted (the academic record + reading history survive).

### Account status (derived — no schema column)

`StudentAccountStatus = "roster_only" | "invited" | "active"`, computed in
`getStudentAccountStatusMap`:

| Status | Meaning | Derivation |
|---|---|---|
| `roster_only` | academic record, no login | `profile_id IS NULL` |
| `invited` | linked, never signed in | linked + `auth.users.last_sign_in_at` is null |
| `active` | linked, has signed in | linked + `last_sign_in_at` set |

---

## 6. Student lifecycle (all states representable without a schema change)

| State | auth.users | profiles | user_settings | students | profile_id | Login |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Roster-only (admin pre-created) | – | – | – | ✅ | NULL | No |
| Active (public self-registered) | ✅ | ✅ | ✅ | ✅ | set | Yes |
| Invited (admin activation link, not yet activated) | ✅ | ✅ | ✅ | ✅ | set | After set-password |
| Unlinked academic record (post account deletion) | – | – | – | ✅ | NULL | No (history kept) |

---

## 7. Registration flow (public, one-step, SMTP-free)

`features/auth/components/register-form.tsx` collects **Full Name, Arabic First Name, Arabic Last
Name, Email, Grade, Password (+ confirm)** (`RegisterFormValues`, validated by
`buildRegisterSchema`). Self-registration **always** creates a `student` (role hard-coded
server-side — never read from client input). The action is `signUpAction`
(`features/auth/actions.ts`), a saga with compensating rollback:

1. **Reconcile by email first** (`getStudentByEmail`, service-role, case-insensitive). A roster row
   already **linked** → `emailTaken` (block). An **unlinked** roster row → continue, but leave the
   account unlinked (email never auto-claims; the UNIQUE `students.email` constraint forbids a
   duplicate) so the student claims it later with their `student_number`.
2. **`supabase.auth.signUp()`** through the cookie-bound **server client** (user-initiated — *not*
   `admin.createUser()`). With "Confirm email" off this auto-confirms and **establishes the session
   in one step**. Duplicate email (error or the obfuscated no-identities user) → `emailTaken`; a
   missing session (would mean confirmation is required — a config mismatch) → roll back.
3. **Insert `profiles`** (`role='student'`) — service-role (no INSERT policy; role fixed server-side).
4. **Insert `user_settings`** via the **session client** — the just-signed-in user inserts its own row
   under `settings_insert_own` RLS. Created **explicitly** so every account is complete from the
   start (no trigger, no deferred Settings save).
5. **Insert the linked `students`** row with an auto-generated `student_number` (service-role) —
   unless the email-collision case left it unlinked. A racing duplicate email (`23505`) falls through
   unlinked/claimable; any other failure rolls back.
6. **Redirect to dashboard** (session already exists).

On any insert failure → compensating rollback: delete the auth user (cascades
`profiles`/`user_settings`) and clear the session, freeing the email for a clean retry.

> `admin.createUser()` is reserved for **admin provisioning** (see §8). `signUp()` is for
> user-initiated public registration and additionally enforces the platform's signup protections
> (rate limiting, password policy) that the admin API bypasses.

---

## 8. Admin/teacher provisioning — activation links (no SMTP)

`generateStudentActivationLinkAction` + `ActivationLinkDialog`
(`features/students/identity/`). Admin/teacher only. Uses Supabase `generateLink({ type:"recovery" })`
**without sending an email**, then builds a **copyable link to our own callback** using the link's
`properties.hashed_token`:
`…/api/auth/callback?token_hash=<hashed_token>&type=recovery&next=/<locale>/reset-password`. The admin
shares it; the student opens it, the callback verifies the token server-side and establishes the
session, and they land on the Phase 5 reset-password page to set a password (which makes the account
`active`).

- If the student isn't linked yet, it **provisions first**: `admin.createUser` (no password, no
  `email_confirm`) → insert `profiles` → set `students.profile_id` — each step compensated on
  failure (delete the auth user, which cascades the profile).
- If already linked, it re-issues a fresh set-password link for the existing identity's email.
- An existing auth user for that email surfaces as `emailInUse`.

> **Why the link points at our callback with `token_hash`, not the raw `action_link`.** Admin-generated
> links are created server-side via the Admin API, so there is **no PKCE code verifier** in the
> student's browser. The default `/auth/v1/verify` → `?code` exchange therefore can't establish a
> session (it returns tokens in the URL hash a server route can't read), and the link would dead-end
> at Login. Passing the `hashed_token` to our callback lets it verify server-side with
> `verifyOtp({ type:"recovery", token_hash })` — no verifier required. See §8a.

### 8a. Auth callback — two flows (`app/api/auth/callback/route.ts`)

The callback supports **both** authentication paths and, on success, sets the auth cookies and
redirects to the validated internal `next` path (otherwise it redirects to the localized login):

| Path | Trigger | Mechanism | Used by |
|---|---|---|---|
| **PKCE** | `?code=` | `exchangeCodeForSession(code)` (verifier in the requesting browser) | Phase 5 **forgot-password** (`resetPasswordForEmail`, user-initiated) |
| **Token hash** | `?token_hash=&type=recovery` | `verifyOtp({ type, token_hash })` (no verifier needed) | Phase 12.6 **admin activation links** |

Both flows exist because user-initiated resets *have* a PKCE verifier (so the code exchange is correct
and most secure for them), while admin-generated links *cannot* have one — so they need the
server-side OTP verification path. Neither path is removed; `?code` takes precedence if present.

---

## 9. Claim flow (student-initiated, secret = student_number)

`claimStudentRecordAction` + `claim-form.tsx`, rendered on the reading-sessions **unlinked** state. A
signed-in student links an **unlinked** roster row using its school-issued **`student_number`** (the
claim secret) — **never by email**. The link UPDATE is guarded by `profile_id IS NULL`, so two
concurrent claims can't both win (the loser updates zero rows). An already-linked student, an
unknown/already-claimed number, or a lost race all return a safe localized error and change nothing.

---

## 10. Email management (admin-only, dual write with compensation)

Email is **read-only on every student-facing surface** — Settings exposes no email field. Only
admin/teacher change it, from Student Management. `updateStudentAction` reads the current
`profile_id`/`email`; if the row is **linked** and the email changed, it delegates to
`changeLinkedStudentEmail`, which:

1. updates **`auth.users.email`** (Admin API, no `email_confirm`); a duplicate surfaces as a field
   error before anything else changes, then
2. updates **`students.email`**; if that fails, it **restores the previous auth email** so the two
   never diverge (a divergence that can't be restored is logged for manual re-apply).

`profile_id` and ids are never touched; no new identity is created. A true cross-schema SQL
transaction isn't possible (auth lives behind the Admin API), so this is an application-level
operation with compensation. A roster-only row, or an edit that doesn't change email, is a plain
roster update.

---

## 11. Reconciliation backfill (one-time, admin)

`reconcileStudentLinksAction` + `ReconcileDialog` (admin only; **dry-run first**). Links legacy
unlinked student-profiles to existing unlinked roster rows **by email** — an admin-vouched
administrative match, distinct from the self-service claim (which never trusts email). Email
comparison is normalized (trim + lowercase) because GoTrue lowercases auth emails while
`students.email` is stored as typed. Idempotent; reports `linked` / `conflicts` / `unmatched`. It
**cannot create** rows for unmatched profiles (`students.grade` is `NOT NULL` and unknown for a bare
profile) — those complete via normal onboarding/claim.

---

## 12. Data domains & server reads

### profiles
`id, full_name, role, avatar_url, locale, created_at, updated_at`. `id = auth.users.id`. Created at
registration (service-role) or admin provisioning. Carries the role. **Phase 12.6:** a user may
self-edit **only** `full_name` and `avatar_url` (Profile Editing, in Settings) via the session client
under the redesigned `profiles_update_own` policy + column privileges; `avatar_url` stores the
storage **object path** (`avatars/{user_id}/avatar.webp`), not a URL. `role` is writable **only** by
the admin-gated role-change action via the service-role client — never by the user.

### students (roster)
`id, student_number, first_name_ar, last_name_ar, first_name_en, last_name_en, email, grade,
birth_date, profile_id, created_at, updated_at`. CRUD in `features/students/` (Phase 7); Arabic-aware
search/sort; account-status column + email management + activation/reconcile dialogs added in Phase
12.5. Deleting a student with reading history is refused (`23503`) rather than destroying history.

### user_settings
`id, user_id, theme, locale, reduced_motion, email_notifications, created_at, updated_at`. One row per
auth user, created explicitly at registration. Settings UI in `features/settings/` (Phase 12);
preferences map 1:1 to the columns. Theme + reduced motion are served via React context providers
(`ThemeProvider`, `MotionProvider`), not a store. **Phase 12.6** adds a Profile card to the same
Settings page (name + avatar), backed by `profiles` — a separate form/data source from these
preferences.

### teachers (no table — a `profiles.role` projection)
There is **no `teachers` table**. A teacher is exactly `profiles.role = 'teacher'`. Teacher
Management (`features/teachers/`, admin-only `/teachers`, Phase 12.6) lists/searches/filters teacher
profiles and promotes/demotes between `student` and `teacher` by flipping **only** `profiles.role`.
`getTeachers`/`getPromotableUsers` are service-role projections of `profiles` (+ email/sign-in). Admin
is infrastructure-only (no create/assign/escalate-to-admin path). Promotion targets authenticated
users (profiles), never roster-only students. A promoted teacher keeps any `students` row + reading
history (intentional dual presence, flagged with a badge + optional hide-filter in Student
Management).

### reading_passages & vocabulary_terms
Reading content (Phase 8) + the Read With Me vocabulary aid (Phase 11). Vocabulary is strictly a
reading aid (word + meaning) — no quizzes or progress tracking. `getReadablePassages` precomputes
Arabic word counts; `getPassageVocabulary` scopes to one passage.

### reading_sessions
`id, student_id, passage_id, words_per_minute, accuracy_percentage, duration_seconds, completed_at,
created_at`. The student reading workflow + history lives in `features/reading/sessions/` (Phases
10–11). All reads are scoped to the signed-in student's `students.id` resolved via
`getLinkedStudentId(profile_id)` — never RLS alone. A student with no linked roster row returns
`{ linked: false }`, rendered as the onboarding/claim state.

### reading analytics (read-only, admin + teacher — Phase 13)
No table of its own — a **read layer over `reading_sessions`** in `features/analytics/`, gated by
`canAccessAnalytics` (`requireRole('admin','teacher')`). `getCohortReadingAnalytics(range)` and
`getStudentReadingAnalytics(studentId, range)` (server-only) run **bounded, range-filtered reads via
the session client** (permissive SELECT — **no service-role, no new privilege, no schema change**),
aggregate in TypeScript via pure helpers that **reuse the dashboard layer** (`average`, `startOfWeek`,
…; never forked), and return stable, serializable view models (never raw rows). Time range + drilled-in
student are **URL search params** (`parseAnalyticsSearchParams`), so the read is deterministic and
refresh/shareable. Charts are dependency-free SVG (`features/analytics/components/charts/`). Future
domains (vocabulary, AI insights, assignments) attach as sibling modules with reserved type contracts.

---

## 13. Routing (current)

Locale-prefixed (`/ar/...`, `/en/...`) via next-intl. Central paths in `lib/routes.ts` (`ROUTES`).
`authCallback` is deliberately under `/api` (locale-agnostic backend endpoint).

**Implemented pages today** (`IMPLEMENTED_ROUTES`): `home`, `login`, `register`, `forgotPassword`,
`resetPassword`, `dashboard`, `students`, `teachers` (admin-only, Phase 12.6), `passages`,
`vocabulary`, `readingSessions`, `analytics` (admin/teacher, Phase 13), `settings`. **Defined but not
yet built** (nav shows a disabled "coming soon" state, never a 404): `reports` (Phase 18).

---

## 14. Server actions (current inventory)

| Action | File | Role gate | Purpose |
|---|---|---|---|
| `signInAction` | `features/auth/actions.ts` | public | Login; rejects profile-less sessions. |
| `signUpAction` | `features/auth/actions.ts` | public | One-step student registration saga (§7). |
| `requestPasswordResetAction` | `features/auth/actions.ts` | public | Neutral "check your email" (anti-enumeration). |
| `updatePasswordAction` | `features/auth/actions.ts` | recovery session | Set new password. |
| `signOutAction` | `features/auth/actions.ts` | authed | Sign out → login. |
| `createStudentAction` / `updateStudentAction` / `deleteStudentAction` | `features/students/actions.ts` | admin, teacher | Roster CRUD; update delegates to `changeLinkedStudentEmail` for linked email changes. |
| `claimStudentRecordAction` | `features/students/identity/actions.ts` | student | Link own roster row by `student_number`. |
| `generateStudentActivationLinkAction` | `features/students/identity/actions.ts` | admin, teacher | Provision + copyable set-password link (no SMTP). |
| `reconcileStudentLinksAction` | `features/students/identity/actions.ts` | admin | One-time link-by-email backfill (dry-run + apply). |
| `commitStudentImportAction` | `features/students/import-export/actions.ts` | admin, teacher | CSV/XLSX atomic upsert (Phase 9). |
| `completeReadingSessionAction` | `features/reading/sessions/actions.ts` | student | Recompute fluency + insert a session (Phase 10). |
| `loadPassageVocabularyAction` | `features/reading/sessions/actions.ts` | student | Load one passage's vocabulary for the reader (Phase 11). |
| `updateSettingsAction` | `features/settings/actions.ts` | authed (own row) | Re-validate + upsert own settings (Phase 12). |
| `updateProfileAction` | `features/settings/profile-actions.ts` | authed (own row) | Update own `full_name` (session client, RLS-enforced) — Phase 12.6. |
| `updateAvatarAction` / `removeAvatarAction` | `features/settings/profile-actions.ts` | authed (own row) | Transactional avatar upload (upload → persist path → compensate-delete on DB failure) / remove — Phase 12.6. |
| `promoteToTeacherAction` / `demoteToStudentAction` | `features/teachers/actions.ts` | admin | Flip `profiles.role` between `student`/`teacher` (service-role, `canChangeRole`-guarded, race-safe) — Phase 12.6. |

Every action re-validates input with the **same Zod schema the client used** (Server Functions are
reachable via direct POST), maps failures to safe localized copy, and revalidates affected routes.

---

## 15. Important architectural decisions

1. **`profile_id` is the identity; email is a managed attribute.** Resolve students by `profile_id`
   everywhere; email never claims a record.
2. **One unified registration flow.** Public `signUp()` builds the full identity in one step
   (`auth.users` + `profiles` + `user_settings` + `students` + auto `student_number`); roster
   integration is the secure `student_number` claim or an admin activation link.
3. **SMTP-free by design.** "Confirm email" is OFF; emails are honestly unverified; password
   provisioning is a copyable link, never an email. This keeps the project demoable with zero infra.
4. **`signUp()` for users, `admin.createUser()` for admins.** The user-initiated path keeps platform
   signup protections; the admin API is only for provisioning/invitations.
5. **No schema changes ever.** Phase 12.5 added zero tables/columns/migrations/triggers; all four
   lifecycle states are representable on the existing schema. Account status is **derived**, not
   stored.
6. **Atomicity by saga + compensation**, because no cross-schema (auth ↔ public) SQL transaction is
   possible. Registration and email-change both compensate on partial failure.
7. **Explicit `user_settings` creation** (no `on auth.users` trigger relied upon) so every account is
   complete deterministically from app code alone.
8. **Authorize twice** (UI + data layer) from shared pure helpers; never trust hidden UI.
9. **Zustand stores stay reserved-and-unbuilt** (`useAuthStore`, `useStudentStore`, `useReadingStore`,
   `useSettingsStore`): identity is server-resolved per request, reading/settings state is page-local
   or in context providers, and Zustand isn't actually a dependency — a global store would be
   over-engineering. Introduce one only when state genuinely spans routes.

---

## 16. Deferred work

- ~~**Tighten the permissive `using(true)` RLS policies**~~ — **done in Phase 17 (Security Review).**
  `students` / `reading_passages` / `reading_sessions` / `vocabulary_terms` now use role-aware policies
  (`is_staff()` / `is_my_student()`); see the §4 RLS contract, `docs/Security.md`, and
  `supabase/schema.sql`.
- **Account-status derivation lists all auth users on each Student Management load** — **reviewed in
  Phase 14; intentionally re-deferred.** The `/students` render performs a single, necessary
  `auth.users` scan (in `getStudentAccountStatusMap`) — no in-request redundancy to remove, and the
  scan can't be eliminated without storing sign-in state in `public` (a forbidden schema change). It
  is already bounded (`perPage: 200`, ≤ 50 pages). Larger-scale caching/pagination → **Phase 20
  (scaling strategy)**. See `docs/Performance.md` → "Server read efficiency".
- **Cross-device hydration of theme/reduced-motion** (deferred in Phase 12) — unaffected by 12.5/12.6.
- **Teacher list + promote picker list all auth users on each load** (Phase 12.6) — **resolved in
  Phase 14.** `/teachers` rendered `getTeachers()` + `getPromotableUsers()`, each doing its own full
  `auth.users` scan (2 per render); both now share one request-scoped React `cache()` accessor
  (`getAllAuthUsers`, `features/students/identity/queries.ts`) → **1 scan per render**. No persistent
  cache, no permission/behavior change. See `docs/Performance.md` → "Server read efficiency".
- **Avatar replace + DB-write failure** (Phase 12.6): the transactional action deletes the uploaded
  object on a DB failure; for a *replace* (rare) this can remove the prior avatar while `avatar_url`
  still points at the path. Self-heals on the next successful upload (stable path). Acceptable;
  revisit only if it surfaces in practice.
- **Generated Supabase database types** — record types are currently hand-authored from the locked
  schema as the typed contract; generate from the CLI when added (see `SupabaseArchitecture.md`).

---

## 17. Future phases (planned, not built)

| # | Phase | Spec |
|---|---|---|
| 14 | Performance | `docs/phases/14-performance.md` |
| 15 | Accessibility Audit | `docs/phases/15-accessibility-audit.md` |
| 17 | Security Review (RLS tightening) | `docs/phases/17-security-review.md` |
| 18 | Reporting (incl. PDF) | `docs/phases/18-reporting.md` |
| 19 | Deployment | `docs/phases/19-deployment.md` |
| 20 | Final Refactor | `docs/phases/20-final-refactor.md` |

Work one phase at a time, only when explicitly requested (`/start-phase <n>` → `/finish-phase`).

---

## 18. Future Considerations

> Captures architectural intent so future Claude Code sessions understand not just *what* exists but
> *why*, and what must never be broken. The Phase 12.6 decisions below are **implemented**
> (`docs/phases/12.6-role-management.md`); the *future teacher workflow* further down is not.

### Profile Editing (Phase 12.6, Part 1 — implemented)

- **Users self-edit only `full_name` + `avatar_url`**, inside Settings (no new page). Email and role
  are read-only (email is admin-managed; role is privileged). Enforced at the DB layer by the
  redesigned `profiles_update_own` policy **+ column privileges** — `role`/identity columns are
  unwritable by clients, so the admin invariant holds even against direct client calls.
- **`avatar_url` stores the object path, not a URL** — the app generates the public URL at runtime
  (`avatarPublicUrl`), keeping the DB independent of bucket/CDN/domain and able to switch to signed
  URLs later with no data change.
- **Avatar upload is transactional** (server action): validate → upload → persist path → **delete the
  uploaded object if the DB write fails** (compensation). Stable path (`avatar.webp`) → replace is an
  overwrite → no orphaned files. WebP passthrough; only JPEG/PNG are converted; 1 MB cap.
- *Why redesign, not drop, `profiles_update_own`:* the user now has a legitimate self-edit, so a
  column-scoped policy is the correct durable shape — safer than the original broad policy.

### Role management (Phase 12.6, Part 2 — implemented)

- **A teacher is exactly `profiles.role = 'teacher'` — the single source of truth.** No `teachers`
  table. The admin can promote a `student` user to `teacher` and demote back, entirely in-app, by
  flipping `profiles.role` only.
- **Role management mutates only `profiles.role`** (+ `updated_at`). It never touches the Phase 12.5
  identity link (`profile_id`), the `students` roster row, `auth.users`, `user_settings`, or
  `reading_sessions`. Every change is reversible and lossless.
- **Only authenticated users (a `profiles` row) can be promoted.** Roster-only students
  (`profile_id IS NULL`) have no role to change.
- **Allowed transitions: `student ⇄ teacher`, admin only.** Admin is **infrastructure-only** — no
  in-app path creates, assigns, or escalates to admin; the actor can't change their own role. Enforced
  in both UI and the server action.
- **Dual presence is intentional.** A promoted teacher may still own a `students` row (so demotion
  preserves their reading history) — addressed with a UI badge/filter, never by moving/deleting data.
- **Separate module.** Teacher Management (`features/teachers/`, admin-only `/teachers`) is independent
  from Student Management (the academic roster). No generic "Users" module.
- **Authorization:** new explicit `canManageTeachers()` (admin) + a pure `canChangeRole()` transition
  predicate — not an overload of `canManageUsers()`.
- **Data path:** cross-`profiles` reads + the role UPDATE use the role-gated **service-role** client
  (the same pattern the admin dashboard already uses), because `profiles` RLS is select-own. Requires
  verifying `service_role` has UPDATE on `public.profiles` (the one gating precondition).

### Future teacher workflow (NOT built — planned for later phases)

Assigned students / classrooms / reading groups, reading-session review, student evaluations, grading,
comments, teacher statistics, teacher dashboards, teacher reports.

### Future extension points (how the above attach without redesign)

- A teacher is already a first-class **`profiles.id`** identity, so future relationships key off it:
  `teacher_student_assignments(teacher_profile_id → profiles.id, student_id → students.id, …)`,
  `evaluations(teacher_profile_id, student_id, …)`, `teacher_profiles(profile_id PK, department, …)` —
  all **separate extension tables**, each in its own phase. None changes today's identity model.
- Resolution stays **by id** (`profiles.id` / `students.id` / `profile_id`), never email.
- Teacher-scoped reads layer onto the existing `requireRole`/capability-helper pattern; no new identity
  plumbing.

### Invariants that must NEVER be broken in future phases

- **Never** add a parallel "is a teacher" flag/table that can disagree with `profiles.role`.
- **Never** make role management write identity columns (`profile_id`) or `students` / `auth.users` /
  `user_settings` / `reading_sessions`.
- **Never** expose an in-app path to create, assign, or escalate to **admin**.
- **Never** delete or move a student's `students` row / reading history on a role change.
- **Never** resolve teachers or students by email instead of by id.
- **Never** promote a roster-only record (no `profiles`).
- The **Phase 12.5 identity invariant** (`auth.users.id ↔ profiles.id ↔ students.profile_id`, resolve
  by `profile_id`) remains frozen.
