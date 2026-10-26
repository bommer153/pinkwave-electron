import { useEffect } from 'react'
import { Button, Skeleton, Spinner } from '@heroui/react'
import { CircleAlert, SearchX } from 'lucide-react'
import { useSearch } from '../stores/searchStore'

import { useYouTube } from '../stores/youtubeStore'
import { SearchInput } from '../components/common/SearchInput'
import { EmptyState } from '../components/common/EmptyState'
import { ConnectYouTube } from '../components/common/ConnectYouTube'
import { TrackList } from '../components/music/TrackList'
import { gradientFor } from '../utils/format'

const GENRES = ['Pop', 'Hip-Hop', 'K-Pop', 'Lo-fi', 'Rock', 'R&B', 'Anime', 'Nightcore', 'EDM', 'Jazz', 'OPM', 'Acoustic']

export default function SearchPage() {
  const configured = useYouTube((s) => s.status?.configured)
  const { query, searched, results, nextPageToken, loading, loadingMore, error, setQuery, run, loadMore } = useSearch()

  // Debounced: one API request once typing pauses.
  useEffect(() => {
    const t = setTimeout(run, 450)
    return () => clearTimeout(t)
  }, [query, run])

  if (configured === false) {
    return (
      <div className="px-8 pb-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Search</h1>
        <ConnectYouTube message="Searching songs, artists and genres needs a YouTube Data API key." />
      </div>
    )
  }

  return (
    <div className="px-8 pb-10">
      <SearchInput value={query} onChange={setQuery} placeholder="What do you want to listen to?" />

      {error ? (
        <EmptyState
          icon={CircleAlert}
          title="Search failed"
          message={error}
          action={
            <Button size="sm" variant="secondary" onPress={run}>
              Try again
            </Button>
          }
        />
      ) : loading && results.length === 0 ? (
        <div className="mt-6 flex flex-col gap-3" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : !searched ? (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-bold">Browse genres</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setQuery(`${g} music`)}
                className="h-24 rounded-xl p-4 text-left text-lg font-bold shadow-lg shadow-black/30 transition hover:scale-[1.03] hover:brightness-110"
                style={{ background: gradientFor(g) }}
              >
                {g}
              </button>
            ))}
          </div>
        </section>
      ) : results.length === 0 ? (
        <EmptyState icon={SearchX} title={`No results for “${searched}”`} message="Check the spelling or try different keywords." />
      ) : (
        <section className={loading ? 'mt-6 opacity-60 transition-opacity' : 'mt-6 transition-opacity'}>
          <h2 className="mb-3 px-3 text-xl font-bold">Songs</h2>
          <TrackList tracks={results} />
          {nextPageToken && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" size="sm" onPress={loadMore} isDisabled={loadingMore}>
                {loadingMore ? <Spinner size="sm" /> : 'Load more'}
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
