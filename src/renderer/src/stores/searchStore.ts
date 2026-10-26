import { create } from 'zustand'
import type { Track } from '../../../shared/types'

interface SearchState {
  query: string
  /** The query the current results belong to. */
  searched: string
  results: Track[]
  nextPageToken?: string
  loading: boolean
  loadingMore: boolean
  error: string | null
  setQuery(query: string): void
  run(): Promise<void>
  loadMore(): Promise<void>
}

let requestId = 0

// Kept in a store so leaving and returning to Search doesn't spend quota re-fetching.
export const useSearch = create<SearchState>((set, get) => ({
  query: '',
  searched: '',
  results: [],
  loading: false,
  loadingMore: false,
  error: null,
  setQuery: (query) => set({ query }),
  async run() {
    const query = get().query.trim()
    if (query === get().searched) return
    const id = ++requestId
    if (!query) return set({ searched: '', results: [], nextPageToken: undefined, error: null, loading: false })
    set({ loading: true, error: null })
    const res = await window.pinkwave.youtube.search(query)
    if (id !== requestId) return // a newer search superseded this one
    set(
      res.ok
        ? { loading: false, searched: query, results: res.data.tracks, nextPageToken: res.data.nextPageToken }
        : { loading: false, searched: '', error: res.error }
    )
  },
  async loadMore() {
    const { searched, nextPageToken, loadingMore } = get()
    if (!nextPageToken || loadingMore) return
    const id = requestId
    set({ loadingMore: true })
    const res = await window.pinkwave.youtube.search(searched, nextPageToken)
    if (id !== requestId) return
    set((s) =>
      res.ok
        ? {
            loadingMore: false,
            // Pages can overlap; keep each video once.
            results: [...s.results, ...res.data.tracks.filter((t) => !s.results.some((r) => r.videoId === t.videoId))],
            nextPageToken: res.data.nextPageToken
          }
        : { loadingMore: false, error: res.error }
    )
  }
}))
