#!/usr/bin/env python3
"""
Home page (/): a motion-first landing for the creative tools. Fully static, visible HTML — hero with a
morphing product window, tool switcher, problem → result scroll story, tool grid, Mongolian fonts,
templates, workflow and the final call to action. Styles: assets/home.css · behaviour: assets/home.js.
The portfolio lives on /about/ (rendered by app.js).
"""
import json, os
import landings as L

ROOT, SITE, e, ld = L.ROOT, L.SITE, L.e, L.ld
V = "16"

# Home template wall: (photo template id, name, format, width, height, drawn fallback id) in three columns.
# The photo previews are rendered in CI by tpl_previews.py; a slot whose preview is missing shows its fallback.
TPL_SLOTS = [
    ("opening", "Нээлт — story", "Story", 300, 533, "naadam2", 0), ("fashion", "Загвар — editorial", "Instagram пост", 300, 375, "sale", 0),
    ("pizza", "Пицца 1+1", "Квадрат пост", 300, 300, "tsagaansar2", 0), ("travel", "Аялал — Говь", "Instagram пост", 300, 375, "job", 0),
    ("cocktail", "Коктейль үдэш", "Instagram пост", 300, 375, "sport", 0),
    ("finedine", "Fine dining", "Instagram пост", 300, 375, "newyear", 1), ("story", "Бүтээгдэхүүн — story", "Story", 300, 533, "countdown", 1),
    ("dessert", "Шинэ амттан", "Квадрат пост", 300, 300, "kids", 1), ("cashmere", "Монгол ноолуур", "Instagram пост", 300, 375, "menu", 1),
    ("naadam3", "Наадам — фото", "Instagram пост", 300, 375, "tips", 1),
    ("hotelpost", "Зочид буудал", "Instagram пост", 300, 375, "naadam", 2), ("sale2", "Хямдрал — editorial", "Квадрат пост", 300, 300, "notice", 2),
    ("interior", "Интерьер дизайн", "Instagram пост", 300, 375, "giveaway", 2), ("tsagaansar3", "Цагаан сар — тал нутаг", "Instagram пост", 300, 375, "sale3", 2),
    ("coffee3", "Coffee — бараан", "Instagram пост", 300, 375, "tsagaansar", 2), ("testimonial", "Сэтгэгдэл", "Квадрат пост", 300, 300, "course", 2),
]

ICON = {
    "pdf": '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="m9 17 1-3 5-5 2 2-5 5z" fill="currentColor"/>',
    "word": '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 12l1.2 5 1.8-4 1.8 4 1.2-5"/>',
    "up": '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" fill="currentColor"/><path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z" fill="currentColor"/>',
    "bg": '<rect x="3" y="4" width="18" height="16" rx="2" stroke-dasharray="3 2"/><circle cx="12" cy="10" r="3"/><path d="M6.5 20c1-3 3-4.5 5.5-4.5s4.5 1.5 5.5 4.5"/>',
    "crop": '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
    "conv": '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
    "edit": '<path d="M4 20l4.5-1 10-10-3.5-3.5-10 10z"/><path d="M13.5 7l3.5 3.5"/>',
    "tpl": '<rect x="3.5" y="3.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="15.5" width="7" height="5" rx="1.5"/>',
    "font": '<path d="M4 20 9 5h2l5 15M6 15h8"/><circle cx="19" cy="7" r="2.5"/>',
    "color": '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
    "img": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
    "guide": '<path d="M4 5h7v14H4zM13 5h7v6h-7zM13 13h7v6h-7z"/>',
}


def svg(k):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true">{ICON[k]}</svg>'


def thumb(src):
    t = src.replace("/assets/uploads/", "/assets/uploads/_t/") + ".webp"
    return t if os.path.exists(os.path.join(ROOT, t.lstrip("/"))) else src


# PDF actions as compact icon tiles: (slug or path, short label, group, icon path)
TI = {
    "w": '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 12l1.2 5 1.8-4 1.8 4 1.2-5"/>',
    "x": '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="m9.5 12 5 6m0-6-5 6"/>',
    "p": '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M10 18v-6h2.5a1.8 1.8 0 0 1 0 3.6H10"/>',
    "j": '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
    "i2p": '<rect x="3" y="3" width="11" height="11" rx="2"/><path d="m3 11 3-3 5 5"/><path d="M14 10h4l3 3v8H10v-4"/>',
    "w2p": '<path d="M4 4h9v9H4z"/><path d="m6 6 1 5 1.5-3L10 11l1-5"/><path d="M15 10h3l3 3v8H10v-5"/>',
    "e": '<path d="M4 20l4.5-1 10-10-3.5-3.5-10 10z"/><path d="M13.5 7l3.5 3.5"/>',
    "s": '<path d="M3 17c3-4 5-9 7-9s-1 9 2 9 3-3 5-3 2 2 4 2"/><path d="M3 21h18"/>',
    "f": '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5"/><path d="m8 16 1.5 1.5L12 15"/>',
    "wm": '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    "n": '<path d="M6 3h9l4 4v14H6z"/><path d="M10 17h1.5v-5L10 13"/>',
    "m": '<path d="M7 4v6a5 5 0 0 0 5 5 5 5 0 0 1 5 5M17 4v6a5 5 0 0 1-5 5"/>',
    "sp": '<path d="M12 3v18"/><path d="M8 7 4 12l4 5M16 7l4 5-4 5"/>',
    "c": '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
    "t": '<path d="M4 5h9M8.5 3v2c0 4-2 7-5 9M6 9c1.5 3 4 5 7 6"/><path d="m13 21 4-10 4 10M14.5 17.5h5"/>',
    "ai": '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18 15l.8 1.9 1.9.8-1.9.8L18 20.4l-.8-1.9-1.9-.8 1.9-.8z"/>',
    "o": '<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path d="M8 9h8M8 12h8M8 15h5"/>',
    "l": '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    "u": '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
    "cv": '<path d="M4 7h13l-3-3M20 17H7l3 3"/>',
}
TILES = [
    ("pdf-to-word", "PDF → Word", "a", "w"), ("pdf-to-excel", "PDF → Excel", "a", "x"), ("pdf-to-ppt", "PDF → PPT", "a", "p"),
    ("pdf-to-jpg", "PDF → Зураг", "a", "j"), ("jpg-to-pdf", "Зураг → PDF", "a", "i2p"), ("word-to-pdf", "Word → PDF", "a", "w2p"),
    ("edit-pdf", "Засах", "b", "e"), ("sign-pdf", "Гарын үсэг", "b", "s"), ("fill-pdf", "Маягт бөглөх", "b", "f"),
    ("watermark-pdf", "Усан тэмдэг", "b", "wm"), ("pdf-page-numbers", "Дугаарлах", "b", "n"), ("merge-pdf", "Нэгтгэх", "c", "m"),
    ("split-pdf", "Задлах", "c", "sp"), ("compress-pdf", "Шахах", "c", "c"), ("translate-pdf", "Орчуулах", "d", "t"),
    ("summarize-pdf", "AI хураангуй", "d", "ai"), ("pdf-ocr", "Текст таних", "d", "o"), ("protect-pdf", "Нууц үг", "e", "l"),
    ("unlock-pdf", "Түгжээ тайлах", "e", "u"), ("/tools/pdf/", "Хөрвүүлэгч", "a", "cv"),
]
TILES = [t for t in TILES if L.TRANSLATE_ON or t[0] != "translate-pdf"]

