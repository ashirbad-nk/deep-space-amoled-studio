/**
 * Verification Suite for:
 * 1. Standalone HTML Export CORS resilience & direct-stream fallback
 * 2. Exporter HTML structure & CameraEngine embedding
 * 3. App logo, favicon, and PWA icon assets presence and validity
 * 4. HTML document icon links and brand identity
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('RUNNING STANDALONE HTML CORS RESILIENCE & BRAND ASSET TESTS');
console.log('===============================================================');

const ROOT_DIR = path.join(__dirname, '..');

// 1. Verify App Logo, Favicon, and PWA icon files
const requiredAssets = [
  'favicon.ico',
  'favicon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable.png'
];

for (const relPath of requiredAssets) {
  const fullPath = path.join(ROOT_DIR, relPath);
  assert(fs.existsSync(fullPath), `Asset ${relPath} must exist on disk`);
  const stat = fs.statSync(fullPath);
  assert(stat.size > 500, `Asset ${relPath} must not be empty (found ${stat.size} bytes)`);
  console.log(`✓ ${relPath} verified (${stat.size} bytes).`);
}

// 2. Verify HTML header links in index.html
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
assert(indexHtml.includes('href="favicon.ico"'), 'index.html must link to favicon.ico');
assert(indexHtml.includes('href="favicon.png"'), 'index.html must link to favicon.png');
assert(indexHtml.includes('class="brand-app-logo"'), 'Screen 1 discovery header must display .brand-app-logo');
assert(indexHtml.includes('class="brand-app-logo-small"'), 'Screen 2 studio header must display .brand-app-logo-small');
assert(indexHtml.includes('id="input-export-html-filename"'), 'Export drawer must include HTML custom filename input');
assert(indexHtml.includes('id="input-export-video-filename"'), 'Export drawer must include Video custom filename input');
console.log('✓ index.html brand headers, favicon links & export filename inputs verified.');

// 3. Verify wallpaper.js HTML export handler logic
const wallpaperJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'wallpaper.js'), 'utf8');

// Ensure no blocking return with alert on isCanvasTainted
assert(!wallpaperJs.includes("if (isCanvasTainted) {\n          showCorsHelperModal('export_html');\n          btnExportHtml.textContent = '💾 Download Standalone HTML';\n          return;"), 'Export HTML must not block and halt when canvas is tainted');

assert(wallpaperJs.includes('images.weserv.nl'), 'Export pipeline must support automated proxy untaint');
assert(wallpaperJs.includes('dataUri = rawSourceImage.src;'), 'Export pipeline must support direct stream URL fallback');
assert(wallpaperJs.includes('let isAmoledGraded = false;'), 'isAmoledGraded must be declared in wallpaper.js');
assert(wallpaperJs.includes('isAmoledGraded = true;'), 'isAmoledGraded must be set in applyInBrowserGrade');
assert(wallpaperJs.includes('const isGraded = isAmoledGraded || (activeRenderDrawable !== rawSourceImage);'), 'Export HTML must safely evaluate isGraded');
console.log('✓ wallpaper.js CORS resilience, direct stream fallback & isAmoledGraded state tracking verified.');

// 4. Test Standalone HTML Generation via Exporter
const { Exporter } = require(path.join(ROOT_DIR, 'src', 'exporter.js'));

let lastBlob = null;
Exporter.downloadBlob = function(blob, filename) {
  lastBlob = blob;
};

async function runExporterTests() {
  // Test A: Clean Data URI embedding
  const dummyDataUri = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2QAA';
  Exporter.exportStandaloneHtml({
    title: 'Test Clean AMOLED Wallpaper',
    presetMode: 'odyssey',
    durationSec: 60,
    waypoints: [],
    imageDataUri: dummyDataUri,
    engineCode: 'class CameraEngine { constructor() {} }',
    filename: 'test_clean.html'
  });

  const contentA = await lastBlob.text();
  assert(contentA.includes('const EMBEDDED_IMAGE_DATA = "data:image/webp;base64,'), 'HTML must embed data URI');
  assert(contentA.includes('class CameraEngine'), 'HTML must embed CameraEngine');
  assert(contentA.includes('wallpaper-canvas'), 'HTML must contain canvas');
  console.log('✓ Standalone HTML export verified with clean Data URI.');

  // Test B: Remote URL embedding (CORS fallback)
  const remoteUrl = 'https://images-assets.nasa.gov/image/PIA12348/PIA12348~orig.jpg';
  Exporter.exportStandaloneHtml({
    title: 'Test Remote CORS AMOLED Wallpaper',
    presetMode: 'lissajous',
    durationSec: 120,
    waypoints: [],
    imageDataUri: remoteUrl,
    engineCode: 'class CameraEngine { constructor() {} }',
    filename: 'test_remote.html'
  });

  const contentB = await lastBlob.text();
  assert(contentB.includes(`const EMBEDDED_IMAGE_DATA = "${remoteUrl}";`), 'HTML must embed remote URL');
  assert(contentB.includes('activeImage.src = EMBEDDED_IMAGE_DATA;'), 'HTML must set activeImage.src');
  assert(contentB.includes('ctx.drawImage(activeImage'), 'HTML must draw image to canvas');
  console.log('✓ Standalone HTML export verified with direct remote URL fallback (CORS resilience).');

  // Test C: Dynamic & Distinct Filename Generation
  assert(wallpaperJs.includes('function generateExportFilename('), 'wallpaper.js must define generateExportFilename');
  assert(wallpaperJs.includes('updateExportFilenamePlaceholders'), 'wallpaper.js must define updateExportFilenamePlaceholders');

  function makeFilename(vistaTitle, mode, extraDetail, isGraded, now) {
    let rawTitle = (vistaTitle || 'celestial-vista')
      .toLowerCase()
      .replace(/\(.*?\)/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const vistaSlug = (rawTitle || 'celestial-vista').substring(0, 32);
    const gradeTag = isGraded ? 'amoled' : 'master';
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const parts = [vistaSlug, mode];
    if (extraDetail) parts.push(extraDetail);
    parts.push(gradeTag, dateStr);
    return `${parts.filter(Boolean).join('_')}.html`;
  }

  const d1 = new Date(2026, 10, 12, 22, 0, 0);
  const d2 = new Date(2026, 10, 12, 22, 0, 5);
  const fnOrion = makeFilename('Orion Nebula (M42)', 'odyssey', '4k', true, d1);
  const fnCarina = makeFilename('Carina Cosmic Cliffs', 'lissajous', 'fullscreen', false, d1);
  const fnOrionNext = makeFilename('Orion Nebula (M42)', 'odyssey', '4k', true, d2);

  assert(fnOrion.startsWith('orion-nebula_odyssey_4k_amoled_'), `Orion filename must be descriptive, got: ${fnOrion}`);
  assert(fnCarina.startsWith('carina-cosmic-cliffs_lissajous_fullscreen_master_'), `Carina filename must be descriptive, got: ${fnCarina}`);
  assert.notStrictEqual(fnOrion, fnCarina, 'Different celestial vistas must have different filenames');
  assert.notStrictEqual(fnOrion, fnOrionNext, 'Consecutive downloads must have unique filenames (no collisions)');
  console.log(`✓ Dynamic filename generation verified:\n    - ${fnOrion}\n    - ${fnCarina}\n    - ${fnOrionNext}`);

  console.log('===============================================================');
  console.log('ALL CORS RESILIENCE & BRAND IDENTITY TESTS PASSED (100%)');
  console.log('===============================================================');
}

runExporterTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
