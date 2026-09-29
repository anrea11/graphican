#!/usr/bin/env python3
"""
Standalone tool pages with a live app + fully visible SEO content:
  /tools/mongol-font/   Монгол фонт хайгч
  /tools/brand-color/   Брэндийн өнгө үүсгэгч
  /tools/templates/     Монгол сошиал загварууд
Run by prerender.py (or on its own).
"""
import json, os, re
import landings as L

ROOT, SITE, e, ld = L.ROOT, L.SITE, L.e, L.ld
V = "10"
TPL_V = "12"      # assets/templates.js ('path' items for the decks)
KIT_V = "7"       # assets/slides-kit.js — /slides/ only (charts, tables, mockups, Mongolian ornaments)


def mn_fonts():
    js = open(os.path.join(ROOT, "assets", "mnfonts-data.js"), encoding="utf-8").read()
    ok = json.loads(re.search(r"MN_FONTS=(\[.*?\]);", js, re.S).group(1))
    no = json.loads(re.search(r"MN_FONTS_NO=(\[.*?\]);", js, re.S).group(1))
    return ok, no


def faq_html(faq):
    return "".join(f'<details class="lp-q"><summary>{e(q)}</summary><p>{a}</p></details>' for q, a in faq)


def font_page():
    ok, no = mn_fonts()
    n = len(ok)
    cats = {"s": "Sans", "r": "Serif", "d": "Display", "h": "Гар бичмэл", "m": "Mono"}
    by = {c: [f[0] for f in ok if f[1] == c] for c in cats}
    popular_no = [f for f in ["Playfair Display", "Plus Jakarta Sans", "Unbounded", "Hanken Grotesk", "Jost", "Russo One", "Tenor Sans", "Dela Gothic One",
                              "Amatic SC", "Fjalla One", "Great Vibes", "Sofia Sans", "Yanone Kaffeesatz", "Merriweather Sans", "Alumni Sans", "Prosto One", "Rubik Mono One", "Neucha"] if f in no]
    lists = "".join(f'<h3>{cats[c]} <small>{len(by[c])}</small></h3><p class="fn-list">' +
                    " · ".join(f'<a href="https://fonts.google.com/specimen/{x.replace(" ", "+")}" rel="noopener" target="_blank">{e(x)}</a>' for x in by[c]) + "</p>"
                    for c in cats if by[c])
    faq = [
        ("Монгол хэлэнд ямар фонт тохирох вэ?", f"Кирилл үсгийн дотроос <b>Ө, Ү</b> хоёр үсэгтэй фонт хэрэгтэй. Энэ жагсаалтад Google Fonts-ын {n} фонт бүгд эдгээр үсгийг агуулж байгаа эсэхийг нэг бүрчлэн шалгасан. Гарчигт Montserrat, Manrope, Golos Text, бичвэрт Inter, Roboto, Noto Sans, PT Serif түгээмэл."),
        ("Яагаад зарим кирилл фонтод Ө, Ү гарахгүй вэ?", "Олон фонт зөвхөн орос хэлний 33 үсгийг хийдэг. Монгол хэлний Ө, Ү нь «өргөтгөсөн кирилл»-д багтдаг тул тэдгээр фонтод Ө, Ү нь өөр фонтоор солигдож, эвдэрсэн харагдана."),
        ("Эдгээр фонтыг арилжааны зорилгоор ашиглаж болох уу?", "Болно. Google Fonts-ын фонтууд SIL Open Font License эсвэл Apache лицензтэй тул лого, сошиал пост, вэбсайт, хэвлэлд үнэгүй ашиглана."),
        ("Фонтыг яаж татаж суулгах вэ?", "Фонтын «↓ Татах» товч дарахад бүх жин, лицензтэй ZIP шууд татагдана. Олон фонтыг баруун дээд булангийн нүдээр сонгоод хамт татаж болно. ZIP-ээ задлаад .ttf файл дээр давхар дарж «Install» хийнэ. Вэб дээр бол «CSS» товчоор гарах кодыг сайтдаа хуулна."),
        ("Photoshop, Illustrator, Figma-д ашиглаж болох уу?", "Болно. Компьютерт суулгасан фонт бүх програмд гарч ирнэ. Figma-д Google Fonts шууд байдаг."),
    ]
    body = f"""
  <section class="lp-hero app-hero">
    <p class="lp-kicker">ҮНЭГҮЙ ТАТАХ · {n} ФОНТ · Ө Ү ШАЛГАСАН</p>
    <h1>Монгол фонт хайгч</h1>
    <p class="lp-lead">Google Fonts-ын 1900 гаруй фонтоос монгол <b>Ө, Ү</b> үсгийг бүрэн дэмждэг {n}-ыг нэг бүрчлэн шалгаж цуглуулав. Өөрийн текстээр шууд хараад, нэг товчоор үнэгүй татаарай.</p>
  </section>
  <div id="mf-app" class="mf"><noscript><p>Фонтуудыг шууд харахын тулд JavaScript идэвхжүүлнэ үү.</p></noscript></div>

  <section class="lp-sec">
    <h2>Яагаад Ө, Ү шалгах хэрэгтэй вэ?</h2>
    <div class="lp-prose">
      <p>«Кирилл дэмждэг» гэсэн фонт бүр монгол хэлэнд тохирдоггүй. Олон фонт зөвхөн орос хэлний үсгийг агуулдаг тул <b>Ө, Ү</b> бичихэд өөр фонтын үсгээр солигдож, лого, постер дээр эвдэрсэн мэт харагдана.</p>
      <p>Бид Google Fonts-ын кирилл фонт бүрийн файлыг нээж, <b>Ө ө Ү ү</b> үсэг бүрэн байгаа эсэхийг шалгасан. Жишээлбэл, эдгээр түгээмэл фонт кирилл үсэгтэй ч Ө, Ү-гүй:</p>
      <p class="fn-no">{" · ".join(e(x) for x in popular_no)}</p>
    </div>
  </section>

  <section class="lp-sec">
    <h2>Монгол хэл дэмждэг бүх фонт ({n})</h2>
    <div class="lp-prose fn-all">{lists}</div>
  </section>

  <section class="lp-sec"><h2>Түгээмэл асуултууд</h2><div class="lp-faq">{faq_html(faq)}</div></section>
"""
    return dict(slug="mongol-font", icon="font",
                title=f"Монгол фонт татах — Ө, Ү дэмждэг {n} кирилл фонт, үнэгүй | Graphican",
                desc=f"Монгол хэлний Ө, Ү үсгийг бүрэн дэмждэг {n} үнэгүй кирилл фонт. Өөрийн текстээр шууд харж, харьцуулаад нэг товчоор ZIP-ээр татна. Лого, постер, вэбсайтад.",
                h1="Монгол фонт хайгч", name="Монгол фонт хайгч", body=body, faq=faq,
                scripts=["/assets/mnfonts-data.js?v=1", f"/assets/mnfont.js?v={V}"])


