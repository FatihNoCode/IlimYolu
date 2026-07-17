// Generates a white-background favicon PNG from the logo SVG. Separate from
// make-icon-sources.mjs (which feeds the Android app icon/splash set) because
// this one file is a web-only asset, imported directly by src/app/App.tsx.
// Re-run whenever the logo changes.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const svg = readFileSync(new URL('../src/imports/logo.svg', import.meta.url));
const out = fileURLToPath(new URL('../src/imports/favicon.png', import.meta.url));

const S = 256;

// The SVG's own viewBox (912x752) has a lot of transparent margin around the
// artwork — trimming it first means sizing by width also fills height,
// instead of leaving a visible band of white top and bottom.
const rendered = await sharp(svg, { density: 400 }).png().toBuffer();
const trimmed = await sharp(rendered).trim().toBuffer();

const logo = await sharp(trimmed)
  .resize({ width: Math.round(S * 0.94), fit: 'inside' })
  .png()
  .toBuffer();

await sharp({ create: { width: S, height: S, channels: 4, background: '#ffffff' } })
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile(out);

console.log('favicon written to src/imports/favicon.png');
