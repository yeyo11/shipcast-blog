---
title: "Shipcast turns each GitHub release into an article and a post per channel"
description: "Publish a release and Shipcast reads the code at that tag, writes the blog article and a post for each channel, and publishes every piece once. This blog is where those articles land."
pubDate: 2026-11-03
lang: en
translationKey: hello-shipcast
repo: https://github.com/yeyo11/shipcast
version: v0.3.0
tags: [shipcast, launch]
image: /og/hello-shipcast.png
imageAlt: "Shipcast's logo beside the title of this article, on the blog's cover background"
---

Every time I published a release, the code was the easy part. Then came the article, the dev.to copy, a post for Bluesky, another for Mastodon, the newsletter: the same announcement written ten times, each one within its own limits. I built Shipcast to launch my own projects without doing that, and this blog is where its articles land.

## What happens when you publish a release

Shipcast reads the project's code at the release's tag, not just its README, and writes the blog article and a post for each channel you turned on. While it reads, it separates what is implemented from what is only planned or claimed by the docs, and only the implemented part is presented as working.

![A GitHub release goes into Shipcast, which reads the code at that tag and opens a drafts pull request in the launches repo; merging it publishes the article on the blog and then a post on each channel, every link pointing back to the article](/articles/hello-shipcast/flow.png)

The drafts arrive as one pull request in your launches repo, which is also this blog's source. You read them, edit whatever you like and merge. The merge publishes the article; every other channel goes out once the article is live.

## Run it as a GitHub Action

There is nothing to host: the Action runs in your project's repo with your own Anthropic, OpenAI or OpenAI-compatible key. With Node 24, from your project's checkout:

```bash
# your-project/
npx @yeyo11/shipcast init
```

It asks for your launches repo, your blog's address, your name, the blog's languages, your tone, the AI and the channels. Then it writes `.github/launch.yml` and a launch workflow in the project, `brand.yml` and a publish workflow in the launches repo, and prints every secret you need to set with the link to get it. It never writes a secret itself.

`.github/launch.yml` is how a project opts in. Each channel gets a mode: `approval` (published when you merge), `auto` or `off`:

```yaml
# .github/launch.yml
enabled: true
brand: personal
publishing:
  blog: approval
  devto: approval
  bluesky: approval
  mastodon: off
```

Commit the files, set the secrets and publish a release. In a few minutes the drafts pull request is in your launches repo, with the article in each of your blog's languages, one draft per channel and the launch's images. Merge it and everything goes out. Close it and nothing does.

> **Try it without publishing anything.** Set the variable `SHIPCAST_DRY_RUN=true` in both repos. The launch then says which AI it would draft with and where the pull request would go, and the publish step lists each channel with its mode and whether it would publish or is missing a secret.

## Self-host it with an app

If you'd rather review in an app than in a pull request, Shipcast also runs on a machine of yours, with Node 24 and Docker for Postgres. The app adds what an Action can't keep between runs: scheduling, stats by channel and launch, the comments under your posts with a reply drafted from the code, and the networks that sign in through OAuth. You can also write an article in your own words there, and Shipcast translates it and writes each channel's piece. The install is in the [README](https://github.com/yeyo11/shipcast#quick-start).

## Where it publishes

- **Blog**: the article in each language, committed by the merge.
- **dev.to and Hashnode**: the English article, republished with your blog as the canonical URL.
- **Bluesky, Mastodon, Telegram, Discord and GitHub Discussions**: a post linking the article, straight from the Action.
- **Instagram and the newsletter (Brevo)**: in the Action too, once you add their secrets to the publish workflow by hand.
- **LinkedIn, Threads, Reddit and YouTube**: self-hosted, because they sign in through the app.

Every link to your blog goes out with UTM tags naming the network and the launch, so you can see which channel brought each visit. And a release is launched once: Shipcast records it on the launches repo's `shipcast-state` branch, so a re-run or a second workflow for the same tag does nothing.

## How this blog fits in

This template follows Shipcast's article contract. Shipcast writes each article as Markdown at `src/content/posts/<lang>/<slug>.md`, with the same front matter this one has (`title`, `description`, `pubDate`, `lang`, `translationKey`, `repo`, `tags`, `image`), and the template's content collection reads it as it is. The first drafts pull request you merge lands here with no changes.

The blog's languages come from `brand.yml`, English by default. The `translationKey` ties the versions of one article together when you write in more than one.

## Your turn

Shipcast is MIT-licensed and lives at [github.com/yeyo11/shipcast](https://github.com/yeyo11/shipcast). If it saves you from writing the same announcement ten times, a star helps other developers find it.

Then replace this article with your own first launch: run `init`, publish a release and merge the pull request.

*This is the template's sample article. Delete `src/content/posts/en/hello-shipcast.md` when your first article is in.*
