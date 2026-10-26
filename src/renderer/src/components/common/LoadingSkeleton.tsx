import { Skeleton } from '@heroui/react'

export function LoadingSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-5 px-8 py-6" aria-busy="true">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl bg-pw-card p-3">
          <Skeleton className="aspect-square rounded-lg" />
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  )
}
