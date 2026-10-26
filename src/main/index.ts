import { app, dialog, session } from 'electron'
import { join } from 'node:path'
import { registerIpc, registerLibraryIpc } from './ipc'
import { openDatabase } from './services/database/db'
import { createLibrary } from './services/database/library'
import { createMainWindow } from './window'
import { setUpDesktop } from './desktop'

// Development convenience: read YOUTUBE_API_KEY etc. from a git-ignored .env in the project root.
if (!app.isPackaged) {
  try {
    process.loadEnvFile()
  } catch {
    // no .env — fine
  }
}

// One instance only: a second launch focuses the first instead of starting a second player.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.setAppUserModelId('com.pinkwave.app') // Windows notifications / taskbar grouping
  app.whenReady().then(() => {
    const dbFile = join(app.getPath('userData'), 'pinkwave.db')
    let db: ReturnType<typeof openDatabase>
    try {
      db = openDatabase(dbFile)
    } catch (e) {
      // Don't touch the file: it holds the user's playlists. Explain and exit instead of crashing silently.
      dialog.showErrorBox('Pinkwave could not open its library', `${(e as Error).message}\n\nDatabase file:\n${dbFile}`)
      return app.exit(1)
    }
    app.on('will-quit', () => db.close())
    const lib = createLibrary(db)
    identifyToYouTube()
    registerIpc()
    registerLibraryIpc(lib)
    // Launched at login with --hidden: start quietly in the tray.
    const main = createMainWindow(!process.argv.includes('--hidden'))
    const desktop = setUpDesktop(lib, main)
    app.on('second-instance', desktop.showMain)
  })
}

// YouTube's embedded player requires an HTTP Referer identifying the client; a file:// page sends none
// (player error 152/153). YouTube's guidance for apps is to send the app ID as the referrer.
function identifyToYouTube(): void {
  const filter = { urls: ['https://www.youtube.com/*', 'https://www.youtube-nocookie.com/*'] }
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    if (!details.requestHeaders.Referer) details.requestHeaders.Referer = 'https://com.pinkwave.app/'
    callback({ requestHeaders: details.requestHeaders })
  })
}

// Closing windows never quits by itself: the tray keeps the app (and music) alive until Quit.
app.on('window-all-closed', () => {})
