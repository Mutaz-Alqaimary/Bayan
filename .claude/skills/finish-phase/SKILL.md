---
description: Close out the current Bayan build phase with the required stop-and-review report — implementation summary, architecture explanation, review checklist — then explicitly stop and wait for approval. Use once a phase's Build list is fully implemented.
disable-model-invocation: false
---

Produce a structured close-out report for the phase just completed, then stop. Do not start any
other phase's work after this, even if it seems like the natural next step — wait for the user.

Structure the report as:

### 1. What was implemented
Concrete list of what was built/changed, file by file or feature by feature. Call out anything
from the phase's "Build" list that was intentionally **not** done and why.

### 2. Architecture notes
Where things live and why (feature folders, Server vs. Client Component choices, new stores/
types added — confirm they follow `.claude/rules/naming-conventions.md`), and any notable
decisions or trade-offs made.

### 3. Review checklist
Walk through, explicitly checked or flagged:

- [ ] Matches `.claude/rules/database-schema.md` exactly — no invented tables/columns
- [ ] Naming matches `.claude/rules/naming-conventions.md`
- [ ] Strict TypeScript, no `any`, ESLint clean
- [ ] Zod validation on forms and client/server boundaries, with localized messages
- [ ] RTL/LTR correct, logical CSS properties used, no hardcoded direction
- [ ] Loading, empty, and error states present on every list/detail view
- [ ] Dark mode verified
- [ ] Responsive at phone/tablet/desktop
- [ ] Accessible (keyboard, focus, screen reader, RTL reading order)
- [ ] Required phase docs created (if this phase calls for any)
- [ ] No placeholders, TODOs, or mock data left in

If anything is unchecked, say so plainly rather than glossing over it.

### 4. Suggested follow-up review
Recommend running `code-reviewer`, `design-reviewer`, and/or `a11y-auditor` if they weren't
already run during implementation.

### 5. Next phase
Name the next phase in sequence per `docs/phases/00-index.md`, and explicitly state that you are
waiting for approval before starting it.
