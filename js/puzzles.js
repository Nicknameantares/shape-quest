/* Shape Quest puzzle generator: the same date and difficulty always give the same 10 puzzles. */
/* ---------- random ---------- */
function rngFrom(str){let h=1779033703^str.length;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19}let a=h>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function shuffle(r,a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const sample=(r,a,k)=>shuffle(r,a).slice(0,k);

/* ---------- puzzle model ---------- */
const SHAPES=['circle','square','triangle','star','diamond','hexagon'];
const POOL={shape:SHAPES,color:[0,1,2,3],count:[1,2,3],size:[0,1,2],fill:['solid','outline','striped'],rot:[0,1,2,3,4,5,6,7]};
const ATTRS=['shape','color','count','size','fill','rot'];
const LABELS=()=>T('labels');

function buildLevel(level,r){
  let n=3,k=4,specs={};
  const S=(attr,type,x={})=>{
    const s=Object.assign({type},x);
    if(type==='const'){if(s.v===undefined)s.v=pick(r,POOL[attr])}
    else if(type==='prog'){s.base=sample(r,POOL.rot,n)}
    else s.vals=x.asc?POOL[attr].slice(0,n):sample(r,POOL[attr],n);
    specs[attr]=s;
  };
  switch(level){
    case 1:n=2;k=3;S('shape','row');break;
    case 2:n=2;k=4;S('shape','row');S('color','col');break;
    case 3:S('shape','row');S('color','col');break;
    case 4:S('shape','row');S('count','col',{asc:true});break;
    case 5:k=5;S('shape','col');S('color','row');S('count','col',{asc:true});break;
    case 6:k=5;S('shape','latin');S('color','row');break;
    case 7:k=5;S('shape','const',{v:'arrow'});S('rot','prog',{step:pick(r,[2,6])});S('color','row');break;
    case 8:k=6;S('shape','latin');S('color','latin2');S('fill','col');break;
    case 9:k=6;S('shape','const',{v:'arrow'});S('rot','prog',{step:pick(r,[1,7])});S('color','latin');S('size','col',{asc:true});break;
    default:k=6;S('shape','latin');S('color','latin2');S('fill','row');S('count','col',{asc:true});
  }
  if(!specs.shape)S('shape','const');
  if(!specs.color)S('color','const');
  if(!specs.count)S('count','const',{v:1});
  if(!specs.size)S('size','const',{v:2});
  if(!specs.fill)S('fill','const',{v:'solid'});
  if(!specs.rot)S('rot','const',{v:0});

  const val=(s,i,j)=>{switch(s.type){
    case 'const':return s.v;case 'row':return s.vals[i];case 'col':return s.vals[j];
    case 'latin':return s.vals[(i+j)%n];case 'latin2':return s.vals[(i+2*j)%n];
    case 'prog':return (s.base[i]+j*s.step)%8;}};
  const cells=[];
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const c={};ATTRS.forEach(a=>c[a]=val(specs[a],i,j));cells.push(c)}
  const miss=level>=6?Math.floor(r()*n*n):n*n-1;
  const answer=cells[miss];
  const key=c=>ATTRS.map(a=>c[a]).join('|');

  // distractors, nearest misses first
  const varying=ATTRS.filter(a=>specs[a].type!=='const');
  const fixed=ATTRS.filter(a=>specs[a].type==='const'&&!(a==='shape'&&answer.shape==='arrow')&&!(a==='rot'&&answer.shape!=='arrow'));
  const used=a=>[...new Set(cells.map(c=>c[a]))];
  const b0=[],b1=[],b2=[],b3=[];
  varying.forEach(a=>{
    used(a).forEach(v=>{if(v!==answer[a])b0.push({...answer,[a]:v})});
    POOL[a].forEach(v=>{if(v!==answer[a]&&!used(a).includes(v))b2.push({...answer,[a]:v})});
  });
  for(let x=0;x<varying.length;x++)for(let y=x+1;y<varying.length;y++){
    const A=varying[x],B=varying[y];
    used(A).forEach(va=>used(B).forEach(vb=>{if(va!==answer[A]&&vb!==answer[B])b1.push({...answer,[A]:va,[B]:vb})}));
  }
  fixed.forEach(a=>POOL[a].forEach(v=>{if(v!==answer[a])b3.push({...answer,[a]:v})}));
  const seen=new Set([key(answer)]),opts=[];
  [shuffle(r,b0),shuffle(r,b1),shuffle(r,b2),shuffle(r,b3)].forEach(bk=>bk.forEach(c=>{
    if(opts.length<k-1&&!seen.has(key(c))){seen.add(key(c));opts.push(c)}}));
  const ansIdx=Math.floor(r()*(opts.length+1));
  opts.splice(ansIdx,0,answer);
  return {type:'matrix',level,n,cells,miss,options:opts,ans:ansIdx,specs};
}

