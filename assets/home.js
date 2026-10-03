/* Graphican — home page behaviour: header, reveal, demo windows (hero · tool switcher · scroll story), tool cards, font wall, templates, final CTA.
   No library: CSS does the animating, this file only switches states. Everything still reads and works without it. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var TOOLS = ['design', 'pdf', 'ppt', 'video'];
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function seen(el, fn, opt) {
    if (!el) return; if (!('IntersectionObserver' in window)) { fn(true); return; }
    new IntersectionObserver(function (en) { en.forEach(function (e) { fn(e.isIntersecting, e); }); }, opt || { threshold: 0.2 }).observe(el);
  }

  // ---------- header ----------
  var gh = $('#gh'), menu = $('#gh-menu'), nav = $('#gh-nav');
  function onScroll() { if (gh) gh.classList.toggle('scrolled', window.scrollY > 12); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function setMenu(o) { nav.classList.toggle('open', o); menu.setAttribute('aria-expanded', String(o)); }
  if (menu && nav) {
    menu.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    doc.addEventListener('click', function (e) { if (nav.classList.contains('open') && !gh.contains(e.target)) setMenu(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  }

  // ---------- MotionReveal ----------
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(function (el) { ro.observe(el); });
  } else $$('.rv').forEach(function (el) { el.classList.add('in'); });

  // ---------- DemoWindow ----------
  // set(tool) morphs the artboard; run() replays the steps of the current tool. Loops only while on screen.
  function Demo(el, loopMs) {
    var self = this; this.el = el; this.tool = el.getAttribute('data-tool'); this.loopMs = loopMs; this.vis = false; this.timer = 0; this.onLoop = null;
    seen(el, function (v) { self.vis = v; if (v) self.run(); else self.stop(); }, { threshold: 0.25 });
    doc.addEventListener('visibilitychange', function () { if (doc.hidden) self.stop(); else if (self.vis) self.run(); });
  }
  Demo.prototype.set = function (tool) { if (tool !== this.tool) { this.tool = tool; this.el.setAttribute('data-tool', tool); } this.run(); };
  Demo.prototype.run = function () {
    var el = this.el, self = this;
    this.stop();
    if (calm) return;
    el.classList.remove('run'); void el.offsetWidth; el.classList.add('run');
    if (this.loopMs) this.timer = setTimeout(function () { if (!self.vis || doc.hidden) return; if (self.onLoop) self.onLoop(); else self.run(); }, this.loopMs);
  };
  Demo.prototype.stop = function () { clearTimeout(this.timer); this.timer = 0; };

  // hero: calm automatic cycle Design → PDF → PPT → Video; hover / tap a label to pick, which pauses the cycle for a while
  var heroVis = $('#hero-vis');
  if (heroVis) {
    var hd = new Demo($('.gw', heroVis), 2400), tabs = $$('.hero-tabs [data-tool]', heroVis), hold = 0;
    var mark = function (t) { tabs.forEach(function (b) { var on = b.getAttribute('data-tool') === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); };
    hd.onLoop = function () { if (Date.now() < hold) { hd.run(); return; } var t = TOOLS[(TOOLS.indexOf(hd.tool) + 1) % 4]; mark(t); hd.set(t); };
    var pick = function (t) { hold = Date.now() + 7000; mark(t); hd.set(t); };
    tabs.forEach(function (b) {
      b.addEventListener('click', function () { pick(b.getAttribute('data-tool')); });
      if (fine) b.addEventListener('pointerenter', function () { if (b.getAttribute('data-tool') !== hd.tool) pick(b.getAttribute('data-tool')); });
    });
    // very small pointer parallax (desktop, motion allowed)
    if (fine && !calm) {
      var raf = 0, px = 0, py = 0, hero = heroVis.closest('.hero');
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect(); px = ((e.clientX - r.left) / r.width - 0.5) * 2; py = ((e.clientY - r.top) / r.height - 0.5) * 2;
        if (!raf) raf = requestAnimationFrame(function () { raf = 0; heroVis.style.setProperty('--px', px.toFixed(3)); heroVis.style.setProperty('--py', py.toFixed(3)); });
      });
      hero.addEventListener('pointerleave', function () { heroVis.style.setProperty('--px', 0); heroVis.style.setProperty('--py', 0); });
    }
  }

  // tool switcher (ToolTabs)
  var sw = $('#switch');
  if (sw) {
    var sd = new Demo($('.gw', sw), 7600), items = $$('.tsw-item', sw), panel = $('#tsw-panel');
    var choose = function (it, focus) {
      items.forEach(function (x) { var on = x === it, tb = $('.tsw-tab', x); x.classList.toggle('on', on); tb.setAttribute('aria-selected', String(on)); tb.tabIndex = on ? 0 : -1; });
      panel.setAttribute('aria-labelledby', $('.tsw-tab', it).id);
      sd.set(it.getAttribute('data-tool')); if (focus) $('.tsw-tab', it).focus();
    };
    items.forEach(function (it, i) {
      var tb = $('.tsw-tab', it); tb.tabIndex = it.classList.contains('on') ? 0 : -1;
      tb.addEventListener('click', function () { choose(it); });
      tb.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); choose(items[(i + d + items.length) % items.length], true); }
      });
    });
  }

  // tool cards: hover plays the little demo (CSS); on touch screens it plays while the card is on screen
  if (!fine && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (en) { en.forEach(function (e) { e.target.classList.toggle('play', e.isIntersecting); }); }, { threshold: 0.6 });
    $$('.tc').forEach(function (c) { co.observe(c); });
  }

  // font wall drifts only while visible; the number counts up once
  var fw = $('#fw');
  seen(fw, function (v) { fw.classList.toggle('live', v && !calm); }, { threshold: 0.05 });
  var cnt = $('#mn-count');
  if (cnt && !calm) {
    var to = +cnt.getAttribute('data-to'), done = false;
    seen(cnt, function (v) {
      if (!v || done) return; done = true;
      var t0 = performance.now();
      (function tick(now) { var p = Math.min(1, (now - t0) / 1100), q = 1 - Math.pow(1 - p, 3); cnt.textContent = Math.round(to * q); if (p < 1) requestAnimationFrame(tick); })(t0);
    }, { threshold: 0.6 });
  }

  // templates: staggered entrance; on desktop the two rows drift a little in opposite directions with the scroll
  var tw = $('#tp-wrap');
  if (tw) {
    $$('.tp-row', tw).forEach(function (r) { $$('.tp', r).forEach(function (c, i) { c.style.setProperty('--i', i); }); });
    var once = false;
    seen(tw, function (v) { if (v && !once) { once = true; tw.classList.add('in'); setTimeout(function () { tw.classList.add('done'); }, 1400); } }, { threshold: 0.12 });
    if (fine && !calm && window.innerWidth >= 900) {
      var tr = $$('.tp-track', tw), on = false, rf = 0;
      var move = function () {
        rf = 0; var r = tw.getBoundingClientRect(), p = (window.innerHeight - r.top) / (window.innerHeight + r.height);   // 0 → 1 while passing through
        p = Math.max(0, Math.min(1, p));
        tr.forEach(function (t, i) { var over = Math.max(0, t.scrollWidth - tw.clientWidth + 96), span = Math.min(160, over); t.style.setProperty('--tx', (i ? -span + span * p : -span * p).toFixed(1) + 'px'); });
      };
      seen(tw, function (v) { on = v; if (v) move(); }, { threshold: 0 });
      window.addEventListener('scroll', function () { if (on && !rf) rf = requestAnimationFrame(move); }, { passive: true });
    }
  }

  // ---------- scroll-linked motion: --p (coming in), --q (passing through) on [data-sp]; --hp on the hero; --sp page progress ----------
  // headings are split into words so they can sharpen one by one (not in EN mode: the translator works on whole text nodes)
  var enMode = root.getAttribute('data-lang') === 'en';
  $$('.sh h2, .mn-copy h2, .fin h2').forEach(function (h) {
    h.setAttribute('data-sp', '');
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
  $$('.tg .tc').forEach(function (c, i) { c.style.setProperty('--i', i < 4 ? i % 2 : (i - 4) % 3); });
  $$('.fin-btns .fb').forEach(function (b, i) { b.style.setProperty('--i', i); });
  var sps = $$('[data-sp]');
  if (calm || !('IntersectionObserver' in window)) sps.forEach(function (el) { el.style.setProperty('--p', 1); el.style.setProperty('--q', 0.5); });
  else {
    var live = [], sraf = 0, bar = $('.sp-bar');
    var put = function (el, k, v) { v = v.toFixed(3); if (el['_' + k] !== v) { el['_' + k] = v; el.style.setProperty(k, v); } };
    var frame = function () {
      sraf = 0; var vh = window.innerHeight, max = doc.documentElement.scrollHeight - vh;
      if (bar) put(root, '--sp', max > 0 ? Math.min(1, window.scrollY / max) : 0);
      for (var i = 0; i < live.length; i++) {
        var el = live[i], r = el.getBoundingClientRect();
        if (el.getAttribute('data-sp') === 'exit') { put(el, '--hp', Math.max(0, Math.min(1, -r.top / (r.height * 0.75)))); continue; }
        // --p reaches 1 when the element's top is 38% down the screen (or it is fully on screen, whichever comes first)
        var need = Math.min(vh * 0.62, r.height + vh * 0.12);
        put(el, '--p', Math.max(0, Math.min(1, (vh - r.top) / need)));
        put(el, '--q', Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height))));
      }
    };
    var kick = function () { if (!sraf) sraf = requestAnimationFrame(frame); };
    sps.forEach(function (el) { el.style.setProperty(el.getAttribute('data-sp') === 'exit' ? '--hp' : '--p', 0); });
    var lo = new IntersectionObserver(function (en) {
      en.forEach(function (e) { var k = live.indexOf(e.target); if (e.isIntersecting && k < 0) live.push(e.target); else if (!e.isIntersecting && k >= 0) { live.splice(k, 1); if (e.target.getAttribute('data-sp') !== 'exit' && e.boundingClientRect.top < 0) { put(e.target, '--p', 1); } } });
      kick();
    }, { rootMargin: '15% 0px 15% 0px' });
    sps.forEach(function (el) { lo.observe(el); });
    window.addEventListener('scroll', kick, { passive: true }); window.addEventListener('resize', kick);
    kick();
  }

  // ---------- pointer: a light that follows it in the hero / final section, and a glow on the card under it ----------
  if (fine && !calm) {
    var CARD = '.tc, .fb, .ht-review, .ql a, .dk a, .collab', pe = null, praf = 0, lastCard = null, lastSec = null;
    var pframe = function () {
      praf = 0; if (!pe) return;
      var t = pe.target && pe.target.closest ? pe.target : null, card = t && t.closest(CARD), sec = t && t.closest('.hero, .fin'), r;
      if (card !== lastCard) { if (lastCard) lastCard.classList.remove('gl-on'); if (card) card.classList.add('gl-on'); lastCard = card; }
      if (card) { r = card.getBoundingClientRect(); card.style.setProperty('--gx', (pe.clientX - r.left).toFixed(0) + 'px'); card.style.setProperty('--gy', (pe.clientY - r.top).toFixed(0) + 'px'); }
      if (sec !== lastSec) { if (lastSec) lastSec.classList.remove('lit'); if (sec) sec.classList.add('lit'); lastSec = sec; }
      if (sec) {
        r = sec.getBoundingClientRect(); sec.style.setProperty('--mx', (pe.clientX - r.left).toFixed(0) + 'px'); sec.style.setProperty('--my', (pe.clientY - r.top).toFixed(0) + 'px');
        if (sec.classList.contains('fin')) sec.style.setProperty('--fx', ((pe.clientX - r.left) / r.width).toFixed(3));
      }
    };
    doc.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; pe = e; if (!praf) praf = requestAnimationFrame(pframe); }, { passive: true });
    doc.documentElement.addEventListener('pointerleave', function () { if (lastCard) lastCard.classList.remove('gl-on'); if (lastSec) lastSec.classList.remove('lit'); lastCard = lastSec = null; });
  }

  // final CTA: four tool windows come together into the logo — once
  var fa = $('#fin-anim'), fdone = false;
  seen(fa, function (v) { if (v && !fdone) { fdone = true; fa.classList.add('in'); } }, { threshold: 0.6 });
})();
