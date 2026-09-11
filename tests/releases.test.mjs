import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installationInstructions, loadReleases } from '../src/lib/releases.ts';
import { changelog, manifest } from './release-fixture.mjs';

test('unpublished notes never become a public release', () => {
  const input = manifest();
  input.releases = [];
  assert.deepEqual(loadReleases(input, changelog), []);
});

test('a reviewed release uses canonical notes and exact repository URLs', () => {
  const [release] = loadReleases(manifest(), changelog);
  assert.equal(release.summary, 'The first papers are ready to open.');
  assert.deepEqual(release.changes.Added, ['A journey through forty papers. Every paper can be replayed.']);
  assert.equal(release.url, 'https://github.com/nuggocto/orifude/releases/tag/v1.0.0');
  assert.equal(release.tagUrl, 'https://github.com/nuggocto/orifude/tree/v1.0.0');
  assert.equal(release.sourceUrl, `https://github.com/nuggocto/orifude/blob/${'a'.repeat(40)}/CHANGELOG.md`);
});

test('the build rejects notes changed after review', () => {
  assert.throws(() => loadReleases(manifest(), changelog.replace('forty', 'fifty')), /reviewed source hash/);
});

const invalidRecords = [
  ['missing publication date', { date: undefined }],
  ['impossible calendar date', { date: '2026-02-30' }],
  ['missing immutable tag commit', { tagCommit: undefined }],
  ['path or command text in a version', { version: '1.0.0/../../install;sh' }],
  ['an unrecognized installation channel', { channels: ['npm'] }],
  ['verification before publication', { verifiedAt: '2026-08-31' }],
  ['a duplicate installation channel', { channels: ['posix', 'posix'] }],
  ['an injected release URL', { url: 'https://example.invalid/download' }],
  ['a missing PowerShell installer checksum', { powershellSha256: undefined }],
  ['command text in an installer checksum', { powershellSha256: "'; Write-Error injected; '" }],
];
for (const [name, patch] of invalidRecords) {
  test(`rejects ${name}`, () => {
    const input = manifest();
    Object.assign(input.releases[0], patch);
    assert.throws(() => loadReleases(input, changelog), { name: /^(ZodError|Error)$/ });
  });
}

test('a release needs exactly one matching dated changelog section', () => {
  const duplicate = changelog + changelog;
  assert.throws(() => loadReleases(manifest(duplicate), duplicate), /one matching dated changelog section/);
  const input = manifest();
  input.releases[0].date = '2026-09-02';
  assert.throws(() => loadReleases(input, changelog), /one matching dated changelog section/);
});

for (const [name, notes] of [
  ['summary', changelog.replace('The first papers are ready to open.', '')],
  ['change notes', '# Changelog\n\n## 1.0.0 - 2026-09-01\n\nThe first papers are ready.\n'],
]) {
  test(`a release cannot omit its ${name}`, () => {
    assert.throws(() => loadReleases(manifest(notes), notes), { name: 'ZodError' });
  });
}

test('oversized changelogs stop before publication', () => {
  const oversized = 'a'.repeat(512 * 1024 + 1);
  assert.throws(() => loadReleases(manifest(oversized), oversized), /exceeds 512 KiB/);
});

test('duplicate versions cannot appear as separate releases', () => {
  const input = manifest();
  input.releases.push({ ...input.releases[0] });
  assert.throws(() => loadReleases(input, changelog), /Duplicate release/);
});

test('releases are newest first, with numeric version ordering on the same date', () => {
  const section = changelog.slice(changelog.indexOf('## 1.0.0'));
  const notes = changelog + section.replaceAll('1.0.0', '1.10.0') + section.replaceAll('1.0.0', '1.2.0');
  const input = manifest(notes);
  input.releases.push({ ...input.releases[0], version: '1.10.0' }, { ...input.releases[0], version: '1.2.0' });
  assert.deepEqual(loadReleases(input, notes).map((release) => release.version), ['1.10.0', '1.2.0', '1.0.0']);
});

test('an unverified package channel cannot acquire installation commands', () => {
  const input = manifest();
  input.releases[0].channels = ['posix'];
  const [release] = loadReleases(input, changelog);
  assert.throws(() => installationInstructions(release, 'homebrew'), /has not been verified/);
  assert.throws(() => installationInstructions(release, 'nix'), /has not been verified/);
});