def color_page():
    faq = [
        ("Брэндийн өнгийг яаж сонгох вэ?", "Эхлээд салбараа сонгоно — салбар бүрт үйлчлүүлэгчид ямар мэдрэмж төрүүлэхийг бодож тохируулсан палитр гарна. «Өөр хувилбар» (Space) дарж өөр хослол үзэж, таалагдсан өнгөө 🔒 түгжээд бусдыг нь сольж болно."),
        ("Өөрийн өнгөнөөс палитр үүсгэж болох уу?", "Болно. «Өнгөөс палитр үүсгэх» горимд үндсэн өнгөө сонгоод хослолын төрөл (нэг өнгө, ойролцоо, эсрэг, хуваасан эсрэг, гурвалжин, дөрвөлжин) болон өнгө аясыг (тод, зөөлөн, бүдэг, гүн) сонгоход өнгөний хүрдний дүрмээр палитр гарна."),
        ("5 өнгө тус бүр юунд хэрэглэгдэх вэ?", "<b>Үндсэн</b> — лого, товч, гол элемент. <b>Хоёрдогч</b> — дэмжих график, дэвсгэр. <b>Онцлох</b> — үнэ, хямдралын шошго гэх мэт анхаарал татах цөөн газар. <b>Бараан</b> — текст. <b>Цайвар</b> — дэвсгэр, хоосон зай."),
        ("Монгол уламжлалт өнгө гэж юу вэ?", "Мөнх хөх тэнгэрийг бэлгэдэх хөх, гал, амьдралыг бэлгэдэх улаан, эрдэнэ, нарыг бэлгэдэх алтан шар, ариун цагаан сүү, тал нутгийн ногоон. Эдгээрийг орчин үеийн өнгөний тэнцвэрээр хослуулсан."),
        ("Контраст гэж юу вэ, яагаад чухал вэ?", "Текст ба дэвсгэрийн гэрэлтэлтийн харьцаа. Жижиг текстэд дор хаяж 4.5:1 (WCAG AA) байх хэрэгтэй, эс бөгөөс утсан дээр, нарны гэрэлд уншигдахгүй. Хэрэгсэл өнгө бүрийн хослолыг автоматаар шалгана."),
        ("Өнгөө дизайндаа яаж ашиглах вэ?", "HEX кодыг хуулж Figma, Photoshop, Canva-д оруулах, CSS хувьсагчаар вэбсайтдаа хэрэглэх, PNG-ээр татаж баг, хэвлэлийн газартаа илгээх, эсвэл «Design editor-т ашиглах» дарж шууд дизайн хийнэ."),
    ]
    body = f"""
  <section class="lp-hero app-hero">
    <p class="lp-kicker">ҮНЭГҮЙ · 20 САЛБАР · ПАЛИТР ҮҮСГЭГЧ</p>
    <h1>Брэндийн өнгө үүсгэгч</h1>
    <p class="lp-lead">Салбараа сонгох эсвэл өөрийн үндсэн өнгөөс эв зохицолтой 5 өнгийн палитр үүсгэ. Лого, пост, вэбсайт, апп, нэрийн хуудас, уут дээр шууд харж, уншигдах эсэхийг шалгаад, HEX, CSS, PNG-ээр авна.</p>
  </section>
  <div id="bc-app" class="bc"><noscript><p>Өнгө үүсгэхийн тулд JavaScript идэвхжүүлнэ үү.</p></noscript></div>

  <section class="lp-sec">
    <h2>Өнгө брэндэд яагаад чухал вэ?</h2>
    <div class="lp-prose">
      <p>Хүмүүс брэндийг өнгөөр нь хамгийн түрүүнд танина. Зөв сонгосон өнгө таны салбарыг шууд ойлгуулж (хоол — дулаан улаан, санхүү — итгэлтэй хар хөх), өрсөлдөгчөөс ялгаруулж, бүх материалыг нэг хэв маягтай болгоно.</p>
      <p>Энэ хэрэгсэл салбар бүрийн өнгөний сэтгэл зүйд тулгуурласан, дизайнерын гараар тохируулсан палитраас эхэлж, дараа нь тэдгээр дүрмээр шинэ хувилбар үүсгэнэ. Бүх өнгийн хослолыг текст уншигдах (WCAG контраст) шаардлагаар шалгана.</p>
    </div>
  </section>
  <section class="lp-sec"><h2>Түгээмэл асуултууд</h2><div class="lp-faq">{faq_html(faq)}</div></section>
"""
    return dict(slug="brand-color", icon="palette",
                title="Брэндийн өнгө сонгох — өнгөний палитр үүсгэгч, үнэгүй | Graphican",
                desc="Салбартаа тохирсон брэндийн өнгөний палитр: технологи, хоол, санхүү, боловсрол, барилга, монгол уламжлалт өнгө. Лого, пост, вэб дээр шууд харж, HEX, CSS, PNG-ээр авна. Үнэгүй.",
                h1="Брэндийн өнгө үүсгэгч", name="Брэндийн өнгө үүсгэгч", body=body, faq=faq,
                scripts=[f"/assets/brandcolor.js?v={V}"])


