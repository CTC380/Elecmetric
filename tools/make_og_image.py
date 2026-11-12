#!/usr/bin/env python3
"""Draws og-image.png (1200x630), the preview shown when an Elecmetric link is shared.
Run: python3 tools/make_og_image.py   (needs Pillow and the DejaVu fonts, and logo.png in the project root).
The PNG is committed; rerun only to change it."""
from PIL import Image, ImageDraw, ImageFont
import os
HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 1200, 630
NAVY, NAVY_D, BLUE, ORANGE = (4, 59, 121), (3, 38, 82), (0, 98, 222), (255, 122, 0)
WHITE, SOFT = (255, 255, 255), (198, 214, 238)
img = Image.new('RGB', (W, H), NAVY_D)
px = img.load()
for y in range(H):            # navy diagonal gradient, brighter toward the top right
    for x in range(W):
        t = min(1.0, max(0.0, (x / W) * 0.55 + (1 - y / H) * 0.45))
        px[x, y] = tuple(int(NAVY_D[i] + (NAVY[i] - NAVY_D[i]) * t * 1.1) for i in range(3))
d = ImageDraw.Draw(img)
F = '/usr/share/fonts/truetype/dejavu/'
mid = ImageFont.truetype(F + 'DejaVuSans-Bold.ttf', 50)
small = ImageFont.truetype(F + 'DejaVuSans.ttf', 31)
mono = ImageFont.truetype(F + 'DejaVuSansMono-Bold.ttf', 32)
d.rectangle([0, 0, W, 16], fill=ORANGE)
# white logo plate
logo = Image.open(os.path.join(HERE, '..', 'logo.png')).convert('RGB')
lw = 640; lh = round(logo.height * lw / logo.width)
logo = logo.resize((lw, lh), Image.LANCZOS)
plate = [80, 90, 80 + lw + 60, 90 + lh + 56]
d.rounded_rectangle(plate, radius=26, fill=WHITE)
img.paste(logo, (plate[0] + 30, plate[1] + 28))
y = plate[3] + 48
d.text((80, y), 'Electrical engineering calculators', font=mid, fill=WHITE)
d.text((80, y + 76), 'Cable sizing, motors, transformers, protection,', font=small, fill=SOFT)
d.text((80, y + 118), 'earthing and solar PV. Formulas and working shown.', font=small, fill=SOFT)
d.rounded_rectangle([80, 520, 860, 584], radius=10, outline=ORANGE, width=3)
d.text((104, 534), 'V = I × R    P = √3 · V · I · cos φ', font=mono, fill=(255, 176, 102))
# pulse mark, echoing the logo underline
x0, yb = 900, 552
pts = [(x0, yb), (x0 + 70, yb), (x0 + 92, yb - 34), (x0 + 116, yb + 30), (x0 + 140, yb - 18), (x0 + 156, yb), (W - 60, yb)]
d.line(pts, fill=ORANGE, width=5, joint='curve')
out = os.path.join(HERE, '..', 'og-image.png')
img.save(out, optimize=True)
print('wrote', os.path.normpath(out))
