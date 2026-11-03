// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { restactTheme } from './src/lib/shiki-theme.mjs';

// A static site: no server runtime and no adapter. Cloudflare serves `dist/` as static assets
// (see wrangler.jsonc). restact.org is the one address: canonical links, link previews, the sitemap
// and llms.txt are built from `site`. restact.dev and the www hosts 301-redirect to it (issue #7).
/* The vendored restactd docs (public/docs/) are plain files. Cloudflare and `astro preview` serve a
   folder's index.html for `/docs/x/`, but `astro dev` serves public/ files only by exact path, so
   in dev only, map a folder path under /docs to its index.html. */
const docsIndex = {
  name: 'docs-index',
  /** @param {{ middlewares: { use: (fn: (req: { url?: string }, res: unknown, next: () => void) => void) => void } }} server */
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const [path, query] = (req.url ?? '').split('?');
      if (/^\/docs(\/|$)/.test(path) && !/\.[a-z0-9]+$/i.test(path)) {
        req.url = `${path.replace(/\/?$/, '/')}index.html${query ? `?${query}` : ''}`;
      }
      next();
    });
  },
};

export default defineConfig({
  site: 'https://restact.org',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  integrations: [mdx()],
  vite: { plugins: [docsIndex] },
  markdown: {
    // The theme's colours are the site's CSS custom properties (see src/lib/shiki-theme.mjs), so
    // highlighted code follows the light/dark switch with no second theme.
    shikiConfig: { theme: restactTheme },
  },
});
