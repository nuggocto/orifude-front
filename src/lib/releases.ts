import { createHash } from 'node:crypto';
import { z } from 'astro/zod';

export const repository = 'https://github.com/nuggocto/orifude';
export const channelNames = ['posix', 'powershell', 'homebrew', 'scoop', 'aur'] as const;
export const categories = ['Added', 'Changed', 'Fixed', 'Security'] as const;
export type Channel = (typeof channelNames)[number];

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}, 'Expected a real calendar date');
const commit = z.string().regex(/^[a-f0-9]{40}$/);
const version = z.string().regex(/^(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})$/);
const text = z.string().trim().min(1).max(1200).refine((value) => !/[\u0000-\u001f\u007f]/.test(value));
const notesSchema = z.object({
  summary: text,
  changes: z.object({
    Added: z.array(text).max(64),
    Changed: z.array(text).max(64),
    Fixed: z.array(text).max(64),
    Security: z.array(text).max(64),
  }).strict().refine((changes) => Object.values(changes).some((items) => items.length > 0), 'A release needs change notes'),
}).strict();

export const manifestSchema = z.object({
  source: z.object({ commit, sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  releases: z.array(z.object({
    version,
    date,
    tagCommit: commit,
    verifiedAt: date,
    channels: z.array(z.enum(channelNames)).max(channelNames.length),
    powershellSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  }).strict().refine((entry) => !entry.channels.includes('powershell') || entry.powershellSha256,
    'PowerShell installation requires its reviewed installer SHA-256')).max(128),
}).strict();

function releaseNotes(changelog: string, releaseVersion: string, releaseDate: string) {
  const matching = changelog.split(/(?=^## )/m).filter((section) => {
    const heading = section.split('\n', 1)[0];
    return heading === `## ${releaseVersion} - ${releaseDate}` || heading === `## [${releaseVersion}] - ${releaseDate}`;
  });
  if (matching.length !== 1) throw new Error(`Release ${releaseVersion} needs one matching dated changelog section`);
  const [, ...body] = matching[0].split('\n');
  const summary: string[] = [];
  const changes: Record<(typeof categories)[number], string[]> = { Added: [], Changed: [], Fixed: [], Security: [] };
  let category: (typeof categories)[number] | undefined;
  for (const line of body) {
    if (!line.trim()) continue;
    if (line.startsWith('### ')) {
      const heading = line.slice(4);
      if (!categories.includes(heading as (typeof categories)[number])) throw new Error(`Unknown change category: ${heading}`);
      category = heading as (typeof categories)[number];
    } else if (!category) {
      summary.push(line.trim());
    } else if (line.startsWith('- ')) {
      changes[category].push(line.slice(2).trim());
    } else if (/^\s+\S/.test(line) && changes[category].length > 0) {
      const index = changes[category].length - 1;
      changes[category][index] += ` ${line.trim()}`;
    } else {
      throw new Error(`Expected a change bullet in ${releaseVersion}`);
    }
  }
  return notesSchema.parse({ summary: summary.join(' '), changes });
}

export function loadReleases(input: unknown, changelog: string) {
  if (Buffer.byteLength(changelog) > 512 * 1024) throw new Error('Changelog exceeds 512 KiB');
  const manifest = manifestSchema.parse(input);
  if (createHash('sha256').update(changelog).digest('hex') !== manifest.source.sha256) {
    throw new Error('Changelog content does not match its reviewed source hash');
  }
  const seen = new Set<string>();
  const releases = manifest.releases.map((entry) => {
    if (seen.has(entry.version)) throw new Error(`Duplicate release ${entry.version}`);
    seen.add(entry.version);
    if (new Set(entry.channels).size !== entry.channels.length) throw new Error('Duplicate installation channel');
    if (entry.verifiedAt < entry.date) throw new Error('Release verification predates publication');
    return {
      ...entry,
      ...releaseNotes(changelog, entry.version, entry.date),
      url: `${repository}/releases/tag/v${entry.version}`,
      tagUrl: `${repository}/tree/v${entry.version}`,
      sourceUrl: `${repository}/blob/${manifest.source.commit}/CHANGELOG.md`,
    };
  });
  return releases.sort((left, right) => {
    const byDate = right.date.localeCompare(left.date);
    if (byDate !== 0) return byDate;
    const a = left.version.split('.').map(Number);
    const b = right.version.split('.').map(Number);
    return b[0] - a[0] || b[1] - a[1] || b[2] - a[2];
  });
}

export type Release = ReturnType<typeof loadReleases>[number];

export function installationInstructions(release: Release, channel: Channel) {
  if (!release.channels.includes(channel)) throw new Error('This installation channel has not been verified');
  const base = `${repository}/releases/download/v${release.version}`;
  switch (channel) {
    case 'posix': return [`(
  d=$(mktemp -d) || exit
  trap 'rm -rf "$d"' EXIT
  curl -fL --proto '=https' --proto-redir '=https' --tlsv1.2 --max-redirs 5 --connect-timeout 15 --max-time 120 --max-filesize 1048576 -o "$d/install.sh" ${base}/install.sh &&
    sh "$d/install.sh"
)`];
    case 'powershell': return [`& {
  $d = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ([guid]::NewGuid())) -ErrorAction Stop
  try {
    $p = Join-Path $d.FullName 'install.ps1'
    curl.exe -fL --proto '=https' --proto-redir '=https' --tlsv1.2 --max-redirs 5 --connect-timeout 15 --max-time 120 --max-filesize 1048576 -o $p ${base}/install.ps1
    if ($LASTEXITCODE) { throw 'Installer download failed.' }
    powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $p
    if ($LASTEXITCODE) { throw 'Installation failed.' }
  } finally { Remove-Item -LiteralPath $d.FullName -Recurse -Force }
}`];
    case 'homebrew': return ['brew install nuggocto/tap/orifude'];
    case 'scoop': return ['scoop bucket add nuggocto https://github.com/nuggocto/scoop-bucket\nscoop install nuggocto/orifude'];
    case 'aur': return ['yay -S orifude-bin'];
  }
}
