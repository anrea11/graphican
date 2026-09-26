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
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-tplf', ''); l.href = T.cssUrl({ fonts: [f] }); document.head.appendChild(l);
  });
  // wait for exactly the faces a template's texts use (weight + style), not a guess
  var faceWait = {};
  function facesFor(objs) {
    var need = {};
    objs.forEach(function (o) {
      if (!o.fontFamily) return;
      var fam = (o.fontFamily.match(/"([^"]+)"/) || [0, o.fontFamily])[1];
      need[(o.fontStyle === 'italic' ? 'italic ' : '') + (o.fontWeight || 400) + ' 40px "' + fam + '"'] = 1;
    });
    if (!document.fonts) return Promise.resolve();
    return Promise.all(Object.keys(need).map(function (k) {
      if (!faceWait[k]) faceWait[k] = document.fonts.load(k, 'АаӨөҮү').catch(function () {});
      return faceWait[k];
    }));
  }

  root.innerHTML = '<div class="tg-cats" id="tg-cats"></div><div class="tg-grid" id="tg-grid"></div>';
  var grid = root.querySelector('#tg-grid');

  function cats() {
    var all = [['all', 'Бүгд', T.list.length], ['photo', '📷 Фототой', T.list.filter(function (t) { return t.photos && t.photos.length; }).length]].concat(Object.keys(T.cats).map(function (k) { return [k, T.cats[k], T.list.filter(function (t) { return t.cat === k; }).length]; }));
    root.querySelector('#tg-cats').innerHTML = all.map(function (c) {
      return '<button type="button" data-cat="' + c[0] + '" class="' + (cat === c[0] ? 'on' : '') + '">' + esc(c[1]) + ' <i>' + c[2] + '</i></button>';
    }).join('');
  }
  function cards() {
    grid.innerHTML = T.list.filter(function (t) { return cat === 'all' || t.cat === cat || (cat === 'photo' && t.photos && t.photos.length); }).map(function (t) {
      return '<a class="tg-card" href="/editor/?tpl=' + t.id + '" data-id="' + t.id + '">' +
        '<span class="tg-prev" style="aspect-ratio:' + t.w + '/' + t.h + ';background:' + t.bg + '"><canvas></canvas></span>' +
        '<b>' + esc(t.name) + (t.photos && t.photos.length ? ' <i class="tg-ph" title="Фото: Pexels · ' + esc(t.credits.join(', ')) + '">фото</i>' : '') + '</b><small>' + (SIZE_NAME[t.w + 'x' + t.h] || '') + ' · ' + t.w + '×' + t.h + '</small><em>Засах →</em></a>';
    }).join('');
    draw();
  }
  var sheets = Promise.all(Array.prototype.map.call(document.querySelectorAll('link[data-tplf]'), function (l) {
    return new Promise(function (r) { if (l.sheet) r(); else { l.onload = l.onerror = r; setTimeout(r, 4000); } });
  }));
  // build previews only when a card scrolls near the viewport (photo templates download images)
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting && e.target._go) { io.unobserve(e.target); e.target._go(); } });
  }, { rootMargin: '600px 0px' }) : null;
  function whenVisible(el) { return new Promise(function (r) { if (!io) return r(); el._go = r; io.observe(el); }); }
  function draw() {
    grid.querySelectorAll('.tg-card').forEach(function (a) {
      var t = T.get(a.dataset.id), el = a.querySelector('canvas'), box = a.querySelector('.tg-prev');
      var objs;
      var W0 = Math.min(560, Math.round(box.clientWidth * (window.devicePixelRatio || 1) * 1.1)) || 360;
      whenVisible(a).then(function () { return T.build ? T.build(t, 0, 0, null, W0 > 420 ? 1000 : 700) : T.objects(t, 0, 0); })
        .then(function (o) { objs = o; return sheets; }).then(function () { return facesFor(objs); }).then(function () {
        if (!a.isConnected) return;
        var W = Math.min(560, Math.round(box.clientWidth * (window.devicePixelRatio || 1) * 1.1)) || 360, k = W / t.w;
        var c = new fabric.StaticCanvas(el, { width: Math.round(t.w * k), height: Math.round(t.h * k), backgroundColor: t.bg, renderOnAddRemove: false, enableRetinaScaling: false });
        c.setZoom(k);
        objs.forEach(function (o) { if (o.initDimensions) o.initDimensions(); c.add(o); });
        c.renderAll();
        a.classList.add('ready');
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
