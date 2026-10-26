import { useEffect } from 'react'
import { usePlayer } from '../stores/playerStore'

/** Space play/pause, Ctrl+←/→ previous/next, Ctrl+↑/↓ volume. Ignored while typing or in dialogs/menus. */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.defaultPrevented || target.closest('input, textarea, [contenteditable=true], [role=dialog], [role=menu]')) return
      const p = usePlayer.getState()
      if (e.code === 'Space' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (target.closest('button, a, [role=button], [role=switch], [role=radio]')) return // Space activates focused controls
        e.preventDefault()
        p.togglePlay()
      } else if (e.ctrlKey && !e.altKey) {
        if (e.key === 'ArrowRight') p.next()
        else if (e.key === 'ArrowLeft') p.previous()
        else if (e.key === 'ArrowUp') p.setVolume(Math.min(100, p.volume + 10))
        else if (e.key === 'ArrowDown') p.setVolume(Math.max(0, p.volume - 10))
        else return
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
