import snapshot from '../content/changelog.md?raw';
import manifest from '../content/releases.json';
import { loadReleases } from './releases';

export const releases = loadReleases(manifest, snapshot);
export const latestRelease = releases[0];
