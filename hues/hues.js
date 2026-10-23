/* Оттенки — игра про цвета по мотивам Hues and Cues. Данные онлайн-комнат: Firebase Realtime Database
   (hues/lobby/<код>, hues/rooms/<код>/{game,players}, hues/secrets/<uid>/<код>). Подробности — в README.md. */
(() => {
"use strict";

/* ---------------- Палитра ---------------- */
const COLS = 24, ROWS = 14, CELLS = COLS * ROWS;
const ROW_L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const colOf = i => i % COLS, rowOf = i => Math.floor(i / COLS);
const cellName = i => ROW_L[rowOf(i)] + (colOf(i) + 1);
/* По горизонтали — тон по кругу, по вертикали — от светлых пастельных к тёмным */
const COLORS = [];
for (let r = 0; r < ROWS; r++) {
  const t = r / (ROWS - 1);
  const l = 87 - t * 67;
  const s = 62 + 30 * Math.sin(Math.PI * Math.min(1, t * 1.25));
  for (let c = 0; c < COLS; c++) COLORS.push(`hsl(${Math.round(c * 360 / COLS)} ${Math.round(s)}% ${Math.round(l)}%)`);
}
/* Нельзя называть основные цвета */
const BANNED = /^(красн|оранжев|ж[её]лт|зел[её]н|голуб|син(ий|яя|ее|ие|его|ей|им|ими|их|ему|юю)$|фиолетов|розов|коричнев|б[еэ]л(ый|ая|ое|ые|ого|ой|ым|ыми|ых|ому|ую)$|ч[её]рн|сер(ый|ая|ое|ые|ого|ой|ым|ыми|ых|ому|ую)$|red|orange|yellow|green|blue|purple|violet|pink|brown|white|black|gr[ae]y)/i;

const PCOLORS = ["#E4572E", "#2B67C6", "#2F8F5B", "#A93A88", "#E8A317", "#139C9A", "#7B4EA3", "#8C6A43", "#D81E5B", "#4C6085"];
const MIN_LAPS = 1, MAX_LAPS = 4;

/* ---------------- Утилиты ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rnd = n => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isObj = x => x !== null && typeof x === "object" && !Array.isArray(x);
const isCell = v => Number.isInteger(v) && v >= 0 && v < CELLS;
const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
function genCode() { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 4; i++) s += a[rnd(a.length)]; return s; }
function plural(n, one, few, many) { const a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 20) return many; if (b > 1 && b < 5) return few; if (b === 1) return one; return many; }
const pts = n => `${n} ${plural(n, "очко", "очка", "очков")}`;
/* Обёртка «записать объект целиком» — без слияния с тем, что уже лежит в базе */
const LEAF = o => ({ __leaf: o });
const isLeaf = v => isObj(v) && Object.prototype.hasOwnProperty.call(v, "__leaf");
function deepMerge(t, p) {
  for (const k of Object.keys(p)) {
    const v = p[k];
    if (isLeaf(v)) t[k] = clone(v.__leaf);
    else if (isObj(v) && isObj(t[k])) deepMerge(t[k], v);
    else t[k] = clone(v);
  }
  return t;
}
function stripNulls(v) {
  if (Array.isArray(v)) return v.map(stripNulls);
  if (isObj(v)) { const o = {}; for (const k of Object.keys(v)) { const c = stripNulls(v[k]); if (c !== null && c !== undefined) o[k] = c; } return o; }
  return v;
}
function words(s) { return String(s || "").trim().split(/\s+/).filter(Boolean); }

/* ---------------- Сетка (DOM) ---------------- */
function createGrid(root, handlers) {
  root.innerHTML = `<div class="cells">${COLORS.map(c => `<i style="background:${c}"></i>`).join("")}</div><div class="marks"></div>`;
  const marks = root.querySelector(".marks");
  let live = false, drag = false;
  const cellAt = e => {
    const b = marks.getBoundingClientRect();
    const c = clamp(Math.floor((e.clientX - b.left) / b.width * COLS), 0, COLS - 1);
    const r = clamp(Math.floor((e.clientY - b.top) / b.height * ROWS), 0, ROWS - 1);
    return r * COLS + c;
  };
  root.addEventListener("pointerdown", e => {
    if (!live) return;
    drag = true;
    try { root.setPointerCapture(e.pointerId); } catch {}
    handlers.pick(cellAt(e));
    e.preventDefault();
  });
  root.addEventListener("pointermove", e => { if (live && drag) handlers.pick(cellAt(e)); });
  const end = () => { drag = false; };
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
  return {
    setLive(v) { live = !!v; root.classList.toggle("is-live", live); },
    setMarks(html) { if (marks._h !== html) { marks.innerHTML = html; marks._h = html; } }
  };
}
const pctX = c => (c / COLS * 100).toFixed(3) + "%";
const pctY = r => (r / ROWS * 100).toFixed(3) + "%";
function boxHTML(i, rad, cls) {
  const c0 = clamp(colOf(i) - rad, 0, COLS - 1), c1 = clamp(colOf(i) + rad, 0, COLS - 1);
  const r0 = clamp(rowOf(i) - rad, 0, ROWS - 1), r1 = clamp(rowOf(i) + rad, 0, ROWS - 1);
  return `<span class="${cls}" style="left:${pctX(c0)};top:${pctY(r0)};width:${pctX(c1 - c0 + 1)};height:${pctY(r1 - r0 + 1)}"></span>`;
}
const targetHTML = i => boxHTML(i, 2, "frame is-outer") + boxHTML(i, 1, "frame") + boxHTML(i, 0, "tgt");
/* Фишки: [{cell, color, letter, cls}]. Несколько фишек в одной клетке раскладываются веером. */
function conesHTML(list) {
  const by = {};
  list.forEach(m => { (by[m.cell] = by[m.cell] || []).push(m); });
  let html = "";
  for (const k of Object.keys(by)) {
    const g = by[k], n = g.length;
    g.forEach((m, j) => {
      const off = n > 1 ? (j - (n - 1) / 2) * 0.55 : 0;
      const x = (colOf(m.cell) + 0.5 + off) / COLS * 100, y = (rowOf(m.cell) + 0.5) / ROWS * 100;
      html += `<span class="cone ${m.cls || ""}" style="left:${x.toFixed(3)}%;top:${y.toFixed(3)}%;--pc:${m.color}">${esc(m.letter || "")}</span>`;
    });
  }
  return html;
}

/* ---------------- Игровая логика ---------------- */
function dist(a, b) { return Math.max(Math.abs(colOf(a) - colOf(b)), Math.abs(rowOf(a) - rowOf(b))); }
function pointsFor(target, cell) { if (!isCell(cell)) return 0; const d = dist(target, cell); return d === 0 ? 3 : d === 1 ? 2 : d === 2 ? 1 : 0; }
function blankGame(laps) {
  return { laps, rounds: 0, status: "lobby", round: null, score: {}, history: [] };
}
function makeRound(n, giver) {
  return { n, giver: giver || null, phase: "think", clue1: "", clue2: "", g1: null, g2: null, force: null, ready: null, target: null, results: null, giverPts: null };
}
function sortedPlayers(players) {
  return players.slice().sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0) || String(a.seat).localeCompare(String(b.seat)));
}
/* Ведущий раунда n — по кругу в порядке входа; кто не в сети, того пропускаем */
function giverFor(n, players) {
  const order = sortedPlayers(players);
  if (!order.length) return null;
  for (let k = 0; k < order.length; k++) {
    const p = order[(n - 1 + k) % order.length];
    if (p.online) return p.seat;
  }
  return order[(n - 1) % order.length].seat;
}
function startPatch(G, players) {
  return {
    status: "play", gid: Date.now().toString(36) + rnd(46656).toString(36),
    rounds: G.laps * players.length, score: LEAF({}), history: [],
    round: LEAF(makeRound(1, giverFor(1, players)))
  };
}
const gameWillEnd = G => G.round.n >= G.rounds;
function nextPatch(G, players) {
  if (gameWillEnd(G)) return { status: "over" };
  const n = G.round.n + 1;
  return { round: LEAF(makeRound(n, giverFor(n, players))) };
}
function revealPatch(G, target) {
  const r = G.round, g1 = r.g1 || {}, g2 = r.g2 || {}, score = Object.assign({}, G.score || {}), results = {};
  let giverPts = 0;
  for (const uid of new Set([...Object.keys(g1), ...Object.keys(g2)])) {
    if (uid === r.giver) continue;
    const a = pointsFor(target, g1[uid]), b = pointsFor(target, g2[uid]);
    results[uid] = { a, b };
    score[uid] = (score[uid] || 0) + a + b;
    [g1[uid], g2[uid]].forEach(c => { if (isCell(c) && dist(target, c) <= 1) giverPts++; });
  }
  if (r.giver) score[r.giver] = (score[r.giver] || 0) + giverPts;
  const entry = { n: r.n, giver: r.giver, target, clue1: r.clue1, clue2: r.clue2, giverPts, results };
  return {
    round: { target, phase: "result", results: LEAF(results), giverPts, ready: null },
    score: LEAF(score),
    history: (G.history || []).concat([entry]).slice(-40)
  };
}
/* Карточка ведущего: четыре цвета подальше друг от друга и от прошлых целей */
function drawCard(G) {
  const used = new Set((G.history || []).map(h => h.target));
  const out = [];
  for (let tries = 0; out.length < 4 && tries < 2000; tries++) {
    const c = rnd(CELLS);
    if (used.has(c) || out.some(x => dist(x, c) < 4)) continue;
    out.push(c);
  }
  while (out.length < 4) out.push(rnd(CELLS));
  return out;
}
function clueProblem(text, max) {
  const w = words(text);
  if (!w.length) return "Напишите подсказку";
  if (w.length > max) return max === 1 ? "Первая подсказка — одно слово" : "Вторая подсказка — не больше двух слов";
  if (w.some(x => BANNED.test(x.replace(/[^\p{L}-]/gu, "")))) return "Основные цвета называть нельзя";
  return "";
}

