import { cn } from '@heroui/react'
import type { LucideIcon } from 'lucide-react'
import { gradientFor } from '../../utils/format'

interface CoverProps {
  seed: string
  src?: string | null
  icon?: LucideIcon
  className?: string
}

// Artwork if we have it, otherwise a generated gradient tile.
export function Cover({ seed, src, icon: Icon, className }: CoverProps) {
  if (src) return <img src={src} alt="" loading="lazy" decoding="async" draggable={false} className={cn('object-cover', className)} />
  return (
    <div className={cn('grid place-items-center', className)} style={{ background: gradientFor(seed) }}>
      {Icon && <Icon className="size-1/2 max-h-16 max-w-16 text-white/90" strokeWidth={1.75} />}
    </div>
  )
}
