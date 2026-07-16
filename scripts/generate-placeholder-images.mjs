/**
 * Replaces every file under web/public/images with an original, generated
 * placeholder of the same dimensions.
 *
 * The catalogue imagery inherited from the legacy project belongs to a third
 * party. This swaps each image for line art drawn here from the app's own
 * palette (web/src/index.css) — same size, same warm tone, so the layout and
 * look are unchanged while none of the pixels are anyone else's. A colour
 * palette and a composition style aren't protected the way a specific photo is,
 * which is exactly what this leans on. Drop real licensed images back in at the
 * same paths whenever you have them.
 *
 * Run: node scripts/generate-placeholder-images.mjs
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const imagesRoot = join(root, 'web', 'public', 'images');

// Straight from the design tokens in web/src/index.css.
const palette = {
  bgTop: '#f6f2ec',
  bgBottom: '#e6ded1',
  border: '#d8cfc1',
  line: '#b59a63', // between --color-gold and --color-gold-soft
  lineSoft: '#cbb488',
};

/** A small, deterministic hash so each image varies but never randomly. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Line-art motifs, drawn in a 100×100 box and stroked at render time. Keyed by
 * the top-level folder so each category reads as itself; portraits and the
 * hero banners get their own marks.
 */
const glyphs = {
  // Necklace: a chain curve with a hanging pendant.
  necklace:
    '<path d="M22 30 Q50 60 78 30" fill="none"/>' +
    '<path d="M50 50 l7 10 -7 10 -7 -10 z" fill="none"/>',
  // Bracelet: an open bangle seen at an angle, with a small stone.
  bracelet:
    '<ellipse cx="50" cy="52" rx="30" ry="18" fill="none"/>' +
    '<circle cx="50" cy="34" r="4.5" fill="none"/>',
  // Earrings: a pair of hooks with teardrops.
  earrings:
    '<path d="M40 30 a6 6 0 1 1 0 0.1 M40 34 Q40 48 40 50 a6 8 0 1 0 0.1 0" fill="none"/>' +
    '<path d="M62 30 a6 6 0 1 1 0 0.1 M62 34 Q62 48 62 50 a6 8 0 1 0 0.1 0" fill="none"/>',
  // Ring: a band with a raised diamond.
  ring:
    '<circle cx="50" cy="58" r="24" fill="none"/>' +
    '<path d="M42 30 h16 l-8 12 z M42 30 l8 12 8 -12" fill="none"/>',
  // Generic gem: a faceted diamond.
  gem:
    '<path d="M32 40 h36 l-18 32 z" fill="none"/>' +
    '<path d="M32 40 l9 12 h18 l9 -12 M41 52 l9 20 9 -20" fill="none"/>',
  // Portrait: a simple bust for the team photos.
  portrait:
    '<circle cx="50" cy="40" r="14" fill="none"/>' +
    '<path d="M28 78 Q28 56 50 56 Q72 56 72 78" fill="none"/>',
  // Hero banners: a small sparkle cluster.
  sparkle:
    '<path d="M50 28 Q52 46 68 50 Q52 54 50 72 Q48 54 32 50 Q48 46 50 28 z" fill="none"/>' +
    '<path d="M74 34 Q75 41 80 42 Q75 43 74 50 Q73 43 68 42 Q73 41 74 34 z" fill="none"/>',
};

/** Picks a motif from where the file sits in the tree. */
function glyphFor(relPath) {
  const [top] = relPath.split(sep);
  if (top === '1') return glyphs.necklace;
  if (top === '2') return glyphs.bracelet;
  if (top === '3') return glyphs.earrings;
  if (top === '4') return glyphs.ring;
  if (top === 'us') return glyphs.portrait;
  if (top === 'top' || relPath.startsWith('log')) return glyphs.sparkle;
  return glyphs.gem;
}

function buildSvg(width, height, relPath) {
  const seed = hash(relPath);
  const glyph = glyphFor(relPath);

  const short = Math.min(width, height);
  const size = short * 0.4; // motif footprint
  const cx = width / 2;
  const cy = height / 2;
  // A hairline inset frame, echoing the card borders.
  const inset = Math.max(6, Math.round(short * 0.04));
  const stroke = Math.max(1.4, short * 0.006);
  // A degree or two of tilt so no two placeholders sit identically.
  const tilt = ((seed % 5) - 2) * 0.9;
  // Nudge the background angle a touch per image.
  const angle = 115 + (seed % 30);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" gradientTransform="rotate(${angle} 0.5 0.5)">
      <stop offset="0" stop-color="${palette.bgTop}"/>
      <stop offset="1" stop-color="${palette.bgBottom}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.7">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <rect x="${inset}" y="${inset}" width="${width - inset * 2}" height="${height - inset * 2}"
        fill="none" stroke="${palette.border}" stroke-width="${Math.max(1, stroke * 0.7)}"/>
  <g transform="translate(${cx} ${cy}) rotate(${tilt}) scale(${size / 100}) translate(-50 -50)"
     stroke="${palette.line}" stroke-width="${(stroke / size) * 100 * 1.6}"
     stroke-linecap="round" stroke-linejoin="round">
    ${glyph}
  </g>
</svg>`;
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const imageExt = /\.(png|jpe?g)$/i;
let count = 0;

for await (const file of walk(imagesRoot)) {
  if (!imageExt.test(file)) continue;

  const original = await readFile(file);
  const meta = await sharp(original).metadata();
  const width = meta.width ?? 800;
  const height = meta.height ?? 800;

  const relPath = relative(imagesRoot, file);
  const svg = buildSvg(width, height, relPath);

  // Encode to match the file extension, so GitHub Pages serves a content type
  // that agrees with the bytes (several of these .PNG files were really JPEGs).
  const isJpeg = /\.jpe?g$/i.test(extname(file));
  const pipeline = sharp(Buffer.from(svg));
  const out = isJpeg
    ? await pipeline.jpeg({ quality: 82 }).toBuffer()
    : await pipeline.png({ compressionLevel: 9 }).toBuffer();

  await writeFile(file, out);
  count++;
}

// A record of what these are and why, kept next to the assets.
await writeFile(
  join(imagesRoot, 'CREDITS.md'),
  `# Image credits

The files in this folder are placeholder graphics generated by
\`scripts/generate-placeholder-images.mjs\` — original line art drawn from the
app's own colour palette. They contain no third-party photography.

To use real product photography, drop licensed images in at the same paths and
record each source and licence below.

| Path | Source | Licence |
|------|--------|---------|
| _(example)_ images/1/10000000_1.PNG | _your source_ | _e.g. Unsplash / self-shot_ |
`,
);

console.log(`Regenerated ${count} placeholder images under web/public/images`);
