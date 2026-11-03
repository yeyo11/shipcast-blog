import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { PostFrontMatter } from './lib/schema.ts';

// One Markdown file per article and language, src/content/posts/<lang>/<slug>.md, as Shipcast writes
// it in a drafts pull request: merging the pull request is what publishes it. The slug is the file's
// name. (POSTS_DIR points the collection elsewhere; only the contract test uses it.)
const posts = defineCollection({
  loader: glob({
    pattern: '*/*.md',
    base: process.env.POSTS_DIR ?? './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: PostFrontMatter,
});

// What a project's page says about it: one optional file per project, src/content/projects/<name>.yml,
// named as in projects.yml. Kept apart from projects.yml, which Shipcast validates strictly.
const projects = defineCollection({
  loader: glob({ pattern: '*.{yml,yaml}', base: './src/content/projects' }),
  schema: z.object({
    /** The name as written, when it is not just the repo's: "Shipcast" for shipcast */
    name: z.string().optional(),
    /** A sentence or two on what it is, per language code; a language left out takes the first */
    description: z.record(z.string(), z.string()).optional(),
    /** The repository, when no article of the project names it */
    repo: z.url().optional(),
  }),
});

export const collections = { posts, projects };
