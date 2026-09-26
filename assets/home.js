/* Graphican — home: header behaviour + "drop any file" box that suggests what to do with it */
(function () {
  'use strict';
  // header, menu, hero ring and reveal animations come from app.js (enhance)
  var drop = document.getElementById('hm-drop'), input = document.getElementById('hm-file'), acts = document.getElementById('hm-acts');
  if (!drop || !input) return;

  var I = {
    edit: '<path d="M4 20l4.5-1 10-10-3.5-3.5-10 10z"/><path d="M13.5 7l3.5 3.5"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/>',
    img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
    up: '<path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" fill="currentColor"/>',
    bg: '<rect x="3" y="4" width="18" height="16" rx="2" stroke-dasharray="3 2"/><circle cx="12" cy="10" r="3"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
    merge: '<path d="M7 4v6a5 5 0 0 0 5 5 5 5 0 0 1 5 5M17 4v6a5 5 0 0 1-5 5"/>',
    zip: '<path d="M4 14v6h16v-6M12 3v12m-4-4 4 4 4-4"/>',
    sign: '<path d="M3 17c3-4 5-9 7-9s-1 9 2 9 3-3 5-3 2 2 4 2"/>',
    tr: '<path d="M4 5h9M8.5 3v2c0 4-2 7-5 9M6 9c1.5 3 4 5 7 6"/><path d="m13 21 4-10 4 10M14.5 17.5h5"/>',
    ocr: '<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path d="M8 9h8M8 12h8M8 15h5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    small: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
    ai: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2"/><circle cx="12" cy="12" r="3"/>'
  };
  // what to offer for each kind of file: [label, icon, where, action]
  var PDF = [
    ['Засах, бичих', 'edit', 'pdf', 'edit'], ['Word болгох', 'doc', 'pdf', 'word'], ['Зураг болгох', 'img', 'pdf', 'jpg'],
    ['Хэмжээ багасгах', 'small', 'pdf', 'compress'], ['Гарын үсэг зурах', 'sign', 'pdf', 'sig'], ['Орчуулах', 'tr', 'pdf', 'translate'],
    ['Хуудас салгах', 'crop', 'pdf', 'extract'], ['Текст таних (OCR)', 'ocr', 'pdf', 'ocr'], ['Excel болгох', 'doc', 'pdf', 'excel'],
    ['PowerPoint болгох', 'doc', 'pdf', 'ppt'], ['AI хураангуй', 'ai', 'pdf', 'sum'], ['Нууц үг тавих', 'lock', 'pdf', 'pw']
  ];
  var IMG = [
    ['AI томруулах, тодруулах', 'up', 'tool', '/tools/upscale/'], ['Дэвсгэр арилгах', 'bg', 'tool', '/tools/bgremove/'],
    ['Сошиал хэмжээнд тайрах', 'crop', 'tool', '/tools/socialcrop/'], ['Дизайн засварлагчид засах', 'edit', 'tool', '/editor/'],
    ['PDF болгох', 'doc', 'pdf', 'topdf'], ['Зурган дээрх текст таних', 'ocr', 'pdf', 'ocr']
  ];
  var OFFICE = [['PDF болгох', 'doc', 'pdf', 'topdf'], ['PDF болгоод засах', 'edit', 'pdf', 'edit'], ['PDF болгоод орчуулах', 'tr', 'pdf', 'translate']];
  var MANY = [['Нэг PDF болгож нэгтгэх', 'merge', 'pdf', 'merge'], ['Бүгдийг PDF болгох', 'doc', 'pdf', 'topdf']];

  function ext(f) { return (String(f.name || '').split('.').pop() || '').toLowerCase(); }
  function kind(f) {
    var x = ext(f), t = f.type || '';
    if (x === 'pdf' || t === 'application/pdf') return 'pdf';
    if (/^image\//.test(t) || /^(heic|heif|tif|tiff|webp|avif|bmp|jpe?g|png|gif)$/.test(x)) return 'img';
    if (/^(docx?|xlsx?|csv|pptx?|txt|md|html?|rtf|odt)$/.test(x)) return 'office';
    return '';
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function size(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  var files = [];

  function show(list) {
    files = [].slice.call(list || []).filter(function (f) { return kind(f); });
    if (!files.length) {
      acts.hidden = false;
      acts.innerHTML = '<p class="hm-warn">Энэ төрлийн файлыг одоогоор дэмжихгүй. PDF, Word, Excel, PowerPoint, TXT эсвэл зураг (JPG, PNG, HEIC, WebP) оруулна уу.</p>';
      return;
    }
    var k = kind(files[0]), same = files.every(function (f) { return kind(f) === k; });
    var opts = files.length > 1 ? MANY.concat(same && k === 'img' ? IMG.slice(0, 0) : []) : k === 'pdf' ? PDF : k === 'img' ? IMG : OFFICE;
    var name = files.length > 1 ? files.length + ' файл' : files[0].name;
    acts.hidden = false;
    drop.classList.add('has-file');
    acts.innerHTML = '<div class="hm-file"><span class="hm-fi">' + (k === 'img' ? 'IMG' : ext(files[0]).toUpperCase().slice(0, 4) || 'FILE') + '</span>' +
      '<span class="hm-fn"><b>' + esc(name) + '</b><small>' + size(files.reduce(function (a, f) { return a + f.size; }, 0)) + ' · юу хийх вэ?</small></span>' +
      '<button type="button" class="hm-x" data-reset aria-label="Өөр файл сонгох">✕</button></div>' +
      '<div class="hm-opts">' + opts.map(function (o, i) {
        return '<button type="button" data-opt="' + i + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + I[o[1]] + '</svg>' + esc(o[0]) + '</button>';
      }).join('') + '</div>';
    acts._opts = opts;
    acts.querySelector('[data-opt]').focus({ preventScroll: true });
  }
  function go(o) {
    var url = o[2] === 'pdf' ? '/tools/pdfedit/?do=' + o[3] : o[3];
    if (!window.GHandoff) { location.href = url; return; }
    drop.classList.add('busy');
    var first = files[0], more = files.slice(1).map(function (f) { return { blob: f, name: f.name }; });
    window.GHandoff.put(first, { name: first.name, target: o[2] === 'pdf' ? 'pdfedit' : url, more: o[2] === 'pdf' ? more : [] })
      .then(function () { location.href = url; }, function () { location.href = url; });
  }

  input.addEventListener('change', function () { show(input.files); });
  acts.addEventListener('click', function (e) {
    var b = e.target.closest('[data-opt]'); if (b) return go(acts._opts[+b.dataset.opt]);
    if (e.target.closest('[data-reset]')) { files = []; acts.hidden = true; drop.classList.remove('has-file'); input.value = ''; input.click(); }
  });
  ['dragenter', 'dragover'].forEach(function (t) { window.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { window.addEventListener(t, function (e) { e.preventDefault(); if (t === 'drop' || !e.relatedTarget) drop.classList.remove('over'); }); });
  window.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files.length) { show(e.dataTransfer.files); drop.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });
  window.addEventListener('pageshow', function () { drop.classList.remove('busy', 'over'); });
})();
