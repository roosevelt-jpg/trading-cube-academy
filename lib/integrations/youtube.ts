import { createServiceClient } from '@/lib/supabase/service'
import { getSupabaseEnv } from '@/lib/supabase/env'
import {
  formatDurationLabel,
  parseIso8601Duration,
  type YoutubeVideoMeta,
} from '@/lib/youtube/utils'

type YoutubeIntegration = {
  enabled: boolean
  apiKey: string
}

function parseSecrets(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return { api_key: raw }
  }
}

export async function loadYoutubeIntegration(): Promise<YoutubeIntegration | null> {
  if (!getSupabaseEnv().configured) return null
  try {
    const service = createServiceClient()
    const { data } = await service
      .from('integration_settings')
      .select('*')
      .eq('provider', 'youtube')
      .maybeSingle()

    if (!data) return null
    const secrets = parseSecrets(data.secret_value)
    return {
      enabled: data.enabled,
      apiKey: secrets.api_key ?? '',
    }
  } catch {
    return null
  }
}

export async function fetchYoutubeMetadata(videoId: string): Promise<YoutubeVideoMeta | null> {
  const integration = await loadYoutubeIntegration()
  if (!integration?.enabled || !integration.apiKey) return null

  const url = new URL('https://www.googleapis.com/youtube/v3/videos')
  url.searchParams.set('part', 'snippet,contentDetails')
  url.searchParams.set('id', videoId)
  url.searchParams.set('key', integration.apiKey)

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) return null

  const json = await res.json() as {
    items?: Array<{
      id: string
      snippet?: { title?: string; description?: string; thumbnails?: { high?: { url?: string }; default?: { url?: string } } }
      contentDetails?: { duration?: string }
    }>
  }

  const item = json.items?.[0]
  if (!item) return null

  const durationSeconds = parseIso8601Duration(item.contentDetails?.duration)
  return {
    videoId: item.id,
    title: item.snippet?.title ?? videoId,
    description: item.snippet?.description ?? '',
    thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
    durationSeconds,
    durationLabel: formatDurationLabel(durationSeconds),
  }
}

export async function fetchYoutubeMetadataBatch(videoIds: string[]): Promise<Map<string, YoutubeVideoMeta>> {
  const integration = await loadYoutubeIntegration()
  const map = new Map<string, YoutubeVideoMeta>()
  if (!integration?.enabled || !integration.apiKey || !videoIds.length) return map

  const unique = [...new Set(videoIds.filter(Boolean))]
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50)
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'snippet,contentDetails')
    url.searchParams.set('id', batch.join(','))
    url.searchParams.set('key', integration.apiKey)

    const res = await fetch(url.toString())
    if (!res.ok) continue

    const json = await res.json() as {
      items?: Array<{
        id: string
        snippet?: { title?: string; description?: string; thumbnails?: { high?: { url?: string } } }
        contentDetails?: { duration?: string }
      }>
    }

    for (const item of json.items ?? []) {
      const durationSeconds = parseIso8601Duration(item.contentDetails?.duration)
      map.set(item.id, {
        videoId: item.id,
        title: item.snippet?.title ?? item.id,
        description: item.snippet?.description ?? '',
        thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? null,
        durationSeconds,
        durationLabel: formatDurationLabel(durationSeconds),
      })
    }
  }

  return map
}
