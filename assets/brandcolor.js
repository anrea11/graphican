/* Graphican — Брэндийн өнгө үүсгэгч (/tools/brand-color/)
   Industry → curated palettes first, then generated variations. 5 roles: primary, secondary, accent, dark, light. */
(function () {
  'use strict';
  var root = document.getElementById('bc-app'); if (!root) return;

  // seeds: [primary, secondary, accent, dark, light]
  // g: generation rules — p/sr/ac: hue ranges; ps/pl: sat/light of primary; sec: how secondary is derived
  var IND = [
    { id: 'tech', name: 'Технологи', sub: 'Minimal tech',
      why: 'Хөх, ягаан-хөх өнгө найдвартай, ухаалаг мэдрэмж төрүүлдэг. Цэвэр саарал дэвсгэр, нэг тод онцлох өнгөөр орчин үеийн, хялбар харагдана.',
      seeds: [['#4F46E5', '#06B6D4', '#F59E0B', '#0F172A', '#F8FAFC'], ['#2563EB', '#7C3AED', '#22D3EE', '#0B1020', '#F1F5F9'], ['#111827', '#3B82F6', '#10B981', '#030712', '#F9FAFB']],
      g: { p: [[215, 265]], ps: [65, 85], pl: [45, 58], sec: 'analog', ac: [[170, 195], [28, 45]], as: [80, 95], al: [48, 56] } },
    { id: 'mongol', name: 'Монгол уламжлалт', sub: 'Хөх · улаан · алтан',
      why: 'Мөнх хөх тэнгэрийн хөх, галын улаан, алтан шар, сүүн цагаан — монгол соёлын бэлгэдэлт өнгөнүүд. Үндэсний брэнд, аялал жуулчлал, соёлын арга хэмжээнд тохиромжтой.',
      seeds: [['#1F4E9C', '#C8102E', '#E0A526', '#2B1B12', '#F6F0E4'], ['#0B3D91', '#D4A017', '#B22234', '#1A1A2E', '#FAF6EE'], ['#8B1E1E', '#1E5AA8', '#C9A227', '#2E1E14', '#F4EBDD'], ['#2F6B3A', '#1F4E9C', '#E0A526', '#1E2A1F', '#F7F2E7']],
      g: { p: [[210, 222], [350, 358], [132, 145]], ps: [55, 75], pl: [30, 42], sec: 'other', ac: [[38, 46]], as: [70, 80], al: [48, 55], warm: 1 } },
    { id: 'premium', name: 'Premium', sub: 'Тансаг, дээд зэрэглэл',
      why: 'Хар, гүн ногоон, бордо өнгийг алтлаг өнгөтэй хослуулахад үнэ цэнэтэй, тансаг мэдрэмж төрнө. Цөөн өнгө, их хоосон зай — premium брэндийн гол зарчим.',
      seeds: [['#111111', '#C9A961', '#6B1E2E', '#0A0A0A', '#F5F0E6'], ['#0F3D2E', '#C8A96A', '#8C6A43', '#0A1F17', '#FAF7F0'], ['#2A1B3D', '#B08D57', '#7A2E3A', '#140D1D', '#F7F3EC']],
      g: { p: [[150, 165], [338, 350], [262, 280]], ps: [35, 55], pl: [14, 22], sec: 'deep', ac: [[38, 45]], as: [45, 60], al: [52, 60], warm: 1 } },
    { id: 'edu', name: 'Боловсрол', sub: 'Сургууль, сургалт',
      why: 'Хөх өнгө итгэл, мэдлэгийг, ногоон өсөлтийг, шар өнгө эрч хүч, сониуч занг илэрхийлнэ. Хүүхэд, залуучуудад ойлгомжтой, найрсаг хослол.',
      seeds: [['#1D4ED8', '#16A34A', '#FACC15', '#0F1B3D', '#F5F8FF'], ['#0E7490', '#F97316', '#FDE047', '#102A33', '#F3FAFB'], ['#4338CA', '#EC4899', '#FBBF24', '#1E1B4B', '#F8F7FF']],
      g: { p: [[212, 232], [185, 195]], ps: [70, 85], pl: [40, 50], sec: 'other', sr: [[130, 150], [18, 28]], ac: [[45, 52]], as: [90, 97], al: [52, 58] } },
    { id: 'food', name: 'Хоол хүнс', sub: 'Ресторан, кафе, хүргэлт',
      why: 'Улаан, улбар шар өнгө хоолны дуршил хүргэж, анхаарал татдаг. Дулаан цөцгий өнгийн дэвсгэр, ногоон онцлох өнгө шинэхэн, эрүүл мэдрэмж нэмнэ.',
      seeds: [['#D62828', '#F77F00', '#FCBF49', '#3A1F14', '#FFF8EC'], ['#E76F51', '#2A9D8F', '#F4A261', '#264653', '#FFF7EF'], ['#B91C1C', '#65A30D', '#F59E0B', '#2B1A10', '#FFFBF2']],
      g: { p: [[0, 10], [14, 26]], ps: [72, 85], pl: [45, 52], sec: 'other', sr: [[95, 150], [28, 36]], ac: [[40, 48]], as: [88, 96], al: [52, 60], warm: 1 } },
    { id: 'build', name: 'Барилга', sub: 'Барилга, үйлдвэр, авто',
      why: 'Улбар шар, шар өнгө аюулгүй байдал, хөдөлмөр, эрч хүчийг; бараан саарал, хар хөх өнгө бат бөх, найдвартай байдлыг илэрхийлнэ.',
      seeds: [['#F59E0B', '#1F2937', '#EF4444', '#111827', '#F3F4F6'], ['#EA580C', '#334155', '#FACC15', '#0F172A', '#F1F5F9'], ['#FFC300', '#003566', '#E85D04', '#001D3D', '#F5F5F0']],
      g: { p: [[28, 46]], ps: [88, 100], pl: [48, 54], sec: 'other', sr: [[205, 222]], ss: [20, 45], sl: [22, 30], ac: [[0, 10], [200, 210]], as: [75, 90], al: [45, 52] } },
    { id: 'finance', name: 'Санхүү', sub: 'Банк, даатгал, хууль',
      why: 'Хар хөх өнгө итгэлцэл, тогтвортой байдал, ногоон өсөлт, ашгийг илэрхийлдэг. Алтлаг онцлох өнгө үнэ цэнийг тодотгоно.',
      seeds: [['#0B3C5D', '#1B998B', '#D4AF37', '#071E2E', '#F4F7FA'], ['#14213D', '#2E7D32', '#FCA311', '#0A1020', '#F5F6F8'], ['#003B73', '#0074B7', '#60A3D9', '#001B35', '#F2F7FC']],
      g: { p: [[205, 222]], ps: [65, 85], pl: [20, 30], sec: 'other', sr: [[160, 175], [122, 140]], ss: [55, 70], sl: [34, 42], ac: [[38, 46]], as: [70, 85], al: [50, 56] } },
    { id: 'health', name: 'Эрүүл мэнд', sub: 'Эмнэлэг, эмийн сан, фитнес',
      why: 'Цэнхэр-ногоон, хөх өнгө цэвэр, тайван, мэргэжлийн мэдрэмж өгнө. Зөөлөн ягаан, шар онцлох өнгө халуун дотно байдлыг нэмнэ.',
      seeds: [['#0EA5A4', '#2563EB', '#F472B6', '#0F2E2E', '#F0FAFA'], ['#0284C7', '#22C55E', '#F59E0B', '#0C2436', '#F3F9FC'], ['#10B981', '#0369A1', '#FB7185', '#062E23', '#F2FBF7']],
      g: { p: [[168, 195], [150, 165]], ps: [65, 85], pl: [34, 44], sec: 'other', sr: [[200, 218]], ac: [[330, 352], [35, 45]], as: [80, 92], al: [60, 68] } },
    { id: 'beauty', name: 'Гоо сайхан', sub: 'Салон, арьс арчилгаа, загвар',
      why: 'Нүүдэл ягаан, шаргал бор, цөцгий өнгө зөөлөн, эмэгтэйлэг, тансаг харагдана. Тод өнгө биш — нам гүм, дулаан өнгө энэ салбарт итгэл төрүүлдэг.',
      seeds: [['#C9738A', '#E8B4B8', '#A67C52', '#3B2A2F', '#FBF3F1'], ['#8E5572', '#F2C6C2', '#C9A26B', '#2E1F28', '#FDF6F4'], ['#D4A5A5', '#6D4C5C', '#E6C89A', '#2B2226', '#FFF8F5']],
      g: { p: [[338, 356], [318, 334], [12, 24]], ps: [32, 52], pl: [52, 66], sec: 'light', ac: [[28, 40]], as: [40, 55], al: [52, 62], warm: 1 } },
    { id: 'kids', name: 'Хүүхэд', sub: 'Цэцэрлэг, тоглоом, хувцас',
      why: 'Тод, хөгжилтэй олон өнгө хүүхдийн анхаарлыг татаж, эцэг эхэд эерэг сэтгэгдэл төрүүлнэ. Бараан өнгийг зөвхөн текстэд хэрэглэнэ.',
      seeds: [['#FF6B6B', '#4ECDC4', '#FFE66D', '#2D3047', '#FFFDF5'], ['#3A86FF', '#FF006E', '#FFBE0B', '#1B1F3B', '#F8FAFF'], ['#8338EC', '#06D6A0', '#FFD166', '#23153C', '#FCFAFF']],
      g: { p: [[0, 360]], ps: [80, 95], pl: [55, 62], sec: 'triad', ac: 'triad2', as: [90, 100], al: [58, 64] } },
    { id: 'eco', name: 'Байгаль · Эко', sub: 'Органик, хөдөө аж ахуй, аялал',
      why: 'Ногоон, шороон бор, элсэн өнгө байгаль, органик, тогтвортой байдлыг шууд илэрхийлнэ. Бүдэг, байгалийн өнгө хиймэл биш, бодит мэдрэмж өгнө.',
      seeds: [['#2D6A4F', '#95D5B2', '#B08968', '#1B2D24', '#F4F1E8'], ['#588157', '#A3B18A', '#DDA15E', '#233020', '#F6F4EC'], ['#386641', '#6A994E', '#BC4749', '#1E2B1F', '#F2F4EA']],
      g: { p: [[112, 152]], ps: [28, 48], pl: [28, 40], sec: 'light', ac: [[22, 36]], as: [35, 55], al: [45, 56], warm: 1 } },
    { id: 'sport', name: 'Спорт', sub: 'Фитнес, клуб, тэмцээн',
      why: 'Улаан, тод шар-ногоон өнгө хурд, эрч хүч, өрсөлдөөнийг мэдрүүлнэ. Хар өнгөтэй хослуулж хүчтэй контраст үүсгэнэ.',
      seeds: [['#E63946', '#111111', '#D9FF3F', '#0A0A0A', '#F5F5F5'], ['#FF4D00', '#0D1B2A', '#00E5FF', '#060D16', '#F4F6F8'], ['#1D3557', '#E63946', '#FFD60A', '#0B1626', '#F8FAFC']],
      g: { p: [[350, 360], [8, 18], [210, 222]], ps: [80, 95], pl: [45, 52], sec: 'deep', ac: [[68, 82], [180, 192]], as: [92, 100], al: [52, 58] } }
  ];
  var ROLES = [['Үндсэн', 'primary'], ['Хоёрдогч', 'secondary'], ['Онцлох', 'accent'], ['Бараан', 'dark'], ['Цайвар', 'light']];
  var LOCK_ON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  var LOCK_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  var ROLE_HINT = ['лого, товч, гол элемент', 'дэмжих өнгө, график', 'үнэ, шошго, анхаарал', 'текст, бараан дэвсгэр', 'дэвсгэр, хоосон зай'];

  // ---------- colour math ----------
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hex2rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function rgb2hex(r) { return '#' + r.map(function (v) { return ('0' + Math.round(clamp(v, 0, 255)).toString(16)).slice(-2); }).join('').toUpperCase(); }
  function hsl2hex(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return rgb2hex([f(0) * 255, f(8) * 255, f(4) * 255]);
  }
  function hex2hsl(hx) {
    var r = hex2rgb(hx).map(function (v) { return v / 255; }), mx = Math.max.apply(0, r), mn = Math.min.apply(0, r), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r[0] ? ((r[1] - r[2]) / d) % 6 : mx === r[1] ? (r[2] - r[0]) / d + 2 : (r[0] - r[1]) / d + 4; h *= 60;
    }
    return [(h + 360) % 360, s * 100, l * 100];
  }
  function lum(hx) { return hex2rgb(hx).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function onColor(bg) { return contrast(bg, '#FFFFFF') >= contrast(bg, '#111111') ? '#FFFFFF' : '#111111'; }
  function R(a) { return a[0] + Math.random() * (a[1] - a[0]); }
  function pickRange(list) { return list[Math.floor(Math.random() * list.length)]; }
  function darken(hx, dl) { var c = hex2hsl(hx); return hsl2hex(c[0], c[1], clamp(c[2] - dl, 3, 97)); }

  function generate(ind) {
    var g = ind.g, pr = pickRange(g.p), ph = R(pr), ps = R(g.ps), pl = R(g.pl);
    var p = hsl2hex(ph, ps, pl), s, a;
    if (g.sec === 'analog') s = hsl2hex(ph + (Math.random() < 0.5 ? -1 : 1) * R([25, 45]), ps, clamp(pl + R([-6, 10]), 30, 65));
    else if (g.sec === 'light') s = hsl2hex(ph + R([-8, 8]), clamp(ps - 12, 15, 70), clamp(pl + R([20, 30]), 60, 85));
    else if (g.sec === 'deep') s = hsl2hex(ph + R([-10, 10]), clamp(ps - 10, 10, 60), clamp(pl - R([8, 14]), 6, 30));
    else if (g.sec === 'triad') s = hsl2hex(ph + 120 + R([-15, 15]), ps, pl);
    else { var others = (g.sr || g.p).filter(function (r) { return r !== pr; }); s = hsl2hex(R(pickRange(others.length ? others : g.p)), g.ss ? R(g.ss) : ps, g.sl ? R(g.sl) : clamp(pl + R([-4, 8]), 25, 60)); }
    a = g.ac === 'triad2' ? hsl2hex(ph + 240 + R([-15, 15]), R(g.as), R(g.al)) : hsl2hex(R(pickRange(g.ac)), R(g.as), R(g.al));
    var nh = g.warm ? R([25, 40]) : ph, dk = hsl2hex(nh, R([15, 35]), R([8, 14])), lt = hsl2hex(g.warm ? R([35, 45]) : ph, R([25, 50]), R([95, 97.5]));
    // readable: primary must hold white-or-dark text and stand on the light background
    var guard = 0; while (contrast(p, lt) < 3 && guard++ < 20) p = darken(p, 3);
    return [p, s, a, dk, lt];
  }

  // ---------- state ----------
  var st = { ind: IND[0], cols: IND[0].seeds[0].slice(), lock: [0, 0, 0, 0, 0], seed: 0, brand: 'Номин', hist: [] };
  (function fromUrl() {
    try {
      var q = new URLSearchParams(location.search), i = IND.filter(function (x) { return x.id === q.get('i'); })[0];
      if (i) { st.ind = i; st.cols = i.seeds[0].slice(); }
      var c = (q.get('c') || '').split('-').map(function (x) { return '#' + x.toUpperCase(); });
      if (c.length === 5 && c.every(function (x) { return /^#[0-9A-F]{6}$/.test(x); })) st.cols = c;
      if (q.get('b')) st.brand = q.get('b').slice(0, 24);
    } catch (e) {}
  })();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(t) { var el = document.getElementById('toast'); if (!el) return; el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 2400); }
  function copy(t, msg) {
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(msg); }, function () {
      var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(msg); } catch (e) {} ta.remove();
    });
  }
  function shareUrl() {
    return location.origin + location.pathname + '?i=' + st.ind.id + '&c=' + st.cols.map(function (c) { return c.slice(1); }).join('-') + (st.brand !== 'Номин' ? '&b=' + encodeURIComponent(st.brand) : '');
  }
  function syncUrl() { try { history.replaceState(null, '', shareUrl()); } catch (e) {} }

  // fonts for the mockups (Mongolian-ready)
  var fl = document.createElement('link'); fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800&family=Inter:wght@400;600&display=swap';
  document.head.appendChild(fl);

  root.innerHTML =
    '<div class="bc-inds" id="bc-inds" role="tablist" aria-label="Салбар"></div>' +
    '<div class="bc-why" id="bc-why"></div>' +
    '<div class="bc-pal" id="bc-pal"></div>' +
    '<div class="bc-tools">' +
      '<button type="button" class="lp-btn" id="bc-gen">↻ Өөр хувилбар <kbd>Space</kbd></button>' +
      '<button type="button" class="bc-ghost" id="bc-undo" disabled>↶ Буцаах</button>' +
      '<span class="grow"></span>' +
      '<button type="button" class="bc-ghost" data-exp="hex">HEX хуулах</button>' +
      '<button type="button" class="bc-ghost" data-exp="css">CSS хувьсагч</button>' +
      '<button type="button" class="bc-ghost" data-exp="png">PNG татах</button>' +
      '<button type="button" class="bc-ghost" data-exp="link">Холбоос хуулах</button>' +
      '<a class="bc-ghost acc" id="bc-editor" href="/editor/">Editor-т ашиглах →</a>' +
    '</div>' +
    '<div class="bc-scales" id="bc-scales"></div>' +
    '<h2 class="bc-h">Бодит хэрэглээн дээр</h2>' +
    '<label class="bc-brand"><span>Брэндийн нэр</span><input id="bc-name" maxlength="24" spellcheck="false"></label>' +
    '<div class="bc-mocks" id="bc-mocks"></div>' +
    '<h2 class="bc-h">Уншигдах байдал (контраст)</h2><div class="bc-cx" id="bc-cx"></div>';

  var $ = function (s) { return root.querySelector(s); };
  $('#bc-name').value = st.brand;

  function renderInds() {
    $('#bc-inds').innerHTML = IND.map(function (i) {
      return '<button type="button" role="tab" aria-selected="' + (i === st.ind) + '" class="' + (i === st.ind ? 'on' : '') + '" data-ind="' + i.id + '">' +
        '<span class="dots">' + i.seeds[0].slice(0, 3).map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>' +
        '<b>' + esc(i.name) + '</b><small>' + esc(i.sub) + '</small></button>';
    }).join('');
    $('#bc-why').innerHTML = '<b>Яагаад эдгээр өнгө?</b> ' + esc(st.ind.why);
  }
  function renderPal() {
    $('#bc-pal').innerHTML = st.cols.map(function (c, i) {
      var fg = onColor(c);
      return '<div class="bc-sw' + (st.lock[i] ? ' locked' : '') + '" style="background:' + c + ';color:' + fg + '">' +
        '<div class="bc-sw-top"><span>' + ROLES[i][0] + '</span>' +
          '<button type="button" data-lock="' + i + '" aria-label="' + (st.lock[i] ? 'Түгжээ тайлах' : 'Түгжих') + '" title="' + (st.lock[i] ? 'Түгжээтэй — өөрчлөгдөхгүй' : 'Түгжих') + '">' + (st.lock[i] ? LOCK_ON : LOCK_OFF) + '</button></div>' +
        '<div class="bc-sw-bot"><button type="button" class="bc-hex" data-copy="' + c + '" title="Хуулах">' + c + '</button>' +
          '<small>' + ROLE_HINT[i] + '</small>' +
          '<label class="bc-edit" title="Өнгө засах">✎<input type="color" value="' + c.toLowerCase() + '" data-edit="' + i + '"></label></div>' +
      '</div>';
    }).join('');
  }
  function scale(hx) {
    var h = hex2hsl(hx);
    return [96, 90, 80, 68, 56, 45, 36, 27, 18].map(function (l, i) { return hsl2hex(h[0], clamp(h[1] + (i > 4 ? -4 : 0), 8, 100), l); });
  }
  function renderScales() {
    var names = ['50', '100', '200', '300', '400', '500', '600', '700', '800'];
    $('#bc-scales').innerHTML = [0, 2].map(function (i) {
      return '<div class="bc-scale"><span>' + ROLES[i][0] + ' — өнгөний шат</span><div>' + scale(st.cols[i]).map(function (c, k) {
        return '<button type="button" data-copy="' + c + '" style="background:' + c + ';color:' + onColor(c) + '" title="' + c + '"><i>' + names[k] + '</i></button>';
      }).join('') + '</div></div>';
    }).join('');
  }
  function renderMocks() {
    var c = st.cols, P = c[0], S = c[1], A = c[2], D = c[3], L = c[4], n = esc(st.brand || 'Брэнд');
    var init = esc((st.brand || 'Б').trim().charAt(0).toUpperCase());
    var hf = "font-family:Montserrat,'Inter',sans-serif", bf = "font-family:Inter,sans-serif";
    $('#bc-mocks').innerHTML =
      // logo
      '<figure class="bc-m"><div class="bc-logo" style="background:' + L + '">' +
        '<div class="lg" style="' + hf + ';color:' + D + '"><span class="mk" style="background:' + P + ';color:' + onColor(P) + '">' + init + '</span>' + n + '</div>' +
        '<div class="lg-inv" style="background:' + P + ';' + hf + ';color:' + onColor(P) + '"><span class="mk" style="background:' + L + ';color:' + P + '">' + init + '</span>' + n + '</div>' +
      '</div><figcaption>Лого, үндсэн ба урвуу хувилбар</figcaption></figure>' +
      // social post
      '<figure class="bc-m"><div class="bc-post" style="background:' + P + ';color:' + onColor(P) + ';' + hf + '">' +
        '<span class="tag" style="background:' + A + ';color:' + onColor(A) + '">−20%</span>' +
        '<b>Шинэ улирлын<br>цуглуулга</b><p style="' + bf + '">Зөвхөн энэ долоо хоногт бүх бүтээгдэхүүнд</p>' +
        '<span class="btn" style="background:' + L + ';color:' + D + '">Захиалах →</span><em style="' + bf + '">' + n + '</em>' +
        '<i class="blob" style="background:' + S + '"></i>' +
      '</div><figcaption>Сошиал пост</figcaption></figure>' +
      // website hero
      '<figure class="bc-m wide"><div class="bc-web" style="background:' + L + ';color:' + D + ';' + bf + '">' +
        '<nav><b style="' + hf + ';color:' + P + '">' + n + '</b><span>Бүтээгдэхүүн</span><span>Үнэ</span><span>Холбоо</span><em style="background:' + P + ';color:' + onColor(P) + '">Нэвтрэх</em></nav>' +
        '<div class="bc-hero"><div><small style="background:' + A + ';color:' + onColor(A) + '">ШИНЭ</small><h3 style="' + hf + '">Таны бизнест тохирсон<br>ухаалаг шийдэл</h3>' +
          '<p>Хэдхэн минутад бүртгүүлж, өнөөдрөөс эхлэн ашиглаарай.</p>' +
          '<span class="b1" style="background:' + P + ';color:' + onColor(P) + '">Үнэгүй эхлэх</span><span class="b2" style="border-color:' + D + ';color:' + D + '">Дэлгэрэнгүй</span></div>' +
          '<div class="art"><i style="background:' + P + '"></i><i style="background:' + S + '"></i><i style="background:' + A + '"></i></div></div>' +
      '</div><figcaption>Вэбсайт</figcaption></figure>' +
      // business card
      '<figure class="bc-m"><div class="bc-cards">' +
        '<div class="bc-card f" style="background:' + D + ';color:' + L + ';' + hf + '"><span class="mk" style="background:' + P + ';color:' + onColor(P) + '">' + init + '</span><b>' + n + '</b><i style="background:' + A + '"></i></div>' +
        '<div class="bc-card b" style="background:' + L + ';color:' + D + ';' + bf + '"><b style="' + hf + '">Бат-Эрдэнэ Д.</b><span style="color:' + P + '">Гүйцэтгэх захирал</span><p>+976 9911 2233<br>hello@' + esc((st.brand || 'brand').toLowerCase().replace(/[^a-zа-яөү0-9]/gi, '')) + '.mn</p><i style="background:' + S + '"></i></div>' +
      '</div><figcaption>Нэрийн хуудас</figcaption></figure>';
  }
  function renderCx() {
    var c = st.cols, pairs = [
      ['Бараан текст / цайвар дэвсгэр', c[3], c[4]], ['Цайвар текст / бараан дэвсгэр', c[4], c[3]],
      ['Товчны текст / үндсэн өнгө', onColor(c[0]), c[0]], ['Үндсэн өнгө / цайвар дэвсгэр', c[0], c[4]],
      ['Онцлох өнгө / бараан дэвсгэр', c[2], c[3]], ['Хоёрдогч / цайвар дэвсгэр', c[1], c[4]]
    ];
    $('#bc-cx').innerHTML = pairs.map(function (p) {
      var r = contrast(p[1], p[2]), lv = r >= 7 ? ['AAA', 'ok'] : r >= 4.5 ? ['AA', 'ok'] : r >= 3 ? ['Том текстэд', 'mid'] : ['Уншигдахгүй', 'bad'];
      return '<div class="bc-cxr"><span class="smp" style="background:' + p[2] + ';color:' + p[1] + '">Аа</span><span class="lbl">' + p[0] + '</span><b>' + r.toFixed(1) + ':1</b><em class="' + lv[1] + '">' + lv[0] + '</em></div>';
    }).join('') + '<p class="bc-cxn">Жижиг текстэд дор хаяж <b>4.5:1</b> (AA), гарчиг зэрэг том текстэд <b>3:1</b> хэрэгтэй.</p>';
  }
  function renderAll() {
    renderInds(); renderPal(); renderScales(); renderMocks(); renderCx();
    $('#bc-undo').disabled = !st.hist.length;
    $('#bc-editor').href = '/editor/?pal=' + st.cols.map(function (c) { return c.slice(1); }).join('-') + '&paln=' + encodeURIComponent((st.brand || 'Брэнд') + ' — ' + st.ind.name);
    syncUrl();
  }

  function next() {
    st.hist.push(st.cols.slice()); if (st.hist.length > 40) st.hist.shift();
    st.seed++;
    var fresh = st.seed < st.ind.seeds.length ? st.ind.seeds[st.seed].slice() : generate(st.ind);
    st.cols = st.cols.map(function (c, i) { return st.lock[i] ? c : fresh[i]; });
    renderAll();
  }
  function png() {
    var W = 1600, H = 900, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var x = cv.getContext('2d'); x.fillStyle = st.cols[4]; x.fillRect(0, 0, W, H);
    var font = '"Montserrat", "Inter", sans-serif';
    x.fillStyle = st.cols[3]; x.font = '800 64px ' + font; x.fillText(st.brand || 'Брэнд', 80, 130);
    x.font = '500 28px ' + font; x.globalAlpha = 0.7; x.fillText('Брэндийн өнгө · ' + st.ind.name, 80, 180); x.globalAlpha = 1;
    var cw = (W - 160 - 4 * 24) / 5;
    st.cols.forEach(function (c, i) {
      var X = 80 + i * (cw + 24);
      x.fillStyle = c; x.beginPath(); if (x.roundRect) x.roundRect(X, 240, cw, 480, 24); else x.rect(X, 240, cw, 480); x.fill();
      if (lum(c) > 0.9) { x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 2; x.stroke(); }
      x.fillStyle = onColor(c); x.font = '700 30px ' + font; x.fillText(c, X + 24, 680);
      x.fillStyle = st.cols[3]; x.font = '600 26px ' + font; x.fillText(ROLES[i][0], X, 770);
      x.globalAlpha = 0.6; x.font = '400 20px ' + font; x.fillText(ROLE_HINT[i], X, 804); x.globalAlpha = 1;
    });
    x.fillStyle = st.cols[3]; x.globalAlpha = 0.45; x.font = '500 20px ' + font; x.fillText('graphican.online/tools/brand-color', 80, 860); x.globalAlpha = 1;
    cv.toBlob(function (b) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (st.brand || 'brand').replace(/\s+/g, '-') + '-colors.png';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      toast('PNG татагдлаа');
    });
  }

  root.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-ind]'))) {
      var ind = IND.filter(function (i) { return i.id === t.dataset.ind; })[0];
      st.hist.push(st.cols.slice()); st.ind = ind; st.seed = 0;
      st.cols = st.cols.map(function (c, i) { return st.lock[i] ? c : ind.seeds[0][i]; });
      renderAll(); return;
    }
    if ((t = e.target.closest('[data-lock]'))) { var k = +t.dataset.lock; st.lock[k] = st.lock[k] ? 0 : 1; renderPal(); return; }
    if ((t = e.target.closest('[data-copy]'))) { copy(t.dataset.copy, t.dataset.copy + ' хуулагдлаа'); return; }
    if (e.target.closest('#bc-gen')) { next(); return; }
    if (e.target.closest('#bc-undo')) { if (st.hist.length) { st.cols = st.hist.pop(); renderAll(); } return; }
    if ((t = e.target.closest('[data-exp]'))) {
      var ex = t.dataset.exp;
      if (ex === 'hex') copy(st.cols.join(', '), 'HEX кодууд хуулагдлаа');
      if (ex === 'css') copy(':root {\n' + st.cols.map(function (c, i) { return '  --' + ROLES[i][1] + ': ' + c + ';'; }).join('\n') + '\n}', 'CSS хувьсагч хуулагдлаа');
      if (ex === 'link') copy(shareUrl(), 'Холбоос хуулагдлаа — хэн нэгэнд илгээж болно');
      if (ex === 'png') (document.fonts ? document.fonts.load('800 64px Montserrat') : Promise.resolve()).then(png, png);
    }
  });
  root.addEventListener('input', function (e) {
    if (e.target.dataset.edit != null) {
      var i = +e.target.dataset.edit; st.cols[i] = e.target.value.toUpperCase(); st.lock[i] = 1;
      renderMocks(); renderCx(); renderScales(); syncUrl();
      var sw = root.querySelectorAll('.bc-sw')[i]; sw.style.background = st.cols[i]; sw.style.color = onColor(st.cols[i]);
      sw.querySelector('.bc-hex').textContent = st.cols[i]; sw.querySelector('.bc-hex').dataset.copy = st.cols[i];
    }
    if (e.target.id === 'bc-name') { st.brand = e.target.value; renderMocks(); renderAll(); }
  });
  root.addEventListener('change', function (e) { if (e.target.dataset.edit != null) renderAll(); });
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target.tagName || '')) && !e.target.isContentEditable) { e.preventDefault(); next(); }
  });
  renderAll();
})();
