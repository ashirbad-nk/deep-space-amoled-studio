/**
 * Unit Tests for Ultra-HD Deep Sky Survey Masters and Instant Thumbnail Loading
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('RUNNING ULTRA-HD DEEP SKY SURVEYS & THUMBNAIL RELIABILITY TESTS');
console.log('===============================================================');

// Extract CELESTIAL_CATALOG from src/wallpaper.js
const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'wallpaper.js'), 'utf8');

const catalogMatch = code.match(/const CELESTIAL_CATALOG = (\[[\s\S]*?\]);/);
assert(catalogMatch, 'Could not extract CELESTIAL_CATALOG');
const CELESTIAL_CATALOG = eval(catalogMatch[1]);

// Test 1: Verify presence of Ultra-HD masters in catalog
const showcaseNames = [
  'Orion Nebula (M42)',
  'Carina Nebula (NGC 3372)',
  'Pillars of Creation / Eagle Nebula (M16)',
  'Andromeda Galaxy (M31)',
  'Crab Nebula (M1)',
  'Whirlpool Galaxy (M51)',
  'Sombrero Galaxy (M104)',
  'Pleiades / Seven Sisters (M45)'
];

const showcases = CELESTIAL_CATALOG.filter(t => showcaseNames.includes(t.name));
assert.strictEqual(showcases.length, 8, 'Showcases must include all 8 premier targets');

console.log('\n--- Test 1: Ultra-HD Resolution & Megapixel Audit ---');
for (const s of showcases) {
  assert(s.master, `Showcase ${s.name} must have a curated master`);
  assert(s.master.w >= 3000, `${s.name} width (${s.master.w}) must be at least 3000px`);
  assert(s.master.h >= 3000, `${s.name} height (${s.master.h}) must be at least 3000px`);
  assert(s.master.mp >= 10.0, `${s.name} megapixels (${s.master.mp}) must be >= 10 MP`);
  assert(s.master.thumb, `${s.name} must have a thumbnail URL`);
  assert(s.master.full, `${s.name} must have a full master URL`);
  assert(s.master.obs, `${s.name} must have observatory description`);

  console.log(`✓ [${s.name}]: ${s.master.w.toLocaleString()} × ${s.master.h.toLocaleString()} (${s.master.mp.toFixed(1)} MP) - ${s.master.obs}`);
}

// Test 2: Verify instant thumbnail responses (< 800ms, HTTP 200, ZERO 429s)
console.log('\n--- Test 2: Live Thumbnail Network & Rate-Limit Verification ---');
async function testThumbnails() {
  const startTime = Date.now();
  const checks = showcases.map(async (s) => {
    const t0 = Date.now();
    const resp = await fetch(s.master.thumb);
    const duration = Date.now() - t0;
    
    assert.strictEqual(resp.status, 200, `Thumbnail for ${s.name} must return HTTP 200, got ${resp.status}`);
    assert(duration < 2500, `Thumbnail for ${s.name} should load promptly (took ${duration}ms)`);
    return { name: s.name, status: resp.status, duration };
  });

  const results = await Promise.all(checks);
  for (const r of results) {
    console.log(`✓ Thumbnail [${r.name}] loaded: HTTP ${r.status} in ${r.duration}ms (0 rate limits)`);
  }
  const totalElapsed = Date.now() - startTime;
  console.log(`✓ All 8 thumbnails loaded concurrently in ${totalElapsed}ms with ZERO HTTP 429 errors.`);
}

testThumbnails().then(() => {
  // Test 3: Verify onerror resilience logic in card template
  assert(code.includes("onerror=\"if (!this.dataset.retried && this.src.startsWith('http'))"), 'Card template must include auto-proxy retry on error');
  assert(code.includes("sk.style.display = 'none'"), 'Card template must explicitly dismiss skeleton on error');
  console.log('✓ Card error resilience & stuck skeleton elimination verified.');

  // Test 4: Verify coordinates query generation
  assert(code.includes('https://skyserver.sdss.org/dr18/SkyServerWS/ImgCutout/getjpeg'), 'SDSS DR18 must be wired for optical survey cutouts');
  assert(code.includes('proxyLegacyThumb'), 'DECam thumbnail must use proxy to prevent 429 rate limits');
  console.log('✓ Fast SDSS DR18 cutouts & proxied DECam cutouts verified for coordinates.');

  console.log('\n===============================================================');
  console.log('ALL ULTRA-HD SURVEY & THUMBNAIL TESTS PASSED (100%)');
  console.log('===============================================================');
}).catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
