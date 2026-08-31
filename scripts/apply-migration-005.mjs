#!/usr/bin/env node
/**
 * Apply migration 005 via Supabase SQL (requires DATABASE_URL or SUPABASE_DB_URL).
 * Example: SUPABASE_DB_URL="postgresql://postgres:...@db.xxx.supabase.co:5432/postgres" node scripts/apply-migration-005.mjs
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
const sqlPath = join(dirname(fileURLToPath(import.meta.url)), '../supabase/migrations/005_student_progress_certificates.sql')
const sql = readFileSync(sqlPath, 'utf8')

if (!dbUrl) {
  console.log('No SUPABASE_DB_URL / DATABASE_URL set.')
  console.log('Run this SQL in the Supabase SQL Editor instead:\n')
  console.log(sql)
  process.exit(0)
}

const { default: pg } = await import('pg')
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query(sql)
  console.log('✓ Migration 005 applied.')
} finally {
  await client.end()
}
