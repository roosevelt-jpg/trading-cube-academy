#!/usr/bin/env npx tsx
/**
 * Backfill enrollment progress_pct and issue missing certificates for all students.
 * Usage: npm run backfill-progress
 * Requires SUPABASE_URL + SUPABASE_SECRET_KEY in .env.local
 */
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { syncCourseProgress } from '../lib/progress/sync-course-progress'

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

async function main() {
  loadEnvLocal()
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE_URL and SUPABASE_SECRET_KEY')
    process.exit(1)
  }

  const service = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: enrollments, error } = await service.from('enrollments').select('user_id, course_id')
  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  console.log(`Backfilling ${enrollments?.length ?? 0} enrollments…`)
  let updated = 0
  for (const e of enrollments ?? []) {
    const pct = await syncCourseProgress(service, e.user_id, e.course_id)
    console.log(`  user ${e.user_id.slice(0, 8)}… course ${e.course_id.slice(0, 8)}… → ${pct}%`)
    updated++
  }
  console.log(`✓ Done. Synced ${updated} enrollments.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
