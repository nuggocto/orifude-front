# Orifude website

The static Astro site at [orifude.com](https://orifude.com): a landing page,
installation instructions, release notes, and community puzzle packs for the
[offline terminal game](https://github.com/nuggocto/orifude).

Use Node 24.19.0 and pnpm 11.3.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Check and preview

```sh
pnpm check
pnpm build
pnpm preview
```

Open http://127.0.0.1:4321. The built preview applies the production security
headers. Stop it with Ctrl+C.

For browser tests:

```sh
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm test:browser
```

On Windows, install Chromium and Firefox only. Tests own ports 4331 and 4332.

## Content and publishing

Pages and components live in `src/`; reviewed release and pack records live in
`src/content/`. Import native release notes with:

```sh
pnpm import:changelog ../orifude FULL_COMMIT_SHA
```

Add release records only after verifying the published assets and advertised
package channels. Importing notes alone does not advertise a release.

Cloudflare Pages publishes `shrek` with `pnpm build`, output directory `dist`,
Node 24.19.0, and `PNPM_VERSION=11.3.0`.

See [maintenance notes](docs/maintenance.md) for release verification, artwork,
browser coverage, security policy, and hosting details.
