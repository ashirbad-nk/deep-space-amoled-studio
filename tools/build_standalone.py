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
      background-color: #000000; color: #ffffff;
      cursor: none;
    }}
    #stage {{
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: #000000;
    }}
    #wallpaper-canvas {{
      display: block; width: 100%; height: 100%;
      background: #000000;
    }}
  </style>
</head>
<body>
  <div id="stage">
    <canvas id="wallpaper-canvas"></canvas>
  </div>

  <script>
    // --- 1. Mathematical Spline Engine (Embedded Inline) ---
    {engine_code}

    // --- 2. Embedded Master Astronomical Image (Base64 WebP) ---
    const EMBEDDED_IMAGE_DATA = "{data_uri}";

    // --- 3. Hardware-Accelerated 60 FPS Wallpaper Controller (Clean & Zero-Label) ---
    (function() {{
      const DURATION_SEC = 180; // 3-minute seamless loop
      const canvas = document.getElementById('wallpaper-canvas');
      const ctx = canvas.getContext('2d');

      let cameraEngine = null;
      let activeImage = new Image();
      let isPlaying = true;
      let progress = 0.0;
      let lastTimestamp = 0;

      function resize() {{
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(window.innerWidth * dpr);
        canvas.height = Math.round(window.innerHeight * dpr);
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

        // Silent hotkeys: Space to pause/resume, Double-click or F for fullscreen
        window.addEventListener('keydown', (e) => {{
          if (e.code === 'Space') isPlaying = !isPlaying;
          if (e.key === 'f' || e.key === 'F') toggleFs();
        }});
        window.addEventListener('dblclick', toggleFs);
      }}

      function toggleFs() {{
        if (!document.fullscreenElement) {{
          document.documentElement.requestFullscreen().catch(() => {{}});
        }} else {{
          document.exitFullscreen().catch(() => {{}});
        }}
      }}

      function loop(timestamp) {{
        try {{
          if (!lastTimestamp) lastTimestamp = timestamp;
          const dt = (timestamp - lastTimestamp) / 1000;
          lastTimestamp = timestamp;

          if (isPlaying && DURATION_SEC > 0) {{
            progress = (progress + (dt / DURATION_SEC)) % 1.0;
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

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, vw, vh);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(activeImage, rect.x, rect.y, rect.w, rect.h, 0, 0, vw, vh);
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
