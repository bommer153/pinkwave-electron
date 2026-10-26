import { create } from 'zustand'
import { toast } from '@heroui/react'
import type { Playlist, PlaylistInput, Track } from '../../../shared/types'
import { moveItem } from '../utils/queue'
import { usePlayer } from './playerStore'

const api = () => window.pinkwave.library

/** IPC rejections arrive as "Error invoking remote method 'x': Error: <message>". */
export const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '') : 'Something went wrong.'

/** Runs a library call; on failure shows the reason and resolves to undefined. */
export async function safely<T>(run: () => Promise<T>): Promise<T | undefined> {
  try {
    return await run()
  } catch (e) {
    toast.danger(errorMessage(e))
    return undefined
  }
}

/** For calls that return nothing, where `safely`'s undefined can't tell success from failure. */
const succeeded = async (run: () => Promise<unknown>): Promise<boolean> => (await safely(() => run().then(() => true))) ?? false

interface LibraryState {
  playlists: Playlist[]
  /** Songs per playlist, loaded when a playlist is opened. */
  tracks: Record<number, Track[]>
  liked: Track[]
  likedIds: Set<string>
  recent: Track[]
  load(): Promise<void>
  loadPlaylistTracks(id: number): Promise<void>
  loadRecent(): Promise<void>
  createPlaylist(input: PlaylistInput, tracks?: Track[]): Promise<Playlist | undefined>
  updatePlaylist(id: number, input: PlaylistInput): Promise<void>
  deletePlaylist(id: number): Promise<boolean>
  movePlaylist(from: number, to: number): Promise<void>
  addToPlaylist(playlist: Playlist, tracks: Track[]): Promise<void>
  removeFromPlaylist(id: number, track: Track): Promise<void>
  movePlaylistTrack(id: number, from: number, to: number): Promise<void>
  toggleLike(track: Track): Promise<void>
}

export const useLibrary = create<LibraryState>((set, get) => {
  const refreshPlaylists = async () => set({ playlists: await api().playlists() })
  const refreshLiked = async () => {
    const liked = await api().liked()
    set({ liked, likedIds: new Set(liked.map((t) => t.videoId)) })
  }

  return {
    playlists: [],
    tracks: {},
    liked: [],
    likedIds: new Set(),
    recent: [],

    load: () => safely(() => Promise.all([refreshPlaylists(), refreshLiked(), get().loadRecent()])).then(() => {}),

    async loadPlaylistTracks(id) {
      const tracks = await safely(() => api().playlistTracks(id))
      if (tracks) set((s) => ({ tracks: { ...s.tracks, [id]: tracks } }))
    },

    async loadRecent() {
      set({ recent: await api().recent() })
    },

    async createPlaylist(input, tracks) {
      const playlist = await safely(() => api().createPlaylist(input))
      if (!playlist) return undefined
      if (tracks?.length) await safely(() => api().addToPlaylist(playlist.id, tracks))
      await refreshPlaylists()
      toast.success(`Created “${playlist.name}”`)
      return playlist
    },

    async updatePlaylist(id, input) {
      if (await safely(() => api().updatePlaylist(id, input))) await refreshPlaylists()
    },

    async deletePlaylist(id) {
      const ok = await succeeded(() => api().deletePlaylist(id))
      if (ok) await refreshPlaylists()
      return ok
    },

    async movePlaylist(from, to) {
      const playlists = moveItem(get().playlists, from, to)
      set({ playlists }) // optimistic; the order is cheap to recompute if the save fails
      if (!(await succeeded(() => api().reorderPlaylists(playlists.map((p) => p.id))))) await safely(refreshPlaylists)
    },

    async addToPlaylist(playlist, tracks) {
      const added = await safely(() => api().addToPlaylist(playlist.id, tracks))
      if (added === undefined) return
      if (added === 0) toast(tracks.length === 1 ? `Already in “${playlist.name}”` : `All of these are already in “${playlist.name}”`)
      else toast.success(`Added ${added === 1 ? '' : `${added} songs `}to “${playlist.name}”`)
      await Promise.all([refreshPlaylists(), get().tracks[playlist.id] && get().loadPlaylistTracks(playlist.id)])
    },

    async removeFromPlaylist(id, track) {
      if (!(await succeeded(() => api().removeFromPlaylist(id, track.videoId)))) return
      await Promise.all([refreshPlaylists(), get().loadPlaylistTracks(id)])
    },

    async movePlaylistTrack(id, from, to) {
      set((s) => ({ tracks: { ...s.tracks, [id]: moveItem(s.tracks[id] ?? [], from, to) } }))
      if (!(await succeeded(() => api().movePlaylistTrack(id, from, to)))) await get().loadPlaylistTracks(id)
    },

    async toggleLike(track) {
      const liked = !get().likedIds.has(track.videoId)
      // Optimistic so the heart reacts instantly.
      set((s) => {
        const likedIds = new Set(s.likedIds)
        if (liked) likedIds.add(track.videoId)
        else likedIds.delete(track.videoId)
        return { likedIds }
      })
      await safely(() => api().setLiked(track, liked))
      await safely(refreshLiked)
    }
  }
})

// Record a track in Recently Played once it has actually played for a second (not skipped/failed ones).
let recorded: object | undefined
usePlayer.subscribe((s) => {
  const current = s.queue[s.index]
  if (!current || current === recorded || !s.isPlaying || s.position < 1) return
  recorded = current
  safely(() => api().recordPlay(current)).then(() => safely(useLibrary.getState().loadRecent))
})
