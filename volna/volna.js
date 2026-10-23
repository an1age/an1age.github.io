/* Поймай волну — игра на чтение мыслей. Данные онлайн-комнат: Firebase Realtime Database
   (lobby/<код>, rooms/<код>/{game,players,needle}, secrets/<uid>/<код>). Подробности — в README.md. */
(() => {
"use strict";

const CARDS = [
  ["Холодное","Горячее"],["Бесполезное изобретение","Полезное изобретение"],["Недооценённое","Переоценённое"],
  ["Злодей","Герой"],["Плохой фильм","Отличный фильм"],["Мягкое","Твёрдое"],["Тихое","Громкое"],
  ["Крошечное","Огромное"],["Медленное","Быстрое"],["Безопасное","Опасное"],["Старомодное","Модное"],
  ["Для детей","Для взрослых"],["Грустная песня","Весёлая песня"],["Полезная еда","Вредная еда"],
  ["Нормальное","Странное"],["Легко","Сложно"],["Дешёвое","Дорогое"],["Скучное","Захватывающее"],
  ["Встречается редко","Встречается везде"],["Некрасивое","Красивое"],["Пахнет ужасно","Пахнет приятно"],
  ["Невкусное","Вкусное"],["Временное","Вечное"],["Простительно","Непростительно"],["Тёмное","Светлое"],
  ["Лёгкое","Тяжёлое"],["Для интроверта","Для экстраверта"],["Сухое","Мокрое"],["Плохой подарок","Отличный подарок"],
  ["Неромантичное","Романтичное"],["Отстой","Круто"],["Лучше в одиночку","Лучше с друзьями"],
  ["Бесполезный навык","Полезный навык"],["Милое животное","Страшное животное"],["Утреннее","Ночное"],
  ["Будничное","Праздничное"],["Деревенское","Городское"],["Реальное","Вымышленное"],["Научное","Магическое"],
  ["Плохая идея","Хорошая идея"],["Для бедных","Для богатых"],["Устаревшее","Футуристичное"],
  ["Расслабляет","Напрягает"],["Можно при бабушке","Нельзя при бабушке"],["Хрупкое","Прочное"],
  ["Лёгкая работа","Тяжёлая работа"],["Скучная профессия","Интересная профессия"],
  ["Бесполезная суперсила","Крутая суперсила"],["Плохой совет","Хороший совет"],["Неважное","Важное"],
  ["Худший овощ","Лучший овощ"],["Худшая начинка для пиццы","Лучшая начинка для пиццы"],
  ["Худший праздник","Лучший праздник"],["Плохая кличка для собаки","Хорошая кличка для собаки"],
  ["Скучно смотреть","Интересно смотреть"],["Легко сделать дома","Только в ресторане"],["Глупое","Умное"],
  ["Злое","Доброе"],["Трусливое","Смелое"],["Скучный город","Интересный город"],["Лучше летом","Лучше зимой"],
  ["Грязное","Чистое"],["Вредная привычка","Полезная привычка"],["Неудобное","Удобное"],
  ["Глупый вопрос","Гениальный вопрос"],["Классика","Новинка"],["Некрасивое слово","Красивое слово"],
  ["Нужно каждый день","Нужно раз в жизни"],["Нравится всем","Нравится немногим"],
  ["Мечта ребёнка","Мечта взрослого"],["Сладкое","Солёное"],["Жидкое","Твёрдое"],["Пресное","Острое"],
  ["Ничего не стоит","Бесценное"],["Легко потерять","Невозможно потерять"],
  ["Ужасное первое свидание","Идеальное первое свидание"],["Стыдно признаться","Не стыдно признаться"],
  ["Не переживёт апокалипсис","Переживёт апокалипсис"],["Нужен талант","Нужно упорство"],
  ["Легко произнести","Сложно произнести"],["Кошки ненавидят","Кошки обожают"],["Терпеть не могу","Обожаю"],
  ["Безобидное","Агрессивное"],["Натуральное","Искусственное"],["Плохо для караоке","Идеально для караоке"],
  ["Холодный цвет","Тёплый цвет"],["Сделано руками","Сделано машиной"],
  ["Почти не занимает места","Занимает много места"],["Ужасный завтрак","Идеальный завтрак"],
  ["Звучит глупо","Звучит умно"],["Для понедельника","Для пятницы"],["Для бабушек","Для подростков"],
  ["Совсем не новогоднее","Очень новогоднее"],["Ужасный питомец","Идеальный питомец"],
  ["Безвкусица","Шедевр стиля"],["Пустая трата денег","Отличная покупка"],["Простой рецепт","Сложный рецепт"],
  ["Успокаивает","Бесит"],["Невинная ложь","Серьёзная ложь"],["Мелкая неприятность","Катастрофа"],
  ["Умеет каждый","Умеют единицы"],["Больше похоже на кота","Больше похоже на собаку"],
  ["Убивает вечеринку","Спасает вечеринку"],["Для молодых","Для пожилых"],["Неэтичное","Этичное"],
  ["Предсказуемое","Неожиданное"],["Официальное","Неформальное"],["Неприятно на ощупь","Приятно на ощупь"],
  ["Быстро надоедает","Никогда не надоедает"],["Бесполезная вещь в доме","Незаменимая вещь в доме"],
  ["Плохое оправдание","Убедительное оправдание"],["Все знают","Мало кто знает"],
  ["Совсем не спорт","Настоящий спорт"],["Точно не суп","Точно суп"],["Точно не бутерброд","Точно бутерброд"],
  ["Быстро портится","Хранится вечно"],["Овощ","Фрукт"],["Плохой фильм для свидания","Хороший фильм для свидания"],
  ["Неуютное","Уютное"],["Легко нарисовать","Сложно нарисовать"],["Скорее растение","Скорее животное"],
  ["Скорее еда","Скорее напиток"],["Несмешная шутка","Смешная шутка"],["Легко забыть","Невозможно забыть"],
  ["Можно выучить за вечер","Учиться годами"],["Легко найти","Сложно найти"]
];

const TEAMS = ["Длинные волны", "Короткие волны"];
const TEAM_SHORT = ["ДВ", "КВ"];
const MODE_NAMES = { coop: "Вместе", teams: "Команды", solo: "Сам за себя" };
const RULES = {
  coop: "Все играют вместе против шкалы. Стрелку двигают сообща, а фиксируется она, когда все нажали «Согласен». Экстрасенс меняется каждый раунд, очки общие.",
  teams: "Две команды ходят по очереди. Команда двигает стрелку и голосует «Согласен». Потом соперники договариваются, где цель: левее или правее стрелки — угадали, +1 очко. Побеждает команда, первой набравшая {goal}. Попали в «4», но всё ещё отстаёте — ходите ещё раз.",
  solo: "У каждого своя стрелка. Пока игроки думают, их стрелки видит только экстрасенс, остальные — после открытия шторки. Каждый получает очки за свою стрелку, а экстрасенс — +1 за каждого игрока, который попал в зону с очками."
};
const RULES_LOCAL = {
  coop: "Все играют вместе против шкалы. Экстрасенс меняется каждый раунд, очки складываются, в конце — звание команды.",
  teams: "Две команды ходят по очереди. Когда одна поставила стрелку, другая угадывает, где цель — левее или правее: это ещё +1 очко. Побеждает команда, первой набравшая {goal}. Попали в «4», но всё ещё отстаёте — ходите ещё раз."
};
const PCOLORS = ["#F8F3E6", "#22D3EE", "#A78BFA", "#A3E635", "#F472B6", "#60A5FA", "#34D399", "#E879F9"];
const MIN_ROUNDS = 1, MAX_ROUNDS = 30;
const MIN_GOAL = 3, MAX_GOAL = 30;

/* ---------------- Утилиты ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rnd = n => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = v => Math.round(v * 10) / 10;
const isObj = x => x !== null && typeof x === "object" && !Array.isArray(x);
const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
const reduced = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
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
const easeOut = k => 1 - Math.pow(1 - k, 3);
const easeOutQuart = k => 1 - Math.pow(1 - k, 4);
const easeInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
function tween(ms, ease, fn, done) {
  const t0 = performance.now(); let raf = 0, stopped = false;
  const step = now => {
    if (stopped) return;
    const k = Math.min(1, (now - t0) / ms);
    fn(ease(k));
    if (k < 1) raf = requestAnimationFrame(step); else if (done) done();
  };
  raf = requestAnimationFrame(step);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

/* ---------------- Шкала (SVG) ---------------- */
function createDial(svg, uid) {
  const NS = "http://www.w3.org/2000/svg";
  const cx = 200, cy = 204, R = 172, RIM = 190;
  svg.setAttribute("viewBox", "0 0 400 224");
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const f = n => Math.round(n * 100) / 100;
  const P = (deg, r) => { const a = deg * Math.PI / 180; return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
  const half = r => `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`;
  const wedge = (h, r) => { const [x1, y1] = P(90 + h, r), [x2, y2] = P(90 - h, r); return `M ${cx} ${cy} L ${f(x1)} ${f(y1)} A ${r} ${r} 0 0 1 ${f(x2)} ${f(y2)} Z`; };
  const setRot = (g, a) => g.setAttribute("transform", `rotate(${f(a)} ${cx} ${cy})`);

  const defs = el("defs", {}, svg);
  const clip = el("clipPath", { id: "dclip-" + uid }, defs);
  el("path", { d: half(R) }, clip);

  el("rect", { x: 6, y: cy - 2, width: 388, height: 18, rx: 5, class: "d-base" }, svg);
  el("path", { d: half(RIM), class: "d-rim" }, svg);
  el("path", { d: half(R), class: "d-face" }, svg);

  const inner = el("g", { "clip-path": `url(#dclip-${uid})` }, svg);
  const wheel = el("g", {}, inner);
  for (let a = 0; a < 360; a += 15) { const [x, y] = P(a, R); el("line", { x1: cx, y1: cy, x2: f(x), y2: f(y), class: "d-spoke" }, wheel); }
  el("path", { d: wedge(22.5, R), class: "d-b2" }, wheel);
  el("path", { d: wedge(13.5, R), class: "d-b3" }, wheel);
  el("path", { d: wedge(4.5, R), class: "d-b4" }, wheel);
  [[18, "2"], [9, "3"], [0, "4"], [-9, "3"], [-18, "2"]].forEach(([o, t]) => {
    const [x, y] = P(90 + o, R - 24);
    const tx = el("text", { x: f(x), y: f(y), class: "d-num", "text-anchor": "middle", "dominant-baseline": "central", transform: `rotate(${-o} ${f(x)} ${f(y)})` }, wheel);
    tx.textContent = t;
  });

  const shutter = el("g", {}, inner);
  el("path", { d: half(R + 2), class: "d-shut" }, shutter);
  for (let r = 44; r < R; r += 24) el("path", { d: `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`, class: "d-groove" }, shutter);
  el("path", { d: `M ${cx - 66} ${cy - 92} q 11 -18 22 0 t 22 0 t 22 0 t 22 0 t 22 0 t 22 0`, class: "d-wave" }, shutter);

  const ticks = el("g", {}, svg);
  for (let i = 0; i <= 40; i++) {
    const deg = 180 - i * 4.5, major = i % 4 === 0;
    const [x1, y1] = P(deg, RIM - 3), [x2, y2] = P(deg, RIM - (major ? 14 : 8));
    el("line", { x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2), class: major ? "d-tick d-tick-major" : "d-tick" }, ticks);
  }

  const marks = el("g", {}, svg);
  const needle = el("g", {}, svg);
  el("line", { x1: cx, y1: cy, x2: cx, y2: cy - R + 8, class: "d-needle-shadow" }, needle);
  el("line", { x1: cx, y1: cy, x2: cx, y2: cy - R + 8, class: "d-needle-line" }, needle);
  el("circle", { cx, cy: cy - R + 16, r: 9, class: "d-needle-knob" }, needle);
  el("circle", { cx, cy, r: 16, class: "d-hub" }, svg);
  el("circle", { cx, cy, r: 5, class: "d-hub-dot" }, svg);

  let shutA = 0, shutTo = 0, stopShut = null;
  let targetV = null, spinning = false, stopSpin = null, hideAfterClose = false;
  let needleV = 50, needleTo = null, needleOn = false, stopNeedle = null;
  let live = false, dragging = false, h = {};
  wheel.style.visibility = "hidden";
  needle.style.visibility = "hidden";
  setRot(shutter, 0);

  function setShutter(open, animate = true) {
    const to = open ? -180 : 0;
    if (to === shutTo) return;
    shutTo = to;
    if (stopShut) { stopShut(); stopShut = null; }
    shutter.style.visibility = "visible";
    const from = shutA;
    const finish = () => {
      stopShut = null; shutA = to; setRot(shutter, to);
      if (open) shutter.style.visibility = "hidden";
      else if (hideAfterClose) { hideAfterClose = false; wheel.style.visibility = "hidden"; }
    };
    if (!animate || reduced()) { finish(); return; }
    stopShut = tween(open ? 950 : 600, easeInOut, k => { shutA = from + (to - from) * k; setRot(shutter, shutA); }, finish);
  }
  function setTarget(v) {
    if (spinning) return;
    if (v == null) {
      targetV = null;
      if (shutTo === 0 && stopShut) hideAfterClose = true; else wheel.style.visibility = "hidden";
      return;
    }
    hideAfterClose = false;
    wheel.style.visibility = "visible";
    if (v !== targetV) { targetV = v; setRot(wheel, (v - 50) * 1.8); }
  }
  function spinTo(v, done) {
    if (stopSpin) stopSpin();
    spinning = true; hideAfterClose = false; targetV = v;
    wheel.style.visibility = "visible";
    const fin = (v - 50) * 1.8, from = fin - (1080 + Math.random() * 240);
    if (reduced()) { setRot(wheel, fin); spinning = false; if (done) done(); return; }
    stopSpin = tween(3000, easeOutQuart, k => setRot(wheel, from + (fin - from) * k), () => { spinning = false; stopSpin = null; if (done) done(); });
  }
  function drawNeedle(v) { needleV = v; setRot(needle, (v - 50) * 1.8); svg.setAttribute("aria-valuenow", String(Math.round(v))); }
  function setNeedle(v, smooth = true) {
    if (v == null) { needleOn = false; needleTo = null; needle.style.visibility = "hidden"; return; }
    if (dragging) return;
    if (!needleOn) { needleOn = true; needle.style.visibility = "visible"; if (stopNeedle) stopNeedle(); needleTo = v; drawNeedle(v); return; }
    if (v === needleTo) return;
    needleTo = v;
    if (stopNeedle) stopNeedle();
    if (!smooth || reduced()) { drawNeedle(v); return; }
    const from = needleV;
    stopNeedle = tween(200, easeOut, k => drawNeedle(from + (v - from) * k), () => { stopNeedle = null; });
  }
  function valueFrom(e) {
    const m = svg.getScreenCTM(); if (!m) return needleV;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    let deg = Math.atan2(cy - p.y, p.x - cx) * 180 / Math.PI;
    if (deg < 0) deg = p.x < cx ? 180 : 0;
    return clamp((180 - deg) / 1.8, 0, 100);
  }
  svg.addEventListener("pointerdown", e => {
    if (!live) return;
    e.preventDefault();
    try { svg.setPointerCapture(e.pointerId); } catch {}
    dragging = true;
    if (stopNeedle) { stopNeedle(); stopNeedle = null; }
    const v = valueFrom(e); drawNeedle(v); needleTo = v;
    if (h.input) h.input(v);
  });
  svg.addEventListener("pointermove", e => {
    if (!dragging) return;
    const v = valueFrom(e); drawNeedle(v); needleTo = v;
    if (h.input) h.input(v);
  });
  const end = () => { if (!dragging) return; dragging = false; if (h.commit) h.commit(needleV); };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
  svg.addEventListener("lostpointercapture", end);
  svg.addEventListener("keydown", e => {
    if (!live) return;
    let d = 0;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = -1;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") d = 1;
    else if (e.key === "Home") d = -100;
    else if (e.key === "End") d = 100;
    else return;
    e.preventDefault();
    if (e.shiftKey) d *= 5;
    const v = clamp(needleV + d, 0, 100); drawNeedle(v); needleTo = v;
    if (h.input) h.input(v);
    if (h.commit) h.commit(v);
  });
  function setInteractive(on, handlers) {
    live = !!on;
    if (handlers) h = handlers;
    svg.classList.toggle("is-live", live);
    if (live) svg.setAttribute("tabindex", "0");
    else { svg.removeAttribute("tabindex"); dragging = false; }
  }
  let marksKey = "[]";
  /* Стрелки всех игроков (режим «Сам за себя»): [{v, color}] */
  function setMarks(list) {
    const key = JSON.stringify(list || []);
    if (key === marksKey) return;
    marksKey = key;
    while (marks.firstChild) marks.removeChild(marks.firstChild);
    (list || []).forEach(m => {
      const g = el("g", m.draft ? { class: "d-mark is-draft" } : { class: "d-mark" }, marks);
      el("line", { x1: cx, y1: cy, x2: cx, y2: cy - R + 8, class: "d-needle-shadow" }, g);
      el("line", { x1: cx, y1: cy, x2: cx, y2: cy - R + 8, stroke: m.color, "stroke-width": 3.5, "stroke-linecap": "round" }, g);
      el("circle", { cx, cy: cy - R + 16, r: 9, fill: m.color, class: "d-mark-knob" }, g);
      setRot(g, (m.v - 50) * 1.8);
    });
  }
  return { setShutter, setTarget, spinTo, setNeedle, setInteractive, setMarks, get value() { return needleV; } };
}



/* ---------------- Игровая логика ---------------- */
function pointsFor(target, needle) {
  const d = Math.abs(target - needle);
  return d <= 2.5 ? 4 : d <= 7.5 ? 3 : d <= 12.5 ? 2 : 0;
}
function blankGame(mode, rounds) {
  return { mode, rounds, goal: 10, status: "lobby", round: null, score: { coop: 0, t: [0, 0], p: {} }, turns: [0, 0], used: [], history: [] };
}
function makeRound(n, psychic, team) {
  return {
    n, psychic: psychic || null, team: team == null ? null : team, phase: "think",
    card: null, spec: null, clue: "", needle: 50,
    votes: null, sideVotes: null, side: null, guesses: null, ready: null, force: null,
    target: null, pts: null, sidePts: null, again: false, results: null, psyPts: null
  };
}
function sortedPlayers(players) {
  return players.slice().sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0) || String(a.seat).localeCompare(String(b.seat)));
}
function teamMembers(players, t) { return sortedPlayers(players).filter(p => (p.team | 0) === t); }
function specOf(r) {
  if (r && Array.isArray(r.spec) && r.spec.length === 2) return r.spec;
  if (r && r.card != null && CARDS[r.card]) return CARDS[r.card];
  return null;
}
function startPatch(G, players, online) {
  const patch = { status: "play", gid: Date.now().toString(36) + rnd(46656).toString(36), score: { coop: 0, t: [0, 0], p: {} }, turns: [0, 0], history: [] };
  if (G.mode === "teams") {
    const team = rnd(2);
    const mem = online ? teamMembers(players, team) : [];
    patch.round = makeRound(1, mem[0] ? mem[0].seat : null, team);
    patch.turns = team === 0 ? [1, 0] : [0, 1];
  } else {
    const order = online ? sortedPlayers(players) : [];
    patch.round = makeRound(1, order[0] ? order[0].seat : null, null);
  }
  return patch;
}
function gameWillEnd(G) {
  if (G.mode === "teams") { const [a, b] = G.score.t; return (a >= G.goal || b >= G.goal) && a !== b; }
  return G.round.n >= G.rounds;
}
function nextPatch(G, players, online) {
  const r = G.round, n = r.n + 1;
  if (gameWillEnd(G)) return { status: "over" };
  if (G.mode === "teams") {
    const team = r.again ? r.team : 1 - r.team;
    const turns = (G.turns || [0, 0]).slice();
    const mem = online ? teamMembers(players, team) : [];
    const psychic = mem.length ? mem[turns[team] % mem.length].seat : null;
    turns[team]++;
    return { round: makeRound(n, psychic, team), turns };
  }
  const order = online ? sortedPlayers(players) : [];
  const psychic = order.length ? order[r.n % order.length].seat : null;
  return { round: makeRound(n, psychic, null) };
}
function revealPatch(G, target, side) {
  const r = G.round, spec = specOf(r);
  if (G.mode === "solo") {
    const guesses = r.guesses || {}, results = {}, p = Object.assign({}, G.score.p || {});
    let hits = 0;
    for (const uid of Object.keys(guesses)) {
      const v = guesses[uid];
      if (typeof v !== "number") continue;
      const got = pointsFor(target, v);
      results[uid] = got;
      if (got > 0) hits++;
      p[uid] = (p[uid] || 0) + got;
    }
    if (r.psychic) p[r.psychic] = (p[r.psychic] || 0) + hits;
    const entry = { n: r.n, spec, clue: r.clue, target, psychic: r.psychic, results, psyPts: hits };
    return {
      round: { target, phase: "result", results: LEAF(results), psyPts: hits, ready: null },
      score: { coop: G.score.coop, t: G.score.t.slice(), p: LEAF(p) },
      history: (G.history || []).concat([entry]).slice(-40)
    };
  }
  const got = pointsFor(target, r.needle);
  const entry = { n: r.n, spec, clue: r.clue, target, needle: r.needle, pts: got, team: r.team, psychic: r.psychic, sidePts: 0 };
  const patch = { round: { target, pts: got, sidePts: 0, again: false, phase: "result", ready: null } };
  if (G.mode === "teams") {
    const t = G.score.t.slice();
    const sd = side || r.side || null;
    t[r.team] += got;
    if (got < 4 && sd) {
      const ok = (sd === "left" && target < r.needle) || (sd === "right" && target > r.needle);
      if (ok) { t[1 - r.team] += 1; entry.sidePts = 1; patch.round.sidePts = 1; }
    }
    entry.side = sd;
    patch.round.side = sd;
    patch.round.again = got === 4 && t[r.team] < t[1 - r.team];
    patch.score = { coop: G.score.coop, t };
  } else {
    patch.score = { coop: G.score.coop + got, t: G.score.t.slice() };
  }
  patch.history = (G.history || []).concat([entry]).slice(-40);
  return patch;
}
function drawPair(G, avoid) {
  avoid = avoid || [];
  const used = new Set([...(G.used || []), ...avoid]);
  let pool = [...CARDS.keys()].filter(i => !used.has(i));
  if (pool.length < 2) pool = [...CARDS.keys()].filter(i => !avoid.includes(i));
  const a = pool.splice(rnd(pool.length), 1)[0];
  const b = pool.splice(rnd(pool.length), 1)[0];
  return [a, b];
}
function rating(pct) {
  if (pct >= .85) return ["Телепаты", "Вы читаете мысли друг друга. Подозрительно."];
  if (pct >= .65) return ["На одной волне", "Отличная настройка: сигнал чистый."];
  if (pct >= .45) return ["Сигнал ловится", "Понимаете друг друга, хотя бывают помехи."];
  if (pct >= .25) return ["Помехи в эфире", "Иногда совпадаете. Подкрутите антенну."];
  return ["Связи нет", "Похоже, вы на разных частотах. Ещё партию?"];
}

