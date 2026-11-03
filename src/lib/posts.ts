// The articles and projects as the pages see them, and every path the site links to.
import { getCollection, type CollectionEntry } from 'astro:content';
import { githubSlug, languages, lookOf, multilingual, projectOfRepo } from './site.ts';

export type PostEntry = CollectionEntry<'posts'>;

export interface Post {
  entry: PostEntry;
  /** The file's name: the article's address in its language */
  slug: string;
  lang: string;
  /** The project it launches, from its repo; an article written in Shipcast's app has none */
  project?: string;
}

// Paths that pages own, so no article may take them
const RESERVED = new Set(['projects', 'rss', 'rss.xml', '404', 'robots.txt', 'sitemap-index.xml', ...languages]);

let cache: Promise<Post[]> | undefined;

/**
 * Every article to publish, newest first: drafts only in `astro dev`, and only the languages
 * brand.yml lists (a file in another language waits there, unpublished, as Shipcast leaves it).
 */
export function allPosts(): Promise<Post[]> {
  cache ??= getCollection('posts').then((entries) => {
    const posts: Post[] = [];
    for (const entry of entries) {
      const [lang, slug] = entry.id.split('/');
      if (!lang || !slug) continue;
      if (lang !== entry.data.lang) throw new Error(`src/content/posts/${entry.id}.md: its folder says ${lang} and its front matter lang: ${entry.data.lang}`);
      if (!languages.includes(lang)) continue;
      if (entry.data.draft && import.meta.env.PROD) continue;
      if (RESERVED.has(slug)) throw new Error(`src/content/posts/${entry.id}.md: "${slug}" is a path the site already uses; rename the file`);
      const project = projectOfRepo(entry.data.repo);
      posts.push({ entry, slug, lang, ...(project && { project }) });
    }
    return posts.sort((a, b) => b.entry.data.pubDate.getTime() - a.entry.data.pubDate.getTime() || a.slug.localeCompare(b.slug));
  });
  return cache;
}

export async function postsIn(lang: string): Promise<Post[]> {
  return (await allPosts()).filter((p) => p.lang === lang);
}

/** The other language versions of an article, paired by translationKey */
export async function translationsOf(post: Post): Promise<Post[]> {
  return (await allPosts()).filter((p) => p !== post && p.entry.data.translationKey === post.entry.data.translationKey);
}

export interface Project {
  /** The key: the repo's name, lowercase */
  id: string;
  name: string;
  colour: string;
  cover?: string;
  repo?: string;
  /** owner/name, when the repo is on GitHub */
  github?: string;
  description?: Record<string, string>;
}

/** Every project with at least one article in any language, plus those described in src/content/projects */
export async function allProjects(): Promise<Project[]> {
  const posts = await allPosts();
  const described = await getCollection('projects');
  const ids = new Set<string>([...posts.flatMap((p) => (p.project ? [p.project] : [])), ...described.map((d) => d.id)]);
  return [...ids].sort().map((id) => {
    const info = described.find((d) => d.id === id)?.data;
    const look = lookOf(id);
    // The newest article that names a repo says where the project lives
    const repo = info?.repo ?? posts.find((p) => p.project === id && p.entry.data.repo)?.entry.data.repo;
    const github = githubSlug(repo);
    return {
      id,
      name: info?.name ?? id,
      colour: look.colour,
      ...(look.cover && { cover: look.cover }),
      ...(repo && { repo }),
      ...(github && { github }),
      ...(info?.description && { description: info.description }),
    };
  });
}

export async function projectById(id: string | undefined): Promise<Project | undefined> {
  if (!id) return undefined;
  return (await allProjects()).find((p) => p.id === id);
}

// Paths, before the base: '/', '/en/', '/en/my-article/'

export const prefix = (lang: string): string => (multilingual ? `/${lang}` : '');
export const homePath = (lang: string): string => `${prefix(lang)}/`;
export const postPath = (post: Pick<Post, 'lang' | 'slug'>): string => `${prefix(post.lang)}/${post.slug}/`;
export const projectsPath = (lang: string): string => `${prefix(lang)}/projects/`;
export const projectPath = (lang: string, id: string): string => `${prefix(lang)}/projects/${id}/`;
export const rssPath = (lang: string): string => `${prefix(lang)}/rss.xml`;

/** A site path with the base in front, for an href or a src: /blog + /my-article/ */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** An absolute URL on the site, for canonical links, feeds and Open Graph */
export function absolute(path: string, site: URL | undefined): string {
  return new URL(href(path), site).toString();
}
