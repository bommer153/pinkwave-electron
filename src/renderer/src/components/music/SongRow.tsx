import type { HTMLAttributes } from 'react'
import { cn } from '@heroui/react'
import { Play } from 'lucide-react'
import type { Track } from '../../../../shared/types'
import { formatTime } from '../../utils/format'
import { useLibrary } from '../../stores/libraryStore'
import { Cover } from '../common/Cover'
import { Equalizer } from './Equalizer'
import { LikeButton } from './LikeButton'
import { SongContextMenu } from './SongContextMenu'

interface SongRowProps {
  track: Track
  number: number
  active: boolean
  playing: boolean
  onPlay(): void
  onRemove?: () => void
  /** Drag-to-reorder wiring, when the list supports it. */
  dragProps?: HTMLAttributes<HTMLDivElement> & { draggable?: boolean }
  dropTarget?: boolean
  dragging?: boolean
}

const reveal = 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100'

export function SongRow({ track, number, active, playing, onPlay, onRemove, dragProps, dropTarget, dragging }: SongRowProps) {
  const liked = useLibrary((s) => s.likedIds.has(track.videoId))
  return (
    <div
      {...dragProps}
      tabIndex={dragProps ? 0 : undefined}
      onDoubleClick={onPlay}
      className={cn(
        'group grid grid-cols-[2.5rem_minmax(0,1fr)_2rem_2rem_4rem] items-center gap-3 rounded-lg border-t-2 border-transparent px-3 py-2 outline-none transition-colors hover:bg-pw-card focus-visible:bg-pw-card',
        active && 'bg-pw-card/60',
        dropTarget && 'border-pw-pink',
        dragging && 'opacity-40'
      )}
    >
      <div className="grid place-items-center text-sm text-pw-muted tabular-nums">
        <span className="group-hover:hidden group-focus-within:hidden">{active ? <Equalizer playing={playing} /> : number}</span>
        <button
          onClick={onPlay}
          aria-label={`Play ${track.title}`}
          className="hidden text-white group-hover:block group-focus-within:block focus-visible:outline-none"
        >
          <Play size={16} fill="currentColor" />
        </button>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <Cover seed={track.videoId} src={track.thumbnail} className="aspect-video h-10 shrink-0 rounded" />
        <div className="min-w-0">
          <p className={cn('truncate text-sm font-medium', active && 'text-pw-pink')} title={track.title}>
            {track.title}
          </p>
          <p className="truncate text-xs text-pw-text-2">{track.artist}</p>
        </div>
      </div>
      <LikeButton track={track} size={16} className={liked ? undefined : reveal} />
      <SongContextMenu track={track} onRemove={onRemove} className={reveal} />
      <span className="text-right text-sm text-pw-muted tabular-nums">{track.duration ? formatTime(track.duration) : '—'}</span>
    </div>
  )
}
