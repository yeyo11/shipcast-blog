import type { APIRoute } from 'astro';
import { shareCardPng } from '../lib/art.ts';
import { blog, brand, localized, primaryLanguage } from '../lib/site.ts';

// The share card of every page without an image of its own: the blog's title and your name
export const GET: APIRoute = async () => {
  const png = await shareCardPng(localized(blog.title, primaryLanguage) ?? 'Launches', brand.displayName);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
