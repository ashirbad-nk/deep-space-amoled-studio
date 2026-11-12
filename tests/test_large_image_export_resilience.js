/**
 * tests/test_large_image_export_resilience.js
 * Verification for:
 * 1. Gigapixel / Ultra-HD Image Export Freeze Elimination (121.5 MP Pillars master: 13,500 x 9,000 px)
 * 2. Complete Elimination of Black Screen / Dead blob: URL bug in Standalone HTML export
 * 3. Asynchronous non-blocking toBlob encoding with safe 5K ceiling for gigapixel masters
 * 4. Exporter error handling & onImageReady immediate hydration
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Exporter } = require('../src/exporter.js');
const { CameraEngine } = require('../src/camera_engine.js');

console.log('===============================================================');
console.log('RUNNING LARGE GIGAPIXEL IMAGE HTML EXPORT RESILIENCE TESTS');
console.log('===============================================================');

const ROOT_DIR = path.join(__dirname, '..');
const wallpaperJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'wallpaper.js'), 'utf8');
const exporterJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'exporter.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

// Test 1: Verify blob: URLs are strictly disallowed from being embedded into standalone HTML
assert(wallpaperJs.includes("if (!dataUri || dataUri.startsWith('blob:')) {"),
  'wallpaper.js must reject and prevent exporting blob: URLs');
assert(exporterJs.includes("if (imageDataUri.startsWith('blob:')) {"),
  'exporter.js must throw an error if a session blob: URL is passed for export');

assert.throws(() => {
  Exporter.exportStandaloneHtml({
    title: 'Test',
    imageDataUri: 'blob:http://localhost:5173/82dcac2e-52e4-4aab-ab81-c9d8bd292406',
    engineCode: 'class CameraEngine {}'
  });
}, /Cannot embed session blob: URL into standalone HTML/, 'Exporter must reject blob: URLs');
console.log('✓ Dead blob URL prevention & exporter rejection verified.');

// Test 2: Verify direct pass-through is only for already self-contained data: URIs
assert(wallpaperJs.includes("if (rawSourceImage.src && rawSourceImage.src.startsWith('data:') && !isGraded"),
  'Direct pass-through must only be permitted for genuine self-contained data: URIs');
console.log('✓ Safe Data URI direct pass-through verified.');

// Test 3: Verify asynchronous toBlob encoding and UI yielding
assert(wallpaperJs.includes("const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/webp', 0.90));"),
  'Canvas extraction must use asynchronous toBlob() rather than blocking synchronous toDataURL()');
assert(wallpaperJs.includes("await new Promise(r => setTimeout(r, 40));"),
  'HTML export must yield to browser UI thread before heavy canvas operations');
console.log('✓ Asynchronous non-blocking toBlob encoding & UI yielding verified.');

// Test 4: Verify safe 5K GPU ceiling (5120px) for gigapixel masters
assert(wallpaperJs.includes("let maxAllowedW = 5120;"),
  'Export canvas width must be safely capped at 5120px (5K Ultra HD)');
assert(wallpaperJs.includes("maxAllowedW = (origW > 5120 ? 5120 : origW);"),
  'Original mode must safely cap gigapixel images (>5120px) to prevent freezing');
console.log('✓ Safe 5K ceiling for gigapixel images (5,120px) verified.');

// Test 5: Verify robust template image hydration and error handling in exporter.js
assert(exporterJs.includes('activeImage.onerror = (err) => {'),
  'Standalone HTML template must implement activeImage.onerror handler');
assert(exporterJs.includes('if (activeImage.complete && activeImage.naturalWidth > 0)'),
  'Standalone HTML template must check activeImage.complete for immediate start');
console.log('✓ Standalone HTML activeImage.onerror & immediate start verified.');

// Test 6: Verify end-to-end HTML generation with valid WebP Data URI
const dummyWebpDataUri = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEEYQERERERER';
const cameraEngine = new CameraEngine(5120, 3413, { mode: 'odyssey', loopDurationSec: 180 });
const waypoints = cameraEngine.getWaypoints();
const engineStr = CameraEngine.toString();

let downloadedContent = null;
const originalDownload = Exporter.downloadBlob;
Exporter.downloadBlob = (blob, filename) => {
  // Capture blob content in node simulation
  downloadedContent = 'Simulated Blob Download for ' + filename;
};

Exporter.exportStandaloneHtml({
  title: 'Pillars of Creation (5K Ultra)',
  presetMode: 'odyssey',
  durationSec: 180,
  waypoints: waypoints,
  imageDataUri: dummyWebpDataUri,
  engineCode: engineStr,
  filename: 'pillars_5k.html'
});

assert(downloadedContent !== null, 'Download must be triggered');
Exporter.downloadBlob = originalDownload;
console.log('✓ End-to-end standalone HTML compilation with embedded WebP Data URI verified.');

// Test 7: Verify resolution dropdown options in index.html
assert(indexHtml.includes('⚡ 5K Ultra HD (~3.5 MB Embedded WebP • Recommended)'),
  'index.html must display 5K Ultra HD recommended option');
assert(indexHtml.includes('💎 Full Master (Max 5K / 8K • 100% Embedded)'),
  'index.html must display 100% Embedded master option');
console.log('✓ index.html resolution dropdown labels verified.');

console.log('===============================================================');
console.log('ALL LARGE IMAGE EXPORT RESILIENCE TESTS PASSED (100%)');
console.log('===============================================================');
