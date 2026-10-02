/*
  Graphican Worker — serves the static site and a small stock-media API for /editor.
  Keys live in Cloudflare secrets (never in the browser):  PEXELS_KEY, PIXABAY_KEY
    GET /api/stock?src=pexels|pixabay&type=photo|vector|video&q=&page=
    GET /api/stock/file?u=<media url>          (CORS proxy so images can be used/exported on the canvas; Range-aware for video)
    GET /api/stock/video?id=<pexels id>[&poster=1|&info=1]   (template videos: redirects to the HD mp4 / poster through the proxy)
    GET /api/music?q=&cat=music|sound_effect&page=&com=1   (free Creative Commons music / sound effects from Openverse — Jamendo, Freesound, ccMixter…)
    GET /api/fetch?u=<https url>               (video editor "add from link": a direct audio / video / image file, same-site callers only)
    POST /api/ai/transcribe?lang=mn|en|ru|     body: 16 kHz mono WAV (≤ 8 MB) → {text, words:[{w, s, e}]}   (video editor auto captions, Whisper)
  Workers AI (binding "AI" in wrangler.jsonc) for the PDF editor:
    POST /api/ai/translate  {texts:[...], source, target}  -> {texts:[...]}   (per-line edge cache → Microsoft Translator if AZURE_TRANSLATOR_KEY is set → Llama 3.3 → m2m100)
    GET  /api/ai/ping[?az=1]  live check of Workers AI, or with az=1 of Microsoft Translator (key, region, quota)
    POST /api/i18n          {texts:[...]} -> {texts:[...]}   (site English UI: strings missing from assets/i18n-en.js, edge-cached)
    POST /api/ai/chat       {mode:'summary'|'ask', text, question, lang} -> {answer}
*/
const MEDIA_HOSTS = ['images.pexels.com', 'videos.pexels.com', 'player.vimeo.com', 'i.vimeocdn.com', 'cdn.pixabay.com', 'pixabay.com',
  // Openverse audio sources (music library of the video editor)
  'jamendo.com', 'freesound.org', 'ccmixter.org', 'wikimedia.org', 'openverse.org', 'freemusicarchive.org'];
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

