import type { DatabaseSync } from 'node:sqlite'
import type { PlaybackSettings, Playlist, PlaylistInput, Track } from '../../../shared/types'
import { transaction } from './db.ts'

interface SongRow {
  youtube_video_id: string
  title: string
  artist: string
  thumbnail_url: string
  duration: number | null
  channel_id: string | null
}

const SONG_COLUMNS = 's.youtube_video_id, s.title, s.artist, s.thumbnail_url, s.duration, s.channel_id'

const toTrack = (r: SongRow): Track => ({
  videoId: r.youtube_video_id,
  title: r.title,
  artist: r.artist,
  thumbnail: r.thumbnail_url,
  ...(r.duration != null && { duration: r.duration }),
  ...(r.channel_id != null && { channelId: r.channel_id })
})

/** Data access for playlists, liked songs, history and playback settings. */
export function createLibrary(db: DatabaseSync) {
  const upsertSong = db.prepare(`
    INSERT INTO songs (youtube_video_id, title, artist, thumbnail_url, duration, channel_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (youtube_video_id) DO UPDATE SET
      title = excluded.title, artist = excluded.artist, thumbnail_url = excluded.thumbnail_url,
      duration = COALESCE(excluded.duration, songs.duration), channel_id = COALESCE(excluded.channel_id, songs.channel_id),
      updated_at = CURRENT_TIMESTAMP
    RETURNING id`)

  const saveSong = (t: Track) =>
    (upsertSong.get(t.videoId, t.title, t.artist, t.thumbnail, t.duration ?? null, t.channelId ?? null) as { id: number }).id

  const songIdOf = (videoId: string) =>
    (db.prepare('SELECT id FROM songs WHERE youtube_video_id = ?').get(videoId) as { id: number } | undefined)?.id

  const getPlaylist = (id: number): Playlist => {
    const row = db
      .prepare(
        `SELECT p.id, p.name, p.description, p.cover_image AS cover,
           COUNT(ps.id) AS trackCount, COALESCE(SUM(s.duration), 0) AS totalDuration
         FROM playlists p
         LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
         LEFT JOIN songs s ON s.id = ps.song_id
         WHERE p.id = ? GROUP BY p.id`
      )
      .get(id)
    if (!row) throw new Error('That playlist no longer exists.')
    return { ...row } as unknown as Playlist
  }

  /** Rewrites positions 0..n-1 in the given order. */
  const renumber = (table: 'playlists' | 'playlist_songs', ids: number[]) => {
    const update = db.prepare(`UPDATE ${table} SET position = ? WHERE id = ?`)
    ids.forEach((id, position) => update.run(position, id))
  }

  return {
    playlists(): Playlist[] {
      const ids = db.prepare('SELECT id FROM playlists ORDER BY position, id').all() as { id: number }[]
      return ids.map((r) => getPlaylist(r.id))
    },

    createPlaylist(input: PlaylistInput): Playlist {
      const { id } = db
        .prepare(
          `INSERT INTO playlists (name, description, cover_image, position)
           VALUES (?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM playlists)) RETURNING id`
        )
        .get(input.name, input.description, input.cover) as { id: number }
      return getPlaylist(id)
    },

    updatePlaylist(id: number, input: PlaylistInput): Playlist {
      db.prepare(
        'UPDATE playlists SET name = ?, description = ?, cover_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(input.name, input.description, input.cover, id)
      return getPlaylist(id)
    },

    deletePlaylist(id: number): void {
      db.prepare('DELETE FROM playlists WHERE id = ?').run(id)
    },

    reorderPlaylists(ids: number[]): void {
      transaction(db, () => renumber('playlists', ids))
    },

    playlistTracks(id: number): Track[] {
      const rows = db
        .prepare(
          `SELECT ${SONG_COLUMNS} FROM playlist_songs ps JOIN songs s ON s.id = ps.song_id
           WHERE ps.playlist_id = ? ORDER BY ps.position, ps.id`
        )
        .all(id) as unknown as SongRow[]
      return rows.map(toTrack)
    },

    /** Appends tracks not already in the playlist; returns how many were added. */
    addToPlaylist(id: number, tracks: Track[]): number {
      getPlaylist(id)
      return transaction(db, () => {
        let next = (db.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS n FROM playlist_songs WHERE playlist_id = ?').get(id) as { n: number }).n
        const insert = db.prepare('INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)')
        let added = 0
        for (const t of tracks) {
          if (insert.run(id, saveSong(t), next).changes) {
            added++
            next++
          }
        }
        db.prepare('UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id)
        return added
      })
    },

    removeFromPlaylist(id: number, videoId: string): void {
      transaction(db, () => {
        db.prepare('DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?').run(id, songIdOf(videoId) ?? -1)
        const ids = db.prepare('SELECT id FROM playlist_songs WHERE playlist_id = ? ORDER BY position, id').all(id) as { id: number }[]
        renumber('playlist_songs', ids.map((r) => r.id))
      })
    },

    movePlaylistTrack(id: number, from: number, to: number): void {
      transaction(db, () => {
        const ids = (db.prepare('SELECT id FROM playlist_songs WHERE playlist_id = ? ORDER BY position, id').all(id) as { id: number }[]).map((r) => r.id)
        if (from < 0 || to < 0 || from >= ids.length || to >= ids.length) throw new Error('Invalid position.')
        const [moved] = ids.splice(from, 1)
        ids.splice(to, 0, moved)
        renumber('playlist_songs', ids)
      })
    },

    liked(): Track[] {
      const rows = db
        .prepare(`SELECT ${SONG_COLUMNS} FROM liked_songs l JOIN songs s ON s.id = l.song_id ORDER BY l.liked_at DESC, l.id DESC`)
        .all() as unknown as SongRow[]
      return rows.map(toTrack)
    },

    setLiked(track: Track, liked: boolean): void {
      if (liked) db.prepare('INSERT OR IGNORE INTO liked_songs (song_id) VALUES (?)').run(saveSong(track))
      else db.prepare('DELETE FROM liked_songs WHERE song_id = ?').run(songIdOf(track.videoId) ?? -1)
    },

    recordPlay(track: Track): void {
      transaction(db, () => {
        db.prepare('INSERT INTO play_history (song_id) VALUES (?)').run(saveSong(track))
        // Keep history bounded.
        db.prepare('DELETE FROM play_history WHERE id NOT IN (SELECT id FROM play_history ORDER BY id DESC LIMIT 500)').run()
      })
    },

    /** Most recent first, each song once. */
    recent(limit = 50): Track[] {
      const rows = db
        .prepare(
          `SELECT ${SONG_COLUMNS} FROM songs s
           JOIN (SELECT song_id, MAX(id) AS last FROM play_history GROUP BY song_id) h ON h.song_id = s.id
           ORDER BY h.last DESC LIMIT ?`
        )
        .all(limit) as unknown as SongRow[]
      return rows.map(toTrack)
    },

    playbackSettings(): PlaybackSettings {
      const r = db.prepare('SELECT repeat_mode, shuffle_enabled, volume, autoplay_enabled FROM playback_settings WHERE id = 1').get() as {
        repeat_mode: PlaybackSettings['repeat']
        shuffle_enabled: number
        volume: number
        autoplay_enabled: number
      }
      return { repeat: r.repeat_mode, shuffle: !!r.shuffle_enabled, volume: r.volume, autoplay: !!r.autoplay_enabled }
    },

    appSettings(): Record<string, string> {
      const rows = db.prepare('SELECT setting_key, setting_value FROM application_settings').all() as { setting_key: string; setting_value: string }[]
      return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]))
    },

    setAppSetting(key: string, value: string): void {
      db.prepare(
        'INSERT INTO application_settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = excluded.setting_value'
      ).run(key, value)
    },

    savePlaybackSettings(s: PlaybackSettings): void {
      db.prepare('UPDATE playback_settings SET repeat_mode = ?, shuffle_enabled = ?, volume = ?, autoplay_enabled = ? WHERE id = 1').run(
        s.repeat,
        s.shuffle ? 1 : 0,
        s.volume,
        s.autoplay ? 1 : 0
      )
    }
  }
}

export type Library = ReturnType<typeof createLibrary>
