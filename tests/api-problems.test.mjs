import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let sdk
let api
let userSchema
let matchId

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null, ws: false },
    appType: 'custom',
  })
  api = await server.ssrLoadModule('/src/lib/api/client.ts')
  sdk = await server.ssrLoadModule('/src/lib/api/generated/sdk.gen.ts')
  ;({ userSchema } = await server.ssrLoadModule('/src/lib/schemas/user.ts'))
  const { params } = await server.ssrLoadModule('/src/params.ts')
  matchId = id => !('issues' in params.id['~standard'].validate(id))
  const { client } = await server.ssrLoadModule('/src/lib/api/generated/client.gen.ts')
  client.setConfig({ baseUrl: 'https://api.example.test' })
})

after(async () => {
  await server?.close()
})

function problem(status, body) {
  return async () =>
    new Response(JSON.stringify({ status, ...body }), {
      status,
      headers: { 'Content-Type': 'application/problem+json' },
    })
}

const rejection = promise =>
  promise.then(
    () => assert.fail('expected the request to fail'),
    err => err
  )

test('422 field errors become Dutch inline messages and a toast', async () => {
  const err = await rejection(
    sdk.postStories({
      body: {},
      fetch: problem(422, {
        type: 'https://babbel.api/problems/validation-error',
        detail: 'The request contains invalid data',
        errors: [
          {
            field: 'end_date',
            code: 'date_order',
            message: 'end_date cannot be before start_date',
          },
          { field: 'voice_id', code: 'not_found', message: 'no resource with id 999' },
        ],
      }),
    })
  )

  assert.ok(err instanceof api.ApiError)
  assert.equal(err.status, 422)
  assert.equal(err.message, 'Einddatum ligt voor de startdatum')
  assert.deepEqual(api.getFieldErrors(err), {
    end_date: 'Einddatum ligt voor de startdatum',
    voice_id: 'Bestaat niet (meer)',
  })
})

test('date_order reads correctly on start_date too', async () => {
  const err = await rejection(
    sdk.putStoriesId({
      path: { id: 1 },
      body: { start_date: '2026-12-01' },
      fetch: problem(422, {
        errors: [
          { field: 'start_date', code: 'date_order', message: 'end_date before start_date' },
        ],
      }),
    })
  )
  assert.equal(err.message, 'Einddatum ligt voor de startdatum')
  assert.deepEqual(api.getFieldErrors(err), { start_date: 'Einddatum ligt voor de startdatum' })
})

test('conflict, gone and not-found codes use Dutch copy instead of the English detail', async () => {
  const lastAdmin = await rejection(
    sdk.deleteUsersId({
      path: { id: 1 },
      fetch: problem(409, { code: 'user.last_admin', detail: 'Cannot delete the last admin user' }),
    })
  )
  assert.match(lastAdmin.message, /laatste beheerder/)

  const duplicate = await rejection(
    sdk.postStations({
      body: { name: 'Test FM', max_stories_per_block: 5 },
      fetch: problem(409, { code: 'station.duplicate', detail: "Station 'Test FM' exists" }),
    })
  )
  assert.equal(duplicate.message, 'Bestaat al')

  const deleted = await rejection(
    sdk.putStoriesId({
      path: { id: 1 },
      body: { title: 'x' },
      fetch: problem(410, { code: 'story.deleted', deleted_at: '2026-10-11T17:06:13+02:00' }),
    })
  )
  assert.equal(deleted.message, 'Dit bericht staat in de prullenbak, herstel het daar eerst')

  const missing = await rejection(
    sdk.patchStoriesId({
      path: { id: 1 },
      body: { deleted_at: '' },
      fetch: problem(404, { code: 'story.not_found', detail: 'Story with id 1 not found' }),
    })
  )
  assert.equal(missing.message, 'Bestaat niet (meer)')

  const rejectedKey = await rejection(
    sdk.postStoriesIdTts({
      path: { id: 1 },
      fetch: problem(503, {
        code: 'tts.upstream_failed',
        detail: 'TTS upstream ElevenLabs failed',
      }),
    })
  )
  assert.match(rejectedKey.message, /API-sleutel/)
})

