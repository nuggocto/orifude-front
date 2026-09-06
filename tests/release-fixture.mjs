import { createHash } from 'node:crypto';

// Synthetic release data stays in tests; the public site has no published releases.
export const changelog = `# Changelog

## Unreleased

This is not a published release.

## 1.0.0 - 2026-09-01

The first papers are ready to open.

### Added
- A journey through forty papers.
  Every paper can be replayed.

### Fixed
- Opening a saved paper preserves its ink.
`;

export function manifest(notes = changelog) {
  return {
    source: { commit: 'a'.repeat(40), sha256: createHash('sha256').update(notes).digest('hex') },
    releases: [{ version: '1.0.0', date: '2026-09-01', tagCommit: 'b'.repeat(40), verifiedAt: '2026-09-02', channels: ['posix', 'powershell', 'homebrew', 'scoop', 'aur'] }],
  };
}