// one provider hits its rate limit (Pexels 200/h, Pixabay 100/min) or is down → answer from the other one
async function search(url, env, ctx) {
  const want = (url.searchParams.get('src') || url.searchParams.get('provider')) === 'pixabay' ? 'pixabay' : 'pexels';
  const res = await searchFrom(want, url, env, ctx);
  if (res.status === 200 || url.searchParams.get('nofb')) return res;
  const other = want === 'pexels' ? 'pixabay' : 'pexels';
  if (other === 'pexels' && url.searchParams.get('type') === 'vector') return res;     // only Pixabay has vectors
  let err = {}; try { err = await res.clone().json(); } catch (e) {}
  if (!['rate_limit', 'upstream', 'no_key'].includes(err.error)) return res;
  const alt = await searchFrom(other, url, env, ctx);
  if (alt.status !== 200) return res;
  const d = await alt.json(); d.fallback = want;
  return json(d, 200, { 'cache-control': 'no-store' });
}
// Pixabay's profile pages live at /users/<name>-<id>/
const pbUser = h => h.user && h.user_id ? `https://pixabay.com/users/${encodeURIComponent(h.user)}-${h.user_id}/` : '';
async function searchFrom(src, url, env, ctx) {
  const type = ['photo', 'vector', 'video'].includes(url.searchParams.get('type')) ? url.searchParams.get('type') : 'photo';
  const qIn = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const q = (await toEnglish(qIn, env, ctx)).slice(0, 100);
  const page = Math.max(1, Math.min(50, parseInt(url.searchParams.get('page') || '1', 10) || 1));
  const key = findKey(env, src === 'pexels' ? 'PEXELS' : 'PIXABAY');
  if (!key) return json({ error: 'no_key', src }, 503);

  // 24h edge cache (Pixabay's API terms ask for caching; also keeps us well under rate limits)
  const cacheKey = new Request(`https://stock.cache/v3/${src}/${type}/${page}/${encodeURIComponent(q.toLowerCase())}`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let items = [], total = 0;
  if (src === 'pexels') {
    if (type === 'vector') return json({ src, items: [], total: 0, note: 'Pexels-д вектор байхгүй' });
    const base = type === 'video' ? 'https://api.pexels.com/videos/' : 'https://api.pexels.com/v1/';
    const ep = q ? `${base}search?query=${encodeURIComponent(q)}&` : (type === 'video' ? `${base}popular?` : `${base}curated?`);
    const r = await fetch(`${ep}per_page=30&page=${page}`, { headers: { Authorization: key } });
    if (!r.ok) return json({ error: r.status === 429 ? 'rate_limit' : 'upstream', status: r.status }, 502);
    const d = await r.json();
    total = d.total_results || 0;
    if (type === 'video') {
      items = (d.videos || []).map(v => {
        const files = (v.video_files || []).filter(f => f.file_type === 'video/mp4').sort((a, b) => (a.width || 0) - (b.width || 0));
        const hd = files.find(f => (f.width || 0) >= 1280) || files[files.length - 1] || {};
        const sm = files.find(f => (f.width || 0) >= 540) || files[0] || {};
        return { id: 'px' + v.id, kind: 'video', thumb: v.image, preview: sm.link, full: hd.link, w: v.width, h: v.height, dur: v.duration, author: v.user && v.user.name, authorUrl: v.user && v.user.url, page: v.url };
      });
    } else {
      items = (d.photos || []).map(p => ({ id: 'px' + p.id, kind: 'photo', thumb: p.src.medium, full: p.src.large2x || p.src.original, w: p.width, h: p.height, author: p.photographer, authorUrl: p.photographer_url, page: p.url, alt: p.alt }));
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
        return { id: 'pb' + h.id, kind: 'video', thumb, preview: sm.url || med.url, full: (v.large && v.large.url) || med.url || sm.url, w: med.width, h: med.height, dur: h.duration, author: h.user, authorUrl: pbUser(h), page: h.pageURL };
      });
    } else {
      // webformat/large links (pixabay.com/get/…) expire after 24h — previewURL (cdn) is the permanent fallback
      items = (d.hits || []).map(h => ({ id: 'pb' + h.id, kind: type, thumb: h.webformatURL || h.previewURL, thumb2: h.previewURL, full: h.largeImageURL || h.webformatURL, full2: h.webformatURL || h.previewURL, w: h.imageWidth, h: h.imageHeight, author: h.user, authorUrl: pbUser(h), page: h.pageURL, alt: h.tags }));
    }
  }
  // Pixabay's API terms: identical searches are cached for 24 hours (edge 24h, browser 1h)
  const res = json({ src, type, page, total, items, q: qIn, qEn: q !== qIn ? q : undefined }, 200, { 'cache-control': src === 'pixabay' ? 'public, max-age=3600, s-maxage=86400' : 'public, max-age=3600, s-maxage=86400' });
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
  // photos on Pexels / Pixabay never change under the same URL: let browsers keep them a month (no repeat Worker request)
  h.set('cache-control', /^image\//.test(h.get('content-type')) ? 'public, max-age=2592000, immutable' : 'public, max-age=86400');
  const name = url.searchParams.get('dl');
  if (name) h.set('content-disposition', `attachment; filename="${name.replace(/[^\w.\-]+/g, '_')}"`);
  return new Response(r.body, { status: r.status === 206 ? 206 : 200, headers: h });
}

