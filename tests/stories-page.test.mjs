import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let load

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null },
    appType: 'custom',
  })
  ;({ load } = await server.ssrLoadModule('/src/routes/stories/+page.ts'))
  const { client } = await server.ssrLoadModule('/src/lib/api/generated/client.gen.ts')
  client.setConfig({ baseUrl: 'https://api.example.test' })
})

after(async () => {
  await server?.close()
})

async function loadStories(search, respond) {
  let query
  const result = await load({
    url: new URL(`/stories${search}`, 'https://example.test'),
    parent: async () => ({ user: { permissions: { stories: ['read'] } } }),
    fetch: async request => {
      const url = new URL(request.url)
      assert.equal(url.pathname, '/api/v1/stories')
      query = url.searchParams
      return Response.json(respond(query))
    },
  })
  assert.equal(query.get('sort'), '-start_date,-created_at,-id')
  return { ...result, query }
}

test('rescheduling an older draft moves it from a later page alongside matching start dates', async () => {
  const rescheduled = {
    id: 1991,
    start_date: '2026-09-25',
    created_at: '2026-09-25T14:40:50Z',
    status: 'draft',
  }
  const records = [
    ...Array.from({ length: 23 }, (_, index) => ({
      id: 2100 + index,
      start_date: '2026-10-07',
      created_at: '2026-10-07T12:00:00Z',
      status: 'active',
    })),
    rescheduled,
    { id: 2001, start_date: '2026-10-08', created_at: '2026-10-06T12:00:00Z', status: 'draft' },
    { id: 2002, start_date: '2026-10-08', created_at: '2026-10-06T12:00:00Z', status: 'draft' },
  ]

  // Model the API contract at the fetch boundary: sort all records before pagination.
  // The real loader and generated client must send the ordering on every request.
  function respond(query) {
    const fields = (query.get('sort') ?? '-created_at').split(',')
    const sorted = [...records].sort((left, right) => {
      for (const field of fields) {
        const key = field.replace(/^-/, '')
        const comparison = left[key] < right[key] ? -1 : left[key] > right[key] ? 1 : 0
        if (comparison) return field.startsWith('-') ? -comparison : comparison
      }
      return 0
    })
    const offset = Number(query.get('offset'))
    const limit = Number(query.get('limit'))
    return { data: sorted.slice(offset, offset + limit), total: records.length }
  }

  const beforeFirst = await loadStories('', respond)
  const beforeSecond = await loadStories('?page=2', respond)
  assert.ok(!beforeFirst.stories.some(story => story.id === 1991))
  assert.ok(beforeSecond.stories.some(story => story.id === 1991))

  rescheduled.start_date = '2026-10-08'

  const first = await loadStories('', respond)
  const second = await loadStories('?page=2', respond)
  assert.deepEqual(
    first.stories.slice(0, 3).map(story => story.id),
    [2002, 2001, 1991]
  )
  assert.ok(first.stories.slice(0, 3).every(story => story.status === 'draft'))
  assert.equal(first.query.has('filter[status]'), false)
  assert.equal(first.query.get('limit'), '20')
  assert.equal(first.query.get('offset'), '0')
  assert.equal(second.query.get('limit'), '20')
  assert.equal(second.query.get('offset'), '20')
  assert.equal(first.stories.length, 20)
  assert.equal(second.stories.length, 6)
  assert.deepEqual(
    [...first.stories, ...second.stories].map(story => story.id),
    [2002, 2001, 1991, ...Array.from({ length: 23 }, (_, index) => 2122 - index)]
  )
  assert.deepEqual(second.pagination, {
    currentPage: 2,
    totalPages: 2,
    totalItems: 26,
    pageSize: 20,
    hasNextPage: false,
    hasPrevPage: true,
  })
})

test('sorting preserves date, status, audio and search filters on subsequent pages', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 7, 12).getTime() })

  for (const date of ['', 'today', 'tomorrow']) {
    for (const status of ['', 'draft', 'active', 'expired']) {
      for (const audio of ['', 'with', 'without']) {
        const search = new URLSearchParams({ date, status, audio, q: 'oud & nieuw', page: '2' })
        const { query } = await loadStories(`?${search}`, () => ({ data: [], total: 0 }))
        const expected = {
          sort: '-start_date,-created_at,-id',
          limit: '20',
          offset: '20',
          search: 'oud & nieuw',
        }
        if (status) expected['filter[status]'] = status
        if (audio) expected['filter[has_audio]'] = String(audio === 'with')
        if (date) {
          const target = date === 'tomorrow' ? '2026-10-08' : '2026-10-07'
          expected['filter[start_date][lte]'] = target
          expected['filter[end_date][gte]'] = target
          expected['filter[weekdays][band]'] = date === 'tomorrow' ? '16' : '8'
        }
        assert.deepEqual(Object.fromEntries(query), expected)
      }
    }
  }
})
