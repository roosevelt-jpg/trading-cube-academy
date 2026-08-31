/** Extract a YouTube video ID from a URL or bare ID string. */
export function parseYoutubeVideoId(input?: string | null): string | null {
  if (!input?.trim()) return null
  const raw = input.trim()

  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw

  try {
    const url = raw.startsWith('http') ? new URL(raw) : new URL(`https://${raw}`)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && id.length === 11 ? id : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = url.searchParams.get('v')
      if (v && v.length === 11) return v
      const embed = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
      if (embed) return embed[1]
      const shorts = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/)
      if (shorts) return shorts[1]
    }
  } catch {
    return null
  }

  return null
}

export function youtubeEmbedUrl(videoId: string, opts?: { modest?: boolean }) {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: opts?.modest ? '1' : '0',
    playsinline: '1',
  })
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

export function youtubeWatchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`
}

/** ISO 8601 duration (PT1H2M3S) → seconds */
export function parseIso8601Duration(iso?: string | null): number | null {
  if (!iso) return null
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return null
  const h = Number(m[1] ?? 0)
  const min = Number(m[2] ?? 0)
  const s = Number(m[3] ?? 0)
  return h * 3600 + min * 60 + s
}

export function formatDurationLabel(totalSeconds: number | null | undefined): string | null {
  if (!totalSeconds || totalSeconds <= 0) return null
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export type YoutubeVideoMeta = {
  videoId: string
  title: string
  description: string
  thumbnailUrl: string | null
  durationSeconds: number | null
  durationLabel: string | null
}
