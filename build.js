// Builds index.html = prototype/systaag.html (untouched) + review/overlay.html injected before </body>.
import fs from 'node:fs';
const proto = fs.readFileSync('prototype/systaag.html', 'utf8');
const overlay = fs.readFileSync('review/overlay.html', 'utf8');
const i = proto.lastIndexOf('</body>');
if (i < 0) throw new Error('no </body> in prototype');
const out = proto.slice(0, i) + '\n' + overlay + '\n' + proto.slice(i);
fs.writeFileSync('index.html', out);
// proof: the prototype part of index.html is byte-identical to the baseline
const back = out.slice(0, i) + out.slice(out.lastIndexOf('</body>'));
if (back !== proto) throw new Error('prototype bytes changed');
console.log('index.html', out.length, 'bytes; prototype part identical to baseline:', back === proto);
