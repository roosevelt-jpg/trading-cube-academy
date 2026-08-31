import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchYoutubeMetadata } from '@/lib/integrations/youtube'
import { parseYoutubeVideoId } from '@/lib/youtube/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('id') ?? searchParams.get('url') ?? ''
  const videoId = parseYoutubeVideoId(raw)

  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL or video ID' }, { status: 400 })
  }

  const meta = await fetchYoutubeMetadata(videoId)

  return NextResponse.json({
    videoId,
    meta,
    apiConnected: Boolean(meta),
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json() as { lessonId?: string; videoInput?: string; syncAll?: boolean; courseId?: string }

  if (body.syncAll && body.courseId) {
    const { data: modules } = await supabase.from('modules').select('id').eq('course_id', body.courseId)
    const moduleIds = (modules ?? []).map((m) => m.id)
    if (!moduleIds.length) return NextResponse.json({ synced: 0 })

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id,youtube_video_id,content,lesson_type')
      .in('module_id', moduleIds)
      .eq('lesson_type', 'video')

    const { fetchYoutubeMetadataBatch } = await import('@/lib/integrations/youtube')
    const ids = (lessons ?? [])
      .map((l) => l.youtube_video_id ?? parseYoutubeVideoId((l.content as { youtubeUrl?: string })?.youtubeUrl))
      .filter(Boolean) as string[]

    const batch = await fetchYoutubeMetadataBatch(ids)
    let synced = 0

    for (const lesson of lessons ?? []) {
      const content = lesson.content as { youtubeUrl?: string; summary?: string }
      const vid = lesson.youtube_video_id ?? parseYoutubeVideoId(content?.youtubeUrl)
      if (!vid) continue

      const meta = batch.get(vid)
      const patch: Record<string, unknown> = { youtube_video_id: vid }
      if (meta?.durationLabel) patch.duration_label = meta.durationLabel
      if (meta?.durationSeconds) patch.duration_seconds = meta.durationSeconds
      if (meta?.title && !lesson.youtube_video_id) patch.title = meta.title

      await supabase.from('lessons').update(patch).eq('id', lesson.id)
      synced++
    }

    return NextResponse.json({ synced, apiConnected: batch.size > 0 })
  }

  if (!body.lessonId || !body.videoInput) {
    return NextResponse.json({ error: 'lessonId and videoInput required' }, { status: 400 })
  }

  const videoId = parseYoutubeVideoId(body.videoInput)
  if (!videoId) return NextResponse.json({ error: 'Invalid YouTube URL or ID' }, { status: 400 })

  const meta = await fetchYoutubeMetadata(videoId)
  const patch: Record<string, unknown> = {
    youtube_video_id: videoId,
    content: { youtubeUrl: body.videoInput, summary: meta?.description?.slice(0, 500) ?? undefined },
  }
  if (meta?.durationLabel) patch.duration_label = meta.durationLabel
  if (meta?.durationSeconds) patch.duration_seconds = meta.durationSeconds

  const { data, error } = await supabase.from('lessons').update(patch).eq('id', body.lessonId).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ lesson: data, meta, videoId, apiConnected: Boolean(meta) })
}
