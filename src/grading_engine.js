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

    // Visual enhancements
    const exposure = options.exposure !== undefined ? options.exposure : 0.0; // in EV (-2.00 to +2.00)
    const contrast = options.contrast !== undefined ? options.contrast : 1.08; // 0.50 to 2.00
    const saturation = options.saturation !== undefined ? options.saturation : 1.0; // 0.00 to 2.00
    const sharpness = options.sharpness !== undefined ? options.sharpness : 0.0; // 0.00 to 1.00

    const srcW = src.naturalWidth || src.width;
    const srcH = src.naturalHeight || src.height;

    // Max dimension (0 or 'original' disables downsampling, preserving 100% full original resolution)
    const maxDim = (options.maxDimension === 0 || options.maxDimension === 'original' || options.maxDimension === false)
      ? 0
      : (options.maxDimension !== undefined ? options.maxDimension : 0);

    let outW = srcW;
    let outH = srcH;
    if (maxDim > 0 && Math.max(srcW, srcH) > maxDim) {
      const scale = maxDim / Math.max(srcW, srcH);
      outW = Math.round(srcW * scale);
      outH = Math.round(srcH * scale);
    }

    targetCanvas.width = outW;
    targetCanvas.height = outH;
    const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw source
    ctx.drawImage(src, 0, 0, outW, outH);
    const imgData = ctx.getImageData(0, 0, outW, outH);
    const d = imgData.data;
    const len = d.length;
    const totalPixels = outW * outH;

    // 1. Sharpness pass (Unsharp mask / Laplacian edge boost)
    if (sharpness > 0.01 && outW > 2 && outH > 2) {
      const srcCopy = new Uint8ClampedArray(d);
      const k = sharpness * 0.45; // Edge amplification coefficient
      const w4 = outW * 4;

      for (let y = 1; y < outH - 1; y++) {
        const rowIdx = y * w4;
        for (let x = 1; x < outW - 1; x++) {
          const idx = rowIdx + (x * 4);
          for (let c = 0; c < 3; c++) {
            const center = srcCopy[idx + c];
            const up = srcCopy[idx - w4 + c];
            const down = srcCopy[idx + w4 + c];
            const left = srcCopy[idx - 4 + c];
            const right = srcCopy[idx + 4 + c];
            const laplacian = (center * 4) - up - down - left - right;
            const sharpVal = center + laplacian * k;
            d[idx + c] = sharpVal > 255 ? 255 : (sharpVal < 0 ? 0 : sharpVal);
          }
        }
      }
    }

    // 2. Precompute 256-entry lookup table for Exposure & Contrast tone curve
    // EV exposure: intensity multiplier = 2^exposure
    const expMultiplier = Math.pow(2.0, exposure);
    const lutTone = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      let v = i * expMultiplier;
      if (contrast !== 1.0) {
        // Photographic S-curve contrast centered at midpoint (0.5 / 128)
        // Taking slider to the right (>1.0) deepens shadows and boosts highlights (increases contrast)
        // Taking slider to the left (<1.0) pulls shadows and highlights toward mid-gray (decreases contrast)
        let norm = Math.min(1.0, Math.max(0.0, v / 255.0));
        if (norm <= 0.5) {
          norm = 0.5 * Math.pow(2.0 * norm, contrast);
        } else {
          norm = 1.0 - 0.5 * Math.pow(2.0 * (1.0 - norm), contrast);
        }
        v = norm * 255.0;
      }
      lutTone[i] = Math.min(255.0, Math.max(0.0, v));
    }

    // 3. Precompute 256-entry lookup table for the soft-knee Hermite AMOLED black crushing
    const invKneeRange = 1.0 / Math.max(tKneeWidth, 1e-4);
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

    let gradedBlackCount = 0;
    const hasSaturation = Math.abs(saturation - 1.0) > 0.01;

    // 4. In-place pixel processing loop
    for (let i = 0; i < len; i += 4) {
      // Apply Tone Curve (Exposure + Contrast)
      let r = lutTone[d[i]];
      let g = lutTone[d[i + 1]];
      let b = lutTone[d[i + 2]];

      // Apply Saturation if needed
      if (hasSaturation) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        r = lum + (r - lum) * saturation;
        g = lum + (g - lum) * saturation;
        b = lum + (b - lum) * saturation;
      }

      const lumInt = Math.min(255, Math.max(0, Math.round(0.299 * r + 0.587 * g + 0.114 * b)));
      let factor = lutFactor[lumInt];

      // Pinpoint star protection: if pixel has high saturation or intensity spike
      if (factor < 0.6 && starProtect > 0) {
        const maxCh = Math.max(r, g, b);
        const minCh = Math.min(r, g, b);
        const sat = maxCh > 0 ? (maxCh - minCh) / maxCh : 0;
        if (maxCh >= 45 && (maxCh >= 65 || sat >= 0.35)) {
          factor = Math.max(factor, starProtect * 0.7);
        }
      }

      if (factor <= 0.0) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        gradedBlackCount++;
      } else {
        d[i] = Math.min(255, Math.max(0, Math.round(r * factor)));
        d[i + 1] = Math.min(255, Math.max(0, Math.round(g * factor)));
        d[i + 2] = Math.min(255, Math.max(0, Math.round(b * factor)));
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
