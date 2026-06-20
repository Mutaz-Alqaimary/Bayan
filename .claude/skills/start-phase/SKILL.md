---
description: Start a specific build phase of the Bayan platform, loading its spec from docs/phases/ and following the project's design-then-implement, one-phase-at-a-time workflow. Use when the user says start phase, begin phase, do phase N, or names one of the 20 Bayan phases by number or topic.
argument-hint: [phase-number-or-keyword]
disable-model-invocation: true
---

## Phase docs available
!`ls docs/phases 2>/dev/null`

## Instructions

1. Find the file in `docs/phases/` that matches `$ARGUMENTS` (by number prefix or by topic
   keyword). If `$ARGUMENTS` is empty or ambiguous, read `docs/phases/00-index.md` and ask which
   phase to start.
2. Read the matched phase file in full.
3. Read `CLAUDE.md` and every file in `.claude/rules/` if you haven't already this session, so
   the phase is built against the actual project conventions, not assumptions.
4. **Before writing any code**, run the design process for anything user-facing in this phase:
   analyze user goals → UX → information architecture → page layout → component hierarchy →
   responsive behavior → accessibility behavior. Use the `design-pass` skill for this. Share the
   plan briefly before implementing.
5. Implement **only** what's listed under this phase's "Build" list. Do not start work that
   belongs to a different phase, even if it seems convenient to bundle in.
6. Follow `.claude/rules/code-quality.md` throughout: no placeholders, Zod validation, proper
   loading/empty/error states, strict TypeScript.
7. If this phase lists specific `.md` documents to create (e.g. `Architecture.md`,
   `Security.md`), create them as part of the phase, not as an afterthought.
8. Once every item in the phase's "Build" list (and any required docs) is complete, run
   `/finish-phase` to close it out. Do not continue to the next phase on your own.
