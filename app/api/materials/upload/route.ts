import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'File required' }, { status: 400 })
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: 'File is too large' }, { status: 413 })
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120)
  const blob = await put(`course-materials/${user.id}/${crypto.randomUUID()}-${safeName}`, file, { access: 'private' })
  const { data: material, error } = await supabase.from('course_materials').insert({ title: safeName, material_type: 'document', blob_pathname: blob.pathname, created_by: user.id }).select('id,title,blob_pathname').single()
  if (error) return NextResponse.json({ error: 'Could not save material metadata' }, { status: 500 })
  return NextResponse.json({ material })
}
