/**
 * src/exporter.js - Client-Side Standalone HTML & MP4/WebM Video Exporter
 *
 * Runs 100% client-side with zero backend server:
 * 1. Exports standalone, single-file HTML wallpapers (with embedded Base64 image & spline).
 * 2. Records and exports high-definition MP4/WebM videos via canvas.captureStream() & MediaRecorder.
 */

class Exporter {
  /**
   * Triggers a browser download for a Blob
   */
  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  }

  /**
   * Generates a 100% self-contained standalone HTML wallpaper file.
   * Completely free of any labelling, badges, HUDs, or annotations — just the pristine looping image.
   */
  static exportStandaloneHtml(options = {}) {
    const title = options.title || 'Deep Space AMOLED Wallpaper';
    const presetMode = options.presetMode || 'custom';
    const durationSec = options.durationSec || 180;
    const speedMultiplier = (typeof options.speedMultiplier === 'number' && options.speedMultiplier > 0) ? options.speedMultiplier : 1.0;
    const imageDataUri = options.imageDataUri;
    const customWaypointsJson = JSON.stringify(options.waypoints || []);
    const engineCode = options.engineCode;
    const recipe = options.recipe || {
      generator: 'Deep Space AMOLED Wallpaper Studio',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      presetMode,
      durationSec,
      speedMultiplier
    };
    const recipeJson = JSON.stringify(recipe, null, 2);

    if (!imageDataUri) {
      throw new Error("Exporter Error: imageDataUri is required.");
    }
    if (imageDataUri.startsWith('blob:')) {
      throw new Error("Exporter Error: Cannot embed session blob: URL into standalone HTML. A self-contained Data URI or reachable URL is required.");
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>${title}</title>

  <!-- 
  =============================================================================
  DEEP SPACE AMOLED WALLPAPER STUDIO - RECIPE MANIFEST
  =============================================================================
  Generated with client-side GPU acceleration. Contains full photographic
  recipe, master source metadata, tone curves, and spline kinematics.
  -->
  <script id="amoled-wallpaper-recipe" type="application/json">
${recipeJson}
  </script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }
    html, body {
      width: 100%; height: 100%; overflow: hidden;
      background-color: #000000;
    }
    #wallpaper-canvas {
      display: block; width: 100%; height: 100%;
      background: #000000;
    }
  </style>
