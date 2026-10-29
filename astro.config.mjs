// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { restactTheme } from './src/lib/shiki-theme.mjs';

// A static site: no server runtime and no adapter. Cloudflare serves `dist/` as static assets
// (see wrangler.jsonc). restact.org is the one address: canonical links, link previews, the sitemap
// and llms.txt are built from `site`. restact.dev and the www hosts redirect to it (issue #7).
export default defineConfig({
  site: 'https://restact.org',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  integrations: [mdx()],
  markdown: {
    // The theme's colours are the site's CSS custom properties (see src/lib/shiki-theme.mjs), so
    // highlighted code follows the light/dark switch with no second theme.
    shikiConfig: { theme: restactTheme },
  },
});
