"""Test register auto-login fix."""
import time, os
from playwright.sync_api import sync_playwright

BASE = "https://notcast-web.vercel.app"
EMAIL = f"autotest{int(time.time())}@mailinator.com"
PASSWORD = "Test1234!"
SCREENSHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_screenshots")
os.makedirs(SCREENSHOTS, exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    page = browser.new_context(viewport={"width": 1280, "height": 800}).new_page()

    api_calls = []
    page.on("response", lambda r: api_calls.append((r.status, r.url)) if "/api/" in r.url else None)

    page.goto(f"{BASE}/register", wait_until="networkidle", timeout=20000)
    inputs = page.locator("input").all()
    inputs[0].fill("Auto Test")
    inputs[1].fill(EMAIL)
    inputs[2].fill(PASSWORD)
    page.locator("button[type='submit']").click()
    page.wait_for_load_state("networkidle", timeout=20000)
    page.wait_for_timeout(2000)

    final_url = page.url
    page.screenshot(path=f"{SCREENSHOTS}/fix_after_register.png", full_page=True)

    print(f"Email: {EMAIL}")
    print(f"Final URL: {final_url}")
    print(f"API calls: {api_calls}")

    if "/dashboard" in final_url:
        print("PASS: Register auto-login works!")
    elif "/login" in final_url:
        print("FAIL: Still redirecting to login")
    else:
        print(f"UNKNOWN: unexpected URL {final_url}")

    browser.close()
