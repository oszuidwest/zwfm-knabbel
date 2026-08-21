import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@hey-api/openapi-ts'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const generatedDirectory = join(projectRoot, 'src/lib/api/generated')
const schemaUrl = 'https://raw.githubusercontent.com/oszuidwest/zwfm-babbel/main/openapi.yaml'

async function generateTypes(directory) {
  await rm(directory, { recursive: true, force: true })
  await createClient({
    input: schemaUrl,
    output: { path: directory, postProcess: ['prettier'] },
    plugins: [
      {
        name: '@hey-api/typescript',
        definitions: { case: 'preserve' },
      },
      {
        name: '@hey-api/client-fetch',
        runtimeConfigPath: './src/lib/api/client-config.ts',
        throwOnError: true,
      },
      {
        name: '@hey-api/sdk',
        auth: false,
        paramsStructure: 'grouped',
        responseStyle: 'data',
      },
    ],
  })
}

const command = process.argv[2]

if (command === 'generate') {
  await generateTypes(generatedDirectory)
} else if (command === 'check') {
  // Keep the temporary output beside the real output so generated imports to
  // client-config.ts have the same relative path in both directories.
  const temporaryDirectory = await mkdtemp(join(dirname(generatedDirectory), '.api-check-'))
  try {
    await generateTypes(temporaryDirectory)
    try {
      execFileSync('git', ['diff', '--no-index', '--quiet', generatedDirectory, temporaryDirectory])
    } catch {
      throw new Error('Generated API code is out of sync. Run: npm run types:generate')
    }
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
} else {
  throw new Error('Usage: node scripts/api-types.mjs <generate|check>')
}
