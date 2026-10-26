import { useEffect } from 'react'
import { Heart, History } from 'lucide-react'
import { useLibrary } from '../stores/libraryStore'
import { Cover } from '../components/common/Cover'
import { EmptyState } from '../components/common/EmptyState'
import { PlaylistHeader } from '../components/playlist/PlaylistHeader'
import { PlaylistActions } from '../components/playlist/PlaylistActions'
import { TrackList } from '../components/music/TrackList'
import { songCount } from '../utils/format'

const COLLECTIONS = {
  liked: {
    title: 'Liked Songs',
    icon: Heart,
    emptyTitle: 'Songs you like will appear here',
    emptyMessage: 'Save songs by tapping the heart icon.'
  },
  recent: {
    title: 'Recently Played',
    icon: History,
    emptyTitle: 'Nothing played yet',
    emptyMessage: 'Songs you play will show up here.'
  }
}

export default function CollectionPage({ kind }: { kind: keyof typeof COLLECTIONS }) {
  const c = COLLECTIONS[kind]
  const tracks = useLibrary((s) => (kind === 'liked' ? s.liked : s.recent))

  useEffect(() => {
    if (kind === 'recent') useLibrary.getState().loadRecent()
  }, [kind])

  return (
    <div className="pb-10">
      <PlaylistHeader cover={<Cover seed={c.title} icon={c.icon} className="size-full" />} eyebrow="Collection" title={c.title} meta={songCount(tracks.length)}>
        <PlaylistActions tracks={tracks} />
      </PlaylistHeader>
      <div className="px-5">
        {tracks.length === 0 ? <EmptyState icon={c.icon} title={c.emptyTitle} message={c.emptyMessage} /> : <TrackList tracks={tracks} />}
      </div>
    </div>
  )
}
