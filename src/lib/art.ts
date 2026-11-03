// The site's two drawn files, made at build time from brand.yml so they carry your name with no
// design tool: the favicon (your initials on the yellow tile) and the default share image. Letters
// are turned into outlines with the fonts the site uses, so they look the same everywhere.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
function font(file: string): opentype.Font {
  const data = readFileSync(require.resolve(file));
  return opentype.parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}
const display = font('@fontsource/phudu/files/phudu-latin-900-normal.woff');
const text = font('@fontsource/inter-tight/files/inter-tight-latin-600-normal.woff');

/** "José Antonio Garrido" → "JG": the first and last words' first letters */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '?';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
  return `${first}${last}`.toLocaleUpperCase();
}

// Glyph by glyph, with the font's kerning: no shaping, which opentype.js does not fully support and
// plain Latin text does not need
function advance(f: opentype.Font, value: string, size: number): number {
  const glyphs = [...value].map((c) => f.charToGlyph(c));
  const scale = size / f.unitsPerEm;
  return glyphs.reduce((w, g, i) => w + (g.advanceWidth ?? 0) * scale + (i > 0 ? f.getKerningValue(glyphs[i - 1]!, g) * scale : 0), 0);
}

function outline(f: opentype.Font, value: string, x: number, y: number, size: number): string {
  const glyphs = [...value].map((c) => f.charToGlyph(c));
  const scale = size / f.unitsPerEm;
  let left = x;
  return glyphs
    .map((g, i) => {
      if (i > 0) left += f.getKerningValue(glyphs[i - 1]!, g) * scale;
      const d = g.getPath(left, y, size).toPathData(2);
      left += (g.advanceWidth ?? 0) * scale;
      return d;
    })
    .join('');
}

/** A line of text as one SVG path, scaled down to fit `maxWidth` */
function line(f: opentype.Font, value: string, x: number, y: number, size: number, maxWidth: number, anchor: 'start' | 'middle' = 'start'): string {
  const width = advance(f, value, size);
  const fitted = width > maxWidth ? (size * maxWidth) / width : size;
  const realWidth = advance(f, value, fitted);
  return outline(f, value, anchor === 'middle' ? x - realWidth / 2 : x, y, fitted);
}

/** The yellow tile with the initials: the logo, at any size (a 64-unit square) */
export function tileSvg(name: string): string {
  const letters = initials(name);
  // Phudu's capitals sit at about 0.7 of the size; centre them optically
  const path = line(display, letters, 32, 45, 40, 50, 'middle');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#FFD43B"/><path d="${path}" fill="#000"/></svg>`;
}

/** The default share card, 1200 × 630: the blog's title, your name and the tile, on the night ground */
export async function shareCardPng(title: string, name: string): Promise<Buffer> {
  const letters = initials(name);
  const titlePath = line(display, title.toLocaleUpperCase(), 80, 400, 190, 1040);
  const namePath = line(text, name, 80, 520, 44, 1040);
  const tilePath = line(display, letters, 140, 196, 88, 104, 'middle');
  const dots: string[] = [];
  for (let y = 24; y < 630; y += 22) {
    for (let x = 640; x < 1200; x += 22) {
      const r = Math.max(0, ((x - 640) / 560) * 3.2 - ((630 - y) / 630) * 1.2);
      if (r > 0.4) dots.push(`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#141413"/>
<g fill="#33322F">${dots.join('')}</g>
<rect x="80" y="80" width="120" height="120" rx="26" fill="#FFD43B"/>
<path d="${tilePath}" fill="#000"/>
<path d="${titlePath}" fill="#F4F2EC"/>
<path d="${namePath}" fill="#A9A69E"/>
</svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
