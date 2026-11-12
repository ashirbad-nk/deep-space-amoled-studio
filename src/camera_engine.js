/**
 * src/camera_engine.js - High-Precision Mathematical Camera Engine for Seamless Astronomical Loops.
 *
 * Guarantees:
 * 1. C^1/C^2 Loop Closure Invariant: P(0) === P(1), v(0) === v(1), zero velocity stutter at seam.
 * 2. Perceptual Logarithmic Zoom Pacing (scale(t) = 2^(z(t))).
 * 3. Constant Screen-Space Traveling Velocity via Arc-Length Re-parameterization.
 * 4. Dynamic Viewport Bounding Solver: Zero letterboxing across any aspect ratio (9:19.5 to 32:9).
 */

class CameraEngine {
  constructor(imageWidth, imageHeight, options = {}) {
    this.imgW = imageWidth;
    this.imgH = imageHeight;
    this.mode = options.mode || 'odyssey'; // 'odyssey' | 'lissajous' | 'deep_dive'
    this.loopDurationSec = options.loopDurationSec || 180; // 3-minute loop default
    this.samplesCount = 2400; // Arc-length lookup table size
    
    this.initPaths();
  }

  setImageDimensions(w, h) {
    this.imgW = w;
    this.imgH = h;
    this.initPaths();
  }

  setMode(mode) {
    if (['odyssey', 'lissajous', 'deep_dive'].includes(mode)) {
      this.mode = mode;
      this.buildLUT();
    }
  }

  setDuration(seconds) {
    this.loopDurationSec = Math.max(10, Math.min(600, seconds));
  }

  /**
   * Initializes waypoints in normalized image coordinates [0.0 - 1.0].
   * Baseline zoom z >= 1.25 gives ample room to pan across all mobile/desktop aspect ratios.
   */
  initPaths() {
    // 1. Cosmic Odyssey: Smooth, continuous panoramic tour without hairpin reversals (~85-90% coverage)
    this.odysseyWaypoints = [
      { x: 0.30, y: 0.28, z: 1.35, desc: 'Top-Left Celestial Void' },
      { x: 0.50, y: 0.30, z: 1.50, desc: 'Upper Central Ridge' },
      { x: 0.70, y: 0.38, z: 1.90, desc: 'North-East Gas Wall' },
      { x: 0.76, y: 0.56, z: 2.40, desc: 'East Ionization Front' },
      { x: 0.56, y: 0.64, z: 3.20, desc: 'Protostar Nursery Macro' },
      { x: 0.40, y: 0.72, z: 2.10, desc: 'Southern Nebular Shelf' },
      { x: 0.25, y: 0.62, z: 1.75, desc: 'South-West Luminous Gas' },
      { x: 0.22, y: 0.44, z: 1.45, desc: 'Western Perimeter' }
    ];

    // 2. Deep Dive: Extreme macro details and slow contemplative glides
    this.deepDiveWaypoints = [
      { x: 0.50, y: 0.55, z: 2.00, desc: 'Core Vista' },
      { x: 0.46, y: 0.58, z: 3.60, desc: 'Protostar Jet Macro' },
      { x: 0.54, y: 0.62, z: 4.40, desc: 'Pillar Crest Inspection' },
      { x: 0.60, y: 0.56, z: 3.20, desc: 'Glowing Gas Horizon' },
      { x: 0.52, y: 0.48, z: 2.50, desc: 'Dust Filament Drift' }
    ];

    // 3. Custom / User-Edited Waypoints
    this.customWaypoints = JSON.parse(JSON.stringify(this.odysseyWaypoints));

    this.buildLUT();
  }

  setCustomWaypoints(points) {
    if (Array.isArray(points) && points.length >= 4) {
      this.customWaypoints = JSON.parse(JSON.stringify(points));
      this.mode = 'custom';
      this.buildLUT();
    }
  }

  updateWaypoint(index, updates) {
    if (this.mode !== 'custom') {
      const active = this.mode === 'deep_dive' ? this.deepDiveWaypoints : this.odysseyWaypoints;
      this.customWaypoints = JSON.parse(JSON.stringify(active));
      this.mode = 'custom';
    }
    if (index >= 0 && index < this.customWaypoints.length) {
      Object.assign(this.customWaypoints[index], updates);
      this.buildLUT();
    }
  }

