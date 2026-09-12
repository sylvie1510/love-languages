/* ============================================================
   חמש שפות של אהבה · המנוע
   ------------------------------------------------------------
   לא לערוך את הקובץ הזה. כל התוכן נמצא ב-content-01.js … content-04.js
   ובקבצי ה-HTML של התחנות.

   המנוע סורק את ה-HTML ומחפש רכיבים עם data-widget,
   ומייצר אותם לפי מה שמוגדר בקובץ התוכן של אותה תחנה.
   ============================================================ */

(function(){
'use strict';

const COUPLE_KEY   = 'lovelang.couple';
const PROGRESS_KEY = 'lovelang.progress';
const GLOBAL_KEY   = 'lovelang.global';
const STATION_KEY  = () => 'lovelang.st' + (window.STATION ? STATION.num : '00');

/* שדות שנשמרים לכל האפליקציה ולא לתחנה בודדת.
   השפה שנבחרה בתחנה 01 צריכה להיות זמינה גם ב-02, ב-03 וב-04. */
const GLOBAL_FIELDS = ['quiz','primary','tank','intensity','deficit','loved','mygive','hurts','actions'];

/* ---------- state ---------- */
let C = {p:[{name:'',g:'f'},{name:'',g:'m'}]};   // עמודה 0 = היא · עמודה 1 = הוא
let A = {};                                      // התשובות של התחנה הנוכחית
let G = {};                                      // התשובות המשותפות לכל התחנות

function load(){
  try{ const r = localStorage.getItem(COUPLE_KEY); if(r) C = JSON.parse(r); }catch(e){}
  if(C.solo){
    /* במצב סולו מי שממלא בוחר את המין של עצמו, ובן או בת הזוג הם ההפך. */
    if(C.p[0].g !== 'm' && C.p[0].g !== 'f') C.p[0].g = 'f';
    C.p[1].g = C.p[0].g === 'm' ? 'f' : 'm';
  } else {
    C.p[0].g = 'f'; C.p[1].g = 'm';   // קבוע. העמודה הראשונה שלה, השנייה שלו.
  }
  try{ const r = localStorage.getItem(STATION_KEY()); if(r) A = JSON.parse(r); }catch(e){}
  try{ const r = localStorage.getItem(GLOBAL_KEY);  if(r) G = JSON.parse(r); }catch(e){}
  /* הגירה · actions ישב פעם בתחנה 05 בלבד */
  if(!G.actions){
    try{ const old = JSON.parse(localStorage.getItem('lovelang.st05')||'{}');
      if(old.actions){ G.actions = old.actions; saveGlobal(); } }catch(e){}
  }
}
function saveCouple(){ try{ localStorage.setItem(COUPLE_KEY, JSON.stringify(C)); }catch(e){} }
function saveAnswers(){ try{ localStorage.setItem(STATION_KEY(), JSON.stringify(A)); }catch(e){} }
function saveGlobal(){  try{ localStorage.setItem(GLOBAL_KEY,  JSON.stringify(G)); }catch(e){} }

/* לאיזה מאגר שייך השדה */
function store(f){ return GLOBAL_FIELDS.indexOf(f) > -1 ? G : A; }
function save(f){   GLOBAL_FIELDS.indexOf(f) > -1 ? saveGlobal() : saveAnswers(); }

function progress(){
  try{ return JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}'); }catch(e){ return {}; }
}
/* תשובה נחשבת מלאה גם כשהיא רשימה או מערך של בחירות */
function filled(v){
  if(Array.isArray(v)) return v.filter(x => x && String(x).trim()).length > 0;
  return !!(v && String(v).trim());
}
function markProgress(){
  if(!window.STATION || !CARD.requires) return;
  const need = CARD.requires;
  const ok = (need.pair||[]).every(f => filled((store(f)[f]||[])[0]) && (C.solo || filled((store(f)[f]||[])[1])))
          && (need.shared||[]).every(f => filled(store(f)[f]));
  const p = progress(); p[STATION.num] = !!ok;
  try{ localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }catch(e){}
}

/* ---------- helpers ---------- */
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* [זכר/נקבה] לפי מי שמדברים אליו · <זכר/נקבה> לפי בן/בת הזוג · {משתנים} */
function rz(txt, i){
  if(!txt) return '';
  const me = C.p[i], you = C.p[1-i];
  let out = String(txt)
    .replace(/\[([^\[\]]*?)\/([^\[\]]*?)\]/g, (_,m,f) => me.g === 'm' ? m : f)
    .replace(/<([^<>]*?)\/([^<>]*?)>/g,      (_,m,f) => you.g === 'm' ? m : f)
    .replace(/\{שם\}/g,     me.name  || '·')
    .replace(/\{בן_זוג\}/g, you.name || '·');
  // כל שדה משותף זמין כמשתנה: {קוד} {זמן} וכו׳, לפי VARS בקובץ התוכן
  const vars = window.VARS || {};
  Object.keys(vars).forEach(k => {
    out = out.split('{'+k+'}').join(sval(vars[k].field) || vars[k].fallback || '___');
  });
  return out;
}

const val  = (f,i) => (store(f)[f]||[])[i] || '';
const list = (f,i) => ((store(f)[f]||[])[i]) || [];
function setPair(f,i,v){ const S=store(f); if(!Array.isArray(S[f])) S[f]=['','']; S[f][i]=v; save(f); }
/* במצב סולו מוצג טור אחד, חוץ מרכיבים שבהם ההשערה על השני היא כל העניין */
function people(el){
  if(!C.solo) return C.p;
  return (el && el.dataset && el.dataset.solo === 'guess') ? C.p : [C.p[0]];
}
/* השפה של בן/בת הזוג. בזוג — מה שהם ענו. בסולו — מה שהמשתמש משער. */
function partnerLang(i){ return C.solo ? val('guess',0) : val('primary',1-i); }

/* שדות משותפים לשניהם, לא טור לכל אחד */
const sval = (f) => store(f)[f] || '';
function sset(f,v){ store(f)[f]=v; save(f); }
/* מערך פר-אדם: quiz, loved, hurts */
function arr(f,i){ const S=store(f);
  if(!Array.isArray(S[f])) S[f]=[[],[]];
  if(!Array.isArray(S[f][i])) S[f][i]=[];
  return S[f][i]; }

/* ---------- ניקוד השאלון ---------- */
function quizRank(field, i){
  const ans = list(field, i), sc = {};
  (window.LANGS||[]).forEach(l => sc[l.id] = 0);
  ans.forEach(v => { if(v && sc.hasOwnProperty(v)) sc[v]++; });
  return (window.LANGS||[]).map(l => ({id:l.id, label:l.label, n:sc[l.id]}))
    .sort((a,b) => b.n - a.n);
}
function quizAnswered(field, i){ return list(field,i).filter(Boolean).length; }
/* אילו שפות קשורות במקום הראשון. תיקו הוא תשובה בפני עצמה, לא תקלה. */
function quizTies(field, i){
  const r = quizRank(field, i);
  if(!r.length || !r[0].n) return [];
  const top = r[0].n;
  const tied = r.filter(x => x.n === top);
  return tied.length > 1 ? tied : [];
}
function langBy(id){ return (window.LANGS||[]).find(l => l.id === id) || null; }
function langName(id){ const l = langBy(id); return l ? l.label : ''; }

/* ============================================================
   רכיבים
   ============================================================ */
const W = {};

/* בחירה יחידה, טור לכל אחד */
W.select = (el) => {
  const f = el.dataset.field, opts = window[el.dataset.options] || [];
  el.innerHTML = people(el).map((p,i)=>`
    <div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <div class="opts">
        ${opts.map(o=>`<button type="button" class="opt" data-act="select" data-f="${f}" data-i="${i}" data-v="${esc(o.id)}"
           aria-pressed="${val(f,i)===o.id}">${esc(rz(o.label,i))}${o.en?`<span class="en">${esc(o.en)}</span>`:''}${
           o.sub?`<small>${esc(rz(o.sub,i))}</small>`:''}</button>`).join('')}
      </div>
    </div>`).join('');
};

/* צ׳יפים לבחירה מרובה + שדה חופשי, טור לכל אחד */
W.chips = (el) => {
  const f = el.dataset.field, opts = window[el.dataset.options] || [], label = el.dataset.label||'';
  const ph = el.dataset.ph||'ומשהו משלי…';
  el.innerHTML = people(el).map((p,i)=>`
    <div>
      ${el.dataset.noname==='1'?'':`<div class="pname">${esc(p.name)||'·'}</div>`}
      <div class="field" style="margin-bottom:0">
        <label>${esc(rz(label,i))}</label>
        <div class="chips">
          ${opts.map(c=>`<button type="button" class="chip" data-act="chip" data-f="${f}" data-i="${i}" data-v="${esc(c)}"
             aria-pressed="${list(f,i).includes(c)}">${esc(rz(c,i))}</button>`).join('')}
        </div>
        <input type="text" data-act="free" data-f="${f}_free" data-i="${i}"
          value="${esc(val(f+'_free',i))}" placeholder="${esc(rz(ph,i))}" autocomplete="off">
      </div>
    </div>`).join('');
};

/* שדה טקסט חופשי, טור לכל אחד */
W.text = (el) => {
  const f = el.dataset.field, rows = el.dataset.rows||'3';
  el.innerHTML = people(el).map((p,i)=>`
    <div>
      ${el.dataset.noname==='1'?'':`<div class="pname">${esc(p.name)||'·'}</div>`}
      <div class="field" style="margin-bottom:0">
        ${el.dataset.label?`<label class="${el.dataset.stem?'stem':''}">${esc(rz(el.dataset.label,i).replace('{שני}', C.p[1-i].name||'·'))}</label>`:''}
        ${el.dataset.hint?`<p class="tiny" style="margin-bottom:.6rem">${esc(rz(el.dataset.hint,i))}</p>`:''}
        <textarea rows="${rows}" data-act="free" data-f="${f}" data-i="${i}"
          placeholder="${esc(rz(el.dataset.ph||'',i))}">${esc(val(f,i))}</textarea>
      </div>
    </div>`).join('');
};

/* שדה טקסט שמגיע עם הצעה לפי תשובה קודמת */
W.suggest = (el) => {
  const f = el.dataset.field, bank = window[el.dataset.bank]||{}, key = el.dataset.key;
  el.innerHTML = people(el).map((p,i)=>{
    const k = val(key,i);
    const touched = (store(f)[f+'_t']||[])[i];
    const v = touched ? val(f,i) : (k ? rz(bank[k], i) : '');
    return `<div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <div class="field" style="margin-bottom:0">
        ${el.dataset.label?`<label>${esc(rz(el.dataset.label,i))}</label>`:''}
        ${k?'':'<p class="tiny">בחרו קודם תשובה בשאלה שלמעלה.</p>'}
        <textarea rows="${el.dataset.rows||'3'}" data-act="suggest" data-f="${f}" data-i="${i}"
          placeholder="${esc(rz(el.dataset.ph||'במילים שלי…',i))}">${esc(v)}</textarea>
      </div>
    </div>`;
  }).join('');
};

/* שדה טקסט אחד, משותף לשניהם */
W.stext = (el) => {
  const f = el.dataset.field;
  el.innerHTML = `<div class="shared" style="margin-inline:auto">
    <input type="text" class="${el.dataset.big==='1'?'big':''}" data-act="shared" data-f="${f}"
      value="${esc(sval(f))}" placeholder="${esc(el.dataset.ph||'')}" autocomplete="off"></div>`;
};

/* בחירה אחת, משותפת לשניהם */
W.schoice = (el) => {
  const f = el.dataset.field, opts = window[el.dataset.options] || [];
  el.className = 'opts durations';
  el.innerHTML = opts.map(o=>`<button type="button" class="opt" data-act="sselect" data-f="${f}" data-v="${esc(o)}"
      aria-pressed="${sval(f)===o}">${esc(o)}</button>`).join('');
};

/* משפט שנבנה מהתשובות, מגדרי לכל אחד */
W.assembled = (el) => {
  const t = window[el.dataset.template] || '';
  el.className = 'assembled';
  el.innerHTML = people(el).map((p,i)=>{
    let line = esc(rz(t,i));
    Object.keys(window.VARS||{}).forEach(k=>{
      const v = sval(VARS[k].field) || VARS[k].fallback; if(!v) return;
      line = line.split(esc(v)).join(`<mark>${esc(v)}</mark>`);
    });
    return `<div class="fl"><span class="who">${esc(p.name)||'·'}</span>״${line}״</div>`;
  }).join('');
};


/* שאלון בחירה כפויה · שאלה אחת על המסך, לא חמש עשרה בטור */
W.quiz = (el) => {
  const f = el.dataset.field, qs = window[el.dataset.options] || [];
  const P = people(el);
  const total = qs.length;
  const answered = i => list(f,i).filter(Boolean).length;
  const doneAll = () => P.every((p,i)=> answered(i) === total);

  /* איפה אנחנו עומדים. נשמר, כדי שאפשר יהיה לעצור ולחזור. */
  let at = +(A[f+'_at'] || 0);
  if(at < 0) at = 0; if(at > total-1) at = total-1;

  const q = qs[at];
  const bothHere = P.every((p,i)=> !!list(f,i)[at]);

  if(doneAll() && el.dataset.collapsed === '1'){
    el.className = 'quizdone';
    el.innerHTML = `<p class="qdmsg">ענית על כל ${total} השאלות.</p>
      <button type="button" class="cbtn" data-act="qreopen" data-f="${f}">לעבור עליהן שוב</button>`;
    return;
  }

  const cols = P.map((p,i)=>{
    const cur = list(f,i)[at] || '';
    return `<div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <div class="two">
        <button type="button" class="opt" data-act="quiz" data-f="${f}" data-i="${i}" data-k="${at}" data-v="${esc(q.a.id)}"
          aria-pressed="${cur===q.a.id}">${esc(rz(q.a.t,i))}</button>
        <button type="button" class="opt" data-act="quiz" data-f="${f}" data-i="${i}" data-k="${at}" data-v="${esc(q.b.id)}"
          aria-pressed="${cur===q.b.id}">${esc(rz(q.b.t,i))}</button>
      </div>
    </div>`;
  }).join('');

  const dots = qs.map((_,k)=>{
    const full = P.every((p,i)=> !!list(f,i)[k]);
    return `<button type="button" class="qdot${k===at?' now':''}${full?' full':''}"
      data-act="qgo" data-f="${f}" data-k="${k}" title="שאלה ${k+1}"><i></i></button>`;
  }).join('');

  el.className = 'quizstep';
  el.innerHTML = `
    <div class="qhead">
      <span class="qn">${String(at+1).padStart(2,'0')} <i>מתוך ${total}</i></span>
      <div class="qdots">${dots}</div>
    </div>
    <div class="pair qcols">${cols}</div>
    <div class="qnav">
      <button type="button" class="cbtn" data-act="qprev" data-f="${f}" ${at===0?'disabled':''}>הקודמת</button>
      <span class="qhint">${bothHere ? '' : (P.length>1 ? 'שניכם בוחרים, ואז ממשיכים' : 'בחרו אחת מהשתיים')}</span>
      <button type="button" class="cbtn solid" data-act="qnext" data-f="${f}" ${at===total-1?'disabled':''}>הבאה</button>
    </div>`;
};

/* כמה חסר לי · דירוג מוחלט לכל חמש השפות, לא בחירה כפויה.
   השאלון אומר מה חשוב יותר ממה. זה אומר כמה חסר בפועל. */
W.matrix = (el) => {
  const f = el.dataset.field, allRows = window[el.dataset.options] || [];
  const opts = window[el.dataset.scale] || [];
  /* data-only="deficit" מצמצם למה שסומן ״חסר מאוד״ קודם — מדידה חוזרת ממוקדת */
  const onlyF = el.dataset.only;
  /* data-top="2" מצמצם לשתי השפות המובילות של כל אחד:
     זו שנבחרה בשאלת ההכרעה, ואחריה החזקה ביותר בשאלון שאינה היא. */
  const topN = +(el.dataset.top || 0);
  const topFor = (i) => {
    const prim = val('primary', i);
    const rank = quizRank('quiz', i).filter(x => x.n > 0);
    const ids = [];
    if(prim) ids.push(prim);
    rank.forEach(x => { if(ids.indexOf(x.id) < 0 && ids.length < topN) ids.push(x.id); });
    return ids.slice(0, topN);
  };
  el.className = 'pair';
  el.innerHTML = people(el).map((p,i)=>{
    const cur = list(f,i);
    const prev = onlyF ? list(onlyF,i) : null;
    let rows = prev ? allRows.filter((r,k)=> prev[k]==='lots') : allRows;
    if(topN){
      const ids = topFor(i);
      /* הסדר הוא סדר הבחירה: השפה העיקרית ראשונה, ואחריה החזקה שאחריה */
      rows = ids.map(id => allRows.find(r => r.id === id)).filter(Boolean);
      if(!rows.length) return `<div><div class="pname">${esc(p.name)||'·'}</div>
        <p class="tiny">צריך קודם לבחור שפה עיקרית בתחנה 01, ואז שתי המובילות שלך יופיעו כאן.</p></div>`;
    }
    if(onlyF && !rows.length) return `<div><div class="pname">${esc(p.name)||'·'}</div>
      <p class="tiny">לא סימנת שום שפה כ״חסרה מאוד״ בתחנה 02, אז אין כאן מה למדוד שוב. זה סימן טוב.</p></div>`;
    const idxOf = r => allRows.indexOf(r);
    return `<div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <table class="mtx"><tbody>
        ${rows.map((r)=>{ const k = idxOf(r); return `<tr>
          <th>${esc(r.label)}</th>
          ${opts.map(o=>`<td><button type="button" data-act="mtx" data-f="${f}" data-i="${i}" data-k="${k}" data-v="${esc(o.id)}"
            aria-pressed="${cur[k]===o.id}" title="${esc(o.label)}"><span>${esc(o.short)}</span></button></td>`).join('')}
        </tr>`; }).join('')}
      </tbody></table>
      <div class="mtxkey">${opts.map(o=>`<span><b>${esc(o.short)}</b> ${esc(o.label)}</span>`).join('')}</div>
    </div>`;
  }).join('');
};

/* סימון ביצוע · מה שהובטח מול מה שקרה */
W.checkoff = (el) => {
  const src = el.dataset.src, f = el.dataset.field;
  el.className = 'pair';
  el.innerHTML = people(el).map((p,i)=>{
    const items = list(src,i).filter(Boolean);
    const done  = list(f,i);
    if(!items.length) return `<div><div class="pname">${esc(p.name)||'·'}</div>
      <p class="tiny">לא נמצאו פעולות מתחנה 05. אפשר לחזור לשם ולמלא אותן.</p></div>`;
    return `<div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <ul class="chk">${items.map((x,k)=>`<li class="${done[k]==='y'?'yes':(done[k]==='n'?'no':'')}">
        <span class="txt">${esc(x)}</span>
        <span class="btns">
          <button type="button" data-act="chk" data-f="${f}" data-i="${i}" data-k="${k}" data-v="y"
            aria-pressed="${done[k]==='y'}">קרה</button>
          <button type="button" data-act="chk" data-f="${f}" data-i="${i}" data-k="${k}" data-v="n"
            aria-pressed="${done[k]==='n'}">לא</button>
        </span></li>`).join('')}</ul>
    </div>`;
  }).join('');
};

/* הדירוג החי שנבנה מהשאלון */
W.rank = (el) => {
  const f = el.dataset.field;
  el.className = 'pair';
  el.innerHTML = people(el).map((p,i)=>{
    const r = quizRank(f,i), done = quizAnswered(f,i);
    if(!done) return `<div><div class="pname">${esc(p.name)||'·'}</div>
      <p class="tiny">הדירוג ייבנה כאן תוך כדי שאת[ה/] [עונה/עונה].</p></div>`.replace(/\[([^\[\]]*?)\/([^\[\]]*?)\]/g,(_,m,ff)=>C.p[i].g==='m'?m:ff);
    const max = r[0].n || 1;
    return `<div>
      <div class="pname">${esc(p.name)||'·'}</div>
      <ul class="bars">${r.map((x,k)=>`<li class="${k===0&&x.n>0?'top':''}">
        <span class="lb">${esc(x.label)}</span>
        <span class="br"><i style="width:${Math.round((x.n/max)*100)}%"></i></span>
        <span class="nn">${x.n}</span></li>`).join('')}</ul>
    </div>`;
  }).join('');
};

/* חוגה 1–10 */
W.dial = (el) => {
  const f = el.dataset.field, ends = (el.dataset.ends||'').split('|');
  el.className = 'pair';
  el.innerHTML = people(el).map((p,i)=>`
    <div>
      ${el.dataset.noname==='1'?'':`<div class="pname">${esc(p.name)||'·'}</div>`}
      <div class="field" style="margin-bottom:0">
        ${el.dataset.label?`<label>${esc(rz(el.dataset.label,i).replace('{שני}', C.p[1-i].name||'·'))}</label>`:''}
        <div class="dial">${[1,2,3,4,5,6,7,8,9,10].map(n=>`
          <button type="button" data-act="dial" data-f="${f}" data-i="${i}" data-v="${n}"
            aria-pressed="${String(val(f,i))===String(n)}">${n}</button>`).join('')}</div>
        ${ends.length===2?`<div class="dends"><span>${esc(ends[0])}</span><span>${esc(ends[1])}</span></div>`:''}
      </div>
    </div>`).join('');
};

/* רשימה ספציפית · שורות שמתמלאות אחת אחת */
W.listbuilder = (el) => {
  const f = el.dataset.field, rows = +(el.dataset.rows||5);
  const stem = el.dataset.stem || '';
  const bank = el.dataset.bank ? (window[el.dataset.bank]||{}) : null;
  const key  = el.dataset.key;
  el.className = 'pair';
  el.innerHTML = people(el).map((p,i)=>{
    const a = list(f,i);
    const k = key ? val(key,i) : '';
    /* data-src="loved" מושך את הדוגמאות מהרשימה שבן או בת הזוג כתב[ה] בעצמם */
    const src = el.dataset.src ? list(el.dataset.src, 1-i).filter(Boolean) : null;
    const pool = src ? src : (bank && bank[k] ? bank[k] : null);
    const ex = pool ? `<div class="chips ex">${pool.map(c=>
      `<button type="button" class="chip" data-act="fill" data-f="${f}" data-i="${i}" data-v="${esc(rz(c,i))}">${esc(rz(c,i))}</button>`
      ).join('')}</div>` : '';
    return `<div>
      <div class="pname">${C.solo && i===1 ? 'ההשערה שלי על '+(esc(p.name)||'·') : (esc(p.name)||'·')}</div>
      ${el.dataset.label?`<label class="lbl">${esc(rz(el.dataset.label,i))}</label>`:''}
      ${ex?`<p class="tiny exl">${esc(el.dataset.exlabel||'לחצו כדי להתחיל מדוגמה, ואז שנו אותה למה שנכון לכם')}</p>${ex}`:''}
      <ol class="lb">${Array.from({length:rows},(_,k2)=>`
        <li>
          <span class="n">${k2+1}</span>
          ${stem?`<span class="stem">${esc(rz(stem,i))}</span>`:''}
          <input type="text" data-act="lb" data-f="${f}" data-i="${i}" data-k="${k2}"
            value="${esc(a[k2]||'')}" placeholder="${esc(rz(el.dataset.ph||'',i))}" autocomplete="off">
        </li>`).join('')}</ol>
    </div>`;
  }).join('');
};

/* הרשימה של בן/בת הזוג · לקריאה בלבד, בתוך הדף */
W.mirror = (el) => {
  const f = el.dataset.field;
  el.className = 'pair';
  el.innerHTML = people(el).map((p,i)=>{
    const you = C.p[1-i], a = list(f,1-i).filter(Boolean);
    return `<div>
      <div class="pname">${esc(rz(el.dataset.label||'מה ש{בן_זוג} כתב[/ה]', i))}</div>
      ${a.length ? `<ul class="mir">${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`
                 : `<p class="tiny">${esc(you.name||'·')} עוד לא מילא[/ה] את הרשימה.</p>`}
    </div>`;
  }).join('');
};

/* ============================================================
   ויזואליזציות · תמונה אחת של הדפוס בסוף כל תחנה
   ============================================================ */
function visHint(v, msg){
  return `<figure class="vis empty">
    <figcaption>${esc(v.title)}</figcaption>
    <p class="hint">${esc(msg)}</p>
    <button type="button" class="cbtn" data-field-go="${esc(v.field)}">לשאלה החסרה ←</button>
  </figure>`;
}

function visMatrix(v){
  const opts = window[v.options] || [];
  if(!(val(v.field,0) && val(v.field,1)))
    return visHint(v, 'מפת הדפוס תיבנה כאן ברגע ששניכם תבחרו את דפוס ההישרדות שלכם.');
  const pins = {};
  C.p.forEach((p,i)=>{ const k = val(v.field,i); if(k){ (pins[k] = pins[k] || []).push(p.name || '·'); } });
  const cell = id => {
    const o = opts.find(o=>o.id===id) || {};
    const mine = (pins[id]||[]).map(n=>`<em>${esc(n)}</em>`).join('');
    return `<div class="qd${mine?' on':''}">
      <span class="en">${esc(o.en||'')}</span><b>${esc(rz(o.label||'',0))}</b>
      <div class="pins">${mine}</div></div>`;
  };
  const a = val(v.field,0), b = val(v.field,1);
  let combo = '';
  if(a && b){
    const key = [a,b].sort().join('|');
    const c = (window[v.combos]||{})[key];
    if(c) combo = `<p class="combo"><b>${esc(c.name)}</b> ${esc(c.line)}</p>`;
  }
  return `<figure class="vis">
    <figcaption>${esc(v.title)}</figcaption>
    <div class="mx">
      <div class="ax t">${esc(v.axes[0])}</div>
      <div class="ax r">${esc(v.axes[2])}</div>
      <div class="grid">${cell(v.cells[0])}${cell(v.cells[1])}${cell(v.cells[3])}${cell(v.cells[2])}</div>
      <div class="ax l">${esc(v.axes[3])}</div>
      <div class="ax b">${esc(v.axes[1])}</div>
    </div>${combo}</figure>`;
}

function visLadder(v){
  const opts = window[v.options] || [];
  if(!(val(v.field,0) && val(v.field,1)))
    return visHint(v, 'מד הריחוק ייבנה כאן ברגע ששניכם תסמנו איפה אתם נתקעים בסולם.');
  const idx = i => opts.findIndex(o => o.id === val(v.field,i));
  const i0 = idx(0), i1 = idx(1);
  const rows = opts.map((o,k)=>{
    const who = C.p.map((p,i)=> (idx(i)===k ? `<em>${esc(p.name||'·')}</em>` : '')).join('');
    return `<li class="${who?'on':''}"><span class="n">${String(k+1).padStart(2,'0')}</span>
      <span class="lbl">${esc(rz(o.label||'',0))}</span><span class="pins">${who}</span></li>`;
  }).join('');
  let combo = '';
  if(i0 > -1 && i1 > -1){
    const gap = Math.abs(i0 - i1);
    combo = gap === 0
      ? '<p class="combo"><b>אתם באותו שלב.</b> זה אומר שאתם נתקעים יחד, ושהצעד הבא הוא משותף.</p>'
      : `<p class="combo"><b>${gap===1?'אתם שלב אחד זה מזה.':'אתם '+gap+' שלבים זה מזה.'}</b> ` +
        'מי שנמצא גבוה יותר צריך לרדת אל השלב של השני, ולא להפך. ההתקרבות תמיד מתחילה מהמקום האיטי יותר.</p>';
  }
  return `<figure class="vis"><figcaption>${esc(v.title)}</figcaption>
    <ol class="ladderv">${rows}</ol>${combo}</figure>`;
}

function visScale(v){
  const opts = window[v.options] || [];
  const cur = A[v.field];
  if(!cur) return visHint(v, 'המד ייבנה כאן ברגע שתסכימו על התשובה יחד.');
  const k = opts.indexOf(cur);
  const steps = opts.map((o,i)=>
    `<div class="st${i===k?' on':''}${(k>-1&&i<k)?' pre':''}"><i></i><span>${esc(o)}</span></div>`).join('');
  const note = (k > -1 && v.notes && v.notes[k]) ? `<p class="combo">${esc(v.notes[k])}</p>` : '';
  return `<figure class="vis"><figcaption>${esc(v.title)}</figcaption>
    <div class="scale">${steps}</div>${note}</figure>`;
}

/* מפת השפות · תחנה 01 */
function visLangs(v){
  if(!(val(v.field,0) && val(v.field,1)))
    return visHint(v, 'מפת השפות תיבנה כאן ברגע ששניכם תבחרו את השפה העיקרית שלכם.');
  const cols = C.p.map((p,i)=>{
    const prim = val(v.field,i);
    const r = quizRank(v.quiz, i), max = r[0] ? (r[0].n||1) : 1;
    const any = quizAnswered(v.quiz,i) > 0;
    const tied = quizTies(v.quiz,i).map(x=>x.id);
    const bars = any ? `<ul class="bars">${r.map(x=>`<li class="${x.id===prim?'top':''}${tied.indexOf(x.id)>-1?' tied':''}">
        <span class="lb">${esc(x.label)}</span>
        <span class="br"><i style="width:${Math.round((x.n/max)*100)}%"></i></span></li>`).join('')}</ul>` : '';
    const inten = val(v.intensity,i), tnk = val(v.tank,i);
    return `<div class="lp">
      <div class="hd"><b>${esc(p.name)||'·'}</b><span>${esc(langName(prim))}</span></div>
      ${bars}
      ${inten?`<p class="tk">עוצמת הצורך · <b>${esc(inten)}</b> מתוך 10</p>`:''}
      ${tnk?`<p class="tk">${esc(rz('והדלי [שלו/שלה] כרגע',i))} · <b>${esc(tnk)}</b> מתוך 10</p>`:''}
    </div>`;
  }).join('');

  const notes = [];
  const p0 = val(v.field,0), p1 = val(v.field,1);
  notes.push(p0 === p1
    ? `<p class="combo"><b>שניכם צריכים את אותה שפה.</b> זה נשמע כמו מזל, ולרוב זה דווקא מקום שבו שניכם מחכים לאותו דבר, ואף אחד לא נותן אותו.</p>`
    : `<p class="combo"><b>אתם צריכים שתי שפות שונות.</b> ${esc(C.p[0].name||'·')} צריכה ${esc(langName(p0))}, ו${esc(C.p[1].name||'·')} צריך ${esc(langName(p1))}. זה לא פער באהבה. זה פער בצינור.</p>`);

  /* תיקו · והאם ההכרעה פתרה אותו */
  C.p.forEach((p,i)=>{
    const tied = quizTies(v.quiz,i); if(!tied.length) return;
    const prim = val(v.field,i);
    const names = tied.map(x=>x.label).join(' ו');
    notes.push(tied.some(x=>x.id===prim)
      ? `<p class="combo"><b>אצל ${esc(p.name||'·')} יצא תיקו בין ${esc(names)}.</b> השאלון לא הכריע, ולכן מה ${esc(rz('[שבחרת/שבחרת]',i))} בשאלת ההכרעה הוא מה שקובע כאן. שתיהן חשובות לך. אחת מהן היא תנאי.</p>`
      : `<p class="combo miss"><b>אצל ${esc(p.name||'·')} יצא תיקו בין ${esc(names)}, ובשאלת ההכרעה ${esc(rz('[בחרת/בחרת]',i))} ${esc(langName(prim))}.</b> שלוש שפות גבוהות זה לא בלבול. זה אומר שהדלי מתמלא מכמה כיוונים, וששווה לשאול מה מהן הכי חסר עכשיו.</p>`);
  });

  /* פער בין השאלון להכרעה, כשלא היה תיקו */
  C.p.forEach((p,i)=>{
    const prim = val(v.field,i), r = quizRank(v.quiz,i);
    if(!quizAnswered(v.quiz,i) || !r[0] || !r[0].n) return;
    if(quizTies(v.quiz,i).length) return;
    if(r[0].id === prim) return;
    notes.push(`<p class="combo miss"><b>אצל ${esc(p.name||'·')} יש פער.</b> בשאלון ${rz('[יצא/יצאה]',i)} ${esc(r[0].label)}, אבל כששאלנו בלי מה הכי קשה לחיות, ${rz('[בחרת/בחרת]',i)} ${esc(langName(prim))}. שתי התשובות נכונות. השנייה היא זו שכואבת כשהיא חסרה.</p>`);
  });

  C.p.forEach((p,i)=>{
    const n = +val(v.intensity,i); if(!n) return;
    if(n >= 8) notes.push(`<p class="combo miss"><b>אצל ${esc(p.name||'·')} הצורך הזה חזק מאוד — ${n} מתוך 10.</b> ` +
      `זה אומר שכאן לא מדובר בהעדפה. כשזה חסר, זה לא מרגיש כמו פחות נעים. זה מרגיש כמו לא אהוב.</p>`);
    else if(n <= 4) notes.push(`<p class="combo"><b>אצל ${esc(p.name||'·')} הצורך הזה מתון — ${n} מתוך 10.</b> ` +
      `שווה לבדוק אם באמת כך, או שזו הרגלה. לפעמים מי שלא קיבל מספיק זמן רב מפסיק לדעת כמה הוא צריך.</p>`);
  });

  /* פער בין הדליים · עבר לכאן כשמד הדלי עבר לתחנה 01 */
  const tanks = C.p.map((p,i)=>+val(v.tank,i)).filter(Boolean);
  if(tanks.length === 2 && Math.abs(tanks[0]-tanks[1]) >= 3){
    const low = tanks[0] < tanks[1] ? 0 : 1;
    notes.push(`<p class="combo miss"><b>הדליים שלכם רחוקים.</b> ${esc(C.p[low].name||'·')} על ${tanks[low]} ` +
      `ו${esc(C.p[1-low].name||'·')} על ${tanks[1-low]}. זה אומר ששניכם חיים באותו בית ולא באותה זוגיות, ` +
      `ושמי שמלא יותר כנראה לא יודע את זה.</p>`);
  }

  return `<figure class="vis"><figcaption>${esc(v.title)}</figcaption>
    <div class="lgrid">${cols}</div>${notes.join('')}</figure>`;
}

/* מה הנחנו אחד על השנייה · לא בשימוש מאז שהניחוש הוסר. נשמר למקרה שיחזור. */
function visMirror(v){
  if(!(val(v.guess,0) && val(v.guess,1)))
    return visHint(v, 'התמונה תיבנה כאן ברגע ששניכם תנחשו את השפה של מי שמולכם.');
  const cols = C.p.map((p,i)=>{
    const t = val(v.tank,i);
    const g = val(v.guess,i), real = val(v.field,1-i);
    const hit = g === real;
    return `<div class="lp">
      <div class="hd"><b>${esc(p.name)||'·'}</b>${t?`<span>הדלי · ${esc(t)}/10</span>`:''}</div>
      <div class="gr"><span class="lb">${esc(rz('מה [שניחשתי/שניחשתי]',i))}</span>
        <p class="mv ${hit?'ok':'miss'}">${esc(langName(g))}</p></div>
      <div class="gr"><span class="lb">ומה ${esc(C.p[1-i].name||'·')} ${esc(rz('<אמר/אמרה>',i))}</span>
        <p class="mv">${esc(langName(real))}</p></div>
    </div>`;
  }).join('');
  const hits = C.p.filter((p,i)=> val(v.guess,i) === val(v.field,1-i)).length;
  const note = hits === 2
    ? '<p class="combo ok"><b>שניכם ידעתם.</b> אז הפער אצלכם הוא לא בידיעה. הוא בפער שבין לדעת לבין לעשות, וזה מה שנתרגל הלאה.</p>'
    : hits === 1
    ? '<p class="combo"><b>אחד מכם ידע, והשני הניח.</b> וזה לא מדד לאכפתיות. זה מדד לכמה פעמים נשאלה השאלה הזאת בקול.</p>'
    : '<p class="combo miss"><b>שניכם פספסתם.</b> וזה הממצא הכי שימושי כאן. כל אחד מכם השקיע בכיוון שהוא שיער, ואף אחד לא בדק. מכאן אפשר להפסיק לנחש.</p>';

  const tanks = C.p.map((p,i)=>+val(v.tank,i)).filter(Boolean);
  let gap = '';
  if(tanks.length === 2 && Math.abs(tanks[0]-tanks[1]) >= 3){
    const low = tanks[0] < tanks[1] ? 0 : 1;
    gap = `<p class="combo miss"><b>הדליים שלכם רחוקים.</b> ${esc(C.p[low].name||'·')} על ${tanks[low]} ו${esc(C.p[1-low].name||'·')} על ${tanks[1-low]}. ` +
      `זה אומר ששניכם חיים באותו בית ולא באותה זוגיות, ושמי שמלא יותר כנראה לא יודע את זה.</p>`;
  }
  return `<figure class="vis"><figcaption>${esc(v.title)}</figcaption>
    <div class="lgrid">${cols}</div>${note}${gap}</figure>`;
}

/* הצינורות המוצלבים · תחנה 02 */
function visCross(v){
  if(!(val(v.give,0) && val(v.give,1) && val(v.need,0) && val(v.need,1)))
    return visHint(v, 'התמונה תיבנה כאן ברגע ששניכם תסמנו באיזו שפה אתם נותנים.');
  const rows = C.p.map((p,i)=>{
    const give = val(v.give,i), need = val(v.need,1-i), you = C.p[1-i];
    const hit = give === need;
    return `<div class="cr${hit?' hit':''}">
      <span class="from"><b>${esc(p.name)||'·'}</b><i>${esc(rz('[נותן/נותנת]',i))} ${esc(langName(give))}</i></span>
      <span class="arw">←</span>
      <span class="to"><b>${esc(you.name)||'·'}</b><i>${esc(rz('<צריך/צריכה>',i))} ${esc(langName(need))}</i></span>
    </div>`;
  }).join('');
  const hits = C.p.filter((p,i)=> val(v.give,i) === val(v.need,1-i)).length;
  const note = hits === 2
    ? '<p class="combo ok"><b>שניכם נותנים בשפה הנכונה.</b> אז מכאן זה כבר לא שאלה של שפה אלא של כמות, של עקביות, ושל כמה זה קורה גם כשעייפים.</p>'
    : hits === 1
    ? '<p class="combo"><b>אחד מכם קולע והשני לא.</b> וזה המקום שבו נולד המשפט ״אני נותן ונותן ושום דבר לא מספיק״. זה כן מספיק. זה פשוט לא בשפה הנכונה.</p>'
    : '<p class="combo miss"><b>שניכם נותנים, ושניכם לא מקבלים.</b> שניכם נדיבים. אתם פשוט לא מתואמים בצינורות. וזה משאיר את שניכם עם דלי ריק.</p>';
  return `<figure class="vis"><figcaption>${esc(v.title)}</figcaption>
    <div class="cross">${rows}</div>${note}</figure>`;
}

/* מד המאמץ מול מד האהוב · תחנה 04 */
function visGap(v){
  if(!(val(v.effort,0) && val(v.effort,1) && val(v.felt,0) && val(v.felt,1)))
    return visHint(v, 'המדים ייבנו כאן ברגע ששניכם תסמנו את שתי החוגות.');
  const bar = (n, cls) => `<span class="gb ${cls}"><i style="width:${(+n)*10}%"></i><em>${esc(n)}</em></span>`;
  const rows = C.p.map((p,i)=>{
    const you = C.p[1-i];
    const eff = val(v.effort,i);           // כמה אני מתאמץ
    const felt = val(v.felt,1-i);          // כמה השני מרגיש אהוב
    const gue = val(v.guess,i);            // כמה לדעתי השני מרגיש אהוב
    return `<div class="gp">
      <div class="hd"><b>${esc(p.name)||'·'}</b></div>
      <div class="gr"><span class="lb">${esc(rz('כמה אני [מתאמץ/מתאמצת]',i))}</span>${bar(eff,'e')}</div>
      <div class="gr"><span class="lb">כמה ${esc(you.name)||'·'} באמת ${esc(rz('<מרגיש/מרגישה>',i))} ${esc(rz('<אהוב/אהובה>',i))}</span>${bar(felt,'f')}</div>
      ${gue?`<div class="gr sm"><span class="lb">וכמה ${esc(rz('[הערכתי/הערכתי]',i))} ש${esc(you.name)||'·'} ${esc(rz('<מרגיש/מרגישה>',i))}</span>${bar(gue,'g')}</div>`:''}
    </div>`;
  }).join('');

  const notes = C.p.map((p,i)=>{
    const eff = +val(v.effort,i), felt = +val(v.felt,1-i);
    if(!eff || !felt) return '';
    const d = eff - felt, you = C.p[1-i].name||'·';
    if(d >= 3) return `<p class="combo miss"><b>${esc(p.name||'·')} ${rz('[מתאמץ/מתאמצת]',i)} ${eff}, ו${esc(you)} ${rz('<מרגיש/מרגישה>',i)} ${felt}.</b> הפער הזה הוא לא ראיה לכך ${rz('[שאתה לא אוהב/שאת לא אוהבת]',i)} מספיק. הוא ראיה לכך שהמאמץ הולך לשפה אחרת.</p>`;
    if(d <= -3) return `<p class="combo ok"><b>${esc(you)} ${rz('<מרגיש/מרגישה>',i)} ${felt}, ו${esc(p.name||'·')} ${rz('[מתאמץ/מתאמצת]',i)} רק ${eff}.</b> זה אומר שמה ${rz('[שאתה עושה/שאת עושה]',i)} מדויק. זה נכנס ישר לדלי, בלי מאמץ מיוחד.</p>`;
    return `<p class="combo ok"><b>אצל ${esc(p.name||'·')} המאמץ והתחושה קרובים.</b> מה ${rz('[שאתה נותן/שאת נותנת]',i)} מגיע ליעד.</p>`;
  }).join('');

  const guessNotes = C.p.map((p,i)=>{
    const gue = +val(v.guess,i), felt = +val(v.felt,1-i);
    if(!gue || !felt) return '';
    const d = Math.abs(gue - felt); if(d < 3) return '';
    const you = C.p[1-i].name||'·';
    return `<p class="combo miss"><b>${esc(p.name||'·')} ${rz('[העריך/העריכה]',i)} ${gue}, והתשובה של ${esc(you)} היא ${felt}.</b> זה לא כישלון. זו בדיוק הסיבה שממשיכים לשאול במקום להניח.</p>`;
  }).join('');

  return `<figure class="vis"><figcaption>${esc(v.title)}</figcaption>
    <div class="gaps">${rows}</div>${notes}${guessNotes}</figure>`;
}

function soloVis(v){
  return `<figure class="vis empty"><figcaption>${esc(v.title)}</figcaption>
    <p class="hint">התמונה הזאת נבנית משתי התשובות, ולכן היא לא נבנית עכשיו.
    היא תחכה כאן. ברגע ש${esc(C.p[1].name||'בן או בת הזוג')} ${esc(rz('<יענה/תענה>',0))} גם, היא תיפתח מעצמה.</p></figure>`;
}
function buildVisual(){
  const v = (window.CARD||{}).visual; if(!v) return '';
  if(C.solo) return soloVis(v);
  if(v.kind === 'matrix') return visMatrix(v);
  if(v.kind === 'ladder') return visLadder(v);
  if(v.kind === 'scale')  return visScale(v);
  if(v.kind === 'langs')  return visLangs(v);
  if(v.kind === 'mirror') return visMirror(v);
  if(v.kind === 'cross')  return visCross(v);
  if(v.kind === 'gap')    return visGap(v);
  return '';
}

/* ============================================================
   הכרטיס
   ============================================================ */
function buildCard(){
  const el = document.getElementById('card'); if(!el) return;
  const badgeOpts = CARD.badge ? (window[CARD.badge.options]||[]) : [];

  /* בסולו הכרטיס נבנה על מי שמילא בלבד. אין אדם שני שיש עליו מה לכתוב. */
  const people = (C.solo ? [C.p[0]] : C.p).map((p,i)=>{
    const you = C.p[1-i];
    let badge = '';
    if(CARD.badge){
      const o = badgeOpts.find(o=>o.id===val(CARD.badge.field,i));
      if(o) badge = (o.en?o.en+' · ':'') + rz(o.label||'', i);
    }
    const blocks = (CARD.blocks||[]).map(b=>{
      if(b.type==='bank'){
        const k = val(b.key,i); return k ? `<p>${esc(rz(window[b.bank][k], i))}</p>` : '';
      }
      if(b.type==='bankPartner'){
        const k = val(b.key,1-i); return k ? `<p>${esc(rz(window[b.bank][k], i))}</p>` : '';
      }
      if(b.type==='do'){
        const k = val(b.key,i); if(!k) return '';
        return `<div class="do"><strong>${esc(rz(b.label,i))}</strong>${esc(rz(window[b.bank][k], i))}</div>`;
      }
      /* הפעולה שלי נגזרת מהשפה של בן/בת הזוג, לא משלי */
      if(b.type==='doPartner'){
        const k = partnerLang(i); if(!k) return '';
        const lab = rz(b.label,i).replace('{שני}', you.name||'·');
        return `<div class="do"><strong>${esc(lab)}</strong>${esc(rz(window[b.bank][k], i))}</div>`;
      }
      if(b.type==='note'){
        const v = val(b.field,i); if(!v) return '';
        return `<p class="early-p"><strong>${esc(rz(b.label,i))}</strong>${esc(v)}</p>`;
      }
      if(b.type==='notePartner'){
        const v = val(b.field,i); if(!v) return '';
        return `<p class="early-p"><strong>${esc(rz(b.label,i))} ${esc(you.name||'·')}</strong>${esc(v)}</p>`;
      }
      if(b.type==='chips'){
        const sel = list(b.field,i).map(c=>rz(c,i));
        const free = val(b.field+'_free',i); if(free) sel.push(free);
        if(!sel.length) return '';
        return `<p class="early-p"><strong>${esc(rz(b.label,i))}</strong>${esc(sel.join(' · '))}</p>`;
      }
      if(b.type==='quote'){
        const touched = (store(b.field)[b.field+'_t']||[])[i];
        const k = b.key ? val(b.key,i) : null;
        const v = touched ? val(b.field,i) : (k && window[b.bank] ? rz(window[b.bank][k],i) : val(b.field,i));
        return v ? `<p class="says">״${esc(v)}״</p>` : '';
      }
      if(b.type==='plain'){
        const t = window[b.template]; if(!t) return '';
        return `<p class="fullline-p">${b.quote?'״':''}${esc(rz(t,i))}${b.quote?'״':''}</p>`;
      }
      /* הרשימה שלי */
      if(b.type==='list'){
        const a = list(b.field,i).filter(Boolean); if(!a.length) return '';
        return `<div class="lst"><strong>${esc(rz(b.label,i))}</strong>
          <ol>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`;
      }
      /* הרשימה של בן/בת הזוג · זה מה שמופיע ככרטיס הפעולה שלי */
      if(b.type==='listPartner'){
        const a = list(b.field,1-i).filter(Boolean);
        if(!a.length && C.solo){
          const l = langBy(partnerLang(i));
          return l ? `<div class="lst do"><strong>${esc(rz(b.label,i).replace('{שני}', you.name||'·'))}</strong>`+
            `<p class="soloq">${esc(you.name||'·')} עוד לא ${esc(rz('<מילא/מילאה>',i))} רשימה משלו. ` +
            `מה שיש לך הוא השערה, והיא נקודת פתיחה טובה — עד שתשאל[/י].</p></div>` : '';
        }
        if(!a.length) return '';
        const lab = C.solo
          ? rz('מה שאני [משער/משערת] שממלא את {שני}',i).replace('{שני}', you.name||'·')
          : rz(b.label,i).replace('{שני}', you.name||'·');
        return `<div class="lst do${C.solo?' guess':''}"><strong>${esc(lab)}${C.solo?' <em class="tag">השערה</em>':''}</strong>
          <ol>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`;
      }
      /* השפה של בן/בת הזוג, והצורך שמתחתיה */
      if(b.type==='langPartner'){
        const l = langBy(partnerLang(i)); if(!l) return '';
        const lab = C.solo
          ? rz('מה שאני [משער/משערת] ש{שני} <צריך/צריכה>',i).replace('{שני}', you.name||'·')
          : rz(b.label,i).replace('{שני}', you.name||'·');
        return `<div class="do${C.solo?' guess':''}"><strong>${esc(lab)}</strong>`+
          `${esc(l.label)} · ${esc(l.need)}${C.solo?' <em class="tag">השערה</em>':''}</div>`;
      }
      /* השפה שלי */
      if(b.type==='langMine'){
        const l = langBy(val(b.field,i)); if(!l) return '';
        return `<p class="early-p"><strong>${esc(rz(b.label,i))}</strong>${esc(l.label)} · ${esc(l.need)}</p>`;
      }
      /* מה שהכי חסר · ולא בהכרח השפה העיקרית */
      if(b.type==='deficit'){
        const a = list(b.field,i), langs = window.LANGS||[];
        const worst = [];
        a.forEach((v,k)=>{ if(v==='lots' && langs[k]) worst.push(langs[k]); });
        if(!worst.length) return '';
        const prim = val(b.primary,i);
        const names = worst.map(l=>l.label).join(' · ');
        const off = worst.every(l=>l.id !== prim) && prim;
        return `<div class="do${off?' guess':''}"><strong>${esc(rz(b.label,i))}</strong>${esc(names)}` +
          (off ? `<p class="soloq">${esc(rz('[שים/שימי] לב: זו לא השפה העיקרית שלך. לפעמים העיקרית דווקא מקבלת מענה, ומה שמרעיב זה משהו אחר.',i))}</p>` : '') +
          `</div>`;
      }
      /* כמה מהפעולות באמת קרו */
      if(b.type==='checkoff'){
        const items = list(b.src,i).filter(Boolean), done = list(b.field,i);
        if(!items.length) return '';
        const yes = items.filter((x,k)=> done[k]==='y').length;
        const answered = items.filter((x,k)=> done[k]).length;
        if(!answered) return '';
        const line = items.map((x,k)=> (done[k]==='y'?'✓ ':(done[k]==='n'?'· ':'')) + x).join('<br>');
        const cls = yes === items.length ? 'ok' : (yes === 0 ? 'miss' : '');
        return `<div class="lst chk ${cls}"><strong>${esc(rz(b.label,i))} · ${yes} מתוך ${items.length}</strong>
          <p class="chkl">${line}</p></div>`;
      }
      /* מדידה חוזרת · אותו מדד, שתי נקודות בזמן */
      if(b.type==='delta'){
        const then = val(b.from,i), now = val(b.to,i);
        if(!then || !now) return '';
        const d2 = +now - +then;
        const word = d2 > 0 ? 'עלה' : (d2 < 0 ? 'ירד' : 'לא זז');
        const cls  = d2 > 0 ? 'ok' : (d2 < 0 ? 'miss' : '');
        return `<p class="early-p delta ${cls}"><strong>${esc(rz(b.label,i))}</strong>` +
          `${esc(then)} ← ${esc(now)} · ${esc(word)}${d2?' ב-'+Math.abs(d2):''}</p>`;
      }
      /* האם התלונה מצביעה על אותה שפה שנבחרה */
      if(b.type==='complaintFit'){
        const sel = list(b.field,i).filter(Boolean);
        if(!sel.length) return '';
        const map = window[b.map] || {};
        const prim = val(b.primary,i);
        const ids = [...new Set(sel.map(x => map[x]).filter(Boolean))];
        if(!ids.length || !prim) return '';
        const hit = ids.indexOf(prim) > -1;
        const names = ids.map(id => langName(id)).filter(Boolean).join(' ו');
        return hit
          ? `<div class="do fit ok"><strong>${esc(rz('התלונה שלי והשפה שלי מדברות אותו דבר',i))}</strong>` +
            `${esc(rz('מה שחוזר אצלך בתלונה מצביע בדיוק על ',i))}${esc(langName(prim))}. ` +
            `${esc(rz('זה אומר שאת[ה/] כבר [אומר/אומרת] את זה בקול, רק בצורה שקשה לשמוע. אותה בקשה, בלי ההאשמה, תגיע הרבה יותר רחוק.',i))}</div>`
          : `<div class="do fit miss"><strong>${esc(rz('התלונה שלי מצביעה למקום אחר',i))}</strong>` +
            `${esc(rz('בחרת ',i))}${esc(langName(prim))}${esc(rz(', אבל התלונה החוזרת שלך מדברת על ',i))}${esc(names)}. ` +
            `${esc(rz('שווה לעצור על זה. או שיש כאן שפה שנייה שחסרה לך יותר משחשבת, או שהתלונה כבר מזמן לא על מה שהיא באמת.',i))}</div>`;
      }
      /* חוגה */
      if(b.type==='dial'){
        const n = val(b.field, b.partner ? 1-i : i); if(!n) return '';
        const lab = rz(b.label,i).replace('{שני}', you.name||'·');
        return `<p class="early-p"><strong>${esc(lab)}</strong>${esc(n)} מתוך 10</p>`;
      }
      return '';
    }).join('');

    return `<div class="person">
      <div class="hd"><b>${esc(p.name)||'·'}</b>${badge?`<span>${esc(badge)}</span>`:''}</div>
      ${blocks}
    </div>`;
  }).join('');

  let agr = '';
  if(CARD.agreement){
    const rows = (CARD.agreement.rows||[]).map(r=>
      `<div class="row"><span>${esc(r.label)}</span><b>${esc(sval(r.field)||'·')}</b></div>`).join('');
    agr = `<div class="agreement"><h4>${esc(CARD.agreement.title)}</h4>${rows}
      ${CARD.agreement.note?`<p class="full">${CARD.agreement.note}</p>`:''}</div>`;
  }

  el.innerHTML = `<div class="cardhead"><b>${esc(CARD.title)}</b>
      <span>${esc(C.p[0].name||'')}${C.p[1].name?' & '+esc(C.p[1].name):''}</span></div>
    ${buildVisual()}${people}${agr}`;
  markProgress();
}


/* ============================================================
   פרקים · גלילה רציפה, עם מד התקדמות שמראה איפה אתם
   ============================================================ */
let CHAPTERS = [], chapIdx = -1;

function chapTitle(sec){
  if(sec.id === 'cardsec') return 'הכרטיס שלכם';
  const eb = sec.querySelector('.eyebrow');
  let t = eb ? eb.textContent.trim().replace(/^\d+\s*·\s*/, '') : '';
  if(!t || /^שאלה|^הסכמה/.test(t)){
    const hd = sec.querySelector('h2, h3');
    if(hd) t = hd.textContent.trim().replace(/\s+/g,' ');
  }
  return t || 'פרק';
}

function setActiveChapter(k){
  if(k === chapIdx) return;
  chapIdx = k;
  const bar = document.getElementById('chapbar'); if(!bar) return;
  bar.querySelector('.t').textContent = CHAPTERS[k].dataset.title;
  bar.querySelector('.c').textContent = `פרק ${k+1} מתוך ${CHAPTERS.length}`;
  bar.querySelectorAll('.seg').forEach((sg,i)=>{
    sg.classList.toggle('done', i < k);
    sg.classList.toggle('now', i === k);
  });
}

function goChapter(k){
  if(!CHAPTERS.length) return;
  k = Math.max(0, Math.min(CHAPTERS.length-1, k));
  const bar = document.getElementById('chapbar');
  const bh = bar ? bar.offsetHeight : 0;
  const y = CHAPTERS[k].getBoundingClientRect().top + scrollY - bh - 10;
  setActiveChapter(k);
  scrollTo({top: Math.max(0, y), behavior: 'smooth'});
}

function chapterize(){
  const gate = document.getElementById('gate'); if(!gate) return false;
  const secs = [...gate.children].filter(el => el.tagName === 'SECTION');
  if(secs.length < 4) return false;

  const isQ = el => !!el.querySelector('.q');
  const groups = []; let cur = [];
  secs.forEach((el, i) => {
    if(el.id === 'cardsec'){ if(cur.length) groups.push(cur); groups.push([el]); cur = []; return; }
    cur.push(el);
    const nxt = secs[i+1];
    if(isQ(el) && (!nxt || !isQ(nxt) || nxt.id === 'cardsec')){ groups.push(cur); cur = []; }
  });
  if(cur.length) groups.push(cur);
  if(groups.length < 3) return false;

  const bar = document.createElement('div');
  bar.id = 'chapbar';
  bar.innerHTML = `<div class="segs"></div>
    <div class="meta"><b class="t"></b><span class="c"></span></div>`;
  const rail = document.getElementById('rail');
  document.body.insertBefore(bar, rail ? rail.nextSibling : document.body.firstChild);

  groups.forEach(g => {
    const wrap = document.createElement('div');
    wrap.className = 'chapter';
    wrap.dataset.title = chapTitle(g[0]);
    g.forEach(sec => wrap.appendChild(sec));
    gate.appendChild(wrap);
  });

  CHAPTERS = [...gate.querySelectorAll('.chapter')];
  bar.querySelector('.segs').innerHTML = CHAPTERS.map((c,k)=>
    `<button type="button" class="seg" data-go="${k}" title="${esc(c.dataset.title)}"><i></i></button>`).join('');

  const sync = () => {
    const bh = bar.offsetHeight;
    let k = 0;
    CHAPTERS.forEach((c,i)=>{ if(c.getBoundingClientRect().top - bh - 40 <= 0) k = i; });
    setActiveChapter(k);
  };
  addEventListener('scroll', sync, {passive:true});
  addEventListener('resize', sync, {passive:true});
  setActiveChapter(0);
  setTimeout(sync, 60);
  return true;
}

/* ============================================================
   שמות
   ============================================================ */
function renderNames(){
  const el = document.getElementById('names'); if(!el) return;
  const solo = !!C.solo;
  const modes = `<div class="modepick">
    <button type="button" data-act="mode" data-v="pair" aria-pressed="${!solo}">אנחנו ממלאים יחד</button>
    <button type="button" data-act="mode" data-v="solo" aria-pressed="${solo}">אני ${C.p[0].g==='m'?'ממלא':'ממלאת'} לבד</button>
  </div>`;

  const gender = solo ? `<div class="field"><label>אני</label>
    <div class="gender">
      <button type="button" data-act="mygender" data-v="f" aria-pressed="${C.p[0].g==='f'}">אישה</button>
      <button type="button" data-act="mygender" data-v="m" aria-pressed="${C.p[0].g==='m'}">גבר</button>
    </div></div>` : '';

  const fields = solo
    ? `<div>
        ${gender}
        <div class="field" style="margin-bottom:0">
          <label>השם שלי</label>
          <input type="text" data-act="name" data-i="0" value="${esc(C.p[0].name)}"
            placeholder="השם שלי" autocomplete="off">
        </div>
      </div>
      <div>
        <div class="field" style="margin-bottom:0">
          <label>השם של ${C.p[0].g==='m'?'בת':'בן'} הזוג</label>
          <input type="text" data-act="name" data-i="1" value="${esc(C.p[1].name)}"
            placeholder="${C.p[0].g==='m'?'השם שלה':'השם שלו'}" autocomplete="off">
          <p class="tiny" style="margin-top:.5rem;margin-bottom:0">
            ${esc(C.p[1].name)||'הוא או היא'} לא ${C.p[0].g==='m'?'תמלא':'ימלא'} כלום. השם נדרש רק כדי שהטקסטים ידברו אליך נכון.</p>
        </div>
      </div>`
    : C.p.map((p,i)=>`
      <div>
        <div class="field" style="margin-bottom:0">
          <label>${i===0?'היא':'הוא'}</label>
          <input type="text" data-act="name" data-i="${i}" value="${esc(p.name)}"
            placeholder="השם שלך" autocomplete="off">
        </div>
      </div>`).join('');

  el.innerHTML = modes + fields;
  el.classList.toggle('pair', true);

  const note = document.getElementById('solonote');
  if(note) note.innerHTML = solo
    ? 'במצב הזה תראו טור אחד. במקומות שבהם השאלה היא מה את[ה/] ' +
      '[משער/משערת] על <בן/בת> הזוג, יופיע גם טור שני — והוא יסומן כהשערה. ' +
      'הכרטיס ייבנה עליך בלבד, והתמונות המשותפות יחכו.'
    : '';
}
/* ============================================================
   רינדור כללי
   ============================================================ */
function renderAssembled(){
  document.querySelectorAll('[data-widget="assembled"]').forEach(el=>W.assembled(el));
}
function renderWidgets(){
  document.querySelectorAll('[data-widget]').forEach(el=>{
    const fn = W[el.dataset.widget]; if(fn) fn(el);
  });
}
function updateGate(){
  const g = document.getElementById('gate'); if(!g) return;
  const a = C.p[0].name.trim(), b = C.p[1].name.trim();
  const open = !!(a && b);
  g.classList.toggle('locked', !open);

  /* נעילה בלי הסבר נראית כמו תקלה. אומרים מה חסר ולמה. */
  const host = document.getElementById('names');
  if(!host) return;
  let note = document.getElementById('gatehint');
  if(open){ if(note) note.remove(); return; }
  if(!note){
    note = document.createElement('p');
    note.id = 'gatehint';
    host.insertAdjacentElement('afterend', note);
  }
  const missing = !a && !b ? 'שני השמות' : (!a ? 'השם הראשון' : 'השם השני');
  note.innerHTML = C.solo
    ? 'שאר התחנה תיפתח אחרי ש' + esc(missing) + ' ' + (missing==='שני השמות'?'יתמלאו':'יתמלא') + '. ' +
      'גם במילוי לבד צריך את שני השמות, כי הטקסטים לאורך כל הדרך פונים אליכם בשם ובלשון הנכונה.'
    : 'שאר התחנה תיפתח אחרי ש' + esc(missing) + ' ' + (missing==='שני השמות'?'יתמלאו':'יתמלא') + '. ' +
      'זה מה שמאפשר לכל שאלה לפנות לכל אחד מכם בלשון שלו.';
}
function renderAll(){ renderWidgets(); buildCard(); updateGate(); }

/* ============================================================
   אירועים
   ============================================================ */
document.addEventListener('input', e=>{
  const d = e.target.dataset, v = e.target.value;
  if(d.act==='name'){ C.p[+d.i].name = v; saveCouple();
    document.querySelectorAll('.pname').forEach((el,k)=>{ el.textContent = C.p[k%2].name || '·'; });
    buildCard(); updateGate(); return; }
  if(d.act==='free'){ setPair(d.f, +d.i, v); buildCard(); return; }
  if(d.act==='lb'){ arr(d.f, +d.i)[+d.k] = v; save(d.f); buildCard(); return; }
  if(d.act==='suggest'){ setPair(d.f, +d.i, v);
    const S = store(d.f);
    if(!Array.isArray(S[d.f+'_t'])) S[d.f+'_t']=[false,false];
    S[d.f+'_t'][+d.i]=true; save(d.f); buildCard(); return; }
  if(d.act==='shared'){ sset(d.f, v); renderAssembled(); buildCard(); return; }
});

document.addEventListener('change', e=>{
  if(e.target.dataset.act==='name'){ renderWidgets(); buildCard(); }
});

document.addEventListener('click', e=>{
  const b = e.target.closest('button'); if(!b) return;
  const d = b.dataset;
  if(d.act==='mode'){
    /* יציאה מסולו · בטור השני יושבות השערות, לא תשובות. אסור שהן יתחזו. */
    if(C.solo && d.v === 'pair'){
      const guessed = ['loved','primary','tank','intensity','deficit','mygive','hurts','quiz']
        .filter(f => filled((store(f)[f]||[])[1]));
      if(guessed.length && !confirm(
          'בטור השני יושבות ההשערות שלך, לא התשובות של מי שמולך.\n\n' +
          'לנקות אותן כדי שימלא מאפס?\n\n' +
          'אישור מנקה. ביטול משאיר אותן, והן ייראו כאילו הן שלו.')){
        /* נשאר, אבל לפחות לא בשקט */
      } else if(guessed.length){
        guessed.forEach(f => { const S = store(f); if(Array.isArray(S[f])) S[f][1] = Array.isArray(S[f][1]) ? [] : ''; save(f); });
      }
    }
    C.solo = (d.v === 'solo');
    if(!C.solo){ C.p[0].g='f'; C.p[1].g='m'; }
    else { C.p[1].g = C.p[0].g === 'm' ? 'f' : 'm'; }
    saveCouple(); renderNames(); renderAll(); return; }
  if(d.act==='mygender'){
    C.p[0].g = d.v; C.p[1].g = (d.v === 'm' ? 'f' : 'm');
    saveCouple(); renderNames(); renderAll(); return; }
  if(d.act==='select'){
    setPair(d.f, +d.i, val(d.f,+d.i)===d.v ? '' : d.v);
    renderWidgets(); buildCard(); return; }
  if(d.act==='chip'){
    const a = arr(d.f, +d.i), k = a.indexOf(d.v);
    k>-1 ? a.splice(k,1) : a.push(d.v);
    save(d.f); b.setAttribute('aria-pressed', k===-1); buildCard(); return; }
  if(d.act==='quiz'){
    const a = arr(d.f, +d.i), k = +d.k;
    a[k] = (a[k] === d.v ? '' : d.v);
    save(d.f);
    const host = b.closest('[data-widget="quiz"]');
    /* ברגע שכולם ענו על השאלה הזאת, עוברים הלאה מעצמנו */
    if(host && a[k]){
      const P = people(host), qs = window[host.dataset.options]||[];
      const allHere = P.every((p,i)=> !!list(d.f,i)[k]);
      if(allHere && k < qs.length-1){
        A[d.f+'_at'] = k+1; saveAnswers();
      }
    }
    if(host) W.quiz(host);
    document.querySelectorAll('[data-widget="rank"]').forEach(el=>W.rank(el));
    buildCard(); return; }
  if(d.act==='qprev' || d.act==='qnext' || d.act==='qgo'){
    const host = document.querySelector('[data-widget="quiz"][data-field="'+d.f+'"]');
    const qs = host ? (window[host.dataset.options]||[]) : [];
    let at = +(A[d.f+'_at'] || 0);
    if(d.act==='qprev') at--; else if(d.act==='qnext') at++; else at = +d.k;
    A[d.f+'_at'] = Math.max(0, Math.min(qs.length-1, at)); saveAnswers();
    if(host) W.quiz(host); return; }
  if(d.act==='qreopen'){
    const host = document.querySelector('[data-widget="quiz"][data-field="'+d.f+'"]');
    if(host){ host.dataset.collapsed='0'; A[d.f+'_at']=0; saveAnswers(); W.quiz(host); } return; }
  if(d.act==='chk'){
    const a = arr(d.f, +d.i), k = +d.k;
    a[k] = (a[k] === d.v ? '' : d.v);
    save(d.f);
    const host = b.closest('[data-widget="checkoff"]'); if(host) W.checkoff(host);
    buildCard(); return; }
  if(d.act==='mtx'){
    const a = arr(d.f, +d.i), k = +d.k;
    a[k] = (a[k] === d.v ? '' : d.v);
    save(d.f);
    const host = b.closest('[data-widget="matrix"]'); if(host) W.matrix(host);
    buildCard(); return; }
  if(d.act==='dial'){
    setPair(d.f, +d.i, String(val(d.f,+d.i))===d.v ? '' : d.v);
    const host = b.closest('[data-widget="dial"]'); if(host) W.dial(host);
    buildCard(); return; }
  if(d.act==='fill'){
    const host = b.closest('[data-widget="listbuilder"]');
    const rows = +((host&&host.dataset.rows)||5);
    const a = arr(d.f, +d.i);
    let slot = -1;
    for(let k=0;k<rows;k++){ if(!a[k]){ slot = k; break; } }
    if(slot < 0){ return; }
    a[slot] = d.v; save(d.f);
    if(host) W.listbuilder(host);
    buildCard(); return; }
  if(d.act==='sselect'){ sset(d.f, sval(d.f)===d.v ? '' : d.v);
    const host = b.closest('[data-widget="schoice"]'); if(host) W.schoice(host);
    renderAssembled(); buildCard(); return; }
  if(d.fieldGo){
    const el = document.querySelector('[data-field="'+d.fieldGo+'"]');
    const ch = el && el.closest('.chapter');
    if(ch && CHAPTERS.length) goChapter(CHAPTERS.indexOf(ch));
    return; }
  if(d.go !== undefined){ goChapter(+d.go); return; }
  if(b.id==='resetbtn'){
    if(confirm('למחוק את התשובות של התחנה הזאת ולהתחיל אותה מחדש?')){
      localStorage.removeItem(STATION_KEY());
      (window.STATION_CLEARS||[]).forEach(f=>{ delete G[f]; }); saveGlobal();
      location.reload(); } }
});

/* ============================================================
   התקדמות, גלילה, הפעלה
   ============================================================ */
function boot(){
  load();
  renderNames();
  renderAll();

  document.querySelectorAll('a.station').forEach(a=>{
    const n = a.dataset.num; if(!n) return;
    const done = progress()[n];
    a.classList.toggle('done', !!done);
    const st = a.querySelector('.st'); if(st) st.textContent = done ? 'הושלמה' : '';
  });

  const hasChapters = chapterize();

  const io = new IntersectionObserver(es=>es.forEach(en=>{
    if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }}),
    {rootMargin:'0px 0px -12% 0px'});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));

  const rail = document.querySelector('#rail i');
  if(rail) addEventListener('scroll', ()=>{
    const h = document.documentElement.scrollHeight - innerHeight;
    rail.style.width = (h>0 ? (scrollY/h)*100 : 0) + '%';
  }, {passive:true});
}

window.LoveLang = {rz, esc, quizRank, langName, partnerLang,
  get solo(){return !!C.solo;},
  get couple(){return C;}, get answers(){return A;}, get global(){return G;}, progress};
document.readyState==='loading' ? addEventListener('DOMContentLoaded', boot) : boot();
})();
