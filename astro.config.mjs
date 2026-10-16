// @ts-check
import { defineConfig } from 'astro/config';

// A static site: one page, no server runtime and no adapter. Cloudflare serves `dist/` as static
// assets (see wrangler.jsonc), on both restact.org and restact.dev.
export default defineConfig({
  output: 'static',
  build: { inlineStylesheets: 'always' },
});
