import { createWriteStream, mkdirSync } from 'fs';
import { get } from 'https';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/swatches');
mkdirSync(OUT_DIR, { recursive: true });

const SWATCHES = {
  // HDZ Standard (14 colors)
  'hdz-hunter-green':      'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_hunter-green_shingles-min-opt.png',
  'hdz-shakewood':         'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_shakewood_shinglesg-min.png',
  'hdz-mission-brown':     'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_mission-brown_shingles-min.png',
  'hdz-weathered-wood':    'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_weathered-wood_shingles-min.png',
  'hdz-hickory':           'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_hickory_shingles-opt.png',
  'hdz-williamsburg-slate':'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_williamsburg-slate_shingles-min.png',
  'hdz-pewter-gray':       'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_pewtergray_shingles-min-opt2.png',
  'hdz-charcoal':          'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_charcoal_shingles-opt.png',
  'hdz-oyster-gray':       'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_oyster-grey_shingles-min.png',
  'hdz-patriot-red':       'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_patriotred_shingles-min.png',
  'hdz-fox-hollow-gray':   'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_fox-hollow-grey_shingles-min.png',
  'hdz-biscayne-blue':     'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_biscayne_shingles-min.png',
  'hdz-slate':             'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_slate_shingles-min.png',
  'hdz-barkwood':          'https://product-assets.gaf.com/media/catalog/product/t/i/timberlinehdz_barkwood_shingle-min.png',
  // HDZ Bold Definition (4 colors)
  'bold-sierra-sand':      'https://product-assets.gaf.com/media/catalog/product/s/i/sierra-sand-swatch.png',
  'bold-midnight-mesa':    'https://product-assets.gaf.com/media/catalog/product/m/i/midnight-mesa-swatch.png',
  'bold-cliffside':        'https://product-assets.gaf.com/media/catalog/product/c/l/cliffside-swatch.png',
  'bold-chestnut-valley':  'https://product-assets.gaf.com/media/catalog/product/c/h/chestnut-valley-swatch.png',
  // UHDZ (4 colors per Shiloh's list — Shakewood Slate = Shakewood)
  'uhdz-barkwood':         'https://product-assets.gaf.com/media/catalog/product/t/i/timberlineuhdz_class4-barkwood_shingle-min-opt.jpg',
  'uhdz-weathered-wood':   'https://product-assets.gaf.com/media/catalog/product/t/i/timberlineuhdz_class4-weathered-wood_shingles-min-opt.jpg',
  'uhdz-shakewood-slate':  'https://product-assets.gaf.com/media/catalog/product/t/i/timberlineuhdz-class4_shakewood_shingles-min-opt.jpg',
  'uhdz-charcoal':         'https://product-assets.gaf.com/media/catalog/product/t/i/timberlineuhdz_class-4-charcoal_shingles-min-opt_1.jpg',
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const req = get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', err => { file.close(); reject(err); });
  });
}

let ok = 0, fail = 0;
const entries = Object.entries(SWATCHES);
for (const [name, url] of entries) {
  const ext = url.endsWith('.jpg') ? '.jpg' : '.png';
  const dest = join(OUT_DIR, `${name}${ext}`);
  try {
    await download(url, dest);
    console.log(`✓ ${name}`);
    ok++;
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
    fail++;
  }
}
console.log(`\nDone: ${ok} downloaded, ${fail} failed`);