// free music / sound effects: Openverse (CC-licensed audio, no key needed), 24h edge cache
async function music(url, env, ctx) {
  const qIn = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const q = (await toEnglish(qIn, env, ctx)).slice(0, 100);
  const cat = url.searchParams.get('cat') === 'sound_effect' ? 'sound_effect' : 'music';
  const page = Math.max(1, Math.min(20, parseInt(url.searchParams.get('page') || '1', 10) || 1));
  const com = url.searchParams.get('com') === '1';
  const ck = new Request(`https://stock.cache/music/v1/${cat}/${com ? 1 : 0}/${page}/${encodeURIComponent(q.toLowerCase())}`);
  const cache = caches.default, hit = await cache.match(ck);
  if (hit) return hit;
  const u = new URL('https://api.openverse.org/v1/audio/');
  u.searchParams.set('q', q || (cat === 'music' ? 'background music' : 'whoosh'));
  u.searchParams.set('category', cat); u.searchParams.set('page', page); u.searchParams.set('page_size', '20');
  u.searchParams.set('mature', 'false');
  if (com) u.searchParams.set('license_type', 'commercial');
  const r = await fetch(u.toString(), { headers: { 'User-Agent': 'Graphican/1.0 (https://graphican.online; video editor music library)', Accept: 'application/json' } });
  if (r.status === 400 || r.status === 404) return json({ items: [], page, q: qIn });
  if (!r.ok) return json({ error: r.status === 429 ? 'rate_limit' : 'upstream', status: r.status }, 502);
  const d = await r.json();
  const items = (d.results || []).filter(a => a.url && /^https:/.test(a.url) && MEDIA_HOSTS.some(h => { try { const n = new URL(a.url).hostname; return n === h || n.endsWith('.' + h); } catch (e) { return false; } }))
    .map(a => ({ id: a.id, title: a.title || 'Нэргүй', author: a.creator || '', authorUrl: a.creator_url || '', page: a.foreign_landing_url || '', file: a.url,
      dur: a.duration ? Math.round(a.duration / 1000) : 0, license: (a.license || '').toUpperCase() + (a.license_version ? ' ' + a.license_version : ''), licenseUrl: a.license_url || '',
      source: a.source || a.provider || '', genres: (a.genres || []).slice(0, 3), type: a.filetype || '' }));
  const res = json({ items, page, total: d.result_count || 0, q: qIn, qEn: q !== qIn ? q : undefined }, 200, { 'cache-control': 'public, max-age=3600, s-maxage=86400' });
  ctx.waitUntil(cache.put(ck, res.clone()));
  return res;
}
// "add from link" in the video editor: any direct https media file, but only for this site's own pages and only media types
async function fetchMedia(url, request) {
  const site = request.headers.get('sec-fetch-site'), o = request.headers.get('origin') || '';
  if (!(site === 'same-origin' || ALLOWED.test(o))) return json({ error: 'forbidden' }, 403);
  let t; try { t = new URL(url.searchParams.get('u') || ''); } catch (e) { return json({ error: 'bad_url' }, 400); }
  if (!/^https?:$/.test(t.protocol) || /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(t.hostname)) return json({ error: 'bad_url' }, 400);
  const range = request.headers.get('range');
  let r;
  try { r = await fetch(t.toString(), { headers: range ? { Range: range } : {}, redirect: 'follow' }); } catch (e) { return json({ error: 'unreachable' }, 502); }
  if (!r.ok) return json({ error: 'upstream', status: r.status }, 502);
  const type = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!/^(audio|video|image)\//.test(type)) return json({ error: 'not_media', type }, 415);
  const len = +(r.headers.get('content-length') || 0);
  if (len > 150 * 1048576) return json({ error: 'too_large' }, 413);
  const h = new Headers({ 'content-type': type, 'access-control-allow-origin': '*', 'cache-control': 'private, max-age=3600' });
  ['content-length', 'content-range', 'accept-ranges'].forEach(k => { if (r.headers.get(k)) h.set(k, r.headers.get(k)); });
  return new Response(r.body, { status: r.status === 206 ? 206 : 200, headers: h });
}

