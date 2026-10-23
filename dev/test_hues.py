"""Проверка «Оттенков» на нескольких игроках без настоящего Firebase.

Запуск из корня репозитория:  python3 dev/test_hues.py
Нужно: Python 3 и Playwright (pip install playwright; playwright install chromium).
Скрипт поднимает локальный сервер, открывает игру в нескольких вкладках и подменяет Firebase
имитацией из dev/mockfb.js (вкладки делят одну базу через BroadcastChannel).
Сценарии: права админа, подсказки и запретные слова, скрытые фишки, второй круг, очки,
«Не ждать остальных», пропуск раунда, итоги, пустые комнаты.
"""
import asyncio, os, subprocess, sys, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MOCK = open(os.path.join(HERE, "mockfb.js"), encoding="utf-8").read()
URL = "http://localhost:8766/hues/index.html"
COLS, ROWS = 24, 14
errs, fails = [], []

def check(cond, what):
    print(("  ok   " if cond else "  FAIL ") + what)
    if not cond: fails.append(what)

async def txt(pg, sel):
    return (await pg.inner_text(sel)).replace("\n", " ")

async def count(pg, sel):
    return await pg.locator(sel).count()

async def open_page(ctx, name):
    pg = await ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(f"{name}: {e}"))
    pg.on("console", lambda m: errs.append(f"{name}: {m.text}") if m.type == "error" and "ERR_FAILED" not in m.text else None)
    await pg.goto(URL)
    await pg.wait_for_selector("#homeNick")
    return pg

async def create(pg, nick):
    await pg.fill("#homeNick", nick)
    await pg.click("[data-act=create]")
    await pg.wait_for_selector("#vLobby .code")
    return (await pg.inner_text("#vLobby .code")).strip()

async def join(pg, nick, code):
    await pg.fill("#homeNick", nick)
    await pg.fill("#codeInput", code)
    await pg.click("[data-act=join]")
    await pg.wait_for_selector("#vLobby .code")

async def tap_cell(pg, row, col):
    b = await pg.locator("#gameGrid .marks").bounding_box()
    await pg.mouse.click(b["x"] + (col + .5) * b["width"] / COLS, b["y"] + (row + .5) * b["height"] / ROWS)

async def giver_of(pages):
    for _ in range(40):
        for pg in pages:
            if await count(pg, "[data-act=draw]"):
                return pg
        await pages[0].wait_for_timeout(100)
    return None

async def give_clue(pg, clue):
    await pg.fill("#clueInput", clue)
    await pg.click("#clueSubmit")

