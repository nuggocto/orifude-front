# Landing page brief

- Scope: the static home page at `/`.
- Mode: persuade.
- Audience: people deciding whether to understand, verify, and download the
  Orifude terminal client during private alpha.
- Job: make the one-to-one letter ritual tangible in the first viewport, prove
  it with the real TUI, and lead to an immutable checksummed `v0.2.0` download.
- Evidence: supplied Orifude artwork, the shipped TUI, the deterministic VHS
  journey, source code, release archives, and SHA-256 checksums.
- Constraints: no browser letter client, runtime API request, analytics,
  invented claim, generic dashboard panel, fake application control, cultural
  authenticity claim, or public-production claim.
- Direction: Simplified folded letter. Two quiet paper forms carry the promise
  and real terminal proof, with the supplied courier resting between them.
  There is no page-wide branch, slogan stack, card grid, glow, or decorative
  technical chrome.
- Shared navigation: the wordmark returns home; landing section links target
  `/#journey` and `/#download`; Changelog and GitHub remain visible when those
  section links leave the header below 58rem. The shared footer closes both
  routes.
- Approved reference: `.impeccable/mocks/folded-branch-approved.png`, simplified
  in response to direct user feedback.
- Memorable moment: the courier carries one folded letter between the human
  promise and the real terminal recording without crossing either one.
- Do not literalize: generated terminal text and verification commands are
  spatial references only. Shipping proof is the real TUI, release facts come
  from validated metadata, and no signature claim may appear.

## Implementation inventory

| Ingredient | Commitment | Medium |
| --- | --- | --- |
| Wordmark | Source wordmark at a calm, readable scale | Existing optimized raster |
| First sentence | Alegreya, high contrast, written as one complete human sentence | Semantic `h1` and CSS |
| Opening topology | One large folded promise and one smaller folded proof sit in an open asymmetric grid | Semantic HTML and CSS grid |
| Courier | One supplied squirrel cutout rests between the sheets without masking copy or controls | Existing optimized transparent raster |
| Branch marks | Only the branch contained in the supplied courier artwork remains | Existing optimized transparent raster |
| Release action | One direct install action on the promise sheet | Semantic anchor and CSS |
| Terminal proof | The real compose, release, claim, unfold, reply, and keepsake journey | Existing VHS WebM, poster, and adjacent transcript |
| Product story | Three editorial beats with distinct scale, not repeated equal cards | Semantic sections and lists |
| Privacy boundary | One folded paper section states service-side decryption honestly; its compact two-column introduction faces inward before the wider fact columns | Semantic HTML and CSS |
| Package-manager proof | Commands sit left of verified installer disclosures on desktop; the package explanation follows those disclosures, and all three groups reflow in semantic order below 58rem | Semantic HTML, native disclosures, and CSS grid |
| Download records | Six platform artifacts and hashes remain scannable without a grid of bordered cards | Semantic groups and code text |

## Sampled visual record

- Page ground: `#F3EFE8`, sampled as the dominant paper field.
- Moss accents: `#5C5C4C` with darker actions near `#4D4D3C`.
- Warm ink: `#31312C`; proof ground: `#393A34`.
- Supporting paper and figure tones: `#CCC6B9`, `#A5A297`, `#8E8777`.
- Typography: Alegreya carries the wordmark-adjacent display voice and actions;
  Atkinson Hyperlegible Next carries body copy; system monospace is restricted
  to commands and checksums.
- Type ramp: display `clamp(2.75rem, 4.6vw, 4.35rem)`, title
  `clamp(1.35rem, 1.8vw, 1.65rem)`, and body `1rem`. Technical text uses
  the body size in monospace. No eyebrow labels or miniature metadata tier.
- Corners: square or lightly irregular printed edges; no rounded card family.
- Lines: ordinary content uses no container borders. A rare 2px ink rule may
  separate tabular release facts; hairline grids are absent.
- Elevation: restrained paper and terminal shadows distinguish the two opening
  sheets; ordinary content stays flat.
