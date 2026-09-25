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
  function hasPixelFx(o) { return fxOn(o).some(function (e) { return e.t === 'inner' || e.t === 'blur' || e.t === 'noise' || e.t === 'glass'; }); }
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
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
      ctx.filter = 'blur(' + r + 'px)'; ctx.drawImage(t, 0, 0); ctx.restore();
    } else {
      // big radii: blur a downscaled copy (fast), then scale back up
      var k = r > 24 ? Math.min(8, r / 12) : 1, sw = Math.max(1, Math.round(c.width / k)), sh = Math.max(1, Math.round(c.height / k));
      var s = mkCanvas(sw, sh), sx = s.getContext('2d'); sx.drawImage(c, 0, 0, sw, sh);
      var id = sx.getImageData(0, 0, sw, sh); boxBlur(id, sw, sh, r / k); sx.putImageData(id, 0, 0);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
      ctx.imageSmoothingQuality = 'high'; ctx.drawImage(s, 0, 0, c.width, c.height); ctx.restore();
    }
  }
  // deterministic noise so the grain doesn't flicker between renders
  function rand(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------- pixel effects on the cache canvas ----------
  function applyPixelFx(o, c) {
    var z = o.zoomX || 1, ctx = c.getContext('2d'), list = fxOn(o);
    list.forEach(function (e) {
      if (e.t === 'inner') innerShadow(c, (e.x || 0) * z, (e.y || 0) * z, (e.b || 0) * z, rgba(e.c || 'rgba(0,0,0,0.35)'));
      if (e.t === 'glass') {
        // frosted edge light: a soft inner highlight from the top-left + a darker rim bottom-right
        innerShadow(c, 2 * z, 2 * z, 6 * z, 'rgba(255,255,255,' + (0.55 * (e.a == null ? 1 : e.a)) + ')');
        innerShadow(c, -2 * z, -2 * z, 8 * z, 'rgba(0,0,0,' + (0.18 * (e.a == null ? 1 : e.a)) + ')');
      }
    });
    list.forEach(function (e) { if (e.t === 'noise') noise(o, c, e.a == null ? 0.25 : e.a, !!e.mono, e.s || 1, z); });
    var bl = fxOf(o, 'blur'); if (bl && bl.b > 0) blurCanvas(c, bl.b * z);
    void ctx;
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
    fxOn(o).forEach(function (e) { if (e.t === 'blur') p = Math.max(p, (e.b || 0) * 1.5 + 2); });
    if (o.gStrokePos === 'outside' && o.stroke && o.strokeWidth) p = Math.max(p, o.strokeWidth / 2 + 1);
    return p;
  }
  var baseDims = O._getCacheCanvasDimensions;
  function patchDims(proto) {
    var orig = proto._getCacheCanvasDimensions;
    proto._getCacheCanvasDimensions = function () {
      var d = orig.call(this), p = fxPad(this);
      if (p) { d.width += p * 2 * d.zoomX; d.height += p * 2 * d.zoomY; }
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

  // ---------- extra serialised properties ----------
  var EXTRA = ['gFx', 'gStrokePos', 'gRound', 'gPaint', 'gPaintS', 'gPen', 'gMaskGroup', 'gBrush'];
  F.Object.prototype.cacheProperties = F.Object.prototype.cacheProperties.concat(['gRound', 'gStrokePos']);
  // copies / undo snapshots must not share effect & paint arrays
  var baseToObject = O.toObject;
  O.toObject = function (props) {
    var r = baseToObject.call(this, props);
    EXTRA.forEach(function (k) { if (r[k] != null && typeof r[k] === 'object') r[k] = JSON.parse(JSON.stringify(r[k])); });
    return r;
  };

  window.GFX = {
    EXTRA: EXTRA, HAS_FILTER: HAS_FILTER, fxOn: fxOn, fxOf: fxOf,
    makePaint: makePaint, applyPaint: applyPaint, colorAt: colorAt, cssPreview: cssPreview, rgba: rgba,
    blurCanvas: blurCanvas, roundedPoly: roundedPoly,
    // sync the drop shadow entry → Fabric's native shadow and mark caches dirty
    sync: function (o) {
      var ds = fxOf(o, 'drop');
      o.shadow = ds ? new F.Shadow({ color: ds.c || 'rgba(0,0,0,0.25)', blur: ds.b || 0, offsetX: ds.x || 0, offsetY: ds.y || 0 }) : null;
      o.set('dirty', true);
      if (o.group) o.group.set('dirty', true);
    }
  };
})();
