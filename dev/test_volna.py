"""Проверка «Поймай волну» на нескольких игроках без настоящего Firebase.

Запуск из корня репозитория:  python3 dev/test_volna.py
Нужно: Python 3 и Playwright (pip install playwright; playwright install chromium).
Скрипт поднимает локальный сервер, открывает игру в нескольких вкладках и подменяет Firebase
имитацией из dev/mockfb.js (вкладки делят одну базу через BroadcastChannel).
Сценарии: «Вместе» на троих, пустые комнаты, «Сам за себя» на троих, «Команды» на четверых.
"""
import asyncio, os, subprocess, sys, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MOCK = open(os.path.join(HERE, "mockfb.js"), encoding="utf-8").read()
URL = "http://localhost:8765/volna/index.html"
errs, fails = [], []

def check(cond, what):
    print(("  ok   " if cond else "  FAIL ") + what)
    if not cond: fails.append(what)

async def txt(pg, sel):
    return (await pg.inner_text(sel)).replace("\n", " ")

async def count(pg, sel):
    return await pg.locator(sel).count()

async def open_page(ctx, name, hash_=""):
    pg = await ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(f"{name}: {e}"))
    pg.on("console", lambda m: errs.append(f"{name}: {m.text}") if m.type == "error" and "ERR_FAILED" not in m.text else None)
    await pg.goto(URL + hash_)
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

async def psychic_of(pages):
    for _ in range(30):
        for pg in pages:
            if await count(pg, "[data-act=spin]"):
                return pg
        await pages[0].wait_for_timeout(100)
    return None

async def spin_and_clue(pg, clue, own=None, pick=0):
    await pg.click("[data-act=spin]")
    await pg.wait_for_timeout(3300)
    if own:
        await pg.click("[data-act=pick][data-arg='2']")
        await pg.fill("#leftInput", own[0]); await pg.fill("#rightInput", own[1])
    elif pick:
        await pg.click(f"[data-act=pick][data-arg='{pick}']")
    await pg.fill("#clueInput", clue)
    await pg.click("#clueSubmit")

