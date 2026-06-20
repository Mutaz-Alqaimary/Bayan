# Phase 18 — Reporting

## Goal
Generate meaningful reports for students and teachers, including PDF export.

## Build
- Student reports
- Teacher reports
- Reading progress reports
- PDF export

## Requirements
- Arabic PDF support
- English PDF support
- RTL PDF layout

## Definition of done
- PDF correctly renders Arabic text and RTL layout (a common failure point — verify explicitly,
  don't assume the PDF library handles Arabic shaping/direction by default).
- Reports surface the Phase 13 analytics in a form a teacher could hand to a parent or
  administrator.
- Empty/error states for "not enough session data yet to generate a report."
