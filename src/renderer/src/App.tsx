import { lazy, Suspense, useEffect, useRef } from 'react'
import { Toast } from '@heroui/react'
import { useNav, useView } from './stores/navStore'
import { useYouTube } from './stores/youtubeStore'
import { AppSidebar } from './components/layout/AppSidebar'
import { AppHeader } from './components/layout/AppHeader'
import { MusicPlayer } from './components/player/MusicPlayer'
import { NowPlayingPanel } from './components/player/NowPlayingPanel'
import { PlaylistModal } from './components/playlist/PlaylistModal'
import { AddToPlaylistModal } from './components/playlist/AddToPlaylistModal'
import { useLibrary } from './stores/libraryStore'
import { initPlaybackSettings } from './stores/playbackSettings'
import { initDesktopBridge } from './services/desktopBridge'
import { LoadingSkeleton } from './components/common/LoadingSkeleton'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

const HomePage = lazy(() => import('./pages/HomePage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const PlaylistPage = lazy(() => import('./pages/PlaylistPage'))
const CollectionPage = lazy(() => import('./pages/CollectionPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

function Page() {
  const view = useView()
  switch (view.page) {
    case 'home':
      return <HomePage />
    case 'search':
      return <SearchPage />
    case 'library':
      return <LibraryPage />
    case 'playlist':
      return <PlaylistPage id={view.id} />
    case 'liked':
    case 'recent':
      return <CollectionPage kind={view.page} />
    case 'settings':
      return <SettingsPage />
  }
}

// The player sits outside the routed area, so changing pages never remounts it.
export default function App() {
  const view = useView()
  const historyIndex = useNav((s) => s.index)
  const mainRef = useRef<HTMLElement>(null)
  useKeyboardShortcuts()

  useEffect(() => {
    useYouTube.getState().refreshStatus()
    useLibrary.getState().load()
    initPlaybackSettings()
    initDesktopBridge()
  }, [])

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [view])

  return (
    <div className="flex h-full flex-col gap-2 bg-pw-base p-2 pb-0">
      <div className="flex min-h-0 flex-1 gap-2">
        <AppSidebar />
        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto rounded-xl bg-pw-main">
          <AppHeader />
          {/* Keyed by history position: navigating clears a crashed page and replays the fade-in. */}
          <ErrorBoundary key={historyIndex} onGoHome={() => useNav.getState().go({ page: 'home' })}>
            <Suspense fallback={<LoadingSkeleton />}>
              <div className="pw-page-in">
                <Page />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
        <NowPlayingPanel />
      </div>
      <MusicPlayer />
      <PlaylistModal />
      <AddToPlaylistModal />
      {/* Lifted above the player bar so toasts never cover the playback controls. */}
      <Toast.Provider placement="bottom" className="bottom-24!" />
    </div>
  )
}
