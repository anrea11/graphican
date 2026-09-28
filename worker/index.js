/*
  Graphican Worker — serves the static site and a small stock-media API for /editor.
  Keys live in Cloudflare secrets (never in the browser):  PEXELS_KEY, PIXABAY_KEY
    GET /api/stock?src=pexels|pixabay&type=photo|vector|video&q=&page=
    GET /api/stock/file?u=<media url>          (CORS proxy so images can be used/exported on the canvas; Range-aware for video)
    GET /api/stock/video?id=<pexels id>[&poster=1|&info=1]   (template videos: redirects to the HD mp4 / poster through the proxy)
  Workers AI (binding "AI" in wrangler.jsonc) for the PDF editor:
    POST /api/ai/translate  {texts:[...], source, target}  -> {texts:[...]}   (Llama 3.3 in batches, m2m100 fallback)
    POST /api/i18n          {texts:[...]} -> {texts:[...]}   (site English UI: strings missing from assets/i18n-en.js, edge-cached)
    POST /api/ai/chat       {mode:'summary'|'ask', text, question, lang} -> {answer}
*/
const MEDIA_HOSTS = ['images.pexels.com', 'videos.pexels.com', 'player.vimeo.com', 'i.vimeocdn.com', 'cdn.pixabay.com', 'pixabay.com'];
// find a key even if the secret was named slightly differently (PEXELS_API_KEY, pexels, trailing spaces…)
function findKey(env, word) {
  const exact = env[word + '_KEY'];
  if (typeof exact === 'string' && exact.trim()) return exact.trim();
  for (const name of Object.keys(env)) {
    const v = env[name];
    if (typeof v === 'string' && name.toUpperCase().replace(/\s/g, '').includes(word) && v.trim()) return v.trim();
  }
  return '';
}
const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', ...extra } });

