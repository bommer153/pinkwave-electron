import { useState, type CSSProperties } from 'react'
import { usePlayer } from '../../stores/playerStore'
import { formatTime } from '../../utils/format'

// Subscribes to position on its own so ticks re-render only this bar.
export function ProgressBar() {
  const position = usePlayer((s) => s.position)
  const duration = usePlayer((s) => s.duration)
  const seek = usePlayer((s) => s.seek)
  // While dragging, show the drag value and seek once on release, not on every pixel.
  const [dragging, setDragging] = useState<number | null>(null)
  const shown = dragging ?? position
  const pct = duration ? Math.min(100, (shown / duration) * 100) : 0

  const commit = () => {
    if (dragging === null) return
    seek(dragging)
    setDragging(null)
  }

  return (
    <div className="flex w-full items-center gap-2 text-[11px] text-pw-muted tabular-nums">
      {/* Live streams report no duration and a position counted from the stream's start. */}
      <span className="w-10 text-right">{duration ? formatTime(shown) : ''}</span>
      <input
        type="range"
        aria-label="Seek"
        min={0}
        max={duration || 1}
        step={1}
        value={shown}
        disabled={!duration}
        onChange={(e) => setDragging(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        style={{ '--pct': `${pct}%` } as CSSProperties}
        className="pw-range flex-1"
      />
      <span className="w-10">{duration ? formatTime(duration) : position > 0 ? <span className="font-semibold text-pw-pink">LIVE</span> : '0:00'}</span>
    </div>
  )
}
