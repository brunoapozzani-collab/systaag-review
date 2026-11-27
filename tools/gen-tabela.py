#!/usr/bin/env python3
"""Gera v141-tabela-data.js a partir da PlanilhaPrecos.xlsx (aba "Tabela Taag") do Drive.
Uso: python3 tools/gen-tabela.py <PlanilhaPrecos.xlsx> "<data de edição dd/mm/aaaa hh:mm>"
Regra (Bruno, 26-27/11/2026): só entram linhas com Status = OK. O app (v141-tabela.js) aplica no catálogo
só quando marca + modelo batem exatamente e a Tabela tem UMA linha OK para eles (linhas repetidas ficam marcadas, não aplicadas).
Saída estável (mesma planilha → mesmo arquivo), para o commit só acontecer quando a Tabela mudar."""
import sys, json, datetime, openpyxl
src, editada = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
ws = wb['Tabela Taag']
rows = list(ws.iter_rows(values_only=True))
def num(v):
    try: return round(float(v), 6)
    except Exception: return None
def dt(v):
    if isinstance(v, (datetime.date, datetime.datetime)): return v.strftime('%Y-%m-%d')
    return ''
itens = []
for r in rows[1:]:
    if not r or r[1] is None: continue
    st = str(r[8]).strip() if r[8] is not None else ''
    if st.upper() != 'OK': continue
    itens.append({'fab': str(r[0] or '').strip(), 'mod': str(r[1]).strip(), 'cat': str(r[2] or '').strip(),
                  'desc': str(r[5] or '').strip(), 'status': 'OK', 'tabela': num(r[9]), 'compra': num(r[13]),
                  'forn': str(r[10] or '').strip(), 'data': dt(r[22]) if len(r) > 22 else ''})
data = {'fonte': f'PlanilhaPrecos.xlsx › Tabela Taag (Drive, editada {editada})', 'linhas_planilha': len(rows) - 1, 'itens': itens}
out = ('/* v141 — Tabela Taag do Drive (gerado por tools/gen-tabela.py). Só linhas OK. Aplicado por v141-tabela.js com a regra estrita. */\n'
       'window.V141_TABELA=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
open('v141-tabela-data.js', 'w', encoding='utf-8').write(out)
print(len(itens), 'linhas OK')
