import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { pagesHeaders } from './security.mjs';

const output = new URL('../dist/', import.meta.url);
await writeFile(new URL('_headers', output), pagesHeaders());
for (const page of ['index.html', 'changelog/index.html', '404.html']) {
  const html = await readFile(new URL(page, output), 'utf8');
  if (/<script\b|<style\b|\sstyle=|\son[a-z]+=/i.test(html)) throw new Error(`${page} includes executable or inline content outside the static policy`);
  if (!html.includes('id="main"') || !html.includes('<h1')) throw new Error(`${page} is missing its main document structure`);
  if (/https?:\/\/(?:fonts\.googleapis|fonts\.gstatic|www\.googletagmanager)/i.test(html)) throw new Error('A remote page dependency entered the build');
}
for (const name of ['favicon.png', 'social.jpg', 'robots.txt', 'sitemap.xml', 'terminal.png', 'font-licenses.txt']) {
  if (!(await stat(new URL(name, output))).isFile()) throw new Error(`Missing public asset: ${name}`);
}
const assets = await readdir(new URL('_astro/', output));
let cssBytes = 0;
let fontBytes = 0;
for (const asset of assets) {
  const bytes = await readFile(new URL(`_astro/${asset}`, output));
  if (asset.endsWith('.js')) throw new Error('The static site unexpectedly ships JavaScript');
  if (asset.endsWith('.css')) cssBytes += gzipSync(bytes).byteLength;
  if (asset.endsWith('.woff2')) fontBytes += bytes.byteLength;
}
if (cssBytes > 30 * 1024) throw new Error('Compressed CSS exceeds 30 KiB');
if (fontBytes > 100 * 1024) throw new Error('Bundled fonts exceed 100 KiB');
console.log(`Static output verified. CSS gzip: ${cssBytes} bytes. Fonts: ${fontBytes} bytes. Application JavaScript: 0 bytes.`);
