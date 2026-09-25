/*
  Graphican Worker — serves the static site and a small stock-media API for /editor.
  Keys live in Cloudflare secrets (never in the browser):  PEXELS_KEY, PIXABAY_KEY
    GET /api/stock?src=pexels|pixabay&type=photo|vector|video&q=&page=
    GET /api/stock/file?u=<media url>          (CORS proxy so images can be used/exported on the canvas)
*/
const MEDIA_HOSTS = ['images.pexels.com', 'videos.pexels.com', 'cdn.pixabay.com', 'pixabay.com'];
const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', ...extra } });

async function search(url, env, ctx) {
  const src = url.searchParams.get('src') === 'pixabay' ? 'pixabay' : 'pexels';
  const type = ['photo', 'vector', 'video'].includes(url.searchParams.get('type')) ? url.searchParams.get('type') : 'photo';
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const page = Math.max(1, Math.min(50, parseInt(url.searchParams.get('page') || '1', 10) || 1));
  const key = src === 'pexels' ? env.PEXELS_KEY : env.PIXABAY_KEY;
  if (!key) return json({ error: 'no_key', src }, 503);

  // 24h edge cache (Pixabay's API terms ask for caching; also keeps us well under rate limits)
  const cacheKey = new Request(`https://stock.cache/${src}/${type}/${page}/${encodeURIComponent(q.toLowerCase())}`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let items = [], total = 0;
  if (src === 'pexels') {
    if (type === 'vector') return json({ items: [], total: 0, note: 'Pexels-д вектор байхгүй' });
    const base = type === 'video' ? 'https://api.pexels.com/videos/' : 'https://api.pexels.com/v1/';
    const ep = q ? `${base}search?query=${encodeURIComponent(q)}&` : (type === 'video' ? `${base}popular?` : `${base}curated?`);
    const r = await fetch(`${ep}per_page=30&page=${page}`, { headers: { Authorization: key } });
    if (!r.ok) return json({ error: 'upstream', status: r.status }, 502);
    const d = await r.json();
    total = d.total_results || 0;
    if (type === 'video') {
      items = (d.videos || []).map(v => {
        const files = (v.video_files || []).filter(f => f.file_type === 'video/mp4').sort((a, b) => (a.width || 0) - (b.width || 0));
        const hd = files.find(f => (f.width || 0) >= 1280) || files[files.length - 1] || {};
        const sm = files.find(f => (f.width || 0) >= 540) || files[0] || {};
        return { id: 'px' + v.id, kind: 'video', thumb: v.image, preview: sm.link, full: hd.link, w: v.width, h: v.height, dur: v.duration, author: v.user && v.user.name, page: v.url };
      });
    } else {
      items = (d.photos || []).map(p => ({ id: 'px' + p.id, kind: 'photo', thumb: p.src.medium, full: p.src.large2x || p.src.original, w: p.width, h: p.height, author: p.photographer, page: p.url, alt: p.alt }));
    }
  } else {
    const isVid = type === 'video';
    const u = `https://pixabay.com/api/${isVid ? 'videos/' : ''}?key=${key}&q=${encodeURIComponent(q)}&per_page=30&page=${page}&safesearch=true&lang=en` +
      (isVid ? '' : `&image_type=${type === 'vector' ? 'vector' : 'photo'}`) + (q ? '' : '&order=popular');
    const r = await fetch(u);
    if (!r.ok) return json({ error: 'upstream', status: r.status }, 502);
    const d = await r.json();
    total = d.totalHits || 0;
    if (isVid) {
      items = (d.hits || []).map(h => {
        const v = h.videos || {}, med = v.medium || v.small || {}, sm = v.small || v.tiny || med;
        return { id: 'pb' + h.id, kind: 'video', thumb: med.thumbnail || sm.thumbnail || '', preview: sm.url, full: (v.large && v.large.url) || med.url, w: med.width, h: med.height, dur: h.duration, author: h.user, page: h.pageURL };
      });
    } else {
      items = (d.hits || []).map(h => ({ id: 'pb' + h.id, kind: type, thumb: h.webformatURL, full: h.largeImageURL || h.webformatURL, w: h.imageWidth, h: h.imageHeight, author: h.user, page: h.pageURL, alt: h.tags }));
    }
  }
  const res = json({ src, type, page, total, items }, 200, { 'cache-control': 'public, max-age=86400' });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function file(url) {
  let target;
  try { target = new URL(url.searchParams.get('u') || ''); } catch (e) { return json({ error: 'bad_url' }, 400); }
  if (target.protocol !== 'https:' || !MEDIA_HOSTS.some(h => target.hostname === h || target.hostname.endsWith('.' + h))) return json({ error: 'host_not_allowed' }, 403);
  const r = await fetch(target.toString(), { cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!r.ok) return json({ error: 'upstream', status: r.status }, 502);
  const h = new Headers();
  h.set('content-type', r.headers.get('content-type') || 'application/octet-stream');
  if (r.headers.get('content-length')) h.set('content-length', r.headers.get('content-length'));
  h.set('access-control-allow-origin', '*');
  h.set('cache-control', 'public, max-age=86400');
  const name = url.searchParams.get('dl');
  if (name) h.set('content-disposition', `attachment; filename="${name.replace(/[^\w.\-]+/g, '_')}"`);
  return new Response(r.body, { status: 200, headers: h });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/stock') return search(url, env, ctx);
    if (url.pathname === '/api/stock/file') return file(url);
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  }
};
