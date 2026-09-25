/* Graphican — landing page: pick / drop files → hand them to the PDF editor with the right action */
(function () {
  'use strict';
  var drop = document.getElementById('lp-drop'), input = document.getElementById('lp-file');
  var header = document.getElementById('header'), toggle = document.getElementById('menu-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var d = document.querySelector('.dmenu');
  if (d) document.addEventListener('click', function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
  window.addEventListener('scroll', function () { if (header) header.classList.toggle('scrolled', window.scrollY > 10); }, { passive: true });
  if (!drop || !input) return;

  function toast(t) {
    var el = document.getElementById('toast'); if (!el) return;
    el.textContent = t; el.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 3500);
  }
  function go(files) {
    files = [].slice.call(files || []);
    if (!files.length) return;
    var act = drop.dataset.do, url = '/tools/pdfedit/?do=' + encodeURIComponent(act);
    drop.classList.add('busy');
    if (!window.GHandoff) { location.href = url; return; }
    var first = files[0], more = files.slice(1).map(function (f) { return { blob: f, name: f.name }; });
    window.GHandoff.put(first, { name: first.name, target: 'pdfedit', more: more }).then(function () {
      location.href = url;
    }).catch(function () {
      drop.classList.remove('busy');
      toast('Файлыг дамжуулж чадсангүй — засварлагч дээр шууд нээнэ үү');
      setTimeout(function () { location.href = url; }, 1200);
    });
  }
  input.addEventListener('change', function () { go(input.files); });
  ['dragenter', 'dragover'].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add('over'); });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove('over'); });
  });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer) go(e.dataTransfer.files); });
  // a file dropped anywhere on the page counts too
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); if (!drop.contains(e.target) && e.dataTransfer) go(e.dataTransfer.files); });
  // back-button from the editor: page may come from bfcache with the busy state still on
  window.addEventListener('pageshow', function () { drop.classList.remove('busy'); input.value = ''; });
})();
