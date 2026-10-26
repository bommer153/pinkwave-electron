import { Button, cn } from '@heroui/react'
import { CircleAlert, ListMusic, ListPlus, Music, PictureInPicture2 } from 'lucide-react'
import { LikeButton } from '../music/LikeButton'
import { useCurrentTrack, usePlayer } from '../../stores/playerStore'
import { useUi } from '../../stores/uiStore'
import { TrackInfo } from '../music/TrackInfo'
import { PlaybackControls } from './PlaybackControls'
import { ProgressBar } from './ProgressBar'
import { VolumeControl } from './VolumeControl'

export function MusicPlayer() {
  const track = useCurrentTrack()
  const error = usePlayer((s) => s.error)
  const queueOpen = useUi((s) => s.queueOpen)
  const toggleQueue = useUi((s) => s.toggleQueue)

  return (
    <footer className="grid h-[76px] grid-cols-[1fr_minmax(0,42%)_1fr] items-center gap-4 px-3">
      <div className="min-w-0">
        {track ? (
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <div className="min-w-0">
                <TrackInfo track={track} />
              </div>
              <LikeButton track={track} className="ml-2" />
              <Button isIconOnly size="sm" variant="ghost" aria-label="Add to playlist" onPress={() => useUi.getState().openAddToPlaylist([track])}>
                <ListPlus size={18} />
              </Button>
            </div>
            {error && (
              <p role="alert" className="mt-0.5 flex items-center gap-1 truncate text-xs text-pw-pink-soft">
                <CircleAlert size={12} className="shrink-0" /> {error}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-pw-muted">
            <div className="grid size-14 place-items-center rounded-md bg-pw-card">
              <Music size={22} />
            </div>
            <span className="text-sm">Nothing playing</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <PlaybackControls />
        <ProgressBar />
      </div>

      <div className="flex items-center justify-end gap-1">
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label="Queue"
          aria-pressed={queueOpen}
          onPress={toggleQueue}
          className={cn(queueOpen ? 'text-pw-pink' : 'text-pw-text-2')}
        >
          <ListMusic size={18} />
        </Button>
        <VolumeControl />
        <Button isIconOnly size="sm" variant="ghost" aria-label="Open mini player" onPress={() => window.pinkwave.desktop.openMiniPlayer()} className="text-pw-text-2">
          <PictureInPicture2 size={18} />
        </Button>
      </div>
    </footer>
  )
}
