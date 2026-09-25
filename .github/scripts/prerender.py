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
import html, json, os, re, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SITE = "https://graphican.online"
TODAY = datetime.date.today().isoformat()


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
        "worksFor": {"@id": SITE + "/#org"}, "url": SITE, "sameAs": socials,
        "knowsAbout": ["Брэнд айдентити", "Лого дизайн", "Сошиал медиа постер", "Reels", "Motion graphics", "Branding"],
    }
    org = {
        "@type": "ProfessionalService", "@id": SITE + "/#org",
        "name": "Graphican", "url": SITE, "logo": absu("/assets/uploads/anhbayar-hero-2.webp"),
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
                     "image": absu(p.get("image")), "url": f"{SITE}/#project/{slug(p, i)}", "creator": {"@id": SITE + "/#person"}}}
            for i, p in enumerate(projects)],
    }
    graph = {"@context": "https://schema.org", "@graph": [website, org, person, works]}

    head = "\n".join([
        f"<title>{e(title)}</title>",
        f'<meta name="description" content="{e(desc)}">',
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        f'<meta name="author" content="{e(person_name)}">',
        f'<link rel="canonical" href="{SITE}/">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="Graphican">',
        '<meta property="og:locale" content="mn_MN">',
        f'<meta property="og:url" content="{SITE}/">',
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
            f'<li><article><h3><a href="#project/{slug(p, i)}">{e(p.get("name"))}</a></h3><p>{e(p.get("type"))}</p>'
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
    body.append('<p><a href="/design/">Design guide — фонт, өнгөний хослол, брэнд гайд</a> · <a href="/tools/">Design tools — AI зураг томруулагч, дэвсгэр арилгагч, PDF, засварлагч</a></p>')
    body.append("</div>")

    p = os.path.join(ROOT, "index.html")
    t = open(p, encoding="utf-8").read()
    t2 = replace_block(t, "head", head)
    t2 = replace_block(t2, "body", "\n".join(body))
    assert t2, "markers missing in index.html"
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
    body.append('<p><a href="/tools/">Design tools — AI зураг томруулагч, дэвсгэр арилгагч, сошиал тайрагч, PDF, засварлагч</a></p></div>')
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
TOOL_KEYS = (("upscale", "/tools/upscale/"), ("bgremove", "/tools/bgremove/"), ("socialcrop", "/tools/socialcrop/"),
             ("tools", "/tools/pdf/"), ("editor", "/editor/"))


def tool_app(s, path):
    return {"@type": "WebApplication", "name": s.get("title", "").rstrip("."), "description": s.get("description", ""), "url": SITE + path,
            "applicationCategory": "DesignApplication", "operatingSystem": "Any",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "MNT"}}


def tools_page(d):
    th = d.get("tools_hero", {})
    title = th.get("seo_title") or "Design tools — Graphican"
    desc = th.get("seo_description") or th.get("text") or ""
    img = absu("/assets/uploads/og-cover.jpg")
    apps = [tool_app(d.get(k) or {}, p) for k, p in TOOL_KEYS if (d.get(k) or {}).get("title")]
    page = {"@context": "https://schema.org", "@graph": [web_page("/tools/", "Design tools", title, desc, img)] + apps}
    head = page_head("/tools/", title, desc, img, page)
    body = ['<div class="seo-static">', f'<h1>{e(th.get("title_line1"))} {e(th.get("title_line2"))} — Graphican</h1>', f'<p>{e(th.get("text"))}</p><ul>']
    for key, path in TOOL_KEYS:
        s = d.get(key) or {}
        if s.get("title"):
            body.append(f'<li><a href="{path}">{e(s.get("title"))}</a> — {e(s.get("description"))}</li>')
    body.append('</ul><p><a href="/design/">Design guide — фонт, өнгө, брэнд гайд</a></p></div>')
    write_page(os.path.join("tools", "index.html"), head, body)

    # one page per tool
    for key, path in TOOL_KEYS:
        s = d.get(key) or {}
        if key == "editor" or not s.get("title"):
            continue
        name = s.get("title", "").rstrip(".")
        t = f"{name} — үнэгүй онлайн | Graphican Design tools"
        crumbs = web_page(path, name, t, s.get("description", ""), img)
        crumbs["breadcrumb"]["itemListElement"] = [
            {"@type": "ListItem", "position": 1, "name": "Graphican", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Design tools", "item": SITE + "/tools/"},
            {"@type": "ListItem", "position": 3, "name": name, "item": SITE + path}]
        page = {"@context": "https://schema.org", "@graph": [crumbs, tool_app(s, path)]}
        others = " · ".join(f'<a href="{p}">{e((d.get(k) or {}).get("title", "").rstrip("."))}</a>' for k, p in TOOL_KEYS if k != key and (d.get(k) or {}).get("title"))
        body = ['<div class="seo-static">', f'<h1>{e(name)}</h1>', f'<p>{e(s.get("description"))}</p>',
                f'<p><a href="/tools/">Design tools</a> · {others}</p></div>']
        write_page(os.path.join(path.strip("/"), "index.html"), page_head(path, t, s.get("description", ""), img, page), body)


# ------------------------------------------------------------------ sitemap
def sitemap(projects, dd):
    imgs = []
    for p in projects:
        for src in [p.get("image")] + [g.get("image") for g in p.get("gallery", [])]:
            if src and src not in [x[0] for x in imgs]:
                imgs.append((src, p.get("name")))
    home_imgs = "".join(f"\n    <image:image><image:loc>{e(absu(s))}</image:loc></image:image>" for s, _ in imgs[:1000])
    guide_img = absu((dd.get("guide") or {}).get("image") or "/assets/uploads/design-guide.webp")
    tool_urls = "".join(f"\n  <url>\n    <loc>{SITE}{p}</loc>\n    <lastmod>{TODAY}</lastmod>\n    <priority>0.7</priority>\n  </url>"
                        for k, p in TOOL_KEYS if k != "editor")
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>{SITE}/</loc>
    <lastmod>{TODAY}</lastmod>
    <priority>1.0</priority>{home_imgs}
  </url>
  <url>
    <loc>{SITE}/design/</loc>
    <lastmod>{TODAY}</lastmod>
    <priority>0.8</priority>
    <image:image><image:loc>{e(guide_img)}</image:loc></image:image>
  </url>
  <url>
    <loc>{SITE}/tools/</loc>
    <lastmod>{TODAY}</lastmod>
    <priority>0.8</priority>
  </url>{tool_urls}
  <url>
    <loc>{SITE}/editor/</loc>
    <lastmod>{TODAY}</lastmod>
    <priority>0.6</priority>
  </url>
</urlset>
"""
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(xml)


if __name__ == "__main__":
    _, projects = home()
    dd = design()
    tools_page(dd)
    sitemap(projects, dd)
    print("prerender ok:", len(projects), "projects")
