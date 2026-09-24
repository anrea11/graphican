/*
  Graphican — renders the page from /content/site.json.
  Edit content at /admin (Sveltia CMS) — never needs code changes.
  V4: "more." poster look (grain, light beam, hairlines, blurred type) + video everywhere.
*/
(function () {
  'use strict';

  // ---------- helpers ----------

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function url(v) {
    var s = String(v || '').trim();
    if (!s) return '';
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(s)) return s;
    return 'https://' + s;
  }

  function list(arr) { return Array.isArray(arr) ? arr : []; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  var YEAR = new Date().getFullYear();

  function isVideo(src) { return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(src || '')); }

  // Split text into letters that go from blurred → sharp (the "more." effect).
  // strength: how much of the word is blurred (0..1). Spaces kept.
  function blurText(text, strength) {
    var chars = Array.from(String(text || ''));
    var n = chars.length;
    var cut = Math.max(1, n * (strength == null ? 0.65 : strength));
    var out = '', word = '';
    chars.forEach(function (ch, i) {
      if (ch === ' ') { out += (word ? '<span class="w">' + word + '</span>' : '') + ' '; word = ''; return; }
      var b = Math.max(0, 1 - i / cut);
      word += '<span class="bl" style="--b:' + b.toFixed(2) + '">' + esc(ch) + '</span>';
    });
    return out + (word ? '<span class="w">' + word + '</span>' : '');
  }

  // Image or video media. opts: {cls, alt, poster, auto (muted loop in view), controls}
  function media(src, opts) {
    opts = opts || {};
    if (!src) return '';
    if (isVideo(src)) {
      return (
        '<video class="' + (opts.cls || '') + '" ' +
          (opts.auto ? 'muted loop playsinline data-auto ' : 'playsinline controls ') +
          'preload="' + (opts.auto ? 'none' : 'metadata') + '"' +
          (opts.poster ? ' poster="' + esc(opts.poster) + '"' : '') +
          ' aria-label="' + esc(opts.alt || '') + '">' +
          '<source src="' + esc(src) + '" type="video/mp4">' +
        '</video>'
      );
    }
    return '<img class="' + (opts.cls || '') + '" src="' + esc(src) + '" alt="' + esc(opts.alt || '') + '" loading="lazy" decoding="async">';
  }

  // Shared decorative layers: light beam, dark ring, hairlines, grain
  function fx(variant) {
    return (
      '<div class="fx fx-' + variant + '" aria-hidden="true">' +
        '<div class="beam b1"></div><div class="beam b2"></div><div class="beam b3"></div>' +
        '<div class="ring"></div>' +
        '<svg class="lines" viewBox="0 0 1000 1000" preserveAspectRatio="none" fill="none">' +
          '<path class="hl" d="M180 170 C 420 330 520 330 1000 60" vector-effect="non-scaling-stroke"/>' +
          '<path class="hl" d="M180 170 C 260 420 240 700 40 1000" vector-effect="non-scaling-stroke"/>' +
          '<path class="hl" d="M0 900 C 300 640 700 600 1000 700" vector-effect="non-scaling-stroke"/>' +
          '<path class="vl" d="M0 470 C 300 430 520 380 1000 180" vector-effect="non-scaling-stroke"/>' +
        '</svg>' +
        '<div class="grain"></div>' +
      '</div>'
    );
  }

  // ---------- sections ----------

  // Collect work images for the rotating 3D ring (round-robin across projects so it stays varied)
  function ringItems(projects, h, max) {
    var lists = projects.map(function (p, i) {
      var href = '#project/' + slug(p, i);
      var imgs = [p.image].concat(list(p.gallery).map(function (g) { return g.image; }))
        .filter(function (src, k, arr) { return src && !isVideo(src) && arr.indexOf(src) === k; });
      return imgs.map(function (src) { return { src: src, href: href, name: p.name }; });
    });
    var out = [], seen = {}, level = 0, added = true;
    while (out.length < max && added) {
      added = false;
      lists.forEach(function (l) {
        if (out.length < max && l[level] && !seen[l[level].src]) { seen[l[level].src] = 1; out.push(l[level]); added = true; }
      });
      level++;
    }
    [h.poster_main, h.poster_left, h.poster_right].forEach(function (p) {
      if (p && p.image && !seen[p.image] && out.length < max) { seen[p.image] = 1; out.push({ src: p.image, href: '#work', name: p.label || '' }); }
    });
    return out;
  }

  function hero(h, projects) {
    var stats = list(h.stats).map(function (s) {
      return '<div class="stat"><b>' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>';
    }).join('');
    var items = ringItems(projects || [], h, 12);
    var n = items.length;
    var cards = items.map(function (it, i) {
      return '<a class="rc" href="' + esc(it.href) + '" style="--i:' + i + '" aria-label="' + esc(it.name) + '" tabindex="-1">' +
        '<img src="' + esc(it.src) + '" alt="" loading="eager" decoding="async"><span class="rc-light"></span></a>';
    }).join('');
    var portrait = h.portrait || '';

    return (
      '<section class="hero hero-v2" id="home">' +
        '<div class="h2-bg" aria-hidden="true"></div>' +
        '<div class="h2">' +
          '<div class="corner tl">' + esc(h.artist_name || 'Graphican') + (h.artist_role ? ' — ' + esc(h.artist_role) : '') + '</div>' +
          '<div class="corner tr">DESIGN <span class="plus">+</span></div>' +
          '<div class="h2-copy">' +
            '<p class="h2-eyebrow">' + esc(h.tagline_line1) + ' ' +
              (h.tagline_highlight ? '<em>' + esc(h.tagline_highlight) + '</em> ' : '') + esc(h.tagline_rest) + '</p>' +
            '<h1 class="mega h2-title" aria-label="' + esc((h.title_line1 || '') + ' ' + (h.title_line2 || '')) + '">' +
              '<span class="line">' + blurText(h.title_line1, 0.6) + '</span> ' +
              '<span class="line l2">' + blurText(h.title_line2, 0.35) + '<span class="dot"></span></span>' +
            '</h1>' +
            '<p class="lead">' + esc(h.description) + '</p>' +
            '<div class="actions">' +
              '<a class="btn solid" href="#work"><span class="btn-orb" aria-hidden="true">→</span>' + esc(h.primary_button) + '</a>' +
              '<a class="btn" href="#reels">Видео үзэх <span aria-hidden="true">▶</span></a>' +
            '</div>' +
          '</div>' +
          '<div class="h2-stage">' +
            (n ? '<div class="ring-wrap" aria-hidden="true"><div class="ring" style="--n:' + n + '">' + cards + '</div></div>' : '') +
            '<div class="h2-glow" aria-hidden="true"></div>' +
            (portrait ? '<img class="h2-portrait" src="' + esc(portrait) + '" alt="' + esc(h.artist_name || '') + '" fetchpriority="high">' : '') +
            '<div class="h2-floor" aria-hidden="true"></div>' +
            '<div class="corner bl stats">' + stats + '</div>' +
            '<div class="corner br">' + YEAR + '<br>PORTFOLIO</div>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function marquee(items) {
    items = list(items);
    if (!items.length) return '';
    var row = items.map(function (t, i) {
      return '<span class="' + (i % 2 ? 'soft' : '') + '">' + esc(t) + '</span><i></i>';
    }).join('');
    return '<div class="marquee" aria-hidden="true"><div class="marquee-track"><div>' + row + '</div><div>' + row + '</div></div></div>';
  }

  function sectionTop(s, id) {
    return (
      '<header class="sec-head reveal">' +
        '<div class="sec-meta"><span>' + esc(s.kicker) + '</span>' + (s.title_en ? '<span>' + esc(s.title_en) + ' +</span>' : '') + '</div>' +
        '<h2 class="sec-title">' + blurText(s.title, 0.55) + '</h2>' +
        (s.description ? '<p class="sec-desc">' + esc(s.description) + '</p>' : '') +
      '</header>'
    );
  }

  function slug(p, i) {
    var s = String(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return (i + 1) + (s ? '-' + s : '');
  }

  function work(w) {
    var items = list(w.projects);
    var cards = items.map(function (p, i) {
      var g = list(p.gallery);
      var vids = g.filter(function (x) { return x.video || isVideo(x.image); }).length;
      var m = p.video
        ? media(p.video, { auto: true, poster: p.image, alt: p.name })
        : media(p.image, { alt: p.name });
      return (
        '<a class="project reveal" href="#project/' + slug(p, i) + '" aria-label="' + esc(p.name) + ' — дэлгэрэнгүй үзэх">' +
          '<div class="p-media">' + m +
            '<span class="tag tl">' + pad(i + 1) + ' / ' + pad(items.length) + '</span>' +
            (p.video || vids ? '<span class="tag tr">▶ VIDEO</span>' : '') +
          '</div>' +
          '<div class="p-info">' +
            '<div><h3>' + esc(p.name) + '</h3><span class="p-type">' + esc(p.type) + '</span></div>' +
            '<span class="p-arrow" aria-hidden="true">↗</span>' +
          '</div>' +
          '<p class="p-desc">' + esc(p.description) + '</p>' +
          '<span class="p-more">' + (g.length ? g.length + ' ажил' + (vids ? ' · ' + vids + ' видео' : '') : 'Дэлгэрэнгүй') + ' →</span>' +
        '</a>'
      );
    }).join('');
    var hint = w.hint ? '<p class="hint reveal"><span class="live"></span>' + esc(w.hint) + '</p>' : '';
    return '<section class="sec work" id="work">' + sectionTop(w) + hint + '<div class="projects">' + cards + '</div></section>';
  }

  function reels(r) {
    var items = list(r.items).filter(function (it) { return it && it.video; });
    if (!items.length && !r.title) return '';
    var tiles = items.map(function (it, i) {
      var ratio = String(it.ratio || '16:9').replace(':', 'x');
      return (
        '<button class="reel reveal r-' + esc(ratio) + '" type="button" data-reel="' + i + '" aria-label="' + esc(it.title || 'Видео') + ' — дууг нь сонсож үзэх">' +
          '<div class="r-media">' + media(it.video, { auto: true, poster: it.poster, alt: it.title }) +
            '<span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>' +
            '<span class="tag tl">' + pad(i + 1) + '</span>' +
            (it.type ? '<span class="tag tr">' + esc(it.type) + '</span>' : '') +
          '</div>' +
          '<div class="r-info"><h3>' + esc(it.title) + '</h3>' + (it.caption ? '<p>' + esc(it.caption) + '</p>' : '') + '</div>' +
        '</button>'
      );
    }).join('');
    return (
      '<section class="sec reels" id="reels">' + fx('reels') + sectionTop(r) +
        (tiles ? '<div class="reel-grid n' + Math.min(items.length, 3) + '">' + tiles + '</div>'
               : '<p class="empty reveal">Удахгүй видео нэмэгдэнэ.</p>') +
      '</section>'
    );
  }

  // ---------- project detail (modal) ----------

  function paragraphs(text) {
    return String(text || '').split(/\n\s*\n/).filter(function (t) { return t.trim(); })
      .map(function (t) { return '<p>' + esc(t.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  function projectDetail(p, i, total) {
    var link = url(p.link);
    var items = list(p.gallery).map(function (g, k) {
      var src = g.video || g.image;
      var m = media(src, { poster: g.video ? g.image : '', alt: g.title || p.name });
      if (!m && !g.title && !g.caption) return '';
      return (
        '<figure class="pd-item">' +
          (m ? '<div class="pd-media">' + m + '<span class="tag tl">' + pad(k + 1) + '</span></div>' : '') +
          '<figcaption>' + (g.title ? '<h4>' + esc(g.title) + '</h4>' : '') + (g.caption ? paragraphs(g.caption) : '') + '</figcaption>' +
        '</figure>'
      );
    }).join('');

    return (
      '<div class="pd-head">' +
        '<div class="sec-meta"><span>' + pad(i + 1) + ' / ' + pad(total) + ' — CASE STUDY</span><span>' + esc(p.type) + ' +</span></div>' +
        '<h2 id="pd-title" class="pd-name">' + blurText(p.name, 0.5) + '</h2>' +
        '<div class="pd-details">' + paragraphs(p.details || p.description) + '</div>' +
        (link ? '<a class="btn" href="' + esc(link) + '" target="_blank" rel="noopener">Холбоос үзэх <span aria-hidden="true">↗</span></a>' : '') +
      '</div>' +
      (items ? '<div class="pd-gallery">' + items + '</div>' : '<p class="empty">Удахгүй ажлууд нэмэгдэнэ.</p>')
    );
  }

  function services(s) {
    var rows = list(s.items).map(function (it, i) {
      var tags = list(it.tags).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
      return (
        '<article class="service reveal">' +
          '<span class="s-num">' + pad(i + 1) + '</span>' +
          '<div class="s-name"><h3>' + esc(it.name) + '</h3><span>' + esc(it.name_mn) + '</span></div>' +
          '<div class="s-body"><p>' + esc(it.description) + '</p>' + (tags ? '<div class="tags">' + tags + '</div>' : '') + '</div>' +
        '</article>'
      );
    }).join('');
    return '<section class="sec services" id="services">' + sectionTop(s) + '<div class="service-list">' + rows + '</div></section>';
  }

  function about(a) {
    var stats = list(a.stats).map(function (s) {
      return '<div><b>' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>';
    }).join('');
    var photo = a.photo
      ? '<figure class="about-photo reveal">' + media(a.photo, { alt: a.name }) + '<div class="grain"></div>' +
          (a.photo_label ? '<figcaption>' + esc(a.photo_label) + '</figcaption>' : '') + '</figure>'
      : '';
    var quote = a.title_line1 || a.title_highlight || a.title_line2
      ? '<p class="quote">' + esc(a.title_line1) + ' <em>' + esc(a.title_highlight) + '</em> ' + esc(a.title_line2) + '</p>'
      : '';
    return (
      '<section class="sec about" id="about"><div class="about-inner' + (photo ? ' has-photo' : '') + '">' +
        photo +
        '<div class="about-copy reveal">' +
          '<div class="sec-meta"><span>' + esc(a.kicker) + '</span>' + (a.name_en ? '<span>' + esc(a.name_en) + '</span>' : '') + '</div>' +
          (a.name ? '<h2 class="about-name">' + blurText(a.name, 0.45) + '</h2>' : '') +
          (a.role ? '<div class="about-role">' + esc(a.role) + '</div>' : '') +
          quote +
          '<div class="about-text">' + paragraphs(a.text) + '</div>' +
          (stats ? '<div class="about-stats">' + stats + '</div>' : '') +
        '</div>' +
      '</div></section>'
    );
  }

  function contact(c) {
    var email = String(c.email || '').trim();
    var phone = String(c.phone || '').trim();
    var socials = list(c.socials).filter(function (s) { return s && s.url; }).map(function (s) {
      return '<a class="social" href="' + esc(url(s.url)) + '" target="_blank" rel="noopener">' + esc(s.name) + ' ↗</a>';
    }).join('');
    return (
      '<section class="contact" id="contact">' + fx('contact') +
        '<div class="frame">' +
          '<div class="corner tl">' + esc(c.kicker) + '</div>' +
          '<div class="corner tr">' + esc(c.big_text || 'CONTACT') + ' <span class="plus">+</span></div>' +
          '<div class="contact-inner reveal">' +
            '<h2 class="mega small">' +
              '<span class="line">' + blurText(c.title_line1, 0.7) + '</span>' +
              '<span class="line l2">' + blurText(String(c.title_line2 || '').replace(/\.$/, ''), 0.3) + '<span class="dot"></span></span>' +
            '</h2>' +
            '<p class="lead">' + esc(c.text) + '</p>' +
            '<div class="actions">' +
              (email ? '<a class="btn solid" href="mailto:' + esc(email) + '">' + esc(c.button) + ' →</a><a class="plain" href="mailto:' + esc(email) + '">' + esc(email) + '</a>' : '') +
              (phone ? '<a class="plain" href="tel:' + esc(phone.replace(/\s+/g, '')) + '">' + esc(phone) + '</a>' : '') +
            '</div>' +
            (socials ? '<div class="socials">' + socials + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function footer(f) {
    return '<footer class="footer"><span>' + esc(f.copyright) + '</span><span class="mark" aria-hidden="true"></span><span>' + esc(f.tagline) + '</span></footer>';
  }

  // ---------- behaviour ----------

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // autoplay muted videos only while visible (saves data + battery)
  function setupAutoVideos(root) {
    var vids = (root || document).querySelectorAll('video[data-auto]');
    if (!vids.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) return; // posters stay; users can open them
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (v.preload === 'none') v.preload = 'auto';
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else { v.pause(); }
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { v.muted = true; io.observe(v); });
  }

  // 3D ring: JS-driven so each card gets realistic light (violet glow from the centre, dark at the sides)
  function setupRing() {
    var ring = document.querySelector('.hero-v2 .ring');
    if (!ring) return;
    var cards = Array.prototype.slice.call(ring.querySelectorAll('.rc'));
    var n = cards.length, step = 360 / n, angle = 0, last = 0, paused = false, visible = true;
    var speed = reduceMotion ? 0 : 360 / 80; // one turn per 80s
    var hero = ring.closest('.hero-v2');
    hero.addEventListener('mouseenter', function () { paused = true; });
    hero.addEventListener('mouseleave', function () { paused = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(hero);
    function paint() {
      ring.style.transform = 'rotateX(-4deg) rotateY(' + angle + 'deg)';
      for (var i = 0; i < n; i++) {
        var rel = ((i * step + angle) % 360 + 540) % 360 - 180; // 0 = straight ahead (behind the portrait)
        var a = Math.abs(rel), c = cards[i];
        if (a > 112) { c.style.opacity = 0; c.style.visibility = 'hidden'; continue; }
        c.style.visibility = 'visible';
        var lit = Math.max(0, Math.cos(a * Math.PI / 180 * 0.85));
        var fade = a > 80 ? Math.max(0, 1 - (a - 80) / 32) : 1;
        c.style.opacity = fade.toFixed(3);
        c.style.setProperty('--lit', lit.toFixed(3));
        c.style.setProperty('--side', rel > 0 ? -1 : 1);
      }
    }
    function tick(t) {
      var dt = last ? Math.min(64, t - last) : 16; last = t;
      if (!paused && visible && speed) angle -= speed * dt / 1000;
      paint();
      requestAnimationFrame(tick);
    }
    paint();
    requestAnimationFrame(tick);
  }

  function enhance() {
    document.documentElement.classList.add('js');

    var header = document.getElementById('header');
    function onScroll() { header.classList.toggle('scrolled', window.scrollY > 30); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // mobile menu
    var toggle = document.getElementById('menu-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = header.classList.toggle('menu-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      header.querySelectorAll('.nav a').forEach(function (a) {
        a.addEventListener('click', function () { header.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); });
      });
    }

    setupAutoVideos(document);
    setupRing();
    requestAnimationFrame(function () { document.documentElement.classList.add('ready'); });

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 80 + 'ms';
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

  // ---------- modal (project detail + reel player) ----------

  function makeModal(id, cls) {
    var m = document.createElement('div');
    m.className = 'pd ' + (cls || '');
    m.id = id;
    m.hidden = true;
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML =
      '<div class="pd-backdrop" data-close></div>' +
      '<div class="pd-panel">' +
        '<button class="pd-close" type="button" data-close aria-label="Хаах">✕</button>' +
        '<div class="pd-body"></div><nav class="pd-nav"></nav>' +
      '</div>';
    document.body.appendChild(m);
    return m;
  }

  function stopVideos(root) { root.querySelectorAll('video').forEach(function (v) { v.pause(); }); }

  function setupProjects(projects) {
    var modal = makeModal('pd');
    modal.setAttribute('aria-labelledby', 'pd-title');
    var body = modal.querySelector('.pd-body');
    var nav = modal.querySelector('.pd-nav');
    var panel = modal.querySelector('.pd-panel');
    var openedFromPage = false, savedScroll = 0, returnFocus = null;

    function indexOf(s) {
      for (var i = 0; i < projects.length; i++) if (slug(projects[i], i) === s) return i;
      return -1;
    }

    function open(i) {
      var p = projects[i];
      stopVideos(body);
      body.innerHTML = projectDetail(p, i, projects.length);
      var prev = (i - 1 + projects.length) % projects.length;
      var next = (i + 1) % projects.length;
      nav.innerHTML = projects.length > 1
        ? '<a href="#project/' + slug(projects[prev], prev) + '" data-swap>← ' + esc(projects[prev].name) + '</a>' +
          '<a href="#project/' + slug(projects[next], next) + '" data-swap>' + esc(projects[next].name) + ' →</a>'
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
      stopVideos(body);
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
      if (e.target.closest('a.project')) { openedFromPage = modal.hidden; return; }
      var swap = e.target.closest('[data-swap]');
      if (swap && modal.contains(swap)) { e.preventDefault(); location.replace(swap.getAttribute('href')); return; }
      if (e.target.closest('[data-close]') && modal.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) close();
    });
    window.addEventListener('hashchange', route);
    route();
  }

  function setupReelPlayer(items) {
    if (!items.length) return;
    var modal = makeModal('reel-player', 'player');
    var body = modal.querySelector('.pd-body');
    var returnFocus = null;

    function open(i) {
      var it = items[i];
      if (!it) return;
      returnFocus = document.activeElement;
      body.innerHTML =
        '<div class="player-media r-' + esc(String(it.ratio || '16:9').replace(':', 'x')) + '">' +
          '<video controls playsinline autoplay' + (it.poster ? ' poster="' + esc(it.poster) + '"' : '') + '><source src="' + esc(it.video) + '" type="video/mp4"></video>' +
        '</div>' +
        '<div class="player-info"><h3>' + esc(it.title) + '</h3>' + (it.caption ? '<p>' + esc(it.caption) + '</p>' : '') + '</div>';
      modal.hidden = false;
      document.documentElement.classList.add('pd-open');
      requestAnimationFrame(function () { modal.classList.add('show'); });
      modal.querySelector('.pd-close').focus({ preventScroll: true });
    }
    function close() {
      if (modal.hidden) return;
      stopVideos(body);
      body.innerHTML = '';
      modal.classList.remove('show');
      modal.hidden = true;
      document.documentElement.classList.remove('pd-open');
      if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
    }

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-reel]');
      if (b) { open(+b.getAttribute('data-reel')); return; }
      if (e.target.closest('[data-close]') && modal.contains(e.target)) close();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
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
      var reelItems = list((d.reels || {}).items).filter(function (it) { return it && it.video; });
      app.innerHTML =
        hero(d.hero || {}, list((d.work || {}).projects)) +
        marquee(d.marquee) +
        work(d.work || {}) +
        reels(d.reels || {}) +
        services(d.services || {}) +
        about(d.about || {}) +
        contact(d.contact || {}) +
        footer(d.footer || {});
      enhance();
      setupProjects(list((d.work || {}).projects));
      setupReelPlayer(reelItems);
    })
    .catch(function (err) {
      console.error(err);
      app.innerHTML = '<p class="load-error">Контент ачаалж чадсангүй. Хуудсаа дахин ачаална уу.</p>';
    });
})();
