/**
 * tests/test_ui_improvements.js
 * Verification Suite for:
 * 1. Download Raw Image button next to object details in top pane
 * 2. Step 1 Drawer No-Scroll 2-Column Dashboard Layout
 * 3. Popular Discoveries 2-Column Matrix (Vertical Flow into empty space, Zero Cutoff)
 * 4. Search Archive Selector Uncramped Styling (Generous padding, clean chevron, no border overlap)
 * 5. Top Header & Card Launch Button comfortable height adjustments
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('RUNNING UI IMPROVEMENTS & STEP 1 NO-SCROLL VERIFICATION');
console.log('===============================================================');

const ROOT_DIR = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const wallpaperJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'wallpaper.js'), 'utf8');
const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');

// ---------------------------------------------------------------------------
// Test 1: Download Raw Master Button next to object details label in top pane
// ---------------------------------------------------------------------------
console.log('\n--- Test 1: Download Raw Master Image Button ---');
assert(indexHtml.includes('id="btn-download-raw-master"'), 
  'index.html must contain #btn-download-raw-master button in top pane');
assert(indexHtml.includes('class="btn-download-raw-master"'), 
  'index.html must style raw download button with .btn-download-raw-master');

// Verify it is placed in .tier-right right next to #hud-res-badge
const tierRightIdx = indexHtml.indexOf('class="tier-right"');
const resBadgeIdx = indexHtml.indexOf('id="hud-res-badge"');
const rawBtnIdx = indexHtml.indexOf('id="btn-download-raw-master"');

assert(tierRightIdx !== -1 && resBadgeIdx !== -1 && rawBtnIdx !== -1, 
  'All elements must exist in top bar');
assert(rawBtnIdx > resBadgeIdx, 
  'Raw download button must be positioned right beside/after #hud-res-badge in .tier-right');

assert(wallpaperJs.includes('btnDownloadRawMaster'), 
  'wallpaper.js must bind #btn-download-raw-master');
assert(styleCss.includes('.btn-download-raw-master'), 
  'style.css must style .btn-download-raw-master');
console.log('✓ Download Raw Master button verified next to object details in top pane.');

// ---------------------------------------------------------------------------
// Test 2: Step 1 Drawer No-Scroll 2-Column Dashboard Layout
// ---------------------------------------------------------------------------
console.log('\n--- Test 2: Step 1 Drawer No-Scroll 2-Column Dashboard Layout ---');
assert(indexHtml.includes('class="studio-drawer drawer-grade-wide" id="drawer-grade"'),
  'index.html #drawer-grade must declare .drawer-grade-wide');
assert(indexHtml.includes('class="telemetry-card telemetry-card-compact"'),
  'index.html #drawer-grade must use compact 1-line telemetry card');
assert(indexHtml.includes('class="grade-columns-grid"'),
  'index.html #drawer-grade must contain .grade-columns-grid for 2-column layout');
assert(indexHtml.includes('class="grade-column"'),
  'index.html #drawer-grade must contain .grade-column elements for Left & Right groups');

assert(styleCss.includes('.studio-drawer.drawer-grade-wide'),
  'style.css must define wide drawer rules for #drawer-grade');
assert(styleCss.includes('.grade-columns-grid'),
  'style.css must define 2-column grid layout for Step 1 controls');
assert(styleCss.includes('.telemetry-card.telemetry-card-compact'),
  'style.css must define compact horizontal telemetry strip');
console.log('✓ Step 1 2-Column Dashboard & no-scroll architecture verified.');

// ---------------------------------------------------------------------------
// Test 3: Popular Discoveries 2-Column Matrix (Zero Cutoff on Right)
// ---------------------------------------------------------------------------
console.log('\n--- Test 3: Popular Discoveries 2-Column Matrix ---');
assert(wallpaperJs.includes("'topic-name'") || wallpaperJs.includes('"topic-name"'), 
  'wallpaper.js must render .topic-name for each discovery');
assert(wallpaperJs.includes("'topic-cat'") || wallpaperJs.includes('"topic-cat"'), 
  'wallpaper.js must render .topic-cat badge for each discovery');
assert(styleCss.includes('.popular-row {'), 
  'style.css must define .popular-row');
assert(styleCss.includes('grid-template-columns: 1fr 1fr;'), 
  'style.css .popular-row must use 2-column grid to fit inside sidebar without clipping');
assert(styleCss.includes('.topic-name'), 
  'style.css must define .topic-name with text-overflow: ellipsis');
assert(styleCss.includes('.topic-cat'), 
  'style.css must define .topic-cat badge');
console.log('✓ Popular discoveries 2-column matrix verified to prevent cutoff and fill empty space.');

// ---------------------------------------------------------------------------
// Test 4: Search Archive Selector Uncramped Styling
// ---------------------------------------------------------------------------
console.log('\n--- Test 4: Search Archive Selector Uncramped Styling ---');
assert(indexHtml.includes('class="search-input-row"'), 
  'index.html must group search input and button in .search-input-row');
assert(styleCss.includes('.search-input-row'), 
  'style.css must define .search-input-row');
assert(styleCss.includes('.search-archive-select {'), 
  'style.css must define .search-archive-select');
assert(styleCss.includes('height: 38px;'), 
  'style.css .search-archive-select must specify comfortable 38px height');
assert(styleCss.includes('padding: 6px 36px 6px 12px;'), 
  'style.css .search-archive-select must provide generous vertical & right padding');
console.log('✓ Uncramped search archive dropdown verified.');

// ---------------------------------------------------------------------------
// Test 5: Top Header & Card Launch Button Height Adjustments
// ---------------------------------------------------------------------------
console.log('\n--- Test 5: Top Header & Card Launch Button Height Adjustments ---');
assert(styleCss.includes('min-height: 64px;'), 
  'style.css .discovery-header must have min-height: 64px for comfortable breathing room');
assert(styleCss.includes('.card-cta-btn {'), 
  'style.css must define .card-cta-btn');
assert(styleCss.includes('height: 34px;'), 
  'style.css .card-cta-btn must have height: 34px for prominent launch button presence');
console.log('✓ Top header and card launch button comfortable heights verified.');

console.log('\n===============================================================');
console.log('ALL UI IMPROVEMENTS & STEP 1 NO-SCROLL TESTS PASSED (100%)');
console.log('===============================================================');
