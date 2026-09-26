/* Graphican — Монгол фонт хайгч (/tools/mongol-font/)
   Every family in MN_FONTS was checked for Ө ө Ү ү glyphs; fonts are loaded from Google Fonts only when a card scrolls into view. */
(function () {
  'use strict';
  var root = document.getElementById('mf-app'); if (!root || !window.MN_FONTS) return;
  var FONTS = window.MN_FONTS.map(function (f) { return { name: f[0], cat: f[1], w: f[2], it: f[3], top: f[4] }; });
  var NO = window.MN_FONTS_NO || [];
  var CAT = { all: 'Бүгд', s: 'Sans', r: 'Serif', d: 'Display', h: 'Гар бичмэл', m: 'Mono' };
  var GEN = { s: 'sans-serif', r: 'serif', d: 'sans-serif', h: 'cursive', m: 'monospace' };
  var SAMPLES = [
    ['Өгүүлбэр', 'Өглөөний нар хөх тэнгэрт мандаж, үүлэн доогуур үүр цайв.'],
    ['Брэнд', 'ГРАФИКАН ДИЗАЙН СТУДИ'],
    ['Том үсэг', 'АБВГДЕЁЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯ'],
    ['Жижиг үсэг', 'абвгдеёжзийклмноөпрстуүфхцчшщъыьэюя'],
    ['Тоо', '0123456789 · 49,900₮ · 25% · №1']
  ];
  var PAGE = 36;
  var st = { text: SAMPLES[0][1], size: 32, bold: false, cat: 'all', q: '', dark: true, shown: PAGE };
  try { var sv = JSON.parse(localStorage.getItem('gc-mf') || '{}'); if (sv.text) st.text = sv.text; if (sv.size) st.size = sv.size; } catch (e) {}

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function near(ws, t) { return ws.reduce(function (a, b) { return Math.abs(b - t) < Math.abs(a - t) ? b : a; }, ws[0]); }
  function cardWeights(f) { var a = near(f.w, 400), b = near(f.w, 700); return a === b ? [a] : [a, b]; }
  function cssUrl(f, ws) {
    ws = (ws || cardWeights(f)).slice().sort(function (a, b) { return a - b; });
    var fam = f.name.replace(/ /g, '+');
    return 'https://fonts.googleapis.com/css2?family=' + fam + (ws.length === 1 && ws[0] === 400 ? '' : ':wght@' + ws.join(';')) + '&display=swap';
  }
  var loaded = {};
  function loadFont(f, ws) {
    var u = cssUrl(f, ws); if (loaded[u]) return; loaded[u] = 1;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = u; document.head.appendChild(l);
  }
  function stack(f) { return "'" + f.name + "', " + GEN[f.cat]; }
  function weightOf(f) { return st.bold ? near(f.w, 700) : near(f.w, 400); }
  function snippet(f, ws) {
    return "@import url('" + cssUrl(f, ws) + "');\n\nfont-family: " + stack(f) + ';';
  }
  function copy(t, msg) {
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(msg || 'Хуулагдлаа'); }, function () {
      var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(msg || 'Хуулагдлаа'); } catch (e) {} ta.remove();
    });
  }
  function toast(t) {
    var el = document.getElementById('toast'); if (!el) return;
    el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }
  function save() { try { localStorage.setItem('gc-mf', JSON.stringify({ text: st.text, size: st.size })); } catch (e) {} }

  function list() {
    var q = st.q.trim().toLowerCase();
    return FONTS.filter(function (f) { return (st.cat === 'all' || f.cat === st.cat) && (!q || f.name.toLowerCase().indexOf(q) >= 0); });
  }

  root.innerHTML =
    '<div class="mf-bar">' +
      '<div class="mf-text"><textarea id="mf-t" rows="1" spellcheck="false" aria-label="Жишээ текст" placeholder="Өөрийн текстээ бичнэ үү…"></textarea></div>' +
      '<div class="mf-row">' +
        '<div class="mf-samples">' + SAMPLES.map(function (s, i) { return '<button type="button" data-sample="' + i + '">' + esc(s[0]) + '</button>'; }).join('') + '</div>' +
        '<label class="mf-size"><span>Хэмжээ</span><input type="range" id="mf-size" min="16" max="120" step="2"><b id="mf-size-v"></b></label>' +
        '<div class="mf-seg"><button type="button" data-bold="0">Энгийн</button><button type="button" data-bold="1">Тод</button></div>' +
        '<button type="button" class="mf-theme" id="mf-theme" aria-label="Цайвар / бараан дэвсгэр" title="Цайвар / бараан дэвсгэр"></button>' +
      '</div>' +
      '<div class="mf-row">' +
        '<div class="mf-cats" id="mf-cats"></div>' +
        '<input type="search" id="mf-q" placeholder="Фонтын нэрээр хайх" aria-label="Фонт хайх">' +
      '</div>' +
    '</div>' +
    '<p class="mf-note" id="mf-note" hidden></p>' +
    '<div class="mf-grid" id="mf-grid"></div>' +
    '<div class="mf-more"><button type="button" class="lp-btn" id="mf-more">Цааш үзэх</button><span id="mf-count"></span></div>';

  var $ = function (s) { return root.querySelector(s); };
  var ta = $('#mf-t'), grid = $('#mf-grid');
  ta.value = st.text;
  $('#mf-size').value = st.size;
  function autoH() { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; }

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { var f = FONTS[+e.target.dataset.i]; loadFont(f); io.unobserve(e.target); } });
  }, { rootMargin: '400px 0px' }) : null;

  function controls() {
    $('#mf-size-v').textContent = st.size + 'px';
    root.querySelectorAll('[data-bold]').forEach(function (b) { b.classList.toggle('on', (b.dataset.bold === '1') === st.bold); });
    root.classList.toggle('light', !st.dark);
    $('#mf-theme').innerHTML = st.dark ? '☀' : '☾';
    var counts = { all: FONTS.length }; FONTS.forEach(function (f) { counts[f.cat] = (counts[f.cat] || 0) + 1; });
    $('#mf-cats').innerHTML = Object.keys(CAT).map(function (k) {
      return '<button type="button" data-cat="' + k + '" class="' + (st.cat === k ? 'on' : '') + '">' + CAT[k] + ' <i>' + (counts[k] || 0) + '</i></button>';
    }).join('');
  }
  function render() {
    var L = list(), q = st.q.trim().toLowerCase();
    var no = q.length > 2 ? NO.filter(function (n) { return n.toLowerCase().indexOf(q) >= 0; }) : [];
    var note = $('#mf-note');
    note.hidden = !no.length;
    if (no.length) note.innerHTML = '<b>' + no.slice(0, 4).map(esc).join(', ') + '</b> — кирилл үсэгтэй ч <b>Ө, Ү</b> үсэггүй тул монгол бичвэрт тохирохгүй. Жагсаалтад оруулаагүй.';
    grid.innerHTML = L.slice(0, st.shown).map(function (f) {
      var i = FONTS.indexOf(f);
      return '<article class="mf-card" data-i="' + i + '">' +
        '<header><button type="button" class="mf-name" data-open="' + i + '">' + esc(f.name) + '</button><span>' + CAT[f.cat] + ' · ' + f.w.length + ' жин' + (f.it ? ' · italic' : '') + '</span>' +
          '<button type="button" class="mf-sel' + (sel[f.name] ? ' on' : '') + '" data-sel="' + i + '" aria-pressed="' + (sel[f.name] ? 'true' : 'false') + '" title="Олноор татахад сонгох" aria-label="Сонгох"></button></header>' +
        '<div class="mf-prev" data-open="' + i + '" style="font-family:' + esc(stack(f)) + ';font-weight:' + weightOf(f) + ';font-size:' + st.size + 'px">' + esc(st.text || f.name) + '</div>' +
        '<footer><button type="button" class="mf-dl" data-dl="' + i + '">↓ Татах' + (sizeOf(f) ? '<i>' + mb(sizeOf(f)) + '</i>' : '') + '</button><button type="button" data-css="' + i + '">CSS</button>' +
        '<a href="/editor/?font=' + encodeURIComponent(f.name) + '&text=' + encodeURIComponent((st.text || f.name).slice(0, 120)) + '">Editor-т ашиглах →</a></footer>' +
      '</article>';
    }).join('') || '<p class="mf-empty">Ийм нэртэй монгол фонт олдсонгүй.</p>';
    grid.querySelectorAll('.mf-card').forEach(function (c) { if (io) io.observe(c); else loadFont(FONTS[+c.dataset.i]); });
    $('#mf-more').hidden = L.length <= st.shown;
    $('#mf-count').textContent = Math.min(L.length, st.shown) + ' / ' + L.length + ' фонт';
  }
  function restyle() {
    grid.querySelectorAll('.mf-prev').forEach(function (p) {
      var f = FONTS[+p.dataset.open];
      p.textContent = st.text || f.name; p.style.fontSize = st.size + 'px'; p.style.fontWeight = weightOf(f);
    });
  }

  // ---------- download: files come straight from Google Fonts' official GitHub (CORS-enabled), zipped in the browser ----------
  var FILES = null, sel = {};
  var filesP = fetch('/assets/mnfonts-files.json').then(function (r) { return r.json(); }).then(function (j) { FILES = j; render(); selBar(); return j; }).catch(function () { return null; });
  var RAW = 'https://raw.githubusercontent.com/google/fonts/main/';
  function sizeOf(f) { return FILES && FILES[f.name] ? FILES[f.name].s : 0; }
  function mb(b) { return b >= 1048576 ? (b / 1048576).toFixed(b > 10485760 ? 0 : 1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function makeZip(files) {
    var te = new TextEncoder(), parts = [], central = [], offset = 0, d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = te.encode(f.name), data = f.data, crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(10, time, true); lh.setUint16(12, date, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
      parts.push(lh.buffer, name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, name); offset += 30 + name.length + data.length;
    });
    var size = central.reduce(function (a, b) { return a + b.byteLength; }, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, size, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }
  var README = 'Graphican — Монгол фонт\nhttps://graphican.online/tools/mongol-font/\n\n' +
    'СУУЛГАХ\n• Windows: .ttf файл дээр баруун товч дараад «Install» (Суулгах).\n• macOS: .ttf файлыг давхар дараад «Install Font».\n' +
    '• Суулгасны дараа Photoshop, Illustrator, Word, Figma зэрэг бүх програмд гарч ирнэ.\n\n' +
    'Нэрэндээ [wght] гэсэн файл нь «variable» фонт — бүх жин (нимгэнээс тод хүртэл) нэг файлд багтсан.\n\n' +
    'Фонт бүр монгол Ө, Ү үсгийг бүрэн дэмждэг эсэхийг шалгасан.\n\n' +
    'ЛИЦЕНЗ: хавтас доторх OFL.txt / LICENSE.txt. Үнэгүй — лого, сошиал, вэб, хэвлэл зэрэг арилжааны ажилд ашиглаж болно.\n' +
    'Эх сурвалж: Google Fonts (github.com/google/fonts).\n';
  var busy = false;
  function download(list, btn) {
    if (busy) return toast('Өмнөх татах үйлдэл дуусаагүй байна…');
    filesP.then(function () {
      if (!FILES) { toast('Жагсаалт ачаалж чадсангүй — дахин оролдоно уу'); return; }
      list = list.filter(function (f) { return FILES[f.name]; });
      if (!list.length) return;
      var total = list.reduce(function (a, f) { return a + FILES[f.name].s; }, 0);
      if (total > 200 * 1048576 && !confirm('Нийт ' + mb(total) + ' — удаан татагдана. Үргэлжлүүлэх үү?')) return;
      busy = true;
      var jobs = [];
      list.forEach(function (f) {
        var m = FILES[f.name], dir = list.length > 1 || m.f.length > 1 || m.l ? f.name + '/' : '';
        m.f.forEach(function (fn) { jobs.push({ url: RAW + m.d + '/' + encodeURIComponent(fn), name: dir + fn }); });
        if (m.l) jobs.push({ url: RAW + m.d + '/' + m.l, name: dir + m.l });
      });
      var done = 0, got = [], label = btn && btn.innerHTML;
      function prog() {
        var t = 'Татаж байна… ' + Math.round(done / jobs.length * 100) + '%';
        if (btn) btn.textContent = t; toast(t);
      }
      prog();
      var q = jobs.slice(), workers = [];
      function next() {
        var j = q.shift(); if (!j) return Promise.resolve();
        return fetch(j.url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
          .then(function (b) { got.push({ name: j.name, data: new Uint8Array(b) }); done++; prog(); return next(); });
      }
      for (var k = 0; k < 4; k++) workers.push(next());
      Promise.all(workers).then(function () {
        got.sort(function (a, b) { return a.name < b.name ? -1 : 1; });
        got.unshift({ name: 'ЗААВАР — суулгах.txt', data: new TextEncoder().encode(README) });
        var zipName = list.length === 1 ? list[0].name.replace(/\s+/g, '-') + '.zip' : 'mongol-fonts-' + list.length + '.zip';
        var a = document.createElement('a'); a.href = URL.createObjectURL(makeZip(got)); a.download = zipName;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
        toast(list.length === 1 ? '«' + list[0].name + '» татагдлаа ✓' : list.length + ' фонт татагдлаа ✓');
      }).catch(function (e) {
        console.error(e); toast('Татаж чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.');
      }).then(function () { busy = false; if (btn && label) btn.innerHTML = label; });
    });
  }
  var bar = document.createElement('div'); bar.className = 'mf-selbar'; bar.hidden = true; document.body.appendChild(bar);
  function selBar() {
    var names = Object.keys(sel), n = names.length;
    bar.hidden = !n; if (!n) return;
    var total = names.reduce(function (a, k) { return a + (FILES && FILES[k] ? FILES[k].s : 0); }, 0);
    bar.innerHTML = '<b>' + n + ' фонт</b><span>' + (total ? mb(total) : '') + '</span><button type="button" class="lp-btn" data-seldl>↓ Сонгосныг татах</button><button type="button" class="mf-x" data-selclear aria-label="Цуцлах">✕</button>';
  }
  bar.addEventListener('click', function (e) {
    if (e.target.closest('[data-selclear]')) { sel = {}; selBar(); render(); return; }
    var b = e.target.closest('[data-seldl]');
    if (b) download(FONTS.filter(function (f) { return sel[f.name]; }), b);
  });

  // ---------- detail ----------
  var PAIR_BODY = ['Inter', 'Roboto', 'Noto Sans', 'Montserrat', 'Lora', 'Merriweather', 'PT Serif', 'Open Sans', 'Manrope', 'Golos Text'];
  function pairsFor(f) {
    var pick = f.cat === 'r' ? ['Inter', 'Manrope', 'Golos Text'] : f.cat === 's' ? (f.name === 'Inter' ? ['Lora', 'Merriweather', 'Roboto'] : ['Inter', 'Lora', 'Noto Sans']) : ['Inter', 'Roboto', 'Lora'];
    return pick.filter(function (n) { return n !== f.name; }).map(function (n) { return FONTS.filter(function (x) { return x.name === n; })[0]; }).filter(Boolean).slice(0, 3);
  }
  function openDetail(i) {
    var f = FONTS[i]; loadFont(f, f.w);
    var ps = pairsFor(f); ps.forEach(function (p) { loadFont(p); });
    var m = document.createElement('div'); m.className = 'mf-modal' + (st.dark ? '' : ' light');
    var txt = st.text || 'Монгол Улс';
    m.innerHTML = '<div class="mf-box" role="dialog" aria-modal="true" aria-label="' + esc(f.name) + '">' +
      '<header><div><h2>' + esc(f.name) + '</h2><span>' + CAT[f.cat] + ' · ' + f.w.length + ' жин' + (f.it ? ' · italic' : '') + ' · <b class="ok">Ө Ү ✓</b></span></div>' +
        '<button type="button" class="mf-x" data-close aria-label="Хаах">✕</button></header>' +
      '<div class="mf-body">' +
        '<div class="mf-big" style="font-family:' + esc(stack(f)) + '">Аа Өө Үү</div>' +
        '<div class="mf-abc" style="font-family:' + esc(stack(f)) + '">АБВГДЕЁЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЩЪЫЬЭЮЯ<br>абвгдеёжзийклмноөпрстуүфхцчшщъыьэюя<br>0123456789 ₮ № % & ? ! « » — ABCDEFG abcdefg</div>' +
        '<h3>Жингүүд</h3><div class="mf-water">' + f.w.map(function (w) {
          return '<div><span>' + w + '</span><p style="font-family:' + esc(stack(f)) + ';font-weight:' + w + '">' + esc(txt) + '</p></div>';
        }).join('') + '</div>' +
        (ps.length ? '<h3>Хослуулах санал</h3><div class="mf-pairs">' + ps.map(function (p) {
          return '<div class="mf-pair"><b style="font-family:' + esc(stack(f)) + ';font-weight:' + near(f.w, 700) + '">' + esc(txt.slice(0, 40)) + '</b>' +
            '<p style="font-family:' + esc(stack(p)) + '">Энгийн бичвэрт ' + esc(p.name) + ' фонтыг хэрэглэвэл уншихад хялбар, гарчигтайгаа зохицно. Өдөр тутмын мэдээлэл, үнэ, хаяг зэргийг ийм хэмжээгээр бичнэ.</p>' +
            '<span>' + esc(f.name) + ' + ' + esc(p.name) + '</span></div>';
        }).join('') + '</div>' : '') +
        '<h3>Вэб дээр ашиглах</h3><pre class="mf-code">' + esc(snippet(f, cardWeights(f))) + '</pre>' +
        '<div class="mf-acts"><button type="button" class="lp-btn" data-dl="' + i + '">↓ Фонт татах (ZIP' + (sizeOf(f) ? ' · ' + mb(sizeOf(f)) : '') + ')</button>' +
          '<button type="button" class="mf-ghost" data-css="' + i + '">CSS хуулах</button>' +
          '<a class="mf-ghost" href="/editor/?font=' + encodeURIComponent(f.name) + '&text=' + encodeURIComponent(txt.slice(0, 120)) + '">Editor-т ашиглах</a></div>' +
        '<p class="mf-lic">Google Fonts-ын бүх фонт үнэгүй, арилжааны зорилгоор (лого, сошиал, хэвлэл) ашиглаж болно (SIL Open Font License / Apache).</p>' +
      '</div></div>';
    document.body.appendChild(m); document.body.style.overflow = 'hidden';
    function close() { m.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', key); }
    function key(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.closest('[data-close]')) return close();
      var c = e.target.closest('[data-css]'); if (c) copy(snippet(f, cardWeights(f)), 'CSS хуулагдлаа — сайтынхаа CSS-д буулгана уу');
      var d = e.target.closest('[data-dl]'); if (d) download([f], d);
    });
  }

  // ---------- events ----------
  var tt;
  ta.addEventListener('input', function () { st.text = ta.value; autoH(); clearTimeout(tt); tt = setTimeout(function () { restyle(); save(); }, 60); });
  $('#mf-size').addEventListener('input', function (e) { st.size = +e.target.value; controls(); restyle(); save(); });
  $('#mf-q').addEventListener('input', function (e) { st.q = e.target.value; st.shown = PAGE; render(); });
  root.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-sample]'))) { st.text = ta.value = SAMPLES[+t.dataset.sample][1]; autoH(); restyle(); save(); return; }
    if ((t = e.target.closest('[data-bold]'))) { st.bold = t.dataset.bold === '1'; controls(); restyle(); return; }
    if ((t = e.target.closest('[data-cat]'))) { st.cat = t.dataset.cat; st.shown = PAGE; controls(); render(); return; }
    if (e.target.closest('#mf-theme')) { st.dark = !st.dark; controls(); return; }
    if (e.target.closest('#mf-more')) { st.shown += PAGE; render(); return; }
    if ((t = e.target.closest('[data-css]'))) { var f = FONTS[+t.dataset.css]; copy(snippet(f, cardWeights(f)), '«' + f.name + '» CSS хуулагдлаа'); return; }
    if ((t = e.target.closest('[data-dl]'))) { download([FONTS[+t.dataset.dl]], t); return; }
    if ((t = e.target.closest('[data-sel]'))) {
      var n = FONTS[+t.dataset.sel].name; if (sel[n]) delete sel[n]; else sel[n] = 1;
      t.classList.toggle('on', !!sel[n]); t.setAttribute('aria-pressed', sel[n] ? 'true' : 'false'); selBar(); return;
    }
    if ((t = e.target.closest('[data-open]'))) { openDetail(+t.dataset.open); }
  });
  controls(); render(); autoH();
})();
