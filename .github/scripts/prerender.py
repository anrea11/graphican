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
    body.append('<p><a href="/design/">Design guide — фонт, өнгөний хослол, PDF хөрвүүлэгч</a></p>')
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
    page = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": SITE + "/design/#page", "url": SITE + "/design/", "name": title, "description": desc,
         "inLanguage": "mn", "isPartOf": {"@id": SITE + "/#website"}, "primaryImageOfPage": img,
         "breadcrumb": {"@type": "BreadcrumbList", "itemListElement": [
             {"@type": "ListItem", "position": 1, "name": "Graphican", "item": SITE + "/"},
             {"@type": "ListItem", "position": 2, "name": "Design guide", "item": SITE + "/design/"}]}},
        {"@type": "WebApplication", "name": "PDF ⇄ PNG/JPG хөрвүүлэгч", "url": SITE + "/design/#tools",
         "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "MNT"}},
    ]}
    head = "\n".join([
        f"<title>{e(title)}</title>",
        f'<meta name="description" content="{e(desc)}">',
        '<meta name="robots" content="index, follow, max-image-preview:large">',
        f'<link rel="canonical" href="{SITE}/design/">',
        '<meta property="og:type" content="website">', '<meta property="og:site_name" content="Graphican">',
        '<meta property="og:locale" content="mn_MN">', f'<meta property="og:url" content="{SITE}/design/">',
        f'<meta property="og:title" content="{e(title)}">', f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:image" content="{e(img)}">', '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(title)}">', f'<meta name="twitter:description" content="{e(desc)}">',
        f'<meta name="twitter:image" content="{e(img)}">',
        ld(page),
    ])
    fonts = d.get("fonts", {}); pals = d.get("palettes", {}); tools = d.get("tools", {})
    body = ['<div class="seo-static">', f'<h1>{e((d.get("hero") or {}).get("title_line1"))} {e((d.get("hero") or {}).get("title_line2"))} — Graphican</h1>',
            f'<p>{e((d.get("hero") or {}).get("text"))}</p>',
            f'<section><h2>{e(fonts.get("title"))}</h2><p>{e(fonts.get("description"))}</p><ul>']
    for g in fonts.get("groups", []):
        for it in g.get("items", []):
            body.append(f'<li>{e(it.get("heading"))} + {e(it.get("body"))} — {e(it.get("desc"))}</li>')
    body.append(f'</ul></section><section><h2>{e(pals.get("title"))}</h2><p>{e(pals.get("description"))}</p><ul>')
    for pl in pals.get("items", []):
        body.append(f'<li>{e(pl.get("name"))}: ' + ", ".join(e(c.get("hex")) for c in pl.get("colors", [])) + f' — {e(pl.get("desc"))}</li>')
    body.append(f'</ul></section><section><h2>{e(tools.get("title"))}</h2><p>{e(tools.get("description"))}</p></section></div>')
    p = os.path.join(ROOT, "design", "index.html")
    t = open(p, encoding="utf-8").read()
    t2 = replace_block(t, "head", head)
    t2 = replace_block(t2, "body", "\n".join(body))
    assert t2, "markers missing in design/index.html"
    open(p, "w", encoding="utf-8").write(t2)
    return d


# ------------------------------------------------------------------ sitemap
def sitemap(projects, dd):
    imgs = []
    for p in projects:
        for src in [p.get("image")] + [g.get("image") for g in p.get("gallery", [])]:
            if src and src not in [x[0] for x in imgs]:
                imgs.append((src, p.get("name")))
    home_imgs = "".join(f"\n    <image:image><image:loc>{e(absu(s))}</image:loc></image:image>" for s, _ in imgs[:1000])
    guide_img = absu((dd.get("guide") or {}).get("image") or "/assets/uploads/design-guide.webp")
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
</urlset>
"""
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(xml)


if __name__ == "__main__":
    _, projects = home()
    dd = design()
    sitemap(projects, dd)
    print("prerender ok:", len(projects), "projects")
