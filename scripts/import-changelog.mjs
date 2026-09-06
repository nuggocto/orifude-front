import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadReleases } from '../src/lib/releases.ts';

const [repositoryPath, revision, ...extra] = process.argv.slice(2);
if (!repositoryPath || !/^[a-f0-9]{40}$/.test(revision ?? '') || extra.length) {
  throw new Error('Usage: pnpm import:changelog /path/to/orifude FULL_COMMIT_SHA');
}
const snapshot = execFileSync('git', ['-C', repositoryPath, 'show', `${revision}:CHANGELOG.md`], {
  encoding: 'utf8', timeout: 10_000, maxBuffer: 512 * 1024,
});
const manifestUrl = new URL('../src/content/releases.json', import.meta.url);
const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
manifest.source = { commit: revision, sha256: createHash('sha256').update(snapshot).digest('hex') };
loadReleases(manifest, snapshot);
// A partial filesystem write fails the next build's hash check instead of publishing mixed content.
await writeFile(new URL('../src/content/changelog.md', import.meta.url), snapshot);
await writeFile(manifestUrl, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Imported the canonical changelog at ${revision}. Public releases still require reviewed verification records.`);
