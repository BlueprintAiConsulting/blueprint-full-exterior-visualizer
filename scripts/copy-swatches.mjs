import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = '/Users/drewsmacbookpro/.gemini/antigravity/brain/7a1ee8dd-ddfe-4d6c-ac6f-77bba74b7e75';
const OUT_DIR = join(__dirname, '../public/swatches');
mkdirSync(OUT_DIR, { recursive: true });

// Map artifact filenames to swatch IDs
const FILES = {
  'swatch_hdz_charcoal_1776410182283.png':         'hdz-charcoal.png',
  'swatch_hdz_weathered_wood_1776410200143.png':    'hdz-weathered-wood.png',
  'swatch_hdz_oyster_gray_1776410214939.png':       'hdz-oyster-gray.png',
  'swatch_hdz_shakewood_1776410228623.png':         'hdz-shakewood.png',
  'swatch_hdz_hunter_green_1776410260823.png':      'hdz-hunter-green.png',
  'swatch_hdz_mission_brown_1776410275177.png':     'hdz-mission-brown.png',
  'swatch_hdz_hickory_1776410287750.png':           'hdz-hickory.png',
  'swatch_hdz_williamsburg_slate_1776410301155.png':'hdz-williamsburg-slate.png',
  'swatch_hdz_pewter_gray_1776410313674.png':       'hdz-pewter-gray.png',
  'swatch_hdz_patriot_red_1776410327722.png':       'hdz-patriot-red.png',
  'swatch_hdz_fox_hollow_gray_1776410370065.png':   'hdz-fox-hollow-gray.png',
  'swatch_hdz_biscayne_blue_1776410383964.png':     'hdz-biscayne-blue.png',
  'swatch_hdz_slate_1776410400616.png':             'hdz-slate.png',
};

let ok = 0, fail = 0;
for (const [src, dest] of Object.entries(FILES)) {
  const srcPath = join(SRC_DIR, src);
  const destPath = join(OUT_DIR, dest);
  try {
    copyFileSync(srcPath, destPath);
    console.log(`✓ ${dest}`);
    ok++;
  } catch (e) {
    console.error(`✗ ${dest}: ${e.message}`);
    fail++;
  }
}
console.log(`\n${ok} copied, ${fail} failed`);
