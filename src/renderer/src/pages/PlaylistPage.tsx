import { useEffect, useState } from 'react'
import { Button, Dropdown, Modal, Spinner } from '@heroui/react'
import { Ellipsis, ListMusic, Pencil, Search, Trash2 } from 'lucide-react'
import { useLibrary } from '../stores/libraryStore'
import { useNav } from '../stores/navStore'
import { useUi } from '../stores/uiStore'
import { Cover } from '../components/common/Cover'
import { EmptyState } from '../components/common/EmptyState'
import { PlaylistHeader } from '../components/playlist/PlaylistHeader'
import { PlaylistActions } from '../components/playlist/PlaylistActions'
import { TrackList } from '../components/music/TrackList'
import { formatTotal, songCount } from '../utils/format'

export default function PlaylistPage({ id }: { id: number }) {
  const playlist = useLibrary((s) => s.playlists.find((p) => p.id === id))
  const tracks = useLibrary((s) => s.tracks[id])
  const { loadPlaylistTracks, removeFromPlaylist, movePlaylistTrack } = useLibrary.getState()
  const go = useNav((s) => s.go)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    loadPlaylistTracks(id)
  }, [id, loadPlaylistTracks])

  if (!playlist) return <EmptyState icon={ListMusic} title="Playlist not found" message="It may have been deleted." />

  const edit = () => useUi.getState().openPlaylistModal({ mode: 'edit', playlist })
  const remove = async () => {
    setConfirmDelete(false)
    if (await useLibrary.getState().deletePlaylist(id)) go({ page: 'library' })
  }

  return (
    <div className="pb-10">
      <PlaylistHeader
        cover={
          <button onClick={edit} aria-label="Edit details" className="size-full">
            <Cover seed={playlist.name} src={playlist.cover} icon={ListMusic} className="size-full" />
          </button>
        }
        eyebrow="Playlist"
        title={playlist.name}
        description={playlist.description}
        meta={[songCount(playlist.trackCount), playlist.totalDuration > 0 && formatTotal(playlist.totalDuration)].filter(Boolean).join(' · ')}
      >
        <PlaylistActions tracks={tracks ?? []}>
          <Dropdown>
            <Dropdown.Trigger aria-label="Playlist options" className="grid size-11 place-items-center rounded-full text-pw-text-2 hover:text-white">
              <Ellipsis size={26} />
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom start">
              <Dropdown.Menu onAction={(key) => (key === 'edit' ? edit() : setConfirmDelete(true))}>
                <Dropdown.Item id="edit" textValue="Edit details">
                  <Pencil size={16} /> Edit details
                </Dropdown.Item>
                <Dropdown.Item id="delete" textValue="Delete playlist" className="text-red-400">
                  <Trash2 size={16} /> Delete playlist
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </PlaylistActions>
      </PlaylistHeader>

      <div className="px-5">
        {!tracks ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : tracks.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Let's find something for your playlist"
            message="Search for songs and add them here with “Add to playlist”."
            action={
              <Button size="sm" onPress={() => go({ page: 'search' })}>
                Find songs
              </Button>
            }
          />
        ) : (
          <TrackList tracks={tracks} onRemove={(t) => removeFromPlaylist(id, t)} onMove={(from, to) => movePlaylistTrack(id, from, to)} />
        )}
      </div>

      <Modal.Backdrop isOpen={confirmDelete} onOpenChange={setConfirmDelete}>
        <Modal.Container size="sm">
          <Modal.Dialog className="bg-pw-card">
            <Modal.Header>
              <Modal.Heading>Delete “{playlist.name}”?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-pw-text-2">This removes the playlist from your library. Songs stay in Liked Songs and history.</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" slot="close">
                Cancel
              </Button>
              <Button variant="danger" onPress={remove}>
                Delete
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  )
}