/* ---------------- Состояние ---------------- */
const S = {
  caps: "wait", authErr: null, db: null, uid: null, seat: null, nick: "",
  mode: null, code: null, game: null, players: [], playersRaw: {}, rooms: [], roomsOn: false,
  online: new Set(), unsub: [],
  secret: null, loadingSecret: null, secretChecked: null,
  sel: null, revealKey: null, clue2Key: null, advKey: null,
  view: null, wake: null, hashCode: null,
  ui: { card: null, cardKey: null, pick: 0, confirm: null },
  drafts: { nick: "", code: "", clue: "" }
};
S.nick = store.get("hu.nick") || store.get("wl.nick") || "";
S.drafts.nick = S.nick;
{
  const h = String(location.hash || "").replace(/^#/, "").toUpperCase();
  if (/^[A-Z0-9]{4}$/.test(h)) { S.hashCode = h; S.drafts.code = h; }
}

/* Ключ раунда: комната + партия + номер раунда. Партия (gid) нужна, чтобы новая игра в той же комнате не подхватила цель прошлой. */
const rKey = G => S.code + ":" + ((G && G.gid) || 0) + ":" + (G && G.round ? G.round.n : 0);
const myPlayer = () => S.players.find(p => p.seat === S.seat) || null;
const nameOf = seat => { const p = S.players.find(x => x.seat === seat); return (p && p.name) || "Игрок"; };
const letterOf = seat => (nameOf(seat).trim()[0] || "?").toUpperCase();
function currentNick() { return String(S.drafts.nick ?? S.nick).trim().slice(0, 24); }
/* Админ — создатель комнаты; если он ушёл, права переходят к тому, кто зашёл раньше всех */
function adminSeat(G) {
  if (G && G.host && S.players.some(p => p.seat === G.host)) return G.host;
  const s = sortedPlayers(S.players);
  return s[0] ? s[0].seat : null;
}
const isAdmin = G => !!S.uid && adminSeat(G) === S.uid;
function colorOf(seat) {
  const i = sortedPlayers(S.players).findIndex(p => p.seat === seat);
  return PCOLORS[(i < 0 ? 0 : i) % PCOLORS.length];
}
const guessersOf = G => S.players.map(p => p.seat).filter(s => s !== G.round.giver);
const guessKey = ph => ph === "guess2" ? "g2" : "g1";
/* Кто ещё должен ответить и выполнено ли условие. Учитываем только тех, кто сейчас в сети. */
function roundStatus(G) {
  const r = G.round, on = s => S.online.has(s);
  const out = { req: [], done: [], ready: false };
  if (!r) return out;
  if (r.phase === "guess1" || r.phase === "guess2") {
    const g = r[guessKey(r.phase)] || {};
    out.req = guessersOf(G).filter(on);
    out.done = out.req.filter(s => isCell(g[s]));
    out.ready = out.req.length > 0 && (out.done.length === out.req.length || (r.force === r.phase && out.done.length > 0));
  } else if (r.phase === "result") {
    out.req = S.players.map(p => p.seat).filter(on);
    out.done = out.req.filter(s => r.ready && r.ready[s]);
    out.ready = out.req.length > 0 && out.done.length === out.req.length;
  }
  return out;
}

/* ---------------- Секрет ведущего ---------------- */
function getSecret(G) { const k = rKey(G); return S.secret && S.secret.key === k ? S.secret.target : null; }
function saveSecret(k, target) {
  S.secret = { key: k, target };
  store.set("hu.secret", S.secret);
  if (S.uid && S.db) S.db.ref(`hues/secrets/${S.uid}/${S.code}`).set({ key: k, target, at: Date.now() }).catch(() => {});
}
async function loadSecret(G) {
  const k = rKey(G);
  if ((S.secret && S.secret.key === k) || S.loadingSecret === k || S.secretChecked === k) return;
  const ls = store.get("hu.secret");
  if (ls && ls.key === k) { S.secret = ls; S.secretChecked = k; render(); return; }
  if (S.uid && S.db) {
    S.loadingSecret = k;
    try {
      const snap = await S.db.ref(`hues/secrets/${S.uid}/${S.code}`).get();
      const d = snap.exists() ? snap.val() : null;
      if (d && d.key === k && isCell(d.target)) S.secret = { key: k, target: d.target };
    } catch {}
    S.loadingSecret = null;
  }
  S.secretChecked = k;
  render();
}

/* ---------------- Запись хода ---------------- */
let writeQueue = Promise.resolve();
function writeErr(e) {
  const m = String((e && (e.code || e.message)) || "").toLowerCase();
  if (m.includes("permission")) return "Нет доступа к базе. Проверьте правила Realtime Database в консоли Firebase.";
  return "Не удалось сохранить ход. Проверьте интернет и попробуйте ещё раз.";
}
/* {round:{phase:"x"}} → {"round/phase":"x"}: Firebase меняет только нужные поля */
function flatten(obj, prefix, out) {
  for (const k of Object.keys(obj)) {
    const v = obj[k], p = prefix ? prefix + "/" + k : k;
    if (isLeaf(v)) out[p] = isObj(v.__leaf) ? (Object.keys(v.__leaf).length ? stripNulls(clone(v.__leaf)) : null) : v.__leaf;
    else if (isObj(v) && Object.keys(v).length) flatten(v, p, out);
    else if (Array.isArray(v)) out[p] = v.length ? v : null;
    else if (isObj(v)) out[p] = null;
    else out[p] = v === undefined ? null : v;
  }
  return out;
}
function commit(patch) {
  if (S.mode !== "online" || !S.db || !S.code) return Promise.resolve();
  const code = S.code, now = Date.now(), upd = {};
  const flat = flatten(patch, "", {});
  for (const p of Object.keys(flat)) upd[`hues/rooms/${code}/game/${p}`] = clone(flat[p]);
  upd[`hues/rooms/${code}/game/updatedAt`] = now;
  upd[`hues/lobby/${code}/updatedAt`] = now;
  if (patch.status) upd[`hues/lobby/${code}/status`] = patch.status;
  writeQueue = writeQueue.then(() => S.db.ref().update(upd)).catch(e => toast(writeErr(e)));
  return writeQueue;
}

/* ---------------- Онлайн-комнаты (Firebase) ---------------- */
async function initFirebase() {
  if (!window.SiteFirebase) { S.caps = "offline"; render(); return; }
  try {
    const { db, uid } = await window.SiteFirebase.connect();
    S.db = db; S.uid = uid; S.seat = uid; S.caps = "ok";
    subscribeRooms();
    const saved = store.get("hu.room");
    if (saved && !S.mode) resumeRoom(saved);
    render();
  } catch (e) {
    if (e !== "noconfig" && e !== "offline") console.error(e);
    S.caps = e === "noconfig" ? "noconfig" : e === "offline" ? "offline" : "authfail";
    S.authErr = e && e.code;
    render();
  }
}
function subscribeRooms() {
  if (S.roomsOn) return;
  S.roomsOn = true;
  S.db.ref("hues/lobby").orderByChild("updatedAt").limitToLast(40).on("value", snap => {
    const list = [];
    snap.forEach(c => { list.push(Object.assign({ id: c.key }, c.val())); });
    S.rooms = list.reverse();
    if (!S.mode) render();
  }, () => { S.rooms = []; });
}
async function resumeRoom(code) {
  try {
    const [g, p] = await Promise.all([S.db.ref(`hues/rooms/${code}/game/status`).get(), S.db.ref(`hues/rooms/${code}/players/${S.uid}/name`).get()]);
    if (g.exists() && p.exists()) { if (!S.mode) enterRoom(code); }
    else store.del("hu.room");
  } catch {}
}
function needNick() {
  const nick = currentNick();
  if (!nick) { toast("Сначала введите имя"); const n = $("#homeNick"); if (n) n.focus(); return null; }
  setNick(nick);
  return nick;
}
async function createRoom() {
  if (S.caps !== "ok") return;
  const nick = needNick(); if (!nick) return;
  try {
    let code = genCode();
    for (let i = 0; i < 5; i++) { const s = await S.db.ref(`hues/rooms/${code}/game/status`).get(); if (!s.exists()) break; code = genCode(); }
    const now = Date.now();
    const G = blankGame(2);
    Object.assign(G, { code, hostNick: nick, host: S.uid, createdAt: now, updatedAt: now });
    await S.db.ref().update({
      [`hues/rooms/${code}/game`]: stripNulls(clone(G)),
      [`hues/lobby/${code}`]: { code, hostNick: nick, status: "lobby", updatedAt: now }
    });
    await joinRoom(code);
  } catch (e) { toast(writeErr(e)); }
}
async function joinRoom(code) {
  code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 4) { toast("Код комнаты — это 4 символа"); return; }
  if (S.caps !== "ok") { toast("Нет связи с сервером игры"); return; }
  const nick = needNick(); if (!nick) return;
  try {
    const gs = await S.db.ref(`hues/rooms/${code}/game/status`).get();
    if (!gs.exists()) { toast(`Комнаты ${code} нет. Проверьте код.`); return; }
    const me = S.db.ref(`hues/rooms/${code}/players/${S.uid}`);
    const ps = await me.get();
    const cur = ps.exists() ? ps.val() : null;
    if (!cur || !cur.name) await me.update({ name: nick, joinedAt: Date.now() });
    else if (cur.name !== nick) await me.update({ name: nick });
    if (S.hashCode) { S.hashCode = null; try { history.replaceState(null, "", location.pathname + location.search); } catch {} }
    enterRoom(code);
  } catch (e) { toast(writeErr(e)); }
}
function enterRoom(code) {
  leaveSubs();
  Object.assign(S, { mode: "online", code, game: null, players: [], playersRaw: {}, online: new Set(), sel: null });
  resetRoundUI();
  store.set("hu.room", code);
  const base = S.db.ref("hues/rooms/" + code);
  const listen = (ref, cb) => {
    const fn = ref.on("value", cb, err => { console.error(err); toast("Связь с комнатой потеряна. Обновите страницу."); });
    S.unsub.push(() => ref.off("value", fn));
  };
  listen(base.child("game"), snap => {
    if (S.code !== code) return;
    const v = snap.val();
    if (!v) { toast("Этой комнаты больше нет"); exitOnline(); return; }
    onGame(normGame(v));
  });
  listen(base.child("players"), snap => {
    if (S.code !== code) return;
    S.playersRaw = snap.val() || {};
    buildPlayers();
    render();
  });
  /* Присутствие: в сети ли игрок и есть ли в комнате хоть кто-то (для списка открытых комнат) */
  const onlineRef = base.child(`players/${S.uid}/online`);
  const lobbyRef = S.db.ref(`hues/lobby/${code}/online/${S.uid}`);
  const conn = S.db.ref(".info/connected");
  const cfn = conn.on("value", s => {
    if (s.val() !== true || S.code !== code) return;
    onlineRef.onDisconnect().set(false).then(() => onlineRef.set(true)).catch(() => {});
    lobbyRef.onDisconnect().remove().then(() => lobbyRef.set(true)).catch(() => {});
  });
  S.unsub.push(() => {
    conn.off("value", cfn);
    onlineRef.onDisconnect().cancel().catch(() => {});
    lobbyRef.onDisconnect().cancel().catch(() => {});
  });
  render();
}
const ROUND_DEFAULTS = makeRound(0, null);
function arr(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") return Object.keys(x).sort((a, b) => a - b).map(k => x[k]);
  return [];
}
/* Firebase не хранит пустые массивы и null — возвращаем игре привычную форму */
function normGame(v) {
  const G = Object.assign({ laps: 2, rounds: 0, status: "lobby" }, v);
  G.score = isObj(v.score) ? v.score : {};
  G.history = arr(v.history).filter(Boolean);
  G.round = v.round ? Object.assign({}, ROUND_DEFAULTS, v.round) : null;
  return G;
}
function buildPlayers() {
  const raw = S.playersRaw || {};
  S.players = Object.keys(raw).filter(k => raw[k] && raw[k].name).map(k => ({
    seat: k, name: String(raw[k].name).slice(0, 24), joinedAt: raw[k].joinedAt || 0, online: raw[k].online === true
  }));
  S.online = new Set(S.players.filter(p => p.online).map(p => p.seat));
}
function onGame(G) {
  const prev = S.game;
  S.game = G;
  const r = G.round;
  if (!prev || !prev.round || !r || prev.round.n !== r.n || prev.gid !== G.gid || prev.status !== G.status) resetRoundUI();
  else if (prev.round.phase !== r.phase) { S.sel = null; S.drafts.clue = ""; }
  render();
}
/* Следующий раунд, когда все готовы. Транзакция: даже если нажали одновременно, раунд сменится один раз. */
function advanceRound(n) {
  const code = S.code;
  S.db.ref(`hues/rooms/${code}/game`).transaction(cur => {
    if (!cur) return cur;
    const G = normGame(cur);
    if (G.status !== "play" || !G.round || G.round.n !== n || G.round.phase !== "result") return;
    const out = deepMerge(G, nextPatch(G, S.players));
    out.updatedAt = Date.now();
    return stripNulls(out);
  }).then(res => {
    if (res && res.committed) {
      const v = res.snapshot.val() || {};
      S.db.ref(`hues/lobby/${code}`).update({ status: v.status || "play", updatedAt: Date.now() }).catch(() => {});
    }
  }).catch(e => { S.advKey = null; toast(writeErr(e)); });
}
function leaveSubs() {
  S.unsub.forEach(u => { try { u(); } catch {} });
  S.unsub = [];
}
function exitOnline() {
  leaveSubs();
  Object.assign(S, { mode: null, code: null, game: null, players: [], playersRaw: {} });
  store.del("hu.room");
  render();
}
/* Выход из комнаты. Ушёл последний — комната удаляется целиком. */
async function leaveRoom() {
  const code = S.code, uid = S.uid;
  leaveSubs();
  try {
    await S.db.ref().update({
      [`hues/rooms/${code}/players/${uid}`]: null,
      [`hues/lobby/${code}/online/${uid}`]: null
    });
    const rest = await S.db.ref(`hues/rooms/${code}/players`).get();
    if (!rest.exists()) await S.db.ref().update({ [`hues/rooms/${code}/game`]: null, [`hues/lobby/${code}`]: null });
  } catch {}
  exitOnline();
}
function setNick(nick) { S.nick = nick; S.drafts.nick = nick; store.set("hu.nick", nick); }
function roomLink(code) {
  if (!/^https?:$/.test(location.protocol)) return "";
  return location.origin + location.pathname + "#" + code;
}
function copyText(text, okMsg) {
  try { navigator.clipboard.writeText(text).then(() => toast(okMsg), () => toast(text)); }
  catch { toast(text); }
}

