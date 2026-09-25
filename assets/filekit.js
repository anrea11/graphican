/* Graphican filekit — open almost any file in the browser and turn it into PDF pages.
   Images: PNG JPG WebP GIF BMP AVIF ICO SVG HEIC/HEIF TIFF
   Documents: PDF DOCX XLSX XLS ODS CSV TSV TXT MD HTML
   Everything runs locally; libraries load on demand from /assets/vendor. */
(function () {
  'use strict';

  var V = '/assets/vendor/';
  var scripts = {};
  function loadScript(src) {
    if (!scripts[src]) scripts[src] = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = function () { res(); };
      s.onerror = function () { delete scripts[src]; rej(new Error('Сан ачаалж чадсангүй: ' + src)); };
      document.head.appendChild(s);
    });
    return scripts[src];
  }
  var pdfjsP = null;
  function pdfjs() {
    if (!pdfjsP) pdfjsP = import(V + 'pdf.min.mjs').then(function (m) {
      m.GlobalWorkerOptions.workerSrc = V + 'pdf.worker.min.mjs';
      return m;
    });
    return pdfjsP;
  }
  function pdfLib() {
    return Promise.all([loadScript(V + 'pdf-lib.min.js'), loadScript(V + 'fontkit.min.js')]).then(function () { return window.PDFLib; });
  }

  // ---------- fonts (TTF with full Cyrillic incl. Ө Ү) ----------
  // Latin + Cyrillic subsets of the OFL fonts in /assets/fonts/files (small enough to embed whole)
  var FONTS = {
    Inter: '/assets/fonts/pdf/Inter-',
    Roboto: '/assets/fonts/pdf/Roboto-',
    Montserrat: '/assets/fonts/pdf/Montserrat-',
    Lora: '/assets/fonts/pdf/Lora-'
  };

  var fontBytes = {};
  function fontData(family, bold) {
    var url = (FONTS[family] || FONTS.Inter) + (bold ? 'Bold' : 'Regular') + '.ttf';
    if (!fontBytes[url]) fontBytes[url] = fetch(url).then(function (r) {
      if (!r.ok) throw new Error('font ' + r.status);
      return r.arrayBuffer();
    });
    return fontBytes[url];
  }
  // one embed per (doc, family, weight)
  function embedFont(doc, family, bold) {
    doc.__gfonts = doc.__gfonts || {};
    var k = family + (bold ? 'B' : 'R');
    if (!doc.__gfonts[k]) {
      if (!doc.__fk) { doc.registerFontkit(window.fontkit); doc.__fk = 1; }
      doc.__gfonts[k] = fontData(family, bold).then(function (b) { return doc.embedFont(b, { subset: false }); });
    }
    return doc.__gfonts[k];
  }
  // screen fonts identical to the embedded ones, so on-screen metrics == PDF metrics
  var faceP = {};
  function screenFont(family, bold) {
    var k = family + (bold ? 'B' : 'R');
    if (!faceP[k]) faceP[k] = fontData(family, bold).then(function (b) {
      var f = new FontFace('G' + family, b, { weight: bold ? '700' : '400' });
      document.fonts.add(f);
      return f.load();
    }).catch(function () {});
    return faceP[k];
  }

  // ---------- file type detection ----------
  var EXT = {
    pdf: 'pdf',
    png: 'image', jpg: 'image', jpeg: 'image', jfif: 'image', webp: 'image', gif: 'image', bmp: 'image', avif: 'image', ico: 'image',
    svg: 'svg', heic: 'heic', heif: 'heic', tif: 'tiff', tiff: 'tiff',
    docx: 'docx', xlsx: 'sheet', xlsm: 'sheet', xls: 'sheet', ods: 'sheet', csv: 'csv', tsv: 'csv',
    txt: 'text', text: 'text', log: 'text', json: 'text', xml: 'text', md: 'md', markdown: 'md', html: 'html', htm: 'html'
  };
  var UNSUPPORTED = {
    doc: 'Хуучин .doc форматыг унших боломжгүй. Word дээр «Save as → .docx» эсвэл PDF болгоод оруулна уу.',
    ppt: 'PowerPoint файлыг PowerPoint эсвэл Google Slides дээр «PDF болгож хадгалаад» оруулна уу.',
    pptx: 'PowerPoint файлыг PowerPoint эсвэл Google Slides дээр «PDF болгож хадгалаад» оруулна уу.',
    key: 'Keynote файлыг «Export → PDF» хийгээд оруулна уу.',
    pages: 'Pages файлыг «Export → PDF» хийгээд оруулна уу.',
    psd: 'PSD файлыг Photoshop дээр PNG/JPG болгож хадгалаад оруулна уу.',
    ai: 'AI файлыг Illustrator дээр PDF болгож хадгалаад оруулна уу.',
    eps: 'EPS файлыг PDF эсвэл PNG болгоод оруулна уу.'
  };
  function ext(f) { var m = /\.([a-z0-9]+)$/i.exec(f.name || ''); return m ? m[1].toLowerCase() : ''; }
  function kind(f) {
    var e = ext(f), t = (f.type || '').toLowerCase();
    if (EXT[e]) return EXT[e];
    if (t === 'application/pdf') return 'pdf';
    if (t === 'image/svg+xml') return 'svg';
    if (/image\/hei[cf]/.test(t)) return 'heic';
    if (t === 'image/tiff') return 'tiff';
    if (/^image\//.test(t)) return 'image';
    if (/wordprocessingml/.test(t)) return 'docx';
    if (/spreadsheetml|ms-excel|opendocument\.spreadsheet/.test(t)) return 'sheet';
    if (t === 'text/csv') return 'csv';
    if (t === 'text/html') return 'html';
    if (t === 'text/markdown') return 'md';
    if (/^text\//.test(t)) return 'text';
    return null;
  }
  function whyNot(f) { return UNSUPPORTED[ext(f)] || ('«' + (f.name || 'файл') + '» төрлийн файлыг унших боломжгүй.'); }
  var ACCEPT = '.pdf,.png,.jpg,.jpeg,.jfif,.webp,.gif,.bmp,.avif,.ico,.svg,.heic,.heif,.tif,.tiff,.docx,.xlsx,.xlsm,.xls,.ods,.csv,.tsv,.txt,.md,.markdown,.html,.htm,.json,.xml,' +
    'application/pdf,image/*,text/*';
  var IMG_ACCEPT = '.png,.jpg,.jpeg,.jfif,.webp,.gif,.bmp,.avif,.ico,.svg,.heic,.heif,.tif,.tiff,image/*';
  var LABEL = 'PDF · Word (DOCX) · Excel (XLSX, CSV) · TXT · Markdown · HTML · PNG · JPG · WebP · GIF · BMP · SVG · HEIC · TIFF';

  function readBuf(f) { return f.arrayBuffer ? f.arrayBuffer() : new Response(f).arrayBuffer(); }
  function readText(f) { return f.text ? f.text() : new Response(f).text(); }

  // ---------- images → canvases ----------
  function imgFromUrl(url) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error('Зургийг уншиж чадсангүй')); };
      im.src = url;
    });
  }
  function toCanvas(src, w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c;
  }
  function decodeRaster(blob) {
    // createImageBitmap applies EXIF orientation (phone photos come out upright)
    if (window.createImageBitmap) {
      return createImageBitmap(blob, { imageOrientation: 'from-image' }).then(function (b) {
        var c = toCanvas(b, b.width, b.height); b.close && b.close(); return c;
      }).catch(function () { return viaImg(); });
    }
    return viaImg();
    function viaImg() {
      var u = URL.createObjectURL(blob);
      return imgFromUrl(u).then(function (im) { URL.revokeObjectURL(u); return toCanvas(im, im.naturalWidth, im.naturalHeight); },
        function (e) { URL.revokeObjectURL(u); throw e; });
    }
  }
  function decodeSvg(f) {
    return readText(f).then(function (txt) {
      var doc = new DOMParser().parseFromString(txt, 'image/svg+xml');
      var s = doc.documentElement, w = parseFloat(s.getAttribute('width')), h = parseFloat(s.getAttribute('height'));
      var vb = (s.getAttribute('viewBox') || '').split(/[\s,]+/).map(parseFloat);
      if (!(w > 0 && h > 0)) { w = vb[2] || 800; h = vb[3] || 800; }
      var k = Math.min(4, 2400 / Math.max(w, h)); // render crisp
      k = Math.max(k, 1);
      s.setAttribute('width', w * k); s.setAttribute('height', h * k);
      var u = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(s)], { type: 'image/svg+xml' }));
      return imgFromUrl(u).then(function (im) { URL.revokeObjectURL(u); var c = toCanvas(im, w * k, h * k); c.ptW = w; c.ptH = h; return [c]; });
    });
  }
  function decodeHeic(f) {
    return loadScript(V + 'heic2any.min.js').then(function () {
      return window.heic2any({ blob: f, toType: 'image/jpeg', quality: 0.92, multiple: true });
    }).then(function (out) {
      return Promise.all([].concat(out).map(decodeRaster));
    });
  }
  function decodeTiff(f) {
    return Promise.all([loadScript(V + 'pako-inflate.min.js')]).then(function () { return loadScript(V + 'utif.js'); })
      .then(function () { return readBuf(f); })
      .then(function (buf) {
        var U = window.UTIF, ifds = U.decode(buf), out = [];
        ifds.forEach(function (ifd) {
          if (!ifd.t256 || !ifd.t257) return; // not an image (EXIF etc.)
          try {
            U.decodeImage(buf, ifd);
            var rgba = U.toRGBA8(ifd), c = document.createElement('canvas');
            c.width = ifd.width; c.height = ifd.height;
            var id = c.getContext('2d').createImageData(ifd.width, ifd.height);
            id.data.set(rgba); c.getContext('2d').putImageData(id, 0, 0);
            out.push(c);
          } catch (e) { /* skip unreadable page */ }
        });
        if (!out.length) throw new Error('TIFF файлыг уншиж чадсангүй');
        return out;
      });
  }
  // any image-like file → array of canvases (TIFF / HEIC can hold several)
  function imageCanvases(f) {
    var k = kind(f);
    if (k === 'svg') return decodeSvg(f);
    if (k === 'heic') return decodeHeic(f);
    if (k === 'tiff') return decodeTiff(f);
    return decodeRaster(f).then(function (c) { return [c]; });
  }
  function hasAlpha(c) {
    var w = Math.min(c.width, 256), h = Math.min(c.height, 256);
    var s = toCanvas(c, w, h), d = s.getContext('2d').getImageData(0, 0, w, h).data;
    for (var i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
    return false;
  }
  function canvasBytes(c, type, q) {
    return new Promise(function (res) { c.toBlob(function (b) { res(b.arrayBuffer()); }, type, q); });
  }
  // embed a canvas into a pdf-lib doc (JPEG unless it has transparency)
  function embedCanvas(doc, c) {
    var png = hasAlpha(c);
    return canvasBytes(c, png ? 'image/png' : 'image/jpeg', 0.92).then(function (b) { return png ? doc.embedPng(b) : doc.embedJpg(b); });
  }

  // ---------- documents → blocks ----------
  // block: {t:'h',lv,runs} {t:'p',runs,ind,bul} {t:'pre',text} {t:'table',rows:[[runs]],head} {t:'img',src} {t:'hr'} {t:'pb'}
  // run: {text,b,i,u,a}
  function htmlToBlocks(root) {
    var blocks = [];
    var BLOCK = /^(P|DIV|H[1-6]|UL|OL|LI|TABLE|PRE|BLOCKQUOTE|HR|IMG|SECTION|ARTICLE|HEADER|FOOTER|MAIN|NAV|ASIDE|FIGURE|FIGCAPTION|DL|DT|DD|ADDRESS|CENTER)$/;
    function runsOf(node, st, out) {
      out = out || [];
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) {
          var t = n.nodeValue.replace(/\s+/g, ' ');
          if (t) out.push({ text: t, b: st.b, i: st.i, u: st.u, a: st.a });
        } else if (n.nodeType === 1) {
          var tag = n.tagName;
          if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|HEAD|TITLE|META|LINK)$/.test(tag)) return;
          if (tag === 'BR') { out.push({ text: '\n' }); return; }
          if (tag === 'IMG') return;
          var s2 = { b: st.b || /^(B|STRONG|TH)$/.test(tag) || /bold|[6-9]00/.test(n.style && n.style.fontWeight || ''),
            i: st.i || /^(I|EM)$/.test(tag), u: st.u || tag === 'U', a: st.a || tag === 'A' };
          runsOf(n, s2, out);
        }
      });
      return out;
    }
    function clean(runs) {
      // trim edges, drop empties
      while (runs.length && !runs[0].text.trim() && runs[0].text !== '\n') runs.shift();
      while (runs.length && !runs[runs.length - 1].text.trim()) runs.pop();
      if (runs.length) { runs[0].text = runs[0].text.replace(/^ +/, ''); runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/ +$/, ''); }
      return runs;
    }
    function hasBlockKids(n) { for (var i = 0; i < n.children.length; i++) if (BLOCK.test(n.children[i].tagName)) return true; return false; }
    function pushP(runs, ind, bul, extra) {
      runs = clean(runs);
      if (runs.length) blocks.push(Object.assign({ t: 'p', runs: runs, ind: ind || 0, bul: bul || '' }, extra || {}));
    }
    function walk(node, ind) {
      var inline = [];
      function flush() { if (inline.length) { pushP(inline, ind); inline = []; } }
      node.childNodes.forEach(function (n) {
        if (n.nodeType === 3) { if (n.nodeValue.trim()) inline.push({ text: n.nodeValue.replace(/\s+/g, ' ') }); return; }
        if (n.nodeType !== 1) return;
        var tag = n.tagName;
        if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|HEAD|TITLE|META|LINK|BUTTON|INPUT|SELECT|TEXTAREA|SVG|CANVAS|IFRAME)$/.test(tag)) return;
        if (!BLOCK.test(tag)) {
          if (n.querySelector && n.querySelector('img') && !n.textContent.trim()) { flush(); n.querySelectorAll('img').forEach(img); return; }
          if (hasBlockKids(n)) { flush(); walk(n, ind); return; }
          runsOf({ childNodes: [n] }, {}, inline); return;
        }
        flush();
        if (/^H[1-6]$/.test(tag)) { var r = clean(runsOf(n, { b: true })); if (r.length) blocks.push({ t: 'h', lv: +tag[1], runs: r }); return; }
        if (tag === 'HR') { blocks.push({ t: 'hr' }); return; }
        if (tag === 'IMG') { img(n); return; }
        if (tag === 'PRE') { blocks.push({ t: 'pre', text: n.textContent.replace(/\s+$/, '') }); return; }
        if (tag === 'UL' || tag === 'OL') {
          var k = parseInt(n.getAttribute('start') || '1', 10) || 1;
          [].forEach.call(n.children, function (li) {
            if (li.tagName !== 'LI') return;
            var own = document.createElement('div'), nested = [];
            li.childNodes.forEach(function (c) { if (c.nodeType === 1 && /^(UL|OL)$/.test(c.tagName)) nested.push(c); else own.appendChild(c.cloneNode(true)); });
            pushP(runsOf(own, {}), ind + 1, tag === 'OL' ? (k++) + '.' : '•');
            nested.forEach(function (c) { walk({ childNodes: [c] }, ind + 1); });
          });
          return;
        }
        if (tag === 'TABLE') {
          var rows = [];
          [].forEach.call(n.querySelectorAll('tr'), function (tr) {
            if (tr.closest('table') !== n) return;
            var row = [];
            [].forEach.call(tr.children, function (td) {
              if (!/^T[DH]$/.test(td.tagName)) return;
              var cell = clean(runsOf(td, { b: td.tagName === 'TH' }));
              row.push(cell);
              for (var s = 1; s < (parseInt(td.getAttribute('colspan') || '1', 10) || 1); s++) row.push([]);
            });
            if (row.length) rows.push(row);
          });
          if (rows.length) blocks.push({ t: 'table', rows: rows, head: !!n.querySelector('th') });
          return;
        }
        if (hasBlockKids(n)) {
          walk(n, tag === 'BLOCKQUOTE' ? ind + 1 : ind);
          return;
        }
        pushP(runsOf(n, {}), tag === 'BLOCKQUOTE' ? ind + 1 : ind, '', tag === 'CENTER' || (n.style && n.style.textAlign === 'center') ? { align: 'center' } : null);
      });
      flush();
    }
    function img(n) { var s = n.getAttribute('src') || ''; if (/^data:image\//.test(s)) blocks.push({ t: 'img', src: s }); }
    walk(root, 0);
    return blocks;
  }

  function mdInline(s) {
    // **bold**, __bold__, *italic*, `code`, [text](url)
    var runs = [], re = /(\*\*|__)(.+?)\1|\*(?!\s)(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g, last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) runs.push({ text: s.slice(last, m.index) });
      if (m[2] != null) runs.push({ text: m[2], b: true });
      else if (m[3] != null) runs.push({ text: m[3], i: true });
      else if (m[4] != null) runs.push({ text: m[4] });
      else runs.push({ text: m[5], a: true });
      last = re.lastIndex;
    }
    if (last < s.length) runs.push({ text: s.slice(last) });
    return runs;
  }
  function mdToBlocks(txt) {
    var lines = txt.replace(/\r\n?/g, '\n').split('\n'), blocks = [], para = [], i, m;
    function flush() { if (para.length) { blocks.push({ t: 'p', runs: mdInline(para.join(' ')), ind: 0 }); para = []; } }
    for (i = 0; i < lines.length; i++) {
      var L = lines[i];
      if (/^```/.test(L)) {
        flush(); var code = [];
        for (i++; i < lines.length && !/^```/.test(lines[i]); i++) code.push(lines[i]);
        blocks.push({ t: 'pre', text: code.join('\n') }); continue;
      }
      if ((m = /^(#{1,6})\s+(.*)$/.exec(L))) { flush(); blocks.push({ t: 'h', lv: m[1].length, runs: mdInline(m[2].replace(/#+\s*$/, '')) }); continue; }
      if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(L)) { flush(); blocks.push({ t: 'hr' }); continue; }
      if ((m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(L))) {
        flush(); blocks.push({ t: 'p', runs: mdInline(m[3]), ind: 1 + Math.floor(m[1].length / 2), bul: /\d/.test(m[2]) ? m[2].replace(')', '.') : '•' }); continue;
      }
      if (/^\s*\|.*\|\s*$/.test(L)) {
        flush(); var rows = [];
        for (; i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i]); i++) {
          if (/^\s*\|[\s:|-]+\|\s*$/.test(lines[i])) continue;
          rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map(function (c) { return mdInline(c.trim()); }));
        }
        i--; blocks.push({ t: 'table', rows: rows, head: true }); continue;
      }
      if ((m = /^>\s?(.*)$/.exec(L))) { flush(); blocks.push({ t: 'p', runs: mdInline(m[1]), ind: 1 }); continue; }
      if (!L.trim()) { flush(); continue; }
      para.push(L.trim());
    }
    flush();
    return blocks;
  }
  function textToBlocks(txt) {
    return txt.replace(/\r\n?/g, '\n').split('\n').map(function (l) { return { t: 'pre', text: l, plain: true }; });
  }
  function rowsToTable(rows) {
    rows = rows.filter(function (r) { return r.some(function (c) { return String(c == null ? '' : c).trim(); }); });
    var n = rows.reduce(function (a, r) { return Math.max(a, r.length); }, 0);
    return { t: 'table', head: true, rows: rows.map(function (r) {
      var out = []; for (var j = 0; j < n; j++) out.push([{ text: r[j] == null ? '' : String(r[j]) }]); return out;
    }) };
  }

  // ---------- layout engine (vector text, selectable, Cyrillic) ----------
  var A4 = [595.28, 841.89];
  function layout(blocks, title, opts) {
    opts = opts || {};
    return pdfLib().then(function (PL) {
      return PL.PDFDocument.create().then(function (doc) {
        doc.setTitle(title || 'Document'); doc.setCreator('Graphican — graphican.online'); doc.setProducer('Graphican');
        return Promise.all([embedFont(doc, 'Inter', false), embedFont(doc, 'Inter', true)]).then(function (F) {
          return run(PL, doc, { R: F[0], B: F[1] }, blocks, opts);
        });
      });
    });
  }
  function run(PL, doc, F, blocks, opts) {
    var landscape = !!opts.landscape;
    var PW = landscape ? A4[1] : A4[0], PH = landscape ? A4[0] : A4[1], M = opts.margin || 56;
    var CW = PW - 2 * M, BASE = opts.size || 10.5;
    var rgb = PL.rgb, ink = rgb(0.1, 0.1, 0.12), link = rgb(0.25, 0.2, 0.85), grey = rgb(0.45, 0.45, 0.5), line = rgb(0.82, 0.82, 0.86);
    var page = null, y = 0, first = true, q = Promise.resolve();

    function newPage() { page = doc.addPage([PW, PH]); y = PH - M; first = true; }
    function need(h) { if (!page || y - h < M) newPage(); }
    function fnt(r) { return r.b ? F.B : F.R; }
    var charsets = new Map();
    function hasChar(font, cp) { var s = charsets.get(font); if (!s) { s = new Set(font.getCharacterSet()); charsets.set(font, s); } return s.has(cp); }
    function fix(font, s) {
      var out = '';
      for (var ch of s) { var cp = ch.codePointAt(0); out += (cp < 32 || hasChar(font, cp)) ? ch : (cp === 0x2022 ? '-' : '?'); }
      return out;
    }
    // runs → wrapped lines of pieces
    function wrap(runs, size, width) {
      var words = [];
      runs.forEach(function (r) {
        var parts = String(r.text).replace(/\t/g, '    ').split(/(\n| +)/);
        parts.forEach(function (p) {
          if (!p) return;
          if (p === '\n') words.push({ br: true });
          else words.push({ text: fix(fnt(r), p), r: r, sp: /^ +$/.test(p) });
        });
      });
      var lines = [], cur = [], w = 0;
      function push() { while (cur.length && cur[cur.length - 1].sp) { w -= cur[cur.length - 1].w; cur.pop(); } lines.push({ items: cur, w: w }); cur = []; w = 0; }
      words.forEach(function (wd) {
        if (wd.br) { push(); return; }
        wd.w = fnt(wd.r).widthOfTextAtSize(wd.text, size);
        if (wd.sp && !cur.length) return;
        if (w + wd.w > width && cur.length && !wd.sp) push();
        // single word wider than the line: hard-break it
        while (wd.w > width && wd.text.length > 1) {
          var k = wd.text.length;
          while (k > 1 && fnt(wd.r).widthOfTextAtSize(wd.text.slice(0, k), size) > width - w) k--;
          cur.push({ text: wd.text.slice(0, k), r: wd.r, w: fnt(wd.r).widthOfTextAtSize(wd.text.slice(0, k), size) });
          w += cur[cur.length - 1].w; push();
          wd = { text: wd.text.slice(k), r: wd.r }; wd.w = fnt(wd.r).widthOfTextAtSize(wd.text, size);
        }
        cur.push(wd); w += wd.w;
      });
      if (cur.length || !lines.length) push();
      return lines;
    }
    function drawLines(lines, x, size, lh, width, align, color) {
      lines.forEach(function (ln) {
        need(lh);
        var bx = x + (align === 'center' ? (width - ln.w) / 2 : align === 'right' ? width - ln.w : 0), base = y - size * 0.95;
        // merge same-style pieces (incl. spaces) so copied text reads naturally
        var segs = [];
        ln.items.forEach(function (it) {
          var st = (it.r.b ? 'b' : '') + (it.r.a ? 'a' : '') + (it.r.u ? 'u' : ''), L = segs[segs.length - 1];
          if (L && L.st === st) { L.text += it.text; L.w += it.w; } else segs.push({ st: st, r: it.r, text: it.text, w: it.w });
        });
        segs.forEach(function (sg) {
          var col = sg.r.a ? link : (color || ink);
          page.drawText(sg.text, { x: bx, y: base, size: size, font: fnt(sg.r), color: col });
          if (sg.r.u || sg.r.a) page.drawLine({ start: { x: bx, y: base - 1.2 }, end: { x: bx + sg.w, y: base - 1.2 }, thickness: 0.5, color: col });
          bx += sg.w;
        });
        y -= lh; first = false;
      });
    }
    var H = [0, 22, 17, 14, 12.5, 11.5, 11];
    blocks.forEach(function (b) {
      q = q.then(function () {
        if (b.t === 'pb') { newPage(); return; }
        if (b.t === 'h') {
          var s = H[b.lv] || 12, ls = wrap(b.runs.map(function (r) { return Object.assign({}, r, { b: true }); }), s, CW);
          need(s * 1.3 * Math.min(ls.length, 2) + BASE * 2.4); // keep heading with following text
          if (!first) y -= s * 0.7;
          drawLines(ls, M, s, s * 1.3);
          y -= s * 0.35; return;
        }
        if (b.t === 'p') {
          var ind = (b.ind || 0) * 16, lsz = BASE, lines = wrap(b.runs, lsz, CW - ind - (b.bul ? 14 : 0));
          need(lsz * 1.5);
          if (b.bul) page.drawText(fix(F.R, b.bul === '•' ? '•' : b.bul), { x: M + ind + (b.bul === '•' ? 2 : 0) - (b.bul === '•' ? 0 : 4), y: y - lsz * 0.95, size: lsz, font: F.R, color: ink });
          if (b.ind && !b.bul) page.drawRectangle({ x: M + ind - 10, y: y - lines.length * lsz * 1.5, width: 2, height: lines.length * lsz * 1.5, color: line });
          drawLines(lines, M + ind + (b.bul ? 14 : 0), lsz, lsz * 1.5, CW - ind - (b.bul ? 14 : 0), b.align, b.ind && !b.bul ? grey : null);
          y -= b.bul ? 2 : lsz * 0.6; return;
        }
        if (b.t === 'pre') {
          var ps = b.plain ? BASE : BASE * 0.9, pl = wrap([{ text: b.text || ' ' }], ps, CW - (b.plain ? 0 : 16));
          var hgt = pl.length * ps * 1.45;
          if (!b.plain) {
            // code block background, split across pages if needed
            need(Math.min(hgt, PH - 2 * M) + 12);
            page.drawRectangle({ x: M, y: y - Math.min(hgt, y - M) - 10, width: CW, height: Math.min(hgt, y - M) + 10, color: rgb(0.955, 0.955, 0.97) });
            y -= 5; drawLines(pl, M + 8, ps, ps * 1.45); y -= BASE;
          } else drawLines(pl, M, ps, ps * 1.45);
          return;
        }
        if (b.t === 'hr') { need(14); y -= 6; page.drawLine({ start: { x: M, y: y }, end: { x: M + CW, y: y }, thickness: 0.6, color: line }); y -= 8; return; }
        if (b.t === 'img') {
          return fetch(b.src).then(function (r) { return r.blob(); }).then(decodeRaster).then(function (c) {
            return embedCanvas(doc, c).then(function (im) {
              var w = Math.min(CW, c.width * 0.75), h = w * c.height / c.width;
              if (h > PH - 2 * M) { h = PH - 2 * M; w = h * c.width / c.height; }
              need(h + 8);
              page.drawImage(im, { x: M + (CW - w) / 2, y: y - h, width: w, height: h });
              y -= h + 10; first = false;
            });
          }).catch(function () {});
        }
        if (b.t === 'table') { table(b); }
      });
    });
    function table(b) {
      var rows = b.rows, n = rows.reduce(function (a, r) { return Math.max(a, r.length); }, 0);
      if (!n) return;
      var ts = n > 8 ? 7.5 : n > 5 ? 8.5 : 9.5, pad = 4;
      // column widths ∝ content length (clamped), filling the content width
      var want = [];
      for (var j = 0; j < n; j++) {
        var mx = 3;
        rows.slice(0, 200).forEach(function (r) { var t = (r[j] || []).map(function (x) { return x.text; }).join(''); mx = Math.max(mx, Math.min(40, t.length)); });
        want.push(mx);
      }
      var sum = want.reduce(function (a, v) { return a + v; }, 0), cw = want.map(function (v) { return CW * v / sum; });
      function rowLines(r, hd) { return cw.map(function (w, j) { return wrap((r[j] || []).map(function (x) { return hd ? Object.assign({}, x, { b: true }) : x; }), ts, w - 2 * pad); }); }
      var headLines = b.head ? rowLines(rows[0], true) : null;
      function drawRow(r, cells, hd) {
        var hh = Math.max.apply(null, cells.map(function (ls) { return ls.length; })) * ts * 1.35 + 2 * pad;
        if (!page || y - hh < M) {
          newPage();
          if (b.head && !hd) drawRow(rows[0], headLines, true); // repeat header on each page
        }
        var x = M, top = y;
        if (hd) page.drawRectangle({ x: M, y: top - hh, width: CW, height: hh, color: rgb(0.94, 0.93, 0.99) });
        cells.forEach(function (ls, j) {
          page.drawRectangle({ x: x, y: top - hh, width: cw[j], height: hh, borderColor: line, borderWidth: 0.5 });
          var yy = y; y = top - pad;
          ls.forEach(function (ln) {
            var bx = x + pad, base = y - ts * 0.95;
            ln.items.forEach(function (it) { if (!it.sp) page.drawText(it.text, { x: bx, y: base, size: ts, font: fnt(it.r), color: ink }); bx += it.w; });
            y -= ts * 1.35;
          });
          y = yy; x += cw[j];
        });
        y = top - hh; first = false;
      }
      if (!first && page) y -= 4;
      rows.forEach(function (r, i) { drawRow(r, i === 0 && b.head ? headLines : rowLines(r, false), i === 0 && b.head); });
      y -= BASE;
    }
    return q.then(function () { if (!doc.getPageCount()) newPage(); return doc.save(); });
  }

  // ---------- public: any file → PDF bytes ----------
  function base(f) { return String(f.name || 'document').replace(/\.[^.]+$/, ''); }
  function imagesToPdf(canvases, title) {
    return pdfLib().then(function (PL) {
      return PL.PDFDocument.create().then(function (doc) {
        doc.setTitle(title || 'Images'); doc.setCreator('Graphican — graphican.online');
        return canvases.reduce(function (p, c) {
          return p.then(function () {
            return embedCanvas(doc, c).then(function (im) {
              // 96 dpi → points; SVG keeps its own size
              var w = c.ptW || c.width * 0.75, h = c.ptH || c.height * 0.75;
              var pg = doc.addPage([w, h]);
              pg.drawImage(im, { x: 0, y: 0, width: w, height: h });
            });
          });
        }, Promise.resolve()).then(function () { return doc.save(); });
      });
    });
  }
  function toPdf(f) {
    var k = kind(f), t = base(f);
    if (!k) return Promise.reject(new Error(whyNot(f)));
    if (k === 'pdf') return readBuf(f).then(function (b) { return new Uint8Array(b); });
    if (k === 'image' || k === 'svg' || k === 'heic' || k === 'tiff') return imageCanvases(f).then(function (cs) { return imagesToPdf(cs, t); });
    if (k === 'docx') return loadScript(V + 'mammoth.min.js').then(function () { return readBuf(f); })
      .then(function (buf) { return window.mammoth.convertToHtml({ arrayBuffer: buf }); })
      .then(function (res) {
        var d = new DOMParser().parseFromString('<body>' + res.value + '</body>', 'text/html');
        return layout(htmlToBlocks(d.body), t);
      });
    if (k === 'html') return readText(f).then(function (s) {
      var d = new DOMParser().parseFromString(s, 'text/html');
      return layout(htmlToBlocks(d.body), (d.title || t));
    });
    if (k === 'md') return readText(f).then(function (s) { return layout(mdToBlocks(s), t); });
    if (k === 'text') return readText(f).then(function (s) { return layout(textToBlocks(s), t); });
    if (k === 'csv' || k === 'sheet') return loadScript(V + 'xlsx.min.js').then(function () {
      return k === 'csv' ? readText(f).then(function (s) { return window.XLSX.read(s, { type: 'string', raw: true, FS: ext(f) === 'tsv' ? '\t' : undefined }); })
        : readBuf(f).then(function (b) { return window.XLSX.read(b, { type: 'array', cellDates: true }); });
    }).then(function (wb) {
      var blocks = [], maxCols = 0;
      wb.SheetNames.forEach(function (name, i) {
        var rows = window.XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: '', blankrows: false });
        if (!rows.length) return;
        if (i && blocks.length) blocks.push({ t: 'pb' });
        if (wb.SheetNames.length > 1) blocks.push({ t: 'h', lv: 3, runs: [{ text: name }] });
        var tb = rowsToTable(rows);
        maxCols = Math.max(maxCols, tb.rows[0] ? tb.rows[0].length : 0);
        blocks.push(tb);
      });
      if (!blocks.length) blocks.push({ t: 'p', runs: [{ text: '(хоосон хүснэгт)' }] });
      return layout(blocks, t, { landscape: maxCols > 6, margin: 36 });
    });
    return Promise.reject(new Error(whyNot(f)));
  }

  window.GFile = {
    kind: kind, whyNot: whyNot, ACCEPT: ACCEPT, IMG_ACCEPT: IMG_ACCEPT, LABEL: LABEL,
    toPdf: toPdf, imageCanvases: imageCanvases, isImage: function (f) { return /^(image|svg|heic|tiff)$/.test(kind(f) || ''); },
    loadScript: loadScript, pdfjs: pdfjs, pdfLib: pdfLib, embedFont: embedFont, screenFont: screenFont, FONTS: Object.keys(FONTS),
    embedCanvas: embedCanvas, baseName: base
  };
})();
