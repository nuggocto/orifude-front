# Website maintenance

See the [README](../README.md) for setup, checks, and Cloudflare build settings.

## Browser checks

Tests own ports 4331 and 4332 and exercise the built site plus an isolated release
fixture. Global setup owns both servers and removes the fixture on success or
failure. An occupied port fails instead of reusing an existing server. Tests have
bounded timeouts and no automatic retries.

Linux CI runs Chromium, Firefox, and WebKit. Windows runs Chromium and Firefox.
Windows WebKit's headless clipboard and default link-focus behavior do not support
this test suite. Linux WebKit runs every assertion, including native paste and
keyboard navigation; it does not establish native Safari compatibility.

Coverage includes reading without JavaScript or CSS, keyboard navigation, 404s,
narrow reflow, enlarged text, reduced motion, local assets, and axe accessibility
checks. These supplement visual review; they do not establish full WCAG conformance
or mobile-device support. Clipboard tests paste the copied text through native
browser editing. Separate denial and missing-API cases check manual copying.

Windows PowerShell 5.1 tests execute the generated launcher with a local transfer
fixture. POSIX tests execute their copied block too. They check complete transfers,
script failures, and cleanup without installing the game. The native repository
checks the real installers, archives, saved PATH, and packaged player journeys.

CI uses no deployment credentials. README and maintenance-only edits skip CI;
manual dispatch remains available. Source, assets, release records, configuration,
and workflow changes run the full checks.

## Static output and artwork

The build allows only `public/copy-command.js`, loaded on `/install/` with an
integrity hash. It rejects other scripts, inline code and styles, missing pages,
and missing assets. Limits are 100 KiB for local fonts, 30 KiB for gzip CSS, and
5 KiB for gzip clipboard JavaScript. Font notices live in `public/font-licenses.txt`.
The clipboard helper writes only the visible command after user activation; it
never reads the clipboard or makes network requests.

Original artwork lives in `src/assets`; Astro generates responsive WebP files.
The SVGs in `FoldSequence.astro` explain the native first lesson and do not run
the puzzle engine. `src/content/journey.cast` comes from native commit
[`a14d4c9`](https://github.com/nuggocto/orifude/commit/a14d4c94a86e44b84d7ddbe7b43eaf31c8dc638e).
Run `node scripts/prepare-artwork.mjs` to regenerate the terminal still, icons,
social image, and font notices. That manual task needs JetBrainsMono Nerd Font;
ordinary builds use checked-in assets and need no system font.

With the built preview running, `node scripts/measure-browser.mjs` saves screenshots
and five cold desktop/mobile measurements under `.preview/`. It uses Chromium,
150 ms latency, 1.6 Mbit/s downloads, and fourfold CPU slowdown. It records FCP,
LCP, layout shift, and loaded response bytes against a 500 KiB page budget. These
are local lab measurements, not field results or deployed-site verification.

## Release records

`src/content/changelog.md` is an exact snapshot of the native changelog.
`src/content/releases.json` pins its source commit and SHA-256. Preserve LF bytes
on Windows; do not normalize the snapshot or change its hash to match converted
line endings. Import a snapshot with the command in the README.

After publication and verification, add a record with numeric semantic `version`,
publication `date`, immutable `tagCommit`, `verifiedAt`, and verified `channels`.
Channels are `posix`, `powershell`, `homebrew`, `scoop`, and `aur`. PowerShell also
requires `powershellSha256`, checked against the immutable install.ps1 asset and
its attestation. The page displays that hash under optional download verification.

The native operator must verify the release, tag, complete archive and installer
set, and each advertised package channel first. Keep the evidence in the native
NOTEBOOK. The offline frontend build validates record shape and the source hash;
it does not check remote release existence. An empty list shows development links.
An empty channel list offers archives without claiming installer or package support.
Only the latest release's reviewed channels appear on the installation page.

Each matching changelog section starts with `## X.Y.Z - YYYY-MM-DD` (bracketed
versions also work), a short summary, and at least one bullet under `### Added`,
`### Changed`, `### Fixed`, or `### Security`. Indented lines continue a bullet.
Notes render as escaped plain text; avoid inline Markdown formatting and links.

Both launchers finish a bounded HTTPS download into a private directory before
running the exact release script, then clean up. They trust the immutable GitHub
release as the bootstrap source. Archive checks remain in the installers. The
page links separate inspection and attestation instructions. Windows saves user
PATH; POSIX leaves shell profiles unchanged. Saved execution policy stays unchanged.

Run data, build, browser, preview, and production checks for release updates.
Importing notes alone never adds a public release.

## Cloudflare Pages

Git integration publishes `shrek` to production and other branches to previews.
Set `PNPM_VERSION=11.3.0` in both environments; `.node-version` selects Node.
See Cloudflare's [build-image reference](https://developers.cloudflare.com/pages/configuration/build-image/).
Canonical metadata and the sitemap use `https://orifude.com`.

`scripts/security.mjs` supplies the preview policy and generates `dist/_headers`.
CSP permits only the clipboard helper's exact hash and blocks other scripts,
frames, network connections, and external fonts. Preview hosts receive `noindex`.
Check routes, headers, artwork, links, and a real HTTP 404 after publication.

The owner accepted the apex domain without a `www` redirect on 2026-09-07.
Cloudflare injects a bot-detection script on 404s, which CSP blocks. Removing it
requires zone permissions unavailable to the Pages credential. Keep that
restriction; do not allow the injected script or all same-origin scripts.

## Puzzle packs

Packs have independent versions. After verifying the published ZIP, SHA256SUMS,
GitHub attestation, and local installation, append the release's `pack.json`
record to `src/content/packs.json` with immutable `sourceCommit` and real
`verifiedAt`. Keep evidence in the native NOTEBOOK and run the release-update
checks above. The loader derives links from the fixed repository, pack ID, and
version without network requests. An empty catalog keeps submission instructions
and offers no downloads. Pack records do not change the native release catalog.
