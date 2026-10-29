import type { APIRoute } from 'astro';
import { INDEXABLE } from '../site.config';

// Driven by the same constant as the <meta name="robots"> tag, so the two cannot disagree. Once
// public, every crawler is allowed, search, AI answer and AI training alike (Cloudflare's own
// blocking is checked in issue #8), and the sitemap is named.
export const GET: APIRoute = ({ site }) =>
  new Response(INDEXABLE ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site)}\n` : 'User-agent: *\nDisallow: /\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