def templates_page():
    src = open(os.path.join(ROOT, "assets", "templates.js"), encoding="utf-8").read()
    names = re.findall(r"\{ id: '([a-z0-9]+)', name: '([^']+)', cat: '([a-z]+)', w: (\d+), h: (\d+)", src)
    cats = {"holiday": "Баяр ёслол", "biz": "Бизнес, зар", "event": "Арга хэмжээ", "other": "Бусад"}
    lst = "".join(f'<h3>{cats[c]}</h3><ul class="tg-list">' + "".join(
        f'<li><a href="/editor/?tpl={i}">{e(n)}</a> <span>{w}×{h}</span></li>' for i, n, cc, w, h in names if cc == c) + "</ul>" for c in cats)
    faq = [
        ("Загварыг яаж засах вэ?", "Загвар дээр дарахад онлайн засварлагч нээгдэнэ. Текст дээр давхар дарж бичвэрээ сольж, өнгө, фонт, зургаа өөрчлөөд PNG, JPG, PDF-ээр татна. Бүртгэл шаардахгүй."),
        ("Монгол үсэг зөв гарах уу?", "Тийм. Бүх загварт монгол Ө, Ү үсгийг бүрэн дэмждэг фонтуудыг (Inter, Inter Tight, Geologica, Onest, Playfair, Noto Serif Display, Rubik г.м.) ашигласан."),
        ("Загвар дээрх зургийг үнэгүй ашиглаж болох уу?", "Тийм. Фототой загваруудын зураг Pexels-ийн үнэгүй лицензтэй — арилжааны зорилгоор ч ашиглаж болно, эх сурвалж заах шаардлагагүй. Зургийг сонгоод «Солих» дарж өөрийнхөөрөө сольж болно."),
        ("Өөрийн зургаа яаж оруулах вэ?", "Засварлагч руу зургаа чирж оруулна эсвэл «Нэмэх → Зураг»-аар сонгоно. Pexels, Pixabay-ийн үнэгүй зургаас шууд хайж болно."),
        ("Загварыг арилжааны зорилгоор ашиглаж болох уу?", "Болно. Загварууд үнэгүй — өөрийн бизнесийн пост, зар, мэндчилгээнд чөлөөтэй ашиглаарай."),
    ]
    body = f"""
  <section class="lp-hero app-hero">
    <p class="lp-kicker">ҮНЭГҮЙ · {len(names)} ЗАГВАР · МОНГОЛ ФОНТТОЙ</p>
    <h1>Монгол сошиал загварууд</h1>
    <p class="lp-lead">Цагаан сар, Наадам, шинэ жилийн мэндчилгээ, ажлын зар, хямдрал, хоолны цэс, сургалтын бүртгэл, концерт, YouTube thumbnail зэрэг 60 гаруй трэнд загварыг (Pexels-ийн үнэгүй фототой) сонгоод онлайн засварлагч дээр өөрийн мэдээллээр солиод татаарай.</p>
  </section>
  <div id="tg-app" class="tgal"><noscript><p>Загваруудыг харахын тулд JavaScript идэвхжүүлнэ үү.</p></noscript></div>

  <section class="lp-sec">
    <h2>Бүх загвар</h2>
    <div class="lp-prose">{lst}</div>
  </section>
  <section class="lp-sec"><h2>Түгээмэл асуултууд</h2><div class="lp-faq">{faq_html(faq)}</div></section>
"""
    return dict(slug="templates", icon="layout",
                title="Монгол сошиал пост загвар — Цагаан сар, Наадам, ажлын зар, үнэгүй | Graphican",
                desc=f"{len(names)} үнэгүй монгол загвар: Цагаан сар, Наадам, шинэ жилийн мэндчилгээ, ажлын байрны зар, хямдрал, хоолны цэс, Facebook cover, story. Онлайн засаад PNG-ээр татна.",
                h1="Монгол сошиал загварууд", name="Монгол сошиал загварууд", body=body, faq=faq,
                scripts=["/assets/vendor/fabric.min.js", "/assets/editor-fx.js?v=5", f"/assets/templates.js?v={TPL_V}", f"/assets/tplgallery.js?v={V}"])


