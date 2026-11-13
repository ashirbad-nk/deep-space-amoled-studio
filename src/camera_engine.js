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
   * Anchored with a majestic Center Wide Overview at z = 1.00 so user gets the Big Picture once per loop!
   */
  initPaths() {
    // 1. Cosmic Odyssey: Smooth, continuous panoramic tour without hairpin reversals (~85-90% coverage)
    // Anchored with a majestic Center Wide Overview at z = 1.00 so user gets the Big Picture once per loop!
    this.odysseyWaypoints = [
      { x: 0.50, y: 0.50, z: 1.00, desc: 'Grand Celestial Overview (The Big Picture)' },
      { x: 0.32, y: 0.30, z: 1.65, desc: 'North-West Gas Filaments' },
      { x: 0.50, y: 0.32, z: 2.10, desc: 'Northern Ionization Ridge' },
      { x: 0.68, y: 0.36, z: 2.60, desc: 'North-East Stellar Nursery' },
      { x: 0.74, y: 0.55, z: 3.40, desc: 'East Protostar Jet Climax' },
      { x: 0.58, y: 0.68, z: 2.50, desc: 'Southern Dust Pillars' },
      { x: 0.33, y: 0.66, z: 1.85, desc: 'South-West Luminous Shelf' },
      { x: 0.24, y: 0.48, z: 1.40, desc: 'Western Perimeter Drift' }
    ];

    // 2. Deep Dive: Extreme macro details and slow contemplative glides
    // Starts with Full Observatory Overview, plunges into high-density cores, and returns seamlessly
    this.deepDiveWaypoints = [
      { x: 0.50, y: 0.50, z: 1.00, desc: 'Full Observatory Overview (Big Picture)' },
      { x: 0.48, y: 0.46, z: 2.00, desc: 'Core Cloud Horizon' },
      { x: 0.54, y: 0.52, z: 3.60, desc: 'Protostar Jet Macro' },
      { x: 0.50, y: 0.58, z: 4.40, desc: 'Pillar Crest Extreme Macro Climax' },
      { x: 0.42, y: 0.54, z: 2.80, desc: 'Glowing Gas Horizon' },
      { x: 0.45, y: 0.48, z: 1.70, desc: 'Dust Filament Pull-Back' }
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
      z: Math.max(1.00, Math.min(5.0, ptObj.z !== undefined ? ptObj.z : 2.0)),
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
   * Procedural Cinematic Narrative Spline Generator:
   * Generates a 4-phase cinematic visual arc:
   * 1. Act I (Establishing): Center wide overview at z = 1.00 (The Big Picture).
   * 2. Act II (Approach & Medium Shot): Glide to a Rule-of-Thirds node at medium zoom (z ~ 1.7 - 2.1).
   * 3. Act III (Macro Climax): Deep dive into dense detail at deep zoom (z ~ 3.2 - 4.2).
   * 4. Act IV (Counter-Glide & Easing Return): Sweeping lateral pan easing back to the wide overview.
   * Includes Aspect-Ratio-Aware Directional Biasing (lateral for ultrawide, pedestal for portrait).
   */
  randomizeWaypoints(count = 7, aspectHint = null) {
    const pts = [];
    const n = Math.max(5, count);

    // 1. Aspect-Ratio-Aware Directional Biasing
    const aspect = aspectHint || (this.imgH > 0 ? (this.imgW / this.imgH) : 1.78);
    let rx, ry;
    if (aspect >= 1.5) {
      // Widescreen / Ultrawide: sweeping lateral tracking moves (classic 70mm cinema)
      rx = 0.32 + Math.random() * 0.06;
      ry = 0.18 + Math.random() * 0.05;
    } else if (aspect <= 0.75) {
      // Mobile / Portrait: majestic vertical ascension & pedestal movement
      rx = 0.18 + Math.random() * 0.05;
      ry = 0.32 + Math.random() * 0.06;
    } else {
      // Balanced orbital tour for standard displays
      rx = 0.27 + Math.random() * 0.05;
      ry = 0.24 + Math.random() * 0.05;
    }

    // 2. Act I: The Grand Overview (Center Big Picture)
    // Anchored at index 0 (the seamless loop seam) with z = 1.00
    pts.push({
      x: parseFloat((0.50 + (Math.random() - 0.5) * 0.02).toFixed(3)),
      y: parseFloat((0.50 + (Math.random() - 0.5) * 0.02).toFixed(3)),
      z: 1.00,
      desc: 'Grand Overview (The Big Picture)'
    });

    // Determine the index for the Deep Macro Climax (around halfway through the loop)
    const climaxIdx = Math.floor(n / 2);

    for (let i = 1; i < n; i++) {
      const angle = (i / n) * 2 * Math.PI + (Math.random() - 0.5) * 0.35;
      const distMod = 0.85 + Math.random() * 0.30;

      let x = 0.50 + Math.cos(angle) * rx * distMod;
      let y = 0.50 + Math.sin(angle) * ry * distMod;

      // Soft Rule-of-Thirds gravity (guide toward 0.33 or 0.67 coordinates)
      const targetThirdX = x < 0.5 ? 0.33 : 0.67;
      const targetThirdY = y < 0.5 ? 0.33 : 0.67;
      x = x * 0.70 + targetThirdX * 0.30;
      y = y * 0.70 + targetThirdY * 0.30;

      x = Math.max(0.18, Math.min(0.82, x));
      y = Math.max(0.20, Math.min(0.80, y));

      let z, desc;
      if (i === climaxIdx) {
        // Act III: Deep Macro Climax
        z = 3.20 + Math.random() * 1.10; // 3.20 - 4.30
        desc = `Macro Climax (Detail Inspection)`;
      } else if (i === 1 || i === n - 1) {
        // Transitional Waypoints (Easing to/from Grand Overview)
        z = 1.45 + Math.random() * 0.35; // 1.45 - 1.80
        desc = i === 1 ? 'Discovery Approach Glide' : 'Scenic Return Arc';
      } else if (i < climaxIdx) {
        // Act II: Building Tension & Guided Tour
        z = 2.00 + Math.random() * 0.70; // 2.00 - 2.70
        desc = `Guided Exploration ${i}`;
      } else {
        // Act IV: Resolving Counter-Glide
        z = 2.10 + Math.random() * 0.60; // 2.10 - 2.70
        desc = `Counter-Glide Transition ${i}`;
      }

      pts.push({
        x: parseFloat(x.toFixed(3)),
        y: parseFloat(y.toFixed(3)),
        z: parseFloat(z.toFixed(2)),
        desc
      });
    }

    this.customWaypoints = pts;
    this.mode = 'custom';
    this.buildLUT();
    return pts;
  }

  /**
   * Centripetal Catmull-Rom closed spline evaluation with wrapping indices.
   * Eliminates cusps, self-intersections, and whiplash cornering.
   */
  catmullRom(p0, p1, p2, p3, t) {
    const l0 = Math.log2(p0.z);
    const l1 = Math.log2(p1.z);
    const l2 = Math.log2(p2.z);
    const l3 = Math.log2(p3.z);

    const getKnot = (ti, x0, y0, z0, x1, y1, z1) => {
      const dx = x1 - x0;
      const dy = y1 - y0;
      const dz = (z1 - z0) * 0.25;
      const d = Math.hypot(dx, dy, dz);
      return ti + Math.sqrt(Math.max(d, 1e-4));
    };

    const t0 = 0.0;
    const t1 = getKnot(t0, p0.x, p0.y, l0, p1.x, p1.y, l1);
    const t2 = getKnot(t1, p1.x, p1.y, l1, p2.x, p2.y, l2);
    const t3 = getKnot(t2, p2.x, p2.y, l2, p3.x, p3.y, l3);

    const curT = t1 + t * (t2 - t1);

    const lerpPt = (x0, y0, z0, x1, y1, z1, tA, tB) => {
      const dt = tB - tA;
      if (Math.abs(dt) < 1e-6) return { x: x0, y: y0, z: z0 };
      const f = (curT - tA) / dt;
      return {
        x: x0 + f * (x1 - x0),
        y: y0 + f * (y1 - y0),
        z: z0 + f * (z1 - z0)
      };
    };

    const a1 = lerpPt(p0.x, p0.y, l0, p1.x, p1.y, l1, t0, t1);
    const a2 = lerpPt(p1.x, p1.y, l1, p2.x, p2.y, l2, t1, t2);
    const a3 = lerpPt(p2.x, p2.y, l2, p3.x, p3.y, l3, t2, t3);

    const b1 = lerpPt(a1.x, a1.y, a1.z, a2.x, a2.y, a2.z, t0, t2);
    const b2 = lerpPt(a2.x, a2.y, a2.z, a3.x, a3.y, a3.z, t1, t3);

    const c = lerpPt(b1.x, b1.y, b1.z, b2.x, b2.y, b2.z, t1, t2);

    return {
      x: c.x,
      y: c.y,
      z: Math.max(1.00, Math.pow(2, c.z))
    };
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
   * Builds an Arc-Length Lookup Table (LUT) with Cinematic Dwell Weighting.
   * Arc-length re-parameterization ensures uniform screen-space velocity,
   * while cubic Hermite dwell weighting creates gentle, cinematic deceleration
   * when lingering at the Grand Wide Overview (z <= 1.15) and Deep Macro Climax (z >= 2.80).
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
      const dz = Math.abs(Math.log2(pt.z) - Math.log2(prev.z)) * Math.min(this.imgW, this.imgH) * 0.40;
      const dist = Math.hypot(dx, dy, dz);

      // Principle 4: Cinematic Dwell (Hermite Linger)
      // Smoothly linger at wide overview (z <= 1.15) and macro climax (z >= 2.80)
      let dwell = 1.0;
      if (pt.z <= 1.15) {
        const t = Math.max(0, (1.15 - pt.z) / 0.15);
        dwell += 0.35 * (3 * t * t - 2 * t * t * t);
      } else if (pt.z >= 2.80) {
        const t = Math.min(1.0, (pt.z - 2.80) / 1.20);
        dwell += 0.30 * (3 * t * t - 2 * t * t * t);
      }

      const weightedDist = Math.max(0.01, dist) * dwell;
      totalLen += weightedDist;
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

    // Guard against 0 or negative dimensions (e.g. collapsed or minimized window)
    const vw = Math.max(1, viewportW || 1);
    const vh = Math.max(1, viewportH || 1);
    const iw = Math.max(1, this.imgW || 1);
    const ih = Math.max(1, this.imgH || 1);

    // 1. Calculate Base "Cover" scale for this aspect ratio
    const scaleCover = Math.max(vw / iw, vh / ih);

    // 2. Effective scale incorporates waypoint zoom (clamped to at least 1.0)
    const effectiveZ = Math.max(1.0, raw.z || 1.0);
    const effectiveScale = Math.max(1e-4, scaleCover * effectiveZ);

    // 3. Visible rectangle in master image coordinates (guaranteed <= iw and <= ih)
    const viewW = Math.max(1, Math.min(iw, vw / effectiveScale));
    const viewH = Math.max(1, Math.min(ih, vh / effectiveScale));

    // 4. Safe camera center limits (Zero bleed / Zero letterbox invariant)
    const minCenterX = viewW / 2;
    const maxCenterX = Math.max(minCenterX, iw - viewW / 2);
    const minCenterY = viewH / 2;
    const maxCenterY = Math.max(minCenterY, ih - viewH / 2);

    // Target center in pixel coordinates
    const targetCenterX = (raw.x !== undefined ? raw.x : 0.5) * iw;
    const targetCenterY = (raw.y !== undefined ? raw.y : 0.5) * ih;

    // Clamped center
    const clampedCenterX = Math.max(minCenterX, Math.min(maxCenterX, targetCenterX));
    const clampedCenterY = Math.max(minCenterY, Math.min(maxCenterY, targetCenterY));

    // Visible bounding box in image coordinates (strictly inside image bounds)
    const rectX = Math.max(0, Math.min(iw - viewW, clampedCenterX - viewW / 2));
    const rectY = Math.max(0, Math.min(ih - viewH, clampedCenterY - viewH / 2));

    return {
      center: { x: clampedCenterX, y: clampedCenterY },
      normalizedCenter: { x: clampedCenterX / iw, y: clampedCenterY / ih },
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
