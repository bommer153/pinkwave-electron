// Run: node src/main/services/database/library.test.ts — exercises the real schema in an in-memory database.
import assert from 'node:assert/strict'
import { openDatabase } from './db.ts'
import { createLibrary } from './library.ts'
import { asPlaybackSettings, asPlaylistInput, asTrack } from '../../validate.ts'

const db = openDatabase(':memory:')
const lib = createLibrary(db)
const t = (id: string, duration?: number) => ({ videoId: id.padEnd(11, '_'), title: `T ${id}`, artist: 'A', thumbnail: '', ...(duration && { duration }) })
const ids = (tracks: { videoId: string }[]) => tracks.map((x) => x.videoId[0]).join('')

// Migrations are idempotent: opening again on the same version is a no-op.
assert.equal((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, 1)

const p = lib.createPlaylist({ name: 'Mix', description: 'd', cover: null })
assert.deepEqual({ ...p }, { id: 1, name: 'Mix', description: 'd', cover: null, trackCount: 0, totalDuration: 0 })

assert.equal(lib.addToPlaylist(p.id, [t('a', 100), t('b', 50), t('c')]), 3)
assert.equal(lib.addToPlaylist(p.id, [t('a'), t('d')]), 1, 'duplicates skipped')
assert.equal(ids(lib.playlistTracks(p.id)), 'abcd')
assert.equal(lib.playlists()[0].totalDuration, 150, 'unknown durations ignored, re-adding keeps known duration')

lib.movePlaylistTrack(p.id, 0, 2)
assert.equal(ids(lib.playlistTracks(p.id)), 'bcad')
lib.removeFromPlaylist(p.id, t('c').videoId)
assert.equal(ids(lib.playlistTracks(p.id)), 'bad')
lib.movePlaylistTrack(p.id, 2, 0)
assert.equal(ids(lib.playlistTracks(p.id)), 'dba', 'positions renumbered after remove')
assert.throws(() => lib.movePlaylistTrack(p.id, 0, 3))

const q = lib.createPlaylist({ name: 'Second', description: '', cover: null })
lib.reorderPlaylists([q.id, p.id])
assert.deepEqual(lib.playlists().map((x) => x.name), ['Second', 'Mix'])
assert.equal(lib.updatePlaylist(q.id, { name: 'Renamed', description: '', cover: null }).name, 'Renamed')

lib.setLiked(t('a'), true)
lib.setLiked(t('z'), true)
lib.setLiked(t('a'), true)
assert.equal(ids(lib.liked()), 'za', 'newest like first, no duplicates')
lib.setLiked(t('z'), false)
assert.equal(ids(lib.liked()), 'a')

// Deleting a playlist keeps song metadata (used by likes/history).
lib.deletePlaylist(p.id)
assert.deepEqual(lib.playlists().map((x) => x.name), ['Renamed'])
assert.equal((db.prepare('SELECT COUNT(*) AS n FROM songs').get() as { n: number }).n, 5)
assert.equal((db.prepare('SELECT COUNT(*) AS n FROM playlist_songs').get() as { n: number }).n, 0)
assert.throws(() => lib.addToPlaylist(p.id, [t('a')]), /no longer exists/)

lib.recordPlay(t('a'))
lib.recordPlay(t('b'))
lib.recordPlay(t('a'))
assert.equal(ids(lib.recent()), 'ab', 'recent is distinct, most recent first')

assert.deepEqual(lib.playbackSettings(), { repeat: 'off', shuffle: false, volume: 70, autoplay: true })
lib.savePlaybackSettings({ repeat: 'one', shuffle: true, volume: 30, autoplay: false })
assert.deepEqual(lib.playbackSettings(), { repeat: 'one', shuffle: true, volume: 30, autoplay: false })

// Trust-boundary validation.
assert.throws(() => asTrack({ ...t('a'), videoId: '../etc' }))
assert.throws(() => asTrack({ ...t('a'), thumbnail: 'file:///c:/x.png' }))
assert.throws(() => asPlaylistInput({ name: '   ', description: '' }))
assert.throws(() => asPlaylistInput({ name: 'x', cover: 'data:text/html;base64,AAAA' }))
assert.equal(asPlaylistInput({ name: '  Mix  ' }).name, 'Mix')
assert.throws(() => asPlaybackSettings({ repeat: 'sometimes', shuffle: false, volume: 1, autoplay: true }))
assert.throws(() => asPlaybackSettings({ repeat: 'off', shuffle: false, volume: 101, autoplay: true }))

console.log('library.test: ok')
