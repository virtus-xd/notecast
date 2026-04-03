"""NotCast detailed test — inspect register form, login, then explore authenticated pages."""

import os, time, sys
from playwright.sync_api import sync_playwright

SCREENSHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_screenshots")
BASE = "https://notcast-web.vercel.app"
EMAIL = f"tester{int(time.time())}@mailinator.com"
PASSWORD = "Test1234!"
NAME = "Test User"

os.makedirs(SCREENSHOTS, exist_ok=True)

def ss(page, name):
    path = f"{SCREENSHOTS}/{name}.png"
    page.screenshot(path=path, full_page=True)
    print(f"  [screenshot] {name}.png")

def p(msg): print(msg, flush=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()

    # Capture all network responses
    api_responses = []
    def on_response(resp):
        if "/api/" in resp.url:
            api_responses.append({"url": resp.url, "status": resp.status})
    page.on("response", on_response)

    # ── REGISTER PAGE INSPECTION ──────────────────────────────
    p("\n=== REGISTER PAGE ===")
    page.goto(f"{BASE}/register", wait_until="networkidle", timeout=20000)
    ss(page, "R1_register_initial")

    # List all inputs
    inputs = page.locator("input").all()
    p(f"Found {len(inputs)} input(s):")
    for i, inp in enumerate(inputs):
        try:
            attrs = {
                "type": inp.get_attribute("type"),
                "name": inp.get_attribute("name"),
                "placeholder": inp.get_attribute("placeholder"),
                "id": inp.get_attribute("id"),
            }
            p(f"  [{i}] {attrs}")
        except:
            pass

    # List all buttons
    buttons = page.locator("button").all()
    p(f"Found {len(buttons)} button(s):")
    for i, btn in enumerate(buttons):
        try:
            p(f"  [{i}] text='{btn.inner_text().strip()}' type={btn.get_attribute('type')}")
        except:
            pass

    # ── FILL REGISTER FORM ────────────────────────────────────
    p(f"\n=== FILLING REGISTER FORM (email={EMAIL}) ===")
    try:
        # Try filling by index order: name, email, password, confirm
        if len(inputs) >= 4:
            inputs[0].fill(NAME)
            inputs[1].fill(EMAIL)
            inputs[2].fill(PASSWORD)
            inputs[3].fill(PASSWORD)
        elif len(inputs) == 3:
            inputs[0].fill(NAME)
            inputs[1].fill(EMAIL)
            inputs[2].fill(PASSWORD)
        elif len(inputs) == 2:
            inputs[0].fill(EMAIL)
            inputs[1].fill(PASSWORD)

        ss(page, "R2_register_filled")

        # Click submit
        submit = page.locator("button[type='submit']")
        submit.click()
        p("Clicked submit, waiting...")
        page.wait_for_load_state("networkidle", timeout=15000)
        page.wait_for_timeout(2000)
        ss(page, "R3_register_after_submit")
        p(f"URL after submit: {page.url}")

        # Check for error messages
        errors = page.locator("[class*='error'], [role='alert'], .text-red-500, .text-destructive").all()
        if errors:
            p(f"ERROR MESSAGES on page:")
            for e in errors:
                try: p(f"  '{e.inner_text().strip()}'")
                except: pass
        else:
            p("No visible error messages")

    except Exception as e:
        p(f"Register form error: {e}")
        ss(page, "R3_register_exception")

    # ── API RESPONSES ─────────────────────────────────────────
    p(f"\nAPI calls during registration:")
    for r in api_responses:
        p(f"  {r['status']} {r['url']}")
    api_responses.clear()

    # ── LOGIN (if register didn't auto-login) ─────────────────
    if "/dashboard" not in page.url:
        p(f"\n=== LOGIN (register did not auto-login) ===")
        page.goto(f"{BASE}/login", wait_until="networkidle", timeout=15000)
        ss(page, "L1_login_page")

        login_inputs = page.locator("input").all()
        p(f"Login inputs: {len(login_inputs)}")
        for i, inp in enumerate(login_inputs):
            try:
                attrs = {"type": inp.get_attribute("type"), "name": inp.get_attribute("name"), "placeholder": inp.get_attribute("placeholder")}
                p(f"  [{i}] {attrs}")
            except: pass

        if len(login_inputs) >= 2:
            login_inputs[0].fill(EMAIL)
            login_inputs[1].fill(PASSWORD)
            ss(page, "L2_login_filled")
            page.locator("button[type='submit']").click()
            page.wait_for_load_state("networkidle", timeout=15000)
            page.wait_for_timeout(2000)
            ss(page, "L3_login_after")
            p(f"URL after login: {page.url}")

            login_errors = page.locator("[class*='error'], [role='alert'], .text-red-500, .text-destructive").all()
            for e in login_errors:
                try: p(f"  LOGIN ERROR: '{e.inner_text().strip()}'")
                except: pass

        p(f"\nAPI calls during login:")
        for r in api_responses:
            p(f"  {r['status']} {r['url']}")
        api_responses.clear()

    # ── AUTHENTICATED PAGES ───────────────────────────────────
    is_authed = "/dashboard" in page.url or "/login" not in page.url
    p(f"\n=== AUTHENTICATED: {is_authed} (current url: {page.url}) ===")

    pages_to_check = [
        ("dashboard", "/dashboard"),
        ("upload", "/upload"),
        ("notes", "/notes"),
        ("podcasts", "/podcasts"),
        ("podcast_generate", "/podcasts/generate"),
        ("settings", "/settings"),
    ]

    for name, path in pages_to_check:
        try:
            page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
            page.wait_for_timeout(1000)
            final_url = page.url
            redirected_to_login = "/login" in final_url
            ss(page, f"P_{name}")
            status = "REDIRECT->login" if redirected_to_login else "LOADED"
            p(f"  {status:20s} {path} -> {final_url}")

            if not redirected_to_login:
                # Check for visible errors
                errs = page.locator("[role='alert'], .text-destructive").all()
                for e in errs:
                    try:
                        txt = e.inner_text().strip()
                        if txt: p(f"    alert: '{txt}'")
                    except: pass
        except Exception as e:
            p(f"  EXCEPTION {path}: {e}")
            ss(page, f"P_{name}_err")

    browser.close()

p("\nDone. Check test_screenshots/ folder.")
