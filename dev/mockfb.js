// Minimal in-memory stand-in for the Firebase compat SDK, shared between tabs via BroadcastChannel.
(function () {
  const ch = new BroadcastChannel("mockfb");
  let tree = {};
  let synced = false;
  const listeners = [];
  const pendingDisc = new Map();
  window.__mockDisconnect = () => { const pairs = [...pendingDisc.entries()]; pendingDisc.clear(); apply(pairs); };
  const uid = "u" + Math.random().toString(36).slice(2, 9);
  const split = p => String(p || "").split("/").filter(Boolean);
  function getAt(path) {
    if (path === ".info/connected") return true;
    let n = tree;
    for (const s of split(path)) { if (n == null || typeof n !== "object") return null; n = n[s]; }
    return n === undefined ? null : n;
  }
  function clean(v) {
    if (v === null || v === undefined) return null;
    if (Array.isArray(v)) { const o = {}; v.forEach((x, i) => { const c = clean(x); if (c !== null) o[i] = c; }); return Object.keys(o).length ? o : null; }
    if (typeof v === "object") { const o = {}; for (const k in v) { const c = clean(v[k]); if (c !== null) o[k] = c; } return Object.keys(o).length ? o : null; }
    return v;
  }
  function setAt(path, val) {
    const segs = split(path); val = clean(val);
    if (!segs.length) { tree = val || {}; return; }
    let n = tree;
    for (let i = 0; i < segs.length - 1; i++) { if (n[segs[i]] == null || typeof n[segs[i]] !== "object") n[segs[i]] = {}; n = n[segs[i]]; }
    if (val === null) delete n[segs[segs.length - 1]]; else n[segs[segs.length - 1]] = val;
  }
  function toVal(v) {
    if (v == null) return null;
    if (typeof v !== "object") return v;
    const o = {}; let allNum = true, max = -1;
    for (const k of Object.keys(v)) { const c = toVal(v[k]); if (c === null) continue; o[k] = c; if (!/^\d+$/.test(k)) allNum = false; else max = Math.max(max, +k); }
    const ks = Object.keys(o);
    if (!ks.length) return null;
    if (allNum && max < ks.length * 2) { const a = []; for (let i = 0; i <= max; i++) a.push(o[i] === undefined ? null : o[i]); return a; }
    return o;
  }
  function snap(key, v) {
    return { key, val: () => v, exists: () => v !== null,
      forEach(fn) { if (v && typeof v === "object") for (const k of Object.keys(v)) if (fn(snap(k, v[k])) === true) break; } };
  }
  function fire(l) {
    let v = toVal(getAt(l.path));
    if (l.q && v && typeof v === "object") {
      const ks = Object.keys(v).sort((a, b) => ((v[a] || {})[l.q.f] || 0) - ((v[b] || {})[l.q.f] || 0)).slice(-l.q.n);
      const o = {}; ks.forEach(k => { o[k] = v[k]; }); v = o;
    }
    const j = JSON.stringify(v);
    if (j === l.last) return;
    l.last = j;
    setTimeout(() => l.cb(snap(split(l.path).pop() || null, v)), 0);
  }
  function apply(pairs, remote) {
    for (const [p, v] of pairs) setAt(p, v === undefined ? null : JSON.parse(JSON.stringify(v)));
    if (!remote) ch.postMessage({ t: "ops", pairs: JSON.parse(JSON.stringify(pairs.map(([p, v]) => [p, v === undefined ? null : v]))) });
    setTimeout(() => listeners.slice().forEach(fire), 0);
  }
  ch.onmessage = e => {
    const m = e.data;
    if (m.t === "ops") apply(m.pairs, true);
    else if (m.t === "hello") ch.postMessage({ t: "state", tree });
    else if (m.t === "state" && !synced) { synced = true; tree = m.tree || {}; listeners.slice().forEach(fire); }
  };
  ch.postMessage({ t: "hello" });
  function ref(path) {
    path = split(path).join("/");
    const self = {
      key: split(path).pop() || null,
      child: p => ref(path + "/" + p),
      get: () => new Promise(r => setTimeout(() => r(snap(self.key, toVal(getAt(path)))), 5)),
      set: v => { apply([[path, v]]); return Promise.resolve(); },
      update: obj => { apply(Object.keys(obj).map(k => [path ? path + "/" + k : k, obj[k]])); return Promise.resolve(); },
      remove: () => { apply([[path, null]]); return Promise.resolve(); },
      on: (ev, cb) => { const l = { path, cb, last: undefined, q: null }; listeners.push(l); fire(l); return cb; },
      off: (ev, cb) => { const i = listeners.findIndex(l => l.path === path && l.cb === cb); if (i >= 0) listeners.splice(i, 1); },
      orderByChild: f => ({ limitToLast: n => ({
        on: (ev, cb) => { const l = { path, cb, last: undefined, q: { f, n } }; listeners.push(l); fire(l); return cb; },
        off: () => {} }) }),
      onDisconnect: () => ({
        set: v => { pendingDisc.set(path, v); return Promise.resolve(); },
        remove: () => { pendingDisc.set(path, null); return Promise.resolve(); },
        cancel: () => { pendingDisc.delete(path); return Promise.resolve(); }
      }),
      transaction: fn => new Promise(res => setTimeout(() => {
        const cur = toVal(getAt(path));
        const out = fn(cur == null ? null : JSON.parse(JSON.stringify(cur)));
        if (out === undefined) return res({ committed: false, snapshot: snap(self.key, cur) });
        apply([[path, out]]);
        res({ committed: true, snapshot: snap(self.key, toVal(getAt(path))) });
      }, 5))
    };
    return self;
  }
  window.__mockTree = () => tree;
  window.firebase = {
    apps: [],
    initializeApp(cfg) { this.apps.push(cfg); },
    database: () => ({ ref }),
    auth: () => ({
      onAuthStateChanged(cb) { setTimeout(() => cb({ uid }), 20); },
      signInAnonymously: () => Promise.resolve({ user: { uid } })
    })
  };
})();