function explain(sp){
  const out=[];
  const s=sp.shape,c=sp.color,q=sp.count,z=sp.size,f=sp.fill,t=sp.rot;
  if(s.type==='row'||s.type==='col')out.push(T('why.shape.'+s.type));
  if(s.type.startsWith('latin'))out.push(T('why.shape.latin'));
  if(c.type==='row'||c.type==='col')out.push(T('why.color.'+c.type));
  if(c.type.startsWith('latin'))out.push(T('why.color.latin'));
  if(q.type==='col')out.push(T('why.count'));
  if(z.type==='col')out.push(T('why.size'));
  if(f.type==='row'||f.type==='col')out.push(T('why.fill.'+f.type));
  if(t.type==='prog'){const deg=[0,45,90,135,180,135,90,45][t.step];
    out.push(T(t.step<=4?'why.rot.cw':'why.rot.ccw',deg))}
  return out;
}

/* ---------- drawing ---------- */
const UNIT={
  square:[[-.8,-.8],[.8,-.8],[.8,.8],[-.8,.8]],
  triangle:[[0,-.95],[.95,.75],[-.95,.75]],
  diamond:[[0,-1],[.74,0],[0,1],[-.74,0]],
  hexagon:Array.from({length:6},(_,i)=>{const a=(-90+60*i)*Math.PI/180;return[Math.cos(a)*.95,Math.sin(a)*.95]}),
  star:Array.from({length:10},(_,i)=>{const a=(-90+36*i)*Math.PI/180,R=i%2?.44:1;return[Math.cos(a)*R,Math.sin(a)*R]}),
  arrow:[[0,-1],[.78,-.12],[.3,-.12],[.3,1],[-.3,1],[-.3,-.12],[-.78,-.12]]
};
const POS={1:[[50,50]],2:[[28,50],[72,50]],3:[[50,28],[27,70],[73,70]]};
const BASE={1:33,2:19,3:17},SZ=[.56,.78,1];
let uid=0;
function figSVG(c){
  const id='st'+(uid++),col=`var(--c${c.color})`;
  let defs='',fill;
  if(c.fill==='solid')fill=`fill:${col}`;
  else if(c.fill==='outline')fill='fill:none';
  else{defs=`<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.6" height="6" style="fill:${col}"/></pattern></defs>`;fill=`fill:url(#${id})`}
  const st=`${fill};stroke:${col};stroke-width:3;stroke-linejoin:round`;
  const R=BASE[c.count]*SZ[c.size],ang=c.rot*45*Math.PI/180,co=Math.cos(ang),si=Math.sin(ang);
  const shapes=POS[c.count].map(([x,y])=>{
    if(c.shape==='circle')return `<circle cx="${x}" cy="${y}" r="${(R*.9).toFixed(2)}" style="${st}"/>`;
    const pts=UNIT[c.shape].map(([px,py])=>[(px*co-py*si)*R+x,(px*si+py*co)*R+y].map(v=>v.toFixed(2)).join(',')).join(' ');
    return `<polygon points="${pts}" style="${st}"/>`;
  }).join('');
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${defs}${shapes}</svg>`;
}

/* ---------- odd one out and what comes next ---------- */
const fkey=c=>JSON.stringify(c,Object.keys(c).sort());
const fig=(x={})=>Object.assign({shape:'circle',color:1,count:1,size:2,fill:'solid',rot:0},x);
const m8=x=>((x%8)+8)%8;
// Options from candidate tiers (closest misses first), duplicates of the answer or of each other dropped.
function withOptions(r,answer,tiers,k){
  const seen=new Set([fkey(answer)]),opts=[];
  tiers.forEach(t=>shuffle(r,t).forEach(c=>{if(opts.length<k-1&&!seen.has(fkey(c))){seen.add(fkey(c));opts.push(c)}}));
  const ans=Math.floor(r()*(opts.length+1));opts.splice(ans,0,answer);return{options:opts,ans};
}
const sortOn=a=>a.slice().sort((x,y)=>(Array.isArray(x)?x[1]-y[1]||x[0]-y[0]:x-y));
const sect=(on,n=8)=>({k:'sect',n,on:sortOn(on)});
const grid=(on,n)=>({k:'grid',n,on:[...new Set(on)].sort((a,b)=>a-b)});
const glyph=(g,rot,mir=false)=>({k:'glyph',g,rot:m8(rot),mir});
const nest=(o,i,ir=0)=>({k:'nest',o,i,ir});

/* grid transforms on cell indices of an n×n grid */
const gT={
  rot:(n,i)=>{const r=Math.floor(i/n),c=i%n;return c*n+(n-1-r)},
  mirV:(n,i)=>{const r=Math.floor(i/n),c=i%n;return r*n+(n-1-c)},
  mirH:(n,i)=>{const r=Math.floor(i/n),c=i%n;return (n-1-r)*n+c},
  diag:(n,i)=>{const r=Math.floor(i/n),c=i%n;return c*n+r},
  anti:(n,i)=>{const r=Math.floor(i/n),c=i%n;return (n-1-c)*n+(n-1-r)},
  rot2:(n,i)=>n*n-1-i
};
const mapCells=(n,on,f)=>on.map(i=>gT[f](n,i)).sort((a,b)=>a-b);
const same=(a,b)=>a.join()===b.join();
const randCells=(r,n,k)=>sample(r,Array.from({length:n*n},(_,i)=>i),k).sort((a,b)=>a-b);
// Chiral pieces (no turn matches the mirror image, no turn matches itself) placed in a 4×4 grid.
const PIECES=[[[0,1],[1,1],[2,1],[2,2]],[[0,1],[0,2],[1,0],[1,1],[2,1]],[[0,1],[1,1],[2,1],[2,0],[3,0]],
  [[0,1],[0,2],[1,1],[1,2],[2,1]],[[0,1],[1,0],[1,1],[2,1],[3,1]],[[0,1],[1,1],[2,1],[3,1],[3,2]]];

function buildOdd(level,r){
  let items,why;
  const place=(norm,odd)=>{const at=Math.floor(r()*5);norm.splice(at,0,odd);return{items:norm,ans:at}};
  let res;
  // Levels 4, 5, 6 and 10 switch on half of the days to a variant modelled on math-test examples.
  const alt=[4,5,6,10].includes(level)&&r()<.5;
  if(alt&&level===4){
    // A straight-sided frame around a round shape; the odd one is the other way round.
    const os=sample(r,['p3','p4','p5','p6','p7','p8','trap','para'],4),is=sample(r,['circle','ellipse','heart','cloud','drop'],4);
    res=place(os.map((o,i)=>nest(o,is[i])),nest(pick(r,['circle','shield']),pick(r,['p3','p4','p5','dia'])));why=[['why.odd.curve']];
  }else if(alt&&level===5){
    // The inner polygon has one side fewer than the outer one; the odd one has two fewer.
    const ns=sample(r,[4,5,6,7,8],4),m=pick(r,[5,6,7,8]);
    res=place(ns.map(n=>nest('p'+n,'p'+(n-1),Math.floor(r()*4))),nest('p'+m,'p'+(m-2),Math.floor(r()*4)));why=[['why.odd.nest']];
  }else if(alt&&level===6){
    // Two half-black circles whose black halves face outward; in the odd one both face the same way.
    const combos=shuffle(r,['sq','ci','oct','dsh'].flatMap(f=>[0,1,2,3].map(a=>[f,a]))).slice(0,4);
    res=place(combos.map(([f,a])=>({k:'halves',f,a,flip:false})),{k:'halves',f:pick(r,['sq','ci','oct','dsh']),a:Math.floor(r()*4),flip:true});why=[['why.odd.halves']];
  }else if(alt&&level===10){
    // The number is made of the neighbours of the side count (hexagon: 5 and 7). The odd number still differs by 2, so only counting sides finds it.
    const ns=sample(r,[3,4,5,6,7,8],4),m=pick(r,[4,5,6,7,8]);
    res=place(ns.map(n=>({k:'num',n,t:''+(n-1)+(n+1)})),{k:'num',n:m,t:''+(m-2)+m});why=[['why.odd.num']];
  }else if(level<=3){
    // One feature is shared by four pictures; every other feature is all different, so it can't single anyone out.
    const R=level===1?'shape':level===2?'color':pick(r,['count','fill']);
    const D=level===1?['color']:level===2?['shape']:['shape','color'];
    const [v,w]=sample(r,POOL[R],2);
    const base=fig({shape:pick(r,SHAPES),color:pick(r,POOL.color)});
    const vals={};D.forEach(a=>vals[a]=sample(r,POOL[a],4));
    const norm=[0,1,2,3].map(i=>{const c={...base,[R]:v};D.forEach(a=>c[a]=vals[a][i]);return c});
    const odd={...base,[R]:w};D.forEach(a=>odd[a]=pick(r,vals[a]));
    res=place(norm,odd);why=[['why.odd.'+R]];
  }else if(level===4){
    const norm=shuffle(r,[0,1,2,3]).map(s=>sect(r()<.5?[s,s+4]:[s+4,s]));
    const a=Math.floor(r()*8);
    res=place(norm,sect([a,m8(a+pick(r,[1,2,3]))]));why=[['why.odd.sect']];
  }else if(level===5){
    const k=pick(r,[3,4,5]),d=pick(r,[1,-1]);const seen=new Set();const norm=[];
    while(norm.length<4){const g=grid(randCells(r,3,k),3);if(!seen.has(fkey(g))){seen.add(fkey(g));norm.push(g)}}
    res=place(norm,grid(randCells(r,3,k+d),3));why=[['why.odd.cnt',{pl:k,f:'cells'},{pl:k+d,f:'cells'}]];
  }else if(level===6){
    // Four patterns mirror left to right; the odd one has the same number of cells but no symmetry at all.
    const left=[0,1,4,5,8,9,12,13];
    const symm=()=>{const h=sample(r,left,pick(r,[2,3]));return grid(h.concat(h.map(i=>gT.mirV(4,i))),4)};
    const seen=new Set(),norm=[];
    while(norm.length<4){const g=symm();if(!seen.has(fkey(g))){seen.add(fkey(g));norm.push(g)}}
    let odd;
    for(;;){const g=symm(),out=pick(r,g.on),inn=pick(r,Array.from({length:16},(_,i)=>i).filter(i=>!g.on.includes(i)));
      const on=g.on.filter(i=>i!==out).concat(inn).sort((a,b)=>a-b);
      if(['mirV','mirH','diag','anti','rot2'].every(f=>!same(mapCells(4,on,f),on))){odd=grid(on,4);break}}
    res=place(norm,odd);why=[['why.odd.sym']];
  }else if(level===7){
    const p=pick(r,PIECES).map(([y,x])=>y*4+x),turn=(on,t)=>{for(let i=0;i<t;i++)on=mapCells(4,on,'rot');return on};
    const norm=shuffle(r,[0,1,2,3]).map(t=>grid(turn(p,t),4));
    res=place(norm,grid(turn(mapCells(4,p,'mirV'),Math.floor(r()*4)),4));why=[['why.odd.mirror']];
  }else{
    const g=level===9?'tri':'flag',step=level===8?2:1;
    const rots=level===8?[0,2,4,6]:sample(r,[0,1,2,3,4,5,6,7],4);
    const norm=shuffle(r,rots).map(t=>glyph(g,t));
    res=place(norm,glyph(g,Math.floor(r()*8/step)*step,true));why=[['why.odd.mirror']];
  }
  return {type:'odd',level,options:res.items,ans:res.ans,why};
}

function buildSeq(level,r){
  let frames,answer,tiers,k=4,why;
  if(level===1){
    const [a,b,...rest]=sample(r,SHAPES,4),col=pick(r,POOL.color);
    frames=[a,b,a,b,a].map(s=>fig({shape:s,color:col}));answer=fig({shape:b,color:col});
    tiers=[[fig({shape:a,color:col})],rest.map(s=>fig({shape:s,color:col}))];k=3;why=[['why.seq.cycle',2]];
  }else if(level===2){
    const sh=sample(r,SHAPES,4),co=sample(r,POOL.color,3),it=[0,1,2].map(i=>fig({shape:sh[i],color:co[i]}));
    frames=[0,1,2,0,1].map(i=>it[i]);answer=it[2];
    tiers=[[it[0],it[1],fig({shape:sh[2],color:co[0]}),fig({shape:sh[2],color:co[1]})],[fig({shape:sh[3],color:co[2]})]];why=[['why.seq.cycle',3]];
  }else if(level===3){
    const col=r()<.5,ord=col?[0,3,6,1,4,7,2,5,8]:[0,1,2,3,4,5,6,7,8],oth=col?[0,1,2,3,4,5,6,7,8]:[0,3,6,1,4,7,2,5,8];
    const s=pick(r,[1,2]),G=c=>grid(c,3);
    frames=[0,1,2,3].map(i=>G(ord.slice(0,s+i)));answer=G(ord.slice(0,s+4));
    tiers=[[G(ord.slice(0,s+3).concat(ord[s+4])),G(ord.slice(0,s+5)),G(oth.slice(0,s+4))],[G(ord.slice(0,s+3))]];
    why=[[col?'why.seq.fill.col':'why.seq.fill.row']];
  }else if(level===4||level===6||level===8){
    const r0=Math.floor(r()*8),col=pick(r,POOL.color),A=(rot,c=col)=>fig({shape:'arrow',rot:m8(rot),color:c});
    if(level===4){const s=pick(r,[2,6]);
      frames=[0,1,2,3].map(i=>A(r0+i*s));answer=A(r0+4*s);
      tiers=[[A(r0+4*s+1),A(r0+4*s-1),A(r0+3*s)],[A(r0+4*s+4)]];why=[rotWhy('why.seq.rot',s)];
    }else if(level===6){const s=pick(r,[1,7]),p=pick(r,[2,3]),cs=sample(r,POOL.color,3),C=i=>cs[i%p];
      frames=[0,1,2,3,4].map(i=>A(r0+i*s,C(i)));const at=r0+5*s;answer=A(at,C(5));
      tiers=[cs.filter(c=>c!==C(5)).map(c=>A(at,c)).concat([A(at+s,C(5)),A(at-s,C(5))]),[A(at+s,C(4)),A(at+2*s,C(5))]];
      k=5;why=[rotWhy('why.seq.rot',s),['why.seq.color',p]];
    }else{const d=pick(r,[1,-1]);
      frames=[0,1,3,6].map(t=>A(r0+t*d));answer=A(r0+10*d);
      tiers=[[A(r0+9*d),A(r0+11*d),A(r0+6*d)],[A(r0+12*d)]];k=5;why=[[d>0?'why.seq.grow.cw':'why.seq.grow.ccw']];
    }
  }else if(level===5){
    const a=Math.floor(r()*8),s=pick(r,[1,2,7,6]);
    frames=[0,1,2,3].map(i=>sect([m8(a+i*s)]));const at=a+4*s;answer=sect([m8(at)]);
    tiers=[[sect([m8(at+1)]),sect([m8(at-1)]),sect([m8(at-s)])],[sect([m8(at+4)])]];
    const n=s<=2?s:8-s;why=[[s<=2?'why.seq.move.cw':'why.seq.move.ccw',{pl:n,f:'sectors'}]];
  }else if(level===7){
    let a,b;do{a=Math.floor(r()*8);b=Math.floor(r()*8)}while([0,1,2,3,4,5].some(i=>m8(a+i)===m8(b-i)));
    const S=(pa,pb,ca=1,cb=0)=>sect([[m8(pa),ca],[m8(pb),cb]]);
    frames=[0,1,2,3].map(i=>S(a+i,b-i));answer=S(a+4,b-4);
    tiers=[[S(a+4,b-4,0,1),S(a+5,b-4),S(a+4,b-3),S(a+3,b-5)],[S(a+3,b-3)]].map(t=>t.filter(x=>x.on[0][0]!==x.on[1][0]));
    k=5;why=[['why.seq.two',{c:1},{c:0}]];
  }else{
    // A figure that turns; one option is its mirror image.
    const g=level===9?'flag':'tri',r0=Math.floor(r()*8),d=pick(r,[1,-1]),G=(t,m)=>glyph(g,r0+t*d,m);
    if(level===9){frames=[0,1,2,3].map(t=>G(t));answer=G(4);
      tiers=[[G(4,true),G(5),G(3)],[G(5,true),G(3,true)]];k=5;why=[rotWhy('why.seq.rot',d>0?1:7),['why.seq.mirror']];
    }else{frames=[0,1,3,6].map(t=>G(t));answer=G(10);
      tiers=[[G(10,true),G(9),G(11)],[G(9,true),G(6),G(12)]];k=6;why=[[d>0?'why.seq.grow.cw':'why.seq.grow.ccw'],['why.seq.mirror']];
    }
  }
  const o=withOptions(r,answer,tiers,k);
  return {type:'seq',level,frames,options:o.options,ans:o.ans,why};
}
const rotWhy=(base,s)=>[s<=4?base+'.cw':base+'.ccw',[0,45,90,135,180,135,90,45][s]];

function explainP(p){
  if(!p.why)return explain(p.specs);
  const arg=a=>a&&typeof a==='object'?(a.pl!==undefined?a.pl+' '+plural(a.pl,T(a.f)):T('colors')[a.c]):a;
  return p.why.map(([k,...a])=>T(k,...a.map(arg)));
}

/* drawing for the new kinds of pictures */
function sectSVG(c){
  const n=c.n,R=40,pt=a=>{const t=(a*360/n-90)*Math.PI/180;return (50+R*Math.cos(t)).toFixed(2)+','+(50+R*Math.sin(t)).toFixed(2)};
  const wedges=c.on.map(o=>{const [i,col]=Array.isArray(o)?o:[o,1];return `<path d="M50,50 L${pt(i)} A${R},${R} 0 0 1 ${pt(i+1)} Z" style="fill:var(--c${col})"/>`}).join('');
  const spokes=Array.from({length:n/2},(_,i)=>`<line x1="${pt(i).split(',')[0]}" y1="${pt(i).split(',')[1]}" x2="${pt(i+n/2).split(',')[0]}" y2="${pt(i+n/2).split(',')[1]}"/>`).join('');
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${wedges}<g style="stroke:var(--ink);stroke-width:2;fill:none">${spokes}<circle cx="50" cy="50" r="${R}"/></g></svg>`;
}
function gridSVG(c){
  const n=c.n,W=72,s=W/n,o=14;let h='';
  c.on.forEach(i=>{h+=`<rect x="${(o+(i%n)*s).toFixed(2)}" y="${(o+Math.floor(i/n)*s).toFixed(2)}" width="${s.toFixed(2)}" height="${s.toFixed(2)}" style="fill:var(--c1)"/>`});
  let l='';for(let i=1;i<n;i++){const v=(o+i*s).toFixed(2);l+=`<line x1="${v}" y1="${o}" x2="${v}" y2="${o+W}"/><line x1="${o}" y1="${v}" x2="${o+W}" y2="${v}"/>`}
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${h}<g style="stroke:var(--ink);stroke-width:1.6;fill:none">${l}<rect x="${o}" y="${o}" width="${W}" height="${W}" style="stroke-width:2.6"/></g></svg>`;
}
const GLYPH={
  flag:`<g style="stroke:var(--ink);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round;fill:none"><line x1="16" y1="44" x2="84" y2="44"/><path d="M50 24V74H31"/><rect x="41.5" y="7" width="17" height="17" style="fill:var(--c1)"/><circle cx="23" cy="74" r="8" style="fill:var(--c0)"/></g>`,
  tri:(()=>{const A=[50,16],B=[86,78],C=[14,78],P=(t,X,Y)=>[X[0]+(Y[0]-X[0])*t,X[1]+(Y[1]-X[1])*t],pts=a=>a.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ');
    return `<g style="stroke:var(--ink);stroke-width:3;stroke-linejoin:round"><polygon points="${pts([A,B,C])}" style="fill:var(--card)"/><polygon points="${pts([A,P(.42,A,B),P(.42,A,C)])}" style="fill:var(--ink)"/><polygon points="${pts([B,P(.42,B,A),P(.42,B,C)])}" style="fill:var(--c3)"/></g>`})()
};
function glyphSVG(c){return `<svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(${c.rot*45} 50 50)${c.mir?' matrix(-1 0 0 1 100 0)':''}">${GLYPH[c.g]}</g></svg>`}
// Outlines for frames and inner shapes; R is the outer radius in the 100×100 box.
const CURVE={heart:'M0 30C-30 10-34-16-16-22C-6-25 0-16 0-10C0-16 6-25 16-22C34-16 30 10 0 30Z',
  cloud:'M-28 14C-40 14-40-4-28-4C-30-18-12-24-6-14C-2-28 22-28 22-12C36-14 40 6 28 10C30 20 14 24 8 16C2 24-16 24-18 14Z',
  drop:'M0-32C10-10 22 4 22 14A22 22 0 0 1-22 14C-22 4-10-10 0-32Z',
  shield:'M-34-30Q-17-20 0-34Q17-20 34-30L34 0Q34 26 0 38Q-34 26-34 0Z'};
const polyPts=(n,R,rot=0)=>Array.from({length:n},(_,i)=>{const a=(-90+rot+360*i/n)*Math.PI/180;return (50+R*Math.cos(a)).toFixed(1)+','+(50+R*Math.sin(a)).toFixed(1)}).join(' ');
function outline(s,R,rot=0,st=''){
  const P=pts=>`<polygon points="${pts.map(([x,y])=>(50+x*R).toFixed(1)+','+(50+y*R).toFixed(1)).join(' ')}" style="${st}"/>`;
  if(s[0]==='p')return `<polygon points="${polyPts(+s.slice(1),R,rot)}" style="${st}"/>`;
  if(s==='dia')return P([[0,-1],[.65,0],[0,1],[-.65,0]]);
  if(s==='trap')return P([[-.55,-.55],[.55,-.55],[1,.55],[-1,.55]]);
  if(s==='para')return P([[-.5,-.5],[1,-.5],[.5,.5],[-1,.5]]);
  if(s==='circle')return `<circle cx="50" cy="50" r="${(R*.9).toFixed(1)}" style="${st}"/>`;
  if(s==='ellipse')return `<ellipse cx="50" cy="50" rx="${R}" ry="${(R*.55).toFixed(1)}" style="${st}"/>`;
  return `<path d="${CURVE[s]}" transform="translate(50 50) scale(${(R/36).toFixed(3)})" style="${st};vector-effect:non-scaling-stroke"/>`;
}
const LINE='stroke:var(--ink);stroke-width:2.6;stroke-linejoin:round';
function nestSVG(c){const inR=c.o[0]==='p'&&c.i[0]==='p'?25:20;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">${outline(c.o,40,0,LINE+';fill:none')}${outline(c.i,inR,c.ir*15,LINE+';fill:var(--c1)')}</svg>`}
function halvesSVG(c){
  const fr={sq:'<rect x="12" y="12" width="76" height="76"/>',ci:'<circle cx="50" cy="50" r="38"/>',oct:`<polygon points="${polyPts(8,41,22.5)}"/>`,dsh:'<path d="M12 12H50A38 38 0 0 1 50 88H12Z"/>'}[c.f];
  const f=c.a*45*Math.PI/180,dx=22*Math.cos(f),dy=22*Math.sin(f);
  const half=(x,y,th)=>{const p=a=>{const t=(th+a)*Math.PI/180;return (x+11*Math.cos(t)).toFixed(1)+' '+(y+11*Math.sin(t)).toFixed(1)};
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" style="fill:var(--card)"/><path d="M${p(-90)}A11 11 0 0 1 ${p(90)}Z" style="fill:var(--ink)"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" style="fill:none"/>`};
  const th=c.a*45;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g style="${LINE};fill:none">${fr}</g><g style="${LINE}">${half(50+dx,50+dy,th)}${half(50-dx,50-dy,c.flip?th:th+180)}</g></svg>`}
function numSVG(c){return `<svg viewBox="0 0 100 100" aria-hidden="true">${outline('p'+c.n,40,0,LINE+';fill:none')}<text x="50" y="${c.n===3?62:58}" text-anchor="middle" style="font:800 ${c.n===3?19:22}px var(--body,system-ui);fill:var(--ink)">${c.t}</text></svg>`}
function drawFig(c){return c.k==='nest'?nestSVG(c):c.k==='halves'?halvesSVG(c):c.k==='num'?numSVG(c):c.k==='sect'?sectSVG(c):c.k==='grid'?gridSVG(c):c.k==='glyph'?glyphSVG(c):figSVG(c)}

// The picture area of a puzzle: the grid with a gap, the row to continue, or (odd one out) the pictures themselves.
function boardHTML(p,solved){
  if(p.type==='match')return matchBoard(p,solved?{sol:true}:null);
  const q=c=>solved?`<div class="cell q solved">${drawFig(c)}</div>`:`<div class="cell q">?</div>`;
  if(p.type==='odd')return `<div class="board row" style="grid-template-columns:repeat(5,1fr)">${p.options.map((c,i)=>`<div class="cell${solved&&i===p.ans?' q solved':''}">${drawFig(c)}</div>`).join('')}</div>`;
  if(p.type==='seq')return `<div class="board row" style="grid-template-columns:repeat(${p.frames.length+1},1fr)">${p.frames.map(c=>`<div class="cell">${drawFig(c)}</div>`).join('')}${q(p.options[p.ans])}</div>`;
  return `<div class="board" style="grid-template-columns:repeat(${p.n},1fr)">${p.cells.map((c,i)=>i===p.miss?q(c):`<div class="cell">${drawFig(c)}</div>`).join('')}</div>`;
}

// Each daily set mixes the three kinds: m = missing figure, o = odd one out, s = what comes next; the number is the level.
const MODES={easy:{lv:['m1','o1','s1','m2','o2','s2','m3','o3','s4','m5']},mid:{lv:['m1','o2','s3','m4','o5','s6','m7','o8','s9','m10']},hard:{lv:['m5','o6','s6','m7','o8','s8','m9','o10','s10','m10']}};
const MODE_KEYS=['easy','mid','hard'],TYPES=['mix','m','o','s'];
const rk=(d,m)=>m==='mid'?d:d+'|'+m;
const cache={};
function buildPuzzle(tok,r){const l=+tok.slice(1);return tok[0]==='o'?buildOdd(l,r):tok[0]==='s'?buildSeq(l,r):buildLevel(l,r)}
// type narrows a practice set to one kind of puzzle; daily sets are always 'mix'.
function getSet(seed,mode,type='mix'){const k=seed+'|'+mode+'|'+type;
  if(!cache[k])cache[k]=MODES[mode].lv.map((t,i)=>{if(type!=='mix')t=type+t.slice(1);return buildPuzzle(t,rngFrom(rk(seed,mode)+'#'+i+(t[0]==='m'?'':t[0])))});
  return cache[k]}

// i18n key for the kind of a puzzle, as shown above it.
const typeKey=p=>'type.'+(p.type==='match'?p.kind:p.type[0]);
const levelName=l=>T(l<=3?'lv.easy':l<=6?'lv.mid':l<=8?'lv.hard':'lv.vhard');
const dstr=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
