#!/usr/bin/env python3
"""Shared site chrome — the header and footer every page uses (styles: assets/site.css · behaviour: assets/site.js).
The home page carries the same rules in home.css / home.js."""
import html, json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CV = "3"   # site.css / site.js cache version


def e(s):
    return html.escape(str(s or ""), quote=True)


def header(cls="gh"):
    return f"""<header class="{cls}" id="gh">
  <a class="gh-logo" href="/" aria-label="Graphican — нүүр">Graphican</a>
  <nav class="gh-nav" id="gh-nav" aria-label="Үндсэн цэс">
    <a href="/tools/">Хэрэгслүүд</a><a href="/tools/templates/">Загварууд</a><a href="/tools/mongol-font/">Фонт</a><a href="/design/">Нөөц</a>
  </nav>
  <a class="bt pri sm gh-cta" href="/editor/"><span>Үнэгүй эхлэх</span><i aria-hidden="true">→</i></a>
  <button class="gh-menu" id="gh-menu" type="button" aria-label="Цэс" aria-expanded="false" aria-controls="gh-nav"><i></i><i></i></button>
</header>"""


def footer(translate_on=True):
    d = json.load(open(os.path.join(ROOT, "content", "site.json"), encoding="utf-8"))
    contact = d.get("contact") or {}
    email, phone = contact.get("email", ""), contact.get("phone", "")
    socials = [s for s in (contact.get("socials") or []) if s.get("url")]
    soc_h = " · ".join(f'<a href="{e(s["url"])}" target="_blank" rel="noopener me">{e(s.get("name") or "Link")}</a>' for s in socials)
    tr = '<a href="/tools/translate-pdf/">PDF орчуулах</a>' if translate_on else ""
    return f"""<footer class="ft">
  <svg class="ft-word" viewBox="0 0 1200 300" data-sp aria-hidden="true"><g class="gd"><path d="M30 64h1140M30 236h1140M60 30v240M1140 30v240"/><path d="M52 64h16M60 56v16M1132 64h16M1140 56v16M52 236h16M60 228v16M1132 236h16M1140 228v16"/></g><text x="600" y="236" text-anchor="middle" textLength="1060" lengthAdjust="spacingAndGlyphs">Graphican</text></svg>
  <div class="ft-top"><a class="gh-logo" href="/" aria-label="Graphican — нүүр">Graphican</a><p>Дизайн, PDF, PPT, Video — үнэгүй, бүртгэлгүй, монгол хэлээр.</p></div>
  <div class="ft-cols rv">
    <div><b>Хэрэгслүүд</b><a href="/editor/">Design editor</a><a href="/tools/pdfedit/">PDF засварлагч</a><a href="/slides/">Илтгэл (PPT)</a><a href="/video/">Видео засварлагч</a><a href="/tools/bgremove/">Дэвсгэр арилгах</a><a href="/tools/upscale/">AI томруулах</a><a href="/tools/socialcrop/">Сошиал хэмжээ</a><a href="/tools/">Бүх хэрэгсэл</a></div>
    <div><b>PDF</b><a href="/tools/pdf-to-word/">PDF → Word</a><a href="/tools/merge-pdf/">PDF нэгтгэх</a><a href="/tools/compress-pdf/">PDF шахах</a><a href="/tools/sign-pdf/">Гарын үсэг</a><a href="/tools/pdf/">PDF ⇄ зураг</a>{tr}</div>
    <div><b>Нөөц</b><a href="/tools/templates/">Монгол загвар</a><a href="/tools/mongol-font/">Монгол фонт</a><a href="/tools/brand-color/">Брэндийн өнгө</a><a href="/design/">Design guide</a></div>
    <div><b>Graphican</b><a href="/about/">Хамтран ажиллах</a><a href="/about/#work">Ажлууд</a><a href="/support/">Дэмжих</a>{f'<a href="mailto:{e(email)}">{e(email)}</a>' if email else ''}{f'<a href="tel:+976{e(phone)}">{e(phone)}</a>' if phone else ''}</div>
    <div><b>Эрх зүй</b><a href="/privacy/">Нууцлал</a><a href="/terms/">Нөхцөл</a></div>
  </div>
  <p class="ft-copy"><span>© Graphican · graphican.online</span><span>{soc_h}</span></p>
</footer>"""


# the light behind a page's first screen
LIGHT = '<div class="fxl lp-fx" aria-hidden="true"><i class="beam"></i><svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"><circle cx="-120" cy="-380" r="900"/><circle cx="1620" cy="1500" r="1050"/></svg></div>'
CSS = f'<link rel="stylesheet" href="/assets/site.css?v={CV}">'
JS = f'<script src="/assets/site.js?v={CV}"></script>'
