import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://orifude.com',
  output: 'static',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'never' },
  devToolbar: { enabled: false },
});
