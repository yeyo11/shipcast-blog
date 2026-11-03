import type { APIRoute, GetStaticPaths } from 'astro';
import { feed } from '../../lib/feed.ts';
import { languages, multilingual } from '../../lib/site.ts';

// Each language's feed, when the blog has several (one language has only /rss.xml)
export const getStaticPaths = (() => (multilingual ? languages.map((lang) => ({ params: { lang } })) : [])) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params, site }) => feed(params.lang ?? 'en', site);
