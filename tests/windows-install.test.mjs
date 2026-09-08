import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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

const installer = `param([Parameter(Mandatory = $true)][string]$BinDir)
$ErrorActionPreference = 'Stop'
[IO.File]::WriteAllText($env:ORIFUDE_TEST_EXECUTION, ([ordered]@{
  destination = $BinDir
  script = $PSCommandPath
  processId = $PID
  version = $PSVersionTable.PSVersion.ToString()
  policy = [string](Get-ExecutionPolicy -Scope Process)
  path = $env:PATH
  arguments = [Environment]::GetCommandLineArgs()
} | ConvertTo-Json -Compress))
if ($BinDir -cne (Join-Path $env:LOCALAPPDATA 'Programs\\Orifude')) {
  throw 'Unexpected fixture destination.'
}
if (-not [IO.Directory]::Exists($BinDir)) { throw 'Fixture destination was not created.' }
if ([int]$env:ORIFUDE_TEST_INSTALLER_EXIT -ne 0) {
  exit ([int]$env:ORIFUDE_TEST_INSTALLER_EXIT)
}
[IO.File]::WriteAllText((Join-Path $BinDir 'installed.txt'), 'installed fixture')
exit 0
`;
const installerSha256 = createHash('sha256').update(installer).digest('hex');

