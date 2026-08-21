import { ApiError } from './client'
import { getBulletinJobsId, getBulletinsId, postStationsIdBulletins } from './generated/sdk.gen'
import type { GetBulletinsData } from './generated/types.gen'

export type BulletinFilters = NonNullable<GetBulletinsData['query']>

const JOB_POLL_INTERVAL_MS = 1_000

function waitForNextPoll(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }

    const timeout = window.setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort)
      resolve()
    }, JOB_POLL_INTERVAL_MS)

    function handleAbort(): void {
      window.clearTimeout(timeout)
      reject(signal?.reason)
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
  })
}

export async function generateBulletin(stationId: number, signal?: AbortSignal) {
  let job = await postStationsIdBulletins({ path: { id: stationId }, signal })

  while (job.status === 'queued' || job.status === 'running') {
    await waitForNextPoll(signal)
    job = await getBulletinJobsId({ path: { id: job.id }, signal })
  }

  if (job.status === 'failed') {
    const detail = job.error_detail ?? 'Bulletin genereren mislukt'
    throw new ApiError(422, detail, {
      status: 422,
      code: job.error_code,
      detail,
    })
  }

  if (job.bulletin_id === null) {
    throw new ApiError(0, 'Gegenereerd bulletin is niet meer beschikbaar')
  }

  return getBulletinsId({ path: { id: job.bulletin_id }, signal })
}
