# Background-removal and favicon generation for the provided logo
# - Removes the OUTER white via border flood-fill (keeps inner white "M")
# - Shaves a few pixels into the blue edge to remove any white halo
# - Crops tightly to the circle
# - Exports a transparent PNG + common favicon sizes and an .ico bundle

from PIL import Image, ImageFilter  # ImageFilter for the edge inset (dilation)
import numpy as np
from collections import deque
from pathlib import Path

# === Paths ===
src = Path("/Users/shanewilliams/Desktop/tuftsmedicine_logo.jpeg")
out_dir = Path("/Users/shanewilliams/Desktop")

# === Tunables ===
WHITE_THRESH = 245   # near-white threshold for detecting background
INSET_PX = 3        # how many pixels to shave inward from the outer edge

# --- Load ---
img = Image.open(src).convert("RGBA")
arr = np.array(img)

# --- Detect near-white pixels (candidate background) ---
rgb = arr[..., :3].astype(np.uint8)
near_white = (rgb[..., 0] >= WHITE_THRESH) & (rgb[..., 1] >= WHITE_THRESH) & (rgb[..., 2] >= WHITE_THRESH)

h, w = near_white.shape
bg = np.zeros_like(near_white, dtype=bool)

# --- Flood-fill from borders through near-white only (preserves inner white "M") ---
q = deque()
for x in range(w):
    if near_white[0, x]:   q.append((0, x));   bg[0, x] = True
    if near_white[h-1, x]: q.append((h-1, x)); bg[h-1, x] = True
for y in range(h):
    if near_white[y, 0]:   q.append((y, 0));   bg[y, 0] = True
    if near_white[y, w-1]: q.append((y, w-1)); bg[y, w-1] = True

while q:
    y, x = q.popleft()
    for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
        if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and near_white[ny, nx]:
            bg[ny, nx] = True
            q.append((ny, nx))

# --- Inset the outer background inward to shave off any white halo ---
# (dilate the detected background by INSET_PX using a 3x3 max filter)
bg_img = Image.fromarray((bg * 255).astype(np.uint8), mode="L")
for _ in range(max(0, INSET_PX)):
    bg_img = bg_img.filter(ImageFilter.MaxFilter(3))
bg_inset = np.array(bg_img) > 127

# --- Apply transparency: outside becomes transparent; inside stays opaque ---
arr[..., 3] = np.where(bg_inset, 0, 255)

# --- Tight crop to non-transparent content ---
ys, xs = np.where(arr[..., 3] > 0)
ymin, ymax = int(ys.min()), int(ys.max())
xmin, xmax = int(xs.min()), int(xs.max())
cropped = Image.fromarray(arr[ymin:ymax+1, xmin:xmax+1], "RGBA")

# --- Save main transparent PNG ---
out_dir.mkdir(parents=True, exist_ok=True)
main_png = out_dir / f"findas_logo_round_inset{INSET_PX}px.png"
cropped.save(main_png, optimize=True)

# --- Generate common favicon sizes ---
sizes = [16, 32, 48, 64, 180, 192, 512]
png_paths = []
for s in sizes:
    resized = cropped.resize((s, s), Image.Resampling.LANCZOS)  # Pillow >=10
    p = out_dir / f"favicon-inset-{s}.png"
    resized.save(p, optimize=True)
    png_paths.append(p.as_posix())

# --- Windows/legacy ICO bundle ---
ico_path = out_dir / "favicon-inset.ico"
cropped.save(ico_path, sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

print(main_png.as_posix())
print(ico_path.as_posix())
print(png_paths)