/* ---------------- Автоматика раунда ---------------- */
/* Ведущий ведёт раунд: открывает первые фишки и считает очки — только у него есть цель. */
function tick() {
  const G = S.game;
  if (S.mode !== "online" || !G || G.status !== "play" || !G.round) return;
  const r = G.round, st = roundStatus(G);
  if (r.giver === S.uid) {
    if (r.phase === "guess1" && st.ready) {
      const key = `c2:${rKey(G)}`;
      if (S.clue2Key !== key) { S.clue2Key = key; commit({ round: { phase: "clue2", force: null } }); }
    }
    if (r.phase === "guess2" && st.ready && getSecret(G) != null) {
      const key = `rev:${rKey(G)}`;
      if (S.revealKey !== key) {
        S.revealKey = key;
        setTimeout(() => {
          const G2 = S.game;
          if (S.mode !== "online" || !G2 || !G2.round || G2.round.n !== r.n) { S.revealKey = null; return; }
          const t = getSecret(G2);
          if (G2.round.phase !== "guess2" || !roundStatus(G2).ready || t == null) { S.revealKey = null; render(); return; }
          commit(revealPatch(G2, t));
        }, 700);
      }
    }
  }
  if (r.phase === "result" && st.ready) {
    const key = `adv:${rKey(G)}`;
    if (S.advKey !== key) { S.advKey = key; advanceRound(r.n); }
  }
}

