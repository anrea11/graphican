#!/usr/bin/env python3
"""
Graphican — SEO prerender.

Reads content/site.json (+ content/design.json) and writes, between marker comments:
  * <head>: title, meta description, Open Graph / Twitter, JSON-LD structured data
  * <main>: a static, crawlable copy of the page content (the JS app replaces it on load)
  * sitemap.xml with image entries

Runs automatically on every content change via .github/workflows/prerender.yml,
so edits made in /admin stay SEO-friendly. Safe to run locally: python3 .github/scripts/prerender.py
"""
import sys
import hashlib, html, json, os, re, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = "https://graphican.online"
TODAY = datetime.date.today().isoformat()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import landings  # noqa: E402  (search landing pages for the free tools)
import apps  # noqa: E402  (font finder, brand colours, templates)
import chrome  # noqa: E402  (shared header / footer)
import home_page  # noqa: E402  (tools-first home page)
import og  # noqa: E402  (per-page share images)
LANDING_LINKS = " · ".join(['<a href="/tools/mongol-font/">Монгол фонт хайгч</a>', '<a href="/tools/brand-color/">Брэндийн өнгө үүсгэгч</a>', '<a href="/tools/templates/">Монгол сошиал загвар</a>']
                           + [f'<a href="/tools/{x["slug"]}/">{x["h1"]}</a>' for x in landings.PAGES])


