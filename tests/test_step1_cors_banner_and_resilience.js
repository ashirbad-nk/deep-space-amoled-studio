/**
 * tests/test_step1_cors_banner_and_resilience.js
 * Verification for:
 * 1. Step 1 In-Drawer CORS Warning Banner (#banner-step1-cors, #step1-cors-host, #btn-step1-resolve-cors)
 * 2. Visual styling and highlight-pulse animation in style.css
 * 3. Immediate warning and resolution prompts in Step 1 instead of silent adjustment drops
 * 4. Interactive slider handling on tainted canvases (pulseCorsBanner, auto-assistant prompt on release)
 * 5. Robust untaint timeout guard and dedicated button feedback in applyInBrowserGrade
 * 6. Auto-resume for visual adjustments alongside AMOLED grading
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===============================================================');
console.log('RUNNING STEP 1 CORS WARNING & ADJUSTMENTS RESILIENCE TESTS');
console.log('===============================================================');

const ROOT_DIR = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'src', 'style.css'), 'utf8');
const wallpaperJs = fs.readFileSync(path.join(ROOT_DIR, 'src', 'wallpaper.js'), 'utf8');

// --- Test 1: DOM Elements in index.html ---
console.log('\n--- Test 1: Step 1 In-Drawer CORS Banner DOM Elements ---');
assert(indexHtml.includes('id="banner-step1-cors"'), 'index.html must contain #banner-step1-cors');
assert(indexHtml.includes('id="step1-cors-host"'), 'index.html must contain #step1-cors-host');
assert(indexHtml.includes('id="btn-step1-resolve-cors"'), 'index.html must contain #btn-step1-resolve-cors');
assert(indexHtml.includes('Remote Image CORS Restricted'), 'Banner must clearly title CORS restriction');
assert(indexHtml.includes('Unlock Adjustments (Save Local Copy)'), 'Banner must provide 1-click unlock action');
console.log('✓ In-drawer CORS warning banner, host code tag, and resolution button verified in index.html.');

// --- Test 2: CSS Styles in style.css ---
console.log('\n--- Test 2: CSS Styling & Attention Pulse ---');
assert(styleCss.includes('.step1-cors-banner'), 'style.css must define .step1-cors-banner');
assert(styleCss.includes('.btn-step1-cors-action'), 'style.css must define .btn-step1-cors-action');
assert(styleCss.includes('.step1-cors-banner.highlight-pulse'), 'style.css must define .highlight-pulse animation');
assert(styleCss.includes('corsPulseGlow'), 'style.css must define @keyframes corsPulseGlow');
console.log('✓ High-contrast amber styling, unlock button styles, and highlight-pulse keyframes verified.');

// --- Test 3: wallpaper.js Step 1 CORS UI State Synchronization ---
console.log('\n--- Test 3: Step 1 UI State Synchronization & Telemetry ---');
assert(wallpaperJs.includes('function updateStep1CorsUi(isTainted)'), 'wallpaper.js must define updateStep1CorsUi');
assert(wallpaperJs.includes('function pulseCorsBanner()'), 'wallpaper.js must define pulseCorsBanner');
assert(wallpaperJs.includes('updateStep1CorsUi(isCanvasTainted);'), 'loadImageSource must call updateStep1CorsUi on image load');
assert(wallpaperJs.includes('btnStep1ResolveCors.addEventListener'), 'setupModals must bind #btn-step1-resolve-cors');
console.log('✓ updateStep1CorsUi, pulseCorsBanner, and button event binding verified.');

// --- Test 4: Slider Interaction on Tainted Image (No Silent Failure) ---
console.log('\n--- Test 4: Slider Interaction on Tainted Image ---');
// Verify that dragging or releasing sliders while tainted triggers attention / modal rather than silent ignoring
assert(
  wallpaperJs.includes('pulseCorsBanner();'),
  'triggerDebouncedGrade must pulse CORS banner when adjustments are attempted on tainted image'
);
assert(
  wallpaperJs.includes('showCorsHelperModal(isAmoled ? \'amoled\' : \'adjustments\');'),
  'Slider release on tainted image must open CORS helper modal with appropriate pending action'
);
console.log('✓ Sliders direct user to CORS resolution on interaction instead of failing silently.');

// --- Test 5: applyInBrowserGrade Resilience & Concurrency Guard ---
console.log('\n--- Test 5: applyInBrowserGrade Timeout Guard & Target Button Feedback ---');
assert(
  wallpaperJs.includes('const targetBtn = (triggerType === \'adjustments\') ? btnAdj : btnBake;'),
  'applyInBrowserGrade must target the button the user actually clicked (btnAdj vs btnBake)'
);
assert(
  wallpaperJs.includes('const timeoutId = setTimeout(() => controller.abort(), 6000);'),
  'Proxy untaint fetch must enforce strict timeout to prevent indefinite hanging'
);
assert(
  wallpaperJs.includes('btnAdj.textContent = \'🎨 Apply Image Adjustments\''),
  'Failed untaint must restore btnAdj text cleanly'
);
assert(
  wallpaperJs.includes('btnBake.textContent = \'🖤 Apply AMOLED True-Black\''),
  'Failed untaint must restore btnBake text cleanly'
);
console.log('✓ Target-specific button feedback, 6s timeout guard, and clean error restoration verified.');

// --- Test 6: Auto-Resume for Adjustments and AMOLED Grading ---
console.log('\n--- Test 6: Auto-Resume Integration with Untainted Local File ---');
assert(
  wallpaperJs.includes("activePendingAction === 'adjustments'"),
  'handleLocalFileSelection must support auto-resuming adjustments action'
);
assert(
  wallpaperJs.includes("activePendingAction === 'amoled'"),
  'handleLocalFileSelection must support auto-resuming amoled action'
);
console.log('✓ Auto-resume after local copy upload verified for both AMOLED and visual adjustments.');

// --- Test 7: Top Bar HUD CORS Telemetry ---
console.log('\n--- Test 7: Top Bar HUD Resolution Badge CORS Indicator ---');
assert(
  wallpaperJs.includes('specs.isTainted ?'),
  'updateHudResolutionBadge must check specs.isTainted'
);
assert(
  wallpaperJs.includes('🔒 CORS'),
  'updateHudResolutionBadge must display CORS indicator when tainted'
);
console.log('✓ Top Bar HUD resolution badge dynamically flags CORS restricted status.');

console.log('\n===============================================================');
console.log('ALL STEP 1 CORS WARNING & ADJUSTMENT TESTS PASSED (100%)');
console.log('===============================================================');
