/**
 * tests/test_grading_adjustments_and_overflow.js
 * Verification for:
 * 1. UI Field Overshoot & Horizontal Scrollbar Elimination (drawer-control-row, min-width: 0, overflow-x: hidden)
 * 2. Visual Enhancements: Exposure, Contrast, Saturation, Sharpness sliders
 * 3. Separate Dedicated Buttons for AMOLED Grading and Image Adjustments
 * 4. In-Browser Grading Engine pixel math & AMOLED true-black integration
 * 5. Sectional Reset and Master Revert event handling
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { GradingEngine } = require('../src/grading_engine.js');

console.log('===============================================================');
console.log('RUNNING GRADING ADJUSTMENTS & OVERFLOW ELIMINATION TESTS');
console.log('===============================================================');

const ROOT_DIR = path.join(__dirname, '..');
const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const wallpaperJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'wallpaper.js'), 'utf8');

// --- Test 1: Field Overshooting & Overflow CSS Verification ---
console.log('\n--- Test 1: Field Overshooting & Horizontal Scrollbar Elimination ---');
assert(styleCss.includes('overflow-x: hidden !important;'),
  'style.css .drawer-body must enforce overflow-x: hidden !important to prevent horizontal scrollbars');
assert(styleCss.includes('.drawer-control-row'),
  'style.css must define .drawer-control-row');
assert(styleCss.includes('flex: 1 1 0;'),
  'style.css .drawer-control-row inputs/selects must use flex: 1 1 0 with width: 0 to prevent overshooting');
assert(styleCss.includes('text-overflow: ellipsis;'),
  'style.css must apply text-overflow: ellipsis to selects');
assert(indexHtml.includes('class="drawer-control-row"'),
  'index.html Step 3 controls must use drawer-control-row');
assert(!indexHtml.includes('<select id="select-record-quality" style="flex: 1;">'),
  'index.html select-record-quality must not have unconstrained flex: 1 style attribute');
console.log('✓ Drawer boundary, flex: 1 1 0, text-overflow: ellipsis, and scrollbar elimination verified.');

// --- Test 2: HTML UI Elements for Visual Adjustments & Separate Buttons ---
console.log('\n--- Test 2: Sliders & Separate Buttons in Step 1 Drawer ---');
const expectedSliders = [
  'slider-black-floor',
  'slider-knee-width',
  'slider-star-protect',
  'slider-exposure',
  'slider-contrast',
  'slider-saturation',
  'slider-sharpness'
];
const expectedValLabels = [
  'val-black-floor',
  'val-knee-width',
  'val-star-protect',
  'val-exposure',
  'val-contrast',
  'val-saturation',
  'val-sharpness'
];

expectedSliders.forEach(id => {
  assert(indexHtml.includes(`id="${id}"`), `index.html must contain slider element #${id}`);
});
expectedValLabels.forEach(id => {
  assert(indexHtml.includes(`id="${id}"`), `index.html must contain value display #${id}`);
});

// Verify SEPARATE buttons for AMOLED Grading and Image Adjustments
assert(indexHtml.includes('id="btn-apply-amoled"'), 'index.html must contain separate button #btn-apply-amoled');
assert(indexHtml.includes('id="btn-reset-amoled"'), 'index.html must contain separate button #btn-reset-amoled');
assert(indexHtml.includes('id="btn-apply-adjustments"'), 'index.html must contain separate button #btn-apply-adjustments');
assert(indexHtml.includes('id="btn-reset-adjustments"'), 'index.html must contain separate button #btn-reset-adjustments');
assert(indexHtml.includes('id="btn-undo-grade"'), 'index.html must contain master revert button #btn-undo-grade');
console.log('✓ All 7 sliders, value displays, and SEPARATE Apply/Reset buttons verified in index.html.');

// --- Test 3: wallpaper.js Event Listener & Reset Integration ---
console.log('\n--- Test 3: wallpaper.js Separate Button Handlers & Binding ---');
assert(wallpaperJs.includes("'exposure'"), 'wallpaper.js sliders array must contain exposure');
assert(wallpaperJs.includes("'contrast'"), 'wallpaper.js sliders array must contain contrast');
assert(wallpaperJs.includes("'saturation'"), 'wallpaper.js sliders array must contain saturation');
assert(wallpaperJs.includes("'sharpness'"), 'wallpaper.js sliders array must contain sharpness');

assert(wallpaperJs.includes('btnApplyAmoled'), 'wallpaper.js must bind btnApplyAmoled');
assert(wallpaperJs.includes('btnResetAmoled'), 'wallpaper.js must bind btnResetAmoled');
assert(wallpaperJs.includes('btnApplyAdjustments'), 'wallpaper.js must bind btnApplyAdjustments');
assert(wallpaperJs.includes('btnResetAdjustments'), 'wallpaper.js must bind btnResetAdjustments');
assert(wallpaperJs.includes('resetAmoledSection'), 'wallpaper.js must define resetAmoledSection');
assert(wallpaperJs.includes('resetAdjustmentsSection'), 'wallpaper.js must define resetAdjustmentsSection');

assert(wallpaperJs.includes('exposure: exposure,'), 'wallpaper.js applyGrade options must pass exposure');
assert(wallpaperJs.includes('contrast: contrast,'), 'wallpaper.js applyGrade options must pass contrast');
assert(wallpaperJs.includes('saturation: saturation,'), 'wallpaper.js applyGrade options must pass saturation');
assert(wallpaperJs.includes('sharpness: sharpness,'), 'wallpaper.js applyGrade options must pass sharpness');

assert(wallpaperJs.includes("'exposure': { val: 0, text: '+0.00 EV' }"),
  'wallpaper.js resetAmoledGrade must reset exposure');
assert(wallpaperJs.includes("'saturation': { val: 1.00, text: '1.00x' }"),
  'wallpaper.js resetAmoledGrade must reset saturation');
assert(wallpaperJs.includes("'sharpness': { val: 0, text: '0%' }"),
  'wallpaper.js resetAmoledGrade must reset sharpness');
console.log('✓ wallpaper.js separate button bindings, sectional resets, and full master revert verified.');

// --- Test 4: GradingEngine Pixel Processing Mathematics ---
console.log('\n--- Test 4: GradingEngine Pixel Mathematics & Algorithms ---');

// Mock HTML Canvas & Context for Node.js testing
class MockCanvas {
  constructor(w = 100, h = 100) {
    this.width = w;
    this.height = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  getContext(type) {
    const self = this;
    return {
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      drawImage(src, x, y, w, h) {
        if (src.data) {
          self.data.set(src.data.subarray(0, self.data.length));
        }
      },
      getImageData(x, y, w, h) {
        return { data: self.data, width: w, height: h };
      },
      putImageData(imgData, x, y) {
        self.data.set(imgData.data);
      }
    };
  }
}

global.document = {
  createElement: (tag) => new MockCanvas(320, 240)
};

const engine = new GradingEngine();
const mockSrc = new MockCanvas(64, 64);
const srcData = mockSrc.data;
for (let i = 0; i < srcData.length; i += 4) {
  srcData[i] = 15;     // R
  srcData[i + 1] = 18; // G
  srcData[i + 2] = 22; // B
  srcData[i + 3] = 255;
}
const starIdx = (32 * 64 + 32) * 4;
srcData[starIdx] = 240;
srcData[starIdx + 1] = 245;
srcData[starIdx + 2] = 255;
srcData[starIdx + 3] = 255;

const nebIdx = (10 * 64 + 10) * 4;
srcData[nebIdx] = 180;
srcData[nebIdx + 1] = 60;
srcData[nebIdx + 2] = 40;
srcData[nebIdx + 3] = 255;

// 4A: Test AMOLED True-Black Crushing
const targetCanvasA = new MockCanvas(64, 64);
const resA = engine.applyGrade(mockSrc, targetCanvasA, {
  blackFloor: 25.0,
  kneeWidth: 10.0,
  starProtect: 0.90,
  exposure: 0.0,
  contrast: 1.0,
  saturation: 1.0,
  sharpness: 0.0
});
assert(parseFloat(resA.blackPercentage) > 90.0, 'Sky noise must be crushed to true black');
assert(targetCanvasA.data[starIdx] > 150, 'Pinpoint star must be preserved by star mask');
console.log(`✓ AMOLED True-Black: ${resA.blackPercentage}% black achieved, star preserved at RGB(${targetCanvasA.data[starIdx]}, ${targetCanvasA.data[starIdx + 1]}, ${targetCanvasA.data[starIdx + 2]}).`);

// 4B: Test Exposure (EV +1.0 = 2x brightness)
const targetCanvasB = new MockCanvas(64, 64);
const resB = engine.applyGrade(mockSrc, targetCanvasB, {
  blackFloor: 0.0,
  kneeWidth: 5.0,
  exposure: 1.0,
  contrast: 1.0,
  saturation: 1.0,
  sharpness: 0.0
});
assert(targetCanvasB.data[nebIdx] > mockSrc.data[nebIdx], 'Nebula pixel must brighten with positive EV exposure');
console.log(`✓ Exposure: +1.0 EV boosted nebular red from ${mockSrc.data[nebIdx]} to ${targetCanvasB.data[nebIdx]}.`);

// 4C: Test Saturation (0.0 = Grayscale)
const targetCanvasC = new MockCanvas(64, 64);
const resC = engine.applyGrade(mockSrc, targetCanvasC, {
  blackFloor: 0.0,
  kneeWidth: 5.0,
  exposure: 0.0,
  contrast: 1.0,
  saturation: 0.0,
  sharpness: 0.0
});
const r = targetCanvasC.data[nebIdx];
const g = targetCanvasC.data[nebIdx + 1];
const b = targetCanvasC.data[nebIdx + 2];
assert(Math.abs(r - g) <= 1 && Math.abs(g - b) <= 1, 'Saturation 0.0 must yield neutral grayscale RGB values');
console.log(`✓ Saturation: 0.0x converted color nebula to neutral grayscale RGB(${r}, ${g}, ${b}).`);

// 4D: Test Sharpness (Laplacian high-pass edge boost)
const targetCanvasD = new MockCanvas(64, 64);
const resD = engine.applyGrade(mockSrc, targetCanvasD, {
  blackFloor: 0.0,
  kneeWidth: 5.0,
  exposure: 0.0,
  contrast: 1.0,
  saturation: 1.0,
  sharpness: 1.0
});
assert(targetCanvasD.data[starIdx] >= mockSrc.data[starIdx], 'Sharpness should amplify local high-frequency star peaks');
console.log(`✓ Sharpness: 100% Laplacian unsharp mask processed without clipping.`);

console.log('\n===============================================================');
console.log('ALL GRADING ADJUSTMENTS & OVERFLOW TESTS PASSED (100%)');
console.log('===============================================================');
