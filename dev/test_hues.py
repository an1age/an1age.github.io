"""Проверка «Оттенков» на нескольких игроках без настоящего Firebase.

Запуск из корня репозитория:  python3 dev/test_hues.py
Нужно: Python 3 и Playwright (pip install playwright; playwright install chromium).
Скрипт поднимает локальный сервер, открывает игру в нескольких вкладках и подменяет Firebase
имитацией из dev/mockfb.js (вкладки делят одну базу через BroadcastChannel).
Сценарии: «Каждый за себя» на троих (права админа, подсказки и запретные слова, скрытые фишки,
второй круг, очки, «Не ждать остальных», пропуск, итоги), «Команды» на четверых на большой палитре
(общая фишка и согласия, клавиатура, перехват, раскладка для компьютера), пустые комнаты.
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

async def tap_cell(pg, row, col, cols=COLS, rows=ROWS):
    b = await pg.locator("#gameGrid .marks").bounding_box()
    await pg.mouse.click(b["x"] + (col + .5) * b["width"] / cols, b["y"] + (row + .5) * b["height"] / rows)

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
            await A.fill("#clueInput", "как утро на даче, когда на столе стоит банка варенья")
            await A.wait_for_timeout(100)
            check(not await A.is_disabled("#clueSubmit"), "подсказка может быть целой историей")
            await A.fill("#clueInput", "закат и белый песок")
            await A.wait_for_timeout(100)
            check(await A.is_disabled("#clueSubmit"), "основной цвет внутри длинной подсказки тоже запрещён")
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
            await give_clue(A, "спелый апельсин, который неделю пролежал на солнце у бабушки на подоконнике")
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

            print("== Команды на четверых, большая палитра, компьютер ==")
            D = await open_page(ctx, "D")
            await join(D, "Гоша", code)
            await A.wait_for_selector("text=Игроки · 4")
            await A.click("[data-act=setMode][data-arg=teams]")
            await A.click("[data-act=setSize][data-arg=l]")
            await B.wait_for_selector("text=Всего раундов: 4")
            check("Большая" in await txt(B, "#vLobby") and "Акварель" in await txt(B, "#vLobby"), "игроки видят режим, палитру и составы команд")
            check(await count(B, "[data-act=setSize]") == 0 and await count(B, "[data-act=shuffle]") == 0, "палитру и составы меняет только админ")
            await A.click("[data-act=start]")
            pages = [A, B, C, D]
            await B.wait_for_selector("#vGame:not([hidden])")
            check(await count(B, "#gameGrid .cells i") == 30 * 16, "большая палитра 30×16")
            g = await giver_of(pages)
            await g.click("[data-act=draw]")
            await give_clue(g, "закат")
            await A.wait_for_timeout(500)
            mates = [pg for pg in pages if await count(pg, "[data-act=vote]")]
            check(len(mates) == 1, "общую фишку двигает команда ведущего (без ведущего)")
            mate = mates[0]
            others = [pg for pg in pages if pg is not g and pg is not mate]
            await tap_cell(mate, 3, 4, 30, 16)
            await A.wait_for_timeout(400)
            check(all([await count(pg, "#gameGrid .cone") == 1 for pg in others]), "общая фишка видна всем")
            check(await count(others[0], "#gameGrid.is-live") == 0, "соперники не могут двигать фишку команды")
            await mate.click("[data-act=vote]")
            await g.wait_for_selector("#clueSubmit", timeout=4000)
            await give_clue(g, "тёплый вечер")
            await mate.wait_for_selector("[data-act=vote]")
            await tap_cell(mate, 3, 4, 30, 16)
            await mate.wait_for_timeout(300)
            check(await mate.is_disabled("[data-act=vote]"), "вторую фишку нельзя ставить на клетку первой")
            await mate.keyboard.press("ArrowRight")
            await mate.wait_for_timeout(300)
            check("D6" in await txt(mate, "#gPanel"), "стрелка на клавиатуре двигает общую фишку")
            await mate.keyboard.press("Enter")
            await A.wait_for_timeout(700)
            opps = [pg for pg in pages if await count(pg, "[data-act=vote]")]
            check(len(opps) == 2 and mate not in opps, "перехват ставят соперники")
            tgt = await g.evaluate("JSON.parse(localStorage.getItem('hu.secret')).target")
            near = tgt in (3 * 30 + 4, 3 * 30 + 5)
            await tap_cell(opps[0], tgt // 30, tgt % 30, 30, 16) if not near else await tap_cell(opps[0], 10, 10, 30, 16)
            await opps[0].click("[data-act=vote]")
            await A.wait_for_timeout(400)
            check("Согласны 1 из 2" in await txt(opps[1], "#gPanel"), "согласие соперника засчитано")
            await opps[1].click("[data-act=nudge][data-arg=d]")
            await A.wait_for_timeout(400)
            check("Согласны 0 из 2" in await txt(opps[0], "#gPanel"), "сдвиг перехвата сбрасывает согласия")
            await opps[1].click("[data-act=nudge][data-arg=u]")
            await A.wait_for_timeout(300)
            for pg in opps: await pg.click("[data-act=vote]")
            await B.wait_for_selector("[data-act=ready]", timeout=4000)
            res = await txt(B, "#gPanel")
            print("   итог:", res[:180])
            check("Команде" in res and await count(B, "#gameGrid .cone") == 3, "итог: очки команды, две фишки и перехват")
            if not near: check("+1" in res and "соперникам" in res, "перехват точно в цвет — +1 соперникам")
            top = await txt(C, "#topRight")
            check("АК" in top and "ГУ" in top, "счёт команд в шапке")

            await A.set_viewport_size({"width": 1366, "height": 900})
            await A.wait_for_timeout(300)
            gb = await A.locator("#gameGrid").bounding_box(); pb = await A.locator("#gPanel").bounding_box()
            print("   раскладка:", gb, pb, await A.is_visible("#gBoard"), await A.is_visible("#gameGrid .ax-top"))
            check(pb["x"] > gb["x"] + gb["width"] and await A.is_visible("#gBoard") and await A.is_visible("#gameGrid .ax-top"), "на компьютере: палитра слева, панель и таблица справа, подписи осей")
            check(gb["width"] > 700, f"палитра на компьютере крупная ({int(gb['width'])}px)")
            check(not await A.is_visible("#gBoard") or not await B.is_visible("#gBoard"), "на телефоне боковой таблицы нет")
            for pg in pages: await pg.click("[data-act=ready]")
            g2 = await giver_of(pages)
            check(g2 is not None and g2 is not g and g2 is not mate, "следующий ход у другой команды")
            for _ in range(3):
                if await A.is_visible("#vOver"): break
                await A.click("#gFoot [data-act=skip]"); await A.click("#gFoot [data-act=skip]")
                await A.wait_for_timeout(500)
            await B.wait_for_selector("#vOver:not([hidden])", timeout=4000)
            over = await txt(B, "#vOver")
            check(("Победили" in over or "Ничья" in over) and "Как шли раунды" in over, "итоги команд")
            print("   итоги:", over[:160])
            await A.click("[data-act=again]")
            await D.wait_for_selector("#vLobby .code")
            await D.click("[data-act=leave]"); await D.click("[data-act=leave]")
            await D.wait_for_selector("#vHome:not([hidden])")

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
