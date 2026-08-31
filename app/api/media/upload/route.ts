import { NextResponse } from 'next/server'
import { uploadToBlob } from '@/lib/storage/blob-server'
import type { BlobCategory } from '@/lib/storage/blob'
import { isBlobConfigured, safeFileName } from '@/lib/storage/blob'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

const CATEGORIES = new Set<BlobCategory>(['marketing', 'branding', 'courses', 'testimonials', 'pages'])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }
  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: 'Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel or Admin → Integrations.' },
      { status: 503 },
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file')
  const category = formData.get('category')?.toString() as BlobCategory | undefined

  if (!(file instanceof File)) return NextResponse.json({ error: 'File required' }, { status: 400 })
  if (!category || !CATEGORIES.has(category)) {
    return NextResponse.json({ error: 'Valid category required (marketing, branding, courses, testimonials, pages)' }, { status: 400 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads are supported here. Use Materials for documents.' }, { status: 400 })
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Image is too large (max 10 MB)' }, { status: 413 })
  }

  try {
    const blob = await uploadToBlob(category, user.id, file, safeFileName(file.name), file.type)
    return NextResponse.json({ url: blob.url, pathname: blob.pathname })
  } catch (e) {
    console.error('[media/upload]', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
