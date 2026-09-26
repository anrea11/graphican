/* Graphican — Монгол сошиал загварууд. Shared by the editor (/editor/?tpl=<id>) and the gallery (/tools/templates/).
   Each template: size, background, two Mongolian-ready fonts (Ө Ү checked) and a list of simple specs → fabric objects. */
(function () {
  'use strict';
  var CATS = { holiday: 'Баяр ёслол', biz: 'Бизнес, зар', event: 'Арга хэмжээ', other: 'Бусад' };
  var GOLD = '#e0a526';

  function star(cx, cy, r, fill) { return { t: 'star', cx: cx, cy: cy, r: r, fill: fill }; }
  function ph(x, y, w, h, label, fill, rx) { return { t: 'ph', x: x, y: y, w: w, h: h, label: label, fill: fill || '#e5e7eb', rx: rx || 0 }; }

  var LIST = [
    { id: 'tsagaansar', name: 'Цагаан сарын мэнд', cat: 'holiday', w: 1080, h: 1080, bg: '#13306b', fonts: ['Cormorant Garamond', 'Montserrat'], sw: ['#13306b', GOLD, '#f6e7c1'],
      items: function () { return [
        { t: 'rect', x: 40, y: 40, w: 1000, h: 1000, fill: 'transparent', stroke: GOLD, sw: 3, name: 'Хүрээ' },
        { t: 'rect', x: 62, y: 62, w: 956, h: 956, fill: 'transparent', stroke: GOLD, sw: 1, opacity: 0.55, name: 'Хүрээ' },
        { t: 'rect', c: 1, x: 540, y: 235, w: 92, h: 92, angle: 45, fill: 'transparent', stroke: GOLD, sw: 3, name: 'Чимэглэл' },
        { t: 'rect', c: 1, x: 540, y: 235, w: 40, h: 40, angle: 45, fill: GOLD, name: 'Чимэглэл' },
        { t: 'text', text: 'САР ШИНЭДЭЭ\nСАЙХАН ШИНЭЛЖ\nБАЙНА УУ', y: 340, size: 88, weight: 700, color: '#f6e7c1', lh: 1.08, w: 920 },
        { t: 'rect', x: 440, y: 690, w: 200, h: 3, fill: GOLD, name: 'Шугам' },
        { t: 'text', text: 'Цагаан сарын баярын мэнд хүргэе!', y: 725, size: 36, body: 1, weight: 500, color: GOLD, w: 820 },
        { t: 'text', text: 'БАЙГУУЛЛАГЫН НЭР', y: 905, size: 30, body: 1, weight: 600, color: '#f6e7c1', cs: 250, w: 820 }
      ]; } },
    { id: 'naadam', name: 'Наадмын мэнд', cat: 'holiday', w: 1080, h: 1350, bg: '#f6f0e4', fonts: ['Oswald', 'Inter'], sw: ['#1f4e9c', '#c8102e', '#f6f0e4'],
      items: function () { return [
        { t: 'rect', x: 0, y: 0, w: 1080, h: 380, fill: '#1f4e9c', name: 'Тууз' },
        { t: 'rect', x: 0, y: 380, w: 1080, h: 24, fill: '#c8102e', name: 'Тууз' },
        { t: 'text', text: 'ҮНДЭСНИЙ ИХ БАЯР', y: 160, size: 46, weight: 500, color: '#f6f0e4', cs: 400, w: 960 },
        { t: 'text', text: 'НААДАМ', y: 450, size: 230, weight: 700, color: '#1f4e9c', lh: 1, w: 1000 },
        { t: 'text', text: '2026', y: 705, size: 150, weight: 700, color: '#c8102e', lh: 1, w: 800 },
        { t: 'text', text: 'Эрийн гурван наадмын баярын мэнд хүргэе!', y: 905, size: 46, body: 1, weight: 600, color: '#2b1b12', w: 860, lh: 1.25 },
        { t: 'rect', c: 1, x: 470, y: 1090, w: 22, h: 22, angle: 45, fill: GOLD, name: 'Чимэглэл' },
        { t: 'rect', c: 1, x: 540, y: 1090, w: 22, h: 22, angle: 45, fill: '#c8102e', name: 'Чимэглэл' },
        { t: 'rect', c: 1, x: 610, y: 1090, w: 22, h: 22, angle: 45, fill: GOLD, name: 'Чимэглэл' },
        { t: 'text', text: 'БАЙГУУЛЛАГЫН НЭР', y: 1200, size: 32, body: 1, weight: 600, color: '#1f4e9c', cs: 200, w: 900 }
      ]; } },
    { id: 'newyear', name: 'Шинэ оны мэнд', cat: 'holiday', w: 1080, h: 1350, bg: '#0b1633', fonts: ['Cormorant Garamond', 'Montserrat'], sw: ['#0b1633', '#e8c77a', '#f7e7b4'],
      items: function () {
        var s = [[120, 140, 4], [260, 90, 3], [880, 160, 5], [960, 300, 3], [150, 520, 3], [930, 620, 4], [90, 900, 3], [990, 1000, 3], [300, 1230, 4], [800, 1250, 3], [540, 150, 3]];
        return s.map(function (p) { return { t: 'circle', cx: p[0], cy: p[1], r: p[2], fill: '#e8c77a', opacity: 0.8, name: 'Од' }; }).concat([
          { t: 'text', text: 'ШИНЭ ОНЫ', y: 330, size: 66, body: 1, weight: 600, color: '#e8c77a', cs: 500, w: 900 },
          { t: 'text', text: '2027', y: 420, size: 260, weight: 700, color: '#f7e7b4', lh: 1, w: 1000 },
          { t: 'text', text: 'МЭНД ХҮРГЭЕ', y: 720, size: 66, body: 1, weight: 600, color: '#e8c77a', cs: 500, w: 960 },
          { t: 'text', text: 'Шинэ онд аз жаргал, амжилт бүтээл хамгийн их байх болтугай!', y: 860, size: 38, body: 1, weight: 400, color: '#c8cde0', w: 800, lh: 1.4 },
          { t: 'rect', x: 480, y: 1110, w: 120, h: 2, fill: '#e8c77a', name: 'Шугам' },
          { t: 'text', text: 'БАЙГУУЛЛАГЫН НЭР', y: 1150, size: 30, body: 1, weight: 600, color: '#e8c77a', cs: 300, w: 900 }
        ]);
      } },
    { id: 'march8', name: '3-р сарын 8-ны мэнд', cat: 'holiday', w: 1080, h: 1080, bg: '#fbe4e6', fonts: ['Lora', 'Inter'], sw: ['#fbe4e6', '#b83b5e', '#f7c6cc'],
      items: function () { return [
        { t: 'circle', cx: 540, cy: 400, r: 300, fill: '#f7c6cc', name: 'Чимэглэл' },
        { t: 'text', text: '3.8', y: 250, size: 260, weight: 700, color: '#b83b5e', lh: 1, w: 800 },
        { t: 'text', text: 'Олон улсын эмэгтэйчүүдийн\nэрхийг хамгаалах өдрийн мэнд хүргэе!', y: 580, size: 42, weight: 700, color: '#5e1f33', w: 940, lh: 1.25 },
        { t: 'text', text: 'Та бүхэндээ аз жаргал, эрүүл энх, гэрэлт мөчүүдийг хүсье.', y: 730, size: 32, body: 1, color: '#7a4453', w: 760, lh: 1.45 },
        { t: 'text', text: 'БАЙГУУЛЛАГЫН НЭР', y: 940, size: 28, body: 1, weight: 600, color: '#b83b5e', cs: 250, w: 900 }
      ]; } },

    { id: 'sale', name: 'Хямдралын пост', cat: 'biz', w: 1080, h: 1350, bg: '#0b0b14', fonts: ['Montserrat', 'Inter'], sw: ['#0b0b14', '#816dfb', '#e7e3fd'],
      items: function () { return [
        { t: 'text', text: 'ХЯМДРАЛ', y: 150, size: 96, weight: 800, color: '#e7e3fd', cs: 300 },
        { t: 'text', text: '−30%', y: 330, size: 330, weight: 800, color: '#816dfb', lh: 1 },
        { t: 'text', text: 'Зөвхөн энэ долоо хоногт бүх бүтээгдэхүүнд', y: 760, size: 44, body: 1, color: '#a6a8b8', w: 760, lh: 1.3 },
        { t: 'rect', x: 290, y: 1010, w: 500, h: 120, rx: 60, fill: '#816dfb', name: 'Товч' },
        { t: 'text', text: 'Одоо захиалах', x: 290, y: 1045, size: 42, body: 1, weight: 700, color: '#ffffff', w: 500 }
      ]; } },
    { id: 'job', name: 'Ажлын байрны зар', cat: 'biz', w: 1080, h: 1350, bg: '#ffffff', fonts: ['Montserrat', 'Inter'], sw: ['#ffffff', '#4f46e5', '#0f172a'],
      items: function () { return [
        { t: 'rect', x: 0, y: 0, w: 1080, h: 18, fill: '#4f46e5', name: 'Тууз' },
        { t: 'text', text: 'БИД ХАМТ ОЛНОО ӨРГӨЖҮҮЛЖ БАЙНА', x: 90, y: 110, size: 32, weight: 700, color: '#4f46e5', cs: 150, align: 'left', w: 900 },
        { t: 'text', text: 'Маркетинг менежер', x: 90, y: 175, size: 104, weight: 800, color: '#0f172a', align: 'left', w: 900, lh: 1.02 },
        { t: 'text', text: 'Бүтэн цаг  ·  Улаанбаатар  ·  Цалин: тохиролцоно', x: 90, y: 420, size: 32, body: 1, color: '#64748b', align: 'left', w: 900 },
        { t: 'rect', x: 90, y: 500, w: 900, h: 2, fill: '#e2e8f0', name: 'Шугам' },
        { t: 'text', text: 'Тавигдах шаардлага', x: 90, y: 550, size: 40, weight: 700, color: '#0f172a', align: 'left', w: 900 },
        { t: 'text', text: '•  Маркетингийн чиглэлээр 2+ жил ажилласан\n•  Сошиал медиа, контент төлөвлөлтийн туршлага\n•  Баг хамт олонтой уялдаж ажиллах чадвар\n•  Англи хэлний дунд түвшний мэдлэг', x: 90, y: 625, size: 32, body: 1, color: '#334155', align: 'left', w: 900, lh: 1.6 },
        { t: 'rect', x: 90, y: 1000, w: 900, h: 240, rx: 28, fill: '#eef2ff', name: 'Хайрцаг' },
        { t: 'text', text: 'CV-гээ илгээх', x: 130, y: 1040, size: 34, weight: 700, color: '#4f46e5', align: 'left', w: 500 },
        { t: 'text', text: 'Хугацаа: 10.15', x: 130, y: 1044, size: 30, body: 1, color: '#64748b', align: 'right', w: 820 },
        { t: 'text', text: 'hr@company.mn\n+976 8000 0000', x: 130, y: 1100, size: 40, body: 1, weight: 600, color: '#0f172a', align: 'left', w: 820, lh: 1.35 }
      ]; } },
    { id: 'menu', name: 'Хоолны цэс', cat: 'biz', w: 1080, h: 1350, bg: '#1c1410', fonts: ['Cormorant Garamond', 'Inter'], sw: ['#1c1410', '#d9a441', '#f5ead7'],
      items: function () {
        var rows = [['Бууз', 'Гар аргаар, 6 ширхэг', '12,000₮'], ['Цуйван', 'Үхрийн мах, шинэ ногоо', '14,500₮'], ['Хуушуур', 'Шарсан, 3 ширхэг', '9,000₮'],
          ['Банштай шөл', 'Сүүтэй цайтай хамт', '11,000₮'], ['Сүүтэй цай', 'Халуун, 0.5 литр', '3,000₮']];
        var out = [
          { t: 'text', text: 'ӨНӨӨДРИЙН ЦЭС', y: 110, size: 34, body: 1, weight: 600, color: '#d9a441', cs: 400, w: 900 },
          { t: 'text', text: 'Хоолны цэс', y: 165, size: 120, weight: 700, italic: 1, color: '#f5ead7', w: 900 },
          { t: 'rect', x: 440, y: 335, w: 200, h: 2, fill: '#d9a441', name: 'Шугам' }
        ];
        rows.forEach(function (r, i) {
          var y = 400 + i * 150;
          out.push({ t: 'text', text: r[0], x: 110, y: y, size: 50, weight: 700, color: '#f5ead7', align: 'left', w: 600 });
          out.push({ t: 'text', text: r[1], x: 110, y: y + 62, size: 26, body: 1, color: '#a8957c', align: 'left', w: 600 });
          out.push({ t: 'text', text: r[2], x: 110, y: y + 8, size: 42, body: 1, weight: 600, color: '#d9a441', align: 'right', w: 860 });
          if (i < rows.length - 1) out.push({ t: 'rect', x: 110, y: y + 122, w: 860, h: 1, fill: '#3a2c22', name: 'Шугам' });
        });
        out.push({ t: 'text', text: 'Захиалга: 7700 0000  ·  Хүргэлттэй', y: 1215, size: 30, body: 1, color: '#d9a441', w: 900 });
        return out;
      } },
    { id: 'realestate', name: 'Үл хөдлөх хөрөнгийн зар', cat: 'biz', w: 1080, h: 1350, bg: '#ffffff', fonts: ['Montserrat', 'Inter'], sw: ['#ffffff', '#16a34a', '#0f172a'],
      items: function () { return [
        ph(0, 0, 1080, 720, 'Байрны зургаа энд чирж тавина'),
        { t: 'rect', x: 60, y: 60, w: 220, h: 64, rx: 32, fill: '#16a34a', name: 'Шошго' },
        { t: 'text', text: 'ЗАРНА', x: 60, y: 76, size: 30, weight: 800, color: '#ffffff', w: 220, cs: 150 },
        { t: 'text', text: 'Хан-Уул, 19-р хороолол', x: 70, y: 770, size: 34, body: 1, color: '#64748b', align: 'left', w: 940 },
        { t: 'text', text: '3 өрөө орон сууц', x: 70, y: 820, size: 84, weight: 800, color: '#0f172a', align: 'left', w: 940 },
        { t: 'rect', x: 70, y: 950, w: 280, h: 80, rx: 20, fill: '#f1f5f9', name: 'Шошго' },
        { t: 'rect', x: 380, y: 950, w: 280, h: 80, rx: 20, fill: '#f1f5f9', name: 'Шошго' },
        { t: 'rect', x: 690, y: 950, w: 320, h: 80, rx: 20, fill: '#f1f5f9', name: 'Шошго' },
        { t: 'text', text: '82 м²', x: 70, y: 972, size: 34, weight: 700, color: '#0f172a', w: 280 },
        { t: 'text', text: '12 давхар', x: 380, y: 972, size: 34, weight: 700, color: '#0f172a', w: 280 },
        { t: 'text', text: '2019 он', x: 690, y: 972, size: 34, weight: 700, color: '#0f172a', w: 320 },
        { t: 'text', text: '385 сая ₮', x: 70, y: 1085, size: 96, weight: 800, color: '#16a34a', align: 'left', w: 940 },
        { t: 'text', text: 'Утас: 9911 2233', x: 70, y: 1235, size: 38, body: 1, weight: 700, color: '#0f172a', align: 'left', w: 600 },
        { t: 'text', text: 'Зуучлалгүй', x: 70, y: 1240, size: 30, body: 1, color: '#64748b', align: 'right', w: 940 }
      ]; } },
    { id: 'pricing', name: 'Үнийн багц', cat: 'biz', w: 1080, h: 1350, bg: '#f5f3ff', fonts: ['Montserrat', 'Inter'], sw: ['#f5f3ff', '#6d28d9', '#1e1b4b'],
      items: function () {
        var P = [['Энгийн', 'Лого + 2 хувилбар, 2 удаагийн засвар', '290,000₮'], ['Стандарт', 'Лого, өнгө, фонт, нэрийн хуудас, сошиал загвар', '690,000₮'], ['Бүрэн', 'Брэнд бук, бүх хэрэглээний дизайн, 3 сарын дэмжлэг', '1,490,000₮']];
        var out = [
          { t: 'text', text: 'ҮЙЛЧИЛГЭЭНИЙ БАГЦ', y: 100, size: 32, weight: 700, color: '#6d28d9', cs: 300, w: 900 },
          { t: 'text', text: 'Танд тохирох багцаа сонгоорой', y: 160, size: 64, weight: 800, color: '#1e1b4b', w: 880, lh: 1.1 }
        ];
        P.forEach(function (p, i) {
          var y = 380 + i * 290, hot = i === 1, fg = hot ? '#ffffff' : '#1e1b4b';
          out.push({ t: 'rect', x: 90, y: y, w: 900, h: 250, rx: 30, fill: hot ? '#6d28d9' : '#ffffff', stroke: hot ? '' : '#e4e0f7', sw: hot ? 0 : 2, name: 'Карт' });
          out.push({ t: 'text', text: p[0], x: 140, y: y + 40, size: 42, weight: 800, color: fg, align: 'left', w: 460 });
          out.push({ t: 'text', text: p[1], x: 140, y: y + 105, size: 27, body: 1, color: hot ? '#ede9fe' : '#5b5680', align: 'left', w: 470, lh: 1.35 });
          out.push({ t: 'text', text: p[2], x: 140, y: y + 50, size: 52, weight: 800, color: hot ? '#ffffff' : '#6d28d9', align: 'right', w: 800 });
          if (hot) out.push({ t: 'text', text: 'САНАЛ БОЛГОХ', x: 140, y: y + 195, size: 22, body: 1, weight: 700, color: '#ddd6fe', align: 'right', w: 800, cs: 200 });
        });
        out.push({ t: 'text', text: 'Холбогдох: 8000 0000', y: 1270, size: 32, body: 1, weight: 600, color: '#1e1b4b', w: 900 });
        return out;
      } },
    { id: 'testimonial', name: 'Үйлчлүүлэгчийн сэтгэгдэл', cat: 'biz', w: 1080, h: 1080, bg: '#f8fafc', fonts: ['Lora', 'Inter'], sw: ['#f8fafc', '#f59e0b', '#0f172a'],
      items: function () { return [
        { t: 'rect', x: 80, y: 110, w: 920, h: 800, rx: 40, fill: '#ffffff', stroke: '#e2e8f0', sw: 2, name: 'Карт' },
        star(170, 205, 26, '#f59e0b'), star(234, 205, 26, '#f59e0b'), star(298, 205, 26, '#f59e0b'), star(362, 205, 26, '#f59e0b'), star(426, 205, 26, '#f59e0b'),
        { t: 'text', text: '“', x: 140, y: 250, size: 180, weight: 700, color: '#cbd5e1', align: 'left', w: 200, lh: 1 },
        { t: 'text', text: 'Лого, брэндийн өнгө төрхийг маань маш богино хугацаанд, яг бидний төсөөлж байснаар гаргаж өгсөн. Хамт олон маань сэтгэл хангалуун байна.', x: 140, y: 390, size: 40, weight: 400, color: '#0f172a', align: 'left', w: 800, lh: 1.4 },
        { t: 'circle', cx: 190, cy: 800, r: 50, fill: '#c7d2fe', name: 'Зураг' },
        { t: 'text', text: 'Б', x: 140, y: 770, size: 50, body: 1, weight: 700, color: '#4338ca', w: 100 },
        { t: 'text', text: 'Болормаа Г.', x: 270, y: 764, size: 34, body: 1, weight: 700, color: '#0f172a', align: 'left', w: 650 },
        { t: 'text', text: 'Маркетингийн менежер', x: 270, y: 810, size: 28, body: 1, color: '#64748b', align: 'left', w: 650 },
        { t: 'text', text: 'ҮЙЛЧЛҮҮЛЭГЧИЙН СЭТГЭГДЭЛ', y: 965, size: 26, body: 1, weight: 700, color: '#64748b', cs: 300, w: 900 }
      ]; } },
    { id: 'notice', name: 'Мэдэгдэл', cat: 'biz', w: 1080, h: 1080, bg: '#facc15', fonts: ['Rubik', 'Inter'], sw: ['#facc15', '#111111', '#ffffff'],
      items: function () { return [
        { t: 'rect', x: 60, y: 60, w: 960, h: 960, fill: 'transparent', stroke: '#111111', sw: 6, name: 'Хүрээ' },
        { t: 'circle', cx: 540, cy: 245, r: 88, fill: '#111111', name: 'Тэмдэг' },
        { t: 'text', text: '!', x: 450, y: 170, size: 140, weight: 800, color: '#facc15', w: 180, lh: 1 },
        { t: 'text', text: 'МЭДЭГДЭЛ', y: 380, size: 120, weight: 800, color: '#111111', cs: 50, lh: 1 },
        { t: 'text', text: 'Эрхэм үйлчлүүлэгчид ээ, 10-р сарын 1-нд засвар үйлчилгээний улмаас манай салбар 14:00 цагаас хойш түр хаагдана.', y: 560, size: 42, body: 1, color: '#111111', w: 820, lh: 1.4 },
        { t: 'text', text: 'Ойлгосонд баярлалаа!', y: 850, size: 40, weight: 700, color: '#111111', w: 820 },
        { t: 'text', text: 'БАЙГУУЛЛАГЫН НЭР', y: 935, size: 28, body: 1, weight: 600, color: '#111111', cs: 200, w: 820 }
      ]; } },

    { id: 'event', name: 'Арга хэмжээний постер', cat: 'event', w: 1080, h: 1350, bg: '#e7e3fd', fonts: ['Montserrat', 'Inter'], sw: ['#e7e3fd', '#34229e', '#16161f'],
      items: function () { return [
        { t: 'circle', cx: 980, cy: 300, r: 420, fill: '#816dfb', name: 'Чимэглэл' },
        { t: 'text', text: 'DEMO DAY · 2026', x: 90, y: 560, size: 38, weight: 700, color: '#34229e', cs: 250, align: 'left', w: 900 },
        { t: 'text', text: 'Арга хэмжээний нэрээ энд бичнэ', x: 90, y: 640, size: 108, weight: 800, color: '#16161f', align: 'left', w: 900, lh: 1.05 },
        { t: 'rect', x: 90, y: 1080, w: 900, h: 3, fill: '#16161f', name: 'Шугам' },
        { t: 'text', text: '10.15 · 18:00  —  Улаанбаатар, Galaxy Tower', x: 90, y: 1120, size: 38, body: 1, color: '#16161f', align: 'left', w: 900 }
      ]; } },
    { id: 'course', name: 'Сургалтын бүртгэл', cat: 'event', w: 1080, h: 1080, bg: '#0e7490', fonts: ['Montserrat', 'Inter'], sw: ['#0e7490', '#fde047', '#ffffff'],
      items: function () { return [
        { t: 'circle', cx: 960, cy: 130, r: 230, fill: '#fde047', opacity: 0.95, name: 'Чимэглэл' },
        { t: 'text', text: 'БҮРТГЭЛ ЭХЭЛЛЭЭ', x: 90, y: 120, size: 34, weight: 700, color: '#fde047', cs: 300, align: 'left', w: 700 },
        { t: 'text', text: 'График дизайны\nсургалт', x: 90, y: 190, size: 84, weight: 800, color: '#ffffff', align: 'left', w: 900, lh: 1.05 },
        { t: 'text', text: 'Illustrator, Photoshop, Figma — 0-ээс эхлэн 8 долоо хоногт', x: 90, y: 400, size: 34, body: 1, color: '#cffafe', align: 'left', w: 820, lh: 1.4 },
        { t: 'rect', x: 90, y: 590, w: 400, h: 90, rx: 20, fill: 'rgba(255,255,255,0.14)', name: 'Шошго' },
        { t: 'rect', x: 510, y: 590, w: 480, h: 90, rx: 20, fill: 'rgba(255,255,255,0.14)', name: 'Шошго' },
        { t: 'text', text: 'Эхлэх: 10.20', x: 90, y: 616, size: 32, body: 1, weight: 600, color: '#ffffff', w: 400 },
        { t: 'text', text: 'Хугацаа: 8 долоо хоног', x: 510, y: 616, size: 32, body: 1, weight: 600, color: '#ffffff', w: 480 },
        { t: 'text', text: '390,000₮', x: 90, y: 730, size: 90, weight: 800, color: '#fde047', align: 'left', w: 900 },
        { t: 'rect', x: 90, y: 890, w: 440, h: 100, rx: 50, fill: '#fde047', name: 'Товч' },
        { t: 'text', text: 'Бүртгүүлэх', x: 90, y: 918, size: 38, weight: 700, color: '#0e2a33', w: 440 },
        { t: 'text', text: 'Хязгаартай суудал', x: 570, y: 922, size: 30, body: 1, color: '#cffafe', align: 'left', w: 420 }
      ]; } },
    { id: 'opening', name: 'Нээлт — Story', cat: 'event', w: 1080, h: 1920, bg: '#fff7ed', fonts: ['Oswald', 'Inter'], sw: ['#fff7ed', '#ea580c', '#1c1917'],
      items: function () { return [
        { t: 'text', text: 'ШИНЭ САЛБАР', y: 160, size: 60, weight: 600, color: '#ea580c', cs: 300, w: 960 },
        { t: 'text', text: 'НЭЭГДЛЭЭ!', y: 250, size: 165, weight: 700, color: '#1c1917', lh: 1, w: 1000 },
        ph(80, 520, 920, 760, 'Салбарын зургаа энд чирж тавина', '#fde6d2', 32),
        { t: 'text', text: '10.01 · 11:00', y: 1340, size: 80, weight: 700, color: '#ea580c', w: 960 },
        { t: 'text', text: 'Нээлтийн өдөр бүх бүтээгдэхүүнд 20% хямдрал', y: 1465, size: 44, body: 1, weight: 600, color: '#1c1917', w: 860, lh: 1.3 },
        { t: 'rect', x: 90, y: 1650, w: 900, h: 150, rx: 24, fill: '#1c1917', name: 'Хайрцаг' },
        { t: 'text', text: 'Сүхбаатар дүүрэг, Их тойруу 12,\n2 давхар', x: 130, y: 1682, size: 34, body: 1, color: '#fff7ed', w: 820, lh: 1.3 }
      ]; } },
    { id: 'live', name: 'Live / вебинар', cat: 'event', w: 1200, h: 630, bg: '#0f172a', fonts: ['Montserrat', 'Inter'], sw: ['#0f172a', '#ef4444', '#fbbf24'],
      items: function () { return [
        { t: 'rect', x: 80, y: 80, w: 190, h: 60, rx: 30, fill: '#ef4444', name: 'Шошго' },
        { t: 'circle', cx: 116, cy: 110, r: 9, fill: '#ffffff', name: 'Цэг' },
        { t: 'text', text: 'LIVE', x: 138, y: 92, size: 32, weight: 800, color: '#ffffff', align: 'left', w: 120 },
        { t: 'text', text: 'Онлайн сургалт: Брэндээ хэрхэн бүтээх вэ?', x: 80, y: 180, size: 62, weight: 800, color: '#ffffff', align: 'left', w: 740, lh: 1.1 },
        { t: 'text', text: '10.18  ·  20:00  ·  Zoom', x: 80, y: 445, size: 36, body: 1, weight: 600, color: '#fbbf24', align: 'left', w: 740 },
        { t: 'text', text: 'Бүртгэл үнэгүй', x: 80, y: 505, size: 30, body: 1, color: '#94a3b8', align: 'left', w: 740 },
        ph(870, 80, 250, 250, 'Илтгэгч', '#1e293b', 125),
        { t: 'text', text: 'Илтгэгчийн нэр', x: 845, y: 355, size: 30, body: 1, weight: 700, color: '#ffffff', w: 300 },
        { t: 'text', text: 'Албан тушаал', x: 845, y: 400, size: 24, body: 1, color: '#94a3b8', w: 300 }
      ]; } },

    { id: 'quote', name: 'Ишлэл', cat: 'other', w: 1080, h: 1080, bg: '#16161f', fonts: ['Lora', 'Inter'], sw: ['#16161f', '#816dfb', '#ffffff'],
      items: function () { return [
        { t: 'text', text: '“', y: 70, size: 360, weight: 700, color: '#816dfb', lh: 1 },
        { t: 'text', text: 'Энгийн байдал бол жинхэнэ ур чадварын дээд илэрхийлэл юм.', y: 390, size: 64, weight: 700, color: '#ffffff', w: 860, lh: 1.25 },
        { t: 'text', text: '— Нэр', y: 800, size: 36, body: 1, color: '#a497ff' }
      ]; } },
    { id: 'story', name: 'Story — шинэ бүтээгдэхүүн', cat: 'other', w: 1080, h: 1920, bg: '#816dfb', fonts: ['Montserrat', 'Inter'], sw: ['#816dfb', '#ffffff', '#0b0b14'],
      items: function () { return [
        { t: 'text', text: 'ШИНЭ', y: 180, size: 64, weight: 700, color: '#ffffff', cs: 400 },
        ph(140, 360, 800, 800, 'Бүтээгдэхүүний зургаа энд чирж тавина', 'rgba(255,255,255,0.18)', 40),
        { t: 'text', text: 'Бүтээгдэхүүний нэр', y: 1280, size: 104, weight: 800, color: '#ffffff', w: 900, lh: 1.05 },
        { t: 'rect', x: 330, y: 1560, w: 420, h: 130, rx: 65, fill: '#ffffff', name: 'Үнийн шошго' },
        { t: 'text', text: '49,900₮', x: 330, y: 1590, size: 64, weight: 800, color: '#0b0b14', w: 420 }
      ]; } },
    { id: 'fbcover', name: 'Facebook cover', cat: 'other', w: 1640, h: 624, bg: '#111827', fonts: ['Montserrat', 'Inter'], sw: ['#111827', '#4f46e5', '#06b6d4'],
      items: function () { return [
        { t: 'circle', cx: 1440, cy: 312, r: 360, fill: '#4f46e5', name: 'Чимэглэл' },
        { t: 'circle', cx: 1560, cy: 520, r: 180, fill: '#06b6d4', opacity: 0.9, name: 'Чимэглэл' },
        { t: 'text', text: 'БРЭНДИЙН НЭР', x: 120, y: 180, size: 110, weight: 800, color: '#ffffff', align: 'left', w: 1100 },
        { t: 'text', text: 'Таны уриа үг — юу хийдгээ нэг өгүүлбэрээр', x: 120, y: 325, size: 42, body: 1, color: '#cbd5e1', align: 'left', w: 1000 },
        { t: 'rect', x: 120, y: 425, w: 90, h: 5, fill: '#06b6d4', name: 'Шугам' },
        { t: 'text', text: 'www.brand.mn  ·  +976 8000 0000', x: 120, y: 455, size: 32, body: 1, weight: 600, color: '#e5e7eb', align: 'left', w: 1000 }
      ]; } },
    { id: 'yt', name: 'YouTube thumbnail', cat: 'other', w: 1280, h: 720, bg: '#0b0b14', fonts: ['Montserrat', 'Inter'], sw: ['#0b0b14', '#ffffff', '#ff4fd8'],
      items: function () { return [
        { t: 'rect', x: 0, y: 560, w: 1280, h: 160, fill: '#ff4fd8', name: 'Тууз' },
        { t: 'text', text: 'ГАРЧИГ ЭНД', y: 150, size: 170, weight: 800, color: '#ffffff', stroke: '#000000', sw: 10, w: 1180, lh: 1 },
        { t: 'text', text: 'Видеоны дэд гарчиг', y: 598, size: 64, weight: 700, color: '#0b0b14', w: 1180 }
      ]; } },
    { id: 'card', name: 'Нэрийн хуудас', cat: 'other', w: 1050, h: 600, bg: '#16161f', fonts: ['Montserrat', 'Inter'], sw: ['#16161f', '#e7e3fd', '#816dfb'],
      items: function () { return [
        { t: 'text', text: 'Нэр Овог', x: 90, y: 150, size: 72, weight: 800, color: '#e7e3fd', align: 'left', w: 800 },
        { t: 'text', text: 'График дизайнер', x: 90, y: 250, size: 34, body: 1, color: '#816dfb', align: 'left', w: 800 },
        { t: 'rect', x: 90, y: 340, w: 120, h: 4, fill: '#816dfb', name: 'Шугам' },
        { t: 'text', text: '+976 8000 0000\nhello@brand.mn\nbrand.mn', x: 90, y: 380, size: 30, body: 1, color: '#a6a8b8', align: 'left', w: 800, lh: 1.5 }
      ]; } }
  ];

  function starPts(r) {
    var pts = [];
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); }
    return pts;
  }

  // specs → fabric objects placed in a frame at (X, Y). font(name) returns a CSS font stack.
  function objects(tp, X, Y, font) {
    var F = window.fabric, out = [];
    font = font || function (n) { return '"' + n + '", sans-serif'; };
    tp.items().forEach(function (s) {
      var o;
      if (s.t === 'text') {
        var w = s.w || tp.w * 0.84;
        o = new F.Textbox(s.text, {
          fontFamily: font(s.body ? tp.fonts[1] : tp.fonts[0]), fontWeight: s.weight || (s.body ? 400 : 700), fontStyle: s.italic ? 'italic' : 'normal',
          fontSize: s.size, fill: s.color || '#ffffff', width: w, textAlign: s.align || 'center', lineHeight: s.lh || 1.15, charSpacing: s.cs || 0,
          left: X + (s.x != null ? s.x : (tp.w - w) / 2), top: Y + s.y, name: s.name || 'Текст'
        });
        if (s.stroke) o.set({ stroke: s.stroke, strokeWidth: s.sw || 4, paintFirst: 'stroke' });
      } else if (s.t === 'rect') {
        o = new F.Rect({ width: s.w, height: s.h, rx: s.rx || 0, ry: s.rx || 0, fill: s.fill, stroke: s.stroke || null, strokeWidth: s.sw || 0,
          opacity: s.opacity == null ? 1 : s.opacity, angle: s.angle || 0, name: s.name || 'Хэлбэр' });
        if (s.c) o.set({ originX: 'center', originY: 'center', left: X + s.x, top: Y + s.y }); else o.set({ left: X + s.x, top: Y + s.y });
        if (s.stroke) o.set({ strokeUniform: true });
      } else if (s.t === 'circle') {
        o = new F.Circle({ radius: s.r, fill: s.fill, opacity: s.opacity == null ? 1 : s.opacity, originX: 'center', originY: 'center', left: X + s.cx, top: Y + s.cy, name: s.name || 'Тойрог' });
      } else if (s.t === 'star') {
        o = new F.Polygon(starPts(s.r), { fill: s.fill, originX: 'center', originY: 'center', left: X + s.cx, top: Y + s.cy, name: 'Од' });
      } else if (s.t === 'ph') {
        o = new F.Rect({ left: X + s.x, top: Y + s.y, width: s.w, height: s.h, rx: s.rx, ry: s.rx, fill: s.fill, name: 'Зургийн байр' });
        out.push(o);
        var fs = Math.round(Math.max(18, Math.min(s.w, s.h) * 0.045));
        o = new F.Textbox(s.label, { fontFamily: font(tp.fonts[1]), fontSize: fs, fill: 'rgba(100,116,139,0.9)', width: s.w * 0.8, textAlign: 'center',
          left: X + s.x + s.w * 0.1, top: Y + s.y + s.h / 2 - fs * 0.7, name: 'Тайлбар' });
      }
      if (o) out.push(o);
    });
    return out;
  }
  var AX = { 'Cormorant Garamond': 'ital,wght@0,400;0,600;0,700;1,700', 'Lora': 'ital,wght@0,400;0,700;1,400;1,700', 'Oswald': 'wght@400;500;600;700',
    'Montserrat': 'wght@400;500;600;700;800', 'Inter': 'wght@400;500;600;700', 'Rubik': 'wght@400;600;700;800' };
  function cssUrl(tp) {
    return 'https://fonts.googleapis.com/css2?' + tp.fonts.map(function (f) { return 'family=' + f.replace(/ /g, '+') + ':' + (AX[f] || 'wght@400;700'); }).join('&') + '&display=swap';
  }
  window.GTPL = { list: LIST, cats: CATS, get: function (id) { return LIST.filter(function (t) { return t.id === id; })[0]; }, objects: objects, cssUrl: cssUrl };
})();
