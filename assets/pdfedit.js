/* Graphican PDF editor — Acrobat-style editing in the browser.
   pdf.js renders pages, one Fabric.js canvas per page holds the edits, pdf-lib writes the result:
   original pages are copied untouched (text stays vector & selectable) and edits are drawn on top.
   Coordinates: every page works in "view units" = PDF points at 100 % zoom, in the page's displayed
   (rotated) orientation. vpT() maps PDF user space → view exactly like pdf.js' PageViewport. */
(function () {
  'use strict';

  var G = window.GFile;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var root = $('#pe'), view = $('#pe-view'), pagesEl = $('#pe-pages'), thumbsEl = $('#pe-thumbs'), propsEl = $('#pe-props');
  var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  var isMob = function () { return window.innerWidth <= 760; };

  // ---------- small helpers ----------
  var toastT;
  function toast(msg, ms) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, ms || 2600);
  }
  function busy(on, txt) { $('#pe-busy').hidden = !on; if (txt) $('#pe-busy-t').textContent = txt; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function saveBlob(name, blob) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function hexRgb(h) {
    h = String(h || '#000').replace('#', '');
    if (/^rgba?\(/.test(h)) { var m = h.match(/[\d.]+/g); return [m[0] / 255, m[1] / 255, m[2] / 255]; }
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h.slice(0, 6), 16) || 0;
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function toHex(r, g, b) { return '#' + [r, g, b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }

  var I = {
    select: '<path d="M5 3l14 7-6 2-2 6z"/>',
    edit: '<path d="M4 7V5h11v2M9.5 5v14M7 19h5"/><path d="M14 19l1-3.5 5-5 2.5 2.5-5 5z"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    hl: '<path d="M4 20h16"/><path d="M8 16l-1-3 8-8 4 4-8 8z"/>',
    draw: '<path d="M4 18c3-6 5-10 7-10s-1 9 2 9 3-6 7-9"/>',
    rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8" ry="6"/>',
    line: '<path d="M5 19L19 5"/>',
    arrow: '<path d="M5 19L19 5M10 5h9v9"/>',
    wo: '<rect x="4" y="7" width="16" height="10" rx="1" fill="currentColor" fill-opacity=".18"/><path d="M8 12h8" stroke-dasharray="2 2"/>',
    image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20 16l-5-5-8 8"/>',
    sign: '<path d="M3 17c2-1 3-5 5-5s0 5 2 5 3-7 5-7-1 7 1 7 3-2 5-2"/><path d="M3 21h18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    cross: '<path d="M6 6l12 12M18 6L6 18"/>',
    date: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 000 12h3"/>',
    rotL: '<path d="M4 4v5h5"/><path d="M4.5 13a8 8 0 102-6.5L4 9"/>',
    rotR: '<path d="M20 4v5h-5"/><path d="M19.5 13a8 8 0 11-2-6.5L20 9"/>',
    del: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    dup: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    blank: '<path d="M6 3h8l4 4v14H6z"/><path d="M12 10v6M9 13h6"/>',
    addf: '<path d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M12 10v6M9 13h6"/>',
    extract: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
    front: '<rect x="8" y="8" width="12" height="12" rx="1" fill="currentColor" fill-opacity=".25"/><path d="M4 16V4h12"/>',
    back: '<rect x="4" y="4" width="12" height="12" rx="1"/><path d="M20 8v12H8"/>'
  };
  function ic(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + I[n] + '</svg>'; }

  // ---------- geometry: PDF ⇄ view (same maths as pdf.js PageViewport) ----------
  function vpT(v, rot, s) {
    s = s || 1;
    var cx = (v[2] + v[0]) / 2, cy = (v[3] + v[1]) / 2, A, B, C, D;
    rot = ((rot % 360) + 360) % 360;
    if (rot === 90) { A = 0; B = 1; C = 1; D = 0; }
    else if (rot === 180) { A = -1; B = 0; C = 0; D = 1; }
    else if (rot === 270) { A = 0; B = -1; C = -1; D = 0; }
    else { A = 1; B = 0; C = 0; D = -1; }
    var ox, oy;
    if (A === 0) { ox = Math.abs(cy - v[1]) * s; oy = Math.abs(cx - v[0]) * s; }
    else { ox = Math.abs(cx - v[0]) * s; oy = Math.abs(cy - v[1]) * s; }
    return [A * s, B * s, C * s, D * s, ox - A * s * cx - C * s * cy, oy - B * s * cx - D * s * cy];
  }
  function inv(m) {
    var d = m[0] * m[3] - m[1] * m[2];
    return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d];
  }
  function ap(m, x, y) { return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] }; }
  function mul(m1, m2) { // m1 ∘ m2
    return [m1[0] * m2[0] + m1[2] * m2[1], m1[1] * m2[0] + m1[3] * m2[1], m1[0] * m2[2] + m1[2] * m2[3], m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4], m1[1] * m2[4] + m1[3] * m2[5] + m1[5]];
  }
  function R(p) { return (((p.rot0 + p.rot) % 360) + 360) % 360; }
  function dims(p) {
    var w = Math.abs(p.view[2] - p.view[0]), h = Math.abs(p.view[3] - p.view[1]);
    return R(p) % 180 ? { w: h, h: w } : { w: w, h: h };
  }

  // ---------- state ----------
  var sources = [];   // { bytes, doc (pdf.js), name, pl (pdf-lib doc promise) }
  var pages = [];     // { id, src, idx, rot0, rot, view, objs, fab, el, canvas, rs, thumb }
  var zoom = 1, fitMode = true, mode = 'select', cur = null, selPages = {};
  var style = { color: '#1e1e1e', stroke: '#e5484d', width: 2, fill: '', hl: '#ffd84d', font: 'Inter', size: 14, bold: false, align: 'left', opacity: 1 };
  var PROPS = ['data', 'selectable', 'evented', 'lockScalingFlip', 'strokeUniform'];
  var docName = '';
  var FONT_LIST = G.FONTS;
  function famOf(o) { return String(o.fontFamily || 'GInter').replace(/^G/, ''); }

  // ---------- history ----------
  var hist = [], hi = -1, quiet = 0, histT;
  function objsOf(p) { return p.fab ? p.fab.toJSON(PROPS).objects : (p.objs || []); }
  function snapshot() {
    return pages.map(function (p) { return { id: p.id, src: p.src, idx: p.idx, rot0: p.rot0, rot: p.rot, view: p.view, objs: objsOf(p) }; });
  }
  function commit(now) {
    if (quiet) return;
    clearTimeout(histT);
    var go = function () {
      hist = hist.slice(0, hi + 1); hist.push(snapshot());
      if (hist.length > 40) hist.shift();
      hi = hist.length - 1; histUi();
    };
    if (now) go(); else histT = setTimeout(go, 180);
  }
  function histUi() { $('#pe-undo').disabled = hi <= 0; $('#pe-redo').disabled = hi >= hist.length - 1; }
  function restore(snap) {
    quiet++;
    var old = {}; pages.forEach(function (p) { old[p.id] = p; });
    pages = snap.map(function (s) {
      var p = old[s.id];
      if (p && p.src === s.src && p.idx === s.idx) {
        if (p.rot !== s.rot) {
          p.rot = s.rot; p.rs = 0; p.text = null; p.done = {};
          if (p.fab) disposeFab(p);
          p.objs = s.objs;
        } else if (p.fab) loadObjs(p, s.objs);
        else p.objs = s.objs;
        return p;
      }
      return mkPage(s.src, s.idx, s.rot0, s.view, s.rot, s.objs, s.id);
    });
    Object.keys(old).forEach(function (id) { if (!pages.some(function (p) { return p.id === id; })) dropPage(old[id]); });
    quiet--;
    layoutPages(); renderThumbs(); props();
  }
  function undo() { if (hi > 0) { hi--; restore(hist[hi]); histUi(); } }
  function redo() { if (hi < hist.length - 1) { hi++; restore(hist[hi]); histUi(); } }

  // ---------- opening files ----------
  function addFiles(files, at) {
    files = [].slice.call(files || []);
    if (!files.length) return Promise.resolve();
    var bad = files.filter(function (f) { return !G.kind(f); });
    if (bad.length) toast(G.whyNot(bad[0]), 5000);
    files = files.filter(function (f) { return G.kind(f); });
    if (!files.length) return Promise.resolve();
    busy(true, files.length > 1 ? 'Файлуудыг уншиж байна…' : 'Файлыг уншиж байна…');
    var pos = at == null ? pages.length : at, added = 0;
    return G.pdfjs().then(function (pdfjsLib) {
      return files.reduce(function (pr, f) {
        return pr.then(function () {
          var k = G.kind(f);
          if (k !== 'pdf') busy(true, '«' + f.name + '» → PDF болгож байна…');
          return G.toPdf(f).then(function (bytes) {
            return openPdf(pdfjsLib, bytes, f.name).then(function (si) {
              var d = sources[si].doc, list = [];
              var ps = [];
              for (var i = 0; i < d.numPages; i++) ps.push(d.getPage(i + 1));
              return Promise.all(ps).then(function (pgs) {
                pgs.forEach(function (pg, i) { list.push(mkPage(si, i, pg.rotate || 0, pg.view.slice())); });
                pages.splice.apply(pages, [pos, 0].concat(list));
                pos += list.length; added += list.length;
                if (!docName) setName(G.baseName(f));
              });
            });
          }).catch(function (e) { console.error(e); toast((e && e.message) || ('«' + f.name + '»-ийг нээж чадсангүй'), 5000); });
        });
      }, Promise.resolve());
    }).then(function () {
      busy(false);
      if (!added) return;
      root.classList.add('has-doc'); $('#pe-save').disabled = false;
      if (fitMode) zoom = fitZoom();
      layoutPages(); renderThumbs(); commit(true); props();
      if (at != null) toast(added + ' хуудас нэмэгдлээ');
    });
  }
  function openPdf(pdfjsLib, bytes, name) {
    var task = pdfjsLib.getDocument({ data: bytes.slice(), isEvalSupported: false });
    var usedPw = null;
    task.onPassword = function (cb, reason) {
      var pw = window.prompt((reason === 2 ? 'Нууц үг буруу байна. ' : '') + '«' + name + '» нууц үгтэй байна. Нууц үгээ оруулна уу:');
      if (pw == null) { task.destroy(); return; }
      usedPw = pw; cb(pw);
    };
    return task.promise.then(function (doc) {
      sources.push({ bytes: bytes, doc: doc, name: name, pw: usedPw });
      return sources.length - 1;
    });
  }
  function mkPage(src, idx, rot0, v, rot, objs, id) {
    return { id: id || uid(), src: src, idx: idx, rot0: rot0 || 0, rot: rot || 0, view: v, objs: objs || [], fab: null, el: null, rs: 0 };
  }
  function blankPage() {
    var ref = cur || pages[pages.length - 1], v = [0, 0, 595.28, 841.89];
    if (ref) { var d = dims(ref); v = [0, 0, d.w, d.h]; }
    return mkPage(-1, 0, 0, v);
  }
  function setName(n) { docName = n; $('#pe-name').value = n; document.title = n + ' — PDF засварлагч | Graphican'; }

  // ---------- page DOM ----------
  var io = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      var p = pageById(en.target.dataset.id); if (!p) return;
      p.vis = en.isIntersecting;
      if (en.isIntersecting) { renderPage(p); ensureFab(p); if (mode === 'edit') textLayer(p); }
    });
  }, { root: view, rootMargin: '900px 0px' });
  var farIo = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) {
      var p = pageById(en.target.dataset.id);
      if (p && !en.isIntersecting && p.fab && !p.fab.getActiveObject()) { p.objs = p.fab.toJSON(PROPS).objects; disposeFab(p); }
    });
  }, { root: view, rootMargin: '3500px 0px' });
  function pageById(id) { for (var i = 0; i < pages.length; i++) if (pages[i].id === id) return pages[i]; return null; }

  function layoutPages() {
    var n = pages.length;
    pages.forEach(function (p, i) {
      if (!p.el) {
        p.el = document.createElement('div'); p.el.className = 'pg'; p.el.dataset.id = p.id;
        p.el.innerHTML = '<span class="pn"></span>';
        io.observe(p.el); farIo.observe(p.el);
      }
      var d = dims(p), W = Math.round(d.w * zoom), H = Math.round(d.h * zoom);
      if (p.el.style.width !== W + 'px' || p.el.style.height !== H + 'px') {
        p.el.style.width = W + 'px'; p.el.style.height = H + 'px';
        if (p.fab) sizeFab(p);
        if (p.vis && mode === 'edit') textLayer(p);
      }
      if (p.vis) { renderPage(p); ensureFab(p); }
      p.el.querySelector('.pn').textContent = (i + 1) + ' / ' + n;
      if (pagesEl.children[i] !== p.el) pagesEl.insertBefore(p.el, pagesEl.children[i] || null);
    });
    while (pagesEl.children.length > n) {
      var el = pagesEl.lastChild; io.unobserve(el); farIo.unobserve(el); el.remove();
    }
    $('#pe-count').textContent = n + ' хуудас';
    $('#pe-zoom').textContent = Math.round(zoom * 100) + '%';
    if (!n) { root.classList.remove('has-doc'); $('#pe-save').disabled = true; }
    updateCur();
  }
  function dropPage(p) {
    if (p.fab) disposeFab(p);
    if (p.el) { io.unobserve(p.el); farIo.unobserve(p.el); p.el.remove(); p.el = null; }
    p.canvas = null;
  }

  // render the PDF page at the current zoom (re-render only when resolution changes)
  function renderPage(p) {
    var s = zoom * dpr;
    var d = dims(p), maxPx = 16e6; // stay under mobile canvas limits
    if (d.w * d.h * s * s > maxPx) s = Math.sqrt(maxPx / (d.w * d.h));
    if (p.rs && Math.abs(p.rs - s) / s < 0.05) return;
    p.rs = s;
    if (p.src < 0) { if (p.canvas) { p.canvas.remove(); p.canvas = null; } return; }
    var job = (p.job = {});
    sources[p.src].doc.getPage(p.idx + 1).then(function (pg) {
      if (job !== p.job || !p.el) return;
      p.pdfPage = pg;
      var vp = pg.getViewport({ scale: s, rotation: R(p) });
      var c = document.createElement('canvas');
      c.className = 'pc'; c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () {
        if (job !== p.job || !p.el) return;
        if (p.canvas) p.canvas.replaceWith(c); else p.el.insertBefore(c, p.el.firstChild);
        p.canvas = c; p.cs = s;
      });
    }).catch(function (e) { if (!/cancel/i.test(e && e.name)) console.warn(e); });
  }

  // ---------- fabric layer per page ----------
  function ensureFab(p) {
    if (p.fab || !p.el) return p.fab;
    var c = document.createElement('canvas'); p.el.appendChild(c);
    var d = dims(p);
    var f = new fabric.Canvas(c, {
      width: d.w * zoom, height: d.h * zoom, preserveObjectStacking: true, enableRetinaScaling: true,
      selectionColor: 'rgba(109,86,250,.08)', selectionBorderColor: '#6d56fa', allowTouchScrolling: true, targetFindTolerance: 6
    });
    f.setZoom(zoom); f.page = p; p.fab = f;
    bindFab(f, p);
    applyMode(p);
    if (p.objs && p.objs.length) loadObjs(p, p.objs);
    return f;
  }
  function sizeFab(p) { var d = dims(p); p.fab.setDimensions({ width: d.w * zoom, height: d.h * zoom }); p.fab.setZoom(zoom); p.fab.requestRenderAll(); }
  function disposeFab(p) { try { p.fab.dispose(); } catch (e) {} p.fab = null; var cc = p.el && p.el.querySelector('.canvas-container'); if (cc) cc.remove(); }
  function loadObjs(p, objs) {
    quiet++;
    var f = p.fab;
    fabric.util.enlivenObjects(objs || [], function (list) {
      if (p.fab !== f) { quiet--; return; }
      f.clear();
      list.forEach(function (o) { prepObj(o); f.add(o); });
      f.requestRenderAll();
      quiet--;
      // text measured before its web font loaded → re-measure
      list.forEach(function (o) { if (o.type === 'i-text') G.screenFont(famOf(o), isBold(o)).then(function () { o.initDimensions(); f.requestRenderAll(); }); });
    });
  }
  function isBold(o) { return o.fontWeight === 'bold' || +o.fontWeight >= 600; }
  function prepObj(o) {
    o.set({ borderColor: '#6d56fa', cornerColor: '#fff', cornerStrokeColor: '#6d56fa', transparentCorners: false, cornerSize: isMob() ? 14 : 9, borderScaleFactor: 1.5, padding: o.type === 'i-text' ? 3 : 0 });
    if (o.type === 'i-text') { o.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false }); o.lockScalingFlip = true; }
  }

  function bindFab(f, p) {
    var drag = null;
    f.on('mouse:down', function (opt) {
      setCur(p);
      if (mode === 'select' || mode === 'draw' || mode === 'edit') return;
      var pt = f.getPointer(opt.e);
      if (mode === 'text') { addText(p, pt.x, pt.y); setMode('select'); return; }
      var o, base = { left: pt.x, top: pt.y, width: 1, height: 1, strokeUniform: true };
      if (mode === 'hl') o = new fabric.Rect(Object.assign(base, { fill: style.hl, opacity: 0.45, globalCompositeOperation: 'multiply', data: { k: 'hl' } }));
      else if (mode === 'wo') o = new fabric.Rect(Object.assign(base, { fill: '#ffffff', data: { k: 'wo' } }));
      else if (mode === 'rect') o = new fabric.Rect(Object.assign(base, { fill: style.fill || 'transparent', stroke: style.stroke, strokeWidth: style.width, data: { k: 'shape' } }));
      else if (mode === 'ellipse') o = new fabric.Ellipse(Object.assign(base, { rx: 0.5, ry: 0.5, fill: style.fill || 'transparent', stroke: style.stroke, strokeWidth: style.width, data: { k: 'shape' } }));
      else if (mode === 'line' || mode === 'arrow') o = new fabric.Line([pt.x, pt.y, pt.x, pt.y], { stroke: style.stroke, strokeWidth: style.width, strokeLineCap: 'round', strokeUniform: true, data: { k: 'shape' } });
      if (!o) return;
      quiet++; prepObj(o); f.add(o); quiet--;
      drag = { o: o, x: pt.x, y: pt.y };
    });
    f.on('mouse:move', function (opt) {
      if (!drag) return;
      var pt = f.getPointer(opt.e), o = drag.o, e = opt.e;
      if (o.type === 'line') {
        var x2 = pt.x, y2 = pt.y;
        if (e.shiftKey) { var a = Math.round(Math.atan2(y2 - drag.y, x2 - drag.x) / (Math.PI / 4)) * Math.PI / 4, L = Math.hypot(x2 - drag.x, y2 - drag.y); x2 = drag.x + L * Math.cos(a); y2 = drag.y + L * Math.sin(a); }
        o.set({ x2: x2, y2: y2 });
      } else {
        var w = pt.x - drag.x, h = pt.y - drag.y;
        if (e.shiftKey && o.data.k === 'shape') { var m = Math.max(Math.abs(w), Math.abs(h)); w = m * Math.sign(w || 1); h = m * Math.sign(h || 1); }
        o.set({ left: Math.min(drag.x, drag.x + w), top: Math.min(drag.y, drag.y + h) });
        if (o.type === 'ellipse') o.set({ rx: Math.abs(w) / 2, ry: Math.abs(h) / 2 });
        else o.set({ width: Math.abs(w), height: Math.abs(h) });
      }
      o.setCoords(); f.requestRenderAll();
    });
    f.on('mouse:up', function () {
      if (!drag) return;
      var o = drag.o; drag = null;
      var tiny = o.type === 'line' ? Math.hypot(o.x2 - o.x1, o.y2 - o.y1) < 4 : (o.width * o.scaleX < 3 || o.height * o.scaleY < 3) && (o.rx == null || o.rx < 2);
      if (tiny) {
        quiet++; f.remove(o); quiet--;
        if (o.type === 'line' || o.data.k === 'shape') return;
        // a click with the highlighter / whiteout: make a default-size box
        o.set({ width: o.data.k === 'hl' ? 120 : 100, height: o.data.k === 'hl' ? 16 : 24, left: o.left - 2, top: o.top - 8 });
        quiet++; f.add(o); quiet--;
      }
      if (o.type === 'line' && mode === 'arrow') {
        quiet++; f.remove(o); quiet--;
        o = arrowPath(o.x1, o.y1, o.x2, o.y2);
        prepObj(o); quiet++; f.add(o); quiet--;
      }
      o.setCoords();
      f.setActiveObject(o); f.requestRenderAll();
      commit(true); props();
    });
    f.on('path:created', function (e) { e.path.set({ data: { k: 'ink' }, strokeUniform: true }); prepObj(e.path); commit(true); });
    f.on('object:added', function () { commit(); });
    f.on('object:removed', function () { commit(); });
    f.on('object:modified', function (e) {
      var o = e.target;
      if (o && o.type === 'i-text' && (o.scaleX !== 1 || o.scaleY !== 1)) {
        // keep text unscaled: fold the scale into the font size
        o.set({ fontSize: Math.max(4, Math.round(o.fontSize * o.scaleY * 10) / 10), scaleX: 1, scaleY: 1 }); o.setCoords();
      }
      commit(); props();
    });
    f.on('text:changed', function () { commit(); });
    f.on('text:editing:exited', function (e) {
      var o = e.target;
      if (o && !o.text.trim()) { f.remove(o); var pair = o.data && o.data.pair; if (pair) f.getObjects().forEach(function (x) { if (x.data && x.data.pair === pair && x !== o && x.data.k === 'wo' && x.data.auto) f.remove(x); }); }
      commit();
    });
    f.on('selection:created', function () { clearOtherSelections(p); setCur(p); props(); });
    f.on('selection:updated', function () { props(); });
    f.on('selection:cleared', function () { props(); });
  }
  function clearOtherSelections(p) {
    pages.forEach(function (q) { if (q !== p && q.fab && q.fab.getActiveObject()) { q.fab.discardActiveObject(); q.fab.requestRenderAll(); } });
  }
  function arrowPath(x1, y1, x2, y2) {
    var a = Math.atan2(y2 - y1, x2 - x1), L = Math.max(10, style.width * 4.5), s = 0.45;
    var p1 = [x2 - L * Math.cos(a - s), y2 - L * Math.sin(a - s)], p2 = [x2 - L * Math.cos(a + s), y2 - L * Math.sin(a + s)];
    var d = 'M ' + x1 + ' ' + y1 + ' L ' + x2 + ' ' + y2 + ' M ' + p1[0] + ' ' + p1[1] + ' L ' + x2 + ' ' + y2 + ' L ' + p2[0] + ' ' + p2[1];
    return new fabric.Path(d, { fill: '', stroke: style.stroke, strokeWidth: style.width, strokeLineCap: 'round', strokeLineJoin: 'round', strokeUniform: true, data: { k: 'shape' } });
  }
  function active() {
    for (var i = 0; i < pages.length; i++) { var f = pages[i].fab; if (f && f.getActiveObject()) return { p: pages[i], f: f, o: f.getActiveObject() }; }
    return null;
  }

  // ---------- adding things ----------
  function curPage() { return cur || pages[0]; }
  function centerOf(p) {
    // centre of the visible part of the page
    var d = dims(p), r = p.el.getBoundingClientRect(), vr = view.getBoundingClientRect();
    var top = Math.max(r.top, vr.top), bot = Math.min(r.bottom, vr.bottom);
    var cy = bot > top ? ((top + bot) / 2 - r.top) / zoom : d.h / 2;
    return { x: d.w / 2, y: Math.min(Math.max(cy, 40), d.h - 40) };
  }
  function addObj(p, o, center) {
    var f = ensureFab(p); if (!f) return;
    prepObj(o);
    if (center) {
      var c = centerOf(p);
      o.set({ left: c.x - o.getScaledWidth() / 2, top: c.y - o.getScaledHeight() / 2 });
    }
    clearOtherSelections(p);
    f.add(o); o.setCoords(); f.setActiveObject(o); f.requestRenderAll(); commit(true); props();
    return o;
  }
  function textObj(str, o) {
    return new fabric.IText(str, Object.assign({
      fontFamily: 'G' + style.font, fontSize: style.size, fill: style.color, fontWeight: style.bold ? 'bold' : 'normal',
      textAlign: style.align, lineHeight: 1.16, data: { k: 'txt' }, editingBorderColor: '#6d56fa', cursorColor: '#6d56fa'
    }, o || {}));
  }
  function addText(p, x, y) {
    G.screenFont(style.font, style.bold).then(function () {
      var t = textObj('Текст', { left: x, top: y - style.size * 0.6 });
      addObj(p, t);
      t.enterEditing(); t.selectAll(); p.fab.requestRenderAll();
    });
  }
  function addImageFile(file, kindTag) {
    var p = curPage(); if (!p) return;
    busy(true, 'Зургийг уншиж байна…');
    G.imageCanvases(file).then(function (cs) {
      var c = cs[0], alpha = /png|gif|webp|svg/i.test(file.type || file.name || '');
      var url = c.toDataURL(alpha ? 'image/png' : 'image/jpeg', 0.92);
      fabric.Image.fromURL(url, function (im) {
        busy(false);
        var d = dims(p), k = Math.min((d.w * 0.5) / im.width, (d.h * 0.5) / im.height, 0.75);
        im.set({ scaleX: k, scaleY: k, data: { k: kindTag || 'img' } });
        addObj(p, im, true); setMode('select');
      });
    }).catch(function (e) { busy(false); toast((e && e.message) || 'Зургийг уншиж чадсангүй'); });
  }
  function addStamp(kind) {
    var p = curPage(); if (!p) return;
    var o;
    if (kind === 'check') o = new fabric.Path('M 0 13 L 9 22 L 26 3', { fill: '', stroke: '#1f9d55', strokeWidth: 3.2, strokeLineCap: 'round', strokeLineJoin: 'round', strokeUniform: true, data: { k: 'stamp' } });
    else if (kind === 'cross') o = new fabric.Path('M 2 2 L 22 22 M 22 2 L 2 22', { fill: '', stroke: '#e5484d', strokeWidth: 3.2, strokeLineCap: 'round', strokeUniform: true, data: { k: 'stamp' } });
    else {
      var d = new Date(), s = d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2);
      return G.screenFont(style.font, false).then(function () { addObj(p, textObj(s, { fontWeight: 'normal' }), true); setMode('select'); });
    }
    addObj(p, o, true); setMode('select');
  }

  // ---------- edit existing PDF text ----------
  function textLayer(p) {
    if ((p.src < 0 && !p.ocr) || !p.el) return;
    var old = p.el.querySelector('.tl'); if (old) old.remove();
    var tl = document.createElement('div'); tl.className = 'tl'; p.el.appendChild(tl);
    var go = function (tc) {
      if (mode !== 'edit' || !tl.isConnected) return;
      var M = vpT(p.view, R(p), 1), frag = document.createDocumentFragment();
      p.done = p.done || {};
      allItems(p, tc).forEach(function (it, i) {
        if (!it.str || !it.str.trim() || p.done[i]) return;
        var stl = it.fontName === 'ocr' ? OCR_STYLE : tc.styles[it.fontName], g = geomOf(M, it, stl);
        var s = document.createElement('span');
        s.style.cssText = 'left:' + (g.x * zoom) + 'px;top:' + (g.top * zoom) + 'px;width:' + Math.max(4, g.w * zoom) + 'px;height:' + (g.h * zoom) + 'px;' +
          (Math.abs(g.ang) > 0.5 ? 'transform-origin:0 ' + ((g.base - g.top) * zoom) + 'px;transform:rotate(' + g.ang + 'deg)' : '');
        s.title = 'Засах: ' + it.str;
        s.addEventListener('click', function (e) { e.stopPropagation(); editItem(p, it, i, g, stl); s.remove(); });
        frag.appendChild(s);
      });
      tl.appendChild(frag);
    };
    if (p.text || p.src < 0) return go(p.text);
    sources[p.src].doc.getPage(p.idx + 1).then(function (pg) { p.pdfPage = pg; return pg.getTextContent(); }).then(function (tc) { p.text = tc; go(tc); });
  }
  function geomOf(M, it, st) {
    var t = mul(M, it.transform), fs = Math.hypot(t[2], t[3]) || 10, ang = Math.atan2(t[1], t[0]) * 180 / Math.PI;
    var asc = st && st.ascent ? st.ascent : 0.88, desc = st && st.descent ? -st.descent : 0.22;
    var w = it.width * Math.hypot(M[0], M[1]);
    if (it.dir === 'ttb') w = it.height;
    return { x: t[4], base: t[5], top: t[5] - fs * asc, h: fs * (asc + desc), w: w, fs: fs, ang: ang };
  }
  function sampleColors(p, g) {
    // background = most common colour around the box, ink = darkest pixel inside it
    var out = { bg: '#ffffff', ink: '#1e1e1e' };
    if (!p.canvas || Math.abs(g.ang) > 1) return out;
    try {
      var s = p.cs, ctx = p.canvas.getContext('2d', { willReadFrequently: true });
      var x0 = Math.max(0, Math.floor((g.x - 3) * s)), y0 = Math.max(0, Math.floor((g.top - 3) * s));
      var w = Math.min(p.canvas.width - x0, Math.ceil((g.w + 6) * s)), h = Math.min(p.canvas.height - y0, Math.ceil((g.h + 6) * s));
      if (w < 2 || h < 2) return out;
      var d = ctx.getImageData(x0, y0, w, h).data, counts = {}, best = 0, dark = 1e9, di = -1;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4, edge = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
        if (edge) { var k = (d[i] >> 3) + ',' + (d[i + 1] >> 3) + ',' + (d[i + 2] >> 3); counts[k] = (counts[k] || 0) + 1; if (counts[k] > best) { best = counts[k]; out.bg = toHex(d[i], d[i + 1], d[i + 2]); } }
        var l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
        if (!edge && l < dark) { dark = l; di = i; }
      }
      if (di >= 0) {
        var bgl = hexRgb(out.bg); bgl = (bgl[0] * 0.3 + bgl[1] * 0.59 + bgl[2] * 0.11) * 255;
        // light text on dark background: take the brightest pixel instead
        if (bgl < 110) { var lt = -1, li = -1; for (var j = 0; j < d.length; j += 4) { var ll = d[j] * 0.3 + d[j + 1] * 0.59 + d[j + 2] * 0.11; if (ll > lt) { lt = ll; li = j; } } di = li; }
        out.ink = toHex(d[di], d[di + 1], d[di + 2]);
      }
    } catch (e) {}
    return out;
  }
  function guessFont(p, it, st) {
    var name = '';
    try { var fo = p.pdfPage && p.pdfPage.commonObjs.get(it.fontName); name = (fo && (fo.name || fo.loadedName)) || ''; } catch (e) {}
    var fam = (st && st.fontFamily) || '', all = (name + ' ' + fam).toLowerCase();
    var f = /montserrat/.test(all) ? 'Montserrat' : /times|serif|georgia|garamond|cambria|lora|minion|book/.test(all) && !/sans/.test(all) ? 'Lora'
      : /arial|helvetica|roboto|calibri|segoe|liberation|dejavu|mono|courier/.test(all) ? 'Roboto' : 'Inter';
    return { font: f, bold: /bold|black|heavy|semibold|demi|,b\b|-b\b/.test(all) };
  }
  function editItem(p, it, i, g, st) {
    var f = ensureFab(p); if (!f) return;
    p.done[i] = 1;
    var col = sampleColors(p, g), gf = guessFont(p, it, st), pair = uid();
    // cover box in the text's own frame: from ascender to descender, a little padding all round
    var a0 = g.ang * Math.PI / 180, up = g.base - g.top + g.fs * 0.12, padX = 1.5;
    var tl = { x: g.x - padX * Math.cos(a0) + up * Math.sin(a0), y: g.base - padX * Math.sin(a0) - up * Math.cos(a0) };
    var cover = new fabric.Rect({ left: tl.x, top: tl.y, width: g.w + 2 * padX + g.fs * 0.1, height: g.h + g.fs * 0.24, fill: col.bg, angle: g.ang, data: { k: 'wo', auto: 1, pair: pair } });
    G.screenFont(gf.font, gf.bold).then(function () {
      var fs = Math.round(g.fs * 10) / 10;
      var t = textObj(it.str, { fontFamily: 'G' + gf.font, fontWeight: gf.bold ? 'bold' : 'normal', fontSize: fs, fill: col.ink, textAlign: 'left', angle: g.ang, data: { k: 'txt', pair: pair } });
      // place so the baseline matches the original: fabric baseline = top + fs·1.13·(1 − 0.222)
      var off = fs * t._fontSizeMult * (1 - t._fontSizeFraction), a = g.ang * Math.PI / 180;
      t.set({ left: g.x + off * Math.sin(a), top: g.base - off * Math.cos(a) });
      quiet++; prepObj(cover); f.add(cover); quiet--;
      addObj(p, t);
      t.enterEditing(); t.selectAll(); f.requestRenderAll();
    });
  }

  // ---------- modes ----------
  var TOOLS = [
    ['select', 'Сонгох', 'V'], ['edit', 'Текст засах', 'E'], ['text', 'Текст', 'T'], ['hl', 'Тодруулах', 'H'], ['draw', 'Зурах', 'D'], '|',
    ['rect', 'Тэгш өнц.', 'R'], ['ellipse', 'Эллипс', 'O'], ['arrow', 'Сум', 'A'], ['line', 'Шугам', 'L'], ['wo', 'Цайруулах', 'W'], '|',
    ['image', 'Зураг', ''], ['sign', 'Гарын үсэг', ''], ['check', '✓ Тэмдэг', ''], ['cross', '✗ Тэмдэг', ''], ['date', 'Огноо', '']
  ];
  var ICON = { select: 'select', edit: 'edit', text: 'text', hl: 'hl', draw: 'draw', rect: 'rect', ellipse: 'ellipse', arrow: 'arrow', line: 'line', wo: 'wo', image: 'image', sign: 'sign', check: 'check', cross: 'cross', date: 'date' };
  function dockUi() {
    $('#pe-dock').innerHTML = TOOLS.map(function (t) {
      if (t === '|') return '<span class="sep"></span>';
      return '<button type="button" class="tool' + (mode === t[0] ? ' on' : '') + '" data-tool="' + t[0] + '" title="' + t[1] + (t[2] ? ' (' + t[2] + ')' : '') + '">' + ic(ICON[t[0]]) + '<span>' + t[1] + '</span></button>';
    }).join('');
  }
  function setMode(m) {
    if (m === 'image') { $('#pe-img').accept = G.IMG_ACCEPT; $('#pe-img').click(); return; }
    if (m === 'sign') { signModal(); return; }
    if (m === 'check' || m === 'cross' || m === 'date') { addStamp(m); return; }
    mode = m;
    pages.forEach(function (p) {
      applyMode(p);
      var tl = p.el && p.el.querySelector('.tl');
      if (m === 'edit') { if (p.vis) textLayer(p); } else if (tl) tl.remove();
    });
    dockUi(); props();
    if (m === 'edit') toast('Засах гэсэн бичгээ дарна уу', 2200);
  }
  function applyMode(p) {
    var f = p.fab; if (!f) return;
    var create = /^(text|hl|wo|rect|ellipse|line|arrow)$/.test(mode);
    f.isDrawingMode = mode === 'draw';
    if (f.isDrawingMode) {
      f.freeDrawingBrush = new fabric.PencilBrush(f);
      f.freeDrawingBrush.color = style.stroke; f.freeDrawingBrush.width = style.width; f.freeDrawingBrush.decimate = 1.5;
    }
    f.selection = mode === 'select';
    f.skipTargetFind = create;
    f.defaultCursor = create ? (mode === 'text' ? 'text' : 'crosshair') : 'default';
    f.allowTouchScrolling = mode === 'select' || mode === 'edit';
    if (create || mode === 'draw') { f.discardActiveObject(); f.requestRenderAll(); }
    p.el.classList.toggle('drawing', !(mode === 'select' || mode === 'edit'));
  }

  // ---------- properties panel ----------
  var SW_TEXT = ['#1e1e1e', '#ffffff', '#6d56fa', '#e5484d', '#1f6feb', '#1f9d55', '#f5a524'];
  var SW_STROKE = ['#e5484d', '#1e1e1e', '#6d56fa', '#1f6feb', '#1f9d55', '#f5a524', '#ffffff'];
  var SW_HL = ['#ffd84d', '#7ee787', '#79c0ff', '#ff9bce', '#ffa657'];
  function swatches(key, list, val, none) {
    return '<div class="sws">' + (none ? '<button type="button" class="sw none' + (!val ? ' on' : '') + '" data-sw="' + key + '" data-v="" title="Өнгөгүй"></button>' : '') +
      list.map(function (c) { return '<button type="button" class="sw' + (String(val).toLowerCase() === c ? ' on' : '') + '" style="background:' + c + '" data-sw="' + key + '" data-v="' + c + '" aria-label="' + c + '"></button>'; }).join('') +
      '<label class="sw custom" title="Өөр өнгө"><input type="color" data-swc="' + key + '" value="' + (/^#[0-9a-f]{6}$/i.test(val) ? val : '#000000') + '"></label></div>';
  }
  function range(key, min, max, step, val, label, unit) {
    return '<div class="row"><label>' + label + '</label><input type="range" data-rg="' + key + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><span class="kbd" data-rgv="' + key + '">' + val + (unit || '') + '</span></div>';
  }
  function props() {
    if (!root.classList.contains('has-doc')) { propsEl.innerHTML = ''; return; }
    var a = active(), o = a && a.o, h = '';
    propsEl.classList.remove('idle');
    if (o && o.type === 'activeSelection') {
      h = '<div class="sec"><div class="sec-t">' + o.size() + ' зүйл сонгогдсон</div><div class="btns"><button class="btn sm" data-act="dup">' + ic('dup') + 'Хувилах</button><button class="btn sm danger" data-act="del">' + ic('del') + 'Устгах</button></div></div>';
    } else if (o && o.data && o.data.k === 'field') {
      h = '<div class="sec"><div class="sec-t">Бөглөх талбар</div><div class="row"><label>Нэр</label><input type="text" data-p="fname" value="' + esc(o.data.name || '') + '" style="flex:1;min-width:0;height:28px;border-radius:6px;border:1px solid var(--line2);background:var(--bg);padding:0 6px"></div>' +
        '<p class="note">Татсан PDF-д энэ хэсэгт бөглөх ' + ({ text: 'текст талбар', multi: 'олон мөрт текст талбар', check: 'сонголтын нүд', date: 'огнооны талбар', sign: 'гарын үсгийн талбар' }[o.data.ft] || 'талбар') + ' үүснэ. Буланг чирж хэмжээг өөрчилнө.</p></div>' +
        '<div class="sec"><div class="btns"><button class="btn sm" data-act="dup">' + ic('dup') + 'Хувилах</button><button class="btn sm danger" data-act="del">' + ic('del') + 'Устгах</button></div></div>';
    } else if (o) {
      var k = (o.data && o.data.k) || o.type;
      if (o.type === 'i-text') {
        h += '<div class="sec"><div class="sec-t">Текст <small>Давхар дарж засна</small></div>' +
          '<div class="row"><label>Фонт</label><select data-p="font">' + FONT_LIST.map(function (f) { return '<option' + (famOf(o) === f ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select></div>' +
          '<div class="row"><label>Хэмжээ</label><input type="number" data-p="size" min="4" max="400" step="0.5" value="' + (Math.round(o.fontSize * 10) / 10) + '"></div>' +
          '<div class="row"><label>Хэлбэр</label><div class="seg" style="flex:1"><button type="button" data-p="bold" class="' + (isBold(o) ? 'on' : '') + '"><b>B</b></button>' +
          ['left', 'center', 'right'].map(function (al) { return '<button type="button" data-p="align" data-v="' + al + '" class="' + (o.textAlign === al ? 'on' : '') + '" title="' + al + '">' + (al === 'left' ? '⟸' : al === 'center' ? '⟺' : '⟹') + '</button>'; }).join('') + '</div></div>' +
          '<div class="sec-t">Өнгө</div>' + swatches('fill', SW_TEXT, o.fill) + '</div>';
      } else if (k === 'hl') {
        h += '<div class="sec"><div class="sec-t">Тодруулга</div>' + swatches('fill', SW_HL, o.fill) + '</div>';
      } else if (k === 'wo') {
        h += '<div class="sec"><div class="sec-t">Цайруулга</div><p class="note">Доорх агуулгыг далдална. Өнгийг хуудасны дэвсгэртэй тааруулж болно.</p>' + swatches('fill', ['#ffffff', '#f5f5f5', '#000000'], o.fill) + '</div>';
      } else if (o.type === 'image') {
        h += '<div class="sec"><div class="sec-t">' + (k === 'sig' ? 'Гарын үсэг' : 'Зураг') + '</div>' + range('opacity', 0.1, 1, 0.05, o.opacity, 'Тунгалаг') + '</div>';
      } else {
        h += '<div class="sec"><div class="sec-t">' + (k === 'ink' ? 'Зураас' : 'Хэлбэр') + '</div><div class="sec-t">Хүрээ</div>' + swatches('stroke', SW_STROKE, o.stroke) +
          range('width', 0.5, 16, 0.5, o.strokeWidth, 'Зузаан') +
          (o.type === 'rect' || o.type === 'ellipse' ? '<div class="sec-t">Дүүргэлт</div>' + swatches('sfill', SW_STROKE, o.fill === 'transparent' ? '' : o.fill, true) : '') + '</div>';
      }
      if (o.type !== 'image') h += '<div class="sec">' + range('opacity', 0.1, 1, 0.05, o.opacity, 'Тунгалаг') + '</div>';
      h += '<div class="sec"><div class="btns"><button class="btn sm" data-act="dup">' + ic('dup') + 'Хувилах</button><button class="btn sm" data-act="front" title="Урагш">' + ic('front') + '</button><button class="btn sm" data-act="back" title="Хойш">' + ic('back') + '</button><button class="btn sm danger" data-act="del">' + ic('del') + 'Устгах</button></div></div>';
    } else {
      // nothing selected: settings for the current tool + tips
      if (mode === 'text' || mode === 'select' || mode === 'edit') {
        h += '<div class="sec"><div class="sec-t">Шинэ текст</div>' +
          '<div class="row"><label>Фонт</label><select data-s="font">' + FONT_LIST.map(function (f) { return '<option' + (style.font === f ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select></div>' +
          '<div class="row"><label>Хэмжээ</label><input type="number" data-s="size" min="4" max="400" step="0.5" value="' + style.size + '"></div>' +
          swatches('s-color', SW_TEXT, style.color) + '</div>';
      }
      if (mode === 'hl') h += '<div class="sec"><div class="sec-t">Тодруулагч</div>' + swatches('s-hl', SW_HL, style.hl) + '<p class="note">Тодруулах мөрөө чирж будна.</p></div>';
      if (/^(draw|rect|ellipse|line|arrow)$/.test(mode)) h += '<div class="sec"><div class="sec-t">Үзэг</div>' + swatches('s-stroke', SW_STROKE, style.stroke) + range('s-width', 0.5, 16, 0.5, style.width, 'Зузаан') + '</div>';
      if (mode === 'wo') h += '<div class="sec"><div class="sec-t">Цайруулах</div><p class="note">Нуух хэсгээ чирж цагаан хайрцгаар далдална. Дээр нь шинэ текст бичиж болно.</p></div>';
      h += '<div class="sec"><div class="sec-t">Зөвлөгөө</div><p class="note">' +
        (mode === 'edit' ? 'Тасархай хүрээтэй бичгийг дарахад тэр хэсэг арилж, <b>ижил фонт, хэмжээ, өнгөөр</b> засах боломжтой текст болно.' :
          '<b>Текст засах</b> — PDF доторх бичгийг шууд засна.<br><b>Текст</b> — дурын газар дарж бичнэ.<br>Хуудсыг зүүн самбараас эргүүлж, устгаж, чирж дараалал сольно.') +
        '</p><p class="note kbd">Ctrl+Z буцаах · Delete устгах · Ctrl+D хувилах</p></div>';
      if (isMob() && (mode === 'select' || mode === 'edit')) propsEl.classList.add('idle');
    }
    propsEl.innerHTML = h;
  }
  function applyProp(key, v) {
    var a = active(); if (!a) return;
    var list = a.o.type === 'activeSelection' ? a.o.getObjects() : [a.o];
    list.forEach(function (o) {
      if (key === 'fname') { o.data = Object.assign({}, o.data, { name: String(v).slice(0, 60) }); return; }
      if (key === 'fill') o.set('fill', v);
      else if (key === 'stroke') o.set('stroke', v);
      else if (key === 'sfill') o.set('fill', v || 'transparent');
      else if (key === 'width') o.set('strokeWidth', +v);
      else if (key === 'opacity') o.set('opacity', +v);
      else if (key === 'size') { o.set('fontSize', Math.max(4, +v || 12)); style.size = +v || style.size; }
      else if (key === 'align') { o.set('textAlign', v); style.align = v; }
      else if (key === 'font' || key === 'bold') {
        var fam = key === 'font' ? v : famOf(o), b = key === 'bold' ? !isBold(o) : isBold(o);
        if (key === 'font') style.font = v; else style.bold = b;
        G.screenFont(fam, b).then(function () { o.set({ fontFamily: 'G' + fam, fontWeight: b ? 'bold' : 'normal' }); o.initDimensions && o.initDimensions(); o.setCoords(); a.f.requestRenderAll(); commit(); props(); });
        return;
      }
      if (o.initDimensions && o.type === 'i-text') o.initDimensions();
      o.setCoords();
    });
    if (key === 'fill' && a.o.type === 'i-text') style.color = v;
    if (key === 'stroke') style.stroke = v;
    if (key === 'width') style.width = +v;
    a.f.requestRenderAll(); commit();
  }
  function applyStyle(key, v) {
    if (key === 's-color') style.color = v;
    else if (key === 's-hl') style.hl = v;
    else if (key === 's-stroke') style.stroke = v;
    else if (key === 's-width') style.width = +v;
    else if (key === 'font') style.font = v;
    else if (key === 'size') style.size = +v || 14;
    pages.forEach(applyMode);
  }
  propsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sw]');
    if (b) { var k = b.dataset.sw; if (/^s-/.test(k)) applyStyle(k, b.dataset.v); else applyProp(k, b.dataset.v); props(); return; }
    var p = e.target.closest('[data-p]');
    if (p && p.tagName === 'BUTTON') { applyProp(p.dataset.p, p.dataset.v); props(); return; }
    var act = e.target.closest('[data-act]');
    if (act) objAction(act.dataset.act);
  });
  propsEl.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.rg) {
      var lab = propsEl.querySelector('[data-rgv="' + t.dataset.rg + '"]'); if (lab) lab.textContent = t.value;
      if (/^s-/.test(t.dataset.rg)) applyStyle(t.dataset.rg, t.value); else applyProp(t.dataset.rg, t.value);
    } else if (t.dataset.swc) { if (/^s-/.test(t.dataset.swc)) applyStyle(t.dataset.swc, t.value); else applyProp(t.dataset.swc, t.value); }
  });
  propsEl.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.p) { applyProp(t.dataset.p, t.value); props(); }
    else if (t.dataset.s) applyStyle(t.dataset.s, t.value);
    else if (t.dataset.swc) props();
  });
  function objAction(act) {
    var a = active(); if (!a) return;
    var f = a.f, o = a.o;
    if (act === 'del') {
      var list = o.type === 'activeSelection' ? o.getObjects() : [o];
      f.discardActiveObject(); list.forEach(function (x) { f.remove(x); });
    } else if (act === 'dup') {
      o.clone(function (c) {
        f.discardActiveObject();
        c.set({ left: c.left + 12, top: c.top + 12 });
        if (c.type === 'activeSelection') { c.canvas = f; c.forEachObject(function (x) { prepObj(x); f.add(x); }); c.setCoords(); }
        else { prepObj(c); f.add(c); }
        f.setActiveObject(c);
      }, PROPS);
    } else if (act === 'front') o.bringToFront();
    else if (act === 'back') { o.sendToBack(); }
    f.requestRenderAll(); commit(true); props();
  }

  // ---------- signature ----------
  function signModal() {
    var m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = '<div class="mbox" role="dialog" aria-modal="true" aria-label="Гарын үсэг"><h2>Гарын үсэг</h2>' +
      '<div class="seg" style="max-width:260px"><button type="button" class="on" data-sm="draw">Зурах</button><button type="button" data-sm="type">Бичих</button><button type="button" data-sm="img">Зургаас</button></div>' +
      '<canvas class="sigpad" width="1200" height="400"></canvas>' +
      '<div class="mrow" data-typ hidden><input class="sig-type" placeholder="Нэрээ бичнэ үү" maxlength="40"></div>' +
      '<div class="mrow"><div class="sws">' + ['#1e1e1e', '#1f3fbf', '#6d56fa'].map(function (c, i) { return '<button type="button" class="sw' + (i ? '' : ' on') + '" style="background:' + c + '" data-sc="' + c + '"></button>'; }).join('') + '</div>' +
      '<span class="grow"></span><button type="button" class="btn" data-sa="clear">Арилгах</button><button type="button" class="btn" data-sa="close">Болих</button><button type="button" class="btn-primary" data-sa="use">Байрлуулах</button></div>' +
      '<p class="note">Гарын үсэг зөвхөн таны төхөөрөмж дээр боловсруулагдана.</p></div>';
    document.body.appendChild(m);
    var cv = m.querySelector('canvas'), ctx = cv.getContext('2d'), color = '#1e1e1e', sm = 'draw', drawing = false, last = null, inked = false;
    var typ = m.querySelector('.sig-type');
    function clear() { ctx.clearRect(0, 0, cv.width, cv.height); inked = false; }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height, p: e.pressure || 0.5 }; }
    cv.addEventListener('pointerdown', function (e) { if (sm !== 'draw') return; drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var sp = Math.hypot(p.x - last.x, p.y - last.y);
      ctx.lineWidth = Math.max(6, Math.min(15, 15 - sp * 0.15));
      ctx.beginPath(); ctx.moveTo(last.x, last.y);
      ctx.quadraticCurveTo(last.x, last.y, (p.x + last.x) / 2, (p.y + last.y) / 2); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; inked = true;
    });
    cv.addEventListener('pointerup', function () { drawing = false; });
    function typed() {
      clear(); var s = typ.value.trim(); if (!s) return;
      ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      var size = 170; ctx.font = 'italic 600 ' + size + 'px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive';
      while (ctx.measureText(s).width > cv.width - 80 && size > 40) { size -= 8; ctx.font = 'italic 600 ' + size + 'px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive'; }
      ctx.fillText(s, cv.width / 2, cv.height / 2); inked = true;
    }
    typ.addEventListener('input', typed);
    function close() { m.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    m.addEventListener('click', function (e) {
      if (e.target === m) return close();
      var b = e.target.closest('[data-sm]');
      if (b) {
        if (b.dataset.sm === 'img') { close(); $('#pe-img').accept = G.IMG_ACCEPT; $('#pe-img').dataset.tag = 'sig'; $('#pe-img').click(); return; }
        sm = b.dataset.sm; m.querySelectorAll('[data-sm]').forEach(function (x) { x.classList.toggle('on', x === b); });
        m.querySelector('[data-typ]').hidden = sm !== 'type'; clear(); if (sm === 'type') { typ.focus(); typed(); }
        return;
      }
      var c = e.target.closest('[data-sc]');
      if (c) {
        color = c.dataset.sc; m.querySelectorAll('[data-sc]').forEach(function (x) { x.classList.toggle('on', x === c); });
        if (sm === 'type') typed();
        else if (inked) { ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = color; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalCompositeOperation = 'source-over'; }
        return;
      }
      var a = e.target.closest('[data-sa]'); if (!a) return;
      if (a.dataset.sa === 'clear') { clear(); if (sm === 'type') typ.value = ''; }
      else if (a.dataset.sa === 'close') close();
      else if (a.dataset.sa === 'use') {
        if (!inked) return toast('Эхлээд гарын үсгээ зурна уу');
        var t = trim(cv); close();
        fabric.Image.fromURL(t.toDataURL('image/png'), function (im) {
          var p = curPage(), d = dims(p), k = Math.min(170 / im.width, (d.w * 0.4) / im.width);
          im.set({ scaleX: k, scaleY: k, data: { k: 'sig' } });
          addObj(p, im, true); setMode('select');
        });
      }
    });
  }
  function trim(c) {
    var ctx = c.getContext('2d'), d = ctx.getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (var y = 0; y < c.height; y++) for (var x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    var pad = 10; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(c.width, x1 + pad); y1 = Math.min(c.height, y1 + pad);
    var o = document.createElement('canvas'); o.width = x1 - x0; o.height = y1 - y0;
    o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
    return o;
  }

  // ---------- thumbnails & page operations ----------
  function pgToolsUi() {
    var n = Object.keys(selPages).length;
    $('#pe-pgtools').innerHTML =
      '<button class="ib" data-pg="rotL" title="Зүүн тийш эргүүлэх">' + ic('rotL') + '</button>' +
      '<button class="ib" data-pg="rotR" title="Баруун тийш эргүүлэх">' + ic('rotR') + '</button>' +
      '<button class="ib" data-pg="up" title="Дээш зөөх">' + ic('up') + '</button>' +
      '<button class="ib" data-pg="down" title="Доош зөөх">' + ic('down') + '</button>' +
      '<button class="ib" data-pg="dup" title="Хуудсыг хувилах">' + ic('dup') + '</button>' +
      '<button class="ib" data-pg="blank" title="Хоосон хуудас нэмэх">' + ic('blank') + '</button>' +
      '<button class="ib" data-pg="addf" title="Файл нэмэх (PDF, Word, зураг…)">' + ic('addf') + '</button>' +
      '<button class="ib" data-pg="extract" title="' + (n > 1 ? 'Сонгосон ' + n + ' хуудсыг' : 'Энэ хуудсыг') + ' тусад нь татах">' + ic('extract') + '</button>' +
      '<button class="ib" data-pg="del" title="Хуудас устгах">' + ic('del') + '</button>';
  }
  function targets() {
    var ids = Object.keys(selPages).filter(function (id) { return pageById(id); });
    if (!ids.length && cur) ids = [cur.id];
    return pages.filter(function (p) { return ids.indexOf(p.id) >= 0; });
  }
  function rotateObjs(p, dir) {
    var f = ensureFab(p), d = dims(p); // dims before rotation
    if (!f) return;
    f.discardActiveObject();
    f.getObjects().forEach(function (o) {
      var c = o.getCenterPoint(), n = dir > 0 ? new fabric.Point(d.h - c.y, c.x) : new fabric.Point(c.y, d.w - c.x);
      o.rotate((o.angle || 0) + (dir > 0 ? 90 : -90));
      o.setPositionByOrigin(n, 'center', 'center'); o.setCoords();
    });
  }
  function pageOp(op) {
    var t = targets(); if (!t.length && op !== 'addf' && op !== 'blank') return;
    if (op === 'rotL' || op === 'rotR') {
      var dir = op === 'rotR' ? 1 : -1;
      quiet++;
      t.forEach(function (p) { rotateObjs(p, dir); p.rot = (p.rot + dir * 90 + 360) % 360; p.rs = 0; p.text = null; p.done = {}; if (p.fab) { p.objs = p.fab.toJSON(PROPS).objects; disposeFab(p); } });
      quiet--;
    } else if (op === 'del') {
      if (t.length >= pages.length) return toast('Сүүлийн хуудсыг устгах боломжгүй');
      t.forEach(function (p) { pages.splice(pages.indexOf(p), 1); dropPage(p); delete selPages[p.id]; });
      if (t.indexOf(cur) >= 0) cur = null;
    } else if (op === 'dup') {
      t.slice().reverse().forEach(function (p) {
        var c = mkPage(p.src, p.idx, p.rot0, p.view, p.rot, JSON.parse(JSON.stringify(objsOf(p))));
        pages.splice(pages.indexOf(p) + 1, 0, c);
      });
    } else if (op === 'up' || op === 'down') {
      var idxs = t.map(function (p) { return pages.indexOf(p); }).sort(function (a, b) { return a - b; });
      if (op === 'up' && idxs[0] > 0) idxs.forEach(function (i) { var x = pages[i]; pages[i] = pages[i - 1]; pages[i - 1] = x; });
      else if (op === 'down' && idxs[idxs.length - 1] < pages.length - 1) idxs.reverse().forEach(function (i) { var x = pages[i]; pages[i] = pages[i + 1]; pages[i + 1] = x; });
      else return;
    } else if (op === 'blank') {
      var at = cur ? pages.indexOf(cur) + 1 : pages.length, b = blankPage();
      pages.splice(at, 0, b); cur = b;
    } else if (op === 'addf') {
      var inp = $('#pe-file'); inp.dataset.at = cur ? pages.indexOf(cur) + 1 : pages.length; inp.click(); return;
    } else if (op === 'extract') { return download(t, true); }
    layoutPages(); renderThumbs(); commit(true);
    if (op === 'blank' && cur && cur.el) cur.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('#pe-pgtools').addEventListener('click', function (e) { var b = e.target.closest('[data-pg]'); if (b) pageOp(b.dataset.pg); });

  var thIo = new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { var p = pageById(en.target.dataset.id); if (p) drawThumb(p, en.target); } });
  }, { root: thumbsEl, rootMargin: '300px 0px' });
  function renderThumbs() {
    pgToolsUi();
    thumbsEl.querySelectorAll('.th').forEach(function (el) { thIo.unobserve(el); });
    var W = isMob() ? 108 : window.innerWidth <= 980 ? 108 : 130;
    thumbsEl.innerHTML = pages.map(function (p, i) {
      var d = dims(p);
      return '<div class="th' + (p === cur ? ' cur' : '') + (selPages[p.id] ? ' sel' : '') + '" draggable="true" data-id="' + p.id + '" role="button" tabindex="0" aria-label="Хуудас ' + (i + 1) + '">' +
        '<div class="tb" style="height:' + Math.round(W * d.h / d.w) + 'px"></div><span class="tn">' + (i + 1) + '</span></div>';
    }).join('');
    thumbsEl.querySelectorAll('.th').forEach(function (el) { thIo.observe(el); });
  }
  function drawThumb(p, el) {
    var box = el.querySelector('.tb'); if (!box || box.firstChild) return;
    if (p.src < 0) return;
    var W = box.clientWidth || 130;
    sources[p.src].doc.getPage(p.idx + 1).then(function (pg) {
      var d = dims(p), vp = pg.getViewport({ scale: W / d.w * Math.min(dpr, 2), rotation: R(p) });
      var c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () { if (!box.firstChild) box.appendChild(c); });
    }).catch(function () {});
  }
  thumbsEl.addEventListener('click', function (e) {
    var el = e.target.closest('.th'); if (!el) return;
    var p = pageById(el.dataset.id); if (!p) return;
    if (e.ctrlKey || e.metaKey) { if (selPages[p.id]) delete selPages[p.id]; else selPages[p.id] = 1; }
    else if (e.shiftKey && cur) {
      var a = pages.indexOf(cur), b = pages.indexOf(p); selPages = {};
      for (var i = Math.min(a, b); i <= Math.max(a, b); i++) selPages[pages[i].id] = 1;
    } else { selPages = {}; p.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (isMob()) $('#pe-side').classList.remove('open'); }
    setCur(p); markThumbs(); pgToolsUi();
  });
  function markThumbs() {
    thumbsEl.querySelectorAll('.th').forEach(function (el) { el.classList.toggle('cur', !!cur && el.dataset.id === cur.id); el.classList.toggle('sel', !!selPages[el.dataset.id]); });
  }
  // drag to reorder
  var dragId = null;
  thumbsEl.addEventListener('dragstart', function (e) { var el = e.target.closest('.th'); if (!el) return; dragId = el.dataset.id; el.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (x) {} });
  thumbsEl.addEventListener('dragend', function () { dragId = null; thumbsEl.querySelectorAll('.th').forEach(function (el) { el.classList.remove('drag', 'over-a', 'over-b'); }); });
  thumbsEl.addEventListener('dragover', function (e) {
    if (!dragId) return; e.preventDefault();
    var el = e.target.closest('.th'); thumbsEl.querySelectorAll('.th').forEach(function (x) { x.classList.remove('over-a', 'over-b'); });
    if (!el || el.dataset.id === dragId) return;
    var r = el.getBoundingClientRect(); el.classList.add(e.clientY < r.top + r.height / 2 ? 'over-b' : 'over-a');
  });
  thumbsEl.addEventListener('drop', function (e) {
    if (!dragId) return; e.preventDefault();
    var el = e.target.closest('.th'); if (!el || el.dataset.id === dragId) return;
    var p = pageById(dragId), r = el.getBoundingClientRect(), after = e.clientY >= r.top + r.height / 2;
    var moving = selPages[dragId] ? pages.filter(function (x) { return selPages[x.id]; }) : [p];
    pages = pages.filter(function (x) { return moving.indexOf(x) < 0; });
    var i = pages.indexOf(pageById(el.dataset.id)) + (after ? 1 : 0);
    pages.splice.apply(pages, [i, 0].concat(moving));
    layoutPages(); renderThumbs(); commit(true);
  });

  function setCur(p) {
    if (cur === p) return;
    cur = p;
    pages.forEach(function (q) { if (q.el) q.el.classList.toggle('cur', q === p); });
    markThumbs();
  }
  var curT;
  function updateCur() {
    // current page = the one covering the middle of the viewport
    var vr = view.getBoundingClientRect(), mid = vr.top + vr.height * 0.4, best = null;
    for (var i = 0; i < pages.length; i++) {
      var el = pages[i].el; if (!el) continue;
      var r = el.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { best = pages[i]; break; }
      if (!best && r.top > mid) best = pages[i];
    }
    if (best && best !== cur) {
      setCur(best);
      var th = thumbsEl.querySelector('[data-id="' + best.id + '"]');
      if (th && !isMob()) { var tr = th.getBoundingClientRect(), sr = thumbsEl.getBoundingClientRect(); if (tr.top < sr.top || tr.bottom > sr.bottom) th.scrollIntoView({ block: 'nearest' }); }
    }
  }
  view.addEventListener('scroll', function () { clearTimeout(curT); curT = setTimeout(updateCur, 80); }, { passive: true });

  // ---------- zoom ----------
  function fitZoom() {
    // widest page on desktop; on phones the first page, so portrait pages fill the screen
    var maxW = 0; pages.forEach(function (p) { maxW = Math.max(maxW, dims(p).w); });
    if (isMob() && pages[0]) maxW = dims(pages[0]).w;
    var avail = view.clientWidth - (isMob() ? 16 : 56);
    return Math.max(0.2, Math.min(isMob() ? 3 : 1.6, avail / (maxW || 600)));
  }
  function setZoom(z, keepFit) {
    var anchor = cur && cur.el ? { p: cur, off: (view.scrollTop - cur.el.offsetTop) / zoom } : null;
    zoom = Math.max(0.2, Math.min(5, z)); fitMode = !!keepFit;
    layoutPages();
    if (anchor && anchor.p.el) view.scrollTop = anchor.p.el.offsetTop + anchor.off * zoom;
    if (mode === 'edit') pages.forEach(function (p) { if (p.vis) textLayer(p); });
  }
  document.querySelector('.zoomg').addEventListener('click', function (e) {
    var b = e.target.closest('[data-zoom]'); if (!b) return;
    var z = b.dataset.zoom;
    if (z === 'in') setZoom(zoom * 1.2); else if (z === 'out') setZoom(zoom / 1.2); else setZoom(fitZoom(), true);
  });
  view.addEventListener('wheel', function (e) {
    if (!(e.ctrlKey || e.metaKey) || !pages.length) return;
    e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
  }, { passive: false });
  // two-finger pinch zoom on touch screens (preview with CSS, re-render on release)
  var pinch = null;
  view.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 2 || !pages.length) return;
    var t = e.touches, r = pagesEl.getBoundingClientRect();
    pinch = { d: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY), k: 1,
      ox: (t[0].clientX + t[1].clientX) / 2 - r.left, oy: (t[0].clientY + t[1].clientY) / 2 - r.top };
    pages.forEach(function (p) { if (p.fab) { p.fab.isDrawingMode = false; p.fab.discardActiveObject(); } });
  }, { passive: true });
  view.addEventListener('touchmove', function (e) {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    var t = e.touches, d = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    pinch.k = Math.max(0.3 / zoom, Math.min(4 / zoom, d / pinch.d));
    pagesEl.style.transformOrigin = pinch.ox + 'px ' + pinch.oy + 'px';
    pagesEl.style.transform = 'scale(' + pinch.k + ')';
  }, { passive: false });
  view.addEventListener('touchend', function (e) {
    if (!pinch || e.touches.length) return;
    var k = pinch.k; pinch = null;
    pagesEl.style.transform = ''; pagesEl.style.transformOrigin = '';
    pages.forEach(applyMode);
    if (Math.abs(k - 1) > 0.03) setZoom(zoom * k);
  });
  var rzT;
  window.addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(function () { if (fitMode && pages.length) setZoom(fitZoom(), true); }, 150); });

  // ---------- export ----------
  function download(list, extract, flat) {
    list = list || pages;
    if (!list.length) return;
    // leave text editing so the last keystrokes are included
    pages.forEach(function (p) { var o = p.fab && p.fab.getActiveObject(); if (o && o.isEditing) o.exitEditing(); });
    busy(true, 'PDF бэлдэж байна…');
    return buildPdf(list, flat).then(function (bytes) {
      busy(false);
      var n = ($('#pe-name').value.trim() || docName || 'document').replace(/[\\/:*?"<>|]+/g, '-');
      saveBlob(n + (extract ? '-хуудас' : '') + '.pdf', new Blob([bytes], { type: 'application/pdf' }));
      toast(extract ? list.length + ' хуудсыг тусад нь татлаа' : flat ? 'Нууцлалтай PDF татагдлаа ✓' : 'PDF татагдлаа ✓');
    }).catch(function (e) { busy(false); console.error(e); toast('PDF үүсгэж чадсангүй: ' + (e && e.message || e), 6000); });
  }
  function buildPdf(list, flat) {
    return G.pdfLib().then(function (PL) {
      return PL.PDFDocument.create().then(function (out) {
        out.setTitle($('#pe-name').value.trim() || docName || 'Document'); out.setProducer('Graphican PDF editor — graphican.online'); out.setCreator('Graphican');
        var srcDocs = {};
        function srcDoc(i) {
          if (!(i in srcDocs)) srcDocs[i] = PL.PDFDocument.load(sources[i].bytes, sources[i].pw != null ? { password: sources[i].pw, updateMetadata: false } : { updateMetadata: false }).catch(function () { return null; });
          return srcDocs[i];
        }
        return list.reduce(function (pr, p) {
          return pr.then(function () {
            var d = dims(p);
            if (flat && p.src >= 0) {
              // burn whiteouts into a bitmap of the page: hidden text is really gone, not just covered
              return liveObjs(p).then(function (objs) {
                var wo = objs.filter(function (o) { return o.data && o.data.k === 'wo'; });
                if (!wo.length) return null;
                return rasterPage(p).then(function (c) {
                  var ctx = c.getContext('2d'), sc = c.width / d.w;
                  wo.forEach(function (o) {
                    var m = o.calcTransformMatrix();
                    ctx.setTransform(sc * m[0], sc * m[1], sc * m[2], sc * m[3], sc * m[4], sc * m[5]);
                    ctx.fillStyle = o.fill || '#fff'; ctx.fillRect(-o.width / 2, -o.height / 2, o.width, o.height);
                  });
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  return G.embedCanvas(out, c).then(function (im) {
                    var pg = out.addPage([d.w, d.h]); pg.drawImage(im, { x: 0, y: 0, width: d.w, height: d.h }); pg.__flat = true;
                    return drawObjs(PL, out, pg, p, true).then(function () { return drawOcr(PL, out, pg, p); });
                  });
                });
              }).then(function (done) { return done === null ? normal() : done; });
            }
            return normal();
            function normal() {
            var mk = p.src < 0 ? Promise.resolve(out.addPage([d.w, d.h])) :
              srcDoc(p.src).then(function (sd) {
                if (sd) return out.copyPages(sd, [p.idx]).then(function (cp) { var pg = out.addPage(cp[0]); pg.setRotation(PL.degrees(R(p))); return pg; });
                // encrypted / unreadable by pdf-lib: keep the look by embedding a high-res render
                return rasterPage(p).then(function (c) {
                  return G.embedCanvas(out, c).then(function (im) {
                    var pg = out.addPage([d.w, d.h]); pg.drawImage(im, { x: 0, y: 0, width: d.w, height: d.h }); pg.__flat = true; return pg;
                  });
                });
              });
            return mk.then(function (pg) { return drawObjs(PL, out, pg, p).then(function () { return drawOcr(PL, out, pg, p); }); });
            }
          });
        }, Promise.resolve()).then(function () {
          if (!out.__hasFields) return out.save();
          // form fields: Cyrillic-capable appearance font
          return G.embedFont(out, 'Inter', false).then(function (font) { try { out.getForm().updateFieldAppearances(font); } catch (e) {} return out.save(); });
        });
      });
    });
  }
  function rasterPage(p) {
    return sources[p.src].doc.getPage(p.idx + 1).then(function (pg) {
      var vp = pg.getViewport({ scale: 2.5, rotation: R(p) }), c = document.createElement('canvas');
      c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () { return c; });
    });
  }
  function liveObjs(p) {
    if (p.fab) return Promise.resolve(p.fab.getObjects());
    return new Promise(function (res) { fabric.util.enlivenObjects(p.objs || [], res); }).then(function (list) {
      return Promise.all(list.map(function (o) { return o.type === 'i-text' ? G.screenFont(famOf(o), isBold(o)).then(function () { o.initDimensions(); return o; }) : o; }));
    });
  }
  function drawObjs(PL, out, pg, p, skipWo) {
    return liveObjs(p).then(function (objs) {
      if (skipWo) objs = objs.filter(function (o) { return !(o.data && o.data.k === 'wo'); });
      if (!objs.length) return;
      var d = dims(p);
      // view → PDF user space for this output page
      var V2P = pg.__flat ? [1, 0, 0, -1, 0, d.h] : inv(vpT(p.view, R(p), 1));
      return objs.reduce(function (pr, o) { return pr.then(function () { return drawObj(PL, out, pg, o, V2P); }); }, Promise.resolve());
    });
  }
  function placement(V2P, m, lx, ly) {
    // origin + rotation (deg, CCW in PDF) of an object-local point/axis
    var o = ap(m, lx, ly), ax = ap(m, lx + 1, ly);
    var po = ap(V2P, o.x, o.y), pa = ap(V2P, ax.x, ax.y);
    return { x: po.x, y: po.y, rot: Math.atan2(pa.y - po.y, pa.x - po.x) * 180 / Math.PI };
  }
  function drawObj(PL, out, pg, o, V2P) {
    if (o.data && o.data.k === 'field') return drawField(PL, out, pg, o, V2P);
    var m = o.calcTransformMatrix(), op = o.opacity == null ? 1 : o.opacity;
    var k = (o.data && o.data.k) || '';
    if (o.type === 'rect' && !o.skewX && !o.skewY) {
      var w = o.width, h = o.height, pl = placement(V2P, m, -w / 2, h / 2), sx = o.scaleX, sy = o.scaleY;
      var fill = o.fill && o.fill !== 'transparent' ? PL.rgb.apply(null, hexRgb(o.fill)) : undefined;
      var bw = o.stroke && o.strokeWidth ? o.strokeWidth : 0;
      pg.drawRectangle({
        x: pl.x, y: pl.y, width: w * sx, height: h * sy, rotate: PL.degrees(pl.rot),
        color: fill, opacity: op, borderColor: bw ? PL.rgb.apply(null, hexRgb(o.stroke)) : undefined, borderWidth: bw, borderOpacity: op,
        blendMode: k === 'hl' ? PL.BlendMode.Multiply : undefined
      });
      return;
    }
    if (o.type === 'i-text' || o.type === 'textbox') {
      var fam = famOf(o), bold = isBold(o);
      return G.embedFont(out, fam, bold).then(function (font) {
        var cs = charSet(font), col = PL.rgb.apply(null, hexRgb(o.fill));
        var y = -o.height / 2, lines = o._textLines || [];
        for (var i = 0; i < lines.length; i++) {
          var hl = o.getHeightOfLine(i), base = y + hl / o.lineHeight * (1 - o._fontSizeFraction);
          var str = lines[i].join(''), s2 = '';
          for (var ch of str) { var cp = ch.codePointAt(0); s2 += cs.has(cp) || cp < 32 ? ch : '?'; }
          if (s2.trim()) {
            var pl2 = placement(V2P, m, -o.width / 2 + o._getLineLeftOffset(i), base);
            pg.drawText(s2, { x: pl2.x, y: pl2.y, size: o.fontSize * o.scaleY, font: font, color: col, opacity: op, rotate: PL.degrees(pl2.rot) });
          }
          y += hl;
        }
      });
    }
    if (o.type === 'image' && !o.skewX && !o.skewY && !o.flipX && !o.flipY) {
      var el = o.getElement(), src = o.getSrc ? o.getSrc() : '';
      var pr = /^data:image\/jpe?g/.test(src) ? fetch(src).then(function (r) { return r.arrayBuffer(); }).then(function (b) { return out.embedJpg(b); })
        : /^data:image\/png/.test(src) ? fetch(src).then(function (r) { return r.arrayBuffer(); }).then(function (b) { return out.embedPng(b); })
          : G.embedCanvas(out, (function () { var c = document.createElement('canvas'); c.width = el.naturalWidth || el.width; c.height = el.naturalHeight || el.height; c.getContext('2d').drawImage(el, 0, 0); return c; })());
      return pr.then(function (im) {
        var w = o.width, h = o.height, pl = placement(V2P, m, -w / 2, h / 2);
        pg.drawImage(im, { x: pl.x, y: pl.y, width: w * o.scaleX, height: h * o.scaleY, rotate: PL.degrees(pl.rot), opacity: op });
      });
    }
    // paths, lines, ellipses, arrows, stamps: crisp high-res bitmap of exactly that object
    var br = o.getBoundingRect(true, true), mult = Math.min(6, Math.max(3, 2400 / Math.max(br.width, br.height, 1)));
    var c = o.toCanvasElement({ multiplier: mult, enableRetinaScaling: false });
    var cw = c.width / mult, ch = c.height / mult; // may include a few px of padding around br
    var cx = br.left + br.width / 2, cy = br.top + br.height / 2;
    var pl = placement(V2P, [1, 0, 0, 1, cx, cy], -cw / 2, ch / 2);
    return G.embedCanvas(out, c).then(function (im) {
      pg.drawImage(im, { x: pl.x, y: pl.y, width: cw, height: ch, rotate: PL.degrees(pl.rot) });
    });
  }
  var charSets = new WeakMap();
  function charSet(font) { var s = charSets.get(font); if (!s) { s = new Set(font.getCharacterSet ? font.getCharacterSet() : []); charSets.set(font, s); } return s; }

  // ================= left rail: convert, translate, organize, sign, AI, fields, share, secure =================

  var RI = {
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    convert: '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>',
    translate: '<path d="M4 5h9M8.5 3v2M11 5c-1 4-3.5 7-7 9M6 9c1.5 2.5 3.5 4 6 5"/><path d="m13 21 4-10 4 10M14.5 17.5h5"/>',
    organize: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    sign: '<path d="m14 3 7 7-9 9H5v-7z"/><path d="M5 19 3 21M9.5 11.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0"/>',
    ai: '<path d="M11 3 9 9 3 11l6 2 2 6 2-6 6-2-6-2z"/><path d="M19 3v4M17 5h4M5 17v3M3.5 18.5h3"/>',
    fields: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M8 10v4M6.5 10h3M6.5 14h3"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    secure: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    xls: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7v6H9zM9 15h7M12.5 12v6"/>',
    ppt: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 20h8"/>',
    img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5L6 20"/>',
    txt: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M12.5 11v7M10 11h5"/>',
    more: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 5 2.3l.1.1a1.7 1.7 0 0 0 1.8.3H7a1.7 1.7 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V7a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" transform="scale(.8) translate(3 3)"/>',
    zip: '<path d="M6 3h12v18H6z"/><path d="M11 3v2h2v2h-2v2h2v2h-2v2"/>',
    num: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    compress: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
    split: '<path d="M6 3h8l4 4v5M6 3v18h6"/><path d="m15 15 6 6M21 15l-6 6"/>',
    merge: '<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M12 10v6M9 13h6"/>',
    reverse: '<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    wm: '<path d="M4 20 20 4" stroke-dasharray="3 3"/><path d="M7 10h4M13 14h4"/>',
    ocr: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><path d="M8 9h8M8 12h8M8 15h5"/>',
    sum: '<path d="M5 6h14M5 10h14M5 14h9M5 18h6"/>',
    ask: '<path d="M21 12a8 8 0 0 1-11.7 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 16.5h.01"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>', cross: '<path d="M6 6l12 12M18 6L6 18"/>',
    date: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    initials: '<path d="M4 17V7l4 10V7M13 17h5M13 7h5M15.5 7v10"/>',
    tfield: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 10v4"/>',
    mfield: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    cbox: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>'
  };
  function ri(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (RI[n] || I[n] || '') + '</svg>'; }
  var LANGS = [['en', 'Англи', 'EN'], ['mn', 'Монгол', 'MN'], ['ru', 'Орос', 'RU'], ['zh', 'Хятад', 'ZH'], ['ja', 'Япон', 'JA'], ['ko', 'Солонгос', 'KO'],
    ['de', 'Герман', 'DE'], ['fr', 'Франц', 'FR'], ['es', 'Испани', 'ES'], ['it', 'Итали', 'IT'], ['tr', 'Турк', 'TR'], ['kk', 'Казах', 'KK'],
    ['uk', 'Украин', 'UK'], ['pl', 'Польш', 'PL'], ['pt', 'Португал', 'PT'], ['ar', 'Араб', 'AR'], ['hi', 'Хинди', 'HI'], ['vi', 'Вьетнам', 'VI'], ['th', 'Тай', 'TH'], ['id', 'Индонез', 'ID']];
  function langName(c) { var l = LANGS.filter(function (x) { return x[0] === c; })[0]; return l ? l[1] : c; }

  var RAIL = [
    ['edit', 'Засах'], ['convert', 'Хөрвүүлэх'], ['translate', 'Орчуулах'], ['organize', 'Хуудас'], ['sign', 'Гарын үсэг'],
    ['ai', 'AI хэрэгсэл'], ['fields', 'Талбар нэмэх'], ['share', 'Хуваалцах'], ['secure', 'Хамгаалах']
  ];
  function menuItems(k) {
    if (k === 'convert') return [['word', 'doc', 'Word', '.docx — текстийг засах боломжтой'], ['excel', 'xls', 'Excel', '.xlsx — хүснэгт, тоо'], ['ppt', 'ppt', 'PowerPoint', '.pptx — хуудас бүр нэг слайд'],
      ['jpg', 'img', 'JPG зураг', 'Хуудас бүр зураг (ZIP)'], ['png', 'img', 'PNG зураг', 'Өндөр чанартай (ZIP)'], ['txt', 'txt', 'TXT', 'Зөвхөн текст'], ['more', 'more', 'Бусад', 'Word, Excel, зургийг PDF болгох →']];
    if (k === 'translate') return LANGS.slice(0, 6).map(function (l) { return ['tr:' + l[0], null, l[1], null, l[2]]; }).concat([['tr:more', 'more', 'Бусад хэл…']]);
    if (k === 'organize') return [['rotall', 'rotR', 'Бүгдийг эргүүлэх', '90° баруун тийш'], ['reverse', 'reverse', 'Дарааллыг урвуулах'], ['merge', 'merge', 'Файл нэгтгэх', 'PDF, Word, зураг…'],
      ['blank', 'blank', 'Хоосон хуудас нэмэх'], ['extract', 'split', 'Хуудас задлах', 'Жишээ: 1-3, 5'], ['splitall', 'zip', 'Хуудас бүрийг тусад нь', 'ZIP'],
      ['pnum', 'num', 'Хуудасны дугаар'], ['compress', 'compress', 'Хэмжээ багасгах']];
    if (k === 'sign') return [['sig', 'sign', 'Гарын үсэг зурах', 'Зурах, бичих эсвэл зургаас'], ['initials', 'initials', 'Нэрийн эхний үсэг'], ['date', 'date', 'Өнөөдрийн огноо'], ['check', 'check', '✓ тэмдэг'], ['cross', 'cross', '✗ тэмдэг']];
    if (k === 'ai') return [['sum', 'sum', 'Хураангуйлах', 'Гол санааг товч гаргана'], ['ask', 'ask', 'PDF-ээс асуух', 'Баримтын талаар асуулт асуух'], ['tr:menu', 'translate', 'Орчуулах', 'Байршлыг хадгалж орчуулна'], ['ocr', 'ocr', 'Текст таних (OCR)', 'Скан зургийн бичгийг засагддаг болгоно']];
    if (k === 'fields') return [['f:text', 'tfield', 'Текст талбар'], ['f:multi', 'mfield', 'Олон мөрт текст'], ['f:check', 'cbox', 'Сонголтын нүд'], ['f:date', 'date', 'Огнооны талбар'], ['f:sign', 'sign', 'Гарын үсгийн талбар']];
    if (k === 'share') return [['share', 'share', 'Хуваалцах…', 'Messenger, имэйл, бусад апп'], ['print', 'print', 'Хэвлэх'], ['mail', 'mail', 'Имэйлээр илгээх', 'Татаад имэйлд хавсаргана']];
    if (k === 'secure') return [['pw', 'secure', 'Нууц үгээр хамгаалах', 'AES-256 шифрлэлт'], ['unpw', 'unlock', 'Нууц үгийг арилгах'], ['wm', 'wm', 'Усан тэмдэг'], ['flat', 'wo', 'Нууцлалтай хадгалах', 'Цайруулсан мэдээллийг бүрмөсөн устгана']];
    return [];
  }
  function railUi() {
    var el = $('#pe-rail'); if (!el) return;
    el.innerHTML = RAIL.map(function (r) { return '<button type="button" class="rb" data-rail="' + r[0] + '">' + ri(r[0]) + '<span>' + r[1] + '</span></button>'; }).join('');
  }
  var menuEl = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } $$('.rb.on').forEach(function (b) { b.classList.remove('on'); }); }
  function $$(s) { return [].slice.call(document.querySelectorAll(s)); }
  function openRail(k, btn) {
    var was = btn.classList.contains('on');
    closeMenu();
    if (k === 'edit') { setMode('select'); toast('Доод самбараас засах хэрэгслээ сонгоно уу'); return; }
    if (was) return;
    if (!pages.length) { toast('Эхлээд PDF эсвэл файлаа нээнэ үү'); return; }
    btn.classList.add('on');
    menuEl = document.createElement('div'); menuEl.className = 'rmenu';
    menuEl.innerHTML = menuItems(k).map(function (it) {
      return '<button type="button" data-ra="' + it[0] + '">' + (it[4] ? '<b class="code">' + it[4] + '</b>' : ri(it[1])) + '<span><b>' + it[2] + '</b>' + (it[3] ? '<small>' + it[3] + '</small>' : '') + '</span></button>';
    }).join('');
    document.body.appendChild(menuEl);
    var r = btn.getBoundingClientRect(), mr = menuEl.getBoundingClientRect();
    if (isMob()) { menuEl.style.left = Math.max(8, Math.min(window.innerWidth - mr.width - 8, r.left)) + 'px'; menuEl.style.top = (r.bottom + 6) + 'px'; }
    else { menuEl.style.left = (r.right + 8) + 'px'; menuEl.style.top = Math.max(60, Math.min(window.innerHeight - mr.height - 12, r.top - 8)) + 'px'; }
    menuEl.addEventListener('click', function (e) { var b = e.target.closest('[data-ra]'); if (!b) return; closeMenu(); railAction(b.dataset.ra); });
  }
  document.addEventListener('mousedown', function (e) { if (menuEl && !menuEl.contains(e.target) && !e.target.closest('.rb')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  function railAction(a) {
    if (/^tr:/.test(a)) { var l = a.slice(3); return translateDialog(l === 'more' || l === 'menu' ? null : l); }
    if (/^f:/.test(a)) return addField(a.slice(2));
    switch (a) {
      case 'word': case 'excel': case 'ppt': case 'jpg': case 'png': case 'txt': return convert(a);
      case 'more': location.href = '/tools/pdf/'; return;
      case 'rotall': selPages = {}; pages.forEach(function (p) { selPages[p.id] = 1; }); pageOp('rotR'); selPages = {}; markThumbs(); return;
      case 'reverse': pages.reverse(); layoutPages(); renderThumbs(); commit(true); toast('Дараалал урвууллаа'); return;
      case 'merge': fileIn.dataset.at = pages.length; fileIn.click(); return;
      case 'blank': return pageOp('blank');
      case 'extract': return extractDialog();
      case 'splitall': return splitAll();
      case 'pnum': return pageNumDialog();
      case 'compress': return compressDialog();
      case 'sig': return signModal();
      case 'initials': return initialsDialog();
      case 'date': case 'check': case 'cross': return addStamp(a);
      case 'sum': return aiDialog('summary');
      case 'ask': return aiDialog('ask');
      case 'ocr': return ocrDialog();
      case 'share': return sharePdf();
      case 'print': return printPdf();
      case 'mail': return mailPdf();
      case 'pw': return passwordDialog();
      case 'unpw': return removePassword();
      case 'wm': return watermarkDialog();
      case 'flat': return download(pages, false, true);
    }
  }

  // ---------- generic dialog ----------
  function dialog(title, body, buttons, onOpen) {
    var m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = '<div class="mbox dlg" role="dialog" aria-modal="true" aria-label="' + esc(title) + '"><h2>' + esc(title) + '</h2><div class="dlg-b">' + body + '</div>' +
      '<div class="mrow dlg-f"><span class="grow"></span>' + (buttons || []).map(function (b, i) { return '<button type="button" class="' + (b.primary ? 'btn-primary' : 'btn') + '" data-db="' + i + '">' + esc(b.label) + '</button>'; }).join('') + '</div></div>';
    document.body.appendChild(m);
    function close() { m.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    m.addEventListener('click', function (e) {
      if (e.target === m) return close();
      var b = e.target.closest('[data-db]'); if (!b) return;
      var fn = buttons[+b.dataset.db].fn;
      if (!fn || fn(m, close) !== false) close();
    });
    if (onOpen) onOpen(m, close);
    var f = m.querySelector('input, select, textarea'); if (f) setTimeout(function () { f.focus(); }, 30);
    return { el: m, close: close };
  }
  function val(m, sel) { var e = m.querySelector(sel); return e ? (e.type === 'checkbox' ? e.checked : e.value) : null; }

  // ---------- output helpers ----------
  function outName(ext, extra) { return ($('#pe-name').value.trim() || docName || 'document').replace(/[\\/:*?"<>|]+/g, '-') + (extra || '') + '.' + ext; }
  function finishEdits() { pages.forEach(function (p) { var o = p.fab && p.fab.getActiveObject(); if (o && o.isEditing) o.exitEditing(); }); }
  // the edited document, opened again with pdf.js (for conversions)
  function builtDoc() {
    finishEdits();
    return buildPdf(pages).then(function (bytes) {
      return G.pdfjs().then(function (pj) { return pj.getDocument({ data: bytes.slice(), isEvalSupported: false }).promise.then(function (d) { return { doc: d, bytes: bytes, pj: pj }; }); });
    });
  }
  function renderOut(doc, i, scale, maxPx) {
    return doc.getPage(i).then(function (pg) {
      var vp0 = pg.getViewport({ scale: 1 }), s = Math.min(scale, (maxPx || 4000) / Math.max(vp0.width, vp0.height));
      var vp = pg.getViewport({ scale: s }), c = document.createElement('canvas');
      c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      return pg.render({ canvasContext: x, viewport: vp }).promise.then(function () { return { c: c, w: vp0.width, h: vp0.height }; });
    });
  }
  // text lines of a pdf.js page in display coordinates (top → bottom), each with its items
  function pageLines(pg, pj) {
    var vp = pg.getViewport({ scale: 1 });
    return pg.getTextContent().then(function (tc) {
      var its = tc.items.filter(function (it) { return it.str && it.str.trim(); }).map(function (it) {
        var t = pj.Util.transform(vp.transform, it.transform), fs = Math.hypot(t[2], t[3]) || 10;
        var bold = /bold|black|heavy|semibold/i.test((tc.styles[it.fontName] || {}).fontFamily || '') || /bold/i.test(it.fontName || '');
        return { s: it.str, x: t[4], y: t[5], fs: fs, w: it.width, bold: bold };
      }).sort(function (a, b) { return a.y - b.y || a.x - b.x; });
      var lines = [];
      its.forEach(function (it) {
        var L = lines[lines.length - 1];
        if (L && Math.abs(L.y - it.y) < Math.max(L.fs, it.fs) * 0.45) { L.items.push(it); L.fs = Math.max(L.fs, it.fs); }
        else lines.push({ y: it.y, fs: it.fs, items: [it] });
      });
      lines.forEach(function (L) {
        L.items.sort(function (a, b) { return a.x - b.x; });
        L.x = L.items[0].x; var la = L.items[L.items.length - 1]; L.right = la.x + la.w; L.bold = L.items.every(function (i) { return i.bold; });
        var txt = '', cells = [[]], prev = null;
        L.items.forEach(function (it) {
          if (prev) {
            var gap = it.x - (prev.x + prev.w);
            if (gap > L.fs * 1.4) cells.push([]);
            else if (gap > L.fs * 0.12 && !/\s$/.test(txt) && !/^\s/.test(it.s)) txt += ' ';
            if (gap > L.fs * 1.4 && !/\s$/.test(txt)) txt += ' ';
          }
          txt += it.s; cells[cells.length - 1].push(it.s); prev = it;
        });
        L.text = txt.replace(/\s+/g, ' ').trim();
        L.cells = cells.map(function (c) { return c.join(' ').replace(/\s+/g, ' ').trim(); });
      });
      return { lines: lines, w: vp.width, h: vp.height };
    });
  }
  function allLines(doc, pj) {
    var out = [], i = 0;
    function next() { i++; if (i > doc.numPages) return Promise.resolve(out); return doc.getPage(i).then(function (pg) { return pageLines(pg, pj); }).then(function (r) { out.push(r); return next(); }); }
    return next();
  }
  // minimal ZIP writer (stored, UTF-8 names)
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(d) { var c = 0xffffffff; for (var i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
  function zip(files) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0;
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + data.length;
    });
    var csize = central.reduce(function (a, b) { return a + b.length; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
  }
  function canvasBytes(c, type, q) { return new Promise(function (res) { c.toBlob(function (b) { b.arrayBuffer().then(function (a) { res(new Uint8Array(a)); }); }, type, q); }); }
  function xmlEsc(s) { return String(s).replace(/[<>&"]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]; }).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ''); }

  // ---------- convert ----------
  function convert(kind) {
    busy(true, 'Бэлдэж байна…');
    var job = builtDoc().then(function (r) {
      var doc = r.doc, pj = r.pj, n = doc.numPages;
      if (kind === 'jpg' || kind === 'png') {
        var files = [], i = 0;
        var step = function () {
          i++; if (i > n) return;
          busy(true, 'Хуудас ' + i + ' / ' + n + ' зураг болгож байна…');
          return renderOut(doc, i, kind === 'png' ? 2.5 : 2, 5000).then(function (o) { return canvasBytes(o.c, kind === 'png' ? 'image/png' : 'image/jpeg', 0.9); })
            .then(function (b) { files.push({ name: outName(kind, '-' + ('00' + i).slice(-3)).replace(/^.*?([^\\/]+)$/, '$1'), data: b }); return step(); });
        };
        return step().then(function () {
          if (files.length === 1) saveBlob(files[0].name, new Blob([files[0].data], { type: 'image/' + (kind === 'png' ? 'png' : 'jpeg') }));
          else saveBlob(outName('zip', '-' + kind), zip(files));
          toast(n + ' хуудас ' + kind.toUpperCase() + ' боллоо ✓');
        });
      }
      if (kind === 'ppt') {
        return G.loadScript('/assets/vendor/pptxgen.bundle.js').then(function () {
          var P = new window.PptxGenJS(), first = null, i = 0;
          var step = function () {
            i++; if (i > n) return;
            busy(true, 'Слайд ' + i + ' / ' + n + '…');
            return renderOut(doc, i, 2, 2600).then(function (o) {
              if (!first) { first = o; P.defineLayout({ name: 'PDF', width: 10, height: +(10 * o.h / o.w).toFixed(3) }); P.layout = 'PDF'; }
              var W = 10, Hh = 10 * first.h / first.w, k = Math.min(W / o.w, Hh / o.h), w = o.w * k, h = o.h * k;
              var s = P.addSlide(); s.background = { color: 'FFFFFF' };
              s.addImage({ data: o.c.toDataURL('image/jpeg', 0.9), x: (W - w) / 2, y: (Hh - h) / 2, w: w, h: h });
              return step();
            });
          };
          return step().then(function () { return P.write({ outputType: 'blob' }); }).then(function (b) { saveBlob(outName('pptx'), b); toast('PowerPoint боллоо ✓'); });
        });
      }
      busy(true, 'Текстийг уншиж байна…');
      return allLines(doc, pj).then(function (pgs) {
        var chars = pgs.reduce(function (a, p) { return a + p.lines.reduce(function (b, l) { return b + l.text.length; }, 0); }, 0);
        if (!chars) { toast('Энэ PDF-д текст алга (скан зураг байж магадгүй). Эхлээд AI хэрэгсэл → «Текст таних (OCR)»-ийг ажиллуулна уу.', 6000); return; }
        if (kind === 'txt') {
          var t = pgs.map(function (p) { return p.lines.map(function (l) { return l.text; }).join('\n'); }).join('\n\n\f\n');
          saveBlob(outName('txt'), new Blob(['\ufeff' + t], { type: 'text/plain;charset=utf-8' })); toast('TXT боллоо ✓'); return;
        }
        if (kind === 'excel') {
          return G.loadScript('/assets/vendor/xlsx.min.js').then(function () {
            var X = window.XLSX, wb = X.utils.book_new();
            pgs.forEach(function (p, i) {
              var rows = p.lines.map(function (l) { return l.cells.map(function (c) { var v = c.replace(/[\s\u00a0]/g, '').replace(/,(?=\d{3}\b)/g, ''); return /^-?\d+(\.\d+)?$/.test(v) ? +v : c; }); });
              var ws = X.utils.aoa_to_sheet(rows.length ? rows : [['']]);
              var widths = []; rows.forEach(function (r) { r.forEach(function (c, j) { widths[j] = Math.max(widths[j] || 6, Math.min(60, String(c).length + 2)); }); });
              ws['!cols'] = widths.map(function (w) { return { wch: w }; });
              X.utils.book_append_sheet(wb, ws, 'Хуудас ' + (i + 1));
            });
            var out = X.write(wb, { bookType: 'xlsx', type: 'array' });
            saveBlob(outName('xlsx'), new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); toast('Excel боллоо ✓');
          });
        }
        if (kind === 'word') { saveBlob(outName('docx'), makeDocx(pgs)); toast('Word боллоо ✓ — Word, Google Docs-оор нээж засна'); }
      });
    });
    job.catch(function (e) { console.error(e); toast('Хөрвүүлж чадсангүй: ' + (e && e.message || e), 6000); }).then(function () { busy(false); });
    return job;
  }
  function makeDocx(pgs) {
    var all = []; pgs.forEach(function (p) { p.lines.forEach(function (l) { all.push(l.fs); }); });
    all.sort(function (a, b) { return a - b; });
    var body = all[Math.floor(all.length / 2)] || 11, xml = '';
    pgs.forEach(function (p, pi) {
      var minX = Infinity, maxR = 0; p.lines.forEach(function (l) { minX = Math.min(minX, l.x); maxR = Math.max(maxR, l.right); });
      var maxW = Math.max(1, maxR - minX);
      // lines → paragraphs (join lines of the same size that follow closely)
      var paras = [];
      p.lines.forEach(function (l, i) {
        var P = paras[paras.length - 1], prev = p.lines[i - 1];
        var close = !!(prev && P && (l.y - prev.y) < Math.max(l.fs, prev.fs) * 1.7 && Math.abs(l.fs - prev.fs) < 0.6 && Math.abs(l.x - prev.x) < l.fs * 2.5 &&
          l.cells.length === 1 && P.cells === 1 && (prev.right - prev.x) > maxW * 0.72);
        if (P && close) { P.text += (/-$/.test(P.text) ? '' : ' ') + l.text; P.text = P.text.replace(/-\s(?=[a-zа-яөү])/g, ''); }
        else paras.push({ text: l.cells.length > 1 ? l.cells.join('\t') : l.text, fs: l.fs, bold: l.bold, x: l.x, cells: l.cells.length, gap: prev ? l.y - prev.y - prev.fs : 0 });
      });
      paras.forEach(function (q) {
        var sz = Math.round(Math.max(7, Math.min(72, q.fs)) * 2), head = q.fs > body * 1.3;
        var ind = Math.max(0, Math.round((q.x - 60) * 20));
        xml += '<w:p><w:pPr><w:spacing w:before="' + Math.min(480, Math.max(0, Math.round((q.gap > body ? q.gap : 0) * 10))) + '" w:after="60" w:line="276" w:lineRule="auto"/>' + (ind > 400 && q.cells === 1 ? '<w:ind w:left="' + Math.min(ind, 5000) + '"/>' : '') + '</w:pPr>' +
          q.text.split('\t').map(function (t, k) { return (k ? '<w:r><w:tab/></w:r>' : '') + '<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/>' + (q.bold || head ? '<w:b/>' : '') + '<w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/></w:rPr><w:t xml:space="preserve">' + xmlEsc(t) + '</w:t></w:r>'; }).join('') + '</w:p>';
      });
      if (pi < pgs.length - 1) xml += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    });
    var f = pgs[0] || { w: 595, h: 842 };
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + xml +
      '<w:sectPr><w:pgSz w:w="' + Math.round(f.w * 20) + '" w:h="' + Math.round(f.h * 20) + '"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>';
    return zip([
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>' },
      { name: 'word/document.xml', data: doc }
    ]);
  }

  // ---------- page text in view units (for translation) ----------
  function viewLines(p, all) {
    var ready = p.text ? Promise.resolve(p.text) : sources[p.src].doc.getPage(p.idx + 1).then(function (pg) { p.pdfPage = pg; return pg.getTextContent(); }).then(function (tc) { p.text = tc; return tc; });
    return ready.then(function (tc) {
      var M = vpT(p.view, R(p), 1), items = allItems(p, tc), lines = [];
      items.forEach(function (it, i) {
        if (!it.str || !it.str.trim() || (!all && p.done && p.done[i])) return;
        var st = it.fontName === 'ocr' ? OCR_STYLE : tc.styles[it.fontName], g = geomOf(M, it, st);
        if (Math.abs(g.ang) > 1) return;
        var L = lines[lines.length - 1];
        if (L && Math.abs(L.base - g.base) < g.fs * 0.35 && g.x - (L.x + L.w) < g.fs * 1.2 && g.x - (L.x + L.w) > -g.fs && Math.abs(L.fs - g.fs) < g.fs * 0.3) {
          if (g.x - (L.x + L.w) > g.fs * 0.12 && !/\s$/.test(L.text)) L.text += ' ';
          L.text += it.str; L.w = g.x + g.w - L.x; L.idx.push(i); L.top = Math.min(L.top, g.top); L.h = Math.max(L.h, g.h);
        } else lines.push({ text: it.str, x: g.x, base: g.base, top: g.top, h: g.h, w: g.w, fs: g.fs, idx: [i], it: it, st: st });
      });
      lines.forEach(function (l) { l.text = l.text.replace(/\s+/g, ' ').trim(); });
      return lines.filter(function (l) { return l.text; });
    });
  }
  var OCR_STYLE = { ascent: 0.8, descent: -0.2, fontFamily: 'sans-serif' };
  function allItems(p, tc) { return (tc ? tc.items : []).concat(p.ocr || []); }
  function detectLang(s) {
    if (/[өүӨҮ]/.test(s)) return 'mn';
    var cyr = (s.match(/[\u0400-\u04FF]/g) || []).length, lat = (s.match(/[A-Za-z]/g) || []).length;
    if (/[\u3040-\u30ff]/.test(s)) return 'ja';
    if (/[\uac00-\ud7af]/.test(s)) return 'ko';
    if (/[\u4e00-\u9fff]/.test(s)) return 'zh';
    if (/[\u0600-\u06ff]/.test(s)) return 'ar';
    return cyr > lat ? (/[іїєґ]/i.test(s) ? 'uk' : /[әғқңұһі]/i.test(s) ? 'kk' : 'ru') : 'en';
  }
  function langSelect(name, cur) { return '<select name="' + name + '" class="dsel">' + LANGS.map(function (l) { return '<option value="' + l[0] + '"' + (l[0] === cur ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select>'; }
  function scopeSelect() { return '<select name="scope" class="dsel"><option value="all">Бүх хуудас (' + pages.length + ')</option><option value="cur">Одоогийн хуудас</option>' + (Object.keys(selPages).length > 1 ? '<option value="sel">Сонгосон хуудсууд</option>' : '') + '</select>'; }
  function scopePages(v) { return v === 'cur' ? [curPage()] : v === 'sel' ? targets() : pages.slice(); }

  function apiJson(r) {
    return r.text().then(function (t) {
      var d; try { d = JSON.parse(t); } catch (e) { d = { error: 'AI сервертэй холбогдож чадсангүй' }; }
      if (!r.ok || d.error) { d.__err = true; d.__status = r.status; }
      return d;
    });
  }
  // ---------- translate (Workers AI · m2m100) ----------
  function translateDialog(target) {
    var sample = '';
    var first = pages.filter(function (p) { return p.src >= 0; })[0];
    var ready = first ? viewLines(first).then(function (ls) { sample = ls.map(function (l) { return l.text; }).join(' ').slice(0, 2000); }) : Promise.resolve();
    ready.then(function () {
      var src = detectLang(sample);
      dialog('Орчуулах', '<p class="note">Текстийг байрлал, хэмжээг нь хадгалан орчуулж, засах боломжтой текст болгоно. Орчуулга хиймэл оюунаар хийгдэх тул чухал баримтаа нэг хянаарай.</p>' +
        '<div class="dgrid"><label>Эх хэл</label>' + langSelect('src', src) + '<label>Орчуулах хэл</label>' + langSelect('dst', target || (src === 'mn' ? 'en' : 'mn')) +
        '<label>Хамрах хүрээ</label>' + scopeSelect() + '</div>',
        [{ label: 'Болих' }, { label: 'Орчуулах', primary: true, fn: function (m) { runTranslate(val(m, '[name=src]'), val(m, '[name=dst]'), scopePages(val(m, '[name=scope]'))); } }]);
    });
  }
  function runTranslate(src, dst, list) {
    if (src === dst) return toast('Эх хэл болон орчуулах хэл ижил байна');
    list = list.filter(function (p) { return p.src >= 0 || p.ocr; });
    busy(true, 'Текстийг цуглуулж байна…');
    var jobs = [];
    return list.reduce(function (pr, p) { return pr.then(function () { return viewLines(p).then(function (ls) { if (ls.length) jobs.push({ p: p, lines: ls }); }); }); }, Promise.resolve())
      .then(function () {
        var texts = []; jobs.forEach(function (j) { j.lines.forEach(function (l) { texts.push(l.text); }); });
        if (!texts.length) throw new Error('Орчуулах текст олдсонгүй. Скан зураг бол эхлээд «Текст таних (OCR)»-ийг ажиллуулна уу.');
        // batches that fit the API limits
        var batches = [], cur = [], len = 0;
        texts.forEach(function (t) { if (cur.length >= 180 || len + t.length > 15000) { batches.push(cur); cur = []; len = 0; } cur.push(t); len += t.length; });
        if (cur.length) batches.push(cur);
        var out = [], k = 0;
        return batches.reduce(function (pr, b) {
          return pr.then(function () {
            k++; busy(true, 'Орчуулж байна… ' + k + ' / ' + batches.length + ' (' + langName(src) + ' → ' + langName(dst) + ')');
            return fetch('/api/ai/translate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texts: b, source: src, target: dst }) })
              .then(apiJson).then(function (d) { if (d.__err) throw new Error(d.error === 'no_ai' ? 'AI орчуулга одоогоор идэвхгүй байна' : 'Орчуулга амжилтгүй (' + (d.error || d.__status) + ')'); out = out.concat(d.texts || []); });
          });
        }, Promise.resolve()).then(function () { return out; });
      })
      .then(function (out) {
        busy(true, 'Орчуулгыг байрлуулж байна…');
        var n = 0;
        return jobs.reduce(function (pr, j) {
          return pr.then(function () {
            return pageSampler(j.p).then(function (smp) {
              var f = ensureFab(j.p); if (!f) return;
              var fonts = [];
              j.lines.forEach(function (l) { fonts.push(G.screenFont(guessFont(j.p, l.it, l.st).font, guessFont(j.p, l.it, l.st).bold)); });
              return Promise.all(fonts).then(function () {
                quiet++;
                j.lines.forEach(function (l) {
                  var t = out[n++]; if (!t || t === l.text) return;
                  var g = { x: l.x, top: l.top, base: l.base, h: l.h, w: l.w, fs: l.fs, ang: 0 };
                  var col = smp(g), gf = guessFont(j.p, l.it, l.st), pair = uid();
                  var cover = new fabric.Rect({ left: g.x - 2, top: g.top - g.fs * 0.16, width: g.w + 4, height: g.h + g.fs * 0.34, fill: col.bg, data: { k: 'wo', auto: 1, pair: pair } });
                  var fs = Math.round(g.fs * 10) / 10;
                  var tx = textObj(t, { fontFamily: 'G' + gf.font, fontWeight: gf.bold ? 'bold' : 'normal', fontSize: fs, fill: col.ink, textAlign: 'left', data: { k: 'txt', pair: pair, tr: 1 } });
                  // longer translations shrink (down to 75 %) to stay within the original width
                  var avail = Math.max(g.w, 20) * 1.08;
                  if (tx.width > avail) tx.set('fontSize', Math.max(fs * 0.75, fs * avail / tx.width));
                  var off = tx.fontSize * tx._fontSizeMult * (1 - tx._fontSizeFraction);
                  tx.set({ left: g.x, top: g.base - off });
                  prepObj(cover); prepObj(tx); f.add(cover); f.add(tx);
                  j.p.done = j.p.done || {}; l.idx.forEach(function (i) { j.p.done[i] = 1; });
                });
                quiet--;
                f.requestRenderAll();
              });
            });
          });
        }, Promise.resolve()).then(function () {
          commit(true); busy(false);
          toast('Орчууллаа ✓ ' + langName(src) + ' → ' + langName(dst) + '. Текст бүрийг дарж засаж болно.', 4500);
          if (mode === 'edit') pages.forEach(function (p) { if (p.vis) textLayer(p); });
        });
      })
      .catch(function (e) { busy(false); console.error(e); toast((e && e.message) || 'Орчуулж чадсангүй', 6000); });
  }
  // colour sampler for any page (renders it offscreen when it is not on screen)
  function pageSampler(p) {
    var mk = function (c, s) { return function (g) { var keep = { canvas: p.canvas, cs: p.cs }; p.canvas = c; p.cs = s; var r = sampleColors(p, g); p.canvas = keep.canvas; p.cs = keep.cs; return r; }; };
    if (p.canvas && p.cs) return Promise.resolve(mk(p.canvas, p.cs));
    if (p.src < 0) return Promise.resolve(function () { return { bg: '#ffffff', ink: '#1e1e1e' }; });
    return sources[p.src].doc.getPage(p.idx + 1).then(function (pg) {
      p.pdfPage = pg;
      var vp = pg.getViewport({ scale: 1.5, rotation: R(p) }), c = document.createElement('canvas');
      c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
      return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () { return mk(c, 1.5); });
    });
  }

  // ---------- AI: summary / ask (Workers AI · Llama 3.3) ----------
  function docText() {
    return pages.reduce(function (pr, p, i) {
      return pr.then(function (acc) {
        if (p.src < 0 && !p.ocr) return acc;
        return viewLines(p, true).then(function (ls) { return acc + (ls.length ? '\n[Хуудас ' + (i + 1) + ']\n' + ls.map(function (l) { return l.text; }).join('\n') : ''); });
      });
    }, Promise.resolve(''));
  }
  function aiDialog(mode0) {
    var d = dialog('AI хэрэгсэл', '<div class="seg ai-seg"><button type="button" data-am="summary"' + (mode0 === 'summary' ? ' class="on"' : '') + '>' + ri('sum') + 'Хураангуйлах</button><button type="button" data-am="ask"' + (mode0 === 'ask' ? ' class="on"' : '') + '>' + ri('ask') + 'Асуух</button></div>' +
      '<div class="ai-q"' + (mode0 === 'ask' ? '' : ' hidden') + '><textarea class="dta" rows="2" placeholder="Жишээ: Нийт дүн хэд вэ? Гэрээ хэзээ дуусах вэ?"></textarea></div>' +
      '<div class="dgrid"><label>Хариултын хэл</label><select name="lang" class="dsel"><option value="mn">Монгол</option><option value="en">English</option></select></div>' +
      '<div class="ai-out" hidden></div><p class="note">Хиймэл оюун алдаа гаргаж болзошгүй — чухал мэдээллийг эх баримтаас нь шалгаарай.</p>',
      [{ label: 'Хаах' }, { label: 'Хуулах', fn: function (m) { var t = m.querySelector('.ai-out').innerText; if (t && navigator.clipboard) navigator.clipboard.writeText(t).then(function () { toast('Хууллаа'); }); return false; } },
        { label: 'Эхлүүлэх', primary: true, fn: function (m) { runAi(m); return false; } }]);
    var m = d.el, mode = mode0;
    m.querySelector('.ai-seg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-am]'); if (!b) return; mode = b.dataset.am;
      m.querySelectorAll('[data-am]').forEach(function (x) { x.classList.toggle('on', x === b); });
      m.querySelector('.ai-q').hidden = mode !== 'ask';
    });
    var cache = null;
    function runAi(m) {
      var q = m.querySelector('.dta').value.trim(), out = m.querySelector('.ai-out');
      if (mode === 'ask' && !q) { toast('Асуултаа бичнэ үү'); return; }
      out.hidden = false; out.innerHTML = '<span class="spin"></span> Уншиж байна…';
      (cache ? Promise.resolve(cache) : docText()).then(function (t) {
        cache = t;
        if (!t.trim()) throw new Error('Баримтад текст алга. Скан зураг бол эхлээд «Текст таних (OCR)»-ийг ажиллуулна уу.');
        out.innerHTML = '<span class="spin"></span> AI бодож байна…';
        return fetch('/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: mode, text: t, question: q, lang: val(m, '[name=lang]') }) })
          .then(apiJson).then(function (d) { if (d.__err) throw new Error(d.error === 'no_ai' ? 'AI одоогоор идэвхгүй байна' : 'AI хариулж чадсангүй (' + (d.error || d.__status) + ')'); return d.answer; });
      }).then(function (a) {
        out.innerHTML = esc(a || '—').replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
        if (t0len() > 24000) out.innerHTML += '<p class="note">Баримт урт тул эхний ~24 000 тэмдэгтийг уншсан.</p>';
      }).catch(function (e) { out.textContent = (e && e.message) || 'Алдаа гарлаа'; });
      function t0len() { return cache ? cache.length : 0; }
    }
  }

  // ---------- OCR (Tesseract.js, mon + eng + rus) ----------
  var ocrW = null;
  function ocrWorker(progress) {
    if (!ocrW) ocrW = G.loadScript('/assets/vendor/tesseract/tesseract.min.js').then(function () {
      return window.Tesseract.createWorker(['mon', 'eng', 'rus'], 1, {
        workerPath: '/assets/vendor/tesseract/worker.min.js', corePath: '/assets/vendor/tesseract/core',
        langPath: '/assets/vendor/tessdata', gzip: true, logger: function (m) { if (ocrW && ocrW.log) ocrW.log(m); }
      });
    });
    ocrW.catch(function () { ocrW = null; });
    ocrW.log = progress;
    return ocrW;
  }
  function ocrDialog() {
    dialog('Текст таних (OCR)', '<p class="note">Скан хийсэн эсвэл зурган PDF-ийн бичгийг таньж, <b>хайх, хуулах, «Текст засах»-аар засах</b> боломжтой болгоно. Монгол, англи, орос хэл. Анх удаа ~7MB загвар ачаална.</p>' +
      '<div class="dgrid"><label>Хамрах хүрээ</label>' + scopeSelect() + '</div>',
      [{ label: 'Болих' }, { label: 'Таних', primary: true, fn: function (m) { runOcr(scopePages(val(m, '[name=scope]'))); } }]);
  }
  function runOcr(list) {
    list = list.filter(function (p) { return p.src >= 0; });
    if (!list.length) return toast('Таних хуудас алга');
    var k = 0, lines = 0;
    busy(true, 'OCR загвар ачаалж байна…');
    ocrWorker(function (m) { if (m && m.status === 'recognizing text') busy(true, 'Бичиг таньж байна… хуудас ' + k + ' / ' + list.length + ' · ' + Math.round((m.progress || 0) * 100) + '%'); })
      .then(function (w) {
        return list.reduce(function (pr, p) {
          return pr.then(function () {
            k++;
            return sources[p.src].doc.getPage(p.idx + 1).then(function (pg) {
              var S = 2.2, vp = pg.getViewport({ scale: S, rotation: R(p) }), c = document.createElement('canvas');
              c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
              var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
              return pg.render({ canvasContext: x, viewport: vp }).promise.then(function () { return w.recognize(c, {}, { blocks: true }); }).then(function (res) {
                var Mi = inv(vpT(p.view, R(p), 1)), items = [];
                (res.data.blocks || []).forEach(function (b) { (b.paragraphs || []).forEach(function (pa) { (pa.lines || []).forEach(function (ln) {
                  var t = (ln.text || '').replace(/\s+/g, ' ').trim(); if (!t || (ln.confidence != null && ln.confidence < 35)) return;
                  var bb = ln.bbox, h = (bb.y1 - bb.y0) / S, fs = h * 0.78, base = (ln.baseline && ln.baseline.y0 > 0 ? (ln.baseline.y0 + ln.baseline.y1) / 2 : bb.y1 - (bb.y1 - bb.y0) * 0.2) / S;
                  var xv = bb.x0 / S, wv = (bb.x1 - bb.x0) / S;
                  var tr = mul(Mi, [fs, 0, 0, -fs, xv, base]);
                  items.push({ str: t, transform: tr, width: wv, height: fs, fontName: 'ocr', dir: 'ltr' });
                }); }); });
                p.ocr = items; lines += items.length;
              });
            });
          });
        }, Promise.resolve());
      })
      .then(function () {
        busy(false); commit(true);
        toast(lines ? 'Танигдлаа ✓ ' + lines + ' мөр. Одоо хайх, хуулах, «Текст засах»-аар засах, орчуулах боломжтой.' : 'Бичиг олдсонгүй', 5000);
        if (mode === 'edit') pages.forEach(function (p) { if (p.vis) textLayer(p); });
      })
      .catch(function (e) { busy(false); console.error(e); toast('OCR ажиллаж чадсангүй. Интернэтээ шалгана уу.', 5000); });
  }
  // invisible, selectable text for OCR'd pages (makes scans searchable)
  function drawOcr(PL, out, pg, p) {
    if (!p.ocr || !p.ocr.length) return Promise.resolve();
    return G.embedFont(out, 'Inter', false).then(function (font) {
      var cs = charSet(font);
      p.ocr.forEach(function (it) {
        var t = it.transform, s = ''; for (var ch of it.str) { var cp = ch.codePointAt(0); s += cs.has(cp) ? ch : ' '; }
        if (!s.trim()) return;
        var size = Math.hypot(t[2], t[3]) || 10, x = t[4], y = t[5];
        if (pg.__flat) { var v = ap(vpT(p.view, R(p), 1), x, y), d = dims(p); x = v.x; y = d.h - v.y; }
        var w0 = font.widthOfTextAtSize(s, size), k = w0 > 0 ? Math.min(3, Math.max(0.3, it.width / w0)) : 1;
        pg.drawText(s, { x: x, y: y, size: size * k, font: font, opacity: 0, rotate: PL.degrees(pg.__flat ? 0 : Math.atan2(t[1], t[0]) * 180 / Math.PI) });
      });
    });
  }

  // ---------- organize ----------
  function parseRange(s, n) {
    var out = [];
    String(s).split(/[,;\s]+/).forEach(function (part) {
      var m = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part.trim()); if (!m) return;
      var a = +m[1], b = m[2] ? +m[2] : a; if (a > b) { var t = a; a = b; b = t; }
      for (var i = Math.max(1, a); i <= Math.min(n, b); i++) if (out.indexOf(i) < 0) out.push(i);
    });
    return out;
  }
  function extractDialog() {
    dialog('Хуудас задлах', '<p class="note">Шинэ PDF болгон татах хуудсуудаа бичнэ үү. Нийт ' + pages.length + ' хуудас.</p><input class="dinp" name="r" placeholder="Жишээ: 1-3, 5, 8-10">',
      [{ label: 'Болих' }, { label: 'Татах', primary: true, fn: function (m) { var r = parseRange(val(m, '[name=r]'), pages.length); if (!r.length) { toast('Хуудасны дугаар буруу байна'); return false; } download(r.map(function (i) { return pages[i - 1]; }), true); } }]);
  }
  function splitAll() {
    finishEdits(); busy(true, 'Хуудсуудыг салгаж байна…');
    var files = [];
    pages.reduce(function (pr, p, i) { return pr.then(function () { busy(true, 'Хуудас ' + (i + 1) + ' / ' + pages.length + '…'); return buildPdf([p]).then(function (b) { files.push({ name: outName('pdf', '-' + ('00' + (i + 1)).slice(-3)), data: b }); }); }); }, Promise.resolve())
      .then(function () { busy(false); saveBlob(outName('zip', '-pages'), zip(files)); toast(files.length + ' тусдаа PDF (ZIP) ✓'); })
      .catch(function (e) { busy(false); toast('Салгаж чадсангүй: ' + (e && e.message || e)); });
  }
  function pageNumDialog() {
    dialog('Хуудасны дугаар', '<div class="dgrid"><label>Хэлбэр</label><select name="fmt" class="dsel"><option value="n">1</option><option value="nN">1 / 12</option><option value="page">Хуудас 1</option><option value="pageN">Хуудас 1 / 12</option><option value="dash">— 1 —</option></select>' +
      '<label>Байрлал</label><select name="pos" class="dsel"><option value="bc">Доор, голд</option><option value="br">Доор, баруун</option><option value="bl">Доор, зүүн</option><option value="tc">Дээр, голд</option><option value="tr">Дээр, баруун</option></select>' +
      '<label>Эхлэх дугаар</label><input class="dinp" name="start" value="1" inputmode="numeric"><label>Хэмжээ</label><input class="dinp" name="size" value="10" inputmode="numeric">' +
      '<label>Эхний хуудсыг алгасах</label><input type="checkbox" name="skip"></div>',
      [{ label: 'Болих' }, { label: 'Нэмэх', primary: true, fn: function (m) {
        var fmt = val(m, '[name=fmt]'), pos = val(m, '[name=pos]'), st = parseInt(val(m, '[name=start]'), 10) || 1, size = parseFloat(val(m, '[name=size]')) || 10, skip = val(m, '[name=skip]');
        var list = pages.slice(skip ? 1 : 0), N = list.length + st - 1;
        G.screenFont('Inter', false).then(function () {
          list.forEach(function (p, i) {
            var n = i + st, s = fmt === 'nN' ? n + ' / ' + N : fmt === 'page' ? 'Хуудас ' + n : fmt === 'pageN' ? 'Хуудас ' + n + ' / ' + N : fmt === 'dash' ? '— ' + n + ' —' : String(n);
            var f = ensureFab(p); if (!f) return;
            var d = dims(p), t = textObj(s, { fontFamily: 'GInter', fontWeight: 'normal', fontSize: size, fill: '#444444', data: { k: 'txt', pn: 1 } });
            var mg = Math.max(18, Math.min(d.w, d.h) * 0.045), x = pos[1] === 'c' ? (d.w - t.width) / 2 : pos[1] === 'r' ? d.w - mg - t.width : mg, y = pos[0] === 'b' ? d.h - mg - t.height : mg * 0.8;
            t.set({ left: x, top: y }); prepObj(t); quiet++; f.add(t); quiet--; f.requestRenderAll();
          });
          commit(true); toast('Хуудасны дугаар нэмэгдлээ — хүсвэл дарж засаж, зөөж болно');
        });
      } }]);
  }
  function compressDialog() {
    dialog('Хэмжээ багасгах', '<p class="note">Хуудсуудыг чанар тохируулсан зураг болгон шахна. Файл эрс багасна, гэхдээ текстийг сонгож хуулах боломжгүй болно.</p>' +
      '<div class="dgrid"><label>Чанар</label><select name="q" class="dsel"><option value="150|0.75">Сайн — дэлгэц, хэвлэлд (150 dpi)</option><option value="110|0.62" selected>Дунд — имэйлд (110 dpi)</option><option value="80|0.5">Жижиг — хамгийн бага (80 dpi)</option></select></div>',
      [{ label: 'Болих' }, { label: 'Шахах', primary: true, fn: function (m) { var q = val(m, '[name=q]').split('|'); runCompress(+q[0], +q[1]); } }]);
  }
  function runCompress(dpi, q) {
    busy(true, 'Шахаж байна…');
    builtDoc().then(function (r) {
      return G.pdfLib().then(function (PL) {
        return PL.PDFDocument.create().then(function (out) {
          var i = 0;
          var step = function () {
            i++; if (i > r.doc.numPages) return out.save();
            busy(true, 'Шахаж байна… ' + i + ' / ' + r.doc.numPages);
            return renderOut(r.doc, i, dpi / 72, 3000).then(function (o) { return canvasBytes(o.c, 'image/jpeg', q).then(function (b) { return out.embedJpg(b); }).then(function (im) { var pg = out.addPage([o.w, o.h]); pg.drawImage(im, { x: 0, y: 0, width: o.w, height: o.h }); }); }).then(step);
          };
          return step().then(function (bytes) {
            busy(false);
            var a = r.bytes.length, b = bytes.length;
            if (b >= a) { toast('Энэ файл аль хэдийн жижиг байна (' + kb(a) + '). Шахах шаардлагагүй.', 5000); return; }
            saveBlob(outName('pdf', '-small'), new Blob([bytes], { type: 'application/pdf' }));
            toast(kb(a) + ' → ' + kb(b) + ' (' + Math.round((1 - b / a) * 100) + '% багассан) ✓', 5000);
          });
        });
      });
    }).catch(function (e) { busy(false); toast('Шахаж чадсангүй: ' + (e && e.message || e)); });
  }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB'; }

  // ---------- sign extras ----------
  function initialsDialog() {
    dialog('Нэрийн эхний үсэг', '<input class="dinp" name="t" maxlength="6" placeholder="Жишээ: А.Б">', [{ label: 'Болих' }, { label: 'Нэмэх', primary: true, fn: function (m) {
      var s = String(val(m, '[name=t]') || '').trim(); if (!s) return false;
      G.screenFont('Lora', true).then(function () { addObj(curPage(), textObj(s, { fontFamily: 'GLora', fontWeight: 'bold', fontSize: 18, fill: '#1f3fbf', data: { k: 'txt' } }), true); setMode('select'); });
    } }]);
  }

  // ---------- form fields ----------
  var FIELD_LABEL = { text: 'Текст талбар', multi: 'Олон мөрт текст', check: '☐', date: 'ОО.СС.ӨӨ', sign: 'Гарын үсэг' };
  var fieldN = 0;
  function addField(ft) {
    var p = curPage(); if (!p) return;
    var w = ft === 'check' ? 16 : ft === 'multi' ? 220 : ft === 'sign' ? 170 : ft === 'date' ? 100 : 170, h = ft === 'check' ? 16 : ft === 'multi' ? 70 : ft === 'sign' ? 40 : 22;
    G.screenFont('Inter', false).then(function () {
      var r = new fabric.Rect({ width: w, height: h, fill: 'rgba(109,86,250,0.08)', stroke: '#6d56fa', strokeWidth: 1, strokeDashArray: [4, 3], rx: 2, ry: 2, strokeUniform: true });
      var t = new fabric.Text(FIELD_LABEL[ft], { fontFamily: 'GInter', fontSize: ft === 'check' ? 11 : 9.5, fill: '#6d56fa', left: ft === 'check' ? 2.5 : 5, top: ft === 'check' ? 1 : 4, opacity: 0.85 });
      var g = new fabric.Group([r, t], { data: { k: 'field', ft: ft, name: (FIELD_LABEL[ft] === '☐' ? 'Сонголт' : FIELD_LABEL[ft]) + ' ' + (++fieldN) }, lockScalingFlip: true });
      addObj(p, g, true); setMode('select');
      toast('Талбарыг чирж байрлуулаад хэмжээг тохируулна. Татсан PDF-д бөглөх боломжтой талбар болно.', 4000);
    });
  }
  function drawField(PL, out, pg, o, V2P) {
    var br = o.getBoundingRect(true, true), a = ap(V2P, br.left, br.top), b = ap(V2P, br.left + br.width, br.top + br.height);
    var x = Math.min(a.x, b.x), y = Math.min(a.y, b.y), w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    var form = out.getForm(), d = o.data, name = String(d.name || 'field').replace(/[.\s]+/g, '_');
    out.__fieldNames = out.__fieldNames || {};
    while (out.__fieldNames[name]) name += '_';
    out.__fieldNames[name] = 1; out.__hasFields = true;
    var opt = { x: x, y: y, width: w, height: h, borderColor: PL.rgb(0.55, 0.5, 0.85), borderWidth: 0.8, backgroundColor: PL.rgb(0.97, 0.96, 1) };
    if (d.ft === 'check') { form.createCheckBox(name).addToPage(pg, opt); return; }
    var f = form.createTextField(name);
    if (d.ft === 'multi') f.enableMultiline();
    if (d.ft === 'date') f.setMaxLength(20);
    f.addToPage(pg, opt);
  }

  // ---------- share / print / mail ----------
  function pdfFile() { finishEdits(); busy(true, 'PDF бэлдэж байна…'); return buildPdf(pages).then(function (b) { busy(false); return new File([b], outName('pdf'), { type: 'application/pdf' }); }, function (e) { busy(false); throw e; }); }
  function sharePdf() {
    pdfFile().then(function (f) {
      if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: f.name }).catch(function () {});
      saveBlob(f.name, f); toast('Энэ хөтөч шууд хуваалцахыг дэмждэггүй тул PDF-ийг татлаа — Messenger, имэйлд хавсаргаарай.', 5000);
    }).catch(function (e) { toast('Бэлдэж чадсангүй: ' + (e && e.message || e)); });
  }
  function printPdf() {
    pdfFile().then(function (f) {
      var url = URL.createObjectURL(f), fr = document.createElement('iframe');
      fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; fr.src = url;
      fr.onload = function () { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { window.open(url, '_blank'); } setTimeout(function () { fr.remove(); URL.revokeObjectURL(url); }, 60000); };
      document.body.appendChild(fr);
    });
  }
  function mailPdf() {
    pdfFile().then(function (f) {
      saveBlob(f.name, f);
      toast('PDF татагдлаа — нээгдэх имэйл дээр хавсралтаар нэмнэ үү', 5000);
      setTimeout(function () { location.href = 'mailto:?subject=' + encodeURIComponent(f.name.replace(/\.pdf$/, '')) + '&body=' + encodeURIComponent('Сайн байна уу,\n\n«' + f.name + '» файлыг хавсаргав.\n'); }, 600);
    });
  }

  // ---------- secure ----------
  function passwordDialog() {
    dialog('Нууц үгээр хамгаалах', '<p class="note">Файлыг нээхэд нууц үг асууна (AES-256). Нууц үгээ мартвал сэргээх боломжгүй тул сайн тэмдэглээрэй.</p>' +
      '<div class="dgrid"><label>Нууц үг</label><input class="dinp" type="password" name="p1" autocomplete="new-password"><label>Давтах</label><input class="dinp" type="password" name="p2" autocomplete="new-password">' +
      '<label>Хэвлэхийг зөвшөөрөх</label><input type="checkbox" name="print" checked><label>Текст хуулахыг зөвшөөрөх</label><input type="checkbox" name="copy" checked><label>Засахыг зөвшөөрөх</label><input type="checkbox" name="mod"></div>',
      [{ label: 'Болих' }, { label: 'Хамгаалж татах', primary: true, fn: function (m) {
        var a = val(m, '[name=p1]'), b = val(m, '[name=p2]');
        if (!a || a.length < 4) { toast('Нууц үг дор хаяж 4 тэмдэгт байна'); return false; }
        if (a !== b) { toast('Нууц үгүүд таарахгүй байна'); return false; }
        var perms = { printing: val(m, '[name=print]') ? 'highResolution' : false, copying: !!val(m, '[name=copy]'), modifying: !!val(m, '[name=mod]'), annotating: !!val(m, '[name=mod]'), fillingForms: true, contentAccessibility: true, documentAssembly: !!val(m, '[name=mod]') };
        finishEdits(); busy(true, 'Шифрлэж байна…');
        buildPdf(pages).then(function (bytes) {
          return G.pdfLib().then(function (PL) { return PL.PDFDocument.load(bytes); }).then(function (doc) {
            var owner = Array.from(crypto.getRandomValues(new Uint8Array(18))).map(function (x) { return x.toString(16); }).join('');
            doc.encrypt({ userPassword: a, ownerPassword: owner, permissions: perms });
            return doc.save({ useObjectStreams: false });
          });
        }).then(function (out) { busy(false); saveBlob(outName('pdf', '-protected'), new Blob([out], { type: 'application/pdf' })); toast('Нууц үгтэй PDF татагдлаа 🔒'); })
          .catch(function (e) { busy(false); console.error(e); toast('Шифрлэж чадсангүй: ' + (e && e.message || e), 6000); });
      } }]);
  }
  function removePassword() {
    var locked = sources.some(function (s) { return s.pw; });
    if (!locked) return toast('Нээлттэй байгаа файл нууц үггүй байна. Нууц үгтэй PDF-ийг нээхэд нууц үгээ оруулаад энд дарвал хамгаалалтгүй хувилбарыг татна.', 6000);
    download(pages);
    toast('Нууц үггүй хувилбарыг татлаа 🔓');
  }
  function watermarkDialog() {
    dialog('Усан тэмдэг', '<div class="dgrid"><label>Текст</label><input class="dinp" name="t" value="НООРОГ" maxlength="40">' +
      '<label>Өнгө</label><select name="c" class="dsel"><option value="#9a9aa5">Саарал</option><option value="#e5484d">Улаан</option><option value="#1f3fbf">Цэнхэр</option><option value="#6d56fa">Ягаан</option></select>' +
      '<label>Тунгалаг</label><input type="range" name="o" min="5" max="60" value="18"><label>Хэмжээ</label><input type="range" name="s" min="20" max="140" value="72">' +
      '<label>Налуу</label><select name="a" class="dsel"><option value="-35">Налуу</option><option value="0">Хэвтээ</option><option value="-90">Босоо</option></select>' +
      '<label>Хамрах хүрээ</label>' + scopeSelect() + '</div>',
      [{ label: 'Болих' }, { label: 'Нэмэх', primary: true, fn: function (m) {
        var s = String(val(m, '[name=t]') || '').trim(); if (!s) return false;
        var col = val(m, '[name=c]'), op = +val(m, '[name=o]') / 100, size = +val(m, '[name=s]'), ang = +val(m, '[name=a]'), list = scopePages(val(m, '[name=scope]'));
        G.screenFont('Inter', true).then(function () {
          list.forEach(function (p) {
            var f = ensureFab(p); if (!f) return;
            var d = dims(p), t = textObj(s, { fontFamily: 'GInter', fontWeight: 'bold', fontSize: size * Math.min(d.w, d.h) / 595, fill: col, opacity: op, angle: ang, originX: 'center', originY: 'center', data: { k: 'txt', wm: 1 } });
            t.set({ left: d.w / 2, top: d.h / 2 }); prepObj(t); quiet++; f.add(t); quiet--; f.requestRenderAll();
          });
          commit(true); toast('Усан тэмдэг нэмэгдлээ — дарж засах, устгах боломжтой');
        });
      } }]);
  }

  // ---------- wiring ----------
  $('#pe-types').innerHTML = G.LABEL.split(' · ').map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
  var fileIn = $('#pe-file'); fileIn.accept = G.ACCEPT;
  fileIn.addEventListener('change', function () {
    var at = fileIn.dataset.at; delete fileIn.dataset.at;
    addFiles(fileIn.files, at === undefined || at === '' ? (pages.length ? pages.length : null) : +at);
    fileIn.value = '';
  });
  $('#pe-open').addEventListener('click', function () { fileIn.dataset.at = pages.length; fileIn.click(); });
  $('#pe-img').addEventListener('change', function () {
    var f = this.files[0], tag = this.dataset.tag; delete this.dataset.tag; this.value = '';
    if (f) { if (!G.isImage(f)) return toast('Зураг сонгоно уу (PNG, JPG, WebP, HEIC, SVG…)'); addImageFile(f, tag); }
  });
  $('#pe-blank').addEventListener('click', function () {
    pages.push(blankPage()); root.classList.add('has-doc'); $('#pe-save').disabled = false;
    if (!docName) setName('Шинэ баримт');
    zoom = fitZoom(); layoutPages(); renderThumbs(); commit(true); props();
  });
  var saveMenu = document.createElement('div');
  saveMenu.className = 'smenu'; saveMenu.hidden = true;
  saveMenu.innerHTML = '<button type="button" data-save="pdf"><b>PDF татах</b><small>Засвартай нь, текст нь сонгогдох хэвээр</small></button>' +
    '<button type="button" data-save="flat"><b>Нууцлалтай PDF</b><small>Цайруулсан / зассан хэсгийн хуучин мэдээллийг бүрмөсөн устгана (тэр хуудас зураг болно)</small></button>' +
    '<button type="button" data-save="sel"><b>Сонгосон хуудсуудыг</b><small>Зүүн самбараас Ctrl/Shift-ээр сонгоно</small></button>';
  $('#pe-save').parentNode.insertBefore(saveMenu, $('#pe-save').nextSibling);
  $('#pe-save').addEventListener('click', function (e) { e.stopPropagation(); saveMenu.hidden = !saveMenu.hidden; });
  saveMenu.addEventListener('click', function (e) {
    var b = e.target.closest('[data-save]'); if (!b) return; saveMenu.hidden = true;
    if (b.dataset.save === 'pdf') download(pages);
    else if (b.dataset.save === 'flat') download(pages, false, true);
    else download(targets(), true);
  });
  document.addEventListener('click', function (e) { if (!saveMenu.hidden && !saveMenu.contains(e.target)) saveMenu.hidden = true; });
  $('#pe-undo').innerHTML = ic('undo'); $('#pe-redo').innerHTML = ic('redo');
  $('#pe-undo').addEventListener('click', undo); $('#pe-redo').addEventListener('click', redo);
  $('#pe-dock').addEventListener('click', function (e) { var b = e.target.closest('[data-tool]'); if (b) setMode(b.dataset.tool === mode && mode !== 'select' ? 'select' : b.dataset.tool); });
  $('#pe-side-btn').addEventListener('click', function () { $('#pe-side').classList.toggle('open'); });
  document.querySelector('[data-close-side]').addEventListener('click', function () { $('#pe-side').classList.remove('open'); });
  $('#pe-name').addEventListener('change', function () { docName = this.value.trim() || docName; });

  // theme (shared with the Editor)
  function themeUi() { var d = document.documentElement.getAttribute('data-theme') === 'dark'; $('#pe-theme').innerHTML = ic(d ? 'sun' : 'moon'); }
  $('#pe-theme').addEventListener('click', function () {
    var d = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', d); try { localStorage.setItem('gc-editor-theme', d); } catch (e) {} themeUi();
  });
  themeUi();

  // drag & drop files anywhere
  var dz = $('#pe-dz'), dragN = 0;
  function hasFiles(e) { return e.dataTransfer && [].indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; }
  document.addEventListener('dragenter', function (e) { if (!hasFiles(e)) return; dragN++; dz.hidden = false; });
  document.addEventListener('dragleave', function (e) { if (!hasFiles(e)) return; if (--dragN <= 0) { dragN = 0; dz.hidden = true; } });
  document.addEventListener('dragover', function (e) { if (hasFiles(e)) e.preventDefault(); });
  document.addEventListener('drop', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragN = 0; dz.hidden = true;
    var fs = [].slice.call(e.dataTransfer.files);
    // an image dropped onto an open document is placed on the page; anything else adds pages
    if (pages.length && fs.length === 1 && G.isImage(fs[0])) return addImageFile(fs[0]);
    addFiles(fs, pages.length ? pages.length : null);
  });

  // keyboard
  document.addEventListener('keydown', function (e) {
    var t = e.target, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable;
    var a = active(), editing = a && a.o.isEditing;
    var mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !typing && !editing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === 'y' && !typing && !editing) { e.preventDefault(); redo(); return; }
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); if (pages.length) download(pages); return; }
    if (typing || editing || !pages.length) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && a) { e.preventDefault(); objAction('del'); return; }
    if (mod && e.key.toLowerCase() === 'd' && a) { e.preventDefault(); objAction('dup'); return; }
    if (e.key === 'Escape') { if (a) { a.f.discardActiveObject(); a.f.requestRenderAll(); props(); } setMode('select'); return; }
    if (mod || e.altKey) return;
    var map = { v: 'select', e: 'edit', t: 'text', h: 'hl', d: 'draw', r: 'rect', o: 'ellipse', a: 'arrow', l: 'line', w: 'wo' };
    if (map[e.key.toLowerCase()]) setMode(map[e.key.toLowerCase()]);
    if (a && /^Arrow/.test(e.key)) {
      e.preventDefault(); var st = e.shiftKey ? 10 : 1, o = a.o;
      if (e.key === 'ArrowLeft') o.left -= st; if (e.key === 'ArrowRight') o.left += st; if (e.key === 'ArrowUp') o.top -= st; if (e.key === 'ArrowDown') o.top += st;
      o.setCoords(); a.f.requestRenderAll(); commit();
    }
  });
  // clicking the grey area deselects
  view.addEventListener('mousedown', function (e) { if (e.target === view || e.target === pagesEl) pages.forEach(function (p) { if (p.fab && p.fab.getActiveObject()) { p.fab.discardActiveObject(); p.fab.requestRenderAll(); } }); });
  window.addEventListener('beforeunload', function (e) { if (hi > 0) { e.preventDefault(); e.returnValue = ''; } });

  dockUi(); pgToolsUi(); railUi();
  $('#pe-rail').addEventListener('click', function (e) { var b = e.target.closest('[data-rail]'); if (b) openRail(b.dataset.rail, b); });
  // a PDF / image sent from another Graphican tool opens here
  if (window.GHandoff) window.GHandoff.take().then(function (h) {
    if (h && h.blob) { var f; try { f = new File([h.blob], h.name || 'document.pdf', { type: h.blob.type }); } catch (e) { f = h.blob; f.name = h.name; } addFiles([f]); }
  });
  window.__pe = { pages: function () { return pages; }, addFiles: addFiles, buildPdf: function (flat) { return buildPdf(pages, flat); }, setMode: setMode, zoom: function () { return zoom; } };
})();
