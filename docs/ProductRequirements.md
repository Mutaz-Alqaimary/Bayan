# Bayan — Arabic Literacy & Reading Fluency Platform

You are acting as a **Staff Frontend Engineer, Senior Product Designer, and Product Architect** building **Bayan**, a production-grade Arabic literacy and reading-fluency platform for schools, Arabic language centers, and teachers.

Use frontend-design skill.

Build a production-grade Arabic-first educational platform.

Project Name:

Bayan — Arabic Literacy & Reading Fluency Platform

The project must be:

* Production-grade
* School-ready
* Arabic-first
* CV-quality
* Maintainable
* Scalable

## PRODUCT OVERVIEW

Bayan is an Arabic-first literacy and reading fluency platform.

The platform helps schools, teachers, and students improve Arabic reading skills through:

* Reading passages
* Vocabulary learning
* Reading fluency tracking
* Reading analytics
* Progress monitoring

The platform is intended for:

* Schools
* Arabic language centers
* Arabic literacy programs
* Individual teachers

Primary users:

* Admin
* Teacher
* Student

---

## USER JOURNEYS

Admin:

* Manages the platform
* Manages teachers
* Manages students
* Manages reading content
* Reviews reports and analytics

Teacher:

* Manages students
* Creates and manages reading passages
* Creates and manages vocabulary terms
* Reviews student progress
* Reviews reading analytics

Student:

* Reads passages
* Learns vocabulary
* Completes reading sessions
* Tracks personal progress
* Views reading history

---

## CORE BUSINESS GOAL

The platform must help teachers answer:

"Is the student's Arabic reading ability improving over time?"

The platform must measure:

* Reading speed
* Reading accuracy
* Reading duration
* Vocabulary exposure
* Reading progress trends

---

## UX REQUIREMENTS

The platform is Arabic-first.

Arabic experience is the primary experience.

Requirements:

* RTL-first design
* Mobile-first design
* Accessible design
* Teacher-friendly workflows
* Student-friendly reading experience
* Clear dashboards
* Simple navigation
* Fast page transitions
* Consistent design language
* Readable Arabic typography
* Responsive layouts
* Touch-friendly interfaces
* Minimal cognitive load
* Clear visual hierarchy

---

## UI DESIGN & DESIGN ENGINEERING REQUIREMENTS

Create a premium educational SaaS interface.

The platform must not look like a generic CRUD dashboard.

The platform must feel like a modern commercial product that could be used by real schools and educational institutions.

---

## DESIGN PHILOSOPHY

Act as:

* Senior Product Designer
* Senior UX Designer
* Staff Frontend Engineer

Before implementing any page:

1. Analyze user goals.
2. Design the user experience.
3. Design the information architecture.
4. Design the page layout.
5. Design the component hierarchy.
6. Design responsive behavior.
7. Design accessibility behavior.
8. Then implement.

Never jump directly into coding.

Always think about:

* User experience
* Visual hierarchy
* Readability
* Accessibility
* Mobile experience
* Arabic usability

---

## DESIGN STYLE

Create a:

* Modern SaaS experience
* Premium educational platform
* Enterprise-grade interface
* Professional dashboard system
* Clean and minimal UI
* Data-driven experience

Design Inspiration:

* Vercel Dashboard
* Linear
* Notion
* Stripe Dashboard
* Duolingo
* Khan Academy

Avoid:

* Bootstrap-style interfaces
* Generic CRUD appearance
* Admin template look
* Crowded layouts
* Excessive colors
* Outdated design patterns
* Poor spacing
* Visual clutter

---

## VISUAL DESIGN SYSTEM

Requirements:

* Design tokens
* Consistent spacing scale
* Consistent typography scale
* Consistent border radius scale
* Consistent shadow system
* Consistent color system
* Reusable design primitives

Use:

* Card-based layouts
* Clean sections
* Strong hierarchy
* Modern spacing
* Generous whitespace

The platform should feel polished and intentional.

---

## TYPOGRAPHY

Arabic is the primary language.

Requirements:

* Beautiful Arabic typography
* Proper line height
* Comfortable reading experience
* Strong heading hierarchy
* Proper paragraph spacing
* Excellent readability

Preferred Fonts:

* IBM Plex Sans Arabic
* Cairo
* Tajawal

