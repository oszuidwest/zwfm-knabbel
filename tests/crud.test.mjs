import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let deleteWithConfirm

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null, ws: false },
    appType: 'custom',
  })
  ;({ deleteWithConfirm } = await server.ssrLoadModule('/src/lib/utils/crud.ts'))
})

after(async () => {
  await server?.close()
})

test('a delete warning appears below the confirm question', async t => {
  const confirm = t.mock.fn(() => false)
  globalThis.confirm = confirm
  t.after(() => delete globalThis.confirm)

  await deleteWithConfirm({ name: 'Bericht', warning: 'Komt uit WordPress.', deleteFn: () => {} })
  assert.equal(
    confirm.mock.calls[0].arguments[0],
    'Weet je zeker dat je "Bericht" wilt verwijderen?\n\nKomt uit WordPress.'
  )
})
