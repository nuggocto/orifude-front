import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = 'http://127.0.0.1:4321';
const output = new URL('../.preview/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const report = {
  date: new Date().toISOString(), browser: browser.version(),
  indexSha256: createHash('sha256').update(await readFile(new URL('../dist/index.html', import.meta.url))).digest('hex'),
  conditions: { samples: 5, latencyMs: 150, downloadBytesPerSecond: 200_000, uploadBytesPerSecond: 93_750, cpuSlowdown: 4 },
  measurements: [],
};
try {
  for (const [name, viewport, scale] of [['desktop', { width: 1440, height: 1000 }, 1], ['mobile', { width: 390, height: 844 }, 2]]) {
    for (let sample = 0; sample < report.conditions.samples; sample++) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: scale });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(15_000);
        const session = await context.newCDPSession(page);
        await session.send('Network.enable');
        await session.send('Network.setCacheDisabled', { cacheDisabled: true });
        await session.send('Network.emulateNetworkConditions', { offline: false, latency: report.conditions.latencyMs, downloadThroughput: report.conditions.downloadBytesPerSecond, uploadThroughput: report.conditions.uploadBytesPerSecond });
        await session.send('Emulation.setCPUThrottlingRate', { rate: report.conditions.cpuSlowdown });
        await page.addInitScript(() => {
          window.__paperMeasurement = { lcp: 0, cls: 0 };
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) window.__paperMeasurement.lcp = entry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__paperMeasurement.cls += entry.value;
          }).observe({ type: 'layout-shift', buffered: true });
        });
        await page.goto(base);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const measured = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const resources = performance.getEntriesByType('resource');
          return {
            ...window.__paperMeasurement,
            fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
            bodyBytes: navigation.encodedBodySize + resources.reduce((sum, resource) => sum + resource.encodedBodySize, 0),
            requests: resources.length + 1,
          };
        });
        if (!measured.lcp || measured.bodyBytes > 500 * 1024) throw new Error('Missing paint timing or page exceeds 500 KiB');
        report.measurements.push({ name, sample: sample + 1, ...measured });
        console.log(`${name} ${sample + 1}: LCP ${measured.lcp} ms; CLS ${measured.cls.toFixed(4)}; ${measured.bodyBytes} bytes.`);
      } finally { await context.close(); }
    }
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    try {
      const page = await context.newPage();
      for (const [path, label] of [['/', 'home'], ['/changelog/', 'changelog'], ['/no-such-paper/', 'missing']]) {
        await page.goto(`${base}${path}`);
        await page.evaluate(() => document.fonts.ready);
        for (const image of await page.locator('img').all()) {
          await image.scrollIntoViewIfNeeded();
          await image.evaluate((element) => element.decode());
        }
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: new URL(`${label}-${name}.png`, output).pathname, fullPage: true });
        if (label === 'home') await page.screenshot({ path: new URL(`hero-${name}.png`, output).pathname });
      }
    } finally { await context.close(); }
  }
  await writeFile(new URL('measurements.json', output), `${JSON.stringify(report, null, 2)}\n`);
} finally { await browser.close(); }
