// App logic. Loaded after data.js, which defines DATA (words) and PHRASES (example sentences).
const enIdx = new Map(), dgIdx = new Map();
function norm(s){return s.toLowerCase().replace(/’/g,"'").replace(/\([^)]*\)/g,' ').replace(/[^\p{L}\p{M}\p{N}\s'-]/gu,' ').replace(/\s+/g,' ').trim();}
function strip(s){return s.replace(/^(to|a|an|the)\s+/,'');}
function addTo(m,key,row){
  if(!key) return;
  if(!m.has(key)) m.set(key,[]);
  const l=m.get(key);
  if(l.indexOf(row)<0) l.push(row);
}
DATA.forEach(function(row){
  addTo(enIdx,strip(norm(row[1])),row);
  row[1].split(/[;,\/]|\bor\b/).forEach(function(p){addTo(enIdx,strip(norm(p)),row);});
  addTo(dgIdx,row[0].toLowerCase(),row);
});
const $=function(id){return document.getElementById(id);};
$('count').textContent = DATA.length.toLocaleString('en') + ' words and ' + PHRASES.length.toLocaleString('en') + ' example sentences.';
const pTok = PHRASES.map(function(p){const e=norm(p[1]), d=norm(p[0]); return {r:p,enFull:e,dgFull:d,en:e.split(' '),dg:d.split(' ')};});
const STOP={to:1,a:1,an:1,the:1};
const POS={'n.':'noun','v.':'verb','adj.':'adjective','adv.':'adverb','pron.':'pronoun','conj.':'conjunction','interj.':'interjection','prep.':'preposition','part.':'particle','def. art.':'definite article'};
function posName(r){return r[2]?(POS[r[2]]||r[2]):'';}
const rowId=new Map();
DATA.forEach(function(r,i){rowId.set(r,'w'+i);});
PHRASES.forEach(function(r,i){rowId.set(r,'p'+i);});
const AUDIO_EXT=['mp3','m4a','aac','wav','ogg'];
function playDagaare(row){
  if(!row||!rowId.has(row)){toast('No Dagaare audio for this one yet'); return;}
  const id=rowId.get(row);
  let i=0;
  (function next(){
    if(i>=AUDIO_EXT.length){toast('No Dagaare audio yet'); return;}
    const a=new Audio('audio/'+id+'.'+AUDIO_EXT[i++]);
    a.addEventListener('error',next);
    const p=a.play(); if(p&&p.catch) p.catch(function(){});
  })();
}
function examples(t){
  const ws=norm(t).split(' ').filter(function(w){return w && (dir==='dg' || !STOP[w]);});
  if(!ws.length) return [];
  const out=[];
  for(let i=0;i<pTok.length;i++){
    const x=pTok[i], toks=dir==='en'?x.en:x.dg;
    if(ws.every(function(w){return toks.indexOf(w)>=0;})) out.push(x);
  }
  out.sort(function(a,b){return a.r[0].length-b.r[0].length;});
  return out.slice(0,5).map(function(x){return x.r;});
}
let dir='en', cur={primary:'',alts:[],note:'',best:null}, favs=[];
try{const f=JSON.parse(localStorage.getItem('dg-favs')||'[]'); if(Array.isArray(f)) favs=f;}catch(e){}
function saveFavs(){try{localStorage.setItem('dg-favs',JSON.stringify(favs));}catch(e){}}
function isFav(r){return !!r && favs.some(function(f){return f[0]===r[0]&&f[1]===r[1];});}
function lookupEn(term){
  const k=strip(norm(term));
  if(!k) return {kind:'none',rows:[]};
  if(enIdx.has(k)){
    const rs=enIdx.get(k).slice().sort(function(a,b){
      const x=strip(norm(a[1]))===k?0:1, y=strip(norm(b[1]))===k?0:1;
      return x-y || a[1].length-b[1].length;
    });
    return {kind:'exact',rows:rs};
  }
  const rel=[];
  enIdx.forEach(function(rows,key){
    if(key.split(' ').indexOf(k)>=0) rows.forEach(function(r){if(rel.indexOf(r)<0) rel.push(r);});
  });
  return rel.length?{kind:'related',rows:rel.slice(0,8)}:{kind:'none',rows:[]};
}
function lookupDg(term){
  const k=term.toLowerCase().trim();
  return dgIdx.has(k)?{kind:'exact',rows:dgIdx.get(k)}:{kind:'none',rows:[]};
}
function lookup(t){return dir==='en'?lookupEn(t):lookupDg(t);}
function tgt(r){return dir==='en'?r[0]:r[1];}
function compute(text){
  const t=text.trim();
  if(!t) return {primary:'',alts:[],note:'',best:null};
  const nt=norm(t);
  const pm=pTok.find(function(x){return (dir==='en'?x.enFull:x.dgFull)===nt;});
  if(pm) return {primary:dir==='en'?pm.r[0]:pm.r[1],alts:[],note:'Example sentence from the dictionary. Not checked by a native speaker.',best:pm.r};
  const w=lookup(t);
  if(w.kind==='exact') return {primary:tgt(w.rows[0]),alts:w.rows.slice(1,6),note:posName(w.rows[0]),best:w.rows[0]};
  if(w.kind==='related') return {primary:'',alts:w.rows,note:'No exact match. Closest entries:',best:null};
  const ws=t.split(/\s+/);
  if(ws.length>1){
    let found=0;
    const parts=ws.map(function(x){const r=lookup(x); if(r.kind==='exact'){found++; return tgt(r.rows[0]);} return '['+x+']';});
    if(found) return {primary:parts.join(' '),alts:[],note:'Word by word. [ ] means no translation yet.',best:null};
  }
  return {primary:'',alts:[],note:'No translation yet for “'+t+'”.',best:null};
}
function mk(tag,cls,text){const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined) e.textContent=text; return e;}
function render(){
  cur=compute($('q').value);
  $('big').textContent=cur.primary;
  $('note').textContent=cur.note;
  const box=$('alts'); box.textContent='';
  cur.alts.forEach(function(r){
    const d=mk('div','alt'); d.appendChild(mk('b','',r[0])); d.appendChild(mk('span','',r[1]+(r[2]?' · '+posName(r):''))); box.appendChild(d);
  });
  const exr=examples($('q').value).filter(function(r){return r!==cur.best;});
  const ex=$('exs'); ex.textContent='';
  exr.forEach(function(r){const d=mk('div','alt ex'); d.appendChild(mk('b','',r[0])); d.appendChild(mk('span','',r[1])); ex.appendChild(d);});
  $('exlab').classList.toggle('hide',!exr.length);
  $('fav').classList.toggle('on',isFav(cur.best));
}
function labels(){
  const en=dir==='en';
  $('ls').firstChild.nodeValue=en?'English':'Dagaare'; $('ls').querySelector('small').textContent=en?'':'Central';
  $('lt').firstChild.nodeValue=en?'Dagaare':'English'; $('lt').querySelector('small').textContent=en?'Central':'';
  $('lab-in').textContent=en?'English':'Dagaare'; $('lab-out').textContent=en?'Dagaare':'English';
  $('q').placeholder=en?'Type an English word':'Type a Dagaare word';
  $('chars').classList.toggle('hide',en);
}
let tt;
function toast(m){const t=$('toast'); t.textContent=m; t.classList.add('show'); clearTimeout(tt); tt=setTimeout(function(){t.classList.remove('show');},1800);}
function speak(text,lang){
  if(!text) return;
  if(!('speechSynthesis' in window)){toast('Audio isn’t available here'); return;}
  const u=new SpeechSynthesisUtterance(text); u.lang=lang; speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function copyText(text,msg){
  if(!text){toast('Nothing to copy yet'); return;}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){toast(msg||'Copied');},function(){toast('Couldn’t copy');});
  } else toast('Couldn’t copy');
}
function renderFavs(){
  const box=$('favlist'); box.textContent='';
  if(!favs.length){box.appendChild(mk('div','note','Tap the heart on a translation to save it here.')); return;}
  favs.forEach(function(r){
    const p=mk('div','panel row'); const l=mk('div');
    l.appendChild(mk('div','big',r[0])); l.appendChild(mk('div','note',r[1]));
    const b=mk('button','fav on'); b.setAttribute('aria-label','Remove');
    b.innerHTML='<svg><use href="#i-heart"/></svg>';
    b.addEventListener('click',function(){favs=favs.filter(function(f){return !(f[0]===r[0]&&f[1]===r[1]);}); saveFavs(); renderFavs(); render();});
    p.appendChild(l); p.appendChild(b); box.appendChild(p);
  });
}
$('q').addEventListener('input',render);
$('swap').addEventListener('click',function(){
  const p=cur.primary;
  dir=dir==='en'?'dg':'en';
  if(p&&p.indexOf('[')<0) $('q').value=p;
  labels(); render();
});
$('clear').addEventListener('click',function(){$('q').value=''; render(); $('q').focus();});
$('sp-in').addEventListener('click',function(){if(dir==='en') speak($('q').value,'en-US'); else playDagaare(cur.best);});
$('sp-out').addEventListener('click',function(){
  if(dir==='dg'){if(cur.primary&&cur.primary.indexOf('[')<0) speak(cur.primary,'en-US');}
  else playDagaare(cur.best);
});
$('fav').addEventListener('click',function(){
  if(!cur.best){toast('Search for a word first'); return;}
  if(isFav(cur.best)) favs=favs.filter(function(f){return !(f[0]===cur.best[0]&&f[1]===cur.best[1]);}); else favs.push(cur.best);
  saveFavs(); render(); renderFavs();
});
$('copy').addEventListener('click',function(){copyText(cur.primary);});
$('max').addEventListener('click',function(){if(!cur.primary){toast('Nothing to show yet'); return;} $('full').textContent=cur.primary; $('full').classList.remove('hide');});
$('full').addEventListener('click',function(){$('full').classList.add('hide');});
$('share').addEventListener('click',function(){
  if(!cur.primary){toast('Nothing to share yet'); return;}
  if(navigator.share){navigator.share({text:cur.primary}).catch(function(){});} else copyText(cur.primary,'Copied to share');
});
$('chars').addEventListener('click',function(e){
  if(e.target.tagName!=='BUTTON') return;
  const q=$('q'); q.setRangeText(e.target.textContent,q.selectionStart,q.selectionEnd,'end'); q.focus(); render();
});
document.querySelectorAll('.tab').forEach(function(b){
  b.addEventListener('click',function(){
    const t=b.dataset.tab;
    if(t==='camera'||t==='voice'){toast('Coming soon'); return;}
    document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('on',x===b);});
    ['text','phrases','more'].forEach(function(v){$('v-'+v).classList.toggle('hide',v!==t);});
    if(t==='phrases') renderFavs();
  });
});
labels(); render();
