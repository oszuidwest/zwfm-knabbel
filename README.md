# Knabbel

Web frontend for the [Babbel](https://github.com/oszuidwest/zwfm-babbel) radio news bulletin system. Provides a management interface for news stories, stations, voices, bulletins, and users.

## Overview

Knabbel is a single-page application that connects to the Babbel REST API. Newsroom staff use it to manage the full bulletin workflow: writing stories, assigning voices, and reviewing generated audio.

## Features

### Content Management
- **Story management**: create, edit, and schedule news stories with date ranges and weekday-specific scheduling
- **Breaking news**: flag stories as breaking to prioritize them in bulletin generation
- **Read mode**: full-screen teleprompter view for newsreaders with scroll progress, word count, and estimated reading time
- **Audio upload**: attach audio files to stories via file picker or drag-and-drop

### Station Configuration
- **Multi-station support**: configure voice and jingle settings per station
- **Jingle management**: upload and preview station jingles with drag-and-drop, inline audio playback, and configurable mix points
- **Station-voice linking**: assign voices to stations with per-station settings

### Administration
- **User management**: admin interface for managing users with role-based access (admin, editor, viewer)
- **Bulletin overview**: view generated bulletins with metadata, audio playback, and download
- **Voice management**: create and manage newsreader voices

### Technical Features
- **OIDC authentication**: single sign-on via Microsoft Entra ID (with OAuth2 callback flow)
- **Auto-generated API types**: TypeScript types generated from the Babbel OpenAPI specification
- **Dark/light theme**: automatic theme switching via daisyUI (corporate/business themes)
- **Responsive design**: mobile-friendly layout with collapsible sidebar navigation

## Requirements

- Node.js 18+
- Access to a running [Babbel API](https://github.com/oszuidwest/zwfm-babbel) instance (or use local development defaults)

## Installation

```bash
git clone https://github.com/oszuidwest/zwfm-knabbel.git
cd zwfm-knabbel
npm install
cp .env.example .env
```

## Configuration

Environment variables are set in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_API_URL` | Babbel API base URL (without `/api/v1`) | Empty (uses relative URLs for local dev) |

For production, set `PUBLIC_API_URL` to the full API URL (e.g. `https://babbel-api.zuidwest.cloud`).

## Development

```bash
npm run dev       # Start dev server on port 3000
```

The app runs in SPA mode. All routing is client-side with no server-side rendering.

### Available Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production (static files)
npm run preview          # Preview production build

# Code Quality
npm run check            # Svelte type checking
npm run lint             # ESLint
npm run format           # Prettier (write)
npm run format:check     # Prettier (check only)
npm run check-all        # Run all checks (types + lint + format + API types)

# API Types
npm run types:generate   # Regenerate types from Babbel OpenAPI spec
npm run types:check      # Verify local types match remote spec
```

## Type Generation

TypeScript types are auto-generated from the [Babbel API OpenAPI specification](https://github.com/oszuidwest/zwfm-babbel/blob/main/openapi.yaml) into `src/lib/types/api.ts`. This file should never be edited manually.

After a Babbel API update:

```bash
npm run types:generate
npm run format
```

The `types:check` command verifies that local types are in sync with the remote specification and can be used in CI pipelines.

## Deployment

The build produces static files suitable for any static hosting:

```bash
npm run build
```

Output is in the `build/` directory. Since the app uses SPA mode with a fallback to `index.html`, configure your web server to serve `index.html` for all routes.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [SvelteKit](https://svelte.dev/docs/kit) | Application framework (SPA mode with `adapter-static`) |
| [Svelte 5](https://svelte.dev/) | UI framework with runes (`$state`, `$derived`, `$effect`) |
| [TypeScript](https://www.typescriptlang.org/) | Strict type checking |
| [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS |
| [daisyUI 5](https://daisyui.com/) | Component library (corporate + business themes) |
| [Zod](https://zod.dev/) | Form validation schemas |
| [Lucide](https://lucide.dev/) | Icon library |
| [openapi-typescript](https://openapi-ts.dev/) | API type generation from OpenAPI spec |

## License

GNU Affero General Public License v3.0. See [LICENSE](LICENSE) for details.