async def main():
    srv = subprocess.Popen([sys.executable, "-m", "http.server", "8766", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.8)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            ctx = await b.new_context(viewport={"width": 390, "height": 900})
            async def route(r):
                u = r.request.url
                if "firebase-app-compat" in u: await r.fulfill(status=200, content_type="application/javascript", body=MOCK)
                elif "firebasejs" in u: await r.fulfill(status=200, content_type="application/javascript", body="")
                elif "fonts.g" in u: await r.abort()
                else: await r.continue_()
            await ctx.route("**/*", route)

            print("== Лобби и права ==")
            A = await open_page(ctx, "A"); B = await open_page(ctx, "B"); C = await open_page(ctx, "C")
            check(await count(A, "#demoGrid .cells i") == COLS * ROWS, f"на главной палитра {COLS}×{ROWS}")
            code = await create(A, "Аня")
            await join(B, "Борис", code); await join(C, "Вика", code)
            await A.wait_for_selector("text=Игроки · 3")
            check(await count(A, "[data-act=laps]") == 2, "у админа есть настройка кругов")
            check(await count(B, "[data-act=laps]") == 0 and await count(B, "[data-act=start]") == 0, "у игрока нет настроек и «Начать»")
            await A.click("[data-act=laps][data-arg='-1']")
            await B.wait_for_selector("text=Всего раундов: 3")
            check(True, "один круг на троих → 3 раунда, видно у игрока")
            await A.click("[data-act=start]")
            await B.wait_for_selector("#vGame:not([hidden])")

            print("== Раунд 1: подсказки, скрытые фишки, второй круг, очки ==")
            g = await giver_of([A, B, C])
            check(g is A, "первый ведущий — создатель")
            check(await count(B, "[data-act=skip]") == 0 and await count(A, "[data-act=skip]") == 1, "пропуск: у ведущего-админа есть, у игрока нет")
            await A.click("[data-act=draw]")
            check(await count(A, ".card button") == 4 and await count(A, "#gameGrid .cand") == 4, "карточка: 4 цвета, отмечены на палитре")
            check(await count(B, "#gameGrid .cand") == 0, "игрок не видит карточку ведущего")
            await A.click(".card button[data-arg='2']")
            await A.fill("#clueInput", "красный")
            await A.wait_for_timeout(100)
            check(await A.is_disabled("#clueSubmit") and "Основные цвета" in await txt(A, "#clueWarn"), "основной цвет как подсказка запрещён")
            await A.fill("#clueInput", "два слова")
            await A.wait_for_timeout(100)
            check(await A.is_disabled("#clueSubmit"), "первая подсказка — только одно слово")
            await give_clue(A, "мандарин")
            await B.wait_for_selector("[data-act=place]")
            check("мандарин" in await txt(C, "#gClue"), "подсказка видна игрокам")
            check(await count(A, "#gameGrid .tgt") == 1 and await count(B, "#gameGrid .tgt") == 0, "цель видит только ведущий")
            check(await B.is_disabled("[data-act=place]"), "без выбранной клетки ставить нельзя")
            await tap_cell(B, 3, 4)
            await B.wait_for_timeout(150)
            check("D5" in await txt(B, "#gPanel"), "нажатие на палитру выбирает клетку D5")
            await B.click("[data-act=place]")
            await C.wait_for_timeout(400)
            check("Поставили 1 из 2" in await txt(C, "#gPanel"), "фишка Бориса засчитана")
            check(await count(C, "#gameGrid .cone") == 0, "чужую фишку не видно до конца круга")
            await C.click("[data-act=nudge][data-arg=r]")
            await C.click("[data-act=place]")
            await A.wait_for_selector("#clueSubmit", timeout=4000)
            await B.wait_for_timeout(300)
            check(await count(B, "#gameGrid .cone") == 2, "все ответили → первые фишки открыты всем")
            await A.fill("#clueInput", "три слова тут")
            await A.wait_for_timeout(100)
            check(await A.is_disabled("#clueSubmit"), "вторая подсказка — не больше двух слов")
            await give_clue(A, "спелый апельсин")
            await C.wait_for_selector("[data-act=place]")
            check("спелый апельсин" in await txt(B, "#gClue") and "мандарин" in await txt(B, "#gClue"), "видны обе подсказки")
            await tap_cell(B, 7, 13)
            await B.wait_for_timeout(150)
            check(await B.is_disabled("[data-act=place]") and "занято" in await txt(B, "#gPanel"), "на клетку с фишкой ставить нельзя")
            await B.click("[data-act=nudge][data-arg=u]")
            await B.click("[data-act=place]")
            await C.click("[data-act=nudge][data-arg=l]")
            await C.click("[data-act=place]")
            await B.wait_for_selector("[data-act=ready]", timeout=4000)
            await A.wait_for_selector("[data-act=ready]")
            check(await count(B, "#gameGrid .tgt") == 1 and await count(B, "#gameGrid .cone") == 4, "итог: цель с рамкой и 4 фишки")
            ra, rc = await txt(A, "#gPanel .board"), await txt(C, "#gPanel .board")
            check(ra == rc, "таблица раунда одинаковая у всех")
            check("Ведущий Аня получает" in await txt(B, "#gPanel"), "очки ведущему")
            print("   итог:", (await txt(B, "#gPanel"))[:160])
            await A.click("[data-act=ready]"); await B.click("[data-act=ready]")
            await A.wait_for_timeout(400)
            check("Готовы 2 из 3" in await txt(C, "#gPanel"), "готовность 2 из 3")
            await C.click("[data-act=ready]")
            g = await giver_of([A, B, C])
            check(g is B, "все готовы → раунд 2, ведущий Борис")

            print("== Раунд 2: «Не ждать остальных» ==")
            await B.click("[data-act=draw]")
            await give_clue(B, "небо")
            await A.wait_for_selector("[data-act=place]")
            check(await count(C, "[data-act=force]") == 0, "«Не ждать» не видно не-админу")
            tgt = await B.evaluate("JSON.parse(localStorage.getItem('hu.secret')).target")
            await tap_cell(A, tgt // COLS, tgt % COLS)
            await A.click("[data-act=place]")
            await A.wait_for_selector("[data-act=force]")
            await A.click("[data-act=force]")
            await B.wait_for_selector("#clueSubmit", timeout=4000)
            check(True, "админ не стал ждать Вику — ведущий даёт вторую подсказку")
            await give_clue(B, "летнее небо")
            await C.wait_for_selector("[data-act=place]")
            await C.click("[data-act=nudge][data-arg=u]")
            await C.click("[data-act=place]")
            await A.click("[data-act=nudge][data-arg=r]")
            await A.click("[data-act=place]")
            await C.wait_for_selector("[data-act=ready]", timeout=4000)
            res = await txt(A, "#gPanel")
            check("Вам +" in res and "3 + " in res, "точно в цвет — 3 очка за первую фишку")
            check("получает +0" not in res, "ведущий получил очко за фишку в рамке")
            print("   итог:", res[:160])
            for pg in (A, B, C): await pg.click("[data-act=ready]")
            g = await giver_of([A, B, C])
            check(g is C, "раунд 3, ведущая Вика")

            print("== Пропуск и итоги ==")
            await A.click("#gFoot [data-act=skip]"); await A.click("#gFoot [data-act=skip]")
            await B.wait_for_selector("#vOver:not([hidden])", timeout=4000)
            over = await txt(B, "#vOver")
            check("ИГРА ОКОНЧЕНА" in over.upper() and "раунд пропущен" in over and "Новую партию начнёт" in over, "итоги: таблица, история, пропущенный раунд")
            print("   итоги:", over[:220])
            await A.click("[data-act=again]")
            await C.wait_for_selector("#vLobby .code")
            check(True, "«Сыграть ещё» возвращает всех в лобби")

            print("== Пустые комнаты ==")
            for pg in (A, B, C):
                await pg.click("[data-act=leave]"); await pg.click("[data-act=leave]")
                await pg.wait_for_selector("#vHome:not([hidden])")
            await A.wait_for_timeout(300)
            check(code not in await txt(A, "#homeOnline"), "все вышли — комната пропала из списка")
            code2 = await create(A, "Аня")
            await B.wait_for_timeout(300)
            check(code2 in await txt(B, "#homeOnline"), "новая комната видна в списке")
            await A.evaluate("window.__mockDisconnect()")
            await B.wait_for_timeout(300)
            check(code2 not in await txt(B, "#homeOnline"), "создатель закрыл вкладку — комнаты нет в списке")
            tree = await B.evaluate("JSON.stringify(Object.keys(window.__mockTree()))")
            check(tree == '["hues"]', "данные лежат только под hues/")
            await b.close()
    finally:
        srv.terminate()
    print("ERRORS:", errs)
    print("FAILS:", fails)

asyncio.run(main())
