import { create } from 'zustand'
import type { RepeatMode, Track } from '../../../shared/types'
import type { EngineEvents, PlaybackEngine } from '../services/playbackEngine'
import { moveItem, shuffled } from '../utils/queue'

interface PlayerState {
  /** Play order. Entries are per-queue copies, so object identity tells duplicates apart. */
  queue: Track[]
  /** Unshuffled order, restored when shuffle is turned off. Only meaningful while shuffle is on. */
  original: Track[]
  index: number
  isPlaying: boolean
  position: number
  duration: number
  volume: number
  muted: boolean
  repeat: RepeatMode
  shuffle: boolean
  /** Keep playing the queue when a song ends. */
  autoplay: boolean
  /** Last playback error, shown in the player until something plays. */
  error: string | null
  playTracks(tracks: Track[], startIndex: number): void
  /** Toggles if the chosen track is already current, otherwise plays the list from it. */
  playOrToggle(tracks: Track[], index: number): void
  togglePlay(): void
  next(): void
  previous(): void
  seek(seconds: number): void
  setVolume(volume: number): void
  toggleMute(): void
  cycleRepeat(): void
  toggleShuffle(): void
  setRepeat(repeat: RepeatMode): void
  setAutoplay(autoplay: boolean): void
  addToQueue(tracks: Track[]): void
  playNext(tracks: Track[]): void
  removeFromQueue(index: number): void
  moveInQueue(from: number, to: number): void
  jumpTo(index: number): void
  /** Removes everything after the current track. */
  clearQueue(): void
}

const REPEAT_ORDER: RepeatMode[] = ['off', 'all', 'one']
const copy = (tracks: Track[]) => tracks.map((t) => ({ ...t }))

let engine: PlaybackEngine | null = null

/** Called once by the component hosting the player; later calls are ignored. */
export function attachEngine(create: (events: EngineEvents) => PlaybackEngine): void {
  if (engine) return
  engine = create(engineEvents)
  const { volume, muted } = usePlayer.getState()
  engine.setVolume(volume)
  engine.setMuted(muted)
}

