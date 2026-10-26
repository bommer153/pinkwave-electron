import { useEffect, type ReactNode } from 'react'
import { Button } from '@heroui/react'
import { CircleAlert, Heart, ListMusic, Mic2 } from 'lucide-react'
import { useLibrary } from '../stores/libraryStore'
import { useNav, type View } from '../stores/navStore'
import { usePlayer } from '../stores/playerStore'
import { useSearch } from '../stores/searchStore'
import { useYouTube } from '../stores/youtubeStore'
import { Cover } from '../components/common/Cover'
import { EmptyState } from '../components/common/EmptyState'
import { ConnectYouTube } from '../components/common/ConnectYouTube'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { MusicCard } from '../components/music/MusicCard'
import { greeting } from '../utils/format'

export default function HomePage() {
  const playlists = useLibrary((s) => s.playlists)
  const recent = useLibrary((s) => s.recent)
  const go = useNav((s) => s.go)
  const configured = useYouTube((s) => s.status?.configured)
  const trending = useYouTube((s) => s.trending)
  const trendingError = useYouTube((s) => s.trendingError)
  const loadTrending = useYouTube((s) => s.loadTrending)
  const currentId = usePlayer((s) => s.queue[s.index]?.videoId)
  const isPlaying = usePlayer((s) => s.isPlaying)
  const playOrToggle = usePlayer((s) => s.playOrToggle)

  useEffect(() => {
    if (configured) loadTrending()
  }, [configured, loadTrending])

  // Artists come from the trending chart itself, so they cost no extra API quota.
  const artists = [...new Set(trending?.map((t) => t.artist))].slice(0, 8)

  const tiles: { key: string; label: string; view: View; cover: ReactNode }[] = [
    { key: 'liked', label: 'Liked Songs', view: { page: 'liked' }, cover: <Cover seed="Liked Songs" icon={Heart} className="size-full" /> },
    ...playlists.slice(0, 5).map((p) => ({
      key: String(p.id),
      label: p.name,
      view: { page: 'playlist', id: p.id } as View,
      cover: <Cover seed={p.name} src={p.cover} icon={ListMusic} className="size-full" />
    }))
  ]

  const searchArtist = (artist: string) => {
    useSearch.getState().setQuery(artist)
    go({ page: 'search' })
  }

  return (
    <div className="px-8 pb-10">
      <section className="pt-2 pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight">{greeting()}</h1>
        <p className="mt-2 text-pw-text-2">Your music. Your mood. Your wave.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {tiles.map((t) => (
          <button
            key={t.key}
            onClick={() => go(t.view)}
            className="group flex h-16 items-center gap-4 overflow-hidden rounded-lg bg-pw-card pr-4 text-left transition hover:bg-pw-elevated"
          >
            <div className="size-16 shrink-0">{t.cover}</div>
            <span className="truncate font-semibold">{t.label}</span>
          </button>
        ))}
      </section>

      {recent.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Recently Played</h2>
            <button onClick={() => go({ page: 'recent' })} className="text-sm font-semibold text-pw-text-2 hover:text-white hover:underline">
              Show all
            </button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
            {recent.slice(0, 6).map((t, i) => (
              <MusicCard key={t.videoId} track={t} active={t.videoId === currentId} playing={isPlaying} onPlay={() => playOrToggle(recent, i)} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-bold tracking-tight">Trending Music</h2>
        {configured === false ? (
          <div className="rounded-xl bg-pw-card/60">
            <ConnectYouTube message="Trending music, popular artists and recommendations appear here once a YouTube Data API key is connected." />
          </div>
        ) : trendingError ? (
          <div className="rounded-xl bg-pw-card/60">
            <EmptyState
              icon={CircleAlert}
              title="Couldn't load trending music"
              message={trendingError}
              action={
                <Button size="sm" variant="secondary" onPress={() => loadTrending(true)}>
                  Try again
                </Button>
              }
            />
          </div>
        ) : !trending ? (
          <div className="-mx-8">
            <LoadingSkeleton cards={8} />
          </div>
        ) : trending.length === 0 ? (
          <div className="rounded-xl bg-pw-card/60">
            <EmptyState icon={ListMusic} title="No trending music right now" message="YouTube returned no chart for your region." />
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
            {trending.slice(0, 12).map((t, i) => (
              <MusicCard
                key={t.videoId}
                track={t}
                active={t.videoId === currentId}
                playing={isPlaying}
                onPlay={() => playOrToggle(trending, i)}
              />
            ))}
          </div>
        )}
      </section>

      {artists.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">Popular Artists</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-5">
            {artists.map((a) => (
              <button key={a} onClick={() => searchArtist(a)} className="group flex flex-col items-center gap-3 rounded-xl p-3 transition hover:bg-pw-card">
                <Cover seed={a} icon={Mic2} className="aspect-square w-full rounded-full shadow-lg shadow-black/40 transition group-hover:shadow-[0_8px_30px_-8px_var(--color-pw-pink)]" />
                <span className="w-full truncate text-center text-sm font-semibold">{a}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
