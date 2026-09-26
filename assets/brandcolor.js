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
      g: { p: [[350, 360], [8, 18], [210, 222]], ps: [80, 95], pl: [45, 52], sec: 'deep', ac: [[68, 82], [180, 192]], as: [92, 100], al: [52, 58] } },
    { id: 'coffee', name: 'Кофе шоп', sub: 'Кофе, бейкери, цайны газар',
      why: 'Кофены бор, цөцгий, карамель өнгө дулаан, тухтай уур амьсгал төрүүлнэ. Нэг тод онцлох өнгө (улбар шар, ногоон) цэс, шошгыг тодруулна.',
      seeds: [['#4A2C1D', '#C8A27A', '#E4572E', '#20130C', '#F7EFE4'], ['#2F4538', '#B98B5E', '#F2A541', '#16211A', '#FAF5EC'], ['#6F4E37', '#E6CCB2', '#2A9D8F', '#2A1D14', '#FFF8F0']],
      g: { p: [[18, 30], [140, 160]], ps: [30, 50], pl: [18, 28], sec: 'light', ac: [[10, 24], [168, 178], [34, 42]], as: [65, 85], al: [48, 56], warm: 1 } },
    { id: 'travel', name: 'Аялал жуулчлал', sub: 'Тур, зочид буудал, кемп',
      why: 'Тэнгэрийн цэнхэр, тал хээрийн ногоон, элсэн шаргал — Монголын байгалийн өнгө. Нар жаргах улбар онцлох өнгө адал явдлын мэдрэмж нэмнэ.',
      seeds: [['#0077B6', '#90BE6D', '#F8961E', '#03263B', '#F4F9FB'], ['#1B4965', '#CAE9FF', '#E07A5F', '#0B2233', '#F7FAFC'], ['#2A6F97', '#D4A373', '#F4A261', '#102A3A', '#FBF7F1']],
      g: { p: [[195, 212]], ps: [60, 90], pl: [30, 42], sec: 'other', sr: [[85, 110], [28, 36]], ss: [40, 60], sl: [55, 65], ac: [[18, 32]], as: [80, 92], al: [55, 62] } },
    { id: 'realestate', name: 'Үл хөдлөх', sub: 'Орон сууц, барилгын компани',
      why: 'Гүн ногоон, хар хөх өнгө найдвартай, тогтвортой; алтлаг элсэн өнгө тансаг, үнэ цэнийг илэрхийлнэ. Том хоосон зайтай цайвар дэвсгэр зураг тодруулна.',
      seeds: [['#0F3D2E', '#C9A86A', '#E76F51', '#0A1F17', '#F6F4EF'], ['#1C2E4A', '#B08D57', '#4F9D8A', '#0E1726', '#F5F3EE'], ['#3A3A3A', '#A3B18A', '#C08552', '#161616', '#F7F6F2']],
      g: { p: [[150, 170], [212, 226]], ps: [30, 60], pl: [16, 26], sec: 'other', sr: [[36, 44]], ss: [40, 55], sl: [52, 60], ac: [[10, 20], [160, 175]], as: [45, 70], al: [45, 55], warm: 1 } },
    { id: 'fashion', name: 'Загвар, хувцас', sub: 'Бутик, streetwear, ноолуур',
      why: 'Хар, цагаан суурь дээр нэг зоримог өнгө (тод улаан, лайм, ягаан) — орчин үеийн хувцасны брэндүүдийн түгээмэл хэв маяг. Бүтээгдэхүүний зураг гол дүр болно.',
      seeds: [['#111111', '#E9E4DC', '#FF3B30', '#000000', '#FAFAF7'], ['#1E1E1E', '#C2B8A3', '#D9FF3F', '#0B0B0B', '#F4F2EE'], ['#2B2B2B', '#F2D0D9', '#B5179E', '#121212', '#FFF9FB']],
      g: { p: [[0, 360]], ps: [0, 8], pl: [8, 16], sec: 'light', ac: [[350, 360], [68, 80], [300, 320], [200, 215]], as: [85, 100], al: [50, 58] } },
    { id: 'cashmere', name: 'Ноолуур · Монгол бүтээгдэхүүн', sub: 'Ноолуур, арьс, гар урлал',
      why: 'Тэмээний хүрэн, ямааны ноолуурын цөцгий, сүүн цагаан — байгалийн, дулаан, өндөр чанарын мэдрэмж. Гүн хөх эсвэл бордо онцлох өнгө үндэсний онцлог нэмнэ.',
      seeds: [['#8C6A4F', '#D9C6A5', '#1F3A5F', '#2A1F17', '#FAF6EF'], ['#5E4B3C', '#E8DCC8', '#8B1E3F', '#221A14', '#FBF8F2'], ['#A47551', '#EFE4D2', '#2E5E4E', '#2B2018', '#FFFBF5']],
      g: { p: [[22, 34]], ps: [25, 40], pl: [30, 45], sec: 'light', ac: [[210, 222], [338, 348], [150, 165]], as: [40, 60], al: [25, 35], warm: 1 } },
    { id: 'creative', name: 'Креатив агентлаг', sub: 'Дизайн, маркетинг, медиа',
      why: 'Зоримог, гэнэтийн хослол (ягаан-хөх, лайм-ягаан) креатив, шинэлэг байдлыг харуулна. Бараан суурь дээр тод өнгө портфолио, контентыг тодруулна.',
      seeds: [['#5B2EFF', '#FF6AD5', '#D9FF3F', '#0E0B1F', '#F6F4FF'], ['#FF4D2E', '#2E3BFF', '#FFD23F', '#120F0E', '#FFF7F2'], ['#00C2A8', '#7B61FF', '#FF9F1C', '#0A1414', '#F2FFFC']],
      g: { p: [[250, 275], [5, 15], [168, 178]], ps: [85, 100], pl: [52, 60], sec: 'triad', ac: 'triad2', as: [90, 100], al: [55, 62] } },
    { id: 'night', name: 'Энтертайнмент', sub: 'Паб, клуб, тоглолт, тоглоом',
      why: 'Бараан суурь дээрх неон ягаан, цэнхэр өнгө шөнийн амьдрал, хөгжим, эрч хүчийг илэрхийлнэ. Контраст өндөр тул постер, story-д маш тод харагдана.',
      seeds: [['#FF2E88', '#29F0FF', '#FFE600', '#07070B', '#F4F4FA'], ['#8A2BE2', '#00F5D4', '#FF006E', '#0B0514', '#F7F3FF'], ['#FF5F1F', '#7B2FF7', '#00E5FF', '#0A0A12', '#F5F5FA']],
      g: { p: [[320, 340], [270, 285], [15, 25]], ps: [90, 100], pl: [52, 60], sec: 'triad', ac: [[55, 62], [175, 190]], as: [95, 100], al: [50, 56] } },
    { id: 'auto', name: 'Авто · Логистик', sub: 'Авто засвар, тээвэр, түрээс',
      why: 'Хар саарал, металл өнгө хүч, техникийг; тод улаан эсвэл шар онцлох өнгө хурд, анхаарлыг илэрхийлнэ. Энгийн, хүчтэй контраст замын зар шиг алсаас уншигдана.',
      seeds: [['#1F2933', '#9AA5B1', '#E12D39', '#0B0F14', '#F5F7FA'], ['#0B2545', '#8DA9C4', '#FFC300', '#051326', '#F4F7FB'], ['#2E2E2E', '#F2F2F2', '#FF6B00', '#121212', '#FAFAFA']],
      g: { p: [[205, 220]], ps: [15, 45], pl: [15, 24], sec: 'light', ac: [[352, 360], [44, 50], [22, 28]], as: [85, 100], al: [48, 55] } }
  ];
  var HAR = [['auto', 'Санамсаргүй'], ['mono', 'Нэг өнгө'], ['analog', 'Ойролцоо'], ['comp', 'Эсрэг'], ['split', 'Хуваасан эсрэг'], ['triad', 'Гурвалжин'], ['tetrad', 'Дөрвөлжин']];
  var TONES = [['vivid', 'Тод'], ['soft', 'Зөөлөн'], ['muted', 'Бүдэг'], ['deep', 'Гүн']];
  var TONE_SL = { vivid: [[75, 95], [48, 58]], soft: [[50, 72], [70, 80]], muted: [[18, 34], [44, 58]], deep: [[45, 70], [22, 34]] };
  var HAR_WHY = {
    mono: 'Нэг өнгөний өөр өөр тод, бараан хувилбар — цэвэр, тайван, мэргэжлийн харагдана.',
    analog: 'Өнгөний хүрдэн дээр зэрэгцээ орших өнгө — зөөлөн, эв найртай, байгалийн мэдрэмжтэй.',
    comp: 'Өнгөний хүрдний эсрэг талын өнгө — хамгийн хүчтэй контраст, анхаарал татна.',
    split: 'Эсрэг өнгөний хоёр хөршийг авна — контраст хүчтэй хэрнээ илүү зөөлөн, тэнцвэртэй.',
    triad: 'Хүрдэн дээр тэнцүү зайтай гурван өнгө — хөгжилтэй, эрч хүчтэй, олон өнгөтэй брэндэд.',
    tetrad: 'Хоёр хос эсрэг өнгө — баялаг, олон төрлийн контент хийхэд уян хатан.'
  };
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

  function harmony(base, mode, tone) {
    var h = hex2hsl(base), ph = h[0], sl = TONE_SL[tone] || TONE_SL.vivid;
    if (mode === 'auto') mode = pickRange(['analog', 'comp', 'split', 'triad', 'tetrad', 'mono']);
    var j = function () { return R([-8, 8]); }, hs;
    if (mode === 'mono') hs = [ph + j() / 2, ph + R([8, 18])];
    else if (mode === 'analog') hs = [ph + R([26, 40]), ph - R([26, 40])];
    else if (mode === 'comp') hs = [ph + 180 + j(), ph + 180 + j()];
    else if (mode === 'split') hs = [ph + 150 + j() / 2, ph + 210 + j() / 2];
    else if (mode === 'triad') hs = [ph + 120 + j(), ph + 240 + j()];
    else hs = [ph + 90 + j(), ph + 180 + j()];
    var s, a;
    if (mode === 'mono') {
      s = hsl2hex(hs[0], clamp(h[1] - R([10, 25]), 10, 90), clamp(h[2] + (h[2] < 55 ? R([22, 32]) : -R([22, 30])), 15, 85));
      a = hsl2hex(hs[1], clamp(R(sl[0]) + 5, 30, 100), R(sl[1]));
    } else if (mode === 'comp') {
      s = hsl2hex(hs[0], clamp(R(sl[0]) - 30, 10, 60), clamp(R(sl[1]) + 20, 30, 88));
      a = hsl2hex(hs[1], R(sl[0]), R(sl[1]));
    } else {
      s = hsl2hex(hs[0], R(sl[0]), R(sl[1]));
      a = hsl2hex(hs[1], clamp(R(sl[0]) + 6, 0, 100), R(sl[1]));
    }
    var dk = hsl2hex(ph, R([18, 38]), R([7, 12])), lt = hsl2hex(ph, R([25, 55]), R([95.5, 97.5]));
    return { cols: [base.toUpperCase(), s, a, dk, lt], mode: mode };
  }
  function randomBase() { return hsl2hex(Math.random() * 360, R([55, 90]), R([38, 56])); }

  // ---------- state ----------
  var st = { ind: IND[0], cols: IND[0].seeds[0].slice(), lock: [0, 0, 0, 0, 0], seed: 0, brand: 'Номин', hist: [], mode: 'ind', har: 'auto', tone: 'vivid', used: '' };
  (function fromUrl() {
    try {
      var q = new URLSearchParams(location.search), i = IND.filter(function (x) { return x.id === q.get('i'); })[0];
      if (i) { st.ind = i; st.cols = i.seeds[0].slice(); }
      var c = (q.get('c') || '').split('-').map(function (x) { return '#' + x.toUpperCase(); });
      if (c.length === 5 && c.every(function (x) { return /^#[0-9A-F]{6}$/.test(x); })) st.cols = c;
      if (q.get('b')) st.brand = q.get('b').slice(0, 24);
      if (q.get('m') === 'h') st.mode = 'har';
      if (HAR.some(function (x) { return x[0] === q.get('h'); })) st.har = q.get('h');
      if (TONE_SL[q.get('t')]) st.tone = q.get('t');
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
    return location.origin + location.pathname + (st.mode === 'har' ? '?m=h&h=' + st.har + '&t=' + st.tone : '?i=' + st.ind.id) + '&c=' + st.cols.map(function (c) { return c.slice(1); }).join('-') + (st.brand !== 'Номин' ? '&b=' + encodeURIComponent(st.brand) : '');
  }
  function syncUrl() { try { history.replaceState(null, '', shareUrl()); } catch (e) {} }

  // fonts for the mockups (Mongolian-ready)
  var fl = document.createElement('link'); fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;800&family=Inter:wght@400;600&display=swap';
  document.head.appendChild(fl);

  root.innerHTML =
    '<div class="bc-mode" role="tablist" aria-label="Горим"><button type="button" role="tab" data-mode="ind">Салбараар сонгох</button><button type="button" role="tab" data-mode="har">Өнгөөс палитр үүсгэх</button></div>' +
    '<div id="bc-indwrap"><div class="bc-inds" id="bc-inds" role="tablist" aria-label="Салбар"></div></div>' +
    '<div class="bc-har" id="bc-har" hidden></div>' +
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

  function renderMode() {
    root.querySelectorAll('[data-mode]').forEach(function (b) { var on = b.dataset.mode === st.mode; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('#bc-indwrap').hidden = st.mode !== 'ind'; $('#bc-har').hidden = st.mode !== 'har';
    if (st.mode === 'har') {
      var chip = function (key, list) { return list.map(function (x) { return '<button type="button" class="' + (st[key] === x[0] ? 'on' : '') + '" data-' + key + '="' + x[0] + '">' + x[1] + '</button>'; }).join(''); };
      $('#bc-har').innerHTML =
        '<div class="bc-base"><label class="bc-basesw" style="background:' + st.cols[0] + '" title="Үндсэн өнгө сонгох"><input type="color" id="bc-basec" value="' + st.cols[0].toLowerCase() + '"></label>' +
          '<div><span>Үндсэн өнгө</span><input id="bc-baseh" value="' + st.cols[0] + '" maxlength="7" spellcheck="false" aria-label="HEX код"></div>' +
          '<button type="button" class="bc-ghost" id="bc-rbase">🎲 Санамсаргүй</button></div>' +
        '<div class="bc-chips"><span>Хослол</span>' + chip('har', HAR) + '</div>' +
        '<div class="bc-chips"><span>Өнгө аяс</span>' + chip('tone', TONES) + '</div>' +
        '<div class="bc-wheel" id="bc-wheel"></div>';
      renderWheel();
    }
  }
  function renderWheel() {
    var el = $('#bc-wheel'); if (!el) return;
    var dots = st.cols.slice(0, 3).map(function (c, i) {
      var h = hex2hsl(c), a = (h[0] - 90) * Math.PI / 180, r = 38;
      return '<i style="left:' + (50 + Math.cos(a) * r) + '%;top:' + (50 + Math.sin(a) * r) + '%;background:' + c + '" title="' + ROLES[i][0] + '"></i>';
    }).join('');
    el.innerHTML = '<div class="bc-ring">' + dots + '</div>';
  }
  function renderInds() {
    $('#bc-inds').innerHTML = IND.map(function (i) {
      return '<button type="button" role="tab" aria-selected="' + (i === st.ind) + '" class="' + (i === st.ind ? 'on' : '') + '" data-ind="' + i.id + '">' +
        '<span class="dots">' + i.seeds[0].slice(0, 3).map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>' +
        '<b>' + esc(i.name) + '</b><small>' + esc(i.sub) + '</small></button>';
    }).join('');
    var hm = st.used || (st.har === 'auto' ? '' : st.har);
    $('#bc-why').innerHTML = st.mode === 'har'
      ? '<b>' + (hm ? HAR.filter(function (x) { return x[0] === hm; })[0][1] + ' хослол.' : 'Санамсаргүй хослол.') + '</b> ' + esc(HAR_WHY[hm] || 'Үндсэн өнгөө сонгоод «Өөр хувилбар» дарах бүрт өөр хослол гарна. Таалагдсан өнгөө 🔒 түгжинэ.')
      : '<b>Яагаад эдгээр өнгө?</b> ' + esc(st.ind.why);
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
  function mix(a, b, t) { var x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
  function renderMocks() {
    var c = st.cols, P = c[0], S = c[1], A = c[2], D = c[3], L = c[4], n = esc(st.brand || 'Брэнд');
    var init = esc((st.brand || 'Б').trim().charAt(0).toUpperCase());
    var oP = onColor(P), oA = onColor(A), oS = onColor(S), oD = onColor(D);
    var hf = "font-family:Montserrat,'Inter',sans-serif", bf = "font-family:Inter,sans-serif";
    var mk = function (bg, fg, cls) { return '<span class="mk' + (cls ? ' ' + cls : '') + '" style="background:' + bg + ';color:' + fg + '">' + init + '<i style="background:' + A + '"></i></span>'; };
    var dom = esc((st.brand || 'brand').toLowerCase().replace(/[^a-zа-яөү0-9]/gi, '')) || 'brand';
    var soft = mix(L, P, 0.08), line = mix(L, D, 0.1);
    $('#bc-mocks').innerHTML =
      // logo board
      '<figure class="bc-m span2"><div class="bc-logos">' +
        '<div class="t1" style="background:' + L + ';color:' + D + ';' + hf + '">' + mk(P, oP) + '<b>' + n + '</b><small style="' + bf + ';color:' + mix(D, L, 0.4) + '">' + dom + '.mn</small></div>' +
        '<div class="t2" style="background:' + P + ';color:' + oP + ';' + hf + '">' + mk(oP, P) + '<b>' + n + '</b></div>' +
        '<div class="t3" style="background:' + D + ';color:' + oD + ';' + hf + '">' + mk(A, oA, 'big') + '</div>' +
        '<div class="t4" style="background:' + S + ';color:' + oS + ';' + hf + '"><b>' + n + '</b><span class="pat">' + [0, 1, 2, 3, 4, 5].map(function () { return '<i style="border-color:' + oS + '"></i>'; }).join('') + '</span></div>' +
      '</div><figcaption>Лого — үндсэн, урвуу, тэмдэг, дэвсгэр</figcaption></figure>' +
      // social post 4:5
      '<figure class="bc-m"><div class="bc-post" style="background:' + P + ';color:' + oP + ';' + hf + '">' +
        '<i class="sh1" style="background:' + S + '"></i><i class="sh2" style="border-color:' + oP + '"></i>' +
        '<div class="top" style="' + bf + '"><span class="mk sm" style="background:' + oP + ';color:' + P + '">' + init + '</span>' + n + '</div>' +
        '<b>Шинэ улирлын<br>цуглуулга</b><p style="' + bf + '">Зөвхөн энэ долоо хоногт</p>' +
        '<span class="st" style="background:' + A + ';color:' + oA + '"><em>−20</em>%</span>' +
        '<span class="btn" style="background:' + L + ';color:' + D + '">Захиалах →</span>' +
      '</div><figcaption>Instagram пост · 4:5</figcaption></figure>' +
      // website
      '<figure class="bc-m span3"><div class="bc-web" style="background:' + L + ';color:' + D + ';' + bf + '">' +
        '<nav><b style="' + hf + '">' + mk(P, oP, 'sm') + n + '</b><span>Бүтээгдэхүүн</span><span>Үнэ</span><span>Бидний тухай</span><em style="background:' + D + ';color:' + oD + '">Нэвтрэх</em></nav>' +
        '<div class="bc-hero"><div><small style="background:' + soft + ';color:' + P + '"><i style="background:' + A + '"></i>2026 оны шинэчлэл</small><h3 style="' + hf + '">Таны бизнест<br>тохирсон <u style="text-decoration-color:' + A + '">ухаалаг</u> шийдэл</h3>' +
          '<p>Хэдхэн минутад бүртгүүлж, өнөөдрөөс эхлэн ашиглаарай.</p>' +
          '<span class="b1" style="background:' + P + ';color:' + oP + '">Үнэгүй эхлэх →</span><span class="b2" style="color:' + D + ';border-color:' + line + '">Дэлгэрэнгүй</span>' +
          '<div class="trust" style="color:' + mix(D, L, 0.45) + '"><span>' + ['#', '#', '#'].map(function (x, i) { return '<i style="background:' + [P, S, A][i] + ';border-color:' + L + '"></i>'; }).join('') + '</span>12,000+ хэрэглэгч</div></div>' +
          '<div class="art"><div class="card" style="background:#fff;color:' + D + '"><div class="ch"><b style="' + hf + '">Борлуулалт</b><em style="background:' + soft + ';color:' + P + '">+24%</em></div>' +
            '<div class="bars">' + [42, 58, 50, 72, 64, 88, 78].map(function (h, i) { return '<i style="height:' + h + '%;background:' + (i === 5 ? P : mix(L, P, 0.22)) + '"></i>'; }).join('') + '</div></div>' +
            '<div class="pill" style="background:' + A + ';color:' + oA + '">★ 4.9 үнэлгээ</div>' +
            '<div class="dot" style="background:' + S + '"></div></div></div>' +
      '</div><figcaption>Вэбсайт</figcaption></figure>' +
      // mobile app
      '<figure class="bc-m"><div class="bc-stage" style="background:' + mix(D, P, 0.18) + '"><div class="bc-phone" style="background:' + L + ';color:' + D + ';' + bf + '">' +
        '<div class="ph-top"><b style="' + hf + '">Сайн уу 👋</b><span class="mk sm" style="background:' + P + ';color:' + oP + '">' + init + '</span></div>' +
        '<div class="ph-card" style="background:linear-gradient(135deg,' + P + ',' + mix(P, S, 0.55) + ');color:' + oP + '"><small>Үлдэгдэл</small><b style="' + hf + '">1,250,000₮</b><span>' + n + ' Card · 4821</span></div>' +
        '<div class="ph-acts">' + ['Илгээх', 'Төлөх', 'Хадгалах'].map(function (t, i) { return '<span><i style="background:' + [soft, mix(L, S, 0.22), mix(L, A, 0.25)][i] + ';color:' + [P, mix(S, D, 0.35), mix(A, D, 0.35)][i] + '">' + ['↗', '▤', '◎'][i] + '</i>' + t + '</span>'; }).join('') + '</div>' +
        '<div class="ph-list">' + [['Кофе', '−8,500₮', A], ['Цалин', '+2.4 сая₮', S], ['Такси', '−12,000₮', P]].map(function (r) { return '<div><i style="background:' + r[2] + '"></i><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('') + '</div>' +
        '<div class="ph-nav" style="border-color:' + line + '"><i style="background:' + P + '"></i><i></i><i></i><i></i></div>' +
      '</div></div><figcaption>Гар утасны апп</figcaption></figure>' +
      // business cards
      '<figure class="bc-m"><div class="bc-stage cards" style="background:' + mix(L, S, 0.35) + '">' +
        '<div class="bc-card f" style="background:' + D + ';color:' + oD + ';' + hf + '">' + mk(P, oP) + '<b>' + n + '</b><i class="bar" style="background:' + A + '"></i></div>' +
        '<div class="bc-card b" style="background:' + L + ';color:' + D + ';' + bf + '"><b style="' + hf + '">Бат-Эрдэнэ Д.</b><span style="color:' + P + '">Гүйцэтгэх захирал</span><p>+976 9911 2233<br>hello@' + dom + '.mn<br>' + dom + '.mn</p><i class="c" style="background:' + P + '"></i></div>' +
      '</div><figcaption>Нэрийн хуудас</figcaption></figure>' +
      // merch
      '<figure class="bc-m"><div class="bc-stage merch" style="background:' + mix(L, A, 0.18) + '">' +
        '<div class="bag" style="background:' + P + ';color:' + oP + ';' + hf + '"><span class="hd" style="border-color:' + mix(P, D, 0.45) + '"></span>' + mk(oP, P) + '<b>' + n + '</b><i style="background:' + A + '"></i></div>' +
        '<div class="cup" style="background:' + L + ';' + hf + '"><span class="lid" style="background:' + D + '"></span><span class="band" style="background:' + S + ';color:' + oS + '">' + init + '</span></div>' +
        '<div class="stk" style="background:' + A + ';color:' + oA + ';' + hf + '">ШИНЭ!</div>' +
      '</div><figcaption>Уут, аяга, стикер</figcaption></figure>';
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
    renderMode(); renderInds(); renderPal(); renderScales(); renderMocks(); renderCx();
    $('#bc-undo').disabled = !st.hist.length;
    $('#bc-editor').href = '/editor/?pal=' + st.cols.map(function (c) { return c.slice(1); }).join('-') + '&paln=' + encodeURIComponent((st.brand || 'Брэнд') + ' — ' + (st.mode === 'har' ? 'палитр' : st.ind.name));
    syncUrl();
  }

  function next() {
    st.hist.push(st.cols.slice()); if (st.hist.length > 40) st.hist.shift();
    st.seed++;
    var fresh;
    if (st.mode === 'har') { var hr = harmony(st.cols[0], st.har, st.tone); fresh = hr.cols; st.used = hr.mode; }
    else fresh = st.seed < st.ind.seeds.length ? st.ind.seeds[st.seed].slice() : generate(st.ind);
    st.cols = st.cols.map(function (c, i) { return st.lock[i] ? c : fresh[i]; });
    renderAll();
  }
  function png() {
    var W = 1600, H = 900, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var x = cv.getContext('2d'); x.fillStyle = st.cols[4]; x.fillRect(0, 0, W, H);
    var font = '"Montserrat", "Inter", sans-serif';
    x.fillStyle = st.cols[3]; x.font = '800 64px ' + font; x.fillText(st.brand || 'Брэнд', 80, 130);
    x.font = '500 28px ' + font; x.globalAlpha = 0.7; x.fillText('Брэндийн өнгө · ' + (st.mode === 'har' ? 'палитр' : st.ind.name), 80, 180); x.globalAlpha = 1;
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
    if ((t = e.target.closest('[data-mode]'))) {
      if (st.mode === t.dataset.mode) return;
      st.mode = t.dataset.mode;
      if (st.mode === 'har') { st.hist.push(st.cols.slice()); var hr0 = harmony(st.cols[0], st.har, st.tone); st.used = hr0.mode; st.cols = st.cols.map(function (c, i) { return st.lock[i] ? c : hr0.cols[i]; }); }
      renderAll(); return;
    }
    if ((t = e.target.closest('[data-har]')) || (t = e.target.closest('[data-tone]'))) {
      if (t.dataset.har) st.har = t.dataset.har; else st.tone = t.dataset.tone;
      st.hist.push(st.cols.slice()); var hr1 = harmony(st.cols[0], st.har, st.tone); st.used = hr1.mode;
      st.cols = st.cols.map(function (c, i) { return i === 0 || st.lock[i] ? c : hr1.cols[i]; });
      renderAll(); return;
    }
    if (e.target.closest('#bc-rbase')) {
      st.hist.push(st.cols.slice()); var hr2 = harmony(randomBase(), st.har, st.tone); st.used = hr2.mode;
      st.cols = st.cols.map(function (c, i) { return st.lock[i] ? c : hr2.cols[i]; });
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
    if (e.target.id === 'bc-basec' || (e.target.id === 'bc-baseh' && /^#?[0-9a-f]{6}$/i.test(e.target.value.trim()))) {
      var v = e.target.value.trim(); if (v[0] !== '#') v = '#' + v; v = v.toUpperCase();
      var hr3 = harmony(v, st.har === 'auto' ? (st.used || 'analog') : st.har, st.tone);
      st.cols = st.cols.map(function (c, i) { return i === 0 ? v : st.lock[i] ? c : hr3.cols[i]; });
      renderPal(); renderScales(); renderMocks(); renderCx(); renderWheel(); syncUrl();
      var sw0 = root.querySelector('.bc-basesw'); if (sw0) sw0.style.background = v;
      if (e.target.id === 'bc-basec') $('#bc-baseh').value = v; else $('#bc-basec').value = v.toLowerCase();
      return;
    }
    if (e.target.id === 'bc-name') { st.brand = e.target.value; renderMocks(); renderAll(); }
  });
  root.addEventListener('change', function (e) { if (e.target.dataset.edit != null || e.target.id === 'bc-basec' || e.target.id === 'bc-baseh') renderAll(); });
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target.tagName || '')) && !e.target.isContentEditable) { e.preventDefault(); next(); }
  });
  renderAll();
})();