APPS = [font_page, color_page, templates_page]


def render(p, header):
    path = f"/tools/{p['slug']}/"
    url = SITE + path
    img = SITE + "/assets/uploads/og-cover.jpg"
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "@id": url + "#page", "url": url, "name": p["title"], "description": p["desc"], "inLanguage": "mn",
         "isPartOf": {"@id": SITE + "/#website"}, "primaryImageOfPage": img,
         "breadcrumb": {"@type": "BreadcrumbList", "itemListElement": [
             {"@type": "ListItem", "position": 1, "name": "Graphican", "item": SITE + "/"},
             {"@type": "ListItem", "position": 2, "name": "Design tools", "item": SITE + "/tools/"},
             {"@type": "ListItem", "position": 3, "name": p["name"], "item": url}]}},
        {"@type": "WebApplication", "name": p["name"], "description": p["desc"], "url": url, "inLanguage": "mn",
         "applicationCategory": "DesignApplication", "operatingSystem": "Windows, macOS, Android, iOS", "isAccessibleForFree": True,
         "offers": {"@type": "Offer", "price": "0", "priceCurrency": "MNT"}, "provider": {"@id": SITE + "/#org"}},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": L.strip(a)}} for q, a in p["faq"]]},
    ]}
    others = "".join(f'<a href="/tools/{x["slug"]}/">{e(x["short"])}</a>' for x in L.PAGES) + \
        "".join(f'<a href="{u}">{e(n)}</a>' for u, n in L.TOOL_LINKS if u != path)
    scripts = "\n".join(f'<script src="{s}"></script>' for s in p["scripts"])
    return f"""<!DOCTYPE html>
<html lang="mn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{e(p['title'])}</title>
<meta name="description" content="{e(p['desc'])}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Graphican">
<meta property="og:locale" content="mn_MN">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{e(p['title'])}">
<meta property="og:description" content="{e(p['desc'])}">
<meta property="og:image" content="{img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(p['title'])}">
<meta name="twitter:description" content="{e(p['desc'])}">
<meta name="twitter:image" content="{img}">
{ld(graph)}
<script>if(location.hostname==='www.graphican.online')location.replace('https://graphican.online'+location.pathname+location.search+location.hash)</script>
<script src="/assets/i18n.js?v=1"></script>
<meta name="theme-color" content="#0a0a10">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2308080a'/%3E%3Ccircle cx='16' cy='16' r='7' fill='%23a497ff'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="/assets/fonts/web/InterTight-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/web/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts/web/fonts.css">
<link rel="stylesheet" href="/assets/style.css?v=36">
<link rel="stylesheet" href="/assets/design.css?v=34">
<link rel="stylesheet" href="/assets/landing.css?v={L.V}">
<link rel="stylesheet" href="/assets/apps.css?v={V}">
</head>
<body class="design-page lp-page app-page">

{header}

<main class="lp lp-app">
  <nav class="lp-crumbs" aria-label="Breadcrumb"><a href="/">Graphican</a><span>/</span><a href="/tools/">Design tools</a><span>/</span><span aria-current="page">{e(p['name'])}</span></nav>
{p['body']}
  <section class="lp-sec lp-all">
    <h2>Бусад үнэгүй хэрэгслүүд</h2>
    <div class="lp-links">{others}</div>
  </section>
</main>

<footer class="lp-foot">
  <p><a href="/">Graphican</a> — брэндинг, digital design, видео. Эдгээр хэрэгслийг дизайнер Анхбаяр бүтээж, хүн бүрт үнэгүй нээлттэй болгосон.</p>
  <p><a href="/about/#work">Ажлууд</a> · <a href="/design/">Design guide</a> · <a href="/tools/">Design tools</a> · <a href="/about/#contact">Хамтран ажиллах</a> · <a href="/support/">Дэмжих</a> · <a href="/privacy/">Нууцлал</a> · <a href="/terms/">Нөхцөл</a></p>
</footer>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="/assets/landing.js?v={L.V}"></script>
{scripts}
</body>
</html>
"""


