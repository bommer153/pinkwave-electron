import { useEffect, useState, type FormEvent } from 'react'
import { Button, Input, Label, Modal, TextArea, TextField } from '@heroui/react'
import { ImagePlus, ListMusic } from 'lucide-react'
import { useUi } from '../../stores/uiStore'
import { safely, useLibrary } from '../../stores/libraryStore'
import { useNav } from '../../stores/navStore'
import { Cover } from '../common/Cover'

/** Create playlist and Edit details, in one form. */
export function PlaylistModal() {
  const state = useUi((s) => s.playlistModal)
  const close = () => useUi.getState().openPlaylistModal(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cover, setCover] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const editing = state?.mode === 'edit' ? state.playlist : null

  useEffect(() => {
    setName(editing?.name ?? '')
    setDescription(editing?.description ?? '')
    setCover(editing?.cover ?? null)
  }, [state, editing])

  const chooseCover = async () => {
    const image = await safely(() => window.pinkwave.library.chooseCover())
    if (image) setCover(image)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!state || !name.trim() || busy) return
    setBusy(true)
    const input = { name: name.trim(), description: description.trim(), cover }
    const lib = useLibrary.getState()
    if (state.mode === 'edit') {
      await lib.updatePlaylist(state.playlist.id, input)
      close()
    } else {
      const created = await lib.createPlaylist(input, state.tracks)
      if (created) {
        close()
        useNav.getState().go({ page: 'playlist', id: created.id })
      }
    }
    setBusy(false)
  }

  return (
    <Modal.Backdrop isOpen={!!state} onOpenChange={(open) => !open && close()}>
      <Modal.Container size="lg">
        <Modal.Dialog className="bg-pw-card">
          <form onSubmit={submit}>
            <Modal.Header>
              <Modal.Heading>{editing ? 'Edit details' : 'Create playlist'}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex gap-5">
              <div className="flex shrink-0 flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={chooseCover}
                  aria-label="Choose cover image"
                  className="group relative size-40 overflow-hidden rounded-lg shadow-lg shadow-black/50"
                >
                  <Cover seed={name || 'New playlist'} src={cover} icon={ListMusic} className="size-full" />
                  <span className="absolute inset-0 grid place-items-center bg-black/60 text-sm font-semibold opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    <span className="flex flex-col items-center gap-1">
                      <ImagePlus size={24} /> Choose image
                    </span>
                  </span>
                </button>
                {cover && (
                  <button type="button" onClick={() => setCover(null)} className="text-xs text-pw-text-2 underline-offset-2 hover:text-white hover:underline">
                    Remove image
                  </button>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <TextField isRequired autoFocus value={name} onChange={setName} maxLength={100}>
                  <Label>Name</Label>
                  <Input placeholder="My Playlist" />
                </TextField>
                <TextField value={description} onChange={setDescription} maxLength={300}>
                  <Label>Description</Label>
                  <TextArea placeholder="Add an optional description" rows={3} className="rounded-xl border border-white/10" />
                </TextField>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" slot="close">
                Cancel
              </Button>
              <Button type="submit" isDisabled={!name.trim() || busy}>
                {editing ? 'Save' : 'Create'}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
