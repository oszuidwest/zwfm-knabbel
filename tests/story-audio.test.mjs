import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let render
let EditorPage
let NewStory
let StoryEditForm

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null, ws: false },
    appType: 'custom',
  })
  ;({ render } = await server.ssrLoadModule('svelte/server'))
  ;({ default: EditorPage } = await server.ssrLoadModule('/tests/fixtures/EditorPage.svelte'))
  ;({ default: NewStory } = await server.ssrLoadModule('/src/routes/stories/new/+page.svelte'))
  ;({ default: StoryEditForm } = await server.ssrLoadModule(
    '/src/routes/stories/[id=id]/edit/StoryEditForm.svelte'
  ))
})

after(async () => {
  await server?.close()
})

const voices = [{ id: 3, name: 'Anna' }]
const noVoiceHint = 'Kies eerst de stem die in de opname te horen is.'

function renderPage(page, data) {
  const html = render(EditorPage, { props: { page, data } }).body
  return { html, fileInput: html.match(/<input id="audio"[^>]*>/)[0] }
}

function editData(story) {
  return {
    story: {
      id: 1,
      title: 'Titel',
      text: 'Tekst',
      status: 'draft',
      start_date: '2026-11-01',
      end_date: '2026-11-30',
      weekdays: 127,
      ...story,
    },
    voices,
    bulletins: [],
    bulletinsTotal: 0,
    bulletinsPageSize: 20,
  }
}

test('a new story offers no audio upload before a voice is chosen', () => {
  const { html, fileInput } = renderPage(NewStory, { voices })
  assert.match(fileInput, /disabled/)
  assert.ok(html.includes(noVoiceHint))
})

test('editing a story blocks a new upload until it has a voice, and keeps its audio playable', () => {
  const withoutVoice = renderPage(
    StoryEditForm,
    editData({ voice_id: null, audio_file: 'story_1.wav', audio_url: '/stories/1/audio' })
  )
  assert.match(withoutVoice.fileInput, /disabled/)
  assert.ok(withoutVoice.html.includes(noVoiceHint))
  assert.match(withoutVoice.html, /<audio controls[^>]*src="[^"]*\/stories\/1\/audio"/)

  const withVoice = renderPage(StoryEditForm, editData({ voice_id: 3 }))
  assert.doesNotMatch(withVoice.fileInput, /disabled/)
  assert.ok(!withVoice.html.includes(noVoiceHint))
})
