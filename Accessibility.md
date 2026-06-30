# Bayan — Accessibility Record (Phase 15)

> The **evidence** record for Phase 15 (Accessibility Audit). Reasoning and methodology live in
> [`docs/phases/15-accessibility-audit.md`](docs/phases/15-accessibility-audit.md); findings live
> here. Companion to [`RTL.md`](RTL.md) (RTL implementation, Phase 4) — RTL *reading/focus order*
> findings are recorded here; RTL *visual* correctness is Phase 4's record.
>
> **Status:** Phase 15 complete — awaiting the owner's manual screen-reader/keyboard pass.
> **Method date:** 2026-06-30, Next.js 16.2.9.

---

## 1. Executive summary

Bayan was audited for practical WCAG 2.1 AA accessibility across every implemented surface. The
platform is **accessible by construction**: it is built on Radix primitives (with Radix
`DirectionProvider` wired for RTL keyboard/focus behavior), uses logical CSS properties throughout,
and had accessibility designed in from Phase 3 rather than retrofitted here. The audit confirmed a
high baseline and found **one** confirmed AA defect, which was fixed with a minimal,
behavior-preserving change. No shared primitive, layout, or visual design was altered. The stack
stayed fully locked (no new dependency). The result is a **solid, production-ready** accessibility
level — the goal of this phase.

| Metric | Result |
| --- | --- |
| Surfaces audited (primitives + routes + flows) | All implemented surfaces |
| Confirmed AA defects found | **1** |
| Defects fixed | **1** |
| Shared primitives changed | **0** |
| New dependencies | **0** |
| Deferred (non-blocking) items | 3 (logged below) |
| `eslint` / `tsc` / `build` | ✓ / ✓ / ✓ |

## 2. Audit methodology

1. **Static gate** — `eslint-config-next` already activates a `jsx-a11y` rule subset (alt-text,
   aria-props/proptypes, aria-unsupported-elements, role-has/supports-required-aria-props, etc.).
   `npx eslint .` is clean (0 errors; 4 pre-existing React-Compiler/TanStack warnings, unrelated and
   documented in `docs/Performance.md`). No new lint rules or dependencies were added.
2. **Code-path audit** — each surface was read against a fixed checklist: keyboard reachability &
   order, visible focus, focus trap/restoration in overlays, accessible names/labels, `aria-*`
   correctness, live-region announcement quality, RTL reading/focus order, reduced-motion respect,
   and contrast via the design tokens.
3. **Manual AT pass (owner step)** — keyboard-only walk + one screen-reader pass per surface class;
   contrast re-checked in both light and dark themes. Structural checks run once per surface (theme
   does not change DOM or focus order).

## 3. Major findings (what was verified)

Recorded at the level of findings, not per-cell checklists.

**Strengths confirmed (representative, not exhaustive):**

- **Global** — `<html lang>` + `dir` set per locale; a real, focus-revealed skip link targets
  `#main-content`, which exists in every layout; landmark `<main>` present; one `<h1>` per page.
- **Primitives** — Radix-based dialog/drawer/select/tabs/dropdown/tooltip/toast/checkbox/switch/
  radio give focus trapping, restoration, and RTL arrow-key behavior (via `DirectionProvider`).
  Buttons/inputs/tabs/select expose `focus-visible` rings; `Input`/`SelectTrigger` reflect
  `aria-invalid`.
- **Tables** — `aria-sort` set per `<th>` from sort state; sortable headers are real buttons; search
  is labeled; filtered/page counts use `aria-live="polite"`; mobile cards carry `sr-only` field
  labels; icon-only row-action triggers are `aria-label`-ed.
- **Forms** — fields wire `aria-invalid` + `aria-describedby`, and errors use `role="alert"`.
- **Charts (analytics)** — each SVG is `aria-hidden` and paired with an `sr-only` data `<table>`
  (caption + `scope`), so trends are never AT-invisible.
- **Reader** — the per-second clock is `aria-hidden`; a static `role="status"` announces a reading is
  in progress; focus moves to the heading on phase change; cancel is `sr-only`-labeled.
- **Nav** — active item carries `aria-current="page"`; not-yet-built items are `aria-disabled` with a
  visible badge (never a 404); icons `aria-hidden`.
- **Dialogs** — every `DialogContent` has a `DialogTitle` (no missing accessible name); destructive
  dialogs deliberately `autoFocus` the safe Cancel action.
- **Motion** — reduced motion honored via `MotionProvider` + `prefers-reduced-motion`.

## 4. Fixed issues

| # | Surface | Issue | WCAG | Fix | Verification |
| --- | --- | --- | --- | --- | --- |
| 1 | `features/analytics/components/student-picker.tsx` | The type-to-filter student lookup updated its results list live but never announced the result count to screen readers — a user typing got no feedback that matches appeared or that there were none. Inconsistent with the roster table, which announces its filtered count via `aria-live`. | 4.1.3 Status Messages (AA) | Added an `sr-only` `role="status"` `aria-live="polite"` region announcing the match count, plus one ICU-plural message (`analytics.students.searchResults`) in `en`/`ar`. No visual, layout, or API change; the visible list is unchanged. | `tsc` ✓, `eslint` ✓, `build` ✓. Keyboard/RTL unaffected (no focusable change); announcement is concise (count, not the full list) so it is not chatty. |

**Files modified for the fix:** `features/analytics/components/student-picker.tsx`,
`messages/en.json`, `messages/ar.json`. No shared primitive touched (the defect was feature-local).

## 5. Deferred issues (non-blocking — not implemented, by design)

- **`StudentPicker` full ARIA combobox semantics.** It is intentionally a labeled search input + a
  list of real links (a secondary lookup), not a `role="combobox"` with `aria-activedescendant`
  keyboard model. With the count now announced, it meets AA. Upgrading to a full combobox is a UX
  enhancement, not a defect → deferred.
- **Visible chart `<figcaption>` / data-table toggle.** The `sr-only` data table already makes every
  chart AT-accessible; a *visible* on-demand data table is a UX nicety, not an AA requirement →
  deferred.
- **Automated accessibility regression tests** (jest-axe / Playwright keyboard & SR snapshots) →
  **Phase 16 (Testing)**, by design — same harness, built once.

## 6. Final accessibility status

Bayan is at a **solid, production-ready accessibility level** for WCAG 2.1 AA in both Arabic (RTL) and
English (LTR), light and dark themes. The audit confirmed a strong built-in baseline, fixed the one
confirmed AA gap, and deferred only non-blocking enhancements. Pending: the owner's manual
screen-reader/keyboard pass to confirm the code-path findings in a live AT environment (the items in
§3 are the checklist for that pass). No schema, dependency, or architectural change was introduced.
