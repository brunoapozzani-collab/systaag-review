#!/usr/bin/env python3
"""Step 1 — prototype integrity: 12 routes on A (deployed, with overlay) vs B (reference without overlay). Screenshots + pixel diff
with the overlay's floating button hidden on A. Usage: integrity.py A_BASE B_URL_OF_RAW_HTML --shots DIR"""
import sys, os, json, argparse
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops

ap = argparse.ArgumentParser(); ap.add_argument('a'); ap.add_argument('b'); ap.add_argument('--shots', required=True)
A = ap.parse_args(); os.makedirs(A.shots, exist_ok=True)
ROUTES = [('inicio', '#/home'), ('comercial', '#/hoje'), ('propostas', '#/propostas'), ('proposta-detalhe', '#/editor/pr1'), ('estoque', '#/estoque'), ('entradas', '#/entradas'), ('saidas', '#/saidas'), ('obras', '#/obras'), ('pagar', '#/pagar'), ('receber', '#/receber'), ('colaboradores', '#/colaboradores'), ('parametros', '#/parametros')]
HIDE = "() => { const r=document.getElementById('staag-rev-root'); if(r) r.style.visibility='hidden'; }"
# Both pages get the same seeded localStorage by clearing it first, so the prototype renders the same data on both.
res = []
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for side, base in (('deployed', A.a), ('artifact', A.b)):
        ctx = b.new_context(viewport={'width': 1440, 'height': 900}, locale='pt-BR')
        page = ctx.new_page(); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        page.goto(base, wait_until='load'); page.evaluate('() => { try { localStorage.clear() } catch(e){} }')
        for name, route in ROUTES:
            url = base + route if base.endswith('/') or base.endswith('.html') else base + '/' + route
            page.goto(url, wait_until='load'); page.wait_for_timeout(1200)
            page.evaluate('() => window.scrollTo(0,0)')
            if side == 'deployed': page.evaluate(HIDE)
            page.wait_for_timeout(200)
            page.screenshot(path=f'{A.shots}/step1-{name}-{side}.png')
            title = page.evaluate("() => { const m=document.getElementById('main'); const h=m&&m.querySelector('h1,.h1,h2'); return (h?h.innerText:document.title).trim().slice(0,80) }")
            res.append({'route': route, 'side': side, 'title': title, 'hash': page.evaluate('() => location.hash')})
        res.append({'side': side, 'pageerrors': errs})
        ctx.close()
    b.close()
rows = []
for name, route in ROUTES:
    a = Image.open(f'{A.shots}/step1-{name}-deployed.png').convert('RGB'); c = Image.open(f'{A.shots}/step1-{name}-artifact.png').convert('RGB')
    diff = ImageChops.difference(a, c); bbox = diff.getbbox()
    px = sum(1 for p in diff.getdata() if max(p) > 40)
    pct = 100.0 * px / (a.size[0] * a.size[1])
    rows.append({'route': route, 'diff_pixels': px, 'diff_pct': round(pct, 3), 'bbox': bbox, 'ok': pct < 0.5})
print(json.dumps({'routes': rows, 'meta': res}, ensure_ascii=False, indent=1))
print('INTEGRITY', 'PASS' if all(r['ok'] for r in rows) else 'FAIL')
