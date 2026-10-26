import { Button, cn } from '@heroui/react'
import { GripVertical, ListMusic, Play, X } from 'lucide-react'
import { usePlayer } from '../../stores/playerStore'
import { useUi } from '../../stores/uiStore'
import { useDragReorder } from '../../hooks/useDragReorder'
import { keyOf } from '../../utils/queue'
import { EmptyState } from '../common/EmptyState'
import { TrackInfo } from '../music/TrackInfo'

export function QueuePanel() {
  const queue = usePlayer((s) => s.queue)
  const index = usePlayer((s) => s.index)
  const { jumpTo, removeFromQueue, moveInQueue, clearQueue } = usePlayer.getState()
  const toggleQueue = useUi((s) => s.toggleQueue)
  const upcoming = queue.slice(index + 1)
  const abs = (i: number) => index + 1 + i
  const { itemProps, dragging, over } = useDragReorder(upcoming.length, (from, to) => moveInQueue(abs(from), abs(to)))

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t border-white/5">
      <div className="flex items-center gap-1 px-4 pt-3 pb-2">
        <h2 className="flex-1 font-bold">
          Next up {upcoming.length > 0 && <span className="text-sm font-normal text-pw-muted">· {upcoming.length}</span>}
        </h2>
        {upcoming.length > 0 && (
          <Button size="sm" variant="ghost" onPress={clearQueue}>
            Clear
          </Button>
        )}
        <Button isIconOnly size="sm" variant="ghost" aria-label="Close queue" onPress={toggleQueue}>
          <X size={18} />
        </Button>
      </div>
      {upcoming.length > 0 ? (
        <ol aria-label="Up next. Drag, or press Alt+Up/Down, to reorder." className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-4">
          {upcoming.map((t, i) => (
            <li
              key={keyOf(t)}
              tabIndex={0}
              {...itemProps(i)}
              onDoubleClick={() => jumpTo(abs(i))}
              className={cn(
                'group flex cursor-grab items-center gap-1 rounded-lg border-t-2 border-transparent py-1.5 pr-1 pl-0.5 outline-none hover:bg-pw-card focus-visible:bg-pw-card active:cursor-grabbing',
                over === i && dragging !== i && 'border-pw-pink',
                dragging === i && 'opacity-40'
              )}
            >
              <GripVertical size={14} className="shrink-0 text-pw-muted opacity-0 group-hover:opacity-100" />
              <div className="min-w-0 flex-1">
                <TrackInfo track={t} size="sm" />
              </div>
              <div className="flex opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-focus:opacity-100">
                <Button isIconOnly size="sm" variant="ghost" aria-label={`Play ${t.title} now`} onPress={() => jumpTo(abs(i))}>
                  <Play size={15} fill="currentColor" />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" aria-label={`Remove ${t.title} from queue`} onPress={() => removeFromQueue(abs(i))}>
                  <X size={16} />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState icon={ListMusic} title="Your queue is empty" message="Use “Add to queue” on any song to line it up here." />
      )}
    </section>
  )
}
