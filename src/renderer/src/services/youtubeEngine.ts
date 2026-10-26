/// <reference types="youtube" />
import type { EngineEvents, PlaybackEngine } from './playbackEngine'

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void
  }
}

const ERRORS: Record<number, string> = {
  2: 'This video link is invalid.',
  5: "This video can't be played in the player.",
  100: 'This video was removed or made private.',
  101: "The owner doesn't allow this video to be played outside YouTube.",
  150: "The owner doesn't allow this video to be played outside YouTube.",
  152: 'YouTube rejected the player request.',
  153: 'YouTube rejected the player request.'
}

let apiLoaded: Promise<void> | null = null

// Official IFrame Player API, loaded once from YouTube.
function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  apiLoaded ??= new Promise<void>((resolve, reject) => {
    window.onYouTubeIframeAPIReady = () => resolve()
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.onerror = () => {
      apiLoaded = null
      script.remove()
      reject(new Error("Couldn't load the YouTube player. Check your internet connection."))
    }
    document.head.append(script)
  })
  return apiLoaded
}

export function createYouTubeEngine(host: HTMLElement, events: EngineEvents): PlaybackEngine {
  let player: YT.Player | null = null
  let creating: Promise<YT.Player> | null = null
  let timer: number | undefined
  let volume = 100
  let muted = false

  // Both getters can return undefined while the player switches videos.
  const tick = () => player && events.onTime(player.getCurrentTime() || 0, player.getDuration() || 0)
  const startTimer = () => {
    clearInterval(timer)
    timer = window.setInterval(tick, 250)
  }
  const stopTimer = () => {
    clearInterval(timer)
    tick()
  }

  // The <iframe> is created on first use and then reused for every track (one instance, ever).
  const ready = (): Promise<YT.Player> =>
    (creating ??= loadApi().then(
      () =>
        new Promise<YT.Player>((resolve) => {
          const p = new YT.Player(host, {
            // Privacy-enhanced embed mode: no YouTube cookies until the user interacts.
            host: 'https://www.youtube-nocookie.com',
            width: '100%',
            height: '100%',
            playerVars: { autoplay: 1, controls: 0, disablekb: 1, rel: 0, playsinline: 1, iv_load_policy: 3, fs: 0 },
            events: {
              onReady: () => {
                player = p
                p.setVolume(volume)
                if (muted) p.mute()
                resolve(p)
              },
              onStateChange: (e) => {
                if (e.data === YT.PlayerState.PLAYING) {
                  events.onPlaying(p.getDuration() || 0)
                  startTimer()
                } else if (e.data === YT.PlayerState.PAUSED) {
                  stopTimer()
                  events.onPaused()
                } else if (e.data === YT.PlayerState.ENDED) {
                  stopTimer()
                  events.onEnded()
                }
              },
              onError: (e) => {
                stopTimer()
                events.onError(ERRORS[e.data] ?? "This video can't be played.", true)
              }
            }
          })
        })
    ))

  const withPlayer = (fn: (p: YT.Player) => void) =>
    ready().then(fn, (e: Error) => {
      creating = null
      // The player itself didn't load (offline, YouTube blocked): every track would fail the same way.
      events.onError(e.message, false)
    })

  return {
    load: (videoId, autoplay) => withPlayer((p) => (autoplay ? p.loadVideoById(videoId) : p.cueVideoById(videoId))),
    play: () => player?.playVideo(),
    pause: () => player?.pauseVideo(),
    seek: (seconds) => {
      player?.seekTo(seconds, true)
      tick()
    },
    setVolume: (v) => {
      volume = v
      player?.setVolume(v)
    },
    setMuted: (m) => {
      muted = m
      if (m) player?.mute()
      else player?.unMute()
    }
  }
}
