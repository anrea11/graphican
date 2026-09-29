/* Graphican AI background removal — U²-Net-P (ONNX Runtime Web), fully in the browser. Shared by /tools/bgremove/ and the Editor.
   On top of the raw 320×320 model mask:
   • the model runs twice (photo + mirrored photo) and the two masks are averaged → steadier, fewer holes
   • tiny detached specks are dropped
   • colour decontamination: semi-transparent edge pixels get the subject's colour instead of the old background's (no halo)
   window.GRmbg.alpha(img) → Promise<{a: Float32Array, w, h}>   (refined alpha at working size, 0..1)
   window.GRmbg.cutout(img, alpha, edge, fill) → full-size canvas   (edge: 'soft' | 'mid' | 'hard', fill: 'none' or a CSS colour) */
(function () {
  'use strict';
  if (window.GRmbg) return;
  var ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/', MODEL = '/assets/vendor/u2netp.onnx', S = 320, WORK = 1024;

  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }
  var st = { ready: null, session: null };
  function ready() {
    if (st.ready) return st.ready;
    st.ready = (window.ort ? Promise.resolve() : loadScript(ORT + 'ort.min.js')).then(function () {
      var ort = window.ort;
      ort.env.wasm.wasmPaths = ORT;
      ort.env.wasm.numThreads = window.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
      return ort.InferenceSession.create(MODEL, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    }).then(function (s) { st.session = s; });
    st.ready.catch(function () { st.ready = null; });
    return st.ready;
  }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
  function dims(img) { return { W: img.naturalWidth || img.videoWidth || img.width, H: img.naturalHeight || img.videoHeight || img.height }; }

  // one model pass (optionally on the mirrored photo) → 320×320 mask, 0..1
  function runModel(img, flip) {
    var c = mk(S, S), cx = c.getContext('2d');
    if (flip) { cx.translate(S, 0); cx.scale(-1, 1); }
    cx.drawImage(img, 0, 0, S, S);
    var px = cx.getImageData(0, 0, S, S).data, n = S * S, max = 1, i, k;
    for (i = 0; i < n * 4; i++) if ((i & 3) !== 3 && px[i] > max) max = px[i];
    var mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225], data = new Float32Array(3 * n);
    for (i = 0; i < n; i++) for (k = 0; k < 3; k++) data[k * n + i] = (px[i * 4 + k] / max - mean[k]) / std[k];
    var s = st.session, feeds = {};
    feeds[s.inputNames[0]] = new window.ort.Tensor('float32', data, [1, 3, S, S]);
    return s.run(feeds).then(function (out) {
      var m = out[s.outputNames[0]].data, lo = Infinity, hi = -Infinity, r = new Float32Array(n);
      for (i = 0; i < n; i++) { if (m[i] < lo) lo = m[i]; if (m[i] > hi) hi = m[i]; }
      var span = (hi - lo) || 1;
      for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) r[y * S + x] = (m[y * S + (flip ? S - 1 - x : x)] - lo) / span;
      return r;
    });
  }

  // bilinear resize of a single-channel float image
  function resize(src, sw, sh, dw, dh) {
    var out = new Float32Array(dw * dh), fx = sw / dw, fy = sh / dh;
    for (var y = 0; y < dh; y++) {
      var sy = Math.min(sh - 1, Math.max(0, (y + 0.5) * fy - 0.5)), y0 = Math.floor(sy), y1 = Math.min(sh - 1, y0 + 1), ty = sy - y0;
      for (var x = 0; x < dw; x++) {
        var sx = Math.min(sw - 1, Math.max(0, (x + 0.5) * fx - 0.5)), x0 = Math.floor(sx), x1 = Math.min(sw - 1, x0 + 1), tx = sx - x0;
        var a = src[y0 * sw + x0] + (src[y0 * sw + x1] - src[y0 * sw + x0]) * tx, b = src[y1 * sw + x0] + (src[y1 * sw + x1] - src[y1 * sw + x0]) * tx;
        out[y * dw + x] = a + (b - a) * ty;
      }
    }
    return out;
  }
  // box mean with radius r (separable running sums, edges clamped by count)
  function boxMean(src, w, h, r) {
    var tmp = new Float32Array(w * h), out = new Float32Array(w * h), x, y, s, cnt;
    for (y = 0; y < h; y++) {
      var row = y * w; s = 0; cnt = 0;
      for (x = 0; x <= Math.min(r, w - 1); x++) { s += src[row + x]; cnt++; }
      for (x = 0; x < w; x++) {
        tmp[row + x] = s / cnt;
        var add = x + r + 1, rem = x - r;
        if (add < w) { s += src[row + add]; cnt++; }
        if (rem >= 0) { s -= src[row + rem]; cnt--; }
      }
    }
    for (x = 0; x < w; x++) {
      s = 0; cnt = 0;
      for (y = 0; y <= Math.min(r, h - 1); y++) { s += tmp[y * w + x]; cnt++; }
      for (y = 0; y < h; y++) {
        out[y * w + x] = s / cnt;
        var ad = y + r + 1, rm = y - r;
        if (ad < h) { s += tmp[ad * w + x]; cnt++; }
        if (rm >= 0) { s -= tmp[rm * w + x]; cnt--; }
      }
    }
    return out;
  }
  // drop solid blobs much smaller than the biggest one (keeps several subjects, e.g. two pets)
  function dropSpecks(a, w, h) {
    var n = w * h, lab = new Int32Array(n), sizes = [0], stack = new Int32Array(n), i, big = 0;
    for (i = 0; i < n; i++) {
      if (lab[i] || a[i] < 0.5) continue;
      var id = sizes.length, sp = 0, cnt = 0; lab[i] = id; stack[sp++] = i;
      while (sp) {
        var p = stack[--sp], x = p % w; cnt++;
        if (x > 0 && !lab[p - 1] && a[p - 1] >= 0.5) { lab[p - 1] = id; stack[sp++] = p - 1; }
        if (x < w - 1 && !lab[p + 1] && a[p + 1] >= 0.5) { lab[p + 1] = id; stack[sp++] = p + 1; }
        if (p >= w && !lab[p - w] && a[p - w] >= 0.5) { lab[p - w] = id; stack[sp++] = p - w; }
        if (p < n - w && !lab[p + w] && a[p + w] >= 0.5) { lab[p + w] = id; stack[sp++] = p + w; }
      }
      sizes.push(cnt); if (cnt > big) big = cnt;
    }
    var min = Math.max(24, big * 0.03), kill = sizes.map(function (s) { return s < min; });
    if (!kill.some(function (k, j) { return j && k; })) return a;
    var dead = new Float32Array(n);
    for (i = 0; i < n; i++) if (lab[i] && kill[lab[i]]) dead[i] = 1;
    dead = boxMean(dead, w, h, 2);            // also clear the soft rim around a removed speck
    var out = new Float32Array(n);
    for (i = 0; i < n; i++) out[i] = dead[i] > 0.01 && !(lab[i] && !kill[lab[i]]) ? 0 : a[i];
    return out;
  }

  function alpha(img) {
    return ready().then(function () { return runModel(img, false); }).then(function (m1) {
      return runModel(img, true).then(function (m2) { for (var i = 0; i < m1.length; i++) m1[i] = (m1[i] + m2[i]) / 2; return m1; });
    }).then(function (m) {
      // (a guided filter was tried here: it blurred edges into a glow on light-on-light photos, so the mask is only resized)
      var d = dims(img), k = Math.min(1, WORK / Math.max(d.W, d.H)), w = Math.max(1, Math.round(d.W * k)), h = Math.max(1, Math.round(d.H * k));
      return { a: dropSpecks(resize(m, S, S, w, h), w, h), w: w, h: h };
    });
  }

  var CURVES = { soft: [0.05, 0.95], mid: [0.2, 0.8], hard: [0.4, 0.6] };
  function cutout(img, al, edge, fill) {
    var d = dims(img), W = d.W, H = d.H, w = al.w, h = al.h, n = w * h, cv = CURVES[edge] || CURVES.mid, i;
    // alpha after the edge curve, at working size
    var ac = new Float32Array(n);
    for (i = 0; i < n; i++) { var t = (al.a[i] - cv[0]) / (cv[1] - cv[0]); ac[i] = t <= 0 ? 0 : t >= 1 ? 1 : t; }
    // subject colour estimate: average of nearby fully-opaque pixels (for decontaminating the soft rim)
    var sc = mk(w, h), sx = sc.getContext('2d'); sx.drawImage(img, 0, 0, w, h);
    var spx = sx.getImageData(0, 0, w, h).data, wt = new Float32Array(n), R = new Float32Array(n), G = new Float32Array(n), B = new Float32Array(n);
    for (i = 0; i < n; i++) { var q = ac[i] >= 0.95 ? 1 : 0; wt[i] = q; R[i] = spx[i * 4] * q; G[i] = spx[i * 4 + 1] * q; B[i] = spx[i * 4 + 2] * q; }
    var rr = Math.max(3, Math.round(Math.max(w, h) / 90)), mw = boxMean(wt, w, h, rr), mR = boxMean(R, w, h, rr), mG = boxMean(G, w, h, rr), mB = boxMean(B, w, h, rr);
    // colour and alpha are upscaled separately (a canvas premultiplies colour by alpha and would lose it on the rim)
    var fc = mk(w, h), fx = fc.getContext('2d'), fd = fx.createImageData(w, h), ab = mk(w, h), ax = ab.getContext('2d'), ad = ax.createImageData(w, h);
    for (i = 0; i < n; i++) {
      var o = i * 4, av = Math.round(ac[i] * 255);
      if (mw[i] > 1e-3) { fd.data[o] = mR[i] / mw[i]; fd.data[o + 1] = mG[i] / mw[i]; fd.data[o + 2] = mB[i] / mw[i]; }
      else { fd.data[o] = spx[o]; fd.data[o + 1] = spx[o + 1]; fd.data[o + 2] = spx[o + 2]; }
      fd.data[o + 3] = 255; ad.data[o] = ad.data[o + 1] = ad.data[o + 2] = av; ad.data[o + 3] = 255;
    }
    fx.putImageData(fd, 0, 0); ax.putImageData(ad, 0, 0);
    // full size: subject colour + alpha upscaled smoothly, then blended with the photo on the rim only
    var big = mk(W, H), bx = big.getContext('2d'); bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high';
    bx.drawImage(ab, 0, 0, W, H);
    var Al = bx.getImageData(0, 0, W, H).data;
    bx.drawImage(fc, 0, 0, W, H);
    var Fd = bx.getImageData(0, 0, W, H).data;
    var oc = mk(W, H), ox = oc.getContext('2d'); ox.drawImage(img, 0, 0, W, H);
    var O = ox.getImageData(0, 0, W, H), od = O.data, N = W * H;
    for (i = 0; i < N; i++) {
      var j = i * 4, A = Al[j] / 255, m = A >= 0.97 ? 0 : Math.min(1, (0.97 - A) / 0.5);
      if (m > 0) { od[j] += (Fd[j] - od[j]) * m; od[j + 1] += (Fd[j + 1] - od[j + 1]) * m; od[j + 2] += (Fd[j + 2] - od[j + 2]) * m; }
      od[j + 3] = Al[j];
    }
    ox.putImageData(O, 0, 0);
    if (fill && fill !== 'none') {
      var fl = mk(W, H), flx = fl.getContext('2d'); flx.fillStyle = fill; flx.fillRect(0, 0, W, H); flx.drawImage(oc, 0, 0);
      return fl;
    }
    return oc;
  }

  window.GRmbg = { ready: ready, alpha: alpha, cutout: cutout, _: { boxMean: boxMean, resize: resize, dropSpecks: dropSpecks, runModel: runModel } };
})();
