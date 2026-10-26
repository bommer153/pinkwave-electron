import type { Track } from '../../../../shared/types'
import { Cover } from '../common/Cover'

export function TrackInfo({ track, size = 'md' }: { track: Track; size?: 'sm' | 'md' }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Cover
        key={track.videoId} // remount per track so the artwork fades in on change
        seed={track.videoId}
        src={track.thumbnail}
        className={size === 'md' ? 'pw-art-in size-14 shrink-0 rounded-md' : 'size-10 shrink-0 rounded'}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium" title={track.title}>
          {track.title}
        </p>
        <p className="truncate text-xs text-pw-text-2">{track.artist}</p>
      </div>
    </div>
  )
}