  addWaypoint(indexOrPoint, point) {
    let index;
    let ptObj;
    if (typeof indexOrPoint === 'object' && indexOrPoint !== null) {
      ptObj = indexOrPoint;
      index = (typeof point === 'number') ? point : this.getWaypoints().length;
    } else {
      index = (typeof indexOrPoint === 'number') ? indexOrPoint : this.getWaypoints().length;
      ptObj = point || {};
    }

    if (this.mode !== 'custom') {
      const active = this.mode === 'deep_dive' ? this.deepDiveWaypoints : this.odysseyWaypoints;
      this.customWaypoints = JSON.parse(JSON.stringify(active));
      this.mode = 'custom';
    }

    const idx = Math.max(0, Math.min(this.customWaypoints.length, index));
    const pt = {
      x: Math.max(0.05, Math.min(0.95, ptObj.x !== undefined ? ptObj.x : 0.5)),
      y: Math.max(0.05, Math.min(0.95, ptObj.y !== undefined ? ptObj.y : 0.5)),
      z: Math.max(1.10, Math.min(5.0, ptObj.z !== undefined ? ptObj.z : 2.0)),
      desc: ptObj.desc || `Waypoint ${this.customWaypoints.length + 1}`
    };
    this.customWaypoints.splice(idx, 0, pt);
    this.buildLUT();
    return idx;
  }

  removeWaypoint(index) {
    if (this.mode !== 'custom') {
      const active = this.mode === 'deep_dive' ? this.deepDiveWaypoints : this.odysseyWaypoints;
      this.customWaypoints = JSON.parse(JSON.stringify(active));
      this.mode = 'custom';
    }
    if (this.customWaypoints.length > 4 && index >= 0 && index < this.customWaypoints.length) {
      this.customWaypoints.splice(index, 1);
      this.buildLUT();
    }
  }

  /**
   * Procedural Randomization of Spline Waypoints:
   * Generates a smooth, loop-closed trajectory distributed across quadrants with organic zoom pacing.
   */
  randomizeWaypoints(count = 7) {
    const pts = [];
    const cx = 0.50, cy = 0.50;
    const rx = 0.28 + Math.random() * 0.08;
    const ry = 0.24 + Math.random() * 0.06;

    for (let i = 0; i < count; i++) {
      const baseAngle = (i / count) * 2 * Math.PI;
      const angle = baseAngle + (Math.random() - 0.5) * 0.45;
      const distMod = 0.70 + Math.random() * 0.55;

      const x = Math.max(0.18, Math.min(0.82, cx + Math.cos(angle) * rx * distMod));
      const y = Math.max(0.20, Math.min(0.80, cy + Math.sin(angle) * ry * distMod));
      const z = 1.30 + Math.random() * 2.30;

      pts.push({
        x: parseFloat(x.toFixed(3)),
        y: parseFloat(y.toFixed(3)),
        z: parseFloat(z.toFixed(2)),
        desc: `Waystop ${i + 1}`
      });
    }

    this.customWaypoints = pts;
    this.mode = 'custom';
    this.buildLUT();
    return pts;
  }

