/* Оттенки — игра про цвета по мотивам Hues and Cues. Данные онлайн-комнат: Firebase Realtime Database
   (hues/lobby/<код>, hues/rooms/<код>/{game,players}, hues/secrets/<uid>/<код>). Подробности — в README.md. */
(() => {
"use strict";

/* ---------------- Палитры ---------------- */
const BOARDS = {
  m: { cols: 24, rows: 14, name: "Обычная", hint: "24 × 14, 336 цветов. Удобно с телефона." },
  l: { cols: 30, rows: 16, name: "Большая", hint: "30 × 16, 480 цветов — как в настольной игре." },
  xl: { cols: 40, rows: 22, name: "Огромная", hint: "40 × 22, 880 цветов. Лучше играть с компьютера." }
};
const ROW_L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/* Палитра как на доске настольной игры: тон идёт по кругу вдоль краёв (сверху красные, справа фиолетовые и синие,
   снизу зелёные, слева жёлтые), к центру цвета бледнеют, и ни один цвет не повторяется у противоположных краёв.
   ORIGINAL — цвета доски 30 × 16 (по 6 hex-символов на клетку, строка за строкой). Большая палитра берёт их как есть,
   остальные размеры — плавная (бикубическая) интерполяция между ними в пространстве OKLab. */
const ORIGINAL = [
  "612b0f6b2710752214831f19941e1e9e1c20af1e23c62127df1f26ec1c24ec1e23ed1d25ec1c2eed1a3bec1946e91854e51565e21075d70f83d3148dc82791bb2d91b23394a835949f38949338958c3d98833d977d3e9973419a",
  "884b1f94441f9c3f20ad3f24b83825c62d27d62827e42024ec2324ed282aee2932ee2932ed2041ec204dec1c5eec166eed107ce90d8ddb2b92cd3894bf3f98b43d97a93c979e3e97963d978d3d96843e987d3e99723d97683b96",
  "a66128ac5b26ba5a27c14e27cc4827d64027e13926e93024ee362cee3c40ef3f4cee3b51ee3b5dee3267ed3078ee2c87eb3196da4398ca499bbb4c9db4499ba647999e45999543988c4299843e98793d97733c976639965a3191",
  "c9822ad78228dd7627e87824e66a25ea5e25f1602bef5533f04f3def5651f05d65f05e6bef5871f0537eef508bef4f9ddf55a0cd57a1be5fa5b659a2a554a19b4e9e944c9e8d499e82449b7b41986f3e99663795583393472e8a",
  "e69c23f1991ef7921cf68c1ef68625f4792ef4783df36e45f37052f27767f37674f27781f27789f27094f069a4e76facd371acc771aebb71aeac67aa9e5fa69359a58d54a38451a07a499d6f459b623e98583393492e8f342b84",
  "feb415fcb122faab2bfbab3afaa741f9a34cf69755f68f5ef48864f48873f58f83f38f8ff48f99f48da3f287b5e08dbbd18bbdc68cbeb982b9aa7ab69c74b39067ab865ea77b59a77251a2634a9e5a429a4c3293392f8f2c2978",
  "fdc113fdc028fcb72cfcb43bfcb95ef9ac56faaa63f9a26df7a279f7a085f69e94f69d99f59ea5f69baaf39dc2e1a5cbd0a6cccdadd2b898c7a88bc19a82bc9a82bc7f6eb27265ad675ca85954a44f4ba044419a3136942b2f86",
  "fcd017fecd29ffc82efdc73ffec64bfdc058fdbc60fcb96bfbb379fab083f9af8ef9b29ef5b6adf3b6b4ecb6c8d8b7d6cdb8d9ccbddcb4a9d3a79fce9794c98388c2757dbd6a75b75c6ab15161ae4859a73e4fa12f449d253a97",
  "fce118fcdc27fcda33fcd942fcde4cfed859fddb60fbd66bf5db7cf1e092ecdc9ee8e1b3e1e0c2dce1cbd2e0d3c6dde3c1d9f1c0d8f0a7c8e999b9e08aaad97aa2d77093cb6686c35679bb4c6cb54262ad3b5ba8334fa227459d",
  "f9ec24f9eb29faeb36f9ee45f9f04df9f25cf7f06aefee82e7eb8cdee99dd8e7acd3e8bfd1e8cacde9d3c7e6d6bbe5e4b3e2f2b2e2f69edcf587d6f77dc6ee71b5e465a8dc5c97d1518bca4b7cbf3f6db63765b0365bab3050a3",
  "f6ef3cf6ef3ff5ee46f4ef4df1ec5aecec68e6e879dfe784d6e485c8df8dbedd97b5dba2b4dbafb0dab5addbc1aeddd7aadddea8dde399d8e789d7ee73d1f564cbf45aaadd549cd44889c94889c93e7dc03b6fb83664af335cab",
  "f1ec21f0eb2debe932e9e838e5e643dce453d0df60bfda67b1d66da8d3779fd07d98d08992ce988dcd9b8ecfa78dcfb38ed1c08bd1c684cfcc7acdd469cada56c8e03bc6ef39baec3ca9e13b9ad44188c83879bd3b6fb83465b1",
  "e0e320dbe127d6e12fcfdf37c8db43bad644aed24c9fcd5190c95885c65e79c46871c27170c17a6dc1836dc18370c39370c59c73c6a675c8ac6bc6b460c5bb55c4c547c3cf30c2db1bbae421a9e1289cd7378ccc317ec12c72b8",
  "c2d82dbdd630b5d333abcf39a0cc3994c93d81c24079c1436dbc455db54554b34b4db25446b75949b86950bb7357bd7b59bd7d5cbf875fc08b60c0925bc09e50c1ab46c0b337bfc327bece17b9d80faede17a5dd2395d32983c7",
  "9ec4399ac43c94c23c88bf407ebb426db34363b04454a8464fa646409e46359d4830a2482baa4b2ab14b31b45438b65d42b86447b86e49ba7251bc7652bd8549bc9045be9f39bea92fbdb729bfc61bbdd20eb2d30fa8da179fdb",
  "7ba54176a9406fa74465a24359a4454c9f454398453996452991441e89431a8b43159145159a4719a1491cab4a21b04c2cb34c33b4553ab65e3eb8653fb97039b97c33ba8a2cb99621bba11bbaac18bcbd14bcc711b7d70fb1e2"
];
const toLin = c => (c /= 255) <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const toByte = c => Math.round(Math.max(0, Math.min(1, c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)) * 255);
function hexToLab(h) {
  const [r, g, b] = [0, 2, 4].map(i => toLin(parseInt(h.slice(i, i + 2), 16)));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function labToRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return `rgb(${toByte(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)} ${toByte(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)} ${toByte(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)})`;
}
const HEX = ORIGINAL.map(row => row.match(/.{6}/g)), LAT = HEX.map(row => row.map(hexToLab)), LR = LAT.length, LC = LAT[0].length;
/* Опорная точка; за краем — продолжаем линейно, чтобы у краёв цвет не «застывал» */
function latAt(i, j, k) {
  if (i < 0) return 2 * latAt(0, j, k) - latAt(1, j, k);
  if (i > LR - 1) return 2 * latAt(LR - 1, j, k) - latAt(LR - 2, j, k);
  if (j < 0) return 2 * latAt(i, 0, k) - latAt(i, 1, k);
  if (j > LC - 1) return 2 * latAt(i, LC - 1, k) - latAt(i, LC - 2, k);
  return LAT[i][j][k];
}
const catmull = (p0, p1, p2, p3, t) => 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
function fieldColor(fy, fx) {
  const i = Math.min(Math.floor(fy), LR - 2), j = Math.min(Math.floor(fx), LC - 2), ty = fy - i, tx = fx - j;
  return labToRgb([0, 1, 2].map(k => {
    const col = [-1, 0, 1, 2].map(d => catmull(latAt(i + d, j - 1, k), latAt(i + d, j, k), latAt(i + d, j + 1, k), latAt(i + d, j + 2, k), tx));
    return catmull(col[0], col[1], col[2], col[3], ty);
  }));
}
const boardCache = {};
function board(key) {
  key = BOARDS[key] ? key : "m";
  if (boardCache[key]) return boardCache[key];
  const { cols, rows } = BOARDS[key], colors = [], same = cols === LC && rows === LR;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) colors.push(same ? "#" + HEX[r][c] : fieldColor(r * (LR - 1) / (rows - 1), c * (LC - 1) / (cols - 1)));
  return (boardCache[key] = { key, cols, rows, cells: cols * rows, colors });
}
/* Текущая палитра: у комнаты своя, на главной — обычная */
let BD = board("m");
const colOf = i => i % BD.cols, rowOf = i => Math.floor(i / BD.cols);
const isCell = v => Number.isInteger(v) && v >= 0 && v < BD.cells;
const cellName = i => ROW_L[rowOf(i)] + (colOf(i) + 1);
/* Нельзя называть основные цвета */
const BANNED = /^(красн|оранжев|ж[её]лт|зел[её]н|голуб|син(ий|яя|ее|ие|его|ей|им|ими|их|ему|юю)$|фиолетов|розов|коричнев|б[еэ]л(ый|ая|ое|ые|ого|ой|ым|ыми|ых|ому|ую)$|ч[её]рн|сер(ый|ая|ое|ые|ого|ой|ым|ыми|ых|ому|ую)$|red|orange|yellow|green|blue|purple|violet|pink|brown|white|black|gr[ae]y)/i;

const MODE_NAMES = { solo: "Каждый за себя", teams: "Команды" };
const TEAMS = ["Акварель", "Гуашь"];
const TEAM_SHORT = ["АК", "ГУ"];
const RULES = {
  solo: [
    "Каждый играет сам за себя. Ведущий по очереди выбирает цвет и даёт подсказку в одно слово, все тайно ставят фишку. Потом фишки открываются, ведущий даёт вторую подсказку до двух слов, и все ставят ещё по фишке.",
    "Точно в цвет — <b>3</b>, в рамке 3×3 вокруг — <b>2</b>, на клетку дальше рамки — <b>1</b>. Ведущий получает <b>+1</b> за каждую фишку в рамке 3×3."
  ],
  teams: [
    "Команды ходят по очереди. Ведущий даёт подсказку в одно слово, его команда двигает одну общую фишку: сдвинуть её может каждый, а встанет она, когда все нажмут «Согласен». Потом вторая подсказка до двух слов и вторая фишка.",
    "Затем соперники ставят общую фишку-перехват: если она ближе к цвету, чем обе фишки команды, соперникам <b>+1</b>. Фишки команды: точно в цвет — <b>3</b>, в рамке 3×3 — <b>2</b>, на клетку дальше — <b>1</b>. Ходов у команд поровну."
  ]
};
const PCOLORS = ["#E4572E", "#2B67C6", "#2F8F5B", "#A93A88", "#E8A317", "#139C9A", "#7B4EA3", "#8C6A43", "#D81E5B", "#4C6085"];
const MIN_LAPS = 1, MAX_LAPS = 30;

/* ---------------- Утилиты ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rnd = n => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isObj = x => x !== null && typeof x === "object" && !Array.isArray(x);
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
  let cur = null, live = false, drag = false, marks = null;
  function setBoard(bd) {
    if (cur === bd.key) return;
    cur = bd.key;
    root.style.setProperty("--cols", bd.cols);
    root.style.setProperty("--rows", bd.rows);
    root.style.setProperty("--gw", (bd.cols / (bd.rows * 1.15)).toFixed(4));
    const top = Array.from({ length: bd.cols }, (_, c) => `<span style="left:${((c + .5) / bd.cols * 100).toFixed(3)}%">${c + 1}</span>`).join("");
    const left = Array.from({ length: bd.rows }, (_, r) => `<span style="top:${((r + .5) / bd.rows * 100).toFixed(3)}%">${ROW_L[r]}</span>`).join("");
    root.innerHTML = `<div class="ax ax-top" aria-hidden="true">${top}</div><div class="ax ax-left" aria-hidden="true">${left}</div><div class="ax ax-bottom" aria-hidden="true">${top}</div><div class="ax ax-right" aria-hidden="true">${left}</div><div class="cells">${bd.colors.map(c => `<i style="background:${c}"></i>`).join("")}</div><div class="marks"></div>`;
    marks = root.querySelector(".marks");
  }
  const cellAt = e => {
    const b = marks.getBoundingClientRect(), bd = board(cur);
    const c = clamp(Math.floor((e.clientX - b.left) / b.width * bd.cols), 0, bd.cols - 1);
    const r = clamp(Math.floor((e.clientY - b.top) / b.height * bd.rows), 0, bd.rows - 1);
    return r * bd.cols + c;
  };
  root.addEventListener("pointerdown", e => {
    if (!live || !marks) return;
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
    setBoard,
    setLive(v) { live = !!v; root.classList.toggle("is-live", live); },
    setMarks(html) { if (marks && marks._h !== html) { marks.innerHTML = html; marks._h = html; } }
  };
}
const pctX = c => (c / BD.cols * 100).toFixed(3) + "%";
const pctY = r => (r / BD.rows * 100).toFixed(3) + "%";
function boxHTML(i, rad, cls) {
  const c0 = clamp(colOf(i) - rad, 0, BD.cols - 1), c1 = clamp(colOf(i) + rad, 0, BD.cols - 1);
  const r0 = clamp(rowOf(i) - rad, 0, BD.rows - 1), r1 = clamp(rowOf(i) + rad, 0, BD.rows - 1);
  return `<span class="${cls}" style="left:${pctX(c0)};top:${pctY(r0)};width:${pctX(c1 - c0 + 1)};height:${pctY(r1 - r0 + 1)}"></span>`;
}
const targetHTML = i => boxHTML(i, 2, "frame is-outer") + boxHTML(i, 1, "frame") + boxHTML(i, 0, "tgt");
/* Фишки: [{cell, color, cls}] — маленькие кружки цвета игрока. Если в клетке несколько фишек,
   они делят её сеткой 2 × 2, 3 × 3… и не залезают на соседние клетки. */
function conesHTML(list) {
  const by = {};
  list.forEach(m => { (by[m.cell] = by[m.cell] || []).push(m); });
  let html = "";
  for (const k of Object.keys(by)) {
    const g = by[k], n = g.length, side = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / side);
    const size = side === 1 ? .58 : .84 / side, last = n - side * (rows - 1);
    g.forEach((m, j) => {
      const row = Math.floor(j / side), inRow = row === rows - 1 ? last : side;
      const dx = n > 1 ? (j % side - (inRow - 1) / 2) / side : 0, dy = n > 1 ? (row - (rows - 1) / 2) / side : 0;
      const x = (colOf(m.cell) + .5 + dx) / BD.cols * 100, y = (rowOf(m.cell) + .5 + dy) / BD.rows * 100;
      html += `<span class="cone ${m.cls || ""}" style="left:${x.toFixed(3)}%;top:${y.toFixed(3)}%;--pc:${m.color};--k:${size.toFixed(3)}"></span>`;
    });
  }
  return html;
}