test('silent story audio keeps its reason', async () => {
  const err = await rejection(
    sdk.postStoriesIdAudio({
      path: { id: 1 },
      body: { audio: new Blob(['x'], { type: 'audio/wav' }) },
      fetch: problem(422, {
        errors: [{ field: 'audio', code: 'silent_audio', message: 'audio is silent' }],
      }),
    })
  )
  assert.equal(err.message, 'Audiobestand: stil of te zacht, controleer het opnameniveau')
})

test('unknown problems fall back to the server detail', async () => {
  const err = await rejection(
    sdk.getStations({ fetch: problem(500, { detail: 'database exploded' }) })
  )
  assert.equal(err.message, 'database exploded')
  assert.deepEqual(api.getFieldErrors(err), {})
})

test('connection failures get Dutch copy', async () => {
  const err = await rejection(
    sdk.getStations({
      fetch: async () => {
        throw new TypeError('fetch failed')
      },
    })
  )
  assert.equal(err.status, 0)
  assert.equal(err.message, 'Geen verbinding met de server')
})

test('a 401 on a write sends the editor to the login page once, without a toast', async t => {
  const { toast } = await server.ssrLoadModule('/src/lib/stores/toast.ts')
  const toastError = t.mock.method(toast, 'error')
  let leave
  const handler = t.mock.fn(() => new Promise(resolve => (leave = resolve)))
  api.onSessionExpired(handler)
  const save = () =>
    rejection(
      sdk.putStoriesId({
        path: { id: 1 },
        body: { title: 'x' },
        fetch: problem(401, { detail: 'Invalid session' }),
      })
    )

  const [err] = await Promise.all([save(), save()])
  api.notifyMutationError(err, 'Opslaan mislukt')
  assert.equal(err.message, 'Je sessie is verlopen')
  assert.equal(toastError.mock.callCount(), 0)
  assert.equal(handler.mock.callCount(), 1)

  leave()
  await rejection(sdk.deleteStoriesId({ path: { id: 1 }, fetch: problem(401, {}) }))
  assert.equal(handler.mock.callCount(), 2)
  leave()
})

test('a failed move to the login page is logged, not left unhandled', async t => {
  const logged = t.mock.method(console, 'error', () => {})
  api.onSessionExpired(() => Promise.reject(new Error('navigation failed')))
  await rejection(sdk.deleteStoriesId({ path: { id: 1 }, fetch: problem(401, {}) }))
  await new Promise(resolve => setTimeout(resolve))
  assert.equal(logged.mock.callCount(), 1)
})

test('a 401 on a read or a login attempt, a 403 and a 500 keep the session', async t => {
  const handler = t.mock.fn(async () => {})
  api.onSessionExpired(handler)

  await rejection(sdk.getStations({ fetch: problem(401, {}) }))
  await rejection(
    sdk.postSessions({ body: { username: 'a', password: 'b' }, fetch: problem(401, {}) })
  )
  for (const status of [403, 500]) {
    await rejection(sdk.deleteStoriesId({ path: { id: 1 }, fetch: problem(status, {}) }))
  }
  assert.equal(handler.mock.callCount(), 0)
})

test('route IDs must be positive integers', () => {
  for (const id of ['1', '42', '9007199254740991']) assert.equal(matchId(id), true, id)
  for (const id of ['0', '-1', '1.5', 'abc', '007', '1e3', '9007199254740992']) {
    assert.equal(matchId(id), false, id)
  }
})

test('password length follows Babbel: 8 code points minimum, 72 UTF-8 bytes maximum', () => {
  const valid = password =>
    userSchema.safeParse({
      username: 'editor1',
      full_name: 'Ed',
      email: '',
      password,
      confirmPassword: password,
      role: 'editor',
    }).success

  assert.equal(valid('😀'.repeat(4)), false)
  assert.equal(valid('😀'.repeat(8)), true)
  assert.equal(valid('é'.repeat(36)), true)
  assert.equal(valid('é'.repeat(37)), false)
})
