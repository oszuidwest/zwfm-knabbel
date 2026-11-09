import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let withSearchParams

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null, ws: false },
    appType: 'custom',
  })
  ;({ withSearchParams } = await server.ssrLoadModule('/src/lib/utils/routes.ts'))
})

after(async () => {
  await server?.close()
})

test('search param updates keep other params and the hash, and leave the input alone', () => {
  const url = new URL('https://example.test/stories?page=3&q=oud&date=today#lijst')
  const next = withSearchParams(url, { page: '', date: 'tomorrow', audio: 'with' })

  assert.equal(next.href, 'https://example.test/stories?q=oud&date=tomorrow&audio=with#lijst')
  assert.equal(url.href, 'https://example.test/stories?page=3&q=oud&date=today#lijst')
})