def support_page(header):
    """/support/ — how to support Graphican (texts + payment details from content/site.json → support, editable in /admin)."""
    site = json.load(open(os.path.join(ROOT, "content", "site.json"), encoding="utf-8"))
    sp, ct = site.get("support") or {}, site.get("contact") or {}
    title = sp.get("page_title") or "Graphican-ийг дэмжих"
    text = sp.get("page_text") or ""
    rows = [(k, sp.get(f)) for k, f in [("Банк", "bank_name"), ("Дансны дугаар", "bank_account"), ("Данс эзэмшигч", "bank_holder"), ("IBAN", "iban")] if sp.get(f)]
    bank = ""
    if rows:
        bank = '<div class="sp-card"><h2>Дансаар шилжүүлэх</h2><dl>' + "".join(
            f'<div><dt>{e(k)}</dt><dd><span>{e(v)}</span><button type="button" class="sp-copy" data-copy="{e(v)}">Хуулах</button></dd></div>' for k, v in rows) + \
            '</dl><p class="sp-note">Гүйлгээний утга дээр «Graphican дэмжлэг» гэж бичээрэй.</p></div>'
    qr = f'<div class="sp-card sp-qr"><h2>QR кодоор төлөх</h2><img src="{e(sp["qpay_image"])}" alt="Дэмжлэгийн QR код" width="240" height="240" loading="lazy"><p class="sp-note">Банкны аппаараа уншуулаад дүнгээ оруулна уу.</p></div>' if sp.get("qpay_image") else ""
    extra = f'<a class="sp-btn" href="{e(sp["extra_link"])}" target="_blank" rel="noopener">{e(sp.get("extra_label") or "Дэмжих")} →</a>' if sp.get("extra_link") else ""
    contact = []
    if ct.get("messenger"): contact.append(f'<a class="sp-btn ghost" href="{e(ct["messenger"])}" target="_blank" rel="noopener">Messenger</a>')
    if ct.get("phone"): contact.append(f'<a class="sp-btn ghost" href="tel:+976{e(ct["phone"])}">{e(ct["phone"])}</a>')
    if ct.get("email"): contact.append(f'<a class="sp-btn ghost" href="mailto:{e(ct["email"])}">{e(ct["email"])}</a>')
    pay = bank + qr
    if not pay:
        pay = '<div class="sp-card"><h2>Дэмжлэг үзүүлэх</h2><p>Дэмжлэг үзүүлэх, хамтран ажиллах талаар бидэнтэй шууд холбогдоорой — мэдээллийг тань хүлээж байна.</p></div>'
    body = f"""
  <section class="lp-hero app-hero sp-hero">
    <p class="lp-kicker">ДЭМЖЛЭГ · GRAPHICAN</p>
    <h1>{e(title)}</h1>
    <p class="lp-lead">{e(text)}</p>
    {('<p>' + extra + '</p>') if extra else ''}
  </section>
  <section class="lp-sec sp-grid">{pay}
    <div class="sp-card"><h2>Холбоо барих</h2><p>Санал хүсэлт, шинэ боломжийн санаа, хамтын ажиллагааны талаар:</p><div class="sp-links">{"".join(contact)}</div></div>
    <div class="sp-card"><h2>Өөр аргаар дэмжих</h2><p>Graphican-ийг найзууддаа хуваалцах, хэрэгслүүдийг ашиглаж санал бодлоо хэлэх нь бас том дэмжлэг.</p><div class="sp-links"><button type="button" class="sp-btn ghost" data-share="1">Хуваалцах</button><a class="sp-btn ghost" href="/tools/">Хэрэгслүүд</a></div></div>
  </section>
"""
    css = """<style>
.sp-hero h1{max-width:18ch}
.sp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
.sp-card{padding:24px;border-radius:20px;border:1px solid rgba(255,255,255,.1);background:radial-gradient(120% 100% at 100% 0%,rgba(157,128,255,.14),transparent 60%),rgba(255,255,255,.03)}
.sp-card h2{margin:0 0 12px;font-size:20px}
.sp-card p{margin:0 0 14px;opacity:.8;line-height:1.6}
.sp-card dl{margin:0;display:grid;gap:10px}
.sp-card dl div{display:grid;gap:2px}
.sp-card dt{font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.6}
.sp-card dd{margin:0;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:18px;font-weight:600;font-variant-numeric:tabular-nums}
.sp-card dd .sp-copy{flex:none;height:30px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);color:#d8d4e4;font-family:inherit;font-size:12px;font-weight:600;line-height:1;cursor:pointer}.sp-card dd .sp-copy:hover{background:rgba(255,255,255,.1);color:#fff}
.sp-note{margin-top:14px!important;font-size:13px}
.sp-qr img{display:block;width:100%;max-width:260px;border-radius:14px;background:#fff}
.sp-links{display:flex;flex-wrap:wrap;gap:8px}
.sp-btn{display:inline-flex;align-items:center;height:44px;padding:0 20px;border-radius:999px;border:0;background:linear-gradient(135deg,#9d80ff 0%,#6d56fa 48%,#4b33d9 100%);color:#fff;font:600 15px/1 inherit;text-decoration:none;cursor:pointer;box-shadow:0 10px 24px -10px rgba(109,86,250,.8)}
.sp-btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.18);box-shadow:none;font-size:14px;height:40px;padding:0 16px}
</style>
<script>
document.addEventListener('click',function(e){var c=e.target.closest('[data-copy]');if(c){navigator.clipboard&&navigator.clipboard.writeText(c.dataset.copy);c.textContent='Хуулагдлаа ✓';setTimeout(function(){c.textContent='Хуулах'},1600)}
var s=e.target.closest('[data-share]');if(s){var d={title:'Graphican — үнэгүй дизайн хэрэгслүүд',url:'https://graphican.online/'};if(navigator.share)navigator.share(d).catch(function(){});else{navigator.clipboard&&navigator.clipboard.writeText(d.url);s.textContent='Холбоос хуулагдлаа ✓'}}});
</script>"""
    p = dict(slug="__support", name="Дэмжлэг", title=f"{title} | Graphican", desc=text[:155] or "Graphican-ийг дэмжих", faq=[], scripts=[], body=body)
    html = render(p, header).replace('/tools/__support/', '/support/').replace('<span aria-current="page">Дэмжлэг</span>', '<span aria-current="page">Дэмжлэг</span>')
    html = html.replace('<a href="/tools/">Design tools</a><span>/</span><span aria-current="page">Дэмжлэг</span>', '<span aria-current="page">Дэмжлэг</span>')
    html = html.replace("</head>", css + "\n</head>", 1)
    simple = {"@context": "https://schema.org", "@type": "WebPage", "url": SITE + "/support/", "name": title, "description": text[:155], "inLanguage": "mn", "isPartOf": {"@id": SITE + "/#website"}}
    html = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: ld(simple), html, count=1, flags=re.S)
    d = os.path.join(ROOT, "support"); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(html)