# icons of the new home (24px, stroke)
GI = {
    "design": '<path d="M4 20l4.5-1 10-10-3.5-3.5-10 10z"/><path d="M13.5 7l3.5 3.5"/>',
    "pdf": '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    "ppt": '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
    "video": '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',
    "bg": '<rect x="3" y="4" width="18" height="16" rx="2" stroke-dasharray="3 2"/><circle cx="12" cy="10" r="3"/><path d="M6.5 20c1-3 3-4.5 5.5-4.5s4.5 1.5 5.5 4.5"/>',
    "up": '<path d="M4 14v6h6M20 10V4h-6M14 10l6-6M4 20l6-6"/>',
    "crop": '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
    "font": '<path d="M4 20 9 5h2l5 15M6 15h8"/><circle cx="19" cy="7" r="2.5"/>',
    "tpl": '<rect x="3.5" y="3.5" width="7" height="9" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/><rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="15.5" width="7" height="5" rx="1.5"/>',
    "color": '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/>',
    "zip": '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
    "ai": '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M18 15l.8 1.9 1.9.8-1.9.8L18 20.4l-.8-1.9-1.9-.8 1.9-.8z"/>',
    "dl": '<path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19h14"/>',
    "play": '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
}


def build():
    d = json.load(open(os.path.join(ROOT, "content", "site.json"), encoding="utf-8"))
    hm = d.get("home") or {}
    hero, about, contact = d.get("hero", {}), d.get("about", {}), d.get("contact", {})
    title = hm.get("seo_title") or "Graphican — Үнэгүй онлайн PDF, зураг, дизайн хэрэгслүүд"
    desc = hm.get("seo_description") or ("PDF засах, Word болгох, зураг томруулах, дэвсгэр арилгах, монгол фонт, Цагаан сар, Наадмын загвар — "
                                        "бүгд үнэгүй, бүртгэлгүй, монгол хэлээр.")
    img = SITE + "/assets/uploads/og-cover.jpg"
    portrait = about.get("photo") or hero.get("portrait") or ""
    logos = [c for c in (d.get("clients") or {}).get("items", []) if c.get("logo")]
    socials = [s for s in contact.get("socials", []) if s.get("url")]
    stats = about.get("stats") or hero.get("stats") or []

    tools_ld = [("PDF засварлагч", "/tools/pdfedit/"), ("Дизайн засварлагч", "/editor/"), ("AI зураг томруулагч", "/tools/upscale/"),
                ("Дэвсгэр арилгагч", "/tools/bgremove/"), ("Сошиал хэмжээ рүү тайрагч", "/tools/socialcrop/"), ("Видео засварлагч", "/video/"), ("Монгол фонт хайгч", "/tools/mongol-font/"),
                ("Брэндийн өнгө үүсгэгч", "/tools/brand-color/"), ("Монгол сошиал загварууд", "/tools/templates/"), ("PDF хөрвүүлэгч", "/tools/pdf/")] + \
               [(x["h1"], f"/tools/{x['slug']}/") for x in L.PAGES]
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "Graphican", "inLanguage": "mn", "publisher": {"@id": SITE + "/#org"}, "description": desc},
        {"@type": "WebPage", "@id": SITE + "/#page", "url": SITE + "/", "name": title, "description": desc, "inLanguage": "mn", "isPartOf": {"@id": SITE + "/#website"}},
        {"@type": "ItemList", "name": "Үнэгүй дизайн, PDF хэрэгслүүд", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": SITE + u, "name": n} for i, (n, u) in enumerate(tools_ld)]},
        {"@type": "Organization", "@id": SITE + "/#org", "name": "Graphican", "url": SITE + "/", "logo": {"@type": "ImageObject", "url": SITE + "/assets/uploads/logo.png", "width": 512, "height": 512},
         "sameAs": [s["url"] for s in socials]},
    ]}

    # home shows a handful of PDF actions; the full list lives on /tools/
    QUICK = ["pdf-to-word", "pdf-to-excel", "merge-pdf", "compress-pdf", "edit-pdf", "sign-pdf"]
    quick = "".join(f'<a href="/tools/{u}/"><svg viewBox="0 0 24 24" aria-hidden="true">{TI[icn]}</svg>{e(n)}</a>' for q in QUICK for u, n, g, icn in TILES if u == q)
    tiles = "".join(
        f'<a class="hm-tile g{g}" href="{u if u.startswith("/") else "/tools/" + u + "/"}"><span><svg viewBox="0 0 24 24" aria-hidden="true">{TI[ic]}</svg></span><b>{e(n)}</b></a>'
        for u, n, g, ic in TILES)
    email, phone = contact.get("email", ""), contact.get("phone", "")
    soc_h = " · ".join(f'<a href="{e(s["url"])}" target="_blank" rel="noopener me">{e(s.get("name") or "Link")}</a>' for s in socials)

    reviews = (d.get("home_trust") or {}).get("reviews") or []
    def review_card(x):
        photo = f'<span class="ht-avatar ht-avatar-{e(x.get("portrait", ""))}"><img src="{e(x["photo"])}" alt="{e(x["name"])}" width="56" height="56" loading="lazy" decoding="async"></span>' if x.get("photo") else ""
        return f'<figure class="ht-review"><div class="ht-review-top"><span class="ht-tool">{e(x.get("tool", ""))}</span><span class="ht-quote" aria-hidden="true">“</span></div><blockquote>{e(x["text"])}</blockquote><figcaption>{photo}<span><b>{e(x["name"])}</b><small>Graphican хэрэглэгч</small></span></figcaption></figure>'
    review_cards = "".join(review_card(x) for x in reviews if x.get("approved") is True and x.get("text") and x.get("name"))
    review_content = ('<div class="ht-reviews" data-sp>' + review_cards + '</div>') if review_cards else '<p class="ht-review-empty">Та Graphican ашиглаж үзсэн үү? Юу бүтээснээ, аль хэрэгсэл танд тусалсныг хуваалцаарай.</p>'
    TR_LINK = '<a href="/tools/translate-pdf/">PDF орчуулах</a>' if L.TRANSLATE_ON else ""   # PDF translation can be switched off

    # ---------- reusable pieces ----------
    def A(name, step, extra=""):          # one step of a product demo: keyframe name + its place in the sequence
        return f'style="--a:{name};--s:{step}{";" + extra if extra else ""}"'

    def ic(k):
        return f'<svg viewBox="0 0 24 24" aria-hidden="true">{GI[k]}</svg>'

    photo_a, photo_b = "/assets/home/photo-a.webp", "/assets/home/photo-b.webp"   # crops of a client product photo, without the ad text

    def demo_window(cls):
        """DemoWindow — one software window whose artboard morphs between the four tools (data-tool on .gw)."""
        return f"""<div class="gw {cls}" data-gw data-tool="design" aria-hidden="true">
  <div class="gw-bar"><span class="gw-dots"><i></i><i></i><i></i></span>
    <span class="gw-name"><b data-t="design">Постер · Design editor</b><b data-t="pdf">Гэрээ.pdf · PDF editor</b><b data-t="ppt">Танилцуулга · PPT editor</b><b data-t="video">Reel · Video editor</b></span>
    <span class="gw-act an" {A('kPulse', 5)}>{ic('dl')}Татах</span></div>
  <div class="gw-stage">
    <div class="gx gx-design">
      <span class="dz-layers an" {A('kFade', 1)}><i class="on"><u>T</u>Гарчиг</i><i><u>▣</u>Зураг</i><i><u>◼</u>Дэвсгэр</i></span>
      <span class="dz-props an" {A('kFade', 2)}><b>Фонт</b><i class="f an" {A('kOut', 4)}>Inter Tight</i><i class="f on an" {A('kIn', 4)}>Playfair</i><b>Өнгө</b><span class="sw"><u style="background:#7b64ff"></u><u style="background:#f3efe6"></u><u style="background:#12101f"></u><u style="background:#ffb648"></u></span></span>
      <span class="chip c-png an" {A('kPop', 5)}>PNG · JPG · PDF</span>
    </div>
    <div class="gx gx-pdf">
      <span class="pg p1 an" {A('kPop', 1)}><i></i><i></i><i></i><em>1</em></span>
      <span class="pg p2 an" {A('kSwapR', 3)}><i></i><i></i><i></i><em>3</em></span>
      <span class="pg p3 an" {A('kSwapL', 3)}><i></i><i></i><i></i><em>2</em></span>
      <span class="pg p4 an" {A('kPop', 2)}><i></i><i></i><i></i><em>4</em></span>
      <span class="cv an" {A('kPop', 4)}><b>PDF → Word</b><i><u class="an" {A('kBar', 4.4)}></u></i></span>
      <span class="chip c-ok an" {A('kPop', 5.6)}>✓ Татахад бэлэн</span>
    </div>
    <div class="gx gx-ppt">
      <span class="strip"><i class="on an" {A('kPop', 0)}></i><i class="an" {A('kPop', 1)}></i><i class="an" {A('kPop', 1.4)}></i><i class="an" {A('kPop', 1.8)}></i><i class="add an" {A('kPop', 2.2)}>+</i></span>
      <span class="chip c-tr an" {A('kPop', 4)}>⇄ Шилжилт · Анимэйшн</span>
      <span class="chip c-pp an" {A('kPop', 5)}>PowerPoint · PDF</span>
    </div>
    <div class="gx gx-video">
      <span class="tl">
        <span class="row clips"><i class="c1 an" {A('kTrim', 2)}><img src="{photo_b}" alt="" loading="lazy"></i><i class="c2 an" {A('kSlideL', 1)}><img src="{photo_a}" alt="" loading="lazy"></i><i class="c3 an" {A('kSlideL', 1.5)}></i><u class="cut an" {A('kPop', 3)}></u></span>
        <span class="row txt"><i class="an" {A('kGrow', 3.6)}>T · Шинэ цуглуулга</i></span>
        <span class="row aud"><i class="an" {A('kGrow', 4.4)}></i></span>
        <u class="head an" {A('kHead', 0)}></u>
      </span>
    </div>
    <i class="gw-rule t"></i><i class="gw-rule l"></i>
    <div class="gw-frame">
      <div class="gl gl-design">
        <i class="p-bg an" {A('kWipe', 0)}></i>
        <span class="p-img an" {A('kDrop', 1.2)}><img src="{photo_a}" alt="" loading="lazy"></span>
        <span class="p-kick an" {A('kUp', 2.2)}>Шинэ цуглуулга</span>
        <span class="p-title an" {A('kUp', 2.6)}><b class="f1 an" {A('kOut', 4)}>Зуны<br>хямдрал</b><b class="f2 an" {A('kIn', 4)}>Зуны<br>хямдрал</b><i class="p-sel an" {A('kFade', 3.2)}><u></u><u></u><u></u><u></u></i></span>
        <span class="p-tag an" {A('kPop', 3)}>−30%</span>
        <span class="p-foot">graphican.online</span>
      </div>
      <div class="gl gl-pdf">
        <b class="d-h an" {A('kUp', 0)}>Гэрээ</b>
        <i class="an" {A('kLine', .4)}></i><i class="an" {A('kLine', .6)}></i><i class="s an" {A('kLine', .8)}></i><i class="an" {A('kLine', 1)}></i><i class="an" {A('kLine', 1.2)}></i><i class="s an" {A('kLine', 1.4)}></i>
        <svg class="d-sign an" {A('kFade', 2)} viewBox="0 0 120 40"><path d="M4 30c14-22 20-22 22-8s8 10 16-6 10-8 12 4 12 8 22-2 14-6 28 2" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>
        <span class="d-badge"><em class="a an" {A('kOut', 5)}>PDF</em><em class="b an" {A('kIn', 5)}>DOCX</em></span>
      </div>
      <div class="gl gl-ppt">
        <i class="s-bg an" {A('kWipe', 0)}></i>
        <span class="s-copy"><small class="an" {A('kUp', 1)}>2026 · Тайлан</small><b class="an" {A('kUp', 1.4)}>Борлуулалт<br>+48%<u class="caret an" {A('kBlink', 3)}></u></b><em class="an" {A('kUp', 1.9)}>Улирлын үр дүн</em></span>
        <span class="s-chart"><i class="an" {A('kBarUp', 2.4)} ></i><i class="an" {A('kBarUp', 2.6)}></i><i class="an" {A('kBarUp', 2.8)}></i><i class="an" {A('kBarUp', 3)}></i><i class="an" {A('kBarUp', 3.2)}></i></span>
      </div>
      <div class="gl gl-video">
        <img src="{photo_b}" alt="" loading="lazy">
        <span class="v-cap an" {A('kPop', 3.8)}>Шинэ цуглуулга</span>
        <span class="v-play">{ic('play')}</span>
        <i class="v-prog"><u class="an" {A('kBar', 0, '--k:5')}></u></i>
      </div>
    </div>
    <span class="gw-sel"><u></u><u></u><u></u><u></u><em></em></span>
    <i class="gw-cur"></i>
  </div>
</div>"""

    def sec_head(h2, sub="", kicker="", cls=""):
        """SectionHeader"""
        return (f'<header class="sh rv {cls}">' + (f'<p class="sh-k">{kicker}</p>' if kicker else "") + f'<h2>{h2}</h2>' + (f'<p class="sh-s">{sub}</p>' if sub else "") + '</header>')

    def btn(href, label, kind="pri"):
        """PrimaryButton / CTAButton"""
        return f'<a class="bt {kind}" href="{href}"><span>{label}</span><i aria-hidden="true">→</i></a>'

    TOOLS4 = [
        ("design", "Design editor", "Постер, сошиал дизайн, зарлал болон бусад контентоо browser дээрээсээ бүтээ.", "/editor/", "Design хийх"),
        ("pdf", "PDF editor", "PDF-ээ зас, хөрвүүл, нэгтгэ.", "/tools/pdfedit/", "PDF хэрэгсэл"),
        ("ppt", "PPT editor", "Танилцуулгаа эхнээс нь эсвэл бэлэн загвараас бүтээ.", "/slides/", "PPT хийх"),
        ("video", "Video editor", "Бичлэгээ хурдан засаж, нийтлэхэд бэлэн контент болго.", "/video/", "Video засах"),
    ]
    EDEMO = {
        "design": '<span class="m m-design"><i class="cv"></i><b>Гарчиг</b><u></u></span>',
        "pdf": '<span class="m m-pdf"><i></i><i></i><i></i></span>',
        "ppt": '<span class="m m-ppt"><i></i><i></i><i></i></span>',
        "video": '<span class="m m-video"><i class="a"></i><i class="b"></i><i class="c"></i><u></u></span>',
    }
    # the four editors: one large card each (the morphing workspace lives in the hero only)
    editors = "".join(
        f'<a class="tc ed" href="{u}"><span class="tc-demo" aria-hidden="true">{EDEMO[k]}</span>'
        f'<span class="ed-b"><span class="tc-ic">{ic(k)}</span><span class="tc-tx"><b>{n}</b><small>{d}</small></span></span>'
        f'<span class="ed-go">{c}<i aria-hidden="true">→</i></span></a>'
        for k, n, d, u, c in TOOLS4)

    # tool grid: only tools that exist. (key, size, name, line, url, demo html)
    CARDS = [
        ("bg", "sm", "Дэвсгэр арилгах", "Зургийн дэвсгэрийг AI-аар", "/tools/bgremove/", f'<span class="m m-bg"><img src="{e(thumb("/assets/uploads/butafter-shampoo.webp"))}" alt="" loading="lazy"><i></i></span>'),
        ("up", "sm", "AI томруулах", "Зургийг 2×, 4× тод болгох", "/tools/upscale/", '<span class="m m-up"><b>2×</b><b>4×</b></span>'),
        ("crop", "sm", "Сошиал хэмжээ", "Пост, story, cover хэмжээ рүү", "/tools/socialcrop/", '<span class="m m-crop"><i></i></span>'),
        ("font", "sm", "Монгол фонт", "Ө, Ү дэмждэг 178 фонт", "/tools/mongol-font/", '<span class="m m-font"><b>Аа Өө Үү</b><b>Аа Өө Үү</b></span>'),
        ("tpl", "sm", "Монгол загвар", "Цагаан сар, Наадам, зар", "/tools/templates/", '<span class="m m-tpl"><i></i><i></i><i></i></span>'),
        ("zip", "sm", "PDF шахах", "Файлын хэмжээг багасгах", "/tools/compress-pdf/", '<span class="m m-zip"><b>4.2 MB</b><b>1.1 MB</b><i><u></u></i></span>'),
    ]
    cards = "".join(
        f'<a class="tc tc-{sz}" href="{u}"><span class="tc-top"><span class="tc-ic">{ic(k)}</span><span class="tc-tx"><b>{e(n)}</b><small>{e(l)}</small></span><i class="tc-go" aria-hidden="true">→</i></span><span class="tc-demo" aria-hidden="true">{demo}</span></a>'
        for k, sz, n, l, u, demo in CARDS)

    # font wall: real Mongolian-ready fonts from the editor's font set (subset files in /assets/fonts/web/wall/)
    WALL = [
        [("Монгол", "Playfair Display", "playfairdisplay"), ("Ө", "Oswald", "oswald"), ("Дизайн", "Montserrat", "montserrat"), ("Контент", "Lora", "lora"), ("Ү", "Merriweather", "merriweather"), ("Бүтээл", "Nunito", "nunito")],
        [("Өнгө", "Lato", "lato"), ("Загвар", "Oswald", "oswald"), ("Ү", "Playfair Display", "playfairdisplay"), ("Монгол", "Roboto", "roboto"), ("Үсэг", "Mulish", "mulish"), ("Ө", "Lora", "lora")],
        [("Контент", "Source Sans 3", "sourcesans3"), ("Аа Өө Үү", "Merriweather", "merriweather"), ("Дизайн", "Playfair Display", "playfairdisplay"), ("Ө", "Montserrat", "montserrat"), ("Монгол", "Oswald", "oswald"), ("Үсэг", "Nunito", "nunito")],
    ]
    def wall_row(row, i):
        items = "".join(f'<span class="fw-i" style="font-family:\'GW {slug}\',var(--f)" tabindex="0"><b>{e(t)}</b><small>{e(name)}</small></span>' for t, name, slug in row)
        return f'<div class="fw-row r{i}"><div class="fw-track">{items}{items}</div></div>'
    wall = "".join(wall_row(r, i) for i, r in enumerate(WALL))

    # templates: real templates from /tools/templates/ (previews rendered from the template specs)
    TPL = [("naadam2", "Наадам — story", "Story", 300, 533), ("sale", "Хямдрал — acid", "Instagram пост", 300, 375), ("tsagaansar2", "Цагаан сар — минимал", "Квадрат пост", 300, 300),
           ("newyear", "Шинэ он — aurora", "Instagram пост", 300, 375), ("job", "Ажлын зар", "Instagram пост", 300, 375), ("kids", "Хүүхдийн баяр 6.1", "Квадрат пост", 300, 300),
           ("naadam", "Наадам — bold", "Instagram пост", 300, 375), ("menu", "Кафе цэс", "Instagram пост", 300, 375),
           ("countdown", "Тоолол — story", "Story", 300, 533), ("notice", "Мэдэгдэл", "Квадрат пост", 300, 300), ("sport", "Спорт тэмцээн", "Instagram пост", 300, 375),
           ("course", "Сургалтын бүртгэл", "Квадрат пост", 300, 300), ("tips", "Зөвлөгөө", "Instagram пост", 300, 375), ("giveaway", "Бэлэгтэй тоглоом", "Instagram пост", 300, 375),
           ("sale3", "Хямдрал — neon", "Instagram пост", 300, 375), ("tsagaansar", "Цагаан сар — хаан хөх", "Instagram пост", 300, 375)]
    FKEY = {"Instagram пост": "post", "Квадрат пост": "sq", "Story": "story"}
    HOME_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "home")
    def slot(sl):
        pid, name, fmt_, w, h, fb, col = sl
        if os.path.exists(os.path.join(HOME_DIR, f"tplp-{pid}.webp")): return (pid, name, fmt_, w, h, f"tplp-{pid}", col, True)
        f = TBY[fb]; return (f[0], f[1], f[2], f[3], f[4], f"tpl-{f[0]}", col, False)
    TBY = {t[0]: t for t in TPL}
    WALL_T = [slot(sl) for sl in TPL_SLOTS]
    has_photo = any(t[7] for t in WALL_T)
    def tpl_card(t, dup=False):
        i, n, fmt_, w, h, img = t[:6]
        extra = ' aria-hidden="true" tabindex="-1"' if dup else ""
        return (f'<a class="tp" data-f="{FKEY[fmt_]}" href="/editor/?tpl={i}"{extra}><img src="/assets/home/{img}.webp?v={V}" alt="{"" if dup else e(n) + " — " + e(fmt_) + " загвар"}" width="{w}" height="{h}" loading="lazy" decoding="async">'
                f'<span class="tp-meta"><b>{e(n)}</b><small>{e(fmt_)}</small></span><span class="tp-use">Энэ загварыг ашиглах →</span></a>')
    # the wall: three columns of near-equal height, each one a seamless loop (the set is repeated once)
    def wall_col(k):
        col = [t for t in WALL_T if t[6] == k]
        return f'<div class="tw-col c{k}" style="--i:{k}"><div class="tw-track">{"".join(tpl_card(t) for t in col)}{"".join(tpl_card(t, True) for t in col)}</div></div>'
    tpl_wall = "".join(wall_col(k) for k in range(3))
    tpl_credit = '<p class="tw-by">Загварын зураг: <a href="https://www.pexels.com" target="_blank" rel="noopener">Pexels</a></p>' if has_photo else ""
    def nf(key): return sum(1 for t in WALL_T if FKEY[t[2]] == key)
    tpl_chips = (f'<button type="button" class="tf on" data-f="all" aria-pressed="true">Бүгд<small>{len(TPL)}</small></button>'
                 + "".join(f'<button type="button" class="tf" data-f="{k}" aria-pressed="false">{lab}<small>{nf(k)}</small></button>' for k, lab in (("post", "Instagram пост"), ("sq", "Квадрат"), ("story", "Story"))))
    tpl_steps = "".join(f'<li><i>{n}</i><span>{t}</span></li>' for n, t in (("01", "Загвараа сонго"), ("02", "Текст, зураг, өнгөө соль"), ("03", "Татаж аваад нийтэл")))

    # presentation decks that exist in /slides/ (two-colour swatch = the deck's palette)
    DECKS = [("hotel", "Зочид буудал", "#0f0f0e", "#d6b67a"), ("biz", "Бизнес", "#ffffff", "#1646ff"), ("coffee", "Кофе шоп", "#1b120c", "#c8a27a"), ("realty", "Үл хөдлөх", "#ffffff", "#b08d57"),
             ("edu", "Хичээл", "#fff6e5", "#ff7a1a"), ("mongolia", "Монгол аялал", "#141414", "#f4a261"), ("fine", "Fine dining", "#0b0b0b", "#c9a45c")]
    decks = "".join(f'<a href="/slides/?deck={k}"><i style="background:linear-gradient(135deg,{a1} 55%,{a2} 55%)"></i>{e(n)}</a>' for k, n, a1, a2 in DECKS)

    cl = d.get("clients") or {}
    logo_strip = ""
    if logos:
        logo_strip = ('<section class="lg rv" id="clients" data-sp aria-labelledby="lg-t"><p id="lg-t">' + e(cl.get("title") or "Хамтран ажилласан байгууллагууд") + '</p><div class="lg-vp"><div class="lg-row">' +
                      "".join(f'<span class="lg-i"><img src="{e(thumb(x["logo"]))}" alt="{e(x.get("name", ""))}" loading="lazy" decoding="async"></span>' for x in logos) +
                      # a second copy: only shown on phones, where the row runs sideways as one line
                      "".join(f'<span class="lg-i dup" aria-hidden="true"><img src="{e(thumb(x["logo"]))}" alt="" loading="lazy" decoding="async"></span>' for x in logos) + '</div></div></section>')

    story = """<section class="fp" id="flow" data-sp="pin" data-st="3" aria-labelledby="fp-t">
    <div class="fp-in">
      <div class="fp-copy">
        <h2 class="fp-k" id="fp-t">Санаанаас бүтээл хүртэл</h2>
        <ol class="fp-steps">
          <li><span>01</span><h3>Эхлэ.</h3><p>Хэмжээгээ сонго — хоосон хуудас эсвэл бэлэн загвар.</p></li>
          <li><span>02</span><h3>Бүтээ.</h3><p>Зураг, текст, монгол фонтоо нэмээд өөрийнхөөрөө зас.</p></li>
          <li><span>03</span><h3>Өргөжүүл.</h3><p>Постер, PDF, илтгэл, видео — дөрвөн editor нэг дор.</p></li>
          <li><span>04</span><h3>Тат.</h3><p>PNG, PDF, PPTX, MP4 — шууд төхөөрөмждөө.</p></li>
        </ol>
        <div class="fp-prog" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      </div>
      <svg class="fp-svg" viewBox="0 0 800 820" aria-hidden="true">
        <defs><clipPath id="fp-clip"><rect x="250" y="60" width="300" height="375" rx="6"/></clipPath>
          <linearGradient id="fp-vg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#34229e"/><stop offset="1" stop-color="#a497ff"/></linearGradient><radialGradient id="fp-gl"><stop offset="0" stop-color="#6d56fa" stop-opacity=".55"/><stop offset=".55" stop-color="#34229e" stop-opacity=".22"/><stop offset="1" stop-color="#34229e" stop-opacity="0"/></radialGradient></defs><ellipse class="fp-glow" cx="400" cy="250" rx="380" ry="300" fill="url(#fp-gl)"/>
        <g class="fp-nodes"><g class="fp-n" style="--i:0"><path class="fp-con dl" pathLength="1" d="M400 300C400 430, 115 441, 115 563"/><circle class="fp-dot" r="3.5" style="offset-path:path('M400 300C400 430, 115 441, 115 563')"/><clipPath id="fp-c0"><rect x="60" y="571" width="110" height="138" rx="5"/></clipPath><g class="fp-fill" clip-path="url(#fp-c0)"><rect x="60" y="571" width="110" height="138" fill="#12101f"/><polygon points="60,668 170,640 170,709 60,709" fill="#7b64ff"/><rect x="70" y="583" width="90" height="48" rx="2" fill="#3b3560"/><rect x="70" y="646" width="56" height="7" rx="2" fill="#fff"/><rect x="70" y="658" width="40" height="7" rx="2" fill="#fff"/></g><rect class="fp-out dl" pathLength="1" x="60" y="571" width="110" height="138" rx="5"/><text class="fp-lab" x="115" y="748" text-anchor="middle">Design</text><g class="fp-chip"><rect x="81" y="766" width="68" height="28" rx="14"/><path d="M95 775v8m-3.5-3.5 3.5 3.5 3.5-3.5"/><text x="120" y="785" text-anchor="middle">PNG</text></g></g><g class="fp-n" style="--i:1"><path class="fp-con dl" pathLength="1" d="M400 300C400 440, 305 436, 305 558"/><circle class="fp-dot" r="3.5" style="offset-path:path('M400 300C400 440, 305 436, 305 558')"/><clipPath id="fp-c1"><rect x="253" y="566" width="104" height="147" rx="5"/></clipPath><g class="fp-fill" clip-path="url(#fp-c1)"><rect x="253" y="566" width="104" height="147" fill="#f5f4fa"/><rect x="265" y="580" width="34" height="8" rx="2" fill="#12101f"/><g fill="#c9c6d8"><rect x="265" y="598" width="80" height="4" rx="2"/><rect x="265" y="608" width="80" height="4" rx="2"/><rect x="265" y="618" width="52" height="4" rx="2"/><rect x="265" y="634" width="80" height="4" rx="2"/><rect x="265" y="644" width="66" height="4" rx="2"/></g><path d="M266 686c8-14 12-14 14-4s6 6 11-4 7-5 9 3 8 5 14-1" fill="none" stroke="#7b64ff" stroke-width="2" stroke-linecap="round"/><rect x="325" y="575" width="24" height="12" rx="3" fill="#7b64ff"/></g><rect class="fp-out dl" pathLength="1" x="253" y="566" width="104" height="147" rx="5"/><text class="fp-lab" x="305" y="748" text-anchor="middle">PDF</text><g class="fp-chip"><rect x="271" y="766" width="68" height="28" rx="14"/><path d="M285 775v8m-3.5-3.5 3.5 3.5 3.5-3.5"/><text x="310" y="785" text-anchor="middle">PDF</text></g></g><g class="fp-n" style="--i:2"><path class="fp-con dl" pathLength="1" d="M400 300C400 430, 495 468, 495 590"/><circle class="fp-dot" r="3.5" style="offset-path:path('M400 300C400 430, 495 468, 495 590')"/><clipPath id="fp-c2"><rect x="420" y="598" width="150" height="84" rx="5"/></clipPath><g class="fp-fill" clip-path="url(#fp-c2)"><rect x="420" y="598" width="150" height="84" fill="#12101f"/><polygon points="504,598 570,598 570,682 478,682" fill="#f5f4fa"/><rect x="432" y="614" width="40" height="7" rx="2" fill="#fff"/><rect x="432" y="626" width="28" height="7" rx="2" fill="#fff"/><g fill="#7b64ff"><rect x="520" y="650" width="8" height="22" rx="1" opacity=".45"/><rect x="532" y="640" width="8" height="32" rx="1" opacity=".7"/><rect x="544" y="624" width="8" height="48" rx="1"/></g></g><rect class="fp-out dl" pathLength="1" x="420" y="598" width="150" height="84" rx="5"/><text class="fp-lab" x="495" y="748" text-anchor="middle">PPT</text><g class="fp-chip"><rect x="461" y="766" width="68" height="28" rx="14"/><path d="M475 775v8m-3.5-3.5 3.5 3.5 3.5-3.5"/><text x="500" y="785" text-anchor="middle">PPTX</text></g></g><g class="fp-n" style="--i:3"><path class="fp-con dl" pathLength="1" d="M400 300C400 440, 685 435, 685 557"/><circle class="fp-dot" r="3.5" style="offset-path:path('M400 300C400 440, 685 435, 685 557')"/><clipPath id="fp-c3"><rect x="643" y="565" width="84" height="150" rx="5"/></clipPath><g class="fp-fill" clip-path="url(#fp-c3)"><rect x="643" y="565" width="84" height="150" fill="url(#fp-vg)"/><circle cx="685" cy="632" r="15" fill="rgba(10,10,16,.55)"/><path d="M680 624v16l13-8z" fill="#fff"/><rect x="653" y="686" width="64" height="12" rx="3" fill="#fff"/><rect x="653" y="703" width="64" height="3" rx="1.5" fill="rgba(255,255,255,.35)"/><rect x="653" y="703" width="38" height="3" rx="1.5" fill="#fff"/></g><rect class="fp-out dl" pathLength="1" x="643" y="565" width="84" height="150" rx="5"/><text class="fp-lab" x="685" y="748" text-anchor="middle">Video</text><g class="fp-chip"><rect x="651" y="766" width="68" height="28" rx="14"/><path d="M665 775v8m-3.5-3.5 3.5 3.5 3.5-3.5"/><text x="690" y="785" text-anchor="middle">MP4</text></g></g></g>
        <g class="fp-board">
          <g clip-path="url(#fp-clip)"><rect class="fp-bg" x="250" y="60" width="300" height="375" fill="#12101f"/><polygon class="fp-bg" points="250,332 550,250 550,435 250,435" fill="#7b64ff"/>
            <image class="fp-img" href="/assets/home/photo-a.webp" x="274" y="84" width="252" height="160" preserveAspectRatio="xMidYMid slice"/></g>
          <g class="fp-crop"><path d="M236 60h-16M250 46v-16M564 60h16M550 46v-16M236 435h-16M250 449v16M564 435h16M550 449v16"/></g>
          <g class="fp-guide"><path d="M400 34v427M224 247h352"/></g>
          <g class="fp-ph"><rect class="dl" pathLength="1" x="274" y="84" width="252" height="160" rx="3"/><path class="dl" pathLength="1" d="M274 84l252 160"/><path class="dl" pathLength="1" d="M526 84l-252 160"/></g>
          <g class="fp-bars"><rect x="274" y="276" width="170" height="18" rx="3"/><rect x="274" y="304" width="120" height="18" rx="3"/><rect x="274" y="342" width="90" height="8" rx="3"/></g>
          <g class="fp-txt"><text class="k" x="274" y="282">ШИНЭ ЦУГЛУУЛГА</text><text class="h" x="273" y="322">Зуны</text><text class="h" x="273" y="362">хямдрал</text></g>
          <g class="fp-tag"><circle cx="502" cy="254" r="30" fill="#ffb648"/><text x="502" y="260" text-anchor="middle">−30%</text></g>
          <g class="fp-sel"><rect x="265" y="290" width="186" height="82"/><path d="M262 287h6v6h-6zM448 287h6v6h-6zM262 369h6v6h-6zM448 369h6v6h-6z"/></g>
          <rect class="fp-frame dl" pathLength="1" x="250" y="60" width="300" height="375" rx="6"/>
          <g class="fp-dim"><path d="M250 474h300M250 468v12M550 468v12"/><text x="400" y="498" text-anchor="middle">1080 × 1350</text></g>
        </g>
      </svg>
    </div>
  </section>"""

    header = f"""<header class="gh header" id="gh">
  <a class="gh-logo" href="/" aria-label="Graphican — нүүр">Graphican</a>
  <nav class="gh-nav" id="gh-nav" aria-label="Үндсэн цэс">
    <a href="/tools/">Хэрэгслүүд</a><a href="/tools/templates/">Загварууд</a><a href="/tools/mongol-font/">Фонт</a><a href="/design/">Нөөц</a>
  </nav>
  <a class="bt pri sm header-cta" href="/editor/"><span>Үнэгүй эхлэх</span><i aria-hidden="true">→</i></a>
  <button class="gh-menu" id="gh-menu" type="button" aria-label="Цэс" aria-expanded="false" aria-controls="gh-nav"><i></i><i></i></button>
</header>"""

    body = f"""
<main class="hp" id="main">

  <!-- 01 HERO -->
  <section class="hero" id="top" data-sp="exit">
    <div class="fxl" aria-hidden="true"><i class="beam"></i><svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"><circle cx="-120" cy="-380" r="900"/><circle cx="1620" cy="1500" r="1050"/></svg></div>
    <div class="grid-bg" aria-hidden="true"></div>
    <div class="hero-in">
      <div class="hero-copy">
        <h1 aria-label="Хэрэгтэйгээ шууд бүтээ."><span aria-hidden="true"><span class="nw"><span class="bl" style="--b:3">Х</span><span class="bl" style="--b:2.2">э</span><span class="bl" style="--b:1.4">р</span><span class="bl" style="--b:0.7">э</span><span class="bl" style="--b:0">г</span>тэйгээ</span><br><span class="nw">шууд бүтээ.</span></span></h1>
        <p class="hero-s"><b>Design · PDF · PPT · Video</b>Бүтээх, засах, хөрвүүлэх хэрэгслүүд нэг дор.</p>
        <div class="hero-cta">{btn("/editor/", "Үнэгүй эхлэх")}<a class="bt ghost" href="#editors"><span>Бүх хэрэгсэл</span></a></div>
      </div>
      <div class="hero-vis" id="hero-vis">
        <div class="hero-glow" aria-hidden="true"></div>
        {demo_window("gw--hero")}
        <div class="hero-tabs" role="group" aria-label="Жишээ харах хэрэгсэл">
          <button type="button" data-tool="design" class="on" aria-pressed="true">{ic("design")}Design</button><button type="button" data-tool="pdf" aria-pressed="false">{ic("pdf")}PDF</button><button type="button" data-tool="ppt" aria-pressed="false">{ic("ppt")}PPT</button><button type="button" data-tool="video" aria-pressed="false">{ic("video")}Video</button>
        </div>
      </div>
    </div>
  </section>

  {logo_strip}

  <!-- scroll story: an empty page is drawn, filled, branches into the four editors and leaves as files -->
  {story}

  <!-- 02 MAIN 4 EDITORS -->
  <section class="sec eds" id="editors">
    {sec_head("Юу хийх хэрэгтэй вэ?", "Хэрэгтэй зүйлээ сонгоод шууд эхэл.")}
    <div class="edg" data-sp>{editors}</div>
  </section>

  <!-- 03 QUICK TOOLS -->
  <section class="sec tools" id="tools">
    {sec_head("Өдөр тутмын хэрэгтэй хэрэгслүүд.")}
    <div class="tg" data-sp>{cards}</div>
    <nav class="ql rv" aria-label="PDF хэрэгслүүд"><b>PDF</b>{quick}<a class="ql-all" href="/tools/">+ Бүх хэрэгсэл</a></nav>
  </section>

  <!-- 04 MONGOLIAN ADVANTAGE -->
  <section class="sec mn" id="mongol" data-sp>
    <div class="mn-in">
      <div class="mn-copy rv">
        <h2>Монгол контентод<br>зориулсан.</h2>
        <p>Монгол хэл дээр ажиллахад хэрэгтэй фонт, загвар, хэрэгслүүдийг нэг дор.</p>
        <div class="mn-num"><strong id="mn-count" data-to="178">178</strong><span>монгол фонт<small>Ө, Ү үсэг эвдрэхгүй</small></span></div>
        {btn("/tools/mongol-font/", "Монгол фонтууд", "dark")}
      </div>
      <div class="fw" id="fw" aria-label="Монгол фонтын жишээ">{wall}</div>
    </div>
  </section>

  <!-- 05 TEMPLATES -->
  <section class="sec tpl" id="templates">
    <div class="tpl-g">
      <div class="tpl-copy">
        {sec_head("Эхнээс нь хийх албагүй.", "Бэлэн загвараас эхлээд өөрийнхөөрөө өөрчил.")}
        <ol class="tpl-steps rv">{tpl_steps}</ol>
        <div class="tfs rv" role="group" aria-label="Загварын хэмжээ">{tpl_chips}</div>
        <div class="sec-cta rv">{btn("/tools/templates/", "Бүх загвар", "ghost")}</div>
      </div>
      <div class="tw" id="tp-wrap" data-sp data-f="all"><div class="tw-in">{tpl_wall}</div></div>
      {tpl_credit}
    </div>
    <div class="dk rv"><b>Илтгэл (PPT)</b>{decks}<a class="ql-all" href="/slides/">+ Бүх илтгэл</a></div>
  </section>

  <!-- 06 TRUST: downloads + testimonials -->
  <section class="sec rvw" id="reviews" aria-labelledby="ht-review-title">
    <header class="sh rv"><h2 id="ht-review-title">Хэрэглэгчдийн сэтгэгдэл</h2></header>
    <div class="rvw-b">{review_content}</div>
    <div class="ht-stats rv" id="downloads" aria-labelledby="ht-download-title">
      <h3 id="ht-download-title">Нийт файлын таталт</h3>
      <div class="ht-number"><strong id="ht-downloads" aria-describedby="ht-download-title">—</strong><span>удаа</span></div>
      <small id="ht-stat-note" aria-live="polite">Таталтын тоог ачаалж байна…</small>
    </div>
  </section>

  <!-- 07 FINAL CTA -->
  <section class="sec fin" id="start" data-sp>
    <div class="fxl" aria-hidden="true"><i class="beam"></i><svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"><circle cx="720" cy="1700" r="1150" pathLength="1"/><circle cx="720" cy="1900" r="1150" pathLength="1"/></svg></div>
    <div class="grid-bg" aria-hidden="true"></div>
    <span class="fin-bloom" aria-hidden="true"><i class="pl" style="--w:240px;--hh:330px;--r:-38deg;--c:96,92,255;--a:.5;--t:9s"></i><i class="pl" style="--w:240px;--hh:330px;--r:36deg;--c:176,120,255;--a:.46;--t:11s"></i><i class="pl" style="--w:190px;--hh:430px;--r:-17deg;--c:124,100,255;--a:.72;--t:7.5s"></i><i class="pl" style="--w:180px;--hh:400px;--r:15deg;--c:170,155,255;--a:.66;--t:8.5s"></i><i class="pl" style="--w:130px;--hh:480px;--r:-2deg;--c:236,230,255;--a:.6;--t:6.5s"></i><i class="halo"></i><i class="core"></i><i class="hot"></i><i class="streak"></i><i class="line"></i><span class="refl"><i class="rh"></i><i class="rc"></i></span><span class="sparks"><b style="--x:-120px;--d:0s;--t:7.5s"></b><b style="--x:-58px;--d:2.1s;--t:6.2s"></b><b style="--x:-16px;--d:4s;--t:8s"></b><b style="--x:24px;--d:1s;--t:6.8s"></b><b style="--x:66px;--d:3s;--t:7.2s"></b><b style="--x:128px;--d:5s;--t:6.4s"></b></span></span>
    <div class="fin-anim" id="fin-anim" aria-hidden="true"><i class="w1">{ic("design")}</i><i class="w2">{ic("pdf")}</i><i class="w3">{ic("ppt")}</i><i class="w4">{ic("video")}</i><b>Graphican</b></div>
    <h2 class="rv">Хийх зүйлээ<br>эхлүүл.</h2>
    <div class="fin-btns rv">
      <a class="fb" href="/editor/">{ic("design")}<span>Design хийх</span><i aria-hidden="true">→</i></a>
      <a class="fb" href="/tools/pdfedit/">{ic("pdf")}<span>PDF засах</span><i aria-hidden="true">→</i></a>
      <a class="fb" href="/slides/">{ic("ppt")}<span>PPT хийх</span><i aria-hidden="true">→</i></a>
      <a class="fb" href="/video/">{ic("video")}<span>Video засах</span><i aria-hidden="true">→</i></a>
    </div>
    <p class="fin-url">graphican.online</p>
  </section>

  <section class="collab" id="collab" data-sp>
    <div><h2>Мэргэжлийн дизайн хэрэгтэй юу?</h2><p>Лого · брэнд айдентити · сошиал дизайн · видео</p></div>
    <div class="collab-b"><a class="bt pri" href="/about/"><span>Хамтран ажиллах</span><i aria-hidden="true">→</i></a><a class="bt txt" href="/about/#work"><span>Ажлууд</span><i aria-hidden="true">→</i></a></div>
  </section>
</main>

<footer class="ft">
  <svg class="ft-word" viewBox="0 0 1200 300" data-sp aria-hidden="true"><g class="gd"><path d="M30 64h1140M30 236h1140M60 30v240M1140 30v240"/><path d="M52 64h16M60 56v16M1132 64h16M1140 56v16M52 236h16M60 228v16M1132 236h16M1140 228v16"/></g><text x="600" y="236" text-anchor="middle" textLength="1060" lengthAdjust="spacingAndGlyphs">Graphican</text></svg>
  <div class="ft-top"><a class="gh-logo" href="/" aria-label="Graphican — нүүр">Graphican</a><p>Дизайн, PDF, PPT, Video — үнэгүй, бүртгэлгүй, монгол хэлээр.</p></div>
  <div class="ft-cols rv">
    <div><b>Хэрэгслүүд</b><a href="/editor/">Design editor</a><a href="/tools/pdfedit/">PDF засварлагч</a><a href="/slides/">Илтгэл (PPT)</a><a href="/video/">Видео засварлагч</a><a href="/tools/bgremove/">Дэвсгэр арилгах</a><a href="/tools/upscale/">AI томруулах</a><a href="/tools/socialcrop/">Сошиал хэмжээ</a><a href="/tools/">Бүх хэрэгсэл</a></div>
    <div><b>PDF</b><a href="/tools/pdf-to-word/">PDF → Word</a><a href="/tools/merge-pdf/">PDF нэгтгэх</a><a href="/tools/compress-pdf/">PDF шахах</a><a href="/tools/sign-pdf/">Гарын үсэг</a><a href="/tools/pdf/">PDF ⇄ зураг</a>{TR_LINK}</div>
    <div><b>Нөөц</b><a href="/tools/templates/">Монгол загвар</a><a href="/tools/mongol-font/">Монгол фонт</a><a href="/tools/brand-color/">Брэндийн өнгө</a><a href="/design/">Design guide</a></div>
    <div><b>Graphican</b><a href="/about/">Хамтран ажиллах</a><a href="/about/#work">Ажлууд</a><a href="/support/">Дэмжих</a>{f'<a href="mailto:{e(email)}">{e(email)}</a>' if email else ''}{f'<a href="tel:+976{e(phone)}">{e(phone)}</a>' if phone else ''}</div>
    <div><b>Эрх зүй</b><a href="/privacy/">Нууцлал</a><a href="/terms/">Нөхцөл</a></div>
  </div>
  <p class="ft-copy"><span>© Graphican · graphican.online</span><span>{soc_h}</span></p>
</footer>
"""
    html = f"""<!DOCTYPE html>
<html lang="mn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{SITE}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Graphican">
<meta property="og:locale" content="mn_MN">
<meta property="og:url" content="{SITE}/">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:image" content="{img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(title)}">
<meta name="twitter:description" content="{e(desc)}">
<meta name="twitter:image" content="{img}">
{ld(graph)}
<script>(function(){{var h=location.hash;if(location.hostname==='www.graphican.online'){{location.replace('https://graphican.online'+location.pathname+location.search+h);return}}if(/^#(work|reels|services|about|contact|project\\/)/.test(h))location.replace('/about/'+h)}})()</script>
<script src="/assets/i18n.js?v=1"></script>
<meta name="theme-color" content="#0a0a10">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/web/InterTight-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/web/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts/web/fonts.css">
<link rel="stylesheet" href="/assets/home.css?v={V}">
</head>
<body class="home-page">
<a class="skip" href="#main">Агуулга руу очих</a>
<i class="sp-bar" aria-hidden="true"></i>
<nav class="rail" id="rail" aria-label="Хуудасны хэсгүүд"></nav>
{header}
{body}
<script src="/assets/home.js?v={V}" defer></script>
<script src="/assets/home-trust.js?v=3" defer></script>
</body>
</html>
"""
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(html)


if __name__ == "__main__":
    build()
    print("home ok")