/* ---------------- Состояние ---------------- */
const S = {
  caps: "wait", authErr: null, db: null, uid: null, seat: null, nick: "",
  mode: null, code: null, game: null, players: [], playersRaw: {}, rooms: [], roomsOn: false,
  roomOk: false, online: new Set(), unsub: [],
  local: null, secret: null, loadingSecret: null, secretChecked: null,
  needle: null, lastDbNeedle: null, needleTimer: null, pendingNeedle: null, liveNeedle: null, liveTimer: null,
  soloLive: {}, soloMine: null, soloTimer: null,
  myGuess: null, revealKey: null, sideKey: null, advKey: null, localRevealT: null,
  view: null, wake: null, hashCode: null,
  ui: { peek: false, spinningKey: null, pair: null, pairKey: null, pick: 0, confirm: null },
  drafts: { nick: "", code: "", clue: "", left: "", right: "" }
};
S.nick = store.get("wl.nick") || "";
S.drafts.nick = S.nick;
{
  const h = String(location.hash || "").replace(/^#/, "").toUpperCase();
  if (/^[A-Z0-9]{4}$/.test(h)) { S.hashCode = h; S.drafts.code = h; }
}

const G_ = () => S.mode === "online" ? S.game : S.mode === "local" ? S.local : null;
/* Ключ раунда: комната + партия + номер раунда. Партия (gid) нужна, чтобы новая игра в той же комнате не подхватила цель прошлой. */
const rKey = G => (S.mode === "online" ? S.code : "local") + ":" + ((G && G.gid) || 0) + ":" + (G && G.round ? G.round.n : 0);
const myPlayer = () => S.players.find(p => p.seat === S.seat) || null;
const nameOf = seat => { const p = S.players.find(x => x.seat === seat); return (p && p.name) || "Игрок"; };
function currentNick() { return String(S.drafts.nick ?? S.nick).trim().slice(0, 24); }
/* Админ — создатель комнаты; если он ушёл, права переходят к тому, кто зашёл раньше всех */
function adminSeat(G) {
  if (G && G.host && S.players.some(p => p.seat === G.host)) return G.host;
  const s = sortedPlayers(S.players);
  return s[0] ? s[0].seat : null;
}
const isAdmin = G => S.mode === "local" || (!!S.uid && adminSeat(G) === S.uid);
function colorOf(seat) {
  const i = sortedPlayers(S.players).findIndex(p => p.seat === seat);
  return PCOLORS[(i < 0 ? 0 : i) % PCOLORS.length];
}
function guessersOf(G) {
  const r = G.round;
  if (G.mode === "teams") return teamMembers(S.players, r.team).map(p => p.seat).filter(s => s !== r.psychic);
  return S.players.map(p => p.seat).filter(s => s !== r.psychic);
}
function opponentsOf(G) { return G.mode === "teams" ? teamMembers(S.players, 1 - G.round.team).map(p => p.seat) : []; }
/* Кто ещё должен проголосовать/ответить и выполнено ли условие. Учитываем только тех, кто сейчас в сети. */
function roundStatus(G) {
  const r = G.round, on = s => S.online.has(s);
  const out = { req: [], done: [], ready: false, side: null, split: false };
  if (!r) return out;
  if (r.phase === "guess" && G.mode === "solo") {
    out.req = guessersOf(G).filter(on);
    out.done = out.req.filter(s => r.guesses && typeof r.guesses[s] === "number");
    out.ready = out.req.length > 0 && (out.done.length === out.req.length || (!!r.force && out.done.length > 0));
  } else if (r.phase === "guess") {
    out.req = guessersOf(G).filter(on);
    out.done = out.req.filter(s => r.votes && r.votes[s]);
    out.ready = out.req.length > 0 && out.done.length === out.req.length;
  } else if (r.phase === "side") {
    out.req = opponentsOf(G).filter(on);
    const picks = out.req.map(s => r.sideVotes && r.sideVotes[s]).filter(Boolean);
    out.done = out.req.filter(s => r.sideVotes && r.sideVotes[s]);
    const all = out.req.length > 0 && picks.length === out.req.length;
    const agree = all && picks.every(x => x === picks[0]);
    out.split = all && !agree;
    out.side = agree ? picks[0] : null;
    out.ready = agree || out.req.length === 0;
  } else if (r.phase === "result") {
    out.req = S.players.map(p => p.seat).filter(on);
    out.done = out.req.filter(s => r.ready && r.ready[s]);
    out.ready = out.req.length > 0 && out.done.length === out.req.length;
  }
  return out;
}
function myGuessVal(r) { return S.myGuess && S.myGuess.n === r.n ? S.myGuess.v : 50; }

/* ---------------- Секрет экстрасенса ---------------- */
function getSecret(G) { const k = rKey(G); return S.secret && S.secret.key === k ? S.secret.target : null; }
function saveSecret(k, target) {
  S.secret = { key: k, target };
  store.set("wl.secret", S.secret);
  if (S.mode === "online" && S.uid && S.db) {
    S.db.ref(`secrets/${S.uid}/${S.code}`).set({ key: k, target, at: Date.now() }).catch(() => {});
  }
}
async function loadSecret(G) {
  const k = rKey(G);
  if ((S.secret && S.secret.key === k) || S.loadingSecret === k || S.secretChecked === k) return;
  const ls = store.get("wl.secret");
  if (ls && ls.key === k) { S.secret = ls; S.secretChecked = k; render(); return; }
  if (S.mode === "online" && S.uid && S.db) {
    S.loadingSecret = k;
    try {
      const snap = await S.db.ref(`secrets/${S.uid}/${S.code}`).get();
      const d = snap.exists() ? snap.val() : null;
      if (d && d.key === k && typeof d.target === "number") S.secret = { key: k, target: d.target };
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
/* {round:{needle:5}} → {"round/needle":5}: Firebase меняет только нужные поля */
function flatten(obj, prefix, out) {
  for (const k of Object.keys(obj)) {
    const v = obj[k], p = prefix ? prefix + "/" + k : k;
    if (isLeaf(v)) out[p] = isObj(v.__leaf) && !Object.keys(v.__leaf).length ? null : v.__leaf;
    else if (isObj(v) && Object.keys(v).length) flatten(v, p, out);
    else if (Array.isArray(v)) out[p] = v.length ? v : null;
    else if (isObj(v)) out[p] = null;
    else out[p] = v === undefined ? null : v;
  }
  return out;
}
function commit(patch) {
  if (S.mode === "local") { deepMerge(S.local, patch); saveLocal(); render(); return Promise.resolve(); }
  if (S.mode !== "online" || !S.db || !S.code) return Promise.resolve();
  const code = S.code, now = Date.now(), upd = {};
  const flat = flatten(patch, "", {});
  for (const p of Object.keys(flat)) upd[`rooms/${code}/game/${p}`] = clone(flat[p]);
  upd[`rooms/${code}/game/updatedAt`] = now;
  upd[`lobby/${code}/updatedAt`] = now;
  if (patch.status) upd[`lobby/${code}/status`] = patch.status;
  writeQueue = writeQueue.then(() => S.db.ref().update(upd)).catch(e => toast(writeErr(e)));
  return writeQueue;
}
function saveLocal() { if (S.local) store.set("wl.local", S.local); }
/* Сдвинули стрелку — согласия сбрасываются */
function clearVotesNow() {
  const G = S.game, r = G && G.round;
  if (S.mode === "online" && r && r.phase === "guess" && r.votes && Object.keys(r.votes).length) commit({ round: { votes: null } });
}
function queueNeedleWrite(v) {
  clearVotesNow();
  S.pendingNeedle = v;
  clearTimeout(S.needleTimer);
  S.needleTimer = setTimeout(() => {
    S.needleTimer = null;
    const G = S.game;
    if (S.mode !== "online" || !G || !G.round || G.round.phase !== "guess") return;
    commit({ round: { needle: S.pendingNeedle, votes: null } });
  }, 220);
}
/* Живая стрелка: пока игрок тянет, остальные видят движение */
function pushLiveNeedle(n, v) {
  S.liveNeedle = { n, v: r1(v), by: S.uid };
  if (S.liveTimer) return;
  S.liveTimer = setTimeout(() => {
    S.liveTimer = null;
    if (S.mode === "online" && S.db && S.code && S.liveNeedle) S.db.ref(`rooms/${S.code}/needle`).set(S.liveNeedle).catch(() => {});
  }, 80);
}
function pushSoloLive(n, v) {
  S.soloMine = { n, v: r1(v) };
  if (S.soloTimer) return;
  S.soloTimer = setTimeout(() => {
    S.soloTimer = null;
    if (S.mode === "online" && S.db && S.code && S.soloMine) S.db.ref(`rooms/${S.code}/needle/s/${S.uid}`).set(S.soloMine).catch(() => {});
  }, 80);
}
function displayedNeedle(G) {
  const r = G.round;
  if (S.mode === "online" && r.phase === "guess" && S.needle && S.needle.n === r.n) return S.needle.v;
  return r.needle;
}

/* ---------------- Онлайн-комнаты (Firebase) ---------------- */
async function initFirebase() {
  if (!window.SiteFirebase) { S.caps = "offline"; render(); return; }
  try {
    const { db, uid } = await window.SiteFirebase.connect();
    S.db = db; S.uid = uid; S.seat = uid; S.caps = "ok";
    subscribeRooms();
    const saved = store.get("wl.room");
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
  S.db.ref("lobby").orderByChild("updatedAt").limitToLast(40).on("value", snap => {
    const list = [];
    snap.forEach(c => { list.push(Object.assign({ id: c.key }, c.val())); });
    S.rooms = list.reverse();
    if (!S.mode) render();
  }, () => { S.rooms = []; });
}
async function resumeRoom(code) {
  try {
    const [g, p] = await Promise.all([S.db.ref(`rooms/${code}/game/status`).get(), S.db.ref(`rooms/${code}/players/${S.uid}/name`).get()]);
    if (g.exists() && p.exists()) { if (!S.mode) enterRoom(code); }
    else store.del("wl.room");
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
    for (let i = 0; i < 5; i++) { const s = await S.db.ref(`rooms/${code}/game/status`).get(); if (!s.exists()) break; code = genCode(); }
    const now = Date.now();
    const G = blankGame("coop", 7);
    Object.assign(G, { code, hostNick: nick, host: S.uid, createdAt: now, updatedAt: now });
    await S.db.ref().update({
      [`rooms/${code}/game`]: stripNulls(clone(G)),
      [`lobby/${code}`]: { code, hostNick: nick, status: "lobby", updatedAt: now }
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
    const gs = await S.db.ref(`rooms/${code}/game`).get();
    if (!gs.exists()) { toast(`Комнаты ${code} нет. Проверьте код.`); return; }
    const G = gs.val();
    const me = S.db.ref(`rooms/${code}/players/${S.uid}`);
    const ps = await me.get();
    const cur = ps.exists() ? ps.val() : null;
    if (!cur || !cur.name) await me.update({ name: nick, joinedAt: Date.now() });
    else if (cur.name !== nick) await me.update({ name: nick });
    const teams = G.teams || {};
    if (teams[S.uid] == null) {
      const c = [0, 0];
      Object.keys(teams).forEach(k => { c[teams[k] === 1 ? 1 : 0]++; });
      await S.db.ref(`rooms/${code}/game/teams/${S.uid}`).set(c[0] <= c[1] ? 0 : 1);
    }
    if (S.hashCode) { S.hashCode = null; try { history.replaceState(null, "", location.pathname + location.search); } catch {} }
    enterRoom(code);
  } catch (e) { toast(writeErr(e)); }
}
function enterRoom(code) {
  leaveSubs();
  Object.assign(S, { mode: "online", code, game: null, players: [], playersRaw: {}, needle: null, lastDbNeedle: null, soloLive: {}, online: new Set(), roomOk: true });
  resetRoundUI();
  store.set("wl.room", code);
  const base = S.db.ref("rooms/" + code);
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
  listen(base.child("needle"), snap => {
    const v = snap.val(), G = S.game, r = G && G.round;
    if (S.code !== code) return;
    /* «Сам за себя»: стрелки игроков, пока они думают, — их видит только экстрасенс */
    S.soloLive = v && isObj(v.s) ? v.s : {};
    if (G && G.mode === "solo" && r && r.phase === "guess" && r.psychic === S.uid) render();
    if (!v || v.by === S.uid || !r || r.phase !== "guess" || G.mode === "solo" || v.n !== r.n || typeof v.v !== "number") return;
    S.needle = { n: r.n, v: clamp(v.v, 0, 100) };
    render();
  });
  /* Присутствие: в сети ли игрок и есть ли в комнате хоть кто-то (для списка открытых комнат) */
  const onlineRef = base.child(`players/${S.uid}/online`);
  const lobbyRef = S.db.ref(`lobby/${code}/online/${S.uid}`);
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
  const G = Object.assign({ mode: "coop", rounds: 7, goal: 10, status: "lobby" }, v);
  const sc = v.score || {}, t = arr(sc.t), tu = arr(v.turns);
  G.score = { coop: sc.coop || 0, t: [t[0] || 0, t[1] || 0], p: sc.p || {} };
  G.turns = [tu[0] || 0, tu[1] || 0];
  G.used = arr(v.used);
  G.history = arr(v.history).filter(Boolean);
  G.teams = v.teams || {};
  G.round = v.round ? Object.assign({}, ROUND_DEFAULTS, v.round) : null;
  if (G.round && Array.isArray(G.round.spec) === false && G.round.spec) G.round.spec = arr(G.round.spec);
  return G;
}
function buildPlayers() {
  const teams = (S.game && S.game.teams) || {}, raw = S.playersRaw || {};
  S.players = Object.keys(raw).filter(k => raw[k] && raw[k].name).map(k => ({
    seat: k, name: String(raw[k].name).slice(0, 24), joinedAt: raw[k].joinedAt || 0,
    team: teams[k] === 1 ? 1 : 0, online: raw[k].online === true
  }));
  S.online = new Set(S.players.filter(p => p.online).map(p => p.seat));
}
function onGame(G) {
  const prev = S.game;
  S.game = G;
  buildPlayers();
  const r = G.round;
  if (r && (!S.lastDbNeedle || S.lastDbNeedle.n !== r.n || S.lastDbNeedle.v !== r.needle)) {
    S.lastDbNeedle = { n: r.n, v: r.needle };
    S.needle = { n: r.n, v: r.needle };
  }
  if (!prev || !prev.round || !r || prev.round.n !== r.n || prev.status !== G.status) resetRoundUI();
  render();
}
/* Следующий раунд, когда все готовы. Транзакция: даже если нажали одновременно, раунд сменится один раз. */
function advanceRound(n) {
  const code = S.code;
  S.db.ref(`rooms/${code}/game`).transaction(cur => {
    if (!cur) return cur;
    const G = normGame(cur);
    if (G.status !== "play" || !G.round || G.round.n !== n || G.round.phase !== "result") return;
    const out = deepMerge(G, nextPatch(G, S.players, true));
    out.updatedAt = Date.now();
    return stripNulls(out);
  }).then(res => {
    if (res && res.committed) {
      const v = res.snapshot.val() || {};
      S.db.ref(`lobby/${code}`).update({ status: v.status || "play", updatedAt: Date.now() }).catch(() => {});
    }
  }).catch(e => { S.advKey = null; toast(writeErr(e)); });
}
function leaveSubs() {
  S.unsub.forEach(u => { try { u(); } catch {} });
  S.unsub = [];
  S.roomOk = false;
  clearTimeout(S.liveTimer); S.liveTimer = null;
  clearTimeout(S.soloTimer); S.soloTimer = null;
  clearTimeout(S.needleTimer); S.needleTimer = null;
}
function exitOnline() {
  leaveSubs();
  Object.assign(S, { mode: null, code: null, game: null, players: [], playersRaw: {} });
  store.del("wl.room");
  render();
}
/* Выход из комнаты. Ушёл последний — комната удаляется целиком. */
async function leaveRoom() {
  const code = S.code, uid = S.uid;
  leaveSubs();
  try {
    await S.db.ref().update({
      [`rooms/${code}/players/${uid}`]: null,
      [`rooms/${code}/game/teams/${uid}`]: null,
      [`rooms/${code}/needle/s/${uid}`]: null,
      [`lobby/${code}/online/${uid}`]: null
    });
    const rest = await S.db.ref(`rooms/${code}/players`).get();
    if (!rest.exists()) await S.db.ref().update({ [`rooms/${code}/game`]: null, [`rooms/${code}/needle`]: null, [`lobby/${code}`]: null });
  } catch {}
  exitOnline();
}
function setNick(nick) { S.nick = nick; S.drafts.nick = nick; store.set("wl.nick", nick); }
function roomLink(code) {
  if (!/^https?:$/.test(location.protocol)) return "";
  return location.origin + location.pathname + "#" + code;
}
function copyText(text, okMsg) {
  try { navigator.clipboard.writeText(text).then(() => toast(okMsg), () => toast(text)); }
  catch { toast(text); }
}

/* ---------------- Автоматика раунда ---------------- */
/* Экстрасенс ведёт раунд: только у него есть цель, поэтому шторку открывает его устройство —
   через секунду после того, как все согласились. */
function tick() {
  const G = G_();
  if (!G || G.status !== "play" || !G.round) return;
  const r = G.round;
  if (S.mode === "local") {
    if (r.phase === "reveal" && !S.localRevealT) {
      S.localRevealT = setTimeout(() => {
        S.localRevealT = null;
        const L = S.local;
        if (S.mode !== "local" || !L || !L.round || L.round.phase !== "reveal") return;
        const t = getSecret(L);
        if (t != null) commit(revealPatch(L, t, L.round.side));
      }, 1000);
    }
    return;
  }
  const st = roundStatus(G);
  if (r.psychic === S.uid) {
    if (r.phase === "guess" && G.mode === "teams" && st.ready) {
      const key = `side:${rKey(G)}`;
      if (S.sideKey !== key) { S.sideKey = key; commit({ round: { phase: "side", sideVotes: null } }); }
    }
    const revealable = (r.phase === "guess" && G.mode !== "teams") || r.phase === "side";
    if (revealable && st.ready && getSecret(G) != null) {
      const key = `rev:${rKey(G)}`;
      if (S.revealKey !== key) {
        S.revealKey = key;
        setTimeout(() => {
          const G2 = S.game;
          if (S.mode !== "online" || !G2 || !G2.round || G2.round.n !== r.n) { S.revealKey = null; return; }
          const ph = G2.round.phase, st2 = roundStatus(G2), t = getSecret(G2);
          const ok = ((ph === "guess" && G2.mode !== "teams") || ph === "side") && st2.ready && t != null;
          if (!ok) { S.revealKey = null; render(); return; }
          commit(revealPatch(G2, t, st2.side));
        }, 1000);
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
  S.ui.peek = false; S.ui.pair = null; S.ui.pairKey = null; S.ui.pick = 0; S.ui.confirm = null;
  S.drafts.clue = ""; S.drafts.left = ""; S.drafts.right = ""; S.myGuess = null;
}
function ensurePair(G) {
  const k = rKey(G);
  if (S.ui.pairKey !== k || !S.ui.pair) { S.ui.pair = drawPair(G); S.ui.pairKey = k; S.ui.pick = 0; }
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
const canSkip = G => S.mode === "local" || (G && G.round && (G.round.psychic === S.uid || isAdmin(G)));

const ACT = {
  home() { if (S.mode === "local") { S.mode = null; render(); } else if (!S.mode) window.scrollTo(0, 0); },
  create() { createRoom(); },
  join() { joinRoom(S.drafts.code); },
  joinRoom(arg) { joinRoom(arg); },
  local() {
    S.mode = "local"; S.local = blankGame("coop", 7);
    S.secret = null; store.del("wl.secret"); resetRoundUI(); saveLocal(); render();
  },
  localResume() {
    const g = store.get("wl.local");
    if (!g) return ACT.local();
    S.mode = "local"; S.local = g;
    const s = store.get("wl.secret"); if (s) S.secret = s;
    resetRoundUI(); render();
  },
  setMode(arg) {
    const G = G_(); if (!G || G.status !== "lobby" || !isAdmin(G) || !MODE_NAMES[arg]) return;
    if (S.mode === "local" && arg === "solo") return;
    if (G.mode !== arg) commit({ mode: arg });
  },
  rounds(arg) {
    const G = G_(); if (!G || G.status !== "lobby" || !isAdmin(G)) return;
    const n = clamp((G.rounds || 7) + (+arg || 0), MIN_ROUNDS, MAX_ROUNDS);
    if (n !== G.rounds) commit({ rounds: n });
  },
  goal(arg) {
    const G = G_(); if (!G || G.status !== "lobby" || !isAdmin(G)) return;
    const n = clamp((G.goal || 10) + (+arg || 0), MIN_GOAL, MAX_GOAL);
    if (n !== G.goal) commit({ goal: n });
  },
  start() {
    const G = G_(); if (!G || G.status !== "lobby" || !isAdmin(G)) return;
    const online = S.mode === "online";
    if (online) {
      if (G.mode === "teams" && (teamMembers(S.players, 0).length < 2 || teamMembers(S.players, 1).length < 2)) return toast("В каждой команде нужно минимум 2 игрока");
      if (G.mode !== "teams" && S.players.length < 2) return toast("Нужно минимум 2 игрока");
    } else { S.secret = null; store.del("wl.secret"); }
    resetRoundUI();
    commit(startPatch(G, S.players, online));
  },
  async switchTeam() {
    const me = myPlayer(); if (!me || !S.game || S.game.status !== "lobby") return;
    try { await S.db.ref(`rooms/${S.code}/game/teams/${S.uid}`).set(me.team === 1 ? 0 : 1); } catch (e) { toast(writeErr(e)); }
  },
  shuffle() {
    const G = G_(); if (!G || !isAdmin(G)) return;
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
    if (S.mode === "online" && S.code) {
      try { await S.db.ref(`rooms/${S.code}/players/${S.uid}/name`).set(nick); toast("Имя сохранено"); } catch (e) { toast(writeErr(e)); }
    }
  },
  copyCode() { copyText(S.code, "Код скопирован"); },
  share() {
    const link = roomLink(S.code);
    if (!link) return copyText(S.code, "Код скопирован");
    const text = `Заходи в «Поймай волну», комната ${S.code}`;
    if (navigator.share) navigator.share({ title: "Поймай волну", text, url: link }).catch(() => {});
    else copyText(link, "Ссылка скопирована — отправьте её друзьям");
  },
  peek() { S.ui.peek = true; render(); },
  spin() {
    const G = G_(); if (!G || !G.round || G.round.phase !== "think") return;
    const k = rKey(G);
    if (S.ui.spinningKey === k || getSecret(G) != null) return;
    const target = r1(2 + Math.random() * 96);
    saveSecret(k, target);
    ensurePair(G);
    S.ui.spinningKey = k;
    dialG.setShutter(true, true);
    dialG.spinTo(target, () => { S.ui.spinningKey = null; render(); });
    render();
  },
  pick(arg) { S.ui.pick = [0, 1, 2].includes(+arg) ? +arg : 0; render(); setTimeout(() => { if (S.ui.pick === 2) { const f = $("#leftInput"); if (f && !f.value) f.focus(); } }, 0); },
  reroll() { const G = G_(); S.ui.pair = drawPair(G, S.ui.pair || []); S.ui.pick = 0; render(); },
  submitClue() {
    const G = G_(); if (!G || !G.round || G.round.phase !== "think" || !S.ui.pair) return;
    if (getSecret(G) == null) return;
    const clue = String(S.drafts.clue || "").trim().slice(0, 60);
    if (S.mode === "online" && !clue) { toast("Напишите подсказку"); return; }
    let card = null, spec;
    if (S.ui.pick === 2) {
      const l = String(S.drafts.left || "").trim().slice(0, 32), rr = String(S.drafts.right || "").trim().slice(0, 32);
      if (!l || !rr) { toast("Заполните обе крайности шкалы"); return; }
      spec = [l, rr];
    } else { card = S.ui.pair[S.ui.pick]; spec = CARDS[card]; }
    const patch = { round: { card, spec, clue, phase: "guess", needle: 50, votes: null } };
    if (card != null) {
      let used = (G.used || []).concat([card]);
      if (used.length > CARDS.length - 4) used = [card];
      patch.used = used;
    }
    S.drafts.clue = ""; S.ui.peek = false;
    commit(patch);
  },
  nudge(arg) {
    const G = G_(); if (!G || G.round.phase !== "guess") return;
    const r = G.round, d = +arg || 0;
    if (S.mode === "local") { const v = clamp(r1(r.needle + d), 0, 100); r.needle = v; saveLocal(); dialG.setNeedle(v, true); return; }
    if (G.mode === "solo") {
      if (r.guesses && typeof r.guesses[S.uid] === "number") return;
      const v = clamp(r1(myGuessVal(r) + d), 0, 100);
      S.myGuess = { n: r.n, v }; pushSoloLive(r.n, v); dialG.setNeedle(v, true); return;
    }
    const v = clamp(r1(displayedNeedle(G) + d), 0, 100);
    S.needle = { n: r.n, v }; pushLiveNeedle(r.n, v); queueNeedleWrite(v);
    dialG.setNeedle(v, true);
  },
  /* Один телефон: фиксируем стрелку сразу */
  lock() {
    const G = G_(); if (!G || S.mode !== "local") return;
    const r = G.round; if (r.phase !== "guess") return;
    commit({ round: { needle: r1(r.needle), phase: G.mode === "teams" ? "side" : "reveal" } });
  },
  /* Онлайн: «Согласен» / «Отменить согласие» */
  vote() {
    const G = G_(); if (!G || S.mode !== "online") return;
    const r = G.round; if (r.phase !== "guess" || G.mode === "solo") return;
    if (r.votes && r.votes[S.uid]) { commit({ round: { votes: { [S.uid]: null } } }); return; }
    if (S.needleTimer) {
      clearTimeout(S.needleTimer); S.needleTimer = null;
      commit({ round: { needle: S.pendingNeedle, votes: LEAF({ [S.uid]: true }) } });
      return;
    }
    commit({ round: { votes: { [S.uid]: true } } });
  },
  side(arg) {
    const G = G_(); if (!G || G.round.phase !== "side") return;
    const sd = arg === "left" ? "left" : "right";
    if (S.mode === "local") { commit({ round: { side: sd, phase: "reveal" } }); return; }
    const cur = G.round.sideVotes && G.round.sideVotes[S.uid];
    commit({ round: { sideVotes: { [S.uid]: cur === sd ? null : sd } } });
  },
  guessDone() {
    const G = G_(); if (!G || G.mode !== "solo" || G.round.phase !== "guess") return;
    const v = r1(myGuessVal(G.round));
    pushSoloLive(G.round.n, v);
    commit({ round: { guesses: { [S.uid]: v } } });
  },
  guessEdit() {
    const G = G_(); if (!G || G.mode !== "solo" || G.round.phase !== "guess") return;
    const r = G.round, v = r.guesses && r.guesses[S.uid];
    if (typeof v === "number") S.myGuess = { n: r.n, v };
    commit({ round: { guesses: { [S.uid]: null } } });
  },
  force() { const G = G_(); if (G && isAdmin(G) && G.round.phase === "guess") commit({ round: { force: true } }); },
  ready() {
    const G = G_(); if (!G || S.mode !== "online" || G.round.phase !== "result") return;
    const on = G.round.ready && G.round.ready[S.uid];
    commit({ round: { ready: { [S.uid]: on ? null : true } } });
  },
  next() {
    const G = G_(); if (!G || S.mode !== "local" || !G.round || G.round.phase !== "result") return;
    resetRoundUI();
    commit(nextPatch(G, S.players, false));
  },
  skip() {
    const G = G_(); if (!G || !G.round || !canSkip(G)) return;
    confirmable("skip", () => {
      const G2 = G_(); if (!G2 || !G2.round) return;
      const r = G2.round;
      const history = (G2.history || []).concat([{ n: r.n, spec: specOf(r), clue: r.clue, skipped: true, pts: 0, team: r.team, psychic: r.psychic, sidePts: 0 }]).slice(-40);
      const np = nextPatch(Object.assign({}, G2, { round: Object.assign({}, r, { again: false }) }), S.players, S.mode === "online");
      resetRoundUI();
      commit(Object.assign(np, { history }));
    });
  },
  leave() {
    confirmable("leave", () => { if (S.mode === "online") leaveRoom(); else { S.mode = null; render(); } });
  },
  again() {
    const G = G_(); if (!G || !isAdmin(G)) return;
    if (S.mode === "local") { S.secret = null; store.del("wl.secret"); }
    resetRoundUI();
    commit({ status: "lobby", round: null, score: { coop: 0, t: [0, 0], p: {} }, history: [], turns: [0, 0] });
  },
  menu() { if (S.mode === "online") exitOnline(); else { S.mode = null; render(); } }
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
  for (const id of ["vHome", "vSetup", "vLobby", "vGame", "vOver"]) $("#" + id).hidden = id !== view;
  if (S.view !== view) { S.view = view; window.scrollTo(0, 0); keepAwake(view === "vGame"); }
}
const msg = html => `<p class="msg">${html}</p>`;
const segBtn = (act, arg, label, on) => `<button type="button" data-act="${act}" data-arg="${esc(arg)}" aria-pressed="${on ? "true" : "false"}">${esc(label)}</button>`;
const stepper = n => `<div class="stepper" role="group" aria-label="Количество раундов"><button type="button" data-act="rounds" data-arg="-1" aria-label="Меньше раундов"${n <= MIN_ROUNDS ? " disabled" : ""}>−</button><output aria-live="polite">${n}</output><button type="button" data-act="rounds" data-arg="1" aria-label="Больше раундов"${n >= MAX_ROUNDS ? " disabled" : ""}>+</button></div>`;
const goalStepper = n => `<div class="stepper" role="group" aria-label="Очков до победы"><button type="button" data-act="goal" data-arg="-1" aria-label="Меньше очков"${n <= MIN_GOAL ? " disabled" : ""}>−</button><output aria-live="polite">${n}</output><button type="button" data-act="goal" data-arg="1" aria-label="Больше очков"${n >= MAX_GOAL ? " disabled" : ""}>+</button></div>`;
const rulesText = (rules, G) => (rules[G.mode] || rules.coop).replace("{goal}", G.goal || 10);

function render() {
  try {
    const G = G_();
    if (S.mode === "online") {
      if (!G) { show("vLobby"); setHTML($("#vLobby"), msg(`Подключаемся к комнате <b>${esc(S.code)}</b><span class="dots"></span>`)); }
      else if (G.status === "over") renderOver();
      else if (G.status === "play" && G.round) renderGame();
      else renderLobby();
    } else if (S.mode === "local" && G) {
      if (G.status === "lobby") renderSetup();
      else if (G.status === "over") renderOver();
      else renderGame();
    } else renderHome();
    renderTop();
    tick();
  } catch (err) { console.error(err); }
}

function renderTop() {
  const G = G_();
  let html = "";
  if (G && G.round && G.status !== "lobby") html = scoreHTML(G);
  else if (S.mode === "online" && S.code) html = `<span class="chip">${esc(S.code)}</span>`;
  setHTML($("#topRight"), html);
}
function scoreHTML(G) {
  const roundChip = `<span class="chip">${Math.min(G.round ? G.round.n : 1, G.rounds)}/${G.rounds}</span>`;
  if (G.mode === "teams") {
    const a = G.round ? G.round.team : null;
    return [0, 1].map(t => `<span class="chip t${t}${a === t && G.status === "play" ? " is-active" : ""}" title="${TEAMS[t]}"><span class="tdot"></span>${TEAM_SHORT[t]} <b>${G.score.t[t]}</b></span>`).join("");
  }
  if (G.mode === "solo") return `<span class="chip">Вы <b>${(G.score.p || {})[S.uid] || 0}</b></span>${roundChip}`;
  return `<span class="chip"><b>${G.score.coop}</b> ${plural(G.score.coop, "очко", "очка", "очков")}</span>${roundChip}`;
}

/* Главная */
function renderHome() {
  show("vHome");
  let online;
  $("#vHome").classList.toggle("invited", !!S.hashCode && S.caps === "ok");
  if (S.caps === "wait") online = msg(`Подключаемся к серверу игры<span class="dots"></span>`);
  else if (S.caps === "noconfig") online = msg("Онлайн ещё не настроен: в assets/firebase.js нет конфига Firebase. Пока можно играть на одном телефоне.");
  else if (S.caps === "offline") online = msg("Не удалось загрузить Firebase. Проверьте интернет и обновите страницу. Пока можно играть на одном телефоне.");
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
  const saved = store.get("wl.local");
  const local = saved && saved.status === "play"
    ? `${msg(`Есть незаконченная партия: раунд ${saved.round ? saved.round.n : 1}.`)}<div class="row"><button class="btn btn-primary" type="button" data-act="localResume">Продолжить</button><button class="btn" type="button" data-act="local">Новая партия</button></div>`
    : `${msg("Все сидят рядом, телефон передают по кругу. Подходит для двоих и для компании.")}<button class="btn btn-block" type="button" data-act="local">Играть на одном телефоне</button>`;
  setHTML($("#homeLocal"), local);
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

/* Настройка игры на одном телефоне */
function renderSetup() {
  show("vSetup");
  const G = S.local, teams = G.mode === "teams";
  setHTML($("#vSetup"), `
    <div class="hero"><div class="eyebrow">Один телефон на всех</div><h1 class="h-sm">Игра за одним столом</h1></div>
    <p class="lead">Телефон передают экстрасенсу: он смотрит цель и даёт подсказку. Потом телефон кладут в центр, и все вместе ставят стрелку.</p>
    <div class="panel">
      <h2>Режим</h2>
      <div class="seg" role="group" aria-label="Режим">${segBtn("setMode", "coop", "Вместе", !teams)}${segBtn("setMode", "teams", "Две команды", teams)}</div>
      ${msg(rulesText(RULES_LOCAL, G))}
      ${teams ? `<div class="setting"><span class="label">Очков до победы</span>${goalStepper(G.goal || 10)}</div>` : `<div class="setting"><span class="label">Сколько раундов</span>${stepper(G.rounds)}</div>`}
    </div>
    <button class="btn btn-primary btn-block" type="button" data-act="start">Начать игру</button>
    <button class="btn-quiet" type="button" data-act="menu">Назад</button>`);
}

/* Фишка игрока */
function chipMark(G, seat) {
  const r = G && G.round;
  if (!r || G.status !== "play") return "";
  if (r.phase === "guess" && G.mode === "solo") return r.guesses && typeof r.guesses[seat] === "number" ? "✓" : "";
  if (r.phase === "guess") return r.votes && r.votes[seat] ? "✓" : "";
  if (r.phase === "side") { const v = r.sideVotes && r.sideVotes[seat]; return v === "left" ? "←" : v === "right" ? "→" : ""; }
  if (r.phase === "result") return r.ready && r.ready[seat] ? "✓" : "";
  return "";
}
function plChip(p, G) {
  const r = G && G.round;
  const dot = G && G.mode === "teams" ? `<span class="tdot t${p.team}"></span>` : `<span class="cdot" style="background:${colorOf(p.seat)}"></span>`;
  const tags = [];
  if (p.seat === S.uid) tags.push("вы");
  if (G && G.status === "play" && r && r.psychic === p.seat) tags.push("экстрасенс");
  if (G && adminSeat(G) === p.seat) tags.push("админ");
  const score = G && G.mode === "solo" && G.status !== "lobby" ? `<span class="sc">${(G.score.p || {})[p.seat] || 0}</span>` : "";
  const mk = chipMark(G, p.seat);
  return `<span class="pl${p.online ? "" : " is-off"}" title="${p.online ? "в сети" : "не в сети"}">${dot}<span class="nm">${esc(p.name || "Игрок")}</span>${tags.map(t => `<span class="tag">${t}</span>`).join("")}${score}${mk ? `<span class="mk">${mk}</span>` : ""}</span>`;
}

/* Лобби комнаты */
function renderLobby() {
  show("vLobby");
  const G = S.game, mode = MODE_NAMES[G.mode] ? G.mode : "coop", teams = mode === "teams";
  const admin = isAdmin(G), adminName = nameOf(adminSeat(G));
  const players = sortedPlayers(S.players);
  let canStart, why = "";
  if (teams) { canStart = teamMembers(S.players, 0).length >= 2 && teamMembers(S.players, 1).length >= 2; if (!canStart) why = "В каждой команде нужно минимум 2 игрока."; }
  else { canStart = players.length >= 2; if (!canStart) why = "Нужно минимум 2 игрока. Позовите кого-нибудь в комнату."; }
  const playersBlock = teams
    ? `<div class="teams">${[0, 1].map(t => { const mem = teamMembers(S.players, t); return `<div class="team t${t}"><div class="team-name"><span class="tdot"></span>${TEAMS[t]}</div>${mem.map(p => plChip(p, G)).join("") || `<span class="msg small">пока никого</span>`}</div>`; }).join("")}</div>
       <div class="row"><button class="btn" type="button" data-act="switchTeam"${myPlayer() ? "" : " disabled"}>Сменить команду</button>${admin ? `<button class="btn" type="button" data-act="shuffle">Перемешать</button>` : ""}</div>`
    : `<div class="players">${players.map(p => plChip(p, G)).join("")}</div>`;
  const roundsBlock = teams ? (admin
    ? `<div class="setting"><span class="label">Очков до победы</span>${goalStepper(G.goal)}</div>`
    : `<p class="msg">Игра до <b>${G.goal}</b> ${plural(G.goal, "очка", "очков", "очков")}</p>`) : (admin
    ? `<div class="setting"><span class="label">Сколько раундов</span>${stepper(G.rounds)}</div>`
    : `<p class="msg">Раундов: <b>${G.rounds}</b></p>`)
    + (mode === "solo" && players.length > 1 && G.rounds % players.length !== 0 ? `<p class="msg small">Чтобы каждый побыл экстрасенсом поровну, возьмите число раундов, кратное числу игроков (${players.length}).</p>` : "");
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
      <h2>Режим</h2>
      ${admin
        ? `<div class="seg" role="group" aria-label="Режим">${["coop", "teams", "solo"].map(m => segBtn("setMode", m, MODE_NAMES[m], mode === m)).join("")}</div>`
        : `<p class="mode-name">${MODE_NAMES[mode]}</p>`}
      ${msg(rulesText(RULES, Object.assign({}, G, { mode })))}
      ${roundsBlock}
      ${admin ? "" : `<p class="msg small">Настройки меняет админ — ${esc(adminName)}.</p>`}
    </div>
    <div class="panel">
      <h2>Игроки · ${players.length}</h2>
      ${playersBlock}
    </div>
    ${admin
      ? `${why ? msg(why) : ""}<button class="btn btn-primary btn-block" type="button" data-act="start"${canStart ? "" : " disabled"}>Начать игру</button>`
      : msg(`Игру начнёт <b>${esc(adminName)}</b>.${why ? " " + why : ""}`)}
    <button class="btn-quiet" type="button" data-act="leave">${confirmLabel("leave", "Выйти из комнаты")}</button>`);
}

/* Раунд */
function roleOf(G) {
  const r = G.round, me = myPlayer(), psy = r.psychic === S.uid;
  if (!me) return { psy, guess: false, opp: false };
  if (G.mode === "teams") return { psy, guess: !psy && me.team === r.team, opp: me.team !== r.team };
  return { psy, guess: !psy, opp: false };
}
function spectrumHTML(spec) {
  if (!spec) return `<div class="spectrum is-empty"><div class="spec-l">← ?</div><div class="spec-r">? →</div></div>`;
  return `<div class="spectrum"><div class="spec-l">← ${esc(spec[0] || "…")}</div><div class="spec-r">${esc(spec[1] || "…")} →</div></div>`;
}
/* Стрелки игроков для экстрасенса: принятый ответ — ярко, ещё двигают — бледно */
function soloMarks(G) {
  const r = G.round, out = [];
  for (const u of guessersOf(G)) {
    const done = r.guesses && typeof r.guesses[u] === "number" ? r.guesses[u] : null;
    const live = S.soloLive[u];
    if (done != null) out.push({ v: done, color: colorOf(u) });
    else if (live && live.n === r.n && typeof live.v === "number") out.push({ v: clamp(live.v, 0, 100), color: colorOf(u), draft: true });
  }
  return out;
}
function renderGame() {
  show("vGame");
  const G = G_(), r = G.round, online = S.mode === "online", solo = G.mode === "solo";
  const role = online ? roleOf(G) : null;
  const k = rKey(G);
  const isPsyView = online ? role.psy : (r.phase === "think" && S.ui.peek) || r.phase === "reveal";
  if (isPsyView && getSecret(G) == null && S.secretChecked !== k) loadSecret(G);
  const secret = getSecret(G);
  const spinning = S.ui.spinningKey === k;
  const st = online ? roundStatus(G) : null;

  setHTML($("#gHead"), `<div><div class="eyebrow">Раунд ${r.n}${G.mode !== "teams" ? ` из ${G.rounds}` : ` · до ${G.goal} · ход команды «${TEAMS[r.team]}»`}</div></div>`
    + (online ? `<div class="who">Экстрасенс: <b>${r.psychic === S.uid ? "вы" : esc(nameOf(r.psychic))}</b></div>` : ""));

  /* Шкала */
  let open = false, target = null, needle = null, live = false, marks = [];
  if (r.phase === "result") {
    open = true; target = r.target;
    if (solo) marks = Object.keys(r.guesses || {}).filter(u => typeof r.guesses[u] === "number").map(u => ({ v: r.guesses[u], color: colorOf(u) }));
    else needle = r.needle;
  } else if (online) {
    if (role.psy && secret != null) { open = true; target = secret; }
    if (solo && role.psy && r.phase === "guess") marks = soloMarks(G);
    if (solo) {
      if (r.phase === "guess" && role.guess) {
        const mine = r.guesses && typeof r.guesses[S.uid] === "number" ? r.guesses[S.uid] : null;
        needle = mine != null ? mine : myGuessVal(r);
        live = mine == null;
      }
    } else {
      if (r.phase !== "think") needle = r.phase === "guess" ? displayedNeedle(G) : r.needle;
      live = r.phase === "guess" && role.guess && !st.ready;
    }
  } else {
    if (r.phase === "think" && S.ui.peek && secret != null) { open = true; target = secret; }
    if (r.phase !== "think") needle = r.needle;
    live = r.phase === "guess";
  }
  if (spinning) open = true;
  dialG.setShutter(open, true);
  dialG.setTarget(target);
  dialG.setMarks(marks);
  dialG.setNeedle(needle, true);
  dialG.setInteractive(live);

  /* Карточка-шкала */
  let spec = specOf(r);
  const picking = r.phase === "think" && (online ? role.psy : S.ui.peek) && secret != null;
  if (picking) {
    ensurePair(G);
    spec = S.ui.pick === 2 ? [S.drafts.left.trim() || "…", S.drafts.right.trim() || "…"] : CARDS[S.ui.pair[S.ui.pick]];
  }
  setHTML($("#gSpectrum"), spectrumHTML(spec));

  const clueEl = $("#gClue");
  if (r.phase === "think") clueEl.hidden = true;
  else {
    clueEl.hidden = false;
    clueEl.classList.toggle("is-quiet", !r.clue);
    setHTML(clueEl, r.clue ? `<small>Подсказка</small>«${esc(r.clue)}»` : `<small>Подсказка</small>звучит вслух`);
  }

  setHTML($("#gPanel"), panelHTML(G, role, secret, spinning, st));
  updateClueBtn();

  setHTML($("#gPlayers"), online ? `<div class="players">${sortedPlayers(S.players).map(p => plChip(p, G)).join("")}</div>` : "");
  setHTML($("#gFoot"), (r.phase !== "result" && canSkip(G) ? `<button class="btn-quiet" type="button" data-act="skip">${confirmLabel("skip", "Пропустить раунд")}</button>` : "")
    + `<button class="btn-quiet" type="button" data-act="${online ? "leave" : "menu"}">${online ? confirmLabel("leave", "Выйти из комнаты") : "Выйти в меню"}</button>`);
}
const nudgeRow = (act, label, primary) => `<div class="row nudge"><button class="btn" type="button" data-act="nudge" data-arg="-1" aria-label="Стрелку чуть левее">‹</button><button class="btn${primary ? " btn-primary" : ""} grow" type="button" data-act="${act}">${label}</button><button class="btn" type="button" data-act="nudge" data-arg="1" aria-label="Стрелку чуть правее">›</button></div>`;
function openingMsg(G, text) {
  const r = G.round;
  if (S.online.has(r.psychic) || r.psychic === S.uid) return msg(`${text} Открываем шторку<span class="dots"></span>`);
  return msg(`${text} Шторку откроет экстрасенс <b>${esc(nameOf(r.psychic))}</b>, но он сейчас не в сети.`) + (isAdmin(G) ? `<button class="btn btn-block" type="button" data-act="skip">${confirmLabel("skip", "Пропустить раунд")}</button>` : "");
}
function panelHTML(G, role, secret, spinning, st) {
  const r = G.round, online = S.mode === "online", teams = G.mode === "teams", solo = G.mode === "solo";
  const k = rKey(G);
  if (r.phase === "think") {
    const psy = online ? role.psy : S.ui.peek;
    if (!psy) {
      if (online) return msg(`<b>${esc(nameOf(r.psychic))}</b> крутит диск и придумывает подсказку<span class="dots"></span>`);
      return msg(teams ? `Передайте телефон экстрасенсу команды <b>«${TEAMS[r.team]}»</b>. Остальные не смотрят на экран.` : "Передайте телефон тому, кто будет экстрасенсом в этом раунде. Остальные не смотрят на экран.")
        + `<button class="btn btn-primary btn-block" type="button" data-act="peek">Я экстрасенс — показать</button>`;
    }
    if (secret == null) {
      if (S.loadingSecret === k) return msg("Загружаем цель…");
      return msg("Вы экстрасенс. Проверьте, что экран никто не видит, и крутите диск.")
        + `<button class="btn btn-primary btn-block" type="button" data-act="spin">Крутануть диск</button>`;
    }
    if (spinning) return msg(`Диск крутится<span class="dots"></span>`);
    const [a, b] = S.ui.pair;
    return msg("Цель видна только вам. Выберите шкалу или задайте свою и придумайте подсказку, которая укажет на это место между крайностями.")
      + `<div class="opts" role="group" aria-label="Шкала">${[a, b].map((c, i) => `<button class="opt" type="button" data-act="pick" data-arg="${i}" aria-pressed="${S.ui.pick === i}"><span>${esc(CARDS[c][0])}</span><span class="arr">↔</span><span>${esc(CARDS[c][1])}</span></button>`).join("")}
        <button class="opt opt-own" type="button" data-act="pick" data-arg="2" aria-pressed="${S.ui.pick === 2}"><span>Своя шкала</span></button></div>
      ${S.ui.pick === 2
        ? `<div class="custom"><div class="field"><label for="leftInput">Левая крайность</label><input id="leftInput" data-draft="left" type="text" maxlength="32" autocomplete="off" placeholder="Например: тихо"></div><div class="field"><label for="rightInput">Правая крайность</label><input id="rightInput" data-draft="right" type="text" maxlength="32" autocomplete="off" placeholder="Например: громко"></div></div>`
        : `<button class="btn-quiet" type="button" data-act="reroll">Показать другие шкалы</button>`}
      <div class="field"><label for="clueInput">Подсказка${online ? "" : " — или скажите её вслух"}</label><input id="clueInput" data-draft="clue" type="text" maxlength="60" autocomplete="off" placeholder="Например: чай"></div>
      <button class="btn btn-primary btn-block" id="clueSubmit" type="button" data-act="submitClue">${online ? "Отправить подсказку" : "Готово — закрыть шторку"}</button>`;
  }
  if (r.phase === "guess") {
    if (!online) return msg(teams ? `Команда <b>«${TEAMS[r.team]}»</b> двигает стрелку туда, куда указывает подсказка. Договоритесь и фиксируйте.` : "Двигайте стрелку туда, куда указывает подсказка. Договоритесь и фиксируйте.")
      + nudgeRow("lock", "Фиксируем", true);
    if (solo) {
      const stat = `<p class="status">Ответили <b>${st.done.length} из ${st.req.length}</b></p>`;
      if (st.ready) return openingMsg(G, "Все ответили.");
      const force = isAdmin(G) && st.done.length > 0 && !r.force ? `<button class="btn-quiet" type="button" data-act="force">Не ждать остальных</button>` : "";
      if (role.psy) return msg("Игроки ставят свои стрелки, и вы видите их вживую: бледная — ещё думает, яркая — ответ принят. Остальные увидят стрелки, когда откроется шторка.") + stat + force;
      if (!role.guess) return msg("Игроки ставят стрелки.") + stat + force;
      const mine = r.guesses && typeof r.guesses[S.uid] === "number";
      if (mine) return msg("Ответ принят. Ждём остальных — все стрелки появятся у всех вместе со шторкой.") + stat + `<button class="btn btn-block" type="button" data-act="guessEdit">Изменить ответ</button>` + force;
      return msg("Поставьте свою стрелку туда, куда указывает подсказка. До открытия шторки её видит только экстрасенс.") + nudgeRow("guessDone", "Готово", true) + stat + force;
    }
    const stat = `<p class="status">Согласны <b>${st.done.length} из ${st.req.length}</b></p>`;
    if (st.ready) return teams ? msg(`Команда договорилась. Теперь слово соперникам<span class="dots"></span>`) : openingMsg(G, "Все согласны.");
    if (role.psy) return msg("Подсказка отправлена. Держите лицо: команда двигает стрелку, а вы видите, куда она смотрит.") + stat;
    if (!role.guess) return msg(teams ? `Отгадывает команда <b>«${TEAMS[r.team]}»</b>. Следите за стрелкой: потом вы решите, где цель — левее или правее.` : "Игроки двигают стрелку.") + stat;
    const voted = r.votes && r.votes[S.uid];
    return msg("Двигайте стрелку вместе. Когда все нажмут «Согласен», она зафиксируется. Сдвинули стрелку — согласия сбрасываются.")
      + nudgeRow("vote", voted ? "Отменить согласие" : "Согласен", !voted) + stat;
  }
  if (r.phase === "side") {
    const opp = TEAMS[1 - r.team];
    if (!online) return msg(`Слово команде <b>«${opp}»</b>. Цель левее или правее стрелки? Угадаете — +1 очко, если соперники не попали в «4».`)
      + `<div class="row"><button class="btn" type="button" data-act="side" data-arg="left">← Левее</button><button class="btn" type="button" data-act="side" data-arg="right">Правее →</button></div>`;
    const stat = `<p class="status">Выбрали <b>${st.done.length} из ${st.req.length}</b></p>`;
    if (st.ready) return openingMsg(G, st.side ? `Команда «${opp}» решила: цель ${st.side === "left" ? "левее" : "правее"}.` : "");
    const split = st.split ? msg("Мнения разделились — договоритесь.") : "";
    if (!role.opp) return msg(`Команда <b>«${opp}»</b> решает, где цель: левее или правее стрелки<span class="dots"></span>`) + stat + split;
    const my = r.sideVotes && r.sideVotes[S.uid];
    return msg("Цель левее или правее стрелки? Сторона засчитается, когда вся команда выберет одно и то же. Угадаете — +1 очко, если соперники не попали в «4».")
      + `<div class="row"><button class="btn${my === "left" ? " btn-primary" : ""}" type="button" data-act="side" data-arg="left" aria-pressed="${my === "left"}">← Левее</button><button class="btn${my === "right" ? " btn-primary" : ""}" type="button" data-act="side" data-arg="right" aria-pressed="${my === "right"}">Правее →</button></div>`
      + stat + split;
  }
  if (r.phase === "reveal") return msg(`Открываем шторку<span class="dots"></span>`);
  return resultHTML(G, st);
}
function resultHTML(G, st) {
  const r = G.round, teams = G.mode === "teams", solo = G.mode === "solo", online = S.mode === "online";
  const end = gameWillEnd(G);
  const words = { 4: "Точно в цель!", 3: "Совсем рядом", 2: "Почти", 0: "Мимо" };
  let body;
  if (solo) {
    const res = r.results || {};
    const rows = Object.keys(res).map(u => ({ u, p: res[u] })).sort((a, b) => b.p - a.p);
    const mine = res[S.uid];
    const title = r.psychic === S.uid ? `Вы экстрасенс: +${r.psyPts || 0}` : (typeof mine === "number" ? `${words[mine]} · +${mine}` : "Итоги раунда");
    body = `<div class="res-title">${title}</div>
      <div class="board res-solo">${rows.map(x => `<div class="board-row${x.u === S.uid ? " is-me" : ""}"><span class="rank"></span><span class="cdot" style="background:${colorOf(x.u)}"></span><span class="who">${esc(nameOf(x.u))}</span><span class="val">+${x.p}</span></div>`).join("") || msg("Никто не успел ответить.")}</div>
      ${msg(`Экстрасенс <b>${esc(nameOf(r.psychic))}</b> получает +${r.psyPts || 0} — по очку за каждого, кто попал в зону.`)}`;
  } else {
    const lines = [];
    if (teams) {
      lines.push(r.pts ? `${pts(r.pts)} команде «${TEAMS[r.team]}»` : `Команда «${TEAMS[r.team]}» без очков`);
      if (r.side) lines.push(r.sidePts ? `«${TEAMS[1 - r.team]}» угадали сторону: +1` : (r.pts === 4 ? "Попадание в «4» — соперникам очко не положено" : `«${TEAMS[1 - r.team]}» не угадали сторону`));
      if (r.again && !end) lines.push(`«${TEAMS[r.team]}» отставали и попали в «4» — ходят ещё раз`);
    } else lines.push(`Всего у команды ${pts(G.score.coop)}`);
    body = `<div class="result"><div class="pts${r.pts ? "" : " is-zero"}">${r.pts ? "+" + r.pts : "0"}</div><div><div class="res-title">${words[r.pts] || ""}</div>${lines.map(l => `<p class="msg">${l}</p>`).join("")}</div></div>`;
  }
  if (!online) return body + `<button class="btn btn-primary btn-block" type="button" data-act="next">${end ? "Итоги игры" : "Следующий раунд"}</button>`;
  const iReady = r.ready && r.ready[S.uid];
  const label = iReady ? "Отменить готовность" : (end ? "Готов — к итогам" : "Готов к следующему раунду");
  const status = st.ready ? msg(`Все готовы<span class="dots"></span>`) : `<p class="status">Готовы <b>${st.done.length} из ${st.req.length}</b></p>`;
  return body + `<button class="btn${iReady ? "" : " btn-primary"} btn-block" type="button" data-act="ready">${label}</button>` + status;
}
function updateClueBtn() {
  const b = $("#clueSubmit");
  if (!b) return;
  const needClue = S.mode === "online" && !String(S.drafts.clue || "").trim();
  const needSpec = S.ui.pick === 2 && (!String(S.drafts.left || "").trim() || !String(S.drafts.right || "").trim());
  b.disabled = needClue || needSpec;
}

/* Итоги */
function renderOver() {
  show("vOver");
  const G = G_(), teams = G.mode === "teams", solo = G.mode === "solo", online = S.mode === "online";
  let head;
  if (teams) {
    const [a, b] = G.score.t, w = a > b ? 0 : 1;
    head = `<div class="hero"><div class="eyebrow">Игра окончена</div><h1>Победили «${TEAMS[w]}»</h1><p class="big-score"><span class="t0">${a}</span> : <span class="t1">${b}</span></p></div>`;
  } else if (solo) {
    const sc = G.score.p || {};
    const rows = sortedPlayers(S.players).map(p => ({ p, s: sc[p.seat] || 0 })).sort((x, y) => y.s - x.s);
    const best = rows.length ? rows[0].s : 0, top = rows.filter(x => x.s === best).map(x => esc(x.p.name));
    head = `<div class="hero"><div class="eyebrow">Игра окончена</div><h1>${top.length > 1 ? `Ничья: ${top.join(" и ")}` : `Победа: ${top[0] || "—"}`}</h1></div>
      <div class="board">${rows.map((x, i) => `<div class="board-row${x.p.seat === S.uid ? " is-me" : ""}"><span class="rank">${i + 1}</span><span class="cdot" style="background:${colorOf(x.p.seat)}"></span><span class="who">${esc(x.p.name)}</span><span class="val">${x.s}</span></div>`).join("")}</div>`;
  } else {
    const max = G.rounds * 4, [title, line] = rating(G.score.coop / max);
    head = `<div class="hero"><div class="eyebrow">Игра окончена · ${G.score.coop} из ${max}</div><h1>${title}</h1><p class="lead">${line}</p></div>`;
  }
  const rows = (G.history || []).map(h => {
    const spec = Array.isArray(h.spec) ? h.spec : (h.card != null && CARDS[h.card] ? CARDS[h.card] : null);
    const card = spec ? `${esc(spec[0])} ↔ ${esc(spec[1])}` : "—";
    const clue = h.skipped ? "раунд пропущен" : (h.clue ? `«${esc(h.clue)}»` : "подсказка вслух");
    const who = online && h.psychic ? ` · ${esc(nameOf(h.psychic))}` : (teams && h.team != null ? ` · ${TEAM_SHORT[h.team]}` : "");
    let score;
    if (h.skipped) score = "—";
    else if (solo) { const res = h.results || {}; const hits = Object.keys(res).filter(u => res[u] > 0).length; score = `${hits}/${Object.keys(res).length}`; }
    else score = `+${h.pts}${h.sidePts ? ` <span class="side-pt t${1 - h.team}">+1</span>` : ""}`;
    return `<tr><td class="n">${h.n}</td><td>${card}<div class="msg small">${clue}${who}</div></td><td class="num">${score}</td></tr>`;
  }).join("");
  const again = isAdmin(G)
    ? `<button class="btn btn-primary btn-block" type="button" data-act="again">Сыграть ещё</button>`
    : msg(`Новую партию начнёт <b>${esc(nameOf(adminSeat(G)))}</b>.`);
  setHTML($("#vOver"), `${head}
    ${rows ? `<div class="panel"><h2>Как шли раунды</h2><div class="tbl"><table class="hist"><thead><tr><th>#</th><th>Шкала и подсказка</th><th class="num">${solo ? "Попали" : "Очки"}</th></tr></thead><tbody>${rows}</tbody></table></div></div>` : ""}
    ${again}
    <button class="btn-quiet" type="button" data-act="${online ? "leave" : "menu"}">${online ? confirmLabel("leave", "Выйти из комнаты") : "В меню"}</button>`);
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
  if (el.id === "leftInput" || el.id === "rightInput") render();
  updateClueBtn();
});
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || !e.target || e.target.tagName !== "INPUT") return;
  const id = e.target.id;
  if (id === "codeInput") ACT.join();
  else if (id === "clueInput") ACT.submitClue();
  else if (id === "lobbyNick") ACT.saveNick();
  else if (id === "homeNick") { if (S.hashCode) ACT.joinRoom(S.hashCode); else ACT.create(); }
});

/* ---------------- Шкалы на странице ---------------- */
const dialG = createDial($("#gameDial"), "game");
dialG.setInteractive(false, {
  input(v) {
    const G = G_(); if (!G || !G.round || G.round.phase !== "guess") return;
    if (S.mode === "local") { G.round.needle = r1(v); return; }
    if (G.mode === "solo") { S.myGuess = { n: G.round.n, v: r1(v) }; pushSoloLive(G.round.n, v); return; }
    if (!S.dragCleared) { S.dragCleared = true; clearVotesNow(); }
    S.needle = { n: G.round.n, v }; pushLiveNeedle(G.round.n, v);
  },
  commit(v) {
    S.dragCleared = false;
    const G = G_(); if (!G || !G.round || G.round.phase !== "guess") return;
    v = r1(v);
    if (S.mode === "local") { G.round.needle = v; saveLocal(); return; }
    if (G.mode === "solo") { S.myGuess = { n: G.round.n, v }; pushSoloLive(G.round.n, v); return; }
    S.needle = { n: G.round.n, v }; pushLiveNeedle(G.round.n, v); queueNeedleWrite(v);
  }
});
const demo = createDial($("#demoDial"), "demo");
const DEMO_TARGET = 77;
demo.setShutter(true, false);
demo.setTarget(DEMO_TARGET);
demo.setNeedle(71, false);
const demoScore = v => { const p = pointsFor(DEMO_TARGET, v); $("#demoScore").textContent = p ? pts(p) : "0 очков — мимо"; };
demo.setInteractive(true, { input: demoScore, commit: demoScore });

/* ---------------- Запуск ---------------- */
render();
initFirebase();
})();
