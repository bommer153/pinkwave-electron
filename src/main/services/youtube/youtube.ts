import type { Track } from '../../../shared/types'
import type { SearchPage } from '../../../shared/ipc'
import { cleanArtist, decodeEntities, parseDuration } from './format'

const API = 'https://www.googleapis.com/youtube/v3'
const SEARCH_TTL = 30 * 60_000
const TRENDING_TTL = 60 * 60_000

/** Message is safe to show the user as-is. */
export class YouTubeError extends Error {}

// Quota-aware: identical requests within the TTL never hit the API twice.
const cache = new Map<string, { expires: number; value: unknown }>()

async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return hit.value as T
  const value = await load()
  cache.set(key, { expires: Date.now() + ttl, value })
  return value
}

async function call(path: string, params: Record<string, string>, key: string): Promise<any> {
  let res: Response
  try {
    res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, key })}`)
  } catch {
    throw new YouTubeError("Couldn't reach YouTube. Check your internet connection.")
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new YouTubeError(describeError(res.status, body))
  return body
}

function describeError(status: number, body: any): string {
  const reason: string | undefined = body?.error?.errors?.[0]?.reason
  const message: string = body?.error?.message ?? ''
  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded')
    return 'The daily YouTube API quota is used up. It resets at midnight Pacific Time.'
  if (reason === 'keyInvalid' || message.includes('API key not valid')) return 'This API key is not valid.'
  if (reason === 'accessNotConfigured' || message.includes('has not been used'))
    return "YouTube Data API v3 isn't enabled for this key's Google Cloud project."
  if (reason === 'ipRefererBlocked' || reason === 'forbidden')
    return 'This API key is restricted and does not allow requests from Pinkwave.'
  return message || `YouTube request failed (HTTP ${status}).`
}

function toTrack(videoId: string, snippet: any, isoDuration?: string): Track {
  const t = snippet.thumbnails ?? {}
  return {
    videoId,
    title: decodeEntities(snippet.title ?? ''),
    artist: cleanArtist(snippet.channelTitle ?? ''),
    thumbnail: (t.high ?? t.medium ?? t.default)?.url ?? '',
    duration: parseDuration(isoDuration),
    ...(snippet.channelId && { channelId: snippet.channelId })
  }
}

export function search(key: string, query: string, pageToken?: string): Promise<SearchPage> {
  return cached(`search:${query.toLowerCase()}:${pageToken ?? ''}`, SEARCH_TTL, async () => {
    const res = await call(
      'search',
      {
        part: 'snippet',
        type: 'video',
        videoCategoryId: '10', // Music
        videoEmbeddable: 'true', // only what the IFrame player is allowed to play
        maxResults: '20',
        q: query,
        ...(pageToken && { pageToken })
      },
      key
    )
    const items: any[] = res.items.filter((i: any) => i.id?.videoId)
    // Search has no durations; videos.list costs 1 unit vs 100 for search.
    const durations = new Map<string, string>()
    if (items.length) {
      const details = await call('videos', { part: 'contentDetails', id: items.map((i) => i.id.videoId).join(',') }, key)
      for (const v of details.items) durations.set(v.id, v.contentDetails?.duration)
    }
    return {
      tracks: items.map((i) => toTrack(i.id.videoId, i.snippet, durations.get(i.id.videoId))),
      nextPageToken: res.nextPageToken
    }
  })
}

export function trending(key: string, regionCode: string): Promise<Track[]> {
  return cached(`trending:${regionCode}`, TRENDING_TTL, async () => {
    const res = await call(
      'videos',
      { part: 'snippet,contentDetails', chart: 'mostPopular', videoCategoryId: '10', regionCode, maxResults: '24' },
      key
    )
    return res.items.map((v: any) => toTrack(v.id, v.snippet, v.contentDetails?.duration))
  })
}

/** Cheapest possible authenticated call (1 quota unit). */
export async function verifyKey(key: string): Promise<void> {
  await call('videos', { part: 'id', id: 'dQw4w9WgXcQ' }, key)
}
