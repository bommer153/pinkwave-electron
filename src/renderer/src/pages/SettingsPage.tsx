import { useEffect, useState, type FormEvent } from 'react'
import { Button, cn, Input, Label, Spinner, TextField } from '@heroui/react'
import { CircleAlert, ExternalLink } from 'lucide-react'
import type { AppInfo } from '../../../shared/ipc'
import { useYouTube } from '../stores/youtubeStore'
import { PlaybackSettingsPanel } from '../components/settings/PlaybackSettingsPanel'
import { DesktopSettingsPanel } from '../components/settings/DesktopSettingsPanel'

const CONSOLE_URL = 'https://console.cloud.google.com/apis/library/youtube.googleapis.com'

export default function SettingsPage() {
  const status = useYouTube((s) => s.status)
  const refreshStatus = useYouTube((s) => s.refreshStatus)
  const setKey = useYouTube((s) => s.setKey)
  const [keyInput, setKeyInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    setBusy(true)
    refreshStatus(true).finally(() => setBusy(false))
    window.pinkwave.getAppInfo().then(setInfo)
  }, [refreshStatus])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const s = await setKey(keyInput.trim()).finally(() => setBusy(false))
    if (s.verified?.ok) setKeyInput('')
  }

  const remove = async () => {
    setBusy(true)
    await setKey(null).finally(() => setBusy(false))
  }

  const verified = status?.verified
  const pill = busy
    ? { label: 'Checking…', tone: 'muted' }
    : !status?.configured
      ? { label: 'Not connected', tone: 'muted' }
      : verified?.ok === false
        ? { label: 'Error', tone: 'error' }
        : { label: 'Connected', tone: 'ok' }

  return (
    <div className="max-w-3xl px-8 pb-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">Settings</h1>

      <PlaybackSettingsPanel />
      <DesktopSettingsPanel />

      <section className="rounded-xl bg-pw-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">YouTube API</h2>
            <p className="text-sm text-pw-text-2">Pinkwave uses the official YouTube Data API v3 for search and discovery.</p>
          </div>
          <span
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
              pill.tone === 'ok' && 'bg-pw-pink/15 text-pw-pink',
              pill.tone === 'error' && 'bg-red-500/15 text-red-400',
              pill.tone === 'muted' && 'bg-pw-elevated text-pw-text-2'
            )}
          >
            {busy ? <Spinner size="sm" /> : <span className="size-2 rounded-full bg-current" />}
            {pill.label}
          </span>
        </div>

        {verified?.ok === false && !busy && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
            <CircleAlert size={16} className="mt-0.5 shrink-0" /> {verified.error}
          </p>
        )}

        {status?.fromEnv && (
          <p className="mt-4 text-sm text-pw-text-2">
            Using the key from the <code className="text-pw-pink-soft">YOUTUBE_API_KEY</code> environment variable. Saving a key here overrides it.
          </p>
        )}

        <form onSubmit={save} className="mt-5 flex items-end gap-3">
          <TextField className="flex-1" value={keyInput} onChange={setKeyInput} isDisabled={busy}>
            <Label>{status?.configured && !status.fromEnv ? 'Replace API key' : 'API key'}</Label>
            <Input type="password" placeholder="AIza…" autoComplete="off" spellCheck={false} />
          </TextField>
          <Button type="submit" isDisabled={busy || !keyInput.trim()}>
            Save key
          </Button>
          {status?.configured && !status.fromEnv && (
            <Button variant="danger-soft" onPress={remove} isDisabled={busy}>
              Remove
            </Button>
          )}
        </form>
        <p className="mt-2 text-xs text-pw-muted">The key is checked with YouTube, then stored encrypted on this computer.</p>

        <details className="mt-5 text-sm text-pw-text-2">
          <summary className="cursor-pointer font-semibold text-white">How to get an API key</summary>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            <li>Open the Google Cloud Console and create (or pick) a project.</li>
            <li>Enable <strong className="text-white">YouTube Data API v3</strong> for that project.</li>
            <li>Go to APIs &amp; Services → Credentials → Create credentials → API key.</li>
            <li>Paste the key above. The free quota allows about 100 searches a day.</li>
          </ol>
          <Button size="sm" variant="tertiary" className="mt-3" onPress={() => window.pinkwave.openExternal(CONSOLE_URL)}>
            Open Google Cloud Console <ExternalLink size={14} />
          </Button>
        </details>
      </section>

      {info && (
        <p className="mt-8 text-xs text-pw-muted">
          {info.name} v{info.version}
        </p>
      )}
    </div>
  )
}
