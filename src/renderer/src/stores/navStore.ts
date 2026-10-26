import { create } from 'zustand'

export type View =
  | { page: 'home' }
  | { page: 'search' }
  | { page: 'library' }
  | { page: 'liked' }
  | { page: 'recent' }
  | { page: 'settings' }
  | { page: 'playlist'; id: number }

interface NavState {
  history: View[]
  index: number
  go(view: View): void
  back(): void
  forward(): void
}

const same = (a: View, b: View) => JSON.stringify(a) === JSON.stringify(b)

// In-app browser-style history; the player lives outside it so navigation never touches playback.
export const useNav = create<NavState>((set, get) => ({
  history: [{ page: 'home' }],
  index: 0,
  go(view) {
    const { history, index } = get()
    if (same(history[index], view)) return
    set({ history: [...history.slice(0, index + 1), view], index: index + 1 })
  },
  back: () => set((s) => ({ index: Math.max(0, s.index - 1) })),
  forward: () => set((s) => ({ index: Math.min(s.history.length - 1, s.index + 1) }))
}))

export const useView = () => useNav((s) => s.history[s.index])