Use a single typography system across the application.

---

## DASHBOARD DESIGN

Admin Dashboard:

* KPI Cards
* Student Statistics
* Reading Analytics
* System Overview
* Quick Actions

Teacher Dashboard:

* Student Progress
* Reading Performance
* Vocabulary Progress
* Recent Activity
* Reading Insights

Student Dashboard:

* Reading Progress
* Reading History
* Vocabulary Growth
* Reading Goals
* Personal Analytics

Dashboards must feel modern, clean, and premium.

---

## COMPONENT DESIGN

Forms:

* Clean layouts
* Clear validation
* Accessible controls
* Proper spacing
* Professional appearance

Tables:

* Modern data tables
* Search
* Filters
* Sorting
* Pagination
* Responsive behavior

Cards:

* Soft shadows
* Rounded corners
* Clear hierarchy

Dialogs:

* Accessible
* Responsive
* Well-structured

Navigation:

* Clear
* Minimal
* Easy to understand

---

## RESPONSIVE DESIGN

Use mobile-first design.

Support:

* Mobile phones
* Tablets
* Laptops
* Desktop screens

Requirements:

* Responsive layouts
* Responsive tables
* Responsive forms
* Responsive navigation

The experience must remain professional across all screen sizes.

---

## DARK MODE

Requirements:

* First-class dark mode support
* Proper contrast
* Consistent colors
* Consistent shadows
* Intentional design

Dark mode must feel fully designed, not automatically generated.

---

## MOTION DESIGN

Use subtle animations only.

Optional:

* Framer Motion

Requirements:

* Smooth transitions
* Elegant hover states
* Micro-interactions
* Reduced motion support

Avoid distracting animations.

---

## LOADING STATES

Requirements:

* Skeleton loaders
* Progressive loading
* Smooth loading transitions

Avoid layout shifts.

---

## EMPTY STATES

Create meaningful empty states.

Examples:

* No students found
* No passages found
* No reading sessions found

Each empty state should:

* Explain the situation
* Suggest a next action
* Match the design system

---

## ERROR STATES

Create user-friendly error experiences.

Requirements:

* Clear messages
* Recovery suggestions
* Consistent design

Avoid technical jargon.

---

## ACCESSIBILITY

Requirements:

* WCAG-aware design
* Keyboard navigation
* Focus management
* Screen reader support
* Proper contrast ratios
* RTL accessibility support

Accessibility must be considered during design, not added later.

---

## FINAL UI GOAL

The finished platform should feel comparable to a modern SaaS product.

Users should immediately feel:

* The platform is professional.
* The platform is trustworthy.
* The platform is production-ready.
* The platform is designed for real schools.
* The platform provides a premium experience.

Avoid anything that looks like:

* A tutorial project
* A student assignment
* A basic CRUD application
* A generic admin dashboard

Every page should look intentionally designed.

---

## SUCCESS METRICS

The platform should allow teachers to:

* Identify struggling readers
* Monitor reading improvement over time
* Track vocabulary growth
* Compare student progress
* Generate meaningful reports

The platform should allow students to:

* Improve reading fluency
* Learn new vocabulary
* Monitor personal progress
* Build reading confidence

---

## IMPORTANT

The database already exists in Supabase.

DO NOT create database schema.

DO NOT generate migrations.

DO NOT invent table names.

DO NOT rename columns.

Use ONLY the schema provided below.

Never use placeholders, mock implementations, TODO comments, fake APIs, fake data, or incomplete code unless explicitly requested.

---

## TECH STACK

Use:

* Next.js 16
* React 19
* TypeScript 5.x
* Tailwind CSS 4
* shadcn/ui
* next-intl
* Zustand
* React Hook Form
* Zod
* TanStack Table
* SheetJS
* Lucide React
* Supabase JS

Optional:

* Framer Motion
* Radix UI

---

## ARABIC-FIRST REQUIREMENTS

Requirements:

* RTL by default for Arabic
* LTR for English
* Unicode-safe rendering
* Proper Arabic typography
* Mixed Arabic/English content support
* BiDi text handling
* Arabic validation messages
* Arabic error messages
* Arabic accessibility support
* Arabic search support
* Arabic sorting awareness
* Localized routes
* Localized metadata
* Localized toasts

