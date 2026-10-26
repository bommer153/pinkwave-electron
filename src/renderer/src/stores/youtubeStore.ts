import { create } from 'zustand'
import type { YouTubeStatus } from '../../../shared/ipc'
import type { Track } from '../../../shared/types'

interface YouTubeState {
  status: YouTubeStatus | null
  trending: Track[] | null
  trendingError: string | null
  refreshStatus(verify?: boolean): Promise<void>
  setKey(key: string | null): Promise<YouTubeStatus>
  loadTrending(force?: boolean): Promise<void>
}

export const useYouTube = create<YouTubeState>((set, get) => ({
  status: null,
  trending: null,
  trendingError: null,
  async refreshStatus(verify = false) {
    set({ status: await window.pinkwave.youtube.status(verify) })
  },
  async setKey(key) {
    const status = await window.pinkwave.youtube.setKey(key)
    set({ status })
    // A new key may unlock (or remove) discovery; let Home reload it.
    if (status.verified?.ok || key === null) set({ trending: null, trendingError: null })
    return status
  },
  async loadTrending(force = false) {
    if (!force && (get().trending || get().trendingError)) return
    set({ trendingError: null })
    const res = await window.pinkwave.youtube.trending()
    set(res.ok ? { trending: res.data } : { trendingError: res.error })
  }
}))
