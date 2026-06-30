# Phase 15 — Accessibility Audit

> **Status: Complete — awaiting the owner's manual visual/AT testing.** This spec was rewritten
> against the **current** architecture (post Phases 1→14) and supersedes the original short draft,
> which predated the code and was a generic checklist. For how the system works today, the single
> source of truth is [`docs/project/current-architecture.md`](../project/current-architecture.md).
>
> **Companion doc (evidence):** [`Accessibility.md`](../../Accessibility.md) at repo root holds the
> findings register (executive summary, methodology, major findings, fixed, deferred, final status).
> This file holds the **methodology and decision log**; `Accessibility.md` holds the **findings**.
> Each fact has one home — reasoning here, evidence there (the Phase 14 `Performance.md` convention).

---

## Guiding principle

Accessibility was **built in from Phase 3**, not deferred to here (see `.claude/rules/code-quality.md`:
"accessible components by default, not retrofitted in Phase 15"). Phase 15 is therefore a
**Verify → Document → Fix-confirmed-defects** pass over an already-accessible platform — **not** a
build, redesign, refactor, or cleanup phase. *"Audited, conformant, no change needed"* is the
expected and correct outcome for most surfaces, recorded with the evidence that supports it. WCAG 2.1
AA is **guidance for practical fixes**, not a certification target; theoretical edge cases are
deferred, not chased.

## Scope guardrails

- **Stack fully locked.** No new dependency, no `package.json` change. The static gate is the
  `jsx-a11y` rule subset **already active** via `eslint-config-next`; the lint config was **not**
  expanded.
- **Audit phase, not an improvement phase.** Verify, document, and fix **confirmed** accessibility
  defects only. No UI redesign, no UX enhancement, no component refactor, no opportunistic cleanup.
- **Preserve the existing UI/UX.** Layout, interaction, and visual design change **only** when a
  verified accessibility issue can't be fixed otherwise. Smallest correct change wins.
- **Minimal architecture.** No new folders, utilities, hooks, or abstractions. Fixes go **inside
  existing components** so they propagate. The only new artifact is `Accessibility.md` at repo root.

## Phase boundaries (what Phase 15 is NOT)

- **Automated accessibility testing → Phase 16 (Testing).** Phase 15 verifies *manually* (the
  static `jsx-a11y` subset + code-path audit + the manual AT method below); it stands up no test
  runner (jest-axe / Playwright keyboard runs are Phase 16).
- **Security & authorization → Phase 17.** Whether a non-admin can *reach* a privileged action is a
  security property; Phase 15 only manages focus around what is actually rendered.
- **RTL *implementation* → Phase 4.** Phase 15 verifies only **reading order, focus order, and AT
  announcement** in RTL — not visual mirroring (that was Phase 4; see `RTL.md`).
- **No expansion into unrelated improvements.** Off-scope discoveries are logged in
  `Accessibility.md` → Deferred Items, never implemented.

## Method

1. **Static gate.** `eslint-config-next` already activates a `jsx-a11y` subset (alt-text,
   aria-props/proptypes, aria-unsupported-elements, role-has/supports-required-aria-props, etc.).
   `npx eslint .` is the regression floor and was confirmed clean (0 errors).
2. **Code-path audit.** Every implemented surface (the `IMPLEMENTED_ROUTES` set + auth flows + the
   reader) was read against a fixed checklist: keyboard reachability & order, visible focus, focus
   trap/restoration in overlays, names/labels, `aria-*` correctness, live-region announcement
   quality, RTL reading/focus order, reduced-motion respect, and contrast via the design tokens.
3. **Manual AT pass (owner).** A keyboard-only walk + one screen-reader pass (NVDA/Firefox or
   VO/Safari) per surface class, contrast re-checked in **both themes** (structural checks run once
   per surface — theme does not change DOM/focus). This is the owner's manual testing step.

## Remediation protocol (how every fix was made)

1. **Root cause before editing.** Recurring findings are fixed in the shared primitive; a feature
   component is patched only when the defect is genuinely feature-specific. No duplicate fixes.
2. **Map consumers before editing a primitive.** Confirm the change is behavior- and API-preserving
   for every consumer.
3. **Smallest correct change.** No refactor, API redesign, contract change, or visual change unless a
   verified issue requires it. Backward compatibility is the default.
4. **Per-finding verification gate:** original issue fixed · no consumer regression · keyboard still
   works · RTL reading/focus order still correct · reduced-motion unchanged · UX preserved.

## Outcome (summary — full evidence in `Accessibility.md`)

The platform was found to be in **strong accessibility shape by construction** — Radix primitives
with `DirectionProvider` wired for RTL, a real skip link, labeled icon-only buttons, `aria-sort` on
sortable headers, `aria-live` counts on filtered lists, `sr-only` data tables behind every SVG chart,
form fields wired with `aria-invalid`/`aria-describedby`/`role="alert"`, `<html lang>`/`dir` set per
locale, every Radix `Dialog` carrying a `DialogTitle`, the timed reader hiding its ticking clock from
AT behind a static `role="status"`, and reduced-motion honored via `MotionProvider`.

**One confirmed defect was found and fixed** (WCAG 4.1.3 Status Messages, AA): the analytics
`StudentPicker` filtered results live but never announced the result count to screen readers —
inconsistent with the roster table's own announced-count pattern. Fixed with the smallest
behavior-preserving change (an `sr-only` `aria-live="polite"` count region + one ICU-plural message in
`en`/`ar`). No shared primitive or UI changed. See `Accessibility.md` → Fixed Issues.

## Definition of done

- `npx eslint .` clean against the existing `jsx-a11y` subset; **no `package.json`/dependency change**;
  lint config unchanged.
- Every surface class recorded in `Accessibility.md` with a verdict (pass / fixed / deferred).
- Overlays verified for focus trap + restoration; skip link reaches `#main-content` on every page.
- RTL reading & focus order verified on tables, charts, and the reader (method recorded).
- Reduced-motion respected wherever motion exists; contrast checked in both themes.
- Existing UI/UX preserved except the one verified fix.
- `next build` + `eslint` green; no schema/SQL/auth change.

## Decision log

- **2026-06-30 — Static gate: did not add `eslint-plugin-jsx-a11y` as a direct dep.** The plugin is
  already present transitively via `eslint-config-next`, which activates a curated subset. Per the
  locked-stack directive, the config was left unchanged rather than expanded; the manual code-path +
  AT passes cover what the subset doesn't. No dependency change at all.
- **2026-06-30 — `StudentPicker` count resolved in the client component, not passed as a prop.** The
  announcement depends on the live match count and the parent (`cohort-overview`) is a Server
  Component that cannot pass a count-formatting function across the boundary. Using `useTranslations`
  for the one count string (the component is already `"use client"`, and the peer `students-table`
  resolves its own i18n the same way) was smaller than threading pre-pluralized strings and changed
  no existing prop or call site.
- **2026-06-30 — `autoFocus` on destructive-dialog Cancel buttons kept.** It deliberately lands focus
  on the safe (Cancel) action so an accidental Enter cancels rather than confirms — a focus-management
  *feature*, not a defect. Left unchanged (behavior preservation); recorded as an observation.
- **2026-06-30 — No shared primitive changed.** The single defect was feature-local; the primitives
  (dialog, drawer, table, select, tabs, toast, dropdown, checkbox, pagination, button, input) audited
  clean, so there was no root cause to fix upstream.
