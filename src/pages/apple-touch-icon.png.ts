import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { tileSvg } from '../lib/art.ts';
import { brand } from '../lib/site.ts';

export const GET: APIRoute = async () => {
  const png = await sharp(Buffer.from(tileSvg(brand.displayName)), { density: 300 }).resize(180, 180).flatten({ background: '#141413' }).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
