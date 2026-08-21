import { ApiError } from './client'
import { getBulletinJobsId, postStationsIdBulletins } from './generated/sdk.gen'
import type { GetBulletinsData } from './generated/types.gen'

export type BulletinFilters = NonNullable<GetBulletinsData['query']>

const JOB_POLL_INTERVAL_MS = 1_000

export async function generateBulletin(stationId: number, signal?: AbortSignal): Promise<number> {
  let job = await postStationsIdBulletins({ path: { id: stationId }, signal })

  while (job.status === 'queued' || job.status === 'running') {
    await new Promise(resolve => setTimeout(resolve, JOB_POLL_INTERVAL_MS))
    signal?.throwIfAborted()
    job = await getBulletinJobsId({ path: { id: job.id }, signal })
  }

  if (job.status === 'failed') {
    throw new ApiError(0, job.error_detail ?? 'Bulletin genereren mislukt')
  }

  if (job.bulletin_id === null) {
    throw new ApiError(0, 'Gegenereerd bulletin is niet meer beschikbaar')
  }

  return job.bulletin_id
}
