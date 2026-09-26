/* Graphican — template gallery (/tools/templates/): real previews drawn with the same code the editor uses */
(function () {
  'use strict';
  var root = document.getElementById('tg-app'); if (!root || !window.GTPL || !window.fabric) return;
  var T = window.GTPL, cat = 'all';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var SIZE_NAME = { '1080x1080': 'Квадрат пост', '1080x1350': 'Instagram пост', '1080x1920': 'Story', '1200x630': 'Facebook пост', '1640x624': 'Facebook cover', '1280x720': 'YouTube', '1050x600': 'Нэрийн хуудас' };

  // load every font the templates use, once
  var fams = {};
  T.list.forEach(function (t) { t.fonts.forEach(function (f) { fams[f] = t; }); });
  Object.keys(fams).forEach(function (f) {
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = T.cssUrl({ fonts: [f] }); document.head.appendChild(l);
  });
  function fontsReady() {
    if (!document.fonts) return Promise.resolve();
    var loads = [];
    Object.keys(fams).forEach(function (f) { [400, 600, 700, 800].forEach(function (w) { loads.push(document.fonts.load(w + ' 40px "' + f + '"', 'АаӨөҮү')); }); });
    loads.push(document.fonts.load('italic 700 40px "Lora"', 'Аа'), document.fonts.load('italic 700 40px "Cormorant Garamond"', 'Аа'));
    return Promise.all(loads.map(function (p) { return p.catch(function () {}); }));
  }

  root.innerHTML = '<div class="tg-cats" id="tg-cats"></div><div class="tg-grid" id="tg-grid"></div>';
  var grid = root.querySelector('#tg-grid');

  function cats() {
    var all = [['all', 'Бүгд', T.list.length]].concat(Object.keys(T.cats).map(function (k) { return [k, T.cats[k], T.list.filter(function (t) { return t.cat === k; }).length]; }));
    root.querySelector('#tg-cats').innerHTML = all.map(function (c) {
      return '<button type="button" data-cat="' + c[0] + '" class="' + (cat === c[0] ? 'on' : '') + '">' + esc(c[1]) + ' <i>' + c[2] + '</i></button>';
    }).join('');
  }
  function cards() {
    grid.innerHTML = T.list.filter(function (t) { return cat === 'all' || t.cat === cat; }).map(function (t) {
      return '<a class="tg-card" href="/editor/?tpl=' + t.id + '" data-id="' + t.id + '">' +
        '<span class="tg-prev" style="aspect-ratio:' + t.w + '/' + t.h + ';background:' + t.bg + '"><canvas></canvas></span>' +
        '<b>' + esc(t.name) + '</b><small>' + (SIZE_NAME[t.w + 'x' + t.h] || '') + ' · ' + t.w + '×' + t.h + '</small><em>Засах →</em></a>';
    }).join('');
    draw();
  }
  var ready = fontsReady();
  function draw() {
    ready.then(function () {
      grid.querySelectorAll('.tg-card').forEach(function (a) {
        var t = T.get(a.dataset.id), el = a.querySelector('canvas'), box = a.querySelector('.tg-prev');
        var W = Math.min(520, Math.round(box.clientWidth * (window.devicePixelRatio || 1) * 1.1)) || 360, k = W / t.w;
        var c = new fabric.StaticCanvas(el, { width: Math.round(t.w * k), height: Math.round(t.h * k), backgroundColor: t.bg, renderOnAddRemove: false, enableRetinaScaling: false });
        c.setZoom(k);
        T.objects(t, 0, 0).forEach(function (o) { c.add(o); });
        c.renderAll();
        el.style.width = '100%'; el.style.height = '100%';
        var wrap = el.parentNode; if (wrap && wrap.classList.contains('canvas-container')) { wrap.style.width = '100%'; wrap.style.height = '100%'; }
      });
    });
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]'); if (!b) return;
    cat = b.dataset.cat; cats(); cards();
  });
  cats(); cards();
})();
