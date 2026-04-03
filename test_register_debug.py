"""Debug register auto-login — capture console errors and all network."""
import time, os
from playwright.sync_api import sync_playwright

BASE = "https://notcast-web.vercel.app"
EMAIL = f"dbg{int(time.time())}@mailinator.com"
PASSWORD = "Test1234!"
SCREENSHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_screenshots")
os.makedirs(SCREENSHOTS, exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    api_calls = []
    console_msgs = []

    page.on("response", lambda r: api_calls.append((r.status, r.url)))
    page.on("console", lambda m: console_msgs.append(f"[{m.type}] {m.text}"))
    page.on("pageerror", lambda e: console_msgs.append(f"[PAGEERROR] {e}"))

    page.goto(f"{BASE}/register", wait_until="networkidle", timeout=20000)
    inputs = page.locator("input").all()
    inputs[0].fill("Debug User")
    inputs[1].fill(EMAIL)
    inputs[2].fill(PASSWORD)

    page.locator("button[type='submit']").click()

    # Wait longer for both register + auto-login
    page.wait_for_load_state("networkidle", timeout=25000)
    page.wait_for_timeout(3000)

    final_url = page.url
    page.screenshot(path=f"{SCREENSHOTS}/dbg_after_register.png", full_page=True)

    print(f"\nEmail: {EMAIL}")
    print(f"Final URL: {final_url}")

    print(f"\nAll API calls:")
    for status, url in api_calls:
        if "notcast" in url or "vercel" in url:
            print(f"  {status} {url}")

    print(f"\nConsole messages (errors/warnings):")
    for m in console_msgs:
        if "[error]" in m.lower() or "[warn]" in m.lower() or "PAGEERROR" in m:
            print(f"  {m}")

    if "/dashboard" in final_url:
        print("\nRESULT: PASS - auto-login works!")
    elif "/login" in final_url:
        print("\nRESULT: FAIL - old code still (redirected to login)")
    else:
        print(f"\nRESULT: STUCK on {final_url}")

    browser.close()
