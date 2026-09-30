/* Graphican — PowerPoint (.pptx) reader for the /slides/ editor.
   window.GPptx.parse(arrayBuffer) → Promise<deck>
     deck  = { w, h (EMU), name, slides: [slide], fonts: [family], skipped: {n, what} }
     slide = { bg: {color} | {img, color}, items: [item], notes, hidden }
     item  = { t: 'shape', geom: 'rect'|'roundRect'|'ellipse'|'triangle'|'line'|'path', x, y, w, h, rot, flipH, flipV,
               fill: {hex, a} | null, fillImg, stroke: {hex, a, w} | null, radius, d (SVG path in a w×h box), text }
           | { t: 'image', x, y, w, h, rot, flipH, flipV, img (zip path), crop {l, t, r, b} (fractions) }
           | { t: 'table' | 'chart', x, y, w, h, model }   (models of the «Элемент» kit: slides-kit.js)
     text  = { paras: [{ align, bullet, lineSpacing, runs: [{ text, size (pt), bold, italic, underline, strike, color, font }] }],
               anchor: 't'|'ctr'|'b', ins: {l, t, r, b}, vert, scale }
   Everything in EMU (914400 per inch, 12700 per point); the editor scales it onto its 1920-wide slides.
   Placeholders inherit position and text style from the layout and master; theme colours and fonts are resolved;
   master / layout decoration (logos, bars) is drawn under each slide's own content. Needs JSZip (pptxgen bundle). */
