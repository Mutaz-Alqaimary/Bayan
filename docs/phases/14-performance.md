# Phase 14 — Performance

## Goal
Optimize the app built so far.

## Build
- Code splitting
- Dynamic imports
- Server Components optimization
- Bundle analysis
- Image optimization
- Caching strategy
- Loading optimization
- Data fetching optimization

## Docs to create
- `Performance.md` — what was measured, what was changed, before/after where possible

## Definition of done
- Bundle analysis was actually run and documented, not assumed.
- Heavy client-only dependencies (charts, table) are dynamically imported where they're not
  needed on first paint.
- No regression in RTL/LTR behavior or required loading/empty/error states from earlier phases.
