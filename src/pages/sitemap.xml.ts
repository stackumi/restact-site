import type { APIRoute } from 'astro';

// Every page of the site, absolute on `site` (restact.org). The list comes from the page files, so
// a new page joins it with no edit here; the 404 page and endpoints like this one are left out.
// No <lastmod>: search engines ignore one that is not exact, and the pages carry no edit date.
const files = Object.keys(import.meta.glob('./**/*.{astro,md,mdx}'));

export const GET: APIRoute = ({ site }) => {
  const paths = files
    .map((f) => f.replace(/^\.\//, '').replace(/\.(astro|mdx?)$/, ''))
    .filter((p) => p !== '404' && !p.split('/').some((s) => s.startsWith('_') || s.startsWith('[')))
    .map((p) => (p === 'index' ? '/' : `/${p.replace(/\/?index$/, '')}/`))
    .sort();
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
