/* Shape Quest matchstick puzzles: move one or two matches to fix an equation or to make a number.
   Needs puzzles.js (rngFrom, pick, shuffle, rk) and i18n.js (T). The same date and difficulty always give the same 10 puzzles. */

/* ---------- model ---------- */
// Segments of a digit: 0 top, 1 top right, 2 bottom right, 3 bottom, 4 bottom left, 5 top left, 6 middle.
const DIG=[0b0111111,0b0000110,0b1011011,0b1001111,0b1100110,0b1101101,0b1111101,0b0000111,0b1111111,0b1101111];
// A puzzle is a row of glyphs: 'd' digit (7 slots), 'o' plus or minus (1 slot: the upright match), '=' (fixed).
// A state is a string of '1'/'0', one character per slot, in glyph order.
function mtEncode(chars){
  const glyphs=[],bits=[];
  chars.forEach(ch=>{
    if(ch==='=')glyphs.push('=');
    else if(ch==='+'||ch==='-'){glyphs.push('o');bits.push(ch==='+'?1:0)}
    else{glyphs.push('d');for(let i=0;i<7;i++)bits.push(DIG[ch]>>i&1)}});
  return{glyphs,st:bits.join('')};
}
// Glyph and segment of every slot.
function mtSlots(glyphs){const s=[];glyphs.forEach((t,g)=>{if(t==='d')for(let i=0;i<7;i++)s.push([g,i]);else if(t==='o')s.push([g,7])});return s}
// Characters of a state, or null when a digit is not a real digit.
function mtChars(glyphs,st){
  let k=0;const out=[];
  for(const t of glyphs){
    if(t==='=')out.push('=');
    else if(t==='o')out.push(st[k++]==='1'?'+':'-');
    else{let m=0;for(let i=0;i<7;i++)if(st[k++]==='1')m|=1<<i;const d=DIG.indexOf(m);if(d<0)return null;out.push(String(d))}}
  return out;
}
// A number (number puzzles) or true/false (equations); null when not well formed (bad digit, leading zero).
function mtValue(glyphs,st){
  const c=mtChars(glyphs,st);if(!c)return null;
  const s=c.join('');if(/(^|\D)0\d/.test(s))return null;
  if(!s.includes('='))return +s;
  const side=x=>(x.match(/[+-]?\d+/g)||[]).reduce((a,b)=>a+ +b,0);
  const [l,r]=s.split('=');return side(l)===side(r);
}
const mtMoved=(a,b)=>{let n=0;for(let i=0;i<a.length;i++)if(a[i]==='1'&&b[i]==='0')n++;return n};
// Every state one move away: one match taken from a slot and put into an empty one.
function mtNext(st){
  const on=[],off=[],out=[];
  for(let i=0;i<st.length;i++)(st[i]==='1'?on:off).push(i);
  on.forEach(a=>off.forEach(b=>{const x=st.split('');x[a]='0';x[b]='1';out.push(x.join(''))}));
  return out;
}
function mtRandMove(r,st){
  const on=[],off=[];for(let i=0;i<st.length;i++)(st[i]==='1'?on:off).push(i);
  const x=st.split('');x[pick(r,on)]='0';x[pick(r,off)]='1';return x.join('');
}
function mtReach(st,k){const one=mtNext(st);if(k===1)return one;const all=new Set(one);one.forEach(s=>mtNext(s).forEach(x=>all.add(x)));all.delete(st);return[...all]}
const mtGlyphsChanged=(glyphs,a,b)=>{const sl=mtSlots(glyphs),g=new Set();for(let i=0;i<a.length;i++)if(a[i]!==b[i])g.add(sl[i][0]);return[...g]};
function mtScopeOk(glyphs,a,b,scope){
  const g=mtGlyphsChanged(glyphs,a,b);
  if(scope==='in')return g.length===1;
  if(scope==='x')return g.length===2&&g.every(i=>glyphs[i]==='d');
  if(scope==='op')return g.some(i=>glyphs[i]==='o');
  return true;
}

