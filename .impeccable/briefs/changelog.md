# Changelog brief

- Scope: the static release history at `/changelog/`.
- Mode: Read.
- Audience: visitors checking what changed in a published Orifude release and
  source readers who need the matching GitHub release.
- Job: make release history easy to scan, then support careful reading of each
  grouped change without leaving the site's established visual identity.
- Shared shell: use the same wordmark header and deep-moss footer as `/`.
  Landing section links continue to target `/#journey` and `/#download`;
  Changelog receives the current-page treatment, and Changelog plus GitHub
  remain available at every supported width.
- Direction: open with one quiet folded introduction on warm paper, then return
  to flat editorial release notes in charcoal and muted moss.
- Desktop reading model: pair a sticky version, date, and GitHub release link
  with grouped changes in the adjacent column. Keep generous separation between
  releases and between change groups.
- Mobile reading model: below 58rem, remove stickiness and place each release
  header directly above its changes in one linear flow. Below 38rem, let the
  introductory fold reach the viewport edges and keep all text horizontal.
- Typography: reuse the three computed sizes and the existing Alegreya,
  Atkinson Hyperlegible Next, and system monospace families. Do not add another
  tier or family for release metadata.
- Content source: render the maintained release data and link each entry to its
  matching GitHub release. Do not invent claims or release details.