/* ---------------- Игровая логика ---------------- */
function dist(a, b) { return Math.max(Math.abs(colOf(a) - colOf(b)), Math.abs(rowOf(a) - rowOf(b))); }
function pointsFor(target, cell) { if (!isCell(cell)) return 0; const d = dist(target, cell); return d === 0 ? 3 : d === 1 ? 2 : d === 2 ? 1 : 0; }
function blankGame(mode, laps, size) {
  return { mode, laps, size, rounds: 0, status: "lobby", round: null, score: {}, tscore: [0, 0], turns: [0, 0], history: [] };
}
function makeRound(n, giver, team) {
  return {
    n, giver: giver || null, team: team == null ? null : team, phase: "think", clue1: "", clue2: "",
    g1: null, g2: null, sel: null, votes: null, c1: null, c2: null, steal: null, force: null, ready: null,
    target: null, results: null, giverPts: null, ta: null, tb: null, stealPt: null
  };
}
function sortedPlayers(players) {
  return players.slice().sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0) || String(a.seat).localeCompare(String(b.seat)));
}
function teamMembers(players, t) { return sortedPlayers(players).filter(p => (p.team | 0) === t); }
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
/* В командах ведущий меняется по кругу внутри команды */
function teamGiver(turns, players, team) {
  const mem = teamMembers(players, team), t = (turns || [0, 0]).slice();
  if (!mem.length) return { giver: null, turns: t };
  let giver = mem[t[team] % mem.length].seat;
  for (let k = 0; k < mem.length; k++) { const p = mem[(t[team] + k) % mem.length]; if (p.online) { giver = p.seat; break; } }
  t[team]++;
  return { giver, turns: t };
}
function roundsFor(G, players) {
  if (G.mode === "teams") return 2 * G.laps * Math.max(teamMembers(players, 0).length, teamMembers(players, 1).length);
  return G.laps * players.length;
}
function startPatch(G, players) {
  const patch = {
    status: "play", gid: Date.now().toString(36) + rnd(46656).toString(36),
    rounds: roundsFor(G, players), score: LEAF({}), tscore: [0, 0], history: []
  };
  if (G.mode === "teams") {
    const team = rnd(2), t = teamGiver([0, 0], players, team);
    patch.turns = t.turns;
    patch.round = LEAF(makeRound(1, t.giver, team));
  } else {
    patch.turns = [0, 0];
    patch.round = LEAF(makeRound(1, giverFor(1, players), null));
  }
  return patch;
}
const gameWillEnd = G => G.round.n >= G.rounds;
function nextPatch(G, players) {
  if (gameWillEnd(G)) return { status: "over" };
  const n = G.round.n + 1;
  if (G.mode === "teams") {
    const team = 1 - G.round.team, t = teamGiver(G.turns, players, team);
    return { turns: t.turns, round: LEAF(makeRound(n, t.giver, team)) };
  }
  return { round: LEAF(makeRound(n, giverFor(n, players), null)) };
}
function revealPatch(G, target) {
  const r = G.round;
  if (G.mode === "teams") {
    const a = pointsFor(target, r.c1), b = pointsFor(target, r.c2), steal = isCell(r.sel) ? r.sel : null;
    const near = Math.min(isCell(r.c1) ? dist(target, r.c1) : 99, isCell(r.c2) ? dist(target, r.c2) : 99);
    const stealPt = steal != null && dist(target, steal) < near ? 1 : 0;
    const t = G.tscore.slice();
    t[r.team] += a + b;
    t[1 - r.team] += stealPt;
    const entry = { n: r.n, team: r.team, giver: r.giver, target, clue1: r.clue1, clue2: r.clue2, ta: a, tb: b, stealPt, steal };
    return {
      round: { target, phase: "result", ta: a, tb: b, steal, stealPt, sel: null, votes: null, ready: null },
      tscore: t,
      history: (G.history || []).concat([entry]).slice(-60)
    };
  }
  const g1 = r.g1 || {}, g2 = r.g2 || {}, score = Object.assign({}, G.score || {}), results = {};
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
    history: (G.history || []).concat([entry]).slice(-60)
  };
}
/* Карточка ведущего: четыре цвета подальше друг от друга и от прошлых целей */
function drawCard(G) {
  const used = new Set((G.history || []).map(h => h.target));
  const out = [];
  for (let tries = 0; out.length < 4 && tries < 3000; tries++) {
    const c = rnd(BD.cells);
    if (used.has(c) || out.some(x => dist(x, c) < 4)) continue;
    out.push(c);
  }
  while (out.length < 4) out.push(rnd(BD.cells));
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
  sel: null, localSel: null, stepKey: null, advKey: null,
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
const phaseKey = G => rKey(G) + ":" + (G && G.round ? G.round.phase : "");
const myPlayer = () => S.players.find(p => p.seat === S.seat) || null;
const nameOf = seat => { const p = S.players.find(x => x.seat === seat); return (p && p.name) || "Игрок"; };
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
const teamColor = t => `var(--team${t ? 1 : 0})`;
const isTeams = G => !!G && G.mode === "teams";
const guessKey = ph => ph === "guess2" ? "g2" : "g1";
const SHARED = { guess1: 1, guess2: 1, steal: 1 };
/* Кто сейчас двигает общую фишку и голосует (только «Команды») */
function voters(G) {
  const r = G.round;
  if (!isTeams(G) || !r || !SHARED[r.phase]) return [];
  if (r.phase === "steal") return teamMembers(S.players, 1 - r.team).map(p => p.seat);
  return teamMembers(S.players, r.team).map(p => p.seat).filter(s => s !== r.giver);
}
/* Можно ли поставить фишку на клетку c: "" — можно, иначе причина */
function cellProblem(G, c) {
  const r = G.round;
  if (!isCell(c)) return "none";
  if (isTeams(G)) {
    if ((r.phase === "guess2" || r.phase === "steal") && c === r.c1) return "busy";
    if (r.phase === "steal" && c === r.c2) return "busy";
    return "";
  }
  if (r.phase === "guess2") {
    if (Object.values(r.g1 || {}).some(x => x === c)) return "busy";
  }
  return "";
}
/* Кто ещё должен ответить и выполнено ли условие. Учитываем только тех, кто сейчас в сети. */
function roundStatus(G) {
  const r = G.round, on = s => S.online.has(s);
  const out = { req: [], done: [], ready: false };
  if (!r) return out;
  if (isTeams(G) && SHARED[r.phase]) {
    out.req = voters(G).filter(on);
    out.done = out.req.filter(s => r.votes && r.votes[s]);
    const ok = !cellProblem(G, r.sel);
    out.ready = ok && out.req.length > 0 && (out.done.length === out.req.length || (r.force === r.phase && out.done.length > 0));
    if (r.phase === "steal" && out.req.length === 0) out.ready = true;
  } else if (r.phase === "guess1" || r.phase === "guess2") {
    const g = r[guessKey(r.phase)] || {};
    out.req = S.players.map(p => p.seat).filter(s => s !== r.giver).filter(on);
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
    const G = blankGame("solo", 2, "m");
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
    const ts = await S.db.ref(`hues/rooms/${code}/game/teams`).get();
    const teams = (ts.exists() && ts.val()) || {};
    if (teams[S.uid] == null) {
      const c = [0, 0];
      Object.keys(teams).forEach(k => { c[teams[k] === 1 ? 1 : 0]++; });
      await S.db.ref(`hues/rooms/${code}/game/teams/${S.uid}`).set(c[0] <= c[1] ? 0 : 1);
    }
    if (S.hashCode) { S.hashCode = null; try { history.replaceState(null, "", location.pathname + location.search); } catch {} }
    enterRoom(code);
  } catch (e) { toast(writeErr(e)); }
}
function enterRoom(code) {
  leaveSubs();
  Object.assign(S, { mode: "online", code, game: null, players: [], playersRaw: {}, online: new Set(), sel: null, localSel: null });
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
const ROUND_DEFAULTS = makeRound(0, null, null);
function arr(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") return Object.keys(x).sort((a, b) => a - b).map(k => x[k]);
  return [];
}
/* Firebase не хранит пустые массивы и null — возвращаем игре привычную форму */
function normGame(v) {
  const G = Object.assign({ mode: "solo", laps: 2, size: "m", rounds: 0, status: "lobby" }, v);
  if (!MODE_NAMES[G.mode]) G.mode = "solo";
  if (!BOARDS[G.size]) G.size = "m";
  G.score = isObj(v.score) ? v.score : {};
  const ts = arr(v.tscore), tu = arr(v.turns);
  G.tscore = [ts[0] || 0, ts[1] || 0];
  G.turns = [tu[0] || 0, tu[1] || 0];
  G.teams = v.teams || {};
  G.history = arr(v.history).filter(Boolean);
  G.round = v.round ? Object.assign({}, ROUND_DEFAULTS, v.round) : null;
  return G;
}
function buildPlayers() {
  const raw = S.playersRaw || {}, teams = (S.game && S.game.teams) || {};
  S.players = Object.keys(raw).filter(k => raw[k] && raw[k].name).map(k => ({
    seat: k, name: String(raw[k].name).slice(0, 24), joinedAt: raw[k].joinedAt || 0,
    team: teams[k] === 1 ? 1 : 0, online: raw[k].online === true
  }));
  S.online = new Set(S.players.filter(p => p.online).map(p => p.seat));
}
function onGame(G) {
  const prev = S.game;
  S.game = G;
  BD = board(G.size);
  buildPlayers();
  const r = G.round;
  if (!prev || !prev.round || !r || prev.round.n !== r.n || prev.gid !== G.gid || prev.status !== G.status) resetRoundUI();
  else if (prev.round.phase !== r.phase) { S.sel = null; S.localSel = null; S.drafts.clue = ""; }
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
  BD = board("m");
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
      [`hues/rooms/${code}/game/teams/${uid}`]: null,
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
/* Ведущий ведёт раунд: фиксирует фишки, открывает первый круг и считает очки — только у него есть цель. */
function tick() {
  const G = S.game;
  if (S.mode !== "online" || !G || G.status !== "play" || !G.round) return;
  const r = G.round, st = roundStatus(G), teams = isTeams(G);
  if (r.giver === S.uid && st.ready) {
    const key = phaseKey(G);
    if (S.stepKey !== key) {
      if (r.phase === "guess1") {
        S.stepKey = key;
        commit({ round: teams ? { c1: r.sel, sel: null, votes: null, phase: "clue2", force: null } : { phase: "clue2", force: null } });
      } else if (r.phase === "guess2" && teams) {
        S.stepKey = key;
        commit({ round: { c2: r.sel, sel: null, votes: null, phase: "steal", force: null } });
      } else if ((r.phase === "guess2" || r.phase === "steal") && getSecret(G) != null) {
        S.stepKey = key;
        setTimeout(() => {
          const G2 = S.game;
          if (S.mode !== "online" || !G2 || !G2.round || phaseKey(G2) !== key) { S.stepKey = null; return; }
          const t = getSecret(G2);
          if (!roundStatus(G2).ready || t == null) { S.stepKey = null; render(); return; }
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
  S.drafts.clue = ""; S.sel = null; S.localSel = null;
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
/* «Каждый за себя»: можно ли мне сейчас ставить свою фишку */
function myTurn(G) {
  const r = G && G.round;
  if (!r || isTeams(G) || (r.phase !== "guess1" && r.phase !== "guess2") || r.giver === S.uid || !myPlayer()) return false;
  const g = r[guessKey(r.phase)] || {};
  return !isCell(g[S.uid]);
}
/* «Команды»: могу ли я двигать общую фишку */
function canMoveShared(G) {
  const r = G && G.round;
  return !!r && isTeams(G) && !!SHARED[r.phase] && voters(G).includes(S.uid) && !roundStatus(G).ready;
}
const canPoint = G => myTurn(G) || canMoveShared(G);
/* Общая фишка: своё последнее движение показываем сразу, не дожидаясь базы */
function sharedSel(G) { return S.localSel && S.localSel.k === phaseKey(G) ? S.localSel.v : G.round.sel; }
function currentSel(G) { return isTeams(G) ? sharedSel(G) : S.sel; }
function pickCell(c) {
  const G = S.game;
  if (myTurn(G)) { S.sel = c; render(); return; }
  if (!canMoveShared(G) || sharedSel(G) === c) return;
  const ls = S.localSel = { k: phaseKey(G), v: c };
  commit({ round: { sel: c, votes: null } }).then(() => { if (S.localSel === ls) { S.localSel = null; render(); } });
  render();
}

const ACT = {
  home() { if (!S.mode) window.scrollTo(0, 0); },
  create() { createRoom(); },
  join() { joinRoom(S.drafts.code); },
  joinRoom(arg) { joinRoom(arg); },
  setMode(arg) {
    const G = S.game; if (!G || G.status !== "lobby" || !isAdmin(G) || !MODE_NAMES[arg]) return;
    if (G.mode !== arg) commit({ mode: arg });
  },
  setSize(arg) {
    const G = S.game; if (!G || G.status !== "lobby" || !isAdmin(G) || !BOARDS[arg]) return;
    if (G.size !== arg) commit({ size: arg });
  },
  laps(arg) {
    const G = S.game; if (!G || G.status !== "lobby" || !isAdmin(G)) return;
    const n = clamp((G.laps || 2) + (+arg || 0), MIN_LAPS, MAX_LAPS);
    if (n !== G.laps) commit({ laps: n });
  },
  start() {
    const G = S.game; if (!G || G.status !== "lobby" || !isAdmin(G)) return;
    if (isTeams(G)) { if (teamMembers(S.players, 0).length < 2 || teamMembers(S.players, 1).length < 2) return toast("В каждой команде нужно минимум 2 игрока"); }
    else if (S.players.length < 2) return toast("Нужно минимум 2 игрока");
    resetRoundUI();
    commit(startPatch(G, S.players));
  },
  async switchTeam() {
    const me = myPlayer(); if (!me || !S.game || S.game.status !== "lobby") return;
    try { await S.db.ref(`hues/rooms/${S.code}/game/teams/${S.uid}`).set(me.team === 1 ? 0 : 1); } catch (e) { toast(writeErr(e)); }
  },
  shuffle() {
    const G = S.game; if (!G || G.status !== "lobby" || !isAdmin(G)) return;
    const list = S.players.slice();
    for (let i = list.length - 1; i > 0; i--) { const j = rnd(i + 1); [list[i], list[j]] = [list[j], list[i]]; }
    const teams = {};
    list.forEach((p, i) => { teams[p.seat] = i % 2; });
    commit({ teams: LEAF(teams) }).then(() => toast("Команды перемешаны"));
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
    commit({ round: { clue1: clue, phase: "guess1", g1: null, g2: null, sel: null, votes: null, force: null } });
  },
  submitClue2() {
    const G = S.game; if (!G || !G.round || G.round.phase !== "clue2" || G.round.giver !== S.uid) return;
    const clue = words(S.drafts.clue).join(" ").slice(0, 40), bad = clueProblem(clue, 2);
    if (bad) return toast(bad);
    S.drafts.clue = "";
    commit({ round: { clue2: clue, phase: "guess2", sel: null, votes: null, force: null } });
  },
  nudge(arg) {
    const G = S.game; if (!canPoint(G)) return;
    const d = { l: [-1, 0], r: [1, 0], u: [0, -1], d: [0, 1] }[arg]; if (!d) return;
    const s = currentSel(G), cur = isCell(s) ? s : Math.floor(BD.rows / 2) * BD.cols + Math.floor(BD.cols / 2);
    const c = clamp(colOf(cur) + d[0], 0, BD.cols - 1), r = clamp(rowOf(cur) + d[1], 0, BD.rows - 1);
    pickCell(r * BD.cols + c);
  },
  place() {
    const G = S.game; if (!myTurn(G) || !isCell(S.sel)) return;
    if (cellProblem(G, S.sel)) return toast("Эта клетка занята фишкой первого круга");
    const r = G.round;
    if (r.phase === "guess2" && r.g1 && r.g1[S.uid] === S.sel) return toast("Вторая фишка не может стоять там же, где первая");
    commit({ round: { [guessKey(r.phase)]: { [S.uid]: S.sel } } });
  },
  unplace() {
    const G = S.game, r = G && G.round; if (!r || isTeams(G) || (r.phase !== "guess1" && r.phase !== "guess2")) return;
    const k = guessKey(r.phase), v = r[k] && r[k][S.uid];
    if (isCell(v)) S.sel = v;
    commit({ round: { [k]: { [S.uid]: null } } });
  },
  /* «Команды»: «Согласен» / «Отменить согласие» */
  vote() {
    const G = S.game, r = G && G.round; if (!r || !isTeams(G) || !SHARED[r.phase] || !voters(G).includes(S.uid)) return;
    if (r.votes && r.votes[S.uid]) { commit({ round: { votes: { [S.uid]: null } } }); return; }
    if (cellProblem(G, sharedSel(G))) return toast("Сначала поставьте фишку на свободную клетку");
    commit({ round: { votes: { [S.uid]: true } } });
  },
  force() { const G = S.game; if (G && isAdmin(G) && G.round && (/^guess/.test(G.round.phase) || G.round.phase === "steal")) commit({ round: { force: G.round.phase } }); },
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
      const history = (G2.history || []).concat([{ n: r.n, giver: r.giver, team: r.team, clue1: r.clue1, clue2: r.clue2, skipped: true }]).slice(-60);
      resetRoundUI();
      commit(Object.assign(nextPatch(G2, S.players), { history }));
    });
  },
  leave() { confirmable("leave", () => leaveRoom()); },
  again() {
    const G = S.game; if (!G || !isAdmin(G)) return;
    resetRoundUI();
    commit({ status: "lobby", round: null, score: null, tscore: null, turns: null, history: [] });
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
  $(".app").classList.toggle("is-wide", view === "vGame");
  if (S.view !== view) { S.view = view; window.scrollTo(0, 0); keepAwake(view === "vGame"); }
}
const msg = html => `<p class="msg">${html}</p>`;
const sw = (i, cls) => `<span class="sw${cls ? " " + cls : ""}" style="background:${BD.colors[i]}"></span>`;
const segBtn = (act, arg, label, on) => `<button type="button" data-act="${act}" data-arg="${esc(arg)}" aria-pressed="${on ? "true" : "false"}">${esc(label)}</button>`;
const stepper = n => `<div class="stepper" role="group" aria-label="Сколько раз каждый ведёт"><button type="button" data-act="laps" data-arg="-1" aria-label="Меньше"${n <= MIN_LAPS ? " disabled" : ""}>−</button><output aria-live="polite">${n}</output><button type="button" data-act="laps" data-arg="1" aria-label="Больше"${n >= MAX_LAPS ? " disabled" : ""}>+</button></div>`;
const teamName = t => `«${TEAMS[t]}»`;

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
  if (S.mode === "online" && G && G.round && G.status === "play") {
    const roundChip = `<span class="chip">${Math.min(G.round.n, G.rounds)}/${G.rounds}</span>`;
    if (isTeams(G)) html = [0, 1].map(t => `<span class="chip t${t}${G.round.team === t ? " is-active" : ""}" title="${TEAMS[t]}"><span class="tdot"></span>${TEAM_SHORT[t]} <b>${G.tscore[t]}</b></span>`).join("") + roundChip;
    else html = `<span class="chip">Вы <b>${(G.score || {})[S.uid] || 0}</b></span>${roundChip}`;
  } else if (S.mode === "online" && S.code) html = `<span class="chip">${esc(S.code)}</span>`;
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
  if (isTeams(G) && SHARED[r.phase]) return r.votes && r.votes[seat] ? "✓" : "";
  if (r.phase === "guess1" || r.phase === "guess2") { const g = r[guessKey(r.phase)]; return g && isCell(g[seat]) ? "✓" : ""; }
  if (r.phase === "result") return r.ready && r.ready[seat] ? "✓" : "";
  return "";
}
function playerTags(G, seat) {
  const r = G && G.round, tags = [];
  if (seat === S.uid) tags.push("вы");
  if (G && G.status === "play" && r && r.giver === seat) tags.push("ведущий");
  if (G && adminSeat(G) === seat) tags.push("админ");
  return tags.map(t => `<span class="tag">${t}</span>`).join("");
}
const playerDot = (G, p) => isTeams(G) ? `<span class="tdot t${p.team}"></span>` : `<span class="cdot" style="background:${colorOf(p.seat)}"></span>`;
function plChip(p, G) {
  const score = G && G.status !== "lobby" && !isTeams(G) ? `<span class="sc">${(G.score || {})[p.seat] || 0}</span>` : "";
  const mk = chipMark(G, p.seat);
  return `<span class="pl${p.online ? "" : " is-off"}" title="${p.online ? "в сети" : "не в сети"}">${playerDot(G, p)}<span class="nm">${esc(p.name || "Игрок")}</span>${playerTags(G, p.seat)}${score}${mk ? `<span class="mk">${mk}</span>` : ""}</span>`;
}

/* Лобби комнаты */
function renderLobby() {
  show("vLobby");
  const G = S.game, admin = isAdmin(G), adminName = nameOf(adminSeat(G)), teams = isTeams(G);
  const players = sortedPlayers(S.players), n = players.length, laps = G.laps || 2;
  let canStart, why = "";
  if (teams) { canStart = teamMembers(S.players, 0).length >= 2 && teamMembers(S.players, 1).length >= 2; if (!canStart) why = "В каждой команде нужно минимум 2 игрока."; }
  else { canStart = n >= 2; if (!canStart) why = "Нужно минимум 2 игрока. Позовите кого-нибудь в комнату."; }
  const total = roundsFor(G, S.players);
  if (S.drafts.nick == null || S.drafts.nick === "") S.drafts.nick = (myPlayer() && myPlayer().name) || S.nick;
  const playersBlock = teams
    ? `<div class="teams">${[0, 1].map(t => { const mem = teamMembers(S.players, t); return `<div class="team t${t}"><div class="team-name"><span class="tdot"></span>${TEAMS[t]}</div>${mem.map(p => plChip(p, G)).join("") || `<span class="msg small">пока никого</span>`}</div>`; }).join("")}</div>
       <div class="row"><button class="btn" type="button" data-act="switchTeam"${myPlayer() ? "" : " disabled"}>Сменить команду</button>${admin ? `<button class="btn" type="button" data-act="shuffle">Перемешать</button>` : ""}</div>`
    : `<div class="players">${players.map(p => plChip(p, G)).join("")}</div>`;
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
      <h2>Режим</h2>
      ${admin
        ? `<div class="seg" role="group" aria-label="Режим">${["solo", "teams"].map(m => segBtn("setMode", m, MODE_NAMES[m], G.mode === m)).join("")}</div>`
        : `<p class="mode-name">${MODE_NAMES[G.mode]}</p>`}
      ${RULES[G.mode].map(t => msg(t)).join("")}
    </div>
    <div class="panel">
      <h2>Палитра и раунды</h2>
      ${admin
        ? `<div class="seg" role="group" aria-label="Палитра">${Object.keys(BOARDS).map(k => segBtn("setSize", k, BOARDS[k].name, G.size === k)).join("")}</div>`
        : `<p class="mode-name">${BOARDS[G.size].name}</p>`}
      ${msg(BOARDS[G.size].hint)}
      ${admin
        ? `<div class="setting"><span class="label">Сколько раз каждый будет ведущим</span>${stepper(laps)}</div>`
        : `<p class="msg">Каждый будет ведущим: <b>${laps}</b> ${plural(laps, "раз", "раза", "раз")}</p>`}
      ${total > 0 ? `<p class="msg small">Всего раундов: <b>${total}</b>${teams ? ` — по ${total / 2} на команду` : ""}</p>` : ""}
      ${admin ? "" : `<p class="msg small">Настройки меняет админ — ${esc(adminName)}.</p>`}
    </div>
    <div class="panel">
      <h2>Игроки · ${n}</h2>
      ${playersBlock}
    </div>
    ${admin
      ? `${why ? msg(why) : ""}<button class="btn btn-primary btn-block" type="button" data-act="start"${canStart ? "" : " disabled"}>Начать игру</button>`
      : msg(`Игру начнёт <b>${esc(adminName)}</b>.${why ? " " + why : ""}`)}
    <button class="btn-quiet" type="button" data-act="leave">${confirmLabel("leave", "Выйти из комнаты")}</button>`);
}

/* Раунд */
function cone(seat, cell, extra) { return { cell, color: colorOf(seat), cls: extra || "" }; }
const tcone = (team, cell, extra) => ({ cell, color: teamColor(team), cls: extra || "" });
function gridMarks(G, secret) {
  const r = G.round, k = rKey(G), giver = r.giver === S.uid, cones = [];
  let marks = "";
  if (r.phase === "result") marks += targetHTML(r.target);
  else {
    if (giver && r.phase === "think" && S.ui.card && S.ui.cardKey === k) {
      S.ui.card.forEach((c, i) => {
        marks += `<span class="cand${S.ui.pick === i ? " is-on" : ""}" style="left:${((colOf(c) + .5) / BD.cols * 100).toFixed(3)}%;top:${((rowOf(c) + .5) / BD.rows * 100).toFixed(3)}%">${i + 1}</span>`;
      });
    }
    if (giver && secret != null && r.phase !== "think") marks += boxHTML(secret, 1, "frame") + boxHTML(secret, 0, "tgt");
  }
  /* Пока выбирают после второй подсказки, уже стоящие фишки полупрозрачные — не мешают разглядеть цвета */
  const fade = r.phase === "guess2" || r.phase === "steal" ? "is-faded" : "";
  if (isTeams(G)) {
    if (isCell(r.c1)) cones.push(tcone(r.team, r.c1, fade));
    if (isCell(r.c2)) cones.push(tcone(r.team, r.c2, fade));
    if (r.phase === "result" && isCell(r.steal)) cones.push(tcone(1 - r.team, r.steal));
    if (SHARED[r.phase]) {
      const s = sharedSel(G);
      if (isCell(s)) cones.push(tcone(r.phase === "steal" ? 1 - r.team : r.team, s, "is-ghost" + (canMoveShared(G) ? " is-sel" : "")));
    }
  } else {
    const g1 = r.g1 || {}, g2 = r.g2 || {};
    if (r.phase === "result") {
      Object.keys(g1).forEach(u => { if (isCell(g1[u])) cones.push(cone(u, g1[u])); });
      Object.keys(g2).forEach(u => { if (isCell(g2[u])) cones.push(cone(u, g2[u])); });
    } else {
      /* Первые фишки видны всем после первого круга; свои — всегда */
      const showAll1 = r.phase === "clue2" || r.phase === "guess2";
      Object.keys(g1).forEach(u => { if (isCell(g1[u]) && (showAll1 || u === S.uid)) cones.push(cone(u, g1[u], fade)); });
      if (isCell(g2[S.uid])) cones.push(cone(S.uid, g2[S.uid]));
      if (myTurn(G) && isCell(S.sel)) cones.push(cone(S.uid, S.sel, "is-ghost is-sel"));
    }
  }
  return marks + conesHTML(cones);
}
function renderGame() {
  show("vGame");
  const G = S.game, r = G.round, k = rKey(G), giver = r.giver === S.uid, teams = isTeams(G);
  if (giver && r.phase !== "think" && getSecret(G) == null && S.secretChecked !== k) loadSecret(G);
  const secret = getSecret(G), st = roundStatus(G);

  setHTML($("#gHead"), `<div class="eyebrow">Раунд ${r.n} из ${G.rounds}${teams ? ` · ход ${teamName(r.team)}` : ""}</div><div class="who">Ведущий: <b>${giver ? "вы" : esc(nameOf(r.giver))}</b></div>`);

  let clues = "";
  if (r.clue1) clues += `<div class="clue${r.clue2 ? " is-old" : ""}"><small>Подсказка 1</small>«${esc(r.clue1)}»</div>`;
  if (r.clue2) clues += `<div class="clue"><small>Подсказка 2</small>«${esc(r.clue2)}»</div>`;
  setHTML($("#gClue"), clues);
  $("#gClue").hidden = !clues;

  gridG.setBoard(BD);
  gridG.setMarks(gridMarks(G, secret));
  gridG.setLive(canPoint(G));

  setHTML($("#gPanel"), teams ? teamsPanelHTML(G, st) : panelHTML(G, st));
  setHTML($("#gBoard"), boardHTML(G));
  setHTML($("#gPlayers"), `<div class="players">${sortedPlayers(S.players).map(p => plChip(p, G)).join("")}</div>`);
  setHTML($("#gFoot"), (r.phase !== "result" && canSkip(G) ? `<button class="btn-quiet" type="button" data-act="skip">${confirmLabel("skip", "Пропустить раунд")}</button>` : "")
    + `<button class="btn-quiet" type="button" data-act="leave">${confirmLabel("leave", "Выйти из комнаты")}</button>`);
}
/* Боковая таблица (на широком экране) */
function boardHTML(G) {
  if (isTeams(G)) {
    return [0, 1].map(t => `<div class="side-team t${t}${G.round && G.round.team === t ? " is-active" : ""}">
      <div class="side-team-head"><span class="tdot"></span><span class="side-team-name">${TEAMS[t]}</span><span class="side-team-score">${G.tscore[t]}</span></div>
      ${teamMembers(S.players, t).map(p => sideRow(G, p, "")).join("") || `<span class="msg small">пока никого</span>`}
    </div>`).join("");
  }
  const sc = G.score || {};
  const rows = sortedPlayers(S.players).map(p => ({ p, s: sc[p.seat] || 0 })).sort((a, b) => b.s - a.s);
  return `<h2>Таблица</h2>` + rows.map((x, i) => sideRow(G, x.p, x.s, i + 1)).join("");
}
function sideRow(G, p, score, rank) {
  const mk = chipMark(G, p.seat);
  return `<div class="side-row${p.seat === S.uid ? " is-me" : ""}${p.online ? "" : " is-off"}">${rank ? `<span class="rank">${rank}</span>` : ""}${playerDot(G, p)}<span class="who">${esc(p.name)}</span>${playerTags(G, p.seat)}${mk ? `<span class="mk">${mk}</span>` : ""}${score !== "" ? `<span class="val">${score}</span>` : ""}</div>`;
}
function giverAway(G, text) {
  const r = G.round;
  if (S.online.has(r.giver) || r.giver === S.uid) return msg(text);
  return msg(`${text} Но ведущий <b>${esc(nameOf(r.giver))}</b> сейчас не в сети.`) + (isAdmin(G) ? `<button class="btn btn-block" type="button" data-act="skip">${confirmLabel("skip", "Пропустить раунд")}</button>` : "");
}
function pickbarHTML(G, sel) {
  const bad = sel != null && cellProblem(G, sel);
  return `<div class="pickbar">${sel != null ? `${sw(sel, "sw-lg")}<span class="cellname">${cellName(sel)}</span>${bad ? `<span class="status">занято</span>` : ""}` : `<span class="status">Клетка не выбрана</span>`}</div>`;
}
const dpad = (act, label, primary, disabled) => `<div class="row dpad"><button class="btn" type="button" data-act="nudge" data-arg="l" aria-label="Левее">←</button><button class="btn" type="button" data-act="nudge" data-arg="u" aria-label="Выше">↑</button><button class="btn${primary ? " btn-primary" : ""} grow" type="button" data-act="${act}"${disabled ? " disabled" : ""}>${label}</button><button class="btn" type="button" data-act="nudge" data-arg="d" aria-label="Ниже">↓</button><button class="btn" type="button" data-act="nudge" data-arg="r" aria-label="Правее">→</button></div>`;
const keysHint = `<p class="status keys-hint">Стрелки на клавиатуре двигают фишку, Enter — подтвердить.</p>`;
function thinkHTML(G) {
  const r = G.round, k = rKey(G);
  if (r.giver !== S.uid) return giverAway(G, `<b>${esc(nameOf(r.giver))}</b>${isTeams(G) ? ` (${teamName(r.team)})` : ""} выбирает цвет и придумывает подсказку<span class="dots"></span>`);
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
function clue2HTML(G, waitText) {
  const r = G.round;
  if (r.giver !== S.uid) return giverAway(G, waitText);
  const bad = S.drafts.clue.trim() ? clueProblem(S.drafts.clue, 2) : "";
  return msg("Дайте вторую подсказку — не больше двух слов, — чтобы подвести ближе к цвету.")
    + `<div class="field"><label for="clueInput">Подсказка — до двух слов</label><input id="clueInput" data-draft="clue" type="text" maxlength="40" autocomplete="off" placeholder="Например: спелый апельсин"></div>
    <p class="status" id="clueWarn">${esc(bad)}</p>
    <button class="btn btn-primary btn-block" id="clueSubmit" type="button" data-act="submitClue2"${S.drafts.clue.trim() && !bad ? "" : " disabled"}>Отправить подсказку</button>`;
}
function forceBtn(G, st) {
  const r = G.round;
  return isAdmin(G) && st.done.length > 0 && st.done.length < st.req.length && r.force !== r.phase ? `<button class="btn-quiet" type="button" data-act="force">Не ждать остальных</button>` : "";
}
function readyHTML(G, st) {
  const r = G.round, iReady = r.ready && r.ready[S.uid];
  const label = iReady ? "Отменить готовность" : (gameWillEnd(G) ? "Готов — к итогам" : "Готов к следующему раунду");
  const status = st.ready ? msg(`Все готовы<span class="dots"></span>`) : `<p class="status">Готовы <b>${st.done.length} из ${st.req.length}</b></p>`;
  return `<button class="btn${iReady ? "" : " btn-primary"} btn-block" type="button" data-act="ready">${label}</button>` + status;
}
/* Панель «Каждый за себя» */
function panelHTML(G, st) {
  const r = G.round, giver = r.giver === S.uid;
  if (r.phase === "think") return thinkHTML(G);
  if (r.phase === "guess1" || r.phase === "guess2") {
    const second = r.phase === "guess2";
    const stat = `<p class="status">Поставили <b>${st.done.length} из ${st.req.length}</b></p>`, force = forceBtn(G, st);
    if (st.ready) return giverAway(G, second ? `Все поставили. Считаем очки<span class="dots"></span>` : `Все поставили. Открываем фишки<span class="dots"></span>`);
    if (giver) return msg(second ? "Игроки ставят вторые фишки." : "Игроки ставят фишки. Их увидят все, когда ответит каждый.") + stat + force;
    if (!myPlayer()) return msg("Игроки ставят фишки.") + stat;
    const g = r[guessKey(r.phase)] || {};
    if (isCell(g[S.uid])) return `<p class="msg pickbar">Фишка стоит на ${sw(g[S.uid])} <b class="cellname">${cellName(g[S.uid])}</b>. Ждём остальных.</p>`
      + `<button class="btn btn-block" type="button" data-act="unplace">Передвинуть фишку</button>` + stat + force;
    const sel = isCell(S.sel) ? S.sel : null;
    const blocked = sel != null && (!!cellProblem(G, sel) || (second && r.g1 && r.g1[S.uid] === sel));
    return msg(second ? "Поставьте вторую фишку. Нельзя ставить на клетку, где уже стоит фишка." : "Нажмите на цвет, который подходит к подсказке. Фишку никто не увидит, пока не ответят все.")
      + pickbarHTML(G, sel) + dpad("place", "Поставить", true, sel == null || blocked) + keysHint + stat + force;
  }
  if (r.phase === "clue2") return clue2HTML(G, `Все фишки открыты. <b>${esc(nameOf(r.giver))}</b> придумывает вторую подсказку<span class="dots"></span>`);
  const res = r.results || {};
  const rows = Object.keys(res).map(u => ({ u, a: res[u].a || 0, b: res[u].b || 0 })).sort((x, y) => (y.a + y.b) - (x.a + x.b));
  const mine = res[S.uid];
  const title = giver ? `Вы ведущий: +${r.giverPts || 0}` : (mine ? `Вам +${(mine.a || 0) + (mine.b || 0)}` : "Итоги раунда");
  return `<div class="pickbar">${sw(r.target, "sw-lg")}<div><div class="res-title">${title}</div><span class="status">Цвет <b>${cellName(r.target)}</b></span></div></div>
    <div class="board">${rows.map(x => `<div class="board-row${x.u === S.uid ? " is-me" : ""}"><span class="rank"></span><span class="cdot" style="background:${colorOf(x.u)}"></span><span class="who">${esc(nameOf(x.u))}</span><span class="val"><small>${x.a} + ${x.b}</small>+${x.a + x.b}</span></div>`).join("") || msg("Никто не успел поставить фишку.")}</div>
    ${msg(`Ведущий <b>${esc(nameOf(r.giver))}</b> получает +${r.giverPts || 0} — по очку за каждую фишку в рамке 3×3.`)}` + readyHTML(G, st);
}
/* Панель «Команды» */
function teamsPanelHTML(G, st) {
  const r = G.round, giver = r.giver === S.uid, me = myPlayer(), mine = me && me.team === r.team;
  const act = teamName(r.team), opp = teamName(1 - r.team);
  if (r.phase === "think") return thinkHTML(G);
  if (r.phase === "clue2") return clue2HTML(G, `Первая фишка стоит. <b>${esc(nameOf(r.giver))}</b> придумывает вторую подсказку<span class="dots"></span>`);
  if (SHARED[r.phase]) {
    const steal = r.phase === "steal";
    const stat = `<p class="status">Согласны <b>${st.done.length} из ${st.req.length}</b></p>`, force = forceBtn(G, st);
    if (st.ready) return giverAway(G, steal ? `Перехват стоит. Считаем очки<span class="dots"></span>` : `Команда договорилась. Ставим фишку<span class="dots"></span>`);
    if (canMoveShared(G)) {
      const sel = sharedSel(G), s = isCell(sel) ? sel : null, voted = r.votes && r.votes[S.uid];
      const text = steal
        ? `Перехват! Договоритесь с командой и поставьте одну общую фишку. Если она окажется ближе к цвету, чем обе фишки ${act}, вы получите +1.`
        : `Двигайте общую фишку команды — её видят все. Когда все нажмут «Согласен», она встанет. Любой сдвиг сбрасывает согласия.${r.phase === "guess2" ? " На клетку первой фишки ставить нельзя." : ""}`;
      return msg(text) + pickbarHTML(G, s)
        + dpad("vote", voted ? "Отменить согласие" : "Согласен", !voted, !voted && (s == null || !!cellProblem(G, s))) + keysHint + stat + force;
    }
    if (steal) return msg(mine || giver ? `Соперники ${opp} ставят фишку-перехват. Если она окажется ближе к цвету, чем обе ваши, им +1.` : `Ваша команда ставит перехват.`) + stat + force;
    if (giver) return msg(`Ваша команда ставит ${r.phase === "guess2" ? "вторую" : "первую"} фишку. Вы видите цвет — держите лицо.`) + stat + force;
    return msg(`Команда ${act} ставит ${r.phase === "guess2" ? "вторую" : "первую"} фишку. Следите: потом ваша команда поставит перехват.`) + stat + force;
  }
  /* Итог */
  const a = r.ta || 0, b = r.tb || 0;
  const stealLine = r.steal == null ? `${opp} не ставили перехват.` : r.stealPt ? `Перехват ${opp} ближе к цвету: <b>+1</b> соперникам.` : `Перехват ${opp} не ближе фишек команды — без очков.`;
  return `<div class="result"><div class="pts${a + b ? "" : " is-zero"}">${a + b ? "+" + (a + b) : "0"}</div><div><div class="res-title">Команде ${act}</div><p class="msg">Фишки: ${a} + ${b}</p></div></div>
    <div class="pickbar">${sw(r.target, "sw-lg")}<span class="status">Цвет <b>${cellName(r.target)}</b></span></div>
    ${msg(stealLine)}` + readyHTML(G, st);
}

/* Итоги */
function renderOver() {
  show("vOver");
  const G = S.game, teams = isTeams(G);
  let head;
  if (teams) {
    const [a, b] = G.tscore;
    head = `<div class="hero"><div class="eyebrow">Игра окончена</div><h1>${a === b ? "Ничья" : `Победили ${teamName(a > b ? 0 : 1)}`}</h1><p class="big-score"><span class="t0">${a}</span> : <span class="t1">${b}</span></p></div>`;
  } else {
    const sc = G.score || {};
    const rows = sortedPlayers(S.players).map(p => ({ p, s: sc[p.seat] || 0 })).sort((x, y) => y.s - x.s);
    const best = rows.length ? rows[0].s : 0, top = rows.filter(x => x.s === best).map(x => esc(x.p.name));
    head = `<div class="hero"><div class="eyebrow">Игра окончена</div><h1>${top.length > 1 ? `Ничья: ${top.join(" и ")}` : `Победа: ${top[0] || "—"}`}</h1></div>
      <div class="board">${rows.map((x, i) => `<div class="board-row${x.p.seat === S.uid ? " is-me" : ""}"><span class="rank">${i + 1}</span><span class="cdot" style="background:${colorOf(x.p.seat)}"></span><span class="who">${esc(x.p.name)}</span><span class="val">${x.s}</span></div>`).join("")}</div>`;
  }
  const hist = (G.history || []).map(h => {
    const clue = h.skipped ? "раунд пропущен" : [h.clue1, h.clue2].filter(Boolean).map(c => `«${esc(c)}»`).join(" → ");
    let who, score;
    if (teams) {
      who = `${TEAM_SHORT[h.team | 0]} · ведущий ${esc(nameOf(h.giver))}`;
      score = h.skipped ? "—" : `+${(h.ta || 0) + (h.tb || 0)}${h.stealPt ? ` <span class="side-pt t${1 - (h.team | 0)}">+1</span>` : ""}`;
    } else {
      const best = h.results ? Object.keys(h.results).map(u => ({ u, p: (h.results[u].a || 0) + (h.results[u].b || 0) })).sort((x, y) => y.p - x.p)[0] : null;
      who = `ведущий ${esc(nameOf(h.giver))}${best && best.p ? ` · лучше всех ${esc(nameOf(best.u))}` : ""}`;
      score = h.skipped ? "—" : "+" + (h.giverPts || 0);
    }
    return `<tr><td class="n">${h.n}</td><td>${isCell(h.target) ? sw(h.target) : ""}</td><td>${clue}<div class="msg small">${who}</div></td><td class="num">${score}</td></tr>`;
  }).join("");
  const again = isAdmin(G)
    ? `<button class="btn btn-primary btn-block" type="button" data-act="again">Сыграть ещё</button>`
    : msg(`Новую партию начнёт <b>${esc(nameOf(adminSeat(G)))}</b>.`);
  setHTML($("#vOver"), `${head}
    ${hist ? `<div class="panel"><h2>Как шли раунды</h2><div class="tbl"><table class="hist"><thead><tr><th>#</th><th>Цвет</th><th>Подсказки</th><th class="num">${teams ? "Очки" : "Ведущему"}</th></tr></thead><tbody>${hist}</tbody></table></div></div>` : ""}
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
const ARROWS = { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d" };
document.addEventListener("keydown", e => {
  const t = e.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) {
    if (e.key !== "Enter") return;
    const id = t.id, r = S.game && S.game.round;
    if (id === "codeInput") ACT.join();
    else if (id === "clueInput") { if (r && r.phase === "clue2") ACT.submitClue2(); else ACT.submitClue1(); }
    else if (id === "lobbyNick") ACT.saveNick();
    else if (id === "homeNick") { if (S.hashCode) ACT.joinRoom(S.hashCode); else ACT.create(); }
    return;
  }
  /* Клавиатура в игре: стрелки двигают фишку, Enter ставит или соглашается */
  const G = S.game;
  if (S.view !== "vGame" || !canPoint(G) || e.altKey || e.ctrlKey || e.metaKey) return;
  if (ARROWS[e.key]) { e.preventDefault(); ACT.nudge(ARROWS[e.key]); }
  else if (e.key === "Enter" && !(t && t.closest && t.closest("button"))) {
    e.preventDefault();
    if (isTeams(G)) { if (!(G.round.votes && G.round.votes[S.uid])) ACT.vote(); } else ACT.place();
  }
});

/* ---------------- Палитры на странице ---------------- */
const gridG = createGrid($("#gameGrid"), { pick: pickCell });
const DEMO = board("m"), DEMO_TARGET = 3 * DEMO.cols + 2, DEMO_START = 4 * DEMO.cols + 3;
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
  demoG.setMarks((open ? targetHTML(DEMO_TARGET) : "") + conesHTML([{ cell: demoSel, color: PCOLORS[1] }]));
}
demoG.setBoard(DEMO);
demoG.setLive(true);
demoDraw(false);

/* ---------------- Запуск ---------------- */
render();
initFirebase();
})();
