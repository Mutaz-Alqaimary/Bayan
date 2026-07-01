-- =====================================================================
-- BAYAN — CANONICAL DATABASE SCHEMA (single source of truth)
-- =====================================================================
-- This file represents the CURRENT state of the Bayan Supabase database,
-- consolidating the original bootstrap + every subsequent change:
--   * Phase 10  — corrective table GRANTs
--   * Phase 12.6 — profiles column-scoped UPDATE hardening + avatars storage
--   * Phase 17  — role-aware RLS tightening (is_staff / is_my_student helpers)
--
-- It SUPERSEDES the old incremental files (setup.sql, fixes/phase-10-*,
-- fixes/phase-17-*), which were removed. Their history remains in git.
--
-- PROVENANCE / CONFIDENCE
--   * Tables, columns, FKs, indexes, `updated_at` trigger — the LOCKED schema
--     (`.claude/rules/database-schema.md`); unchanged across all phases.
--   * RLS policies, GRANTs, helper functions, FK ON DELETE, storage policies —
--     the **verified Phase 17 live audit** (docs/Security.md §1).
--   * The `avatars` bucket row settings (Public / 1 MB / MIME) are DASHBOARD
--     config, documented in docs/database/manual-supabase-configuration.md §6.
--
-- ⚠️ VALIDATE ONCE: this file was reconstructed from the locked schema + the
-- verified audit (this environment has no direct DB access). To confirm it is
-- byte-accurate to production, run `supabase db dump --schema public` (or
-- `pg_dump --schema-only`) once and diff. The authorization model (policies,
-- grants, functions) is verified; only low-level DDL cosmetics could differ.
-- =====================================================================

