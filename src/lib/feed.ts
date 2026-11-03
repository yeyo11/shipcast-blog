// One RSS feed per language, with each article's description (the full text stays on the site).
import rss from '@astrojs/rss';
import { absolute, postPath, postsIn } from './posts.ts';
import { blog, brand, localized } from './site.ts';

export async function feed(lang: string, site: URL | undefined): Promise<Response> {
  const posts = await postsIn(lang);
  const title = localized(blog.title, lang) ?? brand.displayName;
  return rss({
    title: `${title} | ${brand.displayName}`,
    description: localized(blog.description, lang) ?? title,
    site: absolute('/', site),
    customData: `<language>${lang}</language>`,
    items: posts.map((post) => ({
      title: post.entry.data.title,
      description: post.entry.data.description,
      pubDate: post.entry.data.pubDate,
      link: absolute(postPath(post), site),
      categories: post.entry.data.tags,
      author: brand.displayName,
    })),
  });
}
