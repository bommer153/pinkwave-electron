import { cn } from '@heroui/react'

/** Animated bars for the current track; frozen when paused. */
export function Equalizer({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <span className={cn('flex h-3.5 items-end gap-[2px]', className)} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="pw-eq-bar w-[3px] rounded-sm bg-pw-pink"
          style={{ animationDelay: `${i * -0.25}s`, animationPlayState: playing ? 'running' : 'paused' }}
        />
      ))}
    </span>
  )
}
