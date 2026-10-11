import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let formatDuration
let formatRelativeTime
let parseDate

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null, ws: false },
    appType: 'custom',
  })
  ;({ formatDuration, formatRelativeTime, parseDate } = await server.ssrLoadModule(
    '/src/lib/utils/format.ts'
  ))
})

after(async () => {
  await server?.close()
})

test('duration rounding carries seconds into the next minute', () => {
  for (const [seconds, expected] of [
    [0, '0:00'],
    [59.4, '0:59'],
    [59.5, '1:00'],
    [60, '1:00'],
    [119.9, '2:00'],
    [null, '-'],
    [undefined, '-'],
  ]) {
    assert.equal(formatDuration(seconds), expected)
  }
})

test('relative time reads "zojuist" for the last minute', t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-11T20:55:37Z').getTime() })
  assert.equal(formatRelativeTime('2026-10-11T22:55:14+02:00'), 'zojuist')
  assert.equal(formatRelativeTime('2026-10-11T22:54:07+02:00'), '1 minuut geleden')
})

test('plain API dates are local calendar days', () => {
  const date = parseDate('2026-10-01')
  assert.deepEqual([date.getFullYear(), date.getMonth(), date.getDate()], [2026, 9, 1])
  assert.equal(date.getHours(), 0)
})
