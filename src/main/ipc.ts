import { app, BrowserWindow, dialog, ipcMain, nativeImage, shell } from 'electron'
import { IPC, type AppInfo, type Result, type YouTubeStatus } from '../shared/ipc'
import { getApiKey, saveApiKey, savedApiKey } from './services/youtube/apiKey'
import { search, trending, verifyKey, YouTubeError } from './services/youtube/youtube'
import type { Library } from './services/database/library'
import { asId, asIds, asIndex, asPlaybackSettings, asPlaylistInput, asTrack, asTracks, asVideoId } from './validate'

// Only these hosts may be opened in the user's browser (setup instructions in Settings).
const EXTERNAL_HOSTS = new Set(['console.cloud.google.com', 'developers.google.com'])

async function attempt<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await run() }
  } catch (e) {
    return { ok: false, error: e instanceof YouTubeError ? e.message : 'Something went wrong talking to YouTube.' }
  }
}

function requireKey(): string {
  const key = getApiKey()
  if (!key) throw new YouTubeError('Add a YouTube Data API key in Settings first.')
  return key
}

async function status(verify: boolean): Promise<YouTubeStatus> {
  const key = getApiKey()
  return {
    configured: !!key,
    fromEnv: !!key && !savedApiKey(),
    ...(verify && key && { verified: await attempt(() => verifyKey(key).then(() => null)) })
  }
}

/** Lets the user pick an image; returns it center-cropped to a 512px square JPEG data URL. */
async function chooseCover(win: BrowserWindow | null): Promise<string | null> {
  const options = { title: 'Choose a playlist cover', properties: ['openFile' as const], filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }] }
  const { canceled, filePaths } = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
  if (canceled || !filePaths[0]) return null
  const image = nativeImage.createFromPath(filePaths[0])
  if (image.isEmpty()) throw new Error("Couldn't read that image.")
  const { width, height } = image.getSize()
  const side = Math.min(width, height)
  const square = image.crop({ x: Math.floor((width - side) / 2), y: Math.floor((height - side) / 2), width: side, height: side })
  return `data:image/jpeg;base64,${square.resize({ width: 512, height: 512, quality: 'best' }).toJPEG(85).toString('base64')}`
}

export function registerLibraryIpc(lib: Library): void {
  ipcMain.handle(IPC.playlists, () => lib.playlists())
  ipcMain.handle(IPC.createPlaylist, (_e, input: unknown) => lib.createPlaylist(asPlaylistInput(input)))
  ipcMain.handle(IPC.updatePlaylist, (_e, id: unknown, input: unknown) => lib.updatePlaylist(asId(id), asPlaylistInput(input)))
  ipcMain.handle(IPC.deletePlaylist, (_e, id: unknown) => lib.deletePlaylist(asId(id)))
  ipcMain.handle(IPC.reorderPlaylists, (_e, ids: unknown) => lib.reorderPlaylists(asIds(ids)))
  ipcMain.handle(IPC.chooseCover, (e) => chooseCover(BrowserWindow.fromWebContents(e.sender)))
  ipcMain.handle(IPC.playlistTracks, (_e, id: unknown) => lib.playlistTracks(asId(id)))
  ipcMain.handle(IPC.addToPlaylist, (_e, id: unknown, tracks: unknown) => lib.addToPlaylist(asId(id), asTracks(tracks)))
  ipcMain.handle(IPC.removeFromPlaylist, (_e, id: unknown, videoId: unknown) => lib.removeFromPlaylist(asId(id), asVideoId(videoId)))
  ipcMain.handle(IPC.movePlaylistTrack, (_e, id: unknown, from: unknown, to: unknown) =>
    lib.movePlaylistTrack(asId(id), asIndex(from), asIndex(to))
  )
  ipcMain.handle(IPC.liked, () => lib.liked())
  ipcMain.handle(IPC.setLiked, (_e, track: unknown, liked: unknown) => lib.setLiked(asTrack(track), liked === true))
  ipcMain.handle(IPC.recent, () => lib.recent())
  ipcMain.handle(IPC.recordPlay, (_e, track: unknown) => lib.recordPlay(asTrack(track)))
  ipcMain.handle(IPC.playbackSettings, () => lib.playbackSettings())
  ipcMain.handle(IPC.savePlaybackSettings, (_e, s: unknown) => lib.savePlaybackSettings(asPlaybackSettings(s)))
}

export function registerIpc(): void {
  ipcMain.handle(IPC.appInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform
  }))

  ipcMain.handle(IPC.openExternal, (_e, url: unknown) => {
    if (typeof url !== 'string') return
    const parsed = URL.canParse(url) ? new URL(url) : null
    if (parsed?.protocol === 'https:' && EXTERNAL_HOSTS.has(parsed.hostname)) return shell.openExternal(parsed.href)
  })

  ipcMain.handle(IPC.youtubeStatus, (_e, verify: unknown) => status(verify === true))

  ipcMain.handle(IPC.youtubeSetKey, async (_e, key: unknown): Promise<YouTubeStatus> => {
    if (key === null) {
      saveApiKey(null)
      return status(false)
    }
    if (typeof key !== 'string' || !/^[\w-]{20,100}$/.test(key.trim())) {
      return { configured: !!getApiKey(), fromEnv: false, verified: { ok: false, error: "That doesn't look like a YouTube API key." } }
    }
    const verified = await attempt(() => verifyKey(key.trim()).then(() => null))
    if (verified.ok) saveApiKey(key.trim())
    return { ...(await status(false)), verified }
  })

  ipcMain.handle(IPC.youtubeSearch, (_e, query: unknown, pageToken: unknown) =>
    attempt(() => {
      if (typeof query !== 'string' || !query.trim() || query.length > 200) throw new YouTubeError('Enter a search term.')
      if (pageToken !== undefined && (typeof pageToken !== 'string' || !/^[\w-]{1,200}$/.test(pageToken)))
        throw new YouTubeError('Invalid page token.')
      return search(requireKey(), query.trim(), pageToken)
    })
  )

  ipcMain.handle(IPC.youtubeTrending, () =>
    attempt(() => trending(requireKey(), app.getLocaleCountryCode() || 'US'))
  )
}
