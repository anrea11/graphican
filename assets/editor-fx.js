/* Graphican Editor — render extensions for Fabric.js 5.3 (loaded after fabric, before editor.js).
   Adds Figma-style features on top of Fabric's object cache:
     obj.gFx        [{t:'drop'|'inner'|'blur'|'bgblur'|'noise'|'glass', on, x, y, b, c, a, mono}]
     obj.gStrokePos 'center' | 'inside' | 'outside'
     obj.gRound     corner radius for triangles and polygons (stars)
     obj.gPaint / obj.gPaintS   paint descriptors for fill / stroke:
                    {type:'linear'|'radial'|'angular'|'diamond'|'image', angle, stops:[{p,c,a}], src, fit}
   Pixel effects (inner shadow, blur, noise) are applied to the object's cache canvas, so they are
   computed once per change and exported at full resolution. Background blur samples what is
   already drawn under the object. Everything also works where ctx.filter is missing (Safari). */
(function () {
  'use strict';
  var F = window.fabric, O = F.Object.prototype;

  // ---------- helpers ----------
  var probe = document.createElement('canvas').getContext('2d');
  var HAS_FILTER = 'filter' in probe && (probe.filter = 'blur(2px)', probe.filter === 'blur(2px)');
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function fxOn(o) { return (o.gFx || []).filter(function (e) { return e && e.on !== false; }); }
  function fxOf(o, t) { return fxOn(o).filter(function (e) { return e.t === t; })[0]; }
  var PIXEL_FX = { inner: 1, blur: 1, noise: 1, glass: 1, feather: 1, fade: 1, glow: 1, echo: 1, glitch: 1, long: 1, iglow: 1 };
  function hasPixelFx(o) { return fxOn(o).some(function (e) { return PIXEL_FX[e.t]; }); }
  function rgba(c, a) {
    var col = new F.Color(c || '#000'), s = col.getSource();
    return 'rgba(' + s[0] + ',' + s[1] + ',' + s[2] + ',' + ((s[3] == null ? 1 : s[3]) * (a == null ? 1 : a)) + ')';
  }

  // separable box blur ×3 ≈ gaussian, on premultiplied RGBA (no dark fringes)
  function boxBlur(img, w, h, r) {
    r = Math.round(r); if (r < 1) return;
    var d = img.data, n = w * h, a = new Float32Array(n * 4), b = new Float32Array(n * 4), i;
    for (i = 0; i < n; i++) { var al = d[i * 4 + 3] / 255; a[i * 4] = d[i * 4] * al; a[i * 4 + 1] = d[i * 4 + 1] * al; a[i * 4 + 2] = d[i * 4 + 2] * al; a[i * 4 + 3] = d[i * 4 + 3]; }
    var rs = [Math.max(1, Math.round(r * 0.58)), Math.max(1, Math.round(r * 0.58)), Math.max(1, Math.round(r * 0.58))];
    for (var pass = 0; pass < 3; pass++) { hPass(a, b, w, h, rs[pass]); vPass(b, a, w, h, rs[pass]); }
    for (i = 0; i < n; i++) {
      var A = a[i * 4 + 3], k = A > 0 ? 255 / A : 0;
      d[i * 4] = a[i * 4] * k; d[i * 4 + 1] = a[i * 4 + 1] * k; d[i * 4 + 2] = a[i * 4 + 2] * k; d[i * 4 + 3] = A;
    }
  }
  function hPass(s, t, w, h, r) {
    var iarr = 1 / (r + r + 1);
    for (var y = 0; y < h; y++) for (var c = 0; c < 4; c++) {
      var row = y * w, acc = 0, x;
      for (x = -r; x <= r; x++) acc += s[(row + Math.min(w - 1, Math.max(0, x))) * 4 + c];
      for (x = 0; x < w; x++) {
        t[(row + x) * 4 + c] = acc * iarr;
        acc += s[(row + Math.min(w - 1, x + r + 1)) * 4 + c] - s[(row + Math.max(0, x - r)) * 4 + c];
      }
    }
  }
  function vPass(s, t, w, h, r) {
    var iarr = 1 / (r + r + 1);
    for (var x = 0; x < w; x++) for (var c = 0; c < 4; c++) {
      var acc = 0, y;
      for (y = -r; y <= r; y++) acc += s[(Math.min(h - 1, Math.max(0, y)) * w + x) * 4 + c];
      for (y = 0; y < h; y++) {
        t[(y * w + x) * 4 + c] = acc * iarr;
        acc += s[(Math.min(h - 1, y + r + 1) * w + x) * 4 + c] - s[(Math.max(0, y - r) * w + x) * 4 + c];
      }
    }
  }
  // blur the whole canvas in place
  function blurCanvas(c, r) {
    if (r < 0.5) return;
    var ctx = c.getContext('2d');
    if (HAS_FILTER) {
      var t = mkCanvas(c.width, c.height); t.getContext('2d').drawImage(c, 0, 0);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, c.width, c.height);
      ctx.filter = 'blur(' + r + 'px)'; ctx.drawImage(t, 0, 0); ctx.restore();
    } else {
      // big radii: blur a downscaled copy (fast), then scale back up
      var k = r > 24 ? Math.min(8, r / 12) : 1, sw = Math.max(1, Math.round(c.width / k)), sh = Math.max(1, Math.round(c.height / k));
      var s = mkCanvas(sw, sh), sx = s.getContext('2d'); sx.drawImage(c, 0, 0, sw, sh);
      var id = sx.getImageData(0, 0, sw, sh); boxBlur(id, sw, sh, r / k); sx.putImageData(id, 0, 0);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, c.width, c.height);
      ctx.imageSmoothingQuality = 'high'; ctx.drawImage(s, 0, 0, c.width, c.height); ctx.restore();
    }
  }
  // deterministic noise so the grain doesn't flicker between renders
  function rand(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------- pixel effects on the cache canvas ----------
  // effect sizes are in design pixels, so a scaled-down photo gets the same shadow as a shape
  function objScale(o) { try { var s = o.getObjectScaling(); return Math.max(1e-4, Math.sqrt(Math.abs(s.scaleX * s.scaleY))); } catch (e) { return 1; } }
  function applyPixelFx(o, c) {
    var z = (o.zoomX || 1) / objScale(o), ctx = c.getContext('2d'), list = fxOn(o);
    list.forEach(function (e) {
      if (e.t === 'inner') innerShadow(c, (e.x || 0) * z, (e.y || 0) * z, (e.b || 0) * z, rgba(e.c || 'rgba(0,0,0,0.35)'));
      if (e.t === 'glass') {
        // frosted edge light: a soft inner highlight from the top-left + a darker rim bottom-right
        innerShadow(c, 2 * z, 2 * z, 6 * z, 'rgba(255,255,255,' + (0.55 * (e.a == null ? 1 : e.a)) + ')');
        innerShadow(c, -2 * z, -2 * z, 8 * z, 'rgba(0,0,0,' + (0.18 * (e.a == null ? 1 : e.a)) + ')');
      }
    });
    list.forEach(function (e) { if (e.t === 'iglow') innerShadow(c, 0, 0, (e.b || 0) * z, rgba(e.c || '#ffffff', e.a == null ? 0.9 : e.a)); });
    list.forEach(function (e) { if (e.t === 'noise') noise(o, c, e.a == null ? 0.25 : e.a, !!e.mono, e.s || 1, z); });
    var bl = fxOf(o, 'blur'); if (bl && bl.b > 0) blurCanvas(c, bl.b * z);
    // soft edges and gradient transparency shape the object's own alpha
    var fe = fxOf(o, 'feather'); if (fe && fe.b > 0) feather(c, fe.b * z);
    var fa = fxOf(o, 'fade'); if (fa) fadeMask(c, fa);
    // glow / echo / glitch / long shadow are painted behind the object inside the (padded) cache
    var behind = list.filter(function (e) { return e.t === 'glow' || e.t === 'echo' || e.t === 'glitch' || e.t === 'long'; });
    if (behind.length) {
      var snap = mkCanvas(c.width, c.height); snap.getContext('2d').drawImage(c, 0, 0);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
      behind.forEach(function (e) { drawBehind(ctx, snap, e, z); });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(snap, 0, 0);
      ctx.restore();
    }
  }
  function tinted(src, color) {
    var m = mkCanvas(src.width, src.height), mx = m.getContext('2d');
    mx.drawImage(src, 0, 0); mx.globalCompositeOperation = 'source-in'; mx.fillStyle = color; mx.fillRect(0, 0, m.width, m.height); mx.globalCompositeOperation = 'source-over';
    return m;
  }
  function drawBehind(ctx, snap, e, z) {
    if (e.t === 'glow') {
      var g = tinted(snap, rgba(e.c || '#a497ff')); blurCanvas(g, Math.max(1, (e.b || 20) * z / 2));
      var n = 1 + Math.round((e.a == null ? 0.6 : e.a) * 3);
      for (var i = 0; i < n; i++) ctx.drawImage(g, 0, 0);
    } else if (e.t === 'echo') {
      var cnt = Math.max(1, Math.min(8, e.n || 3)), src = e.c ? tinted(snap, rgba(e.c)) : snap;
      for (var k = cnt; k >= 1; k--) { ctx.globalAlpha = Math.max(0.05, (e.a == null ? 0.6 : e.a) * (1 - (k - 1) / cnt)); ctx.drawImage(src, (e.x || 0) * z * k, (e.y || 0) * z * k); }
      ctx.globalAlpha = 1;
    } else if (e.t === 'glitch') {
      var d = (e.d == null ? 6 : e.d) * z;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(tinted(snap, e.c1 || '#00e5ff'), -d, 0);
      ctx.drawImage(tinted(snap, e.c2 || '#ff2bd6'), d, 0);
      ctx.globalAlpha = 1;
    } else if (e.t === 'long') {
      var L = (e.l == null ? 60 : e.l) * z, ang = (e.ang == null ? 45 : e.ang) * Math.PI / 180, sh = tinted(snap, rgba(e.c || 'rgba(0,0,0,0.35)'));
      var dx = Math.cos(ang), dy = Math.sin(ang), step = Math.max(1, L / 90);
      for (var t = L; t >= step; t -= step) { if (e.f) ctx.globalAlpha = 1 - t / L * 0.9; ctx.drawImage(sh, dx * t, dy * t); }
      ctx.globalAlpha = 1;
    }
  }
  function feather(c, r) {
    var m = mkCanvas(c.width, c.height); m.getContext('2d').drawImage(c, 0, 0);
    blurCanvas(m, r);
    // pull the blurred alpha inward so the edge fades out instead of growing
    var ctx = c.getContext('2d'); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(m, 0, 0); ctx.drawImage(m, 0, 0); ctx.restore();
  }
  function fadeMask(c, e) {
    var w = c.width, h = c.height, ctx = c.getContext('2d'), g;
    var f0 = e.f == null ? 0.35 : e.f, f1 = e.to == null ? 1 : e.to;
    if (e.r) {
      g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.hypot(w, h) / 2);
    } else {
      var a = (e.ang == null ? 90 : e.ang) * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), half = (Math.abs(dx) * w + Math.abs(dy) * h) / 2;
      g = ctx.createLinearGradient(w / 2 - dx * half, h / 2 - dy * half, w / 2 + dx * half, h / 2 + dy * half);
    }
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(Math.min(0.999, Math.max(0, f0)), 'rgba(0,0,0,1)'); g.addColorStop(Math.max(Math.min(1, f1), Math.min(1, f0 + 0.001)), 'rgba(0,0,0,0)');
    if (f1 < 1) g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'destination-in'; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore();
  }
  function innerShadow(c, dx, dy, blur, color) {
    var w = c.width, h = c.height, s = mkCanvas(w, h), sx = s.getContext('2d');
    // colour everywhere except the (offset) shape, blur it, keep it only inside the shape
    sx.fillStyle = color; sx.fillRect(0, 0, w, h);
    sx.globalCompositeOperation = 'destination-out'; sx.drawImage(c, dx, dy);
    sx.globalCompositeOperation = 'source-over';
    blurCanvas(s, blur / 2);
    var ctx = c.getContext('2d');
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // keep only inside the shape's alpha
    var m = mkCanvas(w, h), mx = m.getContext('2d');
    mx.drawImage(s, 0, 0); mx.globalCompositeOperation = 'destination-in'; mx.drawImage(c, 0, 0);
    ctx.globalCompositeOperation = 'source-atop'; ctx.drawImage(m, 0, 0);
    ctx.restore();
  }
  function noise(o, c, amt, mono, size, z) {
    var ctx = c.getContext('2d'), w = c.width, h = c.height, id = ctx.getImageData(0, 0, w, h), d = id.data;
    var r = rand(hash(String(o.id || o.name || o.type) + w + 'x' + h)), k = amt * 255, cell = Math.max(1, Math.round(size * z));
    for (var y = 0; y < h; y += cell) for (var x = 0; x < w; x += cell) {
      var nr = (r() - 0.5) * k, ng = mono ? nr : (r() - 0.5) * k, nb = mono ? nr : (r() - 0.5) * k;
      for (var yy = y; yy < Math.min(h, y + cell); yy++) for (var xx = x; xx < Math.min(w, x + cell); xx++) {
        var i = (yy * w + xx) * 4; if (!d[i + 3]) continue;
        d[i] = d[i] + nr; d[i + 1] = d[i + 1] + ng; d[i + 2] = d[i + 2] + nb;
      }
    }
    ctx.putImageData(id, 0, 0);
  }

  // extra cache room for blur / outside stroke so nothing gets clipped
  function fxPad(o) {
    var p = 0;
    fxOn(o).forEach(function (e) {
      if (e.t === 'blur') p = Math.max(p, (e.b || 0) * 1.5 + 2);
      if (e.t === 'glow') p = Math.max(p, (e.b || 20) * 1.6 + 4);
      if (e.t === 'echo') p = Math.max(p, Math.max(Math.abs(e.x || 0), Math.abs(e.y || 0)) * Math.min(8, e.n || 3) + 2);
      if (e.t === 'glitch') p = Math.max(p, (e.d == null ? 6 : e.d) + 2);
      if (e.t === 'long') p = Math.max(p, (e.l == null ? 60 : e.l) + 2);
    });
    if (o.gStrokePos === 'outside' && o.stroke && o.strokeWidth) p = Math.max(p, o.strokeWidth / 2 + 1);
    return p;
  }
  var baseDims = O._getCacheCanvasDimensions;
  function patchDims(proto) {
    var orig = proto._getCacheCanvasDimensions;
    proto._getCacheCanvasDimensions = function () {
      var d = orig.call(this), p = fxPad(this);
      if (p) { p /= objScale(this); d.width += p * 2 * d.zoomX; d.height += p * 2 * d.zoomY; }
      return d;
    };
  }
  patchDims(O);
  if (F.Text.prototype._getCacheCanvasDimensions !== baseDims) patchDims(F.Text.prototype);

  var baseShouldCache = O.shouldCache;
  O.shouldCache = function () {
    if (hasPixelFx(this) || this.gStrokePos === 'inside' || this.gStrokePos === 'outside') return (this.ownCaching = true);
    return baseShouldCache.call(this);
  };
  ['Group', 'Image'].forEach(function (k) {
    var p = F[k].prototype, orig = p.shouldCache;
    if (orig && orig !== O.shouldCache) p.shouldCache = function () { if (hasPixelFx(this)) return (this.ownCaching = true); return orig.call(this); };
  });

  var baseDraw = O.drawObject;
  function patchDraw(proto) {
    var orig = proto.drawObject;
    proto.drawObject = function (ctx, forClipping) {
      orig.call(this, ctx, forClipping);
      if (!forClipping && ctx.canvas === (this._cacheCanvas || null) && hasPixelFx(this)) applyPixelFx(this, this._cacheCanvas);
    };
  }
  patchDraw(O);
  if (F.Group.prototype.drawObject !== baseDraw) patchDraw(F.Group.prototype);

  // ---------- background blur (+ glass) ----------
  var baseRender = O.render;
  O.render = function (ctx) {
    var bb = fxOf(this, 'bgblur'), gl = fxOf(this, 'glass');
    if ((bb && bb.b > 0) || gl) { try { backdrop(this, ctx, bb ? bb.b : (gl.b == null ? 16 : gl.b)); } catch (e) { /* tainted or offscreen */ } }
    return baseRender.call(this, ctx);
  };
  function backdrop(o, ctx, r) {
    if (o.isNotVisible() || !ctx.getTransform) return;
    var dev = ctx.getTransform(), m = o.calcTransformMatrix(), M = [dev.a, dev.b, dev.c, dev.d, dev.e, dev.f];
    var D = F.util.multiplyTransformMatrices(M, m), w = o.width / 2, h = o.height / 2;
    var pts = [[-w, -h], [w, -h], [w, h], [-w, h]].map(function (p) { return F.util.transformPoint({ x: p[0], y: p[1] }, D); });
    var x0 = Math.floor(Math.min.apply(null, pts.map(function (p) { return p.x; }))), y0 = Math.floor(Math.min.apply(null, pts.map(function (p) { return p.y; })));
    var x1 = Math.ceil(Math.max.apply(null, pts.map(function (p) { return p.x; }))), y1 = Math.ceil(Math.max.apply(null, pts.map(function (p) { return p.y; })));
    var cw = ctx.canvas.width, ch = ctx.canvas.height;
    var zoom = Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])) || 1, rr = r * zoom, pad = Math.ceil(rr * 2);
    var sx0 = Math.max(0, x0 - pad), sy0 = Math.max(0, y0 - pad), sx1 = Math.min(cw, x1 + pad), sy1 = Math.min(ch, y1 + pad);
    if (sx1 - sx0 < 2 || sy1 - sy0 < 2) return;
    var t = mkCanvas(sx1 - sx0, sy1 - sy0), tx = t.getContext('2d');
    tx.drawImage(ctx.canvas, sx0, sy0, t.width, t.height, 0, 0, t.width, t.height);
    blurCanvas(t, rr);
    // cut to the object's silhouette
    var s = mkCanvas(t.width, t.height), sc = s.getContext('2d');
    sc.setTransform(D[0], D[1], D[2], D[3], D[4] - sx0, D[5] - sy0);
    silhouette(o, sc);
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.globalCompositeOperation = 'source-in'; sc.drawImage(t, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.opacity == null ? 1 : o.opacity;
    ctx.drawImage(s, sx0, sy0); ctx.restore();
  }
  function silhouette(o, ctx) {
    var keep = { fill: o.fill, stroke: o.stroke, shadow: o.shadow, clipPath: o.clipPath };
    o.fill = '#000'; o.stroke = null; o.shadow = null;
    try {
      if (o._objects) o._objects.forEach(function (k) { ctx.save(); k.transform(ctx); var f = k.fill; k.fill = k.fill ? '#000' : k.fill; k._render(ctx); k.fill = f; ctx.restore(); });
      else o._render(ctx);
    } finally { o.fill = keep.fill; o.stroke = keep.stroke; o.shadow = keep.shadow; }
  }

  // ---------- stroke position ----------
  var baseStroke = O._renderStroke;
  O._renderStroke = function (ctx) {
    var pos = this.gStrokePos;
    if (!this.stroke || !this.strokeWidth || !pos || pos === 'center' || this.type === 'line' || (this.type === 'path' && !isClosed(this))) return baseStroke.call(this, ctx);
    var sw = this.strokeWidth;
    ctx.save();
    if (pos === 'inside') ctx.clip();
    else { ctx.rect(-1e5, -1e5, 2e5, 2e5); ctx.clip('evenodd'); }
    this.strokeWidth = sw * 2;
    try { baseStroke.call(this, ctx); } finally { this.strokeWidth = sw; }
    ctx.restore();
  };
  function isClosed(o) { var p = o.path || []; return p.some(function (c) { return c[0] === 'Z' || c[0] === 'z'; }); }

  // ---------- rounded corners for triangles and polygons ----------
  function roundedPoly(ctx, pts, r) {
    var n = pts.length;
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      var v1 = { x: p0.x - p1.x, y: p0.y - p1.y }, v2 = { x: p2.x - p1.x, y: p2.y - p1.y };
      var l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
      var ang = Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / (l1 * l2 || 1))));
      var t = Math.tan(ang / 2) || 1e-6, rr = Math.min(r, Math.min(l1, l2) / 2 * t);
      var d = rr / t;
      var a = { x: p1.x + v1.x / l1 * d, y: p1.y + v1.y / l1 * d }, b = { x: p1.x + v2.x / l2 * d, y: p1.y + v2.y / l2 * d };
      if (i === 0) ctx.moveTo(a.x, a.y); else ctx.lineTo(a.x, a.y);
      ctx.arcTo(p1.x, p1.y, b.x, b.y, rr);
    }
    ctx.closePath();
  }
  var triR = F.Triangle.prototype._render;
  F.Triangle.prototype._render = function (ctx) {
    if (!(this.gRound > 0)) return triR.call(this, ctx);
    var w = this.width / 2, h = this.height / 2;
    roundedPoly(ctx, [{ x: -w, y: h }, { x: 0, y: -h }, { x: w, y: h }], this.gRound);
    this._renderPaintInOrder(ctx);
  };
  var polyR = F.Polygon.prototype._render;
  F.Polygon.prototype._render = function (ctx) {
    if (!(this.gRound > 0) || this.type !== 'polygon') return polyR.call(this, ctx);
    var off = this.pathOffset;
    roundedPoly(ctx, this.points.map(function (p) { return { x: p.x - off.x, y: p.y - off.y }; }), this.gRound);
    this._renderPaintInOrder(ctx);
  };

  // ---------- paints: linear / radial (native), angular / diamond / image (pattern) ----------
  function stopsCss(stops) { return (stops || []).slice().sort(function (a, b) { return a.p - b.p; }); }
  function colorAt(stops, t) {
    stops = stopsCss(stops); if (!stops.length) return [0, 0, 0, 0];
    var src = function (s) { var c = new F.Color(s.c).getSource(); return [c[0], c[1], c[2], (c[3] == null ? 1 : c[3]) * (s.a == null ? 1 : s.a)]; };
    if (t <= stops[0].p) return src(stops[0]);
    for (var i = 1; i < stops.length; i++) if (t <= stops[i].p) {
      var a = stops[i - 1], b = stops[i], k = (t - a.p) / ((b.p - a.p) || 1), A = src(a), B = src(b);
      return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k, A[3] + (B[3] - A[3]) * k];
    }
    return src(stops[stops.length - 1]);
  }
  function fabricStops(stops) {
    return stopsCss(stops).map(function (s) { return { offset: Math.max(0, Math.min(1, s.p)), color: s.c, opacity: s.a == null ? 1 : s.a }; });
  }
  // returns a Fabric fill (Gradient / Pattern) or a promise of one (image fills)
  function makePaint(o, g) {
    var ang = (g.angle || 0) * Math.PI / 180;
    if (g.type === 'linear') {
      var dx = Math.cos(ang) / 2, dy = Math.sin(ang) / 2;
      return new F.Gradient({ type: 'linear', gradientUnits: 'percentage', coords: { x1: 0.5 - dx, y1: 0.5 - dy, x2: 0.5 + dx, y2: 0.5 + dy }, colorStops: fabricStops(g.stops) });
    }
    if (g.type === 'radial') {
      var cx = g.cx == null ? 0.5 : g.cx, cy = g.cy == null ? 0.5 : g.cy;
      return new F.Gradient({ type: 'radial', gradientUnits: 'percentage', coords: { x1: cx, y1: cy, r1: 0, x2: cx, y2: cy, r2: (g.r || 0.5) }, colorStops: fabricStops(g.stops) });
    }
    if (g.type === 'angular' || g.type === 'diamond') {
      var S = 256, c = mkCanvas(S, S), x = c.getContext('2d'), id = x.createImageData(S, S), d = id.data;
      for (var j = 0; j < S; j++) for (var i = 0; i < S; i++) {
        var u = (i + 0.5) / S - 0.5, v = (j + 0.5) / S - 0.5, t;
        if (g.type === 'angular') { t = (Math.atan2(v, u) - ang) / (2 * Math.PI); t -= Math.floor(t); }
        else t = Math.min(1, (Math.abs(u) + Math.abs(v)) * 2);
        var col = colorAt(g.stops, t), k = (j * S + i) * 4;
        d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = col[3] * 255;
      }
      x.putImageData(id, 0, 0);
      return new F.Pattern({ source: c, repeat: 'no-repeat', patternTransform: [o.width / S, 0, 0, o.height / S, 0, 0] });
    }
    if (g.type === 'image' && g.src) {
      return new Promise(function (res) {
        var im = new Image(); im.crossOrigin = 'anonymous';
        im.onload = function () {
          var k = g.fit === 'fit' ? Math.min(o.width / im.width, o.height / im.height) : Math.max(o.width / im.width, o.height / im.height);
          var sc = (g.scale || 1) * k, ox = (o.width - im.width * sc) / 2, oy = (o.height - im.height * sc) / 2;
          res(new F.Pattern({ source: im, repeat: g.fit === 'tile' ? 'repeat' : 'no-repeat', patternTransform: [sc, 0, 0, sc, ox, oy] }));
        };
        im.onerror = function () { res(null); };
        im.src = g.src;
      });
    }
    return null;
  }
  // (re)apply o.gPaint / o.gPaintS; returns a promise
  function applyPaint(o, which) {
    var key = which === 'stroke' ? 'gPaintS' : 'gPaint', g = o[key];
    if (!g || !g.type || g.type === 'solid') return Promise.resolve();
    return Promise.resolve(makePaint(o, g)).then(function (p) { if (p) { o.set(which === 'stroke' ? 'stroke' : 'fill', p); o.set('dirty', true); } });
  }
  function cssPreview(g) {
    var st = stopsCss(g.stops).map(function (s) { return rgba(s.c, s.a) + ' ' + Math.round(s.p * 100) + '%'; }).join(', ');
    if (g.type === 'radial') return 'radial-gradient(circle, ' + st + ')';
    if (g.type === 'angular') return 'conic-gradient(from ' + ((g.angle || 0) + 90) + 'deg, ' + st + ')';
    if (g.type === 'diamond') return 'radial-gradient(circle, ' + st + ')';
    return 'linear-gradient(90deg, ' + st + ')';
  }

  // ---------- photo adjustments: one filter for exposure, tone, colour temperature, split toning, vignette ----------
  var FI = F.Image.filters;
  var ADJ_KEYS = ['exposure', 'highlights', 'shadows', 'temperature', 'tint', 'vibrance', 'fade', 'vignette', 'split'];
  function hex3(h) { var c = new F.Color(h || '#000').getSource(); return [c[0] / 255, c[1] / 255, c[2] / 255]; }
  FI.GcAdjust = F.util.createClass(FI.BaseFilter, {
    type: 'GcAdjust',
    exposure: 0, highlights: 0, shadows: 0, temperature: 0, tint: 0, vibrance: 0, fade: 0, vignette: 0, split: 0, splitLo: '#1f6fff', splitHi: '#ff9a3c',
    fragmentSource: 'precision highp float;\n' +
      'uniform sampler2D uTexture; varying vec2 vTexCoord;\n' +
      'uniform float uExp, uHi, uSh, uTemp, uTint, uVib, uFade, uVig, uSplit; uniform vec3 uLo, uHiC;\n' +
      'void main() {\n' +
      '  vec4 col = texture2D(uTexture, vTexCoord); vec3 c = col.rgb;\n' +
      '  c *= pow(2.0, uExp * 1.5);\n' +
      '  c.r += uTemp * 0.12; c.b -= uTemp * 0.12; c.g -= uTint * 0.1;\n' +
      '  float L = dot(c, vec3(0.299, 0.587, 0.114));\n' +
      '  c += vec3(uSh * 0.4 * (1.0 - smoothstep(0.0, 0.6, L)));\n' +
      '  c += vec3(uHi * 0.35 * smoothstep(0.4, 1.0, L));\n' +
      '  float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));\n' +
      '  L = dot(c, vec3(0.299, 0.587, 0.114));\n' +
      '  c = mix(vec3(L), c, 1.0 + uVib * (1.0 - clamp(mx - mn, 0.0, 1.0)));\n' +
      '  c += (uLo - 0.5) * uSplit * 0.5 * (1.0 - L) + (uHiC - 0.5) * uSplit * 0.5 * L;\n' +
      '  c = c * (1.0 - uFade * 0.25) + uFade * 0.1;\n' +
      '  float d = distance(vTexCoord, vec2(0.5)) * 1.414;\n' +
      '  float v = smoothstep(0.35, 1.05, d);\n' +
      '  if (uVig > 0.0) c *= 1.0 - uVig * v; else c = mix(c, vec3(1.0), -uVig * v);\n' +
      '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), col.a);\n' +
      '}',
    isNeutralState: function () { var t = this; return ADJ_KEYS.every(function (k) { return !t[k]; }); },
    applyTo2d: function (o) {
      var d = o.imageData.data, W = o.imageData.width, H = o.imageData.height, t = this;
      var ex = Math.pow(2, t.exposure * 1.5), lo = hex3(t.splitLo), hi = hex3(t.splitHi);
      var ss = function (a, b, x) { x = Math.max(0, Math.min(1, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        var i = (y * W + x) * 4; if (!d[i + 3]) continue;
        var r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
        r *= ex; g *= ex; b *= ex;
        r += t.temperature * 0.12; b -= t.temperature * 0.12; g -= t.tint * 0.1;
        var L = r * 0.299 + g * 0.587 + b * 0.114, sh = t.shadows * 0.4 * (1 - ss(0, 0.6, L)), hl = t.highlights * 0.35 * ss(0.4, 1, L);
        r += sh + hl; g += sh + hl; b += sh + hl;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b); L = r * 0.299 + g * 0.587 + b * 0.114;
        var k = 1 + t.vibrance * (1 - Math.max(0, Math.min(1, mx - mn)));
        r = L + (r - L) * k; g = L + (g - L) * k; b = L + (b - L) * k;
        if (t.split) { var s1 = t.split * 0.5 * (1 - L), s2 = t.split * 0.5 * L; r += (lo[0] - 0.5) * s1 + (hi[0] - 0.5) * s2; g += (lo[1] - 0.5) * s1 + (hi[1] - 0.5) * s2; b += (lo[2] - 0.5) * s1 + (hi[2] - 0.5) * s2; }
        if (t.fade) { r = r * (1 - t.fade * 0.25) + t.fade * 0.1; g = g * (1 - t.fade * 0.25) + t.fade * 0.1; b = b * (1 - t.fade * 0.25) + t.fade * 0.1; }
        if (t.vignette) {
          var dd = Math.hypot(x / W - 0.5, y / H - 0.5) * 1.414, v = ss(0.35, 1.05, dd);
          if (t.vignette > 0) { var m = 1 - t.vignette * v; r *= m; g *= m; b *= m; } else { var q = -t.vignette * v; r += (1 - r) * q; g += (1 - g) * q; b += (1 - b) * q; }
        }
        d[i] = Math.max(0, Math.min(1, r)) * 255; d[i + 1] = Math.max(0, Math.min(1, g)) * 255; d[i + 2] = Math.max(0, Math.min(1, b)) * 255;
      }
    },
    getUniformLocations: function (gl, p) {
      var u = {}; ['uExp', 'uHi', 'uSh', 'uTemp', 'uTint', 'uVib', 'uFade', 'uVig', 'uSplit', 'uLo', 'uHiC'].forEach(function (k) { u[k] = gl.getUniformLocation(p, k); }); return u;
    },
    sendUniformData: function (gl, u) {
      gl.uniform1f(u.uExp, this.exposure); gl.uniform1f(u.uHi, this.highlights); gl.uniform1f(u.uSh, this.shadows);
      gl.uniform1f(u.uTemp, this.temperature); gl.uniform1f(u.uTint, this.tint); gl.uniform1f(u.uVib, this.vibrance);
      gl.uniform1f(u.uFade, this.fade); gl.uniform1f(u.uVig, this.vignette); gl.uniform1f(u.uSplit, this.split);
      gl.uniform3fv(u.uLo, hex3(this.splitLo)); gl.uniform3fv(u.uHiC, hex3(this.splitHi));
    },
    toObject: function () { var t = this, r = { type: this.type, splitLo: this.splitLo, splitHi: this.splitHi }; ADJ_KEYS.forEach(function (k) { r[k] = t[k]; }); return r; }
  });
  FI.GcAdjust.fromObject = FI.BaseFilter.fromObject;

  // ---------- extra serialised properties ----------
  var EXTRA = ['gFx', 'gStrokePos', 'gRound', 'gPaint', 'gPaintS', 'gPen', 'gMaskGroup', 'gBrush', 'gAnim', 'gTrans', 'gCurve', 'gSharp', 'gPreset', 'gAdj', 'gEraser'];
  F.Object.prototype.cacheProperties = F.Object.prototype.cacheProperties.concat(['gRound', 'gStrokePos']);
  // copies / undo snapshots must not share effect & paint arrays
  var baseToObject = O.toObject;
  O.toObject = function (props) {
    var r = baseToObject.call(this, props);
    EXTRA.forEach(function (k) { if (r[k] != null && typeof r[k] === 'object') r[k] = JSON.parse(JSON.stringify(r[k])); });
    return r;
  };

  // ---------- video layer ----------
  // A photo-like object that shows a video. The poster image is its Fabric element (so it saves, thumbnails and
  // exports like a picture); the <video> plays on top of that when the editor starts it. Always cover-fits its box.
  function blankPoster() { var c = mkCanvas(160, 90), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 160, 90); g.addColorStop(0, '#23262f'); g.addColorStop(1, '#101217'); x.fillStyle = g; x.fillRect(0, 0, 160, 90); return c; }
  var VPROPS = ['gSrc', 'gLoop', 'gSound', 'gFX', 'gFY', 'gCredit'];
  F.Gvideo = F.util.createClass(F.Image, {
    type: 'gvideo',
    gSrc: '', gLoop: true, gSound: false, gFX: 0.5, gFY: 0.5,
    initialize: function (el, o) { this.callSuper('initialize', el || blankPoster(), o); },
    frameEl: function () { var v = this._vid; return v && v.readyState >= 2 && v.videoWidth ? v : this._element; },
    _render: function (ctx) {
      var el = this.frameEl(), w = this.width, h = this.height;
      var iw = el && (el.videoWidth || el.naturalWidth || el.width), ih = el && (el.videoHeight || el.naturalHeight || el.height);
      if (!iw || !ih) { ctx.fillStyle = '#1b1d24'; ctx.fillRect(-w / 2, -h / 2, w, h); return; }
      var k = Math.max(w / iw, h / ih), sw = w / k, sh = h / k, fx = this.gFX == null ? 0.5 : this.gFX, fy = this.gFY == null ? 0.5 : this.gFY;
      F.util.setImageSmoothing(ctx, true);
      ctx.drawImage(el, (iw - sw) * fx, (ih - sh) * fy, sw, sh, -w / 2, -h / 2, w, h);
      this._stroke(ctx);
    },
    applyFilters: function () { return this; },
    applyResizeFilters: function () {},
    toObject: function (p) { return this.callSuper('toObject', VPROPS.concat(p || [])); },
    // create (once) and return the <video>; the editor decides when it plays
    gEnsure: function () {
      if (this._vid || !this.gSrc) return this._vid;
      var self = this, v = document.createElement('video');
      v.crossOrigin = 'anonymous'; v.muted = true; v.defaultMuted = true; v.loop = this.gLoop !== false; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
      var redraw = function () { self.dirty = true; if (self.canvas) self.canvas.requestRenderAll(); };
      v.addEventListener('loadeddata', redraw); v.addEventListener('seeked', redraw);
      v.addEventListener('error', function () { self._vidErr = true; });
      this._vid = v;
      Promise.resolve(F.Gvideo.resolve(this.gSrc)).then(function (u) { if (u && self._vid === v) { v.src = u; v.load(); } });
      return v;
    },
    gDispose: function () { var v = this._vid; if (!v) return; this._vid = null; try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {} }
  });
  // "pexels:<id>" → our Worker resolves the id to the HD file; other sources can be plugged in by the editor
  F.Gvideo.resolve = function (s) { var m = /^pexels:(\d+)$/.exec(s || ''); return m ? '/api/stock/video?id=' + m[1] : s; };
  F.Gvideo.poster = function (s) { var m = /^pexels:(\d+)$/.exec(s || ''); return m ? '/api/stock/video?id=' + m[1] + '&poster=1' : ''; };
  F.Gvideo.blankPoster = blankPoster;
  F.Gvideo.fromObject = function (obj, cb) {
    var o = F.util.object.clone(obj), src = o.src; delete o.src; o.filters = []; delete o.resizeFilter;
    var make = function (img) { F.util.enlivenObjectEnlivables(o, o, function () { cb(new F.Gvideo(img || blankPoster(), o)); }); };
    if (!src) return make(null);
    F.util.loadImage(src, function (img, err) { make(err ? null : img); }, null, 'anonymous');
  };

  window.GFX = {
    EXTRA: EXTRA, HAS_FILTER: HAS_FILTER, fxOn: fxOn, fxOf: fxOf,
    makePaint: makePaint, applyPaint: applyPaint, colorAt: colorAt, cssPreview: cssPreview, rgba: rgba,
    blurCanvas: blurCanvas, roundedPoly: roundedPoly, ADJ_KEYS: ADJ_KEYS, PIXEL_FX: PIXEL_FX,
    // sync the drop shadow entry → Fabric's native shadow and mark caches dirty
    sync: function (o) {
      var ds = fxOf(o, 'drop');
      o.shadow = ds ? new F.Shadow({ color: ds.c || 'rgba(0,0,0,0.25)', blur: ds.b || 0, offsetX: ds.x || 0, offsetY: ds.y || 0, nonScaling: true }) : null;
      o.set('dirty', true);
      if (o.group) o.group.set('dirty', true);
    }
  };
})();
