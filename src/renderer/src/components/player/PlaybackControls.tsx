import type { ReactNode } from 'react'
import { Button, cn } from '@heroui/react'
import { Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react'
import { usePlayer } from '../../stores/playerStore'

const REPEAT_LABEL = { off: 'Enable repeat', all: 'Enable repeat one', one: 'Disable repeat' } as const

export function PlaybackControls() {
  const hasTrack = usePlayer((s) => s.index >= 0)
  const isPlaying = usePlayer((s) => s.isPlaying)
  const repeat = usePlayer((s) => s.repeat)
  const shuffle = usePlayer((s) => s.shuffle)
  const { togglePlay, next, previous, cycleRepeat, toggleShuffle } = usePlayer.getState()

  return (
    <div className="flex items-center gap-3">
      <Toggle label={shuffle ? 'Disable shuffle' : 'Enable shuffle'} active={shuffle} onPress={toggleShuffle}>
        <Shuffle size={18} />
      </Toggle>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Previous" isDisabled={!hasTrack} onPress={previous}>
        <SkipBack size={20} fill="currentColor" />
      </Button>
      <Button
        isIconOnly
        aria-label={isPlaying ? 'Pause' : 'Play'}
        isDisabled={!hasTrack}
        onPress={togglePlay}
        className={cn(
          'size-10 rounded-full bg-white text-black transition-transform hover:scale-105 active:scale-95',
          isPlaying && 'shadow-[0_0_24px_-2px_var(--color-pw-pink)]'
        )}
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
      </Button>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Next" isDisabled={!hasTrack} onPress={next}>
        <SkipForward size={20} fill="currentColor" />
      </Button>
      <Toggle label={REPEAT_LABEL[repeat]} active={repeat !== 'off'} onPress={cycleRepeat}>
        {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
      </Toggle>
    </div>
  )
}

function Toggle({ label, active, onPress, children }: { label: string; active: boolean; onPress(): void; children: ReactNode }) {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={label}
      aria-pressed={active}
      onPress={onPress}
      className={cn(
        'relative',
        active ? 'text-pw-pink' : 'text-pw-text-2',
        active && 'after:absolute after:bottom-0 after:size-1 after:rounded-full after:bg-pw-pink'
      )}
    >
      {children}
    </Button>
  )
}
