/* Graphican — илтгэлийн (PPT) загварууд. 1920×1080 слайдууд; templates.js-ийн ижил хөдөлгүүрээр (GTPL.build) зурна.
   Deck бүр: нэг өнгө, фонтын систем + 7 слайдын бүтэц (нүүр, агуулга, текст+зураг, тоо, …, баярлалаа). */
(function () {
  'use strict';
  var G = window.GTPL; if (!G || !G.H) return;
  var H = G.H, T = H.T, R = H.R, C = H.C, BLOB = H.BLOB, BG = H.BG, PH = H.PH, PHOTO = H.PHOTO, SCRIM = H.SCRIM, lin = H.lin, pill = H.pill, GRAIN = H.GRAIN, SPARK = H.SPARK;
  var W = 1920, HH = 1080;
  function flat(a) { return a.reduce(function (x, y) { return x.concat(y); }, []); }
  function L(text, y, size, x, w, o) { o = o || {}; o.align = o.align || 'left'; o.x = x; o.w = w; return T(text, y, size, o); }

  var DECKS = [
    // ======================= РЕСТОРАН — ногоон, алтан =======================
    { id: 'resto', tag: 'Ресторан', name: 'Ресторан — ногоон, алтан', fonts: ['Cormorant Garamond', 'Montserrat'], sw: ['#1c2a22', '#c9a45c', '#f3ead8'], slides: [
      { name: 'Нүүр', items: function () { return [
        BG('#1c2a22'), PHOTO(0, 0, W, HH, 'pizza2'), R(0, 0, W, HH, '#0e1712', { opacity: 0.45, name: 'Бараан' }),
        R(560, 0, 800, HH, '#1c2a22', { opacity: 0.88, name: 'Панел' }),
        R(860, 250, 200, 1.5, '#c9a45c', { name: 'Шугам' }), R(860, 830, 200, 1.5, '#c9a45c', { name: 'Шугам' }),
        T('ТАНЫ ЛОГО', 330, 26, { body: 1, weight: 600, color: '#c9a45c', cs: 500 }),
        T('Ларана', 390, 210, { weight: 500, color: '#f3ead8', lh: 1, w: 780, x: 570 }),
        T('РЕСТОРАН & КАФЕ', 660, 40, { body: 1, weight: 500, color: '#f3ead8', cs: 500, w: 780, x: 570 })
      ]; } },
      { name: 'Бидний тухай', items: function () { return [
        BG('#1c2a22', { fx: GRAIN }), PHOTO(0, 0, 860, HH, 'barista'),
        L('БИДНИЙ ТУХАЙ', 190, 26, 980, 800, { body: 1, weight: 600, color: '#c9a45c', cs: 500 }),
        L('Амт, уур амьсгал,\nхалуун дотно үйлчилгээ', 250, 70, 976, 900, { weight: 500, italic: 1, color: '#f3ead8', lh: 1.02 }),
        L('Бид 2015 оноос хойш улирлын шинэ орц, гар аргаар бэлтгэсэн амттанаар зочдоо угтаж байна. Манай тогооч нар өдөр бүр шинэхэн хоол бэлтгэдэг.', 480, 28, 980, 780, { body: 1, color: '#b9c2b8', lh: 1.6 }),
        R(980, 760, 780, 1, '#c9a45c', { opacity: 0.5, name: 'Шугам' }),
        L('2015', 800, 64, 980, 260, { weight: 600, color: '#c9a45c' }), L('онд нээгдсэн', 890, 22, 980, 260, { body: 1, color: '#b9c2b8' }),
        L('40+', 800, 64, 1240, 260, { weight: 600, color: '#c9a45c' }), L('төрлийн хоол', 890, 22, 1240, 260, { body: 1, color: '#b9c2b8' }),
        L('4.9★', 800, 64, 1500, 260, { weight: 600, color: '#c9a45c' }), L('зочдын үнэлгээ', 890, 22, 1500, 260, { body: 1, color: '#b9c2b8' })
      ]; } },
      { name: 'Онцлох цэс', items: function () {
        var o = [BG('#1c2a22', { fx: GRAIN }), T('ОНЦЛОХ ЦЭС', 110, 26, { body: 1, weight: 600, color: '#c9a45c', cs: 500 }), T('Тогоочийн сонголт', 150, 90, { weight: 500, italic: 1, color: '#f3ead8' })];
        [['latte', 'Латте', '6,500₮'], ['pizza', 'Пицца', '24,900₮'], ['burger2', 'Бургер сет', '19,900₮']].forEach(function (d, i) {
          var cx = 400 + i * 560;
          o.push(C(cx, 530, 200, 'transparent', { stroke: '#c9a45c', sw: 1.5, name: 'Хүрээ' }));
          o.push(PHOTO(cx - 185, 345, 370, 370, d[0], { mask: 'circle' }));
          o.push(T(d[1], 770, 52, { weight: 600, color: '#f3ead8', x: cx - 250, w: 500 }));
          o.push(T(d[2], 850, 30, { body: 1, weight: 600, color: '#c9a45c', x: cx - 250, w: 500 }));
        });
        return o;
      } },
      { name: 'Онцлох хоол', items: function () { return [
        BG('#1c2a22'), PHOTO(960, 0, 960, HH, 'burger'),
        L('ЭНЭ ДОЛОО ХОНОГИЙН', 250, 26, 140, 700, { body: 1, weight: 600, color: '#c9a45c', cs: 500 }),
        L('Хамгийн их\nзахиалагдсан', 310, 100, 136, 780, { weight: 500, color: '#f3ead8', lh: 1 }),
        L('★★★★★', 560, 36, 140, 400, { body: 1, color: '#c9a45c', cs: 200 }),
        L('Утсан үхрийн мах, чеддар бяслаг, гар аргаар хийсэн соус.', 630, 28, 140, 640, { body: 1, color: '#b9c2b8', lh: 1.55 }),
        L('19,900₮', 780, 72, 140, 500, { weight: 600, color: '#c9a45c' })
      ]; } },
      { name: 'Ишлэл', items: function () { return [
        BG('#0e1712'), PHOTO(0, 0, W, HH, 'latte'), R(0, 0, W, HH, '#0e1712', { opacity: 0.72, name: 'Бараан' }),
        T('“', 250, 200, { weight: 600, color: '#c9a45c', lh: 1 }),
        T('Сайхан хоол бол\nхүмүүсийг холбодог урлаг.', 440, 96, { weight: 500, italic: 1, color: '#f3ead8', lh: 1.1, w: 1500 }),
        T('— ТОГООЧ', 760, 26, { body: 1, weight: 600, color: '#c9a45c', cs: 500 })
      ]; } },
      { name: 'Манай баг', items: function () {
        var o = [BG('#1c2a22', { fx: GRAIN }), T('МАНАЙ БАГ', 120, 26, { body: 1, weight: 600, color: '#c9a45c', cs: 500 }), T('Мэргэжлийн хамт олон', 160, 88, { weight: 500, italic: 1, color: '#f3ead8' })];
        ['Ерөнхий тогооч', 'Бариста', 'Кондитер', 'Менежер'].forEach(function (r, i) {
          var cx = 330 + i * 420;
          o.push(PH(cx - 140, 370, 280, 280, 'Зураг', { rx: 140, fill: '#2a3a31' }));
          o.push(T('Нэр Овог', 690, 40, { weight: 600, color: '#f3ead8', x: cx - 200, w: 400 }));
          o.push(T(r, 750, 24, { body: 1, color: '#c9a45c', x: cx - 200, w: 400 }));
        });
        return o;
      } },
      { name: 'Баярлалаа', items: function () { return [
        BG('#1c2a22', { fx: GRAIN }),
        R(860, 300, 200, 1.5, '#c9a45c', { name: 'Шугам' }),
        T('Баярлалаа', 360, 180, { weight: 500, italic: 1, color: '#f3ead8' }),
        T('Сүхбаатар дүүрэг, Их тойруу 12  ·  7700 1122  ·  @larana.mn', 650, 30, { body: 1, color: '#c9a45c', w: 1600 }),
        R(860, 760, 200, 1.5, '#c9a45c', { name: 'Шугам' })
      ]; } }
    ] },

    // ======================= БИЗНЕС — минимал цэнхэр =======================
    { id: 'biz', tag: 'Бизнес', name: 'Бизнес — минимал цэнхэр', fonts: ['Inter Tight', 'Inter'], sw: ['#ffffff', '#1646ff', '#0b1033'], slides: [
      { name: 'Нүүр', items: function () { return flat([
        BG('#ffffff'), PHOTO(1000, 60, 860, 960, 'team', { mask: 'rounded', r: 40 }),
        pill(120, 150, 300, 60, '#eef2ff', '2026 · СТРАТЕГИ', '#1646ff', 22, { cs: 150 }),
        L('Компанийн\nтанилцуулга', 270, 124, 114, 860, { weight: 800, color: '#0b1033', lh: 1 }),
        L('Бид таны бизнесийг дараагийн шатанд гаргана', 580, 32, 120, 800, { body: 1, color: '#5a6178' }),
        R(120, 800, 60, 4, '#1646ff', { name: 'Шугам' }),
        L('Илтгэгч: Нэр Овог', 840, 28, 120, 700, { body: 1, weight: 600, color: '#0b1033' }),
        L('2026.10.01 · Улаанбаатар', 885, 24, 120, 700, { body: 1, color: '#5a6178' })
      ]); } },
      { name: 'Агуулга', items: function () {
        var o = [BG('#ffffff'), L('Агуулга', 120, 96, 120, 900, { weight: 800, color: '#0b1033' })];
        [['01', 'Бидний тухай', 'Эрхэм зорилго, үнэ цэнэ'], ['02', 'Зах зээл', 'Боломж ба өрсөлдөгчид'], ['03', 'Шийдэл', 'Бүтээгдэхүүн, үйлчилгээ'], ['04', 'Төлөвлөгөө', '2026–2027 оны зорилт']].forEach(function (d, i) {
          var x = 120 + (i % 2) * 860, y = 340 + Math.floor(i / 2) * 300;
          o.push(R(x, y, 800, 250, '#f5f7ff', { rx: 28, name: 'Карт' }));
          o.push(L(d[0], y + 40, 64, x + 50, 200, { weight: 800, color: '#1646ff' }));
          o.push(L(d[1], y + 60, 44, x + 230, 540, { weight: 700, color: '#0b1033' }));
          o.push(L(d[2], y + 130, 26, x + 230, 540, { body: 1, color: '#5a6178' }));
        });
        return o;
      } },
      { name: 'Асуудал / шийдэл', items: function () { return [
        BG('#ffffff'), L('Асуудал ба шийдэл', 120, 80, 120, 1600, { weight: 800, color: '#0b1033' }),
        R(120, 300, 810, 640, '#f5f7ff', { rx: 32, name: 'Карт' }), R(990, 300, 810, 640, '#1646ff', { rx: 32, name: 'Карт' }),
        L('АСУУДАЛ', 360, 24, 180, 700, { body: 1, weight: 700, color: '#ff5a36', cs: 300 }),
        L('Жижиг бизнесүүд\nонлайн борлуулалтаа\nхянаж чаддаггүй', 410, 52, 180, 700, { weight: 700, color: '#0b1033', lh: 1.15 }),
        L('• Мэдээлэл тарамдсан\n• Гар ажиллагаа их\n• Шийдвэр гаргахад удаан', 680, 30, 180, 700, { body: 1, color: '#5a6178', lh: 1.6 }),
        L('ШИЙДЭЛ', 360, 24, 1050, 700, { body: 1, weight: 700, color: '#bcd0ff', cs: 300 }),
        L('Бүх борлуулалтыг\nнэг самбараас\nхарах платформ', 410, 52, 1050, 700, { weight: 700, color: '#ffffff', lh: 1.15 }),
        L('• Бодит цагийн тайлан\n• Автомат нэхэмжлэл\n• Ухаалаг зөвлөмж', 680, 30, 1050, 700, { body: 1, color: '#dfe6ff', lh: 1.6 })
      ]; } },
      { name: 'Тоон үзүүлэлт', items: function () {
        var o = [BG('#0b1033'), L('Үр дүн тоогоор', 120, 80, 120, 1600, { weight: 800, color: '#ffffff' })];
        [['+240%', 'Борлуулалтын өсөлт'], ['12K', 'Идэвхтэй хэрэглэгч'], ['98%', 'Сэтгэл ханамж']].forEach(function (d, i) {
          var x = 120 + i * 580;
          o.push(L(d[0], 330, 140, x, 540, { weight: 800, color: i === 0 ? '#6f8dff' : '#ffffff' }));
          o.push(R(x, 520, 480, 2, '#ffffff', { opacity: 0.2, name: 'Шугам' }));
          o.push(L(d[1], 550, 30, x, 520, { body: 1, color: '#aab3d6' }));
        });
        [120, 170, 150, 230, 210, 290, 330].forEach(function (h, i) { o.push(R(120 + i * 120, 960 - h, 80, h, i === 6 ? '#1646ff' : '#26306b', { rx: 10, name: 'Багана' })); });
        o.push(L('Сүүлийн 7 улирлын орлого', 700, 26, 1100, 700, { body: 1, color: '#aab3d6' }));
        o.push(L('Тогтвортой өсөлт, 2026 онд 2 дахин нэмэгдүүлэх зорилттой.', 760, 34, 1100, 680, { body: 1, weight: 600, color: '#ffffff', lh: 1.4 }));
        return o;
      } },
      { name: 'Давуу тал', items: function () {
        var o = [BG('#ffffff'), PHOTO(0, 0, 820, HH, 'study'), L('Бидний давуу тал', 150, 80, 920, 900, { weight: 800, color: '#0b1033' })];
        [['Хурдан', 'Нэвтрүүлэлт 7 хоногт'], ['Найдвартай', '99.9% ажиллагаа'], ['Дэмжлэг', '24/7 монгол хэлээр']].forEach(function (d, i) {
          var y = 360 + i * 200;
          o.push(C(955, y + 40, 36, '#eef2ff', { name: 'Тэмдэг' }), T(String(i + 1), y + 18, 36, { weight: 800, color: '#1646ff', x: 919, w: 72 }));
          o.push(L(d[0], y, 44, 1030, 760, { weight: 700, color: '#0b1033' }));
          o.push(L(d[1], y + 65, 28, 1030, 760, { body: 1, color: '#5a6178' }));
        });
        return o;
      } },
      { name: 'Замын зураг', items: function () {
        var o = [BG('#ffffff'), L('Замын зураг 2026', 120, 80, 120, 1600, { weight: 800, color: '#0b1033' }), R(160, 560, 1600, 4, '#dfe6ff', { name: 'Шугам' })];
        [['Q1', 'Судалгаа', 'Хэрэглэгчийн судалгаа'], ['Q2', 'MVP', 'Эхний хувилбар'], ['Q3', 'Өсөлт', 'Маркетинг, түнш'], ['Q4', 'Тэлэлт', 'Шинэ зах зээл']].forEach(function (d, i) {
          var cx = 260 + i * 460;
          o.push(C(cx, 562, 30, i < 2 ? '#1646ff' : '#ffffff', { stroke: '#1646ff', sw: 4, name: 'Цэг' }));
          o.push(T(d[0], 400, 60, { weight: 800, color: '#1646ff', x: cx - 200, w: 400 }));
          o.push(T(d[1], 640, 40, { weight: 700, color: '#0b1033', x: cx - 200, w: 400 }));
          o.push(T(d[2], 700, 26, { body: 1, color: '#5a6178', x: cx - 200, w: 400 }));
        });
        return o;
      } },
      { name: 'Баярлалаа', items: function () { return [
        BG('#1646ff'), C(1650, 180, 420, '#ffffff', { opacity: 0.06, name: 'Тойрог' }), C(1800, 900, 260, '#ffffff', { opacity: 0.06, name: 'Тойрог' }),
        L('Баярлалаа!', 330, 170, 114, 1500, { weight: 800, color: '#ffffff' }),
        L('Асуулт байвал холбогдоорой', 560, 36, 120, 1200, { body: 1, color: '#dfe6ff' }),
        L('hello@company.mn  ·  +976 8000 0000  ·  company.mn', 760, 32, 120, 1500, { body: 1, weight: 600, color: '#ffffff' })
      ]; } }
    ] },

    // ======================= КРЕАТИВ — gradient =======================
    { id: 'creative', tag: 'Креатив', name: 'Креатив — gradient', fonts: ['Geologica', 'Inter'], sw: ['#0e0b1f', '#7b61ff', '#ff6ad5'], slides: [
      { name: 'Нүүр', items: function () { return flat([
        BG('#0e0b1f', { fx: H.GRAIN2 }), BLOB(1500, 250, 700, '#7b61ff', 0.75), BLOB(1700, 900, 520, '#ff6ad5', 0.55), BLOB(300, 1000, 500, '#2bd4ff', 0.25),
        pill(120, 140, 280, 60, 'rgba(255,255,255,0.08)', 'CREATIVE DECK', '#ffffff', 22, { cs: 200, stroke: 'rgba(255,255,255,0.25)', sw: 1.5 }),
        L('Брэнд\nстратеги', 270, 190, 110, 1400, { weight: 800, color: '#ffffff', lh: 0.95 }),
        L('2026', 700, 150, 116, 700, { weight: 800, color: 'transparent', stroke: '#ffffff', sw: 2 }),
        L('Студийн нэр  ·  studio.mn', 940, 28, 120, 900, { body: 1, color: '#b9b4d6' })
      ]); } },
      { name: 'Бидний хийдэг', items: function () {
        var o = [BG('#0e0b1f', { fx: H.GRAIN2 }), BLOB(960, 1100, 800, '#7b61ff', 0.4), L('Бидний хийдэг', 120, 84, 120, 1600, { weight: 800, color: '#ffffff' })];
        [['Брэндинг', 'Лого, өнгө, фонт, брэнд бук', '#7b61ff'], ['Контент', 'Сошиал пост, видео, зураг авалт', '#ff6ad5'], ['Дижитал', 'Вэбсайт, апп, UX/UI', '#d9ff3f']].forEach(function (d, i) {
          var x = 120 + i * 570;
          o.push(R(x, 330, 530, 560, '#ffffff', { rx: 36, opacity: 0.06, name: 'Карт' }));
          o.push(R(x, 330, 530, 560, 'transparent', { rx: 36, stroke: '#ffffff', sw: 1.5, opacity: 0.2, name: 'Хүрээ' }));
          o.push(C(x + 100, 440, 50, d[2], { name: 'Тэмдэг' }));
          o.push(L('0' + (i + 1), 700 - 150, 30, x + 50, 400, { body: 1, weight: 700, color: '#b9b4d6' }));
          o.push(L(d[0], 610, 56, x + 50, 440, { weight: 800, color: '#ffffff' }));
          o.push(L(d[1], 700, 28, x + 50, 440, { body: 1, color: '#b9b4d6', lh: 1.5 }));
        });
        return o;
      } },
      { name: 'Том санаа', items: function () { return [
        BG('#0e0b1f', { fx: H.GRAIN2 }), BLOB(300, 200, 600, '#ff6ad5', 0.45), BLOB(1650, 900, 700, '#7b61ff', 0.55),
        T('Бид санааг\nбодит болгодог.', 330, 150, { weight: 800, lh: 1.02, w: 1700, grad: lin(0, [[0, '#ffffff'], [0.6, '#d8c9ff'], [1, '#ff6ad5']]) })
      ]; } },
      { name: 'Кейс', items: function () { return [
        BG('#0e0b1f', { fx: H.GRAIN2 }), PHOTO(1000, 80, 800, 920, 'city', { mask: 'rounded', r: 36 }),
        L('КЕЙС · 2025', 150, 24, 120, 800, { body: 1, weight: 700, color: '#d9ff3f', cs: 300 }),
        L('Шинэ брэнд,\nшинэ хэрэглэгч', 200, 96, 116, 860, { weight: 800, color: '#ffffff', lh: 1.02 }),
        L('Хот суурин брэндийн дахин брэндинг — лого, өнгө, сошиал стратеги.', 450, 30, 120, 760, { body: 1, color: '#b9b4d6', lh: 1.5 }),
        L('+240%', 650, 120, 116, 500, { weight: 800, grad: lin(0, [[0, '#7b61ff'], [1, '#ff6ad5']]) }),
        L('сошиал хандалт', 800, 28, 120, 500, { body: 1, color: '#b9b4d6' }),
        L('3×', 650, 120, 660, 400, { weight: 800, color: '#d9ff3f' }),
        L('борлуулалт', 800, 28, 664, 400, { body: 1, color: '#b9b4d6' })
      ]; } },
      { name: 'Процесс', items: function () {
        var o = [BG('#0e0b1f', { fx: H.GRAIN2 }), L('Ажлын процесс', 120, 84, 120, 1600, { weight: 800, color: '#ffffff' }), R(240, 520, 1440, 2, '#ffffff', { opacity: 0.18, name: 'Шугам' })];
        [['Судлах', 'Брэнд, зах зээл'], ['Санаа', 'Концепц, мудборд'], ['Бүтээх', 'Дизайн, контент'], ['Хүргэх', 'Нэвтрүүлэх, хэмжих']].forEach(function (d, i) {
          var cx = 240 + i * 480, col = ['#7b61ff', '#ff6ad5', '#d9ff3f', '#2bd4ff'][i];
          o.push(C(cx, 520, 70, col, { name: 'Алхам' }));
          o.push(T(String(i + 1), 482, 64, { weight: 800, color: '#0e0b1f', x: cx - 70, w: 140 }));
          o.push(T(d[0], 640, 48, { weight: 800, color: '#ffffff', x: cx - 220, w: 440 }));
          o.push(T(d[1], 710, 26, { body: 1, color: '#b9b4d6', x: cx - 220, w: 440 }));
        });
        return o;
      } },
      { name: 'Үйлчлүүлэгчид', items: function () {
        var o = [BG('#0e0b1f', { fx: H.GRAIN2 }), T('Бидэнд итгэсэн брэндүүд', 150, 72, { weight: 800, color: '#ffffff' })];
        for (var i = 0; i < 8; i++) {
          var x = 160 + (i % 4) * 410, y = 380 + Math.floor(i / 4) * 260;
          o.push(R(x, y, 370, 200, '#ffffff', { rx: 24, opacity: 0.06, name: 'Лого' }));
          o.push(T('ЛОГО', y + 76, 36, { weight: 800, color: '#6e6890', x: x, w: 370, cs: 300 }));
        }
        return o;
      } },
      { name: 'Хамтран ажиллая', items: function () { return [
        BG('#0e0b1f', { fx: H.GRAIN2 }), BLOB(960, 540, 900, '#7b61ff', 0.5), BLOB(1500, 200, 500, '#ff6ad5', 0.4),
        T('Хамтран\nажиллая', 250, 190, { weight: 800, color: '#ffffff', lh: 0.95 }),
        T('hello@studio.mn  ·  @studio.mn', 740, 36, { body: 1, weight: 600, color: '#ffffff' })
      ]; } }
    ] },

    // ======================= БОЛОВСРОЛ — дулаан =======================
    { id: 'edu', tag: 'Боловсрол', name: 'Боловсрол — хичээл', fonts: ['Rubik', 'Onest'], sw: ['#fff6e5', '#ff7a1a', '#1b1b3a'], slides: [
      { name: 'Нүүр', items: function () { return flat([
        BG('#fff6e5'), C(1480, 540, 470, '#ffd9b3', { name: 'Тойрог' }), PHOTO(1060, 120, 840, 840, 'student', { mask: 'circle' }),
        C(160, 900, 60, '#06a77d', { name: 'Хэлбэр' }), R(820, 120, 70, 70, '#ff7a1a', { rx: 14, angle: 20, name: 'Хэлбэр' }),
        pill(120, 190, 320, 64, '#1b1b3a', 'ХИЧЭЭЛ 1 · 10-р анги', '#ffffff', 22),
        L('Хичээлийн\nсэдэв энд', 310, 130, 114, 900, { weight: 800, color: '#1b1b3a', lh: 1 }),
        L('Багш: Нэр Овог  ·  2026 он', 640, 32, 120, 800, { body: 1, weight: 600, color: '#ff7a1a' })
      ]); } },
      { name: 'Зорилго', items: function () {
        var o = [BG('#fff6e5'), L('Хичээлийн зорилго', 120, 84, 120, 1600, { weight: 800, color: '#1b1b3a' })];
        ['Үндсэн ойлголтуудыг тайлбарлаж чаддаг болно', 'Жишээн дээр дүн шинжилгээ хийнэ', 'Бие даан бодлого бодож дадлага хийнэ'].forEach(function (t, i) {
          var y = 330 + i * 200, col = ['#ff7a1a', '#06a77d', '#3a86ff'][i];
          o.push(R(120, y, 1680, 160, '#ffffff', { rx: 28, name: 'Карт' }));
          o.push(C(220, y + 80, 48, col, { name: 'Тоо' }), T(String(i + 1), y + 52, 48, { weight: 800, color: '#ffffff', x: 172, w: 96 }));
          o.push(L(t, y + 55, 40, 320, 1400, { body: 1, weight: 600, color: '#1b1b3a' }));
        });
        return o;
      } },
      { name: 'Тодорхойлолт', items: function () { return [
        BG('#1b1b3a'), C(1750, 150, 300, '#ff7a1a', { opacity: 0.2, name: 'Тойрог' }),
        L('ТОДОРХОЙЛОЛТ', 200, 26, 160, 900, { body: 1, weight: 700, color: '#ff9d4d', cs: 400 }),
        L('Фотосинтез', 250, 140, 154, 1600, { weight: 800, color: '#ffffff' }),
        R(160, 480, 1600, 380, '#ffffff', { rx: 32, opacity: 0.08, name: 'Карт' }),
        L('Ургамал нарны гэрлийн энергийг ашиглан ус, нүүрсхүчлийн хийгээс глюкоз болон хүчилтөрөгч үүсгэдэг процесс.', 540, 44, 220, 1480, { body: 1, color: '#ffffff', lh: 1.45 })
      ]; } },
      { name: 'Харьцуулалт', items: function () {
        var o = [BG('#fff6e5'), L('Харьцуулалт', 120, 84, 120, 1600, { weight: 800, color: '#1b1b3a' }),
          R(120, 300, 820, 660, '#ffffff', { rx: 32, name: 'Карт' }), R(980, 300, 820, 660, '#ffffff', { rx: 32, name: 'Карт' }),
          R(120, 300, 820, 120, '#ff7a1a', { rx: 32, name: 'Толгой' }), R(980, 300, 820, 120, '#06a77d', { rx: 32, name: 'Толгой' }),
          T('А хувилбар', 330, 48, { weight: 800, color: '#ffffff', x: 120, w: 820 }), T('Б хувилбар', 330, 48, { weight: 800, color: '#ffffff', x: 980, w: 820 })];
        ['Шинж чанар 1', 'Шинж чанар 2', 'Шинж чанар 3', 'Шинж чанар 4'].forEach(function (t, i) {
          var y = 470 + i * 118;
          o.push(L('✓  ' + t, y, 34, 190, 700, { body: 1, color: '#1b1b3a' }), L('✓  ' + t, y, 34, 1050, 700, { body: 1, color: '#1b1b3a' }));
        });
        return o;
      } },
      { name: 'Зураг + тайлбар', items: function () { return [
        BG('#fff6e5'), PHOTO(120, 120, 840, 840, 'study', { mask: 'rounded', r: 40 }),
        L('Жишээ', 180, 26, 1060, 700, { body: 1, weight: 700, color: '#ff7a1a', cs: 300 }),
        L('Бодит амьдрал\nдээрх хэрэглээ', 230, 84, 1056, 760, { weight: 800, color: '#1b1b3a', lh: 1.05 }),
        L('Энд жишээний тайлбарыг бичнэ. Сурагчид өөрсдийн амьдралаас ижил төстэй жишээ олж ярилцана.', 480, 32, 1060, 740, { body: 1, color: '#4a4a66', lh: 1.55 }),
        R(1060, 760, 700, 150, '#ffe3c7', { rx: 24, name: 'Карт' }),
        L('💡  Санамж: гол нэр томьёог тодруулж бичээрэй', 812, 28, 1100, 640, { body: 1, weight: 600, color: '#1b1b3a' })
      ]; } },
      { name: 'Асуулт', items: function () {
        var o = [BG('#1b1b3a'), T('Асуулт', 110, 36, { body: 1, weight: 700, color: '#ff9d4d', cs: 300 }), T('Фотосинтезийн үр дүнд юу үүсдэг вэ?', 170, 72, { weight: 800, color: '#ffffff', w: 1600 })];
        [['A', 'Хүчилтөрөгч', '#ff7a1a'], ['B', 'Азот', '#3a86ff'], ['C', 'Устөрөгч', '#06a77d'], ['D', 'Гелий', '#ffbe0b']].forEach(function (d, i) {
          var x = 160 + (i % 2) * 820, y = 420 + Math.floor(i / 2) * 270;
          o.push(R(x, y, 780, 220, d[2], { rx: 28, name: 'Хариулт' }));
          o.push(L(d[0], y + 70, 72, x + 50, 120, { weight: 800, color: '#ffffff' }));
          o.push(L(d[1], y + 80, 52, x + 170, 580, { weight: 700, color: '#ffffff' }));
        });
        return o;
      } },
      { name: 'Дүгнэлт', items: function () { return [
        BG('#ff7a1a'), C(1700, 950, 400, '#ffffff', { opacity: 0.12, name: 'Тойрог' }), C(200, 120, 200, '#ffffff', { opacity: 0.12, name: 'Тойрог' }),
        T('Анхаарал тавьсанд\nбаярлалаа!', 330, 130, { weight: 800, color: '#ffffff', lh: 1.02, w: 1700 }),
        T('Гэрийн даалгавар: 24-р хуудас, 1–5 дасгал', 720, 36, { body: 1, weight: 600, color: '#fff1e2' })
      ]; } }
    ] },

    // ======================= МОНГОЛ — байгаль, аялал =======================
    { id: 'mongolia', tag: 'Аялал', name: 'Монгол — аялал, байгаль', fonts: ['Oswald', 'Inter'], sw: ['#141414', '#f4a261', '#ffffff'], slides: [
      { name: 'Нүүр', items: function () { return [
        BG('#141414'), PHOTO(0, 0, W, HH, 'gobi'),
        SCRIM(0, 0, W, HH, 0, [[0, '#141414', 0.85], [0.6, '#141414', 0.2], [1, '#141414', 0]]),
        L('АЯЛЛЫН ХӨТӨЛБӨР · 2026', 260, 28, 120, 1000, { body: 1, weight: 700, color: '#f4a261', cs: 500 }),
        L('МОНГОЛ', 310, 280, 110, 1500, { weight: 700, color: '#ffffff', lh: 0.95 }),
        L('Тал нутаг, говь, тэнгэр — мартагдашгүй 10 өдөр', 640, 38, 120, 1000, { body: 1, color: '#e6e6e6' })
      ]; } },
      { name: 'Танилцуулга', items: function () { return [
        BG('#141414'), PHOTO(1000, 0, 920, HH, 'ger'),
        L('ТАНИЛЦУУЛГА', 200, 26, 120, 800, { body: 1, weight: 700, color: '#f4a261', cs: 500 }),
        L('Нүүдэлчдийн\nнутагт тавтай\nморил', 250, 110, 116, 860, { weight: 700, color: '#ffffff', lh: 0.95 }),
        L('Монгол гэрт хонож, малчин айлын ахуйтай танилцаж, морь унаж, одтой тэнгэрийн дор амрах аялал.', 650, 30, 120, 780, { body: 1, color: '#bdbdbd', lh: 1.6 })
      ]; } },
      { name: 'Маршрут', items: function () {
        var o = [BG('#1c1712', { fx: GRAIN }), L('МАРШРУТ', 120, 80, 120, 1600, { weight: 700, color: '#ffffff' }), R(280, 560, 1360, 3, '#f4a261', { opacity: 0.6, name: 'Шугам' })];
        [['1–2', 'Улаанбаатар'], ['3–4', 'Хустай'], ['5–6', 'Хархорин'], ['7–8', 'Говь'], ['9–10', 'Буцах']].forEach(function (d, i) {
          var cx = 280 + i * 340;
          o.push(C(cx, 561, 22, '#f4a261', { name: 'Цэг' }));
          o.push(T('ӨДӨР ' + d[0], 450, 30, { body: 1, weight: 700, color: '#f4a261', x: cx - 180, w: 360 }));
          o.push(T(d[1], 610, 52, { weight: 600, color: '#ffffff', x: cx - 180, w: 360 }));
        });
        return o;
      } },
      { name: 'Бүтэн зураг', items: function () { return [
        BG('#141414'), PHOTO(0, 0, W, HH, 'rider'),
        SCRIM(0, 620, W, 460, 90, [[0, '#141414', 0], [1, '#141414', 0.9]]),
        L('Морь унах, малчин айлд зочлох', 860, 64, 120, 1600, { weight: 600, color: '#ffffff' }),
        L('Өдөр 3–4 · Хустайн нуруу', 960, 30, 120, 1000, { body: 1, color: '#f4a261' })
      ]; } },
      { name: 'Галерей', items: function () { return [
        BG('#141414'), L('ГАЛЕРЕЙ', 110, 60, 120, 1600, { weight: 700, color: '#ffffff' }),
        PHOTO(120, 240, 800, 720, 'eagle', { mask: 'rounded', r: 24 }),
        PHOTO(960, 240, 840, 340, 'snow', { mask: 'rounded', r: 24 }),
        PHOTO(960, 620, 840, 340, 'ger', { mask: 'rounded', r: 24, fy: 0.6 })
      ]; } },
      { name: 'Багц, үнэ', items: function () {
        var o = [BG('#1c1712', { fx: GRAIN }), T('АЯЛЛЫН БАГЦ', 110, 80, { weight: 700, color: '#ffffff' })];
        [['Стандарт', '1.9 сая₮', '5 өдөр · гэр буудал\n\n✓ Хоол, байр\n✓ Хөтөч\n✓ Даатгал'], ['Премиум', '3.4 сая₮', '10 өдөр · хөтөч, машин\n\n✓ Бүх зардал\n✓ Хувийн жолооч\n✓ Морь унах'], ['Гэр бүл', '6.2 сая₮', '4 хүн · бүх зардал\n\n✓ Хүүхдийн хөтөлбөр\n✓ Гэр бүлийн гэр\n✓ Даатгал']].forEach(function (d, i) {
          var x = 160 + i * 540, hi = i === 1;
          o.push(R(x, 300, 500, 640, hi ? '#f4a261' : '#2a231c', { rx: 32, name: 'Карт' }));
          o.push(T(d[0], 360, 44, { weight: 600, color: hi ? '#1c1712' : '#ffffff', x: x, w: 500 }));
          o.push(T(d[1], 470, 88, { weight: 700, color: hi ? '#1c1712' : '#f4a261', x: x, w: 500 }));
          o.push(T(d[2], 630, 28, { body: 1, color: hi ? '#3a2a1a' : '#bdbdbd', x: x + 30, w: 440, lh: 1.5 }));
        });
        return o;
      } },
      { name: 'Холбоо барих', items: function () { return [
        BG('#141414'), PHOTO(0, 0, W, HH, 'eagle'), R(0, 0, W, HH, '#141414', { opacity: 0.6, name: 'Бараан' }),
        T('АЯЛАЛД НЭГДЭЭРЭЙ', 320, 130, { weight: 700, color: '#ffffff' }),
        T('mongoltravel.mn  ·  9900 1122  ·  @mongoltravel', 540, 36, { body: 1, weight: 600, color: '#f4a261', w: 1600 })
      ]; } }
    ] }
    ,
    // ======================= ТАНСАГ ЗОЧИД БУУДАЛ =======================
    { id: 'hotel', tag: 'Аялал', name: 'Тансаг зочид буудал', fonts: ['Cormorant Garamond', 'Montserrat'], sw: ['#0f0f0e', '#d6b67a', '#f4efe6'], slides: [
      { name: 'Нүүр', items: function () { return [
        BG('#0f0f0e'), PHOTO(0, 0, W, HH, 'pool'), R(0, 0, W, HH, '#0f0f0e', { opacity: 0.42, name: 'Бараан' }),
        SCRIM(0, 560, W, 520, 90, [[0, '#0f0f0e', 0], [1, '#0f0f0e', 0.85]]),
        T('ТАНЫ ЛОГО', 120, 24, { body: 1, weight: 600, color: '#d6b67a', cs: 600 }),
        T('Тансаг', 300, 250, { weight: 500, italic: 1, color: '#f4efe6', lh: 1 }),
        T('З О Ч И Д   Б У У Д А Л', 600, 44, { body: 1, weight: 300, color: '#f4efe6', cs: 300 }),
        R(900, 700, 120, 1.5, '#d6b67a', { name: 'Шугам' }),
        T('www.hotel.mn  ·  Улаанбаатар', 940, 24, { body: 1, color: '#d6b67a', cs: 200 })
      ]; } },
      { name: 'Тавтай морил', items: function () { return [
        BG('#0f0f0e', { fx: GRAIN }), PHOTO(0, 0, 1000, HH, 'lobby'),
        L('ТАВТАЙ МОРИЛ', 230, 24, 1110, 700, { body: 1, weight: 600, color: '#d6b67a', cs: 600 }),
        L('Амралт бүрийг\nмартагдашгүй болгоно', 280, 88, 1106, 760, { weight: 500, italic: 1, color: '#f4efe6', lh: 1.02 }),
        L('Хотын төвд байрлах 120 өрөө бүхий манай буудал таныг дээд зэргийн үйлчилгээ, тав тух, амт чанартай хоолоор угтана.', 540, 28, 1110, 680, { body: 1, color: '#b8b1a4', lh: 1.65 }),
        L('Ерөнхий менежер', 820, 22, 1110, 500, { body: 1, color: '#d6b67a', cs: 200 }),
        L('Нэр Овог', 855, 54, 1106, 600, { weight: 500, italic: 1, color: '#f4efe6' })
      ]; } },
      { name: 'Өрөөнүүд', items: function () {
        var o = [BG('#0f0f0e', { fx: GRAIN }), T('ӨРӨӨНҮҮД', 100, 24, { body: 1, weight: 600, color: '#d6b67a', cs: 600 }), T('Таны сонголт', 140, 90, { weight: 500, italic: 1, color: '#f4efe6' })];
        [['hroom', 'Делюкс', '380,000₮'], ['living2', 'Сюит', '650,000₮'], ['kitchen2', 'Президент', '1.2 сая₮']].forEach(function (d, i) {
          var x = 140 + i * 560;
          o.push(PHOTO(x, 330, 520, 520, d[0], { mask: 'rounded', r: 8 }));
          o.push(L(d[1], 880, 52, x, 400, { weight: 500, italic: 1, color: '#f4efe6' }));
          o.push(L(d[2] + ' / шөнө', 950, 24, x, 400, { body: 1, weight: 600, color: '#d6b67a' }));
        });
        return o;
      } },
      { name: 'Үйлчилгээ', items: function () {
        var o = [BG('#0f0f0e'), PHOTO(0, 0, 1100, HH, 'pool2'), L('Үйлчилгээ', 200, 100, 1200, 640, { weight: 500, italic: 1, color: '#f4efe6' })];
        ['Спа & массаж', 'Халуун усан сан', 'Ресторан & бар', 'Фитнес төв'].forEach(function (t, i) {
          var y = 400 + i * 130;
          o.push(C(1236, y + 26, 30, 'transparent', { stroke: '#d6b67a', sw: 1.5, name: 'Тэмдэг' }), T(String(i + 1), y + 6, 30, { weight: 600, color: '#d6b67a', x: 1206, w: 60 }));
          o.push(L(t, y + 4, 40, 1300, 560, { weight: 500, color: '#f4efe6' }));
        });
        return o;
      } },
      { name: 'Ресторан', items: function () { return [
        BG('#0f0f0e'), PHOTO(0, 0, W, HH, 'restin'), SCRIM(0, 0, W, HH, 0, [[0, '#0f0f0e', 0.9], [0.55, '#0f0f0e', 0.25], [1, '#0f0f0e', 0]]),
        L('РЕСТОРАН & БАР', 380, 24, 140, 800, { body: 1, weight: 600, color: '#d6b67a', cs: 600 }),
        L('Орой бүр\nамьд хөгжим', 430, 110, 136, 900, { weight: 500, italic: 1, color: '#f4efe6', lh: 1 }),
        L('Өглөөний цай 07:00–10:00  ·  Оройн зоог 18:00–23:00', 720, 26, 140, 900, { body: 1, color: '#d9d2c5' })
      ]; } },
      { name: 'Холбоо барих', items: function () {
        var o = [BG('#0f0f0e', { fx: GRAIN }), T('Бидэнтэй холбогдох', 250, 120, { weight: 500, italic: 1, color: '#f4efe6' })];
        [['УТАС', '7700 1122'], ['И-МЭЙЛ', 'hello@hotel.mn'], ['ХАЯГ', 'Сүхбаатар дүүрэг, 1-р хороо']].forEach(function (d, i) {
          var x = 160 + i * 540;
          o.push(R(x, 560, 480, 1.5, '#d6b67a', { name: 'Шугам' }));
          o.push(L(d[0], 600, 22, x, 480, { body: 1, weight: 600, color: '#d6b67a', cs: 400 }));
          o.push(L(d[1], 645, 34, x, 480, { body: 1, color: '#f4efe6' }));
        });
        return o;
      } }
    ] },

    // ======================= FINE DINING =======================
    { id: 'fine', tag: 'Ресторан', name: 'Fine dining — хар, алтан', fonts: ['Playfair', 'Montserrat'], sw: ['#0b0b0b', '#c9a45c', '#f2ede4'], slides: [
      { name: 'Нүүр', items: function () { return [
        BG('#0b0b0b'), PHOTO(0, 0, W, HH, 'steak'), R(0, 0, W, HH, '#0b0b0b', { opacity: 0.55, name: 'Бараан' }),
        R(560, 190, 800, 700, 'transparent', { stroke: '#c9a45c', sw: 1.5, name: 'Хүрээ' }), R(580, 210, 760, 660, 'transparent', { stroke: '#c9a45c', sw: 0.8, opacity: 0.6, name: 'Хүрээ' }),
        T('РЕСТОРАН', 330, 26, { body: 1, weight: 600, color: '#c9a45c', cs: 700 }),
        T('Fine\nDining', 380, 170, { weight: 500, italic: 1, color: '#f2ede4', lh: 0.95 }),
        T('Амтыг мэдэрч, мөчийг тэмдэглэ', 790, 28, { body: 1, color: '#d8cfc0' })
      ]; } },
      { name: 'Тогооч', items: function () { return [
        BG('#0b0b0b', { fx: GRAIN }), PHOTO(960, 0, 960, HH, 'chef'),
        L('МАНАЙ ТОГООЧ', 240, 24, 140, 700, { body: 1, weight: 600, color: '#c9a45c', cs: 600 }),
        L('“Хоол бүр —\nнэгэн түүх.”', 290, 104, 136, 780, { weight: 500, italic: 1, color: '#f2ede4', lh: 1.02 }),
        L('Парист бэлтгэгдсэн, 15 жилийн туршлагатай ерөнхий тогооч маань улирлын шинэ орцоор цэсээ бүтээдэг.', 580, 28, 140, 700, { body: 1, color: '#b9b1a3', lh: 1.65 }),
        L('Нэр Овог', 820, 48, 140, 600, { weight: 500, italic: 1, color: '#c9a45c' })
      ]; } },
      { name: 'Цэс', items: function () {
        var o = [BG('#0b0b0b', { fx: GRAIN }), PHOTO(1260, 240, 560, 560, 'steak2', { mask: 'circle' }), C(1540, 520, 300, 'transparent', { stroke: '#c9a45c', sw: 1.5, name: 'Хүрээ' }),
          L('ЦЭС', 150, 24, 140, 600, { body: 1, weight: 600, color: '#c9a45c', cs: 600 }), L('Оройн зоог', 190, 96, 136, 900, { weight: 500, italic: 1, color: '#f2ede4' })];
        [['Үхрийн стейк', 'Трюфелийн соус, шарсан ногоо', '89,000₮'], ['Хулдмай загас', 'Лимон, цөцгийн тос', '72,000₮'], ['Хурганы хавирга', 'Розмарин, төмсний нухаш', '78,000₮'], ['Шоколадан фондан', 'Ваниль зайрмаг', '28,000₮']].forEach(function (d, i) {
          var y = 400 + i * 145;
          o.push(L(d[0], y, 40, 140, 700, { weight: 600, color: '#f2ede4' }), L(d[2], y + 4, 34, 140, 960, { body: 1, weight: 600, color: '#c9a45c', align: 'right' }));
          o.push(L(d[1], y + 56, 24, 140, 700, { body: 1, color: '#9d968a' }), R(140, y + 110, 960, 1, '#c9a45c', { opacity: 0.3, name: 'Шугам' }));
        });
        return o;
      } },
      { name: 'Дарс', items: function () { return [
        BG('#0b0b0b'), PHOTO(0, 0, 1060, HH, 'wine'),
        L('ДАРСНЫ ЖАГСААЛТ', 300, 24, 1180, 700, { body: 1, weight: 600, color: '#c9a45c', cs: 600 }),
        L('200 гаруй\nсонголт', 350, 110, 1176, 700, { weight: 500, italic: 1, color: '#f2ede4', lh: 1 }),
        L('Франц, Итали, Чилийн шилдэг дарсыг манай сомелье таны хоолтой тааруулж санал болгоно.', 640, 28, 1180, 620, { body: 1, color: '#b9b1a3', lh: 1.65 })
      ]; } },
      { name: 'Амттан', items: function () { return [
        BG('#0b0b0b', { fx: GRAIN }), T('Амттан', 110, 100, { weight: 500, italic: 1, color: '#f2ede4' }),
        PHOTO(160, 300, 780, 620, 'tart', { mask: 'rounded', r: 6 }), PHOTO(980, 300, 780, 620, 'dessert', { mask: 'rounded', r: 6 }),
        L('Жимсний тарт  ·  22,000₮', 945, 26, 160, 780, { body: 1, color: '#c9a45c' }), L('Шоколадан бялуу  ·  26,000₮', 945, 26, 980, 780, { body: 1, color: '#c9a45c' })
      ]; } },
      { name: 'Ширээ захиалах', items: function () { return [
        BG('#0b0b0b'), PHOTO(0, 0, W, HH, 'restin'), R(0, 0, W, HH, '#0b0b0b', { opacity: 0.65, name: 'Бараан' }),
        T('Ширээ захиалах', 330, 140, { weight: 500, italic: 1, color: '#f2ede4' }),
        T('7700 1122  ·  @finedining.mn', 560, 36, { body: 1, weight: 600, color: '#c9a45c' }),
        T('Мягмар – Ням  ·  18:00 – 23:00', 630, 26, { body: 1, color: '#d8cfc0' })
      ]; } }
    ] },

    // ======================= COFFEE =======================
    { id: 'coffee', tag: 'Ресторан', name: 'Кофе шоп', fonts: ['Yeseva One', 'Montserrat'], sw: ['#1b120c', '#c8a27a', '#f3e7d7'], slides: [
      { name: 'Нүүр', items: function () { return [
        BG('#1b120c'), PHOTO(0, 0, W, HH, 'beans'), SCRIM(0, 0, W, HH, 0, [[0, '#1b120c', 0.92], [0.6, '#1b120c', 0.4], [1, '#1b120c', 0.1]]),
        L('ТАНЫ ЛОГО', 150, 24, 140, 600, { body: 1, weight: 600, color: '#c8a27a', cs: 600 }),
        L('Coffee', 300, 250, 128, 1200, { color: '#f3e7d7', lh: 1 }),
        L('Дэлхийн хамгийн дуртай ундаа — таны өглөө эндээс эхэлнэ', 600, 32, 140, 900, { body: 1, color: '#e2d3c0' }),
        C(1700, 880, 110, '#c8a27a', { name: 'Тэмдэг' }), T('2026', 860, 36, { color: '#1b120c', x: 1590, w: 220 })
      ]; } },
      { name: 'Бидний түүх', items: function () { return [
        BG('#f3e7d7', { fx: GRAIN }), PHOTO(0, 0, 900, HH, 'cafe'),
        L('БИДНИЙ ТҮҮХ', 230, 24, 1020, 700, { body: 1, weight: 700, color: '#8a5a3c', cs: 500 }),
        L('Нэг аяга кофеноос\nэхэлсэн мөрөөдөл', 280, 76, 1016, 800, { color: '#1b120c', lh: 1.1 }),
        L('2018 онд жижигхэн цонхноос эхэлсэн бид өнөөдөр 5 салбартай болж, өдөр бүр 2000 гаруй аяга кофе бэлтгэдэг.', 520, 28, 1020, 760, { body: 1, color: '#5a4636', lh: 1.65 })
      ]; } },
      { name: 'Цэс', items: function () {
        var o = [BG('#f3e7d7', { fx: GRAIN }), T('Цэс', 100, 110, { color: '#1b120c' })];
        [['latte', 'Латте', '7,500₮'], ['beans2', 'Эспрессо', '5,500₮'], ['cafe2', 'Капучино', '7,000₮']].forEach(function (d, i) {
          var cx = 420 + i * 540;
          o.push(PHOTO(cx - 200, 290, 400, 400, d[0], { mask: 'circle' }));
          o.push(T(d[1], 740, 56, { color: '#1b120c', x: cx - 250, w: 500 }));
          o.push(T(d[2], 830, 32, { body: 1, weight: 700, color: '#8a5a3c', x: cx - 250, w: 500 }));
        });
        return o;
      } },
      { name: 'Бариста', items: function () { return [
        BG('#1b120c'), PHOTO(0, 0, W, HH, 'barista'), SCRIM(0, 560, W, 520, 90, [[0, '#1b120c', 0], [1, '#1b120c', 0.92]]),
        L('“Сайн кофе бол хайрын илэрхийлэл.”', 820, 72, 140, 1640, { color: '#f3e7d7' }),
        L('— Манай ахлах бариста', 930, 28, 140, 800, { body: 1, color: '#c8a27a' })
      ]; } },
      { name: 'Кофены үр', items: function () {
        var o = [BG('#1b120c', { fx: GRAIN }), PHOTO(1000, 0, 920, HH, 'beans2'), L('Шилдэг\nүр тариа', 160, 110, 136, 820, { color: '#f3e7d7', lh: 1.02 })];
        [['Этиоп', 'Цэцэгсийн, жимсний амт'], ['Колумб', 'Шоколад, самрын амт'], ['Бразил', 'Зөөлөн, карамелийн амт']].forEach(function (d, i) {
          var y = 480 + i * 150;
          o.push(R(140, y, 6, 100, '#c8a27a', { name: 'Шугам' }), L(d[0], y, 44, 180, 700, { color: '#f3e7d7' }), L(d[1], y + 60, 26, 180, 700, { body: 1, color: '#bfae99' }));
        });
        return o;
      } },
      { name: 'Хаяг', items: function () { return [
        BG('#f3e7d7', { fx: GRAIN }), PHOTO(960, 60, 900, 960, 'cafe2', { mask: 'rounded', r: 24 }),
        L('Бидэн дээр\nирээрэй', 250, 110, 136, 800, { color: '#1b120c', lh: 1.02 }),
        L('Сүхбаатар дүүрэг, Их тойруу 12\nӨдөр бүр 07:30 – 22:00\n☎ 9911 2233  ·  @coffee.mn', 560, 32, 140, 760, { body: 1, color: '#5a4636', lh: 1.7 })
      ]; } }
    ] },

    // ======================= INTERIOR DESIGN =======================
    { id: 'interior', tag: 'Үл хөдлөх', name: 'Интерьер дизайн', fonts: ['Prata', 'Manrope'], sw: ['#efebe4', '#2b2a27', '#8c7a64'], slides: [
      { name: 'Нүүр', items: function () { return [
        BG('#efebe4', { fx: GRAIN }), PHOTO(960, 0, 960, HH, 'living'),
        PHOTO(760, 640, 380, 300, 'kitchen', { mask: 'rounded', r: 4 }),
        L('ПОРТФОЛИО · 2026', 200, 24, 140, 700, { body: 1, weight: 700, color: '#8c7a64', cs: 500 }),
        L('Interior\nDesign', 250, 150, 132, 800, { color: '#2b2a27', lh: 1 }),
        L('Бэлтгэсэн: Нэр Овог', 900, 26, 140, 560, { body: 1, weight: 600, color: '#2b2a27' })
      ]; } },
      { name: 'Бидний тухай', items: function () { return [
        BG('#efebe4', { fx: GRAIN }), PHOTO(1060, 80, 720, 440, 'living2', { mask: 'rounded', r: 4 }), PHOTO(1060, 560, 720, 440, 'kitchen2', { mask: 'rounded', r: 4 }),
        L('БИДНИЙ ТУХАЙ', 220, 24, 140, 700, { body: 1, weight: 700, color: '#8c7a64', cs: 500 }),
        L('Орон зайг\nамьдралд\nтааруулна', 270, 96, 136, 800, { color: '#2b2a27', lh: 1.05 }),
        L('Бид 2016 оноос хойш 300 гаруй орон сууц, оффис, кафены интерьерийг зураг төслөөс эхлээд гүйцэтгэл хүртэл хийж байна.', 700, 28, 140, 760, { body: 1, color: '#5d5850', lh: 1.65 })
      ]; } },
      { name: 'Төсөл', items: function () { return [
        BG('#efebe4'), PHOTO(0, 0, W, HH, 'kitchen'),
        R(120, 620, 760, 340, '#efebe4', { name: 'Карт' }),
        L('ТӨСӨЛ 01', 670, 22, 170, 600, { body: 1, weight: 700, color: '#8c7a64', cs: 500 }),
        L('Минимал гал тогоо', 710, 60, 166, 680, { color: '#2b2a27' }),
        L('Зайсан · 140 м² · 2025', 810, 26, 170, 600, { body: 1, color: '#5d5850' }),
        L('Цагаан царс, микроцемент, далд гэрэлтүүлэг', 860, 24, 170, 660, { body: 1, color: '#5d5850' })
      ]; } },
      { name: 'Үйлчилгээ', items: function () {
        var o = [BG('#2b2a27'), L('Үйлчилгээ', 120, 96, 140, 1600, { color: '#efebe4' })];
        [['Зураг төсөл', 'Орон зайн төлөвлөлт, материал'], ['3D зураглал', 'Бодит мэт дүрслэл'], ['Засвар', 'Түлхүүр гардуулах хүртэл'], ['Тавилга', 'Захиалгат тавилга, чимэглэл']].forEach(function (d, i) {
          var x = 140 + i * 420;
          o.push(L('0' + (i + 1), 380, 80, x, 360, { color: '#8c7a64' }), R(x, 500, 360, 1.5, '#8c7a64', { name: 'Шугам' }));
          o.push(L(d[0], 540, 40, x, 380, { color: '#efebe4' }), L(d[1], 610, 24, x, 360, { body: 1, color: '#b9b2a6', lh: 1.5 }));
        });
        return o;
      } },
      { name: 'Галерей', items: function () { return [
        BG('#efebe4', { fx: GRAIN }), L('Галерей', 90, 80, 140, 800, { color: '#2b2a27' }),
        PHOTO(140, 240, 800, 760, 'living', { mask: 'rounded', r: 4 }), PHOTO(980, 240, 390, 370, 'living2', { mask: 'rounded', r: 4 }),
        PHOTO(1390, 240, 390, 370, 'hroom', { mask: 'rounded', r: 4 }), PHOTO(980, 630, 800, 370, 'kitchen2', { mask: 'rounded', r: 4 })
      ]; } },
      { name: 'Холбоо барих', items: function () { return [
        BG('#efebe4', { fx: GRAIN }), PHOTO(1000, 0, 920, HH, 'living2'),
        L('Хамтран\nажиллая', 250, 130, 136, 800, { color: '#2b2a27', lh: 1 }),
        L('studio@interior.mn\n+976 9911 2233\n@interior.studio', 620, 32, 140, 700, { body: 1, color: '#5d5850', lh: 1.7 })
      ]; } }
    ] },

    // ======================= REAL ESTATE =======================
    { id: 'realty', tag: 'Үл хөдлөх', name: 'Үл хөдлөх хөрөнгө', fonts: ['Montserrat', 'Inter'], sw: ['#ffffff', '#111111', '#b08d57'], slides: [
      { name: 'Нүүр', items: function () { return [
        BG('#ffffff'), PHOTO(800, 0, 1120, HH, 'house'),
        R(140, 250, 80, 6, '#b08d57', { name: 'Шугам' }),
        L('REAL ESTATE', 290, 24, 140, 600, { body: 1, weight: 700, color: '#b08d57', cs: 500 }),
        L('ҮЛ ХӨДЛӨХ\nХӨРӨНГӨ', 340, 80, 136, 640, { weight: 800, color: '#111111', lh: 1 }),
        L('Таны мөрөөдлийн гэр — зөв байршил, зөв үнээр', 600, 28, 140, 600, { body: 1, color: '#666666', lh: 1.5 }),
        L('Бэлтгэсэн: Нэр Овог  ·  2026', 900, 24, 140, 600, { body: 1, weight: 600, color: '#111111' })
      ]; } },
      { name: 'Онцлох объект', items: function () {
        var o = [BG('#ffffff'), PHOTO(0, 0, W, 660, 'house2'), L('Онцлох объект', 720, 60, 140, 900, { weight: 800, color: '#111111' })];
        [['3', 'өрөө'], ['120 м²', 'талбай'], ['2024', 'ашиглалт'], ['850 сая₮', 'үнэ']].forEach(function (d, i) {
          var x = 140 + i * 420;
          o.push(L(d[0], 850, 56, x, 380, { weight: 800, color: i === 3 ? '#b08d57' : '#111111' }), L(d[1], 930, 24, x, 380, { body: 1, color: '#666666' }));
        });
        return o;
      } },
      { name: 'Байршил', items: function () {
        var o = [BG('#f5f4f1'), PHOTO(1060, 80, 720, 920, 'tower', { mask: 'rounded', r: 12 }), L('Байршил', 150, 90, 136, 800, { weight: 800, color: '#111111' })];
        [['Сургууль', '300 м'], ['Цэцэрлэг', '150 м'], ['Супермаркет', '200 м'], ['Төв зам', '5 мин']].forEach(function (d, i) {
          var y = 360 + i * 130;
          o.push(L(d[0], y, 38, 140, 600, { body: 1, weight: 600, color: '#111111' }), L(d[1], y, 38, 140, 800, { weight: 800, color: '#b08d57', align: 'right' }), R(140, y + 80, 800, 1, '#d8d4cc', { name: 'Шугам' }));
        });
        return o;
      } },
      { name: 'Интерьер', items: function () { return [
        BG('#ffffff'), L('Интерьер', 100, 80, 140, 900, { weight: 800, color: '#111111' }),
        PHOTO(140, 260, 540, 680, 'living', { mask: 'rounded', r: 12 }), PHOTO(700, 260, 540, 680, 'kitchen2', { mask: 'rounded', r: 12 }), PHOTO(1260, 260, 520, 680, 'hroom', { mask: 'rounded', r: 12 })
      ]; } },
      { name: 'Үнийн санал', items: function () {
        var o = [BG('#111111'), T('Үнийн санал', 110, 80, { weight: 800, color: '#ffffff' })];
        [['1 өрөө', '320 сая₮', '48 м²'], ['2 өрөө', '520 сая₮', '72 м²'], ['3 өрөө', '850 сая₮', '120 м²']].forEach(function (d, i) {
          var x = 160 + i * 540, hi = i === 2;
          o.push(R(x, 290, 500, 620, hi ? '#b08d57' : '#1e1e1e', { rx: 16, name: 'Карт' }));
          o.push(T(d[0], 360, 44, { weight: 700, color: '#ffffff', x: x, w: 500 }), T(d[1], 470, 76, { weight: 800, color: hi ? '#111111' : '#b08d57', x: x, w: 500 }), T(d[2] + '\n\n✓ Зогсоол\n✓ Агуулах', 620, 28, { body: 1, color: hi ? '#1e1e1e' : '#bbbbbb', x: x, w: 500, lh: 1.5 }));
        });
        return o;
      } },
      { name: 'Холбоо барих', items: function () { return [
        BG('#111111'), PHOTO(0, 0, W, HH, 'city'), R(0, 0, W, HH, '#111111', { opacity: 0.6, name: 'Бараан' }),
        T('ҮЗЛЭГТ БҮРТГҮҮЛЭХ', 330, 90, { weight: 800, color: '#ffffff' }),
        T('Агент: Нэр Овог  ·  9911 2233  ·  realty.mn', 520, 34, { body: 1, weight: 600, color: '#b08d57', w: 1600 })
      ]; } }
    ] }
  ];

  var ORDER = ['hotel', 'fine', 'resto', 'coffee', 'interior', 'realty', 'biz', 'creative', 'mongolia', 'edu'];
  DECKS.sort(function (a, b) { return ORDER.indexOf(a.id) - ORDER.indexOf(b.id); });
  DECKS.forEach(function (d) {
    d.slides = d.slides.map(function (s, i) {
      return { id: d.id + '-' + (i + 1), name: s.name, deck: d.id, w: W, h: HH, fonts: d.fonts, sw: d.sw, bg: d.sw[0], items: s.items };
    });
    d.slides.forEach(function (s) { s.photos = G.photosOf(s); });
  });
  G.decks = DECKS;
  G.slide = function (id) { for (var i = 0; i < DECKS.length; i++) for (var j = 0; j < DECKS[i].slides.length; j++) if (DECKS[i].slides[j].id === id) return DECKS[i].slides[j]; return null; };
})();
