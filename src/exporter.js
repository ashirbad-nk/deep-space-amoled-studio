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
   */
  static exportStandaloneHtml(options = {}) {
    const title = options.title || 'Deep Space AMOLED Wallpaper';
    const badge = options.badge || 'Deep Space AMOLED &bull; Cinematic Loop';
    const presetMode = options.presetMode || 'custom';
    const durationSec = options.durationSec || 180;
    const imageDataUri = options.imageDataUri;
    const customWaypointsJson = JSON.stringify(options.waypoints || []);
    const engineCode = options.engineCode;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }
    html, body {
      width: 100%; height: 100%; overflow: hidden;
      background-color: #000000; color: #f0f4f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #stage {
      position: relative; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: #000000;
    }
    #wallpaper-canvas { display: block; background: #000000; width: 100%; height: 100%; }
    .hud-overlay {
      position: absolute; top: 20px; left: 20px; right: 20px;
      display: flex; justify-content: space-between; align-items: flex-start;
      pointer-events: none; opacity: 0; transition: opacity 0.4s ease; z-index: 10;
    }
    .hud-overlay.visible { opacity: 1; }
    .hud-badge {
      background: rgba(12, 14, 20, 0.85); backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px;
      padding: 8px 16px; font-size: 13px; font-weight: 500;
      color: #00e5ff; display: flex; align-items: center; gap: 8px; pointer-events: auto;
    }
    .hud-badge .dot { width: 8px; height: 8px; background: #00e5ff; border-radius: 50%; box-shadow: 0 0 8px #00e5ff; }
    .hud-controls { display: flex; gap: 8px; pointer-events: auto; }
    button {
      background: rgba(12, 14, 20, 0.85); backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px;
      padding: 8px 14px; font-size: 12px; color: #f0f4f8; cursor: pointer; outline: none; transition: all 0.2s;
    }
    button:hover { border-color: #00e5ff; color: #00e5ff; }
    button.active { border-color: #ff007f; color: #ff007f; }
    #radar-canvas {
      position: absolute; bottom: 20px; right: 20px; width: 160px; height: 95px;
      background: rgba(8, 10, 15, 0.88); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px;
      backdrop-filter: blur(10px); pointer-events: auto; opacity: 0; transition: opacity 0.4s ease; z-index: 10;
    }
    #radar-canvas.visible { opacity: 1; }
    .telemetry {
      position: absolute; bottom: 20px; left: 20px; font-family: monospace; font-size: 11px;
      color: rgba(255, 255, 255, 0.6); opacity: 0; transition: opacity 0.4s ease; pointer-events: none;
      background: rgba(0, 0, 0, 0.6); padding: 4px 10px; border-radius: 6px;
    }
    .telemetry.visible { opacity: 1; }
  </style>
</head>
<body>
  <div id="stage">
    <canvas id="wallpaper-canvas"></canvas>
    <div class="hud-overlay" id="hud">
      <div class="hud-badge"><span class="dot"></span><span>${badge}</span></div>
      <div class="hud-controls">
        <button id="btn-pause">⏸ Pause</button>
        <button id="btn-radar">🧭 Radar</button>
        <button id="btn-amoled">🖤 AMOLED Check</button>
        <button id="btn-fs">⛶ Fullscreen</button>
      </div>
    </div>
    <canvas id="radar-canvas"></canvas>
    <div id="telemetry" class="telemetry">FPS: 60 | TIME: 00:00 / 03:00</div>
  </div>

  <script>
    ${engineCode}

    const EMBEDDED_IMAGE_DATA = "${imageDataUri}";
    const CUSTOM_WAYPOINTS = ${customWaypointsJson};

    (function() {
      const DURATION_SEC = ${durationSec};
      const canvas = document.getElementById('wallpaper-canvas');
      const ctx = canvas.getContext('2d');
      const radarCanvas = document.getElementById('radar-canvas');
      const radarCtx = radarCanvas.getContext('2d');
      const hud = document.getElementById('hud');
      const telemetry = document.getElementById('telemetry');

      const inspCanvas = document.createElement('canvas');
      const inspCtx = inspCanvas.getContext('2d');
      inspCanvas.width = 320; inspCanvas.height = 180;

      let cameraEngine = null;
      let activeImage = new Image();
      let isPlaying = true;
      let progress = 0.0;
      let lastTimestamp = 0;
      let showAmoled = false;
      let showRadar = false;
      let hudTimer = null;
      let frameCount = 0;
      let lastFpsTime = 0;
      let currentFps = 60;

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
        radarCanvas.width = 160; radarCanvas.height = 95;
      }

      function init() {
        resize();
        window.addEventListener('resize', resize);

        activeImage.onload = () => {
          cameraEngine = new CameraEngine(activeImage.naturalWidth, activeImage.naturalHeight, {
            mode: '${presetMode}',
            loopDurationSec: DURATION_SEC
          });
          if (CUSTOM_WAYPOINTS && CUSTOM_WAYPOINTS.length >= 4) {
            cameraEngine.setCustomWaypoints(CUSTOM_WAYPOINTS);
          }
          requestAnimationFrame(loop);
        };
        activeImage.src = EMBEDDED_IMAGE_DATA;

        const resetHud = () => {
          hud.classList.add('visible'); telemetry.classList.add('visible');
          if (showRadar) radarCanvas.classList.add('visible');
          clearTimeout(hudTimer);
          hudTimer = setTimeout(() => {
            hud.classList.remove('visible'); telemetry.classList.remove('visible'); radarCanvas.classList.remove('visible');
          }, 3000);
        };

        window.addEventListener('mousemove', resetHud);
        window.addEventListener('touchstart', resetHud);
        window.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON') resetHud(); });

        const btnPause = document.getElementById('btn-pause');
        btnPause.addEventListener('click', () => { isPlaying = !isPlaying; btnPause.textContent = isPlaying ? '⏸ Pause' : '▶ Play'; });

        const btnRadar = document.getElementById('btn-radar');
        btnRadar.addEventListener('click', () => { showRadar = !showRadar; radarCanvas.classList.toggle('visible', showRadar); btnRadar.classList.toggle('active', showRadar); });

        const btnAmoled = document.getElementById('btn-amoled');
        btnAmoled.addEventListener('click', () => { showAmoled = !showAmoled; btnAmoled.classList.toggle('active', showAmoled); });

        const btnFs = document.getElementById('btn-fs');
        btnFs.addEventListener('click', () => {
          if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
          else document.exitFullscreen().catch(()=>{});
        });

        window.addEventListener('keydown', (e) => {
          if (e.code === 'Space') btnPause.click();
          if (e.key === 'm' || e.key === 'M') btnRadar.click();
          if (e.key === 'b' || e.key === 'B') btnAmoled.click();
          if (e.key === 'f' || e.key === 'F') btnFs.click();
        });
      }

      function loop(timestamp) {
        try {
          if (!lastTimestamp) lastTimestamp = timestamp;
          const dt = (timestamp - lastTimestamp) / 1000;
          lastTimestamp = timestamp;

          frameCount++;
          if (timestamp - lastFpsTime >= 500) {
            currentFps = Math.round((frameCount * 1000) / (timestamp - lastFpsTime));
            frameCount = 0; lastFpsTime = timestamp;
          }

          if (isPlaying && DURATION_SEC > 0) {
            progress = (progress + (dt / DURATION_SEC)) % 1.0;
            const sec = Math.floor(progress * DURATION_SEC);
            const min = Math.floor(sec / 60); const remSec = sec % 60;
            telemetry.textContent = \`FPS: \${currentFps} | TIME: \${min.toString().padStart(2,'0')}:\${remSec.toString().padStart(2,'0')} / 03:00\` +
                                    (showAmoled ? ' | AMOLED INSPECTOR ON' : '');
          }

          render();
        } catch (err) {
          console.error("Frame loop error:", err);
        } finally {
          requestAnimationFrame(loop);
        }
      }

      function render() {
        if (!cameraEngine) return;
        const vw = canvas.width; const vh = canvas.height;
        const cam = cameraEngine.solveCamera(progress, vw, vh);
        const rect = cam.sourceRect;

        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, vw, vh);
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(activeImage, rect.x, rect.y, rect.w, rect.h, 0, 0, vw, vh);

        if (showAmoled) {
          try {
            inspCtx.drawImage(activeImage, cam.sourceRect.x, cam.sourceRect.y, cam.sourceRect.w, cam.sourceRect.h, 0, 0, 320, 180);
            const imgData = inspCtx.getImageData(0, 0, 320, 180);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              if (d[i] <= 3 && d[i+1] <= 3 && d[i+2] <= 3) {
                d[i] = 255; d[i+1] = 0; d[i+2] = 128; d[i+3] = 210;
              } else { d[i+3] = 0; }
            }
            inspCtx.putImageData(imgData, 0, 0);
            ctx.drawImage(inspCanvas, 0, 0, vw, vh);
          } catch (e) {}
        }

        if (showRadar) {
          const rw = radarCanvas.width; const rh = radarCanvas.height;
          radarCtx.fillStyle = '#06080c'; radarCtx.fillRect(0, 0, rw, rh);
          radarCtx.globalAlpha = 0.4; radarCtx.drawImage(activeImage, 0, 0, rw, rh); radarCtx.globalAlpha = 1.0;
          radarCtx.strokeStyle = 'rgba(0, 229, 255, 0.4)'; radarCtx.lineWidth = 1.5; radarCtx.beginPath();
          for (let i = 0; i <= 48; i++) {
            const pt = cameraEngine.samplePath(i / 48);
            const px = pt.x * rw; const py = pt.y * rh;
            if (i === 0) radarCtx.moveTo(px, py); else radarCtx.lineTo(px, py);
          }
          radarCtx.closePath(); radarCtx.stroke();
          const sx = rw / activeImage.naturalWidth; const sy = rh / activeImage.naturalHeight;
          radarCtx.strokeStyle = '#00e5ff'; radarCtx.lineWidth = 2;
          radarCtx.strokeRect(cam.sourceRect.x * sx, cam.sourceRect.y * sy, cam.sourceRect.w * sx, cam.sourceRect.h * sy);
        }
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
    onProgress = null,
    onFinish = null,
    onError = null
  }) {
    if (!canvas) throw new Error('No canvas provided for video export.');

    // 1. Calculate dimensions (Must be even for H.264 hardware encoders)
    let w = canvas.width || 1920;
    let h = canvas.height || 1080;
    
    // Cap dimensions to 1920x1080 for universal encoder compatibility across mobile & desktop
    const maxDim = 1920;
    if (Math.max(w, h) > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    const encW = w - (w % 2);
    const encH = h - (h % 2);

    // 2. Probe supported H.264 / AVC codec profiles
    const candidateCodecs = [
      'avc1.4d002a', // Main profile level 4.2
      'avc1.64002a', // High profile level 4.2
      'avc1.42001f', // Baseline profile level 3.1
      'avc1.42e01f'  // Constrained Baseline
    ];

    let chosenCodec = null;
    for (const c of candidateCodecs) {
      try {
        const support = await VideoEncoder.isConfigSupported({
          codec: c,
          width: encW,
          height: encH,
          bitrate: 16000000,
          framerate: 60
        });
        if (support && support.supported) {
          chosenCodec = c;
          break;
        }
      } catch (e) {}
    }

    if (!chosenCodec) {
      throw new Error('No supported H.264 codec found on this browser platform.');
    }

    console.log(`[Exporter] Selected H.264 codec: ${chosenCodec} (${encW}x${encH} @ 60 FPS)`);

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
      bitrate: 16000000, // 16 Mbps crystal clear
      framerate: 60
    });

    // 5. Dedicated offscreen canvas for crisp rendering at exact encoder dimensions
    const encCanvas = document.createElement('canvas');
    encCanvas.width = encW;
    encCanvas.height = encH;
    const encCtx = encCanvas.getContext('2d', { willReadFrequently: true });

    const totalFrames = Math.round(durationSec * 60);
    const stepPerFrame = (1.0 / loopDurationSec) * speedMultiplier * (1.0 / 60.0);

    // 6. Deterministic Render & Encode Loop
    for (let i = 0; i < totalFrames; i++) {
      if (encoderError) throw encoderError;

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

      // Yield every 6 frames to keep the browser responsive & update progress UI
      if (i % 6 === 0 || i === totalFrames - 1) {
        const pct = Math.min(100, ((i + 1) / totalFrames) * 100);
        const curSec = ((i + 1) / 60);
        if (onProgress) onProgress(pct, curSec, durationSec);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Flush encoder and finalize MP4 container
    await encoder.flush();
    muxer.finalize();

    const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
    const filename = `deep_space_amoled_loop_${durationSec}s.mp4`;
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
    onProgress = null,
    onFinish = null
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
      const filename = `deep_space_amoled_loop_${durationSec}s.${ext}`;
      this.downloadBlob(blob, filename);
      if (onFinish) onFinish(blob, filename);
    };

    const progressTimer = setInterval(() => {
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