-- =====================================================================
-- 1. TABLES  (locked schema — do not add/rename/drop columns)
-- =====================================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        text not null check (role in ('admin', 'teacher', 'student')),
  avatar_url  text,                       -- storage OBJECT PATH, not a URL (Phase 12.6)
  locale      text not null default 'ar',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.students (
  id             uuid primary key default gen_random_uuid(),
  student_number text unique not null,    -- the claim secret (high-entropy)
  first_name_ar  text not null,
  last_name_ar   text not null,
  first_name_en  text,
  last_name_en   text,
  email          text unique not null,
  grade          integer not null,
  birth_date     date,
  profile_id     uuid references public.profiles(id) on delete set null,  -- identity bridge
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.reading_passages (
  id                uuid primary key default gen_random_uuid(),
  title_ar          text not null,
  title_en          text,
  content_ar        text not null,
  content_en        text,
  difficulty_level  integer not null,
  estimated_minutes integer not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.reading_sessions (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references public.students(id) on delete cascade,
  passage_id          uuid not null references public.reading_passages(id) on delete cascade,
  words_per_minute    integer,
  accuracy_percentage numeric(5,2),
  duration_seconds    integer,
  completed_at        timestamptz,
  created_at          timestamptz not null default now()
);

create table if not exists public.vocabulary_terms (
  id         uuid primary key default gen_random_uuid(),
  passage_id uuid not null references public.reading_passages(id) on delete cascade,
  word_ar    text not null,
  word_en    text,
  meaning_ar text not null,
  meaning_en text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references auth.users(id) on delete cascade,
  theme               text not null default 'system',
  locale              text not null default 'ar',
  reduced_motion      boolean not null default false,
  email_notifications boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- =====================================================================
-- 2. INDEXES
-- =====================================================================

create index if not exists idx_students_email          on public.students(email);
create index if not exists idx_students_number          on public.students(student_number);
create index if not exists idx_reading_sessions_student on public.reading_sessions(student_id);
create index if not exists idx_reading_sessions_passage on public.reading_sessions(passage_id);
create index if not exists idx_vocabulary_passage       on public.vocabulary_terms(passage_id);

-- =====================================================================
-- 3. updated_at TRIGGER FUNCTION + TRIGGERS
--    (reading_sessions / vocabulary_terms have no updated_at column → no trigger)
-- =====================================================================

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at         on public.profiles;
create trigger profiles_updated_at         before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists students_updated_at         on public.students;
create trigger students_updated_at         before update on public.students
  for each row execute function public.handle_updated_at();

drop trigger if exists reading_passages_updated_at on public.reading_passages;
create trigger reading_passages_updated_at before update on public.reading_passages
  for each row execute function public.handle_updated_at();

drop trigger if exists user_settings_updated_at    on public.user_settings;
create trigger user_settings_updated_at    before update on public.user_settings
  for each row execute function public.handle_updated_at();

-- =====================================================================
-- 4. AUTHORIZATION HELPER FUNCTIONS (Phase 17)
--    SECURITY DEFINER + pinned search_path so policies on one table can read
--    profiles/students without recursing into their RLS. EXECUTE → authenticated.
-- =====================================================================

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'teacher')
  );
$$;

create or replace function public.is_my_student(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students
    where id = sid and profile_id = auth.uid()
  );
$$;

revoke execute on function public.is_staff()          from public;
revoke execute on function public.is_my_student(uuid) from public;
grant  execute on function public.is_staff()          to authenticated;
grant  execute on function public.is_my_student(uuid) to authenticated;

-- =====================================================================
-- 5. TABLE GRANTS  (verified: Phase 17 audit Q3/Q4)
--    RLS is the gate; grants stay broad for the roles the app uses. `service_role`
--    bypasses RLS (used by the admin client for privileged, server-validated ops).
-- =====================================================================

-- Data tables: the session client (as `authenticated`) does all reads/writes,
-- constrained by the RLS policies in section 7.
grant select, insert, update, delete on public.students          to authenticated;
grant select, insert, update, delete on public.reading_passages  to authenticated;
grant select, insert, update, delete on public.vocabulary_terms  to authenticated;
grant select, insert, update, delete on public.reading_sessions  to authenticated;
grant select, insert, update         on public.user_settings     to authenticated;

-- profiles: table-level UPDATE is REVOKED; only full_name + avatar_url are
-- self-updatable (Phase 12.6). `role`/identity columns are unwritable by clients.
grant  select on public.profiles to authenticated;
revoke update on public.profiles from anon, authenticated;
grant  update (full_name, avatar_url) on public.profiles to authenticated;

-- service_role (admin client): privileged writes it performs directly.
grant select, insert, update on public.profiles to service_role;
grant select, insert, update on public.students to service_role;

-- =====================================================================
-- 6. ENABLE RLS (every table)
-- =====================================================================

alter table public.profiles         enable row level security;
alter table public.students         enable row level security;
alter table public.reading_passages enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.vocabulary_terms enable row level security;
alter table public.user_settings    enable row level security;

-- =====================================================================
-- 7. RLS POLICIES  (verified current state — Phase 17 audit + Phase 12.6)
-- =====================================================================

-- ---- profiles: own-row read; own-row, column-scoped update ----
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using ( auth.uid() = id );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ( auth.uid() = id ) with check ( auth.uid() = id );
-- (No INSERT/DELETE policy: registration inserts via service_role; never deleted here.)

-- ---- user_settings: own row only ----
drop policy if exists "settings_select_own" on public.user_settings;
create policy "settings_select_own" on public.user_settings
  for select using ( auth.uid() = user_id );

drop policy if exists "settings_insert_own" on public.user_settings;
create policy "settings_insert_own" on public.user_settings
  for insert with check ( auth.uid() = user_id );

drop policy if exists "settings_update_own" on public.user_settings;
create policy "settings_update_own" on public.user_settings
  for update using ( auth.uid() = user_id );

-- ---- students: staff read/write all; a student reads only their own linked row ----
drop policy if exists "students_select_staff_or_own" on public.students;
create policy "students_select_staff_or_own" on public.students
  for select to authenticated
  using ( public.is_staff() or profile_id = auth.uid() );

drop policy if exists "students_insert_staff" on public.students;
create policy "students_insert_staff" on public.students
  for insert to authenticated with check ( public.is_staff() );

drop policy if exists "students_update_staff" on public.students;
create policy "students_update_staff" on public.students
  for update to authenticated using ( public.is_staff() ) with check ( public.is_staff() );

drop policy if exists "students_delete_staff" on public.students;
create policy "students_delete_staff" on public.students
  for delete to authenticated using ( public.is_staff() );
-- (The self-claim writes students.profile_id via the service_role admin client,
--  which bypasses RLS, so a student needs no UPDATE policy here.)

-- ---- reading_sessions: staff read all; a student reads + inserts only their own ----
drop policy if exists "reading_sessions_select_staff_or_own" on public.reading_sessions;
create policy "reading_sessions_select_staff_or_own" on public.reading_sessions
  for select to authenticated
  using ( public.is_staff() or public.is_my_student(student_id) );

drop policy if exists "reading_sessions_insert_own" on public.reading_sessions;
create policy "reading_sessions_insert_own" on public.reading_sessions
  for insert to authenticated with check ( public.is_my_student(student_id) );
-- (No UPDATE/DELETE policy: the app never updates or deletes sessions.)

-- ---- reading_passages: everyone reads content; only staff write ----
drop policy if exists "reading_passages_authenticated_select" on public.reading_passages;
create policy "reading_passages_authenticated_select" on public.reading_passages
  for select to authenticated using ( true );

drop policy if exists "reading_passages_insert_staff" on public.reading_passages;
create policy "reading_passages_insert_staff" on public.reading_passages
  for insert to authenticated with check ( public.is_staff() );

drop policy if exists "reading_passages_update_staff" on public.reading_passages;
create policy "reading_passages_update_staff" on public.reading_passages
  for update to authenticated using ( public.is_staff() ) with check ( public.is_staff() );

drop policy if exists "reading_passages_delete_staff" on public.reading_passages;
create policy "reading_passages_delete_staff" on public.reading_passages
  for delete to authenticated using ( public.is_staff() );

-- ---- vocabulary_terms: everyone reads; only staff write ----
drop policy if exists "vocabulary_terms_authenticated_select" on public.vocabulary_terms;
create policy "vocabulary_terms_authenticated_select" on public.vocabulary_terms
  for select to authenticated using ( true );

drop policy if exists "vocabulary_terms_insert_staff" on public.vocabulary_terms;
create policy "vocabulary_terms_insert_staff" on public.vocabulary_terms
  for insert to authenticated with check ( public.is_staff() );

drop policy if exists "vocabulary_terms_update_staff" on public.vocabulary_terms;
create policy "vocabulary_terms_update_staff" on public.vocabulary_terms
  for update to authenticated using ( public.is_staff() ) with check ( public.is_staff() );

drop policy if exists "vocabulary_terms_delete_staff" on public.vocabulary_terms;
create policy "vocabulary_terms_delete_staff" on public.vocabulary_terms
  for delete to authenticated using ( public.is_staff() );

-- =====================================================================
-- 8. STORAGE — avatars (Phase 12.6)
-- =====================================================================
-- Bucket row settings are DASHBOARD/API config (not created here): bucket
-- `avatars`, PUBLIC read, file_size_limit 1 MB, allowed_mime_types
-- image/webp,image/png,image/jpeg. See manual-supabase-configuration.md §6.
-- The four storage.objects policies (owner-scoped writes + public read — the
-- public read is load-bearing for the upsert path, see §6a):

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects for insert to authenticated
  with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects for update to authenticated
  using      ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text )
  with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects for delete to authenticated
  using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select to public
  using ( bucket_id = 'avatars' );

-- =====================================================================
-- END — reproduce a fresh environment: apply this file, then set the two
-- dashboard settings (Auth → Confirm email = OFF; create the `avatars` bucket
-- per §8). Full reproduction checklist: manual-supabase-configuration.md §8.
-- =====================================================================
