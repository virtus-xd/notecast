"""NotCast web app test — register, explore all pages, screenshot each step."""

import os
import time
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

SCREENSHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_screenshots")
BASE = "https://notcast-web.vercel.app"
EMAIL = f"testuser{int(time.time())}@mailinator.com"
PASSWORD = "Test1234!"
NAME = "Test User"

os.makedirs(SCREENSHOTS, exist_ok=True)

results = []

def log(step, status, note=""):
    results.append({"step": step, "status": status, "note": note})
    icon = "[OK]" if status == "OK" else "[FAIL]" if status == "FAIL" else "[WARN]"
    print(f"{icon} [{step}] {note}")

def ss(page, name):
    path = f"{SCREENSHOTS}/{name}.png"
    page.screenshot(path=path, full_page=True)
    return path

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()

    # ── 1. Landing / Home ──────────────────────────────────────
    try:
        page.goto(f"{BASE}/home", wait_until="networkidle", timeout=20000)
        ss(page, "01_home")
        title = page.title()
        log("Landing Page", "OK", f"title={title}")
    except Exception as e:
        log("Landing Page", "FAIL", str(e))

    # ── 2. Register ────────────────────────────────────────────
    try:
        page.goto(f"{BASE}/register", wait_until="networkidle", timeout=20000)
        ss(page, "02_register_page")
        page.wait_for_selector("input[type='email'], input[name='email']", timeout=8000)

        # fill form
        page.fill("input[type='email'], input[name='email']", EMAIL)
        page.fill("input[type='password']:first-of-type, input[name='password']", PASSWORD)

        # name field
        name_sel = "input[name='name'], input[placeholder*='isim' i], input[placeholder*='name' i], input[id*='name' i]"
        name_inputs = page.locator(name_sel).all()
        if name_inputs:
            name_inputs[0].fill(NAME)

        # confirm password
        confirm = page.locator("input[name='confirmPassword'], input[placeholder*='tekrar' i], input[placeholder*='confirm' i]").all()
        if confirm:
            confirm[0].fill(PASSWORD)

        ss(page, "03_register_filled")
        page.locator("button[type='submit']").click()
        page.wait_for_load_state("networkidle", timeout=15000)
        ss(page, "04_after_register")
        log("Register", "OK", f"email={EMAIL}, url={page.url}")
    except Exception as e:
        ss(page, "04_register_error")
        log("Register", "FAIL", str(e))

    # ── 3. Dashboard ───────────────────────────────────────────
    try:
        if "/dashboard" not in page.url and "/login" not in page.url:
            page.goto(f"{BASE}/dashboard", wait_until="networkidle", timeout=15000)
        page.wait_for_load_state("networkidle", timeout=10000)
        ss(page, "05_dashboard")
        if "/login" in page.url:
            log("Dashboard", "FAIL", f"redirected to login: {page.url}")
        else:
            log("Dashboard", "OK", f"url={page.url}")
    except Exception as e:
        ss(page, "05_dashboard_error")
        log("Dashboard", "FAIL", str(e))

    # ── 4. Upload Page ─────────────────────────────────────────
    try:
        page.goto(f"{BASE}/upload", wait_until="networkidle", timeout=15000)
        ss(page, "06_upload")
        if "/login" in page.url:
            log("Upload Page", "FAIL", f"redirected to login: {page.url}")
        else:
            log("Upload Page", "OK", f"url={page.url}")
    except Exception as e:
        ss(page, "06_upload_error")
        log("Upload Page", "FAIL", str(e))

    # ── 5. Notes List ──────────────────────────────────────────
    try:
        page.goto(f"{BASE}/notes", wait_until="networkidle", timeout=15000)
        ss(page, "07_notes")
        if "/login" in page.url:
            log("Notes List", "FAIL", f"redirected to login: {page.url}")
        else:
            log("Notes List", "OK", f"url={page.url}")
    except Exception as e:
        ss(page, "07_notes_error")
        log("Notes List", "FAIL", str(e))

    # ── 6. Podcasts List ───────────────────────────────────────
    try:
        page.goto(f"{BASE}/podcasts", wait_until="networkidle", timeout=15000)
        ss(page, "08_podcasts")
        if "/login" in page.url:
            log("Podcasts List", "FAIL", f"redirected to login: {page.url}")
        else:
            log("Podcasts List", "OK", f"url={page.url}")
    except Exception as e:
        ss(page, "08_podcasts_error")
        log("Podcasts List", "FAIL", str(e))

    # ── 7. Podcast Generate Page ───────────────────────────────
    try:
        page.goto(f"{BASE}/podcasts/generate", wait_until="networkidle", timeout=15000)
        ss(page, "09_podcast_generate")
        if "/login" in page.url:
            log("Podcast Generate", "FAIL", f"redirected to login: {page.url}")
        else:
            log("Podcast Generate", "OK", f"url={page.url}")
    except Exception as e:
        ss(page, "09_podcast_generate_error")
        log("Podcast Generate", "FAIL", str(e))

    # ── 8. Settings ────────────────────────────────────────────
    try:
        page.goto(f"{BASE}/settings", wait_until="networkidle", timeout=15000)
        ss(page, "10_settings")
        if "/login" in page.url:
            log("Settings", "FAIL", f"redirected to login: {page.url}")
        else:
            log("Settings", "OK", f"url={page.url}")
    except Exception as e:
        ss(page, "10_settings_error")
        log("Settings", "FAIL", str(e))

    # ── 9. Voice List (API check via UI) ───────────────────────
    try:
        page.goto(f"{BASE}/settings", wait_until="networkidle", timeout=10000)
        # look for voice selection
        voice_els = page.locator("[class*='voice'], [id*='voice'], select, [role='listbox']").all()
        log("Voice UI", "OK" if voice_els else "WARN", f"{len(voice_els)} voice element(s) found")
        ss(page, "11_voices")
    except Exception as e:
        log("Voice UI", "FAIL", str(e))

    # ── 10. Check console errors ───────────────────────────────
    console_errors = []
    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.goto(f"{BASE}/dashboard", wait_until="networkidle", timeout=10000)
    page.wait_for_timeout(2000)
    if console_errors:
        log("Console Errors", "WARN", f"{len(console_errors)} error(s): {console_errors[:3]}")
    else:
        log("Console Errors", "OK", "no console errors on dashboard")

    browser.close()

# ── Summary ───────────────────────────────────────────────────
print("\n" + "="*60)
print("TEST SUMMARY")
print("="*60)
for r in results:
    icon = "[OK]  " if r["status"] == "OK" else "[FAIL]" if r["status"] == "FAIL" else "[WARN]"
    print(f"{icon} {r['step']:25s} {r['note']}")
print(f"\nScreenshots saved to: {SCREENSHOTS}")
print(f"Test account: {EMAIL} / {PASSWORD}")