LEGAL_DATE = "2026 оны 9-р сарын 28"


def legal_pages(header):
    """/privacy/ and /terms/ — plain-language privacy policy and terms of use (Mongolian)."""
    site = json.load(open(os.path.join(ROOT, "content", "site.json"), encoding="utf-8"))
    ct = site.get("contact") or {}
    reach = " · ".join(x for x in [
        f'<a href="mailto:{e(ct["email"])}">{e(ct["email"])}</a>' if ct.get("email") else "",
        f'<a href="tel:+976{e(ct["phone"])}">{e(ct["phone"])}</a>' if ct.get("phone") else "",
        f'<a href="{e(ct["messenger"])}" target="_blank" rel="noopener">Messenger</a>' if ct.get("messenger") else ""] if x)
    privacy = f"""
  <section class="lp-hero app-hero lg-hero"><p class="lp-kicker">GRAPHICAN · НУУЦЛАЛ</p><h1>Нууцлалын бодлого</h1>
    <p class="lp-lead">Товчхондоо: бид бүртгэл шаарддаггүй, таны нэр, имэйлийг цуглуулдаггүй, таны файлуудыг ихэнх тохиолдолд хаашаа ч илгээдэггүй. Доор дэлгэрэнгүй.</p></section>
  <section class="lp-sec lg-doc">
    <h2>1. Хэн бэ</h2>
    <p>graphican.online сайтыг дизайнер Мөнхбаярын Анхбаяр хөгжүүлж, ажиллуулдаг. Холбоо барих: {reach}.</p>
    <h2>2. Бүртгэл ба хувийн мэдээлэл</h2>
    <p>Сайтын бүх хэрэгслийг бүртгэлгүй ашиглана. Бид таны нэр, имэйл, утас, төлбөрийн мэдээллийг цуглуулдаггүй. Та өөрөө бидэнтэй имэйл, утас, Messenger-ээр холбогдвол зөвхөн тухайн харилцаанд хариулахад ашиглана.</p>
    <h2>3. Таны файлууд</h2>
    <p>PDF хэрэгслүүд, зураг томруулах, дэвсгэр арилгах, нүүр засах, Design editor зэрэг хэрэгслүүд таны файлыг <b>таны төхөөрөмж дээр, хөтөч дотор</b> боловсруулдаг — файл манай сервер рүү илгээгдэхгүй. Үл хамаарах тохиолдлууд:</p>
    <ul>
      <li><b>AI орчуулга, хураангуй, баримтаас асуух.</b> Эдгээрийг ашиглахад баримтын <b>текст</b> Cloudflare Workers AI руу (тохируулсан үед Microsoft Translator руу) илгээгдэж орчуулагдана. Ижил мөрийг дахин орчуулахгүйн тулд орчуулсан мөрийг Cloudflare-ийн кэшэд 30 хүртэл хоног хадгалж болох бөгөөд хэн орчуулсантай холбогддоггүй. Нууц баримтыг AI-аар орчуулахгүй байхыг зөвлөж байна.</li>
      <li><b>Зураг, видео хайлт.</b> Таны хайсан үг Pexels, Pixabay руу илгээгдэнэ (монгол үгийг AI-аар англи болгоно). Хайлтын үр дүнг 24 цаг кэшэлдэг.</li>
    </ul>
    <h2>4. Таны төхөөрөмж дээр хадгалагдах зүйл</h2>
    <p>Дизайн, сүүлийн тохиргоо, хэлний сонголт, дэмжлэгийн цонхны төлөв зэрэг нь хөтчийн хадгалалтад (localStorage, IndexedDB) зөвхөн таны төхөөрөмж дээр хадгалагдана. Бид cookie ашиглан таныг хянадаггүй. Хөтчийн түүхээ цэвэрлэвэл эдгээр устна.</p>
    <h2>5. Статистик ба алдааны мэдээ</h2>
    <p>Сайтыг сайжруулахын тулд бид нэргүй, нэгтгэсэн мэдээлэл ашигладаг: хуудас үзэлтийн тоо (Cloudflare Web Analytics — cookie-гүй), аль хэрэгслээс файл татсан, хуудсан дээр гарсан техникийн алдаа (хуудасны хаяг, хөтчийн төрөл, улс). Энэ мэдээлэл таныг хувь хүн болгон тодорхойлохгүй бөгөөд 3 хоногийн дотор автоматаар устна.</p>
    <h2>6. IP хаяг ба хамгаалалт</h2>
    <p>Бүх хүсэлт Cloudflare-аар дамждаг. Хэт олон хүсэлтээс хамгаалахын тулд IP хаяг тус бүрийн хүсэлтийн тоог 1 өдөр хүртэл түр тоолдог. IP хаягийг өөр зорилгоор хадгалах, бусдад дамжуулахгүй.</p>
    <h2>7. Гуравдагч талын үйлчилгээ</h2>
    <p>Cloudflare (сайт, хамгаалалт, AI), Pexels ба Pixabay (үнэгүй зураг, видео), jsDelivr ба GitHub (AI загварын программ), Google Fonts ба Fontshare (фонт), Microsoft Translator (тохируулсан үед). Эдгээр үйлчилгээ таны хөтчөөс шууд файл татах үед таны IP хаягийг харж болно; тэдгээрт өөрсдийн нууцлалын бодлого үйлчилнэ.</p>
    <h2>8. Таны эрх</h2>
    <p>Бид таны хувийн мэдээллийг хадгалдаггүй тул устгах, засах зүйл бараг байхгүй. Асуулт, хүсэлт байвал дээрх хаягаар холбогдоно уу — Монгол Улсын Хувь хүний мэдээлэл хамгаалах тухай хуулийн дагуу хариулна.</p>
    <h2>9. Өөрчлөлт</h2>
    <p>Энэ бодлогыг шинэчилбэл энэ хуудсанд нийтэлнэ. Сүүлд шинэчилсэн: {LEGAL_DATE}.</p>
  </section>
"""
    terms = f"""
  <section class="lp-hero app-hero lg-hero"><p class="lp-kicker">GRAPHICAN · НӨХЦӨЛ</p><h1>Үйлчилгээний нөхцөл</h1>
    <p class="lp-lead">Graphican үнэгүй. Сайтыг ашигласнаар та доорх энгийн нөхцөлүүдийг зөвшөөрч байна.</p></section>
  <section class="lp-sec lg-doc">
    <h2>1. Үйлчилгээ</h2>
    <p>Graphican бол үнэгүй, бүртгэлгүй онлайн дизайн, PDF, зургийн хэрэгслүүд юм. Бид хэрэгслүүдийг байнга сайжруулдаг бөгөөд аливаа боломжийг өөрчлөх, түр зогсоох эрхтэй. Үйлчилгээг «байгаа байдлаар нь» санал болгож байгаа тул алдаа, тасалдалгүй ажиллана гэсэн баталгаа өгөхгүй.</p>
    <h2>2. Таны бүтээл ба файлууд</h2>
    <p>Таны бүтээсэн дизайн, боловсруулсан файл таных. Бид түүн дээр ямар ч эрх нэхэхгүй. Та ашиглаж буй зураг, текст, лого, файлдаа өөрөө хариуцлага хүлээнэ — бусдын зохиогчийн эрх, барааны тэмдэг, хувийн нууцыг зөрчсөн эсвэл хууль бус контент бүү бүтээ.</p>
    <h2>3. Загварууд</h2>
    <p>Graphican-ийн загваруудыг хувийн болон арилжааны ажилдаа үнэгүй ашиглаж, засаж болно. Харин загварыг өөрийг нь (засваргүй эсвэл бага зэрэг өөрчилж) дахин худалдах, өөр загварын сан болгон тараахыг хориглоно.</p>
    <h2>4. Үнэгүй зураг, видео, фонт</h2>
    <p>Pexels, Pixabay-ийн зураг, видео нь тухайн сайтуудын лицензээр үнэгүй бөгөөд арилжааны ажилд ашиглаж болно. Гэхдээ тэдгээрийг засваргүйгээр худалдах, зураг дээр харагдаж буй хүн, брэнд, барааны тэмдгийг буруу утгаар ашиглахыг хориглоно — дэлгэрэнгүйг <a href="https://www.pexels.com/license/" target="_blank" rel="noopener">Pexels</a>, <a href="https://pixabay.com/service/license-summary/" target="_blank" rel="noopener">Pixabay</a>-ийн лицензээс үзнэ үү. Editor-ийн фонтууд Google Fonts, Fontshare-ийн үнэгүй лицензтэй.</p>
    <h2>5. AI хэрэгслүүд</h2>
    <p>AI орчуулга, хураангуй, дэвсгэр арилгах, томруулах, нүүр засах зэрэг нь алдаатай үр дүн гаргаж болно. Гэрээ, албан бичиг зэрэг чухал баримтын орчуулгыг заавал нягтална уу.</p>
    <h2>6. Хадгалалт</h2>
    <p>Дизайн тань зөвхөн таны хөтөч дотор хадгалагдана. Хөтчийн түүх цэвэрлэх, өөр төхөөрөмж ашиглахад алга болж болох бөгөөд бид сэргээж чадахгүй. Чухал ажлаа «Файл → .graphican хадгалах»-аар нөөцлөөрэй.</p>
    <h2>7. Хориглох зүйл</h2>
    <p>Сайт, API-д автоматаар (бот, скрипт) хэт олон хүсэлт илгээх, хамгаалалтыг тойрох, сайтын ажиллагааг саатуулахыг хориглоно.</p>
    <h2>8. Хандив</h2>
    <p>Хандив бүрэн сайн дурын бөгөөд ямар нэг бараа, үйлчилгээ худалдан авсанд тооцогдохгүй.</p>
    <h2>9. Хариуцлагын хязгаар</h2>
    <p>Хуулиар зөвшөөрөгдсөн хэмжээнд Graphican нь хэрэгслийг ашигласнаас үүдэн гарсан шууд бус хохирол, файл, мэдээлэл алдагдсанд хариуцлага хүлээхгүй.</p>
    <h2>10. Хууль ба холбоо барих</h2>
    <p>Энэ нөхцөлд Монгол Улсын хууль үйлчилнэ. Асуулт байвал: {reach}. Сүүлд шинэчилсэн: {LEGAL_DATE}.</p>
  </section>
"""
    css = """<style>
.lg-hero h1{max-width:20ch}
.lg-doc{max-width:760px}
.lg-doc h2{margin:34px 0 10px;font-size:20px}
.lg-doc p,.lg-doc li{line-height:1.7;opacity:.85}
.lg-doc ul{padding-left:20px;display:grid;gap:10px}
.lg-doc a{color:#a497ff}
</style>"""
    for slug, name, title, desc, body in [
        ("privacy", "Нууцлал", "Нууцлалын бодлого | Graphican", "Graphican бүртгэл шаарддаггүй, хувийн мэдээлэл цуглуулдаггүй, файлыг таны төхөөрөмж дээр боловсруулдаг.", privacy),
        ("terms", "Нөхцөл", "Үйлчилгээний нөхцөл | Graphican", "Graphican-ийн үнэгүй дизайн, PDF, зургийн хэрэгслүүдийг ашиглах нөхцөл.", terms)]:
        pg = dict(slug="__" + slug, name=name, title=title, desc=desc, faq=[], scripts=[], body=body)
        html = render(pg, header).replace(f'/tools/__{slug}/', f'/{slug}/')
        html = html.replace(f'<a href="/tools/">Design tools</a><span>/</span><span aria-current="page">{name}</span>', f'<span aria-current="page">{name}</span>')
        html = html.replace("</head>", css + "\n</head>", 1)
        simple = {"@context": "https://schema.org", "@type": "WebPage", "url": SITE + f"/{slug}/", "name": title.split(" | ")[0], "description": desc, "inLanguage": "mn", "isPartOf": {"@id": SITE + "/#website"}}
        html = re.sub(r'<script type="application/ld\+json">.*?</script>', lambda m: ld(simple), html, count=1, flags=re.S)
        d = os.path.join(ROOT, slug); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(html)


