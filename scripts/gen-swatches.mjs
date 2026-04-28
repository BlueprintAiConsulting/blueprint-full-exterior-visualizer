import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/swatches');
mkdirSync(OUT_DIR, { recursive: true });

// Hex to RGB helper
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// Lighten/darken a hex color by a factor
function adjustColor(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const nr = clamp(r + factor);
  const ng = clamp(g + factor);
  const nb = clamp(b + factor);
  return `rgb(${nr},${ng},${nb})`;
}

function generateShingleSVG(hex) {
  const base = hex;
  const light = adjustColor(hex, 28);
  const lighter = adjustColor(hex, 50);
  const dark = adjustColor(hex, -30);
  const darker = adjustColor(hex, -55);
  const mid = adjustColor(hex, 12);
  const { r, g, b } = hexToRgb(hex);

  // Unique seed-ish values per color for variation
  const seed = r * 3 + g * 7 + b * 11;
  const patternOffset = seed % 40;
  const grainIntensity = 0.18 + (seed % 3) * 0.06;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <!-- Base gradient -->
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${lighter}"/>
      <stop offset="35%" stop-color="${mid}"/>
      <stop offset="70%" stop-color="${base}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
    <!-- Tab shadow gradient (horizontal) -->
    <linearGradient id="shadow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${darker}" stop-opacity="0.7"/>
      <stop offset="30%" stop-color="${darker}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${darker}" stop-opacity="0"/>
    </linearGradient>
    <!-- Granule noise filter -->
    <filter id="grain" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85 0.75" numOctaves="4" seed="${seed}" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
      <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended"/>
      <feComponentTransfer in="blended">
        <feFuncA type="linear" slope="1"/>
      </feComponentTransfer>
    </filter>
    <!-- Subtle gloss overlay -->
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="white" stop-opacity="0.08"/>
      <stop offset="50%" stop-color="white" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <!-- Background base -->
  <rect width="200" height="200" fill="url(#base)"/>

  <!-- Shingle rows — row 1 (top) -->
  <!-- Row 1 tabs -->
  <rect x="0"   y="0"  width="66" height="62" fill="${lighter}" opacity="0.5" rx="1"/>
  <rect x="68"  y="0"  width="66" height="62" fill="${mid}"     opacity="0.4" rx="1"/>
  <rect x="136" y="0"  width="64" height="62" fill="${light}"   opacity="0.45" rx="1"/>
  <!-- Row 1 shadow stripe at bottom -->
  <rect x="0" y="55" width="200" height="9" fill="${darker}" opacity="0.55"/>

  <!-- Row 2 tabs (offset by ~patternOffset) -->
  <rect x="${-33 + patternOffset}" y="64" width="66" height="62" fill="${mid}"     opacity="0.4" rx="1"/>
  <rect x="${35  + patternOffset}" y="64" width="66" height="62" fill="${lighter}" opacity="0.45" rx="1"/>
  <rect x="${103 + patternOffset}" y="64" width="66" height="62" fill="${base}"    opacity="0.35" rx="1"/>
  <rect x="${171 + patternOffset}" y="64" width="66" height="62" fill="${light}"   opacity="0.4" rx="1"/>
  <!-- Row 2 shadow stripe -->
  <rect x="0" y="119" width="200" height="9" fill="${darker}" opacity="0.55"/>

  <!-- Row 3 tabs -->
  <rect x="0"   y="128" width="66" height="72" fill="${light}"   opacity="0.45" rx="1"/>
  <rect x="68"  y="128" width="66" height="72" fill="${base}"    opacity="0.35" rx="1"/>
  <rect x="136" y="128" width="64" height="72" fill="${lighter}" opacity="0.5" rx="1"/>
  <!-- Row 3 shadow stripe -->
  <rect x="0" y="188" width="200" height="12" fill="${darker}" opacity="0.6"/>

  <!-- Vertical tab dividers -->
  <line x1="66"  y1="0"   x2="66"  y2="55"  stroke="${darker}" stroke-width="1.5" opacity="0.6"/>
  <line x1="134" y1="0"   x2="134" y2="55"  stroke="${darker}" stroke-width="1.5" opacity="0.6"/>
  <line x1="${33  + patternOffset}" y1="64" x2="${33  + patternOffset}" y2="119" stroke="${darker}" stroke-width="1.5" opacity="0.6"/>
  <line x1="${101 + patternOffset}" y1="64" x2="${101 + patternOffset}" y2="119" stroke="${darker}" stroke-width="1.5" opacity="0.6"/>
  <line x1="${169 + patternOffset}" y1="64" x2="${169 + patternOffset}" y2="119" stroke="${darker}" stroke-width="1.5" opacity="0.6"/>
  <line x1="66"  y1="128" x2="66"  y2="200" stroke="${darker}" stroke-width="1.5" opacity="0.6"/>
  <line x1="134" y1="128" x2="134" y2="200" stroke="${darker}" stroke-width="1.5" opacity="0.6"/>

  <!-- Granule texture overlay -->
  <rect width="200" height="200" fill="${base}" opacity="${grainIntensity}" filter="url(#grain)"/>

  <!-- Top shadow (laminate thickness illusion) -->
  <rect width="200" height="200" fill="url(#shadow)"/>

  <!-- Gloss finish -->
  <rect width="200" height="200" fill="url(#gloss)"/>
</svg>`;
}

const SWATCHES = [
  // HDZ Standard
  { file: 'hdz-hunter-green.svg',      hex: '#3A5A3A' },
  { file: 'hdz-shakewood.svg',          hex: '#8A7260' },
  { file: 'hdz-mission-brown.svg',      hex: '#5A3E2E' },
  { file: 'hdz-weathered-wood.svg',     hex: '#9A8A70' },
  { file: 'hdz-hickory.svg',            hex: '#8C7458' },
  { file: 'hdz-williamsburg-slate.svg', hex: '#6E7880' },
  { file: 'hdz-pewter-gray.svg',        hex: '#868A8E' },
  { file: 'hdz-charcoal.svg',           hex: '#3A3A3C' },
  { file: 'hdz-oyster-gray.svg',        hex: '#B0ACA4' },
  { file: 'hdz-patriot-red.svg',        hex: '#7A3030' },
  { file: 'hdz-fox-hollow-gray.svg',    hex: '#7A8088' },
  { file: 'hdz-biscayne-blue.svg',      hex: '#5A6878' },
  { file: 'hdz-slate.svg',              hex: '#697077' },
  { file: 'hdz-barkwood.svg',           hex: '#7A6048' },
  // Bold Definition
  { file: 'bold-sierra-sand.svg',       hex: '#C0AA88' },
  { file: 'bold-midnight-mesa.svg',     hex: '#2E2E30' },
  { file: 'bold-cliffside.svg',         hex: '#8A8280' },
  { file: 'bold-chestnut-valley.svg',   hex: '#6E4E38' },
  // UHDZ
  { file: 'uhdz-barkwood.svg',          hex: '#7A6048' },
  { file: 'uhdz-weathered-wood.svg',    hex: '#9A8A70' },
  { file: 'uhdz-shakewood.svg',         hex: '#8A7260' },
  { file: 'uhdz-charcoal.svg',          hex: '#3A3A3C' },
];

let ok = 0;
for (const { file, hex } of SWATCHES) {
  const svg = generateShingleSVG(hex);
  writeFileSync(join(OUT_DIR, file), svg, 'utf8');
  console.log(`✓ ${file}`);
  ok++;
}
console.log(`\n✅ ${ok} swatches written to public/swatches/`);
