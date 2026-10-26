import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Encrypted with the OS keychain (DPAPI on Windows); never written in plain text.
const keyFile = () => join(app.getPath('userData'), 'youtube-key.bin')

export function savedApiKey(): string | null {
  if (!existsSync(keyFile())) return null
  try {
    return safeStorage.decryptString(readFileSync(keyFile()))
  } catch {
    return null
  }
}

/** Saved key wins; YOUTUBE_API_KEY env var is a fallback for development. */
export function getApiKey(): string | null {
  return savedApiKey() ?? process.env.YOUTUBE_API_KEY ?? null
}

export function saveApiKey(key: string | null): void {
  if (key === null) return rmSync(keyFile(), { force: true })
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure storage is not available on this system.')
  writeFileSync(keyFile(), safeStorage.encryptString(key))
}
