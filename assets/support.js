/*
  Graphican — "support us" card shown shortly after a download (any tool).
  Text / link come from content/site.json → support (editable in /admin); the defaults below are used until it loads.
  Works on every page of the site (editor, PDF tools, image tools, fonts…): shown after a download, but not again
  while snoozed — closing it any way («Дараа больё», ✕, Esc, backdrop) → snooze_minutes (20), «Дэмжлэг үзүүлэх» → 7 days.
  Other scripts may call GCSupport.done() after a download; <a download> clicks are picked up automatically.
*/
(function () {
  'use strict';
  if (window.GCSupport) return;
  var KEY = 'gc-support2', MIN = 6e4, DAY = 864e5, shown = false, timer = null;
  var cfg = {
    enabled: true, title: 'Graphican-ийг хамтдаа хөгжүүлье',
    text: 'Таны ашиглаж байгаа Graphican-ийг бид цаашид илүү олон боломж, илүү сайн ажиллагаатай болгохоор хөгжүүлж байна. Хэрэг болсон бол хөгжлийг маань дэмжээрэй.',
    button: 'Дэмжлэг үзүүлэх', later: 'Дараа больё', link: '/support/', snooze_minutes: 20
  };
  var loaded = null;
  function load() {
    if (loaded) return loaded;
    loaded = Promise.race([
      fetch('/content/site.json', { cache: 'force-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (d && d.support) Object.keys(d.support).forEach(function (k) { if (d.support[k] !== '' && d.support[k] != null) cfg[k] = d.support[k]; });
      }),
      new Promise(function (r) { setTimeout(r, 1500); })
    ]).catch(function () {});
    return loaded;
  }
  function until() { try { return +(localStorage.getItem(KEY) || 0); } catch (e) { return 0; } }
  function snooze(ms) { try { localStorage.setItem(KEY, String(Date.now() + ms)); } catch (e) {} }
  function later() { var m = +cfg.snooze_minutes; return (m >= 0 ? m : 20) * MIN; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var CSS = '.gcs-bg{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,6,18,.55);' +
    '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .3s}' +
    '.gcs-bg.on{opacity:1}' +
    '.gcs{position:relative;width:420px;max-width:100%;padding:28px 28px 24px;border-radius:24px;text-align:center;' +
    'background:radial-gradient(120% 90% at 100% 0%,rgba(157,128,255,.28),transparent 60%),#121019;color:#f2f0f7;border:1px solid rgba(255,255,255,.1);' +
    'box-shadow:0 30px 60px -20px rgba(20,8,70,.7),0 2px 8px rgba(0,0,0,.35);font:400 14px/1.5 "Inter",system-ui,sans-serif;-webkit-font-smoothing:antialiased;' +
    'transform:translateY(24px) scale(.98);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .35s}' +
    '.gcs-bg.on .gcs{transform:none;opacity:1}' +
    '.gcs-top{display:flex;flex-direction:column;align-items:center;gap:14px;margin:4px 0 12px}' +
    '.gcs-orb{width:52px;height:52px;border-radius:50%;flex:none;background:radial-gradient(circle at 35% 30%,#fff,#a497ff 40%,#34229e 85%);box-shadow:0 0 34px #816dfb}' +
    '.gcs h3{margin:0;font:700 21px/1.25 "Inter Tight","Inter",sans-serif;letter-spacing:-.01em;color:#fff}' +
    '.gcs p{margin:0 auto 22px;max-width:34ch;color:#c9c4d8;font-size:14.5px;line-height:1.6}' +
    '.gcs-row{display:flex;gap:8px;align-items:center}' +
    '.gcs-go{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 16px;border-radius:999px;border:0;cursor:pointer;text-decoration:none;' +
    'background:linear-gradient(135deg,#9d80ff 0%,#6d56fa 48%,#4b33d9 100%);color:#fff;font:600 14px/1 "Inter",sans-serif;box-shadow:0 8px 22px -8px rgba(109,86,250,.85),inset 0 1px 0 rgba(255,255,255,.25)}' +
    '.gcs-go:hover{filter:brightness(1.1)}' +
    '.gcs-go i{font-style:normal;transition:transform .2s}.gcs-go:hover i{transform:translateX(3px)}' +
    '.gcs-no{height:42px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:transparent;color:#d8d4e4;font:500 13.5px/1 "Inter",sans-serif;cursor:pointer}' +
    '.gcs-no:hover{background:rgba(255,255,255,.06);color:#fff}' +
    '.gcs-x{position:absolute;right:12px;top:12px;width:30px;height:30px;border-radius:50%;border:0;background:transparent;color:#9a95aa;font-size:18px;line-height:1;cursor:pointer}' +
    '.gcs-x:hover{background:rgba(255,255,255,.08);color:#fff}' +
    '.gcs :focus-visible{outline:2px solid #a497ff;outline-offset:2px}' +
    '@media (max-width:560px){.gcs{padding:24px 20px 20px;border-radius:22px}.gcs-row{flex-direction:column}.gcs-row{align-items:stretch}.gcs-go,.gcs-no{flex:none;width:100%;height:46px}}' +
    '@media (prefers-reduced-motion:reduce){.gcs,.gcs-bg{transition:none}}';

  function show() {
    if (!cfg.enabled || Date.now() < until() || document.querySelector('.gcs-bg')) return;
    shown = true;
    if (!document.getElementById('gcs-css')) { var st = document.createElement('style'); st.id = 'gcs-css'; st.textContent = CSS; document.head.appendChild(st); }
    var bg = document.createElement('div'); bg.className = 'gcs-bg';
    var el = document.createElement('div');
    el.className = 'gcs'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'gcs-t'); el.setAttribute('aria-describedby', 'gcs-p');
    var ext = /^https?:/i.test(cfg.link || '');
    el.innerHTML = '<button type="button" class="gcs-x" aria-label="Хаах">×</button>' +
      '<div class="gcs-top"><span class="gcs-orb" aria-hidden="true"></span><h3 id="gcs-t">' + esc(cfg.title) + '</h3></div>' +
      '<p id="gcs-p">' + esc(cfg.text) + '</p>' +
      '<div class="gcs-row"><a class="gcs-go" href="' + esc(cfg.link || '/support/') + '"' + (ext ? ' target="_blank" rel="noopener"' : ' target="_blank"') + '>' + esc(cfg.button) + ' <i aria-hidden="true">→</i></a>' +
      '<button type="button" class="gcs-no">' + esc(cfg.later) + '</button></div>';
    bg.appendChild(el); document.body.appendChild(bg);
    var prev = document.activeElement;
    requestAnimationFrame(function () { requestAnimationFrame(function () { bg.classList.add('on'); try { el.querySelector('.gcs-go').focus({ preventScroll: true }); } catch (e) {} }); });
    function close(ms) {
      snooze(ms); shown = false; bg.classList.remove('on');
      document.removeEventListener('keydown', onKey, true);
      setTimeout(function () { bg.remove(); try { if (prev && prev.focus) prev.focus({ preventScroll: true }); } catch (e) {} }, 350);
    }
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) close(later()); });
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(later()); } }
    document.addEventListener('keydown', onKey, true);
    el.querySelector('.gcs-x').addEventListener('click', function () { close(later()); });
    el.querySelector('.gcs-no').addEventListener('click', function () { close(later()); });
    el.querySelector('.gcs-go').addEventListener('click', function () { close(7 * DAY); });
  }
  // after a download: wait a moment (the save dialog / file card appears first), then show the card
  function done() {
    if (shown || Date.now() < until()) return;
    clearTimeout(timer);
    load().then(function () { timer = setTimeout(show, 1200); });
  }
  window.GCSupport = { done: done, show: function () { shown = false; try { localStorage.removeItem(KEY); } catch (e) {} load().then(show); } };

  // programmatic downloads (a.download + a.click()) and real clicks on download links
  var ac = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    var r = ac.apply(this, arguments);
    try { if (this.hasAttribute('download')) done(); } catch (e) {}
    return r;
  };
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[download]');
    if (a && !a.closest('.gcs-bg')) done();
  }, true);
})();
