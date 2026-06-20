-- =====================================================
-- BAYAN PLATFORM
-- SUPABASE SETUP
-- =====================================================

-- =====================================================
-- TABLES
-- =====================================================

create table if not exists public.profiles (

id uuid primary key
references auth.users(id)
on delete cascade,

full_name text not null,

role text not null
check (
role in (
'admin',
'teacher',
'student'
)
),

avatar_url text,

locale text not null default 'ar',

created_at timestamptz not null default now(),

updated_at timestamptz not null default now()
);

---

create table if not exists public.students (

id uuid primary key
default gen_random_uuid(),

student_number text unique not null,

first_name_ar text not null,

last_name_ar text not null,

first_name_en text,

last_name_en text,

email text unique not null,

grade integer not null,

birth_date date,

profile_id uuid
references public.profiles(id)
on delete set null,

created_at timestamptz not null default now(),

updated_at timestamptz not null default now()
);

---

create table if not exists public.reading_passages (

id uuid primary key
default gen_random_uuid(),

title_ar text not null,

title_en text,

content_ar text not null,

content_en text,

difficulty_level integer not null,

estimated_minutes integer not null,

created_at timestamptz not null default now(),

updated_at timestamptz not null default now()
);

---

create table if not exists public.reading_sessions (

id uuid primary key
default gen_random_uuid(),

student_id uuid not null
references public.students(id)
on delete cascade,

passage_id uuid not null
references public.reading_passages(id)
on delete cascade,

words_per_minute integer,

accuracy_percentage numeric(5,2),

duration_seconds integer,

completed_at timestamptz,

created_at timestamptz not null default now()
);

---

create table if not exists public.vocabulary_terms (

id uuid primary key
default gen_random_uuid(),

passage_id uuid not null
references public.reading_passages(id)
on delete cascade,

word_ar text not null,

word_en text,

meaning_ar text not null,

meaning_en text,

created_at timestamptz not null default now()
);

---

create table if not exists public.user_settings (

id uuid primary key
default gen_random_uuid(),

user_id uuid not null unique
references auth.users(id)
on delete cascade,

theme text not null default 'system',

locale text not null default 'ar',

reduced_motion boolean not null default false,

email_notifications boolean not null default true,

created_at timestamptz not null default now(),

updated_at timestamptz not null default now()
);

-- =====================================================
-- INDEXES
-- =====================================================

create index if not exists idx_students_email
on public.students(email);

create index if not exists idx_students_number
on public.students(student_number);

create index if not exists idx_reading_sessions_student
on public.reading_sessions(student_id);

create index if not exists idx_reading_sessions_passage
on public.reading_sessions(passage_id);

create index if not exists idx_vocabulary_passage
on public.vocabulary_terms(passage_id);

-- =====================================================
-- UPDATED_AT FUNCTION
-- =====================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
new.updated_at = now();
return new;
end;
$$;

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

drop trigger if exists profiles_updated_at
on public.profiles;

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

---

drop trigger if exists students_updated_at
on public.students;

create trigger students_updated_at
before update on public.students
for each row
execute function public.handle_updated_at();

---

drop trigger if exists reading_passages_updated_at
on public.reading_passages;

create trigger reading_passages_updated_at
before update on public.reading_passages
for each row
execute function public.handle_updated_at();

---

drop trigger if exists user_settings_updated_at
on public.user_settings;

create trigger user_settings_updated_at
before update on public.user_settings
for each row
execute function public.handle_updated_at();

-- =====================================================
-- ENABLE RLS
-- =====================================================

alter table public.profiles
enable row level security;

alter table public.students
enable row level security;

alter table public.reading_passages
enable row level security;

alter table public.reading_sessions
enable row level security;

alter table public.vocabulary_terms
enable row level security;

alter table public.user_settings
enable row level security;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

create policy "profiles_select_own"
on public.profiles
for select
using (
auth.uid() = id
);

create policy "profiles_update_own"
on public.profiles
for update
using (
auth.uid() = id
);

-- =====================================================
-- USER SETTINGS POLICIES
-- =====================================================

create policy "settings_select_own"
on public.user_settings
for select
using (
auth.uid() = user_id
);

create policy "settings_insert_own"
on public.user_settings
for insert
with check (
auth.uid() = user_id
);

create policy "settings_update_own"
on public.user_settings
for update
using (
auth.uid() = user_id
);

-- =====================================================
-- READING PASSAGES POLICIES
-- =====================================================

create policy "reading_passages_authenticated_select"
on public.reading_passages
for select
to authenticated
using (true);

-- =====================================================
-- VOCABULARY TERMS POLICIES
-- =====================================================

create policy "vocabulary_terms_authenticated_select"
on public.vocabulary_terms
for select
to authenticated
using (true);

-- =====================================================
-- STUDENTS POLICIES
-- =====================================================

create policy "students_authenticated_select"
on public.students
for select
to authenticated
using (true);

create policy "students_authenticated_insert"
on public.students
for insert
to authenticated
with check (true);

create policy "students_authenticated_update"
on public.students
for update
to authenticated
using (true);

-- =====================================================
-- READING SESSIONS POLICIES
-- =====================================================

create policy "reading_sessions_select_own"
on public.reading_sessions
for select
to authenticated
using (
true
);

create policy "reading_sessions_insert_authenticated"
on public.reading_sessions
for insert
to authenticated
with check (
true
);

-- =====================================================
-- END
-- =====================================================