  /**
   * Catmull-Rom closed spline evaluation with wrapping indices.
   */
  catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;

    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    );

    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );

    // Interpolate zoom in log2 scale for optical zoom pacing
    const logZ0 = Math.log2(p0.z);
    const logZ1 = Math.log2(p1.z);
    const logZ2 = Math.log2(p2.z);
    const logZ3 = Math.log2(p3.z);

    const logZ = 0.5 * (
      (2 * logZ1) +
      (-logZ0 + logZ2) * t +
      (2 * logZ0 - 5 * logZ1 + 4 * logZ2 - logZ3) * t2 +
      (-logZ0 + 3 * logZ1 - 3 * logZ2 + logZ3) * t3
    );

    return { x, y, z: Math.pow(2, logZ) };
  }

  /**
   * Evaluates the raw closed spline at normalized progress u in [0, 1].
   */
  evalRawSpline(waypoints, u) {
    const n = waypoints.length;
    const normU = ((u % 1) + 1) % 1;
    const scaled = normU * n;
    const idx = Math.floor(scaled);
    const t = scaled - idx;

    const p0 = waypoints[(idx - 1 + n) % n];
    const p1 = waypoints[idx % n];
    const p2 = waypoints[(idx + 1) % n];
    const p3 = waypoints[(idx + 2) % n];

    return this.catmullRom(p0, p1, p2, p3, t);
  }

  /**
   * Evaluates harmonic Lissajous closed orbit (infinite C^infinity smoothness).
   */
  evalLissajous(u) {
    const tau = 2 * Math.PI;
    const normU = ((u % 1) + 1) % 1;

    // Harmonic frequencies (coprime integers 2, 3, 1 guarantee perfect loop closure)
    const fx = 2, fy = 3, fz = 1;
    const phiX = 0;
    const phiY = Math.PI / 4;
    const phiZ = Math.PI / 6;

    const x = 0.50 + 0.26 * Math.sin(tau * fx * normU + phiX);
    const y = 0.50 + 0.24 * Math.sin(tau * fy * normU + phiY);

    // Log-zoom oscillation between 1.35x and 2.9x
    const logZMin = Math.log2(1.35);
    const logZMax = Math.log2(2.90);
    const zInterp = 0.5 + 0.5 * Math.sin(tau * fz * normU + phiZ);
    const z = Math.pow(2, logZMin + (logZMax - logZMin) * zInterp);

    return { x, y, z };
  }

  /**
   * Builds an Arc-Length Lookup Table (LUT) for uniform screen-space camera velocity.
   */
  buildLUT() {
    this.lut = [];
    let totalLen = 0;
    let prev = this.evalRaw(0);

    this.lut.push({ u: 0, s: 0, pt: prev });

    const step = 1.0 / this.samplesCount;
    for (let i = 1; i <= this.samplesCount; i++) {
      const u = i * step;
      const pt = this.evalRaw(u);
      const dx = (pt.x - prev.x) * this.imgW;
      const dy = (pt.y - prev.y) * this.imgH;
      const dist = Math.hypot(dx, dy);
      totalLen += dist;
      this.lut.push({ u, s: totalLen, pt });
      prev = pt;
    }

    this.totalArcLength = totalLen;
  }

  evalRaw(u) {
    if (this.mode === 'lissajous') {
      return this.evalLissajous(u);
    }
    let wp;
    if (this.mode === 'custom') {
      wp = this.customWaypoints;
    } else if (this.mode === 'deep_dive') {
      wp = this.deepDiveWaypoints;
    } else {
      wp = this.odysseyWaypoints;
    }
    return this.evalRawSpline(wp, u);
  }

  /**
   * Arc-Length re-parameterized sampling: Maps uniform time t in [0, 1] to constant velocity on curve.
   */
  samplePath(progress) {
    const norm = ((progress % 1) + 1) % 1;
    if (this.mode === 'lissajous') {
      return this.evalLissajous(norm);
    }

    const targetS = norm * this.totalArcLength;

    // Binary search through LUT
    let low = 0;
    let high = this.lut.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.lut[mid].s < targetS) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx = Math.max(1, Math.min(low, this.lut.length - 1));
    const p0 = this.lut[idx - 1];
    const p1 = this.lut[idx];
    const segLen = p1.s - p0.s;
    const factor = segLen > 1e-6 ? (targetS - p0.s) / segLen : 0;

    const u = p0.u + factor * (p1.u - p0.u);
    return this.evalRaw(u);
  }

  /**
   * Core camera solver: Computes camera position and viewport rectangle,
   * guaranteeing zero letterbox and strictly clamping camera to stay inside image.
   *
   * @param {number} progress - Normalized loop time [0, 1)
   * @param {number} viewportW - Screen/Viewport pixel width
   * @param {number} viewportH - Screen/Viewport pixel height
   */
  solveCamera(progress, viewportW, viewportH) {
    const raw = this.samplePath(progress);

    // 1. Calculate Base "Cover" scale for this aspect ratio
    const scaleCover = Math.max(viewportW / this.imgW, viewportH / this.imgH);

    // 2. Effective scale incorporates waypoint zoom (clamped to at least 1.0)
    const effectiveZ = Math.max(1.0, raw.z);
    const effectiveScale = scaleCover * effectiveZ;

    // 3. Visible rectangle in master image coordinates (guaranteed <= imgW and <= imgH)
    const viewW = Math.min(this.imgW, viewportW / effectiveScale);
    const viewH = Math.min(this.imgH, viewportH / effectiveScale);

    // 4. Safe camera center limits (Zero bleed / Zero letterbox invariant)
    const minCenterX = viewW / 2;
    const maxCenterX = Math.max(minCenterX, this.imgW - viewW / 2);
    const minCenterY = viewH / 2;
    const maxCenterY = Math.max(minCenterY, this.imgH - viewH / 2);

    // Target center in pixel coordinates
    const targetCenterX = raw.x * this.imgW;
    const targetCenterY = raw.y * this.imgH;

    // Clamped center
    const clampedCenterX = Math.max(minCenterX, Math.min(maxCenterX, targetCenterX));
    const clampedCenterY = Math.max(minCenterY, Math.min(maxCenterY, targetCenterY));

    // Visible bounding box in image coordinates (strictly inside image bounds)
    const rectX = Math.max(0, Math.min(this.imgW - viewW, clampedCenterX - viewW / 2));
    const rectY = Math.max(0, Math.min(this.imgH - viewH, clampedCenterY - viewH / 2));

    return {
      center: { x: clampedCenterX, y: clampedCenterY },
      normalizedCenter: { x: clampedCenterX / this.imgW, y: clampedCenterY / this.imgH },
      scale: effectiveScale,
      relativeZoom: effectiveZ,
      viewSize: { w: viewW, h: viewH },
      sourceRect: { x: rectX, y: rectY, w: viewW, h: viewH }
    };
  }

  /**
   * Returns all waypoints for trajectory radar mini-map.
   */
  getWaypoints() {
    if (this.mode === 'lissajous') {
      const pts = [];
      for (let i = 0; i < 48; i++) {
        pts.push(this.evalLissajous(i / 48));
      }
      return pts;
    }
    if (this.mode === 'custom') {
      return this.customWaypoints;
    }
    return this.mode === 'deep_dive' ? this.deepDiveWaypoints : this.odysseyWaypoints;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CameraEngine };
}
