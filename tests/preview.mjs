import { startPreview } from '../scripts/preview.mjs';
import { cp, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { changelog, manifest } from './release-fixture.mjs';

// The test owns this foreground server; it never reuses a developer's preview.
const root = fileURLToPath(new URL('../', import.meta.url));
const fixture = await mkdtemp(join(tmpdir(), 'orifude-release-'));
const servers = [];
const abort = new AbortController();
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  abort.abort();
  await Promise.all(servers.map((server) => server.stop()));
  await rm(fixture, { recursive: true, force: true });
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => { await stop(); process.exit(); });
}
try {
  for (const file of ['src', 'public', 'scripts', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
    await cp(join(root, file), join(fixture, file), { recursive: true });
  }
  await symlink(join(root, 'node_modules'), join(fixture, 'node_modules'), 'dir');
  // Raw markup must remain visible text, even in reviewed notes.
  const notes = changelog.replace('The first papers are ready to open.', 'A <script>alert(1)</script> stays plain text.');
  const input = manifest(notes);
  input.releases[0].channels = ['posix', 'powershell'];
  await writeFile(join(fixture, 'src/content/changelog.md'), notes);
  await writeFile(join(fixture, 'src/content/releases.json'), JSON.stringify(input));
  await writeFile(join(fixture, 'src/content/packs.json'), JSON.stringify([{
    id: 'fixture', version: '1.0.0', title: 'A <script>alert(1)</script> paper',
    description: 'A local browser fixture.', authors: ['Example author'], license: 'Apache-2.0',
    puzzles: 1, requires: '1.0.0', sha256: 'a'.repeat(64), fingerprint: 'b'.repeat(64),
    sourceCommit: 'c'.repeat(40), verifiedAt: '2026-09-07',
  }]));
  await promisify(execFile)(process.execPath, [join(root, 'node_modules/astro/bin/astro.mjs'), 'build'], { cwd: fixture, signal: abort.signal, timeout: 30_000, maxBuffer: 1024 * 1024 });
  servers.push(await startPreview({ root: fixture, port: 4332 }));
  servers.push(await startPreview({ port: 4331 }));
} catch (error) {
  await stop();
  throw error;
}
