import { Modal } from '@heroui/react'
import { ListMusic, Plus } from 'lucide-react'
import { useUi } from '../../stores/uiStore'
import { useLibrary } from '../../stores/libraryStore'
import { songCount } from '../../utils/format'
import { Cover } from '../common/Cover'

export function AddToPlaylistModal() {
  const tracks = useUi((s) => s.addToPlaylist)
  const playlists = useLibrary((s) => s.playlists)
  const close = () => useUi.getState().openAddToPlaylist(null)

  const createNew = () => {
    close()
    useUi.getState().openPlaylistModal({ mode: 'create', tracks: tracks ?? undefined })
  }

  const rowClass = 'flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-pw-elevated focus-visible:bg-pw-elevated outline-none'

  return (
    <Modal.Backdrop isOpen={!!tracks} onOpenChange={(open) => !open && close()}>
      <Modal.Container scroll="inside">
        <Modal.Dialog className="bg-pw-card">
          <Modal.Header>
            <Modal.Heading>Add to playlist</Modal.Heading>
            {tracks?.length === 1 && <p className="truncate text-sm text-pw-text-2">{tracks[0].title}</p>}
          </Modal.Header>
          <Modal.Body className="flex max-h-[50vh] flex-col gap-1">
            <button onClick={createNew} className={rowClass}>
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-pw-elevated text-pw-pink">
                <Plus size={22} />
              </span>
              <span className="font-semibold">New playlist</span>
            </button>
            {playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  close()
                  if (tracks) useLibrary.getState().addToPlaylist(p, tracks)
                }}
                className={rowClass}
              >
                <Cover seed={p.name} src={p.cover} icon={ListMusic} className="size-12 shrink-0 rounded-md" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="block text-xs text-pw-text-2">{songCount(p.trackCount)}</span>
                </span>
              </button>
            ))}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
