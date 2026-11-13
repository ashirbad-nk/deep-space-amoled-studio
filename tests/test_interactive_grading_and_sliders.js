const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock canvas & 2D context for Node.js before importing GradingEngine
class MockCanvas {
  constructor(w = 10, h = 10) {
    this.width = w;
    this.height = h;
    this.naturalWidth = w;
    this.naturalHeight = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  getContext() {
    const self = this;
    return {
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      drawImage(src, x, y, w, h) {
        if (src && src.data) {
          self.data.set(src.data.subarray(0, self.data.length));
        }
      },
      getImageData(x, y, w, h) {
        return { data: self.data, width: w || self.width, height: h || self.height };
      },
      putImageData(imgData) {
        self.data.set(imgData.data);
      }
    };
  }
}

if (typeof document === 'undefined') {
  global.document = {
    createElement: () => new MockCanvas(10, 10)
  };
}

const { GradingEngine } = require('../src/grading_engine.js');

console.log('===============================================================');
console.log('RUNNING INTERACTIVE GRADING & SLIDER LIVE PREVIEW TESTS');
console.log('===============================================================');

// 1. Verify wallpaper.js syntax and applyInBrowserGrade function definition
console.log('\n--- Test 1: applyInBrowserGrade Signature & triggerType Definition ---');
const wallpaperSrc = fs.readFileSync(path.join(__dirname, '../src/wallpaper.js'), 'utf8');

assert(
  wallpaperSrc.includes('function applyInBrowserGrade(triggerType = \'amoled\', isPreview = false)'),
  'applyInBrowserGrade must declare triggerType and isPreview with safe defaults'
);
assert(
  !wallpaperSrc.includes('function applyInBrowserGrade() {'),
  'Old broken zero-parameter signature must be eliminated'
);
console.log('✓ applyInBrowserGrade signature properly declares (triggerType = \'amoled\', isPreview = false).');

// Verify that triggerType is used safely without throwing ReferenceError
const fnStart = wallpaperSrc.indexOf('function applyInBrowserGrade(');
const fnEnd = wallpaperSrc.indexOf('function resetAmoledSection()');
const fnBody = wallpaperSrc.slice(fnStart, fnEnd);

assert(fnBody.includes('if (!isPreview)'), 'Must conditionally skip modal / heavy UI updates during live isPreview');
assert(fnBody.includes('btnAmoled.textContent = \'✓ AMOLED Grade Baked!\''), 'Must provide affirmative user feedback on AMOLED bake');
assert(fnBody.includes('btnAdj.textContent = \'✓ Adjustments Applied!\''), 'Must provide affirmative user feedback on adjustments bake');
assert(fnBody.includes('renderFrame();'), 'Must immediately redraw viewport canvas after updating activeRenderDrawable');
console.log('✓ UI feedback, renderFrame() call, and isPreview branching verified inside applyInBrowserGrade.');

// 2. Verify Debounced Live Preview and Slider Event Handlers
console.log('\n--- Test 2: Live Debounced Preview & Slider Event Handlers ---');
assert(
  wallpaperSrc.includes('triggerDebouncedGrade'),
  'wallpaper.js must implement triggerDebouncedGrade for real-time slider feedback'
);
assert(
  wallpaperSrc.includes('triggerDebouncedGrade(isAmoled ? \'amoled\' : \'adjustments\', true);'),
  'Moving any slider must trigger debounced live preview'
);
assert(
  wallpaperSrc.includes('el.addEventListener(\'change\', () => {'),
  'Releasing slider must trigger full-quality bake via change event'
);
console.log('✓ Debounced live slider preview and change-event full baking verified.');

// 3. Verify Star Protection vs Dark Sensor Noise Crushing in GradingEngine
console.log('\n--- Test 3: Star Protection vs Faint Sensor Noise Crushing ---');
const gradingEngine = new GradingEngine();

// Create an image buffer with:
// Pixel 0: Faint background camera noise [8, 10, 14, 255] (low lum, slight blue tint)
// Pixel 1: True pinpoint star [220, 230, 255, 255] (high lum, pinpoint stellar core)
// Pixel 2: Pitch black [0, 0, 0, 255]
const testW = 3;
const testH = 1;
const testData = new Uint8ClampedArray(testW * testH * 4);

// Pixel 0: Noise
testData[0] = 8;
testData[1] = 10;
testData[2] = 14;
testData[3] = 255;

// Pixel 1: Pinpoint Star
testData[4] = 220;
testData[5] = 230;
testData[6] = 255;
testData[7] = 255;

// Pixel 2: Pitch black
testData[8] = 0;
testData[9] = 0;
testData[10] = 0;
testData[11] = 255;

const mockSrc = new MockCanvas(testW, testH);
mockSrc.data.set(testData);
mockSrc.naturalWidth = testW;
mockSrc.naturalHeight = testH;

const mockOut = new MockCanvas(testW, testH);

const stats = gradingEngine.applyGrade(mockSrc, mockOut, {
  blackFloor: 22,
  kneeWidth: 24,
  starProtect: 0.85,
  exposure: 0.0,
  contrast: 1.0,
  saturation: 1.0,
  sharpness: 0.0,
  maxDimension: 5120
});

const resData = mockOut.data;

// Pixel 0 (noise) should be crushed to true black [0, 0, 0]
assert.strictEqual(resData[0], 0, 'Noise red channel must be crushed to 0');
assert.strictEqual(resData[1], 0, 'Noise green channel must be crushed to 0');
assert.strictEqual(resData[2], 0, 'Noise blue channel must be crushed to 0');

// Pixel 1 (star) must be protected and remain brightly visible
assert(resData[4] > 100, `Star red channel should be preserved (>100), got ${resData[4]}`);
assert(resData[5] > 100, `Star green channel should be preserved (>100), got ${resData[5]}`);
assert(resData[6] > 100, `Star blue channel should be preserved (>100), got ${resData[6]}`);

// Pixel 2 (pitch black) must remain 0
assert.strictEqual(resData[8], 0);
assert.strictEqual(resData[9], 0);
assert.strictEqual(resData[10], 0);

console.log(`✓ Faint sensor noise correctly crushed to [0, 0, 0] while pinpoint star preserved at RGB(${resData[4]}, ${resData[5]}, ${resData[6]}).`);
console.log(`✓ AMOLED true black stats: ${stats.blackPercentage}% black pixels achieved in ${stats.elapsedMs}ms.`);

// 4. Verify Master Revert and Section Resets
console.log('\n--- Test 4: Master Revert & Sectional Resets ---');
assert(wallpaperSrc.includes('btnUndo.textContent = \'✓ Reverted!\''), 'Master revert must confirm visually');
assert(wallpaperSrc.includes('renderFrame();'), 'Master revert must trigger renderFrame()');
assert(wallpaperSrc.includes('resetAmoledSection()'), 'resetAmoledSection must exist');
assert(wallpaperSrc.includes('resetAdjustmentsSection()'), 'resetAdjustmentsSection must exist');
console.log('✓ Master revert and Section 1 & 2 reset functions verified.');

console.log('\n===============================================================');
console.log('ALL INTERACTIVE GRADING & SLIDER TESTS PASSED (100%)');
console.log('===============================================================');
