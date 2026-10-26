import { cn } from '@heroui/react'
import { useCurrentTrack } from '../../stores/playerStore'
import { useUi } from '../../stores/uiStore'
import { VideoHost } from './VideoHost'
import { QueuePanel } from './QueuePanel'

/**
 * Always mounted so the YouTube player is never recreated. While a track is loaded the
 * video stays visible (YouTube requires a visible player of at least 200×200px).
 */
export function NowPlayingPanel() {
  const track = useCurrentTrack()
  const queueOpen = useUi((s) => s.queueOpen)
  const open = !!track || queueOpen

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        'shrink-0 overflow-hidden rounded-xl bg-pw-sidebar transition-[width,margin] duration-300 ease-out',
        open ? 'w-[360px]' : '-ml-2 w-0'
      )}
    >
      <div className="flex h-full w-[360px] flex-col">
        <div className={cn('w-full shrink-0 bg-black', track ? 'aspect-video' : 'h-0')}>
          <VideoHost />
        </div>
        {track && (
          <div className="px-4 pt-4 pb-2">
            <h2 className="line-clamp-2 text-lg font-bold leading-snug" title={track.title}>
              {track.title}
            </h2>
            <p className="mt-1 truncate text-sm text-pw-text-2">{track.artist}</p>
          </div>
        )}
        {queueOpen && <QueuePanel />}
      </div>
    </aside>
  )
}
