#!/usr/bin/env python3
"""
tools/fetch_astro.py - Download high-resolution astronomical images from public sources.

Catalog includes James Webb Space Telescope (JWST) and Hubble Space Telescope masters
hosted by official outreach archives (ESA/Webb, NASA, STScI).
"""

import sys
import os
import argparse
import urllib.request
import time

CATALOG = {
    "carina": {
        "title": "Cosmic Cliffs in Carina Nebula (NGC 3324)",
        "instrument": "JWST NIRCam",
        "url": "https://cdn.esawebb.org/archives/images/large/weic2205a.jpg",
        "filename": "carina_cosmic_cliffs.jpg",
        "desc": "Iconic edge of giant star-forming cavity; dramatic jagged mountain peaks of gas."
    },
    "pillars": {
        "title": "Pillars of Creation (Eagle Nebula / M16)",
        "instrument": "JWST NIRCam",
        "url": "https://cdn.esawebb.org/archives/images/large/weic2219a.jpg",
        "filename": "pillars_of_creation.jpg",
        "desc": "Towering columns of interstellar gas and dust where new stars form."
    },
    "tarantula": {
        "title": "Tarantula Nebula (30 Doradus)",
        "instrument": "JWST NIRCam",
        "url": "https://cdn.esawebb.org/archives/images/large/weic2216a.jpg",
        "filename": "tarantula_nebula.jpg",
        "desc": "The largest and brightest star-forming region in the Local Group."
    },
    "quintet": {
        "title": "Stephan's Quintet (HCG 92)",
        "instrument": "JWST NIRCam / MIRI Composite",
        "url": "https://cdn.esawebb.org/archives/images/large/weic2207a.jpg",
        "filename": "stephans_quintet.jpg",
        "desc": "Compact group of five colliding galaxies locked in a cosmic dance."
    },
    "southern_ring": {
        "title": "Southern Ring Nebula (NGC 3132)",
        "instrument": "JWST NIRCam",
        "url": "https://cdn.esawebb.org/archives/images/large/weic2208a.jpg",
        "filename": "southern_ring_nebula.jpg",
        "desc": "Expanding cloud of gas surrounding a dying binary star."
    }
}


def download_file(url: str, dest_path: str, title: str):
    print(f"\n[fetch_astro] Downloading: {title}")
    print(f"  Source URL : {url}")
    print(f"  Destination: {dest_path}")

    headers = {"User-Agent": "Mozilla/5.0 (pfctloop-astro-downloader/1.0)"}
    req = urllib.request.Request(url, headers=headers)

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            total_size = int(response.headers.get("content-length", 0))
            downloaded = 0
            chunk_size = 1024 * 512  # 512 KB

            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            with open(dest_path, "wb") as f:
                while True:
                    chunk = response.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        pct = (downloaded / total_size) * 100
                        mb_done = downloaded / (1024 * 1024)
                        mb_tot = total_size / (1024 * 1024)
                        sys.stdout.write(f"\r  Progress: {pct:5.1f}% [{mb_done:.1f} / {mb_tot:.1f} MB]")
                    else:
                        mb_done = downloaded / (1024 * 1024)
                        sys.stdout.write(f"\r  Downloaded: {mb_done:.1f} MB")
                    sys.stdout.flush()

        elapsed = time.time() - t0
        rate_mb = (downloaded / (1024 * 1024)) / max(elapsed, 0.01)
        print(f"\n  Finished in {elapsed:.1f}s ({rate_mb:.2f} MB/s). Saved to {dest_path}\n")
        return True
    except Exception as e:
        print(f"\n  [ERROR] Download failed: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="Download high-resolution astronomical images.")
    parser.add_argument("--target", default="carina",
                        choices=list(CATALOG.keys()) + ["all"],
                        help="Target image to download (default: carina)")
    parser.add_argument("--url", default=None,
                        help="Custom direct URL to an astronomical image")
    parser.add_argument("--filename", default=None,
                        help="Custom destination filename when using --url")
    parser.add_argument("--output-dir", default="images/raw",
                        help="Output directory (default: images/raw)")
    parser.add_argument("--list", action="store_true",
                        help="List all catalog targets with details")

    args = parser.parse_args()

    if args.list:
        print("\nAvailable Astronomical Targets in Catalog:")
        print("=" * 60)
        for key, info in CATALOG.items():
            print(f"[{key.upper()}] - {info['title']}")
            print(f"  Instrument: {info['instrument']}")
            print(f"  Description: {info['desc']}")
            print(f"  URL: {info['url']}\n")
        return

    os.makedirs(args.output_dir, exist_ok=True)

    if args.url:
        dest_filename = args.filename or os.path.basename(args.url.split("?")[0]) or "custom_astro.jpg"
        dest_path = os.path.join(args.output_dir, dest_filename)
        download_file(args.url, dest_path, "Custom Astronomical Target")
        return

    targets = list(CATALOG.keys()) if args.target == "all" else [args.target]

    for t in targets:
        info = CATALOG[t]
        dest_path = os.path.join(args.output_dir, info["filename"])
        if os.path.exists(dest_path):
            print(f"[fetch_astro] File already exists: {dest_path} (skipping download).")
        else:
            download_file(info["url"], dest_path, info["title"])


if __name__ == "__main__":
    main()
