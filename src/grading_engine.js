/**
 * src/grading_engine.js - Client-Side AMOLED True-Black Color Grading Engine
 *
 * Implements real-time soft-knee cubic Hermite black-crushing, star mask preservation,
 * and live AMOLED telemetry (% true black RGB 0,0,0) directly in the browser.
 */

class GradingEngine {
  constructor() {
    this.previewCanvas = document.createElement('canvas');
    this.previewCtx = this.previewCanvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Fast statistical analysis of background sky luminance
   */
  analyzeImage(img) {
    const sw = 320;
    const sh = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * sw));
    this.previewCanvas.width = sw;
    this.previewCanvas.height = sh;

    this.previewCtx.drawImage(img, 0, 0, sw, sh);
    const imgData = this.previewCtx.getImageData(0, 0, sw, sh);
    const d = imgData.data;
    const len = d.length;

    const luminances = [];
    let rawPureBlackCount = 0;
    const totalPixels = len / 4;

    for (let i = 0; i < len; i += 4) {
      if (d[i] === 0 && d[i + 1] === 0 && d[i + 2] === 0) {
        rawPureBlackCount++;
      }
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      luminances.push(lum);
    }

    luminances.sort((a, b) => a - b);
    const p2 = luminances[Math.floor(totalPixels * 0.02)];
    const p5 = luminances[Math.floor(totalPixels * 0.05)];
    const p10 = luminances[Math.floor(totalPixels * 0.10)];

    const suggestedFloor = Math.max(8.0, Math.round(p2 + 2.0));
    const suggestedKnee = 22.0;

    return {
      rawBlackPct: ((rawPureBlackCount / totalPixels) * 100).toFixed(2),
      p2: p2.toFixed(1),
      p5: p5.toFixed(1),
      p10: p10.toFixed(1),
      suggestedFloor,
      suggestedKnee
    };
  }

  /**
   * Grades a source image and paints the result onto a target canvas.
   *
   * @param {HTMLImageElement|HTMLCanvasElement} src
   * @param {HTMLCanvasElement} targetCanvas
   * @param {Object} options
   */
  applyGrade(src, targetCanvas, options = {}) {
    const t0 = performance.now();
    const tBlack = options.blackFloor !== undefined ? options.blackFloor : 22.0;
    const tKneeWidth = options.kneeWidth !== undefined ? options.kneeWidth : 24.0;
    const tKnee = tBlack + tKneeWidth;
    const starProtect = options.starProtect !== undefined ? options.starProtect : 0.85;
    const contrast = options.contrast !== undefined ? options.contrast : 1.08;

    const srcW = src.naturalWidth || src.width;
    const srcH = src.naturalHeight || src.height;

    // Optional max dimension to prevent out-of-memory on mobile
    const maxDim = options.maxDimension || 5120;
    let outW = srcW;
    let outH = srcH;
    if (Math.max(srcW, srcH) > maxDim) {
      const scale = maxDim / Math.max(srcW, srcH);
      outW = Math.round(srcW * scale);
      outH = Math.round(srcH * scale);
    }

    targetCanvas.width = outW;
    targetCanvas.height = outH;
    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });

    // Draw source
    ctx.drawImage(src, 0, 0, outW, outH);
    const imgData = ctx.getImageData(0, 0, outW, outH);
    const d = imgData.data;
    const len = d.length;
    const totalPixels = outW * outH;

    let gradedBlackCount = 0;
    const invKneeRange = 1.0 / Math.max(tKneeWidth, 1e-4);

    // Precompute a 256-entry lookup table for the soft-knee factor for maximum speed!
    const lutFactor = new Float32Array(256);
    for (let lum = 0; lum < 256; lum++) {
      if (lum <= tBlack) {
        lutFactor[lum] = 0.0;
      } else if (lum >= tKnee) {
        lutFactor[lum] = 1.0;
      } else {
        const u = (lum - tBlack) * invKneeRange;
        lutFactor[lum] = 3.0 * u * u - 2.0 * u * u * u; // Cubic Hermite smoothstep
      }
    }

    // Process pixels in-place
    for (let i = 0; i < len; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      const lumInt = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      let factor = lutFactor[Math.min(255, Math.max(0, lumInt))];

      // Pinpoint star protection: if pixel has high saturation or intensity spike
      if (factor < 0.6 && starProtect > 0) {
        const maxCh = Math.max(r, g, b);
        const minCh = Math.min(r, g, b);
        const sat = maxCh > 0 ? (maxCh - minCh) / maxCh : 0;
        if (maxCh > 45 || sat > 0.35) {
          factor = Math.max(factor, starProtect * 0.7);
        }
      }

      if (factor <= 0.0) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        gradedBlackCount++;
      } else {
        let nr = r * factor;
        let ng = g * factor;
        let nb = b * factor;

        if (contrast !== 1.0) {
          nr = Math.pow(nr / 255.0, 1.0 / contrast) * 255.0;
          ng = Math.pow(ng / 255.0, 1.0 / contrast) * 255.0;
          nb = Math.pow(nb / 255.0, 1.0 / contrast) * 255.0;
        }

        d[i] = Math.min(255, Math.max(0, Math.round(nr)));
        d[i + 1] = Math.min(255, Math.max(0, Math.round(ng)));
        d[i + 2] = Math.min(255, Math.max(0, Math.round(nb)));
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const elapsed = performance.now() - t0;

    return {
      blackPercentage: ((gradedBlackCount / totalPixels) * 100).toFixed(2),
      blackPixels: gradedBlackCount,
      totalPixels,
      width: outW,
      height: outH,
      elapsedMs: Math.round(elapsed)
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GradingEngine };
}
