import type { APIRoute } from 'astro';
import { tileSvg } from '../lib/art.ts';
import { brand } from '../lib/site.ts';

// Your initials on the yellow tile, drawn from brand.yml's displayName
export const GET: APIRoute = () => new Response(tileSvg(brand.displayName), { headers: { 'Content-Type': 'image/svg+xml' } });
