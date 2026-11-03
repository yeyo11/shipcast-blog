// Covers are shown large, so the build makes a WebP copy of each one, sized for the page, next to the
// original (which stays as it is for og:image, where networks want a PNG or JPEG). Only files under
// public/ are touched; a path that is not there is linked as it is.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const PUBLIC = join(process.cwd(), 'public');
export const COVER_WIDTH = 1280;

export function inPublic(path: string): boolean {
  return /\.(png|jpe?g|webp|avif)$/i.test(path) && existsSync(join(PUBLIC, path));
}

/** Where the WebP copy of a public image is served: /covers/x.jpg → /img/covers/x.jpg.webp */
export const webpPath = (path: string): string => `/img${path}.webp`;

export async function toWebp(path: string): Promise<Buffer> {
  return sharp(join(PUBLIC, path)).resize({ width: COVER_WIDTH, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
}

const sizes = new Map<string, Promise<{ width: number; height: number } | undefined>>();

/** The size the WebP copy comes out at, for the <img>'s width and height */
export function webpSize(path: string): Promise<{ width: number; height: number } | undefined> {
  let known = sizes.get(path);
  if (!known) {
    known = sharp(join(PUBLIC, path))
      .metadata()
      .then(({ width, height }) => {
        if (!width || !height) return undefined;
        const w = Math.min(width, COVER_WIDTH);
        return { width: w, height: Math.round((height * w) / width) };
      })
      .catch(() => undefined);
    sizes.set(path, known);
  }
  return known;
}