// auto captions: a short WAV from the video editor → words with times (Whisper large v3 turbo; the base model as a fallback)
function b64(buf) { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
async function transcribe(url, request, env) {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  if (!allowed(request)) return json({ error: 'forbidden' }, 403);
  if (!env.AI) return json({ error: 'no_ai' }, 503);
  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return json({ error: 'empty' }, 400);
  if (buf.byteLength > 8 * 1048576) return json({ error: 'too_large' }, 413);
  const lang = /^[a-z]{2}$/.test(url.searchParams.get('lang') || '') ? url.searchParams.get('lang') : undefined;
  let r = null, words = [];
  try {
    r = await env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio: b64(buf), task: 'transcribe', language: lang, vad_filter: true });
    (r.segments || []).forEach(sg => {
      if (sg.words && sg.words.length) sg.words.forEach(w => words.push({ w: String(w.word || '').trim(), s: w.start, e: w.end }));
      else { // no word times: spread the segment's words over it
        const ws = String(sg.text || '').trim().split(/\s+/).filter(Boolean), d = (sg.end - sg.start) / Math.max(1, ws.length);
        ws.forEach((w, i) => words.push({ w, s: sg.start + i * d, e: sg.start + (i + 1) * d }));
      }
    });
  } catch (e) { r = null; }
  if (!r) {
    try { r = await env.AI.run('@cf/openai/whisper', { audio: [...new Uint8Array(buf)] }); (r.words || []).forEach(w => words.push({ w: String(w.word || '').trim(), s: w.start, e: w.end })); }
    catch (e) { return json({ error: 'ai_failed', message: String(e && e.message || e).slice(0, 200) }, 502); }
  }
  words = words.filter(w => w.w && isFinite(w.s) && isFinite(w.e));
  return json({ text: r.text || words.map(w => w.w).join(' '), words, lang: (r.transcription_info && r.transcription_info.language) || lang || '' }, 200, { 'cache-control': 'no-store' });
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
// PDF translation switch. false = /api/ai/translate answers 503 {error:'disabled'} and /tools/translate-pdf/ redirects to the PDF editor.
// To turn it back on: set true here and in assets/pdfedit.js, and remove the translate-pdf rule from assets/style.css and assets/pdfedit.css.
const TRANSLATE_ON = false;
const ALLOWED = /^https?:\/\/(graphican\.online|www\.graphican\.online|[\w-]+\.[\w-]+\.workers\.dev|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)$/;
function allowed(request) {
  const o = request.headers.get('origin') || '';
  return ALLOWED.test(o);
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
async function llmBatch(env, lines, source, target, model) {
  const sys = `You are a professional translator. Translate each item from ${LANG_NAMES[source] || source} to ${LANG_NAMES[target] || target}. ` +
    'Keep numbers, names, e-mails, URLs and codes unchanged. Keep it short and natural, like the original document line. ' +
    'Answer ONLY with a JSON array of strings, same length and order as the input.';
  const r = await env.AI.run(model || LLM, { messages: [{ role: 'system', content: sys }, { role: 'user', content: JSON.stringify(lines) }], max_tokens: 2400, temperature: 0.1 });
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
// ---- translation: edge cache per line → Microsoft Translator (free 2M chars/month, if a key is set) → Workers AI ----
// Secrets (optional): AZURE_TRANSLATOR_KEY, AZURE_TRANSLATOR_REGION (e.g. "eastasia"; leave empty for a global resource)
const AZ_LANG = { mn: 'mn-Cyrl', zh: 'zh-Hans' };
function azKey(env) {
  for (const n of ['AZURE_TRANSLATOR_KEY', 'AZURE_KEY', 'TRANSLATOR_KEY']) if (typeof env[n] === 'string' && env[n].trim()) return env[n].trim();
  const n = Object.keys(env).find(k => /AZURE|TRANSLATOR/i.test(k) && /KEY/i.test(k) && typeof env[k] === 'string' && env[k].trim());
  return n ? env[n].trim() : '';
}
// After an error Azure is skipped for a while (429: 1 min, 401 bad key/region: 10 min, 403 monthly quota: 30 min)
// so a used-up free tier doesn't cost every request an extra round-trip; Workers AI covers the gap.
const AZ_OFF = new Request('https://az.cache/off');
const AZ_PAUSE = { 401: 600, 403: 1800, 429: 60 };
// info (optional, for /api/ai/ping?az=1): ignores the pause and reports {status, error}
async function azureBatch(env, lines, source, target, info) {
  const key = azKey(env);
  if (!key) { if (info) info.error = 'no_key'; return null; }
  if (!info && await caches.default.match(AZ_OFF)) return null;
  const region = (env.AZURE_TRANSLATOR_REGION || env.AZURE_REGION || '').trim();
  const out = [];
  for (let i = 0; i < lines.length; i += 100) {            // ≤100 items and well under 50k chars per call
    const part = lines.slice(i, i + 100);
    const u = 'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=' + (AZ_LANG[source] || source) + '&to=' + (AZ_LANG[target] || target);
    const h = { 'Ocp-Apim-Subscription-Key': key, 'content-type': 'application/json' };
    if (region) h['Ocp-Apim-Subscription-Region'] = region;
    const r = await fetch(u, { method: 'POST', headers: h, body: JSON.stringify(part.map(t => ({ Text: t }))) });
    if (info) info.status = r.status;
    if (!r.ok) {
      const body = (await r.text().catch(() => '')).slice(0, 300);
      console.log(JSON.stringify({ azure: r.status, region: region || 'global', from: source, to: target, chars: part.join('').length, body }));
      if (info) info.error = body;
      else if (AZ_PAUSE[r.status]) await caches.default.put(AZ_OFF, new Response(String(r.status), { headers: { 'cache-control': 'public, max-age=' + AZ_PAUSE[r.status] } }));
      return null;
    }
    const d = await r.json();
    if (!Array.isArray(d) || d.length !== part.length) { if (info) info.error = 'bad_response'; return null; }
    d.forEach(x => out.push(String((x && x.translations && x.translations[0] && x.translations[0].text) || '')));
  }
  return out;
}
async function trKey(text, source, target) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source + '>' + target + '\n' + text));
  return new Request('https://tr.cache/v1/' + [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join(''));
}
// translate unique lines; returns array (same order). Cached lines cost nothing.
async function translateLines(env, ctx, lines, source, target) {
  const cache = caches.default, out = lines.slice();
  const todo = [];
  await Promise.all(lines.map(async (t, i) => {
    if (!t.trim() || !/\p{L}/u.test(t)) return;
    const k = await trKey(t, source, target), hit = await cache.match(k);
    if (hit) out[i] = await hit.text(); else todo.push({ i, t, k });
  }));
  if (!todo.length) return out;
  let tr = null;
  try { tr = await azureBatch(env, todo.map(x => x.t), source, target); } catch (e) { tr = null; }
  if (!tr && env.AI) {
    tr = [];
    const chunks = [];
    for (let i = 0; i < todo.length; i += 40) chunks.push(todo.slice(i, i + 40));
    const res = await pool(chunks, 3, async ch => {
      let r = null;
      try { r = await llmBatch(env, ch.map(x => x.t), source, target); } catch (e) { r = null; }
      if (!r) r = await pool(ch.map(x => x.t), 6, t => m2m(env, t, source, target));
      return r;
    });
    tr = [].concat(...res);
  }
  if (!tr) throw new Error('no_translator');
  todo.forEach((x, k) => {
    const v = String(tr[k] || '').trim();
    if (!v) return;
    out[x.i] = v;
    ctx.waitUntil(cache.put(x.k, new Response(v, { headers: { 'cache-control': 'public, max-age=2592000' } })));
  });
  return out;
}