(function () {
  'use strict';

  // ---------- small XML helpers (namespace-agnostic: we match on localName) ----------
  function kids(el, name) { var out = []; if (!el) return out; for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (!name || c.localName === name) out.push(c); return out; }
  function kid(el, name) { if (!el) return null; for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === name) return c; return null; }
  function at(el) { for (var i = 1; i < arguments.length && el; i++) el = kid(el, arguments[i]); return el || null; }
  function attr(el, n) { return el ? el.getAttribute(n) : null; }
  function num(v, d) { v = parseFloat(v); return isNaN(v) ? d : v; }
  function first(el, name) { if (!el) return null; var l = el.getElementsByTagNameNS('*', name); return l.length ? l[0] : null; }
  function textOf(el) { return el ? el.textContent : ''; }
  function parseXml(s) { return new DOMParser().parseFromString(s, 'application/xml'); }
  function dirOf(p) { return p.slice(0, p.lastIndexOf('/') + 1); }
  function resolve(base, target) {
    if (/^\//.test(target)) return target.slice(1);
    var parts = (dirOf(base) + target).split('/'), out = [];
    parts.forEach(function (s) { if (s === '..') out.pop(); else if (s && s !== '.') out.push(s); });
    return out.join('/');
  }

  // ---------- colours ----------
  function hex2rgb(h) { var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgb2hex(r) { return r.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return ('0' + v.toString(16)).slice(-2); }).join(''); }
  function rgb2hsl(r) {
    var R = r[0] / 255, G = r[1] / 255, B = r[2] / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h /= 6; }
    return [h, s, l];
  }
  function hsl2rgb(h) {
    var H = h[0], S = h[1], L = h[2];
    if (!S) return [L * 255, L * 255, L * 255];
    var q = L < 0.5 ? L * (1 + S) : L + S - L * S, p = 2 * L - q;
    function f(t) { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }
    return [f(H + 1 / 3) * 255, f(H) * 255, f(H - 1 / 3) * 255];
  }
  var PRESET = { black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000', blue: '0000FF', yellow: 'FFFF00', gray: '808080', grey: '808080', orange: 'FFA500', navy: '000080' };

  // ---------- the reader ----------
  function Reader(zip) { this.zip = zip; this.xmlCache = {}; this.relCache = {}; this.skipped = []; this.fonts = {}; }
  Reader.prototype.xml = function (p) {
    var self = this;
    if (!this.xmlCache[p]) {
      var f = this.zip.file(p);
      this.xmlCache[p] = f ? f.async('string').then(parseXml) : Promise.resolve(null);
    }
    return this.xmlCache[p].then(function (d) { return d; }, function () { self.xmlCache[p] = Promise.resolve(null); return null; });
  };
  Reader.prototype.rels = function (part) {
    if (!this.relCache[part]) {
      var rp = dirOf(part) + '_rels/' + part.slice(part.lastIndexOf('/') + 1) + '.rels';
      this.relCache[part] = this.xml(rp).then(function (d) {
        var m = {};
        if (d) kids(d.documentElement, 'Relationship').forEach(function (r) {
          var mode = attr(r, 'TargetMode');
          m[attr(r, 'Id')] = { type: attr(r, 'Type') || '', target: mode === 'External' ? null : resolve(part, attr(r, 'Target')) };
        });
        return m;
      });
    }
    return this.relCache[part];
  };
  function relOfType(rels, suffix) { for (var k in rels) if (rels[k].type.slice(-suffix.length) === suffix) return rels[k].target; return null; }

  // theme + colour map of one master
  function Theme(doc, clrMap) {
    this.colors = {}; this.major = 'Calibri'; this.minor = 'Calibri'; this.map = clrMap || {};
    var root = doc && doc.documentElement, te = root && at(root, 'themeElements');
    var cs = at(te, 'clrScheme');
    var self = this;
    kids(cs).forEach(function (c) {
      var v = kid(c, 'srgbClr'), s = kid(c, 'sysClr');
      self.colors[c.localName] = v ? attr(v, 'val') : s ? (attr(s, 'lastClr') || (attr(s, 'val') === 'window' ? 'FFFFFF' : '000000')) : '000000';
    });
    var fs = at(te, 'fontScheme');
    var mj = at(fs, 'majorFont', 'latin'), mn = at(fs, 'minorFont', 'latin');
    if (mj && attr(mj, 'typeface')) this.major = attr(mj, 'typeface');
    if (mn && attr(mn, 'typeface')) this.minor = attr(mn, 'typeface');
  }
  Theme.prototype.scheme = function (name) {
    var m = { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2' };
    var key = this.map[name] || m[name] || name;
    return this.colors[key] || this.colors[name] || null;
  };
  Theme.prototype.font = function (face) {
    if (!face) return null;
    if (/^\+mj/.test(face)) return this.major;
    if (/^\+mn/.test(face)) return this.minor;
    return face;
  };

  // colour element container (solidFill, fgClr, gs, fontRef…) → {hex, a}
  function color(el, th, ph) {
    if (!el) return null;
    var c = null;
    for (var x = el.firstElementChild; x && !c; x = x.nextElementSibling) {
      var n = x.localName, v = attr(x, 'val'), base = null;
      if (n === 'srgbClr') base = v;
      else if (n === 'schemeClr') base = v === 'phClr' ? (ph ? ph.hex : null) : th.scheme(v);
      else if (n === 'sysClr') base = attr(x, 'lastClr') || (v === 'window' ? 'FFFFFF' : '000000');
      else if (n === 'prstClr') base = PRESET[v] || '000000';
      else if (n === 'scrgbClr') base = rgb2hex([num(attr(x, 'r'), 0) / 1e5 * 255, num(attr(x, 'g'), 0) / 1e5 * 255, num(attr(x, 'b'), 0) / 1e5 * 255]);
      else if (n === 'hslClr') base = rgb2hex(hsl2rgb([num(attr(x, 'hue'), 0) / 21600000, num(attr(x, 'sat'), 0) / 1e5, num(attr(x, 'lum'), 0) / 1e5]));
      else continue;
      if (!base || !/^[0-9a-fA-F]{6}$/.test(base)) return ph || null;
      var rgb = hex2rgb(base), a = 1;
      kids(x).forEach(function (m) {
        var mv = num(attr(m, 'val'), 0) / 1e5, h;
        switch (m.localName) {
          case 'alpha': a = mv; break;
          case 'lumMod': h = rgb2hsl(rgb); h[2] *= mv; rgb = hsl2rgb(h); break;
          case 'lumOff': h = rgb2hsl(rgb); h[2] = Math.min(1, h[2] + mv); rgb = hsl2rgb(h); break;
          case 'satMod': h = rgb2hsl(rgb); h[1] = Math.min(1, h[1] * mv); rgb = hsl2rgb(h); break;
          case 'tint': rgb = rgb.map(function (v) { return v + (255 - v) * (1 - mv); }); break;
          case 'shade': rgb = rgb.map(function (v) { return v * mv; }); break;
        }
      });
      c = { hex: '#' + rgb2hex(rgb), a: a };
    }
    return c;
  }
  // fill of an spPr-like element: undefined = not set (inherit), null = no fill, {hex,a} or {img}
  function fill(pr, th, ph) {
    if (!pr) return undefined;
    for (var x = pr.firstElementChild; x; x = x.nextElementSibling) {
      var n = x.localName;
      if (n === 'noFill') return null;
      if (n === 'solidFill') return color(x, th, ph);
      if (n === 'gradFill') {   // flat: the colour in the middle of the gradient
        var gs = kids(at(x, 'gsLst'), 'gs');
        if (!gs.length) return null;
        gs.sort(function (p, q) { return num(attr(p, 'pos'), 0) - num(attr(q, 'pos'), 0); });
        var c1 = color(gs[0], th, ph), c2 = color(gs[gs.length - 1], th, ph);
        if (!c1 || !c2) return c1 || c2;
        var a = hex2rgb(c1.hex.slice(1)), b = hex2rgb(c2.hex.slice(1));
        return { hex: '#' + rgb2hex(a.map(function (v, i) { return (v + b[i]) / 2; })), a: (c1.a + c2.a) / 2, grad: [c1, c2], ang: num(attr(at(x, 'lin'), 'ang'), 0) / 60000 };
      }
      if (n === 'pattFill') return color(at(x, 'fgClr'), th, ph);
      if (n === 'blipFill') { var bl = at(x, 'blip'); return { img: attr(bl, 'r:embed') || attr(bl, 'embed') }; }
      if (n === 'grpFill') return 'grp';
    }
    return undefined;
  }

  // ---------- geometry ----------
  function xfrmOf(pr) {
    var x = at(pr, 'xfrm'); if (!x) return null;
    var off = kid(x, 'off'), ext = kid(x, 'ext');
    if (!off || !ext) return null;
    return {
      x: num(attr(off, 'x'), 0), y: num(attr(off, 'y'), 0), w: num(attr(ext, 'cx'), 0), h: num(attr(ext, 'cy'), 0),
      rot: num(attr(x, 'rot'), 0) / 60000, flipH: attr(x, 'flipH') === '1', flipV: attr(x, 'flipV') === '1',
      ch: kid(x, 'chOff') ? { x: num(attr(kid(x, 'chOff'), 'x'), 0), y: num(attr(kid(x, 'chOff'), 'y'), 0), w: num(attr(kid(x, 'chExt'), 'cx'), 1), h: num(attr(kid(x, 'chExt'), 'cy'), 1) } : null
    };
  }
  // group transform: child space → parent space
  function mapBox(g, b) {
    if (!g) return b;
    var sx = g.ch && g.ch.w ? g.w / g.ch.w : 1, sy = g.ch && g.ch.h ? g.h / g.ch.h : 1, cx = g.ch ? g.ch.x : 0, cy = g.ch ? g.ch.y : 0;
    return { x: g.x + (b.x - cx) * sx, y: g.y + (b.y - cy) * sy, w: b.w * sx, h: b.h * sy, rot: b.rot + (g.rot || 0), flipH: b.flipH !== !!g.flipH, flipV: b.flipV !== !!g.flipV };
  }
  function f2(v) { return Math.round(v * 100) / 100; }
  // preset shapes the editor has no object for → an SVG path in a w×h box
  function presetPath(prst, w, h, adj) {
    var P = function (pts) { return 'M ' + pts.map(function (p) { return f2(p[0]) + ' ' + f2(p[1]); }).join(' L ') + ' Z'; };
    var a = function (k, d) { return adj[k] != null ? adj[k] / 100000 : d; };
    var m = Math.min(w, h);
    switch (prst) {
      case 'diamond': return P([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]);
      case 'rtTriangle': return P([[0, 0], [w, h], [0, h]]);
      case 'parallelogram': var o = m * a('adj', 0.25); return P([[o, 0], [w, 0], [w - o, h], [0, h]]);
      case 'trapezoid': var t = m * a('adj', 0.25); return P([[t, 0], [w - t, 0], [w, h], [0, h]]);
      case 'pentagon': return P([[w / 2, 0], [w, h * 0.38], [w * 0.81, h], [w * 0.19, h], [0, h * 0.38]]);
      case 'hexagon': var e = m * a('adj', 0.25); return P([[e, 0], [w - e, 0], [w, h / 2], [w - e, h], [e, h], [0, h / 2]]);
      case 'octagon': var c = m * a('adj', 0.29); return P([[c, 0], [w - c, 0], [w, c], [w, h - c], [w - c, h], [c, h], [0, h - c], [0, c]]);
      case 'homePlate': var hp = m * a('adj', 0.5); return P([[0, 0], [w - hp, 0], [w, h / 2], [w - hp, h], [0, h]]);
      case 'chevron': var cv = m * a('adj', 0.5); return P([[0, 0], [w - cv, 0], [w, h / 2], [w - cv, h], [0, h], [cv, h / 2]]);
      case 'rightArrow': var ra = h * a('adj1', 0.5) / 2, rh = m * a('adj2', 0.5); return P([[0, h / 2 - ra], [w - rh, h / 2 - ra], [w - rh, 0], [w, h / 2], [w - rh, h], [w - rh, h / 2 + ra], [0, h / 2 + ra]]);
      case 'leftArrow': var la = h * a('adj1', 0.5) / 2, lh = m * a('adj2', 0.5); return P([[w, h / 2 - la], [lh, h / 2 - la], [lh, 0], [0, h / 2], [lh, h], [lh, h / 2 + la], [w, h / 2 + la]]);
      case 'upArrow': var ua = w * a('adj1', 0.5) / 2, uh = m * a('adj2', 0.5); return P([[w / 2 - ua, h], [w / 2 - ua, uh], [0, uh], [w / 2, 0], [w, uh], [w / 2 + ua, uh], [w / 2 + ua, h]]);
      case 'downArrow': var da = w * a('adj1', 0.5) / 2, dh = m * a('adj2', 0.5); return P([[w / 2 - da, 0], [w / 2 + da, 0], [w / 2 + da, h - dh], [w, h - dh], [w / 2, h], [0, h - dh], [w / 2 - da, h - dh]]);
      case 'plus': case 'mathPlus': var pl = m * a('adj', 0.25); return P([[pl, 0], [w - pl, 0], [w - pl, pl], [w, pl], [w, h - pl], [w - pl, h - pl], [w - pl, h], [pl, h], [pl, h - pl], [0, h - pl], [0, pl], [pl, pl]]);
      case 'star4': case 'star5': case 'star6': case 'star8': case 'star10': case 'star12':
        var n = +prst.slice(4), ir = a('adj', prst === 'star5' ? 0.19 : 0.25) * 2, pts = [];
        for (var i = 0; i < n * 2; i++) { var ang = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? ir : 1; pts.push([w / 2 + Math.cos(ang) * r * w / 2, h / 2 + Math.sin(ang) * r * h / 2]); }
        return P(pts);
      case 'flowChartProcess': return P([[0, 0], [w, 0], [w, h], [0, h]]);
      case 'flowChartDecision': return P([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]);
      case 'snip1Rect': var s1 = m * a('adj', 0.1667); return P([[0, 0], [w - s1, 0], [w, s1], [w, h], [0, h]]);
      case 'snip2SameRect': var s2 = m * a('adj1', 0.1667); return P([[s2, 0], [w - s2, 0], [w, s2], [w, h], [0, h], [0, s2]]);
      case 'round1Rect': case 'round2SameRect': var r1 = m * a('adj1', a('adj', 0.1667)); return 'M 0 ' + f2(h) + ' L 0 ' + f2(r1) + ' Q 0 0 ' + f2(r1) + ' 0 L ' + f2(w - r1) + ' 0 Q ' + f2(w) + ' 0 ' + f2(w) + ' ' + f2(r1) + ' L ' + f2(w) + ' ' + f2(h) + ' Z';
      case 'wedgeRectCallout': case 'wedgeRoundRectCallout': return P([[0, 0], [w, 0], [w, h * 0.8], [w * 0.4, h * 0.8], [w * 0.2, h], [w * 0.25, h * 0.8], [0, h * 0.8]]);
      case 'donut': var dn = m * a('adj', 0.25), rx = w / 2, ry = h / 2, ix = rx - dn, iy = ry - dn;
        return 'M 0 ' + f2(ry) + ' A ' + f2(rx) + ' ' + f2(ry) + ' 0 1 0 ' + f2(w) + ' ' + f2(ry) + ' A ' + f2(rx) + ' ' + f2(ry) + ' 0 1 0 0 ' + f2(ry) + ' Z M ' + f2(dn) + ' ' + f2(ry) + ' A ' + f2(ix) + ' ' + f2(iy) + ' 0 1 1 ' + f2(w - dn) + ' ' + f2(ry) + ' A ' + f2(ix) + ' ' + f2(iy) + ' 0 1 1 ' + f2(dn) + ' ' + f2(ry) + ' Z';
    }
    return null;
  }
  // custom geometry (a:custGeom) → SVG path in a w×h box
  function custPath(cg, w, h) {
    var out = '';
    kids(at(cg, 'pathLst'), 'path').forEach(function (p) {
      var pw = num(attr(p, 'w'), w) || w, ph = num(attr(p, 'h'), h) || h, sx = w / pw, sy = h / ph, cx = 0, cy = 0;
      var pt = function (el) { return [num(attr(el, 'x'), 0) * sx, num(attr(el, 'y'), 0) * sy]; };
      kids(p).forEach(function (c) {
        var q;
        switch (c.localName) {
          case 'moveTo': q = pt(kid(c, 'pt')); out += 'M ' + f2(q[0]) + ' ' + f2(q[1]) + ' '; cx = q[0]; cy = q[1]; break;
          case 'lnTo': q = pt(kid(c, 'pt')); out += 'L ' + f2(q[0]) + ' ' + f2(q[1]) + ' '; cx = q[0]; cy = q[1]; break;
          case 'cubicBezTo': var ps = kids(c, 'pt').map(pt); if (ps.length === 3) { out += 'C ' + ps.map(function (z) { return f2(z[0]) + ' ' + f2(z[1]); }).join(' ') + ' '; cx = ps[2][0]; cy = ps[2][1]; } break;
          case 'quadBezTo': var qs = kids(c, 'pt').map(pt); if (qs.length === 2) { out += 'Q ' + qs.map(function (z) { return f2(z[0]) + ' ' + f2(z[1]); }).join(' ') + ' '; cx = qs[1][0]; cy = qs[1][1]; } break;
          case 'arcTo':
            var wR = num(attr(c, 'wR'), 0) * sx, hR = num(attr(c, 'hR'), 0) * sy, st = num(attr(c, 'stAng'), 0) / 60000 * Math.PI / 180, sw = num(attr(c, 'swAng'), 0) / 60000 * Math.PI / 180;
            if (!wR || !hR) break;
            var ox = cx - wR * Math.cos(st), oy = cy - hR * Math.sin(st), ex = ox + wR * Math.cos(st + sw), ey = oy + hR * Math.sin(st + sw);
            out += 'A ' + f2(wR) + ' ' + f2(hR) + ' 0 ' + (Math.abs(sw) > Math.PI ? 1 : 0) + ' ' + (sw > 0 ? 1 : 0) + ' ' + f2(ex) + ' ' + f2(ey) + ' ';
            cx = ex; cy = ey; break;
          case 'close': out += 'Z '; break;
        }
      });
    });
    return out.trim() || null;
  }

  // ---------- text ----------
  var ALIGN = { l: 'left', ctr: 'center', r: 'right', just: 'justify', dist: 'justify' };
  // style chain for one level: first defined wins (shape → layout ph → master ph → master txStyles → presentation default)
  function lvlPr(list, lvl) { return list.map(function (ls) { return ls ? kid(ls, 'lvl' + (lvl + 1) + 'pPr') : null; }).filter(Boolean); }
  function pick(chain, fn) { for (var i = 0; i < chain.length; i++) { var v = fn(chain[i]); if (v !== undefined && v !== null) return v; } return null; }
  function runProps(el, th, ph) {
    if (!el) return {};
    var r = {};
    if (attr(el, 'sz')) r.size = num(attr(el, 'sz'), 1800) / 100;
    if (attr(el, 'b') != null) r.bold = attr(el, 'b') === '1' || attr(el, 'b') === 'true';
    if (attr(el, 'i') != null) r.italic = attr(el, 'i') === '1' || attr(el, 'i') === 'true';
    if (attr(el, 'u') != null) r.underline = attr(el, 'u') !== 'none';
    if (attr(el, 'strike') != null) r.strike = attr(el, 'strike') !== 'noStrike';
    if (attr(el, 'cap') === 'all') r.caps = true;
    var f = kid(el, 'solidFill'); if (f) r.color = color(f, th, ph);
    else if (kid(el, 'gradFill')) r.color = fill(el, th, ph);
    var lat = kid(el, 'latin') || kid(el, 'ea') || kid(el, 'cs');
    if (lat && attr(lat, 'typeface')) r.font = th.font(attr(lat, 'typeface'));
    return r;
  }
  function parseText(tb, styles, th, fontColor, fontFace) {
    if (!tb) return null;
    var bp = kid(tb, 'bodyPr'), own = kid(tb, 'lstStyle'), all = [own].concat(styles.lists);
    var paras = [];
    var auto = at(bp, 'normAutofit'), scale = auto ? num(attr(auto, 'fontScale'), 100000) / 100000 : 1, lnRed = auto ? num(attr(auto, 'lnSpcReduction'), 0) / 100000 : 0;
    var n = 0, counters = {};
    kids(tb, 'p').forEach(function (p) {
      var pPr = kid(p, 'pPr'), lvl = num(attr(pPr, 'lvl'), 0), chain = [pPr].concat(lvlPr(all, lvl)).filter(Boolean);
      var mine = [pPr].concat(lvlPr([own], lvl)).filter(Boolean), inherited = lvlPr(styles.lists, lvl);
      var base = {};
      // run defaults, most general first: inherited styles → the shape's style (fontRef) → the shape's own list style / paragraph
      inherited.slice().reverse().forEach(function (c) { Object.assign(base, runProps(kid(c, 'defRPr'), th)); });
      if (fontColor) base.color = fontColor;
      if (fontFace) base.font = fontFace;
      mine.slice().reverse().forEach(function (c) { Object.assign(base, runProps(kid(c, 'defRPr'), th)); });
      var runs = [];
      kids(p).forEach(function (r) {
        if (r.localName === 'r' || r.localName === 'fld') runs.push(Object.assign({}, base, runProps(kid(r, 'rPr'), th), { text: textOf(kid(r, 't')) }));
        else if (r.localName === 'br') runs.push(Object.assign({}, base, { text: '\n' }));
      });
      var align = pick(chain, function (c) { return attr(c, 'algn'); });
      var bu = null;
      var buNone = pick(chain, function (c) { return kid(c, 'buNone') ? true : (kid(c, 'buChar') || kid(c, 'buAutoNum') ? false : null); });
      if (!buNone) {
        var ch = pick(chain, function (c) { var b = kid(c, 'buChar'); return b ? attr(b, 'char') : null; });
        var an = pick(chain, function (c) { var b = kid(c, 'buAutoNum'); return b ? attr(b, 'type') || 'arabicPeriod' : null; });
        var txt = runs.map(function (r) { return r.text; }).join('');
        if (txt.trim()) {
          if (ch) bu = /[-]/.test(ch) ? '•' : ch;       // Wingdings / Symbol glyphs → a plain bullet
          else if (an) { counters[lvl] = (counters[lvl] || 0) + 1; bu = counters[lvl] + (/Paren/.test(an) ? ')' : '.'); }
        }
      }
      var ls = pick(chain, function (c) { var s = at(c, 'lnSpc', 'spcPct'); return s ? num(attr(s, 'val'), 100000) / 100000 : null; });
      paras.push({ align: ALIGN[align] || null, bullet: bu, lvl: lvl, lineSpacing: ls ? ls * (1 - lnRed) : null, runs: runs, empty: runs.every(function (r) { return !String(r.text).trim(); }) });
      n += runs.length;
    });
    if (!paras.length) return null;
    var ins = { l: num(attr(bp, 'lIns'), 91440), t: num(attr(bp, 'tIns'), 45720), r: num(attr(bp, 'rIns'), 91440), b: num(attr(bp, 'bIns'), 45720) };
    var anchor = attr(bp, 'anchor') || styles.anchor || 't';
    return { paras: paras, anchor: anchor, ins: ins, scale: scale, vert: attr(bp, 'vert') || null, wrap: attr(bp, 'wrap') !== 'none' };
  }

  // ---------- one part (slide / layout / master) ----------
  // ctx: { th, part, rels, phs (layout+master placeholders), masterStyles, defStyle, deco }
  function phKey(sp) {
    var ph = at(sp, 'nvSpPr', 'nvPr', 'ph') || at(sp, 'nvPicPr', 'nvPr', 'ph') || at(sp, 'nvGraphicFramePr', 'nvPr', 'ph');
    if (!ph) return null;
    return { type: attr(ph, 'type') || 'body', idx: attr(ph, 'idx') };
  }
  function phList(tree) { // placeholders of a layout / master: [{type, idx, sp}]
    var out = [];
    kids(tree).forEach(function (el) { var k = phKey(el); if (k) out.push({ type: k.type, idx: k.idx, sp: el }); });
    return out;
  }
  function findPh(list, k) {
    if (!list || !k) return null;
    var byIdx = k.idx != null ? list.filter(function (p) { return p.idx === k.idx; })[0] : null;
    if (byIdx) return byIdx;
    var t = k.type === 'ctrTitle' ? ['ctrTitle', 'title'] : k.type === 'subTitle' ? ['subTitle', 'body'] : k.type === 'obj' ? ['obj', 'body'] : [k.type];
    for (var i = 0; i < t.length; i++) { var m = list.filter(function (p) { return p.type === t[i]; })[0]; if (m) return m; }
    return null;
  }
  function styleFor(k, ctx) {
    var ms = ctx.masterStyles || {};
    if (!k) return ms.other;
    return /title/i.test(k.type) || k.type === 'ctrTitle' ? ms.title : /^(body|subTitle|obj)$/.test(k.type) ? ms.body : ms.other;
  }

  Reader.prototype.shapes = function (tree, ctx, grp, out, isDeco) {
    var self = this, th = ctx.th;
    kids(tree).forEach(function (el) {
      var n = el.localName;
      try {
        if (n === 'sp' || n === 'cxnSp') self.shape(el, ctx, grp, out, isDeco);
        else if (n === 'pic') self.pic(el, ctx, grp, out, isDeco);
        else if (n === 'grpSp') {
          var gx = xfrmOf(kid(el, 'grpSpPr'));
          var g2 = gx ? mapBox(grp, gx) : grp;
          if (gx && g2) { g2.ch = gx.ch; }
          self.shapes(el, ctx, g2, out, isDeco);
        } else if (n === 'graphicFrame') self.frame(el, ctx, grp, out);
        else if (n === 'AlternateContent') { var ch = kid(el, 'Choice') || kid(el, 'Fallback'); if (ch) self.shapes(ch, ctx, grp, out, isDeco); }
      } catch (e) { console.warn('pptx item', e); self.skipped.push(n); }
    });
  };
  Reader.prototype.shape = function (el, ctx, grp, out, isDeco) {
    var th = ctx.th, k = phKey(el), pr = kid(el, 'spPr');
    if (isDeco && k) return;   // layout / master placeholders are prompts, not content
    var lay = k ? findPh(ctx.layoutPhs, k) : null, mas = k ? findPh(ctx.masterPhs, k) : null;
    var box = xfrmOf(pr) || (lay && xfrmOf(kid(lay.sp, 'spPr'))) || (mas && xfrmOf(kid(mas.sp, 'spPr')));
    if (!box) return;
    box = mapBox(grp, box);
    var st = kid(el, 'style');
    var fr = at(st, 'fillRef'), lr = at(st, 'lnRef'), fo = at(st, 'fontRef');
    var refFill = fr && num(attr(fr, 'idx'), 0) > 0 ? color(fr, th) : null;
    var f = fill(pr, th, refFill);
    if (f === undefined && lay) f = fill(kid(lay.sp, 'spPr'), th);
    if (f === undefined && mas) f = fill(kid(mas.sp, 'spPr'), th);
    if (f === undefined) f = refFill || null;
    if (f === 'grp') f = ctx.grpFill || null;
    // outline: explicit a:ln wins; otherwise the theme line (style lnRef) when the shape has a style
    var ln = at(pr, 'ln'), stroke = null, lc = null;
    if (!(ln && kid(ln, 'noFill'))) {
      if (ln && (kid(ln, 'solidFill') || kid(ln, 'gradFill'))) lc = kid(ln, 'solidFill') ? color(kid(ln, 'solidFill'), th) : fill(ln, th);
      else if (lr && num(attr(lr, 'idx'), 0) > 0) lc = color(lr, th);
      if (lc && lc.hex) stroke = { hex: lc.hex, a: lc.a, w: ln && attr(ln, 'w') ? num(attr(ln, 'w'), 9525) : 9525 };
    }
    var geom = 'rect', d = null, radius = 0, prst = at(pr, 'prstGeom'), cust = at(pr, 'custGeom');
    var adj = {};
    kids(at(prst, 'avLst'), 'gd').forEach(function (g) { var m = /val\s+(-?\d+)/.exec(attr(g, 'fmla') || ''); if (m) adj[attr(g, 'name')] = +m[1]; });
    if (el.localName === 'cxnSp') geom = 'line';
    else if (cust) { geom = 'path'; d = custPath(cust, box.w, box.h); if (!d) geom = 'rect'; }
    else if (prst) {
      var p = attr(prst, 'prst');
      if (p === 'rect') geom = 'rect';
      else if (p === 'roundRect' || p === 'flowChartAlternateProcess') { geom = 'rect'; radius = Math.min(box.w, box.h) * (adj.adj != null ? adj.adj / 100000 : 0.16667); }
      else if (p === 'ellipse' || p === 'flowChartConnector') geom = 'ellipse';
      else if (p === 'triangle') geom = 'triangle';
      else if (/^(line|straightConnector1|bentConnector\d|curvedConnector\d)$/.test(p)) geom = 'line';
      else { d = presetPath(p, box.w, box.h, adj); geom = d ? 'path' : 'rect'; }
    }
    var fontColor = fo ? color(fo, th) : null, fontFace = fo ? (attr(fo, 'idx') === 'major' ? th.major : th.minor) : null;
    var styles = { lists: [lay && at(lay.sp, 'txBody', 'lstStyle'), mas && at(mas.sp, 'txBody', 'lstStyle'), styleFor(k, ctx), ctx.defStyle],
      anchor: attr(at(lay && lay.sp, 'txBody', 'bodyPr'), 'anchor') || attr(at(mas && mas.sp, 'txBody', 'bodyPr'), 'anchor') };
    var text = parseText(kid(el, 'txBody'), styles, th, fontColor, fontFace);
    if (text && text.paras.every(function (q) { return q.empty; })) text = null;
    // inherit the text box insets from the layout when the slide doesn't set them
    if (text && lay && !attr(at(el, 'txBody', 'bodyPr'), 'lIns')) {
      var lb = at(lay.sp, 'txBody', 'bodyPr');
      if (lb) ['l', 't', 'r', 'b'].forEach(function (s) { var v = attr(lb, s + 'Ins'); if (v != null) text.ins[s] = num(v, text.ins[s]); });
    }
    if (!text && !f && !stroke) return;   // empty placeholder / invisible helper
    if (f && f.img) { out.push({ t: 'image', img: ctx.rels[f.img] && ctx.rels[f.img].target, x: box.x, y: box.y, w: box.w, h: box.h, rot: box.rot, flipH: box.flipH, flipV: box.flipV, crop: null, clip: geom !== 'rect' ? geom : null }); f = null; }
    out.push({ t: 'shape', geom: geom, x: box.x, y: box.y, w: box.w, h: box.h, rot: box.rot, flipH: box.flipH, flipV: box.flipV,
      fill: f, stroke: stroke, radius: radius, d: d, text: text, name: attr(at(el, 'nvSpPr', 'cNvPr') || at(el, 'nvCxnSpPr', 'cNvPr'), 'name') || '' });
  };
  Reader.prototype.pic = function (el, ctx, grp, out, isDeco) {
    var k = phKey(el);
    var box = xfrmOf(kid(el, 'spPr'));
    if (!box && k) { var lay = findPh(ctx.layoutPhs, k) || findPh(ctx.masterPhs, k); box = lay && xfrmOf(kid(lay.sp, 'spPr')); }
    if (!box) return;
    box = mapBox(grp, box);
    var bf = kid(el, 'blipFill'), bl = kid(bf, 'blip'), id = attr(bl, 'r:embed') || attr(bl, 'embed');
    // prefer an SVG version when PowerPoint stored one
    var svg = first(bl, 'svgBlip'), sid = svg && (attr(svg, 'r:embed') || attr(svg, 'embed'));
    var rel = ctx.rels[sid] || ctx.rels[id];
    if (!rel || !rel.target) return;
    var sr = kid(bf, 'srcRect'), crop = sr ? { l: num(attr(sr, 'l'), 0) / 1e5, t: num(attr(sr, 't'), 0) / 1e5, r: num(attr(sr, 'r'), 0) / 1e5, b: num(attr(sr, 'b'), 0) / 1e5 } : null;
    var prst = attr(at(kid(el, 'spPr'), 'prstGeom'), 'prst');
    out.push({ t: 'image', img: rel.target, x: box.x, y: box.y, w: box.w, h: box.h, rot: box.rot, flipH: box.flipH, flipV: box.flipV, crop: crop,
      clip: prst === 'ellipse' ? 'ellipse' : prst === 'roundRect' ? 'roundRect' : null, name: attr(at(el, 'nvPicPr', 'cNvPr'), 'name') || '' });
  };
  Reader.prototype.frame = function (el, ctx, grp, out) {
    var self = this, box = xfrmOf(el);   // a graphic frame keeps its p:xfrm directly
    if (!box) return;
    box = mapBox(grp, box);
    var gd = at(el, 'graphic', 'graphicData'), uri = attr(gd, 'uri') || '';
    if (/table$/.test(uri)) {
      var tbl = kid(gd, 'tbl'); if (!tbl) return;
      var tp = kid(tbl, 'tblPr'), rows = [], fs = null, fillHead = null;
      kids(tbl, 'tr').forEach(function (tr, ri) {
        var row = [];
        kids(tr, 'tc').forEach(function (tc) {
          if (attr(tc, 'hMerge') === '1' || attr(tc, 'vMerge') === '1') { row.push(''); return; }
          var tb = kid(tc, 'txBody'), s = kids(tb, 'p').map(function (p) { return kids(p).filter(function (r) { return r.localName === 'r' || r.localName === 'fld'; }).map(function (r) { return textOf(kid(r, 't')); }).join(''); }).join('\n');
          var sz = first(tb, 'rPr'); if (fs == null && sz && attr(sz, 'sz')) fs = num(attr(sz, 'sz'), 1800) / 100;
          if (ri === 0 && fillHead == null) fillHead = color(at(tc, 'tcPr', 'solidFill'), ctx.th);
          row.push(s);
        });
        rows.push(row);
      });
      if (!rows.length) return;
      out.push({ t: 'table', x: box.x, y: box.y, w: box.w, h: box.h, model: { rows: rows, header: attr(tp, 'firstRow') === '1' || !!fillHead, zebra: attr(tp, 'bandRow') === '1', style: 0, fs: fs || 18, headColor: fillHead && fillHead.hex } });
    } else if (/chart$/.test(uri)) {
      var c = kid(gd, 'chart'), rid = attr(c, 'r:id') || attr(c, 'id'), rel = ctx.rels[rid];
      if (rel && rel.target) out.push({ t: 'chart', x: box.x, y: box.y, w: box.w, h: box.h, part: rel.target });
    } else if (/diagram$/.test(uri)) {
      // SmartArt: PowerPoint keeps a ready-made drawing of it (dsp:…) next to the data
      var dm = first(gd, 'relIds'), drawing = null;
      for (var key in ctx.rels) if (/diagramDrawing$/.test(ctx.rels[key].type)) { drawing = ctx.rels[key].target; }
      if (dm && drawing) out.push({ t: 'smartart', x: box.x, y: box.y, w: box.w, h: box.h, part: drawing });
      else self.skipped.push('SmartArt');
    } else if (/ole$|oleObject/.test(uri)) {
      self.skipped.push('OLE');
    }
  };
  // charts: read the cached data of the first plot into the kit's chart model
  Reader.prototype.chart = function (part) {
    return this.xml(part).then(function (doc) {
      if (!doc) return null;
      var pa = first(doc, 'plotArea'); if (!pa) return null;
      var kinds = ['barChart', 'bar3DChart', 'lineChart', 'line3DChart', 'areaChart', 'area3DChart', 'pieChart', 'pie3DChart', 'doughnutChart'];
      var el = null; kids(pa).some(function (c) { if (kinds.indexOf(c.localName) >= 0) { el = c; return true; } return false; });
      if (!el) return null;
      var n = el.localName, type = 'col';
      if (/^bar/.test(n)) { var dir = attr(kid(el, 'barDir'), 'val'), grp = attr(kid(el, 'grouping'), 'val') || ''; type = /stacked/i.test(grp) ? 'stack' : dir === 'bar' ? 'bar' : 'col'; }
      else if (/^line/.test(n)) type = 'line'; else if (/^area/.test(n)) type = 'area'; else if (/^pie/.test(n)) type = 'pie'; else if (n === 'doughnutChart') type = 'donut';
      var cache = function (ref) {
        var c = first(ref, 'strCache') || first(ref, 'numCache') || first(ref, 'strLit') || first(ref, 'numLit');
        var ml = !c && first(ref, 'multiLvlStrCache');
        if (ml) { var lv = kids(ml, 'lvl'); c = lv[0] || ml; }   // multi-level categories: the innermost level
        if (!c) return [];
        var pts = kids(c, 'pt'), outv = [];
        pts.forEach(function (p) { outv[num(attr(p, 'idx'), outv.length)] = textOf(kid(p, 'v')); });
        return outv;
      };
      var labels = [], series = [];
      kids(el, 'ser').forEach(function (s) {
        var nm = kid(s, 'tx'), name = nm ? (cache(nm)[0] || textOf(first(nm, 'v'))) : 'Цуврал ' + (series.length + 1);
        if (!labels.length) labels = cache(kid(s, 'cat'));
        var vals = cache(kid(s, 'val')).map(function (v) { return num(v, 0); });
        series.push({ name: name || 'Цуврал ' + (series.length + 1), values: vals });
      });
      if (!series.length) return null;
      var len = Math.max.apply(null, series.map(function (s) { return s.values.length; }));
      for (var i = 0; i < len; i++) if (labels[i] == null) labels[i] = String(i + 1);
      var tt = first(doc, 'title'), title = tt ? Array.prototype.map.call(tt.getElementsByTagNameNS('*', 't'), textOf).join('') : '';
      if (!title && (type === 'pie' || type === 'donut') && series.length === 1) title = series[0].name;
      if (type === 'pie' || type === 'donut') series = series.slice(0, 1);
      return { type: type, title: title, labels: labels.slice(0, len), series: series, pal: 0, legend: !!first(doc, 'legend'), values: !!first(el, 'showVal') && attr(first(el, 'showVal'), 'val') === '1', grid: !!first(doc, 'majorGridlines') };
    });
  };
  // SmartArt drawing part → plain shapes, offset into the graphic frame
  Reader.prototype.smartart = function (it, ctx) {
    var self = this;
    return Promise.all([this.xml(it.part), this.rels(it.part)]).then(function (r) {
      var doc = r[0]; if (!doc) return [];
      var tree = first(doc, 'spTree'); if (!tree) return [];
      var out = [], c2 = Object.assign({}, ctx, { rels: r[1] });
      self.shapes(tree, c2, { x: it.x, y: it.y, w: 1, h: 1, rot: 0, ch: { x: 0, y: 0, w: 1, h: 1 } }, out, false);
      return out;
    });
  };

  Reader.prototype.bg = function (cSld, ctx) {
    var bg = kid(cSld, 'bg'); if (!bg) return null;
    var bp = kid(bg, 'bgPr');
    if (bp) {
      var f = fill(bp, ctx.th);
      if (f && f.img) return { img: ctx.rels[f.img] && ctx.rels[f.img].target };
      if (f && f.hex) return { color: f.hex, grad: f.grad || null, ang: f.ang || 0 };
      return f === null ? { color: '#ffffff' } : null;
    }
    var br = kid(bg, 'bgRef');
    if (br) {
      var c = color(br, ctx.th), idx = num(attr(br, 'idx'), 0);
      // idx ≥ 1001: the theme's background fill list (bgFillStyleLst) — colour placeholder filled with this colour
      if (c) return { color: c.hex };
      if (idx) return { color: '#ffffff' };
    }
    return null;
  };

  Reader.prototype.parse = function (name) {
    var self = this;
    return this.xml('ppt/presentation.xml').then(function (pres) {
      if (!pres) throw new Error('Энэ файл PowerPoint (.pptx) биш байна');
      var root = pres.documentElement, sz = kid(root, 'sldSz');
      var W = num(attr(sz, 'cx'), 12192000), H = num(attr(sz, 'cy'), 6858000);
      var defStyle = kid(root, 'defaultTextStyle');
      return self.rels('ppt/presentation.xml').then(function (prels) {
        var ids = kids(kid(root, 'sldIdLst'), 'sldId').map(function (s) { return attr(s, 'r:id') || attr(s, 'id'); });
        var paths = ids.map(function (id) { return prels[id] && prels[id].target; }).filter(Boolean);
        var masters = {}, layouts = {};
        function master(p) {
          if (!masters[p]) masters[p] = Promise.all([self.xml(p), self.rels(p)]).then(function (r) {
            var doc = r[0], rels = r[1], mroot = doc && doc.documentElement, cm = {};
            var map = kid(mroot, 'clrMap'); if (map) for (var i = 0; i < map.attributes.length; i++) cm[map.attributes[i].name] = map.attributes[i].value;
            return self.xml(relOfType(rels, '/theme')).then(function (td) {
              var th = new Theme(td, cm), cSld = kid(mroot, 'cSld'), tx = kid(mroot, 'txStyles');
              var ctx = { th: th, rels: rels, masterPhs: phList(kid(cSld, 'spTree')), layoutPhs: [], masterStyles: { title: kid(tx, 'titleStyle'), body: kid(tx, 'bodyStyle'), other: kid(tx, 'otherStyle') }, defStyle: defStyle };
              ctx.bg = self.bg(cSld, ctx);
              var deco = []; self.shapes(kid(cSld, 'spTree'), ctx, null, deco, true);
              return { ctx: ctx, deco: deco };
            });
          });
          return masters[p];
        }
        function layout(p) {
          if (!layouts[p]) layouts[p] = Promise.all([self.xml(p), self.rels(p)]).then(function (r) {
            var doc = r[0], rels = r[1], lroot = doc && doc.documentElement;
            return master(relOfType(rels, '/slideMaster')).then(function (m) {
              var cSld = kid(lroot, 'cSld'), ctx = Object.assign({}, m.ctx, { rels: rels, layoutPhs: phList(kid(cSld, 'spTree')) });
              var deco = []; self.shapes(kid(cSld, 'spTree'), ctx, null, deco, true);
              var showM = attr(lroot, 'showMasterSp') !== '0';
              return { m: m, ctx: ctx, bg: self.bg(cSld, ctx) || m.ctx.bg, deco: (showM ? m.deco : []).concat(deco) };
            });
          });
          return layouts[p];
        }
        return paths.reduce(function (pr, sp) {
          return pr.then(function (list) {
            return Promise.all([self.xml(sp), self.rels(sp)]).then(function (r) {
              var doc = r[0], rels = r[1]; if (!doc) return list;
              var sroot = doc.documentElement, cSld = kid(sroot, 'cSld');
              return layout(relOfType(rels, '/slideLayout')).then(function (L) {
                var ctx = Object.assign({}, L.ctx, { rels: rels });
                var items = []; self.shapes(kid(cSld, 'spTree'), ctx, null, items, false);
                var deco = attr(sroot, 'showMasterSp') === '0' ? [] : L.deco;
                var slide = { bg: self.bg(cSld, ctx) || L.bg || { color: '#ffffff' }, deco: deco, items: items, hidden: attr(sroot, 'show') === '0', rels: rels, notes: '' };
                // extra parts: charts, SmartArt drawings, speaker notes
                var jobs = items.map(function (it, i) {
                  if (it.t === 'chart') return self.chart(it.part).then(function (m) { if (m) it.model = m; else { items[i] = null; self.skipped.push('chart'); } });
                  if (it.t === 'smartart') return self.smartart(it, ctx).then(function (sh) { items[i] = sh; });
                  return null;
                });
                var np = relOfType(rels, '/notesSlide');
                if (np) jobs.push(self.xml(np).then(function (nd) {
                  if (!nd) return;
                  var body = null;
                  kids(first(nd, 'spTree'), 'sp').forEach(function (s) { var k = phKey(s); if (k && k.type === 'body') body = s; });
                  if (body) slide.notes = kids(kid(body, 'txBody'), 'p').map(function (p) { return textOf(p).trim(); }).filter(Boolean).join('\n');
                }));
                return Promise.all(jobs).then(function () {
                  slide.items = [].concat.apply([], items.filter(Boolean).map(function (x) { return Array.isArray(x) ? x : [x]; }));
                  list.push(slide); return list;
                });
              });
            });
          });
        }, Promise.resolve([])).then(function (slides) {
          var fonts = {};
          slides.forEach(function (s) { s.deco.concat(s.items).forEach(function (it) { if (it.text) it.text.paras.forEach(function (p) { p.runs.forEach(function (r) { if (r.font) fonts[r.font] = 1; }); }); }); });
          return { w: W, h: H, name: name, slides: slides, fonts: Object.keys(fonts), skipped: self.skipped };
        });
      });
    });
  };

  // image bytes of a zip path → Blob (null for formats a browser can't show: EMF / WMF / TIFF)
  Reader.prototype.image = function (p) {
    var f = p && this.zip.file(p); if (!f) return Promise.resolve(null);
    var ext = (p.split('.').pop() || '').toLowerCase();
    var type = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', bmp: 'image/bmp' }[ext];
    if (!type) { this.skipped.push(ext.toUpperCase() + ' зураг'); return Promise.resolve(null); }
    return f.async('uint8array').then(function (b) { return new Blob([b], { type: type }); });
  };

  window.GPptx = {
    parse: function (buf, name) {
      if (!window.JSZip) return Promise.reject(new Error('JSZip'));
      return window.JSZip.loadAsync(buf).then(function (zip) {
        if (!zip.file('ppt/presentation.xml')) throw new Error('Энэ файл PowerPoint (.pptx) биш байна');
        var r = new Reader(zip);
        return r.parse(name).then(function (deck) { deck.reader = r; return deck; });
      });
    }
  };
})();
