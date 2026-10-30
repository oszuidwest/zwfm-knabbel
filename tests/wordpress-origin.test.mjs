import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let deleteWithConfirm
let origin

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null, ws: false },
    appType: 'custom',
  })
  ;({ deleteWithConfirm } = await server.ssrLoadModule('/src/lib/utils/crud.ts'))
  origin = await server.ssrLoadModule('/src/lib/utils/story-origin.ts')
})

after(async () => {
  await server?.close()
})

test('a delete warning appears below the confirm question, and only when given', async t => {
  const answers = [true, false]
  const confirm = t.mock.fn(() => answers.shift())
  globalThis.confirm = confirm
  t.after(() => delete globalThis.confirm)
  const accepted = t.mock.fn()
  const declined = t.mock.fn()

  await deleteWithConfirm({ name: 'Bericht', warning: 'Komt uit WordPress.', deleteFn: accepted })
  await deleteWithConfirm({ name: 'Bericht', deleteFn: declined })
  assert.deepEqual([accepted.mock.callCount(), declined.mock.callCount()], [1, 0])
  assert.deepEqual(
    confirm.mock.calls.map(call => call.arguments[0]),
    [
      'Weet je zeker dat je "Bericht" wilt verwijderen?\n\nKomt uit WordPress.',
      'Weet je zeker dat je "Bericht" wilt verwijderen?',
    ]
  )
})

test('metadata.wordpress_id marks a WordPress story, external fields do not', () => {
  assert.equal(origin.isFromWordPress({ metadata: { wordpress_id: 1991 } }), true)
  assert.equal(
    origin.isFromWordPress({
      external_id: '1991',
      external_url: 'https://www.zuidwest.nl/?p=1991',
    }),
    false
  )
  assert.equal(origin.isFromWordPress({ metadata: {} }), false)
})

test('only an http(s) external_url becomes a link', () => {
  const href = external_url => origin.externalHref({ external_url })
  assert.equal(href('https://www.zuidwest.nl/?p=1991'), 'https://www.zuidwest.nl/?p=1991')
  assert.equal(href('http://localhost:8080/?p=1'), 'http://localhost:8080/?p=1')
  assert.equal(href('javascript:alert(1)'), undefined)
  assert.equal(href('ftp://www.zuidwest.nl/1991'), undefined)
  assert.equal(href(null), undefined)
})
