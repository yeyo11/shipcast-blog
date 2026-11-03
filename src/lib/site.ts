// The site's settings, read once at build time from the three files at the repo's root: brand.yml
// (who), blog.yml (how the site presents itself) and projects.yml (each project's look). A file that
// does not validate stops the build with the reason, before any page is rendered.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { BlogSettings, BrandSite, Projects, type ProjectLook } from './schema.ts';

function load<T>(file: string, schema: { safeParse(data: unknown): { success: true; data: T } | { success: false; error: { issues: Array<{ path: PropertyKey[]; message: string }> } } }): T {
  const text = readFileSync(join(process.cwd(), file), 'utf8');
  const result = schema.safeParse(parse(text) ?? {});
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.map(String).join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`${file} is not valid:\n${issues}`);
  }
  return result.data;
}

export const brand: BrandSite = load('brand.yml', BrandSite);
export const blog: BlogSettings = load('blog.yml', BlogSettings);
export const projects: Projects = load('projects.yml', Projects);

/** The blog's languages, the primary one first */
export const languages: string[] = brand.languages.blog;
export const primaryLanguage: string = languages[0] ?? 'en';
/** With several languages every page lives under /<lang>/; with one, no page has a prefix */
export const multilingual: boolean = languages.length > 1;

export const githubProfile = `https://github.com/${brand.github}`;

/** A per-language setting from blog.yml: the language's own, else the first one given */
export function localized(values: Record<string, string>, lang: string): string | undefined {
  return values[lang] ?? Object.values(values)[0];
}

/**
 * Where the site is served: `site` is the origin and `base` the path under it. The GitHub Pages
 * deploy passes the address Pages gives the repo (SITE_URL); anywhere else it is brand.yml's `site`.
 * https://you.github.io/blog becomes site https://you.github.io and base /blog.
 */
export function siteAndBase(env: Record<string, string | undefined> = process.env): { site: string; base: string } {
  const url = new URL(env.SITE_URL || brand.site);
  const path = url.pathname.replace(/\/+$/, '');
  return { site: url.origin, base: path === '' ? '/' : path };
}

const SPARE_COLOURS = ['#FF6FAE', '#FF7A2F', '#7C8CFF', '#FF5A4A'];
const SPARE_MOTIFS = ['wave', 'orb', 'stack', 'terminal'] as const;

// Shipcast's own hash (lookOf in packages/schema/src/projects.ts), so a project not listed wears the
// same colour here as in the images Shipcast draws for it
function hash(text: string): number {
  let h = 0;
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

/** A project's look: the one projects.yml lists, else a colour and motif picked from its name */
export function lookOf(project: string): ProjectLook {
  const name = project.toLowerCase();
  const known = Object.hasOwn(projects, name) ? projects[name] : undefined;
  if (known) return known;
  return {
    colour: SPARE_COLOURS[hash(name) % SPARE_COLOURS.length] ?? '#FF6FAE',
    motif: SPARE_MOTIFS[hash(`${name}:motif`) % SPARE_MOTIFS.length] ?? 'orb',
  };
}

/** `https://github.com/owner/name` → `owner/name`; anything not on github.com gives undefined */
export function githubSlug(repo: string | undefined): string | undefined {
  if (!repo) return undefined;
  try {
    const url = new URL(repo);
    if (url.hostname !== 'github.com') return undefined;
    const [owner, name] = url.pathname.split('/').filter(Boolean);
    return owner && name ? `${owner}/${name.replace(/\.git$/, '')}` : undefined;
  } catch {
    return undefined;
  }
}

/** The project an article launches: its repo's name, lowercase, as Shipcast keys projects.yml */
export function projectOfRepo(repo: string | undefined): string | undefined {
  if (!repo) return undefined;
  try {
    const name = new URL(repo).pathname.split('/').filter(Boolean).pop();
    return name ? name.replace(/\.git$/, '').toLowerCase() : undefined;
  } catch {
    return undefined;
  }
}
