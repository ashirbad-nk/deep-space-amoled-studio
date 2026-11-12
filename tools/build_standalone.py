#!/usr/bin/env python3
"""
tools/build_standalone.py - Compiles 100% self-contained standalone wallpaper HTML files.

Zero external dependencies:
1. CameraEngine mathematical spline is embedded directly inline.
2. Graded 5K AMOLED deep space master image is embedded as a Base64 WebP Data URI.
3. CSS styles and UI logic are embedded inline.

This allows the files to work instantly in sandboxed environments like Hidamari (Flatpak),
Wallpaper Engine, Lively Wallpaper, or direct double-click file:// opening with NO web server.
"""

import os
import base64

def get_engine_code():
    with open("src/camera_engine.js", "r", encoding="utf-8") as f:
        code = f.read()
    # Remove module.exports for browser safety
    if "if (typeof module !== 'undefined'" in code:
        code = code.split("if (typeof module !== 'undefined'")[0]
    return code.strip()

def get_image_data_uri(image_path="images/graded/carina_cosmic_cliffs_amoled_5k.webp"):
    print(f"  Encoding {image_path} to Base64 Data URI...")
    with open(image_path, "rb") as f:
        raw_bytes = f.read()
    b64_str = base64.b64encode(raw_bytes).decode("ascii")
    data_uri = f"data:image/webp;base64,{b64_str}"
    print(f"  Data URI size: {len(data_uri)/(1024*1024):.2f} MB")
    return data_uri

