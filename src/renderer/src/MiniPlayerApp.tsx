import { useEffect, useState, type CSSProperties } from 'react'
import { cn } from '@heroui/react'
import { Maximize2, Music, Pause, Pin, PinOff, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import type { PlayerCommand, PlayerSnapshot } from '../../shared/types'
import { Cover } from './components/common/Cover'
import { formatTime } from './utils/format'

const desktop = window.pinkwave.desktop
const send = (command: PlayerCommand) => desktop.playerCommand(command)
const noDrag = '[-webkit-app-region:no-drag]'

/** Compact always-available controls in their own small window; playback stays in the main window. */
export default function MiniPlayerApp() {
  const [s, setS] = useState<PlayerSnapshot | null>(null)
  const [onTop, setOnTop] = useState(true)
  const [dragging, setDragging] = useState<number | null>(null)

  useEffect(() => {
    window.pinkwave.settings.desktop().then((d) => setOnTop(d.miniPlayerOnTop))
    return desktop.onPlayerState(setS)
  }, [])

  const togglePin = async () => setOnTop((await window.pinkwave.settings.saveDesktop({ miniPlayerOnTop: !onTop })).miniPlayerOnTop)

  const track = s?.track
  const position = dragging ?? s?.position ?? 0
  const duration = s?.duration ?? 0
  const volume = s?.muted ? 0 : (s?.volume ?? 0)
  const commitSeek = () => {
    if (dragging === null) return
    send({ type: 'seek', seconds: dragging })
    setDragging(null)
  }

  const btn = cn('grid place-items-center rounded-full text-pw-text-2 transition hover:text-white disabled:opacity-40', noDrag)

  return (
    <div className="flex h-full select-none gap-3 border border-white/5 bg-pw-sidebar p-3 [-webkit-app-region:drag]">
      {track ? (
        <Cover seed={track.videoId} src={track.thumbnail} className="aspect-square h-full shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="grid aspect-square h-full shrink-0 place-items-center rounded-lg bg-pw-card text-pw-muted">
          <Music size={32} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="flex items-start gap-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" title={track?.title}>
              {track?.title ?? 'Nothing playing'}
            </p>
            <p className="truncate text-xs text-pw-text-2">{track?.artist ?? 'Pinkwave'}</p>
          </div>
          <button onClick={togglePin} aria-label={onTop ? 'Unpin from top' : 'Keep on top'} aria-pressed={onTop} className={cn(btn, 'size-7', onTop && 'text-pw-pink')}>
            {onTop ? <Pin size={15} /> : <PinOff size={15} />}
          </button>
          <button onClick={() => desktop.closeMiniPlayer()} aria-label="Expand to full player" className={cn(btn, 'size-7')}>
            <Maximize2 size={15} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => send({ type: 'previous' })} disabled={!track} aria-label="Previous" className={cn(btn, 'size-8')}>
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button
            onClick={() => send({ type: 'toggle' })}
            disabled={!track}
            aria-label={s?.isPlaying ? 'Pause' : 'Play'}
            className={cn('grid size-9 place-items-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-40', noDrag, s?.isPlaying && 'shadow-[0_0_18px_-2px_var(--color-pw-pink)]')}
          >
            {s?.isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button onClick={() => send({ type: 'next' })} disabled={!track} aria-label="Next" className={cn(btn, 'size-8')}>
            <SkipForward size={18} fill="currentColor" />
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => send({ type: 'toggleMute' })} aria-label={volume === 0 ? 'Unmute' : 'Mute'} className={cn(btn, 'size-7')}>
              {volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <input
              type="range"
              aria-label="Volume"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => send({ type: 'volume', volume: Number(e.target.value) })}
              style={{ '--pct': `${volume}%` } as CSSProperties}
              className={cn('pw-range w-16', noDrag)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-pw-muted tabular-nums">
          <span>{duration ? formatTime(position) : ''}</span>
          <input
            type="range"
            aria-label="Seek"
            min={0}
            max={duration || 1}
            value={position}
            disabled={!duration}
            onChange={(e) => setDragging(Number(e.target.value))}
            onPointerUp={commitSeek}
            onKeyUp={commitSeek}
            style={{ '--pct': `${duration ? (position / duration) * 100 : 0}%` } as CSSProperties}
            className={cn('pw-range flex-1', noDrag)}
          />
          <span>{duration ? formatTime(duration) : position > 0 ? <span className="font-semibold text-pw-pink">LIVE</span> : '0:00'}</span>
        </div>
      </div>
    </div>
  )
}