// light abuse guard per visitor IP (per data centre, approximate — enough to stop scripts burning the daily AI allowance)
async function overLimit(request, name, perMin, perDay) {
  const ip = request.headers.get('cf-connecting-ip') || 'x', cache = caches.default, now = Date.now();
  const win = [['m', Math.floor(now / 60000), perMin, 90], ['d', Math.floor(now / 864e5), perDay, 90000]];
  for (const [w, slot, max, ttl] of win) {
    const k = new Request(`https://rl.cache/${name}/${w}/${slot}/${ip}`);
    const hit = await cache.match(k), n = hit ? +(await hit.text()) || 0 : 0;
    if (n >= max) return true;
    await cache.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'public, max-age=' + ttl } }));
  }
  return false;
}

async function aiTranslate(request, env, ctx) {
  if (!env.AI && !azKey(env)) return json({ error: 'no_ai' }, 503);
  let b;
  try { b = await readJson(request, 60000); } catch (e) { return json({ error: 'bad_request' }, 400); }
  const texts = Array.isArray(b.texts) ? b.texts.slice(0, 250).map(t => String(t || '').slice(0, 1000)) : [];
  const target = String(b.target || 'en').slice(0, 8), source = String(b.source || 'en').slice(0, 8);
  if (!texts.length) return json({ texts: [] });
  if (texts.join('').length > 20000) return json({ error: 'too_large' }, 413);
  try {
    const uniq = [...new Set(texts)], tr = await translateLines(env, ctx, uniq, source, target), map = new Map(uniq.map((t, i) => [t, tr[i]]));
    return json({ texts: texts.map(t => map.get(t) || t) });
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
  if (miss.length && (env.AI || azKey(env))) {
    let tr = null;
    try { tr = await azureBatch(env, miss.map(i => texts[i]), 'mn', 'en'); } catch (e) { tr = null; }
    if (!tr) try { tr = await llmBatch(env, miss.map(i => texts[i]), 'mn', 'en'); } catch (e) { tr = null; }
    if (tr) miss.forEach((i, k) => {
      const v = String(tr[k] || '').trim();
      if (!v || /[Ѐ-ӿ]/.test(v)) return;
      out[i] = v;
      ctx.waitUntil(cache.put(keys[i], new Response(v, { headers: { 'cache-control': 'public, max-age=2592000' } })));
    });
  }
  return json({ texts: out.map((v, i) => v == null ? texts[i] : v) });
}

// anonymous client events → Workers Logs (no storage of our own): {t:'err'|'dl', page, msg?, src?, line?}
async function clientLog(request, env, ctx) {
  if (request.method !== 'POST' || !allowed(request)) return new Response(null, { status: 204 });
  if (await overLimit(request, 'log', 20, 300)) return new Response(null, { status: 204 });
  let b = {};
  try { const t = await request.text(); if (t.length > 4000) return new Response(null, { status: 204 }); b = JSON.parse(t || '{}'); } catch (e) { return new Response(null, { status: 204 }); }
  if (b.t === 'dl' && /^\/(?:editor|slides|design|video|tools(?:\/[a-z0-9-]+)?)(?:\/)?$/.test(b.page || '') && env.DOWNLOADS) {
    const counter = env.DOWNLOADS.get(env.DOWNLOADS.idFromName('public-downloads'));
    ctx.waitUntil(counter.fetch('https://counter/increment', { method: 'POST' }).catch(() => console.log('download_counter_unavailable')));
  }
  const cut = (v, n) => String(v == null ? '' : v).slice(0, n);
  const ua = request.headers.get('user-agent') || '';
  const dev = /iPhone|iPad/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : /Mac OS/.test(ua) ? 'mac' : /Windows/.test(ua) ? 'windows' : 'other';
  const br = /Edg\//.test(ua) ? 'edge' : /Firefox\//.test(ua) ? 'firefox' : /CriOS|Chrome\//.test(ua) ? 'chrome' : /Safari\//.test(ua) ? 'safari' : 'other';
  console.log(JSON.stringify({ client: cut(b.t, 8), page: cut(b.page, 120), tool: cut(b.tool, 40), msg: cut(b.msg, 300), src: cut(b.src, 160), line: +b.line || 0,
    dev, br, country: (request.cf && request.cf.country) || '' }));
  return new Response(null, { status: 204 });
}

export default {
  async fetch(request, env, ctx) {
    if (new URL(request.url).pathname === '/api/i18n') {
      if (request.method !== 'POST') return json({ error: 'method' }, 405);
      if (!allowed(request)) return json({ error: 'forbidden' }, 403);
      return i18n(request, env, ctx);
    }
    const url = new URL(request.url);
    if (url.pathname.startsWith('/tools/translate-pdf')) {
      if (!TRANSLATE_ON) return Response.redirect(new URL('/tools/pdfedit/', url).toString(), 302);
      return env.ASSETS.fetch(request);
    }
    if (url.pathname === '/api/log') return clientLog(request, env, ctx);
    if (url.pathname === '/api/stats') {
      if (request.method !== 'GET') return json({ error: 'method' }, 405);
      if (!env.DOWNLOADS) return json({ error: 'unavailable' }, 503, { 'cache-control': 'no-store' });
      try {
        const counter = env.DOWNLOADS.get(env.DOWNLOADS.idFromName('public-downloads'));
        const response = await counter.fetch('https://counter/stats');
        if (!response.ok) throw new Error('counter');
        return json(await response.json(), 200, { 'cache-control': 'public, max-age=60' });
      } catch (e) { return json({ error: 'unavailable' }, 503, { 'cache-control': 'no-store' }); }
    }
    if (url.pathname === '/api/stock') return search(url, env, ctx);
    if (url.pathname === '/api/stock/file') return file(url, request);
    if (url.pathname === '/api/stock/video') return video(url, env, ctx, request);
    if (url.pathname === '/api/music') return music(url, env, ctx);
    if (url.pathname === '/api/music/file') return file(url, request);
    if (url.pathname === '/api/fetch') return fetchMedia(url, request);
    if (url.pathname === '/api/ai/transcribe') return transcribe(url, request, env);
    if (url.pathname === '/api/stock/health') // names only — never values
      return json({ pexels: !!findKey(env, 'PEXELS'), pixabay: !!findKey(env, 'PIXABAY'), azure: !!azKey(env), azureRegion: (env.AZURE_TRANSLATOR_REGION || env.AZURE_REGION || '').trim() || 'global', names: Object.keys(env).filter(n => n !== 'ASSETS' && n !== 'AI'), ai: !!env.AI }, 200, { 'cache-control': 'no-store' });
    if (url.pathname === '/api/ai/ping' && url.searchParams.get('az')) { // live check of Microsoft Translator (key, region, quota)
      if (await overLimit(request, 'ping', 4, 20)) return json({ error: 'rate_limit' }, 429, { 'cache-control': 'no-store' });
      const info = {}, t0 = Date.now();
      let r = null, r2 = null;
      try {
        r = await azureBatch(env, ['Good morning', 'Total amount due', 'Please sign both copies and return them by Friday.'], 'en', 'mn', info);
        if (r) r2 = await azureBatch(env, ['Гэрээний хугацаа дууссаны дараа талууд харилцан тохиролцож сунгаж болно.', 'Нийт төлөх дүн'], 'mn', 'en', info);
      } catch (e) { info.error = String(e && e.message || e).slice(0, 200); }
      const paused = await caches.default.match(AZ_OFF);
      return json({ azure: !!(r && r2), key: !!azKey(env), region: (env.AZURE_TRANSLATOR_REGION || env.AZURE_REGION || '').trim() || 'global',
        status: info.status || 0, error: info.error || '', paused: paused ? +(await paused.text()) : 0, ms: Date.now() - t0, sample: r, back: r2 },
        r && r2 ? 200 : 502, { 'cache-control': 'no-store' });
    }
    if (url.pathname === '/api/ai/ping') { // quick live check of the AI binding
      if (!env.AI) return json({ ai: false }, 503, { 'cache-control': 'no-store' });
      if (await overLimit(request, 'ping', 4, 20)) return json({ error: 'rate_limit' }, 429, { 'cache-control': 'no-store' });
      // ?m=<alias> compares models on the same sample (both directions)
      const MODELS = { llama70: LLM, gemma4: '@cf/google/gemma-4-26b-a4b-it', gemma3: '@cf/google/gemma-3-12b-it', gptoss20: '@cf/openai/gpt-oss-20b', qwen3: '@cf/qwen/qwen3-30b-a3b-fp8', scout: '@cf/meta/llama-4-scout-17b-16e-instruct', mistral: '@cf/mistralai/mistral-small-3.1-24b-instruct' };
      const mdl = MODELS[url.searchParams.get('m')] || LLM;
      try {
        const t0 = Date.now();
        const r = await llmBatch(env, ['Good morning', 'Total amount due', 'Contract end date', 'Please sign both copies and return them by Friday.'], 'en', 'mn', mdl);
        const r2 = await llmBatch(env, ['Гэрээний хугацаа дууссаны дараа талууд харилцан тохиролцож сунгаж болно.', 'Нийт төлөх дүн', 'Уулын бэлд байрлах жижиг гэр'], 'mn', 'en', mdl);
        return json({ ai: true, model: mdl, ms: Date.now() - t0, sample: r, back: r2 }, 200, { 'cache-control': 'no-store' });
      }
      catch (e) { return json({ ai: true, error: String(e && e.message || e).slice(0, 200) }, 502, { 'cache-control': 'no-store' }); }
    }
    if (url.pathname === '/api/ai/translate' || url.pathname === '/api/ai/chat') {
      if (request.method !== 'POST') return json({ error: 'method' }, 405);
      if (!allowed(request)) return json({ error: 'forbidden' }, 403);
      const chat = url.pathname === '/api/ai/chat';
      if (!chat && !TRANSLATE_ON) return json({ error: 'disabled' }, 503, { 'cache-control': 'no-store' });
      if (await overLimit(request, chat ? 'chat' : 'tr', chat ? 6 : 30, chat ? 40 : 400)) return json({ error: 'rate_limit' }, 429, { 'retry-after': '60' });
      return chat ? aiChat(request, env) : aiTranslate(request, env, ctx);
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(request);
  }
};

// One aggregate only; no personal data or file contents.
export class DownloadCounter {
  constructor(state) { this.state = state; }
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path === '/increment' && request.method === 'POST') {
      await this.state.storage.transaction(async tx => {
        const downloads = await tx.get('downloads') || 0;
        await tx.put('downloads', downloads + 1);
      });
      return new Response(null, { status: 204 });
    }
    if (path === '/stats' && request.method === 'GET') {
      return Response.json({ downloads: await this.state.storage.get('downloads') || 0, since: '2026-10-02' });
    }
    return new Response(null, { status: 404 });
  }
}
