# Bayan — Current Architecture (single source of truth)

> **Read this first.** This document describes Bayan **exactly as it is implemented today**, after
> Phase 12.5 (Student Identity & Roster Integration). It supersedes any narrative in the older
> per-phase specs where they disagree about registration, identity, or authorization. The per-phase
> files under `docs/phases/` remain the historical specs for each phase; this file is the live map.
>
> **Last synchronized:** after Phase 12.5 completion. **Next planned phase:** 13 (Reading Analytics).
>
> **Companion docs:**
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

**Completed phases (1 → 12.5):** Foundation, Supabase integration, design system, localization/RTL,
authentication, dashboards, student management, reading-content management, CSV/XLSX import-export,
reading fluency (sessions), Read With Me (reader + vocabulary), settings, and student identity &
roster integration. Phases 13–20 (analytics, performance, a11y audit, testing, security review,
reporting, deployment, final refactor) are **not yet built**.

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
  `canManageUsers` (admin), `canManageStudents`/`canManageContent`/`canAccessAnalytics`/
  `canAccessReports` (admin + teacher).
- **Route guards** — `features/auth/guards.ts` (server-only): `requireUser()`,
  `requireRole(role, ...rest)`, and `redirectIfAuthenticated()`. Unauthenticated → login;
  authenticated-but-unauthorized → home.

### RLS contract (current, permissive — to be tightened in Phase 17)

RLS is enabled on every table. Today's policies:

| Table | SELECT | Writes | Implication |
|---|---|---|---|
| `profiles` | own row (`auth.uid() = id`) | **no INSERT policy** | Cross-user reads + the registration profile insert use `supabaseAdminClient` (role-gated). |
| `user_settings` | own row (`auth.uid() = user_id`) | own row (`settings_insert_own`, etc.) | Each user reads/writes only their own settings. |
| `students` | any authenticated (`true`) | privileged writes via service-role | Admin/teacher read all; **student reads must scope to their own `student_id` in-query**. |
| `reading_passages` | any authenticated (`true`) | — | Readable by all roles. |
| `vocabulary_terms` | any authenticated (`true`) | — | Readable by all roles. |
| `reading_sessions` | any authenticated (`true`) | student inserts own | Scope per student in app code; never rely on RLS for student isolation. |

Because `students`/`reading_passages`/`reading_sessions` SELECT is permissive, app code does the
scoping; only `profiles`-derived counts cross RLS and use the role-gated admin client. **Tightening
these `using(true)` policies is explicitly Phase 17 (Security Review) scope** — not done yet.

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
(`features/students/identity/`). Admin/teacher only. Generates a Supabase `generateLink` **recovery**
action link — **no email is sent**; the admin copies it and shares it. The student opens it, lands on
the Phase 5 reset-password flow via `ROUTES.authCallback`, and sets a password.

- If the student isn't linked yet, it **provisions first**: `admin.createUser` (no password, no
  `email_confirm`) → insert `profiles` → set `students.profile_id` — each step compensated on
  failure (delete the auth user, which cascades the profile).
- If already linked, it re-issues a fresh set-password link for the existing identity's email.
- An existing auth user for that email surfaces as `emailInUse`.

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
registration (service-role) or admin provisioning. Carries the role.

### students (roster)
`id, student_number, first_name_ar, last_name_ar, first_name_en, last_name_en, email, grade,
birth_date, profile_id, created_at, updated_at`. CRUD in `features/students/` (Phase 7); Arabic-aware
search/sort; account-status column + email management + activation/reconcile dialogs added in Phase
12.5. Deleting a student with reading history is refused (`23503`) rather than destroying history.

### user_settings
`id, user_id, theme, locale, reduced_motion, email_notifications, created_at, updated_at`. One row per
auth user, created explicitly at registration. Settings UI in `features/settings/` (Phase 12);
preferences map 1:1 to the columns. Theme + reduced motion are served via React context providers
(`ThemeProvider`, `MotionProvider`), not a store.

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

---

## 13. Routing (current)

Locale-prefixed (`/ar/...`, `/en/...`) via next-intl. Central paths in `lib/routes.ts` (`ROUTES`).
`authCallback` is deliberately under `/api` (locale-agnostic backend endpoint).

**Implemented pages today** (`IMPLEMENTED_ROUTES`): `home`, `login`, `register`, `forgotPassword`,
`resetPassword`, `dashboard`, `students`, `passages`, `vocabulary`, `readingSessions`, `settings`.
**Defined but not yet built** (nav shows a disabled "coming soon" state, never a 404): `analytics`
(Phase 13), `reports` (Phase 18).

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

- **Tighten the permissive `using(true)` RLS policies** on `students` / `reading_passages` /
  `reading_sessions` / `vocabulary_terms` → **Phase 17 (Security Review)**.
- **Account-status derivation lists all auth users on each Student Management load** — fine at
  school/demo scale; revisit with caching/pagination if the user base grows → **Phase 14
  (Performance)**.
- **Cross-device hydration of theme/reduced-motion** (deferred in Phase 12) — unaffected by 12.5.
- **Generated Supabase database types** — record types are currently hand-authored from the locked
  schema as the typed contract; generate from the CLI when added (see `SupabaseArchitecture.md`).

---

## 17. Future phases (planned, not built)

| # | Phase | Spec |
|---|---|---|
| 13 | Reading Analytics | `docs/phases/13-reading-analytics.md` |
| 14 | Performance | `docs/phases/14-performance.md` |
| 15 | Accessibility Audit | `docs/phases/15-accessibility-audit.md` |
| 16 | Testing | `docs/phases/16-testing.md` |
| 17 | Security Review (RLS tightening) | `docs/phases/17-security-review.md` |
| 18 | Reporting (incl. PDF) | `docs/phases/18-reporting.md` |
| 19 | Deployment | `docs/phases/19-deployment.md` |
| 20 | Final Refactor | `docs/phases/20-final-refactor.md` |

Work one phase at a time, only when explicitly requested (`/start-phase <n>` → `/finish-phase`).
