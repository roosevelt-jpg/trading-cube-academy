'use client'

import { useMemo } from 'react'
import { Panel } from '@/components/ui/academy-ui'
import { parseYoutubeVideoId, youtubeEmbedUrl, formatDurationLabel } from '@/lib/youtube/utils'

export function YoutubePlayer({
  videoInput,
  title,
  durationLabel,
  durationSeconds,
  className,
}: {
  videoInput?: string | null
  title?: string
  durationLabel?: string | null
  durationSeconds?: number | null
  className?: string
}) {
  const videoId = useMemo(() => parseYoutubeVideoId(videoInput ?? ''), [videoInput])
  const embedUrl = videoId ? youtubeEmbedUrl(videoId) : null
  const label = durationLabel ?? formatDurationLabel(durationSeconds ?? null)

  if (!embedUrl) {
    return (
      <Panel className="p-8 text-center">
        <p className="muted text-sm">No YouTube video is linked to this lesson yet.</p>
      </Panel>
    )
  }

  return (
    <div className={className}>
      <Panel className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-soft)] px-4 py-2">
          <p className="mono text-[10px] uppercase tracking-wider text-yellow">Unlisted YouTube embed</p>
          {label && <p className="mono muted text-xs">{label}</p>}
        </div>
        <div className="aspect-video bg-black">
          <iframe
            className="size-full"
            src={embedUrl}
            title={title ?? 'Lesson video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </Panel>
      <p className="mono muted mt-2 text-[11px]">youtube.com/embed/{videoId}</p>
    </div>
  )
}
