# Phase 9 — CSV/XLSX Import & Export

## Goal
Bulk student management via CSV/XLSX, using SheetJS.

## Build
- CSV Import
- CSV Export
- XLSX Import
- XLSX Export
- Validation
- Error handling
- Preview before import

## Definition of done
- Import preview clearly shows what will be created/updated before committing, with per-row
  validation errors surfaced in plain language (which row, which field, what's wrong).
- Import only ever writes to the `students` table via the existing schema — never alters schema.
- Export correctly handles Arabic text encoding (no mojibake when opened in Excel).
