/* Graphican — илтгэлийн (PPT) загварууд, 2-р багц. 1920×1080; templates.js-ийн GTPL.build хөдөлгүүрээр зурна.
   VIDEO(...) — Pexels-ийн үнэгүй видео (Worker /api/stock/video id-гаар нь татна). anim — үзүүлэх үеийн орох анимэйшн. */
(function () {
  'use strict';
  var G = window.GTPL; if (!G || !G.H) return;
  var H = G.H, T = H.T, R = H.R, C = H.C, BG = H.BG, PHOTO = H.PHOTO, VIDEO = H.VIDEO, SCRIM = H.SCRIM, pill = H.pill, GRAIN = H.GRAIN, BLOB = H.BLOB, lin = H.lin;
  var W = 1920, HH = 1080;
  function L(text, y, size, x, w, o) { o = o || {}; o.align = o.align || 'left'; o.x = x; o.w = w; return T(text, y, size, o); }
  // entrance animation on an item: A(item, 'rise', delay, duration)
  function A(o, t, dl, d) { o.anim = t; o.dl = dl || 0; if (d) o.ad = d; return o; }
  function flat(a) { return a.reduce(function (x, y) { return x.concat(Array.isArray(y) ? flat(y) : [y]); }, []); }
  function S(name, fn) { return { name: name, items: function () { return flat(fn()); } }; }

  var D = [];

  // ================= СТАРТАП PITCH — хар, лайм (видео) =================
  (function () {
    var K = '#0a0c16', LIME = '#c6ff3d', VIO = '#7c5cff', MU = '#9aa3b8', CARD = '#141a2b', LN = '#263049', SKY = '#38bdf8';
    var lab = function (t, y) { return L(t, y || 140, 22, 140, 900, { body: 1, weight: 700, color: LIME, cs: 300 }); };
    D.push({ id: 'pitch', tag: 'Бизнес', name: 'Стартап pitch — видео', fonts: ['Geologica', 'Inter'], sw: [K, LIME, VIO], trans: 'fade', slides: [
      S('Нүүр', function () { return [
        BG(K), VIDEO(0, 0, W, HH, 'gradient'),
        SCRIM(0, 0, W, HH, 0, [[0, K, 0.95], [0.5, K, 0.72], [1, K, 0.12]]),
        R(140, 142, 56, 56, LIME, { rx: 14, name: 'Лого' }), L('nova', 146, 44, 214, 400, { weight: 700, color: '#ffffff' }),
        pill(140, 330, 320, 52, 'rgba(198,255,61,0.10)', 'SEED ROUND · 2026', LIME, 19, { stroke: LIME, sw: 1.5, cs: 200 }),
        A(L('Санхүүгээ\nухаалгаар удирд', 420, 128, 134, 1400, { weight: 700, color: '#ffffff', lh: 1.0, cs: -20 }), 'rise', 0.1, 0.9),
        A(L('Жижиг бизнесүүдэд зориулсан AI нягтлан бодогч — баримтаа зураад илгээхэд л хангалттай.', 770, 32, 140, 900, { body: 1, color: MU, lh: 1.5 }), 'fade', 0.45),
        R(140, 930, 1640, 1, LN, { name: 'Шугам' }),
        L('Илтгэгч: Нэр Овог, CEO', 960, 22, 140, 800, { body: 1, color: MU }), L('nova.mn', 960, 22, 980, 800, { body: 1, color: '#ffffff', weight: 600, align: 'right' })
      ]; }),
      S('Асуудал', function () {
        var o = [BG(K), BLOB(1750, 80, 520, VIO, 0.35), lab('01 — АСУУДАЛ'),
          L('Жижиг бизнесийн 68% нь санхүүгээ Excel эсвэл дэвтэрт хөтөлдөг', 190, 72, 136, 880, { weight: 700, color: '#ffffff', lh: 1.08 }),
          L('Энэ нь цаг алдаж, алдаа гаргаж, бизнесийн шийдвэрийг хоцроодог.', 520, 30, 140, 800, { body: 1, color: MU, lh: 1.5 })];
        [['4 цаг', 'долоо хоногт тайлан гаргахад зарцуулдаг'], ['1 / 3', 'нь татварын тайландаа алдаа гаргадаг'], ['72%', 'нь бодит цагийн мэдээлэлгүйгээр шийдвэр гаргадаг']].forEach(function (d, i) {
          var y = 140 + i * 280;
          o.push(A(R(1120, y, 660, 250, CARD, { rx: 28, stroke: LN, sw: 1.5, name: 'Карт' }), 'rise', 0.1 + i * 0.12),
            A(L(d[0], y + 40, 84, 1170, 560, { weight: 700, color: i === 0 ? LIME : '#ffffff' }), 'rise', 0.1 + i * 0.12),
            A(L(d[1], y + 152, 26, 1170, 560, { body: 1, color: MU, lh: 1.4 }), 'rise', 0.1 + i * 0.12));
        });
        return o;
      }),
      S('Шийдэл', function () {
        var o = [BG(K), VIDEO(1000, 110, 800, 860, 'team', { mask: 'rounded', r: 36 }), lab('02 — ШИЙДЭЛ', 150),
          L('Nova — таны\nухаалаг нягтлан', 200, 86, 136, 800, { weight: 700, color: '#ffffff', lh: 1.04 }),
          A(R(880, 760, 380, 160, '#ffffff', { rx: 24, shadow: { c: 'rgba(0,0,0,0.35)', b: 40, y: 16 }, name: 'Карт' }), 'pop', 0.5),
          A(L('−80%', 782, 60, 920, 320, { weight: 700, color: K }), 'pop', 0.5), A(L('тайлан гаргах хугацаа', 860, 22, 920, 320, { body: 1, color: '#4a5168' }), 'pop', 0.5)];
        ['Баримтаа зураад илгээ — AI өөрөө бүртгэнэ', 'Банкны гүйлгээг автоматаар ангилна', 'НӨАТ, татварын тайлан — нэг товшилтоор'].forEach(function (t, i) {
          var y = 470 + i * 110;
          o.push(A(C(160, y + 20, 10, LIME), 'fade', 0.2 + i * 0.1), A(L(t, y, 30, 196, 660, { body: 1, color: '#e6e9f2', lh: 1.35 }), 'panl', 0.2 + i * 0.1));
        });
        return o;
      }),
      S('Зах зээл', function () { return [
        BG(K), lab('03 — ЗАХ ЗЭЭЛ'), L('Боломж асар том', 190, 80, 136, 900, { weight: 700, color: '#ffffff' }),
        C(560, 660, 330, CARD, { stroke: LN, sw: 2 }), C(560, 740, 240, '#1c2440', { stroke: '#33406a', sw: 2 }), C(560, 820, 150, VIO),
        T('TAM', 364, 24, { x: 360, w: 400, body: 1, weight: 700, color: MU, cs: 300 }), T('SAM', 532, 24, { x: 360, w: 400, body: 1, weight: 700, color: '#c3c9dc', cs: 300 }),
        T('SOM', 800, 30, { x: 360, w: 400, body: 1, weight: 700, color: '#ffffff', cs: 300 }),
        L('₮1.2 их наяд', 360, 64, 1060, 720, { weight: 700, color: '#ffffff' }), L('ЖДБ-ийн санхүүгийн үйлчилгээний нийт зах зээл', 444, 26, 1060, 720, { body: 1, color: MU }),
        L('₮320 тэрбум', 560, 64, 1060, 720, { weight: 700, color: '#ffffff' }), L('Онлайн бүртгэл ашиглах боломжтой 85,000 байгууллага', 644, 26, 1060, 720, { body: 1, color: MU }),
        L('₮48 тэрбум', 760, 64, 1060, 720, { weight: 700, color: LIME }), L('3 жилд хүрэх бодит зорилт — 12,000 хэрэглэгч', 844, 26, 1060, 720, { body: 1, color: MU })
      ]; }),
      S('Өсөлт', function () {
        var o = [BG(K), lab('04 — ӨСӨЛТ'), L('Сар бүр 38% өсөж байна', 190, 80, 136, 1200, { weight: 700, color: '#ffffff' })];
        [0.12, 0.18, 0.25, 0.33, 0.45, 0.58, 0.76, 1].forEach(function (v, i) {
          var x = 140 + i * 150, h = Math.round(460 * v);
          o.push(A(R(x, 900 - h, 110, h, i === 7 ? LIME : '#26304d', { rx: 14, name: 'Багана' }), 'rise', 0.05 * i), T((i + 1) + '-р сар', 922, 20, { x: x - 20, w: 150, body: 1, color: MU }));
        });
        o.push(T('2,400', 390, 32, { x: 1170, w: 150, weight: 700, color: LIME }));
        [['2,400', 'идэвхтэй хэрэглэгч'], ['₮180 сая', 'жилийн давтагдах орлого'], ['92%', 'хэрэглэгчийн хадгалалт']].forEach(function (d, i) {
          var y = 380 + i * 180;
          o.push(L(d[0], y, 64, 1420, 360, { weight: 700, color: '#ffffff' }), L(d[1], y + 82, 24, 1420, 360, { body: 1, color: MU }));
        });
        return o;
      }),
      S('Баг', function () {
        var o = [BG(K), lab('05 — БАГ'), L('Туршлагатай, тэмүүлэлтэй баг', 190, 80, 136, 1600, { weight: 700, color: '#ffffff' })];
        [['БТ', 'Б. Тэмүүлэн', 'CEO · ҮҮСГЭН БАЙГУУЛАГЧ', 'Санхүүгийн салбарт 10 жил', VIO], ['ГН', 'Г. Номин', 'CTO', 'Технологийн компанид 8 жил инженер', LIME],
          ['ДА', 'Д. Ариунаа', 'БҮТЭЭГДЭХҮҮН', 'UX, бүтээгдэхүүний 7 жилийн туршлага', '#ff7a59'], ['СБ', 'С. Билгүүн', 'ӨСӨЛТ, МАРКЕТИНГ', '3 стартапыг амжилттай өсгөсөн', SKY]].forEach(function (d, i) {
          var x = 140 + i * 420;
          o.push(A(R(x, 380, 380, 540, CARD, { rx: 28, stroke: LN, sw: 1.5, name: 'Карт' }), 'rise', 0.1 * i),
            A(C(x + 190, 520, 96, d[4]), 'rise', 0.1 * i), A(T(d[0], 484, 64, { x: x, w: 380, weight: 700, color: K }), 'rise', 0.1 * i),
            A(T(d[1], 668, 32, { x: x, w: 380, weight: 700, color: '#ffffff' }), 'rise', 0.1 * i),
            A(T(d[2], 718, 18, { x: x, w: 380, body: 1, weight: 700, color: LIME, cs: 200 }), 'rise', 0.1 * i),
            A(T(d[3], 770, 21, { x: x + 36, w: 308, body: 1, color: MU, lh: 1.5 }), 'rise', 0.1 * i));
        });
        return o;
      }),
      S('Хөрөнгө оруулалт', function () {
        var o = [BG(K), VIDEO(0, 0, W, HH, 'citynight'), R(0, 0, W, HH, K, { opacity: 0.8, name: 'Бараан' }), lab('06 — ХӨРӨНГӨ ОРУУЛАЛТ', 150),
          A(L('Бид ₮1.5 тэрбум\nтатан төвлөрүүлж байна', 200, 96, 134, 1300, { weight: 700, color: '#ffffff', lh: 1.04 }), 'rise', 0.1)];
        [['Бүтээгдэхүүн хөгжүүлэлт', 0.45, LIME], ['Маркетинг, борлуулалт', 0.30, VIO], ['Баг, үйл ажиллагаа', 0.25, SKY]].forEach(function (d, i) {
          var y = 520 + i * 110;
          o.push(L(d[0], y, 26, 140, 420, { body: 1, color: '#ffffff' }), R(580, y + 8, 800, 18, '#26304d', { rx: 9, name: 'Мөр' }),
            A(R(580, y + 8, Math.round(800 * d[1]), 18, d[2], { rx: 9, name: 'Мөр' }), 'wipe', 0.3 + i * 0.15, 0.9), L(Math.round(d[1] * 100) + '%', y - 6, 32, 1410, 160, { weight: 700, color: '#ffffff' }));
        });
        o.push(pill(140, 880, 360, 66, LIME, 'hello@nova.mn', K, 24), L('nova.mn  ·  +976 7700 1122', 898, 24, 540, 900, { body: 1, color: '#ffffff' }));
        return o;
      })
    ] });
  })();

  // ================= МОНГОЛООР АЯЛ — элсэн, терракота (видео) =================
  (function () {
    var SAND = '#efe6d8', INK = '#1c2721', TERRA = '#c8643b', MU = '#6f6a60', CRM = '#fff7ea';
    var lab = function (t, y, x, c) { return L(t, y, 22, x == null ? 140 : x, 900, { body: 1, weight: 800, color: c || TERRA, cs: 400 }); };
    D.push({ id: 'travel', tag: 'Аялал', name: 'Монголоор аял — видео', fonts: ['Playfair', 'Manrope'], sw: [INK, TERRA, SAND], trans: 'fade', slides: [
      S('Нүүр', function () { return [
        BG(INK), VIDEO(0, 0, W, HH, 'horses'), R(0, 0, W, HH, INK, { opacity: 0.18, name: 'Бараан' }),
        SCRIM(0, 380, W, 700, 90, [[0, INK, 0], [1, INK, 0.92]]),
        L('STEPPE TRAVEL', 90, 22, 140, 600, { body: 1, weight: 800, color: '#ffffff', cs: 300 }), L('steppe.mn', 90, 22, 1180, 600, { body: 1, color: '#ffffff', align: 'right' }),
        A(T('ТАЛ НУТГИЙН АЯЛАЛ  ·  2026', 560, 24, { body: 1, weight: 600, color: '#f1e7d6', cs: 500, w: 1400 }), 'fade', 0.2),
        A(T('Монгол', 600, 250, { weight: 500, italic: 1, color: CRM, lh: 1, w: 1700 }), 'rise', 0.35, 1),
        A(T('Нүүдэлчдийн нутгаар 7 өдрийн адал явдал', 905, 30, { body: 1, color: '#e9dfcf', w: 1200 }), 'fade', 0.7)
      ]; }),
      S('Бидний тухай', function () {
        var o = [BG(SAND, { fx: GRAIN }), PHOTO(140, 120, 640, 840, 'ger', { mask: 'arch' }),
          A(C(770, 850, 96, TERRA), 'pop', 0.4), A(T('12\nжил', 802, 36, { x: 674, w: 192, weight: 600, color: '#ffffff', lh: 1 }), 'pop', 0.4),
          lab('БИДНИЙ ТУХАЙ', 200, 960), L('Нүүдэлчдийн\nамьдралыг мэдэр', 250, 92, 956, 860, { weight: 500, color: INK, lh: 1.02 }),
          L('Бид 2014 оноос хойш 40 орны аялагчдыг Монголын өнцөг булан бүрт хүргэж, нүүдэлчин айлд хоноглох, морь унах, бүргэдчидтэй танилцах мартагдашгүй аяллыг зохион байгуулж байна.', 500, 27, 960, 800, { body: 1, color: MU, lh: 1.6 }),
          R(960, 750, 820, 1.5, '#d8ccb8', { name: 'Шугам' })];
        [['8,000+', 'аялагч'], ['21', 'аймаг'], ['4.9★', 'үнэлгээ']].forEach(function (d, i) {
          var x = 960 + i * 280;
          o.push(L(d[0], 784, 58, x, 260, { weight: 600, color: INK }), L(d[1], 864, 22, x, 260, { body: 1, color: MU }));
        });
        return o;
      }),
      S('Маршрут', function () {
        var o = [BG(INK), VIDEO(0, 0, 900, HH, 'road'), lab('МАРШРУТ', 130, 1020), L('7 өдрийн аялал', 172, 84, 1016, 800, { weight: 500, italic: 1, color: '#f5ecdd' }),
          R(1050, 340, 2, 560, '#3c4a41', { name: 'Шугам' })];
        [['ӨДӨР 1', 'Улаанбаатар → Хустай', 'Тахийн нутагт анхны шөнө'], ['ӨДӨР 2–3', 'Хархорин, Орхоны хөндий', 'Эртний нийслэл, Улаан цутгалан хүрхрээ'],
          ['ӨДӨР 4–5', 'Говь, Хонгорын элс', 'Тэмээ унаж, манхан дээр нар жаргахыг харах'], ['ӨДӨР 6–7', 'Тэрэлж → Улаанбаатар', 'Морин аялал, гэр буудалд хоноглох']].forEach(function (d, i) {
          var y = 320 + i * 155;
          o.push(A(C(1051, y + 12, 14, TERRA), 'pop', 0.15 + i * 0.12), A(L(d[0], y, 22, 1090, 700, { body: 1, weight: 800, color: TERRA, cs: 200 }), 'panr', 0.15 + i * 0.12),
            A(L(d[1], y + 34, 36, 1090, 700, { weight: 500, color: '#f5ecdd' }), 'panr', 0.15 + i * 0.12), A(L(d[2], y + 88, 21, 1090, 700, { body: 1, color: '#9fa89f' }), 'panr', 0.15 + i * 0.12));
        });
        return o;
      }),
      S('Онцлох газрууд', function () {
        var o = [BG(SAND, { fx: GRAIN }), T('ОНЦЛОХ ГАЗРУУД', 110, 22, { body: 1, weight: 800, color: TERRA, cs: 400 }), T('Заавал очих ёстой', 150, 84, { weight: 500, italic: 1, color: INK })];
        [['gobi', 'Хонгорын элс', 'Говийн “дуулдаг” манхан'], ['rider', 'Морин аялал', 'Талын салхинд давхих'], ['eagle', 'Бүргэдчин', 'Алтайн уламжлалт шувуулахуй']].forEach(function (d, i) {
          var x = 140 + i * 560;
          o.push(A(PHOTO(x, 320, 520, 560, d[0], { mask: 'rounded', r: 24 }), 'rise', 0.1 + i * 0.12), L(d[1], 912, 42, x, 520, { weight: 600, color: INK }), L(d[2], 972, 22, x, 520, { body: 1, color: MU }));
        });
        return o;
      }),
      S('Видео — ишлэл', function () { return [
        BG(INK), VIDEO(0, 0, W, HH, 'sunset'), R(0, 0, W, HH, '#0e1411', { opacity: 0.45, name: 'Бараан' }),
        A(T('“Энд тэнгэр\nилүү ойрхон”', 330, 124, { weight: 500, italic: 1, color: CRM, lh: 1.05, w: 1600 }), 'blur', 0.2, 1.2),
        A(T('— Аялагчийн сэтгэгдэл, 2025', 650, 26, { body: 1, color: '#e9dfcf', w: 1000 }), 'fade', 0.8)
      ]; }),
      S('Аяллын багц', function () {
        var o = [BG(SAND, { fx: GRAIN }), T('АЯЛЛЫН БАГЦ', 110, 22, { body: 1, weight: 800, color: TERRA, cs: 400 }), T('Өөрт тохирохоо сонго', 150, 84, { weight: 500, italic: 1, color: INK })];
        [['СТАНДАРТ', '$890', '✓ Гэр буудалд хоноглолт\n✓ Өдөрт 3 хоол\n✓ Англи хэлтэй хөтөч\n✓ Тээвэр'],
          ['ПРЕМИУМ', '$1,490', '✓ Стандарт багцын бүгд\n✓ Морин аялал\n✓ Нүүдэлчин айлд хоноглох\n✓ Мэргэжлийн гэрэл зураг'],
          ['VIP', '$2,600', '✓ Премиум багцын бүгд\n✓ Хувийн хөтөч, жолооч\n✓ Бүргэдчинтэй өдөр\n✓ Дотоодын нислэг']].forEach(function (d, i) {
          var x = 160 + i * 545, hi = i === 1;
          o.push(A(R(x, 310, 505, 540, hi ? INK : '#fffaf2', { rx: 28, stroke: hi ? null : '#e3d6c1', sw: 1.5, name: 'Карт' }), 'rise', 0.1 * i),
            L(d[0], 360, 22, x + 50, 405, { body: 1, weight: 800, color: TERRA, cs: 300 }), L(d[1], 404, 84, x + 50, 405, { weight: 600, color: hi ? CRM : INK }),
            L('нэг хүн · 7 өдөр', 510, 20, x + 50, 405, { body: 1, color: hi ? '#b9b3a6' : MU }), R(x + 50, 566, 405, 1, hi ? '#3c4a41' : '#e3d6c1', { name: 'Шугам' }),
            L(d[2], 596, 23, x + 50, 405, { body: 1, color: hi ? '#e9dfcf' : '#4d4a44', lh: 1.95 }));
          if (hi) o.push(pill(x + 285, 356, 170, 38, TERRA, 'ЭРЭЛТТЭЙ', '#ffffff', 15, { cs: 200 }));
        });
        return o;
      }),
      S('Холбоо барих', function () {
        var o = [BG(INK), VIDEO(1060, 110, 720, 860, 'yurt', { mask: 'arch' }),
          A(L('Аяллаа\nтөлөвлөе', 190, 116, 134, 860, { weight: 500, italic: 1, color: CRM, lh: 1.0 }), 'rise', 0.1),
          L('Хувийн болон бүлгийн аяллыг таны хүсэлтээр төлөвлөж өгнө.', 470, 28, 140, 760, { body: 1, color: '#b9c0b8', lh: 1.5 })];
        [['УТАС', '+976 7711 2233'], ['И-МЭЙЛ', 'hello@steppe.mn'], ['ХАЯГ', 'Улаанбаатар, Сүхбаатар дүүрэг']].forEach(function (d, i) {
          var y = 640 + i * 90;
          o.push(L(d[0], y + 6, 18, 140, 200, { body: 1, weight: 800, color: TERRA, cs: 300 }), L(d[1], y, 30, 340, 640, { body: 1, color: CRM, weight: 500 }), R(140, y + 62, 820, 1, '#33413a', { name: 'Шугам' }));
        });
        return o;
      })
    ] });
  })();

  // ================= FASHION LOOKBOOK — цайвар, хар (видео) =================
  (function () {
    var BONE = '#f0ebe3', BLK = '#121110', RUST = '#a8502c', GR = '#8a847b';
    var lab = function (t, y, x, c) { return L(t, y, 20, x == null ? 140 : x, 900, { body: 1, weight: 700, color: c || RUST, cs: 500 }); };
    D.push({ id: 'fashion', tag: 'Загвар', name: 'Fashion lookbook — видео', fonts: ['Noto Serif Display', 'Inter'], sw: [BONE, BLK, RUST], trans: 'fade', slides: [
      S('Нүүр', function () { return [
        BG(BONE), VIDEO(1000, 0, 920, HH, 'runway', { fy: 0.3 }), SCRIM(1000, 780, 920, 300, 90, [[0, '#000000', 0], [1, '#000000', 0.5]]),
        lab('ATELIER NOMAD', 90, 140, BLK), L('SS—26', 90, 20, 700, 240, { body: 1, color: GR, align: 'right', cs: 300 }),
        A(L('Look\nbook', 230, 250, 126, 900, { weight: 300, color: BLK, lh: 0.88, cs: -30 }), 'rise', 0.1, 1),
        R(140, 760, 120, 2, RUST, { name: 'Шугам' }),
        L('Хавар — Зуны цуглуулга 2026', 790, 36, 140, 820, { italic: 1, color: BLK }),
        L('Монгол ноолуур, торго, арьсаар урласан 24 өмсгөл', 852, 22, 140, 820, { body: 1, color: GR }),
        L('CAMPAIGN FILM ▶', 990, 18, 1400, 380, { body: 1, weight: 700, color: '#ffffff', align: 'right', cs: 300 })
      ]; }),
      S('Бидний түүх', function () { return [
        BG(BLK), PHOTO(0, 0, 820, HH, 'model', { fy: 0.3 }),
        lab('БИДНИЙ ТҮҮХ', 190, 960), L('Уламжлалыг\nорчин цагт', 240, 96, 956, 860, { weight: 400, color: BONE, lh: 1.0 }),
        L('Atelier Nomad 2018 онд Улаанбаатарт үүсгэн байгуулагдсан. Бид монгол ноолуур, байгалийн материалыг орчин үеийн минимал загвартай хослуулж, удаан эдэлгээтэй хувцас бүтээдэг.', 490, 26, 960, 780, { body: 1, color: '#b8b1a6', lh: 1.65 }),
        L('Н. Сараа', 790, 48, 960, 600, { italic: 1, color: BONE }), L('ЕРӨНХИЙ ДИЗАЙНЕР', 866, 18, 960, 600, { body: 1, color: GR, cs: 300 })
      ]; }),
      S('Цуглуулга', function () {
        var o = [BG(BONE), lab('ЦУГЛУУЛГА', 110), L('Гол өмсгөлүүд', 150, 84, 136, 1200, { weight: 400, color: BLK })];
        [['model', 'Ноолууран пальто', '₮1,290,000'], ['woman', 'Торгон даашинз', '₮890,000'], ['woman2', 'Арьсан хүрэм', '₮1,450,000']].forEach(function (d, i) {
          var x = 140 + i * 560;
          o.push(A(PHOTO(x, 310, 520, 600, d[0], { fy: 0.25 }), 'rise', 0.1 + i * 0.12), L('0' + (i + 1), 946, 20, x, 80, { body: 1, weight: 700, color: RUST }),
            L(d[1], 936, 32, x + 70, 450, { italic: 1, color: BLK }), L(d[2], 984, 20, x + 70, 450, { body: 1, color: GR }));
        });
        return o;
      }),
      S('Campaign film', function () { return [
        BG(BLK), VIDEO(0, 0, W, HH, 'models'), SCRIM(0, 0, W, HH, 0, [[0, '#000000', 0.72], [0.5, '#000000', 0.2], [1, '#000000', 0]]),
        lab('ATELIER NOMAD', 90, 140, '#ffffff'),
        A(L('Campaign\nfilm', 560, 156, 126, 1000, { weight: 400, italic: 1, color: '#ffffff', lh: 0.92 }), 'rise', 0.2, 1),
        A(L('“ТАЛЫН САЛХИ”  ·  2026', 930, 20, 140, 800, { body: 1, weight: 700, color: '#ffffff', cs: 500 }), 'fade', 0.6)
      ]; }),
      S('Материал', function () {
        var o = [BG(BONE), VIDEO(1180, 110, 600, 860, 'studio'), lab('МАТЕРИАЛ', 150),
          L('100%', 196, 200, 126, 1000, { weight: 300, color: BLK, lh: 1 }), L('монгол ноолуур', 420, 42, 140, 900, { italic: 1, color: BLK })];
        [['Ноолуур', 'Говийн ямааны нарийн ноолуур — зөөлөн, дулаан'], ['Торго', 'Байгалийн торго, гараар будсан'], ['Арьс', 'Ургамлын аргаар боловсруулсан']].forEach(function (d, i) {
          var x = 140 + i * 330;
          o.push(R(x, 600, 290, 1.5, BLK, { name: 'Шугам' }), L(d[0], 630, 32, x, 290, { color: BLK }), L(d[1], 686, 20, x, 290, { body: 1, color: GR, lh: 1.6 }));
        });
        return o;
      }),
      S('Үнийн жагсаалт', function () {
        var o = [BG(BLK), lab('ҮНИЙН ЖАГСААЛТ', 110), L('Цуглуулгын жагсаалт', 150, 76, 136, 1400, { weight: 400, color: BONE })];
        [['Ноолууран пальто — тэмээн', '₮1,290,000'], ['Торгон даашинз — шампань', '₮890,000'], ['Арьсан хүрэм — хар', '₮1,450,000'], ['Ноолууран цамц — цагаан', '₮420,000'], ['Өргөн өмд — элсэн', '₮360,000'], ['Ороолт — ноолуур', '₮180,000']].forEach(function (d, i) {
          var y = 330 + i * 100;
          o.push(L('0' + (i + 1), y + 8, 20, 140, 80, { body: 1, color: RUST, weight: 700 }), L(d[0], y, 36, 240, 900, { color: BONE }),
            L(d[1], y + 4, 30, 1180, 600, { body: 1, color: BONE, align: 'right', weight: 300 }), R(140, y + 66, 1640, 1, '#2d2a26', { name: 'Шугам' }));
        });
        return o;
      }),
      S('Холбоо барих', function () { return [
        BG(BLK), VIDEO(0, 0, W, HH, 'walk', { fy: 0.3 }), R(0, 0, W, HH, BLK, { opacity: 0.64, name: 'Бараан' }),
        A(T('ATELIER NOMAD', 330, 130, { weight: 300, color: BONE, cs: 100, w: 1800 }), 'blur', 0.1, 1),
        R(900, 520, 120, 1.5, RUST, { name: 'Шугам' }),
        T('Showroom  ·  Сүхбаатар дүүрэг, 1-р хороо', 560, 30, { body: 1, color: BONE, w: 1400 }),
        T('@ateliernomad   ·   ateliernomad.mn   ·   7700 2626', 620, 24, { body: 1, color: '#cfc8bd', w: 1400 })
      ]; })
    ] });
  })();

  // ================= ЖИЛИЙН ТАЙЛАН — цагаан, индиго =================
  (function () {
    var WH = '#ffffff', INK = '#0f172a', IND = '#4f46e5', MINT = '#10b981', LT = '#f1f5f9', MU = '#64748b', LN = '#e2e8f0', IND2 = '#c7d2fe';
    var lab = function (t, y, c) { return L(t, y || 130, 22, 140, 900, { body: 1, weight: 700, color: c || IND, cs: 300 }); };
    D.push({ id: 'report', tag: 'Бизнес', name: 'Жилийн тайлан — индиго', fonts: ['Inter Tight', 'Inter'], sw: [WH, INK, IND], trans: 'slide', slides: [
      S('Нүүр', function () { return [
        BG(WH), PHOTO(1060, 90, 720, 900, 'tower', { mask: 'rounded', r: 28 }),
        R(140, 140, 60, 60, IND, { rx: 16, name: 'Лого' }), L('ТАНЫ КОМПАНИ', 157, 22, 222, 600, { body: 1, weight: 700, color: INK, cs: 200 }),
        A(L('2026', 290, 260, 126, 900, { weight: 800, color: IND, lh: 1, cs: -40 }), 'rise', 0.1),
        A(L('Жилийн тайлан', 570, 96, 134, 900, { weight: 700, color: INK }), 'rise', 0.25),
        L('Үйл ажиллагаа, санхүүгийн үр дүн, ирэх оны стратеги', 710, 28, 140, 820, { body: 1, color: MU, lh: 1.5 }),
        R(140, 910, 820, 1, LN, { name: 'Шугам' }), L('Хувьцаа эзэмшигчдийн хурал  ·  2027 оны 3-р сар', 940, 22, 140, 820, { body: 1, color: MU })
      ]; }),
      S('Гол үзүүлэлт', function () {
        var o = [BG(LT), lab('ГОЛ ҮЗҮҮЛЭЛТ'), L('Оны онцлох тоонууд', 175, 72, 136, 1400, { weight: 700, color: INK })];
        [['Орлого', '₮42.8', 'тэрбум төгрөг', '▲ 24%'], ['Цэвэр ашиг', '₮6.1', 'тэрбум төгрөг', '▲ 31%'], ['Харилцагч', '184K', 'идэвхтэй харилцагч', '▲ 18%'], ['Ажилтан', '1,280', '18 салбарт', '▲ 9%']].forEach(function (d, i) {
          var x = 140 + i * 420;
          o.push(A(R(x, 360, 390, 520, WH, { rx: 28, name: 'Карт' }), 'rise', 0.08 * i), L(d[0], 410, 24, x + 40, 310, { body: 1, weight: 600, color: MU }),
            L(d[1], 460, 92, x + 40, 330, { weight: 800, color: INK, cs: -20 }), L(d[2], 574, 24, x + 40, 330, { body: 1, color: MU }));
          [18, 26, 32, 42, 58].forEach(function (h, k) { o.push(R(x + 40 + k * 34, 740 - h, 22, h, k === 4 ? IND : IND2, { rx: 4, name: 'Багана' })); });
          o.push(pill(x + 40, 790, 140, 44, '#d1fae5', d[3], '#047857', 19));
        });
        return o;
      }),
      S('Орлогын өсөлт', function () {
        var o = [BG(WH), lab('САНХҮҮ'), L('Орлогын өсөлт, 2022–2026', 175, 72, 136, 1400, { weight: 700, color: INK })];
        for (var g = 0; g <= 4; g++) o.push(R(140, 900 - g * 115, 1120, 1, LN, { name: 'Шугам' }));
        [18.2, 23.5, 28.9, 34.5, 42.8].forEach(function (v, i) {
          var x = 190 + i * 220, h = Math.round(v / 42.8 * 460);
          o.push(A(R(x, 900 - h, 150, h, i === 4 ? IND : IND2, { rx: 12, name: 'Багана' }), 'rise', 0.08 * i),
            T(String(v), 900 - h - 52, 30, { x: x - 25, w: 200, weight: 700, color: i === 4 ? IND : INK }), T(String(2022 + i), 924, 24, { x: x - 25, w: 200, body: 1, color: MU }));
        });
        o.push(R(1340, 360, 440, 560, LT, { rx: 28, name: 'Карт' }), L('+135%', 410, 88, 1390, 360, { weight: 800, color: IND }), L('5 жилийн нийт өсөлт', 524, 24, 1390, 360, { body: 1, color: MU }),
          R(1390, 600, 340, 1, LN, { name: 'Шугам' }), L('Жилийн дундаж өсөлт', 636, 22, 1390, 340, { body: 1, color: MU }), L('23.8%', 676, 60, 1390, 340, { weight: 800, color: INK }),
          L('Зорилтот түвшнийг 6%-иар давсан', 790, 22, 1390, 340, { body: 1, color: MINT, weight: 600, lh: 1.4 }), L('тэрбум ₮', 330, 20, 140, 300, { body: 1, color: MU }));
        return o;
      }),
      S('Орлогын бүтэц', function () {
        var o = [BG(WH), lab('БҮТЭЦ'), L('Орлогын бүтэц', 175, 72, 136, 1400, { weight: 700, color: INK })];
        [['Жижиглэн худалдаа', 0.42, IND], ['Бөөний худалдаа', 0.28, '#818cf8'], ['Онлайн борлуулалт', 0.18, MINT], ['Бусад үйлчилгээ', 0.12, '#cbd5e1']].forEach(function (d, i) {
          var y = 370 + i * 130;
          o.push(L(d[0], y, 28, 140, 400, { body: 1, weight: 600, color: INK }), R(580, y + 4, 1000, 30, LT, { rx: 15, name: 'Мөр' }),
            A(R(580, y + 4, Math.round(1000 * d[1]), 30, d[2], { rx: 15, name: 'Мөр' }), 'wipe', 0.15 + i * 0.12, 0.9), L(Math.round(d[1] * 100) + '%', y - 10, 44, 1600, 180, { weight: 800, color: INK, align: 'right' }));
        });
        o.push(R(140, 900, 1640, 1, LN, { name: 'Шугам' }), L('Онлайн борлуулалт өмнөх оноос 2.3 дахин өссөн — хамгийн хурдан өсөж буй суваг.', 930, 24, 140, 1640, { body: 1, color: MU }));
        return o;
      }),
      S('Онцлох үйл явдал', function () {
        var o = [BG(INK), lab('2026 ОН', 130, '#a5b4fc'), L('Онцлох үйл явдлууд', 175, 72, 136, 1400, { weight: 700, color: '#ffffff' }), R(140, 540, 1640, 2, '#334155', { name: 'Шугам' })];
        [['Q1', 'Шинэ агуулах ашиглалтад', 'Хүчин чадал 2 дахин нэмэгдэж, хүргэлт 1 өдөр болсон'], ['Q2', 'Мобайл апп нээлтээ хийв', 'Эхний 3 сард 60,000 татан авалт'],
          ['Q3', 'Дархан, Эрдэнэт салбар', 'Орон нутагт анхны 2 салбараа нээсэн'], ['Q4', 'ISO 9001 гэрчилгээ', 'Чанарын удирдлагын олон улсын стандарт']].forEach(function (d, i) {
          var x = 140 + i * 410;
          o.push(L(d[0], 460, 22, x, 370, { body: 1, weight: 800, color: '#a5b4fc', cs: 300 }), A(C(x + 10, 541, 12, i === 3 ? MINT : IND), 'pop', 0.15 + i * 0.15),
            A(L(d[1], 590, 34, x, 360, { weight: 700, color: '#ffffff', lh: 1.15 }), 'rise', 0.15 + i * 0.15), A(L(d[2], 700, 22, x, 350, { body: 1, color: '#94a3b8', lh: 1.5 }), 'rise', 0.15 + i * 0.15));
        });
        return o;
      }),
      S('Удирдлагын үг', function () { return [
        BG(WH), PHOTO(0, 0, 860, HH, 'team'),
        L('“', 170, 220, 956, 200, { weight: 800, color: IND, lh: 1 }),
        L('Хэрэглэгч бүрт илүү ойр, илүү хурдан үйлчлэхийн тулд хөрөнгө оруулалтаа 2 дахин нэмсэн нь энэ оны өсөлтийн гол түлхүүр боллоо.', 380, 44, 960, 820, { weight: 600, color: INK, lh: 1.3 }),
        R(960, 760, 80, 4, IND, { name: 'Шугам' }), L('Б. Энхбаяр', 800, 32, 960, 700, { weight: 700, color: INK }), L('Гүйцэтгэх захирал', 850, 22, 960, 700, { body: 1, color: MU })
      ]; }),
      S('Ирэх оны зорилт', function () {
        var o = [BG(LT), lab('2027'), L('Ирэх оны зорилтууд', 175, 72, 136, 1400, { weight: 700, color: INK })];
        [['₮55 тэрбум орлого', 'Өсөлтийн хурдаа хадгалж, онлайн сувгийг 2 дахин өсгөх'], ['5 шинэ салбар', 'Орон нутгийн томоохон 5 хотод салбар нээх'], ['Нүүрстөрөгч −20%', 'Сэргээгдэх эрчим хүч, цахилгаан тээврийн хэрэгсэл']].forEach(function (d, i) {
          var x = 140 + i * 555;
          o.push(A(R(x, 350, 515, 400, WH, { rx: 28, name: 'Карт' }), 'rise', 0.1 * i), L('0' + (i + 1), 400, 64, x + 48, 300, { weight: 800, color: IND }),
            L(d[0], 510, 38, x + 48, 430, { weight: 700, color: INK, lh: 1.15 }), L(d[1], 580, 23, x + 48, 420, { body: 1, color: MU, lh: 1.5 }));
        });
        o.push(L('Баярлалаа', 890, 44, 140, 800, { weight: 700, color: INK }), L('info@company.mn  ·  7700 0000', 905, 22, 980, 800, { body: 1, color: MU, align: 'right' }));
        return o;
      })
    ] });
  })();

  // ================= КОНЦЕРТ, ФЕСТИВАЛЬ — хар, ягаан, шар (видео) =================
  (function () {
    var K = '#0a0a0a', PINK = '#ff2e7e', YEL = '#ffe14d', MU = '#a1a1aa', G2 = '#161616';
    var lab = function (t, y, c) { return L(t, y, 22, 140, 900, { body: 1, weight: 800, color: c || PINK, cs: 300 }); };
    D.push({ id: 'event', tag: 'Арга хэмжээ', name: 'Фестиваль, концерт — видео', fonts: ['Oswald', 'Inter'], sw: [K, PINK, YEL], trans: 'zoom', slides: [
      S('Нүүр', function () { return [
        BG(K), VIDEO(0, 0, W, HH, 'crowd'), R(0, 0, W, HH, K, { opacity: 0.4, name: 'Бараан' }), SCRIM(0, 0, W, HH, 0, [[0, K, 0.85], [0.6, K, 0.2], [1, K, 0]]),
        L('07.12 — 07.14  ·  ЗАЙСАН', 170, 30, 140, 1000, { body: 1, weight: 800, color: YEL, cs: 200 }),
        A(L('SUMMER\nFEST 26', 220, 230, 126, 1500, { weight: 700, color: '#ffffff', lh: 0.88, cs: -10 }), 'rise', 0.1, 0.9),
        A(L('Хөгжим  ·  Урлаг  ·  Хоол  ·  Кемп', 690, 34, 140, 1200, { body: 1, weight: 600, color: '#ffffff' }), 'fade', 0.45),
        A(pill(140, 800, 470, 70, PINK, 'ТАСАЛБАР ЗАРАГДАЖ БАЙНА', '#ffffff', 22, { cs: 100 }), 'pop', 0.7), L('summerfest.mn', 818, 26, 650, 600, { body: 1, color: '#ffffff', weight: 600 })
      ]; }),
      S('Фестивалийн тухай', function () {
        var o = [BG(K), VIDEO(1000, 110, 780, 860, 'hands', { mask: 'rounded', r: 28 }), lab('ФЕСТИВАЛИЙН ТУХАЙ', 150)];
        [['3 ӨДӨР', 'тасралтгүй хөгжим, 2 тайз'], ['40+', 'дотоод, гадаадын уран бүтээлч'], ['20K', 'үзэгч, кемп бүхий талбай']].forEach(function (d, i) {
          var y = 210 + i * 230;
          o.push(A(L(d[0], y, 150, 134, 820, { weight: 700, color: i === 1 ? YEL : '#ffffff', lh: 1 }), 'rise', 0.1 + i * 0.12), L(d[1], y + 160, 28, 140, 780, { body: 1, color: MU }));
        });
        return o;
      }),
      S('Line-up', function () { return [
        BG(PINK), T('LINE-UP', 90, 30, { body: 1, weight: 800, color: K, cs: 600 }),
        A(T('NIGHT RIDERS', 160, 160, { weight: 700, color: K, lh: 1 }), 'rise', 0.05),
        A(T('ALTAN SOUND  ·  KHAN BEAT', 350, 92, { weight: 700, color: '#ffffff' }), 'rise', 0.15),
        A(T('MOTHER STEPPE  ·  SARAN  ·  ULAAN', 482, 70, { weight: 700, color: K }), 'rise', 0.25),
        A(T('BLUE SKY  ·  TENGER  ·  DJ NARA  ·  HULAN', 600, 54, { weight: 700, color: '#ffffff' }), 'rise', 0.35),
        T('+ 30 ГАРУЙ УРАН БҮТЭЭЛЧ', 730, 30, { body: 1, weight: 800, color: K, cs: 300 }),
        pill(480, 880, 300, 64, K, 'ПҮРЭВ  07.12', YEL, 22), pill(810, 880, 300, 64, K, 'БААСАН  07.13', YEL, 22), pill(1140, 880, 300, 64, K, 'БЯМБА  07.14', YEL, 22)
      ]; }),
      S('Хөтөлбөр', function () {
        var o = [BG(K), lab('ХӨТӨЛБӨР', 110), L('Өдөр бүрийн хуваарь', 150, 92, 136, 1500, { weight: 700, color: '#ffffff' })];
        [['ПҮРЭВ 07.12', [['16:00', 'Нээлт, DJ сет'], ['18:00', 'ALTAN SOUND'], ['20:00', 'KHAN BEAT'], ['22:00', 'NIGHT RIDERS']]],
          ['БААСАН 07.13', [['14:00', 'Урлагийн цэх'], ['17:00', 'SARAN'], ['19:30', 'MOTHER STEPPE'], ['22:00', 'Шөнийн DJ']]],
          ['БЯМБА 07.14', [['12:00', 'Гэр бүлийн өдөр'], ['16:00', 'TENGER'], ['19:00', 'BLUE SKY'], ['21:30', 'Хаалт, салют']]]].forEach(function (d, i) {
          var x = 140 + i * 555;
          o.push(A(R(x, 330, 515, 620, G2, { rx: 24, name: 'Карт' }), 'rise', 0.1 * i), L(d[0], 372, 26, x + 40, 435, { body: 1, weight: 800, color: [PINK, YEL, '#ffffff'][i], cs: 200 }));
          d[1].forEach(function (r, j) {
            var y = 460 + j * 118;
            o.push(L(r[0], y, 32, x + 40, 140, { weight: 600, color: '#ffffff' }), L(r[1], y + 6, 24, x + 180, 300, { body: 1, color: '#d4d4d8', lh: 1.3 }), R(x + 40, y + 76, 435, 1, '#262626', { name: 'Шугам' }));
          });
        });
        return o;
      }),
      S('Видео — тайз', function () { return [
        BG(K), VIDEO(0, 0, W, HH, 'stage'), SCRIM(0, 480, W, 600, 90, [[0, K, 0], [1, K, 0.92]]),
        A(L('ЧАМАЙГ\nХҮЛЭЭЖ БАЙНА', 560, 150, 126, 1650, { weight: 700, color: '#ffffff', lh: 0.9 }), 'rise', 0.2),
        A(L('Бүх насныханд  ·  Кемп, хоолны талбай  ·  Үнэгүй зогсоол', 950, 26, 140, 1500, { body: 1, color: '#e4e4e7' }), 'fade', 0.6)
      ]; }),
      S('Тасалбар', function () {
        var o = [BG(K), T('ТАСАЛБАР', 110, 26, { body: 1, weight: 800, color: PINK, cs: 400 }), T('Эртхэн аваарай', 150, 96, { weight: 700, color: '#ffffff' })];
        [['ЭНГИЙН', '₮99,000', 'Нэг өдрийн эрх\nЕрөнхий талбай\nХоолны талбай'], ['3 ӨДӨР', '₮240,000', 'Бүх өдрийн эрх\nКемпийн байр\nФестивалийн цамц'], ['VIP', '₮290,000', 'Тайзны өмнөх бүс\nVIP лаунж, бар\nТусгай орц']].forEach(function (d, i) {
          var x = 160 + i * 545, hi = i === 1;
          o.push(A(R(x, 330, 505, 490, hi ? YEL : G2, { rx: 24, name: 'Тасалбар' }), 'rise', 0.1 * i),
            L(d[0], 380, 30, x + 48, 410, { weight: 600, color: hi ? K : '#ffffff', cs: 100 }), L(d[1], 436, 96, x + 48, 420, { weight: 700, color: hi ? K : (i === 0 ? '#ffffff' : PINK) }),
            R(x + 48, 590, 410, 2, hi ? 'rgba(10,10,10,0.25)' : '#2e2e2e', { name: 'Шугам' }), L(d[2], 624, 24, x + 48, 410, { body: 1, color: hi ? '#1f1f1f' : '#d4d4d8', lh: 1.85 }));
          if (hi) o.push(pill(x + 300, 382, 160, 40, K, 'ХЯМДРАЛ', YEL, 16, { cs: 150 }));
        });
        return o;
      }),
      S('Холбоо барих', function () {
        var o = [BG(K), VIDEO(0, 0, W, 540, 'lights'), R(0, 0, W, 540, K, { opacity: 0.35, name: 'Бараан' }), SCRIM(0, 240, W, 300, 90, [[0, K, 0], [1, K, 1]]),
          A(T('УУЛЗЪЯ!', 150, 200, { weight: 700, color: '#ffffff' }), 'pop', 0.1),
          T('ИВЭЭН ТЭТГЭГЧИД', 580, 22, { body: 1, weight: 800, color: MU, cs: 400 })];
        for (var i = 0; i < 5; i++) { var x = 140 + i * 336; o.push(R(x, 640, 280, 120, G2, { rx: 16, stroke: '#2a2a2a', sw: 1.5, name: 'Лого' }), T('ЛОГО', 684, 26, { x: x, w: 280, body: 1, weight: 800, color: '#52525b', cs: 300 })); }
        o.push(T('summerfest.mn   ·   @summerfest.mn   ·   7505 2626', 870, 30, { body: 1, weight: 600, color: '#ffffff', w: 1600 }));
        return o;
      })
    ] });
  })();

  // ================= ФИТНЕС КЛУБ — хар, улбар шар (видео) =================
  (function () {
    var K = '#0d0d0d', ORG = '#ff5a1f', G2 = '#1a1a1a', MU = '#a3a3a3';
    var lab = function (t, y) { return L(t, y, 26, 140, 900, { weight: 700, color: ORG, cs: 200 }); };
    D.push({ id: 'fitness', tag: 'Спорт', name: 'Фитнес клуб — видео', fonts: ['Fira Sans Extra Condensed', 'Inter'], sw: [K, ORG, '#ffffff'], trans: 'push', slides: [
      S('Нүүр', function () { return [
        BG(K), VIDEO(0, 0, W, HH, 'lift'), SCRIM(0, 0, W, HH, 0, [[0, K, 0.92], [0.55, K, 0.4], [1, K, 0.05]]),
        L('IRON CLUB', 104, 26, 140, 600, { body: 1, weight: 800, italic: 1, color: '#ffffff', cs: 250 }), R(140, 150, 60, 5, ORG, { name: 'Шугам' }),
        A(L('ХҮЧ.\nТЭСВЭР.\nЧИ.', 250, 184, 126, 1200, { weight: 700, italic: 1, color: '#ffffff', lh: 0.88 }), 'rise', 0.1, 0.8),
        A(L('Улаанбаатарын хамгийн том фитнес төв — 2,000 м², 24/7', 810, 30, 140, 900, { body: 1, color: '#d4d4d4' }), 'fade', 0.5),
        A(pill(140, 900, 380, 70, ORG, 'ЭХНИЙ САР ҮНЭГҮЙ', '#ffffff', 22, { weight: 800, cs: 150 }), 'pop', 0.7)
      ]; }),
      S('Бидний тухай', function () {
        var o = [BG(K), VIDEO(980, 0, 940, HH, 'bench'), SCRIM(980, 0, 940, HH, 0, [[0, K, 1], [0.35, K, 0]]), lab('БИДНИЙ ТУХАЙ', 150),
          L('Зорилгодоо\nхамтдаа хүрье', 196, 116, 136, 900, { weight: 700, italic: 1, color: '#ffffff', lh: 0.95 }),
          L('Олон улсын гэрчилгээтэй 25 дасгалжуулагч, 300 гаруй орчин үеийн тоног төхөөрөмж, бассейн, саун — бүгд нэг дор.', 460, 28, 140, 780, { body: 1, color: MU, lh: 1.55 })];
        [['2000', 'м² талбай'], ['25', 'дасгалжуулагч'], ['24/7', 'нээлттэй']].forEach(function (d, i) {
          var x = 140 + i * 280;
          o.push(A(L(d[0], 710, 88, x, 270, { weight: 700, italic: 1, color: i === 0 ? ORG : '#ffffff' }), 'rise', 0.1 + i * 0.1), L(d[1], 820, 22, x, 250, { body: 1, color: MU }));
        });
        return o;
      }),
      S('Хөтөлбөрүүд', function () {
        var o = [BG(K), lab('ХӨТӨЛБӨРҮҮД', 110), L('Өөртөө тохирохоо сонго', 150, 96, 136, 1600, { weight: 700, italic: 1, color: '#ffffff' })];
        [['p', 'gym2', 'ХҮЧ', 'Булчин, хүч нэмэх хувийн төлөвлөгөө'], ['v', 'workout', 'КАРДИО', 'Өөх шатаах, зүрх судасны тэсвэр'], ['v', 'boxing', 'БОКС', 'Техник, хурд, стресс тайлах']].forEach(function (d, i) {
          var x = 140 + i * 555;
          o.push(A(d[0] === 'v' ? VIDEO(x, 310, 515, 470, d[1], { mask: 'rounded', r: 20 }) : PHOTO(x, 310, 515, 470, d[1], { mask: 'rounded', r: 20 }), 'rise', 0.1 + i * 0.12),
            L(d[2], 812, 54, x, 515, { weight: 700, italic: 1, color: '#ffffff' }), L(d[3], 884, 22, x, 515, { body: 1, color: MU, lh: 1.5 }), R(x, 950, 60, 5, ORG, { name: 'Шугам' }));
        });
        return o;
      }),
      S('Дасгалжуулагчид', function () {
        var o = [BG(G2), lab('ДАСГАЛЖУУЛАГЧИД', 110), L('Мэргэжлийн баг', 150, 96, 136, 1500, { weight: 700, italic: 1, color: '#ffffff' })];
        [['БГ', 'Б. Ганбаатар', 'Хүчний дасгалжуулагч', '12 жил · IFBB гэрчилгээ'], ['ДМ', 'Д. Мөнхзул', 'Фитнес, хоол зүй', '8 жил · ACE гэрчилгээ'], ['ЭТ', 'Э. Тэмүүжин', 'Бокс, функционал', '10 жил · олон улсын мастер']].forEach(function (d, i) {
          var x = 140 + i * 555;
          o.push(A(R(x, 320, 515, 620, K, { rx: 24, name: 'Карт' }), 'rise', 0.1 * i),
            A(T(d[0], 380, 220, { x: x, w: 515, weight: 700, italic: 1, color: ORG, lh: 1 }), 'rise', 0.1 * i),
            L(d[1], 690, 48, x + 44, 440, { weight: 700, italic: 1, color: '#ffffff' }), L(d[2], 756, 24, x + 44, 440, { body: 1, weight: 600, color: ORG }),
            L(d[3], 800, 22, x + 44, 440, { body: 1, color: MU }), R(x + 44, 870, 427, 1, '#2a2a2a', { name: 'Шугам' }), L('Цаг захиалах →', 888, 22, x + 44, 440, { body: 1, weight: 700, color: '#ffffff' }));
        });
        return o;
      }),
      S('Видео — уриа', function () { return [
        BG(K), VIDEO(0, 0, W, HH, 'boxing'), R(0, 0, W, HH, K, { opacity: 0.45, name: 'Бараан' }),
        A(T('ӨНӨӨДӨР\nЭХЭЛ.', 250, 250, { weight: 700, italic: 1, color: '#ffffff', lh: 0.86 }), 'zoom', 0.1, 0.9),
        A(R(900, 770, 120, 6, ORG, { name: 'Шугам' }), 'wipe', 0.6), A(T('Маргааш биш — одоо', 810, 34, { body: 1, color: '#e5e5e5' }), 'fade', 0.7)
      ]; }),
      S('Гишүүнчлэл', function () {
        var o = [BG(K), T('ГИШҮҮНЧЛЭЛ', 110, 26, { weight: 700, color: ORG, cs: 200 }), T('Үнэ, эрх', 150, 96, { weight: 700, italic: 1, color: '#ffffff' })];
        [['САРЫН', '₮120K', '/ сар', '✓ Бүх тоног төхөөрөмж\n✓ Хувцас солих өрөө\n✓ Анхны зөвлөгөө'], ['ЖИЛИЙН', '₮990K', '/ жил', '✓ Бүх бүсийн эрх\n✓ Бассейн, саун\n✓ 4 хувийн сургалт'], ['VIP', '₮1.8M', '/ жил', '✓ 24/7 нэвтрэх эрх\n✓ Хувийн дасгалжуулагч\n✓ Хоолны төлөвлөгөө']].forEach(function (d, i) {
          var x = 160 + i * 545, hi = i === 1;
          o.push(A(R(x, 320, 505, 520, hi ? ORG : G2, { rx: 24, name: 'Карт' }), 'rise', 0.1 * i),
            L(d[0], 370, 30, x + 48, 410, { weight: 700, color: hi ? '#ffffff' : ORG, cs: 200 }), L(d[1], 420, 120, x + 48, 420, { weight: 700, italic: 1, color: '#ffffff' }),
            L(d[2], 560, 24, x + 48, 410, { body: 1, color: hi ? '#ffe3d6' : MU }), R(x + 48, 620, 410, 1, hi ? 'rgba(255,255,255,0.35)' : '#2a2a2a', { name: 'Шугам' }),
            L(d[3], 650, 24, x + 48, 410, { body: 1, color: hi ? '#ffffff' : '#d4d4d4', lh: 1.9 }));
        });
        return o;
      }),
      S('Холбоо барих', function () {
        var o = [BG(G2), lab('ЦАГИЙН ХУВААРЬ', 150), L('Бид үргэлж нээлттэй', 196, 84, 136, 860, { weight: 700, italic: 1, color: '#ffffff' })];
        [['Даваа — Баасан', '06:00 — 23:00'], ['Бямба', '08:00 — 22:00'], ['Ням', '09:00 — 20:00'], ['VIP гишүүд', '24 / 7']].forEach(function (d, i) {
          var y = 400 + i * 110;
          o.push(L(d[0], y, 30, 140, 440, { body: 1, color: '#d4d4d4' }), L(d[1], y - 6, 40, 140, 780, { weight: 700, italic: 1, color: '#ffffff', align: 'right' }), R(140, y + 70, 780, 1, '#2a2a2a', { name: 'Шугам' }));
        });
        o.push(A(R(1060, 140, 720, 800, ORG, { rx: 28, name: 'Карт' }), 'rise', 0.2), L('Нэгдээрэй', 210, 110, 1120, 620, { weight: 700, italic: 1, color: '#ffffff' }),
          L('Эхний сар үнэгүй — зөвхөн энэ сард', 350, 28, 1120, 600, { body: 1, color: '#ffe3d6' }),
          L('7700 9090\nironclub.mn\n@ironclub.mn', 520, 44, 1120, 600, { weight: 700, italic: 1, color: '#ffffff', lh: 1.4 }),
          L('Хан-Уул дүүрэг, 15-р хороо', 830, 24, 1120, 600, { body: 1, color: '#ffe3d6' }));
        return o;
      })
    ] });
  })();

  // ================= ТАНСАГ ХОТХОН — зааны яс, хүрэл (видео) =================
  (function () {
    var IV = '#f4f1ec', DK = '#1c1c1c', BR = '#a07b4f', MU = '#77716a', LN = '#ddd6cb';
    var lab = function (t, y, x) { return L(t, y, 20, x == null ? 140 : x, 900, { body: 1, weight: 800, color: BR, cs: 400 }); };
    D.push({ id: 'estate', tag: 'Үл хөдлөх', name: 'Тансаг хотхон — видео', fonts: ['Cormorant Garamond', 'Manrope'], sw: [DK, BR, IV], trans: 'fade', slides: [
      S('Нүүр', function () { return [
        BG(DK), VIDEO(0, 0, W, HH, 'mansion'), R(0, 0, W, HH, DK, { opacity: 0.12, name: 'Бараан' }), SCRIM(0, 420, W, 660, 90, [[0, DK, 0], [1, DK, 0.88]]),
        L('RESIDENCE', 90, 22, 140, 600, { body: 1, weight: 700, color: '#ffffff', cs: 500 }), L('residence-altai.mn', 90, 22, 1180, 600, { body: 1, color: '#ffffff', align: 'right' }),
        A(L('Residence\nAltai', 540, 176, 126, 1300, { weight: 500, italic: 1, color: '#ffffff', lh: 0.9 }), 'rise', 0.2, 1),
        A(L('ЗАЙСАН  ·  ТАНСАГ ХОТХОН  ·  2027', 935, 22, 140, 1100, { body: 1, weight: 700, color: '#e8dccb', cs: 400 }), 'fade', 0.6)
      ]; }),
      S('Төслийн тухай', function () {
        var o = [BG(IV), PHOTO(1000, 110, 780, 860, 'lobby'), lab('ТӨСЛИЙН ТУХАЙ', 180),
          L('Байгаль ба\nтансаг байдлын\nнэгдэл', 210, 84, 136, 840, { weight: 500, color: DK, lh: 1.02 }),
          L('Богд уулын бэлд, хотын төвөөс 10 минутын зайд орших 120 айлын хаалттай хотхон. Нам гүм орчин, өндөр чанарын материал, ухаалаг гэрийн систем.', 560, 26, 140, 780, { body: 1, color: MU, lh: 1.6 }),
          R(140, 760, 800, 1, LN, { name: 'Шугам' })];
        [['120', 'айл'], ['4.2 га', 'талбай'], ['2027', 'ашиглалтад']].forEach(function (d, i) {
          var x = 140 + i * 280;
          o.push(L(d[0], 786, 66, x, 270, { weight: 500, color: DK }), L(d[1], 868, 20, x, 270, { body: 1, color: MU }));
        });
        return o;
      }),
      S('Байршил', function () {
        var o = [BG(DK), VIDEO(900, 0, 1020, HH, 'villa'), lab('БАЙРШИЛ', 170),
          L('Хотын төвд ойр,\nбайгальд илүү ойр', 215, 76, 136, 740, { weight: 500, italic: 1, color: IV, lh: 1.05 })];
        [['Олон улсын сургууль', '3 мин'], ['Худалдааны төв', '5 мин'], ['Богд уулын байгаль', '1 мин'], ['Хотын төв талбай', '12 мин']].forEach(function (d, i) {
          var y = 480 + i * 105;
          o.push(A(L(d[0], y, 28, 140, 460, { body: 1, color: '#e8e2d8' }), 'panl', 0.1 + i * 0.1), A(L(d[1], y - 4, 36, 140, 660, { weight: 600, italic: 1, color: BR, align: 'right' }), 'panl', 0.1 + i * 0.1),
            R(140, y + 62, 660, 1, '#333333', { name: 'Шугам' }));
        });
        return o;
      }),
      S('Интерьер', function () { return [
        BG(IV), lab('ИНТЕРЬЕР', 110), L('Амьдрах орчин', 150, 84, 136, 1200, { weight: 500, color: DK }),
        A(PHOTO(140, 320, 900, 640, 'living'), 'fade', 0.1), A(PHOTO(1080, 320, 700, 300, 'living2'), 'fade', 0.25), A(PHOTO(1080, 660, 700, 300, 'kitchen'), 'fade', 0.4)
      ]; }),
      S('Байрны төрлүүд', function () {
        var o = [BG(DK), lab('ТӨЛӨВЛӨЛТ', 110), L('Байрны төрлүүд', 150, 84, 136, 1200, { weight: 500, color: IV })];
        [['ТӨРӨЛ', 140], ['ТАЛБАЙ', 760], ['ӨРӨӨ', 1080], ['ҮНЭ', 1400]].forEach(function (c) { o.push(L(c[0], 340, 18, c[1], 380, { body: 1, weight: 800, color: '#8c857c', cs: 300 })); });
        o.push(R(140, 384, 1640, 1, '#3a3a3a', { name: 'Шугам' }));
        [['Garden Villa', '320 м²', '5', '₮4.8 тэрбум'], ['Penthouse', '210 м²', '4', '₮3.2 тэрбум'], ['Residence', '140 м²', '3', '₮1.9 тэрбум'], ['Studio', '78 м²', '2', '₮980 сая']].forEach(function (d, i) {
          var y = 420 + i * 120;
          o.push(L(d[0], y, 44, 140, 600, { italic: 1, weight: 500, color: IV }), L(d[1], y + 10, 28, 760, 300, { body: 1, color: '#e8e2d8' }), L(d[2], y + 10, 28, 1080, 300, { body: 1, color: '#e8e2d8' }),
            L(d[3], y + 10, 28, 1400, 380, { body: 1, weight: 700, color: BR }), R(140, y + 90, 1640, 1, '#333333', { name: 'Шугам' }));
        });
        return o;
      }),
      S('Онцлог', function () {
        var o = [BG(IV), T('ОНЦЛОГ', 110, 20, { body: 1, weight: 800, color: BR, cs: 400 }), T('Бүх зүйл нэг дор', 150, 84, { weight: 500, color: DK })];
        [['Усан сан, спа', 'Дулаан усан сан, саун, массаж'], ['Фитнес', 'Оршин суугчдад зориулсан 24/7'], ['Хүүхдийн талбай', 'Аюулгүй, ногоон тоглоомын талбай'],
          ['Харуул хамгаалалт', '24/7 камер, картын систем'], ['Газар доорх зогсоол', 'Айл бүрт 2 зогсоол, цэнэглэгч'], ['Ногоон байгууламж', 'Нийт талбайн 40% нь ногоон']].forEach(function (d, i) {
          var x = 140 + (i % 3) * 555, y = 330 + Math.floor(i / 3) * 310;
          o.push(A(C(x + 40, y + 40, 38, IV, { stroke: BR, sw: 1.5 }), 'pop', 0.06 * i), T('0' + (i + 1), y + 20, 30, { x: x, w: 80, weight: 600, color: BR }),
            L(d[0], y + 110, 38, x, 480, { weight: 600, color: DK }), L(d[1], y + 166, 22, x, 460, { body: 1, color: MU, lh: 1.5 }));
        });
        return o;
      }),
      S('Холбоо барих', function () { return [
        BG(DK), VIDEO(0, 0, W, HH, 'pool'), R(0, 0, W, HH, DK, { opacity: 0.62, name: 'Бараан' }),
        A(T('Үзэгдэх танхимд\nурьж байна', 270, 116, { weight: 500, italic: 1, color: '#ffffff', lh: 1.0, w: 1600 }), 'rise', 0.1, 1),
        R(900, 560, 120, 1.5, BR, { name: 'Шугам' }),
        T('Борлуулалтын алба  ·  7711 0707  ·  sales@residence-altai.mn', 610, 28, { body: 1, color: IV, w: 1600 }),
        T('Зайсан, Богд уулын бэл  ·  Даваа — Ням 10:00 — 19:00', 670, 22, { body: 1, color: '#cfc6b8', w: 1600 })
      ]; })
    ] });
  })();

  // ================= КОФЕ БРЭНД — цөцгий, эспрессо (видео) =================
  (function () {
    var CR = '#f3e9dc', ES = '#2a1c15', CA = '#c47a3a', MU = '#8b7a6c', CR2 = '#e2d3c1';
    var lab = function (t, y, x, c) { return L(t, y, 20, x == null ? 140 : x, 900, { body: 1, weight: 800, color: c || CA, cs: 400 }); };
    D.push({ id: 'cafe', tag: 'Ресторан', name: 'Кофе брэнд — видео', fonts: ['Lora', 'Manrope'], sw: [ES, CA, CR], trans: 'fade', slides: [
      S('Нүүр', function () { return [
        BG(ES), VIDEO(0, 0, W, HH, 'latteart'), SCRIM(0, 0, W, HH, 0, [[0, ES, 0.92], [0.55, ES, 0.45], [1, ES, 0.05]]),
        L('MORNING BREW', 110, 24, 140, 600, { body: 1, weight: 800, color: CR, cs: 400 }),
        A(L('Өглөө бүр\nшинэхэн', 290, 164, 126, 1100, { italic: 1, weight: 500, color: CR, lh: 0.98 }), 'rise', 0.15, 1),
        A(L('Гар аргаар шарсан кофе, өдөр бүр жигнэсэн талх', 700, 32, 140, 900, { body: 1, color: CR2 }), 'fade', 0.5),
        A(pill(140, 810, 360, 64, CA, 'Шинэ салбар нээгдлээ', '#ffffff', 22), 'pop', 0.7)
      ]; }),
      S('Бидний түүх', function () {
        var o = [BG(CR, { fx: GRAIN }), PHOTO(1000, 110, 780, 860, 'barista', { mask: 'rounded', r: 24 }), lab('БИДНИЙ ТҮҮХ', 180),
          L('Жижиг кофе шопоос\nхотын дуртай газар\nболтлоо', 225, 76, 136, 840, { italic: 1, weight: 500, color: ES, lh: 1.08 }),
          L('Бид 2016 онд 20 м² өрөөнөөс эхэлсэн. Өнөөдөр 5 салбар, 40 баристатай ч анхны зарчмаа хадгалсаар — аяга бүрийг анхааралтай бэлтгэнэ.', 560, 26, 140, 800, { body: 1, color: MU, lh: 1.6 }),
          R(140, 780, 800, 1, '#dccbb6', { name: 'Шугам' })];
        [['5', 'салбар'], ['40', 'бариста'], ['1.2K', 'аяга / өдөр']].forEach(function (d, i) {
          var x = 140 + i * 280;
          o.push(L(d[0], 804, 64, x, 260, { weight: 600, color: ES }), L(d[1], 888, 20, x, 260, { body: 1, color: MU }));
        });
        return o;
      }),
      S('Кофе шош', function () {
        var o = [BG(ES), T('КОФЕ ШОШ', 110, 20, { body: 1, weight: 800, color: CA, cs: 400 }), T('Гарал үүсэл', 150, 84, { italic: 1, color: CR }),
          PHOTO(140, 300, 1640, 320, 'beans2', { mask: 'rounded', r: 24 })];
        [['Этиоп', 'Жимслэг, цэцгийн анхилуун үнэртэй, цайвар шаралт', 2], ['Колумб', 'Карамель, шоколадын амттай, тэнцвэртэй', 3], ['Бразил', 'Самар, какаоны амттай, өтгөн', 4]].forEach(function (d, i) {
          var x = 140 + i * 555;
          o.push(A(L(d[0], 670, 44, x, 480, { italic: 1, color: CR }), 'rise', 0.1 + i * 0.1), L(d[1], 736, 22, x, 470, { body: 1, color: '#bfae9e', lh: 1.5 }), L('ХҮЧ', 856, 16, x, 100, { body: 1, weight: 800, color: '#8a7667', cs: 300 }));
          for (var k = 0; k < 5; k++) o.push(C(x + 90 + k * 30, 866, 9, k < d[2] ? CA : '#4a3a31'));
        });
        return o;
      }),
      S('Цэс', function () {
        var o = [BG(CR, { fx: GRAIN }), VIDEO(1240, 200, 560, 560, 'coffee', { mask: 'circle' }), lab('ЦЭС', 110), L('Бидний онцлох', 150, 84, 136, 1000, { italic: 1, color: ES })];
        [['КОФЕ', 140, [['Эспрессо', '4,500₮', 'Давхар шот'], ['Американо', '5,500₮', 'Эспрессо, халуун ус'], ['Капучино', '6,500₮', 'Өтгөн сүүн хөөс'], ['Латте', '7,000₮', 'Зөөлөн, сүүтэй'], ['Флэт уайт', '7,000₮', 'Давхар ристретто']]],
          ['АМТТАН, ЦАЙ', 680, [['Круассан', '5,000₮', 'Цөцгийн тостой'], ['Чизкейк', '8,500₮', 'Нью-Йорк маяг'], ['Матча латте', '7,500₮', 'Японы матча'], ['Чай латте', '7,000₮', 'Амтлагчтай'], ['Нимбэгтэй цай', '5,500₮', 'Зөгийн балтай']]]].forEach(function (c) {
          o.push(L(c[0], 300, 18, c[1], 460, { body: 1, weight: 800, color: CA, cs: 300 }));
          c[2].forEach(function (r, j) {
            var y = 350 + j * 104;
            o.push(L(r[0], y, 32, c[1], 330, { weight: 600, color: ES }), L(r[1], y + 4, 26, c[1], 460, { body: 1, weight: 700, color: CA, align: 'right' }), L(r[2], y + 44, 18, c[1], 380, { body: 1, color: MU }));
          });
        });
        return o;
      }),
      S('Видео — гар аргаар', function () { return [
        BG(ES), VIDEO(0, 0, W, HH, 'drip'), R(0, 0, W, HH, ES, { opacity: 0.5, name: 'Бараан' }),
        A(T('Гар аргаар,\nхайраар бэлтгэнэ', 350, 124, { italic: 1, weight: 500, color: CR, lh: 1.02, w: 1600 }), 'blur', 0.2, 1.2),
        A(T('SPECIALTY COFFEE  ·  2016 ОНООС', 690, 22, { body: 1, weight: 700, color: CR2, cs: 300 }), 'fade', 0.7)
      ]; }),
      S('Салбарууд', function () {
        var o = [BG(CR, { fx: GRAIN }), T('САЛБАРУУД', 110, 20, { body: 1, weight: 800, color: CA, cs: 400 }), T('Танд ойр', 150, 84, { italic: 1, color: ES })];
        [['cafe', 'Төв салбар', 'Сүхбаатар дүүрэг, 1-р хороо', '07:30 — 22:00'], ['cafe2', 'Зайсан', 'Хан-Уул дүүрэг, 11-р хороо', '08:00 — 22:00'], ['latte', 'Их сургуулийн гудамж', 'Сүхбаатар дүүрэг, 8-р хороо', '07:00 — 21:00']].forEach(function (d, i) {
          var x = 140 + i * 555;
          o.push(A(PHOTO(x, 300, 515, 420, d[0], { mask: 'rounded', r: 20 }), 'rise', 0.1 + i * 0.12), L(d[1], 752, 38, x, 515, { italic: 1, color: ES }),
            L(d[2], 810, 22, x, 515, { body: 1, color: MU, lh: 1.5 }), L(d[3], 880, 20, x, 515, { body: 1, weight: 700, color: CA, cs: 100 }));
        });
        return o;
      }),
      S('Холбоо барих', function () {
        var o = [BG(ES), PHOTO(1000, 110, 780, 860, 'beans', { mask: 'rounded', r: 24 }),
          A(L('Уулзъя', 200, 160, 126, 860, { italic: 1, color: CR }), 'rise', 0.1),
          L('Урамшууллын карт — 10 дахь кофе үнэгүй', 420, 30, 140, 800, { body: 1, color: CR2 })];
        [['УТАС', '7700 1616'], ['ИНСТАГРАМ', '@morningbrew.mn'], ['ВЭБ', 'morningbrew.mn']].forEach(function (d, i) {
          var y = 600 + i * 90;
          o.push(L(d[0], y + 8, 18, 140, 240, { body: 1, weight: 800, color: CA, cs: 300 }), L(d[1], y, 32, 380, 560, { italic: 1, color: CR }), R(140, y + 64, 800, 1, '#46342a', { name: 'Шугам' }));
        });
        return o;
      })
    ] });
  })();

  // ================= ХУРИМ — нунтаг ягаан, шалфей =================
  (function () {
    var BL = '#f6ece6', SG = '#7d8f7a', DP = '#3a3330', GD = '#b3925c', MU = '#8a7f78';
    var lab = function (t, y, c) { return T(t, y, 22, { body: 1, weight: 600, color: c || GD, cs: 600, w: 1400 }); };
    D.push({ id: 'wedding', tag: 'Арга хэмжээ', name: 'Хурим — урилга, хөтөлбөр', fonts: ['Cormorant Garamond', 'Raleway'], sw: [BL, SG, GD], trans: 'fade', slides: [
      S('Нүүр', function () { return [
        BG(BL, { fx: GRAIN }), A(PHOTO(710, 90, 500, 620, 'rings', { mask: 'arch' }), 'fade', 0.1, 1.2),
        R(540, 400, 120, 1, GD, { name: 'Шугам' }), R(1260, 400, 120, 1, GD, { name: 'Шугам' }),
        lab('БИД ГЭРЛЭЖ БАЙНА', 760),
        A(T('Анударь & Тэмүүлэн', 800, 100, { italic: 1, weight: 500, color: DP, w: 1700 }), 'fade', 0.4, 1.2),
        T('2026 . 09 . 19   ·   Улаанбаатар', 935, 26, { body: 1, color: MU, cs: 200 })
      ]; }),
      S('Бидний түүх', function () { return [
        BG(BL, { fx: GRAIN }), PHOTO(140, 120, 720, 840, 'tulips', { mask: 'rounded', r: 24 }),
        L('БИДНИЙ ТҮҮХ', 210, 20, 980, 700, { body: 1, weight: 600, color: GD, cs: 500 }),
        L('Нэгэн намрын\nөдөр эхэлсэн', 255, 92, 976, 820, { italic: 1, weight: 500, color: DP, lh: 1.02 }),
        L('Бид 2019 онд их сургуулийн номын санд анх танилцсан. Долоон жилийн дараа амьдралаа холбож, хамгийн дотны хүмүүстэйгээ энэ баярыг хуваалцахыг хүсэж байна.', 500, 26, 980, 780, { body: 1, color: MU, lh: 1.7 }),
        L('— А. & Т.', 790, 44, 980, 600, { italic: 1, color: DP })
      ]; }),
      S('Хөтөлбөр', function () {
        var o = [BG(SG), lab('ӨДРИЙН ХӨТӨЛБӨР', 120, '#f3eee6'), T('Баярын өдөр', 160, 100, { italic: 1, weight: 500, color: '#ffffff' }),
          R(240, 620, 1440, 1.5, '#ffffff', { opacity: 0.5, name: 'Шугам' })];
        [['16:00', 'Угтах', 'Зочдыг ундаагаар угтана'], ['17:00', 'Гэрлэх ёслол', 'Гэрлэлтийн баталгаа гардуулна'], ['18:30', 'Оройн зоог', 'Баярын хүлээн авалт'], ['20:00', 'Бүжиг', 'Амьд хөгжим, DJ']].forEach(function (d, i) {
          var x = 240 + i * 480;
          o.push(A(C(x, 621, 13, '#ffffff'), 'pop', 0.15 + i * 0.15), A(T(d[0], 480, 68, { x: x - 200, w: 400, weight: 500, color: '#ffffff' }), 'rise', 0.15 + i * 0.15),
            A(T(d[1], 676, 42, { x: x - 200, w: 400, italic: 1, color: '#ffffff' }), 'rise', 0.15 + i * 0.15), A(T(d[2], 744, 24, { x: x - 180, w: 360, body: 1, color: '#e6ebe4', lh: 1.5 }), 'rise', 0.15 + i * 0.15));
        });
        return o;
      }),
      S('Байршил', function () { return [
        BG(BL, { fx: GRAIN }), PHOTO(0, 0, 960, HH, 'lobby'),
        L('БАЙРШИЛ', 220, 20, 1080, 700, { body: 1, weight: 600, color: GD, cs: 500 }),
        L('Гранд\nхүлээн авалтын\nтанхим', 265, 88, 1076, 760, { italic: 1, weight: 500, color: DP, lh: 1.0 }),
        L('Сүхбаатар дүүрэг, 1-р хороо\nУлаанбаатар хот', 610, 26, 1080, 700, { body: 1, color: MU, lh: 1.6 }),
        R(1080, 730, 700, 1, '#e3d3c8', { name: 'Шугам' }),
        L('ЗОГСООЛ', 760, 18, 1080, 300, { body: 1, weight: 600, color: GD, cs: 400 }), L('Газар доорх зогсоол үнэгүй', 792, 24, 1080, 700, { body: 1, color: DP }),
        L('ЭХЛЭХ ЦАГ', 860, 18, 1080, 300, { body: 1, weight: 600, color: GD, cs: 400 }), L('16:00 — зочдыг угтаж эхэлнэ', 892, 24, 1080, 700, { body: 1, color: DP })
      ]; }),
      S('Хувцаслалт', function () {
        var o = [BG(BL, { fx: GRAIN }), lab('ХУВЦАСЛАЛТ', 150), T('Өнгөний сонголт', 190, 100, { italic: 1, weight: 500, color: DP })];
        [['#e8cfc4', 'Нунтаг ягаан'], ['#c9a99b', 'Шаргал'], ['#9aa894', 'Шалфей ногоон'], ['#f3e6d4', 'Цөцгий'], ['#b3925c', 'Алтан']].forEach(function (d, i) {
          var cx = 960 + (i - 2) * 230;
          o.push(A(C(cx, 540, 90, d[0], { stroke: '#e3d3c8', sw: 1.5 }), 'pop', 0.08 * i), T(d[1], 660, 24, { x: cx - 115, w: 230, body: 1, color: MU }));
        });
        o.push(T('Эрэгтэй: хар, бор костюм   ·   Эмэгтэй: пастел өнгийн урт даашинз', 800, 26, { body: 1, color: DP, w: 1600 }));
        return o;
      }),
      S('Дурсамж', function () { return [
        BG(BL, { fx: GRAIN }), T('Бидний дурсамж', 110, 88, { italic: 1, weight: 500, color: DP }),
        A(PHOTO(140, 270, 620, 700, 'sparkler', { mask: 'rounded', r: 16 }), 'fade', 0.1), A(PHOTO(790, 270, 500, 330, 'cake', { mask: 'rounded', r: 16 }), 'fade', 0.25),
        A(PHOTO(790, 640, 500, 330, 'tulips2', { mask: 'rounded', r: 16 }), 'fade', 0.4), A(PHOTO(1320, 270, 460, 700, 'party', { mask: 'rounded', r: 16 }), 'fade', 0.55)
      ]; }),
      S('Баярлалаа', function () { return [
        BG(SG), A(T('Баярлалаа', 300, 210, { italic: 1, weight: 500, color: '#ffffff' }), 'fade', 0.1, 1.2),
        T('Ирэх эсэхээ 2026.09.01-ний дотор мэдэгдэнэ үү', 600, 28, { body: 1, color: '#f3eee6', w: 1400 }),
        pill(760, 690, 400, 64, '#ffffff', 'RSVP  ·  9911 2233', SG, 22, { cs: 100 })
      ]; })
    ] });
  })();

  // ================= ПОРТФОЛИО — цайвар, цэнхэр =================
  (function () {
    var OFF = '#f2f1ec', BLK = '#0e0e0e', BLUE = '#2a45ff', MU = '#6b6b6b', LN = '#d9d7cf';
    var lab = function (t, y, c) { return L(t, y, 20, 140, 900, { body: 1, color: c || BLUE }); };
    D.push({ id: 'portfolio', tag: 'Креатив', name: 'Дизайнерийн портфолио', fonts: ['Inter Tight', 'JetBrains Mono'], sw: [OFF, BLK, BLUE], trans: 'slide', slides: [
      S('Нүүр', function () { return [
        BG(OFF), A(C(1560, 330, 170, BLUE), 'pop', 0.3), T('2026', 294, 60, { x: 1410, w: 300, weight: 800, color: '#ffffff' }),
        A(L('Порт—\nфолио', 170, 250, 122, 1500, { weight: 800, color: BLK, lh: 0.86, cs: -50 }), 'rise', 0.1, 0.8),
        R(140, 780, 1640, 1.5, BLK, { name: 'Шугам' }),
        L('Номин-Эрдэнэ Сүх', 810, 36, 140, 800, { weight: 700, color: BLK }), L('ГРАФИК ДИЗАЙНЕР / БРЭНДИНГ / UI', 822, 20, 980, 800, { body: 1, color: MU, align: 'right' }),
        L('behance.net/nomin', 872, 20, 140, 800, { body: 1, color: MU })
      ]; }),
      S('Миний тухай', function () {
        var o = [BG(OFF), PHOTO(140, 120, 600, 840, 'woman', { mask: 'rounded', r: 24 }), L('01 / ТУХАЙ', 170, 20, 860, 600, { body: 1, color: BLUE }),
          L('Санааг\nхарагдахуйц болгодог', 220, 84, 856, 940, { weight: 800, color: BLK, lh: 1.0, cs: -20 }),
          L('8 жилийн туршлагатай график дизайнер. Брэнд танигдахуйц байдал, сав баглаа боодол, дижитал бүтээгдэхүүний дизайн хийдэг. 60 гаруй брэндтэй хамтран ажилласан.', 470, 27, 860, 880, { weight: 400, color: '#3a3a3a', lh: 1.55 })];
        var x = 860;
        ['Брэндинг', 'Лого', 'Сав баглаа', 'UI / UX', 'Моушн'].forEach(function (t) { var w = 44 + t.length * 13; o.push(pill(x, 690, w, 52, 'rgba(0,0,0,0)', t, BLK, 19, { stroke: BLK, sw: 1.5, weight: 500 })); x += w + 14; });
        o.push(L('Figma · Illustrator · Photoshop · After Effects', 790, 20, 860, 900, { body: 1, color: MU }));
        return o;
      }),
      S('Сонгосон ажлууд', function () {
        var o = [BG(OFF), lab('02 / АЖЛУУД', 110), L('Сонгосон төслүүд', 150, 84, 136, 1400, { weight: 800, color: BLK, cs: -20 })];
        [['sneaker', 'Брэндинг', 'Stride гутал'], ['serum', 'Сав баглаа', 'Glow серум'], ['living2', 'Интерьер', 'Nomad Home'], ['model', 'Кампанит ажил', 'Ноолуур SS26']].forEach(function (d, i) {
          var x = 140 + i * 415;
          o.push(A(PHOTO(x, 310, 385, 520, d[0], { mask: 'rounded', r: 16 }), 'rise', 0.08 * i), L('0' + (i + 1) + ' / ' + d[1], 862, 18, x, 385, { body: 1, color: MU }), L(d[2], 898, 32, x, 385, { weight: 700, color: BLK }));
        });
        return o;
      }),
      S('Кейс', function () {
        var o = [BG(BLK), PHOTO(0, 0, 1000, HH, 'serum'), L('03 / КЕЙС', 150, 20, 1100, 600, { body: 1, color: '#8ea0ff' }),
          L('Glow серум —\nбрэнд шинэчлэл', 192, 72, 1096, 720, { weight: 800, color: '#ffffff', lh: 1.02 })];
        [['СОРИЛТ', 'Залуу хэрэглэгчдэд танигдахуйц бус, хуучирсан дүр төрх'], ['ШИЙДЭЛ', 'Шинэ лого, минимал сав баглаа, зөөлөн өнгөний систем'], ['ҮР ДҮН', 'Борлуулалт 3 сарын дотор 2.4 дахин өссөн']].forEach(function (d, i) {
          var y = 430 + i * 165;
          o.push(L(d[0], y, 18, 1100, 680, { body: 1, color: '#8ea0ff' }), A(L(d[1], y + 34, 28, 1100, 680, { weight: 400, color: '#e5e5e5', lh: 1.45 }), 'rise', 0.15 + i * 0.12));
        });
        return o;
      }),
      S('Үйл явц', function () {
        var o = [BG(OFF), lab('04 / ҮЙЛ ЯВЦ', 110), L('Ажлын үйл явц', 150, 84, 136, 1400, { weight: 800, color: BLK, cs: -20 })];
        [['Судалгаа', 'Брэнд, зах зээл, хэрэглэгчийг ойлгох'], ['Санаа', 'Мудборд, эскиз, чиглэл сонгох'], ['Дизайн', 'Лого, өнгө, фонт, хэрэглээ'], ['Хүлээлгэх', 'Брэндбүүк, бүх файл, дэмжлэг']].forEach(function (d, i) {
          var x = 140 + i * 415;
          o.push(A(L('0' + (i + 1), 420, 150, x, 385, { weight: 800, color: i === 3 ? BLUE : BLK, cs: -40 }), 'rise', 0.1 * i), R(x, 620, 385, 2, BLK, { name: 'Шугам' }),
            L(d[0], 660, 40, x, 360, { weight: 700, color: BLK }), L(d[1], 720, 24, x, 350, { weight: 400, color: MU, lh: 1.5 }));
        });
        return o;
      }),
      S('Үйлчлүүлэгчид', function () {
        var o = [BG(OFF), lab('05 / ҮЙЛЧЛҮҮЛЭГЧИД', 110), L('Хамтран ажилласан брэндүүд', 150, 72, 136, 1600, { weight: 800, color: BLK, cs: -20 })];
        for (var i = 0; i < 8; i++) { var x = 140 + (i % 4) * 415, y = 300 + Math.floor(i / 4) * 170; o.push(R(x, y, 385, 140, '#e8e6de', { rx: 16, name: 'Лого' }), T('ЛОГО ' + (i + 1), y + 54, 22, { x: x, w: 385, body: 1, color: '#a3a19a' })); }
        o.push(L('“Номин-Эрдэнэ манай брэндийг шинэ түвшинд гаргасан. Санаа, хурд, нарийвчлал — бүгд төгс.”', 700, 42, 140, 1400, { weight: 600, color: BLK, lh: 1.3 }),
          L('— Г. Мөнх-Оргил, Stride гутлын үүсгэн байгуулагч', 856, 20, 140, 1200, { body: 1, color: MU }));
        return o;
      }),
      S('Холбоо барих', function () { return [
        BG(BLUE), A(L('Хамтран\nажиллая', 190, 220, 122, 1600, { weight: 800, color: '#ffffff', lh: 0.88, cs: -40 }), 'rise', 0.1, 0.8),
        R(140, 760, 1640, 1.5, '#ffffff', { opacity: 0.4, name: 'Шугам' }),
        L('hello@nomin.design', 796, 46, 140, 900, { weight: 700, color: '#ffffff' }), L('+976 9900 1122  /  behance.net/nomin', 814, 20, 980, 800, { body: 1, color: '#dfe3ff', align: 'right' })
      ]; })
    ] });
  })();

  // ================= ЭМНЭЛЭГ, КЛИНИК — цагаан, ногоон цэнхэр =================
  (function () {
    var WH = '#ffffff', TEAL = '#0f766e', LT = '#e8f5f2', NAVY = '#0b2b3c', MU = '#5b6b75';
    var lab = function (t, y, c) { return L(t, y, 22, 140, 900, { weight: 800, color: c || TEAL, cs: 200 }); };
    D.push({ id: 'clinic', tag: 'Эрүүл мэнд', name: 'Эмнэлэг, клиник', fonts: ['Manrope', 'Inter'], sw: [LT, TEAL, NAVY], trans: 'fade', slides: [
      S('Нүүр', function () { return [
        BG(LT), PHOTO(980, 0, 940, HH, 'doctor', { fy: 0.3 }),
        A(R(880, 780, 450, 160, WH, { rx: 24, shadow: { c: 'rgba(11,43,60,0.18)', b: 40, y: 14 }, name: 'Карт' }), 'pop', 0.5),
        A(C(950, 860, 34, LT), 'pop', 0.5), A(T('★', 838, 34, { x: 916, w: 68, weight: 800, color: TEAL }), 'pop', 0.5),
        A(L('4.9 үнэлгээ', 812, 34, 1004, 310, { weight: 800, color: NAVY }), 'pop', 0.5), A(L('12,000+ үйлчлүүлэгч', 864, 22, 1004, 310, { body: 1, color: MU }), 'pop', 0.5),
        lab('ЭНХ-АМГАЛАН КЛИНИК', 150),
        A(L('Таны эрүүл\nмэндийн түнш', 240, 112, 134, 840, { weight: 800, color: NAVY, lh: 1.02, cs: -20 }), 'rise', 0.1),
        L('Олон улсын стандартад нийцсэн оношилгоо, эмчилгээ — нэг дороос.', 540, 30, 140, 740, { body: 1, color: MU, lh: 1.5 }),
        pill(140, 710, 420, 72, TEAL, 'Цаг захиалах: 7011 0000', '#ffffff', 24)
      ]; }),
      S('Бидний тухай', function () {
        var o = [BG(WH), lab('БИДНИЙ ТУХАЙ', 140), L('15 жилийн туршлага,\nмянга мянган инээмсэглэл', 186, 72, 136, 1500, { weight: 800, color: NAVY, lh: 1.1 })];
        [['15+', 'жилийн туршлага'], ['40', 'мэргэжлийн эмч'], ['12K', 'жилд үйлчлүүлэгч'], ['24/7', 'яаралтай тусламж']].forEach(function (d, i) {
          var x = 140 + i * 415;
          o.push(A(R(x, 440, 385, 340, LT, { rx: 24, name: 'Карт' }), 'rise', 0.08 * i), L(d[0], 500, 96, x + 36, 320, { weight: 800, color: TEAL }), L(d[1], 640, 26, x + 36, 320, { body: 1, color: NAVY, lh: 1.4 }));
        });
        o.push(L('Бид үйлчлүүлэгч бүрт анхааралтай хандаж, орчин үеийн тоног төхөөрөмжөөр үнэн зөв оношилгоо хийдэг. Эмч нар маань олон улсад мэргэшсэн.', 860, 26, 140, 1500, { body: 1, color: MU, lh: 1.6 }));
        return o;
      }),
      S('Үйлчилгээ', function () {
        var o = [BG(LT), lab('ҮЙЛЧИЛГЭЭ', 110), L('Бидний үйлчилгээ', 150, 80, 136, 1400, { weight: 800, color: NAVY })];
        [['Дотрын эмч', 'Урьдчилан сэргийлэх үзлэг, зөвлөгөө'], ['Шүдний эмнэлэг', 'Цэвэрлэгээ, ломбо, гажиг засал'], ['Хүүхдийн эмч', '0–16 насны хүүхдийн үзлэг'],
          ['Лаборатори', 'Цус, шээсний 120 төрлийн шинжилгээ'], ['Хэт авиан оношилгоо', '4D хэт авиа, зүрхний бичлэг'], ['Арьс, гоо засал', 'Арьсны эмчилгээ, гоо засал']].forEach(function (d, i) {
          var x = 140 + (i % 3) * 555, y = 300 + Math.floor(i / 3) * 330;
          o.push(A(R(x, y, 515, 300, WH, { rx: 24, name: 'Карт' }), 'rise', 0.06 * i), C(x + 66, y + 70, 32, LT), T('0' + (i + 1), y + 54, 26, { x: x + 34, w: 64, weight: 800, color: TEAL }),
            L(d[0], y + 130, 34, x + 36, 440, { weight: 800, color: NAVY }), L(d[1], y + 184, 22, x + 36, 440, { body: 1, color: MU, lh: 1.5 }));
        });
        return o;
      }),
      S('Эмч нар', function () {
        var o = [BG(WH), lab('ЭМЧ НАР', 110), L('Манай эмч нар', 150, 80, 136, 1400, { weight: 800, color: NAVY })];
        [['doctor', 'Д. Сарангэрэл', 'Дотрын эмч · 18 жил', 'Анагаахын ухааны доктор'], ['dentist', 'Б. Батсүх', 'Шүдний эмч · 12 жил', 'Гажиг заслын мэргэжилтэн'], [null, 'Э. Уянга', 'Хүүхдийн эмч · 10 жил', 'Нярайн эмчийн мэргэшил']].forEach(function (d, i) {
          var x = 140 + i * 555;
          o.push(A(R(x, 300, 515, 640, LT, { rx: 24, name: 'Карт' }), 'rise', 0.1 * i));
          if (d[0]) o.push(PHOTO(x + 147, 350, 220, 220, d[0], { mask: 'circle' }));
          else o.push(C(x + 257, 460, 110, TEAL), T('ЭУ', 420, 72, { x: x, w: 515, weight: 800, color: '#ffffff' }));
          o.push(T(d[1], 620, 36, { x: x, w: 515, weight: 800, color: NAVY }), T(d[2], 676, 22, { x: x, w: 515, body: 1, weight: 600, color: TEAL }), T(d[3], 724, 20, { x: x + 40, w: 435, body: 1, color: MU }),
            pill(x + 137, 820, 240, 54, WH, 'Цаг авах', TEAL, 20));
        });
        return o;
      }),
      S('4 алхам', function () {
        var o = [BG(NAVY), lab('ҮЙЛ ЯВЦ', 130, '#5eead4'), L('Үйлчилгээ авах 4 алхам', 176, 80, 136, 1500, { weight: 800, color: '#ffffff' }), R(190, 540, 1245, 2, '#1e4a5e', { name: 'Шугам' })];
        [['Цаг захиалах', 'Утсаар эсвэл онлайнаар'], ['Үзлэг', 'Эмчтэй уулзаж зөвлөгөө авах'], ['Оношилгоо', 'Шинжилгээ, хэт авиа'], ['Эмчилгээ', 'Танд тохирсон төлөвлөгөө']].forEach(function (d, i) {
          var x = 140 + i * 415;
          o.push(A(C(x + 50, 540, 56, TEAL), 'pop', 0.15 + i * 0.15), A(T(String(i + 1), 514, 44, { x: x, w: 100, weight: 800, color: '#ffffff' }), 'pop', 0.15 + i * 0.15),
            L(d[0], 650, 38, x, 360, { weight: 800, color: '#ffffff' }), L(d[1], 708, 24, x, 350, { body: 1, color: '#a9c1cc', lh: 1.5 }));
        });
        return o;
      }),
      S('Үнийн мэдээлэл', function () {
        var o = [BG(WH), lab('ҮНЭ', 110), L('Үнийн мэдээлэл', 150, 80, 136, 1400, { weight: 800, color: NAVY })];
        [['Эмчийн үзлэг, зөвлөгөө', '₮35,000'], ['Цусны ерөнхий шинжилгээ', '₮18,000'], ['Хэт авиан шинжилгээ', '₮45,000'], ['Шүдний цэвэрлэгээ', '₮80,000'], ['Хүүхдийн үзлэг', '₮30,000'], ['Урьдчилан сэргийлэх бүрэн багц', '₮290,000']].forEach(function (d, i) {
          var y = 310 + i * 96;
          o.push(L(d[0], y, 30, 140, 1000, { body: 1, color: NAVY }), L(d[1], y - 2, 32, 1180, 600, { weight: 800, color: TEAL, align: 'right' }), R(140, y + 64, 1640, 1, '#e2e8ea', { name: 'Шугам' }));
        });
        o.push(L('* Эрүүл мэндийн даатгалтай иргэдэд 10% хөнгөлөлт', 930, 22, 140, 1400, { body: 1, color: MU }));
        return o;
      }),
      S('Холбоо барих', function () {
        var o = [BG(TEAL), A(L('Эрүүл мэндээ\nөнөөдрөөс', 190, 112, 134, 900, { weight: 800, color: '#ffffff', lh: 1.02 }), 'rise', 0.1),
          L('Цаг захиалга, зөвлөгөө — 7011 0000', 500, 34, 140, 860, { body: 1, color: '#d7f0ea' }),
          A(R(1060, 150, 720, 780, WH, { rx: 28, name: 'Карт' }), 'rise', 0.25), L('ЦАГИЙН ХУВААРЬ', 210, 20, 1120, 600, { weight: 800, color: TEAL, cs: 200 })];
        [['Даваа — Баасан', '08:00 — 20:00'], ['Бямба', '09:00 — 18:00'], ['Ням', '10:00 — 16:00'], ['Яаралтай', '24 / 7']].forEach(function (d, i) {
          var y = 270 + i * 80;
          o.push(L(d[0], y, 26, 1120, 360, { body: 1, color: NAVY }), L(d[1], y, 26, 1120, 600, { weight: 800, color: NAVY, align: 'right' }), R(1120, y + 52, 600, 1, '#e2e8ea', { name: 'Шугам' }));
        });
        o.push(L('ХАЯГ', 640, 20, 1120, 600, { weight: 800, color: TEAL, cs: 200 }), L('Баянзүрх дүүрэг, 26-р хороо\nЭнх-Амгалан төв, 1 давхар', 680, 26, 1120, 600, { body: 1, color: NAVY, lh: 1.5 }),
          L('enkhamgalan.mn', 820, 26, 1120, 600, { weight: 800, color: TEAL }));
        return o;
      })
    ] });
  })();

  G.moreDecks = D;
})();
