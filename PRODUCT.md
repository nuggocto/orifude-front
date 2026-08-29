# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro in static-output mode with strict TypeScript, Tailwind CSS 4 through its
Vite plugin, pnpm, Oxlint, Oxfmt, Astro Check, and Zod. Cloudflare Pages serves
the generated `dist` directory. The initial site has no client framework,
authenticated state, analytics, or runtime API dependency.

## Users

The primary visitor is someone deciding whether to download Orifude, a
keyboard-only terminal application for exchanging one private letter and one
optional reply with an unrelated stranger. Source readers and potential
contributors also need direct access to the project repository and an honest
account of its privacy and safety boundaries.

## Product purpose

Orifude creates deliberate, pseudonymous, one-to-one letter exchanges without
turning correspondence into public content. The website explains that promise,
shows the real terminal experience, and distributes verifiable builds. It never
reads, writes, or displays participant letters.

## Positioning

Every released letter goes to one server-selected stranger. There is no public
feed, recipient picker, follower graph, profile search, engagement ranking, or
unrestricted conversation. A recipient may send at most one reply, after which
the exchange becomes a keepsake.

## Operating context

Visitors arrive in a browser, learn how the exchange works, inspect a real TUI
recording, choose a build for Linux, macOS, or Windows, verify its SHA-256
checksum, and install the terminal application. The online post office is still
a private-alpha service during the initial `0.x` releases.

## Capabilities and constraints

- The website is static and has no path to the letter API or database.
- The participant client is the TUI only. The website is never a browser client.
- Release artifacts cover Linux, macOS, and Windows on amd64 and arm64.
- GitHub Releases is the source of immutable archives and checksums.
- Homebrew, Scoop, AUR, POSIX shell, and PowerShell are supported distribution
  paths.
- The initial public release is `v0.2.0`. Version 1.0 remains reserved for the
  complete public-production contract.
- Correspondence is application-encrypted at rest, but Orifude is not
  end-to-end encrypted. The authorized post office can decrypt ordinary
  messages, and operational metadata remains visible to the service.
- Public analytics and external scripts are absent by default.
- Contact mail is `vincent@sshmoi.com`.

## Brand commitments

The product name is `orifude`, with the working tagline "Send a letter into the
quiet and let a stranger find it." The name is coined and must not be presented
as a dictionary Japanese word or a claim of cultural authenticity. Product
language consistently uses branch, fold, release, carry, unfold, reply,
keepsake, and burn. The supplied Orifude logo, icon, wordmark, and monochrome
variants are the source brand assets. The squirrel courier appears only for
meaningful delivery moments.

## Evidence on hand

- Supplied artwork in `/home/nuggocto/Pictures/Orifude`.
- A shipped Bubble Tea TUI in the sibling `orifude` repository.
- Deterministic VHS journeys backed by a disposable PostgreSQL post office and
  synthetic KMS.
- The complete product, privacy, safety, architecture, and release contract in
  the sibling repository's `PROJECT.md`.
- No testimonials, customer logos, usage statistics, benchmarks, or public
  production-service claims exist and none may be invented.

## Product principles

- Keep every exchange private to its two participants rather than building an
  audience around it.
- Show the real product and state its limits plainly.
- Keep the website unable to participate in letter exchange.
- Make every distributed binary independently verifiable before installation.
- Prefer a small static implementation over unnecessary browser machinery.

## Accessibility & inclusion

The site must work with keyboard, screen reader, mouse, and touch input across
mobile and desktop layouts. Meaning cannot depend on color or motion. It must
preserve visible focus, semantic reading order, reduced-motion behavior, text
fallbacks for recorded media, and useful reflow at 200% zoom.