def load(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return json.load(f)


def e(s):
    return html.escape(str(s or ""), quote=True)


def absu(u):
    u = str(u or "")
    return u if u.startswith("http") else SITE + (u if u.startswith("/") else "/" + u)


def slug(p, i):
    s = re.sub(r"[^a-z0-9]+", "-", str(p.get("name", "")).lower()).strip("-")
    return f"{i + 1}-{s}" if s else str(i + 1)


def replace_block(text, name, new):
    a, b = f"<!-- seo:{name}:start -->", f"<!-- seo:{name}:end -->"
    block = f"{a}\n{new}\n{b}"
    if a in text:
        return re.sub(re.escape(a) + r".*?" + re.escape(b), lambda m: block, text, flags=re.S)
    return None


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "</script>"


# ------------------------------------------------------------------ home
def home():
    d = load("content/site.json")
    seo, hero, work, svc, about, contact = (d.get(k, {}) for k in ("seo", "hero", "work", "services", "about", "contact"))
    projects = work.get("projects", [])
    title = seo.get("title") or "Graphican"
    desc = seo.get("description") or hero.get("description", "")
    og_img = absu(seo.get("image") or "/assets/uploads/og-cover.jpg")
    socials = [s["url"] for s in contact.get("socials", []) if s.get("url")]
    email, phone = contact.get("email", ""), contact.get("phone", "")

    person_name = about.get("name") or "Ankhbayar M."
    person = {
        "@type": "Person", "@id": SITE + "/#person",
        "name": person_name, "alternateName": ["Анхбаяр", "Ankhbayar"],
        "jobTitle": "Graphic Designer / Brand Designer",
        "image": absu(about.get("photo") or hero.get("portrait")),
        "worksFor": {"@id": SITE + "/#org"}, "url": SITE + "/about/", "sameAs": socials,
        "knowsAbout": ["Брэнд айдентити", "Лого дизайн", "Сошиал медиа постер", "Reels", "Motion graphics", "Branding"],
    }
    org = {
        "@type": "ProfessionalService", "@id": SITE + "/#org",
        "name": "Graphican", "url": SITE, "logo": {"@type": "ImageObject", "url": absu("/assets/uploads/logo.png"), "width": 512, "height": 512},
        "image": og_img, "description": desc, "founder": {"@id": SITE + "/#person"},
        "areaServed": {"@type": "Country", "name": "Mongolia"},
        "address": {"@type": "PostalAddress", "addressLocality": "Ulaanbaatar", "addressCountry": "MN"},
        "email": email or None, "telephone": ("+976 " + phone) if phone and not phone.startswith("+") else (phone or None),
        "sameAs": socials,
        "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Үйлчилгээ", "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": f"{it.get('name', '')} — {it.get('name_mn', '')}", "description": it.get("description", "")}}
            for it in svc.get("items", [])]},
    }
    org = {k: v for k, v in org.items() if v}
    website = {"@type": "WebSite", "@id": SITE + "/#website", "url": SITE, "name": "Graphican", "inLanguage": "mn", "publisher": {"@id": SITE + "/#org"}}
    works = {
        "@type": "ItemList", "name": work.get("title_en") or "Selected work",
        "itemListElement": [{
            "@type": "ListItem", "position": i + 1,
            "item": {"@type": "CreativeWork", "name": p.get("name"), "genre": p.get("type"), "description": p.get("description"),
                     "image": absu(p.get("image")), "url": f"{SITE}/about/#project/{slug(p, i)}", "creator": {"@id": SITE + "/#person"}}}
            for i, p in enumerate(projects)],
    }
    aboutpage = {"@type": "AboutPage", "@id": SITE + "/about/#page", "url": SITE + "/about/", "name": title, "description": desc, "inLanguage": "mn",
                 "isPartOf": {"@id": SITE + "/#website"}, "about": {"@id": SITE + "/#person"}, "mainEntity": {"@id": SITE + "/#org"},
                 "breadcrumb": {"@type": "BreadcrumbList", "itemListElement": [
                     {"@type": "ListItem", "position": 1, "name": "Graphican", "item": SITE + "/"},
                     {"@type": "ListItem", "position": 2, "name": "Хамтран ажиллах", "item": SITE + "/about/"}]}}
    graph = {"@context": "https://schema.org", "@graph": [aboutpage, org, person, works]}

    head = "\n".join([
        f"<title>{e(title)}</title>",
        f'<meta name="description" content="{e(desc)}">',
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        f'<meta name="author" content="{e(person_name)}">',
        f'<link rel="canonical" href="{SITE}/about/">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Graphican">',
        '<meta property="og:locale" content="mn_MN">',
        f'<meta property="og:url" content="{SITE}/about/">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:image" content="{e(og_img)}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(title)}">',
        f'<meta name="twitter:description" content="{e(desc)}">',
        f'<meta name="twitter:image" content="{e(og_img)}">',
        ld(graph),
    ])

    def paras(t):
        return "".join(f"<p>{e(x.strip())}</p>" for x in str(t or "").split("\n\n") if x.strip())

    body = [
        '<div class="seo-static">',
        '<header>',
        f'<p>{e(hero.get("tagline_line1"))} {e(hero.get("tagline_highlight"))} {e(hero.get("tagline_rest"))}</p>',
        f'<h1>Graphican — {e(hero.get("title_line1"))} {e(hero.get("title_line2"))} · Брэнд, лого, постер дизайн</h1>',
        f'<p>{e(hero.get("description"))}</p>',
        '</header>',
        f'<section id="work-static"><h2>{e(work.get("title"))} — {e(work.get("title_en"))}</h2><p>{e(work.get("description"))}</p><ul>',
    ]
    for i, p in enumerate(projects):
        body.append(
            f'<li><article><h3><a href="/about/#project/{slug(p, i)}">{e(p.get("name"))}</a></h3><p>{e(p.get("type"))}</p>'
            f'<img src="{e(p.get("image"))}" alt="{e(p.get("name"))} — {e(p.get("type"))}" loading="lazy" width="600" height="600">'
            f'{paras(p.get("details") or p.get("description"))}</article></li>')
    body.append("</ul></section>")
    clients = d.get("clients", {})
    client_names = [c.get("name") for c in clients.get("items", []) if c.get("name")]
    if client_names:
        body.append(f'<section><h2>{e(clients.get("title"))}</h2><ul>'
                    + "".join(f"<li>{e(n)}</li>" for n in client_names) + "</ul></section>")
    body.append(f'<section><h2>{e(svc.get("title"))} — {e(svc.get("title_en"))}</h2><p>{e(svc.get("description"))}</p><ul>')
    for it in svc.get("items", []):
        body.append(f'<li><h3>{e(it.get("name"))} — {e(it.get("name_mn"))}</h3><p>{e(it.get("description"))}</p></li>')
    body.append("</ul></section>")
    body.append(f'<section><h2>{e(about.get("name"))} — {e(about.get("role"))}</h2>{paras(about.get("text"))}</section>')
    body.append(f'<section><h2>{e(contact.get("title_line1"))} {e(contact.get("title_line2"))}</h2><p>{e(contact.get("text"))}</p>'
                + (f'<p><a href="mailto:{e(email)}">{e(email)}</a></p>' if email else "")
                + (f'<p><a href="tel:+976{e(phone)}">{e(phone)}</a></p>' if phone else "")
                + "".join(f'<p><a href="{e(u)}" rel="me">{e(u)}</a></p>' for u in socials) + "</section>")
    body.append('<p><a href="/design/">Design guide — фонт, өнгөний хослол, брэнд гайд</a> · <a href="/tools/">Design tools — AI зураг томруулагч, PDF засварлагч, дэвсгэр арилгагч, PDF хөрвүүлэгч</a></p>')
    body.append(f'<section><h2>Үнэгүй PDF хэрэгслүүд</h2><p>{LANDING_LINKS}</p></section>')
    body.append("</div>")

    p = os.path.join(ROOT, "about", "index.html")
    t = open(p, encoding="utf-8").read()
    t2 = replace_block(t, "head", head)
    t2 = replace_block(t2, "body", "\n".join(body))
    assert t2, "markers missing in about/index.html"
    open(p, "w", encoding="utf-8").write(t2)
    return d, projects


