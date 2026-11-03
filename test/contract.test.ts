// The contract with Shipcast: every article it writes, and the repo's own files it reads, are valid
// here; and a build accepts real articles as Shipcast wrote them (test/fixtures/posts).
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { parse } from 'yaml';
import { BrandSite, PostFrontMatter, Projects } from '../src/lib/schema.ts';

const root = join(import.meta.dirname, '..');

function frontMatter(file: string): unknown {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, 'utf8'));
  assert.ok(match, `${file} has no front matter`);
  return parse(match[1]!);
}

function articles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((lang) =>
    lang.isDirectory() ? readdirSync(join(dir, lang.name)).filter((f) => f.endsWith('.md')).map((f) => join(dir, lang.name, f)) : [],
  );
}

const posts = articles(join(root, 'src/content/posts'));
const fixtures = articles(join(root, 'test/fixtures/posts'));

test('every article under src/content/posts validates against the front matter Shipcast writes', () => {
  for (const file of posts) {
    const result = PostFrontMatter.safeParse(frontMatter(file));
    assert.ok(result.success, `${file}: ${result.success ? '' : JSON.stringify(result.error.issues)}`);
    const lang = file.split('/').at(-2);
    assert.equal(result.data.lang, lang, `${file}: lang must match its folder`);
  }
});

test('the fixtures, copied from articles Shipcast wrote, validate', () => {
  assert.ok(fixtures.length >= 2);
  for (const file of fixtures) {
    const result = PostFrontMatter.safeParse(frontMatter(file));
    assert.ok(result.success, `${file}: ${result.success ? '' : JSON.stringify(result.error.issues)}`);
  }
});

test('a description over 200 characters is refused, as Shipcast refuses it', () => {
  const base = { title: 't', pubDate: '2026-11-03', lang: 'en', translationKey: 'k', tags: [] };
  assert.equal(PostFrontMatter.safeParse({ ...base, description: 'x'.repeat(200) }).success, true);
  assert.equal(PostFrontMatter.safeParse({ ...base, description: 'x'.repeat(201) }).success, false);
});

test('projects.yml is strictly valid for Shipcast: colour, motif and cover only', () => {
  const result = Projects.safeParse(parse(readFileSync(join(root, 'projects.yml'), 'utf8')) ?? {});
  assert.ok(result.success, result.success ? '' : JSON.stringify(result.error.issues));
  assert.equal(Projects.safeParse({ x: { colour: '#FFD43B', motif: 'label', tagline: 'no' } }).success, false);
});

test('brand.yml holds only keys Shipcast knows (its schema is strict)', () => {
  const brand = parse(readFileSync(join(root, 'brand.yml'), 'utf8')) as Record<string, unknown>;
  assert.ok(BrandSite.safeParse(brand).success);
  const known = ['id', 'displayName', 'site', 'github', 'handles', 'languages', 'tone', 'support', 'avatar', 'newsletter', 'analytics'];
  for (const key of Object.keys(brand)) assert.ok(known.includes(key), `brand.yml: Shipcast does not know "${key}"`);
  const analytics = (brand.analytics ?? {}) as Record<string, unknown>;
  for (const key of Object.keys(analytics)) assert.equal(key, 'cloudflareWebAnalytics', `brand.yml: analytics.${key} belongs in blog.yml`);
  const languages = (brand.languages ?? {}) as Record<string, unknown>;
  for (const key of Object.keys(languages)) assert.ok(['blog', 'linkedin'].includes(key), `brand.yml: languages.${key}`);
});

test('the build accepts the fixtures and renders a page for each', { timeout: 180_000 }, () => {
  // On the same disk as the repo: Astro moves its output with rename(), which cannot cross devices
  const cache = join(root, 'node_modules/.cache');
  mkdirSync(cache, { recursive: true });
  const work = mkdtempSync(join(cache, 'contract-'));
  try {
    const postsDir = join(work, 'posts');
    cpSync(join(root, 'test/fixtures/posts'), postsDir, { recursive: true });
    const outDir = join(work, 'dist');
    const run = spawnSync(process.execPath, [join(root, 'node_modules/astro/bin/astro.mjs'), 'build', '--force'], {
      cwd: root,
      env: { ...process.env, POSTS_DIR: postsDir, OUT_DIR: outDir, SKIP_GITHUB: '1' },
      encoding: 'utf8',
    });
    assert.equal(run.status, 0, `astro build failed:\n${run.stdout}\n${run.stderr}`);
    // At /<lang>/<slug>/, the address Shipcast links every post to, whatever the number of languages
    for (const file of fixtures) {
      const [lang, name] = file.split('/').slice(-2) as [string, string];
      const slug = name.replace(/\.md$/, '');
      assert.ok(existsSync(join(outDir, lang, slug, 'index.html')), `no page at /${lang}/${slug}/`);
    }
    // Served there, not redirected: the page's canonical URL is its own address
    const [lang, name] = fixtures[0]!.split('/').slice(-2) as [string, string];
    const html = readFileSync(join(outDir, lang, name.replace(/\.md$/, ''), 'index.html'), 'utf8');
    assert.match(html, new RegExp(`<link rel="canonical" href="[^"]*/${lang}/${name.replace(/\.md$/, '')}/"`));
    assert.doesNotMatch(html, /http-equiv="refresh"/);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
