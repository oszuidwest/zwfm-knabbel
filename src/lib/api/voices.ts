import type { PostVoicesData } from './generated/types.gen'
import type { VoiceFormData } from '$lib/schemas/voice'

export type VoiceCreateInput = PostVoicesData['body']

// toVoiceApiFormat keeps the empty-string-means-unlinked UI state at the API boundary.
export const toVoiceApiFormat = (data: VoiceFormData): VoiceCreateInput => ({
  name: data.name,
  elevenlabs_voice_id: data.elevenlabs_voice_id || null,
})