# ------------------------------------------------------------------ design page
def design():
    d = load("content/design.json")
    seo = d.get("seo", {})
    title = seo.get("title") or "Design guide — Graphican"
    desc = seo.get("description") or ""
    img = absu((d.get("guide") or {}).get("image") or "/assets/uploads/design-guide.webp")
    page = {"@context": "https://schema.org", "@graph": [web_page("/design/", "Design guide", title, desc, img)]}
    head = page_head("/design/", title, desc, img, page)
    fonts = d.get("fonts", {}); pals = d.get("palettes", {}); kit = d.get("builder", {}); brand = d.get("guide", {})
    body = ['<div class="seo-static">', f'<h1>{e((d.get("hero") or {}).get("title_line1"))} {e((d.get("hero") or {}).get("title_line2"))} — Graphican</h1>',
            f'<p>{e((d.get("hero") or {}).get("text"))}</p>',
            f'<section><h2>{e(fonts.get("title"))}</h2><p>{e(fonts.get("description"))}</p><ul>']
    for g in fonts.get("groups", []):
        for it in g.get("items", []):
            body.append(f'<li>{e(it.get("heading"))} + {e(it.get("body"))} — {e(it.get("desc"))}</li>')
    body.append(f'</ul></section><section><h2>{e(pals.get("title"))}</h2><p>{e(pals.get("description"))}</p><ul>')
    for pl in pals.get("items", []):
        body.append(f'<li>{e(pl.get("name"))}: ' + ", ".join(e(c.get("hex")) for c in pl.get("colors", [])) + f' — {e(pl.get("desc"))}</li>')
    body.append("</ul></section>")
    for s in (kit, brand):
        if s.get("title"):
            body.append(f'<section><h2>{e(s.get("title"))}</h2><p>{e(s.get("description"))}</p></section>')
    body.append('<p><a href="/tools/">Design tools — AI зураг томруулагч, PDF засварлагч, дэвсгэр арилгагч, сошиал тайрагч, PDF хөрвүүлэгч</a></p></div>')
    write_page(os.path.join("design", "index.html"), head, body)
    return d


def web_page(path, crumb, title, desc, img):
    return {"@type": "WebPage", "@id": SITE + path + "#page", "url": SITE + path, "name": title, "description": desc,
            "inLanguage": "mn", "isPartOf": {"@id": SITE + "/#website"}, "primaryImageOfPage": img,
            "breadcrumb": {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Graphican", "item": SITE + "/"},
                {"@type": "ListItem", "position": 2, "name": crumb, "item": SITE + path}]}}


def page_head(path, title, desc, img, page):
    return "\n".join([
        f"<title>{e(title)}</title>",
        f'<meta name="description" content="{e(desc)}">',
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        f'<link rel="canonical" href="{SITE}{path}">',
        '<meta property="og:type" content="website">', '<meta property="og:site_name" content="Graphican">',
        '<meta property="og:locale" content="mn_MN">', f'<meta property="og:url" content="{SITE}{path}">',
        f'<meta property="og:title" content="{e(title)}">', f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:image" content="{e(img)}">', '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(title)}">', f'<meta name="twitter:description" content="{e(desc)}">',
        f'<meta name="twitter:image" content="{e(img)}">',
        ld(page),
    ])


