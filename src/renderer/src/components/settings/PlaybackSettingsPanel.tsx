import type { CSSProperties } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { RepeatMode } from '../../../../shared/types'
import { usePlayer } from '../../stores/playerStore'
import { SettingsChoice, SettingsRow, SettingsToggle } from './SettingsRow'

const REPEAT_OPTIONS: { value: RepeatMode; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'all', label: 'All' },
  { value: 'one', label: 'One' }
]

/** Same state as the player bar, so both stay in sync; changes are saved automatically. */
export function PlaybackSettingsPanel() {
  const { autoplay, shuffle, repeat, volume, setAutoplay, toggleShuffle, setRepeat, setVolume } = usePlayer(
    useShallow((s) => ({
      autoplay: s.autoplay,
      shuffle: s.shuffle,
      repeat: s.repeat,
      volume: s.volume,
      setAutoplay: s.setAutoplay,
      toggleShuffle: s.toggleShuffle,
      setRepeat: s.setRepeat,
      setVolume: s.setVolume
    }))
  )

  return (
    <section className="mb-6 rounded-xl bg-pw-card p-6">
      <h2 className="text-lg font-bold">Playback</h2>
      <div className="mt-2 divide-y divide-white/5">
        <SettingsRow title="Autoplay" hint="Keep playing the queue when a song ends.">
          <SettingsToggle label="Autoplay" isSelected={autoplay} onChange={setAutoplay} />
        </SettingsRow>
        <SettingsRow title="Shuffle" hint="Play the queue in random order.">
          <SettingsToggle label="Shuffle" isSelected={shuffle} onChange={toggleShuffle} />
        </SettingsRow>
        <SettingsRow title="Repeat">
          <SettingsChoice label="Repeat mode" value={repeat} options={REPEAT_OPTIONS} onChange={setRepeat} />
        </SettingsRow>
        <SettingsRow title="Volume" hint={`${volume}%`}>
          <input
            type="range"
            aria-label="Volume"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            style={{ '--pct': `${volume}%` } as CSSProperties}
            className="pw-range w-48"
          />
        </SettingsRow>
      </div>
    </section>
  )
}
