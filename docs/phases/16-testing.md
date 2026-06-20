# Phase 16 — Testing

## Goal
Establish a real test suite for what's been built.

## Build
- Unit tests
- Integration tests
- Form validation tests (Zod schemas)
- Localization tests
- RTL tests

## Docs to create
- `Testing.md` — what's covered, how to run tests, testing conventions for future phases

## Definition of done
- Critical paths covered: auth, reading session WPM/accuracy calculation, CRUD validation,
  role gating.
- RTL/localization tests actually assert direction/translated copy, not just that components
  render.
- `npm run test` (or documented equivalent) runs clean.
