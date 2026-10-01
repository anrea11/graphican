/* Graphican — Video editor (/video/): Reels, Story, TikTok and YouTube videos made in the browser.
   Nothing is uploaded: files stay on the device, frames are drawn on a canvas and encoded with WebCodecs into MP4
   (H.264 + AAC where the browser has them, VP9 + Opus otherwise) by assets/vendor/mp4-muxer.min.js.
   Model: P.clips = the main track (played one after another), P.texts and P.audios sit on their own tracks at absolute times.
   Media files live in `media` (by id) and in IndexedDB, so a reload brings the project back. */
(function () {
  'use strict';
  var root = document.getElementById('vapp'); if (!root) return;

  // ---------- constants ----------
  var FPS = 30, TR = 0.5, IMG_DUR = 3, TXT_DUR = 3;
  var SIZES = [
    { id: '9x16', name: 'Босоо', sub: 'Reels · Story · TikTok', w: 1080, h: 1920 },
    { id: '16x9', name: 'Хэвтээ', sub: 'YouTube · Facebook', w: 1920, h: 1080 },
    { id: '1x1', name: 'Квадрат', sub: 'Instagram пост', w: 1080, h: 1080 },
    { id: '4x3', name: '4:3', sub: 'Танилцуулга, сонгодог', w: 1440, h: 1080 }
  ];
  // all with Ө Ү; weights = what Google has (asking for a missing weight makes the whole CSS request fail)
  var FW = { 'Inter': [400, 700, 800], 'Montserrat': [400, 700, 800], 'Roboto': [400, 700, 800], 'Oswald': [400, 700], 'Nunito': [400, 700, 800], 'Rubik': [400, 700, 800],
    'Comfortaa': [400, 700], 'Lora': [400, 700], 'Cormorant Garamond': [400, 700], 'Caveat': [400, 700], 'Lobster': [400], 'Pacifico': [400], 'Kurale': [400], 'Bad Script': [400] };
  var FONTS = Object.keys(FW);
  var STYLES = [['plain', 'Энгийн'], ['outline', 'Хүрээтэй'], ['box', 'Шошго'], ['shadow', 'Сүүдэр'], ['glow', 'Гэрэлтэх']];
  var COLORS = ['#ffffff', '#000000', '#ffe600', '#ff3b5c', '#7b64ff', '#22c55e', '#38bdf8', '#ff8a00'];
  var ANIMS = [['none', 'Байхгүй'], ['pop', 'Үсрэх'], ['fade', 'Бүдгэрэх'], ['slide', 'Доороос'], ['type', 'Бичигдэх']];
  var TRANS = [['none', 'Байхгүй'], ['fade', 'Бүдгэрэх'], ['flash', 'Гялбаа'], ['zoom', 'Томрох'], ['slide', 'Гулсах'], ['blur', 'Бүдэг']];
  var SPEEDS = [0.5, 0.75, 1, 1.5, 2, 3];

  // ---------- state ----------
  var P = blank(1080, 1920);
  var media = {};          // id → { id, kind, file, url, el, dur, w, h, strip, wave, audio (AudioBuffer|null|undefined) }
  var sel = null;          // { k: 'clip'|'text'|'audio', id }
  var T = 0, playing = false, pps = 70, hist = [], hi = -1, started = false;
  function blank(w, h) { return { name: 'Нэргүй видео', w: w, h: h, bg: '#000000', clips: [], texts: [], audios: [] }; }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clipLen(c) { return Math.max(0.05, (c.out - c.in) / c.speed); }
  function clipsTotal() { return P.clips.reduce(function (s, c) { return s + clipLen(c); }, 0); }
  function total() {
    var t = clipsTotal();
    if (t > 0) return t;
    var m = 0;
    P.texts.forEach(function (x) { m = Math.max(m, x.end); });
    P.audios.forEach(function (a) { m = Math.max(m, a.start + (a.out - a.in)); });
    return m;
  }
  function clipAt(t) {
    var s = 0;
    for (var i = 0; i < P.clips.length; i++) {
      var L = clipLen(P.clips[i]);
      if (t < s + L || i === P.clips.length - 1) return { c: P.clips[i], start: s, i: i, local: clamp(t - s, 0, L) };
      s += L;
    }
    return null;
  }
  function startOf(id) { var s = 0; for (var i = 0; i < P.clips.length; i++) { if (P.clips[i].id === id) return s; s += clipLen(P.clips[i]); } return 0; }
  function find(k, id) { var l = k === 'clip' ? P.clips : k === 'text' ? P.texts : P.audios; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function selected() { return sel ? find(sel.k, sel.id) : null; }
  function fmt(t) { t = Math.max(0, t || 0); var m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); }

  // ---------- icons ----------
  var IC = {
    back: '<path d="M15 18l-6-6 6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>', text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    size: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M3 8v8M21 8v8"/>', split: '<path d="M12 3v18M7 7l-4 5 4 5M17 7l4 5-4 5"/>',
    speed: '<path d="M12 13l4-4"/><path d="M4.9 19a9 9 0 1 1 14.2 0"/>', vol: '<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
    fit: '<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/>', trans: '<path d="M4 12h16M14 6l6 6-6 6"/><path d="M4 6v12"/>',
    dup: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>', del: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    left: '<path d="M14 7l-5 5 5 5"/><path d="M20 12H9"/>', right: '<path d="M10 7l5 5-5 5"/><path d="M4 12h11"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    play: '<path d="M7 4.5v15l13-7.5z"/>', pause: '<path d="M7 4h4v16H7zM13 4h4v16h-4z"/>', undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>', dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', color: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
    replace: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>', start: '<path d="M6 4v16M18 12L9 18V6z"/>'
  };
  function ico(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + IC[n] + '</svg>'; }

  // ---------- toast ----------
  var toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl);
  var toastT = 0;
  function toast(m, ms) { toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2600); }

  // ---------- fonts (Google Fonts with Cyrillic + Ө Ү; Inter is self-hosted) ----------
  var fontP = {};
  function loadFont(f) {
    if (fontP[f]) return fontP[f];
    // the stylesheet must be parsed before document.fonts.load — otherwise load() resolves at once and nothing downloads
    var sheet = Promise.resolve();
    if (f !== 'Inter') {
      var l = document.createElement('link'); l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + f.replace(/ /g, '+') + (FW[f] && FW[f].length > 1 ? ':wght@' + FW[f].join(';') : '') + '&display=swap';
      sheet = new Promise(function (res) { l.onload = l.onerror = res; setTimeout(res, 6000); });
      document.head.appendChild(l);
    }
    var top = (FW[f] || [400]).slice(-1)[0];
    fontP[f] = sheet.then(function () {
      if (!document.fonts) return;
      return Promise.race([document.fonts.load(top + ' 40px "' + f + '"', 'АаӨөҮүAa'), new Promise(function (r) { setTimeout(r, 6000); })]);
    }).catch(function () {}).then(function () { draw(); });
    return fontP[f];
  }

  // ---------- layout ----------
  root.innerHTML =
    '<header class="vh"><a class="logo" href="/tools/" title="Бүх хэрэгсэл"><span class="orb" aria-hidden="true"></span><span>Graphican</span></a>' +
    '<input class="vname" id="v-name" value="" aria-label="Видеоны нэр" spellcheck="false">' +
    '<button class="chip" id="v-size" type="button" title="Хэмжээ солих"></button>' +
    '<button class="btn-x" id="v-export" type="button">' + ico('dl') + '<span>Татах</span></button></header>' +
    '<div class="vstage" id="v-stage"><canvas id="v-cv"></canvas><div class="guide v" id="g-v"></div><div class="guide h" id="g-h"></div>' +
    '<div class="vempty" id="v-empty"><b>Видео, зургаа нэмээд эхлээрэй</b><span>Файлууд тань серверт очихгүй — зөвхөн энэ төхөөрөмж дээр засагдана</span><button class="btn-x" type="button" data-a="add">' + ico('plus') + 'Видео, зураг нэмэх</button></div></div>' +
    '<div class="vtr"><span class="time" id="v-time"></span><span class="grow"></span>' +
    '<button class="ib" id="v-undo" type="button" title="Буцаах (Ctrl+Z)" aria-label="Буцаах">' + ico('undo') + '</button>' +
    '<button class="play" id="v-play" type="button" aria-label="Тоглуулах">' + ico('play') + '</button>' +
    '<button class="ib" id="v-redo" type="button" title="Дахин хийх (Ctrl+Y)" aria-label="Дахин хийх">' + ico('redo') + '</button>' +
    '<span class="grow"></span><input class="zoom" id="v-zoom" type="range" min="20" max="240" value="70" aria-label="Timeline томруулах"></div>' +
    '<div class="vtl"><div class="vtl-scroll" id="v-scroll"><div class="vtl-inner" id="v-tl"></div></div><div class="vtl-head"></div></div>' +
    '<nav class="vtb" id="v-tb" aria-label="Хэрэгсэл"></nav>';
  var cv = document.getElementById('v-cv'), cx = cv.getContext('2d'), stage = document.getElementById('v-stage');
  var scroller = document.getElementById('v-scroll'), tl = document.getElementById('v-tl'), tb = document.getElementById('v-tb');
  var fileIn = document.createElement('input'); fileIn.type = 'file'; fileIn.multiple = true; fileIn.hidden = true; document.body.appendChild(fileIn);
  var drop = document.createElement('div'); drop.className = 'drop'; drop.textContent = 'Энд тавина уу'; document.body.appendChild(drop);

  function sizeName() {
    var s = SIZES.filter(function (x) { return x.w === P.w && x.h === P.h; })[0];
    return s ? s.name + ' <span class="lg">' + (s.id === '4x3' ? '' : s.id.replace('x', ':')) + '</span>' : P.w + '×' + P.h;
  }
  function fitCanvas() {
    var s = Math.min(1, 960 / Math.max(P.w, P.h));
    var W = Math.round(P.w * s), H = Math.round(P.h * s);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var r = stage.getBoundingClientRect(), k = Math.min((r.width - 20) / P.w, (r.height - 20) / P.h);
    cv.style.width = Math.max(10, Math.floor(P.w * k)) + 'px'; cv.style.height = Math.max(10, Math.floor(P.h * k)) + 'px';
    draw();
  }
  window.addEventListener('resize', function () { fitCanvas(); renderTL(); });

  // ---------- drawing ----------
  var blurC = document.createElement('canvas'), blurX = blurC.getContext('2d');
  var lastBox = {};       // text id → bbox in project px (for dragging on the preview)
  function ease(p) { return 1 - Math.pow(1 - p, 3); }
  function srcOf(c) { var m = media[c.mid]; return m && m.el; }
  function srcWH(m) { return m.kind === 'video' ? [m.el.videoWidth || m.w, m.el.videoHeight || m.h] : [m.w, m.h]; }
  function drawMedia(ctx, c, W, H, t) {
    var m = media[c.mid]; if (!m || !m.el) return;
    if (m.kind === 'video' && m.el.readyState < 2) return;
    var wh = srcWH(m), sw = wh[0], sh = wh[1]; if (!sw || !sh) return;
    var cover = Math.max(W / sw, H / sh), contain = Math.min(W / sw, H / sh);
    if (c.fit === 'fit') {
      // blurred, slightly dark copy behind — CapCut style
      var bw = 48, bh = Math.max(1, Math.round(48 * H / W));
      if (blurC.width !== bw || blurC.height !== bh) { blurC.width = bw; blurC.height = bh; }
      var k0 = Math.max(bw / sw, bh / sh);
      blurX.drawImage(m.el, (bw - sw * k0) / 2, (bh - sh * k0) / 2, sw * k0, sh * k0);
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(blurC, -W * 0.05, -H * 0.05, W * 1.1, H * 1.1); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    var k = c.fit === 'fit' ? contain : cover;
    if (m.kind === 'image' && c.motion) k *= 1 + 0.08 * (t / Math.max(0.1, clipLen(c)));   // slow push-in
    var dw = sw * k, dh = sh * k;
    ctx.drawImage(m.el, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }
  function drawClip(ctx, at, W, H) {
    var c = at.c, p = c.tr && c.tr !== 'none' ? clamp(at.local / TR, 0, 1) : 1;
    ctx.save();
    if (p < 1) {
      var e = ease(p);
      if (c.tr === 'fade') ctx.globalAlpha = e;
      else if (c.tr === 'zoom') { var z = 1 + 0.25 * (1 - e); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); ctx.globalAlpha = Math.min(1, p * 2); }
      else if (c.tr === 'slide') ctx.translate(W * (1 - e), 0);
      else if (c.tr === 'blur') ctx.filter = 'blur(' + Math.round(24 * (1 - e) * W / 1080) + 'px)';
    }
    drawMedia(ctx, c, W, H, at.local);
    ctx.restore();
    if (p < 1 && c.tr === 'flash') { ctx.fillStyle = 'rgba(255,255,255,' + (1 - ease(p)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  }
  function textStyle(x) {
    var s = Math.min(P.w, P.h) * x.size;
    var w = Math.min(x.weight || 800, (FW[x.font] || [800]).slice(-1)[0]);
    return { px: s, font: w + ' ' + s + 'px "' + x.font + '", "Inter", sans-serif' };
  }
  function wrap(ctx, text, max) {
    var out = [];
    String(text || '').split('\n').forEach(function (para) {
      var words = para.split(' '), line = '';
      words.forEach(function (w) {
        var tryL = line ? line + ' ' + w : w;
        if (line && ctx.measureText(tryL).width > max) { out.push(line); line = w; } else line = tryL;
      });
      out.push(line);
    });
    return out;
  }
  function contrast(hex) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff'; }
  function drawText(ctx, x, t, still) {
    var dIn = Math.min(0.4, (x.end - x.start) / 3), dOut = Math.min(0.25, (x.end - x.start) / 4);
    var a = 1, sc = 1, dy = 0, txt = x.text, li = t - x.start, lo = x.end - t;
    if (x.anim !== 'none' && !still) {
      if (li < dIn) {
        var p = li / dIn;
        if (x.anim === 'fade') a = p;
        else if (x.anim === 'pop') { var b = 1.70158, q = p - 1; sc = 0.5 + 0.5 * (1 + (b + 1) * q * q * q + b * q * q); a = Math.min(1, p * 2); }
        else if (x.anim === 'slide') { dy = (1 - ease(p)) * Math.min(P.w, P.h) * 0.06; a = p; }
      }
      if (x.anim === 'type') { var n = Math.floor(Array.from(txt).length * clamp(li / Math.min(1.2, (x.end - x.start) * 0.6), 0, 1)); txt = Array.from(txt).slice(0, n).join(''); }
      if (lo < dOut) a *= clamp(lo / dOut, 0, 1);
    }
    var st = textStyle(x); ctx.font = st.font; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    var lines = wrap(ctx, x.text, P.w * 0.86), lh = st.px * 1.18, maxW = 0;
    lines.forEach(function (l) { maxW = Math.max(maxW, ctx.measureText(l).width); });
    var shown = x.anim === 'type' ? wrap(ctx, txt, P.w * 0.86) : lines;
    var cxp = x.x * P.w, cyp = x.y * P.h, hTot = lines.length * lh;
    var pad = st.px * 0.32;
    lastBox[x.id] = { x: cxp - maxW / 2 - pad, y: cyp - hTot / 2 - pad, w: maxW + pad * 2, h: hTot + pad * 2 };
    if (a <= 0.001) return;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(cxp, cyp + dy); ctx.scale(sc, sc);
    if (x.style === 'box') {
      ctx.fillStyle = x.color;
      lines.forEach(function (l, i) {
        if (!l) return; var w = ctx.measureText(l).width + pad * 2, y = -hTot / 2 + i * lh;
        roundRect(ctx, -w / 2, y - pad * 0.15, w, lh + pad * 0.3, st.px * 0.22); ctx.fill();
      });
    }
    shown.forEach(function (l, i) {
      var y = -hTot / 2 + i * lh + lh / 2;
      if (x.style === 'outline') { ctx.lineJoin = 'round'; ctx.lineWidth = st.px * 0.16; ctx.strokeStyle = x.color === '#000000' ? '#ffffff' : '#000000'; ctx.strokeText(l, 0, y); }
      if (x.style === 'shadow') { ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = st.px * 0.25; ctx.shadowOffsetY = st.px * 0.06; }
      if (x.style === 'glow') { ctx.shadowColor = x.color; ctx.shadowBlur = st.px * 0.5; }
      if (x.style === 'plain') { ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = st.px * 0.08; }
      ctx.fillStyle = x.style === 'box' ? contrast(x.color) : x.color;
      ctx.fillText(l, 0, y);
      if (x.style === 'glow') { ctx.shadowBlur = st.px * 0.15; ctx.fillText(l, 0, y); }
    });
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  // one frame at time t, in project pixels scaled by k
  function renderFrame(ctx, k, t, still) {
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, P.w, P.h);
    var at = P.clips.length ? clipAt(t) : null;
    if (at) drawClip(ctx, at, P.w, P.h);
    P.texts.forEach(function (x) { if (t >= x.start && t < x.end) drawText(ctx, x, t, still); });
  }
  var drawQ = false;
  function draw() {
    if (drawQ) return; drawQ = true;
    requestAnimationFrame(function () { drawQ = false; renderFrame(cx, cv.width / P.w, T, !playing); });
  }

  // ---------- playback ----------
  var t0 = 0, T0 = 0, raf = 0, lastClip = null;
  function vids() { return Object.keys(media).map(function (k) { return media[k]; }).filter(function (m) { return m.kind === 'video' || m.kind === 'audio'; }); }
  function syncMedia(t, run) {
    var at = P.clips.length ? clipAt(t) : null, cur = at && media[at.c.mid] && media[at.c.mid].kind === 'video' ? at : null;
    var active = {};
    if (cur) {
      var m = media[cur.c.mid], v = m.el, want = Math.min(m.dur - 0.02, cur.c.in + cur.local * cur.c.speed);
      active[m.id] = 1;
      v.playbackRate = cur.c.speed; v.volume = clamp(cur.c.mute ? 0 : cur.c.vol, 0, 1); v.muted = !!cur.c.mute || cur.c.vol <= 0;
      if (run) {
        if (v.paused || lastClip !== cur.c.id) { if (Math.abs(v.currentTime - want) > 0.08) v.currentTime = want; var pr = v.play(); if (pr) pr.catch(function () {}); }
        else if (Math.abs(v.currentTime - want) > 0.3) v.currentTime = want;
      } else if (Math.abs(v.currentTime - want) > 0.01) {
        v.currentTime = want;
        if (!v._sk) { v._sk = 1; v.addEventListener('seeked', function f() { v._sk = 0; v.removeEventListener('seeked', f); draw(); }); }
      }
      lastClip = cur.c.id;
    } else lastClip = null;
    P.audios.forEach(function (a) {
      var m = media[a.mid]; if (!m) return;
      var end = a.start + (a.out - a.in), inside = t >= a.start && t < end && t < total();
      if (!inside || !run) return;
      active[m.id] = 1;
      var want = a.in + (t - a.start), g = a.vol;
      if (a.fadeIn) g *= clamp((t - a.start) / 1, 0, 1);
      if (a.fadeOut) g *= clamp((Math.min(end, total()) - t) / 1.5, 0, 1);
      m.el.volume = clamp(g, 0, 1);
      if (m.el.paused) { m.el.currentTime = want; var pr = m.el.play(); if (pr) pr.catch(function () {}); }
      else if (Math.abs(m.el.currentTime - want) > 0.3) m.el.currentTime = want;
    });
    vids().forEach(function (m) { if (!active[m.id] && !m.el.paused) m.el.pause(); });
  }
  function play() {
    var D = total(); if (D <= 0) { toast('Эхлээд видео, зураг нэмнэ үү'); return; }
    if (T >= D - 0.05) T = 0;
    playing = true; t0 = performance.now(); T0 = T; lastClip = null;
    document.getElementById('v-play').innerHTML = ico('pause'); document.getElementById('v-play').setAttribute('aria-label', 'Зогсоох');
    P.texts.forEach(function (x) { loadFont(x.font); });
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function loop(now) {
    if (!playing) return;
    var t = T0 + (now - t0) / 1000, D = total();
    if (t >= D) { T = D; pause(); return; }
    T = t; syncMedia(T, true); renderFrame(cx, cv.width / P.w, T); setScroll(); timeLabel();
    raf = requestAnimationFrame(loop);
  }
  function pause() {
    playing = false; cancelAnimationFrame(raf);
    vids().forEach(function (m) { if (!m.el.paused) m.el.pause(); });
    document.getElementById('v-play').innerHTML = ico('play'); document.getElementById('v-play').setAttribute('aria-label', 'Тоглуулах');
    seek(T);
  }
  function seek(t) { T = clamp(t, 0, total()); syncMedia(T, false); draw(); timeLabel(); }
  function timeLabel() { document.getElementById('v-time').innerHTML = '<b>' + fmt(T) + '</b> / ' + fmt(total()); }

  // ---------- timeline ----------
  var progScroll = false;
  function pad() { return Math.round(scroller.clientWidth / 2); }
  function setScroll() { progScroll = true; scroller.scrollLeft = T * pps; requestAnimationFrame(function () { progScroll = false; }); }
  scroller.addEventListener('scroll', function () {
    if (progScroll || drag) return;
    if (playing) pause();
    seek(scroller.scrollLeft / pps);
  }, { passive: true });
  // two-finger pinch on the timeline zooms it (the zoom slider is hidden on phones)
  var pinch = null;
  scroller.addEventListener('touchstart', function (e) { if (e.touches.length === 2) { var a = e.touches[0], b = e.touches[1]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), p: pps }; } }, { passive: true });
  scroller.addEventListener('touchmove', function (e) {
    if (!pinch || e.touches.length !== 2) return;
    var a = e.touches[0], b = e.touches[1], d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    var np = Math.round(clamp(pinch.p * d / pinch.d, 20, 240)); if (np === pps) return;
    pps = np; document.getElementById('v-zoom').value = pps; renderTL();
  }, { passive: true });
  scroller.addEventListener('touchend', function (e) { if (e.touches.length < 2) pinch = null; }, { passive: true });
  function lanes(items, sf, ef) {
    var ends = [];
    items.slice().sort(function (a, b) { return sf(a) - sf(b); }).forEach(function (it) {
      var l = 0; while (ends[l] != null && ends[l] > sf(it) + 1e-3) l++;
      ends[l] = ef(it); it._lane = l;
    });
    return Math.max(1, ends.length);
  }
  function renderTL() {
    var p = pad(), D = Math.max(total(), 1), clipsEnd = clipsTotal();
    var w = p * 2 + D * pps + 90;
    tl.style.width = w + 'px';
    var h = '';
    // ruler: a label every 1/2/5/10 s depending on zoom
    var step = pps > 120 ? 1 : pps > 50 ? 2 : pps > 25 ? 5 : 10;
    h += '<div class="vtl-ruler" style="left:' + p + 'px;width:' + (D * pps) + 'px">';
    for (var s = 0; s <= D + 0.001; s += step) h += '<span style="left:' + (s * pps) + 'px">' + (s >= 60 ? Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2) : s + 'с') + '</span>';
    for (s = 0; s <= D; s += step / 2) h += '<i style="left:' + (s * pps) + 'px"></i>';
    h += '</div>';
    // main track
    h += '<div class="vtl-row r-v" style="left:' + p + 'px">';
    var x0 = 0;
    P.clips.forEach(function (c, i) {
      var m = media[c.mid] || {}, L = clipLen(c), on = sel && sel.k === 'clip' && sel.id === c.id;
      var bg = '';
      if (m.kind === 'video' && m.strip) bg = 'background-image:url(' + m.strip + ');background-size:' + (m.dur / c.speed * pps) + 'px 100%;background-position:' + (-c.in / c.speed * pps) + 'px 0;background-repeat:no-repeat;';
      else if (m.kind === 'image' && m.url) bg = 'background-image:url(' + m.url + ');';
      h += '<div class="it v' + (on ? ' on' : '') + '" data-k="clip" data-id="' + c.id + '" style="left:' + (x0 * pps) + 'px;width:' + Math.max(8, L * pps - 2) + 'px;' + bg + '">' +
        '<span class="nm">' + (c.speed !== 1 ? c.speed + '× · ' : '') + fmt(L) + (c.mute ? ' · 🔇' : '') + '</span><span class="hd l" data-h="l"></span><span class="hd r" data-h="r"></span></div>';
      h += '<button type="button" class="tr-badge" data-tr="' + c.id + '" style="position:absolute;left:' + (x0 * pps) + 'px;top:50%;transform:translate(-50%,-50%)" title="Шилжилт" aria-label="Шилжилт">' + (c.tr && c.tr !== 'none' ? '⇢' : '|') + '</button>';
      x0 += L;
    });
    h += '<button type="button" class="vtl-add" data-a="add" style="left:' + (clipsEnd * pps + 8) + 'px;top:0" title="Видео, зураг нэмэх" aria-label="Видео, зураг нэмэх">' + ico('plus') + '</button>';
    h += '</div>';
    // text + audio tracks
    function row(cls, items, k, sf, ef, label) {
      var n = lanes(items, sf, ef), lh = 36 / n, out = '<div class="vtl-row ' + cls + '" style="left:' + p + 'px;width:' + (D * pps) + 'px">';
      if (!items.length) out += '<span class="vtl-lab" style="top:10px;left:-' + (p - 10) + 'px">' + label + '</span>';
      items.forEach(function (it) {
        var on = sel && sel.k === k && sel.id === it.id, a = sf(it), b = ef(it);
        out += '<div class="it ' + (k === 'text' ? 't' : 'a') + (on ? ' on' : '') + '" data-k="' + k + '" data-id="' + it.id + '" style="left:' + (a * pps) + 'px;width:' + Math.max(10, (b - a) * pps - 2) + 'px;top:' + (it._lane * lh) + 'px;height:' + (lh - 2) + 'px;' +
          (k === 'audio' && media[it.mid] && media[it.mid].wave ? 'background-image:url(' + media[it.mid].wave + ');background-size:' + (media[it.mid].dur * pps) + 'px 100%;background-position:' + (-it.in * pps) + 'px 0;background-repeat:no-repeat;' : '') + '">' +
          '<span class="nm">' + esc(k === 'text' ? (it.text || 'Текст').replace(/\n/g, ' ') : '♪ ' + ((media[it.mid] || {}).name || 'Хөгжим')) + '</span><span class="hd l" data-h="l"></span><span class="hd r" data-h="r"></span></div>';
      });
      return out + '</div>';
    }
    h += row('r-t', P.texts, 'text', function (x) { return x.start; }, function (x) { return x.end; }, 'Т  Текст');
    h += row('r-a', P.audios, 'audio', function (a) { return a.start; }, function (a) { return a.start + (a.out - a.in); }, '♪  Хөгжим');
    tl.innerHTML = h;
    progScroll = true; scroller.scrollLeft = T * pps; requestAnimationFrame(function () { progScroll = false; });
    document.getElementById('v-empty').style.display = P.clips.length || P.texts.length ? 'none' : '';
    timeLabel();
  }

  // pointer: tap selects, handles trim, selected text / music bars drag along the time line
  var drag = null;
  tl.addEventListener('pointerdown', function (e) {
    var trb = e.target.closest('[data-tr]');
    if (trb) { e.preventDefault(); sel = { k: 'clip', id: trb.dataset.tr }; refresh(); sheetTrans(); return; }
    var it = e.target.closest('.it'); if (!it) return;
    var k = it.dataset.k, id = it.dataset.id, o = find(k, id); if (!o) return;
    var hd = e.target.closest('.hd'), wasSel = sel && sel.k === k && sel.id === id;
    drag = { k: k, id: id, h: hd ? hd.dataset.h : null, x: e.clientX, moved: false, snap: JSON.stringify(o), wasSel: wasSel, tap: !hd };
    if (hd || (wasSel && k !== 'clip')) { e.preventDefault(); try { it.setPointerCapture(e.pointerId); } catch (er) {} drag.cap = true; }
    if (playing) pause();
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 5) return;
    drag.moved = true;
    if (!drag.cap) { drag = null; return; }      // a plain swipe — the timeline scrolls
    var o = find(drag.k, drag.id), s = JSON.parse(drag.snap), d = dx / pps; if (!o) return;
    if (drag.k === 'clip') {
      var m = media[o.mid], maxSrc = m.kind === 'image' ? 3600 : m.dur;
      if (drag.h === 'l') o.in = clamp(s.in + d * s.speed, 0, s.out - 0.2 * s.speed);
      else if (drag.h === 'r') o.out = clamp(s.out + d * s.speed, s.in + 0.2 * s.speed, maxSrc);
      if (m.kind === 'image' && drag.h === 'l') { o.in = 0; o.out = clamp(s.out - d, 0.3, 3600); }
    } else if (drag.k === 'text') {
      var L = s.end - s.start;
      if (drag.h === 'l') o.start = clamp(s.start + d, 0, s.end - 0.2);
      else if (drag.h === 'r') o.end = Math.max(s.start + 0.2, s.end + d);
      else { o.start = Math.max(0, s.start + d); o.end = o.start + L; }
    } else {
      var md = media[o.mid];
      if (drag.h === 'l') { var nd = clamp(d, -s.in, (s.out - s.in) - 0.3); o.start = Math.max(0, s.start + nd); o.in = s.in + (o.start - s.start); }
      else if (drag.h === 'r') o.out = clamp(s.out + d, s.in + 0.3, md.dur);
      else o.start = Math.max(0, s.start + d);
    }
    renderTL(); draw();
  });
  window.addEventListener('pointerup', function () {
    if (!drag) return;
    var dr = drag; drag = null;
    if (dr.moved && dr.cap) { commit(); return; }
    if (!dr.moved) {
      if (dr.wasSel && dr.k === 'text') { sheetText(find('text', dr.id)); return; }
      sel = dr.wasSel ? null : { k: dr.k, id: dr.id };
      if (sel && sel.k === 'text') { var x = find('text', sel.id); if (T < x.start || T >= x.end) seek(x.start + 0.01); }
      refresh();
    }
  });
  window.addEventListener('pointercancel', function () { drag = null; });

  // ---------- preview: drag text on the canvas ----------
  var pdrag = null;
  function toProj(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * P.w, y: (e.clientY - r.top) / r.height * P.h }; }
  cv.addEventListener('pointerdown', function (e) {
    var p = toProj(e), hit = null;
    P.texts.slice().reverse().forEach(function (x) {
      var b = lastBox[x.id]; if (hit || !b || T < x.start || T >= x.end) return;
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) hit = x;
    });
    if (!hit) { if (playing) pause(); else if (sel) { sel = null; refresh(); } return; }
    e.preventDefault(); if (playing) pause();
    var again = sel && sel.k === 'text' && sel.id === hit.id;
    sel = { k: 'text', id: hit.id }; refreshTB(); renderTL();
    pdrag = { id: hit.id, p: p, x: hit.x, y: hit.y, moved: false, again: again };
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  });
  cv.addEventListener('pointermove', function (e) {
    if (!pdrag) return;
    var p = toProj(e), x = find('text', pdrag.id); if (!x) return;
    var nx = pdrag.x + (p.x - pdrag.p.x) / P.w, ny = pdrag.y + (p.y - pdrag.p.y) / P.h;
    if (!pdrag.moved && Math.abs(nx - pdrag.x) + Math.abs(ny - pdrag.y) < 0.006) return;
    pdrag.moved = true;
    var sx = Math.abs(nx - 0.5) < 0.02, sy = Math.abs(ny - 0.5) < 0.015;
    x.x = sx ? 0.5 : clamp(nx, 0, 1); x.y = sy ? 0.5 : clamp(ny, 0, 1);
    guides(sx, sy); draw();
  });
  cv.addEventListener('pointerup', function () {
    if (!pdrag) return;
    var d = pdrag; pdrag = null; guides(false, false);
    if (d.moved) commit(); else if (d.again) sheetText(find('text', d.id));
  });
  function guides(v, h) {
    var gv = document.getElementById('g-v'), gh = document.getElementById('g-h'), r = cv.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    gv.style.display = v ? 'block' : 'none'; gh.style.display = h ? 'block' : 'none';
    gv.style.left = (r.left - sr.left + r.width / 2) + 'px'; gv.style.top = (r.top - sr.top) + 'px'; gv.style.height = r.height + 'px';
    gh.style.top = (r.top - sr.top + r.height / 2) + 'px'; gh.style.left = (r.left - sr.left) + 'px'; gh.style.width = r.width + 'px';
  }

  // ---------- history + autosave ----------
  function snap() { return JSON.stringify({ name: P.name, w: P.w, h: P.h, bg: P.bg, clips: P.clips, texts: P.texts, audios: P.audios }); }
  function commit() { hist = hist.slice(0, hi + 1); hist.push(snap()); if (hist.length > 80) hist.shift(); hi = hist.length - 1; save(); refresh(); }
  function restore(s) {
    var o = JSON.parse(s); P.name = o.name; P.w = o.w; P.h = o.h; P.bg = o.bg; P.clips = o.clips; P.texts = o.texts; P.audios = o.audios;
    if (sel && !selected()) sel = null;
    fitCanvas(); refresh(); seek(Math.min(T, total())); save();
  }
  function undo() { if (hi > 0) { hi--; restore(hist[hi]); } }
  function redo() { if (hi < hist.length - 1) { hi++; restore(hist[hi]); } }

  var DB = null;
  function db() {
    if (DB) return DB;
    DB = new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error('no idb'));
      var r = indexedDB.open('gc-video', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); r.result.createObjectStore('media'); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
    DB.catch(function () {});
    return DB;
  }
  function idb(store, mode, fn) { return db().then(function (d) { return new Promise(function (res, rej) { var tx = d.transaction(store, mode), st = tx.objectStore(store), out = fn(st); tx.oncomplete = function () { res(out && out.result); }; tx.onerror = function () { rej(tx.error); }; }); }); }
  var saveT = 0;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      if (!started) return;
      var used = {}; P.clips.concat(P.audios).forEach(function (c) { used[c.mid] = 1; });
      idb('kv', 'readwrite', function (st) { st.put({ p: snap(), t: Date.now(), mids: Object.keys(used) }, 'project'); }).catch(function () {});
      idb('media', 'readwrite', function (st) {
        Object.keys(media).forEach(function (id) { var m = media[id]; if (used[id] && !m.saved) { st.put({ id: id, kind: m.kind, name: m.name, file: m.file }, id); m.saved = 1; } });
        var rq = st.getAllKeys(); rq.onsuccess = function () { rq.result.forEach(function (k) { if (!used[k]) st.delete(k); }); };
      }).catch(function () {});
    }, 800);
  }
  function loadSaved() { return idb('kv', 'readonly', function (st) { return st.get('project'); }).catch(function () { return null; }); }
  function resume(rec) {
    var o = JSON.parse(rec.p);
    return Promise.all(rec.mids.map(function (id) {
      return idb('media', 'readonly', function (st) { return st.get(id); }).then(function (r) { return r ? loadMedia(r.file, r.kind, id, r.name).then(function (m) { m.saved = 1; }) : null; }).catch(function () { return null; });
    })).then(function () {
      var ok = function (c) { return !!media[c.mid]; };
      P = { name: o.name, w: o.w, h: o.h, bg: o.bg, clips: o.clips.filter(ok), texts: o.texts, audios: o.audios.filter(ok) };
      begin();
    });
  }

  // ---------- media ----------
  function kindOf(f) { var t = f.type || '', n = (f.name || '').toLowerCase(); if (/^video\//.test(t) || /\.(mp4|mov|webm|m4v|mkv)$/.test(n)) return 'video'; if (/^image\//.test(t) || /\.(jpe?g|png|webp|gif|avif)$/.test(n)) return 'image'; if (/^audio\//.test(t) || /\.(mp3|m4a|aac|wav|ogg|opus|flac)$/.test(n)) return 'audio'; return null; }
  function loadMedia(file, kind, id, name) {
    id = id || uid(); kind = kind || kindOf(file);
    var url = URL.createObjectURL(file), m = { id: id, kind: kind, file: file, url: url, name: name || file.name || kind };
    return new Promise(function (res, rej) {
      if (kind === 'image') {
        var img = new Image(); img.onload = function () { m.el = img; m.w = img.naturalWidth; m.h = img.naturalHeight; m.dur = Infinity; res(m); }; img.onerror = function () { rej(new Error('img')); }; img.src = url; return;
      }
      var el = document.createElement(kind === 'video' ? 'video' : 'audio');
      el.preload = 'auto'; el.playsInline = true; el.setAttribute('playsinline', ''); el.crossOrigin = 'anonymous';
      el.onloadedmetadata = function () {
        m.el = el; m.w = el.videoWidth || 0; m.h = el.videoHeight || 0;
        if (isFinite(el.duration) && el.duration > 0) { m.dur = el.duration; return res(m); }
        // MediaRecorder WebM has no duration until the end is read
        el.currentTime = 1e7; el.ontimeupdate = function () { el.ontimeupdate = null; m.dur = el.duration; el.currentTime = 0; res(m); };
      };
      el.onerror = function () { rej(new Error('media')); };
      el.src = url;
      if (kind === 'video') { el.muted = false; el.style.display = 'none'; document.body.appendChild(el); }
    }).then(function (mm) { media[id] = mm; if (kind === 'video') makeStrip(mm); if (kind === 'audio') makeWave(mm); return mm; });
  }
  // one row of frames covering the whole source, used as the clip's background in the timeline
  function makeStrip(m) {
    var v = document.createElement('video'); v.muted = true; v.preload = 'auto'; v.playsInline = true; v.src = m.url;
    var n = clamp(Math.round(m.dur / 1.2), 2, 24), th = 64, tw = Math.round(th * (m.w || 16) / (m.h || 9)), c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = n * tw; c.height = th; var i = 0;
    function next() {
      if (i >= n) { m.strip = c.toDataURL('image/jpeg', 0.6); v.removeAttribute('src'); v.load(); renderTL(); return; }
      v.currentTime = Math.min(m.dur - 0.05, (i + 0.5) * m.dur / n);
    }
    v.onseeked = function () { try { x.drawImage(v, i * tw, 0, tw, th); } catch (e) {} i++; next(); };
    v.onloadeddata = next; v.onerror = function () {};
  }
  function decodeAudio(m) {
    if (m.audio !== undefined) return Promise.resolve(m.audio);
    var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!AC) return Promise.resolve(m.audio = null);
    return m.file.arrayBuffer().then(function (buf) {
      var c = new AC(2, 1, 48000);
      return new Promise(function (res) { c.decodeAudioData(buf, res, function () { res(null); }); });
    }).catch(function () { return null; }).then(function (b) { m.audio = b; return b; });
  }
  function makeWave(m) {
    decodeAudio(m).then(function (b) {
      if (!b) return;
      var n = Math.min(2000, Math.max(100, Math.round(b.duration * 20))), d = b.getChannelData(0), per = Math.floor(d.length / n), c = document.createElement('canvas');
      c.width = n; c.height = 40; var x = c.getContext('2d'); x.fillStyle = 'rgba(255,255,255,.55)';
      for (var i = 0; i < n; i++) { var mx = 0; for (var j = i * per; j < (i + 1) * per; j += 16) mx = Math.max(mx, Math.abs(d[j])); var hh = Math.max(1, mx * 38); x.fillRect(i, 20 - hh / 2, 1, hh); }
      m.wave = c.toDataURL(); renderTL();
    });
  }
  function addFiles(list) {
    var files = Array.prototype.slice.call(list || []).filter(function (f) { return kindOf(f); });
    if (!files.length) { toast('Видео, зураг, дуу (mp4, mov, jpg, png, mp3…) сонгоно уу'); return; }
    toast(files.length > 1 ? files.length + ' файл нэмж байна…' : 'Нэмж байна…');
    var at = sel && sel.k === 'clip' ? P.clips.findIndex(function (c) { return c.id === sel.id; }) + 1 : P.clips.length;
    var chain = Promise.resolve(), added = 0, firstNew = null;
    files.forEach(function (f) {
      chain = chain.then(function () { return loadMedia(f); }).then(function (m) {
        if (m.kind === 'audio') {
          var st = T < total() - 0.5 ? T : 0;
          P.audios.push({ id: uid(), mid: m.id, start: st, in: 0, out: m.dur, vol: 1, fadeIn: false, fadeOut: true }); added++; return;
        }
        var ar = (m.w || 1) / (m.h || 1), pr = P.w / P.h;
        var c = { id: uid(), mid: m.id, in: 0, out: m.kind === 'image' ? IMG_DUR : m.dur, speed: 1, vol: 1, mute: false, fit: Math.abs(ar / pr - 1) < 0.15 ? 'fill' : 'fit', tr: 'none', motion: m.kind === 'image' };
        P.clips.splice(at++, 0, c); added++; if (!firstNew) firstNew = c;
      }).catch(function () { toast('«' + f.name + '» файлыг нээж чадсангүй — энэ хөтөч уг форматыг дэмжихгүй байж магадгүй'); });
    });
    chain.then(function () {
      if (!added) return;
      commit();
      if (firstNew) { seek(startOf(firstNew.id) + 0.01); setScroll(); }
      toast(added + ' файл нэмэгдлээ');
    });
  }
  function pick(accept) { fileIn.accept = accept; fileIn.value = ''; fileIn.click(); }
  fileIn.addEventListener('change', function () { addFiles(fileIn.files); });
  var dragDepth = 0;
  window.addEventListener('dragenter', function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0) { dragDepth++; drop.classList.add('show'); } });
  window.addEventListener('dragleave', function () { if (--dragDepth <= 0) { dragDepth = 0; drop.classList.remove('show'); } });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); dragDepth = 0; drop.classList.remove('show'); if (!started) { begin(); } addFiles(e.dataTransfer.files); });

  // ---------- edit actions ----------
  function splitSel() {
    var o = selected();
    if (!o) { var at = clipAt(T); if (!at) return; sel = { k: 'clip', id: at.c.id }; o = at.c; }
    if (sel.k === 'clip') {
      var st = startOf(o.id), loc = T - st, L = clipLen(o);
      if (loc < 0.1 || loc > L - 0.1) return toast('Шугамыг клипийн дунд аваачаад хуваана уу');
      var c2 = JSON.parse(JSON.stringify(o)); c2.id = uid(); c2.tr = 'none';
      var cut = o.in + loc * o.speed;
      if (media[o.mid].kind === 'image') { o.out = loc; c2.in = 0; c2.out = L - loc; } else { o.out = cut; c2.in = cut; }
      P.clips.splice(P.clips.indexOf(o) + 1, 0, c2);
    } else if (sel.k === 'text') {
      if (T <= o.start + 0.1 || T >= o.end - 0.1) return toast('Шугамыг текстийн дунд аваачаад хуваана уу');
      var t2 = JSON.parse(JSON.stringify(o)); t2.id = uid(); t2.start = T; o.end = T; P.texts.push(t2);
    } else {
      var aEnd = o.start + (o.out - o.in);
      if (T <= o.start + 0.1 || T >= aEnd - 0.1) return toast('Шугамыг хөгжмийн дунд аваачаад хуваана уу');
      var a2 = JSON.parse(JSON.stringify(o)); a2.id = uid(); a2.in = o.in + (T - o.start); a2.start = T; o.out = a2.in; P.audios.push(a2);
    }
    commit(); toast('Хуваалаа');
  }
  function delSel() {
    if (!sel) return;
    var l = sel.k === 'clip' ? P.clips : sel.k === 'text' ? P.texts : P.audios, i = l.findIndex(function (x) { return x.id === sel.id; });
    if (i >= 0) l.splice(i, 1);
    sel = null; commit(); seek(Math.min(T, total()));
  }
  function dupSel() {
    var o = selected(); if (!o) return;
    var c = JSON.parse(JSON.stringify(o)); c.id = uid();
    if (sel.k === 'clip') P.clips.splice(P.clips.indexOf(o) + 1, 0, c);
    else if (sel.k === 'text') { var L = o.end - o.start; c.start = o.end; c.end = o.end + L; P.texts.push(c); }
    else { c.start = o.start + (o.out - o.in); P.audios.push(c); }
    sel = { k: sel.k, id: c.id }; commit();
  }
  function moveClip(d) {
    var o = selected(); if (!o || sel.k !== 'clip') return;
    var i = P.clips.indexOf(o), j = i + d; if (j < 0 || j >= P.clips.length) return;
    P.clips.splice(i, 1); P.clips.splice(j, 0, o); commit(); seek(startOf(o.id) + 0.01); setScroll();
  }
  function addText() {
    var D = total(), st = D > 0 && T < D - 0.3 ? T : 0;
    var x = { id: uid(), text: '', start: st, end: D > 0 ? Math.min(Math.max(D, st + 1), st + TXT_DUR) : st + TXT_DUR, x: 0.5, y: P.h > P.w ? 0.62 : 0.5, size: 0.075, font: 'Montserrat', weight: 800, style: 'outline', color: '#ffffff', anim: 'pop' };
    P.texts.push(x); sel = { k: 'text', id: x.id }; loadFont(x.font); seek(st + 0.01); renderTL(); refreshTB();
    sheetText(x, true);
  }

  // ---------- toolbar ----------
  function tbtn(a, ic, label, cls) { return '<button type="button" class="tb' + (cls ? ' ' + cls : '') + '" data-a="' + a + '">' + ico(ic) + '<span>' + label + '</span></button>'; }
  function refreshTB() {
    var h = '';
    if (!sel || !selected()) {
      h = tbtn('add', 'plus', 'Медиа') + tbtn('text', 'text', 'Текст') + tbtn('music', 'music', 'Хөгжим') + tbtn('size', 'size', 'Хэмжээ') + tbtn('bg', 'color', 'Дэвсгэр');
    } else if (sel.k === 'clip') {
      var m = media[selected().mid] || {};
      h = tbtn('desel', 'back', '', 'back') + tbtn('split', 'split', 'Хуваах') + (m.kind === 'video' ? tbtn('speed', 'speed', 'Хурд') + tbtn('vol', 'vol', 'Дуу') : '') +
        tbtn('fit', 'fit', 'Харагдац') + tbtn('trans', 'trans', 'Шилжилт') + tbtn('mleft', 'left', 'Урагш') + tbtn('mright', 'right', 'Хойш') + tbtn('dup', 'dup', 'Хувилах') + tbtn('del', 'del', 'Устгах', 'danger');
    } else if (sel.k === 'text') {
      h = tbtn('desel', 'back', '', 'back') + tbtn('tedit', 'edit', 'Засах') + tbtn('split', 'split', 'Хуваах') + tbtn('dup', 'dup', 'Хувилах') + tbtn('del', 'del', 'Устгах', 'danger');
    } else {
      h = tbtn('desel', 'back', '', 'back') + tbtn('split', 'split', 'Хуваах') + tbtn('avol', 'vol', 'Дуу') + tbtn('dup', 'dup', 'Хувилах') + tbtn('del', 'del', 'Устгах', 'danger');
    }
    tb.innerHTML = h;
  }
  function refresh() { refreshTB(); renderTL(); draw(); document.getElementById('v-undo').disabled = hi <= 0; document.getElementById('v-redo').disabled = hi >= hist.length - 1; document.getElementById('v-size').innerHTML = ico('size') + '<span>' + sizeName() + '</span>'; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b || b.closest('.sheet')) return;
    var a = b.dataset.a;
    if (a === 'add') pick('video/*,image/*');
    else if (a === 'text') addText();
    else if (a === 'music') pick('audio/*');
    else if (a === 'size') sheetSize();
    else if (a === 'bg') sheetBg();
    else if (a === 'desel') { sel = null; refresh(); }
    else if (a === 'split') splitSel();
    else if (a === 'del') delSel();
    else if (a === 'dup') dupSel();
    else if (a === 'mleft') moveClip(-1);
    else if (a === 'mright') moveClip(1);
    else if (a === 'speed') sheetSpeed();
    else if (a === 'vol' || a === 'avol') sheetVol();
    else if (a === 'fit') sheetFit();
    else if (a === 'trans') sheetTrans();
    else if (a === 'tedit') sheetText(selected());
  });
  document.getElementById('v-play').addEventListener('click', function () { playing ? pause() : play(); });
  document.getElementById('v-undo').addEventListener('click', undo);
  document.getElementById('v-redo').addEventListener('click', redo);
  document.getElementById('v-zoom').addEventListener('input', function () { pps = +this.value; renderTL(); });
  document.getElementById('v-size').addEventListener('click', sheetSize);
  document.getElementById('v-export').addEventListener('click', sheetExport);
  var nameIn = document.getElementById('v-name');
  nameIn.addEventListener('change', function () { P.name = nameIn.value.trim() || 'Нэргүй видео'; commit(); });
  document.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.sheet')) return;
    var mod = e.ctrlKey || e.metaKey;
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    else if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); delSel(); }
    else if (e.key.toLowerCase() === 's' && !mod) splitSel();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); if (playing) pause(); seek(T + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : 1 / FPS)); setScroll(); }
  });

  // ---------- sheets ----------
  var sheetClose = null;
  function sheet(title, body, onClose) {
    closeSheet();
    var bg = document.createElement('div'); bg.className = 'sheet-bg';
    var s = document.createElement('div'); s.className = 'sheet'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', title);
    s.innerHTML = '<div class="grab"></div><h3>' + title + '<button type="button" class="done">Болсон</button></h3>' + body;
    document.body.appendChild(bg); document.body.appendChild(s);
    sheetClose = function () { bg.remove(); s.remove(); sheetClose = null; if (onClose) onClose(); };
    bg.addEventListener('click', closeSheet); s.querySelector('.done').addEventListener('click', closeSheet);
    return s;
  }
  function closeSheet() { if (sheetClose) sheetClose(); }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetClose) closeSheet(); });
  function opts(list, cur, attr) { return '<div class="opts">' + list.map(function (o) { return '<button type="button" class="opt' + (String(o[0]) === String(cur) ? ' on' : '') + '" data-' + attr + '="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function onOpt(s, attr, fn) { s.addEventListener('click', function (e) { var b = e.target.closest('[data-' + attr + ']'); if (!b) return; s.querySelectorAll('[data-' + attr + ']').forEach(function (x) { x.classList.toggle('on', x === b); }); fn(b.getAttribute('data-' + attr)); }); }
  function changed() { renderTL(); draw(); }

  function sizeCards(cur) {
    return '<div class="sizes">' + SIZES.map(function (s) {
      var k = 56 / Math.max(s.w, s.h);
      return '<button type="button" class="size' + (cur && cur.w === s.w && cur.h === s.h ? ' on' : '') + '" data-size="' + s.w + 'x' + s.h + '"><span class="shape" style="width:' + Math.round(s.w * k) + 'px;height:' + Math.round(s.h * k) + 'px">' + (s.id === '4x3' ? '4:3' : s.id.replace('x', ':')) + '</span><b>' + s.name + '</b><small>' + s.sub + '<br>' + s.w + '×' + s.h + '</small></button>';
    }).join('') + '<button type="button" class="size" data-size="custom"><span class="shape" style="width:44px;height:34px;border-style:dashed">W×H</span><b>Өөрийн хэмжээ</b><small>Өргөн, өндрөө оруулна</small></button></div>' +
      '<div class="custom" id="v-custom" hidden><input type="number" id="v-cw" min="128" max="3840" value="' + (cur ? cur.w : 1080) + '" aria-label="Өргөн"> × <input type="number" id="v-ch" min="128" max="3840" value="' + (cur ? cur.h : 1350) + '" aria-label="Өндөр"><button type="button" class="btn-x" id="v-cok">Сонгох</button></div>';
  }
  function bindSizes(box, apply) {
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-size]'); if (b) {
        if (b.dataset.size === 'custom') { box.querySelector('#v-custom').hidden = false; box.querySelector('#v-cw').focus(); return; }
        var p = b.dataset.size.split('x'); apply(+p[0], +p[1]); return;
      }
      if (e.target.closest('#v-cok')) {
        var w = Math.round(+box.querySelector('#v-cw').value), h = Math.round(+box.querySelector('#v-ch').value);
        if (!(w >= 128 && h >= 128 && w <= 3840 && h <= 3840)) return toast('Өргөн, өндөр 128–3840 пиксел байна');
        apply(w - w % 2, h - h % 2);
      }
    });
  }
  function setSize(w, h) {
    if (w === P.w && h === P.h) return;
    var pr = w / h;
    P.clips.forEach(function (c) { var m = media[c.mid]; if (m && m.w) c.fit = Math.abs((m.w / m.h) / pr - 1) < 0.15 ? 'fill' : 'fit'; });
    P.w = w; P.h = h; fitCanvas(); commit();
  }
  function sheetSize() { var s = sheet('Хэмжээ', sizeCards(P) + '<p class="note">Хэмжээ солиход хэвтээ видео босоо дэлгэцэнд бүдэг дэвсгэртэйгээр багтана — «Харагдац»-аас дүүргэж болно.</p>'); bindSizes(s, function (w, h) { setSize(w, h); closeSheet(); }); }
  function sheetBg() {
    var s = sheet('Дэвсгэр өнгө', '<div class="opts">' + ['#000000', '#ffffff', '#111827', '#7b64ff', '#ff3b5c', '#ffe600', '#22c55e', '#38bdf8'].map(function (c) { return '<button type="button" class="sw' + (P.bg === c ? ' on' : '') + '" style="background:' + c + '" data-bgc="' + c + '" aria-label="' + c + '"></button>'; }).join('') + '<label class="sw pick" title="Өөр өнгө"><input type="color" id="v-bgp" value="' + P.bg + '"></label></div><p class="note">Зураг, видеогүй хэсэг болон шилжилтэд харагдана.</p>', commit);
    onOpt(s, 'bgc', function (c) { P.bg = c; draw(); });
    s.querySelector('#v-bgp').addEventListener('input', function () { P.bg = this.value; draw(); });
  }
  function sheetSpeed() {
    var c = selected();
    var s = sheet('Хурд', opts(SPEEDS.map(function (v) { return [v, v + '×']; }), c.speed, 'sp') + '<p class="note">Удаашруулахад (0.5×) хөдөлгөөн зөөлөн, хурдасгахад (2×) богино болно. Дуу нь хурдтайгаа хамт өөрчлөгдөнө.</p>', commit);
    onOpt(s, 'sp', function (v) { c.speed = +v; changed(); });
  }
  function sheetVol() {
    var o = selected(), isA = sel.k === 'audio';
    var s = sheet(isA ? 'Хөгжмийн дуу' : 'Клипийн дуу',
      '<label class="lbl">Дууны түвшин</label><div class="rowv"><input type="range" id="v-vol" min="0" max="100" value="' + Math.round(o.vol * 100) + '"><b id="v-volv">' + Math.round(o.vol * 100) + '%</b></div>' +
      (isA ? '<label class="lbl">Эхлэл, төгсгөл</label><div class="opts"><button type="button" class="opt' + (o.fadeIn ? ' on' : '') + '" data-fd="in">Зөөлөн эхлэх</button><button type="button" class="opt' + (o.fadeOut ? ' on' : '') + '" data-fd="out">Зөөлөн дуусах</button></div>'
        : '<label class="lbl">Дуугүй болгох</label>' + opts([['0', 'Дуутай'], ['1', 'Дуугүй']], o.mute ? '1' : '0', 'mu')), commit);
    s.querySelector('#v-vol').addEventListener('input', function () { o.vol = this.value / 100; s.querySelector('#v-volv').textContent = this.value + '%'; if (!isA) o.mute = o.vol === 0; changed(); });
    if (isA) s.addEventListener('click', function (e) { var b = e.target.closest('[data-fd]'); if (!b) return; var k = b.dataset.fd === 'in' ? 'fadeIn' : 'fadeOut'; o[k] = !o[k]; b.classList.toggle('on', o[k]); });
    else onOpt(s, 'mu', function (v) { o.mute = v === '1'; changed(); });
  }
  function sheetFit() {
    var c = selected(), m = media[c.mid];
    var s = sheet('Харагдац', opts([['fill', 'Дүүргэх'], ['fit', 'Багтаах (бүдэг дэвсгэр)']], c.fit, 'fit') +
      (m.kind === 'image' ? '<label class="lbl">Хөдөлгөөн</label>' + opts([['1', 'Аажим томрох'], ['0', 'Хөдөлгөөнгүй']], c.motion ? '1' : '0', 'mo') : '') +
      '<p class="note">«Дүүргэх» — дэлгэцийг бүтэн дүүргэж, илүү хэсгийг тайрна. «Багтаах» — бүхлээр нь харуулж, хоосон хэсгийг бүдэг дэвсгэрээр дүүргэнэ.</p>', commit);
    onOpt(s, 'fit', function (v) { c.fit = v; draw(); });
    onOpt(s, 'mo', function (v) { c.motion = v === '1'; draw(); });
  }
  function sheetTrans() {
    var c = selected(); if (!c || sel.k !== 'clip') return;
    var s = sheet('Шилжилт', opts(TRANS, c.tr || 'none', 'tr') + '<p class="note">Энэ клип эхлэхэд тоглогдоно (0.5 сек).</p><button type="button" class="btn-g" id="v-trall" style="margin-top:12px;width:100%">Бүх клипт хэрэглэх</button>', commit);
    onOpt(s, 'tr', function (v) { c.tr = v; seek(startOf(c.id) + 0.02); renderTL(); });
    s.querySelector('#v-trall').addEventListener('click', function () { P.clips.forEach(function (x, i) { if (i > 0 || c.tr === 'fade') x.tr = c.tr; }); renderTL(); toast('Бүх клипт хэрэглэлээ'); });
  }
  function sheetText(x, fresh) {
    if (!x) return;
    var before = JSON.stringify(x);
    var s = sheet('Текст',
      '<textarea id="v-tt" placeholder="Текстээ бичнэ үү" aria-label="Текст">' + esc(x.text) + '</textarea>' +
      '<label class="lbl">Хэв маяг</label><div class="styles">' + STYLES.map(function (st) { return '<button type="button" data-st="' + st[0] + '" class="' + (x.style === st[0] ? 'on' : '') + '" title="' + st[1] + '" style="' + styleTile(st[0]) + '">Аа</button>'; }).join('') + '</div>' +
      '<label class="lbl">Өнгө</label><div class="opts">' + COLORS.map(function (c) { return '<button type="button" class="sw' + (x.color === c ? ' on' : '') + '" style="background:' + c + '" data-col="' + c + '" aria-label="' + c + '"></button>'; }).join('') + '<label class="sw pick" title="Өөр өнгө"><input type="color" id="v-tc" value="' + x.color + '"></label></div>' +
      '<label class="lbl">Фонт</label><div class="opts">' + FONTS.map(function (f) { return '<button type="button" class="opt' + (x.font === f ? ' on' : '') + '" data-fo="' + f + '" style="font-family:\'' + f + '\',Inter">' + f + '</button>'; }).join('') + '</div>' +
      '<label class="lbl">Хэмжээ</label><div class="rowv"><input type="range" id="v-ts" min="3" max="20" step="0.5" value="' + (x.size * 100) + '"><b id="v-tsv">' + Math.round(x.size * 100) + '</b></div>' +
      '<label class="lbl">Гарч ирэх</label>' + opts(ANIMS, x.anim, 'an') +
      '<p class="note">Дэлгэц дээр текстийг чирж байрлуулна. Хэр удаан харагдахыг доорх timeline-ий шар мөрийн захаас чирж өөрчилнө.</p>',
      function () {
        if (!x.text.trim()) { P.texts = P.texts.filter(function (t) { return t !== x; }); sel = null; if (fresh) { refresh(); return; } }
        if (fresh || JSON.stringify(x) !== before) commit(); else refresh();
      });
    FONTS.forEach(loadFont);
    var ta = s.querySelector('#v-tt');
    setTimeout(function () { ta.focus(); }, 60);
    ta.addEventListener('input', function () { x.text = ta.value; changed(); });
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-st]'); if (b) { s.querySelectorAll('[data-st]').forEach(function (q) { q.classList.toggle('on', q === b); }); x.style = b.dataset.st; draw(); }
    });
    onOpt(s, 'col', function (c) { x.color = c; draw(); });
    s.querySelector('#v-tc').addEventListener('input', function () { x.color = this.value; draw(); });
    onOpt(s, 'fo', function (f) { x.font = f; loadFont(f).then(draw); draw(); });
    s.querySelector('#v-ts').addEventListener('input', function () { x.size = this.value / 100; s.querySelector('#v-tsv').textContent = Math.round(this.value); draw(); });
    onOpt(s, 'an', function (a) { x.anim = a; seek(x.start + 0.01); play(); setTimeout(function () { if (playing && T > x.start + 1.2) pause(); }, 1300); });
  }
  function styleTile(st) {
    if (st === 'outline') return 'color:#fff;-webkit-text-stroke:1.5px #000;paint-order:stroke fill;background:#55556a';
    if (st === 'box') return 'color:#111;background:#fff';
    if (st === 'shadow') return 'color:#fff;text-shadow:0 2px 6px #000';
    if (st === 'glow') return 'color:#fff;text-shadow:0 0 8px #a497ff,0 0 16px #7b64ff';
    return 'color:#fff';
  }

  // ---------- export (WebCodecs → MP4) ----------
  function even(n) { n = Math.round(n); return n - n % 2; }
  function pickVideo(W, H) {
    var big = W * H > 2228224, list = (big ? ['avc1.640033', 'avc1.4d0033'] : ['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.640033']).map(function (c) { return [c, 'avc']; })
      .concat([['vp09.00.40.08', 'vp9'], ['av01.0.08M.08', 'av1']]);
    var br = Math.round(clamp(W * H * FPS * 0.13, 2e6, 24e6));
    return list.reduce(function (p, c) {
      return p.then(function (got) {
        if (got) return got;
        var cfg = { codec: c[0], width: W, height: H, bitrate: br, framerate: FPS };
        if (c[1] === 'avc') cfg.avc = { format: 'avc' };
        return VideoEncoder.isConfigSupported(cfg).then(function (r) { return r.supported ? { cfg: cfg, mux: c[1] } : null; }).catch(function () { return null; });
      });
    }, Promise.resolve(null));
  }
  function pickAudio() {
    if (!window.AudioEncoder) return Promise.resolve(null);
    return [['mp4a.40.2', 'aac'], ['opus', 'opus']].reduce(function (p, c) {
      return p.then(function (got) {
        if (got) return got;
        var cfg = { codec: c[0], sampleRate: 48000, numberOfChannels: 2, bitrate: 160000 };
        return AudioEncoder.isConfigSupported(cfg).then(function (r) { return r.supported ? { cfg: cfg, mux: c[1] } : null; }).catch(function () { return null; });
      });
    }, Promise.resolve(null));
  }
  function mixAudio(D) {
    var srcs = [];
    P.clips.forEach(function (c, i) { var m = media[c.mid]; if (m.kind === 'video' && !c.mute && c.vol > 0) srcs.push({ c: c, m: m, start: startOf(c.id) }); });
    P.audios.forEach(function (a) { srcs.push({ a: a, m: media[a.mid] }); });
    if (!srcs.length) return Promise.resolve(null);
    return Promise.all(srcs.map(function (s) { return decodeAudio(s.m); })).then(function (bufs) {
      if (!bufs.some(Boolean)) return null;
      var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext, ctx = new AC(2, Math.max(1, Math.ceil(D * 48000)), 48000);
      srcs.forEach(function (s, i) {
        var b = bufs[i]; if (!b) return;
        var src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; src.connect(g); g.connect(ctx.destination);
        if (s.c) {
          src.playbackRate.value = s.c.speed; g.gain.value = s.c.vol;
          src.start(s.start, Math.min(s.c.in, b.duration), Math.max(0, Math.min(s.c.out, b.duration) - s.c.in));
        } else {
          var a = s.a, len = a.out - a.in, end = Math.min(a.start + len, D);
          if (a.start >= D) return;
          g.gain.setValueAtTime(a.fadeIn ? 0 : a.vol, a.start);
          if (a.fadeIn) g.gain.linearRampToValueAtTime(a.vol, Math.min(end, a.start + 1));
          if (a.fadeOut) { g.gain.setValueAtTime(a.vol, Math.max(a.start, end - 1.5)); g.gain.linearRampToValueAtTime(0, end); }
          src.start(a.start, a.in, end - a.start);
        }
      });
      return ctx.startRendering();
    });
  }
  function seekV(v, t) {
    return new Promise(function (res) {
      if (Math.abs(v.currentTime - t) < 0.001 && v.readyState >= 2) return res();
      var done = false, to = setTimeout(fin, 4000);
      function fin() { if (done) return; done = true; clearTimeout(to); v.removeEventListener('seeked', fin); res(); }
      v.addEventListener('seeked', fin); v.currentTime = t;
    });
  }
  // frames for export: play the source muted and take each presented frame (requestVideoFrameCallback) — ~4× faster than
  // seeking every frame; falls back to seeking where rVFC is missing or the video drifted
  var RVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype, curV = null;
  function watch(v) {
    if (v._w) return; v._w = 1; v._mt = -1;
    var cb = function (now, md) { v._mt = md.mediaTime; v.requestVideoFrameCallback(cb); };
    v.requestVideoFrameCallback(cb);
  }
  function frameAt(m, c, target) {
    var v = m.el;
    if (!RVFC) return seekV(v, target);
    watch(v); v.muted = true;
    var tol = 0.5 / FPS * c.speed;
    var restart = curV !== v || v.paused || v.ended || v._mt > target + 0.12 * c.speed || v._mt < target - 0.6 * c.speed;
    var go = restart ? (function () {
      if (curV && curV !== v) curV.pause();
      curV = v; v.pause();
      return seekV(v, target).then(function () { v._mt = v.currentTime; v.playbackRate = c.speed; var pr = v.play(); return pr ? pr.catch(function () {}) : null; });
    })() : Promise.resolve();
    return go.then(function () {
      if (v._mt >= target - tol) return;
      return new Promise(function (res) {
        var t0 = performance.now();
        (function w() {
          if (v._mt >= target - tol || v.ended || v.currentTime >= m.dur - 0.05) return res();
          if (performance.now() - t0 > 2500) { v.pause(); return seekV(v, target).then(res); }
          setTimeout(w, 4);
        })();
      });
    });
  }
  var exporting = null;
  function sheetExport() {
    if (!total()) return toast('Эхлээд видео, зураг эсвэл текст нэмнэ үү');
    pause();
    var s = sheet('Видео татах',
      '<label class="lbl">Файлын нэр</label><input type="text" id="v-xname" value="' + esc(P.name) + '" spellcheck="false">' +
      '<label class="lbl">Чанар</label>' + opts([['1', 'Бүрэн (' + P.w + '×' + P.h + ')'], ['720', 'Хурдан (720p)']], '1', 'q') +
      '<p class="note">Урт: ' + fmt(total()) + ' · 30 кадр/сек · MP4. Видео зөвхөн энэ төхөөрөмж дээр бэлтгэгдэнэ — дуустал энэ хуудсыг хаалгүй байгаарай.</p>' +
      '<div id="v-xout"><button type="button" class="btn-x" id="v-xgo" style="width:100%;margin-top:14px;height:46px">' + ico('dl') + 'MP4 бэлтгэх</button></div>',
      function () { if (exporting) exporting.cancel = true; });
    var q = '1'; onOpt(s, 'q', function (v) { q = v; });
    s.querySelector('#v-xname').addEventListener('change', function () { P.name = this.value.trim() || 'Нэргүй видео'; nameIn.value = P.name; save(); });
    s.querySelector('#v-xgo').addEventListener('click', function () { runExport(s, q === '720' ? 720 : 0); });
  }
  function runExport(s, cap) {
    var out = s.querySelector('#v-xout');
    if (!window.VideoEncoder || !window.VideoFrame || !window.Mp4Muxer) { out.innerHTML = '<p class="note" style="color:#fca5a5">Энэ хөтөч видео бэлтгэхийг дэмжихгүй байна. Chrome, Edge эсвэл Safari-ийн шинэ хувилбараар оролдоно уу.</p>'; return; }
    var k = cap ? Math.min(1, cap / Math.min(P.w, P.h)) : 1, W = even(P.w * k), H = even(P.h * k), D = total(), N = Math.max(1, Math.round(D * FPS));
    out.innerHTML = '<div class="xprog"><i id="v-xbar"></i></div><p class="note" id="v-xst">Бэлтгэж байна…</p><button type="button" class="btn-g" id="v-xcancel" style="width:100%;margin-top:10px">Цуцлах</button>';
    var bar = s.querySelector('#v-xbar'), st = s.querySelector('#v-xst'), job = exporting = { cancel: false };
    s.querySelector('#v-xcancel').addEventListener('click', function () { job.cancel = true; });
    var cvs = document.createElement('canvas'); cvs.width = W; cvs.height = H; var ctx = cvs.getContext('2d', { alpha: false });
    var muxer, venc, aenc, err = null, t0 = performance.now();
    function prog(p, msg) { bar.style.width = Math.round(p * 100) + '%'; if (msg) st.textContent = msg; }
    Promise.all([pickVideo(W, H), pickAudio(), Promise.all(P.texts.map(function (x) { return loadFont(x.font); })), mixAudio(D)]).then(function (r) {
      var vc = r[0], ac = r[1], abuf = r[3];
      if (!vc) throw new Error('Энэ хөтөч MP4 видео кодлох боломжгүй байна.');
      if (abuf && !ac) toast('Энэ хөтөч дуу кодлохгүй тул видео дуугүй гарна');
      muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), fastStart: 'in-memory', firstTimestampBehavior: 'offset',
        video: { codec: vc.mux, width: W, height: H, frameRate: FPS }, audio: abuf && ac ? { codec: ac.mux, numberOfChannels: 2, sampleRate: 48000 } : undefined });
      venc = new VideoEncoder({ output: function (ch, meta) { muxer.addVideoChunk(ch, meta); }, error: function (e) { err = e; } });
      venc.configure(vc.cfg);
      vids().forEach(function (m) { m.el.pause(); });
      var i = 0;
      function frame() {
        if (job.cancel) throw new Error('cancel');
        if (err) throw err;
        if (i >= N) { if (curV) { curV.pause(); curV = null; } return venc.flush(); }
        var t = i / FPS, at = P.clips.length ? clipAt(t) : null, wait = Promise.resolve();
        if (at && media[at.c.mid].kind === 'video') { var m = media[at.c.mid]; wait = frameAt(m, at.c, Math.min(m.dur - 0.01, at.c.in + at.local * at.c.speed)); }
        else if (curV) { curV.pause(); curV = null; }
        return wait.then(function () {
          renderFrame(ctx, W / P.w, t);
          var vf = new VideoFrame(cvs, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
          venc.encode(vf, { keyFrame: i % (FPS * 2) === 0 }); vf.close(); i++;
          if (i % 6 === 0) {
            var el = (performance.now() - t0) / 1000, left = el / i * (N - i);
            prog(i / N * 0.9, 'Кадр ' + i + ' / ' + N + (i > 30 ? ' · ~' + Math.max(1, Math.round(left)) + ' сек үлдлээ' : ''));
          }
          var q = venc.encodeQueueSize > 6 ? new Promise(function (r2) { (function w() { if (venc.encodeQueueSize <= 2) r2(); else setTimeout(w, 5); })(); }) : null;
          return q ? q.then(frame) : (i % 4 ? frame() : new Promise(function (r3) { setTimeout(r3, 0); }).then(frame));
        });
      }
      return frame().then(function () {
        if (!abuf || !ac) return;
        prog(0.93, 'Дуу бэлтгэж байна…');
        aenc = new AudioEncoder({ output: function (ch, meta) { muxer.addAudioChunk(ch, meta); }, error: function (e) { err = e; } });
        aenc.configure(ac.cfg);
        var L = abuf.length, c0 = abuf.getChannelData(0), c1 = abuf.numberOfChannels > 1 ? abuf.getChannelData(1) : c0, step = 4800;
        for (var o = 0; o < L; o += step) {
          var n = Math.min(step, L - o), data = new Float32Array(n * 2);
          data.set(c0.subarray(o, o + n), 0); data.set(c1.subarray(o, o + n), n);
          var ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(o / 48000 * 1e6), data: data });
          aenc.encode(ad); ad.close();
        }
        return aenc.flush();
      });
    }).then(function () {
      if (err) throw err;
      muxer.finalize();
      var blob = new Blob([muxer.target.buffer], { type: 'video/mp4' }), url = URL.createObjectURL(blob), fname = (P.name || 'video').replace(/[\\/:*?"<>|]+/g, '_') + '.mp4';
      exporting = null; prog(1);
      var canShare = false;
      try { canShare = !!(navigator.canShare && navigator.canShare({ files: [new File([blob], fname, { type: 'video/mp4' })] })); } catch (e) {}
      out.innerHTML = '<video class="xvid" src="' + url + '" controls playsinline></video><div class="xbtns"><a class="btn-x" href="' + url + '" download="' + esc(fname) + '">' + ico('dl') + 'Татах (' + (blob.size / 1048576).toFixed(1) + ' MB)</a>' +
        (canShare ? '<button type="button" class="btn-g" id="v-share">Хуваалцах / Хадгалах</button>' : '') + '</div><p class="note">Бэлтгэсэн хугацаа: ' + Math.round((performance.now() - t0) / 1000) + ' сек.</p>';
      var sh = out.querySelector('#v-share');
      if (sh) sh.addEventListener('click', function () { navigator.share({ files: [new File([blob], fname, { type: 'video/mp4' })], title: P.name }).catch(function () {}); });
    }).catch(function (e) {
      exporting = null; if (curV) { curV.pause(); curV = null; }
      try { if (venc && venc.state !== 'closed') venc.close(); if (aenc && aenc.state !== 'closed') aenc.close(); } catch (er) {}
      if (e && e.message === 'cancel') { out.innerHTML = '<p class="note">Цуцаллаа.</p><button type="button" class="btn-x" id="v-xgo2" style="width:100%;margin-top:10px">Дахин эхлүүлэх</button>'; }
      else out.innerHTML = '<p class="note" style="color:#fca5a5">Видео бэлтгэж чадсангүй: ' + esc((e && e.message) || e) + '</p><button type="button" class="btn-x" id="v-xgo2" style="width:100%;margin-top:10px">Дахин оролдох</button>';
      var b = out.querySelector('#v-xgo2'); if (b) b.addEventListener('click', function () { runExport(s, cap); });
      seek(T);
    });
  }

  // ---------- start screen ----------
  function startScreen(saved) {
    var s = document.createElement('div'); s.className = 'vstart';
    s.innerHTML = '<div class="in"><div class="top"><a class="logo" href="/tools/" style="color:#fff;text-decoration:none;font:400 20px/1 iBrand,Inter,sans-serif;display:flex;gap:8px;align-items:center"><span class="orb" style="width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0,#c9c0ff 18%,#7b64ff 60%,#34229e 100%)"></span>Graphican</a></div>' +
      '<h2>Видео хийх</h2><p class="sub">Хэмжээгээ сонгоод видео, зургаа нэмнэ. Тайрах, текст, хөгжим, шилжилт — бүгд нэг дор.</p>' +
      (saved ? '<div class="resume"><span><b>Өмнөх төсөл</b><small>' + esc(JSON.parse(saved.p).name) + ' · ' + new Date(saved.t).toLocaleString() + '</small></span><button type="button" class="btn-x" id="v-res">Үргэлжлүүлэх</button></div>' : '') +
      sizeCards(null) +
      '<div class="feat"><span>Файл серверт очихгүй</span><span>Монгол фонт</span><span>MP4 татах</span><span>Бүртгэлгүй, үнэгүй</span></div></div>';
    document.body.appendChild(s);
    bindSizes(s, function (w, h) { P = blank(w, h); s.remove(); begin(); });
    var r = s.querySelector('#v-res');
    if (r) r.addEventListener('click', function () { r.disabled = true; r.textContent = 'Нээж байна…'; resume(saved).then(function () { s.remove(); }); });
  }
  function begin() {
    started = true;
    document.querySelectorAll('.vstart').forEach(function (x) { x.remove(); });
    nameIn.value = P.name; hist = []; hi = -1; T = 0;
    fitCanvas(); commit(); seek(0);
  }
  refresh(); fitCanvas();
  loadSaved().then(function (rec) { if (!started) startScreen(rec && rec.p ? rec : null); });

  // test hook
  window.GVideo = { get P() { return P; }, media: media, seek: seek, play: play, pause: pause, total: total, addFiles: addFiles, renderFrame: renderFrame, mixAudio: mixAudio, runExport: runExport, sheetExport: sheetExport, begin: function (w, h) { P = blank(w, h); begin(); } };
})();
