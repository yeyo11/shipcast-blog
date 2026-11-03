import type { APIRoute } from 'astro';
import { absolute } from '../lib/posts.ts';

// Every crawler is welcome; the sitemap lists every page worth indexing.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap-index.xml', site)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
