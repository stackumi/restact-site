import type { APIRoute } from 'astro';
import { INDEXABLE } from '../site.config';

// Driven by the same constant as the <meta name="robots"> tag, so the two cannot disagree.
export const GET: APIRoute = () =>
  new Response(INDEXABLE ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
