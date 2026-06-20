# Bayan — Claude Code Project Scaffold

This is **not the app** — it's the Claude Code configuration and reference docs that drive how
Claude builds the actual Bayan Next.js/Supabase application, phase by phase, from your original
prompt.

## What's in here

```
CLAUDE.md                  # Always-loaded project memory: identity, non-negotiables, workflow
.claude/
  settings.json             # Shared project permissions (schema-lock, safe commands) — commit this
  settings.local.json.example  # Copy to settings.local.json for personal/machine overrides
  rules/                     # Topic-scoped, always-loaded conventions (short, specific)
  agents/                    # Read-only review subagents
  skills/                    # /start-phase, /finish-phase, design-pass workflow commands
docs/
  PRD.md                     # Full product context (read on demand, not auto-loaded)
  phases/                    # The 20-phase build plan, one file per phase
```

## How to use it

1. Copy this whole folder into a new (or existing) Next.js project root — or initialize your
   Next.js/Supabase project here directly.
2. `cd` into the project and run `claude`.
3. Run `/init` if you also want Claude to layer in anything it discovers about the repo
   (build commands, etc.) on top of the hand-written `CLAUDE.md` — it won't overwrite it.
4. Start the first phase:
   ```
   /start-phase 1
   ```
5. Review what Claude produces. When you're satisfied, approve and move to the next phase the
   same way:
   ```
   /start-phase 2
   ```
6. Each phase ends with `/finish-phase`, which Claude should run automatically once a phase's
   build list is complete — it produces a summary, architecture notes, and a review checklist,
   then stops and waits. If it doesn't stop on its own, that's worth flagging — the workflow
   rule in `CLAUDE.md` says it should.

## Why it's structured this way

- **`CLAUDE.md` stays short** (loaded in full, every session) and just orients Claude + points
  to everything else, per Claude Code's own guidance that long CLAUDE.md files reduce
  instruction adherence.
- **`.claude/rules/`** holds the things that are true in *every* phase (schema, naming,
  architecture, RTL, design bar, code quality) — split into topic files instead of one giant
  file, also always loaded but easy to maintain independently.
- **`docs/phases/`** holds the 20-phase build plan as reference material Claude reads on demand
  via `/start-phase`, instead of loading all 20 phases into context at once.
- **Skills** (`start-phase`, `finish-phase`, `design-pass`) encode the *process* your original
  prompt specified — one phase at a time, design before code, stop-and-review at the end of each
  phase — as something Claude actually runs, not just text it might forget mid-session.
- **Subagents** (`code-reviewer`, `design-reviewer`, `a11y-auditor`) are read-only reviewers
  Claude can delegate to so review output doesn't bloat your main conversation, and so you get a
  second, focused pass against the project's specific rules rather than generic feedback.
- **`.claude/settings.json`** hard-blocks edits to `supabase/migrations/**` and `*.sql` files
  (your prompt is explicit that the schema already exists and must not change) and requires
  confirmation before any `supabase db push`/`db reset`/`migration` command runs — this is a
  permission-layer enforcement, not just a CLAUDE.md instruction Claude could talk itself out of.

## Adjust before you start

- `.claude/settings.json` allow-lists `npm run dev/build/lint/test`. If you use `pnpm` or `yarn`,
  update those commands.
- Fill in real values only in your own `.env.local` (gitignored) — never commit Supabase keys.
  `.claude/settings.local.json.example` shows the shape if you want to reference env vars from
  Claude Code's local settings, but the actual secrets belong in `.env.local`.
- If your team wants this in version control (recommended — `.claude/` is meant to be shared),
  commit everything except `.claude/settings.local.json` and `CLAUDE.local.md` (see
  `.gitignore`).
