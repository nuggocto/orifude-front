import { readFile, writeFile, copyFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const asset = (name) => new URL(`src/assets/${name}`, root);
const publicFile = (name) => new URL(`public/${name}`, root);
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// The text comes directly from the reviewed native recording, not a web imitation.
const recording = (await readFile(new URL('src/content/journey.cast', root), 'utf8')).trim().split('\n').map(JSON.parse);
const event = recording.find((event) => Array.isArray(event) && event[0] === 4.5 && event[1] === 'o');
if (!event) throw new Error('The reviewed ink frame is missing');
const rows = event[2].replace(/\u001b\[[0-9;]*[A-Za-z]/g, '').replaceAll('\r', '').replace(/^\n+|\n+$/g, '').split('\n');
if (rows.length > 32 || rows.some((row) => [...row].length > 82)) throw new Error('The terminal capture exceeds its frame bounds');
const width = 1280;
const height = rows.length * 30 + 70;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#222a22"/><g fill="#e9e9d9" font-family="JetBrainsMono Nerd Font,monospace" font-size="24">${rows.map((row, index) => `<text xml:space="preserve" x="40" y="${54 + index * 30}">${escape(row)}</text>`).join('')}</g></svg>`;
await sharp(Buffer.from(svg)).png().toFile(asset('terminal.png').pathname);
await copyFile(asset('terminal.png'), publicFile('terminal.png'));
for (const [name, size] of [['favicon.png', 64], ['apple-touch-icon.png', 180]]) {
  await sharp(asset('icon.png').pathname).resize(size, size).png().toFile(publicFile(name).pathname);
}
const licenses = await Promise.all(['@fontsource-variable/alegreya'].map(async (font) => {
  const license = await readFile(new URL(`node_modules/${font}/LICENSE`, root), 'utf8');
  return `${font}\n${license}`;
}));
await writeFile(publicFile('font-licenses.txt'), licenses.join('\n\n'));
console.log('Prepared the icons, native recording still, and font credits. Run scripts/prepare-social.mjs for the link preview.');
