import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

// The link preview is drawn by the browser so it can use the site's own font,
// paper textures, and artwork; sharp only encodes the result.
const root = new URL('../', import.meta.url);
const file = (path) => new URL(path, root).href;
// Chromium refuses CSS masks from file URLs, so the torn edge travels inline.
const deckle = `data:image/svg+xml;base64,${(await readFile(new URL('public/paper/deckle.svg', root))).toString('base64')}`;
const work = await mkdtemp(join(tmpdir(), 'orifude-social-'));
try {
  // The wordmark artwork has wide margins; keep the same crop the header uses.
  const wordmark = join(work, 'wordmark.png');
  await sharp(new URL('src/assets/wordmark.png', root).pathname)
    .extract({ left: 520, top: 197, width: 1192, height: 313 })
    .png()
    .toFile(wordmark);
  const page = join(work, 'social.html');
  await writeFile(page, `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: Alegreya; src: url('${file('node_modules/@fontsource-variable/alegreya/files/alegreya-latin-wght-normal.woff2')}'); font-weight: 400 900; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { position: relative; background: url('${file('public/paper/dyed.svg')}'), #46503f; font-family: Alegreya, serif; color: #23271f; }
.sheet { position: absolute; inset: 34px 40px 46px; background: url('${file('public/paper/kozo.svg')}'), #f4f5ee; box-shadow: 0 24px 40px -18px rgb(14 18 10 / .6), 0 2px 6px rgb(14 18 10 / .3); }
.sheet::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 18px; background: url('${file('public/paper/dyed.svg')}'), #46503f; mask: url('${deckle}') 0 0 / 480px 18px repeat-x; }
.crease { position: absolute; top: 46px; bottom: 64px; left: 676px; border-left: 2px dashed #b3b7a6; }
.copy { position: absolute; left: 62px; top: 58px; width: 560px; }
.wordmark { display: block; width: 300px; mix-blend-mode: darken; }
h1 { margin-top: 64px; font-size: 76px; font-weight: 500; line-height: 1.02; letter-spacing: -.02em; }
p { margin-top: 26px; max-width: 520px; font-size: 28px; line-height: 1.35; color: #555a4d; text-wrap: balance; }
.courier { position: absolute; right: 26px; top: 18px; width: 470px; mix-blend-mode: darken; }
</style>
<div class="sheet">
  <div class="crease"></div>
  <div class="copy">
    <img class="wordmark" src="${pathToFileURL(wordmark).href}" alt="">
    <h1>A little ink<br>goes a long way.</h1>
    <p>A quiet, offline folding and ink puzzle for your terminal.</p>
  </div>
  <img class="courier" src="${file('src/assets/courier.png')}" alt="">
</div>`);
  const browser = await chromium.launch();
  try {
    const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await tab.goto(pathToFileURL(page).href);
    await tab.evaluate(() => document.fonts.ready);
    const failed = await tab.evaluate(() => [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).length);
    if (failed) throw new Error('The social card artwork did not load');
    if (!(await tab.evaluate(() => document.fonts.check('500 76px Alegreya')))) throw new Error('Alegreya did not load for the social card');
    const png = await tab.screenshot({ type: 'png' });
    await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(new URL('public/social.jpg', root).pathname);
  } finally {
    await browser.close();
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
console.log('Prepared the social card.');
