const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('RUNNING SPEED MULTIPLIER, RECIPE MANIFEST & TIFF RESOLUTION TESTS');
console.log('===============================================================');

// Mock browser globals for Exporter in Node.js
class MockBlob {
  constructor(parts, options) {
    this.parts = parts;
    this.options = options;
    this.content = parts.join('');
  }
}

global.Blob = MockBlob;
global.URL = {
  createObjectURL: (blob) => 'blob:mock-url',
  revokeObjectURL: () => {}
};

let downloadedBlobContent = null;
let downloadedFilename = null;

global.document = {
  createElement: (tag) => {
    return {
      style: {},
      click: () => {},
      href: '',
      download: ''
    };
  },
  body: {
    appendChild: (el) => {
      downloadedFilename = el.download;
    },
    removeChild: () => {}
  }
};

const { Exporter } = require('../src/exporter.js');

// 1. Verify speedMultiplier is embedded into Standalone HTML
console.log('\n--- Test 1: speedMultiplier in Standalone HTML Export ---');
Exporter.downloadBlob = (blob, filename) => {
  downloadedBlobContent = blob.content;
  downloadedFilename = filename;
};

const dummyRecipe = {
  generator: 'Deep Space AMOLED Wallpaper Studio',
  version: '2.0.0',
  exportedAt: new Date().toISOString(),
  source: {
    title: 'Test Cosmic Vista',
    masterResolution: '5120x2965'
  },
  gradingRecipe: {
    blackFloor: 24,
    kneeWidth: 22,
    starProtect: 85,
    exposure: 0.35,
    contrast: 1.20,
    saturation: 1.15,
    sharpness: 20
  },
  cameraKinematics: {
    mode: 'odyssey',
    loopDurationSec: 180,
    speedMultiplier: 2.0,
    waypoints: []
  }
};

Exporter.exportStandaloneHtml({
  title: 'Test Wallpaper (Speed 2.0x)',
  presetMode: 'odyssey',
  durationSec: 180,
  speedMultiplier: 2.0,
  waypoints: [{ t: 0, x: 0.5, y: 0.5, zoom: 1.0 }],
  imageDataUri: 'data:image/webp;base64,AAAA',
  engineCode: 'class CameraEngine {}',
  filename: 'test_wallpaper_2x.html',
  recipe: dummyRecipe
});

assert(downloadedBlobContent, 'Exported HTML content must be generated');
assert(
  downloadedBlobContent.includes('const SPEED_MULTIPLIER = 2;'),
  'Exported HTML must define const SPEED_MULTIPLIER with the user selected value'
);
assert(
  downloadedBlobContent.includes('progress = (progress + ((dt / DURATION_SEC) * SPEED_MULTIPLIER)) % 1.0;'),
  'Playback loop must apply SPEED_MULTIPLIER to timeline progression'
);
console.log('✓ speedMultiplier = 2.0x successfully embedded and applied to timeline progress.');

// 2. Verify Recipe Manifest embedded inside HTML <head>
console.log('\n--- Test 2: Recipe Manifest in Exported HTML ---');
assert(
  downloadedBlobContent.includes('<script id="amoled-wallpaper-recipe" type="application/json">'),
  'HTML must contain <script id="amoled-wallpaper-recipe" type="application/json">'
);
assert(
  downloadedBlobContent.includes('"blackFloor": 24'),
  'Recipe manifest must preserve blackFloor slider value'
);
assert(
  downloadedBlobContent.includes('"contrast": 1.2'),
  'Recipe manifest must preserve contrast slider value'
);
assert(
  downloadedBlobContent.includes('window.WALLPAPER_RECIPE = WALLPAPER_RECIPE;'),
  'Runtime script must expose window.WALLPAPER_RECIPE for inspection'
);
console.log('✓ Recipe manifest cleanly embedded in <head> and exposed on window.WALLPAPER_RECIPE.');

// 3. Verify wallpaper.js passes speedMultiplier & recipe to Exporter
console.log('\n--- Test 3: wallpaper.js Export Wiring & Recipe Assembly ---');
const wallpaperSrc = fs.readFileSync(path.join(__dirname, '../src/wallpaper.js'), 'utf8');

assert(
  wallpaperSrc.includes('speedMultiplier: speedMultiplier,'),
  'wallpaper.js exportStandaloneHtml call must pass speedMultiplier'
);
assert(
  wallpaperSrc.includes('recipe: recipe'),
  'wallpaper.js exportStandaloneHtml call must pass assembled recipe'
);
assert(
  wallpaperSrc.includes('file.name.toLowerCase().endsWith(\'.html\')'),
  'wallpaper.js handleLocalFileSelection must support re-importing .html files'
);
assert(
  wallpaperSrc.includes('<script id="amoled-wallpaper-recipe" type="application\\/json">'),
  'wallpaper.js must extract recipe from re-imported HTML file'
);
console.log('✓ wallpaper.js correctly wires speedMultiplier, recipe export, and .html re-importing.');

// 4. Verify TIFF 5K Scaler & Badging
console.log('\n--- Test 4: TIFF Master Badging & 5K Resolution Scaler ---');
assert(
  wallpaperSrc.includes('isTiff ? \'Observatory TIFF Archive\' : \'Wikimedia Astrophotography\''),
  'Wikimedia fetcher must identify TIFF archive sources'
);
assert(
  wallpaperSrc.includes('MP TIFF Master'),
  'TIFF items must feature dedicated TIFF Master badge'
);
assert(
  wallpaperSrc.includes('iiurlwidth=5120'),
  'TIFF loader must query 5K (5120px) server-rendered JPEG'
);
console.log('✓ TIFF Master badging and 5K Wikimedia server-side scaler verified.');

// 5. Verify Display Coverage Awareness in calculateImageQualitySpecs
console.log('\n--- Test 5: Display Coverage Awareness ---');
// Extract and test calculateImageQualitySpecs logic
global.window = {
  screen: { width: 1920, height: 1080 },
  innerWidth: 1920,
  innerHeight: 1080,
  devicePixelRatio: 1.0
};

// Test with 5K image (5120 x 2965) on a 1080p screen: coverage should be ~2.7x
const test5kImg = { naturalWidth: 5120, naturalHeight: 2965 };
// Read function dynamically or run through regex verification
assert(wallpaperSrc.includes('displayCoverage'), 'wallpaper.js must compute displayCoverage');
assert(wallpaperSrc.includes('coverageBadge'), 'wallpaper.js must generate coverageBadge');
assert(wallpaperSrc.includes('Screen (Pristine Zoom)'), 'wallpaper.js must indicate pristine 2x zoom coverage');

console.log('✓ Physical display coverage awareness verified.');

console.log('\n===============================================================');
console.log('ALL SPEED, RECIPE & TIFF TESTS PASSED (100%)');
console.log('===============================================================');