// Mongolian (Cyrillic) search words → English keywords; both stock sites only understand English well
async function toEnglish(q, env, ctx) {
  if (!q || !/[\u0400-\u04FF]/.test(q) || !env.AI) return q;
  const cache = caches.default, ck = new Request('https://stock.cache/tr/' + encodeURIComponent(q.toLowerCase()));
  const hit = await cache.match(ck);
  if (hit) return (await hit.text()) || q;
  let out = '';
  try {
    const r = await env.AI.run(LLM, { messages: [
      { role: 'system', content: 'Translate the Mongolian stock-photo search query into short English search keywords (1-4 words). Reply with the English words only, no quotes, no explanation.' },
      { role: 'user', content: q }], max_tokens: 20, temperature: 0 });
    out = String((r && (r.response || (r.result && r.result.response))) || '').split('\n')[0].replace(/["'.]/g, '').trim();
  } catch (e) { out = ''; }
  if (!out || /[\u0400-\u04FF]/.test(out)) {
    try { const m = await env.AI.run('@cf/meta/m2m100-1.2b', { text: q, source_lang: 'mn', target_lang: 'en' }); out = String((m && m.translated_text) || '').trim(); } catch (e) { out = ''; }
  }
  out = out.slice(0, 80) || q;
  ctx.waitUntil(cache.put(ck, new Response(out, { headers: { 'cache-control': 'public, max-age=2592000' } })));
  return out;
}

async function search(url, env, ctx) {
  const src = (url.searchParams.get('src') || url.searchParams.get('provider')) === 'pixabay' ? 'pixabay' : 'pexels';
  const type = ['photo', 'vector', 'video'].includes(url.searchParams.get('type')) ? url.searchParams.get('type') : 'photo';
  const qIn = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const q = (await toEnglish(qIn, env, ctx)).slice(0, 100);
  const page = Math.max(1, Math.min(50, parseInt(url.searchParams.get('page') || '1', 10) || 1));
  const key = findKey(env, src === 'pexels' ? 'PEXELS' : 'PIXABAY');
  if (!key) return json({ error: 'no_key', src }, 503);

  // 24h edge cache (Pixabay's API terms ask for caching; also keeps us well under rate limits)
  const cacheKey = new Request(`https://stock.cache/v2/${src}/${type}/${page}/${encodeURIComponent(q.toLowerCase())}`);
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
    // 400 = page past the last result; 429 = rate limit — answer with an empty page / a clear error instead of throwing
    if (r.status === 400) return json({ src, type, page, total: 0, items: [], q: qIn, qEn: q !== qIn ? q : undefined });
    if (!r.ok) return json({ error: r.status === 429 ? 'rate_limit' : 'upstream', status: r.status }, 502);
    let d; try { d = await r.json(); } catch (e) { return json({ error: 'upstream', status: 502 }, 502); }
    total = d.totalHits || 0;
    if (isVid) {
      items = (d.hits || []).map(h => {
        const v = h.videos || {}, med = v.medium || v.small || {}, sm = v.small || v.tiny || med;
        const thumb = med.thumbnail || sm.thumbnail || (v.tiny && v.tiny.thumbnail) || (h.picture_id ? `https://i.vimeocdn.com/video/${h.picture_id}_640x360.jpg` : '');
        return { id: 'pb' + h.id, kind: 'video', thumb, preview: sm.url || med.url, full: (v.large && v.large.url) || med.url || sm.url, w: med.width, h: med.height, dur: h.duration, author: h.user, page: h.pageURL };
      });
    } else {
      // webformat/large links (pixabay.com/get/…) expire after 24h — previewURL (cdn) is the permanent fallback
      items = (d.hits || []).map(h => ({ id: 'pb' + h.id, kind: type, thumb: h.webformatURL || h.previewURL, thumb2: h.previewURL, full: h.largeImageURL || h.webformatURL, full2: h.webformatURL || h.previewURL, w: h.imageWidth, h: h.imageHeight, author: h.user, page: h.pageURL, alt: h.tags }));
    }
  }
  // Pixabay links expire in 24h, so keep its results well under that (edge 12h, browser 10 min)
  const res = json({ src, type, page, total, items, q: qIn, qEn: q !== qIn ? q : undefined }, 200, { 'cache-control': src === 'pixabay' ? 'public, max-age=600, s-maxage=43200' : 'public, max-age=3600, s-maxage=86400' });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

async function file(url, request) {
  let target;
  try { target = new URL(url.searchParams.get('u') || ''); } catch (e) { return json({ error: 'bad_url' }, 400); }
  if (target.protocol !== 'https:' || !MEDIA_HOSTS.some(h => target.hostname === h || target.hostname.endsWith('.' + h))) return json({ error: 'host_not_allowed' }, 403);
  // videos need byte ranges (seeking, looping, Safari won't play without them)
  const range = request && request.headers.get('range');
  const r = await fetch(target.toString(), { headers: range ? { Range: range } : {}, cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!r.ok) return json({ error: 'upstream', status: r.status }, 502);
  const h = new Headers();
  h.set('content-type', r.headers.get('content-type') || 'application/octet-stream');
  ['content-length', 'content-range', 'accept-ranges'].forEach(k => { if (r.headers.get(k)) h.set(k, r.headers.get(k)); });
  if (!h.get('accept-ranges') && /^video\//.test(h.get('content-type'))) h.set('accept-ranges', 'bytes');
  h.set('access-control-allow-origin', '*');
  h.set('access-control-expose-headers', 'content-length, content-range, accept-ranges');
  h.set('cache-control', 'public, max-age=86400');
  const name = url.searchParams.get('dl');
  if (name) h.set('content-disposition', `attachment; filename="${name.replace(/[^\w.\-]+/g, '_')}"`);
  return new Response(r.body, { status: r.status === 206 ? 206 : 200, headers: h });
}

// template videos are stored as a Pexels id; resolve it to a real file here so the key never reaches the browser
async function video(url, env, ctx, request) {
  const id = (url.searchParams.get('id') || '').replace(/\D/g, '').slice(0, 12);
  if (!id) return json({ error: 'bad_id' }, 400);
  const key = findKey(env, 'PEXELS');
  if (!key) return json({ error: 'no_key' }, 503);
  const cache = caches.default, ck = new Request(`https://stock.cache/pexels-video/${id}`);
  let meta = null, hit = await cache.match(ck);
  if (hit) meta = await hit.json();
  else {
    const r = await fetch(`https://api.pexels.com/videos/videos/${id}`, { headers: { Authorization: key } });
    if (!r.ok) return json({ error: 'upstream', status: r.status }, r.status === 404 ? 404 : 502);
    const v = await r.json();
    const files = (v.video_files || []).filter(f => f.file_type === 'video/mp4' && f.link).sort((a, b) => (a.width || 0) - (b.width || 0));
    const long = f => Math.max(f.width || 0, f.height || 0);
    // ~1080p is plenty for a slide and keeps files small; fall back to the biggest one
    const hd = files.find(f => long(f) >= 1800) || files[files.length - 1];
    const sd = files.find(f => long(f) >= 900) || hd;
    if (!hd) return json({ error: 'no_file' }, 404);
    meta = { id: +id, w: v.width, h: v.height, dur: v.duration, image: v.image, hd: hd.link, sd: sd.link, author: v.user && v.user.name, page: v.url };
    ctx.waitUntil(cache.put(ck, json(meta, 200, { 'cache-control': 'public, max-age=86400' })));
  }
  if (url.searchParams.get('info')) return json({ id: meta.id, w: meta.w, h: meta.h, dur: meta.dur, author: meta.author, page: meta.page, file: new URL(meta.hd).hostname }, 200, { 'cache-control': 'public, max-age=3600' });
  // posters: a resized JPEG (Pexels' own image CDN), not the full original; videos: SD for the editor, HD on request
  const pw = Math.max(160, Math.min(1920, parseInt(url.searchParams.get('w') || '1280', 10) || 1280));
  const target = url.searchParams.get('poster') ? meta.image.split('?')[0] + '?auto=compress&cs=tinysrgb&w=' + pw
    : (url.searchParams.get('q') === 'hd' ? meta.hd : meta.sd);
  // stream it straight back (no redirect round-trip; Range requests keep working for seeking)
  const fu = new URL('/api/stock/file', url); fu.search = ''; fu.searchParams.set('u', target);
  return file(fu, request);
}

// ---------- Workers AI ----------
const ALLOWED = /^https?:\/\/(graphican\.online|www\.graphican\.online|[\w-]+\.[\w-]+\.workers\.dev|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)$/;
function allowed(request) {
  const o = request.headers.get('origin') || '';
  return !o || ALLOWED.test(o);
}
async function readJson(request, max) {
  const t = await request.text();
  if (t.length > max) throw new Error('too_large');
  return JSON.parse(t || '{}');
}
async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}
const LANG_NAMES = { en: 'English', mn: 'Mongolian (Cyrillic)', ru: 'Russian', zh: 'Chinese (Simplified)', ja: 'Japanese', ko: 'Korean', de: 'German', fr: 'French',
  es: 'Spanish', it: 'Italian', tr: 'Turkish', kk: 'Kazakh', uk: 'Ukrainian', pl: 'Polish', pt: 'Portuguese', ar: 'Arabic', hi: 'Hindi', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian' };
const LLM = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
// translate a batch of lines with the LLM; returns null if the answer can't be parsed
async function llmBatch(env, lines, source, target) {
  const sys = `You are a professional translator. Translate each item from ${LANG_NAMES[source] || source} to ${LANG_NAMES[target] || target}. ` +
    'Keep numbers, names, e-mails, URLs and codes unchanged. Keep it short and natural, like the original document line. ' +
    'Answer ONLY with a JSON array of strings, same length and order as the input.';
  const r = await env.AI.run(LLM, { messages: [{ role: 'system', content: sys }, { role: 'user', content: JSON.stringify(lines) }], max_tokens: 2400, temperature: 0.1 });
  let t = (r && (r.response || (r.result && r.result.response))) || '';
  if (typeof t !== 'string') t = JSON.stringify(t);
  const m = t.match(/\[[\s\S]*\]/);
  try { const arr = JSON.parse(m ? m[0] : t); if (Array.isArray(arr) && arr.length === lines.length) return arr.map(x => String(x)); } catch (e) {}
  return null;
}
async function m2m(env, t, source, target) {
  if (!t.trim() || !/\p{L}/u.test(t)) return t;
  const r = await env.AI.run('@cf/meta/m2m100-1.2b', { text: t, source_lang: source, target_lang: target });
  return (r && r.translated_text) || t;
}
async function aiTranslate(request, env) {
  if (!env.AI) return json({ error: 'no_ai' }, 503);
  let b;
  try { b = await readJson(request, 60000); } catch (e) { return json({ error: 'bad_request' }, 400); }
  const texts = Array.isArray(b.texts) ? b.texts.slice(0, 250).map(t => String(t || '').slice(0, 1000)) : [];
  const target = String(b.target || 'en').slice(0, 8), source = String(b.source || 'en').slice(0, 8);
  if (!texts.length) return json({ texts: [] });
  if (texts.join('').length > 20000) return json({ error: 'too_large' }, 413);
  try {
    // LLM in chunks (much better for Mongolian); per-line m2m100 as a fallback
    const chunks = [];
    for (let i = 0; i < texts.length; i += 40) chunks.push(texts.slice(i, i + 40));
    const res = await pool(chunks, 3, async ch => {
      const todo = ch.map((t, i) => ({ t, i })).filter(x => x.t.trim() && /\p{L}/u.test(x.t));
      const out = ch.slice();
      if (!todo.length) return out;
      let tr = null;
      try { tr = await llmBatch(env, todo.map(x => x.t), source, target); } catch (e) { tr = null; }
      if (!tr) tr = await pool(todo.map(x => x.t), 6, t => m2m(env, t, source, target));
      todo.forEach((x, k) => { out[x.i] = tr[k] || x.t; });
      return out;
    });
    return json({ texts: [].concat(...res) });
  } catch (e) {
    return json({ error: 'ai_failed', detail: String(e && e.message || e).slice(0, 200) }, 502);
  }
}
async function aiChat(request, env) {
  if (!env.AI) return json({ error: 'no_ai' }, 503);
  let b;
  try { b = await readJson(request, 90000); } catch (e) { return json({ error: 'bad_request' }, 400); }
  const text = String(b.text || '').slice(0, 24000), q = String(b.question || '').slice(0, 1000);
  const lang = b.lang === 'en' ? 'English' : 'Mongolian (Cyrillic script)';
  if (!text.trim()) return json({ error: 'empty' }, 400);
  const sys = b.mode === 'ask'
    ? `You answer questions about a document. Use only the document. If the answer is not in it, say so. Reply in ${lang}, concisely.`
    : `You summarise documents. Write a clear summary in ${lang}: first one sentence on what the document is, then 3-7 short bullet points with the key facts (names, dates, amounts, decisions). No preamble.`;
  const user = (b.mode === 'ask' ? 'Question: ' + q + '\n\n' : '') + 'Document:\n<<<\n' + text + '\n>>>';
  try {
    const r = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', { messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], max_tokens: 900, temperature: 0.2 });
    return json({ answer: (r && (r.response || (r.result && r.result.response))) || '' });
  } catch (e) {
    return json({ error: 'ai_failed', detail: String(e && e.message || e).slice(0, 200) }, 502);
  }
}

// English UI of the site (assets/i18n.js): only strings missing from assets/i18n-en.js land here.
// Each string is translated once and kept in the edge cache for 30 days.
async function i18n(request, env, ctx) {
  let b;
  try { b = await readJson(request, 40000); } catch (e) { return json({ error: 'bad_request' }, 400); }
  const texts = Array.isArray(b.texts) ? b.texts.slice(0, 40).map(t => String(t || '').slice(0, 600)) : [];
  if (!texts.length) return json({ texts: [] });
  const cache = caches.default;
  const keyOf = async t => {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return new Request('https://i18n.cache/v1/en/' + [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join(''));
  };
  const keys = await Promise.all(texts.map(keyOf));
  const out = await Promise.all(keys.map(async k => { const r = await cache.match(k); return r ? r.text() : null; }));
  const miss = out.map((v, i) => (v == null && /[Ѐ-ӿ]/.test(texts[i]) ? i : -1)).filter(i => i >= 0);
  if (miss.length && env.AI) {
    let tr = null;
    try { tr = await llmBatch(env, miss.map(i => texts[i]), 'mn', 'en'); } catch (e) { tr = null; }
    if (tr) miss.forEach((i, k) => {
      const v = String(tr[k] || '').trim();
      if (!v || /[Ѐ-ӿ]/.test(v)) return;
      out[i] = v;
      ctx.waitUntil(cache.put(keys[i], new Response(v, { headers: { 'cache-control': 'public, max-age=2592000' } })));
    });
  }
  return json({ texts: out.map((v, i) => v == null ? texts[i] : v) });
}

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/api/i18n') {
      if (request.method !== 'POST') return json({ error: 'method' }, 405);
      if (!allowed(request)) return json({ error: 'forbidden' }, 403);
      return i18n(request, env, ctx);
    }
    const url = new URL(request.url);
    if (url.pathname === '/api/stock') return search(url, env, ctx);
    if (url.pathname === '/api/stock/file') return file(url, request);
    if (url.pathname === '/api/stock/video') return video(url, env, ctx, request);
    if (url.pathname === '/api/stock/health') // names only — never values
      return json({ pexels: !!findKey(env, 'PEXELS'), pixabay: !!findKey(env, 'PIXABAY'), names: Object.keys(env).filter(n => n !== 'ASSETS' && n !== 'AI'), ai: !!env.AI }, 200, { 'cache-control': 'no-store' });
    if (url.pathname === '/api/ai/ping') { // quick live check of the AI binding
      if (!env.AI) return json({ ai: false }, 503, { 'cache-control': 'no-store' });
      try { const r = await llmBatch(env, ['Good morning', 'Total amount due', 'Contract end date'], 'en', 'mn'); return json({ ai: true, sample: r }, 200, { 'cache-control': 'no-store' }); }
      catch (e) { return json({ ai: true, error: String(e && e.message || e).slice(0, 200) }, 502, { 'cache-control': 'no-store' }); }
    }
    if (url.pathname === '/api/ai/translate' || url.pathname === '/api/ai/chat') {
      if (request.method !== 'POST') return json({ error: 'method' }, 405);
      if (!allowed(request)) return json({ error: 'forbidden' }, 403);
      return url.pathname === '/api/ai/chat' ? aiChat(request, env) : aiTranslate(request, env);
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  }
};
