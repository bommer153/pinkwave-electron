import { cn } from '@heroui/react'
import { Pause, Play } from 'lucide-react'
import type { Track } from '../../../../shared/types'
import { Cover } from '../common/Cover'
import { Equalizer } from './Equalizer'
import { SongContextMenu } from './SongContextMenu'

interface MusicCardProps {
  track: Track
  active: boolean
  playing: boolean
  onPlay(): void
}

export function MusicCard({ track, active, playing, onPlay }: MusicCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl bg-pw-card p-3 transition duration-200 hover:-translate-y-0.5 hover:bg-pw-elevated',
        active && 'ring-1 ring-pw-pink/50 shadow-[0_8px_30px_-12px_var(--color-pw-pink)]'
      )}
    >
      <div className="relative overflow-hidden rounded-lg">
        <Cover
          seed={track.videoId}
          src={track.thumbnail}
          className="aspect-video w-full transition-transform duration-300 group-hover:scale-105"
        />
        <button
          onClick={onPlay}
          aria-label={active && playing ? `Pause ${track.title}` : `Play ${track.title}`}
          className={cn(
            'absolute right-2 bottom-2 grid size-11 place-items-center rounded-full bg-gradient-to-br from-pw-pink to-pw-pink-hot text-white shadow-lg shadow-black/50',
            'translate-y-2 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 hover:scale-105',
            active && 'translate-y-0 opacity-100'
          )}
        >
          {active && playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <p className={cn('flex items-center gap-2 text-sm font-semibold', active && 'text-pw-pink')}>
            {active && <Equalizer playing={playing} className="shrink-0" />}
            <span className="truncate" title={track.title}>
              {track.title}
            </span>
          </p>
          <p className="truncate text-xs text-pw-text-2">{track.artist}</p>
        </div>
        <SongContextMenu
          track={track}
          className="-mr-1 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
        />
      </div>
    </div>
  )
}
