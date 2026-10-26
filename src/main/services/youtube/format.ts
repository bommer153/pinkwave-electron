// Pure helpers (no Electron imports) so they can be tested with plain Node.

/** ISO 8601 duration (PT1H2M3S) → seconds; undefined for live/unknown. */
export function parseDuration(iso: string | undefined): number | undefined {
  const m = iso?.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!m) return undefined
  const [d, h, min, s] = m.slice(1).map((part) => Number(part ?? 0))
  const total = d * 86400 + h * 3600 + min * 60 + s
  return total || undefined
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

/** The Data API returns titles HTML-escaped. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (whole, code: string) => {
    if (code[0] !== '#') return ENTITIES[code.toLowerCase()] ?? whole
    const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
    return Number.isFinite(n) ? String.fromCodePoint(n) : whole
  })
}

/** "Artist - Topic" auto-generated channels → "Artist". */
export function cleanArtist(channelTitle: string): string {
  return decodeEntities(channelTitle).replace(/\s+-\s+Topic$/, '')
}
