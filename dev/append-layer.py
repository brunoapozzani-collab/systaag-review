#!/usr/bin/env python3
"""Append (or replace) a layer file before </body> in prototype/systaag.html. Idempotent by marker comment."""
import sys,re
proto='prototype/systaag.html'; layer=sys.argv[1]; marker=sys.argv[2]
p=open(proto,encoding='utf-8').read(); l=open(layer,encoding='utf-8').read()
start=f'<!-- {marker}:start -->'; end=f'<!-- {marker}:end -->'
if start in p:
    p=p[:p.index(start)]+p[p.index(end)+len(end):].lstrip('\n')
i=p.rfind('</body>')
p=p[:i]+'\n'+start+'\n'+l+'\n'+end+'\n'+p[i:]
open(proto,'w',encoding='utf-8').write(p)
print('ok',len(p))
