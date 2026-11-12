"""
Process Gemini Generated Image into Production App Logo, Icons, and Favicon
- Removes bottom-right Gemini logo watermark
- Removes faux checkerboard background via boundary-connected flood-fill
- Preserves all interior celestial star/nebula pixels
- Centers in square canvas with 5% margin
- Outputs favicon.ico, favicon.png, icon-192.png, icon-512.png, icon-maskable.png
"""
import os
import sys
from PIL import Image
import numpy as np
from scipy import ndimage

SOURCE_PATH = r"C:\Users\RAGHAVA THOTA\Downloads\Gemini_Generated_Image_n6fctjn6fctjn6fc.png"
ROOT_DIR = r"C:\codes\deep-space-amoled"
ICONS_DIR = os.path.join(ROOT_DIR, "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

if not os.path.exists(SOURCE_PATH):
    print(f"Error: Source image not found at {SOURCE_PATH}")
    sys.exit(1)

print(f"Loading master source image: {SOURCE_PATH}...")
img = Image.open(SOURCE_PATH)
arr = np.array(img)[:, :, :3]
h, w, _ = arr.shape
print(f"Source image dimensions: {w}x{h}")

# 1. Background identification:
# The faux checkerboard consists of neutral gray squares with values around 72 and 128
sat = np.max(arr, axis=2) - np.min(arr, axis=2)
val = arr.mean(axis=2)
is_bg_candidate = (sat <= 8) & (val >= 55) & (val <= 140)

# Cut the bottom-right corner where the Gemini watermark is located (x >= 1850, y >= 1850)
is_bg_candidate[1850:, 1850:] = True

# 2. Exterior boundary flood-fill:
# Label all connected components of the background candidates
labeled, num_features = ndimage.label(is_bg_candidate)

# Identify which components connect directly to the outer image border
border_labels = set()
border_labels.update(labeled[0, :].tolist())
border_labels.update(labeled[-1, :].tolist())
border_labels.update(labeled[:, 0].tolist())
border_labels.update(labeled[:, -1].tolist())
border_labels.discard(0)

# True external background mask (anything touching the outside)
is_true_bg = np.isin(labeled, list(border_labels))

# Calculate interior pixels saved
interior_holes = is_bg_candidate & (~is_true_bg)
print(f"Exterior background pixels removed: {np.sum(is_true_bg)}")
print(f"Interior pixels preserved (stars/dust): {np.sum(interior_holes)}")

# 3. Create transparent RGBA image
alpha = (~is_true_bg * 255).astype(np.uint8)
rgba = np.dstack([arr, alpha])
clean_img = Image.fromarray(rgba, mode="RGBA")

# 4. Crop to tight bounding box of emblem
bbox = clean_img.getbbox()
print(f"Extracted emblem bounding box: {bbox}")
emblem_crop = clean_img.crop(bbox)

# 5. Center in square canvas with 5% padding
max_dim = max(emblem_crop.width, emblem_crop.height)
margin = int(max_dim * 0.05)
canvas_size = max_dim + 2 * margin

square_icon = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
paste_x = margin + (max_dim - emblem_crop.width) // 2
paste_y = margin + (max_dim - emblem_crop.height) // 2
square_icon.paste(emblem_crop, (paste_x, paste_y), emblem_crop)
print(f"Composed centered square emblem: {canvas_size}x{canvas_size}")

# 6. Generate production assets:

# A. icons/icon-512.png (512x512 transparent)
icon_512_path = os.path.join(ICONS_DIR, "icon-512.png")
icon_512 = square_icon.resize((512, 512), Image.Resampling.LANCZOS)
icon_512.save(icon_512_path, "PNG", optimize=True)
print(f"✓ Generated: {icon_512_path}")

# B. icons/icon-192.png (192x192 transparent)
icon_192_path = os.path.join(ICONS_DIR, "icon-192.png")
icon_192 = square_icon.resize((192, 192), Image.Resampling.LANCZOS)
icon_192.save(icon_192_path, "PNG", optimize=True)
print(f"✓ Generated: {icon_192_path}")

# C. icons/icon-maskable.png (512x512 with safe zone on deep space #05070f background)
icon_maskable_path = os.path.join(ICONS_DIR, "icon-maskable.png")
maskable_bg = Image.new("RGBA", (512, 512), (5, 7, 15, 255))
# Scale icon to 80% to fit within Google Play safe circle (radius = 40%)
maskable_inner = square_icon.resize((410, 410), Image.Resampling.LANCZOS)
offset = (512 - 410) // 2
maskable_bg.paste(maskable_inner, (offset, offset), maskable_inner)
maskable_bg.save(icon_maskable_path, "PNG", optimize=True)
print(f"✓ Generated: {icon_maskable_path}")

# D. favicon.png (32x32 transparent)
fav_png_path = os.path.join(ROOT_DIR, "favicon.png")
fav_32 = square_icon.resize((32, 32), Image.Resampling.LANCZOS)
fav_32.save(fav_png_path, "PNG", optimize=True)
print(f"✓ Generated: {fav_png_path}")

# E. favicon.ico (multi-resolution 16x16, 32x32, 48x48, 64x64)
fav_ico_path = os.path.join(ROOT_DIR, "favicon.ico")
square_icon.save(
    fav_ico_path,
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]
)
print(f"✓ Generated: {fav_ico_path}")

print("All app logo, favicon, and icon assets successfully generated!")
