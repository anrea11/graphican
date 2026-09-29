/* Graphican — илтгэлийн загварууд, 4-р багц: хэрэглэгчийн 15 PowerPoint загварыг (01-minimal-tsagaan … 15-industrial) шинэчилсэн хувилбар.
   Агуулга нь эх файлуудтай ижил (нүүр, агуулга, бидний тухай, давуу тал, үзүүлэлт, баярлалаа); өнгө, хэв маяг нь загвар бүрийнх,
   харин зохиомж, фонт (Ө Ү дэмждэг), шатлал, чимэглэл, икон, анимэйшнийг шинээр хийсэн. 1920×1080. */
(function () {
  'use strict';
  var G = window.GTPL; if (!G || !G.H) return;
  var H = G.H, T = H.T, R = H.R, C = H.C, BLOB = H.BLOB, BG = H.BG, PHOTO = H.PHOTO, SCRIM = H.SCRIM, lin = H.lin, GRAIN = H.GRAIN;
  var W = 1920, HH = 1080, M = 120;

  // ---------- content (same in every deck, as in the source files) ----------
  var KICK = 'БИЗНЕС ТАНИЛЦУУЛГА', TITLE = 'Бизнесийн\nтанилцуулга', SUB = 'Компанийн нэр  •  2026';
  var AGENDA = [['Бидний тухай', 'Түүх, алсын хараа, баг'], ['Бүтээгдэхүүн ба үйлчилгээ', 'Юу санал болгодог вэ'], ['Зах зээлийн боломж', 'Хэрэгцээ ба өрсөлдөөн'], ['Санхүүгийн төлөвлөгөө', 'Орлого, өсөлтийн зорилт']];
  var ABOUT = ['2015 оноос хойш тасралтгүй өсөлттэй ажиллаж байна', '120+ харилцагч, 8 салбарт үйлчилгээ үзүүлдэг', 'Мэргэжлийн 45 хүний бүрэлдэхүүнтэй баг', 'Олон улсын чанарын стандартын гэрчилгээтэй'];
  var QUOTE = 'Чанар бол бидний амлалт', QBY = '— Гүйцэтгэх захирал';
  var ADV = [['Туршлага', '10+ жилийн салбарын туршлагатай хамт олон.', 'award'], ['Шинэлэг шийдэл', 'Технологид суурилсан ухаалаг үйлчилгээ.', 'bulb']];
  var STATS = [['120+', 'Харилцагч', 'users'], ['98%', 'Сэтгэл ханамж', 'heart'], ['15', 'Шагнал', 'trophy']];
  var CONTACT = [['mail', 'info@company.mn'], ['phone', '+976 7000-0000'], ['globe', 'www.company.mn']];

  // ---------- helpers ----------
  var IC = {
    award: 'M19 8a7 7 0 1 1-14 0a7 7 0 1 1 14 0 M8.21 13.89L7 23l5-3 5 3-1.21-9.12',
    bulb: 'M9 18h6 M10 22h4 M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8a6 6 0 0 0-12 0c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0a4 4 0 1 1 8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    trophy: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2z',
    mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6',
    phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    globe: 'M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0 M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
    check: 'M20 6L9 17l-5-5',
    quote: 'M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1z M15 21c3 0 7-1 7-8V5c0-1.25-.77-2.02-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z',
    arrow: 'M5 12h14 M12 5l7 7-7 7'
  };
  function P(name, x, y, size, color, o) { o = o || {}; o.t = 'path'; o.d = IC[name]; o.x = x; o.y = y; o.size = size; if (o.fillIcon) { o.fill = color; delete o.fillIcon; } else o.stroke = color; return o; }
  // (a raw path in slide pixels: {t:'path', d, x:0, y:0, size:24} — size 24 means scale 1)
  function L(text, y, size, x, w, o) { o = o || {}; o.align = o.align || 'left'; o.x = x; o.w = w; return T(text, y, size, o); }
  function rr(x, y, w, h, fill, r, o) { o = o || {}; o.rx = r; return R(x, y, w, h, fill, o); }
  function up(s, th) { return th.upper ? s.toUpperCase() : s; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  var A = function (t, dl, o) { o = o || {}; o.anim = t; o.dl = dl || 0; return o; };

  // slide header: small label + title, in the deck's style
  function head(th, label, title, o) {
    o = o || {};
    var x = o.x == null ? M : o.x, w = o.w || 1300, out = [], hs = th.headStyle || 'bar', ty = 150;
    if (hs === 'rule') {
      out.push(L(label, 92, 22, x, w, A('fade', 0, { body: 1, weight: 600, color: th.acc, cs: 300 })));
      out.push(L(up(title, th), ty - 12, th.hSize || 76, x, w, A('rise', 0.1, { weight: th.hW || 700, color: th.ink, lh: 1.05, italic: th.hItalic })));
      out.push(R(x, 272, W - 2 * M, 2, th.ink, { opacity: 0.85, name: 'Шугам' }));
    } else if (hs === 'num') {
      out.push(L(label, 118, 150, x - 6, 300, { weight: 800, color: th.acc, opacity: th.numOp || 0.18, lh: 1 }));
      out.push(L(up(title, th), 150, th.hSize || 72, x + 230, w, A('rise', 0.05, { weight: th.hW || 800, color: th.ink, lh: 1.05 })));
    } else if (hs === 'tag') {
      out.push(rr(x, 96, 150, 44, th.tagBg || th.acc, 22, { name: 'Шошго', opacity: th.tagOp == null ? 1 : th.tagOp }));
      out.push(L(label, 104, 20, x, 150, { body: 1, weight: 700, color: th.tagInk || th.bg, align: 'center', cs: 200 }));
      out.push(L(up(title, th), 162, th.hSize || 72, x, w, A('rise', 0.05, { weight: th.hW || 800, color: th.ink, lh: 1.05 })));
    } else if (hs === 'mono') {
      out.push(L('// ' + label, 104, 22, x, w, A('type', 0, { body: 1, weight: 500, color: th.acc2 || th.acc, cs: 100 })));
      out.push(L(up(title, th), ty - 10, th.hSize || 72, x, w, A('rise', 0.1, { weight: th.hW || 700, color: th.ink, lh: 1.05 })));
    } else {   // 'bar'
      out.push(L(label, 104, 22, x, w, A('fade', 0, { body: 1, weight: 700, color: th.acc, cs: 300 })));
      out.push(L(up(title, th), ty - 8, th.hSize || 72, x, w, A('rise', 0.08, { weight: th.hW || 800, color: th.ink, lh: 1.05 })));
      out.push(R(x, 250, 96, 8, th.acc, A('wipe', 0.2, { rx: th.pill ? 4 : 0, name: 'Шугам' })));
    }
    return out;
  }

  // ---------- 6 slides, each with a few layouts; a deck picks one layout per slide ----------
  function cover(th) {
    var v = th.cover, o = [BG(th.coverBg || th.bg, th.grain ? { fx: GRAIN } : {})].concat(th.deco ? th.deco('cover') : []);
    var tc = th.coverInk || th.ink, kick = th.kick || KICK, tSize = th.tSize || 132;
    if (v === 'center') {
      var ty = 540 - tSize * 1.02 - 30, ly = ty + tSize * 2.04 + 60;
      o.push(T(kick, ty - 70, 26, A('fade', 0, { body: 1, weight: 600, color: th.acc, cs: 600 })));
      o.push(T(up(TITLE, th), ty, tSize, A('rise', 0.1, { weight: th.tW || 700, color: tc, lh: 1.02, italic: th.tItalic, w: 1500 })));
      o.push(R(W / 2 - 60, ly, 120, 3, th.acc, A('wipe', 0.35, { name: 'Шугам' })));
      o.push(T(SUB, ly + 40, 30, A('fade', 0.45, { body: 1, weight: 500, color: th.muted, cs: 150 })));
    } else if (v === 'split') {
      var pw = th.splitW || 820;
      o.push(R(0, 0, pw, HH, th.panel || th.acc, { name: 'Панел' }));
      if (th.coverPhoto) o.push(PHOTO(pw, 0, W - pw, HH, th.coverPhoto), R(pw, 0, W - pw, HH, th.bg, { opacity: th.photoTint || 0.15, name: 'Өнгө' }));
      o.push(L(kick, 250, 24, M, pw - 2 * M, A('fade', 0, { body: 1, weight: 700, color: th.panelAcc || th.bg, cs: 400 })));
      o.push(L(up(TITLE, th), 300, th.tSize || 112, M - 6, pw - M, A('rise', 0.1, { weight: th.tW || 800, color: th.panelInk || '#ffffff', lh: 1.02 })));
      o.push(R(M, 610, 90, 8, th.panelAcc || '#ffffff', A('wipe', 0.3, { name: 'Шугам' })));
      o.push(L(SUB, 660, 30, M, pw - 2 * M, A('fade', 0.4, { body: 1, weight: 500, color: th.panelMuted || th.panelInk || '#ffffff', opacity: 0.85 })));
    } else if (v === 'photo') {
      var sc = th.scrim || th.bg, py = 380 + tSize * 2.04 + 40;
      o.push(PHOTO(0, 0, W, HH, th.coverPhoto), SCRIM(0, 0, W, HH, 0, [[0, sc, 0.95], [0.62, sc, 0.6], [1, sc, 0.15]]));
      o.push(L(kick, 330, 26, M, 1100, A('fade', 0, { body: 1, weight: 700, color: th.coverKick || th.acc, cs: 500 })));
      o.push(L(up(TITLE, th), 380, tSize, M - 6, 1300, A('rise', 0.1, { weight: th.tW || 800, color: tc, lh: 1.02, italic: th.tItalic })));
      o.push(R(M, py, 110, 8, th.acc, A('wipe', 0.3, { name: 'Шугам' })));
      o.push(L(SUB, py + 40, 32, M, 1100, A('fade', 0.4, { body: 1, weight: 500, color: th.coverMuted || th.muted })));
    } else {   // 'left'
      var cy0 = th.coverY || 300, by = cy0 + 50 + tSize * 2.04 + 40;
      o.push(L(kick, cy0, 26, M, 1100, A('fade', 0, { body: 1, weight: 700, color: th.acc, cs: 500 })));
      o.push(L(up(TITLE, th), cy0 + 50, tSize, M - 6, th.coverTW || 1250, A('rise', 0.1, { weight: th.tW || 800, color: tc, lh: 1.02, italic: th.tItalic })));
      o.push(R(M, by, 110, 8, th.acc, A('wipe', 0.3, { rx: th.pill ? 4 : 0, name: 'Шугам' })));
      o.push(L(SUB, by + 40, 32, M, 1100, A('fade', 0.4, { body: 1, weight: 500, color: th.muted })));
    }
    return o;
  }

  function agenda(th) {
    var v = th.agenda, o = [BG(th.bg, th.grain ? { fx: GRAIN } : {})].concat(th.deco ? th.deco('agenda') : []).concat(head(th, '01', 'Агуулга'));
    if (v === 'grid') {
      var cw = (W - 2 * M - 3 * 36) / 4;
      AGENDA.forEach(function (a, i) {
        var x = M + i * (cw + 36), y = 380;
        o.push(rr(x, y, cw, 520, th.card, th.r || 0, A('rise', 0.1 + i * 0.08, { name: 'Карт', stroke: th.cardLine || null, sw: th.cardLine ? 2 : 0, shadow: th.shadow ? { c: 'rgba(15,23,42,.10)', b: 40, y: 18 } : null })));
        o.push(L(pad2(i + 1), y + 44, 96, x + 40, cw - 80, A('fade', 0.2 + i * 0.08, { weight: 800, color: i === 0 ? th.acc : (th.numInk || th.acc), opacity: i === 0 ? 1 : 0.35, lh: 1 })));
        o.push(R(x + 40, y + 190, 60, 5, th.acc, { name: 'Шугам', opacity: i === 0 ? 1 : 0.5 }));
        o.push(L(a[0], y + 230, 40, x + 40, cw - 80, A('fade', 0.25 + i * 0.08, { weight: 700, color: th.cardInk || th.ink, lh: 1.12 })));
        o.push(L(a[1], y + 380, 26, x + 40, cw - 80, A('fade', 0.3 + i * 0.08, { body: 1, color: th.cardMuted || th.muted, lh: 1.35 })));
      });
    } else if (v === 'timeline') {
      var y0 = 560, x0 = M + 60, x1 = W - M - 60;
      o.push(R(x0, y0 - 2, x1 - x0, 4, th.line || th.muted, { opacity: 0.45, name: 'Шугам' }));
      AGENDA.forEach(function (a, i) {
        var cx = x0 + (x1 - x0) * (i + 0.5) / 4;
        o.push(C(cx, y0, 44, i === 0 ? th.acc : th.bg, A('pop', 0.15 + i * 0.1, { stroke: th.acc, sw: 4, name: 'Цэг' })));
        o.push(T(String(i + 1), y0 - 24, 36, { x: cx - 44, w: 88, weight: 800, color: i === 0 ? th.bg : th.acc }));
        o.push(T(a[0], y0 + 90, 36, A('rise', 0.2 + i * 0.1, { x: cx - 200, w: 400, weight: 700, color: th.ink, lh: 1.12 })));
        o.push(T(a[1], y0 + 200, 26, A('fade', 0.3 + i * 0.1, { body: 1, x: cx - 200, w: 400, color: th.muted })));
      });
    } else {   // 'list'
      var lx = th.agendaX || M, lw = W - lx - M;
      AGENDA.forEach(function (a, i) {
        var y = 350 + i * 158;
        o.push(R(lx, y - 20, lw, 1.5, th.line || th.muted, { opacity: 0.35, name: 'Шугам' }));
        o.push(L(pad2(i + 1), y + 14, 64, lx, 160, A('fade', 0.1 + i * 0.08, { weight: th.numW || 300, color: th.acc, lh: 1, italic: th.hItalic })));
        o.push(L(a[0], y + 18, 50, lx + 200, 900, A('panl', 0.12 + i * 0.08, { weight: 700, color: th.ink, lh: 1.1, italic: th.hItalic && 0 })));
        o.push(L(a[1], y + 34, 28, lx + 1150, lw - 1150, A('fade', 0.2 + i * 0.08, { body: 1, color: th.muted, align: 'right' })));
      });
      o.push(R(lx, 350 + 4 * 158 - 20, lw, 1.5, th.line || th.muted, { opacity: 0.35, name: 'Шугам' }));
    }
    return o;
  }

  function about(th) {
    var v = th.about, o = [BG(th.bg, th.grain ? { fx: GRAIN } : {})].concat(th.deco ? th.deco('about') : []);
    var bullet = function (x, y, w, ink, ic, step) {
      ABOUT.forEach(function (b, i) {
        var yy = y + i * (step || 118);
        o.push(C(x + 26, yy + 22, 26, ic.bg, A('pop', 0.15 + i * 0.08, { name: 'Цэг', opacity: ic.op == null ? 1 : ic.op })));
        o.push(P('check', x + 12, yy + 8, 28, ic.fg, { sw: 2.6 }));
        o.push(L(b, yy, 34, x + 84, w - 84, A('fade', 0.2 + i * 0.08, { body: 1, color: ink, lh: 1.3, weight: 500 })));
      });
    };
    if (v === 'photo') {
      o.push(PHOTO(0, 0, 760, HH, th.aboutPhoto || 'team', th.aboutMask ? { mask: th.aboutMask, r: 0 } : {}));
      o.push(R(0, 0, 760, HH, th.bg, { opacity: th.photoTint || 0.12, name: 'Өнгө' }));
      o = o.concat(head(th, '02', 'Бидний тухай', { x: 880, w: 900 }));
      bullet(880, 320, 920, th.text || th.ink, { bg: th.acc, fg: th.onAcc || '#ffffff' }, 108);
      // quote card over the photo edge
      o.push(rr(400, 770, 720, 220, th.qBg || th.acc, th.r || 0, A('rise', 0.5, { name: 'Ишлэл', shadow: { c: 'rgba(0,0,0,.25)', b: 40, y: 16 } })));
      o.push(P('quote', 444, 812, 48, th.qInk || th.onAcc || '#ffffff', { fillIcon: 1, opacity: 0.9 }));
      o.push(L(QUOTE, 812, 40, 520, 570, { weight: 700, color: th.qInk || th.onAcc || '#ffffff', italic: th.qItalic, lh: 1.1 }));
      o.push(L(QBY, 900, 26, 520, 570, { body: 1, color: th.qInk || th.onAcc || '#ffffff', opacity: 0.8 }));
    } else {   // 'quote': bullets left, big quote panel right
      o = o.concat(head(th, '02', 'Бидний тухай'));
      bullet(M, 350, 980, th.text || th.ink, { bg: th.acc, fg: th.onAcc || '#ffffff', op: th.dotOp });
      var qx = 1180, qw = W - qx - M;
      o.push(rr(qx, 320, qw, 600, th.qBg || th.card, th.r || 0, A('panr', 0.3, { name: 'Ишлэл', stroke: th.cardLine || null, sw: th.cardLine ? 2 : 0 })));
      o.push(P('quote', qx + 60, 380, 72, th.qMark || th.acc, { fillIcon: 1 }));
      o.push(L(QUOTE, 500, 62, qx + 60, qw - 120, A('fade', 0.45, { weight: th.qW || 700, color: th.qInk || th.ink, italic: th.qItalic, lh: 1.08 })));
      o.push(R(qx + 60, 760, 60, 4, th.qMark || th.acc, { name: 'Шугам' }));
      o.push(L(QBY, 790, 28, qx + 60, qw - 120, A('fade', 0.55, { body: 1, color: th.qMuted || th.muted })));
    }
    return o;
  }

  function adv(th) {
    var v = th.adv, o = [BG(th.bg, th.grain ? { fx: GRAIN } : {})].concat(th.deco ? th.deco('adv') : []).concat(head(th, '03', 'Давуу талууд'));
    if (v === 'split') {
      ADV.forEach(function (a, i) {
        var x = M + i * 850, y = 340, w = 800, dark = i === 0;
        o.push(rr(x, y, w, 600, dark ? th.acc : th.card, th.r || 0, A('rise', 0.15 + i * 0.12, { name: 'Карт', stroke: !dark && th.cardLine ? th.cardLine : null, sw: !dark && th.cardLine ? 2 : 0 })));
        o.push(L(pad2(i + 1), y + 50, 140, x + w - 290, 240, { weight: 800, color: dark ? (th.onAcc || '#ffffff') : th.acc, opacity: 0.18, align: 'right', lh: 1 }));
        o.push(P(a[2], x + 60, y + 70, 88, dark ? (th.onAcc || '#ffffff') : th.acc, { sw: 1.6 }));
        o.push(L(a[0], y + 250, 60, x + 60, w - 120, A('fade', 0.3 + i * 0.12, { weight: 800, color: dark ? (th.onAcc || '#ffffff') : (th.cardInk || th.ink), lh: 1.08 })));
        o.push(L(a[1], y + 350, 34, x + 60, w - 160, A('fade', 0.4 + i * 0.12, { body: 1, color: dark ? (th.onAcc || '#ffffff') : (th.cardMuted || th.muted), lh: 1.35, opacity: dark ? 0.85 : 1 })));
      });
    } else {   // 'cards'
      ADV.forEach(function (a, i) {
        var x = M + i * 850, y = 340, w = 800;
        o.push(rr(x, y, w, 600, th.card, th.r || 0, A('rise', 0.15 + i * 0.12, { name: 'Карт', stroke: th.cardLine || null, sw: th.cardLine ? 2 : 0, shadow: th.shadow ? { c: 'rgba(15,23,42,.10)', b: 50, y: 20 } : null })));
        o.push(R(x, y, 10, 600, th.acc, { name: 'Зураас', rx: th.r ? 5 : 0, opacity: i === 0 ? 1 : 0.55 }));
        o.push(C(x + 130, y + 140, 70, th.iconBg || th.acc, A('pop', 0.3 + i * 0.12, { name: 'Икон дэвсгэр', opacity: th.iconOp == null ? 1 : th.iconOp })));
        o.push(P(a[2], x + 88, y + 98, 84, th.iconInk || th.onAcc || '#ffffff', { sw: 1.7 }));
        o.push(L(a[0], y + 270, 58, x + 70, w - 140, A('fade', 0.35 + i * 0.12, { weight: 800, color: th.cardInk || th.ink, lh: 1.08 })));
        o.push(L(a[1], y + 370, 34, x + 70, w - 180, A('fade', 0.45 + i * 0.12, { body: 1, color: th.cardMuted || th.muted, lh: 1.35 })));
        o.push(L(pad2(i + 1), y + 60, 60, x + w - 190, 130, { weight: 700, color: th.acc, opacity: 0.35, align: 'right' }));
      });
    }
    return o;
  }

  function stats(th) {
    var v = th.stats, o = [BG(th.statsBg || th.bg, th.grain ? { fx: GRAIN } : {})].concat(th.deco ? th.deco('stats') : []).concat(head(th, '04', 'Үзүүлэлтүүд'));
    var cw = (W - 2 * M - 2 * 60) / 3;
    STATS.forEach(function (s, i) {
      var x = M + i * (cw + 60), cx = x + cw / 2;
      if (v === 'big') {
        if (i) o.push(R(x - 30, 380, 1.5, 480, th.line || th.muted, { opacity: 0.4, name: 'Шугам' }));
        o.push(P(s[2], x + 10, 390, 56, th.acc, { sw: 1.8 }));
        o.push(L(s[0], 470, 190, x, cw, A('rise', 0.15 + i * 0.12, { weight: th.nW || 800, color: th.numColor || th.ink, lh: 1, italic: th.hItalic })));
        o.push(R(x + 10, 710, 70, 6, th.acc, { name: 'Шугам' }));
        o.push(L(s[1], 740, 38, x + 10, cw - 20, A('fade', 0.3 + i * 0.12, { body: 1, weight: 500, color: th.muted })));
      } else if (v === 'rings') {
        var R0 = 190, cy = 600;
        o.push(C(cx, cy, R0, 'transparent', { stroke: th.line || th.muted, sw: 14, opacity: 0.25, name: 'Цагираг' }));
        o.push(C(cx, cy, R0, 'transparent', A('spin', 0.1 + i * 0.12, { stroke: i === 1 ? (th.acc2 || th.acc) : th.acc, sw: 14, name: 'Цагираг' })));
        o.push(C(cx, cy, R0 - 40, th.card, { name: 'Дотор', opacity: th.ringFill == null ? 1 : th.ringFill }));
        o.push(T(s[0], cy - 80, 110, A('pop', 0.25 + i * 0.12, { x: cx - 170, w: 340, weight: 800, color: th.numColor || th.ink, lh: 1 })));
        o.push(T(s[1], cy + 50, 30, { body: 1, x: cx - 150, w: 300, weight: 500, color: th.muted }));
      } else {   // 'cards'
        o.push(rr(x, 360, cw, 540, th.card, th.r || 0, A('rise', 0.12 + i * 0.1, { name: 'Карт', stroke: th.cardLine || null, sw: th.cardLine ? 2 : 0, shadow: th.shadow ? { c: 'rgba(15,23,42,.10)', b: 50, y: 20 } : null })));
        o.push(R(x, 360, cw, 12, i === 1 && th.acc2 ? th.acc2 : th.acc, { name: 'Зураас', rx: th.r ? 6 : 0 }));
        o.push(C(cx, 480, 52, th.iconBg || th.acc, { name: 'Икон дэвсгэр', opacity: th.iconOp == null ? 0.14 : th.iconOp }));
        o.push(P(s[2], cx - 28, 452, 56, th.iconInk2 || ((th.iconOp == null ? 0.14 : th.iconOp) >= 0.5 ? (th.onAcc || '#ffffff') : th.acc), { sw: 1.8 }));
        o.push(T(s[0], 580, 150, A('pop', 0.25 + i * 0.1, { x: x, w: cw, weight: th.nW || 800, color: th.numColor || th.acc, lh: 1, italic: th.hItalic })));
        o.push(T(s[1], 780, 36, A('fade', 0.35 + i * 0.1, { body: 1, x: x + 20, w: cw - 40, weight: 500, color: th.cardMuted || th.muted })));
      }
    });
    return o;
  }

  function thanks(th) {
    var v = th.thanks, o = [BG(th.endBg || (th.cover === 'photo' ? th.bg : th.coverBg) || th.bg, th.grain ? { fx: GRAIN } : {})].concat(th.deco ? th.deco('thanks') : []);
    var ink = th.endInk || th.ink;
    if (v === 'split') {
      o.push(L('Баярлалаа!', 330, th.eSize || 150, M - 6, 1000, A('rise', 0, { weight: th.tW || 800, color: ink, lh: 1, italic: th.tItalic })));
      o.push(L('Асуулт байвал бидэнтэй холбогдоорой.', 540, 34, M, 900, A('fade', 0.2, { body: 1, color: th.muted })));
      var cx0 = 1180, cw0 = W - cx0 - M;
      o.push(rr(cx0, 260, cw0, 560, th.panel || th.acc, th.r || 0, A('panr', 0.25, { name: 'Холбоо барих' })));
      o.push(L('ХОЛБОО БАРИХ', 320, 24, cx0 + 60, cw0 - 120, { body: 1, weight: 700, color: th.panelInk || '#ffffff', cs: 300, opacity: 0.8 }));
      CONTACT.forEach(function (c, i) {
        var y = 420 + i * 120;
        o.push(P(c[0], cx0 + 60, y, 44, th.panelInk || '#ffffff', { sw: 1.8 }));
        o.push(L(c[1], y + 2, 36, cx0 + 130, cw0 - 190, A('fade', 0.35 + i * 0.08, { body: 1, weight: 600, color: th.panelInk || '#ffffff' })));
      });
    } else {   // 'center'
      o.push(T('Баярлалаа!', 330, th.eSize || 170, A('pop', 0, { weight: th.tW || 800, color: ink, lh: 1, italic: th.tItalic, w: 1600 })));
      o.push(R(W / 2 - 60, 560, 120, 6, th.acc, A('wipe', 0.2, { name: 'Шугам' })));
      var cw = 480;
      CONTACT.forEach(function (c, i) {
        var x = W / 2 - (cw * 3) / 2 + i * cw, y = 690;
        o.push(P(c[0], x + cw / 2 - 26, y, 52, th.acc, { sw: 1.8 }));
        o.push(T(c[1], y + 84, 32, A('fade', 0.3 + i * 0.08, { body: 1, x: x, w: cw, weight: 500, color: th.endMuted || th.muted })));
      });
    }
    return o;
  }

  function deck(th) {
    return { id: th.id, tag: th.tag, name: th.name, fonts: th.fonts, trans: th.trans || 'fade', sw: th.sw, slides: [
      { name: 'Нүүр', items: function () { return cover(th); } },
      { name: 'Агуулга', items: function () { return agenda(th); } },
      { name: 'Бидний тухай', items: function () { return about(th); } },
      { name: 'Давуу талууд', items: function () { return adv(th); } },
      { name: 'Үзүүлэлтүүд', items: function () { return stats(th); } },
      { name: 'Баярлалаа', items: function () { return thanks(th); } }
    ] };
  }

  // ---------- decorations per deck ----------
  function dots(x, y, cols, rows, gap, r, fill, op) { var o = []; for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) o.push(C(x + i * gap, y + j * gap, r, fill, { opacity: op, name: 'Цэг' })); return o; }
  function diamonds(y, a, b, size, n) { var o = [], step = W / n; for (var i = 0; i < n; i++) o.push(R(step * (i + 0.5), y, size, size, i % 2 ? b : a, { c: 1, angle: 45, name: 'Хээ' })); return o; }
  // hazard stripes: one path of parallelograms inside the band (size 24 = drawn 1:1 in slide pixels)
  function stripes(x, y, w, h, c1, c2, n) {
    var s = w / n, d = '';
    for (var i = -1; i < n; i += 2) { var x0 = x + i * s; d += 'M ' + x0 + ' ' + (y + h) + ' L ' + (x0 + s) + ' ' + (y + h) + ' L ' + (x0 + s + h) + ' ' + y + ' L ' + (x0 + h) + ' ' + y + ' Z '; }
    return [R(x, y, w, h, c2, { name: 'Туузны дэвсгэр' }), { t: 'path', d: d, x: 0, y: 0, size: 24, fill: c1, name: 'Тууз' }];
  }

  var DECKS = [
    // 01 — minimal, white, one red accent
    { id: 'u-minimal', tag: 'Бизнес', name: 'Минимал — цагаан, улаан', fonts: ['Inter Tight', 'Inter'], sw: ['#ffffff', '#c11720', '#111827'], trans: 'fade',
      bg: '#ffffff', ink: '#111827', text: '#1f2937', muted: '#6b7280', acc: '#c11720', card: '#f9fafb', line: '#9ca3af', onAcc: '#ffffff',
      headStyle: 'bar', cover: 'left', agenda: 'list', about: 'quote', adv: 'cards', stats: 'big', thanks: 'center', coverY: 290, hW: 700, tW: 700, r: 0, qBg: '#111827', qInk: '#ffffff', qMark: '#c11720', qMuted: '#9ca3af',
      deco: function (k) {
        if (k === 'cover') return [R(1380, 0, 540, HH, '#f3f4f6', { name: 'Панел' }), C(1650, 540, 230, '#c11720', A('pop', 0.3, { name: 'Тойрог' })), C(1650, 540, 300, 'transparent', { stroke: '#111827', sw: 2, name: 'Хүрээ' }), R(M, 980, W - 2 * M, 1.5, '#e5e7eb', { name: 'Шугам' })];
        if (k === 'thanks') return [C(W - 140, 120, 60, '#c11720', { name: 'Тойрог' }), R(M, 980, W - 2 * M, 1.5, '#e5e7eb', { name: 'Шугам' })];
        return [C(W - 110, 110, 18, '#c11720', { name: 'Цэг' })];
      } },
    // 02 — navy, bold, red + cream
    { id: 'u-navy', tag: 'Бизнес', name: 'Хар хөх — тод', fonts: ['Montserrat', 'Inter'], sw: ['#0c324a', '#c11720', '#fef1d5'], trans: 'slide',
      bg: '#0c324a', ink: '#ffffff', text: '#e6edf2', muted: '#9db4c0', acc: '#c11720', card: '#0e3a56', line: '#9db4c0', onAcc: '#ffffff', upper: 1,
      headStyle: 'num', numOp: 0.9, cover: 'split', panel: '#fef1d5', panelInk: '#0c324a', panelAcc: '#c11720', panelMuted: '#0c324a', splitW: 1020, tSize: 104, coverBg: '#0c324a',
      agenda: 'grid', about: 'quote', adv: 'split', stats: 'cards', thanks: 'split', numInk: '#fef1d5', cardInk: '#ffffff', cardMuted: '#9db4c0', qBg: '#fef1d5', qInk: '#0c324a', qMuted: '#35566b', r: 0,
      iconBg: '#c11720', iconOp: 1, iconInk2: '#ffffff', numColor: '#ffffff',
      deco: function (k) {
        if (k === 'cover') return [R(1020, 0, 900, HH, '#0c324a', { name: 'Панел' })].concat(stripes(1020, 900, 900, 40, '#c11720', '#0e3a56', 18)).concat([
          T('2026', 600, 250, A('fade', 0.4, { x: 1060, w: 820, weight: 900, color: '#fef1d5', opacity: 0.08 })), C(1470, 330, 160, 'transparent', { stroke: '#fef1d5', sw: 3, name: 'Хүрээ', opacity: 0.8 }), C(1470, 330, 96, '#c11720', A('pop', 0.3, { name: 'Тойрог' })), C(1470, 330, 230, 'transparent', { stroke: '#fef1d5', sw: 1, name: 'Хүрээ', opacity: 0.3 })]);
        return [R(0, HH - 18, W, 18, '#c11720', { name: 'Тууз' })];
      } },
    // 03 — corporate blue
    { id: 'u-corporate', tag: 'Бизнес', name: 'Корпорат — цэнхэр', fonts: ['Manrope', 'Inter'], sw: ['#ffffff', '#2e75b6', '#1f4e79'], trans: 'fade',
      bg: '#ffffff', ink: '#1f2937', text: '#1f2937', muted: '#6b7280', acc: '#2e75b6', acc2: '#1f4e79', card: '#f3f7fb', line: '#94a3b8', onAcc: '#ffffff',
      headStyle: 'bar', cover: 'split', panel: '#1f4e79', panelInk: '#ffffff', panelAcc: '#9cc3e6', coverPhoto: 'city', photoTint: 0.18, splitW: 900,
      agenda: 'timeline', about: 'photo', aboutPhoto: 'team', adv: 'cards', stats: 'cards', thanks: 'split', panel2: '#1f4e79', r: 18, shadow: 1, qBg: '#1f4e79', iconOp: 1,
      deco: function (k) { if (k === 'cover') return []; return [R(0, 0, W, 10, '#2e75b6', { name: 'Тууз' }), R(W - 420, HH - 10, 420, 10, '#1f4e79', { name: 'Тууз' })]; } },
    // 04 — geometric colour: cream, red, navy, sky
    { id: 'u-geometric', tag: 'Креатив', name: 'Геометр — өнгөлөг', fonts: ['Rubik', 'Rubik'], sw: ['#fef1d5', '#c11720', '#0c324a'], trans: 'push',
      bg: '#fef1d5', ink: '#0c324a', text: '#0c324a', muted: '#5b6b7a', acc: '#c11720', acc2: '#679cbc', card: '#ffffff', line: '#0c324a', onAcc: '#ffffff',
      headStyle: 'tag', tagBg: '#0c324a', tagInk: '#fef1d5', cover: 'left', coverY: 280, agenda: 'grid', about: 'quote', adv: 'split', stats: 'rings', thanks: 'center', r: 28, pill: 1, qBg: '#0c324a', qInk: '#fef1d5', qMark: '#679cbc', qMuted: '#9db4c0', ringFill: 0,
      deco: function (k) {
        if (k === 'cover') return [C(1560, 330, 250, '#c11720', A('pop', 0.2, { name: 'Тойрог' })), R(1330, 520, 380, 380, '#0c324a', A('pop', 0.3, { angle: 12, rx: 30, name: 'Дөрвөлжин' })),
          { t: 'rect', x: 1700, y: 700, w: 230, h: 230, fill: '#679cbc', rx: 115, name: 'Тойрог' }, R(1200, 180, 80, 80, '#679cbc', { c: 1, angle: 45, name: 'Ромб' }), C(1260, 880, 30, '#c11720', { name: 'Цэг' })];
        if (k === 'thanks') return [C(160, 160, 120, '#679cbc', { name: 'Тойрог' }), R(1680, 820, 260, 260, '#c11720', { angle: 20, rx: 30, name: 'Дөрвөлжин' }), C(1790, 170, 50, '#0c324a', { name: 'Цэг' })];
        return [C(W - 60, 60, 120, '#679cbc', { name: 'Тойрог', opacity: 0.9 }), R(W - 190, 150, 50, 50, '#c11720', { c: 1, angle: 45, name: 'Ромб' })];
      } },
    // 05 — luxury gold on black
    { id: 'u-gold', tag: 'Креатив', name: 'Тансаг — хар, алтан', fonts: ['Cormorant Garamond', 'Montserrat'], sw: ['#0a0a0a', '#d4af37', '#f5f0e1'], trans: 'fade',
      bg: '#0a0a0a', ink: '#f5f0e1', text: '#e7e1d0', muted: '#a8a29e', acc: '#d4af37', card: '#141414', cardLine: '#3a3218', line: '#d4af37', onAcc: '#0a0a0a',
      headStyle: 'rule', hW: 500, hSize: 84, hItalic: 1, tW: 500, tItalic: 1, tSize: 150, cover: 'center', agenda: 'list', numW: 400, about: 'quote', adv: 'cards', stats: 'big', nW: 500, thanks: 'center', eSize: 180, r: 0, grain: 1,
      qBg: '#141414', qInk: '#f5f0e1', qW: 500, qItalic: 1, qMark: '#d4af37', iconBg: '#d4af37', iconOp: 0.12, iconInk: '#d4af37', numColor: '#d4af37',
      deco: function (k) {
        var fr = [R(60, 60, W - 120, HH - 120, 'transparent', { stroke: '#d4af37', sw: 1.5, opacity: 0.55, name: 'Хүрээ' })];
        if (k === 'cover' || k === 'thanks') return fr.concat([R(80, 80, W - 160, HH - 160, 'transparent', { stroke: '#d4af37', sw: 0.8, opacity: 0.35, name: 'Хүрээ' }),
          R(W / 2, 250, 22, 22, '#d4af37', { c: 1, angle: 45, name: 'Ромб' }), R(W / 2 - 140, 250, 100, 1.5, '#d4af37', { c: 1, name: 'Шугам' }), R(W / 2 + 140, 250, 100, 1.5, '#d4af37', { c: 1, name: 'Шугам' })]);
        return fr;
      } },
    // 06 — startup fresh: white, emerald, sky
    { id: 'u-startup', tag: 'Технологи', name: 'Стартап — ногоон, цэнхэр', fonts: ['Onest', 'Onest'], sw: ['#ffffff', '#10b981', '#38bdf8'], trans: 'slide',
      bg: '#ffffff', ink: '#1a1a2e', text: '#1a1a2e', muted: '#64748b', acc: '#10b981', acc2: '#38bdf8', card: '#f8fafc', line: '#94a3b8', onAcc: '#ffffff',
      headStyle: 'tag', tagBg: '#d1fae5', tagInk: '#047857', cover: 'left', coverY: 300, agenda: 'grid', about: 'photo', aboutPhoto: 'team', adv: 'cards', stats: 'cards', thanks: 'center', r: 32, pill: 1, shadow: 1, qBg: '#10b981',
      deco: function (k) {
        if (k === 'cover') return [BLOB(1560, 360, 520, '#38bdf8', 0.35), BLOB(1380, 760, 460, '#10b981', 0.35), rr(1300, 250, 460, 560, '#ffffff', 40, A('rise', 0.3, { name: 'Карт', shadow: { c: 'rgba(15,23,42,.14)', b: 60, y: 30 } })),
          rr(1350, 310, 140, 140, '#d1fae5', 34, { name: 'Икон дэвсгэр' }), P('trophy', 1385, 345, 70, '#10b981', { sw: 1.8 }), rr(1350, 500, 360, 26, '#e2e8f0', 13, { name: 'Мөр' }), rr(1350, 550, 280, 26, '#e2e8f0', 13, { name: 'Мөр' }),
          rr(1350, 650, 170, 100, '#10b981', 26, { name: 'Товч' }), rr(1540, 650, 170, 100, '#e0f2fe', 26, { name: 'Товч' })];
        return [BLOB(W - 80, 60, 300, '#38bdf8', 0.18), BLOB(80, HH - 40, 260, '#10b981', 0.15)];
      } },
    // 07 — Mongolian brand: cream, red, blue, navy + ornament
    { id: 'u-mongol', tag: 'Монгол', name: 'Монгол брэнд — хээтэй', fonts: ['Lora', 'Montserrat'], sw: ['#fef1d5', '#c11720', '#0c324a'], trans: 'fade',
      kick: 'МОНГОЛ БРЭНД', bg: '#fef1d5', ink: '#0c324a', text: '#0c324a', muted: '#6b5b45', acc: '#c11720', acc2: '#679cbc', card: '#ffffff', line: '#0c324a', onAcc: '#ffffff',
      headStyle: 'bar', hW: 700, tW: 700, cover: 'photo', coverPhoto: 'gobi', coverInk: '#fef1d5', scrim: '#0c324a', coverMuted: '#e8dcc0', coverKick: '#ff8a80', agenda: 'list', about: 'photo', aboutPhoto: 'ger', adv: 'split', stats: 'cards', thanks: 'split', panel: '#0c324a', r: 6, qBg: '#c11720',
      deco: function (k) {
        var band = [R(0, HH - 70, W, 70, '#0c324a', { name: 'Тууз' })].concat(diamonds(HH - 35, '#c11720', '#679cbc', 26, 24));
        if (k === 'cover') return [];
        if (k === 'about') return [R(760, HH - 70, W - 760, 70, '#0c324a', { name: 'Тууз' })];
        return band.concat([C(W - 150, 150, 70, '#c11720', { name: 'Нар', opacity: 0.95 }), C(W - 150, 150, 92, 'transparent', { stroke: '#0c324a', sw: 3, name: 'Хүрээ' })]);
      } },
    // 08 — tech purple: indigo night, violet, cyan
    { id: 'u-tech', tag: 'Технологи', name: 'Техно — нил ягаан', fonts: ['Geologica', 'Inter'], sw: ['#1e1b4b', '#8b5cf6', '#22d3ee'], trans: 'zoom',
      bg: '#1e1b4b', ink: '#ffffff', text: '#e0e7ff', muted: '#a5b4fc', acc: '#8b5cf6', acc2: '#22d3ee', card: '#2a2566', cardLine: '#4c1d95', line: '#a5b4fc', onAcc: '#ffffff',
      headStyle: 'mono', cover: 'left', coverY: 280, agenda: 'timeline', about: 'quote', adv: 'cards', stats: 'rings', thanks: 'center', r: 24, cardInk: '#ffffff', cardMuted: '#c7d2fe', qBg: '#2a2566', qInk: '#ffffff', qMark: '#22d3ee', qMuted: '#a5b4fc', iconBg: '#8b5cf6', ringFill: 1, numColor: '#ffffff',
      deco: function (k) {
        var base = [BLOB(W - 200, 180, 520, '#8b5cf6', 0.45), BLOB(260, HH - 120, 420, '#22d3ee', 0.22)].concat(dots(W - 520, HH - 300, 12, 6, 34, 3, '#22d3ee', 0.35));
        if (k === 'cover') return base.concat([C(1480, 540, 250, 'transparent', { stroke: '#22d3ee', sw: 2, name: 'Орбит', opacity: 0.8 }), C(1480, 540, 170, 'transparent', { stroke: '#8b5cf6', sw: 2, name: 'Орбит' }),
          C(1480, 540, 80, '#8b5cf6', A('pop', 0.3, { name: 'Цөм' })), C(1730, 540, 16, '#22d3ee', { name: 'Хиймэл дагуул' }), C(1480, 370, 12, '#ffffff', { name: 'Хиймэл дагуул' })]);
        return base;
      } },
    // 09 — editorial: paper, black, red
    { id: 'u-editorial', tag: 'Креатив', name: 'Эдиториал — сонин', fonts: ['Playfair', 'Inter'], sw: ['#faf7f0', '#b91c1c', '#111111'], trans: 'fade',
      bg: '#faf7f0', ink: '#111111', text: '#1c1917', muted: '#78716c', acc: '#b91c1c', card: '#ffffff', cardLine: '#e7e2d6', line: '#111111', onAcc: '#ffffff',
      headStyle: 'rule', hW: 700, hSize: 84, tW: 800, tSize: 150, tItalic: 0, cover: 'left', coverY: 330, agenda: 'list', numW: 400, hItalic: 0, about: 'quote', adv: 'cards', stats: 'big', nW: 700, thanks: 'center', r: 0,
      qBg: '#111111', qInk: '#faf7f0', qW: 700, qItalic: 1, qMark: '#b91c1c', qMuted: '#a8a29e', iconBg: '#b91c1c', numColor: '#111111',
      deco: function (k) {
        if (k === 'cover') return [R(M, 110, W - 2 * M, 4, '#111111', { name: 'Шугам' }), R(M, 122, W - 2 * M, 1.5, '#111111', { name: 'Шугам' }),
          L('ДУГААР 01', 140, 22, M, 400, { body: 1, weight: 700, color: '#111111', cs: 300 }), L('2026 ОН', 140, 22, W - M - 400, 400, { body: 1, weight: 700, color: '#111111', cs: 300, align: 'right' }),
          R(M, 960, W - 2 * M, 1.5, '#111111', { name: 'Шугам' }), R(1480, 330, 320, 460, '#b91c1c', A('rise', 0.3, { name: 'Блок' })), T('Nº', 470, 150, { x: 1480, w: 320, weight: 700, italic: 1, color: '#faf7f0' })];
        return [];
      } },
    // 10 — eco green: white, forest, mint, soft organic shapes
    { id: 'u-eco', tag: 'Бизнес', name: 'Эко — ногоон', fonts: ['Raleway', 'Inter'], sw: ['#ffffff', '#2d6a4f', '#95d5b2'], trans: 'fade',
      bg: '#ffffff', ink: '#1b4332', text: '#1b4332', muted: '#52796f', acc: '#2d6a4f', acc2: '#52b788', card: '#ecfdf5', line: '#95d5b2', onAcc: '#ffffff',
      headStyle: 'bar', pill: 1, hW: 800, tW: 800, cover: 'left', coverY: 290, agenda: 'grid', about: 'quote', adv: 'split', stats: 'rings', thanks: 'center', r: 40, qBg: '#2d6a4f', qInk: '#ffffff', qMark: '#95d5b2', qMuted: '#d8f3dc', ringFill: 1, numColor: '#1b4332', numInk: '#2d6a4f',
      deco: function (k) {
        var leaf = function (x, y, s, c, a) { return { t: 'rect', x: x, y: y, w: s, h: s, fill: c, rx: s * 0.5, angle: a || 0, name: 'Навч', opacity: 0.9 }; };
        if (k === 'cover') return [C(1600, 540, 420, '#d8f3dc', { name: 'Тойрог' }), leaf(1380, 300, 300, '#95d5b2', 0), R(1380, 300, 150, 150, '#95d5b2', { name: 'Навч' }),
          leaf(1600, 520, 280, '#2d6a4f'), R(1730, 520, 150, 140, '#2d6a4f', { name: 'Навч' }), leaf(1460, 640, 160, '#52b788'), C(1800, 280, 36, '#52b788', { name: 'Цэг' })];
        return [C(W + 60, -60, 300, '#d8f3dc', { name: 'Тойрог' }), C(W - 120, 120, 40, '#95d5b2', { name: 'Цэг' })];
      } },
    // 11 — data dashboard: dark slate, cyan, amber
    { id: 'u-data', tag: 'Технологи', name: 'Дата самбар — бараан', fonts: ['Inter Tight', 'JetBrains Mono'], sw: ['#111827', '#22d3ee', '#fbbf24'], trans: 'slide',
      bg: '#111827', ink: '#f9fafb', text: '#e5e7eb', muted: '#9ca3af', acc: '#22d3ee', acc2: '#fbbf24', card: '#1f2937', cardLine: '#374151', line: '#4b5563', onAcc: '#0b1220',
      headStyle: 'mono', cover: 'left', coverY: 300, agenda: 'grid', about: 'quote', adv: 'cards', stats: 'cards', thanks: 'split', panel: '#1f2937', panelInk: '#f9fafb', r: 16, cardInk: '#f9fafb', cardMuted: '#9ca3af', numInk: '#22d3ee',
      qBg: '#1f2937', qInk: '#f9fafb', qMark: '#fbbf24', iconBg: '#22d3ee', iconOp: 0.16, iconInk: '#22d3ee', numColor: '#f9fafb',
      deco: function (k) {
        var grid = []; for (var i = 1; i < 12; i++) grid.push(R(i * 160, 0, 1, HH, '#1f2937', { name: 'Тор' })); for (var j = 1; j < 7; j++) grid.push(R(0, j * 160, W, 1, '#1f2937', { name: 'Тор' }));
        if (k === 'cover') {
          var bars = [], hs = [180, 260, 220, 340, 300, 420, 380, 500];
          hs.forEach(function (h, i) { bars.push(rr(1240 + i * 72, 820 - h, 48, h, i === 7 ? '#fbbf24' : '#22d3ee', 8, A('rise', 0.2 + i * 0.05, { name: 'Багана', opacity: i === 7 ? 1 : 0.35 + i * 0.08 }))); });
          return grid.concat([rr(1190, 250, 650, 640, '#1f2937', 20, { name: 'Самбар', stroke: '#374151', sw: 2 }), L('+24.8%', 290, 56, 1240, 400, { weight: 800, color: '#fbbf24' }), L('өсөлт / жил', 360, 22, 1240, 400, { body: 1, color: '#9ca3af' })]).concat(bars);
        }
        return grid;
      } },
    // 12 — creative agency: near-black, hot pink, yellow
    { id: 'u-agency', tag: 'Креатив', name: 'Агентлаг — ягаан, шар', fonts: ['Rubik', 'Inter'], sw: ['#16161a', '#ff4d6d', '#ffd23f'], trans: 'push',
      bg: '#16161a', ink: '#ffffff', text: '#e4e4e7', muted: '#a1a1aa', acc: '#ff4d6d', acc2: '#ffd23f', card: '#1f1f24', line: '#52525b', onAcc: '#16161a', upper: 1,
      headStyle: 'num', numOp: 1, hSize: 80, tSize: 136, tW: 900, cover: 'left', coverY: 250, coverTW: 1300, agenda: 'list', numW: 800, about: 'quote', adv: 'split', stats: 'big', nW: 900, thanks: 'split', panel: '#ff4d6d', panelInk: '#16161a', r: 0,
      qBg: '#ffd23f', qInk: '#16161a', qMark: '#16161a', qMuted: '#3f3f46', numColor: '#ffffff',
      deco: function (k) {
        if (k === 'cover') return [R(1440, 130, 380, 380, '#ff4d6d', A('pop', 0.2, { name: 'Дөрвөлжин' })), C(1640, 770, 160, '#ffd23f', A('pop', 0.35, { name: 'Тойрог' })),
          R(1400, 700, 150, 150, 'transparent', { stroke: '#ffffff', sw: 6, angle: 45, c: 1, cx: 1450, cy: 780, name: 'Хүрээ' }), T('↗', 190, 260, { x: 1440, w: 380, weight: 900, color: '#16161a' })];
        return [R(W - 36, 0, 36, HH, '#ffd23f', { name: 'Тууз' }), R(W - 62, 0, 12, HH, '#ff4d6d', { name: 'Тууз' })];
      } },
    // 13 — pitch deck: deep navy, amber
    { id: 'u-pitch', tag: 'Бизнес', name: 'Pitch deck — хөх, шар', fonts: ['Montserrat', 'Inter'], sw: ['#0f1e33', '#ffbe0b', '#ffffff'], trans: 'zoom',
      bg: '#0f1e33', ink: '#ffffff', text: '#e2e8f0', muted: '#94a3b8', acc: '#ffbe0b', card: '#16294a', line: '#475569', onAcc: '#0f1e33',
      headStyle: 'bar', cover: 'photo', coverPhoto: 'city', coverMuted: '#cbd5e1', agenda: 'timeline', about: 'photo', aboutPhoto: 'team', adv: 'split', stats: 'big', nW: 800, thanks: 'center', r: 14, qBg: '#ffbe0b', qInk: '#0f1e33', numColor: '#ffbe0b',
      deco: function (k) {
        if (k === 'cover') return [];
        return [{ t: 'rect', x: W - 380, y: -120, w: 520, h: 520, fill: '#16294a', rx: 60, angle: 20, name: 'Хэлбэр' }, R(W - 250, 60, 22, 22, '#ffbe0b', { c: 1, angle: 45, name: 'Ромб' })];
      } },
    // 14 — healthcare: white, teal, soft blue, rounded
    { id: 'u-health', tag: 'Эрүүл мэнд', name: 'Эрүүл мэнд — оюу', fonts: ['Manrope', 'Inter'], sw: ['#ffffff', '#0e7c7b', '#60a5fa'], trans: 'fade',
      bg: '#ffffff', ink: '#134e4a', text: '#134e4a', muted: '#5f7775', acc: '#0e7c7b', acc2: '#60a5fa', card: '#f0fdfa', line: '#99b8b5', onAcc: '#ffffff',
      headStyle: 'tag', tagBg: '#ccfbf1', tagInk: '#0e7c7b', cover: 'split', panel: '#0e7c7b', panelInk: '#ffffff', panelAcc: '#ccfbf1', coverPhoto: 'doctor', photoTint: 0.1, splitW: 880,
      agenda: 'grid', about: 'photo', aboutPhoto: 'dentist', adv: 'cards', stats: 'rings', thanks: 'split', r: 36, pill: 1, shadow: 1, qBg: '#0e7c7b', ringFill: 1, numColor: '#0e7c7b',
      deco: function (k) {
        var plus = function (x, y, s, c, op) { return [rr(x - s / 2, y - s / 6, s, s / 3, c, s / 6, { name: 'Загалмай', opacity: op }), rr(x - s / 6, y - s / 2, s / 3, s, c, s / 6, { name: 'Загалмай', opacity: op })]; };
        if (k === 'cover') return plus(740, 180, 90, '#ccfbf1', 0.5);
        if (k === 'about') return [];
        return plus(W - 150, 140, 90, '#60a5fa', 0.25).concat(plus(W - 70, 250, 44, '#0e7c7b', 0.3));
      } },
    // 15 — industrial: gunmetal, safety yellow, orange, hazard stripes
    { id: 'u-industrial', tag: 'Бизнес', name: 'Үйлдвэр — шар, саарал', fonts: ['Oswald', 'Inter'], sw: ['#2b2d42', '#ffd23f', '#f4a259'], trans: 'push',
      bg: '#2b2d42', ink: '#ffffff', text: '#e5e7eb', muted: '#b8bcc8', acc: '#ffd23f', acc2: '#f4a259', card: '#1f2430', line: '#6b7080', onAcc: '#1f2430', upper: 1,
      headStyle: 'num', numOp: 0.9, hW: 700, hSize: 84, tW: 700, tSize: 150, cover: 'left', coverY: 250, agenda: 'grid', numInk: '#ffd23f', about: 'photo', aboutPhoto: 'city', adv: 'split', stats: 'cards', thanks: 'split', panel: '#ffd23f', panelInk: '#1f2430', r: 0,
      cardInk: '#ffffff', cardMuted: '#b8bcc8', qBg: '#ffd23f', qInk: '#1f2430', iconBg: '#ffd23f', iconOp: 0.14, iconInk2: '#ffd23f', numColor: '#ffffff',
      deco: function (k) {
        var hz = stripes(0, HH - 60, W, 60, '#ffd23f', '#1f2430', 40);
        if (k === 'cover') return hz.concat([R(1300, 0, 620, HH - 60, '#1f2430', { name: 'Панел' }),
          { t: 'rect', x: 1450, y: 260, w: 320, h: 320, fill: 'transparent', stroke: '#ffd23f', sw: 10, rx: 0, angle: 0, name: 'Хүрээ' }, R(1530, 340, 160, 160, '#f4a259', A('pop', 0.3, { name: 'Блок' })),
          L('EST. 2015', 680, 34, 1450, 320, { weight: 700, color: '#ffd23f', cs: 300, align: 'center' })]);
        if (k === 'about') return [];
        return hz;
      } }
  ];
  G.moreDecks = (G.moreDecks || []).concat(DECKS.map(deck));
})();
