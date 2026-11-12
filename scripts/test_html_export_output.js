const fs = require('fs');
const { CameraEngine } = require('../src/camera_engine.js');

const engineCode = CameraEngine.toString();
const title = 'Test Wallpaper';
const presetMode = 'odyssey';
const durationSec = 180;
const imageDataUri = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/M16-29-06-2025-Luc_Viatour.jpg/960px-M16-29-06-2025-Luc_Viatour.jpg';
const customWaypointsJson = JSON.stringify([]);

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background-color: #000000; }
    #wallpaper-canvas { display: block; width: 100%; height: 100%; background: #000000; }
  </style>
</head>
<body>
  <canvas id="wallpaper-canvas"></canvas>
  <script>
    ${engineCode}
    const EMBEDDED_IMAGE_DATA = "${imageDataUri}";
    const CUSTOM_WAYPOINTS = ${customWaypointsJson};

    (function() {
      const DURATION_SEC = ${durationSec};
      const canvas = document.getElementById('wallpaper-canvas');
      const ctx = canvas.getContext('2d');
      let cameraEngine = null;
      let activeImage = new Image();
      let isPlaying = true;
      let progress = 0.0;
      let lastTimestamp = 0;

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
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
        activeImage.onerror = (e) => {
          console.error("Image failed to load:", e);
        };
        activeImage.src = EMBEDDED_IMAGE_DATA;
      }

      function loop(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const dt = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;
        if (isPlaying && DURATION_SEC > 0) {
          progress = (progress + (dt / DURATION_SEC)) % 1.0;
        }
        render();
        requestAnimationFrame(loop);
      }

      function render() {
        if (!cameraEngine) return;
        const vw = canvas.width;
        const vh = canvas.height;
        const cam = cameraEngine.solveCamera(progress, vw, vh);
        const rect = cam.sourceRect;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, vw, vh);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(activeImage, rect.x, rect.y, rect.w, rect.h, 0, 0, vw, vh);
      }

      init();
    })();
  </script>
</body>
</html>`;

fs.writeFileSync('temp_test.html', htmlContent, 'utf8');
console.log('Generated temp_test.html, size:', htmlContent.length);
