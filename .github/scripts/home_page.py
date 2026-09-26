#!/usr/bin/env python3
"""
Tools-first home page (/). Fully static, visible HTML: one "drop any file" box that suggests
what to do with it, then the tools grouped as PDF · Зураг · Дизайн, and a short band that leads
to the collaboration page (/about/). The portfolio lives on /about/ (rendered by app.js).
"""
import json, os
import landings as L

ROOT, SITE, e, ld = L.ROOT, L.SITE, L.e, L.ld
V = "1"

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
    "guide": '<path d="M4 5h7v14H4zM13 5h7v6h-7zM13 13h7v6h-7z"/>',
}


def svg(k):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true">{ICON[k]}</svg>'


def thumb(src):
    t = src.replace("/assets/uploads/", "/assets/uploads/_t/") + ".webp"
    return t if os.path.exists(os.path.join(ROOT, t.lstrip("/"))) else src


# PDF actions, grouped (slug → short label) — every one has its own search landing page
PDF_GROUPS = [
    ("Хөрвүүлэх", ["pdf-to-word", "pdf-to-excel", "pdf-to-ppt", "pdf-to-jpg", "jpg-to-pdf", "word-to-pdf"]),
    ("Засах, гарын үсэг", ["edit-pdf", "sign-pdf", "fill-pdf", "watermark-pdf", "pdf-page-numbers"]),
    ("Хуудас, хэмжээ", ["merge-pdf", "split-pdf", "compress-pdf"]),
    ("AI ба хамгаалалт", ["translate-pdf", "summarize-pdf", "pdf-ocr", "protect-pdf", "unlock-pdf"]),
]
LABEL = {"pdf-to-word": "PDF → Word", "pdf-to-excel": "PDF → Excel", "pdf-to-ppt": "PDF → PowerPoint", "pdf-to-jpg": "PDF → зураг",
         "jpg-to-pdf": "Зураг → PDF", "word-to-pdf": "Word → PDF", "edit-pdf": "PDF дээр бичих, засах", "sign-pdf": "Гарын үсэг зурах",
         "fill-pdf": "Маягт бөглөх", "watermark-pdf": "Усан тэмдэг", "pdf-page-numbers": "Хуудасны дугаар", "merge-pdf": "PDF нэгтгэх",
         "split-pdf": "PDF задлах", "compress-pdf": "Хэмжээ багасгах", "translate-pdf": "PDF орчуулах", "summarize-pdf": "AI хураангуй",
         "pdf-ocr": "Скан → текст (OCR)", "protect-pdf": "Нууц үг тавих", "unlock-pdf": "Нууц үг арилгах"}


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

    by = {x["slug"]: x for x in L.PAGES}
    groups = "".join(
        f'<div class="hm-grp"><h3>{e(g)}</h3>' + "".join(
            f'<a href="/tools/{s}/">{e(LABEL[s])}<i aria-hidden="true">→</i></a>' for s in slugs if s in by) + "</div>"
        for g, slugs in PDF_GROUPS)
    pop = [("/tools/pdf-to-word/", "PDF → Word"), ("/tools/pdfedit/", "PDF засах"), ("/tools/merge-pdf/", "PDF нэгтгэх"),
           ("/tools/upscale/", "Зураг томруулах"), ("/tools/bgremove/", "Дэвсгэр арилгах"), ("/tools/templates/", "Цагаан сарын загвар"),
           ("/tools/mongol-font/", "Монгол фонт")]
    pop_h = "".join(f'<a href="{u}">{e(n)}</a>' for u, n in pop)
    logo_h = "".join(f'<img src="{e(thumb(c["logo"]))}" alt="{e(c.get("name"))}" loading="lazy" decoding="async">' for c in logos)
    stat_h = "".join(f'<div><b>{e(s.get("value"))}</b><span>{e(s.get("label"))}</span></div>' for s in stats[:3])
    soc_h = " · ".join(f'<a href="{e(s["url"])}" target="_blank" rel="noopener me">{e(s.get("name") or s.get("label") or "Link")}</a>' for s in socials)
    email, phone = contact.get("email", ""), contact.get("phone", "")

    body = f"""
<main class="hm" id="main">
  <section class="hm-hero">
    <div class="hm-glow" aria-hidden="true"></div>
    <p class="hm-kicker">ҮНЭГҮЙ · БҮРТГЭЛГҮЙ · МОНГОЛ ХЭЛЭЭР</p>
    <h1>Дизайн, PDF, зургийн <em>хэрэгслүүд</em> — нэг дор.</h1>
    <p class="hm-lead">PDF засах, Word болгох, зураг томруулах, дэвсгэр арилгах, пост бүтээх. Програм суулгахгүй, хөтөч дээрээ — файл тань компьютерээс гарахгүй.</p>

    <div class="hm-drop" id="hm-drop">
      <label class="hm-pick" id="hm-pick">
        <input type="file" id="hm-file" multiple hidden>
        <span class="hm-pick-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7 9m5-5 5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>
        <span class="hm-pick-t"><b>Файлаа оруулаад эхэл</b><small>PDF, Word, Excel, зураг… — юу хийж болохыг санал болгоно</small></span>
        <span class="hm-pick-btn">Файл сонгох</span>
      </label>
      <div class="hm-acts" id="hm-acts" hidden></div>
    </div>
    <div class="hm-pop"><span>Түгээмэл:</span>{pop_h}</div>
  </section>

  <section class="hm-sec" id="pdf">
    <header class="hm-head"><span class="hm-num">01</span><div><h2>PDF</h2><p>Засах, хөрвүүлэх, нэгтгэх, гарын үсэг зурах, орчуулах — бүх PDF ажил нэг засварлагч дээр.</p></div></header>
    <div class="hm-pdf">
      <a class="hm-feat" href="/tools/pdfedit/">
        <span class="hm-ic">{svg("pdf")}</span>
        <b>PDF засварлагч</b>
        <span class="hm-t">PDF доторх бичгийг шууд засах, текст, зураг, гарын үсэг нэмэх, хуудас эргүүлэх, Word болгох, монгол руу орчуулах.</span>
        <span class="hm-doc" aria-hidden="true"><i></i><i></i><i class="s"></i><i></i><i class="hl"></i><i class="s"></i><em>Гарын үсэг</em></span>
        <span class="hm-go">Засварлагч нээх <i>→</i></span>
      </a>
      <div class="hm-grps">{groups}</div>
    </div>
  </section>

  <section class="hm-sec" id="image">
    <header class="hm-head"><span class="hm-num">02</span><div><h2>Зураг</h2><p>Хиймэл оюун таны төхөөрөмж дээр ажиллана — зураг хаашаа ч илгээгдэхгүй.</p></div></header>
    <div class="hm-imgs">
      <a class="hm-card img" href="/tools/upscale/">
        <span class="hm-shot up"><img src="{e(thumb('/assets/uploads/edusmart-logo-mockup.webp'))}" alt="" loading="lazy"><span class="blur"></span><em>2× · 4×</em></span>
        <span class="hm-row"><span class="hm-ic sm">{svg("up")}</span><b>AI зураг томруулах</b></span>
        <span class="hm-t">Бүдэг, жижиг зургийг 2–4 дахин тод, том болгоно.</span></a>
      <a class="hm-card img" href="/tools/bgremove/">
        <span class="hm-shot bg"><img src="{e(thumb('/assets/uploads/butafter-shampoo.webp'))}" alt="" loading="lazy"></span>
        <span class="hm-row"><span class="hm-ic sm">{svg("bg")}</span><b>Дэвсгэр арилгах</b></span>
        <span class="hm-t">Арын дэвсгэрийг нэг товшилтоор арилгаж тунгалаг PNG болгоно.</span></a>
      <a class="hm-card img" href="/tools/socialcrop/">
        <span class="hm-shot crop"><img src="{e(thumb('/assets/uploads/novanest-dining-table.webp'))}" alt="" loading="lazy"><i class="f1"></i><i class="f2"></i><i class="f3"></i></span>
        <span class="hm-row"><span class="hm-ic sm">{svg("crop")}</span><b>Сошиал хэмжээ рүү тайрах</b></span>
        <span class="hm-t">Нэг зургийг Instagram, Story, Facebook, YouTube хэмжээнд зэрэг тайрна.</span></a>
    </div>
    <a class="hm-more" href="/tools/pdf/">{svg("conv")} PDF ⇄ зураг хөрвүүлэгч — PDF-ийг PNG/JPG болгох, олон зургийг нэг PDF болгох <i>→</i></a>
  </section>

  <section class="hm-sec" id="design">
    <header class="hm-head"><span class="hm-num">03</span><div><h2>Дизайн</h2><p>Пост, постер бүтээх засварлагч, бэлэн монгол загвар, монгол фонт, брэндийн өнгө.</p></div></header>
    <div class="hm-des">
      <a class="hm-card big" href="/editor/">
        <span class="hm-ed" aria-hidden="true"><span class="bar"><i></i><i></i><i></i></span><span class="cv"><span class="pst"><b>ХЯМДРАЛ</b><strong>−30%</strong><em></em></span></span><span class="dock"><i></i><i></i><i></i><i></i><i></i></span></span>
        <span class="hm-row"><span class="hm-ic sm">{svg("edit")}</span><b>Дизайн засварлагч</b></span>
        <span class="hm-t">Текст, зураг, хэлбэр, эффект, маск, pen tool — сошиал пост, постер, баннерыг хөтөч дээрээ бүтээж PNG, JPG, PDF-ээр татна.</span></a>
      <a class="hm-card" href="/tools/templates/">
        <span class="hm-tpls" aria-hidden="true"><i style="background:#13306b"><b style="color:#e0a526">САР ШИНЭ</b></i><i style="background:#f6f0e4"><b style="color:#1f4e9c">НААДАМ</b></i><i style="background:#0b0b14"><b style="color:#816dfb">−30%</b></i><i style="background:#facc15"><b style="color:#111">МЭДЭГДЭЛ</b></i></span>
        <span class="hm-row"><span class="hm-ic sm">{svg("tpl")}</span><b>Монгол загварууд</b></span>
        <span class="hm-t">Цагаан сар, Наадам, ажлын зар, хямдрал — 20 бэлэн загвар.</span></a>
      <a class="hm-card" href="/tools/mongol-font/">
        <span class="hm-font" aria-hidden="true">Аа Өө Үү</span>
        <span class="hm-row"><span class="hm-ic sm">{svg("font")}</span><b>Монгол фонт хайгч</b></span>
        <span class="hm-t">Ө, Ү-г бүрэн дэмждэг 178 фонтыг өөрийн текстээр харьцуулна.</span></a>
      <a class="hm-card" href="/tools/brand-color/">
        <span class="hm-sw" aria-hidden="true"><i style="background:#1F4E9C"></i><i style="background:#C8102E"></i><i style="background:#E0A526"></i><i style="background:#2B1B12"></i><i style="background:#F6F0E4"></i></span>
        <span class="hm-row"><span class="hm-ic sm">{svg("color")}</span><b>Брэндийн өнгө</b></span>
        <span class="hm-t">Салбартаа тохирсон 5 өнгийн палитр — лого, пост дээр шууд харна.</span></a>
      <a class="hm-card" href="/design/">
        <span class="hm-guide" aria-hidden="true"><b>Aa</b><span><i></i><i></i><i></i></span></span>
        <span class="hm-row"><span class="hm-ic sm">{svg("guide")}</span><b>Design guide</b></span>
        <span class="hm-t">Фонтын хослол, өнгөний палитр, starter kit татах.</span></a>
    </div>
  </section>

  <section class="hm-why">
    <div><b>Бүрэн үнэгүй</b><span>Бүртгэл, усан тэмдэг, хязгаар байхгүй.</span></div>
    <div><b>Файл тань аюулгүй</b><span>Ихэнх ажил таны хөтөч дотор хийгдэж, сервер рүү илгээгдэхгүй.</span></div>
    <div><b>Монгол хэлэнд зориулсан</b><span>Ө, Ү, кирилл үсэг эвдрэхгүй, бүх зүйл монголоор.</span></div>
    <div><b>Утсан дээр ч ажиллана</b><span>Програм суулгахгүй — iPhone, Android, компьютер.</span></div>
  </section>

  <section class="hm-collab" id="collab">
    {f'<img class="hm-me" src="{e(thumb(portrait))}" alt="Анхбаяр — Graphican" loading="lazy">' if portrait else ''}
    <div class="hm-collab-t">
      <p class="hm-kicker">GRAPHICAN · ДИЗАЙН СТУДИ</p>
      <h2>Мэргэжлийн дизайн хэрэгтэй юу?</h2>
      <p>Эдгээр хэрэгслийг бүтээсэн дизайнер Анхбаяр — лого, брэнд айдентити, сошиал медиа дизайн, видео. Таны брэндийг хамтдаа бүтээе.</p>
      <div class="hm-stats">{stat_h}</div>
      <div class="hm-btns"><a class="hm-btn" href="/about/">Хамтран ажиллах <i>→</i></a><a class="hm-btn ghost" href="/about/#work">Ажлуудыг үзэх</a></div>
    </div>
    <div class="hm-logos" aria-label="Хамтран ажилласан байгууллагууд">{logo_h}</div>
  </section>
</main>

<footer class="hm-foot">
  <div class="hm-fcols">
    <div><b>PDF</b><a href="/tools/pdfedit/">PDF засварлагч</a><a href="/tools/pdf-to-word/">PDF → Word</a><a href="/tools/merge-pdf/">PDF нэгтгэх</a><a href="/tools/compress-pdf/">Хэмжээ багасгах</a><a href="/tools/translate-pdf/">PDF орчуулах</a><a href="/tools/sign-pdf/">Гарын үсэг</a></div>
    <div><b>Зураг</b><a href="/tools/upscale/">AI томруулах</a><a href="/tools/bgremove/">Дэвсгэр арилгах</a><a href="/tools/socialcrop/">Сошиал тайрах</a><a href="/tools/pdf/">PDF ⇄ зураг</a></div>
    <div><b>Дизайн</b><a href="/editor/">Засварлагч</a><a href="/tools/templates/">Монгол загварууд</a><a href="/tools/mongol-font/">Монгол фонт</a><a href="/tools/brand-color/">Брэндийн өнгө</a><a href="/design/">Design guide</a></div>
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
<link rel="stylesheet" href="/assets/style.css?v=34">
<link rel="stylesheet" href="/assets/design.css?v=34">
<link rel="stylesheet" href="/assets/home.css?v={V}">
</head>
<body class="design-page home-page">

{L.header_html()}
{body}
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="/assets/handoff.js?v=29"></script>
<script src="/assets/home.js?v={V}"></script>
</body>
</html>
"""
    open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(html)


if __name__ == "__main__":
    build()
    print("home ok")
