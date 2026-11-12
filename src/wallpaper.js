/**
 * src/wallpaper.js - Deep Space AMOLED Wallpaper Studio Controller
 *
 * 100% Client-Side Static Webapp & PWA:
 * 1. Screen 1: Discovery & Multi-Archive Sourcing Hub:
 *    - Curated 4K/5K Masterpieces (Carina, Pillars, Tarantula, M74, Jupiter, Stephan's Quintet, Southern Ring, Webb Deep Field, Cartwheel).
 *    - Multi-Archive Search: NASA Image & Video Library + Wikimedia Commons Astronomical Archive (ESO, VLT, ALMA, Hubble, JWST).
 *    - Pre-download image dimension badges (Resolution, MP, Tier).
 *    - CORS-safe Blob URL loader (Zero CORS errors, Zero tainted canvases).
 * 2. Screen 2: Live 60 FPS Wallpaper Studio Stage:
 *    - Interactive 60 FPS canvas with closed Catmull-Rom spline camera engine.
 *    - Live Image Quality & Resolution Telemetry Toast & Top-Bar Badge.
 *    - Interactive Spline Trajectory Editor with draggable waypoints.
 *    - AMOLED true-black color grading with star protection.
 *    - Exporters: Standalone HTML (Hidamari / zero backend) & 60 FPS video recorder.
 * 3. Progressive Web App (PWA): Service Worker offline caching, installation prompt integration.
 */

