import { Clock3 } from 'lucide-react'
import type { Track } from '../../../../shared/types'
import { usePlayer } from '../../stores/playerStore'
import { useDragReorder } from '../../hooks/useDragReorder'
import { SongRow } from './SongRow'

interface TrackListProps {
  tracks: Track[]
  onRemove?: (track: Track) => void
  /** Enables drag / Alt+↑↓ reordering. */
  onMove?: (from: number, to: number) => void
}

export function TrackList({ tracks, onRemove, onMove }: TrackListProps) {
  const currentId = usePlayer((s) => s.queue[s.index]?.videoId)
  const isPlaying = usePlayer((s) => s.isPlaying)
  const playOrToggle = usePlayer((s) => s.playOrToggle)
  const { itemProps, dragging, over } = useDragReorder(tracks.length, (from, to) => onMove?.(from, to))

  return (
    <div role="list" aria-label={onMove ? 'Songs. Drag, or press Alt+Up/Down, to reorder.' : 'Songs'}>
      <div className="mb-2 grid grid-cols-[2.5rem_minmax(0,1fr)_2rem_2rem_4rem] gap-3 border-b border-white/5 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-pw-muted">
        <span className="text-center">#</span>
        <span>Title</span>
        <span />
        <span />
        <Clock3 size={14} className="justify-self-end" aria-label="Duration" />
      </div>
      {tracks.map((t, i) => (
        <div role="listitem" key={t.videoId}>
          <SongRow
            track={t}
            number={i + 1}
            active={t.videoId === currentId}
            playing={isPlaying}
            onPlay={() => playOrToggle(tracks, i)}
            onRemove={onRemove && (() => onRemove(t))}
            dragProps={onMove && itemProps(i)}
            dropTarget={over === i && dragging !== i}
            dragging={dragging === i}
          />
        </div>
      ))}
    </div>
  )
}