/* ---------------- Действия ---------------- */
function resetRoundUI() {
  S.ui.card = null; S.ui.cardKey = null; S.ui.pick = 0; S.ui.confirm = null;
  S.drafts.clue = ""; S.sel = null;
}
let confirmTimer = null;
function confirmable(key, fn) {
  if (S.ui.confirm === key) { S.ui.confirm = null; clearTimeout(confirmTimer); fn(); return; }
  S.ui.confirm = key;
  clearTimeout(confirmTimer);
  confirmTimer = setTimeout(() => { S.ui.confirm = null; render(); }, 3500);
  render();
}
const confirmLabel = (key, label) => S.ui.confirm === key ? "Точно? Нажмите ещё раз" : label;
const canSkip = G => G && G.round && (G.round.giver === S.uid || isAdmin(G));
/* Можно ли сейчас мне ставить фишку и куда нельзя */
function myTurn(G) {
  const r = G && G.round;
  if (!r || (r.phase !== "guess1" && r.phase !== "guess2") || r.giver === S.uid || !myPlayer()) return false;
  const g = r[guessKey(r.phase)] || {};
  return !isCell(g[S.uid]);
}
function blockedCells(G) {
  const r = G.round, out = new Set();
  if (r.phase === "guess2") Object.values(r.g1 || {}).forEach(c => { if (isCell(c)) out.add(c); });
  return out;
}

