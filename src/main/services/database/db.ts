import { DatabaseSync } from 'node:sqlite'

// Each entry upgrades the schema by one version; never edit a shipped entry, append a new one.
const MIGRATIONS = [
  `
  CREATE TABLE songs (
    id INTEGER PRIMARY KEY,
    youtube_video_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL DEFAULT '',
    duration INTEGER,
    channel_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE playlists (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cover_image TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  -- Deleting a playlist removes its entries but never the song metadata (RESTRICT on songs).
  CREATE TABLE playlist_songs (
    id INTEGER PRIMARY KEY,
    playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE RESTRICT,
    position INTEGER NOT NULL,
    added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (playlist_id, song_id)
  );
  CREATE INDEX playlist_songs_order ON playlist_songs (playlist_id, position);

  CREATE TABLE liked_songs (
    id INTEGER PRIMARY KEY,
    song_id INTEGER NOT NULL UNIQUE REFERENCES songs(id) ON DELETE RESTRICT,
    liked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE play_history (
    id INTEGER PRIMARY KEY,
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE RESTRICT,
    played_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
  );
  CREATE INDEX play_history_recent ON play_history (played_at);

  CREATE TABLE playback_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    repeat_mode TEXT NOT NULL DEFAULT 'off' CHECK (repeat_mode IN ('off', 'all', 'one')),
    shuffle_enabled INTEGER NOT NULL DEFAULT 0,
    volume INTEGER NOT NULL DEFAULT 70 CHECK (volume BETWEEN 0 AND 100),
    autoplay_enabled INTEGER NOT NULL DEFAULT 1
  );
  INSERT INTO playback_settings (id) VALUES (1);

  CREATE TABLE application_settings (
    id INTEGER PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL
  );
  `
]

export function openDatabase(file: string): DatabaseSync {
  const db = new DatabaseSync(file)
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')
  const { user_version: version } = db.prepare('PRAGMA user_version').get() as { user_version: number }
  for (let v = version; v < MIGRATIONS.length; v++) {
    transaction(db, () => {
      db.exec(MIGRATIONS[v])
      db.exec(`PRAGMA user_version = ${v + 1}`)
    })
  }
  return db
}

export function transaction<T>(db: DatabaseSync, run: () => T): T {
  db.exec('BEGIN')
  try {
    const result = run()
    db.exec('COMMIT')
    return result
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}
