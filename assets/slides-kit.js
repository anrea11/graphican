/* Graphican — slide kit for /slides/: charts, tables, mockups, icons and diagrams.
   Charts and tables are fabric groups carrying their data (gChart / gTable); on «PowerPoint (.pptx)» export
   they become real, editable PowerPoint charts and tables (see exportPptx in editor.js).
   Mockups (gMockup) are vector device / print / browser frames with a photo inside. */
(function () {
  'use strict';
  function E() { return window.GEditor; }
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ================= colours =================
  var PALS = [
    ['Graphican', ['#6d56fa', '#a497ff', '#34229e', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#ec4899']],
    ['Далай', ['#0ea5e9', '#0369a1', '#38bdf8', '#64748b', '#f97316', '#84cc16', '#a855f7', '#f43f5e']],
    ['Нар', ['#f97316', '#facc15', '#ef4444', '#9a3412', '#fb7185', '#84cc16', '#0ea5e9', '#6366f1']],
    ['Ногоон', ['#059669', '#34d399', '#065f46', '#a3e635', '#0ea5e9', '#f59e0b', '#6366f1', '#f43f5e']],
    ['Монохром', ['#111827', '#4b5563', '#9ca3af', '#d1d5db', '#6d56fa', '#ef4444', '#10b981', '#f59e0b']]
  ];
  function palOf(m) { return (PALS[m.pal] || PALS[0])[1]; }
  function inkFor(o, m) {
    var ed = E(), f = (o && ed.frameOf(o)) || ed.page().f, dark = ed.isDark(ed.frameFill(f));
    if (m && m.theme === 'dark') dark = true; if (m && m.theme === 'light') dark = false;
    return dark ? { ink: '#f3f4f6', muted: '#cbd5e1', grid: '#4b5563', dark: true } : { ink: '#1f2937', muted: '#6b7280', grid: '#e5e7eb', dark: false };
  }
  function fontOf(m) { return m.font || (E().currentPair().body || 'Inter'); }

  // ================= numbers =================
  function toNum(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var s = String(v == null ? '' : v).replace(/[\s ,₮$%]/g, '').replace(/[^\d.\-eE+]/g, '');
    var n = parseFloat(s); return isFinite(n) ? n : 0;
  }
  function fmt(v) {
    var a = Math.abs(v), d = a >= 100 || Number.isInteger(v) ? 0 : a >= 10 ? 1 : 2;
    return v.toLocaleString('en-US', { maximumFractionDigits: d });
  }
  function ticks(min, max, n) {
    if (min === max) { max = min + 1; }
    var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = n / span * step;
    if (err <= 0.15) step *= 10; else if (err <= 0.35) step *= 5; else if (err <= 0.75) step *= 2;
    var lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, t = [];
    for (var v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(10));
    return t;
  }

  // ================= fabric helpers =================
  function txt(s, o) {
    return new fabric.Text(String(s), Object.assign({ fontSize: 22, fill: '#1f2937', objectCaching: false }, o));
  }
  function rect(x, y, w, h, fill, o) { return new fabric.Rect(Object.assign({ left: x, top: y, width: Math.max(0, w), height: Math.max(0, h), fill: fill, strokeWidth: 0 }, o)); }
  function group(objs, extra) {
    var g = new fabric.Group(objs, Object.assign({ subTargetCheck: false }, extra));
    return g;
  }

  // ================= charts =================
  var CHARTS = [
    ['col', 'Баганан', '<path d="M4 20V10M9.5 20V4M15 20v-7M20.5 20V8"/>'],
    ['bar', 'Хэвтээ', '<path d="M4 5h10M4 10h16M4 15h7M4 20h13"/>'],
    ['stack', 'Давхарласан', '<path d="M5 20v-6M5 14V9M12 20v-9M12 11V4M19 20v-4M19 16v-5" stroke-width="3"/>'],
    ['line', 'Шугаман', '<path d="M3 17l5-6 4 3 8-9"/><path d="M3 21h18"/>'],
    ['area', 'Талбай', '<path d="M3 20V14l5-5 4 3 8-7v15z"/>'],
    ['pie', 'Дугуй', '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 2.5A9 9 0 0 1 21.5 9H15z"/>'],
    ['donut', 'Цагираг', '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M12 4v4.5"/>']
  ];
  function sampleChart(type) {
    if (type === 'pie' || type === 'donut')
      return { type: type, title: 'Борлуулалт — бүсээр', labels: ['Улаанбаатар', 'Дархан', 'Эрдэнэт', 'Бусад'], series: [{ name: 'Хувь', values: [58, 14, 12, 16] }], pal: 0, legend: true, values: true, grid: true };
    return { type: type, title: 'Борлуулалт (сая ₮)', labels: ['1-р улирал', '2-р улирал', '3-р улирал', '4-р улирал'],
      series: [{ name: '2025', values: [42, 58, 64, 81] }, { name: '2026', values: [51, 66, 79, 95] }], pal: 0, legend: true, values: type !== 'line' && type !== 'area', grid: true };
  }
  var CW = 1000, CH = 620;
  function buildChart(m, ink) {
    var font = E().stack(fontOf(m)), cols = palOf(m), out = [], W = CW, H = CH;
    var T = function (s, o) { return txt(s, Object.assign({ fontFamily: font, fill: ink.ink }, o)); };
    out.push(rect(0, 0, W, H, 'rgba(0,0,0,0)'));                       // stable bounds + easy to click
    var top = 0, bottom = H, pie = m.type === 'pie' || m.type === 'donut';
    if (m.title) { var tt = T(m.title, { fontSize: 34, fontWeight: 700, left: 0, top: 0 }); out.push(tt); top = tt.height + 18; }
    var series = m.series.filter(function (s) { return s; }), labels = m.labels;
    var n = labels.length;
    // legend
    var legendItems = pie ? labels : series.map(function (s) { return s.name; });
    if (m.legend && (pie || series.length > 1)) {
      var lx = 0, ly = 0, rows = [[]], rw = 0, parts = [];
      legendItems.forEach(function (name, i) {
        var t = T(name, { fontSize: 22, fill: ink.muted }), w = 28 + t.width + 26;
        if (rw + w > W && rows[rows.length - 1].length) { rows.push([]); rw = 0; }
        rows[rows.length - 1].push({ t: t, w: w, c: cols[i % cols.length] }); rw += w;
      });
      var lh = 34, y0 = H - rows.length * lh + 6;
      rows.forEach(function (r, ri) {
        var tw = r.reduce(function (a, x) { return a + x.w; }, 0) - 26, x = (W - tw) / 2;
        r.forEach(function (it) {
          parts.push(rect(x, y0 + ri * lh + 5, 18, 18, it.c, { rx: 4, ry: 4 }));
          it.t.set({ left: x + 28, top: y0 + ri * lh + 1 }); parts.push(it.t); x += it.w;
        });
      });
      out = out.concat(parts); bottom = y0 - 20;
    }
    if (!n || !series.length) return out;
    if (pie) return out.concat(buildPie(m, ink, cols, T, top, bottom, W));
    var horiz = m.type === 'bar', stacked = m.type === 'stack';
    var vals = [];
    if (stacked) labels.forEach(function (_, i) {
      var pos = 0, neg = 0; series.forEach(function (s) { var v = toNum(s.values[i]); if (v >= 0) pos += v; else neg += v; }); vals.push(pos, neg);
    }); else series.forEach(function (s) { labels.forEach(function (_, i) { vals.push(toNum(s.values[i])); }); });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (m.type !== 'line' || min > 0) min = Math.min(0, min);
    if (max < 0) max = 0;
    var tk = ticks(min, max, 5), lo = tk[0], hi = tk[tk.length - 1];
    var tickT = tk.map(function (v) { return T(fmt(v), { fontSize: 20, fill: ink.muted }); });
    var catT = labels.map(function (l) { return T(l, { fontSize: 21, fill: ink.muted }); });
    var out2 = [];
    if (!horiz) {
      var yw = Math.max.apply(null, tickT.map(function (t) { return t.width; })) + 14;
      var px = yw, pw = W - yw - 4, slot = pw / n;
      var rot = catT.some(function (t) { return t.width > slot - 8; });
      var ch = rot ? Math.min(140, Math.max.apply(null, catT.map(function (t) { return t.width; })) * 0.6 + 20) : 34;
      var py = top + 12, ph = bottom - py - ch;
      var Y = function (v) { return py + ph - (v - lo) / (hi - lo) * ph; };
      tk.forEach(function (v, i) {
        if (m.grid || v === 0) out2.push(new fabric.Line([px, Y(v), px + pw, Y(v)], { stroke: v === 0 ? ink.muted : ink.grid, strokeWidth: v === 0 ? 2 : 1.5, strokeDashArray: v === 0 ? null : [6, 6] }));
        tickT[i].set({ left: px - 12 - tickT[i].width, top: Y(v) - tickT[i].height / 2 }); out2.push(tickT[i]);
      });
      catT.forEach(function (t, i) {
        var cx = px + slot * (i + 0.5);
        if (rot) t.set({ originX: 'right', originY: 'top', angle: -35, left: cx + 8, top: py + ph + 10 });
        else t.set({ left: cx - t.width / 2, top: py + ph + 8 });
        out2.push(t);
      });
      if (m.type === 'col' || stacked) {
        var gw = slot * (stacked ? 0.56 : 0.74), bw = stacked ? gw : gw / series.length;
        labels.forEach(function (_, i) {
          var x0 = px + slot * i + (slot - gw) / 2, pos = 0, neg = 0;
          series.forEach(function (s, si) {
            var v = toNum(s.values[i]), x = stacked ? x0 : x0 + bw * si, a, b;
            if (stacked) { if (v >= 0) { a = pos; pos += v; b = pos; } else { a = neg; neg += v; b = neg; } } else { a = 0; b = v; }
            var y1 = Y(Math.max(a, b)), y2 = Y(Math.min(a, b)), r = Math.min(6, bw * 0.12);
            out2.push(rect(x + (stacked ? 0 : bw * 0.06), y1, bw * (stacked ? 1 : 0.88), y2 - y1, cols[si % cols.length], { rx: stacked ? 0 : r, ry: stacked ? 0 : r }));
            if (m.values && v) {
              var lt = T(fmt(v), { fontSize: stacked ? 19 : 20, fontWeight: 600, fill: stacked ? '#ffffff' : ink.ink });
              if (stacked) { if (y2 - y1 > lt.height + 4) { lt.set({ left: x + bw / 2 - lt.width / 2, top: (y1 + y2) / 2 - lt.height / 2 }); out2.push(lt); } }
              else { lt.set({ left: x + bw / 2 - lt.width / 2, top: v >= 0 ? y1 - lt.height - 4 : y2 + 4 }); out2.push(lt); }
            }
          });
        });
      } else {
        series.forEach(function (s, si) {
          var c = cols[si % cols.length], pts = labels.map(function (_, i) { return { x: px + slot * (i + 0.5), y: Y(toNum(s.values[i])) }; });
          if (m.type === 'area') {
            var poly = pts.concat([{ x: pts[pts.length - 1].x, y: Y(Math.max(lo, 0)) }, { x: pts[0].x, y: Y(Math.max(lo, 0)) }]);
            out2.push(new fabric.Polygon(poly, { fill: c, opacity: series.length > 1 ? 0.28 : 0.35, strokeWidth: 0, objectCaching: false }));
          }
          out2.push(new fabric.Polyline(pts, { fill: '', stroke: c, strokeWidth: 5, strokeLineJoin: 'round', strokeLineCap: 'round', objectCaching: false }));
          pts.forEach(function (p, i) {
            out2.push(new fabric.Circle({ left: p.x, top: p.y, radius: 7, originX: 'center', originY: 'center', fill: ink.dark ? '#111827' : '#ffffff', stroke: c, strokeWidth: 4 }));
            if (m.values) { var lt = T(fmt(toNum(s.values[i])), { fontSize: 19, fontWeight: 600 }); lt.set({ left: p.x - lt.width / 2, top: p.y - lt.height - 12 }); out2.push(lt); }
          });
        });
      }
    } else {
      var lw = Math.min(W * 0.34, Math.max.apply(null, catT.map(function (t) { return t.width; })) + 16);
      var hx = lw, hw = W - lw - 60, hy = top + 8, hh = bottom - hy - 34, hslot = hh / n;
      var X = function (v) { return hx + (v - lo) / (hi - lo) * hw; };
      tk.forEach(function (v, i) {
        if (m.grid || v === 0) out2.push(new fabric.Line([X(v), hy, X(v), hy + hh], { stroke: v === 0 ? ink.muted : ink.grid, strokeWidth: v === 0 ? 2 : 1.5, strokeDashArray: v === 0 ? null : [6, 6] }));
        tickT[i].set({ left: X(v) - tickT[i].width / 2, top: hy + hh + 8 }); out2.push(tickT[i]);
      });
      var gh = hslot * 0.72, bh = gh / series.length;
      catT.forEach(function (t, i) {
        var scale = t.width > lw - 16 ? (lw - 16) / t.width : 1;
        t.set({ scaleX: scale, scaleY: scale, left: hx - 12 - t.width * scale, top: hy + hslot * (i + 0.5) - t.height * scale / 2 }); out2.push(t);
        series.forEach(function (s, si) {
          var v = toNum(s.values[i]), y = hy + hslot * i + (hslot - gh) / 2 + bh * si, x1 = X(Math.min(0, v)), x2 = X(Math.max(0, v)), r = Math.min(6, bh * 0.14);
          out2.push(rect(x1, y + bh * 0.06, x2 - x1, bh * 0.88, cols[si % cols.length], { rx: r, ry: r }));
          if (m.values && v) { var lt = T(fmt(v), { fontSize: 19, fontWeight: 600 }); lt.set({ left: v >= 0 ? x2 + 6 : x1 - lt.width - 6, top: y + bh / 2 - lt.height / 2 }); out2.push(lt); }
        });
      });
    }
    return out.concat(out2);
  }
  function buildPie(m, ink, cols, T, top, bottom, W) {
    var out = [], vals = m.labels.map(function (_, i) { return Math.max(0, toNum(m.series[0].values[i])); });
    var sum = vals.reduce(function (a, b) { return a + b; }, 0) || 1;
    var R = Math.min((bottom - top) / 2 - 6, W / 2 - 10), cx = W / 2, cy = top + (bottom - top) / 2, ri = m.type === 'donut' ? R * 0.58 : 0;
    var a0 = -Math.PI / 2;
    vals.forEach(function (v, i) {
      if (!v) return;
      var a1 = a0 + v / sum * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0, c = cols[i % cols.length];
      var P = function (r, a) { return (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); };
      var d;
      if (v >= sum - 1e-9) d = ri ? 'M ' + P(R, 0) + ' A ' + R + ' ' + R + ' 0 1 1 ' + P(R, Math.PI) + ' A ' + R + ' ' + R + ' 0 1 1 ' + P(R, 0) + ' Z M ' + P(ri, 0) + ' A ' + ri + ' ' + ri + ' 0 1 0 ' + P(ri, Math.PI) + ' A ' + ri + ' ' + ri + ' 0 1 0 ' + P(ri, 0) + ' Z'
        : 'M ' + P(R, 0) + ' A ' + R + ' ' + R + ' 0 1 1 ' + P(R, Math.PI) + ' A ' + R + ' ' + R + ' 0 1 1 ' + P(R, 0) + ' Z';
      else if (ri) d = 'M ' + P(R, a0) + ' A ' + R + ' ' + R + ' 0 ' + big + ' 1 ' + P(R, a1) + ' L ' + P(ri, a1) + ' A ' + ri + ' ' + ri + ' 0 ' + big + ' 0 ' + P(ri, a0) + ' Z';
      else d = 'M ' + cx + ' ' + cy + ' L ' + P(R, a0) + ' A ' + R + ' ' + R + ' 0 ' + big + ' 1 ' + P(R, a1) + ' Z';
      out.push(new fabric.Path(d, { fill: c, stroke: ink.dark ? '#111827' : '#ffffff', strokeWidth: 3, strokeLineJoin: 'round', objectCaching: false, fillRule: 'evenodd' }));
      if (m.values && v / sum >= 0.04) {
        var mid = (a0 + a1) / 2, rr = ri ? (R + ri) / 2 : R * 0.64, pct = Math.round(v / sum * 100) + '%';
        var lt = T(pct, { fontSize: v / sum > 0.1 ? 26 : 20, fontWeight: 700, fill: '#ffffff', shadow: new fabric.Shadow({ color: 'rgba(0,0,0,.35)', blur: 4 }) });
        lt.set({ left: cx + rr * Math.cos(mid) - lt.width / 2, top: cy + rr * Math.sin(mid) - lt.height / 2 }); out.push(lt);
      }
      a0 = a1;
    });
    if (ri) {
      var tot = T(fmt(vals.reduce(function (a, b) { return a + b; }, 0)), { fontSize: Math.round(ri * 0.42), fontWeight: 700 });
      tot.set({ left: cx - tot.width / 2, top: cy - tot.height / 2 - ri * 0.1 });
      var cap = T(m.series[0].name || 'Нийт', { fontSize: Math.round(ri * 0.2), fill: ink.muted });
      cap.set({ left: cx - cap.width / 2, top: tot.top + tot.height });
      out.push(tot, cap);
    }
    return out;
  }

  // ================= tables =================
  var TSTY = [
    { name: 'Нил ягаан', head: '#6d56fa', headInk: '#ffffff', band: '#f3f0ff', body: '#ffffff', line: '#e4e0fb', ink: '#1f2937' },
    { name: 'Хар', head: '#111827', headInk: '#ffffff', band: '#f3f4f6', body: '#ffffff', line: '#e5e7eb', ink: '#111827' },
    { name: 'Цэнхэр', head: '#0369a1', headInk: '#ffffff', band: '#e0f2fe', body: '#ffffff', line: '#bae6fd', ink: '#0f172a' },
    { name: 'Ногоон', head: '#047857', headInk: '#ffffff', band: '#d1fae5', body: '#ffffff', line: '#a7f3d0', ink: '#064e3b' },
    { name: 'Улбар шар', head: '#ea580c', headInk: '#ffffff', band: '#ffedd5', body: '#ffffff', line: '#fed7aa', ink: '#431407' },
    { name: 'Энгийн', head: '', headInk: '#111827', band: '', body: '', line: '#d1d5db', ink: '#111827', plain: true },
    { name: 'Бараан', head: '#6d56fa', headInk: '#ffffff', band: '#273043', body: '#1f2937', line: '#374151', ink: '#f3f4f6' }
  ];
  function sampleTable() {
    return { rows: [['Үзүүлэлт', '2025', '2026', 'Өсөлт'], ['Борлуулалт (сая ₮)', '1,240', '1,580', '+27%'], ['Харилцагч', '3,400', '4,150', '+22%'], ['Ажилтан', '48', '62', '+29%'], ['Салбар', '5', '7', '+40%']],
      header: true, zebra: true, style: 0, fs: 26 };
  }
  function isNumLike(s) { return /^[\s+\-−]?[\d\s.,]+(%|₮|\$|k|K|M|сая|мян)?\s*$/.test(String(s)) && /\d/.test(String(s)); }
  function tableLayout(m) {
    var font = E().stack(fontOf(m)), fs = m.fs || 26, pad = Math.round(fs * 0.7), rows = m.rows, nc = Math.max.apply(null, rows.map(function (r) { return r.length; }));
    var widths = [];
    for (var c = 0; c < nc; c++) {
      var w = 40;
      rows.forEach(function (r, ri) { var t = txt(r[c] == null ? '' : r[c], { fontFamily: font, fontSize: fs, fontWeight: m.header && ri === 0 ? 700 : 400 }); w = Math.max(w, t.width); });
      widths.push(Math.ceil(w + pad * 2));
    }
    var align = [];
    for (var c2 = 0; c2 < nc; c2++) {
      var body = rows.slice(m.header ? 1 : 0).map(function (r) { return r[c2]; }).filter(function (v) { return v != null && String(v).trim(); });
      align.push(c2 > 0 && body.length && body.every(isNumLike) ? 'right' : 'left');
    }
    return { font: font, fs: fs, pad: pad, nc: nc, widths: widths, rowH: Math.round(fs * 1.25 + pad * 1.3), align: align };
  }
  function buildTable(m) {
    var L = tableLayout(m), st = TSTY[m.style] || TSTY[0], out = [], y = 0, W = L.widths.reduce(function (a, b) { return a + b; }, 0);
    var H = L.rowH * m.rows.length;
    out.push(rect(0, 0, W, H, st.body || 'rgba(0,0,0,0)', { rx: 0 }));
    m.rows.forEach(function (r, ri) {
      var head = m.header && ri === 0, bodyIx = ri - (m.header ? 1 : 0);
      var fill = head ? st.head : (m.zebra && bodyIx % 2 === 1 ? st.band : '');
      if (fill) out.push(rect(0, y, W, L.rowH, fill));
      var x = 0;
      for (var c = 0; c < L.nc; c++) {
        var s = r[c] == null ? '' : String(r[c]), w = L.widths[c];
        if (s) {
          var t = txt(s, { fontFamily: L.font, fontSize: L.fs, fontWeight: head ? 700 : 400, fill: head ? st.headInk : st.ink });
          var al = head && L.align[c] === 'right' ? 'right' : L.align[c];
          t.set({ left: al === 'right' ? x + w - L.pad - t.width : x + L.pad, top: y + (L.rowH - t.height) / 2 });
          out.push(t);
        }
        x += w;
      }
      y += L.rowH;
      if (ri < m.rows.length - 1) out.push(new fabric.Line([0, y, W, y], { stroke: head && st.plain ? st.ink : st.line, strokeWidth: head && st.plain ? 2.5 : 1.5 }));
    });
    return out;
  }

  // ================= mockups =================
  var MOCKS = {
    phone: { cat: 'device', name: 'Утас', color: '#111827' },
    tablet: { cat: 'device', name: 'Таблет', color: '#1f2937' },
    laptop: { cat: 'device', name: 'Лаптоп', color: '#1f2937' },
    monitor: { cat: 'device', name: 'Монитор', color: '#111827' },
    card: { cat: 'print', name: 'Нэрийн хуудас', color: '#1f2937' },
    poster: { cat: 'print', name: 'Постер', color: '#111827' },
    book: { cat: 'print', name: 'Ном', color: '#e5e7eb' },
    tshirt: { cat: 'print', name: 'Футболк', color: '#ffffff' },
    mug: { cat: 'print', name: 'Аяга', color: '#ffffff' },
    browser: { cat: 'web', name: 'Браузер', color: '#ffffff' },
    browserDark: { cat: 'web', name: 'Браузер (бараан)', color: '#1f2937' }
  };
  var MK_COLORS = ['#111827', '#ffffff', '#e5e7eb', '#9ca3af', '#1e3a8a', '#6d56fa', '#be123c', '#f59e0b', '#15803d', '#fce7f3'];
  var SHADOW = function (b, y, a) { return new fabric.Shadow({ color: 'rgba(0,0,0,' + (a || 0.28) + ')', blur: b || 40, offsetX: 0, offsetY: y == null ? 18 : y }); };
  function shade(c, k) {   // darken (k<0) / lighten (k>0) a hex colour
    var n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var f = function (v) { return Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k); };
    return '#' + [f(r), f(g), f(b)].map(function (v) { return ('0' + Math.max(0, Math.min(255, v)).toString(16)).slice(-2); }).join('');
  }
  function lin(x1, y1, x2, y2, stops) { return new fabric.Gradient({ type: 'linear', gradientUnits: 'pixels', coords: { x1: x1, y1: y1, x2: x2, y2: y2 }, colorStops: stops }); }
  // each builder: { under: [...], screen: {x,y,w,h,r, fit:'cover'|'contain', blend}, over: [...] }
  var MK = {
    phone: function (c) {
      var W = 430, H = 880, s = { x: 20, y: 20, w: 390, h: 840, r: 50, fit: 'cover' };
      return { under: [rect(0, 0, W, H, c, { rx: 66, ry: 66, shadow: SHADOW(50, 24, 0.3) }), rect(-4, 190, 6, 70, shade(c, -0.3), { rx: 3 }), rect(-4, 280, 6, 70, shade(c, -0.3), { rx: 3 }), rect(W - 2, 230, 6, 110, shade(c, -0.3), { rx: 3 }), rect(s.x, s.y, s.w, s.h, '#000', { rx: s.r, ry: s.r })],
        screen: s, over: [rect(W / 2 - 58, 40, 116, 34, '#000', { rx: 17, ry: 17 })] };
    },
    tablet: function (c) {
      var W = 1240, H = 900, s = { x: 36, y: 36, w: 1168, h: 828, r: 18, fit: 'cover' };
      return { under: [rect(0, 0, W, H, c, { rx: 54, ry: 54, shadow: SHADOW(50, 24, 0.3) }), rect(s.x, s.y, s.w, s.h, '#000', { rx: s.r, ry: s.r })], screen: s,
        over: [new fabric.Circle({ left: W / 2, top: 18, radius: 6, originX: 'center', originY: 'center', fill: shade(c, 0.25) })] };
    },
    laptop: function (c) {
      var s = { x: 138, y: 30, w: 1324, h: 828, r: 6, fit: 'cover' };
      return { under: [rect(110, 0, 1380, 900, c, { rx: 34, ry: 34 }), rect(s.x, s.y, s.w, s.h, '#000'),
        new fabric.Path('M 0 900 L 1600 900 L 1600 918 C 1600 936 1570 948 1540 948 L 60 948 C 30 948 0 936 0 918 Z', { fill: lin(0, 900, 0, 948, [{ offset: 0, color: '#e5e7eb' }, { offset: 1, color: '#9ca3af' }]), shadow: SHADOW(40, 20, 0.3) }),
        rect(700, 900, 200, 14, '#9ca3af', { rx: 7, ry: 7 })],
        screen: s, over: [new fabric.Circle({ left: 800, top: 15, radius: 5, originX: 'center', originY: 'center', fill: shade(c, 0.3) })] };
    },
    monitor: function (c) {
      var s = { x: 26, y: 26, w: 1548, h: 871, r: 4, fit: 'cover' };
      return { under: [new fabric.Path('M 730 960 L 870 960 L 890 1110 L 710 1110 Z', { fill: lin(0, 960, 0, 1110, [{ offset: 0, color: '#9ca3af' }, { offset: 1, color: '#d1d5db' }]) }),
        rect(540, 1100, 520, 26, '#cbd5e1', { rx: 13, ry: 13, shadow: SHADOW(30, 14, 0.25) }),
        rect(0, 0, 1600, 960, c, { rx: 22, ry: 22, shadow: SHADOW(50, 24, 0.28) }), rect(s.x, s.y, s.w, s.h, '#000')],
        screen: s, over: [] };
    },
    card: function (c) {
      var s = { x: 170, y: 150, w: 1050, h: 600, r: 14, fit: 'cover' };
      return { under: [rect(60, 70, 1050, 600, c, { rx: 14, ry: 14, angle: -9, shadow: SHADOW(36, 16, 0.25) })], screen: s, shadow: SHADOW(40, 20, 0.3),
        over: [rect(s.x, s.y, s.w, s.h, lin(s.x, s.y, s.x + s.w, s.y + s.h, [{ offset: 0, color: 'rgba(255,255,255,0.18)' }, { offset: 0.5, color: 'rgba(255,255,255,0)' }, { offset: 1, color: 'rgba(0,0,0,0.08)' }]), { rx: 14, ry: 14 })] };
    },
    poster: function (c) {
      var s = { x: 92, y: 92, w: 816, h: 1116, r: 0, fit: 'cover' };
      return { under: [rect(0, 0, 1000, 1300, c, { shadow: SHADOW(50, 26, 0.35) }), rect(28, 28, 944, 1244, '#ffffff'), rect(28, 28, 944, 1244, lin(0, 28, 0, 120, [{ offset: 0, color: 'rgba(0,0,0,0.12)' }, { offset: 1, color: 'rgba(0,0,0,0)' }]))],
        screen: s, over: [rect(s.x, s.y, s.w, s.h, lin(s.x, s.y, s.x + s.w, s.y + s.h * 0.6, [{ offset: 0, color: 'rgba(255,255,255,0.16)' }, { offset: 0.45, color: 'rgba(255,255,255,0)' }]))] };
    },
    book: function (c) {
      var s = { x: 0, y: 0, w: 820, h: 1120, r: 6, fit: 'cover' };
      return { under: [rect(22, 16, 820, 1120, '#f3f4f6', { rx: 6, ry: 6, shadow: SHADOW(46, 26, 0.35) }), rect(22, 16, 820, 1120, lin(0, 0, 0, 1136, [{ offset: 0, color: 'rgba(0,0,0,0)' }, { offset: 1, color: 'rgba(0,0,0,0.06)' }]), { rx: 6, ry: 6 }),
        rect(826, 30, 12, 1096, lin(826, 0, 838, 0, [{ offset: 0, color: '#d1d5db' }, { offset: 0.5, color: '#f9fafb' }, { offset: 1, color: '#d1d5db' }])), rect(0, 0, 820, 1120, c, { rx: 6, ry: 6 })],
        screen: s, over: [rect(0, 0, 70, 1120, lin(0, 0, 70, 0, [{ offset: 0, color: 'rgba(0,0,0,0.38)' }, { offset: 0.35, color: 'rgba(255,255,255,0.18)' }, { offset: 0.55, color: 'rgba(0,0,0,0.12)' }, { offset: 1, color: 'rgba(0,0,0,0)' }]), { rx: 6, ry: 6 })] };
    },
    tshirt: function (c) {
      var d = 'M 330 60 C 390 120 610 120 670 60 L 900 150 L 1000 400 L 840 470 L 800 390 L 800 1080 C 600 1100 400 1100 200 1080 L 200 390 L 160 470 L 0 400 L 100 150 Z';
      var light = !isDarkHex(c);
      return { under: [new fabric.Path(d, { fill: c, stroke: light ? '#d1d5db' : shade(c, -0.25), strokeWidth: 3, strokeLineJoin: 'round', shadow: SHADOW(40, 20, 0.22) })],
        screen: { x: 340, y: 250, w: 320, h: 380, r: 0, fit: 'contain', blend: light ? 'multiply' : null },
        over: [new fabric.Path('M 330 60 C 390 140 610 140 670 60', { fill: '', stroke: shade(c, light ? -0.15 : 0.15), strokeWidth: 10, strokeLineCap: 'round' }),
          new fabric.Path(d, { fill: lin(0, 0, 1000, 0, [{ offset: 0, color: 'rgba(0,0,0,0.10)' }, { offset: 0.3, color: 'rgba(0,0,0,0)' }, { offset: 0.7, color: 'rgba(0,0,0,0)' }, { offset: 1, color: 'rgba(0,0,0,0.12)' }]), strokeWidth: 0 }),
          new fabric.Path('M 200 390 L 240 430 M 800 390 L 760 430', { fill: '', stroke: 'rgba(0,0,0,0.12)', strokeWidth: 4, strokeLineCap: 'round' })] };
    },
    mug: function (c) {
      var light = !isDarkHex(c);
      return { under: [new fabric.Path('M 640 230 C 830 230 830 610 640 610 L 640 540 C 750 540 750 300 640 300 Z', { fill: c, stroke: light ? '#d1d5db' : shade(c, -0.25), strokeWidth: 3, shadow: SHADOW(30, 16, 0.2) }),
        rect(0, 60, 640, 740, c, { rx: 46, ry: 46, stroke: light ? '#d1d5db' : shade(c, -0.25), strokeWidth: 3, shadow: SHADOW(46, 24, 0.28) })],
        screen: { x: 90, y: 200, w: 460, h: 480, r: 0, fit: 'contain', blend: light ? 'multiply' : null },
        over: [rect(0, 60, 640, 740, lin(0, 0, 640, 0, [{ offset: 0, color: 'rgba(0,0,0,0.20)' }, { offset: 0.16, color: 'rgba(255,255,255,0.25)' }, { offset: 0.28, color: 'rgba(0,0,0,0)' }, { offset: 0.8, color: 'rgba(0,0,0,0.04)' }, { offset: 1, color: 'rgba(0,0,0,0.24)' }]), { rx: 46, ry: 46 }),
          new fabric.Ellipse({ left: 320, top: 64, rx: 318, ry: 44, originX: 'center', originY: 'center', fill: light ? '#e5e7eb' : shade(c, -0.35), stroke: light ? '#d1d5db' : shade(c, -0.2), strokeWidth: 3 })] };
    },
    browser: function (c, m) { return browserMk(c, m, false); },
    browserDark: function (c, m) { return browserMk(c, m, true); }
  };
  function isDarkHex(c) { var n = parseInt(String(c).slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) < 140; }
  function browserMk(c, m, dark) {
    var W = 1600, H = 1000, bar = dark ? '#111827' : '#f3f4f6', addr = dark ? '#374151' : '#ffffff', ink = dark ? '#d1d5db' : '#6b7280';
    var url = txt(m.url || 'graphican.online', { fontFamily: E().stack('Inter'), fontSize: 19, fill: ink });
    url.set({ left: W / 2 - url.width / 2, top: 32 - url.height / 2 });
    return { under: [rect(0, 0, W, H, dark ? '#1f2937' : '#ffffff', { rx: 18, ry: 18, stroke: dark ? '#374151' : '#e5e7eb', strokeWidth: 2, shadow: SHADOW(50, 24, 0.25) }),
      rect(0, 0, W, 64, bar, { rx: 18, ry: 18 }), rect(0, 32, W, 32, bar),
      new fabric.Circle({ left: 34, top: 32, radius: 8, originX: 'center', originY: 'center', fill: '#ff5f57' }),
      new fabric.Circle({ left: 60, top: 32, radius: 8, originX: 'center', originY: 'center', fill: '#febc2e' }),
      new fabric.Circle({ left: 86, top: 32, radius: 8, originX: 'center', originY: 'center', fill: '#28c840' }),
      rect(300, 14, 1000, 36, addr, { rx: 18, ry: 18 }), url],
      screen: { x: 0, y: 64, w: W, h: H - 64, r: 0, fit: 'cover' }, over: [] };
  }
  function loadImg(src) { return new Promise(function (res) { if (!src) return res(null); fabric.Image.fromURL(src, function (img) { res(img && img.width ? img : null); }, { crossOrigin: 'anonymous' }); }); }
  function buildMockup(m, src) {
    var b = MK[m.kind](m.color || MOCKS[m.kind].color, m), s = b.screen;
    return loadImg(src).then(function (img) {
      var mid = [];
      if (img) {
        var iw = img.width, ih = img.height, sc = s.fit === 'contain' ? Math.min(s.w / iw, s.h / ih) : Math.max(s.w / iw, s.h / ih);
        if (s.fit === 'cover') {
          var cw = s.w / sc, ch = s.h / sc;
          img.set({ cropX: (iw - cw) / 2, cropY: (ih - ch) / 2, width: cw, height: ch });
        }
        img.set({ scaleX: sc, scaleY: sc, originX: 'center', originY: 'center', left: s.x + s.w / 2, top: s.y + s.h / 2, gMkImg: true, shadow: b.shadow || null });
        if (s.r) img.clipPath = new fabric.Rect({ width: img.width, height: img.height, rx: s.r / sc, ry: s.r / sc, originX: 'center', originY: 'center' });
        if (s.blend) img.globalCompositeOperation = s.blend;
        mid.push(img);
      } else {
        var ph = rect(s.x, s.y, s.w, s.h, lin(s.x, s.y, s.x + s.w, s.y + s.h, [{ offset: 0, color: '#a497ff' }, { offset: 1, color: '#6d56fa' }]), { rx: s.r, ry: s.r, shadow: b.shadow || null, opacity: s.fit === 'contain' ? 0.5 : 1 });
        var lb = txt('Зураг оруулах', { fontFamily: E().stack('Inter'), fontSize: Math.max(20, Math.round(s.w / 12)), fontWeight: 700, fill: '#ffffff' });
        lb.set({ left: s.x + s.w / 2 - lb.width / 2, top: s.y + s.h / 2 - lb.height / 2 });
        mid.push(ph, lb);
      }
      return group(b.under.concat(mid, b.over));
    });
  }
  function mockSrc(o) { var im = o && o.getObjects ? o.getObjects().filter(function (x) { return x.gMkImg; })[0] : null; return im ? im.getSrc() : null; }

  // ================= icons & diagrams =================
  var ICONS = [
    ['user', 'Хүн', 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0a4 4 0 1 1 8 0'],
    ['users', 'Баг', 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0a4 4 0 1 1 8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'],
    ['chart', 'График', 'M3 3v18h18 M8 17v-6 M13 17V7 M18 17v-4'],
    ['trend', 'Өсөлт', 'M22 7l-8.5 8.5-5-5L2 17 M16 7h6v6'],
    ['pie', 'Хувь', 'M21.21 15.89A10 10 0 1 1 8 2.83 M22 12A10 10 0 0 0 12 2v10z'],
    ['target', 'Зорилго', 'M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0 M18 12a6 6 0 1 1-12 0a6 6 0 1 1 12 0 M14 12a2 2 0 1 1-4 0a2 2 0 1 1 4 0'],
    ['bulb', 'Санаа', 'M9 18h6 M10 22h4 M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8a6 6 0 0 0-12 0c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14'],
    ['rocket', 'Эхлэл', 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0 M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5'],
    ['trophy', 'Амжилт', 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2z'],
    ['award', 'Шагнал', 'M19 8a7 7 0 1 1-14 0a7 7 0 1 1 14 0 M8.21 13.89L7 23l5-3 5 3-1.21-9.12'],
    ['star', 'Од', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
    ['heart', 'Зүрх', 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'],
    ['check', 'Зөв', 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3'],
    ['shield', 'Найдвартай', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4'],
    ['money', 'Мөнгө', 'M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'],
    ['case', 'Бизнес', 'M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'],
    ['cart', 'Худалдаа', 'M10 21a1 1 0 1 1-2 0a1 1 0 1 1 2 0 M21 21a1 1 0 1 1-2 0a1 1 0 1 1 2 0 M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'],
    ['truck', 'Хүргэлт', 'M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M8 18.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0 M21 18.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0'],
    ['globe', 'Дэлхий', 'M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0 M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'],
    ['pin', 'Байршил', 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M15 10a3 3 0 1 1-6 0a3 3 0 1 1 6 0'],
    ['mail', 'Имэйл', 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6'],
    ['phone', 'Утас', 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'],
    ['chat', 'Харилцаа', 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
    ['calendar', 'Огноо', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M16 2v4 M8 2v4 M3 10h18'],
    ['clock', 'Цаг', 'M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0 M12 6v6l4 2'],
    ['home', 'Гэр', 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10'],
    ['book', 'Ном', 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
    ['grad', 'Боловсрол', 'M22 10L12 5 2 10l10 5 10-5z M6 12v5c3 3 9 3 12 0v-5'],
    ['leaf', 'Байгаль', 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'],
    ['zap', 'Эрчим', 'M13 2L3 14h9l-1 8 10-12h-9l1-8z'],
    ['cloud', 'Үүл', 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'],
    ['layers', 'Давхарга', 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5'],
    ['sliders', 'Тохиргоо', 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6'],
    ['lock', 'Нууцлал', 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 10 0v4'],
    ['search', 'Хайх', 'M19 11a8 8 0 1 1-16 0a8 8 0 1 1 16 0 M21 21l-4.35-4.35'],
    ['camera', 'Зураг', 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M16 13a4 4 0 1 1-8 0a4 4 0 1 1 8 0'],
    ['flag', 'Туг', 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7'],
    ['info', 'Мэдээлэл', 'M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0 M12 16v-4 M12 8h.01'],
    ['arrow', 'Сум', 'M5 12h14 M12 5l7 7-7 7'],
    ['ok', 'Тийм', 'M20 6L9 17l-5-5'],
    ['no', 'Үгүй', 'M18 6L6 18 M6 6l12 12']
  ];
  var DIAGRAMS = [['process', 'Алхамууд', '1 → 2 → 3 → 4'], ['timeline', 'Он цагийн шугам', 'Үйл явдлын дараалал'], ['kpi', 'Тоон үзүүлэлт', '3 том тоо'], ['pyramid', 'Пирамид', '3 түвшин']];

  // ================= inserting =================
  function afterFont(m) { return Promise.resolve(E().ensureFont(fontOf(m))).catch(function () {}); }
  function sizeTo(o, frac) { var p = E().page(), k = Math.min(p.w * frac / o.width, p.h * 0.72 / o.height); o.set({ scaleX: k, scaleY: k }); }
  function makeChart(m, ref) {
    var g = group(buildChart(m, inkFor(ref, m)));
    g.set({ gKit: 'chart', gChart: clone(m), name: 'Chart' });
    return g;
  }
  function makeTable(m) {
    var g = group(buildTable(m));
    g.set({ gKit: 'table', gTable: clone(m), name: 'Хүснэгт' });
    return g;
  }
  function addChart(type) {
    var m = sampleChart(type); m.font = fontOf(m);
    afterFont(m).then(function () {
      var g = makeChart(m, null); sizeTo(g, 0.62); E().place(g);
      edit(g);
    });
  }
  function addTable() {
    var m = sampleTable(); m.font = fontOf(m);
    afterFont(m).then(function () { var g = makeTable(m); sizeTo(g, 0.66); E().place(g); edit(g); });
  }
  function addMockup(kind) {
    var m = { kind: kind, color: MOCKS[kind].color, url: 'graphican.online' };
    buildMockup(m, null).then(function (g) {
      g.set({ gKit: 'mockup', gMockup: m, name: 'Mockup — ' + MOCKS[kind].name });
      sizeTo(g, kind === 'phone' || kind === 'poster' || kind === 'book' || kind === 'mug' || kind === 'tshirt' ? 0.34 : 0.62);
      E().place(g);
      pickImage(g);
    });
  }
  function addIcon(i) {
    var ic = ICONS[i], col = palOf({ pal: 0 })[0];
    var ink = inkFor(null);
    var p = new fabric.Path(ic[2], { fill: '', stroke: ink.dark ? '#ffffff' : col, strokeWidth: 1.8, strokeLineCap: 'round', strokeLineJoin: 'round', objectCaching: false, name: 'Икон — ' + ic[1] });
    var k = Math.round(E().page().h * 0.16) / 24; p.set({ scaleX: k, scaleY: k, strokeUniform: false });
    E().place(p);
  }
  function addDiagram(kind) {
    var ed = E(), pg = ed.page(), f = pg.f, W = pg.w, H = pg.h, cols = palOf({ pal: 0 }), ink = inkFor(null), pair = ed.currentPair();
    var head = ed.stack(pair.heading || 'Inter'), body = ed.stack(pair.body || 'Inter'), objs = [];
    var T = function (s, o) { return new fabric.Textbox(s, Object.assign({ fontFamily: body, fontSize: Math.round(H * 0.026), fill: ink.ink, textAlign: 'center', lineHeight: 1.25 }, o)); };
    var cx = f.left + W / 2, cy = f.top + H / 2;
    if (kind === 'process') {
      var n = 4, gap = W * 0.012, w = W * 0.78 / n, h = H * 0.16, x0 = cx - (w * n) / 2, y = cy - h / 2 - H * 0.06;
      for (var i = 0; i < n; i++) {
        var x = x0 + i * w, a = h * 0.3, d = i === 0 ? 'M 0 0 L ' + (w - a - gap) + ' 0 L ' + (w - gap) + ' ' + h / 2 + ' L ' + (w - a - gap) + ' ' + h + ' L 0 ' + h + ' Z'
          : 'M 0 0 L ' + (w - a - gap) + ' 0 L ' + (w - gap) + ' ' + h / 2 + ' L ' + (w - a - gap) + ' ' + h + ' L 0 ' + h + ' L ' + a + ' ' + h / 2 + ' Z';
        objs.push(new fabric.Path(d, { left: x, top: y, fill: cols[i % cols.length], name: 'Алхам ' + (i + 1) }));
        objs.push(T(String(i + 1).padStart(2, '0'), { left: x + (i ? a : 0), top: y + h / 2 - H * 0.03, width: w - a - gap - (i ? a : 0), fontFamily: head, fontSize: Math.round(H * 0.045), fontWeight: 700, fill: '#ffffff' }));
        objs.push(T('Алхам ' + (i + 1) + '\nТовч тайлбар', { left: x, top: y + h + H * 0.03, width: w - gap }));
      }
    } else if (kind === 'timeline') {
      var n2 = 4, lw = W * 0.76, lx = cx - lw / 2, ly = cy;
      objs.push(new fabric.Line([lx, ly, lx + lw, ly], { stroke: ink.grid === '#4b5563' ? '#6b7280' : '#d1d5db', strokeWidth: 6, strokeLineCap: 'round', name: 'Шугам' }));
      for (var j = 0; j < n2; j++) {
        var px = lx + lw * (j + 0.5) / n2, up = j % 2 === 0, tw = lw / n2 * 0.9;
        objs.push(new fabric.Circle({ left: px, top: ly, radius: H * 0.022, originX: 'center', originY: 'center', fill: cols[j % cols.length], stroke: ink.dark ? '#111827' : '#ffffff', strokeWidth: 6 }));
        objs.push(T(String(2023 + j), { left: px - tw / 2, top: up ? ly - H * 0.2 : ly + H * 0.06, width: tw, fontFamily: head, fontSize: Math.round(H * 0.04), fontWeight: 700, fill: cols[j % cols.length] }));
        objs.push(T('Үйл явдлын\nтовч тайлбар', { left: px - tw / 2, top: up ? ly - H * 0.13 : ly + H * 0.125, width: tw }));
      }
    } else if (kind === 'kpi') {
      var n3 = 3, cw = W * 0.24, ch = H * 0.3, g3 = W * 0.03, kx = cx - (cw * n3 + g3 * (n3 - 1)) / 2, ky = cy - ch / 2;
      var nums = ['85%', '12K+', '4.9'], caps = ['Харилцагчийн сэтгэл ханамж', 'Идэвхтэй хэрэглэгч', 'Дундаж үнэлгээ'];
      for (var q = 0; q < n3; q++) {
        var bx = kx + q * (cw + g3);
        objs.push(new fabric.Rect({ left: bx, top: ky, width: cw, height: ch, rx: 24, ry: 24, fill: ink.dark ? 'rgba(255,255,255,0.06)' : '#f5f3ff', stroke: cols[q % cols.length], strokeWidth: 0, name: 'Карт' }));
        objs.push(new fabric.Rect({ left: bx, top: ky, width: cw, height: 10, rx: 5, ry: 5, fill: cols[q % cols.length], name: 'Зураас' }));
        objs.push(T(nums[q], { left: bx, top: ky + ch * 0.2, width: cw, fontFamily: head, fontSize: Math.round(H * 0.09), fontWeight: 800, fill: cols[q % cols.length] }));
        objs.push(T(caps[q], { left: bx + cw * 0.08, top: ky + ch * 0.62, width: cw * 0.84, fill: ink.muted }));
      }
    } else if (kind === 'pyramid') {
      var levels = 3, ph = H * 0.5, pw = ph * 1.15, top = cy - ph / 2, lh = ph / levels, labels = ['Алсын хараа', 'Стратеги', 'Үйл ажиллагаа'];
      for (var l = 0; l < levels; l++) {
        var y1 = top + l * lh, y2 = y1 + lh - 8, w1 = pw * (l / levels), w2 = pw * ((l + 1) / levels) - pw / levels * 8 / lh;
        var d2 = 'M ' + (cx - w1 / 2) + ' ' + y1 + ' L ' + (cx + w1 / 2) + ' ' + y1 + ' L ' + (cx + w2 / 2) + ' ' + y2 + ' L ' + (cx - w2 / 2) + ' ' + y2 + ' Z';
        if (l === 0) d2 = 'M ' + cx + ' ' + y1 + ' L ' + (cx + w2 / 2) + ' ' + y2 + ' L ' + (cx - w2 / 2) + ' ' + y2 + ' Z';
        objs.push(new fabric.Path(d2, { fill: cols[l % cols.length], name: labels[l] }));
        objs.push(T(labels[l], { left: cx + pw / 2 + W * 0.03, top: y1 + lh / 2 - H * 0.03, width: W * 0.22, textAlign: 'left', fontFamily: head, fontWeight: 700, fontSize: Math.round(H * 0.03) }));
        objs.push(new fabric.Line([cx + (w1 + w2) / 4 + 12, y1 + lh / 2 - 4, cx + pw / 2 + W * 0.025, y1 + lh / 2 - 4], { stroke: cols[l % cols.length], strokeWidth: 3, strokeDashArray: [8, 8], name: 'Холбоос' }));
      }
    }
    Promise.all([ed.ensureFont(pair.heading), ed.ensureFont(pair.body)]).catch(function () {}).then(function () {
      var c = ed.canvas; objs.forEach(function (o) { if (o.initDimensions) o.initDimensions(); c.add(o); o.setCoords(); });
      c.setActiveObject(new fabric.ActiveSelection(objs, { canvas: c })); c.requestRenderAll(); ed.commit(); ed.refreshUI();
      ed.toast('Диаграм нэмэгдлээ — текст бүр дээр давхар дарж засна. Хамт зөөх бол Ctrl+G');
    });
  }

  // rebuild an existing chart / table / mockup after its data or look changed
  function rebuild(o, m) {
    var ed = E();
    if (o.gKit === 'chart') return afterFont(m).then(function () { return ed.swap(o, makeChart(m, o)); });
    if (o.gKit === 'table') return afterFont(m).then(function () { return ed.swap(o, makeTable(m)); });
    if (o.gKit === 'mockup') {
      var src = arguments.length > 2 ? arguments[2] : mockSrc(o);
      // keep the on-slide size when the new mockup is a different shape (e.g. phone → laptop)
      var oldW = o.width * o.scaleX;
      return buildMockup(m, src).then(function (g) {
        g.set({ gKit: 'mockup', gMockup: clone(m), name: 'Mockup — ' + MOCKS[m.kind].name });
        var auto = /^Mockup — /.test(o.name || ''), n = ed.swap(o, g);
        if (auto) n.name = 'Mockup — ' + MOCKS[m.kind].name;
        if (Math.abs(n.width - o.width) > 1) { var k = oldW / n.width; n.set({ scaleX: k, scaleY: k }); n.setCoords(); ed.canvas.requestRenderAll(); ed.commit(); }
        return n;
      });
    }
  }
  var fileIn = null;
  function pickImage(o) {
    if (!fileIn) { fileIn = document.createElement('input'); fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.hidden = true; document.body.appendChild(fileIn); }
    fileIn.value = '';
    fileIn.onchange = function () {
      var f = fileIn.files[0]; if (!f || !o.canvas) return;
      E().readImage(f).then(function (r) { return rebuild(o, clone(o.gMockup), r.url); }).then(function () { E().toast('Зураг mockup-д орлоо'); })
        .catch(function () { E().toast('Зургийг уншиж чадсангүй'); });
    };
    fileIn.click();
  }

  // ================= data editor (grid) =================
  var dlg = null;
  function gridFromModel(o) {
    if (o.gKit === 'table') return clone(o.gTable.rows);
    var m = o.gChart, rows = [[''].concat(m.series.map(function (s) { return s.name; }))];
    m.labels.forEach(function (l, i) { rows.push([l].concat(m.series.map(function (s) { return s.values[i] == null ? '' : String(s.values[i]); }))); });
    return rows;
  }
  function modelFromGrid(kind, base, rows) {
    rows = rows.filter(function (r) { return r.some(function (c) { return String(c).trim(); }); });
    if (kind === 'table') { var t = clone(base); t.rows = rows.length ? rows : [['']]; return t; }
    var m = clone(base), head = rows[0] || [''], body = rows.slice(1), nc = Math.max.apply(null, rows.map(function (r) { return r.length; }).concat([2]));
    m.labels = body.map(function (r) { return String(r[0] || ''); });
    m.series = [];
    for (var c = 1; c < nc; c++) m.series.push({ name: String(head[c] || ('Цуврал ' + c)), values: body.map(function (r) { return toNum(r[c]); }) });
    return m;
  }
  function edit(o) {
    if (!o || !o.gKit) return;
    if (o.gKit === 'mockup') { pickImage(o); return; }
    closeDlg();
    var kind = o.gKit, base = clone(kind === 'table' ? o.gTable : o.gChart), rows = gridFromModel(o);
    dlg = document.createElement('div'); dlg.className = 'kit-modal';
    dlg.innerHTML = '<div class="kit-box" role="dialog" aria-modal="true" aria-label="Өгөгдөл">' +
      '<div class="kit-head"><b>' + (kind === 'table' ? 'Хүснэгтийн өгөгдөл' : 'Chart-ын өгөгдөл') + '</b><button type="button" class="ib" data-kd="close" aria-label="Хаах">✕</button></div>' +
      '<div class="kit-main"><div class="kit-left">' +
        (kind === 'chart' ? '<label class="kit-f"><span>Гарчиг</span><input data-kd-title value="' + esc(base.title || '') + '" placeholder="Chart-ын гарчиг (хоосон байж болно)"></label>' +
          '<div class="kit-types">' + CHARTS.map(function (c) { return '<button type="button" data-kd-type="' + c[0] + '" class="' + (c[0] === base.type ? 'on' : '') + '" title="' + c[1] + '"><svg viewBox="0 0 24 24">' + c[2] + '</svg><span>' + c[1] + '</span></button>'; }).join('') + '</div>' : '') +
        '<div class="kit-grid-wrap"><table class="kit-grid"></table></div>' +
        '<div class="kit-row"><button type="button" class="btn" data-kd="addrow">+ Мөр</button><button type="button" class="btn" data-kd="addcol">+ ' + (kind === 'table' ? 'Багана' : 'Цуврал') + '</button>' +
          '<button type="button" class="btn" data-kd="import">Excel / CSV оруулах</button><input type="file" hidden accept=".xlsx,.xls,.csv,.tsv,.ods" data-kd-file></div>' +
        '<p class="note">Excel, Google Sheets-ээс хуулсан хүснэгтийг нүдэн дээр Ctrl+V-ээр шууд буулгаж болно.' + (kind === 'chart' ? ' Эхний багана — ангилал, эхний мөр — цувралын нэр.' + (base.type === 'pie' || base.type === 'donut' ? ' Дугуй chart зөвхөн эхний цувралыг харуулна.' : '') : '') + '</p>' +
      '</div><div class="kit-right"><canvas class="kit-prev" width="560" height="360"></canvas><div class="kit-opts"></div></div></div>' +
      '<div class="kit-foot"><button type="button" class="btn" data-kd="close">Болих</button><button type="button" class="btn-primary" data-kd="save">Хадгалах</button></div></div>';
    document.body.appendChild(dlg);
    var state = { kind: kind, base: base, rows: rows, o: o };
    dlg._state = state;
    renderGrid(state); renderOpts(state); preview(state);
    var first = dlg.querySelector('.kit-grid input'); if (first) setTimeout(function () { first.focus(); first.select(); }, 30);
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) { closeDlg(); return; }
      var b = e.target.closest('button'); if (!b) return;
      var a = b.dataset.kd;
      if (a === 'close') { closeDlg(); return; }
      if (a === 'save') { save(state); return; }
      if (a === 'addrow') { state.rows.push(state.rows[0].map(function () { return ''; })); renderGrid(state); preview(state); return; }
      if (a === 'addcol') { state.rows.forEach(function (r, i) { r.push(i === 0 ? (kind === 'table' ? 'Багана' : 'Цуврал ' + r.length) : ''); }); renderGrid(state); preview(state); return; }
      if (a === 'import') { dlg.querySelector('[data-kd-file]').click(); return; }
      if (b.dataset.kdDelr) { if (state.rows.length > 2) { state.rows.splice(+b.dataset.kdDelr, 1); renderGrid(state); preview(state); } return; }
      if (b.dataset.kdDelc) { if (state.rows[0].length > 2) { state.rows.forEach(function (r) { r.splice(+b.dataset.kdDelc, 1); }); renderGrid(state); preview(state); } return; }
      if (b.dataset.kdType) { state.base.type = b.dataset.kdType; dlg.querySelectorAll('[data-kd-type]').forEach(function (x) { x.classList.toggle('on', x === b); }); preview(state); return; }
      if (b.dataset.kdPal) { state.base.pal = +b.dataset.kdPal; renderOpts(state); preview(state); return; }
      if (b.dataset.kdSty) { state.base.style = +b.dataset.kdSty; renderOpts(state); preview(state); return; }
      if (b.dataset.kdFs) { state.base.fs = Math.max(12, Math.min(60, (state.base.fs || 26) + +b.dataset.kdFs)); renderOpts(state); preview(state); return; }
    });
    dlg.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.r != null) { state.rows[+t.dataset.r][+t.dataset.c] = t.value; preview(state); }
      if (t.hasAttribute('data-kd-title')) { state.base.title = t.value; preview(state); }
    });
    dlg.addEventListener('change', function (e) {
      var t = e.target;
      if (t.dataset.kdOpt) { state.base[t.dataset.kdOpt] = t.checked; preview(state); }
      if (t.hasAttribute('data-kd-file') && t.files[0]) importFile(state, t.files[0]);
    });
    dlg.addEventListener('paste', function (e) {
      var t = e.target; if (t.dataset.r == null) return;
      var s = (e.clipboardData || window.clipboardData).getData('text');
      if (!/[\t\n]/.test(s)) return;
      e.preventDefault();
      var lines = s.replace(/\r/g, '').replace(/\n$/, '').split('\n').map(function (l) { return l.split('\t'); });
      var r0 = +t.dataset.r, c0 = +t.dataset.c;
      lines.forEach(function (cells, i) {
        while (state.rows.length <= r0 + i) state.rows.push(state.rows[0].map(function () { return ''; }));
        cells.forEach(function (v, j) {
          var need = c0 + j + 1; if (state.rows[0].length < need) state.rows.forEach(function (r) { while (r.length < need) r.push(''); });
          state.rows[r0 + i][c0 + j] = v.trim();
        });
      });
      renderGrid(state); preview(state);
    });
    dlg.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Escape') { closeDlg(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { save(state); return; }
      var t = e.target; if (t.dataset.r == null) return;
      var r = +t.dataset.r, c = +t.dataset.c, nx = null;
      if (e.key === 'Enter') nx = [r + (e.shiftKey ? -1 : 1), c];
      if (e.key === 'ArrowDown') nx = [r + 1, c];
      if (e.key === 'ArrowUp') nx = [r - 1, c];
      if (nx) {
        e.preventDefault();
        if (nx[0] >= state.rows.length) { state.rows.push(state.rows[0].map(function () { return ''; })); renderGrid(state); preview(state); }
        var el = dlg.querySelector('input[data-r="' + nx[0] + '"][data-c="' + nx[1] + '"]'); if (el) { el.focus(); el.select(); }
      }
    });
  }
  function closeDlg() { if (dlg) { dlg.remove(); dlg = null; } }
  function renderGrid(st) {
    var nc = Math.max.apply(null, st.rows.map(function (r) { return r.length; }));
    st.rows.forEach(function (r) { while (r.length < nc) r.push(''); });
    var h = '<tr><th></th>' + st.rows[0].map(function (_, c) { return '<th>' + (c === 0 && st.kind === 'chart' ? '' : '<button type="button" class="kit-x" data-kd-delc="' + c + '" title="Багана устгах">✕</button>') + '</th>'; }).join('') + '</tr>';
    st.rows.forEach(function (r, ri) {
      h += '<tr class="' + (ri === 0 ? 'hd' : '') + '"><th><button type="button" class="kit-x" data-kd-delr="' + ri + '" title="Мөр устгах"' + (ri === 0 && st.kind === 'chart' ? ' hidden' : '') + '>✕</button></th>' +
        r.map(function (v, c) {
          var ph = st.kind === 'chart' ? (ri === 0 ? (c === 0 ? '' : 'Цуврал') : c === 0 ? 'Ангилал' : '0') : '';
          return '<td' + (st.kind === 'chart' && (ri === 0 || c === 0) ? ' class="lab"' : '') + '><input data-r="' + ri + '" data-c="' + c + '" value="' + esc(v) + '" placeholder="' + ph + '"' + (st.kind === 'chart' && ri === 0 && c === 0 ? ' disabled' : '') + '></td>';
        }).join('') + '</tr>';
    });
    dlg.querySelector('.kit-grid').innerHTML = h;
  }
  function renderOpts(st) {
    var b = st.base, h = '';
    if (st.kind === 'chart') {
      h += '<div class="ps-l">Өнгө</div><div class="kit-pals">' + PALS.map(function (p, i) {
        return '<button type="button" data-kd-pal="' + i + '" class="' + (i === (b.pal || 0) ? 'on' : '') + '" title="' + p[0] + '">' + p[1].slice(0, 5).map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</button>'; }).join('') + '</div>' +
        '<label class="chk"><input type="checkbox" data-kd-opt="legend"' + (b.legend ? ' checked' : '') + '> Тайлбар (legend)</label>' +
        '<label class="chk"><input type="checkbox" data-kd-opt="values"' + (b.values ? ' checked' : '') + '> Тоог харуулах</label>' +
        '<label class="chk"><input type="checkbox" data-kd-opt="grid"' + (b.grid ? ' checked' : '') + '> Туслах шугам</label>';
    } else {
      h += '<div class="ps-l">Загвар</div><div class="kit-stys">' + TSTY.map(function (s, i) {
        return '<button type="button" data-kd-sty="' + i + '" class="' + (i === (b.style || 0) ? 'on' : '') + '" title="' + s.name + '"><i style="background:' + (s.head || '#fff') + ';' + (s.plain ? 'border-bottom:2px solid #111' : '') + '"></i><i style="background:' + (s.body || '#fff') + '"></i><i style="background:' + (s.band || s.body || '#fff') + '"></i></button>'; }).join('') + '</div>' +
        '<label class="chk"><input type="checkbox" data-kd-opt="header"' + (b.header ? ' checked' : '') + '> Эхний мөр — толгой</label>' +
        '<label class="chk"><input type="checkbox" data-kd-opt="zebra"' + (b.zebra ? ' checked' : '') + '> Судалтай мөр</label>' +
        '<div class="kit-row"><span>Үсгийн хэмжээ</span><button type="button" class="btn" data-kd-fs="-2">−</button><b>' + (b.fs || 26) + '</b><button type="button" class="btn" data-kd-fs="2">+</button></div>';
    }
    dlg.querySelector('.kit-opts').innerHTML = h;
  }
  var prevT = null;
  function preview(st) {
    clearTimeout(prevT);
    prevT = setTimeout(function () {
      if (!dlg) return;
      var cv = dlg.querySelector('.kit-prev'), m = modelFromGrid(st.kind, st.base, st.rows);
      var ink = st.kind === 'chart' ? inkFor(st.o, m) : null;
      var objs = st.kind === 'chart' ? buildChart(m, ink) : buildTable(m);
      var g = group(objs), sc = new fabric.StaticCanvas(null, { width: 560, height: 360, enableRetinaScaling: false });
      var bg = ink && ink.dark ? '#111827' : '#ffffff';
      sc.backgroundColor = bg;
      var k = Math.min(520 / g.width, 320 / g.height); g.set({ scaleX: k, scaleY: k }); sc.add(g); g.center(); sc.renderAll();
      var ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(sc.getElement(), 0, 0);
      sc.dispose();
    }, 60);
  }
  function importFile(st, file) {
    var ed = E();
    ed.loadScript('/assets/vendor/xlsx.min.js').then(function () { return file.arrayBuffer(); }).then(function (buf) {
      var wb = window.XLSX.read(buf, { type: 'array' }), ws = wb.Sheets[wb.SheetNames[0]];
      var rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }).filter(function (r) { return r.some(function (c) { return String(c).trim(); }); });
      if (!rows.length) throw new Error('empty');
      rows = rows.slice(0, st.kind === 'chart' ? 60 : 40).map(function (r) { return r.slice(0, 16).map(function (c) { return String(c); }); });
      st.rows = rows; renderGrid(st); preview(st); ed.toast('«' + file.name + '» — ' + rows.length + ' мөр орлоо');
    }).catch(function () { ed.toast('Файлыг уншиж чадсангүй'); });
  }
  function save(st) {
    var m = modelFromGrid(st.kind, st.base, st.rows), o = st.o;
    if (st.kind === 'chart' && (!m.labels.length || !m.series.length)) { E().toast('Дор хаяж нэг ангилал, нэг цуврал хэрэгтэй'); return; }
    closeDlg();
    if (o.canvas) rebuild(o, m);
  }

  // ================= panels =================
  function tileSvg(inner) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>'; }
  var MK_ICON = {
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 5h2"/>', tablet: '<rect x="3" y="5" width="18" height="14" rx="2"/>',
    laptop: '<rect x="5" y="5" width="14" height="10" rx="1"/><path d="M2.5 18.5h19"/>', monitor: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/>',
    card: '<rect x="3" y="7" width="15" height="9" rx="1.5" transform="rotate(-8 10 11)"/><rect x="6" y="9" width="15" height="9" rx="1.5"/>',
    poster: '<rect x="6" y="3" width="12" height="18"/><rect x="8" y="5" width="8" height="10"/>', book: '<path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M8 3v18"/><path d="M18 5h1.5v15H18"/>',
    tshirt: '<path d="M9 3c1 1.5 5 1.5 6 0l5 2.5-2 4-2-1V21H8V8.5l-2 1-2-4z"/>', mug: '<path d="M4 6h12v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M16 9h2a2.5 2.5 0 0 1 0 5h-2"/>',
    browser: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8.5h18"/><path d="M6 6.2h.01M8.2 6.2h.01"/>', browserDark: '<rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" fill-opacity=".25"/><path d="M3 8.5h18"/>'
  };
  var DG_ICON = { process: '<path d="M2 8h5l2 4-2 4H2l2-4zM10 8h5l2 4-2 4h-5l2-4z"/><path d="M19 12h3"/>', timeline: '<path d="M2 12h20"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 6v3M12 15v3M18 6v3"/>',
    kpi: '<rect x="2" y="6" width="6" height="12" rx="1.5"/><rect x="9" y="6" width="6" height="12" rx="1.5"/><rect x="16" y="6" width="6" height="12" rx="1.5"/>', pyramid: '<path d="M12 3 3 20h18z"/><path d="M8.2 10.5h7.6M5.5 15.5h13"/>' };
  function panel() {
    var h = '<div class="sec-t">Chart <span>PowerPoint-д засагдана</span></div><div class="grid3 kit-tiles">' +
      CHARTS.map(function (c) { return '<button type="button" class="tile kt" data-kit-chart="' + c[0] + '" title="' + c[1] + ' chart">' + tileSvg(c[2]) + '<span>' + c[1] + '</span></button>'; }).join('') + '</div>' +
      '<div class="sec-t">Хүснэгт <span>Excel-ээс буулгаж болно</span></div>' +
      '<button type="button" class="btn acc full" data-kit-table="1">' + tileSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14.5h18M9 4v16M15 4v16"/>') + 'Хүснэгт нэмэх</button>' +
      '<div class="sec-t">Mockup — төхөөрөмж</div><div class="grid3 kit-tiles">' + mkTiles('device') + '</div>' +
      '<div class="sec-t">Mockup — хэвлэмэл</div><div class="grid3 kit-tiles">' + mkTiles('print') + '</div>' +
      '<div class="sec-t">Mockup — вэб</div><div class="grid3 kit-tiles">' + mkTiles('web') + '</div>' +
      '<div class="sec-t">Диаграм <span>текст нь засагдана</span></div><div class="grid3 kit-tiles">' +
      DIAGRAMS.map(function (d) { return '<button type="button" class="tile kt" data-kit-dg="' + d[0] + '" title="' + d[1] + ' — ' + d[2] + '">' + tileSvg(DG_ICON[d[0]]) + '<span>' + d[1] + '</span></button>'; }).join('') + '</div>' +
      '<div class="sec-t">Икон <span>' + ICONS.length + '</span></div><input class="kit-q" type="search" placeholder="Икон хайх…" data-kit-q aria-label="Икон хайх"><div class="kit-icons">' +
      ICONS.map(function (ic, i) { return '<button type="button" data-kit-icon="' + i + '" data-n="' + esc(ic[1].toLowerCase() + ' ' + ic[0]) + '" title="' + ic[1] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + ic[2] + '"/></svg></button>'; }).join('') + '</div>' +
      '<p class="note">Chart, хүснэгт дээр давхар дарж өгөгдлийг засна. «PowerPoint (.pptx)» татахад жинхэнэ PowerPoint chart, хүснэгт болж орно.</p>';
    return h;
  }
  function mkTiles(cat) {
    return Object.keys(MOCKS).filter(function (k) { return MOCKS[k].cat === cat; }).map(function (k) {
      return '<button type="button" class="tile kt" data-kit-mock="' + k + '" title="' + MOCKS[k].name + '">' + tileSvg(MK_ICON[k]) + '<span>' + MOCKS[k].name + '</span></button>'; }).join('');
  }
  function rightUI(o) {
    var ic = E().icon, h = '<div class="ps kit-ps">';
    if (o.gKit === 'chart') {
      var m = o.gChart;
      h += '<div class="ps-h">Chart</div><button type="button" class="btn acc full" data-kit-edit="1">' + ic('sliders') + 'Өгөгдөл засах</button>' +
        '<div class="ps-l">Төрөл</div><div class="seg kit-seg">' + CHARTS.map(function (c) { return '<button type="button" data-kit-set="type" data-v="' + c[0] + '" class="' + (c[0] === m.type ? 'on' : '') + '" title="' + c[1] + '">' + tileSvg(c[2]) + '</button>'; }).join('') + '</div>' +
        '<div class="ps-l">Өнгө</div><div class="kit-pals">' + PALS.map(function (p, i) { return '<button type="button" data-kit-set="pal" data-v="' + i + '" class="' + (i === (m.pal || 0) ? 'on' : '') + '" title="' + p[0] + '">' + p[1].slice(0, 5).map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</button>'; }).join('') + '</div>' +
        '<label class="chk"><input type="checkbox" data-kit-chk="legend"' + (m.legend ? ' checked' : '') + '> Тайлбар (legend)</label>' +
        '<label class="chk"><input type="checkbox" data-kit-chk="values"' + (m.values ? ' checked' : '') + '> Тоог харуулах</label>' +
        '<label class="chk"><input type="checkbox" data-kit-chk="grid"' + (m.grid ? ' checked' : '') + '> Туслах шугам</label>' +
        '<div class="ps-l">Текстийн өнгө</div><div class="seg">' + [['auto', 'Автомат'], ['light', 'Бараан'], ['dark', 'Цайвар']].map(function (t) { return '<button type="button" data-kit-set="theme" data-v="' + t[0] + '" class="' + ((m.theme || 'auto') === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>';
    } else if (o.gKit === 'table') {
      var t = o.gTable;
      h += '<div class="ps-h">Хүснэгт</div><button type="button" class="btn acc full" data-kit-edit="1">' + ic('sliders') + 'Өгөгдөл засах</button>' +
        '<div class="ps-l">Загвар</div><div class="kit-stys">' + TSTY.map(function (s, i) { return '<button type="button" data-kit-set="style" data-v="' + i + '" class="' + (i === (t.style || 0) ? 'on' : '') + '" title="' + s.name + '"><i style="background:' + (s.head || '#fff') + '"></i><i style="background:' + (s.body || '#fff') + '"></i><i style="background:' + (s.band || s.body || '#fff') + '"></i></button>'; }).join('') + '</div>' +
        '<label class="chk"><input type="checkbox" data-kit-chk="header"' + (t.header ? ' checked' : '') + '> Эхний мөр — толгой</label>' +
        '<label class="chk"><input type="checkbox" data-kit-chk="zebra"' + (t.zebra ? ' checked' : '') + '> Судалтай мөр</label>';
    } else if (o.gKit === 'mockup') {
      var mk = o.gMockup, cat = MOCKS[mk.kind].cat;
      h += '<div class="ps-h">Mockup</div><button type="button" class="btn acc full" data-kit-edit="1">' + ic('image') + (mockSrc(o) ? 'Зураг солих' : 'Зураг оруулах') + '</button>' +
        '<div class="ps-l">Төрөл</div><div class="kit-mk">' + Object.keys(MOCKS).filter(function (k) { return MOCKS[k].cat === cat; }).map(function (k) {
          return '<button type="button" data-kit-set="kind" data-v="' + k + '" class="' + (k === mk.kind ? 'on' : '') + '" title="' + MOCKS[k].name + '">' + tileSvg(MK_ICON[k]) + '</button>'; }).join('') + '</div>' +
        (cat !== 'web' ? '<div class="ps-l">' + (mk.kind === 'tshirt' || mk.kind === 'mug' ? 'Өнгө' : mk.kind === 'card' ? 'Арын картын өнгө' : mk.kind === 'poster' ? 'Хүрээний өнгө' : mk.kind === 'book' ? 'Хавтасны өнгө' : 'Их биеийн өнгө') + '</div><div class="sw-row">' +
          MK_COLORS.map(function (c) { return '<button type="button" class="sw" data-kit-set="color" data-v="' + c + '" style="background:' + c + '" title="' + c + '"></button>'; }).join('') + '</div>' : '') +
        (cat === 'web' ? '<div class="ps-l">Хаяг</div><div class="nf"><input data-kit-url value="' + esc(mk.url || '') + '" spellcheck="false" style="padding-left:8px"></div>' : '');
    }
    return h + '</div>';
  }

  // ================= events =================
  document.addEventListener('click', function (e) {
    var lp = e.target.closest('#lp-body'), rp = e.target.closest('#rp-body');
    if (!lp && !rp) return;
    var b = e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (lp) {
      if (d.kitChart) addChart(d.kitChart);
      else if (d.kitTable) addTable();
      else if (d.kitMock) addMockup(d.kitMock);
      else if (d.kitIcon) addIcon(+d.kitIcon);
      else if (d.kitDg) addDiagram(d.kitDg);
      return;
    }
    var o = E().active(); if (!o || !o.gKit) return;
    if (d.kitEdit) { edit(o); return; }
    if (d.kitSet) {
      var key = o.gKit === 'chart' ? 'gChart' : o.gKit === 'table' ? 'gTable' : 'gMockup', m = clone(o[key]), v = d.v;
      m[d.kitSet] = d.kitSet === 'pal' || d.kitSet === 'style' ? +v : v;
      if (d.kitSet === 'kind') m.color = MOCKS[v].color;
      rebuild(o, m);
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.closest('#rp-body')) return;
    var o = E().active(); if (!o || !o.gKit) return;
    if (t.dataset.kitChk) { var key = o.gKit === 'chart' ? 'gChart' : 'gTable', m = clone(o[key]); m[t.dataset.kitChk] = t.checked; rebuild(o, m); }
    if (t.hasAttribute('data-kit-url')) { var mm = clone(o.gMockup); mm.url = t.value.trim(); rebuild(o, mm); }
  });
  document.addEventListener('input', function (e) {
    var t = e.target; if (!t.hasAttribute('data-kit-q')) return;
    var q = t.value.trim().toLowerCase();
    document.querySelectorAll('.kit-icons [data-kit-icon]').forEach(function (b) { b.hidden = q && b.dataset.n.indexOf(q) < 0; });
  });
  // keep the editor's shortcuts (Delete, Ctrl+Z …) away from inputs in the right panel
  document.addEventListener('keydown', function (e) { if (e.target.hasAttribute && (e.target.hasAttribute('data-kit-url') || e.target.hasAttribute('data-kit-q'))) e.stopPropagation(); }, true);

  // ================= PowerPoint =================
  function native(o) { return (o.gKit === 'chart' || o.gKit === 'table') && !o.angle && !o.skewX && !o.skewY && o.visible !== false; }
  function hex(c) { c = String(c || ''); if (c[0] === '#') return c.slice(1, 7).toUpperCase(); var m = c.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(function (v) { return ('0' + (+v).toString(16)).slice(-2); }).join('').toUpperCase() : '000000'; }
  function toPptx(pptx, s, o, f, k) {
    var c = o.getCenterPoint(), w = o.width * Math.abs(o.scaleX), h = o.height * Math.abs(o.scaleY);
    var box = { x: (c.x - w / 2 - f.left) * k, y: (c.y - h / 2 - f.top) * k, w: w * k, h: h * k }, pt = function (px) { return Math.max(6, +(px * Math.abs(o.scaleY) * k * 72).toFixed(1)); };
    if (o.gKit === 'table') {
      var m = o.gTable, L = tableLayout(m), st = TSTY[m.style] || TSTY[0], sx = Math.abs(o.scaleX) * k;
      var rows = m.rows.map(function (r, ri) {
        var head = m.header && ri === 0, bodyIx = ri - (m.header ? 1 : 0), fill = head ? st.head : (m.zebra && bodyIx % 2 === 1 ? st.band : st.body);
        return r.concat(Array(Math.max(0, L.nc - r.length)).fill('')).map(function (v, ci) {
          var op = { color: hex(head ? st.headInk : st.ink), bold: head, align: L.align[ci] === 'right' ? 'right' : 'left', valign: 'middle', fontFace: fontOf(m), fontSize: pt(L.fs),
            margin: Math.max(1, +(L.pad * sx * 72).toFixed(1)), border: [{ type: 'none' }, { type: 'none' }, { type: ri < m.rows.length - 1 ? 'solid' : 'none', pt: head && st.plain ? 1.5 : 0.75, color: hex(head && st.plain ? st.ink : st.line) }, { type: 'none' }] };
          if (fill) op.fill = { color: hex(fill) };
          return { text: String(v == null ? '' : v), options: op };
        });
      });
      s.addTable(rows, { x: box.x, y: box.y, w: box.w, colW: L.widths.map(function (cw) { return +(cw * sx).toFixed(3); }), rowH: +(L.rowH * Math.abs(o.scaleY) * k).toFixed(3), autoPage: false });
      return;
    }
    var mc = o.gChart, ink = inkFor(o, mc), cols = palOf(mc).map(hex), pie = mc.type === 'pie' || mc.type === 'donut';
    var T = pptx.ChartType || pptx.charts, type = { col: T.bar, bar: T.bar, stack: T.bar, line: T.line, area: T.area, pie: T.pie, donut: T.doughnut }[mc.type] || T.bar;
    var series = (pie ? mc.series.slice(0, 1) : mc.series).map(function (se) { return { name: se.name, labels: mc.labels.slice(), values: mc.labels.map(function (_, i) { return toNum(se.values[i]); }) }; });
    var op = Object.assign({}, box, {
      chartColors: pie ? mc.labels.map(function (_, i) { return cols[i % cols.length]; }) : cols.slice(0, Math.max(1, series.length)),
      showLegend: !!mc.legend && (pie || series.length > 1), legendPos: 'b', legendFontSize: pt(22), legendColor: hex(ink.muted), legendFontFace: fontOf(mc),
      showTitle: !!mc.title, title: mc.title || '', titleFontSize: pt(34), titleColor: hex(ink.ink), titleFontFace: fontOf(mc), titleBold: true,
      showValue: !!mc.values && !pie, showPercent: !!mc.values && pie, showLabel: false, dataLabelFontSize: pt(20), dataLabelColor: hex(pie || mc.type === 'stack' ? '#ffffff' : ink.ink), dataLabelFontFace: fontOf(mc),
      catAxisLabelColor: hex(ink.muted), valAxisLabelColor: hex(ink.muted), catAxisLabelFontSize: pt(21), valAxisLabelFontSize: pt(20), catAxisLabelFontFace: fontOf(mc), valAxisLabelFontFace: fontOf(mc),
      valGridLine: mc.grid ? { color: hex(ink.grid), size: 0.75, style: 'dash' } : { style: 'none' }, catGridLine: { style: 'none' },
      catAxisLineShow: true, valAxisLineShow: false, catAxisLineColor: hex(ink.muted)
    });
    if (mc.type === 'col' || mc.type === 'stack') op.barDir = 'col';
    if (mc.type === 'bar') { op.barDir = 'bar'; op.catAxisOrientation = 'maxMin'; op.valAxisOrientation = 'minMax'; }
    if (mc.type === 'stack') op.barGrouping = 'stacked';
    if (mc.type === 'col' || mc.type === 'bar') op.barGapWidthPct = 60;
    if (mc.type === 'line' || mc.type === 'area') { op.lineSize = 3; op.lineDataSymbol = mc.type === 'line' ? 'circle' : 'none'; op.lineDataSymbolSize = 8; op.dataLabelPosition = 't'; }
    if (mc.type === 'area') op.chartColorsOpacity = 45;
    if (mc.type === 'donut') op.holeSize = 58;
    if (pie) { op.dataLabelPosition = 'ctr'; op.dataBorder = { pt: 1.5, color: ink.dark ? '111827' : 'FFFFFF' }; }
    s.addChart(type, series, op);
  }

  window.GKit = { panel: panel, rightUI: rightUI, edit: edit, native: native, toPptx: toPptx,
    // for tests
    _: { buildChart: buildChart, buildTable: buildTable, buildMockup: buildMockup, sampleChart: sampleChart, sampleTable: sampleTable, modelFromGrid: modelFromGrid, MOCKS: MOCKS, ICONS: ICONS, addChart: addChart, addTable: addTable, addMockup: addMockup, addIcon: addIcon, addDiagram: addDiagram, rebuild: rebuild } };
})();
