import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { rehypeArticle, rehypeBasePaths } from './src/markdown/rehype.ts';
import { languages, multilingual, siteAndBase } from './src/lib/site.ts';

// Where the site is served: SITE_URL (the GitHub Pages deploy sets it to the address Pages gives the
// repo), else brand.yml's `site`. A project site such as https://you.github.io/blog/ gets base /blog.
const { site, base } = siteAndBase();
const root = `${site}${base === '/' ? '' : base}`;

// Pages that only send the reader elsewhere stay out of the sitemap: the language picker at / when
// there are several languages, and the /<lang>/<slug>/ addresses Shipcast links to when there is one
// (each is a redirect to the article's own address, see src/pages/[...route].astro)
function inSitemap(page: string): boolean {
  if (multilingual) return page !== `${root}/`;
  return !page.startsWith(`${root}/${languages[0]}/`);
}

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  // OUT_DIR is for the contract test, which builds its fixtures elsewhere
  ...(process.env.OUT_DIR && { outDir: process.env.OUT_DIR }),
  build: {
    // One request per page: the CSS is small and inlining it keeps the first paint fast
    inlineStylesheets: 'always',
  },
  integrations: [sitemap({ filter: inSitemap })],
  markdown: {
    // Both code themes ship as CSS variables, and the page's theme picks one (src/styles/global.css)
    shikiConfig: {
      themes: { light: 'github-light-default', dark: 'github-dark-default' },
      defaultColor: false,
      wrap: false,
    },
    // The unified (remark/rehype) processor, for the two rehype passes in src/markdown/rehype.ts
    processor: unified({ rehypePlugins: [rehypeBasePaths(base), rehypeArticle] }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
