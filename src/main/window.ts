import { BrowserWindow, type BrowserWindowConstructorOptions } from 'electron'
import { join } from 'node:path'
import icon from '../../resources/icon.png?asset'

export const secureWebPreferences = (): BrowserWindowConstructorOptions['webPreferences'] => ({
  preload: join(__dirname, '../preload/index.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  // Keep the player's timers running while minimized or hidden to tray.
  backgroundThrottling: false
})

/** Loads the renderer; `view` selects an alternate root (e.g. the mini-player). */
export function loadRenderer(win: BrowserWindow, view?: string): void {
  // The renderer never navigates away or opens new windows.
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (e) => e.preventDefault())

  if (process.env.ELECTRON_RENDERER_URL) win.loadURL(`${process.env.ELECTRON_RENDERER_URL}${view ? `#${view}` : ''}`)
  else win.loadFile(join(__dirname, '../renderer/index.html'), view ? { hash: view } : undefined)
}

export function createMainWindow(show: boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    backgroundColor: '#09090B',
    title: 'Pinkwave',
    icon,
    autoHideMenuBar: true,
    webPreferences: secureWebPreferences()
  })
  if (show) win.once('ready-to-show', () => win.show())
  loadRenderer(win)
  return win
}

export function createMiniWindow(alwaysOnTop: boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 420,
    height: 152,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    alwaysOnTop,
    show: false,
    backgroundColor: '#111114',
    title: 'Pinkwave mini player',
    icon,
    webPreferences: secureWebPreferences()
  })
  win.once('ready-to-show', () => win.show())
  loadRenderer(win, 'mini')
  return win
}
