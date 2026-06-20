# Phase 10 — Reading Fluency

## Goal
The core measurement loop: a student completes a reading session and the app records
speed/accuracy/duration into `reading_sessions`.

## Build
- Reading session workflow
- WPM calculation
- Accuracy tracking
- Duration tracking
- Reading history
- Progress tracking

## Definition of done
- `reading_sessions` rows are written with correct `words_per_minute`,
  `accuracy_percentage`, `duration_seconds`, `completed_at` tied to the right `student_id` and
  `passage_id`.
- WPM/accuracy calculations are documented (show the formula) so a teacher could sanity-check
  them.
- Reading history view is genuinely useful to a student, not a raw table dump.