async function runInstall(t, { curlExit = 0, installerExit = 0, corruptDownload = false, reinstall = false, previousInstall = false, destinationOnPath = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "orifude install's test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const temporary = join(root, 'temporary files');
  const localAppData = join(root, 'local app data');
  const destination = join(localAppData, 'Programs', 'Orifude');
  const installed = join(destination, 'installed.txt');
  mkdirSync(temporary);
  mkdirSync(localAppData);
  writeFileSync(join(temporary, 'keep.txt'), 'unrelated temporary file');
  if (previousInstall) {
    mkdirSync(destination, { recursive: true });
    writeFileSync(installed, 'previous fixture');
  }
  const servedInstaller = installer + (corruptDownload ? '\n# Changed after review.\n' : '');
  const source = join(root, 'fixture installer.ps1');
  writeFileSync(source, servedInstaller);
  const input = manifest();
  input.releases[0].powershellSha256 = installerSha256;
  const [release] = loadReleases(input, changelog);
  const commands = installationInstructions(release, 'powershell');
  assert.equal(commands.length, 1, 'Windows installation must be one copyable command');
  const [command] = commands;
  assert.doesNotMatch(command, /[\r\n]/, 'The copied command must fit on one line');

  // Only the transfer is replaced. Hashing, script execution, and cleanup are real.
  const wrapper = `
function curl.exe {
  $outputIndex = [Array]::IndexOf($args, '--output')
  if ($outputIndex -lt 0) { $outputIndex = [Array]::IndexOf($args, '-o') }
  if ($outputIndex -lt 0 -or $outputIndex + 1 -ge $args.Count) {
    throw 'Fixture curl needs an output file.'
  }
  if ($args -notcontains '${release.url.replace('/tag/', '/download/')}/install.ps1') {
    throw 'Fixture curl received an unexpected release URL.'
  }
  $download = [IO.Path]::GetFullPath([string]$args[$outputIndex + 1])
  if ([IO.Path]::GetDirectoryName([IO.Path]::GetDirectoryName($download)) -ne $env:TEMP) {
    throw 'Fixture curl refuses writes outside its private temporary directory.'
  }
  [IO.File]::Copy($env:ORIFUDE_TEST_SOURCE, $download, $true)
  [IO.File]::WriteAllText($env:ORIFUDE_TEST_DOWNLOAD, ([ordered]@{
    path = $download
    sha256 = (Get-FileHash -LiteralPath $download -Algorithm SHA256 -ErrorAction Stop).Hash
  } | ConvertTo-Json -Compress))
  $global:LASTEXITCODE = [int]$env:ORIFUDE_TEST_CURL_EXIT
}
function Read-PersistentSettings {
  [ordered]@{
    userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    userPolicy = [string](Get-ExecutionPolicy -Scope CurrentUser -ErrorAction Stop)
    machinePolicy = [string](Get-ExecutionPolicy -Scope LocalMachine -ErrorAction Stop)
  }
}
$testBefore = Read-PersistentSettings
$testInitialPath = $env:PATH
$testPolicyBefore = [string](Get-ExecutionPolicy -Scope Process -ErrorAction Stop)
$testResults = @()
for ($testAttempt = 0; $testAttempt -lt ${reinstall ? 2 : 1}; $testAttempt++) {
  $testPathBefore = $env:PATH
  $testError = $null
  try {
    ${command}
  } catch {
    $testError = $_.Exception.Message
  }
  $testExecution = $null
  if ([IO.File]::Exists($env:ORIFUDE_TEST_EXECUTION)) {
    $testExecution = [IO.File]::ReadAllText($env:ORIFUDE_TEST_EXECUTION) | ConvertFrom-Json -ErrorAction Stop
  }
  $testInstalled = $null
  if ([IO.File]::Exists($env:ORIFUDE_TEST_INSTALLED)) {
    $testInstalled = [IO.File]::ReadAllText($env:ORIFUDE_TEST_INSTALLED)
  }
  $testDownload = $null
  if ([IO.File]::Exists($env:ORIFUDE_TEST_DOWNLOAD)) {
    $testDownload = [IO.File]::ReadAllText($env:ORIFUDE_TEST_DOWNLOAD) | ConvertFrom-Json -ErrorAction Stop
  }
  $testResults += [ordered]@{
    error = $testError
    pathBefore = $testPathBefore
    path = $env:PATH
    execution = $testExecution
    installed = $testInstalled
    download = $testDownload
    temporaryEntries = @([IO.Directory]::GetFileSystemEntries($env:TEMP))
  }
  if ($testAttempt + 1 -lt ${reinstall ? 2 : 1}) {
    [IO.File]::WriteAllText($env:ORIFUDE_TEST_INSTALLED, 'previous fixture')
    [IO.File]::Delete($env:ORIFUDE_TEST_EXECUTION)
  }
}
[IO.File]::WriteAllText($env:ORIFUDE_TEST_RESULT, ([ordered]@{
  version = $PSVersionTable.PSVersion.ToString()
  processId = $PID
  initialPath = $testInitialPath
  policyBefore = $testPolicyBefore
  policyAfter = [string](Get-ExecutionPolicy -Scope Process -ErrorAction Stop)
  persistentBefore = $testBefore
  persistentAfter = (Read-PersistentSettings)
  attempts = $testResults
} | ConvertTo-Json -Depth 6 -Compress))
`;
  const powershellDirectory = join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0');
  const otherPath = `${powershellDirectory};${join(process.env.SystemRoot, 'System32')}`;
  const initialPath = destinationOnPath ? `${otherPath};${destination}` : otherPath;
  // PowerShell 7's module path can hide Get-FileHash from Windows PowerShell 5.1.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !/^(TEMP|TMP|LOCALAPPDATA|PATH|PSModulePath|PSExecutionPolicyPreference)$/i.test(key)));
  Object.assign(env, {
    TEMP: temporary,
    TMP: temporary,
    LOCALAPPDATA: localAppData,
    PATH: initialPath,
    ORIFUDE_TEST_SOURCE: source,
    ORIFUDE_TEST_EXECUTION: join(root, 'execution.json'),
    ORIFUDE_TEST_DOWNLOAD: join(root, 'download.json'),
    ORIFUDE_TEST_INSTALLED: installed,
    ORIFUDE_TEST_RESULT: join(root, 'result.json'),
    ORIFUDE_TEST_CURL_EXIT: String(curlExit),
    ORIFUDE_TEST_INSTALLER_EXIT: String(installerExit),
  });
  const child = await runPowerShell(join(powershellDirectory, 'powershell.exe'), [
    '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Restricted',
    '-EncodedCommand', Buffer.from(wrapper, 'utf16le').toString('base64'),
  ], { cwd: root, env });
  assert.equal(child.status, 0, `PowerShell harness failed:\n${child.stdout}\n${child.stderr}`);
  const result = JSON.parse(readFileSync(env.ORIFUDE_TEST_RESULT, 'utf8'));
  assert.match(result.version, /^5\.1\./, 'Exercise Windows PowerShell, not PowerShell 7');
  assert.equal(result.policyBefore, 'Restricted');
  assert.equal(result.policyAfter, result.policyBefore, 'The calling shell policy must not change');
  assert.deepEqual(result.persistentAfter, result.persistentBefore, 'No persistent PATH or policy changes');
  assert.equal(result.initialPath, initialPath);
  for (const attempt of result.attempts) {
    assert.ok(attempt.download, `Installer download did not reach the fixture: ${attempt.error}`);
    assert.equal(attempt.download.sha256.toLowerCase(), createHash('sha256').update(servedInstaller).digest('hex'));
    assert.equal(dirname(dirname(attempt.download.path)), temporary, 'Download belongs in a private temporary subdirectory');
    assert.deepEqual(attempt.temporaryEntries, [join(temporary, 'keep.txt')], 'Each command cleans its own work directory');
  }
  assert.deepEqual(readdirSync(temporary), ['keep.txt']);
  assert.equal(readFileSync(join(temporary, 'keep.txt'), 'utf8'), 'unrelated temporary file');
  return { ...result, destination, installed, otherPath };
}

test('Windows installation and reinstall update only the process PATH once and clean temporary files', windowsOnly, async (t) => {
  const result = await runInstall(t, { reinstall: true });
  const [first, second] = result.attempts;
  assert.equal(first.error, null);
  assert.equal(second.error, null);
  assert.equal(first.installed, 'installed fixture');
  assert.equal(second.installed, 'installed fixture', 'Reinstall replaces the previous fixture');
  assert.equal(first.path, `${result.destination};${result.initialPath}`, 'Successful install prepends its destination');
  assert.equal(second.path, first.path, 'Reinstall must not duplicate the PATH entry');
  assert.notEqual(first.download.path, second.download.path, 'Each attempt owns a fresh work directory');
  for (const attempt of result.attempts) {
    assert.equal(attempt.execution.destination, result.destination);
    assert.equal(attempt.execution.script, attempt.download.path);
    assert.notEqual(attempt.execution.processId, result.processId, 'Run the installer in a real child process');
    assert.match(attempt.execution.version, /^5\.1\./);
    assert.equal(attempt.execution.policy, 'Bypass');
    assert.equal(attempt.execution.path, attempt.pathBefore, 'PATH changes only after the installer succeeds');
    assert.ok(attempt.execution.arguments.includes('-NoProfile'));
    assert.ok(attempt.execution.arguments.includes('-NonInteractive'));
  }
  assert.equal(readFileSync(result.installed, 'utf8'), 'installed fixture');
});

test('a failed Windows download never executes even complete matching installer bytes', windowsOnly, async (t) => {
  const result = await runInstall(t, { curlExit: 23 });
  const [attempt] = result.attempts;
  assert.match(attempt.error, /download.*fail|fail.*download/i);
  assert.equal(attempt.download.sha256.toLowerCase(), installerSha256);
  assert.equal(attempt.execution, null);
  assert.equal(existsSync(result.destination), false);
  assert.equal(attempt.path, result.initialPath);
});

test('an existing Windows installation directory takes precedence over other PATH entries', windowsOnly, async (t) => {
  const result = await runInstall(t, { destinationOnPath: true });
  assert.equal(result.attempts[0].error, null);
  assert.equal(result.attempts[0].path, `${result.destination};${result.otherPath}`);
});

test('a Windows installer hash mismatch prevents execution and destination creation', windowsOnly, async (t) => {
  const result = await runInstall(t, { corruptDownload: true });
  const [attempt] = result.attempts;
  assert.match(attempt.error, /hash|sha-?256|checksum/i);
  assert.notEqual(attempt.download.sha256.toLowerCase(), installerSha256);
  assert.equal(attempt.execution, null);
  assert.equal(existsSync(result.destination), false);
  assert.equal(attempt.path, result.initialPath);
});

test('a nonzero Windows installer preserves the previous fixture and leaves PATH unchanged', windowsOnly, async (t) => {
  const result = await runInstall(t, { installerExit: 17, previousInstall: true });
  const [attempt] = result.attempts;
  assert.match(attempt.error, /install.*(fail|exit)|fail.*install/i);
  assert.equal(attempt.execution.destination, result.destination, 'The verified installer actually ran');
  assert.equal(attempt.installed, 'previous fixture');
  assert.equal(readFileSync(result.installed, 'utf8'), 'previous fixture');
  assert.equal(attempt.path, result.initialPath);
});

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
