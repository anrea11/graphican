"""Per-page share images (Open Graph / Twitter, 1200×630) for the tool pages.
Deterministic output: the same title always gives byte-identical JPEGs, so the bot only commits real changes.
Run before prerender.py (it links an image only when the file exists)."""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
import landings  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "assets", "uploads", "og")
FONT_B = os.path.join(ROOT, "assets", "fonts", "pdf", "Inter-Bold.ttf")
FONT_R = os.path.join(ROOT, "assets", "fonts", "pdf", "Inter-Regular.ttf")
W, H = 1200, 630


def pages():
    d = json.load(open(os.path.join(ROOT, "content", "design.json"), encoding="utf-8"))
    out = [("tools-hub", "Үнэгүй онлайн дизайн, PDF хэрэгслүүд", "ХЭРЭГСЛҮҮД")]
    tags = {"upscale": "AI", "bgremove": "AI", "socialcrop": "ЗУРАГ", "tools": "PDF", "pdfedit": "PDF"}
    for k in ("upscale", "pdfedit", "bgremove", "socialcrop", "tools"):
        s = d.get(k) or {}
        if s.get("title"):
            out.append((k, s.get("seo_h1") or s["title"].rstrip("."), tags[k]))
    out += [(p["slug"], p["h1"], "AI" if p["slug"] in ("summarize-pdf", "translate-pdf", "pdf-ocr") else "PDF") for p in landings.ALL_PAGES]
    out += [("mongol-font", "Монгол фонт — Ө, Ү-тэй кирилл фонтууд", "ФОНТ"), ("brand-color", "Брэндийн өнгө үүсгэгч", "ӨНГӨ"),
            ("templates", "Монгол сошиал пост загвар", "ЗАГВАР"), ("slides", "Илтгэл бэлдэх — PowerPoint, PDF татах", "ИЛТГЭЛ"),
            ("editor", "Онлайн дизайн засварлагч", "ДИЗАЙН")]
    return out


def wrap(draw, text, font, width):
    words, lines, line = text.split(), [], ""
    for w in words:
        t = (line + " " + w).strip()
        if draw.textlength(t, font=font) <= width or not line:
            line = t
        else:
            lines.append(line); line = w
    if line:
        lines.append(line)
    return lines


def render(title, tag):
    im = Image.new("RGB", (W, H), (10, 10, 16))
    # soft violet glow, lower right
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse((700, 250, 1400, 950), fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    im.paste(Image.new("RGB", (W, H), (84, 64, 220)), (0, 0), glow)
    d = ImageDraw.Draw(im)
    # brand mark
    d.rounded_rectangle((72, 64, 124, 116), radius=13, fill=(8, 8, 10), outline=(40, 40, 52), width=2)
    d.ellipse((86, 78, 110, 102), fill=(164, 151, 255))
    d.text((142, 70), "Graphican", font=ImageFont.truetype(FONT_B, 36), fill=(245, 245, 250))
    # category pill
    fp = ImageFont.truetype(FONT_B, 22)
    tw = d.textlength(tag, font=fp)
    d.rounded_rectangle((W - 72 - tw - 36, 70, W - 72, 110), radius=20, fill=(164, 151, 255))
    d.text((W - 72 - tw - 18, 77), tag, font=fp, fill=(16, 12, 40))
    # title: largest size that fits in three lines
    for size in (78, 70, 62, 56, 50):
        ft = ImageFont.truetype(FONT_B, size)
        lines = wrap(d, title, ft, W - 144)
        if len(lines) <= 3:
            break
    y = 250 - (len(lines) - 1) * size * 0.3
    for ln in lines[:3]:
        d.text((72, y), ln, font=ft, fill=(255, 255, 255))
        y += size * 1.18
    fk = ImageFont.truetype(FONT_B, 24)
    d.text((72, H - 118), "ҮНЭГҮЙ  ·  БҮРТГЭЛГҮЙ  ·  ОНЛАЙН", font=fk, fill=(164, 151, 255))
    d.text((72, H - 78), "graphican.online", font=ImageFont.truetype(FONT_R, 24), fill=(150, 150, 170))
    return im


def build():
    os.makedirs(OUT, exist_ok=True)
    n = 0
    for key, title, tag in pages():
        render(title, tag).save(os.path.join(OUT, key + ".jpg"), "JPEG", quality=86, optimize=True)
        n += 1
    return n


if __name__ == "__main__":
    print("og images:", build())