const ACT = {
  home() { if (!S.mode) window.scrollTo(0, 0); },
  create() { createRoom(); },
  join() { joinRoom(S.drafts.code); },
  joinRoom(arg) { joinRoom(arg); },
  laps(arg) {
    const G = S.game; if (!G || G.status !== "lobby" || !isAdmin(G)) return;
    const n = clamp((G.laps || 2) + (+arg || 0), MIN_LAPS, MAX_LAPS);
    if (n !== G.laps) commit({ laps: n });
  },
  start() {
    const G = S.game; if (!G || G.status !== "lobby" || !isAdmin(G)) return;
    if (S.players.length < 2) return toast("Нужно минимум 2 игрока");
    resetRoundUI();
    commit(startPatch(G, S.players));
  },
  async saveNick() {
    const nick = currentNick();
    if (!nick) return toast("Имя не может быть пустым");
    setNick(nick);
    if (S.code) {
      try { await S.db.ref(`hues/rooms/${S.code}/players/${S.uid}/name`).set(nick); toast("Имя сохранено"); } catch (e) { toast(writeErr(e)); }
    }
  },
  copyCode() { copyText(S.code, "Код скопирован"); },
  share() {
    const link = roomLink(S.code);
    if (!link) return copyText(S.code, "Код скопирован");
    const text = `Заходи в «Оттенки», комната ${S.code}`;
    if (navigator.share) navigator.share({ title: "Оттенки", text, url: link }).catch(() => {});
    else copyText(link, "Ссылка скопирована — отправьте её друзьям");
  },
  draw() {
    const G = S.game; if (!G || !G.round || G.round.phase !== "think" || G.round.giver !== S.uid) return;
    S.ui.card = drawCard(G); S.ui.cardKey = rKey(G); S.ui.pick = 0; render();
  },
  pick(arg) { S.ui.pick = clamp(+arg || 0, 0, 3); render(); },
  submitClue1() {
    const G = S.game; if (!G || !G.round || G.round.phase !== "think" || G.round.giver !== S.uid) return;
    if (!S.ui.card || S.ui.cardKey !== rKey(G)) return;
    const clue = words(S.drafts.clue).join(" ").slice(0, 30), bad = clueProblem(clue, 1);
    if (bad) return toast(bad);
    saveSecret(rKey(G), S.ui.card[S.ui.pick]);
    S.drafts.clue = "";
    commit({ round: { clue1: clue, phase: "guess1", g1: null, g2: null, force: null } });
  },
  submitClue2() {
    const G = S.game; if (!G || !G.round || G.round.phase !== "clue2" || G.round.giver !== S.uid) return;
    const clue = words(S.drafts.clue).join(" ").slice(0, 40), bad = clueProblem(clue, 2);
    if (bad) return toast(bad);
    S.drafts.clue = "";
    commit({ round: { clue2: clue, phase: "guess2", force: null } });
  },
  nudge(arg) {
    const G = S.game; if (!myTurn(G)) return;
    const d = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[arg]; if (!d) return;
    const cur = isCell(S.sel) ? S.sel : Math.floor(ROWS / 2) * COLS + Math.floor(COLS / 2);
    const c = clamp(colOf(cur) + d[0], 0, COLS - 1), r = clamp(rowOf(cur) + d[1], 0, ROWS - 1);
    S.sel = r * COLS + c; render();
  },
  place() {
    const G = S.game; if (!myTurn(G) || !isCell(S.sel)) return;
    if (blockedCells(G).has(S.sel)) return toast("Эта клетка занята фишкой первого круга");
    const r = G.round;
    if (r.phase === "guess2" && r.g1 && r.g1[S.uid] === S.sel) return toast("Вторая фишка не может стоять там же, где первая");
    commit({ round: { [guessKey(r.phase)]: { [S.uid]: S.sel } } });
  },
  unplace() {
    const G = S.game, r = G && G.round; if (!r || (r.phase !== "guess1" && r.phase !== "guess2")) return;
    const k = guessKey(r.phase), v = r[k] && r[k][S.uid];
    if (isCell(v)) S.sel = v;
    commit({ round: { [k]: { [S.uid]: null } } });
  },
  force() { const G = S.game; if (G && isAdmin(G) && G.round && /^guess/.test(G.round.phase)) commit({ round: { force: G.round.phase } }); },
  ready() {
    const G = S.game; if (!G || !G.round || G.round.phase !== "result") return;
    const on = G.round.ready && G.round.ready[S.uid];
    commit({ round: { ready: { [S.uid]: on ? null : true } } });
  },
  skip() {
    const G = S.game; if (!canSkip(G)) return;
    confirmable("skip", () => {
      const G2 = S.game; if (!G2 || !G2.round) return;
      const r = G2.round;
      const history = (G2.history || []).concat([{ n: r.n, giver: r.giver, clue1: r.clue1, clue2: r.clue2, skipped: true }]).slice(-40);
      resetRoundUI();
      commit(Object.assign(nextPatch(G2, S.players), { history }));
    });
  },
  leave() { confirmable("leave", () => leaveRoom()); },
  again() {
    const G = S.game; if (!G || !isAdmin(G)) return;
    resetRoundUI();
    commit({ status: "lobby", round: null, score: null, history: [] });
  }
};

/* ---------------- Отрисовка ---------------- */
function setHTML(el, html) {
  if (el._h === html) return false;
  const a = document.activeElement;
  let fid = null, s0 = null, s1 = null;
  if (a && a.id && el.contains(a)) { fid = a.id; try { s0 = a.selectionStart; s1 = a.selectionEnd; } catch {} }
  el.innerHTML = html;
  el._h = html;
  for (const inp of el.querySelectorAll("input[data-draft]")) { const v = S.drafts[inp.dataset.draft]; if (v != null) inp.value = v; }
  if (fid) {
    const n = document.getElementById(fid);
    if (n) { try { n.focus({ preventScroll: true }); if (s0 != null) n.setSelectionRange(s0, s1); } catch {} }
  }
  return true;
}
function show(view) {
  for (const id of ["vHome", "vLobby", "vGame", "vOver"]) $("#" + id).hidden = id !== view;
  if (S.view !== view) { S.view = view; window.scrollTo(0, 0); keepAwake(view === "vGame"); }
}
const msg = html => `<p class="msg">${html}</p>`;
const sw = (i, cls) => `<span class="sw${cls ? " " + cls : ""}" style="background:${COLORS[i]}"></span>`;
const stepper = n => `<div class="stepper" role="group" aria-label="Сколько раз каждый ведёт"><button type="button" data-act="laps" data-arg="-1" aria-label="Меньше"${n <= MIN_LAPS ? " disabled" : ""}>−</button><output aria-live="polite">${n}</output><button type="button" data-act="laps" data-arg="1" aria-label="Больше"${n >= MAX_LAPS ? " disabled" : ""}>+</button></div>`;

function render() {
  try {
    const G = S.game;
    if (S.mode === "online") {
      if (!G) { show("vLobby"); setHTML($("#vLobby"), msg(`Подключаемся к комнате <b>${esc(S.code)}</b><span class="dots"></span>`)); }
      else if (G.status === "over") renderOver();
      else if (G.status === "play" && G.round) renderGame();
      else renderLobby();
    } else renderHome();
    renderTop();
    tick();
  } catch (err) { console.error(err); }
}
function renderTop() {
  const G = S.game;
  let html = "";
  if (S.mode === "online" && G && G.round && G.status === "play") html = `<span class="chip">Вы <b>${(G.score || {})[S.uid] || 0}</b></span><span class="chip">${Math.min(G.round.n, G.rounds)}/${G.rounds}</span>`;
  else if (S.mode === "online" && S.code) html = `<span class="chip">${esc(S.code)}</span>`;
  setHTML($("#topRight"), html);
}

