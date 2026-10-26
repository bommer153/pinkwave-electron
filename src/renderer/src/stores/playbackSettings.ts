import { usePlayer } from './playerStore'

/** Restores repeat/shuffle/volume/autoplay from SQLite, then saves them whenever they change. */
let started = false

export async function initPlaybackSettings(): Promise<void> {
  if (started) return // StrictMode runs mount effects twice in development
  started = true
  const saved = await window.pinkwave.settings.playback()
  usePlayer.setState({ repeat: saved.repeat, shuffle: saved.shuffle, autoplay: saved.autoplay })
  usePlayer.getState().setVolume(saved.volume)

  let timer: number | undefined
  usePlayer.subscribe((s, prev) => {
    if (s.repeat === prev.repeat && s.shuffle === prev.shuffle && s.volume === prev.volume && s.autoplay === prev.autoplay) return
    clearTimeout(timer)
    // Debounced so dragging the volume slider doesn't write on every step.
    timer = window.setTimeout(
      () => window.pinkwave.settings.savePlayback({ repeat: s.repeat, shuffle: s.shuffle, volume: s.volume, autoplay: s.autoplay }),
      300
    )
  })
}