---

## ARCHITECTURE RULES

Use:

* Feature-based architecture
* App Router
* Server Components by default
* Client Components only when necessary
* Strict TypeScript
* Type-safe data layer
* Reusable UI patterns
* Scalable folder structure

Avoid:

* God components
* Deep prop drilling
* Duplicated logic
* Hardcoded strings
* Hardcoded routes

---

## DATABASE TABLES

profiles

id
full_name
role
avatar_url
locale
created_at
updated_at

students

id
student_number
first_name_ar
last_name_ar
first_name_en
last_name_en
email
grade
birth_date
profile_id
created_at
updated_at

reading_passages

id
title_ar
title_en
content_ar
content_en
difficulty_level
estimated_minutes
created_at
updated_at

reading_sessions

id
student_id
passage_id
words_per_minute
accuracy_percentage
duration_seconds
completed_at
created_at

vocabulary_terms

id
passage_id
word_ar
word_en
meaning_ar
meaning_en
created_at

user_settings

id
user_id
theme
locale
reduced_motion
email_notifications
created_at
updated_at

---

## STORAGE

Bucket:

avatars

---

## ENV VARIABLES

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

---

## NAMING RULES

Database Types:

ProfileRecord
StudentRecord
ReadingPassageRecord
ReadingSessionRecord
VocabularyTermRecord

Form Types:

LoginFormValues
RegisterFormValues
CreateStudentFormValues
UpdateStudentFormValues

Stores:

useAuthStore
useStudentStore
useSettingsStore
useReadingStore

Clients:

supabaseClient
supabaseServerClient

Never invent alternative names.

---

## AUTHORIZATION RULES

Roles:

* admin
* teacher
* student

Minimum permissions:

Admin:

* Full platform access
* User management
* Student management
* Reading content management
* Reporting access

Teacher:

* Student management
* Reading content management
* Reading analytics access
* Reporting access

Student:

* View assigned content
* Complete reading sessions
* View personal progress
* Manage personal settings

---

## CODE QUALITY RULES

Requirements:

* Strict TypeScript
* ESLint clean
* Production-ready code
* Accessible components
* Reusable architecture
* Proper loading states
* Proper empty states
* Proper error states
* Strong typing
* Zod validation everywhere applicable

---

## WORKFLOW RULES

Work ONLY ONE PHASE at a time.

At the end of every phase:

1. Stop.
2. Summarize implementation.
3. Explain architecture.
4. Explain review checklist.
5. Wait for approval.

Never continue automatically.

==================================================
PHASE 1
FOUNDATION
==================================================

Before build any thing, if library or package or files is exsit in files of project or it exists in package.json file, you don't repeat setup it, like Next.js or React or tailwind, etc..., I setup these previously.

Build:

* Next.js 16 setup
* React 19 setup
* TypeScript setup
* Tailwind CSS v4 setup
* App Router
* Feature-based architecture
* Providers architecture
* next-intl setup
* Locale routing
* Arabic locale
* English locale
* RTL/LTR switching
* Theme provider
* Absolute imports
* Root layouts
* Locale layouts
* Navigation shell

Create:

README.md
Architecture.md

STOP.

==================================================
PHASE 2
SUPABASE INTEGRATION
==================================================

Build:

* Supabase client
* Supabase server client
* Proxy file (Next.js 16)
* Auth helpers
* Session handling
* Protected routes
* Role helpers

Create:

SupabaseArchitecture.md

STOP.

==================================================
PHASE 3
DESIGN SYSTEM
==================================================

Build reusable components:

* Button
* Input
* Textarea
* Select
* Checkbox
* Radio
* Switch
* Card
* Badge
* Dialog
* Drawer
* Dropdown
* Tooltip
* Tabs
* Pagination
* Table
* Toast
* Skeleton
* EmptyState
* ErrorState

Requirements:

* RTL
* LTR
* Dark Mode
* Accessibility
* TypeScript

STOP.

==================================================
PHASE 4
LOCALIZATION & RTL
==================================================

Build:

* Language Switcher
* Localized Routes
* Localized Metadata
* Localized Validation
* Localized Errors
* Localized Toasts

Create:

Localization.md
RTL.md

Explain:

* Unicode
* BiDi Text
* RTL Pitfalls

