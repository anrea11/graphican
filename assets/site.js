/* Graphican — shared page behaviour (every page except the home page, which has the same in home.js):
   header · reveal · headings sharpening word by word · scroll-linked --p / --q on [data-sp] · page progress bar. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }

  // header
  var gh = $('#gh'), menu = $('#gh-menu'), nav = $('#gh-nav');
  function onScroll() { if (gh) gh.classList.toggle('scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function setMenu(o) { nav.classList.toggle('open', o); menu.setAttribute('aria-expanded', String(o)); }
  if (menu && nav) {
    menu.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    doc.addEventListener('click', function (e) { if (nav.classList.contains('open') && !gh.contains(e.target)) setMenu(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    var here = location.pathname;
    $$('a', nav).forEach(function (a) { if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page'); });
  }

  // reveal
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }); }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(function (el) { ro.observe(el); });
  } else $$('.rv').forEach(function (el) { el.classList.add('in'); });

  // headings: split into words (not in EN mode — the translator works on whole text nodes)
  var enMode = root.getAttribute('data-lang') === 'en';
  $$('[data-words]').forEach(function (h) {
    if (enMode) { h.classList.add('one'); return; }
    var n = 0;
    Array.prototype.slice.call(h.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var f = doc.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { f.appendChild(doc.createTextNode(' ')); return; }
          var w = doc.createElement('span'); w.className = 'wd'; w.style.setProperty('--i', n++); w.textContent = part; f.appendChild(w);
        });
        h.replaceChild(f, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') { node.classList.add('wd'); node.style.setProperty('--i', n++); }
    });
    h.style.setProperty('--n', n);
  });
  $$('[data-stagger]').forEach(function (g) { var m = +g.getAttribute('data-stagger') || 99; Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i % m); }); });

  // scroll-linked: --p reaches 1 when the element's top is 38% down the screen; --q runs 0 → 1 while it passes through
  var sps = $$('[data-sp]');
  if (calm || !('IntersectionObserver' in window)) sps.forEach(function (el) { el.style.setProperty('--p', 1); el.style.setProperty('--q', 0.5); });
  else {
    var live = [], raf = 0, bar = $('.sp-bar');
    var put = function (el, k, v) { v = v.toFixed(3); if (el['_' + k] !== v) { el['_' + k] = v; el.style.setProperty(k, v); } };
    var frame = function () {
      raf = 0; var vh = window.innerHeight, max = doc.documentElement.scrollHeight - vh;
      if (bar) put(root, '--sp', max > 0 ? Math.min(1, window.scrollY / max) : 0);
      for (var i = 0; i < live.length; i++) {
        var el = live[i], r = el.getBoundingClientRect(), need = Math.min(vh * 0.62, r.height + vh * 0.12);
        put(el, '--p', Math.max(0, Math.min(1, (vh - r.top) / need)));
        put(el, '--q', Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height))));
      }
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(frame); };
    sps.forEach(function (el) { el.style.setProperty('--p', 0); });
    var lo = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        var k = live.indexOf(e.target);
        if (e.isIntersecting && k < 0) live.push(e.target);
        else if (!e.isIntersecting) { if (k >= 0) live.splice(k, 1); if (e.boundingClientRect.top < 0) { put(e.target, '--p', 1); put(e.target, '--q', 1); } }
      });
      kick();
    }, { rootMargin: '15% 0px 15% 0px' });
    sps.forEach(function (el) { lo.observe(el); });
    window.addEventListener('scroll', kick, { passive: true }); window.addEventListener('resize', kick);
    kick();
  }
})();
