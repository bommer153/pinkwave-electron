import type { DesktopSettings, PlaybackSettings, PlayerCommand, PlayerSnapshot, Playlist, PlaylistInput, Track } from './types'

// Single source of truth for IPC channel names and the API the preload exposes.
export const IPC = {
  appInfo: 'app:info',
  openExternal: 'app:open-external',
  youtubeStatus: 'youtube:status',
  youtubeSetKey: 'youtube:set-key',
  youtubeSearch: 'youtube:search',
  youtubeTrending: 'youtube:trending',
  playlists: 'library:playlists',
  createPlaylist: 'library:create-playlist',
  updatePlaylist: 'library:update-playlist',
  deletePlaylist: 'library:delete-playlist',
  reorderPlaylists: 'library:reorder-playlists',
  chooseCover: 'library:choose-cover',
  playlistTracks: 'library:playlist-tracks',
  addToPlaylist: 'library:add-to-playlist',
  removeFromPlaylist: 'library:remove-from-playlist',
  movePlaylistTrack: 'library:move-playlist-track',
  liked: 'library:liked',
  setLiked: 'library:set-liked',
  recent: 'library:recent',
  recordPlay: 'library:record-play',
  playbackSettings: 'settings:playback',
  savePlaybackSettings: 'settings:save-playback',
  desktopSettings: 'settings:desktop',
  saveDesktopSettings: 'settings:save-desktop',
  /** main window → main: player snapshot */
  playerState: 'player:state',
  /** mini-player → main → main window: remote control */
  playerCommand: 'player:command',
  openMiniPlayer: 'mini:open',
  closeMiniPlayer: 'mini:close'
} as const

export interface AppInfo {
  name: string
  version: string
  platform: NodeJS.Platform
}

/** Errors cross IPC as values so the renderer gets a clean, user-facing message. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string }

export interface YouTubeStatus {
  configured: boolean
  /** Key comes from the YOUTUBE_API_KEY env var rather than saved settings. */
  fromEnv: boolean
  /** Present only when the key was checked against the API. */
  verified?: Result<null>
}

export interface SearchPage {
  tracks: Track[]
  nextPageToken?: string
}

export interface PinkwaveApi {
  getAppInfo(): Promise<AppInfo>
  openExternal(url: string): Promise<void>
  youtube: {
    status(verify: boolean): Promise<YouTubeStatus>
    /** Verifies before saving; an invalid key is not stored. null removes the saved key. */
    setKey(key: string | null): Promise<YouTubeStatus>
    search(query: string, pageToken?: string): Promise<Result<SearchPage>>
    trending(): Promise<Result<Track[]>>
  }
  library: {
    playlists(): Promise<Playlist[]>
    createPlaylist(input: PlaylistInput): Promise<Playlist>
    updatePlaylist(id: number, input: PlaylistInput): Promise<Playlist>
    deletePlaylist(id: number): Promise<void>
    reorderPlaylists(ids: number[]): Promise<void>
    /** Opens a file picker; returns the image as a square JPEG data URL, or null if cancelled. */
    chooseCover(): Promise<string | null>
    playlistTracks(id: number): Promise<Track[]>
    /** Returns how many tracks were added (duplicates are skipped). */
    addToPlaylist(id: number, tracks: Track[]): Promise<number>
    removeFromPlaylist(id: number, videoId: string): Promise<void>
    movePlaylistTrack(id: number, from: number, to: number): Promise<void>
    liked(): Promise<Track[]>
    setLiked(track: Track, liked: boolean): Promise<void>
    recent(): Promise<Track[]>
    recordPlay(track: Track): Promise<void>
  }
  settings: {
    playback(): Promise<PlaybackSettings>
    savePlayback(settings: PlaybackSettings): Promise<void>
    desktop(): Promise<DesktopSettings>
    saveDesktop(changes: Partial<Omit<DesktopSettings, 'launchOnStartupAvailable'>>): Promise<DesktopSettings>
  }
  desktop: {
    /** Main window only: publish player state to the tray and mini-player. */
    sendPlayerState(snapshot: PlayerSnapshot): void
    /** Main window only: commands from the tray, mini-player and media keys. Returns an unsubscribe. */
    onPlayerCommand(listener: (command: PlayerCommand) => void): () => void
    /** Mini-player only. */
    onPlayerState(listener: (snapshot: PlayerSnapshot) => void): () => void
    playerCommand(command: PlayerCommand): void
    openMiniPlayer(): void
    /** Closes the mini-player and brings back the main window. */
    closeMiniPlayer(): void
  }
}
