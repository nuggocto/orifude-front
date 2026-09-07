# Orifude website

The static presentation for [Orifude](https://github.com/nuggocto/orifude), an
offline Rust puzzle for the terminal. Astro builds the landing page, an
installation page at `/install/`, the release changelog, and a real not-found
page. The Install link in the top navigation opens the commands directly.

Use Node 24.19.0 from `.node-version` and pnpm 11.3.0 from `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

For the built site, including its security policy:

```sh
pnpm check
pnpm build
pnpm preview
```

Open `http://127.0.0.1:4321`; stop the preview with Ctrl+C. The preview applies the
security headers before routing so not-found responses receive them too.
The development server needs its own scripts for live updates. Review the built
preview when checking the policy or the page's actual network requests.

## Checks

```sh
pnpm exec playwright install --with-deps chromium firefox webkit
pnpm test:browser
```

The browser tests own ports 4331 and 4332. They test the real static output and
an isolated release fixture. That fixture exercises installation instructions
and HTML escaping without putting invented releases in the public build. Test
servers and temporary content are removed afterward. Tests have bounded timeouts
and no automatic retries. An occupied port fails instead of reusing another server.

The tests cover reading with JavaScript disabled, keyboard navigation, the
not-found response, narrow reflow, enlarged text, reduced motion, missing CSS,
local assets under the security policy, and axe accessibility checks. Automated
checks supplement visual and keyboard review; they do not establish full WCAG
conformance or native Safari and mobile-device support. Clipboard checks paste
each copied command through the browser's native editing action in all three
engines. Chromium receives an explicit write permission in its automated
context; denial and missing-API cases separately check the manual-copy fallback.

`pnpm build` allows only `public/copy-command.js`, loaded on the installation
page with an integrity hash. It rejects other scripts, inline code or styles,
missing pages, and missing public assets. Bundled fonts are limited to 100 KiB,
gzip CSS to 30 KiB, and gzip clipboard JavaScript to 5 KiB. Font files are local,
with their OFL notices in `public/font-licenses.txt`.
The CI workflow runs the locked build and all three browser engines without
deployment credentials.

With the built preview running, `node scripts/measure-browser.mjs` measures five
cold desktop and mobile loads and saves screenshots under `.preview/`. It uses
Chromium with 150 ms network latency, a 1.6 Mbit/s download limit, and fourfold CPU
slowdown. It records FCP, LCP, layout shift, and loaded response-body bytes against
a 500 KiB page budget. These are local lab measurements, not field Core Web Vitals
or a substitute for checking the deployed site.

## Artwork and the paper example

The original PNGs in `src/assets` come from the owner's Orifude artwork collection.
Astro generates responsive WebP files during the build. The four SVG drawings in
`src/components/FoldSequence.astro` explain the native first lesson: fold the left
half of a four-by-four paper to the right, ink both layers once, then open the
paper and match the target. They do not run the puzzle engine.

`src/content/journey.cast` is the native repository's reviewed recording at
[`a14d4c9`](https://github.com/nuggocto/orifude/commit/a14d4c94a86e44b84d7ddbe7b43eaf31c8dc638e).
The terminal still preserves its ink frame. `node scripts/prepare-artwork.mjs`
regenerates that still, the icons, social image, and font notices. It is a manual
asset task that uses JetBrainsMono Nerd Font installed on the author's machine;
ordinary site builds use the checked-in assets and need no system font.

## Publishing release notes

The reviewed release list controls the public version, changelog entries, and
installation instructions. An empty list shows source and development links
without download or package commands.

`src/content/changelog.md` is an exact snapshot of the canonical main-repository
changelog. `src/content/releases.json` records its immutable source commit and
SHA-256. Import a later snapshot explicitly:

```sh
pnpm import:changelog ../orifude FULL_COMMIT_SHA
```

After the native release has been published and verified, add a reviewed record
to `releases.json`. Each record needs a numeric semantic `version`, publication
`date`, immutable `tagCommit`, `verifiedAt` date, and the verified `channels`.
Channel values are `posix`, `powershell`, `homebrew`, `scoop`, and `aur`. An empty
channel list permits direct release archives without claiming package support.

The matching changelog section must start with `## X.Y.Z - YYYY-MM-DD`, followed
by a short summary and at least one bullet under `### Added`, `### Changed`,
`### Fixed`, or `### Security`. Bracketed versions are also accepted. Indented
continuations join their preceding bullet. Notes render as escaped plain text;
HTML and Markdown links do not become executable markup or unchecked URLs.

The native release operator must verify the immutable GitHub release, its tag
commit, the complete archive and installer set, and each advertised package
channel before adding that record. The record is a maintainer's attestation;
the offline frontend build checks its shape and source hash, not remote release
existence. Preserve the native workflow evidence with the release review.
Package instructions on `/install/` are shown only for the latest release and
its reviewed channels. Arch Linux uses `yay -S orifude-bin` with yay already
installed. Source, release, and installer URLs are derived from the fixed GitHub
repository and the validated version. Installer downloads and execution remain
separate commands so the downloaded file can be inspected first.

Each command has an optional Copy button. The script writes the visible command
only after a click or keyboard activation. It never reads the clipboard or
makes a network request. Success and failure are announced beside the button;
without JavaScript or the Clipboard API, commands remain selectable text.

Run the full checks and inspect all pages before publishing a content update.
Importing notes alone never adds a public release.

## Cloudflare Pages

This repository targets Cloudflare Pages with Git integration. Expected settings:

| Setting | Value |
| --- | --- |
| Production branch | `shrek` |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node version | `24.19.0` |
| pnpm version | `11.3.0` |
| Canonical domain | `orifude.com` |

Set `PNPM_VERSION=11.3.0` for both production and previews; `.node-version` selects
Node. Cloudflare documents these overrides in its
[build-image reference](https://developers.cloudflare.com/pages/configuration/build-image/).

`scripts/security.mjs` generates `dist/_headers` and supplies the same security
policy to the local preview. The only script allowed by CSP is the exact SHA-256
of the clipboard helper. Other scripts, frames, network connections, and
external fonts are blocked. The Pages host patterns add `noindex` to preview hosts.
Canonical metadata and the sitemap use `https://orifude.com`.

Git integration builds preview branches and publishes `shrek` to production.
Verify a Pages preview first, then the production routes, headers, artwork,
and links. The owner chose the apex domain for publication and waived the `www`
redirect on 2026-09-07. Check that an unknown URL returns HTTP 404 and retains
the restrictive CSP. Cloudflare currently injects a bot-detection script on 404
responses; the script hash restriction blocks it. Removing the injection requires zone
permissions unavailable to the configured Pages credential. This accepted
hosting limitation must not be worked around by allowing Cloudflare's script
or all same-origin scripts.

## Puzzle packs

The landing page's `#puzzle-packs` section explains authoring, pull requests,
isolated validation, maintainer review, and local installation. Pack releases
have their own versions; they do not change the native game's release catalog.

After public publication and verification, append the release's `pack.json`
record to `src/content/packs.json`, adding the immutable `sourceCommit` and real
`verifiedAt` date. Verify the downloaded ZIP, SHA256SUMS, GitHub attestation,
and local installation first. Keep the evidence in the native repository's
NOTEBOOK. The static loader validates these reviewed records and derives every
link from the fixed repository, pack ID, and version. It makes no build-time or
browser network requests. An empty catalog shows submission instructions without
invented downloads. Run data, build, browser, preview, and production checks for
catalog updates too.
