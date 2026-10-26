import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  message?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-pw-elevated text-pw-pink">
        <Icon size={26} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {message && <p className="max-w-sm text-sm text-pw-text-2">{message}</p>}
      {action}
    </div>
  )
}
