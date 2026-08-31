'use client'

import { useEffect, useId, useRef } from 'react'
import { Panel } from '@/components/ui/academy-ui'
import { parseYoutubeVideoId, youtubeEmbedUrl, formatDurationLabel } from '@/lib/youtube/utils'

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId: string
          playerVars?: Record<string, string | number>
          events?: { onStateChange?: (event: { data: number }) => void; onReady?: () => void }
        },
      ) => { destroy: () => void }
      PlayerState?: { ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiPromise: Promise<void> | null = null

function loadYoutubeIframeApi() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve()
      return
    }
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
  })

  return youtubeApiPromise
}

export function YoutubePlayer({
  videoInput,
  title,
  durationLabel,
  durationSeconds,
  className,
  onEnded,
}: {
  videoInput?: string | null
  title?: string
  durationLabel?: string | null
  durationSeconds?: number | null
  className?: string
  onEnded?: () => void
}) {
  const videoId = parseYoutubeVideoId(videoInput ?? '')
  const label = durationLabel ?? formatDurationLabel(durationSeconds ?? null)
  const elementId = useId().replace(/:/g, '')
  const playerRef = useRef<{ destroy: () => void } | null>(null)
  const endedRef = useRef(onEnded)

  endedRef.current = onEnded

  useEffect(() => {
    if (!videoId || !onEnded) return

    let cancelled = false

    void loadYoutubeIframeApi().then(() => {
      if (cancelled || !window.YT?.Player) return

      playerRef.current?.destroy()
      playerRef.current = new window.YT.Player(elementId, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onStateChange: (event) => {
            const ended = window.YT?.PlayerState?.ENDED ?? 0
            if (event.data === ended) endedRef.current?.()
          },
        },
      })
    })

    return () => {
      cancelled = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [elementId, onEnded, videoId])

  if (!videoId) {
    return (
      <Panel className="p-8 text-center">
        <p className="muted text-sm">No YouTube video is linked to this lesson yet.</p>
      </Panel>
    )
  }

  if (!onEnded) {
    const embedUrl = youtubeEmbedUrl(videoId)
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

  return (
    <div className={className}>
      <Panel className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-soft)] px-4 py-2">
          <p className="mono text-[10px] uppercase tracking-wider text-yellow">Unlisted YouTube embed</p>
          {label && <p className="mono muted text-xs">{label}</p>}
        </div>
        <div className="relative aspect-video bg-black">
          <div id={elementId} className="size-full" title={title ?? 'Lesson video'} />
        </div>
      </Panel>
      <p className="mono muted mt-2 text-[11px]">Progress saves automatically when the video finishes.</p>
    </div>
  )
}
