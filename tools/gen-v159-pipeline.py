#!/usr/bin/env python3
"""Gera v159-pipeline-planilha-data.js a partir da exportação da planilha To Do Comercial (aba Pipeline).

Uso:  python3 -I tools/gen-v159-pipeline.py EXPORT.csv MATCH.json SAIDA.js

- EXPORT: o arquivo exportado (todas as abas, separadas por "## Sheet name: …").
- MATCH:  {"pairs":[{"linha":N,"id":"plX"}...], "novas":{"N":{...}}, "saiu":[{"id":..,"acao":"perdido"}]}
  diz a qual negociação da Base cada linha pertence (as linhas mudam de lugar entre leituras).
Cada linha da planilha é copiada como está (só espaços nas pontas e o ".0" de números são limpos).
"""
import csv, io, json, re, sys

def ler(path):
    raw = open(path, encoding='utf-8', newline='').read()
    a = raw.index('## Sheet name: Pipeline')
    b = raw.index('## Sheet name:', a + 10)
    sec = raw[a:b].split('\n', 1)[1]
    sec = re.sub(r'\r(?!\n)', '\x00', sec)          # CR solto dentro da célula não é fim de linha
    rows = list(csv.reader(io.StringIO(sec, newline='')))
    def nm(v):
        v = v.replace('\x00', '\n').replace('\r\n', '\n').replace('\r', '\n').strip()
        if re.fullmatch(r'-?\d+\.0', v): v = v[:-2]
        return v
    cab = [nm(x) for x in rows[0]][:17]
    out = []
    for i, r in enumerate(rows[1:], start=2):
        c = [nm(x) for x in (r + [''] * 17)[:17]]
        if c[3]: out.append({'linha': i, 'c': c})
    return cab, out

def main(exp, match, saida, quando, fonte):
    cab, rows = ler(exp)
    M = json.load(open(match, encoding='utf-8'))
    ids = {int(p['linha']): p['id'] for p in M['pairs']}
    for k, v in M.get('novas', {}).items(): ids[int(k)] = v['id']
    falta = [r['linha'] for r in rows if r['linha'] not in ids]
    if falta: sys.exit('linhas sem negociação definida: %s' % falta)
    for r in rows: r['id'] = ids[r['linha']]
    D = {'quando': quando, 'fonte': fonte, 'cab': cab, 'rows': rows,
         'novas': M.get('novas', {}), 'saiu': M.get('saiu', [])}
    js = ('/* v159 · aba Pipeline da planilha To Do Comercial — %s. Número da linha = o da planilha; "id" = a negociação da Base '
          'que a linha alimenta. Gerada por tools/gen-v159-pipeline.py, nunca editada à mão. */\n'
          'window.V159_PIPE=%s;\n') % (fonte, json.dumps(D, ensure_ascii=False, separators=(',', ':')))
    open(saida, 'w', encoding='utf-8').write(js)
    print('linhas', len(rows), 'novas', len(D['novas']), 'saiu', len(D['saiu']))

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5])
