# The Trading Cube Academy

A structured trading education site: public academy pages, member login, student dashboard, and an admin console.

This workspace is a copy of [roosevelt-jpg/trading-cube-academy](https://github.com/roosevelt-jpg/trading-cube-academy). The original project was built with [Next.js](https://nextjs.org) and [v0](https://v0.app).

[Continue working on v0 →](https://v0.app/chat/projects/prj_OBRDa3w9jBZ4nZS7zEc4P4cTANjM)

## What’s included

- Marketing homepage with academy, method, and support sections
- CMS-style pages (`/about`, `/courses`, `/method`, `/risk`, `/psychology`, `/resources`, `/contact`, `/faq`, `/privacy`, `/terms`)
- Member login and signup
- Student and admin dashboards (live data when Supabase is configured)

Public pages still render with built-in fallback content if Supabase keys are missing. Auth, dashboards, and file uploads need a Supabase project.

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev --port 43123
```

Open [http://localhost:43123](http://localhost:43123).

You can also use `npm install` and `npm run dev`.

## Environment

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)

Optional:

- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` for local auth email redirects
- Vercel Blob credentials if you want admin material uploads

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [v0 documentation](https://v0.app/docs)
