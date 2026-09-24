/*
  Graphican — renders the page from /content/site.json.
  Edit content at /admin (Sveltia CMS) — never needs code changes.
*/
(function () {
  'use strict';

  // ---------- helpers ----------

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // iBrand has no Cyrillic glyphs: if an "English" field contains Mongolian, fall back to Manrope
  function fx(text) {
    return /[Ѐ-ӿ]/.test(String(text || '')) ? ' mn-fallback' : '';
  }

  function url(v) {
    var s = String(v || '').trim();
    if (!s) return '';
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(s)) return s;
    return 'https://' + s;
  }

  function img(path) {
    return path ? "background-image:url('" + esc(path).replace(/'/g, '%27') + "')" : '';
  }

  function list(arr) { return Array.isArray(arr) ? arr : []; }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  // ---------- sections ----------

  function hero(h) {
    var poster = function (p, cls, extra) {
      p = p || {};
      return (
        '<div class="poster ' + cls + '">' + (extra || '') +
          '<div class="art" role="img" aria-label="' + esc(p.alt || p.label) + '" style="' + img(p.image) + '"></div>' +
          (p.label ? '<div class="poster-label' + fx(p.label) + '">' + esc(p.label) + '</div>' : '') +
        '</div>'
      );
    };

    var kicker = list(h.kicker).map(function (k) { return '<span class="' + fx(k) + '">' + esc(k) + '</span>'; })
      .join(' <span class="sep">•</span> ');

    var stats = list(h.stats).map(function (s) {
      return '<div class="stat"><b class="' + fx(s.value) + '">' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>';
    }).join('');

    return (
      '<section class="hero" id="home">' +
        '<div class="hero-grid"></div>' +
        '<div class="brand-arcs" aria-hidden="true">' +
          '<svg viewBox="0 0 1000 1000" preserveAspectRatio="xMaxYMax meet" fill="none" stroke="#fff" stroke-width="2.5">' +
            '<path d="M1000 380 C 560 380 150 560 40 1000" vector-effect="non-scaling-stroke"/>' +
            '<path d="M1000 640 C 740 640 480 760 360 1000" vector-effect="non-scaling-stroke"/>' +
          '</svg>' +
        '</div>' +
        '<div class="hud-rail left" aria-hidden="true"><i></i><span class="hud-text">PORTFOLIO ' + new Date().getFullYear() + '</span><i></i></div>' +
        '<div class="hud-rail right" aria-hidden="true"><i></i><span class="hud-text">01 / HOME</span><i></i></div>' +
        '<div class="hero-content">' +
          '<div class="hero-copy">' +
            '<div class="kicker"><span class="live" aria-hidden="true"></span>' + kicker + '</div>' +
            '<h1 class="hero-title">' +
              '<span class="white' + fx(h.title_line1) + '">' + esc(h.title_line1) + '</span>' +
              '<span class="accent' + fx(h.title_line2) + '">' + esc(h.title_line2) + '</span>' +
            '</h1>' +
            '<p class="hero-mongolian">' + esc(h.tagline_line1) + '<br>' +
              (h.tagline_highlight ? '<em>' + esc(h.tagline_highlight) + '</em> ' : '') + esc(h.tagline_rest) +
            '</p>' +
            '<p class="hero-description">' + esc(h.description) + '</p>' +
            '<div class="hero-actions">' +
              '<a class="primary-btn" href="#work">' + esc(h.primary_button) + ' <span aria-hidden="true">→</span></a>' +
              '<a class="ghost-btn" href="#services">' + esc(h.secondary_button) + ' <span aria-hidden="true">↗</span></a>' +
            '</div>' +
            '<div class="hero-meta">' +
              '<div class="artist"><div class="artist-dot"></div><div>' +
                '<strong class="' + fx(h.artist_name) + '">' + esc(h.artist_name) + '</strong>' +
                '<small class="' + fx(h.artist_role) + '">' + esc(h.artist_role) + '</small>' +
              '</div></div>' + stats +
            '</div>' +
          '</div>' +
          '<div class="poster-stage" aria-label="Онцлох постерууд">' +
            '<div class="stage-hud top hud-text" aria-hidden="true"><span class="rec">LIVE <b>PREVIEW</b></span><span>03 <b>WORKS</b></span></div>' +
            '<div class="scan-line" aria-hidden="true"></div>' +
            poster(h.poster_left, 'poster-left') +
            poster(h.poster_main, 'poster-main corners', '<span class="c"></span>') +
            poster(h.poster_right, 'poster-right') +
            '<div class="stage-hud bottom hud-text" aria-hidden="true"><span>GRAPHICAN <b>//</b> VISUAL SYSTEM</span><span>V.03</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="scroll-hint hud-text" aria-hidden="true">SCROLL<i></i></div>' +
      '</section>'
    );
  }

  function marquee(items) {
    items = list(items);
    if (!items.length) return '';
    var row = items.map(function (t, i) {
      return (i % 2 ? '<b class="o' + fx(t) + '">' : '<span class="' + fx(t) + '">') + esc(t) + (i % 2 ? '</b>' : '</span>') + ' <em class="dot">•</em>';
    }).join(' ');
    return '<div class="marquee" aria-hidden="true"><div class="marquee-track"><span>' + row + '</span><span>' + row + '</span></div></div>';
  }

  function sectionTop(s) {
    return (
      '<div class="section-top reveal"><div>' +
        '<div class="section-kicker' + fx(s.kicker) + '">' + esc(s.kicker) + '</div>' +
        '<h2 class="section-title">' +
          (s.title_en ? '<span class="en' + fx(s.title_en) + '">' + esc(s.title_en) + '</span>' : '') + esc(s.title) +
        '</h2>' +
      '</div>' +
      (s.description ? '<p class="section-description">' + esc(s.description) + '</p>' : '') +
      '</div>'
    );
  }

  function work(w) {
    var items = list(w.projects);
    var cards = items.map(function (p, i) {
      var link = url(p.link);
      var tag = link ? 'a' : 'article';
      var attrs = link ? ' href="' + esc(link) + '" target="_blank" rel="noopener"' : '';
      return (
        '<' + tag + ' class="project reveal"' + attrs + '>' +
          '<div class="project-media">' +
            '<div class="art" role="img" aria-label="' + esc(p.name) + '" style="' + img(p.image) + '"></div>' +
            '<span class="index">' + pad(i + 1) + ' / ' + pad(items.length) + '</span>' +
          '</div>' +
          '<div class="project-info">' +
            '<div class="project-type' + fx(p.type) + '">' + esc(p.type) + '</div>' +
            '<h3 class="project-name' + fx(p.name) + '">' + esc(p.name) + '</h3>' +
            '<p class="project-desc">' + esc(p.description) + '</p>' +
            '<span class="project-arrow" aria-hidden="true">↗</span>' +
          '</div>' +
        '</' + tag + '>'
      );
    }).join('');
    return '<section class="work" id="work">' + sectionTop(w) + '<div class="projects">' + cards + '</div></section>';
  }

  function services(s) {
    var cards = list(s.items).map(function (it, i) {
      var tags = list(it.tags).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
      return (
        '<article class="service reveal">' +
          '<div class="index">' + pad(i + 1) + ' <b>//</b></div>' +
          '<h3 class="service-name' + fx(it.name) + '">' + esc(it.name) + '</h3>' +
          '<div class="service-mn">' + esc(it.name_mn) + '</div>' +
          '<p>' + esc(it.description) + '</p>' +
          (tags ? '<div class="tags">' + tags + '</div>' : '') +
        '</article>'
      );
    }).join('');
    return '<section class="services" id="services">' + sectionTop(s) + '<div class="service-list">' + cards + '</div></section>';
  }

  function about(a) {
    var text = esc(a.text).replace(/\bGraphican\b/g, '<span class="en">Graphican</span>');
    var stats = list(a.stats).map(function (s) {
      var isWord = /[A-Za-zЀ-ӿ]{3,}/.test(String(s.value || ''));
      return '<div><b class="' + (isWord ? 'en' : '') + fx(s.value) + '">' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>';
    }).join('');
    return (
      '<section class="about" id="about"><div class="about-inner">' +
        '<div class="reveal">' +
          '<div class="section-kicker' + fx(a.kicker) + '">' + esc(a.kicker) + '</div>' +
          '<h2>' + esc(a.title_line1) + ' <span class="grad">' + esc(a.title_highlight) + '</span><br>' + esc(a.title_line2) + '</h2>' +
          '<p>' + text + '</p>' +
        '</div>' +
        (stats ? '<div class="about-stats reveal">' + stats + '</div>' : '') +
      '</div></section>'
    );
  }

  function contact(c) {
    var email = String(c.email || '').trim();
    var phone = String(c.phone || '').trim();
    var socials = list(c.socials).filter(function (s) { return s && s.url; }).map(function (s) {
      return '<a class="social" href="' + esc(url(s.url)) + '" target="_blank" rel="noopener">' + esc(s.name) + ' <span aria-hidden="true">↗</span></a>';
    }).join('');
    return (
      '<section class="contact" id="contact">' +
        (c.big_text ? '<div class="contact-big' + fx(c.big_text) + '" aria-hidden="true">' + esc(c.big_text) + '</div>' : '') +
        '<div class="contact-inner reveal">' +
          '<div class="section-kicker' + fx(c.kicker) + '">' + esc(c.kicker) + '</div>' +
          '<h2>' + esc(c.title_line1) + '<br>' + esc(c.title_line2) + '</h2>' +
          '<p>' + esc(c.text) + '</p>' +
          '<div class="contact-row">' +
            (email ? '<a class="primary-btn" href="mailto:' + esc(email) + '">' + esc(c.button) + ' <span aria-hidden="true">→</span></a>' +
                     '<span class="contact-mail">' + esc(email) + '</span>' : '') +
            (phone ? '<a class="contact-mail" href="tel:' + esc(phone.replace(/\s+/g, '')) + '">' + esc(phone) + '</a>' : '') +
          '</div>' +
          (socials ? '<div class="socials">' + socials + '</div>' : '') +
        '</div>' +
      '</section>'
    );
  }

  function footer(f) {
    return (
      '<footer class="footer">' +
        '<span class="en' + fx(f.copyright) + '">' + esc(f.copyright) + '</span>' +
        '<span class="en' + fx(f.tagline) + '">' + esc(f.tagline) + '</span>' +
      '</footer>'
    );
  }

  // ---------- behaviour ----------

  function enhance() {
    document.documentElement.classList.add('js');

    var header = document.getElementById('header');
    function onScroll() { header.classList.toggle('scrolled', window.scrollY > 30); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + 'ms';
      revealer.observe(el);
    });

    var links = document.querySelectorAll('.nav a');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('section[id]').forEach(function (s) { spy.observe(s); });

    if (location.hash) {
      var target = document.querySelector(location.hash);
      if (target) target.scrollIntoView();
    }
  }

  // ---------- boot ----------

  var app = document.getElementById('app');

  fetch('/content/site.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (d.seo) {
        if (d.seo.title) document.title = d.seo.title;
        var meta = document.querySelector('meta[name="description"]');
        if (meta && d.seo.description) meta.setAttribute('content', d.seo.description);
      }
      app.innerHTML =
        hero(d.hero || {}) +
        marquee(d.marquee) +
        work(d.work || {}) +
        services(d.services || {}) +
        about(d.about || {}) +
        contact(d.contact || {}) +
        footer(d.footer || {});
      enhance();
    })
    .catch(function () {
      app.innerHTML = '<p class="load-error">Контент ачаалж чадсангүй. Хуудсаа дахин ачаална уу.</p>';
    });
})();
