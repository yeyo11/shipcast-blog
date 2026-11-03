// The shapes of the files Shipcast writes into this repo, in one place: the content collection, the
// site's settings and the tests all read them from here. Plain zod (no astro: imports), so the tests
// can load it with Node alone.
import { z } from 'astro/zod';

/** An ISO 639-1 code: two lowercase letters, any language (Shipcast takes any) */
export const Language = z.string().regex(/^[a-z]{2}$/, 'a language is an ISO 639-1 code: two lowercase letters');

/**
 * An article's front matter, exactly as Shipcast writes it at src/content/posts/<lang>/<slug>.md.
 * Shipcast's own writer is renderDrafts in packages/engine/src/drafts.ts; the contract is
 * docs/launches-repo.md. Unknown keys are kept out of the page but never fail the build.
 */
export const PostFrontMatter = z.object({
  title: z.string().min(1),
  description: z.string().max(200),
  pubDate: z.coerce.date(),
  // Set when an article is edited after publishing
  updatedDate: z.coerce.date().optional(),
  lang: Language,
  // Shared by every language version of one article: how translations find each other
  translationKey: z.string().min(1),
  // The launched project's repository; an article written in Shipcast's app has none
  repo: z.url().optional(),
  // The release that triggered the launch, e.g. v1.2.0
  version: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  // The launch image Shipcast renders into public/launches/<project>/<ref>/: the page's og:image
  image: z.string().startsWith('/', 'an image is a site path, starting with /').optional(),
  imageAlt: z.string().optional(),
  // A drawn cover for this article; without one, the project's cover or a generated one
  cover: z.string().startsWith('/', 'a cover is a site path, starting with /').optional(),
  coverAlt: z.string().optional(),
});
export type PostFrontMatter = z.infer<typeof PostFrontMatter>;

/** The motifs Shipcast draws a project's images with */
export const MOTIFS = ['phone', 'terminal', 'label', 'wave', 'orb', 'stack'] as const;

/**
 * projects.yml, as Shipcast validates it (ProjectLook in packages/schema/src/projects.ts): strict, so
 * a key Shipcast does not know would make every launch fail. Anything else a project page needs
 * lives in src/content/projects/.
 */
export const ProjectLook = z.strictObject({
  colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'a colour is #RRGGBB'),
  motif: z.enum(MOTIFS),
  cover: z.string().startsWith('/', 'a cover is a site path, starting with /').optional(),
});
export const Projects = z.record(z.string().regex(/^[a-z0-9._-]+$/, 'a project is listed by its lowercase name'), ProjectLook);
export type Projects = z.infer<typeof Projects>;
export type ProjectLook = z.infer<typeof ProjectLook>;

/**
 * The part of brand.yml the blog reads. Shipcast's schema (packages/schema/src/brand.ts) is the strict
 * one; this one only checks what the site relies on and lets the rest through.
 */
export const BrandSite = z.object({
  id: z.string(),
  displayName: z.string().min(1),
  site: z.url({ protocol: /^https$/, error: 'the site is its full https:// URL' }),
  github: z.string().regex(/^[A-Za-z0-9-]+$/, 'a GitHub login, without the URL'),
  handles: z.record(z.string(), z.url()).nullish(),
  languages: z
    .object({
      blog: z
        .array(Language)
        .min(1)
        .refine((l) => new Set(l).size === l.length, 'a language is listed once')
        .default(['en']),
    })
    .prefault({}),
  avatar: z.url().optional(),
  support: z.url().optional(),
  analytics: z.object({ cloudflareWebAnalytics: z.string().regex(/^[0-9a-f]{32}$/).optional() }).prefault({}),
});
export type BrandSite = z.infer<typeof BrandSite>;

const perLanguage = z.record(Language, z.string());

/** blog.yml: the site's own settings, which Shipcast never reads */
export const BlogSettings = z.object({
  title: perLanguage.default({ en: 'Launches' }),
  description: perLanguage.default({}),
  analytics: z
    .discriminatedUnion('provider', [
      z.object({ provider: z.literal('none') }),
      z.object({ provider: z.literal('umami'), websiteId: z.uuid(), src: z.url().default('https://cloud.umami.is/script.js') }),
      z.object({ provider: z.literal('plausible'), domain: z.string().min(1), src: z.url().default('https://plausible.io/js/script.js') }),
      z.object({ provider: z.literal('cloudflare'), token: z.string().regex(/^[0-9a-f]{32}$/).optional() }),
    ])
    .default({ provider: 'none' }),
});
export type BlogSettings = z.infer<typeof BlogSettings>;
