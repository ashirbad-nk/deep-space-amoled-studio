#!/usr/bin/env python3
"""
tools/grade_amoled.py - Grade astronomical images for true-black AMOLED/OLED displays.

Key Features:
1. Decompression of gigapixel space images (Image.MAX_IMAGE_PIXELS = None).
2. Soft-Knee Cubic Hermite (Smoothstep) Black Point Curve to avoid posterization/banding.
3. Morphological Top-Hat Star Masking to preserve pinpoint celestial bodies.
4. Auto-estimation of background sky noise floor.
5. Telemetry & Analytics: Pure Black (RGB 0,0,0) percentage and dynamic range report.
6. Multi-tier export (Native master + 5K/4K high-performance web wallpaper).
"""

import sys
import os
import argparse
import time
import numpy as np
from PIL import Image
import cv2

Image.MAX_IMAGE_PIXELS = None


def estimate_sky_floor(arr_rgb: np.ndarray) -> float:
    """
    Estimates the background sky noise floor by finding the mode / low percentile
    of the dark sky regions.
    """
    # Sample down if image is huge for rapid statistics
    h, w = arr_rgb.shape[:2]
    step = max(1, min(h, w) // 1000)
    sample = arr_rgb[::step, ::step]
    lum = 0.299 * sample[:, :, 0] + 0.587 * sample[:, :, 1] + 0.114 * sample[:, :, 2]
    
    # In deep-space photography, the 2nd percentile is a robust estimate of the void floor
    p2 = np.percentile(lum, 2.0)
    p5 = np.percentile(lum, 5.0)
    p10 = np.percentile(lum, 10.0)
    print(f"  [Diagnostics] Sky Luminance: 2nd% = {p2:.1f}, 5th% = {p5:.1f}, 10th% = {p10:.1f}")
    
    # Return suggested black floor just below the 5th percentile
    return float(max(10.0, p2 + 2.0))


def apply_amoled_grade(arr_rgb: np.ndarray,
                       black_floor: float,
                       knee_width: float = 24.0,
                       star_protect_weight: float = 0.85,
                       contrast: float = 1.08) -> tuple[np.ndarray, dict]:
    """
    Applies the soft-knee true-black transformation and star protection.
    """
    t0 = time.time()
    t_black = float(black_floor)
    t_knee = t_black + float(knee_width)
    
    h, w, c = arr_rgb.shape
    print(f"  Processing image tensor: {w} x {h} x {c} ...")
    print(f"  True Black Floor (T_black): {t_black:.1f} | Knee Threshold (T_knee): {t_knee:.1f}")

    # Compute luminance float32
    lum = (0.299 * arr_rgb[:, :, 0] + 0.587 * arr_rgb[:, :, 1] + 0.114 * arr_rgb[:, :, 2]).astype(np.float32)

    # 1. Star Protection Mask (Morphological Top-Hat filter isolates bright spikes < 7px wide)
    print("  Computing morphological star protection mask...")
    gray_uint8 = np.clip(lum, 0, 255).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    tophat = cv2.morphologyEx(gray_uint8, cv2.MORPH_TOPHAT, kernel).astype(np.float32)
    
    # Star confidence: normalized from [8, 40]
    star_mask = np.clip((tophat - 8.0) / 32.0, 0.0, 1.0) * star_protect_weight

    # 2. Soft-Knee Cubic Hermite (Smoothstep) Attenuation Factor
    print("  Applying soft-knee cubic Hermite curve...")
    u = np.clip((lum - t_black) / max(t_knee - t_black, 1e-4), 0.0, 1.0)
    # Smoothstep curve: S(u) = 3*u^2 - 2*u^3
    smooth_factor = 3.0 * (u ** 2) - 2.0 * (u ** 3)
    
    # Apply star mask protection: stars retain their intensity even if near black floor
    effective_factor = np.maximum(smooth_factor, star_mask)

    # 3. Channel-wise transformation preserving chrominance & applying contrast
    graded = np.empty_like(arr_rgb, dtype=np.uint8)
    for ch in range(3):
        ch_data = arr_rgb[:, :, ch].astype(np.float32)
        
        # Attenuate by effective_factor
        crushed = ch_data * effective_factor
        
        # Subtle midtone contrast expansion for glowing nebulae
        if contrast != 1.0:
            norm = crushed / 255.0
            # Sigmoidal-like power curve centered at 0.5
            norm = np.where(norm > 0, np.power(norm, 1.0 / contrast), 0)
            crushed = norm * 255.0
            
        # Hard clamp strictly to 0 for exact OLED off where factor == 0
        exact_zero_mask = (effective_factor == 0.0)
        crushed[exact_zero_mask] = 0.0
        
        graded[:, :, ch] = np.clip(crushed, 0, 255).astype(np.uint8)

    # 4. Telemetry
    raw_pure_black = np.mean((arr_rgb[:, :, 0] == 0) & (arr_rgb[:, :, 1] == 0) & (arr_rgb[:, :, 2] == 0)) * 100.0
    graded_pure_black = np.mean((graded[:, :, 0] == 0) & (graded[:, :, 1] == 0) & (graded[:, :, 2] == 0)) * 100.0
    
    stats = {
        "raw_pure_black_pct": raw_pure_black,
        "graded_pure_black_pct": graded_pure_black,
        "black_floor": t_black,
        "knee_threshold": t_knee,
        "elapsed_sec": time.time() - t0
    }
    return graded, stats


def main():
    parser = argparse.ArgumentParser(description="Grade astronomical images for AMOLED true-black displays.")
    parser.add_argument("--input", default="images/raw/carina_cosmic_cliffs.jpg",
                        help="Input astronomical image path")
    parser.add_argument("--output-dir", default="images/graded",
                        help="Output directory for graded images")
    parser.add_argument("--black-floor", type=float, default=None,
                        help="Black floor threshold (default: auto-detected)")
    parser.add_argument("--knee-width", type=float, default=24.0,
                        help="Soft-knee transition width (default: 24.0)")
    parser.add_argument("--star-protect", type=float, default=0.85,
                        help="Star protection strength [0.0 - 1.0] (default: 0.85)")
    parser.add_argument("--contrast", type=float, default=1.06,
                        help="Nebular contrast multiplier (default: 1.06)")
    parser.add_argument("--web-width", type=int, default=5120,
                        help="Max width for web-optimized wallpaper texture (default: 5120, 0 to skip)")
    parser.add_argument("--save-comparison", action="store_true",
                        help="Generate a side-by-side comparison thumbnail")

    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"[ERROR] Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    print(f"\n[grade_amoled] Loading {args.input} ...")
    t0 = time.time()
    pil_img = Image.open(args.input).convert("RGB")
    arr_rgb = np.array(pil_img)
    print(f"  Loaded in {time.time() - t0:.2f}s ({arr_rgb.shape[1]}x{arr_rgb.shape[0]})")

    black_floor = args.black_floor
    if black_floor is None:
        print("  Auto-detecting sky noise floor...")
        black_floor = estimate_sky_floor(arr_rgb)

    graded_rgb, stats = apply_amoled_grade(
        arr_rgb,
        black_floor=black_floor,
        knee_width=args.knee_width,
        star_protect_weight=args.star_protect,
        contrast=args.contrast
    )

    print("\n" + "=" * 55)
    print("  AMOLED COLOR GRADING REPORT")
    print("=" * 55)
    print(f"  Raw True Black (RGB 0,0,0)   : {stats['raw_pure_black_pct']:6.2f} %")
    print(f"  Graded True Black (RGB 0,0,0): {stats['graded_pure_black_pct']:6.2f} %")
    print(f"  True-Black Floor (Threshold) : {stats['black_floor']:6.1f} / 255")
    print(f"  Knee Smoothing Range         : {stats['knee_threshold']:6.1f} / 255")
    print(f"  Processing Time              : {stats['elapsed_sec']:6.2f} s")
    print("=" * 55 + "\n")

    os.makedirs(args.output_dir, exist_ok=True)
    base_stem = os.path.splitext(os.path.basename(args.input))[0]

    # Save Web-Optimized Wallpaper Texture (Default: 5120px / 5K width or original width)
    target_w = min(arr_rgb.shape[1], args.web_width) if args.web_width > 0 else arr_rgb.shape[1]
    target_h = int(arr_rgb.shape[0] * (target_w / arr_rgb.shape[1]))
    print(f"  Exporting web wallpaper to {target_w}x{target_h} (preserves pure black)...")
    
    graded_pil = Image.fromarray(graded_rgb)
    if target_w != arr_rgb.shape[1]:
        web_pil = graded_pil.resize((target_w, target_h), Image.Resampling.LANCZOS)
    else:
        web_pil = graded_pil
    
    # Enforce exact black pixels after downsampling interpolation
    web_arr = np.array(web_pil)
    web_lum = 0.299 * web_arr[:, :, 0] + 0.587 * web_arr[:, :, 1] + 0.114 * web_arr[:, :, 2]
    web_arr[web_lum < 4.0] = [0, 0, 0]
    web_pil = Image.fromarray(web_arr)

    web_path = os.path.join(args.output_dir, f"{base_stem}_amoled_5k.webp")
    web_pil.save(web_path, "WEBP", quality=95, method=6)
    print(f"  Saved Web Wallpaper: {web_path} ({os.path.getsize(web_path)/(1024*1024):.2f} MB)")
    
    web_jpg_path = os.path.join(args.output_dir, f"{base_stem}_amoled_5k.jpg")
    web_pil.save(web_jpg_path, "JPEG", quality=96)
    print(f"  Saved High-Q JPEG  : {web_jpg_path} ({os.path.getsize(web_jpg_path)/(1024*1024):.2f} MB)")

    # 2. Save Comparison Thumbnail if requested
    if args.save_comparison:
        comp_w = 1920
        comp_h = int(arr_rgb.shape[0] * (comp_w / arr_rgb.shape[1]))
        raw_small = cv2.resize(arr_rgb, (comp_w, comp_h))
        graded_small = cv2.resize(graded_rgb, (comp_w, comp_h))
        
        # Split screen: Left raw, Right graded
        split = np.empty_like(raw_small)
        mid = comp_w // 2
        split[:, :mid] = raw_small[:, :mid]
        split[:, mid:] = graded_small[:, mid:]
        # Draw divider line
        split[:, mid-2:mid+2] = [255, 255, 255]
        
        comp_path = os.path.join(args.output_dir, f"{base_stem}_comparison.jpg")
        Image.fromarray(split).save(comp_path, "JPEG", quality=90)
        print(f"  Saved Before/After Comparison: {comp_path}")

    print("\n[grade_amoled] Done!\n")


if __name__ == "__main__":
    main()
