import { app, BrowserWindow, dialog, ipcMain, type IpcMainEvent } from 'electron'
import { IPC } from '../shared/ipc'
import type { CloseBehavior, DesktopSettings, PlayerCommand, PlayerSnapshot } from '../shared/types'
import type { Library } from './services/database/library'
import { createMiniWindow } from './window'
import { createTray } from './tray'
import { asDesktopChanges, asPlayerCommand, asPlayerSnapshot } from './validate'

const DEFAULTS = { closeBehavior: 'ask' as CloseBehavior, minimizeToTray: false, miniPlayerOnTop: true }

/** Tray, close-to-tray, mini-player and the player state/command relay between windows. */
export function setUpDesktop(lib: Library, main: BrowserWindow): { showMain(): void } {
  let quitting = false
  let mini: BrowserWindow | null = null
  let lastState: PlayerSnapshot | null = null
  let toldAboutTray = false

  const settings = (): DesktopSettings => {
    const stored = lib.appSettings()
    return {
      closeBehavior: (stored.closeBehavior as CloseBehavior) ?? DEFAULTS.closeBehavior,
      minimizeToTray: stored.minimizeToTray ? stored.minimizeToTray === 'true' : DEFAULTS.minimizeToTray,
      miniPlayerOnTop: stored.miniPlayerOnTop ? stored.miniPlayerOnTop === 'true' : DEFAULTS.miniPlayerOnTop,
      launchOnStartup: app.isPackaged && app.getLoginItemSettings().openAtLogin,
      launchOnStartupAvailable: app.isPackaged
    }
  }

  const showMain = () => {
    mini?.close()
    if (main.isMinimized()) main.restore()
    main.show()
    main.focus()
  }

  const sendCommand = (command: PlayerCommand) => main.webContents.send(IPC.playerCommand, command)

  const tray = createTray({ show: showMain, command: sendCommand, quit: () => app.quit() })

  const hideToTray = () => {
    main.hide()
    if (!toldAboutTray) {
      toldAboutTray = true
      tray.notifyStillRunning()
    }
  }

  app.on('before-quit', () => (quitting = true))


  main.on('close', async (e) => {
    if (quitting) return
    e.preventDefault()
    let behavior = settings().closeBehavior
    if (behavior === 'ask') {
      const { response, checkboxChecked } = await dialog.showMessageBox(main, {
        type: 'question',
        title: 'Close Pinkwave',
        message: 'Keep the music playing?',
        detail: 'Pinkwave can keep playing in the system tray.',
        buttons: ['Minimize to tray', 'Exit Pinkwave', 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        checkboxLabel: "Remember my choice (change it in Settings)",
        noLink: true
      })
      if (response === 2) return
      behavior = response === 0 ? 'tray' : 'quit'
      if (checkboxChecked) lib.setAppSetting('closeBehavior', behavior)
    }
    if (behavior === 'tray') hideToTray()
    else app.quit()
  })

  main.on('minimize', () => {
    if (settings().minimizeToTray) hideToTray()
  })

  const fromMain = (e: IpcMainEvent) => e.sender === main.webContents
  const fromMini = (e: IpcMainEvent) => !!mini && e.sender === mini.webContents

  ipcMain.on(IPC.playerState, (e, snapshot: unknown) => {
    if (!fromMain(e)) return
    try {
      lastState = asPlayerSnapshot(snapshot)
    } catch {
      return
    }
    tray.update(lastState)
    mini?.webContents.send(IPC.playerState, lastState)
  })

  ipcMain.on(IPC.playerCommand, (e, command: unknown) => {
    if (!fromMini(e)) return
    try {
      sendCommand(asPlayerCommand(command))
    } catch {
      // ignore malformed commands
    }
  })

  ipcMain.on(IPC.openMiniPlayer, (e) => {
    if (!fromMain(e)) return
    if (!mini) {
      mini = createMiniWindow(settings().miniPlayerOnTop)
      mini.webContents.on('did-finish-load', () => lastState && mini?.webContents.send(IPC.playerState, lastState))
      // However the mini-player closes, bring the main window back.
      mini.on('closed', () => {
        mini = null
        if (!quitting) showMain()
      })
    }
    mini.show()
    main.hide()
  })

  ipcMain.on(IPC.closeMiniPlayer, (e) => {
    if (fromMini(e)) showMain()
  })

  ipcMain.handle(IPC.desktopSettings, () => settings())
  ipcMain.handle(IPC.saveDesktopSettings, (_e, changes: unknown) => {
    const c = asDesktopChanges(changes)
    if (c.closeBehavior) lib.setAppSetting('closeBehavior', c.closeBehavior)
    if (c.minimizeToTray !== undefined) lib.setAppSetting('minimizeToTray', String(c.minimizeToTray))
    if (c.miniPlayerOnTop !== undefined) {
      lib.setAppSetting('miniPlayerOnTop', String(c.miniPlayerOnTop))
      mini?.setAlwaysOnTop(c.miniPlayerOnTop)
    }
    // Starts hidden in the tray when launched at login.
    if (c.launchOnStartup !== undefined && app.isPackaged) app.setLoginItemSettings({ openAtLogin: c.launchOnStartup, args: ['--hidden'] })
    return settings()
  })

  return { showMain }
}
