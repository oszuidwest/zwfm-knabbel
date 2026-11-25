import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let render
let load
let LoginPage

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null, ws: false },
    appType: 'custom',
  })
  ;({ render } = await server.ssrLoadModule('svelte/server'))
  ;({ load } = await server.ssrLoadModule('/src/routes/+page.ts'))
  ;({ default: LoginPage } = await server.ssrLoadModule('/src/routes/login/+page.svelte'))
})

after(async () => {
  await server?.close()
})

async function loginUrl(search) {
  const url = new URL(`https://example.test/${search}`)
  const { location } = await load({ url, parent: async () => ({ user: null }) }).catch(err => err)
  return new URL(location, url)
}

function loginAlert(url) {
  const { body } = render(LoginPage, { context: new Map([['__request__', { page: { url } }]]) })
  return body.match(/role="(\w+)"[^]*?<span>\s*([^<]*?)\s*<\/span>/)?.slice(1)
}

test('a rejected login shows a fixed message, not the text from the link', async () => {
  const url = await loginUrl('?error=Bel+0800-1234')

  assert.equal(url.search, '?failed=1')
  assert.deepEqual(loginAlert(url), [
    'alert',
    'Inloggen is niet gelukt. Probeer het opnieuw of neem contact op met een beheerder.',
  ])
})

test('a visit without a session shows no message', async () => {
  const url = await loginUrl('')

  assert.equal(url.search, '')
  assert.equal(loginAlert(url), undefined)
})

test('an expired session keeps its own message', () => {
  assert.deepEqual(loginAlert(new URL('https://example.test/login?expired=1')), [
    'status',
    'Je sessie is verlopen. Log opnieuw in.',
  ])
})
