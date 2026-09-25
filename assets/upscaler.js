/* Graphican AI upscaler — Real-ESRGAN (general-x4v3 + wdn-x4v3) on TensorFlow.js, fully in the browser.
   Shared by the Editor. window.GUpscale.run(canvas, {scale, denoise, sharpen}, onProgress) → Promise<canvas>
   Transparent images keep their alpha (upscaled smoothly) with colour bled under the edges. */
(function () {
  'use strict';
  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (document.querySelector('script[data-src="' + src + '"]')) return res();
      var s = document.createElement('script'); s.src = src; s.dataset.src = src;
      s.onload = function () { res(); }; s.onerror = rej; document.head.appendChild(s);
    });
  }
  // Real-ESRGAN (general-x4v3 + wdn-x4v3, SRVGGNetCompact) implemented directly on TF.js ops.
  var esr = { tf: null, man: null, bins: {}, nets: {} };
  function f16to32(u16) {
    var out = new Float32Array(u16.length);
    for (var i = 0; i < u16.length; i++) {
      var h = u16[i], s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
      out[i] = e === 0 ? s * Math.pow(2, -14) * (f / 1024) : e === 31 ? (f ? NaN : s * Infinity) : s * Math.pow(2, e - 15) * (1 + f / 1024);
    }
    return out;
  }
  function esrReady() {
    if (esr.ready) return esr.ready;
    esr.ready = loadScript('/assets/vendor/tf.min.js').then(function () {
      esr.tf = window.tf;
      return esr.tf.ready().then(function () {
        return Promise.all([
          fetch('/assets/vendor/realesr/model.json').then(function (r) { return r.json(); }),
          fetch('/assets/vendor/realesr/general.bin').then(function (r) { return r.arrayBuffer(); }),
          fetch('/assets/vendor/realesr/wdn.bin').then(function (r) { return r.arrayBuffer(); })
        ]);
      });
    }).then(function (r) {
      esr.man = r[0];
      esr.bins.general = f16to32(new Uint16Array(r[1]));
      esr.bins.wdn = f16to32(new Uint16Array(r[2]));
    });
    return esr.ready;
  }
  // denoise 0..1 → blend of the two official models (same as Real-ESRGAN's "denoise strength")
  function esrNet(denoise) {
    var key = denoise.toFixed(2);
    if (esr.nets[key]) return esr.nets[key];
    Object.keys(esr.nets).forEach(function (k) { esr.nets[k].forEach(function (l) { l.w && l.w.dispose(); l.b && l.b.dispose(); l.a && l.a.dispose(); }); delete esr.nets[k]; });
    var tf = esr.tf, g = esr.bins.general, n = esr.bins.wdn, off = 0, layers = [];
    function take(len) {
      var o = new Float32Array(len);
      for (var i = 0; i < len; i++) o[i] = denoise * g[off + i] + (1 - denoise) * n[off + i];
      off += len; return o;
    }
    esr.man.layers.forEach(function (L) {
      if (L.t === 'conv') {
        var sh = L.shape, sz = sh[0] * sh[1] * sh[2] * sh[3];
        layers.push({ t: 'conv', w: tf.tensor4d(take(sz), sh), b: tf.tensor1d(take(sh[3])) });
      } else {
        layers.push({ t: 'prelu', a: tf.tensor1d(take(L.n)) });
      }
    });
    esr.nets[key] = layers;
    return layers;
  }
  function esrInfer(x, layers) { // x: [1,H,W,3] 0..1 → [1,4H,4W,3]
    var tf = esr.tf;
    return tf.tidy(function () {
      var h = x;
      layers.forEach(function (L) {
        if (L.t === 'conv') h = tf.add(tf.conv2d(h, L.w, 1, 'same'), L.b);
        else h = tf.prelu(h, L.a);
      });
      h = tf.depthToSpace(h, 4, 'NHWC');
      var up = tf.image.resizeNearestNeighbor(x, [x.shape[1] * 4, x.shape[2] * 4]);
      return tf.clipByValue(tf.add(h, up), 0, 1);
    });
  }
  // tiled upscale → canvas at outScale (2 or 4)
  function esrUpscale(srcCanvas, outScale, denoise, onProgress) {
    var tf = esr.tf, layers = esrNet(denoise);
    var W = srcCanvas.width, H = srcCanvas.height, T = 96, P = 8, k = outScale / 4;
    var out = document.createElement('canvas'); out.width = W * outScale; out.height = H * outScale;
    var octx = out.getContext('2d'); octx.imageSmoothingQuality = 'high';
    var tileC = document.createElement('canvas');
    var src = tf.tidy(function () { return tf.browser.fromPixels(srcCanvas).toFloat().div(255); });
    var tiles = [];
    for (var y = 0; y < H; y += T) for (var x = 0; x < W; x += T) tiles.push([x, y]);
    var i = 0;
    function step() {
      if (i >= tiles.length) { src.dispose(); return Promise.resolve(out); }
      var x = tiles[i][0], y = tiles[i][1];
      var tw = Math.min(T, W - x), th = Math.min(T, H - y);
      var x0 = Math.max(0, x - P), y0 = Math.max(0, y - P), x1 = Math.min(W, x + tw + P), y1 = Math.min(H, y + th + P);
      var res = tf.tidy(function () {
        var crop = src.slice([y0, x0, 0], [y1 - y0, x1 - x0, 3]).expandDims(0);
        var o = esrInfer(crop, layers).squeeze();
        return o.slice([(y - y0) * 4, (x - x0) * 4, 0], [th * 4, tw * 4, 3]);
      });
      tileC.width = tw * 4; tileC.height = th * 4;
      return tf.browser.toPixels(res, tileC).then(function () {
        res.dispose();
        octx.drawImage(tileC, x * outScale, y * outScale, tw * outScale, th * outScale);
        i++; onProgress(i / tiles.length);
        return tf.nextFrame().then(step);
      });
    }
    return step();
  }

  // light unsharp mask on the upscaled canvas (amount 0..1)
  function sharpen(canvas, amount) {
    if (!amount) return canvas;
    var w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d');
    var src = ctx.getImageData(0, 0, w, h), d = src.data, out = ctx.createImageData(w, h), o = out.data;
    var a = amount, c = 1 + 4 * a;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var up = ((y > 0 ? y - 1 : y) * w + x) * 4, dn = ((y < h - 1 ? y + 1 : y) * w + x) * 4;
        var lf = (y * w + (x > 0 ? x - 1 : x)) * 4, rt = (y * w + (x < w - 1 ? x + 1 : x)) * 4;
        for (var k = 0; k < 3; k++) {
          var v = c * d[i + k] - a * (d[up + k] + d[dn + k] + d[lf + k] + d[rt + k]);
          o[i + k] = v < 0 ? 0 : v > 255 ? 255 : v;
        }
        o[i + 3] = d[i + 3];
      }
    }
    ctx.putImageData(out, 0, 0);
    return canvas;
  }


  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function hasAlpha(c) {
    var w = Math.min(c.width, 300), h = Math.min(c.height, 300), t = mk(w, h), x = t.getContext('2d');
    x.drawImage(c, 0, 0, w, h); var d = x.getImageData(0, 0, w, h).data;
    for (var i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
    return false;
  }
  // fill transparent pixels with nearby colours so the network doesn't see black edges
  function bleed(c) {
    var o = mk(c.width, c.height), x = o.getContext('2d'), probe = x;
    var filt = 'filter' in probe;
    [48, 16, 6, 2].forEach(function (r) {
      if (filt) { x.filter = 'blur(' + r + 'px)'; x.drawImage(c, 0, 0); x.filter = 'none'; }
      else x.drawImage(c, 0, 0);
    });
    x.drawImage(c, 0, 0);
    x.globalCompositeOperation = 'destination-over'; x.fillStyle = '#808080'; x.fillRect(0, 0, o.width, o.height);
    return o;
  }
  function run(src, opts, onProgress) {
    opts = opts || {};
    var scale = opts.scale || 2, dn = opts.denoise == null ? 0.6 : opts.denoise;
    var alpha = hasAlpha(src);
    return esrReady().then(function () {
      return esrUpscale(alpha ? bleed(src) : src, scale, dn, onProgress || function () {});
    }).then(function (out) {
      out = sharpen(out, opts.sharpen || 0);
      if (alpha) {
        var x = out.getContext('2d');
        x.imageSmoothingQuality = 'high'; x.globalCompositeOperation = 'destination-in';
        x.drawImage(src, 0, 0, out.width, out.height);
        x.globalCompositeOperation = 'source-over';
      }
      return out;
    });
  }
  window.GUpscale = { ready: esrReady, run: run, backend: function () { return esr.tf ? esr.tf.getBackend() : ''; } };
})();
