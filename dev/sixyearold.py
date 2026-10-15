#!/usr/bin/env python3
"""Six-year-old test: a reviewer with no instructions posts an anchored comment on a button, a table row and the whole screen.
Pass = each flow < 30 s and < 6 taps, on 390x844 and 1440x900. Usage: sixyearold.py BASE_URL [--runs N] [--shots DIR] [--name NAME]"""
import sys, time, json, argparse, os, re
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('base'); ap.add_argument('--runs', type=int, default=1); ap.add_argument('--shots', default=''); ap.add_argument('--name', default='Teste SYSTAAG')
ap.add_argument('--route', default='#/propostas'); ap.add_argument('--keep', action='store_true', help='keep the comments (for verification)')
ap.add_argument('--token', default='')
A = ap.parse_args()
H2C = os.path.join(os.path.dirname(__file__), '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.min.js')
VIEWPORTS = {'phone': (390, 844), 'desktop': (1440, 900)}
P = 'staag-rev-'

def shot(page, name):
    if A.shots:
        os.makedirs(A.shots, exist_ok=True); page.screenshot(path=os.path.join(A.shots, name + '.png'))

def wait_toast(page, t0, limit=30):
    page.wait_for_function("() => { const t=document.getElementById('staag-rev-toast'); return t && t.style.display==='block' && /enviad/.test(t.textContent) }", timeout=limit * 1000)
    return time.time() - t0

def flow(page, kind, fresh):
    taps = 0
    page.evaluate("() => { const t=document.getElementById('staag-rev-toast'); t.style.display='none'; t.textContent=''; }")
    t0 = time.time()
    page.click('#' + P + 'fab'); taps += 1
    page.wait_for_selector('#' + P + 'banner', state='visible')
    if kind == 'button':
        # the first real button inside <main> that is visible and not disabled
        el = page.locator('#main button:visible:not([disabled])').first
        el.scroll_into_view_if_needed(); el.click(); taps += 1
    elif kind == 'row':
        el = page.locator('#main table tbody tr:visible').first
        el.scroll_into_view_if_needed(); el.locator('td').first.click(); taps += 1
    else:
        page.click('#' + P + 'whole'); taps += 1
    page.wait_for_selector('#' + P + 'panel.' + P + 'open')
    shot(page, f'{kind}-{VP}-panel')
    if fresh:
        page.fill('#' + P + 'name', A.name); taps += 1
    page.fill('#' + P + 'text', f'[TESTE] comentário no {kind} · {VP}'); taps += 1
    with page.expect_response(lambda r: '/api/comentarios' in r.url and r.request.method == 'POST', timeout=40000) as ri:
        page.click('#' + P + 'send'); taps += 1
    assert ri.value.status == 201, 'POST ' + str(ri.value.status) + ' ' + ri.value.text()[:200]
    secs = wait_toast(page, t0)
    shot(page, f'{kind}-{VP}-sent')
    rec = page.evaluate("() => { const c = window.__staagLast; return c }")
    return secs, taps

results = []
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for VP, (w, h) in VIEWPORTS.items():
        ctx = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if VP == 'phone' else 1, is_mobile=VP == 'phone', has_touch=VP == 'phone', locale='pt-BR')
        ctx.route(re.compile(r'cdnjs\.cloudflare\.com/ajax/libs/html2canvas/1\.4\.1/html2canvas\.min\.js'), lambda r: r.fulfill(path=H2C, content_type='application/javascript'))
        page = ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        for run in range(A.runs):
            page.goto(A.base + '/' + A.route, wait_until='load')
            page.wait_for_selector('#' + P + 'fab', state='visible', timeout=60000)
            page.wait_for_timeout(500)
            fresh = (run == 0)
            for kind in ('button', 'row', 'whole'):
                try:
                    secs, taps = flow(page, kind, fresh and kind == 'button')
                    ok = secs < 30 and taps < 6
                    results.append({'run': run + 1, 'viewport': VP, 'flow': kind, 'seconds': round(secs, 1), 'taps': taps, 'pass': ok})
                except Exception as e:
                    shot(page, f'{kind}-{VP}-FAIL')
                    results.append({'run': run + 1, 'viewport': VP, 'flow': kind, 'seconds': None, 'taps': None, 'pass': False, 'error': str(e)[:300]})
                page.wait_for_timeout(300)
        if errs: results.append({'viewport': VP, 'pageerrors': errs[:5]})
        ctx.close()
    b.close()
print(json.dumps(results, ensure_ascii=False, indent=1))
allok = all(r.get('pass') for r in results if 'flow' in r) and not any('pageerrors' in r for r in results)
print('ALL PASS' if allok else 'FAIL')
sys.exit(0 if allok else 1)
