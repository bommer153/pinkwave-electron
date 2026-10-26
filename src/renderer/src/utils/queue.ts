// Pure queue helpers (no imports) so they can be tested with plain Node.

/** Random order (Fisher–Yates). If `avoidFirst` would come first, it's swapped away when possible. */
export function shuffled<T>(items: T[], avoidFirst?: T): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  if (out.length > 1 && out[0] === avoidFirst) {
    const j = 1 + Math.floor(Math.random() * (out.length - 1))
    ;[out[0], out[j]] = [out[j], out[0]]
  }
  return out
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items
  const out = [...items]
  const [item] = out.splice(from, 1)
  out.splice(to, 0, item)
  return out
}

const keys = new WeakMap<object, number>()
let nextKey = 0

/** Stable React key per queue entry, so the same song queued twice still gets distinct rows. */
export function keyOf(item: object): number {
  let k = keys.get(item)
  if (k === undefined) keys.set(item, (k = nextKey++))
  return k
}