def write_page(rel, head, body):
    p = os.path.join(ROOT, rel)
    t = open(p, encoding="utf-8").read()
    t2 = replace_block(t, "head", head)
    t2 = replace_block(t2, "body", "\n".join(body))
    assert t2, f"markers missing in {rel}"
    open(p, "w", encoding="utf-8").write(t2)


# ------------------------------------------------------------------ tools page
# (content key, page path) — every tool has its own page
TOOL_KEYS = (("upscale", "/tools/upscale/"), ("pdfedit", "/tools/pdfedit/"), ("bgremove", "/tools/bgremove/"),
             ("socialcrop", "/tools/socialcrop/"), ("tools", "/tools/pdf/"), ("editor", "/editor/"))


# visible FAQ on each tool page (+ FAQPage structured data) — answers must match what the tool really does
TOOL_FAQ = {
    "upscale": [
        ("Зургийг хэд дахин томруулж болох вэ?", "2 эсвэл 4 дахин. Хиймэл оюун (Real-ESRGAN) зургийн нарийн хэсгийг сэргээж, ирмэгийг тодруулна. Үр дүн хамгийн ихдээ ойролцоогоор 4800 px болно."),
        ("Ямар зураг хамгийн сайн томрох вэ?", "Лого, бүтээгдэхүүний зураг, хуучин эсвэл жижиг хэмжээтэй зураг. Хэт бүдэг, хөдөлгөөнтэй зурагт сайжрал бага байж болно."),
        ("Зураг минь хаашаа илгээгдэх үү?", "Үгүй. AI загвар таны хөтөч дээр ажилладаг тул зураг компьютер, утаснаас тань гарахгүй."),
        ("Үнэгүй юу? Усан тэмдэг тавих уу?", "Бүрэн үнэгүй, бүртгэлгүй, усан тэмдэггүй."),
    ],
    "bgremove": [
        ("Дэвсгэр арилгасан зургийг ямар форматаар авах вэ?", "Тунгалаг дэвсгэртэй PNG-ээр, эсвэл сонгосон өнгөтэй шинэ дэвсгэртэйгээр татна."),
        ("Ямар зурагт тохирох вэ?", "Бүтээгдэхүүн, хөрөг, амьтан, лого, паспорт ба үнэмлэхний зураг. Үсний ирмэг, нарийн хэсгийг AI өөрөө ялгана."),
        ("Зураг минь серверт хадгалагдах уу?", "Үгүй. Хиймэл оюун таны хөтөч дээр ажилладаг тул зураг төхөөрөмжөөс тань гарахгүй."),
        ("Үнэгүй юу?", "Бүрэн үнэгүй, бүртгэлгүй, усан тэмдэггүй, тоо хязгааргүй."),
    ],
    "socialcrop": [
        ("Ямар хэмжээнүүд рүү тайрах вэ?", "Instagram пост (1080×1350), квадрат (1080×1080), Story / Reels (1080×1920), Facebook пост (1200×630), Facebook cover, YouTube thumbnail (1280×720), LinkedIn, X (Twitter)."),
        ("Хүний нүүр тайрагдчихгүй юу?", "Үгүй. Нүүр илрүүлэгч болон зургийн чухал хэсгийг олох алгоритм тайралтыг тэр хэсэг рүү төвлөрүүлнэ. Хүсвэл тайралтыг гараар ч засна."),
        ("Бүх хэмжээг нэг дор татаж болох уу?", "Болно — сонгосон бүх хэмжээ нэг ZIP файлд орно."),
        ("Үнэгүй юу? Зураг минь хаашаа илгээгдэх үү?", "Бүрэн үнэгүй, бүртгэлгүй. Зураг таны хөтөч дээр боловсруулагдаж, хаашаа ч илгээгдэхгүй."),
    ],
    "tools": [
        ("PDF-ийг ямар зураг болгож болох вэ?", "Хуудас бүрийг PNG, JPG эсвэл WebP болгоно. Нягтралаа сонгож, бүгдийг нэг ZIP-ээр татна."),
        ("Ямар файлуудыг PDF болгож болох вэ?", "Word (DOCX), Excel (XLSX, CSV), TXT, Markdown, HTML болон JPG, PNG, HEIC, WebP, TIFF зураг. Олон файлыг нэг PDF болгож нэгтгэнэ."),
        ("Монгол кирилл үсэг эвдрэх үү?", "Үгүй. Ө, Ү-тэй бүх кирилл үсэг зөв харагдах фонтоор хөрвүүлнэ."),
        ("Файл минь аюулгүй юу?", "Хөрвүүлэлт таны хөтөч дээр хийгддэг тул файл компьютерээс тань гарахгүй."),
    ],
    "pdfedit": [
        ("PDF доторх бичгийг яаж засах вэ?", "«Текст засах» (E) горимд засах бичиг дээрээ дарахад ижил фонт, хэмжээ, өнгөөр засагдана. Татахад хуучин бичиг файлаас бүрмөсөн устгагдана."),
        ("Нэг үгийг бүх хуудаснаас хайж солих боломжтой юу?", "Болно — Ctrl+F дараад хайж, «⋯» → «Бүгдийг солих» эсвэл «Бүгдийг тодруулах»."),
        ("PDF маягт бөглөж болох уу?", "Болно. PDF-ийн бэлэн талбарууд цэнхрээр тодорч шууд бөглөгдөнө. Гарын үсэг, огноо, ✓ тэмдэг нэмнэ."),
        ("Хөтөч хаагдвал ажил алга болох уу?", "Үгүй. Засвар тань энэ төхөөрөмжид автоматаар хадгалагдаж, дахин нээхэд «Үргэлжлүүлэх» гэж санал болгоно."),
        ("Файл минь аюулгүй юу?", "Засвар бүхэлдээ таны хөтөч дээр хийгддэг, файл хаашаа ч илгээгдэхгүй."),
    ],
}


