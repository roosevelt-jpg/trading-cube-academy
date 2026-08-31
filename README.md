# The Trading Cube Academy

A deployment-ready CMS/LMS for structured trading education. All marketing copy, courses, lessons, videos, quizzes, and settings are managed through the admin dashboard and stored in Supabase with realtime sync.

## Stack

- **Next.js 16** (App Router)
- **Supabase** (Auth, Postgres, Row Level Security, Realtime)
- **Tailwind CSS 4** (mockup-aligned design system)
- **Vercel Blob** (optional course material uploads)

## Features

### Marketing site
- Homepage with hero, stats, pillars, curriculum, video marquee, how-it-works, testimonials, FAQ, and CTA
- Contact / request access form (writes to `access_requests`)
- All content editable via admin → Settings and CMS tables

### Student dashboard
- Dashboard with resume lesson, stats, course progress, activity feed
- Live date/time clock in the dashboard header
- Course overview with sequential module unlock
- Video and reading lessons with progress tracking
- Module quizzes with **server-synced timer**, pass/fail, and attempt limits
- Certificates, profile, and support tickets

### Admin dashboard
- Platform overview and activity feed
- Course management (modules, content editor, video IDs, quiz builder with timer)
- **Integrations** — Stripe, YouTube Data API, Vercel Blob, email, WhatsApp, OpenAI
- Student list and detail with progress
- Support inbox
- CMS pages, branding, and image settings
- Live date/time clock in the dashboard header

## Setup

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com), then run:

```bash
# In Supabase SQL Editor, run in order:
# supabase/migrations/001_schema.sql
# supabase/migrations/002_cms_images.sql
# supabase/migrations/003_integrations_quiz_timer.sql   (or supabase/remote-setup.sql if LMS already exists)
# supabase/seed.sql
```

**Hosted Supabase:** run auth users first, then seed:

```bash
node scripts/seed-auth-users.mjs
# Then run supabase/seed.sql in the SQL Editor (or psql)
```

**Supabase SQL Editor run order** (paste each file separately — the SQL Editor cannot run `node` commands):

1. `supabase/snippets/fix-profiles-columns.sql` (if profiles table predates migrations)
2. `supabase/snippets/seed-courses.sql` — courses, modules, lessons, quizzes
3. `supabase/snippets/fix-auth-login.sql` — login fix if needed (or use terminal: `node scripts/seed-auth-users.mjs`)
4. `supabase/snippets/seed-student-data.sql` — enrollments, progress, tickets

If student rows fail with `enrollments_course_id_fkey`, run step 2 first. If they fail with `support_tickets_user_id_fkey`, ensure a student profile exists (step 3).

Then sync CMS content and integration rows:

```bash
node scripts/sync-supabase-content.mjs
node scripts/sync-integrations.mjs
```

Or with the Supabase CLI:

```bash
supabase db push
psql $DATABASE_URL -f supabase/seed.sql
```

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
# Server-only (integrations API, quiz start/submit):
SUPABASE_SECRET_KEY=your-secret-key
```

Optional for material uploads (also configurable in Admin → Integrations):

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_token
```

### 3. Install and run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:43123](http://localhost:43123) (or your chosen port).

### 4. Seeded accounts

After running `seed.sql`:

| Role    | Email                    | Password           |
|---------|--------------------------|--------------------|
| Admin   | admin@thetradingcube.com | TradingCube2026!   |
| Student | student@thetradingcube.com | TradingCube2026!   |

Run **`node scripts/seed-auth-users.mjs`** before or after `seed.sql` on hosted Supabase — it creates/resets auth users and profiles via the Admin API (required when raw `auth.users` inserts are skipped).

**Change these passwords before production deployment.**

## Deployment

1. Apply migrations and seed to your production Supabase instance
2. Set environment variables in Vercel (or your host)
3. `pnpm build && pnpm start`
4. Disable email confirmation in Supabase Auth for invite-only flows, or configure SMTP

## Project structure

```
app/
  page.tsx              # Marketing homepage
  contact/              # Request access
  login|signup|forgot-password/
  student/              # Student LMS routes
  admin/                # Admin CMS routes
components/
  marketing/            # Public site
  student/              # Student views
  admin/                # Admin CMS views
  layouts/              # Dashboard shells
supabase/
  migrations/001_schema.sql
  seed.sql
```

## Realtime

Tables are published to `supabase_realtime`. Client hooks in `lib/hooks/use-realtime-query.ts` subscribe to changes so admin edits appear live on the marketing site and student dashboards without refresh.
