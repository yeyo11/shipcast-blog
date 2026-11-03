import type { APIRoute, GetStaticPaths } from 'astro';
import { inPublic, toWebp } from '../../lib/images.ts';
import { allPosts, allProjects } from '../../lib/posts.ts';

// A WebP copy of every cover a page shows (src/lib/images.ts)
export const getStaticPaths = (async () => {
  const posts = await allPosts();
  const projects = await allProjects();
  const paths = new Set<string>();
  for (const post of posts) for (const path of [post.entry.data.cover, post.entry.data.image]) if (path) paths.add(path);
  for (const project of projects) if (project.cover) paths.add(project.cover);
  return [...paths].filter(inPublic).map((path) => ({ params: { file: `${path.slice(1)}.webp` }, props: { path } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const body = await toWebp((props as { path: string }).path);
  return new Response(new Uint8Array(body), { headers: { 'Content-Type': 'image/webp' } });
};