def faq_ld(items):
    return {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}


def faq_html(items):
    # the tool app keeps this block (.seo-faq) and shows it under the tool, so the FAQ markup stays visible
    return ('<section class="seo-faq"><h2>Түгээмэл асуултууд</h2>'
            + "".join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in items) + '</section>')


def og_for(key):
    # per-page share image made by og.py (falls back to the site cover)
    rel = f"/assets/uploads/og/{key}.jpg"
    return absu(rel) if os.path.exists(os.path.join(ROOT, rel.lstrip("/"))) else absu("/assets/uploads/og-cover.jpg")


def tool_app(s, path):
    return {"@type": "WebApplication", "name": s.get("title", "").rstrip("."), "description": s.get("description", ""), "url": SITE + path,
            "applicationCategory": "DesignApplication", "operatingSystem": "Any",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "MNT"}}


def tools_page(d):
    th = d.get("tools_hero", {})
    title = th.get("seo_title") or "Design tools — Graphican"
    desc = th.get("seo_description") or th.get("text") or ""
    img = og_for("tools-hub")
    apps = [tool_app(d.get(k) or {}, p) for k, p in TOOL_KEYS if (d.get(k) or {}).get("title")]
    page = {"@context": "https://schema.org", "@graph": [web_page("/tools/", "Design tools", title, desc, img)] + apps}
    head = page_head("/tools/", title, desc, img, page)
    body = ['<div class="seo-static">', f'<h1>{e(th.get("title_line1"))} {e(th.get("title_line2"))} — Graphican</h1>', f'<p>{e(th.get("text"))}</p><ul>']
    for key, path in TOOL_KEYS:
        s = d.get(key) or {}
        if s.get("title"):
            body.append(f'<li><a href="{path}">{e(s.get("title"))}</a> — {e(s.get("description"))}</li>')
    body.append(f'</ul><h2>PDF хэрэгслүүд</h2><p>{LANDING_LINKS}</p><p><a href="/design/">Design guide — фонт, өнгө, брэнд гайд</a></p></div>')
    write_page(os.path.join("tools", "index.html"), head, body)

    # one page per tool
    for key, path in TOOL_KEYS:
        s = d.get(key) or {}
        if key == "editor" or not s.get("title"):
            continue
        name = s.get("title", "").rstrip(".")
        t = s.get("seo_title") or f"{name} — үнэгүй онлайн | Graphican Design tools"
        sd = s.get("seo_description") or s.get("description", "")
        img = og_for(key)
        crumbs = web_page(path, name, t, sd, img)
        crumbs["breadcrumb"]["itemListElement"] = [
            {"@type": "ListItem", "position": 1, "name": "Graphican", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Design tools", "item": SITE + "/tools/"},
            {"@type": "ListItem", "position": 3, "name": name, "item": SITE + path}]
        faq = TOOL_FAQ.get(key, [])
        page = {"@context": "https://schema.org", "@graph": [crumbs, tool_app(s, path)] + ([faq_ld(faq)] if faq else [])}
        others = " · ".join(f'<a href="{p}">{e((d.get(k) or {}).get("title", "").rstrip("."))}</a>' for k, p in TOOL_KEYS if k != key and (d.get(k) or {}).get("title"))
        body = ['<div class="seo-static">', f'<h1>{e(s.get("seo_h1") or name)}</h1>', f'<p>{e(s.get("description"))}</p>',
                faq_html(faq) if faq else '', f'<p><a href="/tools/">Design tools</a> · {others}</p>', f'<p>{LANDING_LINKS}</p></div>']
        write_page(os.path.join(path.strip("/"), "index.html"), page_head(path, t, sd, img, page), body)


# ------------------------------------------------------------------ sitemap
# <lastmod> is the day a page's HTML last really changed (content hash kept in lastmod.json), not the day the bot ran —
# search engines ignore lastmod when every URL claims "today" on every run.
LASTMOD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lastmod.json")


def lastmods(paths):
    try:
        old = json.load(open(LASTMOD, encoding="utf-8"))
    except Exception:
        old = {}
    out = {}
    for path in paths:
        f = os.path.join(ROOT, path.strip("/"), "index.html") if path != "/" else os.path.join(ROOT, "index.html")
        try:
            h = hashlib.sha1(open(f, "rb").read()).hexdigest()[:16]
        except OSError:
            h = ""
        prev = old.get(path) or {}
        out[path] = {"h": h, "d": prev.get("d") if prev.get("h") == h and prev.get("d") else TODAY}
    json.dump(out, open(LASTMOD, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    return {k: v["d"] for k, v in out.items()}


def sitemap(projects, dd):
    imgs = []
    for p in projects:
        for src in [p.get("image")] + [g.get("image") for g in p.get("gallery", [])]:
            if src and src not in [x[0] for x in imgs]:
                imgs.append((src, p.get("name")))
    guide_img = absu((dd.get("guide") or {}).get("image") or "/assets/uploads/design-guide.webp")
    # (path, priority, images)
    urls = [("/", "1.0", []), ("/about/", "0.9", [absu(s) for s, _ in imgs[:1000]]), ("/design/", "0.8", [guide_img]), ("/tools/", "0.8", [])]
    urls += [(p, "0.7", []) for k, p in TOOL_KEYS if k != "editor"]
    urls += [(f"/tools/{x['slug']}/", "0.8", []) for x in landings.PAGES]   # live pages only (translate-pdf drops out while it is off)
    urls += [(f"/tools/{sl}/", "0.9", []) for sl in ("mongol-font", "brand-color", "templates")]
    urls += [(f"/{sl}/", "0.3", []) for sl in ("support", "privacy", "terms")]
    urls += [("/slides/", "0.9", []), ("/video/", "0.9", []), ("/editor/", "0.6", [])]
    lm = lastmods([u for u, _, _ in urls])
    body = "".join(
        f"\n  <url>\n    <loc>{SITE}{u}</loc>\n    <lastmod>{lm[u]}</lastmod>\n    <priority>{pr}</priority>"
        + "".join(f"\n    <image:image><image:loc>{e(i)}</image:loc></image:image>" for i in im) + "\n  </url>"
        for u, pr, im in urls)
    xml = ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
           'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + body + "\n</urlset>\n")
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(xml)


# Keep the shared header menu concise on every page, including generated pages.
EDITOR_MENU = [
    ("/tools/pdfedit/", "PDF editor", "PDF засах, Word болгох", '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h6M9 16h6"/>'),
    ("/editor/", "Design editor", "Пост, постер, дизайн бүтээх", '<path d="M4 20l4.5-1 10-10-3.5-3.5-10 10zM13.5 7l3.5 3.5"/>'),
    ("/slides/", "PPT editor", "Слайд, илтгэл бэлдэх", '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>'),
    ("/video/", "Video editor", "Видео эвлүүлэх, MP4 татах", '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>'),
]


def sync_editor_menu():
    for folder, _, files in os.walk(ROOT):
        if "/.git" in folder or "/node_modules" in folder:
            continue
        for name in files:
            if not name.endswith(".html"):
                continue
            path = os.path.join(folder, name)
            with open(path, encoding="utf-8") as f:
                text = f.read()
            if '<div class="dm-panel">' not in text:
                continue
            page = "/" + os.path.relpath(folder, ROOT).replace(os.sep, "/").strip(".").strip("/") + "/"
            links = []
            for url, label, desc, icon in EDITOR_MENU:
                current = page == url
                cls = "dm-item on" if current else "dm-item"
                aria = ' aria-current="page"' if current else ""
                links.append(f'<a class="{cls}" href="{url}"{aria}><span class="dm-ic"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{icon}</svg></span><span><b>{label}</b><small>{desc}</small></span></a>')
            panel = '<div class="dm-panel">\n      ' + '\n      '.join(links) + '\n    </div>'
            updated = re.sub(r'<div class="dm-panel">.*?</div>', lambda m: panel, text, flags=re.S)
            if updated != text:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(updated)

# ------------------------------------------------------------------ shared chrome on the hand-written pages
CHROME_PAGES = ["tools/index.html", "tools/upscale/index.html", "tools/bgremove/index.html", "tools/socialcrop/index.html", "tools/pdf/index.html", "design/index.html", "about/index.html"]


def chrome_sync():
    """Header, footer, site.css and site.js of the script-rendered pages (the generated ones get them from chrome.py directly)."""
    fa, fb = "<!-- chrome:footer:start -->", "<!-- chrome:footer:end -->"
    for rel in CHROME_PAGES:
        p = os.path.join(ROOT, rel)
        t = open(p, encoding="utf-8").read()
        bar = '\n<div class="sp-bar" aria-hidden="true"></div>'
        t2 = re.sub(r'<header class="(?:header|gh)" id="(?:header|gh)">.*?</header>(?:\n<div class="sp-bar" aria-hidden="true"></div>)?', lambda m: chrome.header() + bar, t, count=1, flags=re.S)
        foot = f"{fa}\n{chrome.footer(landings.TRANSLATE_ON)}\n{fb}"
        if fa in t2:
            t2 = re.sub(re.escape(fa) + r".*?" + re.escape(fb), lambda m: foot, t2, flags=re.S)
        else:
            t2 = t2.replace("</main>", "</main>\n\n" + foot, 1)
        t2 = re.sub(r'\n<link rel="stylesheet" href="/assets/(?:site|pages)\.css\?v=\d+">', "", t2)
        links = chrome.CSS + ("" if rel.startswith("about") else f'\n<link rel="stylesheet" href="/assets/pages.css?v={chrome.CV}">')
        last = list(re.finditer(r'<link rel="stylesheet" href="/assets/(?:style|design)\.css\?v=\d+">', t2))[-1]
        t2 = t2[:last.end()] + "\n" + links + t2[last.end():]
        t2 = re.sub(r'<script src="/assets/site\.js\?v=\d+"></script>\n', "", t2)
        first = re.search(r'<script src="/assets/(?:handoff|design|app)\.js', t2)
        t2 = t2[:first.start()] + chrome.JS + "\n" + t2[first.start():]
        if t2 != t:
            open(p, "w", encoding="utf-8").write(t2)


if __name__ == "__main__":
    sync_editor_menu()   # source headers used by the page generators
    og.build()            # per-page share images (before the pages that link them)
    _, projects = home()   # the portfolio → /about/
    home_page.build()      # tools hub → /
    chrome_sync()
    dd = design()
    tools_page(dd)
    landings.build()
    apps.build()
    sync_editor_menu()   # apply to newly generated pages as well
    sitemap(projects, dd)
    print("prerender ok:", len(projects), "projects")
