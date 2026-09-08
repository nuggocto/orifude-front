import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { installationInstructions, loadReleases } from '../src/lib/releases.ts';
import { changelog, manifest } from './release-fixture.mjs';

for (const [name, transferExit, installerExit] of [
  ['runs a complete installer', 0, 0],
  ['never runs a failed transfer', 23, 0],
  ['reports an installer failure', 0, 17],
]) {
  test(`POSIX launcher ${name} and cleans temporary files`, { skip: process.platform === 'win32' }, (t) => {
    const root = mkdtempSync(join(tmpdir(), "orifude install's test-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const bin = join(root, 'bin');
    const temporary = join(root, 'temporary');
    mkdirSync(bin);
    mkdirSync(temporary);
    const marker = join(root, 'executed');
    const download = join(root, 'downloaded-script');
    const source = join(root, 'fixture.sh');
    writeFileSync(source, `printf ran > "$ORIFUDE_MARKER"\nexit ${installerExit}\n`);
    // Replace only the network transfer, including a complete prefix returned on failure.
    writeFileSync(join(bin, 'curl'), `#!/bin/sh
while [ "$#" -gt 0 ]; do
  if [ "$1" = -o ]; then shift; destination=$1; fi
  shift
done
printf '%s' "$destination" > "$ORIFUDE_DOWNLOAD"
cp "$ORIFUDE_SOURCE" "$destination"
exit ${transferExit}
`, { mode: 0o755 });
    const [release] = loadReleases(manifest(), changelog);
    const [command] = installationInstructions(release, 'posix');
    const result = spawnSync('sh', ['-c', command], {
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TMPDIR: temporary,
        ORIFUDE_SOURCE: source, ORIFUDE_MARKER: marker, ORIFUDE_DOWNLOAD: download },
      timeout: 10_000, maxBuffer: 1024 * 1024, encoding: 'utf8',
    });
    assert.ifError(result.error);
    assert.equal(result.status, transferExit || installerExit, result.stderr);
    assert.equal(existsSync(marker), transferExit === 0);
    assert.equal(existsSync(readFileSync(download, 'utf8')), false, 'Downloaded script is removed');
    assert.deepEqual(readdirSync(temporary), []);
  });
}
