# 3. Tables

## profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text not null,

  role text not null check (
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
```

---

## students

```sql
create table students (

  id uuid primary key default gen_random_uuid(),

  student_number text unique not null,

  first_name_ar text not null,

  last_name_ar text not null,

  first_name_en text,

  last_name_en text,

  email text unique not null,

  grade integer not null,

  birth_date date,

  profile_id uuid
  references profiles(id)
  on delete set null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);
```

---

## reading_passages

```sql
create table reading_passages (

  id uuid primary key default gen_random_uuid(),

  title_ar text not null,

  title_en text,

  content_ar text not null,

  content_en text,

  difficulty_level integer not null,

  estimated_minutes integer not null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);
```

---

## reading_sessions

```sql
create table reading_sessions (

  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
  references students(id)
  on delete cascade,

  passage_id uuid not null
  references reading_passages(id)
  on delete cascade,

  words_per_minute integer,

  accuracy_percentage numeric(5,2),

  duration_seconds integer,

  completed_at timestamptz,

  created_at timestamptz not null default now()
);
```

---

## vocabulary_terms

```sql
create table vocabulary_terms (

  id uuid primary key default gen_random_uuid(),

  passage_id uuid not null
  references reading_passages(id)
  on delete cascade,

  word_ar text not null,

  word_en text,

  meaning_ar text not null,

  meaning_en text,

  created_at timestamptz not null default now()
);
```

---

## user_settings

```sql
create table user_settings (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
  references auth.users(id)
  on delete cascade,

  theme text not null default 'system',

  locale text not null default 'ar',

  reduced_motion boolean not null default false,

  email_notifications boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);
```

---

# 4. Indexes

مهم للأداء.

```sql
create index idx_students_email
on students(email);

create index idx_students_number
on students(student_number);

create index idx_reading_sessions_student
on reading_sessions(student_id);

create index idx_reading_sessions_passage
on reading_sessions(passage_id);

create index idx_vocabulary_passage
on vocabulary_terms(passage_id);
```

---

# 5. Row Level Security

فعّل RLS على جميع الجداول.

```sql
alter table profiles enable row level security;
alter table students enable row level security;
alter table reading_passages enable row level security;
alter table reading_sessions enable row level security;
alter table vocabulary_terms enable row level security;
alter table user_settings enable row level security;
```

---

# 6. Recommended Policies

### Profiles

المستخدم يرى ملفه فقط:

```sql
auth.uid() = id
```

---

### User Settings

المستخدم يدير إعداداته فقط:

```sql
auth.uid() = user_id
```

---

### Reading Passages

```sql
authenticated
```

قراءة للجميع.

---

### Vocabulary

```sql
authenticated
```

قراءة للجميع.

---

### Students

في البداية لمشروع CV:

```sql
authenticated
```

ثم لاحقًا اربطها بالأدوار.

---

### Reading Sessions

الطالب يرى جلساته فقط.

---
