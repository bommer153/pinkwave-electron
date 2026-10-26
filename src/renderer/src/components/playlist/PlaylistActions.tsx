import type { ReactNode } from 'react'
import { Button, cn, toast } from '@heroui/react'
import { ListEnd, Pause, Play, Shuffle } from 'lucide-react'
import type { Track } from '../../../../shared/types'
import { usePlayer } from '../../stores/playerStore'
import { songCount } from '../../utils/format'

const randomIndex = (n: number) => Math.floor(Math.random() * n)

/** Play / shuffle-play / queue-all for a list of songs (playlist, Liked Songs, history). */
export function PlaylistActions({ tracks, children }: { tracks: Track[]; children?: ReactNode }) {
  const currentId = usePlayer((s) => s.queue[s.index]?.videoId)
  const isPlaying = usePlayer((s) => s.isPlaying)
  const shuffle = usePlayer((s) => s.shuffle)
  const inList = tracks.some((t) => t.videoId === currentId)
  const empty = tracks.length === 0

  const play = () => {
    const p = usePlayer.getState()
    if (inList) p.togglePlay()
    else p.playTracks(tracks, p.shuffle ? randomIndex(tracks.length) : 0)
  }

  const shufflePlay = () => {
    const p = usePlayer.getState()
    if (!p.shuffle) p.toggleShuffle()
    p.playTracks(tracks, randomIndex(tracks.length))
  }

  const queueAll = () => {
    usePlayer.getState().addToQueue(tracks)
    toast(`Added ${songCount(tracks.length)} to queue`)
  }

  return (
    <>
      <Button
        isIconOnly
        aria-label={inList && isPlaying ? 'Pause' : 'Play'}
        isDisabled={empty}
        onPress={play}
        className="size-14 rounded-full bg-gradient-to-br from-pw-pink to-pw-pink-hot text-white shadow-[0_8px_24px_-6px_var(--color-pw-pink)] transition-transform hover:scale-105 active:scale-95"
      >
        {inList && isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
      </Button>
      <Button
        isIconOnly
        variant="ghost"
        aria-label="Shuffle play"
        isDisabled={empty}
        onPress={shufflePlay}
        className={cn('size-11', shuffle ? 'text-pw-pink' : 'text-pw-text-2')}
      >
        <Shuffle size={24} />
      </Button>
      <Button isIconOnly variant="ghost" aria-label="Add all to queue" isDisabled={empty} onPress={queueAll} className="size-11 text-pw-text-2">
        <ListEnd size={24} />
      </Button>
      {children}
    </>
  )
}
