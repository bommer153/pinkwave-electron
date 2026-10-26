export interface Track {
  videoId: string
  title: string
  artist: string
  thumbnail: string
  /** Seconds; unknown until metadata or the player reports it. */
  duration?: number
  channelId?: string
}

export interface Playlist {
  id: number
  name: string
  description: string
  /** JPEG data URL, or null for a generated gradient. */
  cover: string | null
  trackCount: number
  /** Seconds, summed over songs with a known duration. */
  totalDuration: number
}

export interface PlaylistInput {
  name: string
  description: string
  cover: string | null
}

export type RepeatMode = 'off' | 'all' | 'one'

/** What the main window's player broadcasts to the tray and mini-player. */
export interface PlayerSnapshot {
  track: Track | null
  isPlaying: boolean
  /** Whole seconds, so ticks only cross IPC once a second. */
  position: number
  duration: number
  volume: number
  muted: boolean
  repeat: RepeatMode
  shuffle: boolean
}

/** Remote control for the player, from the tray, mini-player or media keys. */
export type PlayerCommand =
  | { type: 'toggle' | 'next' | 'previous' | 'toggleMute' | 'cycleRepeat' | 'toggleShuffle' }
  | { type: 'seek'; seconds: number }
  | { type: 'volume'; volume: number }

export type CloseBehavior = 'ask' | 'tray' | 'quit'

export interface DesktopSettings {
  closeBehavior: CloseBehavior
  minimizeToTray: boolean
  miniPlayerOnTop: boolean
  launchOnStartup: boolean
  /** Login items only make sense for the installed app, not `npm run dev`. */
  launchOnStartupAvailable: boolean
}

export interface PlaybackSettings {
  repeat: RepeatMode
  shuffle: boolean
  volume: number
  /** Keep playing the queue when a song ends. */
  autoplay: boolean
}
