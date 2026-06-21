# RTL & BiDi

How Bayan handles right-to-left layout, Unicode bidi text, and mirroring. Complements
[`Localization.md`](Localization.md) and `.claude/rules/arabic-rtl-i18n.md`.

## Direction

`app/[locale]/layout.tsx` sets `dir={getLocaleDirection(locale)}` on `<html>` (`i18n/routing.ts`:
`ar` → `rtl`, `en` → `ltr`). Everything else mirrors from that single attribute — no component
sets its own direction.

`AppProviders` wraps the tree in Radix's `<DirectionProvider dir={direction}>`, so every Radix
primitive (Select, Dropdown Menu, Tabs, Dialog, Drawer, Tooltip, ...) gets the correct direction
from context instead of defaulting to LTR internals, which is the most common way component
libraries silently break in RTL.

## Logical CSS properties, not physical ones

The codebase uses Tailwind's logical-property utilities everywhere spacing or positioning would
otherwise hardcode a side: `ps-*`/`pe-*`, `ms-*`/`me-*`, `inset-s-*`/`inset-e-*`, `start-*`/`end-*`,
`border-s`/`border-e`, `text-start`. These compile to `padding-inline-start`,
`margin-inline-end`, `inset-inline-start`, etc., which the browser mirrors automatically per
`dir` — so a single class set is correct in both locales. There is no remaining use of physical
`left`/`right`/`ml-`/`mr-`/`pl-`/`pr-`/`text-left`/`text-right` in the codebase (verified by grep
as part of every phase's review).

## Directional icons

Icons that imply direction (chevrons, arrows, "back") use `rtl:rotate-180` so they flip with the
page: pagination previous/next (`components/ui/pagination.tsx`), the dropdown-menu submenu
chevron, and the landing page's hero CTA arrow (`ArrowLeft`/`ArrowRight` swapped by locale in
`app/[locale]/page.tsx`). Decorative icons are `aria-hidden`.

## Animation direction

`tw-animate-css` ships direction-aware, `:dir()`-scoped logical animation utilities
(`slide-in-from-start`, `slide-out-to-end-full`, etc.). The toast exit animation
(`components/ui/toast.tsx`) uses `slide-out-to-end-full` rather than the physical
`slide-out-to-right-full`, so it exits toward the trailing edge in both directions instead of
always sliding right.

## BiDi text (mixed Arabic/English content)

Student names, passage titles, and similar fields can mix scripts in one string. Two tools are
used depending on the case:

- **`lang` attribute** when a whole run of text is in the *other* script from the surrounding
  page — e.g. the locale switcher's target-language label (`<span lang={nextLocale}>`) — so
  screen readers switch pronunciation rules for that span.
- **`<bdi>`** (bidirectional isolate) when a short embedded value (a name, a number, a year) sits
  inside a sentence and must not let its own directionality scramble the surrounding text's
  visual order — e.g. the footer's copyright year (`components/layout/site-footer.tsx`).

## Numbers

**Decision: Western (Latin) digits (`0–9`) everywhere, in both locales.** Mixed digit systems
(Eastern Arabic-Indic `٠١٢٣...` in some places, Western in others) read as inconsistent and is
explicitly called out as a pitfall to avoid in `.claude/rules/arabic-rtl-i18n.md`. Bayan's core
metrics — WPM, accuracy percentage, durations — are numeric-dense (Phase 13), so one consistent,
unambiguous digit system matters more than per-field "authenticity." All literal digits in the
message catalogs use Western digits (e.g. `notFound.code: "404"` in both `ar.json` and
`en.json`). When a later phase formats numbers programmatically (`useFormatter`/
`Intl.NumberFormat`), pass `numberingSystem: "latn"` explicitly rather than relying on the
locale's ICU default, since `ar`'s default numbering system is not guaranteed to be Latin across
environments.

## Tables and data-dense views

Not yet introduced with real data (Phase 7+). `components/ui/table.tsx` itself has no physical
direction baked in — it inherits `dir` from the document the same as everything else — but
TanStack Table's sorting/filter UI and any chart library introduced later must be verified
explicitly for RTL once they carry real content, per `.claude/rules/arabic-rtl-i18n.md`; don't
assume a data-grid or charting library defaults to RTL-correct behavior.

## Accessibility & reading order

Reading order and focus order follow the *visual* RTL layout, not the underlying markup order —
verified for the current component set (Phase 3) via the verification gallery
(`app/[locale]/ui`) with a real Tab-order walk in both directions. See `.claude/rules/
design-system.md` and the `a11y-auditor` subagent for the standing requirement on every new
screen.
