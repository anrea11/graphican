(function () {
  var count = document.getElementById('ht-downloads'), note = document.getElementById('ht-stat-note');
  if (!count || !note) return;
  var controller = new AbortController(), timeout = setTimeout(function () { controller.abort(); }, 8000);
  fetch('/api/stats', { signal: controller.signal }).then(function (r) {
    if (!r.ok) throw new Error('stats'); return r.json();
  }).then(function (data) {
    if (!Number.isSafeInteger(data.downloads) || data.downloads < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(data.since)) throw new Error('stats');
    count.textContent = new Intl.NumberFormat('mn-MN').format(data.downloads);
    note.textContent = data.since.replace(/-/g, '.') + '-ноос бүртгэсэн файл татах үйлдлийн тоо. Давтан таталт орно.';
  }).catch(function () { note.textContent = 'Таталтын тоог одоогоор харуулах боломжгүй байна.'; })
    .finally(function () { clearTimeout(timeout); });
})();
