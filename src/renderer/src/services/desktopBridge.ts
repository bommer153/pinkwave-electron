import type { PlayerCommand, PlayerSnapshot } from '../../../shared/types'
import { usePlayer } from '../stores/playerStore'

let started = false

/**
 * Main window only. Publishes player state to the tray / mini-player, runs their commands,
 * and exposes the same controls to the OS (media keys, Windows media overlay) via Media Session.
 */
export function initDesktopBridge(): void {
  if (started) return // StrictMode runs mount effects twice in development
  started = true
  const desktop = window.pinkwave.desktop

  let last = ''
  const publish = () => {
    const s = usePlayer.getState()
    const t = s.queue[s.index]
    const snapshot: PlayerSnapshot = {
      track: t ? { videoId: t.videoId, title: t.title, artist: t.artist, thumbnail: t.thumbnail, ...(t.duration && { duration: t.duration }) } : null,
      isPlaying: s.isPlaying,
      position: Math.floor(s.position),
      duration: Math.floor(s.duration),
      volume: s.volume,
      muted: s.muted,
      repeat: s.repeat,
      shuffle: s.shuffle
    }
    const key = JSON.stringify(snapshot)
    if (key === last) return // position ticks 4×/s; only whole-second changes cross IPC
    last = key
    desktop.sendPlayerState(snapshot)
    updateMediaSession(snapshot)
  }
  usePlayer.subscribe(publish)
  publish()

  // Chromium gives Windows' media controls (overlay + media keys) to the frame that is playing sound,
  // i.e. the YouTube iframe, whose session has no next/previous and isn't ours. Playing silence here
  // while music plays makes this frame's Media Session the one Windows sees.
  const anchor = new Audio(silentWavUrl())
  anchor.loop = true
  usePlayer.subscribe((s, prev) => {
    if (s.isPlaying === prev.isPlaying) return
    if (s.isPlaying) anchor.play().catch(() => {})
    else anchor.pause()
  })

  desktop.onPlayerCommand(run)

  const ms = navigator.mediaSession
  ms.setActionHandler('play', () => !usePlayer.getState().isPlaying && run({ type: 'toggle' }))
  ms.setActionHandler('pause', () => usePlayer.getState().isPlaying && run({ type: 'toggle' }))
  ms.setActionHandler('nexttrack', () => run({ type: 'next' }))
  ms.setActionHandler('previoustrack', () => run({ type: 'previous' }))
  ms.setActionHandler('seekto', (d) => d.seekTime !== undefined && run({ type: 'seek', seconds: d.seekTime }))
}

function run(command: PlayerCommand): void {
  const p = usePlayer.getState()
  switch (command.type) {
    case 'toggle':
      return p.togglePlay()
    case 'next':
      return p.next()
    case 'previous':
      return p.previous()
    case 'toggleMute':
      return p.toggleMute()
    case 'cycleRepeat':
      return p.cycleRepeat()
    case 'toggleShuffle':
      return p.toggleShuffle()
    case 'seek':
      return p.seek(command.seconds)
    case 'volume':
      return p.setVolume(command.volume)
  }
}

/** One second of 8 kHz 8-bit mono silence as a WAV blob URL. */
function silentWavUrl(): string {
  const samples = 8000
  const view = new DataView(new ArrayBuffer(44 + samples))
  const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + samples, true)
  text(8, 'WAVEfmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, 8000, true) // sample rate
  view.setUint32(28, 8000, true) // byte rate
  view.setUint16(32, 1, true) // block align
  view.setUint16(34, 8, true) // bits per sample
  text(36, 'data')
  view.setUint32(40, samples, true)
  for (let i = 0; i < samples; i++) view.setUint8(44 + i, 128) // 8-bit PCM silence is the midpoint
  return URL.createObjectURL(new Blob([view.buffer], { type: 'audio/wav' }))
}

let lastVideoId: string | undefined

function updateMediaSession(s: PlayerSnapshot): void {
  const ms = navigator.mediaSession
  if (s.track?.videoId !== lastVideoId) {
    lastVideoId = s.track?.videoId
    ms.metadata = s.track
      ? new MediaMetadata({ title: s.track.title, artist: s.track.artist, album: 'Pinkwave', artwork: s.track.thumbnail ? [{ src: s.track.thumbnail, sizes: '480x360', type: 'image/jpeg' }] : [] })
      : null
  }
  ms.playbackState = s.track ? (s.isPlaying ? 'playing' : 'paused') : 'none'
  if (s.track && s.duration > 0) {
    try {
      ms.setPositionState({ duration: s.duration, position: Math.min(s.position, s.duration), playbackRate: 1 })
    } catch {
      // position can briefly exceed a stale duration while tracks change
    }
  }
}