/* ---------- levels ---------- */
// n = numbers (make a given number, the largest or the smallest), e = equations; d digits, w number width, k matches to move.
const MT_LV={
  n1:{d:1,k:1,goal:'to'},n2:{d:2,k:1,goal:'to',scope:'in'},n3:{d:2,k:1,goal:'to',scope:'x'},n4:{d:2,k:1,goal:'max'},
  n5:{d:3,k:1,goal:'to'},n6:{d:2,k:1,goal:'min'},n7:{d:3,k:1,goal:'max'},n8:{d:2,k:2,goal:'to'},n9:{d:3,k:2,goal:'max'},n10:{d:3,k:2,goal:'mm'},
  e1:{w:1,k:1,scope:'in'},e2:{w:1,k:1,scope:'x'},e3:{w:1,k:1,scope:'op'},e4:{w:2,k:1},e5:{w:2,k:1,flip:1},
  e6:{w:3,k:1},e7:{w:1,k:2},e8:{w:1,k:2,scope:'op'},e9:{w:2,k:2},e10:{w:3,k:2,flip:1}
};
const rint=(r,a,b)=>a+Math.floor(r()*(b-a+1));
function mtNumber(r,d){let s=String(rint(r,1,9));while(s.length<d)s+=rint(r,0,9);return d===1?String(rint(r,0,9)):s}
// A true equation: w=1 single digits, w=2 one two-digit number, w=3 two-digit numbers.
function mtEquation(r,w,flip){
  for(;;){
    const op=pick(r,['+','-']);let a,b;
    if(w===1){a=rint(r,0,9);b=rint(r,0,9)}else if(w===2){a=rint(r,10,25);b=rint(r,1,9)}else{a=rint(r,10,59);b=rint(r,10,39)}
    const c=op==='+'?a+b:a-b;
    if(c<0||(w===1&&c>9)||c>99)continue;
    if(w===2&&op==='+'&&r()<.5)[a,b]=[b,a];
    const s=flip&&r()<.5?c+'='+a+op+b:a+op+b+'='+c;
    return s.split('');
  }
}
function buildMatch(tok,r){
  const level=+tok.slice(1),kind=tok[0],L=MT_LV[tok];
  for(let tries=0;;tries++){
    const scope=tries<150?L.scope:undefined;  // relax the move rule if a seed is unlucky
    const p=kind==='e'?mtTryEq(r,L,scope):mtTryNum(r,L,scope);
    if(p)return Object.assign(p,{type:'match',kind,level,k:L.k},mtWhy(p));
  }
}
function mtTryEq(r,L,scope){
  const {glyphs,st:sol}=mtEncode(mtEquation(r,L.w,L.flip));
  const ok=s=>s!==sol&&mtValue(glyphs,s)===false&&mtScopeOk(glyphs,s,sol,scope);
  let start;
  if(L.k===1){const c=shuffle(r,mtNext(sol)).filter(ok);start=c[0]}
  else for(let i=0;i<60&&!start;i++){
    const s=mtRandMove(r,mtRandMove(r,sol));
    if(ok(s)&&mtMoved(s,sol)===2&&!mtNext(s).some(x=>mtValue(glyphs,x)===true))start=s;
  }
  return start?{glyphs,start,sol,goal:'eq'}:null;
}
function mtTryNum(r,L,scope){
  const {glyphs,st:start}=mtEncode(mtNumber(r,L.d).split(''));
  const v0=mtValue(glyphs,start),all=mtReach(start,L.k).filter(s=>mtValue(glyphs,s)!==null);
  const need=s=>L.k===1||mtMoved(start,s)===2;
  if(L.goal==='to'){
    const c=shuffle(r,all.filter(s=>mtValue(glyphs,s)!==v0&&need(s)&&mtScopeOk(glyphs,start,s,scope)));
    return c.length?{glyphs,start,sol:c[0],goal:'to',target:mtValue(glyphs,c[0])}:null;
  }
  const goal=L.goal==='mm'?pick(r,['max','min']):L.goal,sg=goal==='max'?1:-1;
  let best=null;all.forEach(s=>{if(best===null||sg*(mtValue(glyphs,s)-mtValue(glyphs,best))>0)best=s});
  if(best===null||sg*(mtValue(glyphs,best)-v0)<=0||!need(best))return null;
  // with two moves the best number must not be reachable with one
  if(L.k===2&&mtNext(start).some(s=>mtValue(glyphs,s)===mtValue(glyphs,best)))return null;
  return{glyphs,start,sol:best,goal,target:mtValue(glyphs,best)};
}
const mtShow=c=>c.join('').replace(/([+\-=])/g,' $1 ').replace(/-/g,'−');
const mtGlyphLabel=(c,g)=>'«'+(c[g]==='-'?'−':c[g])+'»';
function mtWhy(p){
  const a=mtChars(p.glyphs,p.start),b=mtChars(p.glyphs,p.sol),g=mtGlyphsChanged(p.glyphs,p.start,p.sol).sort((x,y)=>x-y);
  const chg=g.map(i=>mtGlyphLabel(a,i)+' → '+mtGlyphLabel(b,i)).join(', ');
  const last=p.goal==='eq'?['why.mt.eq',mtShow(b)]:p.goal==='to'?['why.mt.to',p.target]:['why.mt.'+p.goal,p.target];
  return{why:[['why.mt.chg',chg],last],hint:[['mt.hint',g.map(i=>mtGlyphLabel(a,i)).join(', ')]]};
}

