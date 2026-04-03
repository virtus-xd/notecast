"""Deep debug — capture ALL requests and JS errors."""
import time, os
from playwright.sync_api import sync_playwright

BASE = "https://notcast-web.vercel.app"
EMAIL = f"deep{int(time.time())}@mailinator.com"
PASSWORD = "Test1234!"
SCREENSHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_screenshots")
os.makedirs(SCREENSHOTS, exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    all_requests = []
    failed_requests = []
    console_all = []

    page.on("request",  lambda r: all_requests.append((r.method, r.url)))
    page.on("response", lambda r: all_requests.append((r.status, r.url)))
    page.on("requestfailed", lambda r: failed_requests.append((r.failure, r.url)))
    page.on("console", lambda m: console_all.append((m.type, m.text)))
    page.on("pageerror", lambda e: console_all.append(("PAGEERROR", str(e))))

    page.goto(f"{BASE}/register", wait_until="networkidle", timeout=20000)

    inputs = page.locator("input").all()
    inputs[0].fill("Deep Debug")
    inputs[1].fill(EMAIL)
    inputs[2].fill(PASSWORD)

    page.locator("button[type='submit']").click()
    page.wait_for_load_state("networkidle", timeout=25000)
    page.wait_for_timeout(5000)

    # Check localStorage state
    local_storage = page.evaluate("""() => ({
        token: localStorage.getItem('notcast-auth-token'),
        refresh: localStorage.getItem('notcast-refresh-token'),
    })""")

    final_url = page.url
    page.screenshot(path=f"{SCREENSHOTS}/deep_after.png", full_page=True)

    print(f"\nEmail: {EMAIL}")
    print(f"Final URL: {final_url}")
    print(f"\nLocalStorage after submit: {local_storage}")

    print(f"\nAll calls to notcast-server:")
    for item in all_requests:
        s = str(item)
        if "notcast-server" in s or "render.com" in s:
            print(f"  {item}")

    print(f"\nAll console messages:")
    for typ, text in console_all:
        print(f"  [{typ}] {text[:200]}")

    if failed_requests:
        print(f"\nFailed requests:")
        for f, u in failed_requests:
            print(f"  FAIL: {f} | {u}")

    browser.close()
