import { useState } from 'react'
import { cn } from '@heroui/react'
import { Heart } from 'lucide-react'
import type { Track } from '../../../../shared/types'
import { useLibrary } from '../../stores/libraryStore'

export function LikeButton({ track, className, size = 18 }: { track: Track; className?: string; size?: number }) {
  const liked = useLibrary((s) => s.likedIds.has(track.videoId))
  const toggleLike = useLibrary((s) => s.toggleLike)
  // Pop only when the user likes it, not every time a liked heart renders.
  const [pop, setPop] = useState(false)

  return (
    <button
      onClick={() => {
        if (!liked) setPop(true)
        toggleLike(track)
      }}
      aria-label={liked ? `Remove ${track.title} from Liked Songs` : `Save ${track.title} to Liked Songs`}
      aria-pressed={liked}
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full transition hover:scale-110',
        liked ? 'text-pw-pink' : 'text-pw-text-2 hover:text-white',
        className
      )}
    >
      <Heart size={size} fill={liked ? 'currentColor' : 'none'} className={cn(pop && 'pw-heart-pop')} onAnimationEnd={() => setPop(false)} />
    </button>
  )
}
