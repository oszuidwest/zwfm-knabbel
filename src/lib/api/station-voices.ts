import { ApiError } from './client'
import { postStationVoices } from './generated/sdk.gen'
import type { PostStationVoicesData } from './generated/types.gen'

export type StationVoiceInput = PostStationVoicesData['body']

// The spec leaves id optional on the creation response; narrow it once here.
export async function createStationVoice(data: StationVoiceInput) {
  const response = await postStationVoices({ body: data })
  if (typeof response.id !== 'number') {
    throw new ApiError(0, 'Invalid station-voice response')
  }
  return { ...response, id: response.id }
}
