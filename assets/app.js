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

  // stable, readable id for #project/<slug> links
  function slug(p, i) {
    var s = String(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return (i + 1) + (s ? '-' + s : '');
  }

  function work(w) {
    var items = list(w.projects);
    var cards = items.map(function (p, i) {
      return (
        '<a class="project reveal" href="#project/' + slug(p, i) + '" aria-label="' + esc(p.name) + ' — дэлгэрэнгүй үзэх">' +
          '<div class="project-media">' +
            '<div class="art" role="img" aria-label="' + esc(p.name) + '" style="' + img(p.image) + '"></div>' +
            '<span class="index">' + pad(i + 1) + ' / ' + pad(items.length) + '</span>' +
          '</div>' +
          '<div class="project-info">' +
            '<div class="project-type' + fx(p.type) + '">' + esc(p.type) + '</div>' +
            '<h3 class="project-name' + fx(p.name) + '">' + esc(p.name) + '</h3>' +
            '<p class="project-desc">' + esc(p.description) + '</p>' +
            '<span class="project-more">' + (list(p.gallery).length ? list(p.gallery).length + ' ажил үзэх' : 'Дэлгэрэнгүй') + ' <span aria-hidden="true">→</span></span>' +
            '<span class="project-arrow" aria-hidden="true">↗</span>' +
          '</div>' +
        '</a>'
      );
    }).join('');
    var hint = w.hint ? '<p class="work-hint reveal"><span class="live" aria-hidden="true"></span>' + esc(w.hint) + '</p>' : '';
    return '<section class="work" id="work">' + sectionTop(w) + hint + '<div class="projects">' + cards + '</div></section>';
  }

  // ---------- project detail (modal) ----------

  function paragraphs(text) {
    return String(text || '').split(/\n\s*\n/).filter(function (t) { return t.trim(); })
      .map(function (t) { return '<p>' + esc(t.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  function projectDetail(p, i, total) {
    var gallery = list(p.gallery);
    var link = url(p.link);
    var items = gallery.map(function (g, k) {
      return (
        '<figure class="pd-item">' +
          '<div class="pd-media corners"><span class="c"></span>' +
            (g.image ? '<img src="' + esc(g.image) + '" alt="' + esc(g.title || p.name) + '" loading="lazy">' : '') +
            '<span class="pd-num">' + pad(k + 1) + '</span>' +
          '</div>' +
          '<figcaption>' +
            (g.title ? '<h4>' + esc(g.title) + '</h4>' : '') +
            (g.caption ? paragraphs(g.caption) : '') +
          '</figcaption>' +
        '</figure>'
      );
    }).join('');

    return (
      '<div class="pd-head">' +
        '<div class="pd-index hud-text">' + pad(i + 1) + ' / ' + pad(total) + ' <b>//</b> CASE STUDY</div>' +
        '<div class="project-type' + fx(p.type) + '">' + esc(p.type) + '</div>' +
        '<h2 id="pd-title" class="pd-name' + fx(p.name) + '">' + esc(p.name) + '</h2>' +
        '<div class="pd-details">' + paragraphs(p.details || p.description) + '</div>' +
        (link ? '<a class="ghost-btn" href="' + esc(link) + '" target="_blank" rel="noopener">Холбоос үзэх <span aria-hidden="true">↗</span></a>' : '') +
      '</div>' +
      (items ? '<div class="pd-gallery">' + items + '</div>'
             : '<p class="pd-empty">Удахгүй ажлууд нэмэгдэнэ.</p>')
    );
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
    var text = paragraphs(a.text).replace(/\bGraphican\b/g, '<span class="en">Graphican</span>');
    var stats = list(a.stats).map(function (s) {
      var isWord = /[A-Za-zЀ-ӿ]{3,}/.test(String(s.value || ''));
      return '<div><b class="' + (isWord ? 'en' : '') + fx(s.value) + '">' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>';
    }).join('');
    var photo = a.photo
      ? '<div class="about-photo reveal">' +
          '<div class="about-frame corners"><span class="c"></span>' +
            '<img src="' + esc(a.photo) + '" alt="' + esc(a.name) + '" loading="lazy"><span class="shade" aria-hidden="true"></span>' +
            '<div class="scan-line" aria-hidden="true"></div>' +
          '</div>' +
          (a.photo_label ? '<div class="poster-label' + fx(a.photo_label) + '">' + esc(a.photo_label) + '</div>' : '') +
        '</div>'
      : '';
    var quote = a.title_line1 || a.title_highlight || a.title_line2
      ? '<p class="about-quote">' + esc(a.title_line1) + ' <span class="grad">' + esc(a.title_highlight) + '</span> ' + esc(a.title_line2) + '</p>'
      : '';
    return (
      '<section class="about" id="about"><div class="about-inner' + (photo ? ' has-photo' : '') + '">' +
        photo +
        '<div class="about-copy reveal">' +
          '<div class="section-kicker' + fx(a.kicker) + '">' + esc(a.kicker) + '</div>' +
          (a.role ? '<div class="about-role">' + esc(a.role).replace(/\bGraphican\b/g, '<span class="en">Graphican</span>') + '</div>' : '') +
          (a.name ? '<h2 class="about-name">' + esc(a.name) + '</h2>' : '') +
          (a.name_en ? '<div class="about-name-en en' + fx(a.name_en) + '">' + esc(a.name_en) + '</div>' : '') +
          quote +
          '<div class="about-text">' + text + '</div>' +
          (stats ? '<div class="about-stats">' + stats + '</div>' : '') +
        '</div>' +
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

    if (/^#[\w-]+$/.test(location.hash)) {
      var target = document.querySelector(location.hash);
      if (target) target.scrollIntoView();
    }
  }

  // ---------- project modal: #project/<slug> ----------

  function setupProjects(projects) {
    var modal = document.createElement('div');
    modal.className = 'pd';
    modal.id = 'pd';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'pd-title');
    modal.innerHTML =
      '<div class="pd-backdrop" data-close></div>' +
      '<div class="pd-panel">' +
        '<button class="pd-close" type="button" data-close aria-label="Хаах">✕</button>' +
        '<div class="pd-body"></div>' +
        '<nav class="pd-nav"></nav>' +
      '</div>';
    document.body.appendChild(modal);

    var body = modal.querySelector('.pd-body');
    var nav = modal.querySelector('.pd-nav');
    var panel = modal.querySelector('.pd-panel');
    var openedFromPage = false;
    var savedScroll = 0;
    var returnFocus = null;

    function indexOf(s) {
      for (var i = 0; i < projects.length; i++) if (slug(projects[i], i) === s) return i;
      return -1;
    }

    function open(i) {
      var p = projects[i];
      body.innerHTML = projectDetail(p, i, projects.length);
      var prev = (i - 1 + projects.length) % projects.length;
      var next = (i + 1) % projects.length;
      nav.innerHTML = projects.length > 1
        ? '<a href="#project/' + slug(projects[prev], prev) + '" data-swap><span aria-hidden="true">←</span> ' + esc(projects[prev].name) + '</a>' +
          '<a href="#project/' + slug(projects[next], next) + '" data-swap>' + esc(projects[next].name) + ' <span aria-hidden="true">→</span></a>'
        : '';
      if (modal.hidden) {
        savedScroll = window.scrollY;
        returnFocus = document.activeElement;
        modal.hidden = false;
        document.documentElement.classList.add('pd-open');
        requestAnimationFrame(function () { modal.classList.add('show'); });
      }
      panel.scrollTop = 0;
      modal.querySelector('.pd-close').focus({ preventScroll: true });
    }

    function hide() {
      if (modal.hidden) return;
      modal.classList.remove('show');
      modal.hidden = true;
      document.documentElement.classList.remove('pd-open');
      window.scrollTo(0, savedScroll);
      if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
    }

    function route() {
      var m = location.hash.match(/^#project\/(.+)$/);
      var i = m ? indexOf(decodeURIComponent(m[1])) : -1;
      if (i >= 0) open(i); else hide();
    }

    function close() {
      if (openedFromPage) { openedFromPage = false; history.back(); }
      else { history.replaceState(null, '', location.pathname + location.search + '#work'); hide(); }
    }

    document.addEventListener('click', function (e) {
      var card = e.target.closest('a.project');
      if (card) { openedFromPage = modal.hidden; return; }
      var swap = e.target.closest('[data-swap]');
      if (swap) { e.preventDefault(); location.replace(swap.getAttribute('href')); return; }
      if (e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
    window.addEventListener('hashchange', route);
    route();
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
      setupProjects(list((d.work || {}).projects));
    })
    .catch(function () {
      app.innerHTML = '<p class="load-error">Контент ачаалж чадсангүй. Хуудсаа дахин ачаална уу.</p>';
    });
})();
