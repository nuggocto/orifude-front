import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { installationInstructions, loadReleases } from '../src/lib/releases.ts';
import { changelog, manifest } from './release-fixture.mjs';

const published = readFileSync(new URL('../public/install.sh', import.meta.url), 'utf8');
const unix = { skip: process.platform === 'win32' };

// Replace only the network transfer: print the served bytes, then exit like curl would.
function runCommand(t, served, transferExit) {
  const root = mkdtempSync(join(tmpdir(), "orifude install's test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = join(root, 'bin');
  const home = join(root, 'home');
  const temporary = join(root, 'temporary');
  for (const directory of [bin, home, temporary]) mkdirSync(directory);
  const source = join(root, 'served');
  writeFileSync(source, served);
  writeFileSync(join(bin, 'curl'), `#!/bin/sh
for argument in "$@"; do last=$argument; done
[ "$last" = https://orifude.com/install.sh ] || { echo "unexpected URL: $last" >&2; exit 2; }
cat "$ORIFUDE_SOURCE"
exit ${transferExit}
`, { mode: 0o755 });
  const [release] = loadReleases(manifest(), changelog);
  const [command] = installationInstructions(release, 'posix');
  const result = spawnSync('sh', ['-c', command], {
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, HOME: home, TMPDIR: temporary,
      ORIFUDE_SOURCE: source, ORIFUDE_MARKER: join(root, 'executed') },
    timeout: 10_000, maxBuffer: 1024 * 1024, encoding: 'utf8',
  });
  assert.ifError(result.error);
  return { result, root, home, temporary };
}

test('the POSIX command pipes the served installer into sh', unix, (t) => {
  const { result, root } = runCommand(t, 'printf ran > "$ORIFUDE_MARKER"\n', 0);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(root, 'executed'), 'utf8'), 'ran');
});

test('the POSIX command reports an installer failure', unix, (t) => {
  const { result } = runCommand(t, 'exit 17\n', 0);
  assert.equal(result.status, 17);
});

const lastLine = published.lastIndexOf('\nmain "$@"');
test('the published installer calls main only on its last line', () => {
  assert.ok(lastLine > 0, 'install.sh must end by calling main');
  assert.equal(published.slice(lastLine).trim(), 'main "$@"');
});

for (const [name, cut] of [['halfway', Math.floor(published.length / 2)], ['before the final call', lastLine]]) {
  test(`a published installer cut off ${name} installs nothing`, unix, (t) => {
    const { home, temporary } = runCommand(t, published.slice(0, cut), 18);
    assert.equal(existsSync(join(home, '.local')), false, 'A partial script must not create the install directory');
    assert.deepEqual(readdirSync(temporary), [], 'A partial script must not start downloading');
  });
}
