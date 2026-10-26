import { Button } from '@heroui/react'
import { Heart, ListMusic, Plus } from 'lucide-react'
import { useLibrary } from '../stores/libraryStore'
import { useNav } from '../stores/navStore'
import { useUi } from '../stores/uiStore'
import { Cover } from '../components/common/Cover'
import { PlaylistCard } from '../components/playlist/PlaylistCard'
import { songCount } from '../utils/format'

export default function LibraryPage() {
  const playlists = useLibrary((s) => s.playlists)
  const go = useNav((s) => s.go)
  const likedCount = useLibrary((s) => s.liked.length)
  const openCreate = () => useUi.getState().openPlaylistModal({ mode: 'create' })

  return (
    <div className="px-8 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Your Library</h1>
        <Button size="sm" onPress={openCreate}>
          <Plus size={16} /> Create Playlist
        </Button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5">
        <PlaylistCard
          cover={<Cover seed="Liked Songs" icon={Heart} className="size-full" />}
          title="Liked Songs"
          subtitle={`Collection · ${songCount(likedCount)}`}
          onOpen={() => go({ page: 'liked' })}
        />
        {playlists.map((p) => (
          <PlaylistCard
            key={p.id}
            cover={<Cover seed={p.name} src={p.cover} icon={ListMusic} className="size-full" />}
            title={p.name}
            subtitle={`Playlist · ${songCount(p.trackCount)}`}
            onOpen={() => go({ page: 'playlist', id: p.id })}
          />
        ))}
      </div>
    </div>
  )
}
