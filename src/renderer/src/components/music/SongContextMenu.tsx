import { cn, Dropdown, toast } from '@heroui/react'
import { Ellipsis, Heart, HeartOff, ListEnd, ListMinus, ListPlus, ListStart } from 'lucide-react'
import type { Track } from '../../../../shared/types'
import { usePlayer } from '../../stores/playerStore'
import { useLibrary } from '../../stores/libraryStore'
import { useUi } from '../../stores/uiStore'

interface SongContextMenuProps {
  track: Track
  /** Shown as "Remove from this playlist" when the song is listed inside a playlist. */
  onRemove?: () => void
  className?: string
}

export function SongContextMenu({ track, onRemove, className }: SongContextMenuProps) {
  const liked = useLibrary((s) => s.likedIds.has(track.videoId))

  const onAction = (key: React.Key) => {
    const player = usePlayer.getState()
    if (key === 'next') {
      player.playNext([track])
      toast('Playing next', { description: track.title })
    } else if (key === 'queue') {
      player.addToQueue([track])
      toast('Added to queue', { description: track.title })
    } else if (key === 'playlist') useUi.getState().openAddToPlaylist([track])
    else if (key === 'like') useLibrary.getState().toggleLike(track)
    else if (key === 'remove') onRemove?.()
  }

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={`More options for ${track.title}`}
        className={cn('grid size-8 place-items-center rounded-full text-pw-text-2 transition hover:bg-pw-elevated hover:text-white', className)}
      >
        <Ellipsis size={18} />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu onAction={onAction}>
          <Dropdown.Item id="next" textValue="Play next">
            <ListStart size={16} /> Play next
          </Dropdown.Item>
          <Dropdown.Item id="queue" textValue="Add to queue">
            <ListEnd size={16} /> Add to queue
          </Dropdown.Item>
          <Dropdown.Item id="playlist" textValue="Add to playlist">
            <ListPlus size={16} /> Add to playlist…
          </Dropdown.Item>
          <Dropdown.Item id="like" textValue={liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}>
            {liked ? <HeartOff size={16} /> : <Heart size={16} />} {liked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
          </Dropdown.Item>
          {onRemove ? (
            <Dropdown.Item id="remove" textValue="Remove from this playlist" className="text-red-400">
              <ListMinus size={16} /> Remove from this playlist
            </Dropdown.Item>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
