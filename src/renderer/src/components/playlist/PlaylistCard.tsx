import type { ReactNode } from 'react'

interface PlaylistCardProps {
  cover: ReactNode
  title: string
  subtitle: string
  onOpen(): void
}

export function PlaylistCard({ cover, title, subtitle, onOpen }: PlaylistCardProps) {
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col gap-3 rounded-xl bg-pw-card p-3 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-pw-elevated hover:shadow-[0_8px_30px_-12px_var(--color-pw-pink)]"
    >
      <div className="aspect-square overflow-hidden rounded-lg shadow-lg shadow-black/40">{cover}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-pw-text-2">{subtitle}</p>
      </div>
    </button>
  )
}