/* Главная */
function renderHome() {
  show("vHome");
  let online;
  $("#vHome").classList.toggle("invited", !!S.hashCode && S.caps === "ok");
  if (S.caps === "wait") online = msg(`Подключаемся к серверу игры<span class="dots"></span>`);
  else if (S.caps === "noconfig") online = msg("Онлайн ещё не настроен: в assets/firebase.js нет конфига Firebase.");
  else if (S.caps === "offline") online = msg("Не удалось загрузить Firebase. Проверьте интернет и обновите страницу.");
  else if (S.caps === "authfail") online = msg(S.authErr === "auth/operation-not-allowed"
    ? "В проекте Firebase выключен анонимный вход. Включите его: Authentication → Способ входа → Анонимный."
    : "Не удалось подключиться к серверу игры. Проверьте интернет и обновите страницу.");
  else online = `
    ${S.hashCode ? msg(`Вас позвали в комнату <b>${esc(S.hashCode)}</b>. Введите имя и входите.`) : ""}
    <div class="field"><label for="homeNick">Ваше имя</label><input id="homeNick" data-draft="nick" type="text" maxlength="24" autocomplete="nickname" placeholder="Как вас называть в игре"></div>
    ${S.hashCode
      ? `<button class="btn btn-primary btn-block" type="button" data-act="joinRoom" data-arg="${esc(S.hashCode)}">Войти в комнату ${esc(S.hashCode)}</button><button class="btn btn-block" type="button" data-act="create">Создать свою комнату</button>`
      : `<button class="btn btn-primary btn-block" type="button" data-act="create">Создать комнату</button>`}
    <div class="field"><label for="codeInput">Или войдите по коду</label>
      <div class="row"><input id="codeInput" class="code-input" data-draft="code" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="КОД"><button class="btn" type="button" data-act="join">Войти</button></div>
    </div>
    ${roomsHTML()}`;
  setHTML($("#homeOnline"), online);
}
/* В списке только комнаты, где сейчас кто-то есть */
function roomsHTML() {
  const list = S.rooms.filter(g => g && g.online && Object.keys(g.online).length > 0);
  if (!list.length) return `<p class="msg small">Открытых комнат сейчас нет. Создайте свою — друзья увидят её здесь.</p>`;
  const st = { lobby: "ждут игроков", play: "идёт игра", over: "игра окончена" };
  return `<div class="field"><span class="label">Открытые комнаты</span><div class="rooms">${list.map(g => {
    const code = String(g.code || g.id), n = Object.keys(g.online).length;
    return `<button class="room" type="button" data-act="joinRoom" data-arg="${esc(code)}"><span><b>${esc(g.hostNick || "Комната")}</b> <span class="msg small">· ${st[g.status] || ""} · в сети ${n}</span></span><code>${esc(code)}</code></button>`;
  }).join("")}</div></div>`;
}

/* Фишка игрока в списке */
function chipMark(G, seat) {
  const r = G && G.round;
  if (!r || G.status !== "play") return "";
  if (r.phase === "guess1" || r.phase === "guess2") { const g = r[guessKey(r.phase)]; return g && isCell(g[seat]) ? "✓" : ""; }
  if (r.phase === "result") return r.ready && r.ready[seat] ? "✓" : "";
  return "";
}
function plChip(p, G) {
  const r = G && G.round;
  const tags = [];
  if (p.seat === S.uid) tags.push("вы");
  if (G && G.status === "play" && r && r.giver === p.seat) tags.push("ведущий");
  if (G && adminSeat(G) === p.seat) tags.push("админ");
  const score = G && G.status !== "lobby" ? `<span class="sc">${(G.score || {})[p.seat] || 0}</span>` : "";
  const mk = chipMark(G, p.seat);
  return `<span class="pl${p.online ? "" : " is-off"}" title="${p.online ? "в сети" : "не в сети"}"><span class="cdot" style="background:${colorOf(p.seat)}"></span><span class="nm">${esc(p.name || "Игрок")}</span>${tags.map(t => `<span class="tag">${t}</span>`).join("")}${score}${mk ? `<span class="mk">${mk}</span>` : ""}</span>`;
}

/* Лобби комнаты */
function renderLobby() {
  show("vLobby");
  const G = S.game, admin = isAdmin(G), adminName = nameOf(adminSeat(G));
  const players = sortedPlayers(S.players), n = players.length, laps = G.laps || 2;
  const canStart = n >= 2, why = canStart ? "" : "Нужно минимум 2 игрока. Позовите кого-нибудь в комнату.";
  if (S.drafts.nick == null || S.drafts.nick === "") S.drafts.nick = (myPlayer() && myPlayer().name) || S.nick;
  setHTML($("#vLobby"), `
    <div class="lobby-head">
      <div><div class="eyebrow">Код комнаты</div><div class="code">${esc(S.code)}</div></div>
      <button class="btn" type="button" data-act="copyCode">Скопировать код</button>
    </div>
    <p class="lead">Отправьте друзьям ссылку — комната откроется у них сразу. Или пусть откроют игру и введут код.</p>
    <button class="btn btn-block" type="button" data-act="share">Пригласить друзей</button>
    <div class="panel">
      <div class="field"><label for="lobbyNick">Ваше имя в игре</label>
        <div class="row"><input id="lobbyNick" data-draft="nick" type="text" maxlength="24" autocomplete="nickname"><button class="btn" type="button" data-act="saveNick">Сохранить</button></div>
      </div>
    </div>
    <div class="panel">
      <h2>Правила</h2>
      ${msg("Каждый играет сам за себя. Ведущий по очереди выбирает цвет и даёт подсказку в одно слово, все тайно ставят фишку. Потом фишки открываются, ведущий даёт вторую подсказку до двух слов, и все ставят ещё по фишке.")}
      ${msg("Точно в цвет — <b>3</b>, в рамке 3×3 вокруг — <b>2</b>, на клетку дальше рамки — <b>1</b>. Ведущий получает <b>+1</b> за каждую фишку в рамке 3×3.")}
      ${admin
        ? `<div class="setting"><span class="label">Сколько раз каждый будет ведущим</span>${stepper(laps)}</div>`
        : `<p class="msg">Каждый будет ведущим: <b>${laps}</b> ${plural(laps, "раз", "раза", "раз")}</p>`}
      ${n >= 2 ? `<p class="msg small">Всего раундов: <b>${laps * n}</b></p>` : ""}
      ${admin ? "" : `<p class="msg small">Настройки меняет админ — ${esc(adminName)}.</p>`}
    </div>
    <div class="panel">
      <h2>Игроки · ${n}</h2>
      <div class="players">${players.map(p => plChip(p, G)).join("")}</div>
    </div>
    ${admin
      ? `${why ? msg(why) : ""}<button class="btn btn-primary btn-block" type="button" data-act="start"${canStart ? "" : " disabled"}>Начать игру</button>`
      : msg(`Игру начнёт <b>${esc(adminName)}</b>.${why ? " " + why : ""}`)}
    <button class="btn-quiet" type="button" data-act="leave">${confirmLabel("leave", "Выйти из комнаты")}</button>`);
}

