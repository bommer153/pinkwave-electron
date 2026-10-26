import { Button, cn } from '@heroui/react'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { useNav, useView } from '../../stores/navStore'

export function AppHeader() {
  const canBack = useNav((s) => s.index > 0)
  const canForward = useNav((s) => s.index < s.history.length - 1)
  const back = useNav((s) => s.back)
  const forward = useNav((s) => s.forward)
  const go = useNav((s) => s.go)
  const onSettings = useView().page === 'settings'

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 bg-pw-main/80 px-6 py-3 backdrop-blur-md">
      <Button isIconOnly size="sm" variant="tertiary" className="rounded-full" aria-label="Go back" isDisabled={!canBack} onPress={back}>
        <ChevronLeft size={20} />
      </Button>
      <Button isIconOnly size="sm" variant="tertiary" className="rounded-full" aria-label="Go forward" isDisabled={!canForward} onPress={forward}>
        <ChevronRight size={20} />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="tertiary"
        aria-label="Settings"
        aria-current={onSettings ? 'page' : undefined}
        onPress={() => go({ page: 'settings' })}
        className={cn('ml-auto rounded-full', onSettings && 'text-pw-pink')}
      >
        <Settings size={18} />
      </Button>
    </header>
  )
}
