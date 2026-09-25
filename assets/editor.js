/*
  Graphican Editor — Figma-style design editor on Fabric.js (MIT).
  • Infinite canvas with several frames (artboards). Frames sit at the bottom of the
    stack; an object belongs to the frame its centre is in (moves with it, exports with it).
  • Left: layers / add / templates · Right: properties of the selection · Bottom: tool dock.
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
  function r1(v) { return Math.round(v * 10) / 10; }

  var toastT;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2600);
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
  function toBlob(c, type, q) { return new Promise(function (r) { c.toBlob(r, type, q); }); }

  // line icons (24×24)
  var P = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    move: '<path d="m5 3 14 7-6 2-2 6L5 3Z"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5v-7a1.5 1.5 0 0 1 3 0V12M14 6.5a1.5 1.5 0 0 1 3 0V13M8 12.5 6.3 10.8a1.6 1.6 0 0 0-2.3 2.3L8.5 18A6 6 0 0 0 13 20h1a5 5 0 0 0 5-5v-4.5a1.5 1.5 0 0 0-3 0"/>',
    frame: '<path d="M8 3v18M16 3v18M3 8h18M3 16h18"/>',
    rect: '<rect x="4" y="4" width="16" height="16" rx="1"/>',
    rounded: '<rect x="4" y="4" width="16" height="16" rx="5"/>',
    ellipse: '<circle cx="12" cy="12" r="8.5"/>',
    triangle: '<path d="M12 4 21 20H3Z"/>',
    line: '<path d="M4 20 20 4"/>',
    star: '<path d="m12 3 2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.8 6.4 20l1.4-6.3L3 9.4l6.4-.6Z"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    pen: '<path d="M4 20l4-1L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/><path d="m14 7 3 3"/>',
    marker: '<path d="m9 15-4 4h5l2-2M9 15l7-7 3 3-7 7M9 15l3 3"/>',
    spray: '<rect x="7" y="9" width="8" height="12" rx="2"/><path d="M9 9V6h4v3M16 4h.01M19 3h.01M19 6h.01M17 7h.01"/>',
    eraser: '<path d="m7 21-4-4 11-11 7 7-8 8H7Z"/><path d="M21 21H11M9 11l7 7"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5L6 20"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    aL: '<path d="M4 3v18M8 7h10v4H8zM8 14h6v4H8z"/>', aC: '<path d="M12 3v18M6 7h12v4H6zM8 14h8v4H8z"/>', aR: '<path d="M20 3v18M6 7h10v4H6zM10 14h6v4h-6z"/>',
    aT: '<path d="M3 4h18M7 8v10h4V8zM14 8v6h4V8z"/>', aM: '<path d="M3 12h18M7 6v12h4V6zM14 8v8h4V8z"/>', aB: '<path d="M3 20h18M7 6v10h4V6zM14 10v6h4v-6z"/>',
    dH: '<path d="M4 4v16M20 4v16M9 8h6v8H9z"/>', dV: '<path d="M4 4h16M4 20h16M8 9h8v6H8z"/>',
    tL: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>', tC: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>', tR: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>', tJ: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
    bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>', italic: '<path d="M11 5h6M7 19h6M14 5l-4 14"/>',
    underline: '<path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14"/>', strike: '<path d="M4 12h16M16 6.5A4 3.5 0 0 0 12 5c-2.5 0-4 1.3-4 3 0 3.5 8 2.5 8 7 0 1.8-1.8 3-4 3a4.5 4 0 0 1-4.5-2"/>',
    flipH: '<path d="M12 3v18M4 7v10l5-5-5-5ZM20 7v10l-5-5 5-5Z"/>', flipV: '<path d="M3 12h18M7 4h10l-5 5-5-5ZM7 20h10l-5-5-5 5Z"/>',
    rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>', angle: '<path d="M4 20h16M4 20 16 6"/><path d="M9 20a6 6 0 0 0-1.5-4"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
    wand: '<path d="m4 20 11-11M15 4v2M15 12v2M11 8H9M21 8h-2M18.5 4.5 17 6M18.5 11.5 17 10"/>',
    bg: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 17 6-6 5 5 3-3 4 4"/>',
    up2: '<path d="m7 11 5-5 5 5M7 17l5-5 5 5"/>', up1: '<path d="m7 14 5-5 5 5"/>', dn1: '<path d="m7 10 5 5 5-5"/>', dn2: '<path d="m7 7 5 5 5-5M7 13l5 5 5-5"/>',
    group: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M11 7h4a2 2 0 0 1 2 2v4"/>',
    ratio: '<path d="M9 7H7a5 5 0 0 0 0 10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8"/>',
    radius: '<path d="M4 20V11a7 7 0 0 1 7-7h9"/>', opacity: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
    check: '<path d="m5 12 5 5L20 7"/>', frameI: '<path d="M8 3v18M16 3v18M3 8h18M3 16h18"/>', textI: '<path d="M6 7V5h12v2M12 5v14M9 19h6"/>',
    shapeI: '<rect x="4" y="4" width="16" height="16" rx="2"/>', pathI: '<path d="M4 18c3-8 6 4 9-4s5-6 7-4"/>',
    penTool: '<path d="M12 19l7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z"/><path d="m2 2 7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
    ink: '<path d="M18.4 2.6a2 2 0 0 1 3 3L14 13l-3-3 7.4-7.4Z"/><path d="M11 10c-3 0-5 2-5 5 0 2-1 3-3 4 3 2 8 2 10-1 1.5-2 1-4-2-8Z"/>',
    neon: '<path d="M4 17c3-8 6 3 9-3s5-6 7-3"/><path d="M4 17c3-8 6 3 9-3s5-6 7-3" stroke-width="5" opacity=".25"/>',
    dots: '<circle cx="6" cy="16" r="2"/><circle cx="11" cy="11" r="2"/><circle cx="16" cy="9" r="2"/><circle cx="20" cy="5" r="1.5"/>',
    hatch: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12 12 4M4 18 18 4M9 20 20 9M15 20l5-5"/>',
    lassoI: '<path d="M7 18c-2.5-1-4-3-4-5.5C3 8 7.5 5 12 5s9 3 9 7-4 6-9 6c-1.2 0-2.3-.1-3.3-.4"/><path d="M7 18c0 2 1 3 2.5 3M7 18a2 2 0 1 0 0-.01"/>',
    multiI: '<rect x="3" y="3" width="10" height="10" rx="2"/><rect x="11" y="11" width="10" height="10" rx="2" stroke-dasharray="3 2"/><path d="M17 3v6M14 6h6"/>',
    bUnion: '<path d="M4 4h10v6h6v10H10v-6H4Z" fill="currentColor" fill-opacity=".35"/>',
    bSub: '<path d="M4 4h10v6h-4v4H4Z" fill="currentColor" fill-opacity=".35"/><path d="M10 10h10v10H10Z" stroke-dasharray="2 2"/>',
    bInt: '<path d="M4 4h10v10H4ZM10 10h10v10H10Z" stroke-dasharray="2 2"/><path d="M10 10h4v4h-4Z" fill="currentColor" fill-opacity=".6"/>',
    bExc: '<path d="M4 4h10v6h-4v4H4ZM14 10h6v10H10v-6h4Z" fill="currentColor" fill-opacity=".35"/><path d="M10 10h4v4h-4Z"/>',
    maskI: '<circle cx="9" cy="12" r="6"/><path d="M13 7.5A6 6 0 1 1 13 16.5" stroke-dasharray="2 2"/><rect x="11" y="4" width="10" height="16" rx="2"/>'
  };
  function icon(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>'; }

  // ---------- fonts (same catalogue as the Design guide) ----------

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
        : 'https://fonts.googleapis.com/css2?family=' + family.replace(/ /g, '+') + ':ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap';
      document.head.appendChild(l);
    }
    fontReady[family] = Promise.all([
      document.fonts.load('400 40px "' + family + '"', 'АаӨөҮүBb'),
      document.fonts.load('700 40px "' + family + '"', 'АаӨөҮүBb')
    ]).catch(function () {}).then(function () { return family; });
    return fontReady[family];
  }
  function refreshText(obj) {
    if (!obj || !obj.isType || !obj.isType('textbox')) return;
    obj.initDimensions(); obj.setCoords(); canvas.requestRenderAll();
  }

  // ---------- Design guide data ----------

  var DG = { pairs: [], palettes: [], brand: [] };
  var BASE_PALETTE = ['#ffffff', '#000000', '#0b0b14', '#816dfb', '#e7e3fd', '#34229e', '#f5f5f7', '#ff5a5f', '#ffb020', '#22c55e', '#0ea5e9', '#ff4fd8'];
  function loadDesignGuide() {
    return fetch('/content/design.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
      ((d.fonts || {}).groups || []).forEach(function (g) {
        (g.items || []).forEach(function (it) { if (it.heading && it.body) DG.pairs.push({ heading: it.heading, body: it.body, desc: it.desc || '' }); });
      });
      ((d.palettes || {}).items || []).forEach(function (p) {
        DG.palettes.push({ name: p.name, colors: (p.colors || []).map(function (c) { return c.hex; }).filter(Boolean) });
      });
      DG.brand = ((d.guide || {}).colors || []).map(function (c) { return c.hex; }).filter(Boolean);
    }).catch(function () {});
  }
  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem('gc-editor-prefs') || '{}') || {}; } catch (e) { prefs = {}; }
  function currentPair() { return prefs.pair && prefs.pair.heading ? prefs.pair : (DG.pairs[0] || { heading: 'Manrope', body: 'Inter' }); }

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

  // ---------- canvas ----------

  var ACC = '#6d56fa';
  var PROPS = ['id', 'name', 'isFrame', 'gTransparent', 'gMask', 'gMaskR', 'locked', 'selectable', 'evented', 'hasControls',
    'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'hoverCursor', 'perPixelTargetFind'].concat(window.GFX ? window.GFX.EXTRA : []);
  var stage = $('#stage');
  var page = null, W = 1080, H = 1350;            // page = current frame
  var exporting = false, restoring = false, guides = [], labelRects = [];

  fabric.Object.prototype.set({
    transparentCorners: false, cornerColor: '#ffffff', cornerStrokeColor: ACC, borderColor: ACC,
    cornerSize: 9, cornerStyle: 'rect', padding: 0, borderScaleFactor: 1.5,
    strokeWidth: 0 // shapes are fill-only; Stroke is added from the panel
  });
  fabric.Textbox.prototype.set({ cursorColor: ACC, editingBorderColor: ACC, selectionColor: 'rgba(109,86,250,.25)' });

  var canvas = new fabric.Canvas('ed-canvas', {
    preserveObjectStacking: true, stopContextMenu: true, fireMiddleClick: true,
    selectionColor: 'rgba(109,86,250,.08)', selectionBorderColor: ACC, selectionLineWidth: 1, targetFindTolerance: 5
  });
  function canvasBg() { return getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#f5f5f5'; }
  canvas.backgroundColor = canvasBg();

  // ---------- frames ----------

  function frames() { return canvas.getObjects().filter(function (o) { return o.isFrame; }); }
  function userObjects() { return canvas.getObjects().filter(function (o) { return !o.isFrame && o.id !== '__crop'; }); }
  var frameN = 0;
  function makeFrame(o) {
    frameN++;
    var f = new fabric.Rect({
      left: o.left || 0, top: o.top || 0, width: o.width, height: o.height, fill: o.fill || '#ffffff',
      isFrame: true, id: 'frame-' + Date.now().toString(36) + frameN, name: o.name || ('Frame ' + (frames().length + 1)),
      selectable: false, evented: false, hoverCursor: 'default', objectCaching: false, lockRotation: true, strokeWidth: 0
    });
    f.setControlsVisibility({ mtr: false });
    return f;
  }
  function addFrame(w, h, opts) {
    opts = opts || {};
    var fs = frames(), x = 0, y = 0;
    if (fs.length) {
      x = Math.max.apply(null, fs.map(function (f) { return f.left + f.width * f.scaleX; })) + 120;
      y = fs[0].top;
    }
    var f = makeFrame({ left: x, top: y, width: w, height: h, fill: opts.fill, name: opts.name });
    canvas.insertAt(f, fs.length);
    setCurrent(f);
    return f;
  }
  function fw(f) { return f.width * f.scaleX; }
  function fh(f) { return f.height * f.scaleY; }
  function setCurrent(f) {
    if (!f) return;
    page = f; W = fw(f); H = fh(f);
  }
  function inFrame(o, f) {
    var c = o.getCenterPoint();
    return c.x >= f.left && c.x <= f.left + fw(f) && c.y >= f.top && c.y <= f.top + fh(f);
  }
  function frameOf(o) {
    var fs = frames();
    for (var i = fs.length - 1; i >= 0; i--) if (inFrame(o, fs[i])) return fs[i];
    return null;
  }
  function childrenOf(f) { return userObjects().filter(function (o) { return frameOf(o) === f; }); }
  function moveFrame(f, dx, dy, kids) {
    (kids || childrenOf(f)).forEach(function (o) { o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords(); });
    f.set({ left: f.left + dx, top: f.top + dy }); f.setCoords();
  }
  function selectFrame(f) {
    frames().forEach(function (x) { x.set({ selectable: false, evented: false }); });
    f.set({ selectable: true, evented: true });
    canvas.setActiveObject(f); setCurrent(f); canvas.requestRenderAll();
  }
  function deactivateFrames() { frames().forEach(function (x) { if (canvas.getActiveObject() !== x) x.set({ selectable: false, evented: false }); }); }

  // like Figma, a frame clips its layers (ctx is already in scene coordinates here)
  var baseRender = fabric.Object.prototype.render;
  fabric.Object.prototype.render = function (ctx) {
    if (this.isFrame || this.group || this.id === '__crop' || (crop && this === crop.img) || !this.canvas) return baseRender.call(this, ctx);
    var f = frameOf(this);
    if (!f) return baseRender.call(this, ctx);
    ctx.save(); ctx.beginPath(); ctx.rect(f.left, f.top, fw(f), fh(f)); ctx.clip();
    baseRender.call(this, ctx);
    ctx.restore();
  };

  var CHECKER;
  function checker() {
    if (CHECKER) return CHECKER;
    var c = document.createElement('canvas'); c.width = c.height = 20;
    var x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 20, 20); x.fillStyle = '#e6e6ea'; x.fillRect(0, 0, 10, 10); x.fillRect(10, 10, 10, 10);
    return (CHECKER = new fabric.Pattern({ source: c, repeat: 'repeat' }));
  }
  function frameFill(f) { return f.gTransparent ? 'transparent' : (typeof f.fill === 'string' ? f.fill : '#ffffff'); }
  function setFrameFill(f, c) {
    if (c === 'transparent') { f.gTransparent = true; f.set('fill', checker()); }
    else { f.gTransparent = false; f.set('fill', c); }
    canvas.requestRenderAll(); commit();
  }

  // ---------- viewport ----------

  function resizeCanvas() {
    var r = stage.getBoundingClientRect();
    canvas.setWidth(r.width); canvas.setHeight(r.height); canvas.calcOffset();
  }
  function fitRect(l, t, w, h) {
    var cw = canvas.getWidth(), ch = canvas.getHeight(), pad = cw < 700 ? 24 : 64, dock = 70;
    var z = clamp(Math.min((cw - pad * 2) / w, (ch - pad * 2 - dock) / h), 0.02, 2);
    canvas.setViewportTransform([z, 0, 0, z, (cw - w * z) / 2 - l * z, (ch - dock - h * z) / 2 - t * z + 10]);
    zoomLabel();
  }
  function bounds(objs) {
    if (!objs.length) return null;
    var l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    objs.forEach(function (o) {
      var bb = o.getBoundingRect(true, true);
      l = Math.min(l, bb.left); t = Math.min(t, bb.top); r = Math.max(r, bb.left + bb.width); b = Math.max(b, bb.top + bb.height);
    });
    return { left: l, top: t, width: r - l, height: b - t };
  }
  function fitAll() { var b = bounds(canvas.getObjects().filter(function (o) { return o.id !== '__crop'; })); if (b) fitRect(b.left, b.top, b.width, b.height); }
  function fitFrame(f) { f = f || page; if (f) fitRect(f.left, f.top, fw(f), fh(f)); }
  function zoomLabel() { $('#ed-zoom').textContent = Math.round(canvas.getZoom() * 100) + '%'; }
  function zoomTo(z, pt) {
    canvas.zoomToPoint(pt || new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2), clamp(z, 0.02, 16));
    zoomLabel();
  }
  // wheel = pan (Shift = sideways), Ctrl/⌘ + wheel or trackpad pinch = zoom
  canvas.on('mouse:wheel', function (o) {
    var e = o.e; e.preventDefault(); e.stopPropagation();
    if (e.ctrlKey || e.metaKey) { zoomTo(canvas.getZoom() * Math.pow(0.99, e.deltaY), new fabric.Point(e.offsetX, e.offsetY)); return; }
    var v = canvas.viewportTransform, dx = e.deltaX, dy = e.deltaY;
    if (e.shiftKey && !dx) { dx = dy; dy = 0; }
    v[4] -= dx; v[5] -= dy; canvas.setViewportTransform(v);
  });

  // ---------- overlays: frame labels, snap guides, crop shade ----------

  canvas.on('after:render', function (o) {
    if (exporting) return;
    var ctx = o.ctx || canvas.getContext(), v = canvas.viewportTransform, z = v[0];
    var dpr = canvas.getRetinaScaling ? canvas.getRetinaScaling() : 1;
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    labelRects = [];
    ctx.font = '500 11px Inter, system-ui, sans-serif'; ctx.textBaseline = 'bottom';
    frames().forEach(function (f) {
      var x = v[4] + f.left * z, y = v[5] + f.top * z;
      var txt = f.name || 'Frame', size = Math.round(fw(f)) + ' × ' + Math.round(fh(f));
      var w1 = ctx.measureText(txt).width;
      ctx.fillStyle = f === page ? ACC : (dark ? '#b3b3b3' : '#6b6b6b');
      ctx.fillText(txt, x, y - 5);
      ctx.fillStyle = dark ? '#7a7a7a' : '#a0a0a0';
      if (fw(f) * z > w1 + 90) ctx.fillText(size, x + w1 + 8, y - 5);
      labelRects.push({ f: f, x: x, y: y - 19, w: Math.max(w1 + 8, 40), h: 18 });
    });
    if (guides.length) {
      ctx.strokeStyle = '#ff3d9a'; ctx.lineWidth = 1;
      guides.forEach(function (g) {
        ctx.beginPath();
        if (g.x != null) { ctx.moveTo(v[4] + g.x * z + .5, v[5] + g.a * z); ctx.lineTo(v[4] + g.x * z + .5, v[5] + g.b * z); }
        else { ctx.moveTo(v[4] + g.a * z, v[5] + g.y * z + .5); ctx.lineTo(v[4] + g.b * z, v[5] + g.y * z + .5); }
        ctx.stroke();
      });
    }
    if (crop) {
      var img = crop.img, fr = crop.frame;
      var ix = v[4] + img.left * z, iy = v[5] + img.top * z, iw = crop.ew * img.scaleX * z, ih = crop.eh * img.scaleY * z;
      var fx = v[4] + fr.left * z, fy = v[5] + fr.top * z, fwd = fr.width * fr.scaleX * z, fht = fr.height * fr.scaleY * z;
      ctx.fillStyle = 'rgba(10,10,16,.55)';
      ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.rect(fx + fwd, fy, -fwd, fht); ctx.fill('evenodd');
    }
    ctx.restore();
  });

  // snap to the parent frame's edges and centre
  var dragFrameOf = null;
  canvas.on('mouse:down', function (o) { dragFrameOf = o.target && !o.target.isFrame ? frameOf(o.target) : null; });
  canvas.on('object:moving', function (o) {
    var obj = o.target;
    if (obj.id === '__crop' || obj.isFrame) return;
    var f = dragFrameOf || frameOf(obj); guides = [];
    if (!f) return;
    var thr = 6 / canvas.getZoom(), b = obj.getBoundingRect(true, true);
    var L = f.left, T = f.top, R = f.left + fw(f), B = f.top + fh(f);
    var xs = [[b.left, L], [b.left, (L + R) / 2], [b.left + b.width / 2, (L + R) / 2], [b.left + b.width, (L + R) / 2], [b.left + b.width, R]];
    var ys = [[b.top, T], [b.top, (T + B) / 2], [b.top + b.height / 2, (T + B) / 2], [b.top + b.height, (T + B) / 2], [b.top + b.height, B]];
    var dx = null, dy = null;
    xs.forEach(function (p) { if (dx === null && Math.abs(p[0] - p[1]) < thr) { dx = p[1] - p[0]; guides.push({ x: p[1], a: T, b: B }); } });
    ys.forEach(function (p) { if (dy === null && Math.abs(p[0] - p[1]) < thr) { dy = p[1] - p[0]; guides.push({ y: p[1], a: L, b: R }); } });
    if (dx) obj.left += dx;
    if (dy) obj.top += dy;
    obj.setCoords();
  });
  canvas.on('mouse:up', function () { if (guides.length) { guides = []; canvas.requestRenderAll(); } });

  // frames: drag by their name label, or by their body once selected (children follow)
  var frameDrag = null, frameKids = null, frameLast = null;
  function screenPt(e) { var r = canvas.upperCanvasEl.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  canvas.on('mouse:down:before', function (o) {
    if (tool !== 'move' || spaceDown || o.e.button === 1) return;
    var p = screenPt(o.e);
    for (var i = labelRects.length - 1; i >= 0; i--) {
      var r = labelRects[i];
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
        frameDrag = { f: r.f, x: p.x, y: p.y, kids: childrenOf(r.f), moved: false };
        canvas.selection = false;
        return;
      }
    }
  });
  canvas.on('mouse:down', function (o) {
    if (o.target && o.target.isFrame) { frameKids = childrenOf(o.target); frameLast = { l: o.target.left, t: o.target.top }; }
  });
  canvas.on('object:moving', function (o) {
    var f = o.target;
    if (!f.isFrame || !frameKids) return;
    var dx = f.left - frameLast.l, dy = f.top - frameLast.t;
    frameKids.forEach(function (k) { k.set({ left: k.left + dx, top: k.top + dy }); k.setCoords(); });
    frameLast = { l: f.left, t: f.top };
  });
  canvas.on('mouse:move', function (o) {
    if (!frameDrag) return;
    var p = screenPt(o.e), z = canvas.getZoom();
    var dx = (p.x - frameDrag.x) / z, dy = (p.y - frameDrag.y) / z;
    if (dx || dy) {
      moveFrame(frameDrag.f, dx, dy, frameDrag.kids);
      frameDrag.x = p.x; frameDrag.y = p.y; frameDrag.moved = true;
      canvas.requestRenderAll();
    }
  });
  canvas.on('mouse:up', function () {
    frameKids = null;
    if (!frameDrag) return;
    var f = frameDrag.f, moved = frameDrag.moved;
    frameDrag = null; canvas.selection = true;
    setTimeout(function () { selectFrame(f); if (moved) commit(); refreshUI(); }, 0);
  });
  canvas.on('object:modified', function (o) {
    var f = o.target;
    if (f && f.isFrame && (f.scaleX !== 1 || f.scaleY !== 1)) {
      f.set({ width: Math.max(1, Math.round(f.width * f.scaleX)), height: Math.max(1, Math.round(f.height * f.scaleY)), scaleX: 1, scaleY: 1 });
      f.setCoords(); setCurrent(f);
    }
  });

  // ---------- tools (dock) ----------

  var tool = 'move', shapeKind = 'rect', spaceDown = false, panning = false, panLast = null;
  var draw = { tool: 'pen', color: '#6d56fa', size: 0 };
  var SHAPE_NAMES = { rect: 'Тэгш өнцөгт', rounded: 'Бөөрөнхий', ellipse: 'Эллипс', triangle: 'Гурвалжин', line: 'Шугам', star: 'Од' };
  var SHAPE_KEYS = { rect: 'R', ellipse: 'O', line: 'L' };

  function renderDock() {
    var t = function (id, ic, title, extra) { return '<button type="button" class="tool' + (tool === id ? ' on' : '') + '" data-tool="' + id + '" title="' + title + '">' + icon(ic) + (extra || '') + '</button>'; };
    $('#dock').innerHTML =
      t('move', 'move', 'Сонгох, зөөх (V)') + '<button type="button" class="tool' + (multiSel ? ' on' : '') + '" data-act="multi" title="Олноор сонгох — дарсан зүйл бүрийг сонголтод нэмнэ (Shift + дарахтай адил)">' + icon('multiI') + '</button>' +
      t('hand', 'hand', 'Гар — гүйлгэх (H, эсвэл Space + чирэх)') +
      '<span class="sep"></span>' +
      t('frame', 'frame', 'Frame — шинэ хуудас (F)') +
      '<div class="pw">' + t('shape', shapeKind, SHAPE_NAMES[shapeKind] + ' (R, O, L)', '<svg class="i caret" viewBox="0 0 24 24" data-shape-menu><path d="m6 9 6 6 6-6"/></svg>') +
        '<div class="menu up" id="shape-menu" hidden>' + Object.keys(SHAPE_NAMES).map(function (k) {
          return '<button type="button" data-shape="' + k + '">' + icon(k) + '<span style="flex:1">' + SHAPE_NAMES[k] + '</span><i>' + (SHAPE_KEYS[k] || '') + '</i></button>';
        }).join('') + '</div></div>' +
      t('text', 'text', 'Текст (T)') + t('vector', 'penTool', 'Pen — вектор (P): дарах = цэг, чирэх = муруй, эхний цэгийг дарж хаана') + t('draw', 'pen', 'Бийр, харандаа (B)') +
      '<span class="sep"></span><button type="button" class="tool" data-act="upload" title="Зураг оруулах">' + icon('image') + '</button>';
  }
  function setTool(id) {
    if (crop) endCrop(false);
    if (tool === 'draw' && id !== 'draw') stopDraw();
    if (tool === 'vector' && pen) penFinish(false);
    if (vedit && id !== 'move') endVEdit();
    tool = id;
    var making = ['frame', 'shape', 'text', 'vector'].indexOf(id) >= 0;
    canvas.selection = id === 'move';
    canvas.skipTargetFind = making || id === 'hand' || (id === 'draw' && draw.tool === 'eraser');
    canvas.defaultCursor = making ? 'crosshair' : id === 'hand' ? 'grab' : 'default';
    canvas.hoverCursor = making ? 'crosshair' : id === 'hand' ? 'grab' : 'move';
    if (making || id === 'hand') { canvas.discardActiveObject(); canvas.requestRenderAll(); }
    if (id === 'draw') startDraw();
    if (id === 'vector') penStart();
    renderDock(); renderCtxbar(); updateHint();
  }
  $('#dock').addEventListener('click', function (e) {
    if (e.target.closest('[data-shape-menu]')) { var m = $('#shape-menu'); m.hidden = !m.hidden; e.stopPropagation(); return; }
    var s = e.target.closest('[data-shape]');
    if (s) { shapeKind = s.dataset.shape; setTool('shape'); return; }
    var b = e.target.closest('[data-tool],[data-act]'); if (!b) return;
    if (b.dataset.act === 'upload') { $('#ed-file').click(); return; }
    if (b.dataset.act === 'multi') { setMulti(!multiSel); return; }
    setTool(b.dataset.tool);
  });

  // click or drag to create frames, shapes and text; hand / space / middle mouse to pan
  var creating = null;
  canvas.on('mouse:down', function (o) {
    var e = o.e;
    if (spaceDown || tool === 'hand' || e.button === 1) {
      panning = true; panLast = { x: e.clientX, y: e.clientY }; canvas.setCursor('grabbing'); return;
    }
    if (['frame', 'shape', 'text'].indexOf(tool) < 0) return;
    var p = canvas.getPointer(e);
    if (tool === 'text') {
      var t = addText('b', null, 'Текст', p);
      setTool('move'); canvas.setActiveObject(t); t.enterEditing(); t.selectAll(); canvas.requestRenderAll();
      return;
    }
    var obj = tool === 'frame' ? makeFrame({ left: p.x, top: p.y, width: 1, height: 1 }) : newShape(shapeKind, 1, 1);
    obj.set({ left: p.x, top: p.y });
    restoring = true;
    if (tool === 'frame') canvas.insertAt(obj, frames().length); else canvas.add(obj);
    restoring = false;
    creating = { obj: obj, x: p.x, y: p.y, kind: tool === 'frame' ? 'frame' : shapeKind };
  });
  canvas.on('mouse:move', function (o) {
    var e = o.e;
    if (panning) {
      var v = canvas.viewportTransform; v[4] += e.clientX - panLast.x; v[5] += e.clientY - panLast.y;
      panLast = { x: e.clientX, y: e.clientY }; canvas.setViewportTransform(v); return;
    }
    if (!creating) return;
    var p = canvas.getPointer(e), w = p.x - creating.x, h = p.y - creating.y;
    if (e.shiftKey) { var m = Math.max(Math.abs(w), Math.abs(h)); w = w < 0 ? -m : m; h = h < 0 ? -m : m; }
    sizeShape(creating.obj, creating.kind, Math.abs(w), Math.abs(h));
    creating.obj.set({ left: Math.min(creating.x, creating.x + w), top: Math.min(creating.y, creating.y + h) });
    creating.obj.setCoords(); canvas.requestRenderAll();
  });
  canvas.on('mouse:up', function () {
    if (panning) { panning = false; canvas.setCursor(tool === 'hand' ? 'grab' : 'default'); return; }
    if (!creating) return;
    var c = creating, o = c.obj; creating = null;
    var small = o.getScaledWidth() < 6 && o.getScaledHeight() < 6;
    if (small) {
      var d = c.kind === 'frame' ? [1080, 1350] : c.kind === 'line' ? [300, 0] : [200, 200];
      sizeShape(o, c.kind, d[0], d[1]);
      o.set({ left: c.x - (c.kind === 'frame' ? 0 : d[0] / 2), top: c.y - (c.kind === 'frame' ? 0 : d[1] / 2) });
    }
    o.setCoords();
    setTool('move');
    if (c.kind === 'frame') { o.set({ width: Math.round(o.width), height: Math.round(o.height) }); selectFrame(o); }
    else { o.set({ name: SHAPE_NAMES[c.kind] }); canvas.setActiveObject(o); }
    commit(); refreshUI();
  });
  function newShape(k, w, h) {
    var fill = '#816dfb';
    if (k === 'rect') return new fabric.Rect({ width: w, height: h, fill: fill });
    if (k === 'rounded') return new fabric.Rect({ width: w, height: h, rx: 24, ry: 24, fill: fill });
    if (k === 'ellipse') return new fabric.Ellipse({ rx: w / 2, ry: h / 2, fill: fill });
    if (k === 'triangle') return new fabric.Triangle({ width: w, height: h, fill: fill });
    if (k === 'line') return new fabric.Line([0, 0, w, h], { stroke: '#1e1e1e', strokeWidth: 4, strokeLineCap: 'round' });
    var pts = [], R = 50, r = 22;
    for (var i = 0; i < 10; i++) { var a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r : R; pts.push({ x: Math.cos(a) * rr + R, y: Math.sin(a) * rr + R }); }
    var s = new fabric.Polygon(pts, { fill: fill }); s.scaleX = w / 100; s.scaleY = h / 100; return s;
  }
  function sizeShape(o, k, w, h) {
    w = Math.max(1, w); h = Math.max(k === 'line' ? 0 : 1, h);
    if (k === 'frame' || k === 'rect' || k === 'rounded' || k === 'triangle') o.set({ width: w, height: h });
    else if (k === 'ellipse') o.set({ rx: w / 2, ry: h / 2, width: w, height: h });
    else if (k === 'line') o.set({ x2: w, y2: h });
    else o.set({ scaleX: w / 100, scaleY: h / 100 });
  }

  // ---------- history + autosave ----------

  var hist = [], hi = -1, commitT, saveT;
  function snapshot() { return JSON.stringify({ v: 2, name: $('#ed-name').value, current: page && page.id, canvas: canvas.toJSON(PROPS) }); }
  function commit() {
    if (restoring || crop) return;
    clearTimeout(commitT); commitT = setTimeout(pushHistory, 160);
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
    var d = JSON.parse(s), vpt = canvas.viewportTransform.slice();
    restoring = true;
    return new Promise(function (res) {
      canvas.loadFromJSON(d.canvas, function () {
        canvas.backgroundColor = canvasBg();
        // designs from the previous editor had one "page" rect at (0,0)
        canvas.getObjects().forEach(function (o) {
          if (o.id === 'page') o.set({ isFrame: true, id: 'frame-legacy', name: 'Frame 1' });
        });
        var fs = frames();
        fs.forEach(function (f, i) {
          f.set({ selectable: false, evented: false, hoverCursor: 'default', objectCaching: false, lockRotation: true });
          f.setControlsVisibility({ mtr: false });
          if (f.gTransparent || (f.fill && typeof f.fill !== 'string')) { f.gTransparent = true; f.set('fill', checker()); }
          canvas.moveTo(f, i);
        });
        if (!fs.length) addFrame(1080, 1350);
        setCurrent(frames().filter(function (f) { return f.id === d.current; })[0] || frames()[0]);
        if (d.name) $('#ed-name').value = d.name;
        userObjects().forEach(function (o) { if (o.locked) lockObj(o, true); });
        if (keepView) canvas.setViewportTransform(vpt); else fitAll();
        canvas.renderAll();
        restoring = false;
        userObjects().forEach(function (o) { if (o.fontFamily) ensureFont(primary(o.fontFamily)).then(function () { refreshText(o); }); });
        refreshUI();
        res();
      });
    });
  }
  function undo() { if (hi > 0) { hi--; restore(hist[hi], true).then(function () { histButtons(); dbSet('doc', hist[hi]); }); } }
  function redo() { if (hi < hist.length - 1) { hi++; restore(hist[hi], true).then(function () { histButtons(); dbSet('doc', hist[hi]); }); } }

  canvas.on('object:added', function (o) { if (!restoring && !o.target.isFrame) { commit(); scheduleUI(); } });
  canvas.on('object:removed', function () { if (!restoring) { commit(); scheduleUI(); } });
  canvas.on('object:modified', function () { commit(); scheduleUI(); });
  canvas.on('text:changed', function () { commit(); scheduleUI(); });
  canvas.on('selection:created', onSelect);
  canvas.on('selection:updated', onSelect);
  canvas.on('selection:cleared', function () { deactivateFrames(); refreshUI(); });
  canvas.on('object:moving', syncGeom); canvas.on('object:scaling', syncGeom); canvas.on('object:rotating', syncGeom);
  $('#ed-name').addEventListener('input', commit);
  function onSelect() {
    var o = canvas.getActiveObject();
    if (o && !o.isFrame) { deactivateFrames(); var f = frameOf(o); if (f) setCurrent(f); }
    if (o && o.isFrame) setCurrent(o);
    refreshUI();
  }
  var uiT;
  function scheduleUI() { clearTimeout(uiT); uiT = setTimeout(refreshUI, 30); }

  // ---------- adding things ----------

  var NAMES = { textbox: 'Текст', image: 'Зураг', rect: 'Тэгш өнцөгт', ellipse: 'Эллипс', circle: 'Тойрог', triangle: 'Гурвалжин', line: 'Шугам', polygon: 'Од', path: 'Зураас', group: 'Бүлэг' };
  // put an object at a point (default: centre of the current frame)
  function place(obj, at) {
    obj.set({ name: obj.name || NAMES[obj.type] || 'Зүйл' });
    restoring = true; canvas.add(obj); restoring = false;
    var c = at || { x: page.left + W / 2, y: page.top + H / 2 };
    obj.setPositionByOrigin(new fabric.Point(c.x, c.y), 'center', 'center');
    obj.setCoords();
    canvas.setActiveObject(obj); canvas.requestRenderAll();
    commit(); refreshUI();
    return obj;
  }
  var TEXT_STYLES = {
    h: { text: 'Гарчиг нэмэх', size: 0.085, weight: 700, role: 'heading' },
    s: { text: 'Дэд гарчиг нэмэх', size: 0.05, weight: 600, role: 'heading' },
    b: { text: 'Энд текстээ бичнэ үү', size: 0.032, weight: 400, role: 'body' }
  };
  function isDark(c) {
    if (typeof c !== 'string' || c[0] !== '#') return false;
    var n = parseInt(c.slice(1).padEnd(6, '0').slice(0, 6), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) < 128;
  }
  function addText(kind, fontName, text, at) {
    var st = TEXT_STYLES[kind], pair = currentPair();
    var f = fontName || (st.role === 'heading' ? pair.heading : pair.body);
    var base = Math.min(W, H * 0.9);
    var t = new fabric.Textbox(text || st.text, {
      fontFamily: stack(f), fontWeight: st.weight, fontSize: Math.max(12, Math.round(base * st.size)),
      fill: isDark(frameFill(page)) ? '#ffffff' : '#1e1e1e', width: Math.round(W * (kind === 'b' ? 0.6 : 0.8)),
      textAlign: 'center', lineHeight: kind === 'b' ? 1.4 : 1.1
    });
    place(t, at);
    ensureFont(f).then(function () { refreshText(t); commit(); });
    return t;
  }
  function addPair(p) {
    var h = addText('h', p.heading, 'Гарчиг');
    var b = addText('b', p.body, 'Энд тайлбар текстээ бичнэ үү.');
    h.set({ top: page.top + H / 2 - h.height - 10 }); b.set({ top: page.top + H / 2 + 10 });
    h.setCoords(); b.setCoords();
    canvas.setActiveObject(new fabric.ActiveSelection([h, b], { canvas: canvas }));
    canvas.requestRenderAll(); commit();
  }
  function addShape(k) {
    var s = Math.round(Math.min(W, H) * 0.3), o = newShape(k, s, k === 'line' ? 0 : s);
    o.set({ name: SHAPE_NAMES[k] });
    place(o);
  }

  // images: downscale huge photos, keep as data URL so the design saves offline
  function readImage(blob) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(blob), img = new Image();
      img.onload = function () {
        var k = Math.min(1, 2400 / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        res({ url: c.toDataURL(/png|webp|svg/i.test(blob.type) ? 'image/png' : 'image/jpeg', 0.92), w: c.width, h: c.height });
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('image')); };
      img.src = url;
    });
  }
  var recent = [];
  function addImageBlob(blob, opts) {
    opts = opts || {};
    return readImage(blob).then(function (r) {
      recent.unshift(r.url); recent = recent.slice(0, 12);
      return addImageUrl(r.url, opts);
    }).catch(function () { toast('Зургийг уншиж чадсангүй'); });
  }
  function addImageUrl(url, opts) {
    opts = opts || {};
    return new Promise(function (res) {
      fabric.Image.fromURL(url, function (img) {
        if (opts.fillFrame) {
          // empty design: make the frame the photo's shape
          page.set({ width: img.width, height: img.height }); page.setCoords(); setCurrent(page);
          img.set({ left: page.left, top: page.top, name: 'Зураг' });
          restoring = true; canvas.add(img); restoring = false;
          canvas.setActiveObject(img); fitFrame(page); commit(); refreshUI();
        } else {
          img.scale(Math.min((W * 0.7) / img.width, (H * 0.7) / img.height, 1));
          place(img, opts.at);
        }
        res(img);
      });
    });
  }

  // ---------- selection actions ----------

  function active() { return canvas.getActiveObject(); }
  function kindOf(o) {
    if (!o) return null;
    if (o.isFrame) return 'frame';
    if (o.type === 'activeSelection') return 'multi';
    if (o.type === 'group') return 'group';
    if (o.isType('textbox') || o.isType('i-text') || o.isType('text')) return 'text';
    if (o.isType('image')) return 'image';
    if (o.isType('line') || o.isType('path')) return 'line';
    return 'shape';
  }
  function eachSel(fn) { var o = active(); if (!o) return; if (o.type === 'activeSelection') o.getObjects().forEach(fn); else fn(o); }
  function lockObj(o, on) {
    o.locked = on;
    o.set({ lockMovementX: on, lockMovementY: on, lockScalingX: on, lockScalingY: on, lockRotation: on, hasControls: !on, editable: !on, hoverCursor: on ? 'default' : null });
  }
  function duplicate() {
    var o = active(); if (!o) return;
    if (o.isFrame) { duplicateFrame(o); return; }
    o.clone(function (c) {
      canvas.discardActiveObject();
      c.set({ left: c.left + 20, top: c.top + 20, evented: true });
      if (c.type === 'activeSelection') { c.canvas = canvas; c.forEachObject(function (x) { canvas.add(x); }); c.setCoords(); }
      else canvas.add(c);
      canvas.setActiveObject(c); canvas.requestRenderAll(); commit();
    }, PROPS);
  }
  function duplicateFrame(f) {
    var kids = childrenOf(f), nf = addFrame(fw(f), fh(f), { fill: f.gTransparent ? '#ffffff' : frameFill(f), name: (f.name || 'Frame') + ' хуулбар' });
    if (f.gTransparent) { nf.gTransparent = true; nf.set('fill', checker()); }
    var dx = nf.left - f.left, dy = nf.top - f.top, n = kids.length;
    if (!n) { selectFrame(nf); commit(); refreshUI(); return; }
    restoring = true;
    kids.forEach(function (k) {
      k.clone(function (c) {
        c.set({ left: c.left + dx, top: c.top + dy }); canvas.add(c);
        if (--n === 0) { restoring = false; selectFrame(nf); canvas.requestRenderAll(); commit(); refreshUI(); }
      }, PROPS);
    });
  }
  function removeSel() {
    var o = active(); if (!o || o.isEditing) return;
    if (o.isFrame) {
      if (frames().length === 1) { toast('Сүүлийн frame-ийг устгах боломжгүй'); return; }
      childrenOf(o).forEach(function (k) { canvas.remove(k); });
      canvas.remove(o); canvas.discardActiveObject(); setCurrent(frames()[0]); canvas.requestRenderAll(); commit(); refreshUI(); return;
    }
    if (o.type === 'activeSelection') o.getObjects().forEach(function (x) { canvas.remove(x); }); else canvas.remove(o);
    canvas.discardActiveObject(); canvas.requestRenderAll();
  }
  function arrange(dir) {
    var min = frames().length, n = canvas.getObjects().length;
    eachSel(function (o) {
      if (o.isFrame) return;
      var i = canvas.getObjects().indexOf(o);
      if (dir === 'up' && i < n - 1) canvas.moveTo(o, i + 1);
      if (dir === 'down' && i > min) canvas.moveTo(o, i - 1);
      if (dir === 'top') canvas.moveTo(o, n - 1);
      if (dir === 'bottom') canvas.moveTo(o, min);
    });
    canvas.requestRenderAll(); commit(); refreshUI();
  }
  // align to the parent frame (one object) or to the selection bounds (several)
  function align(how) {
    var o = active(); if (!o || o.isFrame) return;
    if (o.type === 'activeSelection') {
      var items = o.getObjects(), b;
      canvas.discardActiveObject();
      b = bounds(items);
      items.forEach(function (it) { alignObj(it, how, b); });
      canvas.setActiveObject(new fabric.ActiveSelection(items, { canvas: canvas }));
    } else {
      var f = frameOf(o) || page;
      alignObj(o, how, { left: f.left, top: f.top, width: fw(f), height: fh(f) });
    }
    canvas.requestRenderAll(); commit(); refreshUI();
  }
  function alignObj(o, how, box) {
    var b = o.getBoundingRect(true, true), dx = 0, dy = 0;
    if (how === 'L') dx = box.left - b.left;
    if (how === 'C') dx = box.left + box.width / 2 - (b.left + b.width / 2);
    if (how === 'R') dx = box.left + box.width - (b.left + b.width);
    if (how === 'T') dy = box.top - b.top;
    if (how === 'M') dy = box.top + box.height / 2 - (b.top + b.height / 2);
    if (how === 'B') dy = box.top + box.height - (b.top + b.height);
    o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords();
  }
  function distribute(axis) {
    var o = active(); if (!o || o.type !== 'activeSelection') return;
    var items = o.getObjects().slice(); if (items.length < 3) { toast('Дор хаяж 3 зүйл сонгоно уу'); return; }
    canvas.discardActiveObject();
    var bb = items.map(function (it) { return { it: it, b: it.getBoundingRect(true, true) }; });
    bb.sort(function (a, c) { return axis === 'H' ? a.b.left - c.b.left : a.b.top - c.b.top; });
    var first = bb[0].b, last = bb[bb.length - 1].b;
    var total = bb.reduce(function (s, x) { return s + (axis === 'H' ? x.b.width : x.b.height); }, 0);
    var span = axis === 'H' ? last.left + last.width - first.left : last.top + last.height - first.top;
    var gap = (span - total) / (bb.length - 1), pos = axis === 'H' ? first.left : first.top;
    bb.forEach(function (x) {
      var d = pos - (axis === 'H' ? x.b.left : x.b.top);
      if (axis === 'H') x.it.left += d; else x.it.top += d;
      x.it.setCoords(); pos += (axis === 'H' ? x.b.width : x.b.height) + gap;
    });
    canvas.setActiveObject(new fabric.ActiveSelection(items, { canvas: canvas }));
    canvas.requestRenderAll(); commit(); refreshUI();
  }
  function groupSel() { var o = active(); if (!o || o.type !== 'activeSelection') return; o.toGroup().set({ name: 'Бүлэг' }); canvas.requestRenderAll(); commit(); refreshUI(); }
  function ungroupSel() { var o = active(); if (!o || o.type !== 'group') return; o.toActiveSelection(); canvas.requestRenderAll(); commit(); refreshUI(); }
  function setAsBackground() {
    var o = active(); if (!o || !o.isType('image')) return;
    var f = frameOf(o) || page, s = Math.max(fw(f) / o.width, fh(f) / o.height);
    o.set({ scaleX: s, scaleY: s, angle: 0, left: f.left + (fw(f) - o.width * s) / 2, top: f.top + (fh(f) - o.height * s) / 2 });
    o.setCoords(); canvas.moveTo(o, frames().length); canvas.requestRenderAll(); commit(); refreshUI();
    toast('Frame-ийг бүтэн дүүргэлээ');
  }
  function rotate90(o) { o.rotate(((o.angle || 0) + 90) % 360); o.setCoords(); commit(); }

  // ---------- image: crop mode ----------

  var crop = null;
  function startCrop() {
    var img = active(); if (!img || !img.isType('image') || crop) return;
    if (img.angle) { img.rotate(0); img.setCoords(); }
    var el = img.getElement(), ew = el.naturalWidth || el.width, eh = el.naturalHeight || el.height, s = img.scaleX, t = img.scaleY;
    var saved = { cropX: img.cropX || 0, cropY: img.cropY || 0, width: img.width, height: img.height, left: img.left, top: img.top, clipPath: img.clipPath };
    var dxL = img.flipX ? (ew - saved.cropX - saved.width) * s : saved.cropX * s;
    var dyT = img.flipY ? (eh - saved.cropY - saved.height) * t : saved.cropY * t;
    img.set({ cropX: 0, cropY: 0, width: ew, height: eh, left: saved.left - dxL, top: saved.top - dyT, clipPath: null, selectable: false, evented: false });
    img.setCoords();
    var frame = new fabric.Rect({
      left: saved.left, top: saved.top, width: saved.width * s, height: saved.height * t, fill: 'rgba(0,0,0,0)',
      stroke: '#ffffff', strokeWidth: 2, strokeUniform: true, strokeDashArray: [8, 6], lockRotation: true,
      cornerColor: '#ffffff', cornerStrokeColor: ACC, excludeFromExport: true, id: '__crop', name: 'Тайралт'
    });
    frame.setControlsVisibility({ mtr: false });
    var bd = { l: img.left, t: img.top, r: img.left + ew * s, b: img.top + eh * t };
    function keepInside() {
      var w = frame.width * frame.scaleX, h = frame.height * frame.scaleY;
      if (w > bd.r - bd.l) { frame.scaleX = (bd.r - bd.l) / frame.width; w = bd.r - bd.l; }
      if (h > bd.b - bd.t) { frame.scaleY = (bd.b - bd.t) / frame.height; h = bd.b - bd.t; }
      frame.left = clamp(frame.left, bd.l, bd.r - w); frame.top = clamp(frame.top, bd.t, bd.b - h);
      frame.setCoords();
    }
    frame.on('moving', keepInside); frame.on('scaling', keepInside);
    crop = { img: img, frame: frame, saved: saved, ew: ew, eh: eh };
    restoring = true; canvas.add(frame); restoring = false;
    canvas.setActiveObject(frame); canvas.requestRenderAll();
    refreshUI();
  }
  function endCrop(apply) {
    if (!crop) return;
    var c = crop, img = c.img, f = c.frame, s = img.scaleX, t = img.scaleY;
    crop = null;
    restoring = true; canvas.remove(f); restoring = false;
    if (apply) {
      var dl = f.left - img.left, dt = f.top - img.top, w = f.width * f.scaleX, h = f.height * f.scaleY;
      var sx = img.flipX ? c.ew - (dl + w) / s : dl / s, sy = img.flipY ? c.eh - (dt + h) / t : dt / t;
      img.set({ cropX: Math.max(0, sx), cropY: Math.max(0, sy), width: w / s, height: h / t, left: f.left, top: f.top });
    } else img.set(c.saved);
    img.set({ selectable: true, evented: true, dirty: true });
    if (img.gMask) fitMask(img, img.gMask, img.gMaskR);
    img.setCoords();
    canvas.setActiveObject(img); canvas.requestRenderAll();
    if (apply) commit();
    refreshUI();
  }

  // shape masks (clipPath in the image's own coordinates)
  function fitMask(img, kind, radius) {
    var w = img.width, h = img.height, m = Math.min(w, h), cp = null;
    if (kind === 'circle') cp = new fabric.Circle({ radius: m / 2, originX: 'center', originY: 'center' });
    if (kind === 'oval') cp = new fabric.Ellipse({ rx: w / 2, ry: h / 2, originX: 'center', originY: 'center' });
    if (kind === 'rounded') { var rr = radius != null ? radius / (img.scaleX || 1) : m * 0.12; cp = new fabric.Rect({ width: w, height: h, rx: rr, ry: rr, originX: 'center', originY: 'center' }); }
    if (kind === 'arch') cp = new fabric.Path('M ' + (-w / 2) + ' ' + (h / 2) + ' L ' + (-w / 2) + ' ' + (-h / 2 + w / 2) + ' A ' + (w / 2) + ' ' + (w / 2) + ' 0 0 1 ' + (w / 2) + ' ' + (-h / 2 + w / 2) + ' L ' + (w / 2) + ' ' + (h / 2) + ' Z', { originX: 'center', originY: 'center' });
    img.gMask = cp ? kind : null;
    img.gMaskR = kind === 'rounded' ? radius : null;
    img.set({ clipPath: cp, dirty: true });
  }

  // ---------- image: AI background removal (U²-Net-P, in the browser) ----------

  var ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/';
  var rmbg = { ready: null, session: null };
  function rmbgReady() {
    if (rmbg.ready) return rmbg.ready;
    rmbg.ready = (window.ort ? Promise.resolve() : loadScript(ORT + 'ort.min.js')).then(function () {
      window.ort.env.wasm.wasmPaths = ORT; window.ort.env.wasm.numThreads = 1;
      return window.ort.InferenceSession.create('/assets/vendor/u2netp.onnx', { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    }).then(function (s) { rmbg.session = s; });
    rmbg.ready.catch(function () { rmbg.ready = null; });
    return rmbg.ready;
  }
  // U²-Net-P alpha mask (320×320 canvas) for any image element
  function aiMask(el) {
    var S = 320;
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
        var m = out[s.outputNames[0]].data, lo = Infinity, hi2 = -Infinity;
        for (i = 0; i < n; i++) { if (m[i] < lo) lo = m[i]; if (m[i] > hi2) hi2 = m[i]; }
        var mc = document.createElement('canvas'); mc.width = S; mc.height = S;
        var mx = mc.getContext('2d'), md = mx.createImageData(S, S);
        for (i = 0; i < n; i++) { var a = ((m[i] - lo) / ((hi2 - lo) || 1) - 0.2) / 0.6; md.data[i * 4] = md.data[i * 4 + 1] = md.data[i * 4 + 2] = 255; md.data[i * 4 + 3] = a <= 0 ? 0 : a >= 1 ? 255 : Math.round(a * 255); }
        mx.putImageData(md, 0, 0);
        return mc;
      });
    });
  }
  function removeBackground(img) {
    var el = img._originalElement || img.getElement(), W0 = el.naturalWidth || el.width, H0 = el.naturalHeight || el.height;
    toast('AI дэвсгэрийг арилгаж байна… (анх удаа ~5MB загвар ачаална)');
    return aiMask(el).then(function (mc) {
      {
        var o = document.createElement('canvas'); o.width = W0; o.height = H0;
        var ox = o.getContext('2d'); ox.imageSmoothingQuality = 'high';
        ox.drawImage(el, 0, 0, W0, H0); ox.globalCompositeOperation = 'destination-in'; ox.drawImage(mc, 0, 0, W0, H0);
        var outUrl = o.toDataURL('image/png');
        cutOrig[outUrl] = cutOrig[img.getSrc()] || img.getSrc();
        return outUrl;
      }
    }).then(function (url) {
      return new Promise(function (res) {
        var keep = { width: img.width, height: img.height, cropX: img.cropX, cropY: img.cropY };
        img.setSrc(url, function () { img.set(keep); img.set('dirty', true); img.applyFilters(); canvas.requestRenderAll(); commit(); refreshUI(); res(); });
      });
    }).then(function () { toast('Дэвсгэр арилгалаа'); })
      .catch(function (e) { console.error(e); toast('Дэвсгэр арилгаж чадсангүй. Интернэтээ шалгана уу.'); });
  }

  // ---------- image filters ----------

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
  var PRESETS = [['none', 'Анхны', null], ['bw', 'Хар цагаан', 'Grayscale'], ['sepia', 'Сепиа', 'Sepia'], ['vintage', 'Винтаж', 'Vintage'],
    ['kodachrome', 'Кодахром', 'Kodachrome'], ['technicolor', 'Техниколор', 'Technicolor'], ['polaroid', 'Полароид', 'Polaroid'], ['brownie', 'Бор', 'Brownie']];
  function presetOf(img) { for (var i = 1; i < PRESETS.length; i++) if (F[PRESETS[i][2]] && getFilter(img, F[PRESETS[i][2]])) return PRESETS[i][0]; return 'none'; }
  function setPreset(img, id) {
    img.filters = (img.filters || []).filter(function (f) { return !PRESETS.some(function (p) { return p[2] && F[p[2]] && f instanceof F[p[2]]; }); });
    var p = PRESETS.filter(function (x) { return x[0] === id; })[0];
    if (p && p[2] && F[p[2]]) img.filters.unshift(new F[p[2]]());
    img.applyFilters(); canvas.requestRenderAll(); commit();
  }

  // ---------- colours ----------

  function parseCol(c) {
    if (!c || typeof c !== 'string' || c === 'transparent') return { hex: '#000000', a: c === 'transparent' ? 0 : 1 };
    var col = new fabric.Color(c), s = col.getSource();
    return { hex: '#' + col.toHex().toLowerCase(), a: s[3] == null ? 1 : s[3] };
  }
  function mkCol(hex, a) {
    if (a >= 0.999) return hex;
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + r1(a * 100) / 100 + ')';
  }

  // ---------- drawing ----------

  function brushSize() { return draw.size || Math.max(4, Math.round(Math.min(W, H) * 0.012)); }
  function applyBrush() {
    if (draw.tool === 'eraser') { canvas.isDrawingMode = false; canvas.skipTargetFind = true; canvas.defaultCursor = 'cell'; return; }
    canvas.skipTargetFind = false; canvas.defaultCursor = 'default';
    canvas.freeDrawingBrush = makeBrush(); canvas.isDrawingMode = true;
  }
  function startDraw() { canvas.discardActiveObject(); applyBrush(); canvas.selection = false; updateHint(); }
  function stopDraw() { canvas.isDrawingMode = false; canvas.selection = true; canvas.skipTargetFind = false; canvas.defaultCursor = 'default'; updateHint(); }
  canvas.on('path:created', function (e) {
    e.path.set({ name: draw.tool === 'marker' ? 'Маркер' : 'Зураас', perPixelTargetFind: true });
    commit(); scheduleUI();
  });
  var erasing = false;
  canvas.on('mouse:down', function (o) { if (tool === 'draw' && draw.tool === 'eraser') { erasing = true; eraseAt(o.e); } });
  canvas.on('mouse:move', function (o) { if (erasing) eraseAt(o.e); });
  canvas.on('mouse:up', function () { erasing = false; });
  function eraseAt(e) {
    canvas.skipTargetFind = false;
    var t = canvas.findTarget(e, true);
    canvas.skipTargetFind = true;
    if (t && !t.isFrame && (t.isType('path') || (t.type === 'group' && !t.name))) { canvas.remove(t); canvas.requestRenderAll(); }
  }

  // ---------- templates (each one fills an empty frame or becomes a new one) ----------

  var TEMPLATES = [
    { id: 'sale', name: 'Хямдралын пост', w: 1080, h: 1350, bg: '#0b0b14', sw: ['#0b0b14', '#816dfb', '#e7e3fd'] },
    { id: 'event', name: 'Арга хэмжээний постер', w: 1080, h: 1350, bg: '#e7e3fd', sw: ['#e7e3fd', '#34229e', '#16161f'] },
    { id: 'quote', name: 'Ишлэл', w: 1080, h: 1080, bg: '#16161f', sw: ['#16161f', '#816dfb', '#ffffff'] },
    { id: 'story', name: 'Story — шинэ бүтээгдэхүүн', w: 1080, h: 1920, bg: '#816dfb', sw: ['#816dfb', '#ffffff', '#0b0b14'] },
    { id: 'yt', name: 'YouTube thumbnail', w: 1280, h: 720, bg: '#0b0b14', sw: ['#0b0b14', '#ffffff', '#ff4fd8'] },
    { id: 'card', name: 'Нэрийн хуудас', w: 1050, h: 600, bg: '#16161f', sw: ['#16161f', '#e7e3fd', '#816dfb'] }
  ];
  var SIZES = [
    ['Instagram пост', 1080, 1350], ['Квадрат пост', 1080, 1080], ['Story / Reels', 1080, 1920], ['Facebook пост', 1200, 630],
    ['YouTube thumbnail', 1280, 720], ['Танилцуулга 16:9', 1920, 1080], ['A4 постер', 1240, 1754], ['Нэрийн хуудас', 1050, 600]
  ];
  function useTemplate(id) {
    var tp = TEMPLATES.filter(function (x) { return x.id === id; })[0]; if (!tp) return;
    var f = page && !childrenOf(page).length ? page : addFrame(tp.w, tp.h);
    f.set({ width: tp.w, height: tp.h, fill: tp.bg, name: tp.name }); f.gTransparent = false; f.setCoords(); setCurrent(f);
    var X = f.left, Y = f.top, pair = currentPair(), made = [];
    function T(text, o) {
      var fn = o.body ? pair.body : pair.heading;
      var t = new fabric.Textbox(text, {
        fontFamily: stack(fn), fontWeight: o.weight || (o.body ? 400 : 700), fontSize: o.size, fill: o.color || '#ffffff',
        width: o.width || tp.w * 0.84, textAlign: o.align || 'center', lineHeight: o.lh || 1.1, charSpacing: o.cs || 0
      });
      t.set({ left: X + (o.left != null ? o.left : (tp.w - t.width) / 2), top: Y + o.top, name: 'Текст' });
      if (o.stroke) t.set({ stroke: o.stroke, strokeWidth: o.strokeWidth || 4, paintFirst: 'stroke' });
      ensureFont(fn).then(function () { refreshText(t); });
      made.push(t);
    }
    function R(o, name) { var r = new fabric.Rect(o); r.set({ left: X + o.left, top: Y + o.top, name: name }); made.push(r); }
    if (id === 'sale') {
      T('ХЯМДРАЛ', { top: 150, size: 96, color: '#e7e3fd', cs: 300 });
      T('−30%', { top: 330, size: 330, color: '#816dfb', lh: 1 });
      T('Зөвхөн энэ долоо хоногт бүх бүтээгдэхүүнд', { top: 760, size: 44, color: '#a6a8b8', body: true, width: 760 });
      R({ left: 290, top: 1010, width: 500, height: 120, rx: 60, ry: 60, fill: '#816dfb' }, 'Товч');
      T('Одоо захиалах', { top: 1042, size: 42, color: '#ffffff', body: true, weight: 700, width: 500, left: 290 });
    } else if (id === 'event') {
      // centre stays inside the frame, so the circle belongs to it
      made.push(new fabric.Circle({ left: X + 560, top: Y - 120, radius: 420, fill: '#816dfb', name: 'Чимэглэл' }));
      T('DEMO DAY · 2026', { top: 560, size: 38, color: '#34229e', cs: 250, align: 'left', left: 90 });
      T('Арга хэмжээний нэрээ энд бичнэ', { top: 640, size: 108, color: '#16161f', align: 'left', left: 90, width: 900 });
      R({ left: 90, top: 1080, width: 900, height: 3, fill: '#16161f' }, 'Шугам');
      T('10.15 · 18:00  —  Улаанбаатар, Galaxy Tower', { top: 1120, size: 38, color: '#16161f', body: true, align: 'left', left: 90, width: 900 });
    } else if (id === 'quote') {
      T('“', { top: 70, size: 360, color: '#816dfb', lh: 1 });
      T('Дизайн гэдэг зүгээр л гоё харагдах биш, хэрхэн ажиллахыг хэлнэ.', { top: 380, size: 64, color: '#ffffff', width: 860, lh: 1.25 });
      T('— Стив Жобс', { top: 800, size: 36, color: '#a497ff', body: true });
    } else if (id === 'story') {
      T('ШИНЭ', { top: 180, size: 64, color: '#ffffff', cs: 400 });
      R({ left: 140, top: 360, width: 800, height: 800, rx: 40, ry: 40, fill: 'rgba(255,255,255,0.18)' }, 'Зургийн байр');
      T('Бүтээгдэхүүний зургаа энд чирж тавина', { top: 730, size: 38, color: '#ffffff', body: true, width: 640 });
      T('Бүтээгдэхүүний нэр', { top: 1280, size: 104, color: '#ffffff', width: 900 });
      R({ left: 330, top: 1560, width: 420, height: 130, rx: 65, ry: 65, fill: '#ffffff' }, 'Үнийн шошго');
      T('49,900₮', { top: 1590, size: 64, color: '#0b0b14', width: 420, left: 330 });
    } else if (id === 'yt') {
      R({ left: 0, top: 560, width: 1280, height: 160, fill: '#ff4fd8' }, 'Тууз');
      T('ГАРЧИГ ЭНД', { top: 150, size: 170, color: '#ffffff', stroke: '#000000', strokeWidth: 10, width: 1180, lh: 1 });
      T('Видеоны дэд гарчиг', { top: 600, size: 64, color: '#0b0b14', weight: 700, width: 1180 });
    } else if (id === 'card') {
      T('Нэр Овог', { top: 150, size: 72, color: '#e7e3fd', align: 'left', left: 90, width: 800 });
      T('График дизайнер', { top: 250, size: 34, color: '#816dfb', body: true, align: 'left', left: 90, width: 800 });
      R({ left: 90, top: 340, width: 120, height: 4, fill: '#816dfb' }, 'Шугам');
      T('+976 8000 0000\nhello@graphican.online\ngraphican.online', { top: 380, size: 30, color: '#a6a8b8', body: true, align: 'left', left: 90, width: 800, lh: 1.5 });
    }
    restoring = true; made.forEach(function (o) { canvas.add(o); }); restoring = false;
    fitFrame(f); selectFrame(f); commit(); refreshUI();
    toast('«' + tp.name + '» — текстүүд дээр давхар дарж засна');
  }

  // ---------- free stock media (Pexels / Pixabay via /api/stock on our Worker) ----------

  var stock = { src: 'pexels', type: 'photo', q: '', page: 1, items: [], total: 0, loading: false, err: '' };
  function stockPanel() {
    var seg = function (key, opts) {
      return '<div class="seg stk-seg">' + opts.map(function (o) {
        return '<button type="button" class="' + (stock[key] === o[0] ? 'on' : '') + '" data-stk-' + key + '="' + o[0] + '">' + o[1] + '</button>';
      }).join('') + '</div>';
    };
    return '<div class="sec-t">Үнэгүй зураг, видео</div>' +
      seg('src', [['pexels', 'Pexels'], ['pixabay', 'Pixabay']]) +
      seg('type', stock.src === 'pixabay' ? [['photo', 'Зураг'], ['vector', 'Вектор'], ['video', 'Видео']] : [['photo', 'Зураг'], ['video', 'Видео']]) +
      '<form class="stk-form" id="stk-form"><input id="stk-q" type="search" placeholder="Хайх (англиар: coffee, city…)" value="' + esc(stock.q) + '" aria-label="Зураг хайх"><button type="submit" class="btn acc">Хайх</button></form>' +
      '<div id="stk-res"></div>';
  }
  function renderStock() {
    var el = document.getElementById('stk-res'); if (!el) return;
    if (stock.err === 'no_key') { el.innerHTML = '<p class="note">' + (stock.src === 'pexels' ? 'Pexels' : 'Pixabay') + '-ийн API түлхүүр хараахан тохируулагдаагүй байна.</p>'; return; }
    if (stock.err) { el.innerHTML = '<p class="note">Ачаалж чадсангүй. Дахин оролдоно уу.</p>'; return; }
    if (!stock.items.length) { el.innerHTML = stock.loading ? '<p class="note">Хайж байна…</p>' : '<p class="note">Юу ч олдсонгүй. Өөр үгээр (англиар) хайгаад үзээрэй.</p>'; return; }
    el.innerHTML = '<div class="stk-grid">' + stock.items.map(function (it, i) {
      return '<button type="button" class="stk-it' + (it.kind === 'video' ? ' vid' : '') + '" data-stock="' + i + '" title="' + esc((it.alt || '') + ' — ' + (it.author || '')) + '" style="aspect-ratio:' + (it.w && it.h ? Math.max(.6, Math.min(1.8, it.w / it.h)) : 1) + '">' +
        '<img src="' + esc(it.thumb) + '" alt="' + esc(it.alt || it.author || '') + '" loading="lazy" referrerpolicy="no-referrer">' +
        (it.kind === 'video' ? '<span class="stk-dur">▶ ' + (it.dur ? Math.round(it.dur) + 'с' : '') + '</span>' : '') + '</button>';
    }).join('') + '</div>' +
      (stock.items.length < stock.total ? '<button type="button" class="btn full" data-stk-more="1" style="margin-top:8px">' + (stock.loading ? 'Ачаалж байна…' : 'Цааш үзэх') + '</button>' : '') +
      '<p class="note stk-credit">Зураг, видео: <a href="' + (stock.src === 'pexels' ? 'https://www.pexels.com' : 'https://pixabay.com') + '" target="_blank" rel="noopener">' + (stock.src === 'pexels' ? 'Pexels' : 'Pixabay') + '</a> — арилжааны ажилд ч үнэгүй, заавал нэр дурдах шаардлагагүй. Зураг дээр дарахад canvas-д орно.</p>';
  }
  function loadStock(more) {
    if (stock.loading) return;
    if (!more) { stock.page = 1; stock.items = []; stock.total = 0; }
    stock.loading = true; stock.err = ''; renderStock();
    fetch('/api/stock?src=' + stock.src + '&type=' + stock.type + '&q=' + encodeURIComponent(stock.q) + '&page=' + stock.page)
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        if (!x.ok) { stock.err = x.d.error || 'err'; return; }
        stock.items = stock.items.concat(x.d.items || []); stock.total = x.d.total || 0; stock.page++;
      })
      .catch(function () { stock.err = 'net'; })
      .then(function () { stock.loading = false; renderStock(); });
  }
  function proxied(u, dl) { return '/api/stock/file?u=' + encodeURIComponent(u) + (dl ? '&dl=' + encodeURIComponent(dl) : ''); }
  function useStock(it) {
    if (it.kind === 'video') return openStockVideo(it);
    toast('Зураг ачаалж байна…');
    fetch(proxied(it.full)).then(function (r) { if (!r.ok) throw 0; return r.blob(); })
      .then(function (b) { return addImageBlob(b); })
      .catch(function () { toast('Зургийг татаж чадсангүй'); });
  }
  function openStockVideo(it) {
    var m = document.createElement('div');
    m.className = 'stk-modal';
    m.innerHTML = '<div class="stk-box" role="dialog" aria-modal="true" aria-label="Видео">' +
      '<video src="' + esc(proxied(it.preview || it.full)) + '" crossorigin="anonymous" controls autoplay muted loop playsinline></video>' +
      '<div class="stk-bar"><span>' + esc(it.author || '') + ' · ' + (stock.src === 'pexels' ? 'Pexels' : 'Pixabay') + '</span>' +
      '<button type="button" class="btn" data-v="frame">Энэ кадрыг зураг болгох</button>' +
      '<a class="btn-primary" href="' + esc(proxied(it.full || it.preview, 'graphican-' + it.id + '.mp4')) + '" download>Видео татах (HD)</a>' +
      '<button type="button" class="btn" data-v="close" aria-label="Хаах">✕</button></div>' +
      '<p class="note">Editor нь зурган дизайн хийдэг тул видеог бүтнээр нь байршуулахгүй — хүссэн кадраа зураг болгож оруулах эсвэл видеог татаж Reels/монтаждаа ашиглаарай.</p></div>';
    document.body.appendChild(m);
    var v = m.querySelector('video');
    function close() { v.pause(); m.remove(); }
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.closest('[data-v="close"]')) return close();
      if (e.target.closest('[data-v="frame"]')) {
        if (!v.videoWidth) return toast('Видео ачаалагдаж дуусаагүй байна');
        var c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext('2d').drawImage(v, 0, 0);
        c.toBlob(function (b) { if (b) { addImageBlob(b); close(); } }, 'image/jpeg', .92);
      }
    });
    document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
  }

  // ---------- left panel ----------

  var lpTab = 'layers', dragLy = null;
  $('.lp-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]'); if (!b) return;
    lpTab = b.dataset.tab;
    $$('.lp-tabs button').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
    renderLeft();
  });
  function objIcon(o) {
    var k = kindOf(o);
    if (k === 'text') return icon('textI');
    if (k === 'image') return icon('image');
    if (k === 'group') return icon(o.gMaskGroup ? 'maskI' : 'group');
    if (k === 'line') return icon(o.isType('path') ? 'pathI' : 'line');
    return icon(o.isType('ellipse') || o.isType('circle') ? 'ellipse' : o.isType('triangle') ? 'triangle' : o.isType('polygon') ? 'star' : 'shapeI');
  }
  function objName(o) {
    if (kindOf(o) === 'text') return (o.text || '').replace(/\s+/g, ' ').slice(0, 40) || 'Текст';
    return o.name || NAMES[o.type] || 'Зүйл';
  }
  function swRow(list) { return '<div class="sw-row">' + list.map(function (c) { return '<button type="button" class="sw" data-color="' + esc(c) + '" style="background:' + esc(c) + '" title="' + esc(c) + '"></button>'; }).join('') + '</div>'; }
  function renderLeft() {
    var el = $('#lp-body'), h = '';
    if (lpTab === 'layers') {
      var sel = []; eachSel(function (o) { sel.push(o); });
      var all = canvas.getObjects(), row = function (o, d) {
        var idx = all.indexOf(o);
        return '<div class="ly' + (o.isFrame ? ' frame' : '') + (sel.indexOf(o) >= 0 ? ' on' : '') + (o.visible === false ? ' hid' : '') + '" style="--d:' + d + '" data-ly="' + idx + '"' + (o.isFrame ? '' : ' draggable="true"') + '>' +
          '<span class="li">' + (o.isFrame ? icon('frameI') : objIcon(o)) + '</span><span class="ln">' + esc(o.isFrame ? o.name : objName(o)) + '</span>' +
          '<span class="la"><button type="button" class="ib' + (o.locked ? ' on' : '') + '" data-ly-lock="' + idx + '" title="Түгжих">' + icon(o.locked ? 'lock' : 'unlock') + '</button>' +
          '<button type="button" class="ib' + (o.visible === false ? ' on' : '') + '" data-ly-vis="' + idx + '" title="Нуух / харуулах">' + icon(o.visible === false ? 'eyeOff' : 'eye') + '</button></span></div>';
      };
      frames().slice().reverse().forEach(function (f) {
        h += row(f, 0);
        childrenOf(f).reverse().forEach(function (o) { h += row(o, 1); });
      });
      userObjects().filter(function (o) { return !frameOf(o); }).reverse().forEach(function (o) { h += row(o, 0); });
      if (!userObjects().length) h += '<p class="ly-empty">Frame хоосон байна. Доод самбараас текст, хэлбэр, зураг нэмэх эсвэл «Загвар» табаас эхлээрэй.</p>';
      h += '<button type="button" class="btn full" data-a="add-frame" style="margin-top:10px">' + icon('plus') + 'Шинэ frame</button>';
    }
    if (lpTab === 'add') {
      h = '<div class="sec-t">Текст</div>' +
        '<button type="button" class="tx-p h" data-text="h">Гарчиг нэмэх</button><button type="button" class="tx-p s" data-text="s">Дэд гарчиг нэмэх</button><button type="button" class="tx-p b" data-text="b">Энгийн текст нэмэх</button>' +
        '<div class="sec-t">Хэлбэр</div><div class="grid3">' + Object.keys(SHAPE_NAMES).map(function (k) {
          return '<button type="button" class="tile" data-add-shape="' + k + '" title="' + SHAPE_NAMES[k] + '"><svg viewBox="0 0 24 24">' + (k === 'line' ? '<rect x="2" y="11" width="20" height="2.4" rx="1.2"/>' : P[k]) + '</svg></button>';
        }).join('') + '</div>' +
        '<div class="sec-t">Зураг</div><button type="button" class="btn acc full" data-a="upload">' + icon('image') + 'Зураг оруулах</button>' +
        '<p class="note">Зургаа canvas руу чирж тавих эсвэл Ctrl+V-ээр буулгаж болно.</p>' +
        (recent.length ? '<div class="grid3">' + recent.map(function (u, i) { return '<button type="button" class="thumb" data-recent="' + i + '" style="background-image:url(\'' + u + '\')" aria-label="Зураг нэмэх"></button>'; }).join('') + '</div>' : '') +
        '<div class="sec-t">Фонтын хослол <span>Design guide</span></div>' +
        (DG.pairs.length ? DG.pairs.map(function (p, i) {
          return '<button type="button" class="pair" data-pair="' + i + '"><b style="font-family:\'' + esc(fam(p.heading)) + '\'">' + esc(p.heading) + '</b><span style="font-family:\'' + esc(fam(p.body)) + '\'">' + esc(p.body) + (FONTS[p.heading] && FONTS[p.heading].cyr ? ' · Кирилл ✓' : '') + '</span></button>';
        }).join('') : '<p class="note">Ачаалж байна…</p>') +
        '<div class="sec-t">Өнгө <span>сонгосон зүйл / frame</span></div>' +
        swRow(BASE_PALETTE) +
        (prefs.palette && prefs.palette.colors ? '<div class="pal" style="margin-top:8px"><div class="pal-n">Design guide-ээс: ' + esc(prefs.palette.name || '') + '</div>' + swRow(prefs.palette.colors) + '</div>' : '') +
        (DG.brand.length ? '<div class="pal" style="margin-top:8px"><div class="pal-n">Graphican брэнд</div>' + swRow(DG.brand) + '</div>' : '') +
        DG.palettes.map(function (p) { return '<div class="pal"><div class="pal-n">' + esc(p.name) + '</div>' + swRow(p.colors) + '</div>'; }).join('');
      DG.pairs.forEach(function (p) { ensureFont(p.heading); ensureFont(p.body); });
    }
    if (lpTab === 'templates') {
      h = '<div class="sec-t">Шинэ frame</div>' + SIZES.map(function (s) {
          var k = 22 / Math.max(s[1], s[2]);
          return '<button type="button" class="size-row" data-size="' + s[1] + 'x' + s[2] + '"><span class="sz-shape" style="width:' + Math.round(s[1] * k) + 'px;height:' + Math.round(s[2] * k) + 'px"></span><b>' + s[0] + '</b><span>' + s[1] + '×' + s[2] + '</span></button>';
        }).join('') +
        '<div class="sec-t">Загварууд</div><div class="grid2">' + TEMPLATES.map(function (t) {
          var k = 96 / Math.max(t.w, t.h);
          return '<button type="button" class="tpl" data-tpl="' + t.id + '"><span class="tpl-prev" style="width:' + Math.round(t.w * k) + 'px;height:' + Math.round(t.h * k) + 'px;background:' + t.sw[0] + '"><i style="background:' + t.sw[1] + '"></i><i style="background:' + t.sw[2] + '"></i></span><b>' + esc(t.name) + '</b><span>' + t.w + '×' + t.h + '</span></button>';
        }).join('') + '</div><p class="note">Загвар бүр шинэ frame болж нэмэгдэнэ (одоогийн frame хоосон бол түүнийг ашиглана).</p>';
    }
    if (lpTab === 'stock') h = stockPanel();
    el.innerHTML = h;
    if (lpTab === 'stock') { renderStock(); if (!stock.items.length && !stock.loading && !stock.err) loadStock(); }
  }

  $('#lp-body').addEventListener('submit', function (e) {
    if (e.target.id !== 'stk-form') return;
    e.preventDefault(); stock.q = document.getElementById('stk-q').value.trim(); loadStock();
  });
  $('#lp-body').addEventListener('click', function (e) {
    var sk = e.target.closest('[data-stk-src],[data-stk-type],[data-stock],[data-stk-more]');
    if (sk) {
      var sd = sk.dataset;
      if (sd.stkSrc) { stock.src = sd.stkSrc; if (stock.src === 'pexels' && stock.type === 'vector') stock.type = 'photo'; renderLeft(); loadStock(); }
      else if (sd.stkType) { stock.type = sd.stkType; renderLeft(); loadStock(); }
      else if (sd.stkMore) loadStock(true);
      else useStock(stock.items[+sd.stock]);
      return;
    }
    var t = e.target.closest('button,[data-ly]'); if (!t) return;
    var all = canvas.getObjects(), d = t.dataset;
    if (d.lyLock) { var lo = all[+d.lyLock]; lockObj(lo, !lo.locked); canvas.requestRenderAll(); commit(); refreshUI(); return; }
    if (d.lyVis) { var vo = all[+d.lyVis]; vo.visible = vo.visible === false; if (vo.visible === false && active() === vo) canvas.discardActiveObject(); canvas.requestRenderAll(); commit(); refreshUI(); return; }
    if (d.ly) {
      var o = all[+d.ly]; if (!o || o.visible === false) return;
      if (o.isFrame) selectFrame(o); else { canvas.setActiveObject(o); canvas.requestRenderAll(); }
      refreshUI(); return;
    }
    if (d.a === 'add-frame') { var f = addFrame(1080, 1350); fitAll(); selectFrame(f); commit(); refreshUI(); }
    if (d.a === 'upload') $('#ed-file').click();
    if (d.text) addText(d.text);
    if (d.addShape) addShape(d.addShape);
    if (d.recent) addImageUrl(recent[+d.recent]);
    if (d.pair) addPair(DG.pairs[+d.pair]);
    if (d.color) applyColor(d.color);
    if (d.size) { var wh = d.size.split('x'), nf2 = addFrame(+wh[0], +wh[1]); fitFrame(nf2); selectFrame(nf2); commit(); refreshUI(); }
    if (d.tpl) useTemplate(d.tpl);
    $('#lp').classList.remove('open');
  });
  // double-click a layer to rename it
  $('#lp-body').addEventListener('dblclick', function (e) {
    var r = e.target.closest('[data-ly]'); if (!r) return;
    var o = canvas.getObjects()[+r.dataset.ly]; if (!o || kindOf(o) === 'text') return;
    var ln = r.querySelector('.ln'); ln.innerHTML = '<input value="' + esc(o.name || '') + '">';
    var inp = ln.querySelector('input'); inp.focus(); inp.select();
    inp.addEventListener('keydown', function (ev) { ev.stopPropagation(); if (ev.key === 'Enter') inp.blur(); if (ev.key === 'Escape') { inp.value = o.name || ''; inp.blur(); } });
    inp.addEventListener('blur', function () { o.name = inp.value.trim() || o.name; commit(); refreshUI(); canvas.requestRenderAll(); });
  });
  $('#lp-body').addEventListener('dragstart', function (e) { var r = e.target.closest('[data-ly]'); if (!r) return; dragLy = +r.dataset.ly; r.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; });
  $('#lp-body').addEventListener('dragover', function (e) { var r = e.target.closest('[data-ly]'); if (!r || dragLy === null) return; e.preventDefault(); $$('.ly.over').forEach(function (x) { x.classList.remove('over'); }); r.classList.add('over'); });
  $('#lp-body').addEventListener('dragend', function () { dragLy = null; $$('.ly').forEach(function (x) { x.classList.remove('drag', 'over'); }); });
  $('#lp-body').addEventListener('drop', function (e) {
    var r = e.target.closest('[data-ly]'); if (!r || dragLy === null) return;
    e.preventDefault();
    var all = canvas.getObjects(), from = all[dragLy], to = all[+r.dataset.ly];
    if (to.isFrame) { from.setPositionByOrigin(to.getCenterPoint(), 'center', 'center'); from.setCoords(); } // move into that frame
    else canvas.moveTo(from, Math.max(frames().length, all.indexOf(to)));
    dragLy = null; canvas.requestRenderAll(); commit(); refreshUI();
  });

  function applyColor(c) {
    var o = active();
    if (!o || o.isFrame || kindOf(o) === 'image') { setFrameFill(o && o.isFrame ? o : page, c); refreshUI(); return; }
    eachSel(function (x) { if (x.isType('line') || x.isType('path')) x.set('stroke', c); else if (!x.isType('image')) x.set('fill', c); });
    canvas.requestRenderAll(); commit(); refreshUI();
  }

  // ---------- right panel: properties ----------

  var BLENDS = [['source-over', 'Normal'], ['multiply', 'Multiply'], ['screen', 'Screen'], ['overlay', 'Overlay'], ['darken', 'Darken'], ['lighten', 'Lighten'],
    ['color-dodge', 'Color dodge'], ['color-burn', 'Color burn'], ['hard-light', 'Hard light'], ['soft-light', 'Soft light'], ['difference', 'Difference'],
    ['exclusion', 'Exclusion'], ['hue', 'Hue'], ['saturation', 'Saturation'], ['color', 'Color'], ['luminosity', 'Luminosity']];
  var WEIGHTS = [[300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semibold'], [700, 'Bold'], [800, 'Extrabold']];
  var ratioLock = true, expFmt = 'png', expScale = 2;

  function nf(label, p, val, opts) {
    opts = opts || {};
    return '<label class="nf' + (opts.full ? ' full' : '') + '"' + (opts.title ? ' title="' + opts.title + '"' : '') + '><span class="lb" data-scrub="' + p + '">' + label + '</span>' +
      '<input data-p="' + p + '" value="' + esc(val) + '"' + (opts.text ? ' spellcheck="false"' : ' inputmode="decimal"') + '>' + (opts.unit ? '<span class="unit">' + opts.unit + '</span>' : '') + '</label>';
  }
  function colorRow(p, c, rm) {
    var pc = parseCol(c);
    return '<div class="cr"><label class="nf full"><span class="csw"><i style="background:' + esc(c && c !== 'transparent' ? mkCol(pc.hex, pc.a) : 'transparent') + '"></i><input type="color" data-p="' + p + '" value="' + pc.hex + '"></span>' +
      '<input data-p="' + p + 'Hex" value="' + pc.hex.slice(1).toUpperCase() + '" maxlength="7" spellcheck="false"></label>' +
      '<label class="nf op"><input data-p="' + p + 'Op" value="' + Math.round(pc.a * 100) + '" inputmode="decimal"><span class="unit">%</span></label>' +
      (rm ? '<button type="button" class="ib rm" data-a="' + rm + '" title="Хасах">' + icon('minus') + '</button>' : '') + '</div>';
  }
  function seg(items, cur, attr) {
    return '<div class="seg">' + items.map(function (it) {
      return '<button type="button" data-a="' + attr + '" data-v="' + it[0] + '" title="' + it[2] + '"' + (it[0] === cur ? ' class="on"' : '') + '>' + icon(it[1]) + '</button>';
    }).join('') + '</div>';
  }
  function sel(p, items, cur) {
    return '<label class="nf full"><select data-p="' + p + '">' + items.map(function (it) { return '<option value="' + esc(it[0]) + '"' + (String(it[0]) === String(cur) ? ' selected' : '') + '>' + esc(it[1]) + '</option>'; }).join('') + '</select></label>';
  }
  function sl(label, p, min, max, v) { return '<div class="sl"><span>' + label + '</span><input type="range" data-p="' + p + '" min="' + min + '" max="' + max + '" value="' + v + '"><b>' + v + '</b></div>'; }
  function exportSec(kind, o) {
    return '<div class="ps"><div class="ps-h">Export</div><div class="r2">' +
      sel('expScale', [[1, '1×'], [2, '2×'], [3, '3×']], expScale) + sel('expFmt', [['png', 'PNG'], ['jpg', 'JPG'], ['pdf', 'PDF']], expFmt) + '</div>' +
      '<button type="button" class="btn full" style="margin-top:6px" data-a="export-' + kind + '">' + (kind === 'frame' ? 'Export «' + esc((o.name || 'Frame').slice(0, 20)) + '»' : 'Сонгосныг export хийх') + '</button></div>';
  }
  function geom(o) {
    var f = frameOf(o), b = o.getBoundingRect(true, true);
    return { x: Math.round(b.left - (f ? f.left : 0)), y: Math.round(b.top - (f ? f.top : 0)), w: Math.round(o.width * o.scaleX), h: Math.round(o.height * o.scaleY), r: Math.round(o.angle || 0) };
  }
  function alignBtns() {
    var b = function (a) { return '<button type="button" data-a="align" data-v="' + a[0] + '" title="' + a[2] + '">' + icon(a[1]) + '</button>'; };
    return '<div class="rowf"><div class="seg" style="flex:1">' + [['L', 'aL', 'Зүүн'], ['C', 'aC', 'Хэвтээ голлуулах'], ['R', 'aR', 'Баруун']].map(b).join('') + '</div>' +
      '<div class="seg" style="flex:1">' + [['T', 'aT', 'Дээд'], ['M', 'aM', 'Босоо голлуулах'], ['B', 'aB', 'Доод']].map(b).join('') + '</div></div>';
  }

  function renderRight() {
    var el = $('#rp-body'), o = active(), k = kindOf(o), h = '';
    if (crop) { el.innerHTML = '<p class="empty-sel">Тайралтын хүрээг чирж тохируулаад доод талын <b>Тайрах</b> товч эсвэл Enter дарна. Болих бол Esc.</p>'; return; }
    if (!o || k === 'frame') {
      var f = o || page; if (!f) { el.innerHTML = ''; return; }
      if (!o) h += '<p class="empty-sel" style="padding-bottom:0">Юу ч сонгоогүй — одоогийн frame:</p>';
      h += '<div class="ps"><div class="ps-h">Frame<span class="acts">' +
          '<button type="button" class="ib" data-a="dup" title="Хувилах (Ctrl+D)">' + icon('copy') + '</button>' +
          '<button type="button" class="ib" data-a="del" title="Устгах">' + icon('trash') + '</button></span></div>' +
        nf('Aa', 'fname', f.name || '', { full: true, text: true }) +
        '<div class="ps-l">Хэмжээ</div>' + sel('fpreset', [['', 'Бэлэн хэмжээ…']].concat(SIZES.map(function (s) { return [s[1] + 'x' + s[2], s[0] + ' — ' + s[1] + '×' + s[2]]; })), '') +
        '<div class="r2" style="margin-top:6px">' + nf('W', 'fw', Math.round(fw(f))) + nf('H', 'fh', Math.round(fh(f))) + '</div>' +
        '<div class="ps-l">Байрлал</div><div class="r2">' + nf('X', 'fx', Math.round(f.left)) + nf('Y', 'fy', Math.round(f.top)) + '</div></div>' +
        '<div class="ps"><div class="ps-h">Fill</div>' + (f.gTransparent ? '' : colorRow('ffill', frameFill(f))) +
        '<label class="chk" style="margin-top:8px"><input type="checkbox" data-p="ftr"' + (f.gTransparent ? ' checked' : '') + '> Тунгалаг дэвсгэр (PNG)</label></div>' +
        exportSec('frame', f);
      el.innerHTML = h; return;
    }
    var g = geom(o), title = k === 'multi' ? o.getObjects().length + ' зүйл' : objName(o);
    h += '<div class="ps"><div class="ps-h">' + esc(title.slice(0, 26)) + '<span class="acts">' +
      '<button type="button" class="ib' + (o.locked ? ' on' : '') + '" data-a="lock" title="Түгжих">' + icon(o.locked ? 'lock' : 'unlock') + '</button>' +
      '<button type="button" class="ib" data-a="dup" title="Хувилах (Ctrl+D)">' + icon('copy') + '</button>' +
      '<button type="button" class="ib" data-a="del" title="Устгах (Delete)">' + icon('trash') + '</button></span></div>' +
      '<div class="ps-l" style="margin-top:0">' + (k === 'multi' ? 'Хооронд нь зэрэгцүүлэх' : 'Frame дотор зэрэгцүүлэх') + '</div>' + alignBtns() +
      (k === 'multi' ? '<div class="rowf" style="margin-top:6px"><button type="button" class="btn" style="flex:1" data-a="dist" data-v="H">' + icon('dH') + 'Хэвтээ тараах</button><button type="button" class="btn" style="flex:1" data-a="dist" data-v="V">' + icon('dV') + 'Босоо</button></div>' +
        '<div class="r2" style="margin-top:6px"><button type="button" class="btn acc" data-a="group">' + icon('group') + 'Бүлэглэх</button><button type="button" class="btn" data-b="mask" title="Хамгийн доод давхарга нь маск болно (Ctrl+Alt+M)">' + icon('maskI') + 'Маск болгох</button></div>' +
        '<div class="ps-l">Хэлбэрүүдийг нэгтгэх</div><div class="seg bool-seg">' + [['union', 'bUnion', 'Нэгтгэх'], ['subtract', 'bSub', 'Хасах'], ['intersect', 'bInt', 'Огтлол'], ['exclude', 'bExc', 'Давхцал']].map(function (b) {
          return '<button type="button" data-b="bool:' + b[0] + '" title="' + b[2] + '">' + icon(b[1]) + '<span>' + b[2] + '</span></button>'; }).join('') + '</div>' : '') +
      (k === 'group' && !o.gMaskGroup ? '<button type="button" class="btn full" style="margin-top:6px" data-a="ungroup">' + icon('group') + 'Задлах (Ctrl+Shift+G)</button>' : '') +
      (k === 'group' && o.gMaskGroup ? '<div class="ps-l">Маск · «' + esc(o.gMaskGroup.name || '') + '»</div><label class="chk"><input type="checkbox" data-p="maskinv"' + (o.clipPath && o.clipPath.inverted ? ' checked' : '') + '> Урвуу маск (хэлбэрийн гадна талыг харуулах)</label>' +
        '<button type="button" class="btn full" style="margin-top:6px" data-b="unmask">' + icon('maskI') + 'Маскыг задлах</button>' : '') +
      (k === 'shape' && boolable(o) && !o.isType('path') ? '<button type="button" class="btn full" style="margin-top:6px" data-b="tovec">' + icon('penTool') + 'Вектор болгох (цэгийг засах)</button>' : '') +
      (o.isType && o.isType('path') && k !== 'multi' ? '<button type="button" class="btn full' + (vedit ? ' acc' : '') + '" style="margin-top:6px" data-b="vedit">' + icon('penTool') + (vedit ? 'Цэг засахаа дуусгах' : 'Цэгүүдийг засах (давхар дарах)') + '</button>' : '') +
      '</div>';
    // position + layout
    h += '<div class="ps"><div class="ps-l" style="margin-top:0">Байрлал</div><div class="r2">' + nf('X', 'x', g.x) + nf('Y', 'y', g.y) + '</div>' +
      '<div class="r3" style="margin-top:6px">' + nf(icon('angle'), 'rot', g.r, { unit: '°', title: 'Эргэлт' }) +
        '<button type="button" class="ib" data-a="rot90" title="90° эргүүлэх">' + icon('rotate') + '</button>' +
        '<span class="rowf"><button type="button" class="ib" data-a="flipX" title="Хэвтээ толин тусгал">' + icon('flipH') + '</button><button type="button" class="ib" data-a="flipY" title="Босоо толин тусгал">' + icon('flipV') + '</button></span></div>' +
      '<div class="ps-l">Хэмжээ</div><div class="r3">' + nf('W', 'w', g.w) + nf('H', 'h', g.h) +
        '<button type="button" class="ib' + (ratioLock ? ' on' : '') + '" data-a="ratio" title="Харьцаа хадгалах">' + icon('ratio') + '</button></div></div>';
    // appearance
    var radius = null;
    if (o.isType('rect')) radius = Math.round((o.rx || 0) * (o.scaleX || 1));
    if (o.isType('triangle') || o.type === 'polygon') radius = Math.round((o.gRound || 0) * (o.scaleX || 1));
    if (k === 'image') radius = o.gMask === 'rounded' ? Math.round(o.gMaskR != null ? o.gMaskR : Math.min(o.width, o.height) * 0.12 * o.scaleX) : 0;
    h += '<div class="ps"><div class="ps-h">Харагдац</div><div class="r2">' + nf(icon('opacity'), 'op', Math.round((o.opacity == null ? 1 : o.opacity) * 100), { unit: '%', title: 'Тунгалаг байдал' }) +
      (radius !== null ? nf(icon('radius'), 'rad', radius, { title: 'Булангийн радиус' }) : '<span></span>') + '</div>' +
      '<div style="margin-top:6px">' + sel('blend', BLENDS, o.globalCompositeOperation || 'source-over') + '</div></div>';
    // text
    if (k === 'text') {
      var fnames = Object.keys(FONTS).sort(function (a, b) { return (FONTS[b].cyr ? 1 : 0) - (FONTS[a].cyr ? 1 : 0) || a.localeCompare(b); });
      var curF = primary(o.fontFamily), match = fnames.filter(function (n) { return fam(n) === curF; })[0];
      var styleOn = +o.fontWeight >= 600 || o.fontWeight === 'bold' ? 'b' : o.fontStyle === 'italic' ? 'i' : o.underline ? 'u' : o.linethrough ? 's' : '';
      h += '<div class="ps"><div class="ps-h">Текст</div>' +
        sel('font', (match ? [] : [[curF, curF]]).concat(fnames.map(function (n) { return [n, n + (FONTS[n].cyr ? '  · Кирилл' : '')]; })), match || curF) +
        '<div class="r2" style="margin-top:6px">' + sel('weight', WEIGHTS, o.fontWeight === 'bold' ? 700 : o.fontWeight === 'normal' ? 400 : +o.fontWeight) + nf('px', 'size', Math.round(o.fontSize * (o.scaleY || 1)), { title: 'Үсгийн хэмжээ' }) + '</div>' +
        '<div class="r2" style="margin-top:6px">' + nf('↕', 'lh', Math.round((o.lineHeight || 1.16) * 100), { unit: '%', title: 'Мөр хоорондын зай' }) + nf('↔', 'ls', Math.round(o.charSpacing || 0), { title: 'Үсэг хоорондын зай' }) + '</div>' +
        '<div class="rowf" style="margin-top:6px">' + seg([['left', 'tL', 'Зүүн'], ['center', 'tC', 'Голлуулах'], ['right', 'tR', 'Баруун'], ['justify', 'tJ', 'Тэгшлэх']], o.textAlign, 'talign') +
          seg([['b', 'bold', 'Тод'], ['i', 'italic', 'Налуу'], ['u', 'underline', 'Доогуур зураас'], ['s', 'strike', 'Дундуур зураас']], styleOn, 'tstyle') + '</div>' +
        '<div class="rowf" style="margin-top:6px"><button type="button" class="btn" style="flex:1" data-a="case" data-v="up">AA</button><button type="button" class="btn" style="flex:1" data-a="case" data-v="low">aa</button><button type="button" class="btn" style="flex:1" data-a="case" data-v="title">Aa</button></div></div>';
    }
    // image
    if (k === 'image') {
      var cur = presetOf(o), gv = function (T, key) { var ff = getFilter(o, T); return ff ? ff[key] : 0; };
      h += '<div class="ps"><div class="ps-h">Зураг</div>' +
        '<div class="r2"><button type="button" class="btn" data-a="crop">' + icon('crop') + 'Тайрах</button><button type="button" class="btn acc" data-a="rmbg">' + icon('wand') + 'Дэвсгэр арилгах</button></div>' +
        '<button type="button" class="btn full" style="margin-top:6px" data-b="cut">' + icon('eraser') + 'Гараар засах (баллуур, саваа, лассо)</button>' +
        '<div class="ps-l">Маск хэлбэр</div>' + sel('mask', MASK_SHAPES, o.gMask || 'none') +
        '<div class="r2" style="margin-top:6px"><button type="button" class="btn" data-a="asbg">' + icon('bg') + 'Frame дүүргэх</button><button type="button" class="btn acc" data-b="upx">✦ AI сайжруулах</button></div>' +
        '<div class="ps-l">Шүүлтүүр</div><div class="pre-grid">' + PRESETS.map(function (p) {
          return '<button type="button" class="pre' + (p[0] === cur ? ' on' : '') + '" data-a="preset" data-v="' + p[0] + '"><i class="pre-' + p[0] + '" style="background-image:url(\'' + o.getSrc() + '\')"></i>' + p[1] + '</button>';
        }).join('') + '</div>' +
        sl('Гэрэлтэлт', 'f-bri', -100, 100, Math.round(gv(F.Brightness, 'brightness') * 100)) + sl('Контраст', 'f-con', -100, 100, Math.round(gv(F.Contrast, 'contrast') * 100)) +
        sl('Ханалт', 'f-sat', -100, 100, Math.round(gv(F.Saturation, 'saturation') * 100)) + sl('Өнгөний тон', 'f-hue', -100, 100, Math.round(gv(F.HueRotation, 'rotation') * 100)) +
        sl('Бүдгэрүүлэх', 'f-blur', 0, 100, Math.round(gv(F.Blur, 'blur') * 100)) +
        '<button type="button" class="btn full" style="margin-top:8px" data-a="resetf">Анхны байдалд нь</button></div>';
    }
    // fill
    var closedPath = o.isType && o.isType('path') && (o.gPen ? o.gPen.closed : (o.path || []).some(function (c) { return c[0] === 'Z' || c[0] === 'z'; }));
    if (k === 'shape' || k === 'text' || closedPath) h += '<div class="ps"><div class="ps-h">Fill' + (o.fill ? '' : '<span class="acts"><button type="button" class="ib" data-a="addfill" title="Нэмэх">' + icon('plus') + '</button></span>') + '</div>' + (o.fill ? paintUI('fill', o) : '') + '</div>';
    // stroke
    if (k !== 'multi' && k !== 'group') {
      var hasStroke = !!o.stroke && (o.strokeWidth > 0 || k === 'line');
      h += '<div class="ps"><div class="ps-h">' + (k === 'text' ? 'Хүрээ (outline)' : 'Stroke') + '<span class="acts">' + (hasStroke ? (k === 'line' ? '' : '<button type="button" class="ib" data-a="rmstroke" title="Stroke хасах">' + icon('minus') + '</button>') : '<button type="button" class="ib" data-a="addstroke" title="Нэмэх">' + icon('plus') + '</button>') + '</span></div>' +
        (hasStroke ? paintUI('stroke', o) + strokeUI(o, k) : '') + '</div>';
    }
    // effects
    if (k !== 'multi') h += fxUI(o);
    if (k === 'text') h += '<div class="ps"><label class="chk"><input type="checkbox" data-p="tbg"' + (o.textBackgroundColor ? ' checked' : '') + '> Текстийн ард дэвсгэр өнгө</label>' + (o.textBackgroundColor ? '<div style="margin-top:6px">' + colorRow('tbgc', o.textBackgroundColor) + '</div>' : '') + '</div>';
    // layer order
    h += '<div class="ps"><div class="ps-h">Давхаргын дараалал</div><div class="seg">' +
      [['top', 'up2', 'Хамгийн урд (Ctrl+Shift+])'], ['up', 'up1', 'Урагш (Ctrl+])'], ['down', 'dn1', 'Хойш (Ctrl+[)'], ['bottom', 'dn2', 'Хамгийн ард (Ctrl+Shift+[)']].map(function (a) {
        return '<button type="button" data-a="arr" data-v="' + a[0] + '" title="' + a[2] + '">' + icon(a[1]) + '</button>';
      }).join('') + '</div></div>';
    h += exportSec('sel', o);
    el.innerHTML = h;
  }

  // live geometry while dragging on the canvas
  function syncGeom() {
    var o = active(); if (!o || o.isFrame) return;
    var g = geom(o);
    [['x', g.x], ['y', g.y], ['w', g.w], ['h', g.h], ['rot', g.r]].forEach(function (p) {
      var i = $('#rp-body [data-p="' + p[0] + '"]'); if (i && document.activeElement !== i) i.value = p[1];
    });
  }

  function num(v) { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; }
  // colour inputs come as three fields: picker, HEX and opacity
  function colorFrom(p, base, v, prev) {
    var pc = parseCol(prev && typeof prev === 'string' ? prev : '#000000');
    if (p === base) return mkCol(v, pc.a);
    if (p === base + 'Hex') {
      var hx = String(v).replace(/[^0-9a-f]/gi, '');
      if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2];
      return hx.length === 6 ? mkCol('#' + hx.toLowerCase(), pc.a) : prev;
    }
    if (p === base + 'Op') { var a = num(v); return a === null ? prev : mkCol(pc.hex, clamp(a, 0, 100) / 100); }
    return prev;
  }
  function propInput(p, v) {
    var o = active(), f = o && o.isFrame ? o : page, n = num(v);
    if (p === 'expScale') { expScale = +v; return; }
    if (p === 'expFmt') { expFmt = v; return; }
    if (p === 'fname') { f.name = v; canvas.requestRenderAll(); return; }
    if ((p === 'fw' || p === 'fh') && n > 0) { f.set(p === 'fw' ? { width: n } : { height: n }); f.setCoords(); setCurrent(f); canvas.requestRenderAll(); return; }
    if ((p === 'fx' || p === 'fy') && n !== null) { moveFrame(f, p === 'fx' ? n - f.left : 0, p === 'fy' ? n - f.top : 0); canvas.requestRenderAll(); return; }
    if (p === 'fpreset') { if (v) { var wh = v.split('x'); f.set({ width: +wh[0], height: +wh[1] }); f.setCoords(); setCurrent(f); fitFrame(f); canvas.requestRenderAll(); } return; }
    if (p === 'ftr') { setFrameFill(f, v ? 'transparent' : '#ffffff'); return; }
    if (/^ffill/.test(p)) { setFrameFill(f, colorFrom(p, 'ffill', v, frameFill(f))); return; }
    if (!o || o.isFrame) return;
    var g = geom(o);
    if ((p === 'x' || p === 'y') && n !== null) o.set(p === 'x' ? { left: o.left + n - g.x } : { top: o.top + n - g.y });
    if (p === 'rot' && n !== null) o.rotate(n);
    if ((p === 'w' || p === 'h') && n > 0) {
      if (kindOf(o) === 'text' && p === 'w') { o.set({ width: n / (o.scaleX || 1) }); o.initDimensions(); }
      else {
        var sx = p === 'w' ? n / o.width : o.scaleX, sy = p === 'h' ? n / (o.height || 1) : o.scaleY;
        if (ratioLock) { if (p === 'w') sy = o.scaleY * (sx / o.scaleX); else sx = o.scaleX * (sy / o.scaleY); }
        o.set({ scaleX: sx, scaleY: sy });
      }
    }
    if (p === 'op' && n !== null) eachSel(function (x) { x.set('opacity', clamp(n, 0, 100) / 100); });
    if (p === 'rad' && n !== null) {
      if (o.isType('rect')) o.set({ rx: Math.max(0, n) / (o.scaleX || 1), ry: Math.max(0, n) / (o.scaleY || 1) });
      if (o.isType('triangle') || o.type === 'polygon') o.set({ gRound: Math.max(0, n) / (o.scaleX || 1), dirty: true });
      if (kindOf(o) === 'image') fitMask(o, n > 0 ? 'rounded' : null, n);
    }
    if (p === 'blend') eachSel(function (x) { x.set('globalCompositeOperation', v); });
    if (p === 'font') { ensureFont(v).then(function () { eachSel(function (x) { if (x.isType('textbox')) { x.set('fontFamily', stack(v)); refreshText(x); } }); commit(); }); return; }
    var tx = function (fn) { eachSel(function (x) { if (x.isType('textbox')) { fn(x); x.initDimensions(); } }); };
    if (p === 'weight') tx(function (x) { x.set('fontWeight', +v); });
    if (p === 'size' && n > 0) tx(function (x) { x.set('fontSize', n / (x.scaleY || 1)); });
    if (p === 'lh' && n > 0) tx(function (x) { x.set('lineHeight', n / 100); });
    if (p === 'ls' && n !== null) tx(function (x) { x.set('charSpacing', n); });
    if (/^fill/.test(p)) eachSel(function (x) { x.set('fill', colorFrom(p, 'fill', v, x.fill)); });
    if (/^stroke/.test(p)) eachSel(function (x) { x.set('stroke', colorFrom(p, 'stroke', v, x.stroke)); });
    if (p === 'sw' && n !== null) eachSel(function (x) { x.set({ strokeWidth: Math.max(0, n) }); if (x.isType('textbox')) { x.set({ paintFirst: 'stroke', strokeUniform: true }); x.initDimensions(); } });
    if ((p === 'shx' || p === 'shy' || p === 'shb') && n !== null) eachSel(function (x) { if (x.shadow) { x.shadow[{ shx: 'offsetX', shy: 'offsetY', shb: 'blur' }[p]] = n; x.set('dirty', true); } });
    if (/^shc/.test(p)) eachSel(function (x) { if (x.shadow) { x.shadow.color = colorFrom(p, 'shc', v, x.shadow.color); x.set('dirty', true); } });
    if (p === 'maskinv' && o.clipPath) { o.clipPath.inverted = !!v; o.set('dirty', true); }
    if (p === 'tbg') eachSel(function (x) { x.set('textBackgroundColor', v ? '#e7e3fd' : ''); });
    if (/^tbgc/.test(p)) eachSel(function (x) { x.set('textBackgroundColor', colorFrom(p, 'tbgc', v, x.textBackgroundColor)); });
    if (p === 'mask') { if (!extraMask(o, v)) fitMask(o, v === 'none' ? null : v); }
    if (/^f-/.test(p) && n !== null) {
      var map = { 'f-bri': [F.Brightness, 'brightness'], 'f-con': [F.Contrast, 'contrast'], 'f-sat': [F.Saturation, 'saturation'], 'f-hue': [F.HueRotation, 'rotation'], 'f-blur': [F.Blur, 'blur'] }[p];
      setFilter(o, map[0], map[1], n / 100, 0);
    }
    o.setCoords(); canvas.requestRenderAll();
  }

  var rp = $('#rp-body');
  // a11y: give every unlabeled input/select in the properties panel an accessible name
  var P_LABELS = { fname: 'Frame-ийн нэр', ffillHex: 'Дэвсгэр өнгө (HEX)', fpreset: 'Бэлэн хэмжээ', expScale: 'Export хэмжээ', expFmt: 'Export формат' };
  function labelFields() {
    rp.querySelectorAll('input, select').forEach(function (el) {
      if (el.getAttribute('aria-label')) return;
      var k = el.getAttribute('data-p') || '', prev = el.previousElementSibling;
      el.setAttribute('aria-label', P_LABELS[k] || (prev && prev.textContent.trim()) || el.getAttribute('placeholder') || k || 'Тохиргоо');
    });
  }
  new MutationObserver(labelFields).observe(rp, { childList: true, subtree: true });
  labelFields(); setTimeout(labelFields, 0); window.addEventListener('load', labelFields);
  // sliders, colour pickers and the frame name apply live; number fields on Enter / blur / arrows / scrubbing
  rp.addEventListener('input', function (e) {
    var t = e.target, p = t.dataset.p; if (!p) return;
    if (t.type === 'range') { t.nextElementSibling.textContent = t.value; propInput(p, t.value); }
    else if (t.type === 'color') { t.previousElementSibling.style.background = t.value; propInput(p, t.value); }
    else if (p === 'fname') propInput(p, t.value);
  });
  rp.addEventListener('change', function (e) {
    var t = e.target, p = t.dataset.p; if (!p) return;
    propInput(p, t.type === 'checkbox' ? t.checked : t.value);
    commit();
    if (t.tagName === 'SELECT' || t.type === 'checkbox' || /Hex$|Op$/.test(p) || t.type === 'color' || p === 'fname') refreshUI();
    else renderLeft();
  });
  rp.addEventListener('keydown', function (e) {
    var t = e.target; if (t.tagName !== 'INPUT') return;
    e.stopPropagation();
    if (e.key === 'Enter') { t.blur(); return; }
    if (e.key === 'Escape') { t.blur(); return; }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && t.getAttribute('inputmode') === 'decimal') {
      e.preventDefault();
      var n2 = (num(t.value) || 0) + (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1);
      t.value = n2; propInput(t.dataset.p, n2); commit();
    }
  });
  // drag a field's label left/right to change the number (Figma "scrubbing")
  var scrub = null;
  rp.addEventListener('mousedown', function (e) {
    var lb = e.target.closest('[data-scrub]'); if (!lb) return;
    var inp = lb.parentNode.querySelector('input'); if (!inp || inp.getAttribute('inputmode') !== 'decimal') return;
    e.preventDefault();
    scrub = { inp: inp, x: e.clientX, v: num(inp.value) || 0 };
    document.body.style.cursor = 'ew-resize';
  });
  window.addEventListener('mousemove', function (e) {
    if (!scrub) return;
    var v = Math.round(scrub.v + (e.clientX - scrub.x) * (e.shiftKey ? 10 : 1));
    scrub.inp.value = v; propInput(scrub.inp.dataset.p, v);
  });
  window.addEventListener('mouseup', function () { if (scrub) { scrub = null; document.body.style.cursor = ''; commit(); refreshUI(); } });

  function textEach(fn) { eachSel(function (x) { if (x.isType('textbox')) { fn(x); x.initDimensions(); } }); }
  rp.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.dataset.a, v = b.dataset.v, o = active();
    if (a === 'dup') duplicate();
    else if (a === 'del') { if (!o) selectFrame(page); removeSel(); }
    else if (a === 'lock' && o) { var on = !o.locked; eachSel(function (x) { lockObj(x, on); }); if (o.type === 'activeSelection') o.locked = on; commit(); }
    else if (a === 'align') align(v);
    else if (a === 'dist') distribute(v);
    else if (a === 'group') groupSel();
    else if (a === 'ungroup') ungroupSel();
    else if (a === 'rot90' && o) rotate90(o);
    else if (a === 'flipX' && o) { eachSel(function (x) { x.set('flipX', !x.flipX); }); commit(); }
    else if (a === 'flipY' && o) { eachSel(function (x) { x.set('flipY', !x.flipY); }); commit(); }
    else if (a === 'ratio') ratioLock = !ratioLock;
    else if (a === 'talign') { textEach(function (x) { x.set('textAlign', v); }); commit(); }
    else if (a === 'tstyle') {
      textEach(function (x) {
        if (v === 'b') x.set('fontWeight', +x.fontWeight >= 600 || x.fontWeight === 'bold' ? 400 : 700);
        if (v === 'i') x.set('fontStyle', x.fontStyle === 'italic' ? 'normal' : 'italic');
        if (v === 'u') x.set('underline', !x.underline);
        if (v === 's') x.set('linethrough', !x.linethrough);
      });
      commit();
    }
    else if (a === 'case') {
      textEach(function (x) {
        x.set('text', v === 'up' ? x.text.toUpperCase() : v === 'low' ? x.text.toLowerCase() : x.text.toLowerCase().replace(/(^|\s)(\S)/g, function (m, s1, c) { return s1 + c.toUpperCase(); }));
      });
      commit();
    }
    else if (a === 'crop') startCrop();
    else if (a === 'rmbg' && o) { b.disabled = true; removeBackground(o); return; }
    else if (a === 'asbg') setAsBackground();
    else if (a === 'upscale' && o) { sendObject(o, 'upscale'); return; }
    else if (a === 'preset' && o) setPreset(o, v);
    else if (a === 'resetf' && o) { o.filters = []; o.applyFilters(); commit(); }
    else if (a === 'addstroke') {
      eachSel(function (x) {
        var t = x.isType('textbox');
        x.set({ stroke: t ? '#000000' : '#1e1e1e', strokeWidth: t ? 4 : 2 });
        if (t) { x.set({ paintFirst: 'stroke', strokeUniform: true }); x.initDimensions(); }
      });
      commit();
    }
    else if (a === 'rmstroke') { eachSel(function (x) { x.set({ stroke: null, strokeWidth: 0, gPaintS: null, gStrokePos: null, dirty: true }); }); commit(); }
    else if (a === 'addfill') { eachSel(function (x) { x.set({ fill: '#816dfb', gPaint: null }); }); commit(); }
    else if (a === 'addshadow') { eachSel(function (x) { x.set('shadow', new fabric.Shadow({ color: 'rgba(0,0,0,0.35)', blur: Math.round(Math.min(W, H) * 0.02), offsetX: 0, offsetY: Math.round(Math.min(W, H) * 0.01) })); }); commit(); }
    else if (a === 'rmshadow') { eachSel(function (x) { x.set('shadow', null); }); commit(); }
    else if (a === 'arr') arrange(v);
    else if (a === 'export-frame') { exportFrames([o && o.isFrame ? o : page]); return; }
    else if (a === 'export-sel' && o) { exportSelection(o); return; }
    canvas.requestRenderAll();
    refreshUI();
  });

  // ---------- contextual bar above the dock ----------

  function renderCtxbar() {
    var el = $('#ctxbar'), o = active(), k = kindOf(o), h = '';
    var btn = function (a, ic, label, title, extra) { return '<button type="button" class="tool' + (extra || '') + '" data-c="' + a + '" title="' + (title || label) + '">' + icon(ic) + (label ? '<span>' + label + '</span>' : '') + '</button>'; };
    if (crop) h = '<span class="ctx-lbl">Хүрээг чирж тохируулна</span><span class="sep"></span>' + btn('crop-ok', 'check', 'Тайрах', 'Enter', ' ok') + btn('crop-cancel', 'minus', 'Болих', 'Esc');
    else if (tool === 'vector') {
      h = '<span class="ctx-lbl">Дарах = цэг · чирэх = муруй · эхний цэгийг дарж хаана · давхар дарах / Enter = дуусгах</span><span class="sep"></span>' +
        btn('pen-close', 'check', 'Хаах', 'Хэлбэр болгож хаах', ' ok') + btn('pen-done', 'minus', 'Нээлттэй дуусгах', 'Enter');
    }
    else if (vedit) {
      h = '<span class="ctx-lbl">Цэг засах: чирэх · Alt+дарах муруй⇄булан · давхар дарах цэг нэмэх · Delete устгах</span><span class="sep"></span>' + btn('vedit-done', 'check', 'Дуусгах', 'Esc', ' ok');
    }
    else if (tool === 'draw') {
      var cols = [draw.color].concat(DG.brand.slice(0, 3), ['#1e1e1e', '#ffffff', '#ff4fd8']).filter(function (c, i, a) { return c && a.indexOf(c) === i; }).slice(0, 7);
      h = BRUSHES.map(function (t) {
          return '<button type="button" class="tool' + (draw.tool === t[0] ? ' on' : '') + '" data-draw="' + t[0] + '" title="' + t[2] + '">' + icon(t[1]) + '</button>';
        }).join('') + '<span class="sep"></span>' +
        cols.map(function (c) { return '<button type="button" class="tool" data-dcol="' + esc(c) + '" title="' + esc(c) + '"><span class="sw" style="background:' + esc(c) + ';' + (c === draw.color ? 'box-shadow:0 0 0 2px var(--acc)' : '') + '"></span></button>'; }).join('') +
        '<label class="tool" title="Өөр өнгө"><span class="csw" style="margin:0"><i style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"></i><input type="color" data-dpick value="' + draw.color + '"></span></label>' +
        '<span class="sep"></span><span class="ctx-lbl">Зузаан</span><input type="range" data-dsize min="1" max="' + Math.max(20, Math.round(Math.min(W, H) * 0.08)) + '" value="' + brushSize() + '" style="width:80px">' +
        '<span class="ctx-lbl">Тунгалаг</span><input type="range" data-dop min="10" max="100" value="' + Math.round((draw.op == null ? 1 : draw.op) * 100) + '" style="width:60px">' +
        '<span class="sep"></span>' + btn('draw-done', 'check', 'Дуусгах', 'Esc', ' ok');
    } else if (k === 'image') {
      h = btn('crop', 'crop', 'Тайрах') + btn('rmbg', 'wand', 'Дэвсгэр арилгах') + btn('cut', 'eraser', 'Гараар засах', 'Баллуур, сэргээх, шидэт саваа, лассо') + btn('upx', 'wand', '✦ Сайжруулах', 'AI томруулж чанарыг сайжруулах') + '<span class="sep"></span>' + btn('asbg', 'bg', '', 'Frame-ийг дүүргэх') +
        btn('rot90', 'rotate', '', '90° эргүүлэх') + btn('flipX', 'flipH', '', 'Хэвтээ толин тусгал') + btn('flipY', 'flipV', '', 'Босоо толин тусгал');
    } else if (k === 'multi') {
      h = btn('group', 'group', 'Бүлэглэх', 'Ctrl+G') + btn('mask', 'maskI', 'Маск', 'Доод давхаргаар маск хийх (Ctrl+Alt+M)') + '<span class="sep"></span>' +
        btn('b-union', 'bUnion', '', 'Нэгтгэх (Union)') + btn('b-subtract', 'bSub', '', 'Хасах (Subtract)') + btn('b-intersect', 'bInt', '', 'Огтлолцол (Intersect)') + btn('b-exclude', 'bExc', '', 'Давхцлыг хасах (Exclude)') + '<span class="sep"></span>' + btn('alignL', 'aL', '', 'Зүүн') + btn('alignC', 'aC', '', 'Голлуулах') + btn('alignR', 'aR', '', 'Баруун') +
        btn('alignT', 'aT', '', 'Дээд') + btn('alignM', 'aM', '', 'Дунд') + btn('alignB', 'aB', '', 'Доод');
    }
    el.innerHTML = h; el.hidden = !h;
  }
  $('#ctxbar').addEventListener('click', function (e) {
    var d = e.target.closest('[data-draw]'); if (d) { draw.tool = d.dataset.draw; applyBrush(); renderCtxbar(); return; }
    var dc = e.target.closest('[data-dcol]'); if (dc) { draw.color = dc.dataset.dcol; applyBrush(); renderCtxbar(); return; }
    var b = e.target.closest('[data-c]'); if (!b) return;
    var c = b.dataset.c, o = active();
    if (c === 'crop-ok') endCrop(true);
    if (c === 'crop-cancel') endCrop(false);
    if (c === 'draw-done') setTool('move');
    if (c === 'pen-close') { penFinish(true); setTool('move'); return; }
    if (c === 'pen-done') { setTool('move'); return; }
    if (c === 'vedit-done') { endVEdit(); return; }
    if (c === 'mask') { makeMask(); return; }
    if (/^b-/.test(c)) { booleanOp(c.slice(2)); return; }
    if (c === 'cut' && o) { openCutout(o); return; }
    if (c === 'upx' && o) { openUpscale(o); return; }
    if (c === 'crop') startCrop();
    if (c === 'rmbg' && o) { b.disabled = true; removeBackground(o).then(function () { b.disabled = false; }); return; }
    if (c === 'asbg') setAsBackground();
    if (c === 'rot90' && o) rotate90(o);
    if (c === 'flipX' && o) { o.set('flipX', !o.flipX); commit(); }
    if (c === 'flipY' && o) { o.set('flipY', !o.flipY); commit(); }
    if (c === 'group') groupSel();
    if (/^align/.test(c)) align(c.slice(5));
    canvas.requestRenderAll(); refreshUI();
  });
  $('#ctxbar').addEventListener('input', function (e) {
    if (e.target.hasAttribute('data-dsize')) { draw.size = +e.target.value; applyBrush(); }
    if (e.target.hasAttribute('data-dop')) { draw.op = +e.target.value / 100; applyBrush(); }
    if (e.target.hasAttribute('data-dpick')) { draw.color = e.target.value; applyBrush(); }
  });
  $('#ctxbar').addEventListener('change', function (e) { if (e.target.hasAttribute('data-dpick')) renderCtxbar(); });

  // ---------- export ----------

  function renderRegion(l, t, w, h, mult, opaque, hideFrames, only) {
    canvas.discardActiveObject();
    var vpt = canvas.viewportTransform.slice(), bg = canvas.backgroundColor, saved = [], hidden = [];
    // like Figma: a frame exports only its own layers, not ones spilling over from a neighbour
    if (only) userObjects().forEach(function (o) { if (o.visible !== false && frameOf(o) !== only) { o.visible = false; hidden.push(o); } });
    exporting = true; canvas.backgroundColor = null;
    frames().forEach(function (f) {
      saved.push([f, f.fill, f.visible]);
      if (hideFrames) f.visible = false;
      else if (f.gTransparent) f.set('fill', 'rgba(0,0,0,0)');
    });
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    var out = canvas.toCanvasElement(mult || 1, { left: l, top: t, width: w, height: h });
    canvas.setViewportTransform(vpt);
    saved.forEach(function (s) { s[0].set({ fill: s[1] }); s[0].visible = s[2]; });
    hidden.forEach(function (o) { o.visible = true; });
    canvas.backgroundColor = bg; exporting = false; canvas.requestRenderAll();
    if (opaque) { var c = document.createElement('canvas'); c.width = out.width; c.height = out.height; var x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(out, 0, 0); return c; }
    return out;
  }
  function renderFrame(f, mult, opaque) { return renderRegion(f.left, f.top, fw(f), fh(f), mult, opaque, false, f); }
  function safe(s) { return String(s).trim().replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80); }
  function fileBase(extra) { return safe(($('#ed-name').value || 'graphican') + (extra ? '-' + extra : '')); }
  function exportFrames(list, fmt, scale) {
    fmt = fmt || expFmt; scale = scale || expScale;
    if (fmt === 'pdf') return exportPdf(list, scale);
    var mime = fmt === 'jpg' ? 'image/jpeg' : 'image/png';
    if (list.length === 1) {
      var f = list[0];
      return toBlob(renderFrame(f, scale, fmt === 'jpg'), mime, 0.92).then(function (b) {
        var n = fileBase(frames().length > 1 ? f.name : '') + '.' + fmt; saveBlob(n, b); toast(n + ' татагдлаа');
      });
    }
    toast('ZIP бэлтгэж байна…');
    return Promise.all(list.map(function (f, i) {
      return toBlob(renderFrame(f, scale, fmt === 'jpg'), mime, 0.92)
        .then(function (b) { return b.arrayBuffer(); })
        .then(function (ab) { return { name: String(i + 1).padStart(2, '0') + '-' + safe(f.name || 'frame') + '.' + fmt, data: new Uint8Array(ab) }; });
    })).then(function (files) { saveBlob(fileBase() + '.zip', makeZip(files)); toast(files.length + ' frame ZIP-ээр татагдлаа'); });
  }
  function exportPdf(list, scale) {
    toast('PDF бэлтгэж байна…');
    return (window.PDFLib ? Promise.resolve() : loadScript('/assets/vendor/pdf-lib.min.js')).then(function () {
      var L = window.PDFLib;
      return L.PDFDocument.create().then(function (doc) {
        var chain = Promise.resolve();
        list.forEach(function (f) {
          chain = chain.then(function () { return toBlob(renderFrame(f, Math.max(2, scale), true), 'image/jpeg', 0.95); })
            .then(function (b) { return b.arrayBuffer(); })
            .then(function (ab) { return doc.embedJpg(ab); })
            .then(function (img) { var pw = fw(f) * 0.75, ph = fh(f) * 0.75; doc.addPage([pw, ph]).drawImage(img, { x: 0, y: 0, width: pw, height: ph }); });
        });
        return chain.then(function () { return doc.save(); });
      });
    }).then(function (bytes) { saveBlob(fileBase() + '.pdf', new Blob([bytes], { type: 'application/pdf' })); toast('PDF татагдлаа (' + list.length + ' хуудас)'); })
      .catch(function (e) { console.error(e); toast('PDF үүсгэж чадсангүй'); });
  }
  function exportSelection(o) {
    var b = o.getBoundingRect(true, true), fmt = expFmt === 'pdf' ? 'png' : expFmt;
    var c = renderRegion(b.left, b.top, b.width, b.height, expScale, fmt === 'jpg', true);
    canvas.setActiveObject(o);
    toBlob(c, fmt === 'jpg' ? 'image/jpeg' : 'image/png', 0.92).then(function (bl) { var n = fileBase('selection') + '.' + fmt; saveBlob(n, bl); toast(n + ' татагдлаа'); });
  }
  // tiny ZIP writer (stored, no compression) for multi-frame PNG/JPG export
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function makeZip(files) {
    var parts = [], central = [], offset = 0, enc = new TextEncoder();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
      parts.push(lh.buffer, name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      offset += 30 + name.length + data.length;
    });
    var size = central.reduce(function (a, b) { return a + b.byteLength; }, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, size, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }

  // export menu (top right)
  function renderExportMenu() {
    var n = frames().length;
    $('#ed-export-menu').innerHTML =
      '<div class="mt">Формат</div><div class="row2"><select data-em="fmt"><option value="png"' + (expFmt === 'png' ? ' selected' : '') + '>PNG</option><option value="jpg"' + (expFmt === 'jpg' ? ' selected' : '') + '>JPG</option><option value="pdf"' + (expFmt === 'pdf' ? ' selected' : '') + '>PDF</option></select>' +
      '<select data-em="scale"><option value="1"' + (expScale === 1 ? ' selected' : '') + '>1×</option><option value="2"' + (expScale === 2 ? ' selected' : '') + '>2×</option><option value="3"' + (expScale === 3 ? ' selected' : '') + '>3×</option></select></div>' +
      '<button type="button" data-ex="cur">«' + esc((page.name || 'Frame').slice(0, 22)) + '» татах</button>' +
      (n > 1 ? '<button type="button" data-ex="all">Бүх ' + n + ' frame <i>' + (expFmt === 'pdf' ? 'олон хуудастай PDF' : 'ZIP') + '</i></button>' : '') +
      '<div class="sep"></div><div class="mt">Design tools руу илгээх</div>' +
      '<button type="button" data-send="bgremove">Дэвсгэр арилгах</button><button type="button" data-send="upscale">✦ AI томруулах</button>' +
      '<button type="button" data-send="socialcrop">Сошиал хэмжээ рүү тайрах</button><button type="button" data-send="pdf">PDF хөрвүүлэгч</button>';
  }
  $('#ed-export').addEventListener('click', function (e) {
    var m = $('#ed-export-menu'), show = m.hidden; closeMenus();
    if (show) { renderExportMenu(); m.hidden = false; }
    e.stopPropagation();
  });
  $('#ed-export-menu').addEventListener('change', function (e) { var k = e.target.dataset.em; if (k === 'fmt') expFmt = e.target.value; if (k === 'scale') expScale = +e.target.value; renderExportMenu(); renderRight(); });
  $('#ed-export-menu').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ex) { $('#ed-export-menu').hidden = true; exportFrames(b.dataset.ex === 'all' ? frames() : [page]); }
    if (b.dataset.send) { $('#ed-export-menu').hidden = true; toBlob(renderFrame(page, 1), 'image/png').then(function (bl) { handoff(bl, b.dataset.send); }); }
    e.stopPropagation();
  });

  // ---------- hand-off with /tools/ ----------

  function handoff(blob, target) {
    if (!window.GHandoff) { toast('Илгээж чадсангүй'); return; }
    pushHistory();
    dbSet('doc', snapshot()).then(function () { return window.GHandoff.put(blob, { name: fileBase() + '.png', target: target }); })
      .then(function () { location.href = '/tools/' + target + '/'; })
      .catch(function () { toast('Илгээж чадсангүй'); });
  }
  function sendObject(o, target) {
    var el = o.getElement(), c = document.createElement('canvas');
    c.width = el.naturalWidth || el.width; c.height = el.naturalHeight || el.height;
    c.getContext('2d').drawImage(el, 0, 0);
    toBlob(c, 'image/png').then(function (bl) { handoff(bl, target); });
  }

  // ---------- top-right: undo, zoom, theme, help ----------

  $('#ed-undo').innerHTML = icon('undo'); $('#ed-redo').innerHTML = icon('redo');
  $('#ed-undo').addEventListener('click', undo); $('#ed-redo').addEventListener('click', redo);
  function closeMenus() { $$('.menu').forEach(function (m) { if (m.id === 'ed-help-menu') m.remove(); else m.hidden = true; }); }
  $('#ed-zoom').addEventListener('click', function (e) { var m = $('#ed-zoom-menu'), show = m.hidden; closeMenus(); m.hidden = !show; e.stopPropagation(); });
  $('#ed-zoom-menu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-zoom]'); if (!b) return;
    var z = b.dataset.zoom;
    if (z === 'in') zoomTo(canvas.getZoom() * 1.25);
    if (z === 'out') zoomTo(canvas.getZoom() / 1.25);
    if (z === 'fit') fitAll();
    if (z === 'frame') fitFrame();
    if (z === '100') zoomTo(1);
    $('#ed-zoom-menu').hidden = true;
  });
  function themeIcon() { $('#ed-theme').innerHTML = icon(document.documentElement.getAttribute('data-theme') === 'dark' ? 'sun' : 'moon'); }
  $('#ed-theme').addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (dark) document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', 'dark');
    try { localStorage.setItem('gc-editor-theme', dark ? '' : 'dark'); } catch (e) {}
    canvas.backgroundColor = canvasBg(); canvas.requestRenderAll(); themeIcon();
  });
  themeIcon();
  $('#ed-help').addEventListener('click', function (e) {
    e.stopPropagation();
    if ($('#ed-help-menu')) { closeMenus(); return; }
    closeMenus();
    var m = document.createElement('div'); m.className = 'menu r help'; m.id = 'ed-help-menu';
    m.innerHTML = '<div class="mt">Товчлолууд</div>' + [
      ['V · H', 'Сонгох · гар'], ['F · R · O · L', 'Frame · тэгш өнцөгт · эллипс · шугам'], ['T · P · B', 'Текст · pen (вектор) · бийр'], ['Давхар дарах (зураас)', 'Цэгүүдийг засах'], ['Ctrl Alt M', 'Маск болгох'], ['Shift + дарах', 'Олноор сонгох'],
      ['Ctrl Z · Ctrl Shift Z', 'Буцаах · дахин хийх'], ['Ctrl C · V · D', 'Хуулах · буулгах · хувилах'], ['Delete', 'Устгах'],
      ['Ctrl G · Ctrl Shift G', 'Бүлэглэх · задлах'], ['Ctrl ] · [', 'Урагш · хойш'], ['Сумнууд (+Shift)', '1px (10px) зөөх'],
      ['Enter · давхар дарах', 'Текст засах'], ['Space + чирэх · дугуй', 'Гүйлгэх'], ['Ctrl + дугуй', 'Томруулах'],
      ['Shift 1 · Shift 2', 'Бүгдийг · frame-ийг харах'], ['X, W… шошгыг чирэх', 'Тоог өөрчлөх'], ['Frame нэрийг чирэх', 'Frame зөөх']
    ].map(function (r) { return '<div class="kb"><kbd>' + r[0] + '</kbd><span>' + r[1] + '</span></div>'; }).join('');
    this.parentNode.appendChild(m);
  });
  document.addEventListener('mousedown', function (e) {
    if (!e.target.closest('.menu') && !e.target.closest('#ed-zoom,#ed-export,#ed-help,[data-shape-menu]')) closeMenus();
  });

  // mobile: panels as sheets
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'); if (o) { $('#' + o.dataset.open).classList.add('open'); return; }
    var c = e.target.closest('[data-close]'); if (c) $('#' + c.dataset.close).classList.remove('open');
  });

  // ---------- files: picker, drag & drop, paste ----------

  $('#ed-file').addEventListener('change', function () { Array.prototype.forEach.call(this.files, function (f) { addImageBlob(f); }); this.value = ''; });
  var dragDepth = 0;
  function hasFiles(e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') >= 0; }
  stage.addEventListener('dragenter', function (e) { if (hasFiles(e)) { e.preventDefault(); dragDepth++; $('#ed-dropzone').hidden = false; } });
  stage.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
  stage.addEventListener('dragleave', function () { if (--dragDepth <= 0) { dragDepth = 0; $('#ed-dropzone').hidden = true; } });
  stage.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth = 0; $('#ed-dropzone').hidden = true;
    var at = canvas.getPointer(e);
    Array.prototype.forEach.call(e.dataTransfer.files, function (f) { if (/^image\//.test(f.type)) addImageBlob(f, { at: at }); });
  });
  var clip = null;
  window.addEventListener('paste', function (e) {
    if (isTyping(e)) return;
    var items = (e.clipboardData || {}).items || [];
    for (var i = 0; i < items.length; i++) if (items[i].type.indexOf('image') === 0) { e.preventDefault(); addImageBlob(items[i].getAsFile()); return; }
    if (clip) pasteClip();
  });
  function pasteClip() {
    clip.clone(function (c) {
      canvas.discardActiveObject();
      c.set({ left: c.left + 20, top: c.top + 20, evented: true });
      if (c.type === 'activeSelection') { c.canvas = canvas; c.forEachObject(function (x) { canvas.add(x); }); c.setCoords(); } else canvas.add(c);
      clip.left += 20; clip.top += 20;
      canvas.setActiveObject(c); canvas.requestRenderAll(); commit();
    }, PROPS);
  }

  // ---------- keyboard ----------

  function isTyping(e) {
    var t = e.target, o = active();
    return (o && o.isEditing) || (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable));
  }
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && !isTyping(e)) { if (!spaceDown) { spaceDown = true; canvas.setCursor('grab'); } e.preventDefault(); return; }
    if (isTyping(e)) { if (e.key === 'Escape') { var t = active(); if (t && t.isEditing) { t.exitEditing(); canvas.requestRenderAll(); } } return; }
    var mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase(), o = active();
    if (crop) { if (e.key === 'Enter') { e.preventDefault(); endCrop(true); } if (e.key === 'Escape') { e.preventDefault(); endCrop(false); } return; }
    if (tool === 'vector' && e.key === 'Enter') { e.preventDefault(); setTool('move'); return; }
    if (vedit && (e.key === 'Escape' || e.key === 'Enter')) { e.preventDefault(); endVEdit(); return; }
    if (vedit && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); vDelete(); return; }
    if (mod && e.altKey && k === 'm') { e.preventDefault(); makeMask(); return; }
    if (e.key === 'Escape' && tool !== 'move') { setTool('move'); return; }
    if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); redo(); return; }
    if (mod && k === 'd') { e.preventDefault(); duplicate(); return; }
    if (mod && k === 'g') { e.preventDefault(); if (e.shiftKey) ungroupSel(); else groupSel(); return; }
    if (mod && k === 'c' && o && !o.isFrame) { o.clone(function (c) { clip = c; }, PROPS); return; }
    if (mod && k === 'a') {
      e.preventDefault();
      var all = userObjects().filter(function (x) { return x.visible !== false && !x.locked; });
      if (all.length) { canvas.setActiveObject(new fabric.ActiveSelection(all, { canvas: canvas })); canvas.requestRenderAll(); }
      return;
    }
    if (mod && k === '0') { e.preventDefault(); zoomTo(1); return; }
    if (mod && (k === '=' || k === '+')) { e.preventDefault(); zoomTo(canvas.getZoom() * 1.25); return; }
    if (mod && k === '-') { e.preventDefault(); zoomTo(canvas.getZoom() / 1.25); return; }
    if (mod && k === ']') { e.preventDefault(); arrange(e.shiftKey ? 'top' : 'up'); return; }
    if (mod && k === '[') { e.preventDefault(); arrange(e.shiftKey ? 'bottom' : 'down'); return; }
    if (e.shiftKey && e.code === 'Digit1') { fitAll(); return; }
    if (e.shiftKey && e.code === 'Digit2') { fitFrame(o && !o.isFrame ? frameOf(o) || page : o || page); return; }
    if (!mod && !e.altKey && !e.shiftKey) {
      var tk = { v: 'move', h: 'hand', f: 'frame', t: 'text', p: 'vector', b: 'draw' }[k];
      var sk = { r: 'rect', o: 'ellipse', l: 'line' }[k];
      if (tk) { setTool(tk); return; }
      if (sk) { shapeKind = sk; setTool('shape'); return; }
    }
    if (!o) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSel(); return; }
    if (e.key === 'Escape') { canvas.discardActiveObject(); canvas.requestRenderAll(); return; }
    if (e.key === 'Enter' && kindOf(o) === 'text') { e.preventDefault(); o.enterEditing(); o.selectAll(); canvas.requestRenderAll(); return; }
    var step = e.shiftKey ? 10 : 1, mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (mv && !o.locked) {
      e.preventDefault();
      if (o.isFrame) moveFrame(o, mv[0], mv[1]); else { o.set({ left: o.left + mv[0], top: o.top + mv[1] }); o.setCoords(); }
      canvas.requestRenderAll(); commit(); syncGeom();
    }
  });
  window.addEventListener('keyup', function (e) { if (e.code === 'Space') { spaceDown = false; canvas.setCursor(tool === 'hand' ? 'grab' : 'default'); } });

  // ================= PRO tools: pen & vector points, brushes, paints, stroke, effects, masks =================

  var GX = window.GFX;
  function dcopy(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function zoomNow() { return canvas.getZoom() || 1; }

  // ---------- pen tool (P): click = corner, drag = curve, click the first point = close ----------
  var pen = null, vedit = null;
  function penStart() { pen = { pts: [], drag: false, hover: null }; canvas.discardActiveObject(); canvas.requestRenderAll(); }
  function penD(pts, closed) {
    if (!pts.length) return '';
    var d = 'M ' + r1(pts[0].x) + ' ' + r1(pts[0].y);
    function seg(a, b) {
      if (a.ho || b.hi) { var c1 = a.ho || a, c2 = b.hi || b; d += ' C ' + r1(c1.x) + ' ' + r1(c1.y) + ' ' + r1(c2.x) + ' ' + r1(c2.y) + ' ' + r1(b.x) + ' ' + r1(b.y); }
      else d += ' L ' + r1(b.x) + ' ' + r1(b.y);
    }
    for (var i = 1; i < pts.length; i++) seg(pts[i - 1], pts[i]);
    if (closed && pts.length > 2) { seg(pts[pts.length - 1], pts[0]); d += ' Z'; }
    return d;
  }
  function penFinish(closed) {
    var p = pen; pen = null;
    if (!p) return;
    // a double-click leaves a duplicate last point
    var n = p.pts.length;
    if (n > 1 && Math.hypot(p.pts[n - 1].x - p.pts[n - 2].x, p.pts[n - 1].y - p.pts[n - 2].y) < 1 / zoomNow()) p.pts.pop();
    if (p.pts.length < 2) { canvas.requestRenderAll(); return; }
    var sw = Math.max(2, Math.round(Math.min(W, H) * 0.004));
    var o = new fabric.Path(penD(p.pts, closed), {
      fill: closed ? '#816dfb' : '', stroke: '#1e1e1e', strokeWidth: sw, strokeLineCap: 'round', strokeLineJoin: 'round', strokeUniform: true,
      name: closed ? 'Вектор хэлбэр' : 'Вектор зураас', perPixelTargetFind: !closed
    });
    o.gPen = { pts: dcopy(p.pts), closed: !!closed };
    canvas.add(o); canvas.setActiveObject(o); commit(); refreshUI();
  }
  canvas.on('mouse:down', function (o) {
    if (tool !== 'vector' || spaceDown || o.e.button === 1) return;
    if (!pen) penStart();
    var pt = canvas.getPointer(o.e), tol = 9 / zoomNow();
    if (pen.pts.length >= 2 && Math.hypot(pt.x - pen.pts[0].x, pt.y - pen.pts[0].y) < tol) { penFinish(true); setTool('move'); return; }
    pen.pts.push({ x: pt.x, y: pt.y }); pen.drag = true; canvas.requestRenderAll();
  });
  canvas.on('mouse:move', function (o) {
    if (tool !== 'vector' || !pen) return;
    var pt = canvas.getPointer(o.e); pen.hover = pt;
    if (pen.drag && pen.pts.length) {
      var a = pen.pts[pen.pts.length - 1];
      if (Math.hypot(pt.x - a.x, pt.y - a.y) > 2 / zoomNow()) {
        a.ho = { x: pt.x, y: pt.y };
        if (!o.e.altKey) a.hi = { x: 2 * a.x - pt.x, y: 2 * a.y - pt.y };
      }
    }
    canvas.requestRenderAll();
  });
  canvas.on('mouse:up', function () { if (pen) pen.drag = false; });
  canvas.on('mouse:dblclick', function (o) {
    if (tool === 'vector') { penFinish(false); setTool('move'); return; }
    var t = o.target;
    if (vedit && t === vedit.o) { vInsertAt(t, canvas.getPointer(o.e)); return; }
    if (t && tool === 'move' && t.isType('path') && !t.locked) startVEdit(t);
  });

  // overlay: pen preview, anchors and handles (never drawn into exports)
  canvas.on('after:render', function (ev) {
    var ctx = ev && ev.ctx; if (exporting || !ctx || ctx !== canvas.contextContainer) return;
    if (!(pen && pen.pts.length) && !vedit) return;
    var v = canvas.viewportTransform, z = v[0];
    var P2 = function (p) { return { x: p.x * z + v[4], y: p.y * z + v[5] }; };
    ctx.save();
    if (canvas.enableRetinaScaling) { var r = canvas.getRetinaScaling(); ctx.setTransform(r, 0, 0, r, 0, 0); } else ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineWidth = 1.5; ctx.strokeStyle = ACC; ctx.fillStyle = '#fff';
    if (pen && pen.pts.length) {
      var pts = pen.pts.map(function (p) { return { x: P2(p).x, y: P2(p).y, hi: p.hi && P2(p.hi), ho: p.ho && P2(p.ho) }; });
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) { var a = pts[i - 1], b = pts[i], c1 = a.ho || a, c2 = b.hi || b; ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, b.x, b.y); }
      if (pen.hover && !pen.drag) { var l = pts[pts.length - 1], h = P2(pen.hover), c = l.ho || l; ctx.bezierCurveTo(c.x, c.y, h.x, h.y, h.x, h.y); }
      ctx.stroke();
      var last = pts[pts.length - 1];
      [last.hi, last.ho].forEach(function (q) { if (!q) return; ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.beginPath(); ctx.arc(q.x, q.y, 3.5, 0, 7); ctx.fill(); ctx.stroke(); });
      var nearFirst = pen.hover && pts.length >= 2 && Math.hypot(P2(pen.hover).x - pts[0].x, P2(pen.hover).y - pts[0].y) < 9;
      pts.forEach(function (p, k) {
        ctx.beginPath(); ctx.rect(p.x - 4, p.y - 4, 8, 8);
        ctx.fillStyle = (k === 0 && nearFirst) || k === pts.length - 1 ? ACC : '#fff'; ctx.fill(); ctx.stroke();
      });
    }
    if (vedit && vedit.o.canvas) {
      var o = vedit.o, M = fabric.util.multiplyTransformMatrices(v, o.calcTransformMatrix());
      var T = function (q) { var p = fabric.util.transformPoint({ x: q.x - o.pathOffset.x, y: q.y - o.pathOffset.y }, M); return p; };
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (canvas.enableRetinaScaling) { var rr = canvas.getRetinaScaling(); ctx.scale(rr, rr); }
      ctx.strokeStyle = ACC; ctx.lineWidth = 1;
      o.gPen.pts.forEach(function (p) {
        var a = T(p);
        [p.hi, p.ho].forEach(function (q) { if (!q) return; var b = T(q); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      });
    }
    ctx.restore();
  });

  // ---------- vector point editing (double-click a path) ----------
  function ptsFromPath(o) {
    // pencil / imported paths: M, L, Q, C, Z → anchors with cubic handles
    var pts = [], closed = false, cur = null;
    (o.path || []).forEach(function (c) {
      var k = c[0];
      if (k === 'M') { cur = { x: c[1], y: c[2] }; if (!pts.length) pts.push(cur); }
      else if (k === 'L') { cur = { x: c[1], y: c[2] }; pts.push(cur); }
      else if (k === 'Q') {
        var p0 = pts[pts.length - 1] || cur, q = { x: c[1], y: c[2] }, e = { x: c[3], y: c[4] };
        p0.ho = { x: p0.x + 2 / 3 * (q.x - p0.x), y: p0.y + 2 / 3 * (q.y - p0.y) };
        e.hi = { x: e.x + 2 / 3 * (q.x - e.x), y: e.y + 2 / 3 * (q.y - e.y) }; pts.push(e); cur = e;
      } else if (k === 'C') {
        var s = pts[pts.length - 1]; s.ho = { x: c[1], y: c[2] }; var e2 = { x: c[5], y: c[6], hi: { x: c[3], y: c[4] } }; pts.push(e2); cur = e2;
      } else if (k === 'Z' || k === 'z') closed = true;
    });
    // drop the duplicated end point of closed paths
    if (closed && pts.length > 2) { var f = pts[0], l = pts[pts.length - 1]; if (Math.hypot(f.x - l.x, f.y - l.y) < 0.01) { f.hi = l.hi; pts.pop(); } }
    return { pts: pts, closed: closed };
  }
  function vRebuild(o) {
    var M = o.calcTransformMatrix(), c = o.getCenterPoint(), off = { x: o.pathOffset.x, y: o.pathOffset.y };
    o._setPath(penD(o.gPen.pts, o.gPen.closed), { left: o.left, top: o.top });
    var dx = o.pathOffset.x - off.x, dy = o.pathOffset.y - off.y;
    o.setPositionByOrigin(new fabric.Point(c.x + M[0] * dx + M[2] * dy, c.y + M[1] * dx + M[3] * dy), 'center', 'center');
    o.set('dirty', true); o.setCoords();
    if (o.gPaint || o.gPaintS) { GX.applyPaint(o, 'fill'); GX.applyPaint(o, 'stroke'); }
  }
  function vToPath(o, x, y) { var l = fabric.util.transformPoint({ x: x, y: y }, fabric.util.invertTransform(o.calcTransformMatrix())); return { x: l.x + o.pathOffset.x, y: l.y + o.pathOffset.y }; }
  function vCtl(i, h) {
    return new fabric.Control({
      actionName: 'modifyPath', cursorStyle: 'pointer', sizeX: 16, sizeY: 16, touchSizeX: 28, touchSizeY: 28,
      positionHandler: function (dim, fm, o) {
        var p = o.gPen.pts[i], q = p && (h ? p[h] : p);
        if (!q) return { x: -9999, y: -9999 };
        return fabric.util.transformPoint({ x: q.x - o.pathOffset.x, y: q.y - o.pathOffset.y }, fabric.util.multiplyTransformMatrices(o.canvas.viewportTransform, o.calcTransformMatrix()));
      },
      mouseDownHandler: function (ev, tr) {
        vedit.sel = i;
        if (!h && ev.altKey) { vToggle(tr.target, i); commit(); }
        canvas.requestRenderAll(); return false;
      },
      actionHandler: function (ev, tr, x, y) {
        var o = tr.target, p = o.gPen.pts[i], np = vToPath(o, x, y);
        if (!h) {
          var dx = np.x - p.x, dy = np.y - p.y;
          p.x = np.x; p.y = np.y;
          if (p.hi) { p.hi.x += dx; p.hi.y += dy; } if (p.ho) { p.ho.x += dx; p.ho.y += dy; }
        } else {
          p[h] = np;
          var other = h === 'hi' ? 'ho' : 'hi';
          if (p[other] && !p.corner && !ev.altKey) {
            var L = Math.hypot(p[other].x - p.x, p[other].y - p.y), a = Math.atan2(np.y - p.y, np.x - p.x) + Math.PI;
            p[other] = { x: p.x + Math.cos(a) * L, y: p.y + Math.sin(a) * L };
          }
          if (ev.altKey) p.corner = true;
        }
        vRebuild(o); syncGeom();
        return true;
      },
      mouseUpHandler: function () { commit(); },
      render: function (ctx, left, top, st, o) {
        var sel = vedit && vedit.sel === i && !h;
        ctx.save(); ctx.lineWidth = 1.5; ctx.strokeStyle = ACC;
        ctx.fillStyle = h ? '#fff' : sel ? ACC : '#fff';
        ctx.beginPath();
        if (h) ctx.arc(left, top, 3.5, 0, Math.PI * 2); else ctx.rect(left - 4.5, top - 4.5, 9, 9);
        ctx.fill(); ctx.stroke(); ctx.restore();
      }
    });
  }
  function vControls(o) {
    var ctr = {};
    o.gPen.pts.forEach(function (p, i) {
      if (p.hi) ctr['i' + i] = vCtl(i, 'hi');
      if (p.ho) ctr['o' + i] = vCtl(i, 'ho');
    });
    o.gPen.pts.forEach(function (p, i) { ctr['a' + i] = vCtl(i, null); }); // anchors on top of handles
    o.controls = ctr;
  }
  function vToggle(o, i) {
    // Alt+click an anchor: curve ⇄ corner
    var pts = o.gPen.pts, p = pts[i];
    if (p.hi || p.ho) { delete p.hi; delete p.ho; delete p.corner; }
    else {
      var a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length];
      var dx = (b.x - a.x) / 4, dy = (b.y - a.y) / 4;
      p.hi = { x: p.x - dx, y: p.y - dy }; p.ho = { x: p.x + dx, y: p.y + dy };
    }
    vRebuild(o); vControls(o);
  }
  function startVEdit(o) {
    if (vedit) endVEdit();
    if (!o.gPen) {
      var g = ptsFromPath(o);
      if (g.pts.length < 2) return;
      if (g.pts.length > 400) { toast('Энэ зураас хэт олон цэгтэй (' + g.pts.length + ')'); return; }
      o.gPen = g;
    } else o.gPen = dcopy(o.gPen);
    vedit = { o: o, sel: -1 };
    vControls(o);
    o.set({ hasBorders: false, lockMovementX: true, lockMovementY: true });
    canvas.setActiveObject(o); canvas.requestRenderAll(); refreshUI();
    toast('Цэгийг чирж засна · Alt+дарах: муруй ⇄ булан · давхар дарах: цэг нэмэх · Delete: цэг устгах · Esc: дуусгах');
  }
  function endVEdit() {
    if (!vedit) return;
    var o = vedit.o; vedit = null;
    o.controls = fabric.Object.prototype.controls;
    o.set({ hasBorders: true, lockMovementX: !!o.locked, lockMovementY: !!o.locked });
    o.setCoords(); canvas.requestRenderAll(); commit(); refreshUI();
  }
  function vDelete() {
    if (!vedit || vedit.sel < 0) return false;
    var o = vedit.o;
    if (o.gPen.pts.length <= 2) { toast('Хамгийн багадаа 2 цэг байна'); return true; }
    o.gPen.pts.splice(vedit.sel, 1); vedit.sel = -1;
    vRebuild(o); vControls(o); canvas.requestRenderAll(); commit(); return true;
  }
  function vInsertAt(o, ptr) {
    var p = vToPath(o, ptr.x, ptr.y), pts = o.gPen.pts, n = pts.length, best = null;
    var segs = o.gPen.closed ? n : n - 1;
    for (var s = 0; s < segs; s++) {
      var a = pts[s], b = pts[(s + 1) % n], c1 = a.ho || a, c2 = b.hi || b;
      for (var k = 1; k < 40; k++) {
        var t = k / 40, u = 1 - t;
        var x = u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x;
        var y = u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y;
        var d = Math.hypot(x - p.x, y - p.y);
        if (!best || d < best.d) best = { d: d, s: s, t: t };
      }
    }
    var scale = Math.max(o.scaleX, o.scaleY) * zoomNow();
    if (!best || best.d * scale > 14) return;
    var A = pts[best.s], B = pts[(best.s + 1) % n], C1 = A.ho || A, C2 = B.hi || B, t2 = best.t;
    var lerp = function (p1, p2) { return { x: p1.x + (p2.x - p1.x) * t2, y: p1.y + (p2.y - p1.y) * t2 }; };
    var np;
    if (A.ho || B.hi) {
      // de Casteljau split keeps the curve's shape
      var p01 = lerp(A, C1), p12 = lerp(C1, C2), p23 = lerp(C2, B), p012 = lerp(p01, p12), p123 = lerp(p12, p23), m = lerp(p012, p123);
      A.ho = p01; B.hi = p23; np = { x: m.x, y: m.y, hi: p012, ho: p123 };
    } else np = lerp(A, B);
    pts.splice(best.s + 1, 0, np); vedit.sel = best.s + 1;
    vRebuild(o); vControls(o); canvas.requestRenderAll(); commit();
  }
  canvas.on('selection:cleared', function () { if (vedit) endVEdit(); });
  canvas.on('selection:updated', function () { if (vedit && active() !== vedit.o) endVEdit(); });

  // ---------- brushes ----------
  var BRUSHES = [['pen', 'pen', 'Харандаа'], ['ink', 'ink', 'Бийр (үзүүр нь нарийсна)'], ['marker', 'marker', 'Маркер'], ['neon', 'neon', 'Неон'],
    ['spray', 'spray', 'Шүршигч'], ['dots', 'dots', 'Цэгэн'], ['hatch', 'hatch', 'Судалтай'], ['eraser', 'eraser', 'Баллуур (зураасыг бүтнээр нь устгана)']];
  function hatchSrc(color, size) {
    var s = Math.max(6, Math.round(size)), c = document.createElement('canvas'); c.width = c.height = s;
    var x = c.getContext('2d'); x.strokeStyle = color; x.lineWidth = Math.max(1, s / 5);
    x.beginPath(); x.moveTo(0, s); x.lineTo(s, 0); x.moveTo(-s / 2, s / 2); x.lineTo(s / 2, -s / 2); x.moveTo(s / 2, s * 1.5); x.lineTo(s * 1.5, s / 2); x.stroke();
    return c;
  }
  function mixWhite(hex, k) { var p = parseCol(hex).hex, n = parseInt(p.slice(1), 16), f = function (v) { return Math.round(v + (255 - v) * k); }; return '#' + [f(n >> 16), f(n >> 8 & 255), f(n & 255)].map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }
  function makeBrush() {
    var t = draw.tool, s = brushSize(), a = draw.op == null ? 1 : draw.op, b;
    if (t === 'spray') { b = new fabric.SprayBrush(canvas); b.density = 30; b.dotWidth = Math.max(1, s / 6); b.width = s * 2; b.color = mkCol(draw.color, a); return b; }
    if (t === 'dots') { b = new fabric.CircleBrush(canvas); b.width = s; b.color = mkCol(draw.color, a); return b; }
    if (t === 'hatch') {
      b = new fabric.PatternBrush(canvas); var src = hatchSrc(draw.color, s * 0.8);
      b.getPatternSrc = function () { return src; }; b.width = s * 2.5; return b;
    }
    b = new fabric.PencilBrush(canvas);
    b.decimate = 2; b.strokeLineCap = 'round'; b.strokeLineJoin = 'round';
    if (t === 'marker') { b.color = mkCol(draw.color, 0.45 * a); b.width = s * 2.5; b.strokeLineCap = 'square'; }
    else if (t === 'neon') { b.color = mixWhite(draw.color, 0.65); b.width = s * 0.8; b.shadow = new fabric.Shadow({ color: draw.color, blur: s * 2.2, offsetX: 0, offsetY: 0 }); }
    else { b.color = mkCol(draw.color, a); b.width = t === 'ink' ? s * 1.6 : s; }
    return b;
  }
  // "ink" strokes become a filled outline that tapers at both ends
  function inkOutline(path, width, color) {
    var raw = [];
    (path.path || []).forEach(function (c) { var n = c.length; if (n >= 3) raw.push({ x: c[n - 2], y: c[n - 1] }); });
    var pts = [], step = Math.max(1.5, width / 4);
    raw.forEach(function (p) { var l = pts[pts.length - 1]; if (!l || Math.hypot(p.x - l.x, p.y - l.y) >= step) pts.push(p); });
    if (pts.length < 3) return null;
    var n = pts.length, k = Math.max(2, Math.min(10, n / 3)), L = [], Rr = [];
    for (var i = 0; i < n; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len, ny = dx / len, taper = Math.min(1, (i + 0.6) / k, (n - i - 0.4) / k);
      var w = width / 2 * Math.max(0.08, Math.sin(taper * Math.PI / 2));
      L.push({ x: pts[i].x + nx * w, y: pts[i].y + ny * w }); Rr.push({ x: pts[i].x - nx * w, y: pts[i].y - ny * w });
    }
    var all = L.concat(Rr.reverse()), d = 'M ' + r1(all[0].x) + ' ' + r1(all[0].y);
    for (var j = 1; j < all.length; j++) { var p0 = all[j - 1], p1 = all[j]; d += ' Q ' + r1(p0.x) + ' ' + r1(p0.y) + ' ' + r1((p0.x + p1.x) / 2) + ' ' + r1((p0.y + p1.y) / 2); }
    d += ' Z';
    return new fabric.Path(d, { fill: color, stroke: null, strokeWidth: 0, name: 'Бийр', perPixelTargetFind: true });
  }
  canvas.on('path:created', function (e) {
    var p = e.path;
    if (draw.tool === 'marker') p.set({ globalCompositeOperation: 'multiply', name: 'Маркер' });
    if (draw.tool === 'neon') p.set({ name: 'Неон' });
    if (draw.tool === 'hatch') p.set({ name: 'Судал' });
    if (draw.tool === 'ink') {
      var o = inkOutline(p, brushSize() * 1.6, mkCol(draw.color, draw.op == null ? 1 : draw.op));
      if (o) { restoring = true; canvas.remove(p); restoring = false; canvas.add(o); }
    }
  });

  // ---------- paints (fill / stroke) ----------
  var PAINT_TYPES = [['solid', 'Цул өнгө'], ['linear', 'Linear градиент'], ['radial', 'Radial градиент'], ['angular', 'Angular (конус)'], ['diamond', 'Diamond (ромбо)'], ['image', 'Зураг']];
  function solidOf(v, dflt) { return typeof v === 'string' && v ? v : dflt; }
  function paintOf(o, which) { var g = o[which === 'stroke' ? 'gPaintS' : 'gPaint']; return g && g.type && g.type !== 'solid' ? g : null; }
  function setPaint(o, which, g) {
    var key = which === 'stroke' ? 'gPaintS' : 'gPaint';
    o[key] = g;
    if (!g) return Promise.resolve();
    return GX.applyPaint(o, which);
  }
  function eachPaint(which, fn) {
    var jobs = [];
    eachSel(function (x) { if (x.isFrame) return; var r = fn(x); if (r && r.then) jobs.push(r); });
    return Promise.all(jobs).then(function () { canvas.requestRenderAll(); });
  }
  function switchPaint(which, type) {
    return eachPaint(which, function (x) {
      var cur = paintOf(x, which), base = cur ? cur.stops[0].c : solidOf(which === 'stroke' ? x.stroke : x.fill, '#816dfb');
      if (type === 'solid') { x[which === 'stroke' ? 'gPaintS' : 'gPaint'] = null; x.set(which, cur ? GX.rgba(cur.stops[0].c, cur.stops[0].a) : base); x.set('dirty', true); return null; }
      if (type === 'image') { pickFillImage(x); return null; }
      var pc = parseCol(base), light = (parseInt(pc.hex.slice(1, 3), 16) + parseInt(pc.hex.slice(3, 5), 16) + parseInt(pc.hex.slice(5, 7), 16)) > 380;
      var g = cur && cur.stops ? dcopy(cur) : { angle: 90, stops: [{ p: 0, c: pc.hex, a: pc.a }, { p: 1, c: light ? '#34229e' : '#e7e3fd', a: 1 }] };
      g.type = type; if (g.angle == null) g.angle = 90;
      return setPaint(x, which, g);
    }).then(function () { commit(); refreshUI(); });
  }
  function editPaint(which, fn) {
    return eachPaint(which, function (x) { var g = paintOf(x, which); if (!g) return null; g = dcopy(g); fn(g, x); return setPaint(x, which, g); });
  }
  function pickFillImage(target) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function () {
      var f = inp.files[0]; if (!f) return;
      readImage(f).then(function (r) {
        var url = r.url;
        var list = []; if (target) list = [target]; else eachSel(function (x) { list.push(x); });
        return Promise.all(list.map(function (x) { return setPaint(x, 'fill', { type: 'image', src: url, fit: 'cover', scale: 1, stops: [{ p: 0, c: '#816dfb', a: 1 }] }); }));
      }).then(function () { canvas.requestRenderAll(); commit(); refreshUI(); });
    };
    inp.click();
  }
  function paintUI(which, o) {
    var g = paintOf(o, which), type = g ? g.type : 'solid', h = '';
    var types = PAINT_TYPES.filter(function (t) { return which === 'fill' || t[0] !== 'image'; });
    h += '<div class="r2 pt-row"><label class="nf full"><select data-q="' + which + ':type">' + types.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === type ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select></label>' +
      (g && type !== 'image' ? '<span class="rowf"><button type="button" class="ib" data-b="' + which + ':swap" title="Эргүүлэх (өнгийг солих)">⇄</button><button type="button" class="ib" data-b="' + which + ':rot" title="90° эргүүлэх">' + icon('rotate') + '</button></span>' : '<span></span>') + '</div>';
    if (!g) return h + '<div style="margin-top:6px">' + colorRow(which, solidOf(which === 'stroke' ? o.stroke : o.fill, '#816dfb')) + '</div>';
    if (type === 'image') {
      return h + '<div class="img-fill" style="background-image:url(\'' + esc(g.src) + '\')"></div>' +
        '<div class="r2" style="margin-top:6px"><button type="button" class="btn" data-b="fill:img">' + icon('image') + 'Солих</button>' +
        '<label class="nf full"><select data-q="fill:fit"><option value="cover"' + (g.fit === 'cover' ? ' selected' : '') + '>Дүүргэх</option><option value="fit"' + (g.fit === 'fit' ? ' selected' : '') + '>Багтаах</option><option value="tile"' + (g.fit === 'tile' ? ' selected' : '') + '>Давтах</option></select></label></div>' +
        '<div class="sl"><span>Хэмжээ</span><input type="range" data-q="fill:scale" min="10" max="300" value="' + Math.round((g.scale || 1) * 100) + '"><b>' + Math.round((g.scale || 1) * 100) + '%</b></div>';
    }
    var stops = g.stops.map(function (s, i) { return { s: s, i: i }; }).sort(function (a, b) { return a.s.p - b.s.p; });
    h += '<div class="gbar" data-gbar="' + which + '"><i class="gfill" style="background:' + GX.cssPreview(Object.assign({}, g, { type: 'linear' })) + '"></i>' +
      g.stops.map(function (s, i) { return '<b class="gstop' + (paintSel[which] === i ? ' on' : '') + '" data-gstop="' + i + '" style="left:' + (s.p * 100) + '%"><em style="background:' + GX.rgba(s.c, s.a) + '"></em></b>'; }).join('') + '</div>';
    if (type !== 'diamond' && type !== 'radial') h += '<div class="r2" style="margin-top:6px"><label class="nf"><span class="lb">' + icon('angle') + '</span><input data-q="' + which + ':angle" value="' + Math.round(g.angle || 0) + '" inputmode="decimal"><span class="unit">°</span></label><span></span></div>';
    else if (type === 'radial') h += '<div class="sl"><span>Радиус</span><input type="range" data-q="' + which + ':radius" min="10" max="150" value="' + Math.round((g.r || 0.5) * 200) + '"><b>' + Math.round((g.r || 0.5) * 200) + '%</b></div>';
    h += '<div class="ps-l">Stops <button type="button" class="ib" data-b="' + which + ':addstop" title="Өнгө нэмэх">' + icon('plus') + '</button></div>' +
      stops.map(function (x) {
        var s = x.s, pc = parseCol(s.c);
        return '<div class="gs-row' + (paintSel[which] === x.i ? ' on' : '') + '"><label class="nf pos"><input data-q="' + which + ':p:' + x.i + '" value="' + Math.round(s.p * 100) + '" inputmode="decimal"><span class="unit">%</span></label>' +
          '<label class="nf full"><span class="csw"><i style="background:' + GX.rgba(s.c, s.a) + '"></i><input type="color" data-q="' + which + ':c:' + x.i + '" value="' + pc.hex + '"></span><input data-q="' + which + ':h:' + x.i + '" value="' + pc.hex.slice(1).toUpperCase() + '" maxlength="7" spellcheck="false"></label>' +
          '<label class="nf op"><input data-q="' + which + ':a:' + x.i + '" value="' + Math.round((s.a == null ? 1 : s.a) * 100) + '" inputmode="decimal"><span class="unit">%</span></label>' +
          (g.stops.length > 2 ? '<button type="button" class="ib rm" data-b="' + which + ':delstop:' + x.i + '" title="Хасах">' + icon('minus') + '</button>' : '<span class="ib"></span>') + '</div>';
      }).join('');
    return h;
  }
  var paintSel = { fill: 0, stroke: 0 };

  // ---------- stroke options ----------
  var DASHES = [['solid', 'Цул', null], ['dash', 'Тасархай', [4, 2]], ['long', 'Урт тасархай', [8, 3]], ['dot', 'Цэгэн', [0.01, 2]], ['dashdot', 'Тасархай-цэг', [5, 2, 0.01, 2]]];
  function dashOf(o) {
    var d = o.strokeDashArray, sw = o.strokeWidth || 1;
    if (!d || !d.length) return 'solid';
    var norm = d.map(function (v) { return Math.round(v / sw * 100) / 100; }).join(',');
    for (var i = 1; i < DASHES.length; i++) if (DASHES[i][2].join(',') === norm) return DASHES[i][0];
    return 'dash';
  }
  function strokeUI(o, k) {
    var closed = !(k === 'line' || k === 'text') || (o.isType('path') && (o.gPen ? o.gPen.closed : (o.path || []).some(function (c) { return c[0] === 'Z' || c[0] === 'z'; })));
    var pos = o.gStrokePos || 'center', dash = dashOf(o);
    var segB = function (items, cur, key) {
      return '<div class="seg">' + items.map(function (it) { return '<button type="button" data-b="' + key + ':' + it[0] + '" title="' + it[2] + '"' + (it[0] === cur ? ' class="on"' : '') + '>' + it[1] + '</button>'; }).join('') + '</div>';
    };
    var h = '<div class="r2" style="margin-top:6px">' + nf('≡', 'sw', r1(o.strokeWidth), { title: 'Зузаан' }) +
      (closed && k !== 'text' ? segB([['inside', '<svg class="i" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="1" stroke-dasharray="2 2"/><rect x="7" y="7" width="10" height="10" rx="1" stroke-width="3"/></svg>', 'Дотор'], ['center', '<svg class="i" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" stroke-width="3"/></svg>', 'Голд'], ['outside', '<svg class="i" viewBox="0 0 24 24"><rect x="8" y="8" width="8" height="8" rx="1" stroke-dasharray="2 2"/><rect x="5" y="5" width="14" height="14" rx="1" stroke-width="3"/></svg>', 'Гадна']], pos, 'spos') : '<span></span>') + '</div>' +
      '<div class="r2" style="margin-top:6px">' +
        segB([['miter', '<svg class="i" viewBox="0 0 24 24"><path d="M5 19V5h14" stroke-width="3" stroke-linejoin="miter" stroke-linecap="butt"/></svg>', 'Үзүүртэй булан'], ['round', '<svg class="i" viewBox="0 0 24 24"><path d="M5 19V5h14" stroke-width="3" stroke-linejoin="round" stroke-linecap="butt"/></svg>', 'Бөөрөнхий булан'], ['bevel', '<svg class="i" viewBox="0 0 24 24"><path d="M5 19V5h14" stroke-width="3" stroke-linejoin="bevel" stroke-linecap="butt"/></svg>', 'Тайрсан булан']], o.strokeLineJoin || 'miter', 'sjoin') +
        segB([['butt', '<svg class="i" viewBox="0 0 24 24"><path d="M6 12h12" stroke-width="5" stroke-linecap="butt"/></svg>', 'Шулуун үзүүр'], ['round', '<svg class="i" viewBox="0 0 24 24"><path d="M6 12h12" stroke-width="5" stroke-linecap="round"/></svg>', 'Бөөрөнхий үзүүр'], ['square', '<svg class="i" viewBox="0 0 24 24"><path d="M7 12h10" stroke-width="5" stroke-linecap="square"/></svg>', 'Дөрвөлжин үзүүр']], o.strokeLineCap || 'butt', 'scap') +
      '</div>' +
      '<div style="margin-top:6px"><label class="nf full"><select data-q="dash">' + DASHES.map(function (d) { return '<option value="' + d[0] + '"' + (d[0] === dash ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select></label></div>';
    return h;
  }

  // ---------- effects ----------
  var FX_NAMES = { drop: 'Drop shadow', inner: 'Inner shadow', blur: 'Layer blur', bgblur: 'Background blur', noise: 'Noise', glass: 'Glass' };
  var FX_HELP = { drop: 'Ард сүүдэр', inner: 'Дотор сүүдэр', blur: 'Бүхэлд нь бүдгэрүүлэх', bgblur: 'Ард байгааг бүдгэрүүлэх', noise: 'Ширхэглэг бүтэц', glass: 'Шил (frosted)' };
  function fxList(o) {
    // older designs: a native shadow becomes the first effect
    var l = dcopy(o.gFx) || [];
    if (o.shadow && !l.some(function (e) { return e.t === 'drop'; })) l.unshift({ t: 'drop', on: true, x: o.shadow.offsetX, y: o.shadow.offsetY, b: o.shadow.blur, c: o.shadow.color });
    return l;
  }
  function setFx(o, l) { o.gFx = l.length ? l : null; GX.sync(o); }
  function fxDefaults(t) {
    var u = Math.max(1, Math.round(Math.min(W, H) / 100));
    if (t === 'drop') return { t: t, on: true, x: 0, y: u, b: u * 2, c: 'rgba(0,0,0,0.25)' };
    if (t === 'inner') return { t: t, on: true, x: 0, y: u, b: u * 2, c: 'rgba(0,0,0,0.3)' };
    if (t === 'blur') return { t: t, on: true, b: Math.max(2, Math.round(u * 0.6)) };
    if (t === 'bgblur') return { t: t, on: true, b: u * 3 };
    if (t === 'noise') return { t: t, on: true, a: 0.25, s: 1, mono: true };
    return { t: 'glass', on: true, b: u * 3, a: 1 };
  }
  function fxUI(o) {
    var l = fxList(o), h = '<div class="ps fx"><div class="ps-h">Эффект<span class="acts"><span class="pw"><button type="button" class="ib" data-b="fx:menu" title="Эффект нэмэх">' + icon('plus') + '</button>' +
      '<div class="menu r fx-menu" hidden>' + Object.keys(FX_NAMES).map(function (t) { return '<button type="button" data-b="fx:add:' + t + '">' + FX_NAMES[t] + '<i>' + FX_HELP[t] + '</i></button>'; }).join('') + '</div></span></span></div>';
    if (!l.length) h += '<p class="note" style="margin:0">Сүүдэр, бүдгэрүүлэлт, шил, ширхэг нэмэхийн тулд + дарна.</p>';
    l.forEach(function (e, i) {
      var q = function (key) { return 'fx:' + i + ':' + key; };
      h += '<div class="fx-row' + (e.on === false ? ' off' : '') + '"><div class="fx-h"><button type="button" class="ib" data-b="fx:eye:' + i + '" title="Харуулах / нуух">' + icon(e.on === false ? 'eyeOff' : 'eye') + '</button>' +
        '<b>' + FX_NAMES[e.t] + '</b><button type="button" class="ib rm" data-b="fx:del:' + i + '" title="Хасах">' + icon('minus') + '</button></div>';
      if (e.t === 'drop' || e.t === 'inner') {
        h += '<div class="r3">' + fnf('X', q('x'), e.x) + fnf('Y', q('y'), e.y) + fnf('Blur', q('b'), e.b) + '</div>' + fcol(q('c'), e.c);
      } else if (e.t === 'blur' || e.t === 'bgblur') {
        h += fsl('Хүч', q('b'), 0, Math.max(60, Math.round(Math.min(W, H) / 10)), e.b);
      } else if (e.t === 'noise') {
        h += fsl('Хэмжээ', q('a'), 0, 100, Math.round((e.a || 0) * 100), '%') + fsl('Ширхэг', q('s'), 1, 12, e.s || 1) +
          '<label class="chk"><input type="checkbox" data-q="' + q('mono') + '"' + (e.mono ? ' checked' : '') + '> Өнгөгүй (саарал)</label>';
      } else if (e.t === 'glass') {
        h += fsl('Бүдэг', q('b'), 0, Math.max(60, Math.round(Math.min(W, H) / 10)), e.b) + fsl('Гэрэл', q('a'), 0, 100, Math.round((e.a == null ? 1 : e.a) * 100), '%');
      }
      h += '</div>';
    });
    if (!GX.HAS_FILTER && l.some(function (e) { return e.t === 'bgblur' || e.t === 'glass'; })) h += '<p class="note">Энэ хөтөч дээр background blur удаан ажиллаж магадгүй.</p>';
    return h + '</div>';
  }
  function fnf(label, key, val) { return '<label class="nf"><span class="lb">' + label + '</span><input data-q="' + key + '" value="' + Math.round(val || 0) + '" inputmode="decimal"></label>'; }
  function fsl(label, key, min, max, v, unit) { return '<div class="sl"><span>' + label + '</span><input type="range" data-q="' + key + '" min="' + min + '" max="' + max + '" value="' + Math.round(v || 0) + '"><b>' + Math.round(v || 0) + (unit || '') + '</b></div>'; }
  function fcol(key, c) {
    var pc = parseCol(c);
    return '<div class="cr" style="margin-top:6px"><label class="nf full"><span class="csw"><i style="background:' + esc(c) + '"></i><input type="color" data-q="' + key + '" value="' + pc.hex + '"></span>' +
      '<input data-q="' + key + 'H" value="' + pc.hex.slice(1).toUpperCase() + '" maxlength="7" spellcheck="false"></label>' +
      '<label class="nf op"><input data-q="' + key + 'A" value="' + Math.round(pc.a * 100) + '" inputmode="decimal"><span class="unit">%</span></label></div>';
  }
  function editFx(fn) {
    eachSel(function (x) { if (x.isFrame) return; var l = fxList(x); fn(l, x); setFx(x, l); });
    canvas.requestRenderAll();
  }

  // ---------- masks ----------
  function makeMask() {
    var sel = active(); if (!sel || sel.type !== 'activeSelection') return toast('Маск хийхийн тулд 2+ зүйл сонгоно уу');
    var all = canvas.getObjects(), objs = sel.getObjects().filter(function (x) { return !x.isFrame; }).sort(function (a, b) { return all.indexOf(a) - all.indexOf(b); });
    if (objs.length < 2) return toast('Маск хийхийн тулд 2+ зүйл сонгоно уу');
    var mask = objs[0], rest = objs.slice(1), idx = all.indexOf(mask);
    canvas.discardActiveObject();
    mask.clone(function (mc) {
      restoring = true;
      objs.forEach(function (x) { canvas.remove(x); });
      var g = new fabric.Group(rest, { name: 'Маск' });
      var gc = g.getCenterPoint(), mcc = mask.getCenterPoint();
      mc.set({ originX: 'center', originY: 'center', left: mcc.x - gc.x, top: mcc.y - gc.y, shadow: null, opacity: 1, absolutePositioned: false, gFx: null });
      g.clipPath = mc; g.gMaskGroup = { name: mask.name || objName(mask) };
      canvas.insertAt(g, idx);
      restoring = false;
      canvas.setActiveObject(g); canvas.requestRenderAll(); commit(); refreshUI();
      toast('Хамгийн доод давхарга маск боллоо');
    }, PROPS);
  }
  function releaseMask(g) {
    if (!g || g.type !== 'group' || !g.clipPath) return;
    var cp = g.clipPath, M = g.calcTransformMatrix(), idx = canvas.getObjects().indexOf(g);
    cp.clone(function (mc) {
      var c = fabric.util.transformPoint({ x: cp.left, y: cp.top }, M);
      mc.set({ originX: 'center', originY: 'center', left: c.x, top: c.y, angle: (cp.angle || 0) + (g.angle || 0), scaleX: cp.scaleX * g.scaleX, scaleY: cp.scaleY * g.scaleY, inverted: false, absolutePositioned: false, name: (g.gMaskGroup && g.gMaskGroup.name) || 'Маск хэлбэр' });
      var tl = mc.getPointByOrigin('left', 'top'); mc.set({ originX: 'left', originY: 'top', left: tl.x, top: tl.y });
      g.clipPath = null; g.gMaskGroup = null;
      restoring = true;
      canvas.setActiveObject(g); var s = g.toActiveSelection();
      canvas.insertAt(mc, idx); mc.setCoords();
      restoring = false;
      canvas.discardActiveObject();
      canvas.setActiveObject(new fabric.ActiveSelection(s.getObjects().concat([mc]), { canvas: canvas }));
      canvas.requestRenderAll(); commit(); refreshUI();
    }, PROPS);
  }

  // ---------- extra image mask shapes ----------
  var MASK_SHAPES = [['none', 'Тэгш өнцөгт'], ['rounded', 'Бөөрөнхий булантай'], ['circle', 'Тойрог'], ['oval', 'Зууван'], ['arch', 'Нуман хаалга'],
    ['star', 'Од'], ['triangle', 'Гурвалжин'], ['hexagon', 'Зургаан өнцөгт'], ['diamond', 'Ромбо'], ['heart', 'Зүрх'], ['blob', 'Бөөрөнхий хэлбэр']];
  function polyPts(n, R, r, rot) { var p = []; for (var i = 0; i < n; i++) { var a = rot + Math.PI * 2 * i / n, rr = r != null && i % 2 ? r : R; p.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); } return p; }
  function extraMask(img, kind) {
    var w = img.width, h = img.height, m = Math.min(w, h) / 2, cp = null, o = { originX: 'center', originY: 'center' };
    if (kind === 'star') cp = new fabric.Polygon(polyPts(10, m, m * 0.45, -Math.PI / 2), o);
    if (kind === 'triangle') cp = new fabric.Polygon([{ x: 0, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }], o);
    if (kind === 'hexagon') cp = new fabric.Polygon(polyPts(6, m, null, 0), o);
    if (kind === 'diamond') cp = new fabric.Polygon([{ x: 0, y: -h / 2 }, { x: w / 2, y: 0 }, { x: 0, y: h / 2 }, { x: -w / 2, y: 0 }], o);
    if (kind === 'heart') { var s = m / 12; cp = new fabric.Path('M 0 ' + (-3 * s) + ' C ' + (-2 * s) + ' ' + (-10 * s) + ' ' + (-12 * s) + ' ' + (-8 * s) + ' ' + (-11 * s) + ' ' + (-1 * s) + ' C ' + (-10 * s) + ' ' + (4 * s) + ' ' + (-3 * s) + ' ' + (7 * s) + ' 0 ' + (11 * s) + ' C ' + (3 * s) + ' ' + (7 * s) + ' ' + (10 * s) + ' ' + (4 * s) + ' ' + (11 * s) + ' ' + (-1 * s) + ' C ' + (12 * s) + ' ' + (-8 * s) + ' ' + (2 * s) + ' ' + (-10 * s) + ' 0 ' + (-3 * s) + ' Z', o); }
    if (kind === 'blob') { var k = Math.min(w, h) / 200; cp = new fabric.Path('M 60 -85 C 95 -60 100 -15 90 25 C 80 70 40 95 -5 92 C -55 90 -95 60 -98 15 C -100 -35 -70 -80 -25 -95 C 5 -103 35 -100 60 -85 Z', Object.assign({ scaleX: k, scaleY: k }, o)); }
    if (!cp) return false;
    img.gMask = kind; img.gMaskR = null; img.set({ clipPath: cp, dirty: true });
    return true;
  }

  // ---------- the panel handlers for all of the above ----------
  function numq(v) { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; }
  function hexq(v) { var hx = String(v).replace(/[^0-9a-f]/gi, ''); if (hx.length === 3) hx = hx.replace(/./g, '$&$&'); return hx.length === 6 ? '#' + hx.toLowerCase() : null; }
  function qInput(key, v, live) {
    var parts = key.split(':'), a = parts[0], n = numq(v);
    if (a === 'fill' || a === 'stroke') {
      var which = a, sub = parts[1], i = +parts[2];
      if (sub === 'type') return switchPaint(which, v);
      if (sub === 'fit' || sub === 'scale') return editPaint('fill', function (g) { if (sub === 'fit') g.fit = v; else g.scale = (n || 100) / 100; }).then(function () { if (!live) commit(); });
      if (sub === 'angle' && n !== null) return editPaint(which, function (g) { g.angle = n; }).then(function () { if (!live) commit(); });
      if (sub === 'radius' && n !== null) return editPaint(which, function (g) { g.r = n / 200; });
      return editPaint(which, function (g) {
        var s = g.stops[i]; if (!s) return;
        paintSel[which] = i;
        if (sub === 'p' && n !== null) s.p = clamp(n, 0, 100) / 100;
        if (sub === 'c') s.c = v;
        if (sub === 'h') { var hx = hexq(v); if (hx) s.c = hx; }
        if (sub === 'a' && n !== null) s.a = clamp(n, 0, 100) / 100;
      }).then(function () { if (!live) commit(); });
    }
    if (a === 'dash') { eachSel(function (x) { var d = DASHES.filter(function (dd) { return dd[0] === v; })[0], sw = x.strokeWidth || 1; x.set({ strokeDashArray: d && d[2] ? d[2].map(function (q) { return q * sw; }) : null }); if (d && d[0] === 'dot') x.set('strokeLineCap', 'round'); }); canvas.requestRenderAll(); commit(); return; }
    if (a === 'fx') {
      var j = +parts[1], k = parts[2];
      editFx(function (l) {
        var e = l[j]; if (!e) return;
        if (k === 'mono') e.mono = !!v;
        else if (k === 'c') e.c = mkCol(v, parseCol(e.c).a);
        else if (k === 'cH') { var hx = hexq(v); if (hx) e.c = mkCol(hx, parseCol(e.c).a); }
        else if (k === 'cA') { if (n !== null) e.c = mkCol(parseCol(e.c).hex, clamp(n, 0, 100) / 100); }
        else if (n !== null) e[k] = k === 'a' ? n / 100 : n;
      });
      if (!live) commit();
    }
  }
  rp.addEventListener('input', function (e) {
    var t = e.target, q = t.dataset.q; if (!q) return;
    if (t.type === 'range') { var b = t.nextElementSibling; if (b) b.textContent = t.value + (/:(a|scale|radius)$/.test(q) && !/^fx:\d+:s$/.test(q) ? '%' : ''); qInput(q, t.value, true); }
    else if (t.type === 'color') { t.previousElementSibling.style.background = t.value; qInput(q, t.value, true); }
  });
  rp.addEventListener('change', function (e) {
    var t = e.target, q = t.dataset.q; if (!q) return;
    var r = qInput(q, t.type === 'checkbox' ? t.checked : t.value, false);
    Promise.resolve(r).then(function () { commit(); if (t.type !== 'range') refreshUI(); });
  });
  rp.addEventListener('click', function (e) {
    var b = e.target.closest('[data-b]'); if (!b) return;
    var parts = b.dataset.b.split(':'), a = parts[0], o = active();
    if (a === 'fx') {
      var sub = parts[1];
      if (sub === 'menu') { var m = b.parentNode.querySelector('.fx-menu'); m.hidden = !m.hidden; e.stopPropagation(); return; }
      if (sub === 'add') {
        var t = parts[2];
        editFx(function (l, x) {
          if (t === 'drop' && l.some(function (q) { return q.t === 'drop'; })) return;
          l.push(fxDefaults(t));
          if (t === 'glass') {
            if (typeof x.fill === 'string' && !x.isType('image')) x.set('fill', 'rgba(255,255,255,0.14)');
            if (!x.isType('image') && !x.isType('textbox')) x.set({ stroke: 'rgba(255,255,255,0.5)', strokeWidth: Math.max(1, Math.round(Math.min(W, H) / 700)), gStrokePos: 'inside' });
          }
        });
      }
      if (sub === 'eye') editFx(function (l) { var q = l[+parts[2]]; if (q) q.on = q.on === false; });
      if (sub === 'del') editFx(function (l) { l.splice(+parts[2], 1); });
      commit(); refreshUI(); return;
    }
    if (a === 'fill' || a === 'stroke') {
      var which = a, s2 = parts[1];
      if (s2 === 'img') { pickFillImage(o); return; }
      var job = editPaint(which, function (g) {
        if (s2 === 'swap') g.stops.forEach(function (s) { s.p = 1 - s.p; });
        if (s2 === 'rot') g.angle = ((g.angle || 0) + 90) % 360;
        if (s2 === 'addstop') {
          var srt = g.stops.slice().sort(function (x, y) { return x.p - y.p; }), gap = 0, at = 0.5;
          for (var i = 1; i < srt.length; i++) if (srt[i].p - srt[i - 1].p > gap) { gap = srt[i].p - srt[i - 1].p; at = (srt[i].p + srt[i - 1].p) / 2; }
          var c = GX.colorAt(g.stops, at), hex = '#' + [c[0], c[1], c[2]].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('');
          g.stops.push({ p: at, c: hex, a: c[3] }); paintSel[which] = g.stops.length - 1;
        }
        if (s2 === 'delstop' && g.stops.length > 2) { g.stops.splice(+parts[2], 1); paintSel[which] = 0; }
      });
      job.then(function () { commit(); refreshUI(); }); return;
    }
    if (a === 'spos' || a === 'sjoin' || a === 'scap') {
      eachSel(function (x) {
        if (a === 'spos') x.set({ gStrokePos: parts[1] === 'center' ? null : parts[1], dirty: true });
        if (a === 'sjoin') x.set('strokeLineJoin', parts[1]);
        if (a === 'scap') x.set('strokeLineCap', parts[1]);
      });
      canvas.requestRenderAll(); commit(); refreshUI(); return;
    }
    if (a === 'mask') { makeMask(); return; }
    if (a === 'bool') { booleanOp(parts[1]); return; }
    if (a === 'tovec' && o) { toVector(o); return; }
    if (a === 'cut' && o) { openCutout(o); return; }
    if (a === 'upx' && o) { openUpscale(o); return; }
    if (a === 'unmask') { releaseMask(o); return; }
    if (a === 'vedit' && o) { if (vedit) endVEdit(); else startVEdit(o); return; }
  });
  // drag gradient stops along the bar
  var gdrag = null;
  rp.addEventListener('pointerdown', function (e) {
    var st = e.target.closest('[data-gstop]'), bar = e.target.closest('[data-gbar]');
    if (!bar) return;
    var which = bar.dataset.gbar, r = bar.getBoundingClientRect(), pos = clamp((e.clientX - r.left) / r.width, 0, 1);
    if (!st) {
      // click on the bar adds a stop there
      editPaint(which, function (g) { var c = GX.colorAt(g.stops, pos); g.stops.push({ p: pos, c: '#' + [c[0], c[1], c[2]].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''), a: c[3] }); paintSel[which] = g.stops.length - 1; })
        .then(function () { commit(); refreshUI(); });
      return;
    }
    e.preventDefault();
    gdrag = { which: which, i: +st.dataset.gstop, bar: bar, el: st };
    paintSel[which] = gdrag.i;
    st.setPointerCapture && st.setPointerCapture(e.pointerId);
  });
  window.addEventListener('pointermove', function (e) {
    if (!gdrag) return;
    var r = gdrag.bar.getBoundingClientRect(), pos = clamp((e.clientX - r.left) / r.width, 0, 1), d = gdrag;
    d.el.style.left = (pos * 100) + '%';
    editPaint(d.which, function (g) { if (g.stops[d.i]) g.stops[d.i].p = Math.round(pos * 100) / 100; });
  });
  window.addEventListener('pointerup', function () { if (gdrag) { gdrag = null; commit(); refreshUI(); } });
  document.addEventListener('mousedown', function (e) { if (!e.target.closest('.fx-menu') && !e.target.closest('[data-b="fx:menu"]')) $$('.fx-menu').forEach(function (m) { m.hidden = true; }); });

  // angular / diamond / image paints are sized to the object: refresh them when text re-flows
  canvas.on('object:modified', function (ev) { var o = ev.target; if (o && o.isType && o.isType('textbox') && (o.gPaint || o.gPaintS)) { GX.applyPaint(o, 'fill'); GX.applyPaint(o, 'stroke'); } });
  canvas.on('text:changed', function (ev) { var o = ev.target; if (o && o.gPaint && /angular|diamond|image/.test(o.gPaint.type)) GX.applyPaint(o, 'fill').then(function () { canvas.requestRenderAll(); }); });


  // ================= combine (boolean), multi-select, manual cut-out =================

  // ---------- boolean operations with Paper.js ----------
  var paperP = null;
  function paperReady() {
    if (!paperP) paperP = (window.paper ? Promise.resolve() : loadScript('/assets/vendor/paper-core.min.js')).then(function () {
      window.paper.setup(document.createElement('canvas'));
    });
    paperP.catch(function () { paperP = null; });
    return paperP;
  }
  function boolable(o) { return !o.isFrame && !o.isType('textbox') && !o.isType('image') && !o.isType('line') && !(o.isType('path') && !(o.fill && o.fill !== 'transparent')) && o.type !== 'group'; }
  // one fabric object → one Paper path item in canvas coordinates
  function toPaper(o) {
    var P = window.paper, keep = { shadow: o.shadow, clipPath: o.clipPath };
    o.shadow = null; o.clipPath = null;
    var svg;
    try { svg = '<svg xmlns="http://www.w3.org/2000/svg">' + o.toSVG() + '</svg>'; } finally { o.shadow = keep.shadow; o.clipPath = keep.clipPath; }
    var item = P.project.importSVG(svg, { expandShapes: true, insert: false, applyMatrix: true });
    var parts = item.getItems({ match: function (it) { return (it instanceof P.CompoundPath) || (it instanceof P.Path && !(it.parent instanceof P.CompoundPath)); } });
    if (!parts.length) return null;
    var r = null;
    parts.forEach(function (src) { var m = src.parent ? src.parent.globalMatrix.clone() : new P.Matrix(), p = src.clone({ insert: false }); p.transform(m); r = r ? r.unite(p, { insert: false }) : p; });
    return r;
  }
  var BOOL = { union: 'Нэгтгэх', subtract: 'Хасах', intersect: 'Огтлолцол', exclude: 'Давхцлыг хасах' };
  function booleanOp(op) {
    var sel = active();
    if (!sel || sel.type !== 'activeSelection') return toast('2 ба түүнээс дээш хэлбэр сонгоно уу');
    var all = canvas.getObjects(), objs = sel.getObjects().slice().sort(function (a, b) { return all.indexOf(a) - all.indexOf(b); });
    var ok = objs.filter(boolable);
    if (ok.length < 2) return toast('Хэлбэр, од, эллипс, pen-ээр зурсан хаалттай дүрсийг нэгтгэнэ (текст, зургийг биш — зурагт «Маск» ашиглана)');
    toast(BOOL[op] + '…');
    // objects inside an ActiveSelection have group-relative coordinates: release them first
    canvas.discardActiveObject(); canvas.requestRenderAll();
    paperReady().then(function () {
      var base = toPaper(ok[0]);
      for (var i = 1; i < ok.length && base; i++) {
        var p = toPaper(ok[i]); if (!p) continue;
        base = op === 'union' ? base.unite(p, { insert: false }) : op === 'subtract' ? base.subtract(p, { insert: false }) : op === 'intersect' ? base.intersect(p, { insert: false }) : base.exclude(p, { insert: false });
      }
      var d = base && base.pathData;
      if (!d) { toast('Үр дүн хоосон байна — хэлбэрүүд давхцаагүй байж магадгүй'); return; }
      var b0 = ok[0], idx = all.indexOf(b0);
      var res = new fabric.Path(d, {
        fill: typeof b0.fill === 'string' || !b0.fill ? (b0.fill || '#816dfb') : b0.fill, fillRule: 'evenodd', stroke: b0.stroke, strokeWidth: b0.strokeWidth || 0,
        strokeLineJoin: b0.strokeLineJoin, opacity: b0.opacity, globalCompositeOperation: b0.globalCompositeOperation, name: BOOL[op]
      });
      res.gFx = dcopy(b0.gFx); res.gPaint = dcopy(b0.gPaint); res.gPaintS = dcopy(b0.gPaintS); res.gStrokePos = b0.gStrokePos;
      canvas.discardActiveObject();
      restoring = true;
      ok.forEach(function (x) { canvas.remove(x); });
      canvas.insertAt(res, Math.min(idx, canvas.getObjects().length));
      restoring = false;
      GX.sync(res);
      Promise.all([GX.applyPaint(res, 'fill'), GX.applyPaint(res, 'stroke')]).then(function () {
        canvas.setActiveObject(res); canvas.requestRenderAll(); commit(); refreshUI();
      });
    }).catch(function (e) { console.error(e); toast('Нэгтгэж чадсангүй'); });
  }
  // a single shape → editable vector path (so its points can be dragged)
  function toVector(o) {
    if (!o || !boolable(o) || o.isType('path')) return;
    paperReady().then(function () {
      var p = toPaper(o); if (!p) return;
      var idx = canvas.getObjects().indexOf(o);
      var res = new fabric.Path(p.pathData, { fill: o.fill, fillRule: 'evenodd', stroke: o.stroke, strokeWidth: o.strokeWidth || 0, opacity: o.opacity, name: (o.name || 'Хэлбэр') + ' (вектор)' });
      res.gFx = dcopy(o.gFx); res.gPaint = dcopy(o.gPaint); res.gPaintS = dcopy(o.gPaintS); res.gStrokePos = o.gStrokePos;
      restoring = true; canvas.remove(o); canvas.insertAt(res, idx); restoring = false;
      GX.sync(res);
      Promise.all([GX.applyPaint(res, 'fill'), GX.applyPaint(res, 'stroke')]).then(function () {
        canvas.setActiveObject(res); commit(); startVEdit(res);
      });
    });
  }

  // ---------- multi-select mode (tap to add / remove — for touch screens) ----------
  var multiSel = false, baseSelKey = canvas._isSelectionKeyPressed;
  canvas._isSelectionKeyPressed = function (e) { return multiSel || baseSelKey.call(this, e); };
  function setMulti(on) {
    multiSel = on; renderDock();
    toast(on ? 'Олноор сонгох: дарсан зүйл бүр сонголтод нэмэгдэнэ' : 'Олноор сонгох унтарлаа');
  }

  // ---------- manual cut-out editor: erase / restore brush, magic wand, lasso, AI ----------
  var cutOrig = {}; // result dataURL → original dataURL (so "restore" works after re-opening)
  function openCutout(img) {
    if (!img || !img.isType('image')) return;
    var srcNow = img.getSrc(), origSrc = cutOrig[srcNow] || srcNow;
    var cur = new Image(), orig = new Image(), loaded = 0;
    cur.crossOrigin = orig.crossOrigin = 'anonymous';
    cur.onload = orig.onload = function () { if (++loaded === 2) build(); };
    cur.onerror = orig.onerror = function () { toast('Зургийг нээж чадсангүй'); };
    cur.src = srcNow; orig.src = origSrc;

    function build() {
      var W0 = cur.naturalWidth, H0 = cur.naturalHeight;
      var k = Math.min(1, 3000 / Math.max(W0, H0)), Wc = Math.round(W0 * k), Hc = Math.round(H0 * k);
      var O = mk(Wc, Hc), M = mk(Wc, Hc), C = mk(Wc, Hc);
      var ox = O.getContext('2d'), mx = M.getContext('2d', { willReadFrequently: true }), cx = C.getContext('2d');
      // original pixels (for restore); mask = current alpha
      ox.drawImage(orig.naturalWidth === W0 ? orig : cur, 0, 0, Wc, Hc);
      mx.drawImage(cur, 0, 0, Wc, Hc);
      var st = { tool: 'erase', size: Math.max(8, Math.round(Math.max(Wc, Hc) / 30)), hard: 70, tol: 30, contig: true, ghost: true, zoom: 1 };
      var undoS = [], redoS = [];

      var m = document.createElement('div'); m.className = 'cut-modal';
      m.innerHTML =
        '<div class="cut-top"><b>Дэвсгэр гараар засах</b><span class="grow"></span>' +
          '<button type="button" class="ib" data-cu="undo" title="Буцаах (Ctrl+Z)">' + icon('undo') + '</button><button type="button" class="ib" data-cu="redo" title="Дахин">' + icon('redo') + '</button>' +
          '<button type="button" class="btn" data-cu="cancel">Болих</button><button type="button" class="btn-primary" data-cu="apply">Хадгалах</button></div>' +
        '<div class="cut-body"><div class="cut-view"><canvas></canvas></div>' +
        '<div class="cut-side">' +
          '<div class="ps-l" style="margin-top:0">Хэрэгсэл</div><div class="cut-tools">' +
            [['erase', 'eraser', 'Баллуур', 'Чирж арилгана'], ['restore', 'pen', 'Сэргээх', 'Арилгасан хэсгийг буцааж зурна'], ['wand', 'wand', 'Шидэт саваа', 'Ижил өнгөтэй хэсгийг дарж арилгана'],
              ['lasso', 'lassoI', 'Лассо', 'Тойруулж зураад дотор талыг арилгана'], ['lassoOut', 'lassoI', 'Лассо — гадна', 'Тойруулж зураад гадна талыг арилгана'], ['lassoIn', 'lassoI', 'Лассо — сэргээх', 'Тойруулсан хэсгийг сэргээнэ']].map(function (t) {
              return '<button type="button" class="ctool" data-ct="' + t[0] + '" title="' + t[3] + '">' + icon(t[1]) + '<span>' + t[2] + '</span></button>';
            }).join('') + '</div>' +
          '<div data-opt-brush><div class="sl"><span>Хэмжээ</span><input type="range" data-cs="size" min="2" max="' + Math.round(Math.max(Wc, Hc) / 6) + '" value="' + st.size + '"><b>' + st.size + '</b></div>' +
            '<div class="sl"><span>Хатуулаг</span><input type="range" data-cs="hard" min="0" max="100" value="' + st.hard + '"><b>' + st.hard + '</b></div></div>' +
          '<div data-opt-wand hidden><div class="sl"><span>Хүлцэл</span><input type="range" data-cs="tol" min="1" max="100" value="' + st.tol + '"><b>' + st.tol + '</b></div>' +
            '<label class="chk"><input type="checkbox" data-cs="contig" checked> Зөвхөн залгаа хэсэг</label><p class="note">Shift + дарах: сэргээх</p></div>' +
          '<div class="ps-l">Бүхэлд нь</div>' +
          '<button type="button" class="btn acc full" data-cu="ai">' + icon('wand') + 'AI-аар дэвсгэр арилгах</button>' +
          '<div class="r2" style="margin-top:6px"><button type="button" class="btn" data-cu="invert">Урвуулах</button><button type="button" class="btn" data-cu="reset">Анхных руу</button></div>' +
          '<button type="button" class="btn full" style="margin-top:6px" data-cu="soften">Ирмэгийг зөөлрүүлэх</button>' +
          '<div class="ps-l">Харагдац</div><label class="chk"><input type="checkbox" data-cs="ghost" checked> Арилгасан хэсгийг бүдэг харуулах</label>' +
          '<div class="sl"><span>Томруулах</span><input type="range" data-cs="zoom" min="100" max="400" value="100"><b>100%</b></div>' +
          '<p class="note">Зургийн жинхэнэ хэмжээ: ' + W0 + '×' + H0 + 'px. Хоёр хуруугаар / Ctrl+дугуйгаар томруулна.</p>' +
        '</div></div>';
      document.body.appendChild(m);
      var view = m.querySelector('.cut-view'), V = m.querySelector('canvas'), vx = V.getContext('2d');
      var fitK = 1, lasso = null, drawing = false, last = null, hover = null;

      function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
      function layout() {
        var r = view.getBoundingClientRect();
        fitK = Math.min((r.width - 24) / Wc, (r.height - 24) / Hc, 4);
        var s = fitK * st.zoom;
        V.style.width = Math.round(Wc * s) + 'px'; V.style.height = Math.round(Hc * s) + 'px';
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        V.width = Math.max(1, Math.round(Wc * s * dpr)); V.height = Math.max(1, Math.round(Hc * s * dpr));
        render();
      }
      function render() {
        cx.globalCompositeOperation = 'copy'; cx.drawImage(M, 0, 0);
        cx.globalCompositeOperation = 'source-in'; cx.drawImage(O, 0, 0);
        cx.globalCompositeOperation = 'source-over';
        var s = V.width / Wc;
        vx.setTransform(1, 0, 0, 1, 0, 0); vx.clearRect(0, 0, V.width, V.height);
        if (st.ghost) { vx.globalAlpha = 0.22; vx.drawImage(O, 0, 0, V.width, V.height); vx.globalAlpha = 1; }
        vx.drawImage(C, 0, 0, V.width, V.height);
        vx.setTransform(s, 0, 0, s, 0, 0);
        if (lasso && lasso.length > 1) {
          vx.beginPath(); vx.moveTo(lasso[0].x, lasso[0].y); lasso.forEach(function (p) { vx.lineTo(p.x, p.y); });
          vx.lineWidth = 2 / s; vx.strokeStyle = '#fff'; vx.setLineDash([]); vx.stroke(); vx.strokeStyle = ACC; vx.setLineDash([6 / s, 4 / s]); vx.stroke(); vx.setLineDash([]);
        }
        if (hover && (st.tool === 'erase' || st.tool === 'restore')) {
          vx.beginPath(); vx.arc(hover.x, hover.y, st.size / 2, 0, Math.PI * 2);
          vx.lineWidth = 1.5 / s; vx.strokeStyle = '#fff'; vx.stroke(); vx.lineWidth = 0.75 / s; vx.strokeStyle = '#000'; vx.stroke();
        }
      }
      function pos(e) { var r = V.getBoundingClientRect(); return { x: (e.clientX - r.left) * Wc / r.width, y: (e.clientY - r.top) * Hc / r.height }; }
      function save() { undoS.push(mx.getImageData(0, 0, Wc, Hc)); if (undoS.length > 6) undoS.shift(); redoS = []; }
      function stamp(x, y) {
        var r = st.size / 2, h = st.hard / 100;
        mx.globalCompositeOperation = st.tool === 'erase' ? 'destination-out' : 'source-over';
        if (h >= 0.98) { mx.fillStyle = '#fff'; mx.beginPath(); mx.arc(x, y, r, 0, Math.PI * 2); mx.fill(); }
        else {
          var g = mx.createRadialGradient(x, y, r * h, x, y, r);
          g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          mx.fillStyle = g; mx.beginPath(); mx.arc(x, y, r, 0, Math.PI * 2); mx.fill();
        }
        mx.globalCompositeOperation = 'source-over';
      }
      function line(a, b) {
        var d = Math.hypot(b.x - a.x, b.y - a.y), step = Math.max(1, st.size * 0.18), n = Math.ceil(d / step);
        for (var i = 1; i <= n; i++) stamp(a.x + (b.x - a.x) * i / n, a.y + (b.y - a.y) * i / n);
      }
      function wand(p, restore) {
        var x0 = Math.floor(p.x), y0 = Math.floor(p.y);
        if (x0 < 0 || y0 < 0 || x0 >= Wc || y0 >= Hc) return;
        var od = ox.getImageData(0, 0, Wc, Hc).data, md = mx.getImageData(0, 0, Wc, Hc), mdd = md.data;
        var i0 = (y0 * Wc + x0) * 4, R0 = od[i0], G0 = od[i0 + 1], B0 = od[i0 + 2], tol = st.tol * st.tol * 7.5;
        var match = function (i) { var dr = od[i] - R0, dg = od[i + 1] - G0, db = od[i + 2] - B0; return dr * dr + dg * dg + db * db <= tol; };
        var hit = new Uint8Array(Wc * Hc), q;
        if (st.contig) {
          q = new Int32Array(Wc * Hc); var qh = 0, qt = 0; q[qt++] = y0 * Wc + x0; hit[y0 * Wc + x0] = 1;
          while (qh < qt) {
            var id = q[qh++], x = id % Wc, y = (id - x) / Wc;
            var nb = [x > 0 ? id - 1 : -1, x < Wc - 1 ? id + 1 : -1, y > 0 ? id - Wc : -1, y < Hc - 1 ? id + Wc : -1];
            for (var j = 0; j < 4; j++) { var t = nb[j]; if (t >= 0 && !hit[t] && match(t * 4)) { hit[t] = 1; q[qt++] = t; } }
          }
        } else for (var k2 = 0; k2 < Wc * Hc; k2++) if (match(k2 * 4)) hit[k2] = 1;
        for (var k3 = 0; k3 < Wc * Hc; k3++) if (hit[k3]) { mdd[k3 * 4] = mdd[k3 * 4 + 1] = mdd[k3 * 4 + 2] = 255; mdd[k3 * 4 + 3] = restore ? 255 : 0; }
        mx.putImageData(md, 0, 0);
        // a 1px feather hides the jagged edge
        soften(0.8);
      }
      function soften(r) {
        var t = mk(Wc, Hc), tx = t.getContext('2d');
        tx.drawImage(M, 0, 0); mx.clearRect(0, 0, Wc, Hc);
        if (GX.HAS_FILTER) { mx.filter = 'blur(' + r + 'px)'; mx.drawImage(t, 0, 0); mx.filter = 'none'; }
        else { GX.blurCanvas(t, r); mx.drawImage(t, 0, 0); }
      }
      function fillLasso(pts, mode) {
        if (pts.length < 3) return;
        save();
        mx.beginPath();
        if (mode === 'lassoOut') mx.rect(0, 0, Wc, Hc);
        mx.moveTo(pts[0].x, pts[0].y); pts.forEach(function (p) { mx.lineTo(p.x, p.y); }); mx.closePath();
        mx.globalCompositeOperation = mode === 'lassoIn' ? 'source-over' : 'destination-out';
        mx.fillStyle = '#fff'; mx.fill(mode === 'lassoOut' ? 'evenodd' : 'nonzero');
        mx.globalCompositeOperation = 'source-over';
      }
      function setTool(t) {
        st.tool = t;
        m.querySelectorAll('[data-ct]').forEach(function (b) { b.classList.toggle('on', b.dataset.ct === t); });
        m.querySelector('[data-opt-brush]').hidden = !(t === 'erase' || t === 'restore');
        m.querySelector('[data-opt-wand]').hidden = t !== 'wand';
        V.style.cursor = t === 'wand' ? 'crosshair' : /lasso/.test(t) ? 'crosshair' : 'none';
        render();
      }
      V.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        V.setPointerCapture(e.pointerId);
        var p = pos(e);
        if (st.tool === 'wand') { save(); wand(p, e.shiftKey || e.altKey); render(); return; }
        if (/lasso/.test(st.tool)) { lasso = [p]; drawing = true; return; }
        save(); drawing = true; last = p; stamp(p.x, p.y); render();
      });
      V.addEventListener('pointermove', function (e) {
        var p = pos(e); hover = p;
        if (drawing && lasso) { var l = lasso[lasso.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) > 2 / (V.width / Wc)) lasso.push(p); }
        else if (drawing) { line(last, p); last = p; }
        render();
      });
      V.addEventListener('pointerup', function () {
        if (lasso) { fillLasso(lasso, st.tool); lasso = null; }
        drawing = false; last = null; render();
      });
      V.addEventListener('pointerleave', function () { hover = null; render(); });
      view.addEventListener('wheel', function (e) {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault(); zoomTo(st.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
      }, { passive: false });
      var pinch = null;
      view.addEventListener('touchstart', function (e) { if (e.touches.length === 2) { drawing = false; lasso = null; pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), z: st.zoom }; } }, { passive: true });
      view.addEventListener('touchmove', function (e) { if (pinch && e.touches.length === 2) { e.preventDefault(); zoomTo(pinch.z * Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY) / pinch.d); } }, { passive: false });
      view.addEventListener('touchend', function () { pinch = null; });
      function zoomTo(z) {
        st.zoom = clamp(z, 1, 6);
        var zi = m.querySelector('[data-cs="zoom"]'); zi.value = Math.min(400, Math.round(st.zoom * 100)); zi.nextElementSibling.textContent = Math.round(st.zoom * 100) + '%';
        layout();
      }
      m.addEventListener('input', function (e) {
        var t = e.target, k = t.dataset.cs; if (!k) return;
        if (t.type === 'range') { t.nextElementSibling.textContent = t.value + (k === 'zoom' ? '%' : ''); }
        if (k === 'size' || k === 'hard' || k === 'tol') st[k] = +t.value;
        if (k === 'zoom') { st.zoom = +t.value / 100; layout(); }
        if (k === 'ghost') { st.ghost = t.checked; render(); }
        if (k === 'contig') st.contig = t.checked;
      });
      function close() { m.remove(); window.removeEventListener('resize', layout); document.removeEventListener('keydown', onKey, true); }
      function onKey(e) {
        if (e.key === 'Escape') { e.stopPropagation(); close(); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.stopPropagation(); act(e.shiftKey ? 'redo' : 'undo'); }
        if (e.key === '[' || e.key === ']') { st.size = clamp(st.size + (e.key === ']' ? 1 : -1) * Math.max(2, st.size * 0.15), 2, Math.max(Wc, Hc) / 6); var si = m.querySelector('[data-cs="size"]'); si.value = st.size; si.nextElementSibling.textContent = Math.round(st.size); render(); }
      }
      document.addEventListener('keydown', onKey, true);
      function act(a) {
        if (a === 'undo' && undoS.length) { redoS.push(mx.getImageData(0, 0, Wc, Hc)); mx.putImageData(undoS.pop(), 0, 0); }
        if (a === 'redo' && redoS.length) { undoS.push(mx.getImageData(0, 0, Wc, Hc)); mx.putImageData(redoS.pop(), 0, 0); }
        if (a === 'invert') { save(); var d = mx.getImageData(0, 0, Wc, Hc); for (var i = 3; i < d.data.length; i += 4) { d.data[i - 3] = d.data[i - 2] = d.data[i - 1] = 255; d.data[i] = 255 - d.data[i]; } mx.putImageData(d, 0, 0); }
        if (a === 'reset') { save(); mx.globalCompositeOperation = 'copy'; mx.fillStyle = '#fff'; mx.fillRect(0, 0, Wc, Hc); mx.globalCompositeOperation = 'source-over'; }
        if (a === 'soften') { save(); soften(Math.max(1, Math.max(Wc, Hc) / 800)); }
        if (a === 'ai') {
          var b = m.querySelector('[data-cu="ai"]'); b.disabled = true; b.lastChild.textContent = 'AI ажиллаж байна…';
          aiMask(O).then(function (mc) {
            save(); mx.globalCompositeOperation = 'copy'; mx.imageSmoothingQuality = 'high'; mx.drawImage(mc, 0, 0, Wc, Hc); mx.globalCompositeOperation = 'source-over';
            render(); toast('AI дэвсгэрийг арилгалаа — илүүдэл, дутуу хэсгийг баллуур / сэргээхээр засаарай');
          }).catch(function () { toast('AI ажиллаж чадсангүй. Интернэтээ шалгана уу.'); })
            .then(function () { b.disabled = false; b.lastChild.textContent = 'AI-аар дэвсгэр арилгах'; });
        }
        if (a === 'cancel') return close();
        if (a === 'apply') {
          render();
          var url = C.toDataURL('image/png');
          cutOrig[url] = origSrc;
          var kx = W0 / Wc, keep = { width: img.width / kx, height: img.height / kx, cropX: (img.cropX || 0) / kx, cropY: (img.cropY || 0) / kx, scaleX: img.scaleX * kx, scaleY: img.scaleY * kx };
          img.setSrc(url, function () { img.set(keep); img.set('dirty', true); img.applyFilters(); canvas.requestRenderAll(); commit(); refreshUI(); toast('Зураг хадгалагдлаа'); });
          return close();
        }
        render();
      }
      m.addEventListener('click', function (e) {
        var t = e.target.closest('[data-ct]'); if (t) return setTool(t.dataset.ct);
        var b = e.target.closest('[data-cu]'); if (b) act(b.dataset.cu);
      });
      window.addEventListener('resize', layout);
      setTool('erase'); layout();
    }
  }


  // ================= AI upscale inside the editor (Real-ESRGAN, in the browser) =================
  var upP = null;
  function upReady() {
    if (!upP) upP = (window.GUpscale ? Promise.resolve() : loadScript('/assets/upscaler.js')).then(function () { return window.GUpscale.ready(); });
    upP.catch(function () { upP = null; });
    return upP;
  }
  function openUpscale(img) {
    if (!img || !img.isType('image')) return;
    var el = img._originalElement || img.getElement(), W0 = el.naturalWidth || el.width, H0 = el.naturalHeight || el.height;
    var shownW = Math.round(img.getScaledWidth()), shownH = Math.round(img.getScaledHeight());
    var st = { scale: 2, denoise: 0.6, sharpen: 0, busy: false, out: null, src: null };
    // how blurry is it on the canvas right now? (image pixels per displayed pixel)
    var density = W0 / Math.max(1, img.getScaledWidth());
    var m = document.createElement('div'); m.className = 'cut-modal up-modal';
    m.innerHTML =
      '<div class="cut-top"><b>✦ AI сайжруулах</b><span class="up-meta"></span><span class="grow"></span>' +
        '<button type="button" class="btn" data-up="cancel">Болих</button><button type="button" class="btn-primary" data-up="apply" disabled>Хэрэглэх</button></div>' +
      '<div class="cut-body"><div class="cut-view up-view">' +
        '<div class="cmp"><img class="cmp-a" alt="Сайжруулсан"><div class="cmp-b"><img alt="Анхны"></div><span class="cmp-l"></span>' +
        '<span class="cmp-t l">ӨМНӨ</span><span class="cmp-t r">ДАРАА</span><input class="cmp-r" type="range" min="0" max="100" value="50" aria-label="Өмнө / дараа"></div></div>' +
      '<div class="cut-side">' +
        '<div class="up-q"><b>1. Хэд дахин томруулах вэ?</b><span>Том хэвлэх, дэлгэцэнд тод харагдуулахад</span></div>' +
        '<div class="seg up-seg"><button type="button" data-us="scale" data-v="2" class="on">2 дахин<small>Хурдан · ихэнхэд хангалттай</small></button><button type="button" data-us="scale" data-v="4">4 дахин<small>Удаан · маш жижиг зурагт</small></button></div>' +
        '<div class="up-q"><b>2. Зургийг хэр цэвэрлэх вэ?</b><span>Бүдэг, цэг цэг, шахагдаж муудсан хэсгийг арилгана</span></div>' +
        '<div class="seg up-seg"><button type="button" data-us="denoise" data-v="0.2">Зөөлөн<small>Жижиг хээг хадгална</small></button><button type="button" data-us="denoise" data-v="0.6" class="on">Энгийн<small>Санал болгох</small></button><button type="button" data-us="denoise" data-v="1">Хүчтэй<small>Гөлгөр, цэвэрхэн</small></button></div>' +
        '<div class="up-q"><b>3. Ирмэгийг тодруулах уу?</b><span>Текст, лого, зураасыг илүү хурц харагдуулна</span></div>' +
        '<div class="seg up-seg"><button type="button" data-us="sharpen" data-v="0" class="on">Үгүй<small>Байгалийн</small></button><button type="button" data-us="sharpen" data-v="0.25">Бага зэрэг</button><button type="button" data-us="sharpen" data-v="0.5">Илүү тод</button></div>' +
        '<button type="button" class="btn acc full" style="margin-top:12px;height:36px" data-up="run">✦ Зургийг сайжруулах</button>' +
        '<div class="up-bar" hidden><i></i></div><p class="note up-st"></p>' +
        '<p class="note">Зураг canvas дээр яг одоогийн хэмжээгээрээ үлдэнэ — зөвхөн чанар, нарийвчлал нь нэмэгдэнэ. Хэрэглэсний дараа Ctrl+Z-ээр буцааж болно.</p>' +
        '<p class="note">Real-ESRGAN хиймэл оюун таны төхөөрөмж дээр ажиллана. Анх удаа загвар (~5MB) ачаална.</p>' +
      '</div></div>';
    document.body.appendChild(m);
    var q = function (s) { return m.querySelector(s); };
    var a = q('.cmp-a'), bWrap = q('.cmp-b'), b = q('.cmp-b img'), line = q('.cmp-l'), rng = q('.cmp-r');
    // source canvas (pre-filter original); big images are reduced so the result stays ≤ ~4800px
    function srcCanvas() {
      var maxIn = st.scale === 4 ? 1000 : 1600, k = Math.min(1, maxIn / Math.max(W0, H0));
      var c = document.createElement('canvas'); c.width = Math.round(W0 * k); c.height = Math.round(H0 * k);
      var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(el, 0, 0, c.width, c.height);
      return c;
    }
    function meta() {
      var c = srcCanvas();
      q('.up-meta').textContent = W0 + '×' + H0 + ' px → ' + c.width * st.scale + '×' + c.height * st.scale + ' px' + (density < 1 ? ' · canvas дээр ' + Math.round(1 / density * 100) + '% томруулж харуулж байна' : '');
      if (!st.out) q('.up-st').textContent = density < 0.9 ? 'Энэ зураг canvas дээр жинхэнэ хэмжээнээсээ том харагдаж байгаа тул бүдэг байна — сайжруулахад тохиромжтой.' : 'Бэлэн. Тохиргоогоо сонгоод «Зургийг сайжруулах» дарна уу.';
    }
    var url0 = (function () { var c = document.createElement('canvas'); c.width = W0; c.height = H0; c.getContext('2d').drawImage(el, 0, 0); return c.toDataURL('image/png'); })();
    a.src = b.src = url0;
    function split(v) { bWrap.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)'; line.style.left = v + '%'; }
    rng.addEventListener('input', function () { split(+rng.value); }); split(50);
    // show the image as large as the view allows (small images are enlarged, so the difference is visible)
    function fit() {
      var r = q('.up-view').getBoundingClientRect(), k = Math.min((r.width - 32) / W0, (r.height - 32) / H0, 6);
      a.style.width = Math.round(W0 * k) + 'px'; a.style.height = Math.round(H0 * k) + 'px';
    }
    fit(); window.addEventListener('resize', fit);
    // zoom the preview so detail is visible: show 1:1 of the centre when the image is large
    meta();
    function close() { m.remove(); document.removeEventListener('keydown', onKey, true); window.removeEventListener('resize', fit); }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); if (!st.busy) close(); } }
    document.addEventListener('keydown', onKey, true);
    m.addEventListener('click', function (e) {
      var o = e.target.closest('[data-us]');
      if (o && !st.busy) {
        st[o.dataset.us] = +o.dataset.v;
        m.querySelectorAll('[data-us="' + o.dataset.us + '"]').forEach(function (x) { x.classList.toggle('on', x === o); });
        if (st.out) { st.out = null; a.src = url0; q('[data-up="apply"]').disabled = true; }
        meta(); return;
      }
      var btn = e.target.closest('[data-up]'); if (!btn) return;
      var act = btn.dataset.up;
      if (act === 'cancel' && !st.busy) close();
      if (act === 'run' && !st.busy) {
        st.busy = true; btn.disabled = true; q('.up-bar').hidden = false; q('.up-bar i').style.width = '0%';
        q('.up-st').textContent = 'AI загвар ачаалж байна…';
        var c = srcCanvas(), t0 = performance.now();
        upReady().then(function () {
          return window.GUpscale.run(c, st, function (p) { q('.up-bar i').style.width = Math.round(p * 100) + '%'; q('.up-st').textContent = 'Сайжруулж байна… ' + Math.round(p * 100) + '% (' + window.GUpscale.backend() + ')'; });
        }).then(function (out) {
          st.out = out;
          a.src = out.toDataURL('image/png');
          q('.up-st').textContent = 'Болсон · ' + out.width + '×' + out.height + ' px · ' + ((performance.now() - t0) / 1000).toFixed(1) + ' сек. Гулсуулагчаар харьцуулаад «Хэрэглэх» дарна уу.';
          q('[data-up="apply"]').disabled = false;
        }).catch(function (err) {
          console.error(err); q('.up-st').textContent = 'Алдаа гарлаа. 2× сонгоод дахин оролдоно уу.';
        }).then(function () { st.busy = false; btn.disabled = false; setTimeout(function () { q('.up-bar').hidden = true; }, 500); });
      }
      if (act === 'apply' && st.out && !st.busy) {
        var out = st.out, url = out.toDataURL('image/png'), f = out.width / W0;
        var keep = { width: img.width * f, height: img.height * f, cropX: (img.cropX || 0) * f, cropY: (img.cropY || 0) * f, scaleX: img.scaleX / f, scaleY: img.scaleY / f };
        img.setSrc(url, function () {
          img.set(keep); img.set('dirty', true); img.applyFilters(); img.setCoords();
          canvas.requestRenderAll(); commit(); refreshUI();
          toast('Зураг ' + out.width + '×' + out.height + 'px боллоо ✦');
        });
        close();
      }
    });
  }


  // ---------- UI refresh ----------

  function updateHint() { $('#ed-hint').hidden = userObjects().length > 0 || tool === 'draw' || tool === 'vector'; }
  function refreshUI() { renderLeft(); renderRight(); renderCtxbar(); updateHint(); histButtons(); }

  // ---------- boot ----------

  window.GEditor = { canvas: canvas, frames: frames, renderFrame: renderFrame, addFrame: addFrame, useTemplate: useTemplate, setTool: setTool };
  window.addEventListener('resize', function () { resizeCanvas(); canvas.requestRenderAll(); });
  renderDock();
  resizeCanvas();

  loadDesignGuide().then(function () {
    var p = currentPair(); ensureFont('Manrope'); ensureFont(p.heading); ensureFont(p.body);
    return dbGet('doc');
  }).then(function (saved) {
    if (saved) return restore(saved).then(function () { hist = [saved]; hi = 0; histButtons(); });
    addFrame(1080, 1350); fitAll();
    hist = [snapshot()]; hi = 0; histButtons(); refreshUI();
  }).then(function () {
    return window.GHandoff ? window.GHandoff.take() : null;
  }).then(function (h) {
    if (h && h.blob) {
      var empty = !userObjects().length;
      addImageBlob(h.blob, { fillFrame: empty }).then(function () { toast('Зураг засварлагчид орлоо'); });
    } else if (prefs.pair && prefs.fresh) toast('Design guide-ээс: ' + prefs.pair.heading + ' + ' + prefs.pair.body);
    if (prefs.fresh) { prefs.fresh = false; try { localStorage.setItem('gc-editor-prefs', JSON.stringify(prefs)); } catch (e) {} }
    refreshUI();
  });
})();
