// Validation for everything the renderer sends over IPC. Throws a user-safe Error on bad input.
import type {
  CloseBehavior,
  DesktopSettings,
  PlaybackSettings,
  PlayerCommand,
  PlayerSnapshot,
  PlaylistInput,
  RepeatMode,
  Track
} from '../shared/types'

const fail = (what: string): never => {
  throw new Error(`Invalid ${what}.`)
}

const str = (v: unknown, what: string, max: number, min = 0): string =>
  typeof v === 'string' && v.length >= min && v.length <= max ? v : fail(what)

export const asId = (v: unknown): number => (Number.isSafeInteger(v) && (v as number) > 0 ? (v as number) : fail('id'))

export const asIndex = (v: unknown): number => (Number.isSafeInteger(v) && (v as number) >= 0 ? (v as number) : fail('position'))

export const asVideoId = (v: unknown): string => (typeof v === 'string' && /^[\w-]{11}$/.test(v) ? v : fail('video id'))

export function asTrack(v: unknown): Track {
  if (typeof v !== 'object' || v === null) return fail('song')
  const t = v as Record<string, unknown>
  const thumbnail = str(t.thumbnail, 'thumbnail', 500)
  if (thumbnail && !thumbnail.startsWith('https://')) fail('thumbnail')
  const duration = t.duration
  if (duration !== undefined && !(typeof duration === 'number' && Number.isFinite(duration) && duration >= 0)) fail('duration')
  return {
    videoId: asVideoId(t.videoId),
    title: str(t.title, 'title', 300),
    artist: str(t.artist, 'artist', 200),
    thumbnail,
    ...(duration !== undefined && { duration: Math.round(duration as number) }),
    ...(t.channelId !== undefined && { channelId: str(t.channelId, 'channel', 100) })
  }
}

export const asTracks = (v: unknown): Track[] => (Array.isArray(v) && v.length <= 1000 ? v.map(asTrack) : fail('song list'))

export const asIds = (v: unknown): number[] => (Array.isArray(v) && v.length <= 10000 ? v.map(asId) : fail('id list'))

export function asPlaylistInput(v: unknown): PlaylistInput {
  if (typeof v !== 'object' || v === null) return fail('playlist')
  const p = v as Record<string, unknown>
  const name = str(p.name, 'playlist name', 100).trim()
  if (!name) fail('playlist name')
  const cover = p.cover ?? null
  if (cover !== null && !(typeof cover === 'string' && cover.startsWith('data:image/jpeg;base64,') && cover.length <= 2_000_000))
    fail('cover image')
  return { name, description: str(p.description ?? '', 'description', 300).trim(), cover: cover as string | null }
}

const REPEAT_MODES: RepeatMode[] = ['off', 'all', 'one']

const finite = (v: unknown, what: string, min = 0, max = Number.MAX_SAFE_INTEGER): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : fail(what)

export function asPlayerSnapshot(v: unknown): PlayerSnapshot {
  if (typeof v !== 'object' || v === null) return fail('player state')
  const s = v as Record<string, unknown>
  if (!REPEAT_MODES.includes(s.repeat as RepeatMode)) fail('repeat mode')
  return {
    track: s.track === null ? null : asTrack(s.track),
    isPlaying: s.isPlaying === true,
    position: finite(s.position, 'position'),
    duration: finite(s.duration, 'duration'),
    volume: finite(s.volume, 'volume', 0, 100),
    muted: s.muted === true,
    repeat: s.repeat as RepeatMode,
    shuffle: s.shuffle === true
  }
}

const SIMPLE_COMMANDS = ['toggle', 'next', 'previous', 'toggleMute', 'cycleRepeat', 'toggleShuffle'] as const

export function asPlayerCommand(v: unknown): PlayerCommand {
  if (typeof v !== 'object' || v === null) return fail('command')
  const c = v as Record<string, unknown>
  if (SIMPLE_COMMANDS.includes(c.type as (typeof SIMPLE_COMMANDS)[number])) return { type: c.type as (typeof SIMPLE_COMMANDS)[number] }
  if (c.type === 'seek') return { type: 'seek', seconds: finite(c.seconds, 'seek position') }
  if (c.type === 'volume') return { type: 'volume', volume: Math.round(finite(c.volume, 'volume', 0, 100)) }
  return fail('command')
}

const CLOSE_BEHAVIORS: CloseBehavior[] = ['ask', 'tray', 'quit']

export function asDesktopChanges(v: unknown): Partial<Omit<DesktopSettings, 'launchOnStartupAvailable'>> {
  if (typeof v !== 'object' || v === null) return fail('settings')
  const c = v as Record<string, unknown>
  const out: Partial<Omit<DesktopSettings, 'launchOnStartupAvailable'>> = {}
  if (c.closeBehavior !== undefined) out.closeBehavior = CLOSE_BEHAVIORS.includes(c.closeBehavior as CloseBehavior) ? (c.closeBehavior as CloseBehavior) : fail('close behavior')
  for (const key of ['minimizeToTray', 'miniPlayerOnTop', 'launchOnStartup'] as const) {
    if (c[key] !== undefined) out[key] = typeof c[key] === 'boolean' ? c[key] : fail(key)
  }
  return out
}

export function asPlaybackSettings(v: unknown): PlaybackSettings {
  if (typeof v !== 'object' || v === null) return fail('playback settings')
  const s = v as Record<string, unknown>
  if (!REPEAT_MODES.includes(s.repeat as RepeatMode)) fail('repeat mode')
  if (typeof s.shuffle !== 'boolean' || typeof s.autoplay !== 'boolean') fail('playback settings')
  if (!Number.isInteger(s.volume) || (s.volume as number) < 0 || (s.volume as number) > 100) fail('volume')
  return { repeat: s.repeat as RepeatMode, shuffle: s.shuffle as boolean, volume: s.volume as number, autoplay: s.autoplay as boolean }
}
