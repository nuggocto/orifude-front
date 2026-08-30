import assert from "node:assert/strict";

import { changelogReleases } from "./changelog.ts";
import { currentRelease, releaseSchema } from "./releases.ts";

const hash = "a".repeat(64);
const version = "v0.2.0";
const base = `https://github.com/nuggocto/orifude/releases/download/${version}`;

const validPublishedRelease = {
  status: "published",
  version,
  publishedAt: "2026-08-30",
  checksumURL: `${base}/checksums.txt`,
  artifacts: [
    { os: "linux", arch: "amd64", format: "tar.gz" },
    { os: "linux", arch: "arm64", format: "tar.gz" },
    { os: "darwin", arch: "amd64", format: "tar.gz" },
    { os: "darwin", arch: "arm64", format: "tar.gz" },
    { os: "windows", arch: "amd64", format: "zip" },
    { os: "windows", arch: "arm64", format: "zip" },
  ].map((artifact) =>
    Object.assign({}, artifact, {
      url: `${base}/orifude_${version.slice(1)}_${artifact.os}_${artifact.arch}.${artifact.format}`,
      sha256: hash,
    }),
  ),
};

assert.equal(releaseSchema.safeParse(validPublishedRelease).success, true);

const invalidChecksum = structuredClone(validPublishedRelease);
invalidChecksum.artifacts[0].sha256 = "not-a-checksum";
assert.equal(releaseSchema.safeParse(invalidChecksum).success, false);

const duplicatePlatform = structuredClone(validPublishedRelease);
duplicatePlatform.artifacts[5] = structuredClone(duplicatePlatform.artifacts[0]);
assert.equal(releaseSchema.safeParse(duplicatePlatform).success, false);

const mutableURL = structuredClone(validPublishedRelease);
mutableURL.artifacts[0].url =
  "https://github.com/nuggocto/orifude/releases/latest/download/orifude_linux_amd64.tar.gz";
assert.equal(releaseSchema.safeParse(mutableURL).success, false);

const wrongWindowsFormat = structuredClone(validPublishedRelease);
wrongWindowsFormat.artifacts[4].format = "tar.gz";
assert.equal(releaseSchema.safeParse(wrongWindowsFormat).success, false);

assert.equal(changelogReleases[0]?.version, currentRelease.version);
assert.equal(
  new Set(changelogReleases.map((release) => release.version)).size,
  changelogReleases.length,
);

process.stdout.write("release metadata validation passed\n");
