// Run: node src/renderer/src/utils/queue.test.ts
import assert from 'node:assert/strict'
import { keyOf, moveItem, shuffled } from './queue.ts'

const items = Array.from({ length: 20 }, (_, i) => i)

for (let run = 0; run < 200; run++) {
  const s = shuffled(items, 0)
  assert.deepEqual([...s].sort((a, b) => a - b), items, 'shuffle keeps every item exactly once')
  assert.notEqual(s[0], 0, 'avoided item is never first')
}
assert.deepEqual(items, Array.from({ length: 20 }, (_, i) => i), 'input array untouched')
assert.deepEqual(shuffled([7], 7), [7], 'single item cannot be avoided')
assert.notDeepEqual(shuffled(items), items) // 1 in 20! chance of a false failure

assert.deepEqual(moveItem(['a', 'b', 'c', 'd'], 0, 2), ['b', 'c', 'a', 'd'])
assert.deepEqual(moveItem(['a', 'b', 'c', 'd'], 3, 1), ['a', 'd', 'b', 'c'])
assert.deepEqual(moveItem(['a', 'b'], 0, 5), ['a', 'b'], 'out of range is a no-op')

const x = {}
const y = {}
assert.equal(keyOf(x), keyOf(x))
assert.notEqual(keyOf(x), keyOf(y))

console.log('queue.test: ok')
