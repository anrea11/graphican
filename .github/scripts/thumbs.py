#!/usr/bin/env python3
"""Make 720px WebP thumbnails for every image in assets/uploads → assets/uploads/_t/<file>.webp
Used by cards / ring / logos on the home page; full-size originals are kept for the project view.
Runs in the GitHub Action whenever images are uploaded (e.g. from /admin)."""
import os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets", "uploads"); OUT = os.path.join(SRC, "_t")
os.makedirs(OUT, exist_ok=True)
made = 0
for f in sorted(os.listdir(SRC)):
    p = os.path.join(SRC, f)
    if not os.path.isfile(p) or not f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        continue
    dst = os.path.join(OUT, f + ".webp")
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(p):
        continue
    im = Image.open(p)
    im = im.convert("RGBA" if (im.mode in ("RGBA", "LA", "P") and "transparency" in im.info or im.mode in ("RGBA", "LA")) else "RGB")
    im.thumbnail((720, 720), Image.LANCZOS)
    im.save(dst, "WEBP", quality=78, method=6)
    made += 1
print("thumbnails made:", made)
