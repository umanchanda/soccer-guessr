import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mergeTransfer } from '../../src/transfer.js'

test('handed-over scores fill gaps but never replace what is stored', () => {
  const stored = { results: { 1: { earned: 5, available: 30 } }, progress: { 4: { step: 1, guesses: {}, results: [] } } }
  const data = {
    'soccer-guessr:results': { 1: { earned: 30, available: 30 }, 2: { earned: 10, available: 30, steps: [10] }, 3: { earned: 40, available: 30 }, x: { earned: 1, available: 2 } },
    'soccer-guessr:progress': { 2: { step: 1, guesses: {}, results: [] }, 4: { step: 3, guesses: {}, results: [] }, 5: { step: 2, guesses: { teams: 'a' }, results: [{ points: 1 }] }, 6: { step: 'x' } },
  }
  assert.deepEqual(mergeTransfer(data, stored), {
    results: { 1: { earned: 5, available: 30 }, 2: { earned: 10, available: 30, steps: [10] } },
    progress: { 4: { step: 1, guesses: {}, results: [] }, 5: { step: 2, guesses: { teams: 'a' }, results: [{ points: 1 }] } },
  })
  assert.deepEqual(mergeTransfer({ 'soccer-guessr:results': 'junk' }, { results: {}, progress: {} }), { results: {}, progress: {} })
})
