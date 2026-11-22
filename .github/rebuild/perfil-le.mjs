import fs from 'fs';const profile=JSON.parse(fs.readFileSync(process.argv[2]||'prof.json'));
const dt=profile.timeDeltas,ids=profile.samples;const self=new Map();for(let i=0;i<ids.length;i++)self.set(ids[i],(self.get(ids[i])||0)+dt[i]);
const N=new Map(profile.nodes.map(n=>[n.id,n]));
const inc=id=>{const n=N.get(id);let t=(self.get(id)||0);for(const c of n.children||[])t+=inc(c);return t};
const root=profile.nodes[0];const rows=[];
const lab=n=>(n.callFrame.functionName||'(anon)')+' @'+((n.callFrame.url||'').split('/').pop().split('?')[0].slice(0,30)||'native')+':'+n.callFrame.lineNumber+':'+n.callFrame.columnNumber;
for(const c of root.children){const n=N.get(c);rows.push([inc(c)/1000,lab(n),n])}
rows.sort((a,b)=>b[0]-a[0]);
console.log('TOP-LEVEL ENTRIES (inclusive)');for(const r of rows.slice(0,40))console.log(Math.round(r[0])+'ms',r[1]);
// drill: for the biggest entries show children
const drill=(n,d,max)=>{const ch=(n.children||[]).map(c=>[inc(c)/1000,N.get(c)]).sort((a,b)=>b[0]-a[0]).filter(x=>x[0]>=max);for(const [t,c] of ch.slice(0,6)){console.log(' '.repeat(d*2)+Math.round(t)+'ms '+lab(c));if(d<5)drill(c,d+1,max)}};
if(process.argv[3]){for(const r of rows.slice(0,+process.argv[3])){console.log('\n== '+Math.round(r[0])+'ms '+r[1]);drill(r[2],1,60)}}
