const { CameraEngine } = require('../src/camera_engine.js');
const imgW = parseInt(process.argv[2], 10) || 5120;
const imgH = parseInt(process.argv[3], 10) || 2965;
const engine = new CameraEngine(imgW, imgH, { mode: 'odyssey' });

const configs = [
  { name: 'desktop_1080p', w: 1920, h: 1080, label: '16:9 PC Desktop (1920x1080)' },
  { name: 'phone_2k_9_20', w: 1440, h: 3200, label: '9:20 Phone Screen 2K (1440x3200)' }
];

// Sample 4 key moments in the loop:
// 0.00: Grand Vista Horizon
// 0.25: Upper Ridge & Background Galaxies
// 0.45: Deep Protostar Nursery Macro
// 0.72: Lower Dust Shelf & Tendrils
const timepoints = [
  { t: 0.00, title: 'Overview Vista (Horizon & Nebula)' },
  { t: 0.25, title: 'Upper Cosmic Ridge & Deep Space Void' },
  { t: 0.45, title: 'Protostar Nursery Macro (Maximum Zoom)' },
  { t: 0.72, title: 'Lower Nebula Shelf & Gas Filaments' }
];

const results = [];
for (const cfg of configs) {
  for (const tp of timepoints) {
    const cam = engine.solveCamera(tp.t, cfg.w, cfg.h);
    results.push({
      config: cfg.name,
      label: cfg.label,
      targetW: cfg.w,
      targetH: cfg.h,
      t: tp.t,
      title: tp.title,
      rect: cam.sourceRect,
      zoom: cam.relativeZoom
    });
  }
}

console.log(JSON.stringify(results, null, 2));
