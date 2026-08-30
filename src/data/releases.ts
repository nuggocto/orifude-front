import { z } from "zod";

const releaseBaseURL = "https://github.com/nuggocto/orifude/releases/download";

export const operatingSystemSchema = z.enum(["linux", "darwin", "windows"]);
export const architectureSchema = z.enum(["amd64", "arm64"]);

export const artifactSchema = z.object({
  os: operatingSystemSchema,
  arch: architectureSchema,
  format: z.enum(["tar.gz", "zip"]),
  url: z.url({ protocol: /^https$/ }),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

const versionSchema = z.string().regex(/^v0\.\d+\.\d+$/);

const preparingReleaseSchema = z.object({
  status: z.literal("preparing"),
  version: versionSchema,
  publishedAt: z.null(),
  checksumURL: z.null(),
  artifacts: z.tuple([]),
});

const publishedReleaseSchema = z
  .object({
    status: z.literal("published"),
    version: versionSchema,
    publishedAt: z.iso.date(),
    checksumURL: z.url({ protocol: /^https$/ }),
    artifacts: z.array(artifactSchema).length(6),
  })
  .superRefine((release, context) => {
    const expected = new Set([
      "linux/amd64",
      "linux/arm64",
      "darwin/amd64",
      "darwin/arm64",
      "windows/amd64",
      "windows/arm64",
    ]);
    const seen = new Set<string>();
    const tagBase = `${releaseBaseURL}/${release.version}/`;

    for (const artifact of release.artifacts) {
      const platform = `${artifact.os}/${artifact.arch}`;
      if (seen.has(platform)) {
        context.addIssue({
          code: "custom",
          message: `duplicate release platform: ${platform}`,
          path: ["artifacts"],
        });
      }
      seen.add(platform);

      const expectedFormat = artifact.os === "windows" ? "zip" : "tar.gz";
      if (artifact.format !== expectedFormat) {
        context.addIssue({
          code: "custom",
          message: `${platform} must use ${expectedFormat}`,
          path: ["artifacts"],
        });
      }

      if (!artifact.url.startsWith(tagBase)) {
        context.addIssue({
          code: "custom",
          message: `artifact URL must use immutable tag ${release.version}`,
          path: ["artifacts"],
        });
      }
    }

    for (const platform of expected) {
      if (!seen.has(platform)) {
        context.addIssue({
          code: "custom",
          message: `missing release platform: ${platform}`,
          path: ["artifacts"],
        });
      }
    }

    if (!release.checksumURL.startsWith(tagBase)) {
      context.addIssue({
        code: "custom",
        message: `checksum URL must use immutable tag ${release.version}`,
        path: ["checksumURL"],
      });
    }
  });

export const releaseSchema = z.discriminatedUnion("status", [
  preparingReleaseSchema,
  publishedReleaseSchema,
]);

export type Release = z.infer<typeof releaseSchema>;
export type Artifact = z.infer<typeof artifactSchema>;

export const currentRelease = releaseSchema.parse({
  status: "published",
  version: "v0.2.0",
  publishedAt: "2026-08-29",
  checksumURL: `${releaseBaseURL}/v0.2.0/checksums.txt`,
  artifacts: [
    {
      os: "linux",
      arch: "amd64",
      format: "tar.gz",
      url: `${releaseBaseURL}/v0.2.0/orifude_0.2.0_linux_amd64.tar.gz`,
      sha256: "031d0745469418c3d3c8946e777e6456f52a95ee3e5afc5ff4bd906fc2490873",
    },
    {
      os: "linux",
      arch: "arm64",
      format: "tar.gz",
      url: `${releaseBaseURL}/v0.2.0/orifude_0.2.0_linux_arm64.tar.gz`,
      sha256: "1ef37a506e9aead816a232c86b6fd29c91204ceed31ef32b7a1be8c001acff00",
    },
    {
      os: "darwin",
      arch: "amd64",
      format: "tar.gz",
      url: `${releaseBaseURL}/v0.2.0/orifude_0.2.0_darwin_amd64.tar.gz`,
      sha256: "b87bfd54bebbfc80331c5510bef67d1646c6c323696ff3b1c3faeca142c17230",
    },
    {
      os: "darwin",
      arch: "arm64",
      format: "tar.gz",
      url: `${releaseBaseURL}/v0.2.0/orifude_0.2.0_darwin_arm64.tar.gz`,
      sha256: "dbb964b90cb10e468a6b1e6725cfc77cc9c28cddb020bada32b92ad93d45c027",
    },
    {
      os: "windows",
      arch: "amd64",
      format: "zip",
      url: `${releaseBaseURL}/v0.2.0/orifude_0.2.0_windows_amd64.zip`,
      sha256: "2e82b72d99036b8f7530d16897bd461509ec733a4eef1cd8fe7e6ffc40a92c17",
    },
    {
      os: "windows",
      arch: "arm64",
      format: "zip",
      url: `${releaseBaseURL}/v0.2.0/orifude_0.2.0_windows_arm64.zip`,
      sha256: "428986437be69d17b535bf93d7e041df23db553b7df68c717ac560b4d0b32af1",
    },
  ],
});

export const platformNames = {
  linux: "Linux",
  darwin: "macOS",
  windows: "Windows",
} satisfies Record<Artifact["os"], string>;
