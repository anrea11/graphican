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
  var TRGROUPS = [['Энгийн', [['none', 'Байхгүй'], ['fade', 'Бүдгэрэх'], ['dipb', 'Хар руу'], ['flash', 'Цагаан гялбаа'], ['blur', 'Бүдэг']]],
    ['Хөдөлгөөн', [['slide', 'Түлхэх'], ['cover', 'Хучих'], ['zoom', 'Томрох'], ['zoomout', 'Холдох'], ['spin', 'Эргэх'], ['flip', 'Хөрвөх'], ['shake', 'Цохилт']]],
    ['Хэлбэр', [['wipe', 'Арчих'], ['diag', 'Налуу'], ['circle', 'Дугуй'], ['doors', 'Хаалга'], ['stripes', 'Хөшиг']]],
    ['Эффект', [['glitch', 'Глитч'], ['pixel', 'Пиксел']]]];
  var TR_DIR = { slide: 1, cover: 1, wipe: 1 }, TR_COL = { dipb: 1, flash: 1 };
  var FX_COL = { flash: '#ffffff', leak: '#ff9640', duotone: '#7b64ff', sparkle: '#ffffff', snow: '#ffffff', frame: '#ffffff', cinema: '#000000', strobe: '#000000' };
  // colour presets = canvas filter strings (warmth, vignette and the sliders are added on top in filterOf / drawTone)
  var FILTERS = [['none', 'Байхгүй', ''], ['vivid', 'Тод', 'saturate(1.45) contrast(1.08)'], ['warm', 'Дулаан', 'sepia(.22) saturate(1.3) hue-rotate(-6deg)'],
    ['cool', 'Сэрүүн', 'saturate(1.05) hue-rotate(10deg) brightness(1.04)'], ['bw', 'Хар цагаан', 'grayscale(1) contrast(1.1)'], ['vintage', 'Хуучин', 'sepia(.45) contrast(.92) brightness(1.05) saturate(.85)'],
    ['film', 'Кино', 'contrast(1.15) saturate(.8) brightness(.96)'], ['fade', 'Бүдэг', 'contrast(.84) brightness(1.1) saturate(.75)'], ['drama', 'Драм', 'contrast(1.35) saturate(1.15) brightness(.9)'],
    ['dream', 'Зүүд', 'brightness(1.12) saturate(1.25) contrast(.9)'], ['noir', 'Нуар', 'grayscale(1) contrast(1.55) brightness(.85)'], ['sunset', 'Нар жаргах', 'sepia(.35) saturate(1.6) hue-rotate(-16deg) contrast(1.05)']];
  var FXCATS = [['Хөдөлгөөн', [['shake', 'Чичиргээ'], ['pulse', 'Цохилт'], ['zoomp', 'Томрох цохилт'], ['swing', 'Савлах'], ['spin', 'Эргэлдэх']]],
    ['Гэрэл', [['flash', 'Анивчих'], ['strobe', 'Стробо'], ['leak', 'Гэрлийн туяа'], ['glow', 'Гэрэлтэх'], ['sparkle', 'Од гялалзах'], ['snow', 'Цас']]],
    ['Ретро', [['vhs', 'VHS'], ['oldfilm', 'Хуучин кино'], ['grain', 'Ширхэг'], ['glitch', 'Глитч'], ['rgb', 'RGB салах']]],
    ['Өнгө', [['bwflash', 'Хар цагаан анивчих'], ['fadebw', 'Өнгө алдах'], ['rainbow', 'Солонго'], ['duotone', 'Хоёр өнгө'], ['invert', 'Урвуу']]],
    ['Дэлгэц', [['mirror', 'Толин'], ['grid', '4 дэлгэц'], ['split3', '3 дэлгэц'], ['pixel', 'Пиксел'], ['cinema', 'Кино хүрээ'], ['frame', 'Цагаан хүрээ'], ['blurpulse', 'Бүдэгрэх']]]];
  var MOTIONS = [['none', 'Хөдөлгөөнгүй'], ['in', 'Томрох'], ['out', 'Холдох'], ['left', 'Зүүн тийш'], ['right', 'Баруун тийш'], ['up', 'Дээш']];
  var OANIMS = [['none', 'Байхгүй'], ['fade', 'Бүдгэрэх'], ['pop', 'Үсрэх'], ['slide', 'Доороос'], ['zoom', 'Томрох'], ['spin', 'Эргэх']];
  var TPRESETS = [
    ['title', 'Гарчиг', { size: 0.1, font: 'Montserrat', weight: 800, style: 'outline', color: '#ffffff', anim: 'pop', y: 0.3 }],
    ['sub', 'Хадмал', { size: 0.048, font: 'Inter', weight: 700, style: 'box', color: '#000000', anim: 'fade', y: 0.8 }],
    ['tag', 'Шошго', { size: 0.06, font: 'Rubik', weight: 800, style: 'box', color: '#ffe600', anim: 'slide' }],
    ['neon', 'Неон', { size: 0.08, font: 'Comfortaa', weight: 700, style: 'glow', color: '#38bdf8', anim: 'fade' }],
    ['hand', 'Бичмэл', { size: 0.09, font: 'Caveat', weight: 700, style: 'shadow', color: '#ffffff', anim: 'type' }],
    ['bold', 'Хүчтэй', { size: 0.085, font: 'Oswald', weight: 700, style: 'box', color: '#ff3b5c', anim: 'pop' }]];
  var EMOJI = '😀 😂 🥰 😍 😎 🤩 😮 😭 😡 🥳 🤔 🙏 👍 👏 👋 💪 🔥 ✨ ⭐ 🌟 💯 ❤️ 💜 💙 💚 💛 🧡 🖤 💔 💥 💫 🎉 🎁 🎂 🎵 🎶 📍 📌 📣 💡 ✅ ❌ ⚠️ ❓ ❗ 👉 👇 👆 ➡️ ⬇️ 🔴 🟢 🔵 ⏰ 📅 💰 🛒 🏆 🥇 📸 🎬 🎤 🎧 🌈 ☀️ 🌙 ❄️ 🌸 🌹 🍀 🐎 🏔️ 🍕 ☕ 🚀 ✈️ 🏠 😴 🤣 🫶'.split(' ');

  // ---------- state ----------
  var P = blank(1080, 1920);
  var media = {};          // id → { id, kind, file, url, el, dur, w, h, strip, wave, audio (AudioBuffer|null|undefined) }
  var sel = null;          // { k: 'clip'|'text'|'audio'|'over', id }
  var T = 0, playing = false, pps = 70, hist = [], hi = -1, started = false;
  function blank(w, h) { return { name: 'Нэргүй видео', w: w, h: h, bg: '#000000', clips: [], texts: [], audios: [], overlays: [], markers: [] }; }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // speed ramps: speed multiplier over the clip's source (0…1); the clip's output time ↔ source time goes through a table
  var RAMPS = [['none', 'Байхгүй', null], ['montage', 'Монтаж', [[0, 1.6], [0.35, 1.6], [0.5, 0.4], [0.65, 1.6], [1, 1.6]]],
    ['hero', 'Баатар', [[0, 1], [0.35, 1], [0.45, 0.25], [0.6, 0.25], [0.7, 1], [1, 1]]], ['bullet', 'Сум', [[0, 2.5], [0.42, 2.5], [0.5, 0.15], [0.58, 2.5], [1, 2.5]]],
    ['jump', 'Үсрэлт', [[0, 0.6], [0.2, 0.6], [0.25, 3], [0.45, 3], [0.5, 0.6], [0.7, 0.6], [0.75, 3], [1, 3]]], ['flashin', 'Хурдан эхлэх', [[0, 4], [0.3, 1], [1, 1]]],
    ['flashout', 'Хурдан дуусах', [[0, 1], [0.7, 1], [1, 4]]], ['slowmid', 'Дунд нь удаан', [[0, 1.5], [0.5, 0.45], [1, 1.5]]]];
  var rampCache = {};
  function rampPts(c) { if (!c.ramp || c.ramp === 'none') return null; var r = RAMPS.filter(function (x) { return x[0] === c.ramp; })[0]; return r && r[2]; }
  function curveAt(pts, p) {
    for (var i = 1; i < pts.length; i++) if (p <= pts[i][0]) { var a = pts[i - 1], b = pts[i], f = (p - a[0]) / ((b[0] - a[0]) || 1); return a[1] + (b[1] - a[1]) * f; }
    return pts[pts.length - 1][1];
  }
  function rampTab(c) {
    var key = c.ramp + '|' + c.in + '|' + c.out + '|' + c.speed, t = rampCache[c.id];
    if (t && t.key === key) return t;
    var pts = rampPts(c), N = 240, ts = new Float64Array(N + 1), sl = c.out - c.in;
    for (var i = 0; i < N; i++) ts[i + 1] = ts[i] + sl / N / (c.speed * curveAt(pts, (i + 0.5) / N));
    return (rampCache[c.id] = { key: key, ts: ts, L: ts[N], N: N });
  }
  function clipLen(c) { return Math.max(0.05, rampPts(c) ? rampTab(c).L : (c.out - c.in) / c.speed); }
  // source time shown at `local` seconds into the clip, and the playback rate there
  function srcAt(c, local) {
    if (!rampPts(c)) return c.in + local * c.speed;
    var t = rampTab(c), ts = t.ts, lo = 0, hi2 = t.N;
    if (local <= 0) return c.in; if (local >= t.L) return c.out;
    while (hi2 - lo > 1) { var mid = (lo + hi2) >> 1; if (ts[mid] <= local) lo = mid; else hi2 = mid; }
    return c.in + (c.out - c.in) * (lo + (local - ts[lo]) / ((ts[lo + 1] - ts[lo]) || 1)) / t.N;
  }
  function rateAt(c, local) { var pts = rampPts(c); if (!pts) return c.speed; return c.speed * curveAt(pts, (srcAt(c, local) - c.in) / ((c.out - c.in) || 1)); }
  function avgSpeed(c) { return (c.out - c.in) / clipLen(c); }
  function clipsTotal() { return P.clips.reduce(function (s, c) { return s + clipLen(c); }, 0); }
  function total() {
    var t = clipsTotal();
    if (t > 0) return t;
    var m = 0;
    P.texts.forEach(function (x) { m = Math.max(m, x.end); });
    P.audios.forEach(function (a) { m = Math.max(m, a.start + (a.out - a.in)); });
    P.overlays.forEach(function (o) { m = Math.max(m, o.end); });
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
  function listOf(k) { return k === 'clip' ? P.clips : k === 'text' ? P.texts : k === 'over' ? P.overlays : P.audios; }
  function find(k, id) { var l = listOf(k); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
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
    replace: '<path d="M4 7h13l-3-3M20 17H7l3 3"/>', minus: '<path d="M5 12h14"/>', fitw: '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
    mark: '<path d="M6 21V4h11l-2 4 2 4H6"/>', magnet: '<path d="M6 3v8a6 6 0 0 0 12 0V3"/><path d="M6 7h4M14 7h4"/><path d="M10 3v8a2 2 0 0 0 4 0V3"/>', start: '<path d="M6 4v16M18 12L9 18V6z"/>',
    stock: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    sticker: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    layer: '<rect x="3" y="3" width="13" height="13" rx="2"/><rect x="8" y="8" width="13" height="13" rx="2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    filter: '<circle cx="9" cy="9" r="5.5"/><circle cx="15" cy="9" r="5.5"/><circle cx="12" cy="15" r="5.5"/>',
    adj: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    fx: '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 15l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
    freeze: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/>', extract: '<path d="M3 12h3l2-5 4 10 2-5h7"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14"/>', chroma: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/>',
    front: '<rect x="8" y="8" width="12" height="12" rx="2" fill="currentColor"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>', back2: '<rect x="4" y="4" width="12" height="12" rx="2"/><path d="M20 8v10a2 2 0 0 1-2 2H8"/>',
    shape: '<rect x="3" y="3" width="8" height="8" rx="2"/><circle cx="17" cy="17" r="4"/><path d="M17 3l4 7h-8z"/>', rec: '<circle cx="12" cy="12" r="8" fill="currentColor"/>'
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
    '<div class="vmain"><nav class="vrail" id="v-rail" aria-label="Нэмэх"></nav><div class="vcenter">' +
    '<div class="vstage" id="v-stage"><canvas id="v-cv"></canvas><div class="guide v" id="g-v"></div><div class="guide h" id="g-h"></div>' +
    '<div class="selbox" id="v-sel" hidden><i class="tl" data-hd="s"></i><i class="tr" data-hd="s"></i><i class="bl" data-hd="s"></i><i class="br" data-hd="s"></i><i class="rot" data-hd="r"></i></div>' +
    '<div class="vempty" id="v-empty"><b>Видео, зургаа нэмээд эхлээрэй</b><span>Файлууд тань серверт очихгүй — зөвхөн энэ төхөөрөмж дээр засагдана</span><button class="btn-x" type="button" data-a="add">' + ico('plus') + 'Видео, зураг нэмэх</button></div></div>' +
    '<div class="vtr"><div class="tgrp">' +
    '<button class="ib" id="v-tsplit" type="button" data-a="split" title="Хуваах (S)" aria-label="Хуваах">' + ico('split') + '</button>' +
    '<button class="ib" id="v-tdel" type="button" data-a="del" title="Устгах (Delete)" aria-label="Устгах">' + ico('del') + '</button>' +
    '<button class="ib dk" id="v-tdup" type="button" data-a="dup" title="Хувилах (Ctrl+D)" aria-label="Хувилах">' + ico('dup') + '</button>' +
    '<button class="ib dk" id="v-tfreeze" type="button" data-a="freeze" title="Кадр царцаах" aria-label="Кадр царцаах">' + ico('freeze') + '</button>' +
    '<span class="sep dk"></span><button class="ib dk" id="v-tmark" type="button" data-a="mark" title="Тэмдэг тавих / арилгах (M)" aria-label="Тэмдэг">' + ico('mark') + '</button>' +
    '<button class="ib tog" id="v-tsnap" type="button" data-a="snapt" title="Соронз: ирмэг, шугам, тэмдэгт наалдах (N)" aria-label="Соронз">' + ico('magnet') + '</button></div>' +
    '<span class="time" id="v-time"></span>' +
    '<div class="tmid"><button class="ib" id="v-undo" type="button" title="Буцаах (Ctrl+Z)" aria-label="Буцаах">' + ico('undo') + '</button>' +
    '<button class="play" id="v-play" type="button" aria-label="Тоглуулах">' + ico('play') + '</button>' +
    '<button class="ib" id="v-redo" type="button" title="Дахин хийх (Ctrl+Y)" aria-label="Дахин хийх">' + ico('redo') + '</button></div>' +
    '<div class="tzoom"><button class="ib" id="v-zout" type="button" title="Жижигрүүлэх (−)" aria-label="Жижигрүүлэх">' + ico('minus') + '</button>' +
    '<input class="zoom" id="v-zoom" type="range" min="20" max="240" value="70" aria-label="Timeline томруулах" title="Timeline томруулах">' +
    '<button class="ib" id="v-zin" type="button" title="Томруулах (+)" aria-label="Томруулах">' + ico('plus') + '</button>' +
    '<button class="ib" id="v-zfit" type="button" title="Бүхлээр харах" aria-label="Бүхлээр харах">' + ico('fitw') + '</button></div></div></div>' +
    '<aside class="vpanel" id="v-panel"><div class="ph"><b id="v-ptitle"></b><small id="v-psub"></small></div><div class="ptools" id="v-ptools"></div><div id="v-pbody"></div></aside></div>' +
    '<div class="vtl"><div class="vtl-tracks" aria-hidden="true"><span class="k-v">' + ico('fit') + 'Видео, зураг</span><span class="k-o">' + ico('layer') + 'Давхар</span><span class="k-t">' + ico('text') + 'Текст</span><span class="k-a">' + ico('music') + 'Дуу, хөгжим</span></div><div class="vtl-scroll" id="v-scroll"><div class="vtl-inner" id="v-tl"></div></div><div class="vtl-head"></div></div>' +
    '<nav class="vtb" id="v-tb" aria-label="Хэрэгсэл"></nav>';
  var cv = document.getElementById('v-cv'), cx = cv.getContext('2d'), stage = document.getElementById('v-stage');
  var scroller = document.getElementById('v-scroll'), tl = document.getElementById('v-tl'), tb = document.getElementById('v-tb');
  // computer: tools on the left, settings of the selected item docked on the right (phone: bottom bar + bottom sheets)
  var desk = window.matchMedia('(min-width: 1024px)'), rail = document.getElementById('v-rail'), ptools = document.getElementById('v-ptools'), pbody = document.getElementById('v-pbody');
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
  var keyC = document.createElement('canvas'), keyX = keyC.getContext('2d', { willReadFrequently: true });
  var fxC = document.createElement('canvas'), fxX = fxC.getContext('2d');
  var HAS_FILTER = 'filter' in blurX;
  var lastBox = {};       // text / overlay id → { cx, cy, w, h, rot } in project px (hit-testing + the selection box)
  function ease(p) { return 1 - Math.pow(1 - p, 3); }
  function backOut(p) { var b = 1.70158, q = p - 1; return 1 + (b + 1) * q * q * q + b * q * q; }
  function srcWH(m, el) { el = el || m.el; return m.kind === 'video' ? [el.videoWidth || m.w, el.videoHeight || m.h] : [m.w, m.h]; }
  function motionOf(c) { return c.motion === true ? 'in' : c.motion || 'none'; }
  // colour preset (+ optional strength) + sliders → one ctx.filter string; W = frame width for the blur radius
  function filterOf(o, W, noPreset) {
    var f = '', pr = noPreset ? null : FILTERS.filter(function (x) { return x[0] === o.filter; })[0], a = o.adj;
    if (pr && pr[2]) f += pr[2];
    if (a) {
      if (a.br) f += ' brightness(' + (1 + a.br / 200).toFixed(3) + ')';
      if (a.ct) f += ' contrast(' + (1 + a.ct / 200).toFixed(3) + ')';
      if (a.sat) f += ' saturate(' + (1 + a.sat / 100).toFixed(3) + ')';
      if (a.hue) f += ' hue-rotate(' + Math.round(a.hue * 1.8) + 'deg)';
      if (a.blur) f += ' blur(' + (a.blur / 100 * 14 * (W || P.w) / 1080).toFixed(2) + 'px)';
    }
    return f.trim() || 'none';
  }
  // noise tiles for film grain (made once)
  var noiseT = null;
  function noise() {
    if (noiseT) return noiseT;
    noiseT = [0, 1, 2, 3].map(function () {
      var c = document.createElement('canvas'); c.width = c.height = 160; var x = c.getContext('2d'), d = x.createImageData(160, 160);
      for (var i = 0; i < d.data.length; i += 4) { var v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      x.putImageData(d, 0, 0); return c;
    });
    return noiseT;
  }
  function grainOver(ctx, W, H, alpha, t) {
    var n = noise()[Math.floor(t * 24) % 4], pat = ctx.createPattern(n, 'repeat');
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = alpha; ctx.fillStyle = pat;
    ctx.translate(-((t * 997) % 160), -((t * 613) % 160)); ctx.fillRect(0, 0, W + 160, H + 160); ctx.restore();
  }
  // warmth / tint (soft-light washes), faded blacks, grain and vignette, drawn over the frame
  function drawTone(ctx, a, W, H, t) {
    if (!a) return;
    if (a.warm) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = a.warm > 0 ? 'rgba(255,140,30,' + (a.warm / 130).toFixed(3) + ')' : 'rgba(40,120,255,' + (-a.warm / 130).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (a.tint) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = a.tint > 0 ? 'rgba(255,40,200,' + (a.tint / 150).toFixed(3) + ')' : 'rgba(40,255,90,' + (-a.tint / 150).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (a.fade) { ctx.save(); ctx.globalCompositeOperation = 'lighten'; ctx.fillStyle = 'rgba(70,70,70,' + (a.fade / 100).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (a.grain) grainOver(ctx, W, H, a.grain / 120, t || 0);
    if (a.vig) {
      var r = Math.hypot(W, H) / 2, g = ctx.createRadialGradient(W / 2, H / 2, r * (0.75 - a.vig / 300), W / 2, H / 2, r);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + Math.min(0.95, a.vig / 105).toFixed(3) + ')');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }
  function drawMedia(ctx, c, W, H, t) {
    var m = media[c.mid]; if (!m || !m.el) return;
    if (m.kind === 'video' && m.el.readyState < 2) return;
    var wh = srcWH(m), sw = wh[0], sh = wh[1]; if (!sw || !sh) return;
    var rot = (((c.rot || 0) % 360) + 360) % 360, side = rot === 90 || rot === 270, fw = side ? sh : sw, fh = side ? sw : sh;
    var cover = Math.max(W / fw, H / fh), contain = Math.min(W / fw, H / fh);
    if (c.fit === 'fit') {
      // blurred, slightly dark copy behind — CapCut style
      var bw = 48, bh = Math.max(1, Math.round(48 * H / W));
      if (blurC.width !== bw || blurC.height !== bh) { blurC.width = bw; blurC.height = bh; }
      var k0 = Math.max(bw / sw, bh / sh);
      blurX.drawImage(m.el, (bw - sw * k0) / 2, (bh - sh * k0) / 2, sw * k0, sh * k0);
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(blurC, -W * 0.05, -H * 0.05, W * 1.1, H * 1.1); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
    var k = (c.fit === 'fit' ? contain : cover) * (c.zoom || 1), p = clamp(t / Math.max(0.1, clipLen(c)), 0, 1), mo = motionOf(c), mx = 0, my = 0;
    if (mo === 'in') k *= 1 + 0.1 * p;
    else if (mo === 'out') k *= 1.1 - 0.1 * p;
    else if (mo !== 'none') { k *= 1.14; var d = (0.5 - p) * 0.1; if (mo === 'up') my = d * H; else mx = (mo === 'left' ? d : -d) * W; }
    var dw = sw * k, dh = sh * k;
    ctx.save(); ctx.translate(W / 2 + (c.px || 0) * W + mx, H / 2 + (c.py || 0) * H + my);
    if (rot) ctx.rotate(rot * Math.PI / 180);
    if (c.flip) ctx.scale(-1, 1);
    ctx.drawImage(m.el, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }
  function zoomAt(ctx, W, H, z) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); }
  // one clip frame: position/filters/adjustments + its effect; the effect can run on part of the clip, at its own speed and colour
  function drawClip(ctx, at, W, H, xf) {
    var c = at.c, real = at.local, fx = c.fx || 'none', A = (c.fxAmt == null ? 50 : c.fxAmt) / 50, tf = xf || '', L = clipLen(c);
    var f0 = c.fxFrom || 0, f1 = c.fxTo == null ? 1e9 : c.fxTo;
    if (real < f0 || real > f1) fx = 'none';
    var lt = (real - f0) * (c.fxSpd || 1), FC = c.fxCol || FX_COL[fx] || null;
    ctx.save();
    // movement effects
    if (fx === 'shake') { ctx.translate((Math.sin(lt * 53) * 0.012 + Math.sin(lt * 31) * 0.006) * W * A, Math.cos(lt * 47) * H * 0.008 * A); zoomAt(ctx, W, H, 1 + 0.05 * A); }
    else if (fx === 'pulse') zoomAt(ctx, W, H, 1 + 0.07 * A * Math.pow(1 - ((lt * 2) % 1), 3));
    else if (fx === 'zoomp') zoomAt(ctx, W, H, 1 + 0.2 * A * Math.pow(Math.max(0, 1 - (lt % 1) / 0.3), 2));
    else if (fx === 'swing') { ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin(lt * 3) * 0.07 * A); ctx.scale(1.12, 1.12); ctx.translate(-W / 2, -H / 2); }
    else if (fx === 'spin') { ctx.translate(W / 2, H / 2); ctx.rotate(lt * 0.5 * A); var sz = Math.hypot(W, H) / Math.min(W, H); ctx.scale(sz, sz); ctx.translate(-W / 2, -H / 2); }
    // colour effects through the filter
    var add = '';
    if (fx === 'bwflash' && Math.floor(lt * 2) % 2 === 1) add = 'grayscale(1) contrast(1.25)';
    else if (fx === 'vhs') add = 'saturate(.8) contrast(1.1)';
    else if (fx === 'oldfilm') add = 'sepia(.65) contrast(1.12) brightness(' + (0.9 + 0.1 * rnd(Math.floor(lt * 12))).toFixed(3) + ')';
    else if (fx === 'rainbow') add = 'hue-rotate(' + Math.round(lt * 140 * A) % 360 + 'deg) saturate(1.3)';
    else if (fx === 'invert') add = 'invert(' + Math.min(1, A).toFixed(2) + ')';
    else if (fx === 'duotone') add = 'grayscale(1) contrast(1.2)';
    else if (fx === 'fadebw') add = 'grayscale(' + clamp(lt / Math.max(0.5, (Math.min(f1, L) - f0) * (c.fxSpd || 1) * 0.8), 0, 1).toFixed(3) + ')';
    else if (fx === 'blurpulse') add = 'blur(' + (Math.pow(Math.abs(Math.sin(lt * 2.2)), 3) * 10 * A * W / 1080).toFixed(2) + 'px)';
    else if (fx === 'strobe' && Math.floor(lt * 10) % 2) add = 'brightness(' + (1 + 0.6 * A).toFixed(2) + ')';
    var str = c.fstr == null ? 100 : c.fstr, full = filterOf(c, W), base = str < 100 && c.filter && c.filter !== 'none' ? filterOf(c, W, true) : full;
    function withAdd(f) { f = (f === 'none' ? '' : f) + (add ? ' ' + add : '') + (tf ? ' ' + tf : ''); return f.trim() || 'none'; }
    if (HAS_FILTER) ctx.filter = withAdd(base);
    drawMedia(ctx, c, W, H, real);
    if (base !== full) { ctx.save(); ctx.globalAlpha *= str / 100; if (HAS_FILTER) ctx.filter = withAdd(full); drawMedia(ctx, c, W, H, real); ctx.restore(); }
    ctx.filter = 'none';
    drawTone(ctx, c.adj, W, H, real);
    ctx.restore();
    if (fx !== 'none') postFx(ctx, fx, lt, A, W, H, FC);
  }
  // ---------- transitions: the previous clip (its last frame) and the incoming clip drawn together ----------
  function trDur(c) { return clamp(c.trd || TR, 0.1, Math.max(0.1, clipLen(c) - 0.05)); }
  function trEase(c, p) {
    var e = c.tre || 'smooth';
    return e === 'lin' ? p : e === 'out' ? 1 - Math.pow(1 - p, 3) : e === 'in' ? p * p * p : (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  }
  function dirV(c) { return { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[c.trdir || 'left']; }
  function hexA(hex, a) { var n = parseInt((hex || '#000000').slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + clamp(a, 0, 1).toFixed(3) + ')'; }
  function pixelate(ctx, bs) {
    var cvv = ctx.canvas, w = cvv.width, h = cvv.height, pw = Math.max(1, Math.round(w / bs)), ph = Math.max(1, Math.round(h / bs));
    if (pixC.width !== pw || pixC.height !== ph) { pixC.width = pw; pixC.height = ph; }
    pixX.drawImage(cvv, 0, 0, pw, ph); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(pixC, 0, 0, w, h); ctx.restore();
  }
  function slices(ctx, g, seed) {
    var cvv = ctx.canvas, w = cvv.width, h = cvv.height;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (var i = 0; i < 8; i++) { var sy = Math.floor(rnd(seed + i * 7.1) * h), sh = Math.max(2, Math.floor(rnd(seed + i * 3.3) * h * 0.08)), off = Math.round((rnd(seed + i * 5.7) - 0.5) * w * 0.2 * g); ctx.drawImage(cvv, 0, sy, w, sh, off, sy, w, sh); }
    ctx.restore();
  }
  function drawTrans(ctx, A, B, W, H) {
    var c = B.c, raw = clamp(B.local / trDur(c), 0, 1), p = trEase(c, raw), v = dirV(c), t = c.tr, k = W / 1080;
    function dA(fn, xf) { if (!A) return; ctx.save(); if (fn) fn(); drawClip(ctx, A, W, H, xf); ctx.restore(); }
    function dB(fn, xf) { ctx.save(); if (fn) fn(); drawClip(ctx, B, W, H, xf); ctx.restore(); }
    function fill(col, a) { ctx.fillStyle = hexA(col, a); ctx.fillRect(0, 0, W, H); }
    function clipB(path) { dA(); dB(function () { ctx.beginPath(); path(); ctx.clip(); }); }
    if (t === 'fade') { dA(); dB(function () { ctx.globalAlpha = p; }); }
    else if (t === 'dipb' || t === 'flash') { var col = c.trc || (t === 'dipb' ? '#000000' : '#ffffff'); if (p < 0.5) { dA(); fill(col, p * 2); } else { dB(); fill(col, (1 - p) * 2); } }
    else if (t === 'zoom') { dA(function () { zoomAt(ctx, W, H, 1 + 0.6 * p); }); dB(function () { zoomAt(ctx, W, H, 1.4 - 0.4 * p); ctx.globalAlpha = clamp(p * 1.6 - 0.3, 0, 1); }); }
    else if (t === 'zoomout') { dB(function () { zoomAt(ctx, W, H, 1.25 - 0.25 * p); }); dA(function () { zoomAt(ctx, W, H, 1 - 0.7 * p); ctx.globalAlpha = 1 - p; }); }
    else if (t === 'slide') { dA(function () { ctx.translate(v[0] * p * W, v[1] * p * H); }); dB(function () { ctx.translate(-v[0] * (1 - p) * W, -v[1] * (1 - p) * H); }); }
    else if (t === 'cover') { dA(); dB(function () { ctx.translate(-v[0] * (1 - p) * W, -v[1] * (1 - p) * H); ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 40 * k; }); }
    else if (t === 'wipe') clipB(function () { if (v[0] < 0) ctx.rect(W * (1 - p), 0, W * p, H); else if (v[0] > 0) ctx.rect(0, 0, W * p, H); else if (v[1] < 0) ctx.rect(0, H * (1 - p), W, H * p); else ctx.rect(0, 0, W, H * p); });
    else if (t === 'diag') clipB(function () { var d = (W + H) * p; ctx.moveTo(0, 0); ctx.lineTo(d, 0); ctx.lineTo(0, d); ctx.closePath(); });
    else if (t === 'circle') clipB(function () { ctx.arc(W / 2, H / 2, Math.hypot(W, H) / 2 * p, 0, 6.2832); });
    else if (t === 'stripes') clipB(function () { var n = 8; for (var i = 0; i < n; i++) ctx.rect(0, i * H / n, W, H / n * p); });
    else if (t === 'doors') {
      dB();
      if (A) [0, 1].forEach(function (s) { ctx.save(); ctx.translate((s ? 1 : -1) * p * W / 2, 0); ctx.beginPath(); ctx.rect(s * W / 2, 0, W / 2, H); ctx.clip(); drawClip(ctx, A, W, H); ctx.restore(); });
    }
    else if (t === 'blur') { dA(null, 'blur(' + (p * 30 * k).toFixed(1) + 'px)'); dB(function () { ctx.globalAlpha = p; }, 'blur(' + ((1 - p) * 30 * k).toFixed(1) + 'px)'); }
    else if (t === 'spin') { dA(function () { ctx.translate(W / 2, H / 2); ctx.rotate(p * Math.PI); ctx.scale(1 - p * 0.8, 1 - p * 0.8); ctx.translate(-W / 2, -H / 2); ctx.globalAlpha = 1 - p; }); dB(function () { ctx.translate(W / 2, H / 2); ctx.rotate(-(1 - p) * Math.PI); ctx.scale(0.2 + 0.8 * p, 0.2 + 0.8 * p); ctx.translate(-W / 2, -H / 2); ctx.globalAlpha = Math.min(1, p * 1.5); }); }
    else if (t === 'flip') { if (p < 0.5) dA(function () { ctx.translate(W / 2, 0); ctx.scale(Math.max(0.001, 1 - 2 * p), 1); ctx.translate(-W / 2, 0); }); else dB(function () { ctx.translate(W / 2, 0); ctx.scale(Math.max(0.001, 2 * p - 1), 1); ctx.translate(-W / 2, 0); }); }
    else if (t === 'shake') { dA(); dB(function () { var g = 1 - p; ctx.translate((rnd(Math.floor(raw * 30)) - 0.5) * W * 0.08 * g, (rnd(Math.floor(raw * 30) + 0.5) - 0.5) * H * 0.05 * g); zoomAt(ctx, W, H, 1 + 0.08 * g); ctx.globalAlpha = Math.min(1, p * 2.5); }); }
    else if (t === 'glitch' || t === 'pixel') {
      if (p < 0.5) dA(); else dB();
      var g = 1 - Math.abs(2 * p - 1);
      if (t === 'glitch') { rgbSplit(ctx, Math.round(ctx.canvas.width * 0.03 * g)); slices(ctx, g, Math.floor(raw * 40)); }
      else pixelate(ctx, Math.max(1, g * ctx.canvas.width / 14));
    }
    else dB();
  }

  function rnd(n) { var x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function copyFrame(ctx) {
    var cvv = ctx.canvas; if (fxC.width !== cvv.width || fxC.height !== cvv.height) { fxC.width = cvv.width; fxC.height = cvv.height; }
    fxX.globalCompositeOperation = 'copy'; fxX.drawImage(cvv, 0, 0); fxX.globalCompositeOperation = 'source-over'; return fxC;
  }
  // the red channel shifted sideways: cut red out of the frame (multiply by cyan) and add a shifted red-only copy back
  function rgbSplit(ctx, off) {
    var cvv = ctx.canvas, w = cvv.width, h = cvv.height;
    copyFrame(ctx); fxX.globalCompositeOperation = 'multiply'; fxX.fillStyle = '#ff0000'; fxX.fillRect(0, 0, w, h); fxX.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#00ffff'; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(fxC, off, 0);
    ctx.restore();
  }
  var pixC = document.createElement('canvas'), pixX = pixC.getContext('2d');
  // effects drawn on top of the finished clip frame (device pixels: they work the same in preview and export)
  function postFx(ctx, fx, lt, A, W, H, FC) {
    var cvv = ctx.canvas, w = cvv.width, h = cvv.height, k = w / W, i;
    if (fx === 'flash') { var fa = Math.max(0, 1 - (lt % 1) / 0.18) * 0.75 * Math.min(1.3, A); if (fa > 0.01) { ctx.fillStyle = hexA(FC || '#ffffff', Math.min(1, fa)); ctx.fillRect(0, 0, W, H); } return; }
    if (fx === 'strobe') { if (Math.floor(lt * 10) % 2 === 0) { ctx.fillStyle = hexA(FC || '#000000', Math.min(0.85, 0.35 * A)); ctx.fillRect(0, 0, W, H); } return; }
    if (fx === 'rgb') return rgbSplit(ctx, Math.round(w * (0.006 + 0.004 * Math.sin(lt * 6)) * A));
    if (fx === 'duotone') { ctx.save(); ctx.globalCompositeOperation = 'color'; ctx.fillStyle = hexA(FC || '#7b64ff', Math.min(1, 0.55 * A)); ctx.fillRect(0, 0, W, H); ctx.restore(); return; }
    if (fx === 'grain') return grainOver(ctx, W, H, Math.min(0.9, 0.35 * A), lt);
    if (fx === 'oldfilm') {
      grainOver(ctx, W, H, 0.3 * A, lt);
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,240,.35)'; ctx.lineWidth = Math.max(1, W / 700);
      for (i = 0; i < 2; i++) { if (rnd(Math.floor(lt * 8) + i * 3) < 0.6) { var sx = rnd(Math.floor(lt * 8) * 1.7 + i) * W; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + W * 0.004, H); ctx.stroke(); } }
      var gv = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) / 2); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(1, 'rgba(30,15,0,.6)');
      ctx.fillStyle = gv; ctx.fillRect(0, 0, W, H); ctx.restore(); return;
    }
    if (fx === 'leak') {
      var lx = (0.5 + 0.45 * Math.sin(lt * 0.8)) * W, ly = (0.3 + 0.2 * Math.cos(lt * 0.6)) * H, lr = Math.max(W, H) * 0.7, lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
      lg.addColorStop(0, hexA(FC || '#ff9640', Math.min(0.9, 0.5 * A))); lg.addColorStop(0.5, 'rgba(255,60,120,' + Math.min(0.6, 0.22 * A).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(255,60,120,0)');
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H); ctx.restore(); return;
    }
    if (fx === 'sparkle' || fx === 'snow') {
      var n = Math.round((fx === 'snow' ? 90 : 36) * A), u = Math.min(W, H) / 1080;
      ctx.save(); ctx.fillStyle = FC || '#ffffff';
      for (i = 0; i < n; i++) {
        if (fx === 'snow') {
          var sp = 0.5 + rnd(i * 2.3), fy = ((rnd(i * 1.1) + lt * 0.12 * sp) % 1) * H, fxp = rnd(i * 3.7) * W + Math.sin(lt * 1.3 + i) * 14 * u, fr = (2 + rnd(i * 5.1) * 5) * u;
          ctx.globalAlpha = 0.55 + 0.4 * rnd(i * 7.7); ctx.beginPath(); ctx.arc(fxp, fy, fr, 0, 6.283); ctx.fill();
        } else {
          var tw = Math.pow(Math.max(0, Math.sin(lt * (2 + rnd(i) * 3) + i * 1.7)), 6); if (tw < 0.02) continue;
          var px = rnd(i * 4.1) * W, py = rnd(i * 9.3) * H, r2 = (10 + rnd(i * 2.9) * 22) * u * tw;
          ctx.globalAlpha = tw; ctx.beginPath(); ctx.moveTo(px, py - r2); ctx.quadraticCurveTo(px, py, px + r2, py); ctx.quadraticCurveTo(px, py, px, py + r2); ctx.quadraticCurveTo(px, py, px - r2, py); ctx.quadraticCurveTo(px, py, px, py - r2); ctx.fill();
        }
      }
      ctx.restore(); return;
    }
    if (fx === 'glow') { copyFrame(ctx); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = Math.min(0.9, 0.45 * A); if (HAS_FILTER) ctx.filter = 'blur(' + Math.round(w * 0.012) + 'px) brightness(1.1)'; ctx.drawImage(fxC, 0, 0); ctx.restore(); return; }
    if (fx === 'mirror') { ctx.save(); ctx.setTransform(-1, 0, 0, 1, w, 0); ctx.drawImage(cvv, 0, 0, Math.ceil(w / 2), h, 0, 0, Math.ceil(w / 2), h); ctx.restore(); return; }
    if (fx === 'grid' || fx === 'split3') {
      copyFrame(ctx); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (fx === 'grid') { for (i = 0; i < 4; i++) ctx.drawImage(fxC, (i % 2) * w / 2, Math.floor(i / 2) * h / 2, w / 2, h / 2); }
      else if (h >= w) { for (i = 0; i < 3; i++) ctx.drawImage(fxC, 0, h / 3, w, h / 3, 0, i * h / 3, w, h / 3); }
      else { for (i = 0; i < 3; i++) ctx.drawImage(fxC, w / 3, 0, w / 3, h, i * w / 3, 0, w / 3, h); }
      ctx.restore(); return;
    }
    if (fx === 'pixel') {
      var bs = Math.max(2, Math.round(w / (90 / Math.max(0.3, A)))), pw = Math.max(1, Math.round(w / bs)), ph2 = Math.max(1, Math.round(h / bs));
      if (pixC.width !== pw || pixC.height !== ph2) { pixC.width = pw; pixC.height = ph2; }
      pixX.drawImage(cvv, 0, 0, pw, ph2); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(pixC, 0, 0, w, h); ctx.restore(); return;
    }
    if (fx === 'cinema') { var bh = H * Math.min(0.3, 0.11 * A); ctx.fillStyle = FC || '#000000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh); return; }
    if (fx === 'frame') { var bw = Math.min(W, H) * 0.045 * A; ctx.save(); ctx.fillStyle = FC || '#ffffff'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(bw, bw, W - bw * 2, H - bw * 2); ctx.fill('evenodd'); ctx.restore(); return; }
    if (fx === 'vhs') {
      rgbSplit(ctx, Math.max(1, Math.round(w * 0.004 * A)));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(0,0,0,' + Math.min(0.4, 0.14 * A).toFixed(3) + ')';
      var step = Math.max(2, Math.round(h / 320)); for (var y = 0; y < h; y += step * 2) ctx.fillRect(0, y, w, step);
      var by = ((lt * 0.35) % 1.3 - 0.15) * h; ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(0, by, w, h * 0.06);
      ctx.restore(); return;
    }
    if (fx === 'glitch') {
      var ph = lt % 0.9; if (ph > 0.16 * Math.max(0.5, A)) return;
      var seed = Math.floor(lt * 24);
      rgbSplit(ctx, Math.round(w * 0.012 * A * (rnd(seed) > 0.5 ? 1 : -1)));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (i = 0; i < 7; i++) {
        var sy = Math.floor(rnd(seed + i * 7.1) * h), sh = Math.max(2, Math.floor(rnd(seed + i * 3.3) * h * 0.07)), off = Math.round((rnd(seed + i * 5.7) - 0.5) * w * 0.12 * A);
        ctx.drawImage(cvv, 0, sy, w, sh, off, sy, w, sh);
      }
      ctx.restore();
    }
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
        else if (x.anim === 'pop') { sc = 0.5 + 0.5 * backOut(p); a = Math.min(1, p * 2); }
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
    lastBox[x.id] = { cx: cxp, cy: cyp, w: maxW + pad * 2, h: hTot + pad * 2, rot: x.rot || 0 };
    if (a <= 0.001) return;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(cxp, cyp + dy); if (x.rot) ctx.rotate(x.rot * Math.PI / 180); ctx.scale(sc, sc);
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

  // ---------- overlays (picture-in-picture, stickers) ----------
  // every overlay / music bar gets its own media element, so one file can play in two places at once
  var ownEls = {};
  function elFor(o) {
    var m = media[o.mid]; if (!m) return null;
    if (m.kind === 'image') return m.el;
    var v = ownEls[o.id];
    if (!v || v._src !== m.url) {
      if (v) { v.pause(); v.remove(); }
      v = document.createElement(m.kind === 'audio' ? 'audio' : 'video');
      v.preload = 'auto'; v.playsInline = true; v.setAttribute('playsinline', ''); v.src = m.url; v._src = m.url; v.style.display = 'none';
      v.addEventListener('loadeddata', function () { draw(); });
      document.body.appendChild(v); ownEls[o.id] = v;
    }
    return v;
  }
  function pruneEls() {
    var keep = {}; P.overlays.concat(P.audios).forEach(function (o) { keep[o.id] = 1; });
    Object.keys(ownEls).forEach(function (id) { if (!keep[id]) { ownEls[id].pause(); ownEls[id].removeAttribute('src'); ownEls[id].remove(); delete ownEls[id]; } });
  }
  function ovBox(o) {
    var w = o.w * P.w, h = w;
    if (o.kind !== 'emoji') { var m = media[o.mid]; if (!m) return null; if (o.shape !== 'circle') { var wh = srcWH(m, m.kind === 'video' ? elFor(o) : null); h = w * (wh[1] || 1) / (wh[0] || 1); } }
    return { cx: o.x * P.w, cy: o.y * P.h, w: w, h: h, rot: o.rot || 0 };
  }
  // chroma key on a small copy of the frame (≤720 px): pixels whose colour (in the Cb/Cr plane, so shadows on the green count too) is near the key go transparent
  function keyed(el, sw, sh, ch) {
    var s = Math.min(1, 720 / Math.max(sw, sh)), w = Math.max(1, Math.round(sw * s)), h = Math.max(1, Math.round(sh * s));
    if (keyC.width !== w || keyC.height !== h) { keyC.width = w; keyC.height = h; }
    keyX.clearRect(0, 0, w, h); keyX.drawImage(el, 0, 0, w, h);
    var img = keyX.getImageData(0, 0, w, h), d = img.data, n = parseInt((ch.color || '#00ff00').slice(1), 16), kr = n >> 16, kg = (n >> 8) & 255, kb = n & 255;
    var kcb = -0.1687 * kr - 0.3313 * kg + 0.5 * kb, kcr = 0.5 * kr - 0.4187 * kg - 0.0813 * kb, grey = Math.hypot(kcb, kcr) < 20;
    var tol = grey ? 12 + (ch.tol == null ? 40 : ch.tol) * 1.6 : 8 + (ch.tol == null ? 40 : ch.tol) * 1.1, soft = grey ? 30 : 24;
    var green = kg > kr && kg > kb, blue = kb > kr && kb > kg;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], g = d[i + 1], b = d[i + 2], dist;
      if (grey) dist = Math.sqrt((r - kr) * (r - kr) + (g - kg) * (g - kg) + (b - kb) * (b - kb));
      else { var cb = -0.1687 * r - 0.3313 * g + 0.5 * b, cr = 0.5 * r - 0.4187 * g - 0.0813 * b; dist = Math.hypot(cb - kcb, cr - kcr); }
      if (dist < tol) { d[i + 3] = 0; continue; }
      if (dist < tol + soft) d[i + 3] = Math.round(d[i + 3] * (dist - tol) / soft);
      // spill: take the key colour's cast off the edges
      if (green && g > r && g > b) d[i + 1] = Math.max(r, b) + (g - Math.max(r, b)) * (dist < tol + soft * 2 ? 0.2 : 0.7);
      else if (blue && b > r && b > g) d[i + 2] = Math.max(r, g) + (b - Math.max(r, g)) * (dist < tol + soft * 2 ? 0.2 : 0.7);
    }
    keyX.putImageData(img, 0, 0);
    return keyC;
  }
  function drawOver(ctx, o, t, still) {
    var b = ovBox(o); if (!b) return; lastBox[o.id] = b;
    var a = o.opacity == null ? 1 : o.opacity, sc = 1, dy = 0, rr = 0, L = o.end - o.start, li = t - o.start, lo = o.end - t;
    if (o.anim && o.anim !== 'none' && !still) {
      var dIn = Math.min(0.45, L / 3);
      if (li < dIn) {
        var p = li / dIn, e = ease(p);
        if (o.anim === 'fade') a *= p;
        else if (o.anim === 'pop') { sc = 0.4 + 0.6 * backOut(p); a *= Math.min(1, p * 2); }
        else if (o.anim === 'slide') { dy = (1 - e) * P.h * 0.08; a *= p; }
        else if (o.anim === 'zoom') { sc = 0.15 + 0.85 * e; }
        else if (o.anim === 'spin') { sc = e; rr = (1 - e) * -200; }
      }
      var dOut = Math.min(0.25, L / 4); if (lo < dOut) a *= clamp(lo / dOut, 0, 1);
    }
    if (a <= 0.001 || sc <= 0.001) return;
    var el = null, m = null;
    if (o.kind !== 'emoji') { m = media[o.mid]; if (!m) return; el = m.kind === 'video' ? elFor(o) : m.el; if (!el || (m.kind === 'video' && el.readyState < 2)) return; }
    ctx.save(); ctx.globalAlpha = a; ctx.translate(b.cx, b.cy + dy); ctx.rotate((b.rot + rr) * Math.PI / 180); ctx.scale(sc * (o.flip ? -1 : 1), sc);
    var w = b.w, h = b.h;
    if (o.kind === 'emoji') {
      ctx.font = Math.round(h * 0.86) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(o.emoji, 0, h * 0.04); ctx.restore(); return;
    }
    if (o.shape === 'round' || o.shape === 'circle') { ctx.beginPath(); if (o.shape === 'circle') ctx.arc(0, 0, w / 2, 0, Math.PI * 2); else roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.12); ctx.clip(); }
    var wh = srcWH(m, el), sw = wh[0], sh = wh[1]; if (!sw || !sh) { ctx.restore(); return; }
    var k = Math.max(w / sw, h / sh), src = o.chroma && o.chroma.on ? keyed(el, sw, sh, o.chroma) : el;
    var f = filterOf(o); if (HAS_FILTER && f !== 'none') ctx.filter = f;
    ctx.drawImage(src, -sw * k / 2, -sh * k / 2, sw * k, sh * k);
    ctx.restore();
  }
  // one frame at time t, in project pixels scaled by k
  function renderFrame(ctx, k, t, still) {
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, P.w, P.h);
    var at = P.clips.length ? clipAt(t) : null;
    if (at) {
      var prev = at.i > 0 ? P.clips[at.i - 1] : null;
      if (at.c.tr && at.c.tr !== 'none' && at.local < trDur(at.c)) drawTrans(ctx, prev ? { c: prev, local: Math.max(0, clipLen(prev) - 0.04), i: at.i - 1 } : null, at, P.w, P.h);
      else drawClip(ctx, at, P.w, P.h);
    }
    P.overlays.forEach(function (o) { if (t >= o.start && t < o.end) drawOver(ctx, o, t, still); });
    P.texts.forEach(function (x) { if (t >= x.start && t < x.end) drawText(ctx, x, t, still); });
  }
  var drawQ = false;
  function draw() {
    if (drawQ) return; drawQ = true;
    requestAnimationFrame(function () { drawQ = false; renderFrame(cx, cv.width / P.w, T, !playing); placeSel(); });
  }
  // the white box with corner (scale) and top (rotate) handles around the selected overlay / text
  var selEl = null;
  function placeSel() {
    selEl = selEl || document.getElementById('v-sel');
    var o = selected(), b = o && (sel.k === 'over' || sel.k === 'text') && !playing && T >= o.start && T < o.end ? lastBox[o.id] : null;
    if (!b) { selEl.hidden = true; return; }
    var r = cv.getBoundingClientRect(), sr = stage.getBoundingClientRect(), k = r.width / P.w;
    selEl.hidden = false;
    selEl.style.left = (r.left - sr.left + (b.cx - b.w / 2) * k) + 'px'; selEl.style.top = (r.top - sr.top + (b.cy - b.h / 2) * k) + 'px';
    selEl.style.width = (b.w * k) + 'px'; selEl.style.height = (b.h * k) + 'px'; selEl.style.transform = 'rotate(' + (b.rot || 0) + 'deg)';
    // rotate handle under the box when the top one would be cut off by the stage edge
    selEl.classList.toggle('rb', r.top - sr.top + (b.cy - b.h / 2) * k < 40 && Math.abs(b.rot || 0) < 90);
  }

  // ---------- playback ----------
  var t0 = 0, T0 = 0, raf = 0, lastClip = null;
  // every element that can make sound / needs pausing
  function allEls() {
    var a = []; Object.keys(media).forEach(function (k) { var m = media[k]; if (m.el && (m.kind === 'video' || m.kind === 'audio')) a.push(m.el); });
    Object.keys(ownEls).forEach(function (k) { a.push(ownEls[k]); });
    return a;
  }
  function follow(v, want, run, rate) {
    if (run) {
      if (v.paused) { if (Math.abs(v.currentTime - want) > 0.08) v.currentTime = want; v.playbackRate = rate || 1; var pr = v.play(); if (pr) pr.catch(function () {}); }
      else if (Math.abs(v.currentTime - want) > 0.3) v.currentTime = want;
    } else if (Math.abs(v.currentTime - want) > 0.01) {
      v.currentTime = want;
      if (!v._sk) { v._sk = 1; v.addEventListener('seeked', function f() { v._sk = 0; v.removeEventListener('seeked', f); draw(); }); }
    }
  }
  function syncMedia(t, run) {
    var at = P.clips.length ? clipAt(t) : null, cur = at && media[at.c.mid] && media[at.c.mid].kind === 'video' ? at : null;
    var act = [];
    if (cur) {
      var m = media[cur.c.mid], v = m.el, want = Math.min(m.dur - 0.02, srcAt(cur.c, cur.local)), rate = clamp(rateAt(cur.c, cur.local), 0.0625, 16);
      act.push(v);
      if (Math.abs(v.playbackRate - rate) > 0.01) v.playbackRate = rate; v.volume = clamp(cur.c.mute ? 0 : cur.c.vol, 0, 1); v.muted = !!cur.c.mute || cur.c.vol <= 0;
      if (run) {
        if (v.paused || lastClip !== cur.c.id) { if (Math.abs(v.currentTime - want) > 0.08) v.currentTime = want; var pr = v.play(); if (pr) pr.catch(function () {}); }
        else if (Math.abs(v.currentTime - want) > 0.3) v.currentTime = want;
      } else follow(v, want, false);
      lastClip = cur.c.id;
    } else lastClip = null;
    // during a transition the previous clip shows its last frame: park its video there
    if (at && at.i > 0 && at.c.tr && at.c.tr !== 'none' && at.local < trDur(at.c)) {
      var pc = P.clips[at.i - 1], pm = media[pc.mid];
      if (pm && pm.kind === 'video' && (!cur || pm.el !== media[cur.c.mid].el)) { act.push(pm.el); if (!pm.el.paused) pm.el.pause(); follow(pm.el, Math.min(pm.dur - 0.02, srcAt(pc, Math.max(0, clipLen(pc) - 0.04))), false); }
    }
    P.overlays.forEach(function (o) {
      var m = media[o.mid]; if (!m || m.kind !== 'video' || t < o.start || t >= o.end) return;
      var v = elFor(o); act.push(v);
      v.volume = clamp(o.mute ? 0 : (o.vol == null ? 1 : o.vol), 0, 1); v.muted = !!o.mute || o.vol <= 0;
      follow(v, Math.min(m.dur - 0.02, o.in + (t - o.start)), run);
    });
    P.audios.forEach(function (a) {
      var m = media[a.mid]; if (!m) return;
      var end = a.start + (a.out - a.in), inside = t >= a.start && t < end && t < total();
      if (!inside || !run) return;
      var el = elFor(a); act.push(el);
      var g = a.vol;
      if (a.fadeIn) g *= clamp((t - a.start) / 1, 0, 1);
      if (a.fadeOut) g *= clamp((Math.min(end, total()) - t) / 1.5, 0, 1);
      el.volume = clamp(g, 0, 1); el.muted = false;
      follow(el, a.in + (t - a.start), true);
    });
    allEls().forEach(function (el) { if (act.indexOf(el) < 0 && !el.paused) el.pause(); });
  }
  function play() {
    var D = total(); if (D <= 0) { toast('Эхлээд видео, зураг нэмнэ үү'); return; }
    if (T >= D - 0.05) T = 0;
    playing = true; t0 = performance.now(); T0 = T; lastClip = null; placeSel();
    document.getElementById('v-play').innerHTML = ico('pause'); document.getElementById('v-play').setAttribute('aria-label', 'Зогсоох');
    P.texts.forEach(function (x) { loadFont(x.font); });
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function loop(now) {
    if (!playing) return;
    var t = T0 + (now - t0) / 1000, D = total();
    if (t >= D) { T = D; pause(); return; }
    if (stopAt && t >= stopAt) { stopAt = 0; T = t; pause(); return; }
    T = t; syncMedia(T, true); if (frameReady(T)) renderFrame(cx, cv.width / P.w, T); setScroll(); timeLabel();
    raf = requestAnimationFrame(loop);
  }
  function pause() {
    playing = false; stopAt = 0; cancelAnimationFrame(raf);
    allEls().forEach(function (el) { if (!el.paused) el.pause(); });
    document.getElementById('v-play').innerHTML = ico('play'); document.getElementById('v-play').setAttribute('aria-label', 'Тоглуулах');
    seek(T);
  }
  // false while the clip's video under t has no frame yet (seeking) — the preview keeps its last picture instead of flashing black
  function frameReady(t) {
    var at = P.clips.length ? clipAt(t) : null, m = at && media[at.c.mid];
    return !(m && m.kind === 'video' && m.el.readyState < 2);
  }
  function seek(t) { T = clamp(t, 0, total()); if (playing) { T0 = T; t0 = performance.now(); syncMedia(T, true); return; } syncMedia(T, false); draw(); timeLabel(); }
  // play a short stretch (previewing an effect / motion / animation), then stop
  var stopAt = 0;
  function previewRange(a, len) { if (playing) pause(); seek(a); setScroll(); play(); stopAt = Math.min(total(), a + len); }
  function timeLabel() { document.getElementById('v-time').innerHTML = '<b>' + fmt(T) + '</b> / ' + fmt(total()); }

  // ---------- timeline ----------
  var progScroll = false;
  function pad() { return Math.round(scroller.clientWidth / 2); }
  function setScroll() { progScroll = true; scroller.scrollLeft = T * pps; requestAnimationFrame(function () { progScroll = false; }); }
  // scrubbing: one seek per animation frame however fast the scroll events come
  var scrubQ = 0;
  scroller.addEventListener('scroll', function () {
    if (progScroll || drag || Math.abs(scroller.scrollLeft - T * pps) < 1.5) return;      // our own (pixel-rounded) scroll, not the user's
    if (playing) pause();
    if (!scrubQ) scrubQ = requestAnimationFrame(function () { scrubQ = 0; seek(scroller.scrollLeft / pps); refreshTB(); });
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
    (P.markers || []).forEach(function (t) { h += '<b class="mk" data-mk="' + t + '" style="left:' + (t * pps) + 'px" title="Тэмдэг ' + fmt(t) + '"></b>'; });
    h += '</div>';
    // main track
    h += '<div class="vtl-row r-v" style="left:' + p + 'px">';
    var x0 = 0;
    P.clips.forEach(function (c, i) {
      var m = media[c.mid] || {}, L = clipLen(c), on = sel && sel.k === 'clip' && sel.id === c.id;
      var bg = '';
      if (m.kind === 'video' && m.strip) bg = 'background-image:url(' + m.strip + ');background-size:' + (m.dur / avgSpeed(c) * pps) + 'px 100%;background-position:' + (-c.in / avgSpeed(c) * pps) + 'px 0;background-repeat:no-repeat;';
      else if (m.kind === 'image' && m.url) bg = 'background-image:url(' + m.url + ');';
      h += '<div class="it v' + (on ? ' on' : '') + '" data-k="clip" data-id="' + c.id + '" style="left:' + (x0 * pps) + 'px;width:' + Math.max(8, L * pps - 2) + 'px;' + bg + '">' +
        '<span class="nm">' + (rampPts(c) ? '〰 ' : c.speed !== 1 ? c.speed + '× · ' : '') + fmt(L) + (c.mute ? ' · 🔇' : '') + '</span><span class="hd l" data-h="l"></span><span class="hd r" data-h="r"></span></div>';
      h += '<button type="button" class="tr-badge" data-tr="' + c.id + '" style="position:absolute;left:' + (x0 * pps) + 'px;top:50%;transform:translate(-50%,-50%)" title="Шилжилт" aria-label="Шилжилт">' + (c.tr && c.tr !== 'none' ? '⇄' : '+') + '</button>';
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
        var md = media[it.mid] || {}, bg = '', nm;
        if (k === 'audio' && md.wave) bg = 'background-image:url(' + md.wave + ');background-size:' + (md.dur * pps) + 'px 100%;background-position:' + (-it.in * pps) + 'px 0;background-repeat:no-repeat;';
        if (k === 'over' && md.kind === 'video' && md.strip) bg = 'background-image:url(' + md.strip + ');background-size:' + (md.dur * pps) + 'px 100%;background-position:' + (-it.in * pps) + 'px 0;background-repeat:no-repeat;';
        if (k === 'over' && md.kind === 'image') bg = 'background-image:url(' + md.url + ');background-size:auto 100%;';
        nm = k === 'text' ? (it.text || 'Текст').replace(/\n/g, ' ') : k === 'over' ? (it.kind === 'emoji' ? it.emoji : (md.kind === 'video' ? '▶ ' : '') + (md.name || 'Давхар')) : '♪ ' + (md.name || 'Хөгжим');
        out += '<div class="it ' + (k === 'text' ? 't' : k === 'over' ? 'o' : 'a') + (on ? ' on' : '') + '" data-k="' + k + '" data-id="' + it.id + '" style="left:' + (a * pps) + 'px;width:' + Math.max(10, (b - a) * pps - 2) + 'px;top:' + (it._lane * lh) + 'px;height:' + (lh - 2) + 'px;' + bg + '">' +
          '<span class="nm">' + esc(nm) + '</span><span class="hd l" data-h="l"></span><span class="hd r" data-h="r"></span></div>';
      });
      return out + '</div>';
    }
    h += row('r-o', P.overlays, 'over', function (o) { return o.start; }, function (o) { return o.end; }, '⧉  Давхар');
    h += row('r-t', P.texts, 'text', function (x) { return x.start; }, function (x) { return x.end; }, 'Т  Текст');
    h += row('r-a', P.audios, 'audio', function (a) { return a.start; }, function (a) { return a.start + (a.out - a.in); }, '♪  Хөгжим');
    tl.innerHTML = h;
    progScroll = true; scroller.scrollLeft = T * pps; requestAnimationFrame(function () { progScroll = false; });
    document.getElementById('v-empty').style.display = P.clips.length || P.texts.length || P.overlays.length ? 'none' : '';
    timeLabel();
  }

  // pointer: tap selects; handles trim; a selected bar drags (texts / overlays / music along the time line, clips change order);
  // the mouse can drag empty timeline to scrub; edges snap (magnet) to the playhead, other edges and markers
  var drag = null, scrub = null, tlRaf = 0;
  function tlQ() { if (!tlRaf) tlRaf = requestAnimationFrame(function () { tlRaf = 0; renderTL(); draw(); }); }
  function snapPoints(exId) {
    var pts = [0, T], s = 0;
    P.clips.forEach(function (c) { if (c.id !== exId) pts.push(s); s += clipLen(c); }); pts.push(s);
    P.texts.concat(P.overlays).forEach(function (x) { if (x.id !== exId) pts.push(x.start, x.end); });
    P.audios.forEach(function (a) { if (a.id !== exId) pts.push(a.start, a.start + a.out - a.in); });
    return pts.concat(P.markers || []);
  }
  function snapTo(t, pts) { if (!snapOn) return null; var best = null, bd = 10 / pps; pts.forEach(function (p) { var d = Math.abs(p - t); if (d < bd) { bd = d; best = p; } }); return best; }
  var snapEl = document.createElement('div'); snapEl.className = 'snapln';
  function snapLine(t) { if (t == null) { snapEl.style.display = 'none'; return; } if (snapEl.parentNode !== tl) tl.appendChild(snapEl); snapEl.style.display = 'block'; snapEl.style.left = (pad() + t * pps) + 'px'; }
  tl.addEventListener('pointerdown', function (e) {
    var trb = e.target.closest('[data-tr]');
    if (trb) { e.preventDefault(); sel = { k: 'clip', id: trb.dataset.tr }; refresh(); sheetTrans(); return; }
    var mk = e.target.closest('[data-mk]');
    if (mk) { e.preventDefault(); if (playing) pause(); seek(+mk.dataset.mk); setScroll(); refreshTB(); return; }
    var ru = e.target.closest('.vtl-ruler');
    if (ru) { if (playing) pause(); seek((e.clientX - ru.getBoundingClientRect().left) / pps); setScroll(); refreshTB(); return; }
    var it = e.target.closest('.it');
    if (!it) {
      if (e.target.closest('button')) return;
      if (e.pointerType === 'mouse' && e.button === 0) { e.preventDefault(); if (playing) pause(); scrub = { x: e.clientX, sl: scroller.scrollLeft, moved: false }; scroller.classList.add('grabbing'); }
      return;
    }
    var k = it.dataset.k, id = it.dataset.id, o = find(k, id); if (!o) return;
    var hd = e.target.closest('.hd'), wasSel = sel && sel.k === k && sel.id === id;
    drag = { k: k, id: id, h: hd ? hd.dataset.h : null, x: e.clientX, moved: false, snap: JSON.stringify(o), wasSel: wasSel, el: it };
    if (hd || wasSel) { e.preventDefault(); try { it.setPointerCapture(e.pointerId); } catch (er) {} drag.cap = true; }
    if (playing) pause();
  });
  window.addEventListener('pointermove', function (e) {
    if (scrub) { var sdx = e.clientX - scrub.x; if (Math.abs(sdx) > 3) scrub.moved = true; scroller.scrollLeft = scrub.sl - sdx; return; }
    if (!drag) return;
    var dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 5) return;
    drag.moved = true;
    if (!drag.cap) { drag = null; return; }      // a plain swipe — the timeline scrolls
    var o = find(drag.k, drag.id), s = JSON.parse(drag.snap), d = dx / pps; if (!o) return;
    var pts = drag.pts || (drag.pts = snapPoints(drag.id)), hit = null;
    function sn(t) { var r = snapTo(t, pts); if (r != null) { hit = r; return r; } return t; }
    // move a bar keeping its length: whichever edge is nearer a snap point wins
    function moveBar(st0, L) {
      var ns = Math.max(0, st0 + d), a1 = snapTo(ns, pts), a2 = snapTo(ns + L, pts);
      if (a1 != null && (a2 == null || Math.abs(a1 - ns) <= Math.abs(a2 - ns - L))) { hit = a1; return a1; }
      if (a2 != null && a2 - L >= 0) { hit = a2; return a2 - L; }
      return ns;
    }
    if (drag.k === 'clip') {
      var m = media[o.mid], maxSrc = m.kind === 'image' ? 3600 : m.dur, st = startOf(o.id);
      if (!drag.h) {
        // reorder: the bar follows the pointer, the drop place is shown by a line
        drag.el.style.transform = 'translateX(' + dx + 'px)'; drag.el.classList.add('lift');
        var row = tl.querySelector('.r-v').getBoundingClientRect(), pt = (e.clientX - row.left) / pps, acc = 0, idx = 0, line = 0;
        P.clips.forEach(function (c) { if (c.id === o.id) return; var L2 = clipLen(c); if (acc + L2 / 2 < pt) { idx++; line = acc + L2; } acc += L2; });
        drag.to = idx; snapLine(idx ? line : 0); return;
      }
      var ramp = !!rampPts(s), sp = s.speed;
      if (drag.h === 'l') o.in = clamp(s.in + d * sp, 0, s.out - 0.2 * sp);
      else if (drag.h === 'r') {
        o.out = clamp(s.out + d * sp, s.in + 0.2 * sp, maxSrc);
        if (!ramp && m.kind !== 'image') { var e1 = sn(st + (o.out - o.in) / sp); o.out = clamp(o.in + (e1 - st) * sp, o.in + 0.2 * sp, maxSrc); }
      }
      if (m.kind === 'image') { if (drag.h === 'l') { o.in = 0; o.out = clamp(s.out - d, 0.3, 3600); } else if (drag.h === 'r') { o.in = 0; o.out = clamp(sn(st + s.out + d) - st, 0.3, 3600); } }
    } else if (drag.k === 'over') {
      var mo = media[o.mid], lim = mo && mo.kind === 'video' ? mo.dur : Infinity, L0 = s.end - s.start;
      if (drag.h === 'l') { var ls = sn(s.start + d), nd0 = clamp(ls - s.start, lim === Infinity ? -s.start : Math.max(-s.start, -s.in), L0 - 0.2); o.start = s.start + nd0; if (lim !== Infinity) o.in = s.in + nd0; }
      else if (drag.h === 'r') o.end = clamp(sn(s.end + d), s.start + 0.2, lim === Infinity ? Infinity : s.start + (lim - s.in));
      else { o.start = moveBar(s.start, L0); o.end = o.start + L0; }
    } else if (drag.k === 'text') {
      var L = s.end - s.start;
      if (drag.h === 'l') o.start = clamp(sn(s.start + d), 0, s.end - 0.2);
      else if (drag.h === 'r') o.end = Math.max(s.start + 0.2, sn(s.end + d));
      else { o.start = moveBar(s.start, L); o.end = o.start + L; }
    } else {
      var md = media[o.mid], La = s.out - s.in;
      if (drag.h === 'l') { var nd = clamp(sn(s.start + d) - s.start, -s.in, La - 0.3); o.start = Math.max(0, s.start + nd); o.in = s.in + (o.start - s.start); }
      else if (drag.h === 'r') o.out = clamp(sn(s.start + La + d) - s.start + s.in, s.in + 0.3, md.dur);
      else o.start = moveBar(s.start, La);
    }
    snapLine(hit); tlQ();
  });
  window.addEventListener('pointerup', function () {
    if (scrub) { var sc = scrub; scrub = null; scroller.classList.remove('grabbing'); if (!sc.moved && sel) { sel = null; refresh(); } return; }
    if (!drag) return;
    var dr = drag; drag = null; snapLine(null);
    if (dr.moved && dr.cap) {
      if (dr.k === 'clip' && !dr.h && dr.to != null) {
        var o = find('clip', dr.id), i = P.clips.indexOf(o);
        P.clips.splice(i, 1); P.clips.splice(dr.to, 0, o); commit(); seek(startOf(o.id) + 0.01); setScroll(); return;
      }
      commit(); return;
    }
    if (!dr.moved) {
      if (dr.wasSel && dr.k === 'text') { sheetText(find('text', dr.id)); return; }
      sel = dr.wasSel && !desk.matches ? null : { k: dr.k, id: dr.id };
      if (sel && (sel.k === 'text' || sel.k === 'over')) { var x = find(sel.k, sel.id); if (T < x.start || T >= x.end) { seek(x.start + 0.01); setScroll(); } }
      refresh();
    }
  });
  window.addEventListener('pointercancel', function () { drag = null; scrub = null; snapLine(null); });
  // mouse wheel / trackpad: scroll the timeline sideways; Ctrl + wheel (or pinch on a trackpad) zooms it
  scroller.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(pps * Math.exp(-e.deltaY * 0.0025)); return; }
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); scroller.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 30 : 1); }
  }, { passive: false });

  // ---------- preview: tap to select, drag to move (texts, overlays; a selected clip pans), handles scale + rotate ----------
  var pdrag = null;
  function toProj(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * P.w, y: (e.clientY - r.top) / r.height * P.h }; }
  function inBox(b, p) {
    var a = -(b.rot || 0) * Math.PI / 180, dx = p.x - b.cx, dy = p.y - b.cy, x = dx * Math.cos(a) - dy * Math.sin(a), y = dx * Math.sin(a) + dy * Math.cos(a), m = Math.min(P.w, P.h) * 0.02;
    return Math.abs(x) <= b.w / 2 + m && Math.abs(y) <= b.h / 2 + m;
  }
  function hitAt(p) {
    var hit = null;
    P.texts.slice().reverse().forEach(function (x) { if (!hit && T >= x.start && T < x.end && lastBox[x.id] && inBox(lastBox[x.id], p)) hit = { k: 'text', o: x }; });
    P.overlays.slice().reverse().forEach(function (o) { if (!hit && T >= o.start && T < o.end && lastBox[o.id] && inBox(lastBox[o.id], p)) hit = { k: 'over', o: o }; });
    return hit;
  }
  var downs = 0;
  cv.addEventListener('pointerdown', function (e) {
    if (++downs > 1) { pdrag = null; guides(false, false); return; }      // second finger: pinch (touch handlers below)
    var p = toProj(e), hit = hitAt(p);
    if (picking) { e.preventDefault(); var pk = picking; picking = null; pk(p); return; }
    // keep the selected item on top of the hit-test: tapping inside it again opens / drags it
    var cur = selected();
    if (cur && (sel.k === 'text' || sel.k === 'over') && lastBox[cur.id] && T >= cur.start && T < cur.end && inBox(lastBox[cur.id], p)) hit = { k: sel.k, o: cur };
    if (!hit && sel && sel.k === 'clip') {
      var at = clipAt(T);
      if (at && at.c.id === sel.id) {
        e.preventDefault(); if (playing) pause();
        pdrag = { k: 'clip', id: at.c.id, p: p, x: at.c.px || 0, y: at.c.py || 0, moved: false };
        try { cv.setPointerCapture(e.pointerId); } catch (er) {}
        return;
      }
    }
    if (!hit) { if (playing) pause(); else if (sel) { sel = null; refresh(); } return; }
    e.preventDefault(); if (playing) pause();
    var again = sel && sel.k === hit.k && sel.id === hit.o.id;
    sel = { k: hit.k, id: hit.o.id }; refreshTB(); renderTL(); draw();
    pdrag = { k: hit.k, id: hit.o.id, p: p, x: hit.o.x, y: hit.o.y, moved: false, again: again };
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  });
  cv.addEventListener('pointermove', function (e) {
    if (!pdrag) return;
    var p = toProj(e), o = find(pdrag.k, pdrag.id); if (!o) return;
    var dx = (p.x - pdrag.p.x) / P.w, dy = (p.y - pdrag.p.y) / P.h;
    if (!pdrag.moved && Math.abs(dx) + Math.abs(dy) < 0.006) return;
    pdrag.moved = true;
    if (pdrag.k === 'clip') {
      var sx0 = Math.abs(pdrag.x + dx) < 0.015, sy0 = Math.abs(pdrag.y + dy) < 0.015;
      o.px = sx0 ? 0 : clamp(pdrag.x + dx, -1.5, 1.5); o.py = sy0 ? 0 : clamp(pdrag.y + dy, -1.5, 1.5);
      guides(sx0, sy0); draw(); return;
    }
    var nx = pdrag.x + dx, ny = pdrag.y + dy;
    var sx = Math.abs(nx - 0.5) < 0.02, sy = Math.abs(ny - 0.5) < 0.015;
    o.x = sx ? 0.5 : clamp(nx, -0.2, 1.2); o.y = sy ? 0.5 : clamp(ny, -0.2, 1.2);
    guides(sx, sy); draw();
  });
  cv.addEventListener('pointerup', function () {
    downs = Math.max(0, downs - 1);
    if (!pdrag) return;
    var d = pdrag; pdrag = null; guides(false, false);
    if (d.moved) commit();
    else if (d.again && d.k === 'text') sheetText(find('text', d.id));
    else if (d.again && d.k === 'over') sheetOver();
  });
  cv.addEventListener('pointercancel', function () { downs = Math.max(0, downs - 1); pdrag = null; guides(false, false); });
  // two fingers on the preview: pinch scales, twist rotates the selected overlay / text (or zooms the selected clip)
  var pin2 = null;
  cv.addEventListener('touchstart', function (e) {
    var o = selected(); if (e.touches.length !== 2 || !o) return;
    var a = e.touches[0], b = e.touches[1];
    pdrag = null;
    pin2 = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), ang: Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX), o: o, k: sel.k, w: o.w, size: o.size, zoom: o.zoom || 1, rot: o.rot || 0 };
  }, { passive: true });
  cv.addEventListener('touchmove', function (e) {
    if (!pin2 || e.touches.length !== 2) return;
    e.preventDefault();
    var a = e.touches[0], b = e.touches[1], f = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pin2.d, da = (Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) - pin2.ang) * 180 / Math.PI, o = pin2.o;
    if (pin2.k === 'over') { o.w = clamp(pin2.w * f, 0.03, 3); o.rot = snapRot(pin2.rot + da); }
    else if (pin2.k === 'text') { o.size = clamp(pin2.size * f, 0.015, 0.4); o.rot = snapRot(pin2.rot + da); }
    else if (pin2.k === 'clip') o.zoom = clamp(pin2.zoom * f, 0.3, 4);
    draw();
  }, { passive: false });
  cv.addEventListener('touchend', function (e) { if (pin2 && e.touches.length < 2) { pin2 = null; commit(); } });
  function snapRot(r) { r = ((r % 360) + 540) % 360 - 180; for (var q = -180; q <= 180; q += 90) if (Math.abs(r - q) < 5) return q === -180 ? 180 : q; return Math.round(r * 10) / 10; }
  // corner handles: scale around the centre; top handle: rotate
  var hdrag = null;
  document.getElementById('v-sel').addEventListener('pointerdown', function (e) {
    var h = e.target.closest('[data-hd]'), o = selected(); if (!h || !o) return;
    e.preventDefault(); e.stopPropagation();
    var b = lastBox[o.id], r = cv.getBoundingClientRect(), k = r.width / P.w, c = { x: r.left + b.cx * k, y: r.top + b.cy * k };
    hdrag = { mode: h.dataset.hd, o: o, c: c, d: Math.hypot(e.clientX - c.x, e.clientY - c.y) || 1, w: o.w, size: o.size, rot: o.rot || 0, a: Math.atan2(e.clientY - c.y, e.clientX - c.x) };
    try { h.setPointerCapture(e.pointerId); } catch (er) {}
  });
  document.getElementById('v-sel').addEventListener('pointermove', function (e) {
    if (!hdrag) return;
    var o = hdrag.o, c = hdrag.c;
    if (hdrag.mode === 's') {
      var f = Math.hypot(e.clientX - c.x, e.clientY - c.y) / hdrag.d;
      if (sel.k === 'over') o.w = clamp(hdrag.w * f, 0.03, 3); else o.size = clamp(hdrag.size * f, 0.015, 0.4);
    } else o.rot = snapRot(hdrag.rot + (Math.atan2(e.clientY - c.y, e.clientX - c.x) - hdrag.a) * 180 / Math.PI);
    draw();
  });
  function hEnd() { if (hdrag) { hdrag = null; commit(); } }
  document.getElementById('v-sel').addEventListener('pointerup', hEnd);
  document.getElementById('v-sel').addEventListener('pointercancel', hEnd);
  function guides(v, h) {
    var gv = document.getElementById('g-v'), gh = document.getElementById('g-h'), r = cv.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    gv.style.display = v ? 'block' : 'none'; gh.style.display = h ? 'block' : 'none';
    gv.style.left = (r.left - sr.left + r.width / 2) + 'px'; gv.style.top = (r.top - sr.top) + 'px'; gv.style.height = r.height + 'px';
    gh.style.top = (r.top - sr.top + r.height / 2) + 'px'; gh.style.left = (r.left - sr.left) + 'px'; gh.style.width = r.width + 'px';
  }

  // ---------- history + autosave ----------
  function snap() { return JSON.stringify({ name: P.name, w: P.w, h: P.h, bg: P.bg, clips: P.clips, texts: P.texts, audios: P.audios, overlays: P.overlays, markers: P.markers || [] }); }
  function commit() { hist = hist.slice(0, hi + 1); hist.push(snap()); if (hist.length > 80) hist.shift(); hi = hist.length - 1; pruneEls(); save(); refresh(); }
  function restore(s) {
    var o = JSON.parse(s); P.name = o.name; P.w = o.w; P.h = o.h; P.bg = o.bg; P.clips = o.clips; P.texts = o.texts; P.audios = o.audios; P.overlays = o.overlays || []; P.markers = o.markers || [];
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
      var used = {}; P.clips.concat(P.audios, P.overlays).forEach(function (c) { if (c.mid) used[c.mid] = 1; });
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
      P = { name: o.name, w: o.w, h: o.h, bg: o.bg, clips: o.clips.filter(ok), texts: o.texts, audios: o.audios.filter(ok), overlays: (o.overlays || []).filter(function (x) { return x.kind === 'emoji' || ok(x); }), markers: o.markers || [] };
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
  function newClip(m) {
    var ar = (m.w || 1) / (m.h || 1), pr = P.w / P.h;
    return { id: uid(), mid: m.id, in: 0, out: m.kind === 'image' ? IMG_DUR : m.dur, speed: 1, vol: 1, mute: false, fit: Math.abs(ar / pr - 1) < 0.15 ? 'fill' : 'fit', tr: 'none', motion: m.kind === 'image' ? 'in' : 'none' };
  }
  // a picture-in-picture layer from the playhead: a third of the frame wide, upper right
  function newOverlay(m, emoji) {
    var D = total(), st = D > 0 && T < D - 0.3 ? T : 0, len = m && m.kind === 'video' ? m.dur : 3;
    if (D > 0) len = Math.min(len, Math.max(1, D - st));
    var o = { id: uid(), kind: emoji ? 'emoji' : 'media', start: st, end: st + len, in: 0, x: 0.7, y: P.h > P.w ? 0.25 : 0.3, w: emoji ? 0.2 : 0.42, rot: 0, opacity: 1, anim: 'pop', flip: false, shape: 'round', chroma: { on: false, color: '#00ff00', tol: 40 }, filter: 'none', adj: null, vol: 1, mute: false };
    if (emoji) { o.emoji = emoji; o.x = 0.5; o.y = 0.4; } else o.mid = m.id;
    P.overlays.push(o); return o;
  }
  function addFiles(list, asOver) {
    var files = Array.prototype.slice.call(list || []).filter(function (f) { return kindOf(f); });
    if (!files.length) { toast('Видео, зураг, дуу (mp4, mov, jpg, png, mp3…) сонгоно уу'); return Promise.resolve(); }
    toast(files.length > 1 ? files.length + ' файл нэмж байна…' : 'Нэмж байна…');
    var at = sel && sel.k === 'clip' ? P.clips.findIndex(function (c) { return c.id === sel.id; }) + 1 : P.clips.length;
    var chain = Promise.resolve(), added = 0, firstNew = null, lastOv = null;
    files.forEach(function (f) {
      chain = chain.then(function () { return loadMedia(f); }).then(function (m) {
        if (m.kind === 'audio') {
          var st = T < total() - 0.5 ? T : 0;
          P.audios.push({ id: uid(), mid: m.id, start: st, in: 0, out: m.dur, vol: 1, fadeIn: false, fadeOut: true }); added++; return;
        }
        if (asOver) { lastOv = newOverlay(m); added++; return; }
        var c = newClip(m);
        P.clips.splice(at++, 0, c); added++; if (!firstNew) firstNew = c;
      }).catch(function () { toast('«' + f.name + '» файлыг нээж чадсангүй — энэ хөтөч уг форматыг дэмжихгүй байж магадгүй'); });
    });
    return chain.then(function () {
      if (!added) return;
      if (lastOv) sel = { k: 'over', id: lastOv.id };
      commit();
      if (firstNew) { seek(startOf(firstNew.id) + 0.01); setScroll(); }
      else if (lastOv) { seek(lastOv.start + 0.01); setScroll(); }
      toast(added + ' файл нэмэгдлээ');
    });
  }
  var pickOver = false;
  function pick(accept, over) { pickOver = !!over; fileIn.accept = accept; fileIn.value = ''; fileIn.click(); }
  fileIn.addEventListener('change', function () { addFiles(fileIn.files, pickOver); });
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
      var cut = srcAt(o, loc); if (rampPts(o)) { o.ramp = 'none'; c2.ramp = 'none'; }
      if (media[o.mid].kind === 'image') { o.out = loc; c2.in = 0; c2.out = L - loc; } else { o.out = cut; c2.in = cut; }
      P.clips.splice(P.clips.indexOf(o) + 1, 0, c2);
    } else if (sel.k === 'text' || sel.k === 'over') {
      if (T <= o.start + 0.1 || T >= o.end - 0.1) return toast('Шугамыг дунд нь аваачаад хуваана уу');
      var t2 = JSON.parse(JSON.stringify(o)); t2.id = uid(); t2.start = T; o.end = T;
      if (sel.k === 'over') { t2.in = (o.in || 0) + (T - o.start); t2.anim = 'none'; P.overlays.push(t2); } else P.texts.push(t2);
    } else {
      var aEnd = o.start + (o.out - o.in);
      if (T <= o.start + 0.1 || T >= aEnd - 0.1) return toast('Шугамыг хөгжмийн дунд аваачаад хуваана уу');
      var a2 = JSON.parse(JSON.stringify(o)); a2.id = uid(); a2.in = o.in + (T - o.start); a2.start = T; o.out = a2.in; P.audios.push(a2);
    }
    commit(); toast('Хуваалаа');
  }
  function delSel() {
    if (!sel) return;
    var l = listOf(sel.k), i = l.findIndex(function (x) { return x.id === sel.id; });
    if (i >= 0) l.splice(i, 1);
    sel = null; commit(); seek(Math.min(T, total()));
  }
  function dupSel() {
    var o = selected(); if (!o) return;
    var c = JSON.parse(JSON.stringify(o)); c.id = uid();
    if (sel.k === 'clip') P.clips.splice(P.clips.indexOf(o) + 1, 0, c);
    else if (sel.k === 'text') { var L = o.end - o.start; c.start = o.end; c.end = o.end + L; P.texts.push(c); }
    else if (sel.k === 'over') { c.x = clamp(o.x + 0.05, 0, 1); c.y = clamp(o.y + 0.05, 0, 1); P.overlays.push(c); }
    else { c.start = o.start + (o.out - o.in); P.audios.push(c); }
    sel = { k: sel.k, id: c.id }; commit();
  }
  function addText() {
    var D = total(), st = D > 0 && T < D - 0.3 ? T : 0;
    var x = { id: uid(), text: '', start: st, end: D > 0 ? Math.min(Math.max(D, st + 1), st + TXT_DUR) : st + TXT_DUR, x: 0.5, y: P.h > P.w ? 0.62 : 0.5, size: 0.075, font: 'Montserrat', weight: 800, style: 'outline', color: '#ffffff', anim: 'pop' };
    P.texts.push(x); sel = { k: 'text', id: x.id }; loadFont(x.font); seek(st + 0.01); renderTL(); refreshTB();
    sheetText(x, true);
  }

  // freeze frame: the frame under the playhead becomes a 2 s still, the clip is split around it
  function freezeFrame() {
    var at = clipAt(T), m = at && media[at.c.mid];
    if (!m || m.kind !== 'video') return toast('Видео клип дээр шугамаа аваачна уу');
    var c = at.c, loc = at.local, want = Math.min(m.dur - 0.02, srcAt(c, loc));
    if (playing) pause();
    toast('Кадр авч байна…');
    return seekV(m.el, want).then(function () {
      var k = document.createElement('canvas'); k.width = m.el.videoWidth; k.height = m.el.videoHeight; k.getContext('2d').drawImage(m.el, 0, 0);
      return new Promise(function (r) { k.toBlob(r, 'image/jpeg', 0.92); });
    }).then(function (blob) {
      return loadMedia(new File([blob], 'Царцаасан кадр.jpg', { type: 'image/jpeg' }), 'image');
    }).then(function (im) {
      var L = clipLen(c), i = P.clips.indexOf(c);
      var fz = JSON.parse(JSON.stringify(c)); fz.id = uid(); fz.mid = im.id; fz.in = 0; fz.out = 2; fz.speed = 1; fz.ramp = 'none'; fz.tr = 'none'; fz.motion = 'none'; fz.vol = 1; fz.mute = false;
      if (loc > 0.1 && loc < L - 0.1) { var c2 = JSON.parse(JSON.stringify(c)); c2.id = uid(); c2.tr = 'none'; var cut = srcAt(c, loc); if (rampPts(c)) { c.ramp = 'none'; c2.ramp = 'none'; } c.out = cut; c2.in = cut; P.clips.splice(i + 1, 0, fz, c2); }
      else P.clips.splice(loc <= 0.1 ? i : i + 1, 0, fz);
      sel = { k: 'clip', id: fz.id }; commit(); seek(startOf(fz.id) + 0.01); setScroll(); toast('2 секунд царцаалаа — захаас нь чирж уртасгана');
    }).catch(function () { toast('Кадр авч чадсангүй'); });
  }
  // the clip's sound becomes its own bar on the music track (the clip goes silent) — move, trim, fade it separately
  function extractAudio() {
    var c = selected(); if (!c || sel.k !== 'clip') return;
    var m = media[c.mid]; if (!m || m.kind !== 'video') return;
    if (c.speed !== 1 || rampPts(c)) return toast('Дууг салгахын тулд хурдыг 1× болгоно уу');
    toast('Дууг салгаж байна…');
    return decodeAudio(m).then(function (b) {
      if (!b) return toast('Энэ видеонд дуу алга, эсвэл хөтөч уншиж чадсангүй');
      var a = { id: uid(), mid: m.id, start: startOf(c.id), in: c.in, out: Math.min(c.out, b.duration), vol: c.mute ? 1 : c.vol, fadeIn: false, fadeOut: false };
      P.audios.push(a); c.mute = true; if (!m.wave) makeWave(m);
      sel = { k: 'audio', id: a.id }; commit(); toast('Дуу тусдаа мөрөнд гарлаа');
    });
  }
  function addSticker(em) {
    var o = newOverlay(null, em); sel = { k: 'over', id: o.id }; commit(); seek(o.start + 0.01); setScroll();
  }

  // ---------- toolbar ----------
  function tbtn(a, ic, label, cls) { return '<button type="button" class="tb' + (cls ? ' ' + cls : '') + '" data-a="' + a + '">' + ico(ic) + '<span>' + label + '</span></button>'; }
  var ADD_TOOLS = [['add', 'plus', 'Медиа'], ['stock', 'stock', 'Сан'], ['music', 'music', 'Хөгжим'], ['text', 'text', 'Текст'], ['sticker', 'sticker', 'Стикер'], ['over', 'layer', 'Давхар'], ['rec', 'mic', 'Дуу бичих']];
  // what can be set on the selected item (timeline actions — split, freeze, copy, delete — live on the timeline bar)
  function ctxTools(o) {
    var m = media[o.mid] || {};
    if (sel.k === 'clip') return (m.kind === 'video' ? [['speed', 'speed', 'Хурд'], ['vol', 'vol', 'Дуу']] : []).concat([['color', 'filter', 'Өнгө'], ['fx', 'fx', 'Эффект'], ['fit', 'crop', 'Байрлал'], ['trans', 'trans', 'Шилжилт']]);
    if (sel.k === 'over') return [['oedit', 'shape', 'Тохиргоо']].concat(o.kind === 'emoji' ? [] : [['color', 'filter', 'Өнгө'], ['chroma', 'chroma', 'Дэвсгэр арилгах']]).concat(m.kind === 'video' ? [['ovol', 'vol', 'Дуу']] : []);
    if (sel.k === 'text') return [['tedit', 'edit', 'Засах']];
    return [['avol', 'vol', 'Дуу']];
  }
  function tbs(list) { return list.map(function (t) { return tbtn(t[0], t[1], t[2], t[3]); }).join(''); }
  function refreshTB() {
    var o = sel && selected(), h;
    if (!o) h = tbs(ADD_TOOLS) + tbtn('size', 'size', 'Хэмжээ') + tbtn('bg', 'color', 'Дэвсгэр');
    else {
      var vid = sel.k === 'clip' && (media[o.mid] || {}).kind === 'video';
      h = tbtn('desel', 'back', '', 'back') + tbtn('split', 'split', 'Хуваах') + tbs(ctxTools(o)) + (vid ? tbtn('freeze', 'freeze', 'Царцаах') : '') + tbtn('dup', 'dup', 'Хувилах') + tbtn('del', 'del', 'Устгах', 'danger');
    }
    tb.innerHTML = h;
    // timeline bar state
    var at = P.clips.length ? clipAt(T) : null;
    document.getElementById('v-tdel').disabled = !o; document.getElementById('v-tdup').disabled = !o;
    document.getElementById('v-tsplit').disabled = !o && !at;
    document.getElementById('v-tfreeze').disabled = !(at && (media[at.c.mid] || {}).kind === 'video');
    document.getElementById('v-tsnap').classList.toggle('on', snapOn);
    document.getElementById('v-tmark').classList.toggle('on', markerNear(T) >= 0);
    if (desk.matches) deskPanel(o);
  }
  var KIND_NAME = { clip: 'Видео клип', over: 'Давхар', text: 'Текст', audio: 'Дуу, хөгжим' };
  var lastTab = {};
  function deskPanel(o) {
    var k = selKey();
    if (sheetClose && sheetOwner !== k) closeSheet();
    if (!rail.firstChild) rail.innerHTML = tbs(ADD_TOOLS);
    var title, sub = '';
    if (!o) {
      title = 'Төсөл'; sub = P.w + '×' + P.h + ' · ' + fmt(total());
      ptools.innerHTML = tbtn('size', 'size', 'Хэмжээ') + tbtn('bg', 'color', 'Дэвсгэр') +
        '<div class="phint"><p>Доорх timeline эсвэл дэлгэц дээрх зүйл дээр дарж сонгоод энд тохируулна. Хуваах, царцаах, устгах товч timeline-ий дээр байна.</p>' +
        '<dl><dt>Space</dt><dd>Тоглуулах / зогсоох</dd><dt>S</dt><dd>Шугам дээр хуваах</dd><dt>M</dt><dd>Тэмдэг тавих</dd><dt>N</dt><dd>Соронз асаах / унтраах</dd><dt>Delete</dt><dd>Устгах</dd><dt>Ctrl+Z</dt><dd>Буцаах</dd><dt>Ctrl+D</dt><dd>Хувилах</dd><dt>← →</dt><dd>Нэг кадр (Shift: 1 сек)</dd><dt>Ctrl+хүрд</dt><dd>Timeline томруулах</dd></dl></div>';
    } else {
      var m = media[o.mid] || {}, tools = ctxTools(o);
      title = sel.k === 'clip' ? (m.kind === 'image' ? 'Зураг' : 'Видео клип') : sel.k === 'over' ? (o.kind === 'emoji' ? 'Стикер' : m.kind === 'video' ? 'Давхар видео' : 'Давхар зураг') : KIND_NAME[sel.k];
      sub = sel.k === 'text' ? (o.text || '').replace(/\n/g, ' ').slice(0, 40) : sel.k === 'clip' ? fmt(clipLen(o)) : sel.k === 'audio' ? (m.name || '') + ' · ' + fmt(o.out - o.in) : fmt(o.end - o.start);
      ptools.innerHTML = tools.length > 1 ? '<div class="ptabs">' + tools.map(function (t) { return '<button type="button" class="tb" data-a="' + t[0] + '">' + ico(t[1]) + '<span>' + t[2] + '</span></button>'; }).join('') + '</div>' : '';
      // the remembered (or first) tab opens by itself
      if (k !== lastPanelKey) {
        var kind = sel.k + (sel.k === 'clip' ? m.kind : ''), want = tools.filter(function (t) { return t[0] === lastTab[kind]; })[0] || tools[0];
        setTimeout(function () { if (selKey() === k && !sheetClose && ACT[want[0]]) { ACT[want[0]](); markTool(want[0]); } }, 0);
      } else if (sheetClose) markTool(curTool);
    }
    document.getElementById('v-ptitle').innerHTML = esc(title) + (o ? '<button type="button" class="pclose" data-a="desel" title="Сонголтоо болих (Esc)" aria-label="Сонголтоо болих">✕</button>' : '');
    document.getElementById('v-psub').textContent = sub;
    lastPanelKey = k;
  }
  var lastPanelKey = '', curTool = '';
  function markTool(a) {
    curTool = a; ptools.querySelectorAll('.tb').forEach(function (b) { b.classList.toggle('on', b.dataset.a === a); });
    var o = sel && selected(); if (o && a) lastTab[sel.k + (sel.k === 'clip' ? (media[o.mid] || {}).kind : '')] = a;
  }
  desk.addEventListener('change', function () { closeSheet(); rail.innerHTML = ''; lastPanelKey = '-'; fitCanvas(); refresh(); });
  function refresh() { refreshTB(); renderTL(); draw(); document.getElementById('v-undo').disabled = hi <= 0; document.getElementById('v-redo').disabled = hi >= hist.length - 1; document.getElementById('v-size').innerHTML = ico('size') + '<span>' + sizeName() + '</span>'; }
  // markers (M) and snapping (N)
  var snapOn = true;
  try { snapOn = localStorage.getItem('gc-video-snap') !== '0'; } catch (e) {}
  function markerNear(t) { var ms = P.markers || []; for (var i = 0; i < ms.length; i++) if (Math.abs(ms[i] - t) < Math.max(0.05, 6 / pps)) return i; return -1; }
  function toggleMarker() {
    P.markers = P.markers || []; var i = markerNear(T);
    if (i >= 0) { P.markers.splice(i, 1); toast('Тэмдэг арилгалаа'); } else { P.markers.push(+T.toFixed(3)); P.markers.sort(function (a, b) { return a - b; }); toast('Тэмдэг тавилаа — дээр нь дарж очно, соронз наалдана'); }
    commit();
  }
  function toggleSnap() { snapOn = !snapOn; try { localStorage.setItem('gc-video-snap', snapOn ? '1' : '0'); } catch (e) {} refreshTB(); toast(snapOn ? 'Соронз асаалттай — ирмэг, шугам, тэмдэгт наалдана' : 'Соронз унтарлаа'); }
  var ACT = {
    add: function () { pick('video/*,image/*,audio/*'); }, text: addText, music: function () { sheetMusic(); }, size: function () { sheetSize(); }, bg: function () { sheetBg(); },
    stock: function () { sheetStock(false); }, sticker: function () { sheetSticker(); }, over: function () { sheetAddOver(); }, rec: function () { sheetRec(); },
    desel: function () { sel = null; refresh(); }, split: splitSel, del: delSel, dup: dupSel,
    speed: function () { sheetSpeed(); }, vol: function () { sheetVol(); }, avol: function () { sheetVol(); }, ovol: function () { sheetVol(); }, fit: function () { sheetPos(); }, trans: function () { sheetTrans(); },
    tedit: function () { sheetText(selected()); }, color: function () { sheetColor(); }, filter: function () { sheetColor(); }, adj: function () { sheetColor(); }, fx: function () { sheetFx(); },
    freeze: freezeFrame, extract: extractAudio, oedit: function () { sheetOver(); }, chroma: function () { sheetChroma(); }, mark: toggleMarker, snapt: toggleSnap
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b || b.closest('.sheet') || b.disabled) return;
    if (ACT[b.dataset.a]) ACT[b.dataset.a]();
    if (desk.matches && sheetClose && b.closest('#v-ptools')) markTool(b.dataset.a);
  });
  document.getElementById('v-play').addEventListener('click', function () { playing ? pause() : play(); });
  document.getElementById('v-undo').addEventListener('click', undo);
  document.getElementById('v-redo').addEventListener('click', redo);
  function setZoom(np) { pps = Math.round(clamp(np, 8, 400)); document.getElementById('v-zoom').value = Math.min(240, Math.max(20, pps)); renderTL(); }
  document.getElementById('v-zoom').addEventListener('input', function () { setZoom(+this.value); });
  document.getElementById('v-zin').addEventListener('click', function () { setZoom(pps * 1.4); });
  document.getElementById('v-zout').addEventListener('click', function () { setZoom(pps / 1.4); });
  document.getElementById('v-zfit').addEventListener('click', function () { setZoom((scroller.clientWidth - 160) / Math.max(1, total())); });
  document.getElementById('v-size').addEventListener('click', sheetSize);
  document.getElementById('v-export').addEventListener('click', sheetExport);
  var nameIn = document.getElementById('v-name');
  nameIn.addEventListener('change', function () { P.name = nameIn.value.trim() || 'Нэргүй видео'; commit(); });
  document.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.sheet:not(.dock)')) return;
    var mod = e.ctrlKey || e.metaKey, key = e.key.toLowerCase();
    if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
    else if (mod && key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (mod && key === 'y') { e.preventDefault(); redo(); }
    else if (mod && key === 'd') { e.preventDefault(); dupSel(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); delSel(); }
    else if (mod) return;
    else if (key === 's' || e.code === 'KeyS') splitSel();
    else if (key === 'm' || e.code === 'KeyM') toggleMarker();
    else if (key === 'n' || e.code === 'KeyN') toggleSnap();
    else if (key === '=' || key === '+') setZoom(pps * 1.25);
    else if (key === '-') setZoom(pps / 1.25);
    else if (e.key === 'Home') { seek(0); setScroll(); }
    else if (e.key === 'End') { seek(total()); setScroll(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); if (playing) pause(); seek(T + (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : 1 / FPS)); setScroll(); }
  });

  // ---------- sheets ----------
  var sheetClose = null;
  var sheetOwner = '';
  function selKey() { return sel ? sel.k + ':' + sel.id : ''; }
  function sheet(title, body, onClose) {
    closeSheet();
    if (desk.matches) {
      var d = document.createElement('div'); d.className = 'sheet dock'; d.setAttribute('aria-label', title);
      d.innerHTML = '<h3>' + title + '<button type="button" class="done">Болсон</button></h3>' + body;
      pbody.appendChild(d); sheetOwner = selKey(); if (sheetOwner) d.classList.add('tabbed'); else document.getElementById('v-panel').classList.add('free');
      requestAnimationFrame(function () { var pn = document.getElementById('v-panel'); pn.scrollTo({ top: Math.max(0, d.offsetTop - 8), behavior: 'smooth' }); });
      sheetClose = function () { d.remove(); sheetClose = null; document.getElementById('v-panel').classList.remove('free'); markTool(''); if (onClose) onClose(); };
      d.querySelector('.done').addEventListener('click', closeSheet);
      return d;
    }
    var bg = document.createElement('div'); bg.className = 'sheet-bg';
    var s = document.createElement('div'); s.className = 'sheet'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', title);
    s.innerHTML = '<div class="grab"></div><h3>' + title + '<button type="button" class="done">Болсон</button></h3>' + body;
    document.body.appendChild(bg); document.body.appendChild(s);
    sheetClose = function () { bg.remove(); s.remove(); sheetClose = null; if (onClose) onClose(); };
    bg.addEventListener('click', closeSheet); s.querySelector('.done').addEventListener('click', closeSheet);
    return s;
  }
  function closeSheet() { if (sheetClose) sheetClose(); }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (sheetClose) closeSheet(); else if (sel && desk.matches && !/INPUT|TEXTAREA/.test(e.target.tagName)) { sel = null; refresh(); }
  });
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
  // speed: constant (log slider 0.1×–10× + chips) or a ramp curve
  var SPEEDS2 = [0.1, 0.25, 0.5, 1, 1.5, 2, 3, 5, 10];
  function spToV(sp) { return Math.round(Math.log(sp / 0.1) / Math.log(100) * 100); }
  function vToSp(v) { var sp = 0.1 * Math.pow(100, v / 100); return sp < 1 ? Math.round(sp * 100) / 100 : Math.round(sp * 10) / 10; }
  function rampSvg(pts) {
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + (p[0] * 76 + 2).toFixed(1) + ' ' + (17 - Math.log(p[1]) / Math.log(2) * 6).toFixed(1); }).join(' ');
    return '<svg viewBox="0 0 80 34" class="rsv"><path d="M2 17H78" stroke="#ffffff30" stroke-dasharray="2 3"/><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>';
  }
  function sheetSpeed() {
    var c = selected(); if (!c || sel.k !== 'clip') return;
    var curve = !!rampPts(c);
    var s = sheet('Хурд', opts([['const', 'Тогтмол хурд'], ['curve', 'Муруй (speed ramp)']], curve ? 'curve' : 'const', 'smode') +
      '<div id="v-sconst"' + (curve ? ' hidden' : '') + '><label class="lbl">Хурд</label><div class="rowv"><input type="range" id="v-sp" min="0" max="100" value="' + spToV(c.speed) + '"><b id="v-spv">' + c.speed + '×</b></div>' +
      opts(SPEEDS2.map(function (v) { return [v, v + '×']; }), c.speed, 'sp') + '</div>' +
      '<div id="v-scurve" class="rgrid"' + (curve ? '' : ' hidden') + '>' + RAMPS.slice(1).map(function (r) { return '<button type="button" data-rp="' + r[0] + '" class="' + (c.ramp === r[0] ? 'on' : '') + '">' + rampSvg(r[2]) + '<span>' + r[1] + '</span></button>'; }).join('') + '</div>' +
      '<p class="note" id="v-sdur"></p>', commit);
    var sl = s.querySelector('#v-sp'), sv = s.querySelector('#v-spv'), dur = s.querySelector('#v-sdur');
    function info() { dur.textContent = 'Клипийн урт: ' + fmt(clipLen(c)) + (rampPts(c) ? ' · Муруй нь удаан хэсэгт хөдөлгөөнийг онцолж, хурдан хэсэгт алгасна.' : ' · Дуу нь хурдтайгаа хамт өөрчлөгдөнө.'); }
    function setSp(v) { c.speed = v; c.ramp = 'none'; sv.textContent = v + '×'; sl.value = spToV(v); s.querySelectorAll('[data-sp]').forEach(function (q) { q.classList.toggle('on', +q.dataset.sp === v); }); info(); changed(); }
    sl.addEventListener('input', function () { setSp(vToSp(+sl.value)); });
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sp]'); if (b) return setSp(+b.dataset.sp);
      var r = e.target.closest('[data-rp]'); if (r) { c.ramp = r.dataset.rp; s.querySelectorAll('[data-rp]').forEach(function (q) { q.classList.toggle('on', q === r); }); info(); changed(); previewRange(startOf(c.id) + 0.01, Math.min(clipLen(c), 5)); }
    });
    onOpt(s, 'smode', function (v) {
      s.querySelector('#v-sconst').hidden = v !== 'const'; s.querySelector('#v-scurve').hidden = v !== 'curve';
      if (v === 'const') { c.ramp = 'none'; s.querySelectorAll('[data-rp]').forEach(function (q) { q.classList.remove('on'); }); info(); changed(); }
    });
    info();
  }
  function sheetVol() {
    var o = selected(), isA = sel.k === 'audio', vidClip = sel.k === 'clip' && (media[o.mid] || {}).kind === 'video'; if (o.vol == null) o.vol = 1;
    var s = sheet(isA ? 'Дуу, хөгжим' : sel.k === 'over' ? 'Давхар видеоны дуу' : 'Клипийн дуу',
      '<label class="lbl">Дууны түвшин</label><div class="rowv"><input type="range" id="v-vol" min="0" max="200" value="' + Math.round(o.vol * 100) + '"><b id="v-volv">' + Math.round(o.vol * 100) + '%</b></div>' +
      (isA ? '<label class="lbl">Эхлэл, төгсгөл</label><div class="opts"><button type="button" class="opt' + (o.fadeIn ? ' on' : '') + '" data-fd="in">Зөөлөн эхлэх</button><button type="button" class="opt' + (o.fadeOut ? ' on' : '') + '" data-fd="out">Зөөлөн дуусах</button></div>' +
        (o.credit ? '<p class="note">' + esc(o.credit) + '</p>' : '')
        : '<label class="lbl">Дуугүй болгох</label>' + opts([['0', 'Дуутай'], ['1', 'Дуугүй']], o.mute ? '1' : '0', 'mu')) +
      (vidClip ? '<button type="button" class="btn-g" id="v-extract" style="width:100%;margin-top:14px">' + ico('extract') + 'Дууг тусад нь салгах</button><p class="note">Салгасан дуу «Дуу, хөгжим» мөрөнд гарч, тусад нь тайрч, зөөж болно.</p>' : ''), commit);
    s.querySelector('#v-vol').addEventListener('input', function () { o.vol = this.value / 100; s.querySelector('#v-volv').textContent = this.value + '%'; if (!isA) o.mute = o.vol === 0; changed(); });
    if (isA) s.addEventListener('click', function (e) { var b = e.target.closest('[data-fd]'); if (!b) return; var k = b.dataset.fd === 'in' ? 'fadeIn' : 'fadeOut'; o[k] = !o[k]; b.classList.toggle('on', o[k]); });
    else onOpt(s, 'mu', function (v) { o.mute = v === '1'; changed(); });
    var ex = s.querySelector('#v-extract'); if (ex) ex.addEventListener('click', function () { closeSheet(); extractAudio(); });
  }
  function sheetPos() {
    var c = selected(); if (!c || sel.k !== 'clip') return;
    var z = Math.round((c.zoom || 1) * 100);
    var s = sheet('Байрлал', opts([['fill', 'Дүүргэх'], ['fit', 'Багтаах (бүдэг дэвсгэр)']], c.fit, 'fit') +
      '<label class="lbl">Томруулах</label><div class="rowv"><input type="range" id="v-zm" min="30" max="300" value="' + z + '"><b id="v-zmv">' + z + '%</b></div>' +
      '<label class="lbl">Эргүүлэх, толин</label><div class="opts"><button type="button" class="opt" id="v-rot">↻ 90°</button><button type="button" class="opt' + (c.flip ? ' on' : '') + '" id="v-flip">⇋ Толин</button><button type="button" class="opt" id="v-reset">Анхны байдал</button></div>' +
      '<label class="lbl">Хөдөлгөөн</label>' + opts(MOTIONS, motionOf(c), 'mo') +
      '<p class="note">«Дүүргэх» — дэлгэцийг бүтэн дүүргэж, илүү хэсгийг тайрна. «Багтаах» — бүхлээр нь харуулна. Дэлгэц дээр клипээ чирж байрлалыг нь, хоёр хуруугаар томруулж болно.</p>', commit);
    var zm = s.querySelector('#v-zm'), zv = s.querySelector('#v-zmv');
    onOpt(s, 'fit', function (v) { c.fit = v; draw(); });
    zm.addEventListener('input', function () { c.zoom = zm.value / 100; zv.textContent = zm.value + '%'; draw(); });
    s.querySelector('#v-rot').addEventListener('click', function () { c.rot = ((c.rot || 0) + 90) % 360; draw(); });
    s.querySelector('#v-flip').addEventListener('click', function () { c.flip = !c.flip; this.classList.toggle('on', c.flip); draw(); });
    s.querySelector('#v-reset').addEventListener('click', function () { c.zoom = 1; c.px = 0; c.py = 0; c.rot = 0; c.flip = false; zm.value = 100; zv.textContent = '100%'; s.querySelector('#v-flip').classList.remove('on'); draw(); });
    onOpt(s, 'mo', function (v) { c.motion = v; previewRange(startOf(c.id) + 0.01, Math.min(clipLen(c), 3)); });
  }
  var SWC = ['#000000', '#ffffff', '#7b64ff', '#ff3b5c', '#ffe600', '#22c55e', '#38bdf8'];
  function swatches(cur, attr) { return '<div class="opts">' + SWC.map(function (c) { return '<button type="button" class="sw' + (cur === c ? ' on' : '') + '" style="background:' + c + '" data-' + attr + '="' + c + '" aria-label="' + c + '"></button>'; }).join('') + '<label class="sw pick" title="Өөр өнгө"><input type="color" data-' + attr + 'p value="' + (cur || '#ffffff') + '"></label></div>'; }
  function sheetTrans() {
    var c = selected(); if (!c || sel.k !== 'clip') return;
    var i = P.clips.indexOf(c), d0 = Math.round((c.trd || TR) * 10);
    var s = sheet('Шилжилт', '<p class="note" style="margin:0 0 4px">' + (i > 0 ? 'Өмнөх клипээс энэ клип рүү шилжинэ.' : 'Эхний клип — дэвсгэр өнгөнөөс гарч ирнэ.') + '</p>' +
      TRGROUPS.map(function (g) { return '<label class="lbl">' + g[0] + '</label>' + opts(g[1], c.tr || 'none', 'tr'); }).join('') +
      '<div id="v-trset"><label class="lbl">Хугацаа</label><div class="rowv"><input type="range" id="v-trd" min="1" max="20" value="' + d0 + '"><b id="v-trdv">' + (d0 / 10).toFixed(1) + 'с</b></div>' +
      '<div id="v-trdir"><label class="lbl">Чиглэл</label>' + opts([['left', '← Зүүн'], ['right', '→ Баруун'], ['up', '↑ Дээш'], ['down', '↓ Доош']], c.trdir || 'left', 'tdir') + '</div>' +
      '<div id="v-trcol"><label class="lbl">Өнгө</label>' + swatches(c.trc || (c.tr === 'dipb' ? '#000000' : '#ffffff'), 'tc') + '</div>' +
      '<label class="lbl">Хурдатгал</label>' + opts([['smooth', 'Зөөлөн'], ['out', 'Хурдан эхлэх'], ['in', 'Удаан эхлэх'], ['lin', 'Жигд']], c.tre || 'smooth', 'tre') +
      '<div class="opts" style="margin-top:14px"><button type="button" class="opt" id="v-trprev">▶ Дахин үзэх</button><button type="button" class="opt" id="v-trall">Бүх клипт хэрэглэх</button></div></div>', commit);
    function show() {
      var on = c.tr && c.tr !== 'none';
      s.querySelector('#v-trset').hidden = !on; s.querySelector('#v-trdir').hidden = !TR_DIR[c.tr]; s.querySelector('#v-trcol').hidden = !TR_COL[c.tr];
    }
    function prev() { if (c.tr && c.tr !== 'none') { var st = startOf(c.id); previewRange(Math.max(0, st - 0.6), trDur(c) + 1.2); } }
    function set(fn) { fn(); renderTL(); draw(); }
    onOpt(s, 'tr', function (v) { set(function () { c.tr = v; }); show(); prev(); });
    s.querySelector('#v-trd').addEventListener('input', function () { c.trd = this.value / 10; s.querySelector('#v-trdv').textContent = c.trd.toFixed(1) + 'с'; draw(); });
    s.querySelector('#v-trd').addEventListener('change', prev);
    onOpt(s, 'tdir', function (v) { c.trdir = v; prev(); });
    onOpt(s, 'tc', function (v) { c.trc = v; prev(); });
    s.querySelector('[data-tcp]').addEventListener('input', function () { c.trc = this.value; draw(); });
    onOpt(s, 'tre', function (v) { c.tre = v; prev(); });
    s.querySelector('#v-trprev').addEventListener('click', prev);
    s.querySelector('#v-trall').addEventListener('click', function () {
      P.clips.forEach(function (x, j) { if (j > 0 || x === c) { x.tr = c.tr; x.trd = c.trd; x.trdir = c.trdir; x.trc = c.trc; x.tre = c.tre; } });
      renderTL(); toast('Бүх клипт хэрэглэлээ');
    });
    show();
  }
  function sheetText(x, fresh) {
    if (!x) return;
    var before = JSON.stringify(x);
    var s = sheet('Текст',
      '<textarea id="v-tt" placeholder="Текстээ бичнэ үү" aria-label="Текст">' + esc(x.text) + '</textarea>' +
      '<label class="lbl">Бэлэн загвар</label><div class="opts">' + TPRESETS.map(function (t) { return '<button type="button" class="opt" data-tp="' + t[0] + '" style="' + styleTile(t[2].style).replace(/background:[^;]+;?/, '') + ';font-family:\'' + t[2].font + '\',Inter;' + (t[2].style === 'box' ? 'background:' + t[2].color + ';color:' + contrast(t[2].color) : t[2].style === 'glow' ? 'color:' + t[2].color : '') + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<label class="lbl">Хэв маяг</label><div class="styles">' + STYLES.map(function (st) { return '<button type="button" data-st="' + st[0] + '" class="' + (x.style === st[0] ? 'on' : '') + '" title="' + st[1] + '" style="' + styleTile(st[0]) + '">Аа</button>'; }).join('') + '</div>' +
      '<label class="lbl">Өнгө</label><div class="opts">' + COLORS.map(function (c) { return '<button type="button" class="sw' + (x.color === c ? ' on' : '') + '" style="background:' + c + '" data-col="' + c + '" aria-label="' + c + '"></button>'; }).join('') + '<label class="sw pick" title="Өөр өнгө"><input type="color" id="v-tc" value="' + x.color + '"></label></div>' +
      '<label class="lbl">Фонт</label><div class="opts">' + FONTS.map(function (f) { return '<button type="button" class="opt' + (x.font === f ? ' on' : '') + '" data-fo="' + f + '" style="font-family:\'' + f + '\',Inter">' + f + '</button>'; }).join('') + '</div>' +
      '<label class="lbl">Хэмжээ</label><div class="rowv"><input type="range" id="v-ts" min="3" max="20" step="0.5" value="' + (x.size * 100) + '"><b id="v-tsv">' + Math.round(x.size * 100) + '</b></div>' +
      '<label class="lbl">Эргүүлэх</label><div class="rowv"><input type="range" id="v-trot" min="-180" max="180" value="' + Math.round(x.rot || 0) + '"><b id="v-trotv">' + Math.round(x.rot || 0) + '°</b></div>' +
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
    onOpt(s, 'an', function (a) { x.anim = a; previewRange(x.start + 0.01, Math.min(1.3, x.end - x.start)); });
    s.querySelector('#v-trot').addEventListener('input', function () { x.rot = +this.value; s.querySelector('#v-trotv').textContent = this.value + '°'; draw(); });
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tp]'); if (!b) return;
      var pr = TPRESETS.filter(function (t) { return t[0] === b.dataset.tp; })[0][2];
      Object.keys(pr).forEach(function (k) { x[k] = pr[k]; });
      if (!pr.y) x.y = P.h > P.w ? 0.62 : 0.5;
      x.x = 0.5; x.rot = 0; loadFont(x.font);
      s.querySelectorAll('[data-st]').forEach(function (q) { q.classList.toggle('on', q.dataset.st === x.style); });
      s.querySelectorAll('[data-col]').forEach(function (q) { q.classList.toggle('on', q.dataset.col === x.color); });
      s.querySelectorAll('[data-fo]').forEach(function (q) { q.classList.toggle('on', q.dataset.fo === x.font); });
      s.querySelectorAll('[data-an]').forEach(function (q) { q.classList.toggle('on', q.dataset.an === x.anim); });
      s.querySelector('#v-ts').value = x.size * 100; s.querySelector('#v-tsv').textContent = Math.round(x.size * 100);
      s.querySelector('#v-trot').value = 0; s.querySelector('#v-trotv').textContent = '0°';
      if (!x.text.trim()) { x.text = b.textContent; ta.value = x.text; }
      changed();
    });
  }
  // ---------- colour (filter + adjustments in one place), effects ----------
  function thumbOf(o, isC) {
    var m = media[o.mid], el = m && (isC || m.kind !== 'video' ? m.el : elFor(o)), c = document.createElement('canvas'); c.width = 96; c.height = 96;
    var x = c.getContext('2d'); x.fillStyle = '#333'; x.fillRect(0, 0, 96, 96);
    if (el && (m.kind !== 'video' || el.readyState >= 2)) { var wh = srcWH(m, el), k = Math.max(96 / wh[0], 96 / wh[1]); try { x.drawImage(el, (96 - wh[0] * k) / 2, (96 - wh[1] * k) / 2, wh[0] * k, wh[1] * k); } catch (e) {} }
    return c;
  }
  var ADJG = [['Гэрэл', [['br', 'Гэрэлтүүлэг', -100, 100], ['ct', 'Контраст', -100, 100], ['fade', 'Бүдэг (matte)', 0, 100, 1]]],
    ['Өнгө', [['sat', 'Ханалт', -100, 100], ['warm', 'Дулаан / Хүйтэн', -100, 100, 1], ['tint', 'Ногоон / Ягаан', -100, 100, 1], ['hue', 'Өнгө эргүүлэх', -100, 100]]],
    ['Нөлөө', [['vig', 'Захын харанхуй', 0, 100, 1], ['grain', 'Ширхэг', 0, 100, 1], ['blur', 'Бүдэгрүүлэх', 0, 100]]]];
  function sheetColor() {
    var o = selected(); if (!o || (sel.k !== 'clip' && sel.k !== 'over') || o.kind === 'emoji') return;
    var isC = sel.k === 'clip'; o.adj = o.adj || {};
    var fs = o.fstr == null ? 100 : o.fstr;
    var s = sheet('Өнгө', '<label class="lbl" style="margin-top:0">Шүүлтүүр</label><div class="fgrid">' + FILTERS.map(function (f) { return '<button type="button" data-fl="' + f[0] + '" class="' + ((o.filter || 'none') === f[0] ? 'on' : '') + '"><canvas width="96" height="96"></canvas>' + f[1] + '</button>'; }).join('') + '</div>' +
      (isC ? '<label class="lbl">Шүүлтүүрийн хүч</label><div class="rowv"><input type="range" id="v-fs" min="0" max="100" value="' + fs + '"><b id="v-fsv">' + fs + '%</b></div>' : '') +
      ADJG.map(function (g) {
        var rows = g[1].filter(function (a) { return isC || !a[4]; }); if (!rows.length) return '';
        return '<div class="agrp"><b>' + g[0] + '</b>' + rows.map(function (a) { var v = o.adj[a[0]] || 0; return '<label class="lbl">' + a[1] + '</label><div class="rowv"><input type="range" data-adj="' + a[0] + '" min="' + a[2] + '" max="' + a[3] + '" value="' + v + '"><b>' + v + '</b></div>'; }).join('') + '</div>';
      }).join('') +
      '<div class="opts" style="margin-top:14px"><button type="button" class="opt" id="v-adr">Анхны байдал</button>' + (isC ? '<button type="button" class="opt" id="v-adall">Бүх клипт хэрэглэх</button>' : '') + '</div>' +
      (HAS_FILTER ? '' : '<p class="note">Энэ хөтөч шүүлтүүрийг харуулж чадахгүй байна — Chrome, Edge, Firefox дээр ажиллана.</p>'), commit);
    var base = thumbOf(o, isC);
    s.querySelectorAll('[data-fl]').forEach(function (b, i) { var x = b.querySelector('canvas').getContext('2d'); if (FILTERS[i][2] && HAS_FILTER) x.filter = FILTERS[i][2]; x.drawImage(base, 0, 0); });
    onOpt(s, 'fl', function (v) { o.filter = v; draw(); });
    var fsl = s.querySelector('#v-fs'); if (fsl) fsl.addEventListener('input', function () { o.fstr = +fsl.value; s.querySelector('#v-fsv').textContent = fsl.value + '%'; draw(); });
    s.addEventListener('input', function (e) { var r = e.target.closest('[data-adj]'); if (!r) return; o.adj[r.dataset.adj] = +r.value; r.nextElementSibling.textContent = r.value; draw(); });
    s.querySelector('#v-adr').addEventListener('click', function () {
      o.adj = {}; o.filter = 'none'; o.fstr = 100; if (fsl) { fsl.value = 100; s.querySelector('#v-fsv').textContent = '100%'; }
      s.querySelectorAll('[data-adj]').forEach(function (r) { r.value = 0; r.nextElementSibling.textContent = '0'; });
      s.querySelectorAll('[data-fl]').forEach(function (q) { q.classList.toggle('on', q.dataset.fl === 'none'); }); draw();
    });
    var all = s.querySelector('#v-adall');
    if (all) all.addEventListener('click', function () { P.clips.forEach(function (c) { c.filter = o.filter; c.fstr = o.fstr; c.adj = JSON.parse(JSON.stringify(o.adj)); }); draw(); toast('Бүх клипт хэрэглэлээ'); });
  }
  function sheetFx() {
    var c = selected(); if (!c || sel.k !== 'clip') return;
    var amt = c.fxAmt == null ? 50 : c.fxAmt, spd = Math.round((c.fxSpd || 1) * 100), L = clipLen(c), Lt = Math.round(L * 10);
    var f0 = Math.round((c.fxFrom || 0) * 10), f1 = Math.round(Math.min(L, c.fxTo == null ? L : c.fxTo) * 10);
    var s = sheet('Эффект', '<div class="opts"><button type="button" class="opt' + (!c.fx || c.fx === 'none' ? ' on' : '') + '" data-fx="none">Байхгүй</button></div>' +
      FXCATS.map(function (g) { return '<label class="lbl">' + g[0] + '</label><div class="opts">' + g[1].map(function (f) { return '<button type="button" class="opt' + (c.fx === f[0] ? ' on' : '') + '" data-fx="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '</div>'; }).join('') +
      '<div id="v-fxset"><div class="agrp"><b>Тохиргоо</b>' +
      '<label class="lbl">Хүч</label><div class="rowv"><input type="range" id="v-fa" min="5" max="100" value="' + amt + '"><b id="v-fav">' + amt + '</b></div>' +
      '<label class="lbl">Хурд</label><div class="rowv"><input type="range" id="v-fsp" min="25" max="300" step="5" value="' + spd + '"><b id="v-fspv">' + (spd / 100) + '×</b></div>' +
      '<div id="v-fxcol"><label class="lbl">Өнгө</label>' + swatches(c.fxCol || FX_COL[c.fx] || '#ffffff', 'fc') + '</div>' +
      '<label class="lbl">Хэзээ (клип дотор)</label><div class="rowv"><span class="mini">Эхлэх</span><input type="range" id="v-ff0" min="0" max="' + Lt + '" value="' + f0 + '"><b id="v-ff0v">' + (f0 / 10).toFixed(1) + 'с</b></div>' +
      '<div class="rowv"><span class="mini">Дуусах</span><input type="range" id="v-ff1" min="0" max="' + Lt + '" value="' + f1 + '"><b id="v-ff1v">' + (f1 / 10).toFixed(1) + 'с</b></div>' +
      '<div class="opts" style="margin-top:10px"><button type="button" class="opt" id="v-ffall">Бүтэн клипт</button><button type="button" class="opt" id="v-ffprev">▶ Дахин үзэх</button></div></div></div>', commit);
    function show() { s.querySelector('#v-fxset').hidden = !c.fx || c.fx === 'none'; s.querySelector('#v-fxcol').hidden = !FX_COL[c.fx]; }
    function prev() { var a = startOf(c.id) + (c.fxFrom || 0) + 0.01; previewRange(a, Math.min(2.5, Math.max(0.5, Math.min(L, c.fxTo == null ? L : c.fxTo) - (c.fxFrom || 0)))); }
    onOpt(s, 'fx', function (v) {
      c.fx = v; if (c.fxCol && !FX_COL[v]) c.fxCol = null;
      s.querySelectorAll('[data-fc]').forEach(function (q) { q.classList.toggle('on', q.dataset.fc === (c.fxCol || FX_COL[v])); });
      show(); prev();
    });
    s.querySelector('#v-fa').addEventListener('input', function () { c.fxAmt = +this.value; s.querySelector('#v-fav').textContent = this.value; draw(); });
    s.querySelector('#v-fsp').addEventListener('input', function () { c.fxSpd = this.value / 100; s.querySelector('#v-fspv').textContent = c.fxSpd + '×'; draw(); });
    s.querySelector('#v-fsp').addEventListener('change', prev);
    onOpt(s, 'fc', function (v) { c.fxCol = v; prev(); });
    s.querySelector('[data-fcp]').addEventListener('input', function () { c.fxCol = this.value; draw(); });
    var r0 = s.querySelector('#v-ff0'), r1 = s.querySelector('#v-ff1');
    function rng(which) {
      var a = +r0.value, b = +r1.value;
      if (b - a < 3) { if (which === 0) a = Math.max(0, b - 3); else b = Math.min(Lt, a + 3); r0.value = a; r1.value = b; }
      c.fxFrom = a / 10; c.fxTo = b >= Lt ? null : b / 10;
      s.querySelector('#v-ff0v').textContent = (a / 10).toFixed(1) + 'с'; s.querySelector('#v-ff1v').textContent = (b / 10).toFixed(1) + 'с';
      seek(startOf(c.id) + (which ? Math.max(a, b / 10 * 10 - 1) / 10 : a / 10) + 0.01);
    }
    r0.addEventListener('input', function () { rng(0); }); r1.addEventListener('input', function () { rng(1); });
    r0.addEventListener('change', prev); r1.addEventListener('change', prev);
    s.querySelector('#v-ffall').addEventListener('click', function () { c.fxFrom = 0; c.fxTo = null; r0.value = 0; r1.value = Lt; s.querySelector('#v-ff0v').textContent = '0.0с'; s.querySelector('#v-ff1v').textContent = (Lt / 10).toFixed(1) + 'с'; prev(); });
    s.querySelector('#v-ffprev').addEventListener('click', prev);
    show();
  }


  // ---------- overlays: settings, background removal ----------
  function sheetOver() {
    var o = selected(); if (!o || sel.k !== 'over') return;
    var em = o.kind === 'emoji', w = Math.round(o.w * 100), op = Math.round((o.opacity == null ? 1 : o.opacity) * 100);
    var s = sheet(em ? 'Стикер' : 'Давхар',
      (em ? '' : '<label class="lbl">Хэлбэр</label>' + opts([['rect', 'Тэгш өнцөгт'], ['round', 'Бөөрөнхий'], ['circle', 'Дугуй']], o.shape || 'rect', 'osh')) +
      '<label class="lbl">Хэмжээ</label><div class="rowv"><input type="range" id="v-ow" min="3" max="150" value="' + w + '"><b id="v-owv">' + w + '%</b></div>' +
      '<label class="lbl">Тунгалаг</label><div class="rowv"><input type="range" id="v-op" min="5" max="100" value="' + op + '"><b id="v-opv">' + op + '%</b></div>' +
      '<label class="lbl">Гарч ирэх</label>' + opts(OANIMS, o.anim || 'none', 'oa') +
      '<label class="lbl">Байрлал</label><div class="opts">' + (em ? '' : '<button type="button" class="opt" data-pos="full">Бүтэн дэлгэц</button>') + '<button type="button" class="opt" data-pos="center">Голлуулах</button><button type="button" class="opt" data-pos="flip">⇋ Толин</button><button type="button" class="opt" data-pos="rot0">Эргэлтгүй</button></div>' +
      '<label class="lbl">Давхаргын дараалал</label><div class="opts"><button type="button" class="opt" data-pos="front">Хамгийн урд</button><button type="button" class="opt" data-pos="back">Хамгийн ард</button></div>' +
      '<p class="note">Дэлгэц дээр чирж байрлуулна. Булангаас нь чирж томруулж, дээд бөмбөлгөөр эргүүлнэ (утсан дээр хоёр хуруугаар).</p>', commit);
    var ow = s.querySelector('#v-ow'), owv = s.querySelector('#v-owv');
    onOpt(s, 'osh', function (v) { o.shape = v; draw(); });
    ow.addEventListener('input', function () { o.w = ow.value / 100; owv.textContent = ow.value + '%'; draw(); });
    s.querySelector('#v-op').addEventListener('input', function () { o.opacity = this.value / 100; s.querySelector('#v-opv').textContent = this.value + '%'; draw(); });
    onOpt(s, 'oa', function (v) { o.anim = v; previewRange(o.start + 0.01, Math.min(1.2, o.end - o.start)); });
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pos]'); if (!b) return;
      var p = b.dataset.pos;
      if (p === 'full') { var bx = ovBox(o), ar = bx ? bx.h / bx.w : 1; o.x = 0.5; o.y = 0.5; o.rot = 0; o.shape = 'rect'; o.w = Math.max(1, P.h / (P.w * ar)); s.querySelectorAll('[data-osh]').forEach(function (q) { q.classList.toggle('on', q.dataset.osh === 'rect'); }); }
      else if (p === 'front' || p === 'back') { var li = P.overlays.indexOf(o); P.overlays.splice(li, 1); if (p === 'front') P.overlays.push(o); else P.overlays.unshift(o); toast(p === 'front' ? 'Урд гаргалаа' : 'Ард орууллаа'); }
      else if (p === 'center') { o.x = 0.5; o.y = 0.5; }
      else if (p === 'flip') o.flip = !o.flip;
      else o.rot = 0;
      ow.value = Math.round(o.w * 100); owv.textContent = ow.value + '%'; draw();
    });
  }
  // the colour of the source's corners — usually the green / blue screen
  function cornerColor(el, m) {
    var c = document.createElement('canvas'); c.width = 32; c.height = 32; var x = c.getContext('2d', { willReadFrequently: true });
    try { x.drawImage(el, 0, 0, 32, 32); var d = x.getImageData(0, 0, 32, 32).data, r = 0, g = 0, b = 0, n = 0;
      [[1, 1], [30, 1], [1, 30], [30, 30], [16, 1], [1, 16], [30, 16]].forEach(function (p) { var i = (p[1] * 32 + p[0]) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; });
      r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx - mn < 60) return null;     // corners are not a saturated screen colour — keep the default
      return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    } catch (e) { return null; }
  }
  var picking = null;
  function sheetChroma() {
    var o = selected(); if (!o || sel.k !== 'over' || o.kind === 'emoji') return;
    var m = media[o.mid], el = m.kind === 'video' ? elFor(o) : m.el;
    o.chroma = o.chroma || { on: false, color: '#00ff00', tol: 40 };
    var ch = o.chroma;
    if (!ch.on && !ch.set) { ch.on = true; ch.set = 1; var cc = cornerColor(el, m); if (cc) ch.color = cc; draw(); }
    var KC = [['#00ff00', 'Ногоон'], ['#00b140', 'Хар ногоон'], ['#0047bb', 'Цэнхэр'], ['#ffffff', 'Цагаан'], ['#000000', 'Хар']];
    var s = sheet('Дэвсгэр арилгах', opts([['1', 'Асаалттай'], ['0', 'Унтраах']], ch.on ? '1' : '0', 'ck') +
      '<label class="lbl">Арилгах өнгө</label><div class="opts">' + KC.map(function (k) { return '<button type="button" class="sw' + (ch.color === k[0] ? ' on' : '') + '" style="background:' + k[0] + '" data-kc="' + k[0] + '" title="' + k[1] + '" aria-label="' + k[1] + '"></button>'; }).join('') +
      '<label class="sw pick" title="Өөр өнгө"><input type="color" id="v-kc" value="' + ch.color + '"></label><button type="button" class="opt" id="v-kpick">Дэлгэцээс сонгох</button></div>' +
      '<label class="lbl">Хүч</label><div class="rowv"><input type="range" id="v-kt" min="0" max="100" value="' + (ch.tol == null ? 40 : ch.tol) + '"><b id="v-ktv">' + (ch.tol == null ? 40 : ch.tol) + '</b></div>' +
      '<p class="note">Ногоон, цэнхэр дэвсгэртэй (green screen) видео, зургийн дэвсгэрийг арилгаж, доорх видеог харуулна. Өнгийг автоматаар таньсан — таарахгүй бол «Дэлгэцээс сонгох»-оор дэвсгэр дээр нь дарна.</p>', function () { picking = null; commit(); });
    onOpt(s, 'ck', function (v) { ch.on = v === '1'; draw(); });
    onOpt(s, 'kc', function (v) { ch.color = v; ch.on = true; draw(); });
    s.querySelector('#v-kc').addEventListener('input', function () { ch.color = this.value; ch.on = true; draw(); });
    s.querySelector('#v-kt').addEventListener('input', function () { ch.tol = +this.value; s.querySelector('#v-ktv').textContent = this.value; draw(); });
    s.querySelector('#v-kpick').addEventListener('click', function () {
      var bg = document.querySelector('.sheet-bg'); if (bg) bg.style.pointerEvents = 'none';
      toast('Видео дээрх арилгах өнгөн дээр дарна уу', 4000);
      picking = function (p) {
        if (bg) bg.style.pointerEvents = '';
        ch.on = false; renderFrame(cx, cv.width / P.w, T, true);
        var k = cv.width / P.w, d = cx.getImageData(clamp(Math.round(p.x * k), 0, cv.width - 1), clamp(Math.round(p.y * k), 0, cv.height - 1), 1, 1).data;
        ch.color = '#' + ((1 << 24) | (d[0] << 16) | (d[1] << 8) | d[2]).toString(16).slice(1); ch.on = true;
        s.querySelector('#v-kc').value = ch.color; s.querySelectorAll('[data-kc]').forEach(function (q) { q.classList.remove('on'); });
        s.querySelectorAll('[data-ck]').forEach(function (q) { q.classList.toggle('on', q.dataset.ck === '1'); });
        draw(); toast('Өнгө сонголоо');
      };
    });
  }
  function sheetSticker() {
    var s = sheet('Стикер', '<div class="emo">' + EMOJI.map(function (e) { return '<button type="button" data-em="' + e + '" aria-label="' + e + '">' + e + '</button>'; }).join('') + '</div>');
    s.addEventListener('click', function (e) { var b = e.target.closest('[data-em]'); if (!b) return; closeSheet(); addSticker(b.dataset.em); });
  }
  function sheetAddOver() {
    var s = sheet('Давхар нэмэх',
      '<p class="note" style="margin:0 0 12px">Үндсэн видеоны дээр өөр видео, зураг, стикер давхарлана (зураг доторх зураг). Ногоон дэвсгэртэй бол арилгаж болно.</p>' +
      '<div class="opts" style="flex-direction:column"><button type="button" class="opt" data-ao="file" style="text-align:left;min-height:52px">📁  Төхөөрөмжөөс видео, зураг</button>' +
      '<button type="button" class="opt" data-ao="stock" style="text-align:left;min-height:52px">🎞  Сангаас (Pexels, Pixabay)</button>' +
      '<button type="button" class="opt" data-ao="sticker" style="text-align:left;min-height:52px">😀  Стикер</button></div>' +
      '<label class="lbl">Холбоосоор нэмэх</label><div class="srch"><input type="url" id="v-ourl" placeholder="https://…/video.mp4" spellcheck="false"><button type="button" class="btn-g" id="v-ourlgo">Нэмэх</button></div>');
    s.querySelector('#v-ourlgo').addEventListener('click', function () { var u = s.querySelector('#v-ourl').value.trim(); if (!u) return; closeSheet(); addFromLink(u, true); });
    s.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ao]'); if (!b) return; var a = b.dataset.ao; closeSheet();
      if (a === 'file') pick('video/*,image/*', true); else if (a === 'stock') sheetStock(true); else sheetSticker();
    });
  }

  // ---------- stock videos / photos (Pexels, Pixabay through the site's own API) ----------
  var stockQ = { type: 'video', src: 'pexels', q: '' };
  function stockUrl(it) {
    if (it.kind === 'video' && /^px\d+$/.test(it.id)) return '/api/stock/video?id=' + it.id.slice(2);
    return '/api/stock/file?u=' + encodeURIComponent(it.full || it.preview || it.thumb);
  }
  function sheetStock(asOver) {
    var s = sheet(asOver ? 'Давхар — сан' : 'Видео, зургийн сан',
      '<div class="srch"><input type="text" id="v-sq" placeholder="Хайх: байгаль, хот, кофе…" value="' + esc(stockQ.q) + '" enterkeyhint="search"><button type="button" class="btn-x" id="v-sgo">Хайх</button></div>' +
      '<div class="opts">' + opts([['video', 'Видео'], ['photo', 'Зураг']], stockQ.type, 'stt').slice(18, -6) + '<span style="width:12px"></span>' + opts([['pexels', 'Pexels'], ['pixabay', 'Pixabay']], stockQ.src, 'sts').slice(18, -6) + '</div>' +
      '<div class="sgrid" id="v-sg" style="margin-top:12px"></div><button type="button" class="btn-g" id="v-smore" style="width:100%;margin-top:10px" hidden>Цааш үзэх</button>' +
      '<p class="note">Pexels, Pixabay-ийн үнэгүй видео, зураг — <a href="https://www.pexels.com" target="_blank" rel="noopener" style="color:inherit">Pexels</a>, <a href="https://pixabay.com" target="_blank" rel="noopener" style="color:inherit">Pixabay</a>. Зураг дээр зохиогчийн нэр бий.</p>');
    var grid = s.querySelector('#v-sg'), more = s.querySelector('#v-smore'), qIn = s.querySelector('#v-sq'), page = 1, items = [], seq = 0;
    function load(reset) {
      if (reset) { page = 1; items = []; grid.innerHTML = '<p class="note">Ачаалж байна…</p>'; }
      var my = ++seq; more.hidden = true;
      fetch('/api/stock?src=' + stockQ.src + '&type=' + stockQ.type + '&q=' + encodeURIComponent(stockQ.q) + '&page=' + page).then(function (r) { return r.json(); }).then(function (d) {
        if (my !== seq) return;
        if (!d || d.error) throw new Error(d && d.error);
        if (reset) grid.innerHTML = '';
        var list = d.items || [];
        if (!list.length && reset) grid.innerHTML = '<p class="note">Олдсонгүй. Өөр үгээр хайгаад үзээрэй.</p>';
        list.forEach(function (it) {
          items.push(it);
          var b = document.createElement('button'); b.type = 'button'; b.dataset.si = items.length - 1; b.title = (it.author || '') + (it.kind === 'video' ? ' · ' + Math.round(it.dur || 0) + 'с' : '');
          b.innerHTML = '<img loading="lazy" alt="" src="' + esc(it.thumb) + '"><em>' + (it.kind === 'video' ? '▶ ' + Math.round(it.dur || 0) + 'с' : esc((it.author || '').slice(0, 16))) + '</em>';
          grid.appendChild(b);
        });
        more.hidden = list.length < 20;
      }).catch(function () { if (my === seq) grid.innerHTML = '<p class="note">Сан ачаалж чадсангүй. Дахин оролдоно уу.</p>'; });
    }
    function go() { stockQ.q = qIn.value.trim(); load(true); }
    s.querySelector('#v-sgo').addEventListener('click', go);
    qIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    onOpt(s, 'stt', function (v) { stockQ.type = v; load(true); });
    onOpt(s, 'sts', function (v) { stockQ.src = v; load(true); });
    more.addEventListener('click', function () { page++; load(false); });
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('[data-si]'); if (!b || b.classList.contains('busy')) return;
      var it = items[+b.dataset.si]; b.classList.add('busy');
      toast(it.kind === 'video' ? 'Видео татаж байна…' : 'Зураг татаж байна…', 8000);
      fetch(stockUrl(it)).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.blob(); }).then(function (blob) {
        var vid = it.kind === 'video', type = blob.type && blob.type !== 'application/octet-stream' ? blob.type : (vid ? 'video/mp4' : 'image/jpeg');
        var name = (stockQ.src === 'pexels' ? 'Pexels' : 'Pixabay') + (it.author ? ' · ' + it.author : '') + (vid ? '.mp4' : '.jpg');
        closeSheet();
        return addFiles([new File([blob], name, { type: type })], asOver);
      }).catch(function () { b.classList.remove('busy'); toast('Татаж чадсангүй. Дахин оролдоно уу.'); });
    });
    load(true);
  }

  // ---------- music library (free Creative Commons music + sound effects via /api/music), own files, links ----------
  var MOODS = [['', 'Алдартай', ''], ['happy', 'Хөгжилтэй', 'happy upbeat'], ['energy', 'Эрч хүчтэй', 'energetic upbeat'], ['calm', 'Тайван', 'calm relaxing'], ['lofi', 'Lo-fi', 'lofi chill'],
    ['cine', 'Кино', 'cinematic epic'], ['love', 'Романтик', 'romantic love'], ['pop', 'Поп', 'pop'], ['hiphop', 'Хип хоп', 'hip hop beat'], ['edm', 'Электрон', 'electronic dance'],
    ['acoustic', 'Гитар', 'acoustic guitar'], ['piano', 'Төгөлдөр хуур', 'piano'], ['sad', 'Гунигтай', 'sad emotional'], ['corp', 'Бизнес', 'corporate background'], ['kids', 'Хүүхэд', 'kids playful']];
  var SFX = [['', 'Алдартай', ''], ['whoosh', 'Шуугих', 'whoosh'], ['click', 'Товшилт', 'click'], ['pop', 'Поп', 'pop'], ['ding', 'Хонх', 'ding bell'], ['applause', 'Алга ташилт', 'applause'],
    ['laugh', 'Инээд', 'laugh'], ['boom', 'Тэсрэлт', 'boom impact'], ['swoosh', 'Шилжилт', 'transition swoosh'], ['camera', 'Камер', 'camera shutter'], ['notif', 'Мэдэгдэл', 'notification'],
    ['nature', 'Байгаль', 'nature birds'], ['rain', 'Бороо', 'rain'], ['crowd', 'Олон хүн', 'crowd']];
  var musQ = { cat: 'music', mood: '', q: '', com: false };
  var prevAud = null;
  function stopPreview() { if (prevAud) { prevAud.pause(); prevAud.removeAttribute('src'); prevAud.load(); } document.querySelectorAll('.mrow.pl').forEach(function (r) { r.classList.remove('pl'); }); }
  function addAudioFile(file, credit) {
    return loadMedia(file, 'audio').then(function (m) {
      var st = T < total() - 0.5 ? T : 0;
      var a = { id: uid(), mid: m.id, start: st, in: 0, out: m.dur, vol: 1, fadeIn: false, fadeOut: true };
      if (credit) a.credit = credit;
      P.audios.push(a); sel = { k: 'audio', id: a.id }; commit(); toast('Хөгжим нэмэгдлээ');
    });
  }
  function sheetMusic() {
    var s = sheet('Хөгжим, дуу', opts([['music', 'Хөгжим'], ['sound_effect', 'Дуу эффект'], ['mine', 'Өөрийн файл']], musQ.cat, 'mcat') +
      '<div id="v-mlib"><div class="srch" style="margin-top:12px"><input type="text" id="v-mq" placeholder="Хайх: summer, гитар, хөгжилтэй…" value="' + esc(musQ.q) + '" enterkeyhint="search"><button type="button" class="btn-x" id="v-mgo">Хайх</button></div>' +
      '<div class="chips" id="v-mmood"></div>' +
      '<label class="chk"><input type="checkbox" id="v-mcom"' + (musQ.com ? ' checked' : '') + '> Зөвхөн арилжаанд (бизнест) ашиглаж болох</label>' +
      '<div class="mlist" id="v-ml"></div><button type="button" class="btn-g" id="v-mmore" style="width:100%;margin-top:10px" hidden>Цааш үзэх</button>' +
      '<p class="note">Creative Commons лицензтэй үнэгүй хөгжим (Jamendo, Freesound, ccMixter — <a href="https://openverse.org" target="_blank" rel="noopener" style="color:inherit">Openverse</a>). «CC BY» бол видеоныхоо тайлбарт зохиогчийг дурдана — татах үед бэлэн текст гарна. «NC» нь арилжааны бус.</p></div>' +
      '<div id="v-mmine" hidden><button type="button" class="btn-x" id="v-mfile" style="width:100%;margin-top:14px;height:46px">' + ico('plus') + 'Төхөөрөмжөөс дуу сонгох</button>' +
      '<label class="lbl">Холбоосоор нэмэх</label><div class="srch"><input type="url" id="v-murl" placeholder="https://…/song.mp3" spellcheck="false"><button type="button" class="btn-g" id="v-murlgo">Нэмэх</button></div>' +
      '<p class="note">mp3, m4a, wav, ogg файлын шууд холбоос. Мөн mp4 видеоны холбоос оруулбал видео нь нэмэгдэнэ. YouTube, TikTok-ийн хуудасны холбоос ажиллахгүй.</p></div>',
      stopPreview);
    var list = s.querySelector('#v-ml'), more = s.querySelector('#v-mmore'), qIn = s.querySelector('#v-mq'), page = 1, items = [], seq = 0;
    function chips() { var src = musQ.cat === 'sound_effect' ? SFX : MOODS; s.querySelector('#v-mmood').innerHTML = src.map(function (m) { return '<button type="button" class="chip2' + (musQ.mood === m[0] ? ' on' : '') + '" data-md="' + m[0] + '">' + m[1] + '</button>'; }).join(''); }
    function load(reset) {
      if (reset) { page = 1; items = []; list.innerHTML = '<p class="note">Ачаалж байна…</p>'; stopPreview(); }
      var my = ++seq, src = musQ.cat === 'sound_effect' ? SFX : MOODS, mood = src.filter(function (m) { return m[0] === musQ.mood; })[0], q = (musQ.q + ' ' + (mood ? mood[2] : '')).trim();
      more.hidden = true;
      fetch('/api/music?cat=' + musQ.cat + '&q=' + encodeURIComponent(q) + '&page=' + page + (musQ.com ? '&com=1' : '')).then(function (r) { return r.json(); }).then(function (d) {
        if (my !== seq) return;
        if (!d || d.error) throw new Error(d && d.error);
        if (reset) list.innerHTML = '';
        if (!(d.items || []).length && reset) list.innerHTML = '<p class="note">Олдсонгүй. Өөр үгээр (англиар илүү сайн) хайгаад үзээрэй.</p>';
        (d.items || []).forEach(function (it) {
          items.push(it);
          var r = document.createElement('div'); r.className = 'mrow'; r.dataset.mi = items.length - 1;
          r.innerHTML = '<button type="button" class="mplay" data-mp aria-label="Сонсох">' + ico('play') + ico('pause') + '</button>' +
            '<span class="mt"><b>' + esc(it.title) + '</b><small>' + esc(it.author || '') + (it.dur ? ' · ' + fmt(it.dur).replace(/\.\d$/, '') : '') + ' · <em>' + esc(it.license || 'CC') + '</em></small></span>' +
            '<button type="button" class="btn-g madd" data-ma>' + ico('plus') + '<span>Нэмэх</span></button>';
          list.appendChild(r);
        });
        more.hidden = (d.items || []).length < 15;
      }).catch(function () { if (my === seq) list.innerHTML = '<p class="note">Хөгжмийн сан ачаалж чадсангүй. Дахин оролдоно уу.</p>'; });
    }
    function go() { musQ.q = qIn.value.trim(); load(true); }
    s.querySelector('#v-mgo').addEventListener('click', go);
    qIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    s.querySelector('#v-mcom').addEventListener('change', function () { musQ.com = this.checked; load(true); });
    onOpt(s, 'mcat', function (v) {
      var mine = v === 'mine'; s.querySelector('#v-mlib').hidden = mine; s.querySelector('#v-mmine').hidden = !mine; stopPreview();
      if (!mine) { musQ.cat = v; musQ.mood = ''; chips(); load(true); }
    });
    more.addEventListener('click', function () { page++; load(false); });
    s.addEventListener('click', function (e) {
      var c = e.target.closest('[data-md]');
      if (c) { musQ.mood = c.dataset.md; s.querySelectorAll('[data-md]').forEach(function (q) { q.classList.toggle('on', q === c); }); load(true); return; }
      var row = e.target.closest('.mrow'); if (!row) return;
      var it = items[+row.dataset.mi], fu = '/api/music/file?u=' + encodeURIComponent(it.file);
      if (e.target.closest('[data-mp]')) {
        var on = row.classList.contains('pl'); stopPreview(); if (on) return;
        prevAud = prevAud || new Audio(); prevAud.src = fu; prevAud.play().catch(function () { toast('Сонсгож чадсангүй'); row.classList.remove('pl'); });
        prevAud.onended = function () { row.classList.remove('pl'); };
        row.classList.add('pl'); return;
      }
      if (e.target.closest('[data-ma]')) {
        var b = e.target.closest('[data-ma]'); if (b.disabled) return; b.disabled = true; b.querySelector('span').textContent = 'Татаж байна…';
        fetch(fu).then(function (r) { if (!r.ok) throw new Error('http'); return r.blob(); }).then(function (blob) {
          var type = /^audio\//.test(blob.type) ? blob.type : 'audio/mpeg';
          var credit = '«' + it.title + '» — ' + (it.author || 'тодорхойгүй') + ' (' + (it.license || 'CC') + (it.source ? ', ' + it.source : '') + ')' + (it.page ? ' ' + it.page : '');
          closeSheet();
          return addAudioFile(new File([blob], it.title + (it.author ? ' — ' + it.author : '') + '.mp3', { type: type }), credit);
        }).catch(function () { b.disabled = false; b.querySelector('span').textContent = 'Нэмэх'; toast('Татаж чадсангүй. Өөр дуу сонгоод үзээрэй.'); });
      }
    });
    s.querySelector('#v-mfile').addEventListener('click', function () { closeSheet(); pick('audio/*'); });
    var uIn = s.querySelector('#v-murl');
    function addUrl() { var u = uIn.value.trim(); if (!u) return uIn.focus(); closeSheet(); addFromLink(u); }
    s.querySelector('#v-murlgo').addEventListener('click', addUrl);
    uIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } });
    if (musQ.cat === 'mine') { s.querySelector('#v-mlib').hidden = true; s.querySelector('#v-mmine').hidden = false; } else { chips(); load(true); }
  }
  // a direct file link (audio → music track, video / photo → main track) through the site's /api/fetch
  function addFromLink(u, asOver) {
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    if (/(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch)/i.test(u)) { toast('YouTube, TikTok, Instagram, Facebook-ийн хуудаснаас шууд татах боломжгүй. Файлаа татаад «Медиа»-гаар нэмнэ үү.', 5000); return Promise.resolve(); }
    toast('Холбоосоос татаж байна…', 10000);
    return fetch('/api/fetch?u=' + encodeURIComponent(u)).then(function (r) {
      if (r.status === 415) throw new Error('not_media'); if (r.status === 413) throw new Error('too_large'); if (!r.ok) throw new Error('http');
      return r.blob();
    }).then(function (blob) {
      var name = decodeURIComponent((u.split('?')[0].split('/').pop() || 'file')).slice(0, 80) || 'file';
      var f = new File([blob], name, { type: blob.type });
      if (/^audio\//.test(blob.type)) return addAudioFile(f);
      return addFiles([f], asOver);
    }).catch(function (e) {
      toast(e.message === 'not_media' ? 'Энэ холбоос дуу, видео, зургийн шууд файл биш байна (.mp3, .mp4, .jpg гэх мэтээр төгссөн холбоос хэрэгтэй)' : e.message === 'too_large' ? 'Файл хэт том байна (150 MB хүртэл)' : 'Холбоосоос татаж чадсангүй', 5000);
    });
  }

  // ---------- voice-over ----------
  function sheetRec() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) return toast('Энэ хөтөч дуу бичихийг дэмжихгүй байна');
    if (playing) pause();
    var rec = null, stream = null, chunks = [], startT = 0, t0r = 0, tick = 0;
    var s = sheet('Дуу бичих', '<div class="rec"><button type="button" class="dot" id="v-rdot" aria-label="Бичиж эхлэх"></button><b id="v-rt">0:00.0</b>' +
      '<p class="note" id="v-rn" style="text-align:center">Улаан товч дээр дарахад видео тоглож, таны дуу бичигдэнэ (шугамын байрлалаас). Дахин дарж зогсооно. Чихэвч зүүвэл цэвэр бичигдэнэ.</p></div>', function () { stop(); });
    var dot = s.querySelector('#v-rdot'), lab = s.querySelector('#v-rt');
    function stop() { clearInterval(tick); if (rec && rec.state !== 'inactive') rec.stop(); }
    dot.addEventListener('click', function () {
      if (rec) { stop(); return; }
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (st) {
        stream = st; chunks = [];
        rec = new MediaRecorder(st);
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          stream.getTracks().forEach(function (t) { t.stop(); });
          if (playing) pause();
          dot.classList.remove('on');
          var type = rec.mimeType || 'audio/webm', blob = new Blob(chunks, { type: type }), ext = /mp4|m4a|aac/.test(type) ? '.m4a' : /ogg/.test(type) ? '.ogg' : '.webm';
          rec = null;
          if (!blob.size) return;
          loadMedia(new File([blob], 'Дуу бичлэг' + ext, { type: type }), 'audio').then(function (m) {
            var a = { id: uid(), mid: m.id, start: startT, in: 0, out: m.dur, vol: 1, fadeIn: false, fadeOut: false };
            P.audios.push(a); sel = { k: 'audio', id: a.id }; commit(); toast('Дуу бичлэг нэмэгдлээ');
          }).catch(function () { toast('Бичлэгийг уншиж чадсангүй'); });
        };
        startT = T >= total() - 0.05 ? 0 : T; seek(startT);
        rec.start(250); t0r = performance.now(); dot.classList.add('on');
        if (total() > 0) play();
        tick = setInterval(function () { lab.textContent = fmt((performance.now() - t0r) / 1000); }, 100);
      }).catch(function () { toast('Микрофон ашиглах зөвшөөрөл өгнө үү'); });
    });
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
    P.overlays.forEach(function (o) { var m = media[o.mid]; if (m && m.kind === 'video' && !o.mute && (o.vol == null ? 1 : o.vol) > 0) srcs.push({ o: o, m: m }); });
    if (!srcs.length) return Promise.resolve(null);
    return Promise.all(srcs.map(function (s) { return decodeAudio(s.m); })).then(function (bufs) {
      if (!bufs.some(Boolean)) return null;
      var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext, ctx = new AC(2, Math.max(1, Math.ceil(D * 48000)), 48000);
      srcs.forEach(function (s, i) {
        var b = bufs[i]; if (!b) return;
        var src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; src.connect(g); g.connect(ctx.destination);
        if (s.o) {
          if (s.o.start >= D) return;
          g.gain.value = s.o.vol == null ? 1 : s.o.vol;
          var oi = Math.min(s.o.in || 0, b.duration);
          var od = Math.min(Math.min(s.o.end, D) - s.o.start, b.duration - oi);
          if (od > 0) src.start(s.o.start, oi, od);
        } else if (s.c) {
          g.gain.value = s.c.vol;
          if (rampPts(s.c)) { var Lc = clipLen(s.c); src.playbackRate.setValueAtTime(rateAt(s.c, 0), s.start); for (var q = 1; q <= 48; q++) src.playbackRate.linearRampToValueAtTime(rateAt(s.c, Lc * q / 48), s.start + Lc * q / 48); }
          else src.playbackRate.value = s.c.speed;
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
  var RVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype, xPlay = [];
  function watch(v) {
    if (v._w) return; v._w = 1; v._mt = -1;
    var cb = function (now, md) { v._mt = md.mediaTime; v.requestVideoFrameCallback(cb); };
    v.requestVideoFrameCallback(cb);
  }
  // pause every export-playing element that is not in `keep`
  function xStop(keep) { xPlay = xPlay.filter(function (v) { if (keep && keep.indexOf(v) >= 0) return true; v.pause(); return false; }); }
  function frameAt(v, speed, target, dur) {
    if (!RVFC) return seekV(v, target);
    watch(v); v.muted = true;
    var tol = 0.5 / FPS * speed;
    var restart = xPlay.indexOf(v) < 0 || v.paused || v.ended || v._mt > target + 0.12 * speed || v._mt < target - 0.6 * speed;
    var go = restart ? (function () {
      v.pause(); if (xPlay.indexOf(v) < 0) xPlay.push(v);
      return seekV(v, target).then(function () { v._mt = v.currentTime; v.playbackRate = speed; var pr = v.play(); return pr ? pr.catch(function () {}) : null; });
    })() : (Math.abs(v.playbackRate - speed) > 0.01 ? (v.playbackRate = speed, Promise.resolve()) : Promise.resolve());
    return go.then(function () {
      if (v._mt >= target - tol) return;
      return new Promise(function (res) {
        var t0 = performance.now();
        (function w() {
          if (v._mt >= target - tol || v.ended || v.currentTime >= dur - 0.05) return res();
          if (performance.now() - t0 > 2500) { v.pause(); return seekV(v, target).then(res); }
          setTimeout(w, 4);
        })();
      });
    });
  }
  // every video that must show a frame at time t: the main clip and any video overlays
  function framesAt(t) {
    var need = [], ps = [], at = P.clips.length ? clipAt(t) : null;
    if (at && media[at.c.mid].kind === 'video') { var m = media[at.c.mid]; need.push(m.el); ps.push(frameAt(m.el, clamp(rateAt(at.c, at.local), 0.0625, 16), Math.min(m.dur - 0.01, srcAt(at.c, at.local)), m.dur)); }
    P.overlays.forEach(function (o) {
      var mo = media[o.mid]; if (!mo || mo.kind !== 'video' || t < o.start || t >= o.end) return;
      var v = elFor(o); need.push(v); ps.push(frameAt(v, 1, Math.min(mo.dur - 0.01, (o.in || 0) + (t - o.start)), mo.dur));
    });
    xStop(need);
    if (at && at.i > 0 && at.c.tr && at.c.tr !== 'none' && at.local < trDur(at.c)) {
      var pc = P.clips[at.i - 1], pm = media[pc.mid];
      if (pm && pm.kind === 'video' && need.indexOf(pm.el) < 0) ps.push(seekV(pm.el, Math.min(pm.dur - 0.02, srcAt(pc, Math.max(0, clipLen(pc) - 0.04)))));
    }
    return Promise.all(ps);
  }
  var exporting = null;
  function sheetExport() {
    if (!total()) return toast('Эхлээд видео, зураг эсвэл текст нэмнэ үү');
    pause();
    var seen = {}, credits = P.audios.map(function (a) { return a.credit; }).filter(function (c) { if (!c || seen[c]) return false; seen[c] = 1; return true; }).map(function (c) { return 'Хөгжим: ' + c; }).join('\n');
    var s = sheet('Видео татах',
      '<label class="lbl">Файлын нэр</label><input type="text" id="v-xname" value="' + esc(P.name) + '" spellcheck="false">' +
      '<label class="lbl">Чанар</label>' + opts([['1', 'Бүрэн (' + P.w + '×' + P.h + ')'], ['720', 'Хурдан (720p)']], '1', 'q') +
      '<p class="note">Урт: ' + fmt(total()) + ' · 30 кадр/сек · MP4. Видео зөвхөн энэ төхөөрөмж дээр бэлтгэгдэнэ — дуустал энэ хуудсыг хаалгүй байгаарай.</p>' +
      (credits ? '<label class="lbl">Хөгжмийн эх сурвалж — нийтлэлийнхээ тайлбарт хуулж тавина уу</label><textarea id="v-xcred" readonly style="min-height:64px;font-size:13px">' + esc(credits) + '</textarea><button type="button" class="btn-g" id="v-xcopy" style="margin-top:8px">Хуулах</button>' : '') +
      '<div id="v-xout"><button type="button" class="btn-x" id="v-xgo" style="width:100%;margin-top:14px;height:46px">' + ico('dl') + 'MP4 бэлтгэх</button></div>',
      function () { if (exporting) exporting.cancel = true; });
    var q = '1'; onOpt(s, 'q', function (v) { q = v; });
    var cp = s.querySelector('#v-xcopy'); if (cp) cp.addEventListener('click', function () { var ta = s.querySelector('#v-xcred'); ta.select(); (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).catch(function () { document.execCommand('copy'); }); toast('Хууллаа'); });
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
      allEls().forEach(function (el) { el.pause(); });
      var i = 0;
      function frame() {
        if (job.cancel) throw new Error('cancel');
        if (err) throw err;
        if (i >= N) { xStop(); return venc.flush(); }
        var t = i / FPS;
        return framesAt(t).then(function () {
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
      exporting = null; xStop();
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
      '<h2>Видео хийх</h2><p class="sub">Хэмжээгээ сонгоод видео, зургаа нэмнэ. Тайрах, текст, хөгжим, шүүлтүүр, эффект, давхар видео, ногоон дэвсгэр арилгах — бүгд нэг дор.</p>' +
      (saved ? '<div class="resume"><span><b>Өмнөх төсөл</b><small>' + esc(JSON.parse(saved.p).name) + ' · ' + new Date(saved.t).toLocaleString() + '</small></span><button type="button" class="btn-x" id="v-res">Үргэлжлүүлэх</button></div>' : '') +
      sizeCards(null) +
      '<div class="feat"><span>Файл серверт очихгүй</span><span>Монгол фонт</span><span>Үнэгүй видео, зургийн сан</span><span>Дуу бичих</span><span>MP4 татах</span><span>Бүртгэлгүй, үнэгүй</span></div></div>';
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
  window.GVideo = { get P() { return P; }, media: media, seek: seek, play: play, pause: pause, total: total, addFiles: addFiles, renderFrame: renderFrame, mixAudio: mixAudio, runExport: runExport, sheetExport: sheetExport, begin: function (w, h) { P = blank(w, h); begin(); },
    get sel() { return sel; }, set sel(v) { sel = v; refresh(); }, get T() { return T; }, commit: commit, freezeFrame: freezeFrame, extractAudio: extractAudio, addSticker: addSticker,
    newOverlay: newOverlay, splitSel: splitSel, act: function (a) { ACT[a](); }, placeSel: placeSel, lastBox: lastBox, undo: undo };
})();
