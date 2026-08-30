# Orifude landing page

Static public presentation and release distribution for
[Orifude](https://github.com/nuggocto/orifude). The site explains the project,
shows the real terminal client, and links to checksummed builds. It has no
authenticated state and never contacts the post-office API.

## Prerequisites

- Node.js 22.12 or newer
- pnpm 11.3.0

Corepack can activate the pinned package manager:

```sh
corepack enable
corepack prepare pnpm@11.3.0 --activate
```

## Local development

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The development server prints its local URL. The production build is written
to `dist`:

```sh
pnpm check
pnpm preview
```

`pnpm check` verifies formatting, linting, release metadata, Astro templates,
TypeScript, and the production build.

## Configuration

The initial site requires no environment variables. Release metadata is
checked into `src/data/releases.ts` and validated with Zod during the build.
Cloudflare Pages runs `pnpm build` and publishes `dist` without a post-office
secret, database binding, or API token. Its small Pages middleware redirects
`www.orifude.com` to the canonical apex while preserving the path and query.

## Assets

Optimized site assets are derived from the original Orifude artwork without
changing the source files. Their origins and generated recording inputs are
recorded in [`ASSETS.md`](ASSETS.md).