/* ---------- sets ---------- */
const MT_MODES={easy:{lv:['n1','e1','n2','e2','n3','e3','n4','e4','n5','e5']},mid:{lv:['n1','e2','n3','e4','n5','e6','n7','e8','n9','e10']},hard:{lv:['e5','n6','e6','n7','e7','n8','e8','n9','e9','e10']}};
const MT_TYPES=['mix','e','n'];
// Daily results of the matchstick section are kept apart from the figure section.
const mtKey=(d,m)=>'mt|'+rk(d,m);
const mtCache={};
function getMatchSet(seed,mode,type='mix'){const k=seed+'|'+mode+'|'+type;
  if(!mtCache[k])mtCache[k]=MT_MODES[mode].lv.map((t,i)=>{if(type!=='mix')t=type+t.slice(1);return buildMatch(t,rngFrom(rk(seed,mode)+'#'+i+'mt'+t[0]))});
  return mtCache[k]}

/* ---------- play ---------- */
const mtState=p=>({cur:p.start,held:null,msg:null});
// Tap a match to pick it up, tap an empty place to put it down. Returns nothing; the state changes.
function mtTap(p,st,s){
  st.msg=null;const c=st.cur.split('');
  if(st.held===null||c[s]==='1'){st.held=st.held===s?null:(c[s]==='1'?s:null);return}
  c[st.held]='0';c[s]='1';const nx=c.join('');
  if(mtMoved(p.start,nx)>p.k){st.msg='mt.tooMany';return}
  st.cur=nx;st.held=null;
}
function mtCheck(p,cur){
  const n=mtMoved(p.start,cur);if(n<1||n>p.k)return false;
  const v=mtValue(p.glyphs,cur);
  return p.goal==='eq'?v===true:v===p.target;
}
const mtAsk=p=>T('mt.ask.'+p.goal,T('mt.n'+p.k),p.target);
const mtHint=p=>p.hint.map(([k,a])=>T(k,a));

/* ---------- drawing ---------- */
const MT_W={d:50,o:44,'=':44},MT_GAP=8,MT_H=92;
// Local ends of each slot: digit segments 0–6, operator upright 7, operator bar 8, equals bars 9 and 10.
const MT_SEG=[[9,8,41,8],[44,11,44,43],[44,47,44,79],[9,82,41,82],[6,47,6,79],[6,11,6,43],[9,45,41,45],[22,29,22,61],[6,45,38,45],[6,37,38,37],[6,53,38,53]];
// A match: wooden stick with a red head, drawn a little shorter than its slot so the corners stay apart.
function mtStick(x1,y1,x2,y2,cls){
  const h=x1===x2;if(h){y1+=2;y2-=2}else{x1+=2;x2-=2}
  return `<g class="${cls}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="mb"/><circle cx="${x1}" cy="${y1}" r="3.8" class="mh"/></g>`;
}
// view: null = the starting picture; {sol:true} = the solution with moved matches marked; a play state = interactive.
function matchBoard(p,view){
  const sl=mtSlots(p.glyphs),play=view&&!view.sol;
  const cur=view?(view.sol?p.sol:view.cur):p.start,held=play?view.held:null;
  const xs=[];let x=4;p.glyphs.forEach(t=>{xs.push(x);x+=MT_W[t]+MT_GAP});
  const W=x-MT_GAP+4;let fixed='',ghost='',sticks='',hits='';
  p.glyphs.forEach((t,g)=>{
    const segs=t==='o'?[8]:t==='='?[9,10]:[];
    segs.forEach(s=>{const [a,b,c,d]=MT_SEG[s];fixed+=mtStick(xs[g]+a,b,xs[g]+c,d,'m')});
  });
  sl.forEach(([g,s],i)=>{
    const [a,b,c,d]=MT_SEG[s],x1=xs[g]+a,x2=xs[g]+c,on=cur[i]==='1',was=p.start[i]==='1';
    if(on)sticks+=mtStick(x1,b,x2,d,'m'+(i===held?' held':'')+(view&&view.sol&&!was?' new':''));
    else if(view&&view.sol&&was||held!==null)ghost+=`<line x1="${x1}" y1="${b}" x2="${x2}" y2="${d}" class="${view.sol?'gone':'slot'}"/>`;
    if(play)hits+=`<line x1="${x1}" y1="${b}" x2="${x2}" y2="${d}" class="hit" data-act="slot" data-s="${i}"/>`;
  });
  return `<div class="mboard" style="max-width:${Math.round(W*1.8)}px"><svg viewBox="0 0 ${W} ${MT_H}" role="img" aria-label="${mtShow(mtChars(p.glyphs,cur)||[])}">${ghost}${fixed}${sticks}${hits}</svg></div>`;
}