def build():
    header = L.header_html()
    support_page(header)
    legal_pages(header)
    out = []
    for fn in APPS:
        p = fn()
        d = os.path.join(ROOT, "tools", p["slug"])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(render(p, header))
        out.append((f"/tools/{p['slug']}/", p["name"]))
    slides_page()
    return out


def slides_page():
    """/slides/ — the editor in presentation mode (same app, own document). Built from editor/index.html."""
    src = open(os.path.join(ROOT, "editor", "index.html"), encoding="utf-8").read()
    t = "Илтгэл бэлдэх (PPT) — онлайн, үнэгүй, монгол загвартай | Graphican"
    d = "Canva шиг илтгэл, презентацыг хөтөч дээрээ бэлд: 240 гаруй бэлэн слайд загвар, видеотой слайд, монгол фонт, үнэгүй зураг ба видео, бүтэн дэлгэцээр үзүүлэх, PowerPoint (.pptx) ба PDF татах. Бүртгэлгүй."
    s = src
    s = re.sub(r"<title>.*?</title>", f"<title>{t}</title>", s, 1)
    s = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{d}">', s, 1)
    s = s.replace('href="https://graphican.online/editor/"', 'href="https://graphican.online/slides/"')
    s = s.replace('content="https://graphican.online/editor/"', 'content="https://graphican.online/slides/"')
    s = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{t}">', s, 1)
    s = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{d}">', s, 1)
    s = s.replace('<body class="ed-booting">', '<body class="ed-booting" data-mode="ppt">', 1)
    s = s.replace('<a href="/editor/" class="on">Дизайн</a><a href="/slides/">Илтгэл (PPT)</a>', '<a href="/editor/">Дизайн</a><a href="/slides/" class="on">Илтгэл (PPT)</a>')
    s = s.replace('value="Нэргүй дизайн"', 'value="Нэргүй илтгэл"')
    s = s.replace('<h1 class="sr-only">Graphican Design editor — үнэгүй онлайн дизайн засварлагч</h1>', '<h1 class="sr-only">Илтгэл бэлдэх (PPT) — онлайн, үнэгүй</h1>')
    s = s.replace('<button type="button" data-file="new">Шинэ дизайн</button>', '<button type="button" data-file="new">Шинэ илтгэл</button>')
    # «Элемент» tab + its script exist only in /slides/
    s = s.replace('data-tab="stock">Stock</button>\n', 'data-tab="stock">Stock</button>\n      <button type="button" role="tab" aria-selected="false" data-tab="kit">Элемент</button>\n', 1)
    s = re.sub(r'(<script src="/assets/editor\.js\?v=\d+"></script>)', r'\1\n<script src="/assets/slides-kit.js?v=' + KIT_V + '"></script>', s, 1)
    assert 'data-mode="ppt"' in s and 'data-tab="kit"' in s and 'slides-kit.js' in s
    d_ = os.path.join(ROOT, "slides"); os.makedirs(d_, exist_ok=True)
    open(os.path.join(d_, "index.html"), "w", encoding="utf-8").write(s)


if __name__ == "__main__":
    print(build())
