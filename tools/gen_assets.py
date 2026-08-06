"""Generate bg.png and sparkles.gif for the bio page."""
import math
import random

from PIL import Image, ImageDraw, ImageFilter

random.seed(1337)
OUT = r"C:\kimi\bio-site"

# ---------- sparkles.gif: twinkling red/white stars on black ----------
S = 128
FRAMES = 12
stars = [(random.uniform(0, S), random.uniform(0, S), random.uniform(1.5, 4.5),
          random.uniform(0, math.tau), random.choice([(255, 60, 60), (255, 120, 120),
          (255, 200, 200), (255, 0, 0)])) for _ in range(46)]

frames = []
for f in range(FRAMES):
    t = f / FRAMES
    img = Image.new("RGB", (S, S), (0, 0, 0))
    d = ImageDraw.Draw(img)
    for x, y, r, phase, col in stars:
        tw = 0.5 + 0.5 * math.sin(math.tau * t + phase)  # 0..1 twinkle
        rr = r * tw
        if rr < 0.4:
            continue
        c = tuple(int(v * (0.35 + 0.65 * tw)) for v in col)
        # 4-point star: two thin lines + center dot
        d.line([x - rr * 2, y, x + rr * 2, y], fill=c, width=1)
        d.line([x, y - rr * 2, x, y + rr * 2], fill=c, width=1)
        d.ellipse([x - rr / 2, y - rr / 2, x + rr / 2, y + rr / 2], fill=c)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    frames.append(img)

frames[0].save(OUT + r"\sparkles.gif", save_all=True, append_images=frames[1:],
               duration=90, loop=0, optimize=True)

# ---------- bg.png: dark abstract with red glow + grain ----------
W, H = 1600, 900
img = Image.new("RGB", (W, H), (9, 9, 9))
glow = Image.new("RGB", (W, H), (0, 0, 0))
d = ImageDraw.Draw(glow)
# a few soft red blobs
for cx, cy, r, v in [(W * 0.25, H * 0.3, 420, 90), (W * 0.8, H * 0.7, 500, 70),
                     (W * 0.55, H * 0.1, 300, 50)]:
    for i in range(r, 0, -8):
        a = int(v * (1 - i / r) ** 2)
        d.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(a, int(a * 0.08), int(a * 0.08)))
glow = glow.filter(ImageFilter.GaussianBlur(60))
img = Image.blend(img, Image.new("RGB", (W, H), (255, 255, 255)), 0)  # noop keep
from PIL import ImageChops
img = ImageChops.add(img, glow)

# grain
noise = Image.effect_noise((W, H), 28).convert("L")
noise_rgb = Image.merge("RGB", (noise, noise, noise))
img = ImageChops.add(img, noise_rgb.point(lambda p: p * 0.12))

# vignette
vig = Image.new("L", (W, H), 0)
dv = ImageDraw.Draw(vig)
dv.ellipse([-W * 0.25, -H * 0.35, W * 1.25, H * 1.35], fill=255)
vig = vig.filter(ImageFilter.GaussianBlur(120))
black = Image.new("RGB", (W, H), (0, 0, 0))
img = Image.composite(img, black, vig)

img.save(OUT + r"\bg.png", optimize=True)
print("done")
