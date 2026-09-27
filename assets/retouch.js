/*
  Graphican — face retouch, entirely in the browser (the photo never leaves the device).
  Faces: MediaPipe Face Landmarker (Apache-2.0; runtime from jsDelivr, model self-hosted in /assets/vendor/face/).
  Everything else is plain pixel math on the face region:
    skin smoothing (edge-preserving guided filter + a little original pore texture), blemish removal (local dark / red spots
    filled from their surroundings), skin brightening, eye clarity, teeth whitening, face slimming + bigger eyes (local warps)
    and a manual spot-healing brush.
  GRetouch.open(img, { el, src, params, toast, onApply(url, params) })  — img is the fabric.Image, el its original element.
*/
(function () {
  'use strict';
  if (window.GRetouch) return;

  var TV = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/';
  var MODEL = '/assets/vendor/face/face_landmarker.task';

  // ---------------- landmarks ----------------
  var lmP = null;
  function landmarker() {
    if (lmP) return lmP;
    lmP = import(TV + 'vision_bundle.mjs').then(function (v) {
      return v.FilesetResolver.forVisionTasks(TV + 'wasm').then(function (fs) {
        return v.FaceLandmarker.createFromOptions(fs, {
          baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' }, runningMode: 'IMAGE', numFaces: 8,
          minFaceDetectionConfidence: 0.35, minFacePresenceConfidence: 0.35
        });
      });
    });
    lmP.catch(function () { lmP = null; });
    return lmP;
  }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

  // finds faces on the whole image first; if none (small faces in a wide shot) it also searches overlapping tiles
  function detect(el, W, H) {
    return landmarker().then(function (lm) {
      function run(sx, sy, sw, sh) {
        var k = Math.min(1, 1280 / Math.max(sw, sh)), c = mk(Math.round(sw * k), Math.round(sh * k));
        var x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(el, sx, sy, sw, sh, 0, 0, c.width, c.height);
        var r = lm.detect(c);
        return (r.faceLandmarks || []).map(function (pts) { return pts.map(function (p) { return { x: sx + p.x * sw, y: sy + p.y * sh }; }); });
      }
      var faces = run(0, 0, W, H);
      if (!faces.length && Math.max(W, H) > 900) {
        var t = Math.max(W, H) * 0.55, tiles = [];
        for (var yy = 0; yy <= 1; yy += 0.5) for (var xx = 0; xx <= 1; xx += 0.5) tiles.push([xx * (W - Math.min(t, W)), yy * (H - Math.min(t, H)), Math.min(t, W), Math.min(t, H)]);
        tiles.forEach(function (tl) {
          run(tl[0], tl[1], tl[2], tl[3]).forEach(function (f) {
            var c = f[1], dup = faces.some(function (g) { return Math.hypot(g[1].x - c.x, g[1].y - c.y) < dist(f, 234, 454) * 0.5; });
            if (!dup) faces.push(f);
          });
        });
      }
      return faces;
    });
  }
  function dist(f, a, b) { return Math.hypot(f[a].x - f[b].x, f[a].y - f[b].y); }

  // MediaPipe face-mesh index sets
  var OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
  var EYE_R = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
  var EYE_L = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249];
  var BROW_R = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
  var BROW_L = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
  var LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
  var MOUTH = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];
  var NOSTRIL = [98, 327, 2, 97, 326, 64, 294, 60, 290];
  var JAW_R = [234, 93, 132, 58, 172, 136, 150, 149, 176, 148];
  var JAW_L = [454, 323, 361, 288, 397, 365, 379, 378, 400, 377];
  var CHEEKS = [50, 280, 101, 330, 205, 425, 151, 9, 108, 337];

  function geom(f) {
    var xs = OVAL.map(function (i) { return f[i].x; }), ys = OVAL.map(function (i) { return f[i].y; });
    var fw = dist(f, 234, 454), c = function (idx) { var x = 0, y = 0; idx.forEach(function (i) { x += f[i].x; y += f[i].y; }); return { x: x / idx.length, y: y / idx.length }; };
    return {
      pts: f, fw: fw,
      x0: Math.min.apply(null, xs), y0: Math.min.apply(null, ys), x1: Math.max.apply(null, xs), y1: Math.max.apply(null, ys),
      eyeR: f.length > 470 ? f[468] : c(EYE_R), eyeL: f.length > 475 ? f[473] : c(EYE_L),
      eyeRc: c(EYE_R), eyeLc: c(EYE_L), ewR: dist(f, 33, 133), ewL: dist(f, 263, 362)
    };
  }

  // ---------------- pixel helpers ----------------
  // separable box blur on a Float32 plane (edge-clamped running sums), O(n) for any radius
  function box(src, w, h, r, out) {
    out = out || new Float32Array(w * h);
    if (r < 1) { out.set(src); return out; }
    var tmp = new Float32Array(w * h), x, y, i, acc, n = 2 * r + 1, row;
    for (y = 0; y < h; y++) {
      row = y * w; acc = src[row] * (r + 1);
      for (x = 1; x <= r; x++) acc += src[row + Math.min(x, w - 1)];
      for (x = 0; x < w; x++) {
        tmp[row + x] = acc / n;
        acc += src[row + Math.min(x + r + 1, w - 1)] - src[row + Math.max(x - r, 0)];
      }
    }
    for (x = 0; x < w; x++) {
      acc = tmp[x] * (r + 1);
      for (y = 1; y <= r; y++) acc += tmp[Math.min(y, h - 1) * w + x];
      for (y = 0; y < h; y++) {
        out[y * w + x] = acc / n;
        acc += tmp[Math.min(y + r + 1, h - 1) * w + x] - tmp[Math.max(y - r, 0) * w + x];
      }
    }
    return out;
  }
  function blur3(p, w, h, r) { var a = box(p, w, h, r), b = box(a, w, h, r); return box(b, w, h, r, a); }
  // self-guided filter: edge-preserving smoothing (He et al.)
  function guided(p, w, h, r, eps) {
    var n = w * h, pp = new Float32Array(n), i;
    for (i = 0; i < n; i++) pp[i] = p[i] * p[i];
    var m = box(p, w, h, r), m2 = box(pp, w, h, r), a = pp, b = new Float32Array(n);
    for (i = 0; i < n; i++) { var v = m2[i] - m[i] * m[i]; if (v < 0) v = 0; a[i] = v / (v + eps); b[i] = m[i] - a[i] * m[i]; }
    var ma = box(a, w, h, r, m2), mb = box(b, w, h, r, m);
    for (i = 0; i < n; i++) b[i] = ma[i] * p[i] + mb[i];
    return b;
  }
  function polyMask(w, h, list, ox, oy, s) {
    // list: [{pts, mode:'add'|'cut', grow}] → Float32 0..1
    var c = mk(w, h), x = c.getContext('2d');
    list.forEach(function (it) {
      var P = it.pts, cx = 0, cy = 0; P.forEach(function (p) { cx += p.x; cy += p.y; }); cx /= P.length; cy /= P.length;
      var g = it.grow || 1;
      x.globalCompositeOperation = it.mode === 'cut' ? 'destination-out' : 'source-over';
      x.fillStyle = '#fff'; x.beginPath();
      if (it.circle) x.arc((it.circle.x - ox) * s, (it.circle.y - oy) * s, it.circle.r * s, 0, Math.PI * 2);
      else P.forEach(function (p, k) { var px = ((cx + (p.x - cx) * g) - ox) * s, py = ((cy + (p.y - cy) * g) - oy) * s; if (k) x.lineTo(px, py); else x.moveTo(px, py); });
      x.closePath(); x.fill();
    });
    var d = x.getImageData(0, 0, w, h).data, out = new Float32Array(w * h);
    for (var i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] / 255;
    return out;
  }
  function sel(f, idx) { return idx.map(function (i) { return f[i]; }); }

  // ---------------- processing model ----------------
  // Region (full-image px) holding every face + margin; processed at scale s (≤ ~2.6 MP).
  function Model(el, W, H, faces) {
    this.el = el; this.W = W; this.H = H; this.faces = faces.map(geom);
    var G = this.faces;
    if (G.length) {
      var fwm = G.map(function (g) { return g.fw; }).sort(function (a, b) { return a - b; })[G.length >> 1];
      var m = fwm * 0.45, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      G.forEach(function (g) { x0 = Math.min(x0, g.x0 - m); y0 = Math.min(y0, g.y0 - m); x1 = Math.max(x1, g.x1 + m); y1 = Math.max(y1, g.y1 + m); });
      this.rx = Math.max(0, Math.floor(x0)); this.ry = Math.max(0, Math.floor(y0));
      this.rw = Math.min(W, Math.ceil(x1)) - this.rx; this.rh = Math.min(H, Math.ceil(y1)) - this.ry;
      this.fwm = fwm;
    } else { this.rx = 0; this.ry = 0; this.rw = W; this.rh = H; this.fwm = Math.min(W, H) * 0.4; }
    var s = Math.min(1, 2000 / Math.max(this.rw, this.rh), Math.sqrt(2.6e6 / (this.rw * this.rh)));
    this.s = s; this.w = Math.max(1, Math.round(this.rw * s)); this.h = Math.max(1, Math.round(this.rh * s));
    var c = mk(this.w, this.h), x = c.getContext('2d', { willReadFrequently: true });
    x.imageSmoothingQuality = 'high'; x.drawImage(el, this.rx, this.ry, this.rw, this.rh, 0, 0, this.w, this.h);
    this.src = x.getImageData(0, 0, this.w, this.h);
    this.out = x.createImageData(this.w, this.h);
    this.tone = x.createImageData(this.w, this.h);
    this.canvas = c; this.ctx = x;
    this.prepared = false;
  }
  Model.prototype.prepare = function () {
    if (this.prepared) return; this.prepared = true;
    var w = this.w, h = this.h, n = w * h, s = this.s, ox = this.rx, oy = this.ry, sd = this.src.data, i, k;
    this.n = n;
    if (!this.faces.length) return;
    var fw = this.fwm * s;
    var R = new Float32Array(n), Gc = new Float32Array(n), B = new Float32Array(n), L = new Float32Array(n), Cr = new Float32Array(n);
    for (i = 0; i < n; i++) { k = i * 4; R[i] = sd[k]; Gc[i] = sd[k + 1]; B[i] = sd[k + 2]; L[i] = 0.299 * sd[k] + 0.587 * sd[k + 1] + 0.114 * sd[k + 2]; Cr[i] = 0.5 * sd[k] - 0.4187 * sd[k + 1] - 0.0813 * sd[k + 2]; }

    // --- skin mask: face oval minus eyes / brows / lips, refined by each face's own skin colour
    var skin = new Float32Array(n), eye = new Float32Array(n), iris = new Float32Array(n), mouth = new Float32Array(n), nost = new Float32Array(n);
    this.faces.forEach(function (g) {
      var f = g.pts;
      var oval = polyMask(w, h, [{ pts: sel(f, OVAL), grow: 1.02 }], ox, oy, s);
      var hard = polyMask(w, h, [{ pts: sel(f, OVAL), grow: 0.97 }, { pts: sel(f, EYE_R), mode: 'cut', grow: 1.9 }, { pts: sel(f, EYE_L), mode: 'cut', grow: 1.9 },
        { pts: sel(f, BROW_R), mode: 'cut', grow: 1.35 }, { pts: sel(f, BROW_L), mode: 'cut', grow: 1.35 }, { pts: sel(f, LIPS), mode: 'cut', grow: 1.12 }], ox, oy, s);
      // skin colour stats from cheeks / forehead
      var crs = [], cbs = [], ls = [];
      CHEEKS.forEach(function (ci) {
        var px = Math.round((f[ci].x - ox) * s), py = Math.round((f[ci].y - oy) * s), rr = Math.max(2, Math.round(g.fw * s * 0.03));
        for (var yy = py - rr; yy <= py + rr; yy += Math.max(1, rr >> 2)) for (var xx = px - rr; xx <= px + rr; xx += Math.max(1, rr >> 2)) {
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          var q = (yy * w + xx) * 4; crs.push(0.5 * sd[q] - 0.4187 * sd[q + 1] - 0.0813 * sd[q + 2]); cbs.push(-0.1687 * sd[q] - 0.3313 * sd[q + 1] + 0.5 * sd[q + 2]); ls.push(0.299 * sd[q] + 0.587 * sd[q + 1] + 0.114 * sd[q + 2]);
        }
      });
      function med(a) { a.sort(function (p, q) { return p - q; }); return a.length ? a[a.length >> 1] : 0; }
      function mad(a, m) { return med(a.map(function (v) { return Math.abs(v - m); })); }
      var mcr = med(crs.slice()), mcb = med(cbs.slice()), ml = med(ls.slice());
      var scr = Math.max(4, mad(crs, mcr) * 1.48 * 2.6), scb = Math.max(4, mad(cbs, mcb) * 1.48 * 2.6);
      for (var j = 0; j < n; j++) {
        if (oval[j] <= 0) continue;
        var q2 = j * 4, cr = Cr[j], cb = -0.1687 * sd[q2] - 0.3313 * sd[q2 + 1] + 0.5 * sd[q2 + 2];
        var dcr = (cr - mcr) / scr, dcb = (cb - mcb) / scb, dd = dcr * dcr + dcb * dcb;
        var like = dd < 1 ? 1 : Math.exp(-(dd - 1) * 0.9);
        var lum = L[j] < ml * 0.35 ? L[j] / (ml * 0.35) : 1;       // deep shadows / hair
        var v = hard[j] * like * lum;
        if (v > skin[j]) skin[j] = v;
      }
      var eyes = polyMask(w, h, [{ pts: sel(f, EYE_R), grow: 1.12 }, { pts: sel(f, EYE_L), grow: 1.12 }], ox, oy, s);
      var ir = polyMask(w, h, [{ pts: [], circle: { x: g.eyeR.x, y: g.eyeR.y, r: g.ewR * 0.24 } }, { pts: [], circle: { x: g.eyeL.x, y: g.eyeL.y, r: g.ewL * 0.24 } }], ox, oy, s);
      var mo = polyMask(w, h, [{ pts: sel(f, MOUTH), grow: 1.0 }], ox, oy, s);
      var no = polyMask(w, h, NOSTRIL.map(function (ni) { return { pts: [], circle: { x: f[ni].x, y: f[ni].y, r: g.fw * 0.055 } }; }), ox, oy, s);
      for (j = 0; j < n; j++) { if (eyes[j] > eye[j]) eye[j] = eyes[j]; if (ir[j] > iris[j]) iris[j] = ir[j] * eyes[j]; if (mo[j] > mouth[j]) mouth[j] = mo[j]; if (no[j] > nost[j]) nost[j] = no[j]; }
    });
    skin = blur3(skin, w, h, Math.max(1, Math.round(fw * 0.012)));
    eye = blur3(eye, w, h, Math.max(1, Math.round(fw * 0.006)));
    iris = blur3(iris, w, h, Math.max(1, Math.round(fw * 0.004)));
    mouth = blur3(mouth, w, h, Math.max(1, Math.round(fw * 0.004)));
    nost = blur3(nost, w, h, Math.max(1, Math.round(fw * 0.01)));

    // --- blemishes: small dark or red bumps compared with their neighbourhood
    var rb = Math.max(3, Math.round(fw * 0.028));
    var Lb = box(L, w, h, rb), Crb = box(Cr, w, h, rb), spot = new Float32Array(n);
    for (i = 0; i < n; i++) {
      var dark = smooth(3.5, 13, Lb[i] - L[i]), red = smooth(2.5, 8, Cr[i] - Crb[i]) * 0.85;
      spot[i] = Math.max(dark, red) * skin[i] * (1 - nost[i]);
    }
    spot = blur3(spot, w, h, Math.max(1, Math.round(rb / 4)));
    for (i = 0; i < n; i++) spot[i] = Math.min(1, spot[i] * 1.8);
    // fill = neighbourhood average that ignores the spot pixels themselves
    var wgt = new Float32Array(n), tR = new Float32Array(n), tG = new Float32Array(n), tB = new Float32Array(n);
    for (i = 0; i < n; i++) { var ww = 1 - spot[i]; ww = ww * ww; wgt[i] = ww; tR[i] = R[i] * ww; tG[i] = Gc[i] * ww; tB[i] = B[i] * ww; }
    var rf = Math.round(rb * 1.4), bw = box(wgt, w, h, rf), fR = box(tR, w, h, rf), fG = box(tG, w, h, rf), fB = box(tB, w, h, rf);
    for (i = 0; i < n; i++) { var d = bw[i] > 1e-3 ? 1 / bw[i] : 0; fR[i] = d ? fR[i] * d : R[i]; fG[i] = d ? fG[i] * d : Gc[i]; fB[i] = d ? fB[i] * d : B[i]; }

    // --- smoothing on the blemish-free image, then a bit of the original fine texture (pores) back
    var S1R = new Float32Array(n), S1G = new Float32Array(n), S1B = new Float32Array(n);
    for (i = 0; i < n; i++) { var sp = spot[i]; S1R[i] = R[i] + (fR[i] - R[i]) * sp; S1G[i] = Gc[i] + (fG[i] - Gc[i]) * sp; S1B[i] = B[i] + (fB[i] - B[i]) * sp; }
    var rg = Math.max(2, Math.round(fw * 0.024)), eps = 15 * 15;
    var gR = guided(S1R, w, h, rg, eps), gG = guided(S1G, w, h, rg, eps), gB = guided(S1B, w, h, rg, eps);
    var rt = Math.max(1, Math.round(fw * 0.0035)), dR = box(R, w, h, rt), dG = box(Gc, w, h, rt), dB = box(B, w, h, rt);
    var keep = 0.45;
    var U = function () { return new Uint8ClampedArray(n); };
    this.sR = U(); this.sG = U(); this.sB = U(); this.fR = U(); this.fG = U(); this.fB = U(); this.eR = U(); this.eG = U(); this.eB = U();
    for (i = 0; i < n; i++) {
      this.sR[i] = gR[i] + (R[i] - dR[i]) * keep; this.sG[i] = gG[i] + (Gc[i] - dG[i]) * keep; this.sB[i] = gB[i] + (B[i] - dB[i]) * keep;
      this.fR[i] = fR[i]; this.fG[i] = fG[i]; this.fB[i] = fB[i];
    }
    // eye detail layer (blur for unsharp masking)
    var re = Math.max(1, Math.round(fw * 0.006)), eR = box(R, w, h, re), eG = box(Gc, w, h, re), eB = box(B, w, h, re);
    for (i = 0; i < n; i++) { this.eR[i] = eR[i]; this.eG[i] = eG[i]; this.eB[i] = eB[i]; }
    var Q = function (a) { var o = new Uint8Array(n); for (var j = 0; j < n; j++) o[j] = clamp(Math.round(a[j] * 255), 0, 255); return o; };
    this.mSkin = Q(skin); this.mSpot = Q(spot); this.mEye = Q(eye); this.mIris = Q(iris); this.mMouth = Q(mouth);
  };

  // tone stage (+ healing spots) into this.tone
  Model.prototype.toneStage = function (p, spots) {
    var n = this.w * this.h, sd = this.src.data, td = this.tone.data, i, k;
    if (!this.faces.length || (!p.smooth && !p.blem && !p.bright && !p.eyes && !p.teeth)) td.set(sd);
    else {
      var sm = p.smooth || 0, bl = p.blem || 0, br = p.bright || 0, ey = p.eyes || 0, te = p.teeth || 0;
      var mS = this.mSkin, mP = this.mSpot, mE = this.mEye, mI = this.mIris, mM = this.mMouth;
      for (i = 0; i < n; i++) {
        k = i * 4;
        var r = sd[k], g = sd[k + 1], b = sd[k + 2];
        var ms = mS[i], me = mE[i], mm = mM[i];
        if (!(ms | me | mm)) { td[k] = r; td[k + 1] = g; td[k + 2] = b; td[k + 3] = sd[k + 3]; continue; }
        if (bl && mP[i]) { var a1 = mP[i] / 255 * bl; r += (this.fR[i] - r) * a1; g += (this.fG[i] - g) * a1; b += (this.fB[i] - b) * a1; }
        if (ms) {
          var m = ms / 255;
          if (sm) { var a2 = m * sm; r += (this.sR[i] - r) * a2; g += (this.sG[i] - g) * a2; b += (this.sB[i] - b) * a2; }
          if (br) {
            var a3 = m * br, y0 = 0.299 * r + 0.587 * g + 0.114 * b, lift = (255 - y0) * 0.16 * a3;
            r += lift - (r - y0) * 0.10 * a3; g += lift - (g - y0) * 0.05 * a3; b += lift;   // brighter, slightly less red
          }
        }
        if (ey && me) {
          var a4 = me / 255 * ey, ai = mI[i] / 255 * ey;
          var sh = 1.1 * a4 + 0.9 * ai;
          r += (r - this.eR[i]) * sh; g += (g - this.eG[i]) * sh; b += (b - this.eB[i]) * sh;
          var y1 = 0.299 * r + 0.587 * g + 0.114 * b, wh = smooth(95, 170, y1) * (1 - mI[i] / 255);
          r = y1 + (r - y1) * (1 - 0.55 * a4 * wh); g = y1 + (g - y1) * (1 - 0.35 * a4 * wh); b = y1 + (b - y1) * (1 - 0.25 * a4 * wh);   // whiter sclera
          var up = 0.07 * a4 + 0.05 * ai; r += (255 - r) * up; g += (255 - g) * up; b += (255 - b) * up;
        }
        if (te && mm) {
          var yT = 0.299 * r + 0.587 * g + 0.114 * b, mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
          var tw = mm / 255 * te * smooth(60, 125, yT) * (1 - smooth(0.42, 0.7, sat));
          if (tw > 0) {
            var cb = -0.1687 * r - 0.3313 * g + 0.5 * b, cr = 0.5 * r - 0.4187 * g - 0.0813 * b;
            var ny = yT + 20 * tw, ncb = cb + (2 - cb) * 0.8 * tw, ncr = cr * (1 - 0.6 * tw);   // less yellow (Cb up), less red, brighter
            r = ny + 1.402 * ncr; g = ny - 0.344136 * ncb - 0.714136 * ncr; b = ny + 1.772 * ncb;
          }
        }
        td[k] = r; td[k + 1] = g; td[k + 2] = b; td[k + 3] = sd[k + 3];
      }
    }
    var self = this;
    (spots || []).forEach(function (sp) { heal(td, self.w, self.h, (sp.x - self.rx) * self.s, (sp.y - self.ry) * self.s, sp.r * self.s); });
  };

  // spot healing: copy the best-matching nearby patch, colour-corrected to the surrounding ring, feathered in
  function heal(d, w, h, cx, cy, r) {
    r = Math.max(2, r);
    if (cx < -r || cy < -r || cx > w + r || cy > h + r) return;
    var ring = [], K = 36, a, j;
    for (j = 0; j < K; j++) { a = j / K * Math.PI * 2; ring.push([Math.cos(a), Math.sin(a)]); }
    function px(x, y, c) { x = clamp(Math.round(x), 0, w - 1); y = clamp(Math.round(y), 0, h - 1); return d[(y * w + x) * 4 + c]; }
    var rr = r * 1.35, tgt = ring.map(function (u) { return [px(cx + u[0] * rr, cy + u[1] * rr, 0), px(cx + u[0] * rr, cy + u[1] * rr, 1), px(cx + u[0] * rr, cy + u[1] * rr, 2)]; });
    var best = null, bestC = Infinity;
    for (var dd = 2.2; dd <= 3.6; dd += 0.7) for (j = 0; j < 16; j++) {
      a = j / 16 * Math.PI * 2 + dd; var ox = Math.cos(a) * r * dd, oy = Math.sin(a) * r * dd, sx = cx + ox, sy = cy + oy;
      if (sx - rr < 0 || sy - rr < 0 || sx + rr >= w || sy + rr >= h) continue;
      var cost = 0, mt = [0, 0, 0], mc = [0, 0, 0];
      for (var q = 0; q < K; q++) for (var c = 0; c < 3; c++) { var v = px(sx + ring[q][0] * rr, sy + ring[q][1] * rr, c); mc[c] += v; mt[c] += tgt[q][c]; }
      for (q = 0; q < K; q++) for (c = 0; c < 3; c++) { var e = (px(sx + ring[q][0] * rr, sy + ring[q][1] * rr, c) - mc[c] / K) - (tgt[q][c] - mt[c] / K); cost += e * e; }
      // texture of the source interior should be calm (don't copy another spot)
      var ci = [px(sx, sy, 0), px(sx, sy, 1), px(sx, sy, 2)];
      for (c = 0; c < 3; c++) { var e2 = ci[c] - mc[c] / K; cost += e2 * e2 * K * 0.5; }
      cost *= 1 + dd * 0.08;
      if (cost < bestC) { bestC = cost; best = [ox, oy]; }
    }
    var x0 = Math.max(0, Math.floor(cx - rr)), y0 = Math.max(0, Math.floor(cy - rr)), x1 = Math.min(w - 1, Math.ceil(cx + rr)), y1 = Math.min(h - 1, Math.ceil(cy + rr));
    // per-angle colour offsets (target ring − source ring), interpolated inside → seamless like a membrane fill
    var off = null;
    if (best) off = ring.map(function (u, q) { return [0, 1, 2].map(function (c) { return tgt[q][c] - px(cx + best[0] + u[0] * rr, cy + best[1] + u[1] * rr, c); }); });
    var srcCopy = new Uint8ClampedArray(d);
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      var dx = x - cx, dy = y - cy, dl = Math.sqrt(dx * dx + dy * dy); if (dl > rr) continue;
      var f = 1 - smooth(r * 0.8, rr, dl), k2 = (y * w + x) * 4;
      if (f <= 0) continue;
      var ang = Math.atan2(dy, dx); if (ang < 0) ang += Math.PI * 2;
      var t = ang / (Math.PI * 2) * K, i0 = Math.floor(t) % K, i1 = (i0 + 1) % K, ft = t - Math.floor(t);
      for (var c2 = 0; c2 < 3; c2++) {
        var val;
        if (best) {
          var o = off[i0][c2] * (1 - ft) + off[i1][c2] * ft;
          var sxp = clamp(Math.round(x + best[0]), 0, w - 1), syp = clamp(Math.round(y + best[1]), 0, h - 1);
          val = srcCopy[(syp * w + sxp) * 4 + c2] + o;
        } else {
          val = tgt[i0][c2] * (1 - ft) + tgt[i1][c2] * ft;
        }
        d[k2 + c2] = srcCopy[k2 + c2] + (val - srcCopy[k2 + c2]) * f;
      }
    }
  }

  // warp stage: face slimming (jaw pushed toward the face axis) + bigger eyes (bulge). inp/out RGBA of size w×h,
  // faces in the same pixel space (geometry scaled by k, offset ox/oy)
  function warp(inp, out, w, h, faces, p, k, ox, oy) {
    out.set(inp);
    var slim = p.slim || 0, big = p.eyebig || 0;
    if (!slim && !big) return;
    faces.forEach(function (g) {
      var f = g.pts, T = function (q) { return { x: (q.x - ox) * k, y: (q.y - oy) * k }; };
      var fw = g.fw * k, pushes = [], bulges = [];
      if (slim) {
        var top = T(f[168]), chin = T(f[152]), ax = chin.x - top.x, ay = chin.y - top.y, al = Math.hypot(ax, ay) || 1;
        ax /= al; ay /= al;
        JAW_R.concat(JAW_L).forEach(function (ji, n2) {
          var q = T(f[ji]), t = (q.x - top.x) * ax + (q.y - top.y) * ay, px0 = top.x + ax * t, py0 = top.y + ay * t;
          var vx = px0 - q.x, vy = py0 - q.y, vl = Math.hypot(vx, vy) || 1;
          var along = Math.sin(Math.PI * ((n2 % 10) + 0.5) / 10);   // strongest at the jaw line, gentle at temples and chin
          var mag = slim * fw * (0.01 + 0.042 * along);
          pushes.push({ x: q.x, y: q.y, vx: vx / vl * mag, vy: vy / vl * mag, s2: 2 * Math.pow(fw * 0.16, 2) });
        });
      }
      if (big) [[g.eyeRc, g.ewR], [g.eyeLc, g.ewL]].forEach(function (e) { var c = T(e[0]); bulges.push({ x: c.x, y: c.y, R: e[1] * k * 1.05, s: big * 0.2 }); });
      var m = fw * 0.45, X0 = Math.max(0, Math.floor((g.x0 - ox) * k - m)), Y0 = Math.max(0, Math.floor((g.y0 - oy) * k - m));
      var X1 = Math.min(w - 1, Math.ceil((g.x1 - ox) * k + m)), Y1 = Math.min(h - 1, Math.ceil((g.y1 - oy) * k + m));
      for (var y = Y0; y <= Y1; y++) for (var x = X0; x <= X1; x++) {
        var sx = x, sy = y, i, q;
        for (i = 0; i < bulges.length; i++) {
          q = bulges[i]; var dx = x - q.x, dy = y - q.y, d2 = dx * dx + dy * dy, R2 = q.R * q.R;
          if (d2 < R2) { var fct = 1 - q.s * (1 - d2 / R2) * (1 - d2 / R2); sx += dx * fct - dx; sy += dy * fct - dy; }
        }
        for (i = 0; i < pushes.length; i++) {
          q = pushes[i]; var ex = x - q.x - q.vx * 0.5, ey = y - q.y - q.vy * 0.5, wgt = Math.exp(-(ex * ex + ey * ey) / q.s2);
          if (wgt > 0.003) { sx -= q.vx * wgt; sy -= q.vy * wgt; }
        }
        if (sx === x && sy === y) continue;
        sx = clamp(sx, 0, w - 1.001); sy = clamp(sy, 0, h - 1.001);
        var ix = sx | 0, iy = sy | 0, fx = sx - ix, fy = sy - iy, a0 = (iy * w + ix) * 4, a1 = a0 + 4, b0 = a0 + w * 4, b1 = b0 + 4, o = (y * w + x) * 4;
        for (var c = 0; c < 4; c++) out[o + c] = (inp[a0 + c] * (1 - fx) + inp[a1 + c] * fx) * (1 - fy) + (inp[b0 + c] * (1 - fx) + inp[b1 + c] * fx) * fy;
      }
    });
  }

  Model.prototype.render = function (p, spots) {
    this.prepare();
    this.toneStage(p, spots);
    warp(this.tone.data, this.out.data, this.w, this.h, this.faces, p, this.s, this.rx, this.ry);
    this.ctx.putImageData(this.out, 0, 0);
    return this.canvas;
  };
  // full-resolution result → canvas W×H
  Model.prototype.full = function (p, spots) {
    this.prepare(); this.toneStage(p, spots);
    var W = this.W, H = this.H, c = mk(W, H), x = c.getContext('2d');
    x.drawImage(this.el, 0, 0, W, H);
    var rw = this.rw, rh = this.rh, reg;
    if (this.s >= 0.999) reg = this.tone;
    else {
      // tone changes as an upsampled difference, so the full-resolution detail outside the edits stays untouched
      reg = x.getImageData(this.rx, this.ry, rw, rh);
      var rd = reg.data, sd = this.src.data, td = this.tone.data, w = this.w, h = this.h, kx = (w - 1) / Math.max(1, rw - 1), ky = (h - 1) / Math.max(1, rh - 1);
      for (var yy = 0; yy < rh; yy++) {
        var fy = yy * ky, iy = Math.min(h - 2, fy | 0), ty = fy - iy; if (h < 2) { iy = 0; ty = 0; }
        for (var xx = 0; xx < rw; xx++) {
          var fx = xx * kx, ix = Math.min(w - 2, fx | 0), tx = fx - ix; if (w < 2) { ix = 0; tx = 0; }
          var a0 = (iy * w + ix) * 4, a1 = a0 + (w > 1 ? 4 : 0), b0 = a0 + (h > 1 ? w * 4 : 0), b1 = b0 + (w > 1 ? 4 : 0), o = (yy * rw + xx) * 4;
          for (var ch = 0; ch < 3; ch++) {
            var dlt = ((td[a0 + ch] - sd[a0 + ch]) * (1 - tx) + (td[a1 + ch] - sd[a1 + ch]) * tx) * (1 - ty) + ((td[b0 + ch] - sd[b0 + ch]) * (1 - tx) + (td[b1 + ch] - sd[b1 + ch]) * tx) * ty;
            if (dlt) rd[o + ch] = rd[o + ch] + dlt;
          }
        }
      }
    }
    if (p.slim || p.eyebig) {
      var outR = new ImageData(rw, rh);
      if (reg.width !== rw) { var tmp = mk(reg.width, reg.height); tmp.getContext('2d').putImageData(reg, 0, 0); var t2 = mk(rw, rh), t2x = t2.getContext('2d'); t2x.drawImage(tmp, 0, 0, rw, rh); reg = t2x.getImageData(0, 0, rw, rh); }
      warp(reg.data, outR.data, rw, rh, this.faces, p, 1, this.rx, this.ry);
      reg = outR;
    }
    x.putImageData(reg, this.rx, this.ry);
    return c;
  };

  // ---------------- UI ----------------
  var PRESETS = {
    natural: { smooth: 0.45, blem: 0.7, bright: 0.15, eyes: 0.25, teeth: 0.25, slim: 0, eyebig: 0 },
    medium: { smooth: 0.65, blem: 0.85, bright: 0.25, eyes: 0.4, teeth: 0.4, slim: 0.25, eyebig: 0.15 },
    strong: { smooth: 0.75, blem: 1, bright: 0.3, eyes: 0.5, teeth: 0.5, slim: 0.4, eyebig: 0.25 },
    none: { smooth: 0, blem: 0, bright: 0, eyes: 0, teeth: 0, slim: 0, eyebig: 0 }
  };
  var SLIDERS = [
    ['Арьс', [['smooth', 'Зөөлрүүлэх'], ['blem', 'Толбо, батга арилгах'], ['bright', 'Гэгээрүүлэх']]],
    ['Нүд, шүд', [['eyes', 'Нүд тодруулах'], ['teeth', 'Шүд цайруулах']]],
    ['Хэлбэр', [['slim', 'Нүүр нарийсгах'], ['eyebig', 'Нүд томруулах']]]
  ];
  var CSS = '.rt-pre{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}.rt-pre .btn{height:30px;padding:0 4px;font-size:11.5px;justify-content:center}.rt-pre .btn.on{border-color:var(--acc,#6d56fa);color:var(--acc,#6d56fa)}' +
    '.rt-st{font-size:12px;line-height:1.45;padding:8px 10px;border-radius:10px;background:var(--panel2,rgba(109,86,250,.08));margin-bottom:6px}.rt-st.warn{background:rgba(255,170,0,.12)}' +
    '.rt-cmp{user-select:none;-webkit-user-select:none;touch-action:none}.rt-cmp.on{background:var(--acc,#6d56fa);color:#fff;border-color:transparent}' +
    '.rt-busy{position:absolute;inset:0;display:grid;place-items:center;background:rgba(10,8,20,.35);color:#fff;font-size:13px;font-weight:600;z-index:2}.rt-busy[hidden]{display:none}' +
    '@media (max-width:600px){.rt-modal .cut-top b{display:none}.rt-modal .cut-top .btn,.rt-modal .cut-top .btn-primary{padding:0 10px;font-size:12px}}' +
    '.rt-brush.on{background:var(--acc,#6d56fa);color:#fff;border-color:transparent}.cut-view.rt-v{position:relative}';

  function open(img, opt) {
    opt = opt || {};
    var toast = opt.toast || function () {};
    var el = opt.el, W = el.naturalWidth || el.width, H = el.naturalHeight || el.height;
    if (!document.getElementById('rt-css')) { var stl = document.createElement('style'); stl.id = 'rt-css'; stl.textContent = CSS; document.head.appendChild(stl); }
    var p = Object.assign({}, PRESETS.none, opt.params || {}), spots = (opt.spots || []).slice(), undo = [], model = null, cmp = false, brush = false, bsize = Math.max(6, Math.round(Math.max(W, H) / 90));
    var m = document.createElement('div'); m.className = 'cut-modal rt-modal';
    var sl = function (k, label) { return '<div class="sl"><span>' + label + '</span><input type="range" data-rt="' + k + '" min="0" max="100" value="' + Math.round((p[k] || 0) * 100) + '" disabled><b>' + Math.round((p[k] || 0) * 100) + '</b></div>'; };
    m.innerHTML =
      '<div class="cut-top"><b>Нүүр засах</b><span class="grow"></span>' +
        '<button type="button" class="btn" data-ru="zoom" hidden>Бүтэн зураг</button>' +
        '<button type="button" class="btn rt-cmp" data-ru="cmp" title="Дарж байхад анхны зураг харагдана (\\)">Өмнө нь</button>' +
        '<button type="button" class="btn" data-ru="cancel">Болих</button><button type="button" class="btn-primary" data-ru="apply">Хадгалах</button></div>' +
      '<div class="cut-body"><div class="cut-view rt-v"><canvas></canvas><div class="rt-busy">Нүүр хайж байна…</div></div>' +
      '<div class="cut-side">' +
        '<div class="rt-st">Нүүр хайж байна… (анх удаа ~4MB загвар ачаална)</div>' +
        '<div class="ps-l" style="margin-top:4px">Бэлэн тохиргоо</div><div class="rt-pre">' +
          [['natural', 'Байгалийн'], ['medium', 'Дунд'], ['strong', 'Хүчтэй'], ['none', 'Тэглэх']].map(function (x) { return '<button type="button" class="btn" data-rp="' + x[0] + '" disabled>' + x[1] + '</button>'; }).join('') + '</div>' +
        SLIDERS.map(function (g) { return '<div class="ps-l">' + g[0] + '</div>' + g[1].map(function (s) { return sl(s[0], s[1]); }).join(''); }).join('') +
        '<div class="ps-l">Гараар</div>' +
        '<button type="button" class="btn full rt-brush" data-ru="brush">Толбо арилгах сойз</button>' +
        '<div class="sl"><span>Сойзны хэмжээ</span><input type="range" data-rt="bsize" min="3" max="' + Math.max(40, Math.round(Math.max(W, H) / 12)) + '" value="' + bsize + '"><b>' + bsize + '</b></div>' +
        '<div class="r2" style="margin-top:4px"><button type="button" class="btn" data-ru="undo">Буцаах</button><button type="button" class="btn" data-ru="clear">Сойзныг цэвэрлэх</button></div>' +
        '<p class="note">Сойзоор толбо, батга, сорвин дээр дарж арилгана. «Өмнө нь» товчийг дарж байхад анхны зураг харагдана.</p>' +
        '<p class="note">Бүх боловсруулалт таны төхөөрөмж дээр хийгдэнэ — зураг хаашаа ч илгээгдэхгүй.</p>' +
      '</div></div>';
    document.body.appendChild(m);
    var view = m.querySelector('.cut-view'), V = m.querySelector('canvas'), vx = V.getContext('2d'), busy = m.querySelector('.rt-busy'), stEl = m.querySelector('.rt-st');
    var hover = null, raf = 0, dragging = false, lastP = null, vr = { x: 0, y: 0, w: W, h: H }, faceView = false;

    function layout() {
      var r = view.getBoundingClientRect(), k = Math.min((r.width - 24) / vr.w, (r.height - 24) / vr.h, 4);
      V.style.width = Math.round(vr.w * k) + 'px'; V.style.height = Math.round(vr.h * k) + 'px';
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      V.width = Math.max(1, Math.round(vr.w * k * dpr)); V.height = Math.max(1, Math.round(vr.h * k * dpr));
      paint();
    }
    var out = null;
    function paint() {
      var k = V.width / vr.w;
      vx.setTransform(1, 0, 0, 1, 0, 0); vx.clearRect(0, 0, V.width, V.height);
      vx.imageSmoothingQuality = 'high';
      vx.drawImage(el, vr.x, vr.y, vr.w, vr.h, 0, 0, V.width, V.height);
      if (out && !cmp && model) vx.drawImage(out, (model.rx - vr.x) * k, (model.ry - vr.y) * k, model.rw * k, model.rh * k);
      if (brush && hover) {
        vx.beginPath(); vx.arc((hover.x - vr.x) * k, (hover.y - vr.y) * k, bsize * k, 0, Math.PI * 2);
        vx.lineWidth = 1.5; vx.strokeStyle = '#fff'; vx.stroke(); vx.lineWidth = 0.75; vx.strokeStyle = '#000'; vx.stroke();
      }
    }
    function update() {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; if (!model) return; out = model.render(p, spots); paint(); });
    }
    function syncUI() {
      m.querySelectorAll('input[data-rt]').forEach(function (i) { var k = i.dataset.rt; if (k === 'bsize') return; i.value = Math.round((p[k] || 0) * 100); i.nextElementSibling.textContent = i.value; });
      var pre = Object.keys(PRESETS).filter(function (id) { return Object.keys(PRESETS[id]).every(function (k) { return Math.abs((p[k] || 0) - PRESETS[id][k]) < 0.005; }); })[0];
      m.querySelectorAll('[data-rp]').forEach(function (b) { b.classList.toggle('on', b.dataset.rp === pre); });
    }
    function pos(e) { var r = V.getBoundingClientRect(); return { x: vr.x + (e.clientX - r.left) * vr.w / r.width, y: vr.y + (e.clientY - r.top) * vr.h / r.height }; }
    function setView(face) {
      faceView = face && model && model.faces.length;
      vr = faceView ? { x: model.rx, y: model.ry, w: model.rw, h: model.rh } : { x: 0, y: 0, w: W, h: H };
      var zb = m.querySelector('[data-ru="zoom"]'); zb.textContent = faceView ? 'Бүтэн зураг' : 'Нүүр рүү ойртох';
      layout();
    }
    function setBrush(on) { brush = on; m.querySelector('.rt-brush').classList.toggle('on', on); V.style.cursor = on ? 'none' : 'default'; paint(); }

    V.addEventListener('pointerdown', function (e) {
      if (!brush || !model) return;
      V.setPointerCapture(e.pointerId); dragging = true;
      var q = pos(e); undo.push(spots.length); spots.push({ x: q.x, y: q.y, r: bsize }); lastP = q; update();
    });
    V.addEventListener('pointermove', function (e) {
      var q = pos(e); hover = q;
      if (dragging && brush && Math.hypot(q.x - lastP.x, q.y - lastP.y) > bsize * 0.9) { spots.push({ x: q.x, y: q.y, r: bsize }); lastP = q; update(); }
      else paint();
    });
    V.addEventListener('pointerup', function () { dragging = false; });
    V.addEventListener('pointerleave', function () { hover = null; paint(); });

    m.addEventListener('input', function (e) {
      var t = e.target, k = t.dataset.rt; if (!k) return;
      t.nextElementSibling.textContent = t.value;
      if (k === 'bsize') { bsize = +t.value; if (!brush) setBrush(true); hover = hover || { x: W / 2, y: H / 2 }; paint(); return; }
      p[k] = +t.value / 100; syncUI(); update();
    });
    var cmpBtn = m.querySelector('[data-ru="cmp"]');
    function setCmp(on) { cmp = on; cmpBtn.classList.toggle('on', on); paint(); }
    cmpBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); setCmp(true); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { cmpBtn.addEventListener(ev, function () { if (cmp) setCmp(false); }); });

    m.addEventListener('click', function (e) {
      var pr = e.target.closest('[data-rp]'); if (pr && !pr.disabled) { Object.assign(p, PRESETS[pr.dataset.rp]); syncUI(); update(); return; }
      var b = e.target.closest('[data-ru]'); if (!b) return;
      var a = b.dataset.ru;
      if (a === 'brush') setBrush(!brush);
      if (a === 'zoom') setView(!faceView);
      if (a === 'undo') { if (undo.length) { spots.length = undo.pop(); update(); } }
      if (a === 'clear') { if (spots.length) { undo = []; spots = []; update(); } }
      if (a === 'cancel') close();
      if (a === 'apply') apply();
    });
    function apply() {
      if (!model) return close();
      busy.textContent = 'Хадгалж байна…'; busy.hidden = false;
      setTimeout(function () {
        try {
          var c = model.full(p, spots), opaque = true;
          // keep transparency (cut-outs) as PNG; photos as high-quality JPEG
          var probe = c.getContext('2d').getImageData(0, 0, W, H).data;
          for (var i = 3; i < probe.length; i += 4 * 7) if (probe[i] < 255) { opaque = false; break; }
          var url = c.toDataURL(opaque ? 'image/jpeg' : 'image/png', 0.95);
          opt.onApply && opt.onApply(url, Object.assign({}, p), spots.slice());
          close();
        } catch (err) { console.error(err); busy.hidden = true; toast('Хадгалж чадсангүй'); }
      }, 30);
    }
    function close() { m.remove(); window.removeEventListener('resize', layout); document.removeEventListener('keydown', onKey, true); document.removeEventListener('keyup', onKeyUp, true); }
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key === '\\') { e.preventDefault(); if (!cmp) setCmp(true); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); e.stopPropagation(); if (undo.length) { spots.length = undo.pop(); update(); } return; }
      if (e.target && /INPUT|SELECT/.test(e.target.tagName)) return;
      if (e.key === '[' || e.key === ']') { bsize = clamp(Math.round(bsize * (e.key === ']' ? 1.15 : 0.87)), 3, 400); var bi = m.querySelector('[data-rt="bsize"]'); bi.value = bsize; bi.nextElementSibling.textContent = bsize; paint(); }
      if (e.key === 'j' || e.key === 'J') setBrush(!brush);
    }
    function onKeyUp(e) { if (e.key === '\\') setCmp(false); }
    document.addEventListener('keydown', onKey, true); document.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('resize', layout);
    layout();

    detect(el, W, H).then(function (faces) {
      model = new Model(el, W, H, faces);
      m.querySelectorAll('[data-rt],[data-rp]').forEach(function (i) { i.disabled = false; });
      if (faces.length) {
        m.querySelector('[data-ru="zoom"]').hidden = false;
        setView(model.rw * model.rh < W * H * 0.45);
        stEl.textContent = faces.length === 1 ? 'Нүүр олдлоо — гулсуурыг хөдөлгөж тохируулна уу.' : faces.length + ' нүүр олдлоо — бүгдэд нь зэрэг хэрэгжинэ.';
        if (!opt.params) Object.assign(p, PRESETS.natural);
      } else {
        stEl.className = 'rt-st warn';
        stEl.textContent = 'Нүүр олдсонгүй. Нүүр тод, урагшаа харсан зураг дээр хамгийн сайн ажиллана. Толбо арилгах сойзыг ашиглаж болно.';
        m.querySelectorAll('input[data-rt]:not([data-rt="bsize"]),[data-rp]').forEach(function (i) { i.disabled = true; });
        setBrush(true);
      }
      busy.textContent = 'Боловсруулж байна…';
      setTimeout(function () { model.prepare(); busy.hidden = true; syncUI(); update(); }, 20);
    }).catch(function (err) {
      console.error(err);
      busy.hidden = true; stEl.className = 'rt-st warn';
      stEl.textContent = 'Нүүр таних загварыг ачаалж чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.';
    });
    return { close: close };
  }

  window.GRetouch = { open: open, detect: detect, Model: Model };
})();
