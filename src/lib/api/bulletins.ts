import { ApiError } from './client'
import { postStationsIdBulletins } from './generated/sdk.gen'
import type { GetBulletinsData } from './generated/types.gen'

export type BulletinFilters = NonNullable<GetBulletinsData['query']>

// The endpoint serves JSON or WAV depending on Accept; force JSON and narrow the union.
export async function generateBulletin(stationId: number) {
  const response = await postStationsIdBulletins({
    path: { id: stationId },
    headers: { Accept: 'application/json' },
  })
  if (response instanceof Blob) {
    throw new ApiError(0, 'Unexpected audio response')
  }
  return response
}
