# Authorization & Code Quality (authoritative)

## Roles
`admin`, `teacher`, `student` (stored on `profiles.role`).

## Minimum permissions
**Admin** — full platform access: user management, student management, reading content management, reporting access.

**Teacher** — student management, reading content management, reading analytics access, reporting access.

**Student** — view assigned content, complete reading sessions, view personal progress, manage personal settings only.

Enforce these boundaries at the route/layout level (server-side checks) in addition to hiding UI — never rely on hidden UI alone for authorization.

## Code quality
- Strict TypeScript everywhere; ESLint clean.
- Zod validation on every form and every boundary where external/user input enters the system.
- Reusable, accessible components — no one-off unstyled markup.
- Every async view has loading, empty, and error states (see `arabic-and-design.md`).
- No placeholders, TODO comments, mock implementations, fake APIs, or fake data unless explicitly requested.
- Production-ready code only — this is a CV-quality, school-ready deliverable, not a prototype.