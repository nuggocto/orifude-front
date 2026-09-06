export const securityHeaders = {
  // Keep Cloudflare from injecting bot-detection scripts into the static pages.
  'Cache-Control': 'public, max-age=0, must-revalidate, no-transform',
  'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'self'; font-src 'self'; script-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

export function pagesHeaders() {
  const lines = Object.entries(securityHeaders).map(([name, value]) => `  ${name}: ${value}`);
  return `/*\n${lines.join('\n')}\n\nhttps://:project.pages.dev/*\n  X-Robots-Tag: noindex\n\nhttps://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex\n`;
}
