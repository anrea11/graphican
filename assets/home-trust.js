(function () {
  var count = document.getElementById('ht-downloads'), note = document.getElementById('ht-stat-note');
  if (!count || !note) return;
  var controller = new AbortController(), timeout = setTimeout(function () { controller.abort(); }, 8000);
  fetch('/api/stats', { signal: controller.signal }).then(function (r) {
    if (!r.ok) throw new Error('stats'); return r.json();
  }).then(function (data) {
    if (!Number.isSafeInteger(data.downloads) || data.downloads < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data.since)) throw new Error('stats');
    var fmtN = new Intl.NumberFormat('mn-MN'), calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    count.textContent = fmtN.format(data.downloads);
    if (!calm && 'IntersectionObserver' in window && data.downloads > 0) {
      count.textContent = '0';
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; io.disconnect();
        var t0 = performance.now();
        (function tick(now) { var p = Math.min(1, (now - t0) / 1400), q = 1 - Math.pow(1 - p, 3); count.textContent = fmtN.format(Math.round(data.downloads * q)); if (p < 1) requestAnimationFrame(tick); })(t0);
      }, { threshold: 0.5 });
      io.observe(count);
    }
    note.textContent = data.since.replace(/-/g, '.') + '-ноос хойш · Давтан таталт орно.';
  }).catch(function () { note.textContent = 'Таталтын тоог одоогоор харуулах боломжгүй байна.'; })
    .finally(function () { clearTimeout(timeout); });
})();
