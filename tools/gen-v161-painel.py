#!/usr/bin/env python3
"""gen-v161-painel.py — gera v161-painel-data.js a partir do CSV da aba "Painel de Controle" da Planilha Mestra TAAG.

Uso:  python3 tools/gen-v161-painel.py <painel-de-controle.csv> <AAAA-MM-DD da exportação> [saida.js]

O arquivo gerado nunca é editado à mão: para atualizar, exporte a aba de novo e rode este script.
Chave de cada linha = "linha" = índice da linha no CSV (0-based) — a MESMA numeração de v150-mestra-data.js
(v150 linha 6 = "13132 ABA - Alessandra Batista" = índice 6 do CSV; as linhas 0-5 são cabeçalho).

Colunas (0-based):
  15..24  arquivos recebidos da arquitetura: [data/não, rev] × Arquitetura, Luminotécnico, Elétrica, Ar-condicionado, Marcenaria
  25 plataforma de projetos (ferramenta) · 26 usa plataforma (sim/não/(N/A)) · 27 nome na plataforma
  28..63  12 entregáveis TAAG × [PROJETO ENVIADO, STATUS, REV]   status: (C) (A) (A/P) (N/A) vazio
  64 diárias vendidas · 65 diárias executadas
  66..79  7 etapas de execução × [início, término]   valor = data, OK (feito), NA (não se aplica) ou texto

REGRA DO ANO (datas sem ano, ex. "19/10"):
  1) vizinho: procura na MESMA linha a célula com data completa mais próxima (por coluna) no mesmo bloco
     (execução 66-79 / entregáveis 28-63 / arquivos 15-24); escolhe, entre ano-1, ano e ano+1 do vizinho,
     o que deixa a data mais perto da data do vizinho.
  2) sem vizinho: obra ainda em trabalho → o ano que deixa a data mais perto de hoje (data da exportação);
     obra concluída/cancelada → o ano mais recente que não passa de hoje.
  Toda data inferida vai para a lista "excecoes" (regra 'vizinho' ou 'hoje' — esta última é a ambígua). Vizinho = só datas com ano escrito na planilha..
Correções de digitação (também listadas em "excecoes"): "23//08/24", "22/005/24", "13/012/2024", "2904/2024",
"1005/23", mês/dia invertido (4/28/2020) e número serial do Excel (44601).
"""
import csv, json, re, sys, datetime as dt

src = sys.argv[1]; quando = sys.argv[2]; out = sys.argv[3] if len(sys.argv) > 3 else 'v161-painel-data.js'
HOJE = dt.date.fromisoformat(quando)
rows = [r + [''] * (90 - len(r)) for r in csv.reader(open(src, encoding='utf-8'))]
DATA0 = 6
ENT = ['Estudo de pontos / anteprojeto', 'Diagrama de equipamentos', 'Infraestrutura / projeto executivo', 'Levantamento de cargas',
       'Detalhe do quadro', 'Lista de cabos', 'Planta forro / recorte e instalação de caixas', "Detalhe TV's",
       'Lista de medidas dos equipamentos', 'Detalhe do móvel', 'Bayface do rack', 'Keypads']
ARQ = ['Arquitetura', 'Luminotécnico', 'Elétrica', 'Ar-condicionado', 'Marcenaria']
ETAPAS = ['Cabeamento', 'Recorte e instalação de caixas acústicas', 'Montagem do quadro de automação', 'Instalação de keypads e pulsadores',
          'Instalação de rack e equipamentos', 'Programação ON/OFF', 'Programação AV']
excecoes = []

def blk(c):
    return 'exec' if 66 <= c <= 79 else 'ent' if 28 <= c <= 63 else 'arq' if 15 <= c <= 24 else None

def limpa(raw):
    """→ (dia, mes, ano|None, corrigido:bool) ou None"""
    s = raw.strip(); orig = s; fix = False
    if re.fullmatch(r'\d{5}', s):  # serial do Excel
        d = dt.date(1899, 12, 30) + dt.timedelta(days=int(s)); return (d.day, d.month, d.year, True)
    if '//' in s: s = s.replace('//', '/'); fix = True
    m = re.fullmatch(r'(\d{2})(\d{2})/(\d{2,4})', s)  # 2904/2024
    if m: s = f'{m.group(1)}/{m.group(2)}/{m.group(3)}'; fix = True
    m = re.fullmatch(r'(\d{1,2})/(\d{1,3})(?:/(\d{2,4}))?', s)
    if not m: return None
    d, mo, y = int(m.group(1)), int(m.group(2)), m.group(3)
    if len(m.group(2)) == 3: fix = True
    y = int(y) if y else None
    if y is not None and y < 100: y += 2000
    if mo > 12 and d <= 12: d, mo = mo, d; fix = True  # 4/28/2020 → 28/04/2020
    return (d, mo, y, fix or s != orig)

def valida(d, mo, y):
    try: return dt.date(y, mo, d)
    except ValueError: return None

