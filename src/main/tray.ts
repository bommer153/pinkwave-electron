import { Menu, nativeImage, Tray } from 'electron'
import trayIcon from '../../resources/tray.png?asset'
import type { PlayerCommand, PlayerSnapshot } from '../shared/types'

interface TrayActions {
  show(): void
  command(command: PlayerCommand): void
  quit(): void
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

export function createTray(actions: TrayActions) {
  // tray@2x.png next to tray.png is picked up automatically on high-DPI displays.
  const tray = new Tray(nativeImage.createFromPath(trayIcon))
  tray.on('click', actions.show)

  const update = (state: PlayerSnapshot | null) => {
    const track = state?.track
    tray.setToolTip(track ? clip(`Pinkwave — ${track.title}`, 127) : 'Pinkwave')
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: track ? clip(track.title, 60) : 'Nothing playing', enabled: false },
        ...(track ? [{ label: clip(track.artist, 60), enabled: false }] : []),
        { type: 'separator' },
        { label: 'Show Pinkwave', click: actions.show },
        { label: state?.isPlaying ? 'Pause' : 'Play', enabled: !!track, click: () => actions.command({ type: 'toggle' }) },
        { label: 'Previous Track', enabled: !!track, click: () => actions.command({ type: 'previous' }) },
        { label: 'Next Track', enabled: !!track, click: () => actions.command({ type: 'next' }) },
        { type: 'separator' },
        { label: 'Quit Pinkwave', click: actions.quit }
      ])
    )
  }

  update(null)
  return {
    update,
    notifyStillRunning: () =>
      tray.displayBalloon({ iconType: 'info', title: 'Pinkwave is still running', content: 'Music keeps playing. Click the tray icon to open Pinkwave.' })
  }
}
