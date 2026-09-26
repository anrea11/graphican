/* Graphican — Монгол сошиал загварууд. Shared by the editor (/editor/?tpl=<id>) and the gallery (/tools/templates/).
   Each template: size, two Mongolian-ready fonts (Ө Ү checked) and a list of specs → fabric objects.
   Spec extras: grad (gradient paint), fx (effects: noise, drop, blur…), shadow, angle (text rotates about its centre),
   'bg' (full-bleed background layer), 'blob' (soft glow), 'ph' (image placeholder). */
(function () {
  'use strict';
  var CATS = { holiday: 'Баяр ёслол', biz: 'Бизнес, хямдрал', event: 'Арга хэмжээ', social: 'Сошиал контент', other: 'Бусад хэмжээ' };

  // ---------- spec helpers ----------
  function T(text, y, size, o) { o = o || {}; o.t = 'text'; o.text = text; o.y = y; o.size = size; return o; }
  function R(x, y, w, h, fill, o) { o = o || {}; o.t = 'rect'; o.x = x; o.y = y; o.w = w; o.h = h; o.fill = fill; return o; }
  function C(cx, cy, r, fill, o) { o = o || {}; o.t = 'circle'; o.cx = cx; o.cy = cy; o.r = r; o.fill = fill; return o; }
  function BLOB(cx, cy, r, c, a) { return { t: 'blob', cx: cx, cy: cy, r: r, c: c, a: a == null ? 0.85 : a }; }
  function BG(fill, o) { o = o || {}; o.t = 'bg'; o.fill = fill; return o; }
  function PH(x, y, w, h, label, o) { o = o || {}; o.t = 'ph'; o.x = x; o.y = y; o.w = w; o.h = h; o.label = label; return o; }
  function STAR(cx, cy, r, fill, o) { o = o || {}; o.t = 'star'; o.cx = cx; o.cy = cy; o.r = r; o.fill = fill; return o; }
  function SPARK(cx, cy, r, fill) { return { t: 'spark', cx: cx, cy: cy, r: r, fill: fill }; }
  // free photos (Pexels licence — free for commercial use); loaded through our CORS proxy so exports work
  var PX = {
    ger: [28598666, 'Sergio Zhukov'], gobi: [4326314, 'ArtHouse Studio'], rider: [4321510, 'ArtHouse Studio'], eagle: [5275479, 'Julia Volk'],
    latte: [414605, 'Pixabay'], burger: [3220617, 'David Geib'], burger2: [70497, 'Robin Stickel'], pizza: [803290, 'Beqa Tefnadze'], pizza2: [315755, 'Pixabay'],
    model: [13381636, 'Faza Zeed'], woman: [1639589, 'Pragyan Bezbaruah'], woman2: [247350, 'Pixabay'],
    tulips: [9008503, 'solod_sha'], tulips2: [54186, 'Pixabay', 'tulips-flowers-tulip-bouquet-violet-54186.jpeg'],
    living: [4857757, 'Rachel Claire'], living2: [6970077, 'Max Vakhtbovych'], house: [323776, 'Expect Best'], house2: [2079234, 'Emre Can Acer'],
    sneaker: [2529148, 'Melvin Buezo'], serum: [5797999, 'Ann poan'], oil: [4465830, 'Karola G'], gym: [116078, 'Binyamin Mellish'], gym2: [13211582, 'Instituto Alpha Fitness'],
    concert: [1105666, 'Vishnu R Nair'], concert2: [1387174, 'Wendy Wei'], team: [3182804, 'fauxels'], snow: [1366919, 'Eberhard Grossgasteiger'],
    cake: [851204, 'Mohammad Danish'], party: [6148507, 'Antoni Shkraba'], sparkler: [1591293, 'Sonam Yadav'], rings: [916344, 'Irina Iriser'],
    car: [5880077, 'Erik Mclean'], dentist: [3845748, 'Anna Shvets'], doctor: [8376309, 'Tima Miroshnichenko'], kids: [30709005, 'Isaac Naph'],
    student: [4861373, 'cottonbro studio'], study: [6929268, 'Polina Tankilevitch'], knit: [3614132, 'Castorly Stock'], city: [68902, 'burak kostak'],
    barista: [29120540, 'DARKMODE CINEMA'], salon: [3993312, 'cottonbro studio'], plane: [3770090, 'Sterry Larson'], suitcase: [9186152, 'Timur Weber']
  };
  function pxUrl(k, w) {
    var p = PX[k]; if (!p) return '';
    var u = 'https://images.pexels.com/photos/' + p[0] + '/' + (p[2] || 'pexels-photo-' + p[0] + '.jpeg') + '?auto=compress&cs=tinysrgb&w=' + (w || 1600);
    return '/api/stock/file?u=' + encodeURIComponent(u);
  }
  // PHOTO(x, y, w, h, key, {fx, fy: focal point 0..1, mask: 'circle'|'rounded'|'arch'|'oval', r: corner radius, angle, opacity})
  function PHOTO(x, y, w, h, key, o) { o = o || {}; o.t = 'photo'; o.x = x; o.y = y; o.w = w; o.h = h; o.key = key; return o; }
  function SCRIM(x, y, w, h, angle, stops, o) { o = o || {}; o.grad = lin(angle, stops); return R(x, y, w, h, '#000000', Object.assign({ name: 'Сүүдэр' }, o)); }
  function lin(angle, stops) { return { type: 'linear', angle: angle, stops: stops.map(function (s) { return { p: s[0], c: s[1], a: s[2] == null ? 1 : s[2] }; }) }; }
  function rad(stops, r) { return { type: 'radial', r: r || 0.5, stops: stops.map(function (s) { return { p: s[0], c: s[1], a: s[2] == null ? 1 : s[2] }; }) }; }
  var GRAIN = [{ t: 'noise', a: 0.1, mono: true }];
  var GRAIN2 = [{ t: 'noise', a: 0.18, mono: true }];
  function pill(x, y, w, h, fill, text, color, size, o) {
    o = o || {};
    return [R(x, y, w, h, fill, { rx: h / 2, stroke: o.stroke, sw: o.sw, name: 'Шошго' }),
      T(text, y + (h - size * 1.15) / 2 + 1, size, { x: x, w: w, color: color, weight: o.weight || 700, body: o.body !== false, cs: o.cs || 0 })];
  }

  var LIST = [
    // ===================== БАЯР ЁСЛОЛ =====================
    { id: 'tsagaansar', name: 'Цагаан сар — хаан хөх', cat: 'holiday', w: 1080, h: 1350, fonts: ['Playfair', 'Montserrat'], sw: ['#0a1f55', '#e8c26a', '#f7ecd0'],
      items: function () {
        var o = [BG('#0a1f55', { grad: rad([[0, '#1d3f95'], [1, '#07143a']], 0.75), fx: GRAIN }),
          R(44, 44, 992, 1262, 'transparent', { stroke: '#e8c26a', sw: 2, name: 'Хүрээ' }), R(60, 60, 960, 1230, 'transparent', { stroke: '#e8c26a', sw: 1, opacity: 0.45, name: 'Хүрээ' })];
        // lattice ornament (өлзий хээ шиг)
        [[540, 250, 0], [490, 250, 0], [590, 250, 0], [540, 200, 0], [540, 300, 0]].forEach(function (p) {
          o.push(R(p[0], p[1], 64, 64, 'transparent', { c: 1, angle: 45, stroke: '#e8c26a', sw: 3, name: 'Хээ' }));
        });
        o.push(C(540, 250, 9, '#e8c26a', { name: 'Хээ' }));
        o.push(T('ЦАГААН САР · 2027', 400, 26, { body: 1, weight: 600, color: '#e8c26a', cs: 600 }));
        o.push(T('Сар шинэдээ\nсайхан шинэлж\nбайна уу', 470, 104, { weight: 500, italic: 1, lh: 1.02, w: 960, grad: lin(90, [[0, '#fff3d2'], [1, '#e2b458']]) }));
        o.push(R(500, 870, 80, 2, '#e8c26a', { name: 'Шугам' }));
        o.push(T('Эрүүл энх, сайн сайхныг хүсье', 905, 34, { body: 1, weight: 400, color: '#d8c9a3', w: 840 }));
        o.push(T('БАЙГУУЛЛАГЫН НЭР', 1180, 24, { body: 1, weight: 700, color: '#e8c26a', cs: 500 }));
        return o;
      } },
    { id: 'tsagaansar2', name: 'Цагаан сар — минимал', cat: 'holiday', w: 1080, h: 1080, fonts: ['Noto Serif Display', 'Inter'], sw: ['#f4eee3', '#c8102e', '#1b1b1b'],
      items: function () { return [
        BG('#f4eee3', { fx: GRAIN }),
        C(540, 380, 230, '#c8102e', { name: 'Нар' }),
        R(60, 60, 960, 960, 'transparent', { stroke: '#1b1b1b', sw: 1.5, opacity: 0.35, name: 'Хүрээ' }),
        T('САР ШИНЭ', 90, 22, { body: 1, weight: 600, color: '#1b1b1b', cs: 800, x: 90, w: 400, align: 'left' }),
        T('2027', 90, 22, { body: 1, weight: 600, color: '#1b1b1b', cs: 400, x: 590, w: 400, align: 'right' }),
        T('Сар шинэдээ\nсайхан шинэлээрэй', 665, 84, { weight: 700, color: '#1b1b1b', lh: 1.02, w: 940 }),
        T('Танай гэр бүлд аз жаргал, амар амгаланг хүсье', 885, 28, { body: 1, color: '#5a5550', w: 800 }),
        T('Байгууллагын нэр', 950, 22, { body: 1, weight: 700, color: '#c8102e' })
      ]; } },
    { id: 'naadam', name: 'Наадам — bold', cat: 'holiday', w: 1080, h: 1350, fonts: ['Fira Sans Extra Condensed', 'Inter'], sw: ['#d7263d', '#ffffff', '#0e2a6b'],
      items: function () { return [
        BG('#d7263d', { fx: GRAIN }),
        T('ҮНДЭСНИЙ ИХ БАЯР · 2026', 70, 28, { body: 1, weight: 700, color: '#ffffff', cs: 400 }),
        T('НААДАМ', 165, 300, { weight: 900, color: 'transparent', stroke: '#ffffff', sw: 3, lh: 0.84, w: 1040 }),
        T('НААДАМ', 420, 300, { weight: 900, color: '#ffffff', lh: 0.84, w: 1040 }),
        T('НААДАМ', 675, 300, { weight: 900, color: 'transparent', stroke: '#ffffff', sw: 3, lh: 0.84, w: 1040 }),
        R(0, 1030, 1080, 320, '#0e2a6b', { name: 'Тууз' }),
        T('БӨХ', 1085, 64, { weight: 800, color: '#ffffff', x: 60, w: 300 }),
        T('СУР', 1085, 64, { weight: 800, color: '#ffffff', x: 390, w: 300 }),
        T('МОРЬ', 1085, 64, { weight: 800, color: '#ffffff', x: 720, w: 300 }),
        R(359, 1090, 2, 60, '#ffffff', { opacity: 0.4, name: 'Шугам' }), R(719, 1090, 2, 60, '#ffffff', { opacity: 0.4, name: 'Шугам' }),
        T('Эрийн гурван наадмын баярын мэнд хүргэе!', 1200, 32, { body: 1, weight: 500, color: '#c9d6ff', w: 960 }),
        T('БАЙГУУЛЛАГЫН НЭР', 1262, 22, { body: 1, weight: 700, color: '#ffffff', cs: 400 })
      ]; } },
    { id: 'naadam2', name: 'Наадам — story', cat: 'holiday', w: 1080, h: 1920, fonts: ['Inter Tight', 'Inter'], sw: ['#1d5bd6', '#ffd23f', '#ffffff'],
      items: function () { return [
        BG('#1d5bd6', { grad: lin(90, [[0, '#6fb6ff'], [0.55, '#1d5bd6'], [1, '#0a2a7a']]), fx: GRAIN }),
        C(540, 640, 300, '#ffd23f', { grad: rad([[0, '#fff2a8'], [0.7, '#ffd23f'], [1, '#ffb400']], 0.5), name: 'Нар' }),
        BLOB(540, 640, 520, '#ffd23f', 0.35),
        T('7.11 — 7.13', 200, 44, { body: 1, weight: 700, color: '#ffffff', cs: 300 }),
        T('ИХ\nНААДАМ', 1030, 200, { weight: 900, color: '#ffffff', lh: 0.88, w: 1000, shadow: { c: 'rgba(8,24,80,.35)', b: 40, y: 12 } }),
        T('Эрийн гурван наадмын баярын мэнд хүргэе!', 1500, 44, { body: 1, weight: 600, color: '#ffffff', w: 860, lh: 1.3 }),
        pill(390, 1700, 300, 72, '#ffffff', 'БАЙГУУЛЛАГА', '#1d5bd6', 26, { cs: 200 })
      ].reduce(function (a, b) { return a.concat(b); }, []); } },
    { id: 'newyear', name: 'Шинэ он — aurora', cat: 'holiday', w: 1080, h: 1350, fonts: ['Inter Tight', 'Playfair'], sw: ['#0b0c2a', '#c7a8ff', '#ffffff'],
      items: function () { return [
        BG('#0b0c2a', { fx: GRAIN2 }),
        BLOB(250, 300, 520, '#7b4dff', 0.8), BLOB(860, 520, 480, '#ff4fa3', 0.6), BLOB(560, 1150, 560, '#2bd4ff', 0.45),
        SPARK(180, 170, 22, '#ffffff'), SPARK(900, 230, 14, '#ffffff'), SPARK(820, 980, 18, '#ffffff'), SPARK(150, 1040, 12, '#ffffff'),
        T('ШИНЭ ОНЫ МЭНД', 250, 30, { weight: 700, color: '#ffffff', cs: 700 }),
        T('2027', 350, 400, { weight: 900, lh: 0.9, w: 1060, grad: lin(90, [[0, '#ffffff'], [1, '#c7a8ff']]) }),
        T('Шинэ онд шинэ амжилт,\nшинэ аз жаргал хүсье', 790, 60, { body: 1, italic: 1, weight: 500, color: '#ffffff', lh: 1.2, w: 940 }),
        R(480, 1010, 120, 1.5, '#ffffff', { opacity: 0.6, name: 'Шугам' }),
        T('БАЙГУУЛЛАГЫН НЭР', 1180, 24, { weight: 700, color: '#ffffff', cs: 500 })
      ]; } },
    { id: 'march8', name: '3-р сарын 8', cat: 'holiday', w: 1080, h: 1350, fonts: ['Cormorant Garamond', 'Inter'], sw: ['#f6e3e4', '#b8325a', '#3a1422'],
      items: function () { return [
        BG('#f6e3e4', { fx: GRAIN }),
        T('8', 10, 1000, { weight: 600, color: 'transparent', stroke: '#b8325a', sw: 3, lh: 1, align: 'left', x: 30, w: 600, opacity: 0.85 }),
        PHOTO(300, 250, 480, 640, 'tulips', { mask: 'arch' }),
        T('Олон улсын\nэмэгтэйчүүдийн баяр', 950, 72, { weight: 600, italic: 1, color: '#3a1422', lh: 1.02, w: 980 }),
        T('Та бүхэндээ аз жаргал, гэрэлт мөчүүдийг хүсье', 1135, 28, { body: 1, color: '#7a4453', w: 820 }),
        T('БАЙГУУЛЛАГЫН НЭР', 1230, 22, { body: 1, weight: 700, color: '#b8325a', cs: 500 })
      ]; } },
    { id: 'kids', name: 'Хүүхдийн баяр 6.1', cat: 'holiday', w: 1080, h: 1080, fonts: ['Rubik', 'Rubik'], sw: ['#fff6d6', '#ff5b5b', '#3a86ff'],
      items: function () {
        var o = [BG('#fff6d6')], cols = ['#ff5b5b', '#3a86ff', '#ffbe0b', '#06d6a0', '#8338ec'];
        [[120, 140, 26], [940, 120, 20], [860, 300, 14], [180, 860, 22], [930, 900, 28], [520, 90, 12], [80, 520, 16], [1000, 620, 18], [300, 980, 14]].forEach(function (p, i) { o.push(C(p[0], p[1], p[2], cols[i % 5], { name: 'Конфетти' })); });
        o.push(STAR(830, 180, 60, '#ffbe0b'), STAR(230, 300, 40, '#06d6a0'));
        o.push(T('6', 200, 420, { weight: 900, color: '#ff5b5b', x: 170, w: 300, angle: -8, c: 1, cx: 380, cy: 440 }));
        o.push(C(515, 575, 30, '#3a86ff', { name: 'Цэг' }));
        o.push(T('1', 200, 420, { weight: 900, color: '#8338ec', x: 560, w: 300, angle: 8, c: 1, cx: 700, cy: 440 }));
        o.push(T('Хүүхдийн баярын\nмэнд хүргэе!', 690, 70, { weight: 800, color: '#1b1b3a', lh: 1.05, w: 960 }));
        o.push(pill(340, 900, 400, 70, '#3a86ff', 'БАЙГУУЛЛАГЫН НЭР', '#ffffff', 24, { cs: 150 }));
        return o.reduce(function (a, b) { return a.concat(b); }, []);
      } },
    { id: 'birthday', name: 'Төрсөн өдөр', cat: 'holiday', w: 1080, h: 1350, fonts: ['Pacifico', 'Onest'], sw: ['#1b1036', '#ffcf5c', '#ff7eb6'],
      items: function () {
        var o = [BG('#1b1036', { grad: lin(90, [[0, '#2a1760'], [1, '#12092a']]), fx: GRAIN })], cols = ['#ffcf5c', '#ff7eb6', '#7ee8fa', '#ffffff'];
        for (var i = 0; i < 26; i++) { var x = (i * 173) % 1040 + 20, y = (i * 97) % 520 + 40; o.push(R(x, y, 14, 26, cols[i % 4], { angle: (i * 37) % 180, c: 1, rx: 3, name: 'Конфетти' })); }
        o.push(PHOTO(340, 560, 400, 400, 'party', { mask: 'circle' }));
        o.push(C(540, 760, 216, 'transparent', { stroke: '#ffcf5c', sw: 6, name: 'Хүрээ' }));
        o.push(T('Төрсөн өдрийн', 190, 110, { color: '#ffcf5c', w: 1000, lh: 1.1 }));
        o.push(T('мэнд хүргэе!', 330, 110, { color: '#ff7eb6', w: 1000, lh: 1.1 }));
        o.push(T('Нэр Овог', 1020, 64, { body: 1, weight: 800, color: '#ffffff' }));
        o.push(T('Бүх хүсэл мөрөөдөл чинь биелээсэй', 1110, 30, { body: 1, color: '#c9bff0', w: 860 }));
        return o;
      } },

    { id: 'naadam3', name: 'Наадам — фото', cat: 'holiday', w: 1080, h: 1350, fonts: ['Oswald', 'Inter'], sw: ['#111111', '#ffd23f', '#ffffff'],
      items: function () { return [
        BG('#111111'), PHOTO(0, 0, 1080, 1350, 'rider'),
        SCRIM(0, 0, 1080, 320, 90, [[0, '#000000', 0.6], [1, '#000000', 0]]),
        SCRIM(0, 620, 1080, 730, 90, [[0, '#0b0b0b', 0], [0.45, '#0b0b0b', 0.75], [1, '#0b0b0b', 0.96]]),
        T('ҮНДЭСНИЙ ИХ БАЯР', 70, 26, { body: 1, weight: 700, color: '#ffffff', cs: 500 }),
        T('НААДАМ', 800, 270, { weight: 700, color: '#ffffff', lh: 0.9, w: 1040 }),
        R(420, 1122, 240, 3, '#ffd23f', { name: 'Шугам' }),
        T('7.11 — 7.13 · Улаанбаатар', 1150, 40, { body: 1, weight: 700, color: '#ffd23f', w: 960 }),
        T('Эрийн гурван наадмын баярын мэнд хүргэе!', 1215, 30, { body: 1, color: '#e6e6e6', w: 960 }),
        T('БАЙГУУЛЛАГЫН НЭР', 1280, 20, { body: 1, weight: 700, color: '#bdbdbd', cs: 500 })
      ]; } },
    { id: 'tsagaansar3', name: 'Цагаан сар — тал нутаг', cat: 'holiday', w: 1080, h: 1350, fonts: ['Prata', 'Montserrat'], sw: ['#0a1f55', '#e8c26a', '#f7ecd0'],
      items: function () { return [
        BG('#0a1f55'), PHOTO(0, 0, 1080, 1350, 'ger'),
        R(0, 0, 1080, 1350, '#1d3f95', { blend: 'multiply', name: 'Өнгө' }),
        SCRIM(0, 560, 1080, 790, 90, [[0, '#07143a', 0], [0.5, '#07143a', 0.85], [1, '#07143a', 1]]),
        R(44, 44, 992, 1262, 'transparent', { stroke: '#e8c26a', sw: 2, name: 'Хүрээ' }),
        T('ЦАГААН САР · 2027', 760, 26, { body: 1, weight: 600, color: '#e8c26a', cs: 600 }),
        T('Сар шинэдээ\nсайхан шинэлээрэй', 820, 86, { lh: 1.08, w: 960, grad: lin(90, [[0, '#fff3d2'], [1, '#e2b458']]) }),
        T('Эрүүл энх, сайн сайхныг хүсье', 1060, 32, { body: 1, color: '#d8c9a3', w: 900 }),
        R(500, 1140, 80, 2, '#e8c26a', { name: 'Шугам' }),
        T('БАЙГУУЛЛАГЫН НЭР', 1180, 24, { body: 1, weight: 700, color: '#e8c26a', cs: 500 })
      ]; } },
    { id: 'newyear2', name: 'Шинэ он — оч', cat: 'holiday', w: 1080, h: 1350, fonts: ['Inter Tight', 'Playfair'], sw: ['#0b0906', '#e0a94a', '#fff6d5'],
      items: function () { return [
        BG('#0b0906'), PHOTO(0, 0, 1080, 1350, 'sparkler'),
        R(0, 0, 1080, 1350, '#000000', { opacity: 0.3, name: 'Бараан' }),
        SCRIM(0, 0, 1080, 360, 90, [[0, '#0b0906', 0.75], [1, '#0b0906', 0]]),
        SCRIM(0, 640, 1080, 710, 90, [[0, '#0b0906', 0], [0.55, '#0b0906', 0.85], [1, '#0b0906', 1]]),
        T('ШИНЭ ОНЫ МЭНД', 110, 30, { weight: 700, color: '#ffffff', cs: 700 }),
        T('2027', 770, 320, { weight: 900, lh: 0.9, w: 1060, grad: lin(90, [[0, '#fff6d5'], [1, '#e0a94a']]), shadow: { c: 'rgba(224,169,74,.35)', b: 60 } }),
        T('Шинэ онд шинэ амжилт, аз жаргал хүсье', 1130, 44, { body: 1, italic: 1, weight: 500, color: '#fff6d5', w: 940 }),
        T('БАЙГУУЛЛАГЫН НЭР', 1250, 22, { weight: 700, color: '#e0a94a', cs: 500 })
      ]; } },
    { id: 'wedding', name: 'Хуримын урилга', cat: 'holiday', w: 1080, h: 1350, fonts: ['Cormorant Garamond', 'Montserrat'], sw: ['#f6f1ea', '#9a7b4f', '#2b2420'],
      items: function () { return [
        BG('#f6f1ea', { fx: GRAIN }), PHOTO(60, 60, 960, 680, 'rings', { mask: 'rounded', r: 24 }),
        T('ХУРИМЫН УРИЛГА', 800, 26, { body: 1, weight: 600, color: '#9a7b4f', cs: 600 }),
        T('Тэмүүлэн & Сарнай', 850, 100, { weight: 500, italic: 1, color: '#2b2420', w: 1000 }),
        R(480, 1000, 120, 1.5, '#9a7b4f', { name: 'Шугам' }),
        T('2026.10.10  ·  17:00', 1035, 34, { body: 1, weight: 600, color: '#2b2420', cs: 200 }),
        T('Шангри-Ла зочид буудал, Улаанбаатар', 1095, 26, { body: 1, color: '#7a6e64', w: 900 }),
        T('Хүрэлцэн ирэхийг урьж байна', 1195, 42, { italic: 1, weight: 500, color: '#9a7b4f' })
      ]; } },
    { id: 'birthday2', name: 'Төрсөн өдөр — фото', cat: 'holiday', w: 1080, h: 1350, fonts: ['Caveat', 'Onest'], sw: ['#fde6ec', '#d6336c', '#3a1a28'],
      items: function () { return [
        BG('#fde6ec'), PHOTO(0, 0, 1080, 860, 'cake'),
        SCRIM(0, 560, 1080, 302, 90, [[0, '#fde6ec', 0], [1, '#fde6ec', 1]]),
        SPARK(140, 900, 22, '#d6336c'), SPARK(950, 960, 16, '#f59f00'), SPARK(900, 1230, 12, '#d6336c'),
        T('Төрсөн өдрийн\nмэнд хүргэе!', 850, 110, { weight: 700, color: '#d6336c', lh: 0.95, w: 980 }),
        T('Нэр Овог', 1125, 46, { body: 1, weight: 700, color: '#3a1a28' }),
        T('Бүх хүсэл мөрөөдөл чинь биелэх болтугай', 1195, 28, { body: 1, color: '#8a5a6a', w: 900 })
      ]; } },
    // ===================== БИЗНЕС =====================
    { id: 'sale', name: 'Хямдрал — acid', cat: 'biz', w: 1080, h: 1350, fonts: ['Inter Tight', 'Inter'], sw: ['#d7ff3a', '#0b0b0b', '#ffffff'],
      items: function () { return [
        BG('#d7ff3a', { fx: GRAIN }),
        T('ИХ ХЯМДРАЛ', 90, 40, { weight: 800, color: '#0b0b0b', cs: 300 }),
        T('−50', 180, 420, { weight: 900, color: '#0b0b0b', lh: 0.9, w: 1060 }),
        T('%', 560, 260, { weight: 900, color: 'transparent', stroke: '#0b0b0b', sw: 4, lh: 0.9, w: 1060 }),
        R(-40, 860, 1160, 110, '#0b0b0b', { angle: -4, c: 1, cx: 540, cy: 915, name: 'Тууз' }),
        T('ЗӨВХӨН 3 ХОНОГ • ЗӨВХӨН 3 ХОНОГ • ЗӨВХӨН 3 ХОНОГ', 890, 44, { weight: 800, color: '#d7ff3a', w: 1400, x: -160, angle: -4, c: 1, cx: 540, cy: 916 }),
        T('Бүх бүтээгдэхүүнд · 10.20 – 10.22', 1060, 34, { body: 1, weight: 600, color: '#0b0b0b', w: 900 }),
        R(340, 1150, 400, 96, '#0b0b0b', { rx: 48, name: 'Товч' }),
        T('Одоо захиалах →', 1176, 34, { body: 1, weight: 700, color: '#d7ff3a', x: 340, w: 400 })
      ]; } },
    { id: 'sale2', name: 'Хямдрал — editorial', cat: 'biz', w: 1080, h: 1080, fonts: ['Playfair', 'Inter'], sw: ['#efe8dd', '#1d1d1b', '#b5542f'],
      items: function () { return [
        BG('#efe8dd', { fx: GRAIN }),
        PHOTO(560, 80, 440, 920, 'model', { mask: 'arch', fy: 0.3 }),
        T('Намрын\nцуглуулга', 110, 100, { weight: 500, italic: 1, color: '#1d1d1b', align: 'left', x: 80, w: 470, lh: 0.98 }),
        T('−30%', 430, 180, { weight: 800, color: '#b5542f', align: 'left', x: 70, w: 520, lh: 1 }),
        R(80, 660, 60, 2, '#1d1d1b', { name: 'Шугам' }),
        T('Бүх бүтээгдэхүүнд 10 сарын 31 хүртэл', 690, 28, { body: 1, color: '#1d1d1b', align: 'left', x: 80, w: 420, lh: 1.35 }),
        pill(80, 880, 300, 76, '#1d1d1b', 'ДЭЛГҮҮР ОРОХ', '#efe8dd', 22, { cs: 250 })
      ].reduce(function (a, b) { return a.concat(b); }, []); } },
    { id: 'sale3', name: 'Хямдрал — neon', cat: 'biz', w: 1080, h: 1350, fonts: ['Fira Sans Extra Condensed', 'Onest'], sw: ['#07070b', '#ff2e88', '#29f0ff'],
      items: function () { return [
        BG('#07070b', { fx: GRAIN2 }),
        BLOB(200, 250, 460, '#ff2e88', 0.55), BLOB(900, 1100, 520, '#29f0ff', 0.4),
        T('ХАР', 120, 260, { weight: 900, color: 'transparent', stroke: '#ff2e88', sw: 3, lh: 0.85, w: 1040, shadow: { c: '#ff2e88', b: 30 } }),
        T('БААСАН', 330, 260, { weight: 900, color: '#ffffff', lh: 0.85, w: 1040, shadow: { c: 'rgba(255,46,136,.6)', b: 40 } }),
        T('ГАРАГ', 540, 260, { weight: 900, color: 'transparent', stroke: '#29f0ff', sw: 3, lh: 0.85, w: 1040, shadow: { c: '#29f0ff', b: 30 } }),
        T('70% хүртэл хямдрал', 860, 64, { body: 1, weight: 800, color: '#ffffff', w: 980 }),
        T('11.28 · зөвхөн 24 цаг', 960, 34, { body: 1, weight: 500, color: '#29f0ff', cs: 100 }),
        R(300, 1110, 480, 100, 'transparent', { rx: 50, stroke: '#ff2e88', sw: 3, name: 'Товч' }),
        T('Дэлгүүр үзэх', 1139, 36, { body: 1, weight: 700, color: '#ffffff', x: 300, w: 480 })
      ]; } },
    { id: 'product', name: 'Шинэ бүтээгдэхүүн — bento', cat: 'biz', w: 1080, h: 1350, fonts: ['Geologica', 'Inter'], sw: ['#f2f1ee', '#111111', '#ff6a3d'],
      items: function () { return [
        BG('#f2f1ee'),
        PHOTO(50, 50, 980, 700, 'sneaker', { mask: 'rounded', r: 40 }),
        R(80, 80, 170, 56, '#111111', { rx: 28, name: 'Шошго' }), T('ШИНЭ', 94, 24, { body: 1, weight: 700, color: '#ffffff', x: 80, w: 170, cs: 250 }),
        R(50, 780, 590, 520, '#111111', { rx: 40, name: 'Карт' }),
        T('Бүтээгдэхүүний\nнэр энд', 835, 62, { weight: 800, color: '#ffffff', align: 'left', x: 100, w: 500, lh: 1 }),
        T('Товч тайлбар — яагаад энэ бүтээгдэхүүн танд хэрэгтэй вэ.', 1030, 28, { body: 1, color: '#a8a8a8', align: 'left', x: 100, w: 490, lh: 1.4 }),
        T('@brand.mn', 1220, 26, { body: 1, weight: 600, color: '#ffffff', align: 'left', x: 100, w: 490 }),
        R(670, 780, 360, 250, '#ff6a3d', { rx: 40, name: 'Карт' }),
        T('Үнэ', 815, 28, { body: 1, weight: 500, color: '#ffffff', x: 670, w: 360 }),
        T('89,900₮', 865, 70, { weight: 800, color: '#ffffff', x: 670, w: 360 }),
        R(670, 1050, 360, 250, '#ffffff', { rx: 40, name: 'Карт' }),
        T('Хүргэлт\nүнэгүй', 1100, 50, { weight: 800, color: '#111111', x: 670, w: 360, lh: 1.05 })
      ]; } },
    { id: 'job', name: 'Ажлын зар', cat: 'biz', w: 1080, h: 1350, fonts: ['Inter Tight', 'Inter'], sw: ['#1646ff', '#ffffff', '#0b1033'],
      items: function () {
        var o = [BG('#1646ff', { grad: lin(135, [[0, '#2b5bff'], [1, '#0d2fd1']]), fx: GRAIN }),
          T('БИД ТАНЫГ', 110, 120, { weight: 900, color: '#ffffff', align: 'left', x: 80, w: 940, lh: 0.95 }),
          T('ХАЙЖ БАЙНА', 225, 120, { weight: 900, color: 'transparent', stroke: '#ffffff', sw: 2.5, align: 'left', x: 80, w: 1000, lh: 0.95 })];
        o = o.concat(pill(80, 400, 520, 84, '#ffffff', 'Маркетинг менежер', '#1646ff', 38, { weight: 800 }));
        ['Маркетингийн чиглэлээр 2+ жил ажилласан', 'Сошиал контент төлөвлөж чаддаг', 'Баг хамт олонтой ажиллах чадвартай', 'Англи хэл — дунд түвшин'].forEach(function (t, i) {
          var y = 560 + i * 92;
          o.push(C(104, y + 22, 18, '#ffffff', { name: 'Тэмдэг' }), T('✓', y + 4, 26, { body: 1, weight: 800, color: '#1646ff', x: 86, w: 36 }));
          o.push(T(t, y + 4, 34, { body: 1, weight: 500, color: '#ffffff', align: 'left', x: 146, w: 860 }));
        });
        o.push(R(80, 1000, 920, 260, '#0b1033', { rx: 36, name: 'Хайрцаг' }));
        o.push(T('CV илгээх', 1045, 28, { body: 1, weight: 600, color: '#8fa6ff', align: 'left', x: 130, w: 500 }));
        o.push(T('hr@company.mn', 1090, 54, { weight: 800, color: '#ffffff', align: 'left', x: 130, w: 820 }));
        o.push(T('Утас: 8000 0000 · Хугацаа: 10.15', 1180, 28, { body: 1, color: '#c3ceff', align: 'left', x: 130, w: 820 }));
        return o;
      } },
    { id: 'menu', name: 'Кафе цэс', cat: 'biz', w: 1080, h: 1350, fonts: ['Playfair', 'Inter'], sw: ['#1e1612', '#e9b872', '#f3e7d3'],
      items: function () {
        var o = [BG('#1e1612', { fx: GRAIN2 }), BLOB(900, 150, 420, '#e9b872', 0.18),
          T('— ӨНӨӨДРИЙН ЦЭС —', 110, 26, { body: 1, weight: 600, color: '#e9b872', cs: 500 }),
          T('Coffee & Bakery', 170, 96, { weight: 500, italic: 1, color: '#f3e7d3' })];
        [['Американо', 'Давхар эспрессо, халуун ус', '6,500₮'], ['Латте', 'Эспрессо, уурын сүү', '8,500₮'], ['Раф кофе', 'Ваниль, цөцгий', '9,900₮'],
          ['Круассан', 'Цөцгийн тос, шинэхэн', '5,500₮'], ['Чизкейк', 'Нью-Йорк загвар', '11,000₮']].forEach(function (r, i) {
          var y = 400 + i * 150;
          o.push(T(r[0], y, 50, { weight: 700, color: '#f3e7d3', align: 'left', x: 100, w: 600 }));
          o.push(T(r[2], y + 6, 42, { body: 1, weight: 600, color: '#e9b872', align: 'right', x: 100, w: 880 }));
          o.push(T(r[1], y + 66, 24, { body: 1, color: '#9c8b78', align: 'left', x: 100, w: 700 }));
          if (i < 4) o.push(R(100, y + 124, 880, 1, '#f3e7d3', { opacity: 0.12, name: 'Шугам' }));
        });
        o = o.concat(pill(340, 1200, 400, 76, '#e9b872', 'Захиалга: 7700 0000', '#1e1612', 26));
        return o;
      } },
    { id: 'coffee', name: 'Кофе 1+1', cat: 'biz', w: 1080, h: 1350, fonts: ['Fira Sans Extra Condensed', 'Onest'], sw: ['#e8d8c3', '#4a2c1d', '#ff7a2f'],
      items: function () { return [
        BG('#e8d8c3', { fx: GRAIN }),
        C(760, 520, 360, '#ff7a2f', { name: 'Тойрог' }),
        PHOTO(470, 240, 580, 580, 'latte', { mask: 'circle' }),
        T('1+1', 150, 400, { weight: 900, color: '#4a2c1d', align: 'left', x: 60, w: 700, lh: 0.9 }),
        T('КОФЕ', 520, 150, { weight: 900, color: 'transparent', stroke: '#4a2c1d', sw: 3, align: 'left', x: 70, w: 700, lh: 1 }),
        T('Даваа–Баасан 08:00–11:00 цагт нэгийг авбал нэг нь бэлэг', 900, 40, { body: 1, weight: 600, color: '#4a2c1d', align: 'left', x: 70, w: 700, lh: 1.25 }),
        R(70, 1130, 940, 2, '#4a2c1d', { opacity: 0.3, name: 'Шугам' }),
        T('КАФЕНЫ НЭР', 1170, 34, { weight: 800, color: '#4a2c1d', align: 'left', x: 70, w: 500, cs: 200 }),
        T('Хаяг · Утас', 1176, 28, { body: 1, color: '#4a2c1d', align: 'right', x: 70, w: 940 })
      ]; } },
    { id: 'realestate', name: 'Үл хөдлөх зар', cat: 'biz', w: 1080, h: 1350, fonts: ['Geologica', 'Inter'], sw: ['#ffffff', '#0f3d2e', '#c9a86a'],
      items: function () { return [
        BG('#ffffff'),
        PHOTO(0, 0, 1080, 760, 'house'),
        R(0, 690, 1080, 660, '#0f3d2e', { rx: 0, name: 'Хайрцаг' }),
        R(70, 640, 230, 100, '#c9a86a', { rx: 20, name: 'Шошго' }), T('ЗАРНА', 668, 38, { weight: 800, color: '#0f3d2e', x: 70, w: 230, cs: 200 }),
        T('Хан-Уул, 19-р хороолол', 790, 32, { body: 1, color: '#9fc2b3', align: 'left', x: 70, w: 940 }),
        T('3 өрөө орон сууц', 840, 86, { weight: 800, color: '#ffffff', align: 'left', x: 70, w: 940 }),
        T('82 м²', 990, 40, { weight: 700, color: '#ffffff', align: 'left', x: 70, w: 300 }), T('талбай', 1040, 24, { body: 1, color: '#9fc2b3', align: 'left', x: 70, w: 300 }),
        T('12/16', 990, 40, { weight: 700, color: '#ffffff', align: 'left', x: 330, w: 300 }), T('давхар', 1040, 24, { body: 1, color: '#9fc2b3', align: 'left', x: 330, w: 300 }),
        T('2019', 990, 40, { weight: 700, color: '#ffffff', align: 'left', x: 590, w: 300 }), T('ашиглалт', 1040, 24, { body: 1, color: '#9fc2b3', align: 'left', x: 590, w: 300 }),
        R(70, 1110, 940, 1, '#ffffff', { opacity: 0.2, name: 'Шугам' }),
        T('385 сая ₮', 1150, 80, { weight: 800, color: '#c9a86a', align: 'left', x: 70, w: 600 }),
        T('9911 2233', 1175, 40, { body: 1, weight: 700, color: '#ffffff', align: 'right', x: 70, w: 940 })
      ]; } },
    { id: 'pricing', name: 'Үйлчилгээний багц', cat: 'biz', w: 1080, h: 1350, fonts: ['Inter Tight', 'Inter'], sw: ['#0d0d12', '#b8a4ff', '#ffffff'],
      items: function () {
        var o = [BG('#0d0d12', { fx: GRAIN }), BLOB(540, 700, 600, '#6d56fa', 0.35),
          T('ҮНИЙН САНАЛ', 100, 26, { body: 1, weight: 600, color: '#b8a4ff', cs: 500 }),
          T('Танд тохирох\nбагцаа сонго', 150, 82, { weight: 800, color: '#ffffff', lh: 1, w: 940 })];
        [['Энгийн', 'Лого + 2 хувилбар', '290K'], ['Стандарт', 'Лого, өнгө, фонт, сошиал загвар', '690K'], ['Бүрэн', 'Брэнд бук, бүх хэрэглээ, 3 сарын дэмжлэг', '1.49M']].forEach(function (p, i) {
          var y = 420 + i * 270, hot = i === 1;
          o.push(R(80, y, 920, 230, hot ? '#ffffff' : 'rgba(255,255,255,0.06)', { rx: 32, stroke: hot ? null : 'rgba(255,255,255,0.14)', sw: hot ? 0 : 1.5, name: 'Карт' }));
          o.push(T(p[0], y + 44, 44, { weight: 800, color: hot ? '#0d0d12' : '#ffffff', align: 'left', x: 130, w: 500 }));
          o.push(T(p[1], y + 110, 26, { body: 1, color: hot ? '#55516a' : '#a9a6bd', align: 'left', x: 130, w: 520, lh: 1.35 }));
          o.push(T(p[2], y + 60, 88, { weight: 900, color: hot ? '#6d56fa' : '#ffffff', align: 'right', x: 130, w: 820 }));
          if (hot) o = o.concat(pill(130, y - 26, 250, 52, '#6d56fa', 'САНАЛ БОЛГОХ', '#ffffff', 20, { cs: 200 }));
        });
        o.push(T('Утас: 8000 0000 · @studio', 1260, 28, { body: 1, weight: 600, color: '#b8a4ff' }));
        return o;
      } },
    { id: 'testimonial', name: 'Сэтгэгдэл', cat: 'biz', w: 1080, h: 1080, fonts: ['Playfair', 'Inter'], sw: ['#f7f4ef', '#1a1a1a', '#ffb800'],
      items: function () {
        var o = [BG('#f7f4ef', { fx: GRAIN }),
          T('“', 40, 420, { weight: 800, color: '#ffb800', align: 'left', x: 60, w: 300, lh: 1 }),
          T('Лого, брэндийн өнгө төрхийг маань яг төсөөлж байснаар гаргаж өгсөн. Бүх хамт олон маань сэтгэл хангалуун байна.', 330, 54, { weight: 500, italic: 1, color: '#1a1a1a', align: 'left', x: 90, w: 900, lh: 1.25 })];
        for (var i = 0; i < 5; i++) o.push(STAR(115 + i * 58, 800, 24, '#ffb800'));
        o.push(PHOTO(80, 874, 92, 92, 'woman', { mask: 'circle', fy: 0.3 }));
        o.push(T('Болормаа Г.', 885, 32, { body: 1, weight: 700, color: '#1a1a1a', align: 'left', x: 196, w: 600 }));
        o.push(T('Маркетингийн менежер, Nomad LLC', 930, 24, { body: 1, color: '#6b6b6b', align: 'left', x: 196, w: 700 }));
        return o;
      } },
    { id: 'notice', name: 'Мэдэгдэл', cat: 'biz', w: 1080, h: 1080, fonts: ['Fira Sans Extra Condensed', 'Inter'], sw: ['#ffd400', '#111111', '#ffffff'],
      items: function () {
        var o = [BG('#ffd400', { fx: GRAIN })];
        for (var i = 0; i < 16; i++) o.push(R(-200 + i * 110, 60, 50, 120, '#111111', { angle: 35, c: 1, name: 'Тууз' }));
        for (var j = 0; j < 16; j++) o.push(R(-200 + j * 110, 960, 50, 120, '#111111', { angle: 35, c: 1, name: 'Тууз' }));
        o.push(T('МЭДЭГДЭЛ', 220, 240, { weight: 900, color: '#111111', lh: 0.9, w: 1040 }));
        o.push(T('10-р сарын 1-нд засвар үйлчилгээний улмаас манай салбар 14:00 цагаас хойш түр хаагдана.', 500, 42, { body: 1, weight: 600, color: '#111111', w: 860, lh: 1.35 }));
        o = o.concat(pill(330, 790, 420, 80, '#111111', 'Ойлгосонд баярлалаа', '#ffd400', 28));
        return o;
      } },

    { id: 'burger', name: 'Бургер — шинэ амт', cat: 'biz', w: 1080, h: 1350, fonts: ['Fira Sans Extra Condensed', 'Inter'], sw: ['#111111', '#ffc400', '#ffffff'],
      items: function () { return [
        BG('#111111'), PHOTO(0, 0, 1080, 1350, 'burger'),
        SCRIM(0, 0, 1080, 720, 90, [[0, '#0d0d0d', 0.92], [0.6, '#0d0d0d', 0.5], [1, '#0d0d0d', 0]]),
        SCRIM(0, 1060, 1080, 290, 90, [[0, '#0d0d0d', 0], [1, '#0d0d0d', 0.85]]),
        T('ШИНЭ АМТ', 80, 40, { body: 1, weight: 800, color: '#ffc400', cs: 500, align: 'left', x: 60, w: 600 }),
        T('СМОУК\nБУРГЕР', 140, 210, { weight: 900, color: '#ffffff', lh: 0.86, align: 'left', x: 56, w: 980 }),
        C(890, 1030, 140, '#ffc400', { name: 'Үнэ' }),
        T('ЗӨВХӨН', 975, 24, { body: 1, weight: 700, color: '#111111', cs: 300, x: 750, w: 280 }),
        T('15,900₮', 1008, 62, { weight: 900, color: '#111111', x: 750, w: 280 })
      ].concat(pill(60, 1220, 400, 76, '#ffffff', 'Хүргэлт: 7700 0000', '#111111', 26)); } },
    { id: 'pizza', name: 'Пицца 1+1', cat: 'biz', w: 1080, h: 1080, fonts: ['Rubik', 'Inter'], sw: ['#e63922', '#ffe0b3', '#ffffff'],
      items: function () { return [
        BG('#e63922', { grad: lin(45, [[0, '#ff5a36'], [1, '#c81e12']]), fx: GRAIN }),
        C(880, 640, 470, '#ffffff', { opacity: 0.12, name: 'Тойрог' }),
        PHOTO(440, 200, 880, 880, 'pizza', { mask: 'circle' }),
        T('1+1', 110, 250, { weight: 900, color: '#ffffff', align: 'left', x: 60, w: 620, lh: 0.95 }),
        T('ПИЦЦА', 395, 92, { weight: 900, color: '#ffe0b3', align: 'left', x: 64, w: 520 }),
        T('Мягмар гараг бүр\n2 дахь пицца үнэгүй', 540, 36, { body: 1, weight: 600, color: '#ffffff', align: 'left', x: 66, w: 430, lh: 1.3 })
      ].concat(pill(60, 900, 360, 80, '#ffffff', 'Хүргэлт 7777 0000', '#e63922', 26)); } },
    { id: 'fashion', name: 'Загвар — editorial', cat: 'biz', w: 1080, h: 1350, fonts: ['Playfair', 'Inter'], sw: ['#efe9e1', '#1d1d1b', '#b5542f'],
      items: function () { return [
        BG('#efe9e1', { fx: GRAIN }), PHOTO(0, 0, 600, 1350, 'model', { fy: 0.3 }),
        T('ШИНЭ ЦУГЛУУЛГА', 110, 22, { body: 1, weight: 700, color: '#1d1d1b', cs: 500, align: 'left', x: 650, w: 380 }),
        T('Намар\nӨвөл', 180, 128, { weight: 500, italic: 1, color: '#1d1d1b', align: 'left', x: 646, w: 420, lh: 0.95 }),
        T('2026', 470, 120, { weight: 700, color: 'transparent', stroke: '#1d1d1b', sw: 2, align: 'left', x: 650, w: 420 }),
        R(650, 700, 60, 2, '#1d1d1b', { name: 'Шугам' }),
        T('−40%', 740, 150, { weight: 700, color: '#b5542f', align: 'left', x: 644, w: 430 }),
        T('Бүх хувцсанд · 10.20 хүртэл', 940, 26, { body: 1, color: '#5a554f', align: 'left', x: 650, w: 380 })
      ].concat(pill(650, 1180, 300, 72, '#1d1d1b', 'Дэлгүүр орох →', '#ffffff', 24)); } },
    { id: 'beauty', name: 'Арьс арчилгаа', cat: 'biz', w: 1080, h: 1350, fonts: ['Prata', 'Manrope'], sw: ['#efe4da', '#3b2a22', '#b98a6a'],
      items: function () { return [
        BG('#efe4da', { fx: GRAIN }),
        C(540, 470, 380, 'transparent', { stroke: '#b98a6a', sw: 1.5, opacity: 0.6, name: 'Тойрог' }),
        PHOTO(250, 110, 580, 740, 'serum', { mask: 'arch' }),
        T('Байгалийн\nгэрэлтэлт', 900, 88, { color: '#3b2a22', lh: 1.05, w: 960 }),
        T('ШИНЭ СЕРУМ · 30 МЛ', 1130, 24, { body: 1, weight: 700, color: '#8a6a55', cs: 400 })
      ].concat(pill(390, 1200, 300, 72, '#3b2a22', 'Захиалах', '#efe4da', 24)); } },
    { id: 'salon', name: 'Гоо сайхны салон', cat: 'biz', w: 1080, h: 1350, fonts: ['Cormorant Garamond', 'Manrope'], sw: ['#2a1d22', '#e8a5b8', '#f6e3e8'],
      items: function () {
        var o = [BG('#2a1d22'), PHOTO(0, 0, 1080, 1350, 'salon', { fy: 0.3 }),
          SCRIM(0, 0, 1080, 260, 90, [[0, '#2a1d22', 0.7], [1, '#2a1d22', 0]]),
          SCRIM(0, 480, 1080, 870, 90, [[0, '#2a1d22', 0], [0.4, '#2a1d22', 0.88], [1, '#2a1d22', 1]]),
          T('ГОО САЙХНЫ СТУДИ', 70, 24, { body: 1, weight: 700, color: '#f6e3e8', cs: 600 }),
          T('Өөртөө цаг гарга', 700, 104, { weight: 600, italic: 1, color: '#f6e3e8', w: 1000 })];
        [['Үс засалт', '35,000₮'], ['Будалт', '45,000₮'], ['Маникюр', '30,000₮']].forEach(function (r, i) {
          var y = 890 + i * 72;
          o.push(T(r[0], y, 32, { body: 1, weight: 500, color: '#ffffff', align: 'left', x: 180, w: 480 }));
          o.push(T(r[1], y, 32, { body: 1, weight: 700, color: '#e8a5b8', align: 'right', x: 420, w: 480 }));
          o.push(R(180, y + 54, 720, 1, '#ffffff', { opacity: 0.18, name: 'Шугам' }));
        });
        o.push(T('Цаг захиалга: 9911 2233', 1170, 30, { body: 1, weight: 700, color: '#e8a5b8' }));
        o.push(T('@beauty.studio', 1225, 24, { body: 1, color: '#bfa7ae' }));
        return o;
      } },
    { id: 'interior', name: 'Интерьер дизайн', cat: 'biz', w: 1080, h: 1350, fonts: ['Geologica', 'Inter'], sw: ['#f4f1ec', '#1f1f1f', '#b07d4f'],
      items: function () {
        var o = [BG('#f4f1ec'), PHOTO(0, 0, 1080, 860, 'living'), R(60, 740, 960, 550, '#ffffff', { name: 'Карт', shadow: { c: 'rgba(0,0,0,.12)', b: 40, y: 10 } }),
          T('Таны мөрөөдлийн\nорон зай', 800, 70, { weight: 700, color: '#1f1f1f', align: 'left', x: 110, w: 860, lh: 1.05 }),
          T('Интерьер дизайн, засвар — 3D зураглал үнэгүй', 985, 28, { body: 1, color: '#6b6b6b', align: 'left', x: 110, w: 860 })];
        [['120+', 'төсөл'], ['8', 'жилийн туршлага'], ['3D', 'зураглал']].forEach(function (r, i) {
          o.push(T(r[0], 1070, 56, { weight: 800, color: '#b07d4f', align: 'left', x: 110 + i * 300, w: 280 }));
          o.push(T(r[1], 1150, 22, { body: 1, color: '#6b6b6b', align: 'left', x: 110 + i * 300, w: 280 }));
        });
        return o;
      } },
    { id: 'car', name: 'Авто худалдаа', cat: 'biz', w: 1080, h: 1350, fonts: ['Oswald', 'Inter'], sw: ['#0b0b0f', '#ff3b30', '#ffffff'],
      items: function () { return [
        BG('#0b0b0f'), PHOTO(0, 0, 1080, 1350, 'car'),
        SCRIM(0, 0, 1080, 560, 90, [[0, '#0b0b0f', 0.9], [1, '#0b0b0f', 0]]),
        SCRIM(0, 820, 1080, 530, 90, [[0, '#0b0b0f', 0], [0.5, '#0b0b0f', 0.85], [1, '#0b0b0f', 1]]),
        T('ШИНЭ ИРЛЭЭ', 80, 26, { body: 1, weight: 700, color: '#ff3b30', cs: 600, align: 'left', x: 70, w: 600 }),
        T('ХУРД\nБА ХҮЧ', 130, 170, { weight: 700, color: '#ffffff', lh: 0.9, align: 'left', x: 66, w: 940 }),
        R(70, 1060, 6, 170, '#ff3b30', { name: 'Шугам' }),
        T('2024 он · 2.0 турбо · 12,000 км', 1062, 30, { body: 1, color: '#dddddd', align: 'left', x: 100, w: 900 }),
        T('89 сая ₮', 1105, 92, { weight: 700, color: '#ffffff', align: 'left', x: 98, w: 900 }),
        T('Лизинг 30% урьдчилгаатай · 9911 2233', 1250, 26, { body: 1, weight: 600, color: '#ff6b61', align: 'left', x: 100, w: 900 })
      ]; } },
    { id: 'dental', name: 'Шүдний эмнэлэг', cat: 'biz', w: 1080, h: 1350, fonts: ['Manrope', 'Inter'], sw: ['#eef7f6', '#0f3d3a', '#12b5a6'],
      items: function () {
        var o = [BG('#eef7f6'), PHOTO(500, 0, 580, 1350, 'dentist'),
          T('Эрүүл\nинээмсэглэл', 140, 62, { weight: 800, color: '#0f3d3a', align: 'left', x: 60, w: 420, lh: 1.02 }),
          T('Шүдний иж бүрэн үйлчилгээ', 320, 28, { body: 1, color: '#4a6b68', align: 'left', x: 60, w: 400 })];
        ['Үзлэг, зөвлөгөө үнэгүй', 'Шүд цайруулалт', 'Имплант, гажиг засал', 'Хүүхдийн шүд'].forEach(function (t, i) {
          var y = 440 + i * 70;
          o.push(C(80, y + 17, 17, '#12b5a6', { name: 'Тэмдэг' }), T('✓', y + 3, 20, { body: 1, weight: 800, color: '#ffffff', x: 63, w: 34 }));
          o.push(T(t, y, 28, { body: 1, weight: 500, color: '#0f3d3a', align: 'left', x: 115, w: 370 }));
        });
        o.push(R(60, 800, 400, 210, '#12b5a6', { rx: 28, name: 'Карт' }));
        o.push(T('−20%', 830, 88, { weight: 800, color: '#ffffff', x: 60, w: 400 }));
        o.push(T('10-р сарын турш', 945, 26, { body: 1, weight: 600, color: '#e6fffb', x: 60, w: 400 }));
        o.push(T('☎ 7011 2233', 1150, 40, { weight: 800, color: '#0f3d3a', align: 'left', x: 60, w: 420 }));
        o.push(T('Сүхбаатар дүүрэг, 1-р хороо', 1215, 24, { body: 1, color: '#4a6b68', align: 'left', x: 60, w: 420 }));
        return o;
      } },
    { id: 'cashmere', name: 'Монгол ноолуур', cat: 'biz', w: 1080, h: 1350, fonts: ['Cormorant Garamond', 'Montserrat'], sw: ['#e9dfd1', '#3a2a1f', '#8c6a4f'],
      items: function () { return [
        BG('#e9dfd1'), PHOTO(0, 0, 1080, 1350, 'knit'),
        R(120, 290, 840, 770, '#f7f2ea', { opacity: 0.95, name: 'Карт' }),
        R(140, 310, 800, 730, 'transparent', { stroke: '#8c6a4f', sw: 1.5, name: 'Хүрээ' }),
        T('100% МОНГОЛ НООЛУУР', 380, 24, { body: 1, weight: 600, color: '#8c6a4f', cs: 500 }),
        T('Дулаан\nбас зөөлөн', 440, 108, { weight: 500, italic: 1, color: '#3a2a1f', lh: 0.98, w: 760 }),
        T('Намрын цуглуулга −30%', 720, 34, { body: 1, weight: 600, color: '#3a2a1f', w: 760 }),
        T('www.brand.mn', 950, 22, { body: 1, color: '#8c6a4f', cs: 200 })
      ].concat(pill(390, 820, 300, 72, '#3a2a1f', 'Дэлгүүр орох', '#f7f2ea', 24)); } },
    { id: 'job2', name: 'Ажлын зар — фото', cat: 'biz', w: 1080, h: 1350, fonts: ['Inter Tight', 'Inter'], sw: ['#ffffff', '#1646ff', '#0b1033'],
      items: function () { return [
        BG('#ffffff'), PHOTO(50, 50, 980, 620, 'team', { mask: 'rounded', r: 36 })
      ].concat(pill(90, 90, 240, 60, '#1646ff', 'АЖИЛД АВНА', '#ffffff', 22, { cs: 200 })).concat([
        T('Маркетинг\nменежер', 720, 100, { weight: 800, color: '#0b1033', align: 'left', x: 60, w: 960, lh: 1 }),
        T('Бүтэн цаг · Улаанбаатар · 3–5 сая₮', 950, 30, { body: 1, weight: 500, color: '#5a6178', align: 'left', x: 62, w: 960 }),
        T('✓ 2+ жил туршлага     ✓ Англи хэл     ✓ Баг удирдах', 1010, 26, { body: 1, weight: 600, color: '#1646ff', align: 'left', x: 62, w: 960 }),
        R(60, 1100, 960, 190, '#0b1033', { rx: 28, name: 'Карт' }),
        T('CV-гээ илгээх', 1135, 24, { body: 1, color: '#9aa3ff', align: 'left', x: 100, w: 800 }),
        T('hr@company.mn', 1178, 56, { weight: 800, color: '#ffffff', align: 'left', x: 98, w: 880 })
      ]); } },
    { id: 'coffee2', name: 'Кофе — өглөө', cat: 'biz', w: 1080, h: 1350, fonts: ['Playfair', 'Inter'], sw: ['#f3e7d7', '#3b2618', '#e4572e'],
      items: function () { return [
        BG('#f3e7d7', { fx: GRAIN }),
        T('Өглөөг\nкофеноос', 80, 116, { weight: 500, italic: 1, color: '#3b2618', lh: 0.95, w: 980 }),
        PHOTO(160, 420, 760, 760, 'latte', { mask: 'circle' }),
        C(880, 470, 100, '#e4572e', { name: 'Шошго' }),
        T('−20%', 440, 54, { weight: 800, color: '#ffffff', x: 780, w: 200 }),
        T('Өглөө 8–10 цагт бүх кофе', 1220, 30, { body: 1, weight: 600, color: '#3b2618' }),
        T('КОФЕ ШОПЫН НЭР', 1275, 20, { body: 1, weight: 700, color: '#8a6a55', cs: 500 })
      ]; } },
    // ===================== АРГА ХЭМЖЭЭ =====================
    { id: 'event', name: 'Концерт — swiss', cat: 'event', w: 1080, h: 1350, fonts: ['Inter Tight', 'Inter'], sw: ['#ececec', '#111111', '#ff3b1f'],
      items: function () { return [
        BG('#ececec', { fx: GRAIN }),
        C(820, 380, 300, '#ff3b1f', { name: 'Тойрог' }),
        T('LIVE', 70, 340, { weight: 900, color: '#111111', align: 'left', x: 50, w: 1000, lh: 0.85 }),
        T('ТОГЛОЛТ', 400, 140, { weight: 900, color: '#111111', align: 'left', x: 55, w: 1000, lh: 0.9 }),
        R(60, 640, 960, 3, '#111111', { name: 'Шугам' }),
        T('Уран бүтээлчийн нэр', 680, 70, { weight: 800, color: '#111111', align: 'left', x: 60, w: 960 }),
        T('ОГНОО', 880, 22, { body: 1, weight: 700, color: '#ff3b1f', cs: 300, align: 'left', x: 60, w: 300 }),
        T('10.25', 915, 64, { weight: 800, color: '#111111', align: 'left', x: 60, w: 300 }),
        T('ЦАГ', 880, 22, { body: 1, weight: 700, color: '#ff3b1f', cs: 300, align: 'left', x: 380, w: 300 }),
        T('19:00', 915, 64, { weight: 800, color: '#111111', align: 'left', x: 380, w: 300 }),
        T('ҮНЭ', 880, 22, { body: 1, weight: 700, color: '#ff3b1f', cs: 300, align: 'left', x: 700, w: 300 }),
        T('45K₮', 915, 64, { weight: 800, color: '#111111', align: 'left', x: 700, w: 320 }),
        R(60, 1060, 960, 3, '#111111', { name: 'Шугам' }),
        T('Улаанбаатар · UB Palace', 1100, 34, { body: 1, weight: 600, color: '#111111', align: 'left', x: 60, w: 700 }),
        T('Тасалбар: ticket.mn', 1100, 34, { body: 1, weight: 600, color: '#111111', align: 'right', x: 60, w: 960 })
      ]; } },
    { id: 'seminar', name: 'Семинар — илтгэгчид', cat: 'event', w: 1080, h: 1350, fonts: ['Geologica', 'Inter'], sw: ['#0c1a2b', '#35e0a1', '#ffffff'],
      items: function () {
        var o = [BG('#0c1a2b', { fx: GRAIN }), BLOB(950, 150, 420, '#35e0a1', 0.35)];
        o = o.concat(pill(80, 90, 290, 60, 'rgba(53,224,161,0.15)', 'ҮНЭГҮЙ СЕМИНАР', '#35e0a1', 22, { cs: 200 }));
        o.push(T('Брэндээ\nхэрхэн өсгөх вэ?', 190, 96, { weight: 800, color: '#ffffff', align: 'left', x: 80, w: 940, lh: 1.02 }));
        o.push(T('Сошиал медиа, контент, дизайны практик зөвлөгөө', 440, 32, { body: 1, color: '#9fb3c8', align: 'left', x: 80, w: 800, lh: 1.35 }));
        [['Илтгэгч 1', 'Маркетинг'], ['Илтгэгч 2', 'Дизайн'], ['Илтгэгч 3', 'Контент']].forEach(function (s, i) {
          var x = 80 + i * 320;
          o.push(PH(x, 600, 280, 280, 'Зураг', { rx: 140, fill: '#17304d' }));
          o.push(T(s[0], 905, 32, { weight: 700, color: '#ffffff', x: x - 10, w: 300 }));
          o.push(T(s[1], 950, 24, { body: 1, color: '#35e0a1', x: x - 10, w: 300 }));
        });
        o.push(R(80, 1070, 920, 190, 'rgba(255,255,255,0.06)', { rx: 30, stroke: 'rgba(255,255,255,0.12)', sw: 1.5, name: 'Хайрцаг' }));
        o.push(T('11.08 · 14:00', 1110, 44, { weight: 800, color: '#ffffff', align: 'left', x: 130, w: 500 }));
        o.push(T('Шангри-Ла, 3 давхар', 1175, 28, { body: 1, color: '#9fb3c8', align: 'left', x: 130, w: 500 }));
        o = o.concat(pill(690, 1125, 270, 80, '#35e0a1', 'Бүртгүүлэх', '#0c1a2b', 28));
        return o;
      } },
    { id: 'course', name: 'Сургалтын бүртгэл', cat: 'event', w: 1080, h: 1080, fonts: ['Inter Tight', 'Inter'], sw: ['#ff5c39', '#fff4e8', '#1b1b1b'],
      items: function () { return [
        BG('#ff5c39', { grad: lin(135, [[0, '#ff7a45'], [1, '#e8402a']]), fx: GRAIN }),
        C(900, 180, 200, '#fff4e8', { opacity: 0.12, name: 'Тойрог' }), C(980, 330, 90, '#fff4e8', { opacity: 0.12, name: 'Тойрог' })
      ].concat(pill(80, 90, 330, 60, '#1b1b1b', 'БҮРТГЭЛ ЭХЭЛЛЭЭ', '#fff4e8', 22, { cs: 150 })).concat([
        T('График\nдизайны\nсургалт', 190, 118, { weight: 900, color: '#fff4e8', align: 'left', x: 80, w: 900, lh: 0.95 }),
        T('Illustrator · Photoshop · Figma — 0-ээс 8 долоо хоногт', 590, 30, { body: 1, weight: 500, color: '#fff4e8', align: 'left', x: 80, w: 800 }),
        R(80, 700, 920, 2, '#fff4e8', { opacity: 0.4, name: 'Шугам' }),
        T('ЭХЛЭХ', 740, 22, { body: 1, weight: 700, color: '#1b1b1b', cs: 300, align: 'left', x: 80, w: 300 }), T('10.20', 772, 56, { weight: 800, color: '#fff4e8', align: 'left', x: 80, w: 300 }),
        T('ҮНЭ', 740, 22, { body: 1, weight: 700, color: '#1b1b1b', cs: 300, align: 'left', x: 400, w: 300 }), T('390K₮', 772, 56, { weight: 800, color: '#fff4e8', align: 'left', x: 400, w: 320 }),
        T('СУУДАЛ', 740, 22, { body: 1, weight: 700, color: '#1b1b1b', cs: 300, align: 'left', x: 740, w: 300 }), T('12', 772, 56, { weight: 800, color: '#fff4e8', align: 'left', x: 740, w: 260 }),
        T('Бүртгэл: 9911 2233 · @academy', 930, 30, { body: 1, weight: 600, color: '#1b1b1b', align: 'left', x: 80, w: 900 })
      ]); } },
    { id: 'sport', name: 'Спорт тэмцээн', cat: 'event', w: 1080, h: 1350, fonts: ['Fira Sans Extra Condensed', 'Inter'], sw: ['#0a0a0a', '#c6ff00', '#ffffff'],
      items: function () {
        var o = [BG('#0a0a0a', { fx: GRAIN2 })];
        for (var i = 0; i < 7; i++) o.push(R(560 + i * 110, 675, 60, 1700, '#c6ff00', { angle: 20, c: 1, opacity: 0.08 + i * 0.03, name: 'Тууз' }));
        o.push(T('САГСАН', 140, 250, { weight: 900, color: '#ffffff', align: 'left', x: 50, w: 1030, lh: 0.85, angle: -6, c: 1, cx: 540, cy: 260 }));
        o.push(T('БӨМБӨГ', 370, 250, { weight: 900, color: '#c6ff00', align: 'left', x: 70, w: 1030, lh: 0.85, angle: -6, c: 1, cx: 560, cy: 490 }));
        o.push(T('3×3 ТЭМЦЭЭН', 680, 90, { weight: 900, color: 'transparent', stroke: '#ffffff', sw: 2.5, align: 'left', x: 70, w: 900 }));
        o.push(T('Шагналын сан 5,000,000₮', 830, 44, { body: 1, weight: 700, color: '#ffffff', align: 'left', x: 70, w: 900 }));
        o.push(T('11.15 — 11.16 · Спорт цогцолбор', 900, 32, { body: 1, color: '#c6ff00', align: 'left', x: 70, w: 900 }));
        o = o.concat(pill(70, 1140, 400, 90, '#c6ff00', 'БҮРТГҮҮЛЭХ →', '#0a0a0a', 32, { weight: 800 }));
        return o;
      } },
    { id: 'opening', name: 'Нээлт — story', cat: 'event', w: 1080, h: 1920, fonts: ['Playfair', 'Inter'], sw: ['#f3ece2', '#1f3a2e', '#d98c5f'],
      items: function () { return [
        BG('#f3ece2', { fx: GRAIN }),
        T('ШИНЭ САЛБАР', 180, 30, { body: 1, weight: 600, color: '#1f3a2e', cs: 700 }),
        T('Нээгдлээ', 240, 190, { weight: 500, italic: 1, color: '#1f3a2e', lh: 1 }),
        PHOTO(120, 520, 840, 900, 'barista', { mask: 'arch' }),
        C(860, 560, 110, '#d98c5f', { name: 'Шошго' }),
        T('20%\nхямдрал', 518, 40, { body: 1, weight: 800, color: '#ffffff', x: 760, w: 200, lh: 1.05, angle: 12, c: 1, cx: 860, cy: 560 }),
        T('10.01 · 11:00', 1490, 70, { weight: 700, color: '#1f3a2e' }),
        T('Сүхбаатар дүүрэг, Их тойруу 12', 1600, 34, { body: 1, color: '#5a6b62' }),
        R(390, 1700, 300, 2, '#1f3a2e', { opacity: 0.4, name: 'Шугам' }),
        T('БРЭНДИЙН НЭР', 1740, 28, { body: 1, weight: 700, color: '#1f3a2e', cs: 500 })
      ]; } },
    { id: 'live', name: 'Live / вебинар', cat: 'event', w: 1200, h: 630, fonts: ['Inter Tight', 'Inter'], sw: ['#0f0f1a', '#ff3355', '#ffffff'],
      items: function () { return [
        BG('#0f0f1a', { fx: GRAIN }), BLOB(1000, 120, 380, '#ff3355', 0.35), BLOB(150, 600, 340, '#6d56fa', 0.3),
        R(70, 70, 150, 54, '#ff3355', { rx: 27, name: 'Шошго' }), C(102, 97, 8, '#ffffff', { name: 'Цэг' }),
        T('LIVE', 80, 30, { weight: 800, color: '#ffffff', align: 'left', x: 120, w: 100 }),
        T('Брэндээ хэрхэн\nбүтээх вэ?', 160, 80, { weight: 900, color: '#ffffff', align: 'left', x: 70, w: 700, lh: 1 }),
        T('10.18 · 20:00 · Zoom · Үнэгүй', 380, 32, { body: 1, weight: 600, color: '#ff8fa3', align: 'left', x: 70, w: 700 }),
        PH(820, 110, 300, 300, 'Илтгэгч', { rx: 150, fill: '#1c1c2e' }),
        T('Илтгэгчийн нэр', 440, 30, { weight: 700, color: '#ffffff', x: 800, w: 340 }),
        T('Брэнд дизайнер', 482, 22, { body: 1, color: '#9a9ab5', x: 800, w: 340 })
      ]; } },

    { id: 'concert2', name: 'Концерт — фото', cat: 'event', w: 1080, h: 1350, fonts: ['Oswald', 'Inter'], sw: ['#12001f', '#ff5ce1', '#ffffff'],
      items: function () { return [
        BG('#12001f'), PHOTO(0, 0, 1080, 1350, 'concert'),
        R(0, 0, 1080, 1350, '#7a2cff', { blend: 'multiply', name: 'Өнгө' }),
        SCRIM(0, 0, 1080, 600, 90, [[0, '#12001f', 0.85], [1, '#12001f', 0]]),
        SCRIM(0, 850, 1080, 500, 90, [[0, '#12001f', 0], [0.5, '#12001f', 0.85], [1, '#12001f', 1]]),
        T('АМЬД\nТОГЛОЛТ', 80, 230, { weight: 700, color: '#ffffff', lh: 0.86, align: 'left', x: 56, w: 980 }),
        T('Уран бүтээлчийн нэр', 990, 66, { weight: 600, color: '#ff5ce1', align: 'left', x: 60, w: 960 }),
        T('11.15 · 20:00 · UB Palace', 1090, 34, { body: 1, weight: 600, color: '#ffffff', align: 'left', x: 62, w: 960 })
      ].concat(pill(60, 1180, 340, 80, '#ff5ce1', 'Тасалбар авах →', '#12001f', 28)); } },
    { id: 'fitness', name: 'Фитнес клуб', cat: 'event', w: 1080, h: 1350, fonts: ['Oswald', 'Inter'], sw: ['#0a0a0a', '#c6ff00', '#ffffff'],
      items: function () { return [
        BG('#0a0a0a'), PHOTO(0, 0, 1080, 1350, 'gym'),
        SCRIM(0, 0, 1080, 1350, 0, [[0, '#0a0a0a', 0.95], [0.55, '#0a0a0a', 0.35], [1, '#0a0a0a', 0]]),
        T('ХҮЧЭЭ\nСОРЬ', 130, 210, { weight: 700, color: '#ffffff', lh: 0.88, align: 'left', x: 56, w: 760 }),
        T('Сарын эрх', 610, 30, { body: 1, color: '#bdbdbd', align: 'left', x: 60, w: 500 }),
        T('99,000₮', 650, 120, { weight: 700, color: '#c6ff00', align: 'left', x: 56, w: 700 }),
        T('• Хувийн дасгалжуулагч\n• 24/7 нээлттэй\n• Сауна, душ', 830, 32, { body: 1, weight: 500, color: '#ffffff', align: 'left', x: 60, w: 560, lh: 1.55 })
      ].concat(pill(60, 1150, 360, 84, '#c6ff00', 'Бүртгүүлэх →', '#0a0a0a', 28)); } },
    { id: 'travel', name: 'Аялал — Говь', cat: 'event', w: 1080, h: 1350, fonts: ['Oswald', 'Inter'], sw: ['#1a0f08', '#f4a261', '#ffffff'],
      items: function () { return [
        BG('#1a0f08'), PHOTO(0, 0, 1080, 1350, 'gobi'),
        SCRIM(0, 0, 1080, 300, 90, [[0, '#1a0f08', 0.6], [1, '#1a0f08', 0]]),
        SCRIM(0, 560, 1080, 790, 90, [[0, '#1a0f08', 0], [0.45, '#1a0f08', 0.8], [1, '#1a0f08', 0.98]]),
        T('АЯЛАЛ · 2026', 70, 26, { body: 1, weight: 700, color: '#ffffff', cs: 600 }),
        T('ГОВЬ', 740, 280, { weight: 700, color: '#ffffff', lh: 0.9 }),
        T('5 өдөр · 4 шөнө · Хонгорын элс, Ёлын ам', 1030, 30, { body: 1, weight: 500, color: '#f3d9b8', w: 980 }),
        R(290, 1100, 500, 110, '#f4a261', { rx: 55, name: 'Үнэ' }),
        T('1,290,000₮', 1117, 64, { weight: 700, color: '#1a0f08', x: 290, w: 500 }),
        T('Захиалга: 9900 1122', 1250, 26, { body: 1, weight: 600, color: '#ffffff' })
      ]; } },
    { id: 'travel2', name: 'Нислэгийн хямдрал', cat: 'event', w: 1080, h: 1350, fonts: ['Inter Tight', 'Inter'], sw: ['#e8f1ff', '#0b3d91', '#ff5a36'],
      items: function () { return [
        BG('#e8f1ff'), PHOTO(60, 60, 960, 740, 'plane', { mask: 'rounded', r: 40 })
      ].concat(pill(100, 100, 280, 64, '#ffffff', '✈  Хямд нислэг', '#0b3d91', 24)).concat([
        T('Токио', 850, 140, { weight: 800, color: '#0b3d91', align: 'left', x: 56, w: 560 }),
        T('Улаанбаатар → Токио, буцах', 1025, 30, { body: 1, color: '#4a5a7a', align: 'left', x: 60, w: 600 }),
        T('1.2 сая₮', 880, 70, { weight: 800, color: '#ff5a36', align: 'right', x: 540, w: 480 }),
        T('-аас эхлэн', 970, 26, { body: 1, color: '#4a5a7a', align: 'right', x: 540, w: 480 }),
        R(60, 1110, 960, 2, '#b9c9e6', { name: 'Шугам' }),
        T('10.01 — 12.31 · Суудал хязгаартай', 1150, 30, { body: 1, weight: 600, color: '#0b3d91', align: 'left', x: 60, w: 960 }),
        T('travel.mn · 9900 1122', 1225, 26, { body: 1, color: '#4a5a7a', align: 'left', x: 60, w: 960 })
      ]); } },
    { id: 'course2', name: 'Сургалт — фото', cat: 'event', w: 1080, h: 1080, fonts: ['Geologica', 'Inter'], sw: ['#fff4e0', '#1b1b1b', '#ff7a1a'],
      items: function () { return [
        BG('#fff4e0'), PHOTO(560, 0, 520, 1080, 'student')
      ].concat(pill(60, 70, 280, 56, '#1b1b1b', 'БҮРТГЭЛ ЭХЭЛЛЭЭ', '#ffffff', 20, { cs: 150 })).concat([
        T('Англи хэлний\nэрчимжүүлсэн\nсургалт', 170, 60, { weight: 800, color: '#1b1b1b', align: 'left', x: 60, w: 480, lh: 1.05 }),
        T('Эхлэх: 10.20\nХугацаа: 3 сар\nТөлбөр: 450,000₮', 450, 30, { body: 1, weight: 500, color: '#3a3a3a', align: 'left', x: 60, w: 480, lh: 1.6 })
      ]).concat(pill(60, 700, 300, 76, '#ff7a1a', 'Бүртгүүлэх →', '#ffffff', 26)).concat([
        T('☎ 9911 2233 · @academy', 960, 24, { body: 1, color: '#6b5a45', align: 'left', x: 60, w: 480 })
      ]); } },
    { id: 'kids2', name: 'Хүүхдийн дугуйлан', cat: 'event', w: 1080, h: 1350, fonts: ['Rubik', 'Rubik'], sw: ['#fff6d6', '#ff5b5b', '#3a86ff'],
      items: function () { return [
        BG('#fff6d6'),
        R(90, 90, 900, 760, '#ffbe0b', { rx: 60, angle: 3, c: 1, cx: 540, cy: 470, name: 'Хүрээ' }),
        PHOTO(90, 90, 900, 760, 'kids', { mask: 'rounded', r: 60, angle: -2 }),
        STAR(960, 100, 56, '#ff5b5b'), C(110, 880, 22, '#3a86ff', { name: 'Конфетти' }), C(980, 900, 16, '#06d6a0', { name: 'Конфетти' }),
        T('Зуны дугуйлан', 900, 96, { weight: 800, color: '#1b1b3a', w: 1000 }),
        T('Зураг · Бүжиг · Робот · 6–12 нас', 1030, 32, { body: 1, weight: 600, color: '#ff5b5b', w: 960 })
      ].concat(pill(330, 1160, 420, 80, '#3a86ff', 'Бүртгэл: 8800 1122', '#ffffff', 26)); } },
    // ===================== СОШИАЛ КОНТЕНТ =====================
    { id: 'tips', name: 'Зөвлөгөө — carousel cover', cat: 'social', w: 1080, h: 1350, fonts: ['Inter Tight', 'Inter'], sw: ['#f5f0ff', '#5b2eff', '#16112e'],
      items: function () { return [
        BG('#f5f0ff', { fx: GRAIN }),
        T('5', 40, 760, { weight: 900, color: '#5b2eff', align: 'left', x: 30, w: 600, lh: 1 }),
        T('АРГА', 170, 110, { weight: 900, color: '#16112e', align: 'left', x: 470, w: 600, lh: 1 }),
        T('Сошиалдаа\nилүү олон\nүйлчлүүлэгч\nтатах', 830, 76, { weight: 800, color: '#16112e', align: 'left', x: 80, w: 920, lh: 1 }),
        R(700, 1200, 300, 80, '#16112e', { rx: 40, name: 'Товч' }),
        T('Гүйлгэх →', 1221, 30, { body: 1, weight: 700, color: '#ffffff', x: 700, w: 300 }),
        T('@brand.mn', 1224, 28, { body: 1, weight: 600, color: '#5b2eff', align: 'left', x: 80, w: 400 })
      ]; } },
    { id: 'quote', name: 'Ишлэл — editorial', cat: 'social', w: 1080, h: 1080, fonts: ['Noto Serif Display', 'Inter'], sw: ['#15130f', '#e9dcc3', '#c9a45c'],
      items: function () { return [
        BG('#15130f', { fx: GRAIN2 }),
        R(90, 90, 900, 900, 'transparent', { stroke: '#c9a45c', sw: 1, opacity: 0.5, name: 'Хүрээ' }),
        T('Энгийн байдал бол\nжинхэнэ ур чадварын\nдээд илэрхийлэл.', 300, 72, { weight: 500, italic: 1, color: '#e9dcc3', lh: 1.15, w: 900 }),
        R(510, 640, 60, 1.5, '#c9a45c', { name: 'Шугам' }),
        T('НЭР ОВОГ', 680, 24, { body: 1, weight: 600, color: '#c9a45c', cs: 500 }),
        T('@brand.mn', 900, 22, { body: 1, color: '#8a8070' })
      ]; } },
    { id: 'giveaway', name: 'Бэлэгтэй тоглоом', cat: 'social', w: 1080, h: 1350, fonts: ['Rubik', 'Inter'], sw: ['#ff4d8d', '#ffe14d', '#2b0f3a'],
      items: function () {
        var o = [BG('#ff4d8d', { grad: lin(90, [[0, '#ff6aa0'], [1, '#e8306f']]), fx: GRAIN }), BLOB(540, 520, 500, '#ffe14d', 0.35)];
        // gift box
        o.push(R(390, 330, 300, 230, '#ffe14d', { rx: 16, name: 'Бэлэг' }), R(370, 280, 340, 70, '#ffd000', { rx: 14, name: 'Бэлэг' }), R(515, 280, 50, 280, '#ff4d8d', { name: 'Тууз' }));
        o.push(C(505, 262, 34, 'transparent', { stroke: '#ffd000', sw: 12, name: 'Тууз' }), C(575, 262, 34, 'transparent', { stroke: '#ffd000', sw: 12, name: 'Тууз' }));
        o.push(STAR(300, 260, 40, '#ffffff', { opacity: 0.9 }), STAR(800, 420, 28, '#ffffff', { opacity: 0.9 }));
        o.push(T('БЭЛЭГТЭЙ\nТОГЛООМ', 640, 120, { weight: 900, color: '#ffffff', lh: 0.95, w: 1000, shadow: { c: 'rgba(43,15,58,.35)', b: 0, x: 6, y: 6 } }));
        ['Хуудсыг дагах', 'Постыг хуваалцах', '2 найзаа таглах'].forEach(function (t, i) {
          var y = 950 + i * 100;
          o.push(C(290, y + 30, 32, '#2b0f3a', { name: 'Дугаар' }), T(String(i + 1), y + 10, 36, { weight: 800, color: '#ffe14d', x: 258, w: 64 }));
          o.push(T(t, y + 10, 40, { body: 1, weight: 700, color: '#ffffff', align: 'left', x: 350, w: 600 }));
        });
        o.push(T('Шалгаруулалт: 11.30', 1270, 28, { body: 1, weight: 600, color: '#2b0f3a' }));
        return o;
      } },
    { id: 'beforeafter', name: 'Өмнө / дараа', cat: 'social', w: 1080, h: 1080, fonts: ['Inter Tight', 'Inter'], sw: ['#111111', '#ffffff', '#ffcc00'],
      items: function () { return [
        BG('#111111'),
        PH(0, 0, 540, 1080, 'ӨМНӨ — зураг', { fill: '#2a2a2a' }), PH(540, 0, 540, 1080, 'ДАРАА — зураг', { fill: '#3a3a3a' }),
        R(537, 0, 6, 1080, '#ffffff', { name: 'Шугам' }), C(540, 540, 44, '#ffffff', { name: 'Бариул' }),
        T('⇆', 510, 44, { body: 1, weight: 700, color: '#111111', x: 496, w: 88 }),
      ].concat(pill(40, 40, 170, 56, 'rgba(0,0,0,0.6)', 'ӨМНӨ', '#ffffff', 22, { cs: 300 }))
        .concat(pill(870, 40, 170, 56, '#ffcc00', 'ДАРАА', '#111111', 22, { cs: 300 }))
        .concat(pill(290, 930, 500, 96, '#ffffff', 'Үр дүнгээ харуул', '#111111', 40, { weight: 800, body: false })); } },
    { id: 'countdown', name: 'Тоолол — story', cat: 'social', w: 1080, h: 1920, fonts: ['Inter Tight', 'Inter'], sw: ['#12002b', '#ff6ad5', '#ffffff'],
      items: function () { return [
        BG('#12002b', { grad: lin(90, [[0, '#2a0066'], [1, '#0a0019']]), fx: GRAIN2 }),
        BLOB(540, 780, 700, '#ff6ad5', 0.4),
        T('ЭХЛЭХЭД', 380, 46, { weight: 800, color: '#ffffff', cs: 600 }),
        T('3', 440, 760, { weight: 900, lh: 1, w: 1000, grad: lin(90, [[0, '#ffffff'], [1, '#ff6ad5']]) }),
        T('ХОНОГ ҮЛДЛЭЭ', 1250, 76, { weight: 900, color: '#ffffff' }),
        T('Шинэ цуглуулга 10.20-нд', 1380, 40, { body: 1, weight: 500, color: '#e6c8ff' })
      ].concat(pill(340, 1560, 400, 90, '#ffffff', 'Сануулах 🔔', '#12002b', 32)); } },
    { id: 'story', name: 'Бүтээгдэхүүн — story', cat: 'social', w: 1080, h: 1920, fonts: ['Geologica', 'Inter'], sw: ['#e9ecff', '#3d3dff', '#0c0c2a'],
      items: function () { return [
        BG('#e9ecff', { fx: GRAIN }),
        BLOB(540, 820, 620, '#3d3dff', 0.35),
        T('ШИНЭ', 170, 36, { body: 1, weight: 700, color: '#3d3dff', cs: 700 }),
        T('Бүтээгдэхүүний\nнэр', 240, 104, { weight: 800, color: '#0c0c2a', lh: 1, w: 1000 }),
        PHOTO(190, 560, 700, 700, 'serum', { mask: 'rounded', r: 60 }),
        T('89,900₮', 1370, 110, { weight: 900, color: '#3d3dff' }),
        T('Хүргэлт үнэгүй · 24 цагт', 1510, 36, { body: 1, color: '#4b4b7a' })
      ].concat(pill(290, 1650, 500, 100, '#0c0c2a', 'Захиалах →', '#ffffff', 36)); } },

    { id: 'quote2', name: 'Ишлэл — уул', cat: 'social', w: 1080, h: 1350, fonts: ['Noto Serif Display', 'Inter'], sw: ['#10161d', '#ffffff', '#9fb4c7'],
      items: function () { return [
        BG('#10161d'), PHOTO(0, 0, 1080, 1350, 'snow'),
        R(0, 0, 1080, 1350, '#0b1118', { opacity: 0.5, name: 'Бараан' }),
        T('“', 300, 220, { weight: 700, color: '#ffffff', lh: 1 }),
        T('Уулын оройд гарахын тулд\nэхний алхмаа хий.', 560, 70, { weight: 500, italic: 1, color: '#ffffff', lh: 1.15, w: 960 }),
        R(500, 800, 80, 2, '#ffffff', { name: 'Шугам' }),
        T('НЭР ОВОГ', 840, 24, { body: 1, weight: 700, color: '#9fb4c7', cs: 500 }),
        T('@brand.mn', 1250, 22, { body: 1, color: '#9fb4c7' })
      ]; } },
    { id: 'story2', name: 'Үдэшлэг — story', cat: 'social', w: 1080, h: 1920, fonts: ['Oswald', 'Inter'], sw: ['#050510', '#29f0ff', '#ffffff'],
      items: function () { return [
        BG('#050510'), PHOTO(0, 0, 1080, 1920, 'city'),
        SCRIM(0, 0, 1080, 960, 90, [[0, '#050510', 0.92], [1, '#050510', 0]]),
        SCRIM(0, 1200, 1080, 720, 90, [[0, '#050510', 0], [0.5, '#050510', 0.85], [1, '#050510', 1]]),
        T('ЭНЭ БААСАН', 220, 44, { body: 1, weight: 700, color: '#29f0ff', cs: 500 }),
        T('ДЭЭВРИЙН\nҮДЭШЛЭГ', 300, 170, { weight: 700, color: '#ffffff', lh: 0.92, w: 1040 }),
        T('21:00 — 02:00', 1460, 60, { weight: 700, color: '#ffffff' }),
        T('DJ · Амьд хөгжим · Коктейль', 1560, 34, { body: 1, color: '#dddddd' })
      ].concat(pill(290, 1680, 500, 100, '#29f0ff', 'Ширээ захиалах', '#050510', 34)); } },
    { id: 'story3', name: 'Хоол — story', cat: 'social', w: 1080, h: 1920, fonts: ['Fira Sans Extra Condensed', 'Inter'], sw: ['#1a120b', '#ffc400', '#ffffff'],
      items: function () { return [
        BG('#1a120b'), PHOTO(0, 380, 1080, 1180, 'burger2'),
        SCRIM(0, 380, 1080, 300, 90, [[0, '#1a120b', 1], [1, '#1a120b', 0]]),
        SCRIM(0, 1260, 1080, 300, 90, [[0, '#1a120b', 0], [1, '#1a120b', 1]]),
        T('ӨНӨӨДРИЙН САНАЛ', 160, 40, { body: 1, weight: 700, color: '#ffc400', cs: 500 }),
        T('КОМБО СЕТ', 220, 170, { weight: 900, color: '#ffffff', lh: 0.9 }),
        T('Бургер + шарсан төмс + ундаа', 1600, 40, { body: 1, weight: 600, color: '#ffffff' }),
        T('19,900₮', 1660, 110, { weight: 900, color: '#ffc400' })
      ].concat(pill(310, 1800, 460, 90, '#ffffff', 'Захиалах →', '#1a120b', 32)); } },
    // ===================== БУСАД ХЭМЖЭЭ =====================
    { id: 'fbcover', name: 'Facebook cover', cat: 'other', w: 1640, h: 624, fonts: ['Inter Tight', 'Inter'], sw: ['#0d0d14', '#8c7bff', '#ffffff'],
      items: function () { return [
        BG('#0d0d14', { fx: GRAIN }), BLOB(1350, 200, 520, '#8c7bff', 0.55), BLOB(1550, 560, 360, '#35e0a1', 0.35),
        T('БРЭНДИЙН НЭР', 170, 120, { weight: 900, color: '#ffffff', align: 'left', x: 420, w: 1100 }),
        T('Юу хийдгээ нэг өгүүлбэрээр — энд бичнэ', 320, 40, { body: 1, color: '#b9b4d6', align: 'left', x: 420, w: 1000 }),
        R(420, 410, 80, 4, '#8c7bff', { name: 'Шугам' }),
        T('brand.mn · 8000 0000', 440, 32, { body: 1, weight: 600, color: '#ffffff', align: 'left', x: 420, w: 1000 })
      ]; } },
    { id: 'yt', name: 'YouTube thumbnail', cat: 'other', w: 1280, h: 720, fonts: ['Fira Sans Extra Condensed', 'Inter'], sw: ['#ffe600', '#0b0b0b', '#ff2d2d'],
      items: function () { return [
        BG('#ffe600', { fx: GRAIN }),
        PH(700, 0, 580, 720, 'Нүүрний зураг (PNG)', { fill: '#f0d600' }),
        T('ГАРЧИГ\nЭНД', 95, 200, { weight: 900, color: '#0b0b0b', align: 'left', x: 60, w: 760, lh: 0.88 }),
        R(60, 540, 440, 100, '#ff2d2d', { angle: -3, c: 1, cx: 280, cy: 590, rx: 10, name: 'Шошго' }),
        T('ДЭД ГАРЧИГ', 555, 60, { weight: 900, color: '#ffffff', x: 60, w: 440, angle: -3, c: 1, cx: 280, cy: 590 })
      ]; } },
    { id: 'card', name: 'Нэрийн хуудас', cat: 'other', w: 1050, h: 600, fonts: ['Inter Tight', 'Inter'], sw: ['#111114', '#d9ff3f', '#ffffff'],
      items: function () { return [
        BG('#111114', { fx: GRAIN }),
        R(0, 0, 18, 600, '#d9ff3f', { name: 'Тууз' }),
        T('Нэр Овог', 150, 76, { weight: 900, color: '#ffffff', align: 'left', x: 90, w: 800 }),
        T('Брэнд дизайнер', 250, 32, { body: 1, weight: 500, color: '#d9ff3f', align: 'left', x: 90, w: 800 }),
        R(90, 330, 90, 2, '#ffffff', { opacity: 0.3, name: 'Шугам' }),
        T('+976 8000 0000\nhello@brand.mn\nbrand.mn', 370, 28, { body: 1, color: '#b5b5bd', align: 'left', x: 90, w: 700, lh: 1.55 }),
        C(890, 460, 70, '#d9ff3f', { name: 'Лого' }), T('B', 425, 64, { weight: 900, color: '#111114', x: 820, w: 140 })
      ]; } },
    { id: 'fbcover2', name: 'Facebook cover — фото', cat: 'other', w: 1640, h: 624, fonts: ['Oswald', 'Inter'], sw: ['#0b0b0b', '#f4a261', '#ffffff'],
      items: function () { return [
        BG('#0b0b0b'), PHOTO(0, 0, 1640, 624, 'eagle'),
        SCRIM(0, 0, 1640, 624, 0, [[0, '#0b0b0b', 0.9], [0.55, '#0b0b0b', 0.25], [1, '#0b0b0b', 0]]),
        T('МОНГОЛ АЯЛАЛ', 180, 120, { weight: 700, color: '#ffffff', align: 'left', x: 420, w: 1100 }),
        T('Тал нутгийн адал явдал — 2026 оны аяллын хөтөлбөр', 330, 34, { body: 1, color: '#e6e6e6', align: 'left', x: 424, w: 900 }),
        T('mongoltravel.mn · 9900 1122', 420, 28, { body: 1, weight: 600, color: '#f4a261', align: 'left', x: 424, w: 900 })
      ]; } },
    { id: 'yt2', name: 'YouTube — фото', cat: 'other', w: 1280, h: 720, fonts: ['Oswald', 'Inter'], sw: ['#000000', '#ffe600', '#ffffff'],
      items: function () { return [
        BG('#000000'), PHOTO(0, 0, 1280, 720, 'study'),
        SCRIM(0, 0, 1280, 720, 0, [[0, '#000000', 0.92], [0.55, '#000000', 0.35], [1, '#000000', 0]]),
        T('IELTS 8.0\nАВСАН АРГА', 90, 150, { weight: 700, color: '#ffffff', lh: 0.9, align: 'left', x: 60, w: 800 }),
        R(60, 470, 360, 96, '#ffe600', { angle: -2, c: 1, cx: 240, cy: 518, rx: 8, name: 'Шошго' }),
        T('3 САРД', 482, 64, { weight: 700, color: '#111111', x: 60, w: 360, angle: -2, c: 1, cx: 240, cy: 518 })
      ]; } }
  ];

  // ---------- specs → fabric objects ----------
  function starPts(r) { var p = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); } return p; }
  function sparkPts(r) { var p = []; for (var i = 0; i < 8; i++) { var a = -Math.PI / 2 + i * Math.PI / 4, rr = i % 2 ? r * 0.18 : r; p.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); } return p; }
  function fabricGrad(g) {
    if (window.GFX && window.GFX.makePaint) return null;   // editor-fx builds it (and knows the descriptor)
    var st = g.stops.map(function (s) { return { offset: s.p, color: s.c, opacity: s.a }; });
    if (g.type === 'radial') return new window.fabric.Gradient({ type: 'radial', gradientUnits: 'percentage', coords: { x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: g.r || 0.5 }, colorStops: st });
    var a = (g.angle || 0) * Math.PI / 180, dx = Math.cos(a) / 2, dy = Math.sin(a) / 2;
    return new window.fabric.Gradient({ type: 'linear', gradientUnits: 'percentage', coords: { x1: 0.5 - dx, y1: 0.5 - dy, x2: 0.5 + dx, y2: 0.5 + dy }, colorStops: st });
  }
  function paint(o, g) {
    if (!g) return;
    o.gPaint = JSON.parse(JSON.stringify(g));
    var p = window.GFX && window.GFX.makePaint ? window.GFX.makePaint(o, g) : fabricGrad(g);
    if (p && !p.then) o.set('fill', p);
  }
  function common(o, s) {
    if (s.fx) o.gFx = JSON.parse(JSON.stringify(s.fx));
    if (s.shadow) o.set('shadow', new window.fabric.Shadow({ color: s.shadow.c || 'rgba(0,0,0,.35)', blur: s.shadow.b || 0, offsetX: s.shadow.x || 0, offsetY: s.shadow.y || 0 }));
    if (s.opacity != null) o.set('opacity', s.opacity);
    if (s.blend) o.set('globalCompositeOperation', s.blend);
    if (s.grad) paint(o, s.grad);
    if (window.GFX && window.GFX.sync) window.GFX.sync(o);
  }
  // font(name) returns a CSS font stack
  function objects(tp, X, Y, font, imgs) {
    var F = window.fabric, out = [];
    font = font || function (n) { return '"' + n + '", sans-serif'; };
    tp.items().forEach(function (s) {
      var o;
      if (s.t === 'bg') {
        o = new F.Rect({ left: X, top: Y, width: tp.w, height: tp.h, fill: s.fill, name: 'Дэвсгэр', strokeWidth: 0 });
      } else if (s.t === 'text') {
        var w = s.w || tp.w * 0.86;
        o = new F.Textbox(s.text, {
          fontFamily: font(s.body ? tp.fonts[1] : tp.fonts[0]), fontWeight: s.weight || (s.body ? 400 : 700), fontStyle: s.italic ? 'italic' : 'normal',
          fontSize: s.size, fill: s.color || '#ffffff', width: w, textAlign: s.align || 'center', lineHeight: s.lh || 1.15, charSpacing: s.cs || 0,
          left: X + (s.x != null ? s.x : (tp.w - w) / 2), top: Y + s.y, name: s.name || 'Текст', splitByGrapheme: false
        });
        if (s.stroke) o.set({ stroke: s.stroke, strokeWidth: s.sw || 2, paintFirst: s.color === 'transparent' ? 'fill' : 'stroke', strokeUniform: true, strokeLineJoin: 'round' });
        if (s.angle) {
          var cx = X + (s.cx != null ? s.cx : (s.x != null ? s.x : (tp.w - w) / 2) + w / 2), cy = Y + (s.cy != null ? s.cy : s.y + s.size * 0.6);
          o.rotate(s.angle); o.setPositionByOrigin(new F.Point(cx, cy), 'center', 'center');
        }
      } else if (s.t === 'rect') {
        o = new F.Rect({ width: s.w, height: s.h, rx: s.rx || 0, ry: s.rx || 0, fill: s.fill, stroke: s.stroke || null, strokeWidth: s.sw || 0, strokeUniform: true, angle: s.angle || 0, name: s.name || 'Хэлбэр' });
        if (s.c) o.set({ originX: 'center', originY: 'center', left: X + (s.cx != null ? s.cx : s.x), top: Y + (s.cy != null ? s.cy : s.y) });
        else o.set({ left: X + s.x, top: Y + s.y });
      } else if (s.t === 'circle') {
        o = new F.Circle({ radius: s.r, fill: s.fill, stroke: s.stroke || null, strokeWidth: s.sw || 0, originX: 'center', originY: 'center', left: X + s.cx, top: Y + s.cy, name: s.name || 'Тойрог' });
      } else if (s.t === 'blob') {
        o = new F.Circle({ radius: s.r, fill: s.c, originX: 'center', originY: 'center', left: X + s.cx, top: Y + s.cy, name: 'Гэрэл' });
        paint(o, { type: 'radial', r: 0.5, stops: [{ p: 0, c: s.c, a: s.a }, { p: 1, c: s.c, a: 0 }] });
      } else if (s.t === 'star' || s.t === 'spark') {
        o = new F.Polygon(s.t === 'star' ? starPts(s.r) : sparkPts(s.r), { fill: s.fill, originX: 'center', originY: 'center', left: X + s.cx, top: Y + s.cy, name: s.t === 'star' ? 'Од' : 'Гялбаа' });
      } else if (s.t === 'photo') {
        var el = imgs && imgs[s.key];
        if (el && el.naturalWidth) {
          var iw = el.naturalWidth, ih = el.naturalHeight, sc = Math.max(s.w / iw, s.h / ih), cw = s.w / sc, ch = s.h / sc;
          var fx = s.fx == null ? 0.5 : s.fx, fy = s.fy == null ? 0.5 : s.fy;
          o = new F.Image(el, { left: X + s.x, top: Y + s.y, cropX: (iw - cw) * fx, cropY: (ih - ch) * fy, width: cw, height: ch, scaleX: sc, scaleY: sc, name: 'Зураг', strokeWidth: 0 });
          o.gCredit = 'Pexels · ' + PX[s.key][1];
          if (s.mask) {
            var m = Math.min(cw, ch), cp = null, oc = { originX: 'center', originY: 'center' };
            if (s.mask === 'circle') cp = new F.Circle(Object.assign({ radius: m / 2 }, oc));
            if (s.mask === 'oval') cp = new F.Ellipse(Object.assign({ rx: cw / 2, ry: ch / 2 }, oc));
            if (s.mask === 'rounded') cp = new F.Rect(Object.assign({ width: cw, height: ch, rx: (s.r || 40) / sc, ry: (s.r || 40) / sc }, oc));
            if (s.mask === 'arch') cp = new F.Path('M ' + (-cw / 2) + ' ' + (ch / 2) + ' L ' + (-cw / 2) + ' ' + (-ch / 2 + cw / 2) + ' A ' + (cw / 2) + ' ' + (cw / 2) + ' 0 0 1 ' + (cw / 2) + ' ' + (-ch / 2 + cw / 2) + ' L ' + (cw / 2) + ' ' + (ch / 2) + ' Z', oc);
            o.set('clipPath', cp); o.gMask = s.mask; o.gMaskR = s.mask === 'rounded' ? (s.r || 40) : null;
          }
        } else {
          // photo could not load: a soft placeholder the user can replace
          o = new F.Rect({ left: X + s.x, top: Y + s.y, width: s.w, height: s.h, rx: s.mask === 'rounded' ? (s.r || 40) : s.mask === 'circle' ? Math.min(s.w, s.h) / 2 : 0, ry: s.mask === 'rounded' ? (s.r || 40) : s.mask === 'circle' ? Math.min(s.w, s.h) / 2 : 0, fill: '#cfd3dc', name: 'Зургийн байр' });
          paint(o, lin(90, [[0, '#d9dde6'], [1, '#aab1c0']]));
        }
        if (s.angle) { o.rotate(s.angle); o.setPositionByOrigin(new F.Point(X + s.x + s.w / 2, Y + s.y + s.h / 2), 'center', 'center'); }
      } else if (s.t === 'ph') {
        o = new F.Rect({ left: X + s.x, top: Y + s.y, width: s.w, height: s.h, rx: s.rx || 0, ry: s.rx || 0, fill: s.fill || '#e5e7eb', name: 'Зургийн байр' });
        out.push(o);
        var fs = Math.round(Math.max(18, Math.min(s.w, s.h) * 0.045));
        o = new F.Textbox('⊕  ' + s.label, { fontFamily: font(tp.fonts[1]), fontSize: fs, fill: 'rgba(90,96,110,0.75)', width: s.w * 0.8, textAlign: 'center',
          left: X + s.x + s.w * 0.1, top: Y + s.y + s.h / 2 - fs * 0.7, name: 'Тайлбар' });
      }
      if (o) { common(o, s); out.push(o); }
    });
    return out;
  }
  var AX = {"Raleway": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "Prata": "", "Forum": "", "Yeseva One": "", "Manrope": "wght@300;400;500;600;700;800", "Comfortaa": "wght@300;400;500;600;700", "Inter Tight": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "Playfair": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,700", "Fira Sans Extra Condensed": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "Noto Serif Display": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,700", "Geologica": "wght@300;400;500;600;700;800;900", "Onest": "wght@300;400;500;600;700;800;900", "Pacifico": "", "Caveat": "wght@400;500;600;700", "Rubik": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "JetBrains Mono": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700", "Montserrat": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "Inter": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "Cormorant Garamond": "ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700", "Oswald": "wght@300;400;500;600;700", "Lora": "ital,wght@0,400;0,500;0,600;0,700;1,400;1,700"};
  function cssUrl(tp) {
    return 'https://fonts.googleapis.com/css2?' + tp.fonts.filter(function (f, i, a) { return a.indexOf(f) === i; }).map(function (f) {
      var ax = AX[f]; return 'family=' + f.replace(/ /g, '+') + (ax ? ':' + ax : '');
    }).join('&') + '&display=swap';
  }
  var imgCache = {};
  function loadImg(url) {
    if (imgCache[url]) return imgCache[url];
    imgCache[url] = new Promise(function (res) {
      var im = new Image(), done = false, fin = function (ok) { if (done) return; done = true; if (!ok) delete imgCache[url]; res(ok ? im : null); };
      im.crossOrigin = 'anonymous';
      im.onload = function () { fin(true); }; im.onerror = function () { fin(false); };
      setTimeout(function () { fin(false); }, 15000);
      im.src = url;
    });
    return imgCache[url];
  }
  function photosOf(tp) { var k = []; tp.items().forEach(function (s) { if (s.t === 'photo' && k.indexOf(s.key) < 0) k.push(s.key); }); return k; }
  // async: loads the template's photos first (w = requested pixel width), then builds the objects
  function build(tp, X, Y, font, w) {
    var keys = photosOf(tp), imgs = {};
    return Promise.all(keys.map(function (k) { return loadImg(pxUrl(k, w)).then(function (im) { imgs[k] = im; }); }))
      .then(function () { return objects(tp, X, Y, font, imgs); });
  }
  LIST.forEach(function (t) { if (!t.bg) t.bg = t.sw[0]; t.photos = photosOf(t); t.credits = t.photos.map(function (k) { return PX[k][1]; }); });
  window.GTPL = { list: LIST, cats: CATS, get: function (id) { return LIST.filter(function (t) { return t.id === id; })[0]; }, objects: objects, build: build, photoUrl: pxUrl, cssUrl: cssUrl,
    H: { T: T, R: R, C: C, BLOB: BLOB, BG: BG, PH: PH, STAR: STAR, SPARK: SPARK, PHOTO: PHOTO, SCRIM: SCRIM, lin: lin, rad: rad, pill: pill, GRAIN: GRAIN, GRAIN2: GRAIN2 },
    photosOf: photosOf, decks: [] };
})();
