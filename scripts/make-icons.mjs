// Draws the Pinkwave icon (pink gradient tile + white sound bars) and writes PNGs to resources/.
// Run: node scripts/make-icons.mjs   — no dependencies; uses zlib for PNG encoding.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const PINK_HOT = [0xff, 0x2d, 0x95]
const PINK_SOFT = [0xff, 0x85, 0xc2]
const BARS = [0.38, 0.62, 0.9, 0.62, 0.38] // bar heights as a fraction of the drawable area

function draw(size, { tile = true } = {}) {
  const SS = 4 // supersampling for anti-aliased edges
  const px = new Float32Array(size * size * 4)
  const radius = tile ? 0.22 : 0
  const inRoundRect = (x, y) => {
    const r = radius
    const cx = Math.min(Math.max(x, r), 1 - r)
    const cy = Math.min(Math.max(y, r), 1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
  }
  const barW = 0.1
  const gap = 0.055
  const total = BARS.length * barW + (BARS.length - 1) * gap
  const inBar = (x, y) =>
    BARS.some((h, i) => {
      const left = 0.5 - total / 2 + i * (barW + gap)
      const half = (h * 0.62) / 2
      const top = 0.5 - half
      const bottom = 0.5 + half
      const cx = left + barW / 2
      const r = barW / 2
      if (x < left || x > left + barW) return false
      if (y >= top + r && y <= bottom - r) return true
      const ey = y < top + r ? top + r : bottom - r
      return (x - cx) ** 2 + (y - ey) ** 2 <= r * r
    })

  for (let py = 0; py < size; py++) {
    for (let pxl = 0; pxl < size; pxl++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (pxl + (sx + 0.5) / SS) / size
          const y = (py + (sy + 0.5) / SS) / size
          let c = null
          if (inBar(x, y)) c = tile ? [255, 255, 255] : PINK_HOT
          else if (tile && inRoundRect(x, y)) {
            const t = (x + y) / 2 // diagonal gradient
            c = PINK_HOT.map((v, k) => v + (PINK_SOFT[k] - v) * t)
          }
          if (c) {
            r += c[0]; g += c[1]; b += c[2]; a += 1
          }
        }
      }
      const i = (py * size + pxl) * 4
      const n = SS * SS
      px[i] = a ? r / a : 0
      px[i + 1] = a ? g / a : 0
      px[i + 2] = a ? b / a : 0
      px[i + 3] = (a / n) * 255
    }
  }
  return encodePng(size, px)
}

function encodePng(size, px) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0 // filter: none
    for (let x = 0; x < size * 4; x++) raw[y * (size * 4 + 1) + 1 + x] = Math.round(px[y * size * 4 + x])
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const body = Buffer.concat([Buffer.from(type), data])
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(body))
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

mkdirSync('resources', { recursive: true })
writeFileSync('resources/icon.png', draw(512)) // app + installer icon (electron-builder converts to .ico)
writeFileSync('resources/tray.png', draw(32)) // system tray (Windows scales for DPI)
writeFileSync('resources/tray@2x.png', draw(64))
console.log('wrote resources/icon.png, tray.png, tray@2x.png')
