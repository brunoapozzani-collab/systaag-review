#!/usr/bin/env python3
"""Verification steps 2–4 of the mission against BASE (deployed or local). Screenshots named by step into --shots.
  step2: 3 comments from phone (button/row/whole) + 1 reply from desktop; GET feed; fields; pins on reload open the right thread
  step3: change one status via /revisao (then the caller redeploys and runs --check-status)
  step4: delete test comments via /revisao API; feed empty
Usage: verify.py BASE --token T --shots DIR [--phase post|status|check|delete]"""
import sys, os, re, json, time, argparse, urllib.request
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser(); ap.add_argument('base'); ap.add_argument('--token', required=True); ap.add_argument('--shots', required=True); ap.add_argument('--phase', default='post'); ap.add_argument('--route', default='#/propostas')
A = ap.parse_args(); P = 'staag-rev-'; os.makedirs(A.shots, exist_ok=True)
H2C = os.path.join(os.path.dirname(__file__), '..', 'node_modules', 'html2canvas', 'dist', 'html2canvas.min.js')
STATE = os.path.join(A.shots, 'verify-state.json')

def api(path, method='GET', body=None):
    req = urllib.request.Request(A.base + path, method=method, data=json.dumps(body).encode() if body is not None else None, headers={'content-type': 'application/json', 'x-admin-token': A.token})
    with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read().decode())

def ctx_for(b, vp):
    w, h = (390, 844) if vp == 'phone' else (1440, 900)
    c = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if vp == 'phone' else 1, is_mobile=vp == 'phone', has_touch=vp == 'phone', locale='pt-BR')
    c.route(re.compile(r'cdnjs\.cloudflare\.com/ajax/libs/html2canvas/1\.4\.1/html2canvas\.min\.js'), lambda r: r.fulfill(path=H2C, content_type='application/javascript'))
    return c

def post(page, kind, name, text):
    page.evaluate("() => { const t=document.getElementById('staag-rev-toast'); t.style.display='none'; }")
    page.click('#' + P + 'fab'); page.wait_for_selector('#' + P + 'banner', state='visible')
    if kind == 'button':
        el = page.locator('#main button:visible:not([disabled])').first; el.scroll_into_view_if_needed(); el.click()
    elif kind == 'row':
        el = page.locator('#main table tbody tr:visible').first; el.scroll_into_view_if_needed(); el.locator('td').first.click()
    else:
        page.click('#' + P + 'whole')
    page.wait_for_selector('#' + P + 'panel.' + P + 'open'); page.fill('#' + P + 'name', name); page.fill('#' + P + 'text', text)
    if kind != 'whole': page.click('.' + P + 'type[data-type="Adicionar"]')
    with page.expect_response(lambda r: '/api/comentarios' in r.url and r.request.method == 'POST', timeout=60000) as ri:
        page.click('#' + P + 'send')
    j = ri.value.json(); assert ri.value.status == 201, j
    page.wait_for_function("() => /enviad/.test(document.getElementById('staag-rev-toast').textContent)", timeout=15000)
    return j

