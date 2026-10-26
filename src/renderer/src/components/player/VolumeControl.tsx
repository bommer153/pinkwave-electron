import type { CSSProperties } from 'react'
import { Button } from '@heroui/react'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { usePlayer } from '../../stores/playerStore'

export function VolumeControl() {
  const volume = usePlayer((s) => s.volume)
  const muted = usePlayer((s) => s.muted)
  const setVolume = usePlayer((s) => s.setVolume)
  const toggleMute = usePlayer((s) => s.toggleMute)
  const level = muted ? 0 : volume
  const Icon = level === 0 ? VolumeX : level < 50 ? Volume1 : Volume2

  return (
    <div className="flex items-center gap-1">
      <Button isIconOnly size="sm" variant="ghost" aria-label={level === 0 ? 'Unmute' : 'Mute'} onPress={toggleMute}>
        <Icon size={18} />
      </Button>
      <input
        type="range"
        aria-label="Volume"
        min={0}
        max={100}
        value={level}
        onChange={(e) => setVolume(Number(e.target.value))}
        style={{ '--pct': `${level}%` } as CSSProperties}
        className="pw-range w-24"
      />
    </div>
  )
}
