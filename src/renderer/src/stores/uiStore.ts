import { create } from 'zustand'
import type { Playlist, Track } from '../../../shared/types'

export type PlaylistModalState =
  | { mode: 'create'; /** Songs to add once the playlist exists. */ tracks?: Track[] }
  | { mode: 'edit'; playlist: Playlist }

interface UiState {
  sidebarCollapsed: boolean
  queueOpen: boolean
  playlistModal: PlaylistModalState | null
  /** Songs waiting for the user to pick a playlist. */
  addToPlaylist: Track[] | null
  toggleSidebar(): void
  toggleQueue(): void
  openPlaylistModal(state: PlaylistModalState | null): void
  openAddToPlaylist(tracks: Track[] | null): void
}

export const useUi = create<UiState>((set) => ({
  sidebarCollapsed: false,
  queueOpen: false,
  playlistModal: null,
  addToPlaylist: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleQueue: () => set((s) => ({ queueOpen: !s.queueOpen })),
  openPlaylistModal: (playlistModal) => set({ playlistModal }),
  openAddToPlaylist: (addToPlaylist) => set({ addToPlaylist })
}))
