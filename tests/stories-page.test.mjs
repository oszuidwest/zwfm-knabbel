import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

const sort = 'start_date:desc,created_at:desc,id:desc'

let server
let load

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null, ws: false },
    appType: 'custom',
  })
  ;({ load } = await server.ssrLoadModule('/src/routes/stories/+page.ts'))
  const { client } = await server.ssrLoadModule('/src/lib/api/generated/client.gen.ts')
  client.setConfig({ baseUrl: 'https://api.example.test' })
})

after(async () => {
  await server?.close()
})

async function storiesQuery(search, total = 100) {
  let query
  await load({
    url: new URL(`https://example.test/stories${search}`),
    parent: async () => ({ user: { permissions: { stories: ['read'] } } }),
    fetch: async request => {
      query = new URL(request.url).searchParams
      return Response.json({ data: [], total })
    },
  })
  return Object.fromEntries(query)
}

test('sorts by broadcast start date and keeps filters and pagination', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 7, 12).getTime() })

  assert.deepEqual(
    await storiesQuery('?page=2&status=draft&audio=with&date=today&q=oud+%26+nieuw'),
    {
      sort,
      limit: '20',
      offset: '20',
      search: 'oud & nieuw',
      'filter[status]': 'draft',
      'filter[has_audio]': 'true',
      'filter[start_date][lte]': '2026-10-07',
      'filter[end_date][gte]': '2026-10-07',
      'filter[weekdays][band]': '8',
    }
  )
})

test('"Alle statussen" sorts without a status filter', async () => {
  assert.deepEqual(await storiesQuery('?status='), { sort, limit: '20', offset: '0' })
})

test('the trash lists deleted stories, most recently deleted first', async () => {
  assert.deepEqual(await storiesQuery('?trashed=only&status=active'), {
    sort: 'deleted_at:desc,id:desc',
    limit: '20',
    offset: '0',
    trashed: 'only',
    'filter[status]': 'active',
  })
})

test('an unknown trashed value lists active stories', async () => {
  assert.deepEqual(await storiesQuery('?trashed=with'), { sort, limit: '20', offset: '0' })
})

test('unknown date filters do not silently filter by today', async () => {
  assert.deepEqual(await storiesQuery('?date=invalid'), { sort, limit: '20', offset: '0' })
})

test('invalid page numbers never reach the API offset', async () => {
  for (const page of ['-1', '0', '1.5', 'Infinity', 'NaN', '9007199254740991']) {
    assert.deepEqual(await storiesQuery(`?page=${page}`), { sort, limit: '20', offset: '0' })
  }
})

test('restoring the last item on a trash page redirects without losing filters', async () => {
  await assert.rejects(
    storiesQuery('?trashed=only&page=2&status=draft&q=oud#lijst', 20),
    err => err.status === 307 && err.location === '/stories?trashed=only&status=draft&q=oud#lijst'
  )
})

test('out-of-range pages redirect to the last remaining page', async () => {
  await assert.rejects(
    storiesQuery('?page=9&trashed=only', 41),
    err => err.status === 307 && err.location === '/stories?page=3&trashed=only'
  )
  await assert.rejects(
    storiesQuery('?page=2&trashed=only', 0),
    err => err.status === 307 && err.location === '/stories?trashed=only'
  )
  assert.equal((await storiesQuery('?trashed=only', 0)).offset, '0')
})
