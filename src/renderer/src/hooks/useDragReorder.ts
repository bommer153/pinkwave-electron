import { useState, type DragEvent, type KeyboardEvent } from 'react'

/**
 * Drag-and-drop reordering for a list, plus Alt+↑/↓ on a focused item for keyboard users.
 * Indices are positions within the rendered list.
 */
export function useDragReorder(count: number, onMove: (from: number, to: number) => void) {
  const [from, setFrom] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)

  const reset = () => {
    setFrom(null)
    setOver(null)
  }

  const itemProps = (i: number) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.effectAllowed = 'move'
      setFrom(i)
    },
    onDragOver: (e: DragEvent) => {
      if (from === null) return
      e.preventDefault()
      setOver(i)
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      if (from !== null && from !== i) onMove(from, i)
      reset()
    },
    onDragEnd: reset,
    onKeyDown: (e: KeyboardEvent) => {
      if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
      e.preventDefault()
      const to = i + (e.key === 'ArrowUp' ? -1 : 1)
      if (to >= 0 && to < count) onMove(i, to)
    }
  })

  return { itemProps, dragging: from, over }
}