</head>
<body>
  <canvas id="wallpaper-canvas"></canvas>

  <script>
    ${engineCode}

    const EMBEDDED_IMAGE_DATA = "${imageDataUri}";
    const CUSTOM_WAYPOINTS = ${customWaypointsJson};
    const WALLPAPER_RECIPE = ${recipeJson};
    window.WALLPAPER_RECIPE = WALLPAPER_RECIPE;

    (function() {
      const DURATION_SEC = ${durationSec};
      const SPEED_MULTIPLIER = ${speedMultiplier};
      const canvas = document.getElementById('wallpaper-canvas');
      const ctx = canvas.getContext('2d');

      let cameraEngine = null;
      let activeImage = new Image();
      let drawSource = null;
      let isPlaying = true;
      let progress = 0.0;
      let lastTimestamp = 0;

      function resize() {
        // Cap DPR at 1.25 for desktop wallpaper playback to prevent fill-rate saturation on 4K/HiDPI screens
        const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
      }

      function init() {
        resize();
        window.addEventListener('resize', resize);

        function onImageReady() {
          if (cameraEngine) return;
          drawSource = activeImage;
          // Asynchronously promote texture to GPU VRAM ImageBitmap if supported (eliminates WebKitGTK CPU texture swizzling)
          if (typeof createImageBitmap !== 'undefined') {
            createImageBitmap(activeImage).then(bmp => {
              drawSource = bmp;
            }).catch(() => {});
          }

          cameraEngine = new CameraEngine(activeImage.naturalWidth, activeImage.naturalHeight, {
            mode: '${presetMode}',
            loopDurationSec: DURATION_SEC
          });
          if (CUSTOM_WAYPOINTS && CUSTOM_WAYPOINTS.length >= 4) {
            cameraEngine.setCustomWaypoints(CUSTOM_WAYPOINTS);
          }
          requestAnimationFrame(loop);
        }

        activeImage.onload = onImageReady;
        activeImage.onerror = (err) => {
          console.error("Failed to load embedded wallpaper image:", err);
          ctx.fillStyle = '#050508';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ff5577';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Wallpaper Error: Unable to load embedded image.', canvas.width / 2, canvas.height / 2 - 10);
          ctx.font = '12px monospace';
          ctx.fillStyle = '#888899';
          ctx.fillText('The embedded image data may be corrupted or invalid.', canvas.width / 2, canvas.height / 2 + 15);
        };

        if (EMBEDDED_IMAGE_DATA.startsWith('blob:')) {
          activeImage.onerror(new Error('Session blob URLs cannot be used in standalone files.'));
          return;
        }

        activeImage.src = EMBEDDED_IMAGE_DATA;
        if (activeImage.complete && activeImage.naturalWidth > 0) {
          onImageReady();
        }

        // Silent hotkeys: Spacebar to toggle play/pause, Double-click or F for Fullscreen, I to log recipe
        window.addEventListener('keydown', (e) => {
          if (e.code === 'Space') isPlaying = !isPlaying;
          if (e.key === 'f' || e.key === 'F') toggleFs();
          if (e.key === 'i' || e.key === 'I') console.log('[Wallpaper Recipe]', WALLPAPER_RECIPE);
        });
        window.addEventListener('dblclick', toggleFs);
      }

      function toggleFs() {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }

      function loop(timestamp) {
        try {
          if (!lastTimestamp) lastTimestamp = timestamp;
          // Clamp dt to a maximum of 50ms to eliminate stutter jumps when compositor deprioritizes background windows
          const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
          lastTimestamp = timestamp;

          if (isPlaying && DURATION_SEC > 0) {
            progress = (progress + ((dt / DURATION_SEC) * SPEED_MULTIPLIER)) % 1.0;
            if (progress < 0) progress += 1.0;
          }

          render();
        } catch (err) {
          console.error("Frame loop error:", err);
        } finally {
          requestAnimationFrame(loop);
        }
      }

      function render() {
        if (!cameraEngine || !drawSource) return;
        const vw = canvas.width;
        const vh = canvas.height;
        const cam = cameraEngine.solveCamera(progress, vw, vh);
        const rect = cam.sourceRect;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, vw, vh);
        ctx.imageSmoothingEnabled = true;
        // Use 'medium' (hardware bilinear filtering) instead of 'high' (bicubic CPU filtering) for rock-solid 60 FPS in WebKitGTK
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(drawSource, rect.x, rect.y, rect.w, rect.h, 0, 0, vw, vh);
      }

      init();
    })();
  <\/script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const filename = options.filename || 'wallpaper_standalone.html';
    this.downloadBlob(blob, filename);
  }

  /**
   * Primary Entry Point: Records canvas animation to MP4 or WebM video.
   * Supports deterministic WebCodecs H.264 MP4 muxing and real-time MediaRecorder fallback.
   */
  static async recordVideo(optionsOrCanvas, recordSeconds = 30, onProgress = null, onFinish = null) {
    let opts = {};
    if (optionsOrCanvas instanceof HTMLCanvasElement) {
      opts = {
        canvas: optionsOrCanvas,
        durationSec: recordSeconds,
        onProgress: onProgress,
        onFinish: onFinish,
        format: 'mp4'
      };
    } else {
      opts = Object.assign({}, optionsOrCanvas);
    }

    const format = (opts.format || 'mp4').toLowerCase();
    const canUseWebCodecs = (
      typeof VideoEncoder !== 'undefined' &&
      typeof VideoFrame !== 'undefined' &&
      typeof Mp4Muxer !== 'undefined'
    );

    // If MP4 requested and WebCodecs available, use deterministic H.264 MP4 encoder
    if (format === 'mp4' && canUseWebCodecs) {
      try {
        console.log('[Exporter] Initiating WebCodecs H.264 MP4 export...');
        return await this.recordVideoWithWebCodecs(opts);
      } catch (err) {
        console.warn('[Exporter] WebCodecs MP4 encoding failed, falling back to MediaRecorder:', err);
      }
    }

    // MediaRecorder fallback (WebM or native MP4 if supported)
    console.log('[Exporter] Initiating MediaRecorder stream capture...');
    return this.recordVideoWithMediaRecorder(opts);
  }

  /**
   * Resolves target video dimensions & bitrate based on preset quality or canvas size.
   * Covers all mainstream smartphone portrait aspect ratios and monitor landscape aspect ratios.
   */
  static resolveVideoDimensions(qualityKey = '1080p_fhd', canvasWidth = 1920, canvasHeight = 1080) {
    const MAP = {
      // Landscape Displays & Monitors
      '4k_uhd': { w: 3840, h: 2160, bitrate: 28000000, label: '4K UHD (3840×2160)' },
      '1440p_qhd': { w: 2560, h: 1440, bitrate: 16000000, label: '1440p QHD (2560×1440)' },
      '1440p': { w: 2560, h: 1440, bitrate: 16000000, label: '1440p QHD (2560×1440)' },
      '1080p_fhd': { w: 1920, h: 1080, bitrate: 9000000, label: '1080p FHD (1920×1080)' },
      '1080p': { w: 1920, h: 1080, bitrate: 9000000, label: '1080p FHD (1920×1080)' },
      '720p_hd': { w: 1280, h: 720, bitrate: 4500000, label: '720p HD (1280×720)' },
      '720p': { w: 1280, h: 720, bitrate: 4500000, label: '720p HD (1280×720)' },
      'macbook_16_10': { w: 2560, h: 1600, bitrate: 16000000, label: 'MacBook Retina (2560×1600)' },
      'ultrawide_fhd': { w: 2560, h: 1080, bitrate: 14000000, label: 'Ultrawide 21:9 (2560×1080)' },
      'ultrawide_qhd': { w: 3440, h: 1440, bitrate: 22000000, label: 'Ultrawide QHD (3440×1440)' },

      // Portrait Mobile Devices & Smartphones
      'iphone_pro_max': { w: 1290, h: 2796, bitrate: 14000000, label: 'iPhone Pro Max (1290×2796)' },
      'iphone_pro': { w: 1178, h: 2556, bitrate: 12000000, label: 'iPhone Pro (1178×2556)' },
      'galaxy_ultra': { w: 1440, h: 3120, bitrate: 18000000, label: 'Galaxy Ultra (1440×3120)' },
      'android_19_5_9': { w: 1080, h: 2340, bitrate: 10000000, label: 'Modern Android FHD+ (1080×2340)' },
      'android_tall_20_9': { w: 1080, h: 2400, bitrate: 10000000, label: 'Tall Android 20:9 (1080×2400)' },
      'mobile_fhd_9_16': { w: 1080, h: 1920, bitrate: 9000000, label: 'Classic Mobile 9:16 (1080×1920)' },
      'mobile_hd_9_16': { w: 720, h: 1280, bitrate: 4500000, label: 'Fast Mobile 9:16 (720×1280)' }
    };

    if (MAP[qualityKey]) {
      const entry = MAP[qualityKey];
      return {
        width: entry.w - (entry.w % 2),
        height: entry.h - (entry.h % 2),
        bitrate: entry.bitrate,
        label: entry.label
      };
    }

    // Default or 'current_canvas': match active canvas aspect ratio & dimensions
    let w = canvasWidth || 1920;
    let h = canvasHeight || 1080;
    const encW = w - (w % 2);
    const encH = h - (h % 2);
    const totalPixels = encW * encH;
    const estBitrate = Math.max(4000000, Math.min(28000000, Math.round(totalPixels * 4.5)));
    return {
      width: encW,
      height: encH,
      bitrate: estBitrate,
      label: `${encW}×${encH} (Canvas)`
    };
  }

  /**
   * Deterministic Frame-by-Frame WebCodecs H.264 MP4 Encoder with Mp4Muxer.
   * Guarantees zero dropped frames, zero stutter, and universal .mp4 output.
   */
  static async recordVideoWithWebCodecs({
    canvas,
    renderFrameFn,
    durationSec = 30,
    loopDurationSec = 180,
    speedMultiplier = 1.0,
    startProgress = 0,
    quality = '1080p_fhd',
    checkAbort = null,
    onProgress = null,
    onFinish = null,
    onError = null
  }) {
    if (!canvas) throw new Error('No canvas provided for video export.');

    // 1. Calculate dimensions & target bitrate based on selected quality
    const resolved = this.resolveVideoDimensions(quality, canvas.width, canvas.height);
    let encW = resolved.width;
    let encH = resolved.height;
    let targetBitrate = resolved.bitrate;

    // 2. Probe supported H.264 / AVC codec profiles
    const candidateCodecs = [
      'avc1.640033', // High Profile Level 5.1 (supports 4K UHD @ 60 FPS, 3840x2160, 1440x3120)
      'avc1.640034', // High Profile Level 5.2
      'avc1.64002a', // High Profile Level 4.2 (1080p @ 60 FPS)
      'avc1.4d002a', // Main Profile Level 4.2
      'avc1.42001f', // Baseline Profile Level 3.1
      'avc1.42e01f'  // Constrained Baseline
    ];

    async function probeCodecs(w, h, br) {
      for (const c of candidateCodecs) {
        try {
          const support = await VideoEncoder.isConfigSupported({
            codec: c,
            width: w,
            height: h,
            bitrate: br,
            framerate: 60
          });
          if (support && support.supported) {
            return c;
          }
        } catch (e) {}
      }
      return null;
    }

    let chosenCodec = await probeCodecs(encW, encH, targetBitrate);

    // If device GPU hardware encoder does not support high resolution (e.g. 4K or ultra-tall),
    // step down gracefully to 1080p-tier while strictly preserving the chosen aspect ratio!
    if (!chosenCodec && (encW > 1920 || encH > 1920)) {
      console.warn(`[Exporter] Device encoder does not support ${encW}x${encH} at 60 FPS. Stepping down to 1080p-tier with identical aspect ratio...`);
      const scale = 1920 / Math.max(encW, encH);
      encW = Math.round(encW * scale);
      encH = Math.round(encH * scale);
      encW -= (encW % 2);
      encH -= (encH % 2);
      targetBitrate = Math.min(targetBitrate, 10000000);
      chosenCodec = await probeCodecs(encW, encH, targetBitrate);
    }

    if (!chosenCodec) {
      // Final attempt at standard 720p scaling
      const scale = 1280 / Math.max(encW, encH);
      encW = Math.round(encW * scale);
      encH = Math.round(encH * scale);
      encW -= (encW % 2);
      encH -= (encH % 2);
      targetBitrate = Math.min(targetBitrate, 5000000);
      chosenCodec = await probeCodecs(encW, encH, targetBitrate);
    }

    if (!chosenCodec) {
      throw new Error('No supported H.264 codec found on this browser platform.');
    }

    console.log(`[Exporter] Selected H.264 codec: ${chosenCodec} (${encW}x${encH} @ ${(targetBitrate/1000000).toFixed(1)} Mbps, 60 FPS) [${resolved.label}]`);

    // 3. Initialize MP4 Muxer (in-memory fast start for instant playback)
    const muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width: encW,
        height: encH
      },
      fastStart: 'in-memory'
    });

    // 4. Initialize VideoEncoder
    let encoderError = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => {
        console.error('[Exporter] VideoEncoder fatal error:', e);
        encoderError = e;
      }
    });

    await encoder.configure({
      codec: chosenCodec,
      width: encW,
      height: encH,
      bitrate: targetBitrate,
      framerate: 60
    });

    // 5. Dedicated offscreen canvas for crisp rendering at exact encoder dimensions (GPU hardware accelerated)
    const encCanvas = document.createElement('canvas');
    encCanvas.width = encW;
    encCanvas.height = encH;
    const encCtx = encCanvas.getContext('2d');

    const totalFrames = Math.round(durationSec * 60);
    const stepPerFrame = (1.0 / loopDurationSec) * speedMultiplier * (1.0 / 60.0);

    // 6. Deterministic Render & Encode Loop with Memory Backpressure Flow Control
    for (let i = 0; i < totalFrames; i++) {
      if (checkAbort && checkAbort()) {
        try { encoder.close(); } catch (e) {}
        throw new Error('Recording cancelled by user.');
      }
      if (encoderError) throw encoderError;

      // CRITICAL BACKPRESSURE CONTROL:
      // When encoding long loops (e.g. 180s = 10,800 frames), queueing frames faster than the hardware
      // encoder can process exhausts all RAM and freezes the OS. We pause JS if queue exceeds 4 frames.
      while (encoder.encodeQueueSize > 4) {
        if (checkAbort && checkAbort()) {
          try { encoder.close(); } catch (e) {}
          throw new Error('Recording cancelled by user.');
        }
        await new Promise(resolve => setTimeout(resolve, 8));
      }

      const frameProgress = (startProgress + i * stepPerFrame) % 1.0;

      // Render camera position deterministically
      if (typeof renderFrameFn === 'function') {
        renderFrameFn(frameProgress, encCanvas, encCtx);
      } else {
        encCtx.drawImage(canvas, 0, 0, encW, encH);
      }

      // Encode VideoFrame with 60 FPS microsecond timestamps
      const timestampUs = Math.round((i * 1000000) / 60);
      const isKeyFrame = (i % 60 === 0);
      const videoFrame = new VideoFrame(encCanvas, { timestamp: timestampUs });
      encoder.encode(videoFrame, { keyFrame: isKeyFrame });
      videoFrame.close();

      // Yield to browser event loop every 4 frames so UI, cancellation, and OS stay 100% responsive
      if (i % 4 === 0 || i === totalFrames - 1) {
        const pct = Math.min(100, ((i + 1) / totalFrames) * 100);
        const curSec = ((i + 1) / 60);
        if (onProgress) onProgress(pct, curSec, durationSec);
        await new Promise(resolve => setTimeout(resolve, 2));
      }
    }

    // Flush encoder and finalize MP4 container
    await encoder.flush();
    muxer.finalize();

    const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
    const defaultFilename = `deep_space_amoled_loop_${encW}x${encH}_${durationSec}s.mp4`;
    const filename = options.filename ? (options.filename.endsWith('.mp4') ? options.filename : `${options.filename}.mp4`) : defaultFilename;
    this.downloadBlob(blob, filename);

    if (onFinish) onFinish(blob, filename);
    return { blob, filename };
  }

  /**
   * Real-Time Stream Capture via MediaRecorder (WebM fallback)
   */
  static recordVideoWithMediaRecorder({
    canvas,
    durationSec = 30,
    format = 'webm',
    checkAbort = null,
    onProgress = null,
    onFinish = null,
    onError = null,
    filename = null
  }) {
    if (!canvas) return;

    let mimeType = 'video/webm;codecs=vp9';
    let ext = 'webm';

    if (format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
      mimeType = 'video/mp4;codecs=avc1';
      ext = 'mp4';
    } else if (format === 'mp4' && MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
      ext = 'mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
      ext = 'webm';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      mimeType = 'video/webm;codecs=vp8';
      ext = 'webm';
    } else {
      mimeType = 'video/webm';
      ext = 'webm';
    }

    console.log(`[Exporter] MediaRecorder fallback starting: ${mimeType} for ${durationSec}s at 60 FPS`);

    const stream = canvas.captureStream(60);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 25000000 // 25 Mbps high quality
    });

    const chunks = [];
    const startTime = performance.now();
    const durationMs = durationSec * 1000;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      console.log(`[Exporter] MediaRecorder finished. Total chunks: ${chunks.length}`);
      const blob = new Blob(chunks, { type: mimeType });
      const defaultFilename = `deep_space_amoled_loop_${canvas.width}x${canvas.height}_${durationSec}s.${ext}`;
      const finalName = filename ? (filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`) : defaultFilename;
      this.downloadBlob(blob, finalName);
      if (onFinish) onFinish(blob, finalName);
    };

    const progressTimer = setInterval(() => {
      if (checkAbort && checkAbort()) {
        clearInterval(progressTimer);
        try { recorder.stop(); } catch (e) {}
        if (onError) onError(new Error('Recording cancelled by user.'));
        return;
      }
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      if (onProgress) onProgress(pct, elapsed / 1000, durationSec);
      if (elapsed >= durationMs) {
        clearInterval(progressTimer);
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }
    }, 100);

    recorder.start(500);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Exporter };
}
