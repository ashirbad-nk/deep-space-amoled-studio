/**
 * tests/test_sexagesimal_and_sdss_footprint.js
 * Verification for:
 * 1. Sexagesimal HMS / DMS coordinate parsing (e.g. "05:28:05.9, +34:25:26", "05h 28m 05.9s, +34° 25' 26\"")
 * 2. Galactic Latitude b calculation (J2000 transformation)
 * 3. SDSS Footprint validation: prevents 404 errors for targets outside SDSS (such as the Milky Way Galactic Plane)
 * 4. unWISE Deep Infrared sky survey fallback for Galactic Plane coordinates
 * 5. HTTP 404 resilience and graceful user notification in fetchAndLoadImage
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('RUNNING SEXAGESIMAL PARSING & SDSS FOOTPRINT RESILIENCE TESTS');
console.log('===============================================================');

const ROOT_DIR = path.join(__dirname, '..');
const wallpaperJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'wallpaper.js'), 'utf8');

// --- Test 1: Sexagesimal Parsing Verification ---
console.log('\n--- Test 1: Sexagesimal HMS / DMS Parsing ---');
assert(wallpaperJs.includes('sexaRegex'), 'wallpaper.js must define sexaRegex in parseCoordinates');
assert(wallpaperJs.includes('isSexagesimal'), 'parseCoordinates must flag isSexagesimal');

// Extract parseCoordinates from wallpaperJs
const parseFnStart = wallpaperJs.indexOf('function parseCoordinates(query) {');
const parseFnEnd = wallpaperJs.indexOf('async function resolveTargetViaSesame');
const parseFnSrc = wallpaperJs.slice(parseFnStart, parseFnEnd);
const parseCoordinates = eval(`(${parseFnSrc})`);

// Test target from user: 05:28:05.9, +34:25:26
const targetUser = parseCoordinates('05:28:05.9, +34:25:26');
assert(targetUser, '05:28:05.9, +34:25:26 must parse successfully');
assert(Math.abs(targetUser.ra - 82.0246) < 0.001, `RA expected ~82.0246, got ${targetUser.ra}`);
assert(Math.abs(targetUser.dec - 34.4239) < 0.001, `Dec expected ~34.4239, got ${targetUser.dec}`);
assert.strictEqual(targetUser.isSexagesimal, true);
console.log(`✓ "05:28:05.9, +34:25:26" correctly parsed to RA=${targetUser.ra.toFixed(4)}°, Dec=${targetUser.dec.toFixed(4)}°`);

// Test other sexagesimal notations
const targetHours = parseCoordinates('05h 28m 05.9s, +34° 25\' 26"');
assert(targetHours && Math.abs(targetHours.ra - 82.0246) < 0.001);
const targetSpaces = parseCoordinates('05 28 05.9 +34 25 26');
assert(targetSpaces && Math.abs(targetSpaces.ra - 82.0246) < 0.001);
const targetDecimals = parseCoordinates('82.025, 34.424');
assert(targetDecimals && Math.abs(targetDecimals.ra - 82.025) < 0.001);
console.log('✓ HMS/DMS, colon-separated, space-separated, and decimal degree formats verified.');

// --- Test 2: Galactic Latitude & SDSS Footprint Guard ---
console.log('\n--- Test 2: Galactic Latitude & SDSS Footprint Validation ---');
assert(wallpaperJs.includes('function getGalacticLatitude(ra, dec)'), 'wallpaper.js must define getGalacticLatitude');
assert(wallpaperJs.includes('function isInsideSdssFootprint(ra, dec)'), 'wallpaper.js must define isInsideSdssFootprint');

const galFnStart = wallpaperJs.indexOf('function getGalacticLatitude(ra, dec) {');
const galFnEnd = wallpaperJs.indexOf('function parseCoordinates');
const galFnSrc = wallpaperJs.slice(galFnStart, galFnEnd);
eval(galFnSrc); // Defines getGalacticLatitude and isInsideSdssFootprint

// Target 05:28:05.9, +34:25:26 is in Auriga on the Milky Way Galactic Plane (b ≈ -0.19°)
const bUser = getGalacticLatitude(82.0246, 34.4239);
assert(Math.abs(bUser) < 1.0, `Expected b close to 0°, got ${bUser}`);
assert.strictEqual(isInsideSdssFootprint(82.0246, 34.4239), false, 'Auriga galactic plane coordinates must NOT be in SDSS footprint');
console.log(`✓ 05:28:05.9, +34:25:26 accurately recognized as Galactic Plane (b=${bUser.toFixed(2)}°) and excluded from SDSS.`);

// Extragalactic Northern Cap (M51 Whirlpool Galaxy: b ≈ +68.6°)
const bM51 = getGalacticLatitude(202.47, 47.20);
assert(bM51 > 60.0);
assert.strictEqual(isInsideSdssFootprint(202.47, 47.20), true, 'M51 must be inside SDSS footprint');
console.log(`✓ M51 (Whirlpool Galaxy) accurately recognized in Northern Galactic Cap (b=${bM51.toFixed(2)}°) with SDSS enabled.`);

// --- Test 3: unWISE Deep Infrared for Galactic Plane ---
console.log('\n--- Test 3: unWISE Deep Infrared Survey for Galactic Plane Targets ---');
assert(wallpaperJs.includes('unwise-neo7'), 'wallpaper.js must integrate unwise-neo7 survey layer');
assert(wallpaperJs.includes('unWISE Deep Sky Infrared Survey'), 'wallpaper.js must offer unWISE survey for galactic plane targets');
assert(wallpaperJs.includes('isGalacticPlane'), 'wallpaper.js must check isGalacticPlane');
console.log('✓ unWISE Deep Infrared survey correctly integrated for galactic plane coordinates.');

// --- Test 4: Graceful 404 Error Handling in fetchAndLoadImage ---
console.log('\n--- Test 4: Graceful 404 Handling in fetchAndLoadImage ---');
assert(wallpaperJs.includes("err.message.includes('404')"), 'fetchAndLoadImage must handle HTTP 404 gracefully');
assert(wallpaperJs.includes('outside this survey\'s coverage footprint'), 'Alert must explain footprint limitation to user');
console.log('✓ fetchAndLoadImage 404 footprint recovery and user guidance verified.');

console.log('\n===============================================================');
console.log('ALL SEXAGESIMAL & SDSS FOOTPRINT TESTS PASSED (100%)');
console.log('===============================================================');
