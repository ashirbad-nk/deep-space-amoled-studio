# Deep Space AMOLED Wallpaper & 60 FPS Cinematic Loop Engine

A hardware-accelerated, mathematically verified 60 FPS wallpaper system that transforms high-resolution deep-space astronomical imagery (NASA / ESA / STScI James Webb & Hubble) into a seamless, cinematic pan-and-zoom loop custom-graded for true-black AMOLED/OLED screens.

---

## Key Highlights

- **AMOLED True-Black Grading**: Space telescope raw images contain background sky glow and sensor noise (typically luminance 10–25 / 255). On OLED displays, this prevents pixels from turning off. Our pipeline uses a **soft-knee cubic Hermite roll-off (smoothstep)** to crush background void noise strictly to `#000000` (RGB 0,0,0) while preserving subtle nebular dust clouds and pinpoint stars via morphological top-hat filtering.
- **$C^1 / C^2$ Perfect Loop Closure Invariant**: Camera trajectory is computed using a **closed centripetal Catmull-Rom spline** and **harmonic Lissajous closed orbit** with arc-length re-parameterization. Position $\mathbf{P}(0) = \mathbf{P}(T)$, velocity $\mathbf{v}(0) = \mathbf{v}(T)$, and acceleration are continuous, ensuring **zero hitching, stutter, or velocity jump at the loop seam** across up to 3-minute (10,800 frames @ 60 FPS) loops.
- **Maximum Image Coverage**: Designed to traverse up to 85–90% of massive astronomical images (such as the 123-Megapixel Carina Nebula "Cosmic Cliffs"), guiding the viewer across the outer starfield void, downward along jagged ionization ridges, deep into glowing protostar nurseries, and pulling back into grand cosmic vistas.
- **Responsive Aspect Ratio Engine**: Instant presets for popular smartphones (iPhone 15/16 Pro 1179×2556, Galaxy S24 Ultra 1440×3120, 9:16) and desktop monitors (4K 3840×2160, 1440p, 1080p, MacBook 16:10, Ultrawide 21:9, Super Ultrawide 32:9). The bounding solver mathematically guarantees **zero letterbox and zero image bleed** regardless of screen shape.
- **Microscopic Payload vs. Video**: Instead of a 700 MB pre-rendered MP4 video (which suffers from YUV chroma subsampling and macroblocking in the dark void), this player uses **1 single static 5K master image (~2.8 MB)** and renders the 60 FPS camera motion in real-time on the GPU.

---

## File Structure

```
├── index.html                   # Zero-dependency, hardware-accelerated wallpaper player
├── src/
│   ├── camera_engine.js         # Mathematical spline, zoom, and boundary solver
│   ├── wallpaper.js             # 60 FPS WebGL/Canvas renderer & HUD controller
│   └── style.css                # Glassmorphic HUD styling with pure #000000 theme
├── tools/
│   ├── fetch_astro.py           # Downloader for JWST & Hubble public archives
│   └── grade_amoled.py          # Soft-knee true-black grading & star protection engine
├── images/
│   ├── raw/                     # Original 100+ megapixel astronomical master files
│   └── graded/                  # AMOLED-graded master files and web-optimized textures
├── tests/
│   └── test_loop_closure.js     # Automated mathematical verification test suite
└── README.md
```

---

## Quick Start: Launching the Wallpaper

Open `index.html` in any modern web browser:

```bash
# Direct open:
xdg-open index.html   # Linux
open index.html       # macOS
start index.html      # Windows

# Or via local static server:
python3 -m http.server 8080
# Open http://localhost:8080/ in your browser
```

### Hotkeys & Interactive Controls
| Key | Action |
| :--- | :--- |
| **Spacebar** | Play / Pause camera movement |
| **H** | Hide / Show Glassmorphic HUD (HUD also auto-hides after 3s of inactivity) |
| **B** | Toggle **AMOLED True-Black Inspector** (highlights exact RGB 0,0,0 pixels in magenta) |
| **M** | Toggle **Trajectory Radar Mini-Map** |
| **F** | Toggle Fullscreen Mode |

---

## Setting as a Live Wallpaper

### On Windows
1. **Lively Wallpaper** (Free & Open Source):
   - Download Lively Wallpaper from [rocksdanister/lively](https://github.com/rocksdanister/lively) or Microsoft Store.
   - Click **Add Wallpaper** $\rightarrow$ Choose **HTML / Webpage** $\rightarrow$ Select `index.html` (or enter `http://localhost:8080`).
2. **Wallpaper Engine** (Steam):
   - Open Wallpaper Engine Editor $\rightarrow$ Create New $\rightarrow$ Select **Web Wallpaper** $\rightarrow$ Point to `index.html`.

### On macOS
1. **Plash** (Free & Open Source):
   - Install [Plash](https://github.com/sindresorhus/Plash) from the Mac App Store or GitHub.
   - Add local URL: `file:///path/to/pfctloop/index.html` and set refresh to manual.

### On Android & iOS
- Launch `index.html` in Chrome or Safari.
- Select your phone preset (e.g. *iPhone 16 Pro* or *Galaxy S24 Ultra*).
- Tap Fullscreen / Add to Home Screen (PWA mode), or use an app like *HTML Live Wallpaper* on Android.

---

## Downloading Additional Space Images

The included `tools/fetch_astro.py` script downloads verified, high-resolution astronomical masters directly from ESA / STScI JWST archives:

```bash
# List available astronomical targets:
python3 tools/fetch_astro.py --list

# Download specific target (e.g. Pillars of Creation, Tarantula Nebula, Carina):
python3 tools/fetch_astro.py --target pillars
python3 tools/fetch_astro.py --target tarantula

# Download custom image URL:
python3 tools/fetch_astro.py --url "https://your-astro-url.jpg" --filename my_target.jpg
```

---

## Grading Images for AMOLED True Black

Run `tools/grade_amoled.py` to process any space photograph:

```bash
python3 tools/grade_amoled.py --input images/raw/carina_cosmic_cliffs.jpg --save-comparison
```

### How the Grading Works:
1. **Decompression**: Disables pillow pixel limits (`Image.MAX_IMAGE_PIXELS = None`) to safely process 100+ megapixel files without crashing.
2. **Noise Floor Estimation**: Automatically computes the 2nd–5th percentile luminance of the background sky.
3. **Cubic Hermite Soft-Knee Roll-Off**:
   $$\text{Factor}(u) = 3 u^2 - 2 u^3 \quad \text{where } u = \frac{L - T_{black}}{T_{knee} - T_{black}}$$
   Smoothly tapers dark pixels to zero without color-banding or posterization.
4. **Morphological Star Protection**:
   Uses an elliptical top-hat morphological filter ($I - \text{Opening}(I)$) to detect bright point sources $< 6\text{px}$ across, preventing micro-stars from being extinguished by the black floor crush.
5. **Web Texture Optimization**: Automatically exports a 5K master (`.webp` and `.jpg`) with subpixel black snap for fast, responsive 60 FPS WebGL rendering.

---

## Running Automated Verification Tests

To verify mathematical $C^1$ velocity matching, loop closure, and bounding box invariants across all 9 phone and desktop aspect ratios over 10,800 frames:

```bash
node tests/test_loop_closure.js
```