/* Раунд */
function cone(seat, cell, extra) { return { cell, color: colorOf(seat), letter: letterOf(seat), cls: extra || "" }; }
function renderGame() {
  show("vGame");
  const G = S.game, r = G.round, k = rKey(G), giver = r.giver === S.uid;
  if (giver && r.phase !== "think" && getSecret(G) == null && S.secretChecked !== k) loadSecret(G);
  const secret = getSecret(G), st = roundStatus(G);

  setHTML($("#gHead"), `<div class="eyebrow">Раунд ${r.n} из ${G.rounds}</div><div class="who">Ведущий: <b>${giver ? "вы" : esc(nameOf(r.giver))}</b></div>`);

  /* Подсказки */
  let clues = "";
  if (r.clue1) clues += `<div class="clue${r.clue2 ? " is-old" : ""}"><small>Подсказка 1</small>«${esc(r.clue1)}»</div>`;
  if (r.clue2) clues += `<div class="clue"><small>Подсказка 2</small>«${esc(r.clue2)}»</div>`;
  setHTML($("#gClue"), clues);
  $("#gClue").hidden = !clues;

  /* Палитра */
  let marks = "";
  const g1 = r.g1 || {}, g2 = r.g2 || {}, cones = [];
  if (r.phase === "result") {
    marks += targetHTML(r.target);
    Object.keys(g1).forEach(u => { if (isCell(g1[u])) cones.push(cone(u, g1[u])); });
    Object.keys(g2).forEach(u => { if (isCell(g2[u])) cones.push(cone(u, g2[u], "is-two")); });
  } else {
    if (giver && r.phase === "think" && S.ui.card && S.ui.cardKey === k) {
      S.ui.card.forEach((c, i) => {
        marks += `<span class="cand${S.ui.pick === i ? " is-on" : ""}" style="left:${((colOf(c) + .5) / COLS * 100).toFixed(3)}%;top:${((rowOf(c) + .5) / ROWS * 100).toFixed(3)}%">${i + 1}</span>`;
      });
    }
    if (giver && secret != null && r.phase !== "think") marks += boxHTML(secret, 1, "frame") + boxHTML(secret, 0, "tgt");
    /* Первые фишки видны всем после первого круга; свои — всегда */
    const showAll1 = r.phase === "clue2" || r.phase === "guess2";
    Object.keys(g1).forEach(u => { if (isCell(g1[u]) && (showAll1 || u === S.uid)) cones.push(cone(u, g1[u])); });
    if (isCell(g2[S.uid])) cones.push(cone(S.uid, g2[S.uid], "is-two"));
    if (myTurn(G) && isCell(S.sel)) cones.push(cone(S.uid, S.sel, "is-ghost is-sel" + (r.phase === "guess2" ? " is-two" : "")));
  }
  gridG.setMarks(marks + conesHTML(cones));
  gridG.setLive(myTurn(G));

  setHTML($("#gPanel"), panelHTML(G, secret, st));
  setHTML($("#gPlayers"), `<div class="players">${sortedPlayers(S.players).map(p => plChip(p, G)).join("")}</div>`);
  setHTML($("#gFoot"), (r.phase !== "result" && canSkip(G) ? `<button class="btn-quiet" type="button" data-act="skip">${confirmLabel("skip", "Пропустить раунд")}</button>` : "")
    + `<button class="btn-quiet" type="button" data-act="leave">${confirmLabel("leave", "Выйти из комнаты")}</button>`);
}
function giverAway(G, text) {
  const r = G.round;
  if (S.online.has(r.giver) || r.giver === S.uid) return msg(text);
  return msg(`${text} Но ведущий <b>${esc(nameOf(r.giver))}</b> сейчас не в сети.`) + (isAdmin(G) ? `<button class="btn btn-block" type="button" data-act="skip">${confirmLabel("skip", "Пропустить раунд")}</button>` : "");
}
function panelHTML(G, secret, st) {
  const r = G.round, giver = r.giver === S.uid, k = rKey(G);
  if (r.phase === "think") {
    if (!giver) return giverAway(G, `<b>${esc(nameOf(r.giver))}</b> выбирает цвет и придумывает подсказку<span class="dots"></span>`);
    if (!S.ui.card || S.ui.cardKey !== k) return msg("Вы ведущий. Проверьте, что экран никто не видит, и возьмите карточку.")
      + `<button class="btn btn-primary btn-block" type="button" data-act="draw">Взять карточку</button>`;
    const bad = S.drafts.clue.trim() ? clueProblem(S.drafts.clue, 1) : "";
    return msg("Выберите один из четырёх цветов — он отмечен на палитре — и опишите его одним словом. Основные цвета называть нельзя.")
      + `<div class="card" role="group" aria-label="Карточка">${S.ui.card.map((c, i) => `<button type="button" data-act="pick" data-arg="${i}" aria-pressed="${S.ui.pick === i}">${sw(c)}<span>${i + 1} · ${cellName(c)}</span></button>`).join("")}</div>
      <div class="field"><label for="clueInput">Подсказка — одно слово</label><input id="clueInput" data-draft="clue" type="text" maxlength="30" autocomplete="off" placeholder="Например: мандарин"></div>
      <p class="status" id="clueWarn">${esc(bad)}</p>
      <button class="btn btn-primary btn-block" id="clueSubmit" type="button" data-act="submitClue1"${S.drafts.clue.trim() && !bad ? "" : " disabled"}>Отправить подсказку</button>
      <button class="btn-quiet" type="button" data-act="draw">Другая карточка</button>`;
  }
  if (r.phase === "guess1" || r.phase === "guess2") {
    const second = r.phase === "guess2";
    const stat = `<p class="status">Поставили <b>${st.done.length} из ${st.req.length}</b></p>`;
    const force = isAdmin(G) && st.done.length > 0 && st.done.length < st.req.length && r.force !== r.phase ? `<button class="btn-quiet" type="button" data-act="force">Не ждать остальных</button>` : "";
    if (st.ready) return second ? giverAway(G, `Все поставили. Считаем очки<span class="dots"></span>`) : giverAway(G, `Все поставили. Открываем фишки<span class="dots"></span>`);
    if (giver) return msg(second ? "Игроки ставят вторые фишки." : "Игроки ставят фишки. Их увидят все, когда ответит каждый.") + stat + force;
    if (!myPlayer()) return msg("Игроки ставят фишки.") + stat;
    const g = r[guessKey(r.phase)] || {};
    if (isCell(g[S.uid])) return msg(`Фишка стоит на ${sw(g[S.uid])} <b class="cellname">${cellName(g[S.uid])}</b>. Ждём остальных.`).replace('<p class="msg">', '<p class="msg pickbar">')
      + `<button class="btn btn-block" type="button" data-act="unplace">Передвинуть фишку</button>` + stat + force;
    const sel = isCell(S.sel) ? S.sel : null;
    const blocked = sel != null && (blockedCells(G).has(sel) || (second && r.g1 && r.g1[S.uid] === sel));
    return msg(second ? "Поставьте вторую фишку. Нельзя ставить на клетку, где уже стоит фишка." : "Нажмите на цвет, который подходит к подсказке. Фишку никто не увидит, пока не ответят все.")
      + `<div class="pickbar">${sel != null ? `${sw(sel, "sw-lg")}<span class="cellname">${cellName(sel)}</span>${blocked ? `<span class="status">занято</span>` : ""}` : `<span class="status">Клетка не выбрана</span>`}</div>
      <div class="row dpad"><button class="btn" type="button" data-act="nudge" data-arg="l" aria-label="Левее">←</button><button class="btn" type="button" data-act="nudge" data-arg="u" aria-label="Выше">↑</button><button class="btn btn-primary grow" type="button" data-act="place"${sel != null && !blocked ? "" : " disabled"}>Поставить</button><button class="btn" type="button" data-act="nudge" data-arg="d" aria-label="Ниже">↓</button><button class="btn" type="button" data-act="nudge" data-arg="r" aria-label="Правее">→</button></div>`
      + stat + force;
  }
  if (r.phase === "clue2") {
    if (!giver) return giverAway(G, `Все фишки открыты. <b>${esc(nameOf(r.giver))}</b> придумывает вторую подсказку<span class="dots"></span>`);
    const bad = S.drafts.clue.trim() ? clueProblem(S.drafts.clue, 2) : "";
    return msg("Фишки открыты. Дайте вторую подсказку — не больше двух слов, — чтобы подвести игроков ближе к цвету.")
      + `<div class="field"><label for="clueInput">Подсказка — до двух слов</label><input id="clueInput" data-draft="clue" type="text" maxlength="40" autocomplete="off" placeholder="Например: спелый апельсин"></div>
      <p class="status" id="clueWarn">${esc(bad)}</p>
      <button class="btn btn-primary btn-block" id="clueSubmit" type="button" data-act="submitClue2"${S.drafts.clue.trim() && !bad ? "" : " disabled"}>Отправить подсказку</button>`;
  }
  return resultHTML(G, st);
}
function resultHTML(G, st) {
  const r = G.round, end = gameWillEnd(G), res = r.results || {};
  const rows = Object.keys(res).map(u => ({ u, a: res[u].a || 0, b: res[u].b || 0 })).sort((x, y) => (y.a + y.b) - (x.a + x.b));
  const mine = res[S.uid];
  const title = r.giver === S.uid ? `Вы ведущий: +${r.giverPts || 0}` : (mine ? `Вам +${(mine.a || 0) + (mine.b || 0)}` : "Итоги раунда");
  const body = `<div class="pickbar">${sw(r.target, "sw-lg")}<div><div class="res-title">${title}</div><span class="status">Цвет <b>${cellName(r.target)}</b></span></div></div>
    <div class="board">${rows.map(x => `<div class="board-row${x.u === S.uid ? " is-me" : ""}"><span class="rank"></span><span class="cdot" style="background:${colorOf(x.u)}"></span><span class="who">${esc(nameOf(x.u))}</span><span class="val"><small>${x.a} + ${x.b}</small>+${x.a + x.b}</span></div>`).join("") || msg("Никто не успел поставить фишку.")}</div>
    ${msg(`Ведущий <b>${esc(nameOf(r.giver))}</b> получает +${r.giverPts || 0} — по очку за каждую фишку в рамке 3×3.`)}`;
  const iReady = r.ready && r.ready[S.uid];
  const label = iReady ? "Отменить готовность" : (end ? "Готов — к итогам" : "Готов к следующему раунду");
  const status = st.ready ? msg(`Все готовы<span class="dots"></span>`) : `<p class="status">Готовы <b>${st.done.length} из ${st.req.length}</b></p>`;
  return body + `<button class="btn${iReady ? "" : " btn-primary"} btn-block" type="button" data-act="ready">${label}</button>` + status;
}

