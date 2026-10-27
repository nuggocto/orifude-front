import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const copyScriptIntegrity = `sha256-${createHash('sha256').update(readFileSync(new URL('../public/copy-command.js', import.meta.url))).digest('base64')}`;

export const securityHeaders = {
  // Keep Cloudflare from injecting bot-detection scripts into the static pages.
  'Cache-Control': 'public, max-age=0, must-revalidate, no-transform',
  'Content-Security-Policy': `default-src 'none'; img-src 'self'; style-src 'self'; font-src 'self'; script-src '${copyScriptIntegrity}'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'`,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

// Installers are read by curl and Invoke-RestMethod; plain text keeps irm returning a string.
export const installerPaths = ['/install.sh', '/install.ps1'];
export const installerContentType = 'text/plain; charset=utf-8';

export function pagesHeaders() {
  const lines = Object.entries(securityHeaders).map(([name, value]) => `  ${name}: ${value}`);
  const installers = installerPaths.map((path) => `${path}\n  Content-Type: ${installerContentType}\n`).join('\n');
  return `/*\n${lines.join('\n')}\n\n${installers}\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex\n\nhttps://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex\n`;
}
