#!/usr/bin/env python3
"""Render the home page's photo-template previews → assets/home/tplp-<id>.webp

The photo templates pull their pictures from Pexels' CDN, so the previews are drawn here in CI with the same code the
editor uses (fabric + assets/templates.js) in headless Chromium. A template whose photo or render fails is skipped; the
home page then keeps its drawn fallback for that slot (see TPL_SLOTS in home_page.py). Re-renders when templates.js changes.
"""
import base64, hashlib, http.server, json, os, socketserver, sys, threading

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.dirname(__file__))
from home_page import TPL_SLOTS  # noqa: E402

OUT = os.path.join(ROOT, "assets", "home")
STAMP = os.path.join(OUT, "tplp.json")
WIDTH = 360

JS = """
async ([id, W]) => {
  const T = window.GTPL, t = T.get(id); if (!t) return { err: 'no template' };
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = T.cssUrl(t); document.head.appendChild(l);
  await new Promise(r => { l.onload = l.onerror = r; setTimeout(r, 8000); });
  const objs = await T.build(t, 0, 0, null, 700);
  const need = {};
  objs.forEach(o => { if (!o.fontFamily) return; const fam = (o.fontFamily.match(/"([^"]+)"/) || [0, o.fontFamily])[1];
    need[(o.fontStyle === 'italic' ? 'italic ' : '') + (o.fontWeight || 400) + ' 40px "' + fam + '"'] = 1; });
  await Promise.all(Object.keys(need).map(k => document.fonts.load(k, 'АаӨөҮү').catch(() => {})));
  const k = W / t.w, el = document.createElement('canvas');
  const c = new fabric.StaticCanvas(el, { width: Math.round(t.w * k), height: Math.round(t.h * k), backgroundColor: t.bg, renderOnAddRemove: false, enableRetinaScaling: false });
  c.setZoom(k);
  objs.forEach(o => { if (o.initDimensions) o.initDimensions(); c.add(o); });
  c.renderAll();
  await new Promise(r => setTimeout(r, 300)); c.renderAll();
  return { url: c.lowerCanvasEl.toDataURL('image/webp', 0.86), w: c.width, h: c.height };
}
"""


def main():
    from playwright.sync_api import sync_playwright
    src = open(os.path.join(ROOT, "assets", "templates.js"), "rb").read()
    sig = hashlib.sha1(src).hexdigest()[:12]
    try: old = json.load(open(STAMP))
    except Exception: old = {}
    fresh = old.get("sig") == sig
    todo = [s[0] for s in TPL_SLOTS if not (fresh and os.path.exists(os.path.join(OUT, f"tplp-{s[0]}.webp")))]
    if not todo: print("template previews: up to date"); return

    os.chdir(ROOT)
    handler = lambda *a, **k: http.server.SimpleHTTPRequestHandler(*a, **k)  # noqa: E731
    http.server.SimpleHTTPRequestHandler.log_message = lambda *a, **k: None
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler); port = srv.server_address[1]
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    fake = os.environ.get("TPL_FAKE_PHOTO")   # local dry run without network: every photo is this file
    made = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        bad = []
        pg.on("requestfailed", lambda r: bad.append(r.url) if "pexels.com" in r.url else None)
        pg.on("response", lambda r: bad.append(r.url) if "pexels.com" in r.url and r.status >= 400 else None)
        if fake:
            body = open(fake, "rb").read()
            pg.route("**://images.pexels.com/**", lambda r: r.fulfill(body=body, content_type="image/jpeg", headers={"access-control-allow-origin": "*"}))
            pg.route("**://fonts.googleapis.com/**", lambda r: r.abort())
        pg.goto(f"http://127.0.0.1:{port}/tools/templates/", wait_until="domcontentloaded")
        pg.wait_for_function("window.GTPL && window.fabric", timeout=30000)
        for tid in todo:
            del bad[:]
            try: res = pg.evaluate(JS, [tid, WIDTH])
            except Exception as ex: print("skip", tid, "—", str(ex)[:160]); continue
            if bad or not res.get("url", "").startswith("data:image/webp"): print("skip", tid, "—", (bad or [res.get("err", "no image")])[0][:160]); continue
            data = base64.b64decode(res["url"].split(",", 1)[1])
            if len(data) < 3000: print("skip", tid, "— empty render"); continue
            open(os.path.join(OUT, f"tplp-{tid}.webp"), "wb").write(data); made += 1
        b.close()
    srv.shutdown()
    if made == len(todo): json.dump({"sig": sig}, open(STAMP, "w"))
    print(f"template previews: {made}/{len(todo)} rendered")


if __name__ == "__main__":
    main()
