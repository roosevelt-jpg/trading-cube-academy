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
- Course overview with sequential module unlock
- Video and reading lessons with progress tracking
- Module quizzes with pass/fail and attempt logging
- Certificates, profile, and support tickets

### Admin dashboard
- Platform overview and activity feed
- Course management (modules, content editor, video IDs, quiz builder)
- Student list and detail with progress
- Support inbox
- Academy settings (homepage copy, branding)

## Setup

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com), then run:

```bash
# In Supabase SQL Editor, run in order:
# supabase/migrations/001_schema.sql
# supabase/seed.sql
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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional for material uploads:

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
| Student | m.harrison@email.com     | TradingCube2026!   |

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
