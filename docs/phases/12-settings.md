# Phase 12 — Settings

## Goal
Personal settings backed by `user_settings`.

## Build
- Theme settings
- Locale settings
- Reduced motion settings
- Notification settings

## Definition of done
- Maps directly to `user_settings` columns: `theme`, `locale`, `reduced_motion`,
  `email_notifications` — no invented columns.
- Theme/reduced-motion changes take effect immediately app-wide, not just on next reload.
- Form uses Zod validation with localized messages, consistent with every other form in the app.
