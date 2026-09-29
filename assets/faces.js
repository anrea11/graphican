/* Graphican face finder — MediaPipe Face Detector (BlazeFace short range, 230 KB) in the browser.
   window.GFaces.detect(img) → Promise<[{x, y, w, h, score}]> in image pixels (empty array when there are none or it can't run).
   Small faces in wide shots are found by also looking at overlapping tiles.
   Only confident detections count: real faces score ~0.85–0.96; pets and hands reach 0.5–0.7 on the whole photo
   and up to ~0.82 on zoomed tiles, so tile hits need a higher score. */
(function () {
  'use strict';
  if (window.GFaces) return;
  var TV = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/';
  var MODEL = '/assets/vendor/face/blaze_face_short_range.tflite';
  var detP = null, MIN = 0.75, MIN_TILE = 0.87;
  function detector() {
    if (detP) return detP;
    detP = import(TV + 'vision_bundle.mjs').then(function (v) {
      return v.FilesetResolver.forVisionTasks(TV + 'wasm').then(function (fs) {
        return v.FaceDetector.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' }, runningMode: 'IMAGE', minDetectionConfidence: 0.5, minSuppressionThreshold: 0.3 });
      });
    });
    detP.catch(function () { detP = null; });
    return detP;
  }
  function iou(a, b) {
    var x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y), x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
    var i = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    return i / (a.w * a.h + b.w * b.h - i || 1);
  }
  function detect(img) {
    var W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    return detector().then(function (d) {
      var found = [];
      function run(sx, sy, sw, sh, tile) {
        var k = Math.min(1, 1024 / Math.max(sw, sh)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(sw * k)); c.height = Math.max(1, Math.round(sh * k));
        c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
        (d.detect(c).detections || []).forEach(function (f) {
          var b = f.boundingBox; if (!b) return;
          found.push({ x: sx + b.originX / k, y: sy + b.originY / k, w: b.width / k, h: b.height / k, score: (f.categories && f.categories[0] && f.categories[0].score) || 0, tile: !!tile });
        });
      }
      run(0, 0, W, H);
      // overlapping square tiles: BlazeFace (short range) only sees faces bigger than ~1/12 of its input
      var T = Math.round(Math.max(360, Math.min(W, H) / 2));
      while (Math.ceil(W / (T * 0.6)) * Math.ceil(H / (T * 0.6)) > 30) T = Math.round(T * 1.25);
      if (T < Math.max(W, H)) {
        var st = Math.round(T * 0.6), tw = Math.min(T, W), th = Math.min(T, H);
        for (var y = 0; ; y += st) {
          var yy = Math.min(y, H - th);
          for (var x = 0; ; x += st) { var xx = Math.min(x, W - tw); run(xx, yy, tw, th, true); if (xx >= W - tw) break; }
          if (yy >= H - th) break;
        }
      }
      found = found.filter(function (f) { return f.score >= (f.tile ? MIN_TILE : MIN); });
      // merge duplicates (keep the most confident)
      found.sort(function (a, b) { return b.score - a.score; });
      var out = [];
      found.forEach(function (f) { if (!out.some(function (o) { return iou(o, f) > 0.3 || (f.x >= o.x && f.y >= o.y && f.x + f.w <= o.x + o.w && f.y + f.h <= o.y + o.h); })) out.push({ x: f.x, y: f.y, w: f.w, h: f.h, score: f.score }); });
      return out;
    }).catch(function (e) { console.warn('faces', e); return []; });
  }
  window.GFaces = { detect: detect };
})();
