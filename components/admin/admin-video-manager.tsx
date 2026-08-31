'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeQuery } from '@/lib/hooks/use-realtime-query'
import { Btn, Eyebrow, LoadingState, Panel } from '@/components/ui/academy-ui'
import { YoutubePlayer } from '@/components/ui/youtube-player'
import { parseYoutubeVideoId } from '@/lib/youtube/utils'

type LessonRow = {
  id: string
  title: string
  lesson_type: string
  youtube_video_id: string | null
  duration_label: string | null
  duration_seconds: number | null
  content: { youtubeUrl?: string; summary?: string }
  modules: { title: string; slug: string; sort_order: number }
}

export function AdminVideoManager({ courseSlug }: { courseSlug: string }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [marketingTitle, setMarketingTitle] = useState('')
  const [marketingId, setMarketingId] = useState('')
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)

  const fetcher = useMemo(() => async (client: ReturnType<typeof createClient>) => {
    const { data: course } = await client.from('courses').select('id,title').eq('slug', courseSlug).maybeSingle()
    if (!course) return null

    const [{ data: videos }, { data: lessons }] = await Promise.all([
      client.from('youtube_videos').select('*').order('sort_order'),
      client
        .from('lessons')
        .select('id,title,lesson_type,youtube_video_id,duration_label,duration_seconds,content,sort_order, modules!inner(title,slug,sort_order,course_id)')
        .eq('modules.course_id', course.id)
        .eq('lesson_type', 'video')
        .order('sort_order'),
    ])

    return { course, videos: videos ?? [], lessons: (lessons ?? []) as LessonRow[] }
  }, [courseSlug])

  const { data, loading, reload } = useRealtimeQuery('lessons', fetcher, [courseSlug])

  const saveLessonVideo = async (lessonId: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/youtube/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, videoInput: urlInput }),
      })
      const json = await res.json()
      if (json.apiConnected !== undefined) setApiConnected(json.apiConnected)
      if (res.ok) {
        setEditingId(null)
        setUrlInput('')
        reload()
      }
    } finally {
      setSaving(false)
    }
  }

  const syncAllFromYoutube = async () => {
    if (!data?.course) return
    setSyncing(true)
    try {
      const res = await fetch('/api/youtube/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncAll: true, courseId: data.course.id }),
      })
      const json = await res.json()
      setApiConnected(json.apiConnected ?? false)
      reload()
    } finally {
      setSyncing(false)
    }
  }

  const addMarketingVideo = async () => {
    const vid = parseYoutubeVideoId(marketingId)
    if (!vid || !marketingTitle) return
    await createClient().from('youtube_videos').insert({
      title: marketingTitle,
      video_id: vid,
      course_name: data?.course?.title,
      visibility: 'marketing',
      published: true,
    })
    setMarketingTitle('')
    setMarketingId('')
    reload()
  }

  if (loading) return <LoadingState />
  if (!data?.course) return <div className="content-pad">Course not found.</div>

  const editingLesson = data.lessons.find((l) => l.id === editingId)
  const previewId = parseYoutubeVideoId(urlInput || editingLesson?.youtube_video_id || editingLesson?.content?.youtubeUrl)

  return (
    <div className="content-pad max-w-4xl">
      <Link href={`/admin/courses/${courseSlug}`} className="mono muted text-xs">← {data.course.title}</Link>
      <Eyebrow className="mt-4">Video management</Eyebrow>
      <h1 className="h2 mt-2 text-xl">YouTube lesson videos</h1>
      <p className="muted mt-2 text-sm">
        Store YouTube references only — videos stream inside the student dashboard. Connect the YouTube Data API under Integrations to auto-fetch duration and validate embeds.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Btn size="sm" variant="ghost" onClick={syncAllFromYoutube} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync all from YouTube API'}
        </Btn>
        {apiConnected === true && <span className="mono text-xs text-green">YouTube API connected</span>}
        {apiConnected === false && <span className="mono text-xs text-yellow">YouTube API not connected — embeds still work with video IDs</span>}
      </div>

      {editingLesson && (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Panel className="space-y-4 p-6">
            <p className="font-semibold">{editingLesson.title}</p>
            <div className="input-group">
              <label>YouTube URL (unlisted)</label>
              <input
                className="input"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://youtu.be/… or video ID"
              />
            </div>
            <div className="input-group">
              <label>Extracted video ID</label>
              <input className="input mono opacity-60" value={previewId ?? ''} readOnly disabled />
            </div>
            <Btn size="sm" onClick={() => saveLessonVideo(editingLesson.id)} disabled={saving || !previewId}>
              {saving ? 'Saving…' : 'Save & validate embed'}
            </Btn>
          </Panel>
          <div>
            <p className="mono muted mb-2 text-[11px]">EMBED PREVIEW</p>
            <YoutubePlayer
              videoInput={urlInput || editingLesson.youtube_video_id || editingLesson.content?.youtubeUrl}
              title={editingLesson.title}
              durationLabel={editingLesson.duration_label}
              durationSeconds={editingLesson.duration_seconds}
            />
          </div>
        </div>
      )}

      <Eyebrow className="mt-10 mb-4">All videos in this course</Eyebrow>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Lesson</th>
              <th>Module</th>
              <th>Video ID</th>
              <th>Duration</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.lessons.map((l) => {
              const vid = l.youtube_video_id ?? parseYoutubeVideoId(l.content?.youtubeUrl)
              return (
                <tr key={l.id}>
                  <td>{l.title}</td>
                  <td className="muted">{l.modules?.title}</td>
                  <td className="mono text-yellow">{vid ?? '—'}</td>
                  <td className="mono muted">{l.duration_label ?? '—'}</td>
                  <td>
                    <Btn
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(l.id)
                        setUrlInput(l.content?.youtubeUrl ?? l.youtube_video_id ?? '')
                      }}
                    >
                      Edit
                    </Btn>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Panel className="mt-10 space-y-4 p-6">
        <Eyebrow>Add homepage marketing video</Eyebrow>
        <div className="input-group"><label>Title</label><input className="input" value={marketingTitle} onChange={(e) => setMarketingTitle(e.target.value)} /></div>
        <div className="input-group"><label>YouTube URL or ID</label><input className="input" value={marketingId} onChange={(e) => setMarketingId(e.target.value)} /></div>
        <Btn size="sm" onClick={addMarketingVideo}>Add to marquee</Btn>
      </Panel>
    </div>
  )
}