/* Итоги */
function renderOver() {
  show("vOver");
  const G = S.game, sc = G.score || {};
  const rows = sortedPlayers(S.players).map(p => ({ p, s: sc[p.seat] || 0 })).sort((x, y) => y.s - x.s);
  const best = rows.length ? rows[0].s : 0, top = rows.filter(x => x.s === best).map(x => esc(x.p.name));
  const head = `<div class="hero"><div class="eyebrow">Игра окончена</div><h1>${top.length > 1 ? `Ничья: ${top.join(" и ")}` : `Победа: ${top[0] || "—"}`}</h1></div>
    <div class="board">${rows.map((x, i) => `<div class="board-row${x.p.seat === S.uid ? " is-me" : ""}"><span class="rank">${i + 1}</span><span class="cdot" style="background:${colorOf(x.p.seat)}"></span><span class="who">${esc(x.p.name)}</span><span class="val">${x.s}</span></div>`).join("")}</div>`;
  const hist = (G.history || []).map(h => {
    const clue = h.skipped ? "раунд пропущен" : [h.clue1, h.clue2].filter(Boolean).map(c => `«${esc(c)}»`).join(" → ");
    const best = h.results ? Object.keys(h.results).map(u => ({ u, p: (h.results[u].a || 0) + (h.results[u].b || 0) })).sort((a, b) => b.p - a.p)[0] : null;
    return `<tr><td class="n">${h.n}</td><td>${isCell(h.target) ? sw(h.target) : ""}</td><td>${clue}<div class="msg small">ведущий ${esc(nameOf(h.giver))}${best && best.p ? ` · лучше всех ${esc(nameOf(best.u))}` : ""}</div></td><td class="num">${h.skipped ? "—" : "+" + (h.giverPts || 0)}</td></tr>`;
  }).join("");
  const again = isAdmin(G)
    ? `<button class="btn btn-primary btn-block" type="button" data-act="again">Сыграть ещё</button>`
    : msg(`Новую партию начнёт <b>${esc(nameOf(adminSeat(G)))}</b>.`);
  setHTML($("#vOver"), `${head}
    ${hist ? `<div class="panel"><h2>Как шли раунды</h2><div class="tbl"><table class="hist"><thead><tr><th>#</th><th>Цвет</th><th>Подсказки</th><th class="num">Ведущему</th></tr></thead><tbody>${hist}</tbody></table></div></div>` : ""}
    ${again}
    <button class="btn-quiet" type="button" data-act="leave">${confirmLabel("leave", "Выйти из комнаты")}</button>`);
}

/* ---------------- Тосты, экран, события ---------------- */
let toastTimer = null;
function toast(text) {
  const t = $("#toast");
  t.textContent = text; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3400);
}
async function keepAwake(on) {
  try {
    if (on && !S.wake && navigator.wakeLock) {
      S.wake = await navigator.wakeLock.request("screen");
      S.wake.addEventListener("release", () => { S.wake = null; });
    } else if (!on && S.wake) { const w = S.wake; S.wake = null; await w.release(); }
  } catch { S.wake = null; }
}
/* Подсказка: проверяем на лету, не перерисовывая поле ввода */
function updateClueBtn() {
  const b = $("#clueSubmit"), w = $("#clueWarn"), r = S.game && S.game.round;
  if (!b || !r) return;
  const text = S.drafts.clue.trim(), bad = text ? clueProblem(text, r.phase === "clue2" ? 2 : 1) : "";
  b.disabled = !text || !!bad;
  if (w) w.textContent = bad;
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.view === "vGame") keepAwake(true); });
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]");
  if (!b || b.disabled) return;
  const fn = ACT[b.dataset.act];
  if (fn) { e.preventDefault(); fn(b.dataset.arg, b); }
});
document.addEventListener("input", e => {
  const el = e.target;
  if (!el.dataset || !el.dataset.draft) return;
  let v = el.value;
  if (el.dataset.draft === "code") {
    const up = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    if (up !== v) el.value = up;
    v = up;
  }
  S.drafts[el.dataset.draft] = v;
  if (el.id === "clueInput") updateClueBtn();
});
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || !e.target || e.target.tagName !== "INPUT") return;
  const id = e.target.id, r = S.game && S.game.round;
  if (id === "codeInput") ACT.join();
  else if (id === "clueInput") { if (r && r.phase === "clue2") ACT.submitClue2(); else ACT.submitClue1(); }
  else if (id === "lobbyNick") ACT.saveNick();
  else if (id === "homeNick") { if (S.hashCode) ACT.joinRoom(S.hashCode); else ACT.create(); }
});

/* ---------------- Палитры на странице ---------------- */
const gridG = createGrid($("#gameGrid"), { pick(c) { if (myTurn(S.game)) { S.sel = c; render(); } } });
const DEMO_TARGET = 5 * COLS + 2, DEMO_START = 6 * COLS + 3;
let demoSel = DEMO_START;
const demoG = createGrid($("#demoGrid"), {
  pick(c) {
    demoSel = c;
    const p = pointsFor(DEMO_TARGET, c);
    $("#demoScore").textContent = p ? pts(p) : "0 очков — мимо";
    demoDraw(true);
  }
});
function demoDraw(open) {
  demoG.setMarks((open ? targetHTML(DEMO_TARGET) : "") + conesHTML([{ cell: demoSel, color: PCOLORS[1], letter: "Я", cls: "is-sel" }]));
}
demoG.setLive(true);
demoDraw(false);

/* ---------------- Запуск ---------------- */
render();
initFirebase();
})();
