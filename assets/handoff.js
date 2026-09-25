/*
  Graphican hand-off: passes one image between pages (Design tools ⇄ Editor).
  Stored in IndexedDB (images are too big for sessionStorage) and removed once read.
    GHandoff.put(blob, { name, target })  → Promise
    GHandoff.take()                      → Promise<{ blob, name, target } | null>
*/
(function () {
  'use strict';
  var DB = 'graphican', STORE = 'handoff', KEY = 'image', MAX_AGE = 10 * 60 * 1000;

  function open() {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error('no indexedDB'));
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }

  function tx(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(STORE, mode), s = t.objectStore(STORE), out;
        var req = fn(s);
        if (req) req.onsuccess = function () { out = req.result; };
        t.oncomplete = function () { db.close(); res(out); };
        t.onerror = function () { db.close(); rej(t.error); };
      });
    });
  }

  window.GHandoff = {
    put: function (blob, meta) {
      meta = meta || {};
      return tx('readwrite', function (s) {
        return s.put({ blob: blob, name: meta.name || 'image.png', target: meta.target || '', at: Date.now() }, KEY);
      });
    },
    take: function () {
      return tx('readonly', function (s) { return s.get(KEY); }).then(function (v) {
        if (!v) return null;
        return tx('readwrite', function (s) { return s.delete(KEY); }).then(function () {
          return Date.now() - v.at > MAX_AGE ? null : v;
        });
      }).catch(function () { return null; });
    }
  };
})();
