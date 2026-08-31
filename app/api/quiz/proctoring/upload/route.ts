import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function POST(request: Request) {
  if (!getSupabaseEnv().configured) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const attemptId = formData.get('attemptId')?.toString()
  const moduleId = formData.get('moduleId')?.toString()
  const durationSeconds = Number(formData.get('durationSeconds') ?? 0)
  const file = formData.get('recording')

  if (!attemptId || !moduleId) {
    return NextResponse.json({ error: 'attemptId and moduleId required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: attempt } = await service
    .from('quiz_attempts')
    .select('id,user_id,module_id,status')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })

  let blobUrl: string | null = null
  let blobPathname: string | null = null
  let fileSize = 0

  if (file instanceof File && file.size > 0) {
    fileSize = file.size
    const pathname = `quiz-proctoring/${user.id}/${attemptId}-${Date.now()}.webm`
    try {
      const blob = await put(pathname, file, {
        access: 'public',
        contentType: file.type || 'video/webm',
      })
      blobUrl = blob.url
      blobPathname = blob.pathname
    } catch (e) {
      console.error('[proctoring] blob upload failed', e)
      return NextResponse.json(
        { error: 'Recording storage is not configured. Add BLOB_READ_WRITE_TOKEN to enable proctoring uploads.' },
        { status: 503 },
      )
    }
  }

  const { data: recording, error } = await service
    .from('quiz_proctoring_recordings')
    .insert({
      attempt_id: attemptId,
      user_id: user.id,
      module_id: moduleId,
      blob_pathname: blobPathname,
      blob_url: blobUrl,
      mime_type: file instanceof File ? file.type : 'video/webm',
      duration_seconds: durationSeconds || null,
      file_size_bytes: fileSize || null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await service
    .from('quiz_attempts')
    .update({ proctoring_status: blobUrl ? 'recorded' : 'consented' })
    .eq('id', attemptId)

  return NextResponse.json({ recording })
}
