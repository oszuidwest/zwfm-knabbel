import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let assessRestore
let formatWeekdays

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
  })
  ;({ assessRestore } = await server.ssrLoadModule('/src/lib/utils/story-restore.ts'))
  ;({ formatWeekdays } = await server.ssrLoadModule('/src/lib/utils/labels.ts'))
})

after(async () => {
  await server?.close()
})

// Sunday 11 October 2026.
const today = '2026-10-11'
const MONDAY = 2
const SUNDAY = 1

function story(overrides = {}) {
  return {
    status: 'active',
    start_date: '2026-10-01',
    end_date: '2026-10-20',
    weekdays: 127,
    audio_file: 'story_1.wav',
    ...overrides,
  }
}

test('an active story with audio and a running period goes on air at once', () => {
  const result = assessRestore(story(), today)
  assert.equal(result.suggestion, 'draft')
  assert.equal(result.notice.tone, 'warning')
  assert.match(result.notice.message, /direct na herstellen/)
})

test('an active story names the first day it can go on air', () => {
  const result = assessRestore(story({ weekdays: MONDAY }), today)
  assert.equal(result.suggestion, 'draft')
  assert.match(result.notice.message, /vanaf maandag 12 oktober/)

  const future = assessRestore(story({ start_date: '2026-10-29', end_date: '2026-10-30' }), today)
  assert.equal(future.suggestion, 'draft')
  assert.match(future.notice.message, /vanaf donderdag 29 oktober/)

  // The search crosses the end of summer time (25 October).
  const acrossDst = assessRestore(
    story({ start_date: '2026-10-24', end_date: '2026-10-30', weekdays: MONDAY }),
    today
  )
  assert.match(acrossDst.notice.message, /vanaf maandag 26 oktober/)
})

test('an active story whose weekdays never fall in the period is not eligible', () => {
  const result = assessRestore(
    story({ start_date: '2026-10-12', end_date: '2026-10-13', weekdays: SUNDAY }),
    today
  )
  assert.deepEqual(result, { suggestion: null })
  assert.deepEqual(assessRestore(story({ weekdays: 0 }), today), { suggestion: null })
})

test('an active story without audio only gets an info notice', () => {
  const result = assessRestore(story({ audio_file: '' }), today)
  assert.equal(result.suggestion, null)
  assert.equal(result.notice.tone, 'info')
  assert.match(result.notice.message, /geen audio/)
})

test('a past period or expired status asks to edit the planning', () => {
  const ended = assessRestore(story({ end_date: '2026-10-10' }), today)
  assert.equal(ended.suggestion, 'edit')
  assert.match(ended.notice.message, /voorbij \(laatste dag 10-10-2026\)/)

  const expired = assessRestore(story({ status: 'expired' }), today)
  assert.equal(expired.suggestion, 'edit')
  assert.match(expired.notice.message, /verlopen/)

  const draftEnded = assessRestore(story({ status: 'draft', end_date: '2026-09-25' }), today)
  assert.equal(draftEnded.suggestion, 'edit')
})

test('the last day of the period still counts as running', () => {
  const result = assessRestore(story({ end_date: today }), today)
  assert.equal(result.suggestion, 'draft')
})

test('a draft is safe to restore', () => {
  const result = assessRestore(story({ status: 'draft' }), today)
  assert.equal(result.suggestion, null)
  assert.equal(result.notice.tone, 'info')
})

test('formatWeekdays lists days from Monday', () => {
  assert.equal(formatWeekdays(127), 'Elke dag')
  assert.equal(formatWeekdays(62), 'Ma, Di, Wo, Do, Vr')
  assert.equal(formatWeekdays(SUNDAY | MONDAY), 'Ma, Zo')
  assert.equal(formatWeekdays(0), 'Geen dagen')
})
