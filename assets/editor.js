/*
  Graphican Editor — a Canva-style design editor on Fabric.js (MIT).
  • Page = a white rect at scene (0,0) sized W×H; everything outside it is dimmed.
  • Fonts, palettes and brand colours come from /content/design.json (Design guide).
  • Autosaves to IndexedDB; images move to/from the /tools/ pages via handoff.js.
*/
(function () {
  'use strict';

  // ---------- helpers ----------

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  var toastT;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  function saveBlob(name, blob) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src;
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }

  // line icons (24×24)
  var P = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    size: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 4v16"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5L6 20"/>',
    shape: '<rect x="3" y="3" width="9" height="9" rx="1"/><circle cx="16.5" cy="16.5" r="4.5"/>',
    color: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1.3"/><circle cx="12" cy="7.5" r="1.3"/><circle cx="16" cy="10" r="1.3"/><path d="M12 21a3 3 0 0 1 0-6h2"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    up: '<path d="m7 11 5-5 5 5M12 6v13"/>', down: '<path d="m7 13 5 5 5-5M12 18V5"/>',
    bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
    italic: '<path d="M11 5h6M7 19h6M14 5l-4 14"/>',
    underline: '<path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14"/>',
    alignL: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>', alignC: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>', alignR: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
    caps: '<path d="M3 18 7.5 6 12 18M4.7 14h5.6M14 18l3.5-9 3.5 9M15 15.5h5"/>',
    spacing: '<path d="M4 20V4M20 20V4M8 12h8M10 9l-2 3 2 3M14 9l2 3-2 3"/>',
    flipH: '<path d="M12 3v18M4 7v10l5-5-5-5ZM20 7v10l-5-5 5-5Z"/>', flipV: '<path d="M3 12h18M7 4h10l-5 5-5-5ZM7 20h10l-5-5-5 5Z"/>',
    adjust: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    bg: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 17 6-6 5 5 3-3 4 4"/>',
    wand: '<path d="m4 20 11-11M15 4v2M15 12v2M11 8H9M21 8h-2M18.5 4.5 17 6M18.5 11.5 17 10"/>',
    align: '<path d="M12 3v18M6 7h12M8 12h8M5 17h14"/>',
    opacity: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none"/>',
    tpl: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    pen: '<path d="M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/><path d="m14 7 3 3"/>',
    marker: '<path d="m9 15-4 4h5l2-2M9 15l7-7 3 3-7 7M9 15l3 3"/>',
    spray: '<rect x="7" y="9" width="8" height="12" rx="2"/><path d="M9 9V6h4v3M16 4h.01M19 3h.01M19 6h.01M17 7h.01"/>',
    eraser: '<path d="m7 21-4-4 11-11 7 7-8 8H7Z"/><path d="M21 21H11M9 11l7 7"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
    mask: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18"/>',
    rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    fx: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>',
    group: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M11 7h4a2 2 0 0 1 2 2v4"/>',
    check: '<path d="m5 12 5 5L20 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>'
  };
  function icon(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + P[n] + '</svg>'; }

  // ---------- fonts (same catalogue as the Design guide) ----------
  // g: Google family if different · fs: Fontshare slug · cyr: has Cyrillic (Mongolian)
  var FONTS = {
    'Inter': { cyr: 1 }, 'Manrope': { cyr: 1 }, 'Montserrat': { cyr: 1 }, 'Roboto': { cyr: 1 }, 'Open Sans': { cyr: 1 },
    'Nunito': { cyr: 1 }, 'Mulish': { cyr: 1 }, 'Oswald': { cyr: 1 }, 'Playfair Display': { cyr: 1 }, 'Lora': { cyr: 1 },
    'Merriweather': { cyr: 1 }, 'Source Sans Pro': { g: 'Source Sans 3', cyr: 1 }, 'Mont': { g: 'Montserrat', cyr: 1 },
    'Sora': {}, 'Syne': {}, 'Plus Jakarta Sans': {}, 'Space Grotesk': {}, 'Outfit': {}, 'Poppins': {}, 'Lato': {},
    'Archivo Black': {}, 'Archivo': {}, 'Baloo': { g: 'Baloo 2' }, 'Quicksand': {}, 'Fredoka One': { g: 'Fredoka' },
    'DM Serif Display': {}, 'DM Sans': {}, 'Cinzel': {}, 'Fauna One': {}, 'Bebas Neue': {},
    'Clash Display': { fs: 'clash-display' }, 'Satoshi': { fs: 'satoshi' }, 'iBrand': { local: 1 }
  };
  function fam(name) { var f = FONTS[name] || {}; return f.fs || f.local ? name : (f.g || name); }
  // canvas text falls back to a serif for missing glyphs, so always chain Manrope (has Cyrillic)
  function stack(name) { var f = fam(name); return f === 'Manrope' ? '"Manrope", sans-serif' : '"' + f + '", "Manrope", sans-serif'; }
  function primary(ff) { return String(ff || '').split(',')[0].replace(/["']/g, '').trim(); }
  var fontLinks = {}, fontReady = {};
  function ensureFont(name) {
    var family = fam(name), f = FONTS[name] || {};
    if (fontReady[family]) return fontReady[family];
    if (!f.local && !fontLinks[family]) {
      fontLinks[family] = 1;
      var l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = f.fs ? 'https://api.fontshare.com/v2/css?f[]=' + f.fs + '@400,500,700&display=swap'
        : 'https://fonts.googleapis.com/css2?family=' + family.replace(/ /g, '+') + ':ital,wght@0,400;0,600;0,700;1,400&display=swap';
      document.head.appendChild(l);
    }
    fontReady[family] = Promise.all([
      document.fonts.load('400 40px "' + family + '"', 'АаӨөҮүBb'),
      document.fonts.load('700 40px "' + family + '"', 'АаӨөҮүBb')
    ]).catch(function () {}).then(function () { return family; });
    return fontReady[family];
  }
  // re-measure text after a web font arrives
  function refreshText(obj) {
    if (!obj || !obj.isType || !obj.isType('textbox')) return;
    obj.initDimensions(); obj.setCoords(); canvas.requestRenderAll();
  }

  // ---------- design data from the Design guide ----------

  var DG = { pairs: [], palettes: [], brand: [] };
  var BASE_PALETTE = ['#ffffff', '#0a0a10', '#816dfb', '#e7e3fd', '#34229e', '#f5f5f7', '#ff5a5f', '#ffb020', '#22c55e', '#0ea5e9'];

  function loadDesignGuide() {
    return fetch('/content/design.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
      ((d.fonts || {}).groups || []).forEach(function (g) {
        (g.items || []).forEach(function (it) { if (it.heading && it.body) DG.pairs.push({ heading: it.heading, body: it.body, desc: it.desc || '', group: g.name || '' }); });
      });
      ((d.palettes || {}).items || []).forEach(function (p) {
        DG.palettes.push({ name: p.name, colors: (p.colors || []).map(function (c) { return c.hex; }).filter(Boolean) });
      });
      DG.brand = ((d.guide || {}).colors || []).map(function (c) { return c.hex; }).filter(Boolean);
    }).catch(function () {});
  }

  // what the Design guide "Засварлагчид ашиглах" button handed over
  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem('gc-editor-prefs') || '{}') || {}; } catch (e) { prefs = {}; }
  function currentPair() {
    if (prefs.pair && prefs.pair.heading) return prefs.pair;
    return DG.pairs[0] || { heading: 'Manrope', body: 'Inter' };
  }

  // ---------- storage (IndexedDB) ----------

  function idb(mode, fn) {
    return new Promise(function (res, rej) {
      var r = indexedDB.open('graphican-editor', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onerror = function () { rej(r.error); };
      r.onsuccess = function () {
        var db = r.result, t = db.transaction('kv', mode), q = fn(t.objectStore('kv')), out;
        if (q) q.onsuccess = function () { out = q.result; };
        t.oncomplete = function () { db.close(); res(out); };
        t.onerror = function () { db.close(); rej(t.error); };
      };
    });
  }
  function dbGet(k) { return idb('readonly', function (s) { return s.get(k); }).catch(function () { return null; }); }
  function dbSet(k, v) { return idb('readwrite', function (s) { return s.put(v, k); }).catch(function () {}); }

  // ---------- canvas & page ----------

  var W = 1080, H = 1350, pageTransparent = false;
  var canvas, page, exporting = false, guides = [];
  var stage = $('#ed-stage');
  var PROPS = ['id', 'name', 'locked', 'selectable', 'evented', 'hasControls', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'hoverCursor'];

  fabric.Object.prototype.set({
    transparentCorners: false, cornerColor: '#ffffff', cornerStrokeColor: '#816dfb', borderColor: '#816dfb',
    cornerSize: 11, cornerStyle: 'circle', padding: 2, borderScaleFactor: 1.6
  });
  fabric.Textbox.prototype.set({ cursorColor: '#816dfb', editingBorderColor: '#a497ff', selectionColor: 'rgba(129,109,251,.3)' });

  canvas = new fabric.Canvas('ed-canvas', {
    preserveObjectStacking: true, backgroundColor: '#17171f', stopContextMenu: true,
    selectionColor: 'rgba(129,109,251,.10)', selectionBorderColor: '#816dfb', selectionLineWidth: 1, targetFindTolerance: 6
  });

  function makePage() {
    page = new fabric.Rect({
      left: 0, top: 0, width: W, height: H, fill: '#ffffff', id: 'page', name: 'Хуудас',
      selectable: false, evented: false, hoverCursor: 'default', objectCaching: false
    });
    return page;
  }
  function findPage() {
    page = canvas.getObjects().filter(function (o) { return o.id === 'page'; })[0];
    if (!page) { makePage(); canvas.insertAt(page, 0); }
    page.set({ selectable: false, evented: false });
    W = page.width; H = page.height;
  }
  function userObjects() { return canvas.getObjects().filter(function (o) { return o !== page && o.id !== '__crop'; }); }

  var CHECKER;
  function checker() {
    if (CHECKER) return CHECKER;
    var c = document.createElement('canvas'); c.width = c.height = 24;
    var x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 24, 24); x.fillStyle = '#e4e4ea'; x.fillRect(0, 0, 12, 12); x.fillRect(12, 12, 12, 12);
    return (CHECKER = new fabric.Pattern({ source: c, repeat: 'repeat' }));
  }
  function pageColor() { return pageTransparent ? 'transparent' : page.fill; }
  function setPageColor(hex) {
    if (hex === 'transparent') { pageTransparent = true; page.set('fill', checker()); }
    else { pageTransparent = false; page.set('fill', hex); }
    canvas.requestRenderAll(); commit();
  }

  function resizeCanvas() {
    var r = stage.getBoundingClientRect();
    canvas.setWidth(r.width); canvas.setHeight(r.height); canvas.calcOffset();
  }
  function fit() {
    var cw = canvas.getWidth(), ch = canvas.getHeight(), pad = cw < 700 ? 20 : 70;
    var top = $('#ed-ctx').hidden ? 0 : 40;
    var z = Math.min((cw - pad * 2) / W, (ch - pad * 2 - top) / H);
    canvas.setViewportTransform([z, 0, 0, z, (cw - W * z) / 2, (ch - H * z) / 2 + top / 2]);
    zoomLabel();
  }
  function zoomLabel() { $('#ed-zoom').textContent = Math.round(canvas.getZoom() * 100) + '%'; }
  function zoomBy(f, pt) {
    var z = clamp(canvas.getZoom() * f, 0.05, 8);
    canvas.zoomToPoint(pt || new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2), z);
    zoomLabel();
  }

  // dim everything outside the page + draw snap guides
  canvas.on('after:render', function (o) {
    if (exporting) return;
    var ctx = o.ctx || canvas.getContext(), v = canvas.viewportTransform, z = v[0];
    var x = v[4], y = v[5], w = W * z, h = H * z, cw = canvas.getWidth(), ch = canvas.getHeight();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var dpr = canvas.getRetinaScaling ? canvas.getRetinaScaling() : 1;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = 'rgba(23,23,31,.82)';
    ctx.fillRect(0, 0, cw, y); ctx.fillRect(0, y + h, cw, ch - y - h);
    ctx.fillRect(0, y, x, h); ctx.fillRect(x + w, y, cw - x - w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.lineWidth = 1; ctx.strokeRect(x - .5, y - .5, w + 1, h + 1);
    if (guides.length) {
      ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      guides.forEach(function (g) {
        ctx.beginPath();
        if (g.x != null) { ctx.moveTo(x + g.x * z, y); ctx.lineTo(x + g.x * z, y + h); }
        else { ctx.moveTo(x, y + g.y * z); ctx.lineTo(x + w, y + g.y * z); }
        ctx.stroke();
      });
    }
    ctx.restore();
  });

  // snap to page centre and edges while dragging
  canvas.on('object:moving', function (o) {
    if (o.target.id === '__crop') return;
    var obj = o.target, thr = 7 / canvas.getZoom();
    guides = [];
    var b = obj.getBoundingRect(true, true);
    var xs = [[b.left, 0], [b.left + b.width / 2, W / 2], [b.left + b.width, W]];
    var ys = [[b.top, 0], [b.top + b.height / 2, H / 2], [b.top + b.height, H]];
    var dx = null, dy = null;
    xs.forEach(function (p) { if (dx === null && Math.abs(p[0] - p[1]) < thr) { dx = p[1] - p[0]; guides.push({ x: p[1] }); } });
    ys.forEach(function (p) { if (dy === null && Math.abs(p[0] - p[1]) < thr) { dy = p[1] - p[0]; guides.push({ y: p[1] }); } });
    if (dx) obj.left += dx;
    if (dy) obj.top += dy;
    obj.setCoords();
  });
  canvas.on('mouse:up', function () { if (guides.length) { guides = []; canvas.requestRenderAll(); } });

  // wheel: pan (trackpad / mouse) · ctrl/⌘ + wheel or pinch: zoom
  canvas.on('mouse:wheel', function (o) {
    var e = o.e; e.preventDefault(); e.stopPropagation();
    if (e.ctrlKey || e.metaKey) zoomBy(Math.pow(0.998, e.deltaY), new fabric.Point(e.offsetX, e.offsetY));
    else { var v = canvas.viewportTransform; v[4] -= e.deltaX; v[5] -= e.deltaY; canvas.setViewportTransform(v); }
  });

  // space + drag / middle mouse: pan
  var spaceDown = false, panning = false, last = null;
  canvas.on('mouse:down', function (o) {
    var e = o.e;
    if (spaceDown || e.button === 1) {
      panning = true; canvas.selection = false; canvas.discardActiveObject();
      last = { x: e.clientX, y: e.clientY }; canvas.setCursor('grabbing');
    }
  });
  canvas.on('mouse:move', function (o) {
    if (!panning) return;
    var e = o.e, v = canvas.viewportTransform;
    v[4] += e.clientX - last.x; v[5] += e.clientY - last.y; last = { x: e.clientX, y: e.clientY };
    canvas.setViewportTransform(v);
  });
  canvas.on('mouse:up', function () { if (panning) { panning = false; canvas.selection = true; } });

  // ---------- history + autosave ----------

  var hist = [], hi = -1, restoring = false, commitT, saveT;
  function snapshot() {
    return JSON.stringify({ v: 1, W: W, H: H, name: $('#ed-name').value, transparent: pageTransparent, canvas: canvas.toJSON(PROPS) });
  }
  function commit() {
    if (restoring || crop) return;
    clearTimeout(commitT);
    commitT = setTimeout(pushHistory, 180);
    $('#ed-saved').textContent = 'Хадгалж байна…';
  }
  function pushHistory() {
    var s = snapshot();
    if (s === hist[hi]) { $('#ed-saved').textContent = 'Хадгалагдсан'; return; }
    hist = hist.slice(0, hi + 1); hist.push(s);
    if (hist.length > 40) hist.shift();
    hi = hist.length - 1;
    histButtons();
    clearTimeout(saveT);
    saveT = setTimeout(function () { dbSet('doc', s).then(function () { $('#ed-saved').textContent = 'Хадгалагдсан'; }); }, 400);
  }
  function histButtons() { $('#ed-undo').disabled = hi <= 0; $('#ed-redo').disabled = hi >= hist.length - 1; }
  function restore(s, keepView) {
    var d = JSON.parse(s);
    restoring = true;
    var vpt = canvas.viewportTransform.slice();
    return new Promise(function (res) {
      canvas.loadFromJSON(d.canvas, function () {
        canvas.backgroundColor = '#17171f';
        findPage();
        if (d.name) $('#ed-name').value = d.name;
        pageTransparent = !!d.transparent;
        if (pageTransparent) page.set('fill', checker());
        canvas.getObjects().forEach(function (o) { if (o.locked) lockObj(o, true); });
        if (keepView) canvas.setViewportTransform(vpt); else fit();
        canvas.renderAll();
        restoring = false;
        userObjects().forEach(function (o) { if (o.fontFamily) ensureFont(primary(o.fontFamily)).then(function () { refreshText(o); }); });
        refreshAll();
        res();
      });
    });
  }
  function undo() { if (hi > 0) { hi--; restore(hist[hi], true).then(function () { histButtons(); dbSet('doc', hist[hi]); }); } }
  function redo() { if (hi < hist.length - 1) { hi++; restore(hist[hi], true).then(function () { histButtons(); dbSet('doc', hist[hi]); }); } }

  canvas.on('object:added', function (o) { if (o.target !== page) { commit(); refreshLayers(); updateHint(); } });
  canvas.on('object:removed', function () { commit(); refreshLayers(); updateHint(); });
  canvas.on('object:modified', function () { commit(); refreshLayers(); refreshCtx(); });
  canvas.on('text:changed', function () { commit(); refreshLayers(); });
  canvas.on('selection:created', function () { refreshCtx(); refreshLayers(); });
  canvas.on('selection:updated', function () { refreshCtx(); refreshLayers(); });
  canvas.on('selection:cleared', function () { refreshCtx(); refreshLayers(); });
  $('#ed-name').addEventListener('input', commit);

  function updateHint() { $('#ed-hint').hidden = userObjects().length > 0 || draw.on; }

  // ---------- adding things ----------

  var NAMES = { textbox: 'Текст', image: 'Зураг', rect: 'Дөрвөлжин', circle: 'Тойрог', triangle: 'Гурвалжин', line: 'Шугам', polygon: 'Од' };
  function place(obj, opts) {
    opts = opts || {};
    obj.set({ name: obj.name || NAMES[obj.type] || 'Зүйл' });
    canvas.add(obj);
    if (!opts.keepPos) { obj.set({ left: W / 2, top: H / 2, originX: 'center', originY: 'center' }); normalizeOrigin(obj); }
    obj.setCoords();
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    return obj;
  }
  // keep all objects on top-left origin (simpler maths for align / snap)
  function normalizeOrigin(obj) {
    var c = obj.getCenterPoint();
    obj.set({ originX: 'left', originY: 'top' });
    obj.setPositionByOrigin(c, 'center', 'center');
  }

  var TEXT_STYLES = {
    h: { text: 'Гарчиг нэмэх', size: 0.085, weight: 700, role: 'heading' },
    s: { text: 'Дэд гарчиг нэмэх', size: 0.05, weight: 600, role: 'heading' },
    b: { text: 'Энд текстээ бичнэ үү. Давхар дарж засна.', size: 0.03, weight: 400, role: 'body' }
  };
  function addText(kind, fontName, text) {
    var st = TEXT_STYLES[kind], pair = currentPair();
    var f = fontName || (st.role === 'heading' ? pair.heading : pair.body);
    var base = Math.min(W, H * 0.9);
    var t = new fabric.Textbox(text || st.text, {
      fontFamily: stack(f), fontWeight: st.weight, fontSize: Math.round(base * st.size),
      fill: pageTransparent || isDark(page.fill) ? '#ffffff' : '#111118', width: Math.round(W * (kind === 'b' ? 0.6 : 0.8)),
      textAlign: 'center', lineHeight: kind === 'b' ? 1.4 : 1.1, charSpacing: 0, splitByGrapheme: false
    });
    place(t);
    ensureFont(f).then(function () { refreshText(t); commit(); });
    return t;
  }
  function addPair(p) {
    var h = addText('h', p.heading, 'Гарчиг');
    var b = addText('b', p.body, 'Энд тайлбар текстээ бичнэ үү.');
    h.set({ top: H / 2 - h.height - 10 }); b.set({ top: H / 2 + 10 });
    h.setCoords(); b.setCoords();
    canvas.setActiveObject(new fabric.ActiveSelection([h, b], { canvas: canvas }));
    canvas.requestRenderAll(); commit();
  }

  function isDark(hex) {
    if (typeof hex !== 'string' || hex[0] !== '#') return false;
    var n = parseInt(hex.slice(1).padEnd(6, '0').slice(0, 6), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) < 128;
  }

  var SHAPES = {
    rect: function () { return new fabric.Rect({ width: W * 0.34, height: W * 0.34, rx: 0, ry: 0, fill: '#816dfb' }); },
    rounded: function () { return new fabric.Rect({ width: W * 0.34, height: W * 0.34, rx: W * 0.04, ry: W * 0.04, fill: '#816dfb', name: 'Бөөрөнхий дөрвөлжин' }); },
    circle: function () { return new fabric.Circle({ radius: W * 0.17, fill: '#816dfb' }); },
    triangle: function () { return new fabric.Triangle({ width: W * 0.36, height: W * 0.31, fill: '#816dfb' }); },
    line: function () { return new fabric.Line([0, 0, W * 0.4, 0], { stroke: '#111118', strokeWidth: Math.max(4, W * 0.006), strokeLineCap: 'round' }); },
    star: function () {
      var pts = [], R = W * 0.18, r = R * 0.45;
      for (var i = 0; i < 10; i++) { var a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r : R; pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); }
      return new fabric.Polygon(pts, { fill: '#816dfb' });
    }
  };
  function addShape(k) { place(SHAPES[k]()); }

  // images: downscale huge photos, keep as data URL so the design saves offline
  function readImage(blob) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(blob), img = new Image();
      img.onload = function () {
        var max = 2400, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var png = /png|webp|svg/i.test(blob.type);
        res({ url: c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.92), w: c.width, h: c.height });
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('image')); };
      img.src = url;
    });
  }
  var recent = [];
  function addImageBlob(blob, opts) {
    opts = opts || {};
    return readImage(blob).then(function (r) {
      if (opts.recent !== false) { recent.unshift(r.url); recent = recent.slice(0, 12); if (activePanel === 'image') renderPanel('image'); }
      return addImageUrl(r.url, opts);
    }).catch(function () { toast('Зургийг уншиж чадсангүй'); });
  }
  function addImageUrl(url, opts) {
    opts = opts || {};
    return new Promise(function (res) {
      fabric.Image.fromURL(url, function (img) {
        if (opts.fillPage && !userObjects().length) {
          // empty design: make the page the photo's shape
          var k = Math.min(1, 2400 / Math.max(img.width, img.height));
          setSize(Math.round(img.width * k), Math.round(img.height * k), true);
          img.scale(W / img.width);
          place(img, { keepPos: true }); img.set({ left: 0, top: 0 }); img.setCoords();
        } else {
          img.scale(Math.min((W * 0.7) / img.width, (H * 0.7) / img.height, 1));
          place(img);
        }
        res(img);
      });
    });
  }

  // ---------- selection helpers ----------

  function active() { return canvas.getActiveObject(); }
  function kindOf(o) {
    if (!o) return null;
    if (o.type === 'activeSelection') return 'multi';
    if (o.isType('textbox') || o.isType('i-text') || o.isType('text')) return 'text';
    if (o.isType('image')) return 'image';
    if (o.type === 'group') return 'group';
    if (o.isType('line') || o.isType('path')) return 'line';
    return 'shape';
  }
  function eachSel(fn) {
    var o = active(); if (!o) return;
    if (o.type === 'activeSelection') o.getObjects().forEach(fn); else fn(o);
  }
  function setProp(k, v) { eachSel(function (o) { o.set(k, v); if (o.isType('textbox')) o.initDimensions(); o.setCoords(); }); canvas.requestRenderAll(); commit(); }
  function lockObj(o, on) {
    o.locked = on;
    o.set({ lockMovementX: on, lockMovementY: on, lockScalingX: on, lockScalingY: on, lockRotation: on, hasControls: !on, editable: !on, hoverCursor: on ? 'default' : null });
  }
  function duplicate() {
    var o = active(); if (!o) return;
    o.clone(function (c) {
      canvas.discardActiveObject();
      c.set({ left: c.left + 24, top: c.top + 24, evented: true });
      if (c.type === 'activeSelection') { c.canvas = canvas; c.forEachObject(function (x) { canvas.add(x); }); c.setCoords(); }
      else canvas.add(c);
      canvas.setActiveObject(c); canvas.requestRenderAll(); commit();
    }, PROPS);
  }
  function removeSel() {
    var o = active(); if (!o || o.isEditing) return;
    if (o.type === 'activeSelection') { o.getObjects().forEach(function (x) { canvas.remove(x); }); } else canvas.remove(o);
    canvas.discardActiveObject(); canvas.requestRenderAll();
  }
  function arrange(dir) {
    eachSel(function (o) {
      var i = canvas.getObjects().indexOf(o), n = canvas.getObjects().length;
      if (dir === 'up' && i < n - 1) canvas.moveTo(o, i + 1);
      if (dir === 'down' && i > 1) canvas.moveTo(o, i - 1); // index 0 = page
      if (dir === 'top') canvas.moveTo(o, n - 1);
      if (dir === 'bottom') canvas.moveTo(o, 1);
    });
    canvas.requestRenderAll(); commit(); refreshLayers();
  }
  function alignToPage(how) {
    var o = active(); if (!o) return;
    var b = o.getBoundingRect(true, true), dx = 0, dy = 0;
    if (how === 'left') dx = -b.left; if (how === 'hcenter') dx = W / 2 - (b.left + b.width / 2); if (how === 'right') dx = W - (b.left + b.width);
    if (how === 'top') dy = -b.top; if (how === 'vcenter') dy = H / 2 - (b.top + b.height / 2); if (how === 'bottom') dy = H - (b.top + b.height);
    o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords(); canvas.requestRenderAll(); commit();
  }
  function setAsBackground() {
    var o = active(); if (!o || !o.isType('image')) return;
    var s = Math.max(W / o.width, H / o.height);
    o.set({ scaleX: s * (o.flipX ? 1 : 1), scaleY: s, angle: 0, left: (W - o.width * s) / 2, top: (H - o.height * s) / 2 });
    o.setCoords(); canvas.moveTo(o, 1); canvas.requestRenderAll(); commit(); refreshLayers();
    toast('Дэвсгэр болголоо');
  }

  // image adjustments (Fabric filters)
  var F = fabric.Image.filters;
  function getFilter(img, Type) { return (img.filters || []).filter(function (f) { return f instanceof Type; })[0]; }
  function setFilter(img, Type, key, val, neutral) {
    img.filters = img.filters || [];
    var f = getFilter(img, Type);
    if (Math.abs(val - neutral) < 0.001) { if (f) img.filters.splice(img.filters.indexOf(f), 1); }
    else if (f) f[key] = val;
    else { var o = {}; o[key] = val; img.filters.push(new Type(o)); }
    img.applyFilters(); canvas.requestRenderAll();
  }

  // ---------- page size ----------

  var SIZES = [
    { id: 'ig45', name: 'Instagram пост', w: 1080, h: 1350 },
    { id: 'ig11', name: 'Квадрат пост', w: 1080, h: 1080 },
    { id: 'story', name: 'Story / Reels', w: 1080, h: 1920 },
    { id: 'fb', name: 'Facebook пост', w: 1200, h: 630 },
    { id: 'yt', name: 'YouTube thumbnail', w: 1280, h: 720 },
    { id: 'pres', name: 'Танилцуулга 16:9', w: 1920, h: 1080 },
    { id: 'a4', name: 'A4 постер', w: 1240, h: 1754 },
    { id: 'card', name: 'Нэрийн хуудас', w: 1050, h: 600 }
  ];
  function setSize(w, h, silent) {
    W = Math.round(clamp(w, 50, 6000)); H = Math.round(clamp(h, 50, 6000));
    page.set({ width: W, height: H }); page.setCoords();
    fit(); canvas.requestRenderAll();
    if (!silent) { commit(); toast(W + ' × ' + H + ' px'); }
    if (activePanel === 'size') renderPanel('size');
  }
  function newDesign() {
    if (userObjects().length && !confirm('Одоогийн дизайныг арилгаж шинээр эхлэх үү?')) return;
    canvas.discardActiveObject();
    userObjects().forEach(function (o) { canvas.remove(o); });
    pageTransparent = false; page.set('fill', '#ffffff');
    $('#ed-name').value = 'Нэргүй дизайн';
    setSize(1080, 1350, true); commit();
  }

  // ---------- image: crop mode ----------
  // The image temporarily shows in full; a dashed frame picks the part to keep.

  var crop = null;
  function startCrop() {
    var img = active(); if (!img || !img.isType('image') || crop) return;
    closePop();
    if (img.angle) { img.rotate(0); img.setCoords(); }
    var el = img.getElement(), ew = el.naturalWidth || el.width, eh = el.naturalHeight || el.height, s = img.scaleX, t = img.scaleY;
    var saved = { cropX: img.cropX || 0, cropY: img.cropY || 0, width: img.width, height: img.height, left: img.left, top: img.top, clipPath: img.clipPath };
    // where the full picture sits on the page (mirrored crops start from the other edge)
    var dxL = img.flipX ? (ew - saved.cropX - saved.width) * s : saved.cropX * s;
    var dyT = img.flipY ? (eh - saved.cropY - saved.height) * t : saved.cropY * t;
    img.set({ cropX: 0, cropY: 0, width: ew, height: eh, left: saved.left - dxL, top: saved.top - dyT, clipPath: null, selectable: false, evented: false });
    img.setCoords();
    var frame = new fabric.Rect({
      left: saved.left, top: saved.top, width: saved.width * s, height: saved.height * t, fill: 'rgba(0,0,0,0)',
      stroke: '#ffffff', strokeWidth: 2, strokeUniform: true, strokeDashArray: [8, 6], lockRotation: true,
      cornerColor: '#ffffff', cornerStrokeColor: '#816dfb', transparentCorners: false, excludeFromExport: true, id: '__crop', name: 'Тайралт'
    });
    frame.setControlsVisibility({ mtr: false });
    var bounds = { l: img.left, t: img.top, r: img.left + ew * s, b: img.top + eh * t };
    function keepInside() {
      var w = frame.width * frame.scaleX, h = frame.height * frame.scaleY;
      if (w > bounds.r - bounds.l) { frame.scaleX = (bounds.r - bounds.l) / frame.width; w = bounds.r - bounds.l; }
      if (h > bounds.b - bounds.t) { frame.scaleY = (bounds.b - bounds.t) / frame.height; h = bounds.b - bounds.t; }
      frame.left = clamp(frame.left, bounds.l, bounds.r - w);
      frame.top = clamp(frame.top, bounds.t, bounds.b - h);
      frame.setCoords();
    }
    frame.on('moving', keepInside); frame.on('scaling', keepInside);
    crop = { img: img, frame: frame, saved: saved, ew: ew, eh: eh };
    restoring = true; canvas.add(frame); restoring = false;
    canvas.setActiveObject(frame); canvas.requestRenderAll();
    refreshCtx();
  }
  function endCrop(apply) {
    if (!crop) return;
    var c = crop, img = c.img, f = c.frame, s = img.scaleX, t = img.scaleY;
    crop = null;
    restoring = true; canvas.remove(f); restoring = false;
    if (apply) {
      var dl = f.left - img.left, dt = f.top - img.top, w = f.width * f.scaleX, h = f.height * f.scaleY;
      var sx = img.flipX ? c.ew - (dl + w) / s : dl / s, sy = img.flipY ? c.eh - (dt + h) / t : dt / t;
      img.set({ cropX: Math.max(0, sx), cropY: Math.max(0, sy), width: w / s, height: h / t, left: f.left, top: f.top, clipPath: c.saved.clipPath });
    } else {
      img.set(c.saved);
    }
    img.set({ selectable: true, evented: true, dirty: true });
    if (img.clipPath) fitMask(img, img.clipPath.gMask);
    img.setCoords();
    canvas.setActiveObject(img); canvas.requestRenderAll();
    if (apply) commit();
    refreshCtx();
  }
  // darken the part of the photo that will be cut away
  canvas.on('after:render', function (o) {
    if (!crop || exporting) return;
    var ctx2 = o.ctx || canvas.getContext(), v = canvas.viewportTransform, z = v[0], img = crop.img, f = crop.frame;
    var ix = v[4] + img.left * z, iy = v[5] + img.top * z, iw = crop.ew * img.scaleX * z, ih = crop.eh * img.scaleY * z;
    var fx = v[4] + f.left * z, fy = v[5] + f.top * z, fw = f.width * f.scaleX * z, fh = f.height * f.scaleY * z;
    var dpr = canvas.getRetinaScaling ? canvas.getRetinaScaling() : 1;
    ctx2.save(); ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2.fillStyle = 'rgba(10,10,16,.62)';
    ctx2.beginPath(); ctx2.rect(ix, iy, iw, ih); ctx2.rect(fx + fw, fy, -fw, fh); ctx2.fill('evenodd');
    ctx2.restore();
  });

  // shape masks (clipPath in the image's own coordinates)
  function fitMask(img, kind) {
    var w = img.width, h = img.height, m = Math.min(w, h), cp = null;
    if (kind === 'circle') cp = new fabric.Circle({ radius: m / 2, originX: 'center', originY: 'center' });
    if (kind === 'oval') cp = new fabric.Ellipse({ rx: w / 2, ry: h / 2, originX: 'center', originY: 'center' });
    if (kind === 'rounded') cp = new fabric.Rect({ width: w, height: h, rx: m * 0.12, ry: m * 0.12, originX: 'center', originY: 'center' });
    if (kind === 'arch') cp = new fabric.Path('M ' + (-w / 2) + ' ' + (h / 2) + ' L ' + (-w / 2) + ' ' + (-h / 2 + w / 2) + ' A ' + (w / 2) + ' ' + (w / 2) + ' 0 0 1 ' + (w / 2) + ' ' + (-h / 2 + w / 2) + ' L ' + (w / 2) + ' ' + (h / 2) + ' Z', { originX: 'center', originY: 'center' });
    if (cp) cp.gMask = kind;
    img.set({ clipPath: cp, dirty: true });
  }
  function setMask(kind) {
    var img = active(); if (!img || !img.isType('image')) return;
    fitMask(img, kind === 'none' ? null : kind);
    canvas.requestRenderAll(); commit();
  }

  // ---------- image: AI background removal inside the editor (U²-Net-P) ----------

  var ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';
  var rmbg = { ready: null, session: null };
  function rmbgReady() {
    if (rmbg.ready) return rmbg.ready;
    rmbg.ready = (window.ort ? Promise.resolve() : loadScript(ORT + 'ort.min.js')).then(function () {
      window.ort.env.wasm.wasmPaths = ORT;
      window.ort.env.wasm.numThreads = 1;
      return window.ort.InferenceSession.create('/assets/vendor/u2netp.onnx', { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    }).then(function (s) { rmbg.session = s; });
    rmbg.ready.catch(function () { rmbg.ready = null; });
    return rmbg.ready;
  }
  function removeBackground(img) {
    var el = img.getElement(), W0 = el.naturalWidth || el.width, H0 = el.naturalHeight || el.height, S = 320;
    toast('AI дэвсгэрийг арилгаж байна… (анх удаа ~5MB загвар ачаална)');
    return rmbgReady().then(function () {
      var c = document.createElement('canvas'); c.width = S; c.height = S;
      var cx = c.getContext('2d'); cx.drawImage(el, 0, 0, S, S);
      var px = cx.getImageData(0, 0, S, S).data, n = S * S, max = 1, i, k;
      for (i = 0; i < n * 4; i++) if ((i & 3) !== 3 && px[i] > max) max = px[i];
      var mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225], data = new Float32Array(3 * n);
      for (i = 0; i < n; i++) for (k = 0; k < 3; k++) data[k * n + i] = (px[i * 4 + k] / max - mean[k]) / std[k];
      var s = rmbg.session, feeds = {};
      feeds[s.inputNames[0]] = new window.ort.Tensor('float32', data, [1, 3, S, S]);
      return s.run(feeds).then(function (out) {
        var m = out[s.outputNames[0]].data, lo = Infinity, hi = -Infinity;
        for (i = 0; i < n; i++) { if (m[i] < lo) lo = m[i]; if (m[i] > hi) hi = m[i]; }
        var mc = document.createElement('canvas'); mc.width = S; mc.height = S;
        var mx = mc.getContext('2d'), md = mx.createImageData(S, S);
        for (i = 0; i < n; i++) { var a = ((m[i] - lo) / ((hi - lo) || 1) - 0.2) / 0.6; md.data[i * 4 + 3] = a <= 0 ? 0 : a >= 1 ? 255 : Math.round(a * 255); }
        mx.putImageData(md, 0, 0);
        var o = document.createElement('canvas'); o.width = W0; o.height = H0;
        var ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high';
        ox.drawImage(el, 0, 0, W0, H0);
        ox.globalCompositeOperation = 'destination-in';
        ox.drawImage(mc, 0, 0, W0, H0);
        return o.toDataURL('image/png');
      });
    }).then(function (url) {
      return new Promise(function (res) {
        var keep = { width: img.width, height: img.height, cropX: img.cropX, cropY: img.cropY };
        img.setSrc(url, function () { img.set(keep); img.set('dirty', true); img.applyFilters(); canvas.requestRenderAll(); commit(); refreshLayers(); res(); });
      });
    }).then(function () { toast('Дэвсгэр арилгалаа'); })
      .catch(function (e) { console.error(e); toast('Дэвсгэр арилгаж чадсангүй. Интернэтээ шалгана уу.'); });
  }

  // ---------- image: filter presets ----------

  var PRESETS = [
    ['none', 'Анхны', null], ['bw', 'Хар цагаан', 'Grayscale'], ['sepia', 'Сепиа', 'Sepia'], ['vintage', 'Винтаж', 'Vintage'],
    ['kodachrome', 'Кодахром', 'Kodachrome'], ['technicolor', 'Техниколор', 'Technicolor'], ['polaroid', 'Полароид', 'Polaroid'], ['brownie', 'Бор', 'Brownie']
  ];
  function presetOf(img) {
    for (var i = 1; i < PRESETS.length; i++) if (F[PRESETS[i][2]] && getFilter(img, F[PRESETS[i][2]])) return PRESETS[i][0];
    return 'none';
  }
  function setPreset(img, id) {
    img.filters = (img.filters || []).filter(function (f) {
      return !PRESETS.some(function (p) { return p[2] && F[p[2]] && f instanceof F[p[2]]; });
    });
    var p = PRESETS.filter(function (x) { return x[0] === id; })[0];
    if (p && p[2] && F[p[2]]) img.filters.unshift(new F[p[2]]());
    img.applyFilters(); canvas.requestRenderAll(); commit();
  }

  // ---------- effects: shadow, outline, text background ----------

  function shadowOf(o) { return o.shadow ? o.shadow : null; }
  function setShadow(o, on, opts) {
    if (!on) { o.set('shadow', null); return; }
    var s = shadowOf(o) || {};
    o.set('shadow', new fabric.Shadow({
      color: opts.color != null ? opts.color : (s.color || 'rgba(0,0,0,0.45)'),
      blur: opts.blur != null ? opts.blur : (s.blur != null ? s.blur : Math.round(W * 0.02)),
      offsetX: opts.offset != null ? opts.offset : (s.offsetX != null ? s.offsetX : Math.round(W * 0.008)),
      offsetY: opts.offset != null ? opts.offset : (s.offsetY != null ? s.offsetY : Math.round(W * 0.008))
    }));
  }
  function rgba(hexc, a) {
    var n = parseInt(String(hexc).slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function rgbaParts(c) {
    var m = String(c || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return { hex: '#000000', a: 0.45 };
    var h = '#' + [m[1], m[2], m[3]].map(function (x) { return (+x).toString(16).padStart(2, '0'); }).join('');
    return { hex: h, a: m[4] == null ? 1 : +m[4] };
  }

  // ---------- grouping ----------

  function groupSel() {
    var o = active(); if (!o || o.type !== 'activeSelection') return;
    var g = o.toGroup(); g.set({ name: 'Бүлэг' });
    canvas.requestRenderAll(); commit(); refreshLayers(); refreshCtx();
  }
  function ungroupSel() {
    var o = active(); if (!o || o.type !== 'group') return;
    o.toActiveSelection(); canvas.requestRenderAll(); commit(); refreshLayers(); refreshCtx();
  }

  // ---------- drawing ----------

  var draw = { on: false, tool: 'pen', color: '#816dfb', size: 0 };
  function brushSize() { return draw.size || Math.max(4, Math.round(Math.min(W, H) * 0.012)); }
  function applyBrush() {
    if (draw.tool === 'eraser') { canvas.isDrawingMode = false; return; }
    var b = draw.tool === 'spray' ? new fabric.SprayBrush(canvas) : new fabric.PencilBrush(canvas);
    b.color = draw.tool === 'marker' ? rgba(draw.color, 0.4) : draw.color;
    b.width = draw.tool === 'marker' ? brushSize() * 2.5 : brushSize();
    if (b.decimate != null) b.decimate = 2;
    if (draw.tool === 'spray') { b.density = 30; b.dotWidth = Math.max(1, brushSize() / 6); }
    canvas.freeDrawingBrush = b;
    canvas.isDrawingMode = true;
  }
  function startDraw() {
    if (crop) endCrop(false);
    canvas.discardActiveObject();
    draw.on = true; applyBrush();
    canvas.selection = draw.tool !== 'eraser';
    canvas.skipTargetFind = draw.tool === 'eraser'; // eraser finds lines itself, never selects
    canvas.defaultCursor = draw.tool === 'eraser' ? 'cell' : 'default';
    $('#ed-hint').hidden = true;
    refreshCtx();
  }
  function stopDraw() {
    if (!draw.on) return;
    draw.on = false; canvas.isDrawingMode = false; canvas.selection = true; canvas.skipTargetFind = false; canvas.defaultCursor = 'default';
    updateHint(); refreshCtx();
  }
  canvas.on('path:created', function (e) {
    e.path.set({ name: draw.tool === 'marker' ? 'Маркер' : draw.tool === 'spray' ? 'Шүршигч' : 'Зураас', perPixelTargetFind: true });
    commit(); refreshLayers();
  });
  canvas.on('object:added', function (e) {
    // spray brush adds a group — give it a name too
    if (draw.on && e.target && e.target.type === 'group' && !e.target.name) e.target.set({ name: 'Шүршигч' });
  });
  // eraser: drag over drawn lines to delete them
  var erasing = false;
  canvas.on('mouse:down', function (o) { if (draw.on && draw.tool === 'eraser') { erasing = true; eraseAt(o.e); } });
  canvas.on('mouse:move', function (o) { if (erasing) eraseAt(o.e); });
  canvas.on('mouse:up', function () { erasing = false; });
  function eraseAt(e) {
    canvas.skipTargetFind = false;
    var t = canvas.findTarget(e, true);
    canvas.skipTargetFind = true;
    if (t && t !== page && (t.isType('path') || (t.type === 'group' && /Шүршигч/.test(t.name || '')))) { canvas.remove(t); canvas.requestRenderAll(); }
  }

  // ---------- templates ----------

  var TEMPLATES = [
    { id: 'sale', name: 'Хямдралын пост', w: 1080, h: 1350, bg: '#0b0b14', sw: ['#0b0b14', '#816dfb', '#e7e3fd'] },
    { id: 'event', name: 'Арга хэмжээний постер', w: 1080, h: 1350, bg: '#e7e3fd', sw: ['#e7e3fd', '#34229e', '#16161f'] },
    { id: 'quote', name: 'Ишлэл', w: 1080, h: 1080, bg: '#16161f', sw: ['#16161f', '#816dfb', '#ffffff'] },
    { id: 'story', name: 'Story — шинэ бүтээгдэхүүн', w: 1080, h: 1920, bg: '#816dfb', sw: ['#816dfb', '#ffffff', '#0b0b14'] },
    { id: 'yt', name: 'YouTube thumbnail', w: 1280, h: 720, bg: '#0b0b14', sw: ['#0b0b14', '#ffffff', '#ff4fd8'] },
    { id: 'card', name: 'Нэрийн хуудас', w: 1050, h: 600, bg: '#16161f', sw: ['#16161f', '#e7e3fd', '#816dfb'] }
  ];
  function T(text, o) {
    var pair = currentPair(), f = o.body ? pair.body : pair.heading;
    var t = new fabric.Textbox(text, {
      fontFamily: stack(f), fontWeight: o.weight || (o.body ? 400 : 700), fontSize: o.size, fill: o.color || '#ffffff',
      width: o.width || W * 0.84, textAlign: o.align || 'center', lineHeight: o.lh || 1.1, charSpacing: o.cs || 0, name: o.name
    });
    t.set({ left: o.left != null ? o.left : (W - t.width) / 2, top: o.top });
    if (o.stroke) t.set({ stroke: o.stroke, strokeWidth: o.strokeWidth || 4, paintFirst: 'stroke' });
    ensureFont(f).then(function () { refreshText(t); });
    canvas.add(t); return t;
  }
  function R(o) { var r = new fabric.Rect(o); canvas.add(r); return r; }
  function useTemplate(id) {
    var tp = TEMPLATES.filter(function (x) { return x.id === id; })[0]; if (!tp) return;
    if (userObjects().length && !confirm('Одоогийн дизайныг загвараар солих уу?')) return;
    restoring = true;
    canvas.discardActiveObject();
    userObjects().forEach(function (o) { canvas.remove(o); });
    pageTransparent = false; page.set('fill', tp.bg);
    W = tp.w; H = tp.h; page.set({ width: W, height: H }); page.setCoords();
    if (id === 'sale') {
      T('ХЯМДРАЛ', { top: 150, size: 96, color: '#e7e3fd', cs: 300 });
      T('−30%', { top: 330, size: 330, color: '#816dfb', lh: 1 });
      T('Зөвхөн энэ долоо хоногт бүх бүтээгдэхүүнд', { top: 760, size: 44, color: '#a6a8b8', body: true, width: 760 });
      R({ left: 290, top: 1010, width: 500, height: 120, rx: 60, ry: 60, fill: '#816dfb', name: 'Товч' });
      T('Одоо захиалах', { top: 1042, size: 42, color: '#ffffff', body: true, weight: 700, width: 500, left: 290 });
    } else if (id === 'event') {
      var c = new fabric.Circle({ left: 560, top: -220, radius: 420, fill: '#816dfb', name: 'Чимэглэл' }); canvas.add(c);
      T('DEMO DAY · 2026', { top: 560, size: 38, color: '#34229e', cs: 250, align: 'left', left: 90 });
      T('Арга хэмжээний нэрээ энд бичнэ', { top: 640, size: 108, color: '#16161f', align: 'left', left: 90, width: 900 });
      R({ left: 90, top: 1080, width: 900, height: 3, fill: '#16161f', name: 'Шугам' });
      T('10.15 · 18:00  —  Улаанбаатар, Galaxy Tower', { top: 1120, size: 38, color: '#16161f', body: true, align: 'left', left: 90, width: 900 });
    } else if (id === 'quote') {
      T('“', { top: 70, size: 360, color: '#816dfb', lh: 1 });
      T('Дизайн гэдэг зүгээр л гоё харагдах биш, хэрхэн ажиллахыг хэлнэ.', { top: 380, size: 64, color: '#ffffff', width: 860, lh: 1.25 });
      T('— Стив Жобс', { top: 800, size: 36, color: '#a497ff', body: true });
    } else if (id === 'story') {
      T('ШИНЭ', { top: 180, size: 64, color: '#ffffff', cs: 400 });
      R({ left: 140, top: 360, width: 800, height: 800, rx: 40, ry: 40, fill: 'rgba(255,255,255,0.18)', name: 'Зургийн байр' });
      T('Бүтээгдэхүүний зургаа энд чирж тавина', { top: 730, size: 38, color: '#ffffff', body: true, width: 640 });
      T('Бүтээгдэхүүний нэр', { top: 1280, size: 104, color: '#ffffff', width: 900 });
      R({ left: 330, top: 1560, width: 420, height: 130, rx: 65, ry: 65, fill: '#ffffff', name: 'Үнийн шошго' });
      T('49,900₮', { top: 1590, size: 64, color: '#0b0b14', width: 420, left: 330 });
    } else if (id === 'yt') {
      R({ left: 0, top: 560, width: 1280, height: 160, fill: '#ff4fd8', name: 'Тууз' });
      T('ГАРЧИГ ЭНД', { top: 150, size: 170, color: '#ffffff', stroke: '#000000', strokeWidth: 10, width: 1180, lh: 1 });
      T('Видеоны дэд гарчиг', { top: 600, size: 64, color: '#0b0b14', weight: 700, width: 1180 });
    } else if (id === 'card') {
      T('Нэр Овог', { top: 150, size: 72, color: '#e7e3fd', align: 'left', left: 90, width: 800 });
      T('График дизайнер', { top: 250, size: 34, color: '#816dfb', body: true, align: 'left', left: 90, width: 800 });
      R({ left: 90, top: 340, width: 120, height: 4, fill: '#816dfb', name: 'Шугам' });
      T('+976 8000 0000\nhello@graphican.online\ngraphican.online', { top: 380, size: 30, color: '#a6a8b8', body: true, align: 'left', left: 90, width: 800, lh: 1.5 });
    }
    restoring = false;
    fit(); canvas.requestRenderAll(); commit(); refreshAll();
    toast('«' + tp.name + '» загвар — текстүүд дээр давхар дарж засна');
  }

  // ---------- shortcuts help ----------

  $('#ed-help').addEventListener('click', function (e) {
    var ex = $('#ed-help-pop'); if (ex) { ex.remove(); return; }
    var p = document.createElement('div'); p.className = 'pop pop-r help-pop'; p.id = 'ed-help-pop';
    p.innerHTML = '<p class="pop-t">Товчлолууд</p>' + [
      ['Ctrl + Z / Ctrl + Shift + Z', 'Буцаах / дахин хийх'], ['Ctrl + C / V / D', 'Хуулах / буулгах / хувилах'], ['Delete', 'Устгах'],
      ['Ctrl + G / Ctrl + Shift + G', 'Бүлэглэх / задлах'], ['Сум (Shift)', '1px (10px) зөөх'], ['Enter / давхар дарах', 'Текст засах'],
      ['Space + чирэх', 'Хуудсыг гүйлгэх'], ['Ctrl + хулганы дугуй', 'Томруулах / жижигрүүлэх'], ['Ctrl + 0', 'Дэлгэцэнд багтаах'], ['Esc', 'Сонголт / горимоос гарах']
    ].map(function (r) { return '<div class="kb"><kbd>' + r[0] + '</kbd><span>' + r[1] + '</span></div>'; }).join('');
    this.parentNode.style.position = 'relative'; this.parentNode.appendChild(p);
    e.stopPropagation();
  });
  document.addEventListener('mousedown', function (e) { var p = $('#ed-help-pop'); if (p && !p.contains(e.target) && e.target.id !== 'ed-help') p.remove(); });

  // ---------- panels ----------

  var RAIL = [
    { id: 'tpl', label: 'Загвар', icon: 'tpl' },
    { id: 'size', label: 'Хэмжээ', icon: 'size' },
    { id: 'text', label: 'Текст', icon: 'text' },
    { id: 'image', label: 'Зураг', icon: 'image' },
    { id: 'shape', label: 'Хэлбэр', icon: 'shape' },
    { id: 'draw', label: 'Зурах', icon: 'pen' },
    { id: 'color', label: 'Өнгө', icon: 'color' },
    { id: 'layers', label: 'Давхарга', icon: 'layers' }
  ];
  var activePanel = null;
  $('#ed-rail').innerHTML = RAIL.map(function (r) {
    return '<button type="button" data-rail="' + r.id + '" aria-label="' + r.label + '">' + icon(r.icon) + '<span>' + r.label + '</span></button>';
  }).join('');
  $('#ed-rail').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rail]'); if (!b) return;
    var id = b.getAttribute('data-rail');
    openPanel(activePanel === id && window.innerWidth <= 820 ? null : id);
  });
  function openPanel(id) {
    if (activePanel === 'draw' && id !== 'draw') stopDraw();
    activePanel = id;
    if (id === 'draw') startDraw();
    $$('#ed-rail [data-rail]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-rail') === id); });
    $('#ed-panel').classList.toggle('closed', !id);
    if (id) renderPanel(id);
    setTimeout(function () { resizeCanvas(); if (window.innerWidth <= 820) fit(); canvas.requestRenderAll(); }, 0);
  }

  function renderPanel(id) {
    var el = $('#ed-panel'), h = '';
    if (id === 'tpl') {
      h = '<div class="pn-h"><h2>Загвар</h2></div><p class="pn-note" style="margin:-4px 0 12px">Бэлэн загвараас эхлээд текст, өнгө, зургийг нь сольж өөрийнхөө болгоно.</p>' +
        '<div class="tpl-grid">' + TEMPLATES.map(function (t) {
          var k = 118 / Math.max(t.w, t.h);
          return '<button type="button" class="tpl" data-tpl="' + t.id + '"><span class="tpl-prev" style="width:' + Math.round(t.w * k) + 'px;height:' + Math.round(t.h * k) + 'px;background:' + t.sw[0] + '">' +
            '<i style="background:' + t.sw[1] + '"></i><i style="background:' + t.sw[2] + '"></i></span><b>' + esc(t.name) + '</b><span>' + t.w + ' × ' + t.h + '</span></button>';
        }).join('') + '</div>';
    }
    if (id === 'draw') {
      var tools = [['pen', 'Үзэг', 'pen'], ['marker', 'Маркер', 'marker'], ['spray', 'Шүршигч', 'spray'], ['eraser', 'Баллуур', 'eraser']];
      var colors = [draw.color].concat(DG.brand, BASE_PALETTE).filter(function (c, i, a) { return c && a.indexOf(c) === i; }).slice(0, 14);
      h = '<div class="pn-h"><h2>Зурах</h2></div>' +
        '<div class="dr-tools">' + tools.map(function (t) { return '<button type="button" class="dr-t' + (draw.tool === t[0] ? ' on' : '') + '" data-draw-tool="' + t[0] + '">' + icon(t[2]) + '<span>' + t[1] + '</span></button>'; }).join('') + '</div>' +
        (draw.tool === 'eraser' ? '<p class="pn-note">Зурсан зураас дээгүүр чирэхэд арилна.</p>' :
          '<p class="pn-sub">Өнгө</p><div class="sw-row"><span class="sw-pick" title="Өөр өнгө"><input type="color" id="dr-pick" value="' + draw.color + '" aria-label="Өнгө сонгох"></span>' +
          colors.map(function (c) { return '<button type="button" class="sw' + (c === draw.color ? ' on' : '') + '" data-draw-color="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>'; }).join('') + '</div>' +
          '<p class="pn-sub">Зузаан <b id="dr-size-v" style="color:var(--text);font-weight:500">' + brushSize() + 'px</b></p>' +
          '<input type="range" id="dr-size" min="1" max="' + Math.round(Math.min(W, H) * 0.08) + '" value="' + brushSize() + '" style="width:100%;accent-color:var(--v3)">') +
        '<button type="button" class="pn-btn solid" id="dr-done" style="margin-top:18px">' + icon('check') + 'Зурж дуусгах</button>' +
        '<p class="pn-note">Зурсан зураас бүр тусдаа давхарга болно — дараа нь сонгоод зөөж, өнгийг нь сольж болно.</p>';
    }
    if (id === 'size') {
      h = '<div class="pn-h"><h2>Хэмжээ</h2><span class="ctx-lbl">' + W + ' × ' + H + '</span></div>' +
        '<div class="sz-grid">' + SIZES.map(function (s) {
          var k = 34 / Math.max(s.w, s.h);
          return '<button type="button" class="sz-b' + (s.w === W && s.h === H ? ' on' : '') + '" data-size="' + s.id + '"><span class="sz-shape" style="width:' + Math.round(s.w * k) + 'px;height:' + Math.round(s.h * k) + 'px"></span><b>' + s.name + '</b><span>' + s.w + ' × ' + s.h + '</span></button>';
        }).join('') + '</div>' +
        '<p class="pn-sub">Өөрийн хэмжээ (px)</p>' +
        '<div class="sz-custom"><input class="fld" id="sz-w" type="number" min="50" max="6000" value="' + W + '" aria-label="Өргөн"><span>×</span><input class="fld" id="sz-h" type="number" min="50" max="6000" value="' + H + '" aria-label="Өндөр"></div>' +
        '<button type="button" class="pn-btn" id="sz-apply" style="margin-top:8px">Хэмжээ өөрчлөх</button>' +
        '<p class="pn-sub">Дизайн</p>' +
        '<button type="button" class="pn-btn" id="sz-new">＋ Шинэ дизайн</button>' +
        '<p class="pn-note">Дизайн тань энэ төхөөрөмж дээр автоматаар хадгалагдана. Дараа орж ирэхэд үргэлжилнэ.</p>';
    }
    if (id === 'text') {
      h = '<div class="pn-h"><h2>Текст</h2></div>' +
        '<button type="button" class="tx-preset h" data-text="h">Гарчиг нэмэх</button>' +
        '<button type="button" class="tx-preset s" data-text="s">Дэд гарчиг нэмэх</button>' +
        '<button type="button" class="tx-preset b" data-text="b">Энгийн текст нэмэх</button>' +
        '<p class="pn-sub">Design guide-ийн фонтын хослол</p>' +
        (DG.pairs.length ? DG.pairs.map(function (p, i) {
          return '<button type="button" class="pair" data-pair="' + i + '"><b style="font-family:\'' + esc(fam(p.heading)) + '\'">' + esc(p.heading) + '</b><span style="font-family:\'' + esc(fam(p.body)) + '\'">' + esc(p.body) + ' — ' + esc(p.desc) + '</span><i>' + esc(p.group) + (FONTS[p.heading] && FONTS[p.heading].cyr ? ' · Кирилл ✓' : '') + '</i></button>';
        }).join('') : '<p class="pn-note">Фонтын хослол ачаалж байна…</p>');
    }
    if (id === 'image') {
      h = '<div class="pn-h"><h2>Зураг</h2></div>' +
        '<button type="button" class="pn-btn solid" id="up-btn">Зураг оруулах</button>' +
        '<div class="drop-box" style="margin-top:10px"><b>эсвэл зургаа хуудас руу чирж тавина</b>Ctrl+V-ээр хуулсан зургаа буулгаж болно</div>' +
        (recent.length ? '<p class="pn-sub">Оруулсан зургууд</p><div class="up-grid">' + recent.map(function (u, i) { return '<button type="button" data-recent="' + i + '" style="background-image:url(\'' + u + '\')" aria-label="Зураг нэмэх"></button>'; }).join('') + '</div>' : '') +
        '<p class="pn-sub">Зургаа засах</p>' +
        '<p class="pn-note">Зураг дээр дарахад дээд талд <b>Тайрах</b>, <b>Хэлбэр</b> (тойрог, бөөрөнхий…), <b>Засах</b> (шүүлтүүр, гэрэл, өнгө), <b>AI дэвсгэр арилгах</b>, <b>Эффект</b> гарна.</p>';
    }
    if (id === 'shape') {
      var sv = {
        rect: '<rect x="3" y="3" width="18" height="18"/>', rounded: '<rect x="3" y="3" width="18" height="18" rx="5"/>',
        circle: '<circle cx="12" cy="12" r="10"/>', triangle: '<path d="M12 3 22 21H2z"/>',
        line: '<rect x="2" y="11" width="20" height="2.4" rx="1.2"/>', star: '<path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z"/>'
      };
      h = '<div class="pn-h"><h2>Хэлбэр</h2></div><div class="sh-grid">' + Object.keys(sv).map(function (k) {
        return '<button type="button" data-shape="' + k + '" aria-label="' + (NAMES[k] || k) + '"><svg viewBox="0 0 24 24">' + sv[k] + '</svg></button>';
      }).join('') + '</div><p class="pn-note">Хэлбэр сонгоод өнгийг нь дээд талын самбараас эсвэл «Өнгө» хэсгээс солино.</p>';
    }
    if (id === 'color') {
      var o = active(), target = o && kindOf(o) !== 'image' ? (kindOf(o) === 'text' ? 'текстийн өнгө' : kindOf(o) === 'multi' ? 'сонгосон зүйлс' : 'хэлбэрийн өнгө') : 'хуудасны дэвсгэр';
      var sw = function (c) { return '<button type="button" class="sw" data-color="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>'; };
      h = '<div class="pn-h"><h2>Өнгө</h2></div>' +
        '<p class="target-note">Дарвал: <b>' + target + '</b> өөрчлөгдөнө</p>' +
        '<div class="sw-row">' + '<span class="sw-pick" title="Өөр өнгө сонгох"><input type="color" id="col-pick" value="#816dfb" aria-label="Өнгө сонгох"></span>' +
        BASE_PALETTE.map(sw).join('') + (target === 'хуудасны дэвсгэр' ? '<button type="button" class="sw clear" data-color="transparent" title="Тунгалаг дэвсгэр" aria-label="Тунгалаг"></button>' : '') + '</div>' +
        (prefs.palette && prefs.palette.colors ? '<p class="pn-sub">Design guide-ээс сонгосон</p><div class="pal"><div class="pal-name"><span>' + esc(prefs.palette.name || '') + '</span></div><div class="sw-row">' + prefs.palette.colors.map(sw).join('') + '</div></div>' : '') +
        (DG.brand.length ? '<p class="pn-sub">Graphican брэнд</p><div class="sw-row">' + DG.brand.map(sw).join('') + '</div>' : '') +
        (DG.palettes.length ? '<p class="pn-sub">Өнгөний палитрууд</p>' + DG.palettes.map(function (p) {
          return '<div class="pal"><div class="pal-name"><span>' + esc(p.name) + '</span></div><div class="sw-row">' + p.colors.map(sw).join('') + '</div></div>';
        }).join('') : '');
    }
    if (id === 'layers') {
      h = '<div class="pn-h"><h2>Давхарга</h2><span class="ctx-lbl">чирж дараалал солино</span></div><div class="ly-list" id="ly-list"></div>';
    }
    el.innerHTML = h;
    if (id === 'layers') refreshLayers();
    if (id === 'text') DG.pairs.forEach(function (p) { ensureFont(p.heading); ensureFont(p.body); });
  }

  $('#ed-panel').addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.dataset.size) { var s = SIZES.filter(function (x) { return x.id === t.dataset.size; })[0]; setSize(s.w, s.h); }
    else if (t.id === 'sz-apply') setSize(+$('#sz-w').value || W, +$('#sz-h').value || H);
    else if (t.id === 'sz-new') newDesign();
    else if (t.dataset.text) addText(t.dataset.text);
    else if (t.dataset.pair) addPair(DG.pairs[+t.dataset.pair]);
    else if (t.id === 'up-btn') $('#ed-file').click();
    else if (t.dataset.recent) addImageUrl(recent[+t.dataset.recent]);
    else if (t.dataset.shape) addShape(t.dataset.shape);
    else if (t.dataset.color) applyColor(t.dataset.color);
    else if (t.dataset.tpl) useTemplate(t.dataset.tpl);
    else if (t.dataset.drawTool) { draw.tool = t.dataset.drawTool; startDraw(); renderPanel('draw'); }
    else if (t.dataset.drawColor) { draw.color = t.dataset.drawColor; applyBrush(); renderPanel('draw'); }
    else if (t.id === 'dr-done') openPanel(window.innerWidth > 820 ? 'layers' : null);
  });
  $('#ed-panel').addEventListener('input', function (e) {
    if (e.target.id === 'col-pick') applyColor(e.target.value, true);
    if (e.target.id === 'dr-pick') { draw.color = e.target.value; applyBrush(); }
    if (e.target.id === 'dr-size') { draw.size = +e.target.value; $('#dr-size-v').textContent = draw.size + 'px'; applyBrush(); }
  });
  $('#ed-panel').addEventListener('change', function (e) { if (e.target.id === 'col-pick') commit(); if (e.target.id === 'dr-pick') renderPanel('draw'); });

  function applyColor(c, live) {
    var o = active(), k = kindOf(o);
    if (!o || k === 'image') { setPageColor(c); return; }
    if (c === 'transparent') return;
    eachSel(function (x) {
      if (x.isType('line')) x.set('stroke', c);
      else if (!x.isType('image')) x.set('fill', c);
    });
    canvas.requestRenderAll();
    if (!live) commit();
    refreshCtx();
  }

  // ---------- layers panel ----------

  function layerIcon(o) {
    var k = kindOf(o);
    if (k === 'image') return '<span class="ly-ic" style="background-image:url(\'' + (o.getSrc ? o.getSrc() : '') + '\')"></span>';
    if (k === 'text') return '<span class="ly-ic">T</span>';
    var fill = typeof o.fill === 'string' ? o.fill : (o.stroke || '#888');
    return '<span class="ly-ic"><i style="width:14px;height:14px;border-radius:' + (o.isType('circle') ? '50%' : '3px') + ';background:' + esc(fill) + ';display:block"></i></span>';
  }
  function layerName(o) {
    if (kindOf(o) === 'text') return (o.text || '').replace(/\s+/g, ' ').slice(0, 40) || 'Текст';
    return o.name || NAMES[o.type] || 'Зүйл';
  }
  var dragIdx = null;
  function refreshLayers() {
    var list = $('#ly-list'); if (!list) return;
    var objs = userObjects().slice().reverse(), sel = [];
    eachSel(function (o) { sel.push(o); });
    if (!objs.length) { list.innerHTML = '<p class="ly-empty">Одоохондоо хоосон байна. Текст, зураг, хэлбэр нэмээрэй.</p>'; return; }
    list.innerHTML = objs.map(function (o, i) {
      return '<div class="ly' + (sel.indexOf(o) >= 0 ? ' on' : '') + (o.visible === false ? ' hidden-obj' : '') + '" draggable="true" data-ly="' + i + '">' +
        layerIcon(o) + '<span class="ly-name">' + esc(layerName(o)) + '</span>' +
        '<button type="button" class="ib" data-ly-vis="' + i + '" title="' + (o.visible === false ? 'Харуулах' : 'Нуух') + '">' + icon(o.visible === false ? 'eyeOff' : 'eye') + '</button>' +
        '<button type="button" class="ib' + (o.locked ? ' on' : '') + '" data-ly-lock="' + i + '" title="' + (o.locked ? 'Түгжээ тайлах' : 'Түгжих') + '">' + icon(o.locked ? 'lock' : 'unlock') + '</button>' +
      '</div>';
    }).join('');
  }
  $('#ed-panel').addEventListener('click', function (e) {
    var row = e.target.closest('[data-ly]'); if (!row) return;
    var objs = userObjects().slice().reverse();
    var vb = e.target.closest('[data-ly-vis]'), lb = e.target.closest('[data-ly-lock]');
    var o = objs[+row.getAttribute('data-ly')];
    if (vb) { o.visible = o.visible === false; if (!o.visible) canvas.discardActiveObject(); canvas.requestRenderAll(); commit(); refreshLayers(); return; }
    if (lb) { lockObj(o, !o.locked); canvas.requestRenderAll(); commit(); refreshLayers(); refreshCtx(); return; }
    if (o.visible === false) return;
    canvas.setActiveObject(o); canvas.requestRenderAll();
  });
  $('#ed-panel').addEventListener('dragstart', function (e) { var r = e.target.closest('[data-ly]'); if (!r) return; dragIdx = +r.getAttribute('data-ly'); r.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; });
  $('#ed-panel').addEventListener('dragover', function (e) { var r = e.target.closest('[data-ly]'); if (!r || dragIdx === null) return; e.preventDefault(); $$('.ly.over').forEach(function (x) { x.classList.remove('over'); }); r.classList.add('over'); });
  $('#ed-panel').addEventListener('dragend', function () { dragIdx = null; $$('.ly').forEach(function (x) { x.classList.remove('drag', 'over'); }); });
  $('#ed-panel').addEventListener('drop', function (e) {
    var r = e.target.closest('[data-ly]'); if (!r || dragIdx === null) return;
    e.preventDefault();
    var objs = userObjects().slice().reverse(), from = objs[dragIdx], toI = +r.getAttribute('data-ly');
    var n = canvas.getObjects().length;
    canvas.moveTo(from, n - 1 - toI); // list is top-first; canvas index 0 = page
    dragIdx = null; canvas.requestRenderAll(); commit(); refreshLayers();
  });

  // ---------- context toolbar ----------

  var ctx = $('#ed-ctx');
  function fontOptions(cur) {
    var names = Object.keys(FONTS).sort(function (a, b) { return (FONTS[b].cyr ? 1 : 0) - (FONTS[a].cyr ? 1 : 0) || a.localeCompare(b); });
    var hit = false;
    var opts = names.map(function (n) {
      var sel = fam(n) === primary(cur) && !hit; if (sel) hit = true;
      return '<option value="' + esc(n) + '"' + (sel ? ' selected' : '') + '>' + esc(n) + (FONTS[n].cyr ? '  · Кирилл' : '') + '</option>';
    }).join('');
    if (!hit) opts = '<option selected>' + esc(primary(cur)) + '</option>' + opts;
    return opts;
  }
  function hex(c) { return typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : '#816dfb'; }

  function refreshCtx() {
    var o = active(), k = kindOf(o);
    if (crop) {
      ctx.innerHTML = '<span class="ctx-lbl">' + icon('crop') + '</span><span class="ctx-lbl">Хүрээг чирж, булангаар нь тохируулна</span><span class="sep"></span>' +
        '<button type="button" class="tb ok" data-c="crop-ok">' + icon('check') + 'Тайрах</button><button type="button" class="tb" data-c="crop-cancel">Болих</button>';
      ctx.hidden = false; return;
    }
    if (draw.on) {
      ctx.innerHTML = '<span class="ctx-lbl">' + icon(draw.tool === 'eraser' ? 'eraser' : 'pen') + '</span><span class="ctx-lbl">' + (draw.tool === 'eraser' ? 'Зураас дээгүүр чирж арилгана' : 'Хуудас дээр чирж зурна') + '</span><span class="sep"></span>' +
        '<button type="button" class="tb ok" data-c="draw-done">' + icon('check') + 'Дуусгах</button>';
      ctx.hidden = false; return;
    }
    if (!o) { ctx.hidden = true; ctx.innerHTML = ''; return; }
    var h = '';
    if (k === 'text') {
      h += '<select class="fld font-sel" data-c="font" title="Фонт">' + fontOptions(o.fontFamily) + '</select>' +
        '<button type="button" class="ib" data-c="size-" title="Жижигрүүлэх">' + icon('minus') + '</button>' +
        '<input class="fld num" data-c="size" type="number" min="4" max="1000" value="' + Math.round(o.fontSize * (o.scaleY || 1)) + '" title="Үсгийн хэмжээ">' +
        '<button type="button" class="ib" data-c="size+" title="Томруулах">' + icon('plus') + '</button>' +
        '<span class="sep"></span>' +
        '<label class="ctx-sw text" title="Текстийн өнгө"><i style="background:' + hex(o.fill) + '"></i><input type="color" data-c="fill" value="' + hex(o.fill) + '"></label>' +
        '<button type="button" class="ib' + (o.fontWeight >= 600 || o.fontWeight === 'bold' ? ' on' : '') + '" data-c="bold" title="Тод (Ctrl+B)">' + icon('bold') + '</button>' +
        '<button type="button" class="ib' + (o.fontStyle === 'italic' ? ' on' : '') + '" data-c="italic" title="Налуу (Ctrl+I)">' + icon('italic') + '</button>' +
        '<button type="button" class="ib' + (o.underline ? ' on' : '') + '" data-c="underline" title="Доогуур зураас (Ctrl+U)">' + icon('underline') + '</button>' +
        '<button type="button" class="ib" data-c="talign" title="Зэрэгцүүлэлт">' + icon(o.textAlign === 'left' ? 'alignL' : o.textAlign === 'right' ? 'alignR' : 'alignC') + '</button>' +
        '<button type="button" class="ib" data-c="caps" title="ТОМ / жижиг үсэг">' + icon('caps') + '</button>' +
        '<div class="pop-wrap"><button type="button" class="ib" data-pop="spacing" title="Зай">' + icon('spacing') + '</button></div>' +
        '<div class="pop-wrap"><button type="button" class="tb" data-pop="effects" title="Сүүдэр, хүрээ, дэвсгэр">' + icon('fx') + 'Эффект</button></div>';
    } else if (k === 'image') {
      h += '<div class="pop-wrap"><button type="button" class="tb" data-pop="adjust" title="Шүүлтүүр, гэрэл, өнгө">' + icon('adjust') + 'Засах</button></div>' +
        '<button type="button" class="tb" data-c="crop" title="Тайрах">' + icon('crop') + 'Тайрах</button>' +
        '<div class="pop-wrap"><button type="button" class="tb" data-pop="mask" title="Тойрог, бөөрөнхий хэлбэрт оруулах">' + icon('mask') + 'Хэлбэр</button></div>' +
        '<button type="button" class="ib" data-c="rotate" title="90° эргүүлэх">' + icon('rotate') + '</button>' +
        '<button type="button" class="ib" data-c="flipX" title="Хэвтээ толин тусгал">' + icon('flipH') + '</button>' +
        '<button type="button" class="ib" data-c="flipY" title="Босоо толин тусгал">' + icon('flipV') + '</button>' +
        '<span class="sep"></span>' +
        '<button type="button" class="tb" data-c="rmbg" title="AI-аар арын дэвсгэрийг арилгах">' + icon('wand') + 'Дэвсгэр арилгах</button>' +
        '<button type="button" class="tb" data-c="asbg" title="Хуудсыг бүтэн дүүргэх">' + icon('bg') + 'Дэвсгэр болгох</button>' +
        '<div class="pop-wrap"><button type="button" class="tb" data-pop="effects" title="Сүүдэр">' + icon('fx') + 'Эффект</button></div>' +
        '<button type="button" class="tb" data-c="tool-up" title="Design tools дээр AI-аар 2–4 дахин томруулах">✦ Томруулах</button>';
    } else if (k === 'group') {
      h += '<span class="ctx-lbl">Бүлэг · ' + o.getObjects().length + ' зүйл</span>' +
        '<button type="button" class="tb" data-c="ungroup" title="Задлах (Ctrl+Shift+G)">' + icon('group') + 'Задлах</button>' +
        '<div class="pop-wrap"><button type="button" class="tb" data-pop="effects">' + icon('fx') + 'Эффект</button></div>';
    } else if (k === 'shape' || k === 'line') {
      var col = k === 'line' ? o.stroke : o.fill;
      h += '<label class="ctx-sw" title="Өнгө"><i style="background:' + hex(col) + '"></i><input type="color" data-c="' + (k === 'line' ? 'stroke' : 'fill') + '" value="' + hex(col) + '"></label>';
      if (k === 'shape') h += '<span class="ctx-lbl">Хүрээ</span><label class="ctx-sw" title="Хүрээний өнгө"><i style="background:' + hex(o.stroke || '#ffffff') + ';box-shadow:inset 0 0 0 5px var(--panel)"></i><input type="color" data-c="stroke" value="' + hex(o.stroke || '#ffffff') + '"></label>' +
        '<input class="fld num" data-c="strokeWidth" type="number" min="0" max="200" value="' + Math.round(o.strokeWidth && o.stroke ? o.strokeWidth : 0) + '" title="Хүрээний зузаан">';
      else h += '<input class="fld num" data-c="strokeWidth" type="number" min="1" max="200" value="' + Math.round(o.strokeWidth) + '" title="Зузаан">';
      if (o.isType('rect')) h += '<span class="ctx-lbl">Булан</span><input class="fld num" data-c="radius" type="number" min="0" max="2000" value="' + Math.round(o.rx || 0) + '" title="Булангийн радиус">';
      h += '<div class="pop-wrap"><button type="button" class="tb" data-pop="effects" title="Сүүдэр">' + icon('fx') + 'Эффект</button></div>';
    } else if (k === 'multi') {
      h += '<span class="ctx-lbl">' + o.getObjects().length + ' зүйл сонгосон</span>' +
        '<button type="button" class="tb" data-c="group" title="Бүлэглэх (Ctrl+G)">' + icon('group') + 'Бүлэглэх</button>';
    }
    h += '<span class="sep"></span>' +
      '<div class="pop-wrap"><button type="button" class="ib" data-pop="opacity" title="Тунгалаг байдал">' + icon('opacity') + '</button></div>' +
      '<div class="pop-wrap"><button type="button" class="ib" data-pop="align" title="Байрлал, зэрэгцүүлэлт">' + icon('align') + '</button></div>' +
      '<button type="button" class="ib" data-c="up" title="Урагш (Ctrl+])">' + icon('up') + '</button>' +
      '<button type="button" class="ib" data-c="down" title="Хойш (Ctrl+[)">' + icon('down') + '</button>' +
      '<button type="button" class="ib' + (o.locked ? ' on' : '') + '" data-c="lock" title="Түгжих">' + icon(o.locked ? 'lock' : 'unlock') + '</button>' +
      '<button type="button" class="ib" data-c="dup" title="Хувилах (Ctrl+D)">' + icon('copy') + '</button>' +
      '<button type="button" class="ib" data-c="del" title="Устгах (Delete)">' + icon('trash') + '</button>';
    var wasHidden = ctx.hidden;
    ctx.innerHTML = h; ctx.hidden = false;
    if (wasHidden && canvas.getZoom() && !restoring) { /* keep view */ }
    if (k === 'text') ensureFont(primary(o.fontFamily));
    if (activePanel === 'color') renderPanel('color');
  }

  ctx.addEventListener('click', function (e) {
    var b = e.target.closest('[data-c],[data-pop]'); if (!b) return;
    var c = b.dataset.c;
    if (c === 'crop-ok') { endCrop(true); return; }
    if (c === 'crop-cancel') { endCrop(false); return; }
    if (c === 'draw-done') { openPanel(window.innerWidth > 820 ? 'layers' : null); return; }
    var o = active(); if (!o) return;
    if (b.dataset.pop) { openCtxPop(b, b.dataset.pop); return; }
    if (c === 'crop') { startCrop(); return; }
    if (c === 'rmbg') { b.disabled = true; removeBackground(o).then(function () { refreshCtx(); }); return; }
    if (c === 'rotate') { o.rotate(((o.angle || 0) + 90) % 360); o.setCoords(); canvas.requestRenderAll(); commit(); }
    if (c === 'group') { groupSel(); return; }
    if (c === 'ungroup') { ungroupSel(); return; }
    if (c === 'size+' || c === 'size-') {
      var cur = Math.round(o.fontSize * (o.scaleY || 1)), step = cur < 30 ? 2 : cur < 100 ? 4 : 10;
      setFontSize(cur + (c === 'size+' ? step : -step));
    }
    if (c === 'bold') setProp('fontWeight', o.fontWeight >= 600 || o.fontWeight === 'bold' ? 400 : 700);
    if (c === 'italic') setProp('fontStyle', o.fontStyle === 'italic' ? 'normal' : 'italic');
    if (c === 'underline') setProp('underline', !o.underline);
    if (c === 'talign') setProp('textAlign', { left: 'center', center: 'right', right: 'left', justify: 'left' }[o.textAlign] || 'center');
    if (c === 'caps') eachSel(function (x) { if (x.text) { x.set('text', x.text === x.text.toUpperCase() ? x.text.toLowerCase() : x.text.toUpperCase()); x.initDimensions(); } }), canvas.requestRenderAll(), commit();
    if (c === 'flipX') setProp('flipX', !o.flipX);
    if (c === 'flipY') setProp('flipY', !o.flipY);
    if (c === 'asbg') setAsBackground();
    if (c === 'tool-bg') sendObject(o, 'bgremove');
    if (c === 'tool-up') sendObject(o, 'upscale');
    if (c === 'up') arrange('up');
    if (c === 'down') arrange('down');
    if (c === 'lock') { eachSel(function (x) { lockObj(x, !o.locked); }); canvas.requestRenderAll(); commit(); refreshLayers(); }
    if (c === 'dup') duplicate();
    if (c === 'del') removeSel();
    refreshCtx();
  });
  ctx.addEventListener('input', function (e) {
    var c = e.target.dataset.c, v = e.target.value; if (!c) return;
    if (c === 'fill' || c === 'stroke') {
      eachSel(function (x) { x.set(c, v); if (c === 'stroke' && x.isType && !x.isType('line') && !x.strokeWidth) x.set('strokeWidth', Math.max(2, W * 0.004)); });
      var sw = e.target.previousElementSibling; if (sw) sw.style.background = v;
      canvas.requestRenderAll();
    }
  });
  ctx.addEventListener('change', function (e) {
    var c = e.target.dataset.c, v = e.target.value; if (!c) return;
    var o = active(); if (!o) return;
    if (c === 'font') {
      var family = fam(v);
      ensureFont(v).then(function () { eachSel(function (x) { if (x.isType('textbox')) { x.set('fontFamily', stack(v)); refreshText(x); } }); commit(); });
    }
    if (c === 'size') setFontSize(+v);
    if (c === 'fill' || c === 'stroke') commit();
    if (c === 'strokeWidth') { eachSel(function (x) { x.set('strokeWidth', Math.max(0, +v)); if (!x.stroke && +v > 0) x.set('stroke', '#ffffff'); }); canvas.requestRenderAll(); commit(); }
    if (c === 'radius') { eachSel(function (x) { if (x.isType('rect')) x.set({ rx: +v, ry: +v }); }); canvas.requestRenderAll(); commit(); }
  });
  function setFontSize(px) {
    px = clamp(Math.round(px), 4, 1000);
    eachSel(function (x) { if (x.isType('textbox')) { x.set({ fontSize: px / (x.scaleY || 1) }); x.initDimensions(); x.setCoords(); } });
    canvas.requestRenderAll(); commit();
  }

  // small popovers anchored to the toolbar buttons
  var openPop = null;
  function closePop() { if (openPop) { openPop.remove(); openPop = null; } }
  function openCtxPop(btn, kind) {
    var again = openPop && openPop.dataset.kind === kind; closePop(); if (again) return;
    var o = active(), h = '';
    if (kind === 'opacity') h = row('Тунгалаг байдал', 'opacity', 0, 100, Math.round((o.opacity == null ? 1 : o.opacity) * 100), '%');
    if (kind === 'spacing') h = row('Үсэг хоорондын зай', 'charSpacing', -200, 800, Math.round(o.charSpacing || 0), '') + row('Мөр хоорондын зай', 'lineHeight', 70, 300, Math.round((o.lineHeight || 1.16) * 100), '%');
    if (kind === 'adjust') {
      var gv = function (T, key, d) { var f = getFilter(o, T); return f ? f[key] : d; };
      var cur = presetOf(o);
      h = '<p class="pop-t">Шүүлтүүр</p><div class="pre-grid">' + PRESETS.map(function (p) {
          return '<button type="button" class="pre' + (p[0] === cur ? ' on' : '') + '" data-preset="' + p[0] + '"><i class="pre-' + p[0] + '" style="background-image:url(\'' + (o.getSrc ? o.getSrc() : '') + '\')"></i><span>' + p[1] + '</span></button>';
        }).join('') + '</div>' +
        '<p class="pop-t">Тохируулга</p>' +
        row('Гэрэлтэлт', 'brightness', -100, 100, Math.round(gv(F.Brightness, 'brightness', 0) * 100), '') +
        row('Контраст', 'contrast', -100, 100, Math.round(gv(F.Contrast, 'contrast', 0) * 100), '') +
        row('Ханалт', 'saturation', -100, 100, Math.round(gv(F.Saturation, 'saturation', 0) * 100), '') +
        row('Өнгөний тон', 'hue', -100, 100, Math.round(gv(F.HueRotation, 'rotation', 0) * 100), '') +
        row('Бүдгэрүүлэх', 'blur', 0, 100, Math.round(gv(F.Blur, 'blur', 0) * 100), '') +
        '<button type="button" data-reset-filters>Анхны байдалд нь буцаах</button>';
    }
    if (kind === 'mask') {
      var mk = o.clipPath && o.clipPath.gMask || 'none';
      h = '<p class="pop-t">Зургийг хэлбэрт оруулах</p>' +
        [['none', 'Анхны (тэгш өнцөгт)'], ['rounded', 'Бөөрөнхий булантай'], ['circle', 'Тойрог'], ['oval', 'Зууван'], ['arch', 'Нуман хаалга']].map(function (m) {
          return '<button type="button" data-mask="' + m[0] + '"' + (m[0] === mk ? ' class="on"' : '') + '>' + m[1] + (m[0] === mk ? ' <i>✓</i>' : '') + '</button>';
        }).join('');
    }
    if (kind === 'effects') {
      var sh = shadowOf(o), sp = rgbaParts(sh && sh.color), isText = kindOf(o) === 'text';
      h = '<p class="pop-t">Сүүдэр</p>' +
        '<label class="chk"><input type="checkbox" data-fx="shadow"' + (sh ? ' checked' : '') + '> Сүүдэр нэмэх</label>' +
        '<div class="fx-sub"' + (sh ? '' : ' hidden') + '>' +
          row('Бүдэг', 'sBlur', 0, 200, Math.round(sh ? sh.blur : W * 0.02), '') +
          row('Зай', 'sOff', -100, 100, Math.round(sh ? sh.offsetX : W * 0.008), '') +
          row('Тод байдал', 'sAlpha', 0, 100, Math.round(sp.a * 100), '%') +
          '<div class="row"><label>Өнгө</label><input type="color" data-fx="sColor" value="' + sp.hex + '"></div>' +
        '</div>' +
        (isText ? '<p class="pop-t">Хүрээ (outline)</p>' +
          row('Зузаан', 'oWidth', 0, 40, Math.round(o.stroke ? o.strokeWidth : 0), '') +
          '<div class="row"><label>Өнгө</label><input type="color" data-fx="oColor" value="' + hex(o.stroke || '#000000') + '"></div>' +
          '<p class="pop-t">Текстийн дэвсгэр</p>' +
          '<label class="chk"><input type="checkbox" data-fx="tbg"' + (o.textBackgroundColor ? ' checked' : '') + '> Дэвсгэр өнгө</label>' +
          '<div class="row"' + (o.textBackgroundColor ? '' : ' hidden') + ' data-tbg-row><label>Өнгө</label><input type="color" data-fx="tbgColor" value="' + hex(o.textBackgroundColor || '#816dfb') + '"></div>' : '');
    }
    if (kind === 'align') {
      h = '<p class="pop-t">Хуудсанд зэрэгцүүлэх</p>' +
        [['left', 'Зүүн'], ['hcenter', 'Хэвтээ голлуулах'], ['right', 'Баруун'], ['top', 'Дээд'], ['vcenter', 'Босоо голлуулах'], ['bottom', 'Доод']].map(function (a) { return '<button type="button" data-align="' + a[0] + '">' + a[1] + '</button>'; }).join('') +
        '<p class="pop-t">Давхарга</p><button type="button" data-arr="top">Хамгийн урд</button><button type="button" data-arr="bottom">Хамгийн ард</button>';
    }
    var p = document.createElement('div'); p.className = 'pop'; p.dataset.kind = kind; p.innerHTML = h;
    btn.parentNode.appendChild(p); openPop = p;
    // keep it on screen
    var r = p.getBoundingClientRect(); if (r.right > window.innerWidth - 8) { p.style.left = 'auto'; p.style.right = '0'; }
    p.style.position = 'fixed'; var br = btn.getBoundingClientRect();
    p.style.top = (br.bottom + 6) + 'px'; p.style.left = Math.max(8, Math.min(br.left, window.innerWidth - p.offsetWidth - 8)) + 'px'; p.style.right = 'auto';
    p.addEventListener('input', function (e) {
      var k = e.target.dataset.k, v = +e.target.value; if (!k) return;
      e.target.previousElementSibling.querySelector('b').textContent = v + (e.target.dataset.u || '');
      if (k === 'opacity') eachSel(function (x) { x.set('opacity', v / 100); });
      if (k === 'charSpacing') eachSel(function (x) { if (x.isType('textbox')) { x.set('charSpacing', v); x.initDimensions(); } });
      if (k === 'lineHeight') eachSel(function (x) { if (x.isType('textbox')) { x.set('lineHeight', v / 100); x.initDimensions(); } });
      if (k === 'brightness') setFilter(o, F.Brightness, 'brightness', v / 100, 0);
      if (k === 'contrast') setFilter(o, F.Contrast, 'contrast', v / 100, 0);
      if (k === 'saturation') setFilter(o, F.Saturation, 'saturation', v / 100, 0);
      if (k === 'blur') setFilter(o, F.Blur, 'blur', v / 100, 0);
      if (k === 'hue') setFilter(o, F.HueRotation, 'rotation', v / 100, 0);
      if (k === 'sBlur' || k === 'sOff' || k === 'sAlpha') {
        var s = shadowOf(o), parts = rgbaParts(s && s.color);
        eachSel(function (x) {
          setShadow(x, true, {
            blur: k === 'sBlur' ? v : null, offset: k === 'sOff' ? v : null,
            color: k === 'sAlpha' ? rgba(parts.hex, v / 100) : null
          });
        });
      }
      if (k === 'oWidth') eachSel(function (x) { x.set({ strokeWidth: v, stroke: v ? (x.stroke || '#000000') : null, paintFirst: 'stroke', strokeUniform: true }); if (x.initDimensions) x.initDimensions(); });
      canvas.requestRenderAll();
    });
    p.addEventListener('input', function (e) {
      var f = e.target.dataset.fx; if (!f || e.target.type !== 'color') return;
      var v = e.target.value;
      if (f === 'sColor') { var a = rgbaParts((shadowOf(o) || {}).color).a; eachSel(function (x) { setShadow(x, true, { color: rgba(v, a) }); }); }
      if (f === 'oColor') eachSel(function (x) { x.set({ stroke: v, paintFirst: 'stroke' }); if (!x.strokeWidth) x.set('strokeWidth', 4); });
      if (f === 'tbgColor') eachSel(function (x) { x.set('textBackgroundColor', v); });
      canvas.requestRenderAll();
    });
    p.addEventListener('change', function (e) {
      var f = e.target.dataset.fx;
      if (f === 'shadow') {
        var on = e.target.checked;
        eachSel(function (x) { setShadow(x, on, {}); });
        p.querySelector('.fx-sub').hidden = !on;
        canvas.requestRenderAll();
      }
      if (f === 'tbg') {
        var tb = e.target.checked;
        eachSel(function (x) { x.set('textBackgroundColor', tb ? (p.querySelector('[data-fx="tbgColor"]').value) : ''); });
        p.querySelector('[data-tbg-row]').hidden = !tb;
        canvas.requestRenderAll();
      }
      commit();
    });
    p.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.align) alignToPage(b.dataset.align);
      if (b.dataset.arr) arrange(b.dataset.arr);
      if (b.dataset.preset) { setPreset(o, b.dataset.preset); p.querySelectorAll('.pre').forEach(function (x) { x.classList.toggle('on', x === b); }); }
      if (b.dataset.mask) { setMask(b.dataset.mask); closePop(); }
      if (b.hasAttribute('data-reset-filters')) { o.filters = []; o.applyFilters(); canvas.requestRenderAll(); commit(); closePop(); }
    });
    function row(label, k, min, max, val, unit) {
      return '<div class="row"><label>' + label + ' <b>' + val + unit + '</b></label><input type="range" data-k="' + k + '" data-u="' + unit + '" min="' + min + '" max="' + max + '" value="' + val + '"></div>';
    }
  }
  document.addEventListener('mousedown', function (e) {
    if (openPop && !openPop.contains(e.target) && !e.target.closest('[data-pop]')) closePop();
    if (!e.target.closest('.pop-wrap') && !e.target.closest('.help-pop')) $$('.ed-top .pop:not(.help-pop)').forEach(function (p) { p.hidden = true; });
  });
  canvas.on('selection:cleared', closePop);

  // ---------- top bar ----------

  $('#ed-undo').innerHTML = icon('undo'); $('#ed-redo').innerHTML = icon('redo');
  $('#ed-zin').innerHTML = icon('plus'); $('#ed-zout').innerHTML = icon('minus');
  $('#ed-undo').addEventListener('click', undo);
  $('#ed-redo').addEventListener('click', redo);
  $('#ed-zin').addEventListener('click', function () { zoomBy(1.2); });
  $('#ed-zout').addEventListener('click', function () { zoomBy(1 / 1.2); });
  $('#ed-zoom').addEventListener('click', fit);

  function toggleMenu(btn, menu) {
    btn.addEventListener('click', function () {
      var open = menu.hidden; $$('.ed-top .pop').forEach(function (p) { p.hidden = true; }); menu.hidden = !open;
    });
  }
  toggleMenu($('#ed-dl'), $('#ed-dl-menu'));
  toggleMenu($('#ed-send'), $('#ed-send-menu'));

  // ---------- export ----------

  function renderPage(mult, opaque) {
    canvas.discardActiveObject();
    var vpt = canvas.viewportTransform.slice(), bg = canvas.backgroundColor, fill = page.fill;
    exporting = true;
    canvas.backgroundColor = null;
    if (pageTransparent) page.set('fill', opaque ? '#ffffff' : 'rgba(0,0,0,0)');
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    var out = canvas.toCanvasElement(mult || 1, { left: 0, top: 0, width: W, height: H });
    canvas.setViewportTransform(vpt);
    canvas.backgroundColor = bg; page.set('fill', fill);
    exporting = false;
    canvas.requestRenderAll();
    return out;
  }
  function fileBase() { return ($('#ed-name').value || 'graphican-design').trim().replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60) || 'graphican-design'; }
  function toBlob(c, type, q) { return new Promise(function (r) { c.toBlob(r, type, q); }); }

  $('#ed-dl-menu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-dl]'); if (!b) return;
    $('#ed-dl-menu').hidden = true;
    var k = b.dataset.dl, name = fileBase();
    if (k === 'png' || k === 'png2') toBlob(renderPage(k === 'png2' ? 2 : 1), 'image/png').then(function (bl) { saveBlob(name + '.png', bl); toast('PNG татагдлаа'); });
    if (k === 'jpg') toBlob(renderPage(1, true), 'image/jpeg', 0.92).then(function (bl) { saveBlob(name + '.jpg', bl); toast('JPG татагдлаа'); });
    if (k === 'pdf') {
      toast('PDF бэлтгэж байна…');
      var c = renderPage(2, true);
      Promise.all([window.PDFLib ? Promise.resolve() : loadScript('/assets/vendor/pdf-lib.min.js'), toBlob(c, 'image/jpeg', 0.95)])
        .then(function (r) { return r[1].arrayBuffer(); })
        .then(function (buf) {
          var L = window.PDFLib;
          return L.PDFDocument.create().then(function (doc) {
            return doc.embedJpg(buf).then(function (img) {
              var pw = W * 0.75, ph = H * 0.75; // px → pt at 96 dpi
              doc.addPage([pw, ph]).drawImage(img, { x: 0, y: 0, width: pw, height: ph });
              return doc.save();
            });
          });
        })
        .then(function (bytes) { saveBlob(name + '.pdf', new Blob([bytes], { type: 'application/pdf' })); toast('PDF татагдлаа'); })
        .catch(function (err) { console.error(err); toast('PDF үүсгэж чадсангүй'); });
    }
  });

  // send the whole design (or one image) to a Design tools page; the design is saved first
  function handoff(blob, target) {
    if (!window.GHandoff) { toast('Илгээж чадсангүй'); return; }
    pushHistory();
    dbSet('doc', snapshot()).then(function () {
      return window.GHandoff.put(blob, { name: fileBase() + '.png', target: target });
    }).then(function () {
      location.href = '/tools/' + target + '/';
    }).catch(function () { toast('Илгээж чадсангүй'); });
  }
  $('#ed-send-menu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-send]'); if (!b) return;
    $('#ed-send-menu').hidden = true;
    toBlob(renderPage(1), 'image/png').then(function (bl) { handoff(bl, b.dataset.send); });
  });
  function sendObject(o, target) {
    var el = o.getElement(), c = document.createElement('canvas');
    c.width = el.naturalWidth || el.width; c.height = el.naturalHeight || el.height;
    c.getContext('2d').drawImage(el, 0, 0);
    toBlob(c, 'image/png').then(function (bl) { handoff(bl, target); });
  }

  // ---------- files: picker, drag & drop, paste ----------

  $('#ed-file').addEventListener('change', function () {
    Array.prototype.forEach.call(this.files, function (f) { addImageBlob(f); });
    this.value = '';
  });
  var dragDepth = 0;
  stage.addEventListener('dragenter', function (e) { if (hasFiles(e)) { e.preventDefault(); dragDepth++; $('#ed-dropzone').hidden = false; } });
  stage.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
  stage.addEventListener('dragleave', function () { if (--dragDepth <= 0) { dragDepth = 0; $('#ed-dropzone').hidden = true; } });
  stage.addEventListener('drop', function (e) {
    e.preventDefault(); dragDepth = 0; $('#ed-dropzone').hidden = true;
    Array.prototype.forEach.call(e.dataTransfer.files, function (f) { if (/^image\//.test(f.type)) addImageBlob(f); });
  });
  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0; }
  window.addEventListener('paste', function (e) {
    if (isTyping(e)) return;
    var items = (e.clipboardData || {}).items || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') === 0) { e.preventDefault(); addImageBlob(items[i].getAsFile()); return; }
    }
    if (clip) pasteClip();
  });

  // ---------- keyboard ----------

  var clip = null;
  function pasteClip() {
    clip.clone(function (c) {
      canvas.discardActiveObject();
      c.set({ left: c.left + 24, top: c.top + 24, evented: true });
      if (c.type === 'activeSelection') { c.canvas = canvas; c.forEachObject(function (x) { canvas.add(x); }); c.setCoords(); }
      else canvas.add(c);
      clip.left += 24; clip.top += 24;
      canvas.setActiveObject(c); canvas.requestRenderAll(); commit();
    }, PROPS);
  }
  function isTyping(e) {
    var t = e.target, o = active();
    return (o && o.isEditing) || (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable));
  }
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && !isTyping(e)) { if (!spaceDown) { spaceDown = true; canvas.defaultCursor = 'grab'; canvas.setCursor('grab'); } e.preventDefault(); return; }
    if (isTyping(e)) { if (e.key === 'Escape') { var t = active(); if (t && t.isEditing) { t.exitEditing(); canvas.requestRenderAll(); } } return; }
    var mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase(), o = active();
    if (crop) {
      if (e.key === 'Enter') { e.preventDefault(); endCrop(true); }
      if (e.key === 'Escape') { e.preventDefault(); endCrop(false); }
      return;
    }
    if (draw.on && e.key === 'Escape') { e.preventDefault(); openPanel(window.innerWidth > 820 ? 'layers' : null); return; }
    if (mod && k === 'g') { e.preventDefault(); if (e.shiftKey) ungroupSel(); else groupSel(); return; }
    if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); redo(); return; }
    if (mod && k === 'd') { e.preventDefault(); duplicate(); return; }
    if (mod && k === 'c' && o) { o.clone(function (c) { clip = c; }, PROPS); return; }
    if (mod && k === 'a') { e.preventDefault(); var all = userObjects().filter(function (x) { return x.visible !== false && !x.locked; }); if (all.length) { canvas.setActiveObject(new fabric.ActiveSelection(all, { canvas: canvas })); canvas.requestRenderAll(); } return; }
    if (mod && (k === '0')) { e.preventDefault(); fit(); return; }
    if (mod && (k === '=' || k === '+')) { e.preventDefault(); zoomBy(1.2); return; }
    if (mod && k === '-') { e.preventDefault(); zoomBy(1 / 1.2); return; }
    if (mod && k === ']') { e.preventDefault(); arrange(e.shiftKey ? 'top' : 'up'); return; }
    if (mod && k === '[') { e.preventDefault(); arrange(e.shiftKey ? 'bottom' : 'down'); return; }
    if (mod && o && kindOf(o) === 'text' && (k === 'b' || k === 'i' || k === 'u')) {
      e.preventDefault();
      if (k === 'b') setProp('fontWeight', o.fontWeight >= 600 ? 400 : 700);
      if (k === 'i') setProp('fontStyle', o.fontStyle === 'italic' ? 'normal' : 'italic');
      if (k === 'u') setProp('underline', !o.underline);
      refreshCtx(); return;
    }
    if (!o) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSel(); return; }
    if (e.key === 'Escape') { canvas.discardActiveObject(); canvas.requestRenderAll(); return; }
    if (e.key === 'Enter' && kindOf(o) === 'text') { e.preventDefault(); o.enterEditing(); o.selectAll(); canvas.requestRenderAll(); return; }
    var step = e.shiftKey ? 10 : 1, mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (mv && !o.locked) { e.preventDefault(); o.set({ left: o.left + mv[0], top: o.top + mv[1] }); o.setCoords(); canvas.requestRenderAll(); commit(); }
  });
  window.addEventListener('keyup', function (e) { if (e.code === 'Space') { spaceDown = false; canvas.defaultCursor = 'default'; canvas.setCursor('default'); } });

  function refreshAll() { refreshLayers(); refreshCtx(); updateHint(); histButtons(); if (activePanel) renderPanel(activePanel); }

  // ---------- boot ----------

  window.GEditor = { canvas: canvas, renderPage: renderPage }; // for debugging from the console
  window.addEventListener('resize', function () { resizeCanvas(); fit(); canvas.requestRenderAll(); });
  resizeCanvas();
  canvas.add(makePage());
  fit();
  openPanel(window.innerWidth > 820 ? 'text' : null);

  loadDesignGuide().then(function () {
    // warm up the chosen pair so the first text looks right
    var p = currentPair(); ensureFont('Manrope'); ensureFont(p.heading); ensureFont(p.body);
    if (activePanel) renderPanel(activePanel);
    return dbGet('doc');
  }).then(function (saved) {
    if (saved) return restore(saved).then(function () { hist = [saved]; hi = 0; histButtons(); });
    hist = [snapshot()]; hi = 0; histButtons();
  }).then(function () {
    return window.GHandoff ? window.GHandoff.take() : null;
  }).then(function (h) {
    if (h && h.blob) {
      addImageBlob(h.blob, { fillPage: !userObjects().length }).then(function () { toast('Зураг засварлагчид орлоо'); });
    } else if (prefs.pair && prefs.fresh) {
      toast('Design guide-ээс: ' + prefs.pair.heading + ' + ' + prefs.pair.body);
    }
    if (prefs.fresh) { prefs.fresh = false; try { localStorage.setItem('gc-editor-prefs', JSON.stringify(prefs)); } catch (e) {} }
    updateHint();
  });
})();
