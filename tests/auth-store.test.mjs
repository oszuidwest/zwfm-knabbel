import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

const user = { id: 1, username: 'jdoe', role: 'admin' }

let server
let createAuthStore
let client

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null, ws: false },
    appType: 'custom',
  })
  ;({ createAuthStore } = await server.ssrLoadModule('/src/lib/stores/auth.svelte.ts'))
  ;({ client } = await server.ssrLoadModule('/src/lib/api/generated/client.gen.ts'))
})

after(async () => {
  await server?.close()
})

function answerCheck(check, logout = new Response(null, { status: 204 })) {
  client.setConfig({
    baseUrl: 'https://api.example.test',
    fetch: async request => (request.method === 'DELETE' ? logout : check),
  })
}

test('a session check stores the new role, and a 401 ends the session', async () => {
  const auth = createAuthStore(user)

  answerCheck(Response.json({ ...user, role: 'editor' }))
  assert.equal(await auth.checkAuth({ force: true }), true)
  assert.equal(auth.user.role, 'editor')

  answerCheck(Response.json({ title: 'Authentication Required' }, { status: 401 }))
  assert.equal(await auth.checkAuth({ force: true }), false)
  assert.equal(auth.user, null)
})

test('a session response from before a logout is ignored', async () => {
  const auth = createAuthStore(user)
  const response = Promise.withResolvers()
  answerCheck(response.promise)

  const check = auth.checkAuth({ force: true })
  await auth.logout()
  response.resolve(Response.json(user))

  assert.equal(await check, false)
  assert.equal(auth.user, null)
})

test('so is the response to a check that started during the logout', async () => {
  const auth = createAuthStore(user)
  const checkResponse = Promise.withResolvers()
  const logoutResponse = Promise.withResolvers()
  answerCheck(checkResponse.promise, logoutResponse.promise)

  const logout = auth.logout()
  const check = auth.checkAuth({ force: true })
  logoutResponse.resolve(new Response(null, { status: 204 }))
  await logout
  checkResponse.resolve(Response.json(user))

  assert.equal(await check, false)
  assert.equal(auth.user, null)
})
