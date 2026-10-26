import type { ReactNode } from 'react'
import { cn } from '@heroui/react'
import {
  AudioWaveform,
  Heart,
  History,
  House,
  Library,
  ListMusic,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  type LucideIcon
} from 'lucide-react'
import { useNav, useView, type View } from '../../stores/navStore'
import { useUi } from '../../stores/uiStore'
import { useLibrary } from '../../stores/libraryStore'
import { Cover } from '../common/Cover'
import { useDragReorder } from '../../hooks/useDragReorder'
import { songCount } from '../../utils/format'

const MAIN_NAV: { view: View; label: string; icon: LucideIcon }[] = [
  { view: { page: 'home' }, label: 'Home', icon: House },
  { view: { page: 'search' }, label: 'Search', icon: Search },
  { view: { page: 'library' }, label: 'Your Library', icon: Library }
]

export function AppSidebar() {
  const collapsed = useUi((s) => s.sidebarCollapsed)
  const toggleSidebar = useUi((s) => s.toggleSidebar)
  const openCreate = () => useUi.getState().openPlaylistModal({ mode: 'create' })
  const playlists = useLibrary((s) => s.playlists)
  const movePlaylist = useLibrary((s) => s.movePlaylist)
  const view = useView()
  const go = useNav((s) => s.go)
  const { itemProps, dragging, over } = useDragReorder(playlists.length, movePlaylist)

  const icon = (Icon: LucideIcon, active: boolean) => (
    <Icon size={22} className={cn('shrink-0', active && 'text-pw-pink')} />
  )

  return (
    <aside className={cn('flex shrink-0 flex-col gap-2 transition-[width] duration-300 ease-out', collapsed ? 'w-[72px]' : 'w-72')}>
      <nav className="flex flex-col gap-1 rounded-xl bg-pw-sidebar p-3">
        <div className={cn('mb-2 flex items-center', collapsed ? 'justify-center' : 'justify-between pl-2')}>
          {!collapsed && (
            <span className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <AudioWaveform className="text-pw-pink" size={24} />
              Pinkwave
            </span>
          )}
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-md p-1.5 text-pw-text-2 transition hover:bg-pw-elevated hover:text-white"
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
        {MAIN_NAV.map((item) => {
          const active = view.page === item.view.page
          return (
            <NavItem key={item.label} label={item.label} active={active} collapsed={collapsed} onClick={() => go(item.view)}>
              {icon(item.icon, active)}
            </NavItem>
          )
        })}
      </nav>

      <section className="flex min-h-0 flex-1 flex-col gap-1 rounded-xl bg-pw-sidebar p-3">
        <NavItem label="Recently Played" active={view.page === 'recent'} collapsed={collapsed} onClick={() => go({ page: 'recent' })}>
          {icon(History, view.page === 'recent')}
        </NavItem>
        <NavItem label="Liked Songs" active={view.page === 'liked'} collapsed={collapsed} onClick={() => go({ page: 'liked' })}>
          {icon(Heart, view.page === 'liked')}
        </NavItem>

        <button
          onClick={openCreate}
          aria-label="Create playlist"
          className={cn(
            'my-3 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pw-pink-hot to-pw-pink py-2.5 text-sm font-semibold text-white',
            'shadow-[0_4px_20px_-6px_var(--color-pw-pink)] transition hover:brightness-110 active:scale-[0.98]'
          )}
        >
          <Plus size={18} strokeWidth={2.5} />
          {!collapsed && 'Create Playlist'}
        </button>

        {!collapsed && (
          <h2 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-pw-muted">Your Playlists</h2>
        )}
        <div
          aria-label="Your playlists. Drag, or press Alt+Up/Down, to reorder."
          className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1"
        >
          {playlists.length === 0 && !collapsed && (
            <p className="px-2 text-sm text-pw-muted">Playlists you create show up here.</p>
          )}
          {playlists.map((p, i) => (
            <div
              key={p.id}
              {...itemProps(i)}
              className={cn('rounded-lg border-t-2 border-transparent', over === i && dragging !== i && 'border-pw-pink', dragging === i && 'opacity-40')}
            >
              <NavItem
                label={p.name}
                sublabel={`Playlist · ${songCount(p.trackCount)}`}
                active={view.page === 'playlist' && view.id === p.id}
                collapsed={collapsed}
                onClick={() => go({ page: 'playlist', id: p.id })}
              >
                <Cover seed={p.name} src={p.cover} icon={ListMusic} className="size-10 shrink-0 rounded-md" />
              </NavItem>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}

interface NavItemProps {
  label: string
  sublabel?: string
  active: boolean
  collapsed: boolean
  onClick(): void
  children: ReactNode
}

function NavItem({ label, sublabel, active, collapsed, onClick, children }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        'relative flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-semibold transition-colors',
        collapsed && 'justify-center',
        active ? 'bg-pw-elevated text-white' : 'text-pw-text-2 hover:bg-pw-card hover:text-white',
        active && 'before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-pw-pink'
      )}
    >
      {children}
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate">{label}</span>
          {sublabel && <span className="block truncate text-xs font-normal text-pw-muted">{sublabel}</span>}
        </span>
      )}
    </button>
  )
}
