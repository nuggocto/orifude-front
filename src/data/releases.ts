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
  status: "preparing",
  version: "v0.2.0",
  publishedAt: null,
  checksumURL: null,
  artifacts: [],
});

export const platformNames = {
  linux: "Linux",
  darwin: "macOS",
  windows: "Windows",
} satisfies Record<Artifact["os"], string>;
