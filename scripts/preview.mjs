import { preview } from 'astro';
import { pathToFileURL } from 'node:url';
import { installerContentType, installerPaths, securityHeaders } from './security.mjs';

export async function startPreview({ root, port = 4321 } = {}) {
  const server = await preview({ root, server: { host: '127.0.0.1', port }, vite: { preview: { strictPort: true } } });
  // Astro's static-file headers omit its 404 handler. Apply the policy before routing.
  server.server.prependListener('request', (request, response) => {
    for (const [name, value] of Object.entries(securityHeaders)) response.setHeader(name, value);
    if (installerPaths.includes(new URL(request.url ?? '/', 'http://127.0.0.1').pathname)) {
      response.setHeader('Content-Type', installerContentType);
    }
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await startPreview();
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, async () => { await server.stop(); });
  }
}
