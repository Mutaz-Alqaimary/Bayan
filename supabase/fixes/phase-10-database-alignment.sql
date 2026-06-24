-- =====================================================================
-- BAYAN — PHASE 10 DATABASE ALIGNMENT
-- Corrective GRANTs + missing RLS policies for the Phase 5–10 implementation.
-- =====================================================================

-- ---------- SECTION A: GRANTS for authenticated ----------

grant select on public.profiles to authenticated;

grant select, insert, update, delete
on public.students
to authenticated;

grant select, insert, update, delete
on public.reading_passages
to authenticated;

grant select, insert, update, delete
on public.vocabulary_terms
to authenticated;

grant select, insert
on public.reading_sessions
to authenticated;

-- ---------- SECTION B: GRANTS for service_role ----------

grant select, insert
on public.profiles
to service_role;

-- ---------- SECTION C: MISSING RLS POLICIES ----------

-- students DELETE

drop policy if exists "students_authenticated_delete"
on public.students;

create policy "students_authenticated_delete"
on public.students
for delete
to authenticated
using (true);

-- reading_passages INSERT

drop policy if exists "reading_passages_authenticated_insert"
on public.reading_passages;

create policy "reading_passages_authenticated_insert"
on public.reading_passages
for insert
to authenticated
with check (true);

-- reading_passages UPDATE

drop policy if exists "reading_passages_authenticated_update"
on public.reading_passages;

create policy "reading_passages_authenticated_update"
on public.reading_passages
for update
to authenticated
using (true)
with check (true);

-- reading_passages DELETE

drop policy if exists "reading_passages_authenticated_delete"
on public.reading_passages;

create policy "reading_passages_authenticated_delete"
on public.reading_passages
for delete
to authenticated
using (true);

-- vocabulary_terms INSERT

drop policy if exists "vocabulary_terms_authenticated_insert"
on public.vocabulary_terms;

create policy "vocabulary_terms_authenticated_insert"
on public.vocabulary_terms
for insert
to authenticated
with check (true);

-- vocabulary_terms UPDATE

drop policy if exists "vocabulary_terms_authenticated_update"
on public.vocabulary_terms;

create policy "vocabulary_terms_authenticated_update"
on public.vocabulary_terms
for update
to authenticated
using (true)
with check (true);

-- vocabulary_terms DELETE

drop policy if exists "vocabulary_terms_authenticated_delete"
on public.vocabulary_terms;

create policy "vocabulary_terms_authenticated_delete"
on public.vocabulary_terms
for delete
to authenticated
using (true);
