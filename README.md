# Shipcast blog

A starter blog for [Shipcast](https://github.com/yeyo11/shipcast), the tool that turns each GitHub
release into a blog article and a post per channel. Shipcast opens a pull request here with the
article; merging it publishes the article on this blog, and Shipcast then posts it everywhere else.

It is a static [Astro](https://astro.build) site styled with [Tailwind CSS](https://tailwindcss.com),
deployed on GitHub Pages, and it reads the files Shipcast writes exactly as Shipcast writes them:

- articles at `src/content/posts/<lang>/<slug>.md`, one per language, paired by `translationKey`;
- each launch's pieces at `launches/<project>/<ref>/` (kept in the repo, never rendered as pages);
- each launch's images at `public/launches/<project>/<ref>/`;
- articles written in Shipcast's app at `articles/<slug>/`, their images at `public/articles/<slug>/`;
- `brand.yml` (who you are) and `projects.yml` (each project's colour and cover) at the root.

What you get: a home page with the latest launch featured and a tab per project, an article page
with the project, version, repository and a **Star on GitHub** button, a page per project with its
launches and its GitHub stars, dark and light themes, a Copy button on code blocks, an RSS feed per
language, a sitemap, `robots.txt`, canonical URLs, Open Graph and Twitter cards, a 404 page and an
optional cookieless analytics hook. No JavaScript is shipped except two tiny inline scripts: the
theme toggle and code copying.

## Use this template

1. Click **Use this template > Create a new repository** on GitHub, or run:

   ```sh
   gh repo create my-launches --public --template yeyo11/shipcast-blog --clone
   ```

2. Install and run it (Node 24 and pnpm):

   ```sh
   pnpm install
   pnpm dev
   ```

## Set brand.yml

`brand.yml` says who the blog speaks for. Shipcast reads the same file, and its schema is strict, so
keep to the keys it knows:

| Key | What it is |
| --- | --- |
| `id` | Your brand's id: lowercase letters, digits and hyphens |
| `displayName` | Your name, as articles are signed |
| `site` | Where the blog is served, `https://`, no trailing slash. Shipcast links every post here |
| `github` | Your GitHub login |
| `languages.blog` | The blog's languages, ISO 639-1 codes, the primary one first. `[en]` by default |
| `handles` | Optional: your profiles as full URLs; the footer links them with `rel="me"` |
| `avatar` | Optional: a photo of you, shown beside your name |

The blog's own settings, which Shipcast does not read, are in `blog.yml`: the home page's title and
the line under it, per language, and analytics (below).

### Languages

Articles always live at `/<lang>/<slug>/`, even with one language: that is the address Shipcast
links every post to, so the URL in your posts, the canonical URL dev.to points to and the one search
engines index are the same page, with no redirect in between. With one language (the default) the
index pages sit at the root: `/`, `/projects/`, `/rss.xml`, and they link to `/en/<slug>/`.

With two or more languages (`languages: { blog: [en, es] }`), the index pages move under their
language too, `/en/…` and `/es/…`, the language versions of an article link each other and carry `hreflang`, each
language has its own feed at `/<lang>/rss.xml`, and `/` sends readers to their language. The
template's own words (buttons, labels) come in English and Spanish; add yours to `src/lib/i18n.ts`.

## Enable GitHub Pages

In your repository: **Settings > Pages > Build and deployment > Source: GitHub Actions**. The
`Deploy` workflow builds and publishes the site on every push to `main`, which includes merging a
Shipcast drafts pull request. The address and base path come from Pages itself
(`https://<you>.github.io/<repo>/`), so set `site` in `brand.yml` to that address too: it is the one
Shipcast puts in your posts.

The workflow passes its own `GITHUB_TOKEN` to the build, which only raises GitHub's rate limit for the
star counts on the project pages. Without it, or if GitHub does not answer, the counts are left out
and the build goes on. Counts under 10 are not shown.

Every pull request runs the `Check` workflow: `astro check`, the tests (every article must match the
front matter Shipcast writes) and a build.

## Connect Shipcast

In your **project's** repository (the one whose releases you want to launch), run:

```sh
npx @yeyo11/shipcast init
```

When it asks for the launches repo, give this one (`<you>/<this repo>`), and your blog's address as in
`brand.yml`. `init` writes `.github/launch.yml` and a launch workflow in the project, and a publish
workflow in this repo (it never overwrites the `brand.yml` you already have). Set the secrets it
prints, publish a release, and the drafts pull request arrives here. Merge it to publish. Shipcast's
[getting started guide](https://github.com/yeyo11/shipcast/blob/main/docs/getting-started.md) has the
details.

## Make it yours

- **The author.** Change `displayName`, `github` and `site` in `brand.yml`, and the title in `blog.yml`.
  The logo, the favicon and the default share image are drawn from your name at build time.
- **The sample article.** Delete `src/content/posts/en/hello-shipcast.md`, `public/og/` and
  `public/articles/hello-shipcast/` once your first article is in. The `shipcast` entries in
  `projects.yml` and `src/content/projects/shipcast.yml` belong to the sample too.
- **Projects.** A project appears with its first article. Its colour and cover live in `projects.yml`
  (which Shipcast also writes to, so only `colour`, `motif` and `cover` go there); what its page says
  goes in `src/content/projects/<name>.yml` (`name`, `description` per language, `repo`). Without a
  cover, a project's cover is drawn from its colour and name.

## Optional: Cloudflare Pages or a custom domain

- **A custom domain on GitHub Pages**: set it in **Settings > Pages > Custom domain**. The next deploy
  picks the new address up by itself; update `site` in `brand.yml` to match.
- **Cloudflare Pages**: create a Pages project from this repository with the build command
  `pnpm build`, the output directory `dist` and the environment variable `SITE_URL` set to your
  address (for example `https://blog.example.com`). Cloudflare Workers static assets work the same way
  with `wrangler deploy` serving `dist/`. You can then delete `.github/workflows/deploy.yml`.

## Optional: analytics

Off by default. Pick a cookieless provider in `blog.yml`; its script loads only in production builds:

```yaml
analytics:
  provider: umami        # or plausible, or cloudflare
  websiteId: 00000000-0000-0000-0000-000000000000
  src: https://cloud.umami.is/script.js   # your instance's script, if you host Umami
```

Plausible takes `domain` (and `src` for a self-hosted instance); Cloudflare Web Analytics takes
`token`, or reads `analytics.cloudflareWebAnalytics` from `brand.yml`, the one analytics key
Shipcast's schema knows. The Star on GitHub buttons carry a `data-umami-event` attribute, so Umami
counts their clicks with no extra code.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | The site at `localhost:4321`, drafts included |
| `pnpm build` | The static site in `dist/` |
| `pnpm preview` | Serves `dist/` locally |
| `pnpm check` | `astro check` |
| `pnpm test` | The contract tests: articles, `brand.yml`, `projects.yml`, and a build of real Shipcast articles from `test/fixtures/` |

`SKIP_GITHUB=1 pnpm build` skips the star counts, for a build without network.

## If it helps you

If Shipcast or this template saves you time, a [star on Shipcast](https://github.com/yeyo11/shipcast)
helps other developers find it.

## Credits

- The layout follows the [Raycast blog](https://www.raycast.com/blog), in Shipcast's yellow and black.
- Type: [Phudu](https://fontsource.org/fonts/phudu), [Inter Tight](https://fontsource.org/fonts/inter-tight)
  and [JetBrains Mono](https://fontsource.org/fonts/jetbrains-mono), all under the SIL Open Font
  License, through [Fontsource](https://fontsource.org).
- Code highlighting by [Shiki](https://shiki.style); the GitHub mark from [Simple Icons](https://simpleicons.org) (CC0).
- Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com).

## License

[MIT](LICENSE)
