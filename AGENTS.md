<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Engineering Rules

- Before build any thing, if library or package or files is exsit in files of project or it exists in package.json file, you don't repeat setup it, like Next.js or React or tailwind, etc..., I setup these previously.

- Use frontend-design skill.

## Next.js

- App Router only
- Use Route Handlers when needed
- Use Server Components by default

## State

- Zustand only

## Forms

- React Hook Form
- Zod

## Styling

- Tailwind CSS 4
- shadcn/ui

## Localization

- next-intl

## Database

- Supabase only

## Quality

- Strict TypeScript
- ESLint clean
- No any types

## Project

Bayan

Arabic Literacy & Reading Fluency Platform

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- next-intl
- Zustand
- shadcn/ui

## Rules

- Use frontend-design skill.
- App Router only
- Server Components by default
- Client Components only when required
- TypeScript strict mode
- Arabic-first
- RTL support
- Use existing Supabase schema only
- Never create migrations
- Never rename database columns

## Workflow

Work one phase only.

Stop after every phase.

Wait for approval.

## Environment Variables

Use:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

Never hardcode secrets.

Never expose service role keys to the client.

# NEXT.JS RULES

Always prefer modern Next.js App Router patterns.

Use:

- App Router only
- Server Components by default
- Client Components only when necessary

Never use legacy Pages Router patterns.

Prefer:

- Server Actions
- Route Handlers
- Streaming
- Suspense
- Loading UI
- Error Boundaries

---

# DATA FETCHING RULES

Preferred approach:

- Fetch data in Server Components
- Use native fetch()
- Use cache and revalidation properly
- Use revalidateTag when necessary

Mutations:

- Prefer Server Actions

Avoid:

- unnecessary REST endpoints
- duplicated API layers
- fetching server data inside Client Components unnecessarily

Never duplicate server state into client stores.

---

# STATE MANAGEMENT RULES

Always choose state strategy in this order:

1. Server State
2. URL State
3. Local Component State
4. Context API
5. Zustand

Avoid introducing additional state libraries.

---

# URL STATE RULES

Use URL state for:

- filters
- sorting
- pagination
- tabs
- search state

Benefits:

- shareable
- persistent
- SEO friendly
- predictable

---

# CONTEXT RULES

Use Context ONLY for:

- theme
- locale
- auth session access
- global UI preferences

Avoid:

- large frequently changing state
- server data
- performance-heavy updates

---

# COMPONENT RULES

Requirements:

- Single responsibility
- Highly reusable
- Small components
- Composition over inheritance

Separate:

- UI
- business logic
- data access
- animations

Avoid giant components.

---

# STYLING RULES

Use:

- Tailwind CSS 4
- CSS Variables
- shadcn/ui

Requirements:

- Mobile-first
- Consistent spacing
- Consistent design tokens
- Responsive by default

Avoid:

- inline styles
- duplicated styling patterns

---

# RESPONSIVE DESIGN RULES

Every feature must support:

- mobile
- tablet
- desktop

Requirements:

- fluid layouts
- responsive tables
- responsive forms
- responsive navigation

Avoid fixed-width layouts.

---

# SEO RULES

Use:

- Metadata API
- generateMetadata()
- Open Graph metadata
- Twitter metadata
- Canonical URLs
- robots.txt
- sitemap.xml

Prefer server-rendered SEO content.

Avoid SEO-critical client-only rendering.

---

# PERFORMANCE RULES

Optimize for:

- Core Web Vitals
- bundle size
- hydration cost
- rendering performance

Requirements:

- minimize client JavaScript
- dynamic import heavy components
- optimize images
- optimize fonts
- avoid unnecessary re-renders

---

# ACCESSIBILITY RULES

Requirements:

- semantic HTML
- keyboard navigation
- proper heading hierarchy
- aria labels
- focus management
- reduced motion support

All animations must respect:

prefers-reduced-motion

---

# SECURITY RULES

Requirements:

- Never expose secrets
- Validate all user input
- Sanitize user content
- Keep sensitive logic on the server
- Use environment variables correctly

Validation:

- Zod

---

# AUTHORIZATION RULES

Authorization checks MUST happen in:

- Server Components
- Server Actions
- Route Handlers
- Data Access Layer

Never rely only on client-side protection.

---

# ROUTE PROTECTION RULES

Use:

- Proxy for optimistic checks
- Secure server-side authorization for real protection

Never depend on Proxy alone.

Always validate permissions server-side.

---

# SUPABASE RULES

Use:

- Supabase Auth
- Supabase Database
- Supabase Storage

Use ONLY the approved database schema.

Never:

- rename tables
- rename columns
- create alternative schemas
- generate migrations
- invent database structures

Database is already provisioned.

Respect the existing schema exactly.

---

# ARABIC-FIRST RULES

Arabic is the primary language.

Requirements:

- RTL first
- Unicode-safe rendering
- BiDi text support
- Arabic typography
- Arabic accessibility
- Arabic validation messages
- Arabic error messages
- Arabic search support
- Arabic sorting awareness
- Arabic content readability

Arabic experience takes priority over English experience.

---

# LOCALIZATION RULES

Use:

- next-intl

Requirements:

- localized routes
- localized metadata
- localized validation
- localized errors
- localized toasts

Never hardcode user-facing strings.

All user-facing text must be localizable.

---

# AI WORKFLOW RULES

Before generating code:

1. Inspect existing architecture
2. Inspect existing components
3. Inspect naming conventions
4. Inspect styling system
5. Inspect project rules

Follow existing patterns strictly.

Avoid introducing new architecture without a clear reason.

---

# FILE EDITING RULES

Prefer:

- editing existing files
- reusing existing utilities
- reusing existing components

Avoid:

- unnecessary file creation
- duplicated abstractions
- unnecessary architectural changes

---

# COMPLETION CHECKLIST

Before completing any implementation:

- Type-safe
- Responsive
- Accessible
- Performant
- Reusable
- Production-ready
- No TypeScript errors
- No ESLint errors
- No lint issues
- No broken imports
- No unused code

Always verify quality before marking a task complete.
