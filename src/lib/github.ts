// A project's star count from GitHub's API, read once per build. GITHUB_TOKEN, when set, raises the
// rate limit (60 requests an hour without it, shared by every job on a CI runner's address). Any
// failure (rate limit, network, timeout, a private repo) leaves the count out: the build never fails
// for it. SKIP_GITHUB=1 skips the calls altogether, for an offline build.

const cache = new Map<string, Promise<number | undefined>>();

/** Fewer stars than this are not shown: "3 stars" reads as an empty room */
export const STAR_THRESHOLD = 10;

export function stars(slug: string | undefined): Promise<number | undefined> {
  if (!slug || process.env.SKIP_GITHUB === '1') return Promise.resolve(undefined);
  const known = cache.get(slug);
  if (known) return known;
  const token = process.env.GITHUB_TOKEN;
  const request = fetch(`https://api.github.com/repos/${slug}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'shipcast-blog build',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    signal: AbortSignal.timeout(8000),
  })
    .then(async (response) => {
      if (!response.ok) return undefined;
      const body = (await response.json()) as { stargazers_count?: unknown };
      return typeof body.stargazers_count === 'number' ? body.stargazers_count : undefined;
    })
    .catch(() => undefined);
  cache.set(slug, request);
  return request;
}

/** The count to show, or undefined under the threshold or when GitHub did not answer */
export async function shownStars(slug: string | undefined): Promise<number | undefined> {
  const count = await stars(slug);
  return count !== undefined && count >= STAR_THRESHOLD ? count : undefined;
}
