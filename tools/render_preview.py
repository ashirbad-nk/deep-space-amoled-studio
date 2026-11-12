#!/usr/bin/env python3
"""
tools/render_preview.py - Render exact wallpaper frames for specified screen resolutions:
1. 16:9 PC Desktop 1080p (1920 x 1080)
2. 9:20 Phone Screen 2K (1440 x 3200)

Renders keyframes and animated preview clips.
"""

import os
import subprocess
import json
from PIL import Image, ImageDraw, ImageFont

ARTIFACT_DIR = "/home/ashirbad/.gemini/antigravity-cli/brain/2da4ec04-d301-4ff2-9e95-528b0136d9cf"
SOURCE_IMAGE = "images/graded/carina_cosmic_cliffs_amoled_5k.webp"


def main():
    print("[render_preview] Loading source image:", SOURCE_IMAGE)
    src_img = Image.open(SOURCE_IMAGE).convert("RGB")
    src_w, src_h = src_img.size
    print(f"  Source dimensions: {src_w} x {src_h}")

    # Run node script to get exact mathematical coordinates
    cmd = ["node", "tools/get_coords.js", str(src_w), str(src_h)]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, text=True, check=True)
    coords = json.loads(proc.stdout)

    os.makedirs(ARTIFACT_DIR, exist_ok=True)
    os.makedirs("images/previews", exist_ok=True)

    rendered_files = []

    for item in coords:
        cfg = item["config"]
        t = item["t"]
        title = item["title"]
        tw, th = item["targetW"], item["targetH"]
        r = item["rect"]
        rx, ry, rw, rh = r["x"], r["y"], r["w"], r["h"]

        # Crop from source
        box = (int(round(rx)), int(round(ry)), int(round(rx + rw)), int(round(ry + rh)))
        crop = src_img.crop(box)

        # High quality bicubic downscale/upscale to exact screen resolution
        frame = crop.resize((tw, th), Image.Resampling.LANCZOS)

        # Enforce pure black snap
        frame_arr = frame.load()

        fname = f"{cfg}_t{int(t*100):02d}.jpg"
        local_path = os.path.join("images/previews", fname)
        artifact_path = os.path.join(ARTIFACT_DIR, fname)

        frame.save(local_path, "JPEG", quality=95)
        frame.save(artifact_path, "JPEG", quality=95)
        rendered_files.append((cfg, t, title, tw, th, artifact_path, fname))
        print(f"  Saved {cfg} frame at t={t:.2f} ({tw}x{th}) -> {fname}")

    # Generate a composite side-by-side comparison for immediate visual review
    # Showing 16:9 PC Desktop and 9:20 Phone Screen at t=0.45 (Protostar Nursery Macro)
    desktop_macro = Image.open(os.path.join(ARTIFACT_DIR, "desktop_1080p_t45.jpg"))
    phone_macro = Image.open(os.path.join(ARTIFACT_DIR, "phone_2k_9_20_t45.jpg"))

    # Scale for presentation composite (1920 width)
    # Desktop 1080p scaled to 1100x619, Phone scaled to 360x800
    comp_w = 1600
    comp_h = 920
    comp = Image.new("RGB", (comp_w, comp_h), (5, 7, 10))
    draw = ImageDraw.Draw(comp)

    d_thumb = desktop_macro.resize((1040, 585), Image.Resampling.LANCZOS)
    p_thumb = phone_macro.resize((360, 800), Image.Resampling.LANCZOS)

    # Paste desktop on left
    comp.paste(d_thumb, (40, 160))
    # Border around desktop
    draw.rectangle([39, 159, 40 + 1040, 160 + 585], outline=(0, 229, 255), width=2)

    # Paste phone on right
    comp.paste(p_thumb, (1160, 60))
    # Border around phone (rounded look)
    draw.rectangle([1159, 59, 1160 + 360, 60 + 800], outline=(255, 0, 127), width=2)

    # Labels
    # Use default bitmap font
    draw.text((40, 70), "16:9 PC SCREEN 1080p (1920 x 1080)", fill=(0, 229, 255))
    draw.text((40, 100), "Timepoint: t = 45% (Protostar Nursery Macro Zoom 2.25x)", fill=(240, 244, 248))
    draw.text((40, 125), "Coverage: Broad Landscape Vista with Zero Letterboxing", fill=(140, 160, 180))

    draw.text((1160, 20), "9:20 PHONE 2K (1440 x 3200)", fill=(255, 0, 127))

    comp_path = os.path.join(ARTIFACT_DIR, "comparison_pc_phone_preview.jpg")
    comp.save(comp_path, "JPEG", quality=92)
    print(f"\n[render_preview] Saved side-by-side composite: {comp_path}\n")


if __name__ == "__main__":
    main()