out = {}
with sync_playwright() as pw:
    b = pw.chromium.launch()
    if A.phase == 'post':
        ids = []
        c = ctx_for(b, 'phone'); page = c.new_page(); errs = []; page.on('pageerror', lambda e: errs.append(str(e)))
        page.goto(A.base + '/' + A.route, wait_until='load'); page.wait_for_selector('#' + P + 'fab', state='visible', timeout=60000); page.wait_for_timeout(600)
        page.screenshot(path=f'{A.shots}/step2-00-phone-before.png')
        for i, (kind, txt) in enumerate([('button', '[TESTE] este botão podia ser verde'), ('row', '[TESTE] esta linha precisa mostrar o consultor'), ('whole', '[TESTE] a tela toda: falta um resumo no topo')]):
            page.click('#' + P + 'fab'); page.wait_for_selector('#' + P + 'banner', state='visible'); page.screenshot(path=f'{A.shots}/step2-{i+1:02d}a-phone-{kind}-pickmode.png'); page.click('#' + P + 'cancel'); page.wait_for_timeout(200)
            j = post(page, kind, 'Teste SYSTAAG', txt); ids.append(j['id'])
            page.screenshot(path=f'{A.shots}/step2-{i+1:02d}b-phone-{kind}-sent.png')
        # pins on reload open the right thread
        page.reload(wait_until='load'); page.wait_for_selector('#' + P + 'fab', state='visible', timeout=60000); page.evaluate('() => window.scrollTo(0,0)'); page.wait_for_timeout(1500)
        pins = page.locator('.' + P + 'pin'); n = pins.count(); out['pins_after_reload_phone'] = n
        page.screenshot(path=f'{A.shots}/step2-04-phone-pins-after-reload.png')
        out['comments_loaded_phone'] = page.evaluate('() => window.staagRev.count()'); assert n >= 1 and out['comments_loaded_phone'] >= 3, 'pins %d loaded %s' % (n, out['comments_loaded_phone'])
        pins.first.click(); page.wait_for_selector('#' + P + 'panel.' + P + 'open'); head = page.locator('#' + P + 'panel .' + P + 'head b').inner_text()
        out['first_pin_opens'] = head; assert head.startswith('#1'), head
        page.screenshot(path=f'{A.shots}/step2-05-phone-pin1-thread.png'); page.click('[data-act="close"]')
        out['pageerrors_phone'] = errs; c.close()
        # reply from desktop
        c = ctx_for(b, 'desktop'); page = c.new_page(); errs2 = []; page.on('pageerror', lambda e: errs2.append(str(e)))
        page.goto(A.base + '/' + A.route, wait_until='load'); page.wait_for_selector('#' + P + 'fab', state='visible', timeout=60000); page.wait_for_timeout(1500)
        page.screenshot(path=f'{A.shots}/step2-06-desktop-pins.png')
        page.locator('.' + P + 'pin').first.click(); page.wait_for_selector('#' + P + 'panel.' + P + 'open')
        page.fill('#' + P + 'name', 'Bruno (desktop)'); page.fill('#' + P + 'text', '[TESTE] resposta: combinado, vamos mudar')
        with page.expect_response(lambda r: '/api/comentarios' in r.url and r.request.method == 'POST', timeout=60000) as ri: page.click('#' + P + 'reply')
        rj = ri.value.json(); assert ri.value.status == 201, rj; ids.append(rj['id']); page.wait_for_timeout(800)
        page.screenshot(path=f'{A.shots}/step2-07-desktop-reply.png'); out['pageerrors_desktop'] = errs2; c.close()
        feed = api('/api/comentarios?token=' + A.token); out['feed'] = feed
        roots = [x for x in feed['comentarios'] if not x['parentId'] and x['id'] in ids]
        for x in roots:
            for k in ('screen', 'label', 'path', 'box', 'crop'):
                if x['whole'] and k in ('path',): continue
                assert x.get(k) not in (None, ''), f'{x["id"]} missing {k}'
        out['ids'] = ids; json.dump(out, open(STATE, 'w'), ensure_ascii=False, indent=1)
        print(json.dumps({'ids': ids, 'pins_after_reload_phone': n, 'first_pin_opens': head, 'pageerrors': errs + errs2, 'feed_count': feed['count']}, ensure_ascii=False))
    elif A.phase == 'status':
        st = json.load(open(STATE)); target = st['ids'][0]
        c = ctx_for(b, 'desktop'); page = c.new_page(); page.goto(A.base + '/revisao?token=' + A.token, wait_until='load'); page.wait_for_selector('table', timeout=60000)
        page.screenshot(path=f'{A.shots}/step3-01-revisao-table.png')
        page.locator(f'tr.row[data-id="{target}"]').click(); page.wait_for_timeout(300); page.screenshot(path=f'{A.shots}/step3-02-revisao-expanded.png')
        with page.expect_response(lambda r: '/api/comentarios/' in r.url and r.request.method == 'PATCH', timeout=60000) as ri:
            page.select_option(f'select[data-st="{target}"]', 'Aceito')
        assert ri.value.status == 200, ri.value.text(); page.wait_for_timeout(500); page.screenshot(path=f'{A.shots}/step3-03-revisao-status-aceito.png')
        page.click('#mission'); page.wait_for_timeout(500); page.screenshot(path=f'{A.shots}/step3-04-revisao-missao.png'); out['missao'] = page.locator('#missionT').input_value()
        c.close(); print(json.dumps({'changed': target, 'to': 'Aceito', 'missao': out['missao']}, ensure_ascii=False))
    elif A.phase == 'check':
        st = json.load(open(STATE)); target = st['ids'][0]
        feed = api('/api/comentarios?token=' + A.token); row = [x for x in feed['comentarios'] if x['id'] == target][0]
        c = ctx_for(b, 'desktop'); page = c.new_page(); page.goto(A.base + '/revisao?token=' + A.token, wait_until='load'); page.wait_for_selector('table', timeout=60000); page.wait_for_timeout(500)
        page.screenshot(path=f'{A.shots}/step3-05-revisao-after-redeploy.png'); c.close()
        print(json.dumps({'id': target, 'status_after_redeploy': row['status']})); assert row['status'] == 'Aceito'
    elif A.phase == 'delete':
        st = json.load(open(STATE))
        for i in st['ids']:
            try: api('/api/comentarios/' + i, 'PATCH', {'delete': True})
            except Exception as e: print('del', i, e)
        feed = api('/api/comentarios?token=' + A.token)
        c = ctx_for(b, 'desktop'); page = c.new_page(); page.goto(A.base + '/revisao?token=' + A.token, wait_until='load'); page.wait_for_timeout(1500); page.screenshot(path=f'{A.shots}/step4-01-revisao-empty.png'); c.close()
        print(json.dumps({'feed_count_after_delete': feed['count']})); assert feed['count'] == 0
    b.close()
