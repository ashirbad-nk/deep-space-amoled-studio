/**
 * Unit Tests for:
 * 1. Curated Catalog Item Removal (5: jupiter, 6: quintet, 8: deep_field removed)
 * 2. Curated Catalog remaining item integrity (6 high-fidelity master items)
 * 3. Dynamic Search Section Title & Badge for Multi-Archive Searches
 * 4. UI consistency across index.html chips and counters
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('RUNNING CATALOG INTEGRITY & DYNAMIC ARCHIVE TITLE TESTS');
console.log('===============================================================');

const ROOT_DIR = path.join(__dirname, '..');
const wallpaperJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'wallpaper.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

// Test 1: Extract CATALOG from wallpaper.js and verify keys
const catalogMatch = wallpaperJs.match(/const CATALOG = ({[\s\S]*?\n  };)/);
assert(catalogMatch, 'CATALOG definition must exist in wallpaper.js');
const catalog = eval(`(${catalogMatch[1].replace(/const CATALOG = /, '').replace(/;$/, '')})`);
const keys = Object.keys(catalog);

console.log(`Curated Catalog count: ${keys.length}`);
console.log(`Curated Catalog keys: ${keys.join(', ')}`);

assert.strictEqual(keys.length, 6, 'Catalog should have exactly 6 curated items remaining');
assert(!keys.includes('jupiter'), 'Jupiter must be removed from CATALOG');
assert(!keys.includes('quintet'), 'Stephan\'s Quintet must be removed from CATALOG');
assert(!keys.includes('deep_field'), 'Deep Field must be removed from CATALOG');

const expectedKeys = ['carina', 'pillars', 'phantom_galaxy', 'tarantula', 'southern_ring', 'cartwheel'];
assert.deepStrictEqual(keys, expectedKeys, 'Remaining keys must match expected high-fidelity masters');
console.log('✓ CATALOG item removal & remaining 6 high-fidelity masters verified.');

// Test 2: Check index.html chip and count references
assert(indexHtml.includes('🌟 All Curated (6)'), 'Filter chip must reflect 6 curated objects');
assert(indexHtml.includes('id="curated-count">6 Objects</span>'), 'Section count must show 6 Objects');
assert(!indexHtml.includes('data-filter="planets"'), 'Planets filter chip should be removed');
assert(!indexHtml.includes('data-filter="void"'), 'Void filter chip should be removed');
console.log('✓ index.html curated count and filter chips verified.');

// Test 3: Check dynamic archive title & badge elements in index.html
assert(indexHtml.includes('id="archive-results-title"'), 'index.html must have id="archive-results-title"');
assert(indexHtml.includes('id="archive-results-badge"'), 'index.html must have id="archive-results-badge"');
assert(indexHtml.includes('id="nasa-loading-text"'), 'index.html must have id="nasa-loading-text"');
console.log('✓ index.html dynamic archive title & badge elements verified.');

// Test 4: Verify dynamic title updates & integrated archive handlers in wallpaper.js
assert(wallpaperJs.includes("archiveTitleEl.innerHTML = '🔭 Deep Sky Survey Masters & Cutouts';"), 'Surveys title update verified');
assert(wallpaperJs.includes("archiveTitleEl.innerHTML = '🏔️ ESO & VLT Deep Space Masters';"), 'ESO title update verified');
assert(wallpaperJs.includes("archiveTitleEl.innerHTML = '⚡ Chandra X-Ray Deep Space Masters';"), 'Chandra title update verified');
assert(wallpaperJs.includes("archiveTitleEl.innerHTML = '🌌 Wikimedia Astrophotography Results';"), 'Wikimedia title update verified');
assert(wallpaperJs.includes("archiveTitleEl.innerHTML = '🛸 NASA Deep Space Archive Results';"), 'NASA title update verified');
assert(wallpaperJs.includes("archiveTitleEl.innerHTML = '🌐 Unified Astronomical Archive Discoveries';"), 'All archives title update verified');
assert(wallpaperJs.includes("const fetchEsoMasters = async () => {"), 'fetchEsoMasters must be defined');
assert(wallpaperJs.includes("const fetchChandraXRay = async () => {"), 'fetchChandraXRay must be defined');
console.log('✓ wallpaper.js dynamic title & badge dispatch verified for all 6 archive modes.');

// Test 5: Verify archive select options in index.html
assert(indexHtml.includes('value="eso"'), 'index.html must have option value="eso"');
assert(indexHtml.includes('value="chandra"'), 'index.html must have option value="chandra"');
console.log('✓ index.html archive selector dropdown verified for ESO and Chandra options.');

// Test 6: Verify Chandra & ESO query builders handle pulsar and target queries cleanly
assert(wallpaperJs.includes("qClean.replace(/\\b(chandra|x-ray|xray)\\b/gi, '').trim()"), 'Chandra query builder must strip duplicate keywords');
assert(wallpaperJs.includes("qClean.replace(/\\b(eso|vlt|observatory)\\b/gi, '').trim()"), 'ESO query builder must strip duplicate keywords');
assert(wallpaperJs.includes("filetype:bitmap"), 'Wikimedia queries must use filetype:bitmap to filter out non-image files');
assert(wallpaperJs.includes("const isTiff = info.mime === 'image/tiff' && info.thumburl;"), 'TIFF images must be converted via thumburl');
console.log('✓ Chandra, ESO & Wikimedia query builders verified for clean target searches, filetype filtering & TIFF support.');

console.log('===============================================================');
console.log('ALL CATALOG & DYNAMIC ARCHIVE TITLE TESTS PASSED (100%)');
console.log('===============================================================');
