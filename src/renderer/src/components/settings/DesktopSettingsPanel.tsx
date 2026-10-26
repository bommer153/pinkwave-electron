import { useEffect, useState } from 'react'
import type { CloseBehavior, DesktopSettings } from '../../../../shared/types'
import { safely } from '../../stores/libraryStore'
import { SettingsChoice, SettingsRow, SettingsToggle } from './SettingsRow'

const CLOSE_OPTIONS: { value: CloseBehavior; label: string }[] = [
  { value: 'ask', label: 'Ask' },
  { value: 'tray', label: 'Minimize to tray' },
  { value: 'quit', label: 'Exit' }
]

export function DesktopSettingsPanel() {
  const [s, setS] = useState<DesktopSettings | null>(null)

  useEffect(() => {
    window.pinkwave.settings.desktop().then(setS)
  }, [])

  const save = async (changes: Parameters<typeof window.pinkwave.settings.saveDesktop>[0]) => {
    const next = await safely(() => window.pinkwave.settings.saveDesktop(changes))
    if (next) setS(next)
  }

  if (!s) return null

  return (
    <section className="mb-6 rounded-xl bg-pw-card p-6">
      <h2 className="text-lg font-bold">Desktop</h2>
      <div className="mt-2 divide-y divide-white/5">
        <SettingsRow title="Close button" hint="What happens when you close the window.">
          <SettingsChoice label="Close button behavior" value={s.closeBehavior} options={CLOSE_OPTIONS} onChange={(closeBehavior) => save({ closeBehavior })} />
        </SettingsRow>
        <SettingsRow title="Minimize to tray" hint="Minimizing hides Pinkwave in the system tray instead of the taskbar.">
          <SettingsToggle label="Minimize to tray" isSelected={s.minimizeToTray} onChange={(minimizeToTray) => save({ minimizeToTray })} />
        </SettingsRow>
        <SettingsRow
          title="Launch on startup"
          hint={s.launchOnStartupAvailable ? 'Start Pinkwave quietly in the tray when you sign in.' : 'Available in the installed app.'}
        >
          <SettingsToggle
            label="Launch on startup"
            isSelected={s.launchOnStartup}
            isDisabled={!s.launchOnStartupAvailable}
            onChange={(launchOnStartup) => save({ launchOnStartup })}
          />
        </SettingsRow>
        <SettingsRow title="Mini player always on top" hint="Keep the mini player above other windows.">
          <SettingsToggle label="Mini player always on top" isSelected={s.miniPlayerOnTop} onChange={(miniPlayerOnTop) => save({ miniPlayerOnTop })} />
        </SettingsRow>
      </div>
    </section>
  )
}
