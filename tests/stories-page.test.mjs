import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

const sort = 'start_date:desc,created_at:desc,id:desc'

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

async function storiesQuery(search) {
  let query
  await load({
    url: new URL(`https://example.test/stories${search}`),
    parent: async () => ({ user: { permissions: { stories: ['read'] } } }),
    fetch: async request => {
      query = new URL(request.url).searchParams
      return Response.json({ data: [], total: 0 })
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
