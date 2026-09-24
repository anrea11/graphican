/*
  Graphican — /design page.
  Content lives in /content/design.json (editable at /admin → "Дизайн хуудас").
  Brand guide visuals (10 key styles, elements) are drawn live with CSS.
  Fonts load lazily; the starter kit builds a CSS / JSON file in the browser.
*/
(function () {
  'use strict';

  // ---------- helpers ----------

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function list(a) { return Array.isArray(a) ? a : []; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function slugify(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'kit'; }

  function blurText(text, strength) {
    var chars = Array.from(String(text || ''));
    var cut = Math.max(1, chars.length * (strength == null ? 0.6 : strength));
    var out = '', word = '';
    chars.forEach(function (ch, i) {
      if (ch === ' ') { out += (word ? '<span class="w">' + word + '</span>' : '') + ' '; word = ''; return; }
      word += '<span class="bl" style="--b:' + Math.max(0, 1 - i / cut).toFixed(2) + '">' + esc(ch) + '</span>';
    });
    return out + (word ? '<span class="w">' + word + '</span>' : '');
  }

  function fx(variant) {
    return (
      '<div class="fx fx-' + variant + '" aria-hidden="true">' +
        '<div class="beam b1"></div><div class="beam b2"></div><div class="beam b3"></div>' +
        '<div class="ring"></div>' +
        '<svg class="lines" viewBox="0 0 1000 1000" preserveAspectRatio="none" fill="none">' +
          '<path class="hl" d="M180 170 C 420 330 520 330 1000 60" vector-effect="non-scaling-stroke"/>' +
          '<path class="hl" d="M180 170 C 260 420 240 700 40 1000" vector-effect="non-scaling-stroke"/>' +
          '<path class="hl" d="M0 900 C 300 640 700 600 1000 700" vector-effect="non-scaling-stroke"/>' +
          '<path class="vl" d="M0 470 C 300 430 520 380 1000 180" vector-effect="non-scaling-stroke"/>' +
        '</svg>' +
        '<div class="grain"></div>' +
      '</div>'
    );
  }

  // colour maths (for readable text on any swatch)
  function rgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16);
    return isNaN(n) ? [0, 0, 0] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function lum(hex) {
    return rgb(hex).map(function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); })
      .reduce(function (a, c, i) { return a + c * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function inkOn(hex) { return contrast(hex, '#000000') >= contrast(hex, '#ffffff') ? '#0a0a0c' : '#ffffff'; }

  // ---------- toast / clipboard / download ----------

  var toastEl = document.getElementById('toast');
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  function copy(text, msg) {
    function fallback() {
      var t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t);
      toast(msg || 'Хуулагдлаа');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast(msg || 'Хуулагдлаа'); }, fallback);
    } else fallback();
  }
  function download(name, text, type) {
    var blob = new Blob([text], { type: type || 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast(name + ' татагдлаа');
  }

  // ---------- fonts ----------
  // g: Google Fonts family (if the name differs), fs: Fontshare slug, w: heading weight,
  // single: only one weight exists, cyr: has Cyrillic (Mongolian) letters, serif, paid note.
  var FONTS = {
    'Sora': {}, 'Manrope': { cyr: 1 }, 'Syne': {}, 'Inter': { cyr: 1 },
    'Mont': { g: 'Montserrat', cyr: 1, dl: null, alt: 'Montserrat', link: 'https://www.fontfabric.com/fonts/mont/', paid: 'Mont бол Fontfabric-ийн төлбөртэй фонт. Урьдчилан харахад болон татах багцад хамгийн төстэй үнэгүй Montserrat-ийг оруулав.' },
    'Plus Jakarta Sans': {}, 'Space Grotesk': {}, 'Outfit': {},
    'Clash Display': { fs: 'clash-display', w: 600, link: 'https://www.fontshare.com/fonts/clash-display' },
    'Satoshi': { fs: 'satoshi', link: 'https://www.fontshare.com/fonts/satoshi' },
    'Poppins': {}, 'Roboto': { cyr: 1 }, 'Oswald': { cyr: 1 }, 'Lato': {},
    'Archivo Black': { single: 1, w: 400 }, 'Archivo': {},
    'Baloo': { g: 'Baloo 2' }, 'Quicksand': {}, 'Open Sans': { cyr: 1 }, 'Nunito': { cyr: 1 }, 'Mulish': { cyr: 1 },
    'Fredoka One': { g: 'Fredoka' },
    'Playfair Display': { cyr: 1, serif: 1 }, 'Source Sans Pro': { g: 'Source Sans 3', cyr: 1 },
    'DM Serif Display': { single: 1, w: 400, serif: 1 }, 'DM Sans': {},
    'Lora': { cyr: 1, serif: 1 }, 'Merriweather': { cyr: 1, serif: 1 },
    'Cinzel': { serif: 1 }, 'Fauna One': { single: 1, w: 400, serif: 1 },
    'Montserrat': { cyr: 1 }, 'Bebas Neue': { single: 1, w: 400 }
  };

  function font(name) {
    var f = FONTS[name] || { unknown: 1 };
    var family = f.fs ? name : (f.g || name);
    return {
      name: name,
      family: family,
      fs: f.fs,
      w: f.w || 700,
      single: !!f.single || !!f.unknown,
      cyr: f.unknown ? null : !!f.cyr,
      paid: f.paid || '',
      dl: f.dl !== undefined ? f.dl : (f.fs ? null : family),
      alt: f.alt || '',
      link: f.link || '',
      stack: "'" + family + "', " + (f.serif ? 'Georgia, serif' : 'system-ui, sans-serif')
    };
  }

  function googleParam(f, role) {
    var fam = f.family.replace(/ /g, '+');
    if (f.single) return 'family=' + fam;
    return 'family=' + fam + ':wght@' + (role === 'heading' ? f.w : '400;700');
  }
  function fontshareUrl(f, role) {
    return 'https://api.fontshare.com/v2/css?f[]=' + f.fs + '@' + (role === 'heading' ? f.w : '400,500,700') + '&display=swap';
  }

  var loaded = {};
  function loadFont(name, role) {
    var f = font(name);
    var key = f.family + '|' + role;
    if (loaded[key]) return;
    loaded[key] = 1;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = f.fs ? fontshareUrl(f, role) : 'https://fonts.googleapis.com/css2?' + googleParam(f, role) + '&display=swap';
    document.head.appendChild(link);
  }

  function importCss(hName, bName) {
    var h = font(hName), b = font(bName);
    var g = [], out = [];
    if (h.fs) out.push("@import url('" + fontshareUrl(h, 'heading') + "');");
    else g.push(googleParam(h, 'heading'));
    if (b.family === h.family) {
      if (!h.fs && !h.single) {
        var ws = [400, 700, h.w].filter(function (w, i, a) { return a.indexOf(w) === i; }).sort(function (x, y) { return x - y; });
        g[0] = 'family=' + h.family.replace(/ /g, '+') + ':wght@' + ws.join(';');
      }
    } else if (b.fs) out.push("@import url('" + fontshareUrl(b, 'body') + "');");
    else g.push(googleParam(b, 'body'));
    if (g.length) out.unshift("@import url('https://fonts.googleapis.com/css2?" + g.join('&') + "&display=swap');");
    return out.join('\n');
  }

  function stackFor(name) {
    var f = font(name);
    return f.paid ? "'" + name + "', " + f.stack : f.stack;
  }

  // ---------- starter kit output ----------

  function paletteRoles(p) {
    var c = list(p.colors).map(function (x) { return x.hex; });
    var bg = c[0] || '#ffffff';
    return { bg: bg, text: c[1] || '#111111', accent: c[2] || c[1] || '#4f46e5', accent2: c[3] || c[2] || '#4f46e5',
      surface: c[4] || (lum(bg) > 0.5 ? '#f1f1f1' : '#1c1c22') };
  }

  function buildCss(pair, pal) {
    var r = paletteRoles(pal);
    var h = font(pair.heading);
    var notes = [];
    if (h.paid) notes.push(' * ' + pair.heading + ': ' + h.paid);
    var bf = font(pair.body);
    if (bf.paid && pair.body !== pair.heading) notes.push(' * ' + pair.body + ': ' + bf.paid);
    return [
      '/* =========================================================',
      ' * Graphican Starter Kit',
      ' * Фонт  : ' + pair.heading + ' (гарчиг) + ' + pair.body + ' (эх бичвэр)',
      ' * Өнгө  : ' + pal.name,
      ' * graphican.online/design',
    ].concat(notes).concat([
      ' * ========================================================= */',
      '',
      importCss(pair.heading, pair.body),
      '',
      ':root {',
      '  --color-bg: ' + r.bg + ';',
      '  --color-text: ' + r.text + ';',
      '  --color-accent: ' + r.accent + ';',
      '  --color-accent-2: ' + r.accent2 + ';',
      '  --color-surface: ' + r.surface + ';',
      '  --color-on-accent: ' + inkOn(r.accent) + ';',
      '  --font-heading: ' + stackFor(pair.heading) + ';',
      '  --font-body: ' + stackFor(pair.body) + ';',
      '}',
      '',
      '*, *::before, *::after { box-sizing: border-box; }',
      'body {',
      '  margin: 0;',
      '  background: var(--color-bg);',
      '  color: var(--color-text);',
      '  font-family: var(--font-body);',
      '  font-size: 16px;',
      '  line-height: 1.6;',
      '}',
      'h1, h2, h3, h4 {',
      '  font-family: var(--font-heading);',
      '  font-weight: ' + h.w + ';',
      '  line-height: 1.1;',
      '  margin: 0 0 .5em;',
      '}',
      'h1 { font-size: clamp(2.5rem, 6vw, 4.5rem); }',
      'h2 { font-size: clamp(2rem, 4vw, 3rem); }',
      'h3 { font-size: 1.5rem; }',
      'a { color: var(--color-accent); }',
      '',
      '.btn {',
      '  display: inline-block;',
      '  padding: .8em 1.4em;',
      '  border-radius: 999px;',
      '  border: 1.5px solid var(--color-accent);',
      '  background: var(--color-accent);',
      '  color: var(--color-on-accent);',
      '  font-weight: 600;',
      '  text-decoration: none;',
      '}',
      '.btn-outline { background: transparent; color: var(--color-text); border-color: currentColor; }',
      '.card {',
      '  background: var(--color-surface);',
      '  border-radius: 16px;',
      '  padding: 24px;',
      '}',
      '.tag { color: var(--color-accent-2); font-weight: 600; }',
      ''
    ]).join('\n');
  }

  function buildJson(pair, pal) {
    var r = paletteRoles(pal);
    var h = font(pair.heading), b = font(pair.body);
    return JSON.stringify({
      name: pair.heading + ' + ' + pair.body + ' × ' + pal.name,
      source: 'graphican.online/design',
      fonts: {
        heading: { name: pair.heading, family: h.family, weight: h.w, cyrillic: h.cyr, paid: !!h.paid },
        body: { name: pair.body, family: b.family, weight: 400, cyrillic: b.cyr, paid: !!b.paid }
      },
      colors: { background: r.bg, text: r.text, accent: r.accent, accent2: r.accent2, surface: r.surface, onAccent: inkOn(r.accent) },
      palette: list(pal.colors)
    }, null, 2);
  }

  function brandCss(colors) {
    var names = ['indigo', 'violet', 'lavender', 'graphite', 'slate'];
    return [
      '/* Graphican — brand tokens · graphican.online/design */',
      "@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700&family=Inter:wght@400;500;600&display=swap');",
      '',
      ':root {'
    ].concat(list(colors).map(function (c, i) {
      return '  --g-' + (names[i] || slugify(c.name)) + ': ' + c.hex + ';  /* ' + c.name + ' — ' + (c.role || '') + ' */';
    })).concat([
      '  --g-bg: #0a0a10;',
      '  --g-beam: linear-gradient(100deg, #34229e 0%, #6d56fa 45%, #e7e3fd 85%, #ffffff 100%);',
      '  --g-glow: radial-gradient(closest-side, #ffffff, #e7e3fd 30%, rgba(129,109,251,.5) 60%, transparent);',
      "  --g-font-display: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif;",
      "  --g-font-body: 'Inter', 'Helvetica Neue', Arial, sans-serif;",
      '}',
      ''
    ]).join('\n');
  }

  // ---------- font files → ZIP (built in the browser) ----------

  var MANIFEST = null;
  function manifest() {
    return MANIFEST ? Promise.resolve(MANIFEST)
      : fetch('/assets/fonts/files/manifest.json').then(function (r) { return r.json(); }).then(function (m) { return (MANIFEST = m); });
  }

  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function enc(str) { return new TextEncoder().encode(str); }

  // Minimal ZIP writer (stored, UTF-8 names) — font files are already compact.
  function makeZip(files) {
    var parts = [], central = [], offset = 0;
    var d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc(f.name), data = f.data, crc = crc32(data);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, time, true); lh.setUint16(12, date, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, name, data);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, time, true); ch.setUint16(14, date, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
      ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      offset += 30 + name.length + data.length;
    });
    var size = central.reduce(function (a, b) { return a + b.byteLength; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, size, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }

  function saveBlob(name, blob) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  // names: display names, e.g. ["Sora", "Manrope"]. extra: [{name, text}] files added to the zip.
  function fontZip(names, zipName, extra) {
    var uniq = names.filter(function (n, i) { return n && names.indexOf(n) === i; });
    toast('Фонтын багц бэлтгэж байна…');
    return manifest().then(function (m) {
      var jobs = [], included = [], missing = [];
      uniq.forEach(function (n) {
        var f = font(n);
        var own = f.dl && m[f.dl] ? f.dl : null;
        var key = own || (f.alt && m[f.alt] ? f.alt : null);
        if (!own) missing.push({ name: n, link: f.link, alt: key });
        if (!key || included.some(function (x) { return x.name === key; })) return;
        var entry = m[key];
        var folder = own ? key : key + ' (' + n + '-ийн оронд)';
        included.push({ name: key, folder: folder, files: entry.files.filter(function (x) { return /\.ttf$/i.test(x); }) });
        entry.files.forEach(function (file) {
          jobs.push(fetch('/assets/fonts/files/' + entry.dir + '/' + encodeURIComponent(file))
            .then(function (r) { if (!r.ok) throw new Error(file); return r.arrayBuffer(); })
            .then(function (b) { return { name: folder + '/' + file, data: new Uint8Array(b) }; }));
        });
      });
      return Promise.all(jobs).then(function (files) {
        files.unshift({ name: 'СУУЛГАХ ЗААВАР.txt', data: enc(readme(included, missing)) });
        list(extra).forEach(function (x) { files.push({ name: x.name, data: enc(x.text) }); });
        saveBlob(zipName, makeZip(files));
        toast(zipName + ' татагдлаа');
      });
    }).catch(function (e) { console.error(e); toast('Татахад алдаа гарлаа. Дахин оролдоно уу.'); });
  }

  function readme(included, missing) {
    var L = ['GRAPHICAN — ФОНТ СУУЛГАХ ЗААВАР', 'graphican.online/design', '', 'ЭНЭ БАГЦАД:'];
    included.forEach(function (f) {
      L.push('  • ' + f.folder + ' — ' + f.files.map(function (x) { return x.replace(/^.*-|\.ttf$/gi, ''); }).join(', '));
    });
    L.push('',
      'WINDOWS',
      '  1. ZIP файл дээр баруун товч дараад "Extract All" (задлах).',
      '  2. Хавтас доторх .ttf файлуудыг бүгдийг нь сонгоно (Ctrl + A).',
      '  3. Баруун товч → "Install for all users" (эсвэл "Install").',
      '  4. Photoshop, Illustrator, Figma, Word зэрэг програмаа хааж дахин нээнэ.',
      '',
      'MAC',
      '  1. ZIP файл дээр давхар дарж задална.',
      '  2. .ttf файл дээр давхар дарна → "Install Font" (Font Book нээгдэнэ).',
      '  3. Бүгдийг нэг дор суулгах бол файлуудаа Font Book руу чирж оруулна.',
      '  4. Програмаа дахин нээнэ.',
      '',
      'ВЭБСАЙТАД АШИГЛАХ',
      '  Вэбсайтад Google Fonts-оос холбох нь хамгийн хялбар —',
      '  graphican.online/design хуудасны "CSS файл" товчийг ашиглаарай.',
      '',
      'ЛИЦЕНЗ',
      '  Эдгээр фонт SIL Open Font License (OFL.txt)-тэй. Хувийн болон арилжааны',
      '  ажилд үнэгүй ашиглаж болно. Фонтыг дангаар нь зарж болохгүй.');
    if (missing.length) {
      L.push('', 'АНХААР — ЭНЭ БАГЦАД ОРООГҮЙ ФОНТ:');
      missing.forEach(function (x) {
        L.push('  • ' + x.name + (x.alt ? ' — төлбөртэй тул оронд нь үнэгүй ' + x.alt + ' оруулав.' : ' — үнэгүй боловч бусдад дахин түгээх эрхгүй фонт.'));
        if (x.link) L.push('    Албан ёсны хуудаснаас татна уу: ' + x.link);
      });
    }
    return L.join('\r\n') + '\r\n';
  }

  // ---------- sections ----------

  function head(s) {
    return (
      '<header class="sec-head reveal">' +
        '<div class="sec-meta"><span>' + esc(s.kicker) + '</span>' + (s.title_en ? '<span>' + esc(s.title_en) + ' +</span>' : '') + '</div>' +
        '<h2 class="sec-title">' + blurText(s.title, 0.55) + '</h2>' +
        (s.description ? '<p class="sec-desc">' + esc(s.description) + '</p>' : '') +
      '</header>'
    );
  }

  function hero(h) {
    return (
      '<section class="hero d-hero" id="top">' + fx('hero') +
        '<div class="frame">' +
          '<div class="corner tl">GRAPHICAN — ' + esc(h.kicker || 'DESIGN SYSTEM') + '</div>' +
          '<div class="corner tr">DESIGN <span class="plus">+</span></div>' +
          '<div class="hero-center">' +
            '<h1 class="mega" aria-label="' + esc((h.title_line1 || '') + ' ' + (h.title_line2 || '')) + '">' +
              '<span class="line">' + blurText(h.title_line1, 0.8) + '</span>' +
              '<span class="line l2">' + blurText(h.title_line2, 0.45) + '<span class="dot"></span></span>' +
            '</h1>' +
          '</div>' +
          '<div class="hero-copy">' +
            '<p class="lead">' + esc(h.text) + '</p>' +
            '<div class="chips">' +
              '<a href="#fonts">Фонт</a><a href="#colors">Өнгө</a><a class="hot" href="#kit">Нэг товшилтоор татах ↓</a><a class="brand" href="#guide"><span class="dp-orb" aria-hidden="true"></span>Graphican брэнд гайд</a>' +
            '</div>' +
          '</div>' +
          '<div class="corner bl">01 TYPE · 02 COLOR · 03 KIT · 04 BRAND</div>' +
          '<div class="corner br">' + new Date().getFullYear() + '<br>GUIDE</div>' +
        '</div>' +
      '</section>'
    );
  }

  var STYLES = [
    ['abstract-beam', 'Abstract Beam', 'Хийсвэр гэрлийн туяа — гол дүр төрх.'],
    ['curved-shape', 'Curved Shape', 'Том муруй хэлбэр гэрлийг огтолно.'],
    ['minimal-line', 'Minimal Line', 'Нимгэн шугам, их хоосон зай.'],
    ['grain-texture', 'Grain Texture', 'Ширхэгтэй бүтэц — хэвлэмэл мэдрэмж.'],
    ['gradient-flow', 'Gradient Flow', 'Давхарласан зөөлөн градиент урсгал.'],
    ['geometric-overlay', 'Geometric Overlay', 'Тунгалаг геометр хавтгайнууд.'],
    ['light-shadow', 'Light & Shadow', 'Гэрэл, сүүдрийн хүчтэй ялгаа.'],
    ['circle-elements', 'Circle Elements', 'Бөмбөрцөг ба тойрог замын шугам.'],
    ['grid-pattern', 'Grid Pattern', 'Тор, гялбаа — техник мэдрэмж.'],
    ['glass-effect', 'Glass Effect', 'Бүдэг шил, гэрэл нэвтрэлт.']
  ];

  function styleTile(s, i) {
    return (
      '<figure class="st">' +
        '<div class="st-art st-' + s[0] + '" aria-hidden="true">' +
          '<i class="a"></i><i class="b"></i><i class="c"></i>' +
          '<svg viewBox="0 0 300 180" preserveAspectRatio="none" fill="none">' +
            '<path class="p1" d="M-10 150 C 90 60 190 40 310 30" vector-effect="non-scaling-stroke"/>' +
            '<path class="p2" d="M60 -10 C 120 70 220 120 310 140" vector-effect="non-scaling-stroke"/>' +
            '<circle class="p3" cx="150" cy="120" r="95" vector-effect="non-scaling-stroke"/>' +
          '</svg>' +
          '<span class="spark"></span>' +
          '<div class="grain"></div>' +
        '</div>' +
        '<figcaption><span>' + pad(i + 1) + '</span><b>' + esc(s[1]) + '</b><em>' + esc(s[2]) + '</em></figcaption>' +
      '</figure>'
    );
  }

  function guide(g) {
    var colors = list(g.colors);
    var swatches = colors.map(function (c) {
      return (
        '<button class="sw" type="button" data-copy="' + esc(c.hex) + '" style="--c:' + esc(c.hex) + ';--ink:' + inkOn(c.hex) + '">' +
          '<span class="sw-chip"></span>' +
          '<span class="sw-meta"><b>' + esc(c.name) + '</b><code>' + esc(String(c.hex).toUpperCase()) + '</code><em>' + esc(c.role) + '</em></span>' +
        '</button>'
      );
    }).join('');
    var c = colors.map(function (x) { return x.hex; });
    var elements = ['spark', 'ring', 'orbits', 'dots', 'glow', 'bars'].map(function (k) {
      return '<div class="el el-' + k + '" aria-hidden="true"><i></i><i></i><i></i></div>';
    }).join('');

    return (
      '<section class="sec guide" id="guide">' +
        '<div class="guide-band" aria-hidden="true"></div>' +
        head(g) +
        (g.image ? '<div class="sub reveal"><div class="sub-head"><span>01</span><h3>Moodboard</h3></div>' +
          '<figure class="moodboard"><a href="' + esc(g.image) + '" target="_blank" rel="noopener"><img src="' + esc(g.image) + '" alt="Graphican визуал чиглэл, өнгө, график элементүүд, 10 гол хэв маяг" loading="lazy"></a><figcaption>Бүтэн хэмжээгээр үзэх ↗</figcaption></figure></div>' : '') +

        '<div class="sub reveal"><div class="sub-head"><span>02</span><h3>Өнгө</h3><em class="swipe">гүйлгэх →</em><button class="btn small" type="button" data-brand-css>Брэнд CSS ↓</button></div>' +
          '<div class="hscroll swatches">' + swatches + '</div>' +
          (c.length >= 3 ? '<div class="grads">' +
            '<button type="button" class="grad" data-copy="linear-gradient(90deg, #6D56FA, #EBE9FC)" style="background:linear-gradient(90deg,#6d56fa,#ebe9fc)"><span>#6D56FA → #EBE9FC</span></button>' +
            '<button type="button" class="grad" data-copy="linear-gradient(90deg, ' + c[0] + ', #F4F4FC)" style="background:linear-gradient(90deg,' + esc(c[0]) + ',#f4f4fc)"><span>' + esc(c[0]) + ' → #F4F4FC</span></button>' +
          '</div>' : '') +
        '</div>' +

        '<div class="sub reveal"><div class="sub-head"><span>03</span><h3>График элементүүд</h3><em class="swipe">гүйлгэх →</em></div>' +
          '<div class="hscroll elements">' + elements + '</div>' +
        '</div>' +

        '<div class="sub reveal"><div class="sub-head"><span>04</span><h3>10 гол хэв маяг</h3><em class="swipe">гүйлгэх →</em></div>' +
          '<div class="hscroll styles">' + STYLES.map(styleTile).join('') + '</div>' +
        '</div>' +

        '<div class="sub reveal"><div class="sub-head"><span>05</span><h3>Фонт</h3><em class="swipe">гүйлгэх →</em><button class="btn small" type="button" data-dl-fonts="Inter Tight|Inter" data-zip="Graphican-fonts.zip">Inter Tight + Inter ↓</button></div>' +
          '<div class="hscroll type-specs">' +
            '<div class="ts"><small>ЛОГО</small><div class="ts-logo">Graphican</div><p>iBrand — зөвхөн логонд</p></div>' +
            '<div class="ts"><small>ГАРЧИГ</small><div class="ts-display">Дизайн ярьдаг.</div><p>Inter Tight · 600–700 · үсэг хоорондын зай −5%</p></div>' +
            '<div class="ts"><small>ЭХ БИЧВЭР</small><div class="ts-body">Брэндийн санааг тодорхой дүр төрхтэй болгож, орчин үеийн визуал шийдлээр илэрхийлнэ.</div><p>Inter · 400–500 · мөрийн өндөр 1.6</p></div>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  var SAMPLE = {
    h_mn: 'Дизайн ярьдаг.', h_en: 'Design that speaks.',
    b_mn: 'Брэндийн санааг тодорхой, ойлгомжтой, орчин үеийн хэлбэрээр хүргэнэ.',
    b_en: 'Clear, modern and easy to read — built for real content.'
  };

  function badge(f) {
    if (f.cyr === null) return '';
    return f.cyr ? '<span class="badge ok">Кирилл ✓</span>' : '<span class="badge">Латин</span>';
  }

  var allPairs = [];

  function fonts(fs) {
    var n = 0;
    var groups = list(fs.groups).map(function (g) {
      var cards = list(g.items).map(function (it) {
        var h = font(it.heading), b = font(it.body);
        var idx = allPairs.length;
        allPairs.push({ heading: it.heading, body: it.body, group: g.name });
        n++;
        var notes = [h.paid, b.paid && b.paid !== h.paid ? b.paid : ''].filter(Boolean);
        return (
          '<article class="fp reveal" data-fh="' + esc(it.heading) + '" data-fb="' + esc(it.body) + '">' +
            '<div class="fp-top"><span class="fp-n">' + pad(n) + '</span><span class="fp-badges">' + badge(h) + '</span></div>' +
            '<div class="fp-aa" style="font-family:' + esc(h.stack) + ';font-weight:' + h.w + '">Aa</div>' +
            '<div class="fp-h" style="font-family:' + esc(h.stack) + ';font-weight:' + h.w + '">' + esc(h.cyr ? SAMPLE.h_mn : SAMPLE.h_en) + '</div>' +
            '<p class="fp-b" style="font-family:' + esc(b.stack) + '">' + esc(b.cyr ? SAMPLE.b_mn : SAMPLE.b_en) + '</p>' +
            '<div class="fp-names">' +
              '<div><small>Гарчиг</small><b>' + esc(it.heading) + '</b></div>' +
              '<span>+</span>' +
              '<div><small>Эх бичвэр</small><b>' + esc(it.body) + '</b> ' + badge(b) + '</div>' +
            '</div>' +
            (it.desc ? '<p class="fp-desc">' + esc(it.desc) + '</p>' : '') +
            (notes.length ? '<p class="fp-note">' + esc(notes.join(' ')) + '</p>' : '') +
            '<div class="fp-actions">' +
              '<button class="btn small solid" type="button" data-pick-pair="' + idx + '">Сонгох</button>' +
              ((h.dl || h.alt || b.dl || b.alt)
                ? '<button class="btn small" type="button" data-dl-pair="' + idx + '">Фонт татах ↓</button>'
                : [h, b].filter(function (x, k, arr) { return x.link && arr.map(function (y) { return y.link; }).indexOf(x.link) === k; })
                    .map(function (x) { return '<a class="btn small" href="' + esc(x.link) + '" target="_blank" rel="noopener">' + esc(x.name) + ' ↗</a>'; }).join('')) +
              '<button class="btn small ghost" type="button" data-copy-pair="' + idx + '" title="CSS код хуулах">CSS</button>' +
            '</div>' +
          '</article>'
        );
      }).join('');
      return (
        '<div class="fgroup">' +
          '<div class="fgroup-head reveal"><h3>' + esc(g.name) + '</h3><span>' + esc(g.name_en) + ' · ' + list(g.items).length + '</span><em class="swipe">гүйлгэх →</em></div>' +
          '<div class="hscroll fp-grid">' + cards + '</div>' +
        '</div>'
      );
    }).join('');
    return '<section class="sec fonts" id="fonts">' + head(fs) + groups + '</section>';
  }

  var allPalettes = [];

  function palettes(ps) {
    var cards = list(ps.items).map(function (p, i) {
      allPalettes.push(p);
      var r = paletteRoles(p);
      var stripes = list(p.colors).map(function (c) {
        return (
          '<button type="button" class="stripe" data-copy="' + esc(String(c.hex).toUpperCase()) + '" style="--c:' + esc(c.hex) + ';--ink:' + inkOn(c.hex) + '" title="' + esc(c.role) + ' ' + esc(c.hex) + ' — хуулах">' +
            '<small>' + esc(c.role) + '</small><code>' + esc(String(c.hex).toUpperCase()) + '</code>' +
          '</button>'
        );
      }).join('');
      return (
        '<article class="pal reveal">' +
          '<div class="pal-preview" style="background:' + esc(r.bg) + ';color:' + esc(r.text) + '">' +
            '<span class="pp-n">' + pad(i + 1) + '</span>' +
            '<b class="pp-h">Aa</b>' +
            '<span class="pp-panel" style="background:' + esc(r.surface) + '">' +
              '<span class="pp-line" style="background:' + esc(r.text) + '"></span>' +
              '<span class="pp-line s" style="background:' + esc(r.text) + '"></span>' +
            '</span>' +
            '<span class="pp-btn" style="background:' + esc(r.accent) + ';color:' + inkOn(r.accent) + '">Товч</span>' +
            '<span class="pp-dot" style="background:' + esc(r.accent2) + '"></span>' +
          '</div>' +
          '<div class="stripes">' + stripes + '</div>' +
          '<div class="pal-foot">' +
            '<div class="pal-title"><h3>' + esc(p.name) + '</h3><span class="badge' + (lum(r.bg) > 0.5 ? '' : ' dark') + '">' + (lum(r.bg) > 0.5 ? 'ЦАЙВАР' : 'БАРААН') + '</span></div>' +
            (p.desc ? '<p class="pal-desc">' + esc(p.desc) + '</p>' : '') +
            '<div class="pal-actions">' +
              '<button class="btn small solid" type="button" data-pick-pal="' + i + '">Сонгох</button>' +
              '<button class="btn small" type="button" data-copy-pal="' + i + '">Хуулах</button>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
    return '<section class="sec palettes" id="colors">' + head(ps) + '<p class="swipe-hint">' + list(ps.items).length + ' хослол · хажуу тийш гүйлгэнэ →</p><div class="hscroll pal-grid">' + cards + '</div></section>';
  }

  function builder(b) {
    var groups = {};
    allPairs.forEach(function (p, i) {
      (groups[p.group] = groups[p.group] || []).push('<option value="' + i + '">' + esc(p.heading + ' + ' + p.body) + '</option>');
    });
    var pairOpts = Object.keys(groups).map(function (g) { return '<optgroup label="' + esc(g) + '">' + groups[g].join('') + '</optgroup>'; }).join('');
    var palOpts = allPalettes.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + '</option>'; }).join('');

    return (
      '<section class="sec kit" id="kit">' + fx('reels') + head(b) +
        '<div class="kit-grid reveal">' +
          '<div class="kit-controls">' +
            '<label><span>01 · Фонтын хослол</span><select id="kit-pair">' + pairOpts + '</select></label>' +
            '<label><span>02 · Өнгөний хослол</span><select id="kit-pal">' + palOpts + '</select></label>' +
            '<div class="kit-summary" id="kit-summary"></div>' +
            '<div class="kit-actions">' +
              '<button class="btn solid wide" type="button" id="dl-all">Бүгдийг нэг дор татах (.zip) ↓</button>' +
              '<button class="btn" type="button" id="dl-fonts">Фонт татах ↓</button>' +
              '<button class="btn" type="button" id="dl-css">CSS файл ↓</button>' +
              '<button class="btn ghost" type="button" id="dl-json">JSON ↓</button>' +
              '<button class="btn ghost" type="button" id="cp-css">CSS хуулах</button>' +
            '</div>' +
            '<p class="kit-zipnote">ZIP дотор: компьютерт суулгах фонтын файлууд (.ttf), CSS, JSON, суулгах заавар.</p>' +
            '<details class="kit-code"><summary>Кодыг харах</summary><pre id="kit-code"></pre></details>' +
            '<p class="kit-help"><b>Фонт суулгах:</b> ZIP-ээ задлаад .ttf файлууд дээр баруун товч → <code>Install</code> (Windows) эсвэл давхар дарж → <code>Install Font</code> (Mac). <b>Вэбсайтад:</b> татсан <code>.css</code> файлаа сайтынхаа хавтсанд хийгээд <code>&lt;head&gt;</code> хэсэгт <code>&lt;link rel="stylesheet" href="graphican-starter.css"&gt;</code> гэж холбоно. Товчинд <code>class="btn"</code>, картад <code>class="card"</code> өгнө.</p>' +
          '</div>' +
          '<div class="kit-preview" id="kit-preview" aria-label="Урьдчилан харах">' +
            '<div class="kp-bar"><i></i><i></i><i></i><span>your-site.mn</span></div>' +
            '<div class="kp-page">' +
              '<nav class="kp-nav"><b class="kp-logo">Brand</b><span>Бүтээгдэхүүн</span><span>Тухай</span><span class="kp-cta">Холбогдох</span></nav>' +
              '<div class="kp-hero">' +
                '<span class="kp-tag">ШИНЭ · 2026</span>' +
                '<h3 class="kp-h1"></h3>' +
                '<p class="kp-p"></p>' +
                '<div class="kp-btns"><span class="kp-btn">Эхлэх →</span><span class="kp-btn o">Дэлгэрэнгүй</span></div>' +
              '</div>' +
              '<div class="kp-cards">' +
                '<div class="kp-card"><span class="kp-tag">01</span><h4 class="kp-h4">Хурдан</h4><p>Бэлэн өнгө, фонттой.</p></div>' +
                '<div class="kp-card"><span class="kp-tag">02</span><h4 class="kp-h4">Ойлгомжтой</h4><p>Уншихад хялбар.</p></div>' +
                '<div class="kp-card"><span class="kp-tag">03</span><h4 class="kp-h4">Цэвэрхэн</h4><p>Орчин үеийн хэв маяг.</p></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function footer() {
    return '<footer class="footer"><span>© ' + new Date().getFullYear() + ' GRAPHICAN</span><span class="mark" aria-hidden="true"></span><a href="/">← graphican.online</a></footer>';
  }

  // ---------- builder behaviour ----------

  var state = { pair: 0, pal: 0 };

  function current() { return { pair: allPairs[state.pair], pal: allPalettes[state.pal] }; }

  function updateKit() {
    var c = current();
    if (!c.pair || !c.pal) return;
    loadFont(c.pair.heading, 'heading');
    loadFont(c.pair.body, 'body');
    var h = font(c.pair.heading), b = font(c.pair.body);
    var r = paletteRoles(c.pal);
    var pv = document.getElementById('kit-preview');
    pv.style.setProperty('--k-bg', r.bg);
    pv.style.setProperty('--k-text', r.text);
    pv.style.setProperty('--k-accent', r.accent);
    pv.style.setProperty('--k-accent2', r.accent2);
    pv.style.setProperty('--k-surface', r.surface);
    pv.style.setProperty('--k-on', inkOn(r.accent));
    pv.style.setProperty('--k-h', h.stack);
    pv.style.setProperty('--k-hw', h.w);
    pv.style.setProperty('--k-b', b.stack);
    pv.querySelector('.kp-h1').textContent = h.cyr ? 'Санаагаа бодит болго.' : 'Make ideas real.';
    pv.querySelector('.kp-p').textContent = b.cyr
      ? 'Энэ бол таны сонгосон фонт, өнгөөр харагдах вэбсайтын жишээ. Бүх зүйл нэг файлд багтсан.'
      : 'This is how your website looks with the chosen fonts and colours — all in one file.';
    var dh = pv.querySelectorAll('.kp-h4');
    for (var i = 0; i < dh.length; i++) dh[i].style.fontFamily = h.stack;
    document.getElementById('kit-summary').innerHTML =
      '<div><small>Гарчиг</small><b>' + esc(c.pair.heading) + '</b> ' + badge(h) + '</div>' +
      '<div><small>Эх бичвэр</small><b>' + esc(c.pair.body) + '</b> ' + badge(b) + '</div>' +
      '<div class="ks-colors">' + list(c.pal.colors).map(function (x) {
        return '<span style="background:' + esc(x.hex) + '" title="' + esc(x.role + ' ' + x.hex) + '"></span>';
      }).join('') + '<b>' + esc(c.pal.name) + '</b></div>' +
      (h.paid || b.paid ? '<p class="fp-note">' + esc(h.paid || b.paid) + '</p>' : '');
    document.getElementById('kit-code').textContent = buildCss(c.pair, c.pal);
    document.getElementById('kit-pair').value = String(state.pair);
    document.getElementById('kit-pal').value = String(state.pal);
  }

  function setupKit(data) {
    if (!allPairs.length || !allPalettes.length) return;
    // default: Sora + Manrope × Dark Mode Minimal
    updateKit();
    document.getElementById('kit-pair').addEventListener('change', function (e) { state.pair = +e.target.value; updateKit(); });
    document.getElementById('kit-pal').addEventListener('change', function (e) { state.pal = +e.target.value; updateKit(); });
    function fname(ext) {
      var c = current();
      return 'graphican-starter-' + slugify(c.pair.heading + '-' + c.pair.body + '-' + c.pal.name) + '.' + ext;
    }
    document.getElementById('dl-css').addEventListener('click', function () { var c = current(); download(fname('css'), buildCss(c.pair, c.pal), 'text/css'); });
    document.getElementById('dl-json').addEventListener('click', function () { var c = current(); download(fname('json'), buildJson(c.pair, c.pal), 'application/json'); });
    document.getElementById('cp-css').addEventListener('click', function () { var c = current(); copy(buildCss(c.pair, c.pal), 'CSS код хуулагдлаа'); });
    document.getElementById('dl-fonts').addEventListener('click', function () {
      var c = current();
      fontZip([c.pair.heading, c.pair.body], 'fonts-' + slugify(c.pair.heading + '-' + c.pair.body) + '.zip');
    });
    document.getElementById('dl-all').addEventListener('click', function () {
      var c = current();
      fontZip([c.pair.heading, c.pair.body], fname('zip'), [
        { name: 'graphican-starter.css', text: buildCss(c.pair, c.pal) },
        { name: 'graphican-starter.json', text: buildJson(c.pair, c.pal) }
      ]);
    });

    document.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-pick-pair]'))) { state.pair = +t.getAttribute('data-pick-pair'); updateKit(); goKit(); return; }
      if ((t = e.target.closest('[data-pick-pal]'))) { state.pal = +t.getAttribute('data-pick-pal'); updateKit(); goKit(); return; }
      if ((t = e.target.closest('[data-dl-pair]'))) {
        var dp = allPairs[+t.getAttribute('data-dl-pair')];
        fontZip([dp.heading, dp.body], 'fonts-' + slugify(dp.heading + '-' + dp.body) + '.zip');
        return;
      }
      if ((t = e.target.closest('[data-dl-fonts]'))) {
        fontZip(t.getAttribute('data-dl-fonts').split('|'), t.getAttribute('data-zip') || 'fonts.zip');
        return;
      }
      if ((t = e.target.closest('[data-copy-pair]'))) {
        var p = allPairs[+t.getAttribute('data-copy-pair')];
        copy(importCss(p.heading, p.body) + '\n\n--font-heading: ' + stackFor(p.heading) + ';\n--font-body: ' + stackFor(p.body) + ';', p.heading + ' + ' + p.body + ' — CSS хуулагдлаа');
        return;
      }
      if ((t = e.target.closest('[data-copy-pal]'))) {
        var pl = allPalettes[+t.getAttribute('data-copy-pal')], r = paletteRoles(pl);
        copy(':root {\n  --color-bg: ' + r.bg + ';\n  --color-text: ' + r.text + ';\n  --color-accent: ' + r.accent + ';\n' + '  --color-accent-2: ' + r.accent2 + ';\n  --color-surface: ' + r.surface + ';\n}', pl.name + ' — өнгөнүүд хуулагдлаа');
        return;
      }
      if ((t = e.target.closest('[data-copy]'))) { copy(t.getAttribute('data-copy'), t.getAttribute('data-copy') + ' хуулагдлаа'); return; }
      if (e.target.closest('[data-brand-css]')) { download('graphican-brand.css', brandCss((data.guide || {}).colors), 'text/css'); }
    });
  }

  function goKit() {
    var k = document.getElementById('kit');
    if (k) k.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- page behaviour ----------

  function enhance() {
    document.documentElement.classList.add('js');
    var header = document.getElementById('header');
    function onScroll() { header.classList.toggle('scrolled', window.scrollY > 30); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var toggle = document.getElementById('menu-toggle');
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    header.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { header.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); });
    });

    requestAnimationFrame(function () { document.documentElement.classList.add('ready'); });

    var cards = document.querySelectorAll('.fp');
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      cards.forEach(function (c) { loadFont(c.getAttribute('data-fh'), 'heading'); loadFont(c.getAttribute('data-fb'), 'body'); });
      return;
    }
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); revealer.unobserve(e.target); } });
    }, { threshold: 0.06, rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 70 + 'ms';
      revealer.observe(el);
    });

    // load each pairing's fonts only when its card comes near the screen
    var fontIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        loadFont(e.target.getAttribute('data-fh'), 'heading');
        loadFont(e.target.getAttribute('data-fb'), 'body');
        fontIO.unobserve(e.target);
      });
    }, { rootMargin: '600px 0px' });
    cards.forEach(function (c) { fontIO.observe(c); });

    if (/^#[\w-]+$/.test(location.hash)) {
      var target = document.querySelector(location.hash);
      if (target) target.scrollIntoView();
    }
  }

  // ---------- boot ----------

  var app = document.getElementById('app');
  fetch('/content/design.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (d.seo) {
        if (d.seo.title) document.title = d.seo.title;
        var m = document.querySelector('meta[name="description"]');
        if (m && d.seo.description) m.setAttribute('content', d.seo.description);
      }
      var html = hero(d.hero || {}) + fonts(d.fonts || {}) + palettes(d.palettes || {});
      html += builder(d.builder || {}) + guide(d.guide || {}) + footer();
      app.innerHTML = html;
      enhance();
      setupKit(d);
    })
    .catch(function (err) {
      console.error(err);
      app.innerHTML = '<p class="load-error">Контент ачаалж чадсангүй. Хуудсаа дахин ачаална уу.</p>';
    });
})();