def generate_template(title, badge_label, preset_mode, engine_code, data_uri):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#000000">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>{title}</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }}
    html, body {{
      width: 100%; height: 100%; overflow: hidden;
      background-color: #000000; color: #f0f4f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }}
    #stage {{
      position: relative; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: #000000;
    }}
    #wallpaper-canvas {{
      display: block; background: #000000;
      width: 100%; height: 100%;
    }}
    /* Auto-hiding Minimal HUD */
    .hud-overlay {{
      position: absolute; top: 20px; left: 20px; right: 20px;
      display: flex; justify-content: space-between; align-items: flex-start;
      pointer-events: none; opacity: 0; transition: opacity 0.4s ease;
      z-index: 10;
    }}
    .hud-overlay.visible {{ opacity: 1; }}
    .hud-badge {{
      background: rgba(12, 14, 20, 0.85); backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px;
      padding: 8px 16px; font-size: 13px; font-weight: 500;
      color: #00e5ff; display: flex; align-items: center; gap: 8px;
      pointer-events: auto;
    }}
    .hud-badge .dot {{
      width: 8px; height: 8px; background: #00e5ff; border-radius: 50%;
      box-shadow: 0 0 8px #00e5ff;
    }}
    .hud-controls {{
      display: flex; gap: 8px; pointer-events: auto;
    }}
    button {{
      background: rgba(12, 14, 20, 0.85); backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px;
      padding: 8px 14px; font-size: 12px; color: #f0f4f8; cursor: pointer;
      outline: none; transition: all 0.2s;
    }}
    button:hover {{ border-color: #00e5ff; color: #00e5ff; }}
    button.active {{ border-color: #ff007f; color: #ff007f; }}
    /* Mini Radar */
    #radar-canvas {{
      position: absolute; bottom: 20px; right: 20px;
      width: 160px; height: 95px; background: rgba(8, 10, 15, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px;
      backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
      pointer-events: auto; opacity: 0; transition: opacity 0.4s ease; z-index: 10;
    }}
    #radar-canvas.visible {{ opacity: 1; }}
    .telemetry {{
      position: absolute; bottom: 20px; left: 20px;
      font-family: monospace; font-size: 11px; color: rgba(255, 255, 255, 0.6);
      opacity: 0; transition: opacity 0.4s ease; pointer-events: none;
      background: rgba(0, 0, 0, 0.6); padding: 4px 10px; border-radius: 6px;
    }}
    .telemetry.visible {{ opacity: 1; }}
  </style>
</head>
<body>
  <div id="stage">
    <canvas id="wallpaper-canvas"></canvas>

    <div class="hud-overlay" id="hud">
      <div class="hud-badge">
        <span class="dot"></span>
        <span>{badge_label}</span>
      </div>
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
    // --- 1. Mathematical Spline Engine (Embedded Inline) ---
    {engine_code}

    // --- 2. Embedded Master Astronomical Image (Base64 WebP) ---
    const EMBEDDED_IMAGE_DATA = "{data_uri}";

    // --- 3. Hardware-Accelerated 60 FPS Wallpaper Controller ---
    (function() {{
      const DURATION_SEC = 180; // 3-minute seamless loop
      const canvas = document.getElementById('wallpaper-canvas');
      const ctx = canvas.getContext('2d');
      const radarCanvas = document.getElementById('radar-canvas');
      const radarCtx = radarCanvas.getContext('2d');
      const hud = document.getElementById('hud');
      const telemetry = document.getElementById('telemetry');

      // Fast, lightweight 320x180 inspector canvas (< 0.5ms execution)
      const inspCanvas = document.createElement('canvas');
      const inspCtx = inspCanvas.getContext('2d');
      inspCanvas.width = 320;
      inspCanvas.height = 180;

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

      function resize() {{
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
        radarCanvas.width = 160;
        radarCanvas.height = 95;
      }}

      function init() {{
        resize();
        window.addEventListener('resize', resize);

        activeImage.onload = () => {{
          cameraEngine = new CameraEngine(activeImage.naturalWidth, activeImage.naturalHeight, {{
            mode: '{preset_mode}',
            loopDurationSec: DURATION_SEC
          }});
          requestAnimationFrame(loop);
        }};
        activeImage.src = EMBEDDED_IMAGE_DATA;

        // Auto-hiding HUD on mouse move or touch
        const resetHud = () => {{
          hud.classList.add('visible');
          telemetry.classList.add('visible');
          if (showRadar) radarCanvas.classList.add('visible');
          clearTimeout(hudTimer);
          hudTimer = setTimeout(() => {{
            hud.classList.remove('visible');
            telemetry.classList.remove('visible');
            radarCanvas.classList.remove('visible');
          }}, 3000);
        }};

        window.addEventListener('mousemove', resetHud);
        window.addEventListener('touchstart', resetHud);
        window.addEventListener('click', (e) => {{
          if (e.target.tagName !== 'BUTTON') resetHud();
        }});

        // Controls
        const btnPause = document.getElementById('btn-pause');
        btnPause.addEventListener('click', () => {{
          isPlaying = !isPlaying;
          btnPause.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
        }});

        const btnRadar = document.getElementById('btn-radar');
        btnRadar.addEventListener('click', () => {{
          showRadar = !showRadar;
          radarCanvas.classList.toggle('visible', showRadar);
          btnRadar.classList.toggle('active', showRadar);
        }});

        const btnAmoled = document.getElementById('btn-amoled');
        btnAmoled.addEventListener('click', () => {{
          showAmoled = !showAmoled;
          btnAmoled.classList.toggle('active', showAmoled);
        }});

        const btnFs = document.getElementById('btn-fs');
        btnFs.addEventListener('click', () => {{
          if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{{}});
          else document.exitFullscreen().catch(()=>{{}});
        }});

        window.addEventListener('keydown', (e) => {{
          if (e.code === 'Space') btnPause.click();
          if (e.key === 'm' || e.key === 'M') btnRadar.click();
          if (e.key === 'b' || e.key === 'B') btnAmoled.click();
          if (e.key === 'f' || e.key === 'F') btnFs.click();
        }});
      }}

      // Bulletproof loop: requestAnimationFrame in finally block guarantees zero freezes
      function loop(timestamp) {{
        try {{
          if (!lastTimestamp) lastTimestamp = timestamp;
          const dt = (timestamp - lastTimestamp) / 1000;
          lastTimestamp = timestamp;

          frameCount++;
          if (timestamp - lastFpsTime >= 500) {{
            currentFps = Math.round((frameCount * 1000) / (timestamp - lastFpsTime));
            frameCount = 0;
            lastFpsTime = timestamp;
          }}

          if (isPlaying && DURATION_SEC > 0) {{
            progress = (progress + (dt / DURATION_SEC)) % 1.0;
            const sec = Math.floor(progress * DURATION_SEC);
            const min = Math.floor(sec / 60);
            const remSec = sec % 60;
            telemetry.textContent = `FPS: ${{currentFps}} | TIME: ${{min.toString().padStart(2,'0')}}:${{remSec.toString().padStart(2,'0')}} / 03:00` +
                                    (showAmoled ? ' | AMOLED INSPECTOR ON' : '');
          }}

          render();
        }} catch (err) {{
          console.error("Frame loop error:", err);
        }} finally {{
          requestAnimationFrame(loop);
        }}
      }}

      function render() {{
        if (!cameraEngine) return;
        const vw = canvas.width;
        const vh = canvas.height;

        const cam = cameraEngine.solveCamera(progress, vw, vh);
        const rect = cam.sourceRect;

        // Clear to pure OLED #000000
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, vw, vh);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image slice
        ctx.drawImage(activeImage, rect.x, rect.y, rect.w, rect.h, 0, 0, vw, vh);

        // AMOLED Inspector Overlay
        if (showAmoled) {{
          applyAmoledInspector(cam, vw, vh);
        }}

        if (showRadar) {{
          renderRadar(cam);
        }}
      }}

      function applyAmoledInspector(cam, vw, vh) {{
        try {{
          inspCtx.drawImage(activeImage, cam.sourceRect.x, cam.sourceRect.y, cam.sourceRect.w, cam.sourceRect.h, 0, 0, 320, 180);
          const imgData = inspCtx.getImageData(0, 0, 320, 180);
          const d = imgData.data;
          const len = d.length;

          for (let i = 0; i < len; i += 4) {{
            if (d[i] <= 3 && d[i+1] <= 3 && d[i+2] <= 3) {{
              d[i] = 255; d[i+1] = 0; d[i+2] = 128; d[i+3] = 210;
            }} else {{
              d[i+3] = 0;
            }}
          }}
          inspCtx.putImageData(imgData, 0, 0);
          ctx.drawImage(inspCanvas, 0, 0, vw, vh);
        }} catch (e) {{
          // Data URIs are same-origin by spec, so getImageData never throws CORS errors!
        }}
      }}

      function renderRadar(cam) {{
        const rw = radarCanvas.width;
        const rh = radarCanvas.height;
        radarCtx.fillStyle = '#06080c';
        radarCtx.fillRect(0, 0, rw, rh);
        radarCtx.globalAlpha = 0.4;
        radarCtx.drawImage(activeImage, 0, 0, rw, rh);
        radarCtx.globalAlpha = 1.0;

        // Spline path
        radarCtx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        radarCtx.lineWidth = 1.5;
        radarCtx.beginPath();
        for (let i = 0; i <= 48; i++) {{
          const pt = cameraEngine.samplePath(i / 48);
          const px = pt.x * rw;
          const py = pt.y * rh;
          if (i === 0) radarCtx.moveTo(px, py);
          else radarCtx.lineTo(px, py);
        }}
        radarCtx.closePath();
        radarCtx.stroke();

        // Frustum Box
        const sx = rw / activeImage.naturalWidth;
        const sy = rh / activeImage.naturalHeight;
        radarCtx.strokeStyle = '#00e5ff';
        radarCtx.lineWidth = 2;
        radarCtx.strokeRect(cam.sourceRect.x * sx, cam.sourceRect.y * sy, cam.sourceRect.w * sx, cam.sourceRect.h * sy);
      }}

      init();
    }})();
  </script>
</body>
</html>"""

def main():
    print("[build_standalone] Compiling 100% self-contained wallpaper files...")
    engine_code = get_engine_code()
    data_uri = get_image_data_uri()

    targets = [
        ("output/wallpaper_pc_1080p_16x9.html", "16:9 PC Desktop 1080p (1920x1080)", "16:9 PC 1080p &bull; Carina Cosmic Cliffs (JWST)", "odyssey"),
        ("output/wallpaper_phone_2k_9x20.html", "9:20 Phone Screen 2K (1440x3200)", "9:20 Phone 2K &bull; Carina Cosmic Cliffs (JWST)", "odyssey"),
        ("output/wallpaper_desktop_4k_16x9.html", "16:9 4K UHD Desktop (3840x2160)", "16:9 4K UHD &bull; Carina Cosmic Cliffs (JWST)", "odyssey"),
    ]

    for filepath, title, badge, mode in targets:
        html = generate_template(title, badge, mode, engine_code, data_uri)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"  Generated {filepath} ({os.path.getsize(filepath)/(1024*1024):.2f} MB, 100% standalone)")

    print("\n[build_standalone] All standalone HTML files successfully compiled!\n")

if __name__ == "__main__":
    main()
