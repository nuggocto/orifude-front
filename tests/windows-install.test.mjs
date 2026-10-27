import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { installationInstructions, loadReleases } from '../src/lib/releases.ts';
import { changelog, manifest } from './release-fixture.mjs';

const windowsOnly = { skip: process.platform !== 'win32' && 'Requires Windows PowerShell 5.1' };
const INSTALL_DEADLINE_MS = 30_000;
const CLEANUP_DEADLINE_MS = 5_000;
const OUTPUT_LIMIT_BYTES = 1024 * 1024;

async function runPowerShell(executable, args, options) {
  const child = spawn(executable, args, { ...options, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const output = { stdout: [], stderr: [] };
  let outputBytes = 0;
  let failure;
  /** @type {Promise<void> | undefined} */
  let stopping;
  const closed = new Promise((resolve) => {
    child.on('error', (error) => { failure ??= error; });
    child.once('close', resolve);
  });
  const stop = (error) => {
    failure ??= error;
    if (stopping || !child.pid || child.exitCode !== null || child.signalCode !== null) return;
    // Keep the parent alive until taskkill has traversed its descendants.
    stopping = (async () => {
      let cleanupError;
      try {
        const killer = spawn(join(process.env.SystemRoot, 'System32', 'taskkill.exe'), [
          '/PID', String(child.pid), '/T', '/F',
        ], { windowsHide: true, stdio: 'ignore', timeout: CLEANUP_DEADLINE_MS });
        const status = await new Promise((resolve) => {
          killer.once('error', (error) => { cleanupError = error; });
          killer.once('close', resolve);
        });
        if (status !== 0) cleanupError ??= new Error(`taskkill exited with status ${status}`);
      } catch (error) {
        cleanupError = error;
      } finally {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
        if (cleanupError) {
          failure = new AggregateError([failure, cleanupError], 'PowerShell process-tree cleanup failed');
          child.stdout?.destroy();
          child.stderr?.destroy();
        }
      }
    })();
  };
  for (const stream of ['stdout', 'stderr']) {
    child[stream]?.on('error', stop);
    child[stream]?.on('data', (chunk) => {
      const remaining = OUTPUT_LIMIT_BYTES - outputBytes;
      if (remaining > 0) output[stream].push(chunk.subarray(0, remaining));
      outputBytes += Math.min(chunk.length, remaining);
      if (chunk.length > remaining) stop(new Error('PowerShell harness exceeded its output limit'));
    });
  }
  const deadline = setTimeout(() => stop(Object.assign(
    new Error(`PowerShell harness exceeded its ${INSTALL_DEADLINE_MS} ms deadline`),
    { code: 'ETIMEDOUT' },
  )), INSTALL_DEADLINE_MS);
  const interrupt = () => { process.exitCode = 130; stop(new Error('PowerShell harness interrupted by SIGINT')); };
  const terminate = () => { process.exitCode = 143; stop(new Error('PowerShell harness interrupted by SIGTERM')); };
  process.on('SIGINT', interrupt);
  process.on('SIGTERM', terminate);
  try {
    const status = await closed;
    await stopping;
    const stdout = Buffer.concat(output.stdout).toString('utf8');
    const stderr = Buffer.concat(output.stderr).toString('utf8');
    if (failure) {
      failure.message += `\n${stdout}\n${stderr}`;
      throw failure;
    }
    return { status, stdout, stderr };
  } finally {
    clearTimeout(deadline);
    process.off('SIGINT', interrupt);
    process.off('SIGTERM', terminate);
  }
}

const published = readFileSync(new URL('../public/install.ps1', import.meta.url), 'utf8');

// Mirrors the published structure: a parameter block, then one script block.
const fixture = `[CmdletBinding()]
param([string]$BinDir = (Join-Path $env:LOCALAPPDATA 'Programs\\Orifude'), [switch]$NoPath)
& {
  $ErrorActionPreference = 'Stop'
  Set-StrictMode -Version Latest
  [IO.File]::WriteAllText($env:ORIFUDE_TEST_EXECUTION, ([ordered]@{
    destination = $BinDir
    processId = $PID
    version = $PSVersionTable.PSVersion.ToString()
  } | ConvertTo-Json -Compress))
  if ($env:ORIFUDE_TEST_FAIL) { throw 'Fixture installer failed.' }
  [void][IO.Directory]::CreateDirectory($BinDir)
  [IO.File]::WriteAllText((Join-Path $BinDir 'installed.txt'), 'installed fixture')
}
`;

async function serve(t, body) {
  const server = createServer((request, response) => {
    if (request.url !== '/install.ps1') { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Length': Buffer.byteLength(body) });
    response.end(body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

async function runInstall(t, served, { fail = false, parseOnly = false } = {}) {
  let root = mkdtempSync(join(tmpdir(), "orifude install's test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // .NET GetTempPath expands Windows 8.3 aliases that Node's tmpdir preserves.
  root = realpathSync.native(root);
  const localAppData = join(root, 'local app data');
  const destination = join(localAppData, 'Programs', 'Orifude');
  mkdirSync(localAppData);
  const [release] = loadReleases(manifest(), changelog);
  const commands = installationInstructions(release, 'powershell');
  assert.deepEqual(commands, ['irm https://orifude.com/install.ps1 | iex'], 'Windows installation must be one short command');
  // Only the host changes; Invoke-RestMethod, Invoke-Expression, and parsing are real.
  let command = commands[0].replace('https://orifude.com', await serve(t, served));
  if (parseOnly) command = command.replace('| iex', "| ForEach-Object { [void][scriptblock]::Create($_); throw 'parsed completely' }");

  const wrapper = `
$ErrorActionPreference = 'Continue'
Set-StrictMode -Off
function Read-PersistentSettings {
  [ordered]@{
    userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    userPolicy = [string](Get-ExecutionPolicy -Scope CurrentUser -ErrorAction Stop)
    machinePolicy = [string](Get-ExecutionPolicy -Scope LocalMachine -ErrorAction Stop)
  }
}
$testBefore = Read-PersistentSettings
$testPolicyBefore = [string](Get-ExecutionPolicy -Scope Process -ErrorAction Stop)
$testError = $null
try {
  ${command}
} catch {
  $testError = $_.Exception.GetType().Name + ': ' + $_.Exception.Message
}
# Strict mode would make this unset variable an error; the installer must not leave it on.
$testStrict = try { $null -eq $testUnsetVariable } catch { 'strict' }
$testExecution = $null
if ([IO.File]::Exists($env:ORIFUDE_TEST_EXECUTION)) {
  $testExecution = [IO.File]::ReadAllText($env:ORIFUDE_TEST_EXECUTION) | ConvertFrom-Json -ErrorAction Stop
}
[IO.File]::WriteAllText($env:ORIFUDE_TEST_RESULT, ([ordered]@{
  version = $PSVersionTable.PSVersion.ToString()
  processId = $PID
  error = $testError
  errorActionPreference = [string]$ErrorActionPreference
  strict = $testStrict
  policyBefore = $testPolicyBefore
  policyAfter = [string](Get-ExecutionPolicy -Scope Process -ErrorAction Stop)
  persistentBefore = $testBefore
  persistentAfter = (Read-PersistentSettings)
  execution = $testExecution
} | ConvertTo-Json -Depth 4 -Compress))
`;
  const powershellDirectory = join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0');
  // PowerShell 5.1 must resolve its own modules, even when launched from PowerShell 7.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !/^(LOCALAPPDATA|PSModulePath|PSExecutionPolicyPreference|ORIFUDE_TEST_FAIL)$/i.test(key)));
  Object.assign(env, {
    LOCALAPPDATA: localAppData,
    ORIFUDE_TEST_EXECUTION: join(root, 'execution.json'),
    ORIFUDE_TEST_RESULT: join(root, 'result.json'),
    ...(fail ? { ORIFUDE_TEST_FAIL: '1' } : {}),
  });
  const child = await runPowerShell(join(powershellDirectory, 'powershell.exe'), [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Restricted',
    '-EncodedCommand', Buffer.from(wrapper, 'utf16le').toString('base64'),
  ], { cwd: root, env });
  assert.equal(child.status, 0, `PowerShell harness failed:\n${child.stdout}\n${child.stderr}`);
  const result = JSON.parse(readFileSync(env.ORIFUDE_TEST_RESULT, 'utf8'));
  assert.match(result.version, /^5\.1\./, 'Exercise Windows PowerShell, not PowerShell 7');
  assert.equal(result.policyBefore, 'Restricted', 'irm | iex must work under the default client policy');
  assert.equal(result.policyAfter, result.policyBefore, 'The calling shell policy must not change');
  assert.deepEqual(result.persistentAfter, result.persistentBefore, 'No persistent PATH or policy changes');
  assert.equal(result.errorActionPreference, 'Continue', "The installer's error preference stays in its script block");
  assert.equal(result.strict, true, "The installer's strict mode stays in its script block");
  return { ...result, destination };
}

test('irm | iex runs the served installer with its defaults in the calling shell', windowsOnly, async (t) => {
  const result = await runInstall(t, fixture);
  assert.equal(result.error, null);
  assert.equal(result.execution.destination, result.destination);
  assert.equal(result.execution.processId, result.processId, 'iex runs in the calling shell');
  assert.match(result.execution.version, /^5\.1\./);
  assert.equal(readFileSync(join(result.destination, 'installed.txt'), 'utf8'), 'installed fixture');
});

test('a failing installer reports its error and leaves the calling shell open', windowsOnly, async (t) => {
  const result = await runInstall(t, fixture, { fail: true });
  assert.match(result.error, /Fixture installer failed/);
  assert.ok(result.execution, 'The installer ran before failing');
  assert.equal(existsSync(result.destination), false);
});

test('the published installer parses in Windows PowerShell 5.1', windowsOnly, async (t) => {
  // Parse the downloaded text as iex would, without running the real installer.
  const result = await runInstall(t, published, { parseOnly: true });
  assert.match(result.error, /parsed completely/);
  assert.equal(existsSync(result.destination), false);
});

const closing = published.trimEnd().lastIndexOf('}');
for (const [name, cut] of [['halfway', Math.floor(published.length / 2)], ['before its closing brace', closing]]) {
  test(`a published installer cut off ${name} runs nothing`, windowsOnly, async (t) => {
    const result = await runInstall(t, published.slice(0, cut));
    assert.match(result.error, /Parse/, 'A partial script must fail to parse');
    assert.equal(existsSync(result.destination), false);
  });
}

test('the harness deadline stops a stalled PowerShell descendant before fixture cleanup', windowsOnly, async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'orifude stalled install-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const temporary = join(root, 'temporary');
  const localAppData = join(root, 'local app data');
  mkdirSync(temporary);
  mkdirSync(localAppData);
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !/^(TEMP|TMP|LOCALAPPDATA|PSModulePath|PSExecutionPolicyPreference)$/i.test(key)));
  const lock = join(root, 'installer.lock');
  const survived = join(root, 'survived.txt');
  const stalled = `
$lock = [IO.File]::Open($env:ORIFUDE_TEST_LOCK, 'CreateNew', 'ReadWrite', 'None')
try {
  [Threading.Thread]::Sleep(${INSTALL_DEADLINE_MS * 2})
  [IO.File]::WriteAllText($env:ORIFUDE_TEST_SURVIVED, 'Descendant outlived the deadline.')
} finally { $lock.Dispose() }
`;
  const wrapper = `& "$PSHOME\\powershell.exe" -NoProfile -NonInteractive -EncodedCommand ${Buffer.from(stalled, 'utf16le').toString('base64')}`;
  const powershell = join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
  await assert.rejects(runPowerShell(powershell, [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Restricted',
    '-EncodedCommand', Buffer.from(wrapper, 'utf16le').toString('base64'),
  ], {
    cwd: root,
    env: { ...env, TEMP: temporary, TMP: temporary, LOCALAPPDATA: localAppData, ORIFUDE_TEST_LOCK: lock, ORIFUDE_TEST_SURVIVED: survived },
  }), { code: 'ETIMEDOUT' });
  assert.equal(existsSync(lock), true, 'The descendant acquired its exclusive fixture lock');
  assert.equal(existsSync(survived), false, 'The descendant was stopped, not awaited until natural exit');
  rmSync(lock); // Windows refuses this while the descendant still holds its exclusive lock.
});
