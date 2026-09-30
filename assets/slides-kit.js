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
    var s = String(v == null ? '' : v).replace(/[−–]/g, '-').replace(/[\s ,₮$%]/g, '').replace(/[^\d.\-eE+]/g, '');
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
    if (m.title) {   // long titles wrap inside the chart width
      var tt = new fabric.Textbox(String(m.title), { fontFamily: font, fill: ink.ink, fontSize: 34, fontWeight: 700, left: 0, top: 0, width: W, objectCaching: false, splitByGrapheme: !/\s/.test(m.title) });
      out.push(tt); top = tt.height + 18;
    }
    var series = m.series.filter(function (s) { return s; }), labels = m.labels;
    var n = labels.length;
    // legend
    var legendItems = pie ? labels : series.map(function (s) { return s.name; });
    if (m.legend && (pie || series.length > 1)) {
      var lx = 0, ly = 0, rows = [[]], rw = 0, parts = [];
      legendItems.forEach(function (name, i) {
        var t = T(name, { fontSize: 22, fill: ink.muted });
        if (t.width > W - 60) t.set({ scaleX: (W - 60) / t.width, scaleY: (W - 60) / t.width });
        var w = 28 + t.width * t.scaleX + 26;
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
  // Escape closes the window even when focus is outside it (e.g. after the file picker)
  window.addEventListener('keydown', function (e) { if (dlg && e.key === 'Escape' && !dlg.contains(e.target)) closeDlg(); });
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
    var text = /\.(csv|tsv|txt)$/i.test(file.name) || /^text\//.test(file.type);   // CSV as UTF-8 text (Cyrillic, − signs)
    ed.loadScript('/assets/vendor/xlsx.min.js').then(function () { return text ? file.text() : file.arrayBuffer(); }).then(function (buf) {
      var wb = window.XLSX.read(buf, { type: text ? 'string' : 'array' }), ws = wb.Sheets[wb.SheetNames[0]];
      var rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }).filter(function (r) { return r.some(function (c) { return String(c).trim(); }); });
      if (!rows.length) throw new Error('empty');
      rows = rows.slice(0, st.kind === 'chart' ? 60 : 40).map(function (r) { return r.slice(0, 16).map(function (c) { return String(c); }); });
      if (!dlg || dlg._state !== st) return;
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

  // ================= Mongolian ornaments & nature =================
  // Only traditional ornaments, redrawn to the geometry of reference drawings the site owner supplied (none invented):
  //   Өлзий хээ — endless knot: 4×4 woven lattice, loops at the corners and sides, over/under alternating;
  //               also as a ribbon (double line), with square loops, as a plain rhombus lattice and inside a ring
  //   Алхан хээ — «hammer» band: a row of bars, each with a stem down to a running line, between two rails
  //   Ороолт хээ — continuous square key (meander) band
  function ulziiD(ox, oy, k, gap, diamond) {   // path in a 120×120 box, placed at (ox, oy) and scaled by k; diamond = turned 45°
    var P = [30, 50, 70, 90], g = gap == null ? 5 : gap, d = '', px = 0, c45 = Math.SQRT1_2;
    // X(x) remembers x so Y(y) can rotate the point (x, y) about the box centre
    var X = function (v) { px = v; return diamond ? '' : (ox + v * k).toFixed(2); };
    var Y = function (v) {
      if (!diamond) return (oy + v * k).toFixed(2);
      var dx = px - 60, dy = v - 60;
      return (ox + (60 + (dx - dy) * c45) * k).toFixed(2) + ' ' + (oy + (60 + (dx + dy) * c45) * k).toFixed(2);
    };
    P.forEach(function (y, i) { var x = 30, seg = []; P.forEach(function (cx, j) { if ((i + j) % 2 === 1) { seg.push([x, cx - g]); x = cx + g; } }); seg.push([x, 90]);
      seg.forEach(function (q) { if (q[1] > q[0]) d += 'M' + X(q[0]) + ' ' + Y(y) + 'L' + X(q[1]) + ' ' + Y(y); }); });
    P.forEach(function (x, j) { var y = 30, seg = []; P.forEach(function (cy, i) { if ((i + j) % 2 === 0) { seg.push([y, cy - g]); y = cy + g; } }); seg.push([y, 90]);
      seg.forEach(function (q) { if (q[1] > q[0]) d += 'M' + X(x) + ' ' + Y(q[0]) + 'L' + X(x) + ' ' + Y(q[1]); }); });
    [[30, 30, -5, 30, 30, -5], [90, 30, 125, 30, 90, -5], [30, 90, -5, 90, 30, 125], [90, 90, 125, 90, 90, 125]].forEach(function (c) {
      d += 'M' + X(c[0]) + ' ' + Y(c[1]) + 'C' + X(c[2]) + ' ' + Y(c[3]) + ' ' + X(c[4]) + ' ' + Y(c[5]) + ' ' + X(c[0]) + ' ' + Y(c[1]); });
    [[30, 50, 10, 50, 10, 70, 30, 70], [90, 50, 110, 50, 110, 70, 90, 70], [50, 30, 50, 10, 70, 10, 70, 30], [50, 90, 50, 110, 70, 110, 70, 90]].forEach(function (c) {
      d += 'M' + X(c[0]) + ' ' + Y(c[1]) + 'C' + X(c[2]) + ' ' + Y(c[3]) + ' ' + X(c[4]) + ' ' + Y(c[5]) + ' ' + X(c[6]) + ' ' + Y(c[7]); });
    return d;
  }
  // Өлзий with square loops (as in the rectilinear drawings): same lattice, loops made of straight segments
  function ulziiSqD(gap) {
    var P = [30, 50, 70, 90], g = gap == null ? 5 : gap, d = '';
    P.forEach(function (y, i) { var x = 30, seg = []; P.forEach(function (cx, j) { if ((i + j) % 2 === 1) { seg.push([x, cx - g]); x = cx + g; } }); seg.push([x, 90]);
      seg.forEach(function (q) { if (q[1] > q[0]) d += 'M' + q[0] + ' ' + y + 'H' + q[1]; }); });
    P.forEach(function (x, j) { var y = 30, seg = []; P.forEach(function (cy, i) { if ((i + j) % 2 === 0) { seg.push([y, cy - g]); y = cy + g; } }); seg.push([y, 90]);
      seg.forEach(function (q) { if (q[1] > q[0]) d += 'M' + x + ' ' + q[0] + 'V' + q[1]; }); });
    d += 'M30 30H6V6H30V30M90 30H114V6H90V30M30 90H6V114H30V90M90 90H114V114H90V90';
    d += 'M30 50H12V70H30M90 50H108V70H90M50 30V12H70V30M50 90V108H70V90';
    return d;
  }
  // rhombus lattice (the simplest Өлзий drawing): 4 lines each way on the 45° grid
  function ulziiNetD() {   // diamond (60,0)-(120,60)-(60,120)-(0,60): 4 lines parallel to each pair of edges → 3×3 rhombi
    var d = '', f = function (v) { return +v.toFixed(2); };
    [0, 1 / 3, 2 / 3, 1].forEach(function (t) {
      d += 'M' + f(60 + 60 * t) + ' ' + f(60 * t) + 'L' + f(60 * t) + ' ' + f(60 + 60 * t);
      d += 'M' + f(60 - 60 * t) + ' ' + f(60 * t) + 'L' + f(120 - 60 * t) + ' ' + f(60 + 60 * t);
    });
    return d;
  }
  // Алхан хээ: filled; unit 60 wide, band 58 high
  function hammerD(n) {
    var r = function (x, y, w, h) { return 'M' + x + ' ' + y + 'h' + w + 'v' + h + 'h' + (-w) + 'z'; }, L = n * 60;
    var d = r(0, 0, L, 6) + r(0, 34, L, 7) + r(0, 52, L, 6);
    for (var k = 0; k < n; k++) d += r(k * 60 + 5, 15, 50, 9) + r(k * 60 + 26, 24, 8, 10);
    return d;
  }
  function alkhanD(n, ox, oy) {   // band 48 high, unit 40 wide
    ox = ox || 0; oy = oy || 0;
    var d = 'M' + ox + ' ' + oy + 'H' + (ox + n * 40) + 'M' + ox + ' ' + (oy + 48) + 'H' + (ox + n * 40);
    for (var k = 0; k < n; k++) { var x = ox + k * 40 + 4; d += 'M' + x + ' ' + (oy + 40) + 'V' + (oy + 8) + 'H' + (x + 28) + 'V' + (oy + 32) + 'H' + (x + 10) + 'V' + (oy + 16) + 'H' + (x + 20) + 'V' + (oy + 24) + 'M' + x + ' ' + (oy + 40) + 'H' + (x + 40); }
    return d;
  }
  // «Байгаль, гэр»: drawn in the style of Mongol zurag (traditional painting) — dark ink outlines, mineral colours,
  // peaks with nested contours, scale-like water, round-lobed trees, curled clouds, ger with хана lattice and toono
  var MN_ART = {"mountains":["0 0 400 200","<path d=\"M5 190 C35.6 107.5 69.6 47.5 90 40 C110.4 47.5 144.4 107.5 175 190 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M21 190 C45.9 123.1 73.4 74.4 90 68.3 C106.6 74.4 134.1 123.1 159 190 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M37.1 190 C56.1 138.6 77.3 101.3 90 96.6 C102.7 101.3 123.9 138.6 142.9 190 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M53.1 190 C66.4 154.2 81.1 128.2 90 124.9 C98.9 128.2 113.6 154.2 126.9 190 Z\" fill=\"#8cc3a4\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M69.2 190 C76.7 169.8 85 155 90 153.2 C95 155 103.3 169.8 110.8 190 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M230 190 C258.8 113 290.8 57 310 50 C329.2 57 361.2 113 390 190 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M245.1 190 C268.5 127.5 294.4 82.1 310 76.4 C325.6 82.1 351.5 127.5 374.9 190 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M260.2 190 C278.1 142.1 298 107.2 310 102.8 C322 107.2 341.9 142.1 359.8 190 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M275.3 190 C287.8 156.6 301.7 132.3 310 129.2 C318.3 132.3 332.2 156.6 344.7 190 Z\" fill=\"#8cc3a4\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M290.4 190 C297.4 171.1 305.3 157.4 310 155.7 C314.7 157.4 322.6 171.1 329.6 190 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M95 195 C132.8 93.2 174.8 19.2 200 10 C225.2 19.2 267.2 93.2 305 195 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M114.8 195 C145.5 112.4 179.6 52.4 200 44.9 C220.4 52.4 254.5 112.4 285.2 195 Z\" fill=\"#8cc3a4\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M134.6 195 C158.2 131.6 184.3 85.6 200 79.8 C215.7 85.6 241.8 131.6 265.4 195 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M154.4 195 C170.8 150.8 189.1 118.7 200 114.7 C210.9 118.7 229.2 150.8 245.6 195 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M174.2 195 C183.5 170 193.8 151.9 200 149.6 C206.2 151.9 216.5 170 225.8 195 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>"],"river":["0 0 400 120","<clipPath id=\"wv-river\"><rect x=\"0\" y=\"0\" width=\"400\" height=\"120\"/></clipPath><g clip-path=\"url(#wv-river)\"><path d=\"M-52 -4 A26 26 0 0 1 0 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-43.2 -4 A17.2 17.2 0 0 1 -8.8 -4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-34.6 -4 A8.6 8.6 0 0 1 -17.4 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M0 -4 A26 26 0 0 1 52 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M8.8 -4 A17.2 17.2 0 0 1 43.2 -4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M17.4 -4 A8.6 8.6 0 0 1 34.6 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M52 -4 A26 26 0 0 1 104 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M60.8 -4 A17.2 17.2 0 0 1 95.2 -4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M69.4 -4 A8.6 8.6 0 0 1 86.6 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M104 -4 A26 26 0 0 1 156 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M112.8 -4 A17.2 17.2 0 0 1 147.2 -4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M121.4 -4 A8.6 8.6 0 0 1 138.6 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M156 -4 A26 26 0 0 1 208 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M164.8 -4 A17.2 17.2 0 0 1 199.2 -4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M173.4 -4 A8.6 8.6 0 0 1 190.6 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M208 -4 A26 26 0 0 1 260 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M216.8 -4 A17.2 17.2 0 0 1 251.2 -4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M225.4 -4 A8.6 8.6 0 0 1 242.6 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M260 -4 A26 26 0 0 1 312 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M268.8 -4 A17.2 17.2 0 0 1 303.2 -4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M277.4 -4 A8.6 8.6 0 0 1 294.6 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M312 -4 A26 26 0 0 1 364 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M320.8 -4 A17.2 17.2 0 0 1 355.2 -4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M329.4 -4 A8.6 8.6 0 0 1 346.6 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M364 -4 A26 26 0 0 1 416 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M372.8 -4 A17.2 17.2 0 0 1 407.2 -4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M381.4 -4 A8.6 8.6 0 0 1 398.6 -4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-26 19.4 A26 26 0 0 1 26 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-17.2 19.4 A17.2 17.2 0 0 1 17.2 19.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-8.6 19.4 A8.6 8.6 0 0 1 8.6 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M26 19.4 A26 26 0 0 1 78 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M34.8 19.4 A17.2 17.2 0 0 1 69.2 19.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M43.4 19.4 A8.6 8.6 0 0 1 60.6 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M78 19.4 A26 26 0 0 1 130 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M86.8 19.4 A17.2 17.2 0 0 1 121.2 19.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M95.4 19.4 A8.6 8.6 0 0 1 112.6 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M130 19.4 A26 26 0 0 1 182 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M138.8 19.4 A17.2 17.2 0 0 1 173.2 19.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M147.4 19.4 A8.6 8.6 0 0 1 164.6 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M182 19.4 A26 26 0 0 1 234 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M190.8 19.4 A17.2 17.2 0 0 1 225.2 19.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M199.4 19.4 A8.6 8.6 0 0 1 216.6 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M234 19.4 A26 26 0 0 1 286 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M242.8 19.4 A17.2 17.2 0 0 1 277.2 19.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M251.4 19.4 A8.6 8.6 0 0 1 268.6 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M286 19.4 A26 26 0 0 1 338 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M294.8 19.4 A17.2 17.2 0 0 1 329.2 19.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M303.4 19.4 A8.6 8.6 0 0 1 320.6 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M338 19.4 A26 26 0 0 1 390 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M346.8 19.4 A17.2 17.2 0 0 1 381.2 19.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M355.4 19.4 A8.6 8.6 0 0 1 372.6 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M390 19.4 A26 26 0 0 1 442 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M398.8 19.4 A17.2 17.2 0 0 1 433.2 19.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M407.4 19.4 A8.6 8.6 0 0 1 424.6 19.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-52 42.8 A26 26 0 0 1 0 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-43.2 42.8 A17.2 17.2 0 0 1 -8.8 42.8 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-34.6 42.8 A8.6 8.6 0 0 1 -17.4 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M0 42.8 A26 26 0 0 1 52 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M8.8 42.8 A17.2 17.2 0 0 1 43.2 42.8 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M17.4 42.8 A8.6 8.6 0 0 1 34.6 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M52 42.8 A26 26 0 0 1 104 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M60.8 42.8 A17.2 17.2 0 0 1 95.2 42.8 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M69.4 42.8 A8.6 8.6 0 0 1 86.6 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M104 42.8 A26 26 0 0 1 156 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M112.8 42.8 A17.2 17.2 0 0 1 147.2 42.8 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M121.4 42.8 A8.6 8.6 0 0 1 138.6 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M156 42.8 A26 26 0 0 1 208 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M164.8 42.8 A17.2 17.2 0 0 1 199.2 42.8 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M173.4 42.8 A8.6 8.6 0 0 1 190.6 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M208 42.8 A26 26 0 0 1 260 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M216.8 42.8 A17.2 17.2 0 0 1 251.2 42.8 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M225.4 42.8 A8.6 8.6 0 0 1 242.6 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M260 42.8 A26 26 0 0 1 312 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M268.8 42.8 A17.2 17.2 0 0 1 303.2 42.8 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M277.4 42.8 A8.6 8.6 0 0 1 294.6 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M312 42.8 A26 26 0 0 1 364 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M320.8 42.8 A17.2 17.2 0 0 1 355.2 42.8 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M329.4 42.8 A8.6 8.6 0 0 1 346.6 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M364 42.8 A26 26 0 0 1 416 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M372.8 42.8 A17.2 17.2 0 0 1 407.2 42.8 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M381.4 42.8 A8.6 8.6 0 0 1 398.6 42.8 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-26 66.2 A26 26 0 0 1 26 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-17.2 66.2 A17.2 17.2 0 0 1 17.2 66.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-8.6 66.2 A8.6 8.6 0 0 1 8.6 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M26 66.2 A26 26 0 0 1 78 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M34.8 66.2 A17.2 17.2 0 0 1 69.2 66.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M43.4 66.2 A8.6 8.6 0 0 1 60.6 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M78 66.2 A26 26 0 0 1 130 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M86.8 66.2 A17.2 17.2 0 0 1 121.2 66.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M95.4 66.2 A8.6 8.6 0 0 1 112.6 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M130 66.2 A26 26 0 0 1 182 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M138.8 66.2 A17.2 17.2 0 0 1 173.2 66.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M147.4 66.2 A8.6 8.6 0 0 1 164.6 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M182 66.2 A26 26 0 0 1 234 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M190.8 66.2 A17.2 17.2 0 0 1 225.2 66.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M199.4 66.2 A8.6 8.6 0 0 1 216.6 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M234 66.2 A26 26 0 0 1 286 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M242.8 66.2 A17.2 17.2 0 0 1 277.2 66.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M251.4 66.2 A8.6 8.6 0 0 1 268.6 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M286 66.2 A26 26 0 0 1 338 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M294.8 66.2 A17.2 17.2 0 0 1 329.2 66.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M303.4 66.2 A8.6 8.6 0 0 1 320.6 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M338 66.2 A26 26 0 0 1 390 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M346.8 66.2 A17.2 17.2 0 0 1 381.2 66.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M355.4 66.2 A8.6 8.6 0 0 1 372.6 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M390 66.2 A26 26 0 0 1 442 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M398.8 66.2 A17.2 17.2 0 0 1 433.2 66.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M407.4 66.2 A8.6 8.6 0 0 1 424.6 66.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-52 89.6 A26 26 0 0 1 0 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-43.2 89.6 A17.2 17.2 0 0 1 -8.8 89.6 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-34.6 89.6 A8.6 8.6 0 0 1 -17.4 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M0 89.6 A26 26 0 0 1 52 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M8.8 89.6 A17.2 17.2 0 0 1 43.2 89.6 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M17.4 89.6 A8.6 8.6 0 0 1 34.6 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M52 89.6 A26 26 0 0 1 104 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M60.8 89.6 A17.2 17.2 0 0 1 95.2 89.6 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M69.4 89.6 A8.6 8.6 0 0 1 86.6 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M104 89.6 A26 26 0 0 1 156 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M112.8 89.6 A17.2 17.2 0 0 1 147.2 89.6 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M121.4 89.6 A8.6 8.6 0 0 1 138.6 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M156 89.6 A26 26 0 0 1 208 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M164.8 89.6 A17.2 17.2 0 0 1 199.2 89.6 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M173.4 89.6 A8.6 8.6 0 0 1 190.6 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M208 89.6 A26 26 0 0 1 260 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M216.8 89.6 A17.2 17.2 0 0 1 251.2 89.6 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M225.4 89.6 A8.6 8.6 0 0 1 242.6 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M260 89.6 A26 26 0 0 1 312 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M268.8 89.6 A17.2 17.2 0 0 1 303.2 89.6 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M277.4 89.6 A8.6 8.6 0 0 1 294.6 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M312 89.6 A26 26 0 0 1 364 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M320.8 89.6 A17.2 17.2 0 0 1 355.2 89.6 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M329.4 89.6 A8.6 8.6 0 0 1 346.6 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M364 89.6 A26 26 0 0 1 416 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M372.8 89.6 A17.2 17.2 0 0 1 407.2 89.6 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M381.4 89.6 A8.6 8.6 0 0 1 398.6 89.6 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-26 113 A26 26 0 0 1 26 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-17.2 113 A17.2 17.2 0 0 1 17.2 113 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-8.6 113 A8.6 8.6 0 0 1 8.6 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M26 113 A26 26 0 0 1 78 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M34.8 113 A17.2 17.2 0 0 1 69.2 113 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M43.4 113 A8.6 8.6 0 0 1 60.6 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M78 113 A26 26 0 0 1 130 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M86.8 113 A17.2 17.2 0 0 1 121.2 113 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M95.4 113 A8.6 8.6 0 0 1 112.6 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M130 113 A26 26 0 0 1 182 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M138.8 113 A17.2 17.2 0 0 1 173.2 113 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M147.4 113 A8.6 8.6 0 0 1 164.6 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M182 113 A26 26 0 0 1 234 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M190.8 113 A17.2 17.2 0 0 1 225.2 113 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M199.4 113 A8.6 8.6 0 0 1 216.6 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M234 113 A26 26 0 0 1 286 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M242.8 113 A17.2 17.2 0 0 1 277.2 113 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M251.4 113 A8.6 8.6 0 0 1 268.6 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M286 113 A26 26 0 0 1 338 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M294.8 113 A17.2 17.2 0 0 1 329.2 113 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M303.4 113 A8.6 8.6 0 0 1 320.6 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M338 113 A26 26 0 0 1 390 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M346.8 113 A17.2 17.2 0 0 1 381.2 113 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M355.4 113 A8.6 8.6 0 0 1 372.6 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M390 113 A26 26 0 0 1 442 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M398.8 113 A17.2 17.2 0 0 1 433.2 113 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M407.4 113 A8.6 8.6 0 0 1 424.6 113 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-52 136.4 A26 26 0 0 1 0 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-43.2 136.4 A17.2 17.2 0 0 1 -8.8 136.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-34.6 136.4 A8.6 8.6 0 0 1 -17.4 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M0 136.4 A26 26 0 0 1 52 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M8.8 136.4 A17.2 17.2 0 0 1 43.2 136.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M17.4 136.4 A8.6 8.6 0 0 1 34.6 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M52 136.4 A26 26 0 0 1 104 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M60.8 136.4 A17.2 17.2 0 0 1 95.2 136.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M69.4 136.4 A8.6 8.6 0 0 1 86.6 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M104 136.4 A26 26 0 0 1 156 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M112.8 136.4 A17.2 17.2 0 0 1 147.2 136.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M121.4 136.4 A8.6 8.6 0 0 1 138.6 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M156 136.4 A26 26 0 0 1 208 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M164.8 136.4 A17.2 17.2 0 0 1 199.2 136.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M173.4 136.4 A8.6 8.6 0 0 1 190.6 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M208 136.4 A26 26 0 0 1 260 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M216.8 136.4 A17.2 17.2 0 0 1 251.2 136.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M225.4 136.4 A8.6 8.6 0 0 1 242.6 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M260 136.4 A26 26 0 0 1 312 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M268.8 136.4 A17.2 17.2 0 0 1 303.2 136.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M277.4 136.4 A8.6 8.6 0 0 1 294.6 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M312 136.4 A26 26 0 0 1 364 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M320.8 136.4 A17.2 17.2 0 0 1 355.2 136.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M329.4 136.4 A8.6 8.6 0 0 1 346.6 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M364 136.4 A26 26 0 0 1 416 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M372.8 136.4 A17.2 17.2 0 0 1 407.2 136.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M381.4 136.4 A8.6 8.6 0 0 1 398.6 136.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/></g><rect x=\"1\" y=\"1\" width=\"398\" height=\"118\" fill=\"none\" stroke=\"#2b2118\" stroke-width=\"2.4\"/>"],"sun":["0 0 200 200","<path d=\"M152.6 93.1 L180.6 100 L152.6 106.9 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M151.2 113.8 L164.9 126.9 L146 126.5 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M142.1 132.3 L157 157 L132.3 142.1 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M126.5 146 L126.9 164.9 L113.8 151.2 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M106.9 152.6 L100 180.6 L93.1 152.6 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M86.2 151.2 L73.1 164.9 L73.5 146 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M67.7 142.1 L43 157 L57.9 132.3 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M54 126.5 L35.1 126.9 L48.8 113.8 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M47.4 106.9 L19.4 100 L47.4 93.1 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M48.8 86.2 L35.1 73.1 L54 73.5 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M57.9 67.7 L43 43 L67.7 57.9 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M73.5 54 L73.1 35.1 L86.2 48.8 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M93.1 47.4 L100 19.4 L106.9 47.4 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M113.8 48.8 L126.9 35.1 L126.5 54 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M132.3 57.9 L157 43 L142.1 67.7 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M146 73.5 L164.9 73.1 L151.2 86.2 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><circle cx=\"100\" cy=\"100\" r=\"52\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"100\" cy=\"100\" r=\"37.4\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><circle cx=\"100\" cy=\"100\" r=\"23.4\" fill=\"none\" stroke=\"#2b2118\" stroke-width=\"1.6\"/>"],"cloud":["0 0 240 130","<circle cx=\"62.8\" cy=\"79.8\" r=\"28.6\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"96.6\" cy=\"59\" r=\"36.4\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"138.2\" cy=\"61.6\" r=\"32.2\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"172\" cy=\"79.8\" r=\"26\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><path d=\"M42 100.6 H192.8\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><rect x=\"39.4\" y=\"82.4\" width=\"153.4\" height=\"17.2\" fill=\"#fbf6ea\"/><path d=\"M45.1 79.8 L45.6 82 L46.3 84.1 L47.3 86.1 L48.6 87.9 L50 89.4 L51.6 90.8 L53.3 91.8 L55.1 92.7 L56.9 93.2 L58.8 93.6 L60.7 93.6 L62.5 93.4 L64.2 93 L65.8 92.4 L67.3 91.6 L68.6 90.6 L69.7 89.5 L70.7 88.3 L71.5 87 L72 85.6 L72.4 84.3 L72.6 82.9 L72.5 81.5 L72.3 80.3 L72 79.1 L71.5 78 L70.8 77 L70.1 76.1 L69.3 75.4 L68.4 74.8 L67.5 74.4 L66.6 74.1 L65.7 74 L64.8 74 L64 74.1 L63.2 74.4 L62.5 74.7 L61.9 75.1 L61.4 75.6\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M74 59 L74.6 61.8 L75.6 64.5 L76.9 67 L78.5 69.3 L80.3 71.3 L82.3 72.9 L84.5 74.3 L86.8 75.4 L89.1 76.1 L91.5 76.5 L93.9 76.6 L96.2 76.4 L98.4 75.8 L100.4 75 L102.3 74 L104 72.8 L105.4 71.4 L106.6 69.8 L107.6 68.1 L108.3 66.4 L108.8 64.7 L109 62.9 L109 61.2 L108.7 59.6 L108.3 58.1 L107.6 56.7 L106.8 55.4 L105.9 54.3 L104.9 53.4 L103.7 52.7 L102.6 52.1 L101.4 51.8 L100.3 51.6 L99.1 51.6 L98.1 51.8 L97.1 52.1 L96.2 52.5 L95.5 53 L94.9 53.6\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M158.2 61.6 L157.6 64.1 L156.8 66.5 L155.6 68.7 L154.3 70.7 L152.6 72.5 L150.9 74 L148.9 75.2 L146.9 76.1 L144.8 76.8 L142.7 77.1 L140.6 77.2 L138.6 77 L136.6 76.5 L134.8 75.8 L133.2 74.9 L131.7 73.8 L130.4 72.5 L129.3 71.2 L128.4 69.7 L127.8 68.2 L127.4 66.6 L127.2 65.1 L127.2 63.6 L127.4 62.1 L127.9 60.8 L128.4 59.5 L129.1 58.4 L130 57.4 L130.9 56.6 L131.9 56 L132.9 55.5 L133.9 55.2 L135 55.1 L136 55.1 L136.9 55.2 L137.8 55.5 L138.5 55.8 L139.2 56.3 L139.7 56.8\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M188.1 79.8 L187.7 81.8 L187 83.8 L186.1 85.5 L184.9 87.1 L183.6 88.6 L182.2 89.8 L180.6 90.7 L179 91.5 L177.3 92 L175.6 92.3 L173.9 92.4 L172.3 92.2 L170.7 91.8 L169.3 91.3 L167.9 90.5 L166.7 89.6 L165.7 88.6 L164.8 87.5 L164.1 86.3 L163.6 85.1 L163.3 83.8 L163.1 82.6 L163.2 81.4 L163.3 80.2 L163.7 79.1 L164.1 78.1 L164.7 77.2 L165.4 76.4 L166.1 75.8 L166.9 75.3 L167.7 74.9 L168.6 74.6 L169.4 74.5 L170.2 74.5 L170.9 74.6 L171.6 74.9 L172.3 75.2 L172.8 75.5 L173.2 76\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>"],"larch":["-40 -10 220 210","<rect x=\"61\" y=\"139.5\" width=\"18\" height=\"52.5\" fill=\"#7a4b2a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-23 139.5 Q42.1 109.5 70 57 Q97.9 109.5 163 139.5 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M14.2 132 Q70 109.5 125.8 132\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.6\"/><path d=\"M-5 79.5 Q47.5 49.5 70 -3 Q92.5 49.5 145 79.5 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M25 72 Q70 49.5 115 72\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.6\"/><path d=\"M13 24 Q52.9 -6 70 -58.5 Q87.1 -6 127 24 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M35.8 16.5 Q70 -6 104.2 16.5\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.6\"/>"],"pine":["0 -30 160 235","<path d=\"M68.6 195 L73.3 90.5 L86.7 90.5 L91.4 195 Z\" fill=\"#7a4b2a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><circle cx=\"80\" cy=\"28.8\" r=\"47.5\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M53.9 38.2 A26.1 26.1 0 0 1 106.1 38.2\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"40.1\" cy=\"57.2\" r=\"39.9\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M18.2 65.2 A21.9 21.9 0 0 1 62 65.2\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"119.9\" cy=\"57.2\" r=\"39.9\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M98 65.2 A21.9 21.9 0 0 1 141.8 65.2\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"56.2\" cy=\"85.8\" r=\"38\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M35.3 93.4 A20.9 20.9 0 0 1 77.2 93.4\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"103.8\" cy=\"85.8\" r=\"38\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M82.8 93.4 A20.9 20.9 0 0 1 124.7 93.4\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/>"],"ger":["0 0 260 170","<path d=\"M15 108.6 H245 V150 Q130 159.2 15 150 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><clipPath id=\"gw-ger\"><path d=\"M15 108.6 H245 V150 Q130 159.2 15 150 Z\"/></clipPath><g clip-path=\"url(#gw-ger)\"><path d=\"M-26.4 150 L15 108.6 M15 150 L-26.4 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M-8 150 L33.4 108.6 M33.4 150 L-8 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M10.4 150 L51.8 108.6 M51.8 150 L10.4 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M28.8 150 L70.2 108.6 M70.2 150 L28.8 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M47.2 150 L88.6 108.6 M88.6 150 L47.2 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M65.6 150 L107 108.6 M107 150 L65.6 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M84 150 L125.4 108.6 M125.4 150 L84 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M102.4 150 L143.8 108.6 M143.8 150 L102.4 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M120.8 150 L162.2 108.6 M162.2 150 L120.8 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M139.2 150 L180.6 108.6 M180.6 150 L139.2 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M157.6 150 L199 108.6 M199 150 L157.6 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M176 150 L217.4 108.6 M217.4 150 L176 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M194.4 150 L235.8 108.6 M235.8 150 L194.4 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M212.8 150 L254.2 108.6 M254.2 150 L212.8 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M231.2 150 L272.6 108.6 M272.6 150 L231.2 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/></g><path d=\"M8.1 110.9 Q66.8 71.5 111.6 69.5 H148.4 Q193.2 71.5 251.9 110.9 Z\" fill=\"#f3e6c8\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><path d=\"M113.9 69.5 L15 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M117.9 69.5 L43.8 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M122 69.5 L72.5 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M126 69.5 L101.2 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M130 69.5 L130 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M134 69.5 L158.8 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M138.1 69.5 L187.5 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M142.1 69.5 L216.2 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M146.1 69.5 L245 108.6\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M15 112.6 H245\" stroke=\"#c0392b\" stroke-width=\"5.8\"/><path d=\"M15 117.2 H245\" stroke=\"#2f5d8a\" stroke-width=\"2\"/><ellipse cx=\"130\" cy=\"69.5\" rx=\"19.6\" ry=\"5.8\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><rect x=\"120.2\" y=\"119\" width=\"19.6\" height=\"31.1\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><rect x=\"123.1\" y=\"121.8\" width=\"13.8\" height=\"25.3\" fill=\"none\" stroke=\"#d9a441\" stroke-width=\"1.6\"/><path d=\"M130 121.8 V147.1\" stroke=\"#d9a441\" stroke-width=\"1.6\"/>"],"steppe":["0 0 400 200","<rect width=\"400\" height=\"200\" fill=\"#f3e6c8\"/><path d=\"M344.3 51.8 L357.2 55 L344.3 58.2 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M343.6 61.4 L349.9 67.4 L341.2 67.2 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M339.4 69.9 L346.3 81.3 L334.9 74.4 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M332.2 76.2 L332.4 84.9 L326.4 78.6 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M323.2 79.3 L320 92.2 L316.8 79.3 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M313.6 78.6 L307.6 84.9 L307.8 76.2 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M305.1 74.4 L293.7 81.3 L300.6 69.9 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M298.8 67.2 L290.1 67.4 L296.4 61.4 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M295.7 58.2 L282.8 55 L295.7 51.8 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M296.4 48.6 L290.1 42.6 L298.8 42.8 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M300.6 40.1 L293.7 28.7 L305.1 35.6 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M307.8 33.8 L307.6 25.1 L313.6 31.4 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M316.8 30.7 L320 17.8 L323.2 30.7 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M326.4 31.4 L332.4 25.1 L332.2 33.8 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M334.9 35.6 L346.3 28.7 L339.4 40.1 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M341.2 42.8 L349.9 42.6 L343.6 48.6 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><circle cx=\"320\" cy=\"55\" r=\"24\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"320\" cy=\"55\" r=\"17.3\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><circle cx=\"320\" cy=\"55\" r=\"10.8\" fill=\"none\" stroke=\"#2b2118\" stroke-width=\"1.6\"/><path d=\"M0 120 Q100 90 200 120 T400 114 V200 H0Z\" fill=\"#8cc3a4\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M0 145 Q100 115 200 145 T400 139 V200 H0Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M0 168 Q100 138 200 168 T400 162 V200 H0Z\" fill=\"#8cc3a4\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M0 186 Q100 156 200 186 T400 180 V200 H0Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/>"],"lake":["0 0 400 220","<rect width=\"400\" height=\"220\" fill=\"#f3e6c8\"/><circle cx=\"58\" cy=\"43\" r=\"11\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"71\" cy=\"35\" r=\"14\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"87\" cy=\"36\" r=\"12.4\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"100\" cy=\"43\" r=\"10\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><path d=\"M50 51 H108\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><rect x=\"49\" y=\"44\" width=\"59\" height=\"6.6\" fill=\"#fbf6ea\"/><path d=\"M51.2 43 L51.4 43.9 L51.7 44.7 L52 45.4 L52.5 46.1 L53.1 46.7 L53.7 47.2 L54.3 47.6 L55 48 L55.7 48.2 L56.5 48.3 L57.2 48.3 L57.9 48.2 L58.5 48.1 L59.2 47.8 L59.7 47.5 L60.2 47.2 L60.7 46.7 L61 46.3 L61.3 45.8 L61.5 45.2 L61.7 44.7 L61.8 44.2 L61.7 43.7 L61.7 43.2 L61.5 42.7 L61.3 42.3 L61.1 41.9 L60.8 41.6 L60.5 41.3 L60.2 41.1 L59.8 40.9 L59.5 40.8 L59.1 40.8 L58.8 40.8 L58.4 40.8 L58.2 40.9 L57.9 41 L57.7 41.2 L57.5 41.4\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M62.3 35 L62.6 36.1 L62.9 37.1 L63.4 38.1 L64 39 L64.7 39.7 L65.5 40.4 L66.3 40.9 L67.2 41.3 L68.1 41.6 L69 41.7 L70 41.8 L70.8 41.7 L71.7 41.5 L72.5 41.2 L73.2 40.8 L73.8 40.3 L74.4 39.8 L74.9 39.2 L75.2 38.5 L75.5 37.9 L75.7 37.2 L75.8 36.5 L75.8 35.9 L75.7 35.2 L75.5 34.6 L75.2 34.1 L74.9 33.6 L74.6 33.2 L74.2 32.8 L73.7 32.6 L73.3 32.4 L72.9 32.2 L72.4 32.2 L72 32.2 L71.6 32.2 L71.2 32.3 L70.9 32.5 L70.6 32.7 L70.3 32.9\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M94.7 36 L94.5 37 L94.1 37.9 L93.7 38.7 L93.2 39.5 L92.6 40.2 L91.9 40.8 L91.1 41.2 L90.3 41.6 L89.5 41.8 L88.7 42 L87.9 42 L87.1 41.9 L86.4 41.7 L85.7 41.5 L85.1 41.1 L84.5 40.7 L84 40.2 L83.6 39.7 L83.2 39.1 L83 38.5 L82.8 37.9 L82.8 37.3 L82.8 36.8 L82.9 36.2 L83 35.7 L83.2 35.2 L83.5 34.8 L83.8 34.4 L84.2 34.1 L84.6 33.8 L85 33.7 L85.4 33.5 L85.8 33.5 L86.1 33.5 L86.5 33.5 L86.8 33.6 L87.1 33.8 L87.4 34 L87.6 34.2\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M106.2 43 L106 43.8 L105.8 44.5 L105.4 45.2 L105 45.8 L104.5 46.4 L103.9 46.8 L103.3 47.2 L102.7 47.5 L102 47.7 L101.4 47.8 L100.7 47.8 L100.1 47.8 L99.5 47.6 L99 47.4 L98.4 47.1 L98 46.8 L97.6 46.4 L97.2 46 L97 45.5 L96.8 45 L96.6 44.6 L96.6 44.1 L96.6 43.6 L96.7 43.2 L96.8 42.7 L97 42.4 L97.2 42 L97.4 41.7 L97.7 41.5 L98 41.3 L98.4 41.1 L98.7 41 L99 41 L99.3 41 L99.6 41 L99.9 41.1 L100.1 41.2 L100.3 41.4 L100.5 41.5\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><circle cx=\"302.4\" cy=\"36.4\" r=\"8.8\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"312.8\" cy=\"30\" r=\"11.2\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"325.6\" cy=\"30.8\" r=\"9.9\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"336\" cy=\"36.4\" r=\"8\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><path d=\"M296 42.8 H342.4\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><rect x=\"295.2\" y=\"37.2\" width=\"47.2\" height=\"5.3\" fill=\"#fbf6ea\"/><path d=\"M296.9 36.4 L297.1 37.1 L297.3 37.7 L297.6 38.3 L298 38.9 L298.5 39.4 L298.9 39.8 L299.5 40.1 L300 40.4 L300.6 40.5 L301.2 40.6 L301.7 40.7 L302.3 40.6 L302.8 40.5 L303.3 40.3 L303.8 40 L304.2 39.7 L304.5 39.4 L304.8 39 L305.1 38.6 L305.2 38.2 L305.3 37.8 L305.4 37.3 L305.4 36.9 L305.3 36.5 L305.2 36.2 L305.1 35.8 L304.9 35.5 L304.6 35.3 L304.4 35 L304.1 34.9 L303.8 34.7 L303.6 34.7 L303.3 34.6 L303 34.6 L302.8 34.7 L302.5 34.7 L302.3 34.8 L302.1 35 L302 35.1\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M305.9 30 L306 30.9 L306.3 31.7 L306.7 32.5 L307.2 33.2 L307.8 33.8 L308.4 34.3 L309.1 34.7 L309.8 35 L310.5 35.3 L311.2 35.4 L312 35.4 L312.7 35.3 L313.3 35.2 L314 34.9 L314.6 34.6 L315.1 34.2 L315.5 33.8 L315.9 33.3 L316.2 32.8 L316.4 32.3 L316.6 31.7 L316.6 31.2 L316.6 30.7 L316.5 30.2 L316.4 29.7 L316.2 29.3 L315.9 28.9 L315.7 28.6 L315.3 28.3 L315 28.1 L314.6 27.9 L314.3 27.8 L313.9 27.7 L313.6 27.7 L313.3 27.8 L313 27.9 L312.7 28 L312.5 28.2 L312.3 28.3\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M331.8 30.8 L331.6 31.6 L331.3 32.3 L331 33 L330.5 33.6 L330 34.1 L329.5 34.6 L328.9 35 L328.3 35.3 L327.6 35.5 L327 35.6 L326.3 35.6 L325.7 35.5 L325.1 35.4 L324.6 35.2 L324 34.9 L323.6 34.6 L323.2 34.2 L322.9 33.7 L322.6 33.3 L322.4 32.8 L322.3 32.3 L322.2 31.9 L322.2 31.4 L322.3 31 L322.4 30.5 L322.6 30.2 L322.8 29.8 L323.1 29.5 L323.3 29.3 L323.7 29.1 L324 28.9 L324.3 28.8 L324.6 28.8 L324.9 28.8 L325.2 28.8 L325.5 28.9 L325.7 29 L325.9 29.2 L326.1 29.3\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M341 36.4 L340.8 37 L340.6 37.6 L340.3 38.2 L340 38.7 L339.6 39.1 L339.1 39.5 L338.7 39.8 L338.2 40 L337.6 40.2 L337.1 40.2 L336.6 40.3 L336.1 40.2 L335.6 40.1 L335.2 39.9 L334.7 39.7 L334.4 39.4 L334.1 39.1 L333.8 38.8 L333.6 38.4 L333.4 38 L333.3 37.6 L333.3 37.3 L333.3 36.9 L333.3 36.5 L333.4 36.2 L333.6 35.9 L333.8 35.6 L334 35.4 L334.2 35.2 L334.4 35 L334.7 34.9 L334.9 34.8 L335.2 34.8 L335.4 34.8 L335.7 34.8 L335.9 34.9 L336.1 35 L336.2 35.1 L336.4 35.2\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M30 130 C66 69.5 106 25.5 130 20 C154 25.5 194 69.5 230 130 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M53.3 130 C80.9 83.6 111.6 49.8 130 45.6 C148.4 49.8 179.1 83.6 206.7 130 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M76.5 130 C95.8 97.6 117.2 74.1 130 71.2 C142.8 74.1 164.2 97.6 183.5 130 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M99.8 130 C110.7 111.7 122.7 98.4 130 96.7 C137.3 98.4 149.3 111.7 160.2 130 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M170 130 C206 64 246 16 270 10 C294 16 334 64 370 130 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M193.3 130 C220.9 79.3 251.6 42.5 270 37.9 C288.4 42.5 319.1 79.3 346.7 130 Z\" fill=\"#8cc3a4\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M216.5 130 C235.8 94.7 257.2 69 270 65.8 C282.8 69 304.2 94.7 323.5 130 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M239.8 130 C250.7 110 262.7 95.5 270 93.7 C277.3 95.5 289.3 110 300.2 130 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><clipPath id=\"lk-lake\"><rect x=\"0\" y=\"130\" width=\"400\" height=\"90\"/></clipPath><g clip-path=\"url(#lk-lake)\"><path d=\"M-40 142 A20 20 0 0 1 0 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-33.2 142 A13.2 13.2 0 0 1 -6.8 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-26.6 142 A6.6 6.6 0 0 1 -13.4 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M0 142 A20 20 0 0 1 40 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M6.8 142 A13.2 13.2 0 0 1 33.2 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M13.4 142 A6.6 6.6 0 0 1 26.6 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M40 142 A20 20 0 0 1 80 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M46.8 142 A13.2 13.2 0 0 1 73.2 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M53.4 142 A6.6 6.6 0 0 1 66.6 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M80 142 A20 20 0 0 1 120 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M86.8 142 A13.2 13.2 0 0 1 113.2 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M93.4 142 A6.6 6.6 0 0 1 106.6 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M120 142 A20 20 0 0 1 160 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M126.8 142 A13.2 13.2 0 0 1 153.2 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M133.4 142 A6.6 6.6 0 0 1 146.6 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M160 142 A20 20 0 0 1 200 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M166.8 142 A13.2 13.2 0 0 1 193.2 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M173.4 142 A6.6 6.6 0 0 1 186.6 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M200 142 A20 20 0 0 1 240 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M206.8 142 A13.2 13.2 0 0 1 233.2 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M213.4 142 A6.6 6.6 0 0 1 226.6 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M240 142 A20 20 0 0 1 280 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M246.8 142 A13.2 13.2 0 0 1 273.2 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M253.4 142 A6.6 6.6 0 0 1 266.6 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M280 142 A20 20 0 0 1 320 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M286.8 142 A13.2 13.2 0 0 1 313.2 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M293.4 142 A6.6 6.6 0 0 1 306.6 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M320 142 A20 20 0 0 1 360 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M326.8 142 A13.2 13.2 0 0 1 353.2 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M333.4 142 A6.6 6.6 0 0 1 346.6 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M360 142 A20 20 0 0 1 400 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M366.8 142 A13.2 13.2 0 0 1 393.2 142 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M373.4 142 A6.6 6.6 0 0 1 386.6 142 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-20 160 A20 20 0 0 1 20 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-13.2 160 A13.2 13.2 0 0 1 13.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-6.6 160 A6.6 6.6 0 0 1 6.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M20 160 A20 20 0 0 1 60 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M26.8 160 A13.2 13.2 0 0 1 53.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M33.4 160 A6.6 6.6 0 0 1 46.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M60 160 A20 20 0 0 1 100 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M66.8 160 A13.2 13.2 0 0 1 93.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M73.4 160 A6.6 6.6 0 0 1 86.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M100 160 A20 20 0 0 1 140 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M106.8 160 A13.2 13.2 0 0 1 133.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M113.4 160 A6.6 6.6 0 0 1 126.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M140 160 A20 20 0 0 1 180 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M146.8 160 A13.2 13.2 0 0 1 173.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M153.4 160 A6.6 6.6 0 0 1 166.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M180 160 A20 20 0 0 1 220 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M186.8 160 A13.2 13.2 0 0 1 213.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M193.4 160 A6.6 6.6 0 0 1 206.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M220 160 A20 20 0 0 1 260 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M226.8 160 A13.2 13.2 0 0 1 253.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M233.4 160 A6.6 6.6 0 0 1 246.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M260 160 A20 20 0 0 1 300 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M266.8 160 A13.2 13.2 0 0 1 293.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M273.4 160 A6.6 6.6 0 0 1 286.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M300 160 A20 20 0 0 1 340 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M306.8 160 A13.2 13.2 0 0 1 333.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M313.4 160 A6.6 6.6 0 0 1 326.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M340 160 A20 20 0 0 1 380 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M346.8 160 A13.2 13.2 0 0 1 373.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M353.4 160 A6.6 6.6 0 0 1 366.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M380 160 A20 20 0 0 1 420 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M386.8 160 A13.2 13.2 0 0 1 413.2 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M393.4 160 A6.6 6.6 0 0 1 406.6 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-40 178 A20 20 0 0 1 0 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-33.2 178 A13.2 13.2 0 0 1 -6.8 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-26.6 178 A6.6 6.6 0 0 1 -13.4 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M0 178 A20 20 0 0 1 40 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M6.8 178 A13.2 13.2 0 0 1 33.2 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M13.4 178 A6.6 6.6 0 0 1 26.6 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M40 178 A20 20 0 0 1 80 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M46.8 178 A13.2 13.2 0 0 1 73.2 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M53.4 178 A6.6 6.6 0 0 1 66.6 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M80 178 A20 20 0 0 1 120 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M86.8 178 A13.2 13.2 0 0 1 113.2 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M93.4 178 A6.6 6.6 0 0 1 106.6 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M120 178 A20 20 0 0 1 160 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M126.8 178 A13.2 13.2 0 0 1 153.2 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M133.4 178 A6.6 6.6 0 0 1 146.6 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M160 178 A20 20 0 0 1 200 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M166.8 178 A13.2 13.2 0 0 1 193.2 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M173.4 178 A6.6 6.6 0 0 1 186.6 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M200 178 A20 20 0 0 1 240 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M206.8 178 A13.2 13.2 0 0 1 233.2 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M213.4 178 A6.6 6.6 0 0 1 226.6 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M240 178 A20 20 0 0 1 280 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M246.8 178 A13.2 13.2 0 0 1 273.2 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M253.4 178 A6.6 6.6 0 0 1 266.6 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M280 178 A20 20 0 0 1 320 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M286.8 178 A13.2 13.2 0 0 1 313.2 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M293.4 178 A6.6 6.6 0 0 1 306.6 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M320 178 A20 20 0 0 1 360 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M326.8 178 A13.2 13.2 0 0 1 353.2 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M333.4 178 A6.6 6.6 0 0 1 346.6 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M360 178 A20 20 0 0 1 400 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M366.8 178 A13.2 13.2 0 0 1 393.2 178 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M373.4 178 A6.6 6.6 0 0 1 386.6 178 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-20 196 A20 20 0 0 1 20 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-13.2 196 A13.2 13.2 0 0 1 13.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-6.6 196 A6.6 6.6 0 0 1 6.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M20 196 A20 20 0 0 1 60 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M26.8 196 A13.2 13.2 0 0 1 53.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M33.4 196 A6.6 6.6 0 0 1 46.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M60 196 A20 20 0 0 1 100 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M66.8 196 A13.2 13.2 0 0 1 93.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M73.4 196 A6.6 6.6 0 0 1 86.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M100 196 A20 20 0 0 1 140 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M106.8 196 A13.2 13.2 0 0 1 133.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M113.4 196 A6.6 6.6 0 0 1 126.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M140 196 A20 20 0 0 1 180 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M146.8 196 A13.2 13.2 0 0 1 173.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M153.4 196 A6.6 6.6 0 0 1 166.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M180 196 A20 20 0 0 1 220 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M186.8 196 A13.2 13.2 0 0 1 213.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M193.4 196 A6.6 6.6 0 0 1 206.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M220 196 A20 20 0 0 1 260 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M226.8 196 A13.2 13.2 0 0 1 253.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M233.4 196 A6.6 6.6 0 0 1 246.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M260 196 A20 20 0 0 1 300 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M266.8 196 A13.2 13.2 0 0 1 293.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M273.4 196 A6.6 6.6 0 0 1 286.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M300 196 A20 20 0 0 1 340 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M306.8 196 A13.2 13.2 0 0 1 333.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M313.4 196 A6.6 6.6 0 0 1 326.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M340 196 A20 20 0 0 1 380 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M346.8 196 A13.2 13.2 0 0 1 373.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M353.4 196 A6.6 6.6 0 0 1 366.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M380 196 A20 20 0 0 1 420 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M386.8 196 A13.2 13.2 0 0 1 413.2 196 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M393.4 196 A6.6 6.6 0 0 1 406.6 196 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/></g><path d=\"M0 130H400\" stroke=\"#2b2118\" stroke-width=\"2.4\"/>"],"gerScene":["0 0 400 240","<rect width=\"400\" height=\"240\" fill=\"#f3e6c8\"/><path d=\"M350.2 45.4 L361 48 L350.2 50.6 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M349.7 53.3 L354.9 58.3 L347.7 58.2 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M346.2 60.4 L351.9 69.9 L342.4 64.2 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M340.2 65.7 L340.3 72.9 L335.3 67.7 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M332.6 68.2 L330 79 L327.4 68.2 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M324.7 67.7 L319.7 72.9 L319.8 65.7 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M317.6 64.2 L308.1 69.9 L313.8 60.4 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M312.3 58.2 L305.1 58.3 L310.3 53.3 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M309.8 50.6 L299 48 L309.8 45.4 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M310.3 42.7 L305.1 37.7 L312.3 37.8 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M313.8 35.6 L308.1 26.1 L317.6 31.8 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M319.8 30.3 L319.7 23.1 L324.7 28.3 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M327.4 27.8 L330 17 L332.6 27.8 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M335.3 28.3 L340.3 23.1 L340.2 30.3 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M342.4 31.8 L351.9 26.1 L346.2 35.6 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M347.7 37.8 L354.9 37.7 L349.7 42.7 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><circle cx=\"330\" cy=\"48\" r=\"20\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"330\" cy=\"48\" r=\"14.4\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><circle cx=\"330\" cy=\"48\" r=\"9\" fill=\"none\" stroke=\"#2b2118\" stroke-width=\"1.6\"/><circle cx=\"72.4\" cy=\"46.4\" r=\"8.8\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"82.8\" cy=\"40\" r=\"11.2\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"95.6\" cy=\"40.8\" r=\"9.9\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"106\" cy=\"46.4\" r=\"8\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><path d=\"M66 52.8 H112.4\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><rect x=\"65.2\" y=\"47.2\" width=\"47.2\" height=\"5.3\" fill=\"#fbf6ea\"/><path d=\"M66.9 46.4 L67.1 47.1 L67.3 47.7 L67.6 48.3 L68 48.9 L68.5 49.4 L68.9 49.8 L69.5 50.1 L70 50.4 L70.6 50.5 L71.2 50.6 L71.7 50.7 L72.3 50.6 L72.8 50.5 L73.3 50.3 L73.8 50 L74.2 49.7 L74.5 49.4 L74.8 49 L75.1 48.6 L75.2 48.2 L75.3 47.8 L75.4 47.3 L75.4 46.9 L75.3 46.5 L75.2 46.2 L75.1 45.8 L74.9 45.5 L74.6 45.3 L74.4 45 L74.1 44.9 L73.8 44.7 L73.6 44.7 L73.3 44.6 L73 44.6 L72.8 44.7 L72.5 44.7 L72.3 44.8 L72.1 45 L72 45.1\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M75.9 40 L76 40.9 L76.3 41.7 L76.7 42.5 L77.2 43.2 L77.8 43.8 L78.4 44.3 L79.1 44.7 L79.8 45 L80.5 45.3 L81.2 45.4 L82 45.4 L82.7 45.3 L83.3 45.2 L84 44.9 L84.6 44.6 L85.1 44.2 L85.5 43.8 L85.9 43.3 L86.2 42.8 L86.4 42.3 L86.6 41.7 L86.6 41.2 L86.6 40.7 L86.5 40.2 L86.4 39.7 L86.2 39.3 L85.9 38.9 L85.7 38.6 L85.3 38.3 L85 38.1 L84.6 37.9 L84.3 37.8 L83.9 37.7 L83.6 37.7 L83.3 37.8 L83 37.9 L82.7 38 L82.5 38.2 L82.3 38.3\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M101.8 40.8 L101.6 41.6 L101.3 42.3 L101 43 L100.5 43.6 L100 44.1 L99.5 44.6 L98.9 45 L98.3 45.3 L97.6 45.5 L97 45.6 L96.3 45.6 L95.7 45.5 L95.1 45.4 L94.6 45.2 L94 44.9 L93.6 44.6 L93.2 44.2 L92.9 43.7 L92.6 43.3 L92.4 42.8 L92.3 42.3 L92.2 41.9 L92.2 41.4 L92.3 41 L92.4 40.5 L92.6 40.2 L92.8 39.8 L93.1 39.5 L93.3 39.3 L93.7 39.1 L94 38.9 L94.3 38.8 L94.6 38.8 L94.9 38.8 L95.2 38.8 L95.5 38.9 L95.7 39 L95.9 39.2 L96.1 39.3\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M111 46.4 L110.8 47 L110.6 47.6 L110.3 48.2 L110 48.7 L109.6 49.1 L109.1 49.5 L108.7 49.8 L108.2 50 L107.6 50.2 L107.1 50.2 L106.6 50.3 L106.1 50.2 L105.6 50.1 L105.2 49.9 L104.7 49.7 L104.4 49.4 L104.1 49.1 L103.8 48.8 L103.6 48.4 L103.4 48 L103.3 47.6 L103.3 47.3 L103.3 46.9 L103.3 46.5 L103.4 46.2 L103.6 45.9 L103.8 45.6 L104 45.4 L104.2 45.2 L104.4 45 L104.7 44.9 L104.9 44.8 L105.2 44.8 L105.4 44.8 L105.7 44.8 L105.9 44.9 L106.1 45 L106.2 45.1 L106.4 45.2\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M15 160 C49.2 94 87.2 46 110 40 C132.8 46 170.8 94 205 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M37.1 160 C63.3 109.3 92.5 72.5 110 67.9 C127.5 72.5 156.7 109.3 182.9 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M59.2 160 C77.5 124.7 97.8 99 110 95.8 C122.2 99 142.5 124.7 160.8 160 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M81.3 160 C91.6 140 103.1 125.5 110 123.7 C116.9 125.5 128.4 140 138.7 160 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M140 160 C179.6 83 223.6 27 250 20 C276.4 27 320.4 83 360 160 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M165.6 160 C196 100.9 229.7 57.9 250 52.6 C270.3 57.9 304 100.9 334.4 160 Z\" fill=\"#8cc3a4\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M191.2 160 C212.3 118.8 235.9 88.9 250 85.1 C264.1 88.9 287.7 118.8 308.8 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M216.7 160 C228.7 136.7 242 119.8 250 117.7 C258 119.8 271.3 136.7 283.3 160 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M285 160 C312 107.8 342 69.8 360 65 C378 69.8 408 107.8 435 160 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M307.7 160 C326.5 123.6 347.5 97.1 360 93.8 C372.5 97.1 393.5 123.6 412.3 160 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M330.5 160 C341.1 139.4 352.9 124.4 360 122.6 C367.1 124.4 378.9 139.4 389.5 160 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M0 158 Q100 140 200 158 T400 154 V240 H0Z\" fill=\"#8cc3a4\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M0 196 Q120 182 240 196 T400 192 V240 H0Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M138 185.7 H262 V208 Q200 213 138 208 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><clipPath id=\"gw-gerScene\"><path d=\"M138 185.7 H262 V208 Q200 213 138 208 Z\"/></clipPath><g clip-path=\"url(#gw-gerScene)\"><path d=\"M115.7 208 L138 185.7 M138 208 L115.7 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M125.6 208 L147.9 185.7 M147.9 208 L125.6 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M135.5 208 L157.8 185.7 M157.8 208 L135.5 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M145.4 208 L167.8 185.7 M167.8 208 L145.4 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M155.4 208 L177.7 185.7 M177.7 208 L155.4 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M165.3 208 L187.6 185.7 M187.6 208 L165.3 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M175.2 208 L197.5 185.7 M197.5 208 L175.2 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M185.1 208 L207.4 185.7 M207.4 208 L185.1 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M195 208 L217.4 185.7 M217.4 208 L195 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M205 208 L227.3 185.7 M227.3 208 L205 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M214.9 208 L237.2 185.7 M237.2 208 L214.9 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M224.8 208 L247.1 185.7 M247.1 208 L224.8 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M234.7 208 L257 185.7 M257 208 L234.7 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M244.6 208 L267 185.7 M267 208 L244.6 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/><path d=\"M254.6 208 L276.9 185.7 M276.9 208 L254.6 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.4\" opacity=\".55\"/></g><path d=\"M134.3 186.9 Q165.9 165.7 190.1 164.6 H209.9 Q234.1 165.7 265.7 186.9 Z\" fill=\"#f3e6c8\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><path d=\"M191.3 164.6 L138 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M193.5 164.6 L153.5 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M195.7 164.6 L169 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M197.8 164.6 L184.5 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M200 164.6 L200 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M202.2 164.6 L215.5 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M204.3 164.6 L231 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M206.5 164.6 L246.5 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M208.7 164.6 L262 185.7\" stroke=\"#7a4b2a\" stroke-width=\"1.3\" opacity=\".6\"/><path d=\"M138 187.8 H262\" stroke=\"#c0392b\" stroke-width=\"3.1\"/><path d=\"M138 190.3 H262\" stroke=\"#2f5d8a\" stroke-width=\"2\"/><ellipse cx=\"200\" cy=\"164.6\" rx=\"10.5\" ry=\"3.1\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><rect x=\"194.7\" y=\"191.3\" width=\"10.5\" height=\"16.7\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><rect x=\"196.3\" y=\"192.8\" width=\"7.4\" height=\"13.6\" fill=\"none\" stroke=\"#d9a441\" stroke-width=\"1.6\"/><path d=\"M200 192.8 V206.4\" stroke=\"#d9a441\" stroke-width=\"1.6\"/><path d=\"M51.9 214 L53.6 176.6 L58.4 176.6 L60.1 214 Z\" fill=\"#7a4b2a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><circle cx=\"56\" cy=\"154.5\" r=\"17\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M46.6 157.9 A9.4 9.4 0 0 1 65.3 157.9\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"41.7\" cy=\"164.7\" r=\"14.3\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M33.9 167.6 A7.9 7.9 0 0 1 49.6 167.6\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"70.3\" cy=\"164.7\" r=\"14.3\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M62.4 167.6 A7.9 7.9 0 0 1 78.1 167.6\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"47.5\" cy=\"174.9\" r=\"13.6\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M40 177.6 A7.5 7.5 0 0 1 55 177.6\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"64.5\" cy=\"174.9\" r=\"13.6\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M57 177.6 A7.5 7.5 0 0 1 72 177.6\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><path d=\"M346.4 214 L347.9 181 L352.1 181 L353.6 214 Z\" fill=\"#7a4b2a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><circle cx=\"350\" cy=\"161.5\" r=\"15\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M341.8 164.5 A8.2 8.2 0 0 1 358.2 164.5\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"337.4\" cy=\"170.5\" r=\"12.6\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M330.5 173 A6.9 6.9 0 0 1 344.3 173\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"362.6\" cy=\"170.5\" r=\"12.6\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M355.7 173 A6.9 6.9 0 0 1 369.5 173\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"342.5\" cy=\"179.5\" r=\"12\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M335.9 181.9 A6.6 6.6 0 0 1 349.1 181.9\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/><circle cx=\"357.5\" cy=\"179.5\" r=\"12\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\"/><path d=\"M350.9 181.9 A6.6 6.6 0 0 1 364.1 181.9\" fill=\"none\" stroke=\"#8cc3a4\" stroke-width=\"1.8\"/>"],"birch":["0 0 400 200","<rect width=\"400\" height=\"200\" fill=\"#f3e6c8\"/><path d=\"M70 150 C116.8 84 168.8 36 200 30 C231.2 36 283.2 84 330 150 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M94.5 150 C132.5 96.5 174.7 57.5 200 52.6 C225.3 57.5 267.5 96.5 305.5 150 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M119.1 150 C148.2 108.9 180.6 79 200 75.3 C219.4 79 251.8 108.9 280.9 150 Z\" fill=\"#3f8f7a\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M143.6 150 C163.9 121.4 186.5 100.5 200 97.9 C213.5 100.5 236.1 121.4 256.4 150 Z\" fill=\"#8cc3a4\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><path d=\"M168.1 150 C179.6 133.8 192.3 122 200 120.6 C207.7 122 220.4 133.8 231.9 150 Z\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><clipPath id=\"w2-birch\"><rect x=\"0\" y=\"150\" width=\"400\" height=\"50\"/></clipPath><g clip-path=\"url(#w2-birch)\"><path d=\"M-36 158 A18 18 0 0 1 0 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-29.9 158 A11.9 11.9 0 0 1 -6.1 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-23.9 158 A5.9 5.9 0 0 1 -12.1 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M0 158 A18 18 0 0 1 36 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M6.1 158 A11.9 11.9 0 0 1 29.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M12.1 158 A5.9 5.9 0 0 1 23.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M36 158 A18 18 0 0 1 72 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M42.1 158 A11.9 11.9 0 0 1 65.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M48.1 158 A5.9 5.9 0 0 1 59.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M72 158 A18 18 0 0 1 108 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M78.1 158 A11.9 11.9 0 0 1 101.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M84.1 158 A5.9 5.9 0 0 1 95.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M108 158 A18 18 0 0 1 144 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M114.1 158 A11.9 11.9 0 0 1 137.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M120.1 158 A5.9 5.9 0 0 1 131.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M144 158 A18 18 0 0 1 180 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M150.1 158 A11.9 11.9 0 0 1 173.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M156.1 158 A5.9 5.9 0 0 1 167.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M180 158 A18 18 0 0 1 216 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M186.1 158 A11.9 11.9 0 0 1 209.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M192.1 158 A5.9 5.9 0 0 1 203.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M216 158 A18 18 0 0 1 252 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M222.1 158 A11.9 11.9 0 0 1 245.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M228.1 158 A5.9 5.9 0 0 1 239.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M252 158 A18 18 0 0 1 288 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M258.1 158 A11.9 11.9 0 0 1 281.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M264.1 158 A5.9 5.9 0 0 1 275.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M288 158 A18 18 0 0 1 324 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M294.1 158 A11.9 11.9 0 0 1 317.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M300.1 158 A5.9 5.9 0 0 1 311.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M324 158 A18 18 0 0 1 360 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M330.1 158 A11.9 11.9 0 0 1 353.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M336.1 158 A5.9 5.9 0 0 1 347.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M360 158 A18 18 0 0 1 396 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M366.1 158 A11.9 11.9 0 0 1 389.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M372.1 158 A5.9 5.9 0 0 1 383.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M396 158 A18 18 0 0 1 432 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M402.1 158 A11.9 11.9 0 0 1 425.9 158 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M408.1 158 A5.9 5.9 0 0 1 419.9 158 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-18 174.2 A18 18 0 0 1 18 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-11.9 174.2 A11.9 11.9 0 0 1 11.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-5.9 174.2 A5.9 5.9 0 0 1 5.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M18 174.2 A18 18 0 0 1 54 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M24.1 174.2 A11.9 11.9 0 0 1 47.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M30.1 174.2 A5.9 5.9 0 0 1 41.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M54 174.2 A18 18 0 0 1 90 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M60.1 174.2 A11.9 11.9 0 0 1 83.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M66.1 174.2 A5.9 5.9 0 0 1 77.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M90 174.2 A18 18 0 0 1 126 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M96.1 174.2 A11.9 11.9 0 0 1 119.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M102.1 174.2 A5.9 5.9 0 0 1 113.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M126 174.2 A18 18 0 0 1 162 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M132.1 174.2 A11.9 11.9 0 0 1 155.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M138.1 174.2 A5.9 5.9 0 0 1 149.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M162 174.2 A18 18 0 0 1 198 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M168.1 174.2 A11.9 11.9 0 0 1 191.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M174.1 174.2 A5.9 5.9 0 0 1 185.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M198 174.2 A18 18 0 0 1 234 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M204.1 174.2 A11.9 11.9 0 0 1 227.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M210.1 174.2 A5.9 5.9 0 0 1 221.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M234 174.2 A18 18 0 0 1 270 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M240.1 174.2 A11.9 11.9 0 0 1 263.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M246.1 174.2 A5.9 5.9 0 0 1 257.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M270 174.2 A18 18 0 0 1 306 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M276.1 174.2 A11.9 11.9 0 0 1 299.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M282.1 174.2 A5.9 5.9 0 0 1 293.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M306 174.2 A18 18 0 0 1 342 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M312.1 174.2 A11.9 11.9 0 0 1 335.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M318.1 174.2 A5.9 5.9 0 0 1 329.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M342 174.2 A18 18 0 0 1 378 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M348.1 174.2 A11.9 11.9 0 0 1 371.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M354.1 174.2 A5.9 5.9 0 0 1 365.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M378 174.2 A18 18 0 0 1 414 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M384.1 174.2 A11.9 11.9 0 0 1 407.9 174.2 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M390.1 174.2 A5.9 5.9 0 0 1 401.9 174.2 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-36 190.4 A18 18 0 0 1 0 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-29.9 190.4 A11.9 11.9 0 0 1 -6.1 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M-23.9 190.4 A5.9 5.9 0 0 1 -12.1 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M0 190.4 A18 18 0 0 1 36 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M6.1 190.4 A11.9 11.9 0 0 1 29.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M12.1 190.4 A5.9 5.9 0 0 1 23.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M36 190.4 A18 18 0 0 1 72 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M42.1 190.4 A11.9 11.9 0 0 1 65.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M48.1 190.4 A5.9 5.9 0 0 1 59.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M72 190.4 A18 18 0 0 1 108 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M78.1 190.4 A11.9 11.9 0 0 1 101.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M84.1 190.4 A5.9 5.9 0 0 1 95.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M108 190.4 A18 18 0 0 1 144 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M114.1 190.4 A11.9 11.9 0 0 1 137.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M120.1 190.4 A5.9 5.9 0 0 1 131.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M144 190.4 A18 18 0 0 1 180 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M150.1 190.4 A11.9 11.9 0 0 1 173.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M156.1 190.4 A5.9 5.9 0 0 1 167.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M180 190.4 A18 18 0 0 1 216 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M186.1 190.4 A11.9 11.9 0 0 1 209.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M192.1 190.4 A5.9 5.9 0 0 1 203.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M216 190.4 A18 18 0 0 1 252 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M222.1 190.4 A11.9 11.9 0 0 1 245.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M228.1 190.4 A5.9 5.9 0 0 1 239.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M252 190.4 A18 18 0 0 1 288 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M258.1 190.4 A11.9 11.9 0 0 1 281.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M264.1 190.4 A5.9 5.9 0 0 1 275.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M288 190.4 A18 18 0 0 1 324 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M294.1 190.4 A11.9 11.9 0 0 1 317.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M300.1 190.4 A5.9 5.9 0 0 1 311.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M324 190.4 A18 18 0 0 1 360 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M330.1 190.4 A11.9 11.9 0 0 1 353.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M336.1 190.4 A5.9 5.9 0 0 1 347.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M360 190.4 A18 18 0 0 1 396 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M366.1 190.4 A11.9 11.9 0 0 1 389.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M372.1 190.4 A5.9 5.9 0 0 1 383.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M396 190.4 A18 18 0 0 1 432 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M402.1 190.4 A11.9 11.9 0 0 1 425.9 190.4 Z\" fill=\"#9fc3d6\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M408.1 190.4 A5.9 5.9 0 0 1 419.9 190.4 Z\" fill=\"#2f5d8a\" stroke=\"#2b2118\" stroke-width=\"2\"/></g><path d=\"M0 150H400\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><path d=\"M348.2 43.6 L357.9 46 L348.2 48.4 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M347.7 50.8 L352.5 55.3 L345.9 55.2 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M344.6 57.2 L349.7 65.7 L341.2 60.6 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M339.2 61.9 L339.3 68.5 L334.8 63.7 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M332.4 64.2 L330 73.9 L327.6 64.2 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M325.2 63.7 L320.7 68.5 L320.8 61.9 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M318.8 60.6 L310.3 65.7 L315.4 57.2 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M314.1 55.2 L307.5 55.3 L312.3 50.8 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M311.8 48.4 L302.1 46 L311.8 43.6 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M312.3 41.2 L307.5 36.7 L314.1 36.8 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M315.4 34.8 L310.3 26.3 L318.8 31.4 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M320.8 30.1 L320.7 23.5 L325.2 28.3 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M327.6 27.8 L330 18.1 L332.4 27.8 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M334.8 28.3 L339.3 23.5 L339.2 30.1 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M341.2 31.4 L349.7 26.3 L344.6 34.8 Z\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2\"/><path d=\"M345.9 36.8 L352.5 36.7 L347.7 41.2 Z\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><circle cx=\"330\" cy=\"46\" r=\"18\" fill=\"#c0392b\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"330\" cy=\"46\" r=\"13\" fill=\"#d9a441\" stroke=\"#2b2118\" stroke-width=\"2\"/><circle cx=\"330\" cy=\"46\" r=\"8.1\" fill=\"none\" stroke=\"#2b2118\" stroke-width=\"1.6\"/><circle cx=\"62.4\" cy=\"42.4\" r=\"8.8\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"72.8\" cy=\"36\" r=\"11.2\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"85.6\" cy=\"36.8\" r=\"9.9\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><circle cx=\"96\" cy=\"42.4\" r=\"8\" fill=\"#fbf6ea\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><path d=\"M56 48.8 H102.4\" stroke=\"#2b2118\" stroke-width=\"2.4\"/><rect x=\"55.2\" y=\"43.2\" width=\"47.2\" height=\"5.3\" fill=\"#fbf6ea\"/><path d=\"M56.9 42.4 L57.1 43.1 L57.3 43.7 L57.6 44.3 L58 44.9 L58.5 45.4 L58.9 45.8 L59.5 46.1 L60 46.4 L60.6 46.5 L61.2 46.6 L61.7 46.7 L62.3 46.6 L62.8 46.5 L63.3 46.3 L63.8 46 L64.2 45.7 L64.5 45.4 L64.8 45 L65.1 44.6 L65.2 44.2 L65.3 43.8 L65.4 43.3 L65.4 42.9 L65.3 42.5 L65.2 42.2 L65.1 41.8 L64.9 41.5 L64.6 41.3 L64.4 41 L64.1 40.9 L63.8 40.7 L63.6 40.7 L63.3 40.6 L63 40.6 L62.8 40.7 L62.5 40.7 L62.3 40.8 L62.1 41 L62 41.1\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M65.9 36 L66 36.9 L66.3 37.7 L66.7 38.5 L67.2 39.2 L67.8 39.8 L68.4 40.3 L69.1 40.7 L69.8 41 L70.5 41.3 L71.2 41.4 L72 41.4 L72.7 41.3 L73.3 41.2 L74 40.9 L74.6 40.6 L75.1 40.2 L75.5 39.8 L75.9 39.3 L76.2 38.8 L76.4 38.3 L76.6 37.7 L76.6 37.2 L76.6 36.7 L76.5 36.2 L76.4 35.7 L76.2 35.3 L75.9 34.9 L75.7 34.6 L75.3 34.3 L75 34.1 L74.6 33.9 L74.3 33.8 L73.9 33.7 L73.6 33.7 L73.3 33.8 L73 33.9 L72.7 34 L72.5 34.2 L72.3 34.3\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M91.8 36.8 L91.6 37.6 L91.3 38.3 L91 39 L90.5 39.6 L90 40.1 L89.5 40.6 L88.9 41 L88.3 41.3 L87.6 41.5 L87 41.6 L86.3 41.6 L85.7 41.5 L85.1 41.4 L84.6 41.2 L84 40.9 L83.6 40.6 L83.2 40.2 L82.9 39.7 L82.6 39.3 L82.4 38.8 L82.3 38.3 L82.2 37.9 L82.2 37.4 L82.3 37 L82.4 36.5 L82.6 36.2 L82.8 35.8 L83.1 35.5 L83.3 35.3 L83.7 35.1 L84 34.9 L84.3 34.8 L84.6 34.8 L84.9 34.8 L85.2 34.8 L85.5 34.9 L85.7 35 L85.9 35.2 L86.1 35.3\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/><path d=\"M101 42.4 L100.8 43 L100.6 43.6 L100.3 44.2 L100 44.7 L99.6 45.1 L99.1 45.5 L98.7 45.8 L98.2 46 L97.6 46.2 L97.1 46.2 L96.6 46.3 L96.1 46.2 L95.6 46.1 L95.2 45.9 L94.7 45.7 L94.4 45.4 L94.1 45.1 L93.8 44.8 L93.6 44.4 L93.4 44 L93.3 43.6 L93.3 43.3 L93.3 42.9 L93.3 42.5 L93.4 42.2 L93.6 41.9 L93.8 41.6 L94 41.4 L94.2 41.2 L94.4 41 L94.7 40.9 L94.9 40.8 L95.2 40.8 L95.4 40.8 L95.7 40.8 L95.9 40.9 L96.1 41 L96.2 41.1 L96.4 41.2\" fill=\"none\" stroke=\"#2f5d8a\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>"]};
  var MN_PAT = [['ulzii', 'Өлзий хээ'], ['ulziiRibbon', 'Өлзий — туузан'], ['ulziiSq', 'Өлзий — дөрвөлжин'], ['ulziiNet', 'Өлзий — тор'], ['ulziiRing', 'Дугуй өлзий'], ['ulziiRow', 'Өлзий — зурвас'],
    ['hammer', 'Алхан хээ — зурвас'], ['hammerFrame', 'Алхан хээ — хүрээ'], ['key', 'Ороолт хээ — зурвас'], ['keyFrame', 'Ороолт хээ — хүрээ']];
  var MN_NAT = [['ger', 'Гэр'], ['gerScene', 'Гэр, уул, тал'], ['mountains', 'Уулс'], ['birch', 'Уул ус'], ['lake', 'Нуур, уул'], ['steppe', 'Тал нутаг'], ['river', 'Ус — долгион'], ['pine', 'Мод'], ['larch', 'Нарс'], ['sun', 'Нар'], ['cloud', 'Үүл']];
  // painted gers, mountains and clouds (assets/mn-paint/<id>.json, vectorised from the owner's pictures): one flat colour per layer,
  // so every colour can be changed in the «Өнгө» section. Each item loads only when it is added; tiles use small .webp previews.
  var MN_PAINT = [["ger1", "Гэр — хийморьтой"], ["ger2", "Гэр — үүлтэй"], ["ger3", "Гэр — утаатай"], ["ger4", "Гэр — туг, хадаг"], ["ger5", "Гэр — тугтай"], ["mtn1", "Уул — үүлтэй"], ["mtn2", "Уул — оргил"], ["mtn3", "Уулс — нуруу"], ["mtn4", "Уулс — үүлэн"], ["mtn5", "Уул — улаан үүлтэй"], ["cl1", "Үүл — нартай"], ["cl2", "Үүл — нар жаргах"], ["sw1", "Хээт үүл — улаан"], ["sw2", "Хээт үүл — хөх"], ["sw3", "Хээт үүл — долгио"], ["sw4", "Хээт үүл — цайвар"], ["sw5", "Хээт үүл — зурвас"], ["bc1", "Үүл — сар"], ["bc2", "Үүл — их"], ["bc3", "Үүл — жижиг"], ["bc4", "Үүл — хэвтээ"], ["bc5", "Үүл — сартай"], ["bc6", "Үүл — урт"], ["bc7", "Үүл — хуйлраа"], ["bc8", "Үүл — бөөгнөрөл"], ["bc9", "Үүл — дов"], ["bc10", "Үүл — хуйлраа урт"], ["bc11", "Үүл — бяцхан"]];
  var paintCache = {};
  function addMnPaint(k) {
    var go = function (j) {
      var g = new fabric.Group(j.layers.map(function (l) { return new fabric.Path(l.d, { fill: l.c, fillRule: 'evenodd', strokeWidth: 0, objectCaching: false }); }), { name: j.name });
      var pg = E().page(), wide = j.w / j.h > 1.6, s = (wide ? pg.w * 0.7 : pg.h * 0.5) / (wide ? g.width : g.height);
      g.set({ scaleX: s, scaleY: s }); E().place(g);
    };
    if (paintCache[k]) return go(paintCache[k]);
    fetch('/assets/mn-paint/' + k + '.json?v=1').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { paintCache[k] = j; go(j); }).catch(function () { E().toast('Зургийг ачаалж чадсангүй — дахин оролдоно уу'); });
  }
  function mnInk() { return inkFor(null).dark ? '#f2c94c' : '#c11720'; }
  function addMnPattern(k) {
    var ed = E(), pg = ed.page(), W0 = pg.w, H0 = pg.h, col = mnInk(), o;
    var line = function (d, sw) { return new fabric.Path(d, { fill: '', stroke: col, strokeWidth: sw, strokeLineCap: 'butt', strokeLineJoin: 'miter', objectCaching: false }); };
    var solid = function (d) { return new fabric.Path(d, { fill: col, strokeWidth: 0, objectCaching: false }); };
    // ribbon = a wide line with a thin line cut out of it (double-line drawing); the group cache makes the cut transparent
    var ribbon = function (d) { return new fabric.Group([line(d, 10), new fabric.Path(d, { fill: '', stroke: '#000', strokeWidth: 3.2, globalCompositeOperation: 'destination-out', objectCaching: false })]); };
    var fit = function (x, frac) { var s = Math.min(W0, H0) * frac / Math.max(x.width, x.height); x.set({ scaleX: s, scaleY: s }); return x; };
    // a band repeated along the four sides of the slide
    var frame = function (make, unit, band, name) {
      var m = Math.round(Math.min(W0, H0) * 0.035), sc = m / band, nh = Math.floor((W0 - 2 * m) / (unit * sc)), nv = Math.floor((H0 - 2 * m) / (unit * sc));
      var top = make(nh), bot = make(nh), lef = make(nv), rig = make(nv);
      [top, bot, lef, rig].forEach(function (x) { x.set({ scaleX: sc, scaleY: sc }); });
      top.set({ left: (W0 - nh * unit * sc) / 2, top: m * 0.4 }); bot.set({ left: (W0 - nh * unit * sc) / 2, top: H0 - m * 1.4, flipY: true });
      lef.set({ angle: 90, left: m * 1.4, top: (H0 - nv * unit * sc) / 2 }); rig.set({ angle: -90, left: W0 - m * 1.4, top: (H0 + nv * unit * sc) / 2 });
      var g = new fabric.Group([top, bot, lef, rig], { name: name });
      ed.place(g, { x: pg.f.left + W0 / 2, y: pg.f.top + H0 / 2 });
    };
    if (k === 'ulzii') o = fit(line(ulziiD(0, 0, 1, 5, true), 6), 0.28);
    if (k === 'ulziiRibbon') o = fit(ribbon(ulziiD(0, 0, 1, 10, true)), 0.3);
    if (k === 'ulziiSq') o = fit(ribbon(ulziiSqD(10)), 0.3);
    if (k === 'ulziiNet') o = fit(line(ulziiNetD(), 5), 0.26);
    if (k === 'ulziiRing') {
      var u = line(ulziiD(0, 0, 1, 5, true), 6);
      var c1 = new fabric.Circle({ radius: 104, left: 60, top: 60, originX: 'center', originY: 'center', fill: '', stroke: col, strokeWidth: 8 });
      var c2 = new fabric.Circle({ radius: 90, left: 60, top: 60, originX: 'center', originY: 'center', fill: '', stroke: col, strokeWidth: 2.5 });
      u.set({ originX: 'center', originY: 'center', left: 60, top: 60, scaleX: 1.22, scaleY: 1.22 });
      o = fit(new fabric.Group([c1, c2, u]), 0.32);
    }
    if (k === 'ulziiRow') { var n = 9, d = ''; for (var i = 0; i < n; i++) d += ulziiD(i * 160, 0, 1, 5, true); o = line(d, 6); var s2 = W0 * 0.8 / o.width; o.set({ scaleX: s2, scaleY: s2 }); }
    if (k === 'hammer') { var n3 = Math.round(W0 * 0.9 / 60); o = solid(hammerD(n3)); var s3 = W0 * 0.9 / (n3 * 60); o.set({ scaleX: s3, scaleY: s3 }); }
    if (k === 'key') { var n2 = Math.round(W0 * 0.9 / 40); o = line(alkhanD(n2), 4); o.set({ scaleX: W0 * 0.9 / (n2 * 40 + 4), scaleY: W0 * 0.9 / (n2 * 40 + 4) }); }
    if (k === 'hammerFrame') return frame(function (n) { return solid(hammerD(n)); }, 60, 58, 'Алхан хээ — хүрээ');
    if (k === 'keyFrame') return frame(function (n) { return line(alkhanD(n), 4); }, 40, 48, 'Ороолт хээ — хүрээ');
    o.set({ name: (MN_PAT.filter(function (x) { return x[0] === k; })[0] || [0, 'Хээ'])[1] });
    ed.place(o);
  }
  function addMnArt(k) {
    var a = MN_ART[k], svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + a[0] + '">' + a[1] + '</svg>', name = (MN_NAT.filter(function (x) { return x[0] === k; })[0] || [0, k])[1];
    fabric.loadSVGFromString(svg, function (objs, opts) {
      var g = fabric.util.groupSVGElements(objs, opts), pg = E().page(), vb = a[0].split(' ').map(Number);
      var wide = vb[2] / vb[3] > 1.6, s = (wide ? pg.w * 0.6 : pg.h * 0.45) / (wide ? g.width : g.height);
      g.set({ name: name, scaleX: s, scaleY: s }); E().place(g);
    });
  }
  // traced ornaments (assets/mn-traced.json, vectorised from the owner's reference pictures).
  // The row preview needs only the first few (assets/mn-traced-lite.json, ~4 KB); the full file (~320 KB) loads on «Бүгдийг харах».
  var MN_TR = null, mnTrP = null, MN_TRL = null, mnTrLP = null, MN_TR_N = 22;
  function mnTraced() {
    if (!mnTrP) mnTrP = fetch('/assets/mn-traced.json?v=2').then(function (r) { return r.json(); }).then(function (j) { MN_TR = j.items || []; MN_TR_N = MN_TR.length; if (document.querySelector('#kit-mntr')) E().refreshUI(); }).catch(function () { mnTrP = null; });
    return mnTrP;
  }
  function mnTracedLite() {
    if (!mnTrLP) mnTrLP = fetch('/assets/mn-traced-lite.json?v=1').then(function (r) { return r.json(); }).then(function (j) { MN_TRL = j.items || []; MN_TR_N = j.total || MN_TR_N; if (document.querySelector('#kit-mntr')) E().refreshUI(); }).catch(function () { mnTrLP = null; });
    return mnTrLP;
  }
  function mnTrTiles(lim) {
    var list = MN_TR || (lim ? MN_TRL : null);
    if (!list) { if (lim) mnTracedLite(); else mnTraced(); return null; }
    return list.slice(0, lim || list.length).map(function (t, i) {
      return '<button type="button" class="tile kt" data-kit-mnt="' + i + '" title="' + esc(t.name) + '"><svg viewBox="0 0 ' + t.w + ' ' + t.h + '" preserveAspectRatio="xMidYMid meet"><path d="' + t.d + '" fill="#b3202a" fill-rule="evenodd"/></svg><span>' + esc(t.name) + '</span></button>'; }).join('');
  }
  function addMnTraced(i) {
    var t = (MN_TR || MN_TRL || [])[i]; if (!t) return;
    var pg = E().page(), o = new fabric.Path(t.d, { fill: mnInk(), fillRule: 'evenodd', strokeWidth: 0, objectCaching: true, name: t.name });
    var wide = t.w / t.h > 1.8, s = (wide ? pg.w * 0.7 : pg.h * 0.4) / (wide ? o.width : o.height);
    o.set({ scaleX: s, scaleY: s }); E().place(o);
  }
  function svgThumb(k) { var a = MN_ART[k]; return '<svg viewBox="' + a[0] + '" preserveAspectRatio="xMidYMid meet">' + a[1] + '</svg>'; }
  function patThumb(k) {
    var R = '#c11720', sv = function (vb, body) { return '<svg viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet">' + body + '</svg>'; };
    var rib = function (d) { return '<path d="' + d + '" fill="none" stroke="' + R + '" stroke-width="10"/><path d="' + d + '" fill="none" stroke="#f5f5f5" stroke-width="3.2"/>'; };
    if (k === 'ulzii') return sv('-30 -30 180 180', '<path d="' + ulziiD(0, 0, 1, 5, true) + '" fill="none" stroke="' + R + '" stroke-width="7"/>');
    if (k === 'ulziiRibbon') return sv('-32 -32 184 184', rib(ulziiD(0, 0, 1, 10, true)));
    if (k === 'ulziiSq') return sv('-4 -4 128 128', rib(ulziiSqD(10)));
    if (k === 'ulziiNet') return sv('-6 -6 132 132', '<path d="' + ulziiNetD() + '" fill="none" stroke="' + R + '" stroke-width="6"/>');
    if (k === 'ulziiRing') return sv('-54 -54 228 228', '<circle cx="60" cy="60" r="104" fill="none" stroke="' + R + '" stroke-width="8"/><circle cx="60" cy="60" r="90" fill="none" stroke="' + R + '" stroke-width="2.5"/><path d="' + ulziiD(0, 0, 1, 5, true) + '" fill="none" stroke="' + R + '" stroke-width="7" transform="translate(60 60) scale(1.22) translate(-60 -60)"/>');
    if (k === 'ulziiRow') return sv('-30 -30 500 180', '<path d="' + ulziiD(0, 0, 1, 5, true) + ulziiD(160, 0, 1, 5, true) + ulziiD(320, 0, 1, 5, true) + '" fill="none" stroke="' + R + '" stroke-width="7"/>');
    if (k === 'hammer') return sv('0 -30 240 118', '<path d="' + hammerD(4) + '" fill="' + R + '"/>');
    if (k === 'key') return sv('-4 -12 248 72', '<path d="' + alkhanD(6) + '" fill="none" stroke="' + R + '" stroke-width="4"/>');
    var band = k === 'hammerFrame' ? '<path d="' + hammerD(4) + '" fill="' + R + '" transform="translate(12 10) scale(.4)"/>' : '<path d="' + alkhanD(6) + '" fill="none" stroke="' + R + '" stroke-width="4" transform="translate(12 10) scale(.4)"/>';
    return sv('0 0 120 120', '<rect x="6" y="6" width="108" height="108" fill="none" stroke="' + R + '" stroke-width="2"/>' + band + '<rect x="12" y="36" width="96" height="72" fill="none" stroke="' + R + '" stroke-width="1" opacity=".5"/>');
  }


  // The «Элемент» tab shows each section as one horizontal row of a few tiles; «Бүгдийг харах» opens the whole section.
  // Keeps the panel light: it is rebuilt on every selection change, and the full lists hold ~1000 icons and big SVGs.
  var kitOpen = null, kitQ = '', ROW = 6, ROW_IC = 14;
  function mkKeys(cat) { return Object.keys(MOCKS).filter(function (k) { return MOCKS[k].cat === cat; }); }
  function iconTiles(lim) {
    var q = kitQ.trim().toLowerCase();
    return ICONS.slice(0, lim || ICONS.length).map(function (ic, i) { var n = ic[1].toLowerCase() + ' ' + ic[0]; return '<button type="button" data-kit-icon="' + i + '" data-n="' + esc(n) + '" title="' + ic[1] + '"' + (!lim && q && n.indexOf(q) < 0 ? ' hidden' : '') + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + ic[2] + '"/></svg></button>'; }).join('');
  }
  var SECS = [
    { id: 'chart', t: 'Chart', sub: 'PowerPoint-д засагдана', n: function () { return CHARTS.length; }, tiles: function (l) { return CHARTS.slice(0, l || CHARTS.length).map(function (c) { return '<button type="button" class="tile kt" data-kit-chart="' + c[0] + '" title="' + c[1] + ' chart">' + tileSvg(c[2]) + '<span>' + c[1] + '</span></button>'; }).join(''); } },
    { id: 'table', t: 'Хүснэгт', sub: 'Excel-ээс буулгаж болно', only: '<button type="button" class="btn acc full" data-kit-table="1">' + '%TBL%' + 'Хүснэгт нэмэх</button>' },
    { id: 'device', t: 'Mockup — төхөөрөмж', n: function () { return mkKeys('device').length; }, tiles: function (l) { return mkTiles('device', l); } },
    { id: 'print', t: 'Mockup — хэвлэмэл', n: function () { return mkKeys('print').length; }, tiles: function (l) { return mkTiles('print', l); } },
    { id: 'web', t: 'Mockup — вэб', n: function () { return mkKeys('web').length; }, tiles: function (l) { return mkTiles('web', l); } },
    { id: 'mnp', t: 'Монгол хээ', sub: 'уламжлалт', mn: 1, n: function () { return MN_PAT.length; }, tiles: function (l) { return MN_PAT.slice(0, l || MN_PAT.length).map(function (x) { return '<button type="button" class="tile kt" data-kit-mnp="' + x[0] + '" title="' + x[1] + '">' + patThumb(x[0]) + '<span>' + x[1] + '</span></button>'; }).join(''); } },
    { id: 'mnt', t: 'Хээ угалз, уулан хээ', sub: 'эх зургаас', mn: 1, n: function () { return MN_TR_N; }, tiles: mnTrTiles },
    { id: 'mna', t: 'Байгаль, гэр', mn: 1, n: function () { return MN_NAT.length; }, tiles: function (l) { return MN_NAT.slice(0, l || MN_NAT.length).map(function (x) { return '<button type="button" class="tile kt" data-kit-mna="' + x[0] + '" title="' + x[1] + '">' + svgThumb(x[0]) + '<span>' + x[1] + '</span></button>'; }).join(''); } },
    { id: 'paint', t: 'Уран зураг', sub: 'өнгө нь солигдоно', paint: 1, n: function () { return MN_PAINT.length; }, tiles: function (l) { return MN_PAINT.slice(0, l || MN_PAINT.length).map(function (x) { return '<button type="button" class="tile kt" data-kit-paint="' + x[0] + '" title="' + x[1] + '"><img src="/assets/mn-paint/' + x[0] + '.webp?v=1" alt="" loading="lazy" decoding="async"><span>' + x[1] + '</span></button>'; }).join(''); } },
    { id: 'dg', t: 'Диаграм', sub: 'текст нь засагдана', n: function () { return DIAGRAMS.length; }, tiles: function (l) { return DIAGRAMS.slice(0, l || DIAGRAMS.length).map(function (d) { return '<button type="button" class="tile kt" data-kit-dg="' + d[0] + '" title="' + d[1] + ' — ' + d[2] + '">' + tileSvg(DG_ICON[d[0]]) + '<span>' + d[1] + '</span></button>'; }).join(''); } },
    { id: 'icons', t: 'Икон', icons: 1, n: function () { return ICONS.length; }, tiles: iconTiles }
  ];
  function secBody(s, lim) {
    var t = s.tiles(lim);
    if (t === null) return '<p class="note" id="kit-mntr">Ачаалж байна…</p>';
    var cls = s.icons ? 'kit-icons' : 'kit-tiles' + (s.mn ? ' mn-tiles' : '') + (s.paint ? ' paint-tiles' : '');
    return '<div class="' + cls + (lim ? ' kit-strip' : ' grid3') + '"' + (s.id === 'mnt' ? ' id="kit-mntr"' : '') + '>' + t + '</div>';
  }
  function qInput() { return '<input class="kit-q" type="search" placeholder="Икон хайх…" data-kit-q aria-label="Икон хайх" value="' + esc(kitQ) + '">'; }
  function panel() {
    var s = kitOpen && SECS.filter(function (x) { return x.id === kitOpen; })[0];
    if (s) {
      return '<div class="kit-back"><button type="button" class="ib" data-kit-back="1" title="Буцах" aria-label="Буцах"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button><b>' + s.t + '</b><span>' + s.n() + '</span></div>' +
        (s.icons ? qInput() : '') + secBody(s, 0);
    }
    var ppt = document.body.getAttribute('data-mode') === 'ppt';   // /editor/ gets everything except charts
    var h = SECS.filter(function (x) { return ppt || x.id !== 'chart'; }).map(function (x) {
      if (x.only) return '<div class="sec-t"><em class="kit-h">' + x.t + (x.sub ? ' <span>' + x.sub + '</span>' : '') + '</em></div>' + x.only.replace('%TBL%', tileSvg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14.5h18M9 4v16M15 4v16"/>'));
      var lim = x.icons ? ROW_IC : ROW, n = x.n();
      return '<div class="sec-t"><em class="kit-h">' + x.t + (x.sub ? ' <span>' + x.sub + '</span>' : '') + '</em>' + (n > lim ? '<button type="button" class="kit-all" data-kit-all="' + x.id + '">Бүгдийг харах <span>' + n + '</span></button>' : '') + '</div>' +
        (x.icons ? qInput() : '') + secBody(x, lim);
    }).join('');
    return h + (ppt ? '<p class="note">Chart, хүснэгт дээр давхар дарж өгөгдлийг засна. «PowerPoint (.pptx)» татахад жинхэнэ PowerPoint chart, хүснэгт болж орно.</p>' : '<p class="note">Хүснэгт дээр давхар дарж өгөгдлийг засна.</p>');
  }
  function openSec(id) {
    kitOpen = id; E().refreshUI();
    var lp = document.getElementById('lp-body'); if (lp) lp.scrollTop = 0;
  }
  function mkTiles(cat, lim) {
    return mkKeys(cat).slice(0, lim || 99).map(function (k) {
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
      if (d.kitAll) openSec(d.kitAll);
      else if (d.kitBack) openSec(null);
      else if (d.kitChart) addChart(d.kitChart);
      else if (d.kitTable) addTable();
      else if (d.kitMock) addMockup(d.kitMock);
      else if (d.kitIcon) addIcon(+d.kitIcon);
      else if (d.kitDg) addDiagram(d.kitDg);
      else if (d.kitMnp) addMnPattern(d.kitMnp);
      else if (d.kitMna) addMnArt(d.kitMna);
      else if (d.kitMnt) addMnTraced(+d.kitMnt);
      else if (d.kitPaint) addMnPaint(d.kitPaint);
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
    kitQ = t.value;
    if (kitOpen !== 'icons') {   // typing in the row's search box opens the full icon list
      openSec('icons'); var n = document.querySelector('#lp-body [data-kit-q]');
      if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
      return;
    }
    var q = kitQ.trim().toLowerCase();
    document.querySelectorAll('.kit-icons [data-kit-icon]').forEach(function (b) { b.hidden = q && b.dataset.n.indexOf(q) < 0; });
  });

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
    var series = (pie ? mc.series.slice(0, 1) : mc.series).map(function (se) { return { name: se.name, labels: mc.labels.slice(), values: mc.labels.map(function (_, i) { var v = toNum(se.values[i]); return pie ? Math.max(0, v) : v; }) }; });
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
    // chart / table from a data model (PowerPoint import): Promise<group> at the kit's own size, ready to scale
    fromModel: function (kind, m) { m = clone(m); if (kind === 'table') m.fs = m.fs || 26; m.font = m.font || fontOf(m); return afterFont(m).then(function () { return kind === 'chart' ? makeChart(m, null) : makeTable(m); }); },
    // for tests
    _: { addMnPattern: function (k) { return addMnPattern(k); }, addMnArt: function (k) { return addMnArt(k); }, MN_NAT: MN_NAT, MN_PAT: MN_PAT, buildChart: buildChart, buildTable: buildTable, buildMockup: buildMockup, sampleChart: sampleChart, sampleTable: sampleTable, modelFromGrid: modelFromGrid, MOCKS: MOCKS, ICONS: ICONS, addChart: addChart, addTable: addTable, addMockup: addMockup, addIcon: addIcon, addDiagram: addDiagram, rebuild: rebuild } };
})();
