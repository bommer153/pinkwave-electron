import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type PinkwaveApi } from '../shared/ipc'

const invoke = ipcRenderer.invoke.bind(ipcRenderer)

// Hands the page only the payload, never the IpcRendererEvent (which exposes `sender`).
function subscribe<T>(channel: string, listener: (payload: T) => void): () => void {
  const handler = (_e: Electron.IpcRendererEvent, payload: T) => listener(payload)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

// Only named, typed calls cross the bridge — never ipcRenderer itself.
const api: PinkwaveApi = {
  getAppInfo: () => invoke(IPC.appInfo),
  openExternal: (url) => invoke(IPC.openExternal, url),
  youtube: {
    status: (verify) => invoke(IPC.youtubeStatus, verify),
    setKey: (key) => invoke(IPC.youtubeSetKey, key),
    search: (query, pageToken) => invoke(IPC.youtubeSearch, query, pageToken),
    trending: () => invoke(IPC.youtubeTrending)
  },
  library: {
    playlists: () => invoke(IPC.playlists),
    createPlaylist: (input) => invoke(IPC.createPlaylist, input),
    updatePlaylist: (id, input) => invoke(IPC.updatePlaylist, id, input),
    deletePlaylist: (id) => invoke(IPC.deletePlaylist, id),
    reorderPlaylists: (ids) => invoke(IPC.reorderPlaylists, ids),
    chooseCover: () => invoke(IPC.chooseCover),
    playlistTracks: (id) => invoke(IPC.playlistTracks, id),
    addToPlaylist: (id, tracks) => invoke(IPC.addToPlaylist, id, tracks),
    removeFromPlaylist: (id, videoId) => invoke(IPC.removeFromPlaylist, id, videoId),
    movePlaylistTrack: (id, from, to) => invoke(IPC.movePlaylistTrack, id, from, to),
    liked: () => invoke(IPC.liked),
    setLiked: (track, liked) => invoke(IPC.setLiked, track, liked),
    recent: () => invoke(IPC.recent),
    recordPlay: (track) => invoke(IPC.recordPlay, track)
  },
  settings: {
    playback: () => invoke(IPC.playbackSettings),
    savePlayback: (settings) => invoke(IPC.savePlaybackSettings, settings),
    desktop: () => invoke(IPC.desktopSettings),
    saveDesktop: (changes) => invoke(IPC.saveDesktopSettings, changes)
  },
  desktop: {
    sendPlayerState: (snapshot) => ipcRenderer.send(IPC.playerState, snapshot),
    onPlayerCommand: (listener) => subscribe(IPC.playerCommand, listener),
    onPlayerState: (listener) => subscribe(IPC.playerState, listener),
    playerCommand: (command) => ipcRenderer.send(IPC.playerCommand, command),
    openMiniPlayer: () => ipcRenderer.send(IPC.openMiniPlayer),
    closeMiniPlayer: () => ipcRenderer.send(IPC.closeMiniPlayer)
  }
}

contextBridge.exposeInMainWorld('pinkwave', api)
