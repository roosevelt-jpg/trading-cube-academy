#!/usr/bin/env node
/**
 * Upload bundled public marketing assets to Vercel Blob.
 * Run once after setting BLOB_READ_WRITE_TOKEN, then update CMS URLs or re-run sync-supabase-content.
 *
 *   node scripts/upload-public-assets-to-blob.mjs
 */
import { put } from '@vercel/blob'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('Set BLOB_READ_WRITE_TOKEN before running this script.')
  process.exit(1)
}

const ASSETS = [
  'public/brand/logo-banner.jpg',
  'public/brand/logo-icon.svg',
  'public/images/hero-trading.svg',
  'public/images/card-charts.svg',
  'public/images/card-terminal.svg',
  'public/images/card-risk.svg',
  'public/images/avatar.svg',
]

const mime = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

const map = {}

for (const rel of ASSETS) {
  const abs = path.join(root, rel)
  if (!fs.existsSync(abs)) {
    console.warn(`  skip missing ${rel}`)
    continue
  }
  const ext = path.extname(abs)
  const key = rel.replace(/^public\//, '')
  const blob = await put(`seed/${key}`, fs.readFileSync(abs), {
    access: 'public',
    contentType: mime[ext] ?? 'application/octet-stream',
  })
  map[rel] = blob.url
  console.log(`  ✓ ${rel} → ${blob.url}`)
}

const out = path.join(root, 'scripts/.blob-seed-urls.json')
fs.writeFileSync(out, JSON.stringify(map, null, 2))
console.log(`\nWrote ${out}`)
console.log('Paste these URLs into Admin → Settings / Homepage CMS, or extend sync-supabase-content.mjs to apply them.')
