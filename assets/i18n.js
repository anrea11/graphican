/*
  Graphican — MN / EN language switch.
  • The choice lives in localStorage 'gc-lang' ('mn' default, '?lang=en' also works) and applies to every page.
  • English mode loads /assets/i18n-en.js (a "Mongolian text": "English" dictionary) and translates the page
    as it is parsed and whenever scripts add new text (MutationObserver), so there's no Mongolian flash.
  • Text that isn't in the dictionary (e.g. something new added in /admin) is translated by /api/i18n
    (Workers AI, cached at the edge and in this browser). Never on pages that show the user's own files.
  • The MN | EN switch sits in the home page header.
*/
(function () {
  'use strict';
  var KEY = 'gc-lang', DICT = '/assets/i18n-en.js?v=1';
  var lang = 'mn';
  try {
    var q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'mn') localStorage.setItem(KEY, q);
    lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'mn';
  } catch (e) {}
  var root = document.documentElement;
  root.setAttribute('data-lang', lang);

  var G = window.GLang = {
    lang: lang,
    set: function (l) {
      try { localStorage.setItem(KEY, l === 'en' ? 'en' : 'mn'); } catch (e) {}
      var u = new URL(location.href); u.searchParams.delete('lang');
      location.replace(u.pathname + u.search + u.hash);
    },
    t: function (s) { return s; }
  };

  // ---------- MN | EN switch (home page header) ----------

  var css = '.lang-sw{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:999px;border:1px solid rgba(164,151,255,.28);background:rgba(255,255,255,.04);flex:none}' +
    '.lang-sw button{appearance:none;border:0;cursor:pointer;min-width:34px;height:28px;padding:0 9px;border-radius:999px;background:transparent;color:rgba(255,255,255,.62);font:600 11.5px/1 Inter,system-ui,sans-serif;letter-spacing:.06em;transition:background .2s,color .2s}' +
    '.lang-sw button:hover{color:#fff}.lang-sw button[aria-pressed="true"]{background:rgba(129,109,251,.32);color:#fff}' +
    '.header .lang-sw{margin-left:auto}.header .lang-sw+.dmenu{margin-left:10px}' +
    '@media (max-width:560px){.lang-sw button{min-width:28px;height:26px;padding:0 6px;font-size:10.5px}.header .lang-sw+.dmenu{margin-left:6px}}';
  function addSwitch() {
    var p = location.pathname;
    if (p !== '/' && p !== '/index.html') return;
    var h = document.querySelector('.header');
    if (!h || h.querySelector('.lang-sw')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var w = document.createElement('div');
    w.className = 'lang-sw'; w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Language'); w.setAttribute('translate', 'no');
    w.innerHTML = '<button type="button" data-l="mn" title="Монгол хэл">MN</button><button type="button" data-l="en" title="English">EN</button>';
    w.querySelector('[data-l="' + lang + '"]').setAttribute('aria-pressed', 'true');
    w.querySelector('[data-l="' + (lang === 'en' ? 'mn' : 'en') + '"]').setAttribute('aria-pressed', 'false');
    w.addEventListener('click', function (e) {
      var b = e.target.closest('[data-l]');
      if (b && b.dataset.l !== lang) G.set(b.dataset.l);
    });
    var anchor = h.querySelector('.dmenu') || h.querySelector('.header-cta') || h.querySelector('.menu-toggle');
    h.insertBefore(w, anchor);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addSwitch); else addSwitch();

  if (lang !== 'en') return;

  // ---------- English mode ----------

  root.lang = 'en';
  var CYR = /[Ѐ-ӿ]/;
  var D = null, DL = {}, RX = null, PATS = [];
  // pages that show the user's own documents/text: dictionary only, nothing is sent to the AI
  var PRIVATE = /^\/(editor|slides|tools\/(pdfedit|mongol-font|brand-color|upscale|bgremove|socialcrop|pdf))\/?/.test(location.pathname);
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1, CANVAS: 1, SVG: 0 };
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var done = new WeakMap(); // node → the value we last wrote (so our own writes aren't re-processed)

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function keepSpace(orig, v) { var a = orig.match(/^\s*/)[0], b = orig.match(/\s*$/)[0]; return a + v + b; }

  function lookup(k) {
    var v = D[k];
    if (v != null) return v;
    var nums = [];
    var pk = k.replace(/\d+(?:[.,]\d+)*/g, function (m) { nums.push(m); return '{' + (nums.length - 1) + '}'; });
    if (nums.length && (v = D[pk]) != null) return v.replace(/\{(\d)\}/g, function (m, i) { return nums[+i] != null ? nums[+i] : m; });
    return null;
  }
  // exact match → numbers pattern → known phrases inside a longer string
  function translate(s) {
    var k = norm(s);
    if (!k || !CYR.test(k)) return null;
    var v = lookup(k);
    if (v != null) return keepSpace(s, v);
    var cached = aiCache[k];
    if (cached) return keepSpace(s, cached);
    miss[k] = 1;
    var out = inner(s);
    if (out !== s) { if (CYR.test(out)) ask(k); return out; }
    ask(k);
    return null;
  }
  // known phrases inside a longer string ("Accent 1 #0E7490 — хуулах" → "… — copy"): number patterns first,
  // then literal phrases (longest first, whole words, any letter case)
  function inner(s) {
    var out = s;
    for (var i = 0; i < PATS.length; i++) out = out.replace(PATS[i][0], PATS[i][1]);
    if (RX) out = out.replace(RX, function (m, pre, w) {
      var v = D[w] != null ? D[w] : DL[w.toLowerCase()];
      if (v == null) return m;
      if (w[0] !== w[0].toUpperCase() && v[0] === v[0].toUpperCase() && !/^[A-Z]{2}/.test(v)) v = v[0].toLowerCase() + v.slice(1);
      return pre + v;
    });
    return out;
  }
  var miss = {};
  G.missing = function () { return Object.keys(miss); }; // for finding strings to add to the dictionary
  G.t = function (s) { var r = s && translate(String(s)); return r == null ? s : r; };

  function skipped(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentNode) {
      if (SKIP[n.nodeName]) return true;
      if (n.isContentEditable || n.getAttribute('translate') === 'no' || n.classList.contains('notranslate') || n.hasAttribute('data-no-i18n')) return true;
    }
    return false;
  }
  function doText(t) {
    var s = t.nodeValue;
    if (!s || !CYR.test(s) || done.get(t) === s) return;
    if (t.parentNode && skipped(t.parentNode)) return;
    var v = translate(s);
    if (v != null && v !== s) { done.set(t, v); t.nodeValue = v; waiting(t, norm(s)); }
    else waiting(t, norm(s));
  }
  function doAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = el.getAttribute(ATTRS[i]);
      if (a && CYR.test(a)) { var v = translate(a); if (v != null) el.setAttribute(ATTRS[i], v); }
    }
    if (el.nodeName === 'INPUT' && /^(button|submit|reset)$/.test(el.type) && CYR.test(el.value)) { var bv = translate(el.value); if (bv != null) el.value = bv; }
  }
  function walk(node) {
    if (node.nodeType === 3) { doText(node); return; }
    if (node.nodeType !== 1) return;
    if (node.nodeName === 'TEXTAREA') { if (!skipped(node.parentNode)) doAttrs(node); return; } // placeholder only, never the user's text
    if (SKIP[node.nodeName] || skipped(node)) return;
    doAttrs(node);
    var tw = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) {
          if (n.getAttribute('translate') === 'no' || n.isContentEditable) return NodeFilter.FILTER_REJECT;
          if (n.nodeName === 'TEXTAREA') doAttrs(n);
          return SKIP[n.nodeName] ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }

  // ---------- AI fallback for text that isn't in the dictionary ----------

  var aiCache = {}, AIKEY = 'gc-i18n-ai';
  try { aiCache = JSON.parse(localStorage.getItem(AIKEY) || '{}') || {}; } catch (e) { aiCache = {}; }
  var queue = {}, pending = {}, qT = null, nodesFor = {};
  function ask(k) {
    if (PRIVATE || k.length > 600 || pending[k] || aiCache[k] || !/^https?:$/.test(location.protocol)) return;
    queue[k] = 1; pending[k] = 1;
    clearTimeout(qT); qT = setTimeout(flush, 500);
  }
  function waiting(node, k) {
    if (!pending[k]) return;
    (nodesFor[k] = nodesFor[k] || []).push(node);
  }
  function flush() {
    var list = Object.keys(queue); queue = {};
    for (var i = 0; i < list.length; i += 40) send(list.slice(i, i + 40));
  }
  function send(list) {
    fetch('/api/i18n', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texts: list }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var out = d && d.texts;
        if (!out || out.length !== list.length) return;
        list.forEach(function (k, i) {
          var v = norm(String(out[i] || ''));
          delete pending[k];
          if (!v || CYR.test(v)) return;
          aiCache[k] = v;
          (nodesFor[k] || []).forEach(function (t) { if (t.isConnected && norm(done.get(t) || t.nodeValue) !== v) { var nv = keepSpace(t.nodeValue, v); done.set(t, nv); t.nodeValue = nv; } });
          delete nodesFor[k];
        });
        try {
          var s = JSON.stringify(aiCache);
          if (s.length > 400000) { aiCache = {}; s = '{}'; }
          localStorage.setItem(AIKEY, s);
        } catch (e) {}
      })
      .catch(function () { list.forEach(function (k) { delete pending[k]; delete nodesFor[k]; }); });
  }

  // ---------- start once the dictionary has loaded ----------

  G._init = function () {
    D = window.GC_I18N_EN || {};
    // phrases for "known text inside a longer string" (longest first, whole words only)
    var all = Object.keys(D);
    var ks = all.filter(function (k) { return !/\{\d\}/.test(k) && k.length > 1; }).sort(function (a, b) { return b.length - a.length; });
    ks.forEach(function (k) { var l = k.toLowerCase(); if (DL[l] == null) DL[l] = D[k]; });
    try { RX = new RegExp('(^|[^\\u0400-\\u04FF])(' + ks.map(reEsc).join('|') + ')(?![\\u0400-\\u04FF])', 'gi'); } catch (e) { RX = null; }
    all.filter(function (k) { return /\{\d\}/.test(k) && CYR.test(k); }).sort(function (a, b) { return b.length - a.length; }).forEach(function (k) {
      try {
        var rx = new RegExp('(^|[^\\u0400-\\u04FF\\d])' + reEsc(k).replace(/\\\{\d\\\}/g, '(\\d+(?:[.,]\\d+)*)') + '(?![\\u0400-\\u04FF])', 'g');
        var v = D[k];
        PATS.push([rx, function () { var a = arguments, n = 2; return a[1] + v.replace(/\{(\d)\}/g, function (m, i) { return a[+i + n] != null ? a[+i + n] : m; }); }]);
      } catch (e) {}
    });
    walk(root);
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'characterData') doText(m.target);
        else if (m.type === 'attributes') { var el = m.target; if (el.nodeType === 1 && !skipped(el.nodeName === 'TEXTAREA' ? el.parentNode : el)) doAttrs(el); }
        else for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]);
      }
    }).observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    // native dialogs
    ['alert', 'confirm'].forEach(function (f) { var o = window[f]; window[f] = function (msg) { return o.call(window, G.t(msg)); }; });
    var op = window.prompt; window.prompt = function (msg, def) { return op.call(window, G.t(msg), def); };
  };
  document.write('<script src="' + DICT + '"><\/script><script>GLang._init()<\/script>');
})();
