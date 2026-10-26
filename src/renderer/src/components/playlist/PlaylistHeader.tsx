import type { ReactNode } from 'react'

interface PlaylistHeaderProps {
  cover: ReactNode
  eyebrow: string
  title: string
  description?: string
  meta: string
  children?: ReactNode
}

export function PlaylistHeader({ cover, eyebrow, title, description, meta, children }: PlaylistHeaderProps) {
  return (
    <div className="bg-gradient-to-b from-pw-pink/20 via-pw-pink/5 to-transparent px-8 pt-4 pb-6">
      <div className="flex items-end gap-6">
        <div className="size-48 shrink-0 overflow-hidden rounded-lg shadow-2xl shadow-black/60">{cover}</div>
        <div className="min-w-0 pb-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-pw-text-2">{eyebrow}</p>
          <h1 className="mt-1 truncate text-5xl font-extrabold tracking-tight">{title}</h1>
          {description && <p className="mt-3 line-clamp-2 text-sm text-pw-text-2">{description}</p>}
          <p className="mt-2 text-sm text-pw-text-2">{meta}</p>
        </div>
      </div>
      {children && <div className="mt-6 flex items-center gap-3">{children}</div>}
    </div>
  )
}
