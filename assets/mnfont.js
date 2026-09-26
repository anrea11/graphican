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
        '<header><button type="button" class="mf-name" data-open="' + i + '">' + esc(f.name) + '</button><span>' + CAT[f.cat] + ' · ' + f.w.length + ' жин' + (f.it ? ' · italic' : '') + '</span></header>' +
        '<div class="mf-prev" data-open="' + i + '" style="font-family:' + esc(stack(f)) + ';font-weight:' + weightOf(f) + ';font-size:' + st.size + 'px">' + esc(st.text || f.name) + '</div>' +
        '<footer><button type="button" data-css="' + i + '">CSS хуулах</button><button type="button" data-open="' + i + '">Дэлгэрэнгүй</button>' +
        '<a href="/editor/?font=' + encodeURIComponent(f.name) + '&text=' + encodeURIComponent((st.text || f.name).slice(0, 120)) + '">Editor-т ашиглах</a></footer>' +
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
        '<div class="mf-acts"><button type="button" class="lp-btn" data-css="' + i + '">CSS хуулах</button>' +
          '<a class="mf-ghost" href="https://fonts.google.com/specimen/' + f.name.replace(/ /g, '+') + '" target="_blank" rel="noopener">Google Fonts-оос татах ↗</a>' +
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
    if ((t = e.target.closest('[data-open]'))) { openDetail(+t.dataset.open); }
  });
  controls(); render(); autoH();
})();
