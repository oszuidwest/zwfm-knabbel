import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@hey-api/openapi-ts'
import { format, resolveConfig } from 'prettier'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const generatedDirectory = join(projectRoot, 'src/lib/api/generated')
const schemaUrl = 'https://raw.githubusercontent.com/oszuidwest/zwfm-babbel/main/openapi.yaml'

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)))
    } else {
      files.push(path)
    }
  }

  return files.sort()
}

async function formatGeneratedFiles(directory) {
  const config = (await resolveConfig(join(projectRoot, 'package.json'))) ?? {}

  for (const path of await listFiles(directory)) {
    const source = await readFile(path, 'utf8')
    await writeFile(path, await format(source, { ...config, filepath: path }))
  }
}

async function generateTypes(directory) {
  await rm(directory, { recursive: true, force: true })
  await createClient({
    input: schemaUrl,
    output: { path: directory },
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
  await formatGeneratedFiles(directory)
}

async function assertDirectoriesMatch(expectedDirectory, actualDirectory) {
  const expectedFiles = (await listFiles(expectedDirectory)).map(path =>
    relative(expectedDirectory, path)
  )
  const actualFiles = (await listFiles(actualDirectory)).map(path =>
    relative(actualDirectory, path)
  )

  if (expectedFiles.join('\n') !== actualFiles.join('\n')) {
    throw new Error('Generated API file list is out of sync. Run: npm run types:generate')
  }

  for (const file of expectedFiles) {
    const expected = await readFile(join(expectedDirectory, file), 'utf8')
    const actual = await readFile(join(actualDirectory, file), 'utf8')
    if (expected !== actual) {
      throw new Error(`Generated API code is out of sync in ${file}. Run: npm run types:generate`)
    }
  }
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
    await assertDirectoriesMatch(generatedDirectory, temporaryDirectory)
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true })
  }
} else {
  throw new Error('Usage: node scripts/api-types.mjs <generate|check>')
}
