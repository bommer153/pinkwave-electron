import { Button } from '@heroui/react'
import { KeyRound } from 'lucide-react'
import { useNav } from '../../stores/navStore'
import { EmptyState } from './EmptyState'

export function ConnectYouTube({ message }: { message: string }) {
  const go = useNav((s) => s.go)
  return (
    <EmptyState
      icon={KeyRound}
      title="Connect YouTube"
      message={message}
      action={
        <Button size="sm" onPress={() => go({ page: 'settings' })}>
          Open Settings
        </Button>
      }
    />
  )
}
