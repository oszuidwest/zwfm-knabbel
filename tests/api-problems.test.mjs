import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let sdk
let api
let format
let userSchema
let matchId

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
  })
  api = await server.ssrLoadModule('/src/lib/api/client.ts')
  sdk = await server.ssrLoadModule('/src/lib/api/generated/sdk.gen.ts')
  format = await server.ssrLoadModule('/src/lib/utils/format.ts')
  ;({ userSchema } = await server.ssrLoadModule('/src/lib/schemas/user.ts'))
  ;({ match: matchId } = await server.ssrLoadModule('/src/params/id.ts'))
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

test('conflict and gone codes use Dutch copy instead of the English detail', async () => {
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
  assert.equal(deleted.message, 'Dit bericht is verwijderd')

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
  assert.equal(err.message, 'Audiobestand: audio is stil of te zacht, controleer het opnameniveau')
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

test('route IDs must be positive integers', () => {
  for (const id of ['1', '42', '9007199254740991']) assert.equal(matchId(id), true, id)
  for (const id of ['0', '-1', '1.5', 'abc', '007', '1e3', '9007199254740992']) {
    assert.equal(matchId(id), false, id)
  }
})

test('plain API dates are local calendar days', () => {
  const date = format.parseDate('2026-10-01')
  assert.deepEqual([date.getFullYear(), date.getMonth(), date.getDate()], [2026, 9, 1])
  assert.equal(date.getHours(), 0)
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
