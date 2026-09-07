import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadPacks } from '../src/lib/packs.ts';

const pack = () => ({
  id: 'paper-garden', version: '1.0.0', title: 'Paper garden', description: 'Three papers.',
  authors: ['Orifude contributors'], license: 'Apache-2.0', puzzles: 3,
  sha256: 'a'.repeat(64), fingerprint: 'b'.repeat(64), requires: '1.0.0',
  sourceCommit: 'c'.repeat(40), verifiedAt: '2026-09-07',
});

test('only reviewed catalog entries produce versioned download links', () => {
  assert.deepEqual(loadPacks([]), []);
  const [result] = loadPacks([pack()]);
  assert.equal(result.zipUrl, 'https://github.com/nuggocto/orifude/releases/download/pack-paper-garden-v1.0.0/paper-garden-1.0.0.zip');
  assert.equal(result.checksumUrl, 'https://github.com/nuggocto/orifude/releases/download/pack-paper-garden-v1.0.0/SHA256SUMS');
});

test('malformed, unverified, or redirected pack downloads fail the build', () => {
  for (const patch of [
    { id: '../escape' }, { version: '01.0.0' }, { version: '1.0.0;sh' },
    { sha256: undefined }, { sourceCommit: 'shrek' }, { verifiedAt: '2026-02-30' },
    { requires: '2.0.0' }, { zipUrl: 'https://example.invalid/pack.zip' },
  ]) assert.throws(() => loadPacks([{ ...pack(), ...patch }]));
  assert.throws(() => loadPacks([pack(), pack()]), /Duplicate/);
});