def parse_row(r, linha, concl):
    """datas da linha: {col: 'AAAA-MM-DD'} com regra do ano"""
    res = {}; pend = []
    cols = list(range(15, 25, 2)) + list(range(28, 64, 3)) + list(range(66, 80))
    for c in cols:
        raw = r[c].strip()
        if not raw: continue
        p = limpa(raw)
        if not p: continue
        d, mo, y, fix = p
        if y is None: pend.append((c, raw, d, mo)); continue
        dd = valida(d, mo, y)
        if not dd:
            excecoes.append(dict(linha=linha, cliente=r[1].strip(), coluna=c, valor=raw, tipo='data inválida — ignorada')); continue
        res[c] = dd
        if fix: excecoes.append(dict(linha=linha, cliente=r[1].strip(), coluna=c, valor=raw, data=dd.isoformat(), tipo='digitação corrigida'))
    inferidas = set()
    for c, raw, d, mo in pend:
        viz = sorted([k for k in res if blk(k) == blk(c) and k not in inferidas], key=lambda k: abs(k - c))
        if viz:
            ref = res[viz[0]]; best = None
            for y in (ref.year - 1, ref.year, ref.year + 1):
                dd = valida(d, mo, y)
                if dd and (best is None or abs((dd - ref).days) < abs((best - ref).days)): best = dd
            regra = 'vizinho'
        else:
            cands = [valida(d, mo, y) for y in (HOJE.year - 1, HOJE.year, HOJE.year + 1)]
            cands = [x for x in cands if x]
            if concl: cands = [x for x in cands if x <= HOJE] or cands; best = max(cands)
            else: best = min(cands, key=lambda x: abs((x - HOJE).days))
            regra = 'hoje'
        if not best:
            excecoes.append(dict(linha=linha, cliente=r[1].strip(), coluna=c, valor=raw, tipo='data inválida — ignorada')); continue
        res[c] = best; inferidas.add(c)
        excecoes.append(dict(linha=linha, cliente=r[1].strip(), coluna=c, valor=raw, data=best.isoformat(), tipo='ano inferido · ' + regra))
    return {k: v.isoformat() for k, v in res.items()}

ST = {'(C)': 'C', '(A)': 'A', '(A/P)': 'A/P', '(N/A)': 'N/A', '': ''}
def cel(r, c, datas):
    raw = r[c].strip()
    if c in datas: return datas[c]
    return raw

saida = []
for i in range(DATA0, len(rows)):
    r = rows[i]
    if not any(x.strip() for x in r[:3]): continue
    status = r[2].strip(); concl = status.lower() in ('concluido', 'cancelada')
    datas = parse_row(r, i, concl)
    arq = []
    for k, c in enumerate(range(15, 25, 2)):
        raw = r[c].strip()
        if c in datas: st = 'Recebido'
        elif raw.lower() == 'não' or raw.lower() == 'nao': st = 'Não recebido'
        elif raw.upper() == 'N/A': st = 'N/A'
        elif raw: st = '?'
        else: st = ''
        arq.append(dict(n=ARQ[k], st=st, data=datas.get(c, ''), rev=r[c + 1].strip(), raw=raw))
    ent = []
    for k in range(12):
        c = 28 + 3 * k; rs = r[c + 1].strip()
        st = ST.get(rs)
        if st is None:
            excecoes.append(dict(linha=i, cliente=r[1].strip(), coluna=c + 1, valor=rs, tipo='status de entregável desconhecido — tratado como vazio')); st = ''
        rawEnv = r[c].strip()
        ent.append(dict(n=ENT[k], st=st, env=datas.get(c, ''), rev=r[c + 2].strip().strip(','), obs=('' if c in datas or not rawEnv else rawEnv)))
    ex = []
    for k in range(7):
        a, b = 66 + 2 * k, 67 + 2 * k
        def v(c):
            raw = r[c].strip()
            if c in datas: return datas[c]
            if raw.lower() == 'ok': return 'OK'
            if raw.upper() in ('NA', 'N/A'): return 'NA'
            return ('?' + raw) if raw and raw != '-' else ''
        ex.append(dict(n=ETAPAS[k], ini=v(a), fim=v(b)))
    def num(s):
        s = s.strip(); return int(s) if re.fullmatch(r'\d+', s) else None
    saida.append(dict(linha=i, propostas=r[0].strip(), cliente=r[1].strip(), status=status,
                      plat=dict(ferramenta=r[25].strip(), usa=r[26].strip(), nome=r[27].strip()),
                      arq=arq, ent=ent, dv=num(r[64]), de=num(r[65]), ex=ex))

dados = dict(quando=quando, fonte=f'Planilha Mestra TAAG (Painel de Controle, {HOJE.strftime("%d/%m/%Y")})',
             regraAno='Data sem ano: o ano vem da data completa mais próxima na mesma linha e no mesmo bloco (execução / entregáveis / arquivos); sem vizinho, obra em trabalho = o ano mais perto de hoje, obra concluída/cancelada = o ano mais recente até hoje. Toda inferência está em "excecoes".',
             rows=saida, excecoes=excecoes)
with open(out, 'w', encoding='utf-8') as f:
    f.write(f'/* v161 · Planilha Mestra TAAG › Painel de Controle — entregáveis, arquivos recebidos, diárias e etapas de execução, exportação de {HOJE.strftime("%d/%m/%Y")} ({len(saida)} linhas).\n'
            '   gerado da planilha, nunca editado à mão — rode tools/gen-v161-painel.py <csv> <AAAA-MM-DD> para atualizar. */\n')
    f.write('window.V161_PAINEL=' + json.dumps(dados, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(saida), 'linhas ·', len(excecoes), 'exceções →', out)
