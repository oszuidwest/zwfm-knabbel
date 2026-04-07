# Knabbel

Web frontend for [Babbel](https://github.com/oszuidwest/zwfm-babbel), the radio news bulletin API. This is what newsroom staff interact with to write stories, configure stations, and check on generated bulletins.

<img width="1496" height="1177" alt="Scherm­afbeelding 2026-04-08 om 00 02 59" src="https://github.com/user-attachments/assets/385195d1-2a8e-42ef-90f1-742d186b19fb" />

## What it does

Stories are the main thing. You create them, set a date range and which weekdays they should air, and optionally flag them as breaking. There's a teleprompter-style read mode for newsreaders to use in the studio.

Each station gets its own voice and jingle setup. The mix point (when the newsreader voice starts over the jingle) is configurable per station.

Three user roles: admin, editor, viewer. Login goes through Microsoft Entra ID (OIDC).

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

The app is a SPA, so no server-side rendering. Everything runs client-side.

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

```bash
npm run build
```

This outputs static files to `build/`. You'll need to configure your web server to serve `index.html` for all routes (SPA fallback).

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
