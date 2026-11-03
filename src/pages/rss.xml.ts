import type { APIRoute } from 'astro';
import { feed } from '../lib/feed.ts';
import { primaryLanguage } from '../lib/site.ts';

// The primary language's feed. With several languages each also has its own, at /<lang>/rss.xml.
export const GET: APIRoute = ({ site }) => feed(primaryLanguage, site);
