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
        PH(300, 250, 480, 640, 'Зургаа энд чирж тавина', { rx: 240, fill: '#e9c3c8' }),
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
        o.push(PH(340, 560, 400, 400, 'Зураг', { rx: 200, fill: '#34236a' }));
        o.push(C(540, 760, 216, 'transparent', { stroke: '#ffcf5c', sw: 6, name: 'Хүрээ' }));
        o.push(T('Төрсөн өдрийн', 190, 110, { color: '#ffcf5c', w: 1000, lh: 1.1 }));
        o.push(T('мэнд хүргэе!', 330, 110, { color: '#ff7eb6', w: 1000, lh: 1.1 }));
        o.push(T('Нэр Овог', 1020, 64, { body: 1, weight: 800, color: '#ffffff' }));
        o.push(T('Бүх хүсэл мөрөөдөл чинь биелээсэй', 1110, 30, { body: 1, color: '#c9bff0', w: 860 }));
        return o;
      } },

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
        PH(560, 80, 440, 920, 'Бүтээгдэхүүний зураг', { rx: 220, fill: '#dccfbd' }),
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
        PH(50, 50, 980, 700, 'Бүтээгдэхүүний зураг', { rx: 40, fill: '#dedcd6' }),
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
        PH(470, 240, 580, 580, 'Кофены зураг (PNG, тунгалаг)', { rx: 290, fill: 'rgba(255,255,255,0.35)' }),
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
        PH(0, 0, 1080, 760, 'Байрны зургаа энд чирж тавина', { fill: '#e2e6e3' }),
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
        o.push(C(126, 920, 46, '#1a1a1a', { name: 'Зураг' }), T('Б', 894, 44, { body: 1, weight: 700, color: '#ffffff', x: 80, w: 92 }));
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
        PH(120, 520, 840, 900, 'Салбарын зураг', { rx: 420, fill: '#e2d6c4' }),
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
        PH(190, 560, 700, 700, 'Бүтээгдэхүүний зураг (PNG)', { rx: 60, fill: 'rgba(255,255,255,0.55)' }),
        T('89,900₮', 1370, 110, { weight: 900, color: '#3d3dff' }),
        T('Хүргэлт үнэгүй · 24 цагт', 1510, 36, { body: 1, color: '#4b4b7a' })
      ].concat(pill(290, 1650, 500, 100, '#0c0c2a', 'Захиалах →', '#ffffff', 36)); } },

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
    if (s.grad) paint(o, s.grad);
    if (window.GFX && window.GFX.sync) window.GFX.sync(o);
  }
  // font(name) returns a CSS font stack
  function objects(tp, X, Y, font) {
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
  var AX = {"Inter Tight": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "Playfair": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,700", "Fira Sans Extra Condensed": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "Noto Serif Display": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,700", "Geologica": "wght@300;400;500;600;700;800;900", "Onest": "wght@300;400;500;600;700;800;900", "Pacifico": "", "Caveat": "wght@400;500;600;700", "Rubik": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "JetBrains Mono": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,700", "Montserrat": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "Inter": "ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700", "Cormorant Garamond": "ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700", "Oswald": "wght@300;400;500;600;700", "Lora": "ital,wght@0,400;0,500;0,600;0,700;1,400;1,700"};
  function cssUrl(tp) {
    return 'https://fonts.googleapis.com/css2?' + tp.fonts.filter(function (f, i, a) { return a.indexOf(f) === i; }).map(function (f) {
      var ax = AX[f]; return 'family=' + f.replace(/ /g, '+') + (ax ? ':' + ax : '');
    }).join('&') + '&display=swap';
  }
  LIST.forEach(function (t) { if (!t.bg) t.bg = t.sw[0]; });
  window.GTPL = { list: LIST, cats: CATS, get: function (id) { return LIST.filter(function (t) { return t.id === id; })[0]; }, objects: objects, cssUrl: cssUrl };
})();
