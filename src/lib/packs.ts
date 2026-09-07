import { z } from 'astro/zod';

const text = z.string().min(1).max(512).refine((value) => !/[\u0000-\u001f\u007f]/.test(value));
const version = z.string().max(32).regex(/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/)
  .refine((value) => value.split('.').every((part) => Number(part) <= 4294967295));
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const record = z.object({
  id: z.string().max(64).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  version,
  title: text,
  description: text.nullable(),
  authors: z.array(text).max(16),
  license: text,
  puzzles: z.number().int().min(1).max(128),
  sha256: hash,
  fingerprint: hash,
  requires: z.literal('1.0.0'),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  verifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }),
}).strict();

export function loadPacks(input: unknown) {
  const records = z.array(record).max(128).parse(input);
  const identities = new Set<string>();
  return records.map((pack) => {
    const identity = `${pack.id}/${pack.version}`;
    if (identities.has(identity)) throw new Error('Duplicate pack version');
    identities.add(identity);
    const repository = 'https://github.com/nuggocto/orifude';
    const tag = `pack-${pack.id}-v${pack.version}`;
    const filename = `${pack.id}-${pack.version}.zip`;
    const download = `${repository}/releases/download/${tag}`;
    return {
      ...pack, filename,
      zipUrl: `${download}/${filename}`,
      checksumUrl: `${download}/SHA256SUMS`,
      releaseUrl: `${repository}/releases/tag/${tag}`,
      sourceUrl: `${repository}/tree/${pack.sourceCommit}/community/${identity}`,
    };
  });
}