STOP.

==================================================
PHASE 5
AUTHENTICATION
==================================================

Use Supabase Auth.

Build:

* Login
* Register
* Forgot Password
* Reset Password

Roles:

* admin
* teacher
* student

STOP.

==================================================
PHASE 6
DASHBOARD
==================================================

Build:

* Admin Dashboard
* Teacher Dashboard
* Student Dashboard
* KPI Cards
* Reading Metrics Overview
* Recent Activity
* Quick Actions
* Progress Summary

STOP.

==================================================
PHASE 7
STUDENT MANAGEMENT
==================================================

Use students table.

Build:

* CRUD
* Search
* Filters
* Pagination
* Sorting
* TanStack Table

STOP.

==================================================
PHASE 8
READING CONTENT MANAGEMENT
==================================================

Use:

* reading_passages
* vocabulary_terms

Build:

* Passage CRUD
* Vocabulary CRUD
* Search
* Filters
* Pagination
* Sorting
* Validation

STOP.

==================================================
PHASE 9
CSV/XLSX IMPORT EXPORT
==================================================

Use students table.

Build:

* CSV Import
* CSV Export
* XLSX Import
* XLSX Export
* Validation
* Error Handling
* Preview Before Import

STOP.

==================================================
PHASE 10
READING FLUENCY
==================================================

Use:

* reading_passages
* reading_sessions

Build:

* Reading Session Workflow
* WPM Calculation
* Accuracy Tracking
* Duration Tracking
* Reading History
* Progress Tracking

STOP.

==================================================
PHASE 11
READ WITH ME
==================================================

Use:

* reading_passages
* vocabulary_terms

Build:

* Passage Reader
* Vocabulary Sidebar
* Vocabulary Lookup
* Word Meanings
* Reading Assistance Experience

STOP.

==================================================
PHASE 12
SETTINGS
==================================================

Use:

* user_settings

Build:

* Theme Settings
* Locale Settings
* Reduced Motion Settings
* Notification Settings

STOP.

==================================================
PHASE 13
READING ANALYTICS
==================================================

Use:

* reading_sessions

Build:

* Student Progress Charts
* WPM Trends
* Accuracy Trends
* Performance Insights

STOP.

==================================================
PHASE 14
PERFORMANCE
==================================================

Optimize project.

Requirements:

* Code Splitting
* Dynamic Imports
* Server Components Optimization
* Bundle Analysis
* Image Optimization
* Caching Strategy
* Loading Optimization
* Data Fetching Optimization

Create:

Performance.md

STOP.

==================================================
PHASE 15
ACCESSIBILITY AUDIT
==================================================

Audit the entire platform.

Requirements:

* WCAG Awareness
* Keyboard Navigation
* Focus Management
* Screen Reader Support
* Accessible Forms
* Accessible Tables
* Accessible Dialogs
* Color Contrast Validation
* RTL Accessibility Validation

Create:

Accessibility.md

STOP.

==================================================
PHASE 16
TESTING
==================================================

Build:

* Unit Tests
* Integration Tests
* Form Validation Tests
* Localization Tests
* RTL Tests

Create:

Testing.md

STOP.

==================================================
PHASE 17
SECURITY REVIEW
==================================================

Review:

* Authentication
* Authorization
* Route Protection
* Input Validation
* Supabase Security
* File Upload Security
* Environment Variable Safety

Create:

Security.md

STOP.

==================================================
PHASE 18
REPORTING
==================================================

Build:

* Student Reports
* Teacher Reports
* Reading Progress Reports
* PDF Export

Requirements:

* Arabic PDF Support
* English PDF Support
* RTL PDF Layout

STOP.

==================================================
PHASE 19
DEPLOYMENT
==================================================

Build:

* Production Environment Setup
* Environment Validation
* Deployment Configuration
* SEO Basics
* Metadata Strategy
* robots.txt
* sitemap.xml

Create:

Deployment.md

STOP.

==================================================
PHASE 20
FINAL REFACTOR
==================================================

Create:

ProjectReview.md

Explain:

* Strengths
* Weaknesses
* Future Improvements
* Technical Decisions
* Scaling Strategy

Provide:

* Final Architecture Review
* Production Readiness Checklist
* Deployment Readiness Checklist

STOP.
