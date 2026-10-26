import { useEffect, useRef } from 'react'
import { attachEngine } from '../../stores/playerStore'
import { createYouTubeEngine } from '../../services/youtubeEngine'

// Mounted once for the app's lifetime; the YouTube iframe replaces the inner div.
export function VideoHost() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (host) attachEngine((events) => createYouTubeEngine(host, events))
  }, [])

  return (
    <div className="size-full">
      <div ref={ref} />
    </div>
  )
}
