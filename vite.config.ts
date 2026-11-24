import adapter from '@sveltejs/adapter-cloudflare'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      // Cold test runs fail with the adapter's Vite plugin: it re-optimizes dependencies while tests run.
      adapter: process.env.NODE_TEST_CONTEXT ? undefined : adapter({ fallback: 'spa' }),
    }),
  ],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: { port: 3000 },
})