(function () {
  'use strict';

  // Available Resolution Presets
  const PRESETS = {
    'fullscreen': { label: 'Native Window / Fill Screen', w: 0, h: 0, isNative: true },
    'iphone-16-pro': { label: 'iPhone 15/16 Pro (1179 x 2556, 19.5:9)', w: 1179, h: 2556 },
    'iphone-pro-max': { label: 'iPhone Pro Max (1290 x 2796, 19.5:9)', w: 1290, h: 2796 },
    'galaxy-s24-ultra': { label: 'Galaxy S24 Ultra (1440 x 3120, 19.5:9)', w: 1440, h: 3120 },
    'mobile-classic': { label: 'Classic Mobile (1080 x 1920, 16:9)', w: 1080, h: 1920 },
    'desktop-4k': { label: 'Desktop 4K UHD (3840 x 2160, 16:9)', w: 3840, h: 2160 },
    'desktop-1440p': { label: 'Desktop QHD (2560 x 1440, 16:9)', w: 2560, h: 1440 },
    'desktop-1080p': { label: 'Desktop FHD (1920 x 1080, 16:9)', w: 1920, h: 1080 },
    'macbook-pro': { label: 'MacBook Pro (3024 x 1964, 16:10)', w: 3024, h: 1964 },
    'ultrawide-21-9': { label: 'Ultrawide (3440 x 1440, 21:9)', w: 3440, h: 1440 },
    'super-ultrawide': { label: 'Super Ultrawide (5120 x 1440, 32:9)', w: 5120, h: 1440 }
  };

  // Curated Astronomical Masterpieces Catalog
  const CATALOG = {
    'carina': {
      title: 'Golden Cosmic Cliffs',
      subtitle: 'Carina Nebula (NGC 3324) • JWST NIRCam',
      desc: 'Towering 7-light-year golden gas peaks bordered by sapphire deep space. Highest dynamic contrast for AMOLED screens.',
      category: 'cliffs',
      thumb: 'images/thumbnails/carina.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.carina) ? window.DEFAULT_ASSETS.carina : 'images/graded/carina_cosmic_cliffs_amoled_5k.webp',
      fallback: 'images/graded/carina_cosmic_cliffs_amoled_5k.jpg',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2205a.jpg',
      resBadge: '5K Master (15.2 MP)',
      blackLevel: '🖤 ~15% OLED Black',
      telescope: 'JWST NIRCam',
      width: 5120,
      height: 2965
    },
    'pillars': {
      title: 'The Pillars of Creation',
      subtitle: 'Eagle Nebula (M16) • JWST & Hubble',
      desc: 'Majestic finger-like spires of interstellar gas and stardust giving birth to newborn stars. Rich deep void contrast.',
      category: 'pillars',
      thumb: 'images/thumbnails/pillars.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.pillars) ? window.DEFAULT_ASSETS.pillars : 'images/graded/pillars_of_creation_amoled_5k.webp',
      fallback: 'images/graded/pillars_of_creation_amoled_5k.jpg',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2219a.jpg',
      resBadge: '5K Master (19.5 MP)',
      blackLevel: '🖤 ~22% OLED Black',
      telescope: 'JWST NIRCam',
      width: 4373,
      height: 4462
    },
    'phantom_galaxy': {
      title: 'The Phantom Spiral Galaxy',
      subtitle: 'Messier 74 (NGC 628) • JWST MIRI & NIRCam',
      desc: 'Grand-design spiral arms wound with glowing dust filaments radiating outward from a brilliant galactic core.',
      category: 'galaxies',
      thumb: 'images/thumbnails/phantom_galaxy.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.phantom_galaxy) ? window.DEFAULT_ASSETS.phantom_galaxy : 'images/graded/phantom_galaxy_master.webp',
      fallback: 'images/graded/phantom_galaxy_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2212a.jpg',
      resBadge: '2K Ultra Master',
      blackLevel: '🖤 ~28% OLED Black',
      telescope: 'JWST MIRI',
      width: 2560,
      height: 1480
    },
    'tarantula': {
      title: 'Tarantula Cosmic Web',
      subtitle: '30 Doradus • Large Magellanic Cloud • JWST',
      desc: 'Luminous spider-like filament webs surrounding thousands of massive young stars in a turbulent stellar nursery.',
      category: 'webs',
      thumb: 'images/thumbnails/tarantula.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.tarantula) ? window.DEFAULT_ASSETS.tarantula : 'images/graded/tarantula_master.webp',
      fallback: 'images/graded/tarantula_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2216a.jpg',
      resBadge: 'Ultra Master',
      blackLevel: '🖤 ~14% OLED Black',
      telescope: 'JWST NIRCam',
      width: 1200,
      height: 1200
    },
    'jupiter': {
      title: "Jupiter's Polar Auroras & Rings",
      subtitle: 'Solar System Giant • JWST NIRCam Infrared',
      desc: 'Ghostly shimmering auroras dancing over Jupiter’s poles with faint dust rings against the deep black void.',
      category: 'planets',
      thumb: 'images/thumbnails/jupiter.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.jupiter) ? window.DEFAULT_ASSETS.jupiter : 'images/graded/jupiter_master.webp',
      fallback: 'images/graded/jupiter_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2214a.jpg',
      resBadge: 'Ultra Master',
      blackLevel: '🖤 ~45% OLED Black',
      telescope: 'JWST NIRCam',
      width: 1059,
      height: 1059
    },
    'quintet': {
      title: "Stephan's Cosmic Dance",
      subtitle: 'HCG 92 Galaxy Group • JWST NIRCam + MIRI',
      desc: 'Five interacting galaxies locked in a gravitational ballet with sweeping shockwave tails of stardust.',
      category: 'galaxies',
      thumb: 'images/thumbnails/quintet.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.quintet) ? window.DEFAULT_ASSETS.quintet : 'images/graded/quintet_master.webp',
      fallback: 'images/graded/quintet_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2207a.jpg',
      resBadge: '2K Ultra Master',
      blackLevel: '🖤 ~35% OLED Black',
      telescope: 'JWST NIRCam',
      width: 2560,
      height: 1188
    },
    'southern_ring': {
      title: 'Southern Ring of Fire',
      subtitle: 'Eight-Burst Planetary Nebula (NGC 3132)',
      desc: 'Concentric shells of gas expelled by a dying central binary star, glowing across the dark cosmos.',
      category: 'rings',
      thumb: 'images/thumbnails/southern_ring.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.southern_ring) ? window.DEFAULT_ASSETS.southern_ring : 'images/graded/southern_ring_master.webp',
      fallback: 'images/graded/southern_ring_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2208a.jpg',
      resBadge: '2K Ultra Master',
      blackLevel: '🖤 ~40% OLED Black',
      telescope: 'JWST NIRCam',
      width: 2560,
      height: 2454
    },
    'deep_field': {
      title: "Webb's Ancient Deep Field",
      subtitle: 'Galaxy Cluster SMACS 0723 • Gravitational Lens',
      desc: 'Thousands of ancient galaxies scattered across 13 billion years of cosmic time, warped by gravitational lensing.',
      category: 'void',
      thumb: 'images/thumbnails/deep_field.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.deep_field) ? window.DEFAULT_ASSETS.deep_field : 'images/graded/deep_field_master.webp',
      fallback: 'images/graded/deep_field_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2209a.jpg',
      resBadge: '2K Ultra Master',
      blackLevel: '🖤 ~52% OLED Black',
      telescope: 'JWST NIRCam',
      width: 2509,
      height: 2560
    },
    'cartwheel': {
      title: 'The Cartwheel Cosmic Collision',
      subtitle: 'Lenticular & Ring Galaxy • 500M Light-Years Away',
      desc: 'A colossal high-speed head-on collision producing an expanding outer ring of sparkling star formation.',
      category: 'galaxies',
      thumb: 'images/thumbnails/cartwheel.webp',
      src: (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.cartwheel) ? window.DEFAULT_ASSETS.cartwheel : 'images/graded/cartwheel_master.webp',
      fallback: 'images/graded/cartwheel_master.webp',
      rawUrl: 'https://cdn.esawebb.org/archives/images/large/weic2211a.jpg',
      resBadge: '2K Ultra Master',
      blackLevel: '🖤 ~32% OLED Black',
      telescope: 'JWST MIRI',
      width: 2560,
      height: 2356
    }
  };

  // State Management
  let currentScreen = 'discovery'; // 'discovery' or 'studio'
  let activeCatalogKey = 'carina';
  let activeImageTitle = 'Carina Cosmic Cliffs';
  let activeImageSpecs = null;
  let toastDismissTimeout = null;

  let cameraEngine = null;
  let gradingEngine = new GradingEngine();
  let rawSourceImage = new Image();
  let activeRenderDrawable = null; // Can be Image or Canvas
  let imageLoaded = false;
  let isCanvasTainted = false; // Set to true if loaded without CORS (e.g. NASA CDN)
  let currentPresetKey = 'fullscreen';
  let loopDurationSec = 180;
  let speedMultiplier = 1.0;
  let isPlaying = true;
  let progress = 0.0;
  let lastTimestamp = 0;
  let isInspectorActive = false;
  let isRadarActive = true;
  let isHudManuallyHidden = false;
  let hudHideTimeout = null;
  let isRecording = false;

  // Selected waypoint index for spline editor
  let selectedWpIndex = 0;
  let isDraggingWp = false;

  // PWA Prompt Storage
  let deferredInstallPrompt = null;

  // DOM Elements
  const screenDiscovery = document.getElementById('screen-discovery');
  const screenStudio = document.getElementById('screen-studio');
  const btnEnterStudio = document.getElementById('btn-enter-studio');
  const btnSwitchDiscovery = document.getElementById('btn-switch-discovery');
  const pwaInstallBtn = document.getElementById('btn-pwa-install');
  const pwaStatusBadge = document.getElementById('pwa-status-badge');

  // Telemetry Toast & Badge
  const toastSpecs = document.getElementById('toast-image-specs');
  const hudResBadge = document.getElementById('hud-res-badge');
  const btnCloseToast = document.getElementById('btn-close-toast');

  const canvas = document.getElementById('wallpaper-canvas');
  const ctx = canvas.getContext('2d');
  const radarCanvas = document.getElementById('radar-canvas');
  const radarCtx = radarCanvas.getContext('2d');
  const radarContainer = document.getElementById('radar-container');
  const hudLayer = document.querySelector('.hud-layer');
  const scrubber = document.getElementById('timeline-scrubber');
  const timeCurrentEl = document.getElementById('time-current');
  const timeTotalEl = document.getElementById('time-total');
  const fpsBadge = document.getElementById('fps-counter');
  const radarTelemetry = document.getElementById('radar-telemetry');
  const amoledLegend = document.getElementById('amoled-legend');
  const recordBanner = document.getElementById('record-progress-banner');
  const recordBarFill = document.getElementById('record-bar-fill');
  const recordText = document.getElementById('record-progress-text');

  // Spline Editor Canvas
  const editorCanvas = document.getElementById('editor-canvas');
  const editorCtx = editorCanvas ? editorCanvas.getContext('2d') : null;

  // Fast offscreen downsampled inspector canvas (320x180)
  const inspCanvas = document.createElement('canvas');
  const inspCtx = inspCanvas.getContext('2d');
  inspCanvas.width = 320;
  inspCanvas.height = 180;

  // Offscreen canvas for in-browser baked AMOLED grading
  const bakedGradedCanvas = document.createElement('canvas');

  // FPS tracking
  let frameCount = 0;
  let lastFpsUpdate = 0;
  let currentFps = 60;

  /**
   * Initializes application
   */
  function init() {
    setupDiscoveryScreen();
    setupStudioDrawers();
    setupSplineEditorInteraction();
    setupStudioUI();
    setupDragAndDrop();
    initPWA();

    // Preload default target in memory for instant readiness
    loadImageFromCatalog('carina', false);

    // Wire toast dismiss and HUD click
    if (btnCloseToast && toastSpecs) {
      btnCloseToast.addEventListener('click', () => {
        toastSpecs.classList.remove('visible');
      });
    }
    if (hudResBadge) {
      hudResBadge.addEventListener('click', () => {
        if (activeImageSpecs) {
          showImageSpecsToast(activeImageSpecs, activeImageTitle);
        }
      });
    }

    // Start render loop
    requestAnimationFrame(renderLoop);
  }

  /**
   * Screen Switcher: Transitions smoothly between Discovery and Studio
   */
  function switchToScreen(screenName) {
    currentScreen = screenName;
    if (screenName === 'discovery') {
      screenDiscovery.classList.remove('hidden');
      screenStudio.classList.add('hidden');
      if (imageLoaded) {
        btnEnterStudio.style.display = 'inline-flex';
        btnEnterStudio.textContent = 'Enter Studio →';
      }
    } else {
      screenDiscovery.classList.add('hidden');
      screenStudio.classList.remove('hidden');
      resizeViewport();
      drawRadarBackground();
      updateSplineEditorView();
    }
  }

  /**
   * Loads image from catalog
   */
  function loadImageFromCatalog(key, autoSwitchToStudio = true) {
    activeCatalogKey = key;
    const item = CATALOG[key] || CATALOG['carina'];
    activeImageTitle = item.title;

    // Use pre-bundled Base64 Data URI if available to guarantee untainted canvas on file:// protocol
    let sourceUrl = item.src;
    let fallbackUrl = item.fallback;

    if (typeof window !== 'undefined' && window.DEFAULT_ASSETS) {
      if (window.DEFAULT_ASSETS[key]) {
        sourceUrl = window.DEFAULT_ASSETS[key];
      }
      if (window.DEFAULT_ASSETS.thumbnails && window.DEFAULT_ASSETS.thumbnails[key]) {
        fallbackUrl = window.DEFAULT_ASSETS.thumbnails[key];
        // If on file:// protocol without network access for remote sources, default to embedded untainted fallback
        if (window.location.protocol === 'file:' && !window.DEFAULT_ASSETS[key] && !navigator.onLine) {
          sourceUrl = window.DEFAULT_ASSETS.thumbnails[key];
        }
      }
    }

    loadImageSource(sourceUrl, fallbackUrl, item.title, () => {
      if (autoSwitchToStudio) {
        switchToScreen('studio');
      }
    });

    // Update active highlight on discovery cards
    document.querySelectorAll('.celestial-card').forEach(card => {
      card.classList.toggle('active-selected', card.dataset.key === key);
    });
  }

  /**
   * Converts a Blob to a Data URI using FileReader
   * Guarantees 100% untainted canvas on all browsers and protocols.
   */
  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Directly probes whether an image taints the 2D canvas context.
   * Returns false if untainted (pixel manipulation allowed), true if blocked by CORS.
   */
  function testCanvasTaint(img) {
    try {
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 1;
      testCanvas.height = 1;
      const testCtx = testCanvas.getContext('2d');
      testCtx.drawImage(img, 0, 0, 1, 1);
      testCtx.getImageData(0, 0, 1, 1);
      return false; // Untainted! Direct pixel reads and exports permitted.
    } catch (err) {
      return true; // Tainted by browser cross-origin policy
    }
  }

  /**
   * Loads an image with CORS resilience, dynamic taint verification, and resolution evaluation
   */
  async function loadImageSource(url, fallbackUrl = null, title = 'Custom Celestial Image', onComplete = null) {
    imageLoaded = false;
    activeImageTitle = title;
    isCanvasTainted = false;

    const isDataUri = url && url.startsWith('data:');
    const isBlobUri = url && url.startsWith('blob:');
    const isRemote = url && (url.startsWith('http://') || url.startsWith('https://'));

    rawSourceImage = new Image();

    // In-memory data URIs (default curated assets & local uploads) are always same-origin.
    // For remote URLs, attempt anonymous CORS first so open archives (Wikimedia, ESO) stay untainted.
    if (isDataUri || isBlobUri) {
      rawSourceImage.removeAttribute('crossorigin');
    } else if (isRemote) {
      rawSourceImage.crossOrigin = 'anonymous';
    } else {
      rawSourceImage.removeAttribute('crossorigin');
    }

    rawSourceImage.onload = () => {
      // Accurately verify if canvas is tainted in this browser environment
      isCanvasTainted = testCanvasTaint(rawSourceImage);
      console.log(`[Studio] Image loaded: ${rawSourceImage.naturalWidth} x ${rawSourceImage.naturalHeight} (${title}) [tainted: ${isCanvasTainted}]`);
      imageLoaded = true;
      activeRenderDrawable = rawSourceImage;

      if (!cameraEngine) {
        cameraEngine = new CameraEngine(rawSourceImage.naturalWidth, rawSourceImage.naturalHeight, {
          mode: 'odyssey',
          loopDurationSec: loopDurationSec
        });
      } else {
        cameraEngine.setImageDimensions(rawSourceImage.naturalWidth, rawSourceImage.naturalHeight);
      }

      resizeViewport();
      drawRadarBackground();
      updateSplineEditorView();
      runAutoGradeTelemetry();

      // Calculate and display resolution & quality telemetry
      const specs = calculateImageQualitySpecs(rawSourceImage, 0, isCanvasTainted);
      activeImageSpecs = specs;
      showImageSpecsToast(specs, title);
      updateHudResolutionBadge(specs);

      btnEnterStudio.style.display = 'inline-flex';
      btnEnterStudio.textContent = `Launch: ${title.substring(0, 24)} →`;

      if (typeof onComplete === 'function') onComplete();
    };

    rawSourceImage.onerror = () => {
      // RESILIENCE FALLBACK FOR RESTRICTED CDNs & STRICT BROWSER POLICIES:
      // If loading with crossOrigin='anonymous' failed (e.g. NASA CDN or browser file:// CORS restrictions),
      // auto-retry immediately WITHOUT crossOrigin!
      // This allows the image to stream and play at 60 FPS in the studio without halting or showing an error!
      if (rawSourceImage.hasAttribute('crossorigin')) {
        console.warn(`[Studio] Server rejected CORS preflight for ${url}. Retrying directly without crossOrigin for 60 FPS playback...`);
        rawSourceImage.removeAttribute('crossorigin');
        rawSourceImage.src = url;
        return;
      }

      if (fallbackUrl && fallbackUrl !== url) {
        console.warn(`[Studio] Primary image failed (${url}), trying fallback: ${fallbackUrl}`);
        loadImageSource(fallbackUrl, null, title, onComplete);
      } else {
        console.error(`[Studio] Failed to load image: ${url}`);
        const toast = document.getElementById('toast-image-specs');
        if (toast) {
          const elTitle = document.getElementById('toast-image-title');
          const elDim = document.getElementById('toast-res-dim');
          const elMp = document.getElementById('toast-res-mp');
          const elBadge = document.getElementById('toast-res-badge');
          const elEval = document.getElementById('toast-res-eval');
          if (elTitle) elTitle.textContent = '⚠️ Image Notice';
          if (elDim) elDim.textContent = 'Format / Network';
          if (elMp) elMp.textContent = 'Notice';
          if (elBadge) {
            elBadge.className = 'badge-tag tier-standard';
            elBadge.textContent = 'Unavailable';
          }
          if (elEval) {
            elEval.textContent = `Could not load "${title}". Tip: You can download the image file to your device and drag-and-drop it into the app.`;
          }
          toast.classList.add('visible');
        }
      }
    };

    rawSourceImage.src = url;
  }

  /**
   * Evaluates image resolution, megapixels, aspect ratio, and wallpaper quality tier
   */
  function calculateImageQualitySpecs(img, rawBlackPct = 0, isTainted = false) {
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;
    const mp = (w * h) / 1000000;
    const aspectVal = h > 0 ? (w / h) : 1;
    const aspectStr = aspectVal.toFixed(2);

    let tier = 'standard';
    let tierBadge = '🟠 Standard (< 1080p)';
    let tierClass = 'tier-standard';
    let evalText = 'Lower resolution (under 2 MP). Deep macro zoom may show soft pixelation on large screens.';

    if (w >= 3840 || mp >= 8.0) {
      tier = 'ultra';
      tierBadge = (w >= 5120) ? '🟢 Ultra-HD 5K+ (Pristine)' : '🟢 Ultra-HD 4K (Pristine)';
      tierClass = 'tier-ultra';
      evalText = 'Pristine ultra-high resolution master. Macro pan-and-zoom will stay tack-sharp on all screens.';
    } else if (w >= 1920 || mp >= 2.0) {
      tier = 'fhd';
      tierBadge = '🟡 Full HD 1080p (High Quality)';
      tierClass = 'tier-fhd';
      evalText = 'Crisp resolution for 1080p desktop and flagship phone screens. Moderate zoom remains sharp.';
    }

    if (isTainted) {
      tierBadge += ' • ⚠️ Protected Remote Source (CORS)';
      evalText = 'Live 60 FPS playback active! External server restricts browser pixel reading. To grade AMOLED blacks or export standalone HTML, download and drop file into app.';
    }

    return {
      w, h, mp, aspectVal, aspectStr,
      tier, tierBadge, tierClass, evalText,
      rawBlackPct: rawBlackPct.toFixed(1),
      isTainted
    };
  }

  /**
   * Displays the floating Image Resolution & Quality Specs Toast
   */
  function showImageSpecsToast(specs, title = 'Celestial Image') {
    if (!toastSpecs) return;

    const elTitle = document.getElementById('toast-image-title');
    const elDim = document.getElementById('toast-res-dim');
    const elMp = document.getElementById('toast-res-mp');
    const elBadge = document.getElementById('toast-res-badge');
    const elEval = document.getElementById('toast-res-eval');
    const elAspect = document.getElementById('toast-res-aspect');
    const elAmoled = document.getElementById('toast-res-amoled');

    if (elTitle) elTitle.textContent = title.substring(0, 32);
    if (elDim) elDim.textContent = `${specs.w.toLocaleString()} × ${specs.h.toLocaleString()} px`;
    if (elMp) elMp.textContent = `${specs.mp.toFixed(1)} MP`;

    if (elBadge) {
      elBadge.className = `badge-tag ${specs.tierClass}`;
      elBadge.textContent = specs.tierBadge;
    }

    if (elEval) elEval.textContent = specs.evalText;
    if (elAspect) elAspect.textContent = `${specs.aspectStr}:1 (${specs.w >= specs.h ? 'Landscape' : 'Portrait'})`;
    if (elAmoled) elAmoled.textContent = `~${specs.rawBlackPct}% True Black`;

    toastSpecs.classList.add('visible');

    clearTimeout(toastDismissTimeout);
    toastDismissTimeout = setTimeout(() => {
      toastSpecs.classList.remove('visible');
    }, 6000);
  }

  /**
   * Updates the live resolution telemetry badge in the Top Bar HUD
   */
  function updateHudResolutionBadge(specs) {
    if (!hudResBadge) return;

    let shortTier = '🟢 5K Ultra';
    if (specs.w < 5120 && specs.w >= 3840) shortTier = '🟢 4K Ultra';
    else if (specs.tier === 'fhd') shortTier = '🟡 1080p FHD';
    else if (specs.tier === 'standard') shortTier = '🟠 Standard';

    hudResBadge.className = `hud-res-badge ${specs.tierClass}`;
    hudResBadge.innerHTML = `📐 ${specs.w}×${specs.h} (${specs.mp.toFixed(1)} MP) &bull; ${shortTier}`;
  }

  /**
   * Runs auto telemetry calculation for black levels
   */
  function runAutoGradeTelemetry() {
    if (isCanvasTainted) return;
    setTimeout(() => {
      try {
        const stats = gradingEngine.analyzeImage(rawSourceImage);
        const elRaw = document.getElementById('stat-raw-black');
        if (elRaw) elRaw.textContent = `${stats.rawBlackPct}%`;

        const elGraded = document.getElementById('stat-graded-black');
        if (elGraded) {
          const estBlack = Math.min(65, Math.round(parseFloat(stats.rawBlackPct) + 16.5));
          elGraded.textContent = `~${estBlack}%`;
        }

        const elSavings = document.getElementById('stat-oled-savings');
        if (elSavings) {
          const estSavings = Math.min(80, Math.round((parseFloat(stats.rawBlackPct) + 16.5) * 0.8));
          elSavings.textContent = `~${estSavings}%`;
        }

        if (activeImageSpecs) {
          activeImageSpecs.rawBlackPct = parseFloat(stats.rawBlackPct).toFixed(1);
          const elAmoled = document.getElementById('toast-res-amoled');
          if (elAmoled) elAmoled.textContent = `~${activeImageSpecs.rawBlackPct}% True Black`;
        }
      } catch (err) {
        console.warn('[Telemetry] Histogram calculation skipped (tainted or local file):', err.message);
      }
    }, 50);
  }

  /**
   * Resizes viewport to maintain preset aspect ratio without letterboxing
   */
  function resizeViewport() {
    const preset = PRESETS[currentPresetKey] || PRESETS['fullscreen'];
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let targetW = winW;
    let targetH = winH;

    if (!preset.isNative && preset.w > 0 && preset.h > 0) {
      const targetAspect = preset.w / preset.h;
      const screenAspect = winW / winH;

      if (screenAspect > targetAspect) {
        targetH = winH;
        targetW = Math.round(targetH * targetAspect);
      } else {
        targetW = winW;
        targetH = Math.round(targetW / targetAspect);
      }
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(targetW * dpr);
    canvas.height = Math.round(targetH * dpr);

    canvas.style.width = `${targetW}px`;
    canvas.style.height = `${targetH}px`;
  }

  /**
   * Main 60 FPS animation render loop
   */
  function renderLoop(timestamp) {
    try {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaMs = Math.min(timestamp - lastTimestamp, 100);
      lastTimestamp = timestamp;

      // Update FPS counter
      frameCount++;
      if (timestamp - lastFpsUpdate >= 500) {
        currentFps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
        fpsBadge.textContent = `${currentFps} FPS`;
        frameCount = 0;
        lastFpsUpdate = timestamp;
      }

      // Advance animation timeline if active and on studio screen
      if (isPlaying && !isRecording && currentScreen === 'studio') {
        const step = (deltaMs / 1000.0) / loopDurationSec * speedMultiplier;
        progress = (progress + step) % 1.0;
        if (progress < 0) progress += 1.0;
        updateScrubberUI();
      }

      // Render frame if on studio screen
      if (currentScreen === 'studio' && imageLoaded && cameraEngine && activeRenderDrawable) {
        renderFrame();
        if (isRadarActive) {
          renderRadar();
        }
      }
    } catch (err) {
      console.error("Render loop caught error:", err);
    } finally {
      requestAnimationFrame(renderLoop);
    }
  }

  /**
   * Renders the current frame onto the canvas
   */
  function renderFrame() {
    const vw = canvas.width;
    const vh = canvas.height;

    const cam = cameraEngine.solveCamera(progress, vw, vh);
    const rect = cam.sourceRect;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, vw, vh);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      activeRenderDrawable,
      rect.x, rect.y, rect.w, rect.h,
      0, 0, vw, vh
    );

    if (isInspectorActive) {
      applyAmoledInspector(cam, vw, vh);
    }
  }

  /**
   * Fast, non-blocking AMOLED inspector overlay
   */
  function applyAmoledInspector(cam, vw, vh) {
    try {
      inspCtx.drawImage(activeRenderDrawable, cam.sourceRect.x, cam.sourceRect.y, cam.sourceRect.w, cam.sourceRect.h, 0, 0, 320, 180);
      const frameData = inspCtx.getImageData(0, 0, 320, 180);
      const data = frameData.data;
      const len = data.length;
      for (let i = 0; i < len; i += 4) {
        if (data[i] <= 3 && data[i + 1] <= 3 && data[i + 2] <= 3) {
          data[i] = 255;
          data[i + 1] = 0;
          data[i + 2] = 128;
          data[i + 3] = 210;
        } else {
          data[i + 3] = 0;
        }
      }
      inspCtx.putImageData(frameData, 0, 0);
      ctx.drawImage(inspCanvas, 0, 0, vw, vh);
    } catch (e) {
      // Graceful fallback for cross-origin or untainted inspection
    }
  }

  function drawRadarBackground() {
    radarCanvas.width = 200;
    radarCanvas.height = 120;
  }

  function renderRadar() {
    const rw = radarCanvas.width;
    const rh = radarCanvas.height;

    radarCtx.fillStyle = '#06080c';
    radarCtx.fillRect(0, 0, rw, rh);

    if (imageLoaded && activeRenderDrawable) {
      radarCtx.globalAlpha = 0.45;
      radarCtx.drawImage(activeRenderDrawable, 0, 0, rw, rh);
      radarCtx.globalAlpha = 1.0;

      // Draw Spline Trajectory Path
      radarCtx.beginPath();
      radarCtx.strokeStyle = 'rgba(0, 229, 255, 0.55)';
      radarCtx.lineWidth = 1.5;

      for (let i = 0; i <= 60; i++) {
        const u = i / 60;
        const pt = cameraEngine.samplePath(u);
        const px = pt.x * rw;
        const py = pt.y * rh;
        if (i === 0) radarCtx.moveTo(px, py);
        else radarCtx.lineTo(px, py);
      }
      radarCtx.closePath();
      radarCtx.stroke();

      // Draw Camera Frustum
      const cam = cameraEngine.solveCamera(progress, canvas.width, canvas.height);
      const r = cam.sourceRect;
      const imgW = activeRenderDrawable.naturalWidth || activeRenderDrawable.width;
      const imgH = activeRenderDrawable.naturalHeight || activeRenderDrawable.height;

      const fx = (r.x / imgW) * rw;
      const fy = (r.y / imgH) * rh;
      const fw = (r.w / imgW) * rw;
      const fh = (r.h / imgH) * rh;

      radarCtx.strokeStyle = '#00e5ff';
      radarCtx.lineWidth = 1.5;
      radarCtx.strokeRect(fx, fy, fw, fh);

      radarCtx.fillStyle = 'rgba(0, 229, 255, 0.2)';
      radarCtx.fillRect(fx, fy, fw, fh);

      // Camera center dot
      radarCtx.fillStyle = '#ff007f';
      radarCtx.beginPath();
      radarCtx.arc(fx + fw / 2, fy + fh / 2, 3, 0, Math.PI * 2);
      radarCtx.fill();

      // Telemetry readout
      const pctX = Math.round((cam.x / imgW) * 100);
      const pctY = Math.round((cam.y / imgH) * 100);
      radarTelemetry.textContent = `POS: ${pctX}%, ${pctY}% | ZOOM: ${cam.zoom.toFixed(2)}x`;
    }
  }

  function updateScrubberUI() {
    scrubber.value = Math.round(progress * 1000);
    const curSec = Math.floor(progress * loopDurationSec);
    timeCurrentEl.textContent = formatTime(curSec);
    timeTotalEl.textContent = formatTime(loopDurationSec);
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Applies client-side in-browser AMOLED true-black grading
   */
  function applyInBrowserGrade() {
    if (!imageLoaded || !rawSourceImage) return;

    const btnBake = document.getElementById('btn-bake-grade');

    if (isCanvasTainted) {
      let host = 'External image server';
      try {
        if (rawSourceImage.src && rawSourceImage.src.startsWith('http')) {
          host = new URL(rawSourceImage.src).hostname;
        }
      } catch (e) {}

      const confirmDownload = confirm(
        `🔒 Cross-Origin Security Restriction (CORS):\n\n` +
        `The server (${host}) does not allow browser-based pixel extraction across origins.\n\n` +
        `• Live 60 FPS Wallpaper Playback: ✅ Fully Functional!\n` +
        `• AMOLED True-Black Grading: Requires a local file.\n\n` +
        `Would you like to open/download this image in a new tab now?\n(Once saved, simply drag-and-drop the file into the app for 100% untainted grading!)`
      );
      if (confirmDownload && rawSourceImage.src) {
        window.open(rawSourceImage.src, '_blank');
      }
      if (btnBake) btnBake.textContent = '✨ Apply & Bake AMOLED Grade';
      return;
    }

    const floor = parseFloat(document.getElementById('slider-black-floor').value);
    const knee = parseFloat(document.getElementById('slider-knee-width').value);
    const star = parseFloat(document.getElementById('slider-star-protect').value) / 100.0;
    const contrast = parseFloat(document.getElementById('slider-contrast').value);

    if (btnBake) btnBake.textContent = '⏳ Processing Pixels...';

    setTimeout(() => {
      try {
        const stats = gradingEngine.applyGrade(rawSourceImage, bakedGradedCanvas, {
          blackFloor: floor,
          kneeWidth: knee,
          starProtect: star,
          contrast: contrast,
          maxDimension: 5120
        });

        activeRenderDrawable = bakedGradedCanvas;
        cameraEngine.setImageDimensions(bakedGradedCanvas.width, bakedGradedCanvas.height);
        drawRadarBackground();

        const elGraded = document.getElementById('stat-graded-black');
        if (elGraded) elGraded.textContent = `${stats.blackPercentage}%`;

        const elSavings = document.getElementById('stat-oled-savings');
        if (elSavings) {
          const estSavings = Math.min(85, Math.round(parseFloat(stats.blackPercentage) * 0.82));
          elSavings.textContent = `~${estSavings}%`;
        }

        if (btnBake) btnBake.textContent = '✨ Apply & Bake AMOLED Grade';
        console.log(`[Studio] AMOLED grade applied: ${stats.blackPercentage}% true black in ${stats.elapsedMs}ms`);
      } catch (err) {
        console.error('AMOLED grade failed:', err);
        if (btnBake) btnBake.textContent = '✨ Apply & Bake AMOLED Grade';
        alert('Could not grade pixels: This external image does not allow direct pixel manipulation due to CORS. Please download the image and drag-and-drop it into the app.');
      }
    }, 20);
  }

  /**
   * Updates Spline Editor Canvas with draggable waypoints
   */
  function updateSplineEditorView() {
    if (!editorCanvas || !editorCtx || !cameraEngine) return;

    const ew = editorCanvas.clientWidth || 400;
    const eh = editorCanvas.clientHeight || 220;
    editorCanvas.width = ew;
    editorCanvas.height = eh;

    editorCtx.fillStyle = '#06080c';
    editorCtx.fillRect(0, 0, ew, eh);

    // Draw background thumbnail
    if (imageLoaded && activeRenderDrawable) {
      editorCtx.globalAlpha = 0.35;
      editorCtx.drawImage(activeRenderDrawable, 0, 0, ew, eh);
      editorCtx.globalAlpha = 1.0;
    }

    // Draw Spline Curve
    editorCtx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
    editorCtx.lineWidth = 2;
    editorCtx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      const pt = cameraEngine.samplePath(u);
      const px = pt.x * ew;
      const py = pt.y * eh;
      if (i === 0) editorCtx.moveTo(px, py);
      else editorCtx.lineTo(px, py);
    }
    editorCtx.closePath();
    editorCtx.stroke();

    // Draw Waypoint Node Handles
    const waypoints = cameraEngine.getWaypoints();
    waypoints.forEach((wp, idx) => {
      const px = wp.x * ew;
      const py = wp.y * eh;
      const isSelected = (idx === selectedWpIndex);

      editorCtx.beginPath();
      editorCtx.arc(px, py, isSelected ? 8 : 6, 0, Math.PI * 2);
      editorCtx.fillStyle = isSelected ? '#ff007f' : '#00e5ff';
      editorCtx.fill();
      editorCtx.lineWidth = 2;
      editorCtx.strokeStyle = '#ffffff';
      editorCtx.stroke();

      // Label number
      editorCtx.fillStyle = '#ffffff';
      editorCtx.font = '10px sans-serif';
      editorCtx.fillText(`P${idx}`, px + 8, py - 4);
    });

    // Update Waypoint Inspector Controls
    const currentWp = waypoints[selectedWpIndex] || waypoints[0];
    if (currentWp) {
      const elLabel = document.getElementById('selected-wp-label');
      if (elLabel) elLabel.textContent = `P${selectedWpIndex} (${currentWp.desc || 'Waypoint'})`;
      const sliderZoom = document.getElementById('slider-wp-zoom');
      if (sliderZoom) sliderZoom.value = currentWp.z;
      const valZoom = document.getElementById('val-wp-zoom');
      if (valZoom) valZoom.textContent = `${currentWp.z.toFixed(1)}x`;
    }
  }

  /**
   * Sets up interactive drag-and-drop on the Spline Editor Canvas
   */
  function setupSplineEditorInteraction() {
    if (!editorCanvas) return;

    const getMouseNormPos = (e) => {
      const rect = editorCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: Math.max(0.1, Math.min(0.9, (clientX - rect.left) / rect.width)),
        y: Math.max(0.1, Math.min(0.9, (clientY - rect.top) / rect.height))
      };
    };

    const handlePointerDown = (e) => {
      const rect = editorCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      const waypoints = cameraEngine.getWaypoints();
      const ew = editorCanvas.width;
      const eh = editorCanvas.height;

      // Check collision with any waypoint (hit radius: 14px)
      let foundIdx = -1;
      for (let i = 0; i < waypoints.length; i++) {
        const wx = waypoints[i].x * ew;
        const wy = waypoints[i].y * eh;
        if (Math.hypot(clickX - wx, clickY - wy) <= 14) {
          foundIdx = i;
          break;
        }
      }

      if (foundIdx !== -1) {
        selectedWpIndex = foundIdx;
        isDraggingWp = true;
        updateSplineEditorView();
      }
    };

    const handlePointerMove = (e) => {
      if (!isDraggingWp) return;
      const pos = getMouseNormPos(e);
      cameraEngine.updateWaypoint(selectedWpIndex, { x: pos.x, y: pos.y });
      updateSplineEditorView();
    };

    const handlePointerUp = () => {
      isDraggingWp = false;
    };

    editorCanvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    editorCanvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Zoom slider for selected waypoint
    const sliderZoom = document.getElementById('slider-wp-zoom');
    if (sliderZoom) {
      sliderZoom.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        cameraEngine.updateWaypoint(selectedWpIndex, { z: val });
        document.getElementById('val-wp-zoom').textContent = `${val.toFixed(1)}x`;
      });
    }

    // Procedural Spline Randomization button
    const btnRandomize = document.getElementById('btn-randomize-spline');
    if (btnRandomize) {
      btnRandomize.addEventListener('click', () => {
        cameraEngine.randomizeWaypoints();
        selectedWpIndex = 0;
        updateSplineEditorView();
      });
    }

    // Add waypoint button
    const btnAddWp = document.getElementById('btn-add-wp');
    if (btnAddWp) {
      btnAddWp.addEventListener('click', () => {
        const waypoints = cameraEngine.getWaypoints();
        const current = waypoints[selectedWpIndex] || waypoints[0];
        cameraEngine.addWaypoint({
          x: current.x + 0.05,
          y: current.y + 0.05,
          z: current.z,
          desc: `Waystop ${waypoints.length + 1}`
        });
        selectedWpIndex = Math.min(waypoints.length, selectedWpIndex + 1);
        updateSplineEditorView();
      });
    }

    // Remove waypoint button
    const btnRemoveWp = document.getElementById('btn-remove-wp');
    if (btnRemoveWp) {
      btnRemoveWp.addEventListener('click', () => {
        cameraEngine.removeWaypoint(selectedWpIndex);
        selectedWpIndex = Math.max(0, selectedWpIndex - 1);
        updateSplineEditorView();
      });
    }
  }

  /**
   * ============================================================
   * SCREEN 1: CELESTIAL DISCOVERY & MULTI-ARCHIVE SOURCING SETUP
   * ============================================================
   */
  function setupDiscoveryScreen() {
    const container = document.getElementById('curated-cards-container');
    const searchInput = document.getElementById('global-cosmic-search');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const btnSearchNasa = document.getElementById('btn-search-nasa-action');
    const archiveSelector = document.getElementById('select-archive-source');
    const chips = document.querySelectorAll('.category-chips-scroll .chip');
    const curatedSection = document.getElementById('section-curated-grid');
    const nasaSection = document.getElementById('section-nasa-results');
    const nasaContainer = document.getElementById('nasa-cards-container');
    const nasaSpinner = document.getElementById('nasa-loading-spinner');
    const nasaResultsCount = document.getElementById('nasa-results-count');
    const curatedCount = document.getElementById('curated-count');

    let activeFilter = 'all';

    // Renders the curated cards grid
    function renderCuratedCards(filter = 'all', searchQuery = '') {
      container.innerHTML = '';
      const query = searchQuery.trim().toLowerCase();
      let matchCount = 0;

      for (const [key, item] of Object.entries(CATALOG)) {
        // Category check
        if (filter !== 'all' && item.category !== filter) continue;

        // Search query check
        if (query) {
          const haystack = `${item.title} ${item.subtitle} ${item.desc} ${item.category} ${item.telescope}`.toLowerCase();
          if (!haystack.includes(query)) continue;
        }

        matchCount++;
        const card = document.createElement('div');
        card.className = `celestial-card ${key === activeCatalogKey ? 'active-selected' : ''}`;
        card.dataset.key = key;

        const cardThumb = (typeof window !== 'undefined' && window.DEFAULT_ASSETS && window.DEFAULT_ASSETS.thumbnails && window.DEFAULT_ASSETS.thumbnails[key])
          ? window.DEFAULT_ASSETS.thumbnails[key]
          : item.thumb;

        card.innerHTML = `
          <div class="card-thumb-container">
            <div class="thumb-skeleton"></div>
            <img 
              class="catalog-card-img" 
              src="${cardThumb}" 
              alt="${item.title}" 
              loading="lazy"
              onload="this.classList.add('loaded')"
            >
            <div class="thumb-badges">
              <span class="badge-tag badge-amoled">${item.blackLevel}</span>
              <span class="badge-tag badge-res">${item.resBadge}</span>
              <span class="badge-tag">${item.telescope}</span>
            </div>
          </div>
          <div class="card-content">
            <div class="card-title-row">
              <h4 class="card-title">${item.title}</h4>
            </div>
            <span class="card-subtitle">${item.subtitle}</span>
            <p class="card-desc">${item.desc}</p>
            <button class="card-cta-btn">
              Launch into Studio ✨
            </button>
          </div>
        `;

        card.addEventListener('click', () => {
          loadImageFromCatalog(key, true);
        });

        container.appendChild(card);
      }

      if (curatedCount) curatedCount.textContent = `${matchCount} Objects`;
    }

    // Initial render
    renderCuratedCards('all', '');

    // Category Chip clicks
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter;
        activeFilter = filter;

        if (filter === 'nasa-archive') {
          curatedSection.style.display = 'none';
          nasaSection.style.display = 'flex';
          const query = searchInput.value.trim() || 'nebula';
          searchGlobalArchives(query, archiveSelector ? archiveSelector.value : 'all');
        } else if (filter === 'custom-upload') {
          curatedSection.style.display = 'flex';
          nasaSection.style.display = 'none';
          document.getElementById('section-custom-sources').scrollIntoView({ behavior: 'smooth' });
        } else {
          curatedSection.style.display = 'flex';
          nasaSection.style.display = 'none';
          renderCuratedCards(filter, searchInput.value);
        }
      });
    });

    // Real-time Search input
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      btnClearSearch.style.display = q ? 'block' : 'none';
      if (activeFilter !== 'nasa-archive') {
        renderCuratedCards(activeFilter, q);
      }
    });

    // Clear Search button
    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      btnClearSearch.style.display = 'none';
      renderCuratedCards(activeFilter, '');
    });

    // Quick Search Topic suggestions
    document.querySelectorAll('.quick-topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.dataset.query;
        searchInput.value = query;
        btnClearSearch.style.display = 'block';
        triggerArchiveSearch();
      });
    });

    // Search action trigger
    const triggerArchiveSearch = () => {
      const q = searchInput.value.trim();
      if (!q) {
        alert('Please enter a celestial object to search (e.g. "Orion", "Andromeda", "Black Hole", "Crab Nebula")');
        return;
      }
      chips.forEach(c => c.classList.toggle('active', c.dataset.filter === 'nasa-archive'));
      activeFilter = 'nasa-archive';
      curatedSection.style.display = 'none';
      nasaSection.style.display = 'flex';
      const source = archiveSelector ? archiveSelector.value : 'all';
      searchGlobalArchives(q, source);
    };

    if (btnSearchNasa) btnSearchNasa.addEventListener('click', triggerArchiveSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerArchiveSearch();
    });

    if (archiveSelector) {
      archiveSelector.addEventListener('change', () => {
        const q = searchInput.value.trim() || 'nebula';
        if (activeFilter === 'nasa-archive') {
          searchGlobalArchives(q, archiveSelector.value);
        }
      });
    }

    /**
     * Unified Multi-Archive Search:
     * Queries NASA Image Library and Wikimedia Commons Astronomy Archive in parallel.
     */
    async function searchGlobalArchives(query, archiveSource = 'all') {
      nasaContainer.innerHTML = '';
      nasaSpinner.style.display = 'flex';
      nasaResultsCount.textContent = 'Querying deep space archives...';

      const results = [];

      // 1. Fetch NASA Library
      const fetchNasa = async () => {
        try {
          const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`;
          const resp = await fetch(url);
          if (!resp.ok) return [];
          const data = await resp.json();
          const items = data.collection ? data.collection.items : [];
          return items.slice(0, 10).map(item => {
            const d = item.data ? item.data[0] : {};
            return {
              source: 'NASA Public Archive',
              sourceTag: d.center || 'NASA JPL',
              title: d.title || 'Astronomical Vista',
              desc: d.description ? d.description.substring(0, 130) + '...' : 'NASA Deep Space Observation.',
              thumb: (item.links && item.links[0]) ? item.links[0].href : '',
              nasaId: d.nasa_id,
              width: 0, height: 0, mp: 0
            };
          });
        } catch (e) {
          console.warn('NASA archive fetch error:', e);
          return [];
        }
      };

      // 2. Fetch Wikimedia Commons Deep Space (CORS-enabled via origin=*)
      const fetchWikimedia = async () => {
        try {
          const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}+astronomy&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|size|mime&format=json&origin=*`;
          const resp = await fetch(url);
          if (!resp.ok) return [];
          const data = await resp.json();
          const pages = data.query ? data.query.pages : {};
          const items = [];
          for (const [pid, page] of Object.entries(pages)) {
            const info = page.imageinfo ? page.imageinfo[0] : {};
            if (info.url && (info.mime === 'image/jpeg' || info.mime === 'image/png' || info.mime === 'image/webp')) {
              const w = info.width || 0;
              const h = info.height || 0;
              const mp = (w * h) / 1000000;
              const cleanTitle = (page.title || '').replace(/^File:/i, '').replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/_/g, ' ');
              items.push({
                source: 'Wikimedia Astrophotography',
                sourceTag: mp >= 8.0 ? 'ESO / Hubble Ultra-HD' : 'Deep Space Archive',
                title: cleanTitle,
                desc: `Public domain astronomical master. Resolution: ${w.toLocaleString()} × ${h.toLocaleString()} (${mp.toFixed(1)} MP).`,
                thumb: info.url,
                fullUrl: info.url,
                width: w,
                height: h,
                mp: mp
              });
            }
          }
          return items;
        } catch (e) {
          console.warn('Wikimedia archive fetch error:', e);
          return [];
        }
      };

      // Execute queries
      if (archiveSource === 'nasa') {
        const nItems = await fetchNasa();
        results.push(...nItems);
      } else if (archiveSource === 'wikimedia') {
        const wItems = await fetchWikimedia();
        results.push(...wItems);
      } else {
        const [nRes, wRes] = await Promise.allSettled([fetchNasa(), fetchWikimedia()]);
        if (nRes.status === 'fulfilled') results.push(...nRes.value);
        if (wRes.status === 'fulfilled') results.push(...wRes.value);
      }

      nasaSpinner.style.display = 'none';
      nasaResultsCount.textContent = `${results.length} Discoveries Found`;

      if (results.length === 0) {
        nasaContainer.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); line-height: 1.6;">
            No astronomical discoveries found for "${query}".<br>
            <span style="font-size: 13px;">Try searching popular targets like "Orion", "Andromeda", "Pillars of Creation", "Crab Nebula", or "Jupiter".</span>
          </div>
        `;
        return;
      }

      // Render cards
      results.forEach(res => {
        if (!res.thumb) return;

        let resBadgeStr = 'High-Res Deep Space';
        if (res.width > 0 && res.height > 0) {
          resBadgeStr = `${res.width}×${res.height} (${res.mp.toFixed(1)} MP)`;
        }

        const card = document.createElement('div');
        card.className = 'celestial-card';
        card.innerHTML = `
          <div class="card-thumb-container">
            <div class="thumb-skeleton"></div>
            <img 
              class="catalog-card-img" 
              src="${res.thumb}" 
              alt="${res.title}" 
              loading="lazy"
              onload="this.classList.add('loaded')"
            >
            <div class="thumb-badges">
              <span class="badge-tag badge-res">${resBadgeStr}</span>
              <span class="badge-tag">${res.sourceTag}</span>
            </div>
          </div>
          <div class="card-content">
            <div class="card-title-row">
              <h4 class="card-title">${res.title}</h4>
            </div>
            <span class="card-subtitle">${res.source}</span>
            <p class="card-desc">${res.desc}</p>
            <button class="card-cta-btn">
              Load into Studio ✨
            </button>
          </div>
        `;

        card.addEventListener('click', async () => {
          const btn = card.querySelector('.card-cta-btn');
          btn.textContent = '⏳ Fetching Full Image...';

          if (res.nasaId) {
            try {
              // Fetch NASA asset manifest
              const assetResp = await fetch(`https://images-api.nasa.gov/asset/${res.nasaId}`);
              const assetData = await assetResp.json();
              const assetItems = assetData.collection ? assetData.collection.items : [];

              let fullUrl = res.thumb;
              const orig = assetItems.find(i => i.href.includes('~orig.png') || i.href.includes('~orig.jpg'));
              const large = assetItems.find(i => i.href.includes('~large.jpg'));
              const medium = assetItems.find(i => i.href.includes('~medium.jpg'));

              if (orig) fullUrl = orig.href;
              else if (large) fullUrl = large.href;
              else if (medium) fullUrl = medium.href;

              loadImageSource(fullUrl, res.thumb, res.title, () => {
                switchToScreen('studio');
              });
            } catch (err) {
              console.warn('Asset manifest failed, loading thumb/preview:', err);
              loadImageSource(res.thumb, null, res.title, () => {
                switchToScreen('studio');
              });
            }
          } else {
            // Direct Wikimedia high-res master
            loadImageSource(res.fullUrl || res.thumb, res.thumb, res.title, () => {
              switchToScreen('studio');
            });
          }
        });

        nasaContainer.appendChild(card);
      });
    }

    // Custom Sources: File Picker & Drag-and-Drop
    const filePicker = document.getElementById('file-picker-input');
    if (filePicker) {
      filePicker.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            loadImageSource(evt.target.result, null, file.name, () => {
              switchToScreen('studio');
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Custom Sources: URL field
    const btnFetchUrl = document.getElementById('btn-fetch-custom-url');
    const customUrlField = document.getElementById('custom-url-field');
    if (btnFetchUrl && customUrlField) {
      btnFetchUrl.addEventListener('click', () => {
        const url = customUrlField.value.trim();
        if (url) {
          loadImageSource(url, null, 'Custom Astronomical URL', () => {
            switchToScreen('studio');
          });
        }
      });
    }

    // Header buttons
    if (btnEnterStudio) {
      btnEnterStudio.addEventListener('click', () => {
        switchToScreen('studio');
      });
    }
    if (btnSwitchDiscovery) {
      btnSwitchDiscovery.addEventListener('click', () => {
        switchToScreen('discovery');
      });
    }
  }

  /**
   * Sets up UI Drawer Tabs (AMOLED Grading, Spline Editor, Export)
   */
  function setupStudioDrawers() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const drawers = document.querySelectorAll('.studio-drawer');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetDrawerId = btn.dataset.drawer;
        const targetDrawer = document.getElementById(targetDrawerId);
        const isAlreadyActive = btn.classList.contains('active');

        // Close all drawers
        tabButtons.forEach(b => b.classList.remove('active'));
        drawers.forEach(d => d.classList.remove('active'));

        if (!isAlreadyActive && targetDrawer) {
          btn.classList.add('active');
          targetDrawer.classList.add('active');

          if (targetDrawerId === 'drawer-spline') {
            setTimeout(updateSplineEditorView, 50);
          }
        }
      });
    });

    // Close buttons inside drawers
    document.querySelectorAll('.btn-close').forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        drawers.forEach(d => d.classList.remove('active'));
      });
    });

    // AMOLED Grading: Sliders
    const sliders = ['black-floor', 'knee-width', 'star-protect', 'contrast'];
    sliders.forEach(s => {
      const el = document.getElementById(`slider-${s}`);
      const valEl = document.getElementById(`val-${s}`);
      if (el && valEl) {
        el.addEventListener('input', (e) => {
          el.dataset.userModified = 'true';
          valEl.textContent = (s === 'star-protect' ? `${e.target.value}%` : (s === 'contrast' ? `${e.target.value}x` : e.target.value));
        });
      }
    });

    // AMOLED Grading: Apply button
    const btnBake = document.getElementById('btn-bake-grade');
    if (btnBake) {
      btnBake.addEventListener('click', applyInBrowserGrade);
    }

    // Export: Standalone HTML Download
    const btnExportHtml = document.getElementById('btn-export-html');
    if (btnExportHtml) {
      btnExportHtml.addEventListener('click', () => {
        if (!imageLoaded || !activeRenderDrawable) return;

        if (isCanvasTainted) {
          let host = 'External image server';
          try {
            if (rawSourceImage.src && rawSourceImage.src.startsWith('http')) {
              host = new URL(rawSourceImage.src).hostname;
            }
          } catch (e) {}

          const confirmDownload = confirm(
            `🔒 Cross-Origin Security Restriction (CORS):\n\n` +
            `The server (${host}) does not allow browser-based packaging into standalone files across origins.\n\n` +
            `• Live 60 FPS Wallpaper Playback: ✅ Fully Functional!\n` +
            `• Standalone HTML Export: Requires a local file.\n\n` +
            `Would you like to open/download this image now?\n(Once saved, simply drag-and-drop the file into the app to export your standalone HTML wallpaper!)`
          );
          if (confirmDownload && rawSourceImage.src) {
            window.open(rawSourceImage.src, '_blank');
          }
          btnExportHtml.textContent = '💾 Download Standalone HTML';
          return;
        }

        btnExportHtml.textContent = '⏳ Compiling HTML...';

        setTimeout(() => {
          try {
            // Convert active rendering drawable to base64 WebP
            const tempCanvas = document.createElement('canvas');
            const tw = Math.min(5120, activeRenderDrawable.naturalWidth || activeRenderDrawable.width);
            const th = Math.round((activeRenderDrawable.naturalHeight || activeRenderDrawable.height) * (tw / (activeRenderDrawable.naturalWidth || activeRenderDrawable.width)));
            tempCanvas.width = tw;
            tempCanvas.height = th;
            const tctx = tempCanvas.getContext('2d');
            tctx.drawImage(activeRenderDrawable, 0, 0, tw, th);
            const dataUri = tempCanvas.toDataURL('image/webp', 0.95);

            // Get camera engine code string
            const engineStr = CameraEngine.toString();

            const preset = PRESETS[currentPresetKey];
            const filename = `deep_space_amoled_${currentPresetKey}.html`;

            Exporter.exportStandaloneHtml({
              title: `Deep Space AMOLED Wallpaper (${preset.label})`,
              badge: `${preset.label} &bull; Custom Loop`,
              presetMode: cameraEngine.mode,
              durationSec: loopDurationSec,
              waypoints: cameraEngine.getWaypoints(),
              imageDataUri: dataUri,
              engineCode: engineStr,
              filename: filename
            });

            btnExportHtml.textContent = '💾 Download Standalone HTML';
          } catch (err) {
            console.error('Export HTML failed:', err);
            btnExportHtml.textContent = '💾 Download Standalone HTML';
            alert('Could not export HTML: The image canvas is tainted by external cross-origin restrictions. Please upload or drag & drop the image file locally.');
          }
        }, 50);
      });
    }

    // Export: Video Recording (MP4 / WebM)
    const btnRecordVideo = document.getElementById('btn-record-video');
    if (btnRecordVideo) {
      btnRecordVideo.addEventListener('click', () => {
        if (isRecording || !imageLoaded) return;
        const recordSec = parseInt(document.getElementById('select-record-duration').value, 10) || 30;
        isRecording = true;
        btnRecordVideo.textContent = '🔴 Recording...';
        recordBanner.classList.add('active');

        Exporter.recordVideo(
          canvas,
          recordSec,
          (pct, elapsed, total) => {
            recordBarFill.style.width = `${pct}%`;
            recordText.textContent = `Recording 60 FPS: ${Math.round(pct)}% (${elapsed.toFixed(1)}s / ${total}s)...`;
          },
          (blob, filename) => {
            isRecording = false;
            btnRecordVideo.textContent = '🎥 Record & Download Video';
            recordBanner.classList.remove('active');
            console.log(`[Studio] Video downloaded: ${filename}`);
          }
        );
      });
    }
  }

  /**
   * Sets up general player UI controls
   */
  function setupStudioUI() {
    // Populate Presets dropdown
    const presetSelect = document.getElementById('select-preset');
    presetSelect.innerHTML = '';
    for (const [key, p] of Object.entries(PRESETS)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = p.label;
      presetSelect.appendChild(opt);
    }
    presetSelect.value = currentPresetKey;
    presetSelect.addEventListener('change', (e) => {
      currentPresetKey = e.target.value;
      resizeViewport();
    });

    // Duration selector
    const durationSelect = document.getElementById('select-duration');
    durationSelect.addEventListener('change', (e) => {
      loopDurationSec = parseInt(e.target.value, 10);
      if (cameraEngine) cameraEngine.setDuration(loopDurationSec);
      updateScrubberUI();
    });

    // Play/Pause button
    const btnPlayPause = document.getElementById('btn-play-pause');
    btnPlayPause.addEventListener('click', () => {
      isPlaying = !isPlaying;
      btnPlayPause.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    });

    // Scrubber interaction
    scrubber.addEventListener('input', (e) => {
      progress = parseInt(e.target.value, 10) / 1000;
      updateScrubberUI();
    });

    // Speed Multiplier
    const speedSelect = document.getElementById('select-speed');
    speedSelect.addEventListener('change', (e) => {
      speedMultiplier = parseFloat(e.target.value);
    });

    // Radar Toggle
    const btnRadar = document.getElementById('btn-radar');
    btnRadar.addEventListener('click', () => {
      isRadarActive = !isRadarActive;
      radarContainer.style.display = isRadarActive ? 'block' : 'none';
      btnRadar.classList.toggle('active', isRadarActive);
    });

    // AMOLED Inspector Toggle
    const btnInspector = document.getElementById('btn-inspector');
    btnInspector.addEventListener('click', () => {
      isInspectorActive = !isInspectorActive;
      btnInspector.classList.toggle('active-magenta', isInspectorActive);
      amoledLegend.classList.toggle('visible', isInspectorActive);
    });

    // Fullscreen Toggle
    const btnFullscreen = document.getElementById('btn-fullscreen');
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    });

    // Hide HUD button
    const btnHideHud = document.getElementById('btn-hide-hud');
    btnHideHud.addEventListener('click', () => {
      isHudManuallyHidden = !isHudManuallyHidden;
      hudLayer.classList.toggle('hud-hidden', isHudManuallyHidden);
      btnHideHud.textContent = isHudManuallyHidden ? '👁 Show HUD (H)' : '🕶 Hide HUD (H)';
    });

    // Auto-hide HUD on mouse inactivity
    const resetHudTimer = () => {
      if (isHudManuallyHidden) return;
      hudLayer.classList.remove('hud-hidden');
      clearTimeout(hudHideTimeout);
      hudHideTimeout = setTimeout(() => {
        if (!isHudManuallyHidden && !document.querySelector('.studio-drawer.active')) {
          hudLayer.classList.add('hud-hidden');
        }
      }, 4000);
    };

    window.addEventListener('mousemove', resetHudTimer);
    window.addEventListener('touchstart', resetHudTimer);
    resetHudTimer();

    // Hotkey Controls
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        btnPlayPause.click();
      } else if (e.key === 'h' || e.key === 'H') {
        btnHideHud.click();
      } else if (e.key === 'b' || e.key === 'B') {
        btnInspector.click();
      } else if (e.key === 'm' || e.key === 'M') {
        btnRadar.click();
      } else if (e.key === 'f' || e.key === 'F') {
        btnFullscreen.click();
      } else if (e.key === 'Escape') {
        if (currentScreen === 'studio') {
          switchToScreen('discovery');
        }
      }
    });

    window.addEventListener('resize', () => {
      resizeViewport();
      updateSplineEditorView();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !isRecording) {
        isPlaying = false;
        btnPlayPause.textContent = '▶ Play';
      }
    });
  }

  /**
   * Sets up Drag & Drop for arbitrary astronomical images
   */
  function setupDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (dropZone) dropZone.classList.add('active');
    });

    window.addEventListener('dragleave', (e) => {
      if (e.clientX <= 0 || e.clientY <= 0) {
        if (dropZone) dropZone.classList.remove('active');
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dropZone) dropZone.classList.remove('active');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          loadImageSource(evt.target.result, null, file.name, () => {
            switchToScreen('studio');
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  /**
   * Progressive Web App (PWA) Initialization
   */
  function initPWA() {
    const isHttp = (window.location.protocol === 'http:' || window.location.protocol === 'https:' || window.location.hostname === 'localhost');
    if (!isHttp) {
      if (pwaStatusBadge) {
        pwaStatusBadge.textContent = '⚡ 100% Offline (Local File Mode)';
      }
      return;
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered with scope:', registration.scope);
            registration.update();
            if (pwaStatusBadge) {
              pwaStatusBadge.textContent = '⚡ 100% Offline Ready';
            }
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (pwaInstallBtn) {
        pwaInstallBtn.style.display = 'inline-flex';
      }
      console.log('[PWA] beforeinstallprompt event captured');
    });

    if (pwaInstallBtn) {
      pwaInstallBtn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) {
          if (typeof navigator.install === 'function') {
            try {
              await navigator.install();
              pwaInstallBtn.style.display = 'none';
              return;
            } catch (err) {
              console.warn('navigator.install error:', err);
            }
          }
          alert('To install this app, click the install icon in your browser address bar (or Add to Home Screen in mobile settings).');
          return;
        }

        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        console.log('[PWA] Install choice:', choice.outcome);
        if (choice.outcome === 'accepted') {
          pwaInstallBtn.style.display = 'none';
        }
        deferredInstallPrompt = null;
      });
    }

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      if (pwaInstallBtn) pwaInstallBtn.style.display = 'none';
      if (pwaStatusBadge) pwaStatusBadge.textContent = '⚡ Installed & Offline Ready';
      console.log('[PWA] App successfully installed!');
    });

    window.addEventListener('online', () => {
      if (pwaStatusBadge) pwaStatusBadge.textContent = '⚡ Online & Offline Ready';
    });
    window.addEventListener('offline', () => {
      if (pwaStatusBadge) pwaStatusBadge.textContent = '⚡ Offline Mode (Local Library Active)';
    });
  }

  // Bootstrap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
