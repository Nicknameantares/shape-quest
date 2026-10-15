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
  return {level,n,cells,miss,options:opts,ans:ansIdx,specs};
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

const MODES={easy:{lv:[1,1,2,2,3,3,4,4,5,5]},mid:{lv:[1,2,3,4,5,6,7,8,9,10]},hard:{lv:[5,6,6,7,7,8,8,9,9,10]}};
const MODE_KEYS=['easy','mid','hard'];
const rk=(d,m)=>m==='mid'?d:d+'|'+m;
const cache={};
function getSet(seed,mode){const k=seed+'|'+mode;if(!cache[k])cache[k]=MODES[mode].lv.map((l,i)=>buildLevel(l,rngFrom(rk(seed,mode)+'#'+i)));return cache[k]}

const levelName=l=>T(l<=3?'lv.easy':l<=6?'lv.mid':l<=8?'lv.hard':'lv.vhard');
const dstr=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
