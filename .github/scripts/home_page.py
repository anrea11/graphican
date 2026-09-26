#!/usr/bin/env python3
"""
Tools-first home page (/). Fully static, visible HTML: one "drop any file" box that suggests
what to do with it, then the tools grouped as PDF · Зураг · Дизайн, and a short band that leads
to the collaboration page (/about/). The portfolio lives on /about/ (rendered by app.js).
"""
import json, os
import landings as L

ROOT, SITE, e, ld = L.ROOT, L.SITE, L.e, L.ld
V = "4"

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


def build():
    d = json.load(open(os.path.join(ROOT, "content", "site.json"), encoding="utf-8"))
    hm = d.get("home") or {}
    hero, about, contact = d.get("hero", {}), d.get("about", {}), d.get("contact", {})
    title = hm.get("seo_title") or "Graphican — Үнэгүй онлайн PDF, зураг, дизайн хэрэгслүүд"
    desc = hm.get("seo_description") or ("PDF засах, Word болгох, орчуулах, зураг томруулах, дэвсгэр арилгах, монгол фонт, брэндийн өнгө, "
                                        "Цагаан сар, Наадмын загвар — бүгд үнэгүй, бүртгэлгүй, монгол хэлээр. Файл тань компьютерээс гарахгүй.")
    img = SITE + "/assets/uploads/og-cover.jpg"
    portrait = about.get("photo") or hero.get("portrait") or ""
    logos = [c for c in (d.get("clients") or {}).get("items", []) if c.get("logo")]
    socials = [s for s in contact.get("socials", []) if s.get("url")]
    stats = about.get("stats") or hero.get("stats") or []

    tools_ld = [("PDF засварлагч", "/tools/pdfedit/"), ("Дизайн засварлагч", "/editor/"), ("AI зураг томруулагч", "/tools/upscale/"),
                ("Дэвсгэр арилгагч", "/tools/bgremove/"), ("Сошиал хэмжээ рүү тайрагч", "/tools/socialcrop/"), ("Монгол фонт хайгч", "/tools/mongol-font/"),
                ("Брэндийн өнгө үүсгэгч", "/tools/brand-color/"), ("Монгол сошиал загварууд", "/tools/templates/"), ("PDF хөрвүүлэгч", "/tools/pdf/")] + \
               [(x["h1"], f"/tools/{x['slug']}/") for x in L.PAGES]
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "Graphican", "inLanguage": "mn", "publisher": {"@id": SITE + "/#org"}, "description": desc},
        {"@type": "WebPage", "@id": SITE + "/#page", "url": SITE + "/", "name": title, "description": desc, "inLanguage": "mn", "isPartOf": {"@id": SITE + "/#website"}},
        {"@type": "ItemList", "name": "Үнэгүй дизайн, PDF хэрэгслүүд", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": SITE + u, "name": n} for i, (n, u) in enumerate(tools_ld)]},
        {"@type": "Organization", "@id": SITE + "/#org", "name": "Graphican", "url": SITE + "/", "logo": SITE + "/assets/uploads/anhbayar-hero-2.webp",
         "sameAs": [s["url"] for s in socials]},
    ]}

    tiles = "".join(
        f'<a class="hm-tile g{g}" href="{u if u.startswith("/") else "/tools/" + u + "/"}"><span><svg viewBox="0 0 24 24" aria-hidden="true">{TI[ic]}</svg></span><b>{e(n)}</b></a>'
        for u, n, g, ic in TILES)
    email, phone = contact.get("email", ""), contact.get("phone", "")
    soc_h = " · ".join(f'<a href="{e(s["url"])}" target="_blank" rel="noopener me">{e(s.get("name") or "Link")}</a>' for s in socials)

    body = f"""
<div id="hero-slot"><section class="hero hero-v2 hm-hero-ph" aria-hidden="true"></section></div>

<main class="hm" id="main">
  <section class="hm-tools" id="tools">
    <p class="hm-kicker">ҮНЭГҮЙ · БҮРТГЭЛГҮЙ · МОНГОЛ ХЭЛЭЭР</p>
    <h1>Дизайн хэрэгслүүд</h1>
    <p class="hm-lead">PDF · зураг · дизайн — бүгд үнэгүй, бүртгэлгүй.</p>
    <nav class="hm-jump"><a href="#editor">Засварлагч</a><a href="#pdf">PDF</a><a href="#image">Зураг</a><a href="#design">Дизайн</a></nav>
  </section>

  <section class="hm-sec hm-editor" id="editor">
    <div class="he-copy">
      <p class="hm-kicker">ОНЛАЙН ЗАСВАРЛАГЧ · ҮНЭГҮЙ</p>
      <h2>Пост, постероо<br><em>өөрөө хий.</em></h2>
      <p class="he-lead">Instagram пост, story, зар, мэндчилгээ, нэрийн хуудсыг програм суулгалгүй хөтөч дээрээ бүтээгээд PNG, PDF-ээр татаарай.</p>
      <ul class="he-feats">
        <li><span>{svg("tpl")}</span><b>60+ бэлэн загвар</b><small>Цагаан сар, Наадам, зар</small></li>
        <li><span>{svg("font")}</span><b>178 монгол фонт</b><small>Ө, Ү эвдрэхгүй</small></li>
        <li><span>{svg("bg")}</span><b>AI хэрэгсэл</b><small>Дэвсгэр арилгах, тодруулах</small></li>
        <li><span>{svg("img")}</span><b>Үнэгүй зураг</b><small>Сая сая фото, видео</small></li>
      </ul>
      <div class="he-btns"><a class="hm-btn" href="/editor/">Засварлагч нээх <i>→</i></a><a class="hm-btn ghost" href="/tools/templates/">Загвараас эхлэх</a></div>
    </div>
    <a class="he-mock" href="/editor/?tpl=tsagaansar" aria-label="Цагаан сарын загварыг засварлагчид нээх">
      <span class="em">
        <span class="em-top"><i class="em-logo"></i><b>Цагаан сарын мэнд</b><span class="grow"></span><em>65%</em><strong>Татах</strong></span>
        <span class="em-body">
          <span class="em-left"><span class="em-tabs"><i class="on">Давхарга</i><i>Нэмэх</i><i>Загвар</i></span>
            <span class="em-ly on"><u>T</u>САР ШИНЭДЭЭ…</span><span class="em-ly"><u>T</u>Баярын мэнд</span><span class="em-ly"><u>◇</u>Чимэглэл</span><span class="em-ly"><u>▢</u>Хүрээ</span><span class="em-ly"><u>▢</u>Хүрээ</span></span>
          <span class="em-canvas">
            <span class="em-poster"><i class="b1"></i><i class="b2"></i><i class="dia"></i>
              <span class="em-title">САР ШИНЭДЭЭ<br>САЙХАН ШИНЭЛЖ<br>БАЙНА УУ<span class="em-selbox"><i></i><i></i><i></i><i></i></span></span>
              <i class="ln"></i><span class="em-sub">Цагаан сарын баярын мэнд хүргэе!</span><span class="em-org">БАЙГУУЛЛАГЫН НЭР</span></span>
            <i class="em-cursor"></i>
          </span>
          <span class="em-right"><b>Текст</b><span class="em-field">Montserrat <small>Ө Ү ✓</small></span><span class="em-row2"><span class="em-field">Bold</span><span class="em-field">88</span></span>
            <b>Өнгө</b><span class="em-sws"><i style="background:#f6e7c1"></i><i style="background:#e0a526"></i><i style="background:#13306b"></i><i style="background:#c8102e"></i><i style="background:#fff"></i></span>
            <b>Эффект</b><span class="em-field">Сүүдэр</span><span class="em-field">Градиент</span></span>
        </span>
        <span class="em-dock"><i class="on"></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
      </span>
      <span class="he-chip c1">✦ AI дэвсгэр арилгах</span>
      <span class="he-chip c2">Аа Өө Үү · монгол фонт</span>
      <span class="he-chip c3">PNG · JPG · PDF</span>
    </a>
    <div class="he-sizes"><span>Хэмжээгээ сонгоод эхэл:</span>
      <a href="/editor/?size=1080x1350"><i style="aspect-ratio:4/5"></i>Instagram пост</a>
      <a href="/editor/?size=1080x1920"><i style="aspect-ratio:9/16"></i>Story</a>
      <a href="/editor/?size=1200x630"><i style="aspect-ratio:1.9"></i>Facebook пост</a>
      <a href="/editor/?size=1280x720"><i style="aspect-ratio:16/9"></i>YouTube</a>
      <a href="/editor/?size=1240x1754"><i style="aspect-ratio:1/1.41"></i>A4 постер</a>
      <a href="/editor/?size=1050x600"><i style="aspect-ratio:1.75"></i>Нэрийн хуудас</a>
    </div>
  </section>

  <section class="hm-sec" id="pdf">
    <header class="hm-head"><h2>PDF</h2><a class="hm-link" href="/tools/pdfedit/">Засварлагч нээх →</a></header>
    <a class="hm-feat" href="/tools/pdfedit/">
      <span class="hm-feat-t"><span class="hm-ic">{svg("pdf")}</span><b>PDF засварлагч</b><span>Засах · хөрвүүлэх · гарын үсэг · орчуулах</span><em class="hm-cta">Нээх</em></span>
      <span class="hm-doc" aria-hidden="true"><i></i><i></i><i class="s"></i><i></i><i class="hl"></i><i class="s"></i><em>Гарын үсэг</em></span>
    </a>
    <div class="hm-tiles">{tiles}</div>
  </section>

  <section class="hm-sec" id="image">
    <header class="hm-head"><h2>Зураг</h2><span class="hm-note">AI · таны төхөөрөмж дээр</span></header>
    <div class="hm-imgs">
      <a class="hm-card img" href="/tools/upscale/">
        <span class="hm-shot up"><img src="{e(thumb('/assets/uploads/edusmart-logo-mockup.webp'))}" alt="" loading="lazy"><span class="blur"></span><em>2× · 4×</em></span>
        <span class="hm-row"><b>AI томруулах</b><i>→</i></span></a>
      <a class="hm-card img" href="/tools/bgremove/">
        <span class="hm-shot bg"><img src="{e(thumb('/assets/uploads/butafter-shampoo.webp'))}" alt="" loading="lazy"></span>
        <span class="hm-row"><b>Дэвсгэр арилгах</b><i>→</i></span></a>
      <a class="hm-card img" href="/tools/socialcrop/">
        <span class="hm-shot crop"><img src="{e(thumb('/assets/uploads/novanest-dining-table.webp'))}" alt="" loading="lazy"><i class="f1"></i><i class="f2"></i><i class="f3"></i></span>
        <span class="hm-row"><b>Сошиал хэмжээ</b><i>→</i></span></a>
    </div>
  </section>

  <section class="hm-sec" id="design">
    <header class="hm-head"><h2>Дизайн</h2><a class="hm-link" href="/design/">Design guide →</a></header>
    <div class="hm-des">
      <a class="hm-card" href="/tools/templates/">
        <span class="hm-tpls" aria-hidden="true"><i style="background:#13306b"><b style="color:#e0a526">САР ШИНЭ</b></i><i style="background:#f6f0e4"><b style="color:#1f4e9c">НААДАМ</b></i><i style="background:#0b0b14"><b style="color:#816dfb">−30%</b></i><i style="background:#facc15"><b style="color:#111">МЭДЭГДЭЛ</b></i></span>
        <span class="hm-row"><b>Монгол загвар</b><i>→</i></span></a>
      <a class="hm-card" href="/tools/mongol-font/">
        <span class="hm-font" aria-hidden="true">Аа Өө Үү</span>
        <span class="hm-row"><b>Монгол фонт</b><i>→</i></span></a>
      <a class="hm-card" href="/tools/brand-color/">
        <span class="hm-sw" aria-hidden="true"><i style="background:#1F4E9C"></i><i style="background:#C8102E"></i><i style="background:#E0A526"></i><i style="background:#2B1B12"></i><i style="background:#F6F0E4"></i></span>
        <span class="hm-row"><b>Брэндийн өнгө</b><i>→</i></span></a>
      <a class="hm-card" href="/design/">
        <span class="hm-guide" aria-hidden="true"><b>Aa</b><span><i></i><i></i><i></i></span></span>
        <span class="hm-row"><b>Design guide</b><i>→</i></span></a>
    </div>
  </section>

  <section class="hm-collab" id="collab">
    <div><p class="hm-kicker">GRAPHICAN</p><h2>Мэргэжлийн дизайн хэрэгтэй юу?</h2><p>Лого · брэнд айдентити · сошиал дизайн · видео</p></div>
    <div class="hm-btns"><a class="hm-btn" href="/about/">Хамтран ажиллах <i>→</i></a><a class="hm-btn ghost" href="/about/#work">Ажлууд</a></div>
  </section>
</main>

<footer class="hm-foot">
  <div class="hm-fcols">
    <div><b>PDF</b><a href="/tools/pdfedit/">PDF засварлагч</a><a href="/tools/pdf-to-word/">PDF → Word</a><a href="/tools/merge-pdf/">PDF нэгтгэх</a><a href="/tools/compress-pdf/">Шахах</a><a href="/tools/translate-pdf/">Орчуулах</a></div>
    <div><b>Зураг</b><a href="/tools/upscale/">AI томруулах</a><a href="/tools/bgremove/">Дэвсгэр арилгах</a><a href="/tools/socialcrop/">Сошиал хэмжээ</a><a href="/tools/pdf/">PDF ⇄ зураг</a></div>
    <div><b>Дизайн</b><a href="/editor/">Засварлагч</a><a href="/tools/templates/">Монгол загвар</a><a href="/tools/mongol-font/">Монгол фонт</a><a href="/tools/brand-color/">Брэндийн өнгө</a></div>
    <div><b>Graphican</b><a href="/about/">Хамтран ажиллах</a><a href="/about/#work">Ажлууд</a>{f'<a href="mailto:{e(email)}">{e(email)}</a>' if email else ''}{f'<a href="tel:+976{e(phone)}">{e(phone)}</a>' if phone else ''}</div>
  </div>
  <p class="hm-copy">© GRAPHICAN · {soc_h}</p>
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
<meta name="theme-color" content="#0a0a10">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2308080a'/%3E%3Ccircle cx='16' cy='16' r='7' fill='%23a497ff'/%3E%3C/svg%3E">
<link rel="preload" href="/assets/fonts/web/InterTight-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/web/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts/web/fonts.css">
<link rel="stylesheet" href="/assets/style.css?v=35">
<link rel="stylesheet" href="/assets/design.css?v=34">
<link rel="stylesheet" href="/assets/home.css?v={V}">
</head>
<body class="home-page">

{L.header_html()}
{body}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="/assets/app.js?v=36"></script>
</body>
</html>
"""
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(html)


if __name__ == "__main__":
    build()
    print("home ok")