export const usePlayer = create<PlayerState>((set, get) => {
  const playAt = (index: number) => {
    const track = get().queue[index]
    if (!track) return
    set({ index, position: 0, duration: track.duration ?? 0, isPlaying: true })
    engine?.load(track.videoId, true)
  }

  return {
    queue: [],
    original: [],
    index: -1,
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 70,
    muted: false,
    repeat: 'off',
    shuffle: false,
    autoplay: true,
    error: null,

    playTracks(tracks, startIndex) {
      const list = copy(tracks)
      const start = list[startIndex]
      if (get().shuffle && start) {
        set({ original: list, queue: [start, ...shuffled(list.filter((t) => t !== start))] })
        playAt(0)
      } else {
        set({ original: [], queue: list })
        playAt(startIndex)
      }
    },
    playOrToggle(tracks, index) {
      const { queue, index: current } = get()
      if (queue[current]?.videoId === tracks[index]?.videoId) get().togglePlay()
      else get().playTracks(tracks, index)
    },
    togglePlay() {
      const { index, isPlaying, queue } = get()
      if (index < 0) return queue.length ? playAt(0) : undefined
      if (isPlaying) engine?.pause()
      else engine?.play()
      set({ isPlaying: !isPlaying })
    },
    next() {
      const { index, queue, repeat, shuffle } = get()
      if (index < queue.length - 1) return playAt(index + 1)
      if (repeat !== 'all' || !queue.length) return
      // New order for the next lap, never starting with the song that just played.
      if (shuffle) set({ queue: shuffled(queue, queue[index]) })
      playAt(0)
    },
    previous() {
      const { index, position } = get()
      if (position > 3 || index <= 0) get().seek(0)
      else playAt(index - 1)
    },
    seek(seconds) {
      if (!Number.isFinite(seconds)) return
      const position = Math.max(0, seconds)
      engine?.seek(position)
      set({ position })
    },
    setVolume(volume) {
      engine?.setVolume(volume)
      engine?.setMuted(false)
      set({ volume, muted: false })
    },
    toggleMute() {
      const { volume, muted } = get()
      if (volume === 0) return get().setVolume(50)
      engine?.setMuted(!muted)
      set({ muted: !muted })
    },
    cycleRepeat: () => set((s) => ({ repeat: REPEAT_ORDER[(REPEAT_ORDER.indexOf(s.repeat) + 1) % 3] })),
    setRepeat: (repeat) => set({ repeat }),
    setAutoplay: (autoplay) => set({ autoplay }),
    toggleShuffle() {
      const { shuffle, queue, index, original } = get()
      const current = queue[index]
      if (!shuffle) {
        // Current song stays playing at the top; everything else is randomized.
        const rest = queue.filter((t) => t !== current)
        return set({ shuffle: true, original: queue, queue: current ? [current, ...shuffled(rest)] : shuffled(rest), index: current ? 0 : -1 })
      }
      let restored = original
      let at = current ? restored.indexOf(current) : -1
      if (current && at < 0) [restored, at] = [[current, ...restored], 0]
      set({ shuffle: false, original: [], queue: restored, index: at })
    },
    addToQueue(tracks) {
      const added = copy(tracks)
      set((s) => ({ queue: [...s.queue, ...added], original: s.shuffle ? [...s.original, ...added] : s.original }))
    },
    playNext(tracks) {
      const added = copy(tracks)
      set((s) => {
        const insertAfter = (list: Track[], at: number) => [...list.slice(0, at + 1), ...added, ...list.slice(at + 1)]
        return {
          queue: insertAfter(s.queue, s.index),
          original: s.shuffle ? insertAfter(s.original, s.original.indexOf(s.queue[s.index])) : s.original
        }
      })
    },
    removeFromQueue(i) {
      const { queue, index, original } = get()
      if (i === index || !queue[i]) return
      const removed = queue[i]
      set({
        queue: queue.filter((t) => t !== removed),
        original: original.filter((t) => t !== removed),
        index: i < index ? index - 1 : index
      })
    },
    moveInQueue(from, to) {
      const { queue, index } = get()
      const current = queue[index]
      const moved = moveItem(queue, from, to)
      set({ queue: moved, index: current ? moved.indexOf(current) : index })
    },
    jumpTo: (i) => playAt(i),
    clearQueue() {
      const { queue, index, original } = get()
      const kept = queue.slice(0, index + 1)
      set({ queue: kept, original: original.filter((t) => kept.includes(t)) })
    }
  }
})

// Live streams have no duration in the Data API metadata, while the player reports their running
// length as a "duration". Keep 0 for those so the UI shows LIVE instead of a fake seek bar.
const playerDuration = (s: PlayerState, reported: number) => (s.queue[s.index]?.duration ? reported || s.duration : 0)

const engineEvents: EngineEvents = {
  onPlaying: (duration) => usePlayer.setState((s) => ({ isPlaying: true, error: null, duration: playerDuration(s, duration) })),
  onPaused: () => usePlayer.setState({ isPlaying: false }),
  onTime: (position, duration) => usePlayer.setState((s) => ({ position, duration: playerDuration(s, duration) })),
  onEnded() {
    const s = usePlayer.getState()
    if (s.repeat === 'one') {
      s.seek(0)
      engine?.play()
    } else if (s.autoplay && (s.index < s.queue.length - 1 || s.repeat === 'all')) s.next()
    else usePlayer.setState({ isPlaying: false, position: 0 })
  },
  onError(message, skippable) {
    usePlayer.setState({ error: message, isPlaying: false })
    // Skip unplayable videos (deleted, private, embedding disabled) instead of stalling the queue.
    const s = usePlayer.getState()
    if (skippable && s.index < s.queue.length - 1) s.next()
  }
}

export const useCurrentTrack = () => usePlayer((s) => s.queue[s.index] as Track | undefined)
