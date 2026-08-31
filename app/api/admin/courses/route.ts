import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/auth/admin-api'
import { createServiceClient } from '@/lib/supabase/service'

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { title, description, tier } = (await request.json()) as {
    title?: string
    description?: string
    tier?: string
  }

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const slug = slugify(title)
  const service = createServiceClient()
  const { count } = await service.from('courses').select('id', { count: 'exact', head: true })
  const sort_order = (count ?? 0) + 1

  const { data: course, error } = await service
    .from('courses')
    .insert({
      slug,
      title: title.trim(),
      description: description?.trim() ?? '',
      tier: tier === 'core' || tier === 'advanced' ? tier : 'foundation',
      status: 'draft',
      published: false,
      sort_order,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course })
}