async def main():
    srv = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "--directory", ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
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

            print("== Вместе: права, своя шкала, голосование, автошторка, готовность ==")
            A = await open_page(ctx, "A"); B = await open_page(ctx, "B"); C = await open_page(ctx, "C")
            code = await create(A, "Аня")
            await join(B, "Борис", code); await join(C, "Вика", code)
            await A.wait_for_selector("text=Игроки · 3")
            check(await count(A, "[data-act=rounds]") == 2, "у админа есть счётчик раундов")
            check(await count(B, "[data-act=rounds]") == 0 and await count(B, "[data-act=setMode]") == 0, "у игрока нет настроек")
            check(await count(B, "[data-act=start]") == 0, "у игрока нет кнопки «Начать»")
            await A.click("[data-act=rounds][data-arg='1']")
            await B.wait_for_selector("text=Раундов: 8")
            check(True, "счётчик: 7 → 8 видно у игрока")
            await A.click("[data-act=start]")
            await B.wait_for_selector("#vGame:not([hidden])")
            psy = await psychic_of([A, B, C])
            check(psy is A, "первый экстрасенс — создатель")
            check(await count(B, "[data-act=skip]") == 0, "игрок не видит «Пропустить раунд»")
            check(await count(A, "[data-act=skip]") == 1, "экстрасенс-админ видит «Пропустить раунд»")
            await spin_and_clue(A, "шёпот", own=("Тише воды", "Громче грома"))
            await B.wait_for_selector("[data-act=vote]")
            check("Тише воды" in await txt(B, "#gSpectrum") and "Громче грома" in await txt(B, "#gSpectrum"), "своя шкала видна игрокам")
            for _ in range(4): await B.click("[data-act=nudge][data-arg='-1']")
            await B.wait_for_timeout(500)
            await C.click("[data-act=vote]")
            await B.wait_for_timeout(300)
            check("Согласны 1 из 2" in await txt(B, "#gPanel"), "голос Вики засчитан (1 из 2)")
            await B.click("[data-act=nudge][data-arg='-1']")
            await B.wait_for_timeout(600)
            check("Согласны 0 из 2" in await txt(C, "#gPanel"), "сдвиг стрелки сбрасывает согласия")
            await B.click("[data-act=vote]"); await C.click("[data-act=vote]")
            await A.wait_for_selector("[data-act=ready]", timeout=4000)
            check(await count(A, "[data-act=reveal]") == 0, "шторка открылась сама, без кнопки")
            await C.wait_for_selector("[data-act=ready]")
            r_a, r_c = await txt(A, "#gPanel"), await txt(C, "#gPanel")
            check(r_a.split("Готов")[0] == r_c.split("Готов")[0], "итог раунда одинаковый у всех")
            await A.click("[data-act=ready]"); await B.click("[data-act=ready]")
            await A.wait_for_timeout(400)
            check("Готовы 2 из 3" in await txt(C, "#gPanel"), "готовность 2 из 3")
            await C.click("[data-act=ready]")
            await B.wait_for_selector("[data-act=spin]", timeout=4000)
            check("РАУНД 2" in (await txt(C, "#gHead")).upper(), "все готовы → раунд 2, экстрасенс Борис")
            check(await count(C, "[data-act=skip]") == 0 and await count(A, "[data-act=skip]") == 1 and await count(B, "[data-act=skip]") == 1, "пропуск: экстрасенс и админ — да, остальные — нет")

            print("== Пустые комнаты ==")
            for pg in (A, B, C):
                await pg.click("#gFoot [data-act=leave]"); await pg.click("#gFoot [data-act=leave]")
                await pg.wait_for_selector("#vHome:not([hidden])")
            await A.wait_for_timeout(300)
            check(code not in await txt(A, "#homeOnline"), "все вышли — комната пропала из списка")
            code2 = await create(A, "Аня")
            await B.wait_for_timeout(300)
            check(code2 in await txt(B, "#homeOnline"), "новая комната видна в списке")
            await A.evaluate("window.__mockDisconnect()")
            await B.wait_for_timeout(300)
            check(code2 not in await txt(B, "#homeOnline"), "создатель закрыл вкладку — комнаты нет в списке")
            await A.close()

            print("== Сам за себя ==")
            A = await open_page(ctx, "A2")
            code3 = await create(A, "Аня")
            await A.click("[data-act=setMode][data-arg=solo]")
            await join(B, "Борис", code3); await join(C, "Вика", code3)
            await A.wait_for_selector("text=Игроки · 3")
            for _ in range(5): await A.click("[data-act=rounds][data-arg='-1']")
            await A.click("[data-act=start]")
            await B.wait_for_selector("#vGame:not([hidden])")
            await spin_and_clue(A, "мурлыканье", pick=1)
            await B.wait_for_selector("[data-act=guessDone]")
            for _ in range(10): await B.click("[data-act=nudge][data-arg='-1']")
            await A.wait_for_timeout(400)
            check(await count(A, "#gameDial .d-mark.is-draft") == 1, "экстрасенс видит стрелку Бориса, пока тот думает")
            check(await count(C, "#gameDial .d-mark") == 0, "Вика не видит стрелку Бориса")
            await B.click("[data-act=guessDone]")
            await C.wait_for_timeout(400)
            check(await count(A, "#gameDial .d-mark") == 1 and await count(A, "#gameDial .d-mark.is-draft") == 0, "ответ Бориса принят — у экстрасенса стрелка яркая")
            check("Ответили 1 из 2" in await txt(C, "#gPanel"), "ответ Бориса засчитан, значение скрыто")
            check(await C.get_attribute("#gameDial", "aria-valuenow") == "50", "у Вики своя стрелка, чужая не видна")
            for _ in range(12): await C.click("[data-act=nudge][data-arg='1']")
            await C.click("[data-act=guessDone]")
            await A.wait_for_selector("[data-act=ready]", timeout=4000)
            marks = await A.evaluate("document.querySelector('#gameDial').children.length")
            panel = await txt(A, "#gPanel")
            check("Экстрасенс Аня получает" in panel, "у экстрасенса бонус за попадания")
            mk = await A.evaluate("(() => { const s=document.querySelector('#gameDial'); const g=[...s.children].filter(e=>e.tagName==='g'); return g.map(x=>x.children.length).join(','); })()")
            print("   группы шкалы:", mk)
            check(",2," in "," + mk + "," or ",2" in mk, "на шкале две цветные стрелки")
            print("   итог:", panel[:160])
            for pg in (A, B, C): await pg.click("[data-act=ready]")
            await B.wait_for_selector("[data-act=spin]", timeout=4000)
            await spin_and_clue(B, "ёжик")
            await A.wait_for_selector("[data-act=guessDone]")
            await A.click("[data-act=guessDone]")
            await B.wait_for_timeout(300)
            check(await count(B, "[data-act=force]") == 0, "«Не ждать» не видно не-админу")
            await A.click("[data-act=force]")
            await A.wait_for_selector("[data-act=ready]", timeout=4000)
            check(True, "админ открыл шторку, не дожидаясь Вики")
            for pg in (A, B, C): await pg.click("[data-act=ready]")
            await A.wait_for_selector("#vOver:not([hidden])", timeout=4000)
            over_b = await txt(B, "#vOver")
            check("ИГРА ОКОНЧЕНА" in over_b.upper() and "Новую партию начнёт" in over_b, "итоги: таблица и «новую партию начнёт админ»")
            print("   итоги:", over_b[:200])
            

            print("== Команды на четверых ==")
            D = await open_page(ctx, "D")
            await A.click("[data-act=again]")
            await A.wait_for_selector("#vLobby .code")
            await A.click("[data-act=setMode][data-arg=teams]")
            await join(D, "Гоша", code3)
            await A.wait_for_selector("text=Игроки · 4")
            check(await count(A, "[data-act=goal]") == 2 and await count(B, "[data-act=goal]") == 0, "очки до победы меняет только админ")
            await A.click("[data-act=goal][data-arg='-1']")
            await B.wait_for_selector("text=Игра до 9 очков")
            check("набравшая 9" in await txt(B, "#vLobby"), "очки до победы: 10 → 9 видно у игрока и в правилах")
            await A.click("[data-act=shuffle]")
            await A.wait_for_timeout(400)
            await A.click("[data-act=start]")
            pages = [A, B, C, D]
            await B.wait_for_selector("#vGame:not([hidden])")
            await A.wait_for_timeout(300)
            psy = await psychic_of(pages)
            if psy is None:
                for i, pg in enumerate(pages):
                    print("   стр.", i, await pg.evaluate("document.querySelector('main section:not([hidden])')?.id"), (await txt(pg, "#gPanel"))[:90], "|", (await txt(pg, "#vLobby"))[:120] if await pg.is_visible("#vLobby") else "")
            check("ДО 9" in (await txt(B, "#gHead")).upper(), "в шапке раунда видно, до скольких очков игра")
            await spin_and_clue(psy, "кофе")
            await A.wait_for_timeout(500)
            voters = [pg for pg in pages if await count(pg, "[data-act=vote]")]
            check(len(voters) == 1, "в команде экстрасенса голосует один игрок")
            await voters[0].click("[data-act=vote]")
            await A.wait_for_timeout(600)
            opps = [pg for pg in pages if await count(pg, "[data-act=side]")]
            check(len(opps) == 2, "соперники выбирают сторону")
            await opps[0].click("[data-act=side][data-arg=left]"); await opps[1].click("[data-act=side][data-arg=right]")
            await A.wait_for_timeout(400)
            check("Мнения разделились" in await txt(opps[0], "#gPanel"), "разные стороны — «мнения разделились»")
            await opps[1].click("[data-act=side][data-arg=left]")
            await A.wait_for_selector("[data-act=ready]", timeout=4000)
            res = await txt(B, "#gPanel")
            check("сторону" in res or "очко не положено" in res, "сторона учтена в итоге")
            print("   итог:", res[:160])
            await b.close()
    finally:
        srv.terminate()
    print("ERRORS:", errs)
    print("FAILS:", fails)

asyncio.run(main())
