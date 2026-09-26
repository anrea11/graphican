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
V = "6"


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
        ("Өнгөө дизайндаа яаж ашиглах вэ?", "HEX кодыг хуулж Figma, Photoshop, Canva-д оруулах, CSS хувьсагчаар вэбсайтдаа хэрэглэх, PNG-ээр татаж баг, хэвлэлийн газартаа илгээх, эсвэл «Editor-т ашиглах» дарж шууд дизайн хийнэ."),
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
                scripts=["/assets/vendor/fabric.min.js", "/assets/editor-fx.js?v=1", f"/assets/templates.js?v={V}", f"/assets/tplgallery.js?v={V}"])


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
<meta name="theme-color" content="#0a0a10">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%2308080a'/%3E%3Ccircle cx='16' cy='16' r='7' fill='%23a497ff'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="/assets/fonts/web/InterTight-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/web/Inter-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts/web/fonts.css">
<link rel="stylesheet" href="/assets/style.css?v=35">
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
  <p><a href="/about/#work">Ажлууд</a> · <a href="/design/">Design guide</a> · <a href="/tools/">Design tools</a> · <a href="/about/#contact">Хамтран ажиллах</a></p>
</footer>

<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="/assets/landing.js?v={L.V}"></script>
{scripts}
</body>
</html>
"""


def build():
    header = L.header_html()
    out = []
    for fn in APPS:
        p = fn()
        d = os.path.join(ROOT, "tools", p["slug"])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(render(p, header))
        out.append((f"/tools/{p['slug']}/", p["name"]))
    return out


if __name__ == "__main__":
    print(build())
