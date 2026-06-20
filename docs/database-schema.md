# Database Schema (authoritative — locked)

The Supabase database already exists. **Never** create tables, write migrations, rename columns, or invent tables/columns that aren't listed below — even if a feature seems to need one. If a phase appears to require a column that doesn't exist, stop and flag it instead of inventing it.

## profiles
id, full_name, role, avatar_url, locale, created_at, updated_at

## students
id, student_number, first_name_ar, last_name_ar, first_name_en, last_name_en, email, grade, birth_date, profile_id, created_at, updated_at

## reading_passages
id, title_ar, title_en, content_ar, content_en, difficulty_level, estimated_minutes, created_at, updated_at

## reading_sessions
id, student_id, passage_id, words_per_minute, accuracy_percentage, duration_seconds, completed_at, created_at

## vocabulary_terms
id, passage_id, word_ar, word_en, meaning_ar, meaning_en, created_at

## user_settings
id, user_id, theme, locale, reduced_motion, email_notifications, created_at, updated_at

## Storage
Bucket: `avatars`

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only. Never expose to the client, never log it, never commit it.

## Roles
`admin`, `teacher`, `student` — stored on `profiles.role`. See `auth-and-quality.md` for the permission matrix.