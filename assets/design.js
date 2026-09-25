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

  var H1_NEXT = /^\/tools\/(upscale|bgremove|socialcrop|pdf)\/?$/.test(location.pathname); // tool pages: first heading = H1
  function head(s) {
    var isH1 = H1_NEXT; H1_NEXT = false;
    return (
      '<header class="sec-head reveal">' +
        '<div class="sec-meta"><span>' + esc(s.kicker) + '</span>' + (s.title_en ? '<span>' + esc(s.title_en) + ' +</span>' : '') + '</div>' +
        (isH1 ? '<h1 class="sec-title">' + blurText(s.title, 0.55) + '</h1>' : '<h2 class="sec-title">' + blurText(s.title, 0.55) + '</h2>') +
        (s.description ? '<p class="sec-desc">' + esc(s.description) + '</p>' : '') +
      '</header>'
    );
  }

  var GUIDE_CHIPS = '<a href="#fonts">Фонт</a><a href="#colors">Өнгө</a><a class="hot" href="#kit">Нэг товшилтоор татах ↓</a><a class="brand" href="#guide"><span class="dp-orb" aria-hidden="true"></span>Graphican брэнд гайд</a><a href="/tools/">Design tools →</a>';
  var TOOLS_CHIPS = '<a class="hot" href="/tools/upscale/">AI томруулагч ✦</a><a href="/tools/bgremove/">Дэвсгэр арилгагч</a><a href="/tools/socialcrop/">Сошиал тайрагч</a><a href="/tools/pdfedit/">PDF засварлагч</a><a href="/tools/pdf/">PDF хөрвүүлэгч</a><a href="/editor/">Засварлагч ↗</a><a class="brand" href="/design/"><span class="dp-orb" aria-hidden="true"></span>Design guide →</a>';

  function hero(h, page) {
    var tools = page === 'tools';
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
            '<div class="chips">' + (tools ? TOOLS_CHIPS : GUIDE_CHIPS) + '</div>' +
          '</div>' +
          '<div class="corner bl">' + (tools ? '01 UPSCALE · 02 BACKGROUND · 03 SOCIAL · 04 PDF · 05 EDITOR' : '01 TYPE · 02 COLOR · 03 KIT · 04 BRAND') + '</div>' +
          '<div class="corner br">' + new Date().getFullYear() + '<br>' + (tools ? 'TOOLS' : 'GUIDE') + '</div>' +
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
              '<button class="btn solid wide" type="button" id="to-editor">Энэ фонт, өнгөөр засварлагчид дизайн хийх ↗</button>' +
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

  // ---------- tools page: picker cards + per-tool "how it works" ----------

  var TOOL_INFO = [
    { id: 'upscale', badge: 'AI', name: 'AI томруулагч', what: 'Жижиг, бүдэг зургийг 2–4 дахин томруулж тодруулна.',
      when: 'Лого, бүтээгдэхүүний зураг хэвлэлд бага чанартай байхад', sample: '/assets/uploads/edusmart-logo-mockup.webp',
      steps: ['Зургаа оруулна', '2× эсвэл 4× сонгоод «Сайжруулах» дарна', 'Өмнө / дараа харьцуулж татна'] },
    { id: 'bgremove', badge: 'BG', name: 'Дэвсгэр арилгагч', what: 'Хүн, бүтээгдэхүүний арын дэвсгэрийг автоматаар арилгана.',
      when: 'Бүтээгдэхүүнийг цагаан эсвэл тунгалаг дэвсгэртэй болгох', sample: '/assets/uploads/butafter-shampoo.webp',
      steps: ['Зургаа оруулна', '«Дэвсгэр арилгах» дарна', 'Тунгалаг PNG эсвэл шинэ өнгөтэйгөөр татна'] },
    { id: 'socialcrop', badge: '✂', name: 'Сошиал тайрагч', what: 'Нэг зургийг IG, Story, Facebook, YouTube хэмжээ рүү тайрна.',
      when: 'Нэг постерыг бүх сошиал сувагт тавих', sample: '/assets/uploads/novanest-dining-table.webp',
      steps: ['Зургаа оруулна', 'Хэрэгтэй хэмжээнүүдээ чагтална · чирж засна', 'Нэг бүрчлэн эсвэл ZIP-ээр татна'] },
    { id: 'pdfedit', badge: 'PDF', name: 'PDF засварлагч', what: 'PDF доторх бичгийг засах, текст, гарын үсэг, зураг нэмэх, хуудас эргүүлэх, нэгтгэх.',
      when: 'Гэрээ, нэхэмжлэх, маягтанд засвар оруулах, гарын үсэг зурах', href: '/tools/pdfedit/',
      steps: ['PDF (эсвэл Word, Excel, зураг) оруулна', '«Текст засах»-аар бичгийг дарж засна, эсвэл шинээр нэмнэ', 'PDF-ээр татна'] },
    { id: 'pdf', badge: '⇄', name: 'PDF хөрвүүлэгч', what: 'PDF-ийг зураг болгох, эсвэл Word, Excel, зураг зэрэг олон файлыг нэг PDF болгох.',
      when: 'Каталогийг сошиалд тавих / баримт, зургуудаа нэг PDF болгох',
      steps: ['Чиглэлээ сонгоно (PDF → зураг эсвэл файл → PDF)', 'Файлаа оруулна (PDF, DOCX, XLSX, HEIC, WebP…)', 'ZIP эсвэл PDF-ээр татна'] },
    { id: 'editor', badge: 'Aa', name: 'Засварлагч', what: 'Canva шиг: текст, зураг, хэлбэр нэмж постер, сошиал пост бүтээнэ.',
      when: 'Бэлэн зурган дээр текст, лого нэмж пост хийх', href: '/editor/',
      steps: ['Хэмжээгээ сонгоно', 'Текст, зураг, хэлбэр нэмнэ', 'PNG, JPG, PDF-ээр татна'] }
  ];
  function toolInfo(id) { return TOOL_INFO.filter(function (t) { return t.id === id; })[0] || {}; }

  function toolHref(t) { return t.href || '/tools/' + t.id + '/'; }
  function toolCards(skip) {
    return TOOL_INFO.filter(function (t) { return t.id !== skip; }).map(function (t) {
      var i = TOOL_INFO.indexOf(t);
      return (
        '<a class="tp-card" href="' + toolHref(t) + '">' +
          '<span class="tp-top"><span class="drop-ic" aria-hidden="true">' + esc(t.badge) + '</span><span class="tp-n">' + pad(i + 1) + '</span></span>' +
          '<b>' + esc(t.name) + '</b>' +
          '<span class="tp-what">' + esc(t.what) + '</span>' +
          '<span class="tp-when"><i>Хэзээ:</i> ' + esc(t.when) + '</span>' +
          '<span class="tp-go">' + (t.href ? 'Засварлагч нээх ↗' : 'Нээх →') + '</span>' +
        '</a>'
      );
    }).join('');
  }

  function toolPicker() {
    var cards = toolCards();
    return (
      '<section class="sec picker" id="picker">' +
        '<header class="sec-head reveal"><div class="sec-meta"><span>ЭХЛЭХ</span><span>CHOOSE A TOOL +</span></div>' +
          '<h2 class="sec-title">' + blurText('Хэрэгслээ сонго.', 0.55) + '</h2>' +
          '<p class="sec-desc">Бүгд үнэгүй, бүртгэлгүй. Зураг тань таны компьютерээс гарахгүй — бүх боловсруулалт хөтөч дотор хийгдэнэ.</p></header>' +
        '<div class="tp-grid reveal">' + cards + '</div>' +
        '<div class="tp-flow reveal">' +
          '<span class="flow-t">Хэрэгслүүд хоорондоо холбоотой</span>' +
          '<p>Нэг хэрэгслийн үр дүнг <b>«Үргэлжлүүлэх →»</b> товчоор дараагийнх руу шууд дамжуулна — татаж аваад дахин оруулах шаардлагагүй.</p>' +
          '<div class="tp-chain"><span>Зураг</span><i>→</i><span>Дэвсгэр арилгах</span><i>→</i><span>✦ Томруулах</span><i>→</i><span>Сошиал хэмжээ</span><i>→</i><span>Засварлагч</span><i>→</i><span>Татах</span></div>' +
        '</div>' +
      '</section>'
    );
  }

  // numbered steps + "try with a sample" under each tool heading
  function toolGuide(id) {
    var t = toolInfo(id);
    if (!t.steps) return '';
    return (
      '<div class="tg reveal">' +
        '<ol class="tg-steps">' + t.steps.map(function (s, i) { return '<li><span>' + (i + 1) + '</span>' + esc(s) + '</li>'; }).join('') + '</ol>' +
        (t.sample ? '<button type="button" class="btn ghost tg-sample" data-sample="' + id + '">Жишээ зургаар турших</button>' : '') +
      '</div>'
    );
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sample]');
    if (!b) return;
    var t = toolInfo(b.getAttribute('data-sample'));
    if (!t.sample || !FLOW[t.id]) return;
    b.disabled = true;
    fetch(t.sample).then(function (r) { return r.blob(); }).then(function (blob) {
      FLOW[t.id](blobToFile(blob, t.sample.split('/').pop()));
      toast('Жишээ зураг орлоо — одоо дараагийн алхмаа хийгээрэй');
    }).catch(function () { toast('Жишээ зургийг ачаалж чадсангүй'); })
      .then(function () { b.disabled = false; });
  });

  // ---------- tool chaining: send a result to the next tool ----------
  // Each tool registers FLOW[id] = function (file) { load it }. The editor lives on
  // its own page, so images for it go through the IndexedDB hand-off (handoff.js).

  var FLOW = {};
  var FLOW_TARGETS = [
    { id: 'upscale', label: '✦ Томруулах' },
    { id: 'bgremove', label: 'Дэвсгэр арилгах' },
    { id: 'socialcrop', label: 'Сошиал хэмжээ' },
    { id: 'pdf', label: 'PDF болгох' },
    { id: 'editor', label: 'Засварлагчид нээх ↗' }
  ];

  function blobToFile(blob, name) {
    try { return new File([blob], name, { type: blob.type }); }
    catch (e) { blob.name = name; return blob; }
  }

  // every tool has its own page, so a result travels through the IndexedDB hand-off
  function sendTo(target, blob, name) {
    if (!window.GHandoff) { toast('Илгээж чадсангүй'); return; }
    toast('Шилжиж байна…');
    window.GHandoff.put(blob, { name: name, target: target }).then(function () {
      location.href = target === 'editor' ? '/editor/' : '/tools/' + target + '/';
    }).catch(function () { toast('Илгээж чадсангүй'); });
  }

  function toolCrumb(id) {
    return '<nav class="tool-crumb" aria-label="Байршил"><a href="/tools/">Design tools</a><span aria-hidden="true">/</span><b>' + esc(toolInfo(id).name) + '</b></nav>';
  }
  function otherTools(id) {
    return (
      '<section class="sec other-tools">' +
        '<div class="sec-meta"><span>БУСАД ХЭРЭГСЭЛ</span><span>MORE TOOLS +</span></div>' +
        '<div class="tp-grid">' + toolCards(id) + '</div>' +
      '</section>'
    );
  }

  // Renders the "Үргэлжлүүлэх →" row into `el`; getBlob() returns Promise<{blob, name}>.
  function flowRow(el, current, getBlob, title) {
    el.innerHTML = '<span class="flow-t">' + esc(title || 'Үргэлжлүүлэх →') + '</span>' +
      FLOW_TARGETS.filter(function (t) { return t.id !== current; }).map(function (t) {
        return '<button type="button" class="btn ghost" data-flow-to="' + t.id + '">' + esc(t.label) + '</button>';
      }).join('');
    el.hidden = false;
    el.querySelectorAll('[data-flow-to]').forEach(function (b) {
      b.addEventListener('click', function () {
        getBlob().then(function (r) { sendTo(b.getAttribute('data-flow-to'), r.blob, r.name); });
      });
    });
  }

  function canvasToPng(c, name) {
    return new Promise(function (res) { c.toBlob(function (b) { res({ blob: b, name: name }); }, 'image/png'); });
  }

  // ---------- AI image upscaler (ESRGAN via TensorFlow.js, runs in the browser) ----------

  function upscaleSection(u) {
    return (
      '<section class="sec upscale" id="upscale">' + head(u) + toolGuide('upscale') +
        '<div class="tool reveal">' +
          '<label class="drop" data-drop="up">' +
            '<input type="file" accept="image/png,image/jpeg,image/webp" hidden>' +
            '<span class="drop-ic" aria-hidden="true">AI</span>' +
            '<b>Зургаа энд чирж оруулна уу</b><span>PNG, JPG, WebP · эсвэл дарж сонгоно</span>' +
          '</label>' +
          '<div class="tool-opts">' +
            '<label><span>Хэд дахин томруулах</span><select data-opt="upx"><option value="2" selected>2 дахин — хурдан, ихэнхэд хангалттай</option><option value="4">4 дахин — удаан, маш жижиг зурагт</option></select></label>' +
            '<label><span>Хэр цэвэрлэх (бүдэг, цэг цэг хэсэг)</span><select data-opt="denoise"><option value="0.2">Зөөлөн — жижиг хээг хадгална</option><option value="0.6" selected>Энгийн — санал болгох</option><option value="1">Хүчтэй — гөлгөр, цэвэрхэн</option></select></label>' +
            '<label><span>Ирмэгийг тодруулах</span><select data-opt="sharp"><option value="0" selected>Үгүй — байгалийн</option><option value="0.25">Бага зэрэг</option><option value="0.5">Илүү тод (текст, лого)</option></select></label>' +
            '<label><span>Гаргах формат</span><select data-opt="upfmt"><option value="png">PNG</option><option value="jpg">JPG</option></select></label>' +
            '<button type="button" class="btn solid" data-act="up-run" disabled>Сайжруулах ✦</button>' +
            '<button type="button" class="btn" data-act="up-dl" disabled>Татах ↓</button>' +
          '</div>' +
          '<div class="up-progress" hidden><i></i></div>' +
          '<p class="tool-status" data-status="up"></p>' +
          '<div class="compare" hidden>' +
            '<div class="cmp-wrap">' +
              '<img class="cmp-after" alt="Сайжруулсан">' +
              '<div class="cmp-before"><img alt="Анхны"></div>' +
              '<span class="cmp-line" aria-hidden="true"></span>' +
              '<span class="cmp-tag l">ӨМНӨ</span><span class="cmp-tag r">ДАРАА</span>' +
              '<input class="cmp-range" type="range" min="0" max="100" value="50" aria-label="Өмнө / дараа харьцуулах">' +
            '</div>' +
            '<p class="cmp-meta"></p>' +
          '</div>' +
          '<div class="flow" data-flow hidden></div>' +
        '</div>' +
        '<p class="tool-note reveal">✦ Real-ESRGAN хиймэл оюун — бүдгийг тодруулж, шуугиан болон JPG шахалтын алдааг арилгана. Бүх боловсруулалт таны хөтөч дотор (GPU), файл серверт илгээгдэхгүй. Анх ашиглахад загвар (~5MB) нэг удаа ачаална.</p>' +
      '</section>'
    );
  }

  function loadScript(src) {
    return new Promise(function (res, rej) {
      if (document.querySelector('script[data-src="' + src + '"]')) return res();
      var s = document.createElement('script'); s.src = src; s.dataset.src = src;
      s.onload = function () { res(); }; s.onerror = rej; document.head.appendChild(s);
    });
  }
  // Real-ESRGAN (general-x4v3 + wdn-x4v3, SRVGGNetCompact) implemented directly on TF.js ops.
  var esr = { tf: null, man: null, bins: {}, nets: {} };
  function f16to32(u16) {
    var out = new Float32Array(u16.length);
    for (var i = 0; i < u16.length; i++) {
      var h = u16[i], s = (h & 0x8000) ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
      out[i] = e === 0 ? s * Math.pow(2, -14) * (f / 1024) : e === 31 ? (f ? NaN : s * Infinity) : s * Math.pow(2, e - 15) * (1 + f / 1024);
    }
    return out;
  }
  function esrReady() {
    if (esr.ready) return esr.ready;
    esr.ready = loadScript('/assets/vendor/tf.min.js').then(function () {
      esr.tf = window.tf;
      return esr.tf.ready().then(function () {
        return Promise.all([
          fetch('/assets/vendor/realesr/model.json').then(function (r) { return r.json(); }),
          fetch('/assets/vendor/realesr/general.bin').then(function (r) { return r.arrayBuffer(); }),
          fetch('/assets/vendor/realesr/wdn.bin').then(function (r) { return r.arrayBuffer(); })
        ]);
      });
    }).then(function (r) {
      esr.man = r[0];
      esr.bins.general = f16to32(new Uint16Array(r[1]));
      esr.bins.wdn = f16to32(new Uint16Array(r[2]));
    });
    return esr.ready;
  }
  // denoise 0..1 → blend of the two official models (same as Real-ESRGAN's "denoise strength")
  function esrNet(denoise) {
    var key = denoise.toFixed(2);
    if (esr.nets[key]) return esr.nets[key];
    Object.keys(esr.nets).forEach(function (k) { esr.nets[k].forEach(function (l) { l.w && l.w.dispose(); l.b && l.b.dispose(); l.a && l.a.dispose(); }); delete esr.nets[k]; });
    var tf = esr.tf, g = esr.bins.general, n = esr.bins.wdn, off = 0, layers = [];
    function take(len) {
      var o = new Float32Array(len);
      for (var i = 0; i < len; i++) o[i] = denoise * g[off + i] + (1 - denoise) * n[off + i];
      off += len; return o;
    }
    esr.man.layers.forEach(function (L) {
      if (L.t === 'conv') {
        var sh = L.shape, sz = sh[0] * sh[1] * sh[2] * sh[3];
        layers.push({ t: 'conv', w: tf.tensor4d(take(sz), sh), b: tf.tensor1d(take(sh[3])) });
      } else {
        layers.push({ t: 'prelu', a: tf.tensor1d(take(L.n)) });
      }
    });
    esr.nets[key] = layers;
    return layers;
  }
  function esrInfer(x, layers) { // x: [1,H,W,3] 0..1 → [1,4H,4W,3]
    var tf = esr.tf;
    return tf.tidy(function () {
      var h = x;
      layers.forEach(function (L) {
        if (L.t === 'conv') h = tf.add(tf.conv2d(h, L.w, 1, 'same'), L.b);
        else h = tf.prelu(h, L.a);
      });
      h = tf.depthToSpace(h, 4, 'NHWC');
      var up = tf.image.resizeNearestNeighbor(x, [x.shape[1] * 4, x.shape[2] * 4]);
      return tf.clipByValue(tf.add(h, up), 0, 1);
    });
  }
  // tiled upscale → canvas at outScale (2 or 4)
  function esrUpscale(srcCanvas, outScale, denoise, onProgress) {
    var tf = esr.tf, layers = esrNet(denoise);
    var W = srcCanvas.width, H = srcCanvas.height, T = 96, P = 8, k = outScale / 4;
    var out = document.createElement('canvas'); out.width = W * outScale; out.height = H * outScale;
    var octx = out.getContext('2d'); octx.imageSmoothingQuality = 'high';
    var tileC = document.createElement('canvas');
    var src = tf.tidy(function () { return tf.browser.fromPixels(srcCanvas).toFloat().div(255); });
    var tiles = [];
    for (var y = 0; y < H; y += T) for (var x = 0; x < W; x += T) tiles.push([x, y]);
    var i = 0;
    function step() {
      if (i >= tiles.length) { src.dispose(); return Promise.resolve(out); }
      var x = tiles[i][0], y = tiles[i][1];
      var tw = Math.min(T, W - x), th = Math.min(T, H - y);
      var x0 = Math.max(0, x - P), y0 = Math.max(0, y - P), x1 = Math.min(W, x + tw + P), y1 = Math.min(H, y + th + P);
      var res = tf.tidy(function () {
        var crop = src.slice([y0, x0, 0], [y1 - y0, x1 - x0, 3]).expandDims(0);
        var o = esrInfer(crop, layers).squeeze();
        return o.slice([(y - y0) * 4, (x - x0) * 4, 0], [th * 4, tw * 4, 3]);
      });
      tileC.width = tw * 4; tileC.height = th * 4;
      return tf.browser.toPixels(res, tileC).then(function () {
        res.dispose();
        octx.drawImage(tileC, x * outScale, y * outScale, tw * outScale, th * outScale);
        i++; onProgress(i / tiles.length);
        return tf.nextFrame().then(step);
      });
    }
    return step();
  }

  // light unsharp mask on the upscaled canvas (amount 0..1)
  function sharpen(canvas, amount) {
    if (!amount) return canvas;
    var w = canvas.width, h = canvas.height, ctx = canvas.getContext('2d');
    var src = ctx.getImageData(0, 0, w, h), d = src.data, out = ctx.createImageData(w, h), o = out.data;
    var a = amount, c = 1 + 4 * a;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var up = ((y > 0 ? y - 1 : y) * w + x) * 4, dn = ((y < h - 1 ? y + 1 : y) * w + x) * 4;
        var lf = (y * w + (x > 0 ? x - 1 : x)) * 4, rt = (y * w + (x < w - 1 ? x + 1 : x)) * 4;
        for (var k = 0; k < 3; k++) {
          var v = c * d[i + k] - a * (d[up + k] + d[dn + k] + d[lf + k] + d[rt + k]);
          o[i + k] = v < 0 ? 0 : v > 255 ? 255 : v;
        }
        o[i + 3] = d[i + 3];
      }
    }
    ctx.putImageData(out, 0, 0);
    return canvas;
  }

  function setupUpscale() {
    var root = document.getElementById('upscale');
    if (!root) return;
    function $(s) { return root.querySelector(s); }
    var drop = $('[data-drop="up"]'), inp = drop.querySelector('input');
    var runBtn = $('[data-act="up-run"]'), dlBtn = $('[data-act="up-dl"]'), st = $('[data-status="up"]');
    var bar = $('.up-progress'), barI = bar.querySelector('i');
    var cmp = $('.compare'), after = $('.cmp-after'), before = $('.cmp-before img'), beforeWrap = $('.cmp-before'), line = $('.cmp-line'), range = $('.cmp-range'), meta = $('.cmp-meta');
    var file = null, srcImg = null, resultCanvas = null, busy = false;

    function setSplit(v) { beforeWrap.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)'; line.style.left = v + '%'; }
    range.addEventListener('input', function () { setSplit(+range.value); });

    function pick(f) {
      if (!f || !/^image\/(png|jpe?g|webp)$/i.test(f.type)) { toast('PNG, JPG эсвэл WebP зураг сонгоно уу'); return; }
      file = f; resultCanvas = null; dlBtn.disabled = true;
      $('[data-flow]').hidden = true;
      var url = URL.createObjectURL(f);
      srcImg = new Image();
      srcImg.onload = function () {
        before.src = url; after.src = url; cmp.hidden = false; setSplit(50); range.value = 50;
        runBtn.disabled = false;
        var s = +$('[data-opt="upx"]').value;
        meta.textContent = srcImg.naturalWidth + ' × ' + srcImg.naturalHeight + ' px → ' + srcImg.naturalWidth * s + ' × ' + srcImg.naturalHeight * s + ' px';
        st.textContent = 'Бэлэн. "Сайжруулах" дарна уу.';
      };
      srcImg.src = url;
    }
    inp.addEventListener('change', function () { if (inp.files[0]) pick(inp.files[0]); inp.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); });
    FLOW.upscale = pick;
    $('[data-opt="upx"]').addEventListener('change', function () {
      if (!srcImg) return;
      var s = +this.value;
      meta.textContent = srcImg.naturalWidth + ' × ' + srcImg.naturalHeight + ' px → ' + srcImg.naturalWidth * s + ' × ' + srcImg.naturalHeight * s + ' px';
    });

    runBtn.addEventListener('click', function () {
      if (!srcImg || busy) return;
      busy = true; runBtn.disabled = true; dlBtn.disabled = true;
      var scale = +$('[data-opt="upx"]').value, amt = +$('[data-opt="sharp"]').value;
      // keep the output reasonable for the browser: cap input so the result is ≤ ~4800px
      var maxIn = scale === 4 ? 1000 : 1600;
      var w = srcImg.naturalWidth, h = srcImg.naturalHeight, k = Math.min(1, maxIn / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
      var cx = c.getContext('2d'); cx.imageSmoothingQuality = 'high'; cx.drawImage(srcImg, 0, 0, c.width, c.height);
      if (k < 1) toast('Зураг том тул ' + c.width + '×' + c.height + ' болгож багасгаад томруулна');
      bar.hidden = false; barI.style.width = '0%';
      st.textContent = 'AI загвар ачаалж байна…';
      var t0 = performance.now(), dn = +$('[data-opt="denoise"]').value;
      esrReady().then(function () {
        st.textContent = 'Сайжруулж байна… 0% (' + esr.tf.getBackend() + ')';
        return esrUpscale(c, scale, dn, function (p) { var pc = Math.round(p * 100); barI.style.width = pc + '%'; st.textContent = 'Сайжруулж байна… ' + pc + '%'; });
      }).then(function (out) {
        resultCanvas = sharpen(out, amt);
        after.src = resultCanvas.toDataURL('image/jpeg', .92);
        var sec = ((performance.now() - t0) / 1000).toFixed(1);
        meta.textContent = c.width + ' × ' + c.height + ' px → ' + resultCanvas.width + ' × ' + resultCanvas.height + ' px · ' + sec + ' сек';
        st.textContent = 'Болсон! Гулсуулагчаар өмнө / дараа харьцуулаад татаж аваарай.';
        barI.style.width = '100%'; dlBtn.disabled = false;
        flowRow($('[data-flow]'), 'upscale', function () { return canvasToPng(resultCanvas, (file ? file.name.replace(/\.[^.]+$/, '') : 'image') + '-upscaled.png'); });
        setTimeout(function () { bar.hidden = true; }, 600);
      }).catch(function (e) {
        console.error(e); bar.hidden = true;
        st.textContent = 'Алдаа гарлаа. Жижиг зураг эсвэл 2× сонгоод дахин оролдоно уу.';
      }).then(function () { busy = false; runBtn.disabled = !srcImg; });
    });

    dlBtn.addEventListener('click', function () {
      if (!resultCanvas) return;
      var jpg = $('[data-opt="upfmt"]').value === 'jpg';
      var scale = $('[data-opt="upx"]').value;
      var name = (file ? file.name.replace(/\.[^.]+$/, '') : 'image') + '-upscaled-' + scale + 'x.' + (jpg ? 'jpg' : 'png');
      resultCanvas.toBlob(function (b) { saveBlob(name, b); toast(name + ' татагдлаа'); }, jpg ? 'image/jpeg' : 'image/png', .95);
    });
  }

  // ---------- PDF ⇄ PNG/JPG converter (everything runs in the browser) ----------

  function tools(t) {
    return (
      '<section class="sec tools" id="pdf">' + head(t) + toolGuide('pdf') +
        '<div class="tool-tabs reveal" role="tablist">' +
          '<button type="button" class="tt active" data-tab="p2i" role="tab">PDF → зураг</button>' +
          '<button type="button" class="tt" data-tab="i2p" role="tab">Файл → PDF</button>' +
          '<a class="tt tt-link" href="/tools/pdfedit/">PDF засварлагч ↗</a>' +
        '</div>' +

        '<div class="tool reveal" data-panel="p2i">' +
          '<label class="drop" data-drop="p2i">' +
            '<input type="file" accept="' + (window.GFile ? GFile.ACCEPT : 'application/pdf,.pdf') + '" hidden>' +
            '<span class="drop-ic" aria-hidden="true">PDF</span>' +
            '<b>PDF файлаа энд чирж оруулна уу</b><span>эсвэл дарж сонгоно · Word, Excel, TXT файлыг ч хуудас бүрээр нь зураг болгоно</span>' +
          '</label>' +
          '<div class="tool-opts">' +
            '<label><span>Формат</span><select data-opt="fmt"><option value="png">PNG</option><option value="jpg">JPG</option><option value="webp">WebP</option></select></label>' +
            '<label><span>Чанар / хэмжээ</span><select data-opt="scale"><option value="1">Энгийн (72 dpi)</option><option value="2" selected>Өндөр (144 dpi)</option><option value="3">Хэвлэх (216 dpi)</option><option value="4">Маш өндөр (288 dpi)</option></select></label>' +
            '<button type="button" class="btn solid" data-act="p2i-all" disabled>Бүгдийг ZIP-ээр татах ↓</button>' +
          '</div>' +
          '<p class="tool-status" data-status="p2i"></p>' +
          '<p class="tool-edit" data-edit hidden><button type="button" class="btn ghost" data-act="p2i-edit">Энэ PDF-ийг засварлагчид нээх ↗</button></p>' +
          '<div class="thumbs" data-out="p2i"></div>' +
          '<div class="flow" data-flow="p2i" hidden></div>' +
        '</div>' +

        '<div class="tool reveal" data-panel="i2p" hidden>' +
          '<label class="drop" data-drop="i2p">' +
            '<input type="file" accept="' + (window.GFile ? GFile.ACCEPT : 'image/png,image/jpeg,image/webp') + '" multiple hidden>' +
            '<span class="drop-ic" aria-hidden="true">+</span>' +
            '<b>Файлуудаа энд чирж оруулна уу</b><span>олон файл зэрэг сонгож болно · дарааллыг чирж солино · бүгд нэг PDF болно</span>' +
            (window.GFile ? '<span class="drop-types">' + GFile.LABEL.split(' · ').map(function (x) { return '<i>' + esc(x) + '</i>'; }).join('') + '</span>' : '') +
          '</label>' +
          '<div class="tool-opts">' +
            '<label><span>Хуудасны хэмжээ</span><select data-opt="page"><option value="fit">Зургийн хэмжээгээр</option><option value="a4">A4 босоо</option><option value="a4l">A4 хэвтээ</option></select></label>' +
            '<label><span>Захын зай</span><select data-opt="margin"><option value="0">Байхгүй</option><option value="20" selected>Жижиг</option><option value="40">Дунд</option></select></label>' +
            '<button type="button" class="btn solid" data-act="i2p-make" disabled>PDF үүсгэж татах ↓</button>' +
            '<button type="button" class="btn ghost" data-act="i2p-clear" disabled>Цэвэрлэх</button>' +
          '</div>' +
          '<p class="tool-status" data-status="i2p"></p>' +
          '<div class="thumbs sortable" data-out="i2p"></div>' +
        '</div>' +

        '<p class="tool-note reveal">🔒 Файлууд тань серверт илгээгдэхгүй — бүх хөрвүүлэлт таны төхөөрөмж дээр, хөтөч дотор хийгдэнэ.</p>' +
      '</section>'
    );
  }

  var pdfjsP = null, pdflibP = null;
  function loadPdfJs() {
    if (!pdfjsP) pdfjsP = import('/assets/vendor/pdf.min.mjs').then(function (m) {
      m.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdf.worker.min.mjs';
      return m;
    });
    return pdfjsP;
  }
  function loadPdfLib() {
    if (!pdflibP) pdflibP = new Promise(function (res, rej) {
      if (window.PDFLib) return res(window.PDFLib);
      var s = document.createElement('script');
      s.src = '/assets/vendor/pdf-lib.min.js';
      s.onload = function () { res(window.PDFLib); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
    return pdflibP;
  }
  function baseName(n) { return String(n || 'file').replace(/\.[^.]+$/, '').replace(/[^\w\-Ѐ-ӿ]+/g, '_').slice(0, 60) || 'file'; }
  function canvasBlob(c, type, q) { return new Promise(function (r) { c.toBlob(r, type, q); }); }

  function setupTools() {
    var root = document.getElementById('pdf');
    if (!root) return;
    function $(sel) { return root.querySelector(sel); }

    // tabs
    root.querySelectorAll('.tt').forEach(function (b) {
      b.addEventListener('click', function () {
        root.querySelectorAll('.tt').forEach(function (x) { x.classList.toggle('active', x === b); });
        root.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== b.getAttribute('data-tab'); });
      });
    });

    // drop zones
    function wireDrop(key, onFiles) {
      var d = $('[data-drop="' + key + '"]'), inp = d.querySelector('input');
      inp.addEventListener('change', function () { if (inp.files.length) onFiles(Array.from(inp.files)); inp.value = ''; });
      ['dragenter', 'dragover'].forEach(function (ev) { d.addEventListener(ev, function (e) { e.preventDefault(); d.classList.add('over'); }); });
      ['dragleave', 'drop'].forEach(function (ev) { d.addEventListener(ev, function (e) { e.preventDefault(); d.classList.remove('over'); }); });
      d.addEventListener('drop', function (e) { if (e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files)); });
    }

    // ---- PDF → images
    var pdfDoc = null, pdfName = 'document', rendered = [];
    var st1 = $('[data-status="p2i"]'), out1 = $('[data-out="p2i"]'), allBtn = $('[data-act="p2i-all"]');
    function fmt() { return $('[data-opt="fmt"]').value; }
    function scale() { return +$('[data-opt="scale"]').value; }

    function renderPage(i) {
      return pdfDoc.getPage(i).then(function (page) {
        var vp = page.getViewport({ scale: scale() });
        var c = document.createElement('canvas');
        c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); // JPG has no transparency
        return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () { return c; });
      });
    }
    function pageBlob(c) { return fmt() === 'jpg' ? canvasBlob(c, 'image/jpeg', .92) : fmt() === 'webp' ? canvasBlob(c, 'image/webp', .9) : canvasBlob(c, 'image/png'); }
    function fileName(i) { return pdfName + '-' + pad(i) + '.' + fmt(); }

    function renderAll() {
      if (!pdfDoc) return;
      var n = pdfDoc.numPages, i = 0;
      rendered = []; out1.innerHTML = ''; allBtn.disabled = true; $('[data-flow="p2i"]').hidden = true;
      function next() {
        i++;
        if (i > n) { st1.textContent = n + ' хуудас бэлэн. Зураг дээр дарж тус тусад нь, эсвэл бүгдийг ZIP-ээр татна.'; allBtn.disabled = false; return; }
        st1.textContent = 'Хуудас ' + i + ' / ' + n + ' хөрвүүлж байна…';
        return renderPage(i).then(function (c) {
          rendered.push(c);
          var k = i;
          var fig = document.createElement('button');
          fig.type = 'button'; fig.className = 'thumb';
          fig.innerHTML = '<span class="th-n">' + pad(k) + '</span><span class="th-dl">↓ ' + fmt().toUpperCase() + '</span><span class="th-x th-go" role="button" tabindex="0" aria-label="Хуудас ' + k + '-ийг өөр хэрэгсэл рүү илгээх" title="Өөр хэрэгсэл рүү →">→</span>';
          var img = new Image(); img.src = c.toDataURL('image/jpeg', .6); img.alt = 'Хуудас ' + k;
          fig.insertBefore(img, fig.firstChild);
          fig.addEventListener('click', function (e) {
            if (e.target.closest('.th-go')) {
              flowRow($('[data-flow="p2i"]'), 'pdf', function () { return canvasToPng(c, pdfName + '-' + pad(k) + '.png'); }, 'Хуудас ' + pad(k) + ' →');
              $('[data-flow="p2i"]').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              return;
            }
            pageBlob(c).then(function (b) { saveBlob(fileName(k), b); toast(fileName(k) + ' татагдлаа'); });
          });
          out1.appendChild(fig);
          return new Promise(function (r) { setTimeout(r, 0); }).then(next);
        });
      }
      next();
    }

    var pdfBytes = null;
    wireDrop('p2i', function (files) {
      var f = files[0], G = window.GFile;
      if (!G && !(/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name))) { toast('PDF файл сонгоно уу'); return; }
      if (G && !G.kind(f)) { toast(G.whyNot(f)); return; }
      pdfName = baseName(f.name);
      st1.textContent = G && G.kind(f) !== 'pdf' ? '«' + f.name + '» уншиж байна…' : 'PDF уншиж байна…';
      Promise.all([loadPdfJs(), G ? G.toPdf(f) : f.arrayBuffer().then(function (b) { return new Uint8Array(b); })]).then(function (r) {
        pdfBytes = r[1];
        return r[0].getDocument({ data: r[1].slice() }).promise;
      }).then(function (doc) { pdfDoc = doc; $('[data-edit]').hidden = false; renderAll(); })
        .catch(function (e) { console.error(e); st1.textContent = (e && e.message && !/Invalid PDF|password/i.test(e.message)) ? e.message : 'Файлыг уншиж чадсангүй. Нууц үгтэй эсвэл гэмтсэн байж магадгүй.'; });
    });
    $('[data-act="p2i-edit"]').addEventListener('click', function () {
      if (!pdfBytes || !window.GHandoff) { location.href = '/tools/pdfedit/'; return; }
      GHandoff.put(new Blob([pdfBytes], { type: 'application/pdf' }), { name: pdfName + '.pdf', target: 'pdfedit' })
        .then(function () { location.href = '/tools/pdfedit/'; }, function () { location.href = '/tools/pdfedit/'; });
    });
    root.querySelectorAll('[data-opt="fmt"], [data-opt="scale"]').forEach(function (s) { s.addEventListener('change', renderAll); });
    allBtn.addEventListener('click', function () {
      if (!rendered.length) return;
      allBtn.disabled = true; st1.textContent = 'ZIP бэлтгэж байна…';
      Promise.all(rendered.map(function (c, k) {
        return pageBlob(c).then(function (b) { return b.arrayBuffer(); }).then(function (ab) { return { name: fileName(k + 1), data: new Uint8Array(ab) }; });
      })).then(function (files) {
        saveBlob(pdfName + '-' + fmt() + '.zip', makeZip(files));
        st1.textContent = rendered.length + ' зураг ZIP-ээр татагдлаа.'; allBtn.disabled = false;
      });
    });

    // ---- images → PDF
    var imgs = []; // {name, url, file}
    var st2 = $('[data-status="i2p"]'), out2 = $('[data-out="i2p"]'), makeBtn = $('[data-act="i2p-make"]'), clrBtn = $('[data-act="i2p-clear"]');
    function drawList() {
      out2.innerHTML = '';
      imgs.forEach(function (it, k) {
        var d = document.createElement('div');
        d.className = 'thumb'; d.draggable = true; d.dataset.k = k;
        d.innerHTML = (it.url ? '<img src="' + it.url + '" alt="">' : '<span class="th-doc"><b>' + esc(it.ext) + '</b><small>' + esc(it.name) + '</small></span>') +
          '<span class="th-n">' + pad(k + 1) + '</span><button type="button" class="th-x" aria-label="Хасах">✕</button>';
        d.querySelector('.th-x').addEventListener('click', function (e) { e.stopPropagation(); if (it.url) URL.revokeObjectURL(it.url); imgs.splice(k, 1); drawList(); });
        d.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', k); d.classList.add('dragging'); });
        d.addEventListener('dragend', function () { d.classList.remove('dragging'); });
        d.addEventListener('dragover', function (e) { e.preventDefault(); });
        d.addEventListener('drop', function (e) {
          e.preventDefault(); e.stopPropagation();
          var from = +e.dataTransfer.getData('text/plain'); if (isNaN(from) || from === k) return;
          var m = imgs.splice(from, 1)[0]; imgs.splice(k, 0, m); drawList();
        });
        out2.appendChild(d);
      });
      makeBtn.disabled = clrBtn.disabled = !imgs.length;
      st2.textContent = imgs.length ? imgs.length + ' файл · дарааллыг чирж солино' : '';
    }
    function addItem(f) {
      var G = window.GFile, k = G ? G.kind(f) : (/^image\/(png|jpe?g|webp)$/i.test(f.type) ? 'image' : null);
      if (!k) { toast(G ? G.whyNot(f) : 'PNG эсвэл JPG зураг сонгоно уу'); return; }
      var it = { name: f.name || 'file', file: f, kind: k, ext: (/\.([a-z0-9]+)$/i.exec(f.name || '') || [0, k])[1].toUpperCase() };
      if (k === 'image' || k === 'svg') it.url = URL.createObjectURL(f);
      else if ((k === 'heic' || k === 'tiff') && G) {
        // browsers can't show these directly: make a small preview
        G.imageCanvases(f).then(function (cs) {
          var c = cs[0], s = Math.min(1, 480 / Math.max(c.width, c.height)), t = document.createElement('canvas');
          t.width = Math.round(c.width * s); t.height = Math.round(c.height * s); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
          t.toBlob(function (b) { it.url = URL.createObjectURL(b); drawList(); }, 'image/jpeg', .8);
        }).catch(function () {});
      }
      imgs.push(it);
    }
    wireDrop('i2p', function (files) { files.forEach(addItem); drawList(); });
    clrBtn.addEventListener('click', function () { imgs.forEach(function (i) { if (i.url) URL.revokeObjectURL(i.url); }); imgs = []; drawList(); });

    // results from other tools land in "images → PDF"
    FLOW.pdf = function (f) {
      root.querySelector('.tt[data-tab="i2p"]').click();
      imgs.push({ name: f.name || 'image.png', url: URL.createObjectURL(f), file: f, kind: 'image', ext: 'PNG' });
      drawList();
    };

    function toEmbeddable(it) { // webp, gif, heic, tiff, svg… → png via canvas
      if (window.GFile && !/^image\/(png|jpe?g)$/i.test(it.file.type)) return GFile.imageCanvases(it.file).then(function (cs) {
        return canvasBlob(cs[0], 'image/png').then(function (b) { return b.arrayBuffer(); }).then(function (b) { return { bytes: b, png: true }; });
      });
      if (/png|jpe?g/i.test(it.file.type)) return it.file.arrayBuffer().then(function (b) { return { bytes: b, png: /png/i.test(it.file.type) }; });
      return new Promise(function (res, rej) {
        var im = new Image();
        im.onload = function () {
          var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
          c.getContext('2d').drawImage(im, 0, 0);
          canvasBlob(c, 'image/png').then(function (b) { return b.arrayBuffer(); }).then(function (b) { res({ bytes: b, png: true }); });
        };
        im.onerror = rej; im.src = it.url;
      });
    }

    makeBtn.addEventListener('click', function () {
      if (!imgs.length) return;
      makeBtn.disabled = true; st2.textContent = 'PDF үүсгэж байна…';
      var pageOpt = $('[data-opt="page"]').value, margin = +$('[data-opt="margin"]').value;
      loadPdfLib().then(function (L) {
        return L.PDFDocument.create().then(function (doc) {
          var chain = Promise.resolve();
          imgs.forEach(function (it, k) {
            chain = chain.then(function () {
              st2.textContent = 'Файл ' + (k + 1) + ' / ' + imgs.length + '…';
              if (window.GFile && !/^(image|svg|heic|tiff)$/.test(it.kind)) {
                // documents (PDF, Word, Excel, text…) keep their own pages
                return GFile.toPdf(it.file).then(function (bytes) { return L.PDFDocument.load(bytes, { ignoreEncryption: true }); })
                  .then(function (src) { return doc.copyPages(src, src.getPageIndices()); })
                  .then(function (ps) { ps.forEach(function (pg) { doc.addPage(pg); }); });
              }
              return toEmbeddable(it).then(function (e) { return e.png ? doc.embedPng(e.bytes) : doc.embedJpg(e.bytes); })
                .then(function (img) {
                  var W, H;
                  if (pageOpt === 'a4') { W = 595.28; H = 841.89; }
                  else if (pageOpt === 'a4l') { W = 841.89; H = 595.28; }
                  else { W = img.width + margin * 2; H = img.height + margin * 2; }
                  var page = doc.addPage([W, H]);
                  var s = Math.min((W - margin * 2) / img.width, (H - margin * 2) / img.height);
                  if (pageOpt === 'fit') s = 1;
                  var w = img.width * s, h = img.height * s;
                  page.drawImage(img, { x: (W - w) / 2, y: (H - h) / 2, width: w, height: h });
                });
            });
          });
          return chain.then(function () { return doc.save(); });
        });
      }).then(function (bytes) {
        var name = (imgs.length === 1 ? baseName(imgs[0].name) : 'graphican-files') + '.pdf';
        saveBlob(name, new Blob([bytes], { type: 'application/pdf' }));
        st2.textContent = imgs.length + ' файлаас PDF үүсэж татагдлаа.'; toast(name + ' татагдлаа');
      }).catch(function (e) { console.error(e); st2.textContent = 'PDF үүсгэхэд алдаа гарлаа' + (e && e.message ? ': ' + e.message : '') + '. Өөр файл туршаад үзээрэй.'; })
        .then(function () { makeBtn.disabled = !imgs.length; });
    });
  }

  // ---------- shared: pick one image via drop zone ----------

  function wireImageDrop(drop, onImage) {
    var inp = drop.querySelector('input');
    function pick(f) {
      if (!f || !/^image\/(png|jpe?g|webp)$/i.test(f.type)) { toast('PNG, JPG эсвэл WebP зураг сонгоно уу'); return; }
      var url = URL.createObjectURL(f), img = new Image();
      img.onload = function () { onImage(img, f, url); };
      img.onerror = function () { toast('Зургийг уншиж чадсангүй'); };
      img.src = url;
    }
    inp.addEventListener('change', function () { if (inp.files[0]) pick(inp.files[0]); inp.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]); });
    return pick;
  }

  // ---------- AI background remover (U²-Net-P via ONNX Runtime Web, runs in the browser) ----------

  var ORT_VER = '1.30.0';
  var ORT_BASE = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@' + ORT_VER + '/dist/';

  function bgSection(b) {
    return (
      '<section class="sec bgremove" id="bgremove">' + head(b) + toolGuide('bgremove') +
        '<div class="tool reveal">' +
          '<label class="drop" data-drop="bg">' +
            '<input type="file" accept="image/png,image/jpeg,image/webp" hidden>' +
            '<span class="drop-ic" aria-hidden="true">BG</span>' +
            '<b>Зургаа энд чирж оруулна уу</b><span>PNG, JPG, WebP · эсвэл дарж сонгоно</span>' +
          '</label>' +
          '<div class="tool-opts">' +
            '<label><span>Ирмэг</span><select data-opt="edge"><option value="soft">Зөөлөн (үс, үслэг)</option><option value="mid" selected>Дунд</option><option value="hard">Хурц (бүтээгдэхүүн, лого)</option></select></label>' +
            '<label><span>Шинэ дэвсгэр</span><select data-opt="bgfill"><option value="none" selected>Тунгалаг (PNG)</option><option value="#ffffff">Цагаан</option><option value="#000000">Хар</option><option value="custom">Өөр өнгө…</option></select></label>' +
            '<label class="bg-color" hidden><span>Өнгө</span><input type="color" data-opt="bgcolor" value="#a497ff"></label>' +
            '<button type="button" class="btn solid" data-act="bg-run" disabled>Дэвсгэр арилгах ✦</button>' +
            '<button type="button" class="btn" data-act="bg-dl" disabled>Татах ↓</button>' +
          '</div>' +
          '<div class="up-progress" hidden><i></i></div>' +
          '<p class="tool-status" data-status="bg"></p>' +
          '<div class="compare" hidden>' +
            '<div class="cmp-wrap">' +
              '<img class="cmp-after" alt="Дэвсгэргүй">' +
              '<div class="cmp-before"><img alt="Анхны"></div>' +
              '<span class="cmp-line" aria-hidden="true"></span>' +
              '<span class="cmp-tag l">ӨМНӨ</span><span class="cmp-tag r">ДАРАА</span>' +
              '<input class="cmp-range" type="range" min="0" max="100" value="50" aria-label="Өмнө / дараа харьцуулах">' +
            '</div>' +
            '<p class="cmp-meta"></p>' +
          '</div>' +
          '<div class="flow" data-flow hidden></div>' +
        '</div>' +
        '<p class="tool-note reveal">✦ U²-Net хиймэл оюун (Apache-2.0) — хүн, бүтээгдэхүүн, амьтан гэх мэт тод гол объекттой зурагт хамгийн сайн ажиллана. Бүх боловсруулалт таны хөтөч дотор, файл серверт илгээгдэхгүй. Анх ашиглахад загвар (~5MB) нэг удаа ачаална.</p>' +
      '</section>'
    );
  }

  var rmbg = { session: null, ready: null };
  function rmbgReady() {
    if (rmbg.ready) return rmbg.ready;
    rmbg.ready = loadScript(ORT_BASE + 'ort.min.js').then(function () {
      var ort = window.ort;
      ort.env.wasm.wasmPaths = ORT_BASE;
      ort.env.wasm.numThreads = window.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
      return ort.InferenceSession.create('/assets/vendor/u2netp.onnx', { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    }).then(function (s) { rmbg.session = s; });
    rmbg.ready.catch(function () { rmbg.ready = null; });
    return rmbg.ready;
  }

  // → Float32Array mask (320×320, 0..1)
  function rmbgMask(img) {
    var S = 320, c = document.createElement('canvas');
    c.width = S; c.height = S;
    var cx = c.getContext('2d');
    cx.drawImage(img, 0, 0, S, S);
    var px = cx.getImageData(0, 0, S, S).data, n = S * S;
    var max = 1;
    for (var i = 0; i < n * 4; i++) if ((i & 3) !== 3 && px[i] > max) max = px[i];
    var mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
    var data = new Float32Array(3 * n);
    for (var p = 0; p < n; p++) {
      for (var k = 0; k < 3; k++) data[k * n + p] = (px[p * 4 + k] / max - mean[k]) / std[k];
    }
    var ort = window.ort, s = rmbg.session, feeds = {};
    feeds[s.inputNames[0]] = new ort.Tensor('float32', data, [1, 3, S, S]);
    return s.run(feeds).then(function (out) {
      var m = out[s.outputNames[0]].data, lo = Infinity, hi = -Infinity, j;
      for (j = 0; j < n; j++) { if (m[j] < lo) lo = m[j]; if (m[j] > hi) hi = m[j]; }
      var r = new Float32Array(n), span = (hi - lo) || 1;
      for (j = 0; j < n; j++) r[j] = (m[j] - lo) / span;
      return r;
    });
  }

  // mask → full-size cut-out canvas (optionally over a solid colour)
  function rmbgCompose(img, mask, edge, fill) {
    var S = 320, W = img.naturalWidth, H = img.naturalHeight;
    var mc = document.createElement('canvas'); mc.width = S; mc.height = S;
    var mctx = mc.getContext('2d'), md = mctx.createImageData(S, S);
    var curve = { soft: [0.05, 0.95], mid: [0.2, 0.8], hard: [0.4, 0.6] }[edge] || [0.2, 0.8];
    for (var i = 0; i < S * S; i++) {
      var a = (mask[i] - curve[0]) / (curve[1] - curve[0]);
      md.data[i * 4 + 3] = a <= 0 ? 0 : a >= 1 ? 255 : Math.round(a * 255);
    }
    mctx.putImageData(md, 0, 0);
    // upscale the mask smoothly to the photo size
    var am = document.createElement('canvas'); am.width = W; am.height = H;
    var actx = am.getContext('2d'); actx.imageSmoothingEnabled = true; actx.imageSmoothingQuality = 'high';
    actx.drawImage(mc, 0, 0, W, H);
    // cut the photo with it
    var out = document.createElement('canvas'); out.width = W; out.height = H;
    var o = out.getContext('2d');
    o.drawImage(img, 0, 0, W, H);
    o.globalCompositeOperation = 'destination-in';
    o.drawImage(am, 0, 0);
    o.globalCompositeOperation = 'source-over';
    if (fill && fill !== 'none') {
      var f = document.createElement('canvas'); f.width = W; f.height = H;
      var fx2 = f.getContext('2d'); fx2.fillStyle = fill; fx2.fillRect(0, 0, W, H); fx2.drawImage(out, 0, 0);
      return f;
    }
    return out;
  }

  function setupBgRemove() {
    var root = document.getElementById('bgremove');
    if (!root) return;
    function $(s) { return root.querySelector(s); }
    var runBtn = $('[data-act="bg-run"]'), dlBtn = $('[data-act="bg-dl"]'), st = $('[data-status="bg"]');
    var bar = $('.up-progress'), barI = bar.querySelector('i');
    var cmp = $('.compare'), after = $('.cmp-after'), before = $('.cmp-before img'), beforeWrap = $('.cmp-before'), line = $('.cmp-line'), range = $('.cmp-range'), meta = $('.cmp-meta');
    var fillSel = $('[data-opt="bgfill"]'), colorWrap = $('.bg-color'), colorInp = $('[data-opt="bgcolor"]'), edgeSel = $('[data-opt="edge"]');
    var file = null, srcImg = null, mask = null, result = null, busy = false;

    function setSplit(v) { beforeWrap.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)'; line.style.left = v + '%'; }
    range.addEventListener('input', function () { setSplit(+range.value); });

    function fill() { return fillSel.value === 'custom' ? colorInp.value : fillSel.value; }
    function render() {
      if (!mask) return;
      result = rmbgCompose(srcImg, mask, edgeSel.value, fill());
      after.src = result.toDataURL('image/png');
    }
    fillSel.addEventListener('change', function () { colorWrap.hidden = fillSel.value !== 'custom'; render(); });
    colorInp.addEventListener('input', render);
    edgeSel.addEventListener('change', render);

    FLOW.bgremove = wireImageDrop($('[data-drop="bg"]'), function (img, f, url) {
      file = f; srcImg = img; mask = null; result = null; dlBtn.disabled = true; $('[data-flow]').hidden = true;
      before.src = url; after.src = url; cmp.hidden = false; setSplit(50); range.value = 50;
      meta.textContent = img.naturalWidth + ' × ' + img.naturalHeight + ' px';
      runBtn.disabled = false;
      st.textContent = 'Бэлэн. "Дэвсгэр арилгах" дарна уу.';
    });

    runBtn.addEventListener('click', function () {
      if (!srcImg || busy) return;
      busy = true; runBtn.disabled = true; dlBtn.disabled = true;
      bar.hidden = false; barI.style.width = '15%';
      st.textContent = 'AI загвар ачаалж байна…';
      var t0 = performance.now();
      rmbgReady().then(function () {
        barI.style.width = '55%'; st.textContent = 'Дэвсгэрийг илрүүлж байна…';
        return new Promise(function (r) { setTimeout(r, 30); }).then(function () { return rmbgMask(srcImg); });
      }).then(function (m) {
        mask = m; render();
        barI.style.width = '100%';
        meta.textContent = srcImg.naturalWidth + ' × ' + srcImg.naturalHeight + ' px · ' + ((performance.now() - t0) / 1000).toFixed(1) + ' сек';
        st.textContent = 'Болсон! Ирмэг, дэвсгэрийн өнгийг сольж үзээд татаж аваарай.';
        dlBtn.disabled = false;
        flowRow($('[data-flow]'), 'bgremove', function () {
          var base = file ? file.name.replace(/\.[^.]+$/, '') : 'image';
          return fill() === 'none' ? canvasToPng(result, base + '-no-bg.png')
            : new Promise(function (res) { result.toBlob(function (b) { res({ blob: b, name: base + '-no-bg.jpg' }); }, 'image/jpeg', .95); });
        });
        setTimeout(function () { bar.hidden = true; }, 600);
      }).catch(function (e) {
        console.error(e); bar.hidden = true;
        st.textContent = 'Алдаа гарлаа. Интернэт холболтоо шалгаад дахин оролдоно уу.';
      }).then(function () { busy = false; runBtn.disabled = !srcImg; });
    });

    dlBtn.addEventListener('click', function () {
      if (!result) return;
      var transparent = fill() === 'none';
      var name = (file ? file.name.replace(/\.[^.]+$/, '') : 'image') + '-no-bg.' + (transparent ? 'png' : 'jpg');
      result.toBlob(function (b) { saveBlob(name, b); toast(name + ' татагдлаа'); }, transparent ? 'image/png' : 'image/jpeg', .95);
    });
  }

  // ---------- social media smart crop (smartcrop.js) ----------

  var SOCIAL_SIZES = [
    { id: 'ig45', name: 'Instagram пост', ratio: '4:5', w: 1080, h: 1350, on: true },
    { id: 'ig11', name: 'Instagram квадрат', ratio: '1:1', w: 1080, h: 1080, on: true },
    { id: 'story', name: 'Story / Reels', ratio: '9:16', w: 1080, h: 1920, on: true },
    { id: 'fbpost', name: 'Facebook пост', ratio: '1.91:1', w: 1200, h: 630, on: true },
    { id: 'fbcover', name: 'Facebook cover', ratio: '2.63:1', w: 1640, h: 624, on: false },
    { id: 'yt', name: 'YouTube thumbnail', ratio: '16:9', w: 1280, h: 720, on: false },
    { id: 'li', name: 'LinkedIn пост', ratio: '1.91:1', w: 1200, h: 627, on: false },
    { id: 'x', name: 'X (Twitter) пост', ratio: '16:9', w: 1600, h: 900, on: false }
  ];

  function cropSection(c) {
    var checks = SOCIAL_SIZES.map(function (s) {
      return '<label class="sz"><input type="checkbox" value="' + s.id + '"' + (s.on ? ' checked' : '') + '><span><b>' + esc(s.name) + '</b><i>' + s.w + '×' + s.h + ' · ' + s.ratio + '</i></span></label>';
    }).join('');
    return (
      '<section class="sec socialcrop" id="socialcrop">' + head(c) + toolGuide('socialcrop') +
        '<div class="tool reveal">' +
          '<label class="drop" data-drop="sc">' +
            '<input type="file" accept="image/png,image/jpeg,image/webp" hidden>' +
            '<span class="drop-ic" aria-hidden="true">✂</span>' +
            '<b>Зургаа энд чирж оруулна уу</b><span>PNG, JPG, WebP · эсвэл дарж сонгоно</span>' +
          '</label>' +
          '<div class="sz-list">' + checks + '</div>' +
          '<div class="tool-opts">' +
            '<label><span>Арга</span><select data-opt="scmode"><option value="crop" selected>Ухаалаг тайралт</option><option value="fit">Бүтнээр нь багтаах + бүдэг дэвсгэр</option></select></label>' +
            '<label><span>Формат</span><select data-opt="scfmt"><option value="jpg" selected>JPG</option><option value="png">PNG</option></select></label>' +
            '<button type="button" class="btn solid" data-act="sc-zip" disabled>Бүгдийг ZIP-ээр татах ↓</button>' +
          '</div>' +
          '<p class="tool-status" data-status="sc"></p>' +
          '<div class="sc-grid"></div>' +
          '<div class="flow" data-flow="sc" hidden></div>' +
        '</div>' +
        '<p class="tool-note reveal">✦ Зургийн хамгийн чухал хэсгийг (нүүр, объект, тод хэсэг) автоматаар олж тайрна. Тайралт таарахгүй бол зураг дээр чирж байрлалыг нь засна. Бүх боловсруулалт таны хөтөч дотор.</p>' +
      '</section>'
    );
  }

  function setupSocialCrop() {
    var root = document.getElementById('socialcrop');
    if (!root) return;
    function $(s) { return root.querySelector(s); }
    var grid = $('.sc-grid'), st = $('[data-status="sc"]'), zipBtn = $('[data-act="sc-zip"]');
    var modeSel = $('[data-opt="scmode"]'), fmtSel = $('[data-opt="scfmt"]');
    var file = null, srcImg = null, crops = {}, gen = 0;

    function selected() {
      var on = Array.from(root.querySelectorAll('.sz input:checked')).map(function (i) { return i.value; });
      return SOCIAL_SIZES.filter(function (s) { return on.indexOf(s.id) >= 0; });
    }
    function baseName() { return file ? file.name.replace(/\.[^.]+$/, '') : 'image'; }

    // draw one output at full target size
    function renderFull(s) {
      var c = document.createElement('canvas'); c.width = s.w; c.height = s.h;
      var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      var W = srcImg.naturalWidth, H = srcImg.naturalHeight;
      if (modeSel.value === 'fit') {
        var cover = Math.max(s.w / W, s.h / H), fit = Math.min(s.w / W, s.h / H);
        x.filter = 'blur(' + Math.round(Math.max(s.w, s.h) / 40) + 'px) brightness(.7)';
        x.drawImage(srcImg, (s.w - W * cover) / 2, (s.h - H * cover) / 2, W * cover, H * cover);
        x.filter = 'none';
        x.drawImage(srcImg, (s.w - W * fit) / 2, (s.h - H * fit) / 2, W * fit, H * fit);
      } else {
        var r = crops[s.id];
        x.drawImage(srcImg, r.x, r.y, r.width, r.height, 0, 0, s.w, s.h);
      }
      return c;
    }

    function tile(s) {
      var el = document.createElement('figure');
      el.className = 'sc-item';
      el.innerHTML =
        '<div class="sc-frame" style="aspect-ratio:' + s.w + '/' + s.h + '"><canvas></canvas>' +
          (modeSel.value === 'crop' ? '<span class="sc-hint">⇆ чирж засна</span>' : '') + '</div>' +
        '<figcaption><span><b>' + esc(s.name) + '</b><i>' + s.w + '×' + s.h + '</i></span><span class="sc-acts"><button type="button" class="btn" data-go="' + s.id + '" title="Өөр хэрэгсэл рүү" aria-label="' + esc(s.name) + ' — өөр хэрэгсэл рүү илгээх">→</button><button type="button" class="btn" data-dl="' + s.id + '" aria-label="' + esc(s.name) + ' татах">↓</button></span></figcaption>';
      var cv = el.querySelector('canvas');
      function draw() {
        var full = renderFull(s);
        var k = Math.min(1, 480 / Math.max(s.w, s.h));
        cv.width = Math.round(s.w * k); cv.height = Math.round(s.h * k);
        cv.getContext('2d').drawImage(full, 0, 0, cv.width, cv.height);
      }
      draw();
      if (modeSel.value === 'crop') {
        // drag to pan the crop window inside the photo
        var frame = el.querySelector('.sc-frame'), start = null;
        frame.addEventListener('pointerdown', function (e) {
          start = { x: e.clientX, y: e.clientY, cx: crops[s.id].x, cy: crops[s.id].y, k: crops[s.id].width / frame.clientWidth };
          frame.setPointerCapture(e.pointerId); frame.classList.add('dragging');
        });
        frame.addEventListener('pointermove', function (e) {
          if (!start) return;
          var r = crops[s.id], W = srcImg.naturalWidth, H = srcImg.naturalHeight;
          r.x = Math.max(0, Math.min(W - r.width, start.cx - (e.clientX - start.x) * start.k));
          r.y = Math.max(0, Math.min(H - r.height, start.cy - (e.clientY - start.y) * start.k));
          draw();
        });
        ['pointerup', 'pointercancel'].forEach(function (ev) { frame.addEventListener(ev, function () { start = null; frame.classList.remove('dragging'); }); });
      }
      el.querySelector('[data-dl]').addEventListener('click', function () {
        var png = fmtSel.value === 'png', name = baseName() + '-' + s.id + '-' + s.w + 'x' + s.h + (png ? '.png' : '.jpg');
        renderFull(s).toBlob(function (b) { saveBlob(name, b); toast(name + ' татагдлаа'); }, png ? 'image/png' : 'image/jpeg', .92);
      });
      el.querySelector('[data-go]').addEventListener('click', function () {
        var box = $('[data-flow="sc"]');
        flowRow(box, 'socialcrop', function () { return canvasToPng(renderFull(s), baseName() + '-' + s.id + '-' + s.w + 'x' + s.h + '.png'); }, s.name + ' →');
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
      return el;
    }

    function build() {
      if (!srcImg) return;
      var my = ++gen, sizes = selected();
      grid.innerHTML = '';
      zipBtn.disabled = !sizes.length;
      if (!sizes.length) { st.textContent = 'Дор хаяж нэг хэмжээ сонгоно уу.'; return; }
      st.textContent = 'Чухал хэсгийг олж байна…';
      var need = modeSel.value === 'crop' ? sizes.filter(function (s) { return !crops[s.id]; }) : [];
      var chain = need.length ? loadScript('https://cdn.jsdelivr.net/npm/smartcrop@2.0.5/smartcrop.js') : Promise.resolve();
      chain.then(function () {
        return need.reduce(function (p, s) {
          return p.then(function () {
            return window.smartcrop.crop(srcImg, { width: s.w, height: s.h, minScale: 1 }).then(function (res) { crops[s.id] = res.topCrop; });
          });
        }, Promise.resolve());
      }).then(function () {
        if (my !== gen) return;
        sizes.forEach(function (s) { grid.appendChild(tile(s)); });
        st.textContent = sizes.length + ' хэмжээ бэлэн. Тус бүрийг ↓ эсвэл бүгдийг ZIP-ээр татна.';
      }).catch(function (e) {
        console.error(e);
        st.textContent = 'Алдаа гарлаа. Интернэт холболтоо шалгаад дахин оролдоно уу.';
      });
    }

    FLOW.socialcrop = wireImageDrop($('[data-drop="sc"]'), function (img, f) { file = f; srcImg = img; crops = {}; $('[data-flow="sc"]').hidden = true; build(); });
    root.querySelectorAll('.sz input').forEach(function (i) { i.addEventListener('change', build); });
    modeSel.addEventListener('change', build);

    zipBtn.addEventListener('click', function () {
      var sizes = selected();
      if (!srcImg || !sizes.length) return;
      var png = fmtSel.value === 'png';
      toast('ZIP бэлтгэж байна…');
      Promise.all(sizes.map(function (s) {
        return new Promise(function (res) { renderFull(s).toBlob(res, png ? 'image/png' : 'image/jpeg', .92); })
          .then(function (b) { return b.arrayBuffer(); })
          .then(function (buf) { return { name: baseName() + '-' + s.id + '-' + s.w + 'x' + s.h + (png ? '.png' : '.jpg'), data: new Uint8Array(buf) }; });
      })).then(function (files) {
        saveBlob(baseName() + '-social.zip', makeZip(files));
        toast(files.length + ' зураг ZIP-ээр татагдлаа');
      });
    });
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
    // hand the chosen pair + palette to the editor (it reads gc-editor-prefs on load)
    document.getElementById('to-editor').addEventListener('click', function () {
      var c = current();
      try {
        localStorage.setItem('gc-editor-prefs', JSON.stringify({
          pair: { heading: c.pair.heading, body: c.pair.body },
          palette: { name: c.pal.name, colors: list(c.pal.colors).map(function (x) { return x.hex; }) },
          fresh: true
        }));
      } catch (err) {}
      location.href = '/editor/';
    });
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

  // /design/ = fonts, colours, starter kit, brand guide
  // /tools/ = tool picker · /tools/<id>/ = one tool per page
  var toolMatch = location.pathname.match(/^\/tools\/(upscale|bgremove|socialcrop|pdf)\/?$/);
  var TOOL = toolMatch ? toolMatch[1] : null;
  var PAGE = TOOL ? 'tool' : /^\/tools(\/|$)/.test(location.pathname) ? 'tools' : 'guide';

  // an image sent from the editor or another tool opens in this page's tool
  function receiveHandoff() {
    if (!window.GHandoff || !TOOL) return;
    window.GHandoff.take().then(function (h) {
      if (!h || !h.blob || !FLOW[TOOL]) return;
      setTimeout(function () { FLOW[TOOL](blobToFile(h.blob, h.name || 'image.png')); toast('Зураг орлоо'); }, 200);
    });
  }

  var TOOL_VIEWS = {
    upscale: { key: 'upscale', view: function (d) { return upscaleSection(d.upscale || {}); }, setup: function () { setupUpscale(); } },
    bgremove: { key: 'bgremove', view: function (d) { return bgSection(d.bgremove || {}); }, setup: function () { setupBgRemove(); } },
    socialcrop: { key: 'socialcrop', view: function (d) { return cropSection(d.socialcrop || {}); }, setup: function () { setupSocialCrop(); } },
    pdf: { key: 'tools', view: function (d) { return tools(d.tools || {}); }, setup: function () { setupTools(); } }
  };

  var app = document.getElementById('app');
  fetch('/content/design.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (d.seo) {
        if (d.seo.title) document.title = d.seo.title;
        var m = document.querySelector('meta[name="description"]');
        if (m && d.seo.description) m.setAttribute('content', d.seo.description);
      }
      if (PAGE === 'tools') {
        var th = d.tools_hero || {};
        if (th.seo_title) document.title = th.seo_title;
        var md = document.querySelector('meta[name="description"]');
        if (md && th.seo_description) md.setAttribute('content', th.seo_description);
        app.innerHTML = hero(th, 'tools') + toolPicker() + footer();
        enhance();
      } else if (PAGE === 'tool') {
        var tv = TOOL_VIEWS[TOOL], sd = d[tv.key] || {};
        document.title = String(sd.title || toolInfo(TOOL).name).replace(/\.$/, '') + ' — Design tools | Graphican';
        var mt = document.querySelector('meta[name="description"]');
        if (mt && sd.description) mt.setAttribute('content', sd.description);
        app.innerHTML = toolCrumb(TOOL) + tv.view(d) + otherTools(TOOL) + footer();
        enhance();
        tv.setup();
        receiveHandoff();
      } else {
        app.innerHTML = hero(d.hero || {}, 'guide') + fonts(d.fonts || {}) + palettes(d.palettes || {}) +
          builder(d.builder || {}) + guide(d.guide || {}) + footer();
        enhance();
        setupKit(d);
      }
    })
    .catch(function (err) {
      console.error(err);
      app.innerHTML = '<p class="load-error">Контент ачаалж чадсангүй. Хуудсаа дахин ачаална уу.</p>';
    });
})();
