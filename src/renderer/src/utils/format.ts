export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** Playlist length, e.g. "1 hr 5 min" or "12 min". */
export function formatTotal(seconds: number): string {
  const min = Math.round(seconds / 60)
  return min >= 60 ? `${Math.floor(min / 60)} hr ${min % 60} min` : `${min} min`
}

export const songCount = (n: number) => `${n} ${n === 1 ? 'song' : 'songs'}`

// Stable dark-pink/violet gradient per seed, used when a playlist has no cover.
export function gradientFor(seed: string): string {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  const hue = 300 + (Math.abs(hash) % 60) // 300–359: magenta → pink
  return `linear-gradient(135deg, hsl(${hue} 85% 58%), hsl(${hue - 50} 60% 18%))`
}

export function greeting(date = new Date()): string {
  const h = date.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
